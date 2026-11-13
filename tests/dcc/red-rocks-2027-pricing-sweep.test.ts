import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PARR_OPERATOR } from "@/lib/parrOperator";
import { getDccSiteTruth } from "@/lib/dcc/siteTruth";
import {
  RED_ROCKS_VENUE_FACTS,
  evaluateRedRocksRidePlan,
  RED_ROCKS_MIKE_NOV_14_SHOW,
  buildRedRocksStayingPlace,
  RED_ROCKS_STAYING_PRESETS,
} from "@/lib/dcc/redRocksRidePlanner";
import { RED_ROCKS_CONCERT_DECISION_ENGINE } from "@/lib/dcc/decisionEngines/redRocksConcertTransportationEngine";
import { resolveLlmsTxtByRegionOrNodeSlug } from "@/lib/dcc/llmsManifest";

const ROOT = path.resolve(process.cwd());

const RED_ROCKS_FILES_TO_SWEEP = [
  "app/red-rocks/page.tsx",
  "app/private-vs-shared-shuttles-to-red-rocks-denver-guide/page.tsx",
  "app/components/dcc/RedRocksAuthorityPage.tsx",
  "app/components/dcc/RedRocksConcertRidePlanner.tsx",
  "app/components/dcc/ContextualSpecialistReturnBanner.tsx",
  "lib/parrOperator.ts",
  "lib/dcc/siteTruth.ts",
  "lib/dcc/llmsManifest.ts",
  "lib/dcc/redRocksRidePlanner.ts",
  "lib/dcc/decisionEngines/redRocksConcertTransportationEngine.ts",
];

test("DCC Red Rocks canonical pricing records use $499 Suburban and $699 Van", () => {
  assert.equal(RED_ROCKS_VENUE_FACTS.parrSuburbanPriceUsd, 499);
  assert.equal(RED_ROCKS_VENUE_FACTS.parrVanPriceUsd, 699);
  const parrSerialized = JSON.stringify(PARR_OPERATOR);
  assert.match(parrSerialized, /\$499/);
  assert.match(parrSerialized, /\$699/);
  const parrTruth = getDccSiteTruth("party-at-red-rocks");
  assert.equal(parrTruth?.public_claims?.suburban_usd, 499);
  assert.equal(parrTruth?.public_claims?.van_usd, 699);

  const staying = buildRedRocksStayingPlace({
    ...RED_ROCKS_STAYING_PRESETS[1],
    source: "preset",
  });

  const planSuburban = evaluateRedRocksRidePlan({
    show: RED_ROCKS_MIKE_NOV_14_SHOW,
    staying,
    partySize: 4,
  });
  assert.equal(planSuburban.parrRecommendation.publishedPriceUsd, 499);

  const planVan = evaluateRedRocksRidePlan({
    show: RED_ROCKS_MIKE_NOV_14_SHOW,
    staying,
    partySize: 8,
  });
  assert.equal(planVan.parrRecommendation.publishedPriceUsd, 699);

  const llms = resolveLlmsTxtByRegionOrNodeSlug("red-rocks") || "";
  assert.match(llms, /\$499/);
  assert.match(llms, /\$699/);
  assert.doesNotMatch(llms, /\$399|\$599/);

  assert.match(RED_ROCKS_CONCERT_DECISION_ENGINE.heroQuestion, /\$499/);
  assert.match(RED_ROCKS_CONCERT_DECISION_ENGINE.heroQuestion, /\$699/);
});

test("no stale $399 or $599 PARR pricing remains in DCC Red Rocks surfaces or planners", () => {
  const violations: string[] = [];
  for (const rel of RED_ROCKS_FILES_TO_SWEEP) {
    const full = path.join(ROOT, rel);
    const lines = fs.readFileSync(full, "utf8").split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (/\$(399|599)\b/.test(line)) {
        violations.push(`${rel}:${idx + 1}: ${line.trim()}`);
      }
    });
  }
  assert.deepEqual(
    violations,
    [],
    `Found stale $399/$599 PARR pricing in DCC Red Rocks files:\n${violations.join("\n")}`
  );
});
