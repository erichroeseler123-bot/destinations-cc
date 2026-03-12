import { getCachedMediaRecord, setCachedMediaRecord } from "@/src/lib/media/cache";
import { buildLocalImageAsset } from "@/src/lib/media/source-local";
import type { MediaRequest, MediaSource, NodeImageAsset, NodeImageSet } from "@/src/lib/media/types";

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

function stringHint(
  sourceHints: MediaRequest["sourceHints"],
  key: string,
): string | null {
  const value = sourceHints?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function priorityForEntity(entityType: MediaRequest["entityType"]): MediaSource[] {
  if (entityType === "show" || entityType === "artist" || entityType === "venue") {
    return ["ticketmaster", "bandsintown", "local", "unsplash", "viator", "seatgeek"];
  }

  if (entityType === "tour") {
    return ["viator", "local", "unsplash", "ticketmaster", "bandsintown", "seatgeek"];
  }

  if (entityType === "sports-event" || entityType === "sports-team") {
    return ["seatgeek", "local", "unsplash", "ticketmaster", "bandsintown", "viator"];
  }

  return DEFAULT_SOURCE_PRIORITY;
}

export async function getMediaForEntity(request: MediaRequest): Promise<NodeImageSet> {
  const cached = getCachedMediaRecord(request.entityType, request.slug);
  if (cached) return cached.imageSet;

  const alt =
    stringHint(request.sourceHints, "alt") ||
    stringHint(request.sourceHints, "artistName") ||
    stringHint(request.sourceHints, "venueName") ||
    stringHint(request.sourceHints, "name") ||
    request.slug;

  const localImage = (() => {
    const src = stringHint(request.sourceHints, "localImageUrl");
    const localAlt = stringHint(request.sourceHints, "localImageAlt") || alt;
    return src ? buildLocalImageAsset(src, localAlt) : null;
  })();

  const ticketmasterImage = buildProviderImageAsset(
    "ticketmaster",
    stringHint(request.sourceHints, "ticketmasterImageUrl"),
    alt,
  );
  const bandsintownImage = buildProviderImageAsset(
    "bandsintown",
    stringHint(request.sourceHints, "bandsintownArtistImageUrl"),
    stringHint(request.sourceHints, "artistName") || alt,
    { label: "Bandsintown" },
  );
  const viatorImage = buildProviderImageAsset(
    "viator",
    stringHint(request.sourceHints, "viatorImageUrl"),
    alt,
  );
  const seatGeekImage = buildProviderImageAsset(
    "seatgeek",
    stringHint(request.sourceHints, "seatGeekImageUrl"),
    alt,
  );
  const unsplashImage = buildProviderImageAsset(
    "unsplash",
    stringHint(request.sourceHints, "unsplashImageUrl"),
    alt,
    stringHint(request.sourceHints, "unsplashAttributionLabel")
      ? {
          label: stringHint(request.sourceHints, "unsplashAttributionLabel") || "Unsplash",
          href: stringHint(request.sourceHints, "unsplashAttributionUrl") || undefined,
        }
      : undefined,
  );

  const imageSet = resolveNodeImageSet(
    [
      {
        hero: ticketmasterImage || bandsintownImage || localImage || viatorImage || seatGeekImage || unsplashImage,
        card: ticketmasterImage || bandsintownImage || localImage || viatorImage || seatGeekImage || unsplashImage,
        gallery: [ticketmasterImage, bandsintownImage, localImage, viatorImage, seatGeekImage, unsplashImage].filter(
          Boolean,
        ) as NodeImageAsset[],
      },
    ],
    priorityForEntity(request.entityType),
  );

  setCachedMediaRecord({
    entityType: request.entityType,
    slug: request.slug,
    imageSet,
    source: imageSet.card?.source || "local",
    updatedAt: new Date().toISOString(),
  });

  return imageSet;
}
