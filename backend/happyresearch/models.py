"""Database tables.

Python attribute names deliberately match the JSON field names the frontend
has always used (they came from the old Firestore documents, e.g. `photoURL`,
`meeting_link`), while the actual Postgres column names are snake_case. That
keeps serialization a plain attribute copy - see Model.to_dict.

Ids are strings: rows migrated from Firestore keep their original document
id (so existing links like /research/<id> keep working) and new rows get a
Firestore-style random id from new_id().
"""
import secrets
import string
from datetime import date, datetime, timezone

from sqlalchemy import JSON

from .extensions import db

_ID_ALPHABET = string.ascii_letters + string.digits


def new_id():
    return "".join(secrets.choice(_ID_ALPHABET) for _ in range(20))


def utcnow():
    return datetime.now(timezone.utc)


def col(name, type_, **kw):
    return db.Column(name, type_, **kw)


class Model(db.Model):
    __abstract__ = True

    # Fields never sent to the browser (tokens, hashes).
    PRIVATE = ()

    def to_dict(self, exclude=()):
        out = {}
        for attr in self.__mapper__.column_attrs:
            key = attr.key
            if key in self.PRIVATE or key in exclude:
                continue
            value = getattr(self, key)
            # Like a Firestore document, an unset field is simply absent.
            if value is None:
                continue
            if isinstance(value, (datetime, date)):
                value = _iso(value)
            out[key] = value
        return out

    def apply(self, data, allowed):
        """Copy the allowed keys present in `data` onto this row."""
        for key in allowed:
            if key in data:
                setattr(self, key, data[key])


def _iso(value):
    if isinstance(value, datetime) and value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.isoformat()


class User(Model):
    """A login. Whether it's a student and/or mentor is decided by having a
    row in `students` / `teachers` with the same id, just like the old
    Firebase setup (auth user + students/{uid} or teachers/{uid} doc)."""

    __tablename__ = "users"
    PRIVATE = (
        "passwordHash",
        "passwordAlgo",
        "passwordSalt",
        "tokenVersion",
        "resetTokenHash",
        "resetTokenExpires",
        "continueTokenHash",
        "continueTokenExpires",
    )

    id = col("id", db.String(64), primary_key=True, default=new_id)
    email = col("email", db.String(320), unique=True, nullable=False, index=True)
    # passwordAlgo: "werkzeug" for passwords set here, "firebase_scrypt" for
    # hashes imported from Firebase Auth (rehashed on first login), or None
    # when no hash was imported - that account must reset its password.
    passwordHash = col("password_hash", db.Text)
    passwordAlgo = col("password_algo", db.String(32))
    passwordSalt = col("password_salt", db.Text)
    isAdmin = col("is_admin", db.Boolean, nullable=False, default=False)
    # Bumped on password change/reset so older login tokens stop working.
    tokenVersion = col("token_version", db.Integer, nullable=False, default=0)
    resetTokenHash = col("reset_token_hash", db.String(64), index=True)
    resetTokenExpires = col("reset_token_expires", db.DateTime(timezone=True))
    # Mentor applicants sign in from a "continue your application" email link
    # (no password until they submit) - see routes/mentor_application.py.
    continueTokenHash = col("continue_token_hash", db.String(64), index=True)
    continueTokenExpires = col("continue_token_expires", db.DateTime(timezone=True))
    # Soft delete: a deleted account can't log in and is hidden everywhere,
    # but an admin can restore it for 30 days (then it's purged). Its email
    # is parked in deletedEmail so the address is free to sign up again.
    deletedAt = col("deleted_at", db.DateTime(timezone=True), index=True)
    deletedEmail = col("deleted_email", db.String(320))
    createdAt = col("created_at", db.DateTime(timezone=True), default=utcnow)


class Student(Model):
    __tablename__ = "students"
    PRIVATE = ("accountEmailToken",)

    id = col("id", db.String(64), primary_key=True)
    name = col("name", db.Text)
    email = col("email", db.String(320), index=True)
    grade = col("grade", db.Text)
    phone = col("phone", db.Text)
    # None = account predates email verification; treated as verified.
    accountEmailVerified = col("account_email_verified", db.Boolean)
    accountEmailToken = col("account_email_token", db.String(128))
    createdAt = col("created_at", db.DateTime(timezone=True), default=utcnow)


