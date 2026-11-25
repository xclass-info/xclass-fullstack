// src/components/ProjectDetail.jsx
// One project - the shared ProgramDetail with project wording.
import ProgramDetail from "./ProgramDetail";

const CONFIG = {
  kind: "project",
  param: "projectId",
  endpoint: "/projects",
  isPublic: () => true,
  label: "Project",
  listPath: "/projects",
  listLabel: "All projects",
  sections: [
    { label: "Project description", key: "description", lead: true },
    { label: "What you'll learn", key: "learning" },
  ],
};

export default function ProjectDetail() {
  return <ProgramDetail config={CONFIG} />;
}
