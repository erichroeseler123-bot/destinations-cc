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
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-zinc-300">{signal.signal_type.replaceAll("_", " ")}</span>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-zinc-400">{signal.provenance.replaceAll("_", " ")}</span>
      </div>
      <h3 className="mt-4 text-xl font-semibold text-white">{signal.title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-300">{signal.description}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-400">
        <span>Starts {formatClock(signal.starts_at, timeZone)}</span>
        <span>Ends {formatClock(signal.expires_at, timeZone)}</span>
        <span>Status {signal.status.replaceAll("_", " ")}</span>
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

  const anchorDistricts = bundle.districts.districts.filter((district) => anchor.district_slugs.includes(district.slug));
  const anchorVenues = bundle.venues.venues.filter((venue) => anchor.nearby_venue_slugs.includes(venue.slug));
  const anchorPlaces = bundle.places.places.filter((place) => anchor.nearby_place_slugs.includes(place.slug));

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.16),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.12),transparent_28%),linear-gradient(180deg,#0a0f1b,#04070d)] text-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:py-12">
        <header className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(10,15,27,0.96),rgba(17,24,39,0.92))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.38)]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.26em] text-amber-200">
              <span>Denver Now</span>
              <span className="text-zinc-500">City Pulse Right Now</span>
            </div>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
                What is happening in Denver right now
              </h1>
              <p className="max-w-3xl text-base leading-7 text-zinc-300">
                This is the real-time awareness layer. It answers what is active now, what is building tonight,
                and what is happening around your anchor without dropping you into trip planning.
              </p>
            </div>
            <div className="grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 sm:grid-cols-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Anchor</p>
                <p className="mt-2 text-lg font-semibold">{anchor.name}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Freshness</p>
                <p className="mt-2 text-sm text-zinc-200">Signals as of {formatClock(bundle.signals.as_of, registry.timezone)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Live Density</p>
                <p className="mt-2 text-sm text-zinc-200">
                  {activeSignals.length} active signal{activeSignals.length === 1 ? "" : "s"} · {bundle.events.events.length} tracked event{bundle.events.events.length === 1 ? "" : "s"}
                </p>
              </div>
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
          </div>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Registry</p>
            <p className="mt-3 text-2xl font-bold">{registry.name}</p>
            <p className="mt-2 text-sm text-zinc-300">
              {registry.launch_status} · {registry.density_profile} · {registry.modes.join(" · ")}
            </p>
          </div>
          <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Anchor Orbit</p>
            <p className="mt-3 text-2xl font-bold">{anchorDistricts.length + anchorVenues.length + anchorPlaces.length}</p>
            <p className="mt-2 text-sm text-zinc-300">districts, venues, and places connected to {anchor.slug}</p>
          </div>
          <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">API</p>
            <div className="mt-3 space-y-2 text-sm text-zinc-300">
              <p><code>/api/internal/live-city/denver</code></p>
              <p><code>/api/internal/live-city/denver/signals</code></p>
              <p><code>/api/internal/live-city/denver/anchor/{anchor.slug}</code></p>
            </div>
          </div>
        </section>

        <div className="mt-8 space-y-10">
          <section id="high-impact" className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-rose-200">High Impact</p>
                <h2 className="mt-2 text-2xl font-bold">The big city movers right now</h2>
              </div>
            </div>
            <div className="grid gap-4">
              {highImpactSignals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} timeZone={registry.timezone} />
              ))}
            </div>
          </section>

          <section id="happening-now" className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-200">Happening Now</p>
              <h2 className="mt-2 text-2xl font-bold">What is already active</h2>
            </div>
            <div className="grid gap-4">
              {activeSignals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} timeZone={registry.timezone} />
              ))}
            </div>
          </section>

          <section id="tonight" className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-200">Tonight</p>
              <h2 className="mt-2 text-2xl font-bold">What is building later today</h2>
            </div>
            <div className="grid gap-4">
              {tonightSignals.length > 0 ? (
                tonightSignals.map((signal) => (
                  <SignalCard key={signal.id} signal={signal} timeZone={registry.timezone} />
                ))
              ) : (
                <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5 text-zinc-300">
                  No scheduled tonight signals are in the seed pack yet.
                </div>
              )}
            </div>
          </section>

          <section id="anchor-orbit" className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-amber-200">Near Your Anchor</p>
              <h2 className="mt-2 text-2xl font-bold">{anchor.name} orbit</h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Anchor Signals</p>
                <div className="mt-4 space-y-4">
                  {anchorSignals.map((signal) => (
                    <SignalCard key={signal.id} signal={signal} timeZone={registry.timezone} />
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Districts</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {anchorDistricts.map((district) => (
                      <span key={district.slug} className="rounded-full border border-white/10 bg-black/25 px-3 py-2 text-sm text-zinc-100">
                        {district.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Nearby Venues</p>
                  <div className="mt-4 grid gap-3">
                    {anchorVenues.map((venue) => (
                      <div key={venue.slug} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="font-semibold text-white">{venue.name}</p>
                        <p className="mt-1 text-sm text-zinc-300">{venue.category}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Nearby Places</p>
                  <div className="mt-4 grid gap-3">
                    {anchorPlaces.map((place) => (
                      <div key={place.slug} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="font-semibold text-white">{place.name}</p>
                        <p className="mt-1 text-sm text-zinc-300">{place.category}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
