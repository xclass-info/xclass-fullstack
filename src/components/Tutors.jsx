// src/components/Tutors.jsx
import { useEffect, useMemo, useState } from "react";
import { api, live } from "../api";
import styles from "./Tutors.module.css";
import { SkeletonCard } from "./Skeleton";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import InitialsAvatar from "./InitialsAvatar";
import { formatMentorName } from "../utils/mentorName";
import { useScrollReveal } from "../utils/useScrollReveal";

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "name", label: "Name (A-Z)" },
];

const OPENING_OPTIONS = [
  { value: "research", label: "Research" },
  { value: "project", label: "Project" },
];

const checkboxRow = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 14,
  color: "var(--muted)",
  marginBottom: 8,
  cursor: "pointer",
};

const filterLabel = {
  fontSize: 13,
  fontWeight: 700,
  color: "#111111",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  margin: "20px 0 10px",
};

// Matches only the exact surname, not a substring anywhere in the full name
// (a plain .includes("wu")/.includes("pan") would also match names like
// "Pandey" or "Shuwen").
function lastName(name) {
  return name?.trim().split(/\s+/).pop()?.toLowerCase();
}

function featuredSort(a, b) {
  if (lastName(a.name) === "wu") return -1;
  if (lastName(b.name) === "wu") return 1;
  if (lastName(a.name) === "pan") return 1;
  if (lastName(b.name) === "pan") return -1;
  return 0;
}

