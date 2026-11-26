import styles from "./TeacherAuth.module.css";
import mf from "./MentorForm.module.css";
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
        <span className={mf.optional}>
          (optional, up to {MAX_PREREQUISITES}; leave empty for none)
        </span>
      </label>
      {value.length > 0 && (
        <div className={mf.prereqList}>
          {value.map((item, i) => (
            <div key={i} className={mf.prereqRow}>
              <input
                className={styles.input}
                value={item}
                onChange={(e) => updateItem(i, e.target.value)}
                placeholder='e.g. Basic Python'
              />
              <button
                type='button'
                onClick={() => removeItem(i)}
                aria-label='Remove prerequisite'
                className={mf.removeBtn}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {value.length < MAX_PREREQUISITES && (
        <button type='button' onClick={addItem} className={mf.addBtn}>
          + Add prerequisite
        </button>
      )}
    </div>
  );
}
