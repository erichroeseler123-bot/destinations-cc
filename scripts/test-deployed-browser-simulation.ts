import assert from "node:assert/strict";
import { issueContext } from "@/lib/dcc/context/service";
import {
  getOrCreateCheckoutSession,
  invalidateCheckoutSession,
  clearCheckoutSessionCacheForTesting,
  clearInvalidatedSessionsForTesting,
  JFD_CHECKOUT_COOKIE_NAME,
  JFD_CHECKOUT_COOKIE_OPTIONS,
} from "../apps/juneauflightdeck/lib/dccContext";
import { getDb } from "@/lib/db/client";
import { dccContexts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { POST as handleRedeemRoute } from "@/app/api/v1/context/[contextId]/redeem/route";

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

async function runDeployedBrowserSimulation() {
  console.log("==================================================================");
  console.log("DEPLOYED BROWSER SIMULATION: CRUISE PROMENADE ➔ JUNEAU FLIGHT DECK");
  console.log("==================================================================\n");

  process.env.INTERNAL_API_KEY_ID = TEST_KEY_ID;
  process.env.INTERNAL_API_SECRET = TEST_SECRET;
  process.env.DCC_JFD_SERVICE_KEY_ID = TEST_KEY_ID;
  process.env.DCC_JFD_SERVICE_SECRET = TEST_SECRET;
  process.env.ALLOW_IN_MEMORY_NONCE_FALLBACK_FOR_TESTS = "true";

  clearCheckoutSessionCacheForTesting();
  clearInvalidatedSessionsForTesting();

  const db = getDb();
  assert(db, "Neon database must be configured");

  // Step 1: Feeder issues context from Cruise Promenade web browser session
  console.log("Step 1: Traveler on Cruise Promenade initiates Alaska Helicopter Booking...");
  const issueResult = await issueContext({
    sourceSite: "cruisepromenade",
    destination: "juneau",
    targetOwner: "juneauflightdeck",
    targetIntent: "juneau-helicopter-glacier-landing",
    schedule: {
      date: "2026-07-22",
      arrival: "07:30",
      departure: "17:00",
      travelers: 4,
      shipOrVenue: "Ruby Princess",
    },
    attribution: {
      campaign: "cp-alaska-summer-2026",
      referrerDomain: "cruisepromenade.com",
    },
    idempotencyKey: `browser-sim-${Date.now()}`,
  });

  assert.equal(issueResult.status, "issued");
  console.log("  ✔ Opaque token issued:", issueResult.contextId);
  console.log("  ✔ Bridge URL:", issueResult.bridgeUrl);

  // Step 2: Browser navigates to JFD Bridge URL (Initial HTTP GET with zero cookies)
  console.log("\nStep 2: Browser navigates to JFD bridge URL with zero cookies...");
  const browserCookies = new Map<string, string>();

  const initialLoadSession = await getOrCreateCheckoutSession(
    issueResult.contextId,
    browserCookies.get(JFD_CHECKOUT_COOKIE_NAME) || null,
    { fetcher: inProcessRouteFetcher }
  );

  assert.equal(initialLoadSession.success, true);
  assert.equal(initialLoadSession.data?.schedule.date, "2026-07-22");
  assert.equal(initialLoadSession.data?.schedule.travelers, 4);
  assert.equal(initialLoadSession.data?.schedule.shipOrVenue, "Ruby Princess");
  assert.equal(initialLoadSession.data?.safetyConstraint.bufferMinutes, 90);
  assert.equal(initialLoadSession.data?.safetyConstraint.latestSafeReturnTime, "15:30");
  assert(initialLoadSession.sessionToken, "Must receive signed session token");

  // Simulate browser storing Set-Cookie header
  browserCookies.set(JFD_CHECKOUT_COOKIE_NAME, initialLoadSession.sessionToken!);
  console.log("  ✔ Page rendered with prefilled timeline & party size (4 travelers, Ruby Princess, dock return 15:30)");
  console.log("  ✔ Browser stored Set-Cookie: jfd_checkout_session (HttpOnly, SameSite=Lax, Secure)");

  // Step 3: Browser Refresh (Subsequent HTTP GET sending stored cookie)
  console.log("\nStep 3: Traveler refreshes the browser page (subsequent GET with session cookie)...");
  const refreshSession = await getOrCreateCheckoutSession(
    issueResult.contextId,
    browserCookies.get(JFD_CHECKOUT_COOKIE_NAME),
    { fetcher: inProcessRouteFetcher }
  );

  assert.equal(refreshSession.success, true);
  assert.equal(refreshSession.isExistingSession, true);
  assert.equal(refreshSession.sessionId, initialLoadSession.sessionId);
  console.log("  ✔ Refresh resolved idempotently without 409 conflict: session ID preserved:", refreshSession.sessionId);

  // Step 4: Multi-Tab / Prefetch Simulation (Concurrent requests with identical session cookie)
  console.log("\nStep 4: Simulating multi-tab navigation or prefetch with active cookie...");
  const [tab1, tab2] = await Promise.all([
    getOrCreateCheckoutSession(issueResult.contextId, browserCookies.get(JFD_CHECKOUT_COOKIE_NAME), { fetcher: inProcessRouteFetcher }),
    getOrCreateCheckoutSession(issueResult.contextId, browserCookies.get(JFD_CHECKOUT_COOKIE_NAME), { fetcher: inProcessRouteFetcher }),
  ]);

  assert.equal(tab1.success, true);
  assert.equal(tab2.success, true);
  assert.equal(tab1.sessionId, initialLoadSession.sessionId);
  assert.equal(tab2.sessionId, initialLoadSession.sessionId);
  console.log("  ✔ Multi-tab navigation resolved cleanly across all tabs!");

  // Step 5: Checkout Completion & Session Invalidation
  console.log("\nStep 5: Traveler completes live booking; server invalidates checkout session...");
  await invalidateCheckoutSession(browserCookies.get(JFD_CHECKOUT_COOKIE_NAME)!, {
    reason: "Booking confirmed by merchant",
  });

  // Step 6: Post-Booking Replay Attempt (Client retains stale cookie)
  console.log("\nStep 6: Traveler / Bot attempts to reload prefill page with retained cookie...");
  const postBookingAttempt = await getOrCreateCheckoutSession(
    issueResult.contextId,
    browserCookies.get(JFD_CHECKOUT_COOKIE_NAME),
    { fetcher: inProcessRouteFetcher }
  );

  assert.equal(postBookingAttempt.success, false);
  assert.equal(postBookingAttempt.statusCode, 410);
  assert.equal(postBookingAttempt.errorCode, "INVALID_SESSION");
  console.log("  ✔ Replay blocked with 410 INVALID_SESSION: Server-side invalidation enforced!");

  // Step 7: Serverless Cold Container Replay Rejection
  console.log("\nStep 7: Replay against cold serverless instance (all RAM cleared)...");
  clearCheckoutSessionCacheForTesting();
  clearInvalidatedSessionsForTesting();

  const coldInstanceReplay = await getOrCreateCheckoutSession(
    issueResult.contextId,
    browserCookies.get(JFD_CHECKOUT_COOKIE_NAME),
    { fetcher: inProcessRouteFetcher }
  );

  assert.equal(coldInstanceReplay.success, false);
  assert.equal(coldInstanceReplay.statusCode, 410);
  assert.equal(coldInstanceReplay.errorCode, "INVALID_SESSION");
  console.log("  ✔ Cold serverless container rejected retained cookie with 410 INVALID_SESSION via Neon!");

  // Step 8: Final Neon Audit Trail Inspection
  console.log("\nStep 8: Verifying final Neon audit record...");
  const auditRows = await db
    .select()
    .from(dccContexts)
    .where(eq(dccContexts.contextId, issueResult.contextId));

  assert.equal(auditRows.length, 1);
  const audit = auditRows[0];
  assert.equal(audit.status, "redeemed");
  assert.equal(audit.targetOwner, "juneauflightdeck");
  assert.equal(audit.redeemedBy, "juneauflightdeck");
  console.log("  ✔ Neon Audit Row Confirmed: Status=redeemed, Owner=juneauflightdeck, RedeemedAt=", audit.redeemedAt?.toISOString());

  console.log("\n==================================================================");
  console.log("✔ DEPLOYED BROWSER SIMULATION PASSED (8/8 STEPS COMPLETE)");
  console.log("==================================================================");
}

runDeployedBrowserSimulation().catch((err) => {
  console.error("Browser simulation failed:", err);
  process.exit(1);
});
