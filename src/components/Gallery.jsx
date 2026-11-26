// src/components/Gallery.jsx
// Photos and video from our programs: a featured intro video, then a
// masonry grid of photos (lazy-loaded, shown in batches) that open in a
// full-screen viewer with previous/next and keyboard support.
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import list from "./ProgramListing.module.css";
import styles from "./Gallery.module.css";

const PHOTOS = [
  "/gallery/3.jpg",
  "/gallery/4.jpg",
  "/gallery/5.jpg",
  "/gallery/6.jpg",
  "/gallery/7.jpg",
  "/gallery/8.jpg",
  "/gallery/9.jpg",
  "/gallery/10.jpg",
  "/gallery/11.jpg",
  "/gallery/12.jpg",
  "/gallery/13.jpg",
  "/gallery/14.jpg",
  "/gallery/15.jpg",
  "/gallery/16.jpg",
  "/gallery/17.jpg",
  "/gallery/18.jpg",
  "/gallery/20.jpg",
  "/gallery/21.jpg",
  "/gallery/24.jpg",
  "/gallery/25.jpg",
  "/gallery/28.jpg",
  "/gallery/29.jpg",
  "/gallery/31.jpg",
  "/gallery/33.jpg",
  "/gallery/35.jpg",
  "/gallery/36.jpg",
  "/gallery/37.jpg",
  "/gallery/38.jpg",
  "/gallery/39.jpg",
  "/gallery/40.jpg",
  "/gallery/41.jpg",
  "/gallery/42.jpg",
  "/gallery/43.jpg",
  "/gallery/44.jpg",
  "/gallery/46.jpg",
  "/gallery/47.jpg",
  "/gallery/48.jpg",
  "/gallery/49.jpg",
  "/gallery/50.jpg",
  "/gallery/51.jpg",
  "/gallery/52.jpg",
  "/gallery/54.jpg",
  "/gallery/55.jpg",
  "/gallery/56.jpg",
  "/gallery/57.jpg",
  "/gallery/58.jpg",
  "/gallery/60.jpg",
  "/gallery/61.jpg",
  "/gallery/62.jpg",
  "/gallery/64.jpg",
  "/gallery/65.jpg",
  "/gallery/66.jpg",
  "/gallery/67.jpg",
  "/gallery/68.jpg",
  "/gallery/69.jpg",
  "/gallery/70.jpg",
  "/gallery/71.jpg",
  "/gallery/75.jpg",
  "/gallery/76.jpg",
  "/gallery/78.jpg",
  "/gallery/79.jpg",
  "/gallery/80.jpg",
  "/gallery/85.jpg",
  "/gallery/86.png",
  "/gallery/88.png",
  "/gallery/89.png",
  "/gallery/90.jpg",
  "/gallery/91.png",
];

const VIDEO = {
  url: "https://www.youtube.com/embed/G1IM1_tz-qQ",
  title: "Introduction to HappyResearch",
};

const BATCH = 18;

function Viewer({ index, onClose, onMove }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onMove(-1);
      else if (e.key === "ArrowRight") onMove(1);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, onMove]);

  return (
    <div
      className={styles.viewer}
      role='dialog'
      aria-modal='true'
      aria-label='Photo viewer'
      onClick={onClose}
    >
      <div className={styles.viewerTop} onClick={(e) => e.stopPropagation()}>
        <span className={styles.viewerCount}>
          {index + 1} / {PHOTOS.length}
        </span>
        <button
          type='button'
          className={styles.viewerBtn}
          onClick={onClose}
          aria-label='Close'
        >
          ✕
        </button>
      </div>
      <img
        src={PHOTOS[index]}
        alt={`Program photo ${index + 1} of ${PHOTOS.length}`}
        className={styles.viewerImg}
        onClick={(e) => e.stopPropagation()}
      />
      <button
        type='button'
        className={`${styles.viewerBtn} ${styles.viewerPrev}`}
        onClick={(e) => {
          e.stopPropagation();
          onMove(-1);
        }}
        aria-label='Previous photo'
      >
        ←
      </button>
      <button
        type='button'
        className={`${styles.viewerBtn} ${styles.viewerNext}`}
        onClick={(e) => {
          e.stopPropagation();
          onMove(1);
        }}
        aria-label='Next photo'
      >
        →
      </button>
    </div>
  );
}

export default function Gallery() {
  const [shown, setShown] = useState(BATCH);
  const [open, setOpen] = useState(null); // index of the photo in the viewer

  const close = useCallback(() => setOpen(null), []);
  const move = useCallback(
    (step) =>
      setOpen((i) =>
        i === null ? i : (i + step + PHOTOS.length) % PHOTOS.length,
      ),
    [],
  );

  return (
    <div className={list.page}>
      <Navbar />

      <header className={list.head}>
        <div className={list.wrap}>
          <h1 className={list.title}>Gallery.</h1>
          <div className={list.headBottom}>
            <p className={list.sub}>
              Lab sessions, projects and presentations: moments from our
              programs and the students in them.
            </p>
          </div>
        </div>
      </header>

      <section className={`${list.wrap} ${styles.video}`}>
        <div className={styles.videoFrame}>
          <iframe
            src={VIDEO.url}
            title={VIDEO.title}
            loading='lazy'
            allow='accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen'
            allowFullScreen
          />
        </div>
        <div className={styles.videoText}>
          <p className='section-label' style={{ margin: 0 }}>
            Video
          </p>
          <h2 className={styles.videoTitle}>{VIDEO.title}</h2>
        </div>
      </section>

      <section className={`${list.wrap} ${styles.photos}`}>
        <div className={styles.photosHead}>
          <h2 className={styles.sectionTitle}>Photos.</h2>
          <p className={list.count}>{PHOTOS.length} photos</p>
        </div>
        <div className={styles.masonry}>
          {PHOTOS.slice(0, shown).map((src, i) => (
            <button
              key={src}
              type='button'
              className={styles.tile}
              onClick={() => setOpen(i)}
              aria-label={`Open photo ${i + 1}`}
            >
              <img src={src} alt='' loading='lazy' decoding='async' />
            </button>
          ))}
        </div>
        {shown < PHOTOS.length && (
          <div className={styles.moreRow}>
            <button
              type='button'
              className='btn-ghost'
              onClick={() => setShown((n) => n + BATCH)}
            >
              Show more photos ({PHOTOS.length - shown} left)
            </button>
          </div>
        )}
      </section>

      <section className={styles.band}>
        <div className={`${list.wrap} ${styles.bandInner}`}>
          <h2 className={styles.bandTitle}>Want to be in the next one?</h2>
          <Link to='/student/register' className='btn-lime'>
            Start your application →
          </Link>
        </div>
      </section>

      {open !== null && <Viewer index={open} onClose={close} onMove={move} />}

      <Footer />
    </div>
  );
}
