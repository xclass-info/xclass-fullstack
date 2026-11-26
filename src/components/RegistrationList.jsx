// src/components/RegistrationList.jsx
// Mentor-side: who has applied for a research post / project.
import { useEffect, useState } from "react";
import { api, live, seg, toMillis, formatDate } from "../api";
import styles from "./TeacherDashboard.module.css";

// Older registrations predate the review step and have no status field -
// they were confirmed under the old instant-accept flow, so treat missing
// status as approved rather than pending.
const STATUS = {
  pending: { label: "Pending review", cls: styles.stPending },
  approved: { label: "Accepted", cls: styles.stApproved },
  rejected: { label: "Not accepted", cls: styles.stRejected },
};

export default function RegistrationList({ itemId }) {
  const [regs, setRegs] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsub = live(
      () => api.get(`/registrations?itemId=${seg(itemId)}`),
      (rows) => {
        setRegs(
          [...rows].sort(
            (a, b) => toMillis(a.createdAt) - toMillis(b.createdAt),
          ),
        );
      },
    );
    return () => unsub();
  }, [itemId]);

  if (regs.length === 0) {
    return (
      <div className={styles.applicants}>
        <span className={styles.applicantsNone}>No applicants yet</span>
      </div>
    );
  }

  const pending = regs.filter((r) => r.status === "pending").length;

  return (
    <div className={styles.applicants}>
      <button
        type='button'
        className={styles.applicantsToggle}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>
          {regs.length} {regs.length === 1 ? "applicant" : "applicants"}
          {pending > 0 && ` · ${pending} pending`}
        </span>
        <span aria-hidden='true'>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <ul className={styles.applicantList}>
          {regs.map((r) => {
            const st = STATUS[r.status || "approved"] || STATUS.approved;
            return (
              <li key={r.id} className={styles.applicant}>
                <div className={styles.applicantTop}>
                  <strong>{r.studentName}</strong>
                  <span className={`${styles.st} ${st.cls}`}>{st.label}</span>
                </div>
                <div className={styles.applicantEmail}>{r.studentEmail}</div>
                <div className={styles.applicantDate}>
                  Applied {formatDate(r.createdAt)}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
