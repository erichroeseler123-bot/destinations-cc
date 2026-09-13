export type AffiliateSource = "viator" | "getyourguide";

export type AvailabilityStatus = "available" | "limited" | "seasonal" | "check_live";

export type FreshnessStatus = "approximate_editorial" | "cached" | "stale" | "live_feed";

export type PortSlug = "juneau" | "skagway" | "ketchikan" | "sitka" | "icy-strait-point";

export type WeatherSensitivity = "Low" | "Moderate" | "High" | "Low to Moderate" | "Moderate to High";

export interface NormalizedAffiliateExcursion {
  source: AffiliateSource;
  productId?: string | null;
  isExactProduct: boolean;
  officialUrl: string;
  provider: string;
  title: string;
  description: string;
  duration: string;
  durationMinutes: number;
  priceFrom: number;
  currency: string;
  priceLabel: string;
  priceNote: string;
  datesAndTimeSlots: string[];
  scheduleLabel: string;
  availabilityStatus: AvailabilityStatus;
  cancellationPolicy: string;
  meetingPoint: string;
  pickupDropoff: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  languages: string[];
  participantLimits?: {
    maxGroupSize?: number;
    minGroupSize?: number;
  };
  ageRestrictions?: string;
  accessibility?: {
    wheelchairAccessible: boolean;
    mobilityNotes: string;
  };
  privateOrShared: "shared" | "private";
  mobileVoucher: boolean;
  tags: string[];
  permittedRatings?: {
    score: number;
    reviewCount: number;
  };
  permittedImages: Array<{
    url: string;
    caption: string;
    credit?: string;
  }>;
  itinerary: string[];
  sourceLabel: string;
  checkedAt: string;
  sourceTimestamp: string;
  lastCheckedTimestamp: string;
  freshnessStatus: FreshnessStatus;
  attributionCampaign: string;
  portSlug: PortSlug;
  activitySlug: string;
  weatherSensitivity: WeatherSensitivity;
  transferBufferMinutes: number;
  planningMarginMinutes: number;
}

export type CruiseFitStatus = "strong_fit" | "tight_fit" | "does_not_fit" | "unknown";

export interface CruiseWindowCalculation {
  status: CruiseFitStatus;
  statusLabel: string;
  safetyBufferMinutes: number;
  tourEndTimeMinutes: number;
  returnToPierMinutes: number;
  allAboardMinutes: number;
  summary: string;
  reasons: string[];
}
