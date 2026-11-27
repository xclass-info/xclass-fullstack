// src/components/TeacherProfile.jsx
// Public mentor profile: portrait + name hero, bio and facts, the mentor's
// open research and projects (each links to its detail page), and a
// 1-on-1 booking dialog.
import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { api, getOrNull, live, seg, toMillis } from "../api";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { safeUrl, seatsStatus, LESSON_STRUCTURE_LABEL } from "../utils/format";
import { SeatsRow, RegisterModal, LoginPrompt } from "./RegisterControls";
import { useStudentAuth } from "../utils/useStudentAuth";
import { formatMentorName } from "../utils/mentorName";
import { mentorTypeLabel } from "../utils/mentorVerification";
import { toPrereqArray } from "../utils/prerequisites";
import styles from "./TeacherProfile.module.css";
import reg from "./RegisterControls.module.css";
import auth from "./TeacherAuth.module.css";

const STAGE_LABEL = { active: "Active", completed: "Completed" };

const newestFirst = (a, b) => toMillis(b.createdAt) - toMillis(a.createdAt);

function initials(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// "2026-12-03" + "16:00" -> "Thu, Dec 3 · 4:00 PM"
function slotLabel(slot) {
  const d = new Date(`${slot.date}T${slot.time}`);
  if (Number.isNaN(d.getTime())) return `${slot.date} ${slot.time}`;
  const day = d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${day} · ${time}`;
}

// One research topic or project. Items from the research/projects
// collections link to their detail page; the older per-profile project
// list has no page, so those cards aren't clickable.
function ProgramCard({ kind, item, detailPath, fieldKey, onRegister }) {
  const navigate = useNavigate();
  const stage = item.stage || "active";
  const prereqs = toPrereqArray(item.prerequisites);
  // Research always has a single seat, so the count only shows for projects.
  const showSeats = kind === "project" && Boolean(item.seats);
  const href = detailPath ? `${detailPath}/${item.id}` : null;
  return (
    <article
      className={`${styles.card} ${href ? styles.cardClickable : ""}`}
      onClick={href ? () => navigate(href) : undefined}
    >
      <div className={styles.cardTop}>
        <span className={styles.kind}>
          {kind === "research" ? "Research" : "Project"}
        </span>
        {item.stage && (
          <span
            className={`${styles.stage} ${stage === "completed" ? styles.stageDone : ""}`}
          >
            {STAGE_LABEL[stage] || STAGE_LABEL.active}
          </span>
        )}
      </div>
      <h3 className={styles.cardTitle}>
        {href ? (
          <Link
            to={href}
            className={styles.cardLink}
            onClick={(e) => e.stopPropagation()}
          >
            {item.title}
          </Link>
        ) : (
          item.title
        )}
      </h3>
      {item[fieldKey] && <p className={styles.cardText}>{item[fieldKey]}</p>}
      <div className={styles.tags}>
        {item.gradeLevel && (
          <span className={styles.tag}>{item.gradeLevel}</span>
        )}
        <span className={styles.tag}>{LESSON_STRUCTURE_LABEL}</span>
      </div>
      {(item.deliverable || prereqs.length > 0 || showSeats) && (
        <dl className={styles.cardFacts}>
          {item.deliverable && (
            <div>
              <dt>You'll produce</dt>
              <dd>{item.deliverable}</dd>
            </div>
          )}
          {prereqs.length > 0 && (
            <div>
              <dt>Prerequisites</dt>
              <dd>{prereqs.join(", ")}</dd>
            </div>
          )}
          {showSeats && (
            <div>
              <dt>Seats</dt>
              <dd>{seatsStatus(item.seats, item.enrolledCount)}</dd>
            </div>
          )}
        </dl>
      )}
      <div className={styles.cardFoot} onClick={(e) => e.stopPropagation()}>
        {href && (
          <Link to={href} className={styles.more}>
            Read more →
          </Link>
        )}
        <SeatsRow hideCount kind={kind} item={item} onRegister={onRegister} />
      </div>
    </article>
  );
}

export default function TeacherProfile() {
  const { teacherId } = useParams();
  const location = useLocation();
  const { student } = useStudentAuth();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({ name: "", email: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [bookError, setBookError] = useState("");
  const [booked, setBooked] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [research, setResearch] = useState([]);
  const [projects, setProjects] = useState([]);
  const [registering, setRegistering] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);

  useEffect(() => {
    const unsub = live(
      () => getOrNull(`/teachers/${seg(teacherId)}`),
      (data) => {
        if (data) setTeacher(data);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [teacherId]);

  useEffect(() => {
    async function fetchSlots() {
      try {
        const rows = await api.get(`/teachers/${seg(teacherId)}/availability`);
        setSlots(
          rows
            .filter((s) => !s.booked)
            .sort(
              (a, b) =>
                new Date(`${a.date}T${a.time}`) -
                new Date(`${b.date}T${b.time}`),
            ),
        );
      } catch (err) {
        console.error(err);
      }
    }
    fetchSlots();
  }, [teacherId]);

  // Same content the mentor sees in their dashboard, read-only. Bookings are
  // intentionally not loaded - they contain students' names and emails.
  useEffect(() => {
    async function loadPortfolio() {
      const byTeacher = (name) =>
        api.get(`/${name}?teacherId=${seg(teacherId)}`);
      try {
        const [r, p] = await Promise.all([
          byTeacher("research"),
          byTeacher("projects"),
        ]);
        setResearch(
          [...r].sort(newestFirst).filter((x) => x.status === "published"),
        );
        setProjects([...p].sort(newestFirst));
      } catch (err) {
        console.error(err);
      }
    }
    loadPortfolio();
  }, [teacherId]);

  // Close dialogs with Escape.
  useEffect(() => {
    if (!showBooking && !showLoginPrompt) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setShowBooking(false);
        setShowLoginPrompt(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showBooking, showLoginPrompt]);

  function openRegister(kind, item) {
    // Registering requires a logged-in student account, so it can be tied
    // to the student's record and reliably show up on their dashboard.
    if (!student) {
      setShowLoginPrompt(true);
      return;
    }
    setRegistering({ kind, item });
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Please enter your name.";
    if (!form.email.trim()) e.email = "Please enter your email.";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      e.email = "That email doesn't look right.";
    return e;
  }

  async function handleBook(e) {
    e.preventDefault();
    setBookError("");
    if (!selectedSlot) {
      setBookError("Pick a time first.");
      return;
    }
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setSubmitting(true);
    try {
      // The backend copies date/time/duration from the slot itself.
      await api.post("/bookings", {
        teacherId: teacher.id,
        slotId: selectedSlot.id,
        studentName: form.name,
        studentEmail: form.email,
      });
      setBooked(true);
      setSlots((prev) => prev.filter((s) => s.id !== selectedSlot.id));
    } catch (err) {
      console.error(err);
      setBookError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function closeBooking() {
    setShowBooking(false);
    if (booked) {
      setBooked(false);
      setSelectedSlot(null);
    }
  }

  if (loading || !teacher || teacher.verificationStatus !== "approved") {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={`${styles.wrap} ${styles.state}`}>
          {loading ? (
            <p className={styles.muted}>Loading...</p>
          ) : (
            <>
              <h1 className={styles.stateTitle}>Mentor not found.</h1>
              <p className={styles.muted}>
                This profile may have been removed or isn't public yet.
              </p>
              <Link to='/tutors' className='btn-ghost'>
                ← All mentors
              </Link>
            </>
          )}
        </div>
        {!loading && <Footer />}
      </div>
    );
  }

  const expertiseTags = [
    ...new Set(
      [teacher.major, teacher.researchArea, teacher.expertise].filter(Boolean),
    ),
  ];
  const displayName = formatMentorName(teacher.name, {
    mentorType: teacher.mentorType,
    degree: teacher.degree,
  });
  const credentials = [teacher.degree, teacher.university]
    .filter(Boolean)
    .join(" · ");
  const legacyProjects = teacher.projects || [];
  const programCount =
    research.length + projects.length + legacyProjects.length;
  const website = teacher.website ? safeUrl(teacher.website) : null;

  const facts = [
    research.length > 0 && {
      label: "Research topics",
      value: research.length,
      big: true,
    },
    projects.length + legacyProjects.length > 0 && {
      label: "Projects",
      value: projects.length + legacyProjects.length,
      big: true,
    },
    teacher.yearsOfExperience && {
      label: "Years of experience",
      value: teacher.yearsOfExperience,
      big: true,
    },
    teacher.languages && { label: "Languages", value: teacher.languages },
    teacher.gender && { label: "Gender", value: teacher.gender },
    teacher.website && {
      label: "Website",
      value: website ? (
        <a href={website} target='_blank' rel='noreferrer'>
          {teacher.website.replace(/^https?:\/\//, "")}
        </a>
      ) : (
        teacher.website
      ),
    },
  ].filter(Boolean);

  return (
    <div className={styles.page}>
      <Navbar />

      {/* ---- Hero ---- */}
      <header className={`${styles.wrap} ${styles.head}`}>
        <Link to='/tutors' className={styles.back}>
          ← All mentors
        </Link>
        <div className={styles.hero}>
          <div className={styles.portrait}>
            <span className={styles.initials} aria-hidden='true'>
              {initials(teacher.name)}
            </span>
            {teacher.photoURL && !photoFailed && (
              <img
                src={teacher.photoURL}
                alt={teacher.name}
                className={styles.photo}
                onError={() => setPhotoFailed(true)}
              />
            )}
          </div>

          <div className={styles.intro}>
            <div className={styles.kicker}>
              <span className='section-label' style={{ margin: 0 }}>
                Mentor
              </span>
              {teacher.mentorType && (
                <span className={styles.verified}>
                  ✓ Verified {mentorTypeLabel(teacher.mentorType)}
                </span>
              )}
            </div>
            <h1 className={styles.name}>{displayName}</h1>
            {credentials && <p className={styles.cred}>{credentials}</p>}
            <div className={styles.introBottom}>
              {expertiseTags.length > 0 && (
                <div className={styles.expertise}>
                  {expertiseTags.map((t) => (
                    <span key={t} className={styles.expTag}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <div className={styles.actions}>
                <button
                  type='button'
                  className='btn-primary'
                  onClick={() => setShowBooking(true)}
                >
                  Book a 1-on-1 session
                </button>
                {programCount > 0 && (
                  <a href='#programs' className='btn-ghost'>
                    See open programs
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ---- About + facts ---- */}
      {(teacher.bio || facts.length > 0) && (
        <section className={`${styles.wrap} ${styles.about}`}>
          <div className={styles.aboutHead}>
            <p className='section-label'>Background</p>
            <h2 className={styles.sectionTitle}>About.</h2>
          </div>
          <div className={styles.aboutBody}>
            {teacher.bio && <p className={styles.bio}>{teacher.bio}</p>}
            {facts.length > 0 && (
              <dl className={styles.facts}>
                {facts.map((f) => (
                  <div key={f.label} className={f.big ? styles.factBig : ""}>
                    <dt>{f.label}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </section>
      )}

      {/* ---- Programs ---- */}
      {programCount > 0 && (
        <section id='programs' className={styles.programs}>
          <div className={styles.wrap}>
            <p className='section-label'>Programs</p>
            <h2 className={styles.sectionTitle}>Work with this mentor.</h2>
            <p className={styles.programsSub}>
              Every program is {LESSON_STRUCTURE_LABEL.replace(" · ", ", ")}{" "}
              with this mentor, and ends in something you made.
            </p>
            <div className={styles.grid}>
              {research.map((r) => (
                <ProgramCard
                  key={r.id}
                  kind='research'
                  item={r}
                  detailPath='/research'
                  fieldKey='idea'
                  onRegister={openRegister}
                />
              ))}
              {projects.map((p) => (
                <ProgramCard
                  key={p.id}
                  kind='project'
                  item={p}
                  detailPath='/projects'
                  fieldKey='description'
                  onRegister={openRegister}
                />
              ))}
              {legacyProjects.map((p, i) => (
                <ProgramCard
                  key={p.id || `legacy-${i}`}
                  kind='project'
                  item={p}
                  fieldKey='description'
                  onRegister={openRegister}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---- Booking band ---- */}
      <section className={styles.band}>
        <div className={`${styles.wrap} ${styles.bandInner}`}>
          <p className='section-label'>1-on-1</p>
          <h2 className={styles.bandTitle}>Have a question for this mentor?</h2>
          <p className={styles.bandSub}>
            Book a single session to talk through an idea, a project or what
            research could look like for you.
          </p>
          <button
            type='button'
            className='btn-primary'
            onClick={() => setShowBooking(true)}
          >
            Book a 1-on-1 session →
          </button>
        </div>
      </section>

      {/* ---- Booking dialog ---- */}
      {showBooking && (
        <div className={reg.overlay} onClick={closeBooking}>
          <div
            className={reg.modal}
            role='dialog'
            aria-modal='true'
            aria-labelledby='booking-title'
            onClick={(e) => e.stopPropagation()}
          >
            {booked ? (
              <div>
                <p className={reg.modalKicker}>1-on-1 session</p>
                <h3 id='booking-title' className={reg.modalTitle}>
                  Request sent.
                </h3>
                <p className={reg.modalText}>
                  {displayName} will confirm your session by email at{" "}
                  <strong>{form.email}</strong>.
                </p>
                <button
                  type='button'
                  className={reg.applyBtn}
                  onClick={closeBooking}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleBook} noValidate>
                <div className={reg.modalHead}>
                  <div>
                    <p className={reg.modalKicker}>1-on-1 session</p>
                    <h3 id='booking-title' className={reg.modalTitle}>
                      Book with {displayName}
                    </h3>
                  </div>
                  <button
                    type='button'
                    className={reg.close}
                    onClick={closeBooking}
                    aria-label='Close'
                  >
                    ✕
                  </button>
                </div>

                <p className={styles.formLabel}>Pick a time</p>
                {slots.length === 0 ? (
                  <p className={styles.noSlots}>
                    No open times right now. Check back soon, or{" "}
                    <Link to='/tell-us-what-you-need'>
                      tell us what you need
                    </Link>{" "}
                    and we'll set something up.
                  </p>
                ) : (
                  <div className={styles.slots}>
                    {slots.map((slot) => (
                      <button
                        type='button'
                        key={slot.id}
                        aria-pressed={selectedSlot?.id === slot.id}
                        className={`${styles.slot} ${selectedSlot?.id === slot.id ? styles.slotOn : ""}`}
                        onClick={() => {
                          setSelectedSlot(slot);
                          setBookError("");
                        }}
                      >
                        <span className={styles.slotWhen}>
                          {slotLabel(slot)}
                        </span>
                        <span className={styles.slotMeta}>
                          {slot.duration} min ·{" "}
                          {slot.price > 0 ? `$${slot.price}` : "Free"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {slots.length > 0 && (
                  <>
                    <p className={styles.formLabel}>Your details</p>
                    <div className={styles.fields}>
                      <input
                        className={`${auth.input} ${errors.name ? auth.inputError : ""}`}
                        placeholder='Your full name'
                        aria-label='Your full name'
                        value={form.name}
                        onChange={(e) => {
                          setForm({ ...form, name: e.target.value });
                          setErrors({ ...errors, name: "" });
                        }}
                      />
                      {errors.name && (
                        <p className={auth.errorMsg}>{errors.name}</p>
                      )}
                      <input
                        className={`${auth.input} ${errors.email ? auth.inputError : ""}`}
                        placeholder='Your email'
                        aria-label='Your email'
                        type='email'
                        value={form.email}
                        onChange={(e) => {
                          setForm({ ...form, email: e.target.value });
                          setErrors({ ...errors, email: "" });
                        }}
                      />
                      {errors.email && (
                        <p className={auth.errorMsg}>{errors.email}</p>
                      )}
                    </div>
                    {bookError && <p className={reg.error}>{bookError}</p>}
                    <button
                      type='submit'
                      className={reg.applyBtn}
                      disabled={submitting}
                    >
                      {submitting
                        ? "Sending request..."
                        : "Request this time →"}
                    </button>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {registering && student && (
        <RegisterModal
          kind={registering.kind}
          item={registering.item}
          student={student}
          onClose={() => setRegistering(null)}
        />
      )}

      {showLoginPrompt && (
        <div className={reg.overlay} onClick={() => setShowLoginPrompt(false)}>
          <div
            className={styles.loginBox}
            role='dialog'
            aria-modal='true'
            aria-label='Log in to apply'
            onClick={(e) => e.stopPropagation()}
          >
            <LoginPrompt from={location.pathname} />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
