import fs from "fs";
import path from "path";
import type {
  CruiseBookingAction,
  CruiseCacheFile,
  CruiseSailing,
} from "@/lib/dcc/cruise/schema";

const ROOT = process.cwd();
const CACHE_PATH = path.join(ROOT, "data", "action", "cruise.sailings.cache.json");
const MAX_AGE_HOURS = Number(process.env.CRUISE_CACHE_MAX_AGE_HOURS || 72);

export type CruiseActionSource = "cache" | "catalog_fallback" | "live_api" | "fallback" | "local-catalog";

export type CruiseActionResult = {
  bookings: CruiseBookingAction[];
  source: CruiseActionSource;
  cache_status: "fresh" | "stale" | "miss" | "bypass";
  cache_age_hours: number | null;
  fallback_reason: string | null;
  last_cache_build: string;
};

function readCache(): CruiseCacheFile | null {
  if (!fs.existsSync(CACHE_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, "utf8")) as CruiseCacheFile;
  } catch {
    return null;
  }
}

function buildBookingAction(sailing: CruiseSailing, source: CruiseActionSource, cacheStatus: CruiseActionResult["cache_status"]): CruiseBookingAction | null {
  if (!sailing.external_booking_url) return null;
  return {
    provider: sailing.external_provider || "other",
    booking_url: sailing.external_booking_url,
    price_snapshot: sailing.starting_price?.amount,
    currency: sailing.starting_price?.currency || "USD",
    cabin_category: sailing.starting_price?.cabin_type,
    disclaimer: "External site — prices and availability may vary.",
    source,
    cache_status: cacheStatus,
  };
}

export function resolveCruiseAction(sailings: CruiseSailing[]): CruiseActionResult {
  const cache = readCache();
  const now = Date.now();
  const generated = cache?.generated_at || new Date(0).toISOString();
  const generatedTs = Date.parse(generated);
  const ageHours = Number.isNaN(generatedTs) ? null : (now - generatedTs) / (1000 * 60 * 60);
  const fresh = ageHours !== null ? ageHours <= MAX_AGE_HOURS : false;

  const cacheStatus: CruiseActionResult["cache_status"] = cache
    ? fresh
      ? "fresh"
      : "stale"
    : "miss";

  const source: CruiseActionSource = cache ? "cache" : "catalog_fallback";
  const bookings = sailings
    .map((s) => buildBookingAction(s, source, cacheStatus))
    .filter((x): x is CruiseBookingAction => Boolean(x));

  return {
    bookings,
    source,
    cache_status: cacheStatus,
    cache_age_hours: ageHours,
    fallback_reason: cache ? null : "cruise_cache_missing",
    last_cache_build: cache?.generated_at || new Date(0).toISOString(),
  };
}
