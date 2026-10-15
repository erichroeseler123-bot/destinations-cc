import assert from "node:assert/strict";
import test from "node:test";
import {
  createVerifiedLicense,
  verifyDomainAuthorization,
  updateLicenseStatus,
  recordApiUsage,
  getLicenseByKey,
} from "../../lib/billing/licenses";

test("License creation, domain authorization, and cancellation lifecycle", async (t) => {
  const email = `manager-${Date.now()}@redrocksonline.com`;
  const subId = `sub_test_${Date.now()}`;
  const custId = `cus_test_${Date.now()}`;

  // 1. Create a verified license for an outdoor venue
  const license = await createVerifiedLicense({
    email,
    plan: "venue_monthly",
    authorizedDomains: ["redrocksonline.com", "staging.redrocksonline.com"],
    stripeCustomerId: custId,
    stripeSubscriptionId: subId,
  });

  assert.ok(license.key.startsWith("dcc_venue_"));
  assert.equal(license.status, "active");
  assert.equal(license.authorizedDomains.length, 2);

  // 2. Test domain authorization with whitelisted origin
  const validCheck = await verifyDomainAuthorization(license.key, "https://redrocksonline.com/directions");
  assert.equal(validCheck.authorized, true);

  const stagingCheck = await verifyDomainAuthorization(license.key, "https://staging.redrocksonline.com/logistics");
  assert.equal(stagingCheck.authorized, true);

  // 3. Test unauthorized domain attempt
  const unauthCheck = await verifyDomainAuthorization(license.key, "https://unauthorized-competitor.com/page");
  assert.equal(unauthCheck.authorized, false);
  assert.equal(unauthCheck.reason, "domain_not_whitelisted");

  // 4. Test missing and invalid keys
  const missingCheck = await verifyDomainAuthorization(null, "https://redrocksonline.com");
  assert.equal(missingCheck.authorized, false);
  assert.equal(missingCheck.reason, "missing_license_key");

  const invalidCheck = await verifyDomainAuthorization("dcc_venue_fake_key", "https://redrocksonline.com");
  assert.equal(invalidCheck.authorized, false);
  assert.equal(invalidCheck.reason, "invalid_license_key");

  // 5. Test usage recording and quota deduction
  const initialUsage = await recordApiUsage(license.key);
  assert.equal(initialUsage.allowed, true);
  assert.equal(initialUsage.remaining, license.maxMonthlyRequests - 1);

  // 6. Test cancellation lifecycle (simulating customer.subscription.deleted)
  const cancelled = await updateLicenseStatus(license.stripeSubscriptionId!, "cancelled");
  assert.ok(cancelled);
  assert.equal(cancelled.status, "cancelled");

  // 7. Verify that once cancelled, domain authorization immediately rejects
  const postCancelCheck = await verifyDomainAuthorization(license.key, "https://redrocksonline.com");
  assert.equal(postCancelCheck.authorized, false);
  assert.equal(postCancelCheck.reason, "license_cancelled");

  // 8. Verify API calls with cancelled key are rejected
  const postCancelUsage = await recordApiUsage(license.key);
  assert.equal(postCancelUsage.allowed, false);
  assert.equal(postCancelUsage.status, "cancelled");
});
