// src/components/StudentDashboard.jsx
// A logged-in student's dashboard: profile, plus the projects and
// research they've registered for. Laid out like the mentor dashboard.
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, formatDate } from "../api";
import { onAuthStateChanged, logout as signOut, refreshUser } from "../auth";
import styles from "./TeacherDashboard.module.css";
import Footer from "./Footer";
import { formatMentorName } from "../utils/mentorName";
import { GRADE_OPTIONS } from "../utils/grades";
import { loadMyRegistrations } from "../utils/studentData";
import { isAccountVerified } from "../utils/accountVerification";

const TABS = [
  { id: "profile", label: "👤 Profile" },
  { id: "project", label: "💡 Projects" },
  { id: "research", label: "🔬 Research" },
];

const EMPTY = {
  project: {
    text: "💡 You haven't registered for any projects yet.",
    to: "/tutors",
    cta: "Meet our mentors",
  },
  research: {
    text: "🔬 You haven't registered for any research yet.",
    to: "/research",
    cta: "Browse research",
  },
};

const clamp = (lines) => ({
  display: "-webkit-box",
  WebkitLineClamp: lines,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
});

// Registrations made before the review step have no status field - they
// were confirmed under the old instant-accept flow, so treat missing status
// as approved rather than pending.
function badgeFor(reg, item) {
  if (reg.status === "pending") return [styles.pending, "Pending review"];
  if (reg.status === "rejected") return [styles.rejected, "Not accepted"];
  return item?.stage === "completed"
    ? [styles.draft, "Completed"]
    : [styles.active, "Active"];
}

function RegistrationCard({ row }) {
  const { reg, item, mentorName, mentorType, mentorDegree } = row;
  const description = item ? item.idea || item.description : null;
  const [badgeClass, badgeLabel] = badgeFor(reg, item);

  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <h3 className={styles.cardTitle}>{reg.itemTitle}</h3>
        <span className={`${styles.badge} ${badgeClass}`}>{badgeLabel}</span>
      </div>

      {reg.status === "pending" && (
        <p className={styles.cardDesc} style={{ color: "#111111" }}>
          We typically review applications within 48 hours.
        </p>
      )}

      {reg.status === "rejected" && reg.rejectionReason && (
        <p className={styles.cardDesc} style={{ color: "#a01f13" }}>
          {reg.rejectionReason}
        </p>
      )}

      {item ? (
        description && (
          <p className={styles.cardDesc} style={clamp(4)}>
            {description}
          </p>
        )
      ) : (
        <p className={styles.cardDesc}>This is no longer available.</p>
      )}

      <div className={styles.cardMeta}>
        <span>
          📝 Applied{" "}
          {formatDate(reg.createdAt)}
        </span>
        {mentorName && reg.teacherId && (
          <span>
            👩‍🏫 Mentored by:{" "}
            <Link
              to={`/teacher/${reg.teacherId}`}
              style={{ color: "#111111", textDecoration: "underline" }}
            >
              {formatMentorName(mentorName, {
                mentorType,
                degree: mentorDegree,
              })}
            </Link>
          </span>
        )}
      </div>

      {reg.kind === "research" && item && (
        <div className={styles.cardFooter}>
          <Link to={`/research/${reg.itemId}`} className={styles.joinBtn}>
            Read more →
          </Link>
        </div>
      )}
    </div>
  );
}

const labelStyle = { fontSize: 13, color: "#888", fontWeight: 600 };
const valueStyle = { margin: "4px 0 0", fontSize: 15 };
const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #ddd",
  fontSize: 16,
  boxSizing: "border-box",
  marginTop: 4,
  fontFamily: "inherit",
};

