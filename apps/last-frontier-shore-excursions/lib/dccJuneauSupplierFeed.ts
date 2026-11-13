import { buildAffiliateUrl } from "./affiliate/links";

export type LfseJuneauTourDurationScope = "dock_to_dock" | "activity_only_unverified";

export interface LfseJuneauTourDurationProvenance {
  scope: LfseJuneauTourDurationScope;
  operatorId: string;
  verifiedOperatorOnly: boolean;
  includesOutboundTransportation: boolean;
  includesActivity: boolean;
  includesReturnTransportationToDock: boolean;
  advertisedPickupReturnArea: string | null;
  additionalOperatorTransferMinutesAdded: 0;
  generalizedToOtherOperators: false;
  provenanceNote: string;
}

const LFSE_CONFIRMED_JUNEAU_TOURS_COM_SET = new Set<string>([
  "31703",
  "32329",
  "342080",
  "395337",
]);
const LFSE_CONFIRMED_JUNEAU_TOURS_VIATOR_SET = new Set<string>([
  "5857P22",
  "5857P23",
  "5857P31",
  "5857SHUTTLE",
]);
const LFSE_DISALLOWED_NON_JUNEAU_TOURS_VIATOR_SET = new Set<string>([
  "466119P3",
  "331813P1",
]);

export function resolveLfseJuneauToursDockToDockProvenance(params: {
  operatorId?: string | null;
  rezgoCom?: string | null;
  matchedViatorProductCode?: string | null;
  verifiedRezgoDomain?: string | null;
  verifiedRezgoCompanyName?: string | null;
  title?: string | null;
}): {
  durationScope: LfseJuneauTourDurationScope;
  includedOperatorTransportationInPublishedDuration: boolean;
  durationProvenance: LfseJuneauTourDurationProvenance;
} {
  const opId = (params.operatorId || "").trim();
  const com = (params.rezgoCom || "").trim();
  const viatorCode = (params.matchedViatorProductCode || "").trim().toUpperCase();
  const domain = (params.verifiedRezgoDomain || "").trim().toLowerCase();
  const company = (params.verifiedRezgoCompanyName || "").trim().toLowerCase();
  const title = (params.title || "").trim().toLowerCase();

  const isDisallowed = Boolean(viatorCode) && LFSE_DISALLOWED_NON_JUNEAU_TOURS_VIATOR_SET.has(viatorCode);
  const isConfirmedOperator = opId === "juneau-tours-whale-watch" && !isDisallowed;
  const isConfirmedCom = Boolean(com) && LFSE_CONFIRMED_JUNEAU_TOURS_COM_SET.has(com);
  const isConfirmedViator = Boolean(viatorCode) && LFSE_CONFIRMED_JUNEAU_TOURS_VIATOR_SET.has(viatorCode);
  const isVerifiedCompany =
    (domain.includes("juneautours") ||
      domain.includes("juneauwhalewatch") ||
      company.includes("juneau tours")) &&
    /(whale|mendenhall|glacier|trolley|wildlife|charter)/i.test(title);

  if (isConfirmedOperator && (isConfirmedCom || isConfirmedViator || isVerifiedCompany)) {
    return {
      durationScope: "dock_to_dock",
      includedOperatorTransportationInPublishedDuration: true,
      durationProvenance: {
        scope: "dock_to_dock",
        operatorId: "juneau-tours-whale-watch",
        verifiedOperatorOnly: true,
        includesOutboundTransportation: true,
        includesActivity: true,
        includesReturnTransportationToDock: true,
        advertisedPickupReturnArea:
          "Downtown Juneau Cruise Docks / Advertised Cruise Pickup Area",
        additionalOperatorTransferMinutesAdded: 0,
        generalizedToOtherOperators: false,
        provenanceNote:
          "Confirmed Juneau Tours Rezgo published durations are dock-to-dock and already include outbound operator transportation, the activity, and return transportation to the dock/advertised cruise pickup area.",
      },
    };
  }

  return {
    durationScope: "activity_only_unverified",
    includedOperatorTransportationInPublishedDuration: false,
    durationProvenance: {
      scope: "activity_only_unverified",
      operatorId: opId || "unverified-operator",
      verifiedOperatorOnly: false,
      includesOutboundTransportation: false,
      includesActivity: true,
      includesReturnTransportationToDock: false,
      advertisedPickupReturnArea: null,
      additionalOperatorTransferMinutesAdded: 0,
      generalizedToOtherOperators: false,
      provenanceNote:
        "Published duration is treated as activity-only until operator dock-to-dock pickup and return transportation provenance is explicitly confirmed.",
    },
  };
}

