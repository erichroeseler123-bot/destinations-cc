import type { NetworkNodeId } from "@/lib/network/nodes";

export const EVENT_SOURCE_PROVIDERS = [
  "ticketmaster",
  "axs",
  "seatgeek",
  "eventbrite",
  "artist_feed",
  "venue_api",
  "manual_import",
] as const;

export type EventSourceProvider = (typeof EVENT_SOURCE_PROVIDERS)[number];

export const EVENT_CATEGORIES = [
  "concert",
  "sports",
  "comedy",
  "theater",
  "festival",
  "family",
  "nightlife",
  "conference",
  "local_event",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const EVENT_STATUSES = [
  "scheduled",
  "cancelled",
  "postponed",
  "rescheduled",
  "sold_out",
  "stale",
  "unknown",
] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_TICKET_STATUSES = [
  "available",
  "limited",
  "sold_out",
  "not_available",
  "unknown",
] as const;

export type EventTicketStatus = (typeof EVENT_TICKET_STATUSES)[number];

export const EVENT_GEOCODE_SOURCES = [
  "ticket_api",
  "venue_api",
  "google_places",
  "mapbox",
  "manual_verified",
] as const;

export type EventGeocodeSource = (typeof EVENT_GEOCODE_SOURCES)[number];

export const EVENT_GEOCODE_CONFIDENCE = ["high", "medium", "low"] as const;

export type EventGeocodeConfidence = (typeof EVENT_GEOCODE_CONFIDENCE)[number];

export const EVENT_COMMERCIAL_PATH_TYPES = [
  "shuttle",
  "tour",
  "guide",
  "deal",
  "parking",
  "hotel",
  "food",
  "fallback",
] as const;

export type EventCommercialPathType = (typeof EVENT_COMMERCIAL_PATH_TYPES)[number];

export type EventSourceConfig = {
  id: string;
  provider: EventSourceProvider;
  displayName: string;
  enabled: boolean;
  ingestionMode: "disabled" | "manual" | "api";
  baseUrl?: string;
  docsUrl?: string;
  notes?: string;
};

export type EventVenue = {
  venueId: string;
  venueName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode?: string;
  country: string;
  latitude: number;
  longitude: number;
  neighborhood?: string;
  market: string;
  region: string;
  geocodeSource: EventGeocodeSource;
  geocodeConfidence: EventGeocodeConfidence;
};

export type EventCommercialPath = {
  type: EventCommercialPathType;
  href: string;
  cta: string;
};

export type EventDisplayModel = {
  cardTitle: string;
  cardSubtitle?: string;
  shortSummary: string;
  badge?: string;
  imageUrl?: string;
  altText?: string;
  primaryCta: string;
  primaryHref: string;
  secondaryCta?: string;
  secondaryHref?: string;
  sourceLabel: string;
  sourceUrl: string;
};

export type NormalizedEvent = {
  eventId: string;
  sourceProvider: EventSourceProvider;
  sourceEventId: string;
  sourceUrl: string;
  ticketUrl?: string;
  title: string;
  subtitle?: string;
  description?: string;
  category: EventCategory;
  performers: string[];
  startsAt: string;
  doorsAt?: string;
  endsAt?: string;
  timezone: string;
  ticketStatus?: EventTicketStatus;
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  status: EventStatus;
  venue: EventVenue;
  nodeId: NetworkNodeId;
  commercialPath: EventCommercialPath;
  demandScore: number;
  next48Eligible: boolean;
  pressEligible: boolean;
  display: EventDisplayModel;
  updatedAt: string;
};

export type EventManifestMetadata = {
  version: string;
  generatedAt: string | null;
  description?: string;
};

export type EventFeedManifest<TItem> = {
  metadata: EventManifestMetadata;
  items: TItem[];
};

export type Next48EventCard = {
  eventId: string;
  title: string;
  subtitle?: string;
  startsAt: string;
  timezone: string;
  venueName: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  badge?: string;
  primaryCta: string;
  primaryHref: string;
  sourceLabel: string;
  sourceUrl: string;
};

export type NodeUpcomingEventCard = Next48EventCard & {
  nodeId: NetworkNodeId;
  category: EventCategory;
};

export type VenueEventRow = {
  eventId: string;
  venueId: string;
  title: string;
  startsAt: string;
  status: EventStatus;
  ticketUrl?: string;
  sourceUrl: string;
};

export type EventPressDraftInput = {
  eventId: string;
  nodeId: NetworkNodeId;
  topic: string;
  title: string;
  sourceUrl: string;
  commercialPath: EventCommercialPath;
  draftStatus: "queued" | "draft" | "review" | "approved" | "rejected";
};

export type ShuttleOpportunityCard = {
  eventId: string;
  nodeId: NetworkNodeId;
  venueName: string;
  startsAt: string;
  market: string;
  demandScore: number;
  commercialPath: EventCommercialPath;
  latitude: number;
  longitude: number;
};

export type InternalOpportunityAlert = {
  eventId: string;
  nodeId: NetworkNodeId;
  severity: "info" | "watch" | "high";
  message: string;
  sourceUrl: string;
  commercialPath: EventCommercialPath;
};

export type CityWeekendGuideItem = {
  eventId: string;
  city: string;
  state: string;
  title: string;
  startsAt: string;
  venueName: string;
  primaryHref: string;
  sourceUrl: string;
};
