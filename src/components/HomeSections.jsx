// src/components/HomeSections.jsx
// The Concept C homepage blocks: live mentor strip, the four program paths,
// newest student work, and the closing "apply" band.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, live, toMillis } from "../api";
import { formatMentorName } from "../utils/mentorName";
import styles from "./HomeSections.module.css";

function initials(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function VettingCard({ wide }) {
  return (
    <div className={`${styles.vetting} ${wide ? styles.vettingWide : ""}`}>
      <p className={styles.vettingTitle}>
        Every mentor is a PhD student or above.
      </p>
      <p className={styles.vettingText}>
        Degree verified · Reviewed by our team · Background-checked before going
        live
      </p>
    </div>
  );
}

// Newest live mentors, followed by the card that says how they're checked.
export function MentorStrip() {
  const [mentors, setMentors] = useState([]);

  useEffect(
    () =>
      live(
        () => api.get("/teachers"),
        (rows) =>
          setMentors(
            rows
              .filter(
                (t) =>
                  !t.disabled && t.name && t.verificationStatus === "approved",
              )
              .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
              .slice(0, 3),
          ),
      ),
    [],
  );

  return (
    <section id='mentors' className={styles.mentors}>
      <div className={mentors.length ? styles.mentorGrid : undefined}>
        {mentors.map((m) => (
          <Link
            key={m.id}
            to={`/teacher/${m.id}`}
            className={styles.mentorCard}
          >
            {/* Initials sit underneath; a photo that fails to load hides itself. */}
            <span className={styles.mentorInitials} aria-hidden='true'>
              {initials(m.name)}
            </span>
            {m.photoURL && (
              <img
                src={m.photoURL}
                alt=''
                className={styles.mentorPhoto}
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
            <span className={styles.mentorInfo}>
              <span className={styles.mentorName}>
                {formatMentorName(m.name, {
                  mentorType: m.mentorType,
                  degree: m.degree,
                })}
              </span>
              <span className={styles.mentorMeta}>
                {[m.expertise || m.researchArea || m.major, m.university]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </span>
          </Link>
        ))}
        <VettingCard wide={mentors.length === 0} />
      </div>
      <Link to='/tutors' className={styles.textLink}>
        Meet all mentors →
      </Link>
    </section>
  );
}

const PATHS = [
  {
    to: "/research",
    title: "Research",
    label: "Write",
    cta: "See research programs",
    text: "A guided program with a mentor that ends in a paper or presentation you made.",
  },
  {
    to: "/projects",
    title: "Projects",
    label: "Build",
    cta: "See projects",
    text: "Build an app, a model or an experiment, with a mentor reviewing every step.",
  },
  {
    to: "/tutors",
    title: "1-on-1 sessions",
    label: "Book",
    cta: "Find a mentor",
    text: "Book the mentor you want for a single session or a series.",
  },
  {
    to: "/tell-us-what-you-need",
    title: "On-demand",
    label: "Ask",
    cta: "Tell us what you need",
    text: "Not sure what fits? Tell us what you need and we'll match you with the right mentor.",
  },
];

export function Paths() {
  return (
    <section id='paths' className={styles.paths}>
      <div className={styles.pathsInner}>
        <p className='section-label'>How we can help</p>
        <h2 className={styles.pathsTitle}>Pick your path.</h2>
        <div className={styles.pathGrid}>
          {PATHS.map((p, i) => (
            <Link key={p.to} to={p.to} className={styles.pathCard}>
              <span className={styles.pathNum}>
                {String(i + 1).padStart(2, "0")} / {p.label}
              </span>
              <span className={styles.pathTitle}>{p.title}</span>
              <span className={styles.pathText}>{p.text}</span>
              <span className={styles.pathMore}>
                {p.cta} <span aria-hidden='true'>→</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// Newest finished student work. Hidden until there is some.
export function StudentWork() {
  const [entries, setEntries] = useState(null);

  useEffect(
    () =>
      live(
        () => api.get("/showcase?limit=3"),
        (rows) =>
          setEntries(
            [...rows]
              .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
              .slice(0, 3),
          ),
      ),
    [],
  );

  if (!entries || entries.length === 0) return null;
  const [featured, ...rest] = entries;

  const card = (s, big) => (
    <Link
      key={s.id}
      to='/showcase'
      className={`${styles.workCard} ${big ? styles.workFeatured : ""}`}
    >
      {s.fileType === "image" && s.fileUrl && (
        <img src={s.fileUrl} alt='' className={styles.workImage} />
      )}
      <span className={styles.workInfo}>
        <span className={styles.workMeta}>
          {[s.outputType, s.studentName].filter(Boolean).join(" · ")}
        </span>
        <span className={big ? styles.workTitleBig : styles.workTitle}>
          {s.title}
        </span>
      </span>
    </Link>
  );

  return (
    <section id='work' className={styles.work}>
      <div className={styles.workHead}>
        <h2 className={styles.bigTitle}>Made by students.</h2>
        <Link to='/showcase' className={styles.textLink}>
          All student work →
        </Link>
      </div>
      <div className={styles.workGrid}>
        {card(featured, true)}
        {rest.length > 0 && (
          <div className={styles.workSide}>
            {rest.map((s) => card(s, false))}
          </div>
        )}
      </div>
    </section>
  );
}

export function ApplyBand() {
  return (
    <section className={styles.apply}>
      <div className={styles.applyInner}>
        <h2 className={styles.applyTitle}>Start with one question.</h2>
        <Link to='/student/register' className='btn-primary'>
          Start your application →
        </Link>
      </div>
    </section>
  );
}
