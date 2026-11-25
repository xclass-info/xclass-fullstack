import { useState } from "react";
import { login, logout, sendPasswordReset } from "../auth";
import { useNavigate, Link } from "react-router-dom";
import styles from "./TeacherAuth.module.css";
import AuthLayout from "./AuthLayout";
import {
  isAccountVerified,
  resendVerificationEmail,
} from "../utils/accountVerification";

export default function TeacherLogin() {
  const navigate = useNavigate();
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

      // Check if email is verified (accounts predating this field are
      // treated as verified - see isAccountVerified)
      if (user.teacher && !isAccountVerified(user.teacher)) {
        logout();
        setError(
          "Please verify your email before logging in. Check your inbox for the verification link.",
        );
        setShowResend(true);
        return;
      }

      navigate("/teacher/dashboard");
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
        setError("Invalid email or password");
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
        kind: "teacher",
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
          Welcome back, <mark>mentor</mark>.
        </>
      }
      text='Your students, sessions and programs are all in one place.'
    >
      <h1 className={styles.title}>Mentor log in</h1>
      <p className={styles.sub}>Use the email you applied with.</p>

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
        Want to mentor with us? <Link to='/become-a-mentor'>Apply here</Link>
      </p>
    </AuthLayout>
  );
}
