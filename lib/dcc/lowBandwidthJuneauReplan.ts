import {
  CLAA_JUNEAU_PORT_SCHEDULE,
  evaluateCruiseTimingWindow,
  type CruiseTimingEvaluationResult,
  type JuneauBerthCode,
} from "@/lib/dcc/cruiseTimingGate";
import {
  evaluateJuneauBackupFlow,
  type JuneauBackupFlowContext,
} from "@/lib/dcc/dockRolloutContext";

export const LOW_BANDWIDTH_JUNEAU_COMPRESSED_TARGET_BYTES = 50 * 1024; // 50 KB compressed first-load target
export const LOW_BANDWIDTH_JUNEAU_OFFLINE_STORAGE_KEY =
  "dcc_juneau_offline_plan_v1";

export interface LowBandwidthJuneauInput {
  ship: string;
  date: string;
  arrivalTime: string;
  allAboardTime: string;
  berth: JuneauBerthCode;
  partySize: number;
  flightCanceled: boolean;
  cancelRef: string | null;
  dccContextId: string | null;
}

export interface LowBandwidthJuneauOptionResult {
  optionId: string;
  title: string;
  categoryLabel: string;
  durationMinutes: number;
  durationLabel: string;
  priceFromLabel: string;
  weatherResilienceLabel: string;
  requiresClearCeiling: boolean;
  fitsNow: boolean;
  deprioritizedByFlightCancel: boolean;
  timing: CruiseTimingEvaluationResult;
  flightDeckInterest:
    | "helicopter"
    | "dogsled"
    | "whale-watching"
    | "weather-backup"
    | "compare-operators";
  handoffHref: string;
  directDestinationPreviewUrl: string;
}

export interface LowBandwidthJuneauPlanEvaluation {
  checkedAtIso: string;
  compressedTargetBytes: number;
  offlinePolicyNote: string;
  input: LowBandwidthJuneauInput;
  availablePortMinutes: number | null;
  timeWindowParam: string;
  backupFlow: JuneauBackupFlowContext;
  summaryHeadline: string;
  summaryDetail: string;
  primaryHandoffHref: string;
  primaryHandoffLabel: string;
  options: LowBandwidthJuneauOptionResult[];
}

const RAW_REPLAN_OPTIONS: Array<{
  optionId: string;
  title: string;
  categoryLabel: string;
  durationMinutes: number;
  durationLabel: string;
  priceFromLabel: string;
  weatherResilienceLabel: string;
  requiresClearCeiling: boolean;
  flightDeckInterest:
    | "helicopter"
    | "dogsled"
    | "whale-watching"
    | "weather-backup"
    | "compare-operators";
}> = [
  {
    optionId: "whale-watching-auke-bay",
    title: "Auke Bay Small-Group Whale Watching (Whale Deck)",
    categoryLabel: "Marine Wildlife · Surface Vessel",
    durationMinutes: 210,
    durationLabel: "3.5 hrs dock-to-dock",
    priceFromLabel: "From $189 / adult",
    weatherResilienceLabel: "Operates under marine visibility when low ceilings ground aircraft",
    requiresClearCeiling: false,
    flightDeckInterest: "whale-watching",
  },
  {
    optionId: "mendenhall-glacier-shuttle",
    title: "Mendenhall Glacier Express Shuttle & Visitor Center",
    categoryLabel: "Glacier Land Access · Surface Coach",
    durationMinutes: 180,
    durationLabel: "3.0 hrs dock-to-dock",
    priceFromLabel: "From $80 / adult",
    weatherResilienceLabel: "All-weather road access (3.0 hr minimum port window)",
    requiresClearCeiling: false,
    flightDeckInterest: "weather-backup",
  },
  {
    optionId: "helicopter-glacier-walk",
    title: "Icefield Helicopter Flight & Guided Glacier Walkabout",
    categoryLabel: "Rotorcraft Part 135 · Glacier Landing",
    durationMinutes: 195,
    durationLabel: "3.25 hrs dock-to-dock",
    priceFromLabel: "From $419 / person",
    weatherResilienceLabel: "Requires FAA Part 135 VFR ceiling & visibility minimums at PAJN",
    requiresClearCeiling: true,
    flightDeckInterest: "helicopter",
  },
  {
    optionId: "helicopter-dogsled",
    title: "Helicopter Glacier Dogsled Camp Excursion",
    categoryLabel: "Rotorcraft Part 135 · Upper Icefield Snow Camp",
    durationMinutes: 240,
    durationLabel: "4.0 hrs dock-to-dock",
    priceFromLabel: "From $679 / person",
    weatherResilienceLabel: "Highest ceiling sensitivity (upper snowfield camp)",
    requiresClearCeiling: true,
    flightDeckInterest: "dogsled",
  },
  {
    optionId: "whale-mendenhall-combo",
    title: "Whale Watching + Mendenhall Glacier Two-Activity Combo",
    categoryLabel: "Surface Combo · Auke Bay + Mendenhall Valley",
    durationMinutes: 330,
    durationLabel: "5.5 hrs dock-to-dock",
    priceFromLabel: "From $225 / adult",
    weatherResilienceLabel: "All-weather surface combo; requires 90-min multi-leg return buffer",
    requiresClearCeiling: false,
    flightDeckInterest: "whale-watching",
  },
];

