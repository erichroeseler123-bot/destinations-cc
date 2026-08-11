import assert from "node:assert";
import { describe, test } from "node:test";
import { buildRobotsTxt } from "../../app/robots.txt/route";
import { buildPublicTourCatalog } from "../../app/new-orleans/guides/tour-catalog.json/route";
import { STOREFRONT_PRODUCTS } from "../../app/new-orleans/tours/pageConfig";

describe("WNO search and AI discovery", () => {
  test("WNO robots explicitly allows search/citation crawlers while preserving private-path blocks", () => {
    const robots = buildRobotsTxt("welcometoneworleanstours.com");

    assert.match(robots, /User-agent: OAI-SearchBot/);
    assert.match(robots, /User-agent: PerplexityBot/);
    assert.match(robots, /Sitemap: https:\/\/welcometoneworleanstours\.com\/sitemap\.xml/);

    for (const path of ["/admin/", "/api/", "/internal/", "/dashboard/", "/preview/"]) {
      const occurrences = robots.split(`Disallow: ${path}`).length - 1;
      assert.ok(occurrences >= 3, `${path} remains blocked for generic and explicit search crawler groups`);
    }
  });

  test("public tour catalog mirrors the complete live storefront registry", () => {
    const catalog = buildPublicTourCatalog();
    assert.strictEqual(catalog.products.length, STOREFRONT_PRODUCTS.length);
    assert.strictEqual(catalog.products.length, 21);
  });

  test("catalog exposes canonical public identity without private commercial terms", () => {
    const serialized = JSON.stringify(buildPublicTourCatalog());

    assert.ok(!serialized.toLowerCase().includes("commission"));
    assert.ok(!serialized.toLowerCase().includes("secret"));
    assert.ok(!serialized.toLowerCase().includes("customer"));

    for (const product of buildPublicTourCatalog().products) {
      assert.ok(product.canonicalUrl.startsWith("https://welcometoneworleanstours.com/tours/"));
      assert.ok(product.operator.length > 0);
      assert.strictEqual(product.broker, "Welcome to New Orleans Tours");
      assert.strictEqual(product.bookingPlatform, "FareHarbor");
    }
  });

  test("catalog never exposes an image lacking verified rights", () => {
    for (const product of buildPublicTourCatalog().products) {
      if (product.image) {
        assert.strictEqual(product.image.rightsStatus, "approved");
        assert.ok(product.image.alt.length > 0);
      }
    }
  });
});
