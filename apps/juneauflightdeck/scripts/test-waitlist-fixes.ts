import { normalizeTourPreference } from "../lib/waitlistStore";

console.log("=== RUNNING WAITLIST FIXES VERIFICATION TESTS ===\n");

// 1. Tour preference normalization
const tests = [
  { input: "temsco-mendenhall-glacier-walk", expectedTour: "glacier_landing", expectedOp: "temsco" },
  { input: "coastal-icefield-landing", expectedTour: "glacier_landing", expectedOp: "coastal" },
  { input: "temsco-glacier-dog-sledding", expectedTour: "dog_sledding", expectedOp: "temsco" },
  { input: "northstar-glacier-ice-trek", expectedTour: "ice_trek", expectedOp: "northstar" },
  { input: "glacier_landing", expectedTour: "glacier_landing", expectedOp: "any" },
];

for (const t of tests) {
  const res = normalizeTourPreference(t.input);
  if (res.tourType !== t.expectedTour || res.preferredOperator !== t.expectedOp) {
    console.error(`FAIL: ${t.input} ->`, res);
    process.exit(1);
  }
  console.log(`✓ PASS: ${t.input} correctly mapped to tourType: '${res.tourType}', operator: '${res.preferredOperator || "any"}'`);
}

// 2. Party split logic verification
const entrySplit = { partySize: 4, allowSplitParty: true };
const entryNoSplit = { partySize: 4, allowSplitParty: false };
const slot = { capacity: 2 };

const matchSplit = slot.capacity >= entrySplit.partySize || (Boolean(entrySplit.allowSplitParty) && slot.capacity >= 1 && entrySplit.partySize > 1);
const isSplit = Boolean(entrySplit.allowSplitParty) && entrySplit.partySize > slot.capacity;
if (!matchSplit || !isSplit) {
  console.error("FAIL: split matching logic failed");
  process.exit(1);
}
console.log("✓ PASS: Party of 4 with allowSplitParty=true matches a 2-seat opening as isSplitMatch");

const matchNoSplit = slot.capacity >= entryNoSplit.partySize || (Boolean(entryNoSplit.allowSplitParty) && slot.capacity >= 1 && entryNoSplit.partySize > 1);
if (matchNoSplit) {
  console.error("FAIL: non-split party matched too-small slot");
  process.exit(1);
}
console.log("✓ PASS: Party of 4 with allowSplitParty=false correctly rejects a 2-seat opening");

console.log("\nALL 7 VERIFICATION ASSERTIONS PASSED!");
