import { useEffect, useState } from "react";
import { api, live, seg, toMillis } from "../api";
import { onAuthStateChanged, logout } from "../auth";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./TeacherDashboard.module.css";

import Availability from "./Availability";
import BookingRequests from "./BookingRequests";
import { SkeletonDashboardCard } from "./Skeleton";
import ResearchForm from "./ResearchForm";
import ProjectForm from "./ProjectForm";
import ShowcaseForm from "./ShowcaseForm";
import ContentCard from "./ContentCard";
import { statusInfo } from "../utils/mentorVerification";

import Footer from "./Footer";
import { safeUrl } from "../utils/format";

const PATH_BY_KIND = {
  research: "research",
  project: "projects",
  showcase: "showcase",
};

const NAV_ITEMS = [
  { id: "overview", label: "🏠 Overview" },
  { id: "content", label: "📚 Content", group: "My Content" },
  { id: "availability", label: "🗓 Availability", group: "Scheduling" },
  { id: "bookings", label: "📬 Bookings", group: "Scheduling" },
  { id: "profile", label: "👤 Profile", group: "Account" },
];

function profileFromTeacherData(data) {
  return {
    gender: data.gender || "",
    degree: data.degree || "",
    expertise: data.expertise || "",
    researchArea: data.researchArea || "",
    bio: data.bio || "",
    university: data.university || "",
    yearsOfExperience: data.yearsOfExperience || "",
    languages: data.languages || "",
    website: data.website || "",
  };
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [teacher, setTeacher] = useState(null);
  const [research, setResearch] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showcase, setShowcase] = useState([]);
  const [activeForm, setActiveForm] = useState(null); // { kind, item } | null
  const [contentFilter, setContentFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(location.state?.tab || "overview");

  // Profile form state
  const [profile, setProfile] = useState({
    gender: "",
    degree: "",
    expertise: "",
    researchArea: "",
    bio: "",
    university: "",
    yearsOfExperience: "",
    languages: "",
    website: "",
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    let profileLoaded = false;
    let unsubscribeTeacher = () => {};
    let unsubscribeContent = () => {};
    const unsubscribeAuth = onAuthStateChanged((user) => {
      unsubscribeTeacher();
      unsubscribeContent();
      if (!user) {
        navigate("/teacher/login");
        return;
      }

      // Kept fresh, not a one-time fetch: verification status can change
      // while this tab is open (admin approves it, or the work-email link
      // gets clicked in another tab) and the dashboard should reflect that
      // without a refresh. The profile FORM fields only sync in once, on
      // first load, so a refresh never clobbers an in-progress edit.
      unsubscribeTeacher = live(
        () => api.get("/teachers/me"),
        (data) => {
          // Until a mentor is approved, their application page is their home:
          // posting content and setting availability open up once they're live.
          if (data.verificationStatus !== "approved") {
            navigate("/mentor/application", { replace: true });
            return;
          }
          setTeacher(data);
          if (!profileLoaded) {
            profileLoaded = true;
            setProfile(profileFromTeacherData(data));
            setWordCount(
              (data.bio || "").trim().split(/\s+/).filter(Boolean).length,
            );
          }
        },
      );

      const mine = `teacherId=${seg(user.uid)}`;
      unsubscribeContent = live(
        () =>
          Promise.all([
            api.get(`/research?${mine}`),
            api.get(`/projects?${mine}`),
            api.get(`/showcase?${mine}`),
          ]),
        ([r, p, s]) => {
          setResearch(r);
          setProjects(p);
          setShowcase(s);
          setLoading(false);
        },
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeTeacher();
      unsubscribeContent();
    };
  }, []);

  function cancelProfileEdit() {
    if (teacher) {
      setProfile(profileFromTeacherData(teacher));
      setWordCount(
        (teacher.bio || "").trim().split(/\s+/).filter(Boolean).length,
      );
    }
    setIsEditingProfile(false);
  }

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
    setContentFilter(kind);
    setActiveForm({ kind, item: null });
  }

  function handleProfileChange(e) {
    const { name, value } = e.target;
    if (name === "bio") {
      const words = value.trim().split(/\s+/).filter(Boolean).length;
      if (words > 300) return; // block over 300 words
      setWordCount(words);
    }
    setProfile((prev) => ({ ...prev, [name]: value }));
  }

  async function saveProfile() {
    if (!profile.degree) return alert("Please select your degree.");
    if (!profile.university.trim())
      return alert("Please enter your university.");
    if (!profile.expertise.trim())
      return alert("Please enter your area of expertise.");
    if (!profile.languages.trim())
      return alert("Please enter languages spoken.");

    setProfileSaving(true);
    try {
      await api.patch("/teachers/me", profile);
      setTeacher((prev) => ({ ...prev, ...profile }));
      setProfileSaved(true);
      setTimeout(() => {
        setProfileSaved(false);
        setIsEditingProfile(false);
      }, 1200);
    } catch (err) {
      console.error(err);
      alert("Failed to save profile. Please try again.");
    } finally {
      setProfileSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.logo}>🔬 happy<span style={{ color: "#9a772b" }}>Research</span></h1>
          </div>
        </div>
        <div className={styles.grid}>
          {[1, 2, 3].map((i) => (
            <SkeletonDashboardCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    fontSize: 14,
    boxSizing: "border-box",
    marginTop: 4,
    fontFamily: "inherit",
  };

  const labelStyle = {
    fontSize: 13,
    color: "#64748b",
    fontWeight: 600,
  };

  const fieldStyle = {
    marginBottom: 16,
  };

  const allContent = [
    ...research.map((r) => ({ ...r, kind: "research" })),
    ...projects.map((p) => ({ ...p, kind: "project" })),
    ...showcase.map((s) => ({ ...s, kind: "showcase" })),
  ].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

  const visibleContent =
    contentFilter === "all"
      ? allContent
      : allContent.filter((i) => i.kind === contentFilter);

  const vStatus = statusInfo(teacher?.verificationStatus);

  function navCls(id) {
    return `${styles.navItem} ${activeTab === id ? styles.navItemActive : ""}`.trim();
  }

  let navGroup = null;

  return (
    <>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.logo}>💻 happy<span style={{ color: "#9a772b" }}>Research</span></h1>
            <p className={styles.welcome}>
              Welcome back, <strong>{teacher?.name}</strong> 👋
            </p>
          </div>
          <div className={styles.headerRight}>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
        <div className={styles.layout}>
          {/* Sidebar nav */}
          <nav className={styles.sidebar}>
            {NAV_ITEMS.map((item) => {
              const showGroupLabel = item.group && item.group !== navGroup;
              if (showGroupLabel) navGroup = item.group;
              return (
                <div key={item.id}>
                  {showGroupLabel && (
                    <p className={styles.navGroupLabel}>{item.group}</p>
                  )}
                  <button
                    className={navCls(item.id)}
                    onClick={() => setActiveTab(item.id)}
                  >
                    {item.label}
                  </button>
                </div>
              );
            })}
          </nav>

          {/* Main content */}
          <main className={styles.main}>
            {/* ── Overview Tab ── */}
            {activeTab === "overview" && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  Welcome back, {teacher?.name}
                </h2>
                <div className={styles.stats}>
                  <div className={styles.statCard}>
                    <p className={styles.statNum}>{research.length}</p>
                    <p className={styles.statLabel}>Research Posts</p>
                  </div>
                  <div className={styles.statCard}>
                    <p className={styles.statNum}>{projects.length}</p>
                    <p className={styles.statLabel}>Projects</p>
                  </div>
                  <div className={styles.statCard}>
                    <p className={styles.statNum}>{showcase.length}</p>
                    <p className={styles.statLabel}>Student Work</p>
                  </div>
                </div>

                <div
                  style={{
                    background: vStatus.bg,
                    border: `1px solid ${vStatus.color}33`,
                    borderRadius: 12,
                    padding: "18px 22px",
                    marginBottom: 24,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 700, color: vStatus.color }}>
                    ✅ You're verified and live
                  </p>
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button
                    className={styles.createBtn}
                    onClick={() => {
                      setActiveTab("content");
                      startAdd("research");
                    }}
                  >
                    + Add Research
                  </button>
                  <button
                    className={styles.createBtn}
                    onClick={() => {
                      setActiveTab("content");
                      startAdd("project");
                    }}
                  >
                    + Add Project
                  </button>
                  <button
                    className={styles.createBtn}
                    onClick={() => {
                      setActiveTab("content");
                      startAdd("showcase");
                    }}
                  >
                    + Add Student Work
                  </button>
                  <button
                    className={styles.logoutBtn}
                    onClick={() => setActiveTab("availability")}
                  >
                    🗓 Set Availability
                  </button>
                </div>
              </div>
            )}

            {/* ── Content Tab (Research + Projects + Student Work) ── */}
            {activeTab === "content" && (
              <div className={styles.section}>
                {activeForm ? (
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
                  <>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 16,
                        flexWrap: "wrap",
                        gap: 12,
                      }}
                    >
                      <div>
                        <h2 className={styles.sectionTitle} style={{ marginBottom: 4 }}>
                          Your Content
                        </h2>
                        <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
                          Research, projects, and student work, all in one place.
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          className={styles.createBtn}
                          onClick={() => startAdd("research")}
                        >
                          + Research
                        </button>
                        <button
                          className={styles.createBtn}
                          onClick={() => startAdd("project")}
                        >
                          + Project
                        </button>
                        <button
                          className={styles.createBtn}
                          onClick={() => startAdd("showcase")}
                        >
                          + Student Work
                        </button>
                      </div>
                    </div>

                    <div className={styles.chipRow}>
                      {[
                        { id: "all", label: `All (${allContent.length})` },
                        { id: "research", label: `🔬 Research (${research.length})` },
                        { id: "project", label: `💡 Projects (${projects.length})` },
                        { id: "showcase", label: `🏆 Student Work (${showcase.length})` },
                      ].map((c) => (
                        <button
                          key={c.id}
                          className={`${styles.chip} ${contentFilter === c.id ? styles.chipActive : ""}`}
                          onClick={() => setContentFilter(c.id)}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>

                    {visibleContent.length === 0 ? (
                      <div className={styles.empty}>
                        <p>
                          {contentFilter === "showcase"
                            ? "🏆 Nothing published yet!"
                            : contentFilter === "project"
                              ? "💡 No projects posted yet!"
                              : contentFilter === "research"
                                ? "🔬 No research posted yet!"
                                : "✨ Nothing posted yet!"}
                        </p>
                        {contentFilter === "all" ? (
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                            <button className={styles.createBtn} onClick={() => startAdd("research")}>
                              + Add Research
                            </button>
                            <button className={styles.createBtn} onClick={() => startAdd("project")}>
                              + Add Project
                            </button>
                            <button className={styles.createBtn} onClick={() => startAdd("showcase")}>
                              + Add Student Work
                            </button>
                          </div>
                        ) : (
                          <button
                            className={styles.createBtn}
                            onClick={() => startAdd(contentFilter)}
                          >
                            + Add your first{" "}
                            {contentFilter === "research"
                              ? "research post"
                              : contentFilter === "project"
                                ? "project"
                                : "Student Work entry"}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className={styles.grid}>
                        {visibleContent.map((item) => (
                          <ContentCard
                            key={`${item.kind}-${item.id}`}
                            item={item}
                            kind={item.kind}
                            onEdit={() => setActiveForm({ kind: item.kind, item })}
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
                  </>
                )}
              </div>
            )}

            {/* ── Availability Tab ── */}
            {activeTab === "availability" && (
              <div className={styles.section}>
                <Availability />
              </div>
            )}
            {/* ── Bookings Tab ── */}
            {activeTab === "bookings" && (
              <div className={styles.section}>
                <BookingRequests />
              </div>
            )}
            {/* ── Profile Tab ── */}
            {activeTab === "profile" && (
              <div className={styles.section}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h2 className={styles.sectionTitle}>👤 My Profile</h2>
                    <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
                      This information will be displayed on your public tutor
                      profile.
                    </p>
                  </div>
                  {!isEditingProfile && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      style={{
                        padding: "10px 20px",
                        borderRadius: 8,
                        border: "none",
                        background: "#2f6175",
                        color: "white",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      ✏️ Edit
                    </button>
                  )}
                </div>

                {!isEditingProfile ? (
                  <div style={{ maxWidth: 600 }}>
                    {[
                      ["Gender", profile.gender],
                      ["Degree", profile.degree],
                      ["University / Institution", profile.university],
                      ["Area of Expertise", profile.expertise],
                      ["Research Area", profile.researchArea],
                      [
                        "Years of Teaching Experience",
                        profile.yearsOfExperience,
                      ],
                      ["Languages Spoken", profile.languages],
                    ].map(([label, value]) => (
                      <div style={fieldStyle} key={label}>
                        <p style={labelStyle}>{label}</p>
                        <p style={{ margin: "4px 0 0", fontSize: 15 }}>
                          {value || <span style={{ color: "#94a3b8" }}>Not set</span>}
                        </p>
                      </div>
                    ))}
                    <div style={fieldStyle}>
                      <p style={labelStyle}>Personal Website / LinkedIn</p>
                      {safeUrl(profile.website) ? (
                        <a
                          href={safeUrl(profile.website)}
                          target='_blank'
                          rel='noreferrer'
                          style={{
                            display: "block",
                            marginTop: 4,
                            fontSize: 15,
                            color: "#2f6175",
                          }}
                        >
                          {profile.website}
                        </a>
                      ) : (
                        <p style={{ margin: "4px 0 0", fontSize: 15, color: "#94a3b8" }}>
                          Not set
                        </p>
                      )}
                    </div>
                    <div style={fieldStyle}>
                      <p style={labelStyle}>About Me</p>
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: 15,
                          lineHeight: 1.7,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {profile.bio || (
                          <span style={{ color: "#94a3b8" }}>Not set</span>
                        )}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ maxWidth: 600 }}>
                    {/* Gender */}
                    <div style={fieldStyle}>
                      <label style={labelStyle}>
                        Gender <span style={{ color: "#a01f13" }}>*</span>
                      </label>
                      <select
                        name='gender'
                        value={profile.gender}
                        onChange={handleProfileChange}
                        style={inputStyle}
                      >
                        <option value=''>Select gender</option>
                        <option value='Male'>Male</option>
                        <option value='Female'>Female</option>
                      </select>
                    </div>
                    {/* Degree */}
                    <div style={fieldStyle}>
                      <label style={labelStyle}>
                        Degree <span style={{ color: "#a01f13" }}>*</span>
                      </label>
                      <select
                        name='degree'
                        value={profile.degree}
                        onChange={handleProfileChange}
                        style={inputStyle}
                      >
                        <option value=''>Select your highest degree</option>
                        <optgroup label='Secondary Education'>
                          <option value='High School Diploma'>
                            High School Diploma
                          </option>
                          <option value='GED'>GED</option>
                        </optgroup>
                        <optgroup label='Undergraduate'>
                          <option value="Associate's Degree">
                            Associate's Degree
                          </option>
                          <option value='Bachelor of Arts (BA)'>
                            Bachelor of Arts (BA)
                          </option>
                          <option value='Bachelor of Science (BS)'>
                            Bachelor of Science (BS)
                          </option>
                          <option value='Bachelor of Education (BEd)'>
                            Bachelor of Education (BEd)
                          </option>
                          <option value='Bachelor of Engineering (BEng)'>
                            Bachelor of Engineering (BEng)
                          </option>
                        </optgroup>
                        <optgroup label='Graduate'>
                          <option value='Master of Arts (MA)'>
                            Master of Arts (MA)
                          </option>
                          <option value='Master of Science (MS)'>
                            Master of Science (MS)
                          </option>
                          <option value='Master of Education (MEd)'>
                            Master of Education (MEd)
                          </option>
                          <option value='Master of Business Administration (MBA)'>
                            Master of Business Administration (MBA)
                          </option>
                          <option value='Master of Engineering (MEng)'>
                            Master of Engineering (MEng)
                          </option>
                          <option value='Master of Fine Arts (MFA)'>
                            Master of Fine Arts (MFA)
                          </option>
                        </optgroup>
                        <optgroup label='Doctorate'>
                          <option value='Doctor of Philosophy (PhD)'>
                            Doctor of Philosophy (PhD)
                          </option>
                          <option value='Doctor of Education (EdD)'>
                            Doctor of Education (EdD)
                          </option>
                          <option value='Doctor of Medicine (MD)'>
                            Doctor of Medicine (MD)
                          </option>
                          <option value='Doctor of Law (JD)'>
                            Doctor of Law (JD)
                          </option>
                          <option value='Doctor of Business Administration (DBA)'>
                            Doctor of Business Administration (DBA)
                          </option>
                          <option value='Doctor of Engineering (DEng)'>
                            Doctor of Engineering (DEng)
                          </option>
                        </optgroup>
                        <optgroup label='Other'>
                          <option value='Professional Certification'>
                            Professional Certification
                          </option>
                          <option value='Vocational Training'>
                            Vocational Training
                          </option>
                          <option value='Other'>Other</option>
                        </optgroup>
                      </select>
                    </div>

                    {/* University */}
                    <div style={fieldStyle}>
                      <label style={labelStyle}>
                        University / Institution{" "}
                        <span style={{ color: "#a01f13" }}>*</span>
                      </label>
                      <input
                        name='university'
                        value={profile.university}
                        onChange={handleProfileChange}
                        placeholder='e.g. MIT, Stanford University'
                        style={inputStyle}
                      />
                    </div>

                    {/* Expertise */}
                    <div style={fieldStyle}>
                      <label style={labelStyle}>
                        Area of Expertise <span style={{ color: "#a01f13" }}>*</span>
                      </label>
                      <input
                        name='expertise'
                        value={profile.expertise}
                        onChange={handleProfileChange}
                        placeholder='e.g. Machine Learning, Web Development'
                        style={inputStyle}
                      />
                    </div>

                    {/* Research Area */}
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Research Area </label>
                      <input
                        name='researchArea'
                        value={profile.researchArea}
                        onChange={handleProfileChange}
                        placeholder='e.g. Natural Language Processing, Computer Vision'
                        style={inputStyle}
                      />
                    </div>

                    {/* Years of Experience */}
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Years of Teaching Experience</label>
                      <input
                        name='yearsOfExperience'
                        type='number'
                        min='0'
                        value={profile.yearsOfExperience}
                        onChange={handleProfileChange}
                        placeholder='e.g. 5'
                        style={inputStyle}
                      />
                    </div>

                    {/* Languages */}
                    <div style={fieldStyle}>
                      <label style={labelStyle}>
                        Languages Spoken <span style={{ color: "#a01f13" }}>*</span>
                      </label>
                      <input
                        name='languages'
                        value={profile.languages}
                        onChange={handleProfileChange}
                        placeholder='e.g. English, Spanish, Mandarin'
                        style={inputStyle}
                      />
                    </div>

                    {/* Website */}
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Personal Website / LinkedIn</label>
                      <input
                        name='website'
                        value={profile.website}
                        onChange={handleProfileChange}
                        placeholder='e.g. https://linkedin.com/in/yourname'
                        style={inputStyle}
                      />
                    </div>

                    {/* Bio */}
                    <div style={fieldStyle}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <label style={labelStyle}>About Me</label>
                        <span
                          style={{
                            fontSize: 12,
                            color: wordCount > 280 ? "var(--pink)" : "#94a3b8",
                          }}
                        >
                          {wordCount} / 300 words
                        </span>
                      </div>
                      <textarea
                        name='bio'
                        value={profile.bio}
                        onChange={handleProfileChange}
                        placeholder='Tell students about yourself — your background, teaching style, achievements, and why you love teaching...'
                        rows={20}
                        style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                      />
                      {wordCount >= 300 && (
                        <p style={{ color: "#a01f13", fontSize: 12, marginTop: 4 }}>
                          Maximum 300 words reached.
                        </p>
                      )}
                    </div>

                    {/* Save / Cancel buttons */}
                    <div style={{ display: "flex", gap: 12 }}>
                      <button
                        onClick={saveProfile}
                        disabled={profileSaving}
                        style={{
                          padding: "12px 32px",
                          borderRadius: 8,
                          border: "none",
                          background: profileSaved ? "#1f6f4a" : "#2f6175",
                          color: "white",
                          fontSize: 15,
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "background 0.2s",
                        }}
                      >
                        {profileSaving
                          ? "Saving..."
                          : profileSaved
                            ? "Saved!"
                            : "Save Profile"}
                      </button>
                      <button
                        onClick={cancelProfileEdit}
                        disabled={profileSaving}
                        style={{
                          padding: "12px 32px",
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                          background: "white",
                          color: "#64748b",
                          fontSize: 15,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
}
