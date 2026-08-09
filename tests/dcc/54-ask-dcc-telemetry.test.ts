import assert from "node:assert/strict";
import test from "node:test";
import { getCorridorCatalogEntry } from "../../lib/dcc/telemetry/corridorCatalog";
import { normalizeAskSessionId, redactAskQuestion } from "../../lib/dcc/ask/telemetry";

test("Ask DCC has a governed telemetry corridor", () => {
  const corridor = getCorridorCatalogEntry("ask-dcc");
  assert.ok(corridor);
  assert.equal(corridor.status, "live");
  assert.equal(corridor.family, "decision-engine");
});

test("Ask DCC redacts obvious contact details before storage", () => {
  const value = redactAskQuestion("Email me at traveler@example.com or call 715-555-1212 about Juneau whales");
  assert.equal(value.includes("traveler@example.com"), false);
  assert.equal(value.includes("715-555-1212"), false);
  assert.match(value, /\[redacted-email\]/);
  assert.match(value, /\[redacted-phone\]/);
  assert.match(value, /Juneau whales/);
});

test("Ask DCC session ids accept generated ids and reject unsafe values", () => {
  assert.equal(normalizeAskSessionId("ask_1234-abcd:ef"), "ask_1234-abcd:ef");
  assert.equal(normalizeAskSessionId("<script>alert(1)</script>"), null);
});
