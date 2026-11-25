// src/components/ProgramListing.jsx
// Shared listing page for Research and Projects: big title, search + sort,
// a filter column and a grid of program cards. ResearchListing and
// ProjectListing only pass in what differs (endpoint, wording, card fields).
import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, live, toMillis } from "../api";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { SkeletonClassCard } from "./Skeleton";
import { formatMentorName } from "../utils/mentorName";
import { GRADE_RANGE_OPTIONS } from "../utils/gradeRange";
import { DELIVERABLE_OPTIONS } from "../utils/deliverables";
import { useScrollReveal } from "../utils/useScrollReveal";
import { TopicIcon } from "../utils/topicIcons";
import { LESSON_STRUCTURE_LABEL, seatsStatus } from "../utils/format";
import { toPrereqArray } from "../utils/prerequisites";
import { DIFFICULTY_OPTIONS } from "../utils/difficulty";
import { LOCATION_OPTIONS } from "../utils/schedule";
import styles from "./ProgramListing.module.css";

const STAGE_LABEL = { active: "Active", completed: "Completed" };
const STAGE_OPTIONS = ["active", "completed"];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "seats", label: "Most seats available" },
];

function seatsLeft(item) {
  return (item.seats || 0) - (item.enrolledCount || 0);
}

function FilterGroup({ title, options, selected, onToggle }) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.groupTitle}>{title}</legend>
      {options.map((o) => {
        const value = typeof o === "string" ? o : o.value;
        // Some shared option lists carry a leading emoji; this page doesn't use them.
        const label = (typeof o === "string" ? o : o.label).replace(
          /^\p{Extended_Pictographic}\uFE0F?\s*/u,
          "",
        );
        return (
          <label key={value} className={styles.check}>
            <input
              type='checkbox'
              checked={selected.includes(value)}
              onChange={() => onToggle(value)}
            />
            {label}
          </label>
        );
      })}
    </fieldset>
  );
}

/**
 * config: {
 *   endpoint, title, sub, noun (singular), nounPlural, detailPath,
 *   searchText(item), fields: [{ label, key, lines }], showSeats
 * }
 */
