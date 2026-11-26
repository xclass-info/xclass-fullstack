"""Every email the site sends, via Gmail SMTP (Flask-Mail)."""
from datetime import datetime
from html import escape

from flask import current_app
from flask_mail import Message

from .extensions import db, mail
from .models import EmailLog, new_id, utcnow

# Site palette (see src/index.css): sage page, deep green text, terracotta
# buttons and accents.
_BG = "#eef2ea"
_INK = "#22372c"
_MUTED = "#4f6357"
_ACCENT = "#b4502f"
_RULE = "#dce6d6"
_SERIF = "Georgia, 'Times New Roman', serif"
_FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif"

_SIGNOFF = f"""
  <p style="margin:28px 0 0;">Best,<br/>The HappyResearch team</p>
"""


def _wrap(body):
    # Table layout + inline styles: the only thing every email client
    # (Gmail, Outlook, phones) reliably centres and sizes the same way.
    return f"""
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:{_BG}; padding:32px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
        <tr>
          <td style="padding:0 8px 18px; font-family:{_SERIF}; font-size:24px; font-weight:bold; color:{_INK};">
            <a href="https://happyresearch.org" style="color:{_INK}; text-decoration:none;">HappyResearch</a>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff; border-radius:20px; padding:20px 36px 32px; font-family:{_FONT}; font-size:16px; line-height:1.6; color:{_INK};">
{body}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 8px 0; font-family:{_FONT}; font-size:13px; line-height:1.5; color:{_MUTED};">
            HappyResearch &middot; Real research for curious students, guided by PhD mentors.<br/>
            <a href="https://happyresearch.org" style="color:{_MUTED};">happyresearch.org</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
"""


def _button(href, label):
    return f"""
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
    <tr>
      <td style="background:{_ACCENT}; border-radius:999px;">
        <a href="{escape(href)}" style="display:inline-block; padding:14px 28px; font-family:{_FONT}; font-size:16px; font-weight:bold; color:#ffffff; text-decoration:none; border-radius:999px;">{escape(label)} &rarr;</a>
      </td>
    </tr>
  </table>"""


def _note(html, accent=_ACCENT):
    """A quoted block: a team note, a decline reason, an interview message."""
    return f'<div style="background:{_BG}; border-left:4px solid {accent}; border-radius:8px; padding:14px 18px; margin:18px 0;">{html}</div>'


def _small(text):
    return f'<p style="font-size:14px; line-height:1.55; color:{_MUTED};">{text}</p>'


def send(subject, to, html, reply_to=None, kind=None):
    """Send one email and record the attempt in the email log (admin
    dashboard). Raises if sending fails, after logging the failure."""
    msg = Message(subject, recipients=[to], reply_to=reply_to)
    msg.html = html
    status, error = "sent", None
    if current_app.config.get("MAIL_SUPPRESS_SEND"):
        status = "suppressed"
    try:
        mail.send(msg)
    except Exception as exc:
        status, error = "failed", str(exc)[:1000]
        raise
    finally:
        _log(to, subject, kind, status, error)


def _log(to, subject, kind, status, error):
    # Own connection, so logging never commits (or rolls back) the caller's
    # unfinished database changes.
    try:
        with db.engine.begin() as conn:
            conn.execute(
                EmailLog.__table__.insert().values(
                    id=new_id(), to_email=to, subject=subject, kind=kind,
                    status=status, error=error, created_at=utcnow(),
                )
            )
    except Exception:
        current_app.logger.exception("could not write email log")


def _frontend(path):
    return current_app.config["FRONTEND_URL"] + path


def send_account_verification(to_email, to_name, verify_link):
    send(
        "Welcome to HappyResearch – Verify Your Email",
        to_email,
        _wrap(f"""
  <p>Hello {escape(to_name or "there")},</p>
  <p>Welcome to HappyResearch!</p>
  <p>Thank you for joining our community of curious minds, aspiring researchers, and academic mentors.</p>
  <p>To complete your registration and activate your account, please verify your email address by clicking the button below.</p>
  {_button(verify_link, "Verify My Email Address")}
  {_small("For your security, this verification link can only be used once.")}
  {_small("If you did not create a HappyResearch account, you can safely ignore this email.")}
  <p>We look forward to supporting your research journey!</p>
  {_SIGNOFF}"""),
        kind="account_verification",
    )


def account_verify_link(kind, uid, token):
    return _frontend(f"/verify-account-email?kind={kind}&uid={uid}&token={token}")


def send_password_reset(to_email, token):
    link = _frontend(f"/reset-password?token={token}")
    send(
        "Reset your HappyResearch password",
        to_email,
        _wrap(f"""
  <p>Hello,</p>
  <p>We received a request to reset the password for your HappyResearch account.</p>
  {_button(link, "Choose a New Password")}
  {_small("This link expires in 1 hour and can only be used once.")}
  {_small("If you didn't ask to reset your password, you can safely ignore this email - your password won't change.")}
  {_SIGNOFF}"""),
        kind="password_reset",
    )


