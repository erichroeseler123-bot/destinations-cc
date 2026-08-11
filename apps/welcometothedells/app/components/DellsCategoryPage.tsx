import Link from "next/link";

export type DellsCategoryItem = {
  title: string;
  body: string;
  href: string;
  cta: string;
};

export default function DellsCategoryPage({
  eyebrow,
  title,
  intro,
  items,
  note,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  items: DellsCategoryItem[];
  note?: string;
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
          {items.map((item) => (
            <article className="action-card" key={item.title}>
              <h2>{item.title}</h2>
              <p>{item.body}</p>
              <Link className="text-button" href={item.href}>{item.cta}</Link>
            </article>
          ))}
        </div>

        {note ? (
          <div className="support-band" style={{ marginTop: 28 }}>
            <div>
              <p className="eyebrow">Planning note</p>
              <p>{note}</p>
            </div>
          </div>
        ) : null}

        <div className="hero-actions" style={{ marginTop: 24 }}>
          <Link className="secondary-button" href="/">Back to the Dells planner</Link>
        </div>
      </section>
    </main>
  );
}
