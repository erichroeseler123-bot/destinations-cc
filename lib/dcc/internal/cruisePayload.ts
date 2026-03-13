import fs from "fs";
import path from "path";
import type {
  CruisePayload,
  CruiseSailing,
  CruiseSortMode,
} from "@/lib/dcc/cruise/schema";
import { isoAfterHours, staleFromUpdatedAt } from "@/lib/dcc/diagnostics";
import { resolveCruiseAction } from "@/lib/dcc/internal/cruiseAction";
import { fetchLiveCruiseProviderSailings } from "@/lib/dcc/action/cruiseActionProviders";
import { slugify } from "@/lib/dcc/slug";
import {
  CruiseCacheFileSchema,
  CruisePayloadSchema,
} from "@/lib/dcc/cruise/validation";
import { getEnvNumber, getEnvOptional } from "@/lib/dcc/config/env";

const ROOT = process.cwd();
const CACHE_PATH = path.join(ROOT, "data", "action", "cruise.sailings.cache.json");

export function slugifyCruiseRoute(input: string): string {
  return slugify(input);
}

function readCruises(): CruiseSailing[] {
  try {
    const raw = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
    const parsed = CruiseCacheFileSchema.safeParse(raw);
    if (!parsed.success) {
      return [];
    }
    return parsed.data.sailings as CruiseSailing[];
  } catch {
    return [];
  }
}

function readCruiseCacheMeta(): { generated_at: string | null; source: string | null } {
  try {
    const raw = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8")) as {
      generated_at?: string;
      source?: string;
    };
    return {
      generated_at: typeof raw.generated_at === "string" ? raw.generated_at : null,
      source: typeof raw.source === "string" ? raw.source : null,
    };
  } catch {
    return { generated_at: null, source: null };
  }
}

export type CruiseSourcePolicy = "cache" | "live" | "hybrid";

function getCruiseSourcePolicy(): CruiseSourcePolicy {
  const raw = (getEnvOptional("CRUISE_SOURCE_POLICY") || "cache").toLowerCase();
  if (raw === "live" || raw === "hybrid" || raw === "cache") return raw;
  return "cache";
}

function getCruiseProviderTimeoutMs(): number {
  return getEnvNumber("CRUISE_PROVIDER_TIMEOUT_MS", 5000, { min: 100, max: 60000 });
}

function getCruiseCacheMaxAgeHours(): number {
  return getEnvNumber("CRUISE_CACHE_MAX_AGE_HOURS", 72, { min: 1, max: 720 });
}

export async function loadCruiseSailings(opts?: {
  policy?: CruiseSourcePolicy;
  timeoutMs?: number;
  liveFetcher?: (timeoutMs: number) => Promise<{ sailings: CruiseSailing[] }>;
}): Promise<{
  sailings: CruiseSailing[];
  source: "cache" | "live_api" | "catalog_fallback";
  fallback_reason?: string;
  generated_at?: string;
}> {
  const policy = opts?.policy || getCruiseSourcePolicy();
  const timeoutMs = opts?.timeoutMs || getCruiseProviderTimeoutMs();
  const liveFetcher =
    opts?.liveFetcher || (async (ms: number) => fetchLiveCruiseProviderSailings(ms));

  const cacheRows = readCruises();
  const cacheMeta = readCruiseCacheMeta();
  const wantsLive = policy === "live" || policy === "hybrid";

  if (wantsLive) {
    const live = await liveFetcher(timeoutMs);
    if (live.sailings.length > 0 && policy === "live") {
      return { sailings: live.sailings, source: "live_api" };
    }
    if (live.sailings.length > 0 && policy === "hybrid") {
      const merged = [...live.sailings, ...cacheRows];
      const dedup = new Map<string, CruiseSailing>();
      for (const s of merged) dedup.set(s.sailing_id, s);
      return { sailings: Array.from(dedup.values()), source: "live_api" };
    }
    if (policy === "live" && cacheRows.length > 0) {
      return {
        sailings: cacheRows,
        source: "cache",
        fallback_reason: "live_no_results_fallback_cache",
        generated_at: cacheMeta.generated_at || undefined,
      };
    }
  }

  if (cacheRows.length > 0) {
    return {
      sailings: cacheRows,
      source: "cache",
      generated_at: cacheMeta.generated_at || undefined,
    };
  }

  return {
    sailings: [],
    source: "catalog_fallback",
    fallback_reason: "cruise_cache_missing",
  };
}

function buildPortAliasMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const sailing of readCruises()) {
    for (const port of sailing.ports) {
      const full = slugifyCruiseRoute(port.port_name);
      if (!full) continue;
      map.set(full, full);

      const locality = slugifyCruiseRoute(port.port_name.split(",")[0] || "");
      if (locality && !map.has(locality)) map.set(locality, full);

      const parts = full.split("-").filter(Boolean);
      if (parts.length > 1) {
        const minusLast = parts.slice(0, -1).join("-");
        if (minusLast && !map.has(minusLast)) map.set(minusLast, full);
      }

      const code = slugifyCruiseRoute(port.port_code || "");
      if (code && !map.has(code)) map.set(code, full);
    }
  }
  return map;
}

function addPortAliases(
  map: Map<string, string>,
  portName: string,
  portCode?: string
): void {
  const full = slugifyCruiseRoute(portName);
  if (!full) return;
  map.set(full, full);

  const locality = slugifyCruiseRoute(portName.split(",")[0] || "");
  if (locality && !map.has(locality)) map.set(locality, full);

  const parts = full.split("-").filter(Boolean);
  if (parts.length > 1) {
    const minusLast = parts.slice(0, -1).join("-");
    if (minusLast && !map.has(minusLast)) map.set(minusLast, full);
  }

  const code = slugifyCruiseRoute(portCode || "");
  if (code && !map.has(code)) map.set(code, full);
}

function buildEmbarkPortAliasMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const sailing of readCruises()) {
    addPortAliases(map, sailing.embark_port.port_name, sailing.embark_port.port_code);
  }
  return map;
}

export function getCruisePortCanonicalSlug(input: string): string {
  const q = slugifyCruiseRoute(input);
  const map = buildPortAliasMap();
  return map.get(q) || q;
}

export function getCruiseEmbarkPortCanonicalSlug(input: string): string {
  const q = slugifyCruiseRoute(input);
  const map = buildEmbarkPortAliasMap();
  return map.get(q) || q;
}

export function listCruiseCanonicalPortSlugs(): string[] {
  const set = new Set<string>();
  for (const canonical of buildPortAliasMap().values()) set.add(canonical);
  return Array.from(set).sort();
}

export function listCruiseEmbarkCanonicalPortSlugs(): string[] {
  const set = new Set<string>();
  for (const canonical of buildEmbarkPortAliasMap().values()) set.add(canonical);
  return Array.from(set).sort();
}

function matchCruise(s: CruiseSailing, type: CruisePayload["query"]["type"], value: string): boolean {
  const q = slugifyCruiseRoute(value);
  if (type === "line") return slugifyCruiseRoute(s.line_slug || s.line) === q;
  if (type === "ship") return slugifyCruiseRoute(s.ship_slug || s.ship) === q;
  if (type === "destination") return s.ports.some((p) => slugifyCruiseRoute(p.port_name).includes(q));
  if (type === "port") return s.ports.some((p) => slugifyCruiseRoute(p.port_name).includes(q) || slugifyCruiseRoute(p.port_code || "") === q);
  if (type === "calendar") return s.departure_date.startsWith(value.slice(0, 7));
  return (
    slugifyCruiseRoute(s.line).includes(q) ||
    slugifyCruiseRoute(s.ship).includes(q) ||
    s.ports.some((p) => slugifyCruiseRoute(p.port_name).includes(q))
  );
}

export function listCruisePortSlugs(): string[] {
  return Array.from(buildPortAliasMap().keys()).sort();
}

export function listCruiseEmbarkPortSlugs(): string[] {
  return Array.from(buildEmbarkPortAliasMap().keys()).sort();
}

export function listCruiseShipSlugs(): string[] {
  const set = new Set<string>();
  for (const sailing of readCruises()) {
    const slug = slugifyCruiseRoute(sailing.ship_slug || sailing.ship);
    if (slug) set.add(slug);
  }
  return Array.from(set).sort();
}

export function normalizeCruiseSortMode(input?: string | null): CruiseSortMode {
  if (input === "price" || input === "duration" || input === "departure" || input === "popular") {
    return input;
  }
  return "departure";
}

