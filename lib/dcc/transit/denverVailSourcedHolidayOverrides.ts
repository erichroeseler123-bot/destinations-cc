import type {
  GtfsCorridorTrip,
  OperatorRouteScheduleBundle,
} from "./denverVailGtfsScheduleData";

/**
 * Sourced holiday schedule overrides reconciling raw RTD/CDOT GTFS
 * (`bustang-co-us.zip`) with Bustang's official published route schedules.
 *
 * IMPORTANT: Keep this file separate from `denverVailGtfsScheduleData.ts` so
 * these sourced operator holiday policies survive automated GTFS schedule
 * refreshes (`node scripts/dcc/refresh-denver-vail-gtfs-schedule.mjs`).
 */

export type BustangPublishedHolidayId =
  | "memorial_day"
  | "july_4th"
  | "thanksgiving"
  | "christmas";

export interface BustangPublishedHolidayMatch {
  id: BustangPublishedHolidayId;
  name: string;
  date: string;
}

export interface SourcedOperatorHolidayOverride {
  holidayId: BustangPublishedHolidayId;
  holidayName: string;
  operatorId: OperatorRouteScheduleBundle["operatorId"];
  mode: "reduced_holiday_runs" | "no_holiday_service";
  sourceUrl: string;
  publishedPolicyQuote: string;
  reconciliationSummary: string;
  allowedDepartureTimes24h: string[];
  excludedDepartureTimes24h: string[];
}

export const BUSTANG_WEST_LINE_PUBLISHED_HOLIDAY_SOURCE = {
  sourceUrl: "https://ridebustang.com/routes/west-line/",
  publishedPolicyQuote:
    "Holiday service runs on Memorial Day, July 4th, Thanksgiving, and Christmas.",
  /**
   * Published "Westbound – Holidays" timetable departures from
   * Denver Union Station Gate B19 (#34316) to Vail Transportation Center (#35174).
   * Raw GTFS `calendar_dates.txt` maps holidays to the full 15-trip `SU` schedule,
   * whereas Bustang's published Holiday timetable runs 10 trips and marks 5 Sunday
   * departures (8:00 a.m., 10:15 a.m., 11:45 a.m., 2:45 p.m., 3:30 p.m.) as `—`.
   */
  allowedWestboundUnionStationDepartures24h: [
    "06:00",
    "07:00",
    "08:45",
    "09:30",
    "11:00",
    "12:30",
    "13:15",
    "14:00",
    "16:30",
    "17:15",
  ] as const,
  excludedSundayDeparturesOnHolidays24h: [
    "08:00",
    "10:15",
    "11:45",
    "14:45",
    "15:30",
  ] as const,
} as const;

export const PEGASUS_PUBLISHED_HOLIDAY_SOURCE = {
  sourceUrl: "https://ridebustang.com/routes/denver-avon/",
  publishedPolicyQuote: "Service does not run on Thanksgiving or Christmas.",
  noServiceHolidays: ["thanksgiving", "christmas"] as const,
} as const;

/**
 * Resolves whether a YYYY-MM-DD date is one of the four holidays governed by
 * Bustang's published holiday schedules (Memorial Day, July 4th, Thanksgiving,
 * or Christmas). Uses calendar rules so the reconciliation survives future
 * annual GTFS feed refreshes.
 */
export function resolveBustangPublishedHoliday(
  arrivalDate: string,
): BustangPublishedHolidayMatch | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(arrivalDate)) {
    return null;
  }
  const [y, m, d] = arrivalDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }

  const dow = dt.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 4 = Thu

  // Memorial Day: Last Monday of May (May 25..31)
  if (m === 5 && dow === 1 && d >= 25) {
    return { id: "memorial_day", name: "Memorial Day", date: arrivalDate };
  }

  // Independence Day: July 4th
  if (m === 7 && d === 4) {
    return { id: "july_4th", name: "July 4th", date: arrivalDate };
  }

  // Thanksgiving: Fourth Thursday of November (Nov 22..28)
  if (m === 11 && dow === 4 && d >= 22 && d <= 28) {
    return { id: "thanksgiving", name: "Thanksgiving", date: arrivalDate };
  }

  // Christmas: December 25
  if (m === 12 && d === 25) {
    return { id: "christmas", name: "Christmas", date: arrivalDate };
  }

  return null;
}

