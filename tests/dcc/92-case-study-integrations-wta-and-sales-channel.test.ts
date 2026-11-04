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
  resetCommercialMemoryStoreForTests,
  WTA_PREVIEW_API_TOKEN,
  WTA_PREVIEW_CLIENT_ID,
} from "@/lib/dcc/commerce";
import { DCC_PORTFOLIO_NETWORK_SITES } from "@/lib/dcc/portfolioNetworkRegistry";
import { resetMachineSecurityLimitsForTests } from "@/lib/dcc/machine";
import { DccBookingService } from "@/lib/bookings/bookingService";
import { DccSettlementEngine } from "@/lib/settlement";
import { MockOctoSupplierEngine } from "@/lib/octo/mockServer";

describe("92 — Case-Study Integrations, WTA Paid Affiliate Setup, and Multi-Publisher Sales Channel Proof", () => {
  beforeEach(() => {
    process.env.DCC_DISABLE_NEON_COMMERCE = "1";
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

  describe("Workstream 3: Welcome to Alaska Tours (WTA) Paid Affiliate Enrollment & Separation", () => {
    it("keeps WTA out of DCC_PORTFOLIO_NETWORK_SITES while enrolling WTA as a narrowly scoped paid affiliate", async () => {
      const inOwnedPortfolio = DCC_PORTFOLIO_NETWORK_SITES.some(
        (s) =>
          s.siteId === "welcome-to-alaska" ||
          s.primaryDomain === "welcometoalaskatours.com",
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
      assert.equal(statusJson.enrollment.missingProductionRequirements.length, 3);
    });

    it("proves WTA server-side credential creates a tagged referral and keeps referral, provider-confirmed booking, and commission as separate records", async () => {
      // 1. WTA cannot self-report outcomes (narrowly scoped to referral handoff + read)
      const forbiddenOutcomeRes = await postCommerceOutcome(
        new Request("https://destinationcommandcenter.com/api/v1/commerce/outcomes", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-dcc-api-key": WTA_PREVIEW_API_TOKEN,
          },
          body: JSON.stringify({
            provider: "fareharbor",
            providerBookingRef: "FH-SELF-CONFIRM-ATTEMPT",
            eventType: "BOOKING_CONFIRMED",
          }),
        }),
      );
      assert.equal(forbiddenOutcomeRes.status, 403);
      const forbiddenJson = await forbiddenOutcomeRes.json();
      assert.equal(forbiddenJson.error.code, "API_KEY_INSUFFICIENT_SCOPE");

      // 2. Run the preview lifecycle proof via POST /api/v1/commerce/affiliates/wta
      const simRes = await postWtaAffiliateSimulation(
        new Request("https://destinationcommandcenter.com/api/v1/commerce/affiliates/wta", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-dcc-api-key": WTA_PREVIEW_API_TOKEN,
          },
          body: JSON.stringify({
            intendedDate: "2026-07-15",
            partySize: 2,
            productCode: "coastal-helicopters-icefield-excursion",
            quotedPriceAmount: 858,
          }),
        }),
      );
      assert.equal(simRes.status, 201);
      const simJson = await simRes.json();
      assert.equal(simJson.ok, true);
      const proof = simJson.lifecycleProof;
      assert.equal(proof.verified, true);
      assert.equal(proof.callerClientId, WTA_PREVIEW_CLIENT_ID);

      // Verify Record 1: Referral Record
      assert.equal(proof.referralRecord.recordTable, "dcc_commercial_handoffs");
      assert.equal(proof.referralRecord.recordType, "tagged_referral_handoff");
      assert.deepEqual(proof.referralRecord.approvedPartnerAttribution, {
        partnerId: "welcome-to-alaska",
        partnerName: "Welcome to Alaska Tours",
        authScope: "referral_attribution_only",
        grantsLoginAccess: false,
        grantsReportingAccess: false,
        grantsPayoutAccess: false,
      });
      assert.equal(proof.referralRecord.clickIsBooking, false);

      // Verify Record 2: Provider-Confirmed Booking Record
      assert.equal(proof.bookingRecord.recordTable, "dcc_commercial_outcomes");
      assert.equal(proof.bookingRecord.recordType, "provider_confirmed_booking");
      assert.equal(proof.bookingRecord.eventType, "BOOKING_CONFIRMED");
      assert.equal(proof.bookingRecord.bookingValueAmount, 858);
      assert.equal(proof.bookingRecord.estimatedCommissionAmount, 68.64);
      assert.equal(proof.bookingRecord.paidCommissionAmount, null);

      // Verify Record 3: Commission Record
      assert.equal(proof.commissionRecord.recordTable, "dcc_commercial_outcomes");
      assert.equal(proof.commissionRecord.recordType, "commission_reconciliation");
      assert.equal(proof.commissionRecord.eventType, "COMMISSION_RECONCILED");
      assert.equal(proof.commissionRecord.paidCommissionAmount, 68.64);

      // Verify all three primary IDs are distinct
      assert.equal(proof.separationAssertions.distinctPrimaryIds.length, 3);
      assert.equal(proof.separationAssertions.referralAndBookingAreSeparateRecords, true);
      assert.equal(proof.separationAssertions.bookingAndCommissionAreSeparateRecords, true);
    });

    it("gates WTA production activation until approved credentials and agreed terms are supplied", () => {
      const blockedGate = evaluateWtaAffiliateActivationGate({
        runtimeEnv: "production",
        vercelEnv: "production",
      });
      assert.equal(blockedGate.isProductionRuntime, true);
      assert.equal(blockedGate.productionActivationAllowed, false);
      assert.deepEqual(
        blockedGate.missingProductionRequirements.map((r) => r.key),
        [
          "DCC_WTA_AFFILIATE_LIVE_API_KEY",
          "DCC_WTA_WEBHOOK_HMAC_SECRET",
          "DCC_WTA_AFFILIATE_TERMS_JSON",
        ],
      );

      const unlockedGate = evaluateWtaAffiliateActivationGate({
        runtimeEnv: "production",
        vercelEnv: "production",
        liveApiKey: "dcc_wta_live_9876543210abcdef9876543210",
        webhookHmacSecret:
          "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        termsJson: JSON.stringify({
          agreementId: "DCC-AFF-WTA-2026-001",
          partnerId: "welcome-to-alaska",
          signedAt: "2026-11-04T00:00:00Z",
          effectiveAt: "2026-11-04T00:00:00Z",
          commissionRateBps: 800,
          attributionWindowDays: 30,
          payoutSchedule: "net_30_post_service_completion",
          approvedByDcc: true,
          approvedByPartner: true,
        }),
      });
      assert.equal(unlockedGate.productionActivationAllowed, true);
      assert.equal(unlockedGate.missingProductionRequirements.length, 0);
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
            "x-dcc-api-key": WTA_PREVIEW_API_TOKEN,
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
