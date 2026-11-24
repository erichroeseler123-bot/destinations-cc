import { missingPortClockEvidence, type MissingPortClockEvidence, type PortClockRecord, type PortClockSource } from "./portClockLedger";

/** Recommended cushion between tour return and the published all-aboard deadline. */
export const RECOMMENDED_RETURN_BUFFER_MINUTES = 120;

export type ReturnBufferVerdict = "meets_recommended_120" | "below_recommended_120" | "cannot_verify";

export type CannotVerifyReason =
  | "port_call_not_found"
  | "last_tender_unconfirmed"
  | MissingPortClockEvidence
  | "tour_clock_unconfirmed"
  | "tour_date_unconfirmed"
  | "tour_return_before_arrival"
  | "tour_return_time_missing"
  | "tour_return_point_missing"
  | "tour_return_point_differs";

export const RETURN_BUFFER_VERDICT_LABELS: Record<ReturnBufferVerdict, string> = {
  meets_recommended_120: "Meets recommended 120-minute return buffer",
  below_recommended_120: "Below recommended 120-minute return buffer",
  cannot_verify: "Cannot verify",
};

export interface ReturnBufferResult {
  verdict: ReturnBufferVerdict;
  label: string;
  reasons: CannotVerifyReason[];
  bufferMinutes: number | null;
  publishedAllAboardTime: string | null;
  timeBasis: PortClockRecord["timeBasis"] | null;
  scheduleSource: PortClockSource | null;
  allAboardSource: PortClockSource | null;
  /** A modeled estimate is a planning note only; it never produces a passing verdict. */
  planningNote: string | null;
}

function toMinutes(hhmm: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : null;
}

function normalizePlace(s: string): string {
  return s.normalize("NFC").toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, " ").trim();
}

export function evaluateReturnBuffer(params: {
  portCall: PortClockRecord | null;
  /** Tour return time and service date in the explicitly identified clock. */
  tourReturnDate?: string | null;
  tourTimeBasis?: PortClockRecord["timeBasis"] | null;
  tourReturnTime?: string | null;
  /** Where the tour returns guests; must match the port call's return point. */
  tourReturnPoint?: string | null;
}): ReturnBufferResult {
  const { portCall } = params;
  const reasons: CannotVerifyReason[] = portCall ? missingPortClockEvidence(portCall) : ["port_call_not_found"];
  const tourMin = params.tourReturnTime ? toMinutes(params.tourReturnTime) : null;
  const deadlineMin = portCall?.publishedAllAboardTime ? toMinutes(portCall.publishedAllAboardTime) : null;
  if (tourMin === null) reasons.push("tour_return_time_missing");

  const tourPoint = normalizePlace(params.tourReturnPoint ?? "");
  if (!tourPoint) reasons.push("tour_return_point_missing");
  else if (portCall?.returnPoint && tourPoint !== normalizePlace(portCall.returnPoint.name)) {
    reasons.push("tour_return_point_differs");
  }
  if (portCall) {
    if (!params.tourTimeBasis || params.tourTimeBasis === "unknown" || params.tourTimeBasis !== portCall.timeBasis) {
      reasons.push("tour_clock_unconfirmed");
    }
    if (!params.tourReturnDate || params.tourReturnDate !== portCall.callDate) reasons.push("tour_date_unconfirmed");
    const arrivalMin = portCall.arrivalTime ? toMinutes(portCall.arrivalTime) : null;
    if (arrivalMin !== null && tourMin !== null && tourMin < arrivalMin) reasons.push("tour_return_before_arrival");
  }

  const planningNote =
    portCall && !portCall.publishedAllAboardTime && portCall.modeledAllAboardTime
      ? `Planning estimate only: all-aboard modeled at ${portCall.modeledAllAboardTime} (${portCall.modelRule ?? "unspecified rule"}). Not a published deadline.`
      : null;

  const base = {
    publishedAllAboardTime: portCall?.publishedAllAboardTime ?? null,
    timeBasis: portCall?.timeBasis ?? null,
    scheduleSource: portCall?.scheduleSource ?? null,
    allAboardSource: portCall?.publishedAllAboardSource ?? null,
    planningNote,
  };

  if (reasons.length > 0 || deadlineMin === null || tourMin === null) {
    return { verdict: "cannot_verify", label: RETURN_BUFFER_VERDICT_LABELS.cannot_verify, reasons, bufferMinutes: null, ...base };
  }
  const bufferMinutes = deadlineMin - tourMin;
  const verdict: ReturnBufferVerdict =
    bufferMinutes >= RECOMMENDED_RETURN_BUFFER_MINUTES ? "meets_recommended_120" : "below_recommended_120";
  return { verdict, label: RETURN_BUFFER_VERDICT_LABELS[verdict], reasons: [], bufferMinutes, ...base };
}
