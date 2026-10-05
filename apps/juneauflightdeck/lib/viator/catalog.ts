import type { ViatorJuneauProduct, ViatorJuneauProductsResponse } from "./types";

/**
 * Historical snapshot timestamp for verified fallback catalog data.
 * Real-time prices, availability, and review counts are never claimed as current live
 * results when this fallback is served.
 */
export const SNAPSHOT_TIMESTAMP = "2026-10-05T18:00:00.000Z";

/**
 * Authenticated API verification (Oct 2026):
 * - Direct queries for synthetic codes (10423P1, 10423P2, 25488P1, 3129P1) returned HTTP 404 Not Found.
 * - Verified historical Juneau helicopter code (6251SHOREXICEWALK) returned HTTP 200 with status INACTIVE.
 * - Authenticated destination searches across Juneau (941) and Skagway (943) confirmed 0 active commercial
 *   helicopter flightseeing tours currently published on Viator due to the seasonal winter cruise closure.
 *
 * Per provenance requirements, only genuine saved API responses establish catalog cards.
 * Because 0 active Juneau helicopter products exist in the authenticated API, this fallback is empty
 * and the site honestly indicates the seasonal closure with a priority waitlist CTA.
 */
export const VERIFIED_FALLBACK_SNAPSHOT: ViatorJuneauProduct[] = [];

export const VIATOR_TOURS_BY_CODE: Record<string, ViatorJuneauProduct> = {};

export const VIATOR_TOURS_BY_OPERATOR: Record<string, ViatorJuneauProduct[]> = {
  TEMSCO: [],
  Coastal: [],
  NorthStar: [],
};

export const DEFAULT_FALLBACK_RESPONSE: ViatorJuneauProductsResponse = {
  ok: true,
  generatedAt: SNAPSHOT_TIMESTAMP,
  products: VERIFIED_FALLBACK_SNAPSHOT,
  isLive: false,
  status: "seasonally_unavailable",
  snapshotTimestamp: SNAPSHOT_TIMESTAMP,
  selectedDate: null,
  passengerCount: 2,
  signals: {
    headline:
      "Juneau helicopter excursions are seasonally closed for the off-season. Join the 2027 priority waitlist for early departure access.",
    availabilityStatus: "seasonally_unavailable",
  },
  attribution: {
    source: "Viator Partner API",
    notice:
      "Verified via Viator Partner API. Commercial flightseeing operations in Juneau resume for the 2027 Alaska cruise season (May–September).",
    poweredBy: "Official Viator Partner",
  },
  browseHref:
    "https://www.viator.com/Juneau-tourism/d941-r8418047970-s323605581?pid=P00058396&mcid=42383&medium=api",
  waitlistHref: "/helicopter-waitlist",
};
