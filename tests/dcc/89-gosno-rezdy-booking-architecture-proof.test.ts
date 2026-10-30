import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";

import { validateOperatorOnboardingApplication } from "../../lib/dcc/operatorOnboardingStore";
import { POST as postOnboardingRoute } from "../../app/api/operators/onboarding/route";
import {
  RezdyAdapter,
  GOSNO_DCC_PRODUCT_MAPPINGS,
  resolveGosnoRezdyProductMapping,
  buildDccRezdyResellerReference,
  startRezdyV1TestServer,
} from "../../lib/octo/adapters/rezdy";
import { OctoApiError } from "../../lib/octo/adapters/base";
import { DccBookingService } from "../../lib/bookings/bookingService";
import { DccSettlementEngine } from "../../lib/settlement/engine";
import {
  createCommercialHandoff,
  recordCommercialOutcome,
  resetCommercialMemoryStoreForTests,
} from "../../lib/dcc/commerce";

const VALID_BASE_ONBOARDING_PAYLOAD = {
  companyName: "Alpine Private Transfers LLC",
  contactName: "Dispatch Lead",
  contactEmail: "dispatch@alpineprivatetransfers.example",
  website: "https://alpineprivatetransfers.example",
  destinations: "Denver & Summit County, CO",
  bookingSystem: "Rezdy Native REST API v1",
  apiDocumentationUrl: "https://developers.rezdy.com/",
};

test("Gate 1: operatorPermissionConfirmed and authorizedApiAccessAvailable accept actual booleans only and never default to true or coerce strings", async () => {
  // 1. Omitting operatorPermissionConfirmed must fail with 400 (never defaults to true)
  const omittedPermission = validateOperatorOnboardingApplication({
    ...VALID_BASE_ONBOARDING_PAYLOAD,
    authorizedApiAccessAvailable: true,
  });
  assert.equal(omittedPermission.ok, false);
  if (!omittedPermission.ok) {
    assert.equal(omittedPermission.status, 400);
    assert.equal(omittedPermission.errorCode, "invalid_operator_permission_confirmation");
  }

  // 2. Passing string "false" for operatorPermissionConfirmed must fail (Boolean("false") bug prevented)
  const stringFalsePermission = validateOperatorOnboardingApplication({
    ...VALID_BASE_ONBOARDING_PAYLOAD,
    authorizedApiAccessAvailable: true,
    operatorPermissionConfirmed: "false",
  });
  assert.equal(stringFalsePermission.ok, false);
  if (!stringFalsePermission.ok) {
    assert.equal(stringFalsePermission.status, 400);
    assert.equal(stringFalsePermission.errorCode, "invalid_operator_permission_confirmation");
  }

  // 3. Passing string "true" or number 1 for operatorPermissionConfirmed must fail
  for (const nonBool of ["true", 1, 0, null, {}]) {
    const res = validateOperatorOnboardingApplication({
      ...VALID_BASE_ONBOARDING_PAYLOAD,
      authorizedApiAccessAvailable: true,
      operatorPermissionConfirmed: nonBool,
    });
    assert.equal(res.ok, false);
    if (!res.ok) {
      assert.equal(res.status, 400);
      assert.equal(res.errorCode, "invalid_operator_permission_confirmation");
    }
  }

  // 4. Passing actual boolean false for operatorPermissionConfirmed must fail with operator_permission_required
  const explicitFalsePermission = validateOperatorOnboardingApplication({
    ...VALID_BASE_ONBOARDING_PAYLOAD,
    authorizedApiAccessAvailable: true,
    operatorPermissionConfirmed: false,
  });
  assert.equal(explicitFalsePermission.ok, false);
  if (!explicitFalsePermission.ok) {
    assert.equal(explicitFalsePermission.status, 400);
    assert.equal(explicitFalsePermission.errorCode, "operator_permission_required");
  }

  // 5. Passing string "false" or missing authorizedApiAccessAvailable must fail with 400
  for (const badApiAccess of [undefined, null, "false", "true", 1]) {
    const res = validateOperatorOnboardingApplication({
      ...VALID_BASE_ONBOARDING_PAYLOAD,
      authorizedApiAccessAvailable: badApiAccess,
      operatorPermissionConfirmed: true,
    });
    assert.equal(res.ok, false);
    if (!res.ok) {
      assert.equal(res.status, 400);
      assert.equal(res.errorCode, "invalid_authorized_api_access_flag");
    }
  }

  // 6. Route handler POST /api/operators/onboarding rejects omitted or string "false" permission
  const badRouteReq = new NextRequest("https://www.destinationcommandcenter.com/api/operators/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...VALID_BASE_ONBOARDING_PAYLOAD,
      authorizedApiAccessAvailable: true,
      operatorPermissionConfirmed: "false",
    }),
  });
  const badRouteRes = await postOnboardingRoute(badRouteReq);
  assert.equal(badRouteRes.status, 400);
  const badRouteBody = await badRouteRes.json();
  assert.equal(badRouteBody.ok, false);
  assert.equal(badRouteBody.errorCode, "invalid_operator_permission_confirmation");

  // 7. Actual boolean authorizedApiAccessAvailable: false + operatorPermissionConfirmed: true succeeds as api_required_keep_viator_channel
  const noApiValid = validateOperatorOnboardingApplication({
    ...VALID_BASE_ONBOARDING_PAYLOAD,
    authorizedApiAccessAvailable: false,
    operatorPermissionConfirmed: true,
  });
  assert.equal(noApiValid.ok, true);
  if (noApiValid.ok) {
    assert.equal(noApiValid.status, 200);
    assert.equal(noApiValid.applicationStatus, "api_required_keep_viator_channel");
    assert.equal(noApiValid.submitted.authorizedApiAccessAvailable, false);
    assert.equal(noApiValid.submitted.operatorPermissionConfirmed, true);
  }
});

