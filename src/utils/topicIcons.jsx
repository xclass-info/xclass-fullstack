// A small set of hand-drawn line icons (flask, atom, chart, lightbulb,
// rocket, book) used to give research/project cards some visual variety
// without photos - deterministic per item (same id always picks the same
// icon/color), not random, so a card doesn't visually "flicker" between
// re-renders.

function Flask({ size }) {
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8'>
      <path d='M10 3h4' strokeLinecap='round' />
      <path d='M10 3v5.5L5.5 17a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 8.5V3' strokeLinejoin='round' />
      <path d='M7.5 15h9' strokeLinecap='round' />
      <circle cx='10.5' cy='12' r='0.6' fill='currentColor' stroke='none' />
      <circle cx='13.5' cy='13' r='0.6' fill='currentColor' stroke='none' />
    </svg>
  );
}

function Atom({ size }) {
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8'>
      <circle cx='12' cy='12' r='1.6' fill='currentColor' stroke='none' />
      <ellipse cx='12' cy='12' rx='9' ry='3.6' />
      <ellipse cx='12' cy='12' rx='9' ry='3.6' transform='rotate(60 12 12)' />
      <ellipse cx='12' cy='12' rx='9' ry='3.6' transform='rotate(120 12 12)' />
    </svg>
  );
}

function Chart({ size }) {
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8'>
      <path d='M4 20V10M10 20V5M16 20v-7M20 20H4' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  );
}

function Lightbulb({ size }) {
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8'>
      <path d='M9 18h6M10 21h4' strokeLinecap='round' />
      <path d='M12 3a6.5 6.5 0 0 0-3.5 12c.5.35.5.9.5 1.5h6c0-.6 0-1.15.5-1.5A6.5 6.5 0 0 0 12 3Z' />
    </svg>
  );
}

function Rocket({ size }) {
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8'>
      <path d='M12 2c2.5 2 4 5.5 4 9.5 0 2-.5 4-1 5.5l-3 2-3-2c-.5-1.5-1-3.5-1-5.5C8 7.5 9.5 4 12 2Z' strokeLinejoin='round' />
      <path d='M9 15l-3 2 .8-3.4M15 15l3 2-.8-3.4' strokeLinejoin='round' strokeLinecap='round' />
      <circle cx='12' cy='10' r='1.4' />
    </svg>
  );
}

function Book({ size }) {
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8'>
      <path d='M4 5.5A2 2 0 0 1 6 4h6v16H6a2 2 0 0 1-2-2Z' strokeLinejoin='round' />
      <path d='M20 5.5A2 2 0 0 0 18 4h-6v16h6a2 2 0 0 0 2-2Z' strokeLinejoin='round' />
    </svg>
  );
}

const ICONS = [Flask, Atom, Chart, Lightbulb, Rocket, Book];

function hashSeed(seed) {
  const s = String(seed || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Same deterministic pick (icon + a teal/gold flag) that TopicIcon uses
// internally, exposed directly for callers that want to apply their own
// colors (e.g. a dark-background "slide" treatment) instead of the
// light-background pastel circle below.
export function pickIcon(seed) {
  const h = hashSeed(seed);
  return { Icon: ICONS[h % ICONS.length], teal: (h >> 3) % 2 === 0 };
}

// Topic badge: a colored circle with one of the line icons above, picked
// deterministically from `seed` (an item id/title - same input always
// gives the same icon+color). Alternates teal/gold so a grid of cards
// doesn't read as one flat color.
export function TopicIcon({ seed, size = 44 }) {
  const { Icon, teal } = pickIcon(seed);
  const bg = teal ? "var(--surface)" : "var(--lime)";
  const fg = "var(--ink)";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        color: fg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon size={Math.round(size * 0.5)} />
    </div>
  );
}
