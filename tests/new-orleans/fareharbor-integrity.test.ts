import test from "node:test";
import assert from "node:assert";
import { STOREFRONT_PRODUCTS, getFareHarborUrl } from "../../app/new-orleans/tours/pageConfig";
import { APPROVED_SUPPLIED_URLS } from "./inventory-fixture";

const expectedAsnForShortname = (shortname: string) =>
  shortname === "neworleanssteamboatcompany"
    ? "welcometoneworleanstours"
    : "aktourcenter";

function assertFareHarborUrl({
  url,
  shortname,
  itemId,
  flowId,
}: {
  url: string;
  shortname: string;
  itemId?: string | number;
  flowId?: string | number;
}) {
  const parsed = new URL(url);
  assert.strictEqual(parsed.hostname, "fareharbor.com");
  assert.ok(
    parsed.pathname.startsWith(`/embeds/book/${shortname}/`),
    `${url} must preserve operator shortname ${shortname}`,
  );
  if (itemId) {
    assert.ok(parsed.pathname.includes(`/items/${itemId}/`), `${url} must preserve itemId ${itemId}`);
  }
  if (flowId) {
    assert.strictEqual(parsed.searchParams.get("flow"), String(flowId), `${url} must preserve flow ${flowId}`);
  }
  assert.strictEqual(
    parsed.searchParams.get("asn"),
    expectedAsnForShortname(shortname),
    `${url} must preserve the approved ASN for ${shortname}`,
  );
  assert.strictEqual(parsed.searchParams.get("full-items"), "yes", `${url} must preserve full-items=yes`);
}

test("FareHarbor Product Identities and Links", async (t) => {
  const getProduct = (slug: string) => STOREFRONT_PRODUCTS.find(p => p.slug === slug);

  await t.test("City Tour Of New Orleans", () => {
    const product = getProduct("city-tour-of-new-orleans");
    assert.ok(product, "Product should exist");
    assert.strictEqual(product.itemId, "51942");
    assert.strictEqual(product.flowId, "4344");
    const url = getFareHarborUrl(product.companyShortname, product.itemId, product.flowId);
    assert.strictEqual(url, "https://fareharbor.com/embeds/book/southernstyletours/items/51942/?asn=aktourcenter&flow=4344&full-items=yes");
  });

  await t.test("Oak Alley Or Laura Plantation Tour", () => {
    const product = getProduct("oak-alley-or-laura-plantation-tour");
    assert.ok(product, "Product should exist");
    assert.strictEqual(product.itemId, "83002");
    assert.strictEqual(product.flowId, "4344");
    const url = getFareHarborUrl(product.companyShortname, product.itemId, product.flowId);
    assert.strictEqual(url, "https://fareharbor.com/embeds/book/southernstyletours/items/83002/?asn=aktourcenter&flow=4344&full-items=yes");
  });

  await t.test("Covered Tour Boat", () => {
    const product = getProduct("covered-tour-boat");
    assert.ok(product, "Product should exist");
    assert.strictEqual(product.itemId, "590176");
    assert.strictEqual(product.flowId, "392449");
    const url = getFareHarborUrl(product.companyShortname, product.itemId, product.flowId);
    assert.strictEqual(url, "https://fareharbor.com/embeds/book/ragincajuntours/items/590176/?asn=aktourcenter&flow=392449&full-items=yes");
  });

  await t.test("Airboat Options", () => {
    const product = getProduct("ragin-cajun-airboat-options");
    assert.ok(product, "Product should exist");
    assert.strictEqual(product.itemId, undefined);
    assert.strictEqual(product.flowId, "940162");
    const url = getFareHarborUrl(product.companyShortname, product.itemId, product.flowId);
    assert.strictEqual(url, "https://fareharbor.com/embeds/book/ragincajuntours/?asn=aktourcenter&flow=940162&full-items=yes");
  });

  await t.test("All-Day City + Plantation", () => {
    const product = getProduct("all-day-city-plantation-combo");
    assert.ok(product, "Product should exist");
    assert.strictEqual(product.companyShortname, "southernstyletours");
    assert.strictEqual(product.itemId, "51953");
    assert.strictEqual(product.flowId, "4344");
    const url = getFareHarborUrl(product.companyShortname, product.itemId, product.flowId);
    assert.strictEqual(url, "https://fareharbor.com/embeds/book/southernstyletours/items/51953/?asn=aktourcenter&flow=4344&full-items=yes");
  });

  await t.test("Covered Boat + Plantation", () => {
    const product = getProduct("covered-boat-plantation-combo");
    assert.ok(product, "Product should exist");
    assert.strictEqual(product.companyShortname, "ragincajuntours");
    assert.strictEqual(product.itemId, "603090");
    assert.strictEqual(product.flowId, "392449");
    const url = getFareHarborUrl(product.companyShortname, product.itemId, product.flowId);
    assert.strictEqual(url, "https://fareharbor.com/embeds/book/ragincajuntours/items/603090/?asn=aktourcenter&flow=392449&full-items=yes");
  });
});

test("all New Orleans booking CTAs preserve operator-specific FareHarbor source data", () => {
  for (const product of STOREFRONT_PRODUCTS) {
    if (product.bookingVariants?.length) {
      for (const variant of product.bookingVariants) {
        assert.ok(variant.bookingUrl, `${product.slug} / ${variant.label} must use a literal approved booking URL`);
        assertFareHarborUrl({
          url: variant.bookingUrl,
          shortname: product.companyShortname,
          itemId: variant.itemId,
          flowId: variant.flowId,
        });
      }
      continue;
    }

    assert.notStrictEqual(
      product.companyShortname,
      "neworleanssteamboatcompany",
      `${product.slug} must use its literal supplied FareHarbor URL instead of rebuilding a New Orleans Steamboat Company URL`,
    );

    const url = getFareHarborUrl(product.companyShortname, product.itemId, product.flowId);
    assertFareHarborUrl({
      url,
      shortname: product.companyShortname,
      itemId: product.itemId,
      flowId: product.flowId,
    });
  }
});

test("all supplied New Orleans Steamboat Company URLs remain byte-for-byte approved", () => {
  for (const approved of APPROVED_SUPPLIED_URLS) {
    const product = STOREFRONT_PRODUCTS.find((candidate) => candidate.slug === approved.slug);
    assert.ok(product, `${approved.slug} must exist in storefront inventory`);
    const variant = product.bookingVariants?.find((candidate) => candidate.label === approved.label);
    assert.ok(variant, `${approved.slug} / ${approved.label} must exist as a booking variant`);
    assert.strictEqual(variant.itemId, approved.itemId);
    assert.strictEqual(variant.flowId, approved.flowId);
    assert.strictEqual(variant.bookingUrl, approved.url);
  }
});

test("all New Orleans related tour slugs resolve to live products", () => {
  const slugs = new Set(STOREFRONT_PRODUCTS.map((product) => product.slug));
  for (const product of STOREFRONT_PRODUCTS) {
    assert.ok(slugs.has(product.relatedTourSlug), `${product.slug} related tour ${product.relatedTourSlug} must resolve`);
  }
});
