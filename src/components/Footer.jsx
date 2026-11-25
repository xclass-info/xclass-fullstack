import { Link } from "react-router-dom";
import styles from "./Footer.module.css";

function scrollToReviews() {
  setTimeout(() => {
    const el = document.getElementById("testimonials");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, 300);
}

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.about}>
            <Link to='/' className={styles.wordmark}>
              happyresearch<span className={styles.dot}>.</span>
            </Link>
            <p className={styles.tagline}>
              Real research for curious students, guided by PhD and faculty
              mentors.
            </p>
            <a href='mailto:happyprogramming.us@gmail.com' className={styles.contact}>
              happyprogramming.us@gmail.com
            </a>
            <a href='tel:+17033000061' className={styles.contact}>
              (703) 300-0061
            </a>
          </div>

          <nav className={styles.columns} aria-label='Footer'>
            <div className={styles.column}>
              <p className={styles.heading}>Programs</p>
              <Link to='/research'>Research</Link>
              <Link to='/projects'>Projects</Link>
              <Link to='/tutors'>Mentors</Link>
              <Link to='/showcase'>Student Work</Link>
              <Link to='/gallery'>Gallery</Link>
            </div>
            <div className={styles.column}>
              <p className={styles.heading}>Company</p>
              <Link to='/about'>About us</Link>
              <Link to='/contact'>Contact</Link>
              <Link to='/become-a-mentor'>Become a Mentor</Link>
              <Link to='/' onClick={scrollToReviews}>
                Reviews
              </Link>
            </div>
            <div className={styles.column}>
              <p className={styles.heading}>Log in</p>
              <Link to='/student/login'>Student Login</Link>
              <Link to='/teacher/login'>Mentor Login</Link>
            </div>
          </nav>
        </div>

        <div className={styles.bottom}>
          <span>© 2026 HappyResearch</span>
          <span className={styles.legal}>
            <a href='#'>Privacy Policy</a>
            <a href='#'>Terms of Service</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
