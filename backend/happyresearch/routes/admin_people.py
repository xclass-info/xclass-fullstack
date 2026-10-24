"""Admin dashboard: Today (what needs action), People (everyone, with account
actions), the email log, and global search. Every route requires an admin."""
from datetime import timedelta

from flask import Blueprint, jsonify, request
from sqlalchemy import func, or_

from .. import accounts, emails
from ..errors import ApiError
from ..extensions import db
from ..models import (
    Booking,
    EmailLog,
    Project,
    Registration,
    Research,
    Showcase,
    Student,
    Teacher,
    User,
    utcnow,
)
from ..security import admin_required, current_user, hash_token, random_token
from ..serializers import showcase_json, teacher_json
from . import body, text
from .mentor_application import EDITABLE, issue_continue_link
from .registrations import student_registrations

bp = Blueprint("admin_people", __name__, url_prefix="/api/admin")


def _person_summary(user, student, teacher):
    return {
        "id": user.id,
        "email": user.deletedEmail or user.email,
        "name": (teacher and teacher.name) or (student and student.name) or "",
        "isAdmin": user.isAdmin,
        "isStudent": bool(student),
        "isMentor": bool(teacher),
        "studentVerified": student.accountEmailVerified is not False if student else None,
        "mentorStatus": teacher.verificationStatus if teacher else None,
        "mentorHidden": bool(teacher and teacher.disabled),
        "createdAt": user.createdAt.isoformat() if user.createdAt else None,
        "deletedAt": user.deletedAt.isoformat() if user.deletedAt else None,
    }


def _user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        raise ApiError(404, "NOT_FOUND", "Person not found.")
    return user


@bp.get("/people")
@admin_required
def people():
    accounts.purge_expired()
    rows = (
        db.session.query(User, Student, Teacher)
        .outerjoin(Student, Student.id == User.id)
        .outerjoin(Teacher, Teacher.id == User.id)
        .order_by(User.createdAt.desc().nullslast())
        .all()
    )
    return jsonify([_person_summary(*r) for r in rows])


@bp.get("/people/<user_id>")
@admin_required
def person(user_id):
    user = _user(user_id)
    student = db.session.get(Student, user.id)
    teacher = db.session.get(Teacher, user.id)
    email = user.deletedEmail or user.email
    data = _person_summary(user, student, teacher)
    data["student"] = student.to_dict() if student else None
    data["teacher"] = teacher_json(teacher, "admin") if teacher else None
    data["registrations"] = student_registrations(email, user.id) if student else []
    data["content"] = (
        {
            "research": [r.to_dict() for r in Research.query.filter_by(teacherId=user.id)],
            "projects": [p.to_dict() for p in Project.query.filter_by(teacherId=user.id)],
            "showcase": [showcase_json(s) for s in Showcase.query.filter_by(teacherId=user.id)],
        }
        if teacher
        else None
    )
    data["bookings"] = [
        b.to_dict()
        for b in Booking.query.filter(
            or_(Booking.teacherId == user.id, func.lower(Booking.studentEmail) == email.lower())
        ).order_by(Booking.createdAt.desc().nullslast())
    ]
    addresses = {email.lower()} | ({teacher.workEmail.lower()} if teacher and teacher.workEmail else set())
    data["emails"] = [
        e.to_dict()
        for e in EmailLog.query.filter(func.lower(EmailLog.toEmail).in_(addresses))
        .order_by(EmailLog.createdAt.desc())
        .limit(50)
    ]
    if user.deletedAt:
        data["purgeAt"] = (user.deletedAt + timedelta(days=accounts.RESTORE_DAYS)).isoformat()
    return jsonify(data)


@bp.post("/people/<user_id>/delete")
@admin_required
def delete_person(user_id):
    user = _user(user_id)
    if user.id == current_user().id:
        raise ApiError(400, "CANNOT_DELETE_SELF", "You can't delete your own account.")
    if user.deletedAt:
        raise ApiError(409, "ALREADY_DELETED", "This account is already deleted.")
    # Typed confirmation: the admin re-types the person's email.
    if text(body(), "confirm", max_len=320).lower() != user.email.lower():
        raise ApiError(400, "CONFIRMATION_MISMATCH", "Type the person's email address to confirm.")
    accounts.soft_delete(user)
    return jsonify({"ok": True})


@bp.post("/people/<user_id>/restore")
@admin_required
def restore_person(user_id):
    accounts.restore(_user(user_id))
    return jsonify({"ok": True})


def _active_user(user_id):
    user = _user(user_id)
    if user.deletedAt:
        raise ApiError(409, "DELETED", "Restore this account first.")
    return user


@bp.post("/people/<user_id>/password-reset")
@admin_required
def send_password_reset(user_id):
    user = _active_user(user_id)
    token = random_token()
    user.resetTokenHash = hash_token(token)
    user.resetTokenExpires = utcnow() + timedelta(hours=1)
    db.session.commit()
    emails.send_password_reset(user.email, token)
    return jsonify({"ok": True})


