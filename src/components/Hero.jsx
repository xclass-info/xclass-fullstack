import { Link } from "react-router-dom";
import styles from "./Hero.module.css";

// Two columns: the headline and actions on the left, an arch-topped photo
// of a real session on the right (stacks under the text on phones).
export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.text}>
          <p className='section-label'>Online research mentorship</p>
          <h1 className={styles.h1}>
            Your research journey, guided by a{" "}
            <span className='mark'>PhD mentor</span>.
          </h1>
          <p className={styles.sub}>
            One student. One PhD mentor. One real question, worked through to a
            finished paper or project.
          </p>
          <div className={styles.actions}>
            <Link to='/student/register' className='btn-primary'>
              Start your application →
            </Link>
            <a href='#paths' className='btn-ghost'>
              See programs ↓
            </a>
          </div>
        </div>
        <div className={styles.photo}>
          <img
            src='/photos/hero-mentor.jpg'
            alt='A mentor pointing to a chart in a notebook while a student listens'
            width='529'
            height='613'
          />
        </div>
      </div>
    </section>
  );
}
