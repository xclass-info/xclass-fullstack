// src/components/ShowcaseListing.jsx
// Public proof-of-outcomes page: finished student projects, published by
// mentors from their dashboard's Showcase tab. Big header, output-type
// filter chips, a card grid, and a detail dialog per entry.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, live, toMillis, formatDate } from "../api";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { formatMentorName } from "../utils/mentorName";
import { safeUrl } from "../utils/format";
import { DELIVERABLE_OPTIONS } from "../utils/deliverables";
import { pickIcon } from "../utils/topicIcons";
import list from "./ProgramListing.module.css";
import reg from "./RegisterControls.module.css";
import styles from "./ShowcaseListing.module.css";

// Poster image when there is one, otherwise a bold block with a topic icon
// (lime or ink, picked from the entry id so it stays the same).
function Cover({ entry, large = false }) {
  const [failed, setFailed] = useState(false);
  if (entry.fileType === "image" && entry.fileUrl && !failed) {
    return (
      <div className={`${styles.cover} ${large ? styles.coverLarge : ""}`}>
        <img
          src={entry.fileUrl}
          alt={`${entry.title} poster`}
          className={styles.coverImg}
          onError={() => setFailed(true)}
        />
      </div>
    );
  }
  const { Icon, teal } = pickIcon(entry.id);
  return (
    <div
      className={`${styles.cover} ${large ? styles.coverLarge : ""} ${teal ? styles.coverDark : styles.coverLime}`}
      aria-hidden='true'
    >
      <Icon size={large ? 72 : 56} />
    </div>
  );
}

function Links({ entry }) {
  const pdf = entry.fileType === "pdf" ? safeUrl(entry.fileUrl) : null;
  const work = safeUrl(entry.outputUrl);
  if (!pdf && !work) return null;
  return (
    <div className={styles.links}>
      {pdf && (
        <a href={pdf} target='_blank' rel='noreferrer' className='btn-primary'>
          Read the paper (PDF) →
        </a>
      )}
      {work && (
        <a
          href={work}
          target='_blank'
          rel='noreferrer'
          className={pdf ? "btn-ghost" : "btn-primary"}
        >
          View the work →
        </a>
      )}
    </div>
  );
}

function DetailDialog({ entry, mentor, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={reg.overlay} onClick={onClose}>
      <div
        className={styles.dialog}
        role='dialog'
        aria-modal='true'
        aria-labelledby='work-title'
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type='button'
          className={`${reg.close} ${styles.dialogClose}`}
          onClick={onClose}
          aria-label='Close'
        >
          ✕
        </button>
        <Cover entry={entry} large />
        <div className={styles.dialogBody}>
          {entry.outputType && (
            <p className={styles.type}>{entry.outputType}</p>
          )}
          <h2 id='work-title' className={styles.dialogTitle}>
            {entry.title}
          </h2>
          <p className={styles.byline}>
            {entry.studentName && <>By {entry.studentName} · </>}
            Mentored by {mentor}
          </p>
          {entry.summary && <p className={styles.summary}>{entry.summary}</p>}
          {entry.createdAt && (
            <p className={styles.date}>
              Published {formatDate(entry.createdAt)}
            </p>
          )}
          <Links entry={entry} />
        </div>
      </div>
    </div>
  );
}

