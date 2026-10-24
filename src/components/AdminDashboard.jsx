// src/components/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { api, live, seg, toMillis, formatDate } from "../api";
import { onAuthStateChanged, login, logout, sendPasswordReset } from "../auth";
import { Link } from "react-router-dom";
import MentorApplicationsAdmin, { needsAdminAction } from "./MentorApplicationsAdmin";
import AdminToday from "./admin/AdminToday";
import AdminPeople from "./admin/AdminPeople";
import AdminEmailLog from "./admin/AdminEmailLog";
import AdminSearch from "./admin/AdminSearch";
import {
  approveStudentApplication,
  rejectStudentApplication,
} from "../utils/registration";

function useNarrowScreen() {
  const query = "(max-width: 800px)";
  const [narrow, setNarrow] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setNarrow(mq.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return narrow;
}

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [tab, setTab] = useState("today");
  const narrow = useNarrowScreen();
  const [personId, setPersonId] = useState(null); // People side panel
  const [searchText, setSearchText] = useState("");

  const [research, setResearch] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  // Mentor applications waiting on an admin action (review or background check).
  const pendingApplications = mentors.filter(needsAdminAction);
  const pendingStudentApplications = registrations.filter(
    (r) => r.status === "pending",
  );
  // rejectTarget is { type: "student", id } or null - the student-application
  // reject flow below. (Mentor applications: see MentorApplicationsAdmin.)
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  // Guards against double-submitting an approve/reject action (e.g. a fast
  // double-click), which would otherwise hit Firestore twice and surface a
  // false "something went wrong" on the second, already-too-late call.
  const [actionBusy, setActionBusy] = useState(false);

  const [editItem, setEditItem] = useState(null);
  const [editType, setEditType] = useState(null);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);

  // Filters & sorting for the list tabs (client-side, data is already loaded)
  const [researchSearch, setResearchSearch] = useState("");
  const [researchStatusFilter, setResearchStatusFilter] = useState("all");
  const [researchSort, setResearchSort] = useState("newest");

  const [studentAppSearch, setStudentAppSearch] = useState("");
  const [studentAppKindFilter, setStudentAppKindFilter] = useState("all");
  const [studentAppSort, setStudentAppSort] = useState("oldest");

  useEffect(() => {
    // The admin role is granted by the backend (ADMIN_EMAILS) and enforced
    // on every /api/admin call - this check only picks which screen to show.
    const unsub = onAuthStateChanged((u) => setUser(u?.isAdmin ? u : null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = live(() => api.get("/admin/research"), setResearch);
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = live(() => api.get("/admin/teachers"), setMentors);
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = live(() => api.get("/admin/registrations"), setRegistrations);
    return () => unsub();
  }, [user]);

  async function uploadMentorImage(file, mentorId) {
    const data = new FormData();
    data.append("file", file);
    await api.post(`/admin/teachers/${seg(mentorId)}/photo`, data);
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResetSent(false);
    try {
      const result = await login(email, password);
      if (!result.isAdmin) {
        logout();
        setError("You are not authorized as admin.");
      }
    } catch (err) {
      if (err.code === "RATE_LIMITED") {
        setError(
          "Too many failed attempts. Wait a few minutes, or reset your password below.",
        );
      } else if (err.code === "PASSWORD_RESET_REQUIRED") {
        setError(
          'This account doesn\'t have a password yet - click "Forgot password?" below to set one.',
        );
      } else {
        setError("Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError("Enter your admin email above first, then click Forgot password.");
      return;
    }
    setResetLoading(true);
    setError("");
    setResetSent(false);
    try {
      await sendPasswordReset(email);
      setResetSent(true);
    } catch (err) {
      if (err.code === "INVALID_EMAIL") {
        setError("That doesn't look like a valid email address.");
      } else {
        setError("Could not send reset email. Please try again.");
      }
    } finally {
      setResetLoading(false);
    }
  }

  function handleLogout() {
    logout();
    setUser(null);
  }

  async function approveStudentApp(regId) {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      await approveStudentApplication(regId);
    } catch (err) {
      console.error(err);
      alert(
        err.message === "FULL"
          ? "No seats left - can't approve this application."
          : "Something went wrong. Please try again.",
      );
    } finally {
      setActionBusy(false);
    }
  }

  function openStudentRejectModal(regId) {
    setRejectTarget({ type: "student", id: regId });
    setRejectReason("");
    setRejectError("");
  }

  async function submitRejectModal() {
    const trimmed = rejectReason.trim();
    if (trimmed.length < 10 || !/[a-zA-Z]{3,}/.test(trimmed)) {
      setRejectError(
        "Please write at least one full sentence explaining why this is being rejected.",
      );
      return;
    }
    if (actionBusy) return;
    setActionBusy(true);
    try {
      await rejectStudentApplication(rejectTarget.id, trimmed);
      setRejectTarget(null);
    } catch (err) {
      console.error(err);
      setRejectError("Something went wrong. Please try again.");
    } finally {
      setActionBusy(false);
    }
  }

  function openPerson(id) {
    setPersonId(id);
    setTab("people");
  }

  // From the email log: find the account behind an address and open it.
  async function findPersonByEmail(address) {
    const found = await api.get(`/admin/search?q=${encodeURIComponent(address)}`);
    const match = found.people.find((p) => p.email.toLowerCase() === address.toLowerCase());
    if (match) openPerson(match.id);
    else alert(`No account uses ${address} (it may be the team inbox or a deleted account).`);
  }

  function openContent(kind, item) {
    if (kind === "research") {
      setResearchSearch(item.title);
      setTab("research");
    } else {
      window.open(`/projects/${item.id}`, "_blank", "noopener");
    }
  }

  function editMentor(mentor) {
    setEditItem({ major: "", ...mentor });
    setEditType("teachers");
    setImageFile(null);
    setImagePreview(null);
  }

  async function handleDisable(collection_, id, currentStatus) {
    try {
      await api.patch(`/admin/${collection_}/${seg(id)}`, {
        status: currentStatus === "disabled" ? "published" : "disabled",
      });
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    }
  }

  async function handleDelete(collection_, id) {
    if (
      !window.confirm(
        "Are you sure you want to delete this? This cannot be undone.",
      )
    )
      return;
    try {
      await api.del(`/admin/${collection_}/${seg(id)}`);
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    }
  }

  async function handleSaveEdit() {
    if (!editItem || !editType) return;
    setImageUploading(true);
    try {
      const { id, ...data } = editItem;
      if (imageFile && editType === "teachers") {
        await uploadMentorImage(imageFile, id);
      }
      await api.patch(`/admin/${editType}/${seg(id)}`, data);
      setEditItem(null);
      setEditType(null);
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save. Please try again.");
    } finally {
      setImageUploading(false);
    }
  }

  const btnStyle = (color) => ({
    padding: "6px 14px",
    borderRadius: 6,
    border: "none",
    background: color,
    color: "white",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  });

  // ── Login screen ──

  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f9fafb",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 16,
            padding: 32,
            width: 360,
            boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
            position: "relative",
          }}
        >
          {/* X button */}
          <a
            href='/'
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              color: "#888",
              fontSize: 22,
              textDecoration: "none",
              lineHeight: 1,
            }}
          >
            ✕
          </a>

          <h2 style={{ marginBottom: 4 }}>🔐 Admin Login</h2>
          <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>
            HappyResearch admin only
          </p>
          {error && (
            <p style={{ color: "red", fontSize: 13, marginBottom: 12 }}>
              {error}
            </p>
          )}
          {resetSent && (
            <p style={{ color: "#1f6f4a", fontSize: 13, marginBottom: 12 }}>
              Password reset email sent to {email.trim()}. Check your inbox
              (and spam folder).
            </p>
          )}
          <form onSubmit={handleLogin}>
            <input
              type='email'
              placeholder='Admin email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #ddd",
                marginBottom: 10,
                boxSizing: "border-box",
              }}
            />
            <input
              type='password'
              placeholder='Password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #ddd",
                marginBottom: 16,
                boxSizing: "border-box",
              }}
            />
            <button
              type='submit'
              disabled={loading}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                border: "none",
                background: "#2f6175",
                color: "white",
                fontSize: 15,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {loading ? "Logging in..." : "Login →"}
            </button>
          </form>
          <button
            type='button'
            onClick={handleForgotPassword}
            disabled={resetLoading}
            style={{
              display: "block",
              width: "100%",
              marginTop: 14,
              background: "none",
              border: "none",
              color: "#2f6175",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            {resetLoading ? "Sending..." : "Forgot password?"}
          </button>
        </div>
      </div>
    );
  }

  // ── Filters & sorting (client-side, data is already fully loaded) ──
  const filterInputStyle = {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: 13,
    fontFamily: "inherit",
  };

  function sortByDate(list, field, direction) {
    return [...list].sort((a, b) => {
      const ta = toMillis(a[field]);
      const tb = toMillis(b[field]);
      return direction === "oldest" ? ta - tb : tb - ta;
    });
  }

  let visibleResearch = research.filter((r) => {
    if (
      researchStatusFilter === "active" &&
      r.status === "disabled"
    )
      return false;
    if (researchStatusFilter === "disabled" && r.status !== "disabled")
      return false;
    const q = researchSearch.trim().toLowerCase();
    if (!q) return true;
    return [r.title, r.idea, r.teacherName]
      .filter(Boolean)
      .some((s) => s.toLowerCase().includes(q));
  });
  visibleResearch =
    researchSort === "title"
      ? [...visibleResearch].sort((a, b) =>
          (a.title || "").localeCompare(b.title || ""),
        )
      : sortByDate(visibleResearch, "createdAt", researchSort);

  let visibleStudentApplications = pendingStudentApplications.filter((r) => {
    if (studentAppKindFilter !== "all" && r.kind !== studentAppKindFilter)
      return false;
    const q = studentAppSearch.trim().toLowerCase();
    if (!q) return true;
    return [r.studentName, r.studentEmail, r.itemTitle]
      .filter(Boolean)
      .some((s) => s.toLowerCase().includes(q));
  });
  visibleStudentApplications =
    studentAppSort === "name"
      ? [...visibleStudentApplications].sort((a, b) =>
          (a.studentName || "").localeCompare(b.studentName || ""),
        )
      : [...visibleStudentApplications].sort((a, b) => {
          const ta = toMillis(a.createdAt);
          const tb = toMillis(b.createdAt);
          return studentAppSort === "oldest" ? ta - tb : tb - ta;
        });

  const navItemsRaw = [
    { id: "today", label: "🏠 Today" },
    { id: "people", label: "👥 People", group: "People" },
    {
      id: "applications",
      label: `🧑‍🏫 Mentor applications${pendingApplications.length > 0 ? ` (${pendingApplications.length})` : ""}`,
      group: "People",
    },
    {
      id: "student-applications",
      label: `🎓 Enrollments${pendingStudentApplications.length > 0 ? ` (${pendingStudentApplications.length})` : ""}`,
      group: "Activity",
    },
    { id: "research", label: "📚 Content", group: "Content" },
    { id: "emails", label: "📨 Email log", group: "System" },
  ];
  let lastNavGroup = null;
  const navItems = navItemsRaw.map((item) => {
    const showGroupLabel = Boolean(item.group && item.group !== lastNavGroup);
    lastNavGroup = item.group || lastNavGroup;
    return { ...item, showGroupLabel };
  });

  // ── Admin dashboard ──
  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", padding: narrow ? 16 : 32 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: narrow ? 16 : 32,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>🛡 Admin Dashboard</h2>
          <p style={{ color: "#888", fontSize: 14, margin: 0 }}>
            Logged in as {user.email}
          </p>
        </div>
        <AdminSearch
          value={searchText}
          onChange={setSearchText}
          onOpenPerson={openPerson}
          onOpenContent={openContent}
        />
        <button onClick={handleLogout} style={btnStyle("#a01f13")}>
          Logout
        </button>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: narrow ? "column" : "row",
          gap: narrow ? 12 : 24,
          alignItems: narrow ? "stretch" : "flex-start",
        }}
      >
        {/* Sidebar nav - a scrollable row of tabs on small screens */}
        <nav
          style={{
            width: narrow ? "auto" : 200,
            flexShrink: 0,
            background: "white",
            borderRadius: 12,
            border: "1px solid #eee",
            padding: narrow ? 6 : "16px 12px",
            display: "flex",
            flexDirection: narrow ? "row" : "column",
            overflowX: narrow ? "auto" : "visible",
            gap: 2,
            position: narrow ? "static" : "sticky",
            top: 24,
          }}
        >
          {navItems.map((item) => (
            <div key={item.id} style={{ flexShrink: 0 }}>
              {item.showGroupLabel && !narrow && (
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#aaa",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    padding: "12px 12px 4px",
                    margin: 0,
                  }}
                >
                  {item.group}
                </p>
              )}
              <button
                onClick={() => setTab(item.id)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: tab === item.id ? "#2f6175" : "transparent",
                  color: tab === item.id ? "white" : "#555",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  whiteSpace: narrow ? "nowrap" : "normal",
                }}
              >
                {item.label}
              </button>
            </div>
          ))}
        </nav>

        <main style={{ flex: 1, minWidth: 0 }}>
          {tab === "today" && <AdminToday onOpenPerson={openPerson} onGo={setTab} />}

          {tab === "people" && (
            <AdminPeople
              openId={personId}
              onOpen={setPersonId}
              onEditMentor={editMentor}
              onGo={(t) => {
                setPersonId(null);
                setTab(t);
              }}
            />
          )}

          {tab === "emails" && <AdminEmailLog onFindPerson={findPersonByEmail} />}

          {/* ── Research Tab ── */}
      {tab === "research" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <p style={{ color: "#888", margin: 0 }}>
              {visibleResearch.length} of {research.length} research entries
            </p>
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <input
              type='text'
              placeholder='Search title, idea, mentor...'
              value={researchSearch}
              onChange={(e) => setResearchSearch(e.target.value)}
              style={{ ...filterInputStyle, flex: "1 1 220px" }}
            />
            <select
              value={researchStatusFilter}
              onChange={(e) => setResearchStatusFilter(e.target.value)}
              style={filterInputStyle}
            >
              <option value='all'>All statuses</option>
              <option value='active'>Active</option>
              <option value='disabled'>Disabled</option>
            </select>
            <select
              value={researchSort}
              onChange={(e) => setResearchSort(e.target.value)}
              style={filterInputStyle}
            >
              <option value='newest'>Newest first</option>
              <option value='oldest'>Oldest first</option>
              <option value='title'>Title (A-Z)</option>
            </select>
          </div>
          {visibleResearch.length === 0 ? (
            <p style={{ color: "#aaa" }}>No research matches these filters.</p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: 16,
              }}
            >
              {visibleResearch.map((r) => (
                <div
                  key={r.id}
                  style={{
                    background: "white",
                    borderRadius: 12,
                    padding: 20,
                    border: `1px solid ${r.status === "disabled" ? "#fca5a5" : "#eee"}`,
                    opacity: r.status === "disabled" ? 0.7 : 1,
                  }}
                >
                  {r.status === "disabled" && (
                    <span
                      style={{
                        fontSize: 11,
                        background: "#fee2e2",
                        color: "#a01f13",
                        padding: "2px 8px",
                        borderRadius: 20,
                        marginBottom: 8,
                        display: "inline-block",
                      }}
                    >
                      Disabled
                    </span>
                  )}
                  <h3 style={{ margin: "0 0 8px", fontSize: 15 }}>{r.title}</h3>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#555",
                      marginBottom: 8,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {r.idea}
                  </p>
                  <p style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>
                    👩‍🏫 {r.teacherName}
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      onClick={() => {
                        setEditItem({ ...r });
                        setEditType("research");
                      }}
                      style={btnStyle("#2f6175")}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDisable("research", r.id, r.status)}
                      style={btnStyle(
                        r.status === "disabled" ? "#1f6f4a" : "#f59e0b",
                      )}
                    >
                      {r.status === "disabled" ? "✅ Enable" : "⏸ Disable"}
                    </button>
                    <button
                      onClick={() => handleDelete("research", r.id)}
                      style={btnStyle("#a01f13")}
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Applications Tab ── */}
      {tab === "applications" && <MentorApplicationsAdmin mentors={mentors} />}

      {tab === "student-applications" && (
        <div>
          <p style={{ color: "#888", marginBottom: 16 }}>
            {visibleStudentApplications.length} of{" "}
            {pendingStudentApplications.length} pending application
            {pendingStudentApplications.length === 1 ? "" : "s"}
          </p>
          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <input
              type='text'
              placeholder='Search student, email, or title...'
              value={studentAppSearch}
              onChange={(e) => setStudentAppSearch(e.target.value)}
              style={{ ...filterInputStyle, flex: "1 1 220px" }}
            />
            <select
              value={studentAppKindFilter}
              onChange={(e) => setStudentAppKindFilter(e.target.value)}
              style={filterInputStyle}
            >
              <option value='all'>All types</option>
              <option value='research'>Research</option>
              <option value='project'>Project</option>
            </select>
            <select
              value={studentAppSort}
              onChange={(e) => setStudentAppSort(e.target.value)}
              style={filterInputStyle}
            >
              <option value='oldest'>Oldest first</option>
              <option value='newest'>Newest first</option>
              <option value='name'>Name (A-Z)</option>
            </select>
          </div>
          {visibleStudentApplications.length === 0 ? (
            <p style={{ color: "#aaa" }}>
              {pendingStudentApplications.length === 0
                ? "No student applications waiting on review."
                : "No applications match these filters."}
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: 16,
              }}
            >
              {visibleStudentApplications.map((reg) => {
                const mentor = mentors.find((m) => m.id === reg.teacherId);
                return (
                  <div
                    key={reg.id}
                    style={{
                      background: "white",
                      borderRadius: 12,
                      padding: 20,
                      border: "1px solid #eee",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 16 }}>
                      {reg.studentName || "(no name)"}
                    </div>
                    <div style={{ color: "#888", fontSize: 13, marginBottom: 8 }}>
                      {reg.studentEmail}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        background: "#e3eff3",
                        color: "#2f6175",
                        padding: "2px 8px",
                        borderRadius: 20,
                        display: "inline-block",
                        marginBottom: 12,
                      }}
                    >
                      {reg.kind === "research" ? "🔬 Research" : "💡 Project"}
                    </span>

                    <div style={{ fontSize: 13, color: "#333", marginBottom: 14 }}>
                      <div>Applying to: {reg.itemTitle}</div>
                      {mentor && <div>Mentor: {mentor.name}</div>}
                      <div style={{ color: "#aaa" }}>
                        Applied{" "}
                        {formatDate(reg.createdAt)}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        style={btnStyle("#14532d")}
                        disabled={actionBusy}
                        onClick={() => approveStudentApp(reg.id)}
                      >
                        Approve
                      </button>
                      <button
                        style={btnStyle("#a01f13")}
                        disabled={actionBusy}
                        onClick={() => openStudentRejectModal(reg.id)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

        </main>
      </div>

      {/* ── Reject Application Modal ── */}
      {rejectTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: 32,
              width: "100%",
              maxWidth: 480,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h3 style={{ margin: 0 }}>Reject Application</h3>
              <button
                onClick={() => setRejectTarget(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
            <p style={{ color: "#888", fontSize: 13, marginBottom: 12 }}>
              Explain why this application was rejected. This is shown to the student.
            </p>
            <textarea
              autoFocus
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                setRejectError("");
              }}
              rows={4}
              placeholder='e.g. "The uploaded transcript is not legible, please re-upload a clearer scan."'
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #ddd",
                fontSize: 14,
                fontFamily: "inherit",
                resize: "vertical",
                boxSizing: "border-box",
                marginBottom: 8,
              }}
            />
            {rejectError && (
              <p style={{ color: "#a01f13", fontSize: 13, marginBottom: 12 }}>
                {rejectError}
              </p>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setRejectTarget(null)}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  background: "white",
                  color: "#555",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitRejectModal}
                disabled={actionBusy}
                style={btnStyle("#a01f13")}
              >
                {actionBusy ? "Submitting..." : "Reject Application"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editItem && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: 32,
              width: "100%",
              maxWidth: 560,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h3 style={{ margin: 0 }}>
                ✏️ Edit{" "}
                {editType === "research" ? "Research" : "Mentor"}
              </h3>
              <button
                onClick={() => {
                  setEditItem(null);
                  setEditType(null);
                  setImageFile(null);
                  setImagePreview(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Image upload for mentors */}
            {editType === "teachers" && (
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                {imagePreview || editItem.photoURL ? (
                  <img
                    src={imagePreview || editItem.photoURL}
                    alt='Mentor'
                    style={{
                      width: 90,
                      height: 90,
                      borderRadius: "50%",
                      objectFit: "cover",
                      marginBottom: 10,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 90,
                      height: 90,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #2f6175, #427e94)",
                      color: "white",
                      fontSize: 32,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 10px",
                    }}
                  >
                    {editItem.name
                      ?.split(" ")
                      .slice(-1)[0]
                      ?.charAt(0)
                      .toUpperCase() || "T"}
                  </div>
                )}
                <label
                  style={{
                    cursor: "pointer",
                    fontSize: 13,
                    color: "#2f6175",
                    fontWeight: 600,
                  }}
                >
                  📷 {imagePreview ? "Change Photo" : "Upload Photo"}
                  <input
                    type='file'
                    accept='image/*'
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            )}

            {Object.entries(editItem)
              .filter(
                ([key]) =>
                  ![
                    "id",
                    "teacherId",
                    "createdAt",
                    "status",
                    "disabled",
                    "photoURL",
                    "applicants",
                    "enrolledCount",
                    "projects",
                  ].includes(key),
              )
              .map(([key, value]) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      fontSize: 12,
                      color: "#888",
                      fontWeight: 600,
                      textTransform: "capitalize",
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    {key.replace(/([A-Z])/g, " $1")}
                  </label>
                  {key === "gender" ? (
                    <select
                      value={value}
                      onChange={(e) =>
                        setEditItem({ ...editItem, [key]: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: 8,
                        borderRadius: 6,
                        border: "1px solid #ddd",
                        fontSize: 13,
                        boxSizing: "border-box",
                      }}
                    >
                      <option value='Female'>Female</option>
                      <option value='Male'>Male</option>
                    </select>
                  ) : key === "mode" ? (
                    <select
                      value={value}
                      onChange={(e) =>
                        setEditItem({ ...editItem, [key]: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: 8,
                        borderRadius: 6,
                        border: "1px solid #ddd",
                        fontSize: 13,
                        boxSizing: "border-box",
                      }}
                    >
                      <option value='Remote'>Remote</option>
                      <option value='In-Person'>In-Person</option>
                      <option value='Hybrid'>Hybrid</option>
                    </select>
                  ) : key === "stipend" ? (
                    <select
                      value={value}
                      onChange={(e) =>
                        setEditItem({ ...editItem, [key]: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: 8,
                        borderRadius: 6,
                        border: "1px solid #ddd",
                        fontSize: 13,
                        boxSizing: "border-box",
                      }}
                    >
                      <option value='Unpaid'>Unpaid</option>
                      <option value='Paid'>Paid</option>
                      <option value='Academic Credit'>Academic Credit</option>
                    </select>
                  ) : key === "degree" ? (
                    <select
                      value={value}
                      onChange={(e) =>
                        setEditItem({ ...editItem, [key]: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: 8,
                        borderRadius: 6,
                        border: "1px solid #ddd",
                        fontSize: 13,
                        boxSizing: "border-box",
                      }}
                    >
                      <option value=''>Select degree</option>
                      <option value='High School Diploma'>
                        High School Diploma
                      </option>
                      <option value='Bachelor of Science (BS)'>
                        Bachelor of Science (BS)
                      </option>
                      <option value='Bachelor of Arts (BA)'>
                        Bachelor of Arts (BA)
                      </option>
                      <option value='Master of Science (MS)'>
                        Master of Science (MS)
                      </option>
                      <option value='Master of Arts (MA)'>
                        Master of Arts (MA)
                      </option>
                      <option value='Doctor of Philosophy (PhD)'>
                        Doctor of Philosophy (PhD)
                      </option>
                      <option value='Doctor of Medicine (MD)'>
                        Doctor of Medicine (MD)
                      </option>
                      <option value='Other'>Other</option>
                    </select>
                  ) : key === "deadline" ? (
                    <input
                      type='date'
                      value={value}
                      onChange={(e) =>
                        setEditItem({ ...editItem, [key]: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: 8,
                        borderRadius: 6,
                        border: "1px solid #ddd",
                        fontSize: 13,
                        boxSizing: "border-box",
                      }}
                    />
                  ) : typeof value === "string" &&
                    (key === "bio" ||
                      key === "idea" ||
                      key === "impact" ||
                      key === "details" ||
                      key === "description" ||
                      key === "requirements" ||
                      key === "outcomes") ? (
                    <textarea
                      value={value || ""}
                      onChange={(e) =>
                        setEditItem({ ...editItem, [key]: e.target.value })
                      }
                      rows={key === "bio" ? 10 : 5}
                      style={{
                        width: "100%",
                        padding: 8,
                        borderRadius: 6,
                        border: "1px solid #ddd",
                        fontSize: 13,
                        boxSizing: "border-box",
                        resize: "vertical",
                      }}
                    />
                  ) : (
                    <input
                      value={value || ""}
                      onChange={(e) =>
                        setEditItem({ ...editItem, [key]: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: 8,
                        borderRadius: 6,
                        border: "1px solid #ddd",
                        fontSize: 13,
                        boxSizing: "border-box",
                      }}
                    />
                  )}
                </div>
              ))}

            {/* Projects for mentor editing */}
            {editType === "teachers" && (
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <label
                    style={{ fontSize: 12, color: "#888", fontWeight: 600 }}
                  >
                    PROJECT IDEAS
                  </label>
                </div>
                {(editItem.projects || []).length === 0 && (
                  <p style={{ fontSize: 13, color: "#aaa" }}>
                    No projects yet.
                  </p>
                )}
                {(editItem.projects || []).map((project, index) => (
                  <div
                    key={project.id}
                    style={{
                      background: "#f9fafb",
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 8,
                      border: "1px solid #eee",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}
                    >
                      <label
                        style={{ fontSize: 12, color: "#888", fontWeight: 600 }}
                      >
                        Project {index + 1}
                      </label>
                      <button
                        type='button'
                        onClick={() =>
                          setEditItem({
                            ...editItem,
                            projects: editItem.projects.filter(
                              (_, i) => i !== index,
                            ),
                          })
                        }
                        style={{
                          background: "none",
                          border: "none",
                          color: "#a01f13",
                          cursor: "pointer",
                          fontSize: 13,
                        }}
                      >
                        ✕ Remove
                      </button>
                    </div>
                    <input
                      placeholder='Project title'
                      value={project.title}
                      onChange={(e) => {
                        const updated = [...editItem.projects];
                        updated[index] = {
                          ...updated[index],
                          title: e.target.value,
                        };
                        setEditItem({ ...editItem, projects: updated });
                      }}
                      style={{
                        width: "100%",
                        padding: 8,
                        borderRadius: 6,
                        border: "1px solid #ddd",
                        fontSize: 13,
                        boxSizing: "border-box",
                        marginBottom: 6,
                      }}
                    />
                    <textarea
                      placeholder='Project description'
                      value={project.description}
                      onChange={(e) => {
                        const updated = [...editItem.projects];
                        updated[index] = {
                          ...updated[index],
                          description: e.target.value,
                        };
                        setEditItem({ ...editItem, projects: updated });
                      }}
                      rows={5}
                      style={{
                        width: "100%",
                        padding: 8,
                        borderRadius: 6,
                        border: "1px solid #ddd",
                        fontSize: 13,
                        boxSizing: "border-box",
                        resize: "vertical",
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                onClick={handleSaveEdit}
                disabled={imageUploading}
                style={{ ...btnStyle("#1f6f4a"), flex: 1, padding: 12 }}
              >
                {imageUploading ? "Saving..." : "Save Changes ✓"}
              </button>
              <button
                onClick={() => {
                  setEditItem(null);
                  setEditType(null);
                  setImageFile(null);
                  setImagePreview(null);
                }}
                style={{ ...btnStyle("#888"), flex: 1, padding: 12 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
