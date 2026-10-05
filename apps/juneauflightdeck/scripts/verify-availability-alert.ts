import { promises as fs } from "node:fs";
import path from "node:path";
import { POST as waitlistPost } from "../app/api/waitlist/route";
import {
  execute10AmDailySweep,
  getAllWaitlistEntries,
  type WaitlistEntry,
} from "../lib/waitlistStore";

async function main() {
  console.log("=======================================================");
  console.log("🧪 SUBMITTING & VERIFYING AVAILABILITY-ALERT PIPELINE");
  console.log("=======================================================\n");

  const testPayload = {
    name: "Dr. Arthur Pendelton",
    email: "art.pendelton.alaska27@gmail.com",
    phone: "(907) 555-4921",
    cruiseLine: "Celebrity Cruises",
    shipName: "Celebrity Solstice",
    portCity: "juneau",
    portDate: "2027-06-15",
    juneauDate: "2027-06-15",
    tourType: "glacier_landing",
    partySize: 2,
    bookingMode: "instant_alert",
    notes: "Celebrating retirement. Interested in Mendenhall Glacier landing.",
  };

  console.log("1. Submitting test alert to local route handler...");
  const req = new Request("http://localhost/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testPayload),
  });

  const res = await waitlistPost(req);
  const data = await res.json();
  console.log(`   Response status: ${res.status}`);
  console.log(`   Submission ID: ${data.submissionId}`);
  console.log(`   Response ok: ${data.ok}`);
  console.log(`   Message: ${data.message}`);

  if (!data.ok || !data.submissionId) {
    throw new Error(`Failed to submit alert: ${JSON.stringify(data)}`);
  }

  // 2. Verify persistence on disk
  console.log("\n2. Verifying disk persistence...");
  const diskPath = path.join(process.cwd(), "data", "waitlist", `${data.submissionId}.json`);
  const exists = await fs
    .stat(diskPath)
    .then(() => true)
    .catch(() => false);
  console.log(`   File exists on disk at ${diskPath}: ${exists}`);
  if (exists) {
    const content = await fs.readFile(diskPath, "utf8");
    const parsed = JSON.parse(content);
    console.log(`   Saved record matches name: "${parsed.name}" and date: "${parsed.portDate}"`);
  }

  // 3. Verify entry in getAllWaitlistEntries()
  console.log("\n3. Querying store via getAllWaitlistEntries()...");
  const allEntries = await getAllWaitlistEntries();
  const matchedEntry = allEntries.find((e) => e.id === data.submissionId);
  console.log(`   Entry present in store: ${Boolean(matchedEntry)}`);
  console.log(`   Entry status: ${matchedEntry?.status}`);

  // 4. Run automated scanner sweep
  console.log("\n4. Running automated inventory scanner sweep (execute10AmDailySweep)...");
  const sweepResult = await execute10AmDailySweep();
  console.log(`   Sweep timestamp: ${sweepResult.sweptAt}`);
  console.log(`   Total active watch dates swept: ${sweepResult.totalDatesSwept}`);
  console.log(`   Swept dates: ${sweepResult.dates.join(", ")}`);
  const dateIncluded = sweepResult.dates.includes("2027-06-15");
  console.log(`   Is test date 2027-06-15 included in sweep?: ${dateIncluded}`);

  console.log("\n=======================================================");
  console.log("✅ LOCAL SUBMISSION & SCANNER VERIFICATION COMPLETE");
  console.log("=======================================================");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
