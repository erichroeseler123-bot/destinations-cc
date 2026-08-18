export const WNO_PRODUCT_IMAGE_WIDTH = 828;
export const WNO_PRODUCT_IMAGE_QUALITY = 45;

export function optimizedProductImageUrl(src: string) {
  if (!src) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${WNO_PRODUCT_IMAGE_WIDTH}&q=${WNO_PRODUCT_IMAGE_QUALITY}`;
}
