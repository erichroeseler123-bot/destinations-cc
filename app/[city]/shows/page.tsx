export const dynamicParams = false;

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import HeroVisual from "@/app/components/dcc/HeroVisual";
import RideOptionsCard from "@/app/components/transportation/RideOptionsCard";
import aliases from "@/data/city-aliases.json";
import { bandsintownAdapter } from "@/lib/dcc/providers/adapters/bandsintown";
import { ticketmasterAdapter } from "@/lib/dcc/providers/adapters/ticketmaster";
import {
  buildCityShowEventSlug,
  resolveCityShowVenueSlug,
  resolveCrossSiteVenueSlug,
} from "@/lib/dcc/shows/cityShows";
import { resolveCanonicalCityKey } from "@/src/data/city-aliases";
import { getMediaForEntity } from "@/src/lib/media";
import { getCityShowsConfig } from "@/src/data/city-shows-config";
import { getCityIntents, titleCase } from "@/src/data/city-intents";
import {
  getVegasVenuesByCasinoSlug,
  groupVegasVenuesByCluster,
  VEGAS_CASINOS,
} from "@/src/data/vegas-shows-registry";
import { buildCityTrackedHref } from "@/src/lib/city-analytics";

type Params = { city: string };
type SearchParams = { q?: string; qty?: string };

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
  const config = getCityShowsConfig(cityKey);

  if (config) {
    return {
      title: `${cityName} Shows | Residencies, Comedy, Magic, and Live Entertainment`,
      description: config.heroSummary,
      alternates: { canonical: `/${cityKey}/shows` },
    };
  }

  return {
    title: `${cityName} Shows | Event Discovery`,
    description: `High-intent event and performance queries for ${cityName}.`,
    alternates: { canonical: `/${cityKey}/shows` },
  };
}

function matchesQuery(value: string | null | undefined, rawQuery: string) {
  return String(value || "").toLowerCase().includes(rawQuery);
}

