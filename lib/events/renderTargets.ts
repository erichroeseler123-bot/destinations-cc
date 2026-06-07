import { assertCommercialEvent, assertPublicDisplayableEvent } from "./normalize";
import type {
  CityWeekendGuideItem,
  EventPressDraftInput,
  InternalOpportunityAlert,
  Next48EventCard,
  NodeUpcomingEventCard,
  NormalizedEvent,
  ShuttleOpportunityCard,
  VenueEventRow,
} from "./types";

export function toNext48EventCard(event: NormalizedEvent): Next48EventCard {
  assertPublicDisplayableEvent(event);
  return {
    eventId: event.eventId,
    title: event.display.cardTitle,
    subtitle: event.display.cardSubtitle,
    startsAt: event.startsAt,
    timezone: event.timezone,
    venueName: event.venue.venueName,
    city: event.venue.city,
    state: event.venue.state,
    latitude: event.venue.latitude,
    longitude: event.venue.longitude,
    badge: event.display.badge,
    primaryCta: event.display.primaryCta,
    primaryHref: event.display.primaryHref,
    sourceLabel: event.display.sourceLabel,
    sourceUrl: event.sourceUrl,
  };
}

export function toNodeUpcomingEventCard(event: NormalizedEvent): NodeUpcomingEventCard {
  assertPublicDisplayableEvent(event);
  return {
    ...toNext48EventCard(event),
    nodeId: event.nodeId,
    category: event.category,
  };
}

export function toVenueEventRow(event: NormalizedEvent): VenueEventRow {
  assertPublicDisplayableEvent(event);
  return {
    eventId: event.eventId,
    venueId: event.venue.venueId,
    title: event.title,
    startsAt: event.startsAt,
    status: event.status,
    ticketUrl: event.ticketUrl,
    sourceUrl: event.sourceUrl,
  };
}

export function toEventPressDraftInput(event: NormalizedEvent): EventPressDraftInput {
  assertCommercialEvent(assertPublicDisplayableEvent(event));
  return {
    eventId: event.eventId,
    nodeId: event.nodeId,
    topic: `${event.venue.market} ${event.category}`,
    title: event.display.cardTitle,
    sourceUrl: event.sourceUrl,
    commercialPath: event.commercialPath,
    draftStatus: "queued",
  };
}

export function toShuttleOpportunityCard(event: NormalizedEvent): ShuttleOpportunityCard {
  assertCommercialEvent(assertPublicDisplayableEvent(event));
  return {
    eventId: event.eventId,
    nodeId: event.nodeId,
    venueName: event.venue.venueName,
    startsAt: event.startsAt,
    market: event.venue.market,
    demandScore: event.demandScore,
    commercialPath: event.commercialPath,
    latitude: event.venue.latitude,
    longitude: event.venue.longitude,
  };
}

export function toInternalOpportunityAlert(event: NormalizedEvent): InternalOpportunityAlert {
  assertCommercialEvent(event);
  return {
    eventId: event.eventId,
    nodeId: event.nodeId,
    severity: event.demandScore >= 80 ? "high" : event.demandScore >= 50 ? "watch" : "info",
    message: `${event.title} at ${event.venue.venueName} may create ${event.commercialPath.type} demand.`,
    sourceUrl: event.sourceUrl,
    commercialPath: event.commercialPath,
  };
}

export function toCityWeekendGuideItem(event: NormalizedEvent): CityWeekendGuideItem {
  assertPublicDisplayableEvent(event);
  return {
    eventId: event.eventId,
    city: event.venue.city,
    state: event.venue.state,
    title: event.display.cardTitle,
    startsAt: event.startsAt,
    venueName: event.venue.venueName,
    primaryHref: event.display.primaryHref,
    sourceUrl: event.sourceUrl,
  };
}
