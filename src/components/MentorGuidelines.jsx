// src/components/MentorGuidelines.jsx
// The rules every mentor agrees to (when applying, and again during
// onboarding). Public, so parents can read them too.
import Navbar from "./Navbar";
import Footer from "./Footer";

const SECTIONS = [
  {
    title: "1. Student safety comes first",
    points: [
      "Most of our students are minors. Every mentor passes a background check before working with students.",
      "Hold every session through HappyResearch's video sessions. Don't meet students in person, and don't move sessions to other platforms.",
      "Keep all communication with students on HappyResearch or in email threads that include the student's parent or our team. Don't exchange personal phone numbers or social media contacts with students.",
      "Parents may observe any session. Never discourage a student from sharing what happens in sessions with their family.",
      "Keep conversations professional and focused on the project. Don't ask for personal information that isn't needed for the research.",
      "If a student tells you something that worries you about their safety or wellbeing, contact our team right away at happyprogramming.us@gmail.com.",
    ],
  },
  {
    title: "2. Mentor, don't do the work",
    points: [
      "The research, writing and results must be the student's own. Guide, explain, review and give feedback - but never write papers, code or results for them.",
      "Be honest about what the student did and did not do, for example in recommendation letters.",
      "Teach good research practice: cite sources, report results truthfully, and respect data privacy and research ethics.",
    ],
  },
  {
    title: "3. Be reliable",
    points: [
      "Show up on time and prepared. If you must reschedule, give at least 24 hours' notice whenever possible.",
      "Reply to students and our team within 2 business days.",
      "Finish the projects you commit to. If something changes in your life, tell us early so we can support the student.",
    ],
  },
  {
    title: "4. Be respectful and inclusive",
    points: [
      "Treat every student with patience and respect, whatever their background or starting level.",
      "No harassment, discrimination or inappropriate language - in sessions, messages or anywhere on the platform.",
    ],
  },
  {
    title: "5. Keep it on HappyResearch",
    points: [
      "Arrange and accept payment for HappyResearch students only through HappyResearch.",
      "Keep students' and families' personal information private, and don't share it outside the platform.",
    ],
  },
];

export default function MentorGuidelines() {
  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      <Navbar />
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "120px 24px 60px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", color: "#111111", margin: "0 0 10px" }}>
          Mentor Guidelines
        </h1>
        <p style={{ color: "#475569", lineHeight: 1.7, margin: "0 0 28px" }}>
          Every HappyResearch mentor agrees to these guidelines. They keep our
          students safe and make sure every project is a real learning
          experience. Breaking them can mean removal from HappyResearch.
        </p>
        {SECTIONS.map((s) => (
          <section key={s.title} style={{ background: "white", borderRadius: 14, padding: "22px 26px", marginBottom: 16, boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
            <h2 style={{ fontSize: "1.15rem", color: "#111111", margin: "0 0 12px" }}>{s.title}</h2>
            <ul style={{ margin: 0, paddingLeft: 20, color: "#334155", lineHeight: 1.75 }}>
              {s.points.map((p) => (
                <li key={p} style={{ marginBottom: 6 }}>{p}</li>
              ))}
            </ul>
          </section>
        ))}
        <p style={{ color: "#64748b", fontSize: 14 }}>
          Questions about these guidelines? Email us at happyprogramming.us@gmail.com.
        </p>
      </div>
      <Footer />
    </div>
  );
}
