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
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-bold">Live Shows, Festivals, and Venue Intelligence</h2>
      <p className="mt-2 text-zinc-300">
        This layer is built for high-volume event coverage across casinos, venues, concerts, and festivals.
        As SeatGeek and Ticketmaster inventories expand, these routes stay stable for both SEO and conversion.
      </p>
      {liveStatus ? <p className="mt-2 text-sm text-cyan-300">{liveStatus}</p> : null}

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
          Open Event Discovery Lane
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
                className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-200"
              >
                <div className="space-y-2">
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
            <div key={venue} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-200">
              {venue}
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
              className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-200 hover:bg-white/10"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">Festival and Seasonal Anchors</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {festivals.map((fest) => (
            <div key={fest} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-200">
              {fest}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
