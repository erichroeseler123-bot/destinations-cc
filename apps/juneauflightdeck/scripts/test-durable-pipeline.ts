import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import { POST as waitlistPost } from "../app/api/waitlist/route";
import { execute10AmDailySweep, getAllWaitlistEntries, getTodayAlaskaDate } from "../lib/waitlistStore";
import { dispatchSeatDropNotification } from "../lib/notificationDispatcher";

dotenv.config({ path: "./.env.local" });

async function runDurablePipelineTests() {
  console.log("======================================================================");
  console.log("🧪 VERIFYING DURABLE STORAGE, DEDUPLICATION, & EXPIRED DATE FILTERING");
  console.log("======================================================================\n");

  const today = getTodayAlaskaDate();
  console.log(`Current Alaska Date: ${today}`);

  const sql = neon(process.env.DATABASE_URL!);

  // 1. Submit an availability alert via POST handler
  console.log("\n1. Testing submission with durable shared datastore persistence...");
  const testId = `JFD-TEST-${Date.now().toString(36).toUpperCase()}`;
  const submissionDate = "2027-08-25";

  const req = new Request("http://localhost/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Dr. Evelyn Reed",
      email: "evelyn.reed.test@example.com",
      phone: "(907) 555-8833",
      cruiseLine: "Princess Cruises",
      shipName: "Discovery Princess",
      portCity: "juneau",
      portDate: submissionDate,
      juneauDate: submissionDate,
      tourType: "glacier_landing",
      partySize: 2,
      bookingMode: "instant_alert",
      notes: "Testing durable storage pipeline",
    }),
  });

  const res = await waitlistPost(req);
  const data = await res.json();

  console.log(`   Response status: ${res.status}`);
  console.log(`   Submission ID: ${data.submissionId}`);
  console.log(`   Message returned: "${data.message}"`);

  if (!data.ok || !data.submissionId) {
    throw new Error(`Submission failed: ${JSON.stringify(data)}`);
  }

  // 2. Query Neon Postgres directly to prove persistent shared datastore storage
  console.log("\n2. Querying PostgreSQL directly to verify record in jfd_waitlist_submissions...");
  const dbRows = await sql`
    SELECT id, name, email, port_date, status, created_at
    FROM jfd_waitlist_submissions
    WHERE id = ${data.submissionId};
  `;

  console.log(`   Found in Postgres? ${dbRows.length === 1}`);
  if (dbRows.length > 0) {
    console.log(`   DB Record: id=${dbRows[0].id}, name=${dbRows[0].name}, port_date=${dbRows[0].port_date}, status=${dbRows[0].status}`);
  } else {
    throw new Error("Record was not persisted to PostgreSQL!");
  }

  // 3. Test notification delivery and duplicate prevention
  console.log("\n3. Testing notification delivery and deduplication in Postgres...");
  const notif1 = await dispatchSeatDropNotification({
    guestId: data.submissionId,
    guestName: "Dr. Evelyn Reed",
    email: "evelyn.reed.test@example.com",
    phone: "(907) 555-8833",
    shipName: "Discovery Princess",
    cruiseLine: "Princess Cruises",
    port: "juneau",
    portDate: submissionDate,
    operator: "TEMSCO Helicopters (Juneau)",
    tourName: "TEMSCO Mendenhall Glacier Landing",
    departureTime: "11:30 AM Departure",
    partySize: 2,
    checkoutUrl: "https://fareharbor.com/embeds/book/temscoair-juneau/items/214803/",
    cancellationPolicy: "TEMSCO Aviation terms: 48h full refund.",
  });

  console.log(`   First notification dispatched: Delivery ID = ${notif1?.deliveryId}, status = ${notif1?.status}`);

  // Query notification record in Postgres
  const notifRows = await sql`
    SELECT delivery_id, entry_id, recipient_email, departure_time, status
    FROM jfd_waitlist_notifications
    WHERE entry_id = ${data.submissionId};
  `;
  console.log(`   Persisted to jfd_waitlist_notifications? ${notifRows.length === 1}`);
  if (notifRows.length > 0) {
    console.log(`   DB Notification: delivery_id=${notifRows[0].delivery_id}, departure_time=${notifRows[0].departure_time}, status=${notifRows[0].status}`);
  }

  // Attempt duplicate dispatch for identical flight slot
  console.log("\n   Attempting duplicate dispatch for identical passenger + date + departure slot...");
  const notif2 = await dispatchSeatDropNotification({
    guestId: data.submissionId,
    guestName: "Dr. Evelyn Reed",
    email: "evelyn.reed.test@example.com",
    phone: "(907) 555-8833",
    shipName: "Discovery Princess",
    cruiseLine: "Princess Cruises",
    port: "juneau",
    portDate: submissionDate,
    operator: "TEMSCO Helicopters (Juneau)",
    tourName: "TEMSCO Mendenhall Glacier Landing",
    departureTime: "11:30 AM Departure",
    partySize: 2,
    checkoutUrl: "https://fareharbor.com/embeds/book/temscoair-juneau/items/214803/",
    cancellationPolicy: "TEMSCO Aviation terms: 48h full refund.",
  });

  console.log(`   Second notification result: ${notif2 === null ? "SUPPRESSED (null)" : "DUPLICATE SENT"}`);
  if (notif2 !== null) {
    throw new Error("Duplicate notification was not prevented!");
  }

  // 4. Verify expired dates exclusion from daily sweep
  console.log("\n4. Verifying expired dates exclusion in execute10AmDailySweep...");
  const sweep = await execute10AmDailySweep();
  console.log(`   Total watch dates swept: ${sweep.totalDatesSwept}`);
  console.log(`   Swept dates: ${sweep.dates.join(", ")}`);

  const expiredDates = sweep.dates.filter(d => d < today);
  console.log(`   Any dates prior to ${today}? ${expiredDates.length > 0 ? expiredDates.join(", ") : "None (All dates are in the future)"}`);
  if (expiredDates.length > 0) {
    throw new Error(`Expired dates were included in sweep: ${expiredDates.join(", ")}`);
  }

  console.log("\n======================================================================");
  console.log("✅ ALL DURABLE STORAGE, DEDUPLICATION, AND SWEEP CHECKS PASSED!");
  console.log("======================================================================");
}

runDurablePipelineTests().catch(err => {
  console.error("Test failure:", err);
  process.exit(1);
});
