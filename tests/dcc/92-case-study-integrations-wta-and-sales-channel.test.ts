import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { GET as getCpToLfse } from "@/app/go/cruise-promenade-to-last-frontier/route";
import { GET as getDccToJfd } from "@/app/go/dcc-to-juneau-flight-deck/route";
import { GET as getJfdHandoff } from "@/apps/juneauflightdeck/app/handoff/dcc/route";
import {
  GET as getCommerceHandoff,
  POST as postCommerceHandoff,
} from "@/app/api/v1/commerce/handoffs/route";
import {
  GET as getCommerceOutcomes,
  POST as postCommerceOutcome,
} from "@/app/api/v1/commerce/outcomes/route";
import {
  GET as getWtaAffiliateStatus,
  POST as postWtaAffiliateSimulation,
} from "@/app/api/v1/commerce/affiliates/wta/route";
import {
  POST as postOctoBookings,
  GET as getOctoBookings,
} from "@/app/octo/bookings/route";
import { POST as postOctoBookingConfirm } from "@/app/octo/bookings/[bookingUuid]/confirm/route";
import {
  evaluateWtaAffiliateActivationGate,
  parseWtaAgreedCommercialTerms,
  parseWtaCommercialTerms,
  resetCommercialMemoryStoreForTests,
  runWtaAffiliatePreviewSimulation,
  WTA_DRAFT_COMMERCIAL_TERMS,
  WTA_LIVE_CLIENT_ID,
  WTA_PREVIEW_CLIENT_ID,
  WTA_REVOKED_PREVIEW_API_TOKEN_V1,
  WtaSimulatorPreviewOnlyError,
} from "@/lib/dcc/commerce";
import { DCC_PORTFOLIO_NETWORK_SITES } from "@/lib/dcc/portfolioNetworkRegistry";
import { resetMachineSecurityLimitsForTests } from "@/lib/dcc/machine";
import { DccBookingService } from "@/lib/bookings/bookingService";
import { DccSettlementEngine } from "@/lib/settlement";
import { MockOctoSupplierEngine } from "@/lib/octo/mockServer";

const TEST_ROTATED_WTA_PREVIEW_API_KEY =
  "dcc_wta_preview_rotated_test_only_9f8e7d6c5b4a3210";

