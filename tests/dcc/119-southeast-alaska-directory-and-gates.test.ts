import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { NextRequest } from "next/server";

import {
  UNCLAIMED_OPERATOR_PROFILE_NOTICE,
  evaluateCruiseSailingPortFit,
} from "@/lib/dcc/shared/southeastAlaskaDirectoryContract";
import {
  assertMandatorySoutheastAlaskaInvariants,
  findEvaluatedPortCategory,
  findSoutheastAlaskaOperatorBySlugOrAlias,
  findSoutheastAlaskaPlaceByPortSlug,
  findSoutheastAlaskaTourByOperatorAndSlug,
  getSoutheastAlaskaDirectorySnapshot,
} from "@/lib/dcc/shared/southeastAlaskaDirectoryOperatorsAndTours";
import {
  clearStoredOperatorClaimsForTests,
  reviewSoutheastAlaskaOperatorClaimByOwner,
  submitSoutheastAlaskaOperatorClaim,
} from "@/lib/dcc/alaska/operatorClaimsGovernance";
import { GET as getAlaskaDirectory } from "@/app/api/v1/alaska/directory/route";
import { POST as postAlaskaClaim } from "@/app/api/v1/alaska/claims/route";

test("Binding Correction #2: Hoonah != Icy Strait Point and Gustavus != Glacier Bay as distinct canonical entities", () => {
  assertMandatorySoutheastAlaskaInvariants();

  const hoonah = findSoutheastAlaskaPlaceByPortSlug("hoonah");
  const isp = findSoutheastAlaskaPlaceByPortSlug("icy-strait-point");
  assert.ok(hoonah && isp);
  assert.notEqual(hoonah.place.placeId, isp.place.placeId);
  assert.equal(hoonah.place.placeType, "community");
  assert.equal(isp.place.placeType, "cruise_terminal");
  assert.equal(hoonah.gate.indexable, true);
  assert.equal(isp.gate.indexable, true);
  assert.ok(
    hoonah.place.relatedPlaces.some(
      (r) => r.targetPublicPortSlug === "icy-strait-point",
    ),
    "Hoonah must cross-link to Icy Strait Point",
  );
  assert.ok(
    isp.place.relatedPlaces.some((r) => r.targetPublicPortSlug === "hoonah"),
    "Icy Strait Point must cross-link to Hoonah",
  );

  const gustavus = findSoutheastAlaskaPlaceByPortSlug("gustavus");
  const glacierBay = findSoutheastAlaskaPlaceByPortSlug("glacier-bay");
  assert.ok(gustavus && glacierBay);
  assert.notEqual(gustavus.place.placeId, glacierBay.place.placeId);
  assert.equal(gustavus.place.placeType, "community");
  assert.equal(glacierBay.place.placeType, "scenic_cruise_destination");
  assert.equal(glacierBay.place.largeCruiseShipDisembarkationAllowed, false);
  assert.match(
    glacierBay.place.disembarkationExplanation,
    /do NOT dock or disembark/i,
  );
  assert.ok(
    gustavus.place.relatedPlaces.some(
      (r) => r.targetPublicPortSlug === "glacier-bay",
    ),
  );
  assert.ok(
    glacierBay.place.relatedPlaces.some(
      (r) => r.targetPublicPortSlug === "gustavus",
    ),
  );

  // Also verify supporting harbor & national_park entities exist in canonical graph
  const snapshot = getSoutheastAlaskaDirectorySnapshot();
  const distinctTypes = new Set(snapshot.places.map((p) => p.place.placeType));
  for (const requiredType of [
    "community",
    "cruise_terminal",
    "harbor",
    "national_park",
    "scenic_cruise_destination",
  ] as const) {
    assert.ok(
      distinctTypes.has(requiredType),
      `Canonical graph must model placeType=${requiredType}`,
    );
  }
});

