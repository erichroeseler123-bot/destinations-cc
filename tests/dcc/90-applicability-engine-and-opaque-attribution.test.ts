import test from "node:test";
import assert from "node:assert/strict";
import {
  APPLICABILITY_COMPILER_VERSION,
  APPLICABILITY_MODEL_VERSION,
  compileApplicableDecisionContext,
  getVersionedApplicabilityContextModel,
} from "@/lib/dcc/applicability";
import {
  createCommercialHandoff,
  getFunnelMetricsReport,
  getOpaqueClickAttributionById,
  issueCommerceAdminToken,
  issueOpaqueClickAttribution,
  reconcilePartnerCsvBatchByClickId,
  reconcilePartnerWebhookByClickId,
  recordCommercialOutcome,
  recordFunnelVisitorSession,
  resetCommercialMemoryStoreForTests,
  resetOpaqueAttributionLedgerForTests,
  sanitizeOutboundPartnerUrlWithOpaqueClickId,
  signPartnerWebhookPayload,
} from "@/lib/dcc/commerce";
import { DENVER_MOUNTAIN_DECISION_ENGINE } from "@/lib/dcc/decisionEngines/denverMountainTransportationEngine";
import { POST as evaluateApplicabilityPost } from "@/app/api/v1/applicability/evaluate/route";
import {
  GET as clickAttributionGet,
  POST as clickAttributionPost,
} from "@/app/api/v1/commerce/click-attribution/route";

test("1. Versioned Context & Applicability Model exposes deterministic schema and hash", () => {
  const modelA = getVersionedApplicabilityContextModel();
  const modelB = getVersionedApplicabilityContextModel();

  assert.equal(modelA.modelVersion, APPLICABILITY_MODEL_VERSION);
  assert.equal(modelA.compilerVersion, APPLICABILITY_COMPILER_VERSION);
  assert.equal(modelA.modelHash, modelB.modelHash);
  assert.match(modelA.modelHash, /^sha256:[0-9a-f]{64}$/);

  const segmentIds = new Set(modelA.segments.map((s) => s.segmentId));
  assert.equal(segmentIds.has("seg:i70-den-eisenhower-tunnel"), true);
  assert.equal(segmentIds.has("seg:i70-vail-pass"), true);
  assert.equal(segmentIds.has("seg:den-red-rocks-morrison"), true);
  assert.equal(segmentIds.has("seg:jnu-port-mendenhall-corridor"), true);
  assert.equal(segmentIds.has("seg:nola-fq-barataria-lafitte"), true);

  const regulationIds = new Set(
    modelA.regulations.map((r) => r.regulationId),
  );
  assert.equal(regulationIds.has("reg:co-passenger-traction-law-code-15"), true);
  assert.equal(regulationIds.has("reg:co-passenger-chain-law-code-16"), true);
  assert.equal(regulationIds.has("reg:co-commercial-chain-law-code-18"), true);
});

test("2. Deterministic compiler compiles Vail Pass Chain Law + 6 bags into final vehicle and segment outcome", () => {
  const input = {
    corridorId: "corridor:denver-vail-i70" as const,
    travelDate: "2026-12-15",
    passengerCount: 5,
    standardBagCount: 6,
    skiOrOversizeBagCount: 0,
    activeSegmentConditions: {
      i70TractionLawActive: true,
      vailPassChainLawActive: true,
    },
  };

  const outcome1 = compileApplicableDecisionContext(input);
  const outcome2 = compileApplicableDecisionContext(input);

  // Strict determinism across identical inputs
  assert.equal(outcome1.decisionReceiptId, outcome2.decisionReceiptId);
  assert.equal(outcome1.outcomeHash, outcome2.outcomeHash);
  assert.match(outcome1.decisionReceiptId, /^rcpt:sha256:[0-9a-f]{64}$/);

  // Active regulations compiled for Vail Pass Chain Law
  const activeRegIds = outcome1.compiledRegulations.map((r) => r.regulationId);
  assert.equal(
    activeRegIds.includes("reg:co-passenger-chain-law-code-16"),
    true,
  );
  assert.equal(
    activeRegIds.includes("reg:co-commercial-chain-law-code-18"),
    true,
  );

  const vailPassSegment = outcome1.compiledSegmentConstraints.find(
    (d) => d.segmentId === "seg:i70-vail-pass",
  );
  assert.ok(vailPassSegment);
  assert.equal(
    vailPassSegment.compiledSegmentStatus,
    "active_chain_law_enforcement",
  );
  assert.equal(
    vailPassSegment.activeRegulationIds.includes(
      "reg:co-passenger-chain-law-code-16",
    ),
    true,
  );

  // 5 passengers with 6 bags requires raising the 3rd row in a full-size SUV, capping rear cargo at 4 bags
  const suvOutcome = outcome1.vehicleClassEvaluations.find(
    (v) => v.vehicleClassId === "veh:awd-full-size-suv",
  );
  assert.ok(suvOutcome);
  assert.equal(suvOutcome.disposition, "ineligible");
  assert.equal(
    suvOutcome.constraintCodes.includes(
      "DISQUALIFIED_CARGO_VOLUME_EXCEEDS_SUV_THIRD_ROW_UP_ENVELOPE",
    ),
    true,
  );

  // Primary recommended vehicle class is upgraded to up-to-10-passenger private van
  assert.equal(
    outcome1.recommendedVehicleClassId,
    "veh:private-transit-van-10",
  );
  assert.match(outcome1.compiledDecisionSummary.headline, /Vail Pass Chain Law/);
  assert.match(
    outcome1.compiledDecisionSummary.baggageEnvelopeResolution,
    /6 bags/,
  );
});

test("3. Deterministic compiler enforces Juneau helicopter weight tiers and New Orleans airboat age gates", () => {
  const juneauOutcome = compileApplicableDecisionContext({
    corridorId: "corridor:juneau-port-icefield",
    travelDate: "2026-07-15",
    passengerCount: 2,
    standardBagCount: 0,
    maxSinglePassengerWeightLbs: 265,
  });
  const heliOutcome = juneauOutcome.vehicleClassEvaluations.find(
    (v) => v.vehicleClassId === "veh:heli-astar-as350",
  );
  assert.ok(heliOutcome);
  assert.equal(
    heliOutcome.constraintCodes.includes(
      "ROTORCRAFT_WEIGHT_TIER_260_299_HALF_SEAT_SURCHARGE",
    ),
    true,
  );

  const nolaOutcome = compileApplicableDecisionContext({
    corridorId: "corridor:new-orleans-barataria-swamp",
    travelDate: "2026-10-15",
    passengerCount: 4,
    standardBagCount: 1,
    youngestPassengerAgeYears: 3,
  });
  const airboatOutcome = nolaOutcome.vehicleClassEvaluations.find(
    (v) => v.vehicleClassId === "veh:small-open-airboat",
  );
  assert.ok(airboatOutcome);
  assert.equal(airboatOutcome.disposition, "ineligible");
  assert.equal(
    airboatOutcome.constraintCodes.includes(
      "DISQUALIFIED_MIN_PASSENGER_AGE_5_YEARS",
    ),
    true,
  );
  assert.equal(
    nolaOutcome.recommendedVehicleClassId,
    "veh:covered-pontoon-swamp-boat",
  );
});

