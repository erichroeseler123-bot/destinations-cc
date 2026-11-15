import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import {
  buildHostedOrganizerId,
  buildHostedSailingId,
  buildPhysicalSailingId,
  buildPrivateCommunityId,
  buildTravelerPlanReference,
  computeEntityReviewAggregate,
  filterAndRankHostedSailings,
  validateHostedCruiseRedundancySafeguards,
  type EntityScopedReviewRecord,
  type RankableHostedSailingCandidate,
} from "../../lib/dcc/cruise/canonicalHostedCruiseContract";
import {
  DCC_CANONICAL_HOSTED_ORGANIZERS,
  DCC_CANONICAL_HOSTED_SAILINGS,
  resolveDccHostedOrganizerBySlugOrAlias,
  validateDccHostedCatalogIntegrity,
} from "../../lib/dcc/cruise/hostedCatalogRegistry";
import { GET as getHostedCatalogRoute } from "../../app/api/v1/cruises/hosted-catalog/route";

describe("Canonical Hosted Cruise Contract & All 12 Automated Redundancy Safeguards", () => {
  it("validates the live DCC hosted catalog with zero safeguard violations", () => {
    assert.ok(DCC_CANONICAL_HOSTED_ORGANIZERS.length >= 37);
    assert.ok(DCC_CANONICAL_HOSTED_SAILINGS.length >= 44);

    const integrity = validateDccHostedCatalogIntegrity();
    assert.deepEqual(integrity.violations, []);
    assert.equal(integrity.valid, true);
  });

  it("models multiple communities on one physical sailing without duplicating itinerary records", () => {
    const symphonyPhysicalId = buildPhysicalSailingId(
      "Royal Caribbean International",
      "symphony-of-the-seas",
      "2027-01-31",
    );
    assert.equal(
      symphonyPhysicalId,
      "sailing:rccl:symphony-of-the-seas:2027-01-31",
    );

    const coSailings = DCC_CANONICAL_HOSTED_SAILINGS.filter(
      (s) => s.physicalSailingId === symphonyPhysicalId,
    );
    assert.deepEqual(
      coSailings.map((s) => s.organizerSlug).sort(),
      ["arnos-bear-cruises", "welcome-home-rgv"],
    );

    const arnoPlan = buildTravelerPlanReference({
      lineInput: "rccl",
      shipSlug: "symphony-of-the-seas",
      sailDate: "2027-01-31",
      organizerSlug: "arnos-bear-cruises",
    });
    const independentPlan = buildTravelerPlanReference({
      lineInput: "rccl",
      shipSlug: "symphony-of-the-seas",
      sailDate: "2027-01-31",
    });

    assert.deepEqual(arnoPlan, {
      sailingId: "sailing:rccl:symphony-of-the-seas:2027-01-31",
      hostedSailingId:
        "hosted-sailing:arnos-bear-cruises:rccl:symphony-of-the-seas:2027-01-31",
      communityId: "community:arnos-bear-cruises:symphony-of-the-seas:2027-01-31",
    });
    assert.deepEqual(independentPlan, {
      sailingId: "sailing:rccl:symphony-of-the-seas:2027-01-31",
      communityId: "community:independent:symphony-of-the-seas:2027-01-31",
    });
    assert.equal(
      buildHostedOrganizerId("arnos-bear-cruises"),
      "hosted-organizer:arnos-bear-cruises",
    );
    assert.equal(
      buildHostedSailingId(
        "vacaya",
        "Celebrity Cruises",
        "celebrity-beyond",
        "2027-02-14",
      ),
      "hosted-sailing:vacaya:cel:celebrity-beyond:2027-02-14",
    );
    assert.equal(
      buildPrivateCommunityId("vacaya", "celebrity-beyond", "2027-02-14"),
      "community:vacaya:celebrity-beyond:2027-02-14",
    );
  });

  it("resolves organizer aliases to a single canonical organizer identity", () => {
    const arnoViaAlias =
      resolveDccHostedOrganizerBySlugOrAlias("arno-bear-cruises");
    const arnoCanonical =
      resolveDccHostedOrganizerBySlugOrAlias("arnos-bear-cruises");
    assert.ok(arnoViaAlias);
    assert.equal(arnoViaAlias?.organizerId, arnoCanonical?.organizerId);
    assert.equal(arnoViaAlias?.organizerSlug, "arnos-bear-cruises");
  });

  it("catches all redundancy and truthfulness failure modes in negative safeguard tests", () => {
    const now = new Date("2026-11-15T12:00:00Z");
    const baseOrg = DCC_CANONICAL_HOSTED_ORGANIZERS[0];
    const baseSailing = DCC_CANONICAL_HOSTED_SAILINGS[0];

    const sampleReviews: EntityScopedReviewRecord[] = [
      {
        reviewId: "rev-org-1",
        submissionGroupId: "sub-1",
        primarySubjectType: "organizer",
        primarySubjectId: baseOrg.organizerId,
        organizerSlug: baseOrg.organizerSlug,
        authorDisplayName: "Alex",
        verificationBadge: "verified_sailing_member",
        overallRating: 5,
        dimensionRatings: { community: 5 },
        headline: "Great host communication",
        writtenExperience: "Well organized meetups.",
        wouldSailAgain: true,
        photoUrls: [],
        helpfulCount: 3,
        moderationStatus: "approved",
        createdAt: "2026-11-14T10:00:00Z",
      },
      {
        reviewId: "rev-ship-1",
        submissionGroupId: "sub-1",
        primarySubjectType: "ship",
        primarySubjectId: "ship:rccl:symphony-of-the-seas",
        authorDisplayName: "Alex",
        verificationBadge: "verified_sailing_member",
        overallRating: 2,
        dimensionRatings: { dining: 2 },
        headline: "Buffet crowded",
        writtenExperience: "Main dining was slow.",
        wouldSailAgain: true,
        photoUrls: [],
        helpfulCount: 0,
        moderationStatus: "approved",
        createdAt: "2026-11-14T10:00:00Z",
      },
    ];

    const orgAgg = computeEntityReviewAggregate(
      sampleReviews,
      "organizer",
      baseOrg.organizerId,
    );
    assert.equal(orgAgg.approvedReviewCount, 1);
    assert.equal(orgAgg.averageRating, 5);

    const negativeCheck = validateHostedCruiseRedundancySafeguards({
      now,
      physicalSailings: [
        {
          physicalSailingId: "sailing:rccl:symphony-of-the-seas:2027-01-31",
          shipSlug: "symphony-of-the-seas",
          sailDate: "2027-01-31",
          portSequenceSignature: "galveston|costa-maya|roatan|cozumel|galveston",
        },
        {
          physicalSailingId: "sailing:royal:symphony-of-the-seas:2027-01-31",
          shipSlug: "symphony-of-the-seas",
          sailDate: "2027-01-31",
        },
      ],
      organizers: [
        baseOrg,
        {
          ...baseOrg,
          organizerId: "hosted-organizer:arnos-duplicate",
          organizerSlug: "arnos-duplicate",
          aliases: [],
        },
      ],
      hostedSailings: [
        {
          ...baseSailing,
          itinerary: [{ day: 1, port: "Galveston" }],
        },
        {
          ...baseSailing,
          hostedSailingId:
            "hosted-sailing:arnos-bear-cruises:rccl:symphony-of-the-seas:2027-01-31-dup",
          sailingSlug: "symphony-dup-2027",
        },
      ],
      dccConsumerCanonicalUrls: [
        "https://destinationcommandcenter.com/hosted-cruises/arnos-bear-cruises",
      ],
      renderedHostedPortSignatures: [
        {
          hostedSailingId: baseSailing.hostedSailingId,
          physicalSailingId: "sailing:rccl:symphony-of-the-seas:2027-01-31",
          portSequenceSignature: "miami|nassau|miami",
        },
      ],
      publicSerializedPayloads: [
        '{"ok":true,"token":"rc_cruise_part=secret123"}',
      ],
      reviewPageVsApiComparisons: [
        {
          entityId: baseOrg.organizerId,
          pageCount: 10,
          apiCount: 8,
          pageAverage: 4.9,
          apiAverage: 4.7,
        },
      ],
      sitemapUrls: [
        "https://cruisepromenade.com/hosted-cruises?theme=lgbtq-cruises&utm_source=test",
      ],
      liveInventoryClaims: [
        {
          entityId: "tour:juneau-whale-watch",
          claimedLive: true,
          retrievedAtIso: "2026-11-14T00:00:00Z",
          maxAgeMinutes: 30,
        },
      ],
      previousHistoricalHostedSailings: [
        {
          hostedSailingId:
            "hosted-sailing:arnos-bear-cruises:rccl:oasis-of-the-seas:2026-05-01",
          organizerSlug: "arnos-bear-cruises",
          sailingSlug: "oasis-of-the-seas-2026-05-01",
          physicalSailingId: "sailing:rccl:oasis-of-the-seas:2026-05-01",
        },
      ],
    });

    const codes = new Set(negativeCheck.violations.map((v) => v.code));
    assert.equal(codes.has("DUPLICATE_PHYSICAL_SAILING_ID"), true);
    assert.equal(codes.has("DUPLICATED_ITINERARY_IN_HOSTED_RECORD"), true);
    assert.equal(codes.has("COMPETING_HOSTED_INTENT_CANONICAL"), true);
    assert.equal(codes.has("DCC_COMPETING_CONSUMER_CANONICAL"), true);
    assert.equal(codes.has("HOSTED_PORT_SCHEDULE_DIVERGENCE"), true);
    assert.equal(codes.has("PRIVATE_ROLLCALL_PII_IN_PUBLIC_OUTPUT"), true);
    assert.equal(codes.has("REVIEW_TOTAL_PAGE_API_MISMATCH"), true);
    assert.equal(codes.has("FILTER_OR_PRIVATE_URL_IN_SITEMAP"), true);
    assert.equal(codes.has("STALE_SOURCE_PRESENTED_AS_LIVE"), true);
    assert.equal(codes.has("RENAMED_ORGANIZER_DUPLICATE_IDENTITY"), true);
    assert.equal(codes.has("CANCELLED_SAILING_SILENTLY_REPLACED"), true);
  });

  it("enforces zero commercial weight and zero automatic claimed-organizer ranking boost", () => {
    const now = new Date("2026-11-15T12:00:00Z");
    const emptyAgg = computeEntityReviewAggregate([], "hosted_sailing", "hs-1");
    const candidateBase: RankableHostedSailingCandidate = {
      hostedSailingId: "hosted-sailing:a:rccl:symphony-of-the-seas:2027-01-31",
      organizerSlug: "org-a",
      organizerName: "Organizer A",
      primaryTheme: "lgbtq-cruises",
      secondaryThemes: [],
      regionLabel: "Caribbean",
      itineraryPortsText: "Galveston Cozumel Roatan",
      departurePort: "Galveston",
      sailDate: "2027-01-31",
      nights: 7,
      shipName: "Symphony of the Seas",
      shipSlug: "symphony-of-the-seas",
      cruiseLine: "Royal Caribbean",
      soloFriendly: true,
      familyPolicy: "adults_only",
      cabinAvailabilityStatus: "available",
      verifiedStartingPriceUsd: null,
      everyPortDayVerified: true,
      everySourceVerified: true,
      reviewAggregate: emptyAgg,
      dataCompletenessRatio: 0.85,
      sourceVerifiedAtIso: "2026-11-15T00:00:00Z",
      answeredQuestionsCount: 2,
      communityParticipantCount: 5,
    };

    const ranked = filterAndRankHostedSailings(
      [
        {
          ...candidateBase,
          hostedSailingId: "hosted-sailing:unclaimed-no-affiliate",
          hasAffiliateCommission: false,
          isClaimedByOrganizer: false,
        },
        {
          ...candidateBase,
          hostedSailingId: "hosted-sailing:claimed-high-affiliate",
          hasAffiliateCommission: true,
          isClaimedByOrganizer: true,
        },
      ],
      { theme: "lgbtq-cruises", soloFriendlyOnly: true },
      now,
    );

    assert.equal(ranked.length, 2);
    assert.equal(ranked[0].totalScore, ranked[1].totalScore);
    assert.equal(ranked[0].breakdown.affiliateCommissionWeight, 0);
    assert.equal(ranked[0].breakdown.claimedStatusAutoBoostWeight, 0);
  });

  it("serves DCC /api/v1/cruises/hosted-catalog as a noindex machine-only registry", async () => {
    const req = new NextRequest(
      "https://destinationcommandcenter.com/api/v1/cruises/hosted-catalog?theme=lgbtq-cruises",
    );
    const res = await getHostedCatalogRoute(req);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("X-Robots-Tag"), "noindex, nofollow");

    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.machineAccessOnly, true);
    assert.equal(body.integrity.valid, true);
    assert.equal(body.snapshot.consumerCanonicalHost, "https://cruisepromenade.com");
    assert.ok(body.snapshot.organizers.length >= 6);

    const slugs = body.snapshot.organizers.map(
      (o: { organizerSlug: string }) => o.organizerSlug,
    );
    assert.ok(slugs.includes("arnos-bear-cruises"));
    assert.ok(slugs.includes("atlantis-events"));
    assert.ok(slugs.includes("vacaya"));
    assert.ok(slugs.includes("olivia-travel"));
    assert.ok(slugs.includes("pied-piper-travel"));
    assert.ok(slugs.includes("aquafest-cruises"));
  });
});
