import { and, desc, eq, gte } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { dccShipmentEvents, dccShipmentUnits, type DccShipmentEventRow } from "@/lib/db/schema";
import {
  listRecentSatelliteEvents,
  type DccSatelliteId,
  type StoredSatelliteEvent,
} from "@/lib/dcc/satelliteHandoffs";
import type { CommandStatusLevel, CorridorDebugSignalSource, CorridorDebugSource } from "@/lib/dcc/command/types";

export type CommandCorridorDefinition = {
  id: string;
  name: string;
  from: string;
  to: string;
  tier?: "gold";
  placeIdMatchers?: string[];
  shipmentPlaceMatchers: string[];
  handoff?: {
    satelliteId: DccSatelliteId;
    venueSlug?: string;
    portSlug?: string;
    citySlug?: string;
  };
  fallback: {
    pressureLabel: string;
    bestMove: string;
    transportStatus: string;
    liveSignal: string;
    recommendation: string;
  };
  copy?: Partial<
    Record<
      CommandStatusLevel,
      {
        pressureLabel: string;
        bestMove: string;
        transportStatus: string;
        recommendation: string;
      }
    >
  >;
  timingWindows?: {
    cleanBefore?: string;
    pressureAfter?: string;
    avoidAfter?: string;
  };
};

export type CorridorSignalAnalysis = {
  status: CommandStatusLevel;
  trend: "improving" | "steady" | "slipping";
  delayCount: number;
  degradedCount: number;
  positiveCount: number;
  eventCount: number;
  shipmentEventCount: number;
  handoffEventCount: number;
  debugSource: CorridorDebugSource;
};

type ShipmentSignalRow = {
  shipmentId: number;
  event: DccShipmentEventRow;
  originPlaceId: string;
  destinationPlaceId: string;
  currentPlaceId: string | null;
};

type ShipmentMatchMode = "place_id" | "text_fallback";

const DEGRADED_HANDOFF_TYPES = new Set([
  "inventory_unavailable",
  "response_degraded",
  "booking_failure_rate_high",
  "temporarily_paused",
  "booking_failed",
  "partner_booking_failed",
]);

const POSITIVE_HANDOFF_TYPES = new Set([
  "booking_completed",
  "partner_booking_completed",
  "accepted_from_partner",
  "lead_captured",
  "booking_started",
]);

export function trendToStatus(trend: string | null | undefined): CommandStatusLevel {
  switch (trend) {
    case "degrading":
      return "busy";
    case "improving":
      return "normal";
    case "critical":
      return "critical";
    default:
      return "watch";
  }
}

export function countToSeverity(count: number): CommandStatusLevel {
  if (count >= 8) return "critical";
  if (count >= 5) return "busy";
  if (count >= 2) return "watch";
  return "normal";
}

function normalize(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function matchesAnyPlace(value: string | null | undefined, matchers: string[]) {
  const normalized = normalize(value);
  if (!normalized) return false;
  return matchers.some((matcher) => normalized.includes(normalize(matcher)));
}

function matchesAnyPlaceId(value: string | null | undefined, matchers: string[]) {
  const normalized = normalize(value);
  if (!normalized) return false;
  return matchers.some((matcher) => {
    const next = normalize(matcher);
    return normalized === next || normalized.startsWith(next);
  });
}

function getShipmentMatchMode(
  signal: ShipmentSignalRow,
  corridor: CommandCorridorDefinition,
): ShipmentMatchMode | null {
  const places = [
    signal.event.fromPlaceId,
    signal.event.toPlaceId,
    signal.originPlaceId,
    signal.destinationPlaceId,
    signal.currentPlaceId,
  ];

  if (corridor.placeIdMatchers?.length) {
    const idMatched = places.some((value) => matchesAnyPlaceId(value, corridor.placeIdMatchers || []));
    if (idMatched) return "place_id";
  }

  return places.some((value) => matchesAnyPlace(value, corridor.shipmentPlaceMatchers)) ? "text_fallback" : null;
}

async function getRecentShipmentSignals(
  corridor: CommandCorridorDefinition,
  days = 14,
  limit = 120,
): Promise<{ rows: ShipmentSignalRow[]; matchMode: ShipmentMatchMode | null }> {
  const db = getDb();
  if (!db) return { rows: [], matchMode: null };

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      shipmentId: dccShipmentEvents.shipmentUnitId,
      event: dccShipmentEvents,
      originPlaceId: dccShipmentUnits.originPlaceId,
      destinationPlaceId: dccShipmentUnits.destinationPlaceId,
      currentPlaceId: dccShipmentUnits.currentPlaceId,
    })
    .from(dccShipmentEvents)
    .innerJoin(dccShipmentUnits, eq(dccShipmentEvents.shipmentUnitId, dccShipmentUnits.id))
    .where(gte(dccShipmentEvents.occurredAt, since))
    .orderBy(desc(dccShipmentEvents.occurredAt))
    .limit(limit);

  let matchedByPlaceId = false;
  let matchedByTextFallback = false;
  const filtered = rows.filter((row) => {
    const matchMode = getShipmentMatchMode(row, corridor);
    if (matchMode === "place_id") matchedByPlaceId = true;
    if (matchMode === "text_fallback") matchedByTextFallback = true;
    return Boolean(matchMode);
  });

  return {
    rows: filtered,
    matchMode: matchedByPlaceId ? "place_id" : matchedByTextFallback ? "text_fallback" : null,
  };
}

