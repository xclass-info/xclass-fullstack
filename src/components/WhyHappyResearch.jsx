// src/components/WhyHappyResearch.jsx
const REASONS = [
  {
    emoji: "🎓",
    title: "PhD-Verified Mentors",
    desc: "Every mentor is a PhD student, graduate, or faculty member — verified before they can post a project or take students.",
  },
  {
    emoji: "🧭",
    title: "Flexible, Not One-Size-Fits-All",
    desc: "Research, hands-on projects, 1-on-1 tutoring, or something custom — pick the format that fits how your child learns.",
  },
  {
    emoji: "📄",
    title: "Real, Finished Outcomes",
    desc: "Students walk away with a paper, a project, or a portfolio piece — not just a certificate of attendance.",
  },
  {
    emoji: "🌍",
    title: "Any Research Area, 100% Online",
    desc: "Neuroscience, AI, public policy, art history, and more — we'll match you with a mentor who knows the field.",
  },
];

export default function WhyHappyResearch() {
  return (
    <section style={{ padding: "120px 24px 110px 24px", background: "var(--bg)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className='reveal' style={{ textAlign: "center", marginBottom: 48 }}>
          <h2>Why HappyResearch</h2>
          <p style={{ color: "#666" }}>
            What makes mentorship here different from a class or a camp.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 24,
          }}
        >
          {REASONS.map((r) => (
            <div
              key={r.title}
              className='reveal'
              style={{
                background: "white",
                borderRadius: 16,
                padding: 28,
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 14 }}>{r.emoji}</div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  marginBottom: 8,
                  color: "var(--text)",
                }}
              >
                {r.title}
              </h3>
              <p style={{ fontSize: 13.5, color: "#555", lineHeight: 1.6, margin: 0 }}>
                {r.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
