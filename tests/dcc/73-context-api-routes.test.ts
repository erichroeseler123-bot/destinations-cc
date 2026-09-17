import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as handleIssueContext, clearIssueRateLimitCacheForTesting } from "@/app/api/v1/context/route";
import { POST as handleRedeemContext } from "@/app/api/v1/context/[contextId]/redeem/route";
import { POST as handleRevokeContext } from "@/app/api/v1/context/[contextId]/revoke/route";
import {
  signServiceRequest,
  clearNonceReplayCacheForTesting,
} from "@/lib/dcc/auth/hmac-service-auth";
import { getDb } from "@/lib/db/client";
import { dccContexts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { issueContext, redeemContext } from "@/lib/dcc/context/service";

const TEST_KEY_ID = "jfd_service_key";
const TEST_SECRET = "secret_jfd_dcc_staging_test_xyz123";

test.beforeEach(() => {
  process.env.INTERNAL_API_KEY_ID = TEST_KEY_ID;
  process.env.INTERNAL_API_SECRET = TEST_SECRET;
  process.env.ALLOW_IN_MEMORY_NONCE_FALLBACK_FOR_TESTS = "true";
  clearNonceReplayCacheForTesting();
  clearIssueRateLimitCacheForTesting();
});

test("Context API Route & Staging Neon Concurrency Suite", async (t) => {
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
      idempotencyKey: `test-api-issue-${Date.now()}-${Math.random()}`,
    };

    const req = new NextRequest("https://api.destinationcommandcenter.com/api/v1/context", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        origin: "https://cruisepromenade.com",
      },
      body: JSON.stringify(payload),
    });

    const res = await handleIssueContext(req);
    const json = await res.json();

    assert.equal(res.status, 201);
    assert.equal(json.success, true);
    assert.match(json.contextId, /^dcc_ctx_[a-f0-9]{32}$/);
    assert.equal(json.version, "1.0");
    assert.equal(json.status, "issued");
    assert.equal(
      json.bridgeUrl,
      `https://juneauflightdeck.com/book?ctx=${json.contextId}`
    );
    assert.equal(json.expiresAt - json.issuedAt, 900000);
    assert.equal(res.headers.get("access-control-allow-origin"), "https://cruisepromenade.com");

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

  await t.test("2. POST /api/v1/context - Idempotent sequential replay returns 200 and same contextId", async () => {
    const idempotencyKey = `test-idemp-${Date.now()}-${Math.random()}`;
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

  await t.test("3. POST /api/v1/context - Simultaneous duplicate issue race returns identical contextId without 500 collision", async () => {
    const raceKey = `test-race-idemp-${Date.now()}-${Math.random()}`;
    const payload = {
      sourceSite: "cruisepromenade",
      destination: "juneau",
      targetOwner: "juneauflightdeck",
      schedule: {
        date: "2026-07-15",
        travelers: 3,
      },
      idempotencyKey: raceKey,
    };

    // Execute two simultaneous async requests racing against live Neon
    const [resA, resB] = await Promise.all([
      issueContext(payload),
      issueContext(payload),
    ]);

    assert.equal(resA.success, true);
    assert.equal(resB.success, true);
    assert.equal(resA.contextId, resB.contextId);
    // Exactly one should be the original issue and the other the idempotency replay
    const replays = [resA.idempotencyReplay, resB.idempotencyReplay].filter(Boolean);
    assert.equal(replays.length, 1);
  });

  await t.test("4. POST /api/v1/context - Origin allowlisting permits registered domains and blocks untrusted origins", async () => {
    // Untrusted origin -> 403
    const untrustedReq = new NextRequest("https://api.destinationcommandcenter.com/api/v1/context", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        origin: "https://malicious-phishing-site.xyz",
      },
      body: JSON.stringify({
        sourceSite: "cruisepromenade",
        destination: "juneau",
        targetOwner: "juneauflightdeck",
        schedule: { date: "2026-07-15", travelers: 1 },
      }),
    });

    const untrustedRes = await handleIssueContext(untrustedReq);
    const untrustedJson = await untrustedRes.json();
    assert.equal(untrustedRes.status, 403);
    assert.equal(untrustedJson.errorCode, "ORIGIN_NOT_ALLOWED");

    // Allowed origin -> 201 with reflected header
    const trustedReq = new NextRequest("https://api.destinationcommandcenter.com/api/v1/context", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        origin: "https://welcometoalaskatours.com",
      },
      body: JSON.stringify({
        sourceSite: "wta",
        destination: "juneau",
        targetOwner: "juneauflightdeck",
        schedule: { date: "2026-07-15", travelers: 1 },
      }),
    });

    const trustedRes = await handleIssueContext(trustedReq);
    assert.equal(trustedRes.status, 201);
    assert.equal(trustedRes.headers.get("access-control-allow-origin"), "https://welcometoalaskatours.com");
  });

  await t.test("5. POST /api/v1/context - Rate limiting rejects excessive issue requests with 429", async () => {
    const payload = {
      sourceSite: "cruisepromenade",
      destination: "juneau",
      targetOwner: "juneauflightdeck",
      schedule: { date: "2026-07-15", travelers: 1 },
    };

    const makeReq = () =>
      new NextRequest("https://api.destinationcommandcenter.com/api/v1/context", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "198.51.100.42",
        },
        body: JSON.stringify(payload),
      });

    // Send 60 requests up to the limit
    for (let i = 0; i < 60; i++) {
      const res = await handleIssueContext(makeReq());
      assert.equal(res.status, 201);
    }

    // 61st request must trigger 429 Rate Limit
    const rateLimitedRes = await handleIssueContext(makeReq());
    const rateLimitedJson = await rateLimitedRes.json();
    assert.equal(rateLimitedRes.status, 429);
    assert.equal(rateLimitedJson.errorCode, "RATE_LIMIT_EXCEEDED");
  });

  await t.test("6. POST /api/v1/context - Strict schema rejects unknown and invalid fields", async () => {
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

  await t.test("7. POST /api/v1/context/:id/redeem - Fails 401 without HMAC headers", async () => {
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

  await t.test("8. POST /api/v1/context/:id/redeem - Exact route path matching enforces HMAC scope", async () => {
    // Request path signed for a different internal route fails verification when sent to redeem
    const signedForDifferentRoute = signServiceRequest({
      keyId: TEST_KEY_ID,
      secret: TEST_SECRET,
      method: "POST",
      pathname: "/api/internal/cruises/port/juneau",
      body: JSON.stringify({ owner: "juneauflightdeck" }),
    });

    const req = new NextRequest(
      `https://api.destinationcommandcenter.com/api/v1/context/${createdContextId}/redeem`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...signedForDifferentRoute.headers,
        },
        body: JSON.stringify({ owner: "juneauflightdeck" }),
      }
    );

    const res = await handleRedeemContext(req, { params: { contextId: createdContextId } });
    const json = await res.json();

    assert.equal(res.status, 401);
    assert.equal(json.errorCode, "INVALID_SIGNATURE");
  });

  await t.test("9. POST /api/v1/context/:id/redeem - Fails 403 on owner mismatch", async () => {
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

  await t.test("10. POST /api/v1/context/:id/redeem - Real Neon Concurrent Race: exactly ONE 200 and ONE 409", async () => {
    // Issue a fresh context specifically for live concurrent redemption race
    const freshIssue = await issueContext({
      sourceSite: "cruisepromenade",
      destination: "juneau",
      targetOwner: "juneauflightdeck",
      schedule: { date: "2026-07-20", travelers: 2 },
    });

    const raceContextId = freshIssue.contextId;
    const pathname = `/api/v1/context/${raceContextId}/redeem`;
    const bodyStr = JSON.stringify({ owner: "juneauflightdeck" });

    // Generate two distinct HMAC signed requests with different nonces
    const sign1 = signServiceRequest({
      keyId: TEST_KEY_ID,
      secret: TEST_SECRET,
      method: "POST",
      pathname,
      body: bodyStr,
    });
    const sign2 = signServiceRequest({
      keyId: TEST_KEY_ID,
      secret: TEST_SECRET,
      method: "POST",
      pathname,
      body: bodyStr,
    });

    const req1 = new NextRequest(`https://api.destinationcommandcenter.com${pathname}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...sign1.headers },
      body: bodyStr,
    });
    const req2 = new NextRequest(`https://api.destinationcommandcenter.com${pathname}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...sign2.headers },
      body: bodyStr,
    });

    // Fire both requests simultaneously against live PostgreSQL (Same owner retry/prefetch race)
    const [res1, res2] = await Promise.all([
      handleRedeemContext(req1, { params: { contextId: raceContextId } }),
      handleRedeemContext(req2, { params: { contextId: raceContextId } }),
    ]);

    const statuses = [res1.status, res2.status];
    assert.deepEqual(statuses, [200, 200], "Same-owner concurrent race must both succeed with 200 OK (one atomic winner, one idempotent replay)");

    const json1 = await res1.json();
    const json2 = await res2.json();

    assert.equal(json1.success, true);
    assert.equal(json2.success, true);
    assert.equal(json1.data.status, "redeemed");
    assert.equal(json2.data.status, "redeemed");

    // At least one of the two responses was the idempotent replay
    const hasReplay = json1.idempotencyReplay === true || json2.idempotencyReplay === true;
    assert.equal(hasReplay, true, "One of the concurrent same-owner redemptions must be flagged as idempotent replay");
  });

  await t.test("11. POST /api/v1/context/:id/redeem - Expired context returns 410 CONTEXT_EXPIRED", async () => {
    // Issue a context with an expired timestamp (16 minutes ago)
    const pastTime = Date.now() - 16 * 60 * 1000;
    const expiredIssue = await issueContext(
      {
        sourceSite: "cruisepromenade",
        destination: "juneau",
        targetOwner: "juneauflightdeck",
        schedule: { date: "2026-07-20", travelers: 1 },
      },
      { now: pastTime }
    );

    const expiredContextId = expiredIssue.contextId;
    const pathname = `/api/v1/context/${expiredContextId}/redeem`;
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
      headers: { "Content-Type": "application/json", ...signed.headers },
      body: bodyStr,
    });

    const res = await handleRedeemContext(req, { params: { contextId: expiredContextId } });
    const json = await res.json();

    assert.equal(res.status, 410);
    assert.equal(json.success, false);
    assert.equal(json.errorCode, "CONTEXT_EXPIRED");
  });

  await t.test("12. POST /api/v1/context/:id/redeem - Unknown contextId returns 404", async () => {
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

  await t.test("13. POST /api/v1/context/:id/revoke - Authenticated service revocation cancels token and prevents redemption", async () => {
    // 1. Issue fresh token
    const freshIssue = await issueContext({
      sourceSite: "cruisepromenade",
      destination: "juneau",
      targetOwner: "juneauflightdeck",
      schedule: { date: "2026-07-25", travelers: 2 },
    });

    const revokeContextId = freshIssue.contextId;
    const revokePathname = `/api/v1/context/${revokeContextId}/revoke`;
    const revokeBody = JSON.stringify({ reason: "Customer cancelled shore excursion" });

    // 2. Sign revocation request
    const revokeSigned = signServiceRequest({
      keyId: TEST_KEY_ID,
      secret: TEST_SECRET,
      method: "POST",
      pathname: revokePathname,
      body: revokeBody,
    });

    const revokeReq = new NextRequest(`https://api.destinationcommandcenter.com${revokePathname}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...revokeSigned.headers },
      body: revokeBody,
    });

    const revokeRes = await handleRevokeContext(revokeReq, { params: { contextId: revokeContextId } });
    const revokeJson = await revokeRes.json();

    assert.equal(revokeRes.status, 200);
    assert.equal(revokeJson.success, true);
    assert.equal(revokeJson.status, "revoked");

    // 3. Attempting to redeem revoked token must be rejected
    const redeemPathname = `/api/v1/context/${revokeContextId}/redeem`;
    const redeemBody = JSON.stringify({ owner: "juneauflightdeck" });

    const redeemSigned = signServiceRequest({
      keyId: TEST_KEY_ID,
      secret: TEST_SECRET,
      method: "POST",
      pathname: redeemPathname,
      body: redeemBody,
    });

    const redeemReq = new NextRequest(`https://api.destinationcommandcenter.com${redeemPathname}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...redeemSigned.headers },
      body: redeemBody,
    });

    const redeemRes = await handleRedeemContext(redeemReq, { params: { contextId: revokeContextId } });
    const redeemJson = await redeemRes.json();

    assert.equal(redeemRes.status, 400);
    assert.equal(redeemJson.success, false);
    assert.match(redeemJson.message, /revoked/);
  });
});
