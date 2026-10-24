// src/components/admin/AdminEmailLog.jsx
// Every email the site has tried to send, newest first, with failures
// highlighted. To resend, open the person (their side panel has the resend
// actions). Backend: GET /api/admin/emails.
import { useEffect, useState } from "react";
import { api, live } from "../../api";
import { card, chip, input, smallBtn } from "./adminStyles";

const STATUS = {
  sent: { label: "Sent", style: chip("#14532d", "rgba(22,101,52,0.08)") },
  failed: { label: "Failed", style: chip("#a01f13", "rgba(160,31,19,0.08)") },
  suppressed: { label: "Not sent (email off)", style: chip("#64748b", "#f1f5f9") },
};

function when(value) {
  return value ? new Date(value).toLocaleString() : "";
}

export default function AdminEmailLog({ onFindPerson }) {
  const [rows, setRows] = useState(null);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (search.trim()) params.set("q", search.trim());
    return live(() => api.get(`/admin/emails?${params}`), setRows);
  }, [status, search]);

  return (
    <div>
      <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 14px" }}>
        "Sent" means Gmail accepted the email. If someone still can't find it, ask them to check Spam - or open their profile to resend it or mark their email verified.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={input}>
          <option value=''>All statuses</option>
          <option value='sent'>Sent</option>
          <option value='failed'>Failed</option>
          <option value='suppressed'>Not sent (email off)</option>
        </select>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Search recipient or subject...' style={{ ...input, flex: "1 1 240px", maxWidth: 360 }} />
      </div>

      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        {!rows ? (
          <p style={{ color: "#94a3b8", padding: 20, margin: 0 }}>Loading...</p>
        ) : rows.length === 0 ? (
          <p style={{ color: "#94a3b8", padding: 20, margin: 0 }}>No emails yet.</p>
        ) : (
          rows.map((e, i) => (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 16px", borderTop: i ? "1px solid #f1f5f9" : "none", alignItems: "center", flexWrap: "wrap", background: e.status === "failed" ? "#fffafa" : "white" }}>
              <div style={{ minWidth: 0, flex: "1 1 300px" }}>
                <span style={STATUS[e.status]?.style}>{STATUS[e.status]?.label || e.status}</span>{" "}
                <strong style={{ fontSize: 14 }}>{e.subject}</strong>
                <div style={{ fontSize: 13, color: "#64748b", wordBreak: "break-all" }}>
                  to {e.toEmail} · {when(e.createdAt)}
                </div>
                {e.error && <div style={{ fontSize: 12, color: "#a01f13", marginTop: 4 }}>{e.error}</div>}
              </div>
              <button style={smallBtn("#2f6175", true)} onClick={() => onFindPerson(e.toEmail)}>Find person</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
