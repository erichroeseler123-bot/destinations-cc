import test from "node:test";
import assert from "node:assert/strict";
import {
  getDccCanonicalHostedCatalogSnapshot,
  validateDccHostedCatalogIntegrity,
} from "../../lib/dcc/cruise/hostedCatalogRegistry";

test("DCC hosted catalog keeps dated source checks, publication holds and readable programming", () => {
  const snapshot = getDccCanonicalHostedCatalogSnapshot({ includeHeld: true });
  assert.equal(snapshot.owner, "dcc");
  assert.equal(validateDccHostedCatalogIntegrity().valid, true);
  assert.equal(snapshot.hostedSailings.length, 125);
  assert.equal(
    snapshot.hostedSailings.filter((s) => s.verificationState === "verified" && !s.scheduleHoldReason).length,
    122,
  );
  assert.equal(
    snapshot.hostedSailings.filter((s) => s.verificationState === "schedule_hold" || Boolean(s.scheduleHoldReason)).length,
    3,
  );
  const atlantisAllure = snapshot.hostedSailings.find(
    (s) => s.hostedSailingId === "hosted-sailing:atlantis-events:rccl:allure-of-the-seas:2027-03-07",
  );
  assert.equal(atlantisAllure?.sailingTitle, "Epic Caribbean Cruise");
  assert.equal(atlantisAllure?.canonicalShipSlug, "allure-of-the-seas");
  for (const sailing of snapshot.hostedSailings) {
    assert.ok(sailing.primarySourceUrl, sailing.hostedSailingId);
    assert.ok(sailing.organizerSourceCheckedAt <= snapshot.generatedAt, sailing.hostedSailingId);
    assert.ok(!sailing.announcedHostedProgramming?.includes("[object Object]"), sailing.hostedSailingId);
    if (sailing.verificationState === "schedule_hold") {
      assert.ok(sailing.scheduleHoldReason, sailing.hostedSailingId);
    }
  }

  for (const id of [
    "hosted-sailing:the-fan-cruise:ccl:carnival-jubilee:2027-04-11",
    "hosted-sailing:the-fan-cruise:ccl:carnival-breeze:2027-11-06",
  ]) {
    const sailing = snapshot.hostedSailings.find((s) => s.hostedSailingId === id);
    assert.equal(sailing?.verificationState, "verified", id);
    assert.equal(sailing?.portScheduleVerificationMode, "clocked_port_windows", id);
  }
});
