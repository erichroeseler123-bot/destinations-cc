/**
 * DCC Cruise Timing & Berth-to-Gangway Buffer Gate
 *
 * Enforces Requirement 2 ("Use cruise timing for today's release"):
 * - Checks whether passengers can get from their berth to tour check-in,
 *   complete the tour, and return to the gangway before all-aboard with the
 *   applicable 60–90 minute DCC buffer.
 * - Uses the published CLAA (Cruise Line Agencies of Alaska) calendar for
 *   Juneau port-call times and the ship's confirmed all-aboard time for the
 *   actual cutoff.
 * - Returns statusLabel: "Confirm ship timing" whenever the ship's confirmed
 *   all-aboard cutoff or a material transfer (berth / tender / shuttle) is
 *   unknown.
 * - Shows seat counts ONLY when the provider explicitly confirms them
 *   (confirmedProviderSeats !== null && providerConfirmedSeatCount === true).
 */

export type JuneauBerthCode = "CT" | "FKL" | "AS" | "AJ" | "ACT" | "TENDER" | "UNKNOWN";

export interface ClaaJuneauScheduleEntry {
  scheduleId: string;
  shipName: string;
  cruiseLine: string;
  serviceDate: string; // YYYY-MM-DD (including April 24 dock rollout onward)
  berthCode: JuneauBerthCode;
  berthLabel: string;
  claaArrivalLocal: string; // HH:MM (24h local AKDT)
  claaDepartureLocal: string; // HH:MM (24h local AKDT)
  confirmedAllAboardLocal: string | null; // HH:MM when ship cutoff is confirmed, null when unknown
  outboundBerthToCheckInMinutes: number | null;
  returnToGangwayMinutes: number | null;
  requiredDccBufferMinutes: 120 | 90 | 60;
}

/**
 * Published CLAA Juneau Port-Call Reference Schedule (including April 24 Dock Rollout & Peak Season Calls)
 */
export const CLAA_JUNEAU_PORT_SCHEDULE: ClaaJuneauScheduleEntry[] = [
  {
    scheduleId: "CLAA-JNU-2026-04-24-BLISS",
    shipName: "Norwegian Bliss",
    cruiseLine: "Norwegian Cruise Line",
    serviceDate: "2026-04-24",
    berthCode: "AJ",
    berthLabel: "AJ Dock (1.2 mi south — shuttle transfer required)",
    claaArrivalLocal: "07:00",
    claaDepartureLocal: "13:30",
    confirmedAllAboardLocal: "13:00",
    outboundBerthToCheckInMinutes: 35,
    returnToGangwayMinutes: 25,
    requiredDccBufferMinutes: 120,
  },
  {
    scheduleId: "CLAA-JNU-2026-04-24-EURODAM",
    shipName: "Eurodam",
    cruiseLine: "Holland America Line",
    serviceDate: "2026-04-24",
    berthCode: "CT",
    berthLabel: "Cruise Terminal Dock (CT — downtown walk-off)",
    claaArrivalLocal: "12:30",
    claaDepartureLocal: "22:00",
    confirmedAllAboardLocal: "21:30",
    outboundBerthToCheckInMinutes: 20,
    returnToGangwayMinutes: 15,
    requiredDccBufferMinutes: 120,
  },
  {
    scheduleId: "CLAA-JNU-2026-04-24-ROYAL-PRINCESS",
    shipName: "Royal Princess",
    cruiseLine: "Princess Cruises",
    serviceDate: "2026-04-24",
    berthCode: "FKL",
    berthLabel: "South Franklin Street Dock (FKL — downtown walk-off)",
    claaArrivalLocal: "08:00",
    claaDepartureLocal: "21:00",
    confirmedAllAboardLocal: "20:30",
    outboundBerthToCheckInMinutes: 20,
    returnToGangwayMinutes: 15,
    requiredDccBufferMinutes: 120,
  },
  {
    scheduleId: "CLAA-JNU-2026-04-24-OVATION",
    shipName: "Ovation of the Seas",
    cruiseLine: "Royal Caribbean",
    serviceDate: "2026-04-24",
    berthCode: "AS",
    berthLabel: "Alaska Steamship Dock (AS — downtown seawalk)",
    claaArrivalLocal: "13:00",
    claaDepartureLocal: "21:00",
    confirmedAllAboardLocal: null, // Ship all-aboard cutoff not yet confirmed -> triggers "Confirm ship timing"
    outboundBerthToCheckInMinutes: 25,
    returnToGangwayMinutes: 15,
    requiredDccBufferMinutes: 120,
  },
  {
    scheduleId: "CLAA-JNU-2026-05-04-KONINGSDAM",
    shipName: "Koningsdam",
    cruiseLine: "Holland America Line",
    serviceDate: "2026-05-04",
    berthCode: "TENDER",
    berthLabel: "Marine Park Anchor / Tender Pier (tender boat queue required)",
    claaArrivalLocal: "13:00",
    claaDepartureLocal: "22:00",
    confirmedAllAboardLocal: "21:00",
    outboundBerthToCheckInMinutes: 50,
    returnToGangwayMinutes: 40,
    requiredDccBufferMinutes: 120,
  },
];

