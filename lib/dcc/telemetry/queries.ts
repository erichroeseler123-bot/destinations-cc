import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  dccHandoffSummaries,
  dccReconciliation,
  type DccHandoffSummaryRow,
  type DccReconciliationRow,
} from "@/lib/db/schema";
import { type DccSatelliteId } from "@/lib/dcc/satelliteHandoffs";
import { listRecentSptTokenEvents, type SptTokenEventRow } from "@/lib/spt/tokenTelemetry";
import {
  get420BroadArrivalExperimentRows,
  getCorridorDiagnosticRows,
  getCorridorMapperRows,
  getCorridorPerformanceRows,
  getCorridorRevenueSnapshot,
  listRecentProductionCorridorEvents,
} from "@/lib/dcc/telemetry/corridorEvents";
import {
  buildDecisionFidelityComparisonRows,
  buildDecisionFidelityMetricsFromEvents,
  type DecisionFidelityComparisonRow,
  type DecisionFidelityMetrics,
} from "@/lib/dcc/telemetry/decisionFidelity";
import { LIVE_CORRIDOR_CATALOG } from "@/lib/dcc/telemetry/corridorCatalog";
import type { DccCorridorEventRow } from "@/lib/db/schema";

export type TelemetryDashboardSnapshot = {
  connected: boolean;
  totals: {
    handoffs: number;
    degraded: number;
    converted: number;
    recognizedRevenue: number;
  };
  bySatellite: Array<{ satelliteId: string; count: number }>;
  degradedRows: DccHandoffSummaryRow[];
  recentSummaries: DccHandoffSummaryRow[];
  recentReconciliation: DccReconciliationRow[];
  recentSptTokenEvents: SptTokenEventRow[];
  corridorRoster: Array<{
    corridorId: string;
    corridorName: string;
    family: string;
    appPath: string;
    status: string;
    continuityLevel: string;
    patternFamily: string;
  }>;
  corridorPerformance: Awaited<ReturnType<typeof getCorridorPerformanceRows>>;
  corridorMapper: Awaited<ReturnType<typeof getCorridorMapperRows>>;
  corridorRevenue: Awaited<ReturnType<typeof getCorridorRevenueSnapshot>>;
  corridorDiagnostics: Awaited<ReturnType<typeof getCorridorDiagnosticRows>>;
  airport420Experiment: Awaited<ReturnType<typeof get420BroadArrivalExperimentRows>>;
  corridorHealthRows: CorridorHealthRow[];
  selectedCorridorHealth: CorridorHealthSnapshot | null;
};

export type CorridorDecisionSplitRow = {
  destination: string;
  selectedCount: number;
  selectedRate: number | null;
};

export type CorridorDefaultAcceptanceRow = {
  sourcePage: string;
  defaultOption: string;
  defaultSelections: number;
  totalSelections: number;
  defaultAcceptanceRate: number | null;
};

export type CorridorDefaultComparisonRow = {
  sourcePage: string;
  defaultOption: string;
  defaultRate: number | null;
  secondOption: string;
  secondRate: number | null;
  gapRate: number | null;
};

export type CorridorSelectionSplitRow = {
  sourcePage: string;
  option: string;
  selectedCount: number;
  selectedRate: number | null;
};

export type CorridorSourceDestinationRow = {
  sourcePage: string;
  destination: string;
  count: number;
};

export type CorridorDestinationConversionRow = {
  destination: string;
  selectedCount: number;
  checkoutStarts: number;
  checkoutRate: number | null;
};

export type CorridorDecisionMetrics = {
  recommendationAcceptanceRate: number | null;
  defaultAcceptanceRate: number | null;
  alternativeClickRate: number | null;
  totalDecisionViews: number;
  primaryCtaClicks: number;
  alternativeCtaClicks: number;
  totalCtaClicks: number;
  timeToDecisionSeconds: number | null;
  decisionSplit: CorridorDecisionSplitRow[];
  selectionSplitByPage: CorridorSelectionSplitRow[];
  defaultAcceptanceByPage: CorridorDefaultAcceptanceRow[];
  defaultComparisonByPage: CorridorDefaultComparisonRow[];
};

