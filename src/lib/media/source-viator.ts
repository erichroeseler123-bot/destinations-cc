import type { ViatorActionProduct } from "@/lib/dcc/action/viator";
import type { NodeImageAsset, NodeImageSet } from "@/src/lib/media/types";
import { buildProviderImageAsset } from "@/src/lib/media/resolver";

export function viatorProductToMedia(product: ViatorActionProduct): NodeImageSet {
  const image = buildProviderImageAsset("viator", product.image_url, product.title);
  return {
    hero: image,
    card: image,
    gallery: image ? [image] : [],
  };
}

export function selectViatorProductImage(products: ViatorActionProduct[]): NodeImageAsset | null {
  for (const product of products) {
    const image = buildProviderImageAsset("viator", product.image_url, product.title);
    if (image) return image;
  }
  return null;
}
