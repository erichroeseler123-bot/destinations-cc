import test from "node:test";
import assert from "node:assert/strict";
import { getDestinationConfig } from "@/src/data/destination-configs";
import { resolveCommercialActions } from "@/src/lib/dcc/commercial-actions";
import { buildDestinationReadModel, buildLiveReadModel } from "@/src/lib/dcc/public-read";
import { GET as getEvents } from "@/app/api/v1/destinations/[slug]/events/route";

test("French Quarter context resolves orientation then tours", () => {
  const config = getDestinationConfig("new-orleans");
  assert.ok(config);
  const actions = resolveCommercialActions(config, {
    destinationId: "new-orleans",
    pageKind: "Neighborhood",
    placeId: "new-orleans/french-quarter",
  });
  assert.deepEqual(actions.map((action) => action.provider), [
    "french-quarter-orientation",
    "welcome-to-new-orleans-tours",
  ]);
});

test("St. Thomas does not encode a static driver relationship", () => {
  const config = getDestinationConfig("st-thomas");
  assert.ok(config);
  assert.equal(config.places.some((place) => place.relatedIds?.some((id) => id.includes("driver"))), false);
  const actions = resolveCommercialActions(config, { destinationId: "st-thomas" });
  assert.equal(actions.length, 1);
  assert.equal(actions[0]?.provider, "vibe-around-town");
  assert.match(actions[0]?.description ?? "", /live driver availability/i);
});

test("Breckenridge exposes GoSno only as the destination commercial action", () => {
  const config = getDestinationConfig("breckenridge");
  assert.ok(config);
  const actions = resolveCommercialActions(config, { destinationId: "breckenridge" });
  assert.equal(actions.length, 1);
  assert.equal(actions[0]?.provider, "gosno");
});

test("public read models expose canonical stable data and configured live sources", () => {
  const destination = buildDestinationReadModel("new-orleans");
  const live = buildLiveReadModel("new-orleans");
  assert.equal(destination?.id, "new-orleans");
  assert.ok(live);
  assert.equal(live.sources.every((source) => source.status === "configured"), true);
});

test("events contract validates 48h filters but refuses fabricated live data", async () => {
  const response = await getEvents(
    new Request("https://example.test/api/v1/destinations/new-orleans/events?lat=29.95&lng=-90.07&radiusKm=5&hours=48&category=music"),
    { params: Promise.resolve({ slug: "new-orleans" }) },
  );
  const payload = await response.json();
  assert.equal(response.status, 501);
  assert.equal(payload.destinationId, "new-orleans");
  assert.equal(payload.filters.hours, 48);
  assert.equal(payload.filters.radiusKm, 5);
  assert.equal(payload.error, "live_event_adapter_not_connected");
});

test("events contract rejects partial coordinates", async () => {
  const response = await getEvents(
    new Request("https://example.test/api/v1/destinations/new-orleans/events?lat=29.95"),
    { params: Promise.resolve({ slug: "new-orleans" }) },
  );
  assert.equal(response.status, 400);
});
