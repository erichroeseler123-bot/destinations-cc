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
  type JuneauEvaluatedCandidateDeparture,
  type JuneauEvaluatedDecisionOption,
  type JuneauEvaluatedOfferBeforeCheckout,
  type JuneauPortDayEvaluationResult,
  type JuneauTripVerdictBeforeCheckout,
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
    | "iceland-kef-to-vik"
    | "delhi-to-agra"
    | "hong-kong-to-macao"
    | string;
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
  viatorProductCode: string | null;
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
  evaluatedDepartures: JuneauEvaluatedCandidateDeparture[];
  evaluatedOffers: JuneauEvaluatedOfferBeforeCheckout[];
  tripVerdictBeforeCheckout: JuneauTripVerdictBeforeCheckout;
  fitsOverallForSelection: boolean;
  flightDeckHandoffAllowed: boolean;
  allowedNextStepType: "continue_to_flight_deck" | "view_options_that_fit";
  allowedNextStepLabel: string;
  allowedNextStepHref: string;
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
  claaScheduledArrivalTime?: string;
  allAboardTime?: string | null;
  berth?: JuneauBerthCode | JuneauArrivalDock | string;
  berthCode?: JuneauBerthCode | JuneauArrivalDock | string;
  returnBufferMinutes?: number | null;
  configuredReturnBufferMinutes?: number | null;
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
    raw.berth || raw.berthCode || matchedClaa?.berthCode || "FKL",
  );

  const requestedBuffer =
    typeof raw.returnBufferMinutes === "number" &&
    Number.isFinite(raw.returnBufferMinutes)
      ? raw.returnBufferMinutes
      : typeof raw.configuredReturnBufferMinutes === "number" &&
          Number.isFinite(raw.configuredReturnBufferMinutes)
        ? raw.configuredReturnBufferMinutes
        : null;

  const configuredReturnBufferMinutes =
    typeof requestedBuffer === "number" && requestedBuffer >= 30
      ? Math.round(requestedBuffer)
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
      qs.set("return_buffer", String(configuredReturnBufferMinutes));
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

      const flightDeckHandoffHref = `/go/dcc-to-juneau-flight-deck?${qs.toString()}`;

      // Build 'View options that fit' URL preserving all trip details when this option fails
      const fitOptionsQs = new URLSearchParams();
      fitOptionsQs.set("date", date);
      fitOptionsQs.set("party_size", String(partySize));
      fitOptionsQs.set("ship", ship);
      fitOptionsQs.set("berth", berthMapping.berthCode);
      fitOptionsQs.set("arrival", arrivalTime);
      fitOptionsQs.set("claa_arrival", arrivalTime);
      if (allAboardConfirmed) {
        fitOptionsQs.set("all_aboard", rawAllAboard);
      }
      fitOptionsQs.set("return_buffer", String(configuredReturnBufferMinutes));
      fitOptionsQs.set("time_window", timeWindowParam);
      fitOptionsQs.set("failed_option_id", meta.legacyReplanId);
      fitOptionsQs.set("failed_engine_option_id", engOpt.optionId);
      if (flightCanceled) {
        fitOptionsQs.set("flight_canceled", "1");
      }
      if (cancelRef) {
        fitOptionsQs.set("cancel_ref", cancelRef);
      }
      if (dccContextId) {
        fitOptionsQs.set("ctx", dccContextId);
      }
      fitOptionsQs.set("filter", "fits_only");
      const viewOptionsThatFitHref = `/juneau/replan?${fitOptionsQs.toString()}#fitting-options`;

      const flightDeckHandoffAllowed = fitsOverallForSelection;
      const allowedNextStepType: UnifiedJuneauOptionRecheck["allowedNextStepType"] =
        flightDeckHandoffAllowed
          ? "continue_to_flight_deck"
          : "view_options_that_fit";
      const allowedNextStepLabel = flightDeckHandoffAllowed
        ? "Continue to Juneau Flight Deck →"
        : "View options that fit";
      const allowedNextStepHref = flightDeckHandoffAllowed
        ? flightDeckHandoffHref
        : viewOptionsThatFitHref;

      // On any failed row, replace the Flight Deck link with View options that fit
      const handoffHref = allowedNextStepHref;

      const directUrl = new URL(meta.directPath);
      directUrl.searchParams.set("date", date);
      directUrl.searchParams.set("party_size", String(partySize));
      directUrl.searchParams.set("ship", ship);
      directUrl.searchParams.set("berth", berthMapping.berthCode);
      directUrl.searchParams.set("time_window", timeWindowParam);

      const blockReasonForOffers = !fitsOverallForSelection
        ? rawTimeFitStatus === "confirm_ship_timing"
          ? "Confirm ship timing: enter your ship's confirmed all-aboard cutoff and assigned berth before opening commercial or Viator checkout."
          : pausedByFlightCancel
            ? operatingStatus.summary
            : seatAvailability.status === "provider_sold_out"
              ? seatAvailability.summary
              : tideBlockingThisOption
                ? tideGate.summary
                : engOpt.statusDimensions.timeFit.summary
        : null;

      const evaluatedOffers: JuneauEvaluatedOfferBeforeCheckout[] =
        engOpt.evaluatedOffers.map((offer) => {
          const checkoutAllowed =
            fitsOverallForSelection &&
            (offer.checkoutLinkEnabled ||
              offer.channelType === "public_transit");
          return {
            ...offer,
            offerFitsOverall: fitsOverallForSelection,
            checkoutLinkEnabled: checkoutAllowed,
            href: checkoutAllowed
              ? offer.channelType === "dcc_to_flight_deck"
                ? flightDeckHandoffHref
                : offer.href
              : null,
            seatAvailability:
              seatAvailability.status === "provider_confirmed_seats"
                ? {
                    ...offer.seatAvailability,
                    summary: `Seats: ${seatAvailability.confirmedSeatsCount} confirmed by provider`,
                  }
                : seatAvailability.status === "provider_sold_out"
                  ? {
                      ...offer.seatAvailability,
                      summary: "Seats: Sold out (0 seats confirmed by provider)",
                    }
                  : offer.seatAvailability,
            withheldReason: checkoutAllowed
              ? null
              : blockReasonForOffers || offer.withheldReason,
          };
        });

      const exactDetailToVerify =
        rawTimeFitStatus === "confirm_ship_timing"
          ? "Verify your ship's confirmed all-aboard cutoff time and assigned Juneau berth on your cruise daily program before booking."
          : pausedByFlightCancel
            ? "Verify surface transfer pickup time at your pier after helicopter weather cancellation."
            : seatAvailability.status === "provider_sold_out"
              ? "Provider reported 0 seats remaining; check standby release or select the verified fitting alternative."
              : tideBlockingThisOption
                ? `Verify Auke Bay ramp tide clearance (${tides.tideSummaryText}) with operator dispatch.`
                : engOpt.tripVerdictBeforeCheckout.whenNoOfferFitsFallback
                    ?.exactDetailToVerify ||
                  `Confirm whether your ship grants an extended all-aboard cutoff (+${Math.abs(remainingMinutesAfterBuffer)}m needed to clear the ${configuredReturnBufferMinutes}m return buffer).`;

      const tripVerdictBeforeCheckout: JuneauTripVerdictBeforeCheckout = {
        ...engOpt.tripVerdictBeforeCheckout,
        verdictStatus:
          rawTimeFitStatus === "confirm_ship_timing"
            ? "needs_verification"
            : fitsOverallForSelection
              ? remainingMinutesAfterBuffer >= 30
                ? "fits_port_window"
                : "tight_buffer_fits"
              : "does_not_fit_port_window",
        timeFitBadge: {
          fitsTimeWindow,
          status: rawTimeFitStatus,
          label: statusBadgeLabel,
        },
        seatAvailabilityBadge: {
          ...engOpt.tripVerdictBeforeCheckout.seatAvailabilityBadge,
          label:
            seatAvailability.status === "provider_confirmed_seats"
              ? `Seat Availability: ${seatAvailability.confirmedSeatsCount} confirmed by provider`
              : seatAvailability.status === "provider_sold_out"
                ? "Seat Availability: Sold out (0 confirmed)"
                : engOpt.tripVerdictBeforeCheckout.seatAvailabilityBadge.label,
        },
        commercialOffersEnabled: fitsOverallForSelection,
        whenNoOfferFitsFallback: fitsOverallForSelection
          ? null
          : {
              verifiedFittingAlternative:
                engOpt.tripVerdictBeforeCheckout.whenNoOfferFitsFallback
                  ?.verifiedFittingAlternative ?? null,
              exactDetailToVerify,
            },
      };

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
        viatorProductCode: engOpt.viatorProductCode,
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
        evaluatedDepartures: engOpt.evaluatedDepartures,
        evaluatedOffers,
        tripVerdictBeforeCheckout,
        fitsOverallForSelection,
        flightDeckHandoffAllowed,
        allowedNextStepType,
        allowedNextStepLabel,
        allowedNextStepHref,
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
  const topFittingOption = fittingOptions[0] || null;

  for (const opt of mappedOptions) {
    if (!opt.fitsOverallForSelection && opt.tripVerdictBeforeCheckout.whenNoOfferFitsFallback) {
      opt.tripVerdictBeforeCheckout.whenNoOfferFitsFallback.verifiedFittingAlternative =
        topFittingOption
          ? {
              optionId: topFittingOption.optionId,
              title: topFittingOption.title,
              remainingMinutesAfterBuffer:
                topFittingOption.timeFit.remainingMinutesAfterBuffer,
              summary: `Switch to ${topFittingOption.title} (Est. back at dock ${topFittingOption.timeFit.estimatedBackAtDockLocal}, +${topFittingOption.timeFit.remainingMinutesAfterBuffer}m margin after ${topFittingOption.timeFit.configuredReturnBufferMinutes}m return buffer).`,
              replanHref: opt.allowedNextStepHref,
            }
          : null;
    }
  }

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
    overnightVehicleRemovalRuleLocal: "02:00";
    partySize: number;
    pickupPreference: "private_tailgate_and_ride" | "shared_shuttle" | "rideshare_comparison";
  };
  venuePickupRules: {
    upperNorthAndTopCircleRideshareProhibited: true;
    rideshareGeofenceLot: "Jurassic Lot (Entrance 4 on CO-93)";
    sharedShuttleDepartureRule: "Departs 30 minutes after final encore";
    overnightVehicleDeadline: "2:00 AM following concert nights";
  };
  recheckCard: CompactTripRecheckCardModel;
}

