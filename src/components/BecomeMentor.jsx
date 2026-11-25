// src/components/BecomeMentor.jsx
// Public "Become a Mentor" page: what mentoring involves, who can apply, how
// it works - and the 2-minute quick start that begins the application.
// Pay is intentionally not shown here; it's shared during review.
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { MENTOR_TYPES } from "../utils/mentorVerification";
import Navbar from "./Navbar";
import Footer from "./Footer";
import styles from "./BecomeMentor.module.css";
import auth from "./TeacherAuth.module.css";

const NOT_ELIGIBLE = "not_eligible";

const STEPS = [
  {
    title: "Quick start",
    time: "2 minutes",
    text: "Tell us who you are. We'll email you a link to continue.",
  },
  {
    title: "Your application",
    time: "About 10 minutes",
    text: "Your profile, proof of your PhD status and your CV. Saved as you go.",
  },
  {
    title: "Review",
    time: "About 3 business days",
    text: "Our team reviews every application. Sometimes we'll ask for a short video interview.",
  },
  {
    title: "Onboarding",
    time: "A few days",
    text: "Read our Mentor Guidelines. We run a background check on every mentor before they work with students.",
  },
  {
    title: "Go live",
    time: "",
    text: "Your profile is published and students can apply for your research.",
  },
];

const FAQ = [
  {
    q: "How much time does it take?",
    a: "A typical project is 10 one-hour online sessions over about three months, plus a little time to review your student's work between sessions.",
  },
  {
    q: "Is mentoring paid?",
    a: "Yes - mentors are paid per project. We'll share the details during your review.",
  },
  {
    q: "Who are the students?",
    a: "Motivated middle- and high-school students who want to do real research - usually ahead of science fairs, competitions or college applications.",
  },
  {
    q: "Where do sessions happen?",
    a: "Online, through video sessions set up by HappyResearch, so you can mentor from anywhere. We'll ask about your US work authorization in the application.",
  },
  {
    q: "Why a background check?",
    a: "Our students are minors. Every mentor passes a background check before going live - it's one of the reasons families trust us.",
  },
];

