import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import {
  evaluateShipPublicationGate,
  EXPLICIT_FRANCHISE_EVENT_SERIES_ALLOWLIST,
  EXPLICIT_HOSTED_EVENT_SCHEMA_ALLOWLIST,
  qualifiesFranchiseForEventSeriesSchema,
  qualifiesHostedDepartureForEventSchema,
  SHIP_PUBLICATION_GATE_CHECK_IDS,
} from "../../lib/dcc/cruise/canonicalHostedCruiseContract";
import { getDccCanonicalHostedCatalogSnapshot } from "../../lib/dcc/cruise/hostedCatalogRegistry";
import {
  CANONICAL_DCC_SHIPS,
  getDccCanonicalShipBySlug,
  getDccCanonicalShipsSummary,
} from "../../lib/dcc/cruise/canonicalShipSpecsRegistry";
import { GET as getHostedCatalog } from "../../app/api/v1/cruises/hosted-catalog/route";

test("Stage 1 Ship-Page Publication Gate enforces all 9 required checks and fails closed", () => {
  assert.equal(SHIP_PUBLICATION_GATE_CHECK_IDS.length, 9);

  const passing = evaluateShipPublicationGate({
    shipSlug: "celebrity-summit",
    shipName: "Celebrity Summit",
    cruiseLineName: "Celebrity Cruises",
    canonicalLineCode: "cel",
    shipClass: "Millennium Class",
    passengerCapacity: 2218,
    debutYear: 2001,
    homeports: ["Fort Lauderdale, FL", "Miami, FL"],
    specSourceUrl: "https://www.celebritycruises.com/cruise-ships/celebrity-summit",
    summaryDescription:
      "Celebrity Summit is a Millennium-class ocean cruise ship hosting both scheduled Caribbean/Alaska voyages and full-ship music charters.",
    dockAndTimingGuidance:
      "Allow a conservative 2-hour pier-return margin before all-aboard on independent port days.",
    curatedPortGuideCount: 0,
    verifiedItineraryPortCount: 5,
    upcomingIndexablePhysicalSailingCount: 11,
    upcomingIndexableHostedSailingCount: 11,
    canonicalPath: "/cruise-ships/celebrity-summit",
    hasDistinctTitleAndDescription: true,
    linkedFromFleetHubOrLineOrSailing: true,
    hasTruthfulStructuredDataParity: true,
    usesDeprecatedTouristTripRootType: false,
    identityConflictNote: null,
    hasShipSafeHeroVisual: true,
  });

  assert.equal(passing.passed, true);
  assert.equal(passing.robotsDirective, "index, follow");
  assert.equal(passing.includeInSitemap, true);
  assert.equal(passing.holdReasonCodes.length, 0);

  const boutiqueNoindex = evaluateShipPublicationGate({
    shipSlug: "lagoon-420-catamaran-dalmatia",
    shipName: "Lagoon 420 Catamaran Dalmatia",
    cruiseLineName: "GaySail Catamaran & Yacht Fleet",
    canonicalLineCode: "gaysail",
    shipClass: null,
    passengerCapacity: 10,
    debutYear: null,
    homeports: ["Split, Croatia"],
    specSourceUrl: null,
    summaryDescription:
      "Boutique 42-foot sailing catamaran chartered by GaySail for Dalmatian Island hopping from Split.",
    dockAndTimingGuidance:
      "Small-craft marina moorings and island anchorages vary daily with Adriatic wind conditions.",
    curatedPortGuideCount: 0,
    verifiedItineraryPortCount: 4,
    upcomingIndexablePhysicalSailingCount: 0,
    upcomingIndexableHostedSailingCount: 1,
    canonicalPath: "/cruise-ships/lagoon-420-catamaran-dalmatia",
    hasDistinctTitleAndDescription: true,
    linkedFromFleetHubOrLineOrSailing: true,
    hasTruthfulStructuredDataParity: true,
    identityConflictNote: null,
    hasShipSafeHeroVisual: true,
  });

  assert.equal(boutiqueNoindex.passed, false);
  assert.equal(boutiqueNoindex.robotsDirective, "noindex, follow");
  assert.equal(boutiqueNoindex.includeInSitemap, false);
  assert.ok(boutiqueNoindex.holdReasonCodes.includes("unverified_ship_facts"));
});