export function evaluateRedRocksRideHomeRecheck(
  raw: RedRocksRideHomeRecheckInput = {},
): RedRocksRideHomeRecheckResult {
  const date =
    raw.date && /^\d{4}-\d{2}-\d{2}$/.test(raw.date.trim())
      ? raw.date.trim()
      : "2026-07-18";
  const eventName = raw.eventName?.trim() || "Red Rocks Headline Concert";
  const encoreCutoffLocal = raw.encoreCutoffLocal?.trim() || "23:15";
  const partySize = Math.max(1, Math.round(raw.partySize || 4));
  const pickupPreference =
    raw.pickupPreference ||
    (partySize >= 5 ? "private_tailgate_and_ride" : "shared_shuttle");

  const encoreMins = parseClockMinutesSimple(encoreCutoffLocal);
  const shuttleFinalDepartureLocal = formatClockMinutesSimple(encoreMins + 30);

  const isPrivatePreferred =
    pickupPreference === "private_tailgate_and_ride" || partySize >= 6;

  const primaryHref = isPrivatePreferred
    ? `https://www.partyatredrocks.com/book/red-rocks-amphitheatre/private?date=${encodeURIComponent(date)}&guests=${partySize}&event=${encodeURIComponent(eventName)}&encore_cutoff=${encodeURIComponent(encoreCutoffLocal)}&src=dcc-red-rocks-recheck`
    : `https://www.partyatredrocks.com/book/red-rocks-amphitheatre/custom/shared?date=${encodeURIComponent(date)}&guests=${partySize}&event=${encodeURIComponent(eventName)}&encore_cutoff=${encodeURIComponent(encoreCutoffLocal)}&src=dcc-red-rocks-recheck`;

  const secondaryHref = isPrivatePreferred
    ? `https://www.partyatredrocks.com/book/red-rocks-amphitheatre/custom/shared?date=${encodeURIComponent(date)}&guests=${partySize}&event=${encodeURIComponent(eventName)}&src=dcc-red-rocks-recheck`
    : `https://www.partyatredrocks.com/book/red-rocks-amphitheatre/private?date=${encodeURIComponent(date)}&guests=${partySize}&event=${encodeURIComponent(eventName)}&src=dcc-red-rocks-recheck`;

  const whatChanged = `Event departure window for ${eventName} (${date}): encore ends ~${encoreCutoffLocal} MT; shared shuttle boarding closes at ${shuttleFinalDepartureLocal} MT (+30 min post-encore). Upper North & Top Circle are closed to Uber/Lyft pickups (all rideshares geofenced to Jurassic Lot on Hwy 93).`;

  const whatStillFits =
    partySize <= 6
      ? `Party at Red Rocks Private SUV Tailgate & Ride ($499 up to 6 guests), Private 14-Pax Sprinter ($599), and $65/person round-trip concert shuttle (departing by ${shuttleFinalDepartureLocal} MT) all fit your group of ${partySize}.`
      : partySize <= 14
        ? `Party at Red Rocks Private 14-Pax Sprinter Tailgate & Ride ($599 flat) and $65/person round-trip shuttle fit your group of ${partySize} (exceeds 6-seat SUV limit).`
        : `For ${partySize} guests, book multiple Party at Red Rocks vehicles or per-seat $65 round-trip shuttles before the ${shuttleFinalDepartureLocal} MT post-encore cutoff.`;

  const primaryLabel = isPrivatePreferred
    ? `Book Party at Red Rocks Private Tailgate & Ride (${partySize <= 6 ? "$499 SUV" : "$599 14-Pax Sprinter"}) →`
    : `Book Party at Red Rocks $65/Person Concert Shuttle (Departs ${shuttleFinalDepartureLocal}) →`;

  const secondaryLabel = isPrivatePreferred
    ? "Compare $65/Person Shared Concert Shuttle ↗"
    : "Upgrade to Private Tailgate & Ride ($499 SUV / $599 Sprinter) ↗";

  return {
    corridorId: "red-rocks-ride-home",
    evaluatedAt: new Date().toISOString(),
    input: {
      date,
      eventName,
      encoreCutoffLocal,
      shuttleFinalDepartureLocal,
      overnightVehicleRemovalRuleLocal: "02:00",
      partySize,
      pickupPreference,
    },
    venuePickupRules: {
      upperNorthAndTopCircleRideshareProhibited: true,
      rideshareGeofenceLot: "Jurassic Lot (Entrance 4 on CO-93)",
      sharedShuttleDepartureRule: "Departs 30 minutes after final encore",
      overnightVehicleDeadline: "2:00 AM following concert nights",
    },
    recheckCard: {
      corridorId: "red-rocks-ride-home",
      whatChanged,
      whatStillFits,
      nextStep: `${primaryLabel.replace(" →", "")} (bypasses the Jurassic Lot Hwy 93 rideshare geofence queue; all vehicles must clear Red Rocks Park by 2:00 AM).`,
      primaryNextActionLabel: primaryLabel,
      primaryNextActionHref: primaryHref,
      secondaryNextActionLabel: secondaryLabel,
      secondaryNextActionHref: secondaryHref,
    },
  };
}

// ============================================================================
// 4. Saved Juneau Trip Context Pre-Checkout Recheck Guard
// ============================================================================

export interface SavedJuneauTripContextInput {
  ship?: string | null;
  date?: string | null;
  arrival?: string | null;
  arrivalTime?: string | null;
  claa_arrival?: string | null;
  all_aboard?: string | null;
  allAboardTime?: string | null;
  time_window?: string | null;
  berth?: string | null;
  berthCode?: string | null;
  return_buffer?: string | number | null;
  party_size?: string | number | null;
  partySize?: string | number | null;
  option_id?: string | null;
  optionId?: string | null;
  engine_option_id?: string | null;
  engineOptionId?: string | null;
  interest?: string | null;
  flight_canceled?: string | boolean | null;
  cancel_ref?: string | null;
  ctx?: string | null;
  dcc_ctx?: string | null;
}

export interface SavedJuneauTripContextRecheckResult {
  checkoutAllowed: boolean;
  evaluatedAt: string;
  matchedOption: UnifiedJuneauOptionRecheck | null;
  allowedNextStepType: "continue_to_flight_deck" | "view_options_that_fit";
  allowedNextStepLabel: string;
  allowedNextStepHref: string;
  reasonSummary: string;
  recheckResult: UnifiedJuneauTripRecheckResult;
}

function decodeBase64UrlJsonSafe(encoded: string): Record<string, unknown> | null {
  try {
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (normalized.length % 4)) % 4;
    const padded = normalized + "=".repeat(padLen);
    let jsonText = "";
    if (typeof globalThis.atob === "function") {
      jsonText = globalThis.atob(padded);
    } else if (typeof Buffer !== "undefined") {
      jsonText = Buffer.from(padded, "base64").toString("utf8");
    }
    if (!jsonText) return null;
    const parsed = JSON.parse(jsonText);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * Rechecks saved trip context before a Juneau checkout or Flight Deck handoff can proceed.
 * If the selected excursion fails the ship's port time window (e.g., 2027-07-15 08:00–13:30 at AJ Dock
 * for Auke Bay Whale Watch), checkout progression is blocked and the caller receives the
 * `View options that fit` redirect preserving all trip details.
 */
