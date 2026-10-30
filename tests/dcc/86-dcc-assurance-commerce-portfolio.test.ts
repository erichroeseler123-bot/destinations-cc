import test from "node:test";
import assert from "node:assert/strict";

import {
  verifyEvaluationAuthAndRateLimit,
  resolveOrGenerateW3cTraceparent,
  sanitizeEvaluationRequestForAssurance,
  MachineSecurityLimitError,
} from "../../lib/dcc/machine/securityLimits";
import {
  handleV03EvaluateRequest,
  getV03ReceiptWithFallback,
  handleV03ReplayReceiptRequest,
} from "../../lib/dcc/machine/v03/runtimeStoreV03";
import {
  buildMcpDiscoveryDocument,
  buildReceiptVerificationDocumentation,
} from "../../lib/dcc/machine/v03/discoveryAndMcp";
import { POST as handleMcpPost } from "../../app/api/v1/mcp/route";
import {
  buildProviderAffiliateHandoffUrl,
  createCommercialHandoff,
  getCommercialHandoffById,
  recordCommercialOutcome,
  pollViatorModifiedSinceWithCheckpoint,
  reportGetYourGuideOutcomeAdapter,
  resetCommercialMemoryStoreForTests,
} from "../../lib/dcc/commerce";
import {
  evaluatePortfolioAssuranceSummary,
  buildPortfolioHandoffUrl,
} from "../../lib/dcc/commerce/portfolio";
import {
  issueContext,
  redeemContext,
  inspectTripContext,
  clearMemoryStore,
} from "../../lib/dcc/context/service";
import { getViatorAccessCapabilities } from "../../lib/viator/access";

test("Gate 1: Authentication, Credential-Derived client_id, MCP Scope Parity, and W3C traceparent", async () => {
  // 1. Valid credential resolves deterministic client_id from token registry
  const evalAuth = verifyEvaluationAuthAndRateLimit({
    headers: { authorization: "Bearer dcc_eval_canary_v02_public_token" },
    requiredScope: "dcc:evaluate",
  });
  assert.equal(evalAuth.tier, "authenticated_api_key");
  assert.equal(evalAuth.clientId, "client:dcc-canary-verifier");
  assert.equal(evalAuth.keyId, "key:dcc-canary-eval-default");

  // 2. Scope restriction: single-only key lacks batch and commerce scopes
  assert.throws(
    () =>
      verifyEvaluationAuthAndRateLimit({
        headers: { authorization: "Bearer dcc_eval_single_only_v02_token" },
        requiredScope: "dcc:evaluate:batch",
      }),
    (err: unknown) =>
      err instanceof MachineSecurityLimitError && err.code === "API_KEY_INSUFFICIENT_SCOPE"
  );

  // 3. Commerce reporter key has dcc:commerce:report_outcome and dcc:commerce:handoff, NOT dcc:evaluate
  assert.throws(
    () =>
      verifyEvaluationAuthAndRateLimit({
        headers: { authorization: "Bearer dcc_commerce_reporter_v03_token" },
        requiredScope: "dcc:evaluate",
      }),
    (err: unknown) =>
      err instanceof MachineSecurityLimitError && err.code === "API_KEY_INSUFFICIENT_SCOPE"
  );

  const reporterOutcomeAllowed = verifyEvaluationAuthAndRateLimit({
    headers: { authorization: "Bearer dcc_commerce_reporter_v03_token" },
    requiredScope: "dcc:commerce:report_outcome",
  });
  assert.equal(reporterOutcomeAllowed.tier, "authenticated_api_key");
  assert.equal(reporterOutcomeAllowed.clientId, "client:dcc-commerce-partner-reporter");

  // 4. MCP tool discovery & route enforce identical authentication and scope checks as underlying APIs
  const mcpDoc = buildMcpDiscoveryDocument();
  const evalTool = mcpDoc.tools.find((t) => t.name === "dcc_evaluate_category");
  const handoffTool = mcpDoc.tools.find((t) => t.name === "dcc_create_commercial_handoff");
  const outcomeTool = mcpDoc.tools.find((t) => t.name === "dcc_report_commercial_outcome");
  assert.equal(evalTool?.requiredScope, "dcc:evaluate");
  assert.equal(handoffTool?.requiredScope, "dcc:commerce:handoff");
  assert.equal(outcomeTool?.requiredScope, "dcc:commerce:report_outcome");

  const mcpScopeFailReq = new Request("https://www.destinationcommandcenter.com/api/v1/mcp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer dcc_eval_single_only_v02_token",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 101,
      method: "tools/call",
      params: {
        name: "dcc_report_commercial_outcome",
        arguments: {
          provider: "viator",
          providerBookingRef: "BR-MCP-DENIED",
          eventType: "BOOKING_CONFIRMED",
        },
      },
    }),
  });
  const mcpScopeFailRes = await handleMcpPost(mcpScopeFailReq);
  assert.equal(mcpScopeFailRes.status, 403);
  const mcpScopeFailBody = (await mcpScopeFailRes.json()) as {
    error?: { data?: { errorCode?: string } };
  };
  assert.equal(mcpScopeFailBody.error?.data?.errorCode, "API_KEY_INSUFFICIENT_SCOPE");

  // 5. W3C traceparent validation & generation without personal info
  const validTp = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";
  const resolvedTp = resolveOrGenerateW3cTraceparent(validTp);
  assert.equal(resolvedTp, validTp);

  const generatedTp = resolveOrGenerateW3cTraceparent("invalid-header-with-pii@example.com");
  assert.match(generatedTp, /^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
  assert.ok(!generatedTp.includes("example.com"));
});

