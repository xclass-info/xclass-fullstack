// src/components/admin/AdminPeople.jsx
// Everyone with an account - students, mentors, admins - in one list. Click
// a person to open a side panel with all their details and account actions
// (resend emails, password reset, hide, delete/restore). Backend:
// routes/admin_people.py.
import { useEffect, useState } from "react";
import { api, live, seg, formatDate } from "../../api";
import { mentorTypeLabel, statusInfo } from "../../utils/mentorVerification";
import { card, chip, input, smallBtn } from "./adminStyles";

const FILTERS = [
  { id: "all", label: "Everyone", test: (p) => !p.deletedAt },
  { id: "students", label: "Students", test: (p) => !p.deletedAt && p.isStudent },
  { id: "mentors", label: "Mentors", test: (p) => !p.deletedAt && p.isMentor },
  { id: "admins", label: "Admins", test: (p) => !p.deletedAt && p.isAdmin },
  { id: "deleted", label: "Recently deleted", test: (p) => p.deletedAt },
];

const EMAIL_STATUS = {
  sent: chip("#14532d", "rgba(22,101,52,0.08)"),
  failed: chip("#a01f13", "rgba(160,31,19,0.08)"),
  suppressed: chip("#64748b", "#f1f5f9"),
};

function RoleChips({ p }) {
  return (
    <span style={{ display: "inline-flex", gap: 4, flexWrap: "wrap" }}>
      {p.isAdmin && <span style={chip("#7c2d12", "#ffedd5")}>Admin</span>}
      {p.isStudent && (
        <span style={chip("#2f6175", "#e3eff3")}>Student{p.studentVerified === false ? " · unverified" : ""}</span>
      )}
      {p.isMentor && (
        <span style={chip(statusInfo(p.mentorStatus).color, statusInfo(p.mentorStatus).bg)}>
          Mentor · {statusInfo(p.mentorStatus).label}
          {p.mentorHidden ? " · hidden" : ""}
        </span>
      )}
      {p.deletedAt && <span style={chip("#a01f13", "rgba(160,31,19,0.08)")}>Deleted</span>}
    </span>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 22 }}>
      <h4 style={{ margin: "0 0 8px", fontSize: 14, color: "#1f2937" }}>{title}</h4>
      {children}
    </div>
  );
}

function Line({ children }) {
  return (
    <div style={{ fontSize: 13, padding: "7px 0", borderBottom: "1px solid #f1f5f9", wordBreak: "break-word" }}>
      {children}
    </div>
  );
}

function Empty({ text }) {
  return <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>{text}</p>;
}

function contentRows(content) {
  return [
    ...content.research.map((r) => ["Research", r]),
    ...content.projects.map((r) => ["Project", r]),
    ...content.showcase.map((r) => ["Student work", r]),
  ];
}

