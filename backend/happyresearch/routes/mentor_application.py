"""The mentor application, from the 2-minute quick start to going live.

    quick start (no password) -> "continue" email link signs them in ->
    application saved as they go -> submit (sets password) -> admin review
    (routes/admin.py) -> onboarding: guidelines + background check -> live

Statuses live on Teacher.verificationStatus - see models.Teacher.
"""
from datetime import datetime, timedelta, timezone

from flask import Blueprint, current_app, jsonify

from .. import emails, storage
from ..errors import ApiError
from ..extensions import db, limiter
from ..models import Teacher, User, utcnow
from ..security import (
    MIN_PASSWORD_LENGTH,
    current_teacher,
    current_user,
    hash_token,
    issue_auth_token,
    random_token,
    set_password,
)
from ..serializers import teacher_json
from ..uploads import read_upload
from . import body, text, valid_email

bp = Blueprint("mentor_application", __name__, url_prefix="/api/mentor-application")

# PhD students and above only.
MENTOR_TYPES = ("phd_student", "phd_graduate", "postdoc", "faculty", "industry")
# Statuses in which the applicant can still edit their application.
EDITABLE = ("started", "changes_requested")
CONTINUE_LINK_DAYS = 14

PROFILE_FIELDS = (
    "name", "gender", "degree", "university", "researchArea", "expertise",
    "bio", "languages", "website", "mentorType",
)
MIN_BIO_CHARS = 100


def issue_continue_link(user):
    token = random_token()
    user.continueTokenHash = hash_token(token)
    user.continueTokenExpires = utcnow() + timedelta(days=CONTINUE_LINK_DAYS)
    return token


def maybe_go_live(teacher):
    """Onboarding is done once guidelines are accepted and the background
    check passed - then the mentor goes live."""
    if (
        teacher.verificationStatus == "onboarding"
        and teacher.guidelinesAcceptedAt
        and teacher.backgroundCheckStatus == "passed"
    ):
        teacher.verificationStatus = "approved"
        db.session.commit()
        emails.send_mentor_live(teacher.email, teacher.name)


def missing_items(teacher):
    """What still has to be filled in before the application can be submitted."""
    missing = []
    if not (teacher.name or "").strip():
        missing.append("name")
    if teacher.mentorType not in MENTOR_TYPES:
        missing.append("mentorType")
    for field in ("degree", "university", "researchArea"):
        if not (getattr(teacher, field) or "").strip():
            missing.append(field)
    if len((teacher.bio or "").strip()) < MIN_BIO_CHARS:
        missing.append("bio")
    if not teacher.photoURL:
        missing.append("photo")
    if not teacher.cvURL:
        missing.append("cv")
    if not (teacher.workEmailVerified or teacher.credentialURL):
        missing.append("credential")
    if teacher.workAuthorized is None:
        missing.append("workAuthorized")
    return missing


def _applicant():
    teacher = current_teacher()
    if teacher.verificationStatus not in EDITABLE:
        raise ApiError(409, "NOT_EDITABLE", "Your application has already been submitted.")
    return teacher


@bp.post("/start")
@limiter.limit("5 per minute")
def start():
    """The 2-minute quick start. Creates the account (with the password they
    chose) and emails a link that confirms the address and opens the
    application. After that they can also just log in to continue."""
    data = body()
    name = text(data, "name", required=True, max_len=200)
    email = text(data, "email", required=True, max_len=320).lower()
    if not valid_email(email):
        raise ApiError(400, "INVALID_EMAIL", "Please enter a valid email address.")
    role = data.get("mentorType")
    if role not in MENTOR_TYPES:
        raise ApiError(
            400,
            "NOT_ELIGIBLE",
            "Mentors need to be PhD students or above. We'd love to hear from you once you are!",
        )
    password = data.get("password") or ""
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ApiError(400, "WEAK_PASSWORD", "Password should be at least 6 characters.")

    user = User.query.filter_by(email=email, deletedAt=None).first()
    if user:
        teacher = db.session.get(Teacher, user.id)
        if teacher and teacher.verificationStatus in EDITABLE:
            raise ApiError(
                409,
                "APPLICATION_EXISTS",
                "You've already started an application with this email - log in to continue.",
            )
        raise ApiError(
            409, "EMAIL_IN_USE", "This email already has an account. Please log in instead."
        )

    user = User(email=email, isAdmin=email in current_app.config["ADMIN_EMAILS"])
    set_password(user, password)
    db.session.add(user)
    db.session.flush()
    teacher = Teacher(
        id=user.id,
        name=name,
        email=email,
        mentorType=role,
        university=text(data, "university", max_len=300),
        researchArea=text(data, "researchArea", max_len=300),
        website=text(data, "website", max_len=2000),
        verificationStatus="started",
        accountEmailVerified=False,
    )
    db.session.add(teacher)
    token = issue_continue_link(user)
    db.session.commit()
    emails.send_mentor_continue_link(email, name, token)
    return jsonify({"ok": True}), 201


