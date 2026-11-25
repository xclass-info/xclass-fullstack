// src/components/InitialsAvatar.jsx
import { getInitials, avatarGradient } from "../utils/avatar";

export default function InitialsAvatar({
  name,
  seed,
  className,
  style = {},
  fontSize,
}) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: avatarGradient(seed ?? name),
        color: "#fff",
        fontFamily: "var(--font-display)",
        fontWeight: 600,
        fontSize: fontSize ?? "1.4rem",
        flexShrink: 0,
        ...style,
      }}
    >
      {getInitials(name)}
    </div>
  );
}