export default function Tutors({ standalone = false }) {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [research, setResearch] = useState([]);
  const [projects, setProjects] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedResearchAreas, setSelectedResearchAreas] = useState([]);
  const [selectedOpenings, setSelectedOpenings] = useState([]);
  const [sortBy, setSortBy] = useState("featured");
  const [visibleCount, setVisibleCount] = useState(20);

  // this component is used both embedded on the homepage (which sets up its
  // own page-wide observer) and standalone at /tutors (which has no such
  // observer), so it can't rely on a parent to make its cards visible.
  const sectionRef = useScrollReveal([loading, teachers]);

  useEffect(() => {
    const unsub = live(() => api.get("/teachers"), (rows) => {
      const data = rows;
      const filtered = data.filter(
        (t) => !t.disabled && t.verificationStatus === "approved",
      );
      filtered.sort(featuredSort);
      setTeachers(filtered);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Fetched to know which mentors currently have an open (unfilled) research
  // or project seat, for the Opening filter.
  useEffect(() => {
    const unsub = live(() => api.get("/research"), (rows) => {
      setResearch(rows);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = live(() => api.get("/projects"), (rows) => {
      setProjects(rows);
    });
    return () => unsub();
  }, []);

  const researchAreaOptions = useMemo(
    () => [...new Set(teachers.map((t) => t.researchArea).filter(Boolean))].sort(),
    [teachers],
  );

  const openResearchTeacherIds = useMemo(() => {
    const set = new Set();
    research.forEach((r) => {
      const left = (r.seats || 0) - (r.enrolledCount || 0);
      if (r.status === "published" && left > 0) set.add(r.teacherId);
    });
    return set;
  }, [research]);

  const openProjectTeacherIds = useMemo(() => {
    const set = new Set();
    projects.forEach((p) => {
      const left = (p.seats || 0) - (p.enrolledCount || 0);
      if (left > 0) set.add(p.teacherId);
    });
    return set;
  }, [projects]);

  function toggleValue(list, setList, value) {
    setList(
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    );
  }

  function clearFilters() {
    setSearch("");
    setSelectedResearchAreas([]);
    setSelectedOpenings([]);
    setSortBy("featured");
  }

  const filteredTeachers = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = teachers.filter((t) => {
      if (q) {
        const haystack = `${t.name || ""} ${t.expertise || ""} ${t.bio || ""} ${t.major || ""} ${t.researchArea || ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (
        selectedResearchAreas.length > 0 &&
        !selectedResearchAreas.includes(t.researchArea)
      ) {
        return false;
      }
      if (selectedOpenings.length > 0) {
        const hasOpenResearch = openResearchTeacherIds.has(t.id);
        const hasOpenProject = openProjectTeacherIds.has(t.id);
        const matches = selectedOpenings.some(
          (o) =>
            (o === "research" && hasOpenResearch) ||
            (o === "project" && hasOpenProject),
        );
        if (!matches) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "name") {
        return (a.name || "").localeCompare(b.name || "");
      }
      return featuredSort(a, b);
    });

    return list;
  }, [
    teachers,
    search,
    selectedResearchAreas,
    selectedOpenings,
    openResearchTeacherIds,
    openProjectTeacherIds,
    sortBy,
  ]);

  // Reset pagination back to the first page whenever the filtered set changes,
  // so "Show more" doesn't leave a stale page depth after a new search/filter.
  useEffect(() => {
    setVisibleCount(20);
  }, [search, selectedResearchAreas, selectedOpenings, sortBy]);

  const visibleTeachers = filteredTeachers.slice(0, visibleCount);

  function renderCard(teacher) {
    return (
      <div
        key={teacher.id}
        className={`${styles.card} reveal`}
        onClick={() => navigate(`/teacher/${teacher.id}`)}
        style={{ cursor: "pointer" }}
      >
        {/* Avatar */}
        <div className={styles.avatarWrapper}>
          {teacher.photoURL ? (
            <img
              src={teacher.photoURL}
              alt={teacher.name}
              className={styles.avatar}
            />
          ) : (
            <InitialsAvatar
              name={teacher.name}
              seed={teacher.id}
              className={styles.avatar}
              fontSize='2.5rem'
            />
          )}
        </div>

        <h1 style={{ margin: "0 0 8px", fontSize: 26 }}>
          {formatMentorName(teacher.name, {
            mentorType: teacher.mentorType,
            degree: teacher.degree,
          })}
        </h1>

        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            justifyContent: "center",
            marginBottom: 8,
          }}
        >
          {teacher.gender && (
            <span
              style={{
                fontSize: 11,
                background: "var(--surface)",
                color: "var(--muted)",
                padding: "2px 10px",
                borderRadius: 20,
                fontWeight: 600,
              }}
            >
              {teacher.gender === "Male" ? "👨" : "👩"} {teacher.gender}
            </span>
          )}
          {teacher.degree && (
            <span
              style={{
                fontSize: 11,
                background: "var(--primary-soft)",
                color: "var(--primary-hover)",
                padding: "2px 10px",
                borderRadius: 20,
                fontWeight: 600,
              }}
            >
              🎓 {teacher.degree}
            </span>
          )}
        </div>
        {teacher.major && (
          <span
            style={{
              fontSize: 11,
              background: "rgba(154,119,43,0.1)",
              color: "var(--accent)",
              padding: "2px 10px",
              borderRadius: 20,
              fontWeight: 600,
            }}
          >
            🔬 {teacher.major}
          </span>
        )}

        {teacher.expertise && (
          <p
            style={{
              fontSize: 13,
              color: "var(--muted)",
              marginBottom: 6,
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            💡 {teacher.expertise}
          </p>
        )}

        {teacher.bio && <p className={styles.bio}>{teacher.bio}</p>}

        {teacher.projects && teacher.projects.length > 0 && (
          <p
            style={{
              fontSize: 12,
              color: "var(--muted)",
              marginBottom: 6,
              textAlign: "center",
            }}
          >
            💡 {teacher.projects.length} project idea
            {teacher.projects.length > 1 ? "s" : ""} available
          </p>
        )}

        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
          Click to view full profile →
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <>
        {standalone && <Navbar />}
        <section id='tutors' ref={sectionRef} className={styles.section}>
          <div className={styles.inner}>
            <div className={`${styles.header} reveal`}>
              <h2 className={styles.title}>Meet Our Research Mentors</h2>
              <p className={styles.sub}>
                Expert mentors ready to help you learn anything.
              </p>
            </div>
            <div className={styles.grid}>
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </section>
        {standalone && <Footer />}
      </>
    );
  }

  // On the homepage, an empty mentor section reads as "we have no mentors" -
  // leave it out until there's someone to show.
  if (!standalone && !loading && teachers.length === 0) return null;

  if (!standalone) {
    return (
      <section id='tutors' ref={sectionRef} className={styles.section}>
        <div className={styles.inner}>
          <div className={`${styles.header} reveal`}>
            <h2 className={styles.title}>Meet Our Research Mentors</h2>
            <p className={styles.sub}>
              Join world-class researchers and explore cutting-edge research
              topics that match your passion, curiosity, and future ambitions.
            </p>
          </div>
          <div className={styles.grid}>
            {visibleTeachers.map(renderCard)}
          </div>
          {visibleCount < filteredTeachers.length && (
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <button
                onClick={() => setVisibleCount((c) => c + 20)}
                style={{
                  padding: "12px 32px",
                  borderRadius: 10,
                  border: "2px solid #111111",
                  background: "white",
                  color: "#111111",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Show more (
                {filteredTeachers.length - visibleCount} more)
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <>
      <Navbar />
      <section id='tutors' ref={sectionRef} className={styles.section}>
        <div
          style={{
            maxWidth: 1300,
            margin: "0 auto",
            display: "flex",
            gap: 32,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          {/* Filters sidebar */}
          <aside
            style={{
              width: 240,
              flexShrink: 0,
              background: "white",
              borderRadius: 16,
              padding: 20,
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 16 }}>Filters</h3>
              <button
                onClick={clearFilters}
                style={{
                  background: "none",
                  border: "none",
                  color: "#111111",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Clear all
              </button>
            </div>

            {researchAreaOptions.length > 0 && (
              <>
                <p style={filterLabel}>Research Area</p>
                <div
                  style={{
                    maxHeight: 180,
                    overflowY: "auto",
                    paddingRight: 4,
                  }}
                >
                  {researchAreaOptions.map((r) => (
                    <label key={r} style={checkboxRow}>
                      <input
                        type='checkbox'
                        checked={selectedResearchAreas.includes(r)}
                        onChange={() =>
                          toggleValue(
                            selectedResearchAreas,
                            setSelectedResearchAreas,
                            r,
                          )
                        }
                      />
                      {r}
                    </label>
                  ))}
                </div>
              </>
            )}

            <p style={filterLabel}>Opening</p>
            {OPENING_OPTIONS.map((o) => (
              <label key={o.value} style={checkboxRow}>
                <input
                  type='checkbox'
                  checked={selectedOpenings.includes(o.value)}
                  onChange={() =>
                    toggleValue(selectedOpenings, setSelectedOpenings, o.value)
                  }
                />
                {o.label}
              </label>
            ))}
          </aside>

          {/* Main content */}
          <div style={{ flex: "1 1 600px", minWidth: 0 }}>
            <div className={`${styles.header} reveal`} style={{ marginBottom: 24 }}>
              <h2 className={styles.title}>Meet Our Research Mentors</h2>
              <p className={styles.sub}>
                Join world-class researchers and explore cutting-edge research
                topics that match your passion, curiosity, and future
                ambitions.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 16,
              }}
            >
              <input
                type='text'
                placeholder='Search mentors...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  flex: "1 1 260px",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  fontSize: 14,
                  background: "white",
                }}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    Sort: {o.label}
                  </option>
                ))}
              </select>
            </div>

            {teachers.length > 0 && (
              <p style={{ color: "var(--muted)", fontSize: 13, margin: "0 0 20px" }}>
                {filteredTeachers.length} of {teachers.length} mentor
                {teachers.length === 1 ? "" : "s"} match your filters
              </p>
            )}

            {teachers.length === 0 ? (
              <div className={styles.empty}>
                <p>
                  Our mentor team is growing. Tell us what you'd like to
                  research and we'll match you with the right mentor.
                </p>
                <button
                  onClick={() => navigate("/tell-us-what-you-need")}
                  style={{
                    marginTop: 12,
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "none",
                    background: "var(--primary)",
                    color: "white",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Tell us what you need →
                </button>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className={styles.empty}>
                <p>No mentors match your filters.</p>
                <button
                  onClick={clearFilters}
                  style={{
                    marginTop: 12,
                    padding: "8px 20px",
                    borderRadius: 8,
                    border: "none",
                    background: "#111111",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className={styles.grid}>
                  {visibleTeachers.map(renderCard)}
                </div>
                {visibleCount < filteredTeachers.length && (
                  <div style={{ textAlign: "center", marginTop: 32 }}>
                    <button
                      onClick={() => setVisibleCount((c) => c + 20)}
                      style={{
                        padding: "12px 32px",
                        borderRadius: 10,
                        border: "2px solid #111111",
                        background: "white",
                        color: "#111111",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Show more (
                      {filteredTeachers.length - visibleCount} more)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