function demandScore(sailing: CruiseSailing): number {
  const level = sailing.sailing_context?.demand_level;
  if (level === "very-high") return 4;
  if (level === "high") return 3;
  if (level === "medium") return 2;
  if (level === "low") return 1;
  return 0;
}

function compareAsc(a: string, b: string): number {
  return a.localeCompare(b);
}

export function sortCruises(cruises: CruiseSailing[], mode: CruiseSortMode): CruiseSailing[] {
  const rows = [...cruises];
  rows.sort((a, b) => {
    if (mode === "price") {
      const ap = a.starting_price?.amount;
      const bp = b.starting_price?.amount;
      const aMissing = typeof ap !== "number";
      const bMissing = typeof bp !== "number";
      if (aMissing && bMissing) return compareAsc(a.sailing_id, b.sailing_id);
      if (aMissing) return 1;
      if (bMissing) return -1;
      if (ap !== bp) return ap - bp;
      const dep = compareAsc(a.departure_date, b.departure_date);
      if (dep !== 0) return dep;
      return compareAsc(a.sailing_id, b.sailing_id);
    }

    if (mode === "duration") {
      if (a.duration_days !== b.duration_days) return a.duration_days - b.duration_days;
      const dep = compareAsc(a.departure_date, b.departure_date);
      if (dep !== 0) return dep;
      return compareAsc(a.sailing_id, b.sailing_id);
    }

    if (mode === "popular") {
      const ad = demandScore(a);
      const bd = demandScore(b);
      if (ad !== bd) return bd - ad;
      const ap = typeof a.starting_price?.amount === "number" ? a.starting_price.amount : Number.POSITIVE_INFINITY;
      const bp = typeof b.starting_price?.amount === "number" ? b.starting_price.amount : Number.POSITIVE_INFINITY;
      if (ap !== bp) return ap - bp;
      const dep = compareAsc(a.departure_date, b.departure_date);
      if (dep !== 0) return dep;
      return compareAsc(a.sailing_id, b.sailing_id);
    }

    // departure default
    const dep = compareAsc(a.departure_date, b.departure_date);
    if (dep !== 0) return dep;
    return compareAsc(a.sailing_id, b.sailing_id);
  });
  return rows;
}

function summarize(cruises: CruiseSailing[], sortMode: CruiseSortMode): CruisePayload["summary"] {
  if (cruises.length === 0) {
    return {
      total_results: 0,
      sort_mode: sortMode,
      min_duration_days: 0,
      max_duration_days: 0,
      popular_lines: [],
    };
  }

  const durations = cruises.map((c) => c.duration_days);
  const priced = cruises.filter((c) => typeof c.starting_price?.amount === "number");
  const prices = priced.map((c) => c.starting_price!.amount);
  const lines = new Map<string, number>();

  for (const c of cruises) {
    lines.set(c.line, (lines.get(c.line) || 0) + 1);
  }

  return {
    total_results: cruises.length,
    sort_mode: sortMode,
    min_duration_days: Math.min(...durations),
    max_duration_days: Math.max(...durations),
    price_range:
      prices.length > 0
        ? {
            min: Math.min(...prices),
            max: Math.max(...prices),
            currency: priced[0].starting_price?.currency || "USD",
          }
        : undefined,
    popular_lines: Array.from(lines.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([line]) => line)
      .slice(0, 5),
  };
}

function riskSummary(cruises: CruiseSailing[]): string {
  const highDemand = cruises.filter(
    (c) => c.sailing_context?.demand_level === "high" || c.sailing_context?.demand_level === "very-high"
  ).length;
  if (highDemand === 0) return "Demand currently stable across matching sailings.";
  if (highDemand >= Math.ceil(cruises.length / 2)) {
    return "High demand detected across many matching sailings — consider booking early.";
  }
  return "Some high-demand sailings detected — compare options and availability windows.";
}

