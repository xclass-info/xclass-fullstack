// src/components/MentorGuidelines.jsx
// The rules every mentor agrees to (when applying, and again during
// onboarding). Public, so parents can read them too.
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import styles from "./MentorGuidelines.module.css";

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
    <div className={styles.page}>
      <Navbar />

      <header className={`${styles.wrap} ${styles.hero}`}>
        <div>
          <p className='section-label'>For mentors and parents</p>
          <h1 className={styles.h1}>Mentor guidelines.</h1>
        </div>
        <p className={styles.sub}>
          Every HappyResearch mentor agrees to these guidelines. They keep our
          students safe and make sure every project is a real learning
          experience. Breaking them can mean removal from HappyResearch.
        </p>
      </header>

      <main className={styles.wrap}>
        <ol className={styles.sections}>
          {SECTIONS.map((s, i) => {
            // "1. Student safety comes first" -> number + title
            const title = s.title.replace(/^\d+\.\s*/, "");
            return (
              <li key={s.title} className={styles.section}>
                <div className={styles.sectionHead}>
                  <span className={styles.num}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className={styles.title}>{title}</h2>
                </div>
                <ul className={styles.points}>
                  {s.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      </main>

      <section className={styles.band}>
        <div className={`${styles.wrap} ${styles.bandInner}`}>
          <p className='section-label'>Questions?</p>
          <h2 className={styles.bandTitle}>We're happy to talk it through.</h2>
          <p className={styles.bandSub}>
            Email us at{" "}
            <a href='mailto:happyprogramming.us@gmail.com'>
              happyprogramming.us@gmail.com
            </a>
            .
          </p>
          <Link to='/become-a-mentor' className='btn-primary'>
            Apply to mentor →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
