// src/components/MentorApplicationsAdmin.jsx
// Admin pipeline for mentor applications: who is where, everything about an
// applicant on one screen, and the review / onboarding actions. Backend:
// routes/admin.py (review) and routes/mentor_application.py (the mentor side).
import { useState } from "react";
import { api, seg, formatDate, toMillis } from "../api";
import { mentorTypeLabel, statusInfo } from "../utils/mentorVerification";

// Pipeline columns, in order. "Started" is the leads list: people who did
// the quick start but haven't submitted yet.
const STAGES = [
  { status: "submitted", label: "In review" },
  { status: "interview_requested", label: "Interview" },
  { status: "onboarding", label: "Onboarding" },
  { status: "changes_requested", label: "Changes requested" },
  { status: "started", label: "Started (leads)" },
  { status: "declined", label: "Declined" },
];

// Mentors waiting on an admin action - used for the badge in the admin nav.
export function needsAdminAction(m) {
  return (
    m.verificationStatus === "submitted" ||
    m.verificationStatus === "interview_requested" ||
    (m.verificationStatus === "onboarding" && m.backgroundCheckStatus !== "passed")
  );
}

// Prompts for the actions that need a message to the applicant.
const ACTIONS = {
  "request-changes": {
    title: "Request changes",
    field: "note",
    help: "Tell the applicant exactly what to fix. They get this by email and on their application, then resubmit.",
    placeholder: 'e.g. "Your CV upload is blank - please upload it again."',
    button: "Send request",
    color: "#9a772b",
  },
  "request-interview": {
    title: "Request an interview",
    field: "message",
    help: "Only when you'd like to meet them first. Say how to schedule it - a booking link or a few time options.",
    placeholder: 'e.g. "Please book a 20-minute Zoom call here: https://calendly.com/..."',
    button: "Send request",
    color: "#9a772b",
  },
  decline: {
    title: "Decline application",
    field: "reason",
    help: "This is sent to the applicant. Keep it kind and brief.",
    placeholder: 'e.g. "We are currently only accepting mentors in STEM fields."',
    button: "Decline",
    color: "#a01f13",
  },
};

const btn = (color, outline = false) => ({
  padding: "8px 14px",
  borderRadius: 8,
  border: outline ? `1px solid ${color}` : "none",
  background: outline ? "white" : color,
  color: outline ? color : "white",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
});

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  zIndex: 200,
  padding: "40px 16px",
  overflowY: "auto",
};

