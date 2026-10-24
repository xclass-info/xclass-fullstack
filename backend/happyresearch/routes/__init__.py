from flask import request

from ..errors import ApiError


def register_blueprints(app):
    from . import (
        admin, admin_people, auth, bookings, contact, content, files, mentor_application,
        registrations, teachers,
    )

    for module in (
        auth, teachers, mentor_application, content, registrations, bookings, admin,
        admin_people, contact, files,
    ):
        app.register_blueprint(module.bp)


def body():
    """The request's JSON object (empty dict if none)."""
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def text(data, key, required=False, max_len=20000):
    value = data.get(key)
    value = value.strip() if isinstance(value, str) else ""
    if required and not value:
        raise ApiError(400, "MISSING_FIELD", f"{key} is required.")
    if len(value) > max_len:
        raise ApiError(400, "TOO_LONG", f"{key} is too long.")
    return value


def valid_email(value):
    import re

    return bool(re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", value or ""))
