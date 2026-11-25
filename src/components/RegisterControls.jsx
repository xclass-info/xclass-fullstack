// src/components/RegisterControls.jsx
// Shared "Apply now" button + signup modal for research and projects.
// Used on the mentor profile page and on the research detail page.
import { useState } from "react";
import { Link } from "react-router-dom";
import { seatsStatus } from "../utils/format";
import { seatsLeft, totalSeats, registerForItem } from "../utils/registration";
import styles from "./RegisterControls.module.css";

// Shown in place of a silent redirect when a logged-out visitor clicks
// "Apply now" - explains why, and lets them choose log in vs sign up
// instead of being yanked to another page with no warning.
export function LoginPrompt({ from }) {
  return (
    <div className={styles.prompt} role='status'>
      <p>You'll need a student account to apply.</p>
      <div className={styles.promptActions}>
        <Link to='/student/login' state={{ from }} className={styles.primary}>
          Log in
        </Link>
        <Link
          to='/student/register'
          state={{ from }}
          className={styles.secondary}
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
// `large` stacks a big seat count over a full-width button (detail-page side
// card); the default is one compact row for cards in a list.
// `hideCount` drops the count when the card already shows it elsewhere.
export function SeatsRow({
  kind,
  item,
  onRegister,
  large = false,
  hideCount = false,
}) {
  const left = seatsLeft(kind, item);
  if (left === null) return null;
  const showCount = kind !== "research" && !hideCount;
  return (
    <div className={large ? styles.seatsLarge : styles.seats}>
      {showCount && (
        <span className={styles.seatCount}>
          {seatsStatus(totalSeats(kind, item), item.enrolledCount)}
        </span>
      )}
      {left > 0 ? (
        <button
          type='button'
          className={styles.applyBtn}
          onClick={() => onRegister(kind, item)}
        >
          Apply now →
        </button>
      ) : (
        <span className={styles.full}>No seats left right now</span>
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
        REGISTER_ERRORS[err.message] ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.overlay}>
      <div
        className={styles.modal}
        role='dialog'
        aria-modal='true'
        aria-labelledby='register-title'
      >
        {done ? (
          <div>
            <p className={styles.modalKicker}>Application submitted</p>
            <h3 id='register-title' className={styles.modalTitle}>
              You're in the queue.
            </h3>
            <p className={styles.modalText}>
              Your application is pending review. We typically review
              applications within 48 hours, and we'll let you know at{" "}
              <strong>{student.email}</strong> once it's approved.
            </p>
            <button type='button' onClick={onClose} className={styles.applyBtn}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div className={styles.modalHead}>
              <div>
                <p className={styles.modalKicker}>Apply</p>
                <h3 id='register-title' className={styles.modalTitle}>
                  {item.title}
                </h3>
              </div>
              <button
                type='button'
                onClick={onClose}
                className={styles.close}
                aria-label='Close'
              >
                ✕
              </button>
            </div>

            <div className={styles.applicant}>
              <p className={styles.applicantLabel}>Applying as</p>
              <p className={styles.applicantName}>{student.name}</p>
              <p className={styles.applicantEmail}>{student.email}</p>
            </div>
            {formError && (
              <p className={styles.error} role='alert'>
                {formError}
              </p>
            )}
            <button
              type='button'
              onClick={submit}
              disabled={submitting}
              className={styles.applyBtn}
            >
              {submitting ? "Submitting..." : "Submit application →"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
