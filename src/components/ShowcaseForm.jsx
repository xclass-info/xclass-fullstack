// src/components/ShowcaseForm.jsx
// Lets a mentor publish a finished student project to the public Showcase
// page - the "here's proof, not just a claim" feature.
import { useState } from "react";
import { api, seg } from "../api";
import styles from "./TeacherAuth.module.css";
import mf from "./MentorForm.module.css";
import { DELIVERABLE_OPTIONS } from "../utils/deliverables";
import { safeUrl } from "../utils/format";

const WORD_LIMITS = { title: 100, summary: 400 };
const MAX_FILE_MB = 10;

function countWords(str) {
  const trimmed = str.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function WordCount({ count, limit }) {
  return (
    <span className={`${mf.count} ${count >= limit ? mf.countOver : ""}`}>
      {count} / {limit} words
    </span>
  );
}

export default function ShowcaseForm({ entry, onClose }) {
  const isEditing = Boolean(entry);
  const [form, setForm] = useState({
    title: entry?.title || "",
    studentName: entry?.studentName || "",
    outputType: entry?.outputType || "",
    summary: entry?.summary || "",
    outputUrl: entry?.outputUrl || "",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    const limit = WORD_LIMITS[name];
    if (limit && countWords(value) > limit) return;
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: "" });
  }

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    const okType = f.type === "application/pdf" || f.type.startsWith("image/");
    if (!okType) {
      setFileError("Please upload a PDF or image file.");
      return;
    }
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      setFileError(`File must be under ${MAX_FILE_MB}MB.`);
      return;
    }
    setFileError("");
    setFile(f);
  }

  function validate() {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = "Required";
    if (!form.studentName.trim()) newErrors.studentName = "Required";
    if (!form.outputType) newErrors.outputType = "Required";
    if (!form.summary.trim()) newErrors.summary = "Required";
    if (form.outputUrl.trim() && !safeUrl(form.outputUrl))
      newErrors.outputUrl = "Must be a valid http(s) link";
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
      let fileUrl = entry?.fileUrl || null;
      let fileType = entry?.fileType || null;
      if (file) {
        const upload = new FormData();
        upload.append("file", file);
        const uploaded = await api.post("/showcase/files", upload);
        fileUrl = uploaded.ref;
        fileType = uploaded.fileType;
      }

      const payload = {
        title: form.title.trim(),
        studentName: form.studentName.trim(),
        outputType: form.outputType,
        summary: form.summary.trim(),
        outputUrl: form.outputUrl.trim() || null,
        fileUrl,
        fileType,
      };
      if (isEditing) {
        await api.patch(`/showcase/${seg(entry.id)}`, payload);
      } else {
        // The backend fills in teacherId/teacherName and createdAt.
        await api.post("/showcase", payload);
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
    <div className={mf.wrap}>
      {onClose && (
        <button type='button' onClick={onClose} className={mf.back}>
          ← Back to your content
        </button>
      )}
      <h2 className={mf.title}>
        {isEditing ? "Edit student work" : "Add student work"}
      </h2>
      <p className={mf.sub}>
        {isEditing
          ? "Update this finished project."
          : "Publish a student's finished project - this is what visitors see as proof of real outcomes."}
      </p>

      <form onSubmit={handleSubmit} className={mf.form} noValidate>
        <div className={styles.field}>
          <div className={mf.labelRow}>
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
            placeholder='e.g. Can AI Compose Music That Expresses Human Emotion?'
          />
          {errors.title && <p className={styles.errorMsg}>{errors.title}</p>}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Student's Name *</label>
          <input
            className={`${styles.input} ${errors.studentName ? styles.inputError : ""}`}
            name='studentName'
            value={form.studentName}
            onChange={handleChange}
            placeholder='e.g. Jamie L.'
          />
          {errors.studentName && (
            <p className={styles.errorMsg}>{errors.studentName}</p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>What They Produced *</label>
          <select
            className={`${styles.input} ${errors.outputType ? styles.inputError : ""}`}
            name='outputType'
            value={form.outputType}
            onChange={handleChange}
          >
            <option value=''>Select an output type</option>
            {DELIVERABLE_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {errors.outputType && (
            <p className={styles.errorMsg}>{errors.outputType}</p>
          )}
        </div>

        <div className={styles.field}>
          <div className={mf.labelRow}>
            <label className={styles.label}>Summary *</label>
            <WordCount
              count={countWords(form.summary)}
              limit={WORD_LIMITS.summary}
            />
          </div>
          <textarea
            className={`${styles.input} ${styles.textarea} ${errors.summary ? styles.inputError : ""}`}
            name='summary'
            value={form.summary}
            onChange={handleChange}
            placeholder='What did the student do, and what did they find or build?'
            rows={8}
          />
          {errors.summary && (
            <p className={styles.errorMsg}>{errors.summary}</p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            Link to the Finished Work{" "}
            <span className={mf.optional}>(optional)</span>
          </label>
          <input
            className={`${styles.input} ${errors.outputUrl ? styles.inputError : ""}`}
            name='outputUrl'
            value={form.outputUrl}
            onChange={handleChange}
            placeholder='https://... (paper, site, video, etc.)'
          />
          {errors.outputUrl && (
            <p className={styles.errorMsg}>{errors.outputUrl}</p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            Upload Paper or Poster{" "}
            <span className={mf.optional}>
              (optional, PDF or image, up to {MAX_FILE_MB}MB)
            </span>
          </label>
          {entry?.fileUrl && !file && (
            <p className={mf.hint}>
              Current file:{" "}
              <a href={entry.fileUrl} target='_blank' rel='noopener noreferrer'>
                View {entry.fileType === "image" ? "poster" : "paper"}
              </a>{" "}
              — choose a new file below to replace it.
            </p>
          )}
          <input
            type='file'
            accept='application/pdf,image/*'
            onChange={handleFileChange}
            className={mf.file}
          />
          {file && <p className={mf.hint}>Selected: {file.name}</p>}
          {fileError && <p className={styles.errorMsg}>{fileError}</p>}
        </div>

        <div className={mf.actions}>
          <button className={styles.btn} type='submit' disabled={loading}>
            {loading
              ? isEditing
                ? "Saving..."
                : "Publishing..."
              : saved
                ? isEditing
                  ? "Saved"
                  : "Published"
                : isEditing
                  ? "Save Changes"
                  : "Publish to Student Work"}
          </button>
          {isEditing && onClose && (
            <button type='button' onClick={onClose} className='btn-ghost'>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
