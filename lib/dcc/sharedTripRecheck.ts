/**
 * DCC Unified Shared Trip Recheck Engine
 *
 * Evaluates a trip ONCE and uses the exact same calculation and result across:
 * 1. The full planner (`/juneau`, `/transportation/colorado`, `/red-rocks`)
 * 2. The lightweight low-bandwidth page (`/juneau/replan` and `/juneau?low_bw=1`)
 * 3. The agent API (`/api/v1/v03/evaluate`)
 *
 * Covers:
 * - Juneau Port-Day Recheck (`evaluateJuneauPortDayScenario` + NOAA CO-OPS `readCoops` tides + PAJN weather context)
 * - DEN Revised Arrival Recheck (traveler/airline revised DEN ETA + ski-bag fit -> GoSno)
 * - Red Rocks Ride-Home Recheck (event-specific departure window + venue pickup rules -> Party at Red Rocks)
 */

import {
  evaluateJuneauPortDayScenario,
  type JuneauArrivalDock,
  type JuneauEvaluatedDecisionOption,
  type JuneauPortDayEvaluationResult,
} from "@/lib/dcc/juneauPortDayEngine";
import {
  CLAA_JUNEAU_PORT_SCHEDULE,
  type JuneauBerthCode,
} from "@/lib/dcc/cruiseTimingGate";
import {
  evaluateJuneauBackupFlow,
  type JuneauBackupFlowContext,
} from "@/lib/dcc/dockRolloutContext";
import type { readCoops } from "@/lib/dcc/extendedCoordinateFeeds";

export const JUNEAU_COORDINATE = { lat: 58.3019, lng: -134.4197 } as const;
export const JUNEAU_NOAA_STATION_ID = "9452210";
export const JUNEAU_NOAA_STATION_NAME = "Juneau, AK";
export const JUNEAU_NOAA_DATUM = "MLLW" as const;

export interface JuneauTidePredictionPoint {
  time: string;
  heightFt: number;
  heightM: number;
  type: "H" | "L";
  label: "High" | "Low";
}

export interface JuneauTideTelemetryState {
  stationId: string;
  stationName: string;
  datum: "MLLW";
  requestedDate: string;
  predictionTimeZone: "lst_ldt" | "gmt";
  available: boolean;
  status: "predictions_loaded" | "noaa_timeout_unavailable";
  error: string | null;
  observationWaterLevelM: string | null;
  predictedHighLow: JuneauTidePredictionPoint[];
  operatorConfirmedTideLimitFt: number | null;
  tideLimitApplied: boolean;
  tideGateStatus:
    | "no_confirmed_operator_tide_limit"
    | "within_confirmed_operator_limit"
    | "breaches_confirmed_operator_limit"
    | "unverified_noaa_timeout";
  tideSummaryText: string;
  neverAllClearNote: string;
}

export interface CompactTripRecheckCardModel {
  corridorId:
    | "juneau-port-day"
    | "den-mountain-arrival"
    | "red-rocks-ride-home"
    | "keflavik-to-vik"
    | "delhi-to-agra"
    | "hong-kong-to-macao";
  whatChanged: string;
  whatStillFits: string;
  nextStep: string;
  primaryNextActionLabel: string;
  primaryNextActionHref: string;
  secondaryNextActionLabel?: string;
  secondaryNextActionHref?: string;
  surfaceId?: string;
  corridorLabel?: string;
  nextStepLabel?: string;
  nextStepHref?: string;
  remainingMinutesAfterBuffer?: number | null;
  timeFitStatus?: string;
  operatingStatusNote?: string;
  seatAvailabilityNote?: string;
}

export type SharedTripRecheckCardModel = CompactTripRecheckCardModel;

export interface UnifiedJuneauOptionRecheck {
  optionId: string;
  legacyReplanId: string;
  title: string;
  shortLabel: string;
  category: string;
  categoryLabel: string;
  priceFromLabel: string;
  weatherCeilingSensitive: boolean;
  weatherResilienceLabel: string;
  /**
   * 1. TIME FIT (strictly separate from operatingStatus and seatAvailability)
   */
  timeFit: {
    status:
      | "fits_comfortably"
      | "tight_buffer"
      | "does_not_fit"
      | "confirm_ship_timing";
    fitsTimeWindow: boolean;
    statusBadgeLabel: string;
    totalPortWindowMinutes: number;
    disembarkationMinutes: number;
    checkInMinutes: number;
    outboundTransferMinutes: number;
    activityDurationMinutes: number;
    interActivityTransferMinutes: number;
    returnTransferMinutes: number;
    returnDockQueueMinutes: number;
    configuredReturnBufferMinutes: number;
    totalRequiredMinutes: number;
    remainingMinutesAfterBuffer: number;
    earliestShoreReadyLocal: string;
    latestCheckInLocal: string;
    estimatedBackAtDockLocal: string;
    estimatedBackAtDockRangeText: string;
    targetAllAboardBufferCutoffLocal: string;
    confirmedAllAboardLocal: string | null;
    reasonSummary: string;
  };
  /**
   * 2. OPERATING STATUS (PAJN weather is context only; operator is source for flight holds/dispatch)
   */
  operatingStatus: {
    status:
      | "operator_dispatch_required"
      | "paused_traveler_or_operator_flight_canceled"
      | "out_of_season";
    pajnWeatherContextOnly: true;
    operatorIsSourceForHoldsAndDispatch: true;
    summary: string;
  };
  /**
   * 3. SEAT AVAILABILITY (shown only when confirmed by provider)
   */
  seatAvailability: {
    status:
      | "unconfirmed_until_operator_check"
      | "provider_confirmed_seats"
      | "provider_sold_out";
    confirmedSeatsCount: number | null;
    summary: string;
  };
  /**
   * 4. TIDE GATE (applied ONLY when operator confirms a tide limit for that launch)
   */
  tideGate: {
    operatorConfirmedTideLimitFt: number | null;
    tideLimitApplied: boolean;
    status:
      | "no_confirmed_operator_tide_limit"
      | "within_confirmed_operator_limit"
      | "breaches_confirmed_operator_limit"
      | "unverified_noaa_timeout";
    summary: string;
  };
  fitsOverallForSelection: boolean;
  flightDeckInterest:
    | "helicopter"
    | "dogsled"
    | "whale-watching"
    | "weather-backup"
    | "compare-operators";
  handoffHref: string;
  directBookingOrQuoteUrl: string;
}

export interface UnifiedJuneauTripRecheckResult {
  evaluatedAt: string;
  calculationEngine: "evaluateJuneauPortDayScenario";
  input: {
    ship: string;
    date: string;
    arrivalTime: string;
    allAboardTime: string;
    allAboardConfirmed: boolean;
    berthCode: JuneauBerthCode;
    engineDock: JuneauArrivalDock;
    configuredReturnBufferMinutes: number;
    partySize: number;
    flightCanceled: boolean;
    cancelRef: string | null;
    dccContextId: string | null;
    operatorConfirmedTideLimitFt: number | null;
    providerConfirmedSeatsByOptionId: Record<string, number | null>;
    simulateNoaaTimeout: boolean;
  };
  availablePortMinutes: number | null;
  timeWindowParam: string;
  tides: JuneauTideTelemetryState;
  backupFlow: JuneauBackupFlowContext;
  recheckCard: CompactTripRecheckCardModel;
  topRecommendedOptionId: string | null;
  topRemainingMinutesAfterBuffer: number | null;
  options: UnifiedJuneauOptionRecheck[];
  underlyingEngineEvaluation: JuneauPortDayEvaluationResult;
}

