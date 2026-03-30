import type { WtsEntryPage } from "./entryPageData";
import Link from "next/link";

function buildPlanHref(page: WtsEntryPage, override?: { subtype: string; context: string }) {
  const params = new URLSearchParams({
    intent: "compare",
    topic: "swamp-tours",
    subtype: override?.subtype || page.defaultSubtype,
    context: override?.context || page.defaultContext,
  });
  return "/plan?" + params.toString();
}

export default function EntryGuidePage({ page }: { page: WtsEntryPage }) {
  return (
    <main className="page-stack" data-page-intent="compare">
      <section className="hero-card hero-guide">
        <div className="router-head">
          <p className="eyebrow">{page.eyebrow}</p>
          <div className="intent-pill">Intent: Compare</div>
        </div>
        <h1>{page.title}</h1>
        <p className="lede">{page.summary}</p>
      </section>

      <section className="panel">
        <p className="eyebrow">Immediate confirmation</p>
        <article className="info-card">
          <p className="muted">{page.confirmText}</p>
        </article>
      </section>

      <section className="panel">
        <p className="eyebrow">Quick chooser</p>
        <div className="stack-list">
          {page.choices.map((choice) => (
            <Link
              key={choice.label}
              href={buildPlanHref(page, { subtype: choice.subtype, context: choice.context })}
              className="info-card no-underline"
            >
              <h2>{choice.label}</h2>
              <p className="muted">{choice.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Short comparison</p>
        <div className="stack-list">
          {page.comparisonRows.map((row) => (
            <article key={row.left + ':' + row.right} className="info-card">
              <div className="grid gap-3 md:grid-cols-2">
                <strong>{row.left}</strong>
                <strong>{row.right}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Next step</p>
        <article className="info-card">
          <h2>{page.ctaTitle}</h2>
          <p className="muted">{page.ctaBody}</p>
          <div className="cta-row">
            <Link href={buildPlanHref(page)} className="button">
              {page.ctaButtonLabel} {"->"}
            </Link>
            <Link href="/" className="button-secondary">
              Back to questions
            </Link>
          </div>
        </article>
      </section>

      <section className="panel">
        <p className="eyebrow">Reassurance</p>
        <article className="info-card">
          <p className="muted">No spammy lists. No overwhelm. Just a narrower shortlist that moves you toward the right booking decision.</p>
        </article>
      </section>
    </main>
  );
}
