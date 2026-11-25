// src/components/ResearchDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { getOrNull, seg } from "../api";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { formatMentorName } from "../utils/mentorName";
import { computeLessonDates, formatLessonSlot, locationLabel } from "../utils/schedule";
import InfoSlide from "./InfoSlide";
import { SeatsRow, RegisterModal, LoginPrompt } from "./RegisterControls";
import { useStudentAuth } from "../utils/useStudentAuth";
import { toPrereqArray } from "../utils/prerequisites";

const sectionLabel = {
  fontSize: 12,
  color: "#aaa",
  margin: "0 0 8px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const sectionBody = {
  fontSize: 16,
  color: "#444",
  lineHeight: 1.8,
  margin: 0,
  padding: 18,
  borderRadius: 10,
  whiteSpace: "pre-wrap",
};

export default function ResearchDetail() {
  const { researchId } = useParams();
  const location = useLocation();
  const { student } = useStudentAuth();
  const [research, setResearch] = useState(undefined); // undefined = loading
  const [mentor, setMentor] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Registering requires a logged-in student account, so it can be tied to
  // the student's record and reliably show up on their dashboard. Rather
  // than silently redirecting to login with no warning, show an inline
  // prompt so the choice (log in vs sign up) is explicit.
  function openRegister() {
    if (!student) {
      setShowLoginPrompt(true);
      return;
    }
    setRegistering(true);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getOrNull(`/research/${seg(researchId)}`);
        // Only published research is public, same as the listing page.
        if (!data || data.status !== "published") {
          if (!cancelled) setResearch(null);
          return;
        }
        if (!cancelled) setResearch(data);
        const teacher = data.teacherId
          ? await getOrNull(`/teachers/${seg(data.teacherId)}`)
          : null;
        if (!cancelled && teacher?.name) setMentor(teacher);
      } catch (err) {
        console.error(err);
        if (!cancelled) setResearch(null);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [researchId]);

  const pageStyle = { minHeight: "100vh", background: "#f9fafb" };
  const wrapStyle = {
    maxWidth: 820,
    margin: "0 auto",
    padding: "100px 24px 48px",
  };

  if (research === undefined) {
    return (
      <div style={pageStyle}>
        <Navbar />
        <div style={{ ...wrapStyle, textAlign: "center", color: "#aaa" }}>
          Loading research...
        </div>
      </div>
    );
  }

  if (research === null) {
    return (
      <div style={pageStyle}>
        <Navbar />
        <div style={{ ...wrapStyle, textAlign: "center" }}>
          <p>Research not found.</p>
          <Link to='/research' style={{ color: "#111111" }}>
            ← Back to all research
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const mentorLabel = mentor
    ? formatMentorName(mentor.name, {
        mentorType: mentor.mentorType,
        degree: mentor.degree,
      })
    : research.teacherName && research.teacherName !== "Teacher"
      ? research.teacherName
      : "Mentor";

  return (
    <div style={pageStyle}>
      <Navbar />
      <div style={wrapStyle}>
        <Link
          to='/research'
          style={{
            color: "#111111",
            fontSize: 14,
            textDecoration: "none",
            display: "inline-block",
            marginBottom: 20,
          }}
        >
          ← All Research
        </Link>

        <div
          style={{
            background: "white",
            borderRadius: 20,
            padding: "40px 44px",
            border: "1px solid var(--border)",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "2.2rem",
              fontWeight: 600,
              lineHeight: 1.2,
              margin: "0 0 16px",
              color: "var(--ink)",
            }}
          >
            {research.title}
          </h1>

          {research.difficulty && (
            <span
              style={{
                display: "inline-block",
                fontSize: 12,
                fontWeight: 700,
                color: "#111111",
                background: "rgba(154, 119, 43, 0.1)",
                padding: "4px 12px",
                borderRadius: 20,
                marginBottom: 10,
              }}
            >
              {research.difficulty}
            </span>
          )}

          <p style={{ fontSize: 15, color: "#888", margin: "0 0 8px" }}>
            👩‍🏫 Mentored by:{" "}
            {mentor ? (
              <Link
                to={`/teacher/${mentor.id}`}
                style={{ color: "#111111", textDecoration: "underline" }}
              >
                {mentorLabel}
              </Link>
            ) : (
              mentorLabel
            )}
          </p>

          {toPrereqArray(research.prerequisites).length > 0 && (
            <p
              style={{
                fontSize: 14,
                color: "#888",
                margin: "0 0 16px",
              }}
            >
              ✅ Prerequisites: {toPrereqArray(research.prerequisites).join(", ")}
            </p>
          )}

          {research.seats ? (
            <div style={{ marginBottom: 24 }}>
              <SeatsRow
                kind='research'
                item={research}
                onRegister={openRegister}
              />
              {showLoginPrompt && <LoginPrompt from={location.pathname} />}
            </div>
          ) : null}

          <div style={{ marginBottom: 28 }}>
            <p style={sectionLabel}>Research Idea</p>
            <p style={{ ...sectionBody, background: "#f9fafb" }}>
              {research.idea}
            </p>
          </div>

          <InfoSlide kind='research' item={research} />

          <div style={{ marginBottom: 28 }}>
            <p style={sectionLabel}>Research Impact</p>
            <p
              style={{
                ...sectionBody,
                background: "#f0fdf4",
                borderLeft: "3px solid #1f6f4a",
              }}
            >
              {research.impact}
            </p>
          </div>

          {research.details && (
            <div style={{ marginBottom: 8 }}>
              <p style={sectionLabel}>Additional Details</p>
              <p style={{ ...sectionBody, background: "#f9fafb" }}>
                {research.details}
              </p>
            </div>
          )}

          {research.scheduleStartDate && research.scheduleTime && (
            <div style={{ marginBottom: 8 }}>
              <p style={sectionLabel}>Schedule</p>
              <div style={{ background: "#f9fafb", borderRadius: 10, padding: 18 }}>
                <p
                  style={{
                    margin: "0 0 12px",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--primary-hover)",
                  }}
                >
                  {locationLabel(research.scheduleLocation)}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {computeLessonDates(
                    research.scheduleStartDate,
                    research.scheduleTime,
                  ).map((d, i) => (
                    <div
                      key={i}
                      style={{ display: "flex", gap: 10, fontSize: 14, color: "var(--muted)" }}
                    >
                      <span style={{ fontWeight: 700, color: "var(--text)", minWidth: 72 }}>
                        Lesson {i + 1}
                      </span>
                      <span>{formatLessonSlot(d)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {registering && student && (
        <RegisterModal
          kind='research'
          item={research}
          student={student}
          onClose={() => setRegistering(false)}
        />
      )}
      <Footer />
    </div>
  );
}
