import { analyzeHelicopterPayload, PILOT_WEIGHT_LBS, MAX_PAX_PAYLOAD_LBS, DEFAULT_6_PAX_SEATS } from "../lib/payloadMath.ts";

function runTests() {
  console.log("=== RUNNING JUNEAU FLIGHT DECK MATH ENGINE TESTS ===\n");
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${message}`);
      process.exitCode = 1;
    }
  }

  // 1. Standard Light Group
  const party1 = [
    { id: 1, seatLabel: "S1", weightLbs: 180, row: "front", position: "left" },
    { id: 2, seatLabel: "S2", weightLbs: 160, row: "front", position: "center" },
    { id: 3, seatLabel: "S3", weightLbs: 140, row: "rear", position: "left" },
  ];
  const r1 = analyzeHelicopterPayload(party1);
  assert(r1.totalPassengerWeight === 480, "Party 1 total passenger weight equals 480 lbs");
  assert(r1.totalGrossPayload === 480 + PILOT_WEIGHT_LBS, "Party 1 gross payload includes 200 lb pilot");
  assert(r1.hasSurcharge === false, "Party 1 has no 250lb surcharge");
  assert(r1.payloadStatus === "safe", "Party 1 status is safe");
  assert(r1.sixthSeatProbability === "not-applicable", "Party 1 (<5 pax) is not-applicable for 6th seat");

  // 2. Individual 250lb Surcharge Sentinel
  const party2 = [
    { id: 1, seatLabel: "S1", weightLbs: 260, row: "front", position: "left" },
    { id: 2, seatLabel: "S2", weightLbs: 180, row: "front", position: "center" },
  ];
  const r2 = analyzeHelicopterPayload(party2);
  assert(r2.hasSurcharge === true, "Party 2 flags individual surcharge");
  assert(r2.surchargeCount === 1, "Party 2 has exactly 1 surcharge");
  assert(r2.strategyRecommendation.includes("Surcharge Notice"), "Party 2 includes comfort surcharge notice");

  // 3. Overweight Structural Exceedance
  const party3 = [
    { id: 1, seatLabel: "S1", weightLbs: 220, row: "front", position: "left" },
    { id: 2, seatLabel: "S2", weightLbs: 210, row: "front", position: "center" },
    { id: 3, seatLabel: "S3", weightLbs: 210, row: "rear", position: "left" },
    { id: 4, seatLabel: "S4", weightLbs: 200, row: "rear", position: "center" },
    { id: 5, seatLabel: "S5", weightLbs: 190, row: "rear", position: "center" },
  ]; // Total = 1,030 lbs (> 1,020 max)
  const r3 = analyzeHelicopterPayload(party3);
  assert(r3.totalPassengerWeight === 1030, "Party 3 totals 1,030 lbs");
  assert(r3.payloadStatus === "overweight", "Party 3 is classified as overweight");
  assert(r3.strategyRecommendation.includes("exceeds single-aircraft safety margins"), "Party 3 advises splitting party across dual departures");

  // 4. Light 6-Person Group (High 6th-Seat Unlock)
  const party4 = [
    { id: 1, seatLabel: "S1", weightLbs: 140, row: "front", position: "left" },
    { id: 2, seatLabel: "S2", weightLbs: 130, row: "front", position: "center" },
    { id: 3, seatLabel: "S3", weightLbs: 155, row: "rear", position: "left" },
    { id: 4, seatLabel: "S4", weightLbs: 125, row: "rear", position: "center" },
    { id: 5, seatLabel: "S5", weightLbs: 160, row: "rear", position: "center" },
    { id: 6, seatLabel: "S6", weightLbs: 145, row: "rear", position: "right" },
  ]; // Total = 855 lbs (<= 900 lbs)
  const r4 = analyzeHelicopterPayload(party4);
  assert(r4.totalPassengerWeight === 855, "Party 4 totals 855 lbs");
  assert(r4.sixthSeatProbability === "high", "Party 4 has HIGH 6th-seat unlock probability");
  assert(r4.sixthSeatPercent >= 75, "Party 4 6th-seat probability is >= 75%");
  assert(r4.strategyRecommendation.includes("High Unlock Probability"), "Party 4 contains high unlock dispatch override recommendation");

  // 5. Center of Gravity Balance Math
  assert(typeof r1.cgBalance.lateralOffsetPercent === "number", "CG lateral offset is numeric");
  assert(typeof r1.cgBalance.longitudinalOffsetPercent === "number", "CG longitudinal offset is numeric");
  assert(r1.cgBalance.status === "slight-deviation", "Left-heavy 3-person group has slight-deviation CG status");
  
  const defaultBalanced = analyzeHelicopterPayload(DEFAULT_6_PAX_SEATS);
  assert(defaultBalanced.cgBalance.status === "balanced", "Evenly distributed 6-seat group has balanced CG status");

  console.log(`\nResults: ${passed}/${total} assertions passed.`);
}

runTests();
