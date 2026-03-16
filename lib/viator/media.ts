import type { ViatorMediaAsset, ViatorProductDetail, ViatorReview } from "@/lib/viator/schema";

function dedupeMediaAssets(items: ViatorMediaAsset[]): ViatorMediaAsset[] {
  const seen = new Set<string>();
  const output: ViatorMediaAsset[] = [];
  for (const item of items) {
    const key = `${item.source}:${item.url}`;
    if (!item.url || seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}

export function extractTravelerPhotosFromReviews(reviews: ViatorReview[]): ViatorMediaAsset[] {
  return dedupeMediaAssets(reviews.flatMap((review) => review.travelerPhotos || []));
}

export function splitSupplierAndTravelerMedia(
  detail: Pick<ViatorProductDetail, "supplierImages" | "travelerImages"> | null | undefined,
  reviews: ViatorReview[] = []
): {
  supplierImages: ViatorMediaAsset[];
  travelerImages: ViatorMediaAsset[];
} {
  return {
    supplierImages: dedupeMediaAssets(detail?.supplierImages || []),
    travelerImages: dedupeMediaAssets([
      ...(detail?.travelerImages || []),
      ...extractTravelerPhotosFromReviews(reviews),
    ]),
  };
}

export { dedupeMediaAssets };
