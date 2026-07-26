import { PRODUCT_IMAGES } from '../data/imageRegistry';
import { WIKIMEDIA_IMAGES, WikimediaImage } from '../data/wikimedia';
import type { LiveProductAdapter } from '../data/types';
import type { NolaFareHarborProduct } from '../tours/pageConfig';

export type ResolvedProductImage = {
  src: string;
  alt: string;
  source: "operator" | "wikimedia" | "local";
  attribution?: {
    creator: string;
    license: string;
    sourceUrl: string;
    originalTitle?: string;
  };
};

export function resolveProductImage(product: LiveProductAdapter | NolaFareHarborProduct | undefined | null): ResolvedProductImage | null {
  if (!product) return null;

  const slug = product.slug;
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
  // Handle both LiveProductAdapter and NolaFareHarborProduct properly
  const wikimediaId = (product as any).wikimediaId;
  if (wikimediaId) {
    const wikiRecord = WIKIMEDIA_IMAGES[wikimediaId];
    if (wikiRecord) {
      return {
        src: wikiRecord.url,
        alt: wikiRecord.alt,
        source: "wikimedia",
        attribution: {
          creator: wikiRecord.author || wikiRecord.attributionText,
          license: wikiRecord.license,
          sourceUrl: wikiRecord.sourceUrl,
          originalTitle: wikiRecord.originalTitle
        }
      };
    }
  }

  // 3. Approved intentional local fallback (for example, non-operator verified images in registry like city-tour)
  if (imgRecord && imgRecord.verifiedRights && imgRecord.source !== "Operator") {
    return {
      src: imgRecord.url,
      alt: imgRecord.alt,
      source: imgRecord.source === "Wikimedia Commons" ? "wikimedia" : "local",
      attribution: imgRecord.source === "Wikimedia Commons" ? {
        creator: imgRecord.author || "",
        license: imgRecord.license || "",
        sourceUrl: imgRecord.sourceUrl || ""
      } : undefined
    };
  }

  // 4. Null / Text-only
  return null;
}