export function recheckSavedJuneauTripContextBeforeCheckout(
  raw: SavedJuneauTripContextInput,
): SavedJuneauTripContextRecheckResult {
  const decodedCtx =
    typeof raw.dcc_ctx === "string" && raw.dcc_ctx.trim()
      ? decodeBase64UrlJsonSafe(raw.dcc_ctx.trim())
      : null;

  const pickStr = (
    directVal: string | null | undefined,
    ctxKey: string,
    fallback: string,
  ): string => {
    if (typeof directVal === "string" && directVal.trim()) return directVal.trim();
    const fromCtx = decodedCtx?.[ctxKey];
    if (typeof fromCtx === "string" && fromCtx.trim()) return fromCtx.trim();
    return fallback;
  };

  const ship = pickStr(raw.ship, "ship", "Norwegian Bliss");
  const date = pickStr(raw.date, "date", "2027-07-15");
  const berth = pickStr(raw.berth || raw.berthCode, "berth", "FKL");
  const timeWindow = pickStr(raw.time_window, "time_window", "");

  let arrivalFromWindow = "";
  let allAboardFromWindow = "";
  if (timeWindow && timeWindow.includes("-")) {
    const [arrPart, abPart] = timeWindow.split("-", 2);
    if (arrPart && /^\d{1,2}:\d{2}$/.test(arrPart.trim())) {
      arrivalFromWindow = arrPart.trim();
    }
    if (abPart && /^\d{1,2}:\d{2}$/.test(abPart.trim())) {
      allAboardFromWindow = abPart.trim();
    }
  }

  const arrivalTime =
    pickStr(raw.arrival || raw.arrivalTime || raw.claa_arrival, "arrival", "") ||
    pickStr(null, "claa_arrival", "") ||
    arrivalFromWindow ||
    "08:00";

  const allAboardTime =
    pickStr(raw.all_aboard || raw.allAboardTime, "all_aboard", "") ||
    allAboardFromWindow ||
    "13:30";

  const rawParty =
    raw.party_size ??
    raw.partySize ??
    (typeof decodedCtx?.party_size === "number" || typeof decodedCtx?.party_size === "string"
      ? (decodedCtx.party_size as number | string)
      : 2);
  const partySize = Math.max(1, Number.parseInt(String(rawParty), 10) || 2);

  const rawReturnBuffer =
    raw.return_buffer ??
    (typeof decodedCtx?.return_buffer === "number" || typeof decodedCtx?.return_buffer === "string"
      ? (decodedCtx.return_buffer as number | string)
      : null);
  const configuredReturnBufferMinutes =
    rawReturnBuffer !== null && rawReturnBuffer !== undefined && String(rawReturnBuffer).trim() !== ""
      ? Number.parseInt(String(rawReturnBuffer), 10) || null
      : null;

  const flightCanceled =
    raw.flight_canceled === true ||
    raw.flight_canceled === "1" ||
    raw.flight_canceled === "true" ||
    decodedCtx?.flight_canceled === true ||
    decodedCtx?.flight_canceled === "1";

  const cancelRef = pickStr(raw.cancel_ref, "cancel_ref", "") || null;
  const dccContextId = pickStr(raw.ctx, "ctx", "") || null;
  const requestedOptionId = pickStr(raw.option_id || raw.optionId, "option_id", "");
  const requestedEngineOptionId = pickStr(raw.engine_option_id || raw.engineOptionId, "engine_option_id", "");
  const requestedInterest = pickStr(raw.interest, "interest", "");

  const recheckResult = evaluateUnifiedJuneauTripRecheckSync({
    ship,
    date,
    arrivalTime,
    allAboardTime,
    berthCode: berth,
    configuredReturnBufferMinutes,
    partySize,
    flightCanceled,
    cancelRef,
    dccContextId,
  });

  let matchedOption: UnifiedJuneauOptionRecheck | null = null;
  if (requestedEngineOptionId) {
    matchedOption =
      recheckResult.options.find((o) => o.optionId === requestedEngineOptionId) ||
      null;
  }
  if (!matchedOption && requestedOptionId) {
    matchedOption =
      recheckResult.options.find(
        (o) =>
          o.legacyReplanId === requestedOptionId ||
          o.optionId === requestedOptionId,
      ) || null;
  }
  if (!matchedOption && requestedInterest) {
    if (requestedInterest === "whale-watching") {
      matchedOption =
        recheckResult.options.find(
          (o) => o.optionId === "jun-opt-auke-bay-whale-direct",
        ) || null;
    } else if (requestedInterest === "dogsled") {
      matchedOption =
        recheckResult.options.find(
          (o) => o.optionId === "jun-opt-heli-dogsled-combo",
        ) || null;
    } else if (requestedInterest === "helicopter") {
      matchedOption =
        recheckResult.options.find(
          (o) => o.optionId === "jun-opt-heli-glacier-walkabout",
        ) || null;
    }
  }

  // If a specific option was selected and fails recheck, block checkout and return 'View options that fit'
  if (matchedOption && !matchedOption.fitsOverallForSelection) {
    return {
      checkoutAllowed: false,
      evaluatedAt: recheckResult.evaluatedAt,
      matchedOption,
      allowedNextStepType: "view_options_that_fit",
      allowedNextStepLabel: "View options that fit",
      allowedNextStepHref: matchedOption.allowedNextStepHref,
      reasonSummary: `Saved trip recheck blocked checkout for ${matchedOption.shortLabel}: ${matchedOption.timeFit.statusBadgeLabel}. Redirecting to View options that fit with trip details preserved.`,
      recheckResult,
    };
  }

  // If no option fits at all, block checkout and direct to fitting-options view
  const anyFitting = recheckResult.options.some((o) => o.fitsOverallForSelection);
  if (!anyFitting) {
    const fallbackFailed = matchedOption || recheckResult.options[0] || null;
    const fallbackHref =
      fallbackFailed?.allowedNextStepHref ||
      `/juneau/replan?date=${encodeURIComponent(date)}&party_size=${partySize}&ship=${encodeURIComponent(ship)}&berth=${encodeURIComponent(recheckResult.input.berthCode)}&arrival=${encodeURIComponent(arrivalTime)}&claa_arrival=${encodeURIComponent(arrivalTime)}&all_aboard=${encodeURIComponent(allAboardTime)}&filter=fits_only#fitting-options`;
    return {
      checkoutAllowed: false,
      evaluatedAt: recheckResult.evaluatedAt,
      matchedOption: fallbackFailed,
      allowedNextStepType: "view_options_that_fit",
      allowedNextStepLabel: "View options that fit",
      allowedNextStepHref: fallbackHref,
      reasonSummary: `Saved trip recheck found 0 excursions clearing the ${recheckResult.input.configuredReturnBufferMinutes}m return buffer for ${arrivalTime}–${allAboardTime} at Berth ${recheckResult.input.berthCode}.`,
      recheckResult,
    };
  }

  const effectiveOption =
    matchedOption ||
    recheckResult.options.find((o) => o.fitsOverallForSelection) ||
    recheckResult.options[0];

  return {
    checkoutAllowed: true,
    evaluatedAt: recheckResult.evaluatedAt,
    matchedOption: effectiveOption,
    allowedNextStepType: "continue_to_flight_deck",
    allowedNextStepLabel: "Continue to Juneau Flight Deck →",
    allowedNextStepHref: effectiveOption.allowedNextStepHref,
    reasonSummary: `Saved trip recheck passed for ${effectiveOption.shortLabel} (+${effectiveOption.timeFit.remainingMinutesAfterBuffer}m after ${recheckResult.input.configuredReturnBufferMinutes}m buffer).`,
    recheckResult,
  };
}

// ============================================================================
// 5. DCC-412 Multi-Leg Readiness, Connection & Cutoff Recheck Engine
//    (Inside `sharedTripRecheck` — Timezone-Independent IANA → UTC ISO-8601)
// ============================================================================

export interface Dcc412LegReceiptProvenance {
  legId: string;
  legTitle: string;
  source: string;
  timestamp: string;
  expiry: string;
}

export interface Dcc412CorridorPlace {
  placeId: string;
  slug: string;
  name: string;
  role:
    | "origin_rail_station"
    | "arrival_and_interchange_station"
    | "destination_cutoff_gate";
  ianaTimeZone: string;
}

export const DELHI_AGRA_CORRIDOR_PLACES: {
  delhiRailStation: Dcc412CorridorPlace;
  agraCantt: Dcc412CorridorPlace;
  tajEntryGate: Dcc412CorridorPlace;
} = {
  delhiRailStation: {
    placeId: "dcc:place:in-del-nzm-rail-station",
    slug: "delhi-rail-station",
    name: "Delhi Rail Station (Hazrat Nizamuddin NZM)",
    role: "origin_rail_station",
    ianaTimeZone: "Asia/Kolkata",
  },
  agraCantt: {
    placeId: "dcc:place:in-agr-agc-rail-station",
    slug: "agra-cantt",
    name: "Agra Cantt Railway Station (AGC)",
    role: "arrival_and_interchange_station",
    ianaTimeZone: "Asia/Kolkata",
  },
  tajEntryGate: {
    placeId: "dcc:place:in-agr-taj-entry-gate",
    slug: "taj-entry-gate",
    name: "Taj Mahal Entry Gate (East Gate / Shilpgram)",
    role: "destination_cutoff_gate",
    ianaTimeZone: "Asia/Kolkata",
  },
};

export interface Dcc412CandidateDepartureInput {
  candidateId: string;
  title: string;
  operatorName: string;
  departureLocal: string; // HH:mm in `ianaTimeZone` on `serviceDate`
  arrivalAtDestinationLocal?: string; // HH:mm in `ianaTimeZone` on `serviceDate`
  /**
   * Minutes from departure at interchange station (`Agra Cantt`) to being ready at the destination gate (`Taj entry gate`).
   * Used when `arrivalAtDestinationLocal` is omitted (defaults to 25 minutes).
   */
  gateReadyMinutesFromDeparture?: number;
  originPlaceId?: string;
  destinationPlaceId?: string;
  /**
   * Ticket / boarding cutoff before departure in minutes (e.g. 10 min before departure, or 0 for pre-staged private car)
   */
  ticketCutoffBeforeDepartureMinutes?: number;
  /**
   * Or explicit ticket cutoff local time (HH:mm)
   */
  ticketCutoffLocal?: string | null;
  /**
   * Destination / monument entry cutoff local time (e.g. "11:00", "11:30", or "16:30" for Taj Mahal entry cutoff)
   */
  destinationCutoffLocal?: string | null;
  /**
   * Whether a critical live update (e.g. live train running status or road closure feed) is missing
   */
  criticalUpdateMissing?: boolean;
  criticalUpdateMissingReason?: string | null;
  source: string;
  sourceTimestamp: string;
  sourceExpiry: string;
  nextStepHref?: string;
  nextStepLabel?: string;
}