test("Gate 2: DCC Product Mapping, Price Retrieval, and Rezdy Native REST API v1 Translation", async () => {
  assert.ok(GOSNO_DCC_PRODUCT_MAPPINGS.length >= 11);

  // Verify canonical DEN -> Breckenridge SUV mapping
  const breckSuv = resolveGosnoRezdyProductMapping("DEN-BRECKENRIDGE");
  assert.ok(breckSuv);
  assert.equal(breckSuv.dccProductId, "dcc:gosno:den-breckenridge:suv");
  assert.equal(breckSuv.rezdyProductCode, "P7477S");
  assert.equal(breckSuv.canonicalQuantityLabel, "Suburban");
  assert.equal(breckSuv.priceDollars, 399);
  assert.equal(breckSuv.priceCents, 39900);
  assert.equal(breckSuv.vehicleClass, "suv");
  assert.equal(breckSuv.maxPassengers, 6);
  assert.equal(breckSuv.quoteOnly, false);

  // Verify DEN -> Vail SUV mapping
  const vailSuv = resolveGosnoRezdyProductMapping("PXFGPP");
  assert.ok(vailSuv);
  assert.equal(vailSuv.routeId, "DEN-VAIL");
  assert.equal(vailSuv.canonicalQuantityLabel, "Suburban");
  assert.equal(vailSuv.priceDollars, 499);
  assert.equal(vailSuv.priceCents, 49900);

  // Verify Snowmass -> DEN return SUV mapping
  const snowmassReturn = resolveGosnoRezdyProductMapping("SNOWMASS-DEN");
  assert.ok(snowmassReturn);
  assert.equal(snowmassReturn.rezdyProductCode, "PEAVH0");
  assert.equal(snowmassReturn.canonicalQuantityLabel, "Group from 1 to 2");
  assert.equal(snowmassReturn.priceDollars, 699);

  // Verify DEN -> Breckenridge Private Van mapping is marked quoteOnly
  const breckVan = resolveGosnoRezdyProductMapping("PKQDPG");
  assert.ok(breckVan);
  assert.equal(breckVan.dccProductId, "dcc:gosno:den-breckenridge:van");
  assert.equal(breckVan.canonicalQuantityLabel, "Private Van 10ppl");
  assert.equal(breckVan.priceDollars, 599);
  assert.equal(breckVan.quoteOnly, true);
  assert.equal(breckVan.onlineBookable, false);

  // Verify RezdyAdapter translates Rezdy v1 product responses over HTTP
  const testServer = await startRezdyV1TestServer();
  try {
    const adapter = new RezdyAdapter({
      endpoint: testServer.baseUrl,
      apiKey: testServer.apiKey,
      platform: "rezdy",
      operatorSlug: "gosno",
      isSandbox: true,
    });

    const p7477s = await adapter.getProduct("dcc:gosno:den-breckenridge:suv");
    assert.equal(p7477s.id, "dcc:gosno:den-breckenridge:suv");
    assert.equal(p7477s.reference, "P7477S");
    assert.equal(p7477s.title, "Denver Airport to Breckenridge — Private SUV Transfer");
    assert.equal(p7477s.defaultCurrency, "USD");
    assert.equal(p7477s.options[0].reference, "Suburban");
    assert.equal(p7477s.options[0].units[0].pricingFrom?.[0].retail, 399);
    assert.equal(p7477s.providerExternalIds?.custom?.rezdyProductCode, "P7477S");
    assert.equal(p7477s.providerExternalIds?.custom?.priceCents, 39900);

    const allProducts = await adapter.getProducts();
    assert.equal(allProducts.length, 4);
  } finally {
    await testServer.close();
  }
});

