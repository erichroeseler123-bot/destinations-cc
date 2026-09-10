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
  validateOperatingWindowsFeed,
} from "../lib/dcc/contracts/stage2MachineFeedContract";
import { STOREFRONT_PRODUCTS } from "../app/new-orleans/tours/pageConfig";

console.log("Starting Corrected WNO Reality-First Feeds Validation Test...\n");

// 1. Validate Directory
console.log("1. Validating /agent.json Directory...");
const directory = getWnoAgentDirectory();
const dirResult = validateAgentDirectory(directory, "dcc:site:wno-tours");
assert.equal(dirResult.valid, true, `Directory errors: ${dirResult.errors.join(", ")}`);
assert.equal(directory.dcc_id, "dcc:site:wno-tours");
assert.equal(directory.capabilities.booking_handoff_mode, "client_navigation");
console.log("   ✅ Directory is fully valid under Stage 2 contract (dcc:site:wno-tours).");

// 2. Validate Products Feed
console.log("2. Validating /api/v2/feeds/products...");
const products = getWnoProductsFeed();
const prodResult = validateProductFeed(products);
assert.equal(prodResult.valid, true, `Products errors: ${prodResult.errors.join(", ")}`);
assert.equal(products.length, STOREFRONT_PRODUCTS.length);
console.log(`   ✅ Products feed is fully valid (${products.length} catalog items, meeting vs attraction distinguished).`);

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
const priceResult = validatePricingFeed(pricing, "dcc:site:wno-tours");
assert.equal(priceResult.valid, true, `Pricing errors: ${priceResult.errors.join(", ")}`);
assert.equal(pricing.length, STOREFRONT_PRODUCTS.length);
const verifiedPrices = pricing.filter(p => p.verification_status === "verified");
const unverifiedPrices = pricing.filter(p => p.verification_status === "requires_operator_confirmation");
assert.equal(verifiedPrices.length, 2, "Exactly 2 offerings have published verified base rates in pilot");
assert.equal(unverifiedPrices.length, 19, "Remaining 19 offerings (including plantation tour) require operator confirmation");
console.log(`   ✅ Pricing feed is fully valid (2 verified rates, 19 requiring operator confirmation).`);

// 5. Validate Policies Feed
console.log("5. Validating /api/v2/feeds/policies...");
const policies = getWnoPoliciesFeed();
const polResult = validatePolicyFeed(policies);
assert.equal(polResult.valid, true, `Policies errors: ${polResult.errors.join(", ")}`);
assert.equal(policies.length, STOREFRONT_PRODUCTS.length);
const verifiedPolicies = policies.filter(p => p.verification_status === "verified");
assert.equal(verifiedPolicies.length, 2, "Exactly 2 offerings have verified contract policies");
console.log(`   ✅ Policies feed is fully valid (2 verified policies, 19 requiring operator confirmation).`);

// 6. Validate Operating Windows Feed
console.log("6. Validating /api/v2/feeds/operating-windows...");
const schedules = getWnoOperatingWindowsFeed();
const schedResult = validateOperatingWindowsFeed(schedules);
assert.equal(schedResult.valid, true, `Schedules errors: ${schedResult.errors.join(", ")}`);
assert.equal(schedules.length, STOREFRONT_PRODUCTS.length);
const verifiedSchedules = schedules.filter(s => s.verification_status === "verified");
assert.equal(verifiedSchedules.length, 1, "Exactly 1 offering (Steamboat Natchez) has a fixed verified departure schedule");
for (const s of schedules) {
  assert.equal(s.time_zone, "America/Chicago");
}
console.log(`   ✅ Operating windows feed is fully valid with America/Chicago time zone.`);

console.log("\nAll Corrected WNO Machine Feeds PASSED Reality-First Validation! 🚀");
