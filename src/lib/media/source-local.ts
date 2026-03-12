import type { NodeImageAsset, NodeImageSet } from "@/src/lib/media/types";

export function buildLocalImageAsset(src: string, alt: string): NodeImageAsset {
  return {
    src,
    alt,
    source: "local",
  };
}

export function buildLocalImageSet(input: {
  hero?: { src: string; alt: string };
  card?: { src: string; alt: string };
  gallery?: Array<{ src: string; alt: string }>;
}): NodeImageSet {
  return {
    hero: input.hero ? buildLocalImageAsset(input.hero.src, input.hero.alt) : null,
    card: input.card ? buildLocalImageAsset(input.card.src, input.card.alt) : null,
    gallery: (input.gallery || []).map((item) => buildLocalImageAsset(item.src, item.alt)),
  };
}
