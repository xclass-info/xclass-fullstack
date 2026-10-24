"""Admin dashboard API. Every route requires an admin account."""
from flask import Blueprint, jsonify

from .. import emails, storage
from ..errors import ApiError
from ..extensions import db
from ..models import Registration, Research, Student, Teacher, User, utcnow
from ..security import admin_required
from ..serializers import teacher_json
from ..uploads import read_upload
from . import body, text
from .mentor_application import maybe_go_live
from .registrations import _locked_item, _seats_full, student_registrations

bp = Blueprint("admin", __name__, url_prefix="/api/admin")

EDITABLE = {"teachers": Teacher, "research": Research}
# Never editable through the generic edit form: ids, secrets, and file
# fields (photos go through the upload route below).
NOT_EDITABLE = {
    "id", "accountEmailToken", "workEmailToken", "createdAt",
    *Teacher.FILE_FIELDS,
}


def _deleted_ids():
    return db.session.query(User.id).filter(User.deletedAt.isnot(None))


def _row(collection, row_id):
    model = EDITABLE.get(collection)
    row = model and db.session.get(model, row_id)
    if not row:
        raise ApiError(404, "NOT_FOUND", "Not found.")
    return row


def _json(row):
    return teacher_json(row, "admin") if isinstance(row, Teacher) else row.to_dict()


@bp.get("/students")
@admin_required
def students():
    return jsonify([s.to_dict() for s in Student.query.filter(Student.id.notin_(_deleted_ids())).all()])


@bp.get("/students/<student_id>/registrations")
@admin_required
def student_activity(student_id):
    student = db.session.get(Student, student_id)
    if not student:
        raise ApiError(404, "NOT_FOUND", "Student not found.")
    return jsonify(student_registrations(student.email, student.id))


@bp.get("/teachers")
@admin_required
def teachers():
    rows = Teacher.query.filter(Teacher.id.notin_(_deleted_ids())).all()
    return jsonify([teacher_json(t, "admin") for t in rows])


@bp.get("/research")
@admin_required
def research():
    return jsonify([r.to_dict() for r in Research.query.all()])


@bp.get("/registrations")
@admin_required
def registrations():
    return jsonify([r.to_dict() for r in Registration.query.all()])


@bp.patch("/<collection>/<row_id>")
@admin_required
def edit(collection, row_id):
    row = _row(collection, row_id)
    # The edit form sends the whole record back; timestamps aren't editable.
    columns = {
        a.key
        for a in row.__mapper__.column_attrs
        if not isinstance(a.columns[0].type, db.DateTime)
    }
    row.apply(body(), columns - NOT_EDITABLE)
    if isinstance(row, Teacher) and row.yearsOfExperience is not None:
        row.yearsOfExperience = str(row.yearsOfExperience)
    db.session.commit()
    return jsonify(_json(row))


@bp.delete("/<collection>/<row_id>")
@admin_required
def delete(collection, row_id):
    db.session.delete(_row(collection, row_id))
    db.session.commit()
    return jsonify({"ok": True})


@bp.post("/teachers/<teacher_id>/photo")
@admin_required
def upload_photo(teacher_id):
    teacher = _row("teachers", teacher_id)
    data, filename, content_type = read_upload()
    teacher.photoURL = storage.put(
        storage.make_key("mentors", f"{teacher.id}_{filename}"), data, content_type
    )
    db.session.commit()
    return jsonify(_json(teacher))


# ── Mentor application review ────────────────────────────────────────────
# Each action emails the mentor first, so a failed send leaves the
# application unchanged and the admin can simply retry.

REVIEWABLE = ("submitted", "interview_requested", "changes_requested")


def _reviewable(teacher_id, allowed=REVIEWABLE):
    teacher = _row("teachers", teacher_id)
    if teacher.verificationStatus not in allowed:
        raise ApiError(409, "WRONG_STATUS", "This application isn't waiting for that action.")
    if not teacher.email:
        raise ApiError(400, "NO_EMAIL", "This mentor has no email address.")
    return teacher