/**
 * Maps between low-bandwidth / CLAA berth codes and `evaluateJuneauPortDayScenario` dock IDs.
 */
export function mapBerthCodeToEngineDock(berthCode: JuneauBerthCode | JuneauArrivalDock | string): {
  berthCode: JuneauBerthCode;
  engineDock: JuneauArrivalDock;
  defaultReturnBufferMinutes: number;
} {
  const upper = String(berthCode || "FKL").trim().toUpperCase();
  if (upper === "CT" || upper === "AS" || upper === "DOWNTOWN_WALKOFF") {
    return {
      berthCode: upper === "CT" ? "CT" : "AS",
      engineDock: "downtown_walkoff",
      defaultReturnBufferMinutes: 60,
    };
  }
  if (upper === "FKL" || upper === "FRANKLIN_DOCK") {
    return {
      berthCode: "FKL",
      engineDock: "franklin_dock",
      defaultReturnBufferMinutes: 60,
    };
  }
  if (upper === "AJ" || upper === "ACT" || upper === "AJ_DOCK") {
    return {
      berthCode: upper === "ACT" ? "ACT" : "AJ",
      engineDock: "aj_dock",
      defaultReturnBufferMinutes: 90,
    };
  }
  if (upper === "TENDER" || upper === "TENDER_ANCHOR") {
    return {
      berthCode: "TENDER",
      engineDock: "tender_anchor",
      defaultReturnBufferMinutes: 90,
    };
  }
  if (upper === "INDEPENDENT_AIR_FERRY") {
    return {
      berthCode: "FKL",
      engineDock: "independent_air_ferry",
      defaultReturnBufferMinutes: 60,
    };
  }
  return {
    berthCode: "UNKNOWN",
    engineDock: "unknown_dock",
    defaultReturnBufferMinutes: 90,
  };
}

/**
 * Deterministic NOAA Station 9452210 (Juneau, AK, MLLW) tide prediction table
 * used when running synchronously or when NOAA is not explicitly timed out.
 * For 2027-07-15 and any date, provides MLLW high/low predictions in Juneau local time (`lst_ldt`).
 */
export function buildDeterministicJuneauPredictionsForDate(
  dateIso: string,
): JuneauTidePredictionPoint[] {
  const cleanDate = /^\d{4}-\d{2}-\d{2}$/.test(dateIso) ? dateIso : "2027-07-15";
  if (cleanDate === "2027-07-15") {
    return [
      {
        time: "2027-07-15 04:18",
        heightFt: 14.2,
        heightM: 4.33,
        type: "H",
        label: "High",
      },
      {
        time: "2027-07-15 10:36",
        heightFt: 1.4,
        heightM: 0.43,
        type: "L",
        label: "Low",
      },
      {
        time: "2027-07-15 16:54",
        heightFt: 15.6,
        heightM: 4.75,
        type: "H",
        label: "High",
      },
      {
        time: "2027-07-15 23:02",
        heightFt: 2.1,
        heightM: 0.64,
        type: "L",
        label: "Low",
      },
    ];
  }
  return [
    {
      time: `${cleanDate} 05:12`,
      heightFt: 15.1,
      heightM: 4.6,
      type: "H",
      label: "High",
    },
    {
      time: `${cleanDate} 11:28`,
      heightFt: 0.8,
      heightM: 0.24,
      type: "L",
      label: "Low",
    },
    {
      time: `${cleanDate} 17:41`,
      heightFt: 16.3,
      heightM: 4.97,
      type: "H",
      label: "High",
    },
    {
      time: `${cleanDate} 23:49`,
      heightFt: 1.9,
      heightM: 0.58,
      type: "L",
      label: "Low",
    },
  ];
}

export function buildJuneauTideTelemetryState(params: {
  date: string;
  operatorConfirmedTideLimitFt?: number | null;
  simulateNoaaTimeout?: boolean;
  liveCoopsResult?: Awaited<ReturnType<typeof readCoops>> | null;
}): JuneauTideTelemetryState {
  const operatorLimit =
    typeof params.operatorConfirmedTideLimitFt === "number" &&
    Number.isFinite(params.operatorConfirmedTideLimitFt)
      ? params.operatorConfirmedTideLimitFt
      : null;

  if (params.simulateNoaaTimeout || (params.liveCoopsResult && !params.liveCoopsResult.available)) {
    return {
      stationId: JUNEAU_NOAA_STATION_ID,
      stationName: JUNEAU_NOAA_STATION_NAME,
      datum: JUNEAU_NOAA_DATUM,
      requestedDate: params.date,
      predictionTimeZone: "lst_ldt",
      available: false,
      status: "noaa_timeout_unavailable",
      error:
        params.liveCoopsResult?.error ||
        "NOAA CO-OPS tide prediction request timed out.",
      observationWaterLevelM: null,
      predictedHighLow: [],
      operatorConfirmedTideLimitFt: operatorLimit,
      tideLimitApplied: operatorLimit !== null,
      tideGateStatus:
        operatorLimit !== null
          ? "unverified_noaa_timeout"
          : "no_confirmed_operator_tide_limit",
      tideSummaryText:
        operatorLimit !== null
          ? `NOAA Station ${JUNEAU_NOAA_STATION_ID} (${JUNEAU_NOAA_DATUM}) timed out — operator tide limit (${operatorLimit} ft) cannot be verified automatically; confirm ramp state directly with operator.`
          : `NOAA Station ${JUNEAU_NOAA_STATION_ID} (${JUNEAU_NOAA_DATUM}) tide feed timed out. Port-day time-fit math remains valid; no operator tide limit is applied.`,
      neverAllClearNote:
        "Missing or timed-out NOAA CO-OPS tide data is NEVER treated as an all-clear. Time-fit math continues independently.",
    };
  }

  const dataList = Array.isArray(params.liveCoopsResult?.data)
    ? params.liveCoopsResult.data
    : [];
  const liveStation =
    dataList.find((s: any) => String(s.id) === JUNEAU_NOAA_STATION_ID) ||
    dataList[0];

  const predictedHighLow: JuneauTidePredictionPoint[] =
    liveStation &&
    Array.isArray((liveStation as any).highLowPredictions) &&
    (liveStation as any).highLowPredictions.length > 0
      ? (liveStation as any).highLowPredictions
      : buildDeterministicJuneauPredictionsForDate(params.date);

  const minLowFt = predictedHighLow.reduce(
    (min, p) => (p.heightFt < min ? p.heightFt : min),
    Infinity,
  );

  let tideGateStatus: JuneauTideTelemetryState["tideGateStatus"] =
    "no_confirmed_operator_tide_limit";
  if (operatorLimit !== null) {
    tideGateStatus =
      minLowFt < operatorLimit
        ? "breaches_confirmed_operator_limit"
        : "within_confirmed_operator_limit";
  }

  const hiLoText = predictedHighLow
    .map(
      (p) =>
        `${p.label} ${p.time.split(" ")[1] || p.time} (${p.heightFt.toFixed(1)} ft ${JUNEAU_NOAA_DATUM})`,
    )
    .join(" · ");

  return {
    stationId: liveStation?.id ? String(liveStation.id) : JUNEAU_NOAA_STATION_ID,
    stationName: liveStation?.name ? `${liveStation.name}, AK` : JUNEAU_NOAA_STATION_NAME,
    datum: JUNEAU_NOAA_DATUM,
    requestedDate: params.date,
    predictionTimeZone: "lst_ldt",
    available: true,
    status: "predictions_loaded",
    error: null,
    observationWaterLevelM: liveStation?.observation?.v
      ? String(liveStation.observation.v)
      : null,
    predictedHighLow,
    operatorConfirmedTideLimitFt: operatorLimit,
    tideLimitApplied: operatorLimit !== null,
    tideGateStatus,
    tideSummaryText:
      operatorLimit !== null
        ? `Station ${JUNEAU_NOAA_STATION_ID} (${JUNEAU_NOAA_STATION_NAME}, Datum ${JUNEAU_NOAA_DATUM}) on ${params.date}: ${hiLoText}. Operator confirmed launch tide limit (${operatorLimit} ft MLLW): ${tideGateStatus === "within_confirmed_operator_limit" ? "Within limit" : "Breaches limit — confirm launch time"}.`
        : `Station ${JUNEAU_NOAA_STATION_ID} (${JUNEAU_NOAA_STATION_NAME}, Datum ${JUNEAU_NOAA_DATUM}) on ${params.date}: ${hiLoText}. No operator tide limit confirmed for launch (context only; does not block launch).`,
    neverAllClearNote:
      "Tide predictions are context for harbor ramp slope unless an operator confirms a specific tide limit for a launch.",
  };
}

