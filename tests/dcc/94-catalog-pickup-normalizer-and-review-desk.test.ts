import test from "node:test";
import assert from "node:assert/strict";
import {
  getDurableCatalogSummaryReport,
  normalizeCatalogBatchPickupAndMeeting,
  normalizeCatalogTourPickupAndMeeting,
  queueCatalogPickupExceptionsToReviewDesk,
  queryDurableTourCatalog,
  type DurableTourRecord,
} from "../../lib/dcc/catalog/durableCatalogStore";
import { loadDurableResearchSyncState } from "../../lib/dcc/research/approvedFactsFeed";

test("1. normalizeCatalogTourPickupAndMeeting strips generic city placeholders, marks missing facts as unknown, and downgrades unverified cruise transfer claims", () => {
  const rawTour: DurableTourRecord = {
    tourId: "dcc:tour:viator:TEST_PLACEHOLDER_PICKUP",
    compatibilityAliases: [],
    destinationSlug: "st-thomas",
    portSlug: "st-thomas",
    earthosDestinationNodeId: "earthos:dest:usvi:st-thomas",
    timeZone: "America/St_Thomas",
    title: "St. Thomas Island Snorkel Test",
    summary: "Snorkel excursion",
    category: "Water & Snorkeling",
    tags: [],
    primaryProvider: "viator",
    providerProductCode: "TEST_PLACEHOLDER_PICKUP",
    operatorName: null,
    operatorCode: null,
    capabilityTier: "live_check_referral",
    commissionAuthorized: true,
    durationMinutes: 210,
    durationRawText: "3h 30m",
    fromPriceCents: 11900,
    priceBasis: "per_person",
    currency: "USD",
    freeCancellation: true,
    cancellationPolicyType: "STANDARD",
    cancellationCutoffHours: 24,
    cancellationSummary: "24h",
    hasHotelPickup: null,
    pickupType: null,
    pickupFulfillmentType: undefined,
    pickupSummary: null,
    meetingPointName: "St. Thomas, USVI",
    meetingPointAddress: "Charlotte Amalie, St. Thomas",
    meetingPointLat: 18.3419,
    meetingPointLng: -64.9307,
    locationPrecision: "exact",
    pickupLocations: [],
    ageBands: [],
    constraints: {
      cruiseBufferBeforeMinutes: 20,
      cruiseBufferAfterMinutes: 20,
      transferTimeSource: "verified_pier_pickup",
      transferEvidenceSource: null,
      applicableBerthOrMeetingPoint: null,
      planningEstimateTransferMinutes: 25,
    },
    channelOffers: [],
    productOptions: [
      {
        optionCode: "TG1",
        title: "Morning Departure",
        description: null,
        includesPickup: false,
        pickupFulfillmentType: "self_drive",
        meetingPointName: "St. Thomas",
        meetingPointLat: 18.3419,
        meetingPointLng: -64.9307,
        transferBeforeMinutes: 15,
        transferAfterMinutes: 15,
        transferTimeSource: "verified_meeting_point",
        transferEvidenceSource: null,
        applicableBerthOrMeetingPoint: null,
        planningEstimateTransferMinutes: 25,
        durationMinutes: 210,
        fromPriceCents: 11900,
        priceBasis: "per_person",
        scheduledStartTimes: ["09:00"],
      },
    ],
    inclusions: [],
    exclusions: [],
    primaryImageUrl: null,
    ratingAverage: 4.8,
    reviewCount: 42,
    bookingUrl: "https://www.viator.com/tours/St-Thomas/Test/d965-TEST_PLACEHOLDER_PICKUP",
    provenance: {
      sourceSystem: "viator_partner_v2",
      sourceEndpoint: "/partner/products/TEST_PLACEHOLDER_PICKUP",
      fetchedAt: "2026-11-06T12:00:00.000Z",
      contentSha256: "abc123",
      rawFieldsVerified: {
        durationKnown: true,
        cancellationKnown: true,
        pickupKnown: true,
        meetingCoordinatesKnown: true,
        ageBandsKnown: false,
      },
    },
    active: true,
    lastVerifiedAt: "2026-11-06T12:00:00.000Z",
    updatedAt: "2026-11-06T12:00:00.000Z",
    createdAt: "2026-11-06T12:00:00.000Z",
  };

  const { normalizedRecord, exceptions } = normalizeCatalogTourPickupAndMeeting(rawTour);

  // Generic city placeholder stripped -> explicit null & locationPrecision="unknown"
  assert.equal(normalizedRecord.pickupType, "UNKNOWN");
  assert.equal(normalizedRecord.pickupFulfillmentType, "unknown");
  assert.equal(normalizedRecord.meetingPointName, null);
  assert.equal(normalizedRecord.meetingPointAddress, null);
  assert.equal(normalizedRecord.meetingPointLat, null);
  assert.equal(normalizedRecord.meetingPointLng, null);
  assert.equal(normalizedRecord.locationPrecision, "unknown");
  assert.equal(normalizedRecord.provenance.rawFieldsVerified.pickupKnown, false);
  assert.equal(normalizedRecord.provenance.rawFieldsVerified.meetingCoordinatesKnown, false);

  // Unverified transfer claim downgraded
  assert.equal(normalizedRecord.constraints.cruiseBufferBeforeMinutes, null);
  assert.equal(normalizedRecord.constraints.transferTimeSource, "planning_estimate");
  assert.equal(normalizedRecord.productOptions?.[0].meetingPointName, null);
  assert.equal(normalizedRecord.productOptions?.[0].transferBeforeMinutes, null);
  assert.equal(normalizedRecord.productOptions?.[0].transferTimeSource, "planning_estimate");

  const codes = exceptions.map((e) => e.exceptionCode);
  assert.ok(codes.includes("missing_pickup_mode"));
  assert.ok(codes.includes("unverified_cruise_berth_transfer"));
  assert.ok(codes.includes("option_pickup_unknown_or_ambiguous"));
});

