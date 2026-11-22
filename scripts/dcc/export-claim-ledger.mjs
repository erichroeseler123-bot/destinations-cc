import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sourcePath = "data/claims/dcc.claim-ledger.v1.json";
const sourceBytes = fs.readFileSync(path.join(root, sourcePath));
const ledger = JSON.parse(sourceBytes);
const today = process.env.DCC_CLAIM_AS_OF || new Date().toISOString().slice(0, 10);
const categorySet = new Set([
  "safety_navigation", "schedule_access", "price_refund", "operational_status"
]);
const statusSet = new Set(["verified", "stale", "disputed", "needs_confirmation"]);
const ids = new Set();

if (ledger.schemaVersion !== "dcc.claim-ledger.v1" || !Array.isArray(ledger.claims)) {
  throw new Error("Invalid DCC claim ledger version or claims array");
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(today) || Number.isNaN(Date.parse(today))) {
  throw new Error("Invalid DCC_CLAIM_AS_OF date");
}
for (const claim of ledger.claims) {
  if (!claim.claimId || ids.has(claim.claimId)) throw new Error("Missing/duplicate claimId");
  ids.add(claim.claimId);
  if (!categorySet.has(claim.category) || !statusSet.has(claim.status)) {
    throw new Error(`Invalid category/status: ${claim.claimId}`);
  }
  for (const field of ["claimText", "authorityName", "authorityUrl", "checkedAt", "nextCheckAt", "limitationsNote"]) {
    if (!claim[field] || typeof claim[field] !== "string") {
      throw new Error(`Missing ${field}: ${claim.claimId}`);
    }
  }
  const url = new URL(claim.authorityUrl);
  if (url.protocol !== "https:") throw new Error(`Non-HTTPS source: ${claim.claimId}`);
  for (const field of ["checkedAt", "nextCheckAt"]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(claim[field]) || Number.isNaN(Date.parse(claim[field]))) {
      throw new Error(`Invalid ${field}: ${claim.claimId}`);
    }
  }
  if (claim.nextCheckAt < claim.checkedAt || !Array.isArray(claim.sites)) {
    throw new Error(`Invalid dates or site list: ${claim.claimId}`);
  }
}

const site = process.argv[2];
if (!site) throw new Error("Usage: node scripts/dcc/export-claim-ledger.mjs <site> [output]");
const snapshot = {
  schemaVersion: "dcc.claim-snapshot.v1",
  sourcePath,
  sourceSha256: crypto.createHash("sha256").update(sourceBytes).digest("hex"),
  asOf: today,
  site,
  claims: ledger.claims.filter(claim => claim.sites.includes(site)).map(claim => ({
    ...claim,
    effectiveStatus: claim.status === "verified" &&
      claim.checkedAt <= today && claim.nextCheckAt >= today
      ? "verified" : claim.status === "verified" ? "stale" : claim.status
  }))
};
const output = JSON.stringify(snapshot, null, 2) + "\n";
if (process.argv[3]) fs.writeFileSync(process.argv[3], output);
else process.stdout.write(output);