function parseHhMmToMinutes(value: string | null | undefined): number | null {
  if (!value || !/^\d{1,2}:\d{2}$/.test(value.trim())) return null;
  const [hStr, mStr] = value.trim().split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return null;
  }
  return h * 60 + m;
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
          berth: (rawInput as Partial<LowBandwidthJuneauInput>).berth || "FKL",
          partySize: (rawInput as Partial<LowBandwidthJuneauInput>).partySize || 2,
          flightCanceled: Boolean(
            (rawInput as Partial<LowBandwidthJuneauInput>).flightCanceled,
          ),
          cancelRef:
            (rawInput as Partial<LowBandwidthJuneauInput>).cancelRef ?? null,
          dccContextId:
            (rawInput as Partial<LowBandwidthJuneauInput>).dccContextId ?? null,
        }
      : parseLowBandwidthJuneauInput(
          rawInput as
            | Record<string, string | string[] | undefined>
            | URLSearchParams
            | undefined,
        );

  const checkedAtIso = options?.checkedAtIso || new Date().toISOString();

  const arrMins = parseHhMmToMinutes(input.arrivalTime);
  const allAboardMins = parseHhMmToMinutes(input.allAboardTime);
  const availablePortMinutes =
    arrMins !== null && allAboardMins !== null && allAboardMins > arrMins
      ? allAboardMins - arrMins
      : null;

  const timeWindowParam =
    availablePortMinutes !== null
      ? `${input.arrivalTime}-${input.allAboardTime} (${(
          availablePortMinutes / 60
        ).toFixed(1)}h)`
      : `${input.arrivalTime}-unconfirmed`;

  const backupFlow = evaluateJuneauBackupFlow({
    travelerSelectedCanceled: input.flightCanceled,
    operatorCancelRef: input.cancelRef,
  });

  const evaluatedOptions: LowBandwidthJuneauOptionResult[] =
    RAW_REPLAN_OPTIONS.map((rawOpt) => {
      const timing = evaluateCruiseTimingWindow({
        claaArrivalLocal: input.arrivalTime,
        confirmedAllAboardLocal: input.allAboardTime || null,
        berthCode: input.berth,
        tourDurationMinutes: rawOpt.durationMinutes,
      });

      const deprioritizedByFlightCancel =
        input.flightCanceled && rawOpt.requiresClearCeiling;
      const fitsNow =
        timing.status === "FITS_CRUISE_WINDOW" && !deprioritizedByFlightCancel;

      const effectiveInterest =
        input.flightCanceled && rawOpt.requiresClearCeiling
          ? "weather-backup"
          : rawOpt.flightDeckInterest;

      const handoffHref = buildJuneauFlightDeckReplanHandoffUrl({
        input,
        interest: effectiveInterest,
        optionId: rawOpt.optionId,
        timeWindowParam,
      });

      const destPath =
        effectiveInterest === "whale-watching"
          ? "/juneau-whale-watching-tours"
          : effectiveInterest === "dogsled"
            ? "/juneau-dogsled-helicopter-tours"
            : effectiveInterest === "weather-backup"
              ? "/juneau/what-to-do-if-helicopter-tour-canceled"
              : effectiveInterest === "compare-operators"
                ? "/temsco-vs-coastal-vs-northstar-juneau"
                : "/helicopter";

      return {
        optionId: rawOpt.optionId,
        title: rawOpt.title,
        categoryLabel: rawOpt.categoryLabel,
        durationMinutes: rawOpt.durationMinutes,
        durationLabel: rawOpt.durationLabel,
        priceFromLabel: rawOpt.priceFromLabel,
        weatherResilienceLabel: rawOpt.weatherResilienceLabel,
        requiresClearCeiling: rawOpt.requiresClearCeiling,
        fitsNow,
        deprioritizedByFlightCancel,
        timing,
        flightDeckInterest: effectiveInterest,
        handoffHref,
        directDestinationPreviewUrl: `https://juneauflightdeck.com${destPath}`,
      };
    });

  // Sort so options that fit now and match flight-cancellation state come first
  evaluatedOptions.sort((a, b) => {
    const score = (opt: LowBandwidthJuneauOptionResult) => {
      if (opt.fitsNow) return 3;
      if (
        opt.timing.status === "CONFIRM_SHIP_TIMING" &&
        !opt.deprioritizedByFlightCancel
      ) {
        return 2;
      }
      if (opt.timing.status === "FITS_CRUISE_WINDOW") return 1;
      return 0;
    };
    return score(b) - score(a);
  });

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
      : `${fittingCount} Juneau option${fittingCount === 1 ? "" : "s"} fit your ${input.arrivalTime}–${input.allAboardTime} ship window with full 60–90m buffer`;
    summaryDetail = input.flightCanceled
      ? "Helicopter departures are paused for your canceled-flight pivot. Surface Auke Bay whale watching and Mendenhall shuttle options below clear your gangway buffer."
      : `Evaluated for ${input.ship} at berth ${input.berth} for ${input.partySize} traveler${input.partySize === 1 ? "" : "s"}.`;
  } else {
    summaryHeadline = `Tight port window (${input.arrivalTime}–${input.allAboardTime}) — standard guided blocks fall inside your 60–90m gangway buffer`;
    summaryDetail =
      "Standard 3.0–5.5h tours do not clear the mandatory return buffer. Walk downtown or check custom short-window recovery options on Juneau Flight Deck.";
  }

  const topOption = evaluatedOptions[0];
  const primaryInterest = input.flightCanceled
    ? "weather-backup"
    : topOption?.flightDeckInterest || "helicopter";

  const primaryHandoffHref = buildJuneauFlightDeckReplanHandoffUrl({
    input,
    interest: primaryInterest,
    optionId: topOption?.optionId,
    timeWindowParam,
  });

  const primaryHandoffLabel = input.flightCanceled
    ? "Continue to Juneau Flight Deck Weather Backup with Trip Details →"
    : topOption?.flightDeckInterest === "whale-watching"
      ? "Continue to Juneau Flight Deck Whale Deck with Trip Details →"
      : "Continue to Juneau Flight Deck with Trip Details →";

  return {
    checkedAtIso,
    compressedTargetBytes: LOW_BANDWIDTH_JUNEAU_COMPRESSED_TARGET_BYTES,
    offlinePolicyNote:
      "Offline copy shows your last saved plan and when it was checked. Updated availability and booking require an active connection.",
    input,
    availablePortMinutes,
    timeWindowParam,
    backupFlow,
    summaryHeadline,
    summaryDetail,
    primaryHandoffHref,
    primaryHandoffLabel,
    options: evaluatedOptions,
  };
}
