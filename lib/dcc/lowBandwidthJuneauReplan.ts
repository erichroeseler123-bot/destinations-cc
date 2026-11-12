import {
  CLAA_JUNEAU_PORT_SCHEDULE,
  type CruiseTimingEvaluationResult,
  type JuneauBerthCode,
} from "@/lib/dcc/cruiseTimingGate";
import type { JuneauBackupFlowContext } from "@/lib/dcc/dockRolloutContext";
import {
  evaluateUnifiedJuneauTripRecheckSync,
  type CompactTripRecheckCardModel,
  type JuneauTideTelemetryState,
  type UnifiedJuneauOptionRecheck,
} from "@/lib/dcc/sharedTripRecheck";

export const LOW_BANDWIDTH_JUNEAU_COMPRESSED_TARGET_BYTES = 50 * 1024; // 50 KB compressed first-load target
export const LOW_BANDWIDTH_JUNEAU_OFFLINE_STORAGE_KEY =
  "dcc_juneau_offline_plan_v1";
export const JUNEAU_LOW_BW_OFFLINE_STORAGE_KEY =
  LOW_BANDWIDTH_JUNEAU_OFFLINE_STORAGE_KEY;
export type LowBandwidthJuneauBerth = JuneauBerthCode;

export interface LowBandwidthJuneauInput {
  ship: string;
  date: string;
  arrivalTime: string;
  claaScheduledArrivalTime?: string;
  allAboardTime: string;
  berth: JuneauBerthCode;
  berthCode?: JuneauBerthCode;
  partySize: number;
  flightCanceled: boolean;
  cancelRef: string | null;
  dccContextId: string | null;
  operatorConfirmedTideLimitFt?: number | null;
  simulateNoaaTimeout?: boolean;
}

export interface LowBandwidthJuneauOptionResult {
  optionId: string;
  engineOptionId: string;
  title: string;
  categoryLabel: string;
  durationMinutes: number;
  durationLabel: string;
  priceFromLabel: string;
  viatorProductCode: string | null;
  weatherResilienceLabel: string;
  requiresClearCeiling: boolean;
  fitsNow: boolean;
  deprioritizedByFlightCancel: boolean;
  remainingMinutesAfterBuffer: number;
  operatingStatus: UnifiedJuneauOptionRecheck["operatingStatus"];
  seatAvailability: UnifiedJuneauOptionRecheck["seatAvailability"];
  tideGate: UnifiedJuneauOptionRecheck["tideGate"];
  evaluatedDepartures: UnifiedJuneauOptionRecheck["evaluatedDepartures"];
  evaluatedOffers: UnifiedJuneauOptionRecheck["evaluatedOffers"];
  tripVerdictBeforeCheckout: UnifiedJuneauOptionRecheck["tripVerdictBeforeCheckout"];
  timing: CruiseTimingEvaluationResult;
  flightDeckInterest:
    | "helicopter"
    | "dogsled"
    | "whale-watching"
    | "weather-backup"
    | "compare-operators";
  handoffHref: string;
  flightDeckHandoffAllowed: boolean;
  allowedNextStepType: "continue_to_flight_deck" | "view_options_that_fit";
  allowedNextStepLabel: string;
  allowedNextStepHref: string;
  directDestinationPreviewUrl: string;
}

export interface LowBandwidthJuneauPlanEvaluation {
  checkedAtIso: string;
  calculationEngine: "evaluateJuneauPortDayScenario";
  compressedTargetBytes: number;
  offlinePolicyNote: string;
  input: LowBandwidthJuneauInput;
  availablePortMinutes: number | null;
  timeWindowParam: string;
  tides: JuneauTideTelemetryState;
  recheckCard: CompactTripRecheckCardModel;
  backupFlow: JuneauBackupFlowContext;
  summaryHeadline: string;
  summaryDetail: string;
  primaryHandoffHref: string;
  primaryHandoffLabel: string;
  options: LowBandwidthJuneauOptionResult[];
}

function firstString(
  val: string | string[] | undefined | null,
): string | undefined {
  if (Array.isArray(val)) return val[0];
  return typeof val === "string" ? val : undefined;
}

