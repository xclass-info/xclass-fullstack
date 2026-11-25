// src/components/ResearchListing.jsx
// Public Research page - the shared ProgramListing with research wording.
import ProgramListing from "./ProgramListing";

const CONFIG = {
  endpoint: "/research?status=published",
  title: "Research.",
  sub: "Real research questions from our PhD mentors. Pick one you care about and see it through to a finished paper or presentation.",
  noun: "research topic",
  nounPlural: "research topics",
  detailPath: "/research",
  searchText: (r) => `${r.title} ${r.idea || ""} ${r.impact || ""}`,
  fields: [
    { label: "Idea", key: "idea", lines: 3 },
    { label: "Impact", key: "impact", lines: 2 },
  ],
  showSeats: false,
};

export default function ResearchListing() {
  return <ProgramListing config={CONFIG} />;
}
