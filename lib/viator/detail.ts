import { getViatorClient } from "@/lib/viator/client";
import { readViatorReviewCache } from "@/lib/viator/cache";
import { buildViatorSearchUrl } from "@/lib/viator/links";
import { getLocalViatorProductDetail } from "@/lib/viator/product";
import { withViatorReviewPayload } from "@/lib/viator/reviews";
import { normalizeViatorProductDetail, type ViatorProductDetail } from "@/lib/viator/schema";

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

function extractVariants(images: unknown, source: "supplier" | "traveler") {
  if (!Array.isArray(images)) return [];
  return images.flatMap((image) => {
    if (!image || typeof image !== "object") return [];
    const record = image as Record<string, unknown>;
    const variants = Array.isArray(record.variants) ? record.variants : [];
    if (variants.length > 0) {
      return variants
        .map((variant) => {
          if (!variant || typeof variant !== "object") return null;
          const row = variant as Record<string, unknown>;
          const url = firstString(row.url, row.secureUrl);
          if (!url) return null;
          return {
            url,
            width: typeof row.width === "number" ? row.width : null,
            height: typeof row.height === "number" ? row.height : null,
            source,
            provider: null,
          };
        })
        .filter(
          (
            item
          ): item is {
            url: string;
            width: number | null;
            height: number | null;
            source: "supplier" | "traveler";
            provider: null;
          } => Boolean(item)
        );
    }

    const url = firstString(record.url, record.secureUrl);
    return url ? [{ url, source, provider: null }] : [];
  });
}

function normalizeRemoteProductDetail(raw: unknown, fallbackKey: string): ViatorProductDetail | null {
  if (!raw || typeof raw !== "object") return null;
  const product = raw as Record<string, unknown>;
  const title = String(product.title || product.name || fallbackKey || "Experience");
  const productCode = String(product.productCode || fallbackKey);
  const url =
    firstString(product.productUrl, product.webUrl) ||
    buildViatorSearchUrl(title);

  return normalizeViatorProductDetail({
    product_code: productCode,
    title,
    short_description: firstString(product.shortDescription, product.summary, product.description),
    overview: firstString(product.description, product.shortDescription, product.summary),
    rating: null,
    review_count: null,
    price_from: null,
    currency: "USD",
    duration_minutes: null,
    image_url: firstString(product.primaryImageUrl) || null,
    supplier_name: firstString((product.supplier as Record<string, unknown> | undefined)?.name) || null,
    itinerary_type: firstString((product.itinerary as Record<string, unknown> | undefined)?.itineraryType) || null,
    booking_confirmation_type: firstString(
      (product.bookingConfirmationSettings as Record<string, unknown> | undefined)?.confirmationType
    ) || null,
    product_option_titles: null,
    url,
    itinerary: toStringArray((product.itinerary as Record<string, unknown> | undefined)?.items),
    inclusions: toStringArray(product.inclusions),
    exclusions: toStringArray(product.exclusions),
    pickup: toStringArray(product.pickup),
    departure: toStringArray(product.departure),
    returnDetails: toStringArray(product.returnDetails),
    languages: toStringArray(product.languages),
    ticketType: firstString(product.ticketType),
    bookingQuestionRefs: toStringArray(product.bookingQuestions),
    cancellationPolicy: {
      policyType: firstString((product.cancellationPolicy as Record<string, unknown> | undefined)?.type),
      description: firstString((product.cancellationPolicy as Record<string, unknown> | undefined)?.description),
      freeCancellation: Boolean((product.cancellationPolicy as Record<string, unknown> | undefined)?.freeCancellation),
    },
    supplierImages: extractVariants(product.images, "supplier"),
    travelerImages: [],
    reviews: [],
  });
}

export async function getViatorProductDetailForTour(input: {
  id: string;
  productCode?: string | null;
}): Promise<{ detail: ViatorProductDetail | null; source: "live" | "local" | "missing" }> {
  if (input.productCode) {
    try {
      const raw = await getViatorClient().getProductDetail(input.productCode);
      const detail = normalizeRemoteProductDetail(raw, input.productCode);
      if (detail) {
        return {
          detail: withViatorReviewPayload({
            ...detail,
            reviews: readViatorReviewCache(input.productCode),
          }),
          source: "live",
        };
      }
    } catch {}
  }

  const local = getLocalViatorProductDetail(input.productCode || input.id);
  if (local) {
    return {
      detail: withViatorReviewPayload({
        ...local,
        reviews: input.productCode ? readViatorReviewCache(input.productCode) : [],
      }),
      source: "local",
    };
  }

  return { detail: null, source: "missing" };
}