export default function ShowcaseListing() {
  const [entries, setEntries] = useState([]);
  const [teachers, setTeachers] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const unsub = live(
      () => api.get("/showcase"),
      (rows) => {
        setEntries(
          [...rows].sort(
            (a, b) => toMillis(b.createdAt) - toMillis(a.createdAt),
          ),
        );
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    api
      .get("/teachers")
      .then((rows) => {
        const map = {};
        rows.forEach((t) => {
          map[t.id] = t;
        });
        setTeachers(map);
      })
      .catch((err) => console.error(err));
  }, []);

  // The mentor's name, linked to their profile while they're live.
  function mentorLabel(s, { link = true } = {}) {
    const t = teachers[s.teacherId];
    const isLive =
      t?.name && t.verificationStatus === "approved" && !t.disabled;
    const name = t?.name
      ? formatMentorName(t.name, { mentorType: t.mentorType, degree: t.degree })
      : s.teacherName && s.teacherName !== "Teacher"
        ? s.teacherName
        : "a HappyResearch mentor";
    if (!isLive || !link) return name;
    return (
      <Link
        to={`/teacher/${s.teacherId}`}
        className={styles.mentorLink}
        onClick={(e) => e.stopPropagation()}
      >
        {name}
      </Link>
    );
  }

  // Only offer chips for output types that actually have work.
  const counts = entries.reduce((acc, e) => {
    acc[e.outputType] = (acc[e.outputType] || 0) + 1;
    return acc;
  }, {});
  const types = [
    ...DELIVERABLE_OPTIONS.filter((d) => counts[d]),
    ...Object.keys(counts).filter(
      (d) => d && d !== "undefined" && !DELIVERABLE_OPTIONS.includes(d),
    ),
  ];
  const filtered =
    filter === "all" ? entries : entries.filter((e) => e.outputType === filter);

  return (
    <div className={list.page}>
      <Navbar />

      <header className={list.head}>
        <div className={list.wrap}>
          <h1 className={list.title}>Student work.</h1>
          <div className={list.headBottom}>
            <p className={list.sub}>
              Papers, posters, apps and models our students finished with their
              mentors. Not what's possible, what's already been done.
            </p>
            {types.length > 1 && (
              <div
                className={styles.chips}
                role='group'
                aria-label='Filter by output type'
              >
                {[
                  ["all", "All", entries.length],
                  ...types.map((t) => [t, t, counts[t]]),
                ].map(([value, label, n]) => (
                  <button
                    key={value}
                    type='button'
                    aria-pressed={filter === value}
                    className={`${styles.chip} ${filter === value ? styles.chipOn : ""}`}
                    onClick={() => setFilter(value)}
                  >
                    {label} <span className={styles.chipCount}>{n}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className={`${list.wrap} ${styles.body}`}>
        {loading ? (
          <p className={styles.loading}>Loading...</p>
        ) : entries.length === 0 ? (
          <div className={list.empty}>
            <p className={list.emptyTitle}>The first projects are underway.</p>
            <p>
              Finished work shows up here once a student and their mentor
              publish it.
            </p>
            <Link to='/research' className='btn-primary'>
              See open programs →
            </Link>
          </div>
        ) : (
          <>
            <p className={list.count}>
              {filtered.length} {filtered.length === 1 ? "project" : "projects"}
            </p>
            <div className={styles.grid}>
              {filtered.map((s) => (
                <article
                  key={s.id}
                  className={styles.card}
                  onClick={() => setSelected(s)}
                >
                  <Cover entry={s} />
                  <div className={styles.cardBody}>
                    {s.outputType && (
                      <p className={styles.type}>{s.outputType}</p>
                    )}
                    <h2 className={styles.cardTitle}>
                      <button
                        type='button'
                        className={styles.titleBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(s);
                        }}
                      >
                        {s.title}
                      </button>
                    </h2>
                    {s.summary && (
                      <p className={styles.cardSummary}>{s.summary}</p>
                    )}
                    <div className={styles.cardFoot}>
                      <span className={styles.people}>
                        {s.studentName && (
                          <span className={styles.student}>
                            {s.studentName}
                          </span>
                        )}
                        <span>with {mentorLabel(s)}</span>
                      </span>
                      <span className={styles.more} aria-hidden='true'>
                        Read more →
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </main>

      <section className={styles.band}>
        <div className={`${list.wrap} ${styles.bandInner}`}>
          <h2 className={styles.bandTitle}>Your project could be next.</h2>
          <Link to='/student/register' className='btn-primary'>
            Start your application →
          </Link>
        </div>
      </section>

      {selected && (
        <DetailDialog
          entry={selected}
          mentor={mentorLabel(selected)}
          onClose={() => setSelected(null)}
        />
      )}

      <Footer />
    </div>
  );
}
