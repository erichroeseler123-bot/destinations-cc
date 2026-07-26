import test from "node:test";
import assert from "node:assert";
import {
  evaluateRecommendation,
  RecommendationInputs
} from "../../app/new-orleans/lib/tourRecommendationRules";

test("New Orleans Tour Recommendations", async (t) => {
  await t.test("Scenario A: City Tour of New Orleans", () => {
    const inputs: RecommendationInputs = {
      planningWindow: "A first New Orleans experience",
      availableTime: "About 3 hours",
      transportation: "We need pickup or transportation",
      groupStyle: "Balanced",
      mixedAges: "Yes",
      historicalInterest: "Some interest"
    };

    const result = evaluateRecommendation(inputs);
    assert.strictEqual(result.isNoFit, false);
    assert.strictEqual(result.primary?.slug, "city-tour-of-new-orleans");
  });

  await t.test("Scenario B: Covered Tour Boat", () => {
    const inputs: RecommendationInputs = {
      planningWindow: "Something for tomorrow",
      availableTime: "About half a day",
      transportation: "We need pickup or transportation",
      groupStyle: "Relaxed and comfortable",
      mixedAges: "Yes",
      historicalInterest: "Not the priority"
    };

    const result = evaluateRecommendation(inputs);
    assert.strictEqual(result.isNoFit, false);
    assert.strictEqual(result.primary?.slug, "covered-tour-boat");
  });

  await t.test("Scenario C: Airboat Options", () => {
    const inputs: RecommendationInputs = {
      planningWindow: "Something for tomorrow",
      availableTime: "About half a day",
      transportation: "We can drive ourselves",
      groupStyle: "Fast and adventurous",
      mixedAges: "No",
      historicalInterest: "Not the priority"
    };

    const result = evaluateRecommendation(inputs);
    assert.strictEqual(result.isNoFit, false);
    assert.strictEqual(result.primary?.slug, "ragin-cajun-airboat-options");
  });

  await t.test("Scenario D: Oak Alley or Laura Plantation Tour", () => {
    const inputs: RecommendationInputs = {
      // "later this trip" doesn't map perfectly to the 5 options, let's use a filler
      planningWindow: "Something for tomorrow",
      availableTime: "Most of the day",
      transportation: "Not sure",
      groupStyle: "Balanced",
      mixedAges: "No",
      historicalInterest: "Strong interest"
    };

    const result = evaluateRecommendation(inputs);
    assert.strictEqual(result.isNoFit, false);
    assert.strictEqual(result.primary?.slug, "oak-alley-or-laura-plantation-tour");
  });

  await t.test("Scenario E: Inputs incompatible with all current inventory (No strong fit)", () => {
    const inputs: RecommendationInputs = {
      planningWindow: "A first New Orleans experience",
      availableTime: "About 3 hours",
      transportation: "We need pickup or transportation",
      groupStyle: "Fast and adventurous",
      mixedAges: "Yes",
      historicalInterest: "Strong interest"
    };

    const result = evaluateRecommendation(inputs);
    assert.strictEqual(result.isNoFit, true);
    assert.strictEqual(result.primary, null);
  });

  await t.test("No secondary recommendation when alternative is incompatible", () => {
    // If available time is about 3 hours, plantation and swamp tours are incompatible.
    // Group style is relaxed, so airboat is incompatible.
    // Mixed ages yes.
    // Since it's relaxed, City Tour is eligible but wait, City Tour is balanced.
    // Is City tour eligible for "Relaxed"? Yes, it only gets excluded for "Fast and adventurous".
    const inputs: RecommendationInputs = {
      planningWindow: "Something for tomorrow",
      availableTime: "About 3 hours",
      transportation: "We need pickup or transportation",
      groupStyle: "Relaxed and comfortable",
      mixedAges: "Yes",
      historicalInterest: "Some interest"
    };

    const result = evaluateRecommendation(inputs);
    assert.strictEqual(result.isNoFit, false);
    assert.strictEqual(result.primary?.slug, "city-tour-of-new-orleans");
    // Since only City Tour is eligible (others take too long), there shouldn't be a secondary.
    assert.strictEqual(result.secondary, undefined);
  });

  await t.test("Deterministic output for identical input", () => {
    const inputs: RecommendationInputs = {
      planningWindow: "A first New Orleans experience",
      availableTime: "About 3 hours",
      transportation: "We need pickup or transportation",
      groupStyle: "Balanced",
      mixedAges: "Yes",
      historicalInterest: "Some interest"
    };

    const result1 = evaluateRecommendation(inputs);
    const result2 = evaluateRecommendation(inputs);

    assert.deepStrictEqual(result1, result2);
  });

});
