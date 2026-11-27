// src/components/AboutUs.jsx
// About page in the Warm Practice (Figma) style: statement + arched photo,
// a sage strip, the founder's letter, the mission, tinted "what we do" cards,
// a dark numbered "why" band, numbers, apply band.
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { ApplyBand } from "./HomeSections";
import styles from "./AboutUs.module.css";

const WHAT_WE_DO = [
  {
    to: "/projects",
    label: "Build",
    title: "Hands-on projects",
    desc: "Students build real projects alongside PhD mentors, ending in something they made in fields ranging from AI to environmental science.",
  },
  {
    to: "/research",
    label: "Write",
    title: "Academic research",
    desc: "Advanced students collaborate with mentors to produce academic-quality research papers, and are encouraged (though not guaranteed) to pursue publication.",
  },
  {
    to: "/tutors",
    label: "Book",
    title: "1-on-1 mentorship",
    desc: "Personalized guidance from researchers who are passionate about teaching and mentoring.",
  },
  {
    to: "/tell-us-what-you-need",
    label: "Ask",
    title: "On-demand learning",
    desc: "Not sure what fits? Tell us what you need and we'll help you find the right mentor.",
  },
];

const WHY = [
  {
    title: "Real research experience",
    desc: "Students work on genuine research projects, not simulated exercises, giving them authentic experience and results they can be proud of.",
  },
  {
    title: "World-class mentors",
    desc: "Our mentors hold PhDs from top universities including MIT, Harvard, Stanford, and Caltech, with decades of research experience.",
  },
  {
    title: "Accessible to all students",
    desc: "We believe talent is everywhere. Our programs are designed for motivated high school students regardless of prior research experience.",
  },
  {
    title: "Flexible and remote",
    desc: "Most programs are fully remote, allowing students from anywhere in the world to participate without geographic barriers.",
  },
];

const STRIP = [
  "Real research, not exercises",
  "Mentors with PhD training",
  "Fully online, from anywhere",
];

const NUMBERS = [
  { num: "50+", label: "Research mentors" },
  { num: "200+", label: "Students served" },
  { num: "30+", label: "Research fields" },
  { num: "95%", label: "Student satisfaction" },
];

export default function AboutUs() {
  return (
    <div className={styles.page}>
      <Navbar />

      {/* Hero */}
      <section className={styles.hero}>
        <div className={`${styles.wrap} ${styles.heroGrid}`}>
          <div>
            <p className='section-label'>About HappyResearch</p>
            <h1 className={styles.h1}>
              Every student deserves to do real{" "}
              <span className='mark'>research</span>.
            </h1>
            <p className={styles.heroSub}>
              We connect curious young minds with research mentors to spark a
              lifelong love of discovery, innovation, and learning.
            </p>
          </div>
          <div className={styles.arch}>
            <img
              src='/photos/aboutus-banner.jpg'
              alt='A mentor and student working together'
            />
          </div>
        </div>
      </section>

      {/* Sage strip */}
      <section className={styles.strip}>
        <ul className={`${styles.wrap} ${styles.stripList}`}>
          {STRIP.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      {/* From the founder */}
      <section className={styles.wrap}>
        <div className={styles.letter}>
          <div className={styles.letterHead}>
            <p className='section-label'>A personal note</p>
            <h2 className={styles.title}>From the founder.</h2>
          </div>
          <div className={styles.letterBody}>
            <p>
              As a student, I had more research ideas than people to ask about
              them. I wanted to explore, build and contribute, but I couldn't
              find a mentor to guide me. So I spent a lot of time searching for
              opportunities and working things out on my own.
            </p>
            <p>
              Years later, as a professor, I started hearing from students who
              reminded me of myself. They wrote asking to join my lab as interns
              or volunteers, eager to try real research for the first time. I
              said yes as often as I could, and at one point my group became the
              largest lab in our department.
            </p>
            <p>
              But one professor has only so many hours, and knows only so many
              fields. For every student I could take on, there were many more
              still looking for a mentor, a real project and a chance to grow.
            </p>
            <blockquote className={styles.quote}>
              What if every curious high school student could do real research,
              with a mentor who knows the field?
            </blockquote>
            <p className={styles.strong}>That question became HappyResearch.</p>
            <p>
              HappyResearch brings together professors, researchers and PhD
              students who want to guide the next generation. Students choose a
              project that matches what they're curious about, and work through
              it with a mentor, from the first question to a finished result.
            </p>
            <p>
              Talent is everywhere. Opportunity isn't. We're here to close that
              gap, one student and one mentor at a time.
            </p>
            <p>
              And if you're a professor, researcher or PhD student who remembers
              what it was like to have no one to ask,{" "}
              <Link to='/become-a-mentor'>we'd love for you to join us</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className={styles.wrap}>
        <div className={styles.mission}>
          <div>
            <p className='section-label'>Our mission</p>
            <h2 className={styles.title}>Real research, not just textbooks.</h2>
          </div>
          <p className={styles.missionText}>
            Every student deserves the opportunity to experience real research,
            not just read about it in textbooks. We bridge the gap between
            curious students and experienced researchers, creating mentorship
            that inspires the next generation of scientists, engineers, and
            innovators.
          </p>
        </div>
      </section>

      {/* What we do */}
      <section className={styles.wrap}>
        <div className={styles.what}>
          <p className='section-label'>What we do</p>
          <h2 className={styles.title}>Support that fits how you learn.</h2>
          <div className={styles.cards}>
            {WHAT_WE_DO.map((item, i) => (
              <Link key={item.to} to={item.to} className={styles.card}>
                <span className={styles.cardNum}>
                  {String(i + 1).padStart(2, "0")} / {item.label}
                </span>
                <span className={styles.cardTitle}>{item.title}</span>
                <span className={styles.cardText}>{item.desc}</span>
                <span className={styles.cardMore}>
                  Learn more <span aria-hidden='true'>→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why HappyResearch */}
      <section className={styles.dark}>
        <div className={styles.wrap}>
          <p className={`section-label ${styles.darkLabel}`}>
            Why HappyResearch
          </p>
          <h2 className={styles.darkTitle}>
            What makes mentorship here different.
          </h2>
          <ol className={styles.whyGrid}>
            {WHY.map((item, i) => (
              <li key={item.title} className={styles.whyItem}>
                <span className={styles.whyNum}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className={styles.whyTitle}>{item.title}</h3>
                <p className={styles.whyText}>{item.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Numbers */}
      <section className={styles.wrap}>
        <dl className={styles.numbers}>
          {NUMBERS.map((s) => (
            <div key={s.label} className={styles.stat}>
              <dt className={styles.statLabel}>{s.label}</dt>
              <dd className={styles.statNum}>{s.num}</dd>
            </div>
          ))}
        </dl>
      </section>

      <ApplyBand />
      <Footer />
    </div>
  );
}
