// src/components/ResearchDetail.jsx
// One research topic - the shared ProgramDetail with research wording.
import ProgramDetail from "./ProgramDetail";

const CONFIG = {
  kind: "research",
  param: "researchId",
  endpoint: "/research",
  // Only published research is public, same as the listing page.
  isPublic: (r) => r.status === "published",
  label: "Research",
  listPath: "/research",
  listLabel: "All research",
  sections: [
    { label: "Research idea", key: "idea", lead: true },
    { label: "Why it matters", key: "impact" },
  ],
};

export default function ResearchDetail() {
  return <ProgramDetail config={CONFIG} />;
}
