import tours from "@/data/tours.json";
import { getViatorClient } from "@/lib/viator/client";
import { getCachedOrFetchViatorReviews, readViatorReviewCache } from "@/lib/viator/review-cache";
import { splitSupplierAndTravelerMedia } from "@/lib/viator/media";
import { normalizeViatorCurrency } from "@/lib/viator/config";
import { buildViatorSearchUrl } from "@/lib/viator/links";
import {
  normalizeViatorProductDetail,
  type ViatorDestinationCatalogRow,
  type ViatorMediaAsset,
  type ViatorProductDetail,
  type ViatorReview,
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

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function flattenTextList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry === "string" && entry.trim()) return [entry.trim()];
    const record = asRecord(entry);
    const text = firstString(record?.description, record?.title, record?.label, record?.value, record?.text);
    return text ? [text] : [];
  });
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

function extractVariants(images: unknown, source: "supplier" | "traveler") {
  if (!Array.isArray(images)) return [];
  return images.flatMap((image) => {
    if (!image || typeof image !== "object") return [];
    const record = image as Record<string, unknown>;
    const variants = Array.isArray(record.variants) ? record.variants : [];
    if (variants.length > 0) {
      const normalized: ViatorMediaAsset[] = [];
      for (const variant of variants) {
        if (!variant || typeof variant !== "object") continue;
        const row = variant as Record<string, unknown>;
        const url = firstString(row.url, row.secureUrl);
        if (!url) continue;
        normalized.push({
          url,
          width: typeof row.width === "number" ? row.width : null,
          height: typeof row.height === "number" ? row.height : null,
          source,
          provider: null,
        });
      }
      return normalized;
    }

    const url = firstString(record.url, record.secureUrl);
    return url ? [{ url, source, provider: null }] : [];
  });
}

function normalizeRemoteDestinations(product: Record<string, unknown>): ViatorDestinationCatalogRow[] {
  const rows = Array.isArray(product.destinations) ? product.destinations : [];
  const output: ViatorDestinationCatalogRow[] = [];
  for (const row of rows) {
    const record = asRecord(row);
    const destinationId = record?.destinationId;
    const name = firstString(record?.name);
    if (typeof destinationId !== "number" || !name) continue;
    output.push({
      destinationId,
      parentDestinationId: typeof record?.parentDestinationId === "number" ? record.parentDestinationId : null,
      name,
      type: firstString(record?.type),
      timeZone: firstString(record?.timeZone),
      defaultCurrencyCode: firstString(record?.defaultCurrencyCode),
      countryCode: firstString(record?.countryCode),
    });
  }
  return output;
}

function mergeUnique(primary: string[], secondary: string[]): string[] {
  return Array.from(new Set([...primary, ...secondary].filter(Boolean)));
}

