import { useState } from "react";
import { register } from "../auth";
import { useNavigate, useLocation, Link } from "react-router-dom";
import styles from "./TeacherAuth.module.css";
import Footer from "./Footer";
import { GRADE_OPTIONS } from "../utils/grades";

export default function StudentRegister() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    name: "",
    email: "",
    grade: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [emailFailed, setEmailFailed] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      // Creates the account and its student record, and emails the
      // verification link. They must verify and then log in, like mentors.
      const { emailSent } = await register({
        kind: "student",
        name: form.name.trim(),
        email: form.email.trim(),
        grade: form.grade.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      setEmailFailed(!emailSent);
      setDone(true);
    } catch (err) {
      if (err.code === "EMAIL_IN_USE") {
        setError("This email is already registered. Please log in instead.");
      } else if (err.code === "WEAK_PASSWORD") {
        setError("Password should be at least 6 characters.");
      } else if (err.code === "INVALID_EMAIL") {
        setError("Please enter a valid email address.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className={styles.page}>
        <div className={styles.card}>
          <button className={styles.closeBtn} onClick={() => navigate("/")}>
            ✕
          </button>

          {done ? (
            <div style={{ textAlign: "center", padding: 20 }}>
              <p style={{ fontSize: 48, marginBottom: 12 }}>📧</p>
              <h3 style={{ color: "var(--primary-hover)", marginBottom: 8 }}>
                {emailFailed ? "Account created" : "Check your email!"}
              </h3>
              <p
                style={{
                  color: "var(--muted)",
                  fontSize: 14,
                  lineHeight: 1.6,
                  marginBottom: 20,
                }}
              >
                {emailFailed ? (
                  <>
                    We couldn't send the verification email to{" "}
                    <strong>{form.email}</strong>. Go to Login and choose
                    "Resend Verification Email".
                  </>
                ) : (
                  <>
                    We sent a verification link to <strong>{form.email}</strong>
                    . Click it to verify your account before logging in. If you
                    don't see it, check your spam folder.
                  </>
                )}
              </p>
              <button
                onClick={() =>
                  navigate("/student/login", { state: location.state })
                }
                className={styles.btn}
              >
                Go to Login →
              </button>
            </div>
          ) : (
            <>
              <h1 className={styles.title}>Student sign up</h1>
              <p className={styles.sub}>
                Create your HappyResearch student account
              </p>

              {error && <p className={styles.error}>{error}</p>}

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.field}>
                  <label className={styles.label}>Full Name</label>
                  <input
                    className={styles.input}
                    name='name'
                    value={form.name}
                    onChange={handleChange}
                    placeholder='Your full name'
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Email</label>
                  <input
                    className={styles.input}
                    name='email'
                    type='email'
                    value={form.email}
                    onChange={handleChange}
                    placeholder='you@email.com'
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Grade (optional)</label>
                  <select
                    className={styles.input}
                    name='grade'
                    value={form.grade}
                    onChange={handleChange}
                  >
                    <option value=''>Select grade</option>
                    {GRADE_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Phone Number (optional)</label>
                  <input
                    className={styles.input}
                    name='phone'
                    type='tel'
                    value={form.phone}
                    onChange={handleChange}
                    placeholder='(555) 555-5555'
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Password</label>
                  <input
                    className={styles.input}
                    name='password'
                    type='password'
                    value={form.password}
                    onChange={handleChange}
                    placeholder='At least 6 characters'
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Confirm Password</label>
                  <input
                    className={styles.input}
                    name='confirmPassword'
                    type='password'
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder='••••••••'
                    required
                  />
                </div>
                <button className={styles.btn} type='submit' disabled={loading}>
                  {loading ? "Creating account..." : "Create Account →"}
                </button>
              </form>

              <p className={styles.switch}>
                Already have an account?{" "}
                <Link to='/student/login' state={location.state}>
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