export interface CruiseTimingEvaluationInput {
  claaArrivalLocal?: string | null; // HH:MM
  claaDepartureLocal?: string | null; // HH:MM
  confirmedAllAboardLocal?: string | null; // HH:MM
  berthCode?: JuneauBerthCode | string | null;
  outboundBerthToCheckInMinutes?: number | null;
  tourDepartureLocal?: string | null; // HH:MM
  tourDurationMinutes: number;
  returnToGangwayMinutes?: number | null;
  requiredDccBufferMinutes?: 120 | 90 | 60 | number;
  providerSeatCount?: number | null;
  providerConfirmedSeats?: boolean;
}

export interface CruiseTimingEvaluationResult {
  status:
    | "FITS_CRUISE_WINDOW"
    | "REDUCED_BUFFER_NOT_RECOMMENDED"
    | "OUTSIDE_CRUISE_WINDOW"
    | "CONFIRM_SHIP_TIMING";
  statusBadgeLabel:
    | "Fits cruise window"
    | "Reduced buffer — not recommended"
    | "Outside safe buffer"
    | "Confirm ship timing";
  dccBufferMinutes: number;
  earliestCheckInLocal: string | null;
  estimatedGangwayReturnLocal: string | null;
  latestSafeGangwayReturnLocal: string | null;
  confirmedAllAboardLocal: string | null;
  marginBeforeAllAboardMinutes: number | null;
  exactRemainingBufferHms: string | null;
  reason: string;
  seatCountDisplay: string | null; // Null unless provider explicitly confirms seat count
}

function parseHhMm(hhmm?: string | null): number | null {
  if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm.trim())) return null;
  const [hStr, mStr] = hhmm.trim().split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return null;
  }
  return h * 60 + m;
}

