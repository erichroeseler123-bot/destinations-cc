import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server";
import { GET as getHostedCatalogRoute } from "@/app/api/v1/cruises/hosted-catalog/route";
import {
  buildHostedSailingSubstantiveCompositeText,
  computeEntityReviewAggregate,
  computeFourWordShingleJaccard,
  computePhysicalSailingReuseMetrics,
  evaluateHostedPublicationGate,
  HOSTED_HOLD_REASON_CODES,
  validateHostedCruiseRedundancySafeguards,
  type EntityScopedReviewRecord,
  type HostedPublicationGateEvaluationInput,
} from "@/lib/dcc/cruise/canonicalHostedCruiseContract";
import {
  DCC_CANONICAL_HOSTED_FRANCHISES,
  DCC_CANONICAL_HOSTED_ORGANIZERS,
  DCC_CANONICAL_HOSTED_SAILINGS,
  DCC_HELD_INSUFFICIENT_EVIDENCE_ITEMS,
} from "@/lib/dcc/cruise/hostedCatalogRegistry";
import {
  buildHostedCatalogFieldProvenance,
  getDccHostedIdentifierRegistry,
} from "@/lib/dcc/cruise/hostedProvenanceLedger";

function buildPassingGateFixture(): HostedPublicationGateEvaluationInput {
  const organizer = DCC_CANONICAL_HOSTED_ORGANIZERS.find(
    (o) => o.organizerSlug === "arnos-bear-cruises",
  )!;
  const franchise = DCC_CANONICAL_HOSTED_FRANCHISES.find(
    (f) => f.franchiseSlug === "arnos-bear-cruises",
  )!;
  const sailing = DCC_CANONICAL_HOSTED_SAILINGS.find(
    (s) => s.organizerSlug === "arnos-bear-cruises" && s.sailingSlug === "symphony-of-the-seas-2027-01-31",
  )!;

  return {
    organizer,
    franchise,
    sailing,
    physicalSchedule: {
      resolved: true,
      physicalSailingId: sailing.physicalSailingId,
      shipSlug: sailing.canonicalShipSlug,
      shipName: "Symphony of the Seas",
      sailDate: sailing.canonicalSailDate,
      returnDate: "2027-02-07",
      nights: 7,
      isExpired: false,
      hasCompletePortItinerary: true,
      daysCount: 8,
      portDaysCount: 4,
      hasUnknownDayTypes: false,
      everyPortDayVerified: true,
      embarkPortLabel: "Miami, Florida",
      portStopsSummary: "Puerto Plata, San Juan, St. Maarten",
      scheduleSourceUrl: "https://www.royalcaribbean.com/cruises",
    },
    siblingSailingsCompositeTexts: [
      {
        hostedSailingId: "hosted-sailing:arnos-bear-cruises:cel:celebrity-edge:2028-10-17",
        compositeText:
          "Arno’s Australia & New Zealand Transpacific Bear Cruise aboard Celebrity Edge from Honolulu to Sydney exploring French Polynesia and Fiji.",
      },
    ],
    sailingPathway: {
      hasFunctionalSailingPathway: true,
      pathwayKind: "join_group_plan",
      enrollmentApiPath: `/api/v2/hosted-cruises/${organizer.organizerSlug}/${sailing.sailingSlug}/enrollment`,
      communityId: `community:${organizer.organizerSlug}:${sailing.canonicalShipSlug}:${sailing.canonicalSailDate}`,
      hasPopulatedComparisonMatrix: true,
    },
    internalLinkReachability: {
      linkedFromCategoryHub: true,
      linkedFromFranchisePage: true,
      linkedFromOrganizerPage: true,
    },
  };
}

