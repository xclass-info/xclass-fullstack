import io
import re
from datetime import timedelta

from happyresearch.extensions import db
from happyresearch.models import Research, Teacher, User, utcnow

from .conftest import login, make_user

BASE = "/api/mentor-application"


def _continue_token(outbox):
    return re.search(r"/mentor/continue\?token=([0-9a-f]+)", outbox[-1].html).group(1)


def _start(client, outbox, email="mentor@example.com", role="phd_graduate"):
    res = client.post(
        f"{BASE}/start",
        json={"name": "Ada Lovelace", "email": email, "mentorType": role,
              "university": "MIT", "researchArea": "Computing", "website": "https://scholar.example"},
    )
    assert res.status_code in (200, 201), res.json
    res = client.post(f"{BASE}/continue", json={"token": _continue_token(outbox)})
    assert res.status_code == 200, res.json
    return {"Authorization": f"Bearer {res.json['token']}"}


def _upload(client, headers, path, name="doc.pdf", data=b"%PDF-1.4", ctype="application/pdf"):
    res = client.post(
        f"{BASE}/{path}", data={"file": (io.BytesIO(data), name, ctype)},
        headers=headers, content_type="multipart/form-data",
    )
    assert res.status_code == 200, res.json
    return res.json


def _complete(client, headers):
    client.patch(BASE, json={
        "degree": "Doctor of Philosophy (PhD)",
        "bio": "I study computing and love helping students do real research. " * 3,
        "workAuthorized": True,
    }, headers=headers)
    _upload(client, headers, "photo", "me.png", b"\x89PNG", "image/png")
    _upload(client, headers, "cv")
    _upload(client, headers, "credential")


def test_quick_start_rejects_below_phd(client, outbox):
    res = client.post(f"{BASE}/start", json={"name": "M", "email": "m@example.com", "mentorType": "masters"})
    assert res.json["code"] == "NOT_ELIGIBLE" and not outbox


def test_full_pipeline_to_live(client, outbox):
    headers = _start(client, outbox)
    app_ = client.get(BASE, headers=headers).json
    assert app_["verificationStatus"] == "started" and app_["hasPassword"] is False
    assert {"photo", "cv", "credential", "bio"} <= set(app_["missing"])
    # Nothing about projects/research can be written before approval.
    client.patch(BASE, json={"projectIdea": {"title": "Sneaky"}}, headers=headers)
    assert "projectIdea" not in client.get(BASE, headers=headers).json

    # Not public while applying.
    uid = app_["id"]
    assert client.get(f"/api/teachers/{uid}").status_code == 404
    assert all(t["id"] != uid for t in client.get("/api/teachers").json)

    _complete(client, headers)
    assert client.get(BASE, headers=headers).json["missing"] == []

    # Submitting needs the agreements and a password.
    res = client.post(f"{BASE}/submit", json={"agreeTerms": True}, headers=headers)
    assert res.json["code"] == "INCOMPLETE"
    assert {"consentBackgroundCheck", "password"} <= set(res.json["missing"])
    outbox.clear()
    res = client.post(f"{BASE}/submit", json={"agreeTerms": True, "consentBackgroundCheck": True, "password": "secret123"}, headers=headers)
    assert res.json["verificationStatus"] == "submitted"
    assert {m.recipients[0] for m in outbox} == {"mentor@example.com", "happyprogramming.us@gmail.com"}
    # No more edits once submitted; normal password login works now.
    assert client.patch(BASE, json={"bio": "x"}, headers=headers).json["code"] == "NOT_EDITABLE"
    mentor = login(client, "mentor@example.com")

    make_user("admin@example.com", admin=True)
    admin = login(client, "admin@example.com")
    # Admin sees private documents through signed links.
    detail = next(t for t in client.get("/api/admin/teachers", headers=admin).json if t["id"] == uid)
    assert "sig=" in detail["cvURL"] and "sig=" in detail["credentialURL"]

    # Request changes -> mentor edits and resubmits.
    client.post(f"/api/admin/teachers/{uid}/request-changes", json={"note": "Please upload a clearer CV."}, headers=admin)
    assert client.get(BASE, headers=mentor).json["adminNote"] == "Please upload a clearer CV."
    _upload(client, mentor, "cv")
    assert client.post(f"{BASE}/submit", json={"agreeTerms": True, "consentBackgroundCheck": True}, headers=mentor).json["verificationStatus"] == "submitted"

    # Optional interview, then pass review -> onboarding.
    client.post(f"/api/admin/teachers/{uid}/request-interview", json={"message": "Book a slot: link"}, headers=admin)
    assert client.get(BASE, headers=mentor).json["interviewMessage"] == "Book a slot: link"
    assert client.post(f"/api/admin/teachers/{uid}/approve", headers=admin).json["verificationStatus"] == "onboarding"

    # Not approved yet: no posts, availability or dashboard profile edits.
    assert client.post("/api/research", json={"title": "Too early", "seats": 1}, headers=mentor).json["code"] == "NOT_LIVE"
    assert client.post("/api/teachers/me/availability", json={"date": "2026-12-01", "time": "10:00"}, headers=mentor).json["code"] == "NOT_LIVE"
    assert client.patch("/api/teachers/me", json={"bio": "x"}, headers=mentor).json["code"] == "NOT_LIVE"

    # Live only after both onboarding steps.
    client.post(f"/api/admin/teachers/{uid}/background-check", json={"status": "passed", "note": "NSOPW clear"}, headers=admin)
    assert db.session.get(Teacher, uid).verificationStatus == "onboarding"
    outbox.clear()
    assert client.post(f"{BASE}/accept-guidelines", headers=mentor).json["verificationStatus"] == "approved"
    assert outbox[0].subject == "You're live on HappyResearch!"
    assert client.get(f"/api/teachers/{uid}").status_code == 200
    # Live mentors can post.
    post = client.post("/api/research", json={"title": "First post", "seats": 1}, headers=mentor)
    assert post.status_code == 201
    assert client.get(f"/api/research/{post.json['id']}").status_code == 200


