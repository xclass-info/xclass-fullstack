// src/components/ProjectListing.jsx
import { useEffect, useMemo, useState } from "react";
import { api, live, toMillis } from "../api";
import Navbar from "./Navbar";
import { SkeletonClassCard } from "./Skeleton";
import { useNavigate, Link } from "react-router-dom";
import Footer from "./Footer";
import { formatMentorName } from "../utils/mentorName";
import { seatsStatus, LESSON_STRUCTURE_LABEL } from "../utils/format";
import { GRADE_RANGE_OPTIONS } from "../utils/gradeRange";
import { DELIVERABLE_OPTIONS } from "../utils/deliverables";
import { useScrollReveal } from "../utils/useScrollReveal";
import { TopicIcon } from "../utils/topicIcons";
import { toPrereqArray } from "../utils/prerequisites";
import { DIFFICULTY_OPTIONS } from "../utils/difficulty";
import { LOCATION_OPTIONS } from "../utils/schedule";
import styles from "./ProjectListing.module.css";

const labelStyle = {
  fontSize: 12,
  color: "var(--muted)",
  margin: "0 0 4px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const clampStyle = (lines) => ({
  fontSize: 13,
  color: "var(--muted)",
  margin: 0,
  lineHeight: 1.5,
  display: "-webkit-box",
  WebkitLineClamp: lines,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
});

const STAGE_BADGE = {
  active: { label: "Active", color: "var(--mint)", bg: "rgba(31,111,74,0.08)" },
  completed: { label: "Completed", color: "var(--muted)", bg: "var(--surface)" },
};
const STAGE_OPTIONS = ["active", "completed"];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "seats", label: "Most Seats Available" },
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
  color: "#2f6175",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  margin: "20px 0 10px",
};

