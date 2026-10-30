import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";

import {
  resetTestSqliteDb,
  setSimulateDbFailureForTests,
} from "../../lib/db/client";
import { validateOperatorOnboardingApplication } from "../../lib/dcc/operatorOnboardingStore";
import { POST as postOnboardingRoute } from "../../app/api/operators/onboarding/route";
import { POST as postSquareWebhookRoute } from "../../app/api/square/webhook/route";
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
import { DccPaymentService } from "../../lib/payments/paymentService";
import { DccSettlementEngine } from "../../lib/settlement/engine";
import {
  createCommercialHandoff,
  recordCommercialOutcome,
  resetCommercialMemoryStoreForTests,
} from "../../lib/dcc/commerce";

const execFileAsync = promisify(execFile);

const VALID_BASE_ONBOARDING_PAYLOAD = {
  companyName: "Alpine Private Transfers LLC",
  contactName: "Dispatch Lead",
  contactEmail: "dispatch@alpineprivatetransfers.example",
  website: "https://alpineprivatetransfers.example",
  destinations: "Denver & Summit County, CO",
  bookingSystem: "Rezdy Native REST API v1",
  apiDocumentationUrl: "https://developers.rezdy.com/",
};

function createMockSquareClient() {
  return {
    payments: {
      create: async (req: any) => ({
        payment: {
          id: `sq_prov_${req.idempotencyKey}`,
          status: "COMPLETED",
          amountMoney: req.amountMoney,
        },
      }),
    },
    refunds: {
      refundPayment: async (req: any) => ({
        refund: {
          id: `sq_ref_prov_${req.idempotencyKey}`,
          status: "COMPLETED",
          amountMoney: req.amountMoney,
        },
      }),
    },
  };
}

async function captureTraceableSquarePayment(
  orderId: string,
  amount: number,
  currency = "USD"
) {
  const prevToken = process.env.SQUARE_ACCESS_TOKEN;
  const prevLoc = process.env.SQUARE_LOCATION_ID_DCC;
  process.env.SQUARE_ACCESS_TOKEN = "sq_sandbox_test_token_configured";
  process.env.SQUARE_LOCATION_ID_DCC = "loc_dcc_sandbox_001";
  try {
    const payment = await DccPaymentService.processPayment({
      orderId,
      amount,
      currency,
      sourceId: "cnon:card-nonce-ok",
      options: { squareClient: createMockSquareClient() },
    });
    return {
      verified: true as const,
      provider: "square" as const,
      transactionId: payment.paymentId,
      providerRecordId: payment.paymentId,
      provenanceSource: "provider_api_response" as const,
      capturedAmount: payment.amount,
      currency: payment.currency,
      capturedAt: payment.processedAt,
    };
  } finally {
    if (prevToken !== undefined) process.env.SQUARE_ACCESS_TOKEN = prevToken;
    else delete process.env.SQUARE_ACCESS_TOKEN;
    if (prevLoc !== undefined) process.env.SQUARE_LOCATION_ID_DCC = prevLoc;
    else delete process.env.SQUARE_LOCATION_ID_DCC;
  }
}

async function processTraceableSquareRefund(
  orderId: string,
  operatorSlug: string,
  refundAmount: number,
  refundType: "partial" | "full",
  reason: string,
  currency = "USD"
) {
  const prevToken = process.env.SQUARE_ACCESS_TOKEN;
  const prevLoc = process.env.SQUARE_LOCATION_ID_DCC;
  process.env.SQUARE_ACCESS_TOKEN = "sq_sandbox_test_token_configured";
  process.env.SQUARE_LOCATION_ID_DCC = "loc_dcc_sandbox_001";
  try {
    const refund = await DccPaymentService.processRefund({
      orderId,
      operatorSlug,
      amount: refundAmount,
      currency,
      reason,
      options: { squareClient: createMockSquareClient() },
    });
    return {
      verified: true as const,
      provider: "square" as const,
      refundId: refund.id,
      providerRecordId: refund.id,
      provenanceSource: "provider_api_response" as const,
      refundType,
      refundedAmount: refund.amount,
      currency: refund.currency,
      refundedAt: refund.createdAt,
      reason,
    };
  } finally {
    if (prevToken !== undefined) process.env.SQUARE_ACCESS_TOKEN = prevToken;
    else delete process.env.SQUARE_ACCESS_TOKEN;
    if (prevLoc !== undefined) process.env.SQUARE_LOCATION_ID_DCC = prevLoc;
    else delete process.env.SQUARE_LOCATION_ID_DCC;
  }
}

function setupCleanSqliteEnvironment() {
  process.env.DCC_ISOLATED_TEST_DB = "1";
  delete process.env.DCC_TEST_SQLITE_PATH;
  delete process.env.DCC_PAYMENT_SIMULATION_MODE;
  resetTestSqliteDb();
  setSimulateDbFailureForTests(false);
  DccBookingService.clearPilotSupplierConnections();
  DccBookingService.resetFallbackStoresForTests();
  DccSettlementEngine.resetFallbackStoreForTests();
  DccPaymentService.clearInMemoryStoresForProcessRestartSimulation();
  resetCommercialMemoryStoreForTests();
}

