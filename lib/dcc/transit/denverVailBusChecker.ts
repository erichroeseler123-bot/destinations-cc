import {
  BUSTANG_WEST_SCHEDULE_BUNDLE,
  DENVER_VAIL_GTFS_METADATA,
  type GtfsCorridorTrip,
  type OperatorRouteScheduleBundle,
  PEGASUS_SCHEDULE_BUNDLE,
  RTD_A_LINE_SCHEDULE_BUNDLE,
} from "./denverVailGtfsScheduleData";
import {
  applySourcedHolidayOverrideToTrips,
  type SourcedOperatorHolidayOverride,
} from "./denverVailSourcedHolidayOverrides";

export const DENVER_VAIL_GTFS_METADATA_PUBLIC = DENVER_VAIL_GTFS_METADATA;
export const MIN_UNION_STATION_TRANSFER_MINUTES = 15;
export const UNION_STATION_TRACK1_TO_B19_WALK_MINUTES = 10;
export const BUSTANG_COACH_BAY_LOADING_CUTOFF_MINUTES = 5;

export type LuggageOptionId =
  | "skis_and_checked"
  | "checked_only"
  | "skis_and_personal"
  | "personal_only";

export interface LuggageOptionSpec {
  id: LuggageOptionId;
  label: string;
  shortLabel: string;
  defaultBaggageMinutes: number;
  baggageBreakdownLabel: string;
  bustangWestAllowed: boolean;
  pegasusAllowed: boolean;
  pegasusRuleNote: string;
}

export const LUGGAGE_OPTIONS: Record<LuggageOptionId, LuggageOptionSpec> = {
  skis_and_checked: {
    id: "skis_and_checked",
    label: "Skis + checked suitcase",
    shortLabel: "Skis + checked suitcase",
    defaultBaggageMinutes: 45,
    baggageBreakdownLabel:
      "15 min deplane & concourse train + 20 min oversized ski/bag claim at DEN Level 5 + 10 min walk to DEN Transit Center Level 1",
    bustangWestAllowed: true,
    pegasusAllowed: false,
    pegasusRuleNote:
      'Pegasus shuttle vans restrict luggage to 1 personal item (16"×16"×12") + 1 ski/snowboard bag; full-size checked suitcases are prohibited.',
  },
  checked_only: {
    id: "checked_only",
    label: "Checked suitcase only (no skis)",
    shortLabel: "Checked suitcase only",
    defaultBaggageMinutes: 35,
    baggageBreakdownLabel:
      "15 min deplane & concourse train + 10 min standard carousel claim at DEN Level 5 + 10 min walk to DEN Transit Center Level 1",
    bustangWestAllowed: true,
    pegasusAllowed: false,
    pegasusRuleNote:
      'Pegasus shuttle vans restrict luggage to 1 personal item (16"×16"×12"); full-size checked suitcases are prohibited.',
  },
  skis_and_personal: {
    id: "skis_and_personal",
    label: 'Skis + small under-seat bag (≤ 16"×16"×12", no suitcase)',
    shortLabel: "Skis + small under-seat bag",
    defaultBaggageMinutes: 45,
    baggageBreakdownLabel:
      "15 min deplane & concourse train + 20 min oversized ski claim at DEN Level 5 + 10 min walk to DEN Transit Center Level 1",
    bustangWestAllowed: true,
    pegasusAllowed: true,
    pegasusRuleNote:
      'Fits Pegasus luggage rule: 1 personal item (≤ 16"×16"×12") + 1 ski/snowboard bag.',
  },
  personal_only: {
    id: "personal_only",
    label: 'Small personal item only (≤ 16"×16"×12", no checked bags)',
    shortLabel: "Small personal item only",
    defaultBaggageMinutes: 20,
    baggageBreakdownLabel:
      "10 min deplane & concourse train + 0 min baggage claim + 10 min walk to DEN Transit Center Level 1",
    bustangWestAllowed: true,
    pegasusAllowed: true,
    pegasusRuleNote:
      'Fits Pegasus luggage rule: 1 personal item (≤ 16"×16"×12") and no full-size suitcase.',
  },
};

export interface FormattedTripLeg {
  tripId: string;
  serviceId: string;
  originStopId: string;
  originStopName: string;
  destStopId: string;
  destStopName: string;
  dep24h: string; // HH:MM
  arr24h: string; // HH:MM
  dep12h: string; // e.g. "3:57 p.m."
  arr12h: string; // e.g. "4:34 p.m."
  depMin: number;
  arrMin: number;
  durationMinutes: number;
}

