import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { dccCorridorCatalog, dccCorridorEvents, type DccCorridorEventRow } from "@/lib/db/schema";
import { getCorridorCatalogEntry, LIVE_CORRIDOR_CATALOG } from "@/lib/dcc/telemetry/corridorCatalog";

const EVENT_NAMES = [
  "page_viewed",
  "recommendation_rendered",
  "handoff_viewed",
  "shortlist_rendered",
  "shortlist_generated",
  "product_opened",
  "recommendation_clicked",
  "handoff_created",
  "booking_opened",
  "checkout_started",
  "checkout_completed",
  "checkout_failed",
  "lead_captured",
  "booking_completed",
  "purchase_completed",
  "dcc_mapping_click",
  "destination_selected",
  "transport_mode_selected",
  "cta_clicked_primary",
  "cta_clicked_alternative",
  "execution_page_loaded",
  "handoff_received",
  "handoff_resolved",
  "handoff_missing",
  "handoff_invalid",
  "handoff_fallback_triggered",
  "plan_rendered",
  "plan_accepted",
  "plan_modified",
  "plan_abandoned",
  "outbound_transport_clicked",
  "outbound_transport_fallback_clicked",
] as const;

export const CorridorEventPayloadSchema = z.object({
  corridor_id: z.string().min(1),
  event_name: z.enum(EVENT_NAMES),
  occurred_at: z.string().datetime().optional(),
  handoff_id: z.string().min(1).optional(),
  session_id: z.string().min(1).optional(),
  user_id: z.string().min(1).optional(),
  source_page: z.string().optional(),
  landing_path: z.string().optional(),
  target_path: z.string().optional(),
  requested_lane: z.string().optional(),
  resolved_lane: z.string().optional(),
  topic: z.string().optional(),
  subtype: z.string().optional(),
  port: z.string().optional(),
  handoff_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  default_card_slug: z.string().optional(),
  clicked_product_slug: z.string().optional(),
  route_target: z.string().optional(),
  fit_signal: z.string().optional(),
  urgency: z.enum(["low", "medium", "high"]).optional(),
  confidence_downgraded: z.boolean().optional(),
  winning_rule_ids: z.array(z.string()).optional(),
  winning_fields: z.record(z.string(), z.string()).optional(),
  page_variant: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CorridorEventPayload = z.infer<typeof CorridorEventPayloadSchema>;

export type CorridorPerformanceRow = {
  corridorId: string;
  corridorName: string;
  family: string;
  continuityLevel: string;
  defaultCardAcceptanceRate: number | null;
  defaultCardBetrayalRate: number | null;
  handoffToProductOpenRate: number | null;
  productToBookingOpenRate: number | null;
  bookingToCheckoutRate: number | null;
  downgradeRate: number | null;
  productOpens: number;
  bookingOpens: number;
};

export type CorridorExperimentRow = {
  corridorId: string;
  variantKey: string;
  variantLabel: string;
  defaultCardSlug: string | null;
  handoffCount: number;
  productOpens: number;
  bookingOpens: number;
  checkoutStarts: number;
  defaultCardAcceptanceRate: number | null;
  defaultCardBetrayalRate: number | null;
  productToBookingOpenRate: number | null;
  bookingToCheckoutRate: number | null;
};

export type CorridorMapperRow = {
  corridorId: string;
  corridorName: string;
  routeKey: string;
  provider: string;
  targetKind: string;
  operatorId: string | null;
  clickCount: number;
  clickToBookingRate: number | null;
  clickToCheckoutRate: number | null;
  topSourcePages: Array<{ value: string; count: number }>;
};

export type CorridorRevenueRow = {
  corridorId: string;
  corridorName: string;
  revenueBehaviorId: string;
  revenueMode: string;
  revenueStage: string;
  revenueInventory: string;
  telemetryBucket: string;
  provider: string;
  routeKey: string;
  targetKind: string;
  operatorId: string | null;
  clickCount: number;
  clickToBookingRate: number | null;
  clickToCheckoutRate: number | null;
  topSourcePages: Array<{ value: string; count: number }>;
};

export type CorridorRevenueSummaryRow = {
  value: string;
  clickCount: number;
  clickToBookingRate: number | null;
  clickToCheckoutRate: number | null;
};

export type CorridorRevenueSnapshot = {
  rows: CorridorRevenueRow[];
  byCorridor: CorridorRevenueSummaryRow[];
  byRevenueMode: CorridorRevenueSummaryRow[];
  byRevenueStage: CorridorRevenueSummaryRow[];
  byTelemetryBucket: CorridorRevenueSummaryRow[];
  byProvider: CorridorRevenueSummaryRow[];
  byRouteKey: CorridorRevenueSummaryRow[];
};

export type CruiseDebugEventRow = {
  loggedAt: string;
  corridorId: string;
  eventName: string;
  sourcePage: string | null;
  landingPath: string | null;
  targetPath: string | null;
  port: string | null;
  metadata: Record<string, unknown>;
};

export type CruiseDebugBaselineRow = {
  corridor: string;
  selections: number;
  ctas: number;
  ratio: number | null;
};

const CRUISE_DEBUG_CORRIDOR_ID = "cruise-debug";
const CRUISE_DEBUG_LOG_PATH = path.join(
  process.cwd(),
  "data",
  "telemetry",
  "cruise-debug-events.jsonl",
);
const CRUISE_DEBUG_BASELINE_PATH = path.join(
  process.cwd(),
  "data",
  "telemetry",
  "cruise-debug-baseline.json",
);

function coalesceFlowId(event: Pick<DccCorridorEventRow, "handoffId" | "sessionId" | "eventId">) {
  return event.handoffId || event.sessionId || event.eventId;
}

function ratio(numerator: number, denominator: number) {
  if (!denominator) return null;
  return numerator / denominator;
}

function topCounts(map: Map<string, number>, limit = 3) {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

function isSmokeIdentifier(value: string | null | undefined) {
  return typeof value === "string" && value.toLowerCase().startsWith("smoke_");
}

function isTestMetadata(metadata: Record<string, unknown> | null | undefined) {
  return Boolean(metadata && metadata.test === true);
}

function isProductionLikeEvent(event: DccCorridorEventRow) {
  return !(
    isSmokeIdentifier(event.handoffId) ||
    isSmokeIdentifier(event.sessionId) ||
    isTestMetadata(event.metadata)
  );
}

function isCruiseTelemetryPayload(input: CorridorEventPayload) {
  if (input.corridor_id === CRUISE_DEBUG_CORRIDOR_ID) return true;
  return input.metadata?.surface === "cruise";
}

async function appendCruiseDebugEvent(input: CorridorEventPayload) {
  if (!isCruiseTelemetryPayload(input)) return;

  const row: CruiseDebugEventRow = {
    loggedAt: new Date().toISOString(),
    corridorId: input.corridor_id,
    eventName: input.event_name,
    sourcePage: input.source_page ?? null,
    landingPath: input.landing_path ?? null,
    targetPath: input.target_path ?? null,
    port: input.port ?? null,
    metadata: input.metadata ?? {},
  };

  await fs.mkdir(path.dirname(CRUISE_DEBUG_LOG_PATH), { recursive: true });
  await fs.appendFile(CRUISE_DEBUG_LOG_PATH, `${JSON.stringify(row)}\n`, "utf8");
}

export async function listRecentCruiseDebugEvents(limit = 50): Promise<CruiseDebugEventRow[]> {
  try {
    const raw = await fs.readFile(CRUISE_DEBUG_LOG_PATH, "utf8");
    return raw
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as CruiseDebugEventRow)
      .slice(-limit)
      .reverse();
  } catch {
    return [];
  }
}

export async function readCruiseDebugBaseline(): Promise<CruiseDebugBaselineRow[]> {
  try {
    const raw = await fs.readFile(CRUISE_DEBUG_BASELINE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((row): row is CruiseDebugBaselineRow => {
      return (
        row
        && typeof row.corridor === "string"
        && typeof row.selections === "number"
        && typeof row.ctas === "number"
        && (typeof row.ratio === "number" || row.ratio === null)
      );
    });
  } catch {
    return [];
  }
}

export async function ensureCorridorCatalogRows() {
  const db = getDb();
  if (!db) return;

  try {
    for (const entry of LIVE_CORRIDOR_CATALOG) {
      await db
        .insert(dccCorridorCatalog)
        .values({
          corridorId: entry.corridorId,
          corridorName: entry.corridorName,
          family: entry.family,
          appPath: entry.appPath,
          status: entry.status,
          continuityLevel: entry.continuityLevel,
          patternFamily: entry.patternFamily,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: dccCorridorCatalog.corridorId,
          set: {
            corridorName: entry.corridorName,
            family: entry.family,
            appPath: entry.appPath,
            status: entry.status,
            continuityLevel: entry.continuityLevel,
            patternFamily: entry.patternFamily,
            updatedAt: new Date(),
          },
        });
    }
  } catch {
    // Allow dashboards to degrade before the migration is applied.
  }
}

export async function appendCorridorEventDurably(input: CorridorEventPayload) {
  if (input.corridor_id === CRUISE_DEBUG_CORRIDOR_ID) {
    await appendCruiseDebugEvent(input);
    return { ok: true as const, stored: true as const, corridorId: CRUISE_DEBUG_CORRIDOR_ID };
  }

  const db = getDb();
  if (!db) {
    await appendCruiseDebugEvent(input);
    return { ok: false as const, stored: false as const, reason: "no_database" };
  }

  const catalog = getCorridorCatalogEntry(input.corridor_id);
  if (!catalog) {
    throw new Error(`unknown_corridor:${input.corridor_id}`);
  }

  await ensureCorridorCatalogRows();

  await db.insert(dccCorridorEvents).values({
    corridorId: catalog.corridorId,
    family: catalog.family,
    eventName: input.event_name,
    occurredAt: input.occurred_at ? new Date(input.occurred_at) : new Date(),
    handoffId: input.handoff_id ?? null,
    sessionId: input.session_id ?? null,
    userId: input.user_id ?? null,
    sourcePage: input.source_page ?? null,
    landingPath: input.landing_path ?? null,
    targetPath: input.target_path ?? null,
    requestedLane: input.requested_lane ?? null,
    resolvedLane: input.resolved_lane ?? null,
    topic: input.topic ?? null,
    subtype: input.subtype ?? null,
    port: input.port ?? null,
    handoffDate: input.handoff_date ?? null,
    defaultCardSlug: input.default_card_slug ?? null,
    clickedProductSlug: input.clicked_product_slug ?? null,
    routeTarget: input.route_target ?? null,
    fitSignal: input.fit_signal ?? null,
    urgency: input.urgency ?? null,
    confidenceDowngraded: input.confidence_downgraded ?? false,
    winningRuleIds: input.winning_rule_ids ?? [],
    winningFields: input.winning_fields ?? {},
    pageVariant: input.page_variant ?? null,
    metadata: input.metadata ?? {},
  });

  await appendCruiseDebugEvent(input);

  return { ok: true as const, stored: true as const, corridorId: catalog.corridorId };
}

export async function listRecentCorridorEvents(limit = 5000) {
  const db = getDb();
  if (!db) return [];

  try {
    await ensureCorridorCatalogRows();
    return db.select().from(dccCorridorEvents).orderBy(desc(dccCorridorEvents.occurredAt)).limit(limit);
  } catch {
    return [];
  }
}

export async function listRecentProductionCorridorEvents(limit = 5000) {
  const events = await listRecentCorridorEvents(limit);
  return events.filter(isProductionLikeEvent);
}

export async function getCorridorPerformanceRows(limit = 5000): Promise<CorridorPerformanceRow[]> {
  const db = getDb();
  if (!db) {
    return LIVE_CORRIDOR_CATALOG.map((entry) => ({
      corridorId: entry.corridorId,
      corridorName: entry.corridorName,
      family: entry.family,
      continuityLevel: entry.continuityLevel,
      defaultCardAcceptanceRate: null,
      defaultCardBetrayalRate: null,
      handoffToProductOpenRate: null,
      productToBookingOpenRate: null,
      bookingToCheckoutRate: null,
      downgradeRate: null,
      productOpens: 0,
      bookingOpens: 0,
    }));
  }

  await ensureCorridorCatalogRows();

  let catalogRows;
  let events;
  try {
    [catalogRows, events] = await Promise.all([
      db.select().from(dccCorridorCatalog).orderBy(dccCorridorCatalog.family, dccCorridorCatalog.corridorName),
      listRecentProductionCorridorEvents(limit),
    ]);
  } catch {
    return LIVE_CORRIDOR_CATALOG.map((entry) => ({
      corridorId: entry.corridorId,
      corridorName: entry.corridorName,
      family: entry.family,
      continuityLevel: entry.continuityLevel,
      defaultCardAcceptanceRate: null,
      defaultCardBetrayalRate: null,
      handoffToProductOpenRate: null,
      productToBookingOpenRate: null,
      bookingToCheckoutRate: null,
      downgradeRate: null,
      productOpens: 0,
      bookingOpens: 0,
    }));
  }

  return catalogRows.map((catalog) => {
    const corridorEvents = events.filter((event) => event.corridorId === catalog.corridorId);
    const handoffViewed = new Set(
      corridorEvents
        .filter((event) => event.eventName === "handoff_viewed")
        .map((event) => coalesceFlowId(event)),
    );
    const productOpened = new Set(
      corridorEvents
        .filter((event) => event.eventName === "product_opened")
        .map((event) => coalesceFlowId(event)),
    );
    const bookingOpened = new Set(
      corridorEvents
        .filter((event) => event.eventName === "booking_opened")
        .map((event) => coalesceFlowId(event)),
    );
    const checkoutStarted = new Set(
      corridorEvents
        .filter((event) => event.eventName === "checkout_started")
        .map((event) => coalesceFlowId(event)),
    );

    const actionEvents = corridorEvents.filter(
      (event) =>
        (event.eventName === "product_opened" || event.eventName === "booking_opened") &&
        event.clickedProductSlug,
    );
    const acceptedDefaults = actionEvents.filter(
      (event) =>
        event.defaultCardSlug &&
        event.clickedProductSlug &&
        event.defaultCardSlug === event.clickedProductSlug,
    ).length;
    const betrayedDefaults = actionEvents.filter(
      (event) =>
        event.defaultCardSlug &&
        event.clickedProductSlug &&
        event.defaultCardSlug !== event.clickedProductSlug,
    ).length;

    const downgradedEvents = corridorEvents.filter(
      (event) => event.eventName === "handoff_viewed" && event.confidenceDowngraded,
    ).length;

    let handoffToProductNumerator = 0;
    for (const flowId of handoffViewed) {
      if (productOpened.has(flowId)) handoffToProductNumerator += 1;
    }

    let productToBookingNumerator = 0;
    for (const flowId of productOpened) {
      if (bookingOpened.has(flowId)) productToBookingNumerator += 1;
    }

    let bookingToCheckoutNumerator = 0;
    for (const flowId of bookingOpened) {
      if (checkoutStarted.has(flowId)) bookingToCheckoutNumerator += 1;
    }

    return {
      corridorId: catalog.corridorId,
      corridorName: catalog.corridorName,
      family: catalog.family,
      continuityLevel: catalog.continuityLevel,
      defaultCardAcceptanceRate: ratio(acceptedDefaults, actionEvents.length),
      defaultCardBetrayalRate: ratio(betrayedDefaults, actionEvents.length),
      handoffToProductOpenRate: ratio(handoffToProductNumerator, handoffViewed.size),
      productToBookingOpenRate: ratio(productToBookingNumerator, productOpened.size),
      bookingToCheckoutRate: ratio(bookingToCheckoutNumerator, bookingOpened.size),
      downgradeRate: ratio(downgradedEvents, corridorEvents.filter((event) => event.eventName === "handoff_viewed").length),
      productOpens: corridorEvents.filter((event) => event.eventName === "product_opened").length,
      bookingOpens: corridorEvents.filter((event) => event.eventName === "booking_opened").length,
    };
  });
}

export async function getCorridorDiagnosticRows(limit = 5000) {
  const db = getDb();
  if (!db) return [];

  const events = await listRecentProductionCorridorEvents(limit);

  return LIVE_CORRIDOR_CATALOG.map((catalog) => {
    const corridorEvents = events.filter((event) => event.corridorId === catalog.corridorId);
    const ruleCounts = new Map<string, number>();
    const defaultCounts = new Map<string, number>();
    const clickedCounts = new Map<string, number>();
    const sourceCounts = new Map<string, number>();
    const topicCounts = new Map<string, number>();

    for (const event of corridorEvents) {
      for (const ruleId of event.winningRuleIds || []) {
        ruleCounts.set(ruleId, (ruleCounts.get(ruleId) || 0) + 1);
      }
      if (event.defaultCardSlug) {
        defaultCounts.set(event.defaultCardSlug, (defaultCounts.get(event.defaultCardSlug) || 0) + 1);
      }
      if (event.clickedProductSlug) {
        clickedCounts.set(
          event.clickedProductSlug,
          (clickedCounts.get(event.clickedProductSlug) || 0) + 1,
        );
      }
      if (event.sourcePage) {
        sourceCounts.set(event.sourcePage, (sourceCounts.get(event.sourcePage) || 0) + 1);
      }
      if (event.topic) {
        topicCounts.set(event.topic, (topicCounts.get(event.topic) || 0) + 1);
      }
    }

    const sortCounts = (map: Map<string, number>) =>
      Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([value, count]) => ({ value, count }));

    return {
      corridorId: catalog.corridorId,
      topRuleIds: sortCounts(ruleCounts),
      commonDefaultCards: sortCounts(defaultCounts),
      commonClickedProducts: sortCounts(clickedCounts),
      topSourcePages: sortCounts(sourceCounts),
      topTopics: sortCounts(topicCounts),
    };
  });
}

export async function getCorridorMapperRows(limit = 5000): Promise<CorridorMapperRow[]> {
  const db = getDb();
  if (!db) return [];

  const events = await listRecentProductionCorridorEvents(limit);
  const mappingEvents = events.filter((event) => event.eventName === "dcc_mapping_click");
  const groups = new Map<string, DccCorridorEventRow[]>();

  for (const event of mappingEvents) {
    const routeKey =
      typeof event.metadata?.route_key === "string"
        ? event.metadata.route_key
        : event.routeTarget || "unknown";
    const provider =
      typeof event.metadata?.provider === "string" ? event.metadata.provider : "unknown";
    const targetKind =
      typeof event.metadata?.target_kind === "string" ? event.metadata.target_kind : "unknown";
    const operatorId =
      typeof event.metadata?.operator_id === "string" ? event.metadata.operator_id : "";
    const key = [event.corridorId, routeKey, provider, targetKind, operatorId].join("::");
    const bucket = groups.get(key) || [];
    bucket.push(event);
    groups.set(key, bucket);
  }

  return Array.from(groups.entries())
    .map(([key, groupEvents]) => {
      const [corridorId, routeKey, provider, targetKind, operatorIdRaw] = key.split("::");
      const corridorName = getCorridorCatalogEntry(corridorId)?.corridorName || corridorId;
      const sourceCounts = new Map<string, number>();
      const clickFlows = new Set(groupEvents.map((event) => coalesceFlowId(event)));
      const downstreamEvents = events.filter((event) => event.corridorId === corridorId);
      const bookingFlows = new Set(
        downstreamEvents
          .filter((event) => event.eventName === "booking_opened")
          .map((event) => coalesceFlowId(event)),
      );
      const checkoutFlows = new Set(
        downstreamEvents
          .filter((event) => event.eventName === "checkout_started")
          .map((event) => coalesceFlowId(event)),
      );

      for (const event of groupEvents) {
        if (event.sourcePage) {
          sourceCounts.set(event.sourcePage, (sourceCounts.get(event.sourcePage) || 0) + 1);
        }
      }

      let bookingNumerator = 0;
      let checkoutNumerator = 0;
      for (const flowId of clickFlows) {
        if (bookingFlows.has(flowId)) bookingNumerator += 1;
        if (checkoutFlows.has(flowId)) checkoutNumerator += 1;
      }

      return {
        corridorId,
        corridorName,
        routeKey,
        provider,
        targetKind,
        operatorId: operatorIdRaw || null,
        clickCount: groupEvents.length,
        clickToBookingRate: ratio(bookingNumerator, clickFlows.size),
        clickToCheckoutRate: ratio(checkoutNumerator, clickFlows.size),
        topSourcePages: Array.from(sourceCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([value, count]) => ({ value, count })),
      };
    })
    .sort((a, b) => b.clickCount - a.clickCount);
}

function getRevenueMetadataString(
  event: DccCorridorEventRow,
  key: "revenue_behavior_id" | "revenue_mode" | "revenue_stage" | "revenue_inventory" | "revenue_bucket",
) {
  const value = event.metadata?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function inferRevenueMode(event: DccCorridorEventRow) {
  const explicit = getRevenueMetadataString(event, "revenue_mode");
  if (explicit) return explicit;
  const provider = typeof event.metadata?.provider === "string" ? event.metadata.provider : "";
  const targetKind =
    typeof event.metadata?.target_kind === "string" ? event.metadata.target_kind : "";
  if (provider === "internal" && targetKind === "operator_checkout") return "operator_capture";
  if (provider === "internal") return "internal_narrowing";
  return "affiliate_capture";
}

function inferRevenueStage(event: DccCorridorEventRow) {
  const explicit = getRevenueMetadataString(event, "revenue_stage");
  if (explicit) return explicit;
  const targetKind =
    typeof event.metadata?.target_kind === "string" ? event.metadata.target_kind : "";
  if (targetKind === "operator_checkout") return "checkout";
  if (targetKind === "operator_flow" || targetKind === "edge_redirect") return "handoff";
  return "shortlist";
}

function inferRevenueBucket(event: DccCorridorEventRow) {
  const explicit = getRevenueMetadataString(event, "revenue_bucket");
  if (explicit) return explicit;
  const mode = inferRevenueMode(event);
  if (mode === "operator_capture") {
    return inferRevenueStage(event) === "checkout" ? "operator_checkout" : "operator_handoff";
  }
  if (mode === "internal_narrowing") return "internal_shortlist";
  return "affiliate_conversion";
}

function buildCorridorRevenueRowsFromEvents(events: DccCorridorEventRow[]): CorridorRevenueRow[] {
  const mappingEvents = events.filter((event) => event.eventName === "dcc_mapping_click");
  const groups = new Map<string, DccCorridorEventRow[]>();

  for (const event of mappingEvents) {
    const routeKey =
      typeof event.metadata?.route_key === "string"
        ? event.metadata.route_key
        : event.routeTarget || "unknown";
    const provider =
      typeof event.metadata?.provider === "string" ? event.metadata.provider : "unknown";
    const targetKind =
      typeof event.metadata?.target_kind === "string" ? event.metadata.target_kind : "unknown";
    const operatorId =
      typeof event.metadata?.operator_id === "string" ? event.metadata.operator_id : "";
    const revenueBehaviorId = getRevenueMetadataString(event, "revenue_behavior_id") || "unknown";
    const revenueMode = inferRevenueMode(event);
    const revenueStage = inferRevenueStage(event);
    const revenueInventory =
      getRevenueMetadataString(event, "revenue_inventory") || "unknown";
    const telemetryBucket = inferRevenueBucket(event);
    const key = [
      event.corridorId,
      revenueBehaviorId,
      revenueMode,
      revenueStage,
      revenueInventory,
      telemetryBucket,
      provider,
      routeKey,
      targetKind,
      operatorId,
    ].join("::");
    const bucket = groups.get(key) || [];
    bucket.push(event);
    groups.set(key, bucket);
  }

  return Array.from(groups.entries())
    .map(([key, groupEvents]) => {
      const [
        corridorId,
        revenueBehaviorId,
        revenueMode,
        revenueStage,
        revenueInventory,
        telemetryBucket,
        provider,
        routeKey,
        targetKind,
        operatorIdRaw,
      ] = key.split("::");
      const corridorName = getCorridorCatalogEntry(corridorId)?.corridorName || corridorId;
      const sourceCounts = new Map<string, number>();
      const clickFlows = new Set(groupEvents.map((event) => coalesceFlowId(event)));
      const downstreamEvents = events.filter((event) => event.corridorId === corridorId);
      const bookingFlows = new Set(
        downstreamEvents
          .filter((event) => event.eventName === "booking_opened")
          .map((event) => coalesceFlowId(event)),
      );
      const checkoutFlows = new Set(
        downstreamEvents
          .filter((event) => event.eventName === "checkout_started")
          .map((event) => coalesceFlowId(event)),
      );

      for (const event of groupEvents) {
        if (event.sourcePage) {
          sourceCounts.set(event.sourcePage, (sourceCounts.get(event.sourcePage) || 0) + 1);
        }
      }

      let bookingNumerator = 0;
      let checkoutNumerator = 0;
      for (const flowId of clickFlows) {
        if (bookingFlows.has(flowId)) bookingNumerator += 1;
        if (checkoutFlows.has(flowId)) checkoutNumerator += 1;
      }

      return {
        corridorId,
        corridorName,
        revenueBehaviorId,
        revenueMode,
        revenueStage,
        revenueInventory,
        telemetryBucket,
        provider,
        routeKey,
        targetKind,
        operatorId: operatorIdRaw || null,
        clickCount: groupEvents.length,
        clickToBookingRate: ratio(bookingNumerator, clickFlows.size),
        clickToCheckoutRate: ratio(checkoutNumerator, clickFlows.size),
        topSourcePages: topCounts(sourceCounts),
      };
    })
    .sort((a, b) => b.clickCount - a.clickCount);
}

function buildRevenueSummaryRows(
  rows: CorridorRevenueRow[],
  selector: (row: CorridorRevenueRow) => string,
): CorridorRevenueSummaryRow[] {
  const grouped = new Map<
    string,
    { clickCount: number; weightedBooking: number; weightedCheckout: number }
  >();

  for (const row of rows) {
    const key = selector(row) || "unknown";
    const bucket = grouped.get(key) || {
      clickCount: 0,
      weightedBooking: 0,
      weightedCheckout: 0,
    };
    bucket.clickCount += row.clickCount;
    bucket.weightedBooking += (row.clickToBookingRate ?? 0) * row.clickCount;
    bucket.weightedCheckout += (row.clickToCheckoutRate ?? 0) * row.clickCount;
    grouped.set(key, bucket);
  }

  return Array.from(grouped.entries())
    .map(([value, bucket]) => ({
      value,
      clickCount: bucket.clickCount,
      clickToBookingRate: ratio(bucket.weightedBooking, bucket.clickCount),
      clickToCheckoutRate: ratio(bucket.weightedCheckout, bucket.clickCount),
    }))
    .sort((a, b) => b.clickCount - a.clickCount);
}

export async function getCorridorRevenueSnapshot(limit = 5000): Promise<CorridorRevenueSnapshot> {
  const db = getDb();
  if (!db) {
    return {
      rows: [],
      byCorridor: [],
      byRevenueMode: [],
      byRevenueStage: [],
      byTelemetryBucket: [],
      byProvider: [],
      byRouteKey: [],
    };
  }

  const events = await listRecentProductionCorridorEvents(limit);
  const rows = buildCorridorRevenueRowsFromEvents(events);

  return {
    rows,
    byCorridor: buildRevenueSummaryRows(rows, (row) => row.corridorName),
    byRevenueMode: buildRevenueSummaryRows(rows, (row) => row.revenueMode),
    byRevenueStage: buildRevenueSummaryRows(rows, (row) => row.revenueStage),
    byTelemetryBucket: buildRevenueSummaryRows(rows, (row) => row.telemetryBucket),
    byProvider: buildRevenueSummaryRows(rows, (row) => row.provider),
    byRouteKey: buildRevenueSummaryRows(rows, (row) => row.routeKey),
  };
}

export const __private__ = {
  buildCorridorRevenueRowsFromEvents,
  buildRevenueSummaryRows,
};

function isBroad420ArrivalTopic(value: string | null | undefined) {
  if (!value) return false;
  const normalized = value.toLowerCase();
  if (!normalized.includes("arrival")) return false;
  return !(
    normalized.includes("red-rocks") ||
    normalized.includes("dispensary") ||
    normalized.includes("420") ||
    normalized.includes("mountain") ||
    normalized.includes("ski")
  );
}

function isBroad420ArrivalEvent(event: DccCorridorEventRow) {
  if (event.corridorId !== "airport-420-pickup") return false;
  const requestedLane = String(event.requestedLane || "").toLowerCase();
  const subtype = String(event.subtype || "").toLowerCase();
  const resolvedLane = String(event.resolvedLane || "").toLowerCase();
  const sourcePage = String(event.sourcePage || "").toLowerCase();
  const clicked = String(event.clickedProductSlug || "").toLowerCase();
  const defaultSlug = String(event.defaultCardSlug || "").toLowerCase();

  if (!(requestedLane.includes("private-transfer") || subtype.includes("private"))) return false;
  if (!isBroad420ArrivalTopic(event.topic)) return false;
  if (resolvedLane.includes("event-transfer") || resolvedLane.includes("mountain")) return false;
  if (sourcePage.includes("red-rocks")) return false;
  if (clicked.includes("red-rocks") || defaultSlug.includes("red-rocks")) {
    // Allow old broad-arrival rows only when the topic/source are generic.
    return true;
  }
  return true;
}

export async function get420BroadArrivalExperimentRows(limit = 5000): Promise<CorridorExperimentRow[]> {
  const db = getDb();
  if (!db) return [];

  const events = (await listRecentProductionCorridorEvents(limit)).filter(isBroad420ArrivalEvent);
  const grouped = new Map<string, DccCorridorEventRow[]>();

  for (const event of events) {
    const variantKey = event.defaultCardSlug || "unknown";
    const bucket = grouped.get(variantKey) || [];
    bucket.push(event);
    grouped.set(variantKey, bucket);
  }

  return Array.from(grouped.entries())
    .map(([variantKey, variantEvents]) => {
      const handoffViewed = new Set(
        variantEvents
          .filter((event) => event.eventName === "handoff_viewed")
          .map((event) => coalesceFlowId(event)),
      );
      const productOpened = new Set(
        variantEvents
          .filter((event) => event.eventName === "product_opened")
          .map((event) => coalesceFlowId(event)),
      );
      const bookingOpened = new Set(
        variantEvents
          .filter((event) => event.eventName === "booking_opened")
          .map((event) => coalesceFlowId(event)),
      );
      const checkoutStarted = new Set(
        variantEvents
          .filter((event) => event.eventName === "checkout_started")
          .map((event) => coalesceFlowId(event)),
      );
      const actionEvents = variantEvents.filter(
        (event) =>
          (event.eventName === "product_opened" || event.eventName === "booking_opened") &&
          event.clickedProductSlug,
      );
      const acceptedDefaults = actionEvents.filter(
        (event) =>
          event.defaultCardSlug &&
          event.clickedProductSlug &&
          event.defaultCardSlug === event.clickedProductSlug,
      ).length;
      const betrayedDefaults = actionEvents.filter(
        (event) =>
          event.defaultCardSlug &&
          event.clickedProductSlug &&
          event.defaultCardSlug !== event.clickedProductSlug,
      ).length;

      let productToBookingNumerator = 0;
      for (const flowId of productOpened) {
        if (bookingOpened.has(flowId)) productToBookingNumerator += 1;
      }

      let bookingToCheckoutNumerator = 0;
      for (const flowId of bookingOpened) {
        if (checkoutStarted.has(flowId)) bookingToCheckoutNumerator += 1;
      }

      const variantLabel =
        variantKey === "airport-pickup"
          ? "Variant B · broad airport-pickup default"
          : variantKey === "airport-red-rocks"
            ? "Baseline A · Red Rocks-heavy default"
            : `Observed variant · ${variantKey}`;

      return {
        corridorId: "airport-420-pickup",
        variantKey,
        variantLabel,
        defaultCardSlug: variantKey === "unknown" ? null : variantKey,
        handoffCount: handoffViewed.size,
        productOpens: productOpened.size,
        bookingOpens: bookingOpened.size,
        checkoutStarts: checkoutStarted.size,
        defaultCardAcceptanceRate: ratio(acceptedDefaults, actionEvents.length),
        defaultCardBetrayalRate: ratio(betrayedDefaults, actionEvents.length),
        productToBookingOpenRate: ratio(productToBookingNumerator, productOpened.size),
        bookingToCheckoutRate: ratio(bookingToCheckoutNumerator, bookingOpened.size),
      };
    })
    .sort((a, b) => b.productOpens - a.productOpens);
}
