import fs from "fs";
import path from "path";
import type { DccDiagnostics } from "@/lib/dcc/diagnostics";
import { isoAfterHours } from "@/lib/dcc/diagnostics";
import { getEnvNumber } from "@/lib/dcc/config/env";

const ROOT = process.cwd();
const SNAPSHOT_PATH = path.join(ROOT, "data", "action", "cruise.providers.health.json");

function getMaxAgeMinutes(): number {
  return getEnvNumber("CRUISE_PROVIDER_HEALTH_MAX_AGE_MINUTES", 120, { min: 1, max: 1440 });
}

export type CruiseProviderHealthSnapshot = {
  generated_at: string;
  timeout_ms: number;
  duration_ms: number;
  totals: {
    providers_total: number;
    providers_configured: number;
    live_rows: number;
    provider_errors: number;
  };
  provider_status: Array<{
    provider: string;
    configured: boolean;
    live_rows: number;
    ok: boolean;
    error: string | null;
  }>;
};

export function readCruiseProviderHealthSnapshot(
  snapshotPath = SNAPSHOT_PATH
): CruiseProviderHealthSnapshot | null {
  try {
    if (!fs.existsSync(snapshotPath)) return null;
    return JSON.parse(fs.readFileSync(snapshotPath, "utf8")) as CruiseProviderHealthSnapshot;
  } catch {
    return null;
  }
}

export function getCruiseProviderHealthSnapshotStatus(
  snapshot: CruiseProviderHealthSnapshot | null,
  maxAgeMinutes = getMaxAgeMinutes()
): { exists: boolean; stale: boolean; age_minutes: number | null; max_age_minutes: number } {
  if (!snapshot) {
    return {
      exists: false,
      stale: true,
      age_minutes: null,
      max_age_minutes: maxAgeMinutes,
    };
  }
  const ts = Date.parse(snapshot.generated_at);
  if (Number.isNaN(ts)) {
    return {
      exists: true,
      stale: true,
      age_minutes: null,
      max_age_minutes: maxAgeMinutes,
    };
  }
  const ageMinutes = (Date.now() - ts) / (1000 * 60);
  return {
    exists: true,
    stale: ageMinutes > maxAgeMinutes,
    age_minutes: ageMinutes,
    max_age_minutes: maxAgeMinutes,
  };
}

export function getCruiseProviderHealthDiagnostics(
  snapshot: CruiseProviderHealthSnapshot | null,
  maxAgeMinutes = getMaxAgeMinutes()
): DccDiagnostics {
  const status = getCruiseProviderHealthSnapshotStatus(snapshot, maxAgeMinutes);
  return {
    source: "provider_health_snapshot",
    cache_status: status.exists ? (status.stale ? "stale" : "fresh") : "miss",
    stale: status.stale,
    last_updated: snapshot?.generated_at || null,
    stale_after: snapshot?.generated_at
      ? isoAfterHours(snapshot.generated_at, maxAgeMinutes / 60)
      : null,
    fallback_reason: status.exists ? null : "health_snapshot_missing",
  };
}
