import fs from "node:fs";
import path from "node:path";
import {
  EVENT_SOURCE_REGISTRY,
  EventOpportunitiesManifestSchema,
  EventSourcesManifestSchema,
  EventVenuesManifestSchema,
  Next48ManifestSchema,
  NormalizedEventsManifestSchema,
  PressQueueManifestSchema,
  assertCommercialEvent,
  assertPublicDisplayableEvent,
  isNext48Event,
  toNext48EventCard,
} from "@/lib/events";
import type { NormalizedEvent } from "@/lib/events";

const EVENT_DATA_DIR = path.join(process.cwd(), "data", "events");

type EventRadarValidationSummary = {
  ok: true;
  ingestion: "disabled";
  sources: number;
  venues: number;
  normalizedEvents: number;
  next48Events: number;
  pressQueueItems: number;
  opportunities: number;
};

function readJson(fileName: string) {
  return JSON.parse(fs.readFileSync(path.join(EVENT_DATA_DIR, fileName), "utf8")) as unknown;
}

function requireMatchingSourceRegistry(sourceConfigs: unknown[]) {
  const expected = EVENT_SOURCE_REGISTRY.map((source) => ({
    id: source.id,
    provider: source.provider,
    enabled: source.enabled,
    ingestionMode: source.ingestionMode,
  }));
  const actual = sourceConfigs.map((source: any) => ({
    id: source.id,
    provider: source.provider,
    enabled: source.enabled,
    ingestionMode: source.ingestionMode,
  }));

  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error("data/events/sources.json does not match EVENT_SOURCE_REGISTRY.");
  }

  for (const source of EVENT_SOURCE_REGISTRY) {
    if (source.enabled) {
      throw new Error(`Event source ${source.id} is enabled. Phase 1 must not ingest live APIs.`);
    }
  }
}

function validatePublicEvent(event: NormalizedEvent) {
  assertPublicDisplayableEvent(event);
  assertCommercialEvent(event);
  toNext48EventCard(event);
}

export function validateEventRadarFoundation(now = new Date()): EventRadarValidationSummary {
  const sources = EventSourcesManifestSchema.parse(readJson("sources.json"));
  const venues = EventVenuesManifestSchema.parse(readJson("venues.json"));
  const normalizedEvents = NormalizedEventsManifestSchema.parse(readJson("normalized-events.json"));
  const next48 = Next48ManifestSchema.parse(readJson("next-48.json"));
  const pressQueue = PressQueueManifestSchema.parse(readJson("press-queue.json"));
  const opportunities = EventOpportunitiesManifestSchema.parse(readJson("event-opportunities.json"));

  requireMatchingSourceRegistry(sources);

  for (const event of normalizedEvents) {
    validatePublicEvent(event);
  }

  for (const event of next48.items) {
    validatePublicEvent(event);
    if (!isNext48Event(event, now)) {
      throw new Error(`Next-48 event ${event.eventId} is not eligible for the next 48 hours.`);
    }
  }

  for (const item of pressQueue.items) {
    if (!item.eventId || !item.nodeId || !item.sourceUrl || !item.commercialPath.href || !item.commercialPath.cta) {
      throw new Error(`Press queue item ${item.eventId || "<unknown>"} is missing required routing context.`);
    }
  }

  for (const opportunity of opportunities.items) {
    if (
      !opportunity.eventId ||
      !opportunity.nodeId ||
      !opportunity.sourceUrl ||
      !opportunity.commercialPath.href ||
      !opportunity.commercialPath.cta
    ) {
      throw new Error(`Opportunity ${opportunity.opportunityId || "<unknown>"} is missing commercial context.`);
    }
  }

  return {
    ok: true,
    ingestion: "disabled",
    sources: sources.length,
    venues: venues.length,
    normalizedEvents: normalizedEvents.length,
    next48Events: next48.items.length,
    pressQueueItems: pressQueue.items.length,
    opportunities: opportunities.items.length,
  };
}

if (process.argv[1]?.endsWith("validate-event-radar-foundation.ts")) {
  const summary = validateEventRadarFoundation();
  console.log(JSON.stringify(summary, null, 2));
}
