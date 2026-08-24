import Link from "next/link";
import type { SitePage } from "@/lib/sitePages";

export default function StaticPage({ page }: { page: SitePage }) {
  return (
    <main className="site-shell static-page-shell">
      <section className="panel static-page-card">
        <p className="eyebrow">{page.title}</p>
        <h1 className="static-page-title">{page.headline}</h1>
        <p className="hero-copy" style={{ marginTop: 0, maxWidth: 760 }}>
          {page.description}
        </p>
        <p className="muted" style={{ maxWidth: 760 }}>
          {page.body}
        </p>
        {page.bullets?.length ? (
          <ul className="static-page-bullets">
            {page.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        ) : null}
        <div className="cta-row">
          <Link href={page.ctaHref} className="button">
            {page.ctaLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}
