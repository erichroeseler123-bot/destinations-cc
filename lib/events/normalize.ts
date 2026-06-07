import { NormalizedEventSchema } from "./schema";
import type { NormalizedEvent } from "./types";

export type RawEventCandidate = Partial<NormalizedEvent>;

export function normalizeEventCandidate(candidate: RawEventCandidate): NormalizedEvent {
  return NormalizedEventSchema.parse(candidate);
}

export function isPublicDisplayableEvent(event: NormalizedEvent) {
  if (!event.sourceUrl) return false;
  if (!event.venue?.venueId || !event.venue.venueName) return false;
  if (!Number.isFinite(event.venue.latitude) || !Number.isFinite(event.venue.longitude)) return false;
  if (event.status === "cancelled" || event.status === "postponed" || event.status === "stale") return false;
  return true;
}

export function assertPublicDisplayableEvent(event: NormalizedEvent): NormalizedEvent {
  if (!isPublicDisplayableEvent(event)) {
    throw new Error(`Event ${event.eventId || "<unknown>"} is not public-displayable.`);
  }
  return event;
}

export function isNext48Event(event: NormalizedEvent, now = new Date()) {
  if (!event.next48Eligible || !isPublicDisplayableEvent(event)) return false;
  const start = new Date(event.startsAt);
  const diffMs = start.getTime() - now.getTime();
  return diffMs >= 0 && diffMs <= 48 * 60 * 60 * 1000;
}

export function assertCommercialEvent(event: NormalizedEvent): NormalizedEvent {
  if (!event.nodeId || !event.commercialPath?.href || !event.commercialPath.cta) {
    throw new Error(`Event ${event.eventId || "<unknown>"} is missing commercial context.`);
  }
  return event;
}