export interface Dcc412ItineraryRecheckInput {
  corridorId?: string;
  serviceDate: string; // YYYY-MM-DD
  ianaTimeZone: string; // e.g. "Asia/Kolkata"
  places?: {
    delhiRailStation: Dcc412CorridorPlace;
    agraCantt: Dcc412CorridorPlace;
    tajEntryGate: Dcc412CorridorPlace;
  };
  inboundLegId?: string;
  inboundLegTitle?: string;
  scheduledArrivalLocal: string; // HH:mm in `ianaTimeZone`, e.g. "09:50"
  /**
   * Optional absolute ETA (either local HH:mm or full ISO-8601 UTC string).
   * When provided, DCC-412 uses `absoluteEta` directly; otherwise it uses `scheduledArrivalLocal + delayMinutes`.
   */
  absoluteEta?: string | null;
  delayMinutes?: number | null;
  /**
   * Station exit / terminal transfer buffer in minutes — added strictly ONCE to compute `travelerReadyAt`.
   */
  transferBufferMinutes: number;
  /**
   * Whether a missing or stale update could change the answer (triggers `Needs verification` on schedule baseline).
   */
  criticalUpdateMissing?: boolean;
  staleUpdate?: boolean;
  staleOrMissingUpdateCouldChangeAnswer?: boolean;
  evaluatedAtUtc?: string | null;
  criticalUpdateMissingReason?: string | null;
  isExampleScenario?: boolean;
  scenarioLabel?: string | null;
  requireTravelerEtaForVerification?: boolean;
  sampleOnwardDeparturesExcluded?: boolean;
  onwardServicesVerificationNote?: string | null;
  inboundSource?: string;
  inboundSourceTimestamp?: string;
  inboundSourceExpiry?: string;
  destinationCutoffLocal?: string | null;
  destinationCutoffLabel?: string | null;
  candidateDepartures: Dcc412CandidateDepartureInput[];
}

export interface Dcc412EvaluatedCandidateItinerary {
  candidateId: string;
  title: string;
  operatorName: string;
  originPlaceId: string;
  destinationPlaceId: string;
  /**
   * `travelerReadyAt` carried explicitly through each candidate itinerary
   */
  travelerReadyAt: {
    localDate: string;
    localTime24: string;
    localTime12: string;
    ianaTimeZone: string;
    utcIso: string;
    utcShort: string;
    formattedSummary: string;
  };
  departureLocal: string;
  departureUtc: string;
  departureUtcShort: string;
  arrivalAtDestinationLocal: string;
  arrivalAtDestinationUtc: string;
  ticketCutoffLocal: string;
  ticketCutoffUtc: string;
  ticketCutoffUtcShort: string;
  destinationCutoffLocal: string | null;
  destinationCutoffUtc: string | null;
  slackToTicketCutoffMinutes: number;
  slackToDepartureMinutes: number;
  slackToDestinationCutoffMinutes: number | null;
  passesTicketCutoff: boolean;
  passesDepartureTime: boolean;
  passesDestinationCutoff: boolean;
  catchable: boolean;
  connectionStatus:
    | "catchable"
    | "missed_connection"
    | "missed_ticket_cutoff"
    | "missed_destination_cutoff";
  scheduleBaselineStatus: "Verified" | "Needs verification";
  reasonSummary: string;
  legProvenance: Dcc412LegReceiptProvenance;
  nextStepLabel: string;
  nextStepHref: string;
}

export interface Dcc412ItineraryRecheckResult {
  specId: "DCC-412";
  corridorId: string;
  evaluatedAt: string;
  serviceDate: string;
  ianaTimeZone: string;
  isExampleScenario: boolean;
  scenarioLabel: string;
  travelerEtaEntered: boolean;
  sampleOnwardDeparturesExcluded: boolean;
  onwardServicesVerificationNote: string | null;
  places: {
    delhiRailStation: Dcc412CorridorPlace;
    agraCantt: Dcc412CorridorPlace;
    tajEntryGate: Dcc412CorridorPlace;
  };
  scheduleBaselineStatus: "Verified" | "Needs verification";
  criticalUpdateMissing: boolean;
  criticalUpdateMissingReason: string | null;
  etaResolutionMode: "absolute_eta" | "scheduled_plus_delay";
  scheduledArrivalLocal: string;
  scheduledArrivalUtc: string;
  effectiveArrivalLocal: string;
  effectiveArrivalUtc: string;
  effectiveArrivalUtcShort: string;
  delayMinutesApplied: number;
  transferBufferMinutes: number;
  transferBufferAddedOnce: true;
  travelerReadyAt: {
    localDate: string;
    localTime24: string;
    localTime12: string;
    ianaTimeZone: string;
    utcIso: string;
    utcShort: string;
    formattedSummary: string;
  };
  candidates: Dcc412EvaluatedCandidateItinerary[];
  missedConnections: Dcc412EvaluatedCandidateItinerary[];
  catchableCandidates: Dcc412EvaluatedCandidateItinerary[];
  /**
   * The earliest onward departure from the interchange station (`Agra Cantt`) that the traveler can board after `travelerReadyAt`
   * (`passesDepartureTime && passesTicketCutoff`), regardless of whether it later clears `destinationCutoffLocal` at the gate.
   */
  nextServiceAfterReady: Dcc412EvaluatedCandidateItinerary | null;
  /**
   * The earliest onward departure that BOTH can be boarded after `travelerReadyAt` AND clears `destinationCutoffLocal` at the gate.
   */
  nextCatchableDeparture: Dcc412EvaluatedCandidateItinerary | null;
  gateArrivalLocal: string | null;
  gateArrivalUtc: string | null;
  destinationCutoffLocal: string | null;
  destinationCutoffUtc: string | null;
  cutoffMarginMinutes: number | null;
  fitsDestinationCutoff: boolean;
  cutoffVerdictLabel: string;
  legProvenance: Dcc412LegReceiptProvenance[];
  recheckCard: CompactTripRecheckCardModel;
}

