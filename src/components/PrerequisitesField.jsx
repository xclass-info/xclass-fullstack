import styles from "./TeacherAuth.module.css";
import { MAX_PREREQUISITES } from "../utils/prerequisites";

export default function PrerequisitesField({ value, onChange }) {
  function updateItem(index, text) {
    const next = [...value];
    next[index] = text;
    onChange(next);
  }

  function removeItem(index) {
    onChange(value.filter((_, i) => i !== index));
  }

  function addItem() {
    onChange([...value, ""]);
  }

  return (
    <div className={styles.field}>
      <label className={styles.label}>
        Prerequisites{" "}
        <span style={{ color: "#aaa", fontWeight: 400 }}>
          (optional, up to {MAX_PREREQUISITES} — leave empty for None)
        </span>
      </label>
      {value.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: value.length < MAX_PREREQUISITES ? 10 : 0,
          }}
        >
          {value.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 8 }}>
              <input
                className={styles.input}
                value={item}
                onChange={(e) => updateItem(i, e.target.value)}
                placeholder='e.g. Basic Python'
                style={{ fontSize: "1.1rem" }}
              />
              <button
                type='button'
                onClick={() => removeItem(i)}
                aria-label='Remove prerequisite'
                style={{
                  background: "none",
                  border: "2.5px solid #cbd5e1",
                  borderRadius: 10,
                  color: "#a01f13",
                  cursor: "pointer",
                  fontSize: "1.1rem",
                  width: 44,
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {value.length < MAX_PREREQUISITES && (
        <button
          type='button'
          onClick={addItem}
          style={{
            background: "none",
            border: "none",
            color: "#111111",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 14,
            padding: 0,
            textAlign: "left",
          }}
        >
          + Add prerequisite
        </button>
      )}
    </div>
  );
}