test("Stage 1 Hosted-Cruise Structured Data Policy: automatic Event/EventSeries/Offer/Rating markup is disabled across all 111 departures and 95 franchises unless explicitly allowlisted with manual evidence", () => {
  assert.equal(EXPLICIT_HOSTED_EVENT_SCHEMA_ALLOWLIST.length, 0);
  assert.equal(EXPLICIT_FRANCHISE_EVENT_SERIES_ALLOWLIST.length, 0);

  const snapshot = getDccCanonicalHostedCatalogSnapshot({ includeHeld: true });
  assert.equal(snapshot.hostedSailings.length, 116);
  assert.equal((snapshot.franchises ?? []).length, 100);

  for (const s of snapshot.hostedSailings) {
    const q = qualifiesHostedDepartureForEventSchema({
      hostedSailingId: s.hostedSailingId,
      isIndexable: !s.scheduleHoldReason,
      lifecycleStatus: s.lifecycleStatus,
      isExpired: false,
      experienceClassification: s.experienceClassification ?? "hosted_group_sailing",
      primaryTheme: s.primaryTheme,
      sailingTitle: s.sailingTitle,
      announcedHostedProgramming: s.announcedHostedProgramming,
      startDateIso: s.canonicalSailDate,
      endDateIso: null,
      embarkLocationName: s.regionLabel || "Miami, Florida",
      organizerName: s.organizerSlug,
      officialOrganizerUrl: s.officialSailingPageUrl,
      officialSailingPageUrl: s.officialSailingPageUrl,
      verifiedStartingPriceUsd: s.verifiedStartingPriceUsd,
      visiblePriceDisplayed: s.verifiedStartingPriceUsd !== null,
      approvedReviewCount: 5,
      averageRating: 4.9,
      visibleRatingDisplayed: true,
    });
    assert.equal(q.qualifiesForEventSchema, false, `${s.hostedSailingId} must NOT auto-emit Event`);
    assert.equal(q.primarySchemaType, "WebPage");
    assert.equal(q.includeOffers, false, `${s.hostedSailingId} must NOT emit Offer`);
    assert.equal(q.includeAggregateRating, false, `${s.hostedSailingId} must NOT emit AggregateRating`);
  }

  for (const f of snapshot.franchises ?? []) {
    const fq = qualifiesFranchiseForEventSeriesSchema({
      franchiseId: f.franchiseId,
      isStandaloneIndexable: true,
      franchiseName: f.franchiseName,
      programmingAndLineupModel: f.programmingAndLineupModel,
      officialWebsiteUrl: f.officialWebsiteUrl,
      qualifyingUpcomingEventCount: 3,
      approvedReviewCount: 4,
      averageRating: 4.8,
      visibleRatingDisplayed: true,
    });
    assert.equal(fq.qualifiesForEventSeriesSchema, false, `${f.franchiseId} must NOT auto-emit EventSeries`);
    assert.equal(fq.primarySchemaType, "CollectionPage");
    assert.equal(fq.includeAggregateRating, false);
  }

  // Prove future allowlist entry WITHOUT complete manual policy evidence still fails closed
  const incompleteAllowlistCheck = qualifiesHostedDepartureForEventSchema(
    {
      hostedSailingId: "hosted-sailing:sixthman:ncl:norwegian-jewel:2027-02-26",
      isIndexable: true,
      lifecycleStatus: "upcoming",
      isExpired: false,
      experienceClassification: "full_ship_charter",
      primaryTheme: "music-cruises",
      sailingTitle: "Cayamo 2027",
      announcedHostedProgramming:
        "Multi-stage Americana and roots music concerts across ship venues.",
      startDateIso: "2027-02-26",
      endDateIso: "2027-03-05",
      embarkLocationName: "Miami, Florida",
      organizerName: "Sixthman",
      officialOrganizerUrl: "https://www.sixthman.net",
      officialSailingPageUrl: "https://www.cayamo.com",
      verifiedStartingPriceUsd: 2420,
      visiblePriceDisplayed: true,
      approvedReviewCount: 0,
      averageRating: null,
      visibleRatingDisplayed: false,
    },
    [
      {
        hostedSailingId: "hosted-sailing:sixthman:ncl:norwegian-jewel:2027-02-26",
        approvedBy: "erich",
        approvedAtIso: "2026-11-16",
        publicEventQualificationEvidence: "Passed Rich Results Test", // too short & insufficient!
        physicalLocationPolicyEvidence: "",
        visibleContentParityVerified: true,
        richResultsTestAloneInsufficientAcknowledged: false,
      },
    ],
  );
  assert.equal(incompleteAllowlistCheck.qualifiesForEventSchema, false);

  // Prove complete manual-evidence allowlist entry works when explicitly approved in the future
  const validFutureAllowlistCheck = qualifiesHostedDepartureForEventSchema(
    {
      hostedSailingId: "hosted-sailing:sixthman:ncl:norwegian-jewel:2027-02-26",
      isIndexable: true,
      lifecycleStatus: "upcoming",
      isExpired: false,
      experienceClassification: "full_ship_charter",
      primaryTheme: "music-cruises",
      sailingTitle: "Cayamo 2027",
      announcedHostedProgramming:
        "Multi-stage Americana and roots music concerts across ship venues.",
      startDateIso: "2027-02-26",
      endDateIso: "2027-03-05",
      embarkLocationName: "Miami, Florida",
      organizerName: "Sixthman",
      officialOrganizerUrl: "https://www.sixthman.net",
      officialSailingPageUrl: "https://www.cayamo.com",
      verifiedStartingPriceUsd: 2420,
      visiblePriceDisplayed: true,
      approvedReviewCount: 0,
      averageRating: null,
      visibleRatingDisplayed: false,
    },
    [
      {
        hostedSailingId: "hosted-sailing:sixthman:ncl:norwegian-jewel:2027-02-26",
        approvedBy: "erich",
        approvedAtIso: "2026-11-20T00:00:00Z",
        publicEventQualificationEvidence:
          "Manually audited public multi-stage music festival charter with published lineup and schedule rather than ordinary cruise package.",
        physicalLocationPolicyEvidence:
          "Manually verified embarkation terminal PortMiami Terminal B physical address and venue location compliance.",
        visibleContentParityVerified: true,
        richResultsTestAloneInsufficientAcknowledged: true,
        allowOffersMarkup: false,
        allowAggregateRatingMarkup: false,
      },
    ],
  );
  assert.equal(validFutureAllowlistCheck.qualifiesForEventSchema, true);
  assert.equal(validFutureAllowlistCheck.includeOffers, false);
});

