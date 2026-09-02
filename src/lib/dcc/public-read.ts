import { getDestinationConfig } from "@/src/data/destination-configs";
import { getLiveSources } from "@/src/data/live-registry";

export type EventCategory = "music" | "comedy" | "theater" | "nightclub" | "live-music" | "community";

export type LiveEvent = {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  venueId?: string;
  venueName?: string;
  lat?: number;
  lng?: number;
  distanceKm?: number;
  category?: EventCategory;
  source: "ticketmaster" | "eventbrite" | "city-calendar";
  sourceUrl?: string;
  ticketUrl?: string;
  schemaType: "Event";
};

export function buildDestinationReadModel(slug: string) {
  const config = getDestinationConfig(slug);
  if (!config) return null;
  return {
    id: config.id,
    slug: config.slug,
    name: config.name,
    type: config.type,
    timezone: config.timezone,
    lat: config.lat,
    lng: config.lng,
    capabilities: config.capabilities,
  };
}

export function buildPlacesReadModel(slug: string) {
  const config = getDestinationConfig(slug);
  if (!config) return null;
  return {
    destinationId: config.id,
    places: config.places,
  };
}

export function buildLiveReadModel(slug: string) {
  const config = getDestinationConfig(slug);
  if (!config) return null;
  return {
    destinationId: config.id,
    asOf: new Date().toISOString(),
    capabilities: config.capabilities,
    sources: getLiveSources(config).map((source) => ({
      id: source.id,
      type: source.type,
      provider: source.provider,
      cacheMinutes: source.cacheMinutes ?? null,
      status: "configured" as const,
    })),
  };
}
