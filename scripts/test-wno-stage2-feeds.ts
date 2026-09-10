import assert from "node:assert/strict";
import {
  getWnoAgentDirectory,
  getWnoProductsFeed,
  getWnoLocationsFeed,
  getWnoPricingFeed,
  getWnoPoliciesFeed,
  getWnoOperatingWindowsFeed,
} from "../app/new-orleans/data/wnoFeedsData";
import {
  validateAgentDirectory,
  validateProductFeed,
  validateLocationFeed,
  validatePricingFeed,
  validatePolicyFeed,
} from "../lib/dcc/contracts/stage2MachineFeedContract";
import { STOREFRONT_PRODUCTS } from "../app/new-orleans/tours/pageConfig";

console.log("Starting WNO Stage 2 Feeds Validation Test...\n");

// 1. Validate Directory
console.log("1. Validating /agent.json Directory...");
const directory = getWnoAgentDirectory();
const dirResult = validateAgentDirectory(directory);
assert.equal(dirResult.valid, true, `Directory errors: ${dirResult.errors.join(", ")}`);
assert.equal(directory.dcc_id, "dcc:site:wno-tours");
console.log("   ✅ Directory is fully valid under Stage 2 contract.");

// 2. Validate Products Feed
console.log("2. Validating /api/v2/feeds/products...");
const products = getWnoProductsFeed();
const prodResult = validateProductFeed(products);
assert.equal(prodResult.valid, true, `Products errors: ${prodResult.errors.join(", ")}`);
assert.equal(products.length, STOREFRONT_PRODUCTS.length);
console.log(`   ✅ Products feed is fully valid (${products.length} catalog items).`);

// 3. Validate Locations Feed
console.log("3. Validating /api/v2/feeds/locations...");
const locations = getWnoLocationsFeed();
const locResult = validateLocationFeed(locations);
assert.equal(locResult.valid, true, `Locations errors: ${locResult.errors.join(", ")}`);
assert.ok(locations.length >= 4);
console.log(`   ✅ Locations feed is fully valid (${locations.length} POIs).`);

// 4. Validate Pricing Feed
console.log("4. Validating /api/v2/feeds/pricing...");
const pricing = getWnoPricingFeed();
const priceResult = validatePricingFeed(pricing);
assert.equal(priceResult.valid, true, `Pricing errors: ${priceResult.errors.join(", ")}`);
assert.equal(pricing.length, STOREFRONT_PRODUCTS.length);
for (const p of pricing) {
  assert.equal(p.currency, "USD");
  assert.ok(p.base_rate > 0);
  assert.ok(p.provenance.source.length > 0);
}
console.log(`   ✅ Pricing feed is fully valid with complete provenance (${pricing.length} rates).`);

// 5. Validate Policies Feed
console.log("5. Validating /api/v2/feeds/policies...");
const policies = getWnoPoliciesFeed();
const polResult = validatePolicyFeed(policies);
assert.equal(polResult.valid, true, `Policies errors: ${polResult.errors.join(", ")}`);
assert.equal(policies.length, STOREFRONT_PRODUCTS.length);
console.log(`   ✅ Policies feed is fully valid with enforceable terms (${policies.length} policies).`);

// 6. Validate Operating Windows
console.log("6. Validating /api/v2/feeds/operating-windows...");
const schedules = getWnoOperatingWindowsFeed();
assert.equal(schedules.length, STOREFRONT_PRODUCTS.length);
for (const s of schedules) {
  assert.ok(s.daily_departures.length > 0);
  assert.ok(s.season.start_date.length > 0);
}
console.log(`   ✅ Operating windows feed is fully valid (${schedules.length} schedules).`);

console.log("\nAll WNO Stage 2 Machine Feeds PASSED Validation! 🚀");