test("Gate 3: Availability Handling — Unavailable and Quote-Only Results Remain Unavailable or Quote-Only", async () => {
  const prevDbUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "";
  const testServer = await startRezdyV1TestServer();

  try {
    DccBookingService.clearPilotSupplierConnections();
    DccBookingService.resetFallbackStoresForTests();

    const adapter = new RezdyAdapter({
      endpoint: testServer.baseUrl,
      apiKey: testServer.apiKey,
      platform: "rezdy",
      operatorSlug: "gosno",
      isSandbox: true,
    });

    DccBookingService.registerPilotSupplierConnection({
      id: "conn_gosno_rezdy",
      operatorSlug: "gosno",
      operatorName: "GoSno Mountain Transportation",
      endpoint: testServer.baseUrl,
      reservationPlatform: "rezdy",
      commissionPercent: 10.0,
      apiKey: testServer.apiKey,
      isSandbox: true,
      connectionStatus: "sandbox_verified",
      adapter,
    });

    // 1. Available session (497020486 on 2026-11-12, seatsAvailable: 1) -> AVAILABLE
    const availSlots = await adapter.checkAvailability(
      "dcc:gosno:den-breckenridge:suv",
      "opt_suburban_69029050",
      "2026-11-12",
      [{ unitId: "unit_suburban_69029050", quantity: 1 }],
    );
    assert.equal(availSlots.length, 1);
    assert.equal(availSlots[0].id, "497020486");
    assert.equal(availSlots[0].available, true);
    assert.equal(availSlots[0].status, "AVAILABLE");
    assert.equal(availSlots[0].vacancies, 1);
    assert.equal(availSlots[0].unitPricing?.[0].pricing.retail, 399);

    // 2. Sold-out session (507139971 on 2026-12-14, seatsAvailable: 0) -> MUST remain unavailable / SOLD_OUT
    const soldOutSlots = await adapter.checkAvailability(
      "dcc:gosno:den-breckenridge:suv",
      "opt_suburban_69029050",
      "2026-12-14",
      [{ unitId: "unit_suburban_69029050", quantity: 1 }],
    );
    assert.equal(soldOutSlots.length, 1);
    assert.equal(soldOutSlots[0].id, "507139971");
    assert.equal(soldOutSlots[0].available, false);
    assert.equal(soldOutSlots[0].status, "SOLD_OUT");
    assert.equal(soldOutSlots[0].vacancies, 0);
    assert.equal((soldOutSlots[0] as any).reason, "ZERO_SEATS_AVAILABLE");

    const svcSoldOut = await DccBookingService.checkAvailability(
      "dcc:gosno:den-breckenridge:suv",
      "opt_suburban_69029050",
      "2026-12-14 15:05:00",
      [{ unitId: "unit_suburban_69029050", quantity: 1 }],
    );
    assert.equal(svcSoldOut.available, false);
    assert.equal(svcSoldOut.status, "SOLD_OUT");
    assert.equal(svcSoldOut.vacancies, 0);

    // 3. Date with no Rezdy sessions (2026-12-25) -> MUST remain unavailable / SOLD_OUT
    const noSessionSlots = await adapter.checkAvailability(
      "dcc:gosno:den-breckenridge:suv",
      "opt_suburban_69029050",
      "2026-12-25",
      [{ unitId: "unit_suburban_69029050", quantity: 1 }],
    );
    assert.equal(noSessionSlots[0].available, false);
    assert.equal(noSessionSlots[0].status, "SOLD_OUT");
    assert.equal((noSessionSlots[0] as any).reason, "NO_REZDY_SESSION_AVAILABLE");

    // 4. Quote-only product (PKQDPG private van) -> MUST remain available: false, quoteOnly: true
    const quoteOnlyCheck = await DccBookingService.checkAvailability(
      "dcc:gosno:den-breckenridge:van",
      "opt_van_73379226",
      "2026-12-15 10:00:00",
      [{ unitId: "unit_van_73379226", quantity: 1 }],
    );
    assert.equal(quoteOnlyCheck.available, false);
    assert.equal(quoteOnlyCheck.quoteOnly, true);
    assert.equal(quoteOnlyCheck.reason, "QUOTE_ONLY_PRODUCT");

    // 5. Passenger count exceeding SUV capacity (8 pax > 6 max) -> MUST remain unavailable
    const overCapSlots = await adapter.checkAvailability(
      "dcc:gosno:den-breckenridge:suv",
      "opt_suburban_69029050",
      "2026-11-12",
      [{ unitId: "unit_suburban_69029050", quantity: 1, passengers: 8 } as any],
    );
    assert.equal(overCapSlots[0].available, false);
    assert.equal(overCapSlots[0].status, "SOLD_OUT");
    assert.equal((overCapSlots[0] as any).reason, "MAX_PASSENGERS_EXCEEDED");

    // 6. Attempting to create a hold on a quote-only product MUST fail closed
    await assert.rejects(
      () =>
        DccBookingService.createHold({
          supplierConnectionId: "conn_gosno_rezdy",
          productId: "dcc:gosno:den-breckenridge:van",
          optionId: "opt_van_73379226",
          availabilityId: "2026-12-15 10:00:00",
          expirationMinutes: 15,
          unitItems: [{ unitId: "unit_van_73379226", quantity: 1 }],
        }),
      (err: unknown) =>
        err instanceof OctoApiError && err.code === "QUOTE_ONLY_PRODUCT_NOT_BOOKABLE",
    );

    // 7. Attempting to create a hold on a sold-out Rezdy session (507139971) MUST fail closed
    await assert.rejects(
      () =>
        DccBookingService.createHold({
          supplierConnectionId: "conn_gosno_rezdy",
          productId: "dcc:gosno:den-breckenridge:suv",
          optionId: "opt_suburban_69029050",
          availabilityId: "507139971",
          expirationMinutes: 15,
          unitItems: [{ unitId: "unit_suburban_69029050", quantity: 1 }],
        }),
      (err: unknown) =>
        err instanceof OctoApiError && err.code === "REZDY_ERR_SESSION_SOLD_OUT",
    );

    assert.equal(testServer.getOrders().length, 0, "Zero Rezdy bookings may be created for sold-out or quote-only requests");
  } finally {
    await testServer.close();
    if (prevDbUrl !== undefined) process.env.DATABASE_URL = prevDbUrl;
    else delete process.env.DATABASE_URL;
  }
});