export interface LfseOptionSailingWindowAssessment {
  departureTime: string;
  shipArrivalTime: string | null;
  shipAllAboardTime: string | null;
  allAboardConfirmed: boolean;
  meetingPointAndReturnConfirmed: boolean;
  durationScope?: LfseJuneauTourDurationScope;
  estimatedDockReturnTime?: string | null;
  documentedBerthPickupMinutesApplied?: number;
  documentedBerthReturnMinutesApplied?: number;
  estimatedTourEndWithoutTransferTime: string | null;
  upperBoundRemainingSecondsBeforeTransfer: number | null;
  upperBoundRemainingBufferHmsLabel: string | null;
  status:
    | "recommended"
    | "outside_sailing_window_blocked"
    | "reduced_buffer_not_recommended"
    | "unverified_cruise_timing_pending_transfer_and_pickup";
  blockedForSailingWindow: boolean;
  displayLabel: string;
}

export interface LfseNormalizedJuneauDepartureOption {
  uid: string;
  rezgoCom: string | null;
  optionName: string | null;
  departureTime: string | null;
  availableSpots: number | null;
  availabilitySemantics:
    | "rezgo_date_search_spots"
    | "rezgo_catalog_overall"
    | "unconfirmed_check_provider";
  adultPriceUsd: number | null;
  childPriceUsd: number | null;
  serviceDate: string | null;
  checkedAt: string;
  dccCommerceWrapperHref: string | null;
  trackedFallbackHref?: string | null;
  windowAssessment: LfseOptionSailingWindowAssessment | null;
}

export interface LfseJuneauBookingProviderIdentity {
  operatorId: "juneau-tours-whale-watch";
  operatorName: string;
  verifiedRezgoCompanyName: string | null;
  verifiedRezgoDomain: string | null;
  rezgoCom: string | null;
  activeCheckoutProvider: "viator_approved_fallback" | "none_held_pending_mapping";
  fallbackProductCode: string | null;
  liveDirectRezgoCheckoutEnabled: false;
  checkoutDisclosure: string;
}