def test_restarting_with_same_email_resends_link(client, outbox):
    _start(client, outbox)
    res = client.post(f"{BASE}/start", json={"name": "Ada", "email": "MENTOR@example.com", "mentorType": "faculty"})
    assert res.json["resumed"] is True and len(outbox) == 2
    make_user("stu@example.com", student=True)
    res = client.post(f"{BASE}/start", json={"name": "S", "email": "stu@example.com", "mentorType": "faculty"})
    assert res.json["code"] == "EMAIL_IN_USE"


def test_continue_link_expires(client, outbox):
    client.post(f"{BASE}/start", json={"name": "A", "email": "a@example.com", "mentorType": "postdoc"})
    token = _continue_token(outbox)
    user = User.query.filter_by(email="a@example.com").one()
    user.continueTokenExpires = utcnow() - timedelta(minutes=1)
    db.session.commit()
    assert client.post(f"{BASE}/continue", json={"token": token}).json["code"] == "INVALID_TOKEN"


def test_admin_actions_only_in_right_status(client, outbox):
    headers = _start(client, outbox)
    uid = client.get(BASE, headers=headers).json["id"]
    make_user("admin@example.com", admin=True)
    admin = login(client, "admin@example.com")
    # Can't approve an application that hasn't been submitted.
    assert client.post(f"/api/admin/teachers/{uid}/approve", headers=admin).json["code"] == "WRONG_STATUS"
    assert client.post(f"/api/admin/teachers/{uid}/approve", headers=headers).status_code == 403


def test_bookings_and_applications_need_a_live_mentor(client):
    t = make_user("t@example.com", teacher=True, verificationStatus="onboarding")
    db.session.add(Research(id="r1", teacherId=t.id, title="R", seats=1, status="published"))
    db.session.commit()
    make_user("s@example.com", student=True)
    res = client.post("/api/registrations", json={"kind": "research", "itemId": "r1"}, headers=login(client, "s@example.com"))
    assert res.status_code == 404


def test_reminder_command(app, client, outbox):
    client.post(f"{BASE}/start", json={"name": "A", "email": "a@example.com", "mentorType": "postdoc"})
    teacher = Teacher.query.filter_by(email="a@example.com").one()
    teacher.createdAt = utcnow() - timedelta(days=4)
    db.session.commit()
    runner = app.test_cli_runner()
    assert "1 reminder" in runner.invoke(args=["send-application-reminders"]).output
    assert outbox[-1].subject == "Finish your HappyResearch mentor application"
    assert "0 reminder" in runner.invoke(args=["send-application-reminders"]).output


def test_background_check_note_is_admin_only(client):
    t = make_user("t@example.com", teacher=True, verificationStatus="onboarding")
    teacher = db.session.get(Teacher, t.id)
    teacher.backgroundCheckNote = "internal"
    db.session.commit()
    assert "backgroundCheckNote" not in client.get(BASE, headers=login(client, "t@example.com")).json
