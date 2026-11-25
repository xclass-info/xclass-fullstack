import { Link } from "react-router-dom";
import styles from "./Hero.module.css";

// Concept C opening: one very large headline with the key words marked in
// lime, a heavy rule, then a single plain sentence and the two actions.
export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <h1 className={styles.h1}>
          Your research journey, guided by a{" "}
          <span className='mark'>PhD mentor</span>.
        </h1>
        <div className={styles.bottom}>
          <p className={styles.sub}>
            One student. One PhD mentor. One real question, worked through to a
            finished paper or project.
          </p>
          <div className={styles.actions}>
            <Link to='/student/register' className='btn-primary'>
              Start your application →
            </Link>
            <a href='#paths' className='btn-ghost'>
              See programs
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
