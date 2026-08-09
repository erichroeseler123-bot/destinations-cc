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

// These products currently have registry/fallback images that are legally usable
// but semantically misleading for a shopping card. A text-only card is safer than
// implying the wrong property, vessel, tour or modern experience while exact
// commerce photography is still being cleared.
const COMMERCE_IMAGE_BLOCKLIST = new Set([
  "cocktail-walking-tour",
  "craft-cocktail-walking-tour",
  "whitney-plantation-tour",
  "city-of-new-orleans-riverboat-cruise",
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

  // 3. Approved intentional local fallback
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
