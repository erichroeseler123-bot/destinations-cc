import test from "node:test";
import assert from "node:assert/strict";
import { readHandoffContext } from "../lib/handoff/readContext";
import { airport420BaseState, airport420ResolverRules } from "../lib/handoff/airport420Resolver";
import { resolveInitialState } from "../lib/handoff/resolveInitialState";

test("readHandoffContext prefers canonical decision fields and backfills legacy continuity", () => {
  const ctx = readHandoffContext({
    dcc_handoff_id: "qa_420_decision_1",
    source_page: "/denver/weed-airport-pickup",
    decision_corridor: "airport-420-pickup",
    decision_action: "book_transfer",
    decision_option: "airport-mountain",
    decision_product: "airport-mountain",
    decision_entry: "act",
    decision_state: "committed",
    topic: "ski-transfer",
    date: "2026-12-20",
  });

  assert.deepEqual(ctx, {
    handoffId: "qa_420_decision_1",
    sourcePage: "/denver/weed-airport-pickup",
    decisionCorridor: "airport-420-pickup",
    decisionCta: undefined,
    decisionAction: "book_transfer",
    decisionOption: "airport-mountain",
    decisionProduct: "airport-mountain",
    decisionEntry: "act",
    decisionState: "committed",
    requestedLane: undefined,
    resolvedLane: "airport-mountain",
    topic: "ski-transfer",
    subtype: undefined,
    date: "2026-12-20",
    port: undefined,
    productSlug: "airport-mountain",
    rank: undefined,
    widgetId: undefined,
    widgetPlacement: undefined,
  });
});

test("resolver honors canonical decision product for Red Rocks and mountain arrivals", () => {
  const redRocks = resolveInitialState(
    readHandoffContext({
      decision_corridor: "red-rocks-airport-arrival",
      decision_option: "event-transfer",
      decision_product: "airport-red-rocks",
      source_page: "/red-rocks/getting-in-from-denver",
    }),
    airport420BaseState,
    airport420ResolverRules,
  );

  assert.equal(redRocks.state.defaultCardSlug, "airport-red-rocks");

  const mountain = resolveInitialState(
    readHandoffContext({
      decision_corridor: "airport-420-pickup",
      decision_option: "airport-mountain",
      decision_product: "airport-mountain",
      topic: "ski-transfer",
    }),
    airport420BaseState,
    airport420ResolverRules,
  );

  assert.equal(mountain.state.defaultCardSlug, "airport-mountain");
});
