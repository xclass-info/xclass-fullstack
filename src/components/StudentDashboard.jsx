// src/components/StudentDashboard.jsx
// A logged-in student's dashboard: a greeting, every research topic and
// project they've applied to (with its review status), and their account
// details, which they can edit.
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, formatDate } from "../api";
import { onAuthStateChanged, refreshUser } from "../auth";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { formatMentorName } from "../utils/mentorName";
import { GRADE_OPTIONS } from "../utils/grades";
import { loadMyRegistrations } from "../utils/studentData";
import { isAccountVerified } from "../utils/accountVerification";
import auth from "./TeacherAuth.module.css";
import styles from "./StudentDashboard.module.css";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "research", label: "Research" },
  { id: "project", label: "Projects" },
];

// Registrations made before the review step have no status field - they
// were confirmed under the old instant-accept flow, so treat missing status
// as approved rather than pending.
function statusFor(reg, item) {
  if (reg.status === "pending") return ["pending", "Pending review"];
  if (reg.status === "rejected") return ["rejected", "Not accepted"];
  return item?.stage === "completed"
    ? ["done", "Completed"]
    : ["active", "Accepted"];
}

function ApplicationCard({ row }) {
  const { reg, item, mentorName, mentorType, mentorDegree } = row;
  const description = item ? item.idea || item.description : null;
  const [status, statusLabel] = statusFor(reg, item);
  const detailPath = item
    ? `/${reg.kind === "research" ? "research" : "projects"}/${reg.itemId}`
    : null;

  return (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        <span className={styles.kind}>
          {reg.kind === "research" ? "Research" : "Project"}
        </span>
        <span className={`${styles.status} ${styles[status]}`}>
          {statusLabel}
        </span>
      </div>

      <h3 className={styles.cardTitle}>
        {detailPath ? (
          <Link to={detailPath} className={styles.cardLink}>
            {reg.itemTitle}
          </Link>
        ) : (
          reg.itemTitle
        )}
      </h3>

      {status === "pending" && (
        <p className={styles.note}>
          We typically review applications within 48 hours, and we'll email you
          as soon as it's decided.
        </p>
      )}
      {status === "rejected" && reg.rejectionReason && (
        <p className={`${styles.note} ${styles.noteBad}`}>
          {reg.rejectionReason}
        </p>
      )}

      {item ? (
        description && <p className={styles.cardText}>{description}</p>
      ) : (
        <p className={styles.cardText}>This is no longer available.</p>
      )}

      <div className={styles.cardFoot}>
        <span>
          {mentorName && reg.teacherId ? (
            <>
              With{" "}
              <Link to={`/teacher/${reg.teacherId}`} className={styles.mentor}>
                {formatMentorName(mentorName, {
                  mentorType,
                  degree: mentorDegree,
                })}
              </Link>
              {" · "}
            </>
          ) : null}
          Applied {formatDate(reg.createdAt)}
        </span>
        {detailPath && (
          <Link to={detailPath} className={styles.more}>
            View →
          </Link>
        )}
      </div>
    </article>
  );
}

