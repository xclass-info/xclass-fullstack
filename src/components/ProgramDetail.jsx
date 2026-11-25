// src/components/ProgramDetail.jsx
// Shared detail page for one research topic or project: big title, the
// write-up on the left, and a sticky card on the right with seats, the
// Apply button, what you'll produce, the mentor and the lesson schedule.
// ResearchDetail and ProjectDetail only pass in what differs.
import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { getOrNull, seg } from "../api";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { formatMentorName } from "../utils/mentorName";
import {
  computeLessonDates,
  formatLessonSlot,
  locationLabel,
} from "../utils/schedule";
import { LESSON_STRUCTURE_LABEL } from "../utils/format";
import { SeatsRow, RegisterModal, LoginPrompt } from "./RegisterControls";
import { useStudentAuth } from "../utils/useStudentAuth";
import { toPrereqArray } from "../utils/prerequisites";
import styles from "./ProgramDetail.module.css";

const STAGE_LABEL = { active: "Active", completed: "Completed" };

// "💻 Online" -> "Online": this page doesn't use emoji.
const plain = (text) =>
  (text || "").replace(/^\p{Extended_Pictographic}️?\s*/u, "");

/**
 * config: {
 *   kind ("research" | "project"), param, endpoint (path prefix),
 *   isPublic(item), label, listPath, listLabel,
 *   sections: [{ label, key, lead }]
 * }
 */
export default function ProgramDetail({ config }) {
  const params = useParams();
  const id = params[config.param];
  const location = useLocation();
  const { student } = useStudentAuth();
  const [item, setItem] = useState(undefined); // undefined = loading
  const [mentor, setMentor] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Registering needs a student account, so a logged-out visitor gets an
  // inline "log in or sign up" prompt instead of a silent redirect.
  function openRegister() {
    if (!student) {
      setShowLoginPrompt(true);
      return;
    }
    setRegistering(true);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getOrNull(`${config.endpoint}/${seg(id)}`);
        if (!data || !config.isPublic(data)) {
          if (!cancelled) setItem(null);
          return;
        }
        if (!cancelled) setItem(data);
        const teacher = data.teacherId
          ? await getOrNull(`/teachers/${seg(data.teacherId)}`)
          : null;
        if (!cancelled && teacher?.name) setMentor(teacher);
      } catch (err) {
        console.error(err);
        if (!cancelled) setItem(null);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, config]);

  if (item === undefined || item === null) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={`${styles.wrap} ${styles.state}`}>
          {item === undefined ? (
            <p className={styles.muted}>Loading...</p>
          ) : (
            <>
              <h1 className={styles.stateTitle}>Not found.</h1>
              <p className={styles.muted}>
                This may have been removed or is no longer public.
              </p>
              <Link to={config.listPath} className='btn-ghost'>
                ← {config.listLabel}
              </Link>
            </>
          )}
        </div>
        {item === null && <Footer />}
      </div>
    );
  }

  const mentorName = mentor
    ? formatMentorName(mentor.name, {
        mentorType: mentor.mentorType,
        degree: mentor.degree,
      })
    : item.teacherName && item.teacherName !== "Teacher"
      ? item.teacherName
      : "Mentor";
  const prereqs = toPrereqArray(item.prerequisites);
  const stage = item.stage || "active";
  const lessons =
    item.scheduleStartDate && item.scheduleTime
      ? computeLessonDates(item.scheduleStartDate, item.scheduleTime)
      : [];

  return (
    <div className={styles.page}>
      <Navbar />

      <header className={styles.head}>
        <div className={styles.wrap}>
          <Link to={config.listPath} className={styles.back}>
            ← {config.listLabel}
          </Link>
          <div className={styles.kicker}>
            <span className='section-label' style={{ margin: 0 }}>
              {config.label}
            </span>
            <span
              className={`${styles.stage} ${stage === "completed" ? styles.stageDone : ""}`}
            >
              {STAGE_LABEL[stage] || STAGE_LABEL.active}
            </span>
          </div>
          <h1 className={styles.title}>{item.title}</h1>
          <div className={styles.tags}>
            {item.gradeLevel && (
              <span className={styles.tag}>{item.gradeLevel}</span>
            )}
            {item.difficulty && (
              <span className={styles.tag}>{item.difficulty}</span>
            )}
            <span className={styles.tag}>{LESSON_STRUCTURE_LABEL}</span>
            {item.scheduleLocation && (
              <span className={styles.tag}>
                {plain(locationLabel(item.scheduleLocation))}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className={`${styles.wrap} ${styles.body}`}>
        <main className={styles.main}>
          {config.sections.map((s) =>
            item[s.key] ? (
              <section key={s.key} className={styles.section}>
                <h2 className={styles.sectionLabel}>{s.label}</h2>
                <p className={s.lead ? styles.lead : styles.text}>
                  {item[s.key]}
                </p>
              </section>
            ) : null,
          )}
          {item.details && (
            <section className={styles.section}>
              <h2 className={styles.sectionLabel}>Additional details</h2>
              <p className={styles.text}>{item.details}</p>
            </section>
          )}
        </main>

        <aside className={styles.side}>
          <div className={styles.card}>
            {item.seats ? (
              <div className={styles.apply}>
                <SeatsRow
                  large
                  kind={config.kind}
                  item={item}
                  onRegister={openRegister}
                />
                {showLoginPrompt && <LoginPrompt from={location.pathname} />}
              </div>
            ) : null}

            <dl className={styles.facts}>
              <div>
                <dt>Mentor</dt>
                <dd>
                  {mentor ? (
                    <Link to={`/teacher/${mentor.id}`}>{mentorName}</Link>
                  ) : (
                    mentorName
                  )}
                </dd>
              </div>
              {item.deliverable && (
                <div>
                  <dt>You'll produce</dt>
                  <dd>{item.deliverable}</dd>
                </div>
              )}
              {prereqs.length > 0 && (
                <div>
                  <dt>Prerequisites</dt>
                  <dd>{prereqs.join(", ")}</dd>
                </div>
              )}
            </dl>

            {lessons.length > 0 && (
              <div className={styles.schedule}>
                <p className={styles.scheduleTitle}>Schedule</p>
                <ol className={styles.lessons}>
                  {lessons.map((d, i) => (
                    <li key={i}>
                      <span className={styles.lessonNum}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{formatLessonSlot(d)}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </aside>
      </div>

      {registering && student && (
        <RegisterModal
          kind={config.kind}
          item={item}
          student={student}
          onClose={() => setRegistering(false)}
        />
      )}
      <Footer />
    </div>
  );
}
