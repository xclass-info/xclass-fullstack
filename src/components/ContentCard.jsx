import styles from "./TeacherDashboard.module.css";
import RegistrationList from "./RegistrationList";
import { safeUrl, LESSON_STRUCTURE_LABEL } from "../utils/format";

const KIND_LABEL = {
  research: "🔬 Research",
  project: "💡 Project",
  showcase: "🏆 Student Work",
};

function kindTagStyle() {
  return {
    display: "inline-block",
    fontSize: 11,
    fontWeight: 800,
    color: "var(--primary-hover)",
    background: "var(--primary-soft)",
    padding: "2px 10px",
    borderRadius: 20,
    marginBottom: 6,
  };
}

function gradeDeliverableStyle(variant) {
  if (variant === "grade") {
    return {
      display: "inline-block",
      fontSize: 11,
      fontWeight: 700,
      color: "var(--primary-hover)",
      background: "var(--surface)",
      border: "1px solid var(--accent)",
      padding: "2px 10px",
      borderRadius: 20,
      marginRight: 6,
      marginBottom: 6,
    };
  }
  return {
    fontSize: 12,
    color: "var(--mint)",
    fontWeight: 600,
    margin: "0 0 6px",
  };
}

export default function ContentCard({ item, kind, onEdit, onDelete, onToggleStage }) {
  const description =
    kind === "research" ? item.idea : kind === "project" ? item.description : item.summary;

  const badgeLabel =
    kind === "showcase" ? item.outputType : item.stage === "completed" ? "Completed" : "Active";
  const badgeClass =
    kind === "showcase" || item.stage !== "completed" ? styles.active : styles.draft;

  return (
    <div className={styles.card}>
      <span style={kindTagStyle()}>{KIND_LABEL[kind]}</span>
      <div className={styles.cardTop}>
        <h3 className={styles.cardTitle}>{item.title}</h3>
        <span className={`${styles.badge} ${badgeClass}`}>{badgeLabel}</span>
      </div>
      <p className={styles.cardDesc}>{description}</p>

      {item.gradeLevel && (
        <span style={gradeDeliverableStyle("grade")}>🎓 {item.gradeLevel}</span>
      )}
      {item.deliverable && (
        <p style={gradeDeliverableStyle("deliverable")}>📦 {item.deliverable}</p>
      )}

      {kind !== "showcase" && (
        <p style={{ fontSize: 12, color: "#64748b", fontWeight: 600, margin: "0 0 6px" }}>
          🕐 {LESSON_STRUCTURE_LABEL}
        </p>
      )}

      {kind === "project" && item.seats ? (
        <div className={styles.cardMeta}>
          <span>
            👥 {item.enrolledCount || 0} / {item.seats} seats
          </span>
        </div>
      ) : null}

      {kind === "showcase" && (
        <>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 8px" }}>
            👤 {item.studentName}
          </p>
          {safeUrl(item.outputUrl) && (
            <a
              href={safeUrl(item.outputUrl)}
              target='_blank'
              rel='noreferrer'
              style={{ fontSize: 13, color: "#111111", textDecoration: "underline" }}
            >
              View finished work →
            </a>
          )}
        </>
      )}

      {kind !== "showcase" && <RegistrationList itemId={item.id} />}

      <div className={styles.cardFooter}>
        <button className={styles.joinBtn} onClick={onEdit}>
          ✏️ Edit
        </button>
        {onToggleStage && (
          <button className={styles.copyBtn} onClick={onToggleStage}>
            {item.stage === "completed" ? "🔄 Mark Active" : "✅ Mark Completed"}
          </button>
        )}
        <button className={styles.copyBtn} onClick={onDelete} style={{ color: "#a01f13" }}>
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}
