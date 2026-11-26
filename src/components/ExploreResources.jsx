// src/components/ExploreResources.jsx
// Full page shown after clicking "Explore" on the homepage's Get Started
// section - a chooser between the site's four content types.
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

const OPTIONS = [
  {
    to: "/tutors",
    icon: "🧑‍🏫",
    color: "#a0527a",
    label: "1-1 Learning",
    desc: "Book a 1-on-1 session with a mentor for general help - homework, a specific question, anything.",
  },
  {
    to: "/projects",
    icon: "💡",
    color: "#22372c",
    label: "Projects",
    desc: "Hands-on projects you build alongside a mentor, ending in something real you made.",
  },
  {
    to: "/research",
    icon: "🔬",
    color: "#6d3f6b",
    label: "Research",
    desc: "Real research topics led by PhD mentors, from idea to a finished paper or presentation.",
  },
];

export default function ExploreResources() {
  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      <Navbar />
      <div
        style={{ maxWidth: 1000, margin: "0 auto", padding: "120px 24px 80px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div
            style={{
              display: "inline-block",
              background: "#fff8dc",
              color: "#22372c",
              fontSize: 12,
              fontWeight: 700,
              padding: "4px 16px",
              borderRadius: 20,
              border: "1px solid #22372c",
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            🔎 Explore Learning Resources
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 8 }}>
            What are you looking for?
          </h1>
          <p style={{ color: "#666", fontSize: "1rem" }}>
            Pick a path below - you can always come back and try another.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 24,
          }}
        >
          {OPTIONS.map((o) => (
            <Link
              key={o.to}
              to={o.to}
              style={{
                display: "block",
                background: "white",
                borderRadius: 16,
                padding: 32,
                textDecoration: "none",
                color: "inherit",
                border: "2px solid #e2e8f0",
                transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.08)";
                e.currentTarget.style.borderColor = o.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "#e2e8f0";
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: `${o.color}22`,
                  color: o.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
                  marginBottom: 20,
                }}
              >
                {o.icon}
              </div>
              <h3
                style={{
                  fontSize: "1.3rem",
                  fontWeight: 800,
                  margin: "0 0 10px",
                  color: "#1a1a2e",
                }}
              >
                {o.label}
              </h3>
              <p
                style={{
                  color: "#666",
                  fontSize: 15,
                  lineHeight: 1.7,
                  margin: "0 0 16px",
                }}
              >
                {o.desc}
              </p>
              <span style={{ color: "#22372c", fontWeight: 700, fontSize: 14 }}>
                Browse {o.label} →
              </span>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
