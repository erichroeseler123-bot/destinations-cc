import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";

import { validateOperatorOnboardingApplication } from "../../lib/dcc/operatorOnboardingStore";
import { POST as postOnboardingRoute } from "../../app/api/operators/onboarding/route";
import {
  RezdyAdapter,
  GOSNO_DCC_PRODUCT_MAPPINGS,
  REZDY_PROVIDER_HOSTED_TESTING_REQUIREMENTS,
  resolveGosnoRezdyProductMapping,
  buildDccRezdyResellerReference,
  formatCanonicalRezdySlotId,
  parseStatelessRezdyAvailabilityLocator,
  mapRezdyStatusToOctoStatus,
  startLocalRezdyV1Simulator,
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

test("Gate 1: Accurate Evidence Labeling, Production Write Guardrail, and Provider-Hosted Testing Requirements", async () => {
  // 1. Verify onboarding boolean validation remains strict
  const omittedPermission = validateOperatorOnboardingApplication({
    ...VALID_BASE_ONBOARDING_PAYLOAD,
    authorizedApiAccessAvailable: true,
  });
  assert.equal(omittedPermission.ok, false);

  const stringFalsePermission = validateOperatorOnboardingApplication({
    ...VALID_BASE_ONBOARDING_PAYLOAD,
    authorizedApiAccessAvailable: true,
    operatorPermissionConfirmed: "false",
  });
  assert.equal(stringFalsePermission.ok, false);

  const badRouteReq = new NextRequest(
    "https://www.destinationcommandcenter.com/api/operators/onboarding",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...VALID_BASE_ONBOARDING_PAYLOAD,
        authorizedApiAccessAvailable: true,
        operatorPermissionConfirmed: "false",
      }),
    }
  );
  const badRouteRes = await postOnboardingRoute(badRouteReq);
  assert.equal(badRouteRes.status, 400);

  // 2. Verify local simulator is explicitly labeled as DCC-written simulator, NOT a Rezdy-hosted sandbox
  const sim = await startLocalRezdyV1Simulator();
  try {
    assert.equal(sim.isProviderHostedSandbox, false);
    assert.equal(sim.simulatorLabel, "dcc_written_local_simulator");
  } finally {
    await sim.close();
  }

  // 3. Verify REZDY_PROVIDER_HOSTED_TESTING_REQUIREMENTS documents exact staging account, credentials, and permissions
  assert.equal(
    REZDY_PROVIDER_HOSTED_TESTING_REQUIREMENTS.adminPortalUrl,
    "https://app.rezdy-staging.com"
  );
  assert.equal(
    REZDY_PROVIDER_HOSTED_TESTING_REQUIREMENTS.apiBaseUrl,
    "https://api.rezdy-staging.com/v1"
  );
  assert.ok(
    REZDY_PROVIDER_HOSTED_TESTING_REQUIREMENTS.requiredEnvVars.includes("REZDY_STAGING_API_KEY")
  );
  assert.ok(
    REZDY_PROVIDER_HOSTED_TESTING_REQUIREMENTS.liveCredentialCapabilityAudit.credentialType.includes(
      "230001"
    )
  );
  assert.ok(
    REZDY_PROVIDER_HOSTED_TESTING_REQUIREMENTS.liveCredentialCapabilityAudit.credentialType.includes(
      "gosnotransportation58"
    )
  );
  assert.ok(
    REZDY_PROVIDER_HOSTED_TESTING_REQUIREMENTS.requiredEndpointPermissions.length >= 4
  );

  // 4. Verify live production writes against api.rezdy.com/v1 are blocked while direct production sales are disabled
  const prodReadOnlyAdapter = new RezdyAdapter({
    endpoint: "https://api.rezdy.com/v1",
    apiKey: "dummy_key_never_sent_over_network",
    platform: "rezdy",
    operatorSlug: "gosno",
    isSandbox: false,
  });

  await assert.rejects(
    () =>
      prodReadOnlyAdapter.createBookingHold({
        uuid: "prod-guardrail-check",
        productId: "dcc:gosno:den-breckenridge:suv",
        optionId: "opt_suburban_69029050",
        availabilityId: formatCanonicalRezdySlotId("P7477S", 497020486, "2026-11-12T10:53:00"),
        expirationMinutes: 15,
        unitItems: [{ unitId: "unit_suburban_69029050", quantity: 1 }],
        contact: {
          firstName: "Test",
          lastName: "Guardrail",
          emailAddress: "guardrail@destinationcommandcenter.com",
        },
      }),
    (err: unknown) =>
      err instanceof OctoApiError &&
      err.status === 403 &&
      err.code === "LIVE_PRODUCTION_WRITE_DISABLED"
  );
});