test("4. Opaque Attribution Ledger strips cryptographic decision receipts from outbound partner links and maps click_id internally", async () => {
  resetOpaqueAttributionLedgerForTests();
  resetCommercialMemoryStoreForTests();

  const rawLeakyUrl =
    "https://www.viator.com/tours/Juneau/Mendenhall/d941-2519ICE?receipt_id=rcpt:sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa&evidence_version=v0.3.0&bundle_hash=bbbbbbbb";

  const attribution = issueOpaqueClickAttribution({
    decisionReceiptId:
      "rcpt:sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    recommendedOperatorId: "viator:2519ICE",
    recommendedOperatorName: "Coastal Helicopters Icefield Excursion",
    recommendedVehicleClassId: "veh:heli-astar-as350",
    evidenceVersion: "dcc-evidence-stewardship/2026.11",
    provider: "viator",
    productCode: "2519ICE",
    productDestinationUrl: rawLeakyUrl,
  });

  assert.match(attribution.clickId, /^clk_[0-9a-f]{24}$/);
  assert.equal(
    attribution.outboundPartnerUrl.includes("receipt_id"),
    false,
    "Outbound partner URL must never contain receipt_id",
  );
  assert.equal(
    attribution.outboundPartnerUrl.includes("rcpt:sha256:"),
    false,
    "Outbound partner URL must never leak rcpt:sha256 cryptographic receipts",
  );
  assert.equal(
    attribution.outboundPartnerUrl.includes("evidence_version"),
    false,
    "Outbound partner URL must never leak evidence_version",
  );
  assert.equal(
    attribution.outboundPartnerUrl.includes(`click_id=${attribution.clickId}`),
    true,
    "Outbound partner URL must append opaque click_id",
  );
  assert.equal(attribution.strippedLeakParams.includes("receipt_id"), true);
  assert.equal(
    attribution.strippedLeakParams.includes("evidence_version"),
    true,
  );
  assert.equal(attribution.strippedLeakParams.includes("bundle_hash"), true);

  // Verify internal lookup preserves full provenance
  const stored = getOpaqueClickAttributionById(attribution.clickId);
  assert.ok(stored);
  assert.equal(
    stored.decisionReceiptId,
    "rcpt:sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  );
  assert.equal(stored.recommendedOperatorId, "viator:2519ICE");
  assert.equal(stored.evidenceVersion, "dcc-evidence-stewardship/2026.11");

  // Also verify createCommercialHandoff never leaks receipt_id to partner URLs
  const handoff = await createCommercialHandoff({
    originatingSite: "destinationcommandcenter.com",
    provider: "viator",
    productCode: "2519ICE",
    productDestinationUrl:
      "https://www.viator.com/tours/Juneau/Mendenhall-Glacier/d941-2519ICE",
    receiptId:
      "rcpt:sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
    evaluationRunId: "evalrun:v03:test-1",
    contextId: "ctx_juneau_01",
    intendedDate: "2026-07-15",
    partySize: 2,
    quotedPriceAmount: 758,
  });

  assert.match(handoff.clickId, /^clk_[0-9a-f]{24}$/);
  assert.equal(
    handoff.outboundAffiliateUrl.includes("receipt_id"),
    false,
    "CommercialHandoffRecord.outboundAffiliateUrl must never expose receipt_id",
  );
  assert.equal(
    handoff.outboundAffiliateUrl.includes("rcpt:sha256:"),
    false,
    "CommercialHandoffRecord.outboundAffiliateUrl must never expose rcpt:sha256:",
  );
  assert.equal(
    handoff.outboundAffiliateUrl.includes(`click_id=${handoff.clickId}`),
    true,
    "CommercialHandoffRecord.outboundAffiliateUrl must include opaque click_id",
  );
});

test("5. Background worker reconciles revenue via partner webhooks and CSV exports using opaque click_id", async () => {
  resetOpaqueAttributionLedgerForTests();
  resetCommercialMemoryStoreForTests();

  const clickA = issueOpaqueClickAttribution({
    decisionReceiptId:
      "rcpt:sha256:1111111111111111111111111111111111111111111111111111111111111111",
    recommendedOperatorId: "gosno:vail-private-van",
    recommendedOperatorName: "GoSno Mountain Transfer",
    recommendedVehicleClassId: "veh:private-transit-van-10",
    evidenceVersion: "dcc-evidence-stewardship/2026.11",
    provider: "direct",
    productCode: "gosno-vail-van",
    productDestinationUrl: "https://gosno.co/vail?origin=DEN&destination=Vail",
  });

  const clickB = issueOpaqueClickAttribution({
    decisionReceiptId:
      "rcpt:sha256:2222222222222222222222222222222222222222222222222222222222222222",
    recommendedOperatorId: "airboat-adventures:covered-pontoon",
    recommendedOperatorName: "Airboat Adventures",
    recommendedVehicleClassId: "veh:covered-pontoon-swamp-boat",
    evidenceVersion: "dcc-evidence-stewardship/2026.11",
    provider: "fareharbor",
    productCode: "airboat-covered-pontoon",
    productDestinationUrl: "https://airboatadventures.com/tours/",
  });

  // 5a. Webhook reconciliation by opaque click_id
  const webhookResult = reconcilePartnerWebhookByClickId({
    clickId: clickA.clickId,
    provider: "direct",
    providerBookingRef: "GOSNO-CONF-88412",
    eventType: "BOOKING_CONFIRMED",
    grossRevenueUsd: 699,
    estimatedCommissionUsd: 104.85,
    paidCommissionUsd: 104.85,
    currency: "USD",
    occurredAt: "2026-11-02T15:30:00.000Z",
  });

  assert.equal(webhookResult.matched, true);
  if (webhookResult.matched) {
    assert.equal(
      webhookResult.outcome.resolvedDecisionReceiptId,
      "rcpt:sha256:1111111111111111111111111111111111111111111111111111111111111111",
    );
    assert.equal(
      webhookResult.outcome.resolvedRecommendedOperatorId,
      "gosno:vail-private-van",
    );
    assert.equal(
      webhookResult.outcome.resolvedEvidenceVersion,
      "dcc-evidence-stewardship/2026.11",
    );
  }

  // 5b. CSV batch reconciliation by opaque click_id
  const csvBatch = [
    "click_id,booking_ref,status,gross_amount,commission_amount,currency,occurred_at",
    `${clickB.clickId},FH-NOLA-99201,CONFIRMED,260.00,39.00,USD,2026-11-02T16:00:00Z`,
    "clk_000000000000000000000000,FH-UNKNOWN-111,CONFIRMED,120.00,18.00,USD,2026-11-02T16:05:00Z",
  ].join("\n");

  const csvSummary = reconcilePartnerCsvBatchByClickId({
    provider: "fareharbor",
    csvText: csvBatch,
  });
  assert.equal(csvSummary.totalRows, 2);
  assert.equal(csvSummary.matchedCount, 1);
  assert.equal(csvSummary.unmatchedCount, 1);
  assert.equal(
    csvSummary.reconciledRecords[0].resolvedDecisionReceiptId,
    "rcpt:sha256:2222222222222222222222222222222222222222222222222222222222222222",
  );
  assert.equal(
    csvSummary.reconciledRecords[0].resolvedRecommendedOperatorId,
    "airboat-adventures:covered-pontoon",
  );

  // 5c. Also verify recordCommercialOutcome resolves clickId from handoff
  const handoff = await createCommercialHandoff({
    originatingSite: "destinationcommandcenter.com",
    provider: "viator",
    productCode: "2519ICE",
    productDestinationUrl:
      "https://www.viator.com/tours/Juneau/Mendenhall-Glacier/d941-2519ICE",
    receiptId:
      "rcpt:sha256:3333333333333333333333333333333333333333333333333333333333333333",
    intendedDate: "2026-07-15",
    partySize: 2,
    quotedPriceAmount: 758,
  });

  const outcome = await recordCommercialOutcome({
    reporterClientId: "worker:viator-reconciler",
    reporterProvenance: "partner_webhook",
    provider: "viator",
    providerBookingRef: "BR-VIATOR-7754321",
    eventType: "BOOKING_CONFIRMED",
    providerEventTime: "2026-11-02T17:00:00.000Z",
    clickId: handoff.clickId,
    bookedProductCode: "2519ICE",
    bookedDate: "2026-07-15",
    bookedPartySize: 2,
    bookingValueAmount: 758,
    paidCommissionAmount: 60.64,
  });

  assert.equal(outcome.reconciliationStatus, "matched");
  assert.equal(outcome.handoffId, handoff.handoffId);
  assert.equal(
    outcome.receiptId,
    "rcpt:sha256:3333333333333333333333333333333333333333333333333333333333333333",
  );
  assert.equal(
    sanitizeOutboundPartnerUrlWithOpaqueClickId(
      "https://gosno.co/vail?receipt_id=rcpt:sha256:abcd",
      handoff.clickId,
    ).outboundUrl.includes("receipt_id"),
    false,
  );
});

test("6. Protected Attribution Administration & End-to-End Booking-to-Reconciliation Flow (rejects invalid credentials and unsigned webhooks)", async () => {
  resetOpaqueAttributionLedgerForTests();
  resetCommercialMemoryStoreForTests();

  // Step 1: Evaluate trip applicability via API and issue an opaque click_id
  const evalReq = new Request("https://destinationcommandcenter.com/api/v1/applicability/evaluate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      corridorId: "corridor:denver-vail-i70",
      travelDate: "2026-12-20",
      passengerCount: 6,
      standardBagCount: 6,
      skiOrOversizeBagCount: 2,
      activeSegmentConditions: {
        i70TractionLawActive: true,
        vailPassChainLawActive: true,
      },
      partnerDestinationUrl:
        "https://gosno.co/vail?origin=DEN&destination=Vail&receipt_id=rcpt:sha256:should_be_stripped",
      partnerNetwork: "direct",
    }),
  });

  const evalRes = await evaluateApplicabilityPost(evalReq);
  assert.equal(evalRes.status, 200);
  const evalJson = (await evalRes.json()) as {
    ok: boolean;
    outcome: {
      decisionReceiptId: string;
      evidenceVersion: string;
      recommendedOperatorId: string;
    };
    opaqueAttribution: {
      clickId: string;
      outboundPartnerUrl: string;
      recommendedOperatorId: string;
    };
  };

  assert.equal(evalJson.ok, true);
  const { clickId, outboundPartnerUrl } = evalJson.opaqueAttribution;
  assert.match(clickId, /^clk_[0-9a-f]{24}$/);
  assert.equal(outboundPartnerUrl.includes("receipt_id"), false);
  assert.equal(outboundPartnerUrl.includes(`click_id=${clickId}`), true);

  // Step 2: Unauthenticated caller holding click_id is blocked from reading internal attribution record
  const unauthLookupRes = await clickAttributionGet(
    new Request(
      `https://destinationcommandcenter.com/api/v1/commerce/click-attribution?click_id=${clickId}`,
    ),
  );
  assert.equal(unauthLookupRes.status, 401);
  const unauthLookupJson = (await unauthLookupRes.json()) as {
    ok: boolean;
    code: string;
    record?: unknown;
  };
  assert.equal(unauthLookupJson.ok, false);
  assert.equal(unauthLookupJson.code, "COMMERCE_AUTH_REQUIRED");
  assert.equal(unauthLookupJson.record, undefined);

  // Step 3: Caller with invalid/arbitrary commerce admin token is rejected
  const invalidTokenLookupRes = await clickAttributionGet(
    new Request(
      `https://destinationcommandcenter.com/api/v1/commerce/click-attribution?click_id=${clickId}`,
      {
        headers: {
          "x-dcc-commerce-admin-token": "arbitrary-nonempty-invalid-token",
        },
      },
    ),
  );
  assert.equal(invalidTokenLookupRes.status, 401);
  const invalidTokenLookupJson = (await invalidTokenLookupRes.json()) as {
    ok: boolean;
    code: string;
  };
  assert.equal(invalidTokenLookupJson.ok, false);
  assert.equal(invalidTokenLookupJson.code, "COMMERCE_INVALID_CREDENTIALS");

  // Step 4: Unsigned partner webhook reconciliation is rejected
  const webhookPayloadObj = {
    action: "reconcile_webhook",
    click_id: clickId,
    provider: "direct",
    provider_booking_ref: "GOSNO-E2E-99001",
    event_type: "BOOKING_CONFIRMED",
    gross_revenue_usd: 749.0,
    estimated_commission_usd: 112.35,
    paid_commission_usd: 112.35,
    currency: "USD",
    occurred_at: "2026-12-20T18:10:00.000Z",
  };
  const rawWebhookBody = JSON.stringify(webhookPayloadObj);

  const unsignedWebhookRes = await clickAttributionPost(
    new Request(
      "https://destinationcommandcenter.com/api/v1/commerce/click-attribution",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: rawWebhookBody,
      },
    ),
  );
  assert.equal(unsignedWebhookRes.status, 401);
  const unsignedWebhookJson = (await unsignedWebhookRes.json()) as {
    ok: boolean;
    code: string;
  };
  assert.equal(unsignedWebhookJson.code, "WEBHOOK_SIGNATURE_REQUIRED");

  // Step 5: Forged/tampered HMAC signature on partner webhook is rejected
  const forgedWebhookRes = await clickAttributionPost(
    new Request(
      "https://destinationcommandcenter.com/api/v1/commerce/click-attribution",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-dcc-webhook-signature": `sha256=${"a".repeat(64)}`,
        },
        body: rawWebhookBody,
      },
    ),
  );
  assert.equal(forgedWebhookRes.status, 401);
  const forgedWebhookJson = (await forgedWebhookRes.json()) as {
    ok: boolean;
    code: string;
  };
  assert.equal(forgedWebhookJson.code, "WEBHOOK_SIGNATURE_INVALID");

  // Step 6: Unauthenticated CSV batch reconciliation is rejected
  const unauthCsvRes = await clickAttributionPost(
    new Request(
      "https://destinationcommandcenter.com/api/v1/commerce/click-attribution",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "reconcile_csv",
          provider: "direct",
          csvText: `click_id,booking_ref,status,gross_amount\n${clickId},GOSNO-CSV-1,CONFIRMED,749`,
        }),
      },
    ),
  );
  assert.equal(unauthCsvRes.status, 401);
  const unauthCsvJson = (await unauthCsvRes.json()) as {
    ok: boolean;
    code: string;
  };
  assert.equal(unauthCsvJson.code, "COMMERCE_AUTH_REQUIRED");

  // Step 7: Valid HMAC-signed partner webhook reconciles the booking back to the cryptographic receipt
  const validSignature = signPartnerWebhookPayload(rawWebhookBody);
  const signedWebhookRes = await clickAttributionPost(
    new Request(
      "https://destinationcommandcenter.com/api/v1/commerce/click-attribution",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-dcc-webhook-signature": validSignature,
        },
        body: rawWebhookBody,
      },
    ),
  );
  assert.equal(signedWebhookRes.status, 200);
  const signedWebhookJson = (await signedWebhookRes.json()) as {
    ok: boolean;
    matched: boolean;
    duplicateDelivery: boolean;
    outcome: {
      reconciliationId: string;
      clickId: string;
      providerBookingRef: string;
      resolvedDecisionReceiptId: string;
      resolvedRecommendedOperatorId: string;
      resolvedEvidenceVersion: string;
      grossRevenueUsd: number;
      paidCommissionUsd: number;
    };
  };
  assert.equal(signedWebhookJson.ok, true);
  assert.equal(signedWebhookJson.matched, true);
  assert.equal(signedWebhookJson.duplicateDelivery, false);
  assert.equal(signedWebhookJson.outcome.clickId, clickId);
  assert.equal(signedWebhookJson.outcome.providerBookingRef, "GOSNO-E2E-99001");
  assert.equal(
    signedWebhookJson.outcome.resolvedDecisionReceiptId,
    evalJson.outcome.decisionReceiptId,
  );
  assert.equal(
    signedWebhookJson.outcome.resolvedRecommendedOperatorId,
    evalJson.outcome.recommendedOperatorId,
  );
  assert.equal(
    signedWebhookJson.outcome.resolvedEvidenceVersion,
    evalJson.outcome.evidenceVersion,
  );
  assert.equal(signedWebhookJson.outcome.grossRevenueUsd, 749);
  assert.equal(signedWebhookJson.outcome.paidCommissionUsd, 112.35);

  // Step 8: Duplicate webhook delivery is idempotently deduplicated
  const duplicateWebhookRes = await clickAttributionPost(
    new Request(
      "https://destinationcommandcenter.com/api/v1/commerce/click-attribution",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-dcc-webhook-signature": validSignature,
        },
        body: rawWebhookBody,
      },
    ),
  );
  assert.equal(duplicateWebhookRes.status, 200);
  const duplicateWebhookJson = (await duplicateWebhookRes.json()) as {
    ok: boolean;
    matched: boolean;
    duplicateDelivery: boolean;
    outcome: { reconciliationId: string };
  };
  assert.equal(duplicateWebhookJson.duplicateDelivery, true);
  assert.equal(
    duplicateWebhookJson.outcome.reconciliationId,
    signedWebhookJson.outcome.reconciliationId,
  );

  // Step 9: Authenticated commerce admin lookup retrieves the internal record and reconciled booking
  const adminToken = issueCommerceAdminToken("admin:commerce-reconciler");
  const authLookupRes = await clickAttributionGet(
    new Request(
      `https://destinationcommandcenter.com/api/v1/commerce/click-attribution?click_id=${clickId}`,
      {
        headers: {
          "x-dcc-commerce-admin-token": adminToken,
        },
      },
    ),
  );
  assert.equal(authLookupRes.status, 200);
  const authLookupJson = (await authLookupRes.json()) as {
    ok: boolean;
    authenticatedActorId: string;
    record: {
      clickId: string;
      decisionReceiptId: string;
      recommendedOperatorId: string;
      evidenceVersion: string;
    };
    reconciledOutcomes: Array<{
      providerBookingRef: string;
      resolvedDecisionReceiptId: string;
    }>;
  };
  assert.equal(authLookupJson.ok, true);
  assert.equal(authLookupJson.authenticatedActorId, "admin:commerce-reconciler");
  assert.equal(
    authLookupJson.record.decisionReceiptId,
    evalJson.outcome.decisionReceiptId,
  );
  assert.equal(authLookupJson.reconciledOutcomes.length, 1);
  assert.equal(
    authLookupJson.reconciledOutcomes[0].providerBookingRef,
    "GOSNO-E2E-99001",
  );
});