function ProfileCard({ student, email, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function startEdit() {
    setDraft({
      name: student.name,
      grade: student.grade || "",
      phone: student.phone || "",
    });
    setError("");
    setEditing(true);
  }

  async function save(e) {
    e.preventDefault();
    if (!draft.name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        name: draft.name.trim(),
        grade: draft.grade.trim(),
        phone: draft.phone.trim(),
      });
      setEditing(false);
    } catch (err) {
      console.error(err);
      setError("Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.profile}>
      <div className={styles.profileHead}>
        <h2 className={styles.profileTitle}>Your details.</h2>
        {!editing && (
          <button type='button' className={styles.editBtn} onClick={startEdit}>
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={save} className={auth.form} noValidate>
          {error && <p className={auth.error}>{error}</p>}
          <div className={auth.field}>
            <label className={auth.label} htmlFor='sd-name'>
              Full name
            </label>
            <input
              id='sd-name'
              className={auth.input}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              autoComplete='name'
            />
          </div>
          <div className={auth.field}>
            <label className={auth.label} htmlFor='sd-grade'>
              Grade
            </label>
            <select
              id='sd-grade'
              className={auth.input}
              value={draft.grade}
              onChange={(e) => setDraft({ ...draft, grade: e.target.value })}
            >
              <option value=''>Select grade</option>
              {GRADE_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div className={auth.field}>
            <label className={auth.label} htmlFor='sd-phone'>
              Phone
            </label>
            <input
              id='sd-phone'
              type='tel'
              className={auth.input}
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              placeholder='(555) 555-5555'
              autoComplete='tel'
            />
          </div>
          <div className={styles.formActions}>
            <button type='submit' className='btn-primary' disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type='button'
              className='btn-ghost'
              disabled={saving}
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <dl className={styles.facts}>
          <div>
            <dt>Full name</dt>
            <dd>{student.name}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>
              {email} <span className={styles.verified}>✓ Verified</span>
            </dd>
          </div>
          <div>
            <dt>Grade</dt>
            <dd>{student.grade || "Not set"}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{student.phone || "Not set"}</dd>
          </div>
          {student.createdAt && (
            <div>
              <dt>Member since</dt>
              <dd>{formatDate(student.createdAt)}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}

export function StudentDashboardView({ student, email, rows, onSaveProfile }) {
  const [filter, setFilter] = useState("all");
  const count = (kind) => rows.filter((r) => r.reg.kind === kind).length;
  const pending = rows.filter((r) => r.reg.status === "pending").length;
  const accepted = rows.filter(
    (r) => r.reg.status !== "pending" && r.reg.status !== "rejected",
  ).length;
  const shown =
    filter === "all" ? rows : rows.filter((r) => r.reg.kind === filter);
  const firstName = (student.name || "").trim().split(/\s+/)[0] || "there";

  let summary = "You haven't applied to anything yet.";
  if (rows.length > 0) {
    const parts = [
      `${rows.length} ${rows.length === 1 ? "application" : "applications"}`,
      accepted > 0 && `${accepted} accepted`,
      pending > 0 && `${pending} waiting for review`,
    ].filter(Boolean);
    summary = parts.join(" · ") + ".";
  }

  return (
    <div className={styles.page}>
      <Navbar />

      <header className={styles.head}>
        <div className={styles.wrap}>
          <p className='section-label'>Your dashboard</p>
          <h1 className={styles.h1}>Hi, {firstName}.</h1>
          <div className={styles.headBottom}>
            <p className={styles.summary}>{summary}</p>
            <div className={styles.actions}>
              <Link to='/research' className='btn-primary'>
                Find a program →
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className={`${styles.wrap} ${styles.body}`}>
        <main className={styles.main}>
          <div className={styles.mainHead}>
            <h2 className={styles.sectionTitle}>Your applications.</h2>
            {rows.length > 0 && (
              <div
                className={styles.chips}
                role='group'
                aria-label='Filter applications'
              >
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type='button'
                    aria-pressed={filter === f.id}
                    className={`${styles.chip} ${filter === f.id ? styles.chipOn : ""}`}
                    onClick={() => setFilter(f.id)}
                  >
                    {f.label}{" "}
                    <span className={styles.chipCount}>
                      {f.id === "all" ? rows.length : count(f.id)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {shown.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>
                {rows.length === 0
                  ? "Nothing here yet."
                  : filter === "research"
                    ? "No research applications yet."
                    : "No project applications yet."}
              </p>
              <p>
                Pick a research topic or project, apply, and you'll be able to
                follow it here.
              </p>
              <div className={styles.emptyActions}>
                <Link to='/research' className='btn-primary'>
                  Browse research
                </Link>
                <Link to='/projects' className='btn-ghost'>
                  Browse projects
                </Link>
              </div>
            </div>
          ) : (
            <div className={styles.list}>
              {shown.map((row) => (
                <ApplicationCard key={row.reg.id} row={row} />
              ))}
            </div>
          )}
        </main>

        <aside className={styles.side}>
          <ProfileCard student={student} email={email} onSave={onSaveProfile} />
          <div className={styles.help}>
            <p className={styles.helpTitle}>Need a hand?</p>
            <p>
              Questions about an application or a mentor?{" "}
              <Link to='/contact'>Contact us</Link>.
            </p>
          </div>
        </aside>
      </div>

      <Footer />
    </div>
  );
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null); // { uid, student, email, rows }

  useEffect(() => {
    const unsub = onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/student/login");
        return;
      }
      try {
        // Only verified student accounts belong here.
        if (!user.student || !isAccountVerified(user.student)) {
          navigate("/student/login");
          return;
        }
        const rows = await loadMyRegistrations();
        setData({
          uid: user.uid,
          student: user.student,
          email: user.email,
          rows,
        });
      } catch (err) {
        console.error(err);
        navigate("/student/login");
      }
    });
    return () => unsub();
  }, [navigate]);

  async function saveProfile(fields) {
    await api.patch("/students/me", fields);
    setData((d) => ({ ...d, student: { ...d.student, ...fields } }));
    refreshUser(); // so the navbar picks up a changed name
  }

  if (!data) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={`${styles.wrap} ${styles.loading}`}>Loading...</div>
      </div>
    );
  }

  return (
    <StudentDashboardView
      student={data.student}
      email={data.email}
      rows={data.rows}
      onSaveProfile={saveProfile}
    />
  );
}
