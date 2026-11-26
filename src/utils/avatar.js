// Deterministic "initials avatar" for mentors without a real uploaded
// photo - a colored circle with their initials, same visual language as
// the testimonial author avatars. Replaces the earlier illustrated
// DiceBear placeholders, which looked too much like fake stock photos.
const GRADIENTS = [
  "linear-gradient(135deg, #2e5a43, #3f7258)",
  "linear-gradient(135deg, #b4502f, #c76a45)",
  "linear-gradient(135deg, #6b7f3a, #84984d)",
  "linear-gradient(135deg, #8a5a3c, #a3714f)",
  "linear-gradient(135deg, #3f6d6b, #528582)",
  "linear-gradient(135deg, #5e4a6b, #765f84)",
];

export function getInitials(name) {
  if (!name) return "?";
  const words = name
    .replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function avatarGradient(seed) {
  const str = String(seed || "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return GRADIENTS[hash % GRADIENTS.length];
}