function PersonPanel({ id, onClose, onEditMentor, onGo }) {
  const [p, setP] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null); // { ok, text }
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    setP(null);
    setNotice(null);
    setConfirming(false);
    return live(() => api.get(`/admin/people/${seg(id)}`), setP);
  }, [id]);

  async function act(label, fn) {
    setBusy(true);
    setNotice(null);
    try {
      await fn();
      setNotice({ ok: true, text: label });
    } catch (err) {
      setNotice({ ok: false, text: err.detail || "Something went wrong. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  const path = (action) => `/admin/people/${seg(id)}/${action}`;

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.35)", zIndex: 150, display: "flex", justifyContent: "flex-end" }}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 560, height: "100%", overflowY: "auto", background: "white", padding: 24, boxSizing: "border-box", boxShadow: "-8px 0 24px rgba(0,0,0,0.12)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0 }}>{p?.name || p?.email || "Loading..."}</h3>
            {p && (
              <>
                <p style={{ margin: "4px 0 8px", fontSize: 13, color: "#64748b", wordBreak: "break-all" }}>
                  {p.email} · joined {formatDate(p.createdAt)}
                </p>
                <RoleChips p={p} />
              </>
            )}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>

        {p && (
          <>
            {notice && (
              <p style={{ margin: "14px 0 0", padding: "8px 12px", borderRadius: 8, fontSize: 13, background: notice.ok ? "#f0fdf4" : "#fef2f2", color: notice.ok ? "#14532d" : "#a01f13" }}>
                {notice.text}
              </p>
            )}

            {p.deletedAt ? (
              <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: "#fef2f2" }}>
                <p style={{ margin: "0 0 10px", fontSize: 14, color: "#7f1d1d" }}>
                  Deleted on {formatDate(p.deletedAt)}. It will be permanently removed on{" "}
                  <strong>{formatDate(p.purgeAt)}</strong> unless you restore it.
                </p>
                <button style={smallBtn("#14532d")} disabled={busy} onClick={() => act("Account restored.", () => api.post(path("restore")))}>
                  Restore account
                </button>
              </div>
            ) : (
              <Section title='Actions'>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button style={smallBtn("#2f6175", true)} disabled={busy} onClick={() => act("Password reset email sent.", () => api.post(path("password-reset")))}>
                    Send password reset
                  </button>
                  {(p.studentVerified === false || ["started", "changes_requested"].includes(p.mentorStatus) || p.teacher?.accountEmailVerified === false) && (
                    <>
                      <button
                        style={smallBtn("#2f6175", true)}
                        disabled={busy}
                        onClick={() => act("Email sent.", () => api.post(path("resend-verification")))}
                      >
                        {["started", "changes_requested"].includes(p.mentorStatus) ? "Resend application link" : "Resend verification email"}
                      </button>
                      <button style={smallBtn("#2f6175", true)} disabled={busy} onClick={() => act("Email marked as verified.", () => api.post(path("mark-verified")))}>
                        Mark email verified
                      </button>
                    </>
                  )}
                  {p.isMentor && (
                    <>
                      <button style={smallBtn("#2f6175", true)} onClick={() => onEditMentor(p.teacher)}>Edit mentor profile</button>
                      {p.mentorStatus === "approved" && (
                        <button
                          style={smallBtn("#9a772b", true)}
                          disabled={busy}
                          onClick={() =>
                            act(p.mentorHidden ? "Mentor is visible on the site again." : "Mentor hidden from the site.", () =>
                              api.patch(`/admin/teachers/${seg(id)}`, { disabled: !p.mentorHidden }),
                            )
                          }
                        >
                          {p.mentorHidden ? "Show on site" : "Hide from site"}
                        </button>
                      )}
                      {p.mentorStatus !== "approved" && (
                        <button style={smallBtn("#2f6175", true)} onClick={() => onGo("applications")}>Open application</button>
                      )}
                    </>
                  )}
                  {!confirming && (
                    <button style={smallBtn("#a01f13", true)} onClick={() => setConfirming(true)}>Delete account</button>
                  )}
                </div>

                {confirming && (
                  <div style={{ marginTop: 12, padding: 14, borderRadius: 10, border: "1px solid #fecaca", background: "#fff7f7" }}>
                    <p style={{ margin: "0 0 8px", fontSize: 13, color: "#7f1d1d" }}>
                      The account stops working right away and disappears from the site. You can restore it for 30 days. Type <strong>{p.email}</strong> to confirm.
                    </p>
                    <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} style={{ ...input, width: "100%", marginBottom: 8 }} placeholder={p.email} autoFocus />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        style={smallBtn("#a01f13")}
                        disabled={busy || confirmText.trim().toLowerCase() !== p.email.toLowerCase()}
                        onClick={() =>
                          act("Account deleted. You can restore it from Recently deleted.", async () => {
                            await api.post(path("delete"), { confirm: confirmText.trim() });
                            setConfirming(false);
                            setConfirmText("");
                          })
                        }
                      >
                        Delete account
                      </button>
                      <button style={smallBtn("#555", true)} onClick={() => setConfirming(false)}>Cancel</button>
                    </div>
                  </div>
                )}
              </Section>
            )}

            {p.student && (
              <Section title='Student'>
                <Line>Grade: {p.student.grade || "—"} · Phone: {p.student.phone || "—"}</Line>
                <Line>Email verified: {p.studentVerified === false ? "No" : "Yes"}</Line>
              </Section>
            )}

            {p.teacher && (
              <Section title='Mentor'>
                <Line>{mentorTypeLabel(p.teacher.mentorType) || "—"} · {p.teacher.degree || "—"}</Line>
                <Line>{[p.teacher.university, p.teacher.researchArea].filter(Boolean).join(" · ") || "—"}</Line>
                <Line>Application status: {statusInfo(p.mentorStatus).label}</Line>
              </Section>
            )}

            {p.isStudent && (
              <Section title={`Applications (${p.registrations.length})`}>
                {p.registrations.length === 0 ? (
                  <Empty text='No applications yet.' />
                ) : (
                  p.registrations.map(({ reg, mentorName }) => (
                    <Line key={reg.id}>
                      <strong>{reg.itemTitle}</strong> · {reg.status || "approved"} · {mentorName || "—"} · {formatDate(reg.createdAt)}
                    </Line>
                  ))
                )}
              </Section>
            )}

            {p.content && (
              <Section title='Mentor content'>
                {contentRows(p.content).length === 0 ? (
                  <Empty text='No posts yet.' />
                ) : (
                  contentRows(p.content).map(([kind, r]) => (
                    <Line key={r.id}>
                      <span style={{ color: "#94a3b8" }}>{kind}:</span> {r.title} {r.status === "disabled" ? "(hidden)" : ""}
                    </Line>
                  ))
                )}
              </Section>
            )}

            <Section title={`1-on-1 bookings (${p.bookings.length})`}>
              {p.bookings.length === 0 ? (
                <Empty text='No bookings.' />
              ) : (
                p.bookings.map((b) => (
                  <Line key={b.id}>
                    {b.studentName} with {b.teacherName} · {b.date} {b.time} · {b.status}
                  </Line>
                ))
              )}
            </Section>

            <Section title={`Emails sent (${p.emails.length})`}>
              {p.emails.length === 0 ? (
                <Empty text='No emails recorded yet (the log started in October 2026).' />
              ) : (
                p.emails.map((e) => (
                  <Line key={e.id}>
                    <span style={EMAIL_STATUS[e.status]}>{e.status}</span> {e.subject}{" "}
                    <span style={{ color: "#94a3b8" }}>· {formatDate(e.createdAt)}</span>
                    {e.error && <div style={{ color: "#a01f13", fontSize: 12 }}>{e.error}</div>}
                  </Line>
                ))
              )}
            </Section>
          </>
        )}
      </aside>
    </div>
  );
}

