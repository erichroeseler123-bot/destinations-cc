import test from "node:test";
import assert from "node:assert";
import { STOREFRONT_PRODUCTS, getFareHarborUrl } from "../../app/new-orleans/tours/pageConfig";

test("FareHarbor Product Identities and Links", async (t) => {
  const getProduct = (slug: string) => STOREFRONT_PRODUCTS.find(p => p.slug === slug);

  await t.test("City Tour Of New Orleans", () => {
    const product = getProduct("city-tour-of-new-orleans");
    assert.ok(product, "Product should exist");
    assert.strictEqual(product.itemId, "51942");
    assert.strictEqual(product.flowId, "4344");
    
    const url = getFareHarborUrl(product.companyShortname, product.itemId, product.flowId);
    assert.strictEqual(
      url,
      "https://fareharbor.com/embeds/book/southernstyletours/items/51942/?asn=aktourcenter&flow=4344&full-items=yes",
    );
  });

  await t.test("Oak Alley Or Laura Plantation Tour", () => {
    const product = getProduct("oak-alley-or-laura-plantation-tour");
    assert.ok(product, "Product should exist");
    assert.strictEqual(product.itemId, "83002");
    assert.strictEqual(product.flowId, "4344");
    
    const url = getFareHarborUrl(product.companyShortname, product.itemId, product.flowId);
    assert.strictEqual(
      url,
      "https://fareharbor.com/embeds/book/southernstyletours/items/83002/?asn=aktourcenter&flow=4344&full-items=yes",
    );
  });

  await t.test("Covered Tour Boat", () => {
    const product = getProduct("covered-tour-boat");
    assert.ok(product, "Product should exist");
    assert.strictEqual(product.itemId, "590176");
    assert.strictEqual(product.flowId, "392449");
    
    const url = getFareHarborUrl(product.companyShortname, product.itemId, product.flowId);
    assert.strictEqual(
      url,
      "https://fareharbor.com/embeds/book/ragincajuntours/items/590176/?asn=aktourcenter&flow=392449&full-items=yes",
    );
  });

  await t.test("Airboat Options", () => {
    const product = getProduct("ragin-cajun-airboat-options");
    assert.ok(product, "Product should exist");
    assert.strictEqual(product.itemId, undefined);
    assert.strictEqual(product.flowId, "940162");
    
    const url = getFareHarborUrl(product.companyShortname, product.itemId, product.flowId);
    assert.strictEqual(
      url,
      "https://fareharbor.com/embeds/book/ragincajuntours/?asn=aktourcenter&flow=940162&full-items=yes",
    );
  });

  await t.test("All-Day City + Plantation", () => {
    const product = getProduct("all-day-city-plantation-combo");
    assert.ok(product, "Product should exist");
    assert.strictEqual(product.companyShortname, "southernstyletours");
    assert.strictEqual(product.itemId, "51953");
    assert.strictEqual(product.flowId, "4344");

    const url = getFareHarborUrl(product.companyShortname, product.itemId, product.flowId);
    assert.strictEqual(
      url,
      "https://fareharbor.com/embeds/book/southernstyletours/items/51953/?asn=aktourcenter&flow=4344&full-items=yes",
    );
  });

  await t.test("Covered Boat + Plantation", () => {
    const product = getProduct("covered-boat-plantation-combo");
    assert.ok(product, "Product should exist");
    assert.strictEqual(product.companyShortname, "ragincajuntours");
    assert.strictEqual(product.itemId, "603090");
    assert.strictEqual(product.flowId, "392449");

    const url = getFareHarborUrl(product.companyShortname, product.itemId, product.flowId);
    assert.strictEqual(
      url,
      "https://fareharbor.com/embeds/book/ragincajuntours/items/603090/?asn=aktourcenter&flow=392449&full-items=yes",
    );
  });
});
