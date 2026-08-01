import { STOREFRONT_PRODUCTS } from "../../app/new-orleans/tours/pageConfig";
import { test, describe } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { APPROVED_SUPPLIED_URLS } from "./inventory-fixture";

describe("New Orleans Inventory Integrity", () => {
  test("All products have 100% exact FareHarbor URLs for every variant with correct parameters", () => {
    const allVariants = STOREFRONT_PRODUCTS.flatMap(p =>
      (p.bookingVariants || []).map(v => ({ ...v, slug: p.slug }))
    );

    assert.strictEqual(allVariants.length, 25, "Exactly 25 Gray Line URLs");

    const itemIds = allVariants.map(v => v.itemId);
    assert.strictEqual(itemIds.length, 25, "Exactly 25 Gray Line item IDs");

    for (const approved of APPROVED_SUPPLIED_URLS) {
      const implemented = allVariants.find(v => v.slug === approved.slug && v.itemId === approved.itemId);
      assert.ok(implemented, `Implemented variant found for slug: ${approved.slug} with itemId: ${approved.itemId}`);
      assert.strictEqual(implemented.itemId, approved.itemId, `Item ID match for ${approved.label}`);
      assert.strictEqual(implemented.flowId, approved.flowId, `Flow ID match for ${approved.label}`);
      assert.strictEqual(implemented.bookingUrl, approved.url, `Exact URL match for ${approved.label}`);
    }
  });

  test("Exactly 15 Gray Line parent products and 21 total storefront products", () => {
    const grayLineProducts = STOREFRONT_PRODUCTS.filter(p => p.bookingVariants !== undefined);
    assert.strictEqual(grayLineProducts.length, 15, "Exactly 15 Gray Line parent products");
    assert.strictEqual(STOREFRONT_PRODUCTS.length, 21, "Exactly 21 total storefront products");
  });

  test("All 21 appear in or are discoverable through /tours", () => {
    const toursPagePath = path.join(process.cwd(), "app/new-orleans/tours/page.tsx");
    const toursPageContent = fs.readFileSync(toursPagePath, "utf8");
    assert.ok(toursPageContent.includes("STOREFRONT_PRODUCTS.map"), "Catalog loops over STOREFRONT_PRODUCTS to render all 21 items");
  });

  test("Every catalog slug resolves through the detail registry", () => {
    const slugs = STOREFRONT_PRODUCTS.map(p => p.slug);
    const uniqueSlugs = new Set(slugs);
    assert.strictEqual(slugs.length, uniqueSlugs.size, "No duplicate parent slugs");
    assert.ok(slugs.includes("evening-jazz-cruise")); // Check a known slug
  });

  test("Specific incorrect IDs are absent and corrected IDs are present", () => {
    const allVariants = STOREFRONT_PRODUCTS.flatMap(p => p.bookingVariants || []);
    const grayLineVariantIds = allVariants.map(v => v.itemId);

    // Explicitly assert corrected values
    const cityCemetery = allVariants.find(v => v.itemId === "564661");
    assert.ok(cityCemetery, "City/Cemetery/Garden District corrected item ID must be present");
    assert.strictEqual(cityCemetery.flowId, "1578708", "City/Cemetery/Garden District corrected flow ID must be present");

    const riverboat = allVariants.find(v => v.itemId === "694782");
    assert.ok(riverboat, "Riverboat corrected item ID must be present");
    assert.strictEqual(riverboat.flowId, "1621347", "Riverboat corrected flow ID must be present");

    // Explicitly ban incorrect values from Gray Line inventory
    assert.ok(!grayLineVariantIds.includes("562164"), "Incorrect item ID 562164 must be completely absent from Gray Line");
    assert.ok(!grayLineVariantIds.includes("562260"), "Incorrect item ID 562260 must be completely absent from Gray Line");
  });
});
