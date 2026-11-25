import { useState } from "react";
import { login, logout, sendPasswordReset } from "../auth";
import { useNavigate, useLocation, Link } from "react-router-dom";
import styles from "./TeacherAuth.module.css";
import AuthLayout from "./AuthLayout";
import {
  isAccountVerified,
  resendVerificationEmail,
} from "../utils/accountVerification";

export default function StudentLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [showResend, setShowResend] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setShowResend(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);

      // Mentors have accounts too - only student accounts belong here.
      if (!user.student) {
        logout();
        setError(
          "No student account found for this email. If you're a mentor, use Mentor Login.",
        );
        return;
      }

      if (!isAccountVerified(user.student)) {
        logout();
        setError(
          "Please verify your email before logging in. Check your inbox (and spam folder) for the verification link.",
        );
        setShowResend(true);
        return;
      }

      // Came here from a "Register now" click - go back and let them finish.
      navigate(location.state?.from || "/student/dashboard");
    } catch (err) {
      if (err.code === "INVALID_CREDENTIALS") {
        setError("Invalid email or password.");
      } else if (err.code === "PASSWORD_RESET_REQUIRED") {
        setError(
          'This account doesn\'t have a password yet - click "Forgot password?" below to set one.',
        );
      } else if (err.code === "RATE_LIMITED") {
        setError("Too many failed attempts. Please try again later.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!form.email.trim()) {
      setError("Please enter your email address first");
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordReset(form.email);
      setResetSent(true);
      setError("");
    } catch (err) {
      console.error("Reset error:", err.code);
      setError("Could not send reset email. Please check your email address.");
    } finally {
      setResetLoading(false);
    }
  }

  async function handleResendVerification() {
    if (!form.email || !form.password) {
      setError("Please enter your email and password first.");
      return;
    }
    setResendLoading(true);
    try {
      await resendVerificationEmail({
        kind: "student",
        email: form.email,
        password: form.password,
      });
      setResendSent(true);
      setError("");
    } catch {
      setError(
        "Could not resend verification email. Please check your credentials.",
      );
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <AuthLayout
      title={
        <>
          Welcome <mark>back</mark>.
        </>
      }
      text='Pick up your research where you left off.'
    >
      <h1 className={styles.title}>Student log in</h1>
      <p className={styles.sub}>Use the email you signed up with.</p>

      {location.state?.from && (
        <p className={styles.notice}>Log in to finish registering.</p>
      )}

      {error && (
        <p className={styles.error} role='alert'>
          {error}
        </p>
      )}

      {showResend && !resendSent && (
        <button
          type='button'
          className={styles.secondaryBtn}
          onClick={handleResendVerification}
          disabled={resendLoading}
        >
          {resendLoading ? "Sending..." : "Resend verification email"}
        </button>
      )}
      {resendSent && (
        <p className={styles.notice} role='status'>
          Verification email sent. Check your inbox and spam folder.
        </p>
      )}
      {resetSent && (
        <p className={styles.notice} role='status'>
          Password reset email sent. Check your inbox and spam folder.
        </p>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor='login-email'>
            Email
          </label>
          <input
            id='login-email'
            className={styles.input}
            name='email'
            type='email'
            autoComplete='email'
            value={form.email}
            onChange={handleChange}
            placeholder='you@email.com'
            required
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor='login-password'>
            Password
          </label>
          <input
            id='login-password'
            className={styles.input}
            name='password'
            type='password'
            autoComplete='current-password'
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>
        <div className={styles.passwordRow}>
          <button
            type='button'
            className={styles.linkBtn}
            onClick={handleForgotPassword}
            disabled={resetLoading}
          >
            {resetLoading ? "Sending..." : "Forgot password?"}
          </button>
        </div>

        <button className={styles.btn} type='submit' disabled={loading}>
          {loading ? "Logging in..." : "Log in →"}
        </button>
      </form>

      <p className={styles.switch}>
        New here?{" "}
        <Link to='/student/register' state={location.state}>
          Create a student account
        </Link>
      </p>
      <p className={styles.switch} style={{ marginTop: 8 }}>
        Are you a mentor? <Link to='/teacher/login'>Mentor log in</Link>
      </p>
    </AuthLayout>
  );
}
