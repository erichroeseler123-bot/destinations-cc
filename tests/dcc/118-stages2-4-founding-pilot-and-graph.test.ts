import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import {
  assertLocationEligibleForWalkTime,
  CANONICAL_PORT_LOCATIONS,
  CANONICAL_ROUTE_PATTERNS,
  listDccFactVerificationQueue,
  supersedeMaterialProvenance,
} from "../../lib/dcc/cruise/canonicalLocationsAndRoutePatterns";
import {
  ensureFoundingPilotVerificationQueueSeeded,
  FOUNDING_PILOT_DRAFT_INVITATIONS,
  getFoundingOrganizerPilotSummary,
} from "../../lib/dcc/cruise/foundingOrganizerPilotCohort";
import {
  resolveDccHostedFranchiseBySlugOrAlias,
  resolveDccHostedOrganizerBySlugOrAlias,
  validateDccHostedCatalogIntegrity,
} from "../../lib/dcc/cruise/hostedCatalogRegistry";
import { GET as getDurableSubmissionsAdmin } from "../../app/api/admin/durable-submissions/route";

test("Stage 2 DCC Canonical Graph: Location WGS84 precision tiers forbid city_centroid walk-time evidence, RoutePatterns are separate from dated sailings, and provenance supersession preserves prior values", () => {
  assert.ok(CANONICAL_PORT_LOCATIONS.length >= 14);
  assert.ok(CANONICAL_ROUTE_PATTERNS.length >= 5);

  const miamiTerminal = CANONICAL_PORT_LOCATIONS.find((l) => l.portSlug === "miami");
  assert.ok(miamiTerminal);
  assert.equal(miamiTerminal.precisionTier, "terminal");
  assert.equal(miamiTerminal.eligibleForWalkTimeCalculation, true);
  assert.doesNotThrow(() => assertLocationEligibleForWalkTime(miamiTerminal));

  const romeCentroid = CANONICAL_PORT_LOCATIONS.find((l) => l.portSlug === "rome");
  assert.ok(romeCentroid);
  assert.equal(romeCentroid.precisionTier, "city_centroid");
  assert.equal(romeCentroid.eligibleForWalkTimeCalculation, false);
  assert.throws(
    () => assertLocationEligibleForWalkTime(romeCentroid),
    /cannot be used as walk-time/,
  );

  const superseded = supersedeMaterialProvenance(miamiTerminal.coordinatesProvenance, {
    value: { lat: 25.7783, lng: -80.1701 },
    sourceUrl: "https://www.miamidade.gov/portmiami/berth-update",
    sourceType: "port_authority_official",
    suppliedBy: "dcc:port-geodesy-registry",
    verifiedBy: "dcc:wgs84-port-audit",
    validAt: "2026-11-17T00:00:00Z",
    checkedAt: "2026-11-17T00:00:00Z",
    verificationState: "verified",
  });
  assert.deepEqual(superseded.supersededValue, { lat: 25.7781, lng: -80.1704 });
  assert.deepEqual(superseded.value, { lat: 25.7783, lng: -80.1701 });
});

test("Stage 3 DCC Owner Durable Submissions Endpoint fails closed (401) when unauthenticated and authorizes with internal admin key", async () => {
  const unauthRes = await getDurableSubmissionsAdmin(
    new NextRequest("https://destinationcommandcenter.com/api/admin/durable-submissions"),
  );
  assert.equal(unauthRes.status, 401);
  assert.equal(unauthRes.headers.get("x-robots-tag"), "noindex, nofollow");

  const prevKey = process.env.ADMIN_ACCESS_KEY;
  process.env.ADMIN_ACCESS_KEY = "test-dcc-stage3-admin-key";
  try {
    ensureFoundingPilotVerificationQueueSeeded();
    const authRes = await getDurableSubmissionsAdmin(
      new NextRequest("https://destinationcommandcenter.com/api/admin/durable-submissions", {
        headers: { "x-dcc-admin-key": "test-dcc-stage3-admin-key" },
      }),
    );
    assert.equal(authRes.status, 200);
    const body = await authRes.json();
    assert.equal(body.ok, true);
    assert.ok(Array.isArray(body.dccVerificationQueue));
    assert.ok(body.dccVerificationQueue.length >= 3);
  } finally {
    if (prevKey === undefined) delete process.env.ADMIN_ACCESS_KEY;
    else process.env.ADMIN_ACCESS_KEY = prevKey;
  }
});

