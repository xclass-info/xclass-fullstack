// src/components/ResetPassword.jsx
// Landing page for the "reset your password" email link (?token=...).
// Works for students, mentors and the admin - they share one login system.
import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { api } from "../api";
import styles from "./TeacherAuth.module.css";
import Footer from "./Footer";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

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
      await api.post("/auth/reset-password", { token, password: form.password });
      setDone(true);
    } catch (err) {
      setError(
        err.code === "INVALID_TOKEN"
          ? "This reset link is invalid or has expired. Please request a new one from the login page."
          : "Something went wrong. Please try again.",
      );
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
              <p style={{ fontSize: 48, marginBottom: 12 }}>✅</p>
              <h3 style={{ color: "var(--primary-hover)", marginBottom: 8 }}>
                Password updated
              </h3>
              <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>
                You can now log in with your new password.
              </p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                <Link to='/student/login' className={styles.btn} style={{ textDecoration: "none" }}>
                  Student Login →
                </Link>
                <Link to='/teacher/login' className={styles.btn} style={{ textDecoration: "none" }}>
                  Mentor Login →
                </Link>
              </div>
            </div>
          ) : !token ? (
            <div style={{ textAlign: "center", padding: 20 }}>
              <p style={{ fontSize: 48, marginBottom: 12 }}>⚠️</p>
              <h3 style={{ marginBottom: 8 }}>Link not valid</h3>
              <p style={{ color: "var(--muted)", fontSize: 14 }}>
                Request a new password reset link from the login page.
              </p>
            </div>
          ) : (
            <>
              <h1 className={styles.title}>Choose a new password</h1>
              <p className={styles.sub}>For your HappyResearch account</p>

              {error && <p className={styles.error}>{error}</p>}

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.field}>
                  <label className={styles.label}>New Password</label>
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
                  {loading ? "Saving..." : "Save Password →"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