def send_work_email_verification(to_email, mentor_name, uid, token):
    link = _frontend(f"/verify-mentor-email?uid={uid}&token={token}")
    send(
        "Verify your university email for HappyResearch",
        to_email,
        _wrap(f"""
  <p>Hi {escape(mentor_name or "there")},</p>
  <p>Click the button below to confirm this is your university email. It verifies your academic status for your HappyResearch mentor application.</p>
  {_button(link, "Verify University Email")}
  {_small("If you didn't request this, you can ignore this email.")}
  {_SIGNOFF}"""),
        kind="work_email_verification",
    )


# ── Mentor application ───────────────────────────────────────────────────


def mentor_continue_link(token):
    return _frontend(f"/mentor/continue?token={token}")


def send_mentor_continue_link(to_email, mentor_name, token, reminder=False):
    intro = (
        "Your HappyResearch mentor application is waiting for you - it only takes about 10 minutes to finish, and everything you've entered so far is saved."
        if reminder
        else "Thanks for signing up to mentor with HappyResearch! Please confirm your email address to continue your application. It takes about 10 minutes, and your progress is saved as you go."
    )
    send(
        "Finish your HappyResearch mentor application" if reminder else "Confirm your email to continue your HappyResearch mentor application",
        to_email,
        _wrap(f"""
  <p>Hi {escape(mentor_name or "there")},</p>
  <p>{intro}</p>
  {_button(mentor_continue_link(token), "Confirm Email & Continue" if not reminder else "Continue My Application")}
  {_small("This link signs you in and works for 14 days - don't forward it. You can also log in any time at Mentor Login with your email and password.")}
  {_SIGNOFF}"""),
        reply_to=current_app.config["TEAM_INBOX"],
        kind="mentor_continue_link",
    )


def send_mentor_submitted(to_email, mentor_name):
    send(
        "We received your HappyResearch mentor application",
        to_email,
        _wrap(f"""
  <p>Hi {escape(mentor_name or "there")},</p>
  <p>Thank you for applying to mentor with HappyResearch! We review applications within about 3 business days and will email you as soon as there's an update.</p>
  {_button(_frontend("/mentor/application"), "View My Application")}
  {_SIGNOFF}"""),
        reply_to=current_app.config["TEAM_INBOX"],
        kind="mentor_submitted",
    )


def send_team_new_mentor_application(mentor_name, mentor_email):
    send(
        f"New mentor application: {mentor_name}",
        current_app.config["TEAM_INBOX"],
        _wrap(f"""
  <p><strong>{escape(mentor_name or "")}</strong> &lt;{escape(mentor_email)}&gt; submitted a mentor application.</p>
  {_button(_frontend("/admin"), "Review in Admin")}"""),
        reply_to=mentor_email,
        kind="team_new_mentor_application",
    )


def send_mentor_changes_requested(to_email, mentor_name, note):
    body = escape(note).replace("\n", "<br/>")
    send(
        "Your HappyResearch mentor application needs a small update",
        to_email,
        _wrap(f"""
  <p>Hi {escape(mentor_name or "there")},</p>
  <p>Thanks for applying! Before we can continue, please update the following:</p>
  {_note(body)}
  {_button(_frontend("/mentor/application"), "Update My Application")}
  {_SIGNOFF}"""),
        reply_to=current_app.config["TEAM_INBOX"],
        kind="mentor_changes_requested",
    )


def send_mentor_review_passed(to_email, mentor_name):
    send(
        "Good news about your HappyResearch mentor application",
        to_email,
        _wrap(f"""
  <p>Hi {escape(mentor_name or "there")},</p>
  <p>Great news - your application has passed our review! Two last steps before your profile goes live:</p>
  <ol>
    <li><strong>Read and accept the Mentor Guidelines</strong> (about 5 minutes).</li>
    <li><strong>Background check</strong> - we run this for every mentor before they work with students. You don't need to do anything for it right now.</li>
  </ol>
  {_button(_frontend("/mentor/application"), "Finish Onboarding")}
  {_SIGNOFF}"""),
        reply_to=current_app.config["TEAM_INBOX"],
        kind="mentor_review_passed",
    )


def send_mentor_declined(to_email, mentor_name, reason):
    body = escape(reason).replace("\n", "<br/>")
    send(
        "Your HappyResearch mentor application",
        to_email,
        _wrap(f"""
  <p>Hi {escape(mentor_name or "there")},</p>
  <p>Thank you for your interest in mentoring with HappyResearch. After reviewing your application, we're not able to move forward at this time.</p>
  {_note(body, "#c9d4c3")}
  <p>We truly appreciate the time you took to apply.</p>
  {_SIGNOFF}"""),
        reply_to=current_app.config["TEAM_INBOX"],
        kind="mentor_declined",
    )


def send_mentor_live(to_email, mentor_name):
    send(
        "You're live on HappyResearch!",
        to_email,
        _wrap(f"""
  <p>Hi {escape(mentor_name or "there")},</p>
  <p>Welcome aboard - your mentor profile is now live, and students can find you and apply for your research. A great next step is posting your first research project from your dashboard.</p>
  {_button(_frontend("/teacher/dashboard"), "Go to My Dashboard")}
  {_SIGNOFF}"""),
        reply_to=current_app.config["TEAM_INBOX"],
        kind="mentor_live",
    )


