import tours from "@/data/tours.json";
import { normalizeViatorCurrency } from "@/lib/viator/config";
import { buildViatorSearchUrl } from "@/lib/viator/links";
import {
  normalizeViatorProductDetail,
  type ViatorMediaAsset,
  type ViatorProductDetail,
} from "@/lib/viator/schema";

type LocalTour = {
  id?: string | number;
  product_code?: string;
  name?: string;
  title?: string;
  description?: string;
  image_url?: string;
  city?: string;
  region?: string;
  duration?: string;
  duration_minutes?: number;
  price_from?: number;
  currency?: string;
  rating?: number;
  review_count?: number;
  supplier_name?: string;
  itinerary_type?: string;
  booking_confirmation_type?: string;
  product_option_titles?: string[];
  languages?: string[];
  inclusions?: string[];
  exclusions?: string[];
  pickup?: string[];
  departure?: string[];
  returnDetails?: string[];
  ticket_type?: string;
};

function asArray(raw: unknown): LocalTour[] {
  if (Array.isArray(raw)) return raw as LocalTour[];
  if (raw && typeof raw === "object") {
    const record = raw as { tours?: LocalTour[]; items?: LocalTour[] };
    if (Array.isArray(record.tours)) return record.tours;
    if (Array.isArray(record.items)) return record.items;
  }
  return [];
}

function toDurationMinutes(tour: LocalTour): number | null {
  if (typeof tour.duration_minutes === "number") return tour.duration_minutes;
  const duration = String(tour.duration || "").toLowerCase();
  const hourMatch = duration.match(/(\d+(?:\.\d+)?)\s*hour/);
  if (hourMatch) return Math.round(Number(hourMatch[1]) * 60);
  const minuteMatch = duration.match(/(\d+(?:\.\d+)?)\s*min/);
  if (minuteMatch) return Math.round(Number(minuteMatch[1]));
  return null;
}

function toSupplierImages(tour: LocalTour): ViatorMediaAsset[] {
  if (!tour.image_url) return [];
  return [{ url: tour.image_url, source: "supplier" }];
}

export function getLocalViatorProductDetail(productCodeOrId: string): ViatorProductDetail | null {
  const catalog = asArray(tours);
  const tour = catalog.find(
    (row) =>
      String(row.product_code || "") === productCodeOrId ||
      String(row.id || "") === productCodeOrId
  );
  if (!tour) return null;

  const title = String(tour.name || tour.title || "Experience");
  return normalizeViatorProductDetail({
    product_code: String(tour.product_code || tour.id || productCodeOrId),
    title,
    short_description: tour.description || null,
    overview: tour.description || null,
    rating: typeof tour.rating === "number" ? tour.rating : null,
    review_count: typeof tour.review_count === "number" ? tour.review_count : null,
    price_from: typeof tour.price_from === "number" ? tour.price_from : null,
    currency: normalizeViatorCurrency(tour.currency),
    duration_minutes: toDurationMinutes(tour),
    image_url: tour.image_url || null,
    supplier_name: tour.supplier_name || null,
    itinerary_type: tour.itinerary_type || null,
    booking_confirmation_type: tour.booking_confirmation_type || null,
    product_option_titles: tour.product_option_titles || null,
    url: buildViatorSearchUrl([tour.city || "", title].filter(Boolean).join(" ").trim() || title),
    itinerary: tour.description ? [tour.description] : [],
    inclusions: tour.inclusions || [],
    exclusions: tour.exclusions || [],
    pickup: tour.pickup || [],
    departure: tour.departure || [],
    returnDetails: tour.returnDetails || [],
    languages: tour.languages || [],
    ticketType: tour.ticket_type || null,
    bookingQuestionRefs: [],
    cancellationPolicy: {
      policyType: "STANDARD",
      description: "Check live Viator detail for the latest cancellation policy.",
      freeCancellation: true,
    },
    supplierImages: toSupplierImages(tour),
    travelerImages: [],
    reviews: [],
  });
}
