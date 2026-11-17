import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  CORE_OPERATOR_FIELD_AUTHORITY_MATRIX,
  DIRECTORY_CORE_CONTRACT_VERSION,
  UNCLAIMED_OPERATOR_PROFILE_NOTICE,
  assessOperatorClaimAndIntegrationSubmission,
  evaluateCoreLocationPublicationGate,
  evaluateCoreOperatorPublicationGate,
  evaluateCorePlaceCategoryPublicationGate,
  isOperatorDirectCheckoutConnected,
  isOperatorLiveAvailabilityConnected,
  normalizeProductDepartureSlots,
  type BookingProviderDescriptor,
  type DirectoryLocationCoreRecord,
  type DirectoryMeetingPointRecord,
  type DirectoryOperatorCoreRecord,
  type DirectoryOperatorReviewRecord,
  type DirectoryProductCoreRecord,
  type DirectoryProductReviewRecord,
  type OperatorMeetingRuleRecord,
} from "@/lib/dcc/shared/regionalDirectoryCoreContract";
import {
  ALASKA_DIRECTORY_EXTENSION_VERSION,
  OPERATOR_FIELD_AUTHORITY_MATRIX,
  evaluateCruiseSailingPortFit,
} from "@/lib/dcc/shared/alaskaDirectoryExtensionContract";
import { getSoutheastAlaskaDirectorySnapshot } from "@/lib/dcc/shared/southeastAlaskaDirectoryOperatorsAndTours";

test("Region-neutral core contract contains zero Alaska, cruise-berth, tender, wildlife, or all-aboard coupling", () => {
  const corePath = path.join(
    process.cwd(),
    "lib",
    "dcc",
    "shared",
    "regionalDirectoryCoreContract.ts",
  );
  const raw = fs.readFileSync(corePath, "utf8");
  // Strip block & line comments so we inspect actual code, types, and string literals
  const codeOnly = raw
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");

  const forbiddenTerms = [
    /\balaska\b/i,
    /\bjuneau\b/i,
    /\bhoonah\b/i,
    /\bketchikan\b/i,
    /\bsitka\b/i,
    /\bskagway\b/i,
    /\bglacier[\s_-]?bay\b/i,
    /\bnew[\s_-]?orleans\b/i,
    /\btender_landing\b/i,
    /\ball[-_ ]?aboard\b/i,
    /\bwhale\b/i,
    /\bflight[\s_-]?deck\b/i,
    /\bvisitingShips\b/,
    /\blargeCruiseShipDisembarkationAllowed\b/,
  ];

  for (const re of forbiddenTerms) {
    assert.doesNotMatch(
      codeOnly,
      re,
      `regionalDirectoryCoreContract.ts must not contain region/cruise term ${re}`,
    );
  }
});

