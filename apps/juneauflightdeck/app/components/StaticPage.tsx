import Link from "next/link";

export default function StaticPage({
  eyebrow,
  title,
  intro,
  bullets = [],
  ctaHref = "/",
  ctaLabel = "Plan your Juneau day",
}: {
  eyebrow: string;
  title: string;
  intro: string;
  bullets?: string[];
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <main className="page-shell static-page-shell">
      <section className="static-page-card">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="static-page-title">{title}</h1>
        <p className="chooser-trust-line">{intro}</p>
        {bullets.length > 0 ? (
          <ul className="static-page-bullets">
            {bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        ) : null}
        <p>
          <Link href={ctaHref} className="primary-cta">
            {ctaLabel}
          </Link>
        </p>
      </section>
    </main>
  );
}