test("DCC hosted-catalog API exposes cacheIsolationVersion and structuredDataPolicy while preserving canonical graph relationships", async () => {
  const req = new NextRequest("https://destinationcommandcenter.com/api/v1/cruises/hosted-catalog");
  const res = await getHostedCatalog(req);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.cacheIsolationVersion);
  assert.ok(body.structuredDataPolicy);
  assert.equal(body.structuredDataPolicy.automaticEventMarkupEnabled, false);
  assert.equal(body.structuredDataPolicy.explicitHostedEventAllowlistCount, 0);
  assert.equal(body.structuredDataPolicy.richResultsTestValidationAloneSufficient, false);
  assert.equal(body.counts.organizers, 64);
  assert.equal(body.counts.franchises, 100);
  assert.equal(body.counts.hostedSailings, 116);
  assert.equal(body.counts.canonicalShips, 74);
  assert.equal(body.counts.heldInsufficientEvidence, 46);
  assert.deepEqual(body.canonicalShipsSummary, {
    totalCanonicalShips: 74,
    curatedFleetIndexableCount: 18,
    enrichedSupplementalIndexableCount: 46,
    totalIndexableCount: 64,
    noindexHeldCount: 10,
    deckPlansOrProprietaryMediaCount: 0,
    specVerifiedAt: "2026-11-16T16:00:00Z",
  });
});

test("Stage 1 Pre-Release 13-Ship Source Audit across all 5 vessel categories in DCC canonical registry", () => {
  const summary = getDccCanonicalShipsSummary();
  assert.equal(summary.enrichedSupplementalIndexableCount, 46);
  assert.equal(CANONICAL_DCC_SHIPS.length, 74);

  const sampledSlugs = [
    // 1. Major ocean ships
    "star-of-the-seas",
    "carnival-jubilee",
    "norwegian-luna",
    // 2. Older ocean ships
    "rhapsody-of-the-seas",
    "voyager-of-the-seas",
    "carnival-valor",
    // 3. Luxury / upper-premium ocean ships
    "celebrity-ascent",
    "celebrity-apex",
    // 4. Music-charter-heavy ships
    "celebrity-summit",
    "celebrity-silhouette",
    "norwegian-pearl",
    // 5. Specialty ocean vessels that passed the index gate
    "scarlet-lady",
    "mein-schiff-2",
  ];

  for (const slug of sampledSlugs) {
    const rec = getDccCanonicalShipBySlug(slug);
    assert.ok(rec, `Sampled ship ${slug} must exist in DCC canonical ship registry`);
    assert.equal(rec.shipId, `ship:${slug}`);
    assert.equal(rec.inCuratedFleet, false, `${slug} is one of the 46 newly enriched profiles`);
    assert.equal(rec.isIndexable, true, `${slug} passed all 9 Ship Publication Gate checks`);
    assert.equal(rec.robotsDirective, "index, follow");
    assert.ok(rec.specSourceUrl && rec.specSourceUrl.startsWith("https://"));
    assert.equal(rec.specVerifiedAt, "2026-11-16T16:00:00Z");
    assert.equal(rec.containsDeckPlansOrProprietaryMedia, false);
    assert.equal(rec.fieldProvenance.vesselHardwareSpecs.sourceAuthority, "cruise_line_first_party");
    assert.equal(rec.fieldProvenance.vesselHardwareSpecs.sourceUrl, rec.specSourceUrl);
    assert.ok(
      rec.upcomingPhysicalSailingCount > 0 || rec.upcomingHostedSailingCount > 0,
      `${slug} must have verified upcoming physical or hosted sailings`,
    );
    assert.ok(!/todo|tbd|placeholder|lorem ipsum/i.test(rec.summaryDescription));
  }

  // Confirm ZERO expedition/river/catamaran vessels passed the index gate
  const heldBoutiqueSlugs = [
    "world-traveller",
    "pure-amazon",
    "star-explorer",
    "wind-star",
    "amadeus-aurea",
    "ss-elisabeth",
    "lagoon-420-catamaran-dalmatia",
    "lagoon-520-catamaran-phuket",
  ];
  for (const slug of heldBoutiqueSlugs) {
    const rec = getDccCanonicalShipBySlug(slug);
    assert.ok(rec);
    assert.equal(rec.isIndexable, false, `${slug} must remain noindex, follow`);
    assert.equal(rec.robotsDirective, "noindex, follow");
  }
});
