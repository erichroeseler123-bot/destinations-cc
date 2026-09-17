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

  const activeSessionId = raceSession1.sessionId || raceSession2.sessionId;
  assert(activeSessionId, "Active checkout session ID must be generated");

  // Step 4: Session Cookie Hydration & Refresh Simulation
  console.log("\nStep 4: Simulating page refresh / back navigation with session cookie...");
  const sessionRefresh = await getOrCreateCheckoutSession(issueResult.contextId, activeSessionId, {
    fetcher: inProcessRouteFetcher,
  });

  assert.equal(sessionRefresh.success, true);
  assert.equal(sessionRefresh.isExistingSession, true);
  assert.equal(sessionRefresh.sessionId, activeSessionId);
  assert.equal(sessionRefresh.data?.schedule.date, "2026-07-15");
  console.log("  ✔ Refresh / Retry Survived without 409 Replay Collision (Loaded from active checkout session)");

  // Step 5: Cookie Security & Privacy Verification
  console.log("\nStep 5: Verifying session cookie security attributes & privacy...");
  const { JFD_CHECKOUT_COOKIE_NAME, JFD_CHECKOUT_COOKIE_OPTIONS } = await import(
    "../apps/juneauflightdeck/lib/dccContext"
  );
  assert.equal(JFD_CHECKOUT_COOKIE_NAME, "jfd_checkout_session");
  assert.equal(JFD_CHECKOUT_COOKIE_OPTIONS.httpOnly, true, "Cookie must be HttpOnly");
  assert.equal(JFD_CHECKOUT_COOKIE_OPTIONS.sameSite, "lax", "Cookie must be SameSite=Lax");
  assert.equal(JFD_CHECKOUT_COOKIE_OPTIONS.maxAge, 3600, "Cookie must have 1-hour max age");
  assert.match(activeSessionId, /^jfd_sess_/, "Cookie payload must be opaque session ID with zero traveler PII or payment data");
  console.log("  ✔ Cookie Security Verified: HttpOnly=true, SameSite=Lax, MaxAge=3600s, Zero PII/Payment data in cookie");

  // Step 6: Cross-Owner Redemption Hijack Attempt (Must fail with 403 OWNER_MISMATCH)
  console.log("\nStep 6: Testing cross-owner redemption hijack attempt (LFSE attempting to claim JFD token)...");
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

  // Step 7: Final Database Audit Record Verification in Neon
  console.log("\nStep 7: Verifying final Neon audit record...");
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
  console.log("✔ ALL ALASKA PILOT INTEGRATION STEPS PASSED SUCCESSFULLY (7/7)");
  console.log("==================================================================");
}

runAlaskaPilotTest().catch((err) => {
  console.error("Alaska pilot test failed:", err);
  process.exit(1);
});