test("Region-neutral core supports non-cruise locations, operators, products, departures, meeting points, booking providers, reviews, provenance, and gates", () => {
  assert.equal(DIRECTORY_CORE_CONTRACT_VERSION, "dcc.directory.core.v1");
  assert.equal(
    UNCLAIMED_OPERATOR_PROFILE_NOTICE,
    "Independent source-backed profile. This company has not yet claimed or verified this page.",
  );

  const meetingPoint: DirectoryMeetingPointRecord = {
    locationId: "loc:plaza:historic-market-clocktower",
    name: "Historic Market Clocktower Check-In Kiosk",
    facilityKind: "hotel_or_downtown_plaza",
    latitude: 38.0,
    longitude: -90.0,
    precisionTier: "meeting_point",
    transitOrWalkNotes: "2-block walk from the central streetcar stop; shaded bench seating.",
    additionalTransferMinutesEachWay: 5,
  };

  const location: DirectoryLocationCoreRecord = {
    placeId: "place:neighborhood_or_district:historic-market-district",
    publicPlaceSlug: "historic-market-district",
    hasPublicDirectoryPage: true,
    name: "Historic Market District",
    subRegionLabel: "Central Heritage Corridor",
    placeType: "neighborhood_or_district",
    heroImage: "/images/sample.jpg",
    heroImageAlt: "Historic brick market arcade",
    heroImageCredit: "Public domain",
    hook: "Walkable culinary, architectural, and riverfront neighborhood with central plaza tour departures.",
    overview:
      "The Historic Market District anchors independent walking, culinary, and architectural excursions departing from shaded public plazas within two blocks of municipal streetcar transit.",
    accessAndTransitSummary:
      "Visitors arrive by municipal streetcar, hotel walk, or rideshare drop-off along Market Avenue without needing maritime terminal transfers.",
    pickupAndArrivalNotes:
      "Check in 15 minutes prior to departure at the designated plaza kiosk listed on your confirmation.",
    weatherOrSeasonalAdvice:
      "Tours operate rain or shine; carry water during warm afternoon departures.",
    meetingAndAccessPoints: [meetingPoint],
    officialLocalSources: [
      {
        label: "Municipal Heritage Commission Visitor Guide",
        url: "https://example.org/heritage-guide",
        sourceKind: "municipal_or_civic_authority",
        checkedAt: "2026-11-17",
      },
    ],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  };

  const locGate = evaluateCoreLocationPublicationGate({
    placeId: location.placeId,
    publicPath: `/districts/${location.publicPlaceSlug}`,
    hasPublicDirectoryPage: location.hasPublicDirectoryPage,
    placeType: location.placeType,
    overview: location.overview,
    accessAndLogisticsSummary: location.accessAndTransitSummary,
    accessPointCount: location.meetingAndAccessPoints.length,
    officialLocalSourceCount: location.officialLocalSources.length,
    verifiedAt: location.verifiedAt,
  });
  assert.equal(locGate.indexable, true);
  assert.equal(locGate.publicPath, "/districts/historic-market-district");

  const provider: BookingProviderDescriptor = {
    platform: "FareHarbor",
    providerAccountHandle: "heritagewalksco",
    supportsLiveAvailabilityWebhook: true,
  };
  assert.equal(provider.platform, "FareHarbor");

  const meetingRule: OperatorMeetingRuleRecord = {
    placeId: location.placeId,
    meetingAreaName: meetingPoint.name,
    pickupProvided: false,
    meetingPointInstructions: "Meet guide with green lantern next to the clocktower.",
    addedBufferMinutesEachWay: 5,
  };

  const opReview: DirectoryOperatorReviewRecord = {
    reviewId: "rev:op:1",
    entityScope: "operator",
    operatorId: "operator:heritage-walks-co",
    reviewerDisplayName: "Alex P.",
    visitMonthOrSeason: "October 2026",
    verificationBasis: "verified_booking_or_owner_moderated",
    operationsAndPickupSummary: "Clear pre-arrival SMS instructions and punctual start.",
    publishedAt: "2026-11-01",
  };

  const prodReview: DirectoryProductReviewRecord = {
    reviewId: "rev:prod:1",
    entityScope: "product",
    productId: "product:heritage-walks-co:morning-architecture-walk",
    operatorId: "operator:heritage-walks-co",
    reviewerDisplayName: "Morgan T.",
    visitMonthOrSeason: "October 2026",
    verificationBasis: "verified_booking_or_owner_moderated",
    experienceSummary: "Deep primary-source architectural history in a 10-person group.",
    publishedAt: "2026-11-02",
  };

  const operator: DirectoryOperatorCoreRecord = {
    operatorId: "operator:heritage-walks-co",
    slug: "heritage-walks-co",
    name: "Heritage Walks Co.",
    tagline: "Historian-led small-group neighborhood architecture walks.",
    headquartersCommunityId: location.placeId,
    servedPlaceIds: [location.placeId],
    publicPlaceSlugs: ["historic-market-district"],
    categorySlugs: ["architecture-walks"],
    verifiedOwnershipBadges: [
      {
        tag: "locally_owned",
        label: "Locally Owned",
        evidenceSummary: "Founded and operated by local architectural historians.",
        sourceUrl: "https://heritagewalksco.example.com/about",
      },
    ],
    companyOverview:
      "Heritage Walks Co. leads 12-guest architectural and culinary history walks through the Historic Market District with licensed resident historians and Whisper audio receivers.",
    arrivalAndPickupSummary:
      "All walks meet at the Historic Market Clocktower Kiosk 15 minutes before departure; two blocks from the central streetcar line.",
    officialWebsite: "https://heritagewalksco.example.com/",
    officialEmailDomain: "heritagewalksco.example.com",
    officialPhone: "(555) 234-5678",
    socialLinks: {},
    bookingPlatform: provider.platform,
    accessibilityAndMobilityNotes: "Step-free brick sidewalks and curb cuts throughout the 1.2-mile route.",
    participantPolicies: "Maximum 12 guests per departure; ages 6+.",
    heroImage: "/images/sample-op.jpg",
    heroImageAlt: "Guided walking group",
    heroImageCredit: "Public domain",
    claimStatus: "unclaimed",
    integrationApproval: {
      connectionRequestStatus: "not_requested",
      liveAvailabilityApprovedByOwner: false,
      directCheckoutApprovedByOwner: false,
      commercialTermsSigned10Pct: false,
      approvedAt: null,
      approvedBy: null,
      notes: "Unconnected public profile.",
    },
    operatorReviews: [opReview],
    sources: [
      {
        label: "Heritage Walks Co. Official Site",
        url: "https://heritagewalksco.example.com/",
        sourceKind: "official_operator",
        checkedAt: "2026-11-17",
      },
    ],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  };

  const departures = normalizeProductDepartureSlots({
    productId: "product:heritage-walks-co:morning-architecture-walk",
    typicalDepartureTimes: ["09:30 AM", "02:00 PM"],
    durationMinutes: 120,
    pickupAvailable: false,
    meetingPointId: meetingPoint.locationId,
  });
  assert.equal(departures.length, 2);
  assert.equal(departures[0]?.departureId, "product:heritage-walks-co:morning-architecture-walk:dep:1");

  const product: DirectoryProductCoreRecord = {
    productId: "product:heritage-walks-co:morning-architecture-walk",
    productSlug: "morning-architecture-walk",
    operatorId: operator.operatorId,
    operatorSlug: operator.slug,
    operatorName: operator.name,
    primaryPlaceId: location.placeId,
    placeSlug: "historic-market-district",
    categorySlug: "architecture-walks",
    title: "2-Hour Historic Market Architecture Walk",
    summary: "Guided 12-person architectural history walk covering 19th-century ironwork and market halls.",
    durationLabel: "2 hours",
    durationMinutes: 120,
    typicalDepartureTimes: ["09:30 AM", "02:00 PM"],
    departures,
    fromPriceUsd: 45,
    priceDisplayLabel: "From $45",
    meetingPoint: meetingRule.meetingAreaName,
    pickupIncluded: false,
    pickupDetails: meetingRule.meetingPointInstructions,
    accessibilityNotes: operator.accessibilityAndMobilityNotes,
    participantRestrictions: operator.participantPolicies,
    image: "/images/sample-tour.jpg",
    imageAlt: "Historic market hall",
    imageCredit: "Public domain",
    bookingChannel: "official_operator_website",
    officialProductUrl: "https://heritagewalksco.example.com/tours/architecture",
    attributionCampaign: "sample-arch-walk",
    productReviews: [prodReview],
    verifiedAt: "2026-11-17",
    lastModifiedAt: "2026-11-17",
  };

  const opGate = evaluateCoreOperatorPublicationGate({
    operatorId: operator.operatorId,
    slug: operator.slug,
    name: operator.name,
    officialWebsite: operator.officialWebsite,
    officialPhone: operator.officialPhone,
    servedPlaceCount: operator.servedPlaceIds.length,
    publicPlaceSlugCount: operator.publicPlaceSlugs.length,
    meetingOrPickupRuleCount: [meetingRule].length,
    companyOverview: operator.companyOverview,
    logisticsSummary: operator.arrivalAndPickupSummary,
    sources: operator.sources,
    verifiedAt: operator.verifiedAt,
    integrationApproval: operator.integrationApproval,
    products: [product],
  });
  assert.equal(opGate.indexable, true);
  assert.equal(isOperatorLiveAvailabilityConnected(operator), false);
  assert.equal(isOperatorDirectCheckoutConnected(operator), false);

  const claimCheck = assessOperatorClaimAndIntegrationSubmission({
    operator,
    claimantEmail: "guides@heritagewalksco.example.com",
    requestedDirectIntegration: true,
  });
  assert.equal(claimCheck.verificationMethod, "official_company_domain_email");
  assert.equal(claimCheck.autoGrantsWorkspaceAccess, false);

  // Category gate requires >=2 operators & >=3 products
  const catHeld = evaluateCorePlaceCategoryPublicationGate({
    placeSlug: "historic-market-district",
    categorySlug: "architecture-walks",
    publicPlacePathPrefix: "/districts",
    comparison: null,
    qualifiedOperatorIds: [operator.operatorId],
    qualifiedProducts: [product],
  });
  assert.equal(catHeld.indexable, false);
  assert.ok(
    catHeld.holdReasonCodes.includes("CATEGORY_FEWER_THAN_2_VERIFIED_OPERATORS"),
  );
  assert.ok(
    !CORE_OPERATOR_FIELD_AUTHORITY_MATRIX.dccVerifiedReadOnlyRequiresVerificationQueue.includes(
      "visitingCruiseShipSchedules" as never,
    ),
  );
});

