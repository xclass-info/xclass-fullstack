// src/components/FAQSection.jsx
import { useState } from "react";
import { LESSON_STRUCTURE_LABEL } from "../utils/format";

const FAQS = [
  {
    q: "Are the mentors really PhD-level?",
    a: "Yes. Every mentor goes through a verification process — a transcript, a degree certificate, or a verified university email — before they're approved to post a project or take students.",
  },
  {
    q: "What ages or grade levels is this for?",
    a: "Students of all ages and grade levels, from middle school through college.",
  },
  {
    q: "How long is a typical program?",
    a: `Research and project programs run ${LESSON_STRUCTURE_LABEL}. 1-on-1 tutoring and On-demand Learning are flexible and scheduled around what you need.`,
  },
  {
    q: "Is this online or in person?",
    a: "Both. Most mentors offer online sessions, and some also meet in person depending on location — you'll see each program's format before you apply.",
  },
  {
    q: "What if my child doesn't know what topic they want to explore?",
    a: "That's exactly what On-demand Learning is for — tell us what they're interested in and we'll help find the right mentor and fit.",
  },
  {
    q: "How much does it cost?",
    a: "Pricing depends on the program and mentor. Reach out through Contact Us and we'll walk you through the options.",
  },
];

function FAQItem({ item, open, onToggle }) {
  return (
    <div
      className='reveal'
      style={{
        borderBottom: "1px solid var(--border)",
        padding: "20px 0",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          textAlign: "left",
          fontSize: 19,
          fontWeight: 700,
          color: "var(--text)",
        }}
      >
        {item.q}
        <span style={{ color: "#9a772b", fontSize: 22, flexShrink: 0, marginLeft: 16 }}>
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <p
          style={{
            marginTop: 12,
            fontSize: 16,
            color: "#555",
            lineHeight: 1.7,
          }}
        >
          {item.a}
        </p>
      )}
    </div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section style={{ padding: "120px 24px 110px 24px", background: "white" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className='reveal' style={{ textAlign: "center", marginBottom: 48 }}>
          <h2>Frequently Asked Questions</h2>
          <p style={{ color: "#666", fontSize: 17 }}>
            Common questions from parents and students.
          </p>
        </div>

        <div>
          {FAQS.map((item, i) => (
            <FAQItem
              key={item.q}
              item={item}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
