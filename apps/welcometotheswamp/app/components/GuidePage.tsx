import Link from "next/link";
import { IntentRouter } from "@/app/components/IntentRouter";
import { INTENT_LABELS, type PageIntent, type RouteOption } from "@/lib/routing";

type Highlight = {
  title: string;
  body: string;
};

type ChecklistItem = {
  label: string;
  detail: string;
};

export function GuidePage({
  eyebrow,
  title,
  summary,
  highlights,
  checklist,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  pageIntent,
  routerTitle,
  routerSummary,
  routerOptions,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  highlights: readonly Highlight[];
  checklist: readonly ChecklistItem[];
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  pageIntent: PageIntent;
  routerTitle: string;
  routerSummary: string;
  routerOptions: readonly RouteOption[];
}) {
  return (
    <main className="page-stack" data-page-intent={pageIntent}>
      <section className="hero-card hero-guide">
        <div className="router-head">
          <p className="eyebrow">{eyebrow}</p>
          <div className="intent-pill">Intent: {INTENT_LABELS[pageIntent]}</div>
        </div>
        <h1>{title}</h1>
        <p className="lede">{summary}</p>
        <div className="cta-row">
          <Link href={primaryHref} className="button">
            {primaryLabel}
          </Link>
          <Link href={secondaryHref} className="button-secondary">
            {secondaryLabel}
          </Link>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel">
          <p className="eyebrow">Key ideas</p>
          <div className="stack-list">
            {highlights.map((item) => (
              <article key={item.title} className="info-card">
                <h2>{item.title}</h2>
                <p className="muted">{item.body}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="panel">
          <p className="eyebrow">What to keep in mind</p>
          <div className="checklist">
            {checklist.map((item) => (
              <div key={item.label} className="check-item">
                <strong>{item.label}</strong>
                <span>{item.detail}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <IntentRouter
        intent={pageIntent}
        title={routerTitle}
        summary={routerSummary}
        options={routerOptions}
      />
    </main>
  );
}