function formatEventDate(date: string | null, time: string | null) {
  if (!date) return "Upcoming live event";
  const iso = time ? `${date}T${time}` : `${date}T12:00:00`;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return [date, time].filter(Boolean).join(" • ");
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(time ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(parsed);
}

function formatLabel(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function showFallbackImage(showType: string, venueType?: string) {
  if (showType === "magic") return "/images/shows/magic.svg";
  if (showType === "comedy" || showType === "cabaret") return "/images/shows/comedy.svg";
  if (showType === "jazz") return "/images/shows/jazz.svg";
  if (showType === "residency" || showType === "spectacle" || venueType === "casino-theater") {
    return "/images/shows/residency.svg";
  }
  if (showType === "opera" || showType === "ballet" || showType === "theater" || showType === "musical" || venueType === "performing-arts-center") {
    return "/images/shows/performing-arts.svg";
  }
  return "/images/shows/concert.svg";
}

function artistLookupKey(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

async function getBandsintownArtistMap(names: string[]) {
  const uniqueNames = Array.from(new Set(names.map((name) => String(name || "").trim()).filter(Boolean))).slice(0, 12);
  const rows = await Promise.all(
    uniqueNames.map(async (artist) => {
      const result = await bandsintownAdapter.fetch({ artist });
      return result.ok && result.data?.image_url ? [artistLookupKey(artist), result.data] : null;
    }),
  );

  return new Map(rows.filter(Boolean) as Array<[string, NonNullable<Awaited<ReturnType<typeof bandsintownAdapter.fetch>>["data"]>]>);
}

function GenericIntentGrid({
  cityKey,
  cityName,
  rawQuery,
}: {
  cityKey: string;
  cityName: string;
  rawQuery: string;
}) {
  const items = getCityIntents(cityKey);
  if (!items) notFound();

  const filtered =
    rawQuery.length > 0
      ? items.filter((it) =>
          [it.title, it.query, it.description].some((field) =>
            String(field || "").toLowerCase().includes(rawQuery)
          )
        )
      : items;
  const visibleItems = filtered.length > 0 ? filtered : items;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="text-xs tracking-[0.35em] uppercase text-zinc-500">
          Destination Command Center • {cityName}
        </div>

        <h1 className="mt-4 text-4xl font-black leading-[0.95] md:text-6xl">
          {cityName} Shows
        </h1>

        <p className="mt-4 max-w-2xl text-zinc-300">
          High-intent categories for events and performances.
        </p>
        {rawQuery ? (
          <p className="mt-2 text-xs text-zinc-400">
            Filter: <span className="text-zinc-200">{rawQuery}</span>
            {filtered.length === 0 ? " (no direct matches, showing full set)" : ""}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-sm text-zinc-200 hover:bg-white/10"
            href={`/${cityKey}`}
          >
            City hub
          </Link>
          <Link
            className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-sm text-zinc-200 hover:bg-white/10"
            href={`/${cityKey}/attractions`}
          >
            Attractions
          </Link>
          <Link
            className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-sm text-zinc-200 hover:bg-white/10"
            href={`/${cityKey}/tours`}
          >
            Tours
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {visibleItems.map((it, idx) => (
            <Link
              key={`${cityKey}-shows-${idx}-${it.query}`}
              href={buildCityTrackedHref({
                href: `/${cityKey}/shows?q=${encodeURIComponent(it.query)}`,
                city: cityKey,
                lane: "events",
                sourceSection: "city_events_intent",
                intentQuery: it.query,
              })}
              className="group rounded-3xl border border-white/10 bg-white/[0.03] p-6 hover:border-cyan-400/30 hover:bg-white/[0.06] transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-white">{it.title}</div>
                  <div className="mt-1 text-sm text-zinc-400">
                    {it.badge ? (
                      <span className="mr-2 inline-flex rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[11px] text-zinc-200">
                        {it.badge}
                      </span>
                    ) : null}
                    <span className="text-zinc-300">Intent:</span>{" "}
                    <span className="text-zinc-400">{it.query}</span>
                  </div>
                </div>
                <div className="font-bold text-cyan-300 opacity-70 transition group-hover:opacity-100">
                  →
                </div>
              </div>

              <p className="mt-3 leading-relaxed text-zinc-300">{it.description}</p>
            </Link>
          ))}
        </div>

        <div className="mt-10 border-t border-white/10 pt-6">
          <Link className="text-zinc-300 transition hover:text-cyan-200" href={`/${cityKey}`}>
            ← Back to {cityName}
          </Link>
        </div>
      </div>
    </main>
  );
}

export default async function CityShowsPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { city } = await params;
  const resolvedSearchParams = await searchParams;
  const cityKey = resolveCanonicalCityKey(city);
  const rawQuery = (resolvedSearchParams?.q || "").trim().toLowerCase();
  const qty = (resolvedSearchParams?.qty || "").trim();
  const cityName = titleCase(cityKey);
  const config = getCityShowsConfig(cityKey);

  if (!config) {
    return <GenericIntentGrid cityKey={cityKey} cityName={cityName} rawQuery={rawQuery} />;
  }

  const liveResult = await ticketmasterAdapter.fetch({
    lat: config.liveFeed.lat,
    lon: config.liveFeed.lon,
    radius_km: config.liveFeed.radiusKm,
    size: config.liveFeed.size,
  });

  const liveShows = liveResult.data.filter((event) => {
    if (!rawQuery) return true;
    return (
      matchesQuery(event.name, rawQuery) ||
      matchesQuery(event.venue_name, rawQuery) ||
      matchesQuery(event.segment_name, rawQuery) ||
      matchesQuery(event.genre_name, rawQuery) ||
      matchesQuery(event.subgenre_name, rawQuery)
    );
  });

  const visibleCuratedShows = config.featuredShows.filter((show) => {
    if (!rawQuery) return true;
    return (
      matchesQuery(show.title, rawQuery) ||
      matchesQuery(show.venue, rawQuery) ||
      matchesQuery(show.category, rawQuery) ||
      matchesQuery(show.query, rawQuery)
    );
  });

  const visibleShowCategories = config.showCategories.filter((category) => {
    if (!rawQuery) return true;
    return (
      matchesQuery(category.title, rawQuery) ||
      matchesQuery(category.description, rawQuery) ||
      matchesQuery(category.query, rawQuery)
    );
  });

  const vegasCasinoCards =
    cityKey === "las-vegas"
      ? VEGAS_CASINOS.map((casino) => ({
          ...casino,
          venues: getVegasVenuesByCasinoSlug(casino.slug),
        }))
      : [];

  const vegasVenueClusters =
    cityKey === "las-vegas"
      ? Array.from(groupVegasVenuesByCluster().entries())
      : [];

  const bandsintownArtistMap = await getBandsintownArtistMap([
    ...liveShows.slice(0, 9).map((event) => event.name || ""),
    ...(visibleCuratedShows.length > 0 ? visibleCuratedShows : config.featuredShows).map((show) => show.title),
  ]);

  const visibleLiveCards = await Promise.all(
    liveShows.slice(0, 9).map(async (event) => {
      const artistFallback = bandsintownArtistMap.get(artistLookupKey(event.name));
      const media = await getMediaForEntity({
        entityType: "show",
        slug: `${cityKey}-show-${event.id}`,
        sourceHints: {
          artistName: event.name,
          venueName: event.venue_name,
          cityName,
          ticketmasterImageUrl: event.image_url,
          ticketmasterAttributionLabel: event.image_url ? "Ticketmaster" : undefined,
          ticketmasterAttributionUrl: event.url,
          bandsintownArtistImageUrl: artistFallback?.image_url || artistFallback?.thumb_url || undefined,
          bandsintownArtistUrl: artistFallback?.url || undefined,
          localImageUrl: showFallbackImage(
            event.genre_name?.toLowerCase().includes("comedy")
              ? "comedy"
              : event.genre_name?.toLowerCase().includes("magic")
                ? "magic"
                : event.genre_name?.toLowerCase().includes("jazz")
                  ? "jazz"
                  : "concert",
          ),
          localImageAlt: `${event.name} show artwork`,
        },
      });

      return { event, media };
    }),
  );

  const visibleCuratedShowCards = await Promise.all(
    (visibleCuratedShows.length > 0 ? visibleCuratedShows : config.featuredShows).map(async (show) => {
      const artistFallback = bandsintownArtistMap.get(artistLookupKey(show.title));
      const media = await getMediaForEntity({
        entityType: "show",
        slug: `${cityKey}-curated-${show.query}`,
        sourceHints: {
          artistName: show.title,
          venueName: show.venue,
          cityName,
          bandsintownArtistImageUrl: artistFallback?.image_url || artistFallback?.thumb_url || undefined,
          bandsintownArtistUrl: artistFallback?.url || undefined,
          localImageUrl: showFallbackImage(show.showType, show.venueType),
          localImageAlt: `${show.title} show artwork`,
        },
      });

      return { show, media };
    }),
  );

  const leadingShowCards =
    cityKey === "las-vegas"
      ? visibleCuratedShowCards.slice(0, 4)
      : visibleCuratedShowCards.slice(0, 3);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.18),transparent_35%),linear-gradient(180deg,rgba(39,39,42,0.94),rgba(9,9,11,0.98))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.45)] md:p-8">
            <div className="text-xs uppercase tracking-[0.32em] text-amber-300">
              Destination Command Center • {cityName} Shows
            </div>
            <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[0.95] md:text-6xl">
              {cityName} shows: residencies, comedy, magic, concerts, and showroom nights
            </h1>
            <p className="mt-4 max-w-3xl text-base text-zinc-300 md:text-lg">{config.heroSummary}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={buildCityTrackedHref({
                  href: `/${cityKey}/shows`,
                  city: cityKey,
                  lane: "events",
                  sourceSection: "city_events_primary",
                })}
                className="inline-flex items-center justify-center rounded-2xl bg-amber-500 px-5 py-3 font-semibold text-black hover:bg-amber-400"
              >
                Browse live show inventory
              </Link>
              <Link
                href={`/${cityKey}/shows-this-week`}
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 font-semibold text-zinc-100 hover:bg-white/10"
              >
                Shows this week
              </Link>
              <Link
                href={`/${cityKey}/tours`}
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 font-semibold text-zinc-100 hover:bg-white/10"
              >
                Switch to {cityName} tours
              </Link>
              <Link
                href={`/${cityKey}/attractions`}
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 font-semibold text-zinc-100 hover:bg-white/10"
              >
                Switch to attractions
              </Link>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-300">Buyer state</div>
                <div className="mt-2 text-sm leading-6 text-white/80">This visitor is planning a fixed-time night, not casually browsing attractions.</div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-300">Best next move</div>
                <div className="mt-2 text-sm leading-6 text-white/80">Choose the show, then route into venue, transport, or city-night planning immediately.</div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-300">Monetization path</div>
                <div className="mt-2 text-sm leading-6 text-white/80">Tickets, transport, hotel adjacency, and pre-show city plans can all branch from this page.</div>
              </div>
            </div>

            {rawQuery ? (
              <p className="mt-4 text-sm text-zinc-400">
                Filtering this page for <span className="text-zinc-100">{rawQuery}</span>.
              </p>
            ) : null}

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {config.planningNotes.map((note) => (
                <div key={note} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-200">
                  {note}
                </div>
              ))}
            </div>
          </div>

          <HeroVisual
            canonicalPath={`/${cityKey}`}
            fallbackTitle={`${cityName} shows`}
            fallbackSubtitle={config.heroSummary}
            fallbackType="venue"
          />
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {cityKey === "las-vegas" ? "Top Las Vegas Shows Right Now" : `Top ${cityName} Show Lanes`}
              </h2>
              <p className="mt-2 max-w-3xl text-zinc-300">
                {cityKey === "las-vegas"
                  ? "Lead with the real Vegas lanes first: Sphere, Cirque, residency rooms, and classic magic or comedy commitments that shape the whole night."
                  : "Lead with the strongest city-specific show lanes first, then branch into broader live inventory below."}
              </p>
            </div>
            <div className="text-sm text-amber-200">
              Relevance-first fallback layer when live feed quality is uneven.
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {leadingShowCards.map(({ show, media }) => (
              <Link
                key={`lead-${show.title}-${show.query}`}
                href={buildCityTrackedHref({
                  href: `/${cityKey}/shows?q=${encodeURIComponent(show.query)}`,
                  city: cityKey,
                  lane: "events",
                  sourceSection: "city_events_primary",
                  intentQuery: show.query,
                })}
                className="overflow-hidden rounded-3xl border border-white/10 bg-black/20 hover:bg-white/10"
              >
                {media.card ? (
                  <div
                    className="h-44 bg-cover bg-center"
                    style={{ backgroundImage: `linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.68)), url(${media.card.src})` }}
                  />
                ) : (
                  <div className="h-44 bg-[linear-gradient(135deg,rgba(251,191,36,0.22),rgba(24,24,27,0.92))]" />
                )}
                <div className="p-5">
                  <div className="text-xs uppercase tracking-[0.22em] text-amber-300">{show.category}</div>
                  <h3 className="mt-2 text-xl font-semibold text-white">{show.title}</h3>
                  <p className="mt-1 text-sm text-zinc-400">{show.venue}</p>
                  <p className="mt-3 text-zinc-300">{show.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Live show inventory</h2>
              <p className="mt-2 max-w-3xl text-zinc-300">
                This lane is fed by the local ticket feed, then shaped by the city-specific show
                taxonomy below. It is separate from tours and attractions because the buyer
                is shopping fixed-time entertainment inventory.
              </p>
            </div>
            <div className="text-sm text-cyan-300">
              {liveResult.ok
                ? `Live ticket inventory loaded for ${cityName}.`
                : liveResult.diagnostics.fallback_reason === "missing_api_key"
                  ? `Ticketmaster API key is missing, so this section is using curated ${cityName} show coverage.`
                  : `Live event inventory is temporarily unavailable, so this section is using curated ${cityName} show coverage.`}
            </div>
          </div>

          {liveShows.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleLiveCards.map(({ event, media }) => (
                (() => {
                  const showVenueSlug = resolveCityShowVenueSlug(cityKey, event.venue_name);
                  const venueSlug = resolveCrossSiteVenueSlug(event.venue_name);

                  return (
                    <article
                      key={event.id}
                      className="overflow-hidden rounded-3xl border border-white/10 bg-black/25"
                    >
                      {media.card ? (
                        <div
                          className="h-40 bg-cover bg-center"
                          style={{ backgroundImage: `linear-gradient(180deg,rgba(0,0,0,0.15),rgba(0,0,0,0.7)), url(${media.card.src})` }}
                        />
                      ) : (
                        <div className="h-40 bg-[linear-gradient(135deg,rgba(251,191,36,0.22),rgba(24,24,27,0.92))]" />
                      )}
                      <div className="space-y-3 p-5">
                        <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                          {event.segment_name ? (
                            <span className="rounded-full border border-white/10 px-2 py-1">{event.segment_name}</span>
                          ) : null}
                          {event.genre_name ? (
                            <span className="rounded-full border border-white/10 px-2 py-1">{event.genre_name}</span>
                          ) : null}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{event.name}</h3>
                          <p className="mt-1 text-sm text-zinc-400">
                            {formatEventDate(event.start_date, event.start_time)}
                            {event.venue_name ? ` • ${event.venue_name}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm text-zinc-300">
                            {event.subgenre_name || "Live entertainment inventory"}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
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
                        </div>
                        {venueSlug ? (
                          <RideOptionsCard
                            venueSlug={venueSlug}
                            title="Getting There"
                            sourcePage={`/${cityKey}/shows`}
                            showVenueLink={false}
                            bookingContext={{
                              artist: event.name || undefined,
                              event: event.name || undefined,
                              date: event.start_date || undefined,
                              qty: qty || undefined,
                            }}
                          />
                        ) : null}
                        {media.card?.attribution ? (
                          <p className="text-xs text-zinc-500">
                            Image source:{" "}
                            {media.card.attribution.href ? (
                              <a
                                href={media.card.attribution.href}
                                target="_blank"
                                rel="noopener noreferrer sponsored nofollow"
                                className="text-zinc-400 hover:text-zinc-200"
                              >
                                {media.card.attribution.label}
                              </a>
                            ) : (
                              <span className="text-zinc-400">{media.card.attribution.label}</span>
                            )}
                          </p>
                        ) : null}
                      </div>
                    </article>
                  );
                })()
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5 text-zinc-300">
              No live show listings matched this filter, so the page is falling back to curated{" "}
              {cityName} show coverage below.
            </div>
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-bold">Featured {cityName} show lanes</h2>
          <p className="mt-2 max-w-3xl text-zinc-300">
            This editorial layer keeps the page useful even when live inventory is thin. It also
            makes the intent split explicit: residencies, magic, comedy, concerts, and spectacle.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {visibleCuratedShowCards.map(({ show, media }) => (
              (() => {
                const venueSlug = resolveCrossSiteVenueSlug(show.venueSlug, show.venue);

                return (
                  <div
                    key={`${show.title}-${show.query}`}
                    className="overflow-hidden rounded-3xl border border-white/10 bg-black/20"
                  >
                    <Link
                      href={buildCityTrackedHref({
                        href: `/${cityKey}/shows?q=${encodeURIComponent(show.query)}`,
                        city: cityKey,
                        lane: "events",
                        sourceSection: "city_events_intent",
                        intentQuery: show.query,
                      })}
                      className="block hover:bg-white/10"
                    >
                      {media.card ? (
                        <div
                          className="h-44 bg-cover bg-center"
                          style={{ backgroundImage: `linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.68)), url(${media.card.src})` }}
                        />
                      ) : null}
                      <div className="p-5">
                        <div className="text-xs uppercase tracking-[0.22em] text-amber-300">{show.category}</div>
                        <h3 className="mt-2 text-xl font-semibold text-white">{show.title}</h3>
                        <p className="mt-1 text-sm text-zinc-400">{show.venue}</p>
                        <p className="mt-3 text-zinc-300">{show.description}</p>
                        <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-zinc-400">
                          <span className="rounded-full border border-white/10 px-2 py-1">
                            {formatLabel(show.showType)}
                          </span>
                          <span className="rounded-full border border-white/10 px-2 py-1">
                            {formatLabel(show.venueType)}
                          </span>
                          {show.isPerformingArts ? (
                            <span className="rounded-full border border-amber-400/30 px-2 py-1 text-amber-200">
                              Performing Arts
                            </span>
                          ) : null}
                          {show.isJazzClub ? (
                            <span className="rounded-full border border-amber-400/30 px-2 py-1 text-amber-200">
                              Jazz Club
                            </span>
                          ) : null}
                        </div>
                        {media.card?.attribution ? (
                          <p className="mt-4 text-xs text-zinc-500">
                            Image source:{" "}
                            {media.card.attribution.href ? (
                              <a
                                href={media.card.attribution.href}
                                target="_blank"
                                rel="noopener noreferrer sponsored nofollow"
                                className="text-zinc-400 hover:text-zinc-200"
                              >
                                {media.card.attribution.label}
                              </a>
                            ) : (
                              <span className="text-zinc-400">{media.card.attribution.label}</span>
                            )}
                          </p>
                        ) : null}
                      </div>
                    </Link>
                    {venueSlug ? (
                      <div className="px-5 pb-5">
                        <RideOptionsCard
                          venueSlug={venueSlug}
                          title="Getting There"
                          sourcePage={`/${cityKey}/shows`}
                          showVenueLink={false}
                          bookingContext={{
                            artist: show.title,
                            event: show.query,
                            qty: qty || undefined,
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })()
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-2xl font-bold">Browse by show category</h2>
            <p className="mt-2 text-zinc-300">
              These categories map to real city-level ticket intent, not general tourism. They
              should help the page stay useful even before a deeper venue-level calendar layer
              exists.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {(visibleShowCategories.length > 0 ? visibleShowCategories : config.showCategories).map((category) => (
                <Link
                  key={category.query}
                  href={buildCityTrackedHref({
                    href: `/${cityKey}/shows?q=${encodeURIComponent(category.query)}`,
                    city: cityKey,
                    lane: "events",
                    sourceSection: "city_events_intent",
                    intentQuery: category.query,
                  })}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/10"
                >
                  <h3 className="text-lg font-semibold text-white">{category.title}</h3>
                  <p className="mt-2 text-sm text-zinc-300">{category.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-zinc-400">
                    <span className="rounded-full border border-white/10 px-2 py-1">
                      {formatLabel(category.showType)}
                    </span>
                    {category.venueType ? (
                      <span className="rounded-full border border-white/10 px-2 py-1">
                        {formatLabel(category.venueType)}
                      </span>
                    ) : null}
                    {category.isPerformingArts ? (
                      <span className="rounded-full border border-amber-400/30 px-2 py-1 text-amber-200">
                        Performing Arts
                      </span>
                    ) : null}
                    {category.isJazzClub ? (
                      <span className="rounded-full border border-amber-400/30 px-2 py-1 text-amber-200">
                        Jazz Club
                      </span>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-2xl font-bold">Venue clusters</h2>
            <div className="mt-6 space-y-4">
              {config.venueClusters.map((cluster) => (
                <div key={cluster.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
                    {cluster.title}
                  </h3>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {formatLabel(cluster.venueType)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {cluster.venues.map((venue) => (
                      <span
                        key={`${cluster.title}-${venue}`}
                        className="rounded-full border border-white/10 px-3 py-1 text-sm text-zinc-200"
                      >
                        {venue}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {cityKey === "las-vegas" ? (
          <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-2xl font-bold">Browse shows by casino and resort</h2>
            <p className="mt-2 max-w-3xl text-zinc-300">
              In Vegas, the casino and resort layer is part of the meaning of the show. This
              registry makes the page usable for intent like Caesars Palace shows, Bellagio shows,
              MGM Grand shows, and Venetian theater inventory.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {vegasCasinoCards.map((casino) => (
                <Link
                  key={casino.slug}
                  href={buildCityTrackedHref({
                    href: `/${cityKey}/shows?q=${encodeURIComponent(`${casino.name} shows`)}`,
                    city: cityKey,
                    lane: "events",
                    sourceSection: "city_events_intent",
                    intentQuery: `${casino.name} shows`,
                  })}
                  className="rounded-2xl border border-white/10 bg-black/20 p-5 hover:bg-white/10"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-white">{casino.name}</h3>
                    <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-zinc-300">
                      {formatLabel(casino.cluster)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">{casino.address}</p>
                  <p className="mt-4 text-sm text-zinc-300">
                    {casino.venues.length > 0
                      ? `${casino.venues.length} venue${casino.venues.length === 1 ? "" : "s"} in registry`
                      : "Parent resort ready for venue attachment"}
                  </p>
                  {casino.venues.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {casino.venues.slice(0, 3).map((venue) => (
                        <span
                          key={`${casino.slug}-${venue.slug}`}
                          className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-200"
                        >
                          {venue.name}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {cityKey === "las-vegas" ? (
          <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-2xl font-bold">Venue inventory clusters</h2>
            <p className="mt-2 max-w-3xl text-zinc-300">
              This is the first-pass Vegas venue registry behind the shows lane: casino theaters,
              mega venues, magic and comedy rooms, performing-arts anchors, and downtown inventory.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {vegasVenueClusters.map(([cluster, venues]) => (
                <div
                  key={cluster}
                  className="rounded-2xl border border-white/10 bg-black/20 p-5"
                >
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
                    {formatLabel(cluster)}
                  </h3>
                  <div className="mt-4 space-y-3">
                    {venues.map((venue) => (
                      <div
                        key={venue.slug}
                        className="rounded-xl border border-white/10 bg-black/20 p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium text-white">{venue.name}</div>
                          <span className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                            {formatLabel(venue.venueType)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-zinc-400">{venue.address}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-bold">Cultural and venue anchors</h2>
          <p className="mt-2 max-w-3xl text-zinc-300">
            These anchors make the shows lane broader than just headline entertainment. They cover
            performing arts institutions, jazz heritage, listening rooms, and the cultural venues
            that define each city’s real live-performance identity.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {config.culturalAnchors.map((anchor) => (
              <Link
                key={`${anchor.title}-${anchor.query}`}
                href={buildCityTrackedHref({
                  href: `/${cityKey}/shows?q=${encodeURIComponent(anchor.query)}`,
                  city: cityKey,
                  lane: "events",
                  sourceSection: "city_events_intent",
                  intentQuery: anchor.query,
                })}
                className="rounded-2xl border border-white/10 bg-black/20 p-5 hover:bg-white/10"
              >
                <h3 className="text-lg font-semibold text-white">{anchor.title}</h3>
                <p className="mt-3 text-sm text-zinc-300">{anchor.description}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-zinc-400">
                  <span className="rounded-full border border-white/10 px-2 py-1">
                    {formatLabel(anchor.showType)}
                  </span>
                  <span className="rounded-full border border-white/10 px-2 py-1">
                    {formatLabel(anchor.venueType)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-10 border-t border-white/10 pt-6">
          <Link className="text-zinc-300 transition hover:text-amber-200" href={`/${cityKey}`}>
            ← Back to {cityName}
          </Link>
        </div>
      </div>
    </main>
  );
}
