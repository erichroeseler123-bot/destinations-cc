import Link from "next/link";

type DecisionLink = { href: string; label: string; note?: string };
type DecisionSection = { title: string; body: string; links?: DecisionLink[] };

export function VegasDecisionPage({
  eyebrow,
  title,
  lead,
  verdict,
  sections,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  verdict: string;
  sections: DecisionSection[];
}) {
  return (
    <main>
      <section className="panel">
        <div className="eyebrow">{eyebrow}</div>
        <div style={{ height: 10 }} />
        <h1 className="detail-title">{title}</h1>
        <p className="lead">{lead}</p>
        <div style={{ height: 18 }} />
        <div className="card">
          <div className="eyebrow">Fast answer</div>
          <h2>{verdict}</h2>
        </div>
      </section>

      <section className="panel panel-tight">
        <div className="grid">
          {sections.map((section) => (
            <article className="card" key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
              {section.links?.length ? (
                <div className="footer-links">
                  {section.links.map((link) => (
                    <Link href={link.href} key={link.href}>
                      {link.label}{link.note ? ` — ${link.note}` : ""}
                    </Link>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="panel panel-tight">
        <div className="eyebrow">Keep deciding</div>
        <div className="footer-links">
          <Link href="/tonight">What should I do tonight?</Link>
          <Link href="/worth-it">What is actually worth it?</Link>
          <Link href="/under-100">Vegas under $100</Link>
          <Link href="/free-things">Free Vegas</Link>
          <Link href="/tours">Leave the Strip once</Link>
        </div>
      </section>
    </main>
  );
}
