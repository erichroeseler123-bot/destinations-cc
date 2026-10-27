import { getViatorPublicConfig, type ViatorAccessTier } from "./config";

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
  canUseBookingReporting: boolean;
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
    canUseBookingReporting: false,
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
    canUseBookingReporting: true,
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
    canUseBookingReporting: true,
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
    canUseBookingReporting: true,
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

export const getViatorAccessCapabilities = getViatorCapabilities;

export function hasViatorCapability(capability: keyof Omit<ViatorCapabilities, "accessTier">): boolean {
  return Boolean(getViatorCapabilities()[capability]);
}
