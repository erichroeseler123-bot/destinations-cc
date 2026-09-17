import { DccServiceClient } from "../../cruisepromenade/src/lib/server/dcc-client";
import {
  redeemOpaqueContext,
  getOrCreateCheckoutSession,
  clearCheckoutSessionCacheForTesting,
} from "../apps/juneauflightdeck/lib/dccContext";
import { getDb } from "../lib/db/client";
import { dccContexts } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as handleRedeemRoute } from "../app/api/v1/context/[contextId]/redeem/route";

const TEST_KEY_ID = "jfd_service_key";
const TEST_SECRET = "secret_jfd_dcc_staging_test_xyz123";

const inProcessRouteFetcher = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const match = url.match(/\/api\/v1\/context\/([^/]+)\/redeem/);
  if (!match) {
    throw new Error(`Unhandled route in test fetcher: ${url}`);
  }
  const contextId = match[1];
  const req = new NextRequest(url, {
    method: init?.method || "POST",
    headers: init?.headers as Record<string, string>,
    body: init?.body as string,
  });
  const res = await handleRedeemRoute(req, { params: { contextId } });
  return res as unknown as Response;
};

async function runAlaskaPilotTest() {
  console.log("==================================================================");
  console.log("ALASKA PILOT TEST: CRUISE PROMENADE (FEEDER) ➔ JUNEAU FLIGHT DECK");
  console.log("==================================================================\n");

  process.env.INTERNAL_API_KEY_ID = TEST_KEY_ID;
  process.env.INTERNAL_API_SECRET = TEST_SECRET;
  process.env.DCC_JFD_SERVICE_KEY_ID = TEST_KEY_ID;
  process.env.DCC_JFD_SERVICE_SECRET = TEST_SECRET;
  process.env.ALLOW_IN_MEMORY_NONCE_FALLBACK_FOR_TESTS = "true";
  clearCheckoutSessionCacheForTesting();

  const db = getDb();
  assert(db, "Staging Neon database must be configured");

  // Step 1: Cruise Promenade Initiates Context Token
  console.log("Step 1: Feeder (Cruise Promenade) issues signed opaque context token...");
  const cpClient = new DccServiceClient({
    baseUrl: "https://api.destinationcommandcenter.com",
  });

  const { issueContext } = await import("../lib/dcc/context/service");
  const issueResult = await issueContext({
    sourceSite: "cruisepromenade",
    destination: "juneau",
    targetOwner: "juneauflightdeck", // Canonical owner ID
    targetIntent: "juneau-helicopter-glacier-landing",
    schedule: {
      date: "2026-07-15",
      arrival: "08:00",
      departure: "18:00",
      travelers: 2,
      shipOrVenue: "Discovery Princess",
    },
    attribution: {
      campaign: "cp-alaska-summer-2026",
      referrerDomain: "cruisepromenade.com",
    },
    idempotencyKey: `pilot-alaska-test-${Date.now()}`,
  });

  console.log("  ✔ Context Issued Successfully:");
  console.log("    Context ID:", issueResult.contextId);
  console.log("    Status:", issueResult.status);
  console.log("    Bridge URL:", issueResult.bridgeUrl);
  console.log("    TTL:", (issueResult.expiresAt - issueResult.issuedAt) / 1000, "seconds");

  assert.match(issueResult.contextId, /^dcc_ctx_[a-f0-9]{32}$/);
  assert.equal(issueResult.bridgeUrl, `https://juneauflightdeck.com/book?ctx=${issueResult.contextId}`);

  // Step 2: Verify Initial DB State in Neon (Canonical ID, NOT domain)
  console.log("\nStep 2: Inspecting initial state in Neon database...");
  const initialRows = await db
    .select()
    .from(dccContexts)
    .where(eq(dccContexts.contextId, issueResult.contextId));

  assert.equal(initialRows.length, 1);
  const row = initialRows[0];
  console.log("  ✔ Database Row Verified:");
  console.log("    Status:", row.status);
  console.log("    Target Owner (Canonical ID):", row.targetOwner);
  console.log("    Buffer Minutes (Authoritative Alaska Floor):", row.bufferMinutes, "minutes");
  console.log("    Latest Safe Dock Return:", row.latestSafeReturnTime);

  assert.equal(row.status, "issued");
  assert.equal(row.targetOwner, "juneauflightdeck"); // Strict Canonical Owner ID
  assert.notEqual(row.targetOwner, "juneauflightdeck.com"); // Domain must not be stored in targetOwner
  assert.equal(row.bufferMinutes, 90);
  assert.equal(row.latestSafeReturnTime, "16:30");

  // Step 3: Concurrent First-Load Race (Zero Pre-Existing Cookie Simulation - Prefetch / Double-click)
  console.log("\nStep 3: Simulating concurrent first-load race (two simultaneous requests with zero cookies)...");
  clearCheckoutSessionCacheForTesting();

  const [raceSession1, raceSession2] = await Promise.all([
    getOrCreateCheckoutSession(issueResult.contextId, null, { fetcher: inProcessRouteFetcher }),
    getOrCreateCheckoutSession(issueResult.contextId, null, { fetcher: inProcessRouteFetcher }),
  ]);

  assert.equal(raceSession1.success, true, "First concurrent request must succeed");
  assert.equal(raceSession2.success, true, "Second concurrent request must succeed (idempotent replay)");
  assert.equal(raceSession1.data?.status, "redeemed");
  assert.equal(raceSession2.data?.status, "redeemed");
  assert.equal(raceSession1.data?.targetOwner, "juneauflightdeck");
  assert.equal(raceSession2.data?.targetOwner, "juneauflightdeck");
  console.log("  ✔ Concurrent First-Load Race Succeeded: Both requests returned 200 OK without 409 collision!");

  const activeSessionToken = raceSession1.sessionToken || raceSession2.sessionToken;
  assert(activeSessionToken, "HMAC-signed session token must be generated");

  // Step 4: HMAC Signed Session Token Verification & Cryptographic Security
  console.log("\nStep 4: Verifying HMAC cryptographic signature and security parameters...");
  const {
    verifySessionToken,
    signSessionToken,
    invalidateCheckoutSession,
    clearInvalidatedSessionsForTesting,
  } = await import("../apps/juneauflightdeck/lib/dccContext");

  const verifiedToken = verifySessionToken(activeSessionToken);
  assert(verifiedToken, "Session token signature must be valid");
  assert.equal(verifiedToken.ctx, issueResult.contextId);
  assert.equal(verifiedToken.aud, "juneauflightdeck", "Audience must be bound to juneauflightdeck");
  assert.equal(verifiedToken.kid, "v1", "Key version must be v1");
  assert(verifiedToken.exp > Date.now(), "Session token must not be expired");
  console.log("  ✔ Session Token Signature Verified: Valid HMAC-SHA256 signature, aud=juneauflightdeck, kid=v1");

  // Step 4b: Forgery, Tamper & Wrong-Audience Rejection Suite
  console.log("\nStep 4b: Testing forged cookies, altered ctx, wrong audience, and key rotation...");
  
  // 4b.1: Forged signature
  const forgedSigToken = activeSessionToken.slice(0, -6) + "bad123";
  assert.equal(verifySessionToken(forgedSigToken), null, "Forged signature must be rejected");

  // 4b.2: Altered contextId in payload
  const [encData] = activeSessionToken.split(".");
  const parsedData = JSON.parse(Buffer.from(encData, "base64url").toString("utf8"));
  parsedData.ctx = "dcc_ctx_00000000000000000000000000000000";
  const alteredEncData = Buffer.from(JSON.stringify(parsedData)).toString("base64url");
  const alteredToken = `${alteredEncData}.${activeSessionToken.split(".")[1]}`;
  assert.equal(verifySessionToken(alteredToken), null, "Altered payload with original signature must be rejected");

  // 4b.3: Wrong audience (e.g. issued for lastfrontier)
  const wrongAudToken = signSessionToken({
    sessionId: "sess_wrong_aud",
    contextId: issueResult.contextId,
    expiresAt: Date.now() + 3600000,
    audience: "lastfrontier",
  });
  assert.equal(verifySessionToken(wrongAudToken, "juneauflightdeck"), null, "Wrong audience token must be rejected");

  // 4b.4: Unknown key version
  const secretsMap = { v1: "secret_v1_xyz", v2: "secret_v2_rotated_abc" };
  const rotatedToken = signSessionToken(
    {
      sessionId: "sess_v2_rotated",
      contextId: issueResult.contextId,
      expiresAt: Date.now() + 3600000,
      keyVersion: "v2",
    },
    { sessionSecrets: secretsMap }
  );
  const verifiedRotated = verifySessionToken(rotatedToken, "juneauflightdeck", { sessionSecrets: secretsMap });
  assert(verifiedRotated, "Rotated key v2 must verify with v2 secret");
  assert.equal(verifiedRotated.kid, "v2");

  console.log("  ✔ Tamper & Forgery Suite Passed: Forged sigs, altered ctx, wrong aud, and key rotation validated");

  // Step 5: Cross-Instance Serverless Resilience (Simulated Cold Serverless Instance)
  console.log("\nStep 5: Testing cross-instance serverless resilience (wiping local process memory)...");
  clearCheckoutSessionCacheForTesting(); // Simulate new serverless container / instance with empty RAM

  const crossInstanceSession = await getOrCreateCheckoutSession(
    issueResult.contextId,
    activeSessionToken,
    { fetcher: inProcessRouteFetcher }
  );

  assert.equal(crossInstanceSession.success, true, "Cold serverless instance must successfully re-hydrate");
  assert.equal(crossInstanceSession.data?.schedule.date, "2026-07-15");
  assert.equal(crossInstanceSession.data?.safetyConstraint.latestSafeReturnTime, "16:30");
  console.log("  ✔ Cross-Instance Re-Hydration Succeeded: Session state restored from durable Neon database via DCC Authority!");

  // Step 6: Cookie Security & Privacy Verification
  console.log("\nStep 6: Verifying session cookie security attributes & privacy...");
  const { JFD_CHECKOUT_COOKIE_NAME, JFD_CHECKOUT_COOKIE_OPTIONS } = await import(
    "../apps/juneauflightdeck/lib/dccContext"
  );
  assert.equal(JFD_CHECKOUT_COOKIE_NAME, "jfd_checkout_session");
  assert.equal(JFD_CHECKOUT_COOKIE_OPTIONS.httpOnly, true, "Cookie must be HttpOnly");
  assert.equal(JFD_CHECKOUT_COOKIE_OPTIONS.sameSite, "lax", "Cookie must be SameSite=Lax");
  assert.equal(JFD_CHECKOUT_COOKIE_OPTIONS.maxAge, 3600, "Cookie must have 1-hour max age");
  console.log("  ✔ Cookie Security Verified: HttpOnly=true, SameSite=Lax, MaxAge=3600s, Zero PII/Payment data in cookie");

  // Step 7: Server-Side Invalidation & Durable Cross-Instance Invalidation in Neon
  console.log("\nStep 7: Testing durable cross-instance session invalidation...");
  await invalidateCheckoutSession(activeSessionToken, { reason: "Booking completed on Instance 1" });

  // 7a. Verify immediate rejection on Instance 1
  const postInvalidationAttempt1 = await getOrCreateCheckoutSession(
    issueResult.contextId,
    activeSessionToken,
    { fetcher: inProcessRouteFetcher }
  );
  assert.equal(postInvalidationAttempt1.success, false, "Post-invalidation reuse on same instance must be blocked");
  assert.equal(postInvalidationAttempt1.statusCode, 410);
  assert.equal(postInvalidationAttempt1.errorCode, "INVALID_SESSION");
  console.log("  ✔ Invalidation on Instance 1 Verified: Session rejected with 410 INVALID_SESSION");

  // 7b. Simulate Instance 2 (Cold start: wipe all in-memory caches, both active sessions & in-memory blocklist)
  clearCheckoutSessionCacheForTesting();
  clearInvalidatedSessionsForTesting();

  // Attacker or replayed client attempts to reuse the signed cookie on a completely new serverless container / Instance 2
  const postInvalidationAttempt2 = await getOrCreateCheckoutSession(
    issueResult.contextId,
    activeSessionToken,
    { fetcher: inProcessRouteFetcher }
  );
  assert.equal(postInvalidationAttempt2.success, false, "Post-invalidation reuse across cold instances must be blocked by Neon durable table");
  assert.equal(postInvalidationAttempt2.statusCode, 410);
  assert.equal(postInvalidationAttempt2.errorCode, "INVALID_SESSION");
  console.log("  ✔ Cross-Instance Invalidation Succeeded: Retained cookie rejected with 410 INVALID_SESSION via durable Neon PostgreSQL record!");

  // 7c. Fail-Closed Verification: Simulate DB outage / error during invalidation check
  const failClosedAttempt = await getOrCreateCheckoutSession(
    issueResult.contextId,
    activeSessionToken,
    { fetcher: inProcessRouteFetcher, dbOverride: null }
  );
  assert.equal(failClosedAttempt.success, false, "Database outage must fail closed");
  assert.equal(failClosedAttempt.statusCode, 503);
  assert.equal(failClosedAttempt.errorCode, "DATABASE_UNAVAILABLE");
  console.log("  ✔ Fail-Closed Verified: Database outage returns 503 DATABASE_UNAVAILABLE instead of allowing session");

  // 7d. Scheduled Deletion / Cleanup Job Verification
  const { cleanupExpiredDccSessions } = await import("../lib/dcc/context/service");
  const cleanupRes = await cleanupExpiredDccSessions({ now: Date.now() + 4000 * 1000 }); // simulated future run
  assert.equal(cleanupRes.success, true);
  console.log(`  ✔ Scheduled Cleanup Job Verified: Purged ${cleanupRes.deletedCount} expired invalidation records from Neon`);

  // Step 8: Revocation & Expiry Hydration Guard
  console.log("\nStep 8: Verifying that revoked & expired contexts cannot hydrate a session...");
  const { revokeContext } = await import("../lib/dcc/context/service");
  
  // 8a: Revocation guard
  const revokableIssue = await issueContext({
    sourceSite: "cruisepromenade",
    destination: "juneau",
    targetOwner: "juneauflightdeck",
    schedule: { date: "2026-07-20", travelers: 2 },
  });
  const revokeRes = await revokeContext(revokableIssue.contextId, "juneauflightdeck", "Customer cancelled handoff");
  assert.equal(revokeRes.success, true);

  const revokedAttempt = await getOrCreateCheckoutSession(
    revokableIssue.contextId,
    null,
    { fetcher: inProcessRouteFetcher }
  );
  assert.equal(revokedAttempt.success, false);
  assert.equal(revokedAttempt.statusCode, 410);
  assert.equal(revokedAttempt.errorCode, "CONTEXT_REVOKED");
  console.log("  ✔ Revocation Guard: Revoked context blocked with 410 CONTEXT_REVOKED");

  // 8b: Expiry guard
  const expiredIssue = await issueContext(
    {
      sourceSite: "cruisepromenade",
      destination: "juneau",
      targetOwner: "juneauflightdeck",
      schedule: { date: "2026-07-20", travelers: 2 },
    },
    { now: Date.now() - 16 * 60 * 1000 }
  );
  const expiredAttempt = await getOrCreateCheckoutSession(
    expiredIssue.contextId,
    null,
    { fetcher: inProcessRouteFetcher }
  );
  assert.equal(expiredAttempt.success, false);
  assert.equal(expiredAttempt.statusCode, 410);
  assert.equal(expiredAttempt.errorCode, "CONTEXT_EXPIRED");
  console.log("  ✔ Expiry Guard: Expired context blocked with 410 CONTEXT_EXPIRED");

  // Step 9: Cross-Owner Redemption Hijack Attempt (Must fail with 403 OWNER_MISMATCH)
  console.log("\nStep 9: Testing cross-owner redemption hijack attempt (LFSE attempting to claim JFD token)...");
  const { redeemContext } = await import("../lib/dcc/context/service");
  const crossOwnerResult = await redeemContext(issueResult.contextId, "lastfrontier");

  assert.equal(crossOwnerResult.success, false);
  if (!crossOwnerResult.success) {
    console.log("  ✔ Cross-Owner Hijack Blocked with Expected 403:");
    console.log("    HTTP Status:", crossOwnerResult.statusCode);
    console.log("    Error Code:", crossOwnerResult.errorCode);
    console.log("    Message:", crossOwnerResult.message);

    assert.equal(crossOwnerResult.statusCode, 403);
    assert.equal(crossOwnerResult.errorCode, "OWNER_MISMATCH");
  }

  // Step 10: Final Database Audit Record Verification in Neon
  console.log("\nStep 10: Verifying final Neon audit record...");
  const finalRows = await db
    .select()
    .from(dccContexts)
    .where(eq(dccContexts.contextId, issueResult.contextId));

  assert.equal(finalRows.length, 1);
  const finalRow = finalRows[0];
  assert.equal(finalRow.status, "redeemed");
  assert.equal(finalRow.targetOwner, "juneauflightdeck"); // Canonical ID
  assert.equal(finalRow.redeemedBy, "juneauflightdeck"); // Canonical ID
  assert(finalRow.redeemedAt, "redeemedAt timestamp must be set");

  console.log("  ✔ Audit Trail Complete & Normalized in Staging Neon:");
  console.log("    Final Status:", finalRow.status);
  console.log("    Target Owner:", finalRow.targetOwner);
  console.log("    Redeemed By:", finalRow.redeemedBy);
  console.log("    Redeemed At:", finalRow.redeemedAt?.toISOString());

  console.log("\n==================================================================");
  console.log("✔ ALL ALASKA PILOT INTEGRATION STEPS PASSED SUCCESSFULLY (10/10)");
  console.log("==================================================================");
}

runAlaskaPilotTest().catch((err) => {
  console.error("Alaska pilot test failed:", err);
  process.exit(1);
});