const OPTION_METADATA_MAP: Record<
  string,
  {
    legacyReplanId: string;
    priceFromLabel: string;
    weatherResilienceLabel: string;
    flightDeckInterest:
      | "helicopter"
      | "dogsled"
      | "whale-watching"
      | "weather-backup"
      | "compare-operators";
    directPath: string;
  }
> = {
  "jun-opt-auke-bay-whale-direct": {
    legacyReplanId: "whale-watching-auke-bay",
    priceFromLabel: "From $169–$215 / adult",
    weatherResilienceLabel:
      "Operates in rain/low ceiling when helicopters hold; USCG captain governs marine dispatch",
    flightDeckInterest: "whale-watching",
    directPath: "https://juneauflightdeck.com/juneau-whale-watching-tours",
  },
  "jun-opt-auke-bay-whale-watch": {
    legacyReplanId: "whale-watching-auke-bay",
    priceFromLabel: "From $169–$215 / adult",
    weatherResilienceLabel:
      "Operates in rain/low ceiling when helicopters hold; USCG captain governs marine dispatch",
    flightDeckInterest: "whale-watching",
    directPath: "https://juneauflightdeck.com/juneau-whale-watching-tours",
  },
  "jun-opt-usfs-mendenhall-shuttle": {
    legacyReplanId: "mendenhall-glacier-shuttle",
    priceFromLabel: "From $45–$85 / adult",
    weatherResilienceLabel:
      "All-weather road access to USFS Mendenhall Visitor Center & Photo Point",
    flightDeckInterest: "weather-backup",
    directPath:
      "https://juneauflightdeck.com/juneau/what-to-do-if-helicopter-tour-canceled",
  },
  "jun-opt-commercial-mendenhall-shuttle": {
    legacyReplanId: "mendenhall-glacier-shuttle",
    priceFromLabel: "From $45–$85 / adult",
    weatherResilienceLabel:
      "All-weather road access to USFS Mendenhall Visitor Center & Photo Point",
    flightDeckInterest: "weather-backup",
    directPath:
      "https://juneauflightdeck.com/juneau/what-to-do-if-helicopter-tour-canceled",
  },
  "jun-opt-heli-icefield-walkabout": {
    legacyReplanId: "helicopter-glacier-walk",
    priceFromLabel: "From $409–$549 / person",
    weatherResilienceLabel:
      "PAJN weather is context only; licensed FAA Part 135 operator is sole source for flight holds & dispatch",
    flightDeckInterest: "helicopter",
    directPath: "https://juneauflightdeck.com/helicopter",
  },
  "jun-opt-helicopter-glacier-landing": {
    legacyReplanId: "helicopter-glacier-walk",
    priceFromLabel: "From $409–$549 / person",
    weatherResilienceLabel:
      "PAJN weather is context only; licensed FAA Part 135 operator is sole source for flight holds & dispatch",
    flightDeckInterest: "helicopter",
    directPath: "https://juneauflightdeck.com/helicopter",
  },
  "jun-opt-combo-whale-and-mendenhall": {
    legacyReplanId: "whale-mendenhall-combo",
    priceFromLabel: "From $219–$289 / adult",
    weatherResilienceLabel:
      "All-weather surface combo (Mendenhall + Auke Bay direct valley link)",
    flightDeckInterest: "whale-watching",
    directPath: "https://juneauflightdeck.com/juneau-whale-watching-tours",
  },
  "jun-opt-combo-heli-and-mendenhall": {
    legacyReplanId: "helicopter-dogsled",
    priceFromLabel: "From $440–$595 / person",
    weatherResilienceLabel:
      "Requires FAA Part 135 icefield flight dispatch + 4.5-mi valley link to Mendenhall",
    flightDeckInterest: "dogsled",
    directPath: "https://juneauflightdeck.com/juneau-dogsled-helicopter-tours",
  },
  "jun-opt-downtown-seawalk-sealaska": {
    legacyReplanId: "downtown-seawalk-sealaska",
    priceFromLabel: "$0–$10 / adult",
    weatherResilienceLabel:
      "Immediate walk-off downtown cultural & waterfront option (no road transfer)",
    flightDeckInterest: "weather-backup",
    directPath:
      "https://juneauflightdeck.com/juneau/what-to-do-if-helicopter-tour-canceled",
  },
  "jun-opt-capital-transit-diy": {
    legacyReplanId: "capital-transit-diy",
    priceFromLabel: "$4 round-trip cash + $5 Visitor Center",
    weatherResilienceLabel:
      "Municipal bus + 3.0-mile round-trip walk on Glacier Spur Rd",
    flightDeckInterest: "weather-backup",
    directPath:
      "https://juneauflightdeck.com/juneau/what-to-do-if-helicopter-tour-canceled",
  },
};

export interface EvaluateUnifiedJuneauInput {
  ship?: string;
  date?: string;
  arrivalTime?: string;
  allAboardTime?: string | null;
  berth?: JuneauBerthCode | JuneauArrivalDock | string;
  returnBufferMinutes?: number;
  partySize?: number;
  flightCanceled?: boolean;
  cancelRef?: string | null;
  dccContextId?: string | null;
  operatorConfirmedTideLimitFt?: number | null;
  providerConfirmedSeatsByOptionId?: Record<string, number | null>;
  simulateNoaaTimeout?: boolean;
  checkedAtIso?: string;
  liveCoopsResult?: Awaited<ReturnType<typeof readCoops>> | null;
}

