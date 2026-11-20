// src/components/StudentResearchSection.jsx
import { useEffect, useState } from "react";
import { api, live, toMillis } from "../api";
import { useNavigate } from "react-router-dom";
import { TopicIcon } from "../utils/topicIcons";

export default function StudentResearchSection() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = () => api.get("/showcase?limit=3");
    const unsub = live(q, (rows) => {
      setEntries(
        rows
          .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)),
      );
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading || entries.length === 0) return null;

  return (
    <section style={{ padding: "120px 24px 110px 24px", background: "white" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className='reveal' style={{ textAlign: "center", marginBottom: 48 }}>
          <h2>Student Research</h2>
          <p style={{ color: "#666" }}>
            Real projects our students have finished with their mentors — not
            just what's possible, but what's already been done.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 24,
          }}
        >
          {entries.map((s) => (
            <div
              key={s.id}
              className='reveal'
              style={{
                background: "var(--bg)",
                borderRadius: 16,
                padding: 24,
                border: "1px solid var(--border)",
                cursor: "pointer",
                transition: "transform 0.25s, box-shadow 0.25s, border-color 0.25s",
              }}
              onClick={() => navigate("/showcase")}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.1)";
                e.currentTarget.style.borderColor = "#9a772b";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              <div style={{ marginBottom: 12 }}>
                {s.fileType === "image" ? (
                  <img
                    src={s.fileUrl}
                    alt={`${s.title} poster`}
                    style={{
                      width: "100%",
                      height: 120,
                      objectFit: "cover",
                      borderRadius: 10,
                    }}
                  />
                ) : (
                  <TopicIcon seed={s.id} size={38} />
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
                  marginBottom: 10,
                }}
              >
                📦 {s.outputType}
              </span>
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  marginBottom: 10,
                  color: "var(--text)",
                }}
              >
                {s.title}
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
                {s.summary}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                👤 {s.studentName}
              </p>
            </div>
          ))}
        </div>

        <div className='reveal' style={{ textAlign: "center", marginTop: 32 }}>
          <a
            href='/showcase'
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
            View All Student Work →
          </a>
        </div>
      </div>
    </section>
  );
}
