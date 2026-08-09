import test from "node:test";
import assert from "node:assert/strict";
import { getAskDccEvidence } from "@/lib/dcc/ask/service";

test("Ask DCC finds published Juneau research before routing", () => {
  const result = getAskDccEvidence("Can we do whales and a helicopter in Juneau?");
  assert.ok(result.sources.length > 0);
  assert.ok(result.sources.some((source) => /juneau|whale|helicopter|flight/i.test(source.title)));
  if (result.handoff) assert.ok(result.handoff.href.startsWith("https://"));
});

test("Ask DCC finds Colorado transportation research for DEN to Vail", () => {
  const result = getAskDccEvidence("How should 7 people get from DEN to Vail with ski gear?");
  assert.ok(result.sources.length > 0);
  assert.ok(result.sources.some((source) => /vail|airport|transport|ski|gear/i.test(source.title)));
});

test("Ask DCC finds swamp research for a family question", () => {
  const result = getAskDccEvidence("Airboat or covered swamp boat with kids in New Orleans?");
  assert.ok(result.sources.length > 0);
  assert.ok(result.sources.some((source) => /swamp|airboat|covered|kids/i.test(source.title)));
});

test("Ask DCC never fabricates a handoff for unmatched nonsense", () => {
  const result = getAskDccEvidence("quasar nebula compiler zxqv banana");
  assert.equal(result.sources.length, 0);
  assert.equal(result.handoff, null);
  assert.equal(result.confidence, "low");
});
