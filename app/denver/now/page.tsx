import type { Metadata } from "next";
import Link from "next/link";
import {
  getActiveSignals,
  getLiveCityAnchor,
  getLiveCityBundle,
  getLiveCityRegistryEntry,
  getSignalsNearAnchor,
} from "@/lib/dcc/liveCity";

export const metadata: Metadata = {
  title: "Denver Now | City Pulse Right Now",
  description:
    "Real-time Denver awareness layer for what is happening now, what is building tonight, and what matters around your anchor.",
  alternates: {
    canonical: "/denver/now",
  },
};

type SearchParams = {
  anchor?: string;
};

function formatClock(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));
}

function signalSort(a: { rank_weight: number }, b: { rank_weight: number }) {
  return b.rank_weight - a.rank_weight;
}

function titleize(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}

const LABEL_OVERRIDES: Record<string, string> = {
  "arts-district": "Arts district",
  "cocktail-bar": "Cocktail bar",
  "convention-heavy": "Convention-heavy",
  "date-night": "Date night",
  "downtown-core": "Downtown Core",
  "event-heavy": "Event-heavy",
  "food-and-drink": "Food and drink",
  "group-spot": "Group spot",
  "high_impact": "High impact",
  "hotel-bars": "Hotel bars",
  "italian-cocktails": "Italian • cocktails",
  "major-event-campus": "Major event campus",
  "mixed-use-core": "Mixed-use core",
  "nightlife-corridor": "Nightlife corridor",
  "nightlife-heavy": "Nightlife-heavy",
  "pre-game": "Pre-game",
  "pre-show": "Pre-show",
  "restaurant-bar": "Restaurant bar",
  "restaurant-cafe": "Restaurant • cafe",
  "restaurant-nightlife": "Restaurant • nightlife",
  "source_backed": "Source-backed",
  "spanish-tapas": "Spanish • tapas",
  "theater-comedy-live": "Theater • comedy • live",
};

