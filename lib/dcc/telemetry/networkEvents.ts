import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";

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
  "planner_view",
  "organizer_copy_imported",
] as const;

export type SharedNetworkEventName = (typeof SHARED_NETWORK_EVENT_NAMES)[number];

export type NetworkSiteId = "dcc" | "partyatredrocks" | "gosno" | "cruisepromenade";

export interface CrossSiteFunnelSummary {
  windowDays: number;
  totalEvents: number;
  parrPageviews: number;
  gosnoPageviews: number;
  dccPageviews: number;
  cpPageviews: number;
  parrJourneys: number;
  gosnoJourneys: number;
  dccPlanningJourneys: number;
  returnedToBookingJourneys: number;
  verifiedBookingJourneys: number;
  completedBookings: number;
  cpJourneys: number;
  cpSailingStartedJourneys: number;
  cpBoardsCreatedJourneys: number;
  dccToCpJourneys: number;
  parrToDccPct: number;
  gosnoToDccPct: number;
  dccToSpecialistReturnPct: number;
  dccToCpPct: number;
  journeyToBookingPct: number;
}

function pct(numerator: number, denominator: number): number {
  if (!denominator || denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

export function buildAttributedNetworkUrl(
  baseUrl: string,
  params: {
    source: NetworkSiteId;
    intent: string;
    entry: string;
    journeyId?: string;
    extra?: Record<string, string | number | undefined | null>;
  },
): string {
  const url = new URL(baseUrl);
  url.searchParams.set("source", params.source);
  url.searchParams.set("intent", params.intent);
  url.searchParams.set("entry", params.entry);
  if (params.journeyId) url.searchParams.set("journey_id", params.journeyId);
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
  options?: { includeTest?: boolean },
): Promise<CrossSiteFunnelSummary> {
  const empty: CrossSiteFunnelSummary = {
    windowDays,
    totalEvents: 0,
    parrPageviews: 0,
    gosnoPageviews: 0,
    dccPageviews: 0,
    cpPageviews: 0,
    parrJourneys: 0,
    gosnoJourneys: 0,
    dccPlanningJourneys: 0,
    returnedToBookingJourneys: 0,
    verifiedBookingJourneys: 0,
    completedBookings: 0,
    cpJourneys: 0,
    cpSailingStartedJourneys: 0,
    cpBoardsCreatedJourneys: 0,
    dccToCpJourneys: 0,
    parrToDccPct: 0,
    gosnoToDccPct: 0,
    dccToSpecialistReturnPct: 0,
    dccToCpPct: 0,
    journeyToBookingPct: 0,
  };

  try {
    const db = getDb();
    if (!db) return empty;
    const cutoff = new Date(Date.now() - windowDays * 86_400_000).toISOString();
    const includeTest = Boolean(options?.includeTest);

    const result = await db.execute(sql`
      WITH scoped AS (
        SELECT
          event_name,
          LOWER(COALESCE(metadata->>'originating_site', '')) AS orig,
          LOWER(COALESCE(metadata->>'destination_site', '')) AS dest,
          COALESCE(
            NULLIF(metadata->>'journey_id', ''),
            NULLIF(handoff_id, ''),
            NULLIF(session_id, ''),
            event_id::text
          ) AS journey_key
        FROM dcc_corridor_events
        WHERE occurred_at >= ${cutoff}::timestamptz
          AND event_name IN (
            'service_page_view',
            'date_selected',
            'availability_started',
            'booking_handoff',
            'booking_completed',
            'network_handoff',
            'dcc_plan_opened',
            'cp_sailing_started',
            'cp_board_created',
            'planner_view',
            'organizer_copy_imported'
          )
          AND (
            ${includeTest}::boolean = true
            OR (
              COALESCE((metadata->>'is_test')::boolean, false) = false
              AND LOWER(COALESCE(metadata->>'campaign_source', '')) NOT IN ('qa_test', 'e2e_test')
            )
          )
      )
      SELECT
        COUNT(*)::int AS total_events,
        COUNT(*) FILTER (WHERE event_name = 'service_page_view' AND orig = 'partyatredrocks')::int AS parr_pageviews,
        COUNT(*) FILTER (WHERE event_name = 'service_page_view' AND orig = 'gosno')::int AS gosno_pageviews,
        COUNT(*) FILTER (WHERE event_name = 'service_page_view' AND orig = 'dcc')::int AS dcc_pageviews,
        COUNT(*) FILTER (WHERE event_name IN ('service_page_view', 'planner_view') AND orig = 'cruisepromenade')::int AS cp_pageviews,
        COUNT(DISTINCT journey_key) FILTER (WHERE orig = 'partyatredrocks')::int AS parr_journeys,
        COUNT(DISTINCT journey_key) FILTER (WHERE orig = 'gosno')::int AS gosno_journeys,
        COUNT(DISTINCT journey_key) FILTER (WHERE event_name = 'dcc_plan_opened' OR (event_name = 'network_handoff' AND dest = 'dcc'))::int AS dcc_planning_journeys,
        COUNT(DISTINCT journey_key) FILTER (WHERE event_name = 'network_handoff' AND orig = 'dcc' AND dest IN ('partyatredrocks', 'gosno'))::int AS returned_to_booking_journeys,
        COUNT(DISTINCT journey_key) FILTER (WHERE event_name = 'booking_completed')::int AS verified_booking_journeys,
        COUNT(*) FILTER (WHERE event_name = 'booking_completed')::int AS completed_bookings,
        COUNT(DISTINCT journey_key) FILTER (WHERE orig = 'cruisepromenade')::int AS cp_journeys,
        COUNT(DISTINCT journey_key) FILTER (WHERE event_name = 'cp_sailing_started')::int AS cp_sailing_started_journeys,
        COUNT(DISTINCT journey_key) FILTER (WHERE event_name = 'cp_board_created')::int AS cp_boards_created_journeys,
        COUNT(DISTINCT journey_key) FILTER (WHERE event_name = 'network_handoff' AND orig = 'dcc' AND dest = 'cruisepromenade')::int AS dcc_to_cp_journeys,
        COUNT(DISTINCT journey_key) FILTER (WHERE orig = 'partyatredrocks' AND (event_name = 'dcc_plan_opened' OR dest = 'dcc'))::int AS parr_to_dcc_journeys,
        COUNT(DISTINCT journey_key) FILTER (WHERE orig = 'gosno' AND (event_name = 'dcc_plan_opened' OR dest = 'dcc'))::int AS gosno_to_dcc_journeys,
        COUNT(DISTINCT journey_key) AS total_distinct_journeys
      FROM scoped
    `);

    const row = (result.rows?.[0] || {}) as Record<string, unknown>;
    const n = (key: string) => Number(row[key] ?? 0) || 0;

    const parrJourneys = n("parr_journeys");
    const gosnoJourneys = n("gosno_journeys");
    const dccPlanningJourneys = n("dcc_planning_journeys");
    const returnedToBookingJourneys = n("returned_to_booking_journeys");
    const verifiedBookingJourneys = n("verified_booking_journeys");
    const dccToCpJourneys = n("dcc_to_cp_journeys");
    const totalDistinctJourneys = n("total_distinct_journeys");

    return {
      windowDays,
      totalEvents: n("total_events"),
      parrPageviews: n("parr_pageviews"),
      gosnoPageviews: n("gosno_pageviews"),
      dccPageviews: n("dcc_pageviews"),
      cpPageviews: n("cp_pageviews"),
      parrJourneys,
      gosnoJourneys,
      dccPlanningJourneys,
      returnedToBookingJourneys,
      verifiedBookingJourneys,
      completedBookings: n("completed_bookings"),
      cpJourneys: n("cp_journeys"),
      cpSailingStartedJourneys: n("cp_sailing_started_journeys"),
      cpBoardsCreatedJourneys: n("cp_boards_created_journeys"),
      dccToCpJourneys,
      parrToDccPct: pct(n("parr_to_dcc_journeys"), parrJourneys),
      gosnoToDccPct: pct(n("gosno_to_dcc_journeys"), gosnoJourneys),
      dccToSpecialistReturnPct: pct(returnedToBookingJourneys, dccPlanningJourneys),
      dccToCpPct: pct(dccToCpJourneys, Math.max(n("dcc_pageviews"), dccPlanningJourneys)),
      journeyToBookingPct: pct(verifiedBookingJourneys, totalDistinctJourneys),
    };
  } catch {
    return empty;
  }
}
