import test from "node:test";
import assert from "node:assert/strict";
import { getAskDccEvidence } from "@/lib/dcc/ask/service";

test("Ask DCC finds published Juneau research before routing", () => {
  const result = getAskDccEvidence("Can we do whales and a helicopter in Juneau?");
  assert.ok(result.sources.length > 0);
  assert.ok(result.sources.some((source) => /juneau|whale|helicopter|flight/i.test(source.title)));
  assert.match(result.sources[0].title, /whale watching and a helicopter/i);
  if (result.handoff) assert.ok(result.handoff.href.startsWith("https://"));
});

test("Ask DCC finds Colorado transportation research for DEN to Vail", () => {
  const result = getAskDccEvidence("How should 7 people get from DEN to Vail with ski gear?");
  assert.ok(result.sources.length > 0);
  assert.ok(result.sources.some((source) => /vail|airport|transport|ski|gear/i.test(source.title)));
});

test("a DEN-to-Vail transfer question does not pad its research with unrelated Denver activities", () => {
  for (const question of ["How should 7 people get from DEN to Vail?", "How should 7 people get from DEN to Vail with ski gear?"]) {
    const result = getAskDccEvidence(question);
    assert.ok(result.sources.length > 0);
    assert.ok(!result.sources.some((source) => /argo|idaho springs|breckenridge/i.test(source.title)));
  }
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

test("a hotel-pickup follow-up retains New Orleans swamp context without unrelated airport research", () => {
  const result = getAskDccEvidence("One child is 4. We need hotel pickup.", [
    { role: "user", content: "Airboat or covered swamp boat with kids in New Orleans?" },
    { role: "assistant", content: "Compare ride style and transportation." },
    { role: "user", content: "One child is 4. We need hotel pickup." },
  ]);
  assert.ok(result.sources.length > 0);
  assert.ok(result.sources.every((source) => source.category === "new-orleans"));
  assert.ok(!result.sources.some((source) => /cannabis|airport/i.test(source.title)));
  assert.equal(new URL(result.handoff!.href).hostname, "welcometotheswamp.com");
});

test("an explicit new destination replaces the previous conversation's destination", () => {
  const result = getAskDccEvidence("Now how should 7 people get from DEN to Vail with ski gear?", [
    { role: "user", content: "Airboat or covered swamp boat with kids in New Orleans?" },
    { role: "assistant", content: "Start with a covered swamp boat." },
  ]);
  assert.ok(result.sources.length > 0);
  assert.ok(result.sources.every((source) => ["colorado", "transportation"].includes(source.category)));
  assert.ok(!result.sources.some((source) => /swamp|new orleans/i.test(source.title)));
});

test("assistant text cannot supply a destination that the traveler never chose", () => {
  const result = getAskDccEvidence("What about the return buffer?", [
    { role: "user", content: "Can we do whales and a helicopter in Juneau?" },
    { role: "assistant", content: "New Orleans, DEN, Vail and cannabis-friendly airport pickup." },
  ]);
  assert.ok(result.sources.length > 0);
  assert.ok(result.sources.every((source) => source.category === "alaska"));
});

test("an ambiguous pickup question does not imply a destination or commercial handoff", () => {
  const result = getAskDccEvidence("We need hotel pickup with kids.");
  assert.equal(result.handoff, null);
  assert.equal(result.sources.length, 0);
  assert.equal(result.confidence, "low");
});

test("an unsupported destination does not turn generic family words into a booking recommendation", () => {
  const result = getAskDccEvidence("What should we do in Reykjavik with kids and hotel pickup?");
  assert.equal(result.handoff, null);
  assert.equal(result.sources.length, 0);
  assert.equal(result.confidence, "low");
});

test("an explicit switch to an unsupported destination does not inherit the earlier booking destination", () => {
  for (const question of ["Now what should we do in Reykjavik with kids?", "Switch to Paris instead of New Orleans."]) {
    const result = getAskDccEvidence(question, [
      { role: "user", content: "Airboat or covered swamp boat with kids in New Orleans?" },
    ]);
    assert.equal(result.handoff, null);
    assert.equal(result.sources.length, 0);
  }
});

