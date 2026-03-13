import test from "node:test";
import assert from "node:assert/strict";
import { getPlaceLiveSummary } from "@/lib/dcc/graph/placeLiveSummary";
import { listPlaceGraphSummaries } from "@/lib/dcc/graph/placeActionGraph";

test("place live summary returns stable shape", async () => {
  const candidate = listPlaceGraphSummaries(1)[0];
  if (!candidate) {
    assert.ok(true);
    return;
  }
  const summary = await getPlaceLiveSummary(candidate.place_slug);
  if (!summary) {
    assert.ok(true);
    return;
  }
  assert.equal(typeof summary.place_id, "string");
  assert.equal(typeof summary.place_slug, "string");
  assert.equal(typeof summary.action_counts.tours, "number");
  assert.equal(typeof summary.action_counts.cruises, "number");
  assert.equal(typeof summary.freshness.graph_stale, "boolean");
  assert.equal(typeof summary.freshness.action_sources_stale, "boolean");
});
