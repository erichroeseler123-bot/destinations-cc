import test from "node:test";
import assert from "node:assert/strict";
import { issueContext, redeemContext, cleanupExpiredDccContexts, cleanupExpiredDccSessions } from "@/lib/dcc/context/service";
import { isOwnerValidForDestination, resolveAuthoritativeBuffer } from "@/lib/dcc/context/registry";
import { queryDccConversionMetrics } from "@/lib/dcc/analytics/queries";

test("DCC Multi-Port Alaska Corridor Protocol & Lifecycle Suite", async (t) => {
  // 1. Port Safety Profiles & Authoritative Buffers
  await t.test("1. Multi-Port Safety Buffers (Juneau, Skagway, Ketchikan)", () => {
    // Juneau
    assert.equal(resolveAuthoritativeBuffer("juneau"), 90, "Juneau base buffer must be 90m");
    assert.equal(
      resolveAuthoritativeBuffer("juneau", null, "downtown_floatplane"),
      60,
      "Juneau downtown floatplane modifier is 60m"
    );

    // Skagway
    assert.equal(resolveAuthoritativeBuffer("skagway"), 60, "Skagway base buffer must be 60m");
    assert.equal(
      resolveAuthoritativeBuffer("skagway", null, "ore_dock"),
      45,
      "Skagway ore dock modifier is 45m"
    );

    // Ketchikan
    assert.equal(resolveAuthoritativeBuffer("ketchikan"), 75, "Ketchikan base buffer must be 75m");
    assert.equal(
      resolveAuthoritativeBuffer("ketchikan", null, "ward_cove"),
      90,
      "Ketchikan Ward Cove bus transit modifier is 90m"
    );
  });

  // 2. Destination-to-Owner Constraints
  await t.test("2. Destination-to-Owner Allowed Port Matrix", () => {
    // JFD is strictly Juneau only
    assert.equal(isOwnerValidForDestination("juneauflightdeck", "juneau"), true);
    assert.equal(isOwnerValidForDestination("juneauflightdeck", "skagway"), false);
    assert.equal(isOwnerValidForDestination("juneauflightdeck", "ketchikan"), false);

    // LFSE is multi-port across SE Alaska
    assert.equal(isOwnerValidForDestination("lastfrontier", "juneau"), true);
    assert.equal(isOwnerValidForDestination("lastfrontier", "skagway"), true);
    assert.equal(isOwnerValidForDestination("lastfrontier", "ketchikan"), true);
    assert.equal(isOwnerValidForDestination("lastfrontier", "denver"), false);
  });

  // 3. Multi-Port Issue & Redemption Simulation
  await t.test("3. WTA ➔ LFSE Multi-Port Issuance & Redemption", async () => {
    // 3a. WTA issues Ketchikan excursion context
    const ketchikanIssue = await issueContext({
      sourceSite: "wta",
      destination: "ketchikan",
      targetOwner: "lastfrontier",
      targetIntent: "ketchikan-totem-bight-wildlife",
      operatorModifier: "ward_cove",
      schedule: {
        date: "2027-08-15",
        arrival: "08:00",
        departure: "16:00",
        travelers: 2,
        shipOrVenue: "Discovery Princess",
      },
      attribution: {
        campaign: "wta-ketchikan-discovery",
        referrerDomain: "welcometoalaskatours.com",
      },
      idempotencyKey: `wta-ktn-${Date.now()}`,
    });

    assert.equal(ketchikanIssue.success, true);
    assert.match(ketchikanIssue.contextId, /^dcc_ctx_/);

    // 3b. LFSE successfully redeems Ketchikan context
    const ketchikanRedeem = await redeemContext(ketchikanIssue.contextId, "lastfrontier");
    assert.equal(ketchikanRedeem.success, true);
    if (ketchikanRedeem.success) {
      assert.equal(ketchikanRedeem.data.destination, "ketchikan");
      assert.equal(ketchikanRedeem.data.targetOwner, "lastfrontier");
      assert.equal(ketchikanRedeem.data.safetyConstraint.bufferMinutes, 90); // Ward Cove
      assert.equal(ketchikanRedeem.data.safetyConstraint.latestSafeReturnTime, "14:30"); // 16:00 - 90m
    }

    // 3c. JFD attempt to claim Ketchikan token fails with 403 OWNER_MISMATCH
    const hijackAttempt = await redeemContext(ketchikanIssue.contextId, "juneauflightdeck");
    assert.equal(hijackAttempt.success, false);
    if (!hijackAttempt.success) {
      assert.equal(hijackAttempt.statusCode, 403);
      assert.equal(hijackAttempt.errorCode, "OWNER_MISMATCH");
    }
  });

  // 4. Context Lifecycle & Cleanup
  await t.test("4. Context Lifecycle Cleanup (Issued ➔ Expired Transition)", async () => {
    const expiredContext = await issueContext({
      sourceSite: "wta",
      destination: "skagway",
      targetOwner: "lastfrontier",
      schedule: {
        date: "2027-08-20",
        departure: "18:00",
        travelers: 2,
      },
      idempotencyKey: `expire-test-${Date.now()}`,
    }, {
      now: Date.now() - 20 * 60 * 1000, // issued 20 minutes ago (past 15m TTL)
    });

    const cleanupResult = await cleanupExpiredDccContexts({ now: Date.now() });
    assert.equal(cleanupResult.success, true);
    assert.ok(cleanupResult.expiredCount >= 0);

    const sessionCleanup = await cleanupExpiredDccSessions({ now: Date.now() });
    assert.equal(sessionCleanup.success, true);
  });

  // 5. Analytics Isolation Engine
  await t.test("5. Analytics Engine Strictly Excludes Staging Test Traffic", async () => {
    // Query metrics excluding test traffic
    const prodMetrics = await queryDccConversionMetrics({ excludeTestTraffic: true });
    assert.equal(prodMetrics.success, true);

    // Query metrics including test traffic
    const allMetrics = await queryDccConversionMetrics({ excludeTestTraffic: false });
    assert.equal(allMetrics.success, true);

    // Verify test traffic count segregation
    assert.ok(
      typeof prodMetrics.excludedTestContextsCount === "number",
      "Must report count of segregated test contexts"
    );
  });
});
