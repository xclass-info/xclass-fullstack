// Shared inline styles for the admin dashboard sections.

export const card = {
  background: "white",
  borderRadius: 12,
  border: "1px solid #eee",
  padding: 20,
};

export const sectionTitle = { margin: "0 0 12px", fontSize: 16 };

export const smallBtn = (color, outline = false) => ({
  padding: "6px 12px",
  borderRadius: 8,
  border: outline ? `1px solid ${color}` : "none",
  background: outline ? "white" : color,
  color: outline ? color : "white",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
});

export const input = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #ddd",
  fontSize: 13,
  fontFamily: "inherit",
  boxSizing: "border-box",
};

export const chip = (color, bg) => ({
  display: "inline-block",
  fontSize: 11,
  fontWeight: 700,
  padding: "2px 8px",
  borderRadius: 20,
  color,
  background: bg,
  whiteSpace: "nowrap",
});
