import { Link } from "react-router-dom";
import styles from "./Hero.module.css";

// Button School-style opening: a short rule, one calm serif statement, a
// plain explanation, then the video in a framed card underneath.
export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <span className='rule' />
        <h1 className={styles.h1}>Your Research Journey, Guided by a PhD Mentor.</h1>
        <p className={styles.sub}>
          HappyResearch matches students with PhD and faculty mentors from top
          universities for one-on-one research projects - from your first
          question to a finished paper, poster or app.
        </p>
        <div className={styles.actions}>
          <Link to='/research' className='btn-primary'>
            Explore Research Projects
          </Link>
          <Link to='/tutors' className='btn-ghost'>
            Find your mentor {"→"}
          </Link>
        </div>

        <div className={styles.videoCard}>
          <video
            className={styles.video}
            src='/hero-bg.mp4'
            poster='/hero-poster.jpg'
            autoPlay
            muted
            loop
            playsInline
          />
        </div>
      </div>
    </section>
  );
}
