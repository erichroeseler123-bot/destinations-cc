import { buildCityTrackedHref } from "@/src/lib/city-analytics";
import { buildViatorSearchLink } from "@/utils/affiliateLinks";
import type { NewOrleansFestival } from "@/src/data/new-orleans-festivals";

type NewOrleansFestivalSectionProps = {
  festivals: NewOrleansFestival[];
};

export default function NewOrleansFestivalSection({
  festivals,
}: NewOrleansFestivalSectionProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">
          Major New Orleans Festivals and Events 2026
        </p>
        <h2 className="mt-2 text-2xl font-bold">Festival calendar and tourism pressure windows</h2>
        <p className="mt-2 text-zinc-300">
          Mardi Gras is fixed on Tuesday, February 17, 2026. Other 2026 entries below are marked
          as expected unless official organizers have finalized them. Use them for planning signal,
          not as the last word on exact schedules.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {festivals.map((festival) => (
          <article
            key={festival.slug}
            className="rounded-2xl border border-white/10 bg-black/20 p-5"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-semibold text-white">{festival.name}</h3>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.16em] ${
                      festival.status === "confirmed"
                        ? "border border-emerald-400/30 text-emerald-200"
                        : "border border-amber-400/30 text-amber-200"
                    }`}
                  >
                    {festival.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-300">{festival.dateNote}</p>
                <p className="mt-1 text-sm text-zinc-400">{festival.location}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href={buildViatorSearchLink(festival.viatorQuery)}
                  target="_blank"
                  rel="noopener noreferrer sponsored nofollow"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200"
                >
                  Book related tours
                </a>
                <a
                  href={buildCityTrackedHref({
                    href: `/new-orleans/shows?q=${encodeURIComponent(festival.name)}`,
                    city: "new-orleans",
                    lane: "events",
                    sourceSection: "city_events_intent",
                    intentQuery: festival.name,
                  })}
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-white/10"
                >
                  Open festival lane
                </a>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Why it matters</p>
                <p className="mt-2 text-sm text-zinc-300">{festival.summary}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Demand impact</p>
                <p className="mt-2 text-sm text-zinc-300">{festival.demandImpact}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Cruise and port note</p>
                <p className="mt-2 text-sm text-zinc-300">{festival.cruisePortNote}</p>
              </div>
            </div>

            {festival.officialUrl ? (
              <div className="mt-4">
                <a
                  href={festival.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-cyan-300 hover:text-cyan-200"
                >
                  Official event site →
                </a>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
