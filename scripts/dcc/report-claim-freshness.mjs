import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const LEDGER_PATH = path.join(ROOT, "data/claims/dcc.claim-ledger.v1.json");
const RECORD_BASE = "https://www.destinationcommandcenter.com/r/dcc-claim-";

function utcDay(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Invalid date: ${value}`);
  }
  const day = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(day) || new Date(day).toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid date: ${value}`);
  }
  return day;
}

export function reportClaimFreshness(ledger, asOf, leadDays = 14) {
  const now = utcDay(asOf);
  if (!Number.isInteger(leadDays) || leadDays < 0 || leadDays > 365) {
    throw new Error("leadDays must be an integer from 0 through 365");
  }
  if (ledger?.schemaVersion !== "dcc.claim-ledger.v1" || !Array.isArray(ledger.claims)) {
    throw new Error("Invalid DCC claim ledger");
  }

  const seen = new Set();
  const records = ledger.claims.map((claim) => {
    if (!claim.claimId || seen.has(claim.claimId)) throw new Error("Missing or duplicate claimId");
    seen.add(claim.claimId);
    const checked = utcDay(claim.checkedAt);
    const due = utcDay(claim.nextCheckAt);
    if (due < checked) throw new Error(`nextCheckAt precedes checkedAt: ${claim.claimId}`);
    if (!Array.isArray(claim.sites) || !claim.sites.length) {
      throw new Error(`Missing sites: ${claim.claimId}`);
    }
    const daysUntilCheck = Math.round((due - now) / 86_400_000);
    let attention;
    if (claim.status === "verified") {
      attention = checked > now || daysUntilCheck < 0
        ? "stale"
        : daysUntilCheck <= leadDays ? "due_soon" : "fresh";
    } else if (["stale", "disputed", "needs_confirmation"].includes(claim.status)) {
      attention = claim.status;
    } else {
      throw new Error(`Invalid status: ${claim.claimId}`);
    }
    return {
      claimId: claim.claimId,
      category: claim.category,
      claimText: claim.claimText,
      authorityName: claim.authorityName,
      authorityUrl: claim.authorityUrl,
      checkedAt: claim.checkedAt,
      nextCheckAt: claim.nextCheckAt,
      status: claim.status,
      attention,
      daysUntilCheck,
      sites: claim.sites,
      recordUrl: RECORD_BASE + encodeURIComponent(claim.claimId),
    };
  });

  const priority = { stale: 0, disputed: 1, needs_confirmation: 2, due_soon: 3, fresh: 4 };
  records.sort((a, b) => priority[a.attention] - priority[b.attention]
    || a.nextCheckAt.localeCompare(b.nextCheckAt) || a.claimId.localeCompare(b.claimId));
  const summary = { total: records.length, fresh: 0, due_soon: 0, stale: 0, disputed: 0, needs_confirmation: 0 };
  for (const record of records) summary[record.attention]++;
  return { schemaVersion: "dcc.claim-freshness-report.v1", asOf, leadDays, summary, records };
}

function usage() {
  return "Usage: node scripts/dcc/report-claim-freshness.mjs [--as-of YYYY-MM-DD] [--lead-days N] [--json] [--fail-on-problem]";
}

function run() {
  const args = process.argv.slice(2);
  let asOf = new Date().toISOString().slice(0, 10);
  let leadDays = 14;
  let json = false;
  let failOnProblem = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--as-of" && args[i + 1]) asOf = args[++i];
    else if (arg === "--lead-days" && args[i + 1]) leadDays = Number(args[++i]);
    else if (arg === "--json") json = true;
    else if (arg === "--fail-on-problem") failOnProblem = true;
    else throw new Error(usage());
  }
  const ledger = JSON.parse(fs.readFileSync(LEDGER_PATH, "utf8"));
  const report = reportClaimFreshness(ledger, asOf, leadDays);
  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    const s = report.summary;
    console.log(`DCC claim sources as of ${asOf}: ${s.total} records; ${s.fresh} fresh, ${s.due_soon} due soon, ${s.stale} stale, ${s.disputed} disputed, ${s.needs_confirmation} needs confirmation.`);
    for (const record of report.records.filter((item) => item.attention !== "fresh")) {
      console.log(`\n[${record.attention}] ${record.claimId} · ${record.nextCheckAt} (${record.daysUntilCheck} days) · ${record.sites.join(", ")}`);
      console.log(`  ${record.claimText}`);
      console.log(`  Primary: ${record.authorityName} — ${record.authorityUrl}`);
      console.log(`  DCC: ${record.recordUrl}`);
    }
  }
  if (failOnProblem && (report.summary.stale || report.summary.disputed || report.summary.needs_confirmation)) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { run(); } catch (error) { console.error(error.message); process.exitCode = 2; }
}
