// src/components/ResearchSection.jsx
import { useEffect, useState } from "react";
import { api, live } from "../api";
import { useNavigate } from "react-router-dom";
import { TopicIcon } from "../utils/topicIcons";
import { LESSON_STRUCTURE_LABEL } from "../utils/format";
import { formatMentorName } from "../utils/mentorName";

const DIFFICULTY_COLOR = {
  Beginner: { color: "#1f6f4a", bg: "rgba(31,111,74,0.08)" },
  Intermediate: { color: "#22372c", bg: "rgba(154,119,43,0.1)" },
  Advanced: { color: "#a01f13", bg: "rgba(160,31,19,0.08)" },
};

export default function ResearchSection() {
  const navigate = useNavigate();
  const [research, setResearch] = useState([]);
  const [teachers, setTeachers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = () => api.get("/research?status=published&limit=6");
    const unsub = live(q, (rows) => {
      setResearch(rows);
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

  if (loading || research.length === 0) return null;

  return (
    <section style={{ padding: "120px 24px 110px 24px", background: "white" }}>
      <div style={{ maxWidth: 1300, margin: "0 auto" }}>
        <div className='reveal' style={{ textAlign: "center", marginBottom: 48 }}>
          <h2>Research Opportunities</h2>
          <p style={{ color: "#666" }}>
            Explore fascinating research ideas across science, technology, and
            beyond — spark your curiosity, discover your passion.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 24,
          }}
        >
          {research.map((r, idx) => {
            const mentor = teachers[r.teacherId];
            const difficultyStyle = DIFFICULTY_COLOR[r.difficulty];
            return (
              <div
                key={r.id}
                className='reveal'
                style={{
                  display: "flex",
                  flexDirection: "column",
                  background: "var(--bg)",
                  borderRadius: 16,
                  padding: 24,
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  transition: "transform 0.25s, box-shadow 0.25s, border-color 0.25s",
                }}
                onClick={() => navigate(`/research/${r.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.1)";
                  e.currentTarget.style.borderColor = "#22372c";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
              >
                <div style={{ marginBottom: 12 }}>
                  <TopicIcon seed={r.id} size={38} />
                </div>

                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    margin: "0 0 6px",
                  }}
                >
                  Research {String(idx + 1).padStart(2, "0")}
                </p>

                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    marginBottom: 10,
                    color: "var(--text)",
                  }}
                >
                  {r.title}
                </h3>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  {difficultyStyle && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: difficultyStyle.color,
                        background: difficultyStyle.bg,
                        padding: "2px 10px",
                        borderRadius: 20,
                      }}
                    >
                      {r.difficulty}
                    </span>
                  )}
                  {r.gradeLevel && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--primary-hover)",
                        background: "var(--surface)",
                        border: "1px solid var(--accent)",
                        padding: "2px 10px",
                        borderRadius: 20,
                      }}
                    >
                      🎓 {r.gradeLevel}
                    </span>
                  )}
                </div>

                <p
                  style={{
                    fontSize: 13,
                    color: "#555",
                    lineHeight: 1.5,
                    marginBottom: 12,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {r.idea}
                </p>

                <p
                  style={{
                    fontSize: 12,
                    color: "var(--muted)",
                    fontWeight: 600,
                    margin: "0 0 4px",
                  }}
                >
                  🕐 {LESSON_STRUCTURE_LABEL}
                </p>

                {mentor?.name && (
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      fontWeight: 600,
                      margin: "0 0 16px",
                    }}
                  >
                    👩‍🏫{" "}
                    {formatMentorName(mentor.name, {
                      mentorType: mentor.mentorType,
                      degree: mentor.degree,
                    })}
                  </p>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/research/${r.id}`);
                  }}
                  style={{
                    marginTop: "auto",
                    padding: "10px 0",
                    borderRadius: 10,
                    border: "none",
                    background: "#22372c",
                    color: "white",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Explore Project →
                </button>
              </div>
            );
          })}
        </div>

        <div className='reveal' style={{ textAlign: "center", marginTop: 32 }}>
          <a
            href='/research'
            style={{
              display: "inline-block",
              padding: "12px 32px",
              borderRadius: 32,
              background: "#22372c",
              color: "white",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 15,
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(17,17,17,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            View All Research →
          </a>
        </div>
      </div>
    </section>
  );
}
