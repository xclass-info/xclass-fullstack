// src/components/TeacherDashboard.jsx
// A live mentor's dashboard: greeting and summary, then tabs for an
// overview, their content (research, projects, student work), 1-on-1
// availability, booking requests and their public profile details.
import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { api, live, seg, toMillis } from "../api";
import { onAuthStateChanged, logout } from "../auth";
import styles from "./TeacherDashboard.module.css";
import auth from "./TeacherAuth.module.css";
import Availability from "./Availability";
import BookingRequests from "./BookingRequests";
import ResearchForm from "./ResearchForm";
import ProjectForm from "./ProjectForm";
import ShowcaseForm from "./ShowcaseForm";
import ContentCard from "./ContentCard";
import Footer from "./Footer";
import { safeUrl } from "../utils/format";
import { DEGREE_OPTIONS } from "../utils/mentorVerification";

const PATH_BY_KIND = {
  research: "research",
  project: "projects",
  showcase: "showcase",
};

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "content", label: "Content" },
  { id: "availability", label: "Availability" },
  { id: "bookings", label: "Bookings" },
  { id: "profile", label: "Profile" },
];

const NEW_LABEL = {
  research: "Research topic",
  project: "Project",
  showcase: "Student work",
};

const PROFILE_FIELDS = [
  "gender",
  "degree",
  "expertise",
  "researchArea",
  "bio",
  "university",
  "yearsOfExperience",
  "languages",
  "website",
];

function profileFromTeacherData(data) {
  return Object.fromEntries(PROFILE_FIELDS.map((k) => [k, data[k] || ""]));
}

const countWords = (s) => (s || "").trim().split(/\s+/).filter(Boolean).length;