test("7. GoSno 10-passenger vs. 11-passenger capacity boundaries, gear-fit rules, and Vail/Breckenridge handoff verification", async () => {
  // 7a. 10 passengers within luggage/ski-gear fit envelope -> eligible for GoSno van, subject to gear fit and availability
  const vail10EvalRes = await evaluateApplicabilityPost(
    new Request("https://destinationcommandcenter.com/api/v1/applicability/evaluate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        corridorId: "corridor:denver-vail-i70",
        travelDate: "2026-12-20",
        passengerCount: 10,
        standardBagCount: 8,
        skiOrOversizeBagCount: 6,
        activeSegmentConditions: {
          i70TractionLawActive: true,
          vailPassChainLawActive: true,
        },
      }),
    }),
  );
  assert.equal(vail10EvalRes.status, 200);
  const vail10Json = (await vail10EvalRes.json()) as any;
  assert.equal(vail10Json.ok, true);
  assert.equal(vail10Json.outcome.recommendedVehicleClassId, "veh:private-transit-van-10");
  assert.equal(vail10Json.outcome.recommendedOperatorId, "op:gosno");

  const vail10Van = vail10Json.outcome.vehicleClassEvaluations.find(
    (v: any) => v.vehicleClassId === "veh:private-transit-van-10",
  );
  assert.ok(vail10Van);
  assert.equal(vail10Van.disposition, "recommended");
  assert.equal(vail10Van.capacityResolution.maxAllowedPassengers, 10);
  assert.equal(vail10Van.capacityResolution.fitsPassengerEnvelope, true);
  assert.equal(vail10Van.capacityResolution.fitsBaggageEnvelope, true);
  assert.equal(
    vail10Van.constraintCodes.includes("SUBJECT_TO_LUGGAGE_AND_SKI_GEAR_FIT_AND_AVAILABILITY"),
    true,
  );
  assert.equal(
    vail10Van.constraintCodes.includes("TEN_PASSENGER_MAX_CAPACITY_GEAR_FIT_CHECK_REQUIRED"),
    true,
  );
  assert.equal(vail10Van.pricingResolution.fixedRateOneWayUsd, 799);
  assert.equal(vail10Van.pricingResolution.quoteOnly, true);

  // Verify Vail handoff URL carries exact route and trip parameters
  const vailHandoffUrl = new URL(vail10Json.opaqueAttribution.outboundPartnerUrl);
  assert.equal(vailHandoffUrl.origin + vailHandoffUrl.pathname, "https://gosno.co/vail");
  assert.equal(vailHandoffUrl.searchParams.get("origin"), "DEN");
  assert.equal(vailHandoffUrl.searchParams.get("destination"), "Vail");
  assert.equal(vailHandoffUrl.searchParams.get("date"), "2026-12-20");
  assert.equal(vailHandoffUrl.searchParams.get("passengers"), "10");
  assert.equal(vailHandoffUrl.searchParams.get("passengerCount"), "10");
  assert.equal(vailHandoffUrl.searchParams.get("party_size"), "10");
  assert.equal(vailHandoffUrl.searchParams.get("standardBags"), "8");
  assert.equal(vailHandoffUrl.searchParams.get("skiBags"), "6");
  assert.equal(vailHandoffUrl.searchParams.get("vehicleClass"), "van");
  assert.equal(vailHandoffUrl.searchParams.get("publishedPrice"), "799");
  assert.match(vailHandoffUrl.searchParams.get("click_id") ?? "", /^clk_[0-9a-f]{24}$/);

  // 7b. 10 passengers exceeding luggage/ski-gear fit -> disqualified for single GoSno van
  const vail10OverGear = compileApplicableDecisionContext({
    corridorId: "corridor:denver-vail-i70",
    travelDate: "2026-12-20",
    passengerCount: 10,
    standardBagCount: 12,
    skiOrOversizeBagCount: 11,
  });
  const overGearVan = vail10OverGear.vehicleClassEvaluations.find(
    (v) => v.vehicleClassId === "veh:private-transit-van-10",
  );
  assert.ok(overGearVan);
  assert.equal(overGearVan.disposition, "ineligible");
  assert.equal(overGearVan.capacityResolution.fitsPassengerEnvelope, true);
  assert.equal(overGearVan.capacityResolution.fitsBaggageEnvelope, false);
  assert.equal(
    overGearVan.constraintCodes.includes("DISQUALIFIED_CARGO_VOLUME_EXCEEDS_VEHICLE_ENVELOPE"),
    true,
  );
  assert.equal(
    overGearVan.constraintCodes.includes("DISQUALIFIED_OVERSIZE_SKI_BAG_COUNT_EXCEEDS_LIMIT"),
    true,
  );

  // 7c. 11 passengers -> INELIGIBLE for a single GoSno van on both Vail and Breckenridge
  const vail11EvalRes = await evaluateApplicabilityPost(
    new Request("https://destinationcommandcenter.com/api/v1/applicability/evaluate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        corridorId: "corridor:denver-vail-i70",
        travelDate: "2026-12-20",
        passengerCount: 11,
        standardBagCount: 8,
        skiOrOversizeBagCount: 4,
      }),
    }),
  );
  assert.equal(vail11EvalRes.status, 200);
  const vail11Json = (await vail11EvalRes.json()) as any;
  const vail11Van = vail11Json.outcome.vehicleClassEvaluations.find(
    (v: any) => v.vehicleClassId === "veh:private-transit-van-10",
  );
  assert.ok(vail11Van);
  assert.equal(vail11Van.disposition, "ineligible");
  assert.equal(vail11Van.capacityResolution.maxAllowedPassengers, 10);
  assert.equal(vail11Van.capacityResolution.fitsPassengerEnvelope, false);
  assert.equal(
    vail11Van.constraintCodes.includes("DISQUALIFIED_PASSENGER_COUNT_EXCEEDS_LEGAL_SEAT_CAP"),
    true,
  );
  assert.notEqual(vail11Json.outcome.recommendedOperatorId, "op:gosno");
  assert.equal(vail11Json.outcome.recommendedVehicleClassId, "veh:shared-mountain-shuttle");
  assert.equal(
    vail11Json.opaqueAttribution.outboundPartnerUrl.includes("gosno.co"),
    false,
    "11-passenger group must not be handed off to a single GoSno van",
  );

  // 7d. Breckenridge handoff verification (5 passengers in SUV at $499 one-way, and 10 passengers in van)
  const breck5EvalRes = await evaluateApplicabilityPost(
    new Request("https://destinationcommandcenter.com/api/v1/applicability/evaluate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        corridorId: "corridor:denver-breckenridge-i70",
        travelDate: "2026-12-22",
        passengerCount: 5,
        standardBagCount: 4,
        skiOrOversizeBagCount: 0,
      }),
    }),
  );
  assert.equal(breck5EvalRes.status, 200);
  const breck5Json = (await breck5EvalRes.json()) as any;
  assert.equal(breck5Json.outcome.recommendedVehicleClassId, "veh:awd-full-size-suv");
  assert.equal(breck5Json.outcome.recommendedOperatorId, "op:gosno");
  const breckSuv = breck5Json.outcome.vehicleClassEvaluations.find(
    (v: any) => v.vehicleClassId === "veh:awd-full-size-suv",
  );
  assert.equal(breckSuv.pricingResolution.fixedRateOneWayUsd, 499);

  const breckHandoffUrl = new URL(breck5Json.opaqueAttribution.outboundPartnerUrl);
  assert.equal(breckHandoffUrl.origin + breckHandoffUrl.pathname, "https://gosno.co/breckenridge");
  assert.equal(breckHandoffUrl.searchParams.get("origin"), "DEN");
  assert.equal(breckHandoffUrl.searchParams.get("destination"), "Breckenridge");
  assert.equal(breckHandoffUrl.searchParams.get("date"), "2026-12-22");
  assert.equal(breckHandoffUrl.searchParams.get("passengers"), "5");
  assert.equal(breckHandoffUrl.searchParams.get("passengerCount"), "5");
  assert.equal(breckHandoffUrl.searchParams.get("party_size"), "5");
  assert.equal(breckHandoffUrl.searchParams.get("standardBags"), "4");
  assert.equal(breckHandoffUrl.searchParams.get("skiBags"), "0");
  assert.equal(breckHandoffUrl.searchParams.get("vehicleClass"), "suv");
  assert.equal(breckHandoffUrl.searchParams.get("publishedPrice"), "499");

  // 7e. 16 passengers (DEN -> Breckenridge) -> single vehicles ineligible; offers GoSno group inquiry suggesting a van plus a Suburban ($1,298 reference)
  const breck16EvalRes = await evaluateApplicabilityPost(
    new Request("https://destinationcommandcenter.com/api/v1/applicability/evaluate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        corridorId: "corridor:denver-breckenridge-i70",
        travelDate: "2026-12-24",
        passengerCount: 16,
        standardBagCount: 16,
        skiOrOversizeBagCount: 12,
      }),
    }),
  );
  assert.equal(breck16EvalRes.status, 200);
  const breck16Json = (await breck16EvalRes.json()) as any;
  const breck16Group = breck16Json.outcome.privateGroupInquiryOption;
  assert.ok(breck16Group);
  assert.equal(breck16Group.status, "quote_only");
  assert.equal(breck16Group.nextStep, "request a quote");
  assert.equal(breck16Group.passengers, 16);
  assert.equal(breck16Group.vehicleSuggestion.summaryLabel, "a van plus a Suburban");
  assert.equal(
    breck16Group.vehicleSuggestion.shortLabel,
    "1 Private Passenger Van + 1 Private Chevrolet Suburban",
  );
  assert.equal(breck16Group.referenceCombinedOneWayUsd, 1298);
  assert.equal(
    breck16Group.confirmationPolicy,
    "GoSno confirms gear fit, availability, and one group total.",
  );
  const breck16Url = new URL(breck16Json.opaqueAttribution.outboundPartnerUrl);
  assert.equal(breck16Url.origin + breck16Url.pathname, "https://gosno.co/request-quote");
  assert.equal(breck16Url.searchParams.get("origin"), "DEN");
  assert.equal(breck16Url.searchParams.get("destination"), "Breckenridge");
  assert.equal(breck16Url.searchParams.get("outboundDate"), "2026-12-24");
  assert.equal(breck16Url.searchParams.get("passengers"), "16");
  assert.equal(breck16Url.searchParams.get("luggage"), "16 standard bags, 12 ski bags");
  assert.equal(
    breck16Url.searchParams.get("vehicleSuggestion"),
    "1 Private Passenger Van + 1 Private Chevrolet Suburban",
  );

  // 7f. 20 passengers (DEN -> Vail) -> single vehicles ineligible; offers GoSno group inquiry suggesting two vans ($1,598 reference)
  const vail20EvalRes = await evaluateApplicabilityPost(
    new Request("https://destinationcommandcenter.com/api/v1/applicability/evaluate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        corridorId: "corridor:denver-vail-i70",
        travelDate: "2026-12-26",
        passengerCount: 20,
        standardBagCount: 20,
        skiOrOversizeBagCount: 16,
      }),
    }),
  );
  assert.equal(vail20EvalRes.status, 200);
  const vail20Json = (await vail20EvalRes.json()) as any;
  const vail20Group = vail20Json.outcome.privateGroupInquiryOption;
  assert.ok(vail20Group);
  assert.equal(vail20Group.status, "quote_only");
  assert.equal(vail20Group.nextStep, "request a quote");
  assert.equal(vail20Group.passengers, 20);
  assert.equal(vail20Group.vehicleSuggestion.summaryLabel, "two vans");
  assert.equal(
    vail20Group.vehicleSuggestion.shortLabel,
    "2 Private Passenger Vans",
  );
  assert.equal(vail20Group.referenceCombinedOneWayUsd, 1598);
  assert.equal(
    vail20Group.confirmationPolicy,
    "GoSno confirms gear fit, availability, and one group total.",
  );
  const vail20Url = new URL(vail20Json.opaqueAttribution.outboundPartnerUrl);
  assert.equal(vail20Url.origin + vail20Url.pathname, "https://gosno.co/request-quote");
  assert.equal(vail20Url.searchParams.get("origin"), "DEN");
  assert.equal(vail20Url.searchParams.get("destination"), "Vail");
  assert.equal(vail20Url.searchParams.get("outboundDate"), "2026-12-26");
  assert.equal(vail20Url.searchParams.get("passengers"), "16" === "20" ? "16" : "20");
  assert.equal(vail20Url.searchParams.get("luggage"), "20 standard bags, 16 ski bags");
  assert.equal(
    vail20Url.searchParams.get("vehicleSuggestion"),
    "2 Private Passenger Vans",
  );

  // 7g. 16 to Winter Park: 16 regular bags, 12 ski bags, one van plus one Suburban suggested ($1,248 combined reference)
  const wp16EvalRes = await evaluateApplicabilityPost(
    new Request("https://destinationcommandcenter.com/api/v1/applicability/evaluate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        corridorId: "corridor:denver-vail-i70",
        origin: "DEN",
        destination: "Winter Park",
        travelDate: "2026-12-20",
        passengerCount: 16,
        standardBagCount: 16,
        skiOrOversizeBagCount: 12,
      }),
    }),
  );
  assert.equal(wp16EvalRes.status, 200);
  const wp16Json = (await wp16EvalRes.json()) as any;
  const wp16Group = wp16Json.outcome.privateGroupInquiryOption;
  assert.ok(wp16Group);
  assert.equal(wp16Group.origin, "DEN");
  assert.equal(wp16Group.destination, "Winter Park");
  assert.equal(wp16Group.passengers, 16);
  assert.equal(wp16Group.standardBagCount, 16);
  assert.equal(wp16Group.skiOrOversizeBagCount, 12);
  assert.equal(wp16Group.luggageSummary, "16 standard bags, 12 ski bags");
  assert.equal(
    wp16Group.vehicleSuggestion.shortLabel,
    "1 Private Passenger Van + 1 Private Chevrolet Suburban",
  );
  assert.equal(wp16Group.referenceCombinedOneWayUsd, 1248);
  const wp16Url = new URL(wp16Group.inquiryUrl);
  assert.equal(wp16Url.searchParams.get("destination"), "Winter Park");
  assert.equal(wp16Url.searchParams.get("passengers"), "16");
  assert.equal(wp16Url.searchParams.get("standardBags"), "16");
  assert.equal(wp16Url.searchParams.get("skiBags"), "12");
  assert.equal(wp16Url.searchParams.get("luggage"), "16 standard bags, 12 ski bags");
  assert.equal(
    wp16Url.searchParams.get("vehicleSuggestion"),
    "1 Private Passenger Van + 1 Private Chevrolet Suburban",
  );

  // 7h. 20 to Steamboat: 20 regular bags, 16 ski bags throughout, two vans suggested ($2,398 combined reference)
  const sb20EvalRes = await evaluateApplicabilityPost(
    new Request("https://destinationcommandcenter.com/api/v1/applicability/evaluate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        corridorId: "corridor:denver-vail-i70",
        origin: "DEN",
        destination: "Steamboat Springs",
        travelDate: "2026-12-22",
        passengerCount: 20,
        standardBagCount: 20,
        skiOrOversizeBagCount: 16,
      }),
    }),
  );
  assert.equal(sb20EvalRes.status, 200);
  const sb20Json = (await sb20EvalRes.json()) as any;
  const sb20Group = sb20Json.outcome.privateGroupInquiryOption;
  assert.ok(sb20Group);
  assert.equal(sb20Group.origin, "DEN");
  assert.equal(sb20Group.destination, "Steamboat Springs");
  assert.equal(sb20Group.passengers, 20);
  assert.equal(sb20Group.standardBagCount, 20);
  assert.equal(sb20Group.skiOrOversizeBagCount, 16);
  assert.equal(sb20Group.luggageSummary, "20 standard bags, 16 ski bags");
  assert.equal(sb20Group.vehicleSuggestion.shortLabel, "2 Private Passenger Vans");
  assert.equal(sb20Group.referenceCombinedOneWayUsd, 2398);
  const sb20Url = new URL(sb20Group.inquiryUrl);
  assert.equal(sb20Url.searchParams.get("destination"), "Steamboat Springs");
  assert.equal(sb20Url.searchParams.get("passengers"), "20");
  assert.equal(sb20Url.searchParams.get("standardBags"), "20");
  assert.equal(sb20Url.searchParams.get("skiBags"), "16");
  assert.equal(sb20Url.searchParams.get("luggage"), "20 standard bags, 16 ski bags");
  assert.equal(sb20Url.searchParams.get("vehicleSuggestion"), "2 Private Passenger Vans");

  // 7i. Copper Mountain DEN SUV approved rate is $449 (so 16 to Copper = $799 Van + $449 SUV = $1,248)
  const copper16EvalRes = await evaluateApplicabilityPost(
    new Request("https://destinationcommandcenter.com/api/v1/applicability/evaluate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        corridorId: "corridor:denver-vail-i70",
        origin: "DEN",
        destination: "Copper Mountain",
        travelDate: "2026-12-23",
        passengerCount: 16,
        standardBagCount: 16,
        skiOrOversizeBagCount: 12,
      }),
    }),
  );
  const copper16Json = (await copper16EvalRes.json()) as any;
  assert.equal(
    copper16Json.outcome.privateGroupInquiryOption.referenceCombinedOneWayUsd,
    1248,
  );
});

