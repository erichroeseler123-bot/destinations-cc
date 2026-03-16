import Link from "next/link";

type EntityCard = {
  slug: string;
  name: string;
  summary: string;
  primaryHref: string;
  chips: string[];
  image?: { src: string; alt: string };
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
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
      <div className="max-w-3xl">
        <h2 className="text-3xl font-black tracking-tight">{title}</h2>
        <p className="mt-3 text-zinc-300">{intro}</p>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
        <div className="flex flex-wrap items-center gap-3 text-zinc-300">
          <span className="font-medium text-white">{entities.length} places to browse</span>
          <span className="text-zinc-500">•</span>
          <span>Follow nearby guides and next-step paths</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {entities.map((entity) => (
          <article key={entity.slug} className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/20 transition-colors hover:bg-white/[0.08]">
            {entity.image ? (
              <div className="overflow-hidden border-b border-white/10 bg-black/30">
                <img src={entity.image.src} alt={entity.image.alt} className="h-44 w-full object-cover" loading="lazy" />
              </div>
            ) : null}
            <div className="p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Las Vegas guide</p>
            <h3 className="mt-2 text-xl font-bold">{entity.name}</h3>
            <p className="mt-3 text-sm text-zinc-300">{entity.summary}</p>

            <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-zinc-400">
              {entity.chips.map((chip) => (
                <span key={chip} className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
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
                    aria-label={`${link.label} related to ${entity.name}`}
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
                aria-label={`View ${entity.name} details`}
              >
                Open guide
              </Link>
            </div>
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
            aria-label={link.label}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
