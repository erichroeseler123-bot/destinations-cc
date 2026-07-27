import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { STOREFRONT_PRODUCTS } from "../../app/new-orleans/tours/pageConfig";
import {
  CategoryId,
  getRecommendation,
  PreferenceId,
} from "../../app/new-orleans/help-me-choose/recommendationRules";

const originalProductMappings = [
  ["city-tour-of-new-orleans", "southernstyletours", "51942", "4344"],
  ["oak-alley-or-laura-plantation-tour", "southernstyletours", "83002", "4344"],
  ["covered-tour-boat", "ragincajuntours", "590176", "392449"],
  ["ragin-cajun-airboat-options", "ragincajuntours", undefined, "940162"],
] as const;

test("New Orleans combo-tour routes and catalog", async (t) => {
  await t.test("the shared detail route can render both approved combo slugs", () => {
    const approvedComboSlugs = [
      "all-day-city-plantation-combo",
      "covered-boat-plantation-combo",
    ];
    const configuredSlugs = STOREFRONT_PRODUCTS.map((product) => product.slug);

    for (const slug of approvedComboSlugs) {
      assert.ok(configuredSlugs.includes(slug), `${slug} must be registered`);
    }

    const detailRoutePath = path.join(
      process.cwd(),
      "app",
      "new-orleans",
      "tours",
      "[slug]",
      "page.tsx",
    );
    const detailRoute = fs.readFileSync(detailRoutePath, "utf8");
    assert.ok(
      detailRoute.includes("STOREFRONT_PRODUCTS.find((p) => p.slug === slug)"),
      "dynamic tour route must resolve registered products by slug",
    );
  });

  await t.test("the compact catalog contains the six approved products without duplicates", () => {
    const ids = STOREFRONT_PRODUCTS.map((product) => product.id);
    const slugs = STOREFRONT_PRODUCTS.map((product) => product.slug);
    const approvedIds = [
      "southernstyle-city-tour",
      "southernstyle-plantation",
      "ragincajun-covered-boat",
      "ragincajun-airboat",
      "southernstyle-city-plantation-combo",
      "ragincajun-covered-plantation-combo",
    ];

    for (const id of approvedIds) {
      assert.ok(ids.includes(id), `${id} must be present`);
    }
    assert.strictEqual(
      ids.filter((id) => id === "southernstyle-city-plantation-combo").length,
      1,
    );
    assert.strictEqual(
      ids.filter((id) => id === "ragincajun-covered-plantation-combo").length,
      1,
    );
    assert.strictEqual(new Set(ids).size, ids.length, "product IDs must be unique");
    assert.strictEqual(new Set(slugs).size, slugs.length, "product slugs must be unique");
    assert.ok(!ids.includes("228439"), "gift card must not appear");
    assert.ok(!ids.includes("732308"), "duplicate item must not appear");
    assert.ok(!STOREFRONT_PRODUCTS.some((product) => product.itemId === "228439"));
    assert.ok(!STOREFRONT_PRODUCTS.some((product) => product.itemId === "732308"));

    const catalogPath = path.join(
      process.cwd(),
      "app",
      "new-orleans",
      "tours",
      "OutpostConsole.tsx",
    );
    const catalog = fs.readFileSync(catalogPath, "utf8");
    assert.ok(catalog.includes("'southernstyle-city-plantation-combo'"));
    assert.ok(catalog.includes("'ragincajun-covered-plantation-combo'"));
    assert.ok(catalog.includes("Six Live Tour Options"));
  });

  await t.test("combo records cannot enter either recommendation system", () => {
    const rulesPath = path.join(
      process.cwd(),
      "app",
      "new-orleans",
      "lib",
      "tourRecommendationRules.ts",
    );
    const rulesSource = fs.readFileSync(rulesPath, "utf8");
    const evaluatorSource = rulesSource.slice(
      rulesSource.indexOf("export function evaluateRecommendation"),
    );
    const existingCandidateOrder = [
      "city-tour-of-new-orleans",
      "oak-alley-or-laura-plantation-tour",
      "covered-tour-boat",
      "ragin-cajun-airboat-options",
    ];

    let previousIndex = -1;
    for (const slug of existingCandidateOrder) {
      const candidateIndex = evaluatorSource.indexOf(`slug: "${slug}"`);
      assert.ok(candidateIndex > previousIndex, `${slug} must retain its scoring order`);
      previousIndex = candidateIndex;
    }
    assert.ok(!evaluatorSource.includes("all-day-city-plantation-combo"));
    assert.ok(!evaluatorSource.includes("covered-boat-plantation-combo"));

    const chooserCases: Array<{
      category: CategoryId;
      preference?: PreferenceId;
      primary?: string;
      alternatives?: string[];
      recommendedValue: string;
    }> = [
      {
        category: "city-highlights",
        primary: "southernstyle-city-tour",
        recommendedValue: "city-highlights",
      },
      {
        category: "plantations-history",
        primary: "southernstyle-plantation",
        recommendedValue: "plantations-history",
      },
      {
        category: "swamp-airboat",
        preference: "swamp-calm",
        primary: "ragincajun-covered-boat",
        alternatives: ["ragincajun-airboat"],
        recommendedValue: "swamp-calm",
      },
      {
        category: "swamp-airboat",
        preference: "swamp-active",
        primary: "ragincajun-airboat",
        alternatives: ["ragincajun-covered-boat"],
        recommendedValue: "swamp-active",
      },
    ];

    for (const chooserCase of chooserCases) {
      const recommendation = getRecommendation(
        chooserCase.category,
        chooserCase.preference,
      );
      assert.strictEqual(recommendation.primaryProductId, chooserCase.primary);
      assert.deepStrictEqual(
        recommendation.alternativeProductIds,
        chooserCase.alternatives,
      );
      assert.ok(
        !recommendation.primaryProductId?.includes("combo"),
        "a combo cannot be a primary chooser recommendation",
      );
      assert.ok(
        !recommendation.alternativeProductIds?.some((id) => id.includes("combo")),
        "a combo cannot be a secondary chooser recommendation",
      );
      assert.strictEqual(
        chooserCase.preference || chooserCase.category,
        chooserCase.recommendedValue,
      );
    }

    const chooserPath = path.join(
      process.cwd(),
      "app",
      "new-orleans",
      "components",
      "NewOrleansChooser.tsx",
    );
    const chooserSource = fs.readFileSync(chooserPath, "utf8");
    assert.ok(
      chooserSource.includes(
        "router.push(`/tours/${product.slug}?recommended=${contextId}`)",
      ),
      "recommended= must continue to use the existing chooser context ID",
    );
  });

  await t.test("the original four FareHarbor mappings remain unchanged", () => {
    for (const [slug, shortname, itemId, flowId] of originalProductMappings) {
      const product = STOREFRONT_PRODUCTS.find((candidate) => candidate.slug === slug);
      assert.ok(product, `${slug} must remain configured`);
      assert.strictEqual(product.companyShortname, shortname);
      assert.strictEqual(product.itemId, itemId);
      assert.strictEqual(product.flowId, flowId);
    }
  });

  await t.test("desktop overlay and full-page fallback behavior remain wired", () => {
    const bookingButtonPath = path.join(
      process.cwd(),
      "app",
      "new-orleans",
      "components",
      "FareHarborBookingButton.tsx",
    );
    const bookingButton = fs.readFileSync(bookingButtonPath, "utf8");

    assert.ok(bookingButton.includes("window.FH.open(fhOptions)"));
    assert.ok(bookingButton.includes("e.preventDefault()"));
    assert.ok(
      bookingButton.includes("we do NOT preventDefault here, allowing normal href navigation"),
    );
    assert.ok(bookingButton.includes("href={fallbackHref}"));
  });
});
