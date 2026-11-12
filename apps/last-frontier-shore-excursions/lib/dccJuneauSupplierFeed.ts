import { buildAffiliateUrl } from "./affiliate/links";

export interface LfseOptionSailingWindowAssessment {
  departureTime: string;
  shipArrivalTime: string | null;
  shipAllAboardTime: string | null;
  allAboardConfirmed: boolean;
  meetingPointAndReturnConfirmed: false;
  estimatedTourEndWithoutTransferTime: string | null;
  upperBoundRemainingSecondsBeforeTransfer: number | null;
  upperBoundRemainingBufferHmsLabel: string | null;
  status:
    | "outside_sailing_window_blocked"
    | "reduced_buffer_not_recommended"
    | "unverified_cruise_timing_pending_transfer_and_pickup";
  blockedForSailingWindow: boolean;
  displayLabel: string;
}

export interface LfseNormalizedJuneauSupplierTour {
  normalizedTourId: string;
  rezgoUid: string;
  rezgoCom: string | null;
  operatorId: "juneau-tours-whale-watch";
  operatorName: string;
  verifiedRezgoCompanyName: string | null;
  title: string;
  optionName: string | null;
  activityCategory:
    | "whale-watching"
    | "mendenhall-glacier-tours"
    | "combo-whale-glacier"
    | "juneau-sightseeing";
  durationLabel: string | null;
  durationMinutes: number | null;
  adultPriceUsd: number | null;
  childPriceUsd: number | null;
  currency: string;
  departureTimes: string[];
  blockedOutsideWindowDepartures?: string[];
  startingLocation: string | null;
  dateChecked: string | null;
  availableSpots: number | null;
  availabilitySemantics:
    | "rezgo_date_search_spots"
    | "rezgo_catalog_overall"
    | "unconfirmed_check_provider";
  supplierBookingCutoffHours?: number | null;
  supplierBookingCutoffSemantics?: "supplier_booking_cutoff_only_never_cruise_return_buffer";
  cruiseTimingVerificationStatus?: "live_operator_availability_only_unverified_cruise_timing";
  cruiseTimingStatusLabel?: string;
  cruiseTimingDisclosure?: string;
  optionWindowAssessments?: LfseOptionSailingWindowAssessment[];
  cacheKey?: string;
  matchConfidence:
    | "high_exact_code"
    | "medium_title_and_operator"
    | "unmatched_rezgo_only";
  matchedViatorProductCode: string | null;
  approvedFallbackViatorUrl: string | null;
  trackedFallbackHref: string | null;
  liveDirectRezgoCheckoutEnabled: false;
  isolatedSecondaryProperty: true;
  influencesPrimaryDccRanking: false;
}

export interface LfseSupplierConflictSummary {
  conflictId: string;
  severity: "high" | "info";
  productCode: string;
  listedViatorSupplier: string;
  rezgoVerifiedCompanyName: string | null;
  summary: string;
  safeFallbackBehavior: string;
}

export interface LfseJuneauNormalizedFeedResult {
  ok: boolean;
  fallbackActive: boolean;
  source: "dcc_rezgo_readonly_xml" | "dcc_approved_fallback" | "lfse_local_fallback";
  checkedAt: string | null;
  dateChecked: string | null;
  cachePolicy: {
    scope: "operator_product_service_date";
    operatorKey: "juneau-tours-whale-watch";
    productKey: string;
    serviceDateKey: string;
    cacheKey: string;
    maxEntriesBound: number;
    cacheStatus: "hit" | "miss_fresh" | "bypassed";
    cachedAt: string;
    expiresAt: string;
    ttlSeconds: number;
  };
  timingSafetyClassification: "live_operator_availability_only";
  verifiedCruiseSafeTiming: false;
  readOnly: true;
  liveDirectRezgoCheckoutEnabled: false;
  verifiedCompanyName: string | null;
  verifiedRezgoDomain: string | null;
  currency: string;
  tours: LfseNormalizedJuneauSupplierTour[];
  supplierConflicts: LfseSupplierConflictSummary[];
}

export const MAX_LFSE_FEED_CACHE_ENTRIES = 64;
const DEFAULT_LFSE_FEED_REVALIDATE_SECONDS = 180;
const FALLBACK_ERROR_TTL_SECONDS = 30;

interface LfseCachedFeedEntry {
  cachedAtIso: string;
  expiresAtMs: number;
  ttlSeconds: number;
  result: LfseJuneauNormalizedFeedResult;
}

const lfseBoundedFeedCache = new Map<string, LfseCachedFeedEntry>();
const lfseInFlightFeedRequests = new Map<string, Promise<LfseJuneauNormalizedFeedResult>>();

