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
    assert.ok(url.includes("asn=aktourcenter"), "URL should include ASN");
    assert.ok(url.includes("items/51942"), "URL should include item ID");
    assert.ok(url.includes("flow=4344"), "URL should include flow ID");
    assert.ok(url.startsWith("https://fareharbor.com/embeds/book/southernstyletours/items/51942/"));
  });

  await t.test("Oak Alley Or Laura Plantation Tour", () => {
    const product = getProduct("oak-alley-or-laura-plantation-tour");
    assert.ok(product, "Product should exist");
    assert.strictEqual(product.itemId, "83002");
    assert.strictEqual(product.flowId, "4344");
    
    const url = getFareHarborUrl(product.companyShortname, product.itemId, product.flowId);
    assert.ok(url.includes("asn=aktourcenter"), "URL should include ASN");
    assert.ok(url.includes("items/83002"), "URL should include item ID");
    assert.ok(url.includes("flow=4344"), "URL should include flow ID");
    assert.ok(url.startsWith("https://fareharbor.com/embeds/book/southernstyletours/items/83002/"));
  });

  await t.test("Covered Tour Boat", () => {
    const product = getProduct("covered-tour-boat");
    assert.ok(product, "Product should exist");
    assert.strictEqual(product.itemId, "590176");
    assert.strictEqual(product.flowId, "392449");
    
    const url = getFareHarborUrl(product.companyShortname, product.itemId, product.flowId);
    assert.ok(url.includes("asn=aktourcenter"), "URL should include ASN");
    assert.ok(url.includes("items/590176"), "URL should include item ID");
    assert.ok(url.includes("flow=392449"), "URL should include flow ID");
    assert.ok(url.startsWith("https://fareharbor.com/embeds/book/ragincajuntours/items/590176/"));
  });

  await t.test("Airboat Options", () => {
    const product = getProduct("ragin-cajun-airboat-options");
    assert.ok(product, "Product should exist");
    assert.strictEqual(product.itemId, undefined);
    assert.strictEqual(product.flowId, "940162");
    
    const url = getFareHarborUrl(product.companyShortname, product.itemId, product.flowId);
    assert.ok(url.includes("asn=aktourcenter"), "URL should include ASN");
    assert.ok(!url.includes("items/"), "URL should NOT include an item ID for multi-item flow");
    assert.ok(url.includes("flow=940162"), "URL should include flow ID");
    assert.ok(url.startsWith("https://fareharbor.com/embeds/book/ragincajuntours/"));
  });
});
