import base64
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from flask import current_app, request
from werkzeug.security import check_password_hash, generate_password_hash

from .errors import ApiError
from .extensions import db
from .models import Student, Teacher, User

MIN_PASSWORD_LENGTH = 6


# ── Passwords ─────────────────────────────────────────────────────────────


def set_password(user, password):
    user.passwordHash = generate_password_hash(password)
    user.passwordAlgo = "werkzeug"
    user.passwordSalt = None


def check_password(user, password):
    """True if `password` is right. Imported Firebase hashes are upgraded to
    our own format on the first successful check."""
    if user.passwordAlgo == "werkzeug":
        return check_password_hash(user.passwordHash, password)
    if user.passwordAlgo == "firebase_scrypt":
        if not _check_firebase_scrypt(password, user.passwordSalt, user.passwordHash):
            return False
        set_password(user, password)
        db.session.commit()
        return True
    return False


def _check_firebase_scrypt(password, salt_b64, hash_b64):
    """Firebase Auth's modified scrypt: scrypt-derive a key from the password,
    then AES-256-CTR encrypt the project's signer key with it. The stored hash
    is that ciphertext."""
    cfg = current_app.config
    if not cfg["FIREBASE_HASH_SIGNER_KEY"] or not salt_b64 or not hash_b64:
        return False
    salt = base64.b64decode(salt_b64) + base64.b64decode(cfg["FIREBASE_HASH_SALT_SEPARATOR"])
    n = 2 ** cfg["FIREBASE_HASH_MEM_COST"]
    r = cfg["FIREBASE_HASH_ROUNDS"]
    derived = hashlib.scrypt(
        password.encode("utf-8"), salt=salt, n=n, r=r, p=1, dklen=64,
        maxmem=256 * r * n + 1024 * 1024,
    )
    encryptor = Cipher(algorithms.AES(derived[:32]), modes.CTR(b"\x00" * 16)).encryptor()
    signer_key = base64.b64decode(cfg["FIREBASE_HASH_SIGNER_KEY"])
    computed = encryptor.update(signer_key) + encryptor.finalize()
    return hmac.compare_digest(computed, base64.b64decode(hash_b64))


# ── One-off tokens (email verification, password reset) ──────────────────


def random_token():
    return secrets.token_hex(24)


def hash_token(token):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


# ── Login tokens ──────────────────────────────────────────────────────────


def issue_auth_token(user):
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user.id,
        "tv": user.tokenVersion,
        "iat": now,
        "exp": now + timedelta(days=current_app.config["AUTH_TOKEN_DAYS"]),
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")


def current_user():
    """The User behind this request's Bearer token, or None (cached per request)."""
    if _USER_KEY not in request.environ:
        request.environ[_USER_KEY] = _user_from_token()
    return request.environ[_USER_KEY]


_USER_KEY = "happyresearch.user"


def _user_from_token():
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    try:
        payload = jwt.decode(header[7:], current_app.config["SECRET_KEY"], algorithms=["HS256"])
    except jwt.PyJWTError:
        return None
    user = db.session.get(User, payload.get("sub"))
    if user and user.tokenVersion == payload.get("tv") and not user.deletedAt:
        return user
    return None


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not current_user():
            raise ApiError(401, "UNAUTHENTICATED", "Please log in.")
        return fn(*args, **kwargs)

    return wrapper


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = current_user()
        if not user:
            raise ApiError(401, "UNAUTHENTICATED", "Please log in.")
        if not user.isAdmin:
            raise ApiError(403, "FORBIDDEN", "Admins only.")
        return fn(*args, **kwargs)

    return wrapper


def current_teacher():
    """The logged-in mentor's Teacher row (raises if not a mentor)."""
    user = current_user()
    if not user:
        raise ApiError(401, "UNAUTHENTICATED", "Please log in.")
    teacher = db.session.get(Teacher, user.id)
    if not teacher:
        raise ApiError(403, "NOT_A_MENTOR", "This account is not a mentor account.")
    if not is_verified(teacher):
        raise ApiError(403, "EMAIL_NOT_VERIFIED", "Please verify your email first.")
    return teacher


def current_live_teacher():
    """Like current_teacher, but only for mentors whose application is
    approved. Applicants can't post content or set availability until then."""
    teacher = current_teacher()
    if teacher.verificationStatus != "approved":
        raise ApiError(
            403, "NOT_LIVE", "You can do this once your mentor application is approved."
        )
    return teacher


def current_student():
    """The logged-in, verified student's Student row (raises otherwise)."""
    user = current_user()
    if not user:
        raise ApiError(401, "UNAUTHENTICATED", "Please log in.")
    student = db.session.get(Student, user.id)
    if not student:
        raise ApiError(403, "NOT_A_STUDENT", "This account is not a student account.")
    if not is_verified(student):
        raise ApiError(403, "EMAIL_NOT_VERIFIED", "Please verify your email first.")
    return student


def is_verified(account):
    # Accounts created before email verification existed have no value at
    # all - treat that as verified so nobody gets locked out.
    return account.accountEmailVerified is not False
