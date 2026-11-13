import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  STOREFRONT_PRODUCTS,
  getProductPrimaryBookingHref,
  getProductActiveBookingVariants,
} from "../../app/new-orleans/tours/pageConfig";
import {
  CLAA_JUNEAU_PORT_SCHEDULE,
  evaluateCruiseTimingWindow,
} from "../../lib/dcc/cruiseTimingGate";
import {
  evaluateJuneauBackupFlow,
  evaluateNolaBayouConditions,
} from "../../lib/dcc/dockRolloutContext";
import {
  V03OperatorDirectCheckoutEngine,
  OPERATOR_DIRECT_CHECKOUT_REGISTRY,
} from "../../lib/dcc/machine/v03";

const ROOT = process.cwd();

describe("Launch Today: New Orleans & Juneau Storefronts, Cruise Timing, Direct Checkout v0.3 & April 24 Dock Rollout", () => {
  it("1. New Orleans: preserves exact Gray Line, Ragin Cajun, and Southern Style checkout links and tracking on WNO and routes from DCC", () => {
    const grayLineSlugs = [
      "swamp-bayou-tour",
      "small-airboat-swamp-adventure",
      "large-airboat-swamp-adventure",
      "oak-alley-plantation-tour-grey-line",
      "whitney-plantation-tour",
      "evening-jazz-cruise",
    ];
    for (const slug of grayLineSlugs) {
      const product = STOREFRONT_PRODUCTS.find((p) => p.slug === slug);
      assert.ok(product, `Expected Gray Line product ${slug} in STOREFRONT_PRODUCTS`);
      assert.equal(product.fareharborAsnActive, true);
      const href = getProductPrimaryBookingHref(product);
      assert.match(href, /^https:\/\/fareharbor\.com\/embeds\/book\/neworleanssteamboatcompany\/items\//);
      assert.match(href, /asn=welcometoneworleanstours/);
      assert.match(href, /ref=WelcomeToNewOrleansTours/);
      const variants = getProductActiveBookingVariants(product);
      assert.ok(variants.length >= 1);
      assert.equal(variants[0].isViator, false);
    }

    const raginCajunSlugs = [
      "covered-tour-boat",
      "ragin-cajun-airboat-options",
      "covered-boat-plantation-combo",
    ];
    for (const slug of raginCajunSlugs) {
      const product = STOREFRONT_PRODUCTS.find((p) => p.slug === slug);
      assert.ok(product, `Expected Ragin Cajun product ${slug} in STOREFRONT_PRODUCTS`);
      assert.equal(product.fareharborAsnActive, true);
      const href = getProductPrimaryBookingHref(product);
      assert.match(href, /^https:\/\/fareharbor\.com\/embeds\/book\/ragincajuntours\//);
      assert.match(href, /asn=aktourcenter/);
      const variants = getProductActiveBookingVariants(product);
      assert.ok(variants.length >= 1);
      assert.equal(variants[0].isViator, false);
      assert.equal(variants[0].bookingUrl, href);
    }

    const southernStyleSlugs = [
      "city-tour-of-new-orleans",
      "oak-alley-or-laura-plantation-tour",
      "all-day-city-plantation-combo",
    ];
    for (const slug of southernStyleSlugs) {
      const product = STOREFRONT_PRODUCTS.find((p) => p.slug === slug);
      assert.ok(product, `Expected Southern Style product ${slug} in STOREFRONT_PRODUCTS`);
      assert.equal(product.fareharborAsnActive, true);
      const href = getProductPrimaryBookingHref(product);
      assert.match(href, /^https:\/\/fareharbor\.com\/embeds\/book\/southernstyletours\/items\//);
      assert.match(href, /asn=aktourcenter/);
      assert.match(href, /flow=4344/);
      const variants = getProductActiveBookingVariants(product);
      assert.equal(variants.length, 1);
      assert.equal(variants[0].isViator, false);
      assert.equal(variants[0].bookingUrl, href);
    }

    // Pilot 15200P6 remains active on Viator so release-handoff verifier stays green
    const pilotProduct = STOREFRONT_PRODUCTS.find(
      (p) => p.slug === "louisiana-tour-company-swamp-tour-hotel-pickup",
    );
    assert.ok(pilotProduct);
    assert.equal(pilotProduct.fareharborAsnActive, false);
    assert.match(getProductPrimaryBookingHref(pilotProduct), /offer=15200P6/);

    // Verify DCC pages route to exact Gray Line, Ragin Cajun, and Southern Style offers on WNO
    const dccNolaToursSrc = fs.readFileSync(
      path.join(ROOT, "app/new-orleans/tours/page.tsx"),
      "utf8",
    );
    assert.match(dccNolaToursSrc, /welcometoneworleanstours\.com\/tours\/swamp-bayou-tour/);
    assert.match(dccNolaToursSrc, /welcometoneworleanstours\.com\/tours\/covered-tour-boat/);
    assert.match(dccNolaToursSrc, /welcometoneworleanstours\.com\/tours\/ragin-cajun-airboat-options/);
    assert.match(dccNolaToursSrc, /welcometoneworleanstours\.com\/tours\/city-tour-of-new-orleans/);
    assert.match(dccNolaToursSrc, /welcometoneworleanstours\.com\/tours\/oak-alley-or-laura-plantation-tour/);
  });

  it("2. Juneau Whale Deck & Cruise Timing: checks CLAA port-call + confirmed all-aboard with 2-hour (120m) buffer, shows exact remaining buffer when < 120m, shows Confirm ship timing when unknown, and shows seat counts only when provider-confirmed", () => {
    // 1. Norwegian Bliss (AJ Dock, 07:00 arrival, 13:00 confirmed all-aboard, 120m buffer, 210m whale tour)
    // Earliest check-in 07:35 + 210m = 11:05 + 25m return = 11:30 -> 90m (1:30:00) remaining (< 120m -> Reduced buffer — not recommended)
    const bliss = CLAA_JUNEAU_PORT_SCHEDULE.find((s) => s.shipName === "Norwegian Bliss")!;
    const blissEval = evaluateCruiseTimingWindow({
      claaArrivalLocal: bliss.claaArrivalLocal,
      claaDepartureLocal: bliss.claaDepartureLocal,
      confirmedAllAboardLocal: bliss.confirmedAllAboardLocal,
      berthCode: bliss.berthCode,
      outboundBerthToCheckInMinutes: bliss.outboundBerthToCheckInMinutes,
      returnToGangwayMinutes: bliss.returnToGangwayMinutes,
      requiredDccBufferMinutes: bliss.requiredDccBufferMinutes,
      tourDurationMinutes: 210,
      providerConfirmedSeats: false,
      providerSeatCount: 14,
    });
    assert.equal(blissEval.status, "REDUCED_BUFFER_NOT_RECOMMENDED");
    assert.equal(blissEval.statusBadgeLabel, "Reduced buffer — not recommended");
    assert.equal(blissEval.dccBufferMinutes, 120);
    assert.equal(blissEval.exactRemainingBufferHms, "1:30:00");
    // Unconfirmed provider seats must NOT be displayed
    assert.equal(blissEval.seatCountDisplay, null);

    // 1a. Royal Princess (FKL Dock, 08:00 arrival, 20:30 confirmed all-aboard, 120m buffer, 210m whale tour) -> Fits cruise window
    const royalPrincess = CLAA_JUNEAU_PORT_SCHEDULE.find((s) => s.shipName === "Royal Princess")!;
    const princessEval = evaluateCruiseTimingWindow({
      claaArrivalLocal: royalPrincess.claaArrivalLocal,
      claaDepartureLocal: royalPrincess.claaDepartureLocal,
      confirmedAllAboardLocal: royalPrincess.confirmedAllAboardLocal,
      berthCode: royalPrincess.berthCode,
      outboundBerthToCheckInMinutes: royalPrincess.outboundBerthToCheckInMinutes,
      returnToGangwayMinutes: royalPrincess.returnToGangwayMinutes,
      requiredDccBufferMinutes: royalPrincess.requiredDccBufferMinutes,
      tourDurationMinutes: 210,
      providerConfirmedSeats: false,
      providerSeatCount: 14,
    });
    assert.equal(princessEval.status, "FITS_CRUISE_WINDOW");
    assert.equal(princessEval.statusBadgeLabel, "Fits cruise window");
    assert.equal(princessEval.dccBufferMinutes, 120);

    // 1b. 5.5-hour combo (330m) on Norwegian Bliss's short morning call -> Outside safe buffer
    const blissComboEval = evaluateCruiseTimingWindow({
      claaArrivalLocal: bliss.claaArrivalLocal,
      claaDepartureLocal: bliss.claaDepartureLocal,
      confirmedAllAboardLocal: bliss.confirmedAllAboardLocal,
      berthCode: bliss.berthCode,
      outboundBerthToCheckInMinutes: bliss.outboundBerthToCheckInMinutes,
      returnToGangwayMinutes: bliss.returnToGangwayMinutes,
      requiredDccBufferMinutes: bliss.requiredDccBufferMinutes,
      tourDurationMinutes: 330,
    });
    assert.equal(blissComboEval.status, "OUTSIDE_CRUISE_WINDOW");
    assert.equal(blissComboEval.statusBadgeLabel, "Outside safe buffer");

    // 2. When provider confirms seats -> seat count is shown
    const confirmedSeatEval = evaluateCruiseTimingWindow({
      claaArrivalLocal: "08:00",
      confirmedAllAboardLocal: "20:30",
      berthCode: "FKL",
      tourDurationMinutes: 210,
      providerConfirmedSeats: true,
      providerSeatCount: 8,
    });
    assert.equal(confirmedSeatEval.seatCountDisplay, "8 provider-confirmed seats remaining");

    // 3. Ovation of the Seas (confirmedAllAboardLocal is null) -> "Confirm ship timing"
    const ovation = CLAA_JUNEAU_PORT_SCHEDULE.find((s) => s.shipName === "Ovation of the Seas")!;
    const ovationEval = evaluateCruiseTimingWindow({
      claaArrivalLocal: ovation.claaArrivalLocal,
      confirmedAllAboardLocal: ovation.confirmedAllAboardLocal,
      berthCode: ovation.berthCode,
      tourDurationMinutes: 210,
    });
    assert.equal(ovationEval.status, "CONFIRM_SHIP_TIMING");
    assert.equal(ovationEval.statusBadgeLabel, "Confirm ship timing");

    // 4. Unknown berth/transfer -> "Confirm ship timing"
    const unknownTransferEval = evaluateCruiseTimingWindow({
      claaArrivalLocal: "08:00",
      confirmedAllAboardLocal: "18:00",
      berthCode: "UNKNOWN",
      tourDurationMinutes: 210,
    });
    assert.equal(unknownTransferEval.status, "CONFIRM_SHIP_TIMING");
    assert.equal(unknownTransferEval.statusBadgeLabel, "Confirm ship timing");

    // 5. Verify Juneau Flight Deck Whale Deck and DCC Juneau Whale page use approved checkout links
    const jfdWhaleSrc = fs.readFileSync(
      path.join(ROOT, "apps/juneauflightdeck/app/juneau-whale-watching-tours/page.tsx"),
      "utf8",
    );
    assert.match(jfdWhaleSrc, /331813P1/);
    assert.match(jfdWhaleSrc, /466119P3/);
    assert.match(jfdWhaleSrc, /5857SHUTTLE/);
    assert.match(jfdWhaleSrc, /Confirm ship timing/);
    assert.match(jfdWhaleSrc, /Juneau Tours &amp; Whale Watch/);
  });

  it("3. v0.3 Direct Checkout Operator-by-Operator: tests dcc_ctx_, 15-min hold, manual dispatch 'Booking requested', sold-out departures, expired holds, duplicate submissions, cancellations, and separate referral/booking/commission tracking", () => {
    const engine = new V03OperatorDirectCheckoutEngine();

    engine.registerDeparture({
      departureId: "JNU-JTWW-2026-04-24-0930",
      operatorId: "juneau-tours-whale-watch",
      serviceDate: "2026-04-24",
      departureLocal: "09:30",
      durationMinutes: 210,
      baseFarePerSeatUsd: 180,
      taxesAndFeesPerSeatUsd: 15,
      seatLockSource: "RESERVED_SEAT_BLOCK",
      providerConfirmedSeats: true,
      totalConfirmedSeats: 6,
      remainingSeats: 6,
    });

    // 1. Track two DCC referrals before any booking is confirmed
    engine.recordDccReferral({
      dccContextId: "dcc_ctx_jnu_20260424_alpha",
      operatorId: "juneau-tours-whale-watch",
      departureId: "JNU-JTWW-2026-04-24-0930",
      nowIso: "2026-04-24T15:00:00Z",
    });
    engine.recordDccReferral({
      dccContextId: "dcc_ctx_jnu_20260424_beta",
      operatorId: "juneau-tours-whale-watch",
      departureId: "JNU-JTWW-2026-04-24-0930",
      nowIso: "2026-04-24T15:01:00Z",
    });

    let ledger = engine.getDirectCheckoutLedgerSummary();
    assert.equal(ledger.dccReferralsCount, 2);
    assert.equal(ledger.confirmedBookingsCount, 0);
    assert.equal(ledger.settledCommissionUsd, 0);

    // 2. Submit manual-dispatch seat-block booking for 4 passengers -> shows "Booking requested" with 15-min hold
    const sub1 = engine.submitDirectCheckout({
      idempotencyKey: "idem_jnu_001",
      tripContext: {
        contextId: "dcc_ctx_jnu_20260424_alpha",
        portSlug: "juneau",
        serviceDate: "2026-04-24",
        partySize: 4,
        shipName: "Royal Princess",
        berthCode: "FKL",
        claaArrivalLocal: "08:00",
        claaDepartureLocal: "21:00",
        confirmedAllAboardLocal: "20:30",
      },
      operatorId: "juneau-tours-whale-watch",
      departureId: "JNU-JTWW-2026-04-24-0930",
      nowIso: "2026-04-24T15:02:00Z",
    });

    assert.equal(sub1.ok, true);
    assert.equal(sub1.code, "BOOKING_REQUESTED");
    assert.equal(sub1.displayStatus, "Booking requested");
    assert.equal(sub1.seatCountDisplay, "2 provider-confirmed seats remaining");
    assert.equal(sub1.reservation?.holdExpiresAtIso, "2026-04-24T15:17:00.000Z");
    // 10% commission on base fare ($180 * 4 = $720 -> $72.00)
    assert.equal(sub1.reservation?.baseFareTotalUsd, 720);
    assert.equal(sub1.reservation?.expectedCommissionUsd, 72);

    // 3. Test duplicate submission with same idempotencyKey -> blocked without double-decrementing seats
    const dup1 = engine.submitDirectCheckout({
      idempotencyKey: "idem_jnu_001",
      tripContext: {
        contextId: "dcc_ctx_jnu_20260424_alpha",
        portSlug: "juneau",
        serviceDate: "2026-04-24",
        partySize: 4,
      },
      operatorId: "juneau-tours-whale-watch",
      departureId: "JNU-JTWW-2026-04-24-0930",
      nowIso: "2026-04-24T15:03:00Z",
    });
    assert.equal(dup1.ok, false);
    assert.equal(dup1.code, "DUPLICATE_SUBMISSION");
    assert.equal(dup1.seatCountDisplay, "2 provider-confirmed seats remaining");

    // 4. Test sold-out departure (requesting 3 seats when only 2 remain)
    const soldOut = engine.submitDirectCheckout({
      idempotencyKey: "idem_jnu_002_soldout",
      tripContext: {
        contextId: "dcc_ctx_jnu_20260424_beta",
        portSlug: "juneau",
        serviceDate: "2026-04-24",
        partySize: 3,
      },
      operatorId: "juneau-tours-whale-watch",
      departureId: "JNU-JTWW-2026-04-24-0930",
      nowIso: "2026-04-24T15:04:00Z",
    });
    assert.equal(soldOut.ok, false);
    assert.equal(soldOut.code, "SOLD_OUT_DEPARTURE");
    assert.equal(soldOut.displayStatus, "Sold out");

    // 5. Lock the remaining 2 seats on a second hold, then let its 15-minute hold expire
    const sub2 = engine.submitDirectCheckout({
      idempotencyKey: "idem_jnu_003_expiring",
      tripContext: {
        contextId: "dcc_ctx_jnu_20260424_beta",
        portSlug: "juneau",
        serviceDate: "2026-04-24",
        partySize: 2,
      },
      operatorId: "juneau-tours-whale-watch",
      departureId: "JNU-JTWW-2026-04-24-0930",
      nowIso: "2026-04-24T15:05:00Z",
    });
    assert.equal(sub2.ok, true);
    assert.equal(sub2.seatCountDisplay, "0 provider-confirmed seats remaining");

    // Confirm sub1 BEFORE its 15-minute hold expires (at 15:10Z)
    const confirmed1 = engine.confirmManualDispatchBooking({
      reservationId: sub1.reservation!.reservationId,
      operatorDispatchConfirmationRef: "REZGO-DISP-8841",
      nowIso: "2026-04-24T15:10:00Z",
      settleCommissionImmediately: true,
    });
    assert.equal(confirmed1.ok, true);
    assert.equal(confirmed1.displayStatus, "Confirmed");

    // Attempt to confirm sub2 AFTER its 15-minute hold expired (at 15:25Z > 15:20Z)
    const expiredConfirm = engine.confirmManualDispatchBooking({
      reservationId: sub2.reservation!.reservationId,
      operatorDispatchConfirmationRef: "REZGO-DISP-LATE",
      nowIso: "2026-04-24T15:25:00Z",
    });
    assert.equal(expiredConfirm.ok, false);
    assert.equal(expiredConfirm.code, "HOLD_EXPIRED");
    assert.equal(expiredConfirm.displayStatus, "Hold expired");
    // The 2 expired hold seats are automatically returned to the seat block!
    assert.equal(expiredConfirm.seatCountDisplay, "2 provider-confirmed seats remaining");

    // 6. Test cancellation on a new booking and verify seats return to inventory
    const sub3 = engine.submitDirectCheckout({
      idempotencyKey: "idem_jnu_004_cancel",
      tripContext: {
        contextId: "dcc_ctx_jnu_20260424_gamma",
        portSlug: "juneau",
        serviceDate: "2026-04-24",
        partySize: 2,
      },
      operatorId: "juneau-tours-whale-watch",
      departureId: "JNU-JTWW-2026-04-24-0930",
      nowIso: "2026-04-24T15:26:00Z",
    });
    assert.equal(sub3.ok, true);
    assert.equal(sub3.seatCountDisplay, "0 provider-confirmed seats remaining");

    const canceled3 = engine.cancelReservation({
      reservationId: sub3.reservation!.reservationId,
      reason: "Traveler ship itinerary change",
      nowIso: "2026-04-24T15:28:00Z",
    });
    assert.equal(canceled3.ok, true);
    assert.equal(canceled3.code, "CANCELED");
    assert.equal(canceled3.displayStatus, "Canceled");
    assert.equal(canceled3.seatCountDisplay, "2 provider-confirmed seats remaining");

    // 7. Verify DCC referrals, confirmed bookings, canceled bookings, and settled commission are tracked separately
    ledger = engine.getDirectCheckoutLedgerSummary();
    assert.equal(ledger.dccReferralsCount, 2);
    assert.equal(ledger.confirmedBookingsCount, 1);
    assert.equal(ledger.canceledBookingsCount, 1);
    assert.equal(ledger.expiredHoldsCount, 1);
    assert.equal(ledger.duplicateSubmissionsBlocked, 1);
    assert.equal(ledger.soldOutRejectionsCount, 1);
    assert.equal(ledger.settledCommissionUsd, 72);
    assert.equal(
      OPERATOR_DIRECT_CHECKOUT_REGISTRY["juneau-tours-whale-watch"].commissionRateDecimal,
      0.1,
    );
  });

  it("4. April 24 Dock Rollout: Juneau backup flow opens from traveler selection or operator tracked link with PAJN METAR context, and New Orleans flags affected bayou trips from NWS flood warnings & water levels", () => {
    // Juneau default: no cancellation reported
    const defaultJnu = evaluateJuneauBackupFlow({});
    assert.equal(defaultJnu.backupFlowOpen, false);
    assert.equal(defaultJnu.pajnMetar.stationId, "PAJN");

    // Juneau traveler selection: "My flight was canceled"
    const travelerCanceled = evaluateJuneauBackupFlow({
      travelerSelectedCanceled: "1",
    });
    assert.equal(travelerCanceled.backupFlowOpen, true);
    assert.equal(travelerCanceled.cancellationSource, "TRAVELER_SELECTION");

    // Juneau operator tracked cancellation link
    const operatorCanceled = evaluateJuneauBackupFlow({
      operatorCancelRef: "coastal-wx-20260424-am",
    });
    assert.equal(operatorCanceled.backupFlowOpen, true);
    assert.equal(operatorCanceled.cancellationSource, "OPERATOR_TRACKED_LINK");
    assert.equal(operatorCanceled.operatorCancelRef, "coastal-wx-20260424-am");

    // New Orleans normal bayou water level
    const normalBayou = evaluateNolaBayouConditions({
      basin: "BARATARIA_LAFITTE",
    });
    assert.equal(normalBayou.flaggedForOperatorCheck, false);

    // New Orleans high water level / active NWS flood warning -> flags affected bayou trip for operator check
    const floodedBayou = evaluateNolaBayouConditions({
      basin: "BARATARIA_LAFITTE",
      observedFeetOverride: 3.5,
      activeNwsFloodWarning: {
        alertId: "NWS-LIX-2026-04-24-01",
        office: "NWS New Orleans/Baton Rouge (LIX)",
        event: "Coastal Flood Warning",
        severity: "Moderate",
        affectedBasin: "BARATARIA_LAFITTE",
        headline: "Coastal Flood Warning for Barataria Basin / Jean Lafitte through 6:00 PM CDT",
        active: true,
      },
    });
    assert.equal(floodedBayou.flaggedForOperatorCheck, true);
    assert.equal(
      floodedBayou.flagBadgeLabel,
      "Operator check required — NWS flood / water-level advisory",
    );
  });
});