function setBoundedLfseCacheEntry(
  key: string,
  value: LfseCachedFeedEntry,
  maxEntries: number,
): void {
  if (lfseBoundedFeedCache.has(key)) {
    lfseBoundedFeedCache.delete(key);
  }
  lfseBoundedFeedCache.set(key, value);
  while (lfseBoundedFeedCache.size > maxEntries) {
    const oldestKey = lfseBoundedFeedCache.keys().next().value;
    if (oldestKey === undefined) break;
    lfseBoundedFeedCache.delete(oldestKey);
  }
}

export function clearLfseJuneauSupplierFeedCacheForTesting(): void {
  lfseBoundedFeedCache.clear();
  lfseInFlightFeedRequests.clear();
}

export function getLfseJuneauSupplierFeedCacheStatsForTesting(): {
  entries: number;
  maxEntries: number;
} {
  return {
    entries: lfseBoundedFeedCache.size,
    maxEntries: MAX_LFSE_FEED_CACHE_ENTRIES,
  };
}

function buildFallbackOnlyResult(params: {
  productKey: string;
  serviceDateKey: string;
  cacheKey: string;
  cacheStatus: "hit" | "miss_fresh" | "bypassed";
  cachedAt: string;
  expiresAt: string;
  ttlSeconds: number;
}): LfseJuneauNormalizedFeedResult {
  return {
    ok: false,
    fallbackActive: true,
    source: "lfse_local_fallback",
    checkedAt: null,
    dateChecked: null,
    cachePolicy: {
      scope: "operator_product_service_date",
      operatorKey: "juneau-tours-whale-watch",
      productKey: params.productKey,
      serviceDateKey: params.serviceDateKey,
      cacheKey: params.cacheKey,
      maxEntriesBound: MAX_LFSE_FEED_CACHE_ENTRIES,
      cacheStatus: params.cacheStatus,
      cachedAt: params.cachedAt,
      expiresAt: params.expiresAt,
      ttlSeconds: params.ttlSeconds,
    },
    timingSafetyClassification: "live_operator_availability_only",
    verifiedCruiseSafeTiming: false,
    readOnly: true,
    liveDirectRezgoCheckoutEnabled: false,
    verifiedCompanyName: null,
    verifiedRezgoDomain: null,
    currency: "USD",
    tours: [],
    supplierConflicts: [
      {
        conflictId: "juneau-466119p3-vs-5857-supplier-mismatch",
        severity: "high",
        productCode: "466119P3",
        listedViatorSupplier: "Dolphin Jet Boat Tours",
        rezgoVerifiedCompanyName: "Juneau Tours & Whale Watch",
        summary:
          "Viator product d941-466119P3 (Mendenhall Glacier Waterfall and Whale Watching Tour) is supplied by Dolphin Jet Boat Tours, NOT Juneau Tours & Whale Watch (Viator prefix 5857).",
        safeFallbackBehavior:
          "Last Frontier continues serving its approved Viator offers (#331813P1, #466119P3, #5857SHUTTLE) with zero direct Rezgo credentials or mutations.",
      },
    ],
  };
}

/**
 * Loads normalized Juneau Tours & Whale Watch inventory from DCC's secure port-day excursion feed.
 *
 * Security & Architecture Invariants:
 * - Last Frontier Shore Excursions NEVER holds or reads REZGO_SERENE_CID or REZGO_SERENE_API_KEY.
 * - DCC is the sole secure credential holder and normalizes read-only Rezgo XML into sanitized JSON.
 * - Bounded caching by operator (`juneau-tours-whale-watch`), product/activity key, and service date
 *   (plus in-flight coalescing) ensures ordinary page traffic never generates uncached upstream Rezgo
 *   requests even when DCC's dynamic API endpoint sets `Cache-Control: no-store`.
 * - Rezgo results are strictly labeled as live operator availability (`verifiedCruiseSafeTiming: false`)
 *   and never as verified cruise-safe timing.
 * - Direct Rezgo checkout remains disabled (`liveDirectRezgoCheckoutEnabled: false`); any outbound
 *   booking CTA routes strictly to Last Frontier's approved Viator affiliate fallback (`P00281144`)
 *   only when an approved 5857* SKU is matched.
 * - If DCC or Rezgo is unavailable, fails open cleanly (`fallbackActive: true`, `tours: []`) so
 *   all existing approved Last Frontier pages and Viator offers continue operating unchanged.
 */
