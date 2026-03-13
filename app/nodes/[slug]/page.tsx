export const dynamicParams = false;


// app/nodes/[slug]/page.tsx
import nodes from "@/data/nodes.json";

import LocalTimeWeather from "@/components/LocalTimeWeather";
import DiagnosticsBlock from "@/app/components/DiagnosticsBlock";
import StatGrid from "@/app/components/StatGrid";
import PlaceLiveSummaryRail from "@/app/components/dcc/PlaceLiveSummary";
import WhatsNearby from "@/app/components/dcc/WhatsNearby";
import EarthSignalsPanel from "@/app/components/dcc/EarthSignalsPanel";
import PoweredByViator from "@/app/components/dcc/PoweredByViator";

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import type { DccNode } from "@/lib/dcc/schema";
import { buildInternalPlacePayload } from "@/lib/dcc/internal/placePayload";
import { ACTION_LABELS } from "@/lib/dcc/actionLabels";
import { getPlaceActionGraphBySlug } from "@/lib/dcc/graph/placeActionGraph";
import { buildPlaceLiveSummaryFromData } from "@/lib/dcc/graph/placeLiveSummary";
import { getGraphHealth } from "@/lib/dcc/graph/health";
import { parseAliveFilter } from "@/lib/dcc/taxonomy/lanes";
import {
  getNodeBySlug as getCanonicalNodeBySlug,
  loadBySlugIndex,
} from "@/lib/dcc/registry";

interface Node {
  id: string;
  slug: string;
  name: string;
  type: string;
  region: string;
  status: string;
  description: string;
  hub?: string;

  // optional future fields (won’t break if absent)
  citySlug?: string;

  // for local time + weather
  lat?: number;
  lng?: number;
  timezone?: string; // IANA e.g. "America/Los_Angeles"
}

/* ========================================
   Helpers
======================================== */

function renderRegion(node: DccNode): string {
  const a = node.admin;
  return (
    a?.admin1_name ||
    a?.admin1_code ||
    a?.country_name ||
    a?.country_code ||
    "Global"
  );
}

function renderType(node: DccNode): string {
  return node.subclass ? `${node.class}/${node.subclass}` : node.class;
}

function toLegacyNodeShape(node: DccNode): Node {
  return {
    id: node.id,
    slug: node.slug,
    name: node.display_name || node.name,
    type: renderType(node),
    region: renderRegion(node),
    status: node.status,
    description:
      node.content?.summary ||
      node.content?.long_description_md ||
      `${node.display_name || node.name} travel guide`,
    hub: node.slug,
    citySlug: node.slug,
    lat: node.geo?.lat ?? undefined,
    lng: node.geo?.lon ?? undefined,
    timezone: undefined,
  };
}

function getLegacyNodeBySlug(slug: string): Node | null {
  const legacy = (nodes as Node[]).find((n) => n.slug === slug);
  return legacy || null;
}

function getNodeBySlug(slug: string): Node | null {
  const canonical = getCanonicalNodeBySlug(slug);
  if (canonical) return toLegacyNodeShape(canonical);
  return getLegacyNodeBySlug(slug);
}

/* ========================================
   Static Generation
======================================== */

export function generateStaticParams() {
  const slugs = new Set<string>();
  try {
    const bySlug = loadBySlugIndex();
    Object.keys(bySlug).forEach((s) => slugs.add(s));
  } catch {
    // index might not exist yet in early environments
  }
  (nodes as Node[]).forEach((n) => slugs.add(n.slug));
  return Array.from(slugs).map((slug) => ({ slug }));
}

