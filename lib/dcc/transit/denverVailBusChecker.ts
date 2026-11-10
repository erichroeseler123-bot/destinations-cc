import {
  BUSTANG_WEST_TRIPS_BY_SERVICE,
  DENVER_VAIL_GTFS_METADATA,
  type GtfsCorridorTrip,
  PEGASUS_TRIPS_BY_SERVICE,
  RTD_A_LINE_TRIPS_BY_SERVICE,
} from "./denverVailGtfsScheduleData";

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
  standardBagCount: number;
  skiBagCount: number;
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
    standardBagCount: 1,
    skiBagCount: 1,
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
    standardBagCount: 1,
    skiBagCount: 0,
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
    standardBagCount: 0,
    skiBagCount: 1,
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
    standardBagCount: 0,
    skiBagCount: 0,
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
  gosnoBaseUrl?: string;
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
  missReason:
    | "union_transfer_under_15_min"
    | "arrives_after_last_bus"
    | "after_last_a_line"
    | null;
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

export function resolveDateServiceSchedules(arrivalDate: string): {
  rtdServiceId: string;
  bustangWestServiceId: string;
  pegasusServiceIds: string[];
  aLineTrips: FormattedTripLeg[];
  bustangWestTrips: FormattedTripLeg[];
  pegasusTrips: FormattedTripLeg[];
} | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(arrivalDate)) {
    return null;
  }
  if (
    arrivalDate < DENVER_VAIL_GTFS_METADATA.validStartDate ||
    arrivalDate > DENVER_VAIL_GTFS_METADATA.validEndDate
  ) {
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

  const isHolidaySunday = (
    DENVER_VAIL_GTFS_METADATA.holidaySundayOverrides as readonly string[]
  ).includes(arrivalDate);

  let rtdServiceId: string;
  let bustangWestServiceId: string;
  let pegasusServiceIds: string[];

  if (isHolidaySunday) {
    rtdServiceId = "SU";
    bustangWestServiceId = "SU";
    pegasusServiceIds = ["SU"];
  } else {
    const dow = dt.getUTCDay(); // 0 = Sun ... 6 = Sat
    if (dow === 0) {
      rtdServiceId = "SU";
      bustangWestServiceId = "SU";
      pegasusServiceIds = ["SU"];
    } else if (dow === 6) {
      rtdServiceId = "SA";
      bustangWestServiceId = "SA";
      pegasusServiceIds = ["SA"];
    } else if (dow === 5) {
      rtdServiceId = "FR";
      bustangWestServiceId = "WK";
      pegasusServiceIds = ["WK", "P_Fri"];
    } else {
      rtdServiceId = "MT";
      bustangWestServiceId = "WK";
      pegasusServiceIds = ["WK"];
    }
  }

  const rawALine = RTD_A_LINE_TRIPS_BY_SERVICE[rtdServiceId] ?? [];
  const rawWest = BUSTANG_WEST_TRIPS_BY_SERVICE[bustangWestServiceId] ?? [];
  const rawPegasus = pegasusServiceIds.flatMap(
    (svc) => PEGASUS_TRIPS_BY_SERVICE[svc] ?? [],
  );

  if (rawALine.length === 0 || rawWest.length === 0) {
    return null;
  }

  const stops = DENVER_VAIL_GTFS_METADATA.stops;
  const aLineTrips = rawALine
    .map((t) =>
      toFormattedLeg(
        t,
        stops.denAirportStation.stopId,
        stops.denAirportStation.stopName,
        stops.unionStationRail.stopId,
        stops.unionStationRail.stopName,
      ),
    )
    .sort((a, b) => a.depMin - b.depMin);

  const bustangWestTrips = rawWest
    .map((t) =>
      toFormattedLeg(
        t,
        stops.unionStationBustangGate.stopId,
        stops.unionStationBustangGate.stopName,
        stops.vailTransportationCenter.stopId,
        stops.vailTransportationCenter.stopName,
      ),
    )
    .sort((a, b) => a.depMin - b.depMin);

  const pegasusTrips = rawPegasus
    .map((t) =>
      toFormattedLeg(
        t,
        stops.unionStationPegasusStop.stopId,
        stops.unionStationPegasusStop.stopName,
        stops.vailTransportationCenter.stopId,
        stops.vailTransportationCenter.stopName,
      ),
    )
    .sort((a, b) => a.depMin - b.depMin);

  return {
    rtdServiceId,
    bustangWestServiceId,
    pegasusServiceIds,
    aLineTrips,
    bustangWestTrips,
    pegasusTrips,
  };
}