test("Alaska extension composes cleanly on core contract and populates normalized departures on all Southeast Alaska tours", () => {
  const snapshot = getSoutheastAlaskaDirectorySnapshot();
  assert.equal(snapshot.coreContractVersion, DIRECTORY_CORE_CONTRACT_VERSION);
  assert.equal(snapshot.extensionVersion, ALASKA_DIRECTORY_EXTENSION_VERSION);
  assert.ok(snapshot.tours.length >= 42);

  for (const tour of snapshot.tours) {
    assert.ok(Array.isArray(tour.departures));
    if (tour.isCommerciallyHeld) {
      assert.equal(tour.departures.length, 0);
    } else {
      assert.ok(
        tour.departures.length > 0,
        `Active verified tour ${tour.tourId} must carry structured departures[] from core normalizer`,
      );
    }
  }

  assert.ok(
    OPERATOR_FIELD_AUTHORITY_MATRIX.dccVerifiedReadOnlyRequiresVerificationQueue.includes(
      "twoHourPierReturnBufferCalculations",
    ),
  );

  const fit = evaluateCruiseSailingPortFit({
    shipArrivalMinutesFromMidnight: 480,
    shipAllAboardMinutesFromMidnight: 1020,
    tourDepartureMinutesFromMidnight: 570,
    tourDurationMinutes: 180,
    berthTransferMinutesEachWay: 15,
  });
  assert.equal(fit.fitsRecommendedWindow, true);
});
