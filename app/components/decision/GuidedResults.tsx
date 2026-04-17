import type { ReactNode } from "react";

type GuidedResultsProps = {
  eyebrow: string;
  title: string;
  description: string;
  primary: ReactNode;
  alternatives?: ReactNode;
  alternativesLabel?: string;
};

export default function GuidedResults({
  eyebrow,
  title,
  description,
  primary,
  alternatives,
  alternativesLabel = "Prefer a different pace?",
}: GuidedResultsProps) {
  return (
    <section
      style={{
        display: "grid",
        gap: 18,
      }}
    >
      <div style={{ display: "grid", gap: 8 }}>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            color: "#86efac",
          }}
        >
          {eyebrow}
        </p>
        <h2
          style={{
            margin: 0,
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
            lineHeight: 1,
            letterSpacing: "-0.04em",
            color: "white",
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: 0,
            maxWidth: 760,
            fontSize: 14,
            lineHeight: 1.5,
            color: "rgba(255,255,255,0.74)",
          }}
        >
          {description}
        </p>
      </div>

      <div>{primary}</div>

      {alternatives ? (
        <details
          style={{
            borderRadius: 24,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.04)",
            padding: "14px 16px",
          }}
        >
          <summary
            style={{
              cursor: "pointer",
              listStyle: "none",
              fontSize: 13,
              fontWeight: 700,
              color: "rgba(255,255,255,0.72)",
            }}
          >
            {alternativesLabel}
          </summary>
          <div style={{ marginTop: 14 }}>{alternatives}</div>
        </details>
      ) : null}
    </section>
  );
}