@bp.post("/continue")
@limiter.limit("20 per minute")
def continue_application():
    """Sign in from the emailed link. Clicking it also proves they own the email."""
    token = text(body(), "token", required=True, max_len=200)
    user = User.query.filter_by(continueTokenHash=hash_token(token)).first()
    expires = user and user.continueTokenExpires
    if expires and expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if not user or not expires or expires < datetime.now(timezone.utc):
        raise ApiError(400, "INVALID_TOKEN", "This link is invalid or has expired.")
    teacher = db.session.get(Teacher, user.id)
    if not teacher:
        raise ApiError(400, "INVALID_TOKEN", "This link is invalid or has expired.")
    teacher.accountEmailVerified = True
    db.session.commit()
    from .auth import me_json

    return jsonify({"token": issue_auth_token(user), "user": me_json(user)})


@bp.get("")
def get_application():
    teacher = current_teacher()
    data = teacher_json(teacher, "owner")
    data["missing"] = missing_items(teacher)
    data["hasPassword"] = current_user().passwordAlgo is not None
    return jsonify(data)


@bp.patch("")
def save():
    """Save any part of the application (called as they type)."""
    teacher = _applicant()
    data = body()
    for key in PROFILE_FIELDS:
        if key not in data:
            continue
        value = data[key]
        value = value.strip()[:5000] if isinstance(value, str) else None
        if key == "mentorType" and value not in MENTOR_TYPES:
            raise ApiError(400, "NOT_ELIGIBLE", "Mentors need to be PhD students or above.")
        if key == "name" and not value:
            raise ApiError(400, "MISSING_FIELD", "Name is required.")
        setattr(teacher, key, value)
    if "workAuthorized" in data:
        teacher.workAuthorized = None if data["workAuthorized"] is None else bool(data["workAuthorized"])
    teacher.updatedAt = utcnow()
    db.session.commit()
    return get_application()


def _upload(folder_field, folder, allow_pdf):
    teacher = _applicant()
    data, filename, content_type = read_upload(allow_pdf=allow_pdf)
    setattr(teacher, folder_field, storage.put(storage.make_key(folder(teacher), filename), data, content_type))
    db.session.commit()
    return get_application()


@bp.post("/photo")
@limiter.limit("20 per minute")
def upload_photo():
    return _upload("photoURL", lambda t: "mentors", allow_pdf=False)


@bp.post("/cv")
@limiter.limit("20 per minute")
def upload_cv():
    return _upload("cvURL", lambda t: f"mentor-documents/{t.id}", allow_pdf=True)


@bp.post("/credential")
@limiter.limit("20 per minute")
def upload_credential():
    return _upload("credentialURL", lambda t: f"mentor-documents/{t.id}", allow_pdf=True)


@bp.post("/university-email")
@limiter.limit("5 per minute")
def send_university_email():
    teacher = _applicant()
    address = text(body(), "email", required=True, max_len=320)
    if not valid_email(address):
        raise ApiError(400, "INVALID_EMAIL", "Please enter a valid email address.")
    token = random_token()
    teacher.workEmail = address
    teacher.workEmailToken = token
    teacher.workEmailVerified = False
    db.session.commit()
    emails.send_work_email_verification(address, teacher.name, teacher.id, token)
    return get_application()


@bp.post("/submit")
@limiter.limit("5 per minute")
def submit():
    teacher = _applicant()
    user = current_user()
    data = body()
    missing = missing_items(teacher)
    if not data.get("agreeTerms"):
        missing.append("agreeTerms")
    if not data.get("consentBackgroundCheck"):
        missing.append("consentBackgroundCheck")
    password = data.get("password") or ""
    if user.passwordAlgo is None and len(password) < MIN_PASSWORD_LENGTH:
        missing.append("password")
    if missing:
        return jsonify({"error": "Please complete every step first.", "code": "INCOMPLETE", "missing": missing}), 400

    if user.passwordAlgo is None:
        set_password(user, password)
    now = utcnow()
    teacher.agreedTermsAt = now
    teacher.backgroundCheckConsentAt = now
    teacher.submittedAt = now
    teacher.verificationStatus = "submitted"
    user.continueTokenHash = None
    user.continueTokenExpires = None
    db.session.commit()

    emails.send_mentor_submitted(teacher.email, teacher.name)
    try:
        emails.send_team_new_mentor_application(teacher.name, teacher.email)
    except Exception:
        current_app.logger.exception("team notification failed")
    return get_application()


@bp.post("/accept-guidelines")
def accept_guidelines():
    teacher = current_teacher()
    if teacher.verificationStatus != "onboarding":
        raise ApiError(409, "NOT_ONBOARDING", "There's nothing to accept right now.")
    teacher.guidelinesAcceptedAt = utcnow()
    db.session.commit()
    maybe_go_live(teacher)
    return get_application()