export type CorridorHandoffMetrics = {
  executionPageLoads: number;
  handoffReceived: number;
  handoffMissing: number;
  handoffIntegrityRate: number | null;
  handoffMissingRate: number | null;
  sourceDestinationMap: CorridorSourceDestinationRow[];
};

export type CorridorExecutionMetrics = {
  destinationSelections: number;
  executionPageLoads: number;
  executionEngagementClicks: number;
  decisionToExecutionConversionRate: number | null;
  executionEngagementRate: number | null;
  executionDropOffRate: number | null;
};

export type CorridorFunnelMetrics = {
  destinationSelected: number;
  executionPageLoaded: number;
  checkoutStarted: number;
  destinationConversion: CorridorDestinationConversionRow[];
};

export type CorridorHealthRow = {
  corridorId: string;
  corridorName: string;
  score: number | null;
  recommendationAcceptanceRate: number | null;
  handoffIntegrityRate: number | null;
  executionConversionRate: number | null;
  checkoutRate: number | null;
};

export type CorridorHealthSnapshot = {
  corridorId: string;
  corridorName: string;
  decision: CorridorDecisionMetrics;
  handoff: CorridorHandoffMetrics;
  execution: CorridorExecutionMetrics;
  funnel: CorridorFunnelMetrics;
  healthScore: number | null;
};

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function ratio(numerator: number, denominator: number) {
  if (!denominator) return null;
  return numerator / denominator;
}

function metadataBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  return false;
}

function isDefaultSelectionEvent(event: DccCorridorEventRow) {
  if (metadataBoolean(event.metadata?.is_default_selected)) return true;
  return metadataBoolean(event.metadata?.default_exposed);
}

function normalizeDestinationIdentity(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "";
  if (normalized.includes("://")) return "";
  if (normalized.startsWith("/")) return "";
  if (normalized.endsWith("-route")) return normalized.slice(0, -"-route".length);
  return normalized;
}

function eventDestination(event: DccCorridorEventRow) {
  const routeTarget = typeof event.routeTarget === "string" ? normalizeDestinationIdentity(event.routeTarget) : "";
  if (routeTarget) return routeTarget;
  const fitSignal = typeof event.fitSignal === "string" ? normalizeDestinationIdentity(event.fitSignal) : "";
  if (fitSignal) return fitSignal;
  return "unknown";
}

