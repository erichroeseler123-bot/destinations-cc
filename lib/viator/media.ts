import type { ViatorMediaAsset, ViatorProductDetail, ViatorReview } from "@/lib/viator/schema";

const VIATOR_SPLICE_DIMENSION_RE =
  /(media(?:-cdn)?\.(?:tacdn|tripadvisor)\.com\/media\/attractions-splice-spp-)(\d+)x(\d+)(\/)/i;

export function upgradeViatorImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const match = trimmed.match(VIATOR_SPLICE_DIMENSION_RE);
  if (!match) return trimmed;

  const width = Number(match[2]);
  if (Number.isFinite(width) && width > 0 && width < 674) {
    return trimmed.replace(VIATOR_SPLICE_DIMENSION_RE, "$1720x480$4");
  }

  return trimmed;
}

export function selectBestViatorVariant(
  variants: unknown[]
): { url: string; width: number | null; height: number | null } | null {
  if (!Array.isArray(variants) || variants.length === 0) return null;

  const parsed: Array<{ url: string; width: number | null; height: number | null }> = [];
  for (const variant of variants) {
    if (!variant || typeof variant !== "object") continue;
    const row = variant as Record<string, unknown>;
    const rawUrl =
      typeof row.url === "string" && row.url.trim()
        ? row.url.trim()
        : typeof row.secureUrl === "string" && row.secureUrl.trim()
          ? row.secureUrl.trim()
          : null;
    if (!rawUrl) continue;
    parsed.push({
      url: rawUrl,
      width: typeof row.width === "number" && Number.isFinite(row.width) ? row.width : null,
      height: typeof row.height === "number" && Number.isFinite(row.height) ? row.height : null,
    });
  }

  if (parsed.length === 0) return null;

  // Prefer crisp card/hero variants between 674px and 1600px (e.g. 720x480 or 674x446),
  // picking the largest within that sweet spot so cards never fall back to 100x100.
  const sweetSpot = parsed
    .filter((v) => v.width !== null && v.width >= 674 && v.width <= 1600)
    .sort((a, b) => (b.width || 0) - (a.width || 0));

  const chosen =
    sweetSpot[0] ||
    [...parsed].sort((a, b) => {
      const areaA = (a.width || 0) * (a.height || 1);
      const areaB = (b.width || 0) * (b.height || 1);
      return areaB - areaA;
    })[0];

  const upgradedUrl = upgradeViatorImageUrl(chosen.url) || chosen.url;
  return {
    url: upgradedUrl,
    width: chosen.width && chosen.width < 674 && upgradedUrl !== chosen.url ? 720 : chosen.width,
    height: chosen.height && (chosen.width || 0) < 674 && upgradedUrl !== chosen.url ? 480 : chosen.height,
  };
}

function dedupeMediaAssets(items: ViatorMediaAsset[]): ViatorMediaAsset[] {
  const seen = new Set<string>();
  const output: ViatorMediaAsset[] = [];
  for (const item of items) {
    const upgradedUrl = upgradeViatorImageUrl(item.url) || item.url;
    const key = `${item.source}:${upgradedUrl}`;
    if (!upgradedUrl || seen.has(key)) continue;
    seen.add(key);
    output.push({ ...item, url: upgradedUrl });
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