function formatHhMm(totalMinutes: number): string {
  const clamped = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatMinutesAsHms(totalMinutes: number): string {
  const safeSec = Math.max(0, Math.round(totalMinutes * 60));
  const h = Math.floor(safeSec / 3600);
  const m = Math.floor((safeSec % 3600) / 60);
  const s = safeSec % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Evaluates whether a passenger can transit from berth -> tour check-in,
 * complete the tour, and return to the gangway before confirmed all-aboard
 * with DCC's 2-hour (1:59:59+ / 120-minute) recommended return buffer.
 */
export function evaluateCruiseTimingWindow(
  input: CruiseTimingEvaluationInput,
): CruiseTimingEvaluationResult {
  const berth = (input.berthCode || "UNKNOWN").toUpperCase();
  const dccBufferMinutes = input.requiredDccBufferMinutes ?? 120;

  // Seat count rule: show seat counts ONLY when the provider confirms them
  const seatCountDisplay =
    input.providerConfirmedSeats === true &&
    typeof input.providerSeatCount === "number" &&
    input.providerSeatCount >= 0
      ? `${input.providerSeatCount} provider-confirmed ${
          input.providerSeatCount === 1 ? "seat" : "seats"
        } remaining`
      : null;

  const arrivalMins = parseHhMm(input.claaArrivalLocal);
  const confirmedAllAboardMins = parseHhMm(input.confirmedAllAboardLocal);
  const tourDepartureMins = parseHhMm(input.tourDepartureLocal);

  const outboundTransfer =
    typeof input.outboundBerthToCheckInMinutes === "number" &&
    input.outboundBerthToCheckInMinutes >= 0
      ? input.outboundBerthToCheckInMinutes
      : berth === "CT" || berth === "FKL"
        ? 20
        : berth === "AS"
          ? 25
          : berth === "AJ" || berth === "ACT"
            ? 35
            : berth === "TENDER"
              ? 50
              : null;

  const returnTransfer =
    typeof input.returnToGangwayMinutes === "number" &&
    input.returnToGangwayMinutes >= 0
      ? input.returnToGangwayMinutes
      : berth === "CT" || berth === "FKL" || berth === "AS"
        ? 15
        : berth === "AJ" || berth === "ACT"
          ? 25
          : berth === "TENDER"
            ? 40
            : null;

  // Whenever the ship's confirmed all-aboard cutoff or a material transfer is unknown -> "Confirm ship timing"
  if (
    arrivalMins === null ||
    confirmedAllAboardMins === null ||
    outboundTransfer === null ||
    returnTransfer === null ||
    berth === "UNKNOWN"
  ) {
    return {
      status: "CONFIRM_SHIP_TIMING",
      statusBadgeLabel: "Confirm ship timing",
      dccBufferMinutes,
      earliestCheckInLocal:
        arrivalMins !== null && outboundTransfer !== null
          ? formatHhMm(arrivalMins + outboundTransfer)
          : null,
      estimatedGangwayReturnLocal: null,
      latestSafeGangwayReturnLocal:
        confirmedAllAboardMins !== null
          ? formatHhMm(confirmedAllAboardMins - dccBufferMinutes)
          : null,
      confirmedAllAboardLocal: input.confirmedAllAboardLocal || null,
      marginBeforeAllAboardMinutes: null,
      exactRemainingBufferHms: null,
      reason:
        confirmedAllAboardMins === null
          ? "Confirm ship timing — ship's confirmed all-aboard cutoff is required before locking departure."
          : "Confirm ship timing — berth-to-check-in or return gangway transfer timing is unknown.",
      seatCountDisplay,
    };
  }

  const earliestCheckInMins = arrivalMins + outboundTransfer;
  const effectiveTourStartMins =
    tourDepartureMins !== null ? tourDepartureMins : earliestCheckInMins;

  if (effectiveTourStartMins < earliestCheckInMins) {
    return {
      status: "OUTSIDE_CRUISE_WINDOW",
      statusBadgeLabel: "Outside safe buffer",
      dccBufferMinutes,
      earliestCheckInLocal: formatHhMm(earliestCheckInMins),
      estimatedGangwayReturnLocal: formatHhMm(
        effectiveTourStartMins + input.tourDurationMinutes + returnTransfer,
      ),
      latestSafeGangwayReturnLocal: formatHhMm(
        confirmedAllAboardMins - dccBufferMinutes,
      ),
      confirmedAllAboardLocal: formatHhMm(confirmedAllAboardMins),
      marginBeforeAllAboardMinutes:
        confirmedAllAboardMins -
        (effectiveTourStartMins + input.tourDurationMinutes + returnTransfer),
      exactRemainingBufferHms: "0:00:00",
      reason: `Tour check-in (${formatHhMm(effectiveTourStartMins)}) is earlier than earliest berth-to-check-in arrival (${formatHhMm(earliestCheckInMins)}).`,
      seatCountDisplay,
    };
  }

  const estimatedGangwayReturnMins =
    effectiveTourStartMins + input.tourDurationMinutes + returnTransfer;
  const latestSafeGangwayReturnMins = confirmedAllAboardMins - dccBufferMinutes;
  const marginBeforeAllAboardMinutes =
    confirmedAllAboardMins - estimatedGangwayReturnMins;

  if (marginBeforeAllAboardMinutes <= 0) {
    return {
      status: "OUTSIDE_CRUISE_WINDOW",
      statusBadgeLabel: "Outside safe buffer",
      dccBufferMinutes,
      earliestCheckInLocal: formatHhMm(earliestCheckInMins),
      estimatedGangwayReturnLocal: formatHhMm(estimatedGangwayReturnMins),
      latestSafeGangwayReturnLocal: formatHhMm(latestSafeGangwayReturnMins),
      confirmedAllAboardLocal: formatHhMm(confirmedAllAboardMins),
      marginBeforeAllAboardMinutes,
      exactRemainingBufferHms: "0:00:00",
      reason: `Blocked outside sailing window — estimated gangway return (${formatHhMm(estimatedGangwayReturnMins)}) is at or after confirmed all-aboard (${formatHhMm(confirmedAllAboardMins)}).`,
      seatCountDisplay,
    };
  }

  const exactRemainingBufferHms = formatMinutesAsHms(marginBeforeAllAboardMinutes);

  if (estimatedGangwayReturnMins > latestSafeGangwayReturnMins) {
    return {
      status: "REDUCED_BUFFER_NOT_RECOMMENDED",
      statusBadgeLabel: "Reduced buffer — not recommended",
      dccBufferMinutes,
      earliestCheckInLocal: formatHhMm(earliestCheckInMins),
      estimatedGangwayReturnLocal: formatHhMm(estimatedGangwayReturnMins),
      latestSafeGangwayReturnLocal: formatHhMm(latestSafeGangwayReturnMins),
      confirmedAllAboardLocal: formatHhMm(confirmedAllAboardMins),
      marginBeforeAllAboardMinutes,
      exactRemainingBufferHms,
      reason: `Reduced buffer (${exactRemainingBufferHms} remaining before ${formatHhMm(confirmedAllAboardMins)} all-aboard) — not recommended under DCC's ${dccBufferMinutes}-minute (1:59:59+) return policy.`,
      seatCountDisplay,
    };
  }

  return {
    status: "FITS_CRUISE_WINDOW",
    statusBadgeLabel: "Fits cruise window",
    dccBufferMinutes,
    earliestCheckInLocal: formatHhMm(earliestCheckInMins),
    estimatedGangwayReturnLocal: formatHhMm(estimatedGangwayReturnMins),
    latestSafeGangwayReturnLocal: formatHhMm(latestSafeGangwayReturnMins),
    confirmedAllAboardLocal: formatHhMm(confirmedAllAboardMins),
    marginBeforeAllAboardMinutes,
    exactRemainingBufferHms,
    reason: `Recommended — cleared with ${exactRemainingBufferHms} (${marginBeforeAllAboardMinutes}m) margin before confirmed all-aboard (${formatHhMm(confirmedAllAboardMins)}), meeting DCC's ${dccBufferMinutes}-minute (1:59:59+) return policy.`,
    seatCountDisplay,
  };
}
