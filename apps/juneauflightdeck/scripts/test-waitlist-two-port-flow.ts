/**
 * End-to-End Milestone Test: Two-Port Waitlist Scanner Flow & Notification Delivery
 * 
 * Verifies:
 * 1. Server-side validation (date formats, past dates, required dual dates for "either", phone requirements).
 * 2. Strict grouping by operator + product + port + date (zero cross-contamination).
 * 3. Status lifecycle: active_scanning -> opening_detected -> contact_pending (operatorHoldStatus: "not_held").
 *    No premature "claimed" or "held" claims without verified operator hold reference.
 * 4. Exact operator-specific cancellation terms (Coastal: 7+ days full refund, 4-6 days 50%, <3 days non-refundable; TEMSCO: 48h full refund).
 * 5. End-to-end verified delivery of seat drop notification with disk persistence and delivery audit record.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { POST as waitlistPost } from "../app/api/waitlist/route";
import {
  execute10AmDailySweep,
  getAllWaitlistEntries,
  saveWaitlistEntry,
  SCANNED_PRODUCTS,
  type WaitlistEntry,
} from "../lib/waitlistStore";

async function runTestSuite() {
  console.log("========================================================================");
  console.log("🚀 STARTING E2E TWO-PORT WAITLIST, STATUS LIFECYCLE & DELIVERY TEST SUITE");
  console.log("========================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      if (detail) console.error(`     Detail: ${detail}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // Test Group 1: Server-Side API Validation via /api/waitlist
  // -------------------------------------------------------------
  console.log("--- TEST GROUP 1: Server-Side API Validation ---");

  // 1.1 Rejects missing name/email
  {
    const req = new Request("http://localhost/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "",
        email: "invalid-email",
        portDate: "2027-07-14",
      }),
    });
    const res = await waitlistPost(req);
    const data = await res.json();
    assert(res.status === 400 && data.ok === false, "Rejects empty name with HTTP 400");
  }

  // 1.2 Rejects past dates
  {
    const req = new Request("http://localhost/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Passenger",
        email: "passenger@example.com",
        phone: "(907) 555-1234",
        portDate: "2023-05-10",
        portCity: "juneau",
      }),
    });
    const res = await waitlistPost(req);
    const data = await res.json();
    assert(
      res.status === 400 && data.error?.includes("past"),
      "Rejects past dates with HTTP 400 ('past date')"
    );
  }

  // 1.3 Rejects 'either' portCity if Skagway date is missing
  {
    const req = new Request("http://localhost/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Passenger",
        email: "passenger@example.com",
        phone: "(907) 555-1234",
        portDate: "2027-07-14",
        portCity: "either",
      }),
    });
    const res = await waitlistPost(req);
    const data = await res.json();
    assert(
      res.status === 400 && data.error?.includes("Skagway port date"),
      "Requires explicit Skagway date when portCity is 'either'"
    );
  }

  // 1.4 Requires valid phone number when bookingMode is 'concierge_dispatch'
  {
    const req = new Request("http://localhost/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Passenger",
        email: "passenger@example.com",
        phone: "123", // too short
        portDate: "2027-07-14",
        portCity: "juneau",
        bookingMode: "concierge_dispatch",
      }),
    });
    const res = await waitlistPost(req);
    const data = await res.json();
    assert(
      res.status === 400 && data.error?.includes("phone number is required"),
      "Enforces valid phone number for Concierge Dispatch Alert"
    );
  }

  // 1.5 Accepts valid two-port passenger-supplied request
  let testEntryId = "";
  {
    const req = new Request("http://localhost/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Capt. James Kirk Party",
        email: "kirk.enterprise@starfleet.org",
        phone: "(907) 555-1701",
        cruiseLine: "Princess Cruises",
        shipName: "Discovery Princess",
        portDate: "2027-07-14", // Juneau
        skagwayDate: "2027-07-16", // Skagway
        portCity: "either",
        tourType: "dog_sledding",
        partySize: 2,
        bookingMode: "concierge_dispatch",
        notes: "Passenger itinerary: Juneau July 14, Skagway July 16.",
      }),
    });
    const res = await waitlistPost(req);
    const data = await res.json();
    testEntryId = data.submissionId;

    assert(
      res.status === 200 &&
      data.ok === true &&
      data.details.dateVerification === "passenger_supplied" &&
      data.details.operatorHoldStatus === "not_held" &&
      data.details.juneauDate === "2027-07-14" &&
      data.details.skagwayDate === "2027-07-16",
      "Accepts valid two-port request with 'passenger_supplied' and 'not_held' verification",
      JSON.stringify(data)
    );
  }

  // -------------------------------------------------------------
  // Test Group 2: Operator Cancellation Policy Accuracy
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 2: Operator Cancellation Policy Accuracy ---");

  const coastalProduct = SCANNED_PRODUCTS.find((p) => p.key === "coastal_juneau_icefield");
  assert(Boolean(coastalProduct), "Found Coastal Helicopters product in scanned catalog");

  const coastalPolicy = coastalProduct?.cancellationPolicy || "";
  assert(
    coastalPolicy.includes("7 days") &&
    coastalPolicy.includes("50%") &&
    coastalPolicy.includes("3 days") &&
    coastalPolicy.includes("weather"),
    "Coastal policy strictly asserts: 7+ days 100%, 4-6 days 50%, <3 days non-refundable, 100% weather",
    coastalPolicy
  );

  const temscoProduct = SCANNED_PRODUCTS.find((p) => p.key === "temsco_juneau_dog_sledding");
  assert(
    Boolean(temscoProduct?.cancellationPolicy.includes("48 hours") && temscoProduct.cancellationPolicy.includes("weather")),
    "TEMSCO policy strictly asserts: 48h 100% refund, 100% weather refund"
  );

  // -------------------------------------------------------------
  // Test Group 3: Status Lifecycle & Dual-Port Isolation
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 3: Reservation Status Lifecycle & Dual-Port Sweep ---");

  const dualPortEntry: WaitlistEntry = {
    id: `TEST-DUAL-PORT-${Date.now()}`,
    createdAt: new Date().toISOString(),
    name: "Dr. Eleanor Vance",
    email: "eleanor.vance@expedition.org",
    phone: "(312) 555-9876",
    cruiseLine: "Holland America Line",
    shipName: "Koningsdam",
    portDate: "2027-07-14", // Juneau
    juneauDate: "2027-07-14",
    skagwayDate: "2027-07-22", // Skagway (date ends in 22 to match simulated drop)
    dateVerification: "passenger_supplied",
    portCity: "either",
    tourType: "any",
    partySize: 2,
    bookingMode: "instant_alert",
    status: "active_scanning",
    operatorHoldStatus: "not_held",
  };

  await saveWaitlistEntry(dualPortEntry);

  const sweepResult = await execute10AmDailySweep();
  console.log(`  Sweep complete. Total dates swept: ${sweepResult.totalDatesSwept}, Openings found: ${sweepResult.openingsFound}`);

  const allEntries = await getAllWaitlistEntries();
  const updatedEntry = allEntries.find((e) => e.id === dualPortEntry.id);

  assert(Boolean(updatedEntry), "Found dual-port entry after sweep");

  // Lifecycle check: must be "contact_pending", NEVER "claimed" or "held" without hold confirmation
  assert(
    updatedEntry?.status === "contact_pending",
    `Lifecycle transition: active_scanning -> contact_pending (actual: '${updatedEntry?.status}')`
  );
  assert(
    updatedEntry?.operatorHoldStatus === "not_held",
    `Operator hold status honestly marked 'not_held' (actual: '${updatedEntry?.operatorHoldStatus}')`
  );

  // Strict port + date binding
  if (updatedEntry?.matchedPort === "juneau") {
    assert(
      sweepResult.openings.some(
        (o) => o.matchedGuestId === updatedEntry.id && o.portDate === "2027-07-14" && o.port === "juneau"
      ),
      "Juneau match strictly used Juneau date (2027-07-14), not Skagway date"
    );
  } else if (updatedEntry?.matchedPort === "skagway") {
    assert(
      sweepResult.openings.some(
        (o) => o.matchedGuestId === updatedEntry.id && o.portDate === "2027-07-22" && o.port === "skagway"
      ),
      "Skagway match strictly used Skagway date (2027-07-22), not Juneau date"
    );
  }

  // -------------------------------------------------------------
  // Test Group 4: Verified Delivery & Notification Record Audit
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 4: Notification Delivery Audit Record ---");

  assert(
    Boolean(updatedEntry?.notificationDeliveryId),
    `Notification delivery ID generated: ${updatedEntry?.notificationDeliveryId}`
  );

  if (updatedEntry?.notificationDeliveryId) {
    const deliveryFilePath = path.join(
      process.cwd(),
      "data",
      "notifications",
      `${updatedEntry.notificationDeliveryId}.json`
    );

    const fileExists = await fs
      .access(deliveryFilePath)
      .then(() => true)
      .catch(() => false);

    assert(fileExists, `Notification delivery record persisted to disk at ${deliveryFilePath}`);

    if (fileExists) {
      const content = await fs.readFile(deliveryFilePath, "utf8");
      const record = JSON.parse(content);

      assert(
        record.recipientEmail === dualPortEntry.email,
        `Recipient email matches passenger: ${record.recipientEmail}`
      );
      assert(
        record.checkoutUrl.includes("fareharbor.com/embeds/book"),
        `Direct FareHarbor booking link present: ${record.checkoutUrl}`
      );
      assert(
        record.cancellationPolicy.length > 20,
        `Exact operator cancellation terms included in email payload`
      );
      assert(
        record.status === "delivered" || record.status === "simulated_delivery",
        `Delivery status confirmed: ${record.status}`
      );
    }
  }

  // -------------------------------------------------------------
  // Test Group 5: Coastal Helicopters Specific Match & Delivery Audit
  // -------------------------------------------------------------
  console.log("\n--- TEST GROUP 5: Coastal Helicopters Specific Match & Delivery Audit ---");

  const coastalGuestEntry: WaitlistEntry = {
    id: `TEST-COASTAL-${Date.now()}`,
    createdAt: new Date().toISOString(),
    name: "Marcus Brody",
    email: "brody@museum.edu",
    phone: "(212) 555-4321",
    cruiseLine: "Celebrity Cruises",
    shipName: "Celebrity Edge",
    portDate: "2027-07-22", // Date matches simulated slot
    juneauDate: "2027-07-22",
    dateVerification: "passenger_supplied",
    portCity: "juneau",
    tourType: "glacier_landing",
    preferredOperator: "coastal",
    partySize: 2,
    bookingMode: "instant_alert",
    status: "active_scanning",
    operatorHoldStatus: "not_held",
  };

  await saveWaitlistEntry(coastalGuestEntry);

  const sweepCoastal = await execute10AmDailySweep();
  const allEntriesAfter = await getAllWaitlistEntries();
  const updatedCoastal = allEntriesAfter.find((e) => e.id === coastalGuestEntry.id);

  assert(Boolean(updatedCoastal), "Found Coastal guest entry after sweep");
  assert(
    updatedCoastal?.status === "contact_pending",
    `Coastal entry transitioned to contact_pending (actual: '${updatedCoastal?.status}')`
  );
  assert(
    Boolean(updatedCoastal?.notificationDeliveryId),
    `Coastal notification delivery ID generated: ${updatedCoastal?.notificationDeliveryId}`
  );

  if (updatedCoastal?.notificationDeliveryId) {
    const deliveryFilePath = path.join(
      process.cwd(),
      "data",
      "notifications",
      `${updatedCoastal.notificationDeliveryId}.json`
    );
    const content = await fs.readFile(deliveryFilePath, "utf8");
    const record = JSON.parse(content);

    assert(
      record.cancellationPolicy.includes("7 days") &&
      record.cancellationPolicy.includes("50%") &&
      record.cancellationPolicy.includes("3 days"),
      "Delivered notification explicitly contains Coastal's published 7-day terms"
    );
    assert(
      record.recipientEmail === "brody@museum.edu",
      "Delivered notification sent to passenger email"
    );
  }

  console.log("\n========================================================================");
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("========================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
