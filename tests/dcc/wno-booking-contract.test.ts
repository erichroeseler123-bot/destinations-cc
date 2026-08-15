import assert from "node:assert/strict";
import test from "node:test";

import { STOREFRONT_PRODUCTS, getFareHarborUrl } from "../../app/new-orleans/tours/pageConfig";
import {
  APPROVED_PRODUCT_SLUGS,
  getExpectedFareHarborAsn,
  normalizeFareHarborFallbackHref,
} from "../../app/new-orleans/lib/fareHarborAttribution";

test("WNO has exactly 21 approved parent experiences with unique detail slugs", () => {
  assert.equal(STOREFRONT_PRODUCTS.length, 21);
  assert.equal(APPROVED_PRODUCT_SLUGS.length, 21);

  const productSlugs = STOREFRONT_PRODUCTS.map((product) => product.slug);
  assert.equal(new Set(productSlugs).size, 21);
  assert.deepEqual(new Set(productSlugs), new Set(APPROVED_PRODUCT_SLUGS));
});

test("every WNO parent experience resolves to a governed FareHarbor booking target", () => {
  for (const product of STOREFRONT_PRODUCTS) {
    assert.ok(product.companyShortname, `${product.slug}: missing FareHarbor company shortname`);
    assert.ok(
      product.itemId || product.flowId || (product.bookingVariants && product.bookingVariants.length > 0),
      `${product.slug}: missing item, flow, or booking variants`,
    );

    const fallback = getFareHarborUrl(product.companyShortname, product.itemId, product.flowId);
    const normalized = normalizeFareHarborFallbackHref({
      href: fallback,
      shortname: product.companyShortname,
      requestedAsn: "aktourcenter",
    });
    const url = new URL(normalized);

    assert.ok(
      url.hostname === "fareharbor.com" || url.hostname === "www.fareharbor.com",
      `${product.slug}: booking target must stay on FareHarbor`,
    );
    assert.equal(
      url.searchParams.get("asn"),
      getExpectedFareHarborAsn(product.companyShortname, "aktourcenter"),
      `${product.slug}: wrong affiliate ASN`,
    );

    if (product.companyShortname === "neworleanssteamboatcompany") {
      assert.equal(url.searchParams.get("ref"), "WelcomeToNewOrleansTours", `${product.slug}: missing canonical steamboat ref`);
    }

    for (const variant of product.bookingVariants || []) {
      const variantUrl = new URL(variant.bookingUrl);
      assert.ok(
        variantUrl.hostname === "fareharbor.com" || variantUrl.hostname === "www.fareharbor.com",
        `${product.slug}/${variant.label}: variant target must stay on FareHarbor`,
      );
      assert.ok(variant.itemId || variant.flowId, `${product.slug}/${variant.label}: variant needs item or flow`);
    }
  }
});
