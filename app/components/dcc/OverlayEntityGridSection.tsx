import Link from "next/link";
import type { DccEntityRegistryNode } from "@/src/data/entities-registry";

type Props = {
  eyebrow: string;
  title: string;
  intro: string;
  entities: DccEntityRegistryNode[];
};

export default function OverlayEntityGridSection({ eyebrow, title, intro, entities }: Props) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
      <div className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight">{title}</h2>
        <p className="mt-3 text-zinc-200">{intro}</p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {entities.map((entity) => (
          <Link
            key={`${entity.entityType}-${entity.slug}`}
            href={entity.canonicalPath}
            className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/25 hover:bg-white/10"
          >
            {entity.imageSet?.card ? (
              <div className="aspect-[4/3] overflow-hidden border-b border-white/10">
                <img
                  src={entity.imageSet.card.src}
                  alt={entity.imageSet.card.alt}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : null}
            <div className="space-y-3 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                {entity.citySlug.replace(/-/g, " ")} · {entity.entityType.replace(/-/g, " ")}
              </p>
              <h3 className="text-lg font-semibold text-white">{entity.title}</h3>
              <p className="text-sm text-zinc-300">{entity.summary}</p>
              <div className="flex flex-wrap gap-2">
                {entity.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-zinc-300"
                  >
                    {tag.replace(/-/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
