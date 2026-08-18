import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("WNO completion gates", async (t) => {
  await t.test("all storefront intelligence records enter the governed v2 graph", () => {
    const intelligence = read("app/new-orleans/data/tourIntelligence.ts");
    const governance = read("app/new-orleans/data/experienceGraphGovernance.ts");

    const storefrontSlugs = [...intelligence.matchAll(/^  \"([^\"]+)\":/gm)].map((match) => match[1]);
    assert.equal(storefrontSlugs.length, 21, `Expected 21 governed storefront intelligence records, found ${storefrontSlugs.length}`);

    assert.ok(governance.includes("Object.keys(TOUR_INTELLIGENCE)"));
    assert.ok(governance.includes("WNO_EXPERIENCE_GRAPH_V2[slug] || unverifiedShell(slug)"));
    assert.ok(governance.includes('verificationStatus: "NEEDS_VERIFICATION"'));
    assert.ok(governance.includes('source: "unknown"'));
    assert.ok(governance.includes('confidence: "unverified"'));
  });

  await t.test("airboat operator restrictions are hard exclusions before scoring", () => {
    const rules = read("app/new-orleans/lib/tourRecommendationRules.ts");
    const chooser = read("app/new-orleans/components/NewOrleansRecommendationFlow.tsx");
    const telemetry = read("app/api/wno/telemetry/route.ts");

    assert.ok(rules.includes("const AIRBOAT_SLUGS"));
    assert.ok(rules.includes("const airboatEligible = inputs.airboatEligibility === \"No known airboat restrictions\""));
    assert.ok(rules.includes("if (AIRBOAT_SLUGS.has(product.slug) && !airboatEligible) eligible = false;"));

    assert.ok(chooser.includes('"airboatEligibility"'));
    assert.ok(chooser.includes('"Child under 5 in the group"'));
    assert.ok(chooser.includes('"Pregnancy in the group"'));
    assert.ok(chooser.includes('"Neck or back condition in the group"'));

    assert.ok(telemetry.includes("airboatEligibility: clean(value.airboatEligibility"));
    assert.ok(telemetry.includes("airboat_eligibility: clean(body.airboatEligibility"));
  });
});