export function parseLowBandwidthJuneauInput(
  raw?: Record<string, string | string[] | undefined> | URLSearchParams,
): LowBandwidthJuneauInput {
  const getParam = (key: string): string | undefined => {
    if (!raw) return undefined;
    if (raw instanceof URLSearchParams) {
      return raw.get(key) ?? undefined;
    }
    return firstString(raw[key]);
  };

  const shipParam = (
    getParam("ship") ||
    getParam("cruise_ship") ||
    "Royal Princess"
  ).trim();

  const matchedClaa = CLAA_JUNEAU_PORT_SCHEDULE.find(
    (entry) =>
      entry.scheduleId.toLowerCase() === shipParam.toLowerCase() ||
      entry.shipName.toLowerCase() === shipParam.toLowerCase(),
  );

  const rawDate = (
    getParam("date") ||
    getParam("port_date") ||
    matchedClaa?.serviceDate ||
    "2026-04-24"
  ).trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : "2026-04-24";

  const rawArrival = (
    getParam("arrival") ||
    getParam("claa_arrival") ||
    getParam("shipArrivalTime") ||
    matchedClaa?.claaArrivalLocal ||
    "08:00"
  ).trim();
  const arrivalTime = /^\d{1,2}:\d{2}$/.test(rawArrival) ? rawArrival : "08:00";

  const explicitAllAboard =
    getParam("all_aboard") ??
    getParam("allAboard") ??
    getParam("allAboardTime");
  const allAboardTime =
    explicitAllAboard !== undefined
      ? explicitAllAboard.trim()
      : matchedClaa
        ? matchedClaa.confirmedAllAboardLocal || ""
        : "16:30";

  const rawBerth = (
    getParam("berth") ||
    getParam("dock") ||
    matchedClaa?.berthCode ||
    "FKL"
  )
    .trim()
    .toUpperCase();

  const validBerths: JuneauBerthCode[] = [
    "CT",
    "FKL",
    "AS",
    "AJ",
    "ACT",
    "TENDER",
    "UNKNOWN",
  ];
  const berth: JuneauBerthCode = validBerths.includes(rawBerth as JuneauBerthCode)
    ? (rawBerth as JuneauBerthCode)
    : "UNKNOWN";

  const rawParty = Number(
    getParam("party_size") ||
      getParam("partySize") ||
      getParam("passengers") ||
      getParam("travelers") ||
      2,
  );
  const partySize =
    Number.isFinite(rawParty) && rawParty >= 1 && rawParty <= 18
      ? Math.round(rawParty)
      : 2;

  const rawCanceled = (
    getParam("flight_canceled") ||
    getParam("flightCanceled") ||
    ""
  )
    .trim()
    .toLowerCase();
  const cancelRefRaw = (getParam("cancel_ref") || "").trim();
  const cancelRef = cancelRefRaw.length > 0 ? cancelRefRaw : null;
  const flightCanceled =
    Boolean(cancelRef) ||
    rawCanceled === "1" ||
    rawCanceled === "true" ||
    rawCanceled === "yes" ||
    getParam("interest") === "weather-backup";

  const ctxRaw = (getParam("ctx") || getParam("dcc_ctx") || "").trim();
  const dccContextId = ctxRaw.length > 0 ? ctxRaw : null;

  const rawTideLimit = getParam("tide_limit_ft") || getParam("operatorConfirmedTideLimitFt");
  const operatorConfirmedTideLimitFt =
    rawTideLimit !== undefined && rawTideLimit !== "" && Number.isFinite(Number(rawTideLimit))
      ? Number(rawTideLimit)
      : null;

  const rawTimeout = (getParam("simulate_noaa_timeout") || "").trim().toLowerCase();
  const simulateNoaaTimeout = rawTimeout === "1" || rawTimeout === "true";

  return {
    ship: matchedClaa ? matchedClaa.shipName : shipParam || "Custom Ship",
    date,
    arrivalTime,
    allAboardTime,
    berth,
    partySize,
    flightCanceled,
    cancelRef,
    dccContextId,
    operatorConfirmedTideLimitFt,
    simulateNoaaTimeout,
  };
}

