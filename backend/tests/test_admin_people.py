from datetime import timedelta

import pytest

from happyresearch.extensions import db
from happyresearch.models import Booking, EmailLog, Research, Student, Teacher, User, utcnow

from .conftest import login, make_user


def _admin(client):
    make_user("admin@example.com", admin=True)
    return login(client, "admin@example.com")


def test_people_list_and_detail(client):
    s = make_user("s@example.com", student=True, name="Stu Dent")
    t = make_user("t@example.com", teacher=True, name="Dr. Tea")
    admin = _admin(client)
    people = {p["email"]: p for p in client.get("/api/admin/people", headers=admin).json}
    assert people["s@example.com"]["isStudent"] and people["s@example.com"]["name"] == "Stu Dent"
    assert people["t@example.com"]["isMentor"] and people["t@example.com"]["mentorStatus"] == "approved"
    assert people["admin@example.com"]["isAdmin"]

    db.session.add(Research(id="r1", teacherId=t.id, title="Ocean", seats=1, status="published"))
    db.session.add(Booking(id="b1", teacherId=t.id, studentEmail="S@example.com", status="pending"))
    db.session.commit()
    detail = client.get(f"/api/admin/people/{t.id}", headers=admin).json
    assert detail["content"]["research"][0]["title"] == "Ocean"
    assert detail["bookings"][0]["id"] == "b1"
    # The student sees the booking they made too (matched by email).
    assert client.get(f"/api/admin/people/{s.id}", headers=admin).json["bookings"][0]["id"] == "b1"
    assert client.get("/api/admin/people", headers=login(client, "s@example.com")).status_code == 403


def test_delete_and_restore(client):
    t = make_user("t@example.com", teacher=True)
    admin = _admin(client)
    old_session = login(client, "t@example.com")

    bad = client.post(f"/api/admin/people/{t.id}/delete", json={"confirm": "wrong"}, headers=admin)
    assert bad.json["code"] == "CONFIRMATION_MISMATCH"
    assert client.post(f"/api/admin/people/{t.id}/delete", json={"confirm": "T@example.com"}, headers=admin).status_code == 200

    # Locked out and hidden everywhere.
    assert client.get("/api/auth/me", headers=old_session).status_code == 401
    assert client.post("/api/auth/login", json={"email": "t@example.com", "password": "secret123"}).status_code == 401
    assert client.get("/api/teachers").json == []
    assert client.get(f"/api/teachers/{t.id}").status_code == 404
    listed = {p["email"]: p for p in client.get("/api/admin/people", headers=admin).json}
    assert listed["t@example.com"]["deletedAt"]
    assert "purgeAt" in client.get(f"/api/admin/people/{t.id}", headers=admin).json

    # Restore brings it all back.
    assert client.post(f"/api/admin/people/{t.id}/restore", headers=admin).status_code == 200
    login(client, "t@example.com")
    assert len(client.get("/api/teachers").json) == 1


def test_deleted_email_is_free_again_but_then_cannot_restore(client):
    s = make_user("s@example.com", student=True)
    admin = _admin(client)
    client.post(f"/api/admin/people/{s.id}/delete", json={"confirm": "s@example.com"}, headers=admin)
    res = client.post("/api/auth/register", json={"kind": "student", "name": "New", "email": "s@example.com", "password": "secret123"})
    assert res.status_code == 201
    assert client.post(f"/api/admin/people/{s.id}/restore", headers=admin).json["code"] == "EMAIL_IN_USE"


def test_cannot_delete_yourself(client):
    admin = _admin(client)
    me = User.query.filter_by(email="admin@example.com").one()
    res = client.post(f"/api/admin/people/{me.id}/delete", json={"confirm": "admin@example.com"}, headers=admin)
    assert res.json["code"] == "CANNOT_DELETE_SELF"


def test_purge_after_30_days(client):
    t = make_user("t@example.com", teacher=True)
    db.session.add(Research(id="r1", teacherId=t.id, title="R", seats=1, status="published"))
    db.session.commit()
    admin = _admin(client)
    client.post(f"/api/admin/people/{t.id}/delete", json={"confirm": "t@example.com"}, headers=admin)
    user = db.session.get(User, t.id)
    user.deletedAt = utcnow() - timedelta(days=31)
    db.session.commit()
    client.get("/api/admin/people", headers=admin)  # purges on open
    db.session.expire_all()
    assert db.session.get(User, t.id) is None and db.session.get(Teacher, t.id) is None
    assert db.session.get(Research, "r1") is None


def test_email_log_resend_and_mark_verified(client, outbox):
    s = make_user("s@example.com", student=True)
    student = db.session.get(Student, s.id)
    student.accountEmailVerified = False
    db.session.commit()
    admin = _admin(client)

    assert client.post(f"/api/admin/people/{s.id}/resend-verification", headers=admin).json["sent"] == "verification"
    assert client.post(f"/api/admin/people/{s.id}/password-reset", headers=admin).status_code == 200
    log = client.get("/api/admin/emails", headers=admin).json
    assert [e["kind"] for e in log] == ["password_reset", "account_verification"]
    assert all(e["status"] == "suppressed" for e in log)  # sending is off in tests
    assert len(client.get(f"/api/admin/people/{s.id}", headers=admin).json["emails"]) == 2

    client.post(f"/api/admin/people/{s.id}/mark-verified", headers=admin)
    assert db.session.get(Student, s.id).accountEmailVerified is True


def test_failed_email_is_logged_and_shows_on_today(app, client, monkeypatch):
    from happyresearch import emails

    admin = _admin(client)

    def boom(msg):
        raise RuntimeError("SMTP down")

    monkeypatch.setattr(emails.mail, "send", boom)
    with pytest.raises(RuntimeError):  # in tests Flask re-raises instead of returning a 500
        client.post("/api/contact", json={"name": "V", "email": "v@example.com", "message": "hello there"})
    failed = EmailLog.query.filter_by(status="failed").one()
    assert "SMTP down" in failed.error
    assert client.get("/api/admin/today", headers=admin).json["failedEmails"][0]["toEmail"] == failed.toEmail


def test_today_and_search(client):
    make_user("t@example.com", teacher=True, name="Dr. Pending", verificationStatus="submitted")
    make_user("s@example.com", student=True, name="Ann Search")
    admin = _admin(client)
    today = client.get("/api/admin/today", headers=admin).json
    assert today["mentorReviews"][0]["name"] == "Dr. Pending"
    assert today["stats"]["students"] == 1
    found = client.get("/api/admin/search?q=ann", headers=admin).json
    assert [p["email"] for p in found["people"]] == ["s@example.com"]
