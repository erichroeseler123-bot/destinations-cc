export const WNO_PRODUCT_IMAGE_WIDTH = 828;
export const WNO_PRODUCT_IMAGE_QUALITY = 45;
export const WNO_SWAMP_IMAGE_QUALITY = 30;

export function optimizedProductImageUrl(src: string) {
  if (!src || src.startsWith("/_next/image?url=")) return src;
  const quality = src.includes("covered-boat-swamp.png") || src.includes("airboat-swamp.png")
    ? WNO_SWAMP_IMAGE_QUALITY
    : WNO_PRODUCT_IMAGE_QUALITY;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${WNO_PRODUCT_IMAGE_WIDTH}&q=${quality}`;
}
