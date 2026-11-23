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
  | "other";
export type PortClockStatus = "verified" | "partial" | "unverified";

export interface PortClockSource {
  url: string;
  kind: PortClockSourceKind;
  /** ISO date (YYYY-MM-DD) the source was last checked. */
  checkedAt: string;
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

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function getPortClockLedger(): PortClockLedger {
  return ledgerData as PortClockLedger;
}

export function derivePortClockStatus(r: PortClockRecord): PortClockStatus {
  const scheduleOk = Boolean(r.scheduleSource && r.timeBasis !== "unknown" && r.arrivalTime && r.departureTime);
  const fullOk = scheduleOk && Boolean(r.publishedAllAboardTime && r.publishedAllAboardSource && r.returnPoint);
  if (fullOk) return "verified";
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
    if (!ISO_DATE.test(r.callDate)) errors.push(`${id} bad callDate`);
    for (const f of ["arrivalTime", "departureTime", "publishedAllAboardTime", "modeledAllAboardTime"] as const) {
      const v = r[f];
      if (v !== null && !HHMM.test(v)) errors.push(`${id} bad ${f} "${v}"`);
    }
    if (r.publishedAllAboardTime && !r.publishedAllAboardSource)
      errors.push(`${id} published all-aboard without a published source`);
    if (r.publishedAllAboardSource && !PUBLISHED_ALL_ABOARD_SOURCE_KINDS.has(r.publishedAllAboardSource.kind))
      errors.push(`${id} all-aboard source kind "${r.publishedAllAboardSource.kind}" is not a line-issued document`);
    if (r.modeledAllAboardTime && !r.modelRule) errors.push(`${id} modeled all-aboard without a model rule`);
    for (const s of [r.scheduleSource, r.publishedAllAboardSource, r.returnPoint?.source]) {
      if (s && (!s.url || !ISO_DATE.test(s.checkedAt))) errors.push(`${id} source missing url or check date`);
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
  return (
    getPortClockLedger().portCalls.find(
      (r) =>
        r.portSlug === params.portSlug &&
        (!params.callDate || r.callDate === params.callDate) &&
        (r.sailingId.toLowerCase() === id || (r.sailingAliases ?? []).some((a) => a.toLowerCase() === id)),
    ) ?? null
  );
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
