// src/components/RegisterControls.jsx
// Shared "Apply now" button + signup modal for research and projects.
// Used on the mentor profile page and on the research detail page.
import { useState } from "react";
import { Link } from "react-router-dom";
import { seatsStatus } from "../utils/format";
import { seatsLeft, totalSeats, registerForItem } from "../utils/registration";

// Shown in place of a silent redirect when a logged-out visitor clicks
// "Apply now" - explains why, and lets them choose log in vs sign up
// instead of being yanked to another page with no warning.
export function LoginPrompt({ from }) {
  return (
    <div
      style={{
        marginTop: 10,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "14px 16px",
      }}
    >
      <p style={{ margin: "0 0 10px", fontSize: 14, color: "var(--text)" }}>
        You'll need a student account to register for this.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link
          to='/student/login'
          state={{ from }}
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            background: "#111111",
            color: "white",
            fontWeight: 700,
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          Log in
        </Link>
        <Link
          to='/student/register'
          state={{ from }}
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "white",
            color: "var(--primary-hover)",
            fontWeight: 700,
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}

// Seat count plus an Apply now button while seats remain. Research posts
// only ever have a single seat, so the count is redundant there - just the
// button shows.
export function SeatsRow({ kind, item, onRegister }) {
  const left = seatsLeft(kind, item);
  if (left === null) return null;
  const showCount = kind !== "research";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: showCount ? "space-between" : "flex-end",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        marginTop: 10,
      }}
    >
      {showCount && (
        <span style={{ fontSize: 14, color: "var(--muted)", fontWeight: 600 }}>
          👥 {seatsStatus(totalSeats(kind, item), item.enrolledCount)}
        </span>
      )}
      {left > 0 && (
        <button
          onClick={() => onRegister(kind, item)}
          style={{
            padding: "12px 30px",
            borderRadius: 10,
            border: "none",
            background: "#111111",
            color: "white",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Apply now
        </button>
      )}
    </div>
  );
}

const REGISTER_ERRORS = {
  FULL: "Sorry, the last seat was just taken.",
  DUPLICATE: "You've already applied to this.",
  NOT_FOUND: "This is no longer available.",
};

// `student` is the logged-in student's account ({ uid, name, email }) -
// registering requires login, so there's no name/email form anymore, just a
// confirmation using the account's details.
export function RegisterModal({ kind, item, student, onClose }) {
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setSubmitting(true);
    setFormError("");
    try {
      // Name/email come from the logged-in account on the backend.
      await registerForItem(kind, item.id);
      setDone(true);
    } catch (err) {
      console.error(err);
      setFormError(
        REGISTER_ERRORS[err.message] || "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: 16,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 16,
          padding: 32,
          width: "100%",
          maxWidth: 440,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {done ? (
          <div style={{ textAlign: "center", padding: 20 }}>
            <p style={{ fontSize: 48 }}>⏳</p>
            <h3>Application submitted!</h3>
            <p style={{ color: "#888", marginBottom: 20 }}>
              Your application is pending review — we typically review
              applications within 48 hours. We'll let you know at{" "}
              {student.email} once it's approved.
            </p>
            <button
              onClick={onClose}
              style={{
                padding: "10px 24px",
                borderRadius: 8,
                border: "none",
                background: "#111111",
                color: "white",
                cursor: "pointer",
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <h3 style={{ margin: 0 }}>Apply: {item.title}</h3>
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "12px 14px",
                marginBottom: 16,
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                  margin: "0 0 4px",
                }}
              >
                Applying as
              </p>
              <p style={{ margin: 0, fontWeight: 700, color: "var(--text)" }}>
                {student.name}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 14, color: "var(--muted)" }}>
                {student.email}
              </p>
            </div>
            {formError && (
              <p style={{ color: "var(--pink)", fontSize: 13, margin: "0 0 12px" }}>
                {formError}
              </p>
            )}
            <button
              onClick={submit}
              disabled={submitting}
              style={{
                width: "100%",
                padding: 12,
                marginTop: 8,
                borderRadius: 8,
                border: "none",
                background: "#111111",
                color: "white",
                fontSize: 16,
                cursor: "pointer",
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