export function buildGoSnoAvailabilityUrl(params: {
  arrivalDate: string;
  luggage: LuggageOptionSpec;
  baseUrl?: string;
}): string {
  const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(params.arrivalDate)
    ? params.arrivalDate
    : "2026-12-15";
  const base = params.baseUrl || "https://gosno.co/vail";
  try {
    const url = new URL(base);
    url.searchParams.set("origin", "DEN");
    url.searchParams.set("destination", "Vail");
    url.searchParams.set("date", safeDate);
    if (!url.searchParams.has("passengers")) {
      url.searchParams.set("passengers", "2");
      url.searchParams.set("passengerCount", "2");
    }
    url.searchParams.set(
      "standardBags",
      String(params.luggage.standardBagCount),
    );
    url.searchParams.set("skiBags", String(params.luggage.skiBagCount));
    return url.toString();
  } catch {
    return `https://gosno.co/vail?origin=DEN&destination=Vail&date=${encodeURIComponent(safeDate)}&standardBags=${params.luggage.standardBagCount}&skiBags=${params.luggage.skiBagCount}`;
  }
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
    luggage: luggageSpec,
    baseUrl: input.gosnoBaseUrl,
  });

  const resolvedSchedule = resolveDateServiceSchedules(input.arrivalDate);

  if (!resolvedSchedule || arrivalMin === null) {
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
      verdictSummary: `Published RTD A Line and CDOT Bustang GTFS schedules in this build cover ${DENVER_VAIL_GTFS_METADATA.validStartDate} through ${DENVER_VAIL_GTFS_METADATA.validEndDate}. Verify the schedule for ${input.arrivalDate || "your date"} before relying on a bus connection.`,
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
        `Current verified GTFS runboard window: ${DENVER_VAIL_GTFS_METADATA.validStartDate} to ${DENVER_VAIL_GTFS_METADATA.validEndDate} (RTD ${DENVER_VAIL_GTFS_METADATA.rtdALineFeedVersion}; Bustang ${DENVER_VAIL_GTFS_METADATA.bustangFeedVersion}).`,
        `Minimum Union Station transfer rule: ${MIN_UNION_STATION_TRANSFER_MINUTES} minutes (${UNION_STATION_TRACK1_TO_B19_WALK_MINUTES} min walk from Track 1 #34667 to Underground Bus Concourse Gate B19 #34316 + ${BUSTANG_COACH_BAY_LOADING_CUTOFF_MINUTES} min under-coach bay loading cutoff).`,
      ],
      gosnoAvailabilityUrl,
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
    resolvedSchedule.aLineTrips.find((t) => t.depMin >= denPlatformReadyMin) ??
    null;
  const waitAtDenMinutes = aLineTrain
    ? aLineTrain.depMin - denPlatformReadyMin
    : null;

  const lastBustangWestTrip =
    resolvedSchedule.bustangWestTrips[
      resolvedSchedule.bustangWestTrips.length - 1
    ] ?? null;

  // Apply the 15-minute minimum consistently for Bustang West Line at Gate B19
  const matchingWestTrip = aLineTrain
    ? (resolvedSchedule.bustangWestTrips.find(
        (b) => b.depMin - aLineTrain.arrMin >= MIN_UNION_STATION_TRANSFER_MINUTES,
      ) ?? null)
    : null;

  // Check if there is a West Line bus that departs after A Line arrival, but with < 15 minutes
  const subMinimumWestTrip =
    aLineTrain && !matchingWestTrip
      ? (resolvedSchedule.bustangWestTrips.find(
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
  if (aLineTrain && luggageSpec.pegasusAllowed) {
    const matchingPegasus = resolvedSchedule.pegasusTrips.find(
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
  let missReason: DenverVailBusCheckResult["missReason"] = null;
  let scheduledVailArrival12h: string | null = null;
  let scheduledVailArrival24h: string | null = null;
  let scheduledVailArrivalRouteLabel: string | null = null;

  if (matchingWestTrip && aLineTrain) {
    verdict = "fits";
    verdictBadge = "Fits (scheduled)";
    scheduledVailArrival12h = matchingWestTrip.arr12h;
    scheduledVailArrival24h = matchingWestTrip.arr24h;
    scheduledVailArrivalRouteLabel = `CDOT Bustang West Line (trip ${matchingWestTrip.tripId})`;
    verdictSummary = `${arrivalTime12h} landing reaches DEN Station (#34476) by ${denPlatformReadyTime12h}, boards the ${aLineTrain.dep12h} A Line to Union Station Track 1 (${aLineTrain.arr12h}), leaves ${rawTransferToReferenceMin} minutes to transfer to Gate B19 (≥ ${MIN_UNION_STATION_TRANSFER_MINUTES}-minute minimum), and arrives in Vail at ${matchingWestTrip.arr12h}.`;
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
    } else if (aLineTrain && lastBustangWestTrip && rawTransferToReferenceMin !== null) {
      missReason = "arrives_after_last_bus";
      const minutesAfter = Math.abs(rawTransferToReferenceMin);
      verdictBadge = "Misses last bus (scheduled)";
      verdictSummary = `${arrivalTime12h} landing reaches DEN Station (#34476) at ${denPlatformReadyTime12h}. The earliest reachable A Line (${aLineTrain.dep12h}) arrives at Union Station Track 1 at ${aLineTrain.arr12h}—${minutesAfter} minutes after the last ${lastBustangWestTrip.dep12h} Bustang West Line has departed Gate B19.`;
    } else {
      missReason = "after_last_a_line";
      verdictBadge = "Misses last bus (scheduled)";
      verdictSummary = `${arrivalTime12h} landing misses the last connecting A Line and Bustang West Line departure to Vail for ${input.arrivalDate}.`;
    }
  }

  const assumptions: string[] = [
    `DEN touchdown to A Line platform (#34476): ${rawEstimate} min ${isCustomBaggageEstimate ? "(custom estimate)" : `(default for ${luggageSpec.shortLabel}: ${luggageSpec.baggageBreakdownLabel})`} → ready at ${denPlatformReadyTime12h} (${denPlatformReadyTime24h}).`,
    aLineTrain
      ? `RTD A Line (service ${resolvedSchedule.rtdServiceId}, trip ${aLineTrain.tripId}): departs Denver Airport Station (#34476) at ${aLineTrain.dep12h} (${aLineTrain.dep24h}) → arrives Union Station Track 1 (#34667) at ${aLineTrain.arr12h} (${aLineTrain.arr24h}, 37 min scheduled).`
      : `RTD A Line (service ${resolvedSchedule.rtdServiceId}): no remaining departure before the final Vail bus connection.`,
    `Union Station transfer rule: ${MIN_UNION_STATION_TRANSFER_MINUTES}-minute minimum applied consistently (${UNION_STATION_TRACK1_TO_B19_WALK_MINUTES} min walk from Track 1 #34667 to Underground Bus Concourse Gate B19 #34316 + ${BUSTANG_COACH_BAY_LOADING_CUTOFF_MINUTES} min under-coach ski/luggage bay loading cutoff).`,
    `Last Bustang West Line motorcoach (service ${resolvedSchedule.bustangWestServiceId}, trip ${lastBustangWestTrip?.tripId ?? "N/A"}): departs Union Station Gate B19 (#34316) at ${lastBustangWestTrip?.dep12h ?? "5:15 p.m."} (${lastBustangWestTrip?.dep24h ?? "17:15"}) → arrives Vail Transportation Center (#35174) at ${lastBustangWestTrip?.arr12h ?? "7:35 p.m."} (${lastBustangWestTrip?.arr24h ?? "19:35"}).`,
    luggageSpec.pegasusAllowed
      ? pegasusConnection
        ? `CDOT Pegasus van: shown because ${luggageSpec.shortLabel} meets Pegasus's ≤ 16"×16"×12" personal-item rule and the ${pegasusConnection.trip.dep12h} departure from Wewatta St & 17th St (#34385) has a ${pegasusConnection.transferMinutes}-minute transfer (≥ ${MIN_UNION_STATION_TRANSFER_MINUTES} min).`
        : `CDOT Pegasus van: luggage rules fit (${luggageSpec.shortLabel}), but no Pegasus departure has ≥ ${MIN_UNION_STATION_TRANSFER_MINUTES} minutes after A Line arrival.`
      : `CDOT Pegasus van (7:30 p.m. from Wewatta St & 17th St #34385): hidden/excluded because ${luggageSpec.shortLabel} includes a full-size checked suitcase exceeding Pegasus's 16"×16"×12" under-seat limit.`,
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
    activeServiceIds: {
      rtdALine: resolvedSchedule.rtdServiceId,
      bustangWest: resolvedSchedule.bustangWestServiceId,
      pegasus: resolvedSchedule.pegasusServiceIds,
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

export function buildDec15BenchmarkPreviewCases(
  gosnoBaseUrl?: string,
): Dec15PreviewCase[] {
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
        gosnoBaseUrl,
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
        gosnoBaseUrl,
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
        gosnoBaseUrl,
      },
    },
  ];

  return cases.map((c) => ({
    ...c,
    result: evaluateDenverVailBusCheck(c.input),
  }));
}
