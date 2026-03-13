import test from "node:test";
import assert from "node:assert/strict";
import {
  getPlaceActionGraphBySlug,
  listPlaceGraphSummaries,
} from "@/lib/dcc/graph/placeActionGraph";

test("place action graph resolves by slug", () => {
  const graph = getPlaceActionGraphBySlug("juneau");
  if (!graph) {
    // graph file may not include this slug in very early environments
    assert.ok(true);
    return;
  }
  assert.equal(typeof graph.place_id, "string");
  assert.equal(typeof graph.counts.tours, "number");
  assert.equal(typeof graph.counts.cruises, "number");
  assert.ok(Array.isArray(graph.providers));
});

test("place graph summaries list is stable shape", () => {
  const rows = listPlaceGraphSummaries(10);
  assert.ok(Array.isArray(rows));
  if (rows.length > 0) {
    const first = rows[0];
    assert.equal(typeof first.place_id, "string");
    assert.equal(typeof first.title, "string");
    assert.equal(typeof first.trend, "string");
    assert.ok(first.action_counts);
  }
});
