import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { TOUR_DECISION_COPY } from "../../app/new-orleans/data/tourDecisionCopy";
import { STOREFRONT_PRODUCTS } from "../../app/new-orleans/tours/pageConfig";

const REQUIRED_GUIDANCE_SLUGS = [
  "evening-jazz-cruise",
  "daytime-jazz-cruise",
  "sunday-jazz-brunch-cruise",
  "oak-alley-plantation-tour-grey-line",
  "whitney-plantation-tour",
  "swamp-bayou-tour",
  "small-airboat-swamp-adventure",
  "large-airboat-swamp-adventure",
  "swamp-boat-oak-alley-combo",
  "swamp-boat-whitney-combo",
  "cocktail-walking-tour",
  "craft-cocktail-walking-tour",
  "ghosts-spirits-walking-tour",
  "city-cemetery-garden-district-tour",
  "city-of-new-orleans-riverboat-cruise",
] as const;

test("newer New Orleans inventory has concrete decision guidance", () => {
  const productSlugs = new Set(STOREFRONT_PRODUCTS.map((product) => product.slug));

  for (const slug of REQUIRED_GUIDANCE_SLUGS) {
    assert.ok(productSlugs.has(slug), `missing storefront product ${slug}`);
    const copy = TOUR_DECISION_COPY[slug];
    assert.ok(copy, `missing decision copy for ${slug}`);
    assert.ok(copy.bestFit.length >= 2, `${slug} needs at least two best-fit points`);
    assert.ok(copy.notIdealFor.length >= 2, `${slug} needs at least two not-ideal points`);
    assert.ok(copy.childrenConsiderations.length >= 1, `${slug} needs child/group guidance`);
  }
});

test("decision guidance does not use the old generic suitability placeholders", () => {
  const serialized = JSON.stringify(TOUR_DECISION_COPY);
  assert.ok(!serialized.includes("Suitable for most visitors"));
  assert.ok(!serialized.includes("Review accessibility and requirements in checkout"));
});

test("tour detail page uses governed copy before generic fallbacks", () => {
  const page = fs.readFileSync(
    path.join(process.cwd(), "app/new-orleans/tours/[slug]/page.tsx"),
    "utf8",
  );
  assert.match(page, /TOUR_DECISION_COPY\[product\.slug\]/);
  assert.match(page, /product\.bestFit\?\.length \? product\.bestFit : decisionCopy\?\.bestFit/);
  assert.match(page, /product\.notIdealFor\?\.length \? product\.notIdealFor : decisionCopy\?\.notIdealFor/);
  assert.ok(!page.includes("Suitable for most visitors."));
  assert.ok(!page.includes("Review accessibility and requirements in checkout."));
});
