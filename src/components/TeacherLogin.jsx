import { useState } from "react";
import { login, logout, sendPasswordReset } from "../auth";
import { useNavigate, Link } from "react-router-dom";
import styles from "./TeacherAuth.module.css";
import Footer from "./Footer";
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
    <>
      <div className={styles.page}>
        <div className={styles.card}>
          <button className={styles.closeBtn} onClick={() => navigate("/")}>
            ✕
          </button>
          <h1 className={styles.title}>Mentor login</h1>
          <p className={styles.sub}>Welcome back to HappyResearch</p>

          {error && <p className={styles.error}>{error}</p>}

          {/* Resend verification button */}
          {showResend && !resendSent && (
            <button
              type='button'
              onClick={handleResendVerification}
              disabled={resendLoading}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 8,
                border: "1px solid #2f6175",
                background: "transparent",
                color: "#2f6175",
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
            <p
              style={{
                color: "#1f6f4a",
                fontSize: 14,
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              ✅ Verification email sent! Check your inbox.
            </p>
          )}

          {resetSent && (
            <p
              style={{
                color: "#1f6f4a",
                fontSize: 14,
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              ✅ Password reset email sent! Check your inbox.
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
                placeholder='jane@email.com'
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

            {/* Forgot password */}
            <div style={{ textAlign: "right", marginBottom: 12 }}>
              <button
                type='button'
                onClick={handleForgotPassword}
                disabled={resetLoading}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2f6175",
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
            Want to mentor with us?{" "}
            <Link to='/become-a-mentor'>Apply here</Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
