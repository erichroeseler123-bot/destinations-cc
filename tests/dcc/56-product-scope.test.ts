import test from "node:test";
import assert from "node:assert/strict";
import { DCC_PRODUCT_SCOPE } from "@/lib/dcc/productScope";

const requiredModules = [
  "identity",
  "now",
  "conditions",
  "hazards",
  "water",
  "official",
  "events",
  "machineFeeds",
  "providerSlots",
  "officialLiveLinks",
];

test("DCC primary identity remains coordinate-native", () => {
  assert.equal(DCC_PRODUCT_SCOPE.primaryProduct.canonicalIdentity, "latitude,longitude");
  assert.equal(DCC_PRODUCT_SCOPE.primaryProduct.canonicalHumanPath, "/location/{lat}/{lng}");
  assert.equal(DCC_PRODUCT_SCOPE.primaryProduct.canonicalMachinePath, "/api/location/{lat}/{lng}");
});

test("DCC core module vocabulary is explicit and stable", () => {
  assert.deepEqual([...DCC_PRODUCT_SCOPE.primaryProduct.allowedCoreModules], requiredModules);
});

test("portfolio graph and travel corridors remain secondary products", () => {
  const ids = DCC_PRODUCT_SCOPE.secondaryProducts.map((product) => product.id);
  assert.ok(ids.includes("portfolio-relationship-graph"));
  assert.ok(ids.includes("legacy-travel-corridors"));
  assert.notEqual(DCC_PRODUCT_SCOPE.primaryProduct.id, "portfolio-relationship-graph");
  assert.notEqual(DCC_PRODUCT_SCOPE.primaryProduct.id, "legacy-travel-corridors");
});

test("booking marketplace cannot silently become DCC's primary identity", () => {
  assert.ok(DCC_PRODUCT_SCOPE.outOfScopeAsPrimaryIdentity.includes("booking marketplace"));
  assert.ok(DCC_PRODUCT_SCOPE.expansionRules.some((rule) => rule.includes("does not create a new DCC primary product")));
});
