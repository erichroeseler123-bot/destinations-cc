import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateDeterministicMatch,
  calculateReturnRisk,
  explainMatch,
  type MatchScoreComponent,
} from "../../src/lib/dcc/decision-contracts";

test("return risk is deterministic and becomes NOT_RECOMMENDED when safeguards consume the window", () => {
  const risk = calculateReturnRisk({
    shipDeparture: "2026-08-14T17:00:00-04:00",
    planEnd: "2026-08-14T15:40:00-04:00",
    requiredBufferMinutes: 60,
    estimatedReturnTravelMinutes: 25,
    uncertaintyMinutes: 15,
    activityDurationMinutes: 180,
  });

  assert.equal(risk.returnBufferMinutes, -20);
  assert.equal(risk.status, "NOT_RECOMMENDED");
  assert.equal(risk.rulesVersion, "return-risk-v1");
});

test("commercial payment can never contribute match points", () => {
  const components: MatchScoreComponent[] = [
    {
      id: "window-fit",
      label: "Window fit",
      pointsAwarded: 30,
      pointsAvailable: 30,
      explanation: "Available for the requested window.",
    },
    {
      id: "capacity-fit",
      label: "Capacity fit",
      pointsAwarded: 20,
      pointsAvailable: 20,
      explanation: "Vehicle seats the requested party.",
    },
    {
      id: "preference-fit",
      label: "Preference fit",
      pointsAwarded: 18,
      pointsAvailable: 20,
      explanation: "Service matches the requested beach and viewpoint intent.",
    },
    {
      id: "proximity",
      label: "Proximity",
      pointsAwarded: 14,
      pointsAvailable: 15,
      explanation: "Operator is near the requested pickup point.",
    },
    {
      id: "trust",
      label: "Trust",
      pointsAwarded: 10,
      pointsAvailable: 10,
      explanation: "Required verification evidence is present.",
    },
    {
      id: "response-reliability",
      label: "Response reliability",
      pointsAwarded: 5,
      pointsAvailable: 5,
      explanation: "Operator has reliable response history.",
    },
  ];

  const match = calculateDeterministicMatch({
    subjectId: "vibe/example-operator",
    hardGates: [
      { id: "licensed", label: "Licensed", passed: true },
      { id: "capacity", label: "Capacity", passed: true },
      { id: "availability", label: "Availability", passed: true },
      { id: "service-area", label: "Service area", passed: true },
    ],
    components,
  });

  assert.equal(match.eligible, true);
  assert.equal(match.fitScore, 97);
  assert.equal(match.commercialInfluencePoints, 0);
});

test("a failed hard gate makes a provider ineligible regardless of score", () => {
  const match = calculateDeterministicMatch({
    subjectId: "vibe/unlicensed-example",
    hardGates: [{ id: "licensed", label: "Licensed", passed: false }],
    components: [
      {
        id: "everything-else",
        label: "Everything else",
        pointsAwarded: 100,
        pointsAvailable: 100,
        explanation: "All soft-fit criteria are perfect.",
      },
    ],
  });

  assert.equal(match.eligible, false);
  assert.equal(match.fitScore, null);
  assert.equal(match.commercialInfluencePoints, 0);
});

test("WHY THIS explanation is generated from deterministic decision output", () => {
  const match = calculateDeterministicMatch({
    subjectId: "vibe/example-operator",
    hardGates: [{ id: "licensed", label: "Licensed", passed: true }],
    components: [
      {
        id: "window-fit",
        label: "Window fit",
        pointsAwarded: 30,
        pointsAvailable: 30,
        explanation: "Available during the requested port window.",
      },
    ],
  });

  const explanation = explainMatch(match);
  assert.equal(explanation.title, "WHY THIS");
  assert.equal(explanation.generatedFromDecision, true);
  assert.match(explanation.summary, /100% deterministic fit/);
  assert.deepEqual(explanation.reasons, ["Available during the requested port window."]);
});
