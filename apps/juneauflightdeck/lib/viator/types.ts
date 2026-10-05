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
  imageUrl: string;
  imageAlt: string;
  imageSource: "SUPPLIER_PROVIDED";
  supplierName: string | null;
  rating: number;
  reviewCount: number;
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
  status: "live_verified" | "cached_snapshot";
  snapshotTimestamp?: string;
  selectedDate: string | null;
  passengerCount?: number;
  signals?: {
    headline?: string;
    availabilityStatus?: "live_checked" | "calendar_check_required";
  };
  attribution: {
    source: string;
    notice: string;
    poweredBy: string;
  };
  browseHref: string;
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
