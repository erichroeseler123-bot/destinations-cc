import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CityTimePanel from "@/app/components/dcc/CityTimePanel";
import RideOptionsCard from "@/app/components/transportation/RideOptionsCard";
import JsonLd from "@/app/components/dcc/JsonLd";
import { getCityManifest } from "@/lib/dcc/manifests/cityExpansion";
import { buildBreadcrumbJsonLd, buildEventJsonLd } from "@/lib/dcc/jsonld";
import { ticketmasterAdapter } from "@/lib/dcc/providers/adapters/ticketmaster";
import {
  buildCityShowEventSlug,
  extractCityShowEventId,
  getCityShowVenue,
  resolveCityShowVenueSlug,
  resolveCrossSiteVenueSlug,
} from "@/lib/dcc/shows/cityShows";
import { getLiveCityVenue, isLiveCityKey } from "@/lib/dcc/liveCity";
import { resolveCanonicalCityKey } from "@/src/data/city-aliases";
import { getCityShowsConfig } from "@/src/data/city-shows-config";
import { getTransportDirectoryEntry } from "@/src/data/transport-directory";
import { titleCase } from "@/src/data/city-intents";

export const revalidate = 300;

type Params = {
  city: string;
  eventSlug: string;
};

type SearchParams = {
  qty?: string;
};