test("8. Winter Park Outbound, Return, and Round-Trip DCC -> GoSno handoffs preserve direction, pickup time, passengers, baggage, return details, and originating page", async () => {
  resetOpaqueAttributionLedgerForTests();
  resetCommercialMemoryStoreForTests();

  // 8a. Decision Engine evaluation for Winter Park OUTBOUND, RETURN, and ROUND_TRIP
  const wpOutboundEngine = DENVER_MOUNTAIN_DECISION_ENGINE.evaluate({
    destinationResort: "winter_park",
    tripDirection: "OUTBOUND",
    travelDate: "2026-12-20",
    pickupTime: "10:30",
    groupSize: 4,
    standardBagCount: 4,
    skiAndLuggageBagCount: 4,
    roofBoxConfirmed: true,
    originatingPage: "/transportation/colorado/winter-park",
  });
  const wpOutboundSuv = wpOutboundEngine.viableOptions.find(
    (o) => o.optionId === "co-mtn-gosno-private-suv",
  );
  assert.ok(wpOutboundSuv);
  assert.equal(wpOutboundSuv.indicativePriceUsd.min, 449);
  const wpOutboundEngineUrl = new URL(wpOutboundSuv.bookingDestinations[0].url);
  assert.equal(
    wpOutboundEngineUrl.origin + wpOutboundEngineUrl.pathname,
    "https://gosno.co/winter-park",
  );
  assert.equal(wpOutboundEngineUrl.searchParams.get("direction"), "OUTBOUND");
  assert.equal(wpOutboundEngineUrl.searchParams.get("tripType"), "one_way");
  assert.equal(wpOutboundEngineUrl.searchParams.get("origin"), "DEN");
  assert.equal(wpOutboundEngineUrl.searchParams.get("destination"), "Winter Park");
  assert.equal(wpOutboundEngineUrl.searchParams.get("pickupTime"), "10:30");
  assert.equal(wpOutboundEngineUrl.searchParams.get("passengers"), "4");
  assert.equal(wpOutboundEngineUrl.searchParams.get("standardBags"), "4");
  assert.equal(wpOutboundEngineUrl.searchParams.get("skiBags"), "4");
  assert.equal(wpOutboundEngineUrl.searchParams.get("luggage"), "8");
  assert.equal(wpOutboundEngineUrl.searchParams.get("publishedPrice"), "449");
  assert.equal(
    wpOutboundEngineUrl.searchParams.get("originatingPage"),
    "/transportation/colorado/winter-park",
  );

  const wpReturnEngine = DENVER_MOUNTAIN_DECISION_ENGINE.evaluate({
    destinationResort: "winter_park",
    tripDirection: "RETURN",
    travelDate: "2026-12-27",
    pickupTime: "07:15",
    groupSize: 4,
    standardBagCount: 4,
    skiAndLuggageBagCount: 4,
    roofBoxConfirmed: true,
    originatingPage: "/transportation/colorado/winter-park",
  });
  const wpReturnSuv = wpReturnEngine.viableOptions.find(
    (o) => o.optionId === "co-mtn-gosno-private-suv",
  );
  assert.ok(wpReturnSuv);
  assert.equal(wpReturnSuv.indicativePriceUsd.min, 449);
  const wpReturnEngineUrl = new URL(wpReturnSuv.bookingDestinations[0].url);
  assert.equal(
    wpReturnEngineUrl.origin + wpReturnEngineUrl.pathname,
    "https://gosno.co/winter-park-return-shuttle-to-denver-airport",
  );
  assert.equal(wpReturnEngineUrl.searchParams.get("direction"), "RETURN");
  assert.equal(wpReturnEngineUrl.searchParams.get("origin"), "Winter Park");
  assert.equal(wpReturnEngineUrl.searchParams.get("destination"), "DEN");
  assert.equal(wpReturnEngineUrl.searchParams.get("pickupTime"), "07:15");
  assert.equal(wpReturnEngineUrl.searchParams.get("passengers"), "4");
  assert.equal(wpReturnEngineUrl.searchParams.get("standardBags"), "4");
  assert.equal(wpReturnEngineUrl.searchParams.get("skiBags"), "4");
  assert.equal(wpReturnEngineUrl.searchParams.get("publishedPrice"), "449");
  assert.equal(
    wpReturnEngineUrl.searchParams.get("originatingPage"),
    "/transportation/colorado/winter-park",
  );

  const wpRoundTripEngine = DENVER_MOUNTAIN_DECISION_ENGINE.evaluate({
    destinationResort: "winter_park",
    tripDirection: "ROUND_TRIP",
    travelDate: "2026-12-20",
    pickupTime: "11:45",
    returnDate: "2026-12-27",
    returnPickupTime: "08:00",
    groupSize: 7,
    standardBagCount: 7,
    skiAndLuggageBagCount: 6,
    roofBoxConfirmed: true,
    originatingPage: "/transportation/colorado/winter-park",
  });
  const wpRoundTripVan = wpRoundTripEngine.viableOptions.find(
    (o) => o.optionId === "co-mtn-gosno-private-van",
  );
  assert.ok(wpRoundTripVan);
  assert.equal(wpRoundTripVan.indicativePriceUsd.min, 1598);
  const wpRoundTripEngineUrl = new URL(wpRoundTripVan.bookingDestinations[0].url);
  assert.equal(
    wpRoundTripEngineUrl.origin + wpRoundTripEngineUrl.pathname,
    "https://gosno.co/winter-park",
  );
  assert.equal(wpRoundTripEngineUrl.searchParams.get("direction"), "ROUND_TRIP");
  assert.equal(wpRoundTripEngineUrl.searchParams.get("tripType"), "round_trip");
  assert.equal(
    wpRoundTripEngineUrl.searchParams.get("routeId"),
    "DEN-WINTER-PARK-ROUND-TRIP",
  );
  assert.equal(wpRoundTripEngineUrl.searchParams.get("returnRouteId"), "WINTER-PARK-DEN");
  assert.equal(wpRoundTripEngineUrl.searchParams.get("pickupTime"), "11:45");
  assert.equal(wpRoundTripEngineUrl.searchParams.get("returnDate"), "2026-12-27");
  assert.equal(wpRoundTripEngineUrl.searchParams.get("returnPickupTime"), "08:00");
  assert.equal(wpRoundTripEngineUrl.searchParams.get("passengers"), "7");
  assert.equal(wpRoundTripEngineUrl.searchParams.get("standardBags"), "7");
  assert.equal(wpRoundTripEngineUrl.searchParams.get("skiBags"), "6");
  assert.equal(wpRoundTripEngineUrl.searchParams.get("publishedPrice"), "1598");
  assert.equal(
    wpRoundTripEngineUrl.searchParams.get("originatingPage"),
    "/transportation/colorado/winter-park",
  );

  // 8b. Applicability & Outbound Handoff API for Winter Park OUTBOUND, RETURN, and ROUND_TRIP
  const outboundApiRes = await evaluateApplicabilityPost(
    new Request("https://destinationcommandcenter.com/api/v1/applicability/evaluate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        corridorId: "corridor:denver-vail-i70",
        origin: "DEN",
        destination: "Winter Park",
        direction: "OUTBOUND",
        travelDate: "2026-12-20",
        pickupTime: "10:30",
        passengerCount: 4,
        standardBagCount: 4,
        skiOrOversizeBagCount: 2,
        roofBoxConfirmed: true,
        originatingPage: "/transportation/colorado",
      }),
    }),
  );
  assert.equal(outboundApiRes.status, 200);
  const outboundApiJson = (await outboundApiRes.json()) as any;
  assert.equal(
    outboundApiJson.outcome.gosnoPricingSnapshot.suvOffer.offerId,
    "DEN-WINTER-PARK-SUV",
  );
  assert.equal(
    outboundApiJson.outcome.gosnoPricingSnapshot.suvOffer.amountCents,
    44900,
  );
  assert.equal(
    outboundApiJson.outcome.gosnoPricingSnapshot.suvOffer.rezdyProductCode,
    "P360K5",
  );
  const outboundHandoffUrl = new URL(
    outboundApiJson.opaqueAttribution.outboundPartnerUrl,
  );
  assert.equal(
    outboundHandoffUrl.origin + outboundHandoffUrl.pathname,
    "https://gosno.co/winter-park",
  );
  assert.equal(outboundHandoffUrl.searchParams.get("direction"), "OUTBOUND");
  assert.equal(outboundHandoffUrl.searchParams.get("tripType"), "one_way");
  assert.equal(outboundHandoffUrl.searchParams.get("pickupTime"), "10:30");
  assert.equal(outboundHandoffUrl.searchParams.get("passengers"), "4");
  assert.equal(outboundHandoffUrl.searchParams.get("standardBags"), "4");
  assert.equal(outboundHandoffUrl.searchParams.get("skiBags"), "2");
  assert.equal(outboundHandoffUrl.searchParams.get("publishedPrice"), "799");
  assert.equal(
    outboundHandoffUrl.searchParams.get("originatingPage"),
    "/transportation/colorado",
  );
  assert.equal(
    outboundHandoffUrl.searchParams.get("click_id"),
    outboundApiJson.opaqueAttribution.clickId,
  );

  const returnApiRes = await evaluateApplicabilityPost(
    new Request("https://destinationcommandcenter.com/api/v1/applicability/evaluate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        corridorId: "corridor:denver-vail-i70",
        origin: "Winter Park",
        destination: "DEN",
        direction: "RETURN",
        travelDate: "2026-12-27",
        pickupTime: "07:15",
        passengerCount: 4,
        standardBagCount: 4,
        skiOrOversizeBagCount: 2,
        roofBoxConfirmed: true,
        originatingPage: "/transportation/colorado",
      }),
    }),
  );
  assert.equal(returnApiRes.status, 200);
  const returnApiJson = (await returnApiRes.json()) as any;
  assert.equal(
    returnApiJson.outcome.gosnoPricingSnapshot.suvOffer.offerId,
    "WINTER-PARK-DEN-SUV",
  );
  assert.equal(
    returnApiJson.outcome.gosnoPricingSnapshot.suvOffer.amountCents,
    44900,
  );
  assert.equal(
    returnApiJson.outcome.gosnoPricingSnapshot.suvOffer.rezdyProductCode,
    "PTTWDV",
  );
  const returnHandoffUrl = new URL(
    returnApiJson.opaqueAttribution.outboundPartnerUrl,
  );
  assert.equal(
    returnHandoffUrl.origin + returnHandoffUrl.pathname,
    "https://gosno.co/winter-park-return-shuttle-to-denver-airport",
  );
  assert.equal(returnHandoffUrl.searchParams.get("direction"), "RETURN");
  assert.equal(returnHandoffUrl.searchParams.get("origin"), "Winter Park");
  assert.equal(returnHandoffUrl.searchParams.get("destination"), "DEN");
  assert.equal(returnHandoffUrl.searchParams.get("pickupTime"), "07:15");
  assert.equal(returnHandoffUrl.searchParams.get("passengers"), "4");
  assert.equal(returnHandoffUrl.searchParams.get("standardBags"), "4");
  assert.equal(returnHandoffUrl.searchParams.get("skiBags"), "2");
  assert.equal(returnHandoffUrl.searchParams.get("publishedPrice"), "799");
  assert.equal(
    returnHandoffUrl.searchParams.get("originatingPage"),
    "/transportation/colorado",
  );
  assert.equal(
    returnHandoffUrl.searchParams.get("click_id"),
    returnApiJson.opaqueAttribution.clickId,
  );

  const roundTripApiRes = await evaluateApplicabilityPost(
    new Request("https://destinationcommandcenter.com/api/v1/applicability/evaluate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        corridorId: "corridor:denver-vail-i70",
        origin: "DEN",
        destination: "Winter Park",
        direction: "ROUND_TRIP",
        tripType: "ROUND_TRIP",
        travelDate: "2026-12-20",
        pickupTime: "11:45",
        returnDate: "2026-12-27",
        returnPickupTime: "08:00",
        passengerCount: 8,
        standardBagCount: 8,
        skiOrOversizeBagCount: 6,
        originatingPage: "/transportation/colorado",
      }),
    }),
  );
  assert.equal(roundTripApiRes.status, 200);
  const roundTripApiJson = (await roundTripApiRes.json()) as any;
  assert.equal(
    roundTripApiJson.outcome.gosnoPricingSnapshot.vanOffer.offerId,
    "DEN-WINTER-PARK-VAN",
  );
  assert.equal(
    roundTripApiJson.outcome.gosnoPricingSnapshot.roundTripVanOffer.offerId,
    "DEN-WINTER-PARK-ROUND-TRIP-VAN",
  );
  assert.equal(
    roundTripApiJson.outcome.gosnoPricingSnapshot.roundTripVanOffer.totalAmountCents,
    159800,
  );
  assert.equal(
    roundTripApiJson.outcome.gosnoPricingSnapshot.roundTripVanOffer.outboundRezdyProductCode,
    "PDU6A0",
  );
  assert.equal(
    roundTripApiJson.outcome.gosnoPricingSnapshot.roundTripVanOffer.returnRezdyProductCode,
    "PMERHT",
  );
  const roundTripHandoffUrl = new URL(
    roundTripApiJson.opaqueAttribution.outboundPartnerUrl,
  );
  assert.equal(
    roundTripHandoffUrl.origin + roundTripHandoffUrl.pathname,
    "https://gosno.co/winter-park",
  );
  assert.equal(roundTripHandoffUrl.searchParams.get("direction"), "ROUND_TRIP");
  assert.equal(roundTripHandoffUrl.searchParams.get("tripType"), "round_trip");
  assert.equal(
    roundTripHandoffUrl.searchParams.get("routeId"),
    "DEN-WINTER-PARK-ROUND-TRIP",
  );
  assert.equal(
    roundTripHandoffUrl.searchParams.get("returnRouteId"),
    "WINTER-PARK-DEN",
  );
  assert.equal(roundTripHandoffUrl.searchParams.get("pickupTime"), "11:45");
  assert.equal(roundTripHandoffUrl.searchParams.get("returnDate"), "2026-12-27");
  assert.equal(roundTripHandoffUrl.searchParams.get("returnPickupTime"), "08:00");
  assert.equal(roundTripHandoffUrl.searchParams.get("passengers"), "8");
  assert.equal(roundTripHandoffUrl.searchParams.get("standardBags"), "8");
  assert.equal(roundTripHandoffUrl.searchParams.get("skiBags"), "6");
  assert.equal(roundTripHandoffUrl.searchParams.get("publishedPrice"), "1598");
  assert.equal(
    roundTripHandoffUrl.searchParams.get("originatingPage"),
    "/transportation/colorado",
  );
  assert.equal(
    roundTripHandoffUrl.searchParams.get("click_id"),
    roundTripApiJson.opaqueAttribution.clickId,
  );
});