export interface ResolvedOperatorSchedule {
  operatorId: OperatorRouteScheduleBundle["operatorId"];
  operatorName: string;
  routeId: string;
  feedVersion: string;
  feedStartDate: string;
  feedEndDate: string;
  inFeedWindow: boolean;
  baseCalendarServiceIds: string[];
  addedExceptionServiceIds: string[];
  removedExceptionServiceIds: string[];
  activeCalendarServiceIds: string[];
  activeRouteServiceIds: string[];
  holidayExceptionSummary: string | null;
  sourcedHolidayOverride: SourcedOperatorHolidayOverride | null;
  trips: FormattedTripLeg[];
}

export type BusCheckerVerdict =
  | "fits"
  | "fits_pegasus_only"
  | "misses"
  | "schedule_needs_verification";

export type MissReasonCode =
  | "union_transfer_under_15_min"
  | "arrives_after_last_bus"
  | "after_last_a_line"
  | null;

export interface DenverVailBusCheckInput {
  arrivalDate: string; // YYYY-MM-DD
  arrivalTime: string; // HH:MM (24-hour local time)
  luggage: LuggageOptionId;
  baggageEstimateMinutes?: number;
}

export interface DenverVailBusCheckResult {
  input: {
    arrivalDate: string;
    arrivalTime24h: string;
    arrivalTime12h: string;
    luggage: LuggageOptionSpec;
    baggageEstimateMinutes: number;
    isCustomBaggageEstimate: boolean;
  };
  scheduleStatusLabel: "scheduled" | "Schedule needs verification";
  verdict: BusCheckerVerdict;
  verdictBadge: string;
  verdictSummary: string;
  missReason: MissReasonCode;
  denPlatformReadyTime24h: string | null;
  denPlatformReadyTime12h: string | null;
  aLineTrain: FormattedTripLeg | null;
  waitAtDenMinutes: number | null;
  gateB19Transfer: {
    minutes: number | null;
    minimumRequiredMinutes: number;
    passesMinimum: boolean;
    failsUnderMinimum: boolean;
    statusText: string;
    targetBustangTrip: FormattedTripLeg | null;
    lastBustangWestTrip: FormattedTripLeg | null;
  };
  bustangWestConnection: FormattedTripLeg | null;
  /** Populated ONLY when both Pegasus schedule (>=15m transfer) AND Pegasus luggage rules fit */
  pegasusConnection: {
    trip: FormattedTripLeg;
    transferMinutes: number;
    boardingStopLabel: string;
  } | null;
  scheduledVailArrival12h: string | null;
  scheduledVailArrival24h: string | null;
  scheduledVailArrivalRouteLabel: string | null;
  combinedFareLabel: string;
  assumptions: string[];
  gosnoAvailabilityUrl: string;
  serviceCalendars: {
    rtdALine: ResolvedOperatorSchedule;
    bustangWest: ResolvedOperatorSchedule;
    pegasus: ResolvedOperatorSchedule;
  };
  activeServiceIds: {
    rtdALine: string | null;
    bustangWest: string | null;
    pegasus: string[];
  };
}

export function parseTimeToMinutes(timeStr: string): number | null {
  const trimmed = timeStr.trim();
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (Number.isNaN(h) || Number.isNaN(m) || m < 0 || m > 59 || h < 0 || h > 29) {
    return null;
  }
  return h * 60 + m;
}

