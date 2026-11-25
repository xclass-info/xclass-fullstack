// src/components/ShowcaseListing.jsx
// Public proof-of-outcomes page: finished student projects, published by
// mentors from their dashboard's Showcase tab.
import { useEffect, useState } from "react";
import { api, live, toMillis, formatDate } from "../api";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { Link } from "react-router-dom";
import { SkeletonClassCard } from "./Skeleton";
import { formatMentorName } from "../utils/mentorName";
import { DELIVERABLE_OPTIONS } from "../utils/deliverables";
import { useScrollReveal } from "../utils/useScrollReveal";
import { TopicIcon } from "../utils/topicIcons";

function ShowcaseDetailModal({ entry, mentorLabel, onClose }) {
  return (
    <div
      onClick={onClose}
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
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: 12,
          padding: 32,
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--mint)",
              background: "rgba(31,111,74,0.08)",
              padding: "3px 10px",
              borderRadius: 20,
            }}
          >
            📦 {entry.outputType}
          </span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}
          >
            ✕
          </button>
        </div>

        {entry.fileType === "image" ? (
          <img
            src={entry.fileUrl}
            alt={`${entry.title} poster`}
            style={{
              width: "100%",
              maxHeight: 320,
              objectFit: "cover",
              borderRadius: 10,
              marginBottom: 16,
            }}
          />
        ) : (
          <div style={{ marginBottom: 16 }}>
            <TopicIcon seed={entry.id} />
          </div>
        )}

        <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 20, marginBottom: 8, color: "#1a1a2e" }}>
          {entry.title}
        </h2>

        <p style={{ fontSize: 13, color: "#888", margin: "0 0 4px" }}>
          👤 {entry.studentName}
        </p>
        <p style={{ fontSize: 13, color: "#888", margin: "0 0 16px" }}>
          👩‍🏫 Mentored by: {mentorLabel(entry)}
        </p>

        <p style={{ fontSize: 14, color: "#444", lineHeight: 1.7, marginBottom: 20 }}>
          {entry.summary}
        </p>

        {entry.createdAt && (
          <p style={{ fontSize: 12, color: "#aaa", marginBottom: 20 }}>
            Published {formatDate(entry.createdAt)}
          </p>
        )}

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {entry.fileType === "pdf" && (
            <a
              href={entry.fileUrl}
              target='_blank'
              rel='noreferrer'
              style={{ fontSize: 13, color: "#111111", fontWeight: 600, textDecoration: "none" }}
            >
              📄 View Paper (PDF) →
            </a>
          )}
          {entry.outputUrl && (
            <a
              href={entry.outputUrl}
              target='_blank'
              rel='noreferrer'
              style={{ fontSize: 13, color: "#111111", fontWeight: 600, textDecoration: "none" }}
            >
              View work →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShowcaseListing() {
  const [entries, setEntries] = useState([]);
  const [teachers, setTeachers] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const pageRef = useScrollReveal([loading, entries]);

  useEffect(() => {
    const unsub = live(() => api.get("/showcase"), (rows) => {
      setEntries(
        rows
          .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)),
      );
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    api
      .get("/teachers")
      .then((rows) => {
        const map = {};
        rows.forEach((t) => {
          map[t.id] = t;
        });
        setTeachers(map);
      })
      .catch((err) => console.error(err));
  }, []);

  function mentorLabel(s) {
    const liveMentor = teachers[s.teacherId];
    const name = liveMentor?.name
      ? formatMentorName(liveMentor.name, {
          mentorType: liveMentor.mentorType,
          degree: liveMentor.degree,
        })
      : s.teacherName && s.teacherName !== "Teacher"
        ? s.teacherName
        : "Mentor";
    if (!liveMentor?.name) return name;
    return (
      <Link
        to={`/teacher/${s.teacherId}`}
        onClick={(e) => e.stopPropagation()}
        style={{ color: "#111111", textDecoration: "underline" }}
      >
        {name}
      </Link>
    );
  }

  const filtered =
    filter === "all" ? entries : entries.filter((e) => e.outputType === filter);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
        <Navbar />
        <div
          style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 24px 48px" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 24,
            }}
          >
            {[1, 2, 3].map((i) => (
              <SkeletonClassCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={pageRef} style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div
        style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 24px 48px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 className="page-title">Student Work</h1>
          <p className="page-sub">
            Real projects our students have finished with their mentors - not
            just what's possible, but what's already been done.
          </p>
        </div>

        {entries.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 32,
            }}
          >
            <button
              onClick={() => setFilter("all")}
              style={{
                padding: "8px 16px",
                borderRadius: 20,
                border: "1px solid " + (filter === "all" ? "#111111" : "#ddd"),
                background: filter === "all" ? "#111111" : "white",
                color: filter === "all" ? "white" : "#555",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              All
            </button>
            {DELIVERABLE_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setFilter(d)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 20,
                  border: "1px solid " + (filter === d ? "#111111" : "#ddd"),
                  background: filter === d ? "#111111" : "white",
                  color: filter === d ? "white" : "#555",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {d}
              </button>
            ))}
          </div>
        )}

        {entries.length === 0 ? (
          <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>
            <p>😴 No finished projects published yet. Check back soon!</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--muted)", padding: 40 }}>
            <p>No projects with that output type yet.</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 24,
            }}
          >
            {filtered.map((s, idx) => (
              <div
                key={s.id}
                className='reveal'
                style={{
                  background: "white",
                  borderRadius: 12,
                  padding: 24,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                  transition:
                    "transform 0.2s, box-shadow 0.2s, opacity 0.6s ease, transform 0.6s ease",
                  transitionDelay: `${Math.min(idx, 8) * 60}ms`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)";
                }}
              >
                <div style={{ marginBottom: 14 }}>
                  {s.fileType === "image" ? (
                    <img
                      src={s.fileUrl}
                      alt={`${s.title} poster`}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(s.fileUrl, "_blank", "noopener,noreferrer");
                      }}
                      style={{
                        width: "100%",
                        height: 140,
                        objectFit: "cover",
                        borderRadius: 10,
                        cursor: "pointer",
                      }}
                    />
                  ) : (
                    <TopicIcon seed={s.id} />
                  )}
                </div>
                <span
                  style={{
                    display: "inline-block",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--mint)",
                    background: "rgba(31,111,74,0.08)",
                    padding: "3px 10px",
                    borderRadius: 20,
                    marginBottom: 12,
                  }}
                >
                  📦 {s.outputType}
                </span>

                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    marginBottom: 8,
                    color: "#333",
                  }}
                >
                  {s.title}
                </h3>

                <p style={{ fontSize: 13, color: "#888", margin: "0 0 12px" }}>
                  👤 {s.studentName}
                </p>

                <p
                  style={{
                    fontSize: 13,
                    color: "#555",
                    margin: "0 0 16px",
                    lineHeight: 1.6,
                    display: "-webkit-box",
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {s.summary}
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 12, color: "#888" }}>
                    👩‍🏫 Mentored by: {mentorLabel(s)}
                  </span>
                  <span style={{ display: "flex", gap: 12 }}>
                    {s.fileType === "pdf" && (
                      <a
                        href={s.fileUrl}
                        target='_blank'
                        rel='noreferrer'
                        style={{
                          fontSize: 12,
                          color: "#111111",
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        📄 View Paper (PDF) →
                      </a>
                    )}
                    {s.outputUrl && (
                      <a
                        href={s.outputUrl}
                        target='_blank'
                        rel='noreferrer'
                        style={{
                          fontSize: 12,
                          color: "#111111",
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        View work →
                      </a>
                    )}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEntry(s);
                  }}
                  style={{
                    width: "100%",
                    marginTop: 16,
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--bg)",
                    color: "var(--text)",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  See More →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedEntry && (
        <ShowcaseDetailModal
          entry={selectedEntry}
          mentorLabel={mentorLabel}
          onClose={() => setSelectedEntry(null)}
        />
      )}

      <Footer />
    </div>
  );
}
