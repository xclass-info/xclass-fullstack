// src/components/admin/AdminToday.jsx
// The admin home screen: one queue of everything waiting on the admin, plus
// a small strip of numbers. Backend: GET /api/admin/today.
import { useEffect, useState } from "react";
import { api, live, formatDate } from "../../api";
import { card, sectionTitle, smallBtn } from "./adminStyles";

function Queue({ title, items, empty, render }) {
  return (
    <div style={{ ...card, marginBottom: 16 }}>
      <h3 style={sectionTitle}>
        {title} <span style={{ color: items.length ? "#a01f13" : "#94a3b8" }}>({items.length})</span>
      </h3>
      {items.length === 0 ? (
        <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>{empty}</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>{items.map(render)}</div>
      )}
    </div>
  );
}

function Item({ children, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "10px 12px", background: "#f8fafc", borderRadius: 8, fontSize: 14, flexWrap: "wrap" }}>
      <div style={{ minWidth: 0 }}>{children}</div>
      {action}
    </div>
  );
}

export default function AdminToday({ onOpenPerson, onGo }) {
  const [data, setData] = useState(null);

  useEffect(() => live(() => api.get("/admin/today"), setData), []);

  if (!data) return <p style={{ color: "#94a3b8" }}>Loading...</p>;
  const s = data.stats;
  const allClear =
    data.mentorReviews.length + data.backgroundChecks.length + data.enrollments.length +
      data.staleBookings.length + data.failedEmails.length === 0;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          ["Students", s.students],
          ["Live mentors", s.liveMentors],
          ["Research posts", s.researchPosts],
          ["Bookings this month", s.bookingsThisMonth],
          ["New sign-ups (7 days)", s.newSignupsThisWeek],
        ].map(([label, value]) => (
          <div key={label} style={{ ...card, padding: "16px 18px" }}>
            <div style={{ fontSize: 26, fontWeight: 700 }}>{value}</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>{label}</div>
          </div>
        ))}
      </div>

      {allClear && (
        <div style={{ ...card, marginBottom: 16, textAlign: "center", color: "#14532d", fontWeight: 600 }}>
          🎉 Nothing needs your attention right now.
        </div>
      )}

      <Queue
        title='Mentor applications to review'
        items={data.mentorReviews}
        empty='No applications waiting.'
        render={(m) => (
          <Item key={m.id} action={<button style={smallBtn("#2f6175")} onClick={() => onGo("applications")}>Review</button>}>
            <strong>{m.name}</strong>{" "}
            <span style={{ color: "#64748b" }}>
              {m.status === "interview_requested" ? "· interview requested" : `· submitted ${formatDate(m.submittedAt)}`}
            </span>
          </Item>
        )}
      />
      <Queue
        title='Background checks to run'
        items={data.backgroundChecks}
        empty='None pending.'
        render={(m) => (
          <Item key={m.id} action={<button style={smallBtn("#2f6175")} onClick={() => onGo("applications")}>Open</button>}>
            <strong>{m.name}</strong> <span style={{ color: "#64748b" }}>· passed review, waiting on background check</span>
          </Item>
        )}
      />
      <Queue
        title='Student applications'
        items={data.enrollments}
        empty='No student applications waiting.'
        render={(r) => (
          <Item key={r.id} action={<button style={smallBtn("#2f6175")} onClick={() => onGo("student-applications")}>Review</button>}>
            <strong>{r.studentName}</strong> <span style={{ color: "#64748b" }}>→ {r.itemTitle} · {formatDate(r.createdAt)}</span>
          </Item>
        )}
      />
      <Queue
        title='1-on-1 requests unanswered for 2+ days'
        items={data.staleBookings}
        empty='Mentors are answering their booking requests.'
        render={(b) => (
          <Item key={b.id} action={b.teacherId && <button style={smallBtn("#2f6175")} onClick={() => onOpenPerson(b.teacherId)}>Open mentor</button>}>
            <strong>{b.studentName}</strong>{" "}
            <span style={{ color: "#64748b" }}>
              with {b.teacherName} · {b.date} {b.time} · requested {formatDate(b.createdAt)}
            </span>
          </Item>
        )}
      />
      <Queue
        title='Emails that failed to send (last 7 days)'
        items={data.failedEmails}
        empty='All emails went out.'
        render={(e) => (
          <Item key={e.id} action={<button style={smallBtn("#2f6175")} onClick={() => onGo("emails")}>Email log</button>}>
            <strong>{e.toEmail}</strong> <span style={{ color: "#64748b" }}>· {e.subject} · {formatDate(e.createdAt)}</span>
          </Item>
        )}
      />
    </div>
  );
}
