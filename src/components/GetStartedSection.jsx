// src/components/GetStartedSection.jsx
// Homepage entry point offering two paths: browse the structured content
// (1-1 Learning/Projects/Research), or describe what you need and let us
// follow up - for visitors who'd rather not self-serve.
import { Link } from "react-router-dom";
import styles from "./GetStartedSection.module.css";

export default function GetStartedSection() {
  return (
    <section id='get-started' className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className='section-label'>Get started</div>
          <h2>However you'd like to begin</h2>
          <p className='section-sub' style={{ margin: "0 auto" }}>
            Browse what's available, or just tell us what you need - either
            way, we'll help you find the right fit.
          </p>
        </div>

        <div className={styles.grid}>
          <Link
            to='/research'
            className={styles.bigButton}
          >
            <span className={styles.btnTitle}>Research →</span>
            <span className={styles.btnDesc}>
              Real research topics led by PhD mentors, from idea to a
              finished paper or presentation.
            </span>
          </Link>

          <Link
            to='/projects'
            className={styles.bigButton}
          >
            <span className={styles.btnTitle}>Project →</span>
            <span className={styles.btnDesc}>
              Hands-on projects you build alongside a mentor, ending in
              something real you made.
            </span>
          </Link>

          <Link
            to='/tutors'
            className={styles.bigButton}
          >
            <span className={styles.btnTitle}>1-on-1 Learning →</span>
            <span className={styles.btnDesc}>
              Book a 1-on-1 session with a mentor for general help -
              homework, a specific question, anything.
            </span>
          </Link>

          <Link
            to='/tell-us-what-you-need'
            className={styles.bigButton}
          >
            <span className={styles.btnTitle}>On-demand Learning →</span>
            <span className={styles.btnDesc}>
              Not sure what fits? Tell us what you need and we'll help you
              find the right mentor.
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
