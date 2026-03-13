import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDccHandoffPayload,
  buildDccHandoffUrl,
  buildDccWtaHandoffHref,
  decodeDccHandoffPayload,
} from "@/lib/dcc/internal/handoff";

test("handoff payload includes canonical cruiseShipSlug when alias matches registry", () => {
  const payload = buildDccHandoffPayload({
    sourceSlug: "dcc",
    portSlug: "juneau",
    topicSlug: "whale-watching",
    cruiseShip: "NCL Bliss",
    date: "2026-07-01",
  });

  assert.equal(payload.source, "dcc");
  assert.equal(payload.version, "1");
  assert.equal(payload.destination.portSlug, "juneau");
  assert.equal(payload.traveler.cruiseShip, "Norwegian Bliss");
  assert.equal(payload.traveler.cruiseShipSlug, "norwegian-bliss");
  assert.equal(payload.traveler.cruiseDate, "2026-07-01");
  assert.equal(payload.booking?.date, "2026-07-01");
  assert.equal(payload.booking?.portSlug, "juneau");
  assert.equal(payload.context?.sourceSlug, "dcc");
  assert.equal(payload.context?.authorityTopic, "whale-watching");
});

test("handoff URL includes payload query and decodes to canonical cruiseShipSlug", () => {
  const url = buildDccHandoffUrl({
    sourceSlug: "dcc",
    portSlug: "juneau",
    topicSlug: "whale-watching",
    cruiseShip: "bliss",
    date: "2026-07-01",
  });

  assert.equal(url.startsWith("/handoff/dcc?"), true);

  const parsed = new URL(`https://example.com${url}`);
  const payloadParam = parsed.searchParams.get("payload");
  assert.ok(payloadParam);
  assert.equal(parsed.searchParams.get("sig"), null);

  const decoded = decodeDccHandoffPayload(payloadParam || "");
  assert.equal(decoded.destination.portSlug, "juneau");
  assert.equal(decoded.traveler.cruiseShip, "Norwegian Bliss");
  assert.equal(decoded.traveler.cruiseShipSlug, "norwegian-bliss");
  assert.equal(decoded.booking?.date, "2026-07-01");
  assert.equal(decoded.context?.authorityTopic, "whale-watching");
});

test("handoff URL adds sig when signing secret is provided", () => {
  const url = buildDccHandoffUrl(
    {
      sourceSlug: "dcc",
      portSlug: "juneau",
      cruiseShip: "NCL Bliss",
    },
    "/handoff/dcc",
    { signingSecret: "test-secret" }
  );
  const parsed = new URL(`https://example.com${url}`);
  assert.ok(parsed.searchParams.get("payload"));
  assert.ok(parsed.searchParams.get("sig"));
});

test("buildDccWtaHandoffHref returns absolute URL when router base is set", () => {
  const href = buildDccWtaHandoffHref(
    {
      sourceSlug: "dcc",
      portSlug: "juneau",
      cruiseShip: "NCL Bliss",
    },
    { routerBaseUrl: "https://wta.example.com" }
  );
  assert.equal(href.startsWith("https://wta.example.com/handoff/dcc?payload="), true);
});