class Teacher(Model):
    """A mentor - from first application step to live profile.

    verificationStatus is the mentor's place in the application pipeline:
      started -> submitted -> [changes_requested | interview_requested]
      -> onboarding -> approved (live: public profile, can be booked)
    plus declined. Only "approved" (and not disabled) mentors are public.
    """

    __tablename__ = "teachers"
    PRIVATE = ("accountEmailToken", "workEmailToken")
    # Visible to anyone (public mentor listings / profile pages).
    PUBLIC = (
        "id", "name", "gender", "degree", "major", "expertise", "researchArea",
        "bio", "university", "yearsOfExperience", "languages", "website",
        "mentorType", "verificationStatus", "photoURL", "disabled", "projects",
        "createdAt", "updatedAt",
    )
    # What a mentor may edit on their own record.
    PROFILE_FIELDS = (
        "gender", "degree", "expertise", "researchArea", "bio", "university",
        "yearsOfExperience", "languages", "website",
    )
    # Uploaded files (stored as object-storage keys, served via /files).
    FILE_FIELDS = ("photoURL", "transcriptURL", "degreeCertificateURL", "cvURL", "credentialURL")

    id = col("id", db.String(64), primary_key=True)
    name = col("name", db.Text)
    email = col("email", db.String(320), index=True)
    gender = col("gender", db.Text)
    degree = col("degree", db.Text)
    major = col("major", db.Text)
    expertise = col("expertise", db.Text)
    researchArea = col("research_area", db.Text)
    bio = col("bio", db.Text)
    university = col("university", db.Text)
    yearsOfExperience = col("years_of_experience", db.Text)
    languages = col("languages", db.Text)
    website = col("website", db.Text)
    photoURL = col("photo_url", db.Text)
    disabled = col("disabled", db.Boolean)
    # Legacy array field present on some old mentor records.
    projects = col("projects", JSON)

    mentorType = col("mentor_type", db.String(32))
    verificationStatus = col("verification_status", db.String(32), index=True)
    rejectionReason = col("rejection_reason", db.Text)
    transcriptURL = col("transcript_url", db.Text)
    degreeCertificateURL = col("degree_certificate_url", db.Text)
    universityProfileURL = col("university_profile_url", db.Text)
    workEmail = col("work_email", db.String(320))
    workEmailToken = col("work_email_token", db.String(128))
    workEmailVerified = col("work_email_verified", db.Boolean)
    submittedAt = col("submitted_at", db.DateTime(timezone=True))

    # Mentor application (see routes/mentor_application.py).
    cvURL = col("cv_url", db.Text)
    # Proof of PhD status when no university email is verified: enrollment
    # letter, transcript or diploma.
    credentialURL = col("credential_url", db.Text)
    # Legacy: an early version of the application asked for a project idea.
    # Applicants no longer write anything about projects before approval.
    projectIdea = col("project_idea", JSON)
    workAuthorized = col("work_authorized", db.Boolean)
    agreedTermsAt = col("agreed_terms_at", db.DateTime(timezone=True))
    backgroundCheckConsentAt = col("background_check_consent_at", db.DateTime(timezone=True))
    # Admin review.
    adminNote = col("admin_note", db.Text)  # what to fix (changes_requested)
    reviewedAt = col("reviewed_at", db.DateTime(timezone=True))
    # Set when an admin asks for an interview; says how to schedule it.
    interviewMessage = col("interview_message", db.Text)
    interviewRequestedAt = col("interview_requested_at", db.DateTime(timezone=True))
    # Onboarding: both are needed before going live.
    backgroundCheckStatus = col("background_check_status", db.String(16))  # passed | failed
    backgroundCheckNote = col("background_check_note", db.Text)
    backgroundCheckAt = col("background_check_at", db.DateTime(timezone=True))
    guidelinesAcceptedAt = col("guidelines_accepted_at", db.DateTime(timezone=True))
    lastReminderAt = col("last_reminder_at", db.DateTime(timezone=True))

    accountEmailVerified = col("account_email_verified", db.Boolean)
    accountEmailToken = col("account_email_token", db.String(128))
    createdAt = col("created_at", db.DateTime(timezone=True), default=utcnow)
    updatedAt = col("updated_at", db.DateTime(timezone=True))


class Availability(Model):
    __tablename__ = "availability"

    id = col("id", db.String(64), primary_key=True, default=new_id)
    teacherId = col("teacher_id", db.String(64), nullable=False, index=True)
    date = col("date", db.String(10))
    time = col("time", db.String(5))
    duration = col("duration", db.Integer)
    price = col("price", db.Float)
    booked = col("booked", db.Boolean, nullable=False, default=False)
    createdAt = col("created_at", db.DateTime(timezone=True), default=utcnow)


class Booking(Model):
    __tablename__ = "bookings"

    id = col("id", db.String(64), primary_key=True, default=new_id)
    teacherId = col("teacher_id", db.String(64), index=True)
    teacherName = col("teacher_name", db.Text)
    slotId = col("slot_id", db.String(64))
    studentName = col("student_name", db.Text)
    studentEmail = col("student_email", db.String(320))
    date = col("date", db.String(10))
    time = col("time", db.String(5))
    duration = col("duration", db.Integer)
    status = col("status", db.String(32), index=True)
    meeting_link = col("meeting_link", db.Text)
    # Legacy fields from an older booking flow, kept for history.
    classTitle = col("class_title", db.Text)
    classId = col("class_id", db.String(64))
    paid = col("paid", db.Boolean)
    amount = col("amount", db.Float)
    bookedAt = col("booked_at", db.DateTime(timezone=True))
    createdAt = col("created_at", db.DateTime(timezone=True), default=utcnow)


