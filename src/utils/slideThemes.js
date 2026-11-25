// Visual variety for InfoSlide (research/project detail pages): each post
// deterministically gets one of these themes from its id, so a given post
// always looks the same on repeat visits, but browsing between different
// posts doesn't feel like the same box over and over. All five are built
// from colors already in the site's palette (index.css's --primary/
// --accent/--mint/--purple/--pink tokens, just darkened for a slide
// background) rather than inventing new hues.

const THEMES = [
  {
    name: "teal",
    gradient: "linear-gradient(135deg, #111111, #2f6175)",
    eyebrow: "#e8c468",
    accent: "#9fe0cf",
    tagline: "#c9b8e8",
    iconColor: "#e8c468",
  },
  {
    name: "gold",
    gradient: "linear-gradient(135deg, #4a3a1f, #8a6a25)",
    eyebrow: "#9fe0cf",
    accent: "#f0d896",
    tagline: "#bcdedb",
    iconColor: "#9fe0cf",
  },
  {
    name: "forest",
    gradient: "linear-gradient(135deg, #16331f, #1f6f4a)",
    eyebrow: "#f0d896",
    accent: "#a8e0c4",
    tagline: "#f0d896",
    iconColor: "#f0d896",
  },
  {
    name: "plum",
    gradient: "linear-gradient(135deg, #2e1a30, #6d3f6b)",
    eyebrow: "#f0d896",
    accent: "#e0b8da",
    tagline: "#9fe0cf",
    iconColor: "#f0d896",
  },
  {
    name: "slate",
    gradient: "linear-gradient(135deg, #1a2733, #3a5a6e)",
    eyebrow: "#e8c468",
    accent: "#bcdedb",
    tagline: "#e0b8da",
    iconColor: "#e8c468",
  },
];

function hashSeed(seed) {
  const s = String(seed || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function pickTheme(seed) {
  return THEMES[hashSeed(seed) % THEMES.length];
}
