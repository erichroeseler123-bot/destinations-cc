import assert from "node:assert/strict";
import { buildRecommendationShortlist } from "../lib/recommendationEngine";
import {
  evaluateRecommendation,
  type RecommendationInputs,
} from "../app/new-orleans/lib/tourRecommendationRules";

const cityInputs: RecommendationInputs = {
  planningWindow: "A first New Orleans experience",
  availableTime: "About 3 hours",
  transportation: "We need pickup or transportation",
  groupStyle: "Balanced",
  mixedAges: "Yes",
  airboatEligibility: "No known airboat restrictions",
  historicalInterest: "Some interest",
};

const city = evaluateRecommendation(cityInputs);
assert.equal(city.isNoFit, false, "first-visit city scenario should have a fit");
assert.equal(city.primary?.slug, "city-tour-of-new-orleans", "city overview should remain the first-visit primary");

const relaxedFamilyInputs: RecommendationInputs = {
  planningWindow: "Something for tomorrow",
  availableTime: "About half a day",
  transportation: "We need pickup or transportation",
  groupStyle: "Relaxed and comfortable",
  mixedAges: "Yes",
  airboatEligibility: "No known airboat restrictions",
  historicalInterest: "Not the priority",
};

const relaxedFamily = evaluateRecommendation(relaxedFamilyInputs, {
  period: "morning",
  rainRisk: "low",
  outdoorFriendly: true,
});
assert.equal(relaxedFamily.isNoFit, false, "relaxed family scenario should have a fit");
assert.equal(relaxedFamily.primary?.slug, "covered-tour-boat", "clear morning relaxed family should keep covered swamp boat first");

const restrictedAirboatInputs: RecommendationInputs = {
  planningWindow: "Something for tomorrow",
  availableTime: "About half a day",
  transportation: "We can drive ourselves",
  groupStyle: "Fast and adventurous",
  mixedAges: "No",
  airboatEligibility: "Child under 5 in the group",
  historicalInterest: "Not the priority",
};

const restrictedAirboat = evaluateRecommendation(restrictedAirboatInputs, {
  period: "morning",
  rainRisk: "low",
  outdoorFriendly: true,
});
const airboatSlugs = new Set([
  "ragin-cajun-airboat-options",
  "small-airboat-swamp-adventure",
  "large-airboat-swamp-adventure",
]);
assert.equal(
  restrictedAirboat.primary ? airboatSlugs.has(restrictedAirboat.primary.slug) : false,
  false,
  "airboat restrictions must keep airboat products out of the primary recommendation"
);

const repeated = evaluateRecommendation(cityInputs);
assert.deepEqual(repeated, city, "identical WNO inputs must remain deterministic");

const zeroLimit = buildRecommendationShortlist({
  candidates: [{ id: "one", score: 10 }],
  limit: 0,
  evaluate: (candidate) => ({
    key: candidate.id,
    score: candidate.score,
    exactMatch: true,
    reason: "test",
  }),
});
assert.deepEqual(zeroLimit.recommendations, [], "zero-length shortlists must stay empty");

console.log("WNO recommendation regression: PASS");