test("Gate 2: Assurance vs Commerce Separation, evaluationRunId Cache Status, and Receipt Hash Boundary", async () => {
  // Supply untrusted client_id and commercial parameters in the request body
  const pollutedBody = {
    engineId: "juneau-helicopter-tours",
    engineVersion: "0.3.0",
    validAt: "2026-07-15T18:00:00.000Z",
    inputs: {
      portSlug: "juneau",
      partySize: 2,
      date: "2026-07-15",
      commissionRate: 0.25,
      affiliateAccount: "P99999999",
    },
    client_id: "spoofed_attacker_client_id",
    clientId: "spoofed_attacker_client_id_2",
    commissionRate: 0.35,
    commercialRoutingPriority: "highest_payout_first",
    handoff_id: "hndf_spoofed_123456",
  };

  const sanitized = sanitizeEvaluationRequestForAssurance(pollutedBody);
  assert.ok(sanitized.strippedCommercialKeys.length >= 2);
  assert.ok(sanitized.strippedUntrustedIdentityKeys.includes("client_id"));
  assert.equal((sanitized.sanitizedBody as Record<string, unknown>).client_id, undefined);
  assert.equal((sanitized.sanitizedBody as Record<string, unknown>).commissionRate, undefined);

  // First evaluation call -> computed (or deterministic), produces evaluationRunId #1
  const eval1 = await handleV03EvaluateRequest(pollutedBody, {
    callerClientId: "client:dcc-canary-verifier",
    traceparent: "00-11111111111111111111111111111111-2222222222222222-01",
  });

  // Second identical evaluation call with different callerClientId and different commercial noise -> cache hit ("reused")
  const eval2 = await handleV03EvaluateRequest(
    {
      ...pollutedBody,
      client_id: "another_spoofed_id",
      commissionRate: 0.99,
    },
    {
      callerClientId: "client:dcc-single-scope-agent",
      traceparent: "00-33333333333333333333333333333333-4444444444444444-01",
    }
  );

  // Distinct evaluationRunId per invocation, even on cache hits!
  assert.ok(eval1.evaluationRunId.startsWith("evalrun:"));
  assert.ok(eval2.evaluationRunId.startsWith("evalrun:"));
  assert.notEqual(eval1.evaluationRunId, eval2.evaluationRunId);
  assert.equal(eval2.cacheStatus, "reused");

  // Creds-derived client_id is preserved per call, never spoofed from body
  assert.equal(eval1.clientId, "client:dcc-canary-verifier");
  assert.equal(eval2.clientId, "client:dcc-single-scope-agent");

  // Deterministic decision identity (resultHash & receiptId) is identical regardless of caller or stripped commercial params!
  assert.equal(eval1.resultHash, eval2.resultHash);
  assert.equal(eval1.receiptId, eval2.receiptId);

  // Assurance isolation proof
  assert.equal(eval1.assuranceIsolation?.commercialParametersConsumed, false);
  assert.equal(eval1.assuranceIsolation?.requiresCommercialHandoff, false);
  assert.equal(eval1.assuranceIsolation?.outboundAffiliateLinksInjected, false);

  // Verify receipt retrieval and replay work WITHOUT any commercial handoff
  const storedReceipt = await getV03ReceiptWithFallback(eval1.receiptId);
  assert.ok(storedReceipt, "Receipt must be retrievable without any commercial handoff");
  assert.equal(storedReceipt.receipt.receiptId, eval1.receiptId);

  const replay = await handleV03ReplayReceiptRequest(eval1.receiptId);
  assert.equal(replay.matchesOriginalHashes, true);
  assert.equal(replay.jwsVerified, true);

  // Verify receipt hash boundary documentation
  const docs = buildReceiptVerificationDocumentation();
  assert.ok(docs.receiptHashBoundary);
  assert.ok(docs.receiptHashBoundary.excludedFromReceiptIdHash.includes("receiptId"));
  assert.ok(docs.receiptHashBoundary.excludedFromReceiptIdHash.includes("signature"));
  assert.ok(docs.receiptHashBoundary.excludedFromReceiptIdHash.includes("evaluationRunId"));
  assert.ok(docs.receiptHashBoundary.excludedFromReceiptIdHash.includes("client_id"));
  assert.ok(docs.receiptHashBoundary.excludedFromReceiptIdHash.includes("handoff_id"));
});