export async function buildCruisePayload(params: {
  type: CruisePayload["query"]["type"];
  value: string;
  dateStart?: string;
  dateEnd?: string;
  sortMode?: CruiseSortMode;
}): Promise<CruisePayload> {
  const loaded = await loadCruiseSailings();
  const queryValue =
    params.type === "port"
      ? getCruisePortCanonicalSlug(params.value)
      : params.value;

  const cruises = loaded.sailings;
  let filtered = cruises.filter((c) => matchCruise(c, params.type, queryValue));

  if (params.dateStart) {
    filtered = filtered.filter((c) => c.departure_date >= params.dateStart!);
  }
  if (params.dateEnd) {
    filtered = filtered.filter((c) => c.departure_date <= params.dateEnd!);
  }

  const sortMode = params.sortMode || "departure";
  filtered = sortCruises(filtered, sortMode);

  const action = resolveCruiseAction(filtered);
  const observations = filtered
    .flatMap((c) => c.sailing_context?.notes || [])
    .filter(Boolean)
    .slice(0, 6);

  const payload: CruisePayload = {
    payload_id: `cruise:${params.type}:${slugifyCruiseRoute(queryValue)}:${new Date().toISOString()}`,
    query: {
      type: params.type,
      value: queryValue,
      date_range: params.dateStart
        ? {
            start: params.dateStart,
            end: params.dateEnd,
          }
        : undefined,
    },
    cruises: filtered,
    summary: summarize(filtered, sortMode),
    context: {
      risk_summary: riskSummary(filtered),
      recent_observations: observations,
      last_updated: new Date().toISOString(),
    },
    action: {
      cruise_bookings: action.bookings,
    },
    diagnostics: {
      source: loaded.source === "live_api" ? "live_api" : action.source,
      cache_status: loaded.source === "live_api" ? "bypass" : action.cache_status,
      stale:
        loaded.source === "live_api"
          ? false
          : staleFromUpdatedAt(
              loaded.generated_at || action.last_cache_build,
              getCruiseCacheMaxAgeHours()
            ),
      last_updated:
        loaded.source === "live_api"
          ? new Date().toISOString()
          : loaded.generated_at || action.last_cache_build,
      stale_after:
        loaded.source === "live_api"
          ? null
          : isoAfterHours(
              loaded.generated_at || action.last_cache_build,
              getCruiseCacheMaxAgeHours()
            ),
      fallback_reason: loaded.fallback_reason || action.fallback_reason || null,
    },
  };

  const validated = CruisePayloadSchema.safeParse(payload);
  if (!validated.success) {
    throw new Error(`Invalid cruise payload: ${validated.error.issues[0]?.message || "unknown"}`);
  }
  return validated.data as CruisePayload;
}

export async function buildEmbarkCruisePayload(params: {
  port: string;
  dateStart?: string;
  dateEnd?: string;
  sortMode?: CruiseSortMode;
}): Promise<{
  query: { port: string };
  cruises: CruiseSailing[];
  summary: CruisePayload["summary"];
  context: CruisePayload["context"];
  diagnostics: CruisePayload["diagnostics"];
}> {
  const loaded = await loadCruiseSailings();
  const canonicalPort = getCruiseEmbarkPortCanonicalSlug(params.port);
  const dateStart = params.dateStart || null;
  const dateEnd = params.dateEnd || null;
  const generatedAt = loaded.generated_at || null;
  let filtered = loaded.sailings.filter(
    (sailing) => slugifyCruiseRoute(sailing.embark_port.port_name) === canonicalPort
  );

  if (dateStart) {
    filtered = filtered.filter((c) => c.departure_date >= dateStart);
  }
  if (dateEnd) {
    filtered = filtered.filter((c) => c.departure_date <= dateEnd);
  }

  const sortMode = params.sortMode || "departure";
  filtered = sortCruises(filtered, sortMode);

  const observations = filtered
    .flatMap((c) => c.sailing_context?.notes || [])
    .filter(Boolean)
    .slice(0, 6);

  return {
    query: { port: canonicalPort },
    cruises: filtered,
    summary: summarize(filtered, sortMode),
    context: {
      risk_summary: riskSummary(filtered),
      recent_observations: observations,
      last_updated: new Date().toISOString(),
    },
    diagnostics: {
      source: loaded.source === "live_api" ? "live_api" : "cache",
      cache_status: loaded.source === "live_api" ? "bypass" : "fresh",
      stale:
        loaded.source === "live_api"
          ? false
          : staleFromUpdatedAt(generatedAt, getCruiseCacheMaxAgeHours()),
      last_updated: generatedAt || new Date().toISOString(),
      stale_after:
        loaded.source === "live_api"
          ? null
          : isoAfterHours(generatedAt, getCruiseCacheMaxAgeHours()),
      fallback_reason: loaded.fallback_reason || null,
    },
  };
}