function ProfileTab({ teacher, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(() => profileFromTeacherData(teacher));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const words = countWords(profile.bio);

  function startEdit() {
    setProfile(profileFromTeacherData(teacher));
    setError("");
    setEditing(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "bio" && countWords(value) > 300) return;
    setProfile((prev) => ({ ...prev, [name]: value }));
    setError("");
  }

  async function save(e) {
    e.preventDefault();
    if (!profile.degree) return setError("Please select your degree.");
    if (!profile.university.trim())
      return setError("Please enter your university.");
    if (!profile.expertise.trim())
      return setError("Please enter your area of expertise.");
    if (!profile.languages.trim())
      return setError("Please enter the languages you speak.");
    setSaving(true);
    try {
      await api.patch("/teachers/me", profile);
      onSaved(profile);
      setEditing(false);
    } catch (err) {
      console.error(err);
      setError("Couldn't save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const view = (value) =>
    value ? value : <span className={styles.notSet}>Not set</span>;
  const website = safeUrl(teacher.website);

  return (
    <div>
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.sectionTitle}>Your profile.</h2>
          <p className={styles.sectionSub}>
            This is what students see on your public mentor page.{" "}
            <Link to={`/teacher/${teacher.id}`}>View it →</Link>
          </p>
        </div>
        {!editing && (
          <button type='button' className='btn-primary' onClick={startEdit}>
            Edit profile
          </button>
        )}
      </div>

      <div className={styles.panel}>
        {editing ? (
          <form onSubmit={save} noValidate>
            <div className={styles.formGrid}>
              <div className={auth.field}>
                <label className={auth.label} htmlFor='p-degree'>
                  Degree <span className={styles.req}>*</span>
                </label>
                <select
                  id='p-degree'
                  name='degree'
                  className={auth.input}
                  value={profile.degree}
                  onChange={handleChange}
                >
                  <option value=''>Select your highest degree</option>
                  {profile.degree &&
                    !DEGREE_OPTIONS.includes(profile.degree) && (
                      <option value={profile.degree}>{profile.degree}</option>
                    )}
                  {DEGREE_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className={auth.field}>
                <label className={auth.label} htmlFor='p-university'>
                  University or institution{" "}
                  <span className={styles.req}>*</span>
                </label>
                <input
                  id='p-university'
                  name='university'
                  className={auth.input}
                  value={profile.university}
                  onChange={handleChange}
                  placeholder='e.g. MIT, Stanford University'
                />
              </div>
              <div className={auth.field}>
                <label className={auth.label} htmlFor='p-expertise'>
                  Area of expertise <span className={styles.req}>*</span>
                </label>
                <input
                  id='p-expertise'
                  name='expertise'
                  className={auth.input}
                  value={profile.expertise}
                  onChange={handleChange}
                  placeholder='e.g. Machine Learning'
                />
              </div>
              <div className={auth.field}>
                <label className={auth.label} htmlFor='p-research'>
                  Research area
                </label>
                <input
                  id='p-research'
                  name='researchArea'
                  className={auth.input}
                  value={profile.researchArea}
                  onChange={handleChange}
                  placeholder='e.g. Computer Vision'
                />
              </div>
              <div className={auth.field}>
                <label className={auth.label} htmlFor='p-languages'>
                  Languages <span className={styles.req}>*</span>
                </label>
                <input
                  id='p-languages'
                  name='languages'
                  className={auth.input}
                  value={profile.languages}
                  onChange={handleChange}
                  placeholder='e.g. English, Spanish'
                />
              </div>
              <div className={auth.field}>
                <label className={auth.label} htmlFor='p-years'>
                  Years of teaching experience
                </label>
                <input
                  id='p-years'
                  name='yearsOfExperience'
                  type='number'
                  min='0'
                  className={auth.input}
                  value={profile.yearsOfExperience}
                  onChange={handleChange}
                  placeholder='e.g. 5'
                />
              </div>
              <div className={auth.field}>
                <label className={auth.label} htmlFor='p-gender'>
                  Gender
                </label>
                <select
                  id='p-gender'
                  name='gender'
                  className={auth.input}
                  value={profile.gender}
                  onChange={handleChange}
                >
                  <option value=''>Prefer not to say</option>
                  <option value='Male'>Male</option>
                  <option value='Female'>Female</option>
                </select>
              </div>
              <div className={auth.field}>
                <label className={auth.label} htmlFor='p-website'>
                  Website or LinkedIn
                </label>
                <input
                  id='p-website'
                  name='website'
                  className={auth.input}
                  value={profile.website}
                  onChange={handleChange}
                  placeholder='https://linkedin.com/in/yourname'
                />
              </div>
              <div className={`${auth.field} ${styles.full}`}>
                <div className={styles.sectionHead} style={{ margin: 0 }}>
                  <label className={auth.label} htmlFor='p-bio'>
                    About you
                  </label>
                  <span className={styles.notSet}>{words} / 300 words</span>
                </div>
                <textarea
                  id='p-bio'
                  name='bio'
                  rows={10}
                  className={`${auth.input} ${auth.textarea}`}
                  value={profile.bio}
                  onChange={handleChange}
                  placeholder='Your background, how you like to teach, and what students can expect working with you.'
                />
              </div>
            </div>
            {error && (
              <p className={auth.error} style={{ marginTop: 18 }}>
                {error}
              </p>
            )}
            <div className={styles.formActions}>
              <button type='submit' className='btn-primary' disabled={saving}>
                {saving ? "Saving..." : "Save profile"}
              </button>
              <button
                type='button'
                className='btn-ghost'
                disabled={saving}
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <dl className={styles.facts}>
            <div>
              <dt>Degree</dt>
              <dd>{view(teacher.degree)}</dd>
            </div>
            <div>
              <dt>University</dt>
              <dd>{view(teacher.university)}</dd>
            </div>
            <div>
              <dt>Area of expertise</dt>
              <dd>{view(teacher.expertise)}</dd>
            </div>
            <div>
              <dt>Research area</dt>
              <dd>{view(teacher.researchArea)}</dd>
            </div>
            <div>
              <dt>Languages</dt>
              <dd>{view(teacher.languages)}</dd>
            </div>
            <div>
              <dt>Years of experience</dt>
              <dd>{view(teacher.yearsOfExperience)}</dd>
            </div>
            <div>
              <dt>Gender</dt>
              <dd>{view(teacher.gender)}</dd>
            </div>
            <div>
              <dt>Website</dt>
              <dd>
                {website ? (
                  <a href={website} target='_blank' rel='noreferrer'>
                    {teacher.website.replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  view(teacher.website)
                )}
              </dd>
            </div>
            <div className={styles.factWide}>
              <dt>About you</dt>
              <dd className={styles.bioText}>{view(teacher.bio)}</dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [teacher, setTeacher] = useState(null);
  const [research, setResearch] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showcase, setShowcase] = useState([]);
  const [pendingBookings, setPendingBookings] = useState(0);
  const [activeForm, setActiveForm] = useState(null); // { kind, item } | null
  const [contentFilter, setContentFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(location.state?.tab || "overview");

  useEffect(() => {
    let unsubscribeTeacher = () => {};
    let unsubscribeContent = () => {};
    const unsubscribeAuth = onAuthStateChanged((user) => {
      unsubscribeTeacher();
      unsubscribeContent();
      if (!user) {
        navigate("/teacher/login");
        return;
      }

      // Kept fresh: verification status can change while this tab is open.
      unsubscribeTeacher = live(
        () => api.get("/teachers/me"),
        (data) => {
          // Until a mentor is approved, their application page is their home.
          if (data.verificationStatus !== "approved") {
            navigate("/mentor/application", { replace: true });
            return;
          }
          setTeacher(data);
        },
      );

      const mine = `teacherId=${seg(user.uid)}`;
      unsubscribeContent = live(
        () =>
          Promise.all([
            api.get(`/research?${mine}`),
            api.get(`/projects?${mine}`),
            api.get(`/showcase?${mine}`),
            api.get("/teachers/me/bookings?status=pending").catch(() => []),
          ]),
        ([r, p, s, b]) => {
          setResearch(r);
          setProjects(p);
          setShowcase(s);
          setPendingBookings(b.length);
          setLoading(false);
        },
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeTeacher();
      unsubscribeContent();
    };
  }, [navigate]);

  function handleLogout() {
    logout();
    navigate("/teacher/login");
  }

  async function deleteItem(kind, id) {
    if (!confirm("Delete this? This can't be undone.")) return;
    try {
      await api.del(`/${PATH_BY_KIND[kind]}/${seg(id)}`);
    } catch (err) {
      console.error(err);
      alert("Failed to delete. Please try again.");
    }
  }

  async function toggleStage(kind, item) {
    const nextStage = item.stage === "completed" ? "active" : "completed";
    try {
      await api.patch(`/${PATH_BY_KIND[kind]}/${seg(item.id)}`, {
        stage: nextStage,
      });
    } catch (err) {
      console.error(err);
      alert("Failed to update status. Please try again.");
    }
  }

  function startAdd(kind) {
    setActiveTab("content");
    setContentFilter(kind);
    setActiveForm({ kind, item: null });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goTab(id) {
    setActiveTab(id);
    if (id !== "content") setActiveForm(null);
  }

  const firstName = teacher
    ? (teacher.name || "")
        .replace(/^(dr|prof)\.?\s+/i, "")
        .trim()
        .split(/\s+/)[0]
    : "";

  const allContent = [
    ...research.map((r) => ({ ...r, kind: "research" })),
    ...projects.map((p) => ({ ...p, kind: "project" })),
    ...showcase.map((s) => ({ ...s, kind: "showcase" })),
  ].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
  const visibleContent =
    contentFilter === "all"
      ? allContent
      : allContent.filter((i) => i.kind === contentFilter);
  const openPrograms = [...research, ...projects].filter(
    (i) => i.stage !== "completed",
  ).length;

  const counts = {
    content: allContent.length,
    bookings: pendingBookings,
  };

  return (
    <div className={styles.page}>
      <header className={styles.bar}>
        <div className={`${styles.wrap} ${styles.barInner}`}>
          <Link to='/' className={styles.wordmark}>
            HappyResearch
          </Link>
          <div className={styles.barRight}>
            {teacher && (
              <Link
                to={`/teacher/${teacher.id}`}
                className={`${styles.barLink} ${styles.hideSm}`}
              >
                View public profile
              </Link>
            )}
            <button
              type='button'
              className={styles.barLink}
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {loading || !teacher ? (
        <div className={`${styles.wrap} ${styles.head}`}>
          <p className={styles.loading}>Loading your dashboard...</p>
        </div>
      ) : (
        <>
          <section className={styles.head}>
            <div className={styles.wrap}>
              <p className='section-label'>Mentor dashboard</p>
              <h1 className={styles.h1}>Hi, {firstName}.</h1>
              <div className={styles.headBottom}>
                <p className={styles.summary}>
                  <span className={styles.live}>✓ Live</span>
                  <span>
                    {openPrograms} open{" "}
                    {openPrograms === 1 ? "program" : "programs"}
                    {pendingBookings > 0 &&
                      ` · ${pendingBookings} booking ${pendingBookings === 1 ? "request" : "requests"} waiting`}
                  </span>
                </p>
                <div className={styles.actions}>
                  <button
                    type='button'
                    className='btn-primary'
                    onClick={() => startAdd("research")}
                  >
                    + New research topic
                  </button>
                  <button
                    type='button'
                    className='btn-ghost'
                    onClick={() => startAdd("project")}
                  >
                    + New project
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className={styles.wrap}>
            <nav className={styles.tabs} aria-label='Dashboard sections'>
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type='button'
                  aria-current={activeTab === t.id ? "page" : undefined}
                  className={`${styles.tab} ${activeTab === t.id ? styles.tabOn : ""}`}
                  onClick={() => goTab(t.id)}
                >
                  {t.label}
                  {t.id === "bookings" && counts.bookings > 0 ? (
                    <span className={styles.tabAlert}>{counts.bookings}</span>
                  ) : t.id === "content" && counts.content > 0 ? (
                    <span className={styles.tabCount}>{counts.content}</span>
                  ) : null}
                </button>
              ))}
            </nav>

            <main className={styles.body}>
              {activeTab === "overview" && (
                <div>
                  <div className={styles.stats}>
                    {[
                      ["Research topics", research.length, "research"],
                      ["Projects", projects.length, "project"],
                      ["Student work", showcase.length, "showcase"],
                    ].map(([label, n, kind]) => (
                      <button
                        key={label}
                        type='button'
                        className={styles.stat}
                        onClick={() => {
                          setContentFilter(kind);
                          setActiveForm(null);
                          setActiveTab("content");
                        }}
                      >
                        <span className={styles.statLabel}>{label}</span>
                        <span className={styles.statNum}>{n}</span>
                      </button>
                    ))}
                    <button
                      type='button'
                      className={`${styles.stat} ${pendingBookings > 0 ? styles.statHot : ""}`}
                      onClick={() => goTab("bookings")}
                    >
                      <span className={styles.statLabel}>
                        Booking requests waiting
                      </span>
                      <span className={styles.statNum}>{pendingBookings}</span>
                    </button>
                  </div>

                  <div className={styles.sectionHead}>
                    <h2 className={styles.sectionTitle}>What's next.</h2>
                  </div>
                  <ul className={styles.rows}>
                    {[
                      [
                        "Post a research topic",
                        "One student, ten guided lessons, ending in a paper or presentation.",
                        () => startAdd("research"),
                      ],
                      [
                        "Post a project",
                        "A small group builds something real, with you reviewing each step.",
                        () => startAdd("project"),
                      ],
                      [
                        "Add student work",
                        "Show finished work on the public Student Work page.",
                        () => startAdd("showcase"),
                      ],
                      [
                        "Open times for 1-on-1s",
                        "Add slots to your calendar so students can book a session.",
                        () => goTab("availability"),
                      ],
                      [
                        "Polish your profile",
                        "A clear bio and research area help students pick you.",
                        () => goTab("profile"),
                      ],
                    ].map(([title, text, onClick]) => (
                      <li key={title}>
                        <button
                          type='button'
                          className={styles.row}
                          onClick={onClick}
                        >
                          <span className={styles.rowTitle}>{title}</span>
                          <span className={styles.rowText}>{text}</span>
                          <span className={styles.rowArrow} aria-hidden='true'>
                            →
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeTab === "content" &&
                (activeForm ? (
                  activeForm.kind === "research" ? (
                    <ResearchForm
                      research={activeForm.item}
                      onClose={() => setActiveForm(null)}
                    />
                  ) : activeForm.kind === "project" ? (
                    <ProjectForm
                      project={activeForm.item}
                      onClose={() => setActiveForm(null)}
                    />
                  ) : (
                    <ShowcaseForm
                      entry={activeForm.item}
                      onClose={() => setActiveForm(null)}
                    />
                  )
                ) : (
                  <div>
                    <div className={styles.sectionHead}>
                      <div>
                        <h2 className={styles.sectionTitle}>Your content.</h2>
                        <p className={styles.sectionSub}>
                          Research topics, projects and student work. Students
                          apply to the first two from your public pages.
                        </p>
                      </div>
                      <div className={styles.newBtns}>
                        {Object.entries(NEW_LABEL).map(([kind, label]) => (
                          <button
                            key={kind}
                            type='button'
                            className={styles.newBtn}
                            onClick={() => startAdd(kind)}
                          >
                            + {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div
                      className={styles.chips}
                      role='group'
                      aria-label='Filter content'
                    >
                      {[
                        ["all", "All", allContent.length],
                        ["research", "Research", research.length],
                        ["project", "Projects", projects.length],
                        ["showcase", "Student work", showcase.length],
                      ].map(([id, label, n]) => (
                        <button
                          key={id}
                          type='button'
                          aria-pressed={contentFilter === id}
                          className={`${styles.chip} ${contentFilter === id ? styles.chipOn : ""}`}
                          onClick={() => setContentFilter(id)}
                        >
                          {label} <span className={styles.chipCount}>{n}</span>
                        </button>
                      ))}
                    </div>

                    {visibleContent.length === 0 ? (
                      <div className={styles.empty}>
                        <p className={styles.emptyTitle}>
                          {contentFilter === "all"
                            ? "Nothing posted yet."
                            : `No ${NEW_LABEL[contentFilter].toLowerCase()} yet.`}
                        </p>
                        <p>
                          Once you post something, students can find it and
                          apply.
                        </p>
                        <div className={styles.emptyActions}>
                          {(contentFilter === "all"
                            ? ["research", "project", "showcase"]
                            : [contentFilter]
                          ).map((kind, i) => (
                            <button
                              key={kind}
                              type='button'
                              className={i === 0 ? "btn-primary" : "btn-ghost"}
                              onClick={() => startAdd(kind)}
                            >
                              + {NEW_LABEL[kind]}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className={styles.grid}>
                        {visibleContent.map((item) => (
                          <ContentCard
                            key={`${item.kind}-${item.id}`}
                            item={item}
                            kind={item.kind}
                            onEdit={() =>
                              setActiveForm({ kind: item.kind, item })
                            }
                            onDelete={() => deleteItem(item.kind, item.id)}
                            onToggleStage={
                              item.kind !== "showcase"
                                ? () => toggleStage(item.kind, item)
                                : undefined
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}

              {activeTab === "availability" && <Availability />}
              {activeTab === "bookings" && <BookingRequests />}
              {activeTab === "profile" && (
                <ProfileTab
                  teacher={teacher}
                  onSaved={(fields) =>
                    setTeacher((prev) => ({ ...prev, ...fields }))
                  }
                />
              )}
            </main>
          </div>
        </>
      )}

      <Footer />
    </div>
  );
}
