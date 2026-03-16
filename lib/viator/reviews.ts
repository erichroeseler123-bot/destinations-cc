import type { Metadata } from "next";
import { extractTravelerPhotosFromReviews as extractPhotos } from "@/lib/viator/media";
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
  return extractPhotos(reviews);
}

export function shouldNoIndexViatorReviewSurface(): boolean {
  return VIATOR_REVIEW_INDEXING.index === false;
}

export function getViatorReviewPageMetadata(): Pick<Metadata, "robots"> {
  return getViatorNonIndexedMetadata();
}

export function getViatorIndexablePdpMetadata(): Pick<Metadata, "robots"> {
  return {
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function getReviewFreshnessLabel(updatedAt: string | null | undefined): string {
  if (!updatedAt) return "Review cache not synced yet";
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return "Review cache timestamp unavailable";
  const ageHours = Math.max(0, Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60)));
  if (ageHours < 1) return "Refreshed within the last hour";
  if (ageHours < 24) return `Refreshed ${ageHours}h ago`;
  const ageDays = Math.round(ageHours / 24);
  return `Refreshed ${ageDays}d ago`;
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