function formatDate(date: string | null, time: string | null) {
  if (!date) return "Date to be confirmed";
  const parsed = new Date(time ? `${date}T${time}` : `${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return [date, time].filter(Boolean).join(" • ");
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    ...(time ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(parsed);
}

async function getSupportedCityEvent(cityKey: string, eventSlug: string) {
  const config = getCityShowsConfig(cityKey);
  if (!config) return null;

  const eventId = extractCityShowEventId(eventSlug);
  if (!eventId) return null;

  const result = await ticketmasterAdapter.fetch({
    lat: config.liveFeed.lat,
    lon: config.liveFeed.lon,
    radius_km: config.liveFeed.radiusKm,
    size: 40,
  });

  const event = result.data.find((row) => row.id === eventId) ?? null;
  if (!event) return null;

  const venueSlug = resolveCityShowVenueSlug(cityKey, event.venue_name);
  if (!venueSlug) return null;

  const crossSiteVenueSlug = resolveCrossSiteVenueSlug(event.venue_name);

  return { config, event, venueSlug, crossSiteVenueSlug };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { city, eventSlug } = await params;
  const cityKey = resolveCanonicalCityKey(city);
  const payload = await getSupportedCityEvent(cityKey, eventSlug);

  if (!payload) {
    return {
      title: "Denver Show Guide | Destination Command Center",
      robots: { index: false, follow: false },
    };
  }

  const cityName = titleCase(cityKey);
  const transportEntry = payload.crossSiteVenueSlug
    ? getTransportDirectoryEntry(payload.crossSiteVenueSlug)
    : null;
  const cityVenue = getCityShowVenue(cityKey, payload.venueSlug);
  const venueName = transportEntry?.name || cityVenue?.name || payload.event.venue_name || "Venue";
  const title = `${payload.event.name} at ${venueName} | ${cityName} Show Guide`;

  return {
    title,
    description: `${payload.event.name} at ${venueName} on ${formatDate(
      payload.event.start_date,
      payload.event.start_time,
    )}. Venue context, transportation guidance, and ride options from Destination Command Center.`,
    alternates: {
      canonical: `/${cityKey}/shows/${eventSlug}`,
    },
  };
}

export default async function CityShowEventPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { city, eventSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const cityKey = resolveCanonicalCityKey(city);
  const cityName = titleCase(cityKey);
  const payload = await getSupportedCityEvent(cityKey, eventSlug);

  if (!payload) notFound();

  const { event, venueSlug, crossSiteVenueSlug } = payload;
  const cityManifest = getCityManifest(cityKey);
  const transportEntry = crossSiteVenueSlug
    ? getTransportDirectoryEntry(crossSiteVenueSlug)
    : null;
  const liveCityVenue =
    isLiveCityKey(cityKey) ? getLiveCityVenue(cityKey, venueSlug) : null;
  const cityVenue = getCityShowVenue(cityKey, venueSlug);
  const venueName = transportEntry?.name || liveCityVenue?.name || cityVenue?.name || event.venue_name || "Venue";
  const eventTitle = event.name;
  const eventSummary = event.subgenre_name || event.genre_name || "Live event";
  const relatedResult = await ticketmasterAdapter.fetch({
    lat: payload.config.liveFeed.lat,
    lon: payload.config.liveFeed.lon,
    radius_km: payload.config.liveFeed.radiusKm,
    size: 24,
  });

  const relatedEvents = relatedResult.data
    .filter((row) => row.id !== event.id && resolveCityShowVenueSlug(cityKey, row.venue_name) === venueSlug)
    .slice(0, 3);

  const venueUrl = transportEntry
    ? `https://destinationcommandcenter.com${transportEntry.dccUrl}`
    : undefined;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildEventJsonLd({
              path: `/${cityKey}/shows/${eventSlug}`,
              type: "MusicEvent",
              name: `${eventTitle} at ${venueName}`,
              description: `${eventTitle} at ${venueName} in ${cityName}, with venue context, transportation guidance, and ride options.`,
              startDate: event.start_date
                ? `${event.start_date}T${event.start_time || "19:00:00"}`
                : null,
              venueName,
              venueUrl,
              address: {
                locality: cityName,
                region:
                  cityKey === "denver"
                    ? "CO"
                    : cityKey === "las-vegas"
                      ? "NV"
                      : cityKey === "new-orleans"
                        ? "LA"
                        : undefined,
                country: "US",
              },
              offerUrl: event.url,
              organizerName: venueName,
            }),
            buildBreadcrumbJsonLd([
              { name: cityName, item: `/${cityKey}` },
              { name: `${cityName} Shows`, item: `/${cityKey}/shows` },
              { name: `${eventTitle} at ${venueName}`, item: `/${cityKey}/shows/${eventSlug}` },
            ]),
          ],
        }}
      />

      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_24%),linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.98))] p-8 shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
          <div className="text-xs uppercase tracking-[0.28em] text-cyan-300">{cityName} Show Guide</div>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">{eventTitle}</h1>
          <p className="mt-4 text-lg text-zinc-200">
            {formatDate(event.start_date, event.start_time)} at {venueName}
          </p>
          <p className="mt-3 max-w-3xl text-zinc-300">
            {eventSummary} at {venueName}. Use this page for venue context, related {cityName} shows, and transportation guidance where support exists.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/${cityKey}/shows`}
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 font-semibold text-zinc-100 hover:bg-white/10"
            >
              Back to {cityName} shows
            </Link>
            <Link
              href={`/${cityKey}/shows-this-week`}
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 font-semibold text-zinc-100 hover:bg-white/10"
            >
              Shows this week
            </Link>
            {transportEntry ? (
              <Link
                href={transportEntry.dccUrl}
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 font-semibold text-zinc-100 hover:bg-white/10"
              >
                Venue guide
              </Link>
            ) : null}
            {transportEntry?.guideUrl ? (
              <Link
                href={transportEntry.guideUrl}
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 font-semibold text-zinc-100 hover:bg-white/10"
              >
                Transportation guide
              </Link>
            ) : null}
            {event.url ? (
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer sponsored nofollow"
                className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-5 py-3 font-semibold text-black hover:bg-cyan-400"
              >
                View tickets
              </a>
            ) : null}
          </div>
          {cityManifest?.timezone ? (
            <div className="mt-6 max-w-sm">
              <CityTimePanel cityName={cityName} timezone={cityManifest.timezone} showWeekday />
            </div>
          ) : null}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-6">
            <div className="text-xs uppercase tracking-[0.22em] text-zinc-400">Event Snapshot</div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Venue</div>
                <div className="mt-2 text-lg font-semibold">{venueName}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Category</div>
                <div className="mt-2 text-lg font-semibold">{eventSummary}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Date</div>
                <div className="mt-2 text-lg font-semibold">{formatDate(event.start_date, event.start_time)}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">City</div>
                <div className="mt-2 text-lg font-semibold">{cityName}</div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
              <h2 className="text-xl font-bold">Why this page matters</h2>
              <p className="mt-3 text-zinc-300">
                These show pages connect live event discovery to venue guidance. If this venue has transportation support, the ride block below becomes the direct handoff.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`/${cityKey}/shows`}
                  className="text-sm font-semibold text-cyan-200 hover:text-cyan-100"
                >
                  Browse all {cityName} shows
                </Link>
                <Link
                  href={`/${cityKey}/shows-this-week`}
                  className="text-sm font-semibold text-cyan-200 hover:text-cyan-100"
                >
                  Browse this week
                </Link>
              </div>
            </div>

            {relatedEvents.length > 0 ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
                <h2 className="text-xl font-bold">More at {venueName}</h2>
                <div className="mt-4 grid gap-3">
                  {relatedEvents.map((relatedEvent) => (
                    <Link
                      key={relatedEvent.id}
                      href={`/${cityKey}/shows/${buildCityShowEventSlug(relatedEvent)}`}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.08]"
                    >
                      <div className="text-sm font-semibold text-white">{relatedEvent.name}</div>
                      <div className="mt-1 text-sm text-zinc-400">
                        {formatDate(relatedEvent.start_date, relatedEvent.start_time)}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <div className="space-y-6">
            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-6">
              <div className="text-xs uppercase tracking-[0.22em] text-zinc-400">Exit First</div>
              <h2 className="mt-3 text-2xl font-bold">Getting out is harder than getting in.</h2>
              <p className="mt-3 text-zinc-300">
                Most people plan how they will arrive and treat the exit like a later problem. That is usually where delay, surge pricing, and post-event chaos start to stack up.
              </p>
              <div className="mt-5 grid gap-3">
                {[
                  "1. When the event ends",
                  "2. How you are getting back",
                  "3. Then how you are getting there",
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-zinc-100">
                    {item}
                  </div>
                ))}
              </div>
            </section>

            {crossSiteVenueSlug ? (
              <RideOptionsCard
                venueSlug={crossSiteVenueSlug}
                sourcePage={`/${cityKey}/shows/${eventSlug}`}
                bookingContext={{
                  artist: eventTitle,
                  event: eventTitle,
                  date: event.start_date || undefined,
                  qty: resolvedSearchParams.qty || undefined,
                }}
              />
            ) : (
              <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-6">
                <div className="text-xs uppercase tracking-[0.22em] text-zinc-400">Getting There</div>
                <h2 className="mt-3 text-2xl font-bold">Transportation guidance</h2>
                <p className="mt-3 text-zinc-300">
                  This venue is part of the {cityName} show index, but direct ride coverage is not active here. Use the venue details and tickets link above to plan the night.
                </p>
              </section>
            )}

            {transportEntry ? (
              <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-6">
                <div className="text-xs uppercase tracking-[0.22em] text-zinc-400">Venue Context</div>
                <h2 className="mt-3 text-2xl font-bold">{transportEntry.name}</h2>
                <p className="mt-3 text-zinc-300">{transportEntry.notes}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={transportEntry.dccUrl}
                    className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-black/25 px-4 py-3 text-sm font-semibold text-zinc-100 hover:bg-white/10"
                  >
                    Open venue guide
                  </Link>
                  {transportEntry.guideUrl ? (
                    <Link
                      href={transportEntry.guideUrl}
                      className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-black/25 px-4 py-3 text-sm font-semibold text-zinc-100 hover:bg-white/10"
                    >
                      Open transportation guide
                    </Link>
                  ) : null}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
