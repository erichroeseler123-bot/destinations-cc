export const WNO_PRODUCT_IMAGE_WIDTH = 828;
export const WNO_PRODUCT_IMAGE_QUALITY = 45;

export function optimizedProductImageUrl(src: string) {
  if (!src || src.startsWith("/_next/image?url=")) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${WNO_PRODUCT_IMAGE_WIDTH}&q=${WNO_PRODUCT_IMAGE_QUALITY}`;
}