export async function loadLfseJuneauNormalizedSupplierFeed(options?: {
  date?: string;
  productCode?: string;
  activitySlug?: string;
  revalidateSeconds?: number;
  bypassCache?: boolean;
  fetchImpl?: typeof fetch;
}): Promise<LfseJuneauNormalizedFeedResult> {
  const operatorKey = "juneau-tours-whale-watch" as const;
  const validDate =
    options?.date && /^\d{4}-\d{2}-\d{2}$/.test(options.date.trim())
      ? options.date.trim()
      : null;
  const serviceDateKey = validDate || "default-port-call";
  const productKey =
    (options?.productCode || options?.activitySlug || "all").trim().toLowerCase() || "all";
  const cacheKey = `lfse:${operatorKey}:${productKey}:${serviceDateKey}`;

  const requestedTtlSeconds =
    typeof options?.revalidateSeconds === "number" && Number.isFinite(options.revalidateSeconds)
      ? Math.max(5, Math.round(options.revalidateSeconds))
      : DEFAULT_LFSE_FEED_REVALIDATE_SECONDS;
  const useCache = !options?.bypassCache && requestedTtlSeconds > 0;
  const nowMs = Date.now();

  if (useCache) {
    const existing = lfseBoundedFeedCache.get(cacheKey);
    if (existing && existing.expiresAtMs > nowMs) {
      setBoundedLfseCacheEntry(cacheKey, existing, MAX_LFSE_FEED_CACHE_ENTRIES);
      return {
        ...existing.result,
        cachePolicy: {
          ...existing.result.cachePolicy,
          cacheStatus: "hit",
          cachedAt: existing.cachedAtIso,
          expiresAt: new Date(existing.expiresAtMs).toISOString(),
          ttlSeconds: existing.ttlSeconds,
        },
      };
    }

    const inFlight = lfseInFlightFeedRequests.get(cacheKey);
    if (inFlight) {
      const shared = await inFlight;
      return {
        ...shared,
        cachePolicy: {
          ...shared.cachePolicy,
          cacheStatus: "hit",
        },
      };
    }
  }

  const executeUpstreamFetch = async (): Promise<LfseJuneauNormalizedFeedResult> => {
    const baseUrl = (
      process.env.DCC_API_BASE_URL?.trim() ||
      process.env.DCC_BASE_URL?.trim() ||
      "https://destinationcommandcenter.com"
    ).replace(/\/+$/, "");

    const qs = new URLSearchParams({
      port: "juneau",
      limit: "12",
      originatingSite: "lastfrontiershoreexcursions.com",
      surface: "lfse_juneau_supplier_feed",
    });
    if (validDate) {
      qs.set("date", validDate);
    }
    if (options?.productCode && options.productCode.trim()) {
      qs.set("productCode", options.productCode.trim());
    }

    const url = `${baseUrl}/api/v1/cruise/port-day-excursions?${qs.toString()}`;
    const fetchFn = options?.fetchImpl ?? fetch;
    const fetchedAtMs = Date.now();
    const fetchedAtIso = new Date(fetchedAtMs).toISOString();

    try {
      const fetchInit: RequestInit & { next?: { revalidate?: number } } = {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(4000),
      };
      if (useCache) {
        fetchInit.next = { revalidate: requestedTtlSeconds };
      } else {
        fetchInit.cache = "no-store";
      }

      const res = await fetchFn(url, fetchInit);
      if (!res.ok) {
        const errExpiresIso = new Date(
          fetchedAtMs + FALLBACK_ERROR_TTL_SECONDS * 1000,
        ).toISOString();
        return buildFallbackOnlyResult({
          productKey,
          serviceDateKey,
          cacheKey,
          cacheStatus: useCache ? "miss_fresh" : "bypassed",
          cachedAt: fetchedAtIso,
          expiresAt: errExpiresIso,
          ttlSeconds: FALLBACK_ERROR_TTL_SECONDS,
        });
      }

      const payload = (await res.json()) as {
        normalizedSupplierFeeds?: {
          juneauToursWhaleWatch?: {
            ok?: boolean;
            source?: "dcc_rezgo_readonly_xml" | "dcc_approved_fallback";
            checkedAt?: string;
            dateChecked?: string | null;
            verifiedCompanyName?: string | null;
            verifiedRezgoDomain?: string | null;
            currency?: string;
            tours?: Array<Omit<LfseNormalizedJuneauSupplierTour, "trackedFallbackHref">>;
            supplierConflicts?: LfseSupplierConflictSummary[];
          };
        };
      };

      const upstream = payload?.normalizedSupplierFeeds?.juneauToursWhaleWatch;
      if (!upstream) {
        const errExpiresIso = new Date(
          fetchedAtMs + FALLBACK_ERROR_TTL_SECONDS * 1000,
        ).toISOString();
        return buildFallbackOnlyResult({
          productKey,
          serviceDateKey,
          cacheKey,
          cacheStatus: useCache ? "miss_fresh" : "bypassed",
          cachedAt: fetchedAtIso,
          expiresAt: errExpiresIso,
          ttlSeconds: FALLBACK_ERROR_TTL_SECONDS,
        });
      }

      const rawTours = Array.isArray(upstream.tours) ? upstream.tours : [];
      const filteredTours = options?.activitySlug
        ? rawTours.filter((t) => {
            if (options.activitySlug === "whale-watching") {
              return (
                t.activityCategory === "whale-watching" ||
                t.activityCategory === "combo-whale-glacier"
              );
            }
            if (options.activitySlug === "mendenhall-glacier-tours") {
              return (
                t.activityCategory === "mendenhall-glacier-tours" ||
                t.activityCategory === "combo-whale-glacier"
              );
            }
            return true;
          })
        : rawTours;

      const mappedTours: LfseNormalizedJuneauSupplierTour[] = filteredTours.map((t) => {
        const trackedFallbackHref =
          t.approvedFallbackViatorUrl && t.matchedViatorProductCode
            ? buildAffiliateUrl(
                "viator",
                t.approvedFallbackViatorUrl,
                `juneau-normalized-${t.matchedViatorProductCode.toLowerCase()}`,
                t.title,
                true,
              )
            : null;

        return {
          ...t,
          cruiseTimingVerificationStatus:
            "live_operator_availability_only_unverified_cruise_timing",
          cruiseTimingStatusLabel:
            t.cruiseTimingStatusLabel ||
            "Live operator availability · Cruise-safe timing unverified",
          trackedFallbackHref,
          liveDirectRezgoCheckoutEnabled: false,
          isolatedSecondaryProperty: true,
          influencesPrimaryDccRanking: false,
        };
      });

      const okResult = Boolean(upstream.ok && mappedTours.length > 0);
      const effectiveTtlSeconds = okResult
        ? requestedTtlSeconds
        : FALLBACK_ERROR_TTL_SECONDS;
      const expiresAtIso = new Date(
        fetchedAtMs + effectiveTtlSeconds * 1000,
      ).toISOString();

      return {
        ok: okResult,
        fallbackActive: !okResult,
        source: upstream.source || "dcc_approved_fallback",
        checkedAt: upstream.checkedAt || null,
        dateChecked: upstream.dateChecked ?? null,
        cachePolicy: {
          scope: "operator_product_service_date",
          operatorKey,
          productKey,
          serviceDateKey,
          cacheKey,
          maxEntriesBound: MAX_LFSE_FEED_CACHE_ENTRIES,
          cacheStatus: useCache ? "miss_fresh" : "bypassed",
          cachedAt: fetchedAtIso,
          expiresAt: expiresAtIso,
          ttlSeconds: effectiveTtlSeconds,
        },
        timingSafetyClassification: "live_operator_availability_only",
        verifiedCruiseSafeTiming: false,
        readOnly: true,
        liveDirectRezgoCheckoutEnabled: false,
        verifiedCompanyName: upstream.verifiedCompanyName ?? null,
        verifiedRezgoDomain: upstream.verifiedRezgoDomain ?? null,
        currency: upstream.currency || "USD",
        tours: mappedTours,
        supplierConflicts: Array.isArray(upstream.supplierConflicts)
          ? upstream.supplierConflicts
          : buildFallbackOnlyResult({
              productKey,
              serviceDateKey,
              cacheKey,
              cacheStatus: "bypassed",
              cachedAt: fetchedAtIso,
              expiresAt: expiresAtIso,
              ttlSeconds: effectiveTtlSeconds,
            }).supplierConflicts,
      };
    } catch {
      const errExpiresIso = new Date(
        fetchedAtMs + FALLBACK_ERROR_TTL_SECONDS * 1000,
      ).toISOString();
      return buildFallbackOnlyResult({
        productKey,
        serviceDateKey,
        cacheKey,
        cacheStatus: useCache ? "miss_fresh" : "bypassed",
        cachedAt: fetchedAtIso,
        expiresAt: errExpiresIso,
        ttlSeconds: FALLBACK_ERROR_TTL_SECONDS,
      });
    }
  };

  if (useCache) {
    const promise = executeUpstreamFetch();
    lfseInFlightFeedRequests.set(cacheKey, promise);
    try {
      const built = await promise;
      const cachedAtMs = Date.parse(built.cachePolicy.cachedAt) || Date.now();
      setBoundedLfseCacheEntry(
        cacheKey,
        {
          cachedAtIso: built.cachePolicy.cachedAt,
          expiresAtMs: cachedAtMs + built.cachePolicy.ttlSeconds * 1000,
          ttlSeconds: built.cachePolicy.ttlSeconds,
          result: built,
        },
        MAX_LFSE_FEED_CACHE_ENTRIES,
      );
      return built;
    } finally {
      lfseInFlightFeedRequests.delete(cacheKey);
    }
  }

  return executeUpstreamFetch();
}
