// src/components/Tutors.jsx
import { useEffect, useMemo, useState } from "react";
import { api, live } from "../api";
import styles from "./Tutors.module.css";
import list from "./ProgramListing.module.css";
import { SkeletonCard } from "./Skeleton";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
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

// Public /tutors page: every live mentor, with search, filters and sort.
export default function Tutors() {
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

  const [filtersOpen, setFiltersOpen] = useState(false);
  const sectionRef = useScrollReveal([loading, teachers]);

  useEffect(() => {
    const unsub = live(
      () => api.get("/teachers"),
      (rows) => {
        const data = rows;
        const filtered = data.filter(
          (t) => !t.disabled && t.verificationStatus === "approved",
        );
        filtered.sort(featuredSort);
        setTeachers(filtered);
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  // Fetched to know which mentors currently have an open (unfilled) research
  // or project seat, for the Opening filter.
  useEffect(() => {
    const unsub = live(
      () => api.get("/research"),
      (rows) => {
        setResearch(rows);
      },
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = live(
      () => api.get("/projects"),
      (rows) => {
        setProjects(rows);
      },
    );
    return () => unsub();
  }, []);

  const researchAreaOptions = useMemo(
    () =>
      [...new Set(teachers.map((t) => t.researchArea).filter(Boolean))].sort(),
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
        const haystack =
          `${t.name || ""} ${t.expertise || ""} ${t.bio || ""} ${t.major || ""} ${t.researchArea || ""}`.toLowerCase();
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

  function initials(name = "") {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("");
  }

  function renderCard(t) {
    const openResearch = openResearchTeacherIds.has(t.id);
    const openProject = openProjectTeacherIds.has(t.id);
    const name = formatMentorName(t.name, {
      mentorType: t.mentorType,
      degree: t.degree,
    });
    return (
      <article
        key={t.id}
        className={`${styles.card} reveal`}
        onClick={() => navigate(`/teacher/${t.id}`)}
      >
        <div className={styles.portrait}>
          {/* Initials sit underneath; a photo that fails to load hides itself. */}
          <span className={styles.initials} aria-hidden='true'>
            {initials(t.name)}
          </span>
          {t.photoURL && (
            <img
              src={t.photoURL}
              alt=''
              className={styles.photo}
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
          {(openResearch || openProject) && (
            <span className={styles.open}>
              Open:{" "}
              {[openResearch && "Research", openProject && "Project"]
                .filter(Boolean)
                .join(" & ")}
            </span>
          )}
        </div>
        <div className={styles.body}>
          <h2 className={styles.name}>
            <Link
              to={`/teacher/${t.id}`}
              className={styles.nameLink}
              onClick={(e) => e.stopPropagation()}
            >
              {name}
            </Link>
          </h2>
          <p className={styles.meta}>
            {[t.degree, t.university].filter(Boolean).join(" · ")}
          </p>
          {(t.expertise || t.researchArea || t.major) && (
            <p className={styles.field}>
              {t.expertise || t.researchArea || t.major}
            </p>
          )}
          {t.bio && <p className={styles.bio}>{t.bio}</p>}
          <span className={styles.more} aria-hidden='true'>
            View profile →
          </span>
        </div>
      </article>
    );
  }

  return (
    <div ref={sectionRef} className={list.page}>
      <Navbar />

      <header className={list.head}>
        <div className={list.wrap}>
          <p className='section-label'>PhD mentors</p>
          <h1 className={list.title}>Mentors.</h1>
          <div className={list.headBottom}>
            <p className={list.sub}>
              Every mentor is a PhD student or above, verified and
              background-checked before they work with students.
            </p>
            <div className={list.searchRow}>
              <label className={list.srOnly} htmlFor='mentor-search'>
                Search mentors
              </label>
              <input
                id='mentor-search'
                type='search'
                className={list.search}
                placeholder='Search by name, field or topic'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <label className={list.srOnly} htmlFor='mentor-sort'>
                Sort
              </label>
              <select
                id='mentor-sort'
                className={list.sort}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    Sort: {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className={`${list.wrap} ${list.body}`}>
        <button
          type='button'
          className={list.filterToggle}
          onClick={() => setFiltersOpen(!filtersOpen)}
          aria-expanded={filtersOpen}
        >
          Filters <span aria-hidden='true'>{filtersOpen ? "−" : "+"}</span>
        </button>

        <aside
          className={`${list.sidebar} ${filtersOpen ? list.sidebarOpen : ""}`}
        >
          <div className={list.sidebarHead}>
            <span>Filters</span>
            <button type='button' className={list.clear} onClick={clearFilters}>
              Clear all
            </button>
          </div>
          <fieldset className={list.group}>
            <legend className={list.groupTitle}>Open seats in</legend>
            {OPENING_OPTIONS.map((o) => (
              <label key={o.value} className={list.check}>
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
          </fieldset>
          {researchAreaOptions.length > 0 && (
            <fieldset className={list.group}>
              <legend className={list.groupTitle}>Research area</legend>
              {researchAreaOptions.map((r) => (
                <label key={r} className={list.check}>
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
            </fieldset>
          )}
        </aside>

        <main className={list.main}>
          {loading ? (
            <div className={styles.grid}>
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : teachers.length === 0 ? (
            <div className={list.empty}>
              <p className={list.emptyTitle}>Our mentor team is growing.</p>
              <p>
                Tell us what you'd like to research and we'll match you with the
                right mentor.
              </p>
              <Link
                to='/tell-us-what-you-need'
                className='btn-primary'
                style={{ marginTop: 12 }}
              >
                Tell us what you need →
              </Link>
            </div>
          ) : (
            <>
              <p className={list.count} aria-live='polite'>
                {filteredTeachers.length} of {teachers.length} mentor
                {teachers.length === 1 ? "" : "s"}
              </p>
              {filteredTeachers.length === 0 ? (
                <div className={list.empty}>
                  <p className={list.emptyTitle}>No matches.</p>
                  <p>No mentors match your filters.</p>
                  <button
                    type='button'
                    className='btn-ghost'
                    onClick={clearFilters}
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
                    <div className={styles.moreRow}>
                      <button
                        type='button'
                        className='btn-ghost'
                        onClick={() => setVisibleCount((c) => c + 20)}
                      >
                        Show more ({filteredTeachers.length - visibleCount}{" "}
                        more)
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