class _Item(Model):
    """Shared columns for research posts and projects."""

    __abstract__ = True

    id = col("id", db.String(64), primary_key=True, default=new_id)
    teacherId = col("teacher_id", db.String(64), index=True)
    teacherName = col("teacher_name", db.Text)
    title = col("title", db.Text)
    details = col("details", db.Text)
    seats = col("seats", db.Integer)
    enrolledCount = col("enrolled_count", db.Integer, nullable=False, default=0)
    deliverable = col("deliverable", db.Text)
    difficulty = col("difficulty", db.Text)
    gradeLevel = col("grade_level", db.Text)
    prerequisites = col("prerequisites", JSON)
    scheduleStartDate = col("schedule_start_date", db.Text)
    scheduleTime = col("schedule_time", db.Text)
    scheduleLocation = col("schedule_location", db.Text)
    stage = col("stage", db.String(32))
    createdAt = col("created_at", db.DateTime(timezone=True), default=utcnow)
    updatedAt = col("updated_at", db.DateTime(timezone=True))


class Research(_Item):
    __tablename__ = "research"
    FORM_FIELDS = (
        "title", "idea", "impact", "details", "seats", "type", "deliverable",
        "difficulty", "gradeLevel", "prerequisites", "scheduleStartDate",
        "scheduleTime", "scheduleLocation",
    )

    idea = col("idea", db.Text)
    impact = col("impact", db.Text)
    type = col("type", db.Text)
    # "published" | "disabled" (admin can hide a post).
    status = col("status", db.String(32), index=True)


class Project(_Item):
    __tablename__ = "projects"
    FORM_FIELDS = (
        "title", "description", "learning", "details", "seats", "deliverable",
        "gradeLevel", "difficulty", "prerequisites", "scheduleStartDate",
        "scheduleTime", "scheduleLocation",
    )

    description = col("description", db.Text)
    learning = col("learning", db.Text)
    status = col("status", db.String(32))


class Showcase(Model):
    __tablename__ = "showcase"
    FORM_FIELDS = ("title", "studentName", "outputType", "summary", "outputUrl")

    id = col("id", db.String(64), primary_key=True, default=new_id)
    teacherId = col("teacher_id", db.String(64), index=True)
    teacherName = col("teacher_name", db.Text)
    title = col("title", db.Text)
    studentName = col("student_name", db.Text)
    outputType = col("output_type", db.Text)
    summary = col("summary", db.Text)
    outputUrl = col("output_url", db.Text)
    fileUrl = col("file_url", db.Text)
    fileType = col("file_type", db.String(16))
    createdAt = col("created_at", db.DateTime(timezone=True), default=utcnow)
    updatedAt = col("updated_at", db.DateTime(timezone=True))


class Registration(Model):
    """A student's application for a research post or project. The id is
    `<itemId>_<url-encoded lowercase email>`, so one email can only hold one
    live application per item (same scheme as the old Firestore doc id)."""

    __tablename__ = "registrations"

    id = col("id", db.String(512), primary_key=True)
    kind = col("kind", db.String(16))
    itemId = col("item_id", db.String(64), index=True)
    itemTitle = col("item_title", db.Text)
    teacherId = col("teacher_id", db.String(64), index=True)
    studentName = col("student_name", db.Text)
    studentEmail = col("student_email", db.String(320), index=True)
    studentEmailLower = col("student_email_lower", db.String(320), index=True)
    studentUid = col("student_uid", db.String(64), index=True)
    # None = predates the review step; treated as approved.
    status = col("status", db.String(16), index=True)
    rejectionReason = col("rejection_reason", db.Text)
    createdAt = col("created_at", db.DateTime(timezone=True), default=utcnow)


class StoredFile(Model):
    """An uploaded file's bytes, when files are kept in Postgres (no S3
    bucket configured) - see storage.py."""

    __tablename__ = "stored_files"

    key = col("key", db.String(512), primary_key=True)
    contentType = col("content_type", db.String(255), nullable=False)
    size = col("size", db.Integer, nullable=False)
    data = col("data", db.LargeBinary, nullable=False)
    createdAt = col("created_at", db.DateTime(timezone=True), default=utcnow)


class EmailLog(Model):
    """One row per email the site tried to send (see emails.send). Only
    metadata - never the body, which can contain sign-in links."""

    __tablename__ = "email_log"

    id = col("id", db.String(64), primary_key=True, default=new_id)
    toEmail = col("to_email", db.String(320), nullable=False, index=True)
    subject = col("subject", db.Text)
    kind = col("kind", db.String(64))
    # sent | failed | suppressed (email sending switched off, e.g. locally)
    status = col("status", db.String(16), nullable=False)
    error = col("error", db.Text)
    createdAt = col("created_at", db.DateTime(timezone=True), default=utcnow, index=True)


ITEM_MODELS = {"research": Research, "project": Project}
