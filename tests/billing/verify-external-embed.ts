import test from "node:test";
import assert from "node:assert/strict";
import { createVerifiedLicense, verifyDomainAuthorization, updateLicenseStatus } from "../../lib/billing/licenses";

test("External-Site Embed Authorization & Lifecycle Verification", async () => {
  const testDomain = "coloradorafting.net";
  const separateDomain = "unauthorized-outdoors.com";

  // 1. Issue an active license for the venue
  const license = await createVerifiedLicense({
    email: "ops@coloradorafting.net",
    plan: "venue_monthly",
    authorizedDomains: [testDomain],
    stripeCustomerId: "cus_mock_test_123",
    stripeSubscriptionId: "sub_mock_test_123",
  });

  // 2. Simulate iframe load from authorized external site:
  // Browser sends Referer header: https://coloradorafting.net/trips/clear-creek
  const authorizedEmbed = await verifyDomainAuthorization(license.key, `https://${testDomain}/trips/clear-creek`);
  assert.equal(authorizedEmbed.authorized, true, "Authorized external site must have permission to hide branding");
  assert.ok(authorizedEmbed.license);

  // 3. Simulate iframe load from an unauthorized external site attempting to steal the key:
  // Browser sends Referer header: https://unauthorized-outdoors.com/booking
  const unauthorizedEmbed = await verifyDomainAuthorization(license.key, `https://${separateDomain}/booking`);
  assert.equal(unauthorizedEmbed.authorized, false, "Unauthorized external site must be rejected");
  assert.equal(unauthorizedEmbed.reason, "domain_not_whitelisted");

  // 4. Cancel through Stripe:
  await updateLicenseStatus(license.stripeSubscriptionId!, "cancelled");

  // 5. Verify the authorized site is now immediately rejected post-cancellation:
  const postCancelEmbed = await verifyDomainAuthorization(license.key, `https://${testDomain}/trips/clear-creek`);
  assert.equal(postCancelEmbed.authorized, false, "Cancelled license must reject whitelabel embed");
  assert.equal(postCancelEmbed.reason, "license_cancelled");
});
