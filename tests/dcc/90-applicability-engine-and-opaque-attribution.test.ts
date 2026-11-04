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
  getOpaqueClickAttributionById,
  issueCommerceAdminToken,
  issueOpaqueClickAttribution,
  reconcilePartnerCsvBatchByClickId,
  reconcilePartnerWebhookByClickId,
  recordCommercialOutcome,
  resetCommercialMemoryStoreForTests,
  resetOpaqueAttributionLedgerForTests,
  sanitizeOutboundPartnerUrlWithOpaqueClickId,
  signPartnerWebhookPayload,
} from "@/lib/dcc/commerce";
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
  assert.equal(vail10Van.pricingResolution.fixedRateOneWayUsd, 599);
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

  // 7d. Breckenridge handoff verification (5 passengers in SUV at $399 one-way, and 10 passengers in van)
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
  assert.equal(breckSuv.pricingResolution.fixedRateOneWayUsd, 399);

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

  // 7e. 16 passengers (DEN -> Breckenridge) -> single vehicles ineligible; offers GoSno group inquiry suggesting a van plus a Suburban ($998 reference)
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
  assert.equal(breck16Group.referenceCombinedOneWayUsd, 998);
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

  // 7f. 20 passengers (DEN -> Vail) -> single vehicles ineligible; offers GoSno group inquiry suggesting two vans ($1,198 reference)
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
  assert.equal(vail20Group.referenceCombinedOneWayUsd, 1198);
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

  // 7g. 16 to Winter Park: 16 regular bags, 12 ski bags, one van plus one Suburban suggested ($848 combined reference)
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
  assert.equal(wp16Group.referenceCombinedOneWayUsd, 848);
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

  // 7h. 20 to Steamboat: 20 regular bags, 16 ski bags throughout, two vans suggested ($1,798 combined reference)
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
  assert.equal(sb20Group.referenceCombinedOneWayUsd, 1798);
  const sb20Url = new URL(sb20Group.inquiryUrl);
  assert.equal(sb20Url.searchParams.get("destination"), "Steamboat Springs");
  assert.equal(sb20Url.searchParams.get("passengers"), "20");
  assert.equal(sb20Url.searchParams.get("standardBags"), "20");
  assert.equal(sb20Url.searchParams.get("skiBags"), "16");
  assert.equal(sb20Url.searchParams.get("luggage"), "20 standard bags, 16 ski bags");
  assert.equal(sb20Url.searchParams.get("vehicleSuggestion"), "2 Private Passenger Vans");

  // 7i. Copper Mountain DEN SUV approved rate is $349 (so 16 to Copper = $599 Van + $349 SUV = $948)
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
    948,
  );
});