test("9. Personal-data filtering strips forbidden PII and email parameters on the actual outbound path", async () => {
  resetOpaqueAttributionLedgerForTests();

  const dirtyUrl =
    "https://gosno.co/winter-park?direction=OUTBOUND&passengers=4&name=Jane+Traveler&fullName=Jane+Traveler&email=jane.traveler%40example.com&phone=303-555-0199&passengerWeightLbs=165&bookingRef=RES-999&medicalNotes=asthma&custom_contact=alerts%40example.org&rule_ids=reg:co-passenger-chain-law-code-16";

  const evalRes = await evaluateApplicabilityPost(
    new Request("https://destinationcommandcenter.com/api/v1/applicability/evaluate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        corridorId: "corridor:denver-vail-i70",
        origin: "DEN",
        destination: "Winter Park",
        direction: "OUTBOUND",
        travelDate: "2026-12-20",
        pickupTime: "10:30",
        passengerCount: 4,
        standardBagCount: 4,
        skiOrOversizeBagCount: 2,
        roofBoxConfirmed: true,
        originatingPage: "/transportation/colorado",
        partnerDestinationUrl: dirtyUrl,
      }),
    }),
  );
  assert.equal(evalRes.status, 200);
  const evalJson = (await evalRes.json()) as any;
  const sanitizedUrl = new URL(evalJson.opaqueAttribution.outboundPartnerUrl);

  // Allowed trip details and click_id are preserved
  assert.equal(sanitizedUrl.searchParams.get("direction"), "OUTBOUND");
  assert.equal(sanitizedUrl.searchParams.get("passengers"), "4");
  assert.equal(sanitizedUrl.searchParams.get("pickupTime"), "10:30");
  assert.equal(
    sanitizedUrl.searchParams.get("click_id"),
    evalJson.opaqueAttribution.clickId,
  );

  // Forbidden PII and internal architecture params are completely stripped
  for (const forbiddenKey of [
    "name",
    "fullName",
    "email",
    "phone",
    "passengerWeightLbs",
    "bookingRef",
    "medicalNotes",
    "custom_contact",
    "rule_ids",
  ]) {
    assert.equal(
      sanitizedUrl.searchParams.has(forbiddenKey),
      false,
      `Expected ${forbiddenKey} to be stripped from outbound URL`,
    );
  }
  assert.equal(
    evalJson.opaqueAttribution.outboundPartnerUrl.includes("jane.traveler"),
    false,
  );
  assert.equal(
    evalJson.opaqueAttribution.outboundPartnerUrl.includes("303-555-0199"),
    false,
  );
  assert.ok(evalJson.opaqueAttribution.strippedPiiParams.includes("name"));
  assert.ok(evalJson.opaqueAttribution.strippedPiiParams.includes("email"));
  assert.ok(evalJson.opaqueAttribution.strippedPiiParams.includes("phone"));
  assert.ok(
    evalJson.opaqueAttribution.strippedPiiParams.includes("passengerWeightLbs"),
  );
  assert.ok(
    evalJson.opaqueAttribution.strippedPiiParams.includes("custom_contact"),
  );
  assert.ok(evalJson.opaqueAttribution.strippedLeakParams.includes("rule_ids"));
});