@bp.post("/people/<user_id>/resend-verification")
@admin_required
def resend_verification(user_id):
    """Resend whatever this person is waiting for: a mentor applicant's
    "continue your application" link, or an account verification email."""
    user = _active_user(user_id)
    teacher = db.session.get(Teacher, user.id)
    student = db.session.get(Student, user.id)
    if teacher and teacher.verificationStatus in EDITABLE:
        token = issue_continue_link(user)
        db.session.commit()
        emails.send_mentor_continue_link(user.email, teacher.name, token)
        return jsonify({"sent": "continue_link"})
    profile, kind = (student, "student") if student else (teacher, "teacher")
    if not profile:
        raise ApiError(400, "NOTHING_TO_SEND", "This account has no student or mentor record.")
    token = random_token()
    profile.accountEmailToken = token
    profile.accountEmailVerified = False
    db.session.commit()
    emails.send_account_verification(
        user.email, profile.name, emails.account_verify_link(kind, user.id, token)
    )
    return jsonify({"sent": "verification"})


@bp.post("/people/<user_id>/mark-verified")
@admin_required
def mark_verified(user_id):
    """For when someone can't receive our emails: confirm the address by hand."""
    user = _active_user(user_id)
    for model in (Student, Teacher):
        profile = db.session.get(model, user.id)
        if profile:
            profile.accountEmailVerified = True
            profile.accountEmailToken = None
    db.session.commit()
    return jsonify({"ok": True})


@bp.get("/emails")
@admin_required
def email_log():
    q = EmailLog.query
    status = request.args.get("status")
    if status:
        q = q.filter_by(status=status)
    search = (request.args.get("q") or "").strip().lower()
    if search:
        q = q.filter(or_(func.lower(EmailLog.toEmail).contains(search), func.lower(EmailLog.subject).contains(search)))
    rows = q.order_by(EmailLog.createdAt.desc()).limit(min(request.args.get("limit", 200, type=int), 500))
    return jsonify([e.to_dict() for e in rows])


@bp.get("/today")
@admin_required
def today():
    now = utcnow()
    deleted = db.session.query(User.id).filter(User.deletedAt.isnot(None))
    teachers = Teacher.query.filter(Teacher.id.notin_(deleted))

    def brief(t):
        return {"id": t.id, "name": t.name, "status": t.verificationStatus,
                "submittedAt": t.submittedAt.isoformat() if t.submittedAt else None}

    reviews = teachers.filter(Teacher.verificationStatus.in_(("submitted", "interview_requested"))).all()
    checks = teachers.filter(
        Teacher.verificationStatus == "onboarding",
        or_(Teacher.backgroundCheckStatus.is_(None), Teacher.backgroundCheckStatus != "passed"),
    ).all()
    enrollments = Registration.query.filter_by(status="pending").order_by(Registration.createdAt).all()
    stale = Booking.query.filter(Booking.status == "pending", Booking.createdAt < now - timedelta(hours=48)).all()
    failed = EmailLog.query.filter(EmailLog.status == "failed", EmailLog.createdAt > now - timedelta(days=7)).order_by(EmailLog.createdAt.desc()).all()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    return jsonify({
        "mentorReviews": [brief(t) for t in reviews],
        "backgroundChecks": [brief(t) for t in checks],
        "enrollments": [r.to_dict() for r in enrollments],
        "staleBookings": [b.to_dict() for b in stale],
        "failedEmails": [e.to_dict() for e in failed],
        "stats": {
            "students": Student.query.filter(Student.id.notin_(deleted)).count(),
            "liveMentors": teachers.filter(Teacher.verificationStatus == "approved", Teacher.disabled.isnot(True)).count(),
            "researchPosts": Research.query.count(),
            "bookingsThisMonth": Booking.query.filter(Booking.createdAt >= month_start).count(),
            "newSignupsThisWeek": User.query.filter(User.deletedAt.is_(None), User.createdAt >= now - timedelta(days=7)).count(),
        },
    })


@bp.get("/search")
@admin_required
def search():
    q = (request.args.get("q") or "").strip().lower()
    if len(q) < 2:
        return jsonify({"people": [], "research": [], "projects": []})
    like = f"%{q}%"
    people = (
        db.session.query(User, Student, Teacher)
        .outerjoin(Student, Student.id == User.id)
        .outerjoin(Teacher, Teacher.id == User.id)
        .filter(or_(
            User.email.ilike(like), User.deletedEmail.ilike(like),
            Student.name.ilike(like), Teacher.name.ilike(like),
        ))
        .limit(8)
        .all()
    )
    return jsonify({
        "people": [_person_summary(*r) for r in people],
        "research": [{"id": r.id, "title": r.title, "teacherName": r.teacherName} for r in Research.query.filter(Research.title.ilike(like)).limit(5)],
        "projects": [{"id": p.id, "title": p.title, "teacherName": p.teacherName} for p in Project.query.filter(Project.title.ilike(like)).limit(5)],
    })
