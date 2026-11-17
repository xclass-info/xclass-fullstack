import { Link } from "react-router-dom";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <video
        className={styles.videoBg}
        src='/hero-bg.mp4'
        poster='/hero-poster.jpg'
        autoPlay
        muted
        loop
        playsInline
      />
      <div className={styles.videoOverlay} />
      <div className={styles.inner}>
        <div className={styles.content}>
          <h1 className={styles.h1}>Your Research Journey, Guided by a PhD Mentor.</h1>
          <p className={styles.sub}>
            HappyResearch matches students with PhD and faculty mentors from
            top universities for one-on-one research projects - from your first
            question to a finished paper, poster or app.
          </p>
          <div className={styles.actions}>
            <Link to='/research' className='btn-primary'>
              Explore Research Projects {"→"}
            </Link>
            <Link to='/tutors' className='btn-ghost'>
              Find Your Mentor {"→"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
