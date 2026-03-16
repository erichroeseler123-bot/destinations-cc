import Link from "next/link";
import { buildCityTrackedHref } from "@/src/lib/city-analytics";

export type LiveEventQuery = {
  label: string;
  query: string;
};

export type CityLiveEventsSectionProps = {
  citySlug: string;
  cityName: string;
  venues: string[];
  ticketQueries: LiveEventQuery[];
  festivals: string[];
  featuredEvents?: Array<{
    id: string;
    name: string;
    startDate: string | null;
    url: string | null;
    venueName: string | null;
  }>;
  liveStatus?: string | null;
};

export default function CityLiveEventsSection({
  citySlug,
  cityName,
  venues,
  ticketQueries,
  festivals,
  featuredEvents = [],
  liveStatus = null,
}: CityLiveEventsSectionProps) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
      <div className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Live Shows</p>
        <h2 className="mt-2 text-2xl font-bold md:text-3xl">What to watch for across {cityName}</h2>
        <p className="mt-3 text-zinc-300">
          Track headline shows, venue clusters, and seasonal event patterns in {cityName}, then jump into the live event pages that matter most for your plans.
        </p>
      </div>
      {liveStatus ? <p className="mt-2 text-sm text-cyan-300">{liveStatus}</p> : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
        <div className="flex flex-wrap items-center gap-3 text-zinc-300">
          <span className="font-medium text-white">{featuredEvents.length || ticketQueries.length} current browse paths</span>
          <span className="text-zinc-500">•</span>
          <span>{venues.length} venues in this surface</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-zinc-400">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Shows</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Festivals</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Venue guides</span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Link
          href={buildCityTrackedHref({
            href: `/${citySlug}/shows`,
            city: citySlug,
            lane: "events",
            sourceSection: "city_events_primary",
          })}
          data-dcc-city={citySlug}
          data-dcc-lane="events"
          data-dcc-source-section="city_events_primary"
          className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 font-semibold text-black hover:bg-zinc-200"
        >
          Browse {cityName} Shows
        </Link>
        <Link
          href={buildCityTrackedHref({
            href: `/tours?city=${encodeURIComponent(citySlug)}&q=${encodeURIComponent(`${cityName} events`)}`,
            city: citySlug,
            lane: "events",
            sourceSection: "city_events_secondary",
            intentQuery: `${cityName} events`,
          })}
          data-dcc-city={citySlug}
          data-dcc-lane="events"
          data-dcc-source-section="city_events_secondary"
          data-dcc-intent-query={`${cityName} events`}
          className="inline-flex items-center justify-center rounded-xl border border-white/15 px-5 py-3 font-semibold text-zinc-200 hover:bg-white/10"
        >
          Explore Event Options
        </Link>
      </div>

      {featuredEvents.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Featured Live Events
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {featuredEvents.map((event) => (
              <article
                key={event.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-200 transition-colors hover:bg-white/[0.08]"
              >
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Featured event</p>
                  <h4 className="font-semibold text-white">{event.name}</h4>
                  <p className="text-zinc-400">
                    {[event.startDate, event.venueName].filter(Boolean).join(" • ") || "Live event"}
                  </p>
                  {event.url ? (
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer sponsored nofollow"
                      className="inline-flex items-center text-cyan-300 hover:text-cyan-200"
                    >
                      View event →
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">Venue Clusters</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((venue) => (
            <div key={venue} className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-zinc-200">
              <p className="font-medium text-white">{venue}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-zinc-500">Browse venue context</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">High-Intent Event Queries</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ticketQueries.map((item) => (
            <Link
              key={item.query}
              href={buildCityTrackedHref({
                href: `/${citySlug}/shows?q=${encodeURIComponent(item.query)}`,
                city: citySlug,
                lane: "events",
                sourceSection: "city_events_intent",
                intentQuery: item.query,
              })}
              data-dcc-city={citySlug}
              data-dcc-lane="events"
              data-dcc-source-section="city_events_intent"
              data-dcc-intent-query={item.query}
              className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-200 transition-colors hover:bg-white/[0.08]"
            >
              <p className="font-medium text-white">{item.label}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-zinc-500">Open show search</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">Festival and Seasonal Anchors</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {festivals.map((fest) => (
            <div key={fest} className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-zinc-200">
              <p className="font-medium text-white">{fest}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-zinc-500">Seasonal planning anchor</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
