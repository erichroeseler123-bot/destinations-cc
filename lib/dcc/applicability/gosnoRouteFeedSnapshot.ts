import fs from "node:fs";
import path from "node:path";
import { rfc8785Canonicalize, sha256HexFull } from "../machine/v03/rfc8785AndJws";
import {
  readDurableLedgerState,
  runDurableLedgerTransaction,
} from "../storage/durableTransactionalStore";
import {
  registerGoSnoDisplayPricingResolver,
  registerGoSnoSnapshotStateResolver,
} from "../travelReferenceCore";
import type { CorridorId } from "./contextModel";

export const GOSNO_ROUTE_FEED_URL = "https://gosno.co/api/public/route-feed" as const;
export const DEFAULT_GOSNO_SNAPSHOT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
export const SCHEDULED_GOSNO_FEED_REFRESH_CRON = "0 */6 * * *" as const; // Every 6 hours (4x before 24h expiry)
export const SCHEDULED_GOSNO_FEED_REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
export const SCHEDULED_GOSNO_FEED_REFRESH_PATH =
  "/api/internal/gosno/route-feed-refresh" as const;
export const GOSNO_PRICE_FALLBACK_MESSAGE = "Check current price with GoSno" as const;

export type GoSnoVehicleClass = "suv" | "van";
export type GoSnoRouteDirection = "OUTBOUND" | "RETURN";

export interface GoSnoRouteFeedOneWayOffer {
  record_id: string;
  offer_id: string;
  route_id: string;
  direction: GoSnoRouteDirection;
  trip_type: "ONE_WAY";
  origin: string;
  destination: string;
  vehicle_class: GoSnoVehicleClass;
  vehicle_label: string;
  status: string;
  next_step: string;
  seating_limit: number;
  gear_policy?: string;
  pickup_instructions?: string;
  canonical_booking_url: string;
  quote_url: string;
  pricing: {
    amount_cents: number;
    amount_usd: number;
    currency: string;
    pricing_model: string;
    fuel_surcharges?: number | null;
    gate_fees?: number | null;
    inclusions?: string[];
    verification_state?: string;
    supporting_sources?: string[];
  };
  booking_eligibility: {
    published_booking_eligible: boolean;
    online_bookable: boolean;
    status: string;
    next_step: string;
    booking_url: string;
    quote_url: string;
    rezdy_product_code: string | null;
    distinction_rule?: string;
    live_availability?: {
      requires_query: boolean;
      availability_endpoint: string;
      checkout_endpoint: string;
      note?: string;
    };
    verification_state?: string;
    supporting_sources?: string[];
  };
  verification?: {
    state: string;
    provenance: string;
    source_module: string;
    last_verified: string;
  };
}

export interface GoSnoRouteFeedRoundTripOffer {
  record_id: string;
  offer_id: string;
  route_id: string;
  outbound_route_id: string;
  return_route_id: string;
  airport: string;
  resort: string;
  trip_type: "ROUND_TRIP";
  vehicle_class: GoSnoVehicleClass;
  vehicle_label: string;
  status: string;
  next_step: string;
  seating_limit: number;
  gear_policy?: string;
  outbound_pickup_instructions?: string;
  return_pickup_instructions?: string;
  canonical_booking_url: string;
  round_trip_service_url?: string;
  quote_url: string;
  pricing: {
    outbound_amount_usd: number;
    return_amount_usd: number;
    total_amount_usd: number;
    total_amount_cents: number;
    currency: string;
    pricing_model: string;
  };
  booking_eligibility?: {
    published_booking_eligible: boolean;
    online_bookable: boolean;
    status: string;
    next_step: string;
    outbound_rezdy_product_code?: string | null;
    return_rezdy_product_code?: string | null;
    booking_url: string;
    availability_endpoint?: string;
    checkout_endpoint?: string;
    quote_url: string;
  };
}

export interface GoSnoReconciledServiceOffer {
  serviceId: string;
  category: string;
  title: string;
  origin: string;
  destination: string;
  tripTypes: string[];
  vehicleClass: "suv" | "van" | "multi_vehicle" | "none";
  seatingLimit: number | null;
  referencePriceUsd: number | null;
  roundTripReferencePriceUsd?: number | null;
  afterHoursSurchargeUsd?: number | null;
  currency: string;
  status: string;
  nextStep: string;
  reservationsOpenDate?: string;
  canonicalUrl: string;
  actionUrl: string;
  pickupInstructions: string | null;
  gearPolicy: string | null;
  notes: string;
  groupExamples?: Array<{
    passengers: number;
    suggestedCombination: string;
    vanCount: number;
    suvCount: number;
    confirmationPolicy: string;
  }>;
}

export interface GoSnoRouteFeedPayload {
  spec: "dcc-route-feed";
  version: string;
  generated_at: string;
  routes: GoSnoRouteFeedOneWayOffer[];
  round_trips: GoSnoRouteFeedRoundTripOffer[];
  reconciled_services: GoSnoReconciledServiceOffer[];
  [key: string]: unknown;
}

export interface GoSnoRouteFeedVersionedSnapshot {
  snapshotId: string;
  sourceUrl: string;
  fetchedAt: string;
  expiresAt: string;
  ttlMs: number;
  feedSpec: "dcc-route-feed";
  feedVersion: string;
  feedGeneratedAt: string;
  contentHash: string;
  rawPayloadHash: string;
  routeCount: number;
  roundTripCount: number;
  reconciledServiceCount: number;
  feed: GoSnoRouteFeedPayload;
}

export interface GoSnoRouteFeedRefreshMeta {
  lastRefreshAttemptAt: string | null;
  lastRefreshStatus: "ok" | "retained_last_valid_after_error";
  lastRefreshError: string | null;
  consecutiveFailures: number;
}

export type GoSnoSnapshotFreshnessStatus =
  | "fresh"
  | "retained_after_failed_refresh"
  | "expired";

export interface ActiveGoSnoSnapshotState {
  snapshot: GoSnoRouteFeedVersionedSnapshot;
  refreshMeta: GoSnoRouteFeedRefreshMeta;
  freshnessStatus: GoSnoSnapshotFreshnessStatus;
  isExpired: boolean;
  ageMs: number;
  ageLabel: string;
  statusBanner: string;
  priceFallbackMessage: typeof GOSNO_PRICE_FALLBACK_MESSAGE;
}

export interface GoSnoRouteFeedValidationResult {
  valid: boolean;
  errors: string[];
  payload?: GoSnoRouteFeedPayload;
}

function resolveDefaultBaselineSnapshotPath(): string {
  const directCandidate = path.join(
    process.cwd(),
    "data",
    "network",
    "audit",
    "satellite",
    "gosno",
    "route-feed.snapshot.json",
  );
  if (fs.existsSync(directCandidate)) {
    return directCandidate;
  }
  const monorepoRootCandidate = directCandidate.replace(
    /[\\/]+apps[\\/]+[^\\/]+(?=[\\/]+data[\\/])/,
    "",
  );
  if (
    monorepoRootCandidate !== directCandidate &&
    fs.existsSync(monorepoRootCandidate)
  ) {
    return monorepoRootCandidate;
  }
  return directCandidate;
}

const BASELINE_SNAPSHOT_PATH = resolveDefaultBaselineSnapshotPath();

