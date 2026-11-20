// src/components/ProjectForm.jsx
import { useState } from "react";
import { api, seg } from "../api";
import styles from "./TeacherAuth.module.css";
import { DELIVERABLE_OPTIONS } from "../utils/deliverables";
import { GRADE_RANGE_OPTIONS } from "../utils/gradeRange";
import { LOCATION_OPTIONS } from "../utils/schedule";
import { toPrereqArray, MAX_PREREQUISITES } from "../utils/prerequisites";
import PrerequisitesField from "./PrerequisitesField";
import { DIFFICULTY_OPTIONS } from "../utils/difficulty";

const WORD_LIMITS = { title: 100, description: 500, learning: 300, details: 300 };

function countWords(str) {
  const trimmed = str.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function WordCount({ count, limit }) {
  return (
    <span style={{ fontSize: 12, color: count >= limit ? "#a01f13" : "#aaa" }}>
      {count} / {limit} words
    </span>
  );
}

export default function ProjectForm({ project, onClose }) {
  const isEditing = Boolean(project);
  const [form, setForm] = useState({
    title: project?.title || "",
    description: project?.description || "",
    learning: project?.learning || "",
    details: project?.details || "",
    seats: project?.seats ?? "",
    deliverable: project?.deliverable || "",
    gradeLevel: project?.gradeLevel || "",
    difficulty: project?.difficulty || "",
    prerequisites: toPrereqArray(project?.prerequisites),
    scheduleStartDate: project?.scheduleStartDate || "",
    scheduleTime: project?.scheduleTime || "",
    scheduleLocation: project?.scheduleLocation || "online",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    const limit = WORD_LIMITS[name];
    if (limit && countWords(value) > limit) return;
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: "" });
  }

  function validate() {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = "Required";
    if (!form.description.trim()) newErrors.description = "Required";
    if (!form.learning.trim()) newErrors.learning = "Required";
    if (!form.deliverable) newErrors.deliverable = "Required";
    if (!form.gradeLevel) newErrors.gradeLevel = "Required";
    if (!form.difficulty) newErrors.difficulty = "Required";
    if (!form.scheduleStartDate) newErrors.scheduleStartDate = "Required";
    if (!form.scheduleTime) newErrors.scheduleTime = "Required";
    if (form.seats === "") newErrors.seats = "Required";
    else if (!Number.isInteger(Number(form.seats)) || Number(form.seats) < 1)
      newErrors.seats = "Must be a whole number, at least 1";
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        learning: form.learning.trim(),
        details: form.details.trim() || null,
        seats: Number(form.seats),
        deliverable: form.deliverable,
        gradeLevel: form.gradeLevel,
        difficulty: form.difficulty,
        prerequisites: form.prerequisites
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, MAX_PREREQUISITES),
        scheduleStartDate: form.scheduleStartDate,
        scheduleTime: form.scheduleTime,
        scheduleLocation: form.scheduleLocation,
      };
      if (isEditing) {
        await api.patch(`/projects/${seg(project.id)}`, payload);
      } else {
        // The backend fills in teacherId/teacherName, createdAt, and the
        // initial status/stage.
        await api.post("/projects", payload);
      }
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose?.();
      }, 1500);
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      {onClose && (
        <button
          type='button'
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#2f6175",
            cursor: "pointer",
            fontSize: 14,
            marginBottom: 12,
            padding: 0,
          }}
        >
          ← Back
        </button>
      )}
      <h3 style={{ marginBottom: 4 }}>
        {isEditing ? "💡 Edit Project" : "💡 Create Project"}
      </h3>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>
        {isEditing
          ? "Update your project post."
          : "Share a project idea students can work on with you."}
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 28 }}
      >
        <div className={styles.field}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <label className={styles.label}>Project Title *</label>
            <WordCount
              count={countWords(form.title)}
              limit={WORD_LIMITS.title}
            />
          </div>
          <input
            className={`${styles.input} ${errors.title ? styles.inputError : ""}`}
            name='title'
            value={form.title}
            onChange={handleChange}
            placeholder='e.g. Build a chatbot with Python'
            style={{ fontSize: "1.1rem" }}
          />
          {errors.title && <p className={styles.errorMsg}>{errors.title}</p>}
        </div>

        <div className={styles.field}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <label className={styles.label}>Project Description *</label>
            <WordCount
              count={countWords(form.description)}
              limit={WORD_LIMITS.description}
            />
          </div>
          <textarea
            className={`${styles.input} ${styles.textarea} ${errors.description ? styles.inputError : ""}`}
            name='description'
            value={form.description}
            onChange={handleChange}
            placeholder='Describe what the project involves...'
            rows={10}
            style={{ fontSize: "1.1rem" }}
          />
          {errors.description && (
            <p className={styles.errorMsg}>{errors.description}</p>
          )}
        </div>

        <div className={styles.field}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <label className={styles.label}>What Students Will Learn *</label>
            <WordCount
              count={countWords(form.learning)}
              limit={WORD_LIMITS.learning}
            />
          </div>
          <textarea
            className={`${styles.input} ${styles.textarea} ${errors.learning ? styles.inputError : ""}`}
            name='learning'
            value={form.learning}
            onChange={handleChange}
            placeholder='What skills or knowledge will students gain?'
            rows={7}
            style={{ fontSize: "1.1rem" }}
          />
          {errors.learning && (
            <p className={styles.errorMsg}>{errors.learning}</p>
          )}
        </div>

        <div className={styles.field}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <label className={styles.label}>
              Additional Details{" "}
              <span style={{ color: "#aaa", fontWeight: 400 }}>
                (optional)
              </span>
            </label>
            <WordCount
              count={countWords(form.details)}
              limit={WORD_LIMITS.details}
            />
          </div>
          <textarea
            className={`${styles.input} ${styles.textarea}`}
            name='details'
            value={form.details}
            onChange={handleChange}
            placeholder='Any additional information...'
            rows={3}
            style={{ fontSize: "1.1rem" }}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>What Students Will Produce *</label>
          <select
            className={`${styles.input} ${errors.deliverable ? styles.inputError : ""}`}
            name='deliverable'
            value={form.deliverable}
            onChange={handleChange}
            style={{ fontSize: "1.1rem" }}
          >
            <option value=''>Select an output type</option>
            {DELIVERABLE_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {errors.deliverable && (
            <p className={styles.errorMsg}>{errors.deliverable}</p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Recommended Grade Level *</label>
          <select
            className={`${styles.input} ${errors.gradeLevel ? styles.inputError : ""}`}
            name='gradeLevel'
            value={form.gradeLevel}
            onChange={handleChange}
            style={{ fontSize: "1.1rem" }}
          >
            <option value=''>Select a grade range</option>
            {GRADE_RANGE_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          {errors.gradeLevel && (
            <p className={styles.errorMsg}>{errors.gradeLevel}</p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Difficulty *</label>
          <select
            className={`${styles.input} ${errors.difficulty ? styles.inputError : ""}`}
            name='difficulty'
            value={form.difficulty}
            onChange={handleChange}
            style={{ fontSize: "1.1rem" }}
          >
            <option value=''>Select a difficulty</option>
            {DIFFICULTY_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {errors.difficulty && (
            <p className={styles.errorMsg}>{errors.difficulty}</p>
          )}
        </div>

        <PrerequisitesField
          value={form.prerequisites}
          onChange={(next) => setForm({ ...form, prerequisites: next })}
        />

        <div className={styles.field}>
          <label className={styles.label}>Schedule *</label>
          <p style={{ color: "#888", fontSize: 13, margin: "0 0 10px" }}>
            10 weekly lessons, 1 hour each, starting from this date/time.
          </p>
          <div className={styles.row}>
            <div>
              <input
                className={`${styles.input} ${errors.scheduleStartDate ? styles.inputError : ""}`}
                type='date'
                name='scheduleStartDate'
                value={form.scheduleStartDate}
                onChange={handleChange}
              />
              {errors.scheduleStartDate && (
                <p className={styles.errorMsg}>{errors.scheduleStartDate}</p>
              )}
            </div>
            <div>
              <input
                className={`${styles.input} ${errors.scheduleTime ? styles.inputError : ""}`}
                type='time'
                name='scheduleTime'
                value={form.scheduleTime}
                onChange={handleChange}
              />
              {errors.scheduleTime && (
                <p className={styles.errorMsg}>{errors.scheduleTime}</p>
              )}
            </div>
          </div>
          <select
            className={styles.input}
            name='scheduleLocation'
            value={form.scheduleLocation}
            onChange={handleChange}
            style={{ marginTop: 10 }}
          >
            {LOCATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Seats *</label>
          <input
            className={`${styles.input} ${errors.seats ? styles.inputError : ""}`}
            name='seats'
            type='number'
            min='1'
            max='50'
            value={form.seats}
            onChange={handleChange}
            placeholder='e.g. 2'
            style={{ fontSize: "1.1rem" }}
          />
          {errors.seats && <p className={styles.errorMsg}>{errors.seats}</p>}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            className={styles.btn}
            type='submit'
            disabled={loading}
            style={{ background: saved ? "#1f6f4a" : undefined }}
          >
            {loading
              ? isEditing
                ? "Saving..."
                : "Creating..."
              : saved
                ? isEditing
                  ? "Saved! ✓"
                  : "Created! ✓"
                : isEditing
                  ? "Save Changes"
                  : "Create Project 💡"}
          </button>
          {isEditing && onClose && (
            <button
              type='button'
              onClick={onClose}
              style={{
                padding: "14px 28px",
                borderRadius: 50,
                border: "2.5px solid #cbd5e1",
                background: "transparent",
                color: "#475569",
                cursor: "pointer",
                fontWeight: 800,
                fontSize: "1rem",
                fontFamily: "var(--font-sans)",
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