export function StudentDashboardView({
  student,
  email,
  rows,
  onSaveProfile,
  onLogout,
}) {
  const [activeTab, setActiveTab] = useState("profile");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    name: student.name,
    grade: student.grade || "",
    phone: student.phone || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const rowsFor = (kind) => rows.filter((r) => r.reg.kind === kind);

  async function save() {
    if (!draft.name.trim()) {
      setError("Please enter your full name");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSaveProfile({
        name: draft.name.trim(),
        grade: draft.grade.trim(),
        phone: draft.phone.trim(),
      });
      setEditing(false);
    } catch (err) {
      console.error(err);
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.logo}>💻 happy<span style={{ color: "#111111" }}>Research</span></h1>
            <p className={styles.welcome}>
              Welcome back, <strong>{student.name}</strong> 👋
            </p>
          </div>
          <div className={styles.headerRight}>
            <Link to='/' className={styles.createBtn}>
              Home
            </Link>
            <button className={styles.logoutBtn} onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 24,
            borderBottom: "2px solid #f0f0f0",
            paddingBottom: 0,
            flexWrap: "wrap",
          }}
        >
          {TABS.map((tab) => {
            const count = tab.id === "profile" ? 0 : rowsFor(tab.id).length;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "10px 20px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: 19,
                  fontWeight: 600,
                  color: activeTab === tab.id ? "#111111" : "#888",
                  borderBottom:
                    activeTab === tab.id
                      ? "2px solid #111111"
                      : "2px solid transparent",
                  marginBottom: -2,
                  transition: "all 0.15s",
                }}
              >
                {tab.label}
                {count > 0 ? ` (${count})` : ""}
              </button>
            );
          })}
        </div>

        {activeTab === "profile" && (
          <div className={styles.section}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2 className={styles.sectionTitle}>👤 My Profile</h2>
                <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>
                  Your student account details.
                </p>
              </div>
              {!editing && (
                <button
                  onClick={() => {
                    setDraft({
                      name: student.name,
                      grade: student.grade || "",
                      phone: student.phone || "",
                    });
                    setEditing(true);
                  }}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "none",
                    background: "#111111",
                    color: "white",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  ✏️ Edit
                </button>
              )}
            </div>

            <div style={{ maxWidth: 600 }}>
              <div style={{ marginBottom: 20 }}>
                <p style={labelStyle}>Full name</p>
                {editing ? (
                  <input
                    value={draft.name}
                    onChange={(e) =>
                      setDraft({ ...draft, name: e.target.value })
                    }
                    style={inputStyle}
                  />
                ) : (
                  <p style={valueStyle}>{student.name}</p>
                )}
              </div>
              <div style={{ marginBottom: 20 }}>
                <p style={labelStyle}>Email</p>
                <p style={valueStyle}>
                  {email}{" "}
                  <span style={{ color: "#1f6f4a", fontSize: 13 }}>
                    ✓ verified
                  </span>
                </p>
              </div>
              <div style={{ marginBottom: 20 }}>
                <p style={labelStyle}>Grade</p>
                {editing ? (
                  <select
                    value={draft.grade}
                    onChange={(e) =>
                      setDraft({ ...draft, grade: e.target.value })
                    }
                    style={inputStyle}
                  >
                    <option value=''>Select grade</option>
                    {GRADE_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p style={valueStyle}>{student.grade || "—"}</p>
                )}
              </div>
              <div style={{ marginBottom: 20 }}>
                <p style={labelStyle}>Phone Number</p>
                {editing ? (
                  <input
                    type='tel'
                    value={draft.phone}
                    onChange={(e) =>
                      setDraft({ ...draft, phone: e.target.value })
                    }
                    placeholder='(555) 555-5555'
                    style={inputStyle}
                  />
                ) : (
                  <p style={valueStyle}>{student.phone || "—"}</p>
                )}
              </div>
              {student.createdAt && (
                <div style={{ marginBottom: 20 }}>
                  <p style={labelStyle}>Member since</p>
                  <p style={valueStyle}>
                    {formatDate(student.createdAt)}
                  </p>
                </div>
              )}

              {editing && (
                <>
                  {error && (
                    <p style={{ color: "#a01f13", fontSize: 13 }}>{error}</p>
                  )}
                  <div style={{ display: "flex", gap: 12 }}>
                    <button
                      onClick={save}
                      disabled={saving}
                      style={{
                        padding: "12px 32px",
                        borderRadius: 8,
                        border: "none",
                        background: "#111111",
                        color: "white",
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: "pointer",
                        opacity: saving ? 0.6 : 1,
                      }}
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setError("");
                      }}
                      disabled={saving}
                      style={{
                        padding: "12px 28px",
                        borderRadius: 50,
                        border: "2.5px solid #cbd5e1",
                        background: "transparent",
                        color: "#475569",
                        fontSize: 15,
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab !== "profile" && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {activeTab === "project" && "Your Projects"}
              {activeTab === "research" && "Your Research"}
            </h2>
            {rowsFor(activeTab).length === 0 ? (
              <div className={styles.empty}>
                <p>{EMPTY[activeTab].text}</p>
                <Link to={EMPTY[activeTab].to} className={styles.createBtn}>
                  {EMPTY[activeTab].cta}
                </Link>
              </div>
            ) : (
              <div className={styles.grid}>
                {rowsFor(activeTab).map((row) => (
                  <RegistrationCard key={row.reg.id} row={row} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </>
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
        setData({ uid: user.uid, student: user.student, email: user.email, rows });
      } catch (err) {
        console.error(err);
        navigate("/student/login");
      }
    });
    return () => unsub();
  }, [navigate]);

  async function saveProfile(fields) {
    await api.patch("/students/me", fields);
    setData({ ...data, student: { ...data.student, ...fields } });
    refreshUser(); // so the navbar picks up a changed name
  }

  function logout() {
    signOut();
    navigate("/");
  }

  if (!data) {
    return (
      <div className={styles.page}>
        <p style={{ color: "#aaa", padding: 40 }}>Loading...</p>
      </div>
    );
  }

  return (
    <StudentDashboardView
      student={data.student}
      email={data.email}
      rows={data.rows}
      onSaveProfile={saveProfile}
      onLogout={logout}
    />
  );
}
