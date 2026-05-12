import type { Metadata } from "next";
import ExitTelemetryPanel from "./ExitTelemetryPanel";
import {
  SATELLITE_IDS,
  type DccSatelliteId,
} from "@/lib/dcc/satelliteHandoffs";
import {
  getCorridorHealthSnapshot,
  getTelemetryDashboardSnapshot,
} from "@/lib/dcc/telemetry/queries";
import {
  listRecentProductionCorridorEvents,
} from "@/lib/dcc/telemetry/corridorEvents";
import { listStoredOrders, type StoredOrder } from "@/lib/orders";
import { LIVE_CORRIDOR_CATALOG } from "@/lib/dcc/telemetry/corridorCatalog";
import {
  USA_PROOF_MEASURE_FIRST_CORRIDOR_IDS,
  USA_PROOF_MEASURE_FIRST_ROOT_PATHS,
} from "@/src/data/usa-proof-rollout";
import { buildNoindexRobots } from "@/lib/seo/indexingPolicy";
import { getDb } from "@/lib/db/client";
import {
  dccCorridorEvents,
  dccHandoffEvents,
  dccHandoffSummaries,
} from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Internal Telemetry | Destination Command Center",
  robots: buildNoindexRobots(),
};

type SearchParams = {
  satellite?: string;
  corridor?: string;
  revenue_mode?: string;
  revenue_bucket?: string;
  revenue_corridor?: string;
  revenue_rank?: string;
  proof_cohort?: string;
  proof_min_clicks?: string;
};

const SATELLITE_LABELS: Record<DccSatelliteId, string> = {
  partyatredrocks: "PARR",
  shuttleya: "SHUTTLEYA",
  gosno: "GOSNO",
  saveonthestrip: "SOTS",
  redrocksfastpass: "RRFP",
  welcometotheswamp: "WTS",
  "welcome-to-alaska": "WTA",
};

function isSatelliteId(value: string | undefined): value is DccSatelliteId {
  return SATELLITE_IDS.includes(value as DccSatelliteId);
}

function isConfirmedStatus(value: string | null | undefined) {
  const normalized = String(value || "").trim().toLowerCase();
  return ["succeeded", "deposit_paid", "paid_in_full"].includes(normalized);
}

function isConfirmedOrder(order: StoredOrder) {
  return isConfirmedStatus(order.payment?.status) || isConfirmedStatus(order.status);
}