function matchesHandoffSignal(
  event: StoredSatelliteEvent,
  handoff: NonNullable<CommandCorridorDefinition["handoff"]>,
) {
  if (event.satelliteId !== handoff.satelliteId) return false;
  if (handoff.venueSlug && event.booking?.venueSlug !== handoff.venueSlug) return false;
  if (handoff.portSlug && event.booking?.portSlug !== handoff.portSlug) return false;
  if (handoff.citySlug && event.booking?.citySlug !== handoff.citySlug) return false;
  return true;
}

function getRecentHandoffSignals(corridor: CommandCorridorDefinition, limit = 120) {
  if (!corridor.handoff) return [];
  return listRecentSatelliteEvents(corridor.handoff.satelliteId, limit).filter((event) =>
    matchesHandoffSignal(event, corridor.handoff!),
  );
}

function scoreSignals(
  shipmentSignals: ShipmentSignalRow[],
  handoffSignals: StoredSatelliteEvent[],
  shipmentMatchMode: ShipmentMatchMode | null,
): CorridorSignalAnalysis {
  const delayedShipmentCount = shipmentSignals.filter(
    (row) =>
      row.event.status === "delayed" ||
      row.event.status === "exception" ||
      row.event.eventType === "delay" ||
      row.event.eventType === "exception" ||
      row.event.eventType === "reroute",
  ).length;
  const degradedCount = handoffSignals.filter((event) => DEGRADED_HANDOFF_TYPES.has(event.eventType)).length;
  const positiveCount =
    shipmentSignals.filter((row) => row.event.status === "arrived" || row.event.status === "delivered").length +
    handoffSignals.filter((event) => POSITIVE_HANDOFF_TYPES.has(event.eventType)).length;
  const eventCount = shipmentSignals.length + handoffSignals.length;

  if (eventCount === 0) {
    return {
      status: "watch",
      trend: "steady",
      delayCount: 0,
      degradedCount: 0,
      positiveCount: 0,
      eventCount: 0,
      shipmentEventCount: 0,
      handoffEventCount: 0,
      debugSource: {
        primary: "fallback",
        contributing: ["fallback"],
        confidence: "low",
      },
    };
  }

  const frictionRate = (delayedShipmentCount + degradedCount) / eventCount;
  const recoveryRate = positiveCount / eventCount;

  let status: CommandStatusLevel = "normal";
  if (frictionRate >= 0.45 || degradedCount >= 4) status = "critical";
  else if (frictionRate >= 0.25 || degradedCount >= 2 || delayedShipmentCount >= 3) status = "busy";
  else if (frictionRate >= 0.1 || degradedCount >= 1) status = "watch";

  const trend = recoveryRate > frictionRate ? "improving" : frictionRate > recoveryRate ? "slipping" : "steady";
  const contributing: CorridorDebugSignalSource[] = [];
  if (shipmentSignals.length > 0) contributing.push("shipment_events");
  if (handoffSignals.length > 0) contributing.push("satellite_handoffs");
  if (shipmentMatchMode === "text_fallback" || contributing.length === 0) contributing.push("fallback");

  let primary: CorridorDebugSignalSource = "fallback";
  if (handoffSignals.length > shipmentSignals.length && handoffSignals.length > 0) primary = "satellite_handoffs";
  else if (shipmentSignals.length > 0) primary = "shipment_events";

  let confidence: CorridorDebugSource["confidence"] = "low";
  if (shipmentMatchMode === "place_id" && shipmentSignals.length > 0 && handoffSignals.length > 0) confidence = "high";
  else if (
    (shipmentMatchMode === "place_id" && shipmentSignals.length > 0) ||
    handoffSignals.length >= 3 ||
    (shipmentSignals.length > 0 && handoffSignals.length > 0)
  ) {
    confidence = "medium";
  }

  return {
    status,
    trend,
    delayCount: delayedShipmentCount,
    degradedCount,
    positiveCount,
    eventCount,
    shipmentEventCount: shipmentSignals.length,
    handoffEventCount: handoffSignals.length,
    debugSource: {
      primary,
      contributing,
      confidence,
    },
  };
}

