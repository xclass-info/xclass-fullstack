// src/components/TeacherProfile.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { api, getOrNull, live, seg, toMillis } from "../api";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { safeUrl, LESSON_STRUCTURE_LABEL } from "../utils/format";
import { SeatsRow, RegisterModal, LoginPrompt } from "./RegisterControls";
import { useStudentAuth } from "../utils/useStudentAuth";
import InitialsAvatar from "./InitialsAvatar";
import { formatMentorName } from "../utils/mentorName";
import { mentorTypeLabel } from "../utils/mentorVerification";

import { toPrereqArray } from "../utils/prerequisites";

const cardStyle = {
  background: "white",
  borderRadius: 12,
  padding: 28,
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  border: "1px solid #eef1f3",
  marginBottom: 24,
};
const itemStyle = {
  padding: 20,
  borderRadius: 12,
  background: "var(--bg)",
  border: "1px solid var(--border)",
  transition: "transform 0.15s, box-shadow 0.15s, border-color 0.15s",
};

function liftOn(e) {
  e.currentTarget.style.transform = "translateY(-2px)";
  e.currentTarget.style.boxShadow = "0 8px 20px rgba(17,17,17,0.1)";
  e.currentTarget.style.borderColor = "#d8e4e8";
}
function liftOff(e) {
  e.currentTarget.style.transform = "translateY(0)";
  e.currentTarget.style.boxShadow = "none";
  e.currentTarget.style.borderColor = "var(--border)";
}

// Small eyebrow + serif heading, reused above each portfolio section -
// echoes the site's section-label + Source Serif 4 convention elsewhere.
function SectionHeading({ eyebrow, title }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p
        style={{
          margin: "0 0 4px",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#111111",
        }}
      >
        {eyebrow}
      </p>
      <h3
        style={{
          margin: 0,
          fontFamily: "var(--font-serif)",
          fontSize: 26,
          fontWeight: 600,
          color: "var(--ink)",
        }}
      >
        {title}
      </h3>
    </div>
  );
}

const BADGES = {
  registration: {
    label: "Registration",
    color: "#92400e",
    bg: "rgba(217,119,6,0.08)",
    border: "rgba(217,119,6,0.3)",
  },
  active: {
    label: "Active",
    color: "var(--mint)",
    bg: "rgba(31,111,74,0.08)",
    border: "rgba(31,111,74,0.3)",
  },
  completed: {
    label: "Completed",
    color: "var(--muted)",
    bg: "var(--surface)",
    border: "var(--border)",
  },
};

function StatusBadge({ status }) {
  const b = BADGES[status] || BADGES.active;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 800,
        textTransform: "uppercase",
        padding: "3px 10px",
        borderRadius: 50,
        border: `2px solid ${b.border}`,
        color: b.color,
        background: b.bg,
        whiteSpace: "nowrap",
      }}
    >
      {b.label}
    </span>
  );
}