test("Gate 3: Cross-Site Context Service — Short-Lived Redemption vs Longer-Lived Trip Context across Portfolio", async () => {
  const prevDbUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "";
  try {
    clearMemoryStore();

    // Issue context from lastfrontiershoreexcursions.com -> juneauflightdeck.com
    const issued = await issueContext({
      sourceSite: "lastfrontiershoreexcursions.com",
      destination: "juneau",
      targetOwner: "juneauflightdeck.com",
      targetIntent: "helicopter-glacier",
      schedule: {
        date: "2026-07-15",
        arrival: "08:00",
        departure: "16:00",
        travelers: 4,
        shipOrVenue: "Norwegian Encore",
      },
    });

    assert.equal(issued.success, true);
    if (!issued.success) return;

    assert.match(issued.contextId, /^dcc_ctx_/);

    // 1. Inspect trip context (non-destructive, 7-day retention window)
    const inspectedBefore = await inspectTripContext(issued.contextId);
    assert.equal(inspectedBefore.success, true);
    if (inspectedBefore.success) {
      assert.equal(inspectedBefore.redemptionTokenState, "issued");
      assert.equal(inspectedBefore.tripContextState, "active");
      assert.equal(inspectedBefore.schedule.date, "2026-07-15");
      assert.equal(inspectedBefore.schedule.travelers, 4);
      assert.equal(inspectedBefore.schedule.shipOrVenue, "Norwegian Encore");
    }

    // 2. Redeem short-lived token once by targetOwner
    const redeemed = await redeemContext(issued.contextId, "juneauflightdeck.com");
    assert.equal(redeemed.success, true);

    // 3. Second redemption by a different site is blocked (single-use redemption token)
    const crossSiteRedeem = await redeemContext(issued.contextId, "welcometotheswamp.com");
    assert.equal(crossSiteRedeem.success, false);

    // 4. Longer-lived trip context inspection STILL works after token redemption so multi-page browsing keeps dates/party
    const inspectedAfter = await inspectTripContext(issued.contextId);
    assert.equal(inspectedAfter.success, true);
    if (inspectedAfter.success) {
      assert.equal(inspectedAfter.redemptionTokenState, "redeemed");
      assert.equal(inspectedAfter.tripContextState, "active");
      assert.equal(inspectedAfter.schedule.date, "2026-07-15");
      assert.equal(inspectedAfter.schedule.travelers, 4);
    }
  } finally {
    process.env.DATABASE_URL = prevDbUrl;
  }
});

