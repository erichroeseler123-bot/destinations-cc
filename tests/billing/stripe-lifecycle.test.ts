import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { NextRequest } from "next/server";
import { POST as handleCheckout } from "@/app/api/billing/checkout/route";
import { POST as handleWebhook } from "@/app/api/billing/webhook/route";
import { POST as handlePortal } from "@/app/api/billing/portal/route";
import {
  findLicense,
  getLicenseByKey,
  verifyDomainAuthorization,
  recordApiUsage,
  LicenseRecord,
} from "@/lib/billing/licenses";
import { getDb } from "@/lib/db/client";
import { dccLicenses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const TEST_WEBHOOK_SECRET = "whsec_test_secret_key_dcc_stripe_lifecycle_123456789";

function createSignedStripeHeader(payload: string, secret: string, timestamp?: number): string {
  const t = timestamp ?? Math.floor(Date.now() / 1000);
  const signedPayload = `${t}.${payload}`;
  const signature = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");
  return `t=${t},v1=${signature}`;
}

test("Stripe Billing, Webhook Security, and Access Control Lifecycle", async (t) => {
  const uniqueId = Date.now();
  const testEmail = `operator-${uniqueId}@whitewater-colorado.com`;
  const testDomain = "whitewater-colorado.com";
  const testCustomerId = `cus_test_venue_${uniqueId}`;
  const testSubscriptionId = `sub_test_venue_${uniqueId}`;
  let activeLicenseKey = "";

  // 1. Checkout Endpoint Validation & Production Guard
  await t.test("1. POST /api/billing/checkout - Input validation and production safety guards", async () => {
    // Missing email
    const reqNoEmail = new NextRequest("https://destinationcommandcenter.com/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: "venue_monthly" }),
    });
    const resNoEmail = await handleCheckout(reqNoEmail);
    assert.equal(resNoEmail.status, 400);
    const jsonNoEmail = await resNoEmail.json();
    assert.equal(jsonNoEmail.ok, false);
    assert.match(jsonNoEmail.error, /email/i);

    // Invalid plan
    const reqBadPlan = new NextRequest("https://destinationcommandcenter.com/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, plan: "invalid_nonexistent_plan" }),
    });
    const resBadPlan = await handleCheckout(reqBadPlan);
    assert.equal(resBadPlan.status, 400);

    // Production guard without Stripe key
    const prevKey = process.env.STRIPE_SECRET_KEY;
    const prevEnv = process.env.NODE_ENV;
    try {
      delete process.env.STRIPE_SECRET_KEY;
      (process.env as any).NODE_ENV = "production";
      const reqProdGuard = new NextRequest("https://destinationcommandcenter.com/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail, plan: "venue_monthly" }),
      });
      const resProdGuard = await handleCheckout(reqProdGuard);
      assert.equal(resProdGuard.status, 503, "Production must return 503 when Stripe is unconfigured");
    } finally {
      process.env.STRIPE_SECRET_KEY = prevKey;
      (process.env as any).NODE_ENV = prevEnv;
    }
  });

  // 2. Stripe Webhook Signature Verification
  await t.test("2. POST /api/billing/webhook - Cryptographic HMAC signature enforcement", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;

    const dummyPayload = JSON.stringify({ type: "ping" });

    // Request with missing signature header
    const reqMissingSig = new NextRequest("https://destinationcommandcenter.com/api/billing/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: dummyPayload,
    });
    const resMissingSig = await handleWebhook(reqMissingSig);
    assert.equal(resMissingSig.status, 400, "Missing signature should return 400");

    // Request with forged/invalid signature
    const reqInvalidSig = new NextRequest("https://destinationcommandcenter.com/api/billing/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "t=1234567,v1=bad_signature_digest_0000000000000000000000000000000000000000000000000000000000000000",
      },
      body: dummyPayload,
    });
    const resInvalidSig = await handleWebhook(reqInvalidSig);
    assert.equal(resInvalidSig.status, 400, "Invalid HMAC signature should return 400");

    // Request with expired signature timestamp (> 5 minutes old)
    const oldTimestamp = Math.floor(Date.now() / 1000) - 600;
    const oldSigHeader = createSignedStripeHeader(dummyPayload, TEST_WEBHOOK_SECRET, oldTimestamp);
    const reqOldSig = new NextRequest("https://destinationcommandcenter.com/api/billing/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": oldSigHeader,
      },
      body: dummyPayload,
    });
    const resOldSig = await handleWebhook(reqOldSig);
    assert.equal(resOldSig.status, 400, "Timestamp drift > 5 min must return 400");
  });

  // 3. Webhook Delivery: checkout.session.completed (License Generation & Neon DB Persistence)
  await t.test("3. POST /api/billing/webhook - checkout.session.completed provisions active license in Neon DB", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;

    const checkoutEvent = {
      id: `evt_test_${uniqueId}`,
      type: "checkout.session.completed",
      livemode: false,
      data: {
        object: {
          id: `cs_test_${uniqueId}`,
          customer: testCustomerId,
          subscription: testSubscriptionId,
          customer_details: { email: testEmail },
          metadata: {
            plan: "venue_monthly",
            domain: testDomain,
            email: testEmail,
          },
        },
      },
    };

    const payload = JSON.stringify(checkoutEvent);
    const sigHeader = createSignedStripeHeader(payload, TEST_WEBHOOK_SECRET);

    const req = new NextRequest("https://destinationcommandcenter.com/api/billing/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": sigHeader,
      },
      body: payload,
    });

    const res = await handleWebhook(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.received, true);
    assert.equal(json.event, "checkout.session.completed");

    // Verify license in persistent DB
    const license = await findLicense(testSubscriptionId);
    assert.ok(license, "License record must be found in persistent storage");
    assert.ok(license.key.startsWith("dcc_test_venue_") || license.key.startsWith("dcc_venue_"), "Venue license key must start with dcc_test_venue_ or dcc_venue_");
    assert.equal(license.email, testEmail);
    assert.equal(license.plan, "venue_monthly");
    assert.equal(license.status, "active");
    assert.equal(license.stripeCustomerId, testCustomerId);
    assert.equal(license.stripeSubscriptionId, testSubscriptionId);
    assert.deepEqual(license.authorizedDomains, [testDomain]);
    assert.equal(license.maxMonthlyRequests, 50000);

    activeLicenseKey = license.key;
  });

  // 4. Paid Widget Enforcement & Domain Whitelist Validation
  await t.test("4. Paid Widget Enforcement - whitelabel branding and domain authorization", async () => {
    assert.ok(activeLicenseKey, "Active license key required");

    // Authorized domain: should authorize successfully
    const authSuccess = await verifyDomainAuthorization(activeLicenseKey, `https://${testDomain}/booking`);
    assert.equal(authSuccess.authorized, true);
    assert.ok(authSuccess.license);

    // Subdomain of authorized domain: should authorize
    const subAuthSuccess = await verifyDomainAuthorization(activeLicenseKey, `https://tours.${testDomain}/rafting`);
    assert.equal(subAuthSuccess.authorized, true);

    // Unauthorized domain: must be rejected with domain_not_whitelisted
    const authFail = await verifyDomainAuthorization(activeLicenseKey, "https://pirate-outdoors.com/stealing-widget");
    assert.equal(authFail.authorized, false);
    assert.equal(authFail.reason, "domain_not_whitelisted");

    // Missing key with whitelabel request: must be rejected
    const authMissingKey = await verifyDomainAuthorization(null, `https://${testDomain}`);
    assert.equal(authMissingKey.authorized, false);
    assert.equal(authMissingKey.reason, "missing_license_key");

    // API usage metering deduction
    const usage = await recordApiUsage(activeLicenseKey);
    assert.equal(usage.allowed, true);
    assert.equal(usage.plan, "venue_monthly");
    assert.equal(usage.status, "active");
    assert.equal(usage.remaining, 49999);

    // Production guard: test licenses must be strictly rejected in live production sales environment
    const prevEnv = process.env.NODE_ENV;
    const prevVercel = process.env.VERCEL_ENV;
    try {
      (process.env as any).NODE_ENV = "production";
      (process.env as any).VERCEL_ENV = "production";
      const prodCheck = await verifyDomainAuthorization(activeLicenseKey, `https://${testDomain}`);
      assert.equal(prodCheck.authorized, false);
      assert.equal(prodCheck.reason, "test_license_rejected_in_production");

      const prodUsage = await recordApiUsage(activeLicenseKey);
      assert.equal(prodUsage.allowed, false);
      assert.equal(prodUsage.status, "test_mode_rejected_in_production");
    } finally {
      process.env.NODE_ENV = prevEnv;
      process.env.VERCEL_ENV = prevVercel;
    }
  });

  // 5. Billing Portal Customer Resolution
  await t.test("5. POST /api/billing/portal - Customer resolution and portal routing", async () => {
    // Nonexistent customer lookup
    const reqNotFound = new NextRequest("https://destinationcommandcenter.com/api/billing/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "dcc_venue_nonexistent_key_99999" }),
    });
    const resNotFound = await handlePortal(reqNotFound);
    assert.equal(resNotFound.status, 404);

    // Known customer resolution
    const license = await findLicense(testCustomerId);
    assert.ok(license);
    assert.equal(license.stripeCustomerId, testCustomerId);
  });

  // 6. Subscription Payment Past Due Lifecycle
  await t.test("6. POST /api/billing/webhook - invoice.payment_failed updates status to past_due", async () => {
    const failedInvoiceEvent = {
      id: `evt_fail_${uniqueId}`,
      type: "invoice.payment_failed",
      data: {
        object: {
          id: `in_test_${uniqueId}`,
          subscription: testSubscriptionId,
        },
      },
    };

    const payload = JSON.stringify(failedInvoiceEvent);
    const sigHeader = createSignedStripeHeader(payload, TEST_WEBHOOK_SECRET);

    const req = new NextRequest("https://destinationcommandcenter.com/api/billing/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": sigHeader,
      },
      body: payload,
    });

    const res = await handleWebhook(req);
    assert.equal(res.status, 200);

    const license = await findLicense(testSubscriptionId);
    assert.ok(license);
    assert.equal(license.status, "past_due");

    // Domain verification reports license_past_due
    const domainCheck = await verifyDomainAuthorization(activeLicenseKey, `https://${testDomain}`);
    assert.equal(domainCheck.authorized, false);
    assert.equal(domainCheck.reason, "license_past_due");
  });

  // 7. Subscription Cancellation Lifecycle (customer.subscription.deleted)
  await t.test("7. POST /api/billing/webhook - customer.subscription.deleted revokes license and blocks embeds", async () => {
    const cancelEvent = {
      id: `evt_cancel_${uniqueId}`,
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: testSubscriptionId,
          status: "canceled",
        },
      },
    };

    const payload = JSON.stringify(cancelEvent);
    const sigHeader = createSignedStripeHeader(payload, TEST_WEBHOOK_SECRET);

    const req = new NextRequest("https://destinationcommandcenter.com/api/billing/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": sigHeader,
      },
      body: payload,
    });

    const res = await handleWebhook(req);
    assert.equal(res.status, 200);

    const license = await findLicense(testSubscriptionId);
    assert.ok(license);
    assert.equal(license.status, "cancelled");
    assert.ok(license.revokedAt, "RevokedAt timestamp must be set");

    // Domain check immediately rejects with license_cancelled
    const postCancelCheck = await verifyDomainAuthorization(activeLicenseKey, `https://${testDomain}`);
    assert.equal(postCancelCheck.authorized, false);
    assert.equal(postCancelCheck.reason, "license_cancelled");

    // API usage metering immediately blocks requests
    const postCancelUsage = await recordApiUsage(activeLicenseKey);
    assert.equal(postCancelUsage.allowed, false);
    assert.equal(postCancelUsage.status, "cancelled");
    assert.equal(postCancelUsage.remaining, 0);

    // Clean up test license in Neon DB
    const db = getDb();
    if (db) {
      await db.delete(dccLicenses).where(eq(dccLicenses.key, activeLicenseKey));
    }
  });
});
