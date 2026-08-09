import test from "node:test";
import assert from "node:assert";
import {
  CHOOSER_CATEGORIES,
  getPreferencesForCategory,
  getRecommendation,
} from "../../app/new-orleans/help-me-choose/recommendationRules";
import { resolveProductImage } from "../../app/new-orleans/lib/imageResolver";
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

  for (const slug of blockedSlugs) {
    const product = STOREFRONT_PRODUCTS.find((candidate) => candidate.slug === slug);
    assert.ok(product, `${slug} must exist in storefront inventory`);
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
