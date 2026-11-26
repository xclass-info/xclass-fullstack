// src/components/ResetPassword.jsx
// Landing page for the "reset your password" email link (?token=...).
// Works for students, mentors and the admin - they share one login system.
import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../api";
import styles from "./TeacherAuth.module.css";
import AuthLayout from "./AuthLayout";

export default function ResetPassword() {
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
      await api.post("/auth/reset-password", {
        token,
        password: form.password,
      });
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
    <AuthLayout
      title={
        <>
          A fresh <mark>start</mark>.
        </>
      }
      text='Choose a new password for your HappyResearch account.'
    >
      {done ? (
        <>
          <div className={styles.doneIcon} aria-hidden='true'>
            <svg
              width='26'
              height='26'
              viewBox='0 0 24 24'
              fill='none'
              stroke='#22372c'
              strokeWidth='2.4'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M20 6 9 17l-5-5' />
            </svg>
          </div>
          <h1 className={styles.title}>Password updated</h1>
          <p className={styles.bodyText}>
            You can now log in with your new password.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Link to='/student/login' className={styles.btn}>
              Student log in →
            </Link>
            <Link to='/teacher/login' className={styles.btn}>
              Mentor log in →
            </Link>
          </div>
        </>
      ) : !token ? (
        <>
          <h1 className={styles.title}>Link not valid</h1>
          <p className={styles.bodyText}>
            This link is missing its code. Request a new password reset link
            from the log in page.
          </p>
          <Link to='/student/login' className={styles.btn}>
            Go to log in →
          </Link>
        </>
      ) : (
        <>
          <h1 className={styles.title}>Choose a new password</h1>
          <p className={styles.sub}>At least 6 characters.</p>

          {error && (
            <p className={styles.error} role='alert'>
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor='reset-password'>
                New password
              </label>
              <input
                id='reset-password'
                className={styles.input}
                name='password'
                type='password'
                autoComplete='new-password'
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor='reset-confirm'>
                Confirm password
              </label>
              <input
                id='reset-confirm'
                className={styles.input}
                name='confirmPassword'
                type='password'
                autoComplete='new-password'
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
            <button className={styles.btn} type='submit' disabled={loading}>
              {loading ? "Saving..." : "Save password →"}
            </button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