test("Binding Correction #1 & #2: Last Frontier next.config.ts never redirects /hoonah into /ports/icy-strait-point or /glacier-bay into /ports/gustavus", () => {
  const nextConfigPath = path.join(
    process.cwd(),
    "apps",
    "last-frontier-shore-excursions",
    "next.config.ts",
  );
  const src = fs.readFileSync(nextConfigPath, "utf8");
  assert.match(src, /source:\s*"\/hoonah"[\s\S]{0,80}destination:\s*"\/ports\/hoonah"/);
  assert.match(
    src,
    /source:\s*"\/glacier-bay"[\s\S]{0,80}destination:\s*"\/ports\/glacier-bay"/,
  );
  assert.doesNotMatch(
    src,
    /source:\s*"\/ports\/hoonah"[\s\S]{0,80}destination:\s*"\/ports\/icy-strait-point"/,
  );
  assert.doesNotMatch(
    src,
    /source:\s*"\/ports\/glacier-bay"[\s\S]{0,80}destination:\s*"\/ports\/gustavus"/,
  );
});

test("Binding Correction #5: Cohort accuracy — Gallant Adventures (Sitka only), Seek Alaska (Petersburg, seekak.com), ATA != Gastineau Guiding", () => {
  const gallant = findSoutheastAlaskaOperatorBySlugOrAlias("gallant-adventures");
  assert.ok(gallant);
  assert.deepEqual(gallant.operator.publicPortSlugs, ["sitka"]);
  assert.equal(gallant.gate.indexable, true);

  const seek = findSoutheastAlaskaOperatorBySlugOrAlias("seek-alaska");
  assert.ok(seek);
  assert.ok(seek.operator.publicPortSlugs.includes("petersburg"));
  assert.equal(seek.operator.officialWebsite, "https://www.seekak.com/");
  assert.equal(seek.gate.indexable, true);

  const ata = findSoutheastAlaskaOperatorBySlugOrAlias(
    "alaska-travel-adventures",
  );
  const gastineau = findSoutheastAlaskaOperatorBySlugOrAlias(
    "gastineau-guiding",
  );
  assert.ok(ata && gastineau);
  assert.notEqual(ata.operator.operatorId, gastineau.operator.operatorId);
  assert.notEqual(ata.operator.slug, gastineau.operator.slug);
  assert.equal(ata.operator.officialWebsite, "https://www.alaskatraveladventures.com/");
  assert.equal(gastineau.operator.officialWebsite, "https://stepintoalaska.com/");
});

test("Binding Correction #3: 3-Part Port-Category Gate (>=2 verified operators, >=3 verified products, substantive comparison)", () => {
  const snapshot = getSoutheastAlaskaDirectorySnapshot();

  assert.equal(snapshot.counts.indexablePublicPlacePages, 12);
  assert.equal(snapshot.counts.heldPlacePages, 6);
  assert.equal(snapshot.counts.indexableOperatorProfiles, 21);
  assert.equal(snapshot.counts.heldOperatorsInResearchQueue, 5);
  assert.equal(snapshot.counts.indexablePortCategoryPages, 7);

  for (const pc of snapshot.portCategories) {
    if (pc.gate.indexable) {
      assert.ok(
        pc.qualifiedOperators.length >= 2,
        `${pc.gate.publicPath} must have >=2 verified operators`,
      );
      assert.ok(
        pc.qualifiedTours.length >= 3,
        `${pc.gate.publicPath} must have >=3 verified products`,
      );
      assert.ok(
        pc.comparison && pc.comparison.keyDifferencesBullets.length >= 2,
        `${pc.gate.publicPath} must have substantive comparison content`,
      );
    } else {
      assert.equal(pc.gate.robotsDirective, "noindex, follow");
      assert.equal(pc.gate.includeInSitemap, false);
    }
  }

  // Verify single-operator towns (e.g. Wrangell jetboats) stay held_noindex at category level
  const wrangellJetboats = findEvaluatedPortCategory(
    "wrangell",
    "river-and-glacier-jetboats",
  );
  assert.ok(wrangellJetboats);
  assert.equal(wrangellJetboats.gate.indexable, false);
  assert.ok(
    wrangellJetboats.gate.holdReasonCodes.includes(
      "CATEGORY_FEWER_THAN_2_VERIFIED_OPERATORS",
    ),
  );
});

