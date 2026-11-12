import { buildAffiliateUrl } from "./affiliate/links";

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
  startingLocation: string | null;
  dateChecked: string | null;
  availableSpots: number | null;
  availabilitySemantics:
    | "rezgo_date_search_spots"
    | "rezgo_catalog_overall"
    | "unconfirmed_check_provider";
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
  readOnly: true;
  liveDirectRezgoCheckoutEnabled: false;
  verifiedCompanyName: string | null;
  verifiedRezgoDomain: string | null;
  currency: string;
  tours: LfseNormalizedJuneauSupplierTour[];
  supplierConflicts: LfseSupplierConflictSummary[];
}

function buildFallbackOnlyResult(): LfseJuneauNormalizedFeedResult {
  return {
    ok: false,
    fallbackActive: true,
    source: "lfse_local_fallback",
    checkedAt: null,
    dateChecked: null,
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
 * - Direct Rezgo checkout remains disabled (`liveDirectRezgoCheckoutEnabled: false`); any outbound
 *   booking CTA routes strictly to Last Frontier's approved Viator affiliate fallback (`P00281144`)
 *   only when an approved 5857* SKU is matched.
 * - If DCC or Rezgo is unavailable, fails open cleanly (`fallbackActive: true`, `tours: []`) so
 *   all existing approved Last Frontier pages and Viator offers continue operating unchanged.
 */
export async function loadLfseJuneauNormalizedSupplierFeed(options?: {
  date?: string;
  activitySlug?: string;
  revalidateSeconds?: number;
  fetchImpl?: typeof fetch;
}): Promise<LfseJuneauNormalizedFeedResult> {
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
  if (options?.date && /^\d{4}-\d{2}-\d{2}$/.test(options.date)) {
    qs.set("date", options.date);
  }

  const url = `${baseUrl}/api/v1/cruise/port-day-excursions?${qs.toString()}`;
  const fetchFn = options?.fetchImpl ?? fetch;

  try {
    const fetchInit: RequestInit & { next?: { revalidate?: number } } = {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
    };
    if (typeof options?.revalidateSeconds === "number") {
      fetchInit.next = { revalidate: options.revalidateSeconds };
    } else {
      fetchInit.cache = "no-store";
    }

    const res = await fetchFn(url, fetchInit);
    if (!res.ok) {
      return buildFallbackOnlyResult();
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
      return buildFallbackOnlyResult();
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
        trackedFallbackHref,
        liveDirectRezgoCheckoutEnabled: false,
        isolatedSecondaryProperty: true,
        influencesPrimaryDccRanking: false,
      };
    });

    return {
      ok: Boolean(upstream.ok && mappedTours.length > 0),
      fallbackActive: !upstream.ok || mappedTours.length === 0,
      source: upstream.source || "dcc_approved_fallback",
      checkedAt: upstream.checkedAt || null,
      dateChecked: upstream.dateChecked ?? null,
      readOnly: true,
      liveDirectRezgoCheckoutEnabled: false,
      verifiedCompanyName: upstream.verifiedCompanyName ?? null,
      verifiedRezgoDomain: upstream.verifiedRezgoDomain ?? null,
      currency: upstream.currency || "USD",
      tours: mappedTours,
      supplierConflicts: Array.isArray(upstream.supplierConflicts)
        ? upstream.supplierConflicts
        : buildFallbackOnlyResult().supplierConflicts,
    };
  } catch {
    return buildFallbackOnlyResult();
  }
}