let cachedBaselineSnapshot: GoSnoRouteFeedVersionedSnapshot | null = null;

export function formatSnapshotAge(ageMs: number): string {
  const clamped = Math.max(0, Math.floor(ageMs));
  const totalSeconds = Math.floor(clamped / 1000);
  if (totalSeconds < 60) {
    return `${totalSeconds}s old`;
  }
  const totalMinutes = Math.floor(totalSeconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes}m old`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours < 48) {
    return minutes > 0 ? `${hours}h ${minutes}m old` : `${hours}h old`;
  }
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days}d ${remHours}h old` : `${days}d old`;
}

export function validateGoSnoRouteFeedPayload(
  raw: unknown,
): GoSnoRouteFeedValidationResult {
  const errors: string[] = [];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      valid: false,
      errors: ["GoSno route feed payload must be a JSON object."],
    };
  }

  const obj = raw as Record<string, unknown>;
  if (obj.spec !== "dcc-route-feed") {
    errors.push(
      `Invalid feed spec "${String(obj.spec)}"; expected "dcc-route-feed".`,
    );
  }
  if (typeof obj.version !== "string" || !obj.version.trim()) {
    errors.push("Missing or empty feed version string.");
  }
  if (
    typeof obj.generated_at !== "string" ||
    !Number.isFinite(Date.parse(obj.generated_at))
  ) {
    errors.push("Missing or invalid ISO timestamp in generated_at.");
  }

  if (!Array.isArray(obj.routes) || obj.routes.length === 0) {
    errors.push("routes must be a non-empty array of one-way offers.");
  } else {
    const seenOfferIds = new Set<string>();
    const seenRouteVehicleKeys = new Set<string>();
    for (let i = 0; i < obj.routes.length; i++) {
      const r = obj.routes[i] as Record<string, unknown> | null;
      if (!r || typeof r !== "object") {
        errors.push(`routes[${i}] is not an object.`);
        continue;
      }
      const offerId = typeof r.offer_id === "string" ? r.offer_id.trim() : "";
      const routeId = typeof r.route_id === "string" ? r.route_id.trim() : "";
      const direction = r.direction;
      const origin = typeof r.origin === "string" ? r.origin.trim() : "";
      const destination =
        typeof r.destination === "string" ? r.destination.trim() : "";
      const vehicleClass = r.vehicle_class;
      const seatingLimit = r.seating_limit;
      const canonicalBookingUrl =
        typeof r.canonical_booking_url === "string"
          ? r.canonical_booking_url.trim()
          : "";
      const quoteUrl =
        typeof r.quote_url === "string" ? r.quote_url.trim() : "";
      const pricing =
        r.pricing && typeof r.pricing === "object"
          ? (r.pricing as Record<string, unknown>)
          : null;

      if (!offerId) errors.push(`routes[${i}] missing offer_id.`);
      if (!routeId) errors.push(`routes[${i}] missing route_id.`);
      if (direction !== "OUTBOUND" && direction !== "RETURN") {
        errors.push(
          `routes[${i}] (${offerId}) has invalid direction "${String(direction)}".`,
        );
      }
      if (!origin || !destination) {
        errors.push(`routes[${i}] (${offerId}) missing origin or destination.`);
      }
      if (vehicleClass !== "suv" && vehicleClass !== "van") {
        errors.push(
          `routes[${i}] (${offerId}) has invalid vehicle_class "${String(vehicleClass)}".`,
        );
      }
      if (
        typeof seatingLimit !== "number" ||
        !Number.isInteger(seatingLimit) ||
        seatingLimit <= 0
      ) {
        errors.push(
          `routes[${i}] (${offerId}) has invalid seating_limit "${String(seatingLimit)}".`,
        );
      }
      if (!canonicalBookingUrl.startsWith("https://")) {
        errors.push(
          `routes[${i}] (${offerId}) has invalid canonical_booking_url.`,
        );
      }
      if (!quoteUrl.startsWith("https://")) {
        errors.push(`routes[${i}] (${offerId}) has invalid quote_url.`);
      }
      if (!pricing) {
        errors.push(`routes[${i}] (${offerId}) missing pricing object.`);
      } else {
        const usd = pricing.amount_usd;
        const cents = pricing.amount_cents;
        const currency = pricing.currency;
        if (typeof usd !== "number" || !Number.isFinite(usd) || usd <= 0) {
          errors.push(
            `routes[${i}] (${offerId}) has invalid pricing.amount_usd "${String(usd)}".`,
          );
        } else if (
          typeof cents !== "number" ||
          cents !== Math.round(usd * 100)
        ) {
          errors.push(
            `routes[${i}] (${offerId}) pricing.amount_cents (${String(cents)}) does not match amount_usd (${usd}).`,
          );
        }
        if (currency !== "USD") {
          errors.push(
            `routes[${i}] (${offerId}) has unsupported currency "${String(currency)}".`,
          );
        }
      }

      if (offerId) {
        if (seenOfferIds.has(offerId)) {
          errors.push(`Duplicate one-way offer_id "${offerId}".`);
        }
        seenOfferIds.add(offerId);
      }
      if (routeId && (vehicleClass === "suv" || vehicleClass === "van")) {
        const rvKey = `${routeId}:${vehicleClass}`;
        if (seenRouteVehicleKeys.has(rvKey)) {
          errors.push(
            `Duplicate one-way route_id + vehicle_class combination "${rvKey}".`,
          );
        }
        seenRouteVehicleKeys.add(rvKey);
      }
    }
  }

  if (!Array.isArray(obj.round_trips) || obj.round_trips.length === 0) {
    errors.push("round_trips must be a non-empty array of round-trip offers.");
  } else {
    const seenRtOfferIds = new Set<string>();
    const seenRtRouteVehicleKeys = new Set<string>();
    for (let i = 0; i < obj.round_trips.length; i++) {
      const rt = obj.round_trips[i] as Record<string, unknown> | null;
      if (!rt || typeof rt !== "object") {
        errors.push(`round_trips[${i}] is not an object.`);
        continue;
      }
      const offerId = typeof rt.offer_id === "string" ? rt.offer_id.trim() : "";
      const routeId = typeof rt.route_id === "string" ? rt.route_id.trim() : "";
      const outboundRouteId =
        typeof rt.outbound_route_id === "string"
          ? rt.outbound_route_id.trim()
          : "";
      const returnRouteId =
        typeof rt.return_route_id === "string" ? rt.return_route_id.trim() : "";
      const airport = typeof rt.airport === "string" ? rt.airport.trim() : "";
      const resort = typeof rt.resort === "string" ? rt.resort.trim() : "";
      const vehicleClass = rt.vehicle_class;
      const pricing =
        rt.pricing && typeof rt.pricing === "object"
          ? (rt.pricing as Record<string, unknown>)
          : null;

      if (!offerId || !routeId || !outboundRouteId || !returnRouteId) {
        errors.push(
          `round_trips[${i}] (${offerId}) missing offer_id, route_id, outbound_route_id, or return_route_id.`,
        );
      }
      if (!airport || !resort) {
        errors.push(
          `round_trips[${i}] (${offerId}) missing airport or resort.`,
        );
      }
      if (vehicleClass !== "suv" && vehicleClass !== "van") {
        errors.push(
          `round_trips[${i}] (${offerId}) has invalid vehicle_class "${String(vehicleClass)}".`,
        );
      }
      if (!pricing) {
        errors.push(`round_trips[${i}] (${offerId}) missing pricing object.`);
      } else {
        const outUsd = pricing.outbound_amount_usd;
        const retUsd = pricing.return_amount_usd;
        const totalUsd = pricing.total_amount_usd;
        const totalCents = pricing.total_amount_cents;
        if (
          typeof outUsd !== "number" ||
          !Number.isFinite(outUsd) ||
          outUsd <= 0 ||
          typeof retUsd !== "number" ||
          !Number.isFinite(retUsd) ||
          retUsd <= 0 ||
          typeof totalUsd !== "number" ||
          totalUsd !== outUsd + retUsd ||
          typeof totalCents !== "number" ||
          totalCents !== Math.round(totalUsd * 100)
        ) {
          errors.push(
            `round_trips[${i}] (${offerId}) has inconsistent round-trip pricing breakdown.`,
          );
        }
      }

      if (offerId) {
        if (seenRtOfferIds.has(offerId)) {
          errors.push(`Duplicate round-trip offer_id "${offerId}".`);
        }
        seenRtOfferIds.add(offerId);
      }
      if (routeId && (vehicleClass === "suv" || vehicleClass === "van")) {
        const rvKey = `${routeId}:${vehicleClass}`;
        if (seenRtRouteVehicleKeys.has(rvKey)) {
          errors.push(
            `Duplicate round-trip route_id + vehicle_class combination "${rvKey}".`,
          );
        }
        seenRtRouteVehicleKeys.add(rvKey);
      }
    }
  }

  if (obj.reconciled_services !== undefined) {
    if (!Array.isArray(obj.reconciled_services)) {
      errors.push("reconciled_services must be an array when present.");
    } else {
      for (let i = 0; i < obj.reconciled_services.length; i++) {
        const svc = obj.reconciled_services[i] as Record<string, unknown> | null;
        if (!svc || typeof svc !== "object") {
          errors.push(`reconciled_services[${i}] is not an object.`);
          continue;
        }
        if (typeof svc.serviceId !== "string" || !svc.serviceId.trim()) {
          errors.push(`reconciled_services[${i}] missing serviceId.`);
        }
        if (
          svc.referencePriceUsd !== null &&
          svc.referencePriceUsd !== undefined &&
          (typeof svc.referencePriceUsd !== "number" ||
            !Number.isFinite(svc.referencePriceUsd) ||
            svc.referencePriceUsd <= 0)
        ) {
          errors.push(
            `reconciled_services[${i}] (${String(svc.serviceId)}) has invalid referencePriceUsd.`,
          );
        }
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    payload: {
      ...(obj as GoSnoRouteFeedPayload),
      reconciled_services: Array.isArray(obj.reconciled_services)
        ? (obj.reconciled_services as GoSnoReconciledServiceOffer[])
        : [],
    },
  };
}

export function createGoSnoRouteFeedSnapshot(
  rawPayload: unknown,
  options?: {
    fetchedAt?: string;
    ttlMs?: number;
    expiresAt?: string;
    sourceUrl?: string;
  },
): GoSnoRouteFeedVersionedSnapshot {
  const validation = validateGoSnoRouteFeedPayload(rawPayload);
  if (!validation.valid || !validation.payload) {
    throw new Error(
      `Invalid GoSno route feed payload: ${validation.errors.join("; ")}`,
    );
  }
  const payload = validation.payload;
  const fetchedAt = options?.fetchedAt ?? new Date().toISOString();
  const ttlMs =
    typeof options?.ttlMs === "number" && options.ttlMs > 0
      ? options.ttlMs
      : DEFAULT_GOSNO_SNAPSHOT_TTL_MS;
  const expiresAt =
    options?.expiresAt ??
    new Date(Date.parse(fetchedAt) + ttlMs).toISOString();
  const sourceUrl = options?.sourceUrl ?? GOSNO_ROUTE_FEED_URL;

  const { generated_at: _ignoredGeneratedAt, ...deterministicCatalog } = payload;
  const contentHash = `sha256:${sha256HexFull(
    rfc8785Canonicalize(deterministicCatalog),
  )}`;
  const rawPayloadHash = `sha256:${sha256HexFull(rfc8785Canonicalize(payload))}`;
  const feedVersion = String(payload.version);
  const snapshotId = `evsnap:gosno-route-feed:v${feedVersion}:${contentHash.slice(7, 19)}`;

  return {
    snapshotId,
    sourceUrl,
    fetchedAt,
    expiresAt,
    ttlMs,
    feedSpec: "dcc-route-feed",
    feedVersion,
    feedGeneratedAt: String(payload.generated_at),
    contentHash,
    rawPayloadHash,
    routeCount: payload.routes.length,
    roundTripCount: payload.round_trips.length,
    reconciledServiceCount: payload.reconciled_services.length,
    feed: payload,
  };
}

let cachedBaselineSnapshotPath: string | null = null;

export function getBaselineGoSnoRouteFeedSnapshot(): GoSnoRouteFeedVersionedSnapshot {
  const customBaselinePath = process.env.DCC_GOSNO_BASELINE_SNAPSHOT_PATH?.trim();
  const activePath = customBaselinePath
    ? path.resolve(customBaselinePath)
    : BASELINE_SNAPSHOT_PATH;
  if (cachedBaselineSnapshot && cachedBaselineSnapshotPath === activePath) {
    return structuredClone(cachedBaselineSnapshot);
  }
  const rawText = fs.readFileSync(activePath, "utf8");
  const parsed = JSON.parse(rawText) as GoSnoRouteFeedVersionedSnapshot;
  const validation = validateGoSnoRouteFeedPayload(parsed.feed);
  if (!validation.valid) {
    throw new Error(
      `Baseline GoSno route-feed snapshot failed validation: ${validation.errors.join("; ")}`,
    );
  }
  cachedBaselineSnapshot = parsed;
  cachedBaselineSnapshotPath = activePath;
  return structuredClone(parsed);
}

export function saveGoSnoRouteFeedSnapshot(
  snapshot: GoSnoRouteFeedVersionedSnapshot,
  refreshMeta?: Partial<GoSnoRouteFeedRefreshMeta>,
): GoSnoRouteFeedVersionedSnapshot {
  const validation = validateGoSnoRouteFeedPayload(snapshot.feed);
  if (!validation.valid) {
    throw new Error(
      `Cannot save invalid GoSno route-feed snapshot: ${validation.errors.join("; ")}`,
    );
  }
  runDurableLedgerTransaction((state) => {
    state.gosnoRouteFeedSnapshot = structuredClone(snapshot);
    state.gosnoRouteFeedRefreshMeta = {
      lastRefreshAttemptAt:
        refreshMeta?.lastRefreshAttemptAt ?? snapshot.fetchedAt,
      lastRefreshStatus: refreshMeta?.lastRefreshStatus ?? "ok",
      lastRefreshError: refreshMeta?.lastRefreshError ?? null,
      consecutiveFailures: refreshMeta?.consecutiveFailures ?? 0,
    };
  });
  return snapshot;
}

export function getActiveGoSnoRouteFeedSnapshotState(options?: {
  nowMs?: number;
  serverNowMs?: number;
}): ActiveGoSnoSnapshotState {
  const durable = readDurableLedgerState();
  const snapshot =
    durable.gosnoRouteFeedSnapshot ?? getBaselineGoSnoRouteFeedSnapshot();
  const refreshMeta: GoSnoRouteFeedRefreshMeta =
    durable.gosnoRouteFeedRefreshMeta ?? {
      lastRefreshAttemptAt: snapshot.fetchedAt,
      lastRefreshStatus: "ok",
      lastRefreshError: null,
      consecutiveFailures: 0,
    };

  const fetchedAtMs = Date.parse(snapshot.fetchedAt);
  const expiresAtMs = Date.parse(snapshot.expiresAt);

  // Current fare freshness always uses server time, including for the bundled snapshot on a cold start.
  const evalNowMs =
    typeof options?.serverNowMs === "number" && Number.isFinite(options.serverNowMs)
      ? options.serverNowMs
      : typeof options?.nowMs === "number" && Number.isFinite(options.nowMs)
        ? options.nowMs
        : Date.now();

  const ageMs = Math.max(0, evalNowMs - fetchedAtMs);
  const ageLabel = formatSnapshotAge(ageMs);
  const isExpired = evalNowMs > expiresAtMs;

  let freshnessStatus: GoSnoSnapshotFreshnessStatus;
  let statusBanner: string;

  if (isExpired) {
    freshnessStatus = "expired";
    statusBanner = `${GOSNO_PRICE_FALLBACK_MESSAGE} — saved GoSno route-feed snapshot (${snapshot.feedVersion}, ${snapshot.contentHash.slice(0, 19)}) expired (${ageLabel}, fetched ${snapshot.fetchedAt}).`;
  } else if (
    refreshMeta.lastRefreshStatus === "retained_last_valid_after_error"
  ) {
    freshnessStatus = "retained_after_failed_refresh";
    statusBanner = `Feed refresh failed (${refreshMeta.lastRefreshError || "unavailable or invalid feed"}); retaining last valid GoSno snapshot (${ageLabel}, fetched ${snapshot.fetchedAt}, hash ${snapshot.contentHash.slice(0, 19)}).`;
  } else {
    freshnessStatus = "fresh";
    statusBanner = `Evaluated from validated GoSno route-feed snapshot (${snapshot.feedVersion}, ${snapshot.contentHash.slice(0, 19)}, ${ageLabel}, fetched ${snapshot.fetchedAt}).`;
  }

  return {
    snapshot,
    refreshMeta,
    freshnessStatus,
    isExpired,
    ageMs,
    ageLabel,
    statusBanner,
    priceFallbackMessage: GOSNO_PRICE_FALLBACK_MESSAGE,
  };
}

/**
 * Historical replay helper kept strictly separate from current fare freshness evaluation.
 */
export function evaluateHistoricalGoSnoRouteFeedSnapshotState(params: {
  snapshot: GoSnoRouteFeedVersionedSnapshot;
  replayAtIso: string;
}): ActiveGoSnoSnapshotState {
  const { snapshot, replayAtIso } = params;
  const replayAtMs = Date.parse(replayAtIso);
  if (!Number.isFinite(replayAtMs)) {
    throw new Error(`Invalid historical replayAtIso "${replayAtIso}".`);
  }
  const fetchedAtMs = Date.parse(snapshot.fetchedAt);
  const expiresAtMs = Date.parse(snapshot.expiresAt);
  const ageMs = Math.max(0, replayAtMs - fetchedAtMs);
  const ageLabel = formatSnapshotAge(ageMs);
  const isExpired = replayAtMs > expiresAtMs;
  const freshnessStatus: GoSnoSnapshotFreshnessStatus = isExpired
    ? "expired"
    : "fresh";
  const statusBanner = isExpired
    ? `${GOSNO_PRICE_FALLBACK_MESSAGE} — historical GoSno route-feed snapshot (${snapshot.feedVersion}, ${snapshot.contentHash.slice(0, 19)}) was expired at replay time (${ageLabel}, fetched ${snapshot.fetchedAt}).`
    : `Historical replay from validated GoSno route-feed snapshot (${snapshot.feedVersion}, ${snapshot.contentHash.slice(0, 19)}, ${ageLabel} at ${replayAtIso}, fetched ${snapshot.fetchedAt}).`;

  return {
    snapshot,
    refreshMeta: {
      lastRefreshAttemptAt: snapshot.fetchedAt,
      lastRefreshStatus: "ok",
      lastRefreshError: null,
      consecutiveFailures: 0,
    },
    freshnessStatus,
    isExpired,
    ageMs,
    ageLabel,
    statusBanner,
    priceFallbackMessage: GOSNO_PRICE_FALLBACK_MESSAGE,
  };
}

export function isProductionGoSnoFeedEnvironment(): boolean {
  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();
  const dccScope = process.env.DCC_ENVIRONMENT_SCOPE?.trim().toLowerCase();
  return vercelEnv === "production" || dccScope === "production";
}

export async function refreshGoSnoRouteFeedSnapshot(options?: {
  feedUrl?: string;
  fetchImpl?: typeof fetch;
  now?: Date;
  ttlMs?: number;
}): Promise<{
  ok: boolean;
  retainedLastValid: boolean;
  error: string | null;
  snapshot: GoSnoRouteFeedVersionedSnapshot;
  refreshMeta: GoSnoRouteFeedRefreshMeta;
  state: ActiveGoSnoSnapshotState;
}> {
  const isProd = isProductionGoSnoFeedEnvironment();
  const feedUrl = isProd
    ? GOSNO_ROUTE_FEED_URL
    : options?.feedUrl?.trim()
      ? options.feedUrl.trim()
      : GOSNO_ROUTE_FEED_URL;
  const fetchFn = options?.fetchImpl ?? fetch;
  const now = options?.now ?? new Date();
  const nowIso = now.toISOString();
  const nowMs = now.getTime();
  const ttlMs = isProd
    ? DEFAULT_GOSNO_SNAPSHOT_TTL_MS
    : typeof options?.ttlMs === "number" &&
        Number.isFinite(options.ttlMs) &&
        options.ttlMs > 0
      ? options.ttlMs
      : DEFAULT_GOSNO_SNAPSHOT_TTL_MS;

  try {
    const response = await fetchFn(feedUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(
        `GoSno route feed returned HTTP ${response.status} ${response.statusText || ""}`.trim(),
      );
    }

    let rawJson: unknown;
    try {
      rawJson = await response.json();
    } catch {
      throw new Error("GoSno route feed returned malformed non-JSON body.");
    }

    const nextSnapshot = createGoSnoRouteFeedSnapshot(rawJson, {
      fetchedAt: nowIso,
      ttlMs,
      sourceUrl: feedUrl,
    });

    const nextMeta: GoSnoRouteFeedRefreshMeta = {
      lastRefreshAttemptAt: nowIso,
      lastRefreshStatus: "ok",
      lastRefreshError: null,
      consecutiveFailures: 0,
    };

    runDurableLedgerTransaction((state) => {
      state.gosnoRouteFeedSnapshot = structuredClone(nextSnapshot);
      state.gosnoRouteFeedRefreshMeta = nextMeta;
    });

    const activeState = getActiveGoSnoRouteFeedSnapshotState({ nowMs });
    return {
      ok: true,
      retainedLastValid: false,
      error: null,
      snapshot: nextSnapshot,
      refreshMeta: nextMeta,
      state: activeState,
    };
  } catch (err) {
    const errorMsg =
      err instanceof Error
        ? err.message
        : "Unknown error refreshing GoSno route feed.";

    let retainedSnapshot!: GoSnoRouteFeedVersionedSnapshot;
    let nextMeta!: GoSnoRouteFeedRefreshMeta;

    runDurableLedgerTransaction((state) => {
      retainedSnapshot =
        state.gosnoRouteFeedSnapshot ?? getBaselineGoSnoRouteFeedSnapshot();
      state.gosnoRouteFeedSnapshot = structuredClone(retainedSnapshot);
      const prevFailures =
        state.gosnoRouteFeedRefreshMeta?.consecutiveFailures ?? 0;
      nextMeta = {
        lastRefreshAttemptAt: nowIso,
        lastRefreshStatus: "retained_last_valid_after_error",
        lastRefreshError: errorMsg,
        consecutiveFailures: prevFailures + 1,
      };
      state.gosnoRouteFeedRefreshMeta = nextMeta;
    });

    const activeState = getActiveGoSnoRouteFeedSnapshotState({ nowMs });
    return {
      ok: false,
      retainedLastValid: true,
      error: errorMsg,
      snapshot: retainedSnapshot,
      refreshMeta: nextMeta,
      state: activeState,
    };
  }
}

export function resetGoSnoRouteFeedSnapshotToBaseline(): GoSnoRouteFeedVersionedSnapshot {
  const baseline = getBaselineGoSnoRouteFeedSnapshot();
  runDurableLedgerTransaction((state) => {
    state.gosnoRouteFeedSnapshot = null;
    state.gosnoRouteFeedRefreshMeta = null;
  });
  return baseline;
}

const RESORT_CANONICAL_AND_CODE: ReadonlyArray<{
  canonicalName: string;
  routeCode: string;
  aliases: readonly string[];
}> = [
  {
    canonicalName: "Breckenridge",
    routeCode: "BRECKENRIDGE",
    aliases: ["breckenridge", "breck"],
  },
  {
    canonicalName: "Vail",
    routeCode: "VAIL",
    aliases: ["vail"],
  },
  {
    canonicalName: "Beaver Creek",
    routeCode: "BEAVER-CREEK",
    aliases: ["beaver creek", "beaver-creek", "beavercreek"],
  },
  {
    canonicalName: "Keystone",
    routeCode: "KEYSTONE",
    aliases: ["keystone"],
  },
  {
    canonicalName: "Copper Mountain",
    routeCode: "COPPER",
    aliases: ["copper mountain", "copper-mountain", "copper"],
  },
  {
    canonicalName: "Winter Park",
    routeCode: "WINTER-PARK",
    aliases: ["winter park", "winter-park", "winterpark"],
  },
  {
    canonicalName: "Steamboat Springs",
    routeCode: "STEAMBOAT",
    aliases: ["steamboat springs", "steamboat-springs", "steamboat"],
  },
  {
    canonicalName: "Aspen",
    routeCode: "ASPEN",
    aliases: ["aspen"],
  },
  {
    canonicalName: "Snowmass",
    routeCode: "SNOWMASS",
    aliases: ["snowmass", "snowmass village"],
  },
  {
    canonicalName: "Crested Butte",
    routeCode: "CRESTED-BUTTE",
    aliases: ["crested butte", "crested-butte", "mt crested butte"],
  },
  {
    canonicalName: "Arapahoe Basin",
    routeCode: "ARAPAHOE-BASIN",
    aliases: ["arapahoe basin", "arapahoe-basin", "a-basin", "abasin"],
  },
  {
    canonicalName: "Loveland",
    routeCode: "LOVELAND",
    aliases: ["loveland", "loveland ski area", "loveland-ski-area"],
  },
  {
    canonicalName: "Big Sky",
    routeCode: "BIG-SKY",
    aliases: ["big sky", "big sky resort", "big-sky"],
  },
];

function matchResortEntry(input: string | undefined): {
  canonicalName: string;
  routeCode: string;
} | null {
  if (!input) return null;
  const cleaned = input.trim().toLowerCase();
  if (!cleaned) return null;
  for (const entry of RESORT_CANONICAL_AND_CODE) {
    if (
      entry.canonicalName.toLowerCase() === cleaned ||
      entry.routeCode.toLowerCase() === cleaned ||
      entry.aliases.some((a) => cleaned === a || cleaned.includes(a))
    ) {
      return {
        canonicalName: entry.canonicalName,
        routeCode: entry.routeCode,
      };
    }
  }
  return null;
}

function isAirportCode(input: string | undefined): "DEN" | "COS" | "BZN" | null {
  if (!input) return null;
  const upper = input.trim().toUpperCase();
  if (upper === "DEN" || upper === "DIA" || upper.includes("DENVER")) {
    return "DEN";
  }
  if (upper === "COS" || upper.includes("COLORADO SPRINGS")) {
    return "COS";
  }
  if (upper === "BZN" || upper.includes("BOZEMAN")) {
    return "BZN";
  }
  return null;
}

export interface ResolvedGoSnoRouteContext {
  isGoSnoCorridorOrRoute: boolean;
  routeId: string | null;
  direction: GoSnoRouteDirection;
  origin: string;
  destination: string;
  airport: "DEN" | "COS" | "BZN";
  resort: string;
}

export function resolveGoSnoRouteContext(params: {
  offerId?: string;
  routeId?: string;
  origin?: string;
  destination?: string;
  direction?: GoSnoRouteDirection;
  corridorId?: CorridorId;
  snapshot?: GoSnoRouteFeedVersionedSnapshot;
}): ResolvedGoSnoRouteContext {
  const snapshot = params.snapshot ?? getBaselineGoSnoRouteFeedSnapshot();

  const normalizedOfferId = params.offerId?.trim().toUpperCase() || "";
  let explicitRouteId = params.routeId?.trim().toUpperCase() || "";
  if (!explicitRouteId && normalizedOfferId) {
    explicitRouteId = normalizedOfferId.replace(/-(SUV|VAN)$/, "");
  }
  const ROUTE_ID_ALIASES: Record<string, string> = {
    "DEN-BRECK": "DEN-BRECKENRIDGE",
    "BRECK-DEN": "BRECKENRIDGE-DEN",
    "COS-BRECK": "COS-BRECKENRIDGE",
    "BRECK-COS": "BRECKENRIDGE-COS",
  };
  if (explicitRouteId && ROUTE_ID_ALIASES[explicitRouteId]) {
    explicitRouteId = ROUTE_ID_ALIASES[explicitRouteId];
  }

  if (explicitRouteId) {
    const matchedInFeed = snapshot.feed.routes.find(
      (r) => r.route_id.toUpperCase() === explicitRouteId,
    );
    if (matchedInFeed) {
      const airport =
        isAirportCode(matchedInFeed.origin) ??
        isAirportCode(matchedInFeed.destination) ??
        "DEN";
      const resort =
        matchedInFeed.direction === "OUTBOUND"
          ? matchedInFeed.destination
          : matchedInFeed.origin;
      return {
        isGoSnoCorridorOrRoute: true,
        routeId: matchedInFeed.route_id,
        direction: matchedInFeed.direction,
        origin: matchedInFeed.origin,
        destination: matchedInFeed.destination,
        airport,
        resort,
      };
    }

    // Check if explicitRouteId is a reconciled service route (e.g. DEN-CRESTED-BUTTE, CRESTED-BUTTE-DEN, BZN-BIG-SKY, BIG-SKY-BZN)
    for (const airport of ["DEN", "COS", "BZN"] as const) {
      for (const resortEntry of RESORT_CANONICAL_AND_CODE) {
        if (explicitRouteId === `${airport}-${resortEntry.routeCode}`) {
          return {
            isGoSnoCorridorOrRoute: true,
            routeId: explicitRouteId,
            direction: "OUTBOUND",
            origin: airport,
            destination: resortEntry.canonicalName,
            airport,
            resort: resortEntry.canonicalName,
          };
        }
        if (explicitRouteId === `${resortEntry.routeCode}-${airport}`) {
          return {
            isGoSnoCorridorOrRoute: true,
            routeId: explicitRouteId,
            direction: "RETURN",
            origin: resortEntry.canonicalName,
            destination: airport,
            airport,
            resort: resortEntry.canonicalName,
          };
        }
      }
    }
  }

  const hasExplicitGoSnoInputs = Boolean(
    params.offerId || params.routeId || params.origin || params.destination,
  );
  const isGoSnoCorridor =
    !params.corridorId ||
    params.corridorId === "corridor:denver-vail-i70" ||
    params.corridorId === "corridor:denver-breckenridge-i70";

  if (!isGoSnoCorridor && !hasExplicitGoSnoInputs) {
    return {
      isGoSnoCorridorOrRoute: false,
      routeId: null,
      direction: "OUTBOUND",
      origin: params.origin || "DEN",
      destination: params.destination || "",
      airport: "DEN",
      resort: "",
    };
  }

  const originResort = matchResortEntry(params.origin);
  const destAirport = isAirportCode(params.destination);
  const originAirport = isAirportCode(params.origin);
  const destResort = matchResortEntry(params.destination);

  // Detect RETURN direction either from explicit direction="RETURN" or from origin=Resort & destination=Airport
  const effectiveDirection: GoSnoRouteDirection =
    params.direction === "RETURN" || (originResort && destAirport && !originAirport)
      ? "RETURN"
      : "OUTBOUND";

  const fallbackResort =
    params.corridorId === "corridor:denver-breckenridge-i70"
      ? { canonicalName: "Breckenridge", routeCode: "BRECKENRIDGE" }
      : { canonicalName: "Vail", routeCode: "VAIL" };

  const resolvedResort =
    (effectiveDirection === "RETURN"
      ? originResort ?? destResort
      : destResort ?? originResort) ?? fallbackResort;

  const isBigSky = resolvedResort.canonicalName === "Big Sky";
  const resolvedAirport: "DEN" | "COS" | "BZN" = isBigSky
    ? "BZN"
    : effectiveDirection === "RETURN"
      ? destAirport ?? originAirport ?? "DEN"
      : originAirport ?? destAirport ?? "DEN";

  const routeId =
    effectiveDirection === "RETURN"
      ? `${resolvedResort.routeCode}-${resolvedAirport}`
      : `${resolvedAirport}-${resolvedResort.routeCode}`;

  const origin =
    effectiveDirection === "RETURN"
      ? resolvedResort.canonicalName
      : resolvedAirport;
  const destination =
    effectiveDirection === "RETURN"
      ? resolvedAirport
      : resolvedResort.canonicalName;

  return {
    isGoSnoCorridorOrRoute: true,
    routeId,
    direction: effectiveDirection,
    origin,
    destination,
    airport: resolvedAirport,
    resort: resolvedResort.canonicalName,
  };
}

export interface ResolvedGoSnoOneWayFare {
  matched: boolean;
  offerId: string | null;
  routeId: string | null;
  direction: GoSnoRouteDirection;
  origin: string;
  destination: string;
  vehicleClass: GoSnoVehicleClass;
  seatingLimit: number | null;
  amountUsd: number | null;
  publishedAmountUsd: number | null;
  amountCents: number | null;
  currency: string;
  status: string;
  nextStep: string;
  onlineBookable: boolean;
  quoteOnly: boolean;
  canonicalBookingUrl: string;
  quoteUrl: string;
  rezdyProductCode: string | null;
  isExpired: boolean;
  priceDisplay: string;
  sourceType: "route_feed_one_way" | "reconciled_service" | "unmatched";
}

export function resolveGoSnoOneWayFare(params: {
  offerId?: string;
  routeId?: string;
  origin?: string;
  destination?: string;
  direction?: GoSnoRouteDirection;
  corridorId?: CorridorId;
  vehicleClass: GoSnoVehicleClass;
  nowMs?: number;
  snapshotState?: ActiveGoSnoSnapshotState;
}): ResolvedGoSnoOneWayFare {
  const activeState =
    params.snapshotState ??
    getActiveGoSnoRouteFeedSnapshotState({ nowMs: params.nowMs });
  const { snapshot, isExpired } = activeState;

  const ctx = resolveGoSnoRouteContext({
    offerId: params.offerId,
    routeId: params.routeId,
    origin: params.origin,
    destination: params.destination,
    direction: params.direction,
    corridorId: params.corridorId,
    snapshot,
  });

  if (!ctx.isGoSnoCorridorOrRoute || !ctx.routeId) {
    return {
      matched: false,
      offerId: null,
      routeId: null,
      direction: ctx.direction,
      origin: ctx.origin,
      destination: ctx.destination,
      vehicleClass: params.vehicleClass,
      seatingLimit: null,
      amountUsd: null,
      publishedAmountUsd: null,
      amountCents: null,
      currency: "USD",
      status: "unmatched",
      nextStep: "request a quote",
      onlineBookable: false,
      quoteOnly: true,
      canonicalBookingUrl: "https://gosno.co/request-quote",
      quoteUrl: "https://gosno.co/request-quote",
      rezdyProductCode: null,
      isExpired,
      priceDisplay: GOSNO_PRICE_FALLBACK_MESSAGE,
      sourceType: "unmatched",
    };
  }

  const normalizedExplicitOfferId = params.offerId?.trim().toUpperCase();
  const expectedOfferId = `${ctx.routeId}-${params.vehicleClass.toUpperCase()}`;

  const matchedRouteOffer = snapshot.feed.routes.find((r) => {
    if (r.vehicle_class !== params.vehicleClass) return false;
    if (
      normalizedExplicitOfferId &&
      r.offer_id.toUpperCase() === normalizedExplicitOfferId
    ) {
      return true;
    }
    if (r.offer_id.toUpperCase() === expectedOfferId) {
      return true;
    }
    return r.route_id.toUpperCase() === ctx.routeId;
  });

  if (matchedRouteOffer) {
    const publishedUsd = matchedRouteOffer.pricing.amount_usd;
    const effectiveUsd = isExpired ? null : publishedUsd;
    const effectiveCents =
      effectiveUsd !== null ? matchedRouteOffer.pricing.amount_cents : null;
    // Vans on GoSno still require a quote / availability confirmation in DCC even when a published van fare exists;
    // expired snapshots also require a quote handoff to confirm current pricing.
    const isQuoteOnly =
      isExpired ||
      params.vehicleClass === "van" ||
      matchedRouteOffer.status === "quote_only" ||
      !matchedRouteOffer.booking_eligibility.online_bookable;

    let resolvedQuoteUrl = matchedRouteOffer.quote_url;
    if (isExpired) {
      try {
        const parsedQuote = new URL(matchedRouteOffer.quote_url);
        parsedQuote.searchParams.delete("publishedPrice");
        resolvedQuoteUrl = parsedQuote.toString();
      } catch {
        resolvedQuoteUrl = matchedRouteOffer.quote_url;
      }
    }

    return {
      matched: true,
      offerId: matchedRouteOffer.offer_id,
      routeId: matchedRouteOffer.route_id,
      direction: matchedRouteOffer.direction,
      origin: matchedRouteOffer.origin,
      destination: matchedRouteOffer.destination,
      vehicleClass: matchedRouteOffer.vehicle_class,
      seatingLimit: matchedRouteOffer.seating_limit,
      amountUsd: effectiveUsd,
      publishedAmountUsd: publishedUsd,
      amountCents: effectiveCents,
      currency: matchedRouteOffer.pricing.currency,
      status: matchedRouteOffer.status,
      nextStep: isQuoteOnly ? "request a quote" : matchedRouteOffer.next_step,
      onlineBookable:
        !isQuoteOnly && matchedRouteOffer.booking_eligibility.online_bookable,
      quoteOnly: isQuoteOnly,
      canonicalBookingUrl: matchedRouteOffer.canonical_booking_url,
      quoteUrl: resolvedQuoteUrl,
      rezdyProductCode:
        matchedRouteOffer.booking_eligibility.rezdy_product_code ?? null,
      isExpired,
      priceDisplay:
        effectiveUsd !== null
          ? `$${effectiveUsd}`
          : GOSNO_PRICE_FALLBACK_MESSAGE,
      sourceType: "route_feed_one_way",
    };
  }

  // Check reconciled_services (e.g., Crested Butte or Big Sky)
  const reconciledMatch = snapshot.feed.reconciled_services.find((svc) => {
    if (svc.vehicleClass !== params.vehicleClass) return false;
    const svcResort = matchResortEntry(svc.destination);
    if (!svcResort || svcResort.canonicalName !== ctx.resort) return false;
    if (svc.origin.includes(ctx.airport) || svc.origin === "DEN / COS") {
      return true;
    }
    return false;
  });

  if (reconciledMatch) {
    const publishedUsd =
      typeof reconciledMatch.referencePriceUsd === "number"
        ? reconciledMatch.referencePriceUsd
        : null;
    const effectiveUsd = isExpired ? null : publishedUsd;
    return {
      matched: true,
      offerId: reconciledMatch.serviceId,
      routeId: ctx.routeId,
      direction: ctx.direction,
      origin: ctx.origin,
      destination: ctx.destination,
      vehicleClass: params.vehicleClass,
      seatingLimit: reconciledMatch.seatingLimit,
      amountUsd: effectiveUsd,
      publishedAmountUsd: publishedUsd,
      amountCents:
        effectiveUsd !== null ? Math.round(effectiveUsd * 100) : null,
      currency: reconciledMatch.currency || "USD",
      status: reconciledMatch.status,
      nextStep: isExpired ? "request a quote" : reconciledMatch.nextStep,
      onlineBookable: false,
      quoteOnly: true,
      canonicalBookingUrl: reconciledMatch.canonicalUrl,
      quoteUrl: reconciledMatch.actionUrl,
      rezdyProductCode: null,
      isExpired,
      priceDisplay:
        effectiveUsd !== null
          ? `$${effectiveUsd}`
          : GOSNO_PRICE_FALLBACK_MESSAGE,
      sourceType: "reconciled_service",
    };
  }

  return {
    matched: false,
    offerId: null,
    routeId: ctx.routeId,
    direction: ctx.direction,
    origin: ctx.origin,
    destination: ctx.destination,
    vehicleClass: params.vehicleClass,
    seatingLimit: null,
    amountUsd: null,
    publishedAmountUsd: null,
    amountCents: null,
    currency: "USD",
    status: "unmatched",
    nextStep: "request a quote",
    onlineBookable: false,
    quoteOnly: true,
    canonicalBookingUrl: "https://gosno.co/request-quote",
    quoteUrl: "https://gosno.co/request-quote",
    rezdyProductCode: null,
    isExpired,
    priceDisplay: GOSNO_PRICE_FALLBACK_MESSAGE,
    sourceType: "unmatched",
  };
}

export interface ResolvedGoSnoRoundTripFare {
  matched: boolean;
  offerId: string | null;
  routeId: string | null;
  outboundRouteId: string | null;
  returnRouteId: string | null;
  airport: string;
  resort: string;
  vehicleClass: GoSnoVehicleClass;
  seatingLimit: number | null;
  outboundAmountUsd: number | null;
  returnAmountUsd: number | null;
  totalAmountUsd: number | null;
  publishedTotalAmountUsd: number | null;
  totalAmountCents: number | null;
  currency: string;
  status: string;
  nextStep: string;
  onlineBookable: boolean;
  quoteOnly: boolean;
  outboundRezdyProductCode: string | null;
  returnRezdyProductCode: string | null;
  canonicalBookingUrl: string;
  quoteUrl: string;
  isExpired: boolean;
  priceDisplay: string;
}

export function resolveGoSnoRoundTripFare(params: {
  offerId?: string;
  routeId?: string;
  airport?: string;
  resort?: string;
  vehicleClass: GoSnoVehicleClass;
  nowMs?: number;
  snapshotState?: ActiveGoSnoSnapshotState;
}): ResolvedGoSnoRoundTripFare {
  const activeState =
    params.snapshotState ??
    getActiveGoSnoRouteFeedSnapshotState({ nowMs: params.nowMs });
  const { snapshot, isExpired } = activeState;

  const normalizedOfferId = params.offerId?.trim().toUpperCase();
  const normalizedRouteId = params.routeId?.trim().toUpperCase();
  const airportCode =
    isAirportCode(params.airport) ??
    isAirportCode(params.resort) ??
    "DEN";
  const resortEntry =
    matchResortEntry(params.resort) ?? matchResortEntry(params.airport);

  const matchedRt = snapshot.feed.round_trips.find((rt) => {
    if (rt.vehicle_class !== params.vehicleClass) return false;
    if (normalizedOfferId && rt.offer_id.toUpperCase() === normalizedOfferId) {
      return true;
    }
    if (
      normalizedRouteId &&
      (rt.route_id.toUpperCase() === normalizedRouteId ||
        rt.outbound_route_id.toUpperCase() === normalizedRouteId ||
        rt.return_route_id.toUpperCase() === normalizedRouteId)
    ) {
      return true;
    }
    if (
      resortEntry &&
      rt.airport.toUpperCase() === airportCode &&
      rt.resort.toLowerCase() === resortEntry.canonicalName.toLowerCase()
    ) {
      return true;
    }
    return false;
  });

  if (!matchedRt) {
    return {
      matched: false,
      offerId: null,
      routeId: normalizedRouteId ?? null,
      outboundRouteId: null,
      returnRouteId: null,
      airport: airportCode,
      resort: resortEntry?.canonicalName ?? params.resort ?? "",
      vehicleClass: params.vehicleClass,
      seatingLimit: null,
      outboundAmountUsd: null,
      returnAmountUsd: null,
      totalAmountUsd: null,
      publishedTotalAmountUsd: null,
      totalAmountCents: null,
      currency: "USD",
      status: "unmatched",
      nextStep: "request a quote",
      onlineBookable: false,
      quoteOnly: true,
      outboundRezdyProductCode: null,
      returnRezdyProductCode: null,
      canonicalBookingUrl: "https://gosno.co/request-quote",
      quoteUrl: "https://gosno.co/request-quote",
      isExpired,
      priceDisplay: GOSNO_PRICE_FALLBACK_MESSAGE,
    };
  }

  const publishedTotal = matchedRt.pricing.total_amount_usd;
  let resolvedQuoteUrl = matchedRt.quote_url;
  if (isExpired) {
    try {
      const parsedQuote = new URL(matchedRt.quote_url);
      parsedQuote.searchParams.delete("publishedPrice");
      resolvedQuoteUrl = parsedQuote.toString();
    } catch {
      resolvedQuoteUrl = matchedRt.quote_url;
    }
  }

  const isQuoteOnly =
    isExpired ||
    params.vehicleClass === "van" ||
    matchedRt.status === "quote_only" ||
    matchedRt.booking_eligibility?.online_bookable === false;

  return {
    matched: true,
    offerId: matchedRt.offer_id,
    routeId: matchedRt.route_id,
    outboundRouteId: matchedRt.outbound_route_id,
    returnRouteId: matchedRt.return_route_id,
    airport: matchedRt.airport,
    resort: matchedRt.resort,
    vehicleClass: matchedRt.vehicle_class,
    seatingLimit: matchedRt.seating_limit,
    outboundAmountUsd: isExpired ? null : matchedRt.pricing.outbound_amount_usd,
    returnAmountUsd: isExpired ? null : matchedRt.pricing.return_amount_usd,
    totalAmountUsd: isExpired ? null : publishedTotal,
    publishedTotalAmountUsd: publishedTotal,
    totalAmountCents: isExpired ? null : matchedRt.pricing.total_amount_cents,
    currency: matchedRt.pricing.currency,
    status: matchedRt.status,
    nextStep: isQuoteOnly ? "request a quote" : matchedRt.next_step,
    onlineBookable:
      !isQuoteOnly && Boolean(matchedRt.booking_eligibility?.online_bookable ?? true),
    quoteOnly: isQuoteOnly,
    outboundRezdyProductCode:
      matchedRt.booking_eligibility?.outbound_rezdy_product_code ?? null,
    returnRezdyProductCode:
      matchedRt.booking_eligibility?.return_rezdy_product_code ?? null,
    canonicalBookingUrl: matchedRt.canonical_booking_url,
    quoteUrl: resolvedQuoteUrl,
    isExpired,
    priceDisplay: isExpired
      ? GOSNO_PRICE_FALLBACK_MESSAGE
      : `$${publishedTotal}`,
  };
}

export interface GoSnoRouteSnapshotDisplayPricing {
  snapshotState: ActiveGoSnoSnapshotState;
  suvFare: ResolvedGoSnoOneWayFare;
  vanFare: ResolvedGoSnoOneWayFare;
  roundTripSuvFare: ResolvedGoSnoRoundTripFare;
  roundTripVanFare: ResolvedGoSnoRoundTripFare;
  suvPriceLabel: string;
  suvOneWayLabel: string;
  vanPriceLabel: string;
  vanOneWayLabel: string;
  vanQuoteRequired: boolean;
  roundTripSuvPriceLabel: string;
}

export function getGoSnoRouteSnapshotDisplayPricing(params: {
  routeId?: string;
  origin?: string;
  destination?: string;
  direction?: GoSnoRouteDirection;
  corridorId?: CorridorId;
  snapshotState?: ActiveGoSnoSnapshotState;
}): GoSnoRouteSnapshotDisplayPricing {
  const snapshotState =
    params.snapshotState ?? getActiveGoSnoRouteFeedSnapshotState();
  const suvFare = resolveGoSnoOneWayFare({
    routeId: params.routeId,
    origin: params.origin,
    destination: params.destination,
    direction: params.direction ?? "OUTBOUND",
    corridorId: params.corridorId,
    vehicleClass: "suv",
    snapshotState,
  });
  const vanFare = resolveGoSnoOneWayFare({
    routeId: params.routeId,
    origin: params.origin,
    destination: params.destination,
    direction: params.direction ?? "OUTBOUND",
    corridorId: params.corridorId,
    vehicleClass: "van",
    snapshotState,
  });
  const airportForRt =
    isAirportCode(suvFare.origin) ??
    isAirportCode(suvFare.destination) ??
    "DEN";
  const resortForRt =
    suvFare.direction === "RETURN" ? suvFare.origin : suvFare.destination;
  const roundTripSuvFare = resolveGoSnoRoundTripFare({
    routeId: params.routeId,
    airport: airportForRt,
    resort: resortForRt,
    vehicleClass: "suv",
    snapshotState,
  });
  const roundTripVanFare = resolveGoSnoRoundTripFare({
    routeId: params.routeId,
    airport: airportForRt,
    resort: resortForRt,
    vehicleClass: "van",
    snapshotState,
  });

  const suvPriceLabel =
    suvFare.amountUsd !== null
      ? `$${suvFare.amountUsd}`
      : GOSNO_PRICE_FALLBACK_MESSAGE;
  const suvOneWayLabel =
    suvFare.amountUsd !== null
      ? `$${suvFare.amountUsd} one-way`
      : GOSNO_PRICE_FALLBACK_MESSAGE;
  const vanPriceLabel =
    vanFare.amountUsd !== null
      ? `$${vanFare.amountUsd}`
      : GOSNO_PRICE_FALLBACK_MESSAGE;
  const vanOneWayLabel =
    vanFare.amountUsd !== null
      ? `$${vanFare.amountUsd} one-way`
      : GOSNO_PRICE_FALLBACK_MESSAGE;
  const roundTripSuvPriceLabel =
    roundTripSuvFare.totalAmountUsd !== null
      ? `$${roundTripSuvFare.totalAmountUsd}`
      : GOSNO_PRICE_FALLBACK_MESSAGE;

  return {
    snapshotState,
    suvFare,
    vanFare,
    roundTripSuvFare,
    roundTripVanFare,
    suvPriceLabel,
    suvOneWayLabel,
    vanPriceLabel,
    vanOneWayLabel,
    vanQuoteRequired: vanFare.quoteOnly,
    roundTripSuvPriceLabel,
  };
}

registerGoSnoDisplayPricingResolver(
  getGoSnoRouteSnapshotDisplayPricing as Parameters<
    typeof registerGoSnoDisplayPricingResolver
  >[0],
);
registerGoSnoSnapshotStateResolver(getActiveGoSnoRouteFeedSnapshotState);


