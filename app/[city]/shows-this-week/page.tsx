import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import RideOptionsCard from "@/app/components/transportation/RideOptionsCard";
import aliases from "@/data/city-aliases.json";
import { ticketmasterAdapter } from "@/lib/dcc/providers/adapters/ticketmaster";
import {
  buildCityShowEventSlug,
  isEventWithinDays,
  resolveCityShowVenueSlug,
  resolveCrossSiteVenueSlug,
} from "@/lib/dcc/shows/cityShows";
import { resolveCanonicalCityKey } from "@/src/data/city-aliases";
import { getCityShowsConfig } from "@/src/data/city-shows-config";
import { titleCase } from "@/src/data/city-intents";

type Params = { city: string };
type SearchParams = { qty?: string };

export async function generateStaticParams() {
  return Object.keys(aliases).map((city) => ({ city }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { city } = await params;
  const cityKey = resolveCanonicalCityKey(city);
  const cityName = titleCase(cityKey);

  return {
    title: `${cityName} Shows This Week | Live Music and Concerts`,
    description: `Live music and concert listings in ${cityName} this week, with venue details and transportation guidance where supported.`,
    alternates: { canonical: `/${cityKey}/shows-this-week` },
  };
}

function formatDate(date: string | null, time: string | null) {
  if (!date) return "Date to be confirmed";
  const parsed = new Date(time ? `${date}T${time}` : `${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return [date, time].filter(Boolean).join(" • ");
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(time ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(parsed);
}

export default async function CityShowsThisWeekPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { city } = await params;
  const resolvedSearchParams = await searchParams;
  const cityKey = resolveCanonicalCityKey(city);
  const cityName = titleCase(cityKey);
  const config = getCityShowsConfig(cityKey);

  if (!config) notFound();

  const liveResult = await ticketmasterAdapter.fetch({
    lat: config.liveFeed.lat,
    lon: config.liveFeed.lon,
    radius_km: config.liveFeed.radiusKm,
    size: 30,
  });

  const events = liveResult.data.filter((event) => isEventWithinDays(event.start_date, 7));

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_24%),linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.98))] p-8 shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
          <div className="text-xs uppercase tracking-[0.28em] text-cyan-300">{cityName} This Week</div>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">{cityName} shows this week</h1>
          <p className="mt-4 max-w-3xl text-zinc-300">
            Upcoming live music and event inventory happening over the next seven days, with venue links and transportation guidance where DCC already has support.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/${cityKey}/shows`}
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 font-semibold text-zinc-100 hover:bg-white/10"
            >
              All {cityName} shows
            </Link>
            <Link
              href={`/${cityKey}`}
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 font-semibold text-zinc-100 hover:bg-white/10"
            >
              City hub
            </Link>
          </div>
        </div>

        <section className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-6">
          <h2 className="text-2xl font-bold">Upcoming this week</h2>
          <p className="mt-2 text-zinc-300">
            {liveResult.ok
              ? `Live event inventory loaded for ${cityName}.`
              : "Live inventory is unavailable right now, so this page may be sparse."}
          </p>

          {events.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {events.map((event) => {
                const showVenueSlug = resolveCityShowVenueSlug(cityKey, event.venue_name);
                const venueSlug = resolveCrossSiteVenueSlug(event.venue_name);

                return (
                  <article
                    key={event.id}
                    className="rounded-3xl border border-white/10 bg-black/20 p-5"
                  >
                    <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                      {event.genre_name || "Live event"}
                    </div>
                    <h3 className="mt-2 text-xl font-semibold text-white">{event.name}</h3>
                    <p className="mt-2 text-sm text-zinc-300">
                      {formatDate(event.start_date, event.start_time)}
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">{event.venue_name || `${cityName} venue`}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {showVenueSlug ? (
                        <Link
                          href={`/${cityKey}/shows/${buildCityShowEventSlug(event)}`}
                          className="inline-flex items-center rounded-full border border-cyan-400/30 px-3 py-1.5 text-sm font-semibold text-cyan-200 hover:bg-cyan-400/10"
                        >
                          Show details
                        </Link>
                      ) : null}
                      {event.url ? (
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer sponsored nofollow"
                          className="inline-flex items-center rounded-full border border-amber-400/30 px-3 py-1.5 text-sm font-semibold text-amber-200 hover:bg-amber-400/10"
                        >
                          View tickets
                        </a>
                      ) : null}
                    </div>

                    {venueSlug ? (
                      <div className="mt-4">
                        <RideOptionsCard
                          venueSlug={venueSlug}
                          title="Getting There"
                          sourcePage={`/${cityKey}/shows-this-week`}
                          showVenueLink={false}
                          bookingContext={{
                            artist: event.name || undefined,
                            event: event.name || undefined,
                            date: event.start_date || undefined,
                            qty: resolvedSearchParams.qty || undefined,
                          }}
                        />
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5 text-zinc-300">
              No supported events were found for the next seven days.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