test("Gate 4: Provider-Specific Affiliate URL Construction & Lightweight Handoffs (Shadow Mode Preserved)", async () => {
  resetCommercialMemoryStoreForTests();

  // 1. Viator affiliate URL preserves pid + mcid + campaign__handoffId
  const viatorBuilt = buildProviderAffiliateHandoffUrl({
    originatingSite: "welcometoneworleanstours.com",
    provider: "viator",
    providerAccount: "P00058396",
    productCode: "5070SWAMP",
    productDestinationUrl: "https://www.viator.com/tours/New-Orleans/Swamp-Tour/d675-5070SWAMP",
    handoffId: "hndf_testviator000000000001",
    campaign: "wtno-swamp",
  });
  const viatorUrl = new URL(viatorBuilt.outboundAffiliateUrl);
  assert.equal(viatorUrl.searchParams.get("pid"), "P00058396");
  assert.equal(viatorUrl.searchParams.get("mcid"), "42383");
  assert.equal(viatorUrl.searchParams.get("campaign"), "wtno-swamp__hndf_testviator000000000001");

  // 2. GetYourGuide affiliate URL preserves partner_id=F2MMUUH + cmp=...__handoffId
  const gygBuilt = buildProviderAffiliateHandoffUrl({
    originatingSite: "destinationcommandcenter.com",
    provider: "getyourguide",
    productCode: "gyg-nola-jazz",
    productDestinationUrl: "https://www.getyourguide.com/new-orleans-l372/jazz-cruise-t12345/",
    handoffId: "hndf_testgyg000000000000002",
    campaign: "dcc-nola-jazz",
  });
  const gygUrl = new URL(gygBuilt.outboundAffiliateUrl);
  assert.equal(gygUrl.searchParams.get("partner_id"), "F2MMUUH");
  assert.equal(gygUrl.searchParams.get("cmp"), "dcc-nola-jazz__hndf_testgyg000000000000002");

  // 3. FareHarbor affiliate URL (legitimate NOLA integration) preserves asn=aktourcenter + ref=...__handoffId
  const fhBuilt = buildProviderAffiliateHandoffUrl({
    originatingSite: "welcometoneworleanstours.com",
    provider: "fareharbor",
    providerAccount: "aktourcenter",
    productCode: "fh-nola-swamp",
    productDestinationUrl:
      "https://fareharbor.com/embeds/book/cajunencounters/items/12345/?full-items=yes",
    handoffId: "hndf_testfh0000000000000003",
    campaign: "wtno-swamp",
  });
  const fhUrl = new URL(fhBuilt.outboundAffiliateUrl);
  assert.equal(fhUrl.searchParams.get("asn"), "aktourcenter");
  assert.equal(fhUrl.searchParams.get("ref"), "wtno-swamp__hndf_testfh0000000000000003");

  // 4. Direct operator referral URL
  const directBuilt = buildProviderAffiliateHandoffUrl({
    originatingSite: "juneauflightdeck.com",
    provider: "direct",
    providerAccount: "coastalhelicopters",
    productCode: "icefield-excursion",
    productDestinationUrl: "https://www.coastalhelicopters.com/tours/icefield-excursion/",
    handoffId: "hndf_testdirect000000000004",
    campaign: "jfd-icefield",
  });
  const directUrl = new URL(directBuilt.outboundAffiliateUrl);
  assert.equal(directUrl.searchParams.get("dcc_handoff_id"), "hndf_testdirect000000000004");

  // 5. Persist lightweight handoff without DecisionAuthorization while keeping booking adapters in shadow mode
  const handoff = await createCommercialHandoff({
    originatingSite: "welcometotheswamp.com",
    provider: "viator",
    providerAccount: "P00058396",
    productCode: "5070AIRBOAT",
    productTitle: "Small-Group Airboat Swamp Tour",
    productDestinationUrl: "https://www.viator.com/tours/New-Orleans/Airboat/d675-5070AIRBOAT",
    evaluationRunId: "evalrun:test_run_001",
    receiptId: "rcpt:sha256:test_receipt_001",
    intendedDate: "2027-07-15",
    intendedOption: "morning-9am",
    partySize: 4,
    quotedPriceAmount: 396,
    quotedPriceCurrency: "USD",
    callerClientId: "public_traveler_browser",
  });

  assert.match(handoff.handoffId, /^hndf_[0-9a-f]{24}$/);
  assert.equal(handoff.requiresDecisionAuthorization, false);
  assert.equal(handoff.dccBookingAdapterMode, "shadow_only_no_side_effects");

  const loaded = await getCommercialHandoffById(handoff.handoffId);
  assert.ok(loaded);
  assert.equal(loaded.originatingSite, "welcometotheswamp.com");
  assert.equal(loaded.intendedDate, "2027-07-15");
  assert.equal(loaded.partySize, 4);
});