test("Gate 2: Separate Payment, Refund, Confirmation, Service Completion, Cancellation, and Commission Eligibility States", async () => {
  const prevDbUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "";
  const sim = await startLocalRezdyV1Simulator();

  try {
    DccBookingService.clearPilotSupplierConnections();
    DccBookingService.resetFallbackStoresForTests();
    DccSettlementEngine.resetFallbackStoreForTests();

    const adapter = new RezdyAdapter({
      endpoint: sim.baseUrl,
      apiKey: sim.apiKey,
      platform: "rezdy",
      operatorSlug: "gosno",
      isSandbox: true,
    });

    DccBookingService.registerPilotSupplierConnection({
      id: "conn_gosno_rezdy",
      operatorSlug: "gosno",
      operatorName: "GoSno Mountain Transportation",
      endpoint: sim.baseUrl,
      reservationPlatform: "rezdy",
      commissionPercent: 10.0,
      apiKey: sim.apiKey,
      isSandbox: true,
      connectionStatus: "sandbox_verified",
      adapter,
    });

    const slotBreck = formatCanonicalRezdySlotId("P7477S", 497020486, "2026-11-12T10:53:00");
    const hold = await DccBookingService.createHold({
      supplierConnectionId: "conn_gosno_rezdy",
      productId: "dcc:gosno:den-breckenridge:suv",
      optionId: "opt_suburban_69029050",
      availabilityId: slotBreck,
      expirationMinutes: 15,
      unitItems: [{ unitId: "unit_suburban_69029050", quantity: 1 }],
      contact: {
        firstName: "Elena",
        lastName: "Vance",
        fullName: "Elena Vance",
        emailAddress: "elena.vance@example.com",
        phoneNumber: "+1-303-555-0191",
      },
    });

    assert.deepEqual(hold.lifecycleStates, {
      bookingStatus: "ON_HOLD",
      paymentStatus: "unpaid",
      serviceCompletionStatus: "scheduled",
      commissionEligibilityStatus: "ineligible_unconfirmed",
      cancellationStatus: "active",
      refundStatus: "none",
    });

    // 1. Attempting to claim paymentStatus: "captured" without verifiedPaymentEvidence MUST fail with 422 UNVERIFIED_PAYMENT_EVIDENCE
    await assert.rejects(
      () =>
        DccBookingService.confirmReservation({
          bookingId: hold.dccBookingId,
          contact: {
            firstName: "Elena",
            lastName: "Vance",
            fullName: "Elena Vance",
            emailAddress: "elena.vance@example.com",
          },
          payment: {
            isPrepaid: true,
            amount: 399,
            currency: "USD",
            status: "captured",
          },
        }),
      (err: unknown) =>
        err instanceof OctoApiError &&
        err.status === 422 &&
        err.code === "UNVERIFIED_PAYMENT_EVIDENCE"
    );

    // 2. Attempting to pass unverified or mismatched payment evidence MUST fail with 422
    await assert.rejects(
      () =>
        DccBookingService.confirmReservation({
          bookingId: hold.dccBookingId,
          contact: {
            firstName: "Elena",
            lastName: "Vance",
            fullName: "Elena Vance",
            emailAddress: "elena.vance@example.com",
          },
          verifiedPaymentEvidence: {
            verified: true,
            provider: "square",
            transactionId: "sq_wrong_amt",
            capturedAmount: 100, // Mismatches $399
            currency: "USD",
            capturedAt: "2026-10-30T12:00:00.000Z",
          },
        }),
      (err: unknown) =>
        err instanceof OctoApiError &&
        err.status === 422 &&
        err.code === "UNVERIFIED_PAYMENT_EVIDENCE"
    );

    // 3. Confirming reservation WITHOUT payment evidence keeps paymentStatus: "unpaid" and commissionEligibilityStatus: "ineligible_unpaid"
    const confirmedUnpaid = await DccBookingService.confirmReservation({
      bookingId: hold.dccBookingId,
      contact: {
        firstName: "Elena",
        lastName: "Vance",
        fullName: "Elena Vance",
        emailAddress: "elena.vance@example.com",
        phoneNumber: "+1-303-555-0191",
      },
    });

    assert.equal(confirmedUnpaid.status, "CONFIRMED");
    assert.deepEqual(confirmedUnpaid.lifecycleStates, {
      bookingStatus: "CONFIRMED",
      paymentStatus: "unpaid",
      serviceCompletionStatus: "scheduled",
      commissionEligibilityStatus: "ineligible_unpaid",
      cancellationStatus: "active",
      refundStatus: "none",
    });

    const ledgerUnpaid = await DccSettlementEngine.getSettlementEntry(hold.dccBookingId);
    assert.ok(ledgerUnpaid);
    assert.equal(ledgerUnpaid.paymentStatus, "unpaid");
    assert.equal(ledgerUnpaid.capturedAmount, 0);
    assert.equal(ledgerUnpaid.settlementStatus, "awaiting_payment");
    assert.equal(ledgerUnpaid.commissionEligibilityStatus, "ineligible_unpaid");
    assert.equal(ledgerUnpaid.dccShareAmount, 0);
    assert.equal(ledgerUnpaid.operatorShareAmount, 0);

    // Upstream Rezdy order has no payments recorded when confirmed unpaid
    assert.equal(sim.getOrders()[0].payments?.length || 0, 0);
    assert.equal(sim.getOrders()[0].totalPaid, 0);
    assert.equal(sim.getOrders()[0].totalDue, 399);

    // 4. Marking service completed while still unpaid does NOT make commission eligible
    const completedWhileUnpaid = await DccBookingService.markServiceCompleted(hold.dccBookingId);
    assert.equal(completedWhileUnpaid.lifecycleStates?.serviceCompletionStatus, "completed");
    assert.equal(
      completedWhileUnpaid.lifecycleStates?.commissionEligibilityStatus,
      "ineligible_unpaid"
    );
    const ledgerCompletedUnpaid = await DccSettlementEngine.getSettlementEntry(hold.dccBookingId);
    assert.equal(ledgerCompletedUnpaid?.commissionEligibilityStatus, "ineligible_unpaid");
    assert.equal(ledgerCompletedUnpaid?.settlementStatus, "awaiting_payment");

    // 5. Supplying verifiedPaymentEvidence transitions paymentStatus to "captured" and (since service is completed) commissionEligibilityStatus to "eligible"
    const afterCapture = await DccBookingService.recordVerifiedPaymentCapture(hold.dccBookingId, {
      verified: true,
      provider: "square",
      transactionId: "sq_pay_elena_399",
      capturedAmount: 399,
      currency: "USD",
      capturedAt: "2026-10-30T12:05:00.000Z",
    });
    assert.equal(afterCapture.lifecycleStates?.paymentStatus, "captured");
    assert.equal(afterCapture.lifecycleStates?.commissionEligibilityStatus, "eligible");

    const ledgerEligible = await DccSettlementEngine.getSettlementEntry(hold.dccBookingId);
    assert.ok(ledgerEligible);
    assert.equal(ledgerEligible.paymentStatus, "captured");
    assert.equal(ledgerEligible.capturedAmount, 399);
    assert.equal(ledgerEligible.dccSharePercent, 10);
    assert.equal(ledgerEligible.dccShareAmount, 39.9);
    assert.equal(ledgerEligible.operatorShareAmount, 359.1);
    assert.equal(ledgerEligible.commissionEligibilityStatus, "eligible");
    assert.equal(ledgerEligible.settlementStatus, "ready_for_payout");

    // 6. Verify cancellation does NOT automatically mean a full refund occurred:
    // Case A: Captured booking cancelled without verifiedRefundEvidence -> stays paymentStatus: "captured", refundStatus: "pending_refund"
    const slotVail = formatCanonicalRezdySlotId("PXFGPP", 498001122, "2026-11-12T11:00:00");
    const holdVail = await DccBookingService.createHold({
      supplierConnectionId: "conn_gosno_rezdy",
      productId: "dcc:gosno:den-vail:suv",
      optionId: "opt_suburban_75298226",
      availabilityId: slotVail,
      expirationMinutes: 15,
      unitItems: [{ unitId: "unit_suburban_75298226", quantity: 1 }],
      contact: {
        firstName: "Marcus",
        lastName: "Cole",
        fullName: "Marcus Cole",
        emailAddress: "marcus.cole@example.com",
        phoneNumber: "+1-303-555-0192",
      },
    });

    await DccBookingService.confirmReservation({
      bookingId: holdVail.dccBookingId,
      contact: {
        firstName: "Marcus",
        lastName: "Cole",
        fullName: "Marcus Cole",
        emailAddress: "marcus.cole@example.com",
        phoneNumber: "+1-303-555-0192",
      },
      verifiedPaymentEvidence: {
        verified: true,
        provider: "square",
        transactionId: "sq_pay_marcus_499",
        capturedAmount: 499,
        currency: "USD",
        capturedAt: "2026-10-30T12:10:00.000Z",
      },
    });

    const cancelledNoRefundYet = await DccBookingService.cancelBooking(holdVail.dccBookingId, {
      reason: "Customer cancelled; refund under review",
    });
    assert.equal(cancelledNoRefundYet.status, "CANCELLED");
    assert.equal(cancelledNoRefundYet.lifecycleStates?.cancellationStatus, "cancelled");
    assert.equal(
      cancelledNoRefundYet.lifecycleStates?.paymentStatus,
      "captured",
      "Cancellation without refund evidence must NOT mark payment as refunded"
    );
    assert.equal(cancelledNoRefundYet.lifecycleStates?.refundStatus, "pending_refund");
    assert.equal(
      cancelledNoRefundYet.lifecycleStates?.commissionEligibilityStatus,
      "ineligible_cancelled"
    );

    const ledgerPendingRefund = await DccSettlementEngine.getSettlementEntry(holdVail.dccBookingId);
    assert.ok(ledgerPendingRefund);
    assert.equal(ledgerPendingRefund.paymentStatus, "captured");
    assert.equal(ledgerPendingRefund.refundStatus, "pending_refund");
    assert.equal(ledgerPendingRefund.settlementStatus, "cancelled_pending_refund");
    assert.equal(ledgerPendingRefund.refundedAmount, 0);

    // Case B: Partial refund with verifiedRefundEvidence ($200 refunded of $499, $299 retained)
    const afterPartialRefund = await DccBookingService.recordVerifiedRefund(
      holdVail.dccBookingId,
      {
        verified: true,
        provider: "square",
        refundId: "sq_ref_partial_200",
        refundType: "partial",
        refundedAmount: 200,
        currency: "USD",
        refundedAt: "2026-10-30T12:12:00.000Z",
        reason: "Partial refund per winter cancellation window",
      }
    );
    assert.equal(afterPartialRefund.lifecycleStates?.paymentStatus, "partially_refunded");
    assert.equal(afterPartialRefund.lifecycleStates?.refundStatus, "partial_refund");

    const ledgerPartialRefund = await DccSettlementEngine.getSettlementEntry(holdVail.dccBookingId);
    assert.ok(ledgerPartialRefund);
    assert.equal(ledgerPartialRefund.paymentStatus, "partially_refunded");
    assert.equal(ledgerPartialRefund.refundStatus, "partial_refund");
    assert.equal(ledgerPartialRefund.settlementStatus, "adjusted");
    assert.equal(ledgerPartialRefund.refundedAmount, 200);
    assert.equal(ledgerPartialRefund.dccShareAmount, 29.9); // 10% of $299 retained
    assert.equal(ledgerPartialRefund.operatorShareAmount, 269.1); // 90% of $299 retained

    // Case C: Full refund with verifiedRefundEvidence ($499 refunded of $499)
    const afterFullRefund = await DccBookingService.recordVerifiedRefund(holdVail.dccBookingId, {
      verified: true,
      provider: "square",
      refundId: "sq_ref_full_499",
      refundType: "full",
      refundedAmount: 499,
      currency: "USD",
      refundedAt: "2026-10-30T12:15:00.000Z",
      reason: "Full refund authorized",
    });
    assert.equal(afterFullRefund.lifecycleStates?.paymentStatus, "refunded");
    assert.equal(afterFullRefund.lifecycleStates?.refundStatus, "full_refund");

    const ledgerFullRefund = await DccSettlementEngine.getSettlementEntry(holdVail.dccBookingId);
    assert.ok(ledgerFullRefund);
    assert.equal(ledgerFullRefund.paymentStatus, "refunded");
    assert.equal(ledgerFullRefund.refundStatus, "full_refund");
    assert.equal(ledgerFullRefund.settlementStatus, "reversed");
    assert.equal(ledgerFullRefund.dccShareAmount, 0);
    assert.equal(ledgerFullRefund.operatorShareAmount, 0);

    // Case D: Unpaid booking cancelled -> refundStatus: "not_applicable_unpaid"
    const slotSnowmass = formatCanonicalRezdySlotId("PEAVH0", 499002233, "2026-11-15T10:00:00");
    const holdUnpaid = await DccBookingService.createHold({
      supplierConnectionId: "conn_gosno_rezdy",
      productId: "dcc:gosno:snowmass-den:suv",
      optionId: "opt_group_76622153",
      availabilityId: slotSnowmass,
      expirationMinutes: 15,
      unitItems: [{ unitId: "unit_group_76622153", quantity: 1 }],
      contact: {
        firstName: "Nora",
        lastName: "Bell",
        fullName: "Nora Bell",
        emailAddress: "nora.bell@example.com",
      },
    });
    const cancelledUnpaid = await DccBookingService.cancelBooking(
      holdUnpaid.dccBookingId,
      "Customer released unpaid hold"
    );
    assert.equal(cancelledUnpaid.lifecycleStates?.paymentStatus, "unpaid");
    assert.equal(cancelledUnpaid.lifecycleStates?.refundStatus, "not_applicable_unpaid");
    assert.equal(cancelledUnpaid.lifecycleStates?.cancellationStatus, "cancelled");
  } finally {
    await sim.close();
    if (prevDbUrl !== undefined) process.env.DATABASE_URL = prevDbUrl;
    else delete process.env.DATABASE_URL;
  }
});

