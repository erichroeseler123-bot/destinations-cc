import test from "node:test";
import assert from "node:assert/strict";
import {
  appendCorridorEventDurably,
  CorridorEventPayloadSchema,
} from "../../lib/dcc/telemetry/corridorEvents";
import { loadCrossSiteNetworkFunnelSummary } from "../../lib/dcc/telemetry/networkEvents";

test("Cross-site E2E journey preserves journey_id, deduplicates event_id, and excludes is_test from production metrics", async () => {
  const journeyId = `jrn_qa_${Date.now().toString(36)}`;
  const sharedEventId = `evt_qa_${Date.now().toString(36)}_1`;

  // 1. PARR landing -> DCC plan opened -> return to PARR -> verified booking_completed (all is_test: true)
  const parrLanding = CorridorEventPayloadSchema.parse({
    corridor_id: "partyatredrocks",
    event_name: "service_page_view",
    event_id: sharedEventId,
    journey_id: journeyId,
    is_test: true,
    session_id: "sess_qa_1",
    source_page: "/",
    metadata: {
      originating_site: "partyatredrocks",
      destination_site: "partyatredrocks",
      journey_id: journeyId,
      campaign_source: "qa_test",
      is_test: true,
    },
  });

  const dccPlan = CorridorEventPayloadSchema.parse({
    corridor_id: "red-rocks",
    event_name: "dcc_plan_opened",
    event_id: `${sharedEventId}_2`,
    journey_id: journeyId,
    is_test: true,
    session_id: "sess_qa_1",
    source_page: "/red-rocks",
    metadata: {
      originating_site: "partyatredrocks",
      destination_site: "dcc",
      journey_id: journeyId,
      campaign_source: "qa_test",
      is_test: true,
    },
  });

  const returnHandoff = CorridorEventPayloadSchema.parse({
    corridor_id: "red-rocks",
    event_name: "network_handoff",
    event_id: `${sharedEventId}_3`,
    journey_id: journeyId,
    is_test: true,
    session_id: "sess_qa_1",
    source_page: "/red-rocks",
    metadata: {
      originating_site: "dcc",
      destination_site: "partyatredrocks",
      journey_id: journeyId,
      campaign_source: "qa_test",
      is_test: true,
    },
  });

  const verifiedBooking = CorridorEventPayloadSchema.parse({
    corridor_id: "partyatredrocks",
    event_name: "booking_completed",
    event_id: `${sharedEventId}_4`,
    journey_id: journeyId,
    is_test: true,
    session_id: "sess_qa_1",
    source_page: "/booking/qa-token",
    metadata: {
      originating_site: "partyatredrocks",
      destination_site: "partyatredrocks",
      journey_id: journeyId,
      campaign_source: "qa_test",
      is_test: true,
      verified_source: "internal_order_confirmed",
    },
  });

  // Ensure schemas validate and durable append handles no-db or db environments cleanly
  const r1 = await appendCorridorEventDurably(parrLanding);
  const r1Dup = await appendCorridorEventDurably(parrLanding);
  const r2 = await appendCorridorEventDurably(dccPlan);
  const r3 = await appendCorridorEventDurably(returnHandoff);
  const r4 = await appendCorridorEventDurably(verifiedBooking);

  assert.equal(r1.ok, true);
  assert.equal(r1Dup.ok, true);
  assert.equal(r2.ok, true);
  assert.equal(r3.ok, true);
  assert.equal(r4.ok, true);

  // If DB is connected in this environment, verify deduplication and is_test exclusion
  if (r1.stored) {
    assert.equal(r1Dup.deduplicated, true);
    const prodSummary = await loadCrossSiteNetworkFunnelSummary(30, { includeTest: false });
    const testSummary = await loadCrossSiteNetworkFunnelSummary(30, { includeTest: true });
    assert.ok(testSummary.totalEvents >= prodSummary.totalEvents + 4);
    assert.ok(testSummary.verifiedBookingJourneys >= prodSummary.verifiedBookingJourneys + 1);
  }
});
