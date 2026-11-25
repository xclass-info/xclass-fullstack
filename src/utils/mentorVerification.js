// Shared constants for the mentor application (see
// components/MentorApplication.jsx and backend routes/mentor_application.py).
// Only PhD students and above can mentor. A mentor is public ("live") only
// when verificationStatus === "approved".

export const MENTOR_TYPES = [
  { value: "phd_student", label: "PhD Student", plural: "PhD students", blurb: "Currently enrolled in a PhD program" },
  { value: "phd_graduate", label: "PhD Holder", plural: "PhD holders", blurb: "You hold a PhD" },
  { value: "postdoc", label: "Postdoc", plural: "Postdocs", blurb: "Postdoctoral researcher" },
  { value: "faculty", label: "Faculty", plural: "Faculty members", blurb: "Professor or research faculty" },
  { value: "industry", label: "Industry Researcher", plural: "Industry researchers with a PhD", blurb: "Researcher in industry, with a PhD" },
];

export function mentorTypeLabel(value) {
  return MENTOR_TYPES.find((t) => t.value === value)?.label || value;
}

export const VERIFICATION_STATUS = {
  started: { label: "Application started", color: "#92400e", bg: "rgba(217,119,6,0.08)" },
  submitted: { label: "In review", color: "#111111", bg: "#e3eff3" },
  changes_requested: { label: "Changes requested", color: "#a01f13", bg: "rgba(160,31,19,0.08)" },
  interview_requested: { label: "Interview requested", color: "#111111", bg: "#fff8dc" },
  onboarding: { label: "Onboarding", color: "#1f6f4a", bg: "#f0fdf4" },
  approved: { label: "Live", color: "#14532d", bg: "rgba(22,101,52,0.08)" },
  declined: { label: "Declined", color: "#64748b", bg: "#f1f5f9" },
};

export function statusInfo(status) {
  return VERIFICATION_STATUS[status] || VERIFICATION_STATUS.started;
}

// The timeline a mentor sees, in order. Interview/changes are detours of
// "In review", shown there rather than as separate steps.
export const APPLICATION_STAGES = [
  { key: "started", label: "Application" },
  { key: "submitted", label: "In review" },
  { key: "onboarding", label: "Onboarding" },
  { key: "approved", label: "Live" },
];

export function stageIndex(status) {
  if (status === "changes_requested") return 0;
  if (status === "interview_requested") return 1;
  const i = APPLICATION_STAGES.findIndex((s) => s.key === status);
  return i === -1 ? 0 : i;
}