/* ========================================
   SEO / Metadata
======================================== */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const node = getNodeBySlug(resolvedParams.slug);
  if (!node) return {};

  const title = `${node.name} Travel Guide | Best Tours & Experiences`;
  const description =
    node.description ||
    `Compare top-rated tours, activities, and experiences in ${node.name}. Book verified providers with real reviews.`;

  return {
    title,
    description,

    openGraph: {
      title,
      description,
      url: `https://destinationcommandcenter.com/nodes/${node.slug}`,
      siteName: "Destination Command Center",
      type: "website",
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/* ========================================
   Page Component
======================================== */

export default async function NodePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ alive?: string; alive_expand?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;

  /* ---------- Resolve Node ---------- */

  const node = getNodeBySlug(resolvedParams.slug);

  if (!node || node.status !== "active") {
    return notFound();
  }

  const cityName = node.name.replace(/\s*Guide\s*$/i, "").trim();
  const placePayload = await buildInternalPlacePayload(resolvedParams.slug);
  const placeGraph = getPlaceActionGraphBySlug(resolvedParams.slug);
  const liveSummary = buildPlaceLiveSummaryFromData({
    placePayload,
    placeGraph,
    graphStale: getGraphHealth().stale,
  });
  const aliveFilter = parseAliveFilter(resolvedSearch.alive);
  const aliveExpanded =
    resolvedSearch.alive_expand === "1" || resolvedSearch.alive_expand === "true";
  const aliveSet = new Set(aliveFilter);
  const focusTours = aliveSet.has("tours");
  const focusCruises = aliveSet.has("cruises");
  const focusEvents = aliveSet.has("events");
  const focusTransport = aliveSet.has("transport");
  const hasAliveFocus = aliveSet.size > 0;
  const latestEvent = placePayload?.context.recent_observations?.[0] || null;
  const placeEvents = placePayload?.context.recent_observations || [];
  const viatorAction = placePayload?.action.viator;
  const focusedCruises = placeGraph?.actions.cruises.slice(0, 3) || [];
  const focusedRelated = (placeGraph?.related_places || [])
    .filter((r) => /port|airport|route|served_by|near|related/i.test(r.reason))
    .slice(0, 4);

  /* ---------- Dev Debug ---------- */

  const actionInventorySection = placePayload ? (
    <section
      id="section-action-inventory"
      className={`rounded-xl border bg-zinc-900/50 p-7 space-y-4 ${
        hasAliveFocus ? "border-cyan-500/40" : "border-zinc-800"
      } scroll-mt-24`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-lg">Available Actions Near This Location</h3>
        <span className="text-xs uppercase tracking-wider text-zinc-500">
          Unified Action Index
        </span>
      </div>
      {hasAliveFocus ? (
        <p className="text-xs text-cyan-300 uppercase tracking-wider">
          Focus mode active: {aliveFilter.join(", ")}
        </p>
      ) : null}
      <StatGrid
        items={[
          { label: "Cruises", value: `${placePayload.action_inventory.counts.cruises} sailings` },
          { label: "Tours", value: `${placePayload.action_inventory.counts.tours} experiences` },
          { label: "Events", value: `${placePayload.action_inventory.counts.events} listings` },
          { label: "Transport", value: `${placePayload.action_inventory.counts.transport} services` },
          { label: "Trend", value: placeGraph?.observations.trend || placePayload.context.risk_summary.trend },
          {
            label: "Top providers",
            value:
              placeGraph?.providers?.length
                ? placeGraph.providers.slice(0, 3).join(", ")
                : "n/a",
          },
        ]}
      />
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/cruises" className={`hover:text-zinc-100 ${focusCruises ? "text-cyan-300" : "text-zinc-300"}`}>
          Cruises →
        </Link>
        <Link href="/tours" className={`hover:text-zinc-100 ${focusTours ? "text-cyan-300" : "text-zinc-300"}`}>
          Tours →
        </Link>
      </div>
    </section>
  ) : null;

  const viatorSection = (
    <section
      id="section-external-listings"
      className={`rounded-xl border bg-zinc-900/40 p-7 space-y-4 ${
        focusTours ? "border-cyan-500/40" : "border-zinc-800"
      } scroll-mt-24`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-lg">Optional External Listings</h3>
        <span className="text-xs uppercase tracking-wider text-zinc-500">
          Layer 2: Action
        </span>
      </div>
      {focusTours ? (
        <p className="text-xs text-cyan-300 uppercase tracking-wider">
          Tours focus active: booking partner listings prioritized.
        </p>
      ) : null}
      <PoweredByViator
        compact
        disclosure={Boolean(viatorAction?.enabled)}
        body={`DCC helps you compare tours, activities, and excursions around ${cityName}. When you're ready to book, you can book with DCC via Viator.`}
      />
      {viatorAction ? (
        <StatGrid
          items={[
            { label: "Policy", value: viatorAction.policy_applied },
            { label: "Served source", value: viatorAction.served_source },
          ]}
        />
      ) : null}

      {viatorAction?.enabled && viatorAction.products.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {viatorAction.products.map((product) => (
            <div
              key={product.product_code}
              className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-4 py-4 space-y-3"
            >
              <div className="text-zinc-100 font-medium">{product.title}</div>
              <div className="text-xs text-zinc-400">
                {product.rating ? `rating ${product.rating}` : "rating n/a"}
                {typeof product.review_count === "number"
                  ? ` • ${product.review_count.toLocaleString()} reviews`
                  : ""}
                {typeof product.price_from === "number"
                  ? ` • from ${product.currency} ${product.price_from}`
                  : ""}
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer sponsored nofollow"
                  className="text-cyan-300 hover:text-cyan-200"
                >
                  {ACTION_LABELS.viewDetails} →
                </a>
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer sponsored nofollow"
                  className="text-zinc-300 hover:text-zinc-100"
                >
                  {ACTION_LABELS.externalBooking} →
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">
          No Viator booking listings are attached for this place yet.
        </p>
      )}
    </section>
  );

  return (
    <main className="max-w-6xl mx-auto px-6 py-24 space-y-20">
      {/* ================= HERO ================= */}

      <header className="space-y-6 border-b border-zinc-800 pb-12">
        <h1 className="text-4xl md:text-6xl font-black tracking-tight">{node.name}</h1>

        <p className="text-zinc-400 max-w-3xl text-lg leading-relaxed">{node.description}</p>

        <div className="flex flex-wrap gap-3 text-xs uppercase tracking-wider text-cyan-400">
          <span>{node.type}</span>
          <span>•</span>
          <span>{node.region}</span>
          <span>•</span>
          <span>Verified Experiences</span>
          {latestEvent ? (
            <>
              <span>•</span>
              <span className="text-amber-300">
                Latest Event: {latestEvent.event_type}
              </span>
            </>
          ) : null}
        </div>
      </header>

      {/* ================= TRUST BAR ================= */}

      <section className="grid md:grid-cols-3 gap-6 text-center">
        <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-5">
          DCC discovery-first routing
        </div>

        <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-5">
          Viator booking partner
        </div>

        <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-5">
          Clear affiliate disclosure
        </div>
      </section>

      {/* ================= LOCAL TIME + WEATHER ================= */}

      <LocalTimeWeather
        label="Local Time & Weather"
        timezone={node.timezone}
        lat={node.lat}
        lng={node.lng}
      />

      <WhatsNearby placeSlug={resolvedParams.slug} lat={node.lat} lon={node.lng} />
      <EarthSignalsPanel placeSlug={resolvedParams.slug} />

      {/* ================= OVERVIEW ================= */}

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Travel Overview</h2>

        <p className="text-zinc-300 leading-relaxed max-w-3xl">
          {cityName} is part of the Destination Command Center network. DCC is designed to help you evaluate tours, activities, and nearby travel options faster, then hand you off to trusted booking partners when you&apos;re ready.
        </p>
      </section>

      {/* ================= CAPABILITIES ================= */}

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">How We Rank Experiences</h2>

        <ul className="grid md:grid-cols-2 gap-4 text-zinc-300">
          <li>✔ Provider reliability</li>
          <li>✔ Review authenticity</li>
          <li>✔ Cancellation risk</li>
          <li>✔ Demand velocity</li>
          <li>✔ Price stability</li>
          <li>✔ Guest satisfaction</li>
        </ul>
      </section>

      {/* ================= STATUS ================= */}

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-7 space-y-3">
        <h3 className="font-semibold text-lg">Network Status</h3>

        <p className="text-sm text-zinc-400">
          This destination node is currently{" "}
          <span className="text-cyan-400 font-medium">{node.status}</span> and synchronized with the authority layer.
        </p>
      </section>

      {/* ================= TIMELINE ================= */}

      {placeEvents.length > 0 || placePayload?.context.risk_summary ? (
        <section
          id="section-observations"
          className={`rounded-xl border bg-zinc-900/50 p-7 space-y-4 ${
            focusEvents || focusTransport ? "border-cyan-500/40" : "border-zinc-800"
          } scroll-mt-24`}
        >
          <h3 className="font-semibold text-lg">Recent Observations</h3>

          {placePayload?.context.risk_summary ? (
            <p className="text-sm text-zinc-400">
              Risk level:{" "}
              <span className="text-cyan-300 font-medium">
                {placePayload.context.risk_summary.risk_level}
              </span>
              {" • "}
              Trend state:{" "}
              <span className="text-cyan-300 font-medium">
                {placePayload.context.risk_summary.trend}
              </span>
              {placePayload.context.risk_summary.sample_count
                ? ` • baseline samples: ${placePayload.context.risk_summary.sample_count}`
                : ""}
            </p>
          ) : null}

          {placeEvents.length > 0 ? (
            <div className="space-y-3">
              {placeEvents.map((ev, idx) => {
                const dt = new Date(ev.timestamp);
                const ts = Number.isNaN(dt.getTime())
                  ? ev.timestamp
                  : dt.toISOString().replace("T", " ").slice(0, 16);
                return (
                  <div
                    key={`${placePayload?.place_id || node.id}-${ev.timestamp}-${idx}`}
                    className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-4 py-3"
                  >
                    <div className="text-xs uppercase tracking-wider text-zinc-500">
                      {ts}
                    </div>
                    <div className="text-zinc-200 font-medium mt-1">
                      {ev.title}
                    </div>
                    <div className="text-xs text-zinc-400 mt-1">
                      {ev.event_type} • severity {ev.severity} • confidence {ev.confidence}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No recent observations yet.</p>
          )}
        </section>
      ) : null}

      <PlaceLiveSummaryRail
        summary={liveSummary}
        placeSlug={resolvedParams.slug}
        aliveFilter={aliveFilter}
        expanded={aliveExpanded}
      />

      {hasAliveFocus ? (
        <section
          id="section-lane-focus"
          className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-7 space-y-3 scroll-mt-24"
        >
          <h3 className="font-semibold text-lg text-cyan-200">Lane Focus Output</h3>
          {focusCruises && focusedCruises.length > 0 ? (
            <div className="text-sm text-zinc-300">
              <p className="text-cyan-300 font-medium">Cruise-linked actions</p>
              <ul className="mt-1 space-y-1">
                {focusedCruises.map((c) => (
                  <li key={c.id}>• {c.title}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {focusTransport && focusedRelated.length > 0 ? (
            <div className="text-sm text-zinc-300">
              <p className="text-cyan-300 font-medium">Transport-adjacent places</p>
              <ul className="mt-1 space-y-1">
                {focusedRelated.map((r) => (
                  <li key={`${r.place_id}:${r.reason}`}>• {r.place_name || r.place_slug || r.place_id}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {focusEvents && placeEvents.length > 0 ? (
            <p className="text-sm text-zinc-300">
              Event-adjacent context: {placeEvents[0].event_type} (severity {placeEvents[0].severity})
            </p>
          ) : null}
          {focusTours ? (
            <p className="text-sm text-zinc-300">
              Tours focus is active; Viator booking listings are lifted above broader inventory.
            </p>
          ) : null}
        </section>
      ) : null}

      {/* ================= ACTION INVENTORY ================= */}

      {focusTours ? viatorSection : actionInventorySection}
      {focusTours ? actionInventorySection : viatorSection}

      {/* ================= ACTION: VIATOR ================= */}
      {placePayload ? (
        <>
          <DiagnosticsBlock
            diagnostics={placePayload.diagnostics.memory}
            title="Memory Diagnostics"
          />
          <DiagnosticsBlock
            diagnostics={placePayload.diagnostics.viator}
            title="Action Diagnostics"
            extraLine={viatorAction?.reason ? `policy_reason=${viatorAction.reason}` : null}
          />
        </>
      ) : null}

      {/* ================= FOOTER ================= */}

      <footer className="pt-10 border-t border-zinc-800 text-sm text-zinc-500">
        <p>© {new Date().getFullYear()} Destination Command Center • Optimized Travel Intelligence Network</p>
      </footer>
    </main>
  );
}