export default function ProjectListing() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [teachers, setTeachers] = useState({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedDeliverables, setSelectedDeliverables] = useState([]);
  const [seatsOnly, setSeatsOnly] = useState(false);
  const [selectedStages, setSelectedStages] = useState([...STAGE_OPTIONS]);
  const [sortBy, setSortBy] = useState("newest");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const pageRef = useScrollReveal([loading, projects]);

  useEffect(() => {
    const unsub = live(() => api.get("/projects"), (rows) => {
      setProjects(rows);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    api
      .get("/teachers")
      .then((rows) => {
        const map = {};
        rows.forEach((t) => {
          map[t.id] = t;
        });
        setTeachers(map);
      })
      .catch((err) => console.error(err));
  }, []);

  function mentorName(p) {
    const liveMentor = teachers[p.teacherId];
    if (liveMentor?.name) {
      return formatMentorName(liveMentor.name, {
        mentorType: liveMentor.mentorType,
        degree: liveMentor.degree,
      });
    }
    return p.teacherName && p.teacherName !== "Teacher"
      ? p.teacherName
      : "Mentor";
  }

  function mentorLabel(p) {
    const name = mentorName(p);
    if (!teachers[p.teacherId]) return name;
    return (
      <Link
        to={`/teacher/${p.teacherId}`}
        onClick={(e) => e.stopPropagation()}
        style={{ color: "#2f6175", textDecoration: "underline" }}
      >
        {name}
      </Link>
    );
  }

  function toggleValue(list, setList, value) {
    setList(
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    );
  }

  function clearFilters() {
    setSearch("");
    setSelectedGrades([]);
    setSelectedDifficulties([]);
    setSelectedLocations([]);
    setSelectedDeliverables([]);
    setSeatsOnly(false);
    setSelectedStages([...STAGE_OPTIONS]);
    setSortBy("newest");
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = projects.filter((p) => {
      if (q) {
        const haystack = `${p.title} ${p.description || ""} ${p.learning || ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (selectedGrades.length > 0 && !selectedGrades.includes(p.gradeLevel)) {
        return false;
      }
      if (
        selectedDifficulties.length > 0 &&
        !selectedDifficulties.includes(p.difficulty)
      ) {
        return false;
      }
      if (
        selectedLocations.length > 0 &&
        !selectedLocations.includes(p.scheduleLocation)
      ) {
        return false;
      }
      if (
        selectedDeliverables.length > 0 &&
        !selectedDeliverables.includes(p.deliverable)
      ) {
        return false;
      }
      if (seatsOnly) {
        const left = (p.seats || 0) - (p.enrolledCount || 0);
        if (left <= 0) return false;
      }
      const stage = p.stage || "active";
      if (selectedStages.length > 0 && !selectedStages.includes(stage)) {
        return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "seats") {
        const leftA = (a.seats || 0) - (a.enrolledCount || 0);
        const leftB = (b.seats || 0) - (b.enrolledCount || 0);
        return leftB - leftA;
      }
      return toMillis(b.createdAt) - toMillis(a.createdAt);
    });

    return list;
  }, [
    projects,
    search,
    selectedGrades,
    selectedDifficulties,
    selectedLocations,
    selectedDeliverables,
    seatsOnly,
    selectedStages,
    sortBy,
  ]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <Navbar />
        <div
          style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 24px 48px" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 24,
            }}
          >
            {[1, 2, 3].map((i) => (
              <SkeletonClassCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={pageRef} style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div
        style={{
          maxWidth: 1300,
          margin: "0 auto",
          padding: "100px 24px 48px",
          display: "flex",
          gap: 32,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <button
          className={styles.filterToggle}
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          style={{
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            background: "white",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "12px 16px",
            fontSize: 14,
            fontWeight: 700,
            color: "var(--text)",
            cursor: "pointer",
          }}
        >
          🔍 Filters {mobileFiltersOpen ? "▴" : "▾"}
        </button>

        {/* Filters sidebar */}
        <aside
          className={`${styles.sidebar} ${mobileFiltersOpen ? styles.sidebarOpen : ""}`}
          style={{
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
                color: "#2f6175",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Clear all
            </button>
          </div>

          <p style={filterLabel}>Grade Level</p>
          {GRADE_RANGE_OPTIONS.map((g) => (
            <label key={g} style={checkboxRow}>
              <input
                type='checkbox'
                checked={selectedGrades.includes(g)}
                onChange={() => toggleValue(selectedGrades, setSelectedGrades, g)}
              />
              {g}
            </label>
          ))}

          <p style={filterLabel}>Experience Level</p>
          {DIFFICULTY_OPTIONS.map((d) => (
            <label key={d} style={checkboxRow}>
              <input
                type='checkbox'
                checked={selectedDifficulties.includes(d)}
                onChange={() =>
                  toggleValue(selectedDifficulties, setSelectedDifficulties, d)
                }
              />
              {d}
            </label>
          ))}

          <p style={filterLabel}>Location</p>
          {LOCATION_OPTIONS.map((o) => (
            <label key={o.value} style={checkboxRow}>
              <input
                type='checkbox'
                checked={selectedLocations.includes(o.value)}
                onChange={() =>
                  toggleValue(selectedLocations, setSelectedLocations, o.value)
                }
              />
              {o.label}
            </label>
          ))}

          <p style={filterLabel}>You'll Produce</p>
          {DELIVERABLE_OPTIONS.map((d) => (
            <label key={d} style={checkboxRow}>
              <input
                type='checkbox'
                checked={selectedDeliverables.includes(d)}
                onChange={() =>
                  toggleValue(selectedDeliverables, setSelectedDeliverables, d)
                }
              />
              {d}
            </label>
          ))}

          <p style={filterLabel}>Availability</p>
          <label style={checkboxRow}>
            <input
              type='checkbox'
              checked={seatsOnly}
              onChange={(e) => setSeatsOnly(e.target.checked)}
            />
            Seats available
          </label>

          <p style={filterLabel}>Status</p>
          {STAGE_OPTIONS.map((s) => (
            <label key={s} style={checkboxRow}>
              <input
                type='checkbox'
                checked={selectedStages.includes(s)}
                onChange={() => toggleValue(selectedStages, setSelectedStages, s)}
              />
              {STAGE_BADGE[s].label}
            </label>
          ))}
        </aside>

        {/* Main content */}
        <div style={{ flex: "1 1 600px", minWidth: 0 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <h1 className="page-title">Projects</h1>
            <p className="page-sub">
              Explore hands-on projects you can work on with our mentors.
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
              placeholder='Search projects...'
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

          <p style={{ color: "var(--muted)", fontSize: 13, margin: "0 0 20px" }}>
            {filtered.length} of {projects.length} project
            {projects.length === 1 ? "" : "s"} match your filters
          </p>

          {projects.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--muted)", padding: 40 }}>
              <p>😴 No projects posted yet. Check back soon!</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--muted)", padding: 40 }}>
              <p>No projects match your filters.</p>
              <button
                onClick={clearFilters}
                style={{
                  marginTop: 12,
                  padding: "8px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: "#2f6175",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 24,
              }}
            >
              {filtered.map((p, idx) => {
                const stage = STAGE_BADGE[p.stage] || STAGE_BADGE.active;
                return (
                  <div
                    key={p.id}
                    className='reveal'
                    onClick={() => navigate(`/projects/${p.id}`)}
                    style={{
                      background: "white",
                      borderRadius: 16,
                      padding: 24,
                      boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                      cursor: "pointer",
                      transition:
                        "transform 0.2s, box-shadow 0.2s, opacity 0.6s ease, transform 0.6s ease",
                      transitionDelay: `${Math.min(idx, 8) * 60}ms`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow =
                        "0 8px 24px rgba(0,0,0,0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow =
                        "0 2px 12px rgba(0,0,0,0.07)";
                    }}
                  >
                    <div style={{ marginBottom: 14 }}>
                      <TopicIcon seed={p.id} />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 8,
                        marginBottom: 12,
                      }}
                    >
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0 }}>
                        {p.title}
                      </h3>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: stage.color,
                          background: stage.bg,
                          padding: "3px 10px",
                          borderRadius: 20,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {stage.label}
                      </span>
                    </div>

                    {(p.gradeLevel || p.difficulty) && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                        {p.gradeLevel && (
                          <span
                            style={{
                              display: "inline-block",
                              fontSize: 11,
                              fontWeight: 700,
                              color: "var(--primary-hover)",
                              background: "var(--surface)",
                              border: "1px solid var(--accent)",
                              padding: "2px 10px",
                              borderRadius: 20,
                            }}
                          >
                            🎓 {p.gradeLevel}
                          </span>
                        )}
                        {p.difficulty && (
                          <span
                            style={{
                              display: "inline-block",
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#8a6a25",
                              background: "rgba(154, 119, 43, 0.1)",
                              padding: "2px 10px",
                              borderRadius: 20,
                            }}
                          >
                            {p.difficulty}
                          </span>
                        )}
                      </div>
                    )}

                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--muted)",
                        fontWeight: 600,
                        margin: "0 0 12px",
                      }}
                    >
                      🕐 {LESSON_STRUCTURE_LABEL}
                    </p>

                    <div style={{ marginBottom: 12 }}>
                      <p style={labelStyle}>Description</p>
                      <p style={clampStyle(3)}>{p.description}</p>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <p style={labelStyle}>What You'll Learn</p>
                      <p style={clampStyle(2)}>{p.learning}</p>
                    </div>

                    {p.deliverable && (
                      <p
                        style={{
                          fontSize: 12,
                          color: "var(--mint)",
                          fontWeight: 600,
                          margin: "0 0 8px",
                        }}
                      >
                        📦 You'll produce: {p.deliverable}
                      </p>
                    )}

                    {toPrereqArray(p.prerequisites).length > 0 && (
                      <p
                        style={{
                          fontSize: 12,
                          color: "var(--muted)",
                          margin: "0 0 8px",
                        }}
                      >
                        ✅ Prerequisites: {toPrereqArray(p.prerequisites).join(", ")}
                      </p>
                    )}

                    {p.seats ? (
                      <p
                        style={{
                          fontSize: 12,
                          color: "var(--muted)",
                          fontWeight: 600,
                          margin: "0 0 12px",
                        }}
                      >
                        👥 {seatsStatus(p.seats, p.enrolledCount)}
                      </p>
                    ) : null}

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>
                        👩‍🏫 Mentored by: {mentorLabel(p)}
                      </span>
                      <span
                        style={{ fontSize: 12, color: "#2f6175", fontWeight: 600 }}
                      >
                        Read more →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
