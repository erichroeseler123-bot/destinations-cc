import ledgerData from "../../../data/cruise/port-clock/2026-11-23.json";

/**
 * Port-clock ledger: one sourced record per port call.
 *
 * Rules (enforced by validatePortClockLedger and tests):
 * - A published all-aboard time and a modeled estimate never share a field.
 * - A published all-aboard time requires a published source with a check date.
 * - Arrival/departure times count as verified only with a schedule source and a known time basis.
 */

export type PortClockTimeBasis = "ship_time" | "local_port_time" | "unknown";
export type PortClockSourceKind =
  | "cruise_line_itinerary"
  | "cruise_line_daily_program"
  | "cruise_line_sailing_notice"
  | "port_authority_schedule"
  /** Times copied from another system's sailing record; `url` is that record, not the cruise line. */
  | "shared_sailing_record"
  | "other";
export type PortClockStatus = "verified" | "partial" | "unverified";

export interface PortClockSource {
  url: string;
  kind: PortClockSourceKind;
  /** ISO date (YYYY-MM-DD) the source was last checked. */
  checkedAt: string;
  /** Identifier of the shared record when kind is "shared_sailing_record". */
  recordId?: string;
  /** The page the shared record cites as its own source; DCC did not check it directly. */
  upstreamUrl?: string;
  upstreamKind?: PortClockSourceKind;
  note?: string;
}

export interface PortClockReturnPoint {
  name: string;
  dockOrTender: "dock" | "tender" | "unknown";
  source: PortClockSource;
}

export interface PortClockRecord {
  sailingId: string;
  sailingAliases?: string[];
  shipName: string;
  shipSlug: string;
  portSlug: string;
  callDate: string;
  arrivalTime: string | null;
  departureTime: string | null;
  timeBasis: PortClockTimeBasis;
  publishedAllAboardTime: string | null;
  publishedAllAboardSource: PortClockSource | null;
  modeledAllAboardTime: string | null;
  modelRule: string | null;
  returnPoint: PortClockReturnPoint | null;
  scheduleSource: PortClockSource | null;
  status: PortClockStatus;
}

export interface PortClockLedger {
  version: string;
  generatedAt: string;
  note?: string;
  portCalls: PortClockRecord[];
}

/** Line-issued documents that may supply a published all-aboard deadline. */
export const PUBLISHED_ALL_ABOARD_SOURCE_KINDS: ReadonlySet<PortClockSourceKind> = new Set([
  "cruise_line_daily_program",
  "cruise_line_sailing_notice",
]);

/**
 * Every modeled all-aboard estimate names exactly one of these rules.
 * A modeled value is a planning note, never a published deadline.
 */
export const PORT_CLOCK_MODEL_RULES = {
  /** Value migrated from SCHEDULED_CRUISE_PORT_CALLS; no source or rule was recorded. */
  legacy_unsourced_value: "Legacy value with no recorded source or rule.",
  /** Scheduled departure minus 30 minutes. An estimate to confirm in the ship app, never a published deadline. */
  departure_minus_30: "Scheduled departure minus 30 minutes.",
  departure_minus_45: "Scheduled departure minus 45 minutes.",
} as const;
export type PortClockModelRule = keyof typeof PORT_CLOCK_MODEL_RULES;

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