export default function AdminPeople({ openId, onOpen, onEditMentor, onGo }) {
  const [people, setPeople] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => live(() => api.get("/admin/people"), setPeople), []);

  if (!people) return <p style={{ color: "#94a3b8" }}>Loading...</p>;
  const test = FILTERS.find((f) => f.id === filter).test;
  const q = search.trim().toLowerCase();
  const visible = people.filter(test).filter((p) => !q || `${p.name} ${p.email}`.toLowerCase().includes(q));

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {FILTERS.map((f) => {
          const count = people.filter(f.test).length;
          const active = f.id === filter;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{ padding: "7px 14px", borderRadius: 20, border: active ? "2px solid #2f6175" : "1px solid #e2e8f0", background: active ? "#e3eff3" : "white", fontWeight: active ? 700 : 500, fontSize: 13, cursor: "pointer" }}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Filter by name or email...' style={{ ...input, width: "100%", maxWidth: 360, marginBottom: 14 }} />

      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        {visible.length === 0 ? (
          <p style={{ color: "#94a3b8", padding: 20, margin: 0 }}>Nobody here.</p>
        ) : (
          visible.map((p, i) => (
            <button
              key={p.id}
              onClick={() => onOpen(p.id)}
              style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px 16px", border: "none", borderTop: i ? "1px solid #f1f5f9" : "none", background: "white", cursor: "pointer", textAlign: "left", flexWrap: "wrap" }}
            >
              <span style={{ minWidth: 0 }}>
                <strong style={{ fontSize: 14 }}>{p.name || "(no name)"}</strong>
                <span style={{ display: "block", fontSize: 13, color: "#64748b", wordBreak: "break-all" }}>{p.email}</span>
              </span>
              <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <RoleChips p={p} />
                <span style={{ fontSize: 12, color: "#94a3b8" }}>{formatDate(p.deletedAt || p.createdAt)}</span>
              </span>
            </button>
          ))
        )}
      </div>

      {openId && <PersonPanel id={openId} onClose={() => onOpen(null)} onEditMentor={onEditMentor} onGo={onGo} />}
    </div>
  );
}

