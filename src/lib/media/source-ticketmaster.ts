import type { TicketmasterEvent } from "@/lib/dcc/providers/adapters/ticketmaster";
import type { NodeImageAsset, NodeImageSet } from "@/src/lib/media/types";
import { buildProviderImageAsset } from "@/src/lib/media/resolver";

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
