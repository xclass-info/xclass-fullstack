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

const NOT_ELIGIBLE = "not_eligible";

const STEPS = [
  { title: "Quick start", time: "2 minutes", text: "Tell us who you are. We'll email you a link to continue." },
  { title: "Your application", time: "About 10 minutes", text: "Your profile, proof of your PhD status and your CV. Saved as you go." },
  { title: "Review", time: "About 3 business days", text: "Our team reviews every application. Sometimes we'll ask for a short video interview." },
  { title: "Onboarding", time: "A few days", text: "Read our Mentor Guidelines. We run a background check on every mentor before they work with students." },
  { title: "Go live", time: "", text: "Your profile is published and students can apply for your research." },
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

const inputStyle = {
  width: "100%",
  padding: 12,
  borderRadius: 8,
  border: "1px solid #ddd",
  boxSizing: "border-box",
  fontSize: 15,
  fontFamily: "inherit",
  marginBottom: 14,
};

const labelStyle = { display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 };

const sectionTitle = {
  fontSize: "1.6rem",
  fontWeight: 700,
  margin: "0 0 20px",
  fontFamily: "'Source Serif 4', Georgia, serif",
  color: "#1f3a42",
};

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
        setError("This email already has a HappyResearch account. Please log in instead.");
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

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      <Navbar />

      {/* Hero */}
      <section style={{ background: "#1f3a42", color: "white", padding: "130px 24px 70px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
          <p style={{ color: "#e5c98a", fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 12px" }}>
            Become a Mentor
          </p>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 2.8rem)", margin: "0 0 16px", fontFamily: "'Source Serif 4', Georgia, serif", lineHeight: 1.2 }}>
            Guide the next generation of researchers
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: "#d6e4ea", margin: "0 0 28px" }}>
            Mentor a motivated student through a real research project in your
            field - online, on your schedule, and paid per project.
          </p>
          <a
            href='#apply'
            style={{ display: "inline-block", padding: "14px 32px", borderRadius: 10, background: "#9a772b", color: "white", fontWeight: 700, textDecoration: "none", fontSize: 16 }}
          >
            Apply in 2 minutes →
          </a>
        </div>
      </section>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "56px 24px" }}>
        {/* Who can apply + what it looks like */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, marginBottom: 56 }}>
          <div style={{ background: "white", borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <h2 style={{ ...sectionTitle, fontSize: "1.3rem" }}>Who can apply</h2>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9, color: "#334155" }}>
              {MENTOR_TYPES.map((t) => (
                <li key={t.value}>{t.plural}</li>
              ))}
            </ul>
          </div>
          <div style={{ background: "white", borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <h2 style={{ ...sectionTitle, fontSize: "1.3rem" }}>What mentoring looks like</h2>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9, color: "#334155" }}>
              <li>10 one-hour online sessions over about 3 months</li>
              <li>A real project in your field, from idea to finished result</li>
              <li>You propose the research topics</li>
              <li>We handle matching, scheduling and payments</li>
              <li>Paid per project</li>
            </ul>
          </div>
        </div>

        {/* How it works */}
        <h2 style={sectionTitle}>How it works</h2>
        <ol style={{ listStyle: "none", padding: 0, margin: "0 0 56px", display: "grid", gap: 12 }}>
          {STEPS.map((s, i) => (
            <li key={s.title} style={{ display: "flex", gap: 16, background: "white", borderRadius: 12, padding: "16px 20px", alignItems: "flex-start", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <span style={{ flexShrink: 0, width: 32, height: 32, borderRadius: "50%", background: "#2f6175", color: "white", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {i + 1}
              </span>
              <div>
                <strong style={{ color: "#1f3a42" }}>{s.title}</strong>
                {s.time && <span style={{ color: "#94a3b8", fontSize: 13 }}> · {s.time}</span>}
                <p style={{ margin: "4px 0 0", color: "#475569", lineHeight: 1.6 }}>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* FAQ */}
        <h2 style={sectionTitle}>Questions</h2>
        <div style={{ display: "grid", gap: 10, marginBottom: 56 }}>
          {FAQ.map((f) => (
            <details key={f.q} style={{ background: "white", borderRadius: 12, padding: "14px 20px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <summary style={{ cursor: "pointer", fontWeight: 600, color: "#1f3a42" }}>{f.q}</summary>
              <p style={{ margin: "10px 0 0", color: "#475569", lineHeight: 1.6 }}>{f.a}</p>
            </details>
          ))}
          <p style={{ fontSize: 14, color: "#64748b", margin: "6px 0 0" }}>
            Want to know more about how mentors work with students? Read our{" "}
            <Link to='/mentor/guidelines' style={{ color: "#2f6175" }}>Mentor Guidelines</Link>.
          </p>
        </div>

        {/* Quick start */}
        <section id='apply' style={{ background: "white", borderRadius: 16, padding: "32px 28px", maxWidth: 560, margin: "0 auto", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", borderTop: "4px solid #9a772b" }}>
          {sent ? (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 48, margin: "0 0 8px" }}>📧</p>
              <h2 style={{ ...sectionTitle, marginBottom: 8 }}>Check your email</h2>
              <p style={{ color: "#475569", lineHeight: 1.6, margin: 0 }}>
                We've sent a link to <strong>{form.email}</strong> to confirm
                your email and continue your application. It takes about 10
                minutes, and your progress is saved as you go. If you don't
                see it, check your spam folder.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2 style={{ ...sectionTitle, marginBottom: 6 }}>Start your application</h2>
              <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 20px" }}>
                Takes about 2 minutes.
              </p>

              <label style={labelStyle}>Full name</label>
              <input name='name' value={form.name} onChange={handleChange} required style={inputStyle} placeholder='Dr. Jane Smith' />

              <label style={labelStyle}>Email</label>
              <input name='email' type='email' value={form.email} onChange={handleChange} required style={inputStyle} placeholder='jane@university.edu' />

              <label style={labelStyle}>Your current role</label>
              <select name='mentorType' value={form.mentorType} onChange={handleChange} required style={inputStyle}>
                <option value=''>Select your role</option>
                {MENTOR_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
                <option value={NOT_ELIGIBLE}>Master's student, undergraduate, or other</option>
              </select>

              {form.mentorType === NOT_ELIGIBLE ? (
                <p style={{ background: "#fff8dc", color: "#8a6a25", borderRadius: 8, padding: "12px 14px", fontSize: 14, lineHeight: 1.6 }}>
                  Thank you for your interest! Our mentors are currently PhD
                  students and above. We'd love to hear from you once you've
                  started a PhD program.
                </p>
              ) : (
                <>
                  <label style={labelStyle}>University or organization</label>
                  <input name='university' value={form.university} onChange={handleChange} required style={inputStyle} placeholder='e.g. Johns Hopkins University' />

                  <label style={labelStyle}>Field of research</label>
                  <input name='researchArea' value={form.researchArea} onChange={handleChange} required style={inputStyle} placeholder='e.g. Neuroscience' />

                  <label style={labelStyle}>
                    Profile link <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional - LinkedIn, Google Scholar or university page)</span>
                  </label>
                  <input name='website' type='url' value={form.website} onChange={handleChange} style={inputStyle} placeholder='https://' />

                  <label style={labelStyle}>Password</label>
                  <input name='password' type='password' value={form.password} onChange={handleChange} required style={inputStyle} placeholder='At least 6 characters' autoComplete='new-password' />

                  <label style={labelStyle}>Confirm password</label>
                  <input name='confirmPassword' type='password' value={form.confirmPassword} onChange={handleChange} required style={inputStyle} placeholder='••••••••' autoComplete='new-password' />

                  {error && <p style={{ color: "#a01f13", fontSize: 14, margin: "0 0 12px" }}>{error}</p>}
                  {alreadyStarted && (
                    <p style={{ background: "#fff8dc", color: "#8a6a25", borderRadius: 8, padding: "12px 14px", fontSize: 14, lineHeight: 1.6, margin: "0 0 12px" }}>
                      You've already started an application with this email.{" "}
                      <Link to='/teacher/login' style={{ color: "#2f6175", fontWeight: 700 }}>Log in</Link>{" "}
                      to continue where you left off.
                    </p>
                  )}

                  <button
                    type='submit'
                    disabled={submitting}
                    style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#2f6175", color: "white", fontWeight: 700, fontSize: 16, cursor: "pointer" }}
                  >
                    {submitting ? "Sending..." : "Continue →"}
                  </button>
                  <p style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", margin: "14px 0 0" }}>
                    Already applied?{" "}
                    <Link to='/teacher/login' style={{ color: "#2f6175" }}>Log in</Link> to continue.
                  </p>
                </>
              )}
            </form>
          )}
        </section>
      </div>
      <Footer />
    </div>
  );
}
