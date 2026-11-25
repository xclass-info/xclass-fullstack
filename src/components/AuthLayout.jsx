// src/components/AuthLayout.jsx
// Shared frame for the account pages (log in, sign up, reset password):
// a dark panel with one big statement on the left, the form on the right.
// On phones the panel shrinks to a short header above the form.
import { Link } from "react-router-dom";
import styles from "./TeacherAuth.module.css";

export default function AuthLayout({ title, text, points, children }) {
  return (
    <div className={styles.split}>
      <aside className={styles.aside}>
        <Link
          to='/'
          className={styles.asideLogo}
          aria-label='HappyResearch home'
        >
          happyresearch<span>.</span>
        </Link>
        <div className={styles.asideBody}>
          <p className={styles.asideTitle}>{title}</p>
          {text && <p className={styles.asideText}>{text}</p>}
          {points && (
            <ol className={styles.points}>
              {points.map((p, i) => (
                <li key={p}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {p}
                </li>
              ))}
            </ol>
          )}
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.mainTop}>
          <Link to='/' className={styles.backLink}>
            ← Back to site
          </Link>
        </div>
        <div className={styles.formWrap}>{children}</div>
      </main>
    </div>
  );
}