test("Gate 5: Outcome Reporting, Deduplication, Unmatched Preservation, Value/Commission Separation & Viator Cursor Recovery", async () => {
  resetCommercialMemoryStoreForTests();

  // 1. Verify Viator capability check allows booking reporting on Full Access without Booking
  const fullAccessCaps = getViatorAccessCapabilities("full_access");
  assert.equal(fullAccessCaps.canUseBooking, false);
  assert.equal(fullAccessCaps.canUseBookingReporting, true);

  // 2. Create a handoff to test matched outcome reconciliation
  const handoff = await createCommercialHandoff({
    originatingSite: "welcometoneworleanstours.com",
    provider: "viator",
    providerAccount: "P00058396",
    productCode: "5070FRENCHQ",
    productDestinationUrl: "https://www.viator.com/tours/New-Orleans/French-Quarter/d675-5070FRENCHQ",
    evaluationRunId: "evalrun:wtno_001",
    receiptId: "rcpt:sha256:wtno_001",
    intendedDate: "2026-08-10",
    intendedOption: "standard-walking",
    partySize: 2,
    callerClientId: "public_traveler_browser",
  });

  // 3. Record matched outcome where booked partySize (3) differs from intended partySize (2)
  const outcome1 = await recordCommercialOutcome({
    reporterClientId: "client:dcc-commerce-partner-reporter",
    reporterProvenance: "authenticated_api_reporter",
    provider: "viator",
    providerAccount: "P00058396",
    providerBookingRef: "BR-99887766",
    eventType: "BOOKING_CONFIRMED",
    providerEventTime: "2026-07-01T14:20:00.000Z",
    handoffId: handoff.handoffId,
    bookedProductCode: "5070FRENCHQ",
    bookedDate: "2026-08-10",
    bookedOption: "standard-walking",
    bookedPartySize: 3,
    bookingValueAmount: 135.0,
    bookingValueCurrency: "USD",
    estimatedCommissionAmount: 10.8,
    estimatedCommissionCurrency: "USD",
    paidCommissionAmount: null,
    paidCommissionCurrency: "USD",
  });

  assert.equal(outcome1.duplicateDelivery, false);
  assert.equal(outcome1.reconciliationStatus, "matched");
  assert.equal(outcome1.altersPublishedEvidenceOrRules, false);
  assert.equal(outcome1.approvedClaimStatus, "not_a_claim_outcome_only");
  assert.equal(outcome1.reconciliationComparison.missingOutcomeImpliesFailedBooking, false);
  assert.equal(outcome1.reconciliationComparison.dateComparison.matches, true);
  assert.equal(outcome1.reconciliationComparison.partySizeComparison.matches, false);
  assert.equal(outcome1.bookingValue.amount, 135.0);
  assert.equal(outcome1.estimatedCommission.amount, 10.8);
  assert.equal(outcome1.paidCommission.amount, null);

  // 4. Duplicate delivery of the exact same booking event is deduplicated idempotently
  const outcome1Dup = await recordCommercialOutcome({
    reporterClientId: "client:dcc-commerce-partner-reporter",
    reporterProvenance: "authenticated_api_reporter",
    provider: "viator",
    providerAccount: "P00058396",
    providerBookingRef: "BR-99887766",
    eventType: "BOOKING_CONFIRMED",
    providerEventTime: "2026-07-01T14:20:00.000Z",
    handoffId: handoff.handoffId,
    bookingValueAmount: 135.0,
    paidCommissionAmount: null,
  });
  assert.equal(outcome1Dup.duplicateDelivery, true);
  assert.equal(outcome1Dup.outcomeId, outcome1.outcomeId);

  // 5. Unmatched outcome (no handoffId or matching campaign) is preserved, never dropped
  const unmatched = await recordCommercialOutcome({
    reporterClientId: "client:dcc-commerce-partner-reporter",
    reporterProvenance: "authenticated_api_reporter",
    provider: "viator",
    providerAccount: "P00058396",
    providerBookingRef: "BR-UNMATCHED-111",
    eventType: "BOOKING_CONFIRMED",
    providerEventTime: "2026-07-01T15:00:00.000Z",
    bookedProductCode: "UNKNOWN_PROD",
  });
  assert.equal(unmatched.reconciliationStatus, "unmatched");
  assert.equal(unmatched.handoffId, null);

  // 6. GetYourGuide outcome stays behind its own adapter
  const gygOutcome = await reportGetYourGuideOutcomeAdapter({
    reporterClientId: "client:dcc-commerce-partner-reporter",
    gygBookingReference: "GYG-776655",
    eventType: "BOOKING_CONFIRMED",
    providerEventTime: "2026-07-01T16:00:00.000Z",
    bookedTourCode: "t12345",
    bookingValueAmount: 210,
    bookingValueCurrency: "USD",
    estimatedCommissionAmount: 16.8,
  });
  assert.equal(gygOutcome.provider, "getyourguide");
  assert.equal(gygOutcome.providerAccount, "F2MMUUH");

  // 7. Viator Poller Cursor Checkpoint Advancement & Recovery
  const pollRun1 = await pollViatorModifiedSinceWithCheckpoint({
    pollerId: "test_viator_poller",
    providerAccount: "P00058396",
    customFetchPage: async ({ cursor }) => {
      assert.equal(cursor, undefined);
      return {
        nextCursor: "viator_cursor_page_2",
        bookings: [
          {
            bookingRef: "BR-POLL-001",
            status: "BOOKING_CONFIRMED",
            lastUpdated: "2026-07-02T10:00:00.000Z",
            campaign: `wtno-frenchq__${handoff.handoffId}`,
            productCode: "5070FRENCHQ",
            travelDate: "2026-08-10",
            partySize: 2,
            totalPrice: 90,
            estimatedCommission: 7.2,
            currency: "USD",
          },
        ],
      };
    },
  });

  assert.equal(pollRun1.ingestedCount, 1);
  assert.equal(pollRun1.matchedCount, 1);
  assert.equal(pollRun1.nextCursor, "viator_cursor_page_2");

  // Second poll automatically resumes from durable cursor "viator_cursor_page_2" and deduplicates repeated items
  const pollRun2 = await pollViatorModifiedSinceWithCheckpoint({
    pollerId: "test_viator_poller",
    providerAccount: "P00058396",
    customFetchPage: async ({ cursor }) => {
      assert.equal(cursor, "viator_cursor_page_2");
      return {
        nextCursor: "viator_cursor_page_3",
        bookings: [
          {
            bookingRef: "BR-POLL-001",
            status: "BOOKING_CONFIRMED",
            lastUpdated: "2026-07-02T10:00:00.000Z",
            campaign: `wtno-frenchq__${handoff.handoffId}`,
            totalPrice: 90,
          },
        ],
      };
    },
  });

  assert.equal(pollRun2.previousCursor, "viator_cursor_page_2");
  assert.equal(pollRun2.nextCursor, "viator_cursor_page_3");
  assert.equal(pollRun2.ingestedCount, 0);
  assert.equal(pollRun2.deduplicatedCount, 1);
});

