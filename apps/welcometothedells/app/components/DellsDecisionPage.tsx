import Link from "next/link";

export type DellsDecisionSection = {
  title: string;
  body: string;
  href?: string;
  cta?: string;
};

export const DECISION_GUIDE_LINKS = [
  {
    href: "/first-time",
    label: "First-time guide",
    matchEyebrows: ["wisconsin dells first-time visitor guide", "first-time", "first time"],
  },
  {
    href: "/rainy-day",
    label: "Rainy day",
    matchEyebrows: ["rainy day"],
  },
  {
    href: "/families",
    label: "Families",
    matchEyebrows: ["families"],
  },
  {
    href: "/adults",
    label: "Adults only",
    matchEyebrows: ["adults only"],
  },
  {
    href: "/tonight",
    label: "Tonight",
    matchEyebrows: ["tonight"],
  },
  {
    href: "/large-groups",
    label: "Large groups",
    matchEyebrows: ["large groups"],
  },
  {
    href: "/downtown",
    label: "Downtown",
    matchEyebrows: ["downtown"],
  },
  {
    href: "/parkway",
    label: "The Parkway",
    matchEyebrows: ["the parkway", "parkway"],
  },
  {
    href: "/lake-delton",
    label: "Lake Delton",
    matchEyebrows: ["lake delton"],
  },
] as const;

export function resolveDecisionGuidePath(eyebrow: string, currentPath?: string): string {
  if (currentPath) {
    return currentPath;
  }
  const normalized = eyebrow.trim().toLowerCase();
  const matched = DECISION_GUIDE_LINKS.find((item) =>
    item.matchEyebrows.some((candidate) => candidate === normalized),
  );
  return matched?.href ?? "/things-to-do";
}

export default function DellsDecisionPage({
  eyebrow,
  title,
  intro,
  sections,
  ctaHref,
  ctaLabel,
  currentPath,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: DellsDecisionSection[];
  ctaHref?: string;
  ctaLabel?: string;
  currentPath?: string;
}) {
  const activePath = resolveDecisionGuidePath(eyebrow, currentPath);

  return (
    <main style={{ maxWidth: "100%", overflowX: "hidden" }}>
      <section
        className="section-shell"
        style={{ minWidth: 0, maxWidth: "100%", boxSizing: "border-box" }}
      >
        <nav
          aria-label="Breadcrumb"
          className="decision-breadcrumb"
          style={{
            marginBottom: 16,
            maxWidth: "100%",
            minWidth: 0,
            boxSizing: "border-box",
          }}
        >
          <ol
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "6px 10px",
              listStyle: "none",
              margin: 0,
              padding: 0,
              fontSize: "0.84rem",
              color: "var(--muted)",
              maxWidth: "100%",
              minWidth: 0,
            }}
          >
            <li style={{ minWidth: 0, maxWidth: "100%" }}>
              <Link href="/" style={{ overflowWrap: "break-word" }}>
                Welcome to the Dells
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li style={{ minWidth: 0, maxWidth: "100%" }}>
              <Link href="/things-to-do" style={{ overflowWrap: "break-word" }}>
                Things to do
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li style={{ minWidth: 0, maxWidth: "100%" }}>
              <Link
                href={activePath}
                aria-current="page"
                style={{
                  color: "var(--sandstone)",
                  fontWeight: 800,
                  overflowWrap: "break-word",
                }}
              >
                {eyebrow}
              </Link>
            </li>
          </ol>
        </nav>

        <div className="section-heading" style={{ minWidth: 0, maxWidth: "100%" }}>
          <p className="eyebrow" style={{ overflowWrap: "break-word" }}>
            {eyebrow}
          </p>
          <h1
            style={{
              fontSize: "clamp(2rem, 7vw, 6.4rem)",
              overflowWrap: "break-word",
            }}
          >
            {title}
          </h1>
          <p style={{ overflowWrap: "break-word" }}>{intro}</p>
        </div>

        <div className="action-grid" style={{ minWidth: 0, maxWidth: "100%" }}>
          {sections.map((section) => (
            <article
              className="action-card"
              key={section.title}
              style={{
                minWidth: 0,
                maxWidth: "100%",
                boxSizing: "border-box",
                justifyContent: "space-between",
              }}
            >
              <div style={{ minWidth: 0, maxWidth: "100%" }}>
                <h2
                  style={{
                    fontSize: "clamp(1.45rem, 4vw, 2.4rem)",
                    overflowWrap: "break-word",
                  }}
                >
                  {section.title}
                </h2>
                <p style={{ overflowWrap: "break-word" }}>{section.body}</p>
              </div>
              {section.href && section.cta ? (
                <Link
                  className="text-button"
                  href={section.href}
                  style={{
                    maxWidth: "100%",
                    whiteSpace: "normal",
                    overflowWrap: "break-word",
                    textAlign: "center",
                    padding: "10px 16px",
                    boxSizing: "border-box",
                  }}
                >
                  {section.cta}
                </Link>
              ) : null}
            </article>
          ))}
        </div>

        <div
          className="hero-actions"
          style={{
            marginTop: 24,
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            maxWidth: "100%",
            minWidth: 0,
          }}
        >
          {ctaHref && ctaLabel ? (
            <Link
              className="primary-button"
              href={ctaHref}
              style={{
                maxWidth: "100%",
                whiteSpace: "normal",
                overflowWrap: "break-word",
                textAlign: "center",
                padding: "10px 18px",
                boxSizing: "border-box",
              }}
            >
              {ctaLabel}
            </Link>
          ) : null}
          <Link
            className="secondary-button"
            href="/"
            style={{
              maxWidth: "100%",
              whiteSpace: "normal",
              overflowWrap: "break-word",
              textAlign: "center",
              padding: "10px 18px",
              boxSizing: "border-box",
            }}
          >
            Back to Dells planner
          </Link>
        </div>

        <nav
          aria-label="Related decision guides"
          className="decision-related-nav"
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: "1px solid var(--line)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "6px 8px",
            maxWidth: "100%",
            minWidth: 0,
            boxSizing: "border-box",
          }}
        >
          <span
            style={{
              color: "var(--sandstone)",
              fontSize: 11,
              fontWeight: 800,
              textTransform: "uppercase",
              marginRight: 4,
            }}
          >
            Related guides:
          </span>
          {DECISION_GUIDE_LINKS.map((item) => {
            const isCurrent = item.href === activePath;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isCurrent ? "page" : undefined}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: 36,
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: isCurrent ? "1px solid var(--sandstone)" : "1px solid var(--line)",
                  background: isCurrent
                    ? "rgba(212, 154, 85, 0.16)"
                    : "rgba(255, 247, 234, 0.05)",
                  color: isCurrent ? "var(--paper)" : "var(--muted)",
                  fontSize: "0.82rem",
                  fontWeight: isCurrent ? 800 : 700,
                  maxWidth: "100%",
                  whiteSpace: "normal",
                  overflowWrap: "break-word",
                  textAlign: "center",
                  boxSizing: "border-box",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </section>
    </main>
  );
}
