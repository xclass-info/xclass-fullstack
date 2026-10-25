"""Mentors: public listings/profiles (live mentors only), the mentor's own
profile, university-email verification links, and availability slots. The
application itself is in mentor_application.py."""
from flask import Blueprint, jsonify

from ..errors import ApiError
from ..extensions import db, limiter
from ..models import Availability, Teacher, User, utcnow
from ..security import current_live_teacher, current_teacher, current_user
from ..serializers import rows, teacher_json
from . import body, text

bp = Blueprint("teachers", __name__, url_prefix="/api/teachers")

MENTOR_TYPES = ("phd_student", "phd_graduate", "faculty")


# ── Public ────────────────────────────────────────────────────────────────


def _deleted_user_ids():
    return db.session.query(User.id).filter(User.deletedAt.isnot(None))


def live_teachers():
    """Mentors the public can see: live, not hidden, account not deleted."""
    return Teacher.query.filter(
        Teacher.verificationStatus == "approved",
        Teacher.disabled.isnot(True),
        Teacher.id.notin_(_deleted_user_ids()),
    )


def is_live(teacher):
    if not teacher or teacher.verificationStatus != "approved" or teacher.disabled:
        return False
    user = db.session.get(User, teacher.id)
    return not (user and user.deletedAt)


def can_see_mentor(teacher):
    """Applicants aren't public; they and admins can still see their record."""
    user = current_user()
    return is_live(teacher) or (user and (user.isAdmin or user.id == teacher.id))


@bp.get("")
def list_teachers():
    return jsonify([teacher_json(t) for t in live_teachers().all()])


@bp.get("/<teacher_id>")
def get_teacher(teacher_id):
    teacher = db.session.get(Teacher, teacher_id)
    if not teacher or not can_see_mentor(teacher):
        raise ApiError(404, "NOT_FOUND", "Mentor not found.")
    return jsonify(teacher_json(teacher))


@bp.get("/<teacher_id>/availability")
def public_availability(teacher_id):
    slots = Availability.query.filter_by(teacherId=teacher_id).all()
    return jsonify(rows(slots))


@bp.post("/verify-work-email")
@limiter.limit("20 per minute")
def verify_work_email():
    data = body()
    uid = text(data, "uid", max_len=64)
    token = text(data, "token", max_len=200)
    teacher = uid and token and db.session.get(Teacher, uid)
    if not teacher:
        return jsonify({"status": "invalid"})
    if teacher.workEmailVerified:
        return jsonify({"status": "success"})
    if not teacher.workEmailToken or teacher.workEmailToken != token:
        return jsonify({"status": "invalid"})
    teacher.workEmailVerified = True
    teacher.workEmailToken = None
    db.session.commit()
    return jsonify({"status": "success"})


# ── The logged-in mentor ──────────────────────────────────────────────────


@bp.get("/me")
def get_me():
    return jsonify(teacher_json(current_teacher(), "owner"))


@bp.patch("/me")
def update_me():
    teacher = current_live_teacher()
    data = body()
    teacher.apply(
        {k: (v.strip() if isinstance(v, str) else v) for k, v in data.items()},
        Teacher.PROFILE_FIELDS,
    )
    if "yearsOfExperience" in data and data["yearsOfExperience"] is not None:
        teacher.yearsOfExperience = str(data["yearsOfExperience"])
    teacher.updatedAt = utcnow()
    db.session.commit()
    return jsonify(teacher_json(teacher, "owner"))


# ── Availability ──────────────────────────────────────────────────────────


@bp.get("/me/availability")
def my_availability():
    teacher = current_live_teacher()
    return jsonify(rows(Availability.query.filter_by(teacherId=teacher.id).all()))


@bp.post("/me/availability")
def add_slot():
    teacher = current_live_teacher()
    data = body()
    date = text(data, "date", required=True, max_len=10)
    time = text(data, "time", required=True, max_len=5)
    try:
        duration = int(data.get("duration") or 60)
        price = float(data.get("price") or 0)
    except (TypeError, ValueError):
        raise ApiError(400, "INVALID_NUMBER", "Duration and price must be numbers.")
    slot = Availability(
        teacherId=teacher.id, date=date, time=time, duration=duration, price=price, booked=False
    )
    db.session.add(slot)
    db.session.commit()
    return jsonify(slot.to_dict()), 201


@bp.delete("/me/availability/<slot_id>")
def delete_slot(slot_id):
    teacher = current_live_teacher()
    slot = db.session.get(Availability, slot_id)
    if not slot or slot.teacherId != teacher.id:
        raise ApiError(404, "NOT_FOUND", "Slot not found.")
    if slot.booked:
        raise ApiError(409, "SLOT_BOOKED", "Booked slots can't be removed.")
    db.session.delete(slot)
    db.session.commit()
    return jsonify({"ok": True})
