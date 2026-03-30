import type { TicketmasterEvent } from "@/lib/dcc/providers/adapters/ticketmaster";
import type { NodeImageAsset, NodeImageSet } from "@/src/lib/media/types";
import { buildProviderImageAsset } from "@/src/lib/media/resolver";

export type TicketmasterImageCandidate = {
  url?: string;
  ratio?: string;
  width?: number;
  height?: number;
};

export type TicketmasterAttractionRecord = {
  id?: string;
  name?: string;
  images?: TicketmasterImageCandidate[];
};

function sortTicketmasterCandidates(images: TicketmasterImageCandidate[]) {
  return [...images].sort((left, right) => (right.width || 0) - (left.width || 0));
}

function pickImageByRatio(
  images: TicketmasterImageCandidate[],
  preferredRatios: string[],
  minWidth = 0,
) {
  const sorted = sortTicketmasterCandidates(images);
  for (const ratio of preferredRatios) {
    const match = sorted.find((image) => image.ratio === ratio && (image.width || 0) >= minWidth && image.url);
    if (match?.url) return match.url;
  }

  return sorted.find((image) => (image.width || 0) >= minWidth && image.url)?.url
    || sorted.find((image) => image.url)?.url
    || null;
}

export function ticketmasterImagesToMedia(
  images: TicketmasterImageCandidate[] | undefined,
  alt: string,
): NodeImageSet {
  const candidates = images || [];
  const hero = buildProviderImageAsset(
    "ticketmaster",
    pickImageByRatio(candidates, ["16_9"], 1000),
    alt,
  );
  const card = buildProviderImageAsset(
    "ticketmaster",
    pickImageByRatio(candidates, ["4_3", "3_2", "16_9"], 600),
    alt,
  );
  const gallery = sortTicketmasterCandidates(candidates)
    .filter((image) => Boolean(image.url))
    .slice(0, 5)
    .map((image) => buildProviderImageAsset("ticketmaster", image.url, alt))
    .filter((image): image is NodeImageAsset => Boolean(image));

  return {
    hero,
    card: card || hero,
    gallery,
  };
}

export function ticketmasterEventToMedia(event: TicketmasterEvent): NodeImageSet {
  const alt = event.name || event.venue_name || "Ticketmaster event";
  const image = buildProviderImageAsset("ticketmaster", event.image_url, alt);
  return {
    hero: image,
    card: image,
    gallery: image ? [image] : [],
  };
}

export function selectTicketmasterImage(events: TicketmasterEvent[]): NodeImageAsset | null {
  for (const event of events) {
    const image = buildProviderImageAsset("ticketmaster", event.image_url, event.name || "Ticketmaster event");
    if (image) return image;
  }
  return null;
}

export function ticketmasterAttractionToMedia(attraction: TicketmasterAttractionRecord): NodeImageSet {
  const alt = attraction.name || "Ticketmaster attraction";
  return ticketmasterImagesToMedia(attraction.images, alt);
}
