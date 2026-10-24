"""Accounts: sign up, log in, password reset, email verification."""
from datetime import datetime, timedelta, timezone

from flask import Blueprint, current_app, jsonify

from .. import emails
from ..errors import ApiError
from ..extensions import db, limiter
from ..models import Student, Teacher, User, utcnow
from ..security import (
    MIN_PASSWORD_LENGTH,
    check_password,
    current_user,
    hash_token,
    issue_auth_token,
    login_required,
    random_token,
    set_password,
)
from ..serializers import teacher_json
from . import body, text, valid_email

bp = Blueprint("auth", __name__, url_prefix="/api/auth")

PROFILE_MODELS = {"student": Student, "teacher": Teacher}


def me_json(user):
    student = db.session.get(Student, user.id)
    teacher = db.session.get(Teacher, user.id)
    return {
        "uid": user.id,
        "email": user.email,
        "isAdmin": user.isAdmin,
        "student": student.to_dict() if student else None,
        "teacher": teacher_json(teacher, "owner") if teacher else None,
    }


def _find_user(email):
    return User.query.filter_by(email=email.strip().lower(), deletedAt=None).first()


@bp.post("/register")
@limiter.limit("5 per minute")
def register():
    data = body()
    kind = data.get("kind")
    if kind == "teacher":
        # Mentors apply through the mentor application instead.
        raise ApiError(400, "USE_MENTOR_APPLICATION", "Please apply at /become-a-mentor.")
    if kind not in PROFILE_MODELS:
        raise ApiError(400, "INVALID_KIND", "kind must be student or teacher.")
    name = text(data, "name", required=True, max_len=200)
    email = text(data, "email", required=True, max_len=320).lower()
    password = data.get("password") or ""
    if not valid_email(email):
        raise ApiError(400, "INVALID_EMAIL", "Please enter a valid email address.")
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ApiError(400, "WEAK_PASSWORD", "Password should be at least 6 characters.")
    if _find_user(email):
        raise ApiError(409, "EMAIL_IN_USE", "This email is already registered.")

    user = User(email=email, isAdmin=email in current_app.config["ADMIN_EMAILS"])
    set_password(user, password)
    db.session.add(user)
    db.session.flush()

    token = random_token()
    if kind == "student":
        profile = Student(
            id=user.id,
            name=name,
            email=email,
            grade=text(data, "grade", max_len=50),
            phone=text(data, "phone", max_len=50),
        )
    else:
        profile = Teacher(id=user.id, name=name, email=email, verificationStatus="incomplete")
    profile.accountEmailToken = token
    profile.accountEmailVerified = False
    db.session.add(profile)
    db.session.commit()

    # The account exists either way; the page tells them to use "Resend
    # Verification Email" if this didn't go out.
    email_sent = True
    try:
        emails.send_account_verification(
            email, name, emails.account_verify_link(kind, user.id, token)
        )
    except Exception:
        current_app.logger.exception("verification email failed")
        email_sent = False
    return jsonify({"uid": user.id, "emailSent": email_sent}), 201


@bp.post("/login")
@limiter.limit("10 per minute")
def login():
    data = body()
    user = _find_user(text(data, "email", max_len=320))
    password = data.get("password") or ""
    if user and user.passwordAlgo is None:
        # Migrated account with no imported password hash.
        raise ApiError(
            409,
            "PASSWORD_RESET_REQUIRED",
            "Please reset your password to continue - use \"Forgot password?\".",
        )
    if not user or not check_password(user, password):
        raise ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password.")
    return jsonify({"token": issue_auth_token(user), "user": me_json(user)})


@bp.get("/me")
@login_required
def me():
    return jsonify(me_json(current_user()))


@bp.post("/forgot-password")
@limiter.limit("5 per minute")
def forgot_password():
    email = text(body(), "email", required=True, max_len=320)
    if not valid_email(email):
        raise ApiError(400, "INVALID_EMAIL", "Please enter a valid email address.")
    user = _find_user(email)
    # Same response whether or not the account exists, so this can't be used
    # to find out who has an account.
    if user:
        token = random_token()
        user.resetTokenHash = hash_token(token)
        user.resetTokenExpires = utcnow() + timedelta(hours=1)
        db.session.commit()
        emails.send_password_reset(user.email, token)
    return jsonify({"ok": True})


@bp.post("/reset-password")
@limiter.limit("10 per minute")
def reset_password():
    data = body()
    token = text(data, "token", required=True, max_len=200)
    password = data.get("password") or ""
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ApiError(400, "WEAK_PASSWORD", "Password should be at least 6 characters.")
    user = User.query.filter_by(resetTokenHash=hash_token(token)).first()
    expires = user and user.resetTokenExpires
    if expires and expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if not user or not expires or expires < datetime.now(timezone.utc):
        raise ApiError(400, "INVALID_TOKEN", "This reset link is invalid or has expired.")
    set_password(user, password)
    user.resetTokenHash = None
    user.resetTokenExpires = None
    user.tokenVersion += 1
    db.session.commit()
    return jsonify({"ok": True})


@bp.post("/resend-verification")
@limiter.limit("5 per minute")
def resend_verification():
    data = body()
    kind = data.get("kind")
    if kind not in PROFILE_MODELS:
        raise ApiError(400, "INVALID_KIND", "kind must be student or teacher.")
    user = _find_user(text(data, "email", max_len=320))
    if not user or not check_password(user, data.get("password") or ""):
        raise ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password.")
    profile = db.session.get(PROFILE_MODELS[kind], user.id)
    if not profile:
        raise ApiError(404, "NOT_FOUND", "No account of that type for this email.")
    token = random_token()
    profile.accountEmailToken = token
    profile.accountEmailVerified = False
    db.session.commit()
    emails.send_account_verification(
        user.email, profile.name, emails.account_verify_link(kind, user.id, token)
    )
    return jsonify({"ok": True})


@bp.post("/verify-email")
@limiter.limit("20 per minute")
def verify_email():
    data = body()
    model = PROFILE_MODELS.get(data.get("kind"))
    uid = text(data, "uid", max_len=64)
    token = text(data, "token", max_len=200)
    profile = model and uid and token and db.session.get(model, uid)
    if not profile:
        return jsonify({"status": "invalid"})
    if profile.accountEmailVerified:
        return jsonify({"status": "success"})
    if not profile.accountEmailToken or profile.accountEmailToken != token:
        return jsonify({"status": "invalid"})
    profile.accountEmailVerified = True
    profile.accountEmailToken = None
    db.session.commit()
    return jsonify({"status": "success"})