test("Gate 1: Accurate Evidence Labeling, Production Write Guardrail, and Provider-Hosted Testing Requirements", async () => {
  setupCleanSqliteEnvironment();

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

test("Gate 2: Database-Backed Payables, Traceable Payment/Refund Provenance (Provider Response & HMAC Webhook), and Fail-Closed Payment Guards", async () => {
  setupCleanSqliteEnvironment();
  const sim = await startLocalRezdyV1Simulator();

  try {
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

    // 1. Fail-closed payment service checks outside explicit test simulation:
    // 1a. Missing sourceId fails closed with 422 MISSING_PAYMENT_SOURCE
    await assert.rejects(
      () =>
        DccPaymentService.processPayment({
          orderId: "ord_missing_source",
          amount: 399,
          currency: "USD",
        }),
      (err: unknown) =>
        err instanceof OctoApiError &&
        err.status === 422 &&
        err.code === "MISSING_PAYMENT_SOURCE"
    );

    // 1b. Caller-supplied status:"captured" or paymentId without sourceId fails closed with 422 UNVERIFIED_CALLER_PAYMENT_STATUS
    await assert.rejects(
      () =>
        DccPaymentService.processPayment({
          orderId: "ord_caller_claimed",
          amount: 399,
          currency: "USD",
          paymentInfo: {
            provider: "square",
            paymentId: "sq_caller_invented_999",
            status: "captured",
          },
        }),
      (err: unknown) =>
        err instanceof OctoApiError &&
        err.status === 422 &&
        err.code === "UNVERIFIED_CALLER_PAYMENT_STATUS"
    );

    // 1c. Missing Square configuration (SQUARE_ACCESS_TOKEN / SQUARE_LOCATION_ID_DCC) fails closed with 503 MISSING_PAYMENT_PROVIDER_CONFIG
    delete process.env.SQUARE_ACCESS_TOKEN;
    delete process.env.SQUARE_LOCATION_ID_DCC;
    await assert.rejects(
      () =>
        DccPaymentService.processPayment({
          orderId: "ord_missing_config",
          amount: 399,
          currency: "USD",
          sourceId: "cnon:card-nonce-ok",
        }),
      (err: unknown) =>
        err instanceof OctoApiError &&
        err.status === 503 &&
        err.code === "MISSING_PAYMENT_PROVIDER_CONFIG"
    );

    // 1d. Missing SQUARE_WEBHOOK_SIGNATURE_KEY_DCC in webhook endpoint fails closed with 503
    delete process.env.SQUARE_WEBHOOK_SIGNATURE_KEY_DCC;
    const unconfiguredWebhookReq = new NextRequest(
      "https://www.destinationcommandcenter.com/api/square/webhook",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-square-hmacsha256-signature": "dummy_sig",
        },
        body: JSON.stringify({
          event_id: "evt_unconfigured_1",
          type: "payment.updated",
          data: { object: { payment: { id: "sq_1", status: "COMPLETED" } } },
        }),
      }
    );
    const unconfiguredWebhookRes = await postSquareWebhookRoute(unconfiguredWebhookReq);
    assert.equal(unconfiguredWebhookRes.status, 503);

    // 2. Create booking hold and verify database-backed confirmation, markServiceCompleted, and traceable payment capture
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

    // 2a. Attempting to claim paymentStatus: "captured" without verifiedPaymentEvidence MUST fail with 422 UNVERIFIED_PAYMENT_EVIDENCE
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

    // 2b. Attempting to supply a generated/untraced transactionId with bare verified:true MUST fail closed with 422 UNTRACEABLE_PAYMENT_EVIDENCE
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
            transactionId: "sq_pay_fake_generated_id_399",
            capturedAmount: 399,
            currency: "USD",
            capturedAt: "2026-10-30T12:00:00.000Z",
          },
        }),
      (err: unknown) =>
        err instanceof OctoApiError &&
        err.status === 422 &&
        err.code === "UNTRACEABLE_PAYMENT_EVIDENCE"
    );

    // 3. Confirm reservation WITHOUT payment evidence -> DB ledger and DB payable remain unpaid / awaiting_payment
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
    const ledgerUnpaid = await DccSettlementEngine.getSettlementEntry(hold.dccBookingId);
    const payableUnpaid = await DccSettlementEngine.getOperatorPayableRow(hold.dccBookingId);
    assert.ok(ledgerUnpaid);
    assert.ok(payableUnpaid, "dcc_operator_payables row must exist in SQLite database");
    assert.equal(ledgerUnpaid.paymentStatus, "unpaid");
    assert.equal(ledgerUnpaid.settlementStatus, "awaiting_payment");
    assert.equal(ledgerUnpaid.commissionEligibilityStatus, "ineligible_unpaid");
    assert.equal(payableUnpaid.settlementStatus, "awaiting_payment");
    assert.equal(payableUnpaid.serviceCompleted, false);
    assert.equal(payableUnpaid.dccCommissionAmount, 0);
    assert.equal(payableUnpaid.operatorPayableAmount, 0);

    // 4. Requirement 1 Proof: Calling markServiceCompleted while still unpaid MUST keep BOTH octo_settlement_ledger AND dcc_operator_payables in awaiting_payment / ineligible_unpaid (NEVER ready_for_payout!)
    const completedWhileUnpaid = await DccBookingService.markServiceCompleted(hold.dccBookingId);
    assert.equal(completedWhileUnpaid.lifecycleStates?.serviceCompletionStatus, "completed");
    assert.equal(
      completedWhileUnpaid.lifecycleStates?.commissionEligibilityStatus,
      "ineligible_unpaid"
    );

    const ledgerCompletedUnpaid = await DccSettlementEngine.getSettlementEntry(hold.dccBookingId);
    const payableCompletedUnpaid = await DccSettlementEngine.getOperatorPayableRow(
      hold.dccBookingId
    );
    assert.ok(ledgerCompletedUnpaid);
    assert.ok(payableCompletedUnpaid);
    assert.equal(ledgerCompletedUnpaid.serviceCompletionStatus, "completed");
    assert.equal(ledgerCompletedUnpaid.commissionEligibilityStatus, "ineligible_unpaid");
    assert.equal(
      ledgerCompletedUnpaid.settlementStatus,
      "awaiting_payment",
      "Ledger row must remain awaiting_payment when service completes before payment capture"
    );
    assert.equal(payableCompletedUnpaid.serviceCompleted, true);
    assert.equal(
      payableCompletedUnpaid.settlementStatus,
      "awaiting_payment",
      "DB dcc_operator_payables row must NOT transition to ready_for_payout when unpaid"
    );
    assert.equal(payableCompletedUnpaid.dccCommissionAmount, 0);
    assert.equal(payableCompletedUnpaid.operatorPayableAmount, 0);

    // 5. Attempting recordVerifiedPaymentCapture with an untraced transactionId fails closed with 422 UNTRACEABLE_PAYMENT_EVIDENCE
    await assert.rejects(
      () =>
        DccBookingService.recordVerifiedPaymentCapture(hold.dccBookingId, {
          verified: true,
          provider: "square",
          transactionId: "sq_untraced_elena_399",
          capturedAmount: 399,
          currency: "USD",
          capturedAt: "2026-10-30T12:05:00.000Z",
        }),
      (err: unknown) =>
        err instanceof OctoApiError &&
        err.status === 422 &&
        err.code === "UNTRACEABLE_PAYMENT_EVIDENCE"
    );

    // 6. Execute a real provider-backed capture in DccPaymentService and verify both ledger AND DB payable now become ready_for_payout + eligible
    const traceableCaptureElena = await captureTraceableSquarePayment(hold.dccBookingId, 399);
    const afterCapture = await DccBookingService.recordVerifiedPaymentCapture(
      hold.dccBookingId,
      traceableCaptureElena
    );
    assert.equal(afterCapture.lifecycleStates?.paymentStatus, "captured");
    assert.equal(afterCapture.lifecycleStates?.commissionEligibilityStatus, "eligible");
    assert.equal(
      afterCapture.verifiedPaymentEvidence?.provenanceSource,
      "provider_api_response"
    );

    const ledgerEligible = await DccSettlementEngine.getSettlementEntry(hold.dccBookingId);
    const payableEligible = await DccSettlementEngine.getOperatorPayableRow(hold.dccBookingId);
    assert.ok(ledgerEligible);
    assert.ok(payableEligible);
    assert.equal(ledgerEligible.paymentStatus, "captured");
    assert.equal(ledgerEligible.capturedAmount, 399);
    assert.equal(ledgerEligible.dccSharePercent, 10);
    assert.equal(ledgerEligible.dccShareAmount, 39.9);
    assert.equal(ledgerEligible.operatorShareAmount, 359.1);
    assert.equal(ledgerEligible.commissionEligibilityStatus, "eligible");
    assert.equal(ledgerEligible.settlementStatus, "ready_for_payout");
    assert.equal(payableEligible.settlementStatus, "ready_for_payout");
    assert.equal(payableEligible.serviceCompleted, true);
    assert.equal(payableEligible.dccCommissionAmount, 39.9);
    assert.equal(payableEligible.operatorPayableAmount, 359.1);

    // 7. Traceable Payment Capture via HMAC-Authenticated Square Webhook + Cancellation/Refund Lifecycle
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

    // Deliver an HMAC-SHA256-authenticated Square webhook for Marcus's $499 payment
    const webhookSigKey = "sq_wh_secret_key_gate2_test";
    const webhookUrl = "https://www.destinationcommandcenter.com/api/square/webhook";
    process.env.SQUARE_WEBHOOK_SIGNATURE_KEY_DCC = webhookSigKey;
    process.env.SQUARE_WEBHOOK_NOTIFICATION_URL = webhookUrl;

    const webhookBodyObj = {
      event_id: "sq_evt_marcus_capture_499",
      type: "payment.created",
      data: {
        object: {
          payment: {
            id: "sq_wh_pay_marcus_499",
            order_id: holdVail.dccBookingId,
            status: "COMPLETED",
            amount_money: {
              amount: 49900,
              currency: "USD",
            },
          },
        },
      },
    };
    const webhookRawBody = JSON.stringify(webhookBodyObj);
    const validHmacSig = crypto
      .createHmac("sha256", webhookSigKey)
      .update(webhookUrl + webhookRawBody)
      .digest("base64");

    const signedWebhookReq = new NextRequest(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-square-hmacsha256-signature": validHmacSig,
      },
      body: webhookRawBody,
    });
    const signedWebhookRes = await postSquareWebhookRoute(signedWebhookReq);
    assert.equal(signedWebhookRes.status, 200);

    // Confirm reservation using the HMAC-authenticated webhook payment evidence
    const confirmedViaWebhook = await DccBookingService.confirmReservation({
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
        transactionId: "sq_wh_pay_marcus_499",
        webhookEventId: "sq_evt_marcus_capture_499",
        capturedAmount: 499,
        currency: "USD",
        capturedAt: "2026-10-30T12:10:00.000Z",
      },
    });
    assert.equal(confirmedViaWebhook.status, "CONFIRMED");
    assert.equal(
      confirmedViaWebhook.verifiedPaymentEvidence?.provenanceSource,
      "authenticated_webhook"
    );

    const payableBeforeCompletion = await DccSettlementEngine.getOperatorPayableRow(
      holdVail.dccBookingId
    );
    assert.ok(payableBeforeCompletion);
    assert.equal(
      payableBeforeCompletion.settlementStatus,
      "pending",
      "Captured payment before service completion must stay pending, not ready_for_payout"
    );

    // Cancel without refund evidence -> stays captured + pending_refund
    const cancelledNoRefundYet = await DccBookingService.cancelBooking(holdVail.dccBookingId, {
      reason: "Customer cancelled; refund under review",
    });
    assert.equal(cancelledNoRefundYet.status, "CANCELLED");
    assert.equal(cancelledNoRefundYet.lifecycleStates?.paymentStatus, "captured");
    assert.equal(cancelledNoRefundYet.lifecycleStates?.refundStatus, "pending_refund");

    // Attempting recordVerifiedRefund with an untraced refundId MUST fail closed with 422 UNTRACEABLE_REFUND_EVIDENCE
    await assert.rejects(
      () =>
        DccBookingService.recordVerifiedRefund(holdVail.dccBookingId, {
          verified: true,
          provider: "square",
          refundId: "sq_ref_fake_invented_200",
          refundType: "partial",
          refundedAmount: 200,
          currency: "USD",
          refundedAt: "2026-10-30T12:12:00.000Z",
          reason: "Untraced refund attempt",
        }),
      (err: unknown) =>
        err instanceof OctoApiError &&
        err.status === 422 &&
        err.code === "UNTRACEABLE_REFUND_EVIDENCE"
    );

    // Partial refund with real provider-backed refund record ($200 refunded of $499, $299 retained)
    const traceablePartialRefund = await processTraceableSquareRefund(
      holdVail.dccBookingId,
      "gosno",
      200,
      "partial",
      "Partial refund per winter cancellation window"
    );
    const afterPartialRefund = await DccBookingService.recordVerifiedRefund(
      holdVail.dccBookingId,
      traceablePartialRefund
    );
    assert.equal(afterPartialRefund.lifecycleStates?.paymentStatus, "partially_refunded");
    assert.equal(afterPartialRefund.lifecycleStates?.refundStatus, "partial_refund");
    assert.equal(
      afterPartialRefund.verifiedRefundEvidence?.provenanceSource,
      "provider_api_response"
    );

    const ledgerPartialRefund = await DccSettlementEngine.getSettlementEntry(holdVail.dccBookingId);
    const payablePartialRefund = await DccSettlementEngine.getOperatorPayableRow(
      holdVail.dccBookingId
    );
    assert.ok(ledgerPartialRefund);
    assert.ok(payablePartialRefund);
    assert.equal(ledgerPartialRefund.paymentStatus, "partially_refunded");
    assert.equal(ledgerPartialRefund.refundStatus, "partial_refund");
    assert.equal(ledgerPartialRefund.settlementStatus, "adjusted");
    assert.equal(ledgerPartialRefund.refundedAmount, 200);
    assert.equal(ledgerPartialRefund.dccShareAmount, 29.9);
    assert.equal(ledgerPartialRefund.operatorShareAmount, 269.1);
    assert.equal(payablePartialRefund.settlementStatus, "adjusted");
    assert.equal(payablePartialRefund.dccCommissionAmount, 29.9);
    assert.equal(payablePartialRefund.operatorPayableAmount, 269.1);

    // Full refund with real provider-backed refund record ($499 refunded of $499)
    const traceableFullRefund = await processTraceableSquareRefund(
      holdVail.dccBookingId,
      "gosno",
      499,
      "full",
      "Full refund authorized"
    );
    const afterFullRefund = await DccBookingService.recordVerifiedRefund(
      holdVail.dccBookingId,
      traceableFullRefund
    );
    assert.equal(afterFullRefund.lifecycleStates?.paymentStatus, "refunded");
    assert.equal(afterFullRefund.lifecycleStates?.refundStatus, "full_refund");

    const ledgerFullRefund = await DccSettlementEngine.getSettlementEntry(holdVail.dccBookingId);
    const payableFullRefund = await DccSettlementEngine.getOperatorPayableRow(
      holdVail.dccBookingId
    );
    assert.ok(ledgerFullRefund);
    assert.ok(payableFullRefund);
    assert.equal(ledgerFullRefund.paymentStatus, "refunded");
    assert.equal(ledgerFullRefund.refundStatus, "full_refund");
    assert.equal(ledgerFullRefund.settlementStatus, "reversed");
    assert.equal(ledgerFullRefund.dccShareAmount, 0);
    assert.equal(ledgerFullRefund.operatorShareAmount, 0);
    assert.equal(payableFullRefund.settlementStatus, "reversed");
    assert.equal(payableFullRefund.dccCommissionAmount, 0);
    assert.equal(payableFullRefund.operatorPayableAmount, 0);
  } finally {
    delete process.env.SQUARE_WEBHOOK_SIGNATURE_KEY_DCC;
    delete process.env.SQUARE_WEBHOOK_NOTIFICATION_URL;
    await sim.close();
  }
});