export interface LfseNormalizedJuneauSupplierTour {
  normalizedTourId: string;
  rezgoUid: string;
  rezgoCom: string | null;
  optionUids?: string[];
  departureOptions?: LfseNormalizedJuneauDepartureOption[];
  serviceDate?: string | null;
  checkedAt?: string | null;
  bookingProviderIdentity?: LfseJuneauBookingProviderIdentity;
  dccCommerceWrapperHref?: string | null;
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
  durationScope?: LfseJuneauTourDurationScope;
  includedOperatorTransportationInPublishedDuration?: boolean;
  durationProvenance?: LfseJuneauTourDurationProvenance;
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
  cruiseTimingVerificationStatus?:
    | "dock_to_dock_confirmed_window_evaluated"
    | "live_operator_availability_dock_to_dock_pending_ship_all_aboard"
    | "live_operator_availability_only_unverified_cruise_timing";
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
  shipArrivalTime?: string;
  shipAllAboardTime?: string;
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
  const windowCacheSuffix =
    options?.shipArrivalTime || options?.shipAllAboardTime
      ? `:${(options.shipArrivalTime || "none").trim()}-${(options.shipAllAboardTime || "none").trim()}`
      : "";
  const cacheKey = `lfse:${operatorKey}:${productKey}:${serviceDateKey}${windowCacheSuffix}`;

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
    if (options?.shipArrivalTime && options.shipArrivalTime.trim()) {
      qs.set("shipArrival", options.shipArrivalTime.trim());
    }
    if (options?.shipAllAboardTime && options.shipAllAboardTime.trim()) {
      qs.set("allAboard", options.shipAllAboardTime.trim());
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
        const allOptionsBlocked =
          Array.isArray(t.departureOptions) &&
          t.departureOptions.length > 0 &&
          t.departureOptions.every((opt) => opt.windowAssessment?.blockedForSailingWindow === true);

        const trackedFallbackHref =
          t.approvedFallbackViatorUrl && t.matchedViatorProductCode && !allOptionsBlocked
            ? buildAffiliateUrl(
                "viator",
                t.approvedFallbackViatorUrl,
                `juneau-normalized-${t.matchedViatorProductCode.toLowerCase()}`,
                t.title,
                true,
              )
            : null;

        const mappedDepartureOptions: LfseNormalizedJuneauDepartureOption[] | undefined =
          Array.isArray(t.departureOptions)
            ? t.departureOptions.map((opt) => {
                const optBlocked = Boolean(opt.windowAssessment?.blockedForSailingWindow);
                const optTrackedHref =
                  !optBlocked && t.approvedFallbackViatorUrl && t.matchedViatorProductCode
                    ? buildAffiliateUrl(
                        "viator",
                        t.approvedFallbackViatorUrl,
                        `juneau-normalized-${t.matchedViatorProductCode.toLowerCase()}-uid-${opt.uid.toLowerCase()}`,
                        `${t.title}${opt.optionName ? ` (${opt.optionName})` : ""}`,
                        true,
                      )
                    : null;
                return {
                  ...opt,
                  dccCommerceWrapperHref: optBlocked ? null : (opt.dccCommerceWrapperHref ?? null),
                  trackedFallbackHref: optTrackedHref,
                };
              })
            : undefined;

        const provenance = resolveLfseJuneauToursDockToDockProvenance({
          operatorId: t.operatorId,
          rezgoCom: t.rezgoCom,
          matchedViatorProductCode: t.matchedViatorProductCode,
          verifiedRezgoDomain: upstream.verifiedRezgoDomain,
          verifiedRezgoCompanyName: t.verifiedRezgoCompanyName ?? upstream.verifiedCompanyName,
          title: t.title,
        });

        return {
          ...t,
          durationScope: t.durationScope ?? provenance.durationScope,
          includedOperatorTransportationInPublishedDuration:
            t.includedOperatorTransportationInPublishedDuration ??
            provenance.includedOperatorTransportationInPublishedDuration,
          durationProvenance: t.durationProvenance ?? provenance.durationProvenance,
          startingLocation:
            t.startingLocation ||
            ((t.durationScope ?? provenance.durationScope) === "dock_to_dock"
              ? "Downtown Juneau Cruise Docks"
              : null),
          optionUids: Array.isArray(t.optionUids) ? [...t.optionUids] : [t.rezgoUid],
          departureOptions: mappedDepartureOptions,
          serviceDate: t.serviceDate ?? t.dateChecked ?? upstream.dateChecked ?? null,
          checkedAt: t.checkedAt ?? upstream.checkedAt ?? null,
          dccCommerceWrapperHref: allOptionsBlocked ? null : (t.dccCommerceWrapperHref ?? null),
          cruiseTimingVerificationStatus:
            t.cruiseTimingVerificationStatus ||
            "live_operator_availability_only_unverified_cruise_timing",
          cruiseTimingStatusLabel:
            t.cruiseTimingStatusLabel ||
            "Needs verification · Live operator availability · Cruise-safe timing unverified",
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

export type LfsePublicTimingBucket =
  | "recommended"
  | "confirm_return_timing"
  | "other_available_times"
  | "does_not_fit_ship_day";

export interface LfsePublicDepartureButton {
  selectionKey: string;
  departureTime24: string;
  timeLabel: string;
  estimatedReturnLabel: string | null;
  timingBucket: LfsePublicTimingBucket;
  timingStatusLabel: string;
  reducedBufferHmsLabel: string | null;
  requiresReducedBufferConfirmation: boolean;
  checkoutHref: string | null;
  plannerAddHref: string;
  rezgoUid: string;
}

export interface LfsePublicTourCardModel {
  cardId: string;
  title: string;
  operatorName: string;
  imageUrl: string;
  imageAlt: string;
  description: string;
  pickupDropoffLabel: string;
  durationLabel: string | null;
  startingPriceLabel: string | null;
  serviceDate: string | null;
  partySizePrompt: "How many people are going?";
  enteredPartySize: number | null;
  partyAvailabilityLabel: string | null;
  insufficientPartyMessage: string | null;
  recommendedDepartures: LfsePublicDepartureButton[];
  confirmTimingDepartures: LfsePublicDepartureButton[];
  otherAvailableTimes: LfsePublicDepartureButton[];
  doesNotFitShipDayTimes: Array<{ departureTime24: string; timeLabel: string }>;
  checkoutAvailable: boolean;
  checkoutCtaLabel: "Book this tour";
  checkoutProviderLabel: string | null;
  addToGroupPlanLabel: "Add to our cruise plan";
}

export interface LfsePublicJuneauAvailabilityView {
  ok: boolean;
  operatorName: string;
  serviceDate: string | null;
  enteredPartySize: number | null;
  partySizePrompt: "How many people are going?";
  shipArrivalTime?: string | null;
  shipAllAboardTime?: string | null;
  cards: LfsePublicTourCardModel[];
}

function parseLfseClockToSeconds(raw: string | null | undefined): number | null {
  const norm = normalizeLfseClock24(raw);
  if (!norm) return null;
  const m = norm.match(/^(\d{2}):(\d{2})$/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 3600 + mm * 60;
}

function formatLfseSecondsAsClockHhMm(totalSec: number): string {
  const normalized = ((Math.floor(totalSec) % 86400) + 86400) % 86400;
  const hh = Math.floor(normalized / 3600);
  const mm = Math.floor((normalized % 3600) / 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function formatLfseRemainingBufferHms(remainingSeconds: number): string {
  const clamped = Math.max(0, Math.floor(remainingSeconds));
  const hh = Math.floor(clamped / 3600);
  const mm = Math.floor((clamped % 3600) / 60);
  const ss = clamped % 60;
  return `${hh}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export function assessLfseJuneauDepartureAgainstShipWindow(params: {
  departureTime: string;
  durationMinutes: number | null;
  shipArrivalTime?: string | null;
  shipAllAboardTime?: string | null;
  allAboardConfirmed?: boolean;
  durationScope?: LfseJuneauTourDurationScope;
  documentedBerthPickupMinutes?: number | null;
  documentedBerthReturnMinutes?: number | null;
}): LfseOptionSailingWindowAssessment {
  const depSec = parseLfseClockToSeconds(params.departureTime);
  const arrSec = parseLfseClockToSeconds(params.shipArrivalTime);
  const allAboardSec = parseLfseClockToSeconds(params.shipAllAboardTime);
  const allAboardConfirmed = Boolean(params.allAboardConfirmed && allAboardSec !== null);
  const normArr = arrSec !== null ? formatLfseSecondsAsClockHhMm(arrSec) : null;
  const normAllAboard = allAboardSec !== null ? formatLfseSecondsAsClockHhMm(allAboardSec) : null;
  const isDockToDock = params.durationScope === "dock_to_dock";

  const berthPickupMin =
    typeof params.documentedBerthPickupMinutes === "number" &&
    Number.isFinite(params.documentedBerthPickupMinutes) &&
    params.documentedBerthPickupMinutes > 0
      ? Math.round(params.documentedBerthPickupMinutes)
      : 0;
  const berthReturnMin =
    typeof params.documentedBerthReturnMinutes === "number" &&
    Number.isFinite(params.documentedBerthReturnMinutes) &&
    params.documentedBerthReturnMinutes > 0
      ? Math.round(params.documentedBerthReturnMinutes)
      : 0;

  if (depSec === null || params.durationMinutes === null || params.durationMinutes <= 0) {
    return {
      departureTime: params.departureTime,
      shipArrivalTime: normArr,
      shipAllAboardTime: normAllAboard,
      allAboardConfirmed,
      meetingPointAndReturnConfirmed: false,
      durationScope: params.durationScope ?? "activity_only_unverified",
      estimatedDockReturnTime: null,
      documentedBerthPickupMinutesApplied: berthPickupMin,
      documentedBerthReturnMinutesApplied: berthReturnMin,
      estimatedTourEndWithoutTransferTime: null,
      upperBoundRemainingSecondsBeforeTransfer: null,
      upperBoundRemainingBufferHmsLabel: null,
      status: "unverified_cruise_timing_pending_transfer_and_pickup",
      blockedForSailingWindow: false,
      displayLabel: "Confirm return timing",
    };
  }

  const endSec = depSec + params.durationMinutes * 60;
  const endClock = formatLfseSecondsAsClockHhMm(endSec);

  if (arrSec !== null && depSec < arrSec + berthPickupMin * 60) {
    return {
      departureTime: params.departureTime,
      shipArrivalTime: normArr,
      shipAllAboardTime: normAllAboard,
      allAboardConfirmed,
      meetingPointAndReturnConfirmed: Boolean(allAboardConfirmed && isDockToDock),
      durationScope: params.durationScope ?? "activity_only_unverified",
      estimatedDockReturnTime: isDockToDock ? endClock : null,
      documentedBerthPickupMinutesApplied: berthPickupMin,
      documentedBerthReturnMinutesApplied: berthReturnMin,
      estimatedTourEndWithoutTransferTime: endClock,
      upperBoundRemainingSecondsBeforeTransfer: allAboardSec !== null ? allAboardSec - endSec : null,
      upperBoundRemainingBufferHmsLabel: null,
      status: "outside_sailing_window_blocked",
      blockedForSailingWindow: true,
      displayLabel: "Outside ship window",
    };
  }

  const effectiveReturnSec = endSec + (isDockToDock ? berthReturnMin * 60 : 0);

  if (allAboardSec !== null) {
    const remainingSec = allAboardSec - effectiveReturnSec;
    if (remainingSec <= 0) {
      return {
        departureTime: params.departureTime,
        shipArrivalTime: normArr,
        shipAllAboardTime: normAllAboard,
        allAboardConfirmed,
        meetingPointAndReturnConfirmed: Boolean(allAboardConfirmed && isDockToDock),
        durationScope: params.durationScope ?? "activity_only_unverified",
        estimatedDockReturnTime: isDockToDock ? endClock : null,
        documentedBerthPickupMinutesApplied: berthPickupMin,
        documentedBerthReturnMinutesApplied: berthReturnMin,
        estimatedTourEndWithoutTransferTime: endClock,
        upperBoundRemainingSecondsBeforeTransfer: remainingSec,
        upperBoundRemainingBufferHmsLabel: "0:00:00",
        status: "outside_sailing_window_blocked",
        blockedForSailingWindow: true,
        displayLabel: "Outside ship window",
      };
    }

    const hms = formatLfseRemainingBufferHms(remainingSec);
    if (Math.floor(remainingSec / 60) < 120) {
      return {
        departureTime: params.departureTime,
        shipArrivalTime: normArr,
        shipAllAboardTime: normAllAboard,
        allAboardConfirmed,
        meetingPointAndReturnConfirmed: Boolean(allAboardConfirmed && isDockToDock),
        durationScope: params.durationScope ?? "activity_only_unverified",
        estimatedDockReturnTime: isDockToDock ? endClock : null,
        documentedBerthPickupMinutesApplied: berthPickupMin,
        documentedBerthReturnMinutesApplied: berthReturnMin,
        estimatedTourEndWithoutTransferTime: endClock,
        upperBoundRemainingSecondsBeforeTransfer: remainingSec,
        upperBoundRemainingBufferHmsLabel: hms,
        status: "reduced_buffer_not_recommended",
        blockedForSailingWindow: false,
        displayLabel: `${hms} buffer · Not recommended`,
      };
    }

    if (isDockToDock && allAboardConfirmed) {
      return {
        departureTime: params.departureTime,
        shipArrivalTime: normArr,
        shipAllAboardTime: normAllAboard,
        allAboardConfirmed: true,
        meetingPointAndReturnConfirmed: true,
        durationScope: "dock_to_dock",
        estimatedDockReturnTime: endClock,
        documentedBerthPickupMinutesApplied: berthPickupMin,
        documentedBerthReturnMinutesApplied: berthReturnMin,
        estimatedTourEndWithoutTransferTime: endClock,
        upperBoundRemainingSecondsBeforeTransfer: remainingSec,
        upperBoundRemainingBufferHmsLabel: hms,
        status: "recommended",
        blockedForSailingWindow: false,
        displayLabel: "Estimated back 2+ hours before all aboard",
      };
    }
  }

  return {
    departureTime: params.departureTime,
    shipArrivalTime: normArr,
    shipAllAboardTime: normAllAboard,
    allAboardConfirmed: false,
    meetingPointAndReturnConfirmed: false,
    durationScope: params.durationScope ?? "activity_only_unverified",
    estimatedDockReturnTime: isDockToDock ? endClock : null,
    documentedBerthPickupMinutesApplied: berthPickupMin,
    documentedBerthReturnMinutesApplied: berthReturnMin,
    estimatedTourEndWithoutTransferTime: endClock,
    upperBoundRemainingSecondsBeforeTransfer:
      allAboardSec !== null ? allAboardSec - effectiveReturnSec : null,
    upperBoundRemainingBufferHmsLabel:
      allAboardSec !== null
        ? formatLfseRemainingBufferHms(allAboardSec - effectiveReturnSec)
        : null,
    status: "unverified_cruise_timing_pending_transfer_and_pickup",
    blockedForSailingWindow: false,
    displayLabel: "Confirm return timing",
  };
}

function normalizeLfseClock24(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.trim();
  if (!cleaned) return null;
  const ampm = cleaned.match(/^(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*(am|pm)$/i);
  if (ampm) {
    let h = Number(ampm[1]);
    const m = Number(ampm[2] || "0");
    const mer = ampm[4].toLowerCase();
    if (mer === "pm" && h !== 12) h += 12;
    if (mer === "am" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  const hhmm = cleaned.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (hhmm) {
    return `${String(Number(hhmm[1])).padStart(2, "0")}:${hhmm[2]}`;
  }
  return cleaned;
}

export function formatLfseClock12h(raw: string | null | undefined): string {
  const norm = normalizeLfseClock24(raw);
  if (!norm) return raw ? raw.trim() : "TBD";
  const m = norm.match(/^(\d{2}):(\d{2})$/);
  if (!m) return norm;
  const h24 = Number(m[1]);
  const min = m[2];
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${min} ${period}`;
}

export function buildLfsePublicJuneauAvailabilityView(
  feed: LfseJuneauNormalizedFeedResult,
  options?: {
    partySize?: number | null;
    shipArrivalTime?: string | null;
    shipAllAboardTime?: string | null;
    allAboardConfirmed?: boolean;
  },
): LfsePublicJuneauAvailabilityView {
  const rawParty = options?.partySize;
  const enteredPartySize =
    typeof rawParty === "number" && Number.isFinite(rawParty) && rawParty >= 1
      ? Math.min(99, Math.trunc(rawParty))
      : null;

  const operatorName = "Juneau Tours & Whale Watch";
  const cards: LfsePublicTourCardModel[] = [];
  const hasExplicitWindow = Boolean(options?.shipArrivalTime || options?.shipAllAboardTime);
  const resolvedAllAboardConfirmed =
    options?.allAboardConfirmed ?? Boolean(options?.shipAllAboardTime);

  for (const tour of feed.tours) {
    const resolvedDurationScope: LfseJuneauTourDurationScope =
      tour.durationScope ??
      resolveLfseJuneauToursDockToDockProvenance({
        operatorId: tour.operatorId,
        rezgoCom: tour.rezgoCom,
        matchedViatorProductCode: tour.matchedViatorProductCode,
        verifiedRezgoDomain: feed.verifiedRezgoDomain,
        verifiedRezgoCompanyName: tour.verifiedRezgoCompanyName ?? feed.verifiedCompanyName,
        title: tour.title,
      }).durationScope;
    const rawDepOptions: LfseNormalizedJuneauDepartureOption[] =
      Array.isArray(tour.departureOptions) && tour.departureOptions.length > 0
        ? tour.departureOptions
        : [
            ...(tour.departureTimes || []).map((dep, idx) => ({
              uid: tour.optionUids?.[idx] || `${tour.rezgoUid}-${idx + 1}`,
              rezgoCom: tour.rezgoCom,
              optionName: tour.optionName,
              departureTime: dep,
              availableSpots: tour.availableSpots,
              availabilitySemantics: tour.availabilitySemantics,
              adultPriceUsd: tour.adultPriceUsd,
              childPriceUsd: tour.childPriceUsd,
              serviceDate: tour.serviceDate ?? tour.dateChecked ?? feed.dateChecked,
              checkedAt: tour.checkedAt ?? feed.checkedAt ?? "",
              dccCommerceWrapperHref: tour.dccCommerceWrapperHref ?? null,
              trackedFallbackHref: tour.trackedFallbackHref ?? null,
              windowAssessment:
                tour.optionWindowAssessments?.find((a) => a.departureTime === dep) ?? null,
            })),
            ...(tour.blockedOutsideWindowDepartures || []).map((dep, idx) => ({
              uid: `${tour.rezgoUid}-blocked-${idx + 1}`,
              rezgoCom: tour.rezgoCom,
              optionName: tour.optionName,
              departureTime: dep,
              availableSpots: tour.availableSpots,
              availabilitySemantics: tour.availabilitySemantics,
              adultPriceUsd: tour.adultPriceUsd,
              childPriceUsd: tour.childPriceUsd,
              serviceDate: tour.serviceDate ?? tour.dateChecked ?? feed.dateChecked,
              checkedAt: tour.checkedAt ?? feed.checkedAt ?? "",
              dccCommerceWrapperHref: null,
              trackedFallbackHref: null,
              windowAssessment: {
                departureTime: dep,
                shipArrivalTime: null,
                shipAllAboardTime: null,
                allAboardConfirmed: true,
                meetingPointAndReturnConfirmed: false,
                estimatedTourEndWithoutTransferTime: null,
                upperBoundRemainingSecondsBeforeTransfer: 0,
                upperBoundRemainingBufferHmsLabel: "0:00:00",
                status: "outside_sailing_window_blocked" as const,
                blockedForSailingWindow: true,
                displayLabel: "Outside ship window",
              },
            })),
          ];

    const positiveOptions = rawDepOptions.filter(
      (opt) =>
        Boolean(opt.departureTime) &&
        typeof opt.availableSpots === "number" &&
        Number.isFinite(opt.availableSpots) &&
        opt.availableSpots > 0,
    );

    if (positiveOptions.length === 0) {
      continue;
    }

    const qualifiedOptions =
      enteredPartySize !== null
        ? positiveOptions.filter(
            (opt) =>
              typeof opt.availableSpots === "number" &&
              opt.availableSpots >= enteredPartySize,
          )
        : positiveOptions;

    const recommendedDepartures: LfsePublicDepartureButton[] = [];
    const confirmTimingDepartures: LfsePublicDepartureButton[] = [];
    const otherAvailableTimes: LfsePublicDepartureButton[] = [];
    const doesNotFitShipDayTimes: Array<{ departureTime24: string; timeLabel: string }> = [];

    const serviceDate = tour.serviceDate ?? tour.dateChecked ?? feed.dateChecked ?? null;

    for (const opt of qualifiedOptions) {
      const dep24 = normalizeLfseClock24(opt.departureTime) || String(opt.departureTime);
      const timeLabel = formatLfseClock12h(dep24);
      const assessment = hasExplicitWindow
        ? assessLfseJuneauDepartureAgainstShipWindow({
            departureTime: dep24,
            durationMinutes: tour.durationMinutes,
            shipArrivalTime: options?.shipArrivalTime,
            shipAllAboardTime: options?.shipAllAboardTime,
            allAboardConfirmed: resolvedAllAboardConfirmed,
            durationScope: resolvedDurationScope,
          })
        : opt.windowAssessment ??
          assessLfseJuneauDepartureAgainstShipWindow({
            departureTime: dep24,
            durationMinutes: tour.durationMinutes,
            shipArrivalTime: null,
            shipAllAboardTime: null,
            allAboardConfirmed: false,
            durationScope: resolvedDurationScope,
          });

      if (assessment?.blockedForSailingWindow) {
        doesNotFitShipDayTimes.push({ departureTime24: dep24, timeLabel });
        continue;
      }

      let timingBucket: LfsePublicTimingBucket = "confirm_return_timing";
      let timingStatusLabel = "Confirm return timing";
      let reducedBufferHmsLabel: string | null = null;
      let requiresReducedBufferConfirmation = false;

      if (assessment?.status === "recommended") {
        timingBucket = "recommended";
        timingStatusLabel = "Estimated back 2+ hours before all aboard";
      } else if (assessment?.status === "reduced_buffer_not_recommended") {
        timingBucket = "other_available_times";
        reducedBufferHmsLabel = assessment.upperBoundRemainingBufferHmsLabel || null;
        timingStatusLabel = reducedBufferHmsLabel
          ? `${reducedBufferHmsLabel} buffer · Not recommended`
          : "Reduced buffer · Not recommended";
        requiresReducedBufferConfirmation = true;
      }

      const baseTrackedHref =
        opt.trackedFallbackHref ||
        tour.trackedFallbackHref ||
        (tour.approvedFallbackViatorUrl && tour.matchedViatorProductCode
          ? buildAffiliateUrl(
              "viator",
              tour.approvedFallbackViatorUrl,
              `juneau-normalized-${tour.matchedViatorProductCode.toLowerCase()}-uid-${opt.uid.toLowerCase()}`,
              `${tour.title}${opt.optionName ? ` (${opt.optionName})` : ""}`,
              true,
            )
          : null);
      const checkoutHref = baseTrackedHref;

      const planQs = new URLSearchParams();
      planQs.set("title", tour.title);
      planQs.set("optionTitle", `${timeLabel} Departure`);
      planQs.set("port", "juneau");
      if (serviceDate) {
        planQs.set("date", serviceDate);
        planQs.set("serviceDate", serviceDate);
      }
      planQs.set("startsAt", dep24);
      if (typeof tour.durationMinutes === "number" && tour.durationMinutes > 0) {
        planQs.set("durationMinutes", String(tour.durationMinutes));
      }
      if (resolvedDurationScope === "dock_to_dock") {
        planQs.set("durationScope", "dock_to_dock");
        planQs.set("returnTransferMinutes", "0");
      }
      if (assessment?.status) {
        planQs.set("fitStatus", assessment.status);
      }
      planQs.set("operator", operatorName);
      planQs.set("operatorId", "juneau-tours-whale-watch");
      planQs.set("sourceSite", "lastfrontiershoreexcursions.com");
      if (tour.matchedViatorProductCode) {
        planQs.set("productCode", tour.matchedViatorProductCode);
        planQs.set("matchedViatorProductCode", tour.matchedViatorProductCode);
        planQs.set("fallbackProductCode", tour.matchedViatorProductCode);
        planQs.set("bookingProviderIdentity", "Checkout via Viator");
      }
      if (opt.rezgoCom ?? tour.rezgoCom) {
        planQs.set("rezgoCom", String(opt.rezgoCom ?? tour.rezgoCom));
      }
      if (opt.uid) {
        planQs.set("rezgoUid", opt.uid);
        planQs.set("optionCode", opt.uid);
      }
      const effectiveLocation =
        tour.startingLocation ||
        (resolvedDurationScope === "dock_to_dock" ? "Downtown Juneau Cruise Docks" : null);
      if (effectiveLocation) {
        planQs.set("location", effectiveLocation);
      }
      if (checkoutHref) {
        planQs.set("bookingUrl", checkoutHref);
      }

      const estimatedReturnClock = assessment?.estimatedDockReturnTime
        ? formatLfseClock12h(assessment.estimatedDockReturnTime)
        : null;

      const btn: LfsePublicDepartureButton = {
        selectionKey: `${tour.normalizedTourId}::${dep24}::${opt.uid}`,
        departureTime24: dep24,
        timeLabel,
        estimatedReturnLabel: estimatedReturnClock,
        timingBucket,
        timingStatusLabel,
        reducedBufferHmsLabel,
        requiresReducedBufferConfirmation,
        checkoutHref,
        plannerAddHref: `https://cruisepromenade.com/planner/add?${planQs.toString()}`,
        rezgoUid: opt.uid,
      };

      if (timingBucket === "recommended") {
        recommendedDepartures.push(btn);
      } else if (timingBucket === "other_available_times") {
        otherAvailableTimes.push(btn);
      } else {
        confirmTimingDepartures.push(btn);
      }
    }

    const totalSelectable =
      recommendedDepartures.length +
      confirmTimingDepartures.length +
      otherAvailableTimes.length;

    if (enteredPartySize === null && totalSelectable === 0 && doesNotFitShipDayTimes.length === 0) {
      continue;
    }

    const noun = enteredPartySize === 1 ? "person" : "people";
    const partyAvailabilityLabel =
      enteredPartySize !== null && totalSelectable > 0
        ? `Available for your group of ${enteredPartySize}`
        : null;
    const insufficientPartyMessage =
      enteredPartySize !== null && totalSelectable === 0
        ? `No departure currently has enough availability for ${enteredPartySize} ${noun}.`
        : null;

    const startingPriceLabel =
      typeof tour.adultPriceUsd === "number" && tour.adultPriceUsd > 0
        ? `From $${Number.isInteger(tour.adultPriceUsd) ? tour.adultPriceUsd.toFixed(0) : tour.adultPriceUsd.toFixed(2)} adult`
        : null;

    const checkoutAvailable = Boolean(
      tour.matchedViatorProductCode && (tour.trackedFallbackHref || tour.approvedFallbackViatorUrl),
    );

    const lowerTitle = tour.title.toLowerCase();
    const isComboGlacier =
      tour.activityCategory === "combo-whale-glacier" || lowerTitle.includes("mendenhall");
    const isShuttle =
      tour.activityCategory === "mendenhall-glacier-tours" || lowerTitle.includes("shuttle");
    const cardIndex = cards.length;
    const whaleImagePool = [
      "/images/alaska/juneau-whale.jpg",
      "/images/alaska/whale-watching.jpg",
      "/images/alaska/allen-marine-catamaran.jpg",
    ];
    const imageUrl = isShuttle
      ? "/images/alaska/mendenhall-visitor-center.jpg"
      : isComboGlacier
        ? "/images/alaska/mendenhall-glacier.jpg"
        : whaleImagePool[cardIndex % whaleImagePool.length];
    const imageAlt = isShuttle
      ? "Mendenhall Glacier Visitor Center and shuttle access in Juneau, Alaska"
      : isComboGlacier
        ? "Mendenhall Glacier and Juneau whale-watching excursion"
        : "Humpback whale watching excursion in Juneau coastal waters";
    const description = isShuttle
      ? "Direct round-trip motorcoach service between downtown Juneau cruise docks and the Mendenhall Glacier Recreation Area."
      : isComboGlacier
        ? "Guided Auke Bay whale-watching cruise paired with timed Mendenhall Glacier exploration and round-trip cruise-dock shuttle."
        : "Guided humpback whale and marine wildlife cruise in Auke Bay with round-trip shuttle from downtown Juneau cruise docks.";
    const pickupDropoffLabel =
      tour.startingLocation && !/auke bay/i.test(tour.startingLocation)
        ? `Round-trip pickup & drop-off: ${tour.startingLocation}`
        : "Round-trip pickup & drop-off at Downtown Juneau Cruise Docks included";

    cards.push({
      cardId: tour.normalizedTourId,
      title: tour.title,
      operatorName,
      imageUrl,
      imageAlt,
      description,
      pickupDropoffLabel,
      durationLabel:
        tour.durationLabel ||
        (tour.durationMinutes ? `${Math.round((tour.durationMinutes / 60) * 100) / 100} hours` : null),
      startingPriceLabel,
      serviceDate,
      partySizePrompt: "How many people are going?",
      enteredPartySize,
      partyAvailabilityLabel,
      insufficientPartyMessage,
      recommendedDepartures,
      confirmTimingDepartures,
      otherAvailableTimes,
      doesNotFitShipDayTimes,
      checkoutAvailable,
      checkoutCtaLabel: "Book this tour",
      checkoutProviderLabel: checkoutAvailable ? "Checkout via Viator" : null,
      addToGroupPlanLabel: "Add to our cruise plan",
    });
  }

  return {
    ok: feed.ok,
    operatorName,
    serviceDate: feed.dateChecked ?? null,
    enteredPartySize,
    partySizePrompt: "How many people are going?",
    shipArrivalTime: options?.shipArrivalTime ?? null,
    shipAllAboardTime: options?.shipAllAboardTime ?? null,
    cards,
  };
}
