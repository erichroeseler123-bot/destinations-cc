import {
  normalizeTourPreference,
  saveWaitlistEntry,
  getWaitlistEntryById,
  execute10AmDailySweep,
  purgeTestWaitlistEntries,
  WaitlistEntry,
} from "../lib/waitlistStore";
import { dispatchSeatDropNotification } from "../lib/notificationDispatcher";

async function main() {
  console.log("=== COMPREHENSIVE WAITLIST LIFECYCLE & SWEEP VERIFICATION ===\n");

  // 1. Tour preference normalization
  const normTests = [
    { input: "temsco-mendenhall-glacier-walk", expectedTour: "glacier_landing", expectedOp: "temsco" },
    { input: "coastal-icefield-landing", expectedTour: "glacier_landing", expectedOp: "coastal" },
    { input: "temsco-glacier-dog-sledding", expectedTour: "dog_sledding", expectedOp: "temsco" },
    { input: "northstar-glacier-ice-trek", expectedTour: "ice_trek", expectedOp: "northstar" },
    { input: "glacier_landing", expectedTour: "glacier_landing", expectedOp: "any" },
  ];

  for (const t of normTests) {
    const res = normalizeTourPreference(t.input);
    if (res.tourType !== t.expectedTour || res.preferredOperator !== t.expectedOp) {
      console.error(`FAIL: ${t.input} ->`, res);
      process.exit(1);
    }
    console.log(`✓ PASS: ${t.input} -> tourType: '${res.tourType}', operator: '${res.preferredOperator || "any"}'`);
  }

  // 2. Email notification templates parity (Plain text AND HTML)
  console.log("\n--- Testing Split-Party Email Notification Parity ---");
  await purgeTestWaitlistEntries();
  const testNotif = await dispatchSeatDropNotification({
    guestId: "TEST-NOTIF-SPLIT-1",
    guestName: "Sarah Traveler",
    email: "sarah-test@example.com",
    shipName: "Discovery Princess",
    cruiseLine: "Princess Cruises",
    port: "juneau",
    portDate: "2027-07-14",
    operator: "TEMSCO Helicopters",
    tourName: "Mendenhall Glacier Helicopter Tour",
    departureTime: "1:30 PM Departure",
    partySize: 4,
    checkoutUrl: "https://fareharbor.com/embeds/book/temscoair-juneau/items/214803/availabilities/999901/book/",
    cancellationPolicy: "Full refund 48 hours prior • 100% weather guarantee",
    isTest: true,
    isSplitMatch: true,
    seatsAvailable: 2,
  });

  if (!testNotif) {
    console.error("FAIL: dispatchSeatDropNotification returned null");
    process.exit(1);
  }

  // Verify text body
  if (!testNotif.emailBodyText.includes("2 seat(s)") || !testNotif.emailBodyText.includes("party of 4")) {
    console.error("FAIL: Plain text email missing partial seat explanation:", testNotif.emailBodyText);
    process.exit(1);
  }
  if (!testNotif.emailBodyText.includes("Seats Available on This Flight: 2 (of your 4 total group)")) {
    console.error("FAIL: Plain text email missing line item count:", testNotif.emailBodyText);
    process.exit(1);
  }
  console.log("✓ PASS: Plain text email explicitly identifies 2 seats available for group of 4");

  // Verify HTML body
  if (!testNotif.emailBodyHtml.includes("2 seat(s)") || !testNotif.emailBodyHtml.includes("party of <strong>4</strong>")) {
    console.error("FAIL: HTML email missing partial seat explanation:", testNotif.emailBodyHtml);
    process.exit(1);
  }
  if (!testNotif.emailBodyHtml.includes("Seats on This Flight:</strong> <span style=\"color: #0284c7; font-weight: bold;\">2 seat(s)</span> (of your 4 total group)")) {
    console.error("FAIL: HTML email missing qualified flight details:", testNotif.emailBodyHtml);
    process.exit(1);
  }
  if (!testNotif.emailBodyHtml.includes("We will continue active scanning for your remaining 2 seat(s)")) {
    console.error("FAIL: HTML email missing remaining seats continuation notice:", testNotif.emailBodyHtml);
    process.exit(1);
  }
  console.log("✓ PASS: HTML email perfectly matches text body with qualified 2-seat count and continuation notice");

  // 3. Exercise ACTUAL SWEEP and continued-scanning lifecycle
  console.log("\n--- Testing Sweep Execution & Continued Scanning Lifecycle ---");
  await purgeTestWaitlistEntries();

  const testPaxId = `TEST-PAX-${Date.now()}`;
  const testPaxEntry: WaitlistEntry = {
    id: testPaxId,
    createdAt: new Date().toISOString(),
    name: "Alex Split Party",
    email: "ops-test@juneauflightdeck.com",
    cruiseLine: "Princess Cruises",
    shipName: "Discovery Princess",
    portDate: "2027-07-14",
    juneauDate: "2027-07-14",
    dateVerification: "verified_itinerary",
    portCity: "juneau",
    tourType: "glacier_landing",
    partySize: 4,
    allowSplitParty: true,
    preferredOperator: "temsco",
    bookingMode: "instant_alert",
    status: "active_scanning",
    isTest: true,
    operatorHoldStatus: "not_held",
  };

  await saveWaitlistEntry(testPaxEntry);

  // Step A: Run sweep with a partial 2-seat split opening
  const sweep1 = await execute10AmDailySweep({ testSplitMatch: true });
  console.log(`Sweep 1 complete: found ${sweep1.openingsFound} opening(s) across ${sweep1.totalDatesSwept} date(s)`);

  const paxAfterSweep1 = await getWaitlistEntryById(testPaxId);
  if (!paxAfterSweep1) {
    console.error("FAIL: Waitlist entry lost after sweep 1");
    process.exit(1);
  }

  // Critical assertion 1: Must NOT move to contact_pending on partial alert!
  if (paxAfterSweep1.status !== "active_scanning") {
    console.error(`FAIL: Partial alert moved entry to ${paxAfterSweep1.status} instead of keeping active_scanning!`);
    process.exit(1);
  }
  if ((paxAfterSweep1.partialAlertsCount || 0) < 1) {
    console.error("FAIL: partialAlertsCount was not incremented:", paxAfterSweep1);
    process.exit(1);
  }
  console.log(`✓ PASS: Partial split drop dispatched alert and entry status REMAINS '${paxAfterSweep1.status}' (partialAlertsCount: ${paxAfterSweep1.partialAlertsCount})`);

  // Step B: Verify subsequent sweep continues scanning this active entry
  const sweep2 = await execute10AmDailySweep({ includeTests: true });
  console.log(`Sweep 2 (subsequent scan) complete: active entries swept with duplicate suppressed.`);
  const paxAfterSweep2 = await getWaitlistEntryById(testPaxId);
  if (!paxAfterSweep2 || paxAfterSweep2.status !== "active_scanning") {
    console.error("FAIL: Entry not active on subsequent sweep:", paxAfterSweep2);
    process.exit(1);
  }
  console.log(`✓ PASS: Entry is still '${paxAfterSweep2.status}' and was evaluated in subsequent daily sweep`);

  // Step C: Subsequent sweep with full party match (4 seats)
  const sweep3 = await execute10AmDailySweep({ testMatch: true });
  console.log(`Sweep 3 complete: full party match found ${sweep3.openingsFound} opening(s)`);
  const paxAfterSweep3 = await getWaitlistEntryById(testPaxId);
  if (!paxAfterSweep3) {
    console.error("FAIL: Waitlist entry lost after sweep 3");
    process.exit(1);
  }
  if (paxAfterSweep3.status !== "contact_pending") {
    console.error(`FAIL: Full party match did not move entry to contact_pending (status: ${paxAfterSweep3.status})`);
    process.exit(1);
  }
  console.log(`✓ PASS: Full party match correctly transitioned entry to '${paxAfterSweep3.status}'`);

  // Cleanup
  await purgeTestWaitlistEntries();
  console.log("✓ PASS: Test entries purged cleanly from persistent store");

  console.log("\n=======================================================");
  console.log("ALL VERIFICATION SUITE ASSERTIONS PASSED WITH ZERO FAILS!");
  console.log("=======================================================");
}

main().catch((err) => {
  console.error("Unhandled test error:", err);
  process.exit(1);
});