test("2. normalizeCatalogBatchPickupAndMeeting and queueCatalogPickupExceptionsToReviewDesk route catalog pickup exceptions into the Review Desk as needs confirmation", async () => {
  process.env.ALLOW_IN_MEMORY_NONCE_FALLBACK_FOR_TESTS = "true";

  const catalogSlice = await queryDurableTourCatalog({
    destinationSlug: "st-thomas",
    limit: 25,
  });
  assert.ok(catalogSlice.records.length > 0);

  const batch = normalizeCatalogBatchPickupAndMeeting(catalogSlice.records);
  assert.equal(batch.summary.totalRecordsEvaluated, catalogSlice.records.length);
  assert.ok(batch.exceptions.length > 0, "Expected pickup/meeting exceptions on unverified St. Thomas records");

  const queued = await queueCatalogPickupExceptionsToReviewDesk(batch.exceptions, {
    maxRowsToQueue: 15,
  });
  assert.ok(queued.queuedCount > 0 && queued.queuedCount <= 15);
  assert.ok(queued.reviewDeskCandidateRows.every((r) => r.status === "needs confirmation"));
  assert.ok(queued.reviewDeskCandidateRows.every((r) => r.verified_on === null));
  assert.ok(queued.reviewDeskCandidateRows.every((r) => r.verified_by === null));
  assert.ok(queued.reviewDeskCandidateRows.every((r) => r.constraint_type === "pickup_meeting"));

  const syncedState = await loadDurableResearchSyncState();
  if (syncedState) {
    const firstFactId = queued.reviewDeskCandidateRows[0].fact_id!;
    const storedRow = syncedState.rows_by_fact_id[firstFactId];
    assert.ok(storedRow, `Expected Review Desk durable sync store to contain ${firstFactId}`);
    assert.equal(storedRow.status, "needs confirmation");
    assert.equal(storedRow.verified_on, null);
    assert.equal(storedRow.verified_by, null);
  }

  const summaryReport = await getDurableCatalogSummaryReport();
  assert.ok(summaryReport.pickupAndMeetingNormalization);
  assert.ok(summaryReport.pickupAndMeetingNormalization.totalRecordsEvaluated >= 1450);
  assert.ok(summaryReport.pickupAndMeetingNormalization.totalExceptionsCount > 0);
  assert.equal(
    summaryReport.pickupAndMeetingNormalization.reviewDeskSyncOrigin,
    "catalog_pickup_normalizer_exception_queue",
  );
});

test("3. deduplicatePickupExceptionsForReviewDesk collapses option-level duplicate exceptions per productCode + exceptionCode", async () => {
  const { deduplicatePickupExceptionsForReviewDesk } = await import(
    "../../lib/dcc/catalog/durableCatalogStore"
  );
  const rawExceptions = [
    {
      exceptionId: "exc-1",
      factId: "fact-1",
      tourId: "dcc:tour:viator:15200P6",
      providerProductCode: "15200P6",
      destinationSlug: "new-orleans",
      portSlug: null,
      title: "Swamp Tour Boat Adventure",
      optionCode: "TG1",
      exceptionCode: "option_pickup_unknown_or_ambiguous" as const,
      observedStateSummary: "Option TG1 missing pickup details",
      humanDecisionRequired: "Confirm option TG1 pickup",
      rawPickupType: "OTHER",
      rawMeetingPointName: null,
      rawMeetingPointAddress: null,
      rawTransferTimeSource: "unknown",
    },
    {
      exceptionId: "exc-2",
      factId: "fact-2",
      tourId: "dcc:tour:viator:15200P6",
      providerProductCode: "15200P6",
      destinationSlug: "new-orleans",
      portSlug: null,
      title: "Swamp Tour Boat Adventure",
      optionCode: "TG2",
      exceptionCode: "option_pickup_unknown_or_ambiguous" as const,
      observedStateSummary: "Option TG2 missing pickup details",
      humanDecisionRequired: "Confirm option TG2 pickup",
      rawPickupType: "OTHER",
      rawMeetingPointName: null,
      rawMeetingPointAddress: null,
      rawTransferTimeSource: "unknown",
    },
  ];
  const deduped = deduplicatePickupExceptionsForReviewDesk(rawExceptions as any);
  assert.equal(deduped.length, 1);
  assert.equal(deduped[0].optionCode, "TG1,TG2");
  assert.match(deduped[0].observedStateSummary, /Deduplicated across 2 options: TG1, TG2/);
});

test("4. GET /api/v1/tours/catalog enforces read-only semantics (405 on queueReviewDesk) and POST requires admin authentication (401)", async () => {
  const { GET, POST } = await import("../../app/api/v1/tours/catalog/route");
  const { NextRequest } = await import("next/server");

  const getWithMutationAttempt = new NextRequest(
    "https://www.destinationcommandcenter.com/api/v1/tours/catalog?exceptions=true&queueReviewDesk=true",
    { method: "GET" },
  );
  const getRes = await GET(getWithMutationAttempt);
  assert.equal(getRes.status, 405);
  const getBody = await getRes.json();
  assert.equal(getBody.error, "catalog_get_is_read_only");

  const unauthPost = new NextRequest(
    "https://www.destinationcommandcenter.com/api/v1/tours/catalog",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "queue_review_desk", destination: "st-thomas" }),
    },
  );
  const postRes = await POST(unauthPost);
  assert.equal(postRes.status, 401);
});

