// src/components/AboutUs.jsx
// About page in the Concept C style: big statement, the founder's letter,
// the mission, what we do (dark rows), why HappyResearch, numbers, apply band.
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { ApplyBand } from "./HomeSections";
import styles from "./AboutUs.module.css";

const WHAT_WE_DO = [
  {
    to: "/projects",
    title: "Hands-on projects",
    desc: "Students build real projects alongside PhD mentors, ending in something they made in fields ranging from AI to environmental science.",
  },
  {
    to: "/research",
    title: "Academic research",
    desc: "Advanced students collaborate with mentors to produce academic-quality research papers, and are encouraged (though not guaranteed) to pursue publication.",
  },
  {
    to: "/tutors",
    title: "1-on-1 mentorship",
    desc: "Personalized guidance from researchers who are passionate about teaching and mentoring.",
  },
  {
    to: "/tell-us-what-you-need",
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
        <div className={styles.wrap}>
          <p className='section-label'>About HappyResearch</p>
          <h1 className={styles.h1}>
            Every student deserves to do real{" "}
            <span className='mark'>research</span>.
          </h1>
          <p className={styles.heroSub}>
            We connect curious young minds with research mentors to spark a
            lifelong love of discovery, innovation, and learning.
          </p>
          <img
            src='/photos/aboutus-banner.jpg'
            alt='A mentor and student working together'
            className={styles.banner}
          />
        </div>
      </section>

      {/* From the founder */}
      <section className={styles.wrap}>
        <div className={styles.letter}>
          <div className={styles.letterHead}>
            <h2 className={styles.title}>From the founder.</h2>
          </div>
          <div className={styles.letterBody}>
            <p>
              When I was a student, my mind was filled with research ideas and
              curiosity. I was eager to explore, create, and contribute — but I
              struggled to find mentors who could guide me. Much of my time was
              spent searching for opportunities, navigating challenges alone,
              and trying to figure things out without support.
            </p>
            <p>
              Years later, after becoming a professor myself, I began meeting
              many young students who shared the same passion for knowledge and
              discovery. They reached out hoping to join my lab as interns or
              volunteers, excited to experience real research for the first
              time. Whenever possible, I welcomed them. At one point, my
              research group grew to become the largest lab in our department.
            </p>
            <p>
              Over time, however, I realized that my own time, energy, and
              expertise were limited. No single professor can mentor every
              student or cover every research direction. Yet there were still so
              many students searching for guidance, meaningful projects, and
              opportunities to grow.
            </p>
            <blockquote className={styles.quote}>
              How can we help more students access mentorship for the research
              they truly love? How can we create more opportunities for high
              school students to participate in real research experiences?
            </blockquote>
            <p className={styles.strong}>
              That is why we created HappyResearch.
            </p>
            <p>
              HappyResearch brings together passionate mentors — professors,
              researchers, and PhD students — who genuinely care about guiding
              the next generation. Here, students can freely explore and apply
              to research projects that match their interests and dreams.
            </p>
            <p>
              We believe that talent exists everywhere, but opportunities do not
              always reach everyone. Our mission is to bridge that gap by making
              research mentorship more accessible, supportive, and inspiring.
            </p>
            <p>
              We also warmly welcome more professors, researchers, and Ph.D.
              students to join us in empowering young minds, nurturing
              curiosity, and helping students turn their dreams into reality.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className={styles.mission}>
        <div className={styles.wrap}>
          <p className='section-label'>Our mission</p>
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
      <section className={styles.dark}>
        <div className={styles.wrap}>
          <h2 className={styles.darkTitle}>What we do.</h2>
          {WHAT_WE_DO.map((item) => (
            <Link key={item.to} to={item.to} className={styles.row}>
              <span className={styles.rowTitle}>{item.title}</span>
              <span className={styles.rowText}>{item.desc}</span>
              <span className={styles.rowArrow} aria-hidden='true'>
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Why HappyResearch */}
      <section className={styles.why}>
        <div className={styles.wrap}>
          <h2 className={styles.title}>Why HappyResearch.</h2>
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