test("Gate 4: Full Reservation Creation, Confirmation, Cancellation, Duplicate-Request Protection, Outcome Reconciliation, and 10% Commission Accounting", async () => {
  const prevDbUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "";
  const testServer = await startRezdyV1TestServer();

  try {
    DccBookingService.clearPilotSupplierConnections();
    DccBookingService.resetFallbackStoresForTests();
    DccSettlementEngine.resetFallbackStoreForTests();
    resetCommercialMemoryStoreForTests();

    const adapter = new RezdyAdapter({
      endpoint: testServer.baseUrl,
      apiKey: testServer.apiKey,
      platform: "rezdy",
      operatorSlug: "gosno",
      isSandbox: true,
    });

    DccBookingService.registerPilotSupplierConnection({
      id: "conn_gosno_rezdy",
      operatorSlug: "gosno",
      operatorName: "GoSno Mountain Transportation",
      endpoint: testServer.baseUrl,
      reservationPlatform: "rezdy",
      commissionPercent: 10.0,
      apiKey: testServer.apiKey,
      isSandbox: true,
      connectionStatus: "sandbox_verified",
      adapter,
    });

    // Prime session cache via checkAvailability
    const check = await DccBookingService.checkAvailability(
      "dcc:gosno:den-breckenridge:suv",
      "opt_suburban_69029050",
      "2026-11-12 10:53:00",
      [{ unitId: "unit_suburban_69029050", quantity: 1 }],
    );
    assert.equal(check.available, true);
    assert.equal(check.id, "497020486");

    // 1. Create Reservation Hold (POST /v1/bookings with status: PROCESSING)
    const hold = await DccBookingService.createHold({
      supplierConnectionId: "conn_gosno_rezdy",
      productId: "dcc:gosno:den-breckenridge:suv",
      optionId: "opt_suburban_69029050",
      availabilityId: "497020486",
      expirationMinutes: 15,
      unitItems: [{ unitId: "unit_suburban_69029050", quantity: 1 }],
      idempotencyKey: "idem_gosno_lifecycle_001",
      notes: "DCC Pilot Hold | DEN -> Breckenridge Private SUV",
    });

    assert.equal(hold.status, "ON_HOLD");
    assert.equal(hold.supplierReference, "RZTEST1001");
    assert.equal(hold.totalPrice, 399);
    assert.equal(hold.currency, "USD");
    assert.equal(
      hold.resellerReference,
      buildDccRezdyResellerReference("idem_gosno_lifecycle_001"),
    );
    assert.equal(testServer.getOrders().length, 1);
    assert.equal(testServer.getOrders()[0].status, "PROCESSING");
    assert.equal(testServer.getOrders()[0].items[0].productCode, "P7477S");
    assert.equal(testServer.getOrders()[0].items[0].amount, 399);
    assert.deepEqual(testServer.getOrders()[0].items[0].quantities, [
      {
        optionLabel: "Suburban",
        optionPrice: 399,
        value: 1,
        priceGroupType: "EACH",
      },
    ]);

    // 2A. Duplicate-Request Protection Layer 1 (DCC idempotency store)
    const duplicateHold = await DccBookingService.createHold({
      supplierConnectionId: "conn_gosno_rezdy",
      productId: "dcc:gosno:den-breckenridge:suv",
      optionId: "opt_suburban_69029050",
      availabilityId: "497020486",
      expirationMinutes: 15,
      unitItems: [{ unitId: "unit_suburban_69029050", quantity: 1 }],
      idempotencyKey: "idem_gosno_lifecycle_001",
    });
    assert.equal(duplicateHold.dccBookingId, hold.dccBookingId);
    assert.equal(duplicateHold.supplierReference, "RZTEST1001");
    assert.equal(testServer.getOrders().length, 1, "Duplicate request must not create a second Rezdy order");

    // 2B. Altered payload with same idempotencyKey must throw ALTERED_IDEMPOTENCY_REQUEST
    await assert.rejects(
      () =>
        DccBookingService.createHold({
          supplierConnectionId: "conn_gosno_rezdy",
          productId: "dcc:gosno:den-vail:suv",
          optionId: "opt_suburban_75298226",
          availabilityId: "498001122",
          expirationMinutes: 15,
          unitItems: [{ unitId: "unit_suburban_75298226", quantity: 1 }],
          idempotencyKey: "idem_gosno_lifecycle_001",
        }),
      (err: unknown) =>
        err instanceof OctoApiError && err.code === "ALTERED_IDEMPOTENCY_REQUEST",
    );

    // 2C. Duplicate-Request Protection Layer 2 (Upstream Rezdy resellerReference recovery on fresh adapter instance)
    const freshAdapter = new RezdyAdapter({
      endpoint: testServer.baseUrl,
      apiKey: testServer.apiKey,
      platform: "rezdy",
      operatorSlug: "gosno",
      isSandbox: true,
    });
    const recoveredUpstream = await freshAdapter.createBookingHold(
      {
        uuid: "fresh-uuid",
        productId: "dcc:gosno:den-breckenridge:suv",
        optionId: "opt_suburban_69029050",
        availabilityId: "497020486",
        expirationMinutes: 15,
        unitItems: [{ unitId: "unit_suburban_69029050", quantity: 1 }],
      },
      "idem_gosno_lifecycle_001",
    );
    assert.equal(recoveredUpstream.supplierReference, "RZTEST1001");
    assert.equal(testServer.getOrders().length, 1, "Upstream Rezdy recovery must not post a second order");

    // 3. Confirm Reservation (PUT /v1/bookings/RZTEST1001 with status: CONFIRMED)
    const confirmed = await DccBookingService.confirmReservation({
      bookingId: hold.dccBookingId,
      contact: {
        fullName: "Erich Roeseler",
        firstName: "Erich",
        lastName: "Roeseler",
        emailAddress: "erich@destinationcommandcenter.com",
        phoneNumber: "+1-504-717-5616",
      },
      payment: {
        isPrepaid: true,
        provider: "supplier_api",
        amount: 399,
        currency: "USD",
        status: "CAPTURED",
      },
    });

    assert.equal(confirmed.status, "CONFIRMED");
    assert.equal(confirmed.supplierReference, "RZTEST1001");
    assert.equal(confirmed.voucher?.code, "RZTEST1001");
    assert.equal(testServer.getOrders()[0].status, "CONFIRMED");
    assert.equal(testServer.getOrders()[0].customer.firstName, "Erich");
    assert.equal(testServer.getOrders()[0].customer.lastName, "Roeseler");

    // 4. Verify 10% Commission Calculation in Test Accounting ($399.00 -> $39.90 DCC / $359.10 Operator)
    const shares = DccSettlementEngine.calculateShares(399, 10);
    assert.equal(shares.dccSharePercent, 10);
    assert.equal(shares.dccShareAmount, 39.9);
    assert.equal(shares.operatorShareAmount, 359.1);
    assert.equal(shares.isUndecided, false);

    const ledgerAfterConfirm = await DccSettlementEngine.getSettlementEntry(hold.dccBookingId);
    assert.ok(ledgerAfterConfirm);
    assert.equal(ledgerAfterConfirm.operatorSlug, "gosno");
    assert.equal(ledgerAfterConfirm.grossAmount, 399);
    assert.equal(ledgerAfterConfirm.dccSharePercent, 10);
    assert.equal(ledgerAfterConfirm.dccShareAmount, 39.9);
    assert.equal(ledgerAfterConfirm.operatorShareAmount, 359.1);
    assert.equal(ledgerAfterConfirm.settlementStatus, "pending");
    assert.equal(ledgerAfterConfirm.cancellationStatus, "none");

    const balanceAfterConfirm = await DccSettlementEngine.getOperatorBalance("gosno", "USD");
    assert.equal(balanceAfterConfirm.totalGross, 399);
    assert.equal(balanceAfterConfirm.totalDccCommission, 39.9);
    assert.equal(balanceAfterConfirm.totalPendingPayable, 359.1);

    // 5. Outcome Reconciliation (Handoff -> Rezdy Confirmed Outcome -> Deduplication)
    const handoff = await createCommercialHandoff({
      originatingSite: "destinationcommandcenter.com",
      targetSite: "gosno.co",
      provider: "rezdy",
      providerAccount: "gosnotransportation58",
      productCode: "P7477S",
      productTitle: "Denver Airport to Breckenridge — Private SUV Transfer",
      productDestinationUrl: "https://gosno.co/breckenridge",
      campaign: "dcc-gosno-pilot",
      intendedDate: "2026-11-12",
      intendedOption: "Suburban",
      partySize: 4,
      quotedPriceAmount: 399,
      quotedPriceCurrency: "USD",
      callerClientId: "client:dcc-gosno-pilot-verifier",
    });

    const outcome = await recordCommercialOutcome({
      reporterClientId: "client:dcc-commerce-partner-reporter",
      reporterProvenance: "authenticated_api_reporter",
      provider: "rezdy",
      providerAccount: "gosnotransportation58",
      providerBookingRef: "RZTEST1001",
      eventType: "BOOKING_CONFIRMED",
      providerEventTime: "2026-10-30T11:40:00.000Z",
      handoffId: handoff.handoffId,
      bookedProductCode: "P7477S",
      bookedDate: "2026-11-12",
      bookedOption: "Suburban",
      bookedPartySize: 4,
      bookingValueAmount: 399,
      bookingValueCurrency: "USD",
      estimatedCommissionAmount: 39.9,
      estimatedCommissionCurrency: "USD",
      paidCommissionAmount: null,
      paidCommissionCurrency: "USD",
    });

    assert.equal(outcome.reconciliationStatus, "matched");
    assert.equal(outcome.duplicateDelivery, false);
    assert.equal(outcome.bookingValue.amount, 399);
    assert.equal(outcome.estimatedCommission.amount, 39.9);
    assert.equal(outcome.reconciliationComparison.dateComparison.matches, true);
    assert.equal(outcome.reconciliationComparison.productCodeComparison.matches, true);
    assert.equal(outcome.reconciliationComparison.partySizeComparison.matches, true);
    assert.equal(outcome.reconciliationComparison.priceComparison.matches, true);

    const outcomeDup = await recordCommercialOutcome({
      reporterClientId: "client:dcc-commerce-partner-reporter",
      reporterProvenance: "authenticated_api_reporter",
      provider: "rezdy",
      providerAccount: "gosnotransportation58",
      providerBookingRef: "RZTEST1001",
      eventType: "BOOKING_CONFIRMED",
      providerEventTime: "2026-10-30T11:40:00.000Z",
      handoffId: handoff.handoffId,
      bookingValueAmount: 399,
      estimatedCommissionAmount: 39.9,
    });
    assert.equal(outcomeDup.duplicateDelivery, true);
    assert.equal(outcomeDup.outcomeId, outcome.outcomeId);

    // 6. Cancellation (DELETE /v1/bookings/RZTEST1001) & Full Settlement Reversal
    const cancelled = await DccBookingService.cancelReservation(
      hold.dccBookingId,
      "Customer requested cancellation in pilot test",
    );
    assert.equal(cancelled.status, "CANCELLED");
    assert.equal(testServer.getOrders()[0].status, "CANCELLED");

    const ledgerAfterCancel = await DccSettlementEngine.getSettlementEntry(hold.dccBookingId);
    assert.ok(ledgerAfterCancel);
    assert.equal(ledgerAfterCancel.settlementStatus, "reversed");
    assert.equal(ledgerAfterCancel.cancellationStatus, "cancelled_full_refund");
    assert.equal(ledgerAfterCancel.dccShareAmount, 0);
    assert.equal(ledgerAfterCancel.operatorShareAmount, 0);

    const balanceAfterCancel = await DccSettlementEngine.getOperatorBalance("gosno", "USD");
    assert.equal(balanceAfterCancel.totalGross, 0);
    assert.equal(balanceAfterCancel.totalDccCommission, 0);
    assert.equal(balanceAfterCancel.totalPendingPayable, 0);
  } finally {
    await testServer.close();
    if (prevDbUrl !== undefined) process.env.DATABASE_URL = prevDbUrl;
    else delete process.env.DATABASE_URL;
  }
});

