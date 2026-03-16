import { getViatorPublicConfig, type ViatorAccessTier } from "@/lib/viator/config";

export type ViatorCapabilities = {
  accessTier: ViatorAccessTier;
  canUseSearch: boolean;
  canUseDestinations: boolean;
  canUseTags: boolean;
  canUseReviews: boolean;
  canUseTravelerPhotos: boolean;
  canUseModifiedSince: boolean;
  canUseSchedules: boolean;
  canUseBooking: boolean;
  canUseAmendments: boolean;
  canUseMerchantFlows: boolean;
  shouldUseIngestionModel: boolean;
};

const CAPABILITIES_BY_TIER: Record<ViatorAccessTier, Omit<ViatorCapabilities, "accessTier">> = {
  basic_access: {
    canUseSearch: true,
    canUseDestinations: true,
    canUseTags: true,
    canUseReviews: true,
    canUseTravelerPhotos: true,
    canUseModifiedSince: false,
    canUseSchedules: false,
    canUseBooking: false,
    canUseAmendments: false,
    canUseMerchantFlows: false,
    shouldUseIngestionModel: false,
  },
  full_access: {
    canUseSearch: true,
    canUseDestinations: true,
    canUseTags: true,
    canUseReviews: true,
    canUseTravelerPhotos: true,
    canUseModifiedSince: true,
    canUseSchedules: true,
    canUseBooking: false,
    canUseAmendments: false,
    canUseMerchantFlows: false,
    shouldUseIngestionModel: true,
  },
  booking_access: {
    canUseSearch: true,
    canUseDestinations: true,
    canUseTags: true,
    canUseReviews: true,
    canUseTravelerPhotos: true,
    canUseModifiedSince: true,
    canUseSchedules: true,
    canUseBooking: true,
    canUseAmendments: true,
    canUseMerchantFlows: false,
    shouldUseIngestionModel: true,
  },
  merchant: {
    canUseSearch: true,
    canUseDestinations: true,
    canUseTags: true,
    canUseReviews: true,
    canUseTravelerPhotos: true,
    canUseModifiedSince: true,
    canUseSchedules: true,
    canUseBooking: true,
    canUseAmendments: true,
    canUseMerchantFlows: true,
    shouldUseIngestionModel: true,
  },
};

export function getViatorCapabilities(
  accessTier: ViatorAccessTier = getViatorPublicConfig().accessTier
): ViatorCapabilities {
  return {
    accessTier,
    ...CAPABILITIES_BY_TIER[accessTier],
  };
}

export function hasViatorCapability(capability: keyof Omit<ViatorCapabilities, "accessTier">): boolean {
  return Boolean(getViatorCapabilities()[capability]);
}