test("Binding Correction #1: Tour alias lookup & upward connections preserve legacy routes", () => {
  const legacyHit = findSoutheastAlaskaTourByOperatorAndSlug(
    "alaska-galore-juneau-whale-watching",
    "331813P1",
  );
  assert.ok(legacyHit);
  assert.equal(legacyHit.operatorSlug, "harv-and-marvs");
  assert.equal(legacyHit.portSlug, "juneau");
  assert.equal(legacyHit.categorySlug, "whale-watching");

  const heldBallad = findSoutheastAlaskaTourByOperatorAndSlug(
    "bering-sea-crab-fishermens-tour",
    "aleutian-ballad",
  );
  assert.ok(heldBallad);
  assert.equal(heldBallad.isCommerciallyHeld, true);
});

test("Binding Correction #6: Unclaimed verbatim disclosure, claim-control verification & strict owner-approved integration gate", async () => {
  assert.equal(
    UNCLAIMED_OPERATOR_PROFILE_NOTICE,
    "Independent source-backed profile. This company has not yet claimed or verified this page.",
  );

  clearStoredOperatorClaimsForTests();

  // 1. Reject raw secret keys in claim form
  const badSecret = await submitSoutheastAlaskaOperatorClaim({
    operatorSlugOrId: "harv-and-marvs",
    contactName: "[TEST] Secret Attempt",
    roleTitle: "Manager",
    email: "info@harvandmarvs.com",
    notes: "Here is my sk_live_1234567890abcdef key",
    isTest: true,
  });
  assert.equal(badSecret.ok, false);
  if (!badSecret.ok) {
    assert.equal(badSecret.status, 400);
  }

  // 2. Domain-matched claim + direct API request NEVER self-activates live availability or 10% checkout
  const domainClaim = await submitSoutheastAlaskaOperatorClaim({
    operatorSlugOrId: "harv-and-marvs",
    contactName: "[TEST] Jayleen",
    roleTitle: "Operations",
    email: "reservations@harvandmarvs-juneau-whale-watching.com",
    requestDirectApiConnection: true,
    bookingSystemIdentifier: "harvandmarvs",
    isTest: true,
  });
  assert.equal(domainClaim.ok, true);
  if (!domainClaim.ok) return;

  assert.equal(
    domainClaim.record.assessment.verificationMethod,
    "official_company_domain_email",
  );
  assert.equal(domainClaim.record.liveAvailabilityActive, false);
  assert.equal(domainClaim.record.directCheckout10PctActive, false);
  assert.equal(domainClaim.record.ownerReviewState, "pending_owner_review");

  // 3. Owner cannot approve direct 10% checkout without commercialTermsSigned10Pct: true
  const missingTerms = reviewSoutheastAlaskaOperatorClaimByOwner({
    claimSubmissionId: domainClaim.record.claimSubmissionId,
    ownerActor: "owner:erich",
    decision: "approve_direct_integration_and_10pct_terms",
    commercialTermsSigned10Pct: false,
  });
  assert.equal(missingTerms.ok, false);

  // 4. Owner can verify claim-only ($0 workspace) while keeping direct checkout off
  const claimOnly = reviewSoutheastAlaskaOperatorClaimByOwner({
    claimSubmissionId: domainClaim.record.claimSubmissionId,
    ownerActor: "owner:erich",
    decision: "verify_claim_only",
  });
  assert.equal(claimOnly.ok, true);
  if (claimOnly.ok) {
    assert.equal(
      claimOnly.record.ownerReviewState,
      "claim_verified_workspace_enabled",
    );
    assert.equal(claimOnly.record.liveAvailabilityActive, false);
    assert.equal(claimOnly.record.directCheckout10PctActive, false);
  }

  // 5. Explicit owner approval + signed 10% terms activates integration
  const fullApprove = reviewSoutheastAlaskaOperatorClaimByOwner({
    claimSubmissionId: domainClaim.record.claimSubmissionId,
    ownerActor: "owner:erich",
    decision: "approve_direct_integration_and_10pct_terms",
    commercialTermsSigned10Pct: true,
  });
  assert.equal(fullApprove.ok, true);
  if (fullApprove.ok) {
    assert.equal(fullApprove.record.liveAvailabilityActive, true);
    assert.equal(fullApprove.record.directCheckout10PctActive, true);
  }
});