export default function ProgramListing({ config }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [teachers, setTeachers] = useState({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [grades, setGrades] = useState([]);
  const [difficulties, setDifficulties] = useState([]);
  const [locations, setLocations] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [seatsOnly, setSeatsOnly] = useState(false);
  const [stages, setStages] = useState([...STAGE_OPTIONS]);
  const [sortBy, setSortBy] = useState("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const pageRef = useScrollReveal([loading, items]);

  useEffect(() => {
    const unsub = live(
      () => api.get(config.endpoint),
      (rows) => {
        setItems(rows);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [config.endpoint]);

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

  // Mentor's live name from their profile; the name saved on the post is
  // only a fallback (older posts stored the literal string "Teacher").
  function mentorLabel(item) {
    const liveMentor = teachers[item.teacherId];
    if (liveMentor?.name) {
      return (
        <Link
          to={`/teacher/${item.teacherId}`}
          onClick={(e) => e.stopPropagation()}
          className={styles.mentorLink}
        >
          {formatMentorName(liveMentor.name, {
            mentorType: liveMentor.mentorType,
            degree: liveMentor.degree,
          })}
        </Link>
      );
    }
    return item.teacherName && item.teacherName !== "Teacher"
      ? item.teacherName
      : "Mentor";
  }

  const toggle = (list, setList) => (value) =>
    setList(
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    );

  function clearFilters() {
    setSearch("");
    setGrades([]);
    setDifficulties([]);
    setLocations([]);
    setDeliverables([]);
    setSeatsOnly(false);
    setStages([...STAGE_OPTIONS]);
    setSortBy("newest");
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = items.filter((it) => {
      if (q && !config.searchText(it).toLowerCase().includes(q)) return false;
      if (grades.length && !grades.includes(it.gradeLevel)) return false;
      if (difficulties.length && !difficulties.includes(it.difficulty))
        return false;
      if (locations.length && !locations.includes(it.scheduleLocation))
        return false;
      if (deliverables.length && !deliverables.includes(it.deliverable))
        return false;
      if (seatsOnly && seatsLeft(it) <= 0) return false;
      if (stages.length && !stages.includes(it.stage || "active")) return false;
      return true;
    });
    return [...list].sort((a, b) =>
      sortBy === "seats"
        ? seatsLeft(b) - seatsLeft(a)
        : toMillis(b.createdAt) - toMillis(a.createdAt),
    );
  }, [
    items,
    search,
    grades,
    difficulties,
    locations,
    deliverables,
    seatsOnly,
    stages,
    sortBy,
    config,
  ]);

  return (
    <div ref={pageRef} className={styles.page}>
      <Navbar />

      <header className={styles.head}>
        <div className={styles.wrap}>
          <p className='section-label'>Programs</p>
          <h1 className={styles.title}>{config.title}</h1>
          <div className={styles.headBottom}>
            <p className={styles.sub}>{config.sub}</p>
            <div className={styles.searchRow}>
              <label className={styles.srOnly} htmlFor='program-search'>
                Search {config.nounPlural}
              </label>
              <input
                id='program-search'
                type='search'
                className={styles.search}
                placeholder={`Search ${config.nounPlural}`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <label className={styles.srOnly} htmlFor='program-sort'>
                Sort
              </label>
              <select
                id='program-sort'
                className={styles.sort}
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

      <div className={`${styles.wrap} ${styles.body}`}>
        <button
          type='button'
          className={styles.filterToggle}
          onClick={() => setFiltersOpen(!filtersOpen)}
          aria-expanded={filtersOpen}
        >
          Filters <span aria-hidden='true'>{filtersOpen ? "−" : "+"}</span>
        </button>

        <aside
          className={`${styles.sidebar} ${filtersOpen ? styles.sidebarOpen : ""}`}
        >
          <div className={styles.sidebarHead}>
            <span>Filters</span>
            <button
              type='button'
              className={styles.clear}
              onClick={clearFilters}
            >
              Clear all
            </button>
          </div>
          <FilterGroup
            title='Grade level'
            options={GRADE_RANGE_OPTIONS}
            selected={grades}
            onToggle={toggle(grades, setGrades)}
          />
          <FilterGroup
            title='Experience level'
            options={DIFFICULTY_OPTIONS}
            selected={difficulties}
            onToggle={toggle(difficulties, setDifficulties)}
          />
          <FilterGroup
            title='Location'
            options={LOCATION_OPTIONS}
            selected={locations}
            onToggle={toggle(locations, setLocations)}
          />
          <FilterGroup
            title="You'll produce"
            options={DELIVERABLE_OPTIONS}
            selected={deliverables}
            onToggle={toggle(deliverables, setDeliverables)}
          />
          <fieldset className={styles.group}>
            <legend className={styles.groupTitle}>Availability</legend>
            <label className={styles.check}>
              <input
                type='checkbox'
                checked={seatsOnly}
                onChange={(e) => setSeatsOnly(e.target.checked)}
              />
              Seats available
            </label>
          </fieldset>
          <FilterGroup
            title='Status'
            options={STAGE_OPTIONS.map((s) => ({
              value: s,
              label: STAGE_LABEL[s],
            }))}
            selected={stages}
            onToggle={toggle(stages, setStages)}
          />
        </aside>

        <main className={styles.main}>
          {loading ? (
            <div className={styles.grid}>
              {[1, 2, 3].map((i) => (
                <SkeletonClassCard key={i} />
              ))}
            </div>
          ) : (
            <>
              <p className={styles.count} aria-live='polite'>
                {filtered.length} of {items.length}{" "}
                {items.length === 1 ? config.noun : config.nounPlural}
              </p>

              {items.length === 0 ? (
                <div className={styles.empty}>
                  <p className={styles.emptyTitle}>Nothing posted yet.</p>
                  <p>
                    New {config.nounPlural} appear here as soon as mentors
                    publish them.
                  </p>
                </div>
              ) : filtered.length === 0 ? (
                <div className={styles.empty}>
                  <p className={styles.emptyTitle}>No matches.</p>
                  <p>No {config.nounPlural} match your filters.</p>
                  <button
                    type='button'
                    className='btn-ghost'
                    onClick={clearFilters}
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className={styles.grid}>
                  {filtered.map((it, idx) => {
                    const stage = it.stage || "active";
                    const prereqs = toPrereqArray(it.prerequisites);
                    return (
                      <article
                        key={it.id}
                        className={`${styles.card} reveal`}
                        style={{
                          transitionDelay: `${Math.min(idx, 8) * 60}ms`,
                        }}
                        onClick={() =>
                          navigate(`${config.detailPath}/${it.id}`)
                        }
                      >
                        <div className={styles.cardTop}>
                          <TopicIcon seed={it.id} size={40} />
                          <span
                            className={`${styles.stage} ${stage === "completed" ? styles.stageDone : ""}`}
                          >
                            {STAGE_LABEL[stage] || STAGE_LABEL.active}
                          </span>
                        </div>

                        <h2 className={styles.cardTitle}>
                          <Link
                            to={`${config.detailPath}/${it.id}`}
                            className={styles.cardLink}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {it.title}
                          </Link>
                        </h2>

                        <div className={styles.tags}>
                          {it.gradeLevel && (
                            <span className={styles.tag}>{it.gradeLevel}</span>
                          )}
                          {it.difficulty && (
                            <span className={styles.tag}>{it.difficulty}</span>
                          )}
                          <span className={styles.tag}>
                            {LESSON_STRUCTURE_LABEL}
                          </span>
                        </div>

                        {config.fields.map((f) =>
                          it[f.key] ? (
                            <div key={f.key} className={styles.fieldBlock}>
                              <p className={styles.fieldLabel}>{f.label}</p>
                              <p
                                className={styles.fieldText}
                                style={{ WebkitLineClamp: f.lines }}
                              >
                                {it[f.key]}
                              </p>
                            </div>
                          ) : null,
                        )}

                        <dl className={styles.facts}>
                          {it.deliverable && (
                            <div>
                              <dt>You'll produce</dt>
                              <dd>{it.deliverable}</dd>
                            </div>
                          )}
                          {prereqs.length > 0 && (
                            <div>
                              <dt>Prerequisites</dt>
                              <dd>{prereqs.join(", ")}</dd>
                            </div>
                          )}
                          {config.showSeats && it.seats ? (
                            <div>
                              <dt>Seats</dt>
                              <dd>{seatsStatus(it.seats, it.enrolledCount)}</dd>
                            </div>
                          ) : null}
                        </dl>

                        <div className={styles.cardFoot}>
                          <span>Mentor: {mentorLabel(it)}</span>
                          <span className={styles.more} aria-hidden='true'>
                            Read more →
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
