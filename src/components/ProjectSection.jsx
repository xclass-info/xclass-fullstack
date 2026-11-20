// src/components/ProjectSection.jsx
import { useEffect, useState } from "react";
import { api, live } from "../api";
import { useNavigate } from "react-router-dom";
import { TopicIcon } from "../utils/topicIcons";
import { LESSON_STRUCTURE_LABEL } from "../utils/format";

export default function ProjectSection() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = () => api.get("/projects?limit=3");
    const unsub = live(q, (rows) => {
      setProjects(rows);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading || projects.length === 0) return null;

  return (
    <section style={{ padding: "120px 24px 110px 24px", background: "var(--bg)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className='reveal' style={{ textAlign: "center", marginBottom: 48 }}>
          <h2>Project Opportunities</h2>
          <p style={{ color: "#666" }}>
            Build something real alongside a mentor — hands-on projects you
            can point to and say, I made this.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 24,
          }}
        >
          {projects.map((p) => (
            <div
              key={p.id}
              className='reveal'
              style={{
                background: "white",
                borderRadius: 16,
                padding: 24,
                border: "1px solid var(--border)",
                cursor: "pointer",
                transition: "transform 0.25s, box-shadow 0.25s, border-color 0.25s",
              }}
              onClick={() => {
                navigate(`/projects/${p.id}`);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.1)";
                e.currentTarget.style.borderColor = "#427e94";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              <div style={{ marginBottom: 12 }}>
                <TopicIcon seed={p.id} size={38} />
              </div>
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  marginBottom: 10,
                  color: "var(--text)",
                }}
              >
                {p.title}
              </h3>
              <p
                style={{
                  fontSize: 13,
                  color: "#555",
                  lineHeight: 1.5,
                  marginBottom: 10,
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {p.description}
              </p>
              {p.deliverable && (
                <p
                  style={{
                    fontSize: 12,
                    color: "#1f6f4a",
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  📦 You'll produce: {p.deliverable}
                </p>
              )}
              <p
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  fontWeight: 600,
                  margin: "8px 0 0",
                }}
              >
                🕐 {LESSON_STRUCTURE_LABEL}
              </p>
            </div>
          ))}
        </div>

        <div className='reveal' style={{ textAlign: "center", marginTop: 32 }}>
          <a
            href='/projects'
            style={{
              display: "inline-block",
              padding: "12px 32px",
              borderRadius: 32,
              background: "#2f6175",
              color: "white",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 15,
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(47, 97, 117,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            View All Projects →
          </a>
        </div>
      </div>
    </section>
  );
}