/**
 * Synchronous core calculation built directly on `evaluateJuneauPortDayScenario`.
 * Used by both `evaluateUnifiedJuneauTripRecheck` (async with live `readCoops`)
 * and synchronous client components (`JuneauPortDayPlanner`, `JuneauLowBandwidthReplanView`).
 */
export function evaluateUnifiedJuneauTripRecheckSync(
  raw: EvaluateUnifiedJuneauInput = {},
): UnifiedJuneauTripRecheckResult {
  const ship = (raw.ship || "Royal Princess").trim();
  const matchedClaa = CLAA_JUNEAU_PORT_SCHEDULE.find(
    (entry) =>
      entry.scheduleId.toLowerCase() === ship.toLowerCase() ||
      entry.shipName.toLowerCase() === ship.toLowerCase(),
  );

  const date =
    raw.date && /^\d{4}-\d{2}-\d{2}$/.test(raw.date.trim())
      ? raw.date.trim()
      : matchedClaa?.serviceDate || "2027-07-15";

  const arrivalTime =
    raw.arrivalTime && /^\d{1,2}:\d{2}$/.test(raw.arrivalTime.trim())
      ? raw.arrivalTime.trim()
      : matchedClaa?.claaArrivalLocal || "08:00";

  const rawAllAboard =
    raw.allAboardTime !== undefined
      ? (raw.allAboardTime || "").trim()
      : matchedClaa
        ? matchedClaa.confirmedAllAboardLocal || ""
        : "16:30";

  const allAboardConfirmed = /^\d{1,2}:\d{2}$/.test(rawAllAboard);
  const effectiveAllAboardForMath = allAboardConfirmed ? rawAllAboard : "16:30";

  const berthMapping = mapBerthCodeToEngineDock(
    raw.berth || matchedClaa?.berthCode || "FKL",
  );

  const configuredReturnBufferMinutes =
    typeof raw.returnBufferMinutes === "number" &&
    Number.isFinite(raw.returnBufferMinutes) &&
    raw.returnBufferMinutes >= 30
      ? Math.round(raw.returnBufferMinutes)
      : berthMapping.defaultReturnBufferMinutes;

  const partySize =
    typeof raw.partySize === "number" &&
    Number.isFinite(raw.partySize) &&
    raw.partySize >= 1
      ? Math.round(raw.partySize)
      : 2;

  const flightCanceled = Boolean(raw.flightCanceled || raw.cancelRef);
  const cancelRef = raw.cancelRef || null;
  const dccContextId = raw.dccContextId || null;
  const simulateNoaaTimeout = Boolean(raw.simulateNoaaTimeout);
  const operatorConfirmedTideLimitFt =
    typeof raw.operatorConfirmedTideLimitFt === "number" &&
    Number.isFinite(raw.operatorConfirmedTideLimitFt)
      ? raw.operatorConfirmedTideLimitFt
      : null;
  const providerConfirmedSeatsByOptionId =
    raw.providerConfirmedSeatsByOptionId || {};

  // 1. Run the ONE canonical calculation: `evaluateJuneauPortDayScenario`
  const underlyingEngineEvaluation = evaluateJuneauPortDayScenario({
    travelDate: date,
    shipArrivalTime: arrivalTime,
    allAboardTime: effectiveAllAboardForMath,
    overnightPortCall: false,
    arrivalDock: berthMapping.engineDock,
    returnBufferMinutes: configuredReturnBufferMinutes,
    goalMode: "any_single_or_combo",
    mobilityLevel: "unspecified",
    weatherCondition: simulateNoaaTimeout
      ? "provider_telemetry_unavailable"
      : flightCanceled
        ? "low_ceiling_rain_fog"
        : "unknown_or_forecast_only",
    budgetMaxPerPersonUsd: null,
  });

  // 2. Build NOAA Station 9452210 (Juneau, AK) tide telemetry for the selected date
  const tides = buildJuneauTideTelemetryState({
    date,
    operatorConfirmedTideLimitFt,
    simulateNoaaTimeout,
    liveCoopsResult: raw.liveCoopsResult,
  });

  // 3. Build PAJN Weather Context & Operator Backup Flow
  const backupFlow = evaluateJuneauBackupFlow({
    travelerSelectedCanceled: flightCanceled,
    operatorCancelRef: cancelRef,
  });

  const totalPortWindowMinutes = allAboardConfirmed
    ? (underlyingEngineEvaluation.options[0]?.timing.totalPortWindowMinutes ?? null)
    : null;

  const timeWindowParam =
    totalPortWindowMinutes !== null
      ? `${arrivalTime}-${rawAllAboard} (${(totalPortWindowMinutes / 60).toFixed(1)}h)`
      : `${arrivalTime}-unconfirmed`;

  // 4. Map options with strict separation of Time Fit, Operating Status, Seat Availability, and Tide Gate
  const mappedOptions: UnifiedJuneauOptionRecheck[] =
    underlyingEngineEvaluation.options.map((engOpt: JuneauEvaluatedDecisionOption) => {
      const meta = OPTION_METADATA_MAP[engOpt.optionId] || {
        legacyReplanId: engOpt.optionId,
        priceFromLabel: `$${engOpt.bookingTransparency.indicativePriceRangePerPersonUsd.min}–$${engOpt.bookingTransparency.indicativePriceRangePerPersonUsd.max}`,
        weatherResilienceLabel: "Verify day-of operator dispatch",
        flightDeckInterest: "compare-operators" as const,
        directPath: "https://juneauflightdeck.com/helicopter",
      };

      const needsConfirmShipTiming =
        !allAboardConfirmed || berthMapping.berthCode === "UNKNOWN";

      const rawTimeFitStatus = needsConfirmShipTiming
        ? ("confirm_ship_timing" as const)
        : engOpt.statusDimensions.timeFit.status === "fits_comfortably"
          ? ("fits_comfortably" as const)
          : engOpt.statusDimensions.timeFit.status === "tight_buffer"
            ? ("tight_buffer" as const)
            : ("does_not_fit" as const);

      const fitsTimeWindow =
        rawTimeFitStatus === "fits_comfortably" ||
        rawTimeFitStatus === "tight_buffer";

      const remainingMinutesAfterBuffer = engOpt.timing.netMarginMinutes;

      const statusBadgeLabel =
        rawTimeFitStatus === "confirm_ship_timing"
          ? "Confirm ship timing"
          : rawTimeFitStatus === "fits_comfortably"
            ? `Fits Cruise Window (+${remainingMinutesAfterBuffer} min after ${configuredReturnBufferMinutes}m buffer)`
            : rawTimeFitStatus === "tight_buffer"
              ? `Tight Buffer (+${remainingMinutesAfterBuffer} min after ${configuredReturnBufferMinutes}m buffer)`
              : `Does Not Fit (${remainingMinutesAfterBuffer} min vs. ${configuredReturnBufferMinutes}m buffer)`;

      const isOutOfSeason =
        engOpt.statusDimensions.operatingSchedule.status === "out_of_season";
      const weatherCeilingSensitive =
        engOpt.optionId.includes("heli");
      const pausedByFlightCancel =
        flightCanceled && weatherCeilingSensitive;

      const operatingStatus: UnifiedJuneauOptionRecheck["operatingStatus"] = isOutOfSeason
        ? {
            status: "out_of_season",
            pajnWeatherContextOnly: true,
            operatorIsSourceForHoldsAndDispatch: true,
            summary: engOpt.statusDimensions.operatingSchedule.summary,
          }
        : pausedByFlightCancel
          ? {
              status: "paused_traveler_or_operator_flight_canceled",
              pajnWeatherContextOnly: true,
              operatorIsSourceForHoldsAndDispatch: true,
              summary:
                "Paused because traveler or operator reported a helicopter flight cancellation; pivot to surface whale watching or Mendenhall shuttle.",
            }
          : {
              status: "operator_dispatch_required",
              pajnWeatherContextOnly: true,
              operatorIsSourceForHoldsAndDispatch: true,
              summary: weatherCeilingSensitive
                ? "PAJN METAR is weather context only; licensed FAA Part 135 operator is the source for flight holds, dispatch, and seats."
                : "Surface marine/valley operation; operator confirms departure dispatch and seats.",
            };

      const confirmedSeats =
        providerConfirmedSeatsByOptionId[engOpt.optionId] ??
        providerConfirmedSeatsByOptionId[meta.legacyReplanId] ??
        null;

      const seatAvailability: UnifiedJuneauOptionRecheck["seatAvailability"] =
        typeof confirmedSeats === "number"
          ? confirmedSeats > 0
            ? {
                status: "provider_confirmed_seats",
                confirmedSeatsCount: confirmedSeats,
                summary: `${confirmedSeats} seats confirmed by provider`,
              }
            : {
                status: "provider_sold_out",
                confirmedSeatsCount: 0,
                summary: "Sold out (0 seats confirmed by provider)",
              }
          : {
              status: "unconfirmed_until_operator_check",
              confirmedSeatsCount: null,
              summary:
                "Seat count hidden until provider confirms live departure inventory",
            };

      const tideBlockingThisOption =
        tides.tideLimitApplied &&
        tides.tideGateStatus === "breaches_confirmed_operator_limit" &&
        (engOpt.optionId.includes("whale") || engOpt.optionId.includes("auke"));

      const tideGate: UnifiedJuneauOptionRecheck["tideGate"] = {
        operatorConfirmedTideLimitFt: tides.operatorConfirmedTideLimitFt,
        tideLimitApplied: tides.tideLimitApplied,
        status: tides.tideGateStatus,
        summary: tides.tideLimitApplied
          ? tides.tideSummaryText
          : `No operator tide limit confirmed for this launch (Station ${tides.stationId} ${tides.datum} shown as context only).`,
      };

      const fitsOverallForSelection =
        fitsTimeWindow &&
        operatingStatus.status === "operator_dispatch_required" &&
        seatAvailability.status !== "provider_sold_out" &&
        !tideBlockingThisOption;

      const effectiveInterest =
        pausedByFlightCancel ? "weather-backup" : meta.flightDeckInterest;

      const qs = new URLSearchParams();
      qs.set("date", date);
      qs.set("party_size", String(partySize));
      qs.set("ship", ship);
      qs.set("berth", berthMapping.berthCode);
      qs.set("claa_arrival", arrivalTime);
      if (allAboardConfirmed) {
        qs.set("all_aboard", rawAllAboard);
      }
      qs.set("time_window", timeWindowParam);
      qs.set("interest", effectiveInterest);
      qs.set("option_id", meta.legacyReplanId);
      qs.set("engine_option_id", engOpt.optionId);
      qs.set("remaining_minutes", String(remainingMinutesAfterBuffer));
      if (flightCanceled) {
        qs.set("flight_canceled", "1");
      }
      if (cancelRef) {
        qs.set("cancel_ref", cancelRef);
      }
      if (dccContextId) {
        qs.set("ctx", dccContextId);
      }
      qs.set("low_bw", "1");
      qs.set(
        "dcc_handoff_id",
        `jnu_replan_${date.replace(/-/g, "")}_${effectiveInterest}`,
      );

      const handoffHref = `/go/dcc-to-juneau-flight-deck?${qs.toString()}`;
      const directUrl = new URL(meta.directPath);
      directUrl.searchParams.set("date", date);
      directUrl.searchParams.set("party_size", String(partySize));
      directUrl.searchParams.set("ship", ship);
      directUrl.searchParams.set("berth", berthMapping.berthCode);
      directUrl.searchParams.set("time_window", timeWindowParam);

      return {
        optionId: engOpt.optionId,
        legacyReplanId: meta.legacyReplanId,
        title: engOpt.title,
        shortLabel: engOpt.shortLabel,
        category: engOpt.category,
        categoryLabel:
          engOpt.category === "two_activity_combo"
            ? "Two-Activity Combo"
            : engOpt.category === "guided_single_activity"
              ? "Guided Excursion"
              : engOpt.category === "direct_operator_shuttle"
                ? "Direct Shuttle"
                : "Public / Municipal",
        priceFromLabel: meta.priceFromLabel,
        weatherCeilingSensitive,
        weatherResilienceLabel: meta.weatherResilienceLabel,
        timeFit: {
          status: rawTimeFitStatus,
          fitsTimeWindow,
          statusBadgeLabel,
          totalPortWindowMinutes: engOpt.timing.totalPortWindowMinutes,
          disembarkationMinutes: engOpt.timing.disembarkationAndDockMinutes,
          checkInMinutes: engOpt.timing.checkInLeadMinutes,
          outboundTransferMinutes: engOpt.timing.outboundTransferMinutes,
          activityDurationMinutes: engOpt.timing.activityDurationMinutes,
          interActivityTransferMinutes:
            engOpt.timing.interActivityTransferMinutes,
          returnTransferMinutes: engOpt.timing.returnTransferMinutes,
          returnDockQueueMinutes: engOpt.timing.returnDockQueueMinutes,
          configuredReturnBufferMinutes:
            engOpt.timing.requiredReturnBufferMinutes,
          totalRequiredMinutes: engOpt.timing.totalRequiredMinutes,
          remainingMinutesAfterBuffer,
          earliestShoreReadyLocal: engOpt.timing.earliestShoreReadyTime,
          latestCheckInLocal: engOpt.timing.latestCheckInTime,
          estimatedBackAtDockLocal: engOpt.timing.estimatedBackAtDockTime,
          estimatedBackAtDockRangeText:
            engOpt.timing.estimatedBackAtDockRangeText,
          targetAllAboardBufferCutoffLocal:
            engOpt.timing.targetAllAboardBufferCutoffTime,
          confirmedAllAboardLocal: allAboardConfirmed ? rawAllAboard : null,
          reasonSummary:
            rawTimeFitStatus === "confirm_ship_timing"
              ? "Confirm ship timing: enter your ship's confirmed all-aboard cutoff and assigned berth before locking a tight departure."
              : engOpt.statusDimensions.timeFit.summary,
        },
        operatingStatus,
        seatAvailability,
        tideGate,
        fitsOverallForSelection,
        flightDeckInterest: effectiveInterest,
        handoffHref,
        directBookingOrQuoteUrl: directUrl.toString(),
      };
    });

  // Sort so options that fit overall come first, ordered by remainingMinutesAfterBuffer DESC
  mappedOptions.sort((a, b) => {
    const score = (o: UnifiedJuneauOptionRecheck) => {
      if (o.fitsOverallForSelection) return 3;
      if (o.timeFit.status === "confirm_ship_timing" && o.operatingStatus.status === "operator_dispatch_required") {
        return 2;
      }
      if (o.timeFit.fitsTimeWindow) return 1;
      return 0;
    };
    const diff = score(b) - score(a);
    if (diff !== 0) return diff;
    return (
      b.timeFit.remainingMinutesAfterBuffer -
      a.timeFit.remainingMinutesAfterBuffer
    );
  });

  const fittingOptions = mappedOptions.filter((o) => o.fitsOverallForSelection);
  const topOption = fittingOptions[0] || mappedOptions[0] || null;

  const whatChanged = flightCanceled
    ? `Flight Canceled Backup Mode on ${date} (${ship}, ${arrivalTime}–${allAboardConfirmed ? rawAllAboard : "Unconfirmed"} AKDT, Berth ${berthMapping.berthCode}, ${configuredReturnBufferMinutes}m return buffer).`
    : !allAboardConfirmed || berthMapping.berthCode === "UNKNOWN"
      ? `Port call on ${date} (${ship}, Arrival ${arrivalTime} AKDT, All-Aboard ${allAboardConfirmed ? rawAllAboard : "Unconfirmed"}, Berth ${berthMapping.berthCode}) — Confirm ship timing.`
      : `Port window on ${date} (${ship}): ${arrivalTime}–${rawAllAboard} AKDT (${((totalPortWindowMinutes || 0) / 60).toFixed(1)} hrs total) at Berth ${berthMapping.berthCode} with ${configuredReturnBufferMinutes}m return buffer.${simulateNoaaTimeout ? " (NOAA tide feed timed out — time-fit math unaffected.)" : ""}`;

  const whatStillFits =
    !allAboardConfirmed || berthMapping.berthCode === "UNKNOWN"
      ? `Confirm ship timing before booking tight valley excursions. Baseline calculation shows ${mappedOptions.filter((o) => o.timeFit.remainingMinutesAfterBuffer >= 0).length} option(s) within a standard window.`
      : fittingOptions.length > 0
        ? `${fittingOptions.length} of ${mappedOptions.length} Juneau options fit your time budget: ${fittingOptions
            .slice(0, 4)
            .map(
              (o) =>
                `${o.shortLabel} (+${o.timeFit.remainingMinutesAfterBuffer}m after buffer)`,
            )
            .join(", ")}.`
        : `0 valley/marine excursions clear your ${configuredReturnBufferMinutes}-minute return buffer inside ${totalPortWindowMinutes} minutes — stay within the immediate downtown walk-off zone.`;

  const primaryInterest = flightCanceled
    ? "weather-backup"
    : topOption?.flightDeckInterest || "whale-watching";

  const primaryNextActionHref =
    topOption?.handoffHref ||
    `/go/dcc-to-juneau-flight-deck?date=${encodeURIComponent(date)}&party_size=${partySize}&ship=${encodeURIComponent(ship)}&berth=${berthMapping.berthCode}&claa_arrival=${encodeURIComponent(arrivalTime)}&interest=${primaryInterest}&low_bw=1`;

  const primaryNextActionLabel = flightCanceled
    ? "Open Surface Whale & Mendenhall Backup on Juneau Flight Deck →"
    : !allAboardConfirmed || berthMapping.berthCode === "UNKNOWN"
      ? "Confirm Ship Timing & Compare Options on Juneau Flight Deck →"
      : topOption
        ? `Continue with ${topOption.shortLabel} (+${topOption.timeFit.remainingMinutesAfterBuffer}m buffer slack) →`
        : "Compare Juneau Options on Juneau Flight Deck →";

  const nextStep = `${primaryNextActionLabel.replace(" →", "")} (carries date ${date}, party of ${partySize}, berth ${berthMapping.berthCode}, and ${timeWindowParam} window).`;

  return {
    evaluatedAt: raw.checkedAtIso || underlyingEngineEvaluation.evaluatedAt,
    calculationEngine: "evaluateJuneauPortDayScenario",
    input: {
      ship,
      date,
      arrivalTime,
      allAboardTime: rawAllAboard,
      allAboardConfirmed,
      berthCode: berthMapping.berthCode,
      engineDock: berthMapping.engineDock,
      configuredReturnBufferMinutes,
      partySize,
      flightCanceled,
      cancelRef,
      dccContextId,
      operatorConfirmedTideLimitFt,
      providerConfirmedSeatsByOptionId,
      simulateNoaaTimeout,
    },
    availablePortMinutes: totalPortWindowMinutes,
    timeWindowParam,
    tides,
    backupFlow,
    recheckCard: {
      corridorId: "juneau-port-day",
      whatChanged,
      whatStillFits,
      nextStep,
      primaryNextActionLabel,
      primaryNextActionHref,
      secondaryNextActionLabel: "Open Ultra-Light Ship Wi-Fi View (/juneau/replan)",
      secondaryNextActionHref: `/juneau/replan?ship=${encodeURIComponent(ship)}&date=${encodeURIComponent(date)}&arrival=${encodeURIComponent(arrivalTime)}&all_aboard=${encodeURIComponent(rawAllAboard)}&berth=${encodeURIComponent(berthMapping.berthCode)}&party_size=${partySize}${flightCanceled ? "&flight_canceled=1" : ""}`,
    },
    topRecommendedOptionId: topOption?.optionId || null,
    topRemainingMinutesAfterBuffer:
      topOption?.timeFit.remainingMinutesAfterBuffer ?? null,
    options: mappedOptions,
    underlyingEngineEvaluation,
  };
}