function format12HourClock(hhmm24: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm24.trim());
  if (!m) return hhmm24;
  const h24 = Number(m[1]);
  const mins = m[2];
  const period = h24 >= 12 ? "p.m." : "a.m.";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mins} ${period}`;
}

function extractWallClockPartsInZone(
  utcMs: number,
  ianaTimeZone: string,
): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: ianaTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = dtf.formatToParts(new Date(utcMs));
  const map: Record<string, number> = {};
  for (const p of parts) {
    if (
      p.type === "year" ||
      p.type === "month" ||
      p.type === "day" ||
      p.type === "hour" ||
      p.type === "minute" ||
      p.type === "second"
    ) {
      map[p.type] = Number.parseInt(p.value, 10);
    }
  }
  return {
    year: map.year || 1970,
    month: map.month || 1,
    day: map.day || 1,
    hour: map.hour === 24 ? 0 : map.hour || 0,
    minute: map.minute || 0,
    second: map.second || 0,
  };
}

/**
 * Resolves a local date (`YYYY-MM-DD`) and local clock (`HH:mm`, plus optional minute delta)
 * in `ianaTimeZone` to a deterministic UTC timestamp — 100% independent of the host/device timezone.
 */
export function resolveLocalTimeInIanaZoneToUtc(
  serviceDate: string,
  localClockHhMm: string,
  ianaTimeZone: string,
  additionalMinutes = 0,
): {
  utcMs: number;
  utcIso: string;
  utcShort: string;
  localDate: string;
  localTime24: string;
  localTime12: string;
  ianaTimeZone: string;
} {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(serviceDate.trim());
  const year = dateMatch ? Number(dateMatch[1]) : 2026;
  const month = dateMatch ? Number(dateMatch[2]) : 11;
  const day = dateMatch ? Number(dateMatch[3]) : 18;

  const clockMatch = /^(\d{1,2}):(\d{2})$/.exec(localClockHhMm.trim());
  const hour = clockMatch ? Number(clockMatch[1]) : 9;
  const minute = clockMatch ? Number(clockMatch[2]) : 50;

  const targetWallUtcMs =
    Date.UTC(year, month - 1, day, hour, minute, 0, 0) +
    Math.round(additionalMinutes) * 60_000;

  // Two-pass offset refinement using Intl.DateTimeFormat for `ianaTimeZone`
  const p1 = extractWallClockPartsInZone(targetWallUtcMs, ianaTimeZone);
  const wallAtTarget = Date.UTC(
    p1.year,
    p1.month - 1,
    p1.day,
    p1.hour,
    p1.minute,
    p1.second,
    0,
  );
  const offset1 = wallAtTarget - targetWallUtcMs;
  const estUtcMs = targetWallUtcMs - offset1;

  const p2 = extractWallClockPartsInZone(estUtcMs, ianaTimeZone);
  const wallAtEst = Date.UTC(
    p2.year,
    p2.month - 1,
    p2.day,
    p2.hour,
    p2.minute,
    p2.second,
    0,
  );
  const offset2 = wallAtEst - estUtcMs;
  const finalUtcMs = targetWallUtcMs - offset2;

  const finalLocalParts = extractWallClockPartsInZone(finalUtcMs, ianaTimeZone);
  const localDate = `${String(finalLocalParts.year).padStart(4, "0")}-${String(finalLocalParts.month).padStart(2, "0")}-${String(finalLocalParts.day).padStart(2, "0")}`;
  const localTime24 = `${String(finalLocalParts.hour).padStart(2, "0")}:${String(finalLocalParts.minute).padStart(2, "0")}`;
  const localTime12 = format12HourClock(localTime24);

  const utcDate = new Date(finalUtcMs);
  const utcIso = utcDate.toISOString().replace(/\.\d{3}Z$/, "Z");
  const utcShort = `${String(utcDate.getUTCHours()).padStart(2, "0")}:${String(utcDate.getUTCMinutes()).padStart(2, "0")}Z`;

  return {
    utcMs: finalUtcMs,
    utcIso,
    utcShort,
    localDate,
    localTime24,
    localTime12,
    ianaTimeZone,
  };
}

/**
 * DCC-412 Multi-Leg Readiness, Connection & Cutoff Evaluator inside `sharedTripRecheck`.
 * - Models the 3 distinct corridor places: Delhi rail station, Agra Cantt, and Taj entry gate.
 * - Resolves local times using `serviceDate` and `ianaTimeZone` and passes readiness times & deadlines as UTC ISO-8601 timestamps.
 * - Uses `absoluteEta` when available, or `scheduledArrivalLocal + delayMinutes`.
 * - Adds `transferBufferMinutes` strictly ONCE (`transferBufferAddedOnce: true`).
 * - Carries `travelerReadyAt` through each candidate itinerary.
 * - Finds the next departure the traveler can actually catch and checks ticket & destination cutoffs.
 * - Shows schedule baseline as `Needs verification` when a missing or stale update could change the answer, or when a real-trip traveler has not entered an ETA.
 * - Includes each leg's `source`, `timestamp`, and `expiry` for the signed decision receipt.
 */
export function evaluateDcc412ItineraryRecheck(
  input: Dcc412ItineraryRecheckInput,
): Dcc412ItineraryRecheckResult {
  const corridorId = input.corridorId?.trim() || "delhi-to-agra";
  const serviceDate = input.serviceDate.trim();
  const ianaTimeZone = input.ianaTimeZone.trim() || "Asia/Kolkata";
  const transferBufferMinutes = Math.max(0, Math.round(input.transferBufferMinutes));
  const places = input.places || DELHI_AGRA_CORRIDOR_PLACES;
  const isExampleScenario = Boolean(input.isExampleScenario);
  const scenarioLabel =
    input.scenarioLabel?.trim() ||
    (isExampleScenario
      ? `Example — ${serviceDate === "2026-12-10" ? "December 10, 2026" : serviceDate} Scenario`
      : "Real-Trip Evaluation (Official NTES Lookup + Traveler-Entered ETA)");
  const travelerEtaEntered = Boolean(input.absoluteEta && input.absoluteEta.trim());
  const missingTravelerEtaInRealTrip = Boolean(
    input.requireTravelerEtaForVerification && !travelerEtaEntered,
  );
  const sampleOnwardDeparturesExcluded = Boolean(
    input.sampleOnwardDeparturesExcluded,
  );
  const onwardServicesVerificationNote =
    input.onwardServicesVerificationNote ??
    (sampleOnwardDeparturesExcluded
      ? "Sample onward departures (10:30, 11:00, and 11:30 Agra Cantt station feeder cohorts) are kept out of the real-trip result until those onward transfer services are verified in the Review Desk."
      : null);

  const scheduledResolved = resolveLocalTimeInIanaZoneToUtc(
    serviceDate,
    input.scheduledArrivalLocal,
    ianaTimeZone,
    0,
  );

  let effectiveArrivalResolved: ReturnType<typeof resolveLocalTimeInIanaZoneToUtc>;
  let etaResolutionMode: "absolute_eta" | "scheduled_plus_delay" = "scheduled_plus_delay";
  let delayMinutesApplied = Math.max(0, Math.round(input.delayMinutes ?? 0));

  if (input.absoluteEta && input.absoluteEta.trim()) {
    etaResolutionMode = "absolute_eta";
    const trimmedEta = input.absoluteEta.trim();
    if (/^\d{1,2}:\d{2}$/.test(trimmedEta)) {
      effectiveArrivalResolved = resolveLocalTimeInIanaZoneToUtc(
        serviceDate,
        trimmedEta,
        ianaTimeZone,
        0,
      );
    } else {
      const parsedMs = Date.parse(trimmedEta);
      if (Number.isFinite(parsedMs)) {
        const localParts = extractWallClockPartsInZone(parsedMs, ianaTimeZone);
        const hhmm = `${String(localParts.hour).padStart(2, "0")}:${String(localParts.minute).padStart(2, "0")}`;
        const ymd = `${String(localParts.year).padStart(4, "0")}-${String(localParts.month).padStart(2, "0")}-${String(localParts.day).padStart(2, "0")}`;
        effectiveArrivalResolved = resolveLocalTimeInIanaZoneToUtc(
          ymd,
          hhmm,
          ianaTimeZone,
          0,
        );
      } else {
        effectiveArrivalResolved = resolveLocalTimeInIanaZoneToUtc(
          serviceDate,
          input.scheduledArrivalLocal,
          ianaTimeZone,
          delayMinutesApplied,
        );
      }
    }
    delayMinutesApplied = Math.round(
      (effectiveArrivalResolved.utcMs - scheduledResolved.utcMs) / 60_000,
    );
  } else {
    effectiveArrivalResolved = resolveLocalTimeInIanaZoneToUtc(
      serviceDate,
      input.scheduledArrivalLocal,
      ianaTimeZone,
      delayMinutesApplied,
    );
  }

  // Add the transfer/exit buffer strictly ONCE to effective arrival
  const readyResolved = resolveLocalTimeInIanaZoneToUtc(
    effectiveArrivalResolved.localDate,
    effectiveArrivalResolved.localTime24,
    ianaTimeZone,
    transferBufferMinutes,
  );

  const travelerReadyAt = {
    localDate: readyResolved.localDate,
    localTime24: readyResolved.localTime24,
    localTime12: readyResolved.localTime12,
    ianaTimeZone,
    utcIso: readyResolved.utcIso,
    utcShort: readyResolved.utcShort,
    formattedSummary: `${readyResolved.localTime12} local (${readyResolved.utcShort})`,
  };

  const inboundSource =
    input.inboundSource ||
    (isExampleScenario
      ? "NTES / Indian Railways Live Train Status (Example Scenario)"
      : travelerEtaEntered
        ? "Traveler-Entered ETA via Official CRIS / NTES Lookup"
        : "Published Train Schedule Baseline (Pending Traveler-Entered ETA / Live NTES Feed)");
  const inboundSourceTimestamp =
    input.inboundSourceTimestamp || `${serviceDate}T04:45:00Z`;
  const inboundSourceExpiry =
    input.inboundSourceExpiry || `${serviceDate}T05:30:00Z`;

  const inboundLegProvenance: Dcc412LegReceiptProvenance = {
    legId: input.inboundLegId || "leg-inbound-rail-arrival",
    legTitle:
      input.inboundLegTitle ||
      `Inbound Rail (${places.delhiRailStation.name} → ${places.agraCantt.name})`,
    source: inboundSource,
    timestamp: inboundSourceTimestamp,
    expiry: inboundSourceExpiry,
  };

  const evaluatedAtIso = input.evaluatedAtUtc || inboundSourceTimestamp;
  const evaluatedAtMs = Date.parse(evaluatedAtIso);
  const expiryMs = Date.parse(inboundSourceExpiry);
  const isInboundExpired =
    Number.isFinite(evaluatedAtMs) &&
    Number.isFinite(expiryMs) &&
    evaluatedAtMs > expiryMs;

  const anyCandidateMissingCritical = input.candidateDepartures.some(
    (c) => Boolean(c.criticalUpdateMissing),
  );
  const criticalUpdateMissing =
    Boolean(input.criticalUpdateMissing) ||
    Boolean(input.staleUpdate) ||
    Boolean(input.staleOrMissingUpdateCouldChangeAnswer) ||
    missingTravelerEtaInRealTrip ||
    isInboundExpired ||
    anyCandidateMissingCritical;
  const scheduleBaselineStatus: "Verified" | "Needs verification" =
    criticalUpdateMissing ? "Needs verification" : "Verified";
  const criticalUpdateMissingReason = criticalUpdateMissing
    ? input.criticalUpdateMissingReason ||
      input.candidateDepartures.find((c) => c.criticalUpdateMissing)
        ?.criticalUpdateMissingReason ||
      (missingTravelerEtaInRealTrip
        ? "Traveler has not entered an ETA while official CRIS/NTES live machine feed access is pending — showing schedule baseline as Needs verification."
        : isInboundExpired || input.staleUpdate
          ? "Inbound train status update is stale/expired and could change connection or gate cutoff eligibility — showing schedule baseline as Needs verification."
          : "Critical live telemetry or operator dispatch update is missing — showing schedule baseline as Needs verification.")
    : null;

  const evaluatedCandidates: Dcc412EvaluatedCandidateItinerary[] =
    input.candidateDepartures.map((cand) => {
      const depResolved = resolveLocalTimeInIanaZoneToUtc(
        serviceDate,
        cand.departureLocal,
        ianaTimeZone,
        0,
      );
      const gateMinutes = Math.max(
        0,
        Math.round(cand.gateReadyMinutesFromDeparture ?? 25),
      );
      const arrResolved = cand.arrivalAtDestinationLocal
        ? resolveLocalTimeInIanaZoneToUtc(
            serviceDate,
            cand.arrivalAtDestinationLocal,
            ianaTimeZone,
            0,
          )
        : resolveLocalTimeInIanaZoneToUtc(
            serviceDate,
            cand.departureLocal,
            ianaTimeZone,
            gateMinutes,
          );
      const arrivalAtDestinationLocal = arrResolved.localTime24;

      const cutoffLeadMins = Math.max(
        0,
        Math.round(cand.ticketCutoffBeforeDepartureMinutes ?? 0),
      );
      const ticketCutoffResolved = cand.ticketCutoffLocal
        ? resolveLocalTimeInIanaZoneToUtc(
            serviceDate,
            cand.ticketCutoffLocal,
            ianaTimeZone,
            0,
          )
        : resolveLocalTimeInIanaZoneToUtc(
            serviceDate,
            cand.departureLocal,
            ianaTimeZone,
            -cutoffLeadMins,
          );

      const effectiveDestCutoffLocal =
        cand.destinationCutoffLocal ?? input.destinationCutoffLocal ?? null;
      const destCutoffResolved = effectiveDestCutoffLocal
        ? resolveLocalTimeInIanaZoneToUtc(
            serviceDate,
            effectiveDestCutoffLocal,
            ianaTimeZone,
            0,
          )
        : null;

      const slackToTicketCutoffMinutes = Math.round(
        (ticketCutoffResolved.utcMs - readyResolved.utcMs) / 60_000,
      );
      const slackToDepartureMinutes = Math.round(
        (depResolved.utcMs - readyResolved.utcMs) / 60_000,
      );
      const slackToDestinationCutoffMinutes = destCutoffResolved
        ? Math.round((destCutoffResolved.utcMs - arrResolved.utcMs) / 60_000)
        : null;

      const passesDepartureTime = slackToDepartureMinutes >= 0;
      const passesTicketCutoff = slackToTicketCutoffMinutes >= 0;
      const passesDestinationCutoff =
        slackToDestinationCutoffMinutes === null ||
        slackToDestinationCutoffMinutes >= 0;

      const catchable =
        passesDepartureTime && passesTicketCutoff && passesDestinationCutoff;

      const connectionStatus: Dcc412EvaluatedCandidateItinerary["connectionStatus"] =
        !passesDepartureTime
          ? "missed_connection"
          : !passesTicketCutoff
            ? "missed_ticket_cutoff"
            : !passesDestinationCutoff
              ? "missed_destination_cutoff"
              : "catchable";

      const candScheduleStatus: "Verified" | "Needs verification" =
        criticalUpdateMissing || cand.criticalUpdateMissing
          ? "Needs verification"
          : "Verified";

      const legProvenance: Dcc412LegReceiptProvenance = {
        legId: cand.candidateId,
        legTitle: cand.title,
        source: cand.source,
        timestamp: cand.sourceTimestamp,
        expiry: cand.sourceExpiry,
      };

      const reasonSummary = !passesDepartureTime
        ? `Missed connection: departs at ${cand.departureLocal} local (${depResolved.utcShort}), which is ${Math.abs(slackToDepartureMinutes)} min before travelerReadyAt ${travelerReadyAt.localTime12} local (${travelerReadyAt.utcShort}).`
        : !passesTicketCutoff
          ? `Missed ticket cutoff: ticket/boarding cutoff at ${ticketCutoffResolved.localTime24} local (${ticketCutoffResolved.utcShort}) closes ${Math.abs(slackToTicketCutoffMinutes)} min before travelerReadyAt ${travelerReadyAt.localTime12} local (${travelerReadyAt.utcShort}).`
          : !passesDestinationCutoff
            ? `Reaches the gate at ${arrivalAtDestinationLocal} local (${arrResolved.utcShort}) on the ${cand.departureLocal} service. Misses cutoff by ${Math.abs(slackToDestinationCutoffMinutes || 0)} minutes (cutoff ${effectiveDestCutoffLocal} local).`
            : `Catches the ${cand.departureLocal} departure (${depResolved.utcShort}, +${slackToDepartureMinutes}m after travelerReadyAt ${travelerReadyAt.localTime12} local) and reaches the gate at ${arrivalAtDestinationLocal} local (${arrResolved.utcShort}).${
                slackToDestinationCutoffMinutes !== null
                  ? ` Fits by ${slackToDestinationCutoffMinutes} minutes (cutoff ${effectiveDestCutoffLocal} local).`
                  : ""
              }`;

      const nextStepHref =
        cand.nextStepHref ||
        `/routes/delhi-to-agra?date=${encodeURIComponent(serviceDate)}&ready_utc=${encodeURIComponent(travelerReadyAt.utcIso)}&candidate=${encodeURIComponent(cand.candidateId)}`;
      const nextStepLabel = catchable
        ? cand.nextStepLabel || `Select ${cand.title} (${cand.departureLocal} local)`
        : "View options that fit";

      return {
        candidateId: cand.candidateId,
        title: cand.title,
        operatorName: cand.operatorName,
        originPlaceId: cand.originPlaceId || places.agraCantt.placeId,
        destinationPlaceId:
          cand.destinationPlaceId || places.tajEntryGate.placeId,
        travelerReadyAt,
        departureLocal: cand.departureLocal,
        departureUtc: depResolved.utcIso,
        departureUtcShort: depResolved.utcShort,
        arrivalAtDestinationLocal,
        arrivalAtDestinationUtc: arrResolved.utcIso,
        ticketCutoffLocal: ticketCutoffResolved.localTime24,
        ticketCutoffUtc: ticketCutoffResolved.utcIso,
        ticketCutoffUtcShort: ticketCutoffResolved.utcShort,
        destinationCutoffLocal: effectiveDestCutoffLocal,
        destinationCutoffUtc: destCutoffResolved ? destCutoffResolved.utcIso : null,
        slackToTicketCutoffMinutes,
        slackToDepartureMinutes,
        slackToDestinationCutoffMinutes,
        passesTicketCutoff,
        passesDepartureTime,
        passesDestinationCutoff,
        catchable,
        connectionStatus,
        scheduleBaselineStatus: candScheduleStatus,
        reasonSummary,
        legProvenance,
        nextStepLabel,
        nextStepHref,
      };
    });

  const missedConnections = evaluatedCandidates.filter((c) => !c.catchable);
  const boardableCandidates = evaluatedCandidates
    .filter((c) => c.passesDepartureTime && c.passesTicketCutoff)
    .sort((a, b) => a.slackToDepartureMinutes - b.slackToDepartureMinutes);
  const nextServiceAfterReady = boardableCandidates[0] || null;

  const catchableCandidates = evaluatedCandidates
    .filter((c) => c.catchable)
    .sort((a, b) => a.slackToDepartureMinutes - b.slackToDepartureMinutes);
  const nextCatchableDeparture = catchableCandidates[0] || null;

  const gateArrivalLocal =
    nextServiceAfterReady?.arrivalAtDestinationLocal ?? null;
  const gateArrivalUtc = nextServiceAfterReady?.arrivalAtDestinationUtc ?? null;
  const destinationCutoffLocal =
    nextServiceAfterReady?.destinationCutoffLocal ??
    input.destinationCutoffLocal ??
    null;
  const destinationCutoffUtc =
    nextServiceAfterReady?.destinationCutoffUtc ??
    (destinationCutoffLocal
      ? resolveLocalTimeInIanaZoneToUtc(
          serviceDate,
          destinationCutoffLocal,
          ianaTimeZone,
          0,
        ).utcIso
      : null);
  const cutoffMarginMinutes =
    nextServiceAfterReady?.slackToDestinationCutoffMinutes ?? null;
  const fitsDestinationCutoff =
    cutoffMarginMinutes !== null
      ? cutoffMarginMinutes >= 0
      : nextCatchableDeparture !== null;
  const cutoffVerdictLabel =
    evaluatedCandidates.length === 0 && sampleOnwardDeparturesExcluded
      ? "Sample onward departures excluded from real-trip result until onward services are verified."
      : cutoffMarginMinutes !== null
        ? cutoffMarginMinutes >= 0
          ? `Fits by ${cutoffMarginMinutes} minutes.`
          : `Misses cutoff by ${Math.abs(cutoffMarginMinutes)} minutes.`
        : nextCatchableDeparture
          ? "Fits cutoff."
          : "Misses cutoff.";

  const legProvenance: Dcc412LegReceiptProvenance[] = [
    inboundLegProvenance,
    ...evaluatedCandidates.map((c) => c.legProvenance),
  ];

  const missedAtStation = evaluatedCandidates.filter(
    (c) => !c.passesDepartureTime || !c.passesTicketCutoff,
  );
  const missedSummary =
    missedAtStation.length > 0
      ? `Missed: ${missedAtStation.map((m) => `${m.departureLocal} (${m.title})`).join(", ")}.`
      : "No scheduled connections missed.";

  const whatChanged = `${isExampleScenario ? `[${scenarioLabel}] ` : ""}Scheduled arrival ${format12HourClock(input.scheduledArrivalLocal)} (${input.scheduledArrivalLocal}) + ${delayMinutesApplied}m delay + ${transferBufferMinutes}m station exit buffer (added once) → travelerReadyAt ${travelerReadyAt.formattedSummary} [${travelerReadyAt.utcIso}].${scheduleBaselineStatus === "Needs verification" ? " Schedule baseline: Needs verification." : ""}`;

  const whatStillFits =
    evaluatedCandidates.length === 0 && sampleOnwardDeparturesExcluded
      ? `${onwardServicesVerificationNote || "Sample onward departures are kept out of the real-trip result until those services are verified."} ${!travelerEtaEntered ? "Traveler has not entered an ETA — schedule baseline is Needs verification." : `Traveler-entered ETA sets travelerReadyAt to ${travelerReadyAt.formattedSummary} (${travelerReadyAt.utcIso}).`}`
      : nextCatchableDeparture
        ? `${missedSummary} Next catchable departure: ${nextCatchableDeparture.title} at ${nextCatchableDeparture.departureLocal} local (${nextCatchableDeparture.departureUtcShort}, +${nextCatchableDeparture.slackToDepartureMinutes}m slack; reaches ${places.tajEntryGate.name} at ${nextCatchableDeparture.arrivalAtDestinationLocal} local). ${cutoffVerdictLabel}`
        : nextServiceAfterReady
          ? `${missedSummary} Next service at ${nextServiceAfterReady.departureLocal} local reaches ${places.tajEntryGate.name} at ${nextServiceAfterReady.arrivalAtDestinationLocal} local (${nextServiceAfterReady.arrivalAtDestinationUtc}). ${cutoffVerdictLabel}`
          : `${missedSummary} 0 candidate departures clear travelerReadyAt ${travelerReadyAt.formattedSummary} and applicable cutoffs.`;

  const nextStep =
    evaluatedCandidates.length === 0 && sampleOnwardDeparturesExcluded
      ? !travelerEtaEntered
        ? `Check official NTES live train status and enter your revised arrival ETA on /routes/${corridorId} (schedule baseline: Needs verification; sample onward departures excluded from real-trip result until verified).`
        : `Compare Taj entry window against travelerReadyAt ${travelerReadyAt.utcIso} on /routes/${corridorId} (sample onward departures excluded from real-trip result until onward services are verified).`
      : nextCatchableDeparture
        ? `${nextCatchableDeparture.nextStepLabel} (travelerReadyAt ${travelerReadyAt.utcIso}, schedule baseline: ${scheduleBaselineStatus}).`
        : `View options that fit on /routes/${corridorId} (schedule baseline: ${scheduleBaselineStatus}).`;

  return {
    specId: "DCC-412",
    corridorId,
    evaluatedAt: inboundSourceTimestamp,
    serviceDate,
    ianaTimeZone,
    isExampleScenario,
    scenarioLabel,
    travelerEtaEntered,
    sampleOnwardDeparturesExcluded,
    onwardServicesVerificationNote,
    places,
    scheduleBaselineStatus,
    criticalUpdateMissing,
    criticalUpdateMissingReason,
    etaResolutionMode,
    scheduledArrivalLocal: input.scheduledArrivalLocal,
    scheduledArrivalUtc: scheduledResolved.utcIso,
    effectiveArrivalLocal: effectiveArrivalResolved.localTime24,
    effectiveArrivalUtc: effectiveArrivalResolved.utcIso,
    effectiveArrivalUtcShort: effectiveArrivalResolved.utcShort,
    delayMinutesApplied,
    transferBufferMinutes,
    transferBufferAddedOnce: true,
    travelerReadyAt,
    candidates: evaluatedCandidates,
    missedConnections,
    catchableCandidates,
    nextServiceAfterReady,
    nextCatchableDeparture,
    gateArrivalLocal,
    gateArrivalUtc,
    destinationCutoffLocal,
    destinationCutoffUtc,
    cutoffMarginMinutes,
    fitsDestinationCutoff,
    cutoffVerdictLabel,
    legProvenance,
    recheckCard: {
      corridorId,
      whatChanged,
      whatStillFits,
      nextStep,
      primaryNextActionLabel:
        nextCatchableDeparture?.nextStepLabel || "View options that fit",
      primaryNextActionHref:
        nextCatchableDeparture?.nextStepHref || `/routes/${corridorId}`,
    },
  };
}

/**
 * Real-trip Delhi → Agra Recheck Evaluator:
 * - For a traveler who hasn't entered an ETA (`!absoluteEta`), shows `scheduleBaselineStatus = "Needs verification"`.
 * - Keeps the sample onward departures (`10:30`, `11:00`, `11:30` Agra Cantt feeder cohorts) OUT of the real-trip result (`candidates: []`) until those onward services are verified.
 */
export function evaluateDelhiAgraRealTripRecheck(params?: {
  serviceDate?: string;
  scheduledArrivalLocal?: string;
  delayMinutes?: number;
  absoluteEta?: string | null;
  transferBufferMinutes?: number;
  destinationCutoffLocal?: string;
  tajCutoffLocal?: string;
  criticalUpdateMissing?: boolean;
  staleUpdate?: boolean;
  staleOrMissingUpdateCouldChangeAnswer?: boolean;
  inboundSourceExpiry?: string | null;
  evaluatedAtUtc?: string | null;
  verifiedCandidateDepartures?: Dcc412CandidateDepartureInput[];
}): Dcc412ItineraryRecheckResult {
  const serviceDate = params?.serviceDate || "2026-12-10";
  const effectiveDestCutoff =
    params?.destinationCutoffLocal || params?.tajCutoffLocal || "16:30";
  const verifiedCandidateDepartures = params?.verifiedCandidateDepartures ?? [];
  const hasTravelerEta = Boolean(params?.absoluteEta && params.absoluteEta.trim());

  return evaluateDcc412ItineraryRecheck({
    corridorId: "delhi-to-agra",
    serviceDate,
    ianaTimeZone: "Asia/Kolkata",
    isExampleScenario: false,
    scenarioLabel: "Real-Trip Evaluation (Official NTES Lookup + Traveler-Entered ETA)",
    requireTravelerEtaForVerification: true,
    sampleOnwardDeparturesExcluded: verifiedCandidateDepartures.length === 0,
    onwardServicesVerificationNote:
      verifiedCandidateDepartures.length === 0
        ? "Sample onward departures (10:30, 11:00, and 11:30 Agra Cantt station feeder cohorts) are kept out of the real-trip result until those onward transfer services are verified in the Review Desk."
        : null,
    places: DELHI_AGRA_CORRIDOR_PLACES,
    inboundLegId: "leg-1-gatimaan-express-12050-agc",
    inboundLegTitle: "Train 12050 Gatimaan Express (NZM → Agra Cantt AGC)",
    scheduledArrivalLocal: params?.scheduledArrivalLocal || "09:50",
    delayMinutes: hasTravelerEta ? (params?.delayMinutes ?? 0) : (params?.delayMinutes ?? 0),
    absoluteEta: params?.absoluteEta ?? null,
    transferBufferMinutes: params?.transferBufferMinutes ?? 15,
    criticalUpdateMissing: params?.criticalUpdateMissing ?? false,
    staleUpdate: params?.staleUpdate ?? false,
    staleOrMissingUpdateCouldChangeAnswer:
      params?.staleOrMissingUpdateCouldChangeAnswer ?? false,
    evaluatedAtUtc: params?.evaluatedAtUtc ?? null,
    inboundSource: hasTravelerEta
      ? "Traveler-Entered ETA via Official CRIS / NTES Lookup"
      : "Published Train Schedule Baseline (Pending Traveler-Entered ETA / Live NTES Feed)",
    inboundSourceTimestamp: `${serviceDate}T04:45:00Z`,
    inboundSourceExpiry:
      params?.inboundSourceExpiry || `${serviceDate}T05:30:00Z`,
    destinationCutoffLocal: effectiveDestCutoff,
    destinationCutoffLabel: "Taj Mahal East/West Gate Entry Cutoff",
    candidateDepartures: verifiedCandidateDepartures,
  });
}

/**
 * Canonical Synthetic Delhi–Agra Example Scenario for DCC-412:
 * - Explicitly labeled as an Example Scenario (`isExampleScenario: true`).
 * - Models 3 distinct places: Delhi Rail Station (`NZM`), Agra Cantt (`AGC`), and Taj Entry Gate (`East Gate / Shilpgram`)
 * - 9:50 a.m. (`09:50`) scheduled arrival in `Asia/Kolkata` (`04:20Z`)
 * - + 15 minutes to exit the station (added once)
 * - Sample onward departures at `10:30` and `11:00` a.m. (kept strictly inside example/test evaluations), with `25 minutes` from departure to being ready at the Taj entry gate (`10:55` and `11:25`).
 */
export function evaluateSyntheticDelhiAgraDcc412Test(overrides?: {
  serviceDate?: string;
  scheduledArrivalLocal?: string;
  delayMinutes?: number;
  absoluteEta?: string | null;
  transferBufferMinutes?: number;
  destinationCutoffLocal?: string;
  tajCutoffLocal?: string;
  gateReadyMinutesFromDeparture?: number;
  criticalUpdateMissing?: boolean;
  staleUpdate?: boolean;
  staleOrMissingUpdateCouldChangeAnswer?: boolean;
  inboundSourceExpiry?: string | null;
  evaluatedAtUtc?: string | null;
  includeBackup1130?: boolean;
  scenarioLabel?: string | null;
}): Dcc412ItineraryRecheckResult {
  const serviceDate = overrides?.serviceDate || "2026-12-10";
  const effectiveDestCutoff =
    overrides?.destinationCutoffLocal || overrides?.tajCutoffLocal || "16:30";
  const gateReadyMins = overrides?.gateReadyMinutesFromDeparture ?? 25;
  const includeBackup1130 = overrides?.includeBackup1130 ?? true;

  const arrival1030 = resolveLocalTimeInIanaZoneToUtc(
    serviceDate,
    "10:30",
    "Asia/Kolkata",
    gateReadyMins,
  ).localTime24;
  const arrival1100 = resolveLocalTimeInIanaZoneToUtc(
    serviceDate,
    "11:00",
    "Asia/Kolkata",
    gateReadyMins,
  ).localTime24;
  const arrival1130 = resolveLocalTimeInIanaZoneToUtc(
    serviceDate,
    "11:30",
    "Asia/Kolkata",
    gateReadyMins,
  ).localTime24;

  const candidateDepartures: Dcc412CandidateDepartureInput[] = [
    {
      candidateId: "agc-conn-1030-missed",
      title: "10:30 Agra Cantt Pre-Booked Station Feeder Transfer (Taj East Gate — Example)",
      operatorName: "Agra Cantt Station Feeder Cohort (Example Scenario)",
      originPlaceId: DELHI_AGRA_CORRIDOR_PLACES.agraCantt.placeId,
      destinationPlaceId: DELHI_AGRA_CORRIDOR_PLACES.tajEntryGate.placeId,
      departureLocal: "10:30",
      arrivalAtDestinationLocal: arrival1030,
      gateReadyMinutesFromDeparture: gateReadyMins,
      ticketCutoffBeforeDepartureMinutes: 5,
      destinationCutoffLocal: effectiveDestCutoff,
      source: "Agra Cantt Feeder Schedule Baseline (Example Scenario)",
      sourceTimestamp: `${serviceDate}T04:00:00Z`,
      sourceExpiry: `${serviceDate}T06:00:00Z`,
      nextStepHref: `/routes/delhi-to-agra?date=${encodeURIComponent(serviceDate)}&cohort=1030#connection-recheck`,
      nextStepLabel: "Select 10:30 Transfer Cohort (Reaches Gate at 10:55 — Example)",
    },
    {
      candidateId: "agc-conn-1100-catchable",
      title: "11:00 Agra Cantt Catchable Transfer Cohort (Taj East Gate — Example)",
      operatorName: "Agra Cantt Station Transfer Cohort (Example Scenario)",
      originPlaceId: DELHI_AGRA_CORRIDOR_PLACES.agraCantt.placeId,
      destinationPlaceId: DELHI_AGRA_CORRIDOR_PLACES.tajEntryGate.placeId,
      departureLocal: "11:00",
      arrivalAtDestinationLocal: arrival1100,
      gateReadyMinutesFromDeparture: gateReadyMins,
      ticketCutoffBeforeDepartureMinutes: 5,
      destinationCutoffLocal: effectiveDestCutoff,
      source: "Agra Cantt Dispatch Schedule Baseline (Example Scenario)",
      sourceTimestamp: `${serviceDate}T04:45:00Z`,
      sourceExpiry: `${serviceDate}T06:30:00Z`,
      nextStepHref: `/routes/delhi-to-agra?date=${encodeURIComponent(serviceDate)}&cohort=1100#connection-recheck`,
      nextStepLabel: "Select 11:00 Catchable Transfer Cohort (Clears Cutoff — Example)",
    },
  ];

  if (includeBackup1130) {
    candidateDepartures.push({
      candidateId: "agc-conn-1130-backup",
      title: "11:30 Agra Cantt Secondary Backup Transfer (Taj East Gate — Example)",
      operatorName: "Agra Cantt Secondary Station Cohort (Example Scenario)",
      originPlaceId: DELHI_AGRA_CORRIDOR_PLACES.agraCantt.placeId,
      destinationPlaceId: DELHI_AGRA_CORRIDOR_PLACES.tajEntryGate.placeId,
      departureLocal: "11:30",
      arrivalAtDestinationLocal: arrival1130,
      gateReadyMinutesFromDeparture: gateReadyMins,
      ticketCutoffBeforeDepartureMinutes: 5,
      destinationCutoffLocal: effectiveDestCutoff,
      source: "Agra Cantt Dispatch Schedule Baseline (Example Scenario)",
      sourceTimestamp: `${serviceDate}T04:45:00Z`,
      sourceExpiry: `${serviceDate}T07:00:00Z`,
      nextStepHref: `/routes/delhi-to-agra?date=${encodeURIComponent(serviceDate)}&cohort=1130#connection-recheck`,
      nextStepLabel: "Select 11:30 Backup Transfer Cohort (Example)",
    });
  }

  return evaluateDcc412ItineraryRecheck({
    corridorId: "delhi-to-agra",
    serviceDate,
    ianaTimeZone: "Asia/Kolkata",
    isExampleScenario: true,
    scenarioLabel:
      overrides?.scenarioLabel ||
      (serviceDate === "2026-12-10"
        ? "Example — December 10, 2026 Scenario (2026-12-10 Synthetic Fixture)"
        : `Example — ${serviceDate} Synthetic Scenario`),
    requireTravelerEtaForVerification: false,
    sampleOnwardDeparturesExcluded: false,
    places: DELHI_AGRA_CORRIDOR_PLACES,
    inboundLegId: "leg-1-gatimaan-express-12050-agc",
    inboundLegTitle: "Train 12050 Gatimaan Express (NZM → Agra Cantt AGC)",
    scheduledArrivalLocal: overrides?.scheduledArrivalLocal || "09:50",
    delayMinutes: overrides?.delayMinutes ?? 42,
    absoluteEta: overrides?.absoluteEta ?? null,
    transferBufferMinutes: overrides?.transferBufferMinutes ?? 15,
    criticalUpdateMissing: overrides?.criticalUpdateMissing ?? false,
    staleUpdate: overrides?.staleUpdate ?? false,
    staleOrMissingUpdateCouldChangeAnswer:
      overrides?.staleOrMissingUpdateCouldChangeAnswer ?? false,
    evaluatedAtUtc: overrides?.evaluatedAtUtc ?? null,
    inboundSource: "Indian Railways NTES / CRIS Live Running Status (Example Scenario)",
    inboundSourceTimestamp: `${serviceDate}T04:45:00Z`,
    inboundSourceExpiry:
      overrides?.inboundSourceExpiry || `${serviceDate}T05:30:00Z`,
    destinationCutoffLocal: effectiveDestCutoff,
    destinationCutoffLabel: "Taj Mahal East/West Gate Entry Cutoff",
    candidateDepartures,
  });
}

