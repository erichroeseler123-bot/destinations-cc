import test from "node:test";
import assert from "node:assert/strict";
import { buildPlaceActionInventory } from "@/lib/dcc/internal/actionInventory";

test("action inventory returns normalized counts and diagnostics", async () => {
  const inventory = await buildPlaceActionInventory({
    slug: "juneau",
    name: "Juneau",
  });

  assert.equal(typeof inventory.place_slug, "string");
  assert.ok(inventory.place_slug.length > 0);

  assert.equal(typeof inventory.counts.cruises, "number");
  assert.equal(typeof inventory.counts.tours, "number");
  assert.equal(typeof inventory.counts.events, "number");
  assert.equal(typeof inventory.counts.transport, "number");

  assert.equal(typeof inventory.diagnostics.cruises.source, "string");
  assert.equal(typeof inventory.diagnostics.tours.source, "string");
  assert.equal(typeof inventory.diagnostics.events.source, "string");
  assert.equal(typeof inventory.diagnostics.transport.source, "string");
});
