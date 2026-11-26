// src/components/BookingRequests.jsx
// Mentor's pending 1-on-1 booking requests. Approving creates a Daily.co
// meeting room, and the backend emails the link to the student and mentor.
import { useState, useEffect } from "react";
import { api, live, seg } from "../api";
import { getCurrentUser } from "../auth";
import styles from "./TeacherDashboard.module.css";

const DAILY_API_KEY = import.meta.env.VITE_DAILY_API_KEY;

function whenLabel(req) {
  const d = new Date(`${req.date}T${req.time}`);
  if (Number.isNaN(d.getTime())) return `${req.date} ${req.time}`;
  return `${d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })} · ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

export default function BookingRequests() {
  const [requests, setRequests] = useState([]);
  const [processing, setProcessing] = useState(null);
  const teacherId = getCurrentUser()?.uid;

  useEffect(() => {
    if (!teacherId) return;
    const unsub = live(
      () => api.get("/teachers/me/bookings?status=pending"),
      setRequests,
    );
    return () => unsub();
  }, [teacherId]);

  async function generateMeetingLink(bookingId) {
    const res = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: `happyresearch-session-${bookingId.slice(-8)}`,
        properties: {
          enable_chat: true,
          enable_screenshare: true,
          max_participants: 2,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
        },
      }),
    });
    const data = await res.json();
    if (!data.url) throw new Error("Failed to generate meeting link");
    return data.url;
  }

  async function handleApprove(req) {
    setProcessing(req.id);
    try {
      const meetingLink = await generateMeetingLink(req.id);
      // The backend saves the link, marks the slot booked and emails the
      // confirmation to the student and to you.
      await api.post(`/bookings/${seg(req.id)}/approve`, {
        meeting_link: meetingLink,
      });
      alert(`Approved. The meeting link was emailed to ${req.studentEmail}.`);
    } catch (err) {
      console.error(err);
      alert("Something went wrong: " + err.message);
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(req) {
    if (!window.confirm(`Decline ${req.studentName}'s request?`)) return;
    setProcessing(req.id);
    try {
      await api.post(`/bookings/${seg(req.id)}/reject`);
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div>
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.sectionTitle}>Booking requests.</h2>
          <p className={styles.sectionSub}>
            Students asking for a 1-on-1 in one of your open slots. Approving
            sends both of you a video meeting link by email.
          </p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No requests right now.</p>
          <p>New requests show up here as soon as a student books a slot.</p>
        </div>
      ) : (
        <div className={styles.requests}>
          {requests.map((req) => (
            <div key={req.id} className={styles.request}>
              <div>
                <p className={styles.requestWhen}>{whenLabel(req)}</p>
                <p className={styles.requestWho}>
                  <strong>{req.studentName}</strong> · {req.studentEmail} ·{" "}
                  {req.duration} min
                </p>
              </div>
              <div className={styles.requestActions}>
                <button
                  type='button'
                  className='btn-primary'
                  onClick={() => handleApprove(req)}
                  disabled={processing === req.id}
                >
                  {processing === req.id ? "Working..." : "Approve & send link"}
                </button>
                <button
                  type='button'
                  className='btn-ghost'
                  onClick={() => handleReject(req)}
                  disabled={processing === req.id}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
