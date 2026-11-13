import { desc, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { dccCorridorEvents } from "@/lib/db/schema";

export const SHARED_NETWORK_EVENT_NAMES = [
  "service_page_view",
  "date_selected",
  "availability_started",
  "booking_handoff",
  "booking_completed",
  "network_handoff",
  "dcc_plan_opened",
  "cp_sailing_started",
  "cp_board_created",
] as const;

export type SharedNetworkEventName = (typeof SHARED_NETWORK_EVENT_NAMES)[number];

export type NetworkSiteId = "dcc" | "partyatredrocks" | "gosno" | "cruisepromenade";

export interface CrossSiteFunnelSummary {
  windowDays: number;
  totalEvents: number;
  parrVisitors: number;
  gosnoVisitors: number;
  dccPlanningSessions: number;
  returnedToBooking: number;
  completedBookings: number;
  cruisePromenadeVisits: number;
  cruisePromenadeBoardsCreated: number;
}

export function buildAttributedNetworkUrl(
  baseUrl: string,
  params: {
    source: NetworkSiteId;
    intent: string;
    entry: string;
    extra?: Record<string, string | number | undefined | null>;
  },
): string {
  const url = new URL(baseUrl);
  url.searchParams.set("source", params.source);
  url.searchParams.set("intent", params.intent);
  url.searchParams.set("entry", params.entry);
  if (params.extra) {
    for (const [key, val] of Object.entries(params.extra)) {
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        url.searchParams.set(key, String(val));
      }
    }
  }
  return url.toString();
}

export async function loadCrossSiteNetworkFunnelSummary(
  windowDays = 30,
): Promise<CrossSiteFunnelSummary> {
  const empty: CrossSiteFunnelSummary = {
    windowDays,
    totalEvents: 0,
    parrVisitors: 0,
    gosnoVisitors: 0,
    dccPlanningSessions: 0,
    returnedToBooking: 0,
    completedBookings: 0,
    cruisePromenadeVisits: 0,
    cruisePromenadeBoardsCreated: 0,
  };

  try {
    const db = getDb();
    if (!db) return empty;
    const cutoff = new Date(Date.now() - windowDays * 86_400_000);
    const rows = await db
      .select({
        eventName: dccCorridorEvents.eventName,
        occurredAt: dccCorridorEvents.occurredAt,
        metadata: dccCorridorEvents.metadata,
      })
      .from(dccCorridorEvents)
      .where(inArray(dccCorridorEvents.eventName, [...SHARED_NETWORK_EVENT_NAMES]))
      .orderBy(desc(dccCorridorEvents.occurredAt))
      .limit(5000);

    const summary = { ...empty };
    for (const row of rows) {
      if (row.occurredAt && row.occurredAt < cutoff) continue;
      summary.totalEvents += 1;
      const meta = (row.metadata || {}) as Record<string, unknown>;
      const orig = String(meta.originating_site || "").toLowerCase();
      const dest = String(meta.destination_site || "").toLowerCase();

      if (row.eventName === "service_page_view" && orig === "partyatredrocks") {
        summary.parrVisitors += 1;
      } else if (row.eventName === "service_page_view" && orig === "gosno") {
        summary.gosnoVisitors += 1;
      } else if (row.eventName === "dcc_plan_opened") {
        summary.dccPlanningSessions += 1;
      } else if (
        row.eventName === "network_handoff" &&
        orig === "dcc" &&
        (dest === "partyatredrocks" || dest === "gosno")
      ) {
        summary.returnedToBooking += 1;
      } else if (row.eventName === "booking_completed") {
        summary.completedBookings += 1;
      } else if (
        (row.eventName === "service_page_view" && orig === "cruisepromenade") ||
        row.eventName === "cp_sailing_started"
      ) {
        summary.cruisePromenadeVisits += 1;
      } else if (row.eventName === "cp_board_created") {
        summary.cruisePromenadeBoardsCreated += 1;
      }
    }
    return summary;
  } catch {
    return empty;
  }
}
