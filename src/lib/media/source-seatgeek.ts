import type { SeatGeekEvent } from "@/lib/dcc/providers/adapters/seatgeek";
import type { NodeImageAsset, NodeImageSet } from "@/src/lib/media/types";
import { buildProviderImageAsset } from "@/src/lib/media/resolver";

export function seatGeekEventToMedia(event: SeatGeekEvent): NodeImageSet {
  const image = buildProviderImageAsset("seatgeek", event.imageUrl, event.title);
  return {
    hero: image,
    card: image,
    gallery: image ? [image] : [],
  };
}

export function selectSeatGeekImage(events: SeatGeekEvent[]): NodeImageAsset | null {
  for (const event of events) {
    const image = buildProviderImageAsset("seatgeek", event.imageUrl, event.title);
    if (image) return image;
  }
  return null;
}
