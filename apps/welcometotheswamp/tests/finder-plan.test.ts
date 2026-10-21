import test from "node:test";
import assert from "node:assert/strict";
import { readFinderPlan } from "../lib/finderPlan";

const plan = { version: 1, travelDate: "2026-10-22", adults: 4, childrenAges: [6], transportation: "self_drive", boatType: "large_airboat" };
const read = (value: unknown) => readFinderPlan(JSON.stringify(value), "2026-10-21");

test("restores date, party, ages and transport without restoring availability", () => {
  assert.deepEqual(read({ ...plan, searchResponse: { winningDeparture: "obsolete" }, verifiedBadges: { old: "live" } }), {
    travelDate: "2026-10-22", adults: 4, childrenAges: [6], transportation: "self_drive", boatType: "large_airboat",
  });
});

test("expires a past travel date while retaining valid party choices", () => {
  assert.deepEqual(read({ ...plan, travelDate: "2026-10-20" }), { ...read(plan), travelDate: "2026-10-21" });
});

test("rejects malformed storage and choices unsupported by the controls", () => {
  for (const raw of [null, "{", "[]", '"oops"']) assert.equal(readFinderPlan(raw, "2026-10-21"), null);
  for (const update of [
    { version: 2 }, { travelDate: "2026-02-30" }, { travelDate: "bad" }, { adults: 11 },
    { adults: "4" }, { childrenAges: [13] }, { childrenAges: ["6"] },
    { childrenAges: Array(7).fill(6) }, { transportation: "unknown" }, { boatType: "unknown" },
  ]) assert.equal(read({ ...plan, ...update }), null);
});
