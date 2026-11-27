// src/components/StatusCard.jsx
// A centred status card for one-step landing pages (email verification):
// a round icon, a serif title, a line of text and an optional button.
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import styles from "./StatusCard.module.css";

const ICONS = {
  wait: <circle cx='12' cy='12' r='8' strokeDasharray='4 4' />,
  ok: <path d='M20 6 9 17l-5-5' />,
  warn: (
    <>
      <path d='M12 7v6' />
      <path d='M12 17h.01' />
    </>
  ),
  error: (
    <>
      <path d='M17 7 7 17' />
      <path d='M7 7l10 10' />
    </>
  ),
};

export default function StatusCard({
  label,
  icon,
  title,
  text,
  action,
  actionTo,
}) {
  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.wrap}>
        <div className={styles.card} role='status'>
          <div
            className={`${styles.icon} ${icon === "warn" || icon === "error" ? styles.iconBad : ""}`}
            aria-hidden='true'
          >
            <svg
              width='26'
              height='26'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2.4'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              {ICONS[icon]}
            </svg>
          </div>
          {label && <p className='section-label'>{label}</p>}
          <h1 className={styles.title}>{title}</h1>
          {text && <p className={styles.text}>{text}</p>}
          {action && actionTo && (
            <Link to={actionTo} className='btn-primary'>
              {action} →
            </Link>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