@bp.post("/teachers/<teacher_id>/approve")
@admin_required
def approve_mentor(teacher_id):
    """Passes review. The mentor moves to onboarding (guidelines + background
    check) and goes live once both are done."""
    teacher = _reviewable(teacher_id)
    emails.send_mentor_review_passed(teacher.email, teacher.name)
    teacher.verificationStatus = "onboarding"
    teacher.reviewedAt = utcnow()
    teacher.rejectionReason = None
    db.session.commit()
    maybe_go_live(teacher)
    return jsonify(_json(teacher))


@bp.post("/teachers/<teacher_id>/request-changes")
@admin_required
def request_changes(teacher_id):
    teacher = _reviewable(teacher_id, ("submitted", "interview_requested"))
    note = text(body(), "note", required=True, max_len=5000)
    emails.send_mentor_changes_requested(teacher.email, teacher.name, note)
    teacher.verificationStatus = "changes_requested"
    teacher.adminNote = note
    teacher.reviewedAt = utcnow()
    db.session.commit()
    return jsonify(_json(teacher))


@bp.post("/teachers/<teacher_id>/request-interview")
@admin_required
def request_interview(teacher_id):
    """Optional - only when the admin wants to meet the applicant first."""
    teacher = _reviewable(teacher_id, ("submitted", "interview_requested"))
    message = text(body(), "message", required=True, max_len=5000)
    emails.send_interview_request(teacher.email, teacher.name, message)
    teacher.verificationStatus = "interview_requested"
    teacher.interviewMessage = message
    teacher.interviewRequestedAt = utcnow()
    db.session.commit()
    return jsonify(_json(teacher))


@bp.post("/teachers/<teacher_id>/decline")
@admin_required
def decline_mentor(teacher_id):
    teacher = _reviewable(teacher_id, (*REVIEWABLE, "onboarding"))
    reason = text(body(), "reason", required=True, max_len=5000)
    emails.send_mentor_declined(teacher.email, teacher.name, reason)
    teacher.verificationStatus = "declined"
    teacher.rejectionReason = reason
    teacher.reviewedAt = utcnow()
    db.session.commit()
    return jsonify(_json(teacher))


@bp.post("/teachers/<teacher_id>/background-check")
@admin_required
def record_background_check(teacher_id):
    """Record the result of the background check (for now: the admin's own
    search of the national sex-offender registry, nsopw.gov)."""
    teacher = _row("teachers", teacher_id)
    data = body()
    status = data.get("status")
    if status not in ("passed", "failed"):
        raise ApiError(400, "INVALID_STATUS", "status must be passed or failed.")
    teacher.backgroundCheckStatus = status
    teacher.backgroundCheckNote = text(data, "note", max_len=5000) or None
    teacher.backgroundCheckAt = utcnow()
    db.session.commit()
    maybe_go_live(teacher)
    return jsonify(_json(teacher))


@bp.post("/registrations/<path:reg_id>/approve")
@admin_required
def approve_registration(reg_id):
    """Re-check seats (several applications can be pending for fewer seats),
    then take the seat and approve, atomically."""
    reg = db.session.query(Registration).filter_by(id=reg_id).with_for_update().first()
    if not reg:
        raise ApiError(404, "NOT_FOUND", "Application not found.")
    if reg.status and reg.status != "pending":
        raise ApiError(409, "ALREADY_REVIEWED", "This application was already reviewed.")
    item = _locked_item(reg.kind, reg.itemId)
    if _seats_full(item):
        raise ApiError(409, "FULL", "No seats left - can't approve this application.")
    item.enrolledCount = (item.enrolledCount or 0) + 1
    reg.status = "approved"
    db.session.commit()
    return jsonify(reg.to_dict())


@bp.post("/registrations/<path:reg_id>/reject")
@admin_required
def reject_registration(reg_id):
    reg = db.session.get(Registration, reg_id)
    if not reg:
        raise ApiError(404, "NOT_FOUND", "Application not found.")
    reg.status = "rejected"
    reg.rejectionReason = text(body(), "reason", required=True, max_len=5000)
    db.session.commit()
    return jsonify(reg.to_dict())

