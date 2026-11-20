import Navbar from "./Navbar";
import Footer from "./Footer";

export default function AboutUs() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />

      {/* Hero - the same calm opening as the homepage */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "150px 24px 8px" }}>
        <span className='rule' />
        <h1 className='page-title'>About HappyResearch</h1>
        <p className='page-sub' style={{ margin: 0 }}>
          We connect curious young minds with world-class research mentors to
          spark a lifelong love of discovery, innovation, and learning.
        </p>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 64px" }}>
        <div
          style={{
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 24,
          }}
        >
          <img
            src='/photos/aboutus-banner.jpg'
            alt='A mentor and student working together'
            style={{
              display: "block",
              width: "100%",
              maxHeight: 320,
              objectFit: "cover",
            }}
          />
        </div>

        {/* From the Founder */}
        <div
          style={{
            background: "white",
            borderRadius: 12,
            padding: 40,
            border: "1px solid var(--border)",
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontSize: "1.5rem", marginBottom: 8 }}>
            From the Founder
          </h2>
          <div
            style={{
              width: 48,
              height: 3,
              background: "linear-gradient(135deg, #2f6175, #427e94)",
              borderRadius: 2,
              marginBottom: 24,
            }}
          />

          <p
            style={{
              fontSize: 15,
              color: "#555",
              lineHeight: 1.9,
              marginBottom: 16,
            }}
          >
            When I was a student, my mind was filled with research ideas and
            curiosity. I was eager to explore, create, and contribute — but I
            struggled to find mentors who could guide me. Much of my time was
            spent searching for opportunities, navigating challenges alone, and
            trying to figure things out without support.
          </p>
          <p
            style={{
              fontSize: 15,
              color: "#555",
              lineHeight: 1.9,
              marginBottom: 16,
            }}
          >
            Years later, after becoming a professor myself, I began meeting many
            young students who shared the same passion for knowledge and
            discovery. They reached out hoping to join my lab as interns or
            volunteers, excited to experience real research for the first time.
            Whenever possible, I welcomed them. At one point, my research group
            grew to become the largest lab in our department.
          </p>
          <p
            style={{
              fontSize: 15,
              color: "#555",
              lineHeight: 1.9,
              marginBottom: 16,
            }}
          >
            Over time, however, I realized that my own time, energy, and
            expertise were limited. No single professor can mentor every student
            or cover every research direction. Yet there were still so many
            students searching for guidance, meaningful projects, and
            opportunities to grow.
          </p>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.9,
              marginBottom: 16,
              fontStyle: "italic",
              color: "#2f6175",
              borderLeft: "3px solid #2f6175",
              paddingLeft: 16,
            }}
          >
            How can we help more students access mentorship for the research
            they truly love? How can we create more opportunities for high
            school students to participate in real research experiences?
          </p>
          <p
            style={{
              fontSize: 15,
              color: "#555",
              lineHeight: 1.9,
              marginBottom: 16,
            }}
          >
            That is why we created HappyResearch.
          </p>
          <p
            style={{
              fontSize: 15,
              color: "#555",
              lineHeight: 1.9,
              marginBottom: 16,
            }}
          >
            HappyResearch brings together passionate mentors — professors,
            researchers, and PhD — who genuinely care about guiding the next
            generation. Here, students can freely explore and apply to research
            projects that match their interests and dreams.
          </p>
          <p
            style={{
              fontSize: 15,
              color: "#555",
              lineHeight: 1.9,
              marginBottom: 16,
            }}
          >
            We believe that talent exists everywhere, but opportunities do not
            always reach everyone. Our mission is to bridge that gap by making
            research mentorship more accessible, supportive, and inspiring.
          </p>
          <p
            style={{ fontSize: 15, color: "#555", lineHeight: 1.9, margin: 0 }}
          >
            We also warmly welcome more professors, researchers, and Ph.D.
            students to join us in empowering young minds, nurturing curiosity,
            and helping students turn their dreams into reality.
          </p>
        </div>
        {/* Mission */}
        <div
          style={{
            background: "white",
            borderRadius: 12,
            padding: 40,
            border: "1px solid var(--border)",
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontSize: "1.5rem", marginBottom: 16 }}>
            Our Mission
          </h2>
          <p style={{ fontSize: 15, color: "#555", lineHeight: 1.8 }}>
            At HappyResearch, we believe every student deserves the opportunity
            to experience real research — not just read about it in textbooks.
            Our mission is to bridge the gap between curious students and
            experienced researchers, creating meaningful mentorship experiences
            that inspire the next generation of scientists, engineers, and
            innovators.
          </p>
        </div>

        {/* What we do */}
        <div
          style={{
            background: "white",
            borderRadius: 12,
            padding: 40,
            border: "1px solid var(--border)",
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontSize: "1.5rem", marginBottom: 24 }}>
            What We Do
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 20,
            }}
          >
            {[
              {
                emoji: "💡",
                title: "Hands-On Projects",
                desc: "Students build real projects alongside PhD mentors, ending in something they made in fields ranging from AI to environmental science.",
              },
              {
                emoji: "📄",
                title: "Academic Research",
                desc: "Advanced students collaborate with mentors to produce academic-quality research papers, and are encouraged (though not guaranteed) to pursue publication.",
              },
              {
                emoji: "👩‍🏫",
                title: "1-on-1 Mentorship",
                desc: "Personalized guidance from world-class researchers who are passionate about teaching and mentoring.",
              },
              {
                emoji: "💬",
                title: "On-Demand Learning",
                desc: "Not sure what fits? Tell us what you need and we'll help you find the right mentor.",
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  background: "#f9fafb",
                  borderRadius: 12,
                  padding: 20,
                  border: "1px solid #eee",
                }}
              >
                <p style={{ fontSize: 28, marginBottom: 8 }}>{item.emoji}</p>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    marginBottom: 8,
                    color: "#333",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: "#666",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Why HappyResearch */}
        <div
          style={{
            background: "white",
            borderRadius: 12,
            padding: 40,
            border: "1px solid var(--border)",
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontSize: "1.5rem", marginBottom: 20 }}>
            Why HappyResearch?
          </h2>
          {[
            {
              title: "Real Research Experience",
              desc: "Students work on genuine research projects — not simulated exercises — giving them authentic experience and results they can be proud of.",
            },
            {
              title: "World-Class Mentors",
              desc: "Our mentors hold PhDs from top universities including MIT, Harvard, Stanford, and Caltech, with decades of research experience.",
            },
            {
              title: "Accessible to All Students",
              desc: "We believe talent is everywhere. Our programs are designed for motivated high school students regardless of prior research experience.",
            },
            {
              title: "Flexible & Remote",
              desc: "Most programs are fully remote, allowing students from anywhere in the world to participate without geographic barriers.",
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 16,
                marginBottom: 20,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #2f6175, #427e94)",
                  color: "white",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: 14,
                }}
              >
                {i + 1}
              </div>
              <div>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    margin: "0 0 4px",
                    color: "#333",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: "#666",
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div
          style={{
            background: "linear-gradient(135deg, #2f6175, #427e94)",
            borderRadius: 12,
            padding: 40,
            marginBottom: 24,
            color: "white",
          }}
        >
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: 32,
              textAlign: "center",
            }}
          >
            HappyResearch by the Numbers
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 24,
              textAlign: "center",
            }}
          >
            {[
              { num: "50+", label: "Research Mentors" },
              { num: "200+", label: "Students Served" },
              { num: "30+", label: "Research Fields" },
              { num: "95%", label: "Student Satisfaction" },
            ].map((stat) => (
              <div key={stat.label}>
                <p
                  style={{
                    fontSize: "2.5rem",
                    fontWeight: 700,
                    margin: "0 0 8px",
                  }}
                >
                  {stat.num}
                </p>
                <p style={{ fontSize: 14, opacity: 0.85, margin: 0 }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <a
            href='/projects'
            style={{
              padding: "12px 32px",
              borderRadius: 32,
              background: "#2f6175",
              color: "white",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 15,
            }}
          >
            💡 Browse Projects
          </a>
          <a
            href='/research'
            style={{
              padding: "12px 32px",
              borderRadius: 32,
              background: "#2f6175",
              color: "white",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 15,
            }}
          >
            🔬 Browse Research
          </a>
          <a
            href='/tutors'
            style={{
              padding: "12px 32px",
              borderRadius: 32,
              background: "#2f6175",
              color: "white",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 15,
            }}
          >
            Browse Mentors
          </a>
          <a
            href='/contact'
            style={{
              padding: "12px 32px",
              borderRadius: 32,
              background: "#f9fafb",
              color: "#333",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 15,
              border: "1px solid #ddd",
            }}
          >
            Contact Us
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