function minutesToHhmm(total: number): string {
  const m = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Applies a named model rule; returns null when the rule cannot be computed from the record. */
export function applyPortClockModelRule(rule: PortClockModelRule, departureTime: string | null): string | null {
  if ((rule !== "departure_minus_30" && rule !== "departure_minus_45") || !departureTime || !HHMM.test(departureTime)) return null;
  const [h, m] = departureTime.split(":").map(Number);
  return minutesToHhmm(h * 60 + m - (rule === "departure_minus_45" ? 45 : 30));
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function hasCheckedSource(source: Pick<PortClockSource, "url" | "checkedAt"> | null | undefined): boolean {
  if (!source || !isValidDate(source.checkedAt)) return false;
  try {
    const url = new URL(source.url);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export type MissingPortClockEvidence =
  | "schedule_unverified"
  | "no_published_all_aboard"
  | "time_basis_unknown"
  | "return_point_unknown"
  | "call_window_ambiguous";

/** Both the planner and the return checker use the same evidence before confirming a clock. */
export function missingPortClockEvidence(r: PortClockRecord): MissingPortClockEvidence[] {
  const missing: MissingPortClockEvidence[] = [];
  const { publishedAllAboardTime: deadline, arrivalTime, departureTime } = r;
  if (!isValidDate(r.callDate) || !hasCheckedSource(r.scheduleSource)
      || !HHMM.test(arrivalTime ?? "") || !HHMM.test(departureTime ?? "")) {
    missing.push("schedule_unverified");
  }
  if (!HHMM.test(deadline ?? "") || !r.publishedAllAboardSource
      || !PUBLISHED_ALL_ABOARD_SOURCE_KINDS.has(r.publishedAllAboardSource.kind)
      || !hasCheckedSource(r.publishedAllAboardSource)) {
    missing.push("no_published_all_aboard");
  }
  if (r.timeBasis !== "ship_time" && r.timeBasis !== "local_port_time") missing.push("time_basis_unknown");
  if (!r.returnPoint?.name.trim() || !hasCheckedSource(r.returnPoint.source)) missing.push("return_point_unknown");
  // HH:MM alone cannot place an overnight departure or deadline on a particular day.
  if (arrivalTime && departureTime && deadline
      && (arrivalTime >= departureTime || deadline < arrivalTime || deadline > departureTime)) {
    missing.push("call_window_ambiguous");
  }
  return missing;
}

export function hasPublishedPortClockEvidence(r: PortClockRecord): boolean {
  return missingPortClockEvidence(r).length === 0;
}

export function getPortClockLedger(): PortClockLedger {
  return ledgerData as PortClockLedger;
}

export function derivePortClockStatus(r: PortClockRecord): PortClockStatus {
  const missing = missingPortClockEvidence(r);
  if (missing.length === 0) return "verified";
  const scheduleOk = !missing.includes("schedule_unverified") && !missing.includes("time_basis_unknown");
  if (scheduleOk || r.publishedAllAboardTime) return "partial";
  return "unverified";
}

export function validatePortClockLedger(ledger: PortClockLedger = getPortClockLedger()): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  ledger.portCalls.forEach((r, i) => {
    const id = `${i}:${r.sailingId}/${r.portSlug}/${r.callDate}`;
    const key = `${r.sailingId}|${r.portSlug}|${r.callDate}`;
    if (seen.has(key)) errors.push(`${id} duplicate port call`);
    seen.add(key);
    if (!isValidDate(r.callDate)) errors.push(`${id} bad callDate`);
    for (const f of ["arrivalTime", "departureTime", "publishedAllAboardTime", "modeledAllAboardTime"] as const) {
      const v = r[f];
      if (v !== null && !HHMM.test(v)) errors.push(`${id} bad ${f} "${v}"`);
    }
    if (r.publishedAllAboardTime && !r.publishedAllAboardSource)
      errors.push(`${id} published all-aboard without a published source`);
    if (r.publishedAllAboardSource && !PUBLISHED_ALL_ABOARD_SOURCE_KINDS.has(r.publishedAllAboardSource.kind))
      errors.push(`${id} all-aboard source kind "${r.publishedAllAboardSource.kind}" is not a line-issued document`);
    if (r.modeledAllAboardTime && !r.modelRule) errors.push(`${id} modeled all-aboard without a model rule`);
    if (r.modelRule && !Object.prototype.hasOwnProperty.call(PORT_CLOCK_MODEL_RULES, r.modelRule))
      errors.push(`${id} unknown model rule "${r.modelRule}"`);
    if ((r.modelRule === "departure_minus_30" || r.modelRule === "departure_minus_45")
        && r.modeledAllAboardTime !== applyPortClockModelRule(r.modelRule, r.departureTime)) {
      const leadMinutes = r.modelRule === "departure_minus_45" ? 45 : 30;
      errors.push(`${id} modeled all-aboard "${r.modeledAllAboardTime}" does not equal departure - ${leadMinutes}`);
    }
    for (const s of [r.scheduleSource, r.publishedAllAboardSource, r.returnPoint?.source]) {
      if (s && !hasCheckedSource(s)) errors.push(`${id} source missing url or check date`);
    }
    if (r.status !== derivePortClockStatus(r))
      errors.push(`${id} status "${r.status}" should be "${derivePortClockStatus(r)}"`);
  });
  return errors;
}

export function findPortClockRecord(params: {
  sailingId: string;
  portSlug: string;
  callDate?: string;
}): PortClockRecord | null {
  const id = params.sailingId.trim().toLowerCase();
  const calls = getPortClockLedger().portCalls.filter(
    (r) =>
      r.portSlug === params.portSlug &&
      (!params.callDate || r.callDate === params.callDate) &&
      (r.sailingId.toLowerCase() === id || (r.sailingAliases ?? []).some((a) => a.toLowerCase() === id)),
  );
  return calls.length === 1 ? calls[0] : null;
}

export type PortClockScope = "all" | "upcoming" | "past";

/** Today's date (YYYY-MM-DD, UTC) unless a reference date is supplied. */
function referenceDate(asOf?: string): string {
  return asOf && isValidDate(asOf) ? asOf : new Date().toISOString().slice(0, 10);
}

/** A port call is past once its call date is before the reference date. */
export function isPastPortCall(r: PortClockRecord, asOf?: string): boolean {
  return r.callDate < referenceDate(asOf);
}

export function parsePortClockScope(value: string | null | undefined): PortClockScope {
  const v = value?.trim().toLowerCase();
  return v === "upcoming" || v === "past" ? v : "all";
}

/** Read-side filter only; it never removes rows from the ledger itself. */
export function filterPortCallsByScope(
  portCalls: PortClockRecord[],
  scope: PortClockScope,
  asOf?: string,
): PortClockRecord[] {
  if (scope === "all") return portCalls;
  return portCalls.filter((r) => (scope === "past") === isPastPortCall(r, asOf));
}

export function summarizePortClockLedger(ledger: PortClockLedger = getPortClockLedger()) {
  const counts = { total: ledger.portCalls.length, verified: 0, partial: 0, unverified: 0, publishedAllAboard: 0, modeledOnly: 0, noAllAboard: 0 };
  for (const r of ledger.portCalls) {
    counts[r.status] += 1;
    if (r.publishedAllAboardTime) counts.publishedAllAboard += 1;
    else if (r.modeledAllAboardTime) counts.modeledOnly += 1;
    else counts.noAllAboard += 1;
  }
  return { version: ledger.version, ...counts };
}