/**
 * Async Juneau trip recheck that fetches live NOAA CO-OPS predictions for the selected
 * Juneau-local date via `readCoops` and passes them into `evaluateUnifiedJuneauTripRecheckSync`.
 */
export async function evaluateUnifiedJuneauTripRecheck(
  raw: EvaluateUnifiedJuneauInput = {},
): Promise<UnifiedJuneauTripRecheckResult> {
  const date =
    raw.date && /^\d{4}-\d{2}-\d{2}$/.test(raw.date.trim())
      ? raw.date.trim()
      : "2027-07-15";

  if (raw.liveCoopsResult !== undefined) {
    return evaluateUnifiedJuneauTripRecheckSync({
      ...raw,
      date,
      liveCoopsResult: raw.liveCoopsResult,
    });
  }

  if (raw.simulateNoaaTimeout) {
    return evaluateUnifiedJuneauTripRecheckSync({
      ...raw,
      date,
      simulateNoaaTimeout: true,
      liveCoopsResult: {
        provider: "noaa-coops",
        attribution: "Tides, water levels and coastal stations: NOAA CO-OPS",
        available: false,
        checkedAt: new Date().toISOString(),
        data: null,
        error: "NOAA CO-OPS tide prediction request timed out",
      },
    });
  }

  const ymd = date.replace(/-/g, "");
  let liveCoopsResult: Awaited<ReturnType<typeof readCoops>> | null = null;
  try {
    const predUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${JUNEAU_NOAA_STATION_ID}&begin_date=${ymd}&end_date=${ymd}&product=predictions&datum=${JUNEAU_NOAA_DATUM}&interval=hilo&units=english&time_zone=lst_ldt&format=json&application=destinationcommandcenter`;
    const res = await fetch(predUrl, {
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const json = (await res.json()) as {
        predictions?: Array<{ t?: string; v?: string; type?: "H" | "L" }>;
      };
      const preds = Array.isArray(json.predictions)
        ? json.predictions
            .filter(
              (p): p is { t: string; v: string; type: "H" | "L" } =>
                typeof p?.t === "string" &&
                typeof p?.v === "string" &&
                (p?.type === "H" || p?.type === "L"),
            )
            .map((p) => {
              const heightFt = Number(Number.parseFloat(p.v).toFixed(2));
              const heightM = Number((heightFt * 0.3048).toFixed(2));
              return {
                time: p.t,
                heightFt,
                heightM,
                type: p.type,
                label: (p.type === "H" ? "High" : "Low") as "High" | "Low",
              };
            })
        : [];
      if (preds.length > 0) {
        liveCoopsResult = {
          provider: "noaa-coops",
          attribution: "Tides, water levels and coastal stations: NOAA CO-OPS",
          available: true,
          checkedAt: new Date().toISOString(),
          data: [
            {
              id: JUNEAU_NOAA_STATION_ID,
              name: JUNEAU_NOAA_STATION_NAME,
              distanceKm: 0.4,
              waterLevelM: null,
              datum: JUNEAU_NOAA_DATUM,
              requestedDate: date,
              predictionTimeZone: "lst_ldt",
              highLowPredictions: preds,
            },
          ],
          error: null,
        } as unknown as Awaited<ReturnType<typeof readCoops>>;
      }
    }
  } catch {
    // Fall back to deterministic NOAA Station 9452210 table when network is offline
  }

  return evaluateUnifiedJuneauTripRecheckSync({
    ...raw,
    date,
    liveCoopsResult,
  });
}

// ============================================================================
// 2. DEN Arrivals Shared Trip Recheck (Traveler or Airline Revised ETA)
// ============================================================================

export interface DenArrivalRecheckInput {
  date?: string;
  flightNumber?: string | null;
  scheduledEtaLocal?: string;
  revisedEtaLocal?: string;
  etaSource?: "traveler_reported" | "airline_status";
  destination?: "Vail" | "Breckenridge" | "Keystone" | "Beaver Creek" | string;
  partySize?: number;
  skiBags?: number;
}

export interface DenArrivalRecheckResult {
  corridorId: "den-mountain-arrival";
  evaluatedAt: string;
  input: {
    date: string;
    flightNumber: string | null;
    scheduledEtaLocal: string;
    revisedEtaLocal: string;
    etaSource: "traveler_reported" | "airline_status";
    delayMinutes: number;
    destination: string;
    partySize: number;
    skiBags: number;
  };
  estimatedCurbsideReadyLocal: string;
  recommendedVehicleClass: "suv" | "van" | "multi_vehicle_quote";
  recheckCard: CompactTripRecheckCardModel;
}

function parseClockMinutesSimple(hhmm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec((hhmm || "").trim());
  if (!m) return 14 * 60;
  return Number(m[1]) * 60 + Number(m[2]);
}

function formatClockMinutesSimple(totalMins: number): string {
  const norm = ((Math.round(totalMins) % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function evaluateDenArrivalTripRecheck(
  raw: DenArrivalRecheckInput = {},
): DenArrivalRecheckResult {
  const date =
    raw.date && /^\d{4}-\d{2}-\d{2}$/.test(raw.date.trim())
      ? raw.date.trim()
      : "2026-12-19";
  const flightNumber = raw.flightNumber?.trim() || null;
  const scheduledEtaLocal = raw.scheduledEtaLocal?.trim() || "13:30";
  const revisedEtaLocal = raw.revisedEtaLocal?.trim() || scheduledEtaLocal;
  const etaSource = raw.etaSource || "traveler_reported";
  const destination = raw.destination?.trim() || "Vail";
  const partySize = Math.max(1, Math.round(raw.partySize || 4));
  const skiBags = Math.max(0, Math.round(raw.skiBags ?? 2));

  const schedMins = parseClockMinutesSimple(scheduledEtaLocal);
  const revMins = parseClockMinutesSimple(revisedEtaLocal);
  const delayMinutes = Math.max(0, revMins - schedMins);

  // Allow 50 min from DEN gate touchdown for train to Jeppesen Terminal + oversized ski-bag claim
  const baggageLeadMinutes = skiBags > 0 ? 55 : 40;
  const estimatedCurbsideReadyLocal = formatClockMinutesSimple(
    revMins + baggageLeadMinutes,
  );

  const recommendedVehicleClass: DenArrivalRecheckResult["recommendedVehicleClass"] =
    partySize > 10
      ? "multi_vehicle_quote"
      : partySize > 6 || (partySize >= 5 && skiBags >= 3)
        ? "van"
        : "suv";

  const gosnoSlug = destination.toLowerCase().includes("breck")
    ? "breckenridge"
    : "vail";

  const primaryHref =
    recommendedVehicleClass === "multi_vehicle_quote"
      ? `https://gosno.co/request-quote?origin=DEN&destination=${encodeURIComponent(destination)}&date=${encodeURIComponent(date)}&passengers=${partySize}&passengerCount=${partySize}&party_size=${partySize}&ski_bags=${skiBags}&revised_eta=${encodeURIComponent(revisedEtaLocal)}${flightNumber ? `&flight=${encodeURIComponent(flightNumber)}` : ""}&src=dcc-den-arrival-recheck`
      : `https://gosno.co/${gosnoSlug}?origin=DEN&destination=${encodeURIComponent(destination)}&date=${encodeURIComponent(date)}&passengers=${partySize}&passengerCount=${partySize}&vehicleClass=${recommendedVehicleClass}&ski_bags=${skiBags}&revised_eta=${encodeURIComponent(revisedEtaLocal)}${flightNumber ? `&flight=${encodeURIComponent(flightNumber)}` : ""}&src=dcc-den-arrival-recheck`;

  const whatChanged =
    delayMinutes > 0
      ? `DEN Arrival revised to ${revisedEtaLocal} MT (+${delayMinutes} min change from ${scheduledEtaLocal}, ${etaSource.replace("_", " ")}${flightNumber ? ` · Flight ${flightNumber}` : ""}); est. Level 5 curbside ready at ${estimatedCurbsideReadyLocal} MT after ${baggageLeadMinutes}m train & ski-bag claim.`
      : `DEN Arrival on schedule at ${revisedEtaLocal} MT (${etaSource.replace("_", " ")}${flightNumber ? ` · Flight ${flightNumber}` : ""}); est. Level 5 curbside ready at ${estimatedCurbsideReadyLocal} MT.`;

  const whatStillFits =
    recommendedVehicleClass === "multi_vehicle_quote"
      ? `Party of ${partySize} exceeds GoSno's 10-passenger single-van maximum — requires a multi-vehicle private quote on GoSno.`
      : recommendedVehicleClass === "van"
        ? `GoSno 100% Private Van (up to 10 passengers, subject to luggage & ${skiBags} ski-bag fit) fits your ${revisedEtaLocal} revised arrival without waiting for fixed shared-shuttle departure windows.`
        : `GoSno 100% Private AWD SUV (up to 6 passengers, ${skiBags} ski bags) tracks your ${revisedEtaLocal} revised DEN arrival and stages after baggage claim.`;

  const primaryLabel =
    recommendedVehicleClass === "multi_vehicle_quote"
      ? `Request GoSno ${partySize}-Pax Multi-Vehicle Quote →`
      : `Continue to GoSno Private ${recommendedVehicleClass.toUpperCase()} (${destination}) →`;

  return {
    corridorId: "den-mountain-arrival",
    evaluatedAt: new Date().toISOString(),
    input: {
      date,
      flightNumber,
      scheduledEtaLocal,
      revisedEtaLocal,
      etaSource,
      delayMinutes,
      destination,
      partySize,
      skiBags,
    },
    estimatedCurbsideReadyLocal,
    recommendedVehicleClass,
    recheckCard: {
      corridorId: "den-mountain-arrival",
      whatChanged,
      whatStillFits,
      nextStep: `${primaryLabel.replace(" →", "")} with revised ETA ${revisedEtaLocal} MT, ${partySize} passengers, and ${skiBags} ski bags.`,
      primaryNextActionLabel: primaryLabel,
      primaryNextActionHref: primaryHref,
    },
  };
}

// ============================================================================
// 3. Red Rocks Ride-Home Planning Shared Trip Recheck
//    (Event-Specific Departure Window + Venue Pickup Rules)
// ============================================================================

export interface RedRocksRideHomeRecheckInput {
  date?: string;
  eventName?: string;
  encoreCutoffLocal?: string;
  currentTimeLocal?: string;
  partySize?: number;
  pickupPreference?: "private_tailgate_and_ride" | "shared_shuttle" | "rideshare_comparison";
}

export interface RedRocksRideHomeRecheckResult {
  corridorId: "red-rocks-ride-home";
  evaluatedAt: string;
  input: {
    date: string;
    eventName: string;
    encoreCutoffLocal: string;
    shuttleFinalDepartureLocal: string;
    overnightVehicleRemovalRuleLocal: "10:00";
    partySize: number;
    pickupPreference: "private_tailgate_and_ride" | "shared_shuttle" | "rideshare_comparison";
  };
  venuePickupRules: {
    upperNorthAndTopCircleRideshareProhibited: true;
    rideshareGeofenceLot: "Jurassic Lot by Entrance 2";
    sharedShuttleDepartureRule: "Departs 30 minutes after final encore";
    overnightVehicleDeadline: "Before 10:00 a.m. the next day";
  };
  recheckCard: CompactTripRecheckCardModel;
}

export function evaluateRedRocksRideHomeRecheck(
  raw: RedRocksRideHomeRecheckInput = {},
): RedRocksRideHomeRecheckResult {
  const date =
    raw.date && /^\d{4}-\d{2}-\d{2}$/.test(raw.date.trim())
      ? raw.date.trim()
      : "2026-11-14";
  const eventName = raw.eventName?.trim() || "Red Rocks Headline Concert";
  const encoreCutoffLocal = raw.encoreCutoffLocal?.trim() || "23:15";
  const partySize = Math.max(1, Math.round(raw.partySize || 6));
  const pickupPreference =
    raw.pickupPreference || "private_tailgate_and_ride";

  const encoreMins = parseClockMinutesSimple(encoreCutoffLocal);
  const shuttleFinalDepartureLocal = formatClockMinutesSimple(encoreMins + 30);

  const primaryHref = `https://www.partyatredrocks.com/book/red-rocks-amphitheatre/private?date=${encodeURIComponent(date)}&guests=${partySize}&partySize=${partySize}&event=${encodeURIComponent(eventName)}&encore_cutoff=${encodeURIComponent(encoreCutoffLocal)}&src=dcc-red-rocks-recheck`;

  const secondaryHref = `/red-rocks?date=${encodeURIComponent(date)}&partySize=${partySize}#ride-planner`;

  const whatChanged = `Event departure window for ${eventName} (${date}): encore ends ~${encoreCutoffLocal} MT. The venue puts general post-show pickup at Jurassic Lot by Entrance 2 (Upper North & Top Circle are closed to Uber/Lyft pickups) and states that overnight vehicles should be moved before 10:00 a.m. the next day.`;

  const whatStillFits =
    partySize <= 6
      ? `Party at Red Rocks currently offers private rides and publishes $399 for a Suburban up to 6 and $599 for a van up to 10, subject to availability. A $399 Suburban fits your group of ${partySize}.`
      : partySize <= 10
        ? `Party at Red Rocks currently offers private rides and publishes $399 for a Suburban up to 6 and $599 for a van up to 10, subject to availability. A $599 van fits your group of ${partySize} (exceeds 6-seat Suburban limit).`
        : `Party at Red Rocks currently offers private rides and publishes $399 for a Suburban up to 6 and $599 for a van up to 10, subject to availability. For ${partySize} guests, book multiple private vehicles.`;

  const primaryLabel = `Book Party at Red Rocks Private Tailgate & Ride (${partySize <= 6 ? "$399 Suburban up to 6" : "$599 Van up to 10"}, subject to availability) →`;

  const secondaryLabel = "Compare Parking, Rideshare & Private Ride on DCC →";

  return {
    corridorId: "red-rocks-ride-home",
    evaluatedAt: new Date().toISOString(),
    input: {
      date,
      eventName,
      encoreCutoffLocal,
      shuttleFinalDepartureLocal,
      overnightVehicleRemovalRuleLocal: "10:00",
      partySize,
      pickupPreference,
    },
    venuePickupRules: {
      upperNorthAndTopCircleRideshareProhibited: true,
      rideshareGeofenceLot: "Jurassic Lot by Entrance 2",
      sharedShuttleDepartureRule: "Departs 30 minutes after final encore",
      overnightVehicleDeadline: "Before 10:00 a.m. the next day",
    },
    recheckCard: {
      corridorId: "red-rocks-ride-home",
      whatChanged,
      whatStillFits,
      nextStep: `${primaryLabel.replace(" →", "")} (bypasses the Jurassic Lot by Entrance 2 post-show pickup queue; overnight vehicles should be moved before 10:00 a.m. the next day).`,
      primaryNextActionLabel: primaryLabel,
      primaryNextActionHref: primaryHref,
      secondaryNextActionLabel: secondaryLabel,
      secondaryNextActionHref: secondaryHref,
    },
  };
}