test("Gate 3: Native Rezdy Full-Object Booking Updates (Retrieve -> Preserve Items, Participants, Custom Fields, Pickup -> PUT)", async () => {
  const prevDbUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "";
  const sim = await startLocalRezdyV1Simulator();

  try {
    DccBookingService.clearPilotSupplierConnections();
    DccBookingService.resetFallbackStoresForTests();

    const adapter = new RezdyAdapter({
      endpoint: sim.baseUrl,
      apiKey: sim.apiKey,
      platform: "rezdy",
      operatorSlug: "gosno",
      isSandbox: true,
    });

    DccBookingService.registerPilotSupplierConnection({
      id: "conn_gosno_rezdy",
      operatorSlug: "gosno",
      operatorName: "GoSno Mountain Transportation",
      endpoint: sim.baseUrl,
      reservationPlatform: "rezdy",
      commissionPercent: 10.0,
      apiKey: sim.apiKey,
      isSandbox: true,
      connectionStatus: "sandbox_verified",
      adapter,
    });

    const slotId = formatCanonicalRezdySlotId("P7477S", 497020486, "2026-11-12T10:53:00");
    const hold = await DccBookingService.createHold({
      supplierConnectionId: "conn_gosno_rezdy",
      productId: "dcc:gosno:den-breckenridge:suv",
      optionId: "opt_suburban_69029050",
      availabilityId: slotId,
      expirationMinutes: 15,
      unitItems: [{ unitId: "unit_suburban_69029050", quantity: 1 }],
      contact: {
        firstName: "Claire",
        lastName: "Redfield",
        fullName: "Claire Redfield",
        emailAddress: "claire.redfield@example.com",
        phoneNumber: "+1-303-555-0177",
      },
      pickupLocation: {
        pickupId: "den_east_level_5",
        locationName: "DEN East Terminal Level 5 Island 1",
        address: "8500 Pena Blvd, Denver, CO 80249",
        pickupTime: "2026-11-12 10:53:00",
        pickupInstructions: "Meet by Door 513",
      },
      customFields: [
        { label: "Airline & Flight Number", value: "DL 2041" },
        { label: "Child Booster Seats", value: "1" },
      ],
      participants: [
        [
          { label: "First Name", value: "Claire" },
          { label: "Last Name", value: "Redfield" },
        ],
        [
          { label: "First Name", value: "Chris" },
          { label: "Last Name", value: "Redfield" },
        ],
      ],
      notes: "Initial hold notes",
    });

    assert.equal(hold.supplierReference, "RZSIM1001");

    // 1. Verify simulator rejects a partial PUT that omits items/quantities (enforcing Rezdy v1 full-object contract)
    const partialPutRes = await fetch(
      `${sim.baseUrl}/bookings/RZSIM1001?apiKey=${encodeURIComponent(sim.apiKey)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CONFIRMED",
          customer: {
            firstName: "Claire",
            lastName: "Redfield",
            email: "claire.redfield@example.com",
          },
          // items omitted!
        }),
      }
    );
    assert.equal(partialPutRes.status, 400);
    const partialPutBody = await partialPutRes.json();
    assert.equal(partialPutBody.requestStatus.error.errorCode, "MISSING_FULL_BOOKING_OBJECT");

    // 2. Update booking via DccBookingService.updateBooking (which performs GET -> preserve -> PUT)
    const updated = await DccBookingService.updateBooking(hold.dccBookingId, {
      contact: {
        firstName: "Claire",
        lastName: "Redfield",
        fullName: "Claire Redfield",
        emailAddress: "claire.redfield@example.com",
        phoneNumber: "+1-303-555-0199", // Updated phone
      },
      customFields: [
        { label: "Airline & Flight Number", value: "DL 2099 (Rebooked)" },
        { label: "Special Request", value: "Roof box for skis" },
      ],
      notes: "Updated arrival flight",
    });

    const upstreamOrder = sim.getOrderByNumber("RZSIM1001");
    assert.ok(upstreamOrder);
    // Items and quantities preserved intact
    assert.equal(upstreamOrder.items.length, 1);
    assert.equal(upstreamOrder.items[0].productCode, "P7477S");
    assert.equal(upstreamOrder.items[0].startTimeLocal, "2026-11-12 10:53:00");
    assert.deepEqual(upstreamOrder.items[0].quantities, [
      {
        optionLabel: "Suburban",
        optionPrice: 399,
        value: 1,
        priceGroupType: "EACH",
      },
    ]);
    // Participants preserved intact
    assert.equal(upstreamOrder.items[0].participants?.length, 2);
    assert.deepEqual(upstreamOrder.items[0].participants?.[0], [
      { label: "First Name", value: "Claire" },
      { label: "Last Name", value: "Redfield" },
    ]);
    // Pickup details preserved intact
    assert.equal(upstreamOrder.items[0].pickupId, "den_east_level_5");
    assert.equal(
      upstreamOrder.items[0].pickupLocation?.locationName,
      "DEN East Terminal Level 5 Island 1"
    );
    assert.equal(upstreamOrder.items[0].pickupLocation?.pickupInstructions, "Meet by Door 513");
    // Custom fields preserved + merged
    assert.deepEqual(upstreamOrder.fields, [
      { label: "Airline & Flight Number", value: "DL 2099 (Rebooked)" },
      { label: "Child Booster Seats", value: "1" },
      { label: "Special Request", value: "Roof box for skis" },
    ]);
    // Customer phone updated while preserving name & email
    assert.equal(upstreamOrder.customer.phone, "+1-303-555-0199");
    assert.equal(updated.contact?.phoneNumber, "+1-303-555-0199");
  } finally {
    await sim.close();
    if (prevDbUrl !== undefined) process.env.DATABASE_URL = prevDbUrl;
    else delete process.env.DATABASE_URL;
  }
});

test("Gate 4: No Invented Booking Details and Stateless Execution Across Independent Server/Adapter Instances", async () => {
  const prevDbUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "";
  const sim = await startLocalRezdyV1Simulator();
  const tempStoreFile = path.join(
    os.tmpdir(),
    `dcc-stateless-booking-store-${Date.now()}-${Math.random().toString(16).slice(2)}.json`
  );

  try {
    DccBookingService.clearPilotSupplierConnections();
    DccBookingService.resetFallbackStoresForTests();
    DccBookingService.setDurableBookingStorePathForTests(tempStoreFile);

    const makeFreshAdapter = () =>
      new RezdyAdapter({
        endpoint: sim.baseUrl,
        apiKey: sim.apiKey,
        platform: "rezdy",
        operatorSlug: "gosno",
        isSandbox: true,
      });

    // 1. Missing/unmapped product must throw 400/404 (never falls back to P7477S or $399)
    await assert.rejects(
      () => makeFreshAdapter().getProduct("dcc:gosno:invented-nonexistent-route"),
      (err: unknown) => err instanceof OctoApiError && err.status === 404
    );

    const canonicalSlot = formatCanonicalRezdySlotId("P7477S", 497020486, "2026-11-12T10:53:00");
    await assert.rejects(
      () =>
        makeFreshAdapter().createBookingHold({
          uuid: "unmapped-prod-uuid",
          productId: "dcc:gosno:invented-nonexistent-route",
          optionId: "opt_suburban_69029050",
          availabilityId: canonicalSlot,
          expirationMinutes: 15,
          unitItems: [{ unitId: "unit_suburban_69029050", quantity: 1 }],
          contact: {
            firstName: "Real",
            lastName: "Customer",
            emailAddress: "real@example.com",
          },
        }),
      (err: unknown) =>
        err instanceof OctoApiError &&
        err.status === 400 &&
        err.code === "UNMAPPED_PRODUCT_ID"
    );

    // 2. Date-only availabilityId without departure time or canonical session locator must throw 400 MISSING_REQUIRED_AVAILABILITY_LOCATOR (never invents 10:00:00)
    await assert.rejects(
      () =>
        makeFreshAdapter().createBookingHold({
          uuid: "no-time-uuid",
          productId: "dcc:gosno:den-breckenridge:suv",
          optionId: "opt_suburban_69029050",
          availabilityId: "2026-11-12", // Date only — no time or session locator!
          expirationMinutes: 15,
          unitItems: [{ unitId: "unit_suburban_69029050", quantity: 1 }],
          contact: {
            firstName: "Real",
            lastName: "Customer",
            emailAddress: "real@example.com",
          },
        }),
      (err: unknown) =>
        err instanceof OctoApiError &&
        err.status === 400 &&
        (err.code === "MISSING_EXPLICIT_DEPARTURE_TIME" ||
          err.code === "MISSING_REQUIRED_AVAILABILITY_LOCATOR")
    );

    // 3. Bare numeric session ID without a fresh adapter cache returns null from parseStatelessRezdyAvailabilityLocator and throws 400 on createBookingHold (never falls back to in-memory cache or 10:00:00)
    assert.equal(parseStatelessRezdyAvailabilityLocator("497020486"), null);

    // 4. Missing customer contact on createBookingHold must throw 400 MISSING_CUSTOMER_DETAILS (never invents DCC ReservationHold / traveler@example.com)
    await assert.rejects(
      () =>
        makeFreshAdapter().createBookingHold({
          uuid: "no-contact-uuid",
          productId: "dcc:gosno:den-breckenridge:suv",
          optionId: "opt_suburban_69029050",
          availabilityId: canonicalSlot,
          expirationMinutes: 15,
          unitItems: [{ unitId: "unit_suburban_69029050", quantity: 1 }],
          // contact omitted!
        }),
      (err: unknown) =>
        err instanceof OctoApiError &&
        err.status === 400 &&
        err.code === "MISSING_CUSTOMER_DETAILS"
    );

    // 5. Execute the 5-step flow across 5 completely separate RezdyAdapter instances and cleared in-memory stores
    // Instance 1: checkAvailability returns canonical self-contained slot ID
    const adapterInstance1 = makeFreshAdapter();
    const availSlots = await adapterInstance1.checkAvailability(
      "dcc:gosno:den-breckenridge:suv",
      "opt_suburban_69029050",
      "2026-11-12",
      [{ unitId: "unit_suburban_69029050", quantity: 1 }]
    );
    assert.equal(availSlots.length, 1);
    assert.equal(availSlots[0].id, canonicalSlot);
    assert.equal(availSlots[0].localDateTimeStart, "2026-11-12 10:53:00");

    // Instance 2: createHold on a brand-new adapter instance with zero shared state from Instance 1
    DccBookingService.clearInMemoryStoresOnlyForTests();
    DccBookingService.registerPilotSupplierConnection({
      id: "conn_gosno_rezdy",
      operatorSlug: "gosno",
      operatorName: "GoSno Mountain Transportation",
      endpoint: sim.baseUrl,
      reservationPlatform: "rezdy",
      commissionPercent: 10.0,
      apiKey: sim.apiKey,
      isSandbox: true,
      connectionStatus: "sandbox_verified",
      adapter: makeFreshAdapter(),
    });

    const hold = await DccBookingService.createHold({
      supplierConnectionId: "conn_gosno_rezdy",
      productId: "dcc:gosno:den-breckenridge:suv",
      optionId: "opt_suburban_69029050",
      availabilityId: availSlots[0].id,
      expirationMinutes: 15,
      unitItems: [{ unitId: "unit_suburban_69029050", quantity: 1 }],
      contact: {
        firstName: "Hannah",
        lastName: "Abbott",
        fullName: "Hannah Abbott",
        emailAddress: "hannah.abbott@example.com",
        phoneNumber: "+1-303-555-0188",
      },
    });
    assert.equal(hold.status, "ON_HOLD");
    assert.equal(hold.supplierReference, "RZSIM1001");

    // Instance 3: updateBooking on a brand-new adapter instance after clearing in-memory stores
    DccBookingService.clearInMemoryStoresOnlyForTests();
    DccBookingService.registerPilotSupplierConnection({
      id: "conn_gosno_rezdy",
      operatorSlug: "gosno",
      operatorName: "GoSno Mountain Transportation",
      endpoint: sim.baseUrl,
      reservationPlatform: "rezdy",
      commissionPercent: 10.0,
      apiKey: sim.apiKey,
      isSandbox: true,
      connectionStatus: "sandbox_verified",
      adapter: makeFreshAdapter(),
    });

    const updated = await DccBookingService.updateBooking(hold.dccBookingId, {
      customFields: [{ label: "Flight Number", value: "F9 402" }],
    });
    assert.equal(
      updated.customFields?.find((f) => f.label === "Barcode")?.value,
      "RZSIM1001"
    );
    assert.equal(
      updated.customFields?.find((f) => f.label === "Flight Number")?.value,
      "F9 402"
    );

    // Instance 4: confirmReservation on a brand-new adapter instance after clearing in-memory stores
    DccBookingService.clearInMemoryStoresOnlyForTests();
    DccBookingService.registerPilotSupplierConnection({
      id: "conn_gosno_rezdy",
      operatorSlug: "gosno",
      operatorName: "GoSno Mountain Transportation",
      endpoint: sim.baseUrl,
      reservationPlatform: "rezdy",
      commissionPercent: 10.0,
      apiKey: sim.apiKey,
      isSandbox: true,
      connectionStatus: "sandbox_verified",
      adapter: makeFreshAdapter(),
    });

    const confirmed = await DccBookingService.confirmReservation({
      bookingId: hold.dccBookingId,
      contact: {
        firstName: "Hannah",
        lastName: "Abbott",
        fullName: "Hannah Abbott",
        emailAddress: "hannah.abbott@example.com",
        phoneNumber: "+1-303-555-0188",
      },
      verifiedPaymentEvidence: {
        verified: true,
        provider: "square",
        transactionId: "sq_stateless_399",
        capturedAmount: 399,
        currency: "USD",
        capturedAt: "2026-10-30T12:20:00.000Z",
      },
    });
    assert.equal(confirmed.status, "CONFIRMED");

    // Instance 5: cancelBooking on a brand-new adapter instance after clearing in-memory stores
    DccBookingService.clearInMemoryStoresOnlyForTests();
    DccBookingService.registerPilotSupplierConnection({
      id: "conn_gosno_rezdy",
      operatorSlug: "gosno",
      operatorName: "GoSno Mountain Transportation",
      endpoint: sim.baseUrl,
      reservationPlatform: "rezdy",
      commissionPercent: 10.0,
      apiKey: sim.apiKey,
      isSandbox: true,
      connectionStatus: "sandbox_verified",
      adapter: makeFreshAdapter(),
    });

    const cancelled = await DccBookingService.cancelBooking(hold.dccBookingId, {
      reason: "Stateless cross-instance cancellation test",
    });
    assert.equal(cancelled.status, "CANCELLED");
  } finally {
    DccBookingService.setDurableBookingStorePathForTests(null);
    if (fs.existsSync(tempStoreFile)) {
      fs.unlinkSync(tempStoreFile);
    }
    await sim.close();
    if (prevDbUrl !== undefined) process.env.DATABASE_URL = prevDbUrl;
    else delete process.env.DATABASE_URL;
  }
});

test("Gate 5: Truthful Availability States (Quote-Only, No Sessions, Sold Out), Strict Status Mapping, and Deterministic Hold Expiry", async () => {
  const prevDbUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "";
  const sim = await startLocalRezdyV1Simulator();

  try {
    DccBookingService.clearPilotSupplierConnections();
    DccBookingService.resetFallbackStoresForTests();

    const adapter = new RezdyAdapter({
      endpoint: sim.baseUrl,
      apiKey: sim.apiKey,
      platform: "rezdy",
      operatorSlug: "gosno",
      isSandbox: true,
    });

    DccBookingService.registerPilotSupplierConnection({
      id: "conn_gosno_rezdy",
      operatorSlug: "gosno",
      operatorName: "GoSno Mountain Transportation",
      endpoint: sim.baseUrl,
      reservationPlatform: "rezdy",
      commissionPercent: 10.0,
      apiKey: sim.apiKey,
      isSandbox: true,
      connectionStatus: "sandbox_verified",
      adapter,
    });

    // 1. Quote-only product (PKQDPG) returns [] from adapter.checkAvailability and status: "QUOTE_ONLY" from DccBookingService (NEVER "SOLD_OUT" or "10:00:00")
    const rawQuoteOnlySlots = await adapter.checkAvailability(
      "dcc:gosno:den-breckenridge:van",
      "opt_van_73379226",
      "2026-12-15",
      [{ unitId: "unit_van_73379226", quantity: 1 }]
    );
    assert.deepEqual(rawQuoteOnlySlots, []);

    const svcQuoteOnly = await DccBookingService.checkAvailability(
      "dcc:gosno:den-breckenridge:van",
      "opt_van_73379226",
      "2026-12-15",
      [{ unitId: "unit_van_73379226", quantity: 1 }]
    );
    assert.equal(svcQuoteOnly.available, false);
    assert.equal(svcQuoteOnly.bookable, false);
    assert.equal(svcQuoteOnly.status, "QUOTE_ONLY");
    assert.equal(svcQuoteOnly.quoteOnly, true);
    assert.equal(svcQuoteOnly.localDateTimeStart, null);

    // 2. Date with no returned sessions (2026-12-15 on P7477S) returns [] from adapter and status: "NO_SESSIONS" from DccBookingService (NEVER "SOLD_OUT" or "10:00:00")
    const rawNoSessionSlots = await adapter.checkAvailability(
      "dcc:gosno:den-breckenridge:suv",
      "opt_suburban_69029050",
      "2026-12-15",
      [{ unitId: "unit_suburban_69029050", quantity: 1 }]
    );
    assert.deepEqual(rawNoSessionSlots, []);

    const svcNoSessions = await DccBookingService.checkAvailability(
      "dcc:gosno:den-breckenridge:suv",
      "opt_suburban_69029050",
      "2026-12-15",
      [{ unitId: "unit_suburban_69029050", quantity: 1 }]
    );
    assert.equal(svcNoSessions.available, false);
    assert.equal(svcNoSessions.bookable, false);
    assert.equal(svcNoSessions.status, "NO_SESSIONS");
    assert.equal(svcNoSessions.quoteOnly, false);
    assert.equal(svcNoSessions.localDateTimeStart, null);

    // 3. Actual sold-out session (507139971 on 2026-12-14 with seatsAvailable: 0) returns status: "SOLD_OUT" with its real timestamp 2026-12-14 15:05:00
    const svcSoldOut = await DccBookingService.checkAvailability(
      "dcc:gosno:den-breckenridge:suv",
      "opt_suburban_69029050",
      "2026-12-14",
      [{ unitId: "unit_suburban_69029050", quantity: 1 }]
    );
    assert.equal(svcSoldOut.available, false);
    assert.equal(svcSoldOut.bookable, false);
    assert.equal(svcSoldOut.status, "SOLD_OUT");
    assert.equal(svcSoldOut.vacancies, 0);
    assert.equal(svcSoldOut.localDateTimeStart, "2026-12-14 15:05:00");

    // 4. Unfamiliar booking statuses MUST NOT map to ON_HOLD; they must throw 502 UNRECOGNIZED_REZDY_BOOKING_STATUS
    assert.equal(mapRezdyStatusToOctoStatus("PROCESSING", "RZSIM1001"), "ON_HOLD");
    assert.equal(mapRezdyStatusToOctoStatus("ON_HOLD", "RZSIM1001"), "ON_HOLD");
    assert.equal(mapRezdyStatusToOctoStatus("NEW", "RZSIM1001"), "ON_HOLD");
    assert.equal(mapRezdyStatusToOctoStatus("WAITING_SUPPLIER", "RZSIM1001"), "PENDING");
    assert.equal(mapRezdyStatusToOctoStatus("CONFIRMED", "RZSIM1001"), "CONFIRMED");
    assert.equal(mapRezdyStatusToOctoStatus("CANCELLED", "RZSIM1001"), "CANCELLED");
    assert.equal(mapRezdyStatusToOctoStatus("ABANDONED", "RZSIM1001"), "EXPIRED");

    assert.throws(
      () => mapRezdyStatusToOctoStatus("UNKNOWN_VENDOR_STATUS_XYZ", "RZSIM1001"),
      (err: unknown) =>
        err instanceof OctoApiError &&
        err.status === 502 &&
        err.code === "UNRECOGNIZED_REZDY_BOOKING_STATUS"
    );

    // 5. Hold expiry is deterministic from dateCreated and never generates a fresh 15-minute expiry when getBooking is called
    const slotId = formatCanonicalRezdySlotId("P7477S", 497020486, "2026-11-12T10:53:00");
    const hold = await DccBookingService.createHold({
      supplierConnectionId: "conn_gosno_rezdy",
      productId: "dcc:gosno:den-breckenridge:suv",
      optionId: "opt_suburban_69029050",
      availabilityId: slotId,
      expirationMinutes: 15,
      unitItems: [{ unitId: "unit_suburban_69029050", quantity: 1 }],
      contact: {
        firstName: "Arthur",
        lastName: "Dent",
        fullName: "Arthur Dent",
        emailAddress: "arthur.dent@example.com",
      },
    });
    assert.ok(hold.utcHoldExpires);

    // Set upstream order's dateCreated to a fixed timestamp 5 minutes ago
    const fixedCreatedIso = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const expectedExpiresIso = new Date(
      Date.parse(fixedCreatedIso) + 15 * 60 * 1000
    ).toISOString();
    sim.mutateOrderForTest("RZSIM1001", (ord) => {
      ord.dateCreated = fixedCreatedIso;
    });

    const fetched1 = await adapter.getBooking("RZSIM1001");
    await new Promise((r) => setTimeout(r, 30));
    const fetched2 = await adapter.getBooking("RZSIM1001");

    assert.equal(fetched1.utcHoldExpires, expectedExpiresIso);
    assert.equal(
      fetched2.utcHoldExpires,
      expectedExpiresIso,
      "getBooking must never generate a fresh 15-minute hold expiry on retrieval"
    );
  } finally {
    await sim.close();
    if (prevDbUrl !== undefined) process.env.DATABASE_URL = prevDbUrl;
    else delete process.env.DATABASE_URL;
  }
});

test("Gate 6: Complete Flow Verification — Concurrent Duplicates, Retry After Dropped Response, Expired Hold, Provider Timeout, and Persistence Failure Rollback", async () => {
  const prevDbUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "";
  const sim = await startLocalRezdyV1Simulator();

  try {
    DccBookingService.clearPilotSupplierConnections();
    DccBookingService.resetFallbackStoresForTests();
    DccSettlementEngine.resetFallbackStoreForTests();
    resetCommercialMemoryStoreForTests();

    const adapter = new RezdyAdapter({
      endpoint: sim.baseUrl,
      apiKey: sim.apiKey,
      platform: "rezdy",
      operatorSlug: "gosno",
      isSandbox: true,
    });

    DccBookingService.registerPilotSupplierConnection({
      id: "conn_gosno_rezdy",
      operatorSlug: "gosno",
      operatorName: "GoSno Mountain Transportation",
      endpoint: sim.baseUrl,
      reservationPlatform: "rezdy",
      commissionPercent: 10.0,
      apiKey: sim.apiKey,
      isSandbox: true,
      connectionStatus: "sandbox_verified",
      adapter,
    });

    // 1. Concurrent Duplicate Protection: 5 simultaneous Promise.all createHold calls with the same idempotencyKey
    const slotBreck = formatCanonicalRezdySlotId("P7477S", 497020486, "2026-11-12T10:53:00");
    const concurrentResults = await Promise.all(
      Array.from({ length: 5 }, () =>
        DccBookingService.createHold({
          supplierConnectionId: "conn_gosno_rezdy",
          productId: "dcc:gosno:den-breckenridge:suv",
          optionId: "opt_suburban_69029050",
          availabilityId: slotBreck,
          expirationMinutes: 15,
          unitItems: [{ unitId: "unit_suburban_69029050", quantity: 1 }],
          idempotencyKey: "idem_concurrent_burst_001",
          contact: {
            firstName: "Concurrent",
            lastName: "Traveler",
            fullName: "Concurrent Traveler",
            emailAddress: "concurrent@example.com",
          },
        })
      )
    );

    const uniqueBookingIds = new Set(concurrentResults.map((r) => r.dccBookingId));
    assert.equal(uniqueBookingIds.size, 1, "All 5 concurrent calls must resolve to the same DCC booking ID");
    assert.equal(sim.getOrders().length, 1, "Only 1 upstream Rezdy order may be created across 5 concurrent requests");
    const postBookingLogs = sim
      .getServerLogs()
      .filter((l) => l.method === "POST" && l.path === "/v1/bookings");
    assert.equal(postBookingLogs.length, 1, "Exactly 1 POST /v1/bookings call must hit the server");

    // 2. Retry Recovery After Dropped HTTP Response (server committed order RZSIM1002, response dropped with 502)
    // RezdyAdapter automatically reconciles via GET /v1/bookings?resellerReference=... on the dropped response,
    // AND a subsequent retry on a brand-new adapter instance also recovers RZSIM1002 without posting a second order.
    const slotVail = formatCanonicalRezdySlotId("PXFGPP", 498001122, "2026-11-12T11:00:00");
    sim.setFaultInjection({ dropNextPostBookingAfterCommit: true });

    const autoReconciledHold = await adapter.createBookingHold(
      {
        uuid: "drop-test-uuid-1",
        productId: "dcc:gosno:den-vail:suv",
        optionId: "opt_suburban_75298226",
        availabilityId: slotVail,
        expirationMinutes: 15,
        unitItems: [{ unitId: "unit_suburban_75298226", quantity: 1 }],
        contact: {
          firstName: "Retry",
          lastName: "Traveler",
          emailAddress: "retry@example.com",
        },
      },
      "idem_dropped_response_002"
    );
    assert.equal(autoReconciledHold.supplierReference, "RZSIM1002");
    assert.equal(sim.getOrders().length, 2);

    // Retrying with the same idempotencyKey on a fresh adapter reconciles via GET /v1/bookings?resellerReference=... without creating a duplicate order
    const retryAdapter = new RezdyAdapter({
      endpoint: sim.baseUrl,
      apiKey: sim.apiKey,
      platform: "rezdy",
      operatorSlug: "gosno",
      isSandbox: true,
    });
    const recoveredHold = await retryAdapter.createBookingHold(
      {
        uuid: "drop-test-uuid-2",
        productId: "dcc:gosno:den-vail:suv",
        optionId: "opt_suburban_75298226",
        availabilityId: slotVail,
        expirationMinutes: 15,
        unitItems: [{ unitId: "unit_suburban_75298226", quantity: 1 }],
        contact: {
          firstName: "Retry",
          lastName: "Traveler",
          emailAddress: "retry@example.com",
        },
      },
      "idem_dropped_response_002"
    );
    assert.equal(recoveredHold.supplierReference, "RZSIM1002");
    assert.equal(
      recoveredHold.resellerReference,
      buildDccRezdyResellerReference("idem_dropped_response_002")
    );
    assert.equal(sim.getOrders().length, 2, "Retry recovery must not create a third order");

    // 3. Expired Hold Rejection: Mutating hold expiry into the past rejects confirmation with 400 EXPIRED_HOLD and cancels upstream hold
    const slotSnowmass = formatCanonicalRezdySlotId("PEAVH0", 499002233, "2026-11-15T10:00:00");
    const holdToExpire = await DccBookingService.createHold({
      supplierConnectionId: "conn_gosno_rezdy",
      productId: "dcc:gosno:snowmass-den:suv",
      optionId: "opt_group_76622153",
      availabilityId: slotSnowmass,
      expirationMinutes: 15,
      unitItems: [{ unitId: "unit_group_76622153", quantity: 1 }],
      contact: {
        firstName: "Expired",
        lastName: "HoldUser",
        fullName: "Expired HoldUser",
        emailAddress: "expired@example.com",
      },
    });
    assert.equal(holdToExpire.supplierReference, "RZSIM1003");

    // Force hold expiry into the past on both upstream order and local record
    const twentyMinsAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    sim.mutateOrderForTest("RZSIM1003", (ord) => {
      ord.dateCreated = twentyMinsAgo;
    });
    const expiredUpstreamView = await adapter.getBooking("RZSIM1003");
    assert.equal(expiredUpstreamView.status, "EXPIRED");

    await assert.rejects(
      () =>
        adapter.confirmBooking("RZSIM1003", {
          contact: {
            firstName: "Expired",
            lastName: "HoldUser",
            fullName: "Expired HoldUser",
            emailAddress: "expired@example.com",
          },
        }),
      (err: unknown) =>
        err instanceof OctoApiError && err.status === 400 && err.code === "EXPIRED_HOLD"
    );

    // 4. Provider Timeout Handling: Simulator delay exceeding adapter requestTimeoutMs throws 504 PROVIDER_TIMEOUT
    sim.setFaultInjection({ delayMs: 250 });
    const fastTimeoutAdapter = new RezdyAdapter({
      endpoint: sim.baseUrl,
      apiKey: sim.apiKey,
      platform: "rezdy",
      operatorSlug: "gosno",
      isSandbox: true,
      requestTimeoutMs: 40,
    });

    await assert.rejects(
      () => fastTimeoutAdapter.getProduct("dcc:gosno:den-breckenridge:suv"),
      (err: unknown) =>
        err instanceof OctoApiError && err.status === 504 && err.code === "PROVIDER_TIMEOUT"
    );
    sim.setFaultInjection({ delayMs: 0 });

    // 5. Persistence Failure Compensation: Local persistence failure during createHold rolls back upstream Rezdy hold
    DccBookingService.setSimulatePersistenceFailureForTests(true);
    try {
      await assert.rejects(
        () =>
          DccBookingService.createHold({
            supplierConnectionId: "conn_gosno_rezdy",
            productId: "dcc:gosno:snowmass-den:suv",
            optionId: "opt_group_76622153",
            availabilityId: slotSnowmass,
            expirationMinutes: 15,
            unitItems: [{ unitId: "unit_group_76622153", quantity: 1 }],
            contact: {
              firstName: "Rollback",
              lastName: "Tester",
              fullName: "Rollback Tester",
              emailAddress: "rollback@example.com",
            },
          }),
        (err: unknown) =>
          err instanceof OctoApiError &&
          err.status === 503 &&
          err.code === "BOOKING_PERSISTENCE_FAILED"
      );

      // Verify the upstream order RZSIM1004 was automatically rolled back to CANCELLED
      const rolledBackOrder = sim.getOrderByNumber("RZSIM1004");
      assert.ok(rolledBackOrder);
      assert.equal(
        rolledBackOrder.status,
        "CANCELLED",
        "Upstream Rezdy hold must be cancelled when local DCC booking persistence fails"
      );
    } finally {
      DccBookingService.setSimulatePersistenceFailureForTests(false);
    }

    // 6. Outcome Reconciliation (Handoff -> Rezdy Confirmed Outcome -> Deduplication)
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
      providerBookingRef: "RZSIM1001",
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
  } finally {
    await sim.close();
    if (prevDbUrl !== undefined) process.env.DATABASE_URL = prevDbUrl;
    else delete process.env.DATABASE_URL;
  }
});

test("Gate 7: Preserved Request/Response Evidence Artifact Separates Live Read-Only, DCC Simulator, and Provider-Hosted Staging", () => {
  const proofPath = path.join(
    process.cwd(),
    "data/viator-operator-snapshots/preserved-gosno-rezdy-booking-proof.json"
  );
  assert.ok(fs.existsSync(proofPath), "Preserved GoSno Rezdy booking proof JSON must exist");

  const raw = fs.readFileSync(proofPath, "utf8");
  assert.ok(
    !raw.includes("gosno_rezdy_admin_20260929_8f9c1b"),
    "Admin proxy token must be redacted in preserved proof"
  );
  assert.ok(
    !raw.includes("rezdy_sim_key_dcc_gosno_pilot_32chars_01"),
    "Simulator API key must be redacted in preserved proof"
  );

  const proof = JSON.parse(raw);
  assert.equal(proof.directProductionSalesEnabled, false);

  // Verify strict separation of evidence classifications
  assert.equal(
    proof.evidenceClassification.liveReadonlyApiEvidence.source,
    "live_rezdy_v1_read_only"
  );
  assert.equal(
    proof.evidenceClassification.liveReadonlyApiEvidence.writeOperationsExecutedAgainstLiveProduction,
    0
  );
  assert.equal(
    proof.evidenceClassification.dccWrittenLocalSimulatorEvidence.source,
    "dcc_written_local_simulator"
  );
  assert.equal(
    proof.evidenceClassification.dccWrittenLocalSimulatorEvidence.isProviderHostedSandbox,
    false
  );
  assert.equal(
    proof.evidenceClassification.providerHostedTestingStatus.source,
    "rezdy_hosted_staging_sandbox"
  );
  assert.equal(
    proof.evidenceClassification.providerHostedTestingStatus.status,
    "BLOCKED_MISSING_STAGING_API_KEY"
  );

  // Verify status summary fields
  assert.equal(proof.statusSummary.onboardingBooleanValidationFixed, "PASSED");
  assert.equal(proof.statusSummary.rezdyRequestResponseTranslationImplemented, "PASSED");
  assert.equal(proof.statusSummary.dccProductMappingVerified, "PASSED");
  assert.equal(proof.statusSummary.liveReadonlyCatalogAndPriceRetrieval, "PASSED");
  assert.equal(proof.statusSummary.liveReadonlyAvailabilityAndSoldOutHandling, "PASSED");
  assert.equal(proof.statusSummary.quoteOnlyAndNoSessionsTruthfulPreservationVerified, "PASSED");
  assert.equal(
    proof.statusSummary.separatePaymentRefundServiceCompletionAndCommissionStatesVerified,
    "PASSED"
  );
  assert.equal(proof.statusSummary.fullBookingObjectRezdyPutUpdatesVerified, "PASSED");
  assert.equal(proof.statusSummary.statelessNoInventedBookingDetailsVerified, "PASSED");
  assert.equal(proof.statusSummary.deterministicHoldExpiryVerified, "PASSED");
  assert.equal(proof.statusSummary.dccWrittenSimulatorHoldConfirmUpdateCancelLifecycle, "PASSED");
  assert.equal(proof.statusSummary.concurrentDuplicateRequestProtectionVerified, "PASSED");
  assert.equal(proof.statusSummary.providerTimeoutAndPersistenceRollbackVerified, "PASSED");
  assert.equal(proof.statusSummary.outcomeReconciliationVerified, "PASSED");
  assert.equal(proof.statusSummary.tenPercentCommissionAccountingVerified, "PASSED");
  assert.match(
    proof.statusSummary.directRezdyStagingApiWriteStatus,
    /BLOCKED_MISSING_STAGING_API_KEY/
  );

  // Verify simulator evidence records all 6 separate lifecycle states accurately
  assert.equal(
    proof.dccWrittenSimulatorEvidence.confirmedUnpaidState.bookingLifecycleStates.paymentStatus,
    "unpaid"
  );
  assert.equal(
    proof.dccWrittenSimulatorEvidence.confirmedUnpaidState.bookingLifecycleStates
      .commissionEligibilityStatus,
    "ineligible_unpaid"
  );
  assert.equal(
    proof.dccWrittenSimulatorEvidence.verifiedPaymentCapturedState.bookingLifecycleStates
      .paymentStatus,
    "captured"
  );
  assert.equal(
    proof.dccWrittenSimulatorEvidence.verifiedPaymentCapturedState.bookingLifecycleStates
      .commissionEligibilityStatus,
    "pending_service_completion"
  );
  assert.equal(
    proof.dccWrittenSimulatorEvidence.serviceCompletedCommissionEligibleState
      .bookingLifecycleStates.commissionEligibilityStatus,
    "eligible"
  );
  assert.equal(
    proof.dccWrittenSimulatorEvidence.cancellationWithoutAutomaticRefundState
      .bookingLifecycleStates.paymentStatus,
    "captured"
  );
  assert.equal(
    proof.dccWrittenSimulatorEvidence.cancellationWithoutAutomaticRefundState
      .bookingLifecycleStates.refundStatus,
    "pending_refund"
  );
  assert.equal(
    proof.dccWrittenSimulatorEvidence.verifiedRefundCompletedState.bookingLifecycleStates
      .paymentStatus,
    "refunded"
  );
  assert.equal(
    proof.dccWrittenSimulatorEvidence.verifiedRefundCompletedState.bookingLifecycleStates
      .refundStatus,
    "full_refund"
  );
});
