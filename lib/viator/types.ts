export type ViatorIntent =
  | "whale-watching"
  | "helicopter-tours"
  | "swamp-tour"
  | "airboat"
  | "jeep-tour"
  | "luxury"
  | "value"
  | "family"
  | "cruise-compatible";

export type ViatorResolutionPath =
  | "tier1_exact"
  | "tier2_filtered"
  | "tier3_geo"
  | "none";

export type ViatorAvailabilityStatus = "available" | "limited" | "unknown";

export type ResolverInput = {
  destinationId: number | null;
  canonicalGeoId: string;
  intent: ViatorIntent;
  minRating?: number;
  minReviewCount?: number;
  minPrice?: number;
  maxPrice?: number;
  cruiseCompatible?: boolean;
  partySize?: number;
  travelDate?: string;
  resolutionPathHint?: Exclude<ViatorResolutionPath, "none">;
};

export type NormalizedViatorProduct = {
  productCode: string;
  title: string;
  description: string | null;
  price: number | null;
  currency: string | null;
  rating: number | null;
  reviewCount: number | null;
  durationMinutes: number | null;
  categories: string[];
  tags: string[];
  supplierName: string | null;
  bookUrl: string;
  availabilityStatus: ViatorAvailabilityStatus;
};

export type RankedRecommendation = {
  winner: NormalizedViatorProduct | null;
  score: number | null;
  confidence: "high" | "medium" | "low" | "none";
  resolutionPath: ViatorResolutionPath;
  fitReason: string;
  alternatives: NormalizedViatorProduct[];
};
