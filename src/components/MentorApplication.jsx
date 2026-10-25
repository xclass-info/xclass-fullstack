// src/components/MentorApplication.jsx
// The mentor's application, from first step to going live. While it can be
// edited ("started" / "changes_requested") it's a 4-step form that saves as
// they go; after submitting it shows where they are and what happens next.
// Backend: routes/mentor_application.py.
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, live } from "../api";
import { onAuthStateChanged, refreshUser } from "../auth";
import {
  APPLICATION_STAGES,
  MENTOR_TYPES,
  mentorTypeLabel,
  stageIndex,
} from "../utils/mentorVerification";
import { formatMentorName } from "../utils/mentorName";
import InitialsAvatar from "./InitialsAvatar";
import Navbar from "./Navbar";
import Footer from "./Footer";

const MIN_BIO_CHARS = 100;

const DEGREES = [
  "PhD (in progress)",
  "Doctor of Philosophy (PhD)",
  "Doctor of Medicine (MD)",
  "MD-PhD",
  "Doctor of Education (EdD)",
  "Other doctorate",
];

const STEPS = [
  { title: "Your profile", fields: ["name", "mentorType", "degree", "university", "researchArea", "bio", "photo"] },
  { title: "Credentials", fields: ["credential", "cv"] },
  { title: "Review & submit", fields: ["workAuthorized"] },
];

const MISSING_LABELS = {
  name: "Your name",
  mentorType: "Your current role",
  degree: "Your highest degree",
  university: "University or organization",
  researchArea: "Field of research",
  bio: `A bio of at least ${MIN_BIO_CHARS} characters`,
  photo: "A profile photo",
  credential: "Proof of PhD status (university email or document)",
  cv: "Your CV",
  workAuthorized: "US work authorization question",
  agreeTerms: "Agreeing to the Mentor Guidelines",
  consentBackgroundCheck: "Consent to a background check",
  password: "A password (at least 6 characters)",
};

const card = {
  background: "white",
  borderRadius: 16,
  padding: 28,
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
};
const input = {
  width: "100%",
  padding: 11,
  borderRadius: 8,
  border: "1px solid #ddd",
  boxSizing: "border-box",
  fontSize: 15,
  fontFamily: "inherit",
  marginBottom: 14,
};
const label = { display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 };
const hint = { fontWeight: 400, color: "#94a3b8" };
const primaryBtn = {
  padding: "12px 24px",
  borderRadius: 8,
  border: "none",
  background: "#2f6175",
  color: "white",
  fontWeight: 700,
  fontSize: 15,
  cursor: "pointer",
};
const secondaryBtn = { ...primaryBtn, background: "white", color: "#2f6175", border: "1px solid #2f6175" };
const serif = { fontFamily: "'Source Serif 4', Georgia, serif", color: "#1f3a42" };

