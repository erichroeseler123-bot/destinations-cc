import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";

import { COMMERCIAL_CATEGORY_PAGES } from "../../app/new-orleans/data/commercialCategoryPages";
import { CATEGORIES } from "../../app/new-orleans/data/categories";
import { getSeoPageBySlug } from "../../app/new-orleans/data/pageMap";
import { STOREFRONT_PRODUCTS } from "../../app/new-orleans/tours/pageConfig";
import { buildWtonotSitemapPaths } from "../../app/sitemap.xml/route";
import { getWtonotHostRewrite } from "../../proxy";

const PUBLIC_REVENUE_HUBS = ["riverboat-cruises", "ghost-tours", "food-tours"] as const;

function request(pathname: string) {
  return new NextRequest(`https://welcometoneworleanstours.com${pathname}`, {
    headers: {
      host: "welcometoneworleanstours.com",
      "x-forwarded-host": "welcometoneworleanstours.com",
    },
  });
}

test("WNO commercial category money layer", async (t) => {
  await t.test("public revenue hubs are live, indexable, routed and product-backed", () => {
    const liveIds = new Set(STOREFRONT_PRODUCTS.map((product) => product.id));

    for (const slug of PUBLIC_REVENUE_HUBS) {
      const page = getSeoPageBySlug(slug);
      assert.ok(page, `${slug} must resolve`);
      assert.strictEqual(page.status, "live", `${slug} must be live`);
      assert.strictEqual(page.isIndexable, true, `${slug} must be indexable`);
      assert.match(page.metadata?.robots || "", /index, follow/);
      assert.ok(page.liveProductIds.length > 0, `${slug} must expose bookable inventory`);
      for (const id of page.liveProductIds) {
        assert.ok(liveIds.has(id), `${slug} references unknown storefront product ${id}`);
      }

      const rewrite = getWtonotHostRewrite(request(`/${slug}`));
      assert.strictEqual(
        rewrite?.pathname,
        `/new-orleans/marketplace-category/${slug}`,
        `${slug} must route through the WNO marketplace category renderer`,
      );
    }
  });

  await t.test("food hub is truthful about currently confirmed cocktail inventory", () => {
    const food = COMMERCIAL_CATEGORY_PAGES["food-tours"];
    const slugs = food.liveProductIds
      .map((id) => STOREFRONT_PRODUCTS.find((product) => product.id === id)?.slug)
      .filter(Boolean)
      .sort();

    assert.deepStrictEqual(slugs, ["cocktail-walking-tour", "craft-cocktail-walking-tour"].sort());
    assert.match(food.openingAnswer || "", /currently bookable culinary inventory.*cocktail/i);
    assert.match(food.disclosure || "", /future food-tour and cooking-class inventory/i);
  });

  await t.test("river and ghost hubs expose the intended storefront products", () => {
    const riverIds = new Set(COMMERCIAL_CATEGORY_PAGES["riverboat-cruises"].liveProductIds);
    for (const slug of ["evening-jazz-cruise", "daytime-jazz-cruise", "sunday-jazz-brunch-cruise", "city-of-new-orleans-riverboat-cruise"]) {
      const product = STOREFRONT_PRODUCTS.find((candidate) => candidate.slug === slug);
      assert.ok(product, `${slug} must exist`);
      assert.ok(riverIds.has(product.id), `${slug} must appear on riverboat hub`);
    }

    const ghost = STOREFRONT_PRODUCTS.find((candidate) => candidate.slug === "ghosts-spirits-walking-tour");
    assert.ok(ghost);
    assert.deepStrictEqual(COMMERCIAL_CATEGORY_PAGES["ghost-tours"].liveProductIds, [ghost.id]);
  });

  await t.test("sitemap includes only router-safe commercial hubs", () => {
    const paths = buildWtonotSitemapPaths();
    for (const slug of PUBLIC_REVENUE_HUBS) {
      assert.ok(paths.includes(`/${slug}`), `${slug} must be in WNO sitemap`);
    }
    assert.ok(!paths.includes("/combo-tours"), "combo hub must stay out of sitemap until host routing is promoted");
  });

  await t.test("combo commercial record remains prepared but parked", () => {
    const combo = COMMERCIAL_CATEGORY_PAGES["combo-tours"];
    assert.ok(combo);
    assert.strictEqual(combo.status, "draft");
    assert.strictEqual(combo.isIndexable, false);
    assert.match(combo.metadata?.robots || "", /noindex, nofollow/);
    assert.match(combo.disclosure || "", /public `\/combo-tours` route remains parked/i);
  });

  await t.test("taxonomy and homepage agree with current public route truth", () => {
    for (const slug of PUBLIC_REVENUE_HUBS) {
      assert.strictEqual(CATEGORIES[slug]?.status, "live", `${slug} taxonomy must be live`);
    }
    assert.strictEqual(CATEGORIES["combo-tours"]?.status, "draft");

    const homepage = fs.readFileSync(path.join(process.cwd(), "app/new-orleans/page.tsx"), "utf8");
    assert.match(homepage, /href: "\/riverboat-cruises", label: "River Cruises"/);
    assert.match(homepage, /href: "\/food-tours", label: "Food & Cocktails"/);
    assert.match(homepage, /href: "\/ghost-tours", label: "Ghosts & Spirits"/);
    assert.match(homepage, /href: "\/tours#combo-tours", label: "Full-Day Combos"/);
    assert.doesNotMatch(homepage, /href: "\/combo-tours", label: "Full-Day Combos"/);
  });

  await t.test("marketplace category renderer carries visible breadcrumb structure", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "app/new-orleans/marketplace-category/[categorySlug]/page.tsx"),
      "utf8",
    );
    assert.match(source, /WnoBreadcrumbs/);
    assert.match(source, /name: "New Orleans Tours", path: "\/tours"/);
    assert.match(source, /name: record\.heroTitle, path: record\.publicRoute/);
  });
});
