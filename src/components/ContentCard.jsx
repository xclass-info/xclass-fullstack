// src/components/ContentCard.jsx
// One of the mentor's own research topics, projects or student work
// entries on their dashboard, with its applicants and edit controls.
import { Link } from "react-router-dom";
import styles from "./TeacherDashboard.module.css";
import RegistrationList from "./RegistrationList";
import { safeUrl, LESSON_STRUCTURE_LABEL } from "../utils/format";

const KIND_LABEL = {
  research: "Research",
  project: "Project",
  showcase: "Student work",
};

const PUBLIC_PATH = { research: "/research", project: "/projects" };

export default function ContentCard({
  item,
  kind,
  onEdit,
  onDelete,
  onToggleStage,
}) {
  const description =
    kind === "research"
      ? item.idea
      : kind === "project"
        ? item.description
        : item.summary;
  const done = item.stage === "completed";
  const publicHref = PUBLIC_PATH[kind] && `${PUBLIC_PATH[kind]}/${item.id}`;
  const workUrl = kind === "showcase" ? safeUrl(item.outputUrl) : null;

  return (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        <span className={styles.kind}>{KIND_LABEL[kind]}</span>
        {kind === "showcase" ? (
          item.outputType && (
            <span className={`${styles.badge} ${styles.badgeDone}`}>
              {item.outputType}
            </span>
          )
        ) : (
          <span className={`${styles.badge} ${done ? styles.badgeDone : ""}`}>
            {done ? "Completed" : "Active"}
          </span>
        )}
      </div>

      <h3 className={styles.cardTitle}>
        {publicHref ? (
          <Link to={publicHref} className={styles.cardLink}>
            {item.title}
          </Link>
        ) : (
          item.title
        )}
      </h3>
      {description && <p className={styles.cardDesc}>{description}</p>}

      {kind !== "showcase" && (
        <div className={styles.tags}>
          {item.gradeLevel && (
            <span className={styles.tag}>{item.gradeLevel}</span>
          )}
          {item.deliverable && (
            <span className={styles.tag}>{item.deliverable}</span>
          )}
          <span className={styles.tag}>{LESSON_STRUCTURE_LABEL}</span>
        </div>
      )}

      {kind === "project" && item.seats ? (
        <p className={styles.meta}>
          {item.enrolledCount || 0} of {item.seats} seats taken
        </p>
      ) : null}

      {kind === "showcase" && (
        <p className={styles.meta}>
          {item.studentName}
          {workUrl && (
            <>
              {" · "}
              <a href={workUrl} target='_blank' rel='noreferrer'>
                View the work →
              </a>
            </>
          )}
        </p>
      )}

      {kind !== "showcase" && <RegistrationList itemId={item.id} />}

      <div className={styles.cardFoot}>
        <button
          type='button'
          className={`${styles.smallBtn} ${styles.smallPrimary}`}
          onClick={onEdit}
        >
          Edit
        </button>
        {onToggleStage && (
          <button
            type='button'
            className={styles.smallBtn}
            onClick={onToggleStage}
          >
            {done ? "Mark active" : "Mark completed"}
          </button>
        )}
        <button
          type='button'
          className={`${styles.smallBtn} ${styles.smallDanger}`}
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
