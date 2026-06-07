import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  EVENT_SOURCE_REGISTRY,
  EventOpportunitiesManifestSchema,
  EventSourcesManifestSchema,
  EventVenuesManifestSchema,
  Next48ManifestSchema,
  NormalizedEventSchema,
  NormalizedEventsManifestSchema,
  PressQueueManifestSchema,
  assertCommercialEvent,
  assertPublicDisplayableEvent,
  isNext48Event,
  normalizeEventCandidate,
  toCityWeekendGuideItem,
  toEventPressDraftInput,
  toInternalOpportunityAlert,
  toNext48EventCard,
  toNodeUpcomingEventCard,
  toShuttleOpportunityCard,
  toVenueEventRow,
  type NormalizedEvent,
} from "@/lib/events";

const EVENT_DATA_DIR = path.join(process.cwd(), "data", "events");

function readJson(fileName: string) {
  return JSON.parse(fs.readFileSync(path.join(EVENT_DATA_DIR, fileName), "utf8")) as unknown;
}

function futureIso(hoursFromNow: number) {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
}

function fixtureEvent(overrides: Partial<NormalizedEvent> = {}): Partial<NormalizedEvent> {
  const base: Partial<NormalizedEvent> = {
    eventId: "event-radar-test-1",
    sourceProvider: "ticketmaster",
    sourceEventId: "tm-test-1",
    sourceUrl: "https://example.com/events/event-radar-test-1",
    ticketUrl: "https://example.com/tickets/event-radar-test-1",
    title: "Sample Concert",
    subtitle: "Live at the test venue",
    description: "A schema-only fixture for Event Radar foundation tests.",
    category: "concert",
    performers: ["Sample Artist"],
    startsAt: futureIso(4),
    doorsAt: futureIso(3),
    endsAt: futureIso(7),
    timezone: "America/Chicago",
    ticketStatus: "available",
    minPrice: 25,
    maxPrice: 60,
    currency: "USD",
    status: "scheduled",
    venue: {
      venueId: "venue-test-1",
      venueName: "Test Venue",
      address1: "100 Test Ave",
      city: "Somerset",
      state: "WI",
      postalCode: "54025",
      country: "US",
      latitude: 45.124,
      longitude: -92.673,
      neighborhood: "River Road",
      market: "Somerset",
      region: "Western Wisconsin",
      geocodeSource: "manual_verified",
      geocodeConfidence: "high",
    },
    nodeId: "somerset",
    commercialPath: {
      type: "shuttle",
      href: "/somerset-wi",
      cta: "Plan Shuttle",
    },
    demandScore: 82,
    next48Eligible: true,
    pressEligible: true,
    display: {
      cardTitle: "Sample Concert at Test Venue",
      cardSubtitle: "Somerset, WI",
      shortSummary: "A local event fixture with verified coordinates.",
      badge: "Next 48",
      primaryCta: "Plan Shuttle",
      primaryHref: "/somerset-wi",
      secondaryCta: "View Source",
      secondaryHref: "https://example.com/events/event-radar-test-1",
      sourceLabel: "Ticketmaster",
      sourceUrl: "https://example.com/events/event-radar-test-1",
    },
    updatedAt: new Date().toISOString(),
  };
  return { ...base, ...overrides };
}

test("Event Radar source registry is disabled placeholder infrastructure", () => {
  const sources = EventSourcesManifestSchema.parse(readJson("sources.json"));
  const sourceIds = sources.map((source) => source.id);
  assert.deepEqual(sourceIds, EVENT_SOURCE_REGISTRY.map((source) => source.id));

  for (const source of sources) {
    assert.equal(source.enabled, false, `${source.id} must remain disabled in Phase 1`);
  }
});

test("empty Event Radar manifests are valid", () => {
  assert.deepEqual(EventVenuesManifestSchema.parse(readJson("venues.json")), []);
  assert.deepEqual(NormalizedEventsManifestSchema.parse(readJson("normalized-events.json")), []);
  assert.equal(Next48ManifestSchema.parse(readJson("next-48.json")).items.length, 0);
  assert.equal(PressQueueManifestSchema.parse(readJson("press-queue.json")).items.length, 0);
  assert.equal(EventOpportunitiesManifestSchema.parse(readJson("event-opportunities.json")).items.length, 0);
});

test("a valid normalized event can produce all Phase 1 render target inputs", () => {
  const event = normalizeEventCandidate(fixtureEvent());
  assertPublicDisplayableEvent(event);
  assertCommercialEvent(event);

  assert.equal(toNext48EventCard(event).latitude, event.venue.latitude);
  assert.equal(toNodeUpcomingEventCard(event).nodeId, "somerset");
  assert.equal(toVenueEventRow(event).venueId, event.venue.venueId);
  assert.equal(toEventPressDraftInput(event).draftStatus, "queued");
  assert.equal(toShuttleOpportunityCard(event).commercialPath.type, "shuttle");
  assert.equal(toInternalOpportunityAlert(event).severity, "high");
  assert.equal(toCityWeekendGuideItem(event).sourceUrl, event.sourceUrl);
});

test("displayable events require source URL, venue, start time, node, commercial path, and coordinates", () => {
  assert.throws(() => NormalizedEventSchema.parse(fixtureEvent({ sourceUrl: undefined })));
  assert.throws(() => NormalizedEventSchema.parse(fixtureEvent({ startsAt: undefined })));
  assert.throws(() => NormalizedEventSchema.parse(fixtureEvent({ nodeId: undefined })));
  assert.throws(() => NormalizedEventSchema.parse(fixtureEvent({ commercialPath: undefined })));
  assert.throws(() =>
    NormalizedEventSchema.parse(
      fixtureEvent({
        venue: {
          ...(fixtureEvent().venue as Record<string, unknown>),
          latitude: undefined,
        } as any,
      }),
    ),
  );
  assert.throws(() =>
    NormalizedEventSchema.parse(
      fixtureEvent({
        venue: {
          ...(fixtureEvent().venue as Record<string, unknown>),
          longitude: undefined,
        } as any,
      }),
    ),
  );
});

test("next-48 eligibility requires a future start inside the next 48 hours", () => {
  const event = normalizeEventCandidate(fixtureEvent({ startsAt: futureIso(2) }));
  const lateEvent = normalizeEventCandidate(fixtureEvent({ eventId: "late", startsAt: futureIso(72) }));

  assert.equal(isNext48Event(event), true);
  assert.equal(isNext48Event(lateEvent), false);
});

test("cancelled, postponed, and stale events are excluded from public render targets", () => {
  for (const status of ["cancelled", "postponed", "stale"] as const) {
    const event = normalizeEventCandidate(fixtureEvent({ eventId: `status-${status}`, status }));
    assert.throws(() => toNext48EventCard(event), /not public-displayable/);
  }
});

test("pricing claims require currency and cannot invert min/max", () => {
  assert.throws(() => NormalizedEventSchema.parse(fixtureEvent({ currency: undefined })), /currency/);
  assert.throws(() => NormalizedEventSchema.parse(fixtureEvent({ minPrice: 80, maxPrice: 20 })), /minPrice/);
});

test("display source URL must match the event source URL", () => {
  assert.throws(() =>
    NormalizedEventSchema.parse(
      fixtureEvent({
        display: {
          ...(fixtureEvent().display as Record<string, unknown>),
          sourceUrl: "https://example.com/different-source",
        } as any,
      }),
    ),
  );
});