function mergeUniqueMedia(primary: ViatorMediaAsset[], secondary: ViatorMediaAsset[]): ViatorMediaAsset[] {
  const seen = new Set<string>();
  const output: ViatorMediaAsset[] = [];
  for (const item of [...primary, ...secondary]) {
    const key = `${item.source}:${item.url}`;
    if (!item.url || seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}

function mergeReviews(primary: ViatorReview[], secondary: ViatorReview[]): ViatorReview[] {
  const seen = new Set<string>();
  const output: ViatorReview[] = [];
  for (const item of [...primary, ...secondary]) {
    const key = item.reviewId;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}

export function getLocalViatorProductDetail(productCodeOrId: string): ViatorProductDetail | null {
  const catalog = asArray(tours);
  const tour = catalog.find(
    (row) => String(row.product_code || "") === productCodeOrId || String(row.id || "") === productCodeOrId
  );
  if (!tour) return null;

  const title = String(tour.name || tour.title || "Experience");
  return normalizeViatorProductDetail({
    product_code: String(tour.product_code || tour.id || productCodeOrId),
    title,
    short_description: tour.description || null,
    overview: tour.description || null,
    durationText: tour.duration || null,
    rating: typeof tour.rating === "number" ? tour.rating : null,
    review_count: typeof tour.review_count === "number" ? tour.review_count : null,
    price_from: typeof tour.price_from === "number" ? tour.price_from : null,
    currency: normalizeViatorCurrency(tour.currency),
    duration_minutes: toDurationMinutes(tour),
    image_url: tour.image_url || null,
    supplier_name: tour.supplier_name || null,
    itinerary_type: tour.itinerary_type || null,
    booking_confirmation_type: tour.booking_confirmation_type || null,
    confirmationType: tour.booking_confirmation_type || null,
    product_option_titles: tour.product_option_titles || null,
    url: buildViatorSearchUrl([tour.city || "", title].filter(Boolean).join(" ").trim() || title),
    itinerary: tour.description ? [tour.description] : [],
    highlights: [],
    additionalInfo: [],
    importantNotes: [],
    inclusions: tour.inclusions || [],
    exclusions: tour.exclusions || [],
    pickup: tour.pickup || [],
    departure: tour.departure || [],
    returnDetails: tour.returnDetails || [],
    languages: tour.languages || [],
    ticketType: tour.ticket_type || null,
    operatedBy: tour.supplier_name || null,
    redemptionInstructions: [],
    bookingQuestionRefs: [],
    destinations: [],
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

export function normalizeLiveProductDetailResponse(raw: unknown, fallbackKey: string): ViatorProductDetail | null {
  if (!raw || typeof raw !== "object") return null;
  const product = raw as Record<string, unknown>;
  const title = String(product.title || product.name || fallbackKey || "Experience");
  const productCode = String(product.productCode || fallbackKey);
  const url = firstString(product.productUrl, product.webUrl) || buildViatorSearchUrl(title);
  const supplier = asRecord(product.supplier);
  const bookingConfirmationSettings = asRecord(product.bookingConfirmationSettings);
  const duration = asRecord(product.duration);
  const cancellationPolicy = asRecord(product.cancellationPolicy);
  const media = splitSupplierAndTravelerMedia(
    {
      supplierImages: extractVariants(product.images, "supplier"),
      travelerImages: extractVariants(product.travelerImages, "traveler"),
    },
    []
  );

  return normalizeViatorProductDetail({
    product_code: productCode,
    title,
    short_description: firstString(product.shortDescription, product.summary, product.description),
    overview: firstString(product.description, product.shortDescription, product.summary),
    durationText: firstString(product.durationText, duration?.formattedDuration, duration?.text),
    rating: null,
    review_count: null,
    price_from: null,
    currency: "USD",
    duration_minutes:
      typeof duration?.fixedDurationInMinutes === "number"
        ? duration.fixedDurationInMinutes
        : typeof duration?.durationInMinutes === "number"
          ? duration.durationInMinutes
          : null,
    image_url: firstString(product.primaryImageUrl) || null,
    supplier_name: firstString(supplier?.name) || null,
    supplierImages: media.supplierImages,
    travelerImages: media.travelerImages,
    itinerary_type: firstString(asRecord(product.itinerary)?.itineraryType) || null,
    booking_confirmation_type: firstString(bookingConfirmationSettings?.confirmationType) || null,
    confirmationType: firstString(bookingConfirmationSettings?.confirmationType) || null,
    product_option_titles: null,
    url,
    highlights: flattenTextList(product.highlights),
    additionalInfo: flattenTextList(product.additionalInfo),
    importantNotes: flattenTextList(product.importantNotes),
    itinerary: flattenTextList(asRecord(product.itinerary)?.items),
    inclusions: flattenTextList(product.inclusions),
    exclusions: flattenTextList(product.exclusions),
    pickup: flattenTextList(product.pickup),
    departure: flattenTextList(product.departure),
    returnDetails: flattenTextList(product.returnDetails),
    languages: flattenTextList(product.languages),
    ticketType: firstString(product.ticketType),
    operatedBy: firstString(product.operatedBy, supplier?.name),
    redemptionInstructions: flattenTextList(product.redemptionInstructions),
    bookingQuestionRefs: toStringArray(product.bookingQuestions),
    destinations: normalizeRemoteDestinations(product),
    cancellationPolicy: {
      policyType: firstString(cancellationPolicy?.type, cancellationPolicy?.policyType),
      description: firstString(cancellationPolicy?.description),
      freeCancellation: Boolean(cancellationPolicy?.freeCancellation),
    },
    reviews: [],
  });
}

export async function getLiveViatorProductDetail(productCode: string): Promise<ViatorProductDetail | null> {
  const raw = await getViatorClient().getProductDetail(productCode);
  return normalizeLiveProductDetailResponse(raw, productCode);
}

export async function getResolvedViatorProductDetail(
  productCodeOrId: string,
  options: { productCode?: string | null; forceReviewRefresh?: boolean } = {}
): Promise<{ detail: ViatorProductDetail | null; source: "live" | "local" | "missing" }> {
  const local = getLocalViatorProductDetail(options.productCode || productCodeOrId);
  const productCode = options.productCode || local?.product_code || productCodeOrId;

  if (options.productCode) {
    try {
      const live = await getLiveViatorProductDetail(options.productCode);
      if (live) {
        const reviews = options.forceReviewRefresh
          ? await getCachedOrFetchViatorReviews(options.productCode, { forceRefresh: true })
          : readViatorReviewCache(options.productCode);
        const mergedReviews = mergeReviews(reviews, local?.reviews || []);
        const media = splitSupplierAndTravelerMedia(live, mergedReviews);
        return {
          source: "live",
          detail: normalizeViatorProductDetail({
            ...local,
            ...live,
            rating: live.rating ?? local?.rating ?? null,
            review_count: mergedReviews.length || live.review_count || local?.review_count || null,
            price_from: live.price_from ?? local?.price_from ?? null,
            currency: live.currency || local?.currency || "USD",
            overview: live.overview || local?.overview || null,
            durationText: live.durationText || local?.durationText || null,
            highlights: mergeUnique(live.highlights, local?.highlights || []),
            additionalInfo: mergeUnique(live.additionalInfo, local?.additionalInfo || []),
            importantNotes: mergeUnique(live.importantNotes, local?.importantNotes || []),
            itinerary: mergeUnique(live.itinerary, local?.itinerary || []),
            inclusions: mergeUnique(live.inclusions, local?.inclusions || []),
            exclusions: mergeUnique(live.exclusions, local?.exclusions || []),
            pickup: mergeUnique(live.pickup, local?.pickup || []),
            departure: mergeUnique(live.departure, local?.departure || []),
            returnDetails: mergeUnique(live.returnDetails, local?.returnDetails || []),
            languages: mergeUnique(live.languages, local?.languages || []),
            bookingQuestionRefs: mergeUnique(live.bookingQuestionRefs, local?.bookingQuestionRefs || []),
            redemptionInstructions: mergeUnique(
              live.redemptionInstructions,
              local?.redemptionInstructions || []
            ),
            supplierImages: mergeUniqueMedia(live.supplierImages, local?.supplierImages || []),
            travelerImages: media.travelerImages,
            reviews: mergedReviews,
          }),
        };
      }
    } catch {}
  }

  if (local) {
    const reviews = options.productCode ? readViatorReviewCache(options.productCode) : [];
    const media = splitSupplierAndTravelerMedia(local, reviews);
    return {
      source: "local",
      detail: normalizeViatorProductDetail({
        ...local,
        reviews,
        travelerImages: media.travelerImages,
      }),
    };
  }

  return { detail: null, source: "missing" };
}
