import io
from urllib.parse import quote

from happyresearch.extensions import db
from happyresearch.models import Availability, Booking, Research, Teacher

from .conftest import login, make_user


def _research(client, headers, **extra):
    payload = {
        "title": "Ocean study", "idea": "i", "impact": "x", "seats": 1, "type": "t",
        "deliverable": "paper", "difficulty": "easy", "gradeLevel": "9-12",
        "prerequisites": [" Bio ", "", "Chem"], "scheduleStartDate": "2026-11-01",
        "scheduleTime": "10:00", "scheduleLocation": "Online",
    }
    payload.update(extra)
    res = client.post("/api/research", json=payload, headers=headers)
    assert res.status_code == 201, res.json
    return res.json


def test_public_teacher_hides_private_fields(client):
    t = make_user("t@example.com", teacher=True)
    teacher = db.session.get(Teacher, t.id)
    teacher.workEmailToken = "secret"
    teacher.transcriptURL = "s3:mentor-documents/x/doc.pdf"
    db.session.commit()
    data = client.get(f"/api/teachers/{t.id}").json
    for field in ("email", "workEmailToken", "accountEmailToken", "transcriptURL"):
        assert field not in data
    assert data["name"] == "Dr. T"
    listed = client.get("/api/teachers").json
    assert "email" not in listed[0]


def test_mentor_content_crud_and_ownership(client):
    a = make_user("a@example.com", teacher=True, name="Dr. A")
    make_user("b@example.com", teacher=True)
    ha, hb = login(client, "a@example.com"), login(client, "b@example.com")

    item = _research(client, ha)
    assert item["teacherName"] == "Dr. A" and item["teacherId"] == a.id
    assert item["status"] == "published" and item["stage"] == "active"
    assert item["prerequisites"] == ["Bio", "Chem"]

    assert client.patch(f"/api/research/{item['id']}", json={"title": "x"}, headers=hb).status_code == 404
    assert client.delete(f"/api/research/{item['id']}", headers=hb).status_code == 404
    assert client.post("/api/research", json={"title": "x"}).status_code == 401

    res = client.patch(f"/api/research/{item['id']}", json={"stage": "completed", "teacherId": "evil"}, headers=ha)
    assert res.json["stage"] == "completed" and res.json["teacherId"] == a.id

    listed = client.get("/api/research?status=published").json
    assert [r["id"] for r in listed] == [item["id"]]
    assert client.delete(f"/api/research/{item['id']}", headers=ha).status_code == 200


def test_registration_seats_and_admin_review(client, outbox):
    make_user("t@example.com", teacher=True)
    make_user("s1@example.com", student=True, name="S1")
    make_user("s2@example.com", student=True, name="S2")
    make_user("admin@example.com", admin=True)
    item = _research(client, login(client, "t@example.com"), seats=1)
    h1, h2 = login(client, "s1@example.com"), login(client, "s2@example.com")
    hadmin = login(client, "admin@example.com")

    # Both can apply - applying doesn't take the seat.
    assert client.post("/api/registrations", json={"kind": "research", "itemId": item["id"]}, headers=h1).status_code == 201
    assert client.post("/api/registrations", json={"kind": "research", "itemId": item["id"]}, headers=h2).status_code == 201
    dup = client.post("/api/registrations", json={"kind": "research", "itemId": item["id"]}, headers=h1)
    assert dup.json["code"] == "DUPLICATE"

    regs = client.get("/api/admin/registrations", headers=hadmin).json
    by_email = {r["studentEmail"]: quote(r["id"], safe="") for r in regs}
    approved = client.post(f"/api/admin/registrations/{by_email['s1@example.com']}/approve", headers=hadmin)
    assert approved.status_code == 200 and approved.json["emailSent"] is True
    assert outbox[-1].recipients == ["s1@example.com"] and "accepted" in outbox[-1].html
    assert "Dr. T" in outbox[-1].html and outbox[-1].reply_to == "happyprogramming.us@gmail.com"
    sent_before_full = len(outbox)
    full = client.post(f"/api/admin/registrations/{by_email['s2@example.com']}/approve", headers=hadmin)
    assert full.json["code"] == "FULL" and len(outbox) == sent_before_full
    assert db.session.get(Research, item["id"]).enrolledCount == 1

    # Student dashboard shows the item and mentor.
    rows = client.get("/api/students/me/registrations", headers=h1).json
    assert rows[0]["reg"]["status"] == "approved" and rows[0]["mentorName"] == "Dr. T"

    # Rejected -> can reapply.
    rejected = client.post(f"/api/admin/registrations/{by_email['s2@example.com']}/reject", json={"reason": "Not a <b>fit</b> right now."}, headers=hadmin)
    assert rejected.json["emailSent"] is True
    assert outbox[-1].recipients == ["s2@example.com"] and "Not a &lt;b&gt;fit&lt;/b&gt; right now." in outbox[-1].html
    # Re-rejecting (e.g. editing the reason) doesn't email again.
    count = len(outbox)
    client.post(f"/api/admin/registrations/{by_email['s2@example.com']}/reject", json={"reason": "Seats filled up."}, headers=hadmin)
    assert len(outbox) == count
    again = client.post("/api/registrations", json={"kind": "research", "itemId": item["id"]}, headers=h2)
    assert again.json["code"] == "FULL"