export function buildJuneauFlightDeckReplanHandoffUrl(params: {
  input: LowBandwidthJuneauInput;
  interest:
    | "helicopter"
    | "dogsled"
    | "whale-watching"
    | "weather-backup"
    | "compare-operators";
  optionId?: string;
  timeWindowParam: string;
}): string {
  const qs = new URLSearchParams();
  qs.set("date", params.input.date);
  qs.set("party_size", String(params.input.partySize));
  qs.set("ship", params.input.ship);
  qs.set("berth", params.input.berth);
  qs.set("claa_arrival", params.input.arrivalTime);
  if (params.input.allAboardTime) {
    qs.set("all_aboard", params.input.allAboardTime);
  }
  qs.set("time_window", params.timeWindowParam);
  qs.set("interest", params.interest);
  if (params.optionId) {
    qs.set("option_id", params.optionId);
  }
  if (params.input.flightCanceled) {
    qs.set("flight_canceled", "1");
  }
  if (params.input.cancelRef) {
    qs.set("cancel_ref", params.input.cancelRef);
  }
  if (params.input.dccContextId) {
    qs.set("ctx", params.input.dccContextId);
  }
  qs.set("low_bw", "1");
  qs.set(
    "dcc_handoff_id",
    `jnu_replan_${params.input.date.replace(/-/g, "")}_${params.interest}`,
  );
  return `/go/dcc-to-juneau-flight-deck?${qs.toString()}`;
}

/**
 * Evaluates the low-bandwidth Juneau replanner using the ONE unified calculation
 * (`evaluateJuneauPortDayScenario` via `evaluateUnifiedJuneauTripRecheckSync`).
 */
