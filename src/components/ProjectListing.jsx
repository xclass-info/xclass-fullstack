// src/components/ProjectListing.jsx
// Public Projects page - the shared ProgramListing with project wording.
import ProgramListing from "./ProgramListing";

const CONFIG = {
  endpoint: "/projects",
  title: "Projects.",
  sub: "Hands-on projects you build with a mentor, ending in something real you made.",
  noun: "project",
  nounPlural: "projects",
  detailPath: "/projects",
  searchText: (p) => `${p.title} ${p.description || ""} ${p.learning || ""}`,
  fields: [
    { label: "Description", key: "description", lines: 3 },
    { label: "What you'll learn", key: "learning", lines: 2 },
  ],
  showSeats: true,
};

export default function ProjectListing() {
  return <ProgramListing config={CONFIG} />;
}