test("Gate 3: Native Rezdy Full-Object Booking Updates (Retrieve -> Preserve Items, Participants, Custom Fields, Pickup -> PUT)", async () => {
  setupCleanSqliteEnvironment();
  const sim = await startLocalRezdyV1Simulator();

  try {
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
        }),
      }
    );
    assert.equal(partialPutRes.status, 400);
    const partialPutBody = await partialPutRes.json();
    assert.equal(partialPutBody.requestStatus.error.errorCode, "MISSING_FULL_BOOKING_OBJECT");

    // 2. Update booking via DccBookingService.updateBooking (which performs GET -> preserve -> PUT and persists to SQLite)
    const updated = await DccBookingService.updateBooking(hold.dccBookingId, {
      contact: {
        firstName: "Claire",
        lastName: "Redfield",
        fullName: "Claire Redfield",
        emailAddress: "claire.redfield@example.com",
        phoneNumber: "+1-303-555-0199",
      },
      customFields: [
        { label: "Airline & Flight Number", value: "DL 2099 (Rebooked)" },
        { label: "Special Request", value: "Roof box for skis" },
      ],
      notes: "Updated arrival flight",
    });

    const upstreamOrder = sim.getOrderByNumber("RZSIM1001");
    assert.ok(upstreamOrder);
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
    assert.equal(upstreamOrder.items[0].participants?.length, 2);
    assert.equal(upstreamOrder.items[0].pickupId, "den_east_level_5");
    assert.deepEqual(upstreamOrder.fields, [
      { label: "Airline & Flight Number", value: "DL 2099 (Rebooked)" },
      { label: "Child Booster Seats", value: "1" },
      { label: "Special Request", value: "Roof box for skis" },
    ]);
    assert.equal(upstreamOrder.customer.phone, "+1-303-555-0199");
    assert.equal(updated.contact?.phoneNumber, "+1-303-555-0199");
  } finally {
    await sim.close();
  }
});