function normalizeTripDepTo24h(dep: string): string {
  const parts = dep.trim().split(":");
  if (parts.length < 2) return dep.trim();
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (Number.isNaN(h) || Number.isNaN(m)) return dep.trim();
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Reconciles a single operator's raw GTFS trips for `arrivalDate` against
 * Bustang's published holiday schedules.
 */
export function applySourcedHolidayOverrideToTrips(params: {
  operatorId: OperatorRouteScheduleBundle["operatorId"];
  arrivalDate: string;
  rawTrips: GtfsCorridorTrip[];
}): {
  trips: GtfsCorridorTrip[];
  override: SourcedOperatorHolidayOverride | null;
} {
  const holiday = resolveBustangPublishedHoliday(params.arrivalDate);
  if (!holiday) {
    return { trips: params.rawTrips, override: null };
  }

  if (params.operatorId === "cdot_bustang_west") {
    const allowedSet = new Set<string>(
      BUSTANG_WEST_LINE_PUBLISHED_HOLIDAY_SOURCE.allowedWestboundUnionStationDepartures24h,
    );
    const filteredTrips = params.rawTrips.filter((t) =>
      allowedSet.has(normalizeTripDepTo24h(t.dep)),
    );
    const excludedTrips = params.rawTrips
      .map((t) => normalizeTripDepTo24h(t.dep))
      .filter((dep24h) => !allowedSet.has(dep24h));

    return {
      trips: filteredTrips,
      override: {
        holidayId: holiday.id,
        holidayName: holiday.name,
        operatorId: "cdot_bustang_west",
        mode: "reduced_holiday_runs",
        sourceUrl: BUSTANG_WEST_LINE_PUBLISHED_HOLIDAY_SOURCE.sourceUrl,
        publishedPolicyQuote:
          BUSTANG_WEST_LINE_PUBLISHED_HOLIDAY_SOURCE.publishedPolicyQuote,
        reconciliationSummary: `Published Bustang Westbound – Holidays schedule for ${holiday.name} (${params.arrivalDate}) operates ${filteredTrips.length} of ${params.rawTrips.length} GTFS SU runs from Union Station Gate B19 (excludes ${excludedTrips.join(", ") || "8:00 a.m., 10:15 a.m., 11:45 a.m., 2:45 p.m., 3:30 p.m."}).`,
        allowedDepartureTimes24h: [
          ...BUSTANG_WEST_LINE_PUBLISHED_HOLIDAY_SOURCE.allowedWestboundUnionStationDepartures24h,
        ],
        excludedDepartureTimes24h: excludedTrips,
      },
    };
  }

  if (
    params.operatorId === "cdot_pegasus" &&
    (
      PEGASUS_PUBLISHED_HOLIDAY_SOURCE.noServiceHolidays as readonly string[]
    ).includes(holiday.id)
  ) {
    const excludedTrips = params.rawTrips.map((t) =>
      normalizeTripDepTo24h(t.dep),
    );
    return {
      trips: [],
      override: {
        holidayId: holiday.id,
        holidayName: holiday.name,
        operatorId: "cdot_pegasus",
        mode: "no_holiday_service",
        sourceUrl: PEGASUS_PUBLISHED_HOLIDAY_SOURCE.sourceUrl,
        publishedPolicyQuote:
          PEGASUS_PUBLISHED_HOLIDAY_SOURCE.publishedPolicyQuote,
        reconciliationSummary: `Published Bustang Pegasus policy for ${holiday.name} (${params.arrivalDate}): "${PEGASUS_PUBLISHED_HOLIDAY_SOURCE.publishedPolicyQuote}" Overrides raw GTFS SU exception (no Pegasus service).`,
        allowedDepartureTimes24h: [],
        excludedDepartureTimes24h: excludedTrips,
      },
    };
  }

  return { trips: params.rawTrips, override: null };
}
