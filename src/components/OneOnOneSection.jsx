// src/components/OneOnOneSection.jsx
import { useEffect, useState } from "react";
import { api, live } from "../api";
import { useNavigate } from "react-router-dom";
import InitialsAvatar from "./InitialsAvatar";
import { formatMentorName } from "../utils/mentorName";

export default function OneOnOneSection() {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = live(() => api.get("/teachers"), (rows) => {
      const data = rows
        .filter((t) => !t.disabled && t.name && t.verificationStatus === "approved");
      data.sort((a, b) => {
        const ratingA = typeof a.rating === "number" ? a.rating : -1;
        const ratingB = typeof b.rating === "number" ? b.rating : -1;
        if (ratingB !== ratingA) return ratingB - ratingA;
        return (b.photoURL ? 1 : 0) - (a.photoURL ? 1 : 0);
      });
      setMentors(data.slice(0, 3));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading || mentors.length === 0) return null;

  return (
    <section style={{ padding: "120px 24px 110px 24px", background: "white" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className='reveal' style={{ textAlign: "center", marginBottom: 48 }}>
          <h2>1-on-1 Learning</h2>
          <p style={{ color: "#666" }}>
            Book time with a mentor for general help — homework, a specific
            question, or just someone to talk through an idea with.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 24,
          }}
        >
          {mentors.map((m) => (
            <div
              key={m.id}
              className='reveal'
              style={{
                background: "var(--bg)",
                borderRadius: 16,
                padding: 24,
                border: "1px solid var(--border)",
                cursor: "pointer",
                transition: "transform 0.25s, box-shadow 0.25s, border-color 0.25s",
              }}
              onClick={() => {
                navigate(`/teacher/${m.id}`);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.1)";
                e.currentTarget.style.borderColor = "#a0527a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              <div style={{ marginBottom: 12 }}>
                {m.photoURL ? (
                  <img
                    src={m.photoURL}
                    alt={m.name}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <InitialsAvatar
                    name={m.name}
                    seed={m.id}
                    style={{ width: 38, height: 38, borderRadius: 10 }}
                    fontSize='0.9rem'
                  />
                )}
              </div>
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  marginBottom: 10,
                  color: "var(--text)",
                }}
              >
                {formatMentorName(m.name, {
                  mentorType: m.mentorType,
                  degree: m.degree,
                })}
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
                {m.bio || "Available for 1-on-1 mentoring sessions."}
              </p>
              {m.expertise && (
                <p
                  style={{
                    fontSize: 12,
                    color: "#1f6f4a",
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  💡 {m.expertise}
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
                🧑‍🏫 1-on-1 sessions available
              </p>
            </div>
          ))}
        </div>

        <div className='reveal' style={{ textAlign: "center", marginTop: 32 }}>
          <a
            href='/tutors'
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
            View All Mentors →
          </a>
        </div>
      </div>
    </section>
  );
}
