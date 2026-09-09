import assert from "node:assert/strict";
import { NOLA_GEO_FACTS, getNolaGeoFact } from "../app/new-orleans/data/nolaGeoFacts";

console.log("Running Welcome to New Orleans GEO facts verification tests...\n");

const EXPECTED_KEYS = [
  "swamp-tours",
  "airboat-tours",
  "covered-swamp-boat-tours",
  "ghost-tours",
  "riverboat-cruises",
  "garden-district-tours",
  "plantation-tours",
  "french-quarter-tours",
  "city-tours",
  "oak-alley-vs-whitney",
];

for (const key of EXPECTED_KEYS) {
  const fact = NOLA_GEO_FACTS[key];
  assert.ok(fact, `Missing key: ${key}`);
  assert.ok(fact.directQuestion.endsWith("?"), `Question for ${key} must end with '?'`);
  assert.ok(fact.directAnswer.length >= 60, `Answer for ${key} too short for direct snippet extraction`);
  assert.ok(fact.pricingValue.length > 0, `Missing pricingValue for ${key}`);
  assert.ok(fact.durationValue.length > 0, `Missing durationValue for ${key}`);
  assert.ok(fact.meetingPointValue.length > 0, `Missing meetingPointValue for ${key}`);
  assert.ok(fact.safetyBufferValue.length > 0, `Missing safetyBufferValue for ${key}`);
}

// Verify lookup function
assert.equal(getNolaGeoFact("swamp-tours")?.id, "swamp-tours");
assert.equal(getNolaGeoFact("ghost-tours")?.id, "ghost-tours");
assert.equal(getNolaGeoFact("riverboat-cruises")?.id, "riverboat-cruises");
assert.equal(getNolaGeoFact("plantation-tours")?.id, "plantation-tours");
assert.equal(getNolaGeoFact("oak-alley-vs-whitney")?.id, "oak-alley-vs-whitney");
assert.equal(getNolaGeoFact("unknown-slug"), null);

console.log(`✅ All ${EXPECTED_KEYS.length} New Orleans GEO fact entries verified successfully.`);
console.log("✅ getNolaGeoFact resolution verified.");
