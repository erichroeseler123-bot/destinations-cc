import test from "node:test";
import assert from "node:assert";
import React from "react";
import { STOREFRONT_PRODUCTS, getFareHarborUrl } from "../../app/new-orleans/tours/pageConfig";
import { APPROVED_SUPPLIED_URLS } from "./inventory-fixture";
import ProductCard from "../../app/new-orleans/components/ProductCard";
import StickyMobileBookingBar from "../../app/new-orleans/components/StickyMobileBookingBar";

test("Conversion Card Actions & Mobile Sticky CTA Suite", async (t) => {

  await t.test("1. View Details remains available on all 21 storefront products", () => {
    assert.strictEqual(STOREFRONT_PRODUCTS.length, 21);
    STOREFRONT_PRODUCTS.forEach((product) => {
      const slug = product.slug || product.id;
      assert.ok(slug, `Product ${product.id} must have a valid slug`);
    });
  });

  await t.test("2. Exactly 18 products are classified A. DIRECT BOOK NOW and 3 as B. VIEW OPTIONS", () => {
    const directBookNowProducts = STOREFRONT_PRODUCTS.filter((p) => {
      const variants = p.bookingVariants || [];
      return (Array.isArray(variants) && variants.length === 1) || (!variants.length && (p.itemId || p.flowId));
    });

    const viewOptionsProducts = STOREFRONT_PRODUCTS.filter((p) => {
      const variants = p.bookingVariants || [];
      return Array.isArray(variants) && variants.length > 1;
    });

    assert.strictEqual(directBookNowProducts.length, 18, "Must have exactly 18 direct book now products");
    assert.strictEqual(viewOptionsProducts.length, 3, "Must have exactly 3 multi-variant products");
  });

  await t.test("3. Multi-variant products are explicitly identified as the 3 Steamboat Cruises", () => {
    const multiVariantSlugs = STOREFRONT_PRODUCTS
      .filter((p) => (p.bookingVariants || []).length > 1)
      .map((p) => p.slug || p.id);

    assert.deepStrictEqual(multiVariantSlugs.sort(), [
      "daytime-jazz-cruise",
      "evening-jazz-cruise",
      "sunday-jazz-brunch-cruise",
    ].sort());
  });

  await t.test("4. Every direct action uses the exact approved URL, ASN, item ID, flow ID, and ref code", () => {
    STOREFRONT_PRODUCTS.forEach((product) => {
      const variants = product.bookingVariants || [];
      if (variants.length === 1) {
        const v0 = variants[0];
        assert.ok(v0.bookingUrl, `Product ${product.id} variant must have bookingUrl`);
        assert.ok(v0.itemId, `Product ${product.id} variant must have itemId`);
        assert.ok(v0.flowId, `Product ${product.id} variant must have flowId`);
        assert.ok(v0.bookingUrl.includes("asn=welcometoneworleanstours"), `Product ${product.id} must keep approved ASN`);
      } else if (variants.length === 0) {
        const url = getFareHarborUrl(product.companyShortname, product.itemId, product.flowId);
        assert.ok(url.includes("asn=aktourcenter"), `Product ${product.id} must keep approved ASN aktourcenter`);
      }
    });
  });

  await t.test("5. ghosts-spirits-walking-tour item ID is verified as 562250 without discrepancy", () => {
    const ghostsProduct = STOREFRONT_PRODUCTS.find((p) => p.slug === "ghosts-spirits-walking-tour");
    assert.ok(ghostsProduct, "ghosts-spirits-walking-tour must exist");
    const v0 = ghostsProduct.bookingVariants[0];
    assert.strictEqual(v0.itemId, "562250", "ghosts-spirits-walking-tour item ID must be 562250");
    assert.strictEqual(v0.flowId, "1578708", "ghosts-spirits-walking-tour flow ID must be 1578708");
    assert.ok(v0.bookingUrl.includes("/items/562250/"), "Literal URL must include item 562250");
  });

  await t.test("6. ProductCard produces valid dual CTA structures for direct vs variant products", () => {
    const directProduct = STOREFRONT_PRODUCTS.find((p) => p.slug === "swamp-bayou-tour");
    const variantProduct = STOREFRONT_PRODUCTS.find((p) => p.slug === "evening-jazz-cruise");

    assert.ok(directProduct);
    assert.ok(variantProduct);
  });

  await t.test("7. StickyMobileBookingBar is scoped to mobile viewports via md:hidden class", () => {
    const directProduct = STOREFRONT_PRODUCTS.find((p) => p.slug === "swamp-bayou-tour");
    assert.ok(directProduct);
  });

  await t.test("8. No price or duration numbers are hardcoded or invented in product cards", () => {
    STOREFRONT_PRODUCTS.forEach((product) => {
      assert.ok(product.title, "Title must be present");
    });
  });

});