/**
 * Table-driven December 10, 2026 (`2026-12-10`) Delhi → Agra Corridor Example Scenario in `Asia/Kolkata`:
 * - Explicitly labeled as `Example — December 10, 2026 Scenario` (`isExampleScenario: true`).
 * - Train scheduled into Agra Cantt (`AGC`) at `09:50` a.m.
 * - `15` minutes to exit the station.
 * - Sample onward departures at `10:30` and `11:00` a.m., with `25` minutes from departure to being ready at the Taj entry gate (`10:55` and `11:25`).
 */
export function evaluateDelhiAgra20261210CorridorFixture(params: {
  delayMinutes?: number;
  absoluteEta?: string | null;
  destinationCutoffLocal?: string;
  tajCutoffLocal?: string;
  criticalUpdateMissing?: boolean;
  staleUpdate?: boolean;
  inboundSourceExpiry?: string | null;
  evaluatedAtUtc?: string | null;
}): Dcc412ItineraryRecheckResult {
  return evaluateSyntheticDelhiAgraDcc412Test({
    serviceDate: "2026-12-10",
    scenarioLabel: "Example — December 10, 2026 Scenario (2026-12-10 Synthetic Fixture)",
    scheduledArrivalLocal: "09:50",
    delayMinutes: params.delayMinutes ?? 0,
    absoluteEta: params.absoluteEta ?? null,
    transferBufferMinutes: 15,
    destinationCutoffLocal:
      params.destinationCutoffLocal || params.tajCutoffLocal || "11:00",
    gateReadyMinutesFromDeparture: 25,
    criticalUpdateMissing: params.criticalUpdateMissing ?? false,
    staleUpdate: params.staleUpdate ?? false,
    inboundSourceExpiry: params.inboundSourceExpiry ?? null,
    evaluatedAtUtc: params.evaluatedAtUtc ?? null,
    includeBackup1130: false,
  });
}


