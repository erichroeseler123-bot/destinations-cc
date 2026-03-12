export const dynamicParams = false;

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import aliases from "@/data/city-aliases.json";
import { ticketmasterAdapter } from "@/lib/dcc/providers/adapters/ticketmaster";
import { getCityShowsConfig } from "@/src/data/city-shows-config";
import { getCityIntents, titleCase } from "@/src/data/city-intents";
import { buildCityTrackedHref } from "@/src/lib/city-analytics";

type Params = { city: string };
type SearchParams = { q?: string };

export async function generateStaticParams() {
  return Object.keys(aliases).map((city) => ({ city }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { city } = await params;
  const cityKey = (city || "").toLowerCase();
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
  const cityKey = (city || "").toLowerCase();
  const rawQuery = (resolvedSearchParams?.q || "").trim().toLowerCase();
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

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
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
              href={`/${cityKey}/tours`}
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 font-semibold text-zinc-100 hover:bg-white/10"
            >
              Switch to Vegas tours
            </Link>
            <Link
              href={`/${cityKey}/attractions`}
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 font-semibold text-zinc-100 hover:bg-white/10"
            >
              Switch to attractions
            </Link>
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

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Live show inventory</h2>
              <p className="mt-2 max-w-3xl text-zinc-300">
                This lane is fed by the Vegas-area ticket feed, then shaped by the city-specific
                show taxonomy below. It is separate from tours and attractions because the buyer
                is shopping fixed-time entertainment inventory.
              </p>
            </div>
            <div className="text-sm text-cyan-300">
              {liveResult.ok
                ? "Live ticket inventory loaded for Las Vegas."
                : liveResult.diagnostics.fallback_reason === "missing_api_key"
                  ? "Ticketmaster API key is missing, so this section is using curated Vegas show coverage."
                  : "Live event inventory is temporarily unavailable, so this section is using curated Vegas show coverage."}
            </div>
          </div>

          {liveShows.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {liveShows.slice(0, 9).map((event) => (
                <article
                  key={event.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-black/25"
                >
                  {event.image_url ? (
                    <div
                      className="h-40 bg-cover bg-center"
                      style={{ backgroundImage: `linear-gradient(180deg,rgba(0,0,0,0.15),rgba(0,0,0,0.7)), url(${event.image_url})` }}
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
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5 text-zinc-300">
              No live show listings matched this filter, so the page is falling back to curated Vegas
              show coverage below.
            </div>
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-bold">Featured Vegas show lanes</h2>
          <p className="mt-2 max-w-3xl text-zinc-300">
            This editorial layer keeps the page useful even when live inventory is thin. It also
            makes the intent split explicit: residencies, magic, comedy, concerts, and spectacle.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {(visibleCuratedShows.length > 0 ? visibleCuratedShows : config.featuredShows).map((show) => (
              <Link
                key={`${show.title}-${show.query}`}
                href={buildCityTrackedHref({
                  href: `/${cityKey}/shows?q=${encodeURIComponent(show.query)}`,
                  city: cityKey,
                  lane: "events",
                  sourceSection: "city_events_intent",
                  intentQuery: show.query,
                })}
                className="rounded-3xl border border-white/10 bg-black/20 p-5 hover:bg-white/10"
              >
                <div className="text-xs uppercase tracking-[0.22em] text-amber-300">{show.category}</div>
                <h3 className="mt-2 text-xl font-semibold text-white">{show.title}</h3>
                <p className="mt-1 text-sm text-zinc-400">{show.venue}</p>
                <p className="mt-3 text-zinc-300">{show.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-2xl font-bold">Browse by show category</h2>
            <p className="mt-2 text-zinc-300">
              These categories map to real Vegas ticket intent, not general tourism. They should help
              the page stay useful even before a deeper venue-level calendar layer exists.
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

        <div className="mt-10 border-t border-white/10 pt-6">
          <Link className="text-zinc-300 transition hover:text-amber-200" href={`/${cityKey}`}>
            ← Back to {cityName}
          </Link>
        </div>
      </div>
    </main>
  );
}