function beautifyCategory(value: string) {
  if (LABEL_OVERRIDES[value]) {
    return LABEL_OVERRIDES[value];
  }

  return value
    .replaceAll("_", "-")
    .split("-")
    .map((part) => {
      if (part === "lodo") {
        return "LoDo";
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" • ");
}

function getAnchorLabel(name: string) {
  return name
    .replace(/^The\s+/i, "")
    .replace(/\s+(Denver|Chicago|Miami|Nashville|Austin|New York City)$/i, "");
}

function SignalCard({
  signal,
  timeZone,
}: {
  signal: {
    id: string;
    signal_type: string;
    provenance: string;
    title: string;
    description: string;
    impact_level: string;
    rank_weight: number;
    status: string;
    starts_at: string;
    expires_at: string;
    linked_venue_slug?: string;
    linked_place_slug?: string;
    affected_district_slugs?: string[];
    pro_tip?: string;
  };
  timeZone: string;
}) {
  const impactClass =
    signal.impact_level === "high" ? "border-rose-400/30 bg-rose-500/10 text-rose-100"
    : signal.impact_level === "medium" || signal.impact_level === "medium-high" ? "border-amber-300/30 bg-amber-400/10 text-amber-50"
    : "border-cyan-400/30 bg-cyan-500/10 text-cyan-50";

  return (
    <article className="rounded-[1.6rem] border border-white/10 bg-black/25 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
      <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.22em]">
        <span className={`rounded-full border px-2.5 py-1 ${impactClass}`}>{signal.impact_level}</span>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-zinc-300">{beautifyCategory(signal.signal_type)}</span>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-zinc-400">{beautifyCategory(signal.provenance)}</span>
      </div>
      <h3 className="mt-4 text-xl font-semibold text-white">{signal.title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-300">{signal.description}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-400">
        <span>Starts {formatClock(signal.starts_at, timeZone)}</span>
        <span>Ends {formatClock(signal.expires_at, timeZone)}</span>
        <span>Status {titleize(signal.status)}</span>
      </div>
      {signal.affected_district_slugs && signal.affected_district_slugs.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {signal.affected_district_slugs.map((district) => (
            <span
              key={`${signal.id}:${district}`}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-200"
            >
              {district.replaceAll("-", " ")}
            </span>
          ))}
        </div>
      ) : null}
      {signal.pro_tip ? (
        <p className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-50">
          {signal.pro_tip}
        </p>
      ) : null}
      {(signal.linked_venue_slug || signal.linked_place_slug) ? (
        <div className="mt-4 text-xs uppercase tracking-[0.18em] text-zinc-500">
          {signal.linked_venue_slug ? `Venue: ${signal.linked_venue_slug}` : `Place: ${signal.linked_place_slug}`}
        </div>
      ) : null}
    </article>
  );
}

export default async function DenverNowPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const bundle = getLiveCityBundle("denver");
  const registry = getLiveCityRegistryEntry("denver");
  const params = await searchParams;

  const defaultAnchor = bundle.anchors.anchors[0]?.slug ?? "spire";
  const requestedAnchor = typeof params.anchor === "string" && params.anchor ? params.anchor : defaultAnchor;
  const anchor = getLiveCityAnchor("denver", requestedAnchor) ?? getLiveCityAnchor("denver", defaultAnchor);

  if (!registry || !anchor) {
    throw new Error("Denver live-city pack is missing required registry or anchor data.");
  }

  const activeSignals = getActiveSignals("denver").sort(signalSort);
  const anchorSignals = getSignalsNearAnchor("denver", anchor.slug).sort(signalSort);
  const now = new Date(bundle.signals.as_of);
  const tonightSignals = bundle.signals.signals
    .filter((signal) => {
      const startsAt = new Date(signal.starts_at);
      return (
        signal.status === "scheduled" &&
        startsAt.toDateString() === now.toDateString() &&
        startsAt.getTime() >= now.getTime()
      );
    })
    .sort(signalSort);
  const highImpactSignals = bundle.signals.signals
    .filter((signal) => signal.impact_level === "high")
    .sort(signalSort);
  const topSignal = highImpactSignals[0] ?? activeSignals[0] ?? bundle.signals.signals[0] ?? null;
  const upcomingSignals = tonightSignals.slice(0, 3);
  const rightNowFooter = [
    topSignal?.status ? titleize(topSignal.status) : null,
    topSignal?.affected_district_slugs?.[0] ? titleize(topSignal.affected_district_slugs[0]) : null,
    topSignal?.linked_venue_slug ? titleize(topSignal.linked_venue_slug) : null,
  ].filter(Boolean);

  const anchorDistricts = bundle.districts.districts.filter((district) => anchor.district_slugs.includes(district.slug));
  const anchorVenues = bundle.venues.venues.filter((venue) => anchor.nearby_venue_slugs.includes(venue.slug));
  const anchorPlaces = bundle.places.places.filter((place) => anchor.nearby_place_slugs.includes(place.slug));
  const distinctAnchorSignals = anchorSignals.filter((signal) => {
    if (signal.id === topSignal?.id) {
      return false;
    }

    return (signal.affected_district_slugs ?? []).some((district) => anchor.district_slugs.includes(district));
  });
  const placeRail = Array.from(
    new Map(
      [...anchorPlaces, ...bundle.places.places].map((place) => [place.slug, place])
    ).values()
  ).slice(0, 7);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.16),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.12),transparent_28%),linear-gradient(180deg,#0a0f1b,#04070d)] text-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:py-12">
        <header className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(10,15,27,0.96),rgba(17,24,39,0.92))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.38)]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.26em] text-amber-200">
              <span>Denver Now</span>
            </div>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
                What matters right now and what is building tonight
              </h1>
              <p className="max-w-3xl text-base leading-7 text-zinc-300">
                Real-time city awareness with a point of view. See the main thing affecting Denver now,
                what is building later today, and what matters around your anchor.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {registry.modes.map((mode) => (
                <span
                  key={mode}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-zinc-200"
                >
                  {beautifyCategory(mode)}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {bundle.anchors.anchors.map((candidate) => {
                const isActive = candidate.slug === anchor.slug;
                return (
                  <Link
                    key={candidate.slug}
                    href={`/denver/now?anchor=${encodeURIComponent(candidate.slug)}`}
                    className={
                      isActive ?
                        "rounded-full border border-amber-300/40 bg-amber-400/15 px-4 py-2 text-sm font-semibold text-amber-50"
                      : "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10"
                    }
                  >
                    {candidate.name}
                  </Link>
                );
              })}
            </div>
            <p className="text-sm text-zinc-400">Updated {formatClock(bundle.signals.as_of, registry.timezone)}</p>
          </div>
        </header>

        <div className="mt-8 space-y-10">
          <section id="right-now" className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-rose-200">Right Now</p>
            </div>
            {topSignal ? (
              <article className="rounded-[2rem] border border-rose-300/20 bg-[linear-gradient(180deg,rgba(127,29,29,0.24),rgba(10,15,27,0.95))] p-6 shadow-[0_22px_60px_rgba(0,0,0,0.32)]">
                <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.22em]">
                  <span className="rounded-full border border-rose-300/30 bg-rose-500/10 px-2.5 py-1 text-rose-100">
                    {titleize(topSignal.impact_level)}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-zinc-300">
                    {topSignal.affected_district_slugs?.[0] ? titleize(topSignal.affected_district_slugs[0]) : "Citywide"}
                  </span>
                </div>
                <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-4xl">
                  {topSignal.title}
                </h2>
                <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-200">{topSignal.description}</p>
                {topSignal.pro_tip ? (
                  <p className="mt-5 rounded-[1.4rem] border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-50">
                    <span className="font-semibold text-cyan-100">Pro tip:</span> {topSignal.pro_tip}
                  </p>
                ) : null}
                <div className="mt-5 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-zinc-300">
                  {rightNowFooter.map((item) => (
                    <span key={item} className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            ) : (
              <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5 text-zinc-300">
                No ranked top signal is available yet.
              </div>
            )}
          </section>

          <section id="later-today" className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-200">Later Today</p>
              <h2 className="mt-2 text-2xl font-bold">What is building later today</h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {upcomingSignals.length > 0 ? (
                upcomingSignals.map((signal) => (
                  <SignalCard key={signal.id} signal={signal} timeZone={registry.timezone} />
                ))
              ) : (
                <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5 text-zinc-300 lg:col-span-3">
                  No scheduled tonight signals are in the Denver seed pack yet.
                </div>
              )}
            </div>
          </section>

          <section id="anchor-selector" className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-amber-200">Near {getAnchorLabel(anchor.name)}</p>
              <h2 className="mt-2 text-2xl font-bold">What is around your building</h2>
            </div>
            <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5">
              <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                <div className="space-y-4">
                  <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Districts near you</p>
                    <div className="mt-4 grid gap-3">
                      {anchorDistricts.map((district) => (
                        <div key={district.slug} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <p className="font-semibold text-white">{district.name}</p>
                          <p className="mt-1 text-sm text-zinc-300">
                            {district.vibe_tags.slice(0, 3).map(beautifyCategory).join(" • ")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {distinctAnchorSignals.length > 0 ? (
                    <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Also affecting your area</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {distinctAnchorSignals.map((signal) => (
                          <span
                            key={signal.id}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200"
                          >
                            {signal.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Places near you</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {anchorPlaces.map((place) => (
                      <article key={place.slug} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <h3 className="font-semibold text-white">{place.name}</h3>
                        <p className="mt-2 text-sm text-zinc-300">{beautifyCategory(place.category)}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {place.tags.slice(0, 2).map((tag) => (
                            <span
                              key={`${place.slug}:${tag}`}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-200"
                            >
                              {beautifyCategory(tag)}
                            </span>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="districts" className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-200">Where Downtown Is Active</p>
              <h2 className="mt-2 text-2xl font-bold">Active districts</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {bundle.districts.districts.map((district) => (
                <article key={district.slug} className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">{beautifyCategory(district.district_type)}</p>
                      <h3 className="mt-2 text-xl font-semibold text-white">{district.name}</h3>
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-zinc-300">
                      {titleize(district.impact_profile)}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {district.vibe_tags.map((tag) => (
                      <span key={`${district.slug}:${tag}`} className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-zinc-200">
                        {beautifyCategory(tag)}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="places" className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-fuchsia-200">Where To Go Next</p>
              <h2 className="mt-2 text-2xl font-bold">Places and venues</h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Nearby Venues</p>
                <div className="mt-4 grid gap-3">
                  {anchorVenues.slice(0, 4).map((venue) => (
                    <div key={venue.slug} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="font-semibold text-white">{venue.name}</p>
                      <p className="mt-1 text-sm text-zinc-300">{beautifyCategory(venue.category)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {placeRail.map((place) => (
                  <article key={place.slug} className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">{beautifyCategory(place.place_type)}</p>
                    <h3 className="mt-2 text-lg font-semibold text-white">{place.name}</h3>
                    <p className="mt-2 text-sm text-zinc-300">{beautifyCategory(place.category)}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {place.quick_actions.map((action) => (
                        <span key={`${place.slug}:${action}`} className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-zinc-200">
                          {beautifyCategory(action)}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