def test_registration_list_only_for_owner(client):
    make_user("t@example.com", teacher=True)
    make_user("o@example.com", teacher=True)
    item = _research(client, login(client, "t@example.com"))
    assert client.get(f"/api/registrations?itemId={item['id']}", headers=login(client, "t@example.com")).status_code == 200
    assert client.get(f"/api/registrations?itemId={item['id']}", headers=login(client, "o@example.com")).status_code == 403


def test_admin_routes_require_admin(client):
    make_user("s@example.com", student=True)
    h = login(client, "s@example.com")
    assert client.get("/api/admin/students", headers=h).status_code == 403
    assert client.get("/api/admin/students").status_code == 401


def test_admin_edit_cannot_touch_secrets(client):
    t = make_user("t@example.com", teacher=True)
    make_user("admin@example.com", admin=True)
    h = login(client, "admin@example.com")
    res = client.patch(
        f"/api/admin/teachers/{t.id}",
        json={"name": "New", "workEmailToken": "x", "photoURL": "http://evil", "createdAt": "2020-01-01", "disabled": True},
        headers=h,
    )
    assert res.status_code == 200
    teacher = db.session.get(Teacher, t.id)
    assert teacher.name == "New" and teacher.disabled is True
    assert teacher.workEmailToken is None and teacher.photoURL is None


def test_booking_flow(client, outbox, monkeypatch):
    from happyresearch import daily
    monkeypatch.setattr(daily, "create_room", lambda: "https://x.daily.co/room")
    t = make_user("t@example.com", teacher=True)
    ht = login(client, "t@example.com")
    slot = client.post("/api/teachers/me/availability", json={"date": "2026-11-02", "time": "09:00", "duration": 30, "price": 0}, headers=ht).json
    res = client.post("/api/bookings", json={"teacherId": t.id, "slotId": slot["id"], "studentName": "Kid", "studentEmail": "kid@example.com"})
    assert res.status_code == 201
    booking_id = res.json["id"]
    pending = client.get("/api/teachers/me/bookings?status=pending", headers=ht).json
    assert pending[0]["date"] == "2026-11-02" and pending[0]["duration"] == 30

    # The meeting link comes from the server; one sent by the browser is ignored.
    res = client.post(f"/api/bookings/{booking_id}/approve", json={"meeting_link": "https://evil.example"}, headers=ht)
    assert res.json["status"] == "approved" and res.json["meeting_link"] == "https://x.daily.co/room"
    # Approving twice doesn't make a second room.
    assert client.post(f"/api/bookings/{booking_id}/approve", headers=ht).json["code"] == "ALREADY_REVIEWED"
    assert db.session.get(Availability, slot["id"]).booked is True
    assert {m.recipients[0] for m in outbox} == {"kid@example.com", "t@example.com"}
    assert "https://x.daily.co/room" in outbox[0].html
    # Booked slots can't be removed or re-booked.
    assert client.delete(f"/api/teachers/me/availability/{slot['id']}", headers=ht).status_code == 409
    again = client.post("/api/bookings", json={"teacherId": t.id, "slotId": slot["id"], "studentName": "K", "studentEmail": "k@example.com"})
    assert again.json["code"] == "SLOT_BOOKED"


def test_showcase_file_must_be_own_upload(client):
    make_user("t@example.com", teacher=True)
    make_user("o@example.com", teacher=True)
    ht, ho = login(client, "t@example.com"), login(client, "o@example.com")
    up = client.post(
        "/api/showcase/files",
        data={"file": (io.BytesIO(b"\x89PNG"), "pic.png", "image/png")},
        headers=ht,
        content_type="multipart/form-data",
    ).json
    base = {"title": "T", "studentName": "S", "outputType": "paper", "summary": "s"}
    bad = client.post("/api/showcase", json={**base, "fileUrl": up["ref"], "fileType": "image"}, headers=ho)
    assert bad.json["code"] == "INVALID_FILE"
    ok = client.post("/api/showcase", json={**base, "fileUrl": up["ref"], "fileType": "image"}, headers=ht)
    assert ok.json["fileUrl"] == up["url"]
    assert client.get(up["url"].replace("http://api.test", "")).status_code == 200
    # Editing with the URL echoed back keeps the file.
    edited = client.patch(f"/api/showcase/{ok.json['id']}", json={**base, "title": "T2", "fileUrl": ok.json["fileUrl"]}, headers=ht)
    assert edited.json["fileUrl"] == up["url"] and edited.json["title"] == "T2"