describe("Phase A Scaling Foundation: Producer vs Franchise Separation, 9-Point Gate & Empirical Reuse", () => {
  it("keeps Organizer/Producer and Franchise strictly separate across both 1:1 and 1:N relationships", () => {
    assert.ok(DCC_CANONICAL_HOSTED_ORGANIZERS.length >= 51);
    assert.ok(DCC_CANONICAL_HOSTED_FRANCHISES.length >= 53);

    // 1:1 relationship proof: Arno's Bear Cruises
    const arnoOrg = DCC_CANONICAL_HOSTED_ORGANIZERS.find(
      (o) => o.organizerSlug === "arnos-bear-cruises",
    )!;
    const arnoFranchise = DCC_CANONICAL_HOSTED_FRANCHISES.find(
      (f) => f.franchiseSlug === "arnos-bear-cruises",
    )!;
    assert.equal(arnoOrg.organizerId, "hosted-organizer:arnos-bear-cruises");
    assert.equal(arnoFranchise.franchiseId, "hosted-franchise:arnos-bear-cruises");
    assert.notEqual(arnoOrg.organizerId, arnoFranchise.franchiseId);
    assert.equal(arnoOrg.reputationEntityId, "rep:hosted-organizer:arnos-bear-cruises");
    assert.equal(
      arnoFranchise.reputationFranchiseEntityId,
      "rep:hosted-franchise:arnos-bear-cruises",
    );
    assert.notEqual(arnoOrg.reputationEntityId, arnoFranchise.reputationFranchiseEntityId);

    // 1:N relationship proof: GaySail -> GaySail + GayNudeSail; KelliGregg -> KelliGregg + R Family Vacations
    const gaySailFranchises = DCC_CANONICAL_HOSTED_FRANCHISES.filter(
      (f) => f.producerOrganizerSlug === "gaysail",
    );
    assert.equal(gaySailFranchises.length, 2);
    assert.deepEqual(
      gaySailFranchises.map((f) => f.franchiseId).sort(),
      ["hosted-franchise:gaynudesail", "hosted-franchise:gaysail"],
    );

    const kelliGreggFranchises = DCC_CANONICAL_HOSTED_FRANCHISES.filter(
      (f) => f.producerOrganizerSlug === "kelligregg-travel",
    );
    assert.equal(kelliGreggFranchises.length, 2);
    assert.deepEqual(
      kelliGreggFranchises.map((f) => f.franchiseId).sort(),
      ["hosted-franchise:kelligregg-travel", "hosted-franchise:r-family-vacations"],
    );

    // Reviews never collapse between Producer and Franchise even on 1:1 entities
    const sampleReviews: EntityScopedReviewRecord[] = [
      {
        reviewId: "rev-org-1",
        submissionGroupId: "grp-1",
        primarySubjectType: "organizer",
        primarySubjectId: arnoOrg.organizerId,
        authorDisplayName: "Alex",
        verificationBadge: "verified_sailing_member",
        overallRating: 5,
        dimensionRatings: { organization_and_communication: 5 },
        headline: "Great booking communication",
        writtenExperience: "Arno handled cabin registration and pre-cruise questions promptly.",
        wouldSailAgain: true,
        photoUrls: [],
        helpfulCount: 1,
        moderationStatus: "approved",
        createdAt: "2026-11-16T10:00:00Z",
      },
      {
        reviewId: "rev-fr-1",
        submissionGroupId: "grp-2",
        primarySubjectType: "franchise",
        primarySubjectId: arnoFranchise.franchiseId,
        authorDisplayName: "Sam",
        verificationBadge: "verified_email_traveler",
        overallRating: 4,
        dimensionRatings: { community_tradition_and_vibe: 4 },
        headline: "Welcoming recurring community vibe",
        writtenExperience: "Every edition of the series brings back friendly returning shipmates.",
        wouldSailAgain: true,
        photoUrls: [],
        helpfulCount: 0,
        moderationStatus: "approved",
        createdAt: "2026-11-16T10:05:00Z",
      },
    ];

    const orgAgg = computeEntityReviewAggregate(sampleReviews, "organizer", arnoOrg.organizerId);
    const frAgg = computeEntityReviewAggregate(
      sampleReviews,
      "franchise",
      arnoFranchise.franchiseId,
    );
    assert.equal(orgAgg.approvedReviewCount, 1);
    assert.equal(orgAgg.averageRating, 5);
    assert.equal(frAgg.approvedReviewCount, 1);
    assert.equal(frAgg.averageRating, 4);

    // Negative safeguard test: collapsing organizerId into franchiseId fails Safeguard #13
    const broken = validateHostedCruiseRedundancySafeguards({
      organizers: [arnoOrg],
      franchises: [
        {
          ...arnoFranchise,
          franchiseId: arnoOrg.organizerId,
        },
      ],
      hostedSailings: [],
    });
    assert.equal(broken.valid, false);
    assert.ok(
      broken.violations.some((v) => v.code === "COLLAPSED_ORGANIZER_AND_FRANCHISE_IDENTITY"),
    );

    // Identifier registry and provenance maps maintain distinct franchise entries
    const idReg = getDccHostedIdentifierRegistry();
    assert.equal(idReg.resolveFranchiseId("gaynudesail"), "hosted-franchise:gaynudesail");
    assert.equal(idReg.resolveFranchiseId("arnos-bear-cruises"), "hosted-franchise:arnos-bear-cruises");
  });

  it("enforces all 9 publication-gate checks including substantive unique facts (#7) and mandatory sailing pathway (#8)", () => {
    const base = buildPassingGateFixture();
    const passRes = evaluateHostedPublicationGate(base);
    assert.equal(passRes.passed, true, JSON.stringify(passRes.checks));
    assert.equal(passRes.eligibleForSitemap, true);
    assert.equal(passRes.recommendedRobots, "index, follow");
    assert.equal(passRes.primaryHoldReasonCode, null);
    assert.equal(passRes.checks.length, 9);

    // Check #1 failure: collapsed or missing franchise
    const fail1 = evaluateHostedPublicationGate({
      ...base,
      franchise: null,
    });
    assert.equal(fail1.passed, false);
    assert.ok(fail1.failedCheckIds.includes("confirmed_organizer_and_franchise"));

    // Check #2 failure: expired physical sailing
    const fail2 = evaluateHostedPublicationGate({
      ...base,
      physicalSchedule: { ...base.physicalSchedule!, isExpired: true },
    });
    assert.equal(fail2.passed, false);
    assert.ok(fail2.failedCheckIds.includes("confirmed_physical_sailing"));

    // Check #3 failure: broken/missing official booking URL
    const fail3 = evaluateHostedPublicationGate({
      ...base,
      sailing: { ...base.sailing, officialReservationFormUrl: "http://localhost/broken" },
    });
    assert.equal(fail3.passed, false);
    assert.ok(fail3.failedCheckIds.includes("official_booking_or_contact_link"));
    assert.equal(fail3.primaryHoldReasonCode, "BROKEN_OFFICIAL_BOOKING_OR_PAGE_404");

    // Check #5 failure: incomplete port windows
    const fail5 = evaluateHostedPublicationGate({
      ...base,
      physicalSchedule: { ...base.physicalSchedule!, everyPortDayVerified: false },
    });
    assert.equal(fail5.passed, false);
    assert.ok(fail5.failedCheckIds.includes("meaningfully_complete_itinerary"));
    assert.equal(fail5.primaryHoldReasonCode, "UNVERIFIED_PORT_CLOCK_WINDOWS");

    // Check #7A failure: 0% shingle similarity (100% unique words) STILL FAILS when substantive hosted facts are missing!
    const fail7Substantive = evaluateHostedPublicationGate({
      ...base,
      sailing: {
        ...base.sailing,
        anticipationHook: "TBA",
        announcedHostedProgramming: "TBA soon",
        fullShipCharter: null,
        verifiedStartingPriceUsd: null,
        publishedPriceDisplay: null,
        inclusionsSummary: null,
        soloSupport: null,
        soloFriendly: null,
        familyPolicy: "not_verified",
        accessibilitySummary: null,
        vesselType: null,
        approximateVesselScale: null,
        approximateGroupSizeLabel: null,
      },
      organizer: {
        ...base.organizer!,
        vesselTypeSummary: null,
        inclusionsSummary: null,
        soloSupportSummary: null,
        cancellationAndParticipationPolicy: null,
        officialReservationPathSummary: "",
        accessibilitySummary: null,
      },
      siblingSailingsCompositeTexts: [],
    });
    assert.equal(fail7Substantive.passed, false);
    assert.equal(
      fail7Substantive.substantiveFactsBreakdown.maxSiblingFourWordShingleJaccard,
      0,
    );
    assert.ok(fail7Substantive.failedCheckIds.includes("substantive_unique_facts"));
    assert.equal(fail7Substantive.primaryHoldReasonCode, "MISSING_SUBSTANTIVE_HOSTED_FACTS");

    // Check #7B failure: high shingle duplicate boilerplate across sibling departures
    const exactCloneText = buildHostedSailingSubstantiveCompositeText(base.sailing);
    assert.equal(computeFourWordShingleJaccard(exactCloneText, exactCloneText), 1);
    const fail7Shingle = evaluateHostedPublicationGate({
      ...base,
      siblingSailingsCompositeTexts: [
        {
          hostedSailingId: "hosted-sailing:arnos-bear-cruises:other-clone:2027-05-01",
          compositeText: exactCloneText,
        },
      ],
    });
    assert.equal(fail7Shingle.passed, false);
    assert.ok(fail7Shingle.failedCheckIds.includes("substantive_unique_facts"));
    assert.equal(fail7Shingle.primaryHoldReasonCode, "DUPLICATE_BOILERPLATE_CONTENT");

    // Check #8 failure (User Correction #2): populated comparison matrix CANNOT substitute for a functional sailing-page pathway!
    const fail8ComparisonOnly = evaluateHostedPublicationGate({
      ...base,
      sailingPathway: {
        hasFunctionalSailingPathway: false,
        pathwayKind: "none",
        enrollmentApiPath: null,
        communityId: null,
        hasPopulatedComparisonMatrix: true,
      },
    });
    assert.equal(fail8ComparisonOnly.passed, false);
    assert.equal(fail8ComparisonOnly.eligibleForSitemap, false);
    assert.equal(fail8ComparisonOnly.recommendedRobots, "noindex, follow");
    assert.ok(fail8ComparisonOnly.failedCheckIds.includes("functional_sailing_pathway"));
    assert.equal(fail8ComparisonOnly.primaryHoldReasonCode, "MISSING_FUNCTIONAL_SAILING_PATHWAY");
    assert.match(
      fail8ComparisonOnly.checks.find((c) => c.checkNumber === 8)!.detail,
      /comparison matrix presence cannot substitute/i,
    );

    // Check #9 failure: orphan page missing franchise link
    const fail9Orphan = evaluateHostedPublicationGate({
      ...base,
      internalLinkReachability: {
        linkedFromCategoryHub: true,
        linkedFromFranchisePage: false,
        linkedFromOrganizerPage: true,
      },
    });
    assert.equal(fail9Orphan.passed, false);
    assert.ok(fail9Orphan.failedCheckIds.includes("internal_link_reachability"));
    assert.equal(fail9Orphan.primaryHoldReasonCode, "ORPHAN_MISSING_INTERNAL_LINKS");
  });

  it("assigns structured HostedHoldReasonCodes to all held records and computes empirical physical-sailing reuse", async () => {
    assert.ok(DCC_HELD_INSUFFICIENT_EVIDENCE_ITEMS.length >= 11);
    const validCodes = new Set<string>(HOSTED_HOLD_REASON_CODES);
    for (const item of DCC_HELD_INSUFFICIENT_EVIDENCE_ITEMS) {
      assert.ok(item.reasonCode && validCodes.has(item.reasonCode), `Missing reasonCode on ${item.holdId}`);
      assert.ok(item.franchiseId?.startsWith("hosted-franchise:"));
    }

    const reuse = computePhysicalSailingReuseMetrics(DCC_CANONICAL_HOSTED_SAILINGS);
    assert.equal(reuse.totalHostedDepartures, DCC_CANONICAL_HOSTED_SAILINGS.length);
    assert.ok(reuse.sharedPhysicalSailingsCount >= 1);
    assert.ok(
      reuse.sharedPhysicalSailings.some(
        (s) => s.physicalSailingId === "sailing:rccl:symphony-of-the-seas:2027-01-31",
      ),
    );
    assert.ok(reuse.top15ShipsDepartureSharePct > 0 && reuse.top15ShipsDepartureSharePct <= 100);

    // Verify API endpoint exposes franchises, provenance, and reuse metrics
    const req = new NextRequest(
      "https://www.destinationcommandcenter.com/api/v1/cruises/hosted-catalog?franchise=gaynudesail&provenance=1",
    );
    const res = await getHostedCatalogRoute(req);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.counts.franchises, 1);
    assert.equal(body.snapshot.franchises[0].franchiseId, "hosted-franchise:gaynudesail");
    assert.ok(body.fieldProvenance.franchisesByEntityId["hosted-franchise:gaynudesail"]);
    assert.ok(body.fieldProvenance.organizersByEntityId["hosted-organizer:gaysail"]);
    assert.ok(body.physicalSailingReuseMetrics);

    const fullBundle = buildHostedCatalogFieldProvenance({
      contractVersion: "2026-11-15.v1",
      snapshotId: "test",
      generatedAt: "2026-11-16T13:15:00Z",
      owner: "dcc",
      consumerCanonicalHost: "https://cruisepromenade.com",
      themes: [],
      organizers: DCC_CANONICAL_HOSTED_ORGANIZERS,
      franchises: DCC_CANONICAL_HOSTED_FRANCHISES,
      hostedSailings: DCC_CANONICAL_HOSTED_SAILINGS,
      recentChangeEvents: [],
    });
    assert.equal(
      Object.keys(fullBundle.franchisesByEntityId).length,
      DCC_CANONICAL_HOSTED_FRANCHISES.length,
    );
  });
});
