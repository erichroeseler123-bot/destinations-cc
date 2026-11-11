export const WNO_PRODUCT_IMAGE_WIDTH = 1200;
export const WNO_HERO_IMAGE_WIDTH = 1600;
export const WNO_PRODUCT_IMAGE_QUALITY = 75;
export const WNO_SWAMP_IMAGE_QUALITY = 75;

function unwrapRawImageSrc(src: string): string {
  if (!src) return src;
  if (src.startsWith("/_next/image?")) {
    try {
      const parsed = new URL(src, "https://www.welcometoneworleanstours.com");
      const inner = parsed.searchParams.get("url");
      if (inner) return inner;
    } catch {
      return src;
    }
  }
  return src;
}

export function optimizedProductImageUrl(src: string) {
  if (!src || src.startsWith("/_next/image?url=")) return src;
  const quality = src.includes("swamp") || src.includes("airboat") || src.includes("bayou")
    ? WNO_SWAMP_IMAGE_QUALITY
    : WNO_PRODUCT_IMAGE_QUALITY;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${WNO_PRODUCT_IMAGE_WIDTH}&q=${quality}`;
}

export function optimizedHeroImageUrl(src: string) {
  if (!src) return src;
  const raw = unwrapRawImageSrc(src);
  if (!raw || raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `/_next/image?url=${encodeURIComponent(raw)}&w=${WNO_HERO_IMAGE_WIDTH}&q=${WNO_PRODUCT_IMAGE_QUALITY}`;
}
