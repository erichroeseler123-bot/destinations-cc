import assert from "node:assert";
import { describe, test } from "node:test";
import { buildRobotsTxt } from "../../app/robots.txt/route";
import { buildWtonotSitemapPaths } from "../../app/sitemap.xml/route";
import { buildPublicTourCatalog } from "../../app/new-orleans/guides/tour-catalog/data.json/route";
import { classifyWnoEntrySource } from "../../app/new-orleans/lib/trafficSource";
import { STOREFRONT_PRODUCTS } from "../../app/new-orleans/tours/pageConfig";

describe("WNO search and AI discovery", () => {
  test("WNO robots explicitly allows search/citation crawlers while preserving private-path blocks", () => {
    const robots = buildRobotsTxt("welcometoneworleanstours.com");

    assert.match(robots, /User-agent: OAI-SearchBot/);
    assert.match(robots, /User-agent: PerplexityBot/);
    assert.match(robots, /User-agent: Claude-SearchBot/);
    assert.match(robots, /User-agent: Claude-User/);
    assert.match(robots, /Sitemap: https:\/\/welcometoneworleanstours\.com\/sitemap\.xml/);

    for (const path of ["/admin/", "/api/", "/internal/", "/dashboard/", "/preview/"]) {
      const occurrences = robots.split(`Disallow: ${path}`).length - 1;
      assert.ok(occurrences >= 5, `${path} remains blocked for generic and explicit search crawler groups`);
    }
  });

  test("WNO sitemap exposes canonical commerce and machine-discovery surfaces only", () => {
    const paths = buildWtonotSitemapPaths();
    assert.ok(paths.includes("/guides/tour-catalog/data.json"));
    assert.ok(!paths.includes("/guides/tour-catalog.json"));

    const tourPaths = paths.filter((path) => path.startsWith("/tours/"));
    assert.strictEqual(tourPaths.length, STOREFRONT_PRODUCTS.length);

    for (const path of paths) {
      assert.ok(!path.startsWith("/new-orleans/"), `internal host-rewrite path leaked into sitemap: ${path}`);
    }
  });

  test("public tour catalog mirrors the complete live storefront registry", () => {
    const catalog = buildPublicTourCatalog();
    assert.strictEqual(catalog.products.length, STOREFRONT_PRODUCTS.length);
    assert.strictEqual(catalog.products.length, 21);
    assert.strictEqual(catalog.canonicalCatalogUrl, "https://welcometoneworleanstours.com/guides/tour-catalog/data.json");
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

  test("catalog exposes useful human-visible decision context", () => {
    const catalog = buildPublicTourCatalog();
    const cityTour = catalog.products.find((product) => product.slug === "city-tour-of-new-orleans");
    const airboat = catalog.products.find((product) => product.slug === "ragin-cajun-airboat-options");

    assert.ok(cityTour);
    assert.ok(cityTour.decisionContext.bestFit.length > 0);
    assert.ok(cityTour.decisionContext.notIdealFor.length > 0);
    assert.ok(airboat);
    assert.ok(airboat.decisionContext.childrenConsiderations.length > 0);
    assert.ok(airboat.decisionContext.physicalFormat);
  });

  test("catalog only exposes rights-cleared images", () => {
    for (const product of buildPublicTourCatalog().products) {
      if (product.image) {
        assert.strictEqual(product.image.rightsStatus, "approved");
        assert.ok(product.image.alt.length > 0);
      }
    }
  });

  test("entry attribution distinguishes major search and AI referrers without inventing Google AI attribution", () => {
    assert.strictEqual(
      classifyWnoEntrySource({ pathname: "/tours", utmSource: "chatgpt.com", referrer: "" }),
      "chatgpt-search",
    );
    assert.strictEqual(
      classifyWnoEntrySource({ pathname: "/tours", referrer: "https://www.perplexity.ai/search/example" }),
      "perplexity-search",
    );
    assert.strictEqual(
      classifyWnoEntrySource({ pathname: "/tours", referrer: "https://claude.ai/new" }),
      "claude-search",
    );
    assert.strictEqual(
      classifyWnoEntrySource({ pathname: "/tours", referrer: "https://www.google.com/search?q=new+orleans+tours" }),
      "google-search",
    );
    assert.strictEqual(
      classifyWnoEntrySource({ pathname: "/guides/first-time-new-orleans-tours", explicitSource: "homepage-planner" }),
      "homepage-planner",
    );
  });
});
