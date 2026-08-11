import Link from "next/link";

export type DellsDecisionSection = { title: string; body: string };

export default function DellsDecisionPage({
  eyebrow,
  title,
  intro,
  sections,
  ctaHref,
  ctaLabel,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: DellsDecisionSection[];
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <main>
      <section className="section-shell">
        <div className="section-heading">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{intro}</p>
        </div>
        <div className="action-grid">
          {sections.map((section) => (
            <article className="action-card" key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </article>
          ))}
        </div>
        <div className="hero-actions" style={{ marginTop: 24 }}>
          {ctaHref && ctaLabel ? <Link className="primary-button" href={ctaHref}>{ctaLabel}</Link> : null}
          <Link className="secondary-button" href="/">Back to Dells planner</Link>
        </div>
      </section>
    </main>
  );
}