function Timeline({ status }) {
  const current = stageIndex(status);
  return (
    <ol style={{ display: "flex", listStyle: "none", padding: 0, margin: "0 0 28px", gap: 8 }}>
      {APPLICATION_STAGES.map((s, i) => {
        const done = i < current || status === "approved";
        const active = i === current && status !== "approved";
        return (
          <li key={s.key} style={{ flex: 1, textAlign: "center" }}>
            <div
              style={{
                height: 6,
                borderRadius: 3,
                background: done ? "#1f6f4a" : active ? "#9a772b" : "#e2e8f0",
                marginBottom: 8,
              }}
            />
            <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: done || active ? "#1f3a42" : "#94a3b8" }}>
              {done ? "✓ " : ""}
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Notice({ color = "#2f6175", bg = "#f5f8fa", children }) {
  return (
    <div style={{ background: bg, borderLeft: `4px solid ${color}`, padding: "12px 16px", borderRadius: 6, margin: "0 0 20px", fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
      {children}
    </div>
  );
}

function FileField({ title, help, current, accept, onUpload, busy }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <span style={label}>{title}</span>
      {help && <p style={{ fontSize: 13, color: "#64748b", margin: "-2px 0 8px" }}>{help}</p>}
      {current && (
        <p style={{ fontSize: 14, margin: "0 0 8px" }}>
          <span style={{ color: "#1f6f4a", fontWeight: 600 }}>✓ Uploaded</span> ·{" "}
          <a href={current} target='_blank' rel='noopener noreferrer' style={{ color: "#2f6175" }}>View</a>
        </p>
      )}
      <input type='file' accept={accept} disabled={busy} onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])} />
    </div>
  );
}

function PreviewCard({ app }) {
  const name = formatMentorName(app.name, app);
  return (
    <div style={{ ...card, padding: 22, textAlign: "center" }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 14px" }}>
        Preview of your public card
      </p>
      {app.photoURL ? (
        <img src={app.photoURL} alt='' style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover" }} />
      ) : (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <InitialsAvatar name={app.name || "?"} fontSize='2rem' style={{ width: 96, height: 96, borderRadius: "50%" }} />
        </div>
      )}
      <h3 style={{ ...serif, margin: "12px 0 4px" }}>{name || "Your name"}</h3>
      <p style={{ margin: 0, fontSize: 13, color: "#9a772b", fontWeight: 700 }}>
        {app.mentorType ? mentorTypeLabel(app.mentorType) : "Your role"}
      </p>
      <p style={{ margin: "6px 0 0", fontSize: 13, color: "#64748b" }}>
        {[app.degree, app.university].filter(Boolean).join(" · ") || "Degree · University"}
      </p>
      {app.researchArea && (
        <span style={{ display: "inline-block", marginTop: 10, fontSize: 12, padding: "3px 10px", borderRadius: 20, background: "#fff8dc", color: "#8a6a25" }}>
          {app.researchArea}
        </span>
      )}
      <p style={{ margin: "12px 0 0", fontSize: 13, color: "#475569", lineHeight: 1.6, textAlign: "left" }}>
        {(app.bio || "Your bio will appear here.").slice(0, 220)}
        {(app.bio || "").length > 220 ? "…" : ""}
      </p>
    </div>
  );
}

export default function MentorApplication() {
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [draft, setDraft] = useState({});
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submit, setSubmit] = useState({ agreeTerms: false, consentBackgroundCheck: false, password: "", confirm: "" });
  const [uniEmail, setUniEmail] = useState("");
  const [uniEmailSent, setUniEmailSent] = useState(false);
  const [guidelinesChecked, setGuidelinesChecked] = useState(false);

  useEffect(() => {
    let stopLive = () => {};
    const unsub = onAuthStateChanged((user) => {
      stopLive();
      if (!user) {
        navigate("/teacher/login");
        return;
      }
      if (!user.teacher) {
        setApp({ notMentor: true });
        return;
      }
      stopLive = live(() => api.get("/mentor-application"), (data) => {
        setApp(data);
        // Only seed the form once, so a refresh never clobbers typing.
        setDraft((d) => (Object.keys(d).length ? d : seedDraft(data)));
        setUniEmail((e) => e || data.workEmail || "");
      });
    });
    return () => {
      unsub();
      stopLive();
    };
  }, [navigate]);

  function seedDraft(data) {
    return {
      name: data.name || "",
      mentorType: data.mentorType || "",
      degree: data.degree || "",
      university: data.university || "",
      researchArea: data.researchArea || "",
      expertise: data.expertise || "",
      bio: data.bio || "",
      languages: data.languages || "",
      website: data.website || "",
      workAuthorized: data.workAuthorized ?? null,
    };
  }

  async function save(fields) {
    setError("");
    try {
      setApp(await api.patch("/mentor-application", fields));
    } catch (err) {
      setError(err.detail || "Couldn't save - please try again.");
    }
  }

  function setField(name, value) {
    setDraft((d) => ({ ...d, [name]: value }));
  }

  async function upload(kind, file) {
    setBusy(true);
    setError("");
    try {
      const data = new FormData();
      data.append("file", file);
      setApp(await api.post(`/mentor-application/${kind}`, data));
    } catch (err) {
      setError(err.detail || "Upload failed - please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function sendUniversityEmail() {
    setBusy(true);
    setError("");
    try {
      setApp(await api.post("/mentor-application/university-email", { email: uniEmail.trim() }));
      setUniEmailSent(true);
    } catch (err) {
      setError(err.code === "INVALID_EMAIL" ? "Please enter a valid email address." : "Couldn't send the email - please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function goToStep(next) {
    await save(draft);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    if (!app.hasPassword && submit.password !== submit.confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await save(draft);
      setApp(
        await api.post("/mentor-application/submit", {
          agreeTerms: submit.agreeTerms,
          consentBackgroundCheck: submit.consentBackgroundCheck,
          password: submit.password,
        }),
      );
      refreshUser();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(
        err.code === "INCOMPLETE"
          ? "Almost there - please complete the items marked below."
          : "Couldn't submit - please try again.",
      );
      // Refresh so the missing list is current.
      api.get("/mentor-application").then(setApp).catch(() => {});
    } finally {
      setBusy(false);
    }
  }

  async function acceptGuidelines() {
    setBusy(true);
    try {
      setApp(await api.post("/mentor-application/accept-guidelines"));
      refreshUser();
    } catch {
      setError("Couldn't save - please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!app) {
    return (
      <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
        <Navbar />
        <p style={{ padding: "140px 24px", textAlign: "center", color: "#94a3b8" }}>Loading your application...</p>
      </div>
    );
  }

  if (app.notMentor) {
    return (
      <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
        <Navbar />
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "140px 24px" }}>
          <div style={card}>
            <h2 style={serif}>This isn't a mentor account</h2>
            <p style={{ color: "#64748b" }}>
              You're logged in with an account that isn't a mentor account.
              To apply as a mentor, log out and use the{" "}
              <Link to='/become-a-mentor' style={{ color: "#2f6175" }}>Become a Mentor</Link> page with a different email.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const status = app.verificationStatus;
  const editable = status === "started" || status === "changes_requested";
  const missing = app.missing || [];
  const stepMissing = (i) => STEPS[i].fields.some((f) => missing.includes(f));

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      <Navbar />
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "120px 20px 60px" }}>
        <h1 style={{ ...serif, fontSize: "1.9rem", margin: "0 0 6px" }}>Your mentor application</h1>
        <p style={{ color: "#64748b", margin: "0 0 24px" }}>
          {editable ? "Your progress is saved as you go - you can leave and come back any time." : "Here's where your application stands."}
        </p>
        <Timeline status={status} />

        {error && <Notice color='#a01f13' bg='#fef2f2'>{error}</Notice>}

        {/* ── Editable: the 4-step form ── */}
        {editable && (
          <>
            {status === "changes_requested" && app.adminNote && (
              <Notice color='#a01f13' bg='#fef2f2'>
                <strong>We need a few changes before we can continue:</strong>
                {"\n"}
                {app.adminNote}
              </Notice>
            )}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              {STEPS.map((s, i) => (
                <button
                  key={s.title}
                  onClick={() => goToStep(i)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 20,
                    border: i === step ? "2px solid #2f6175" : "1px solid #e2e8f0",
                    background: i === step ? "#e3eff3" : "white",
                    color: "#1f3a42",
                    fontWeight: i === step ? 700 : 500,
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  {stepMissing(i) ? "○" : "✓"} {i + 1}. {s.title}
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, alignItems: "start" }}>
              <div style={{ ...card, gridColumn: step === 0 ? "auto" : "1 / -1" }}>
                {step === 0 && (
                  <>
                    <h2 style={{ ...serif, marginTop: 0 }}>Your profile</h2>
                    <p style={{ color: "#64748b", fontSize: 14, marginTop: -8 }}>This is what students and parents will see once you're live.</p>
                    <FileField
                      title='Profile photo'
                      help='A clear, friendly headshot works best.'
                      current={app.photoURL}
                      accept='image/*'
                      busy={busy}
                      onUpload={(f) => upload("photo", f)}
                    />
                    <label style={label}>Full name</label>
                    <input style={input} value={draft.name} onChange={(e) => setField("name", e.target.value)} onBlur={() => save({ name: draft.name })} />
                    <label style={label}>Current role</label>
                    <select
                      style={input}
                      value={draft.mentorType}
                      onChange={(e) => {
                        setField("mentorType", e.target.value);
                        save({ mentorType: e.target.value });
                      }}
                    >
                      {MENTOR_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <label style={label}>Highest degree</label>
                    <select
                      style={input}
                      value={draft.degree}
                      onChange={(e) => {
                        setField("degree", e.target.value);
                        save({ degree: e.target.value });
                      }}
                    >
                      <option value=''>Select</option>
                      {DEGREES.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <label style={label}>University or organization</label>
                    <input style={input} value={draft.university} onChange={(e) => setField("university", e.target.value)} onBlur={() => save({ university: draft.university })} />
                    <label style={label}>Field of research</label>
                    <input style={input} value={draft.researchArea} onChange={(e) => setField("researchArea", e.target.value)} onBlur={() => save({ researchArea: draft.researchArea })} placeholder='e.g. Neuroscience' />
                    <label style={label}>Areas of expertise <span style={hint}>(optional, comma separated)</span></label>
                    <input style={input} value={draft.expertise} onChange={(e) => setField("expertise", e.target.value)} onBlur={() => save({ expertise: draft.expertise })} placeholder='e.g. Machine learning, Genomics' />
                    <label style={label}>
                      Bio <span style={hint}>({draft.bio.trim().length}/{MIN_BIO_CHARS} characters minimum)</span>
                    </label>
                    <textarea
                      style={{ ...input, minHeight: 140, resize: "vertical" }}
                      value={draft.bio}
                      onChange={(e) => setField("bio", e.target.value)}
                      onBlur={() => save({ bio: draft.bio })}
                      placeholder='Your research, what you love about it, and what students will get from working with you.'
                    />
                    <label style={label}>Languages you can mentor in <span style={hint}>(optional)</span></label>
                    <input style={input} value={draft.languages} onChange={(e) => setField("languages", e.target.value)} onBlur={() => save({ languages: draft.languages })} placeholder='e.g. English, Mandarin' />
                    <label style={label}>Profile link <span style={hint}>(optional - LinkedIn, Google Scholar or university page)</span></label>
                    <input style={input} value={draft.website} onChange={(e) => setField("website", e.target.value)} onBlur={() => save({ website: draft.website })} placeholder='https://' />
                  </>
                )}

                {step === 1 && (
                  <>
                    <h2 style={{ ...serif, marginTop: 0 }}>Credentials</h2>
                    <p style={{ color: "#64748b", fontSize: 14, marginTop: -8 }}>
                      Two things: proof that you're a PhD student or above, and your CV. Documents are private - only our review team sees them.
                    </p>
                    <h3 style={{ fontSize: 16, margin: "20px 0 8px" }}>1. Proof of PhD status <span style={hint}>(either option)</span></h3>
                    <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                      <strong style={{ fontSize: 14 }}>Option A - verify your university email</strong>
                      <span style={{ fontSize: 13, color: "#64748b" }}> (fastest)</span>
                      {app.workEmailVerified ? (
                        <p style={{ color: "#1f6f4a", fontWeight: 600, fontSize: 14, margin: "10px 0 0" }}>✓ {app.workEmail} is verified</p>
                      ) : (
                        <>
                          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                            <input
                              type='email'
                              style={{ ...input, marginBottom: 0, flex: "1 1 220px" }}
                              value={uniEmail}
                              onChange={(e) => setUniEmail(e.target.value)}
                              placeholder='you@university.edu'
                            />
                            <button style={secondaryBtn} disabled={busy || !uniEmail.trim()} onClick={sendUniversityEmail}>
                              Send link
                            </button>
                          </div>
                          {(uniEmailSent || app.workEmail) && (
                            <p style={{ fontSize: 13, color: "#64748b", margin: "8px 0 0" }}>
                              We sent a link to {app.workEmail || uniEmail}. Click it, then come back here - this page updates on its own.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginBottom: 20 }}>
                      <strong style={{ fontSize: 14 }}>Option B - upload a document</strong>
                      <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 10px" }}>
                        An enrollment letter, transcript, or PhD diploma. A phone photo is fine. PDF or image, up to 10 MB.
                      </p>
                      <FileField title='' current={app.credentialURL} accept='application/pdf,image/*' busy={busy} onUpload={(f) => upload("credential", f)} />
                    </div>
                    <h3 style={{ fontSize: 16, margin: "0 0 8px" }}>2. Your CV</h3>
                    <FileField title='' help='PDF preferred, up to 10 MB.' current={app.cvURL} accept='application/pdf,image/*' busy={busy} onUpload={(f) => upload("cv", f)} />
                  </>
                )}

                {step === 2 && (
                  <>
                    <h2 style={{ ...serif, marginTop: 0 }}>Review & submit</h2>
                    {missing.filter((m) => !["workAuthorized"].includes(m)).length > 0 && (
                      <Notice color='#9a772b' bg='#fff8dc'>
                        <strong>Still to do:</strong>
                        {missing
                          .filter((m) => m !== "workAuthorized")
                          .map((m) => `\n• ${MISSING_LABELS[m] || m}`)
                          .join("")}
                      </Notice>
                    )}

                    <span style={label}>Are you authorized to work in the United States?</span>
                    <div style={{ display: "flex", gap: 16, marginBottom: 18 }}>
                      {[
                        [true, "Yes"],
                        [false, "No"],
                      ].map(([value, text]) => (
                        <label key={text} style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 15 }}>
                          <input
                            type='radio'
                            name='workAuthorized'
                            checked={draft.workAuthorized === value}
                            onChange={() => {
                              setField("workAuthorized", value);
                              save({ workAuthorized: value });
                            }}
                          />
                          {text}
                        </label>
                      ))}
                    </div>

                    <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12, fontSize: 14, lineHeight: 1.5 }}>
                      <input type='checkbox' checked={submit.agreeTerms} onChange={(e) => setSubmit({ ...submit, agreeTerms: e.target.checked })} style={{ marginTop: 3 }} />
                      <span>
                        I have read and agree to the{" "}
                        <Link to='/mentor/guidelines' target='_blank' style={{ color: "#2f6175" }}>Mentor Guidelines</Link>, including the student-safety rules.
                      </span>
                    </label>
                    <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 18, fontSize: 14, lineHeight: 1.5 }}>
                      <input type='checkbox' checked={submit.consentBackgroundCheck} onChange={(e) => setSubmit({ ...submit, consentBackgroundCheck: e.target.checked })} style={{ marginTop: 3 }} />
                      <span>I consent to HappyResearch running a background check before I work with students.</span>
                    </label>

                    {!app.hasPassword && (
                      <>
                        <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 10px" }}>
                          Choose a password - you'll use it with this email to log in as a mentor.
                        </p>
                        <input type='password' style={input} placeholder='Password (at least 6 characters)' value={submit.password} onChange={(e) => setSubmit({ ...submit, password: e.target.value })} />
                        <input type='password' style={input} placeholder='Confirm password' value={submit.confirm} onChange={(e) => setSubmit({ ...submit, confirm: e.target.value })} />
                      </>
                    )}

                    <button style={{ ...primaryBtn, width: "100%", padding: 14 }} disabled={busy} onClick={handleSubmit}>
                      {busy ? "Submitting..." : status === "changes_requested" ? "Resubmit application →" : "Submit application →"}
                    </button>
                  </>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
                  {step > 0 ? (
                    <button style={secondaryBtn} onClick={() => goToStep(step - 1)}>← Back</button>
                  ) : (
                    <span />
                  )}
                  {step < STEPS.length - 1 && (
                    <button style={primaryBtn} onClick={() => goToStep(step + 1)}>Next →</button>
                  )}
                </div>
              </div>

              {step === 0 && <PreviewCard app={{ ...app, ...draft }} />}
            </div>
          </>
        )}

        {/* ── After submitting ── */}
        {status === "submitted" && (
          <div style={card}>
            <h2 style={{ ...serif, marginTop: 0 }}>Thanks - your application is in review</h2>
            <p style={{ color: "#475569", lineHeight: 1.7, margin: 0 }}>
              We review applications within about 3 business days and will email you as soon as there's an update. Sometimes we'll ask for a short video interview.
            </p>
          </div>
        )}

        {status === "interview_requested" && (
          <div style={card}>
            <h2 style={{ ...serif, marginTop: 0 }}>Let's schedule a short interview</h2>
            <p style={{ color: "#475569", lineHeight: 1.7 }}>Before we finish reviewing your application, we'd like to meet you. Here's how to set it up (we also emailed this to you):</p>
            <Notice>{app.interviewMessage}</Notice>
          </div>
        )}

        {status === "onboarding" && (
          <div style={card}>
            <h2 style={{ ...serif, marginTop: 0 }}>🎉 You passed our review - two last steps</h2>
            <p style={{ color: "#475569", lineHeight: 1.7 }}>Your profile goes live as soon as both are done.</p>
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
                <strong>1. Mentor Guidelines</strong>
                {app.guidelinesAcceptedAt ? (
                  <p style={{ color: "#1f6f4a", fontWeight: 600, margin: "8px 0 0" }}>✓ Accepted</p>
                ) : (
                  <>
                    <p style={{ fontSize: 14, color: "#64748b", margin: "6px 0 10px" }}>
                      Please read the <Link to='/mentor/guidelines' target='_blank' style={{ color: "#2f6175" }}>Mentor Guidelines</Link> (about 5 minutes).
                    </p>
                    <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, marginBottom: 12 }}>
                      <input type='checkbox' checked={guidelinesChecked} onChange={(e) => setGuidelinesChecked(e.target.checked)} />
                      I've read the Mentor Guidelines and will follow them.
                    </label>
                    <button style={primaryBtn} disabled={!guidelinesChecked || busy} onClick={acceptGuidelines}>Accept guidelines</button>
                  </>
                )}
              </div>
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
                <strong>2. Background check</strong>
                <p style={{ fontSize: 14, color: app.backgroundCheckStatus === "passed" ? "#1f6f4a" : "#64748b", fontWeight: app.backgroundCheckStatus === "passed" ? 600 : 400, margin: "8px 0 0" }}>
                  {app.backgroundCheckStatus === "passed"
                    ? "✓ Completed"
                    : app.backgroundCheckStatus === "failed"
                      ? "We'll be in touch by email about this step."
                      : "In progress - our team runs this; you don't need to do anything."}
                </p>
              </div>
            </div>
          </div>
        )}

        {status === "approved" && (
          <div style={card}>
            <h2 style={{ ...serif, marginTop: 0 }}>🎉 You're live!</h2>
            <p style={{ color: "#475569", lineHeight: 1.7 }}>
              Students can now find your profile and apply for your research. A great next step: post your first research project from your dashboard.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button style={primaryBtn} onClick={() => navigate("/teacher/dashboard")}>Go to my dashboard →</button>
              <button style={secondaryBtn} onClick={() => navigate(`/teacher/${app.id}`)}>View my public profile</button>
            </div>
          </div>
        )}

        {status === "declined" && (
          <div style={card}>
            <h2 style={{ ...serif, marginTop: 0 }}>Thank you for applying</h2>
            <p style={{ color: "#475569", lineHeight: 1.7 }}>
              After reviewing your application, we're not able to move forward at this time. We truly appreciate the time you took to apply.
            </p>
            {app.rejectionReason && <Notice color='#94a3b8'>{app.rejectionReason}</Notice>}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
