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
        borderTop: "1px solid var(--rule)",
        padding: "24px 0",
      }}
    >
      <button
        onClick={onToggle}
        aria-expanded={open}
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
          fontSize: 20,
          fontWeight: 400,
          fontFamily: "var(--font-display)",
          letterSpacing: "-0.01em",
          color: "var(--text)",
          minHeight: 44,
        }}
      >
        {item.q}
        <span
          aria-hidden='true'
          style={{
            fontSize: 28,
            fontWeight: 400,
            flexShrink: 0,
            marginLeft: 16,
          }}
        >
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <p
          style={{
            marginTop: 12,
            fontSize: 17,
            color: "var(--muted)",
            lineHeight: 1.65,
            maxWidth: 720,
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
    <section id='faq' style={{ padding: "120px 24px" }}>
      <div
        style={{
          maxWidth: 1232,
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: "32px 64px",
        }}
      >
        <div className='reveal' style={{ flex: "1 1 320px" }}>
          <h2
            style={{
              fontSize: "clamp(2rem, 3.6vw, 2.9rem)",
              letterSpacing: "-0.01em",
              lineHeight: 1.15,
            }}
          >
            Questions parents ask.
          </h2>
        </div>

        <div
          style={{ flex: "2 1 520px", borderBottom: "1px solid var(--rule)" }}
        >
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
