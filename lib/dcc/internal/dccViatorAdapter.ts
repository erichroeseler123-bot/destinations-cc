import { getViatorClient } from "@/lib/viator/client";
import {
  readVerifiedProductFromCache,
  isProductDisplayable,
  isAvailabilityStale,
  validatePickupClaim,
  validatePortOperation,
  validateCruiseSafetyWindow,
  type VerifiedProductRecord,
  type CruiseTimeWindow,
} from "@/lib/viator/verified-product-cache";
import { resolveViatorCodeForSite, resolveInternalIdForViatorCode } from "@/lib/viator/mappings";
import { appendViatorAttribution } from "@/lib/viator/links";
import { getViatorPublicConfig } from "@/lib/viator/config";

export type DccAdapterRequest = {
  siteId: string;
  internalProductId: string;
  targetPort?: string;
  requiresHotelPickup?: boolean;
  cruiseWindow?: CruiseTimeWindow;
};

export type DccAdapterResponse = {
  success: boolean;
  product?: VerifiedProductRecord;
  reason?: string;
  isStaleAvailability: boolean;
  trackedUrl?: string;
};

export type DccLiveAvailabilityRequest = {
  siteId: string;
  internalProductId: string;
  bookingDate: string; // YYYY-MM-DD
  adultCount: number;
};

export type DccLiveAvailabilityResponse = {
  success: boolean;
  available: boolean;
  productCode: string;
  bookingDate: string;
  retailPrice?: number;
  partnerNetPrice?: number;
  currency: string;
  remainingCapacity?: number;
  bookableOptions: Array<{
    optionCode: string;
    ratePlanCode?: string;
    startTime?: string;
    available: boolean;
    retailPrice?: number;
  }>;
  trackedBookingUrl: string;
  reason?: string;
};

const SITE_DOMAINS: Record<string, string> = {
  welcometotheswamp: "welcometotheswamp.com",
  welcometoneworleanstours: "welcometoneworleanstours.com",
  "last-frontier-shore-excursions": "lastfrontiershoreexcursions.com",
  welcometoalaskatours: "welcometoalaskatours.com",
  cruisepromenade: "cruisepromenade.com",
  dcc: "destinationcommandcenter.com",
};

/**
 * Generate a standardized, verified DCC affiliate outbound link.
 * Preserves the canonical product URL path and adds validated attribution parameters.
 */
export function generateDccTrackedUrl(options: {
  siteId: string;
  internalProductId: string;
  canonicalUrl: string;
  pageType?: string;
  customCampaign?: string;
}): string {
  const domain = SITE_DOMAINS[options.siteId] || "destinationcommandcenter.com";
  const pageType = options.pageType || "guide";
  const campaign =
    options.customCampaign || `dcc-${options.siteId}-${pageType}-${options.internalProductId}`;

  const config = getViatorPublicConfig();

  return appendViatorAttribution(options.canonicalUrl, {
    campaign,
    medium: "link",
    preserveExistingCampaign: false,
  });
}

/**
 * Retrieve a verified product through the DCC adapter with all business rules enforced.
 */