def test_contact_goes_to_team_inbox(client, outbox):
    res = client.post("/api/contact", json={"name": "V", "email": "v@example.com", "subject": "Hi", "message": "<b>hello</b>"})
    assert res.status_code == 200
    assert outbox[0].recipients == ["happyprogramming.us@gmail.com"]
    assert outbox[0].subject == "Hi" and outbox[0].reply_to == "v@example.com"
    assert "<b>hello</b>" not in outbox[0].html


def test_bookings_reject_wrong_teacher(client):
    t = make_user("t@example.com", teacher=True)
    make_user("o@example.com", teacher=True)
    db.session.add(Booking(id="b1", teacherId=t.id, status="pending"))
    db.session.commit()
    res = client.post("/api/bookings/b1/reject", headers=login(client, "o@example.com"))
    assert res.status_code == 404


def test_decision_saved_even_if_email_fails(client, monkeypatch):
    from happyresearch import emails as email_mod

    def boom(*a, **k):
        raise RuntimeError("smtp down")

    monkeypatch.setattr(email_mod, "send_application_approved", boom)
    make_user("t@example.com", teacher=True)
    make_user("s1@example.com", student=True, name="S1")
    make_user("admin@example.com", admin=True)
    item = _research(client, login(client, "t@example.com"), seats=1)
    client.post("/api/registrations", json={"kind": "research", "itemId": item["id"]}, headers=login(client, "s1@example.com"))
    hadmin = login(client, "admin@example.com")
    reg_id = quote(client.get("/api/admin/registrations", headers=hadmin).json[0]["id"], safe="")
    res = client.post(f"/api/admin/registrations/{reg_id}/approve", headers=hadmin)
    assert res.status_code == 200 and res.json["status"] == "approved" and res.json["emailSent"] is False
    assert db.session.get(Research, item["id"]).enrolledCount == 1


def _pending_booking(client):
    t = make_user("t@example.com", teacher=True)
    ht = login(client, "t@example.com")
    slot = client.post("/api/teachers/me/availability", json={"date": "2026-11-02", "time": "09:00", "duration": 30, "price": 0}, headers=ht).json
    booking_id = client.post("/api/bookings", json={"teacherId": t.id, "slotId": slot["id"], "studentName": "Kid", "studentEmail": "kid@example.com"}).json["id"]
    return ht, slot, booking_id


def test_booking_stays_pending_if_room_fails(client, outbox, monkeypatch):
    import requests
    from happyresearch import daily

    def down(*a, **k):
        raise requests.ConnectionError("daily down")

    monkeypatch.setattr(daily.requests, "post", down)
    client.application.config["DAILY_API_KEY"] = "test-key"
    ht, slot, booking_id = _pending_booking(client)
    res = client.post(f"/api/bookings/{booking_id}/approve", headers=ht)
    assert res.status_code == 502 and res.json["code"] == "MEETING_ROOM_FAILED"
    assert client.get("/api/teachers/me/bookings?status=pending", headers=ht).json[0]["id"] == booking_id
    assert db.session.get(Availability, slot["id"]).booked is False
    assert outbox == []


def test_booking_approve_needs_daily_key(client, monkeypatch):
    client.application.config["DAILY_API_KEY"] = None
    ht, _, booking_id = _pending_booking(client)
    res = client.post(f"/api/bookings/{booking_id}/approve", headers=ht)
    assert res.status_code == 503 and res.json["code"] == "VIDEO_NOT_CONFIGURED"


def test_daily_room_request(client, monkeypatch):
    from happyresearch import daily

    seen = {}

    class Res:
        ok = True

        def json(self):
            return {"url": "https://hr.daily.co/abc123"}

    def fake_post(url, headers, json, timeout):
        seen.update(url=url, auth=headers["Authorization"], props=json["properties"])
        return Res()

    monkeypatch.setattr(daily.requests, "post", fake_post)
    client.application.config["DAILY_API_KEY"] = "secret-key"
    with client.application.app_context():
        assert daily.create_room() == "https://hr.daily.co/abc123"
    assert seen["auth"] == "Bearer secret-key" and seen["props"]["max_participants"] == 2