// Long descriptions are clamped with a Show more toggle so one research
// post or project doesn't push everything else off the page.
function ExpandableText({ text, style }) {
  const [open, setOpen] = useState(false);
  const isLong = text.length > 280;
  return (
    <>
      <p
        style={{
          ...style,
          whiteSpace: "pre-wrap",
          ...(isLong && !open
            ? {
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
            : {}),
        }}
      >
        {text}
      </p>
      {isLong && (
        <button
          onClick={() => setOpen(!open)}
          style={{
            background: "none",
            border: "none",
            color: "#111111",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            padding: 0,
            marginTop: 4,
          }}
        >
          {open ? "Show less" : "Show more"}
        </button>
      )}
    </>
  );
}

// A Polygence-style trailing "Keywords: a, b, c" line, built from whatever
// real topic/metadata fields are available - grade level, deliverable type,
// and the mentor's own subject tags - rather than invented keywords.
function KeywordsLine({ items }) {
  const list = [...new Set(items.filter(Boolean))];
  if (list.length === 0) return null;
  return (
    <p
      style={{
        fontSize: 12,
        color: "var(--muted)",
        margin: "10px 0 0",
        lineHeight: 1.6,
      }}
    >
      <span style={{ fontWeight: 700, color: "var(--muted)" }}>Keywords: </span>
      {list.join(", ")}
    </p>
  );
}

// Research cards expand in place (like Show more on projects)
// instead of navigating away.
function ResearchItem({ r, onRegister, expertiseTags }) {
  const [open, setOpen] = useState(false);
  const labelStyle = {
    margin: "0 0 4px",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };
  const bodyStyle = {
    margin: 0,
    fontSize: 13,
    color: "var(--muted)",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
  };
  return (
    <div style={itemStyle} onMouseEnter={liftOn} onMouseLeave={liftOff}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 6,
        }}
      >
        <h4 style={{ margin: 0, fontSize: 15, color: "var(--text)" }}>{r.title}</h4>
        <StatusBadge status={r.stage} />
      </div>
      <p
        style={{
          ...bodyStyle,
          color: "var(--muted)",
          ...(open
            ? {}
            : {
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }),
        }}
      >
        {r.idea}
      </p>
      {toPrereqArray(r.prerequisites).length > 0 && (
        <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 4px" }}>
          ✅ Prerequisites: {toPrereqArray(r.prerequisites).join(", ")}
        </p>
      )}
      <p style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, margin: "0 0 4px" }}>
        🕐 {LESSON_STRUCTURE_LABEL}
      </p>
      <KeywordsLine
        items={[r.gradeLevel, r.deliverable, ...expertiseTags]}
      />
      <SeatsRow kind='research' item={r} onRegister={onRegister} />
      {open && (
        <>
          <div
            style={{
              marginTop: 10,
              padding: "10px 12px",
              borderRadius: 8,
              background: "#f0fdf4",
              borderLeft: "3px solid #1f6f4a",
            }}
          >
            <p style={{ ...labelStyle, color: "#1f6f4a" }}>Impact</p>
            <p style={bodyStyle}>{r.impact}</p>
          </div>
          {r.details && (
            <div
              style={{
                marginTop: 10,
                padding: "10px 12px",
                borderRadius: 8,
                background: "white",
                border: "1px solid #eee",
              }}
            >
              <p style={{ ...labelStyle, color: "#aaa" }}>Additional details</p>
              <p style={bodyStyle}>{r.details}</p>
            </div>
          )}
        </>
      )}
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "none",
          border: "none",
          color: "#111111",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
          padding: 0,
          marginTop: 8,
        }}
      >
        {open ? "Show less" : "Show more"}
      </button>
    </div>
  );
}

const newestFirst = (a, b) => toMillis(b.createdAt) - toMillis(a.createdAt);

