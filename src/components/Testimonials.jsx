import styles from "./Testimonials.module.css";

const TESTIMONIALS = [
  {
    quote:
      "HappyResearch completely changed how I think about science. I worked with Dr. Yang on a covid detection project and actually got to analyze real social media data. I never thought a high schooler like me could do real research!",
    name: "Sophia L.",
    info: "11th Grade · Astrophysics Research Student",
    initials: "SL",
    gradient: "linear-gradient(135deg, #111111, #111111)",
    featured: false,
  },
  {
    quote:
      "I joined HappyResearch's AI research program not knowing much about machine learning. By the end, I had built my own image classifier and co-authored a research summary. HappyResearch gave me the confidence to apply to top universities with a real research project on my resume.",
    name: "Marcus T.",
    info: "12th Grade · AI & Computer Vision Research Student",
    initials: "MT",
    gradient: "linear-gradient(135deg, #111111, #111111)",
    featured: true,
  },
  {
    quote:
      "As a parent, I was amazed at how much my daughter grew through HappyResearch. She went from being unsure about her future to presenting her environmental science research at a local symposium. The mentors are world-class and genuinely care about students.",
    name: "Jennifer W.",
    info: "Parent · Environmental Science Program",
    initials: "JW",
    gradient: "linear-gradient(135deg, #9a4a2f, #a85a44)",
    featured: false,
  },

  {
    quote:
      "I always loved biology but never knew how to turn that passion into something real. Through HappyResearch I worked on a genomics project with Dr. Li and learned bioinformatics tools I never even knew existed. This research program opened my eyes to what a career in science actually looks like.",
    name: "Aiden C.",
    info: "10th Grade · Genomics & Bioinformatics Research Student",
    initials: "AC",
    gradient: "linear-gradient(135deg, #4a4f8c, #6d3f6b)",
    featured: false,
  },
  {
    quote:
      "HappyResearch matched me with a robotics mentor who was incredibly patient and knowledgeable. I built an autonomous maze-solving robot from scratch over 4 months. I submitted it to my school science fair and won first place. I could not have done this without my mentor's guidance.",
    name: "Priya M.",
    info: "10th Grade · Robotics Research Student",
    initials: "PM",
    gradient: "linear-gradient(135deg, #1f6f4a, #111111)",
    featured: false,
  },
  {
    quote:
      "I was nervous about doing research as a 10th grader — I thought it was only for college students. But HappyResearch made it so approachable. My mentor Prof. Wang helped me design a real psychology experiment about screen time and attention. I learned more in 3 months than in a whole year of school.",
    name: "Ethan B.",
    info: "10th Grade · Cognitive Psychology Research Student",
    initials: "EB",
    gradient: "linear-gradient(135deg, #4b5a63, #555f66)",
    featured: false,
  },
];

function Card({ t }) {
  return (
    <div className={`${styles.card} ${t.featured ? styles.featured : ""}`}>
      <div className={styles.stars}>★★★★★</div>
      <blockquote>{t.quote}</blockquote>
      <div className={styles.author}>
        <div className={styles.avatar} style={{ background: t.gradient }}>
          {t.initials}
        </div>
        <div>
          <span className={styles.name}>{t.name}</span>
          <span className={styles.info}>{t.info}</span>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  return (
    <section id='testimonials' className={styles.section}>
      <div className={`${styles.header} reveal`}>
        <h2 className={styles.title}>In their own words.</h2>
      </div>

      <div className={`${styles.marqueeWrap} reveal`}>
        <div className={styles.track}>
          {TESTIMONIALS.map((t) => (
            <Card key={`a-${t.name}`} t={t} />
          ))}
          {/* Second copy only makes the scroll loop seamless - hidden from
              screen readers so each review is read once. */}
          <div aria-hidden='true' style={{ display: "contents" }}>
            {TESTIMONIALS.map((t) => (
              <Card key={`b-${t.name}`} t={t} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