export function evaluateLowBandwidthJuneauReplan(
  rawInput?:
    | Partial<LowBandwidthJuneauInput>
    | Record<string, string | string[] | undefined>
    | URLSearchParams,
  options?: { checkedAtIso?: string },
): LowBandwidthJuneauPlanEvaluation {
  const input: LowBandwidthJuneauInput =
    rawInput &&
    !(rawInput instanceof URLSearchParams) &&
    typeof (rawInput as Partial<LowBandwidthJuneauInput>).arrivalTime ===
      "string" &&
    typeof (rawInput as Partial<LowBandwidthJuneauInput>).partySize === "number"
      ? {
          ship: (rawInput as Partial<LowBandwidthJuneauInput>).ship || "Royal Princess",
          date: (rawInput as Partial<LowBandwidthJuneauInput>).date || "2026-04-24",
          arrivalTime:
            (rawInput as Partial<LowBandwidthJuneauInput>).arrivalTime || "08:00",
          allAboardTime:
            (rawInput as Partial<LowBandwidthJuneauInput>).allAboardTime ?? "16:30",
          berth:
            (rawInput as Partial<LowBandwidthJuneauInput>).berth ||
            (rawInput as Partial<LowBandwidthJuneauInput>).berthCode ||
            "FKL",
          partySize: (rawInput as Partial<LowBandwidthJuneauInput>).partySize || 2,
          flightCanceled: Boolean(
            (rawInput as Partial<LowBandwidthJuneauInput>).flightCanceled,
          ),
          cancelRef:
            (rawInput as Partial<LowBandwidthJuneauInput>).cancelRef ?? null,
          dccContextId:
            (rawInput as Partial<LowBandwidthJuneauInput>).dccContextId ?? null,
          operatorConfirmedTideLimitFt:
            (rawInput as Partial<LowBandwidthJuneauInput>)
              .operatorConfirmedTideLimitFt ?? null,
          simulateNoaaTimeout: Boolean(
            (rawInput as Partial<LowBandwidthJuneauInput>).simulateNoaaTimeout,
          ),
        }
      : parseLowBandwidthJuneauInput(
          rawInput as
            | Record<string, string | string[] | undefined>
            | URLSearchParams
            | undefined,
        );

  const unified = evaluateUnifiedJuneauTripRecheckSync({
    ship: input.ship,
    date: input.date,
    arrivalTime: input.arrivalTime,
    allAboardTime: input.allAboardTime,
    berth: input.berth,
    partySize: input.partySize,
    flightCanceled: input.flightCanceled,
    cancelRef: input.cancelRef,
    dccContextId: input.dccContextId,
    operatorConfirmedTideLimitFt: input.operatorConfirmedTideLimitFt,
    simulateNoaaTimeout: input.simulateNoaaTimeout,
    checkedAtIso: options?.checkedAtIso,
  });

  const evaluatedOptions: LowBandwidthJuneauOptionResult[] = unified.options.map(
    (uOpt) => {
      const statusMap: CruiseTimingEvaluationResult["status"] =
        uOpt.timeFit.status === "confirm_ship_timing"
          ? "CONFIRM_SHIP_TIMING"
          : uOpt.timeFit.fitsTimeWindow
            ? "FITS_CRUISE_WINDOW"
            : "OUTSIDE_CRUISE_WINDOW";

      const durationMinutes =
        uOpt.timeFit.checkInMinutes +
        uOpt.timeFit.outboundTransferMinutes +
        uOpt.timeFit.activityDurationMinutes +
        uOpt.timeFit.interActivityTransferMinutes +
        uOpt.timeFit.returnTransferMinutes;

      const marginBeforeAllAboardMinutes =
        uOpt.timeFit.confirmedAllAboardLocal !== null
          ? uOpt.timeFit.remainingMinutesAfterBuffer +
            uOpt.timeFit.configuredReturnBufferMinutes
          : null;

      const exactRemainingBufferHms =
        marginBeforeAllAboardMinutes !== null
          ? (() => {
              const safeSec = Math.max(0, Math.round(marginBeforeAllAboardMinutes * 60));
              const h = Math.floor(safeSec / 3600);
              const m = Math.floor((safeSec % 3600) / 60);
              const s = safeSec % 60;
              return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
            })()
          : null;

      const timing: CruiseTimingEvaluationResult = {
        status: statusMap,
        statusBadgeLabel:
          statusMap === "CONFIRM_SHIP_TIMING"
            ? "Confirm ship timing"
            : statusMap === "FITS_CRUISE_WINDOW"
              ? "Fits cruise window"
              : "Outside safe buffer",
        dccBufferMinutes: uOpt.timeFit.configuredReturnBufferMinutes,
        earliestCheckInLocal: uOpt.timeFit.earliestShoreReadyLocal,
        estimatedGangwayReturnLocal: uOpt.timeFit.estimatedBackAtDockLocal,
        latestSafeGangwayReturnLocal: uOpt.timeFit.targetAllAboardBufferCutoffLocal,
        confirmedAllAboardLocal: uOpt.timeFit.confirmedAllAboardLocal,
        marginBeforeAllAboardMinutes,
        exactRemainingBufferHms,
        reason: uOpt.timeFit.reasonSummary,
        seatCountDisplay:
          uOpt.seatAvailability.confirmedSeatsCount !== null
            ? `${uOpt.seatAvailability.confirmedSeatsCount} seats confirmed by provider`
            : null,
      };

      return {
        optionId: uOpt.legacyReplanId,
        engineOptionId: uOpt.optionId,
        title: uOpt.title,
        categoryLabel: uOpt.categoryLabel,
        durationMinutes,
        durationLabel: `${(durationMinutes / 60).toFixed(1)} hrs dock-to-dock (${uOpt.timeFit.activityDurationMinutes}m activity + transfers/check-in)`,
        priceFromLabel: uOpt.priceFromLabel,
        viatorProductCode: uOpt.viatorProductCode,
        weatherResilienceLabel: uOpt.weatherResilienceLabel,
        requiresClearCeiling: uOpt.weatherCeilingSensitive,
        fitsNow: uOpt.fitsOverallForSelection,
        deprioritizedByFlightCancel:
          uOpt.operatingStatus.status ===
          "paused_traveler_or_operator_flight_canceled",
        remainingMinutesAfterBuffer: uOpt.timeFit.remainingMinutesAfterBuffer,
        operatingStatus: uOpt.operatingStatus,
        seatAvailability: uOpt.seatAvailability,
        tideGate: uOpt.tideGate,
        evaluatedDepartures: uOpt.evaluatedDepartures,
        evaluatedOffers: uOpt.evaluatedOffers,
        tripVerdictBeforeCheckout: uOpt.tripVerdictBeforeCheckout,
        timing,
        flightDeckInterest: uOpt.flightDeckInterest,
        handoffHref: uOpt.handoffHref,
        flightDeckHandoffAllowed: uOpt.flightDeckHandoffAllowed,
        allowedNextStepType: uOpt.allowedNextStepType,
        allowedNextStepLabel: uOpt.allowedNextStepLabel,
        allowedNextStepHref: uOpt.allowedNextStepHref,
        directDestinationPreviewUrl: uOpt.directBookingOrQuoteUrl,
      };
    },
  );

  const fittingCount = evaluatedOptions.filter((o) => o.fitsNow).length;
  const needsTimingConfirm = evaluatedOptions.some(
    (o) => o.timing.status === "CONFIRM_SHIP_TIMING",
  );

  let summaryHeadline: string;
  let summaryDetail: string;

  if (needsTimingConfirm) {
    summaryHeadline =
      "Confirm ship timing — enter your confirmed all-aboard time and berth to lock safe departures";
    summaryDetail =
      "DCC requires your ship's confirmed all-aboard cutoff and berth transfer window before clearing a 60–90 minute gangway return buffer.";
  } else if (fittingCount > 0) {
    summaryHeadline = input.flightCanceled
      ? `${fittingCount} surface backup option${fittingCount === 1 ? "" : "s"} fit your ${input.arrivalTime}–${input.allAboardTime} window after flight cancellation`
      : `${fittingCount} Juneau option${fittingCount === 1 ? "" : "s"} fit your ${input.arrivalTime}–${input.allAboardTime} ship window with full ${unified.input.configuredReturnBufferMinutes}m buffer`;
    summaryDetail = input.flightCanceled
      ? "Helicopter departures are paused for your canceled-flight pivot. Surface Auke Bay whale watching and Mendenhall shuttle options below clear your gangway buffer."
      : `Evaluated via evaluateJuneauPortDayScenario for ${input.ship} at berth ${input.berth} on ${input.date} (${input.partySize} traveler${input.partySize === 1 ? "" : "s"}).`;
  } else {
    summaryHeadline = `Tight port window (${input.arrivalTime}–${input.allAboardTime}) — standard guided blocks fall inside your ${unified.input.configuredReturnBufferMinutes}m gangway buffer`;
    summaryDetail =
      "Standard valley/marine tours do not clear the mandatory return buffer. Walk downtown or check custom short-window recovery options on Juneau Flight Deck.";
  }

  return {
    checkedAtIso: unified.evaluatedAt,
    calculationEngine: "evaluateJuneauPortDayScenario",
    compressedTargetBytes: LOW_BANDWIDTH_JUNEAU_COMPRESSED_TARGET_BYTES,
    offlinePolicyNote:
      "Offline copy shows your last saved plan and when it was checked. Updated availability and booking require an active connection.",
    input,
    availablePortMinutes: unified.availablePortMinutes,
    timeWindowParam: unified.timeWindowParam,
    tides: unified.tides,
    recheckCard: unified.recheckCard,
    backupFlow: unified.backupFlow,
    summaryHeadline,
    summaryDetail,
    primaryHandoffHref: unified.recheckCard.primaryNextActionHref,
    primaryHandoffLabel: unified.recheckCard.primaryNextActionLabel,
    options: evaluatedOptions,
  };
}

export async function evaluateLowBandwidthJuneauPlanAsync(
  rawInput?:
    | Partial<LowBandwidthJuneauInput>
    | Record<string, string | string[] | undefined>
    | URLSearchParams,
  options?: { checkedAtIso?: string },
): Promise<LowBandwidthJuneauPlanEvaluation> {
  return evaluateLowBandwidthJuneauReplan(rawInput, options);
}

