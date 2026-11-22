import assert from "node:assert/strict";
import test from "node:test";
import { reportClaimFreshness } from "../../scripts/dcc/report-claim-freshness.mjs";

const claim = (claimId, overrides = {}) => ({
  claimId,
  category: "schedule_access",
  claimText: `Official information for ${claimId}`,
  authorityName: "Official operator",
  authorityUrl: "https://example.org/official",
  checkedAt: "2026-11-01",
  nextCheckAt: "2026-12-06",
  status: "verified",
  sites: ["cruisepromenade"],
  ...overrides,
});
const ledger = (claims) => ({ schemaVersion: "dcc.claim-ledger.v1", claims });

test("due date remains current through the day, then becomes stale", () => {
  const source = ledger([claim("ship-date")]);
  assert.equal(reportClaimFreshness(source, "2026-12-06").records[0].attention, "due_soon");
  assert.equal(reportClaimFreshness(source, "2026-12-07").records[0].attention, "stale");
});

test("orders the work queue and preserves review status across sites", () => {
  const report = reportClaimFreshness(ledger([
    claim("fresh", { nextCheckAt: "2027-06-01" }),
    claim("due", { nextCheckAt: "2026-12-06" }),
    claim("unconfirmed", { status: "needs_confirmation", sites: ["juneauflightdeck"] }),
    claim("disputed", { status: "disputed" }),
    claim("expired", { nextCheckAt: "2026-11-21" }),
  ]), "2026-11-22");
  assert.deepEqual(report.records.map((row) => row.claimId), ["expired", "disputed", "unconfirmed", "due", "fresh"]);
  assert.deepEqual(report.summary, {
    total: 5, fresh: 1, due_soon: 1, stale: 1, disputed: 1, needs_confirmation: 1,
  });
  assert.match(report.records[0].recordUrl, /destinationcommandcenter\.com\/r\/dcc-claim-expired$/);
});

test("rejects invalid check dates and future checkedAt is not current", () => {
  assert.throws(() => reportClaimFreshness(ledger([claim("bad", { nextCheckAt: "2026-02-30" })]), "2026-11-22"), /Invalid date/);
  assert.equal(reportClaimFreshness(ledger([claim("future", { checkedAt: "2026-12-01", nextCheckAt: "2026-12-15" })]), "2026-11-22").records[0].attention, "stale");
});