test("DCC API /api/v1/alaska/directory returns ETag, 304 conditional cache, and heldRecordsLedger; /api/v1/alaska/claims saves durably", async () => {
  const req1 = new NextRequest(
    "https://www.destinationcommandcenter.com/api/v1/alaska/directory?port=hoonah",
  );
  const res1 = await getAlaskaDirectory(req1);
  assert.equal(res1.status, 200);
  const etag = res1.headers.get("etag");
  assert.ok(etag && etag.startsWith('"seak-'));
  const json1 = (await res1.json()) as {
    ok: boolean;
    places: Array<{ place: { publicPortSlug: string } }>;
    operators: Array<{ operator: { slug: string } }>;
  };
  assert.equal(json1.ok, true);
  assert.equal(json1.places[0]?.place.publicPortSlug, "hoonah");
  assert.ok(
    json1.operators.some((o) => o.operator.slug === "whales-of-xunaa"),
  );

  // Conditional 304 check
  const req304 = new NextRequest(
    "https://www.destinationcommandcenter.com/api/v1/alaska/directory?port=hoonah",
    { headers: { "if-none-match": etag! } },
  );
  const res304 = await getAlaskaDirectory(req304);
  assert.equal(res304.status, 304);

  // Public POST /api/v1/alaska/claims
  const claimReq = new Request(
    "https://www.destinationcommandcenter.com/api/v1/alaska/claims",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operatorSlug: "seek-alaska",
        contactName: "[TEST] Capt Rob",
        roleTitle: "Owner",
        email: "info@seekak.com",
        requestDirectApiConnection: false,
        isTest: true,
      }),
    },
  );
  const claimRes = await postAlaskaClaim(claimReq);
  assert.equal(claimRes.status, 201);
  const claimJson = (await claimRes.json()) as {
    ok: boolean;
    verificationMethod: string;
    liveAvailabilityActive: boolean;
    directCheckout10PctActive: boolean;
  };
  assert.equal(claimJson.ok, true);
  assert.equal(claimJson.verificationMethod, "official_company_domain_email");
  assert.equal(claimJson.liveAvailabilityActive, false);
  assert.equal(claimJson.directCheckout10PctActive, false);
});

test("2-Hour Cruise Return Buffer Evaluator enforces 120-minute gangway margin", () => {
  const passes = evaluateCruiseSailingPortFit({
    shipArrivalMinutesFromMidnight: 8 * 60,
    shipAllAboardMinutesFromMidnight: 17 * 60,
    tourDepartureMinutesFromMidnight: 9 * 60 + 30,
    tourDurationMinutes: 210,
    berthTransferMinutesEachWay: 20,
    mandatoryAllAboardBufferMinutes: 120,
  });
  assert.equal(passes.fitsRecommendedWindow, true);
  assert.ok(passes.remainingBufferBeforeAllAboardMinutes >= 120);

  const fails = evaluateCruiseSailingPortFit({
    shipArrivalMinutesFromMidnight: 8 * 60,
    shipAllAboardMinutesFromMidnight: 14 * 60,
    tourDepartureMinutesFromMidnight: 9 * 60 + 30,
    tourDurationMinutes: 210,
    berthTransferMinutesEachWay: 20,
    mandatoryAllAboardBufferMinutes: 120,
  });
  assert.equal(fails.fitsRecommendedWindow, false);
});