test("Gate 5: Preserved Request/Response Evidence Artifact is Complete, Redacted, and Accurate", () => {
  const proofPath = path.join(
    process.cwd(),
    "data/viator-operator-snapshots/preserved-gosno-rezdy-booking-proof.json",
  );
  assert.ok(fs.existsSync(proofPath), "Preserved GoSno Rezdy booking proof JSON must exist");

  const raw = fs.readFileSync(proofPath, "utf8");
  assert.ok(!raw.includes("gosno_rezdy_admin_20260929_8f9c1b"), "Admin proxy token must be redacted in preserved proof");
  assert.ok(!raw.includes("rezdy_test_key_dcc_gosno_pilot_32chars_01"), "Test API key must be redacted in preserved proof");

  const proof = JSON.parse(raw);
  assert.equal(proof.statusSummary.onboardingBooleanValidationFixed, "PASSED");
  assert.equal(proof.statusSummary.rezdyRequestResponseTranslationImplemented, "PASSED");
  assert.equal(proof.statusSummary.dccProductMappingVerified, "PASSED");
  assert.equal(proof.statusSummary.liveReadonlyCatalogAndPriceRetrieval, "PASSED");
  assert.equal(proof.statusSummary.liveReadonlyAvailabilityAndSoldOutHandling, "PASSED");
  assert.equal(proof.statusSummary.quoteOnlyPreservationVerified, "PASSED");
  assert.equal(proof.statusSummary.testFacilityReservationHoldConfirmCancelLifecycle, "PASSED");
  assert.equal(proof.statusSummary.duplicateRequestProtectionVerified, "PASSED");
  assert.equal(proof.statusSummary.outcomeReconciliationVerified, "PASSED");
  assert.equal(proof.statusSummary.tenPercentCommissionAccountingVerified, "PASSED");
  assert.match(proof.statusSummary.directRezdyStagingApiWriteStatus, /BLOCKED_MISSING_STAGING_API_KEY/);

  // Verify live read-only captured product & availability evidence
  assert.equal(proof.liveReadonlyEvidence.translatedProducts.P7477S.reference, "P7477S");
  assert.equal(
    proof.liveReadonlyEvidence.translatedAvailability.availableSession_497020486[0].available,
    true,
  );
  assert.equal(
    proof.liveReadonlyEvidence.translatedAvailability.soldOutSession_507139971[0].available,
    false,
  );
  assert.equal(
    proof.liveReadonlyEvidence.translatedAvailability.quoteOnlyVan_PKQDPG[0].available,
    false,
  );
  assert.equal(
    proof.liveReadonlyEvidence.translatedAvailability.quoteOnlyVan_PKQDPG[0].quoteOnly,
    true,
  );

  // Verify 10% accounting before and after cancellation in preserved proof
  assert.equal(
    proof.testFacilityLifecycleEvidence.tenPercentSettlementAfterConfirm.ledgerEntry.dccSharePercent,
    10,
  );
  assert.equal(
    proof.testFacilityLifecycleEvidence.tenPercentSettlementAfterConfirm.ledgerEntry.dccShareAmount,
    39.9,
  );
  assert.equal(
    proof.testFacilityLifecycleEvidence.tenPercentSettlementAfterConfirm.ledgerEntry.operatorShareAmount,
    359.1,
  );
  assert.equal(
    proof.testFacilityLifecycleEvidence.tenPercentSettlementAfterCancel.ledgerEntry.settlementStatus,
    "reversed",
  );
  assert.equal(
    proof.testFacilityLifecycleEvidence.tenPercentSettlementAfterCancel.ledgerEntry.dccShareAmount,
    0,
  );
});