function Row({ label, children }) {
  return (
    <div style={{ display: "flex", gap: 12, fontSize: 14, padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
      <span style={{ width: 150, flexShrink: 0, color: "#94a3b8" }}>{label}</span>
      <span style={{ color: "#1f2937", wordBreak: "break-word", whiteSpace: "pre-wrap" }}>{children || "—"}</span>
    </div>
  );
}

function FileLink({ url, text = "View file" }) {
  return url ? (
    <a href={url} target='_blank' rel='noopener noreferrer' style={{ color: "#2f6175", fontWeight: 600 }}>{text}</a>
  ) : (
    <span style={{ color: "#a01f13" }}>Not provided</span>
  );
}

function Check({ ok, children }) {
  return (
    <div style={{ fontSize: 14, padding: "4px 0", color: ok ? "#14532d" : "#64748b" }}>
      {ok ? "✓" : "○"} {children}
    </div>
  );
}

function ApplicantDetail({ m, onClose }) {
  const [action, setAction] = useState(null); // key of ACTIONS
  const [text, setText] = useState("");
  const [bgNote, setBgNote] = useState(m.backgroundCheckNote || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const s = m.verificationStatus;
  const reviewable = s === "submitted" || s === "interview_requested";

  async function run(path, payload) {
    setBusy(true);
    setError("");
    try {
      await api.post(`/admin/teachers/${seg(m.id)}/${path}`, payload);
      setAction(null);
      setText("");
      onClose();
    } catch (err) {
      setError(
        err.code === "WRONG_STATUS"
          ? "This application has moved on since you opened it - close and reopen it."
          : "Couldn't save - the email may not have gone out. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  function submitAction() {
    const conf = ACTIONS[action];
    if (text.trim().length < 10) {
      setError("Please write at least one full sentence.");
      return;
    }
    run(action, { [conf.field]: text.trim() });
  }

  async function recordBackgroundCheck(status) {
    setBusy(true);
    setError("");
    try {
      await api.post(`/admin/teachers/${seg(m.id)}/background-check`, { status, note: bgNote.trim() });
      onClose();
    } catch {
      setError("Couldn't save. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div
        style={{ background: "white", borderRadius: 16, padding: 28, width: "100%", maxWidth: 760 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            {m.photoURL ? (
              <img src={m.photoURL} alt='' style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#e2e8f0" }} />
            )}
            <div>
              <h3 style={{ margin: 0 }}>{m.name}</h3>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>
                {m.email} · {mentorTypeLabel(m.mentorType)}
              </p>
              <span style={{ display: "inline-block", marginTop: 6, fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 20, color: statusInfo(s).color, background: statusInfo(s).bg }}>
                {statusInfo(s).label}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>

        <h4 style={{ margin: "22px 0 6px" }}>Profile</h4>
        <Row label='Degree'>{m.degree}</Row>
        <Row label='University / org'>{m.university}</Row>
        <Row label='Field'>{m.researchArea}</Row>
        <Row label='Expertise'>{m.expertise}</Row>
        <Row label='Languages'>{m.languages}</Row>
        <Row label='Profile link'>
          {m.website ? <a href={m.website} target='_blank' rel='noopener noreferrer' style={{ color: "#2f6175" }}>{m.website}</a> : null}
        </Row>
        <Row label='Bio'>{m.bio}</Row>

        <h4 style={{ margin: "22px 0 6px" }}>Credentials</h4>
        <Row label='University email'>
          {m.workEmail ? `${m.workEmail} ${m.workEmailVerified ? "✓ verified" : "(not verified yet)"}` : null}
        </Row>
        <Row label='Proof document'><FileLink url={m.credentialURL} /></Row>
        <Row label='CV'><FileLink url={m.cvURL} /></Row>
        <Row label='US work authorization'>{m.workAuthorized == null ? null : m.workAuthorized ? "Yes" : "No"}</Row>

        <h4 style={{ margin: "22px 0 6px" }}>History</h4>
        <Row label='Started'>{formatDate(m.createdAt)}</Row>
        <Row label='Submitted'>{formatDate(m.submittedAt)}</Row>
        <Row label='Agreed to guidelines'>{formatDate(m.agreedTermsAt)}</Row>
        {m.adminNote && <Row label='Changes requested'>{m.adminNote}</Row>}
        {m.interviewMessage && <Row label={`Interview (${formatDate(m.interviewRequestedAt)})`}>{m.interviewMessage}</Row>}
        {m.rejectionReason && s === "declined" && <Row label='Declined because'>{m.rejectionReason}</Row>}

        {s === "onboarding" && (
          <>
            <h4 style={{ margin: "22px 0 6px" }}>Onboarding - goes live when both are done</h4>
            <Check ok={!!m.guidelinesAcceptedAt}>
              Mentor Guidelines accepted {m.guidelinesAcceptedAt ? `(${formatDate(m.guidelinesAcceptedAt)})` : "- waiting for the mentor"}
            </Check>
            <Check ok={m.backgroundCheckStatus === "passed"}>
              Background check{" "}
              {m.backgroundCheckStatus ? `${m.backgroundCheckStatus} (${formatDate(m.backgroundCheckAt)})` : "- not recorded yet"}
            </Check>
            {m.backgroundCheckStatus !== "passed" && (
              <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, marginTop: 10 }}>
                <p style={{ fontSize: 13, color: "#475569", margin: "0 0 8px" }}>
                  Search <strong>{m.name}</strong> on the{" "}
                  <a href='https://www.nsopw.gov/' target='_blank' rel='noopener noreferrer' style={{ color: "#2f6175" }}>
                    National Sex Offender Public Website (nsopw.gov)
                  </a>
                  , then record the result.
                </p>
                <input
                  value={bgNote}
                  onChange={(e) => setBgNote(e.target.value)}
                  placeholder='Note (optional), e.g. "NSOPW search, no matches"'
                  style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box", marginBottom: 8, fontFamily: "inherit" }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={btn("#14532d")} disabled={busy} onClick={() => recordBackgroundCheck("passed")}>Mark passed</button>
                  <button style={btn("#a01f13", true)} disabled={busy} onClick={() => recordBackgroundCheck("failed")}>Mark failed</button>
                </div>
              </div>
            )}
          </>
        )}

        {error && <p style={{ color: "#a01f13", fontSize: 13, margin: "14px 0 0" }}>{error}</p>}

        {action ? (
          <div style={{ marginTop: 20, borderTop: "1px solid #eee", paddingTop: 16 }}>
            <h4 style={{ margin: "0 0 4px" }}>{ACTIONS[action].title}</h4>
            <p style={{ fontSize: 13, color: "#888", margin: "0 0 8px" }}>{ACTIONS[action].help}</p>
            <textarea
              autoFocus
              rows={4}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError("");
              }}
              placeholder={ACTIONS[action].placeholder}
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box", fontFamily: "inherit", fontSize: 14 }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
              <button style={btn("#555", true)} onClick={() => setAction(null)}>Cancel</button>
              <button style={btn(ACTIONS[action].color)} disabled={busy} onClick={submitAction}>
                {busy ? "Sending..." : ACTIONS[action].button}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 22, borderTop: "1px solid #eee", paddingTop: 16 }}>
            {reviewable && (
              <>
                <button style={btn("#14532d")} disabled={busy} onClick={() => run("approve")}>
                  ✓ Pass review
                </button>
                <button style={btn("#9a772b", true)} onClick={() => setAction("request-changes")}>Request changes</button>
                <button style={btn("#9a772b", true)} onClick={() => setAction("request-interview")}>
                  🗓 {s === "interview_requested" ? "Update interview request" : "Request interview"}
                </button>
              </>
            )}
            {(reviewable || s === "onboarding" || s === "changes_requested") && (
              <button style={btn("#a01f13", true)} onClick={() => setAction("decline")}>Decline</button>
            )}
            {s === "started" && (
              <a href={`mailto:${m.email}`} style={{ ...btn("#2f6175", true), textDecoration: "none" }}>
                ✉️ Email this lead
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MentorApplicationsAdmin({ mentors }) {
  const [stage, setStage] = useState("submitted");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);

  const inStage = mentors
    .filter((m) => m.verificationStatus === stage)
    .filter((m) => {
      const q = search.trim().toLowerCase();
      return !q || [m.name, m.email, m.university, m.researchArea].filter(Boolean).some((v) => v.toLowerCase().includes(q));
    })
    .sort((a, b) => (toMillis(a.submittedAt) || toMillis(a.createdAt)) - (toMillis(b.submittedAt) || toMillis(b.createdAt)));
  const open = mentors.find((m) => m.id === openId);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {STAGES.map((st) => {
          const count = mentors.filter((m) => m.verificationStatus === st.status).length;
          const active = st.status === stage;
          return (
            <button
              key={st.status}
              onClick={() => setStage(st.status)}
              style={{
                padding: "8px 14px",
                borderRadius: 20,
                border: active ? "2px solid #2f6175" : "1px solid #e2e8f0",
                background: active ? "#e3eff3" : "white",
                fontWeight: active ? 700 : 500,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {st.label} ({count})
            </button>
          );
        })}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder='Search name, email, university, field...'
        style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, fontFamily: "inherit", width: "100%", maxWidth: 360, marginBottom: 16, boxSizing: "border-box" }}
      />

      {inStage.length === 0 ? (
        <p style={{ color: "#aaa" }}>Nobody here right now.</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {inStage.map((m) => (
            <div
              key={m.id}
              style={{ background: "white", border: "1px solid #eee", borderRadius: 12, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}
            >
              <div>
                <strong>{m.name}</strong>{" "}
                <span style={{ color: "#94a3b8", fontSize: 13 }}>· {mentorTypeLabel(m.mentorType)}</span>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                  {[m.university, m.researchArea].filter(Boolean).join(" · ")}
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                  {m.submittedAt ? `Submitted ${formatDate(m.submittedAt)}` : `Started ${formatDate(m.createdAt)}`}
                  {stage === "onboarding" &&
                    ` · Guidelines ${m.guidelinesAcceptedAt ? "✓" : "○"} · Background check ${m.backgroundCheckStatus === "passed" ? "✓" : "○"}`}
                </div>
              </div>
              <button style={btn("#2f6175")} onClick={() => setOpenId(m.id)}>Open</button>
            </div>
          ))}
        </div>
      )}

      {open && <ApplicantDetail key={open.id} m={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}
