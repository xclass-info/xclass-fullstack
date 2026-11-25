// A bold, presentation-style "slide" summary for a research/project detail
// page - synthesized entirely from the post's own fields (title,
// idea/description, impact/learning, deliverable, grade level, schedule),
// not a separate downloadable file. Sits above the detailed Idea/Impact/
// Schedule sections. Styled in the site's own teal/gold brand rather than
// an arbitrary new palette, so it doesn't reintroduce the kind of
// inconsistency the rest of the site was just cleaned up of.
import { pickIcon } from "../utils/topicIcons";
import { pickTheme } from "../utils/slideThemes";
import { locationLabel } from "../utils/schedule";
import { LESSON_STRUCTURE_LABEL } from "../utils/format";

const TAGLINE = "Real research. Real mentorship. Your curiosity leads.";

function MetaItem({ icon, children }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span>{icon}</span>
      {children}
    </span>
  );
}

export default function InfoSlide({ kind, item }) {
  const summary = kind === "research" ? item.idea : item.description;
  const secondary = kind === "research" ? item.impact : item.learning;
  const { Icon } = pickIcon(item.id);
  const theme = pickTheme(item.id);

  return (
    <div
      style={{
        background: theme.gradient,
        borderRadius: 20,
        padding: "36px 40px",
        marginBottom: 28,
        display: "flex",
        flexWrap: "wrap",
        gap: 32,
        alignItems: "center",
        color: "white",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ flex: "3 1 320px", minWidth: 0 }}>
        <p
          style={{
            margin: "0 0 10px",
            fontSize: 12,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: theme.eyebrow,
          }}
        >
          {kind === "research" ? "Student Research Project" : "Student Project"}
        </p>
        <h2
          style={{
            margin: "0 0 16px",
            fontFamily: "var(--font-display)",
            fontSize: "1.9rem",
            fontWeight: 800,
            lineHeight: 1.15,
          }}
        >
          {item.title}
        </h2>

        {summary && (
          <p
            style={{
              margin: "0 0 20px",
              fontSize: 15,
              lineHeight: 1.65,
              color: "rgba(255,255,255,0.85)",
              maxWidth: 560,
            }}
          >
            {summary}
          </p>
        )}

        {(secondary || item.deliverable) && (
          <>
            <p
              style={{
                margin: "0 0 10px",
                fontSize: 11,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: theme.accent,
              }}
            >
              What You'll Do
            </p>
            <ul
              style={{
                margin: "0 0 20px",
                padding: 0,
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {secondary && (
                <li
                  style={{
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "rgba(255,255,255,0.85)",
                    paddingLeft: 22,
                    position: "relative",
                  }}
                >
                  <span style={{ position: "absolute", left: 0, color: theme.accent }}>✓</span>
                  {secondary}
                </li>
              )}
              {item.deliverable && (
                <li
                  style={{
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "rgba(255,255,255,0.85)",
                    paddingLeft: 22,
                    position: "relative",
                  }}
                >
                  <span style={{ position: "absolute", left: 0, color: theme.accent }}>✓</span>
                  Produce a {item.deliverable}
                </li>
              )}
            </ul>
          </>
        )}

        <div
          style={{
            display: "flex",
            gap: 18,
            flexWrap: "wrap",
            fontSize: 12.5,
            color: "rgba(255,255,255,0.65)",
            marginBottom: 18,
          }}
        >
          {item.gradeLevel && <MetaItem icon='🎓'>{item.gradeLevel}</MetaItem>}
          <MetaItem icon='🕐'>{LESSON_STRUCTURE_LABEL}</MetaItem>
          {item.scheduleLocation && <span>{locationLabel(item.scheduleLocation)}</span>}
        </div>

        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 700,
            color: theme.tagline,
          }}
        >
          {TAGLINE}
        </p>
      </div>

      <div
        style={{
          flex: "1 1 140px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 140,
        }}
      >
        <div
          style={{
            width: 150,
            height: 150,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.iconColor,
          }}
        >
          <Icon size={72} />
        </div>
      </div>
    </div>
  );
}
