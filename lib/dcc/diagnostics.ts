export type DccCacheStatus = "fresh" | "stale" | "miss" | "bypass";

export type DccDiagnostics = {
  source: string;
  cache_status: DccCacheStatus;
  stale: boolean;
  last_updated: string | null;
  stale_after: string | null;
  fallback_reason: string | null;
};

export function isoAfterHours(value: string | null, hours: number): string | null {
  if (!value || !Number.isFinite(hours) || hours <= 0) return null;
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return null;
  return new Date(ts + hours * 60 * 60 * 1000).toISOString();
}

export function staleFromUpdatedAt(value: string | null, maxAgeHours: number): boolean {
  if (!value || !Number.isFinite(maxAgeHours) || maxAgeHours <= 0) return true;
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return true;
  return Date.now() - ts > maxAgeHours * 60 * 60 * 1000;
}
