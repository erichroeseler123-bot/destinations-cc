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

  // Primary recommended vehicle class is upgraded to 10-14 passenger high-roof transit van
  assert.equal(
    outcome1.recommendedVehicleClassId,
    "veh:private-transit-van-10-14",
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
    recommendedVehicleClassId: "veh:private-transit-van-10-14",
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
