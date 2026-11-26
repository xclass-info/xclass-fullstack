// src/components/TellUsWhatYouNeed.jsx
// "On-demand" requests: a free-text (+ optional photo) request that gets
// emailed straight to the team, for visitors who don't want to browse
// Projects/Research/1-1 themselves.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { DoneIcon } from "./ContactUs";
import styles from "./Enquiry.module.css";
import auth from "./TeacherAuth.module.css";

const MAX_IMAGE_MB = 5;

const STEPS = [
  {
    title: "Tell us what you need.",
    text: "A research idea, a project, help with a subject, exam prep. A sentence or two is enough.",
  },
  {
    title: "We find the right mentor.",
    text: "Someone on our team reads every request and looks for a mentor who fits.",
  },
  {
    title: "We email you with options.",
    text: "You decide whether to go ahead. Nothing is booked until you say so.",
  },
];

export default function TellUsWhatYouNeed() {
  const [form, setForm] = useState({ name: "", email: "", details: "" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);

  // Free the preview's object URL when it changes or the page closes.
  useEffect(
    () => () => imagePreview && URL.revokeObjectURL(imagePreview),
    [imagePreview],
  );

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors({ ...errors, image: "Please attach an image file." });
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setErrors({ ...errors, image: `Image must be under ${MAX_IMAGE_MB}MB.` });
      return;
    }
    setErrors({ ...errors, image: "" });
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Please enter your name.";
    if (!form.email.trim()) e.email = "Please enter your email.";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      e.email = "That email doesn't look right.";
    if (!form.details.trim())
      e.details = "Tell us a little about what you need.";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      // Emailed to the team inbox; an attached image is stored and linked
      // in the email.
      const data = new FormData();
      data.append("name", form.name);
      data.append("email", form.email);
      data.append("details", form.details.trim());
      if (imageFile) data.append("image", imageFile);
      await api.post("/on-demand-request", data);
      setDone(true);
    } catch (err) {
      console.error(err);
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const fieldError = (name) =>
    errors[name] && <p className={auth.errorMsg}>{errors[name]}</p>;

  return (
    <div className={styles.page}>
      <Navbar />

      <header className={`${styles.wrap} ${styles.hero}`}>
        <p className='section-label'>On-demand</p>
        <h1 className={styles.h1}>Not sure where to start?</h1>
        <p className={styles.sub}>
          Describe what you need, attach a photo of the homework or project if
          it helps, and we'll match you with the right mentor.
        </p>
      </header>

      <div className={`${styles.wrap} ${styles.body}`}>
        <div className={styles.info}>
          <p className={styles.infoTitle}>How it works</p>
          <ol className={styles.steps}>
            {STEPS.map((s, i) => (
              <li key={s.title} className={styles.step}>
                <span className={styles.stepNum}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className={styles.stepTitle}>{s.title}</p>
                  <p className={styles.stepText}>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className={styles.browse}>
            Rather look around yourself? <Link to='/research'>Research</Link>
            <Link to='/projects'>Projects</Link>
            <Link to='/tutors'>Mentors</Link>
          </p>
        </div>

        <div className={styles.formCard}>
          {done ? (
            <div role='status'>
              <DoneIcon />
              <h2 className={styles.cardTitle}>Got it.</h2>
              <p className={auth.bodyText}>
                We'll follow up at <strong>{form.email}</strong> to help find
                the right fit.
              </p>
              <div className={styles.doneActions}>
                <Link to='/research' className='btn-primary'>
                  Browse research →
                </Link>
                <Link to='/' className='btn-ghost'>
                  Back to home
                </Link>
              </div>
            </div>
          ) : (
            <>
              <h2 className={styles.cardTitle}>Send a request.</h2>
              <form onSubmit={handleSubmit} className={auth.form} noValidate>
                <div className={auth.row}>
                  <div className={auth.field}>
                    <label className={auth.label} htmlFor='t-name'>
                      Your name
                    </label>
                    <input
                      id='t-name'
                      name='name'
                      className={`${auth.input} ${errors.name ? auth.inputError : ""}`}
                      value={form.name}
                      onChange={handleChange}
                      autoComplete='name'
                    />
                    {fieldError("name")}
                  </div>
                  <div className={auth.field}>
                    <label className={auth.label} htmlFor='t-email'>
                      Email
                    </label>
                    <input
                      id='t-email'
                      name='email'
                      type='email'
                      className={`${auth.input} ${errors.email ? auth.inputError : ""}`}
                      value={form.email}
                      onChange={handleChange}
                      autoComplete='email'
                    />
                    {fieldError("email")}
                  </div>
                </div>

                <div className={auth.field}>
                  <label className={auth.label} htmlFor='t-details'>
                    What do you need help with?
                  </label>
                  <textarea
                    id='t-details'
                    name='details'
                    className={`${auth.input} ${auth.textarea} ${errors.details ? auth.inputError : ""}`}
                    placeholder='A project idea, homework help, exam prep, anything'
                    value={form.details}
                    onChange={handleChange}
                    rows={7}
                  />
                  {fieldError("details")}
                </div>

                <div className={auth.field}>
                  <span className={auth.label}>
                    Attach an image{" "}
                    <span className={styles.optional}>(optional)</span>
                  </span>
                  {imagePreview ? (
                    <div className={styles.fileRow}>
                      <img
                        src={imagePreview}
                        alt='Attachment preview'
                        className={styles.preview}
                      />
                      <button
                        type='button'
                        className={styles.removeBtn}
                        onClick={removeImage}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className={styles.fileRow}>
                      <input
                        id='t-image'
                        type='file'
                        accept='image/*'
                        className={styles.fileInput}
                        onChange={handleImageChange}
                      />
                      <label htmlFor='t-image' className={styles.fileBtn}>
                        Choose a photo
                      </label>
                      <span className={styles.fileHint}>
                        Homework, a sketch, a project. Up to {MAX_IMAGE_MB}MB.
                      </span>
                    </div>
                  )}
                  {fieldError("image")}
                </div>

                {submitError && <p className={auth.error}>{submitError}</p>}

                <button
                  type='submit'
                  className={auth.btn}
                  disabled={submitting}
                >
                  {submitting ? "Sending..." : "Send request →"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
