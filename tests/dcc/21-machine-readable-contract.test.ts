import test from "node:test";
import assert from "node:assert/strict";
import { GET as getAgentManifest } from "@/app/agent.json/route";
import { GET as getLlms } from "@/app/llms.txt/route";
import {
  CANONICAL_CONTINUATION_FIELDS,
  getPublicCorridorContracts,
  getPublicOperatorIndexabilitySnapshot,
} from "@/lib/dcc/publicCorridorContract";
import {
  DECISION_PATTERNS,
  buildDecisionPatternExecutionUrl,
  getDecisionPatterns,
} from "@/lib/dcc/decisionPatterns";
import { getRootRouteGovernance } from "@/src/data/route-governance";
import { getSpecialPagesRouteGovernance } from "@/apps/special-pages/lib/route-governance";

test("public corridor contract stays canonical and unique", () => {
  const corridors = getPublicCorridorContracts();
  const patterns = getDecisionPatterns();
  const planningPaths = corridors.map((corridor) => corridor.planningPath);

  assert.equal(new Set(planningPaths).size, planningPaths.length);
  assert.equal(corridors.length, 4);
  assert.equal(corridors.length, patterns.length);

  for (const corridor of corridors) {
    assert.deepEqual(corridor.continuity.requiredFields, CANONICAL_CONTINUATION_FIELDS);
    assert.equal(corridor.noReask, true);
    assert.equal(corridor.continuity.defaultPolicy, "continue_without_reset");
  }
});

test("decision patterns build canonical execution handoff urls", () => {
  const url = buildDecisionPatternExecutionUrl(DECISION_PATTERNS.ARGO_SHUTTLE, {
    cta: "hero",
  });

  assert.match(url, /^https:\/\/shuttleya\.com\/book\/argo-shuttle\?/);
  assert.match(url, /decision_corridor=argo-day-transport/);
  assert.match(url, /decision_action=book_argo_shuttle/);
  assert.match(url, /decision_policy=continue_without_reset/);
});

test("operator apps do not expose acquisition-style routes as indexable", () => {
  const snapshot = getPublicOperatorIndexabilitySnapshot();

  for (const forbidden of [
    { owner: "shuttleya", path: "/denver-to-argo-shuttle" },
    { owner: "shuttleya", path: "/argo-shuttle-schedule" },
    { owner: "shuttleya", path: "/mighty-argo-cable-car-shuttle" },
    { owner: "420-airport-pickup", path: "/denver-airport-pickup" },
    { owner: "420-airport-pickup", path: "/420-friendly-airport-pickup" },
    { owner: "420-airport-pickup", path: "/airport-pickup-with-dispensary-stop" },
  ]) {
    const route = snapshot.find((entry) => entry.owner === forbidden.owner && entry.path === forbidden.path);
    assert.equal(route?.publishState, "live_unpromoted");
  }
});

test("primary corridor paths are not governed by more than one app", () => {
  const rootArgo = getRootRouteGovernance("/mighty-argo-shuttle");
  const specialPagesArgo = getSpecialPagesRouteGovernance("/mighty-argo-shuttle");

  assert.equal(rootArgo?.publishState, "indexable");
  assert.equal(specialPagesArgo, null);
});

test("agent.json exports only the canonical public corridor contract", async () => {
  const response = await getAgentManifest();
  const manifest = await response.json();

  assert.equal(Array.isArray(manifest.corridors), true);
  assert.equal(manifest.corridors.length, 4);
  assert.equal(manifest.canonicalPaths.includes("/mighty-argo-shuttle"), true);
  assert.equal(manifest.canonicalPaths.includes("/denver-to-argo-shuttle"), false);
});

test("llms.txt reflects canonical planning authority and excludes ghost routes", async () => {
  const response = await getLlms();
  const body = await response.text();

  assert.match(body, /canonical planning and decision authority/i);
  assert.match(body, /should not restart a completed decision/i);
  assert.doesNotMatch(body, /denver-to-argo-shuttle/);
  assert.doesNotMatch(body, /how-to-get-to-argo-cable-car-from-denver/);
});
