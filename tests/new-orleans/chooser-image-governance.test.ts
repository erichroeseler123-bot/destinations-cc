import test from "node:test";
import assert from "node:assert";
import {
  CHOOSER_CATEGORIES,
  getPreferencesForCategory,
  getRecommendation,
} from "../../app/new-orleans/help-me-choose/recommendationRules";
import { resolveProductImage } from "../../app/new-orleans/lib/imageResolver";
import {
  PRODUCT_IMAGE_REPLACEMENT_QUEUE,
  PRODUCT_IMAGES,
} from "../../app/new-orleans/data/imageRegistry";
import { OFFICIAL_TOUR_FACTS } from "../../app/new-orleans/data/officialTourFacts";
import { STOREFRONT_PRODUCTS } from "../../app/new-orleans/tours/pageConfig";

test("every chooser path resolves to live storefront inventory", () => {
  const liveIds = new Set(STOREFRONT_PRODUCTS.map((product) => product.id));

  for (const category of CHOOSER_CATEGORIES) {
    const preferences = getPreferencesForCategory(category.id);

    if (category.skipPreferences || preferences.length === 0) {
      const result = getRecommendation(category.id);
      assert.ok(result.primaryProductId, `${category.id} must resolve to a live primary product`);
      assert.ok(liveIds.has(result.primaryProductId), `${category.id} primary product must exist in storefront inventory`);
      assert.ok(!result.fallbackMessage, `${category.id} must not fall through to a placeholder fallback`);
      continue;
    }

    for (const preference of preferences) {
      const result = getRecommendation(category.id, preference.id);
      assert.ok(result.primaryProductId, `${category.id}/${preference.id} must resolve to a live primary product`);
      assert.ok(liveIds.has(result.primaryProductId), `${category.id}/${preference.id} primary product must exist in storefront inventory`);
      assert.ok(!result.fallbackMessage, `${category.id}/${preference.id} must not fall through to a placeholder fallback`);
    }
  }
});

test("known semantically misleading commerce images stay suppressed", () => {
  const blockedSlugs = [
    "cocktail-walking-tour",
    "craft-cocktail-walking-tour",
    "whitney-plantation-tour",
    "city-of-new-orleans-riverboat-cruise",
    "all-day-city-plantation-combo",
    "covered-boat-plantation-combo",
    "swamp-boat-oak-alley-combo",
    "swamp-boat-whitney-combo",
  ];

  assert.deepStrictEqual([...PRODUCT_IMAGE_REPLACEMENT_QUEUE].sort(), [...blockedSlugs].sort());

  for (const slug of blockedSlugs) {
    const product = STOREFRONT_PRODUCTS.find((candidate) => candidate.slug === slug);
    assert.ok(product, `${slug} must exist in storefront inventory`);
    assert.strictEqual(PRODUCT_IMAGES[slug], undefined, `${slug} must not retain a misleading registry assignment`);
    assert.strictEqual(
      resolveProductImage(product),
      null,
      `${slug} must remain text-only until an accurate approved commerce image is available`,
    );
  }
});

test("every displayed commerce image has explicit rights approval and useful alt text", () => {
  for (const product of STOREFRONT_PRODUCTS) {
    const resolved = resolveProductImage(product);
    if (!resolved) continue;

    assert.ok(resolved.src.startsWith("/images/"), `${product.slug} image must use a controlled local asset`);
    assert.ok(resolved.alt.trim().length >= 8, `${product.slug} image must have descriptive alt text`);
    assert.ok(
      resolved.source === "operator" || resolved.source === "wikimedia" || resolved.source === "local",
      `${product.slug} image must have an approved source type`,
    );
  }
});

test("operator-verified logistics cover high-traffic newer tour pages", () => {
  const expected = [
    "whitney-plantation-tour",
    "craft-cocktail-walking-tour",
    "ghosts-spirits-walking-tour",
    "city-cemetery-garden-district-tour",
    "swamp-bayou-tour",
    "small-airboat-swamp-adventure",
    "large-airboat-swamp-adventure",
  ];

  for (const slug of expected) {
    const product = STOREFRONT_PRODUCTS.find((candidate) => candidate.slug === slug);
    assert.ok(product, `${slug} must exist in storefront inventory`);
    const facts = OFFICIAL_TOUR_FACTS[slug];
    assert.ok(facts, `${slug} must have current operator logistics`);
    assert.ok(facts.duration.length > 2, `${slug} duration must be populated`);
    assert.ok(facts.transportation.length > 10, `${slug} transportation guidance must be populated`);
    assert.ok(facts.sourceLabel.includes("Gray Line"), `${slug} must identify its operator source`);
  }
});