function sourceDestinationMap(events: DccCorridorEventRow[]) {
  const counts = new Map<string, number>();
  for (const event of events) {
    const source = event.sourcePage || "unknown";
    const destination = eventDestination(event);
    const key = `${source}::${destination}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([key, count]) => {
      const [sourcePage, destination] = key.split("::");
      return { sourcePage, destination, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function buildDefaultAcceptanceByPage(events: DccCorridorEventRow[]) {
  const selectionEvents = events.filter((event) =>
    ["destination_selected", "base_selected", "activity_selected", "transport_mode_selected"].includes(event.eventName)
  );

  const pageCounts = new Map<
    string,
    { totalSelections: number; defaultSelections: number; defaultOption: string }
  >();

  for (const event of selectionEvents) {
    const sourcePage = event.sourcePage || "unknown";
    const destination = eventDestination(event);
    const entry = pageCounts.get(sourcePage) || {
      totalSelections: 0,
      defaultSelections: 0,
      defaultOption: "",
    };

    entry.totalSelections += 1;
    if (isDefaultSelectionEvent(event)) {
      entry.defaultSelections += 1;
      if (!entry.defaultOption) entry.defaultOption = destination;
    }

    pageCounts.set(sourcePage, entry);
  }

  return Array.from(pageCounts.entries())
    .map(([sourcePage, entry]) => ({
      sourcePage,
      defaultOption: entry.defaultOption || "unknown",
      defaultSelections: entry.defaultSelections,
      totalSelections: entry.totalSelections,
      defaultAcceptanceRate: ratio(entry.defaultSelections, entry.totalSelections),
    }))
    .sort((a, b) => b.totalSelections - a.totalSelections);
}

function buildDefaultComparisonByPage(events: DccCorridorEventRow[]) {
  const selectionEvents = events.filter((event) =>
    ["destination_selected", "base_selected", "activity_selected", "transport_mode_selected"].includes(event.eventName)
  );

  const perPage = new Map<
    string,
    {
      totalSelections: number;
      optionCounts: Map<string, number>;
      defaultOption: string;
    }
  >();

  for (const event of selectionEvents) {
    const sourcePage = event.sourcePage || "unknown";
    const option = eventDestination(event);
    const entry = perPage.get(sourcePage) || {
      totalSelections: 0,
      optionCounts: new Map<string, number>(),
      defaultOption: "",
    };

    entry.totalSelections += 1;
    entry.optionCounts.set(option, (entry.optionCounts.get(option) || 0) + 1);
    if (isDefaultSelectionEvent(event) && !entry.defaultOption) {
      entry.defaultOption = option;
    }

    perPage.set(sourcePage, entry);
  }

  return Array.from(perPage.entries())
    .map(([sourcePage, entry]) => {
      const sortedOptions = Array.from(entry.optionCounts.entries()).sort((a, b) => b[1] - a[1]);
      const defaultOption = entry.defaultOption || sortedOptions[0]?.[0] || "unknown";
      const defaultCount = entry.optionCounts.get(defaultOption) || 0;
      const second = sortedOptions.find(([option]) => option !== defaultOption) || ["none", 0];
      const defaultRate = ratio(defaultCount, entry.totalSelections);
      const secondRate = ratio(second[1], entry.totalSelections);
      return {
        sourcePage,
        defaultOption,
        defaultRate,
        secondOption: second[0],
        secondRate,
        gapRate:
          defaultRate !== null && secondRate !== null ? defaultRate - secondRate : null,
      };
    })
    .sort((a, b) => {
      const aRate = a.defaultRate ?? -1;
      const bRate = b.defaultRate ?? -1;
      return bRate - aRate;
    });
}

function buildSelectionSplitByPage(events: DccCorridorEventRow[]) {
  const selectionEvents = events.filter((event) =>
    ["destination_selected", "base_selected", "activity_selected", "transport_mode_selected"].includes(event.eventName)
  );

  const perPage = new Map<string, { totalSelections: number; optionCounts: Map<string, number> }>();

  for (const event of selectionEvents) {
    const sourcePage = event.sourcePage || "unknown";
    const option = eventDestination(event);
    const entry = perPage.get(sourcePage) || {
      totalSelections: 0,
      optionCounts: new Map<string, number>(),
    };

    entry.totalSelections += 1;
    entry.optionCounts.set(option, (entry.optionCounts.get(option) || 0) + 1);
    perPage.set(sourcePage, entry);
  }

  return Array.from(perPage.entries())
    .flatMap(([sourcePage, entry]) =>
      Array.from(entry.optionCounts.entries())
        .map(([option, selectedCount]) => ({
          sourcePage,
          option,
          selectedCount,
          selectedRate: ratio(selectedCount, entry.totalSelections),
        }))
        .sort((a, b) => b.selectedCount - a.selectedCount)
    )
    .sort((a, b) => {
      if (a.sourcePage === b.sourcePage) return b.selectedCount - a.selectedCount;
      return a.sourcePage.localeCompare(b.sourcePage);
    });
}

function buildCorridorHealthSnapshotFromEvents(
  corridorId: string,
  corridorName: string,
  events: DccCorridorEventRow[],
): CorridorHealthSnapshot {
  const decisionViews = events.filter(
    (event) => event.eventName === "handoff_viewed" && ["hub", "feeder"].includes(String(event.metadata?.page_role || "")),
  );
  const primaryCtaClicks = events.filter(
    (event) => event.eventName === "cta_clicked_primary" && !String(event.sourcePage || "").startsWith("/transportation/"),
  );
  const alternativeCtaClicks = events.filter(
    (event) => event.eventName === "cta_clicked_alternative" && !String(event.sourcePage || "").startsWith("/transportation/"),
  );
  const destinationSelections = events.filter((event) => event.eventName === "destination_selected");
  const executionPageLoads = events.filter((event) => event.eventName === "execution_page_loaded");
  const handoffReceived = events.filter((event) => event.eventName === "handoff_received");
  const handoffMissing = events.filter((event) => event.eventName === "handoff_missing");
  const executionEngagementClicks = events.filter(
    (event) =>
      event.eventName === "booking_opened" ||
      (event.eventName === "cta_clicked_primary" && String(event.sourcePage || "").startsWith("/transportation/")),
  );
  const checkoutStarted = events.filter((event) => event.eventName === "checkout_started");

  const decisionDestinationCounts = new Map<string, number>();
  for (const event of destinationSelections) {
    const destination = eventDestination(event);
    decisionDestinationCounts.set(destination, (decisionDestinationCounts.get(destination) || 0) + 1);
  }

  const decisionSplit = Array.from(decisionDestinationCounts.entries())
    .map(([destination, selectedCount]) => ({
      destination,
      selectedCount,
      selectedRate: ratio(selectedCount, destinationSelections.length),
    }))
    .sort((a, b) => b.selectedCount - a.selectedCount);

  const selectionSplitByPage = buildSelectionSplitByPage(events);
  const defaultAcceptanceByPage = buildDefaultAcceptanceByPage(events);
  const defaultComparisonByPage = buildDefaultComparisonByPage(events);
  const totalDefaultSelections = defaultAcceptanceByPage.reduce(
    (sum, row) => sum + row.defaultSelections,
    0,
  );
  const totalSelectionsAcrossPages = defaultAcceptanceByPage.reduce(
    (sum, row) => sum + row.totalSelections,
    0,
  );

  const checkoutByDestination = new Map<string, number>();
  for (const event of checkoutStarted) {
    const destination = eventDestination(event);
    checkoutByDestination.set(destination, (checkoutByDestination.get(destination) || 0) + 1);
  }

  const destinationConversion = Array.from(decisionDestinationCounts.entries())
    .map(([destination, selectedCount]) => {
      const starts = checkoutByDestination.get(destination) || 0;
      return {
        destination,
        selectedCount,
        checkoutStarts: starts,
        checkoutRate: ratio(starts, selectedCount),
      };
    })
    .sort((a, b) => b.selectedCount - a.selectedCount);

  const decision: CorridorDecisionMetrics = {
    recommendationAcceptanceRate: ratio(primaryCtaClicks.length, decisionViews.length),
    defaultAcceptanceRate: ratio(totalDefaultSelections, totalSelectionsAcrossPages),
    alternativeClickRate: ratio(alternativeCtaClicks.length, primaryCtaClicks.length + alternativeCtaClicks.length),
    totalDecisionViews: decisionViews.length,
    primaryCtaClicks: primaryCtaClicks.length,
    alternativeCtaClicks: alternativeCtaClicks.length,
    totalCtaClicks: primaryCtaClicks.length + alternativeCtaClicks.length,
    timeToDecisionSeconds: null,
    decisionSplit,
    selectionSplitByPage,
    defaultAcceptanceByPage,
    defaultComparisonByPage,
  };

  const handoff: CorridorHandoffMetrics = {
    executionPageLoads: executionPageLoads.length,
    handoffReceived: handoffReceived.length,
    handoffMissing: handoffMissing.length,
    handoffIntegrityRate: ratio(handoffReceived.length, executionPageLoads.length),
    handoffMissingRate: ratio(handoffMissing.length, executionPageLoads.length),
    sourceDestinationMap: sourceDestinationMap(destinationSelections),
  };

  const execution: CorridorExecutionMetrics = {
    destinationSelections: destinationSelections.length,
    executionPageLoads: executionPageLoads.length,
    executionEngagementClicks: executionEngagementClicks.length,
    decisionToExecutionConversionRate: ratio(handoffReceived.length, destinationSelections.length),
    executionEngagementRate: ratio(executionEngagementClicks.length, executionPageLoads.length),
    executionDropOffRate:
      executionPageLoads.length > 0 && executionEngagementClicks.length >= 0
        ? 1 - executionEngagementClicks.length / executionPageLoads.length
        : null,
  };

  const funnel: CorridorFunnelMetrics = {
    destinationSelected: destinationSelections.length,
    executionPageLoaded: executionPageLoads.length,
    checkoutStarted: checkoutStarted.length,
    destinationConversion,
  };

  const checkoutRate = ratio(checkoutStarted.length, executionPageLoads.length);
  const weightedParts = [
    decision.recommendationAcceptanceRate,
    handoff.handoffIntegrityRate,
    execution.decisionToExecutionConversionRate,
    checkoutRate,
  ];
  const healthScore =
    weightedParts.every((value) => value !== null)
      ? decision.recommendationAcceptanceRate! * 0.3 +
        handoff.handoffIntegrityRate! * 0.3 +
        execution.decisionToExecutionConversionRate! * 0.2 +
        checkoutRate! * 0.2
      : null;

  return {
    corridorId,
    corridorName,
    decision,
    handoff,
    execution,
    funnel,
    healthScore,
  };
}

export async function getDecisionFidelityMetrics(
  corridorIds = ["argo-day-transport", "partyatredrocks"],
  limit = 5000,
): Promise<DecisionFidelityMetrics[]> {
  const events = await listRecentProductionCorridorEvents(limit);
  return corridorIds.map((corridorId) => {
    const corridor = LIVE_CORRIDOR_CATALOG.find((entry) => entry.corridorId === corridorId);
    return buildDecisionFidelityMetricsFromEvents(
      corridorId,
      corridor?.corridorName || corridorId,
      events.filter((event) => event.corridorId === corridorId),
    );
  });
}

export async function getArgoVsRedRocksDecisionFidelityComparison(limit = 5000): Promise<DecisionFidelityComparisonRow[]> {
  const [argo, redRocks] = await getDecisionFidelityMetrics(["argo-day-transport", "partyatredrocks"], limit);
  return buildDecisionFidelityComparisonRows(argo, redRocks);
}

export async function getCorridorHealthSnapshot(corridorId: string, limit = 5000): Promise<CorridorHealthSnapshot | null> {
  const corridor = LIVE_CORRIDOR_CATALOG.find((entry) => entry.corridorId === corridorId);
  if (!corridor) return null;
  const events = await listRecentProductionCorridorEvents(limit);
  const corridorEvents = events.filter((event) => event.corridorId === corridorId);
  return buildCorridorHealthSnapshotFromEvents(corridorId, corridor.corridorName, corridorEvents);
}

export async function getCorridorHealthRows(limit = 5000): Promise<CorridorHealthRow[]> {
  const events = await listRecentProductionCorridorEvents(limit);
  return LIVE_CORRIDOR_CATALOG.map((corridor) => {
    const snapshot = buildCorridorHealthSnapshotFromEvents(
      corridor.corridorId,
      corridor.corridorName,
      events.filter((event) => event.corridorId === corridor.corridorId),
    );
    const checkoutRate = ratio(snapshot.funnel.checkoutStarted, snapshot.execution.executionPageLoads);
    return {
      corridorId: corridor.corridorId,
      corridorName: corridor.corridorName,
      score: snapshot.healthScore === null ? null : Math.round(snapshot.healthScore * 100),
      recommendationAcceptanceRate: snapshot.decision.recommendationAcceptanceRate,
      handoffIntegrityRate: snapshot.handoff.handoffIntegrityRate,
      executionConversionRate: snapshot.execution.decisionToExecutionConversionRate,
      checkoutRate,
    };
  });
}

export async function getTelemetryDashboardSnapshot(
  satelliteId?: DccSatelliteId | null
): Promise<TelemetryDashboardSnapshot> {
  const db = getDb();
  if (!db) {
    return {
      connected: false,
      totals: { handoffs: 0, degraded: 0, converted: 0, recognizedRevenue: 0 },
      bySatellite: [],
      degradedRows: [],
      recentSummaries: [],
      recentReconciliation: [],
      recentSptTokenEvents: [],
      corridorRoster: LIVE_CORRIDOR_CATALOG.map((entry) => ({
        corridorId: entry.corridorId,
        corridorName: entry.corridorName,
        family: entry.family,
        appPath: entry.appPath,
        status: entry.status,
        continuityLevel: entry.continuityLevel,
        patternFamily: entry.patternFamily,
      })),
      corridorPerformance: await getCorridorPerformanceRows(0),
      corridorMapper: [],
      corridorRevenue: {
        rows: [],
        byCorridor: [],
        byRevenueMode: [],
        byRevenueStage: [],
        byTelemetryBucket: [],
        byProvider: [],
        byRouteKey: [],
      },
      corridorDiagnostics: [],
      airport420Experiment: [],
      corridorHealthRows: [],
      selectedCorridorHealth: null,
    };
  }

  const [totalsRow] = await db
    .select({
      handoffs: sql<number>`count(*)::int`,
      degraded: sql<number>`count(*) filter (where ${dccHandoffSummaries.degraded})::int`,
      converted: sql<number>`count(*) filter (where ${dccHandoffSummaries.converted})::int`,
      recognizedRevenue:
        sql<number>`coalesce(sum(${dccHandoffSummaries.recognizedRevenue}), 0)::numeric`,
    })
    .from(dccHandoffSummaries)
    .where(satelliteId ? eq(dccHandoffSummaries.satelliteId, satelliteId) : undefined);

  const bySatellite = await db
    .select({
      satelliteId: dccHandoffSummaries.satelliteId,
      count: sql<number>`count(*)::int`,
    })
    .from(dccHandoffSummaries)
    .groupBy(dccHandoffSummaries.satelliteId)
    .orderBy(desc(sql`count(*)`));

  const degradedRows = await db
    .select()
    .from(dccHandoffSummaries)
    .where(
      satelliteId
        ? sql`${dccHandoffSummaries.degraded} and ${dccHandoffSummaries.satelliteId} = ${satelliteId}`
        : eq(dccHandoffSummaries.degraded, true)
    )
    .orderBy(desc(dccHandoffSummaries.lastEventAt))
    .limit(10);

  const recentSummaries = await db
    .select()
    .from(dccHandoffSummaries)
    .where(satelliteId ? eq(dccHandoffSummaries.satelliteId, satelliteId) : undefined)
    .orderBy(desc(dccHandoffSummaries.lastEventAt))
    .limit(50);

  const recentReconciliation = await db
    .select()
    .from(dccReconciliation)
    .orderBy(desc(dccReconciliation.lastSeenAt))
    .limit(20);

  const [
    recentSptTokenEvents,
    corridorPerformance,
    corridorMapper,
    corridorRevenue,
    corridorDiagnostics,
    airport420Experiment,
    corridorHealthRows,
  ] = await Promise.all([
    listRecentSptTokenEvents(20),
    getCorridorPerformanceRows(5000),
    getCorridorMapperRows(5000),
    getCorridorRevenueSnapshot(5000),
    getCorridorDiagnosticRows(5000),
    get420BroadArrivalExperimentRows(5000),
    getCorridorHealthRows(5000),
  ]);

  return {
    connected: true,
    totals: {
      handoffs: toNumber(totalsRow?.handoffs),
      degraded: toNumber(totalsRow?.degraded),
      converted: toNumber(totalsRow?.converted),
      recognizedRevenue: toNumber(totalsRow?.recognizedRevenue),
    },
    bySatellite: bySatellite.map((row) => ({
      satelliteId: row.satelliteId,
      count: toNumber(row.count),
    })),
    degradedRows,
    recentSummaries,
    recentReconciliation,
    recentSptTokenEvents,
    corridorRoster: LIVE_CORRIDOR_CATALOG.map((entry) => ({
      corridorId: entry.corridorId,
      corridorName: entry.corridorName,
      family: entry.family,
      appPath: entry.appPath,
      status: entry.status,
      continuityLevel: entry.continuityLevel,
      patternFamily: entry.patternFamily,
    })),
    corridorPerformance,
    corridorMapper,
    corridorRevenue,
    corridorDiagnostics,
    airport420Experiment,
    corridorHealthRows,
    selectedCorridorHealth: null,
  };
}
