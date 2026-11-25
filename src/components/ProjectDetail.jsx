// src/components/ProjectDetail.jsx
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

export default function ProjectDetail() {
  const { projectId } = useParams();
  const location = useLocation();
  const { student } = useStudentAuth();
  const [project, setProject] = useState(undefined); // undefined = loading
  const [mentor, setMentor] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

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
        const data = await getOrNull(`/projects/${seg(projectId)}`);
        if (!data) {
          if (!cancelled) setProject(null);
          return;
        }
        if (!cancelled) setProject(data);
        const teacher = data.teacherId
          ? await getOrNull(`/teachers/${seg(data.teacherId)}`)
          : null;
        if (!cancelled && teacher?.name) setMentor(teacher);
      } catch (err) {
        console.error(err);
        if (!cancelled) setProject(null);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const pageStyle = { minHeight: "100vh", background: "#f9fafb" };
  const wrapStyle = {
    maxWidth: 820,
    margin: "0 auto",
    padding: "100px 24px 48px",
  };

  if (project === undefined) {
    return (
      <div style={pageStyle}>
        <Navbar />
        <div style={{ ...wrapStyle, textAlign: "center", color: "#aaa" }}>
          Loading project...
        </div>
      </div>
    );
  }

  if (project === null) {
    return (
      <div style={pageStyle}>
        <Navbar />
        <div style={{ ...wrapStyle, textAlign: "center" }}>
          <p>Project not found.</p>
          <Link to='/projects' style={{ color: "#111111" }}>
            ← Back to all projects
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
    : project.teacherName && project.teacherName !== "Teacher"
      ? project.teacherName
      : "Mentor";

  return (
    <div style={pageStyle}>
      <Navbar />
      <div style={wrapStyle}>
        <Link
          to='/projects'
          style={{
            color: "#111111",
            fontSize: 14,
            textDecoration: "none",
            display: "inline-block",
            marginBottom: 20,
          }}
        >
          ← All Projects
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
            {project.title}
          </h1>

          {project.difficulty && (
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
              {project.difficulty}
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

          {toPrereqArray(project.prerequisites).length > 0 && (
            <p
              style={{
                fontSize: 14,
                color: "#888",
                margin: "0 0 16px",
              }}
            >
              ✅ Prerequisites: {toPrereqArray(project.prerequisites).join(", ")}
            </p>
          )}

          {project.seats ? (
            <div style={{ marginBottom: 24 }}>
              <SeatsRow
                kind='project'
                item={project}
                onRegister={openRegister}
              />
              {showLoginPrompt && <LoginPrompt from={location.pathname} />}
            </div>
          ) : null}

          <div style={{ marginBottom: 28 }}>
            <p style={sectionLabel}>Project Description</p>
            <p style={{ ...sectionBody, background: "#f9fafb" }}>
              {project.description}
            </p>
          </div>

          <InfoSlide kind='project' item={project} />

          <div style={{ marginBottom: 8 }}>
            <p style={sectionLabel}>What Students Will Learn</p>
            <p
              style={{
                ...sectionBody,
                background: "#f0fdf4",
                borderLeft: "3px solid #1f6f4a",
              }}
            >
              {project.learning}
            </p>
          </div>

          {project.details && (
            <div style={{ marginBottom: 8 }}>
              <p style={sectionLabel}>Additional Details</p>
              <p style={{ ...sectionBody, background: "#f9fafb" }}>
                {project.details}
              </p>
            </div>
          )}

          {project.scheduleStartDate && project.scheduleTime && (
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
                  {locationLabel(project.scheduleLocation)}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {computeLessonDates(
                    project.scheduleStartDate,
                    project.scheduleTime,
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
          kind='project'
          item={project}
          student={student}
          onClose={() => setRegistering(false)}
        />
      )}
      <Footer />
    </div>
  );
}
