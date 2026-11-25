import { useEffect, useState, useMemo, useRef, useLayoutEffect } from "react";
import { api, live } from "../api";
import { useNavigate } from "react-router-dom";
import styles from "./ActiveEnrolling.module.css";
import InitialsAvatar from "./InitialsAvatar";
import { formatMentorName } from "../utils/mentorName";
import { mentorBadge } from "../utils/mentorCard";

function Card({ mentor, openKind, onClick }) {
  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.top}>
        {mentor.photoURL ? (
          <img
            src={mentor.photoURL}
            alt={mentor.name}
            className={styles.avatar}
            style={{ objectFit: "cover" }}
          />
        ) : (
          <InitialsAvatar
            name={mentor.name}
            seed={mentor.id}
            className={styles.avatar}
            fontSize='1rem'
          />
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className={styles.name}>
            {formatMentorName(mentor.name, {
              mentorType: mentor.mentorType,
              degree: mentor.degree,
            })}
          </div>
          <div className={styles.subject}>
            {(mentor.expertise || mentor.researchArea || "Research Mentor").trim()}
          </div>
        </div>
      </div>
      <div className={styles.badge}>{mentorBadge(mentor)}</div>
      <div className={styles.openLine}>
        <span className={styles.liveDot} />
        Enrolling now · {openKind}
      </div>
    </div>
  );
}

// Matches Testimonials.module.css's marquee speed (its track covers 2160px
// of one copy in 48s) so both carousels feel equally paced regardless of
// how many cards either one actually has.
const MARQUEE_PX_PER_SEC = 45;

export default function ActiveEnrolling() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [research, setResearch] = useState([]);
  const [projects, setProjects] = useState([]);
  const trackRef = useRef(null);
  const [duration, setDuration] = useState(120);

  useEffect(() => {
    const unsub = live(() => api.get("/teachers"), (rows) => {
      setTeachers(
        rows
          .filter((t) => !t.disabled && t.name && t.verificationStatus === "approved"),
      );
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = live(() => api.get("/research"), (rows) => {
      setResearch(rows);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = live(() => api.get("/projects"), (rows) => {
      setProjects(rows);
    });
    return () => unsub();
  }, []);

  const enrolling = useMemo(() => {
    const openResearch = new Set();
    research.forEach((r) => {
      const left = (r.seats || 0) - (r.enrolledCount || 0);
      if (r.status === "published" && left > 0) openResearch.add(r.teacherId);
    });
    const openProjects = new Set();
    projects.forEach((p) => {
      const left = (p.seats || 0) - (p.enrolledCount || 0);
      if (left > 0) openProjects.add(p.teacherId);
    });

    return teachers
      .filter((t) => openResearch.has(t.id) || openProjects.has(t.id))
      .map((t) => {
        const hasResearch = openResearch.has(t.id);
        const hasProject = openProjects.has(t.id);
        const openKind =
          hasResearch && hasProject
            ? "Research & Project"
            : hasResearch
              ? "Research"
              : "Project";
        return { mentor: t, openKind };
      });
  }, [teachers, research, projects]);

  useLayoutEffect(() => {
    if (!trackRef.current || enrolling.length === 0) return;
    const oneCopyWidth = trackRef.current.scrollWidth / 2;
    setDuration(oneCopyWidth / MARQUEE_PX_PER_SEC);
  }, [enrolling]);

  if (enrolling.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={`${styles.header} reveal`}>
        <div className='section-label'>Enrolling now</div>
        <h2>Open seats right now.</h2>
        <p className='section-sub'>
          These mentors have room in a research program or project today.
        </p>
      </div>

      <div className={`${styles.marqueeWrap} reveal`}>
        <div
          ref={trackRef}
          className={styles.track}
          style={{ animationDuration: `${duration}s` }}
        >
          {enrolling.map(({ mentor, openKind }) => (
            <Card
              key={`a-${mentor.id}`}
              mentor={mentor}
              openKind={openKind}
              onClick={() => navigate(`/teacher/${mentor.id}`)}
            />
          ))}
          {enrolling.map(({ mentor, openKind }) => (
            <Card
              key={`b-${mentor.id}`}
              mentor={mentor}
              openKind={openKind}
              onClick={() => navigate(`/teacher/${mentor.id}`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
