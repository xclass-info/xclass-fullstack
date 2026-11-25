import { useState } from "react";
import { login, logout, sendPasswordReset } from "../auth";
import { useNavigate, useLocation, Link } from "react-router-dom";
import styles from "./TeacherAuth.module.css";
import Footer from "./Footer";
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

  const notice = {
    color: "var(--mint)",
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
  };

  return (
    <>
      <div className={styles.page}>
        <div className={styles.card}>
          <button className={styles.closeBtn} onClick={() => navigate("/")}>
            ✕
          </button>
          <h1 className={styles.title}>Student login</h1>
          <p className={styles.sub}>Welcome back to HappyResearch</p>

          {location.state?.from && (
            <p style={notice}>Log in to finish registering.</p>
          )}

          {error && <p className={styles.error}>{error}</p>}

          {showResend && !resendSent && (
            <button
              type='button'
              onClick={handleResendVerification}
              disabled={resendLoading}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 8,
                border: "1px solid #111111",
                background: "transparent",
                color: "#111111",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              {resendLoading ? "Sending..." : "📧 Resend Verification Email"}
            </button>
          )}
          {resendSent && (
            <p style={notice}>
              ✅ Verification email sent! Check your inbox and spam folder.
            </p>
          )}
          {resetSent && (
            <p style={notice}>
              ✅ Password reset email sent! Check your inbox and spam folder.
            </p>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
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
              <label className={styles.label}>Password</label>
              <input
                className={styles.input}
                name='password'
                type='password'
                value={form.password}
                onChange={handleChange}
                placeholder='••••••••'
                required
              />
            </div>

            <div style={{ textAlign: "right", marginBottom: 12 }}>
              <button
                type='button'
                onClick={handleForgotPassword}
                disabled={resetLoading}
                style={{
                  background: "none",
                  border: "none",
                  color: "#111111",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                {resetLoading ? "Sending..." : "Forgot password?"}
              </button>
            </div>

            <button className={styles.btn} type='submit' disabled={loading}>
              {loading ? "Logging in..." : "Login →"}
            </button>
          </form>

          <p className={styles.switch}>
            New here?{" "}
            <Link to='/student/register' state={location.state}>
              Create a student account
            </Link>
          </p>
          <p className={styles.switch}>
            Are you a mentor? <Link to='/teacher/login'>Mentor Login</Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