function formatDateTime(value: string | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

function formatPercentWithCounts(value: number | null, numerator: number, denominator: number) {
  if (!denominator) return "—";
  const percent = formatPercent(value);
  if (percent === "—") return "—";
  return `${percent} (${numerator} / ${denominator})`;
}

function formatRate(value: number | null) {
  if (value === null || Number.isNaN(value)) return "not enough signal";
  return `${(value * 100).toFixed(0)}%`;
}

function sampleCaveat(count: number, minimum = 10) {
  if (count === 0) return "No production sample yet.";
  if (count < minimum) return `Small sample: ${count} observed event${count === 1 ? "" : "s"}. Treat as directional.`;
  return `${count} observed events. Stronger operating signal.`;
}

function pluralizeEvents(count: number) {
  return `${count} event${count === 1 ? "" : "s"}`;
}

function sampleBadge(sampleSize: number, minimum = 3) {
  if (sampleSize >= minimum) return null;
  return sampleSize === 0 ? "insufficient sample" : `n < ${minimum}`;
}

function renderExperimentPercent(value: number | null, sampleSize: number, minimum = 3) {
  const badge = sampleBadge(sampleSize, minimum);
  if (badge) return badge;
  return formatPercent(value);
}

function renderTopSummary(values: Array<{ value: string; clickCount: number }>, limit = 5) {
  if (!values.length) return "—";
  return values
    .slice(0, limit)
    .map((item) => `${item.value} (${item.clickCount})`)
    .join(", ");
}

function normalizeFilter(value: string | undefined) {
  const trimmed = String(value || "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizePositiveInteger(value: string | undefined, fallback: number) {
  const normalized = Number.parseInt(String(value || "").trim(), 10);
  return Number.isFinite(normalized) && normalized > 0 ? normalized : fallback;
}

function summarizeRevenueRows(
  rows: Array<{
    corridorName: string;
    revenueMode: string;
    revenueStage: string;
    telemetryBucket: string;
    provider: string;
    routeKey: string;
    clickCount: number;
    clickToBookingRate: number | null;
    clickToCheckoutRate: number | null;
  }>,
  selector: (row: {
    corridorName: string;
    revenueMode: string;
    revenueStage: string;
    telemetryBucket: string;
    provider: string;
    routeKey: string;
    clickCount: number;
    clickToBookingRate: number | null;
    clickToCheckoutRate: number | null;
  }) => string,
) {
  const grouped = new Map<string, { clickCount: number }>();

  for (const row of rows) {
    const key = selector(row) || "unknown";
    const bucket = grouped.get(key) || { clickCount: 0 };
    bucket.clickCount += row.clickCount;
    grouped.set(key, bucket);
  }

  return Array.from(grouped.entries())
    .map(([value, bucket]) => ({ value, clickCount: bucket.clickCount }))
    .sort((a, b) => b.clickCount - a.clickCount);
}

function isUsaProofRevenueRow(
  row: {
    corridorId: string;
    topSourcePages: Array<{ value: string; count: number }>;
  },
) {
  if (USA_PROOF_MEASURE_FIRST_CORRIDOR_IDS.includes(row.corridorId)) return true;
  return row.topSourcePages.some((item) => USA_PROOF_MEASURE_FIRST_ROOT_PATHS.includes(item.value));
}

const DECISION_HEALTH_MAPPING = [
  {
    label: "Total users / handoffs",
    source: "dcc_handoff_summaries",
    eventNames: ["unique handoff rows"],
    filter: "active satellite filter only",
  },
  {
    label: "Decision attempts",
    source: "dcc_corridor_events",
    eventNames: [
      "destination_selected",
      "base_selected",
      "activity_selected",
      "transport_mode_selected",
    ],
    filter: "last 5000 production-like corridor events",
  },
  {
    label: "Primary CTA clicks",
    source: "dcc_corridor_events",
    eventNames: ["cta_clicked_primary"],
    filter: "last 5000 production-like corridor events; source_page must not start with /transportation/",
  },
  {
    label: "Alternative CTA clicks",
    source: "dcc_corridor_events",
    eventNames: ["cta_clicked_alternative"],
    filter: "last 5000 production-like corridor events; source_page must not start with /transportation/",
  },
  {
    label: "booking_opened",
    source: "dcc_corridor_events",
    eventNames: ["booking_opened"],
    filter: "last 5000 production-like corridor events",
  },
  {
    label: "checkout_started",
    source: "dcc_corridor_events",
    eventNames: ["checkout_started"],
    filter: "last 5000 production-like corridor events",
  },
  {
    label: "booking_completed",
    source: "dcc_corridor_events",
    eventNames: ["booking_completed"],
    filter: "last 5000 production-like corridor events",
  },
  {
    label: "Satellite handoff rows",
    source: "dcc_handoff_summaries + dcc_handoff_events",
    eventNames: [
      "handoff_viewed",
      "booking_started",
      "booking_completed",
      "traveler_returned",
      "ticket_clickout",
      "tour_clickout",
    ],
    filter: "active satellite filter; rows sort by dcc_handoff_summaries.last_event_at",
  },
];

const DECISION_HEALTH_INCLUDED_EVENTS = new Set(
  DECISION_HEALTH_MAPPING.flatMap((row) =>
    row.source === "dcc_corridor_events" ? row.eventNames : [],
  ),
);

async function getTelemetryDebugSnapshot(
  activeSatellite: DccSatelliteId | null,
  recentSptTokenEvents: Array<{ createdAt: string }>,
) {
  const db = getDb();
  if (!db) {
    return {
      latestBySource: [
        { source: "dcc_handoff_summaries", latestAt: null, note: "No database configured." },
        { source: "dcc_handoff_events", latestAt: null, note: "No database configured." },
        { source: "dcc_corridor_events", latestAt: null, note: "No database configured." },
        {
          source: "dcc_spt_token_events",
          latestAt: recentSptTokenEvents[0]?.createdAt || null,
          note: "Recent token diagnostics from the dashboard snapshot.",
        },
      ],
      corridorEventCounts: [],
      satelliteEventCounts: [],
    };
  }

  const [
    latestHandoffSummary,
    latestHandoffEvent,
    latestCorridorEvent,
    corridorEventCounts,
    satelliteEventCounts,
  ] = await Promise.all([
    db
      .select({ latestAt: sql<Date | null>`max(${dccHandoffSummaries.lastEventAt})` })
      .from(dccHandoffSummaries)
      .where(activeSatellite ? eq(dccHandoffSummaries.satelliteId, activeSatellite) : undefined),
    db
      .select({ latestAt: sql<Date | null>`max(${dccHandoffEvents.receivedAt})` })
      .from(dccHandoffEvents)
      .where(activeSatellite ? eq(dccHandoffEvents.satelliteId, activeSatellite) : undefined),
    db.select({ latestAt: sql<Date | null>`max(${dccCorridorEvents.occurredAt})` }).from(dccCorridorEvents),
    db
      .select({
        eventName: dccCorridorEvents.eventName,
        last24h: sql<number>`count(*) filter (where ${dccCorridorEvents.occurredAt} >= now() - interval '24 hours')::int`,
        last7d: sql<number>`count(*) filter (where ${dccCorridorEvents.occurredAt} >= now() - interval '7 days')::int`,
        allTime: sql<number>`count(*)::int`,
        latestAt: sql<Date | null>`max(${dccCorridorEvents.occurredAt})`,
      })
      .from(dccCorridorEvents)
      .groupBy(dccCorridorEvents.eventName)
      .orderBy(desc(sql`count(*)`)),
    db
      .select({
        eventName: dccHandoffEvents.eventType,
        last24h: sql<number>`count(*) filter (where ${dccHandoffEvents.receivedAt} >= now() - interval '24 hours')::int`,
        last7d: sql<number>`count(*) filter (where ${dccHandoffEvents.receivedAt} >= now() - interval '7 days')::int`,
        allTime: sql<number>`count(*)::int`,
        latestAt: sql<Date | null>`max(${dccHandoffEvents.receivedAt})`,
      })
      .from(dccHandoffEvents)
      .where(activeSatellite ? eq(dccHandoffEvents.satelliteId, activeSatellite) : undefined)
      .groupBy(dccHandoffEvents.eventType)
      .orderBy(desc(sql`count(*)`)),
  ]);

  return {
    latestBySource: [
      {
        source: "dcc_handoff_summaries",
        latestAt: latestHandoffSummary[0]?.latestAt?.toISOString?.() || null,
        note: "Powers Total users / handoffs and the satellite handoff table rows.",
      },
      {
        source: "dcc_handoff_events",
        latestAt: latestHandoffEvent[0]?.latestAt?.toISOString?.() || null,
        note: "Raw satellite lifecycle ledger behind each handoff summary.",
      },
      {
        source: "dcc_corridor_events",
        latestAt: latestCorridorEvent[0]?.latestAt?.toISOString?.() || null,
        note: "Powers Decision attempts, CTA clicks, booking_opened, checkout_started, and booking_completed.",
      },
      {
        source: "dcc_spt_token_events",
        latestAt: recentSptTokenEvents[0]?.createdAt || null,
        note: "Recent token creation/resolution diagnostics from the dashboard snapshot.",
      },
    ],
    corridorEventCounts: corridorEventCounts.map((row) => ({
      eventName: row.eventName,
      last24h: Number(row.last24h || 0),
      last7d: Number(row.last7d || 0),
      allTime: Number(row.allTime || 0),
      latestAt: row.latestAt?.toISOString?.() || null,
      includedInDecisionHealth: DECISION_HEALTH_INCLUDED_EVENTS.has(row.eventName),
    })),
    satelliteEventCounts: satelliteEventCounts.map((row) => ({
      eventName: row.eventName,
      last24h: Number(row.last24h || 0),
      last7d: Number(row.last7d || 0),
      allTime: Number(row.allTime || 0),
      latestAt: row.latestAt?.toISOString?.() || null,
    })),
  };
}

export default async function InternalTelemetryPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) || {};
  const activeSatellite = isSatelliteId(sp.satellite) ? sp.satellite : null;
  const activeCorridor = LIVE_CORRIDOR_CATALOG.find((entry) => entry.corridorId === sp.corridor)?.corridorId || null;
  const snapshot = await getTelemetryDashboardSnapshot(activeSatellite);
  const selectedCorridorHealth = activeCorridor ? await getCorridorHealthSnapshot(activeCorridor) : null;
  const activeRevenueMode = normalizeFilter(sp.revenue_mode);
  const activeRevenueBucket = normalizeFilter(sp.revenue_bucket);
  const activeRevenueCorridor = normalizeFilter(sp.revenue_corridor);
  const activeProofCohort = normalizeFilter(sp.proof_cohort) === "usa" ? "usa" : null;
  const activeProofMinClicks = normalizePositiveInteger(
    sp.proof_min_clicks,
    activeProofCohort ? 5 : 1,
  );
  const activeRevenueRank =
    normalizeFilter(sp.revenue_rank) === "checkout" ? "checkout" : "booking";
  const recentProductionEvents = await listRecentProductionCorridorEvents(5000);
  const filteredRevenueRows = snapshot.corridorRevenue.rows
    .filter((row) => (activeProofCohort ? isUsaProofRevenueRow(row) : true))
    .filter((row) => (activeRevenueMode ? row.revenueMode === activeRevenueMode : true))
    .filter((row) => (activeRevenueBucket ? row.telemetryBucket === activeRevenueBucket : true))
    .filter((row) => (activeRevenueCorridor ? row.corridorId === activeRevenueCorridor : true))
    .filter((row) => row.clickCount >= activeProofMinClicks);
  const rankedRevenueRows = [...filteredRevenueRows].sort((a, b) => {
    const aRate = activeRevenueRank === "checkout" ? a.clickToCheckoutRate ?? -1 : a.clickToBookingRate ?? -1;
    const bRate = activeRevenueRank === "checkout" ? b.clickToCheckoutRate ?? -1 : b.clickToBookingRate ?? -1;
    if (bRate !== aRate) return bRate - aRate;
    return b.clickCount - a.clickCount;
  });
  const filteredRevenueSummary = {
    byCorridor: summarizeRevenueRows(filteredRevenueRows, (row) => row.corridorName),
    byRevenueMode: summarizeRevenueRows(filteredRevenueRows, (row) => row.revenueMode),
    byRevenueStage: summarizeRevenueRows(filteredRevenueRows, (row) => row.revenueStage),
    byTelemetryBucket: summarizeRevenueRows(filteredRevenueRows, (row) => row.telemetryBucket),
    byProvider: summarizeRevenueRows(filteredRevenueRows, (row) => row.provider),
    byRouteKey: summarizeRevenueRows(filteredRevenueRows, (row) => row.routeKey),
  };
  const airportPickupOrders = (await listStoredOrders("airport-420-pickup")).slice(0, 20);
  const confirmedAirportPickupOrders = airportPickupOrders.filter(isConfirmedOrder);
  const telemetryDebug = await getTelemetryDebugSnapshot(activeSatellite, snapshot.recentSptTokenEvents);
  const summaryItems = [
    { label: "Total users / handoffs", value: snapshot.totals.handoffs },
    { label: "Decision attempts", value: 0 },
    { label: "Primary CTA clicks", value: 0 },
    { label: "Alternative CTA clicks", value: 0 },
    { label: "booking_opened", value: 0 },
  ];
  const decisionEventNames = new Set([
    "destination_selected",
    "base_selected",
    "activity_selected",
    "transport_mode_selected",
  ]);
  const decisionEvents = recentProductionEvents.filter((event) => decisionEventNames.has(event.eventName));
  const decisionPrimaryClicks = recentProductionEvents.filter(
    (event) =>
      event.eventName === "cta_clicked_primary"
      && !(event.sourcePage || "").startsWith("/transportation/"),
  );
  const decisionAlternativeClicks = recentProductionEvents.filter(
    (event) =>
      event.eventName === "cta_clicked_alternative"
      && !(event.sourcePage || "").startsWith("/transportation/"),
  );
  const bookingOpenedEvents = recentProductionEvents.filter((event) => event.eventName === "booking_opened");
  const checkoutStartedEvents = recentProductionEvents.filter((event) => event.eventName === "checkout_started");
  const bookingCompletedEvents = recentProductionEvents.filter((event) => event.eventName === "booking_completed");
  const totalDecisionClicks = decisionPrimaryClicks.length + decisionAlternativeClicks.length;
  const defaultAcceptanceRate = totalDecisionClicks > 0 ? decisionPrimaryClicks.length / totalDecisionClicks : null;
  const defaultAcceptanceDisplay = formatPercentWithCounts(
    defaultAcceptanceRate,
    decisionPrimaryClicks.length,
    totalDecisionClicks,
  );
  summaryItems[1]!.value = decisionEvents.length;
  summaryItems[2]!.value = decisionPrimaryClicks.length;
  summaryItems[3]!.value = decisionAlternativeClicks.length;
  summaryItems[4]!.value = bookingOpenedEvents.length;
  summaryItems.push(
    { label: "checkout_started", value: checkoutStartedEvents.length },
    { label: "booking_completed", value: bookingCompletedEvents.length },
  );
  const corridorEventSummary = recentProductionEvents.reduce<
    Record<string, { decisions: number; primary: number; alternative: number; bookings: number; checkouts: number; completed: number }>
  >((acc, event) => {
    const key = event.corridorId;
    if (!key) return acc;
    acc[key] ||= { decisions: 0, primary: 0, alternative: 0, bookings: 0, checkouts: 0, completed: 0 };
    if (decisionEventNames.has(event.eventName)) acc[key]!.decisions += 1;
    if (event.eventName === "cta_clicked_primary" && !(event.sourcePage || "").startsWith("/transportation/")) {
      acc[key]!.primary += 1;
    }
    if (event.eventName === "cta_clicked_alternative" && !(event.sourcePage || "").startsWith("/transportation/")) {
      acc[key]!.alternative += 1;
    }
    if (event.eventName === "booking_opened") {
      acc[key]!.bookings += 1;
    }
    if (event.eventName === "checkout_started") {
      acc[key]!.checkouts += 1;
    }
    if (event.eventName === "booking_completed") {
      acc[key]!.completed += 1;
    }
    return acc;
  }, {});
  const corridorCards = snapshot.corridorRoster
    .map((row) => {
      const healthRow = snapshot.corridorHealthRows.find((health) => health.corridorId === row.corridorId) || null;
      const events = corridorEventSummary[row.corridorId] || {
        decisions: 0,
        primary: 0,
        alternative: 0,
        bookings: 0,
        checkouts: 0,
        completed: 0,
      };
      return {
        corridorId: row.corridorId,
        corridorName: row.corridorName,
        family: row.family,
        decisions: events.decisions,
        primary: events.primary,
        alternative: events.alternative,
        bookings: events.bookings,
        checkouts: events.checkouts,
        completed: events.completed,
        defaultAcceptanceRate:
          events.primary + events.alternative > 0
            ? events.primary / (events.primary + events.alternative)
            : healthRow?.recommendationAcceptanceRate ?? null,
      };
    })
    .sort((a, b) => (b.decisions + b.primary + b.bookings + b.checkouts + b.completed) - (a.decisions + a.primary + a.bookings + a.checkouts + a.completed));
  const focusedCorridorCards = ["partyatredrocks", "denver-to-mountains", "feastly-dinner-night"]
    .map((corridorId) => corridorCards.find((row) => row.corridorId === corridorId))
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
  const parrFocus = focusedCorridorCards.find((row) => row.corridorId === "partyatredrocks") || null;
  const argoFocus = focusedCorridorCards.find((row) => row.corridorId === "denver-to-mountains") || null;
  const feastlyFocus = focusedCorridorCards.find((row) => row.corridorId === "feastly-dinner-night") || null;
  const argoBookingToCheckoutRate =
    argoFocus && argoFocus.bookings > 0 ? argoFocus.checkouts / argoFocus.bookings : null;
  const parrObservedFlowEvents = (parrFocus?.checkouts ?? 0) + (parrFocus?.completed ?? 0);
  const parrHasCompletion = (parrFocus?.completed ?? 0) > 0;
  const feastlyTelemetryAnomaly = Boolean(
    feastlyFocus && feastlyFocus.completed > feastlyFocus.checkouts,
  );
  const defaultAcceptanceWeak = defaultAcceptanceRate !== null && defaultAcceptanceRate < 0.6;
  const visibleRevenueRows = rankedRevenueRows.slice(0, 8);
  const visibleMapperRows = snapshot.corridorMapper
    .filter((row) => row.clickCount > 0)
    .sort((a, b) => b.clickCount - a.clickCount)
    .slice(0, 8);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-[1800px] px-6 py-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight">DCC Telemetry Hub</h1>
            <p className="mt-2 text-sm text-zinc-300">
              Internal verification surface for the governed decision network: DCC decides, satellites compress, operators execute.
            </p>
            <p className="mt-2 text-zinc-300">
              Live database-backed handoff, degradation, and reconciliation view for the Command Center.
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
              Feed: {activeSatellite ? SATELLITE_LABELS[activeSatellite] : "All satellites"}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
              Corridor: {selectedCorridorHealth ? selectedCorridorHealth.corridorName : "All corridors"}
            </p>
          </div>
          <div
            className={`inline-flex rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${
              snapshot.connected
                ? "border-emerald-300/30 bg-emerald-500/10 text-emerald-100"
                : "border-amber-300/30 bg-amber-500/10 text-amber-100"
            }`}
          >
            {snapshot.connected ? "Neon Connected" : "No Database Configured"}
          </div>
        </div>
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Decision Health</div>
              <p className="mt-2 text-sm text-zinc-300">
                Early signal for whether people are choosing a path and taking the next step.
              </p>
            </div>
            <div className="text-sm text-zinc-300">
              Default acceptance: {defaultAcceptanceDisplay}
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {summaryItems.map((item) => (
              <div key={item.label} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">{item.label}</div>
                <div className="mt-3 text-3xl font-black text-white">{item.value}</div>
              </div>
            ))}
            <div className="rounded-xl border border-cyan-300/20 bg-cyan-500/10 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-cyan-100">Default acceptance rate</div>
              <div className="mt-3 text-3xl font-black text-white">{defaultAcceptanceDisplay}</div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-100">Telemetry Debug</div>
              <h2 className="mt-2 text-2xl font-black text-white">
                Why handoff rows can move while Decision Health stays flat
              </h2>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-cyan-50/80">
                Satellite rows read the handoff ledger. Decision Health reads the corridor-event funnel.
                Fresh <code className="rounded bg-black/30 px-1 py-0.5">handoff_viewed</code> rows from WTA update the ledger by design, but they do not count as decision attempts, CTA clicks, <code className="rounded bg-black/30 px-1 py-0.5">booking_opened</code>, checkout starts, or booking completions unless a matching corridor event is also written.
              </p>
            </div>
            <div className="rounded-full border border-cyan-200/30 bg-black/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-cyan-100">
              Read-only mapping
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 xl:col-span-1">
              <div className="text-xs uppercase tracking-[0.16em] text-cyan-100">Latest event by source</div>
              <div className="mt-4 space-y-3 text-sm">
                {telemetryDebug.latestBySource.map((row) => (
                  <div key={row.source} className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <div className="font-mono text-xs text-cyan-100">{row.source}</div>
                    <div className="mt-1 text-zinc-100">{formatDateTime(row.latestAt || undefined)}</div>
                    <div className="mt-1 text-xs leading-5 text-zinc-400">{row.note}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4 xl:col-span-2">
              <div className="text-xs uppercase tracking-[0.16em] text-cyan-100">Decision Health event-name mapping</div>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full table-auto text-left text-sm">
                  <thead className="border-b border-white/10 text-zinc-300">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Counter</th>
                      <th className="px-3 py-2 font-semibold">Source</th>
                      <th className="px-3 py-2 font-semibold">Included names</th>
                      <th className="px-3 py-2 font-semibold">Filter</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DECISION_HEALTH_MAPPING.map((row) => (
                      <tr key={row.label} className="border-b border-white/10">
                        <td className="px-3 py-3 font-semibold text-white">{row.label}</td>
                        <td className="px-3 py-3 font-mono text-xs text-cyan-100">{row.source}</td>
                        <td className="px-3 py-3 text-zinc-300">{row.eventNames.join(", ")}</td>
                        <td className="px-3 py-3 text-zinc-400">{row.filter}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-cyan-100">Corridor events by event_name</div>
              <div className="mt-4 max-h-[420px] overflow-auto">
                <table className="min-w-full table-auto text-left text-sm">
                  <thead className="sticky top-0 border-b border-white/10 bg-zinc-950 text-zinc-300">
                    <tr>
                      <th className="px-3 py-2 font-semibold">event_name</th>
                      <th className="px-3 py-2 font-semibold">24h</th>
                      <th className="px-3 py-2 font-semibold">7d</th>
                      <th className="px-3 py-2 font-semibold">All</th>
                      <th className="px-3 py-2 font-semibold">Included</th>
                      <th className="px-3 py-2 font-semibold">Latest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {telemetryDebug.corridorEventCounts.map((row) => (
                      <tr key={row.eventName} className="border-b border-white/10">
                        <td className="px-3 py-3 font-mono text-xs text-zinc-100">{row.eventName}</td>
                        <td className="px-3 py-3 text-zinc-300">{row.last24h}</td>
                        <td className="px-3 py-3 text-zinc-300">{row.last7d}</td>
                        <td className="px-3 py-3 text-zinc-300">{row.allTime}</td>
                        <td className={row.includedInDecisionHealth ? "px-3 py-3 text-emerald-200" : "px-3 py-3 text-zinc-500"}>
                          {row.includedInDecisionHealth ? "yes" : "no"}
                        </td>
                        <td className="px-3 py-3 text-xs text-zinc-400">{formatDateTime(row.latestAt || undefined)}</td>
                      </tr>
                    ))}
                    {telemetryDebug.corridorEventCounts.length === 0 ? (
                      <tr>
                        <td className="px-3 py-6 text-zinc-400" colSpan={6}>
                          No corridor events found.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-cyan-100">Satellite handoff events by event_type</div>
              <div className="mt-4 max-h-[420px] overflow-auto">
                <table className="min-w-full table-auto text-left text-sm">
                  <thead className="sticky top-0 border-b border-white/10 bg-zinc-950 text-zinc-300">
                    <tr>
                      <th className="px-3 py-2 font-semibold">event_type</th>
                      <th className="px-3 py-2 font-semibold">24h</th>
                      <th className="px-3 py-2 font-semibold">7d</th>
                      <th className="px-3 py-2 font-semibold">All</th>
                      <th className="px-3 py-2 font-semibold">Decision Health</th>
                      <th className="px-3 py-2 font-semibold">Latest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {telemetryDebug.satelliteEventCounts.map((row) => (
                      <tr key={row.eventName} className="border-b border-white/10">
                        <td className="px-3 py-3 font-mono text-xs text-zinc-100">{row.eventName}</td>
                        <td className="px-3 py-3 text-zinc-300">{row.last24h}</td>
                        <td className="px-3 py-3 text-zinc-300">{row.last7d}</td>
                        <td className="px-3 py-3 text-zinc-300">{row.allTime}</td>
                        <td className="px-3 py-3 text-zinc-500">no</td>
                        <td className="px-3 py-3 text-xs text-zinc-400">{formatDateTime(row.latestAt || undefined)}</td>
                      </tr>
                    ))}
                    {telemetryDebug.satelliteEventCounts.length === 0 ? (
                      <tr>
                        <td className="px-3 py-6 text-zinc-400" colSpan={6}>
                          No satellite handoff events found for this filter.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Operator Briefing</div>
              <p className="mt-2 text-sm text-zinc-300">
                Telemetry is the current operating signal, not final ground truth. Trust it after event firing, dedupe, internal API auth, and deploy email checks are passing.
              </p>
            </div>
            <div className="text-sm text-zinc-300">As of {formatDateTime(new Date().toISOString())}</div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-emerald-300/20 bg-emerald-500/10 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-emerald-100">PARR read</div>
              <h2 className="mt-2 text-lg font-black text-white">Protect the observed revenue path.</h2>
              <div className="mt-3 space-y-2 text-sm leading-6 text-zinc-200">
                <p><span className="font-bold text-white">Signal:</span> observed completions: {parrFocus?.completed ?? 0}; checkout starts: {parrFocus?.checkouts ?? 0}.</p>
                <p><span className="font-bold text-white">Diagnosis:</span> {parrHasCompletion ? "the flow has produced confirmed bookings, but volume is still too low for rate math." : "no completion signal in this event window yet."}</p>
                <p><span className="font-bold text-white">Next action:</span> {parrObservedFlowEvents > 20 ? "review volume-backed improvements without touching working checkout logic." : "do nothing to checkout; send more qualified traffic and wait for volume above 20."}</p>
              </div>
              <p className="mt-3 text-xs leading-5 text-emerald-100/80">
                Rule: any completion means protect the flow. Do not optimize PARR from {pluralizeEvents(parrObservedFlowEvents)}.
              </p>
            </article>

            <article className="rounded-xl border border-cyan-300/20 bg-cyan-500/10 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-cyan-100">Argo read</div>
              <h2 className="mt-2 text-lg font-black text-white">Watch booking-to-checkout movement.</h2>
              <div className="mt-3 space-y-2 text-sm leading-6 text-zinc-200">
                <p><span className="font-bold text-white">Signal:</span> {argoFocus?.bookings ?? 0} booking opens and {argoFocus?.checkouts ?? 0} checkout starts. Booking-to-checkout is {formatRate(argoBookingToCheckoutRate)}.</p>
                <p><span className="font-bold text-white">Diagnosis:</span> booking opens without checkout starts means commitment weakness, not necessarily product rejection.</p>
                <p><span className="font-bold text-white">Next action:</span> strengthen verdict and clarify timing, price, pickup, and return details above the CTA.</p>
              </div>
              <p className="mt-3 text-xs leading-5 text-cyan-100/80">
                Ranked causes: weak verdict, unclear pricing or timing, uncertainty about the experience, then CTA mismatch.
              </p>
            </article>

            <article className="rounded-xl border border-amber-300/20 bg-amber-500/10 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-amber-100">Feastly read</div>
              <h2 className="mt-2 text-lg font-black text-white">
                {feastlyTelemetryAnomaly ? "Tracking mismatch needs cleanup." : "Treat Feastly as experimental."}
              </h2>
              <div className="mt-3 space-y-2 text-sm leading-6 text-zinc-200">
                <p><span className="font-bold text-white">Signal:</span> {feastlyFocus?.checkouts ?? 0} checkout starts and {feastlyFocus?.completed ?? 0} completions.</p>
                <p><span className="font-bold text-white">Diagnosis:</span> {feastlyTelemetryAnomaly ? "completed exceeds started, which is impossible in a clean event sequence." : "metrics remain experimental until the event path is verified."}</p>
                <p><span className="font-bold text-white">Next action:</span> ignore conversion reads until the Feastly event pipeline is fixed.</p>
              </div>
              <p className="mt-3 text-xs leading-5 text-amber-100/80">
                {feastlyTelemetryAnomaly
                  ? "Completions exceeding checkout starts means attribution or event firing needs verification before reading conversion."
                  : "Do not push hard traffic until helper supply, proof, and event integrity are stronger."}
              </p>
            </article>

            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-zinc-400">Decision copy rule</div>
              <h2 className="mt-2 text-lg font-black text-white">Answer what to change right now.</h2>
              <div className="mt-3 space-y-2 text-sm leading-6 text-zinc-300">
                <p><span className="font-bold text-white">Signal:</span> default acceptance is {defaultAcceptanceDisplay}.</p>
                <p><span className="font-bold text-white">Diagnosis:</span> {defaultAcceptanceWeak ? "verdict is probably too soft." : "primary recommendation is clearing the current threshold."}</p>
                <p><span className="font-bold text-white">Next action:</span> {defaultAcceptanceWeak ? "rewrite aggressively: clearer verdict, one primary CTA, less hedging." : "watch for traffic and checkout drop-off before rewriting."}</p>
              </div>
              <p className="mt-3 text-xs leading-5 text-zinc-400">
                Rule: below 60% acceptance means the page is likely not decisive enough. The dashboard should answer what to change, not just what happened.
              </p>
            </article>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Red Rocks And Denver To Mountains</div>
              <p className="mt-2 text-sm text-zinc-300">
                Focus on the two decision lanes most likely to matter right now.
              </p>
            </div>
            <div className="text-sm text-zinc-300">{focusedCorridorCards.length} corridors in focus</div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {focusedCorridorCards.map((row) => (
              <div key={row.corridorId} className="rounded-xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">{row.family}</div>
                    <div className="mt-2 text-2xl font-black text-white">{row.corridorName}</div>
                  </div>
                  <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs uppercase tracking-[0.14em] text-zinc-300">
                    {formatPercentWithCounts(row.defaultAcceptanceRate, row.primary, row.primary + row.alternative)}
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-zinc-500">Decisions</div>
                    <div className="mt-1 text-2xl font-bold text-white">{row.decisions}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-zinc-500">Primary</div>
                    <div className="mt-1 text-2xl font-bold text-white">{row.primary}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-zinc-500">Alternative</div>
                    <div className="mt-1 text-2xl font-bold text-white">{row.alternative}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-zinc-500">Booking opened</div>
                    <div className="mt-1 text-2xl font-bold text-white">{row.bookings}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-zinc-500">Checkout started</div>
                    <div className="mt-1 text-2xl font-bold text-white">{row.checkouts}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-zinc-500">Booking completed</div>
                    <div className="mt-1 text-2xl font-bold text-white">{row.completed}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {filteredRevenueRows.length > 0 ? (
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">What made money</div>
              <p className="mt-2 text-sm text-zinc-300">
                The routes that produced the strongest downstream booking and checkout intent.
              </p>
            </div>
            <div className="text-sm text-zinc-300">{filteredRevenueRows.length} governed revenue routes observed</div>
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">Top revenue modes</div>
              <p className="mt-3 text-sm leading-7 text-zinc-300">
                {renderTopSummary(filteredRevenueSummary.byRevenueMode)}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">Top stages</div>
              <p className="mt-3 text-sm leading-7 text-zinc-300">
                {renderTopSummary(filteredRevenueSummary.byRevenueStage)}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">Top telemetry buckets</div>
              <p className="mt-3 text-sm leading-7 text-zinc-300">
                {renderTopSummary(filteredRevenueSummary.byTelemetryBucket)}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">Top corridors</div>
              <p className="mt-3 text-sm leading-7 text-zinc-300">
                {renderTopSummary(filteredRevenueSummary.byCorridor)}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">Top providers</div>
              <p className="mt-3 text-sm leading-7 text-zinc-300">
                {renderTopSummary(filteredRevenueSummary.byProvider)}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">Top route keys</div>
              <p className="mt-3 text-sm leading-7 text-zinc-300">
                {renderTopSummary(filteredRevenueSummary.byRouteKey)}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {visibleRevenueRows.map((row) => (
              <div
                key={`${row.corridorId}-${row.revenueBehaviorId}-${row.routeKey}-${row.provider}-${row.telemetryBucket}`}
                className="rounded-xl border border-white/10 bg-black/20 p-4"
              >
                <div className="text-xs uppercase tracking-[0.14em] text-zinc-500">{row.corridorName}</div>
                <div className="mt-2 text-lg font-bold text-white">{row.routeKey}</div>
                <div className="mt-3 space-y-1 text-sm text-zinc-300">
                  <div>{row.clickCount} clicks</div>
                  <div>Booking: {renderExperimentPercent(row.clickToBookingRate, row.clickCount)}</div>
                  <div>Checkout: {renderExperimentPercent(row.clickToCheckoutRate, row.clickCount)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
        ) : null}

        {snapshot.corridorMapper.length > 0 ? (
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Where clicks went</div>
              <p className="mt-2 text-sm text-zinc-300">
                The mapped routes that actually got clicked.
              </p>
            </div>
            <div className="text-sm text-zinc-300">{snapshot.corridorMapper.length} mapped routes observed</div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {visibleMapperRows.map((row) => (
              <div
                key={`${row.corridorId}-${row.routeKey}-${row.provider}-${row.targetKind}-${row.operatorId || "none"}`}
                className="rounded-xl border border-white/10 bg-black/20 p-4"
              >
                <div className="text-xs uppercase tracking-[0.14em] text-zinc-500">{row.corridorName}</div>
                <div className="mt-2 text-lg font-bold text-white">{row.routeKey}</div>
                <div className="mt-3 space-y-1 text-sm text-zinc-300">
                  <div>{row.clickCount} clicks</div>
                  <div>{row.provider} • {row.targetKind}</div>
                  <div>Booking: {renderExperimentPercent(row.clickToBookingRate, row.clickCount)}</div>
                  <div>Checkout: {renderExperimentPercent(row.clickToCheckoutRate, row.clickCount)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
        ) : null}

        <ExitTelemetryPanel />

        {airportPickupOrders.length > 0 ? (
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">420 Pickup Dispatch</div>
              <p className="mt-2 text-sm text-zinc-300">
                Flight and dispensary context from the DCC-native airport pickup checkout flow.
              </p>
            </div>
            <div className="text-sm text-zinc-300">
              {confirmedAirportPickupOrders.length} confirmed / {airportPickupOrders.length} recent orders
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full table-auto text-left text-sm">
              <thead className="border-b border-white/10 bg-black/30 text-zinc-300">
                <tr>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Created</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Order</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Handoff</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Flight</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Dispensary</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Pickup</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Customer</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody>
                {airportPickupOrders.map((order) => (
                  <tr key={order.orderId} className="border-b border-white/10">
                    <td className="px-3 py-3 whitespace-nowrap text-zinc-300">{formatDateTime(order.createdAt)}</td>
                    <td className="px-3 py-3 font-mono text-[11px] break-all text-cyan-200">{order.orderId}</td>
                    <td className="px-3 py-3 font-mono text-[11px] break-all text-zinc-300">{order.handoffId || "—"}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-zinc-300">{order.tripContext?.flightNumber || "—"}</td>
                    <td className="px-3 py-3 text-zinc-300">{order.tripContext?.dispensaryPreference || "—"}</td>
                    <td className="px-3 py-3 text-zinc-300">
                      <div>{order.pickup || "—"}</div>
                      <div className="mt-1 text-xs text-zinc-500">{order.pickupTime || "Arrival-based"}</div>
                    </td>
                    <td className="px-3 py-3 text-zinc-300">
                      <div>{order.customer?.name || "—"}</div>
                      <div className="mt-1 text-xs break-all text-zinc-500">
                        {order.customer?.phone || order.customer?.email || "No contact"}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-zinc-300">
                      <div>{order.payment?.status || order.status || "pending"}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {isConfirmedOrder(order) ? "confirmed" : "awaiting payment"}
                      </div>
                    </td>
                  </tr>
                ))}
                {airportPickupOrders.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-zinc-400" colSpan={8}>
                      No 420 airport pickup orders have been recorded yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
        ) : null}

        {snapshot.recentSptTokenEvents.length > 0 ? (
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">SPT Token Handoffs</div>
              <p className="mt-2 text-sm text-zinc-300">
                Creation, resolution, invalidation, and legacy-query fallback for corridor-driven checkout launches.
              </p>
            </div>
            <div className="text-sm text-zinc-300">
              {snapshot.recentSptTokenEvents.length} recent token events
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full table-auto text-left text-sm">
              <thead className="border-b border-white/10 bg-black/30 text-zinc-300">
                <tr>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Created</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Event</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Status</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Corridor</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Route</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Source</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Token</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.recentSptTokenEvents.map((event) => (
                  <tr key={event.id} className="border-b border-white/10">
                    <td className="px-3 py-3 whitespace-nowrap text-zinc-300">{formatDateTime(event.createdAt)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-zinc-100">{event.eventType}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-zinc-300">{event.status || "—"}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-zinc-300">{event.corridorId || "—"}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-zinc-300">{event.route || "—"}</td>
                    <td className="px-3 py-3 text-zinc-300">
                      <div className="max-w-[260px] truncate">{event.sourcePage || "—"}</div>
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] break-all text-cyan-200">{event.token || "—"}</td>
                  </tr>
                ))}
                {snapshot.recentSptTokenEvents.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-zinc-400" colSpan={7}>
                      No token events have been recorded yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
        ) : null}

        <section className="mt-6 flex flex-wrap gap-2">
          <a
            href="/internal/telemetry"
            className={`rounded-full border px-4 py-2 text-sm ${
              activeSatellite
                ? "border-white/10 bg-black/30 text-zinc-300"
                : "border-cyan-300/40 bg-cyan-400/10 text-cyan-100"
            }`}
          >
            All
          </a>
          {SATELLITE_IDS.map((satelliteId) => (
            <a
              key={satelliteId}
              href={`/internal/telemetry?satellite=${encodeURIComponent(satelliteId)}`}
              className={`rounded-full border px-4 py-2 text-sm ${
                activeSatellite === satelliteId
                  ? "border-cyan-300/40 bg-cyan-400/10 text-cyan-100"
                  : "border-white/10 bg-black/30 text-zinc-300"
              }`}
            >
              {SATELLITE_LABELS[satelliteId]}
            </a>
          ))}
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-6">
            {snapshot.bySatellite.length > 0 ? (
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">By Satellite</div>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                {snapshot.bySatellite.map((row) => (
                  <div key={row.satelliteId} className="flex items-center justify-between gap-3">
                    <span>{row.satelliteId}</span>
                    <span className="text-zinc-100">{row.count}</span>
                  </div>
                ))}
              </div>
            </section>
            ) : null}

            {snapshot.degradedRows.length > 0 ? (
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Degraded Lanes</div>
              <div className="mt-4 space-y-3 text-sm text-zinc-300">
                {snapshot.degradedRows.map((row) => (
                  <div key={row.handoffId} className="rounded-xl border border-amber-300/20 bg-amber-400/10 p-3">
                    <div className="font-mono text-[11px] text-cyan-200">{row.handoffId}</div>
                    <div className="mt-2 font-semibold text-zinc-100">{row.satelliteId}</div>
                    <div className="mt-1 text-zinc-300">
                      {row.bookingVenueSlug || row.bookingPortSlug || row.bookingProductSlug || "No booking context"}
                    </div>
                    <div className="mt-1 text-xs text-zinc-400">
                      {row.latestEventType}
                      {row.latestStatus ? ` • ${row.latestStatus}` : ""}
                      {row.latestStage ? ` • ${row.latestStage}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </section>
            ) : null}

            {snapshot.recentReconciliation.length > 0 ? (
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Recent Reconciliation</div>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                {snapshot.recentReconciliation.map((row) => (
                  <div key={`${row.provider}:${row.providerReference}`} className="flex items-start justify-between gap-3">
                    <span className="truncate">
                      {row.provider} / {row.providerType}
                    </span>
                    <span className="text-zinc-100">{row.status}</span>
                  </div>
                ))}
              </div>
            </section>
            ) : null}
          </aside>

          <section className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
            <table className="min-w-full table-auto text-left text-sm">
              <thead className="border-b border-white/10 bg-black/30 text-zinc-300">
                <tr>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Satellite</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Handoff</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Source</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Product / Place</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Latest</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Flags</th>
                  <th className="px-3 py-3 font-semibold whitespace-nowrap">Updated</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.recentSummaries.map((row) => (
                  <tr key={`${row.satelliteId}:${row.handoffId}`} className="border-b border-white/10">
                    <td className="px-3 py-3 whitespace-nowrap text-zinc-300">{row.satelliteId}</td>
                    <td className="px-3 py-3 font-mono text-[11px] break-all text-cyan-200">{row.handoffId}</td>
                    <td className="px-3 py-3 text-zinc-300">
                      <div className="max-w-[240px] truncate">{row.attributionSourcePage || "—"}</div>
                      <div className="mt-1 text-xs text-zinc-500">{row.attributionSourceSlug || "No source slug"}</div>
                    </td>
                    <td className="px-3 py-3 text-zinc-300">
                      <div>{row.bookingProductSlug || "—"}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {row.bookingVenueSlug || row.bookingPortSlug || row.bookingCitySlug || "No place context"}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-zinc-100">
                      <div>{row.latestEventType}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {[row.latestStatus, row.latestStage].filter(Boolean).join(" • ") || "—"}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-zinc-300">
                      <div>{row.eventCount} events</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {row.degraded ? "degraded" : "healthy"}
                        {row.converted ? " • converted" : ""}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-zinc-300">
                      {new Date(row.lastEventAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {snapshot.recentSummaries.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-zinc-400" colSpan={7}>
                      No durable telemetry rows have been recorded yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </main>
  );
}
