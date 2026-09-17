import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as handleIssueContext } from "@/app/api/v1/context/route";
import { POST as handleRedeemContext } from "@/app/api/v1/context/[contextId]/redeem/route";
import {
  signServiceRequest,
  clearNonceReplayCacheForTesting,
} from "@/lib/dcc/auth/hmac-service-auth";
import { getDb } from "@/lib/db/client";
import { dccContexts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const TEST_KEY_ID = "jfd_service_key";
const TEST_SECRET = "secret_jfd_dcc_staging_test_xyz123";

test.beforeEach(() => {
  process.env.INTERNAL_API_KEY_ID = TEST_KEY_ID;
  process.env.INTERNAL_API_SECRET = TEST_SECRET;
  process.env.ALLOW_IN_MEMORY_NONCE_FALLBACK_FOR_TESTS = "true";
  clearNonceReplayCacheForTesting();
});

test("Context API Route Suite", async (t) => {
  const db = getDb();
  let createdContextId = "";

  await t.test("1. POST /api/v1/context - Valid issuance generates opaque token with authoritative buffer", async () => {
    const payload = {
      sourceSite: "cruisepromenade",
      destination: "juneau",
      targetOwner: "juneauflightdeck",
      targetIntent: "juneau-whale-watch",
      schedule: {
        date: "2026-07-15",
        arrival: "08:00",
        departure: "18:00",
        travelers: 2,
        shipOrVenue: "Discovery Princess",
      },
      attribution: {
        campaign: "summer-2026",
      },
      idempotencyKey: `test-api-issue-${Date.now()}`,
    };

    const req = new NextRequest("https://api.destinationcommandcenter.com/api/v1/context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await handleIssueContext(req);
    const json = await res.json();
    if (res.status !== 201) {
      console.log("TEST 1 FAILURE:", res.status, json);
    }
    assert.equal(json.success, true);
    assert.match(json.contextId, /^dcc_ctx_[a-f0-9]{32}$/);
    assert.equal(json.version, "1.0");
    assert.equal(json.status, "issued");
    assert.equal(
      json.bridgeUrl,
      `https://juneauflightdeck.com/book?ctx=${json.contextId}`
    );
    assert.equal(json.expiresAt - json.issuedAt, 900000);

    createdContextId = json.contextId;

    // Verify authoritative 90m buffer was persisted to DB
    if (db) {
      const rows = await db.select().from(dccContexts).where(eq(dccContexts.contextId, createdContextId));
      assert.equal(rows.length, 1);
      assert.equal(rows[0].bufferMinutes, 90);
      assert.equal(rows[0].latestSafeReturnTime, "16:30");
      assert.equal(rows[0].midnightCrossed, false);
    }
  });

  await t.test("2. POST /api/v1/context - Idempotent replay returns 200 and same contextId", async () => {
    const idempotencyKey = `test-idemp-${Date.now()}`;
    const payload = {
      sourceSite: "cruisepromenade",
      destination: "juneau",
      targetOwner: "juneauflightdeck",
      schedule: {
        date: "2026-07-15",
        travelers: 2,
      },
      idempotencyKey,
    };

    const req1 = new NextRequest("https://api.destinationcommandcenter.com/api/v1/context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const res1 = await handleIssueContext(req1);
    const json1 = await res1.json();
    assert.equal(res1.status, 201);

    const req2 = new NextRequest("https://api.destinationcommandcenter.com/api/v1/context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const res2 = await handleIssueContext(req2);
    const json2 = await res2.json();

    if (db) {
      assert.equal(res2.status, 200);
      assert.equal(json2.contextId, json1.contextId);
      assert.equal(json2.idempotencyReplay, true);
    }
  });

  await t.test("3. POST /api/v1/context - Rejects invalid/tampered request shapes (strict mode)", async () => {
    const invalidPayload = {
      sourceSite: "cruisepromenade",
      destination: "juneau",
      targetOwner: "juneauflightdeck",
      schedule: {
        date: "2026-02-30", // Invalid calendar date
        travelers: 1,
      },
      injectedField: "malicious",
    };

    const req = new NextRequest("https://api.destinationcommandcenter.com/api/v1/context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invalidPayload),
    });

    const res = await handleIssueContext(req);
    const json = await res.json();

    assert.equal(res.status, 400);
    assert.equal(json.success, false);
    assert.equal(json.errorCode, "VALIDATION_FAILED");
  });

  await t.test("4. POST /api/v1/context/:id/redeem - Fails 401 without HMAC headers", async () => {
    const req = new NextRequest(
      `https://api.destinationcommandcenter.com/api/v1/context/${createdContextId}/redeem`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: "juneauflightdeck" }),
      }
    );

    const res = await handleRedeemContext(req, { params: { contextId: createdContextId } });
    const json = await res.json();

    assert.equal(res.status, 401);
    assert.equal(json.success, false);
    assert.equal(json.errorCode, "MISSING_SERVICE_SIGNATURE");
  });

  await t.test("5. POST /api/v1/context/:id/redeem - Fails 401 on tampered signature", async () => {
    const pathname = `/api/v1/context/${createdContextId}/redeem`;
    const bodyStr = JSON.stringify({ owner: "juneauflightdeck" });

    const signed = signServiceRequest({
      keyId: TEST_KEY_ID,
      secret: "tampered_secret_invalid",
      method: "POST",
      pathname,
      body: bodyStr,
    });

    const req = new NextRequest(`https://api.destinationcommandcenter.com${pathname}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...signed.headers,
      },
      body: bodyStr,
    });

    const res = await handleRedeemContext(req, { params: { contextId: createdContextId } });
    const json = await res.json();

    assert.equal(res.status, 401);
    assert.equal(json.success, false);
    assert.equal(json.errorCode, "INVALID_SIGNATURE");
  });

  await t.test("6. POST /api/v1/context/:id/redeem - Fails 403 on owner mismatch", async () => {
    const pathname = `/api/v1/context/${createdContextId}/redeem`;
    const bodyStr = JSON.stringify({ owner: "gosno" }); // Context was issued for juneauflightdeck

    const signed = signServiceRequest({
      keyId: TEST_KEY_ID,
      secret: TEST_SECRET,
      method: "POST",
      pathname,
      body: bodyStr,
    });

    const req = new NextRequest(`https://api.destinationcommandcenter.com${pathname}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...signed.headers,
      },
      body: bodyStr,
    });

    const res = await handleRedeemContext(req, { params: { contextId: createdContextId } });
    const json = await res.json();

    assert.equal(res.status, 403);
    assert.equal(json.success, false);
    assert.equal(json.errorCode, "OWNER_MISMATCH");
  });

  await t.test("7. POST /api/v1/context/:id/redeem - Valid HMAC request from rightful owner succeeds (200)", async () => {
    const pathname = `/api/v1/context/${createdContextId}/redeem`;
    const bodyStr = JSON.stringify({ owner: "juneauflightdeck" });

    const signed = signServiceRequest({
      keyId: TEST_KEY_ID,
      secret: TEST_SECRET,
      method: "POST",
      pathname,
      body: bodyStr,
    });

    const req = new NextRequest(`https://api.destinationcommandcenter.com${pathname}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...signed.headers,
      },
      body: bodyStr,
    });

    const res = await handleRedeemContext(req, { params: { contextId: createdContextId } });
    const json = await res.json();

    assert.equal(res.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.contextId, createdContextId);
    assert.equal(json.data.status, "redeemed");
    assert.equal(json.data.targetOwner, "juneauflightdeck.com");
    assert.equal(json.data.safetyConstraint.bufferMinutes, 90);
    assert.equal(json.data.safetyConstraint.latestSafeReturnTime, "16:30");
  });

  await t.test("8. POST /api/v1/context/:id/redeem - Replay of redeemed token fails with 409", async () => {
    const pathname = `/api/v1/context/${createdContextId}/redeem`;
    const bodyStr = JSON.stringify({ owner: "juneauflightdeck" });

    const signed = signServiceRequest({
      keyId: TEST_KEY_ID,
      secret: TEST_SECRET,
      method: "POST",
      pathname,
      body: bodyStr,
    });

    const req = new NextRequest(`https://api.destinationcommandcenter.com${pathname}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...signed.headers,
      },
      body: bodyStr,
    });

    const res = await handleRedeemContext(req, { params: { contextId: createdContextId } });
    const json = await res.json();

    assert.equal(res.status, 409);
    assert.equal(json.success, false);
    assert.equal(json.errorCode, "CONTEXT_ALREADY_REDEEMED");
  });

  await t.test("9. POST /api/v1/context/:id/redeem - Unknown contextId returns 404", async () => {
    const fakeContextId = "dcc_ctx_00000000000000000000000000000000";
    const pathname = `/api/v1/context/${fakeContextId}/redeem`;
    const bodyStr = JSON.stringify({ owner: "juneauflightdeck" });

    const signed = signServiceRequest({
      keyId: TEST_KEY_ID,
      secret: TEST_SECRET,
      method: "POST",
      pathname,
      body: bodyStr,
    });

    const req = new NextRequest(`https://api.destinationcommandcenter.com${pathname}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...signed.headers,
      },
      body: bodyStr,
    });

    const res = await handleRedeemContext(req, { params: { contextId: fakeContextId } });
    const json = await res.json();

    assert.equal(res.status, 404);
    assert.equal(json.success, false);
    assert.equal(json.errorCode, "CONTEXT_NOT_FOUND");
  });
});
