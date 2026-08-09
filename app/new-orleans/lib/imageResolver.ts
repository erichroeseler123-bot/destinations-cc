import { PRODUCT_IMAGES } from '../data/imageRegistry';
import { WIKIMEDIA_IMAGES } from '../data/wikimedia';
import type { LiveProductAdapter } from '../data/types';
import type { NolaFareHarborProduct } from '../tours/pageConfig';

export type ResolvedAttribution = {
  creator: string;
  license: string;
  licenseUrl?: string;
  sourceUrl?: string;
};

export type ResolvedProductImage = {
  src: string;
  alt: string;
  source: "operator" | "wikimedia" | "local";
  attribution?: ResolvedAttribution;
};

// Combined products stay text-only until we have an image that accurately
// represents the combined experience rather than just one unrelated segment.
const COMMERCE_IMAGE_BLOCKLIST = new Set([
  "all-day-city-plantation-combo",
  "covered-boat-plantation-combo",
  "swamp-boat-oak-alley-combo",
  "swamp-boat-whitney-combo",
]);

export function resolveProductImage(product: LiveProductAdapter | NolaFareHarborProduct | undefined | null): ResolvedProductImage | null {
  if (!product) return null;

  const slug = product.slug;
  if (COMMERCE_IMAGE_BLOCKLIST.has(slug)) return null;

  const imgRecord = PRODUCT_IMAGES[slug];

  // 1. Verified operator/FareHarbor product image
  if (imgRecord && imgRecord.verifiedRights && imgRecord.source === "Operator") {
    return {
      src: imgRecord.url,
      alt: imgRecord.alt,
      source: "operator",
    };
  }

  // 2. Verified product-specific Wikimedia image
  const wikimediaId = (product as any).wikimediaId;
  if (wikimediaId) {
    const wikiRecord = WIKIMEDIA_IMAGES[wikimediaId];
    if (wikiRecord) {
      return {
        src: wikiRecord.url,
        alt: wikiRecord.alt,
        source: "wikimedia",
        attribution: {
          creator: wikiRecord.author || (wikiRecord as any).attributionText || "Unknown",
          license: wikiRecord.license || "",
          licenseUrl: wikiRecord.licenseUrl || "",
          sourceUrl: wikiRecord.sourceUrl || ""
        }
      };
    }
  }

  // 3. Approved rights-cleared registry image. Most are local assets; a small
  // number of Wikimedia originals are intentionally referenced directly when
  // an exact, licensed subject image is available and a local binary copy has
  // not yet been added to the repository.
  if (imgRecord && imgRecord.verifiedRights && imgRecord.source !== "Operator") {
    return {
      src: imgRecord.url,
      alt: imgRecord.alt,
      source: imgRecord.source === "Wikimedia Commons" ? "wikimedia" : "local",
      attribution: imgRecord.source === "Wikimedia Commons" ? {
        creator: imgRecord.author || "",
        license: imgRecord.license || "",
        licenseUrl: imgRecord.licenseUrl || "",
        sourceUrl: imgRecord.sourceUrl || ""
      } : undefined
    };
  }

  // 4. Null / text-only fallback
  return null;
}
