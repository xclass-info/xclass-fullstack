// Deterministic "initials avatar" for mentors without a real uploaded
// photo - a colored circle with their initials, same visual language as
// the testimonial author avatars. Replaces the earlier illustrated
// DiceBear placeholders, which looked too much like fake stock photos.
const GRADIENTS = [
  "linear-gradient(135deg, #52654e, #67795f)",
  "linear-gradient(135deg, #8a7a5e, #a08f71)",
  "linear-gradient(135deg, #5d7466, #728a7b)",
  "linear-gradient(135deg, #7a6a58, #927f6a)",
  "linear-gradient(135deg, #4f6461, #657b77)",
  "linear-gradient(135deg, #6e6a55, #85806a)",
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