test("Stage 4 Founding Organizer Pilot: 5 Primary Pilots + 2 Backup Fixtures, explicit Sailing Towards Success Carnival Valor vs Royal Caribbean app conflict, 1:N Fan Cruise franchises, and 0 outreach sent", () => {
  const integrity = validateDccHostedCatalogIntegrity();
  assert.equal(integrity.valid, true, JSON.stringify(integrity.violations));
  assert.equal(integrity.violations.length, 0);

  const summary = getFoundingOrganizerPilotSummary();
  assert.equal(summary.primaryPilotCount, 5, "Pilot cohort strictly capped at 5 primary pilots");
  assert.equal(summary.backupComparisonFixtures.length, 2);
  assert.equal(summary.outreachSentCount, 0);
  assert.equal(summary.allInvitationsHeldInDraftDoNotSend, true);

  // Verify 1:N Producer -> Franchise separation on The Fan Cruise (Astros, Texans, FamAlly)
  const fanOrg = resolveDccHostedOrganizerBySlugOrAlias("the-fan-cruise");
  assert.ok(fanOrg);
  assert.equal(fanOrg.officialDomain, "fan-cruise.com");
  const astros = resolveDccHostedFranchiseBySlugOrAlias("astros-fan-cruise");
  const texans = resolveDccHostedFranchiseBySlugOrAlias("texans-fan-cruise");
  const famally = resolveDccHostedFranchiseBySlugOrAlias("famally-cruise");
  assert.ok(astros && texans && famally);
  assert.equal(astros.producerOrganizerId, fanOrg.organizerId);
  assert.equal(texans.producerOrganizerId, fanOrg.organizerId);
  assert.equal(famally.producerOrganizerId, fanOrg.organizerId);
  assert.match(famally.franchiseName, /Alliance RV/i, "FamAlly verified as Alliance RV Owners community");

  // Verify Sailing Towards Success source conflict is explicitly recorded in DCC verification queue (never silently normalized)
  const queue = listDccFactVerificationQueue({ includeSyntheticTest: false });
  const stsConflict = queue.find(
    (q) => q.verificationId === "vreq_sts_carnival_valor_vs_rccl_app_2027",
  );
  assert.ok(stsConflict, "Sailing Towards Success conflict must be recorded in DCC VerificationQueue");
  assert.equal(stsConflict.state, "needs_review");
  assert.match(JSON.stringify(stsConflict.currentVerifiedValue), /Carnival Valor/);
  assert.match(JSON.stringify(stsConflict.proposedOrConflictingValue), /Royal Caribbean app/);

  // Verify all 5 draft invitations disclose $0 fee, 0% cabin commission, and voluntary downstream affiliate commissions
  assert.equal(FOUNDING_PILOT_DRAFT_INVITATIONS.length, 5);
  for (const inv of FOUNDING_PILOT_DRAFT_INVITATIONS) {
    assert.equal(inv.outreachDispatchState, "draft_do_not_send");
    assert.equal(inv.sentAt, null);
    assert.equal(inv.organizerFeeUsd, 0);
    assert.equal(inv.cabinCommissionPercent, 0);
    assert.equal(inv.downstreamAffiliateCommissionDisclosed, true);
    assert.match(inv.draftMessageBody, /100%/);
    assert.match(inv.draftMessageBody, /\$0/);
    assert.match(inv.draftMessageBody, /commissions only/i);
    assert.match(inv.draftMessageBody, /\/organizer\/hosted\//);
  }
});