export function getVerifiedProductForSite(
  req: DccAdapterRequest
): DccAdapterResponse {
  const viatorCode = resolveViatorCodeForSite(req.siteId, req.internalProductId);
  if (!viatorCode) {
    return {
      success: false,
      reason: `No verified Viator mapping found for site "${req.siteId}" and internal ID "${req.internalProductId}".`,
      isStaleAvailability: false,
    };
  }

  const cached = readVerifiedProductFromCache(viatorCode);
  if (!cached) {
    return {
      success: false,
      reason: `Product "${viatorCode}" is not yet cached in the Verified Product Cache.`,
      isStaleAvailability: false,
    };
  }

  // Business Rule 1: Displayability / Inactive check
  if (!isProductDisplayable(cached)) {
    return {
      success: false,
      reason: `Product "${viatorCode}" is marked inactive in the catalog.`,
      isStaleAvailability: false,
    };
  }

  // Business Rule 2: Hotel pickup verification
  if (req.requiresHotelPickup && !validatePickupClaim(cached, true)) {
    return {
      success: false,
      reason: `Hotel pickup claim rejected: tour "${viatorCode}" does not provide verified hotel pickup.`,
      isStaleAvailability: false,
    };
  }

  // Business Rule 3: Port operation boundary
  if (req.targetPort && !validatePortOperation(cached, req.targetPort)) {
    return {
      success: false,
      reason: `Port boundary violation: tour "${viatorCode}" does not operate in target port "${req.targetPort}".`,
      isStaleAvailability: false,
    };
  }

  // Business Rule 4: Cruise passenger safe return window
  if (req.cruiseWindow) {
    const cruiseCheck = validateCruiseSafetyWindow(cached, req.cruiseWindow);
    if (!cruiseCheck.fits) {
      return {
        success: false,
        reason: cruiseCheck.reason,
        isStaleAvailability: false,
      };
    }
  }

  const isStale = isAvailabilityStale(cached);
  const trackedUrl = generateDccTrackedUrl({
    siteId: req.siteId,
    internalProductId: req.internalProductId,
    canonicalUrl: cached.stable.canonicalViatorUrl,
  });

  return {
    success: true,
    product: cached,
    isStaleAvailability: isStale,
    trackedUrl,
  };
}

/**
 * Execute a request-time live availability check through the DCC adapter.
 * Communicates server-to-server with Viator without exposing credentials to satellite sites.
 */
export async function checkDccLiveAvailability(
  req: DccLiveAvailabilityRequest
): Promise<DccLiveAvailabilityResponse> {
  const viatorCode = resolveViatorCodeForSite(req.siteId, req.internalProductId);
  if (!viatorCode) {
    return {
      success: false,
      available: false,
      productCode: "",
      bookingDate: req.bookingDate,
      currency: "USD",
      bookableOptions: [],
      trackedBookingUrl: "",
      reason: `Unrecognized product mapping for site ${req.siteId}.`,
    };
  }

  const client = getViatorClient();

  try {
    type AvailabilityResponse = {
      productCode?: string;
      currency?: string;
      bookableItems?: Array<{
        productOptionCode: string;
        ratePlanCode?: string;
        startTime?: string;
        available: boolean;
        totalPrice?: {
          price?: {
            recommendedRetailPrice?: number;
            partnerNetPrice?: number;
          };
        };
      }>;
    };

    const rawResult = await client.checkAvailability({
      productCode: viatorCode,
      travelDate: req.bookingDate,
      currency: "USD",
      paxMix: [{ ageBand: "ADULT", numberOfTravelers: req.adultCount || 2 }],
    });
    const checkResult = (rawResult || {}) as AvailabilityResponse;

    const items = Array.isArray(checkResult.bookableItems) ? checkResult.bookableItems : [];
    const options = items.map((item) => ({
      optionCode: item.productOptionCode,
      ratePlanCode: item.ratePlanCode,
      startTime: item.startTime,
      available: item.available,
      retailPrice: item.totalPrice?.price?.recommendedRetailPrice,
    }));

    const isAvailable = options.some((opt) => opt.available);
    const firstOption = options.find((opt) => opt.available) || options[0];

    // Canonical destination URL with tracked attribution
    const cached = readVerifiedProductFromCache(viatorCode);
    const canonicalUrl =
      cached?.stable.canonicalViatorUrl ||
      `https://www.viator.com/tours/preview/d0-${viatorCode}`;

    const trackedBookingUrl = generateDccTrackedUrl({
      siteId: req.siteId,
      internalProductId: req.internalProductId,
      canonicalUrl,
      pageType: "availability-check",
    });

    return {
      success: true,
      available: isAvailable,
      productCode: viatorCode,
      bookingDate: req.bookingDate,
      retailPrice: firstOption?.retailPrice,
      currency: "USD",
      bookableOptions: options,
      trackedBookingUrl,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      available: false,
      productCode: viatorCode,
      bookingDate: req.bookingDate,
      currency: "USD",
      bookableOptions: [],
      trackedBookingUrl: "",
      reason: `Live availability check error: ${errorMsg}`,
    };
  }
}
