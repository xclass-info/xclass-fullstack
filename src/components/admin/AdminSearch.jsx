// src/components/admin/AdminSearch.jsx
// The search box at the top of the admin dashboard: finds people (by name or
// email) and research posts / projects (by title). Backend: GET /api/admin/search.
import { useEffect, useRef, useState } from "react";
import { api } from "../../api";
import { input } from "./adminStyles";

export default function AdminSearch({ onOpenPerson, onOpenContent, value, onChange }) {
  const [results, setResults] = useState(null);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setResults(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      api
        .get(`/admin/search?q=${encodeURIComponent(q)}`)
        .then((r) => !cancelled && setResults(r))
        .catch(() => {});
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value]);

  useEffect(() => {
    const close = (e) => boxRef.current && !boxRef.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const pick = (fn) => {
    setOpen(false);
    onChange("");
    fn();
  };

  const empty = results && !results.people.length && !results.research.length && !results.projects.length;
  const row = { display: "block", width: "100%", textAlign: "left", padding: "8px 12px", border: "none", background: "white", cursor: "pointer", fontSize: 13 };
  const group = { fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", padding: "8px 12px 2px", margin: 0 };

  return (
    <div ref={boxRef} style={{ position: "relative", flex: "1 1 260px", maxWidth: 420 }}>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder='🔍 Search people, research, projects...'
        style={{ ...input, width: "100%", padding: "10px 14px", fontSize: 14 }}
      />
      {open && results && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "white", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 120, maxHeight: 380, overflowY: "auto" }}>
          {empty && <p style={{ ...row, color: "#94a3b8", margin: 0 }}>No matches.</p>}
          {results.people.length > 0 && <p style={group}>People</p>}
          {results.people.map((p) => (
            <button key={p.id} style={row} onClick={() => pick(() => onOpenPerson(p.id))}>
              <strong>{p.name || "(no name)"}</strong> <span style={{ color: "#64748b" }}>{p.email}</span>
              {p.deletedAt && <span style={{ color: "#a01f13" }}> · deleted</span>}
            </button>
          ))}
          {results.research.length > 0 && <p style={group}>Research</p>}
          {results.research.map((r) => (
            <button key={r.id} style={row} onClick={() => pick(() => onOpenContent("research", r))}>
              {r.title} <span style={{ color: "#64748b" }}>· {r.teacherName}</span>
            </button>
          ))}
          {results.projects.length > 0 && <p style={group}>Projects</p>}
          {results.projects.map((r) => (
            <button key={r.id} style={row} onClick={() => pick(() => onOpenContent("project", r))}>
              {r.title} <span style={{ color: "#64748b" }}>· {r.teacherName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