def send_interview_request(to_email, mentor_name, message):
    body = escape(message).replace("\n", "<br/>")
    send(
        "HappyResearch mentor application - let's schedule a short interview",
        to_email,
        _wrap(f"""
  <p>Hi {escape(mentor_name or "there")},</p>
  <p>Thank you for applying to mentor with HappyResearch! Before we finish reviewing your application, we'd like to meet you in a short interview.</p>
  {_note(body)}
  {_button(_frontend("/teacher/dashboard"), "View My Application")}
  {_small("You can reply to this email with any questions.")}
  {_SIGNOFF}"""),
        reply_to=current_app.config["TEAM_INBOX"],
        kind="interview_request",
    )


def _nice_date(value):
    """'2026-11-27' -> 'Friday, November 27, 2026' (unchanged if unparseable)."""
    try:
        d = datetime.strptime(value or "", "%Y-%m-%d")
    except ValueError:
        return value
    return f"{d:%A, %B} {d.day}, {d.year}"


def _nice_time(value):
    """'16:00' -> '4:00 PM' (unchanged if unparseable)."""
    try:
        t = datetime.strptime(value or "", "%H:%M")
    except ValueError:
        return value
    return f"{t.hour % 12 or 12}:{t:%M %p}"


def send_booking_confirmation(to_email, to_name, booking):
    rows = [
        ("Mentor", booking.teacherName),
        ("Student", booking.studentName),
        ("Date", _nice_date(booking.date)),
        ("Time", _nice_time(booking.time)),
        ("Duration", f"{booking.duration} minutes" if booking.duration else None),
    ]
    details = "".join(
        f"<tr><td style='padding:8px 16px 8px 0; color:{_MUTED}; border-bottom:1px solid {_RULE};'>{label}</td><td style='padding:8px 0; border-bottom:1px solid {_RULE};'><strong>{escape(str(v))}</strong></td></tr>"
        for label, v in rows
        if v
    )
    send(
        "Your HappyResearch session is confirmed",
        to_email,
        _wrap(f"""
  <p>Hi {escape(to_name or "there")},</p>
  <p>Your 1-on-1 session has been confirmed.</p>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:16px; margin:16px 0; border-collapse:collapse;">{details}</table>
  {_button(booking.meeting_link, "Join the Session") if booking.meeting_link else ""}
  {_small("Use the same link at the scheduled time. It works in any modern browser - no download needed.")}
  {_SIGNOFF}"""),
        kind="booking_confirmation",
    )


def send_team_message(subject, from_name, from_email, message):
    """Contact Us / On-demand Learning submissions, to the team inbox. Reply
    goes straight to the visitor."""
    body = escape(message).replace("\n", "<br/>")
    send(
        subject or "New message from happyresearch.org",
        current_app.config["TEAM_INBOX"],
        _wrap(f"""
  <p><strong>From:</strong> {escape(from_name)} &lt;{escape(from_email)}&gt;</p>
  <p><strong>Subject:</strong> {escape(subject or "")}</p>
  <hr style="border:none; border-top:1px solid {_RULE}; margin:18px 0;"/>
  <p>{body}</p>"""),
        reply_to=from_email,
        kind="team_message",
    )


def _program_words(kind):
    return ("research topic", "/research") if kind == "research" else ("project", "/projects")


def send_application_approved(to_email, student_name, kind, title, mentor_name=None):
    noun, _ = _program_words(kind)
    with_mentor = f" with {escape(mentor_name)}" if mentor_name else ""
    send(
        f"You're in: {title}",
        to_email,
        _wrap(f"""
  <p>Hi {escape(student_name or "there")},</p>
  <p>Good news! Your application for the {noun} <strong>{escape(title or "")}</strong>{with_mentor} has been accepted.</p>
  <p>You can see it, along with the program details, on your dashboard.</p>
  {_button(_frontend("/student/dashboard"), "Go to My Dashboard")}
  {_small("Questions? Just reply to this email.")}
  {_SIGNOFF}"""),
        reply_to=current_app.config["TEAM_INBOX"],
        kind="application_approved",
    )


def send_application_declined(to_email, student_name, kind, title, reason):
    noun, path = _program_words(kind)
    body = escape(reason or "").replace("\n", "<br/>")
    send(
        f"About your application: {title}",
        to_email,
        _wrap(f"""
  <p>Hi {escape(student_name or "there")},</p>
  <p>Thank you for applying for the {noun} <strong>{escape(title or "")}</strong>. We're not able to accept this application, and here's why:</p>
  {_note(body, "#c9d4c3")}
  <p>You're welcome to apply for other research topics and projects.</p>
  {_button(_frontend(path), "See Open Programs")}
  {_small("Questions? Just reply to this email.")}
  {_SIGNOFF}"""),
        reply_to=current_app.config["TEAM_INBOX"],
        kind="application_declined",
    )
