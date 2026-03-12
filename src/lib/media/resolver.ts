import type { MediaSource, NodeImageAsset, NodeImageSet } from "@/src/lib/media/types";

export const DEFAULT_SOURCE_PRIORITY: MediaSource[] = [
  "local",
  "ticketmaster",
  "bandsintown",
  "viator",
  "seatgeek",
  "unsplash",
];

export function buildProviderImageAsset(
  source: MediaSource,
  src: string | null | undefined,
  alt: string,
  attribution?: NodeImageAsset["attribution"],
): NodeImageAsset | null {
  if (!src) return null;
  return {
    src,
    alt,
    source,
    attribution,
  };
}

export function resolvePreferredImage(
  assets: Array<NodeImageAsset | null | undefined>,
  priority: MediaSource[] = DEFAULT_SOURCE_PRIORITY,
): NodeImageAsset | null {
  const candidates = assets.filter(Boolean) as NodeImageAsset[];
  if (!candidates.length) return null;

  for (const source of priority) {
    const match = candidates.find((asset) => asset.source === source);
    if (match) return match;
  }

  return candidates[0] || null;
}

export function resolveNodeImageSet(
  sets: Array<NodeImageSet | null | undefined>,
  priority: MediaSource[] = DEFAULT_SOURCE_PRIORITY,
): NodeImageSet {
  const validSets = sets.filter(Boolean) as NodeImageSet[];

  return {
    hero: resolvePreferredImage(validSets.map((set) => set.hero), priority),
    card: resolvePreferredImage(validSets.map((set) => set.card), priority),
    gallery: validSets.flatMap((set) => set.gallery || []),
  };
}