describe("92 — Case-Study Integrations, WTA Paid Affiliate Setup, and Multi-Publisher Sales Channel Proof", () => {
  beforeEach(() => {
    process.env.DCC_DISABLE_NEON_COMMERCE = "1";
    process.env.DCC_WTA_AFFILIATE_PREVIEW_API_KEY =
      TEST_ROTATED_WTA_PREVIEW_API_KEY;
    resetCommercialMemoryStoreForTests();
    resetMachineSecurityLimitsForTests();
    DccBookingService.resetFallbackStoresForTests();
    DccSettlementEngine.resetFallbackStoreForTests();
    MockOctoSupplierEngine.reset();
    delete process.env.DCC_WTA_AFFILIATE_LIVE_API_KEY;
    delete process.env.DCC_WTA_WEBHOOK_HMAC_SECRET;
    delete process.env.DCC_WTA_AFFILIATE_TERMS_JSON;
  });

  describe("Workstream 1: Cruise Promenade -> Last Frontier -> Juneau Flight Deck handoffs", () => {
    it("preserves port, date, party_size, cruise_ship, time_window, shipArrivalTime, allAboardTime, and attribution IDs on CP -> LFSE -> JFD", async () => {
      const cpReq = new Request(
        "https://destinationcommandcenter.com/go/cruise-promenade-to-last-frontier?port=juneau-ak&date=2026-07-15&party_size=4&cruise_ship=Norwegian+Bliss&time_window=07:00-15:00&shipArrivalTime=07:00&allAboardTime=15:30&activity=helicopter-glacier&budget_band=premium",
      );
      const cpRes = await getCpToLfse(cpReq);
      assert.equal(cpRes.status, 302);
      const lfseLocation = new URL(cpRes.headers.get("location")!);
      assert.equal(lfseLocation.origin, "https://www.lastfrontiershoreexcursions.com");
      assert.equal(lfseLocation.pathname, "/ports/juneau");
      assert.equal(lfseLocation.searchParams.get("port"), "juneau-ak");
      assert.equal(lfseLocation.searchParams.get("date"), "2026-07-15");
      assert.equal(lfseLocation.searchParams.get("party_size"), "4");
      assert.equal(lfseLocation.searchParams.get("cruise_ship"), "Norwegian Bliss");
      assert.equal(lfseLocation.searchParams.get("shipArrivalTime"), "07:00");
      assert.equal(lfseLocation.searchParams.get("allAboardTime"), "15:30");
      assert.match(lfseLocation.searchParams.get("dcc_handoff_id")!, /^(ho_|hndf_)/);
      assert.match(lfseLocation.searchParams.get("click_id")!, /^clk_/);

      const handoffId = lfseLocation.searchParams.get("dcc_handoff_id")!;
      const clickId = lfseLocation.searchParams.get("click_id")!;

      const jfdGoReq = new Request(
        `https://destinationcommandcenter.com/go/dcc-to-juneau-flight-deck?port=juneau-ak&date=2026-07-15&party_size=4&cruise_ship=Norwegian+Bliss&time_window=07:00-15:00&activity=helicopter-glacier&budget_band=premium&dcc_handoff_id=${handoffId}&click_id=${clickId}`,
      );
      const jfdGoRes = await getDccToJfd(jfdGoReq);
      assert.equal(jfdGoRes.status, 302);
      const jfdDirectUrl = new URL(jfdGoRes.headers.get("location")!);
      assert.equal(jfdDirectUrl.origin, "https://juneauflightdeck.com");
      assert.equal(jfdDirectUrl.pathname, "/helicopter");
      assert.equal(jfdDirectUrl.searchParams.get("date"), "2026-07-15");
      assert.equal(jfdDirectUrl.searchParams.get("party_size"), "4");
      assert.equal(jfdDirectUrl.searchParams.get("ship"), "Norwegian Bliss");
      assert.equal(jfdDirectUrl.searchParams.get("dcc_handoff_id"), handoffId);
      assert.equal(jfdDirectUrl.searchParams.get("click_id"), clickId);

      const jfdHandoffEndpointUrl = new URL("https://juneauflightdeck.com/handoff/dcc");
      jfdDirectUrl.searchParams.forEach((v, k) => jfdHandoffEndpointUrl.searchParams.set(k, v));
      const jfdFinalRes = await getJfdHandoff(new Request(jfdHandoffEndpointUrl.toString()));
      assert.equal(jfdFinalRes.status, 302);
      const jfdHelicopterUrl = new URL(jfdFinalRes.headers.get("location")!);
      assert.equal(jfdHelicopterUrl.pathname, "/helicopter");
      assert.equal(jfdHelicopterUrl.searchParams.get("date"), "2026-07-15");
      assert.equal(jfdHelicopterUrl.searchParams.get("party_size"), "4");
      assert.equal(jfdHelicopterUrl.searchParams.get("ship"), "Norwegian Bliss");
      assert.equal(jfdHelicopterUrl.searchParams.get("dcc_handoff_id"), handoffId);
      assert.equal(jfdHelicopterUrl.searchParams.get("click_id"), clickId);
      assert.equal(
        jfdFinalRes.headers.get("set-cookie")?.includes("jfd_dcc_context="),
        true,
      );
    });
  });

  describe("Workstream 3: Welcome to Alaska Tours (WTA) Paid Affiliate Live Flow, Draft Terms, and Simulator Guard", () => {
    it("matches the draft commercial terms parser exactly (12%, 30-day attributionWindowDays, net_30_after_travel) and keeps terms in draft until both parties approve", async () => {
      const inOwnedPortfolio = DCC_PORTFOLIO_NETWORK_SITES.some(
        (s) =>
          String(s.site_id) === "welcome-to-alaska" ||
          s.canonical_domains.includes("welcometoalaskatours.com"),
      );
      assert.equal(inOwnedPortfolio, false);

      const statusRes = await getWtaAffiliateStatus(
        new Request("https://destinationcommandcenter.com/api/v1/commerce/affiliates/wta"),
      );
      assert.equal(statusRes.status, 200);
      const statusJson = await statusRes.json();
      assert.equal(statusJson.ok, true);
      assert.equal(statusJson.enrollment.partnerId, "welcome-to-alaska");
      assert.equal(statusJson.enrollment.relationshipClass, "paid_external_affiliate");
      assert.equal(statusJson.enrollment.inDccPortfolioNetworkSites, false);
      assert.equal(statusJson.enrollment.authScope, "referral_attribution_only");
      assert.equal(statusJson.enrollment.grantsLoginAccess, false);
      assert.equal(statusJson.enrollment.grantsReportingAccess, false);
      assert.equal(statusJson.enrollment.grantsPayoutAccess, false);
      assert.equal(statusJson.enrollment.termsAgreed, false);
      assert.equal(statusJson.enrollment.parsedTerms, null);

      const draft = statusJson.enrollment.draftTerms;
      assert.equal(draft.agreementId, "DCC-AFF-WTA-2026-001");
      assert.equal(draft.partnerId, "welcome-to-alaska");
      assert.equal(draft.partnerLegalName, "Welcome to Alaska Tours LLC");
      assert.equal(draft.status, "draft");
      assert.equal(draft.commissionRateBps, 1200);
      assert.equal(draft.attributionWindowDays, 30);
      assert.equal(draft.payoutSchedule, "net_30_after_travel");
      assert.equal(draft.signedAt, null);
      assert.equal(draft.effectiveAt, null);
      assert.equal(draft.approvedByDcc, false);
      assert.equal(draft.approvedByPartner, false);
      assert.equal(typeof draft.commissionAppliesTo, "string");
      assert.equal(draft.commissionAppliesTo.includes("12% (1200 bps)"), true);
      assert.equal(typeof draft.commissionPaidBy, "string");
      assert.equal(draft.commissionPaidBy.includes("Destination Command Center (DCC) pays Welcome to Alaska Tours LLC"), true);

      // Parser rejects non-lowercase attributionWindowDays
      assert.equal(
        parseWtaCommercialTerms({
          ...WTA_DRAFT_COMMERCIAL_TERMS,
          attributionWindowDays: undefined,
          AttributionWindowDays: 30,
        } as unknown as Record<string, unknown>),
        null,
      );

      // Parser keeps terms in draft when only one party has approved
      const oneSided = parseWtaCommercialTerms({
        ...WTA_DRAFT_COMMERCIAL_TERMS,
        signedAt: "2026-11-04T00:00:00Z",
        effectiveAt: "2026-11-04T00:00:00Z",
        approvedByDcc: true,
        approvedByPartner: false,
      });
      assert.equal(oneSided?.status, "draft");
      assert.equal(
        parseWtaAgreedCommercialTerms({
          ...WTA_DRAFT_COMMERCIAL_TERMS,
          signedAt: "2026-11-04T00:00:00Z",
          effectiveAt: "2026-11-04T00:00:00Z",
          approvedByDcc: true,
          approvedByPartner: false,
        }),
        null,
      );
    });

    it("rejects the revoked preview token and keeps the simulator strictly preview-only even when production credentials and terms are active", async () => {
      // 1. Old exposed token is permanently revoked (401 API_KEY_INVALID_OR_REVOKED)
      const revokedRes = await postWtaAffiliateSimulation(
        new Request("https://destinationcommandcenter.com/api/v1/commerce/affiliates/wta", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-dcc-api-key": WTA_REVOKED_PREVIEW_API_TOKEN_V1,
          },
          body: JSON.stringify({ action: "create_referral" }),
        }),
      );
      assert.equal(revokedRes.status, 401);
      const revokedJson = await revokedRes.json();
      assert.equal(revokedJson.error.code, "API_KEY_INVALID_OR_REVOKED");

      // 2. Simulator is blocked in production even if production credentials and agreed terms are active
      await assert.rejects(
        () =>
          runWtaAffiliatePreviewSimulation({
            gateOverrideOptions: {
              runtimeEnv: "production",
              vercelEnv: "production",
              liveApiKey: "dcc_wta_live_9876543210abcdef9876543210",
              webhookHmacSecret:
                "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
              termsJson: JSON.stringify({
                ...WTA_DRAFT_COMMERCIAL_TERMS,
                status: "active",
                signedAt: "2026-11-04T00:00:00Z",
                effectiveAt: "2026-11-04T00:00:00Z",
                approvedByDcc: true,
                approvedByPartner: true,
              }),
            },
          }),
        (err: unknown) =>
          err instanceof WtaSimulatorPreviewOnlyError &&
          err.code === "WTA_SIMULATOR_PREVIEW_ONLY" &&
          err.statusCode === 403,
      );
    });

    it("completes the live WTA path (referral -> genuine FareHarbor booking -> settlement) and proves WTA's referral key cannot write either outcome", async () => {
      // Step 1: Create a tagged referral from the WTA site using WTA's rotated credential
      const createRefRes = await postWtaAffiliateSimulation(
        new Request("https://destinationcommandcenter.com/api/v1/commerce/affiliates/wta", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-dcc-api-key": TEST_ROTATED_WTA_PREVIEW_API_KEY,
          },
          body: JSON.stringify({
            action: "create_referral",
            originatingSite: "welcometoalaskatours.com",
            sourcePagePath: "/ports/juneau/helicopter-tours",
            fareharborShortname: "coastalhelicopters",
            fareharborItemId: "413056",
            productCode: "coastal-helicopters-icefield-excursion",
            productTitle: "Icefield Excursion (Coastal Helicopters • Item 413056)",
            intendedDate: "2026-07-15",
            partySize: 2,
            quotedPriceAmount: 918,
          }),
        }),
      );
      assert.equal(createRefRes.status, 201);
      const createRefJson = await createRefRes.json();
      assert.equal(createRefJson.ok, true);
      assert.equal(createRefJson.action, "create_referral");
      const handoff = createRefJson.handoff;
      assert.equal(handoff.callerClientId, WTA_PREVIEW_CLIENT_ID);
      assert.equal(handoff.originatingSite, "welcometoalaskatours.com");
      assert.equal(handoff.fareharborShortname, "coastalhelicopters");
      assert.equal(handoff.fareharborItemId, "413056");
      assert.equal(handoff.approvedPartnerAttribution.partnerId, "welcome-to-alaska");
      assert.equal(handoff.approvedPartnerAttribution.authScope, "referral_attribution_only");

      const genuineFareHarborBooking = {
        pk: 98413056,
        uuid: "8f413056-2259-4156-9b18-000000413056",
        display_id: "#FH-COASTAL-413056-LIVE",
        status: "booked",
        is_paid: true,
        created_at: "2026-07-01T18:15:00Z",
        updated_at: "2026-07-01T18:15:05Z",
        receipt_subtotal: 91800,
        receipt_taxes: 0,
        receipt_total: 91800,
        amount_paid: 91800,
        currency: "USD",
        voucher_number: handoff.handoffId,
        reference: handoff.clickId,
        company: {
          shortname: "coastalhelicopters",
          name: "Coastal Helicopters",
        },
        item: {
          pk: 413056,
          name: "Icefield Excursion",
        },
        availability: {
          pk: 77413056,
          start_at: "2026-07-15T10:30:00-08:00",
          end_at: "2026-07-15T12:45:00-08:00",
          item: {
            pk: 413056,
            name: "Icefield Excursion",
          },
        },
        customer_count: 2,
        customers: [
          {
            pk: 600001,
            customer_type_rate: {
              pk: 882259156,
              total: 45900,
              customer_prototype: {
                pk: 2259156,
                display_name: "Standard Passenger",
                total: 45900,
              },
            },
          },
          {
            pk: 600002,
            customer_type_rate: {
              pk: 882259156,
              total: 45900,
              customer_prototype: {
                pk: 2259156,
                display_name: "Standard Passenger",
                total: 45900,
              },
            },
          },
        ],
      };

      const settlementRecord = {
        settlementId: `stl_wta_${handoff.handoffId.slice(-10)}`,
        agreementId: "DCC-AFF-WTA-2026-001",
        partnerId: "welcome-to-alaska" as const,
        payerParty: WTA_DRAFT_COMMERCIAL_TERMS.commissionPaidBy,
        payeeLegalName: "Welcome to Alaska Tours LLC",
        handoffId: handoff.handoffId,
        providerBookingRef: "#FH-COASTAL-413056-LIVE",
        travelCompletedAt: "2026-07-15T12:45:00-08:00",
        settledAt: "2026-08-14T16:00:00Z",
        payoutSchedule: "net_30_after_travel" as const,
        netTourSubtotalAmount: 918,
        commissionRateBps: 1200,
        paidCommissionAmount: 110.16,
        paidCommissionCurrency: "USD",
        payoutMethod: "ach_transfer" as const,
        payoutReference: "ACH-WTA-20260814-001",
      };

      // Step 2: Prove WTA's referral key CANNOT write either outcome (403 WTA_REFERRAL_KEY_CANNOT_WRITE_OUTCOMES)
      const wtaBookingWriteAttempt1 = await postWtaAffiliateSimulation(
        new Request("https://destinationcommandcenter.com/api/v1/commerce/affiliates/wta", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-dcc-api-key": TEST_ROTATED_WTA_PREVIEW_API_KEY,
          },
          body: JSON.stringify({
            action: "confirm_fareharbor_booking",
            handoffId: handoff.handoffId,
            booking: genuineFareHarborBooking,
          }),
        }),
      );
      assert.equal(wtaBookingWriteAttempt1.status, 403);
      assert.equal(
        (await wtaBookingWriteAttempt1.json()).error.code,
        "WTA_REFERRAL_KEY_CANNOT_WRITE_OUTCOMES",
      );

      const wtaSettlementWriteAttempt1 = await postWtaAffiliateSimulation(
        new Request("https://destinationcommandcenter.com/api/v1/commerce/affiliates/wta", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-dcc-api-key": TEST_ROTATED_WTA_PREVIEW_API_KEY,
          },
          body: JSON.stringify({
            action: "record_settlement",
            settlement: settlementRecord,
          }),
        }),
      );
      assert.equal(wtaSettlementWriteAttempt1.status, 403);
      assert.equal(
        (await wtaSettlementWriteAttempt1.json()).error.code,
        "WTA_REFERRAL_KEY_CANNOT_WRITE_OUTCOMES",
      );

      const wtaOutcomesEndpointAttempt = await postCommerceOutcome(
        new Request("https://destinationcommandcenter.com/api/v1/commerce/outcomes", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-dcc-api-key": TEST_ROTATED_WTA_PREVIEW_API_KEY,
          },
          body: JSON.stringify({
            adapter: "fareharbor_booking_webhook",
            booking: genuineFareHarborBooking,
          }),
        }),
      );
      assert.equal(wtaOutcomesEndpointAttempt.status, 403);
      const wtaOutcomesErr = await wtaOutcomesEndpointAttempt.json();
      assert.equal(wtaOutcomesErr.error.code, "WTA_REFERRAL_KEY_CANNOT_WRITE_OUTCOMES");
      assert.equal(wtaOutcomesErr.error.scopeErrorCode, "API_KEY_INSUFFICIENT_SCOPE");

      // Step 3: Confirm the sale using the genuine FareHarbor booking record and DCC's outcome reporter credential
      const confirmBookingRes = await postWtaAffiliateSimulation(
        new Request("https://destinationcommandcenter.com/api/v1/commerce/affiliates/wta", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-dcc-api-key": "dcc_commerce_reporter_v03_token",
          },
          body: JSON.stringify({
            action: "confirm_fareharbor_booking",
            handoffId: handoff.handoffId,
            booking: genuineFareHarborBooking,
          }),
        }),
      );
      assert.equal(confirmBookingRes.status, 201);
      const confirmBookingJson = await confirmBookingRes.json();
      assert.equal(confirmBookingJson.ok, true);
      assert.equal(confirmBookingJson.bookingOutcome.eventType, "BOOKING_CONFIRMED");
      assert.equal(confirmBookingJson.bookingOutcome.providerBookingRef, "#FH-COASTAL-413056-LIVE");
      assert.equal(confirmBookingJson.bookingOutcome.bookingValue.amount, 918);
      assert.equal(confirmBookingJson.bookingOutcome.estimatedCommission.amount, 110.16);
      assert.equal(confirmBookingJson.bookingOutcome.paidCommission.amount, null);

      // Step 4: Record the commission settlement using the settlement record and DCC's outcome reporter credential
      const settleRes = await postWtaAffiliateSimulation(
        new Request("https://destinationcommandcenter.com/api/v1/commerce/affiliates/wta", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-dcc-api-key": "dcc_commerce_reporter_v03_token",
          },
          body: JSON.stringify({
            action: "record_settlement",
            settlement: settlementRecord,
          }),
        }),
      );
      assert.equal(settleRes.status, 201);
      const settleJson = await settleRes.json();
      assert.equal(settleJson.ok, true);
      assert.equal(settleJson.commissionOutcome.eventType, "COMMISSION_RECONCILED");
      assert.equal(settleJson.commissionOutcome.paidCommission.amount, 110.16);

      // Verify all 3 separate records via lifecycle proof
      const proof = settleJson.lifecycleProof;
      assert.equal(proof.verified, true);
      assert.equal(proof.referralRecord.handoffId, handoff.handoffId);
      assert.equal(proof.bookingRecord.bookingValueAmount, 918);
      assert.equal(proof.bookingRecord.estimatedCommissionAmount, 110.16);
      assert.equal(proof.bookingRecord.paidCommissionAmount, null);
      assert.equal(proof.commissionRecord.paidCommissionAmount, 110.16);
      assert.equal(proof.separationAssertions.distinctPrimaryIds.length, 3);
    });

    it("gates WTA production activation until approved credentials and agreed terms are supplied, then allows WTA's production credential to create a tagged referral", async () => {
      const blockedGate = evaluateWtaAffiliateActivationGate({
        runtimeEnv: "production",
        vercelEnv: "production",
      });
      assert.equal(blockedGate.isProductionRuntime, true);
      assert.equal(blockedGate.productionActivationAllowed, false);
      assert.equal(blockedGate.previewSimulatorAllowed, false);
      assert.deepEqual(
        blockedGate.missingProductionRequirements.map((r) => r.key),
        [
          "DCC_WTA_AFFILIATE_LIVE_API_KEY",
          "DCC_WTA_WEBHOOK_HMAC_SECRET",
          "DCC_WTA_AFFILIATE_TERMS_JSON",
        ],
      );

      const liveTestKey = "dcc_wta_live_test_only_9876543210abcdef9876543210";
      process.env.DCC_WTA_AFFILIATE_LIVE_API_KEY = liveTestKey;
      process.env.DCC_WTA_WEBHOOK_HMAC_SECRET =
        "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
      process.env.DCC_WTA_AFFILIATE_TERMS_JSON = JSON.stringify({
        ...WTA_DRAFT_COMMERCIAL_TERMS,
        status: "active",
        signedAt: "2026-11-04T00:00:00Z",
        effectiveAt: "2026-11-04T00:00:00Z",
        approvedByDcc: true,
        approvedByPartner: true,
      });

      const unlockedGate = evaluateWtaAffiliateActivationGate({
        runtimeEnv: "production",
        vercelEnv: "production",
      });
      assert.equal(unlockedGate.productionActivationAllowed, true);
      assert.equal(unlockedGate.missingProductionRequirements.length, 0);

      // Verify WTA's production credential registers and creates a live referral
      const prodRefRes = await postWtaAffiliateSimulation(
        new Request("https://destinationcommandcenter.com/api/v1/commerce/affiliates/wta", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-dcc-api-key": liveTestKey,
          },
          body: JSON.stringify({
            action: "create_referral",
            originatingSite: "welcometoalaskatours.com",
            fareharborShortname: "coastalhelicopters",
            fareharborItemId: "413056",
            intendedDate: "2026-07-15",
            partySize: 2,
          }),
        }),
      );
      assert.equal(prodRefRes.status, 201);
      const prodRefJson = await prodRefRes.json();
      assert.equal(prodRefJson.handoff.callerClientId, WTA_LIVE_CLIENT_ID);
      assert.equal(
        prodRefJson.handoff.metadata.enrollmentChannel,
        "wta_paid_affiliate_live",
      );
    });
  });

  describe("Workstream 4: Multi-Publisher Sales Channel Proof with One Tour & Same Supplier Connection", () => {
    it("proves in OCTO sandbox that one DCC site and one independent publisher share the same supplier connection with distinct publisher attribution and zero new supplier code", async () => {
      const runKey = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
      const holdReqPub1 = new Request("https://destinationcommandcenter.com/octo/bookings", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer octo_publisher_dcc_site_lfse_2026",
          "idempotency-key": `idem-pub1-lfse-${runKey}`,
        },
        body: JSON.stringify({
          productId: "prod_alaska_whale_glacier",
          optionId: "opt_morning_cruise",
          availabilityId: "avail_prod_alaska_whale_glacier_opt_morning_cruise_2026-07-15_0900",
          unitItems: [{ unitId: "unit_adult", quantity: 2 }],
          notes: "DCC Site Publisher 1 (LFSE)",
        }),
      });
      const holdResPub1 = await postOctoBookings(holdReqPub1);
      assert.equal(holdResPub1.status, 201);
      const holdPub1 = await holdResPub1.json();

      const holdReqPub2 = new Request("https://destinationcommandcenter.com/octo/bookings", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer octo_publisher_independent_wta_2026",
          "idempotency-key": `idem-pub2-wta-${runKey}`,
        },
        body: JSON.stringify({
          productId: "prod_alaska_whale_glacier",
          optionId: "opt_morning_cruise",
          availabilityId: "avail_prod_alaska_whale_glacier_opt_morning_cruise_2026-07-15_0900",
          unitItems: [{ unitId: "unit_adult", quantity: 2 }],
          notes: "Independent Publisher 2 (WTA)",
        }),
      });
      const holdResPub2 = await postOctoBookings(holdReqPub2);
      assert.equal(holdResPub2.status, 201);
      const holdPub2 = await holdResPub2.json();

      // Cross-publisher isolation check: Publisher 1 cannot confirm Publisher 2's booking
      const crossConfirmRes = await postOctoBookingConfirm(
        new Request(
          `https://destinationcommandcenter.com/octo/bookings/${holdPub2.uuid}/confirm`,
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: "Bearer octo_publisher_dcc_site_lfse_2026",
            },
            body: JSON.stringify({
              contact: {
                fullName: "Cross Publisher Attempt",
                emailAddress: "cross@example.com",
              },
            }),
          },
        ),
        { params: Promise.resolve({ bookingUuid: holdPub2.uuid }) },
      );
      assert.equal(crossConfirmRes.status, 403);

      // Confirm Publisher 1's booking
      const confirmResPub1 = await postOctoBookingConfirm(
        new Request(
          `https://destinationcommandcenter.com/octo/bookings/${holdPub1.uuid}/confirm`,
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: "Bearer octo_publisher_dcc_site_lfse_2026",
            },
            body: JSON.stringify({
              resellerReference: "ref_lfse_pub1_001",
              contact: {
                fullName: "Traveler One",
                emailAddress: "traveler1@example.com",
              },
            }),
          },
        ),
        { params: Promise.resolve({ bookingUuid: holdPub1.uuid }) },
      );
      assert.equal(confirmResPub1.status, 200);
      const confirmedPub1 = await confirmResPub1.json();
      assert.equal(confirmedPub1.status, "CONFIRMED");
      assert.equal(confirmedPub1.resellerReference, "ref_lfse_pub1_001");

      // Confirm Publisher 2's booking on the exact same supplier connection & tour
      const confirmResPub2 = await postOctoBookingConfirm(
        new Request(
          `https://destinationcommandcenter.com/octo/bookings/${holdPub2.uuid}/confirm`,
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: "Bearer octo_publisher_independent_wta_2026",
            },
            body: JSON.stringify({
              resellerReference: "ref_wta_pub2_002",
              contact: {
                fullName: "Traveler Two",
                emailAddress: "traveler2@example.com",
              },
            }),
          },
        ),
        { params: Promise.resolve({ bookingUuid: holdPub2.uuid }) },
      );
      assert.equal(confirmResPub2.status, 200);
      const confirmedPub2 = await confirmResPub2.json();
      assert.equal(confirmedPub2.status, "CONFIRMED");
      assert.equal(confirmedPub2.resellerReference, "ref_wta_pub2_002");

      // Verify settlement ledger credits each booking to the exact publisher that originated it
      const ledgerPub1 = await DccSettlementEngine.getSettlementEntry(confirmedPub1.id);
      const ledgerPub2 = await DccSettlementEngine.getSettlementEntry(confirmedPub2.id);

      assert.notEqual(ledgerPub1, null);
      assert.equal(ledgerPub1?.operatorSlug, "alaska-premier-expeditions");
      assert.equal(ledgerPub1?.publisherId, "publisher:dcc:last-frontier-shore-excursions");
      assert.equal(ledgerPub1?.resellerReference, "ref_lfse_pub1_001");

      assert.notEqual(ledgerPub2, null);
      assert.equal(ledgerPub2?.operatorSlug, "alaska-premier-expeditions");
      assert.equal(ledgerPub2?.publisherId, "publisher:independent:welcome-to-alaska");
      assert.equal(ledgerPub2?.resellerReference, "ref_wta_pub2_002");

      // Verify GET /octo/bookings scopes each publisher's list to its own bookings
      const listResPub2 = await getOctoBookings(
        new Request("https://destinationcommandcenter.com/octo/bookings", {
          headers: {
            authorization: "Bearer octo_publisher_independent_wta_2026",
          },
        }),
      );
      const listPub2 = await listResPub2.json();
      assert.equal(listPub2.length >= 1, true);
      assert.equal(
        listPub2.some((b: any) => b.uuid === holdPub2.uuid),
        true,
      );
      assert.equal(
        listPub2.some((b: any) => b.uuid === holdPub1.uuid),
        false,
      );
    });

    it("proves on the live native provider channel (FareHarbor Coastal Helicopters item 104215) that a supplier-confirmed booking credits the correct independent publisher without crediting the DCC site", async () => {
      // Publisher 1 (DCC Site): lastfrontiershoreexcursions.com
      const pub1HandoffRes = await postCommerceHandoff(
        new Request("https://destinationcommandcenter.com/api/v1/commerce/handoffs", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-dcc-api-key": "dcc_eval_canary_v02_public_token",
          },
          body: JSON.stringify({
            originatingSite: "lastfrontiershoreexcursions.com",
            targetSite: "juneauflightdeck.com",
            provider: "fareharbor",
            fareharborShortname: "coastalhelicopters",
            fareharborItemId: "104215",
            productCode: "coastal-helicopters-icefield-excursion",
            productTitle: "Icefield Excursion Helicopter Tour",
            productDestinationUrl:
              "https://fareharbor.com/embeds/book/coastalhelicopters/items/104215/?full-items=yes",
            intendedDate: "2026-07-15",
            partySize: 2,
            quotedPriceAmount: 858,
            quotedPriceCurrency: "USD",
          }),
        }),
      );
      assert.equal(pub1HandoffRes.status, 201);
      const pub1Handoff = (await pub1HandoffRes.json()).handoff;

      // Publisher 2 (Independent Publisher): welcometoalaskatours.com (partner:welcome-to-alaska:preview)
      const pub2HandoffRes = await postCommerceHandoff(
        new Request("https://destinationcommandcenter.com/api/v1/commerce/handoffs", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-dcc-api-key": TEST_ROTATED_WTA_PREVIEW_API_KEY,
          },
          body: JSON.stringify({
            originatingSite: "welcometoalaskatours.com",
            targetSite: "juneauflightdeck.com",
            provider: "fareharbor",
            fareharborShortname: "coastalhelicopters",
            fareharborItemId: "104215",
            productCode: "coastal-helicopters-icefield-excursion",
            productTitle: "Icefield Excursion Helicopter Tour",
            productDestinationUrl:
              "https://fareharbor.com/embeds/book/coastalhelicopters/items/104215/?full-items=yes",
            intendedDate: "2026-07-15",
            partySize: 2,
            quotedPriceAmount: 858,
            quotedPriceCurrency: "USD",
          }),
        }),
      );
      assert.equal(pub2HandoffRes.status, 201);
      const pub2Handoff = (await pub2HandoffRes.json()).handoff;

      // Both publishers use the exact same supplier connection & FareHarbor item (coastalhelicopters / 104215)
      assert.equal(pub1Handoff.fareharborShortname, "coastalhelicopters");
      assert.equal(pub2Handoff.fareharborShortname, "coastalhelicopters");
      assert.equal(pub1Handoff.fareharborItemId, "104215");
      assert.equal(pub2Handoff.fareharborItemId, "104215");
      assert.notEqual(pub1Handoff.handoffId, pub2Handoff.handoffId);

      // Supplier confirms booking for Publisher 2's handoff
      const confirmOutcomeRes = await postCommerceOutcome(
        new Request("https://destinationcommandcenter.com/api/v1/commerce/outcomes", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-dcc-api-key": "dcc_commerce_reporter_v03_token",
          },
          body: JSON.stringify({
            reporterProvenance: "fareharbor_webhook_adapter",
            provider: "fareharbor",
            providerAccount: "coastalhelicopters",
            providerBookingRef: "FH-COASTAL-104215-PUB2",
            eventType: "BOOKING_CONFIRMED",
            providerEventTime: "2026-11-04T19:00:00.000Z",
            handoffId: pub2Handoff.handoffId,
            bookedProductCode: "coastal-helicopters-icefield-excursion",
            bookedDate: "2026-07-15",
            bookedPartySize: 2,
            bookingValueAmount: 858,
            bookingValueCurrency: "USD",
            estimatedCommissionAmount: 68.64,
            estimatedCommissionCurrency: "USD",
          }),
        }),
      );
      assert.equal(confirmOutcomeRes.status, 201);

      // Read back Publisher 2's handoff -> confirmed & matched to partner:welcome-to-alaska
      const pub2Readback = await (
        await getCommerceHandoff(
          new Request(
            `https://destinationcommandcenter.com/api/v1/commerce/handoffs?handoffId=${pub2Handoff.handoffId}`,
          ),
        )
      ).json();
      assert.equal(pub2Readback.handoff.outcomeState.bookingOutcome, "confirmed");
      assert.equal(pub2Readback.handoff.outcomeState.commissionReconciliation, "estimated");
      assert.equal(
        pub2Readback.handoff.approvedPartnerAttribution.partnerId,
        "welcome-to-alaska",
      );
      assert.equal(pub2Readback.handoff.originatingSite, "welcometoalaskatours.com");

      // Read back Publisher 1's handoff -> still click_recorded_outcome_unknown (not falsely credited)
      const pub1Readback = await (
        await getCommerceHandoff(
          new Request(
            `https://destinationcommandcenter.com/api/v1/commerce/handoffs?handoffId=${pub1Handoff.handoffId}`,
          ),
        )
      ).json();
      assert.equal(pub1Readback.handoff.outcomeState.bookingOutcome, "unknown");
      assert.equal(
        pub1Readback.handoff.outcomeState.status,
        "click_recorded_outcome_unknown",
      );

      // Verify outcomes lookup for Publisher 2's handoff
      const outcomesReadback = await (
        await getCommerceOutcomes(
          new Request(
            `https://destinationcommandcenter.com/api/v1/commerce/outcomes?handoffId=${pub2Handoff.handoffId}`,
          ),
        )
      ).json();
      assert.equal(outcomesReadback.outcomesCount, 1);
      assert.equal(outcomesReadback.outcomes[0].reconciliationStatus, "matched");
      assert.equal(
        outcomesReadback.outcomes[0].reconciliationComparison.matchedHandoffId,
        pub2Handoff.handoffId,
      );
    });
  });
});
