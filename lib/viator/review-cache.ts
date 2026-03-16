import fs from "fs";
import { getViatorClient } from "@/lib/viator/client";
import { getViatorReviewCachePath, readViatorReviewCache, writeViatorReviewCache } from "@/lib/viator/cache";
import { type ViatorReview } from "@/lib/viator/schema";

export { getViatorReviewCachePath, readViatorReviewCache, writeViatorReviewCache };

export async function getCachedOrFetchViatorReviews(
  productCode: string,
  options: { forceRefresh?: boolean } = {}
): Promise<ViatorReview[]> {
  if (!options.forceRefresh) {
    const cached = readViatorReviewCache(productCode);
    if (cached.length > 0) return cached;
  }

  const reviews = await getViatorClient().getProductReviews(productCode);
  writeViatorReviewCache(productCode, reviews);
  return reviews;
}

export function hasViatorReviewCache(productCode: string): boolean {
  try {
    return fs.existsSync(getViatorReviewCachePath(productCode));
  } catch {
    return false;
  }
}