export function formatMinutesTo24h(totalMin: number): string {
  const normalized = ((Math.round(totalMin) % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatMinutesTo12h(totalMin: number): string {
  const normalized = ((Math.round(totalMin) % 1440) + 1440) % 1440;
  const h24 = Math.floor(normalized / 60);
  const m = normalized % 60;
  const period = h24 >= 12 ? "p.m." : "a.m.";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function toFormattedLeg(
  trip: GtfsCorridorTrip,
  originStopId: string,
  originStopName: string,
  destStopId: string,
  destStopName: string,
): FormattedTripLeg {
  const depMin = parseTimeToMinutes(trip.dep) ?? 0;
  const arrMin = parseTimeToMinutes(trip.arr) ?? 0;
  return {
    tripId: trip.tripId,
    serviceId: trip.serviceId,
    originStopId,
    originStopName,
    destStopId,
    destStopName,
    dep24h: formatMinutesTo24h(depMin),
    arr24h: formatMinutesTo24h(arrMin),
    dep12h: formatMinutesTo12h(depMin),
    arr12h: formatMinutesTo12h(arrMin),
    depMin,
    arrMin,
    durationMinutes: arrMin - depMin,
  };
}

const DOW_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

/**
 * Evaluates a single operator's GTFS calendar.txt and calendar_dates.txt
 * independently for a given YYYY-MM-DD date.
 */
export function resolveOperatorScheduleForDate(
  bundle: OperatorRouteScheduleBundle,
  arrivalDate: string,
  originStopId: string,
  originStopName: string,
  destStopId: string,
  destStopName: string,
): ResolvedOperatorSchedule {
  const emptyResult: ResolvedOperatorSchedule = {
    operatorId: bundle.operatorId,
    operatorName: bundle.operatorName,
    routeId: bundle.routeId,
    feedVersion: bundle.feedVersion,
    feedStartDate: bundle.feedStartDate,
    feedEndDate: bundle.feedEndDate,
    inFeedWindow: false,
    baseCalendarServiceIds: [],
    addedExceptionServiceIds: [],
    removedExceptionServiceIds: [],
    activeCalendarServiceIds: [],
    activeRouteServiceIds: [],
    holidayExceptionSummary: null,
    sourcedHolidayOverride: null,
    trips: [],
  };

  if (!/^\d{4}-\d{2}-\d{2}$/.test(arrivalDate)) {
    return emptyResult;
  }

  const [y, m, d] = arrivalDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return emptyResult;
  }

  if (arrivalDate < bundle.feedStartDate || arrivalDate > bundle.feedEndDate) {
    return emptyResult;
  }

  const dowKey = DOW_KEYS[dt.getUTCDay()];
  const baseCalendarServiceIds: string[] = [];
  const activeSet = new Set<string>();

  for (const row of bundle.calendar) {
    if (
      arrivalDate >= row.startDate &&
      arrivalDate <= row.endDate &&
      row[dowKey]
    ) {
      baseCalendarServiceIds.push(row.serviceId);
      activeSet.add(row.serviceId);
    }
  }

  const addedExceptionServiceIds: string[] = [];
  const removedExceptionServiceIds: string[] = [];

  for (const ex of bundle.calendarDates) {
    if (ex.date !== arrivalDate) continue;
    if (ex.exceptionType === 2) {
      removedExceptionServiceIds.push(ex.serviceId);
      activeSet.delete(ex.serviceId);
    } else if (ex.exceptionType === 1) {
      addedExceptionServiceIds.push(ex.serviceId);
      activeSet.add(ex.serviceId);
    }
  }

  const activeCalendarServiceIds = [...activeSet];
  const rawRouteServiceIds = activeCalendarServiceIds.filter(
    (svc) => (bundle.tripsByService[svc]?.length ?? 0) > 0,
  );

  const rawTrips = rawRouteServiceIds.flatMap(
    (svc) => bundle.tripsByService[svc] ?? [],
  );

  const { trips: reconciledRawTrips, override: sourcedHolidayOverride } =
    applySourcedHolidayOverrideToTrips({
      operatorId: bundle.operatorId,
      arrivalDate,
      rawTrips,
    });

  const activeRouteServiceIds =
    sourcedHolidayOverride?.mode === "no_holiday_service"
      ? []
      : rawRouteServiceIds;

  const trips = reconciledRawTrips
    .map((t) =>
      toFormattedLeg(t, originStopId, originStopName, destStopId, destStopName),
    )
    .sort((a, b) => a.depMin - b.depMin);

  const exceptionSummaryParts: string[] = [];
  if (
    addedExceptionServiceIds.length > 0 ||
    removedExceptionServiceIds.length > 0
  ) {
    const parts: string[] = [];
    if (removedExceptionServiceIds.length > 0) {
      parts.push(`removed ${removedExceptionServiceIds.join(", ")}`);
    }
    if (addedExceptionServiceIds.length > 0) {
      parts.push(`added ${addedExceptionServiceIds.join(", ")}`);
    }
    exceptionSummaryParts.push(
      `calendar_dates.txt exception on ${arrivalDate}: ${parts.join("; ")}`,
    );
  }
  if (sourcedHolidayOverride) {
    exceptionSummaryParts.push(sourcedHolidayOverride.reconciliationSummary);
  }

  const holidayExceptionSummary =
    exceptionSummaryParts.length > 0
      ? exceptionSummaryParts.join(" · ")
      : null;

  return {
    operatorId: bundle.operatorId,
    operatorName: bundle.operatorName,
    routeId: bundle.routeId,
    feedVersion: bundle.feedVersion,
    feedStartDate: bundle.feedStartDate,
    feedEndDate: bundle.feedEndDate,
    inFeedWindow: true,
    baseCalendarServiceIds,
    addedExceptionServiceIds,
    removedExceptionServiceIds,
    activeCalendarServiceIds,
    activeRouteServiceIds,
    holidayExceptionSummary,
    sourcedHolidayOverride,
    trips,
  };
}

/**
 * Resolves RTD A Line, CDOT Bustang West Line, and CDOT Pegasus schedules
 * separately using each operator's own calendar.txt and calendar_dates.txt.
 */
export function resolveDateServiceSchedules(arrivalDate: string): {
  rtdALine: ResolvedOperatorSchedule;
  bustangWest: ResolvedOperatorSchedule;
  pegasus: ResolvedOperatorSchedule;
  allRequiredSchedulesVerified: boolean;
} {
  const stops = DENVER_VAIL_GTFS_METADATA.stops;

  const rtdALine = resolveOperatorScheduleForDate(
    RTD_A_LINE_SCHEDULE_BUNDLE,
    arrivalDate,
    stops.denAirportStation.stopId,
    stops.denAirportStation.stopName,
    stops.unionStationRail.stopId,
    stops.unionStationRail.stopName,
  );

  const bustangWest = resolveOperatorScheduleForDate(
    BUSTANG_WEST_SCHEDULE_BUNDLE,
    arrivalDate,
    stops.unionStationBustangGate.stopId,
    stops.unionStationBustangGate.stopName,
    stops.vailTransportationCenter.stopId,
    stops.vailTransportationCenter.stopName,
  );

  const pegasus = resolveOperatorScheduleForDate(
    PEGASUS_SCHEDULE_BUNDLE,
    arrivalDate,
    stops.unionStationPegasusStop.stopId,
    stops.unionStationPegasusStop.stopName,
    stops.vailTransportationCenter.stopId,
    stops.vailTransportationCenter.stopName,
  );

  const allRequiredSchedulesVerified =
    rtdALine.inFeedWindow &&
    bustangWest.inFeedWindow &&
    rtdALine.trips.length > 0 &&
    bustangWest.trips.length > 0;

  return {
    rtdALine,
    bustangWest,
    pegasus,
    allRequiredSchedulesVerified,
  };
}

/**
 * Builds the GoSno fallback URL carrying ONLY origin, destination, and the
 * traveler's selected date—without demo passenger count, vehicle class, or gear.
 */
export function buildGoSnoAvailabilityUrl(params: {
  arrivalDate: string;
}): string {
  const url = new URL("https://gosno.co/vail");
  url.searchParams.set("origin", "DEN");
  url.searchParams.set("destination", "Vail");
  if (/^\d{4}-\d{2}-\d{2}$/.test(params.arrivalDate)) {
    url.searchParams.set("date", params.arrivalDate);
  }
  return url.toString();
}

export function evaluateDenverVailBusCheck(
  input: DenverVailBusCheckInput,
): DenverVailBusCheckResult {
  const luggageSpec =
    LUGGAGE_OPTIONS[input.luggage] ?? LUGGAGE_OPTIONS.skis_and_checked;
  const rawEstimate =
    typeof input.baggageEstimateMinutes === "number" &&
    !Number.isNaN(input.baggageEstimateMinutes)
      ? Math.max(0, Math.min(240, Math.round(input.baggageEstimateMinutes)))
      : luggageSpec.defaultBaggageMinutes;
  const isCustomBaggageEstimate =
    rawEstimate !== luggageSpec.defaultBaggageMinutes;

  const arrivalMin = parseTimeToMinutes(input.arrivalTime);
  const arrivalTime24h =
    arrivalMin !== null ? formatMinutesTo24h(arrivalMin) : input.arrivalTime;
  const arrivalTime12h =
    arrivalMin !== null ? formatMinutesTo12h(arrivalMin) : input.arrivalTime;

  const gosnoAvailabilityUrl = buildGoSnoAvailabilityUrl({
    arrivalDate: input.arrivalDate,
  });

  const resolved = resolveDateServiceSchedules(input.arrivalDate);

  if (!resolved.allRequiredSchedulesVerified || arrivalMin === null) {
    return {
      input: {
        arrivalDate: input.arrivalDate,
        arrivalTime24h,
        arrivalTime12h,
        luggage: luggageSpec,
        baggageEstimateMinutes: rawEstimate,
        isCustomBaggageEstimate,
      },
      scheduleStatusLabel: "Schedule needs verification",
      verdict: "schedule_needs_verification",
      verdictBadge: "Schedule needs verification",
      verdictSummary: `Published RTD A Line (${RTD_A_LINE_SCHEDULE_BUNDLE.feedStartDate} to ${RTD_A_LINE_SCHEDULE_BUNDLE.feedEndDate}) and CDOT Bustang/Pegasus (${BUSTANG_WEST_SCHEDULE_BUNDLE.feedStartDate} to ${BUSTANG_WEST_SCHEDULE_BUNDLE.feedEndDate}) GTFS schedules in this build do not cover ${input.arrivalDate || "your date"}. Refresh or verify the schedule before relying on a bus connection.`,
      missReason: null,
      denPlatformReadyTime24h: null,
      denPlatformReadyTime12h: null,
      aLineTrain: null,
      waitAtDenMinutes: null,
      gateB19Transfer: {
        minutes: null,
        minimumRequiredMinutes: MIN_UNION_STATION_TRANSFER_MINUTES,
        passesMinimum: false,
        failsUnderMinimum: false,
        statusText: "Schedule needs verification",
        targetBustangTrip: null,
        lastBustangWestTrip: null,
      },
      bustangWestConnection: null,
      pegasusConnection: null,
      scheduledVailArrival12h: null,
      scheduledVailArrival24h: null,
      scheduledVailArrivalRouteLabel: null,
      combinedFareLabel: "$27.00 ($10.00 RTD A Line + $17.00 Bustang West Line)",
      assumptions: [
        `RTD A Line GTFS window: ${RTD_A_LINE_SCHEDULE_BUNDLE.feedStartDate} to ${RTD_A_LINE_SCHEDULE_BUNDLE.feedEndDate} (${RTD_A_LINE_SCHEDULE_BUNDLE.feedVersion}).`,
        `CDOT Bustang West Line & Pegasus GTFS window: ${BUSTANG_WEST_SCHEDULE_BUNDLE.feedStartDate} to ${BUSTANG_WEST_SCHEDULE_BUNDLE.feedEndDate} (${BUSTANG_WEST_SCHEDULE_BUNDLE.feedVersion}).`,
        `Refresh command before ${DENVER_VAIL_GTFS_METADATA.validEndDate} expiration: ${DENVER_VAIL_GTFS_METADATA.refreshCommand} (see ${DENVER_VAIL_GTFS_METADATA.refreshRunbookPath}).`,
      ],
      gosnoAvailabilityUrl,
      serviceCalendars: {
        rtdALine: resolved.rtdALine,
        bustangWest: resolved.bustangWest,
        pegasus: resolved.pegasus,
      },
      activeServiceIds: {
        rtdALine: null,
        bustangWest: null,
        pegasus: [],
      },
    };
  }

  const denPlatformReadyMin = arrivalMin + rawEstimate;
  const denPlatformReadyTime24h = formatMinutesTo24h(denPlatformReadyMin);
  const denPlatformReadyTime12h = formatMinutesTo12h(denPlatformReadyMin);

  const aLineTrain =
    resolved.rtdALine.trips.find((t) => t.depMin >= denPlatformReadyMin) ??
    null;
  const waitAtDenMinutes = aLineTrain
    ? aLineTrain.depMin - denPlatformReadyMin
    : null;

  const lastBustangWestTrip =
    resolved.bustangWest.trips[resolved.bustangWest.trips.length - 1] ?? null;

  // Apply the 15-minute minimum consistently for Bustang West Line at Gate B19
  const matchingWestTrip = aLineTrain
    ? (resolved.bustangWest.trips.find(
        (b) => b.depMin - aLineTrain.arrMin >= MIN_UNION_STATION_TRANSFER_MINUTES,
      ) ?? null)
    : null;

  // Check if there is a West Line bus that departs after A Line arrival, but with < 15 minutes
  const subMinimumWestTrip =
    aLineTrain && !matchingWestTrip
      ? (resolved.bustangWest.trips.find(
          (b) =>
            b.depMin >= aLineTrain.arrMin &&
            b.depMin - aLineTrain.arrMin < MIN_UNION_STATION_TRANSFER_MINUTES,
        ) ?? null)
      : null;

  const referenceWestTrip =
    matchingWestTrip ?? subMinimumWestTrip ?? lastBustangWestTrip;

  const rawTransferToReferenceMin =
    aLineTrain && referenceWestTrip
      ? referenceWestTrip.depMin - aLineTrain.arrMin
      : null;

  const passesMinimum = Boolean(matchingWestTrip);
  const failsUnderMinimum = Boolean(
    !matchingWestTrip &&
      subMinimumWestTrip &&
      rawTransferToReferenceMin !== null &&
      rawTransferToReferenceMin >= 0 &&
      rawTransferToReferenceMin < MIN_UNION_STATION_TRANSFER_MINUTES,
  );

  let gateB19StatusText: string;
  if (!aLineTrain) {
    gateB19StatusText = "No remaining A Line departure after baggage claim";
  } else if (matchingWestTrip && rawTransferToReferenceMin !== null) {
    gateB19StatusText = `${rawTransferToReferenceMin} min (${aLineTrain.arr12h} Track 1 → ${matchingWestTrip.dep12h} Gate B19 · meets ${MIN_UNION_STATION_TRANSFER_MINUTES}-min minimum)`;
  } else if (
    failsUnderMinimum &&
    subMinimumWestTrip &&
    rawTransferToReferenceMin !== null
  ) {
    gateB19StatusText = `${rawTransferToReferenceMin} min (${aLineTrain.arr12h} Track 1 → ${subMinimumWestTrip.dep12h} Gate B19 · fails ${MIN_UNION_STATION_TRANSFER_MINUTES}-min minimum)`;
  } else if (lastBustangWestTrip && rawTransferToReferenceMin !== null) {
    const minutesLate = Math.abs(rawTransferToReferenceMin);
    gateB19StatusText = `Misses Gate B19 by ${minutesLate} min (A Line arrives ${aLineTrain.arr12h}; last bus left at ${lastBustangWestTrip.dep12h})`;
  } else {
    gateB19StatusText = "No qualifying Bustang West Line connection";
  }

  // Evaluate Pegasus ONLY when its schedule (>= 15-min minimum transfer) AND luggage rules fit
  let pegasusConnection: DenverVailBusCheckResult["pegasusConnection"] = null;
  if (aLineTrain && luggageSpec.pegasusAllowed && resolved.pegasus.inFeedWindow) {
    const matchingPegasus = resolved.pegasus.trips.find(
      (p) => p.depMin - aLineTrain.arrMin >= MIN_UNION_STATION_TRANSFER_MINUTES,
    );
    if (matchingPegasus) {
      pegasusConnection = {
        trip: matchingPegasus,
        transferMinutes: matchingPegasus.depMin - aLineTrain.arrMin,
        boardingStopLabel: `${DENVER_VAIL_GTFS_METADATA.stops.unionStationPegasusStop.stopName} (#${DENVER_VAIL_GTFS_METADATA.stops.unionStationPegasusStop.stopId})`,
      };
    }
  }

  let verdict: BusCheckerVerdict;
  let verdictBadge: string;
  let verdictSummary: string;
  let missReason: MissReasonCode = null;
  let scheduledVailArrival12h: string | null = null;
  let scheduledVailArrival24h: string | null = null;
  let scheduledVailArrivalRouteLabel: string | null = null;

  if (matchingWestTrip && aLineTrain) {
    verdict = "fits";
    verdictBadge = "Fits (scheduled)";
    scheduledVailArrival12h = matchingWestTrip.arr12h;
    scheduledVailArrival24h = matchingWestTrip.arr24h;
    scheduledVailArrivalRouteLabel = `CDOT Bustang West Line (${matchingWestTrip.dep12h} from Gate B19 · trip ${matchingWestTrip.tripId})`;
    verdictSummary = `${arrivalTime12h} landing reaches DEN Station (#34476) by ${denPlatformReadyTime12h}, boards the ${aLineTrain.dep12h} A Line to Union Station Track 1 (${aLineTrain.arr12h}), leaves ${rawTransferToReferenceMin} minutes to transfer to Gate B19 (≥ ${MIN_UNION_STATION_TRANSFER_MINUTES}-minute minimum) for the ${matchingWestTrip.dep12h} Bustang West Line, and arrives in Vail at ${matchingWestTrip.arr12h}.`;
  } else if (pegasusConnection && aLineTrain) {
    verdict = "fits_pegasus_only";
    verdictBadge = "Fits via Pegasus (scheduled)";
    scheduledVailArrival12h = pegasusConnection.trip.arr12h;
    scheduledVailArrival24h = pegasusConnection.trip.arr24h;
    scheduledVailArrivalRouteLabel = `CDOT Pegasus Shuttle Van (trip ${pegasusConnection.trip.tripId})`;
    verdictSummary = `Misses the ${lastBustangWestTrip?.dep12h ?? "5:15 p.m."} Bustang West Line at Gate B19, but your compact luggage (${luggageSpec.shortLabel}) and arrival time fit the ${pegasusConnection.trip.dep12h} Pegasus van at Wewatta St & 17th St (#34385) with a ${pegasusConnection.transferMinutes}-minute transfer, arriving in Vail at ${pegasusConnection.trip.arr12h}.`;
  } else {
    verdict = "misses";
    if (
      failsUnderMinimum &&
      aLineTrain &&
      subMinimumWestTrip &&
      rawTransferToReferenceMin !== null
    ) {
      missReason = "union_transfer_under_15_min";
      verdictBadge = `Fails — ${rawTransferToReferenceMin} min at Union Station (scheduled)`;
      verdictSummary = `${arrivalTime12h} landing reaches DEN Station (#34476) at ${denPlatformReadyTime12h} and catches the ${aLineTrain.dep12h} A Line to Union Station Track 1 (${aLineTrain.arr12h}), leaving only ${rawTransferToReferenceMin} minutes before the last ${subMinimumWestTrip.dep12h} Bustang West Line at Gate B19. That fails the ${MIN_UNION_STATION_TRANSFER_MINUTES}-minute minimum transfer rule.`;
    } else if (
      aLineTrain &&
      lastBustangWestTrip &&
      rawTransferToReferenceMin !== null
    ) {
      missReason = "arrives_after_last_bus";
      const minutesAfter = Math.abs(rawTransferToReferenceMin);
      verdictBadge = "Misses last bus (scheduled)";
      const pegasusHolidayNote =
        luggageSpec.pegasusAllowed &&
        resolved.pegasus.sourcedHolidayOverride?.mode === "no_holiday_service"
          ? ` CDOT Pegasus is unavailable on ${resolved.pegasus.sourcedHolidayOverride.holidayName} per Bustang's published schedule.`
          : "";
      verdictSummary = `${arrivalTime12h} landing reaches DEN Station (#34476) at ${denPlatformReadyTime12h}. The earliest reachable A Line (${aLineTrain.dep12h}) arrives at Union Station Track 1 at ${aLineTrain.arr12h}—${minutesAfter} minutes after the last ${lastBustangWestTrip.dep12h} Bustang West Line has departed Gate B19.${pegasusHolidayNote}`;
    } else {
      missReason = "after_last_a_line";
      verdictBadge = "Misses last bus (scheduled)";
      verdictSummary = `${arrivalTime12h} landing misses the last connecting A Line and Bustang West Line departure to Vail for ${input.arrivalDate}.`;
    }
  }

  const rtdSvcLabel = `${resolved.rtdALine.activeRouteServiceIds.join("+") || "none"}${
    resolved.rtdALine.holidayExceptionSummary
      ? ` (${resolved.rtdALine.holidayExceptionSummary})`
      : ""
  }`;
  const westSvcLabel = `${resolved.bustangWest.activeRouteServiceIds.join("+") || "none"}${
    resolved.bustangWest.holidayExceptionSummary
      ? ` (${resolved.bustangWest.holidayExceptionSummary})`
      : ""
  }`;
  const pegaSvcLabel = `${resolved.pegasus.activeRouteServiceIds.join("+") || "no service"}${
    resolved.pegasus.holidayExceptionSummary
      ? ` (${resolved.pegasus.holidayExceptionSummary})`
      : ""
  }`;

  const bustangAssumptionText = matchingWestTrip
    ? `Bustang West Line calendar (${westSvcLabel}, matched coach trip ${matchingWestTrip.tripId}): departs Union Station Gate B19 (#34316) at ${matchingWestTrip.dep12h} (${matchingWestTrip.dep24h}) → arrives Vail Transportation Center (#35174) at ${matchingWestTrip.arr12h} (${matchingWestTrip.arr24h}); last coach of the day departs at ${lastBustangWestTrip?.dep12h ?? "5:15 p.m."}.`
    : `Bustang West Line calendar (${westSvcLabel}, last coach trip ${lastBustangWestTrip?.tripId ?? "N/A"}): departs Union Station Gate B19 (#34316) at ${lastBustangWestTrip?.dep12h ?? "5:15 p.m."} (${lastBustangWestTrip?.dep24h ?? "17:15"}) → arrives Vail Transportation Center (#35174) at ${lastBustangWestTrip?.arr12h ?? "7:35 p.m."} (${lastBustangWestTrip?.arr24h ?? "19:35"}).`;

  const pegasusAssumptionText =
    resolved.pegasus.sourcedHolidayOverride?.mode === "no_holiday_service"
      ? `CDOT Pegasus calendar (${pegaSvcLabel}): unavailable on ${resolved.pegasus.sourcedHolidayOverride.holidayName} (${resolved.pegasus.sourcedHolidayOverride.sourceUrl}).`
      : luggageSpec.pegasusAllowed
        ? pegasusConnection
          ? `CDOT Pegasus calendar (${pegaSvcLabel}, trip ${pegasusConnection.trip.tripId}): shown because ${luggageSpec.shortLabel} meets Pegasus's ≤ 16"×16"×12" personal-item rule and the ${pegasusConnection.trip.dep12h} departure from Wewatta St & 17th St (#34385) has a ${pegasusConnection.transferMinutes}-minute transfer (≥ ${MIN_UNION_STATION_TRANSFER_MINUTES} min).`
          : `CDOT Pegasus calendar (${pegaSvcLabel}): luggage rules fit (${luggageSpec.shortLabel}), but no Pegasus departure has ≥ ${MIN_UNION_STATION_TRANSFER_MINUTES} minutes after A Line arrival.`
        : `CDOT Pegasus calendar (${pegaSvcLabel}, 7:30 p.m. from Wewatta St & 17th St #34385): hidden/excluded because ${luggageSpec.shortLabel} includes a full-size checked suitcase exceeding Pegasus's 16"×16"×12" under-seat limit.`;

  const assumptions: string[] = [
    `DEN touchdown to A Line platform (#34476): ${rawEstimate} min ${isCustomBaggageEstimate ? "(custom estimate)" : `(default for ${luggageSpec.shortLabel}: ${luggageSpec.baggageBreakdownLabel})`} → ready at ${denPlatformReadyTime12h} (${denPlatformReadyTime24h}).`,
    aLineTrain
      ? `RTD A Line calendar (${rtdSvcLabel}, trip ${aLineTrain.tripId}): departs Denver Airport Station (#34476) at ${aLineTrain.dep12h} (${aLineTrain.dep24h}) → arrives Union Station Track 1 (#34667) at ${aLineTrain.arr12h} (${aLineTrain.arr24h}, 37 min scheduled).`
      : `RTD A Line calendar (${rtdSvcLabel}): no remaining departure before the final Vail bus connection.`,
    `Union Station transfer rule: ${MIN_UNION_STATION_TRANSFER_MINUTES}-minute minimum applied consistently (${UNION_STATION_TRACK1_TO_B19_WALK_MINUTES} min walk from Track 1 #34667 to Underground Bus Concourse Gate B19 #34316 + ${BUSTANG_COACH_BAY_LOADING_CUTOFF_MINUTES} min under-coach ski/luggage bay loading cutoff).`,
    bustangAssumptionText,
    pegasusAssumptionText,
  ];

  return {
    input: {
      arrivalDate: input.arrivalDate,
      arrivalTime24h,
      arrivalTime12h,
      luggage: luggageSpec,
      baggageEstimateMinutes: rawEstimate,
      isCustomBaggageEstimate,
    },
    scheduleStatusLabel: "scheduled",
    verdict,
    verdictBadge,
    verdictSummary,
    missReason,
    denPlatformReadyTime24h,
    denPlatformReadyTime12h,
    aLineTrain,
    waitAtDenMinutes,
    gateB19Transfer: {
      minutes: rawTransferToReferenceMin,
      minimumRequiredMinutes: MIN_UNION_STATION_TRANSFER_MINUTES,
      passesMinimum,
      failsUnderMinimum,
      statusText: gateB19StatusText,
      targetBustangTrip: referenceWestTrip,
      lastBustangWestTrip,
    },
    bustangWestConnection: matchingWestTrip,
    pegasusConnection,
    scheduledVailArrival12h,
    scheduledVailArrival24h,
    scheduledVailArrivalRouteLabel,
    combinedFareLabel:
      verdict === "fits_pegasus_only"
        ? "$30.00 ($10.00 RTD A Line + $20.00 CDOT Pegasus)"
        : "$27.00 ($10.00 RTD A Line + $17.00 Bustang West Line)",
    assumptions,
    gosnoAvailabilityUrl,
    serviceCalendars: {
      rtdALine: resolved.rtdALine,
      bustangWest: resolved.bustangWest,
      pegasus: resolved.pegasus,
    },
    activeServiceIds: {
      rtdALine: resolved.rtdALine.activeRouteServiceIds[0] ?? null,
      bustangWest: resolved.bustangWest.activeRouteServiceIds[0] ?? null,
      pegasus: resolved.pegasus.activeRouteServiceIds,
    },
  };
}

export interface Dec15PreviewCase {
  id: string;
  title: string;
  subtitle: string;
  input: DenverVailBusCheckInput;
  result: DenverVailBusCheckResult;
}

export function buildDec15BenchmarkPreviewCases(): Dec15PreviewCase[] {
  const cases: Array<{
    id: string;
    title: string;
    subtitle: string;
    input: DenverVailBusCheckInput;
  }> = [
    {
      id: "dec15-1510-fits",
      title: "3:10 p.m. landing fits",
      subtitle: "Dec. 15 · Skis + checked suitcase · 41 min at Union Station",
      input: {
        arrivalDate: "2026-12-15",
        arrivalTime: "15:10",
        luggage: "skis_and_checked",
        baggageEstimateMinutes: 45,
      },
    },
    {
      id: "dec15-1540-11min-fails",
      title: "11 minutes at Union Station fails",
      subtitle:
        "Dec. 15 · 3:40 p.m. landing · Skis + checked suitcase · 5:04 p.m. A Line arrival",
      input: {
        arrivalDate: "2026-12-15",
        arrivalTime: "15:40",
        luggage: "skis_and_checked",
        baggageEstimateMinutes: 45,
      },
    },
    {
      id: "dec15-1605-misses",
      title: "4:05 p.m. landing misses",
      subtitle:
        "Dec. 15 · Skis + checked suitcase · Arrives 19 min after 5:15 p.m. bus",
      input: {
        arrivalDate: "2026-12-15",
        arrivalTime: "16:05",
        luggage: "skis_and_checked",
        baggageEstimateMinutes: 45,
      },
    },
  ];

  return cases.map((c) => ({
    ...c,
    result: evaluateDenverVailBusCheck(c.input),
  }));
}