test("Gate 4: No Invented Booking Details, Unswallowed DB Persistence Failures, and Fresh OS Process Recovery from SQLite Database (Unpaid, Captured, Completed, Partially Refunded)", async () => {
  const sqliteFile = path.join(
    os.tmpdir(),
    `dcc-fresh-process-recovery-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`
  );
  process.env.DCC_ISOLATED_TEST_DB = "1";
  process.env.DCC_TEST_SQLITE_PATH = sqliteFile;
  delete process.env.DCC_PAYMENT_SIMULATION_MODE;
  resetTestSqliteDb();
  setSimulateDbFailureForTests(false);
  DccBookingService.clearPilotSupplierConnections();
  DccBookingService.resetFallbackStoresForTests();
  DccSettlementEngine.resetFallbackStoreForTests();
  DccPaymentService.clearInMemoryStoresForProcessRestartSimulation();

  const sim = await startLocalRezdyV1Simulator();

  try {
    const makeFreshAdapter = () =>
      new RezdyAdapter({
        endpoint: sim.baseUrl,
        apiKey: sim.apiKey,
        platform: "rezdy",
        operatorSlug: "gosno",
        isSandbox: true,
      });

    // 1. Missing/unmapped product, missing departure time, bare session ID, and missing customer contact all fail closed
    await assert.rejects(
      () => makeFreshAdapter().getProduct("dcc:gosno:invented-nonexistent-route"),
      (err: unknown) => err instanceof OctoApiError && err.status === 404
    );

    const canonicalSlot = formatCanonicalRezdySlotId("P7477S", 497020486, "2026-11-12T10:53:00");
    await assert.rejects(
      () =>
        makeFreshAdapter().createBookingHold({
          uuid: "no-time-uuid",
          productId: "dcc:gosno:den-breckenridge:suv",
          optionId: "opt_suburban_69029050",
          availabilityId: "2026-11-12",
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
    assert.equal(parseStatelessRezdyAvailabilityLocator("497020486"), null);

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

    // 2. Create 3 distinct bookings in the file-backed SQLite database:
    // Booking A: Unpaid confirmed booking with service completed while unpaid (must remain awaiting_payment / ineligible_unpaid)
    const slotSnowmass = formatCanonicalRezdySlotId("PEAVH0", 499002233, "2026-11-15T10:00:00");
    const holdUnpaid = await DccBookingService.createHold({
      supplierConnectionId: "conn_gosno_rezdy",
      productId: "dcc:gosno:snowmass-den:suv",
      optionId: "opt_group_76622153",
      availabilityId: slotSnowmass,
      expirationMinutes: 15,
      unitItems: [{ unitId: "unit_group_76622153", quantity: 1 }],
      contact: {
        firstName: "Unpaid",
        lastName: "Traveler",
        fullName: "Unpaid Traveler",
        emailAddress: "unpaid@example.com",
      },
    });
    await DccBookingService.confirmReservation({
      bookingId: holdUnpaid.dccBookingId,
      contact: {
        firstName: "Unpaid",
        lastName: "Traveler",
        fullName: "Unpaid Traveler",
        emailAddress: "unpaid@example.com",
      },
    });
    await DccBookingService.markServiceCompleted(holdUnpaid.dccBookingId);

    // Booking B: Captured + Service Completed -> eligible / ready_for_payout ($399 -> $39.90 DCC, $359.10 operator)
    const holdCompletedPaid = await DccBookingService.createHold({
      supplierConnectionId: "conn_gosno_rezdy",
      productId: "dcc:gosno:den-breckenridge:suv",
      optionId: "opt_suburban_69029050",
      availabilityId: canonicalSlot,
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
    const evidenceHannah = await captureTraceableSquarePayment(
      holdCompletedPaid.dccBookingId,
      399
    );
    await DccBookingService.confirmReservation({
      bookingId: holdCompletedPaid.dccBookingId,
      contact: {
        firstName: "Hannah",
        lastName: "Abbott",
        fullName: "Hannah Abbott",
        emailAddress: "hannah.abbott@example.com",
        phoneNumber: "+1-303-555-0188",
      },
      verifiedPaymentEvidence: evidenceHannah,
    });
    await DccBookingService.markServiceCompleted(holdCompletedPaid.dccBookingId);

    // Booking C: Captured ($499) -> Cancelled with Partial Refund ($200 refunded, $299 retained -> $29.90 DCC, $269.10 operator)
    const slotVail = formatCanonicalRezdySlotId("PXFGPP", 498001122, "2026-11-12T11:00:00");
    const holdPartialRefund = await DccBookingService.createHold({
      supplierConnectionId: "conn_gosno_rezdy",
      productId: "dcc:gosno:den-vail:suv",
      optionId: "opt_suburban_75298226",
      availabilityId: slotVail,
      expirationMinutes: 15,
      unitItems: [{ unitId: "unit_suburban_75298226", quantity: 1 }],
      contact: {
        firstName: "Partial",
        lastName: "RefundUser",
        fullName: "Partial RefundUser",
        emailAddress: "partial.refund@example.com",
      },
    });
    const evidencePartial = await captureTraceableSquarePayment(
      holdPartialRefund.dccBookingId,
      499
    );
    await DccBookingService.confirmReservation({
      bookingId: holdPartialRefund.dccBookingId,
      contact: {
        firstName: "Partial",
        lastName: "RefundUser",
        fullName: "Partial RefundUser",
        emailAddress: "partial.refund@example.com",
      },
      verifiedPaymentEvidence: evidencePartial,
    });
    const refundPartialEvidence = await processTraceableSquareRefund(
      holdPartialRefund.dccBookingId,
      "gosno",
      200,
      "partial",
      "Winter partial refund window"
    );
    await DccBookingService.cancelBooking(holdPartialRefund.dccBookingId, {
      reason: "Customer cancelled with partial refund",
      verifiedRefundEvidence: refundPartialEvidence,
    });

    // 3. Prove DB write failures are NEVER swallowed (throw 503 BOOKING_PERSISTENCE_FAILED / SETTLEMENT_PERSISTENCE_FAILED)
    setSimulateDbFailureForTests(true);
    try {
      await assert.rejects(
        () => DccSettlementEngine.markServiceCompleted(holdUnpaid.dccBookingId),
        (err: unknown) => err instanceof OctoApiError && err.status === 503
      );
      await assert.rejects(
        () =>
          DccPaymentService.processPayment({
            orderId: "ord_db_fail_check",
            amount: 100,
            currency: "USD",
            sourceId: "cnon:card-nonce-ok",
            options: {
              allowTestSimulation: true,
            },
          }),
        (err: unknown) =>
          err instanceof OctoApiError &&
          err.status === 503 &&
          err.code === "PAYMENT_PERSISTENCE_FAILED"
      );
    } finally {
      setSimulateDbFailureForTests(false);
    }

    // 4. Spawn a brand-new OS child process (zero in-memory state!) and verify all 3 bookings, ledger entries, and DB payables reload consistently from SQLite
    const tempVerifyScriptPath = path.join(
      process.cwd(),
      "tests",
      "dcc",
      `.tmp-gate4-verify-${Date.now()}-${Math.random().toString(16).slice(2)}.ts`
    );
    const childVerifyScript = `
      import assert from "node:assert/strict";
      import { DccBookingService } from "../../lib/bookings/bookingService";
      import { DccSettlementEngine } from "../../lib/settlement/engine";
      import { DccPaymentService } from "../../lib/payments/paymentService";

      const [unpaidId, completedPaidId, partialRefundId] = process.argv.slice(2);

      async function main() {
        // A. Unpaid booking with service completed
        const bkUnpaid = await DccBookingService.getBooking(unpaidId);
        const ledgUnpaid = await DccSettlementEngine.getSettlementEntry(unpaidId);
        const payUnpaid = await DccSettlementEngine.getOperatorPayableRow(unpaidId);
        assert.equal(bkUnpaid.status, "CONFIRMED");
        assert.equal(bkUnpaid.lifecycleStates?.paymentStatus, "unpaid");
        assert.equal(bkUnpaid.lifecycleStates?.serviceCompletionStatus, "completed");
        assert.equal(bkUnpaid.lifecycleStates?.commissionEligibilityStatus, "ineligible_unpaid");
        assert.equal(ledgUnpaid?.settlementStatus, "awaiting_payment");
        assert.equal(ledgUnpaid?.commissionEligibilityStatus, "ineligible_unpaid");
        assert.equal(payUnpaid?.settlementStatus, "awaiting_payment");
        assert.equal(payUnpaid?.serviceCompleted, true);
        assert.equal(payUnpaid?.dccCommissionAmount, 0);
        assert.equal(payUnpaid?.operatorPayableAmount, 0);

        // B. Captured + completed booking
        const bkPaid = await DccBookingService.getBooking(completedPaidId);
        const ledgPaid = await DccSettlementEngine.getSettlementEntry(completedPaidId);
        const payPaid = await DccSettlementEngine.getOperatorPayableRow(completedPaidId);
        const orderPayB = await DccPaymentService.getPaymentByOrderId(completedPaidId);
        assert.equal(bkPaid.status, "CONFIRMED");
        assert.equal(bkPaid.lifecycleStates?.paymentStatus, "captured");
        assert.equal(bkPaid.lifecycleStates?.serviceCompletionStatus, "completed");
        assert.equal(bkPaid.lifecycleStates?.commissionEligibilityStatus, "eligible");
        assert.equal(bkPaid.verifiedPaymentEvidence?.provenanceSource, "provider_api_response");
        assert.equal(ledgPaid?.settlementStatus, "ready_for_payout");
        assert.equal(ledgPaid?.dccShareAmount, 39.9);
        assert.equal(ledgPaid?.operatorShareAmount, 359.1);
        assert.equal(payPaid?.settlementStatus, "ready_for_payout");
        assert.equal(payPaid?.dccCommissionAmount, 39.9);
        assert.equal(payPaid?.operatorPayableAmount, 359.1);
        assert.equal(orderPayB?.status, "captured");

        // C. Partially refunded cancelled booking
        const bkPartial = await DccBookingService.getBooking(partialRefundId);
        const ledgPartial = await DccSettlementEngine.getSettlementEntry(partialRefundId);
        const payPartial = await DccSettlementEngine.getOperatorPayableRow(partialRefundId);
        const refundsC = await DccPaymentService.getRefundsForOrder(partialRefundId);
        assert.equal(bkPartial.status, "CANCELLED");
        assert.equal(bkPartial.lifecycleStates?.paymentStatus, "partially_refunded");
        assert.equal(bkPartial.lifecycleStates?.refundStatus, "partial_refund");
        assert.equal(bkPartial.verifiedRefundEvidence?.refundedAmount, 200);
        assert.equal(bkPartial.verifiedRefundEvidence?.provenanceSource, "provider_api_response");
        assert.equal(ledgPartial?.settlementStatus, "adjusted");
        assert.equal(ledgPartial?.refundedAmount, 200);
        assert.equal(ledgPartial?.dccShareAmount, 29.9);
        assert.equal(ledgPartial?.operatorShareAmount, 269.1);
        assert.equal(payPartial?.settlementStatus, "adjusted");
        assert.equal(payPartial?.dccCommissionAmount, 29.9);
        assert.equal(payPartial?.operatorPayableAmount, 269.1);
        assert.equal(refundsC.length, 1);
        assert.equal(refundsC[0].amount, 200);

        console.log("FRESH_PROCESS_RECOVERY_OK");
      }

      main().catch((err) => {
        console.error(err);
        process.exit(1);
      });
    `;

    fs.writeFileSync(tempVerifyScriptPath, childVerifyScript, "utf8");
    try {
      const { stdout } = await execFileAsync(
        process.execPath,
        [
          "--import",
          "tsx",
          tempVerifyScriptPath,
          holdUnpaid.dccBookingId,
          holdCompletedPaid.dccBookingId,
          holdPartialRefund.dccBookingId,
        ],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            DCC_ISOLATED_TEST_DB: "1",
            DCC_TEST_SQLITE_PATH: sqliteFile,
          },
        }
      );
      assert.match(stdout, /FRESH_PROCESS_RECOVERY_OK/);
    } finally {
      if (fs.existsSync(tempVerifyScriptPath)) {
        try {
          fs.unlinkSync(tempVerifyScriptPath);
        } catch {}
      }
    }
  } finally {
    delete process.env.DCC_TEST_SQLITE_PATH;
    resetTestSqliteDb();
    for (const suffix of ["", "-wal", "-shm"]) {
      if (fs.existsSync(`${sqliteFile}${suffix}`)) {
        try {
          fs.unlinkSync(`${sqliteFile}${suffix}`);
        } catch {}
      }
    }
    await sim.close();
  }
});

test("Gate 5: Truthful Availability States (Quote-Only, No Sessions, Sold Out), Strict Status Mapping, and Separation of DCC Checkout Deadline from Authoritative Rezdy Hold Expiry", async () => {
  setupCleanSqliteEnvironment();
  const sim = await startLocalRezdyV1Simulator();

  try {
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

    // 1. Quote-only product (PKQDPG) returns [] from adapter.checkAvailability and status: "QUOTE_ONLY" from DccBookingService
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

    // 2. Date with no returned sessions returns status: "NO_SESSIONS"
    const svcNoSessions = await DccBookingService.checkAvailability(
      "dcc:gosno:den-breckenridge:suv",
      "opt_suburban_69029050",
      "2026-12-15",
      [{ unitId: "unit_suburban_69029050", quantity: 1 }]
    );
    assert.equal(svcNoSessions.available, false);
    assert.equal(svcNoSessions.bookable, false);
    assert.equal(svcNoSessions.status, "NO_SESSIONS");
    assert.equal(svcNoSessions.localDateTimeStart, null);

    // 3. Actual sold-out session returns status: "SOLD_OUT" with real timestamp
    const svcSoldOut = await DccBookingService.checkAvailability(
      "dcc:gosno:den-breckenridge:suv",
      "opt_suburban_69029050",
      "2026-12-14",
      [{ unitId: "unit_suburban_69029050", quantity: 1 }]
    );
    assert.equal(svcSoldOut.available, false);
    assert.equal(svcSoldOut.status, "SOLD_OUT");
    assert.equal(svcSoldOut.localDateTimeStart, "2026-12-14 15:05:00");

    // 4. Unfamiliar booking statuses MUST throw 502 UNRECOGNIZED_REZDY_BOOKING_STATUS
    assert.throws(
      () => mapRezdyStatusToOctoStatus("UNKNOWN_VENDOR_STATUS_XYZ", "RZSIM1001"),
      (err: unknown) =>
        err instanceof OctoApiError &&
        err.status === 502 &&
        err.code === "UNRECOGNIZED_REZDY_BOOKING_STATUS"
    );

    // 5. Requirement 5 Proof: Separate DCC checkout deadlines from authoritative Rezdy hold expiry.
    // Standard Rezdy PROCESSING bookings do NOT report an authoritative provider hold expiry field,
    // so utcHoldExpires MUST be null while dccCheckoutDeadlineUtc is tracked separately.
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
    assert.equal(
      hold.utcHoldExpires,
      null,
      "Authoritative provider utcHoldExpires must be null when Rezdy does not supply a hold expiry timestamp"
    );
    assert.ok(
      hold.dccCheckoutDeadlineUtc,
      "DCC checkout deadline must be tracked separately on dccCheckoutDeadlineUtc"
    );
    assert.equal(hold.dccCheckoutExpired, false);

    // Set upstream order's dateCreated to 20 minutes ago (past the 15-minute DCC checkout deadline) WITHOUT setting an authoritative provider hold expiry
    const twentyMinsAgoIso = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    const expectedDccDeadlineIso = new Date(
      Date.parse(twentyMinsAgoIso) + 15 * 60 * 1000
    ).toISOString();
    sim.mutateOrderForTest("RZSIM1001", (ord) => {
      ord.dateCreated = twentyMinsAgoIso;
    });

    const fetched1 = await adapter.getBooking("RZSIM1001");
    await new Promise((r) => setTimeout(r, 25));
    const fetched2 = await adapter.getBooking("RZSIM1001");

    assert.equal(
      fetched1.status,
      "ON_HOLD",
      "Provider booking must NOT be marked EXPIRED solely from the default 15-minute DCC checkout calculation"
    );
    assert.equal(fetched1.utcHoldExpires, null);
    assert.equal(fetched1.dccCheckoutDeadlineUtc, expectedDccDeadlineIso);
    assert.equal(fetched1.dccCheckoutExpired, true);
    assert.equal(
      fetched2.dccCheckoutDeadlineUtc,
      expectedDccDeadlineIso,
      "getBooking must never generate a fresh 15-minute deadline on retrieval"
    );

    // When authoritative provider hold expiry IS explicitly present on the provider booking and in the past, status becomes EXPIRED
    sim.mutateOrderForTest("RZSIM1001", (ord) => {
      (ord as any).utcHoldExpires = new Date(Date.now() - 60 * 1000).toISOString();
    });
    const fetchedWithAuthoritativeExpiry = await adapter.getBooking("RZSIM1001");
    assert.equal(fetchedWithAuthoritativeExpiry.status, "EXPIRED");
    assert.ok(fetchedWithAuthoritativeExpiry.utcHoldExpires);
  } finally {
    await sim.close();
  }
});

test("Gate 6: Multi-Process Concurrency Across Independent Workers, Timeout After Provider Commit Reconciliation, and Persistence Failure Rollback", async () => {
  const sqliteFile = path.join(
    os.tmpdir(),
    `dcc-multiprocess-concurrency-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`
  );
  process.env.DCC_ISOLATED_TEST_DB = "1";
  process.env.DCC_TEST_SQLITE_PATH = sqliteFile;
  delete process.env.DCC_PAYMENT_SIMULATION_MODE;
  resetTestSqliteDb();
  setSimulateDbFailureForTests(false);
  DccBookingService.clearPilotSupplierConnections();
  DccBookingService.resetFallbackStoresForTests();
  DccSettlementEngine.resetFallbackStoreForTests();
  DccPaymentService.clearInMemoryStoresForProcessRestartSimulation();
  resetCommercialMemoryStoreForTests();

  const sim = await startLocalRezdyV1Simulator();

  try {
    // Ensure the shared SQLite file and WAL schema are initialized before spawning 3 concurrent OS worker processes
    await DccSettlementEngine.getSettlementEntry("init_schema_for_multiprocess");

    // 1. Multi-Process Concurrency Proof: Spawn 3 separate OS worker processes simultaneously sharing SQLite + Rezdy simulator
    const slotBreck = formatCanonicalRezdySlotId("P7477S", 497020486, "2026-11-12T10:53:00");
    const tempWorkerScriptPath = path.join(
      process.cwd(),
      "tests",
      "dcc",
      `.tmp-gate6-worker-${Date.now()}-${Math.random().toString(16).slice(2)}.ts`
    );
    const workerHoldScript = `
      import { RezdyAdapter } from "../../lib/octo/adapters/rezdy";
      import { DccBookingService } from "../../lib/bookings/bookingService";

      const [baseUrl, apiKey, slotId, idemKey, timeoutMsStr] = process.argv.slice(2);

      async function main() {
        const adapter = new RezdyAdapter({
          endpoint: baseUrl,
          apiKey,
          platform: "rezdy",
          operatorSlug: "gosno",
          isSandbox: true,
          requestTimeoutMs: timeoutMsStr ? Number(timeoutMsStr) : undefined,
        });

        DccBookingService.registerPilotSupplierConnection({
          id: "conn_gosno_rezdy",
          operatorSlug: "gosno",
          operatorName: "GoSno Mountain Transportation",
          endpoint: baseUrl,
          reservationPlatform: "rezdy",
          commissionPercent: 10.0,
          apiKey,
          isSandbox: true,
          connectionStatus: "sandbox_verified",
          adapter,
        });

        const res = await DccBookingService.createHold({
          supplierConnectionId: "conn_gosno_rezdy",
          productId: "dcc:gosno:den-breckenridge:suv",
          optionId: "opt_suburban_69029050",
          availabilityId: slotId,
          expirationMinutes: 15,
          unitItems: [{ unitId: "unit_suburban_69029050", quantity: 1 }],
          idempotencyKey: idemKey,
          contact: {
            firstName: "Concurrent",
            lastName: "Worker",
            fullName: "Concurrent Worker",
            emailAddress: "worker@example.com",
          },
        });
        console.log(JSON.stringify({ dccBookingId: res.dccBookingId, supplierReference: res.supplierReference, status: res.status }));
      }

      main().catch((err) => {
        console.error(err);
        process.exit(1);
      });
    `;

    fs.writeFileSync(tempWorkerScriptPath, workerHoldScript, "utf8");
    let workerOutputs: Array<{ stdout: string; stderr: string }>;
    try {
      workerOutputs = await Promise.all(
        Array.from({ length: 3 }, () =>
          execFileAsync(
            process.execPath,
            [
              "--import",
              "tsx",
              tempWorkerScriptPath,
              sim.baseUrl,
              sim.apiKey,
              slotBreck,
              "idem_multiprocess_workers_001",
            ],
            {
              cwd: process.cwd(),
              env: {
                ...process.env,
                DCC_ISOLATED_TEST_DB: "1",
                DCC_TEST_SQLITE_PATH: sqliteFile,
              },
            }
          )
        )
      );
    } finally {
      if (fs.existsSync(tempWorkerScriptPath)) {
        try {
          fs.unlinkSync(tempWorkerScriptPath);
        } catch {}
      }
    }

    const parsedWorkers = workerOutputs.map((out) =>
      JSON.parse(out.stdout.trim().split("\n").pop()!)
    );
    const uniqueDccIds = new Set(parsedWorkers.map((w) => w.dccBookingId));
    const uniqueSupplierRefs = new Set(parsedWorkers.map((w) => w.supplierReference));
    assert.equal(
      uniqueDccIds.size,
      1,
      "All 3 separate OS worker processes must resolve to the exact same dccBookingId"
    );
    assert.equal(
      uniqueSupplierRefs.size,
      1,
      "All 3 separate OS worker processes must resolve to the exact same Rezdy orderNumber"
    );
    assert.equal(
      sim.getOrders().length,
      1,
      "Exactly 1 upstream Rezdy booking may be created across 3 simultaneous OS worker processes"
    );
    const postBookingLogs = sim
      .getServerLogs()
      .filter((l) => l.method === "POST" && l.path === "/v1/bookings");
    assert.equal(
      postBookingLogs.length,
      1,
      "Exactly 1 POST /v1/bookings request may hit the provider across 3 concurrent OS worker processes"
    );

    // 2. Timeout After Upstream Provider Commit (postCommitDelayMsOnce) Followed by Separate Worker Recovery:
    // Session 498001122 on PXFGPP has only 1 seat available.
    // Worker 1 calls createHold with a 50ms timeout while the simulator delays the response by 250ms AFTER committing RZSIM1002 (decrementing seatsAvailable from 1 to 0).
    const slotVail = formatCanonicalRezdySlotId("PXFGPP", 498001122, "2026-11-12T11:00:00");
    sim.setFaultInjection({ postCommitDelayMsOnce: 250 });

    const adapterFastTimeout = new RezdyAdapter({
      endpoint: sim.baseUrl,
      apiKey: sim.apiKey,
      platform: "rezdy",
      operatorSlug: "gosno",
      isSandbox: true,
      requestTimeoutMs: 50,
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
      adapter: adapterFastTimeout,
    });

    await assert.rejects(
      () =>
        DccBookingService.createHold({
          supplierConnectionId: "conn_gosno_rezdy",
          productId: "dcc:gosno:den-vail:suv",
          optionId: "opt_suburban_75298226",
          availabilityId: slotVail,
          expirationMinutes: 15,
          unitItems: [{ unitId: "unit_suburban_75298226", quantity: 1 }],
          idempotencyKey: "idem_timeout_after_commit_002",
          contact: {
            firstName: "Timeout",
            lastName: "CommitUser",
            fullName: "Timeout CommitUser",
            emailAddress: "timeout.commit@example.com",
          },
        }),
      (err: unknown) =>
        err instanceof OctoApiError &&
        err.status === 504 &&
        err.code === "PROVIDER_TIMEOUT"
    );

    // Wait for simulator's delayed response handler to finish
    await new Promise((r) => setTimeout(r, 260));

    // Verify the provider HAS already committed order RZSIM1002 even though Worker 1 timed out
    assert.equal(sim.getOrders().length, 2);
    assert.equal(sim.getOrderByNumber("RZSIM1002")?.status, "PROCESSING");

    // Now Worker 2 (with normal timeout) retries the same idempotencyKey and reconciles RZSIM1002 into SQLite without creating a duplicate booking!
    const adapterNormal = new RezdyAdapter({
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
      adapter: adapterNormal,
    });

    const reconciledAfterTimeout = await DccBookingService.createHold({
      supplierConnectionId: "conn_gosno_rezdy",
      productId: "dcc:gosno:den-vail:suv",
      optionId: "opt_suburban_75298226",
      availabilityId: slotVail,
      expirationMinutes: 15,
      unitItems: [{ unitId: "unit_suburban_75298226", quantity: 1 }],
      idempotencyKey: "idem_timeout_after_commit_002",
      contact: {
        firstName: "Timeout",
        lastName: "CommitUser",
        fullName: "Timeout CommitUser",
        emailAddress: "timeout.commit@example.com",
      },
    });
    assert.equal(reconciledAfterTimeout.supplierReference, "RZSIM1002");
    assert.equal(reconciledAfterTimeout.status, "ON_HOLD");
    assert.equal(
      sim.getOrders().length,
      2,
      "Reconciling after timeout-after-commit must not create a third order"
    );

    // 3. Separate DCC Checkout Deadline Expiry vs Authoritative Provider Hold Expiry on Confirmation:
    const slotSnowmass = formatCanonicalRezdySlotId("PEAVH0", 499002233, "2026-11-15T10:00:00");
    const holdDccDeadline = await DccBookingService.createHold({
      supplierConnectionId: "conn_gosno_rezdy",
      productId: "dcc:gosno:snowmass-den:suv",
      optionId: "opt_group_76622153",
      availabilityId: slotSnowmass,
      expirationMinutes: -5, // DCC checkout deadline already elapsed, while Rezdy has no authoritative utcHoldExpires
      unitItems: [{ unitId: "unit_group_76622153", quantity: 1 }],
      contact: {
        firstName: "Deadline",
        lastName: "Tester",
        fullName: "Deadline Tester",
        emailAddress: "deadline@example.com",
      },
    });
    assert.equal(holdDccDeadline.supplierReference, "RZSIM1003");
    assert.equal(holdDccDeadline.utcHoldExpires, null);
    assert.equal(holdDccDeadline.dccCheckoutExpired, true);

    await assert.rejects(
      () =>
        DccBookingService.confirmReservation({
          bookingId: holdDccDeadline.dccBookingId,
          contact: {
            firstName: "Deadline",
            lastName: "Tester",
            fullName: "Deadline Tester",
            emailAddress: "deadline@example.com",
          },
        }),
      (err: unknown) =>
        err instanceof OctoApiError &&
        err.status === 400 &&
        err.code === "DCC_CHECKOUT_DEADLINE_EXPIRED"
    );

    // Verify the provider booking was NOT falsely marked EXPIRED
    const afterDccDeadlineReject = await DccBookingService.getBooking(
      holdDccDeadline.dccBookingId
    );
    assert.equal(afterDccDeadlineReject.status, "ON_HOLD");

    // 4. Persistence Failure Compensation: Local persistence failure during createHold rolls back upstream Rezdy hold
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
    delete process.env.DCC_TEST_SQLITE_PATH;
    resetTestSqliteDb();
    for (const suffix of ["", "-wal", "-shm"]) {
      if (fs.existsSync(`${sqliteFile}${suffix}`)) {
        try {
          fs.unlinkSync(`${sqliteFile}${suffix}`);
        } catch {}
      }
    }
    await sim.close();
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
});
