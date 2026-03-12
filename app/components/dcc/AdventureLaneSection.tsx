import { buildViatorSearchLink } from "@/utils/affiliateLinks";
import type { CityAdventureLaneConfig } from "@/src/data/city-adventure-lanes";

type AdventureLaneSectionProps = {
  config: CityAdventureLaneConfig;
};

export default function AdventureLaneSection({ config }: AdventureLaneSectionProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 shadow-[0_16px_50px_rgba(0,0,0,0.35)]">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Adventure Categories</p>
        <h2 className="text-2xl font-bold md:text-3xl">{config.sectionTitle}</h2>
        <p className="max-w-3xl text-zinc-300">{config.sectionDescription}</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {config.categories.map((item) => (
          <article
            key={`${config.cityKey}-${item.query}`}
            className="rounded-2xl border border-white/10 bg-black/20 p-5"
          >
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="text-sm text-zinc-300">{item.description}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Query lane: {item.query}
              </p>
              <a
                href={buildViatorSearchLink(item.query)}
                target="_blank"
                rel="noopener noreferrer sponsored nofollow"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-600 px-4 py-3 font-semibold text-white hover:bg-cyan-500"
              >
                {item.ctaLabel}
              </a>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-5 text-xs text-zinc-500">
        DCC may earn a commission if you book through these Viator links, at no extra cost to you.
      </p>
    </section>
  );
}
