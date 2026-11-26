"""1-on-1 session bookings: a visitor requests a mentor's slot, the mentor
approves (we create the video meeting room) or rejects it."""
from flask import Blueprint, current_app, jsonify, request

from .. import daily, emails
from ..errors import ApiError
from ..extensions import db, limiter
from ..models import Availability, Booking, Teacher
from ..security import current_teacher
from . import body, text, valid_email
from .teachers import is_live

bp = Blueprint("bookings", __name__, url_prefix="/api")


@bp.post("/bookings")
@limiter.limit("5 per minute")
def request_booking():
    data = body()
    teacher = db.session.get(Teacher, text(data, "teacherId", required=True, max_len=64))
    slot = db.session.get(Availability, text(data, "slotId", required=True, max_len=64))
    if not is_live(teacher) or not slot or slot.teacherId != teacher.id:
        raise ApiError(404, "NOT_FOUND", "That time slot no longer exists.")
    if slot.booked:
        raise ApiError(409, "SLOT_BOOKED", "That time slot was just booked.")
    student_name = text(data, "studentName", required=True, max_len=200)
    student_email = text(data, "studentEmail", required=True, max_len=320)
    if not valid_email(student_email):
        raise ApiError(400, "INVALID_EMAIL", "Invalid email")
    booking = Booking(
        teacherId=teacher.id,
        teacherName=teacher.name,
        slotId=slot.id,
        studentName=student_name,
        studentEmail=student_email,
        date=slot.date,
        time=slot.time,
        duration=slot.duration,
        status="pending",
    )
    db.session.add(booking)
    db.session.commit()
    return jsonify({"id": booking.id}), 201


@bp.get("/teachers/me/bookings")
def my_bookings():
    teacher = current_teacher()
    q = Booking.query.filter_by(teacherId=teacher.id)
    status = request.args.get("status")
    if status:
        q = q.filter_by(status=status)
    return jsonify([b.to_dict() for b in q.all()])


def _my_booking(booking_id):
    teacher = current_teacher()
    booking = db.session.get(Booking, booking_id)
    if not booking or booking.teacherId != teacher.id:
        raise ApiError(404, "NOT_FOUND", "Booking not found.")
    return teacher, booking


@bp.post("/bookings/<booking_id>/approve")
def approve_booking(booking_id):
    """Create the video meeting room (Daily.co), record its link, mark the
    slot booked and email both sides. The room is made first, so a failure
    leaves the booking pending rather than approved without a link."""
    teacher, booking = _my_booking(booking_id)
    if booking.status != "pending":
        raise ApiError(409, "ALREADY_REVIEWED", "This booking was already handled.")
    booking.meeting_link = daily.create_room()
    booking.status = "approved"
    slot = db.session.get(Availability, booking.slotId) if booking.slotId else None
    if slot:
        slot.booked = True
    db.session.commit()

    emails.send_booking_confirmation(booking.studentEmail, booking.studentName, booking)
    if teacher.email:
        try:
            emails.send_booking_confirmation(teacher.email, teacher.name, booking)
        except Exception:
            current_app.logger.exception("mentor booking email failed")
    return jsonify(booking.to_dict())


@bp.post("/bookings/<booking_id>/reject")
def reject_booking(booking_id):
    _, booking = _my_booking(booking_id)
    booking.status = "rejected"
    db.session.commit()
    return jsonify(booking.to_dict())