test("10. Production credentials requirement rejects unconfigured reconciliation requests and accepts configured production secrets", async () => {
  resetOpaqueAttributionLedgerForTests();

  const handoff = issueOpaqueClickAttribution({
    decisionReceiptId:
      "rcpt:sha256:4444444444444444444444444444444444444444444444444444444444444444",
    recommendedOperatorId: "op:gosno",
    recommendedOperatorName: "GoSno Mountain Transport",
    recommendedVehicleClassId: "veh:awd-full-size-suv",
    evidenceVersion: "dcc-evidence-stewardship/2026.11",
    originatingPage: "/transportation/colorado",
    isTest: true,
    provider: "direct",
    productCode: "DEN-WINTER-PARK-SUV",
    productDestinationUrl:
      "https://gosno.co/winter-park?direction=OUTBOUND&passengers=4",
  });

  const prevRequireProd = process.env.DCC_REQUIRE_PRODUCTION_CREDENTIALS;
  const prevAdminSecret = process.env.DCC_COMMERCE_ADMIN_SECRET;
  const prevWebhookSecret = process.env.DCC_PARTNER_WEBHOOK_SECRET;
  const prevInternalSecret = process.env.INTERNAL_API_SECRET;

  try {
    process.env.DCC_REQUIRE_PRODUCTION_CREDENTIALS = "1";
    delete process.env.DCC_COMMERCE_ADMIN_SECRET;
    delete process.env.DCC_PARTNER_WEBHOOK_SECRET;
    delete process.env.INTERNAL_API_SECRET;

    // 10a. Rejects webhook reconciliation with 503 when production credentials are absent
    const unconfiguredWebhookRes = await clickAttributionPost(
      new Request("https://destinationcommandcenter.com/api/v1/commerce/click-attribution", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-dcc-webhook-signature": "deadbeef",
        },
        body: JSON.stringify({
          action: "reconcile_webhook",
          provider: "direct",
          clickId: handoff.clickId,
          providerBookingRef: "TEST-WP-UNCONFIGURED-1",
          eventType: "BOOKING_CONFIRMED",
          grossRevenueUsd: 349,
        }),
      }),
    );
    assert.equal(unconfiguredWebhookRes.status, 503);
    const unconfiguredWebhookJson = (await unconfiguredWebhookRes.json()) as any;
    assert.equal(
      unconfiguredWebhookJson.code,
      "WEBHOOK_CREDENTIALS_NOT_CONFIGURED",
    );

    // 10b. Rejects CSV reconciliation with 503 when production admin credentials are set to dev fallback
    process.env.DCC_COMMERCE_ADMIN_SECRET = "dcc-commerce-admin-secret-v1";
    const devFallbackCsvRes = await clickAttributionPost(
      new Request("https://destinationcommandcenter.com/api/v1/commerce/click-attribution", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-dcc-commerce-admin-token": "dcc-commerce-admin-secret-v1",
        },
        body: JSON.stringify({
          action: "reconcile_csv",
          provider: "direct",
          csvText:
            "click_id,booking_ref,status,gross_amount\n" +
            `${handoff.clickId},TEST-WP-CSV-1,CONFIRMED,349.00`,
        }),
      }),
    );
    assert.equal(devFallbackCsvRes.status, 503);
    const devFallbackCsvJson = (await devFallbackCsvRes.json()) as any;
    assert.equal(
      devFallbackCsvJson.code,
      "COMMERCE_CREDENTIALS_NOT_CONFIGURED",
    );

    // 10c. Accepts webhook reconciliation when production secret is configured and signed
    process.env.DCC_PARTNER_WEBHOOK_SECRET =
      "prod-verified-gosno-webhook-secret-2026";
    process.env.DCC_COMMERCE_ADMIN_SECRET =
      "prod-verified-dcc-commerce-admin-secret-2026";

    const validWebhookBody = JSON.stringify({
      action: "reconcile_webhook",
      provider: "direct",
      clickId: handoff.clickId,
      providerBookingRef: "TEST-WP-CONFIGURED-1",
      eventType: "BOOKING_CONFIRMED",
      grossRevenueUsd: 349,
      currency: "USD",
      isTest: true,
    });
    const validSignature = signPartnerWebhookPayload(validWebhookBody);

    const configuredWebhookRes = await clickAttributionPost(
      new Request("https://destinationcommandcenter.com/api/v1/commerce/click-attribution", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-dcc-webhook-signature": validSignature,
        },
        body: validWebhookBody,
      }),
    );
    assert.equal(configuredWebhookRes.status, 200);
    const configuredWebhookJson = (await configuredWebhookRes.json()) as any;
    assert.equal(configuredWebhookJson.matched, true);
    assert.equal(configuredWebhookJson.duplicateDelivery, false);
    assert.equal(
      configuredWebhookJson.outcome.eventType,
      "BOOKING_CONFIRMED",
    );
  } finally {
    if (prevRequireProd === undefined) {
      delete process.env.DCC_REQUIRE_PRODUCTION_CREDENTIALS;
    } else {
      process.env.DCC_REQUIRE_PRODUCTION_CREDENTIALS = prevRequireProd;
    }
    if (prevAdminSecret === undefined) {
      delete process.env.DCC_COMMERCE_ADMIN_SECRET;
    } else {
      process.env.DCC_COMMERCE_ADMIN_SECRET = prevAdminSecret;
    }
    if (prevWebhookSecret === undefined) {
      delete process.env.DCC_PARTNER_WEBHOOK_SECRET;
    } else {
      process.env.DCC_PARTNER_WEBHOOK_SECRET = prevWebhookSecret;
    }
    if (prevInternalSecret === undefined) {
      delete process.env.INTERNAL_API_SECRET;
    } else {
      process.env.INTERNAL_API_SECRET = prevInternalSecret;
    }
  }
});