export default function BecomeMentor() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    mentorType: "",
    university: "",
    researchArea: "",
    website: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [alreadyStarted, setAlreadyStarted] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setAlreadyStarted(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.mentorType === NOT_ELIGIBLE) return;
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const { confirmPassword, ...fields } = form;
      await api.post("/mentor-application/start", fields);
      setSent(true);
    } catch (err) {
      if (err.code === "APPLICATION_EXISTS") {
        setAlreadyStarted(true);
      } else if (err.code === "WEAK_PASSWORD") {
        setError("Password should be at least 6 characters.");
      } else if (err.code === "EMAIL_IN_USE") {
        setError(
          "This email already has a HappyResearch account. Please log in instead.",
        );
      } else if (err.code === "INVALID_EMAIL") {
        setError("Please enter a valid email address.");
      } else if (err.code === "RATE_LIMITED") {
        setError("Too many attempts - please wait a minute and try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function field(name, label, props = {}, hint) {
    return (
      <div className={auth.field}>
        <label className={auth.label} htmlFor={`bm-${name}`}>
          {label}
          {hint && <span className={styles.hint}> {hint}</span>}
        </label>
        <input
          id={`bm-${name}`}
          className={auth.input}
          name={name}
          value={form[name]}
          onChange={handleChange}
          {...props}
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Navbar />

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.wrap}>
          <p className='section-label'>Become a mentor</p>
          <h1 className={styles.h1}>
            Guide the next generation of{" "}
            <span className='mark'>researchers</span>.
          </h1>
          <div className={styles.heroBottom}>
            <p className={styles.heroSub}>
              Mentor a motivated student through a real research project in your
              field. Online, on your schedule, and paid per project.
            </p>
            <div className={styles.actions}>
              <a href='#apply' className='btn-primary'>
                Apply in 2 minutes →
              </a>
              <Link to='/mentor/guidelines' className='btn-ghost'>
                Mentor Guidelines
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Who can apply + what it looks like */}
      <section className={styles.wrap}>
        <div className={styles.twoCol}>
          <div className={styles.col}>
            <h2 className={styles.colTitle}>Who can apply.</h2>
            <ul className={styles.rows}>
              {MENTOR_TYPES.map((t) => (
                <li key={t.value}>{t.plural}</li>
              ))}
            </ul>
          </div>
          <div className={styles.col}>
            <h2 className={styles.colTitle}>What mentoring looks like.</h2>
            <ul className={styles.rows}>
              <li>10 one-hour online sessions over about 3 months</li>
              <li>
                A real project in your field, from idea to finished result
              </li>
              <li>You propose the research topics</li>
              <li>We handle matching, scheduling and payments</li>
              <li>Paid per project</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className={styles.dark}>
        <div className={styles.wrap}>
          <h2 className={styles.bigTitle}>
            From application to your first student.
          </h2>
          <ol className={styles.steps}>
            {STEPS.map((s, i) => (
              <li key={s.title} className={styles.step}>
                <span className={styles.stepNum}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={styles.stepTitle}>{s.title}</span>
                <span className={styles.stepText}>
                  {s.text}
                  {s.time && <span className={styles.stepTime}>{s.time}</span>}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className={styles.faq}>
        <div className={`${styles.wrap} ${styles.faqInner}`}>
          <div className={styles.faqHead}>
            <h2 className={styles.bigTitle}>Questions.</h2>
            <p className={styles.faqNote}>
              More on how mentors work with students in our{" "}
              <Link to='/mentor/guidelines'>Mentor Guidelines</Link>.
            </p>
          </div>
          <div className={styles.faqList}>
            {FAQ.map((f) => (
              <details key={f.q} className={styles.faqItem}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Quick start */}
      <section id='apply' className={styles.apply}>
        <div className={`${styles.wrap} ${styles.applyInner}`}>
          <div className={styles.applyHead}>
            <h2 className={styles.applyTitle}>Start your application.</h2>
            <p className={styles.applyText}>
              Two minutes now. We'll email you a link to finish the rest, and
              your progress is saved as you go.
            </p>
          </div>

          <div className={styles.formCard}>
            {sent ? (
              <div role='status'>
                <div className={auth.doneIcon} aria-hidden='true'>
                  <svg
                    width='26'
                    height='26'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='#111111'
                    strokeWidth='2.4'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  >
                    <path d='M20 6 9 17l-5-5' />
                  </svg>
                </div>
                <h3 className={auth.title}>Check your email</h3>
                <p className={auth.bodyText} style={{ marginBottom: 0 }}>
                  We've sent a link to <strong>{form.email}</strong> to confirm
                  your email and continue your application. It takes about 10
                  minutes. If you don't see it, check your spam folder.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={auth.form}>
                {field("name", "Full name", {
                  required: true,
                  autoComplete: "name",
                  placeholder: "Dr. Jane Smith",
                })}
                {field("email", "Email", {
                  type: "email",
                  required: true,
                  autoComplete: "email",
                  placeholder: "jane@university.edu",
                })}

                <div className={auth.field}>
                  <label className={auth.label} htmlFor='bm-mentorType'>
                    Your current role
                  </label>
                  <select
                    id='bm-mentorType'
                    className={auth.input}
                    name='mentorType'
                    value={form.mentorType}
                    onChange={handleChange}
                    required
                  >
                    <option value=''>Select your role</option>
                    {MENTOR_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                    <option value={NOT_ELIGIBLE}>
                      Master's student, undergraduate, or other
                    </option>
                  </select>
                </div>

                {form.mentorType === NOT_ELIGIBLE ? (
                  <p className={auth.notice} style={{ margin: 0 }}>
                    Thank you for your interest! Our mentors are currently PhD
                    students and above. We'd love to hear from you once you've
                    started a PhD program.
                  </p>
                ) : (
                  <>
                    {field("university", "University or organization", {
                      required: true,
                      placeholder: "e.g. Johns Hopkins University",
                    })}
                    {field("researchArea", "Field of research", {
                      required: true,
                      placeholder: "e.g. Neuroscience",
                    })}
                    {field(
                      "website",
                      "Profile link",
                      { type: "url", placeholder: "https://" },
                      "(optional: LinkedIn, Google Scholar or university page)",
                    )}
                    <div className={auth.row}>
                      {field("password", "Password", {
                        type: "password",
                        required: true,
                        autoComplete: "new-password",
                        placeholder: "6+ characters",
                      })}
                      {field("confirmPassword", "Confirm", {
                        type: "password",
                        required: true,
                        autoComplete: "new-password",
                      })}
                    </div>

                    {error && (
                      <p
                        className={auth.error}
                        role='alert'
                        style={{ margin: 0 }}
                      >
                        {error}
                      </p>
                    )}
                    {alreadyStarted && (
                      <p
                        className={auth.notice}
                        role='alert'
                        style={{ margin: 0 }}
                      >
                        You've already started an application with this email.{" "}
                        <Link
                          to='/teacher/login'
                          style={{ color: "inherit", fontWeight: 700 }}
                        >
                          Log in
                        </Link>{" "}
                        to continue where you left off.
                      </p>
                    )}

                    <button
                      type='submit'
                      className={auth.btn}
                      disabled={submitting}
                    >
                      {submitting ? "Sending..." : "Continue →"}
                    </button>
                    <p className={auth.switch} style={{ marginTop: 4 }}>
                      Already applied? <Link to='/teacher/login'>Log in</Link>{" "}
                      to continue.
                    </p>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
