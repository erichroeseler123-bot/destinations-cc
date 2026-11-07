import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  SHARED_MARKET_TEMPLATES,
  appendPortableTripDetailsToUrl,
  buildSecondPurchaseRecommendations,
  extractPortableTripDetailsFromSearchParams,
  type SharedMarketId,
} from "../../lib/dcc/sharedMarketTemplate";
import { validateUrlFreeOfPersonalData } from "../../lib/dcc/portfolioNetworkRegistry";
import {
  OPERATOR_DIRECT_CHECKOUT_REGISTRY,
  V03OperatorDirectCheckoutEngine,
} from "../../lib/dcc/machine/v03/operatorDirectCheckout";

const ROOT = process.cwd();

describe("Shared Market Template & Portable Trip Details Across New Orleans, Juneau, Red Rocks, and GoSno", () => {
  it("1. Maps all 5 network responsibilities across New Orleans, Juneau, Red Rocks, and GoSno using what is already built", () => {
    const markets: SharedMarketId[] = ["new-orleans", "juneau", "red-rocks", "gosno"];

    for (const marketId of markets) {
      const tpl = SHARED_MARKET_TEMPLATES[marketId];
      assert.ok(tpl, `Expected shared market template for ${marketId}`);
      assert.equal(tpl.marketId, marketId);

      // Responsibility 1: DCC Public Authority & Safety Buffer Floor
      assert.ok(tpl.dccAuthority.canonicalHubPath.startsWith("/"));
      assert.ok(tpl.dccAuthority.feederPaths.length >= 3);
      assert.ok(tpl.dccAuthority.primaryTravelerQuestions.length >= 3);
      assert.ok(tpl.dccAuthority.verifiedEvidenceSources.length >= 3);
      assert.ok(tpl.dccAuthority.safetyBufferFloorMinutes >= 45);

      // Responsibility 2: Partner Referral & Live Disruption Recovery
      assert.ok(tpl.partnerAndRecovery.partnerShareLinkIds.length >= 1);
      assert.ok(tpl.partnerAndRecovery.supportedPartnerRoles.length >= 1);
      assert.ok(tpl.partnerAndRecovery.liveRecoveryEvaluatorSymbol.length > 0);

      // Responsibility 3: Specialist Storefront & Option Narrowing
      assert.ok(tpl.storefrontSurface.primaryStorefrontDomain.length > 0);
      assert.ok(tpl.storefrontSurface.continuityCookieName.length > 0);
      assert.ok(tpl.storefrontSurface.acceptedUrlParams.includes("ctx"));
      assert.ok(tpl.storefrontSurface.acceptedUrlParams.includes("dcc_ctx"));
      assert.ok(tpl.storefrontSurface.emittedFitBadges.length >= 2);

      // Responsibility 4: Controlling Booking, Checkout Execution & Ledger Attribution
      assert.equal(tpl.checkoutAndLedger.supports15MinuteHold, true);
      assert.ok(tpl.checkoutAndLedger.activeDirectCheckoutOperatorIds.length >= 1);
      assert.equal(tpl.checkoutAndLedger.ledgerStageTracking.length, 5);

      // Responsibility 5: Second-Purchase Continuation Paths
      assert.ok(tpl.secondPurchasePaths.length >= 2);
    }

    // Verify specific safety buffer floors and monetization models
    assert.equal(SHARED_MARKET_TEMPLATES["new-orleans"].dccAuthority.safetyBufferFloorMinutes, 45);
    assert.equal(SHARED_MARKET_TEMPLATES["new-orleans"].checkoutAndLedger.monetizationModel, "partner_commission");

    assert.equal(SHARED_MARKET_TEMPLATES.juneau.dccAuthority.safetyBufferFloorMinutes, 90);
    assert.equal(SHARED_MARKET_TEMPLATES.juneau.checkoutAndLedger.monetizationModel, "partner_commission");

    assert.equal(SHARED_MARKET_TEMPLATES["red-rocks"].dccAuthority.safetyBufferFloorMinutes, 60);
    assert.equal(SHARED_MARKET_TEMPLATES["red-rocks"].checkoutAndLedger.monetizationModel, "owned_operated");

    assert.equal(SHARED_MARKET_TEMPLATES.gosno.dccAuthority.safetyBufferFloorMinutes, 120);
    assert.equal(SHARED_MARKET_TEMPLATES.gosno.checkoutAndLedger.monetizationModel, "owned_operated");
  });

  it("2. Makes trip details portable across sites (WNO, Juneau Flight Deck, Party at Red Rocks, GoSno) and enforces zero PII in URLs", () => {
    // Extract portable trip details from a Red Rocks concert traveler
    const redRocksTrip = extractPortableTripDetailsFromSearchParams(
      {
        ctx: "dcc_ctx_colo_20260717_group6",
        date: "2026-07-17",
        partySize: "6",
        pickupHub: "Denver Union Station",
        venue: "Red Rocks Amphitheatre",
        ski_bags: "6",
        partner: "the-crawford-hotel-denver",
        partner_role: "hotel_concierge",
      },
      { market: "red-rocks" },
    );

    assert.equal(redRocksTrip.contextId, "dcc_ctx_colo_20260717_group6");
    assert.equal(redRocksTrip.date, "2026-07-17");
    assert.equal(redRocksTrip.partySize, 6);
    assert.equal(redRocksTrip.pickupHub, "Denver Union Station");
    assert.equal(redRocksTrip.skiBagsCount, 6);
    assert.equal(redRocksTrip.partnerId, "the-crawford-hotel-denver");
    assert.equal(redRocksTrip.partnerRole, "hotel_concierge");
    assert.equal(redRocksTrip.purchaseStep, 1);

    // Project Red Rocks trip into a second purchase on GoSno (gosno.co)
    const secondPurchaseRecs = buildSecondPurchaseRecommendations("red-rocks", redRocksTrip);
    const goSnoRec = secondPurchaseRecs.find((r) => r.targetMarket === "gosno")!;
    assert.ok(goSnoRec, "Expected Red Rocks -> GoSno cross-site second purchase recommendation");

    const parsedGoSnoUrl = new URL(goSnoRec.portableHref);
    assert.equal(parsedGoSnoUrl.hostname, "www.gosno.co");
    assert.equal(parsedGoSnoUrl.searchParams.get("ctx"), "dcc_ctx_colo_20260717_group6");
    assert.equal(parsedGoSnoUrl.searchParams.get("date"), "2026-07-17");
    assert.equal(parsedGoSnoUrl.searchParams.get("party_size"), "6");
    assert.equal(parsedGoSnoUrl.searchParams.get("passengers"), "6");
    assert.equal(parsedGoSnoUrl.searchParams.get("passengerCount"), "6");
    assert.equal(parsedGoSnoUrl.searchParams.get("origin"), "Denver Union Station");
    assert.equal(parsedGoSnoUrl.searchParams.get("ski_bags"), "6");
    // 6 passengers with 6 ski bags automatically selects awd-sprinter-14
    assert.equal(parsedGoSnoUrl.searchParams.get("vehicleClass"), "awd-sprinter-14");
    assert.equal(parsedGoSnoUrl.searchParams.get("completed_leg"), "red-rocks");
    assert.equal(parsedGoSnoUrl.searchParams.get("purchase_step"), "2");
    assert.equal(parsedGoSnoUrl.searchParams.get("partner"), "the-crawford-hotel-denver");
    assert.ok(parsedGoSnoUrl.searchParams.get("dcc_ctx"), "Expected base64url dcc_ctx param");

    // Verify zero PII in the portable URL
    assert.equal(validateUrlFreeOfPersonalData(goSnoRec.portableHref).valid, true);

    // Round-trip: extract portable trip details on the receiving GoSno page using only the base64url dcc_ctx + query
    const receivedOnGoSno = extractPortableTripDetailsFromSearchParams(
      parsedGoSnoUrl.search,
      { market: "gosno" },
    );
    assert.equal(receivedOnGoSno.contextId, "dcc_ctx_colo_20260717_group6");
    assert.equal(receivedOnGoSno.partySize, 6);
    assert.equal(receivedOnGoSno.pickupHub, "Denver Union Station");
    assert.deepEqual(receivedOnGoSno.completedLegs, ["red-rocks"]);
    assert.equal(receivedOnGoSno.purchaseStep, 2);

    // Project a Juneau cruise passenger's portable details across Juneau Flight Deck & Cruise Promenade
    const juneauTrip = extractPortableTripDetailsFromSearchParams(
      {
        date: "2026-06-18",
        party_size: "4",
        ship: "Norwegian Bliss",
        berth: "AJD",
        claa_arrival: "07:00",
        all_aboard: "12:30",
        flight_canceled: "1",
        cancel_ref: "coastal-wx-am",
      },
      { market: "juneau" },
    );
    assert.match(juneauTrip.contextId, /^dcc_ctx_juneau_/);
    assert.equal(juneauTrip.flightCanceled, true);

    const jfdPortableUrl = appendPortableTripDetailsToUrl(
      "https://www.juneauflightdeck.com/juneau-whale-watching-tours",
      juneauTrip,
      { targetMarket: "juneau" },
    );
    const parsedJfd = new URL(jfdPortableUrl);
    assert.equal(parsedJfd.searchParams.get("ship"), "Norwegian Bliss");
    assert.equal(parsedJfd.searchParams.get("berth"), "AJD");
    assert.equal(parsedJfd.searchParams.get("all_aboard"), "12:30");
    assert.equal(parsedJfd.searchParams.get("flight_canceled"), "1");
    assert.equal(parsedJfd.searchParams.get("cancel_ref"), "coastal-wx-am");
    assert.equal(validateUrlFreeOfPersonalData(jfdPortableUrl).valid, true);
  });

  it("3. Enables multi-purchase continuation in V03OperatorDirectCheckoutEngine across owned and partner operators using the same dcc_ctx_", () => {
    assert.ok(OPERATOR_DIRECT_CHECKOUT_REGISTRY["party-at-red-rocks"]);
    assert.ok(OPERATOR_DIRECT_CHECKOUT_REGISTRY["gosno-mountain-transfer"]);

    const engine = new V03OperatorDirectCheckoutEngine();

    // Register Departure #1: Party at Red Rocks Shared Shuttle
    engine.registerDeparture({
      departureId: "PARR-2026-07-17-1630",
      operatorId: "party-at-red-rocks",
      serviceDate: "2026-07-17",
      departureLocal: "16:30",
      durationMinutes: 360,
      baseFarePerSeatUsd: 59,
      taxesAndFeesPerSeatUsd: 0,
      seatLockSource: "RESERVED_SEAT_BLOCK",
      providerConfirmedSeats: true,
      totalConfirmedSeats: 24,
      remainingSeats: 24,
    });

    // Register Departure #2: GoSno Private AWD Sprinter to Vail next morning
    engine.registerDeparture({
      departureId: "GOSNO-2026-07-18-0900",
      operatorId: "gosno-mountain-transfer",
      serviceDate: "2026-07-18",
      departureLocal: "09:00",
      durationMinutes: 120,
      baseFarePerSeatUsd: 115,
      taxesAndFeesPerSeatUsd: 0,
      seatLockSource: "RESERVED_SEAT_BLOCK",
      providerConfirmedSeats: true,
      totalConfirmedSeats: 14,
      remainingSeats: 14,
    });

    const initialContext = {
      contextId: "dcc_ctx_multi_purchase_co_01",
      portSlug: "red-rocks",
      serviceDate: "2026-07-17",
      partySize: 6,
      pickupHub: "Denver Union Station",
      destinationResortOrVenue: "Red Rocks Amphitheatre",
      partnerId: "the-crawford-hotel-denver",
      purchaseStep: 1,
    };

    // Purchase #1: Book Party at Red Rocks for 6 travelers
    const purchase1 = engine.submitDirectCheckout({
      idempotencyKey: "idem_co_purchase_1",
      tripContext: initialContext,
      operatorId: "party-at-red-rocks",
      departureId: "PARR-2026-07-17-1630",
      nowIso: "2026-07-17T12:00:00Z",
    });
    assert.equal(purchase1.ok, true);
    assert.equal(purchase1.displayStatus, "Confirmed");
    assert.equal(purchase1.reservation?.grossTotalUsd, 354);

    // Carry portable trip context into Purchase #2 on GoSno without re-entering partySize or pickupHub
    const secondContext = engine.buildPortableTripContextForNextPurchase(initialContext, {
      nextPortSlug: "gosno",
      nextServiceDate: "2026-07-18",
      nextDestinationResortOrVenue: "Vail Village",
      nextSkiBagsCount: 6,
      completedLegId: "red-rocks",
    });

    assert.equal(secondContext.contextId, "dcc_ctx_multi_purchase_co_01");
    assert.equal(secondContext.partySize, 6);
    assert.equal(secondContext.pickupHub, "Denver Union Station");
    assert.equal(secondContext.destinationResortOrVenue, "Vail Village");
    assert.deepEqual(secondContext.completedLegs, ["red-rocks"]);
    assert.equal(secondContext.purchaseStep, 2);

    const purchase2 = engine.submitDirectCheckout({
      idempotencyKey: "idem_co_purchase_2",
      tripContext: secondContext,
      operatorId: "gosno-mountain-transfer",
      departureId: "GOSNO-2026-07-18-0900",
      nowIso: "2026-07-17T12:04:00Z",
    });
    assert.equal(purchase2.ok, true);
    assert.equal(purchase2.displayStatus, "Confirmed");
    assert.equal(purchase2.reservation?.grossTotalUsd, 690);

    // Both reservations are linked under the same portable dcc_ctx_ token
    const linkedReservations = engine.getReservationsByDccContextId(
      "dcc_ctx_multi_purchase_co_01",
    );
    assert.equal(linkedReservations.length, 2);
    assert.equal(linkedReservations[0].operatorId, "party-at-red-rocks");
    assert.equal(linkedReservations[1].operatorId, "gosno-mountain-transfer");
    assert.equal(linkedReservations[1].tripContext.purchaseStep, 2);
  });

  it("4. Renders PortableTripNetworkBar across New Orleans, Juneau, Red Rocks, and GoSno pages and exposes sharedMarketTemplates in telemetry", () => {
    const pagesWithPortableBar = [
      "app/new-orleans/tours/page.tsx",
      "app/new-orleans/swamp-tours/page.tsx",
      "app/juneau/whale-watching-tours/page.tsx",
      "app/juneau/cruise-excursions-what-to-do/page.tsx",
      "app/juneau/what-to-do-if-helicopter-tour-canceled/page.tsx",
      "app/red-rocks-transportation/page.tsx",
      "app/transportation/colorado/page.tsx",
    ];

    for (const relPath of pagesWithPortableBar) {
      const src = fs.readFileSync(path.join(ROOT, relPath), "utf8");
      assert.match(
        src,
        /PortableTripNetworkBar/,
        `Expected ${relPath} to render PortableTripNetworkBar`,
      );
    }

    const telemetryRouteSrc = fs.readFileSync(
      path.join(ROOT, "app/api/v1/concierge/telemetry/route.ts"),
      "utf8",
    );
    assert.match(telemetryRouteSrc, /sharedMarketTemplates:\s*SHARED_MARKET_TEMPLATES/);
  });
});