export async function calculateCorridorHealth(corridor: CommandCorridorDefinition) {
  const [{ rows: shipmentSignals, matchMode: shipmentMatchMode }, handoffSignals] = await Promise.all([
    getRecentShipmentSignals(corridor),
    Promise.resolve(getRecentHandoffSignals(corridor)),
  ]);

  return scoreSignals(shipmentSignals, handoffSignals, shipmentMatchMode);
}

export function buildPressureLabel(corridor: CommandCorridorDefinition, analysis: CorridorSignalAnalysis) {
  const copy = corridor.copy?.[analysis.status];
  if (copy) {
    return copy.pressureLabel;
  }
  if (analysis.eventCount === 0) return corridor.fallback.pressureLabel;
  if (analysis.status === "critical") {
    return `${analysis.degradedCount} degraded command signals are pressuring this lane right now.`;
  }
  if (analysis.status === "busy") {
    return `${analysis.delayCount + analysis.degradedCount} recent friction signals are compressing this corridor.`;
  }
  if (analysis.status === "watch") {
    return "Movement is still workable, but small disruptions are starting to cluster.";
  }
  return "Movement is stable and the corridor is absorbing current demand cleanly.";
}

export function buildBestMove(corridor: CommandCorridorDefinition, analysis: CorridorSignalAnalysis) {
  const copy = corridor.copy?.[analysis.status];
  if (copy) {
    return copy.bestMove;
  }
  if (analysis.status === "critical") {
    return `Treat ${corridor.name} as fragile and protect extra buffer before committing.`;
  }
  if (analysis.status === "busy") {
    return corridor.fallback.bestMove;
  }
  if (analysis.status === "watch") {
    return `Keep ${corridor.name} viable by staging earlier than the minimum buffer.`;
  }
  return `This is a favorable operating window for ${corridor.name}.`;
}

export function buildLiveSignal(corridor: CommandCorridorDefinition, analysis: CorridorSignalAnalysis) {
  if (analysis.handoffEventCount > 0 && analysis.degradedCount > 0) {
    return "Booking and handoff pressure is rising in the active execution lane.";
  }
  if (analysis.shipmentEventCount > 0 && analysis.delayCount > 0) {
    return "Real route transitions are slipping relative to the clean baseline.";
  }
  if (analysis.positiveCount > 0) {
    return "Recent completions suggest the lane is still moving with confidence.";
  }
  return corridor.fallback.liveSignal;
}

export function buildTransportStatus(corridor: CommandCorridorDefinition, analysis: CorridorSignalAnalysis) {
  const copy = corridor.copy?.[analysis.status];
  if (copy) {
    return copy.transportStatus;
  }
  if (analysis.status === "critical") {
    return "Transfer reliability is weak and fallback planning matters.";
  }
  if (analysis.status === "busy") {
    return corridor.fallback.transportStatus;
  }
  if (analysis.status === "watch") {
    return "Transfer timing is workable, but not forgiving.";
  }
  return "Transfer timing is stable across the current window.";
}

export function buildRecommendation(corridor: CommandCorridorDefinition, analysis: CorridorSignalAnalysis) {
  const copy = corridor.copy?.[analysis.status];
  if (copy) {
    return copy.recommendation;
  }
  if (analysis.status === "critical") {
    return `Do not run ${corridor.name} tight. Add buffer or choose the cleaner lane.`;
  }
  if (analysis.status === "busy") {
    return corridor.fallback.recommendation;
  }
  if (analysis.status === "watch") {
    return `Use ${corridor.name} with margin instead of trying to optimize the last minute.`;
  }
  return `Use the current window while the lane is stable.`;
}

export function summarizeHandoffEvent(event: StoredSatelliteEvent) {
  switch (event.eventType) {
    case "inventory_unavailable":
      return {
        title: "Inventory unavailable in the active booking lane",
        detail: "The current execution lane hit a temporary capacity wall.",
        severity: "busy" as CommandStatusLevel,
      };
    case "temporarily_paused":
      return {
        title: "Execution lane temporarily paused",
        detail: "Movement or booking flow is paused while the lane stabilizes.",
        severity: "busy" as CommandStatusLevel,
      };
    case "partner_booking_completed":
    case "booking_completed":
      return {
        title: "Booking lane completed a fresh movement event",
        detail: "The network is still converting demand through the live execution path.",
        severity: "normal" as CommandStatusLevel,
      };
    case "accepted_from_partner":
      return {
        title: "Cross-network handoff accepted",
        detail: "The command network successfully reused an active partner lane.",
        severity: "watch" as CommandStatusLevel,
      };
    default:
      return {
        title: event.message || "Operational signal recorded",
        detail: "A new public-safe signal was recorded in the movement layer.",
        severity: DEGRADED_HANDOFF_TYPES.has(event.eventType) ? ("busy" as CommandStatusLevel) : ("watch" as CommandStatusLevel),
      };
  }
}
