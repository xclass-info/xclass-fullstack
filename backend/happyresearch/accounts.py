"""Deleting accounts: soft delete (restorable for 30 days), restore, and the
permanent purge afterwards."""
from datetime import timedelta

from sqlalchemy import or_

from .errors import ApiError
from .extensions import db
from .models import (
    Availability,
    Booking,
    Project,
    Registration,
    Research,
    Showcase,
    Student,
    Teacher,
    User,
    utcnow,
)

RESTORE_DAYS = 30


def soft_delete(user):
    """The account stops working at once (can't log in, hidden everywhere)
    but nothing is removed yet. The email is parked so the address can be
    used to sign up again straight away."""
    user.deletedEmail = user.email
    user.email = f"deleted-{user.id}@deleted.invalid"
    user.deletedAt = utcnow()
    user.tokenVersion += 1  # log out every session
    user.resetTokenHash = None
    user.continueTokenHash = None
    db.session.commit()


def restore(user):
    if not user.deletedAt:
        return
    if User.query.filter(User.email == user.deletedEmail, User.id != user.id).first():
        raise ApiError(
            409, "EMAIL_IN_USE", "Someone has signed up with this email since - it can't be restored."
        )
    user.email = user.deletedEmail
    user.deletedEmail = None
    user.deletedAt = None
    db.session.commit()


def purge(user):
    """Permanently remove an account and everything it owns."""
    uid = user.id
    email = (user.deletedEmail or user.email or "").lower()

    item_ids = [
        r.id
        for model in (Research, Project)
        for r in db.session.query(model.id).filter(model.teacherId == uid)
    ]
    Registration.query.filter(
        or_(
            Registration.teacherId == uid,
            Registration.itemId.in_(item_ids),
            Registration.studentUid == uid,
            Registration.studentEmailLower == email,
        )
    ).delete(synchronize_session=False)
    for model in (Research, Project, Showcase, Availability, Booking):
        model.query.filter(model.teacherId == uid).delete(synchronize_session=False)
    Student.query.filter_by(id=uid).delete()
    Teacher.query.filter_by(id=uid).delete()
    db.session.delete(user)
    db.session.commit()


def purge_expired():
    cutoff = utcnow() - timedelta(days=RESTORE_DAYS)
    expired = User.query.filter(User.deletedAt.isnot(None), User.deletedAt < cutoff).all()
    for user in expired:
        purge(user)
    return len(expired)
