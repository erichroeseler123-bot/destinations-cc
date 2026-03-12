import Link from "next/link";

type EntityCard = {
  slug: string;
  name: string;
  summary: string;
  primaryHref: string;
  chips: string[];
  nearbyLinks: Array<{ href: string; label: string }>;
};

export default function VegasEntityGridSection({
  title,
  intro,
  entities,
  backLinks,
}: {
  title: string;
  intro: string;
  entities: EntityCard[];
  backLinks: Array<{ href: string; label: string }>;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="max-w-3xl">
        <h2 className="text-3xl font-black tracking-tight">{title}</h2>
        <p className="mt-3 text-zinc-300">{intro}</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {entities.map((entity) => (
          <article key={entity.slug} className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <h3 className="text-xl font-bold">{entity.name}</h3>
            <p className="mt-3 text-sm text-zinc-300">{entity.summary}</p>

            <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-zinc-400">
              {entity.chips.map((chip) => (
                <span key={chip} className="rounded-full border border-white/10 px-2 py-1">
                  {chip}
                </span>
              ))}
            </div>

            <div className="mt-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Connects to</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {entity.nearbyLinks.map((link) => (
                  <Link
                    key={`${entity.slug}-${link.href}`}
                    href={link.href}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-200 hover:bg-white/10"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <Link
                href={entity.primaryHref}
                className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-100 hover:bg-white/10"
              >
                Open linked node
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {backLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
