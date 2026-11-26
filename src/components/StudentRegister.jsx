import { useState } from "react";
import { register } from "../auth";
import { useNavigate, useLocation, Link } from "react-router-dom";
import styles from "./TeacherAuth.module.css";
import AuthLayout from "./AuthLayout";
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
    <AuthLayout
      title={
        <>
          Start with one <mark>question</mark>.
        </>
      }
      text='Create your student account, then choose a program and apply to work with a PhD mentor.'
      points={[
        "Create your account",
        "Verify your email",
        "Choose a program and apply",
      ]}
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
          <h1 className={styles.title}>
            {emailFailed ? "Account created" : "Check your email"}
          </h1>
          <p className={styles.bodyText}>
            {emailFailed ? (
              <>
                We couldn't send the verification email to{" "}
                <strong>{form.email}</strong>. Go to log in and choose "Resend
                verification email".
              </>
            ) : (
              <>
                We sent a verification link to <strong>{form.email}</strong>.
                Click it to verify your account, then log in. If you don't see
                it, check your spam folder.
              </>
            )}
          </p>
          <button
            onClick={() =>
              navigate("/student/login", { state: location.state })
            }
            className={styles.btn}
          >
            Go to log in →
          </button>
        </>
      ) : (
        <>
          <h1 className={styles.title}>Create your account</h1>
          <p className={styles.sub}>It takes about a minute.</p>

          {error && (
            <p className={styles.error} role='alert'>
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor='reg-name'>
                Full name
              </label>
              <input
                id='reg-name'
                className={styles.input}
                name='name'
                autoComplete='name'
                value={form.name}
                onChange={handleChange}
                placeholder='Your full name'
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor='reg-email'>
                Email
              </label>
              <input
                id='reg-email'
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
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor='reg-grade'>
                  Grade{" "}
                  <span style={{ color: "var(--muted)", fontWeight: 400 }}>
                    (optional)
                  </span>
                </label>
                <select
                  id='reg-grade'
                  className={styles.input}
                  name='grade'
                  value={form.grade}
                  onChange={handleChange}
                >
                  <option value=''>Select</option>
                  {GRADE_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor='reg-phone'>
                  Phone{" "}
                  <span style={{ color: "var(--muted)", fontWeight: 400 }}>
                    (optional)
                  </span>
                </label>
                <input
                  id='reg-phone'
                  className={styles.input}
                  name='phone'
                  type='tel'
                  autoComplete='tel'
                  value={form.phone}
                  onChange={handleChange}
                  placeholder='(555) 555-5555'
                />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor='reg-password'>
                Password
              </label>
              <input
                id='reg-password'
                className={styles.input}
                name='password'
                type='password'
                autoComplete='new-password'
                value={form.password}
                onChange={handleChange}
                placeholder='At least 6 characters'
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor='reg-confirmPassword'>
                Confirm password
              </label>
              <input
                id='reg-confirmPassword'
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
              {loading ? "Creating account..." : "Create account →"}
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
    </AuthLayout>
  );
}