test("11. Outbound, Return, and Round-Trip paid-booking reconciliation avoids duplicate counting and separates test records from production sales", async () => {
  resetOpaqueAttributionLedgerForTests();
  resetCommercialMemoryStoreForTests();

  // 11a. Record 3 production visitors and 2 test visitors on /transportation/colorado
  recordFunnelVisitorSession({
    visitorId: "vis-prod-1",
    sourcePage: "/transportation/colorado",
    isTest: false,
  });
  recordFunnelVisitorSession({
    visitorId: "vis-prod-2",
    sourcePage: "/transportation/colorado",
    isTest: false,
  });
  recordFunnelVisitorSession({
    visitorId: "vis-prod-3",
    sourcePage: "/transportation/colorado",
    isTest: false,
  });
  // Duplicate visitor session for vis-prod-1 should increment visitCount and NOT double-count newVisitors
  const dupVisitor = recordFunnelVisitorSession({
    visitorId: "vis-prod-1",
    sourcePage: "/transportation/colorado",
    isTest: false,
  });
  assert.equal(dupVisitor.visitCount, 2);

  recordFunnelVisitorSession({
    visitorId: "vis-test-1",
    sourcePage: "/transportation/colorado",
    isTest: true,
  });
  recordFunnelVisitorSession({
    visitorId: "vis-test-2",
    sourcePage: "/transportation/colorado",
    isTest: true,
  });

  // 11b. Issue 3 production Winter Park handoffs (OUTBOUND, RETURN, ROUND_TRIP) and 1 test handoff
  const prodOutbound = issueOpaqueClickAttribution({
    decisionReceiptId:
      "rcpt:sha256:5555555555555555555555555555555555555555555555555555555555555551",
    recommendedOperatorId: "op:gosno",
    recommendedOperatorName: "GoSno Mountain Transport",
    recommendedVehicleClassId: "veh:awd-full-size-suv",
    evidenceVersion: "dcc-evidence-stewardship/2026.11",
    originatingPage: "/transportation/colorado",
    isTest: false,
    provider: "direct",
    productCode: "DEN-WINTER-PARK-SUV",
    productDestinationUrl:
      "https://gosno.co/winter-park?direction=OUTBOUND&passengers=4",
    tripDetails: {
      origin: "DEN",
      destination: "Winter Park",
      direction: "OUTBOUND",
      tripType: "ONE_WAY",
      routeId: "DEN-WINTER-PARK",
      offerId: "DEN-WINTER-PARK-SUV",
      travelDate: "2026-12-20",
      pickupTime: "10:30",
      passengerCount: 4,
      standardBagCount: 4,
      skiOrOversizeBagCount: 4,
      returnDate: null,
      returnPickupTime: null,
      returnRouteId: null,
      originatingPage: "/transportation/colorado",
    },
  });

  const prodReturn = issueOpaqueClickAttribution({
    decisionReceiptId:
      "rcpt:sha256:5555555555555555555555555555555555555555555555555555555555555552",
    recommendedOperatorId: "op:gosno",
    recommendedOperatorName: "GoSno Mountain Transport",
    recommendedVehicleClassId: "veh:awd-full-size-suv",
    evidenceVersion: "dcc-evidence-stewardship/2026.11",
    originatingPage: "/transportation/colorado",
    isTest: false,
    provider: "direct",
    productCode: "WINTER-PARK-DEN-SUV",
    productDestinationUrl:
      "https://gosno.co/winter-park-return-shuttle-to-denver-airport?direction=RETURN&passengers=4",
    tripDetails: {
      origin: "Winter Park",
      destination: "DEN",
      direction: "RETURN",
      tripType: "ONE_WAY",
      routeId: "WINTER-PARK-DEN",
      offerId: "WINTER-PARK-DEN-SUV",
      travelDate: "2026-12-27",
      pickupTime: "07:15",
      passengerCount: 4,
      standardBagCount: 4,
      skiOrOversizeBagCount: 4,
      returnDate: null,
      returnPickupTime: null,
      returnRouteId: null,
      originatingPage: "/transportation/colorado",
    },
  });
  assert.ok(prodReturn.clickId);

  const prodRoundTrip = issueOpaqueClickAttribution({
    decisionReceiptId:
      "rcpt:sha256:5555555555555555555555555555555555555555555555555555555555555553",
    recommendedOperatorId: "op:gosno",
    recommendedOperatorName: "GoSno Mountain Transport",
    recommendedVehicleClassId: "veh:private-transit-van-10",
    evidenceVersion: "dcc-evidence-stewardship/2026.11",
    originatingPage: "/transportation/colorado",
    isTest: false,
    provider: "direct",
    productCode: "DEN-WINTER-PARK-ROUND-TRIP-VAN",
    productDestinationUrl:
      "https://gosno.co/winter-park?direction=ROUND_TRIP&tripType=round_trip&passengers=8",
    tripDetails: {
      origin: "DEN",
      destination: "Winter Park",
      direction: "ROUND_TRIP",
      tripType: "ROUND_TRIP",
      routeId: "DEN-WINTER-PARK",
      offerId: "DEN-WINTER-PARK-ROUND-TRIP-VAN",
      travelDate: "2026-12-20",
      pickupTime: "11:45",
      returnDate: "2026-12-27",
      returnPickupTime: "08:00",
      returnRouteId: "WINTER-PARK-DEN",
      passengerCount: 8,
      standardBagCount: 8,
      skiOrOversizeBagCount: 6,
      originatingPage: "/transportation/colorado",
    },
  });

  const testOutbound = issueOpaqueClickAttribution({
    decisionReceiptId:
      "rcpt:sha256:5555555555555555555555555555555555555555555555555555555555555554",
    recommendedOperatorId: "op:gosno",
    recommendedOperatorName: "GoSno Mountain Transport",
    recommendedVehicleClassId: "veh:awd-full-size-suv",
    evidenceVersion: "dcc-evidence-stewardship/2026.11",
    originatingPage: "/transportation/colorado",
    isTest: true,
    provider: "direct",
    productCode: "DEN-WINTER-PARK-SUV",
    productDestinationUrl:
      "https://gosno.co/winter-park?direction=OUTBOUND&passengers=2",
    tripDetails: {
      origin: "DEN",
      destination: "Winter Park",
      direction: "OUTBOUND",
      tripType: "ONE_WAY",
      routeId: "DEN-WINTER-PARK",
      offerId: "DEN-WINTER-PARK-SUV",
      travelDate: "2026-12-21",
      pickupTime: "14:00",
      passengerCount: 2,
      standardBagCount: 2,
      skiOrOversizeBagCount: 2,
      returnDate: null,
      returnPickupTime: null,
      returnRouteId: null,
      originatingPage: "/transportation/colorado",
    },
  });

  // 11c. Reconcile production OUTBOUND and ROUND_TRIP as BOOKING_CONFIRMED, plus test OUTBOUND
  const recProdOut1 = reconcilePartnerWebhookByClickId({
    provider: "direct",
    clickId: prodOutbound.clickId,
    providerBookingRef: "GOSNO-WP-OUT-1001",
    eventType: "BOOKING_CONFIRMED",
    grossRevenueUsd: 349,
    currency: "USD",
    isTest: false,
  });
  assert.equal(recProdOut1.matched, true);
  if (recProdOut1.matched) {
    assert.equal(recProdOut1.outcome.duplicateDelivery, false);
  }

  // Re-delivering the exact same webhook must be flagged as duplicateDelivery: true and NOT double-count
  const recProdOutDup = reconcilePartnerWebhookByClickId({
    provider: "direct",
    clickId: prodOutbound.clickId,
    providerBookingRef: "GOSNO-WP-OUT-1001",
    eventType: "BOOKING_CONFIRMED",
    grossRevenueUsd: 349,
    currency: "USD",
    isTest: false,
  });
  assert.equal(recProdOutDup.matched, true);
  if (recProdOutDup.matched) {
    assert.equal(recProdOutDup.outcome.duplicateDelivery, true);
    assert.equal(recProdOutDup.ledgerRecord.duplicateDeliveryCount, 1);
  }

  const recProdRt1 = reconcilePartnerWebhookByClickId({
    provider: "direct",
    clickId: prodRoundTrip.clickId,
    providerBookingRef: "GOSNO-WP-RT-1002",
    eventType: "BOOKING_CONFIRMED",
    grossRevenueUsd: 998,
    currency: "USD",
    isTest: false,
  });
  assert.equal(recProdRt1.matched, true);
  if (recProdRt1.matched) {
    assert.equal(recProdRt1.outcome.duplicateDelivery, false);
  }

  const recTestOut1 = reconcilePartnerWebhookByClickId({
    provider: "direct",
    clickId: testOutbound.clickId,
    providerBookingRef: "TEST-GOSNO-WP-9001",
    eventType: "BOOKING_CONFIRMED",
    grossRevenueUsd: 349,
    currency: "USD",
    isTest: true,
  });
  assert.equal(recTestOut1.matched, true);
  if (recTestOut1.matched) {
    assert.equal(recTestOut1.outcome.duplicateDelivery, false);
    assert.equal(recTestOut1.outcome.isTest, true);
    assert.equal(recTestOut1.outcome.trafficClass, "test");
  }

  // 11d. Verify GET /api/v1/commerce/click-attribution?summary=funnel reports newVisitors, followedHandoffs, and confirmedPaidBookings separately for production vs test
  const funnelRes = await clickAttributionGet(
    new Request(
      "https://destinationcommandcenter.com/api/v1/commerce/click-attribution?summary=funnel&originatingPage=/transportation/colorado",
      {
        method: "GET",
        headers: {
          "x-dcc-commerce-admin-token": issueCommerceAdminToken("commerce:read"),
        },
      },
    ),
  );
  assert.equal(funnelRes.status, 200);
  const funnelJson = (await funnelRes.json()) as any;
  assert.ok(funnelJson.funnel);

  // Production metrics: 3 unique visitors, 3 followed handoffs (outbound, return, round-trip), 2 confirmed paid bookings ($349 + $998 = $1,347), 1 duplicate delivery ignored
  assert.equal(funnelJson.funnel.production.newVisitors, 3);
  assert.equal(funnelJson.funnel.production.followedHandoffs, 3);
  assert.equal(funnelJson.funnel.production.confirmedPaidBookings, 2);
  assert.equal(funnelJson.funnel.production.grossConfirmedRevenueUsd, 1347);
  assert.equal(funnelJson.funnel.production.duplicateDeliveriesIgnored, 1);
  assert.deepEqual(funnelJson.funnel.production.byDirection.OUTBOUND, {
    handoffs: 1,
    confirmedPaidBookings: 1,
  });
  assert.deepEqual(funnelJson.funnel.production.byDirection.RETURN, {
    handoffs: 1,
    confirmedPaidBookings: 0,
  });
  assert.deepEqual(funnelJson.funnel.production.byDirection.ROUND_TRIP, {
    handoffs: 1,
    confirmedPaidBookings: 1,
  });

  // Test metrics: kept strictly separate from production sales (2 test visitors, 1 test handoff, 1 test confirmed booking)
  assert.equal(funnelJson.funnel.test.newVisitors, 2);
  assert.equal(funnelJson.funnel.test.followedHandoffs, 1);
  assert.equal(funnelJson.funnel.test.confirmedPaidBookings, 1);
  assert.equal(funnelJson.funnel.test.grossConfirmedRevenueUsd, 349);
});



