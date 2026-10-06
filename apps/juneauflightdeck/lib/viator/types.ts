export interface ViatorJuneauProduct {
  id: string;
  productCode: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  durationLabel: string | null;
  priceLabel: string | null;
  priceFrom: number | null;
  currency: string;
  priceDisclaimer?: string;
  imageUrl: string | null;
  imageAlt: string;
  imageSource: "SUPPLIER_PROVIDED" | "LOCAL_AUTHORITY";
  supplierName: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  badges: string[];
  cancellationPolicy: string;
  bookHref: string;
  tourType: "glacier_landing" | "dog_sledding" | "flightseeing" | "ice_trek" | "combo";
  isLive: boolean;
  dataTimestamp: string;
}

export interface ViatorJuneauProductsResponse {
  ok: boolean;
  generatedAt: string;
  isLive: boolean;
  status: "live_verified" | "cached_snapshot" | "operator_profiles" | "inventory_unavailable";
  snapshotTimestamp?: string;
  selectedDate: string | null;
  passengerCount?: number;
  signals?: {
    headline?: string;
    availabilityStatus?: "live_checked" | "calendar_check_required" | "inventory_unavailable";
  };
  attribution: {
    source: string;
    notice: string;
    poweredBy: string;
  };
  browseHref: string;
  waitlistHref?: string;
  products: ViatorJuneauProduct[];
}

export interface ViatorTravelerPhoto {
  url: string;
  caption?: string;
}

export interface ViatorTravelerReview {
  reviewId: string | number;
  author: string;
  rating: number;
  publishedDate: string;
  title?: string;
  text: string;
  travelerPhotos: ViatorTravelerPhoto[];
}

export interface ViatorProductReviewsResponse {
  ok: boolean;
  productCode: string;
  rating: number;
  reviewCount: number;
  attribution: string;
  reviews: ViatorTravelerReview[];
  fetchedAt: string;
}

export interface UseViatorProductsOptions {
  date?: string | null;
  passengerCount?: number;
  tourType?: "all" | "glacier_landing" | "dog_sledding" | "flightseeing" | "ice_trek";
  initialData?: ViatorJuneauProductsResponse | null;
  autoFetch?: boolean;
}
