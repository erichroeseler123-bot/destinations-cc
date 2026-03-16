import type { Metadata } from "next";
import type { ViatorMediaAsset, ViatorReview } from "@/lib/viator/schema";

export const VIATOR_REVIEW_CACHE_TTL_HOURS = 24 * 7;
export const VIATOR_TAG_CACHE_TTL_HOURS = 24 * 7;
export const VIATOR_DESTINATION_CACHE_TTL_HOURS = 24;
export const VIATOR_RECOMMENDATION_CACHE_TTL_HOURS = 1;

export const VIATOR_REVIEW_INDEXING = {
  index: false,
  follow: true,
} as const;

export function getViatorReviewContentNotice(): string {
  return "Traveler reviews and traveler photos are proprietary Viator content and must remain non-indexed.";
}

export function getViatorTravelerPhotoNotice(): string {
  return "Traveler photos should be cached with reviews and rendered separately from supplier media.";
}

export function getViatorNonIndexedMetadata(): Pick<Metadata, "robots"> {
  return {
    robots: {
      index: false,
      follow: true,
    },
  };
}

export function extractTravelerPhotosFromReviews(reviews: ViatorReview[]): ViatorMediaAsset[] {
  return reviews.flatMap((review) => review.travelerPhotos || []);
}

export function withViatorReviewPayload<T extends { reviews?: ViatorReview[]; travelerImages?: ViatorMediaAsset[] }>(
  product: T
): T {
  const reviews = product.reviews || [];
  return {
    ...product,
    reviews,
    travelerImages: product.travelerImages?.length ? product.travelerImages : extractTravelerPhotosFromReviews(reviews),
  };
}