export default function TeacherProfile() {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { student } = useStudentAuth();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({ name: "", email: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [research, setResearch] = useState([]);
  const [projects, setProjects] = useState([]);
  const [registering, setRegistering] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    const unsub = live(
      () => getOrNull(`/teachers/${seg(teacherId)}`),
      (data) => {
        if (data) setTeacher(data);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [teacherId]);

  useEffect(() => {
    async function fetchSlots() {
      const rows = await api.get(`/teachers/${seg(teacherId)}/availability`);
      const available = rows
        .filter((s) => !s.booked)
        .sort(
          (a, b) =>
            new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`),
        );
      setSlots(available);
    }
    fetchSlots();
  }, [teacherId]);

  // Same content the mentor sees in their dashboard, read-only. Bookings are
  // intentionally not loaded - they contain students' names and emails.
  useEffect(() => {
    async function loadPortfolio() {
      const byTeacher = (name) =>
        api.get(`/${name}?teacherId=${seg(teacherId)}`);
      const toList = (rows) => [...rows].sort(newestFirst);
      try {
        const [r, p] = await Promise.all([
          byTeacher("research"),
          byTeacher("projects"),
        ]);
        setResearch(toList(r).filter((x) => x.status === "published"));
        setProjects(toList(p));
      } catch (err) {
        console.error(err);
      }
    }
    loadPortfolio();
  }, [teacherId]);

  function openRegister(kind, item) {
    // Registering requires a logged-in student account, so it can be tied
    // to the student's record and reliably show up on their dashboard.
    // Rather than silently redirecting to login, show an inline prompt so
    // the choice (log in vs sign up) is explicit.
    if (!student) {
      setShowLoginPrompt(true);
      return;
    }
    setRegistering({ kind, item });
  }

  function validate() {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Required";
    if (!form.email.trim()) newErrors.email = "Required";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      newErrors.email = "Invalid email";
    return newErrors;
  }

  async function handleBook() {
    if (!selectedSlot) return alert("Please select a time slot");
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setSubmitting(true);
    try {
      // The backend copies date/time/duration from the slot itself.
      await api.post("/bookings", {
        teacherId: teacher.id,
        slotId: selectedSlot.id,
        studentName: form.name,
        studentEmail: form.email,
      });
      setBooked(true);
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <Navbar />
        <div
          style={{ padding: "120px 32px", textAlign: "center", color: "#aaa" }}
        >
          Loading teacher profile...
        </div>
      </div>
    );
  }

  if (!teacher || teacher.verificationStatus !== "approved") {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <Navbar />
        <div style={{ padding: "120px 32px", textAlign: "center" }}>
          <p>Teacher not found.</p>
          <button
            onClick={() => navigate("/")}
            style={{
              marginTop: 16,
              padding: "10px 24px",
              borderRadius: 8,
              border: "none",
              background: "#111111",
              color: "white",
              cursor: "pointer",
            }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  // The "Expertise" tag row draws on whichever of these subject fields the
  // mentor has, deduped - real teacher docs don't have a dedicated
  // multi-tag field, so this reuses what's already there.
  const expertiseTags = [
    ...new Set(
      [teacher.major, teacher.researchArea, teacher.expertise].filter(
        Boolean,
      ),
    ),
  ];

  const displayName = formatMentorName(teacher.name, {
    mentorType: teacher.mentorType,
    degree: teacher.degree,
  });

  const projectsTotal = projects.length + (teacher.projects?.length || 0);
  const stats = [
    research.length > 0 && {
      value: research.length,
      label: research.length === 1 ? "Research Topic" : "Research Topics",
    },
    projectsTotal > 0 && {
      value: projectsTotal,
      label: projectsTotal === 1 ? "Project" : "Projects",
    },
    teacher.yearsOfExperience && {
      value: teacher.yearsOfExperience,
      label: "Years Exp.",
    },
  ].filter(Boolean);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />

      <div
        style={{ maxWidth: 1180, margin: "0 auto", padding: "100px 24px 60px" }}
      >
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            color: "#111111",
            cursor: "pointer",
            fontSize: 14,
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          ← Back
        </button>

        <div
          style={{
            display: "flex",
            gap: 32,
            flexWrap: "wrap",
          }}
        >
          {/* Sidebar — avatar, facts, stats, CTA */}
          <aside
            style={{
              flex: "0 0 320px",
              width: 320,
            }}
          >
            <div
              style={{
                ...cardStyle,
                textAlign: "center",
                marginBottom: 0,
                position: "sticky",
                top: 92,
              }}
            >
              {teacher.photoURL ? (
                <img
                  src={teacher.photoURL}
                  alt={teacher.name}
                  style={{
                    width: 150,
                    height: 150,
                    borderRadius: "50%",
                    objectFit: "cover",
                    background: "#fff8dc",
                    border: "4px solid #fff",
                    boxShadow: "0 0 0 3px #e3eff3",
                    margin: "0 auto 16px",
                  }}
                />
              ) : (
                <InitialsAvatar
                  name={teacher.name}
                  seed={teacher.id}
                  fontSize='2.6rem'
                  style={{
                    width: 150,
                    height: 150,
                    borderRadius: "50%",
                    border: "4px solid #fff",
                    boxShadow: "0 0 0 3px #e3eff3",
                    margin: "0 auto 16px",
                  }}
                />
              )}

              <h1
                style={{
                  margin: "0 0 2px",
                  fontFamily: "var(--font-display)",
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--text)",
                }}
              >
                {displayName}
              </h1>
              <p style={{ margin: "0 0 10px", fontSize: 13, color: "#111111", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Research Mentor
              </p>

              {teacher.mentorType && (
                <div style={{ marginBottom: 14 }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "rgba(22,101,52,0.08)",
                      color: "#14532d",
                      border: "1px solid rgba(22,101,52,0.25)",
                      borderRadius: 20,
                      padding: "4px 12px",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    ✓ Verified {mentorTypeLabel(teacher.mentorType)}
                  </span>
                </div>
              )}

              {(teacher.degree || teacher.university) && (
                <p style={{ margin: "0 0 18px", fontSize: 13.5, color: "var(--muted)" }}>
                  {[teacher.degree, teacher.university]
                    .filter(Boolean)
                    .join(" at ")}
                </p>
              )}

              {/* Expertise tags */}
              {expertiseTags.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    justifyContent: "center",
                    paddingTop: 16,
                    borderTop: "1px solid #eef1f3",
                  }}
                >
                  {expertiseTags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: 11.5,
                        background: "#fff8dc",
                        color: "#111111",
                        border: "1px solid #111111",
                        padding: "4px 11px",
                        borderRadius: 20,
                        fontWeight: 600,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats row */}
              {stats.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 0,
                    marginTop: 18,
                    paddingTop: 18,
                    borderTop: "1px solid #eef1f3",
                  }}
                >
                  {stats.map((s, i) => (
                    <div
                      key={s.label}
                      style={{
                        flex: 1,
                        padding: "0 8px",
                        borderLeft: i > 0 ? "1px solid #eef1f3" : "none",
                      }}
                    >
                      <p
                        style={{
                          margin: "0 0 2px",
                          fontSize: 20,
                          fontWeight: 700,
                          color: "#111111",
                          fontFamily: "var(--font-display)",
                        }}
                      >
                        {s.value}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--muted)", lineHeight: 1.3 }}>
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowBooking(true)}
                style={{
                  width: "100%",
                  marginTop: 20,
                  padding: "14px 20px",
                  borderRadius: 12,
                  border: "none",
                  background: "#111111",
                  color: "white",
                  fontSize: 15.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Book a consultation
              </button>

              {(teacher.gender || teacher.languages || teacher.website) && (
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: "1px solid #eef1f3",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    fontSize: 12.5,
                    color: "var(--muted)",
                  }}
                >
                  {teacher.gender && <span>{teacher.gender}</span>}
                  {teacher.languages && <span>🗣 {teacher.languages}</span>}
                  {teacher.website &&
                    (safeUrl(teacher.website) ? (
                      <a
                        href={safeUrl(teacher.website)}
                        target='_blank'
                        rel='noreferrer'
                        style={{ color: "#111111" }}
                      >
                        {teacher.website}
                      </a>
                    ) : (
                      <span>{teacher.website}</span>
                    ))}
                </div>
              )}
            </div>
          </aside>

          {/* Main column — bio, research, projects */}
          <main style={{ flex: "1 1 600px", minWidth: 0 }}>
            {/* About */}
            {teacher.bio && (
              <div style={cardStyle}>
                <SectionHeading eyebrow='About' title='Bio' />
                <p
                  style={{
                    fontSize: 14.5,
                    color: "var(--muted)",
                    lineHeight: 1.75,
                    margin: 0,
                  }}
                >
                  {teacher.bio}
                </p>
              </div>
            )}

        {/* Research */}
        {research.length > 0 && (
          <div style={cardStyle}>
            <SectionHeading eyebrow='Portfolio' title='Research' />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {research.map((r) => (
                <ResearchItem
                  key={r.id}
                  r={r}
                  onRegister={openRegister}
                  expertiseTags={expertiseTags}
                />
              ))}
            </div>
          </div>
        )}

        {/* Projects (new collection first, then the older per-profile list) */}
        {[...projects, ...(teacher.projects || [])].length > 0 && (
          <div style={cardStyle}>
            <SectionHeading eyebrow='Portfolio' title='Projects' />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[...projects, ...(teacher.projects || [])].map((project) => (
                <div
                  key={project.id}
                  style={itemStyle}
                  onMouseEnter={liftOn}
                  onMouseLeave={liftOff}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                      marginBottom: 6,
                    }}
                  >
                    <h4 style={{ margin: 0, fontSize: 15, color: "var(--text)" }}>
                      {project.title}
                    </h4>
                    {project.stage && <StatusBadge status={project.stage} />}
                  </div>
                  {project.description && (
                    <ExpandableText
                      text={project.description}
                      style={{
                        margin: 0,
                        fontSize: 13,
                        color: "var(--muted)",
                        lineHeight: 1.6,
                      }}
                    />
                  )}
                  {toPrereqArray(project.prerequisites).length > 0 && (
                    <p style={{ fontSize: 12, color: "var(--muted)", margin: "6px 0 0" }}>
                      ✅ Prerequisites: {toPrereqArray(project.prerequisites).join(", ")}
                    </p>
                  )}
                  <p style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, margin: "6px 0 0" }}>
                    🕐 {LESSON_STRUCTURE_LABEL}
                  </p>
                  <KeywordsLine
                    items={[
                      project.gradeLevel,
                      project.deliverable,
                      ...expertiseTags,
                    ]}
                  />
                  <SeatsRow
                    kind='project'
                    item={project}
                    onRegister={openRegister}
                  />
                  {project.learning && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: "10px 12px",
                        borderRadius: 8,
                        background: "#f0fdf4",
                        borderLeft: "3px solid #1f6f4a",
                      }}
                    >
                      <p
                        style={{
                          margin: "0 0 4px",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#1f6f4a",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        What students will learn
                      </p>
                      <ExpandableText
                        text={project.learning}
                        style={{
                          margin: 0,
                          fontSize: 13,
                          color: "var(--muted)",
                          lineHeight: 1.6,
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
          </main>
        </div>
      </div>

      {/* ── Booking Modal ── */}
      {showBooking && (
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
              borderRadius: 18,
              padding: 32,
              width: "100%",
              maxWidth: 440,
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
            }}
          >
            {booked ? (
              <div style={{ textAlign: "center", padding: 20 }}>
                <p style={{ fontSize: 48 }}>✅</p>
                <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontFamily: "var(--font-display)" }}>
                  Booking Request Sent!
                </h3>
                <p style={{ color: "var(--muted)", marginBottom: 20 }}>
                  {teacher.name} will confirm your session soon.
                </p>
                <button
                  onClick={() => {
                    setShowBooking(false);
                    setBooked(false);
                  }}
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
                    alignItems: "center",
                    marginBottom: 20,
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    Book with {teacher.name}
                  </h3>
                  <button
                    onClick={() => setShowBooking(false)}
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

                <h4 style={{ marginBottom: 8 }}>Select a Slot</h4>
                {slots.length === 0 ? (
                  <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 16 }}>
                    No available slots.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      marginBottom: 20,
                    }}
                  >
                    {slots.map((slot) => (
                      <div
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot)}
                        style={{
                          padding: "10px 16px",
                          borderRadius: 8,
                          border: `2px solid ${selectedSlot?.id === slot.id ? "#111111" : "#eee"}`,
                          background:
                            selectedSlot?.id === slot.id ? "#eff6ff" : "white",
                          cursor: "pointer",
                          fontSize: 14,
                        }}
                      >
                        📅 {slot.date} &nbsp; ⏰ {slot.time} &nbsp; (
                        {slot.duration} min){" "}
                        {slot.price > 0 ? `· $${slot.price}` : "· Free"}
                      </div>
                    ))}
                  </div>
                )}

                <h4 style={{ marginBottom: 8 }}>Your Details</h4>
                <input
                  placeholder='Your full name'
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    setErrors({ ...errors, name: "" });
                  }}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: `1px solid ${errors.name ? "var(--pink)" : "var(--border)"}`,
                    marginBottom: 8,
                    boxSizing: "border-box",
                  }}
                />
                {errors.name && (
                  <p style={{ color: "var(--pink)", fontSize: 12, marginBottom: 8 }}>
                    {errors.name}
                  </p>
                )}

                <input
                  placeholder='Your email'
                  type='email'
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    setErrors({ ...errors, email: "" });
                  }}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: `1px solid ${errors.email ? "var(--pink)" : "var(--border)"}`,
                    marginBottom: 16,
                    boxSizing: "border-box",
                  }}
                />
                {errors.email && (
                  <p style={{ color: "var(--pink)", fontSize: 12, marginBottom: 8 }}>
                    {errors.email}
                  </p>
                )}

                <button
                  onClick={handleBook}
                  disabled={submitting || slots.length === 0}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 8,
                    border: "none",
                    background: "#111111",
                    color: "white",
                    fontSize: 16,
                    cursor: "pointer",
                    opacity: slots.length === 0 ? 0.5 : 1,
                  }}
                >
                  {submitting ? "Sending Request..." : "Request Booking →"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {registering && student && (
        <RegisterModal
          kind={registering.kind}
          item={registering.item}
          student={student}
          onClose={() => setRegistering(null)}
        />
      )}
      {showLoginPrompt && (
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
          onClick={() => setShowLoginPrompt(false)}
        >
          <div
            style={{ maxWidth: 360, width: "100%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <LoginPrompt from={location.pathname} />
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
