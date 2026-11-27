// src/components/ExploreResources.jsx
// /explore - a chooser between the site's four ways to work with a mentor,
// in the same tinted-card style as the homepage's "Pick your path".
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import styles from "./ExploreResources.module.css";

const OPTIONS = [
  {
    to: "/research",
    label: "Write",
    title: "Research",
    desc: "Real research topics led by PhD mentors, from idea to a finished paper or presentation.",
    cta: "See research programs",
  },
  {
    to: "/projects",
    label: "Build",
    title: "Projects",
    desc: "Hands-on projects you build alongside a mentor, ending in something real you made.",
    cta: "See projects",
  },
  {
    to: "/tutors",
    label: "Book",
    title: "1-on-1 sessions",
    desc: "Book a 1-on-1 session with a mentor for general help - homework, a specific question, anything.",
    cta: "Find a mentor",
  },
  {
    to: "/tell-us-what-you-need",
    label: "Ask",
    title: "On-demand",
    desc: "Not sure what fits? Tell us what you need and we'll match you with the right mentor.",
    cta: "Tell us what you need",
  },
];

export default function ExploreResources() {
  return (
    <div className={styles.page}>
      <Navbar />

      <header className={`${styles.wrap} ${styles.hero}`}>
        <div>
          <p className='section-label'>Explore</p>
          <h1 className={styles.h1}>What are you looking for?</h1>
        </div>
        <p className={styles.sub}>
          Pick a path below - you can always come back and try another.
        </p>
      </header>

      <main className={`${styles.wrap} ${styles.body}`}>
        <div className={styles.grid}>
          {OPTIONS.map((o, i) => (
            <Link key={o.to} to={o.to} className={styles.card}>
              <span className={styles.num}>
                {String(i + 1).padStart(2, "0")} / {o.label}
              </span>
              <span className={styles.title}>{o.title}</span>
              <span className={styles.desc}>{o.desc}</span>
              <span className={styles.more}>
                {o.cta} <span aria-hidden='true'>→</span>
              </span>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
