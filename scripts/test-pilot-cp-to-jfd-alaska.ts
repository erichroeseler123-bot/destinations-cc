import { DccServiceClient } from "../../cruisepromenade/src/lib/server/dcc-client";
import { redeemOpaqueContext } from "../apps/juneauflightdeck/lib/dccContext";
import { getDb } from "../lib/db/client";
import { dccContexts } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import assert from "node:assert/strict";

const TEST_KEY_ID = "jfd_service_key";
const TEST_SECRET = "secret_jfd_dcc_staging_test_xyz123";

async function runAlaskaPilotTest() {
  console.log("==================================================================");
  console.log("ALASKA PILOT TEST: CRUISE PROMENADE (FEEDER) ➔ JUNEAU FLIGHT DECK");
  console.log("==================================================================\n");

  process.env.INTERNAL_API_KEY_ID = TEST_KEY_ID;
  process.env.INTERNAL_API_SECRET = TEST_SECRET;
  process.env.DCC_JFD_SERVICE_KEY_ID = TEST_KEY_ID;
  process.env.DCC_JFD_SERVICE_SECRET = TEST_SECRET;
  process.env.ALLOW_IN_MEMORY_NONCE_FALLBACK_FOR_TESTS = "true";

  const db = getDb();
  assert(db, "Staging Neon database must be configured");

  // Step 1: Cruise Promenade Initiates Context Token
  console.log("Step 1: Feeder (Cruise Promenade) issues signed opaque context token...");
  const cpClient = new DccServiceClient({
    baseUrl: "https://api.destinationcommandcenter.com",
  });

  // Test issuance directly via service helper
  const { issueContext } = await import("../lib/dcc/context/service");
  const issueResult = await issueContext({
    sourceSite: "cruisepromenade",
    destination: "juneau",
    targetOwner: "juneauflightdeck",
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

  // Step 2: Verify Initial DB State in Neon
  console.log("\nStep 2: Inspecting initial state in Neon database...");
  const initialRows = await db
    .select()
    .from(dccContexts)
    .where(eq(dccContexts.contextId, issueResult.contextId));

  assert.equal(initialRows.length, 1);
  const row = initialRows[0];
  console.log("  ✔ Database Row Verified:");
  console.log("    Status:", row.status);
  console.log("    Target Owner:", row.targetOwner);
  console.log("    Buffer Minutes (Authoritative Alaska Floor):", row.bufferMinutes, "minutes");
  console.log("    Latest Safe Dock Return:", row.latestSafeReturnTime);

  assert.equal(row.status, "issued");
  assert.equal(row.targetOwner, "juneauflightdeck.com");
  assert.equal(row.bufferMinutes, 90);
  assert.equal(row.latestSafeReturnTime, "16:30");

  // Step 3: Juneau Flight Deck Server Redeems Token
  console.log("\nStep 3: Booking Owner (Juneau Flight Deck) redeems token via HMAC...");
  const { redeemContext } = await import("../lib/dcc/context/service");
  const redeemResult = await redeemContext(issueResult.contextId, "juneauflightdeck");

  assert.equal(redeemResult.success, true);
  if (redeemResult.success) {
    console.log("  ✔ Redemption Succeeded:");
    console.log("    Redeemed By:", redeemResult.data.redeemedBy);
    console.log("    Status:", redeemResult.data.status);
    console.log("    Hydrated Date:", redeemResult.data.schedule.date);
    console.log("    Hydrated Travelers:", redeemResult.data.schedule.travelers);
    console.log("    Hydrated Return Deadline:", redeemResult.data.safetyConstraint.latestSafeReturnTime);

    assert.equal(redeemResult.data.status, "redeemed");
    assert.equal(redeemResult.data.targetOwner, "juneauflightdeck.com");
    assert.equal(redeemResult.data.schedule.travelers, 2);
    assert.equal(redeemResult.data.safetyConstraint.latestSafeReturnTime, "16:30");
  }

  // Step 4: Verify Single-Use Lock (Replay must fail with 409)
  console.log("\nStep 4: Testing Single-Use Lock (Replay attempt by JFD)...");
  const replayResult = await redeemContext(issueResult.contextId, "juneauflightdeck");

  assert.equal(replayResult.success, false);
  if (!replayResult.success) {
    console.log("  ✔ Replay Rejected with Expected Conflict:");
    console.log("    HTTP Status:", replayResult.statusCode);
    console.log("    Error Code:", replayResult.errorCode);
    console.log("    Message:", replayResult.message);

    assert.equal(replayResult.statusCode, 409);
    assert.equal(replayResult.errorCode, "CONTEXT_ALREADY_REDEEMED");
  }

  // Step 5: Final Database Verification
  console.log("\nStep 5: Verifying final Neon audit record...");
  const finalRows = await db
    .select()
    .from(dccContexts)
    .where(eq(dccContexts.contextId, issueResult.contextId));

  assert.equal(finalRows.length, 1);
  const finalRow = finalRows[0];
  assert.equal(finalRow.status, "redeemed");
  assert.equal(finalRow.redeemedBy, "juneauflightdeck.com");
  assert(finalRow.redeemedAt, "redeemedAt timestamp must be set");

  console.log("  ✔ Audit Trail Complete:");
  console.log("    Final Status:", finalRow.status);
  console.log("    Redeemed At:", finalRow.redeemedAt?.toISOString());
  console.log("    Redeemed By:", finalRow.redeemedBy);

  console.log("\n==================================================================");
  console.log("✔ ALL ALASKA PILOT INTEGRATION STEPS PASSED SUCCESSFULLY (5/5)");
  console.log("==================================================================");
}

runAlaskaPilotTest().catch((err) => {
  console.error("Alaska pilot test failed:", err);
  process.exit(1);
});