test("Gate 6: Portfolio Helper Coverage Across All 5 Portfolio Sites", () => {
  const sites = [
    {
      site: "destinationcommandcenter.com",
      engineId: "new-orleans-city-tours" as const,
      provider: "getyourguide" as const,
      destinationUrl: "https://www.getyourguide.com/new-orleans-l372/",
    },
    {
      site: "welcometoneworleanstours.com",
      engineId: "new-orleans-city-tours" as const,
      provider: "viator" as const,
      destinationUrl: "https://www.viator.com/New-Orleans/d675-ttd",
    },
    {
      site: "welcometotheswamp.com",
      engineId: "new-orleans-swamp-tours" as const,
      provider: "viator" as const,
      destinationUrl: "https://www.viator.com/New-Orleans-tours/Swamp-and-Bayou-Tours/d675-g9-c37",
    },
    {
      site: "lastfrontiershoreexcursions.com",
      engineId: "alaska-shore-excursions" as const,
      provider: "viator" as const,
      destinationUrl: "https://www.viator.com/Alaska/d276-ttd",
    },
    {
      site: "juneauflightdeck.com",
      engineId: "juneau-helicopter-tours" as const,
      provider: "viator" as const,
      destinationUrl:
        "https://www.viator.com/tours/Juneau/Juneau-Shore-Excursion-Helicopter-Tour-and-Guided-Icefield-Walk/d941-6251SHOREXICEWALK",
    },
  ];

  for (const entry of sites) {
    const summary = evaluatePortfolioAssuranceSummary({
      engineId: entry.engineId,
      inputs: { partySize: 2, date: "2026-07-15" },
      callerClientId: `portfolio:${entry.site}`,
    });
    assert.ok(summary.evaluationRunId.startsWith("evalrun:"));
    assert.ok(summary.receiptId.startsWith("rcpt:sha256:"));
    assert.ok(summary.unresolvedRequirements.length > 0);
    assert.match(summary.availabilityClaimPolicy, /Evidence-bounded/i);

    const handoffHref = buildPortfolioHandoffUrl({
      originatingSite: entry.site,
      provider: entry.provider,
      destinationUrl: entry.destinationUrl,
      evaluationRunId: summary.evaluationRunId,
      receiptId: summary.receiptId,
      intendedDate: "2026-07-15",
      partySize: 2,
    });
    assert.ok(handoffHref.includes("/go/commerce/handoff?"));
    assert.ok(handoffHref.includes(`site=${encodeURIComponent(entry.site)}`));
    assert.ok(handoffHref.includes(`receiptId=${encodeURIComponent(summary.receiptId)}`));
  }
});
