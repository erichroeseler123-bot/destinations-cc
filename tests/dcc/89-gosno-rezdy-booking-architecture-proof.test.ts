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
    assert.equal(
      ledgerPartialRefund.commissionEligibilityStatus,
      "ineligible_cancelled",
      "Cancelled booking with partial refund and uncompleted service must remain ineligible_cancelled"
    );
    assert.equal(
      ledgerPartialRefund.dccShareAmount,
      0,
      "Retained funds on a cancelled, uncompleted booking must not award DCC commission without an explicit penalty policy"
    );
    assert.equal(ledgerPartialRefund.operatorShareAmount, 299);
    assert.equal(payablePartialRefund.settlementStatus, "adjusted");
    assert.equal(payablePartialRefund.dccCommissionAmount, 0);
    assert.equal(payablePartialRefund.operatorPayableAmount, 299);

    // Cumulative full refund with real provider-backed refund record (remaining $299 refunded of $499 -> $499 total refunded)
    const traceableFullRefund = await processTraceableSquareRefund(
      holdVail.dccBookingId,
      "gosno",
      299,
      "full",
      "Remaining balance refunded for full refund"
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

        // C. Partially refunded cancelled booking (uncompleted service -> $0 DCC commission, $299 operator retained)
        const bkPartial = await DccBookingService.getBooking(partialRefundId);
        const ledgPartial = await DccSettlementEngine.getSettlementEntry(partialRefundId);
        const payPartial = await DccSettlementEngine.getOperatorPayableRow(partialRefundId);
        const refundsC = await DccPaymentService.getRefundsForOrder(partialRefundId);
        assert.equal(bkPartial.status, "CANCELLED");
        assert.equal(bkPartial.lifecycleStates?.paymentStatus, "partially_refunded");
        assert.equal(bkPartial.lifecycleStates?.refundStatus, "partial_refund");
        assert.equal(bkPartial.lifecycleStates?.commissionEligibilityStatus, "ineligible_cancelled");
        assert.equal(bkPartial.verifiedRefundEvidence?.refundedAmount, 200);
        assert.equal(bkPartial.verifiedRefundEvidence?.provenanceSource, "provider_api_response");
        assert.equal(ledgPartial?.settlementStatus, "adjusted");
        assert.equal(ledgPartial?.commissionEligibilityStatus, "ineligible_cancelled");
        assert.equal(ledgPartial?.refundedAmount, 200);
        assert.equal(ledgPartial?.dccShareAmount, 0);
        assert.equal(ledgPartial?.operatorShareAmount, 299);
        assert.equal(payPartial?.settlementStatus, "adjusted");
        assert.equal(payPartial?.dccCommissionAmount, 0);
        assert.equal(payPartial?.operatorPayableAmount, 299);
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

test("Gate 8: Authoritative Payment/Refund Statuses, Obligation Binding & Over-Allocation Prevention, Active Lock Lease Protection, Postgres Constraint Proof, and Completed-Booking Commission Rule", async () => {
  setupCleanSqliteEnvironment();
  const prevToken = process.env.SQUARE_ACCESS_TOKEN;
  const prevLoc = process.env.SQUARE_LOCATION_ID_DCC;
  process.env.SQUARE_ACCESS_TOKEN = "sq_sandbox_test_token_configured";
  process.env.SQUARE_LOCATION_ID_DCC = "loc_dcc_sandbox_001";

  const sim = await startLocalRezdyV1Simulator();

  try {
    // =========================================================================
    // 1. Authoritative Payment and Refund Statuses (Missing or unfamiliar -> unresolved; two-phase complete inspected)
    // =========================================================================
    const nonCompletedPaymentCases: Array<{
      label: string;
      sqStatus: any;
      expectedDccStatus: string;
    }> = [
      { label: "APPROVED", sqStatus: "APPROVED", expectedDccStatus: "authorized" },
      { label: "PENDING", sqStatus: "PENDING", expectedDccStatus: "pending" },
      { label: "missing undefined status", sqStatus: undefined, expectedDccStatus: "unresolved" },
      { label: "missing empty string status", sqStatus: "", expectedDccStatus: "unresolved" },
      {
        label: "unfamiliar status",
        sqStatus: "PROCESSING_MANUAL_BANK_REVIEW",
        expectedDccStatus: "unresolved",
      },
    ];

    for (const tc of nonCompletedPaymentCases) {
      const orderId = `ord_status_${tc.label.replace(/\s+/g, "_")}`;
      const payRes = await DccPaymentService.processPayment({
        orderId,
        amount: 399,
        currency: "USD",
        sourceId: "cnon:card-nonce-ok",
        status: "captured", // Caller requests captured, but provider returns non-COMPLETED!
        options: {
          squareClient: {
            payments: {
              create: async (req: any) => ({
                payment: {
                  id: `sq_pay_${req.idempotencyKey}`,
                  ...(tc.sqStatus !== undefined ? { status: tc.sqStatus } : {}),
                  amountMoney: req.amountMoney,
                },
              }),
            },
          },
        },
      });

      assert.equal(
        payRes.status,
        tc.expectedDccStatus,
        `Provider payment with ${tc.label} must record '${tc.expectedDccStatus}', never 'captured'`
      );
      const storedPay = await DccPaymentService.getPaymentByOrderId(orderId);
      assert.equal(storedPay?.status, tc.expectedDccStatus);

      await assert.rejects(
        () =>
          DccPaymentService.assertTraceablePaymentEvidence(
            {
              verified: true,
              provider: "square",
              transactionId: payRes.paymentId,
              capturedAmount: 399,
              currency: "USD",
              capturedAt: payRes.processedAt,
            },
            399,
            { orderId }
          ),
        (err: unknown) =>
          err instanceof OctoApiError &&
          err.status === 422 &&
          err.code === "UNRESOLVED_PAYMENT_EVIDENCE",
        `assertTraceablePaymentEvidence must reject ${tc.label} payment`
      );
    }

    // Two-phase authorization-to-capture path (payments.complete):
    const authOrderId = "ord_two_phase_auth_complete";
    const authRes = await DccPaymentService.processPayment({
      orderId: authOrderId,
      amount: 399,
      currency: "USD",
      sourceId: "cnon:card-nonce-ok",
      status: "authorized",
      options: {
        squareClient: {
          payments: {
            create: async (req: any) => ({
              payment: {
                id: `sq_auth_${req.idempotencyKey}`,
                status: "APPROVED",
                amountMoney: req.amountMoney,
              },
            }),
          },
        },
      },
    });
    assert.equal(authRes.status, "authorized");

    // Attempt capture when payments.complete returns PENDING -> must record "pending", NOT "captured"
    const completePendingRes = await DccPaymentService.processPayment({
      orderId: authOrderId,
      amount: 399,
      currency: "USD",
      sourceId: "cnon:card-nonce-ok",
      status: "captured",
      options: {
        squareClient: {
          payments: {
            complete: async () => ({
              payment: {
                id: authRes.paymentId,
                status: "PENDING",
              },
            }),
          },
        },
      },
    });
    assert.equal(
      completePendingRes.status,
      "pending",
      "Two-phase completion returning PENDING must not record captured"
    );

    // Attempt capture when payments.complete omits status -> must record "unresolved", NOT "captured"
    const authOrderIdMissing = "ord_two_phase_auth_missing_status";
    const authResMissing = await DccPaymentService.processPayment({
      orderId: authOrderIdMissing,
      amount: 399,
      currency: "USD",
      sourceId: "cnon:card-nonce-ok",
      status: "authorized",
      options: {
        squareClient: {
          payments: {
            create: async (req: any) => ({
              payment: {
                id: `sq_auth_missing_${req.idempotencyKey}`,
                status: "APPROVED",
                amountMoney: req.amountMoney,
              },
            }),
          },
        },
      },
    });
    assert.equal(authResMissing.status, "authorized");

    const completeMissingStatusRes = await DccPaymentService.processPayment({
      orderId: authOrderIdMissing,
      amount: 399,
      currency: "USD",
      sourceId: "cnon:card-nonce-ok",
      status: "captured",
      options: {
        squareClient: {
          payments: {
            complete: async () => ({
              payment: {
                id: authResMissing.paymentId,
                // status omitted!
              },
            }),
          },
        },
      },
    });
    assert.equal(
      completeMissingStatusRes.status,
      "unresolved",
      "Two-phase completion missing status must record unresolved, never captured"
    );

    // Now complete with COMPLETED -> transitions to "captured"
    const authOrderIdSuccess = "ord_two_phase_auth_completed";
    const authResSuccess = await DccPaymentService.processPayment({
      orderId: authOrderIdSuccess,
      amount: 399,
      currency: "USD",
      sourceId: "cnon:card-nonce-ok",
      status: "authorized",
      options: {
        squareClient: {
          payments: {
            create: async (req: any) => ({
              payment: {
                id: `sq_auth_ok_${req.idempotencyKey}`,
                status: "APPROVED",
                amountMoney: req.amountMoney,
              },
            }),
          },
        },
      },
    });
    assert.equal(authResSuccess.status, "authorized");

    const completeSuccessRes = await DccPaymentService.processPayment({
      orderId: authOrderIdSuccess,
      amount: 399,
      currency: "USD",
      sourceId: "cnon:card-nonce-ok",
      status: "captured",
      options: {
        squareClient: {
          payments: {
            complete: async () => ({
              payment: {
                id: authResSuccess.paymentId,
                status: "COMPLETED",
              },
            }),
          },
        },
      },
    });
    assert.equal(completeSuccessRes.status, "captured");

    // Refund status tests: PENDING, missing status, or unfamiliar status must NOT record processed or reduce payment balance
    const refundTestOrderId = "ord_refund_status_strict_499";
    await captureTraceableSquarePayment(refundTestOrderId, 499);

    for (const refCase of [
      { label: "PENDING", sqRefundStatus: "PENDING", expectedDccRefundStatus: "pending" },
      { label: "missing status", sqRefundStatus: undefined, expectedDccRefundStatus: "unresolved" },
      {
        label: "unfamiliar status",
        sqRefundStatus: "BANK_QUEUED_UNKNOWN",
        expectedDccRefundStatus: "unresolved",
      },
    ]) {
      const refRes = await DccPaymentService.processRefund({
        orderId: refundTestOrderId,
        operatorSlug: "gosno",
        amount: 200,
        currency: "USD",
        type: "refund",
        reason: `Test ${refCase.label} refund`,
        options: {
          squareClient: {
            refunds: {
              refundPayment: async (req: any) => ({
                refund: {
                  id: `sq_ref_${refCase.label.replace(/\s+/g, "_")}_${req.idempotencyKey}`,
                  ...(refCase.sqRefundStatus !== undefined
                    ? { status: refCase.sqRefundStatus }
                    : {}),
                  amountMoney: req.amountMoney,
                },
              }),
            },
          },
        },
      });

      assert.equal(
        refRes.status,
        refCase.expectedDccRefundStatus,
        `Refund with ${refCase.label} must record '${refCase.expectedDccRefundStatus}', never 'processed'`
      );
      const paymentAfterUnsettledRefund =
        await DccPaymentService.getPaymentByOrderId(refundTestOrderId);
      assert.equal(
        paymentAfterUnsettledRefund?.status,
        "captured",
        `Refund with ${refCase.label} must NOT transition payment to partially_refunded or reduce available balance`
      );

      await assert.rejects(
        () =>
          DccPaymentService.assertTraceableRefundEvidence(
            {
              verified: true,
              provider: "square",
              refundId: refRes.id,
              refundType: "partial",
              refundedAmount: 200,
              currency: "USD",
              refundedAt: refRes.createdAt,
            },
            499,
            "USD",
            { orderId: refundTestOrderId }
          ),
        (err: unknown) =>
          err instanceof OctoApiError &&
          err.status === 422 &&
          err.code === "UNRESOLVED_REFUND_EVIDENCE"
      );
    }

    // =========================================================================
    // 2. Bind Evidence to the Correct Financial Obligation (Prevent Reuse, Over-Allocation, and Refunded Capture)
    // =========================================================================
    const alicePayment = await captureTraceableSquarePayment("dcc:bk:alice_001", 399);

    // 2a. Missing obligation identity fails closed
    await assert.rejects(
      () => DccPaymentService.assertTraceablePaymentEvidence(alicePayment, 399, undefined),
      (err: unknown) =>
        err instanceof OctoApiError &&
        err.status === 422 &&
        err.code === "MISSING_PAYMENT_OBLIGATION_IDENTITY"
    );

    // 2b. Unrelated obligation reuse fails closed with PAYMENT_OBLIGATION_MISMATCH
    await assert.rejects(
      () =>
        DccPaymentService.assertTraceablePaymentEvidence(alicePayment, 399, {
          bookingId: "dcc:bk:bob_002",
          orderId: "ord_bob_002",
        }),
      (err: unknown) =>
        err instanceof OctoApiError &&
        err.status === 422 &&
        err.code === "PAYMENT_OBLIGATION_MISMATCH"
    );

    // 2c. Fully refunded payment evidence rejected as capture evidence (PAYMENT_ALREADY_REFUNDED)
    const refundedOrderKey = "dcc:bk:fully_refunded_399";
    const initiallyCapturedEvidence = await captureTraceableSquarePayment(refundedOrderKey, 399);
    await processTraceableSquareRefund(
      refundedOrderKey,
      "gosno",
      399,
      "full",
      "Full refund before capture reuse attempt"
    );
    const refundedPayRecord = await DccPaymentService.getPaymentByOrderId(refundedOrderKey);
    assert.equal(refundedPayRecord?.status, "refunded");

    await assert.rejects(
      () =>
        DccPaymentService.assertTraceablePaymentEvidence(initiallyCapturedEvidence, 399, {
          bookingId: refundedOrderKey,
        }),
      (err: unknown) =>
        err instanceof OctoApiError &&
        err.status === 422 &&
        err.code === "PAYMENT_ALREADY_REFUNDED",
      "Fully refunded payment must be rejected as capture evidence"
    );

    // 2d. Partially refunded payment where net available funds ($499 - $300 = $199) < expectedAmount ($399) fails closed
    const partialReducedKey = "dcc:bk:partially_refunded_net199";
    const partialReducedCapture = await captureTraceableSquarePayment(partialReducedKey, 499);
    await processTraceableSquareRefund(
      partialReducedKey,
      "gosno",
      300,
      "partial",
      "Refunded $300 leaving $199 net available"
    );
    await assert.rejects(
      () =>
        DccPaymentService.assertTraceablePaymentEvidence(
          { ...partialReducedCapture, capturedAmount: 399 },
          399,
          { bookingId: partialReducedKey }
        ),
      (err: unknown) =>
        err instanceof OctoApiError &&
        err.status === 422 &&
        err.code === "INSUFFICIENT_CAPTURED_PAYMENT"
    );

    // 2e. Cross-obligation over-allocation on a shared multi-item order payment ($500 captured)
    const sharedOrderId = "ord_multi_item_shared_500";
    const sharedOrderCapture = await captureTraceableSquarePayment(sharedOrderId, 500);

    // First booking item on sharedOrderId allocates $300 of $500 -> succeeds
    const alloc1 = await DccPaymentService.assertTraceablePaymentEvidence(
      { ...sharedOrderCapture, capturedAmount: 300 },
      300,
      { orderId: sharedOrderId, bookingId: "dcc:bk:multi_item_1" }
    );
    assert.equal(alloc1.capturedAmount, 300);

    // Second booking item on sharedOrderId attempts to allocate $300 ($300 + $300 = $600 > $500) -> fails with PAYMENT_OVERALLOCATED
    await assert.rejects(
      () =>
        DccPaymentService.assertTraceablePaymentEvidence(
          { ...sharedOrderCapture, capturedAmount: 300 },
          300,
          { orderId: sharedOrderId, bookingId: "dcc:bk:multi_item_2" }
        ),
      (err: unknown) =>
        err instanceof OctoApiError &&
        err.status === 422 &&
        err.code === "PAYMENT_OVERALLOCATED"
    );

    // Allocating the remaining $200 ($300 + $200 = $500 <= $500) to item 2 succeeds
    const alloc2 = await DccPaymentService.assertTraceablePaymentEvidence(
      { ...sharedOrderCapture, capturedAmount: 200 },
      200,
      { orderId: sharedOrderId, bookingId: "dcc:bk:multi_item_2" }
    );
    assert.equal(alloc2.capturedAmount, 200);

    // =========================================================================
    // 3. Fix Lock Takeover (Never Delete Active Slow Worker Lock After 120 Polls) & Prove Postgres Constraint
    // =========================================================================
    const { getDb } = await import("../../lib/db/client");
    const { octoBookings } = await import("../../lib/db/schema");
    const { eq } = await import("drizzle-orm");
    const db = getDb()!;
    assert.ok(db);

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
    const activeSlowWorkerIdemKey = "idem_slow_worker_active_lease_001";
    const slowSeed = crypto.createHash("sha256").update(activeSlowWorkerIdemKey).digest("hex");
    const slowUuid = `${slowSeed.slice(0, 8)}-${slowSeed.slice(8, 12)}-4${slowSeed.slice(13, 16)}-a${slowSeed.slice(17, 20)}-${slowSeed.slice(20, 32)}`;
    const slowDccId = `dcc:bk:${slowUuid.slice(0, 12)}`;
    const slowPayloadRow = {
      productId: "dcc:gosno:den-breckenridge:suv",
      optionId: "opt_suburban_69029050",
      availabilityId: slotBreck,
      unitItems: [{ unitId: "unit_suburban_69029050", quantity: 1 }],
    };
    const slowPayloadHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(slowPayloadRow))
      .digest("hex");

    // Insert an active HOLD_IN_PROGRESS row owned by a slow worker whose lease is valid for another 60 seconds
    await db.insert(octoBookings).values({
      id: slowDccId,
      bookingUuid: slowUuid,
      idempotencyKey: activeSlowWorkerIdemKey,
      idempotencyHash: slowPayloadHash,
      supplierConnectionId: "conn_gosno_rezdy",
      resellerId: null,
      productId: slowPayloadRow.productId,
      optionId: slowPayloadRow.optionId,
      availabilityId: slowPayloadRow.availabilityId,
      status: "HOLD_IN_PROGRESS",
      expirationMinutes: 15,
      utcHoldExpires: null,
      totalPrice: "0.00",
      currency: "USD",
      unitItems: slowPayloadRow.unitItems as any,
      contact: {
        firstName: "Slow",
        lastName: "Worker",
        emailAddress: "slow@example.com",
        __dccMeta: {
          lockOwnerId: "slow-worker-pid:active-owner",
          lockLeaseExpiresAt: Date.now() + 60_000, // Lease is active!
        },
      },
      supplierReference: null,
      resellerReference: slowDccId,
      checkoutUrl: null,
    });

    // Run all 120 polling attempts (with fast 5ms interval for test speed) while the slow worker's lease is active
    process.env.DCC_IDEMPOTENCY_MAX_POLL_ATTEMPTS = "120";
    process.env.DCC_IDEMPOTENCY_POLL_INTERVAL_MS = "5";
    try {
      await assert.rejects(
        () =>
          DccBookingService.createHold({
            supplierConnectionId: "conn_gosno_rezdy",
            productId: slowPayloadRow.productId,
            optionId: slowPayloadRow.optionId,
            availabilityId: slowPayloadRow.availabilityId,
            expirationMinutes: 15,
            unitItems: slowPayloadRow.unitItems,
            idempotencyKey: activeSlowWorkerIdemKey,
            contact: {
              firstName: "Slow",
              lastName: "Worker",
              emailAddress: "slow@example.com",
            },
          }),
        (err: unknown) =>
          err instanceof OctoApiError &&
          err.status === 409 &&
          err.code === "IDEMPOTENCY_LOCK_ACTIVE",
        "After 120 polling attempts, an active slow worker's HOLD_IN_PROGRESS lock must NOT be deleted or taken over"
      );
    } finally {
      delete process.env.DCC_IDEMPOTENCY_MAX_POLL_ATTEMPTS;
      delete process.env.DCC_IDEMPOTENCY_POLL_INTERVAL_MS;
    }

    // Verify the slow worker's HOLD_IN_PROGRESS row was NOT deleted and zero provider bookings were created by the second worker
    const stillHeldRows = await db
      .select()
      .from(octoBookings)
      .where(eq(octoBookings.id, slowDccId));
    assert.equal(stillHeldRows.length, 1, "Active slow worker's HOLD_IN_PROGRESS row must still exist");
    assert.equal(stillHeldRows[0].status, "HOLD_IN_PROGRESS");
    assert.equal(
      (stillHeldRows[0].contact as any)?.__dccMeta?.lockOwnerId,
      "slow-worker-pid:active-owner"
    );
    assert.equal(sim.getOrders().length, 0, "Contending worker must not call provider while slow worker owns lock");

    // Now simulate that the previous worker died and its lease has expired (lockLeaseExpiresAt in the past)
    await db
      .update(octoBookings)
      .set({
        contact: {
          firstName: "Slow",
          lastName: "Worker",
          emailAddress: "slow@example.com",
          __dccMeta: {
            lockOwnerId: "dead-worker-pid:expired-owner",
            lockLeaseExpiresAt: Date.now() - 1000, // Lease is now EXPIRED!
          },
        },
      })
      .where(eq(octoBookings.id, slowDccId));

    const reclaimedHold = await DccBookingService.createHold({
      supplierConnectionId: "conn_gosno_rezdy",
      productId: slowPayloadRow.productId,
      optionId: slowPayloadRow.optionId,
      availabilityId: slowPayloadRow.availabilityId,
      expirationMinutes: 15,
      unitItems: slowPayloadRow.unitItems,
      idempotencyKey: activeSlowWorkerIdemKey,
      contact: {
        firstName: "Slow",
        lastName: "Worker",
        emailAddress: "slow@example.com",
      },
    });
    assert.equal(reclaimedHold.dccBookingId, slowDccId);
    assert.equal(reclaimedHold.status, "ON_HOLD");
    assert.equal(sim.getOrders().length, 1);

    // Prove the Production Postgres Migration & Constraint (drizzle/0008_octo_bookings_idempotency_unique_idx.sql + Postgres pg_indexes + 23505 enforcement)
    const migration0008Path = path.join(
      process.cwd(),
      "drizzle/0008_octo_bookings_idempotency_unique_idx.sql"
    );
    assert.ok(
      fs.existsSync(migration0008Path),
      "Production Postgres migration drizzle/0008_octo_bookings_idempotency_unique_idx.sql must exist"
    );
    const migration0008Sql = fs.readFileSync(migration0008Path, "utf8");
    assert.match(
      migration0008Sql,
      /CREATE UNIQUE INDEX IF NOT EXISTS "octo_bookings_idempotency_key_uidx"\s+ON "octo_bookings" \("idempotency_key"\);/
    );

    // If Neon Postgres DATABASE_URL (in env or .env.local) or CI Postgres (DCC_CI_POSTGRES_URL) is available, prove the constraint directly in Postgres!
    let neonPgUrl = process.env.DATABASE_URL || "";
    if (!neonPgUrl) {
      const envLocalPath = path.join(process.cwd(), ".env.local");
      if (fs.existsSync(envLocalPath)) {
        const envText = fs.readFileSync(envLocalPath, "utf8");
        const m = envText.match(/^DATABASE_URL=["']?([^"'\r\n]+)["']?/m);
        if (m) neonPgUrl = m[1].trim();
      }
    }

    if (neonPgUrl && neonPgUrl.startsWith("postgres")) {
      const { neon } = await import("@neondatabase/serverless");
      const pgSql = neon(neonPgUrl);
      const pgIndexRows = await pgSql`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'octo_bookings'
          AND indexname = 'octo_bookings_idempotency_key_uidx'
      `;
      assert.equal(
        pgIndexRows.length,
        1,
        "octo_bookings_idempotency_key_uidx must exist in Postgres pg_indexes"
      );
      assert.match(
        String(pgIndexRows[0].indexdef),
        /CREATE UNIQUE INDEX octo_bookings_idempotency_key_uidx ON public\.octo_bookings USING btree \(idempotency_key\)/i
      );

      const pgTestId1 = `dcc:bk:pg_uidx_proof_1_${Date.now()}`;
      const pgTestId2 = `dcc:bk:pg_uidx_proof_2_${Date.now()}`;
      const pgTestIdemKey = `idem_pg_uidx_proof_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      try {
        await pgSql`
          INSERT INTO octo_bookings (
            id, booking_uuid, idempotency_key, idempotency_hash,
            supplier_connection_id, product_id, option_id, availability_id,
            status, expiration_minutes, total_price, currency
          ) VALUES (
            ${pgTestId1}, ${crypto.randomUUID()}, ${pgTestIdemKey}, 'hash_1',
            'conn_gosno_rezdy', 'dcc:gosno:den-breckenridge:suv', 'opt_suburban_69029050', ${slotBreck},
            'HOLD_IN_PROGRESS', 15, 0.00, 'USD'
          )
        `;

        let pgDuplicateErr: any = null;
        try {
          await pgSql`
            INSERT INTO octo_bookings (
              id, booking_uuid, idempotency_key, idempotency_hash,
              supplier_connection_id, product_id, option_id, availability_id,
              status, expiration_minutes, total_price, currency
            ) VALUES (
              ${pgTestId2}, ${crypto.randomUUID()}, ${pgTestIdemKey}, 'hash_1',
              'conn_gosno_rezdy', 'dcc:gosno:den-breckenridge:suv', 'opt_suburban_69029050', ${slotBreck},
              'HOLD_IN_PROGRESS', 15, 0.00, 'USD'
            )
          `;
        } catch (err: any) {
          pgDuplicateErr = err;
        }
        assert.ok(
          pgDuplicateErr,
          "Postgres must reject duplicate idempotency_key insert on octo_bookings"
        );
        assert.equal(
          pgDuplicateErr.code,
          "23505",
          "Postgres unique constraint violation must return SQLSTATE 23505"
        );
      } finally {
        await pgSql`DELETE FROM octo_bookings WHERE id IN (${pgTestId1}, ${pgTestId2})`;
      }
    }

    if (process.env.DCC_CI_POSTGRES_URL) {
      const ciIdemKey = `idem_ci_pg_${Date.now()}`;
      const ciSql = `
        INSERT INTO octo_bookings (id, booking_uuid, idempotency_key, supplier_connection_id, product_id, option_id, availability_id, status, total_price)
        VALUES ('dcc:bk:ci_pg_1', 'uuid_ci_pg_1', '${ciIdemKey}', 'conn_gosno_rezdy', 'p1', 'o1', 'a1', 'HOLD_IN_PROGRESS', 0);
        INSERT INTO octo_bookings (id, booking_uuid, idempotency_key, supplier_connection_id, product_id, option_id, availability_id, status, total_price)
        VALUES ('dcc:bk:ci_pg_2', 'uuid_ci_pg_2', '${ciIdemKey}', 'conn_gosno_rezdy', 'p1', 'o1', 'a1', 'HOLD_IN_PROGRESS', 0);
      `;
      await assert.rejects(
        () =>
          execFileAsync("psql", [
            process.env.DCC_CI_POSTGRES_URL!,
            "-v",
            "ON_ERROR_STOP=1",
            "-c",
            ciSql,
          ]),
        (err: any) =>
          String(err?.stderr || err?.message || "").includes(
            "octo_bookings_idempotency_key_uidx"
          ),
        "CI PostgreSQL 16 must enforce unique constraint octo_bookings_idempotency_key_uidx"
      );
    }

    // =========================================================================
    // 4. Completed-Booking Commission Rule (No Commission on Cancelled Uncompleted Bookings Without Explicit Policy)
    // =========================================================================
    const cancelledNoRefundBookingId = "dcc:bk:cancel_no_refund_399";
    const captureNoRefund = await captureTraceableSquarePayment(cancelledNoRefundBookingId, 399);
    await DccSettlementEngine.recordBookingSettlement({
      bookingId: cancelledNoRefundBookingId,
      orderId: cancelledNoRefundBookingId,
      dccReference: cancelledNoRefundBookingId,
      operatorSlug: "gosno",
      operatorName: "GoSno Mountain Transportation",
      currency: "USD",
      grossAmount: 399,
      commissionPercent: 10,
      paymentStatus: "captured",
      verifiedPaymentEvidence: captureNoRefund,
      serviceCompletionStatus: "scheduled",
    });

    // Cancelled with no refund ($399 retained) while service was NOT completed -> $0 DCC commission, $399 operator share
    const afterNoRefundCancel = await DccSettlementEngine.recordCancellationSettlement({
      ledgerId: `dcc:ledg:${cancelledNoRefundBookingId.replace(/^dcc:bk:/, "")}`,
      bookingId: cancelledNoRefundBookingId,
      refundType: "none",
      refundAmount: 0,
      isBookingCancelled: true,
    });
    assert.ok(afterNoRefundCancel);
    assert.equal(afterNoRefundCancel.dccShareAmount, 0);
    assert.equal(afterNoRefundCancel.operatorShareAmount, 399);
    assert.equal(afterNoRefundCancel.commissionEligibilityStatus, "ineligible_cancelled");

    // Only when an explicit cancellation-penalty commission policy is agreed does a cancelled penalty award commission
    const afterExplicitPenaltyPolicy = await DccSettlementEngine.recordCancellationSettlement({
      ledgerId: `dcc:ledg:${cancelledNoRefundBookingId.replace(/^dcc:bk:/, "")}`,
      bookingId: cancelledNoRefundBookingId,
      refundType: "none",
      refundAmount: 0,
      isBookingCancelled: true,
      allowCancellationPenaltyCommission: true,
      cancellationPenaltyCommissionPercent: 10,
    });
    assert.ok(afterExplicitPenaltyPolicy);
    assert.equal(afterExplicitPenaltyPolicy.dccShareAmount, 39.9);
    assert.equal(afterExplicitPenaltyPolicy.operatorShareAmount, 359.1);
    assert.equal(
      afterExplicitPenaltyPolicy.commissionEligibilityStatus,
      "adjusted_partial_refund"
    );
  } finally {
    if (prevToken !== undefined) process.env.SQUARE_ACCESS_TOKEN = prevToken;
    else delete process.env.SQUARE_ACCESS_TOKEN;
    if (prevLoc !== undefined) process.env.SQUARE_LOCATION_ID_DCC = prevLoc;
    else delete process.env.SQUARE_LOCATION_ID_DCC;
    await sim.close();
  }
});

// ============================================================================
// GATE 9: Atomic Concurrent Payment Allocation, Atomic Lock Ownership Enforcement, & Non-Destructive Duplicate Reconciliation
// ============================================================================
test("Gate 9: Concurrent $60+$60 allocations on $100 payment fail closed atomically, lock ownership is enforced in DB across renewal/takeover/cleanup/finalization, and duplicate migration is non-destructive", async () => {
  setupCleanSqliteEnvironment();
  const sim = await startLocalRezdyV1Simulator();
  const prevToken = process.env.SQUARE_ACCESS_TOKEN;
  const prevLoc = process.env.SQUARE_LOCATION_ID_DCC;
  process.env.SQUARE_ACCESS_TOKEN = "sq_sandbox_gate9_token";
  process.env.SQUARE_LOCATION_ID_DCC = "loc_sandbox_gate9";

  try {
    const {
      getDb,
      setSimulateDbFailureForTests,
      setSimulateDbReadFailureForTests,
    } = await import("../../lib/db/client");
    const {
      octoBookings,
      octoBookingIdempotencyConflicts,
      dccPaymentAllocations,
    } = await import("../../lib/db/schema");
    const {
      ensureEarthosSchema,
      resetEarthosSchemaEnsuredForTests,
      inspectOctoBookingIdempotencyDuplicates,
      reconcileOctoBookingIdempotencyDuplicates,
    } = await import("../../lib/dcc/earthos/ensureEarthosSchema");
    const { and, eq, sql } = await import("drizzle-orm");
    const db = getDb()!;
    assert.ok(db);

    // =========================================================================
    // 1. Concurrent Payment Allocations Cannot Exceed Captured Money & DB Errors Fail Closed
    // =========================================================================
    const sharedOrder100 = "ord_concurrent_100";
    const capture100 = await captureTraceableSquarePayment(sharedOrder100, 100);

    // Run two simultaneous $60 allocations against the single $100 payment via Promise.all
    const concurrentResults = await Promise.allSettled([
      DccPaymentService.assertTraceablePaymentEvidence(
        { ...capture100, capturedAmount: 60 },
        60,
        { orderId: sharedOrder100, bookingId: "dcc:bk:concurrent_60_a" }
      ),
      DccPaymentService.assertTraceablePaymentEvidence(
        { ...capture100, capturedAmount: 60 },
        60,
        { orderId: sharedOrder100, bookingId: "dcc:bk:concurrent_60_b" }
      ),
    ]);

    const fulfilled60 = concurrentResults.filter((r) => r.status === "fulfilled");
    const rejected60 = concurrentResults.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected"
    );

    assert.equal(
      fulfilled60.length,
      1,
      "Exactly one of two simultaneous $60 allocations against a $100 payment may succeed"
    );
    assert.equal(
      rejected60.length,
      1,
      "The competing simultaneous $60 allocation must be rejected"
    );
    assert.ok(
      rejected60[0].reason instanceof OctoApiError &&
        rejected60[0].reason.status === 422 &&
        rejected60[0].reason.code === "PAYMENT_OVERALLOCATED",
      `Expected 422 PAYMENT_OVERALLOCATED, got ${rejected60[0].reason}`
    );

    // Verify durable dcc_payment_allocations table in DB reflects $60 (6000 cents), never $120
    const allocRowsAfter60 = await db
      .select()
      .from(dccPaymentAllocations)
      .where(eq(dccPaymentAllocations.paymentId, capture100.transactionId));
    const totalSentinelRow = allocRowsAfter60.find(
      (r) => r.obligationKey === "__PAYMENT_TOTAL__"
    );
    assert.ok(totalSentinelRow, "__PAYMENT_TOTAL__ budget sentinel row must exist in dcc_payment_allocations");
    assert.equal(
      Number(totalSentinelRow.allocatedAmountCents),
      6000,
      "Durable __PAYMENT_TOTAL__ allocation must equal 6000 cents ($60.00)"
    );

    // Even after simulated process restart (clearing all in-memory maps), durable DB allocation prevents a second $60 allocation
    DccPaymentService.clearInMemoryStoresForProcessRestartSimulation();
    await assert.rejects(
      () =>
        DccPaymentService.assertTraceablePaymentEvidence(
          { ...capture100, capturedAmount: 60 },
          60,
          { orderId: sharedOrder100, bookingId: "dcc:bk:concurrent_60_c" }
        ),
      (err: unknown) =>
        err instanceof OctoApiError &&
        err.status === 422 &&
        err.code === "PAYMENT_OVERALLOCATED",
      "Durable DB allocation must survive process restart and reject $60 allocation when $60 of $100 is already reserved"
    );

    // Race a $40 allocation ($60 + $40 = $100 <= $100) against a $41 allocation ($60 + $41 = $101 > $100)
    const remainderResults = await Promise.allSettled([
      DccPaymentService.assertTraceablePaymentEvidence(
        { ...capture100, capturedAmount: 40 },
        40,
        { orderId: sharedOrder100, bookingId: "dcc:bk:concurrent_40_valid" }
      ),
      DccPaymentService.assertTraceablePaymentEvidence(
        { ...capture100, capturedAmount: 41 },
        41,
        { orderId: sharedOrder100, bookingId: "dcc:bk:concurrent_41_excess" }
      ),
    ]);
    assert.equal(remainderResults[0].status, "fulfilled", "$40 remaining allocation must succeed");
    assert.equal(remainderResults[1].status, "rejected", "$41 allocation must fail closed");

    const finalSentinelRows = await db
      .select()
      .from(dccPaymentAllocations)
      .where(
        and(
          eq(dccPaymentAllocations.paymentId, capture100.transactionId),
          eq(dccPaymentAllocations.obligationKey, "__PAYMENT_TOTAL__")
        )
      );
    assert.equal(Number(finalSentinelRows[0].allocatedAmountCents), 10000);

    // Prove that database read or write errors during assertTraceablePaymentEvidence fail closed (never ignored)
    setSimulateDbReadFailureForTests(true);
    try {
      await assert.rejects(
        () =>
          DccPaymentService.assertTraceablePaymentEvidence(
            { ...capture100, capturedAmount: 40 },
            40,
            { orderId: sharedOrder100, bookingId: "dcc:bk:concurrent_40_valid" }
          ),
        (err: unknown) =>
          err instanceof OctoApiError &&
          err.status === 503 &&
          err.code === "PAYMENT_ALLOCATION_PERSISTENCE_FAILED",
        "Database read failure during allocation check must fail closed with 503 PAYMENT_ALLOCATION_PERSISTENCE_FAILED"
      );
    } finally {
      setSimulateDbReadFailureForTests(false);
    }

    const orderWriteFail = "ord_alloc_write_fail_100";
    const captureWriteFail = await captureTraceableSquarePayment(orderWriteFail, 100);
    setSimulateDbFailureForTests(true);
    try {
      await assert.rejects(
        () =>
          DccPaymentService.assertTraceablePaymentEvidence(
            captureWriteFail,
            100,
            { orderId: orderWriteFail, bookingId: "dcc:bk:write_fail_bk" }
          ),
        (err: unknown) =>
          err instanceof OctoApiError &&
          err.status === 503 &&
          err.code === "PAYMENT_ALLOCATION_PERSISTENCE_FAILED",
        "Database write failure during allocation reservation must fail closed with 503 PAYMENT_ALLOCATION_PERSISTENCE_FAILED"
      );
    } finally {
      setSimulateDbFailureForTests(false);
    }

    // =========================================================================
    // 2. Atomic Lock Ownership Enforcement Across Renewal, Takeover, Cleanup, and Finalization
    // =========================================================================
    const slotBreck = formatCanonicalRezdySlotId("P7477S", 497020486, "2026-11-12T10:53:00");
    const casLockIdemKey = "idem_atomic_cas_ownership_001";
    const casSeed = crypto.createHash("sha256").update(casLockIdemKey).digest("hex");
    const casUuid = `${casSeed.slice(0, 8)}-${casSeed.slice(8, 12)}-4${casSeed.slice(13, 16)}-a${casSeed.slice(17, 20)}-${casSeed.slice(20, 32)}`;
    const casDccId = `dcc:bk:${casUuid.slice(0, 12)}`;
    const staleOwnerA = "worker-a:stale-owner-001";
    const replacementOwnerB = "worker-b:replacement-002";
    const replacementOwnerC = "worker-c:replacement-003";
    const expiredLeaseDate = new Date(Date.now() - 2000);

    // Seed an expired HOLD_IN_PROGRESS row owned by staleOwnerA
    await db.insert(octoBookings).values({
      id: casDccId,
      bookingUuid: casUuid,
      idempotencyKey: casLockIdemKey,
      idempotencyHash: "hash_cas_001",
      supplierConnectionId: "conn_gosno_rezdy",
      resellerId: null,
      productId: "dcc:gosno:den-breckenridge:suv",
      optionId: "opt_suburban_69029050",
      availabilityId: slotBreck,
      status: "HOLD_IN_PROGRESS",
      expirationMinutes: 15,
      utcHoldExpires: expiredLeaseDate,
      totalPrice: "0.00",
      currency: "USD",
      unitItems: [{ unitId: "unit_suburban_69029050", quantity: 1 }] as any,
      contact: {
        firstName: "Worker",
        lastName: "A",
        __dccMeta: {
          lockOwnerId: staleOwnerA,
          lockLeaseExpiresAt: expiredLeaseDate.getTime(),
        },
      },
      supplierReference: null,
      resellerReference: staleOwnerA,
      checkoutUrl: null,
    });

    // 2a. Two replacement workers (Worker B and Worker C) race to take over Worker A's expired lock via atomic CAS UPDATE
    const [takeoverB, takeoverC] = await Promise.all([
      DccBookingService.attemptExpiredIdempotencyLockTakeover({
        dccBookingId: casDccId,
        staleOwnerId: staleOwnerA,
        expectedExpiredUtcHoldExpires: expiredLeaseDate,
        newOwnerId: replacementOwnerB,
        bookingUuid: casUuid,
        lockLeaseDurationMs: 30_000,
        contact: { firstName: "Worker", lastName: "B" },
      }),
      DccBookingService.attemptExpiredIdempotencyLockTakeover({
        dccBookingId: casDccId,
        staleOwnerId: staleOwnerA,
        expectedExpiredUtcHoldExpires: expiredLeaseDate,
        newOwnerId: replacementOwnerC,
        bookingUuid: casUuid,
        lockLeaseDurationMs: 30_000,
        contact: { firstName: "Worker", lastName: "C" },
      }),
    ]);

    assert.equal(
      Number(takeoverB) + Number(takeoverC),
      1,
      "Exactly one replacement worker may win the atomic CAS takeover of staleOwnerA's expired lock"
    );
    const winningOwner = takeoverB ? replacementOwnerB : replacementOwnerC;

    const afterTakeoverRows = await db
      .select()
      .from(octoBookings)
      .where(eq(octoBookings.id, casDccId));
    assert.equal(afterTakeoverRows.length, 1);
    assert.equal(afterTakeoverRows[0].status, "HOLD_IN_PROGRESS");
    assert.equal(afterTakeoverRows[0].resellerReference, winningOwner);
    assert.equal((afterTakeoverRows[0].contact as any)?.__dccMeta?.lockOwnerId, winningOwner);

    // 2b. Stale Worker A wakes up and attempts a late heartbeat renewal -> rejected by DB ownership check
    const staleHeartbeatRenewed = await DccBookingService.renewIdempotencyLockLease({
      dccBookingId: casDccId,
      lockOwnerId: staleOwnerA,
      lockLeaseDurationMs: 30_000,
      contact: { firstName: "Stale", lastName: "A" },
    });
    assert.equal(
      staleHeartbeatRenewed,
      false,
      "Stale Worker A's heartbeat renewal must match 0 rows and return false after takeover"
    );

    // Winning replacement worker's heartbeat renewal succeeds
    const winningHeartbeatRenewed = await DccBookingService.renewIdempotencyLockLease({
      dccBookingId: casDccId,
      lockOwnerId: winningOwner,
      lockLeaseDurationMs: 30_000,
      contact: { firstName: "Winning", lastName: "Worker" },
    });
    assert.equal(
      winningHeartbeatRenewed,
      true,
      "Current lock owner's heartbeat renewal must succeed"
    );

    // 2c. Stale Worker A wakes up and attempts error cleanup (releaseIdempotencyLockOnError) -> deletes 0 rows
    const staleDeletedCount = await DccBookingService.releaseIdempotencyLockOnError({
      dccBookingId: casDccId,
      lockOwnerId: staleOwnerA,
    });
    assert.equal(
      staleDeletedCount,
      0,
      "Stale Worker A's error cleanup must NOT delete the replacement worker's lock row"
    );

    const stillOwnedAfterStaleCleanup = await db
      .select()
      .from(octoBookings)
      .where(eq(octoBookings.id, casDccId));
    assert.equal(stillOwnedAfterStaleCleanup.length, 1);
    assert.equal(stillOwnedAfterStaleCleanup[0].resellerReference, winningOwner);

    // 2d. Stale Worker A attempts to finalize the lock row to ON_HOLD -> updates 0 rows
    const staleFinalized = await DccBookingService.finalizeIdempotencyLockHold({
      dccBookingId: casDccId,
      lockOwnerId: staleOwnerA,
      bookingUuid: casUuid,
      expirationMinutes: 15,
      utcHoldExpires: new Date(Date.now() + 900_000),
      totalPrice: 399,
      currency: "USD",
      unitItems: [{ unitId: "unit_suburban_69029050", quantity: 1 }],
      packedContact: { firstName: "Stale", lastName: "A" },
      supplierReference: "RZD-STALE-A",
      resellerReference: casDccId,
      checkoutUrl: null,
    });
    assert.equal(
      staleFinalized,
      false,
      "Stale Worker A must NOT be able to finalize a lock owned by the replacement worker"
    );

    // Winning replacement worker finalizes the lock row to ON_HOLD -> succeeds
    const winnerFinalized = await DccBookingService.finalizeIdempotencyLockHold({
      dccBookingId: casDccId,
      lockOwnerId: winningOwner,
      bookingUuid: casUuid,
      expirationMinutes: 15,
      utcHoldExpires: new Date(Date.now() + 900_000),
      totalPrice: 399,
      currency: "USD",
      unitItems: [{ unitId: "unit_suburban_69029050", quantity: 1 }],
      packedContact: { firstName: "Winning", lastName: "Worker" },
      supplierReference: "RZD-WINNER-B",
      resellerReference: casDccId,
      checkoutUrl: null,
    });
    assert.equal(winnerFinalized, true);

    // Even after winningOwner finalized to ON_HOLD, a late stale Worker A finalization still returns false and cannot overwrite RZD-WINNER-B
    const lateStaleFinalized = await DccBookingService.finalizeIdempotencyLockHold({
      dccBookingId: casDccId,
      lockOwnerId: staleOwnerA,
      bookingUuid: casUuid,
      expirationMinutes: 15,
      utcHoldExpires: new Date(Date.now() + 900_000),
      totalPrice: 399,
      currency: "USD",
      unitItems: [{ unitId: "unit_suburban_69029050", quantity: 1 }],
      packedContact: { firstName: "Stale", lastName: "A" },
      supplierReference: "RZD-STALE-A",
      resellerReference: casDccId,
      checkoutUrl: null,
    });
    assert.equal(lateStaleFinalized, false);

    const finalizedRow = (
      await db.select().from(octoBookings).where(eq(octoBookings.id, casDccId))
    )[0];
    assert.equal(finalizedRow.status, "ON_HOLD");
    assert.equal(finalizedRow.supplierReference, "RZD-WINNER-B");

    // 2e. Full end-to-end slow-worker vs replacement-worker createHold proof:
    // Worker 1 acquires lock, creates upstream booking, then stalls while its lease is artificially expired in DB;
    // Worker 2 takes over via CAS, reconciles the upstream booking via findBookingByResellerReference, and finalizes ON_HOLD;
    // Worker 1 then resumes and fails with 409 IDEMPOTENCY_LOCK_LOST WITHOUT cancelling Worker 2's reconciled upstream booking!
    let releaseStalledWorker1!: () => void;
    const worker1StallPromise = new Promise<void>((resolve) => {
      releaseStalledWorker1 = resolve;
    });
    let worker1EnteredStall!: () => void;
    const worker1ReadyForTakeover = new Promise<void>((resolve) => {
      worker1EnteredStall = resolve;
    });

    const baseAdapter = new RezdyAdapter({
      endpoint: sim.baseUrl,
      apiKey: sim.apiKey,
      platform: "rezdy",
      operatorSlug: "gosno",
      isSandbox: true,
    });

    let createBookingHoldCallCount = 0;
    let cancelBookingCallCount = 0;
    const customStallingAdapter: any = {
      checkAvailability: (...args: any[]) => (baseAdapter as any).checkAvailability(...args),
      confirmBooking: (...args: any[]) => (baseAdapter as any).confirmBooking(...args),
      getBooking: (...args: any[]) => (baseAdapter as any).getBooking(...args),
      cancelBooking: async (...args: any[]) => {
        cancelBookingCallCount++;
        return (baseAdapter as any).cancelBooking(...args);
      },
      createBookingHold: async (req: any, idemKey?: string) => {
        createBookingHoldCallCount++;
        const hold = await baseAdapter.createBookingHold(req, idemKey);
        if (createBookingHoldCallCount === 1) {
          worker1EnteredStall();
          await worker1StallPromise;
        }
        return hold;
      },
    };

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
      adapter: customStallingAdapter,
    });

    const e2eRaceIdemKey = "idem_e2e_stale_vs_replacement_001";
    const e2eSeed = crypto.createHash("sha256").update(e2eRaceIdemKey).digest("hex");
    const e2eUuid = `${e2eSeed.slice(0, 8)}-${e2eSeed.slice(8, 12)}-4${e2eSeed.slice(13, 16)}-a${e2eSeed.slice(17, 20)}-${e2eSeed.slice(20, 32)}`;
    const e2eDccId = `dcc:bk:${e2eUuid.slice(0, 12)}`;

    const worker1Promise = DccBookingService.createHold({
      supplierConnectionId: "conn_gosno_rezdy",
      productId: "dcc:gosno:den-breckenridge:suv",
      optionId: "opt_suburban_69029050",
      availabilityId: slotBreck,
      expirationMinutes: 15,
      unitItems: [{ unitId: "unit_suburban_69029050", quantity: 1 }],
      idempotencyKey: e2eRaceIdemKey,
      contact: {
        firstName: "Race",
        lastName: "Traveler",
        emailAddress: "race@example.com",
      },
    });

    await worker1ReadyForTakeover;
    // Simulate cross-process contention by clearing the in-process map entry while Worker 1 is stalled in flight,
    // and expiring Worker 1's DB lease so Worker 2 takes over via DB CAS
    DccBookingService.clearInMemoryStoresOnlyForTests();
    const expiredPast = new Date(Date.now() - 5000);
    await db
      .update(octoBookings)
      .set({
        utcHoldExpires: expiredPast,
        contact: {
          firstName: "Race",
          lastName: "Traveler",
          emailAddress: "race@example.com",
          __dccMeta: {
            lockOwnerId: "stalled-worker-1",
            lockLeaseExpiresAt: expiredPast.getTime(),
          },
        },
        resellerReference: "stalled-worker-1",
      })
      .where(eq(octoBookings.id, e2eDccId));

    // Worker 2 takes over the expired lock, reconciles the upstream Rezdy booking, and finalizes ON_HOLD
    const worker2Result = await DccBookingService.createHold({
      supplierConnectionId: "conn_gosno_rezdy",
      productId: "dcc:gosno:den-breckenridge:suv",
      optionId: "opt_suburban_69029050",
      availabilityId: slotBreck,
      expirationMinutes: 15,
      unitItems: [{ unitId: "unit_suburban_69029050", quantity: 1 }],
      idempotencyKey: e2eRaceIdemKey,
      contact: {
        firstName: "Race",
        lastName: "Traveler",
        emailAddress: "race@example.com",
      },
    });
    assert.equal(worker2Result.dccBookingId, e2eDccId);
    assert.equal(worker2Result.status, "ON_HOLD");
    assert.equal(
      sim.getOrders().length,
      1,
      "Worker 2 must reconcile Worker 1's upstream booking via resellerReference without creating a duplicate upstream booking"
    );

    // Now release stalled Worker 1 and verify it fails with 409 IDEMPOTENCY_LOCK_LOST and does NOT cancel Worker 2's upstream booking
    releaseStalledWorker1();
    await assert.rejects(
      () => worker1Promise,
      (err: unknown) =>
        err instanceof OctoApiError &&
        err.status === 409 &&
        err.code === "IDEMPOTENCY_LOCK_LOST",
      "Stale Worker 1 must fail with 409 IDEMPOTENCY_LOCK_LOST when attempting to finalize after Worker 2 took over"
    );
    assert.equal(
      cancelBookingCallCount,
      0,
      "Stale Worker 1 must NOT cancel the upstream Rezdy booking that Worker 2 reconciled and owns"
    );
    assert.equal(sim.getOrders().length, 1);
    assert.equal(sim.getOrders()[0].status, "PROCESSING");

    // =========================================================================
    // 3. Non-Destructive Duplicate Detection, Conflict Report Preservation When Migration Activation Is Blocked, & Explicit Reconciliation
    // =========================================================================
    const migration0008Sql = fs.readFileSync(
      path.join(process.cwd(), "drizzle/0008_octo_bookings_idempotency_unique_idx.sql"),
      "utf8"
    );
    const ensureEarthosSrc = fs.readFileSync(
      path.join(process.cwd(), "lib/dcc/earthos/ensureEarthosSchema.ts"),
      "utf8"
    );
    assert.equal(
      /DELETE\s+FROM\s+"?octo_bookings"?/i.test(migration0008Sql),
      false,
      "drizzle/0008_octo_bookings_idempotency_unique_idx.sql must NOT contain any automatic DELETE FROM octo_bookings"
    );
    assert.equal(
      /DELETE\s+FROM\s+"?octo_bookings"?/i.test(ensureEarthosSrc),
      false,
      "lib/dcc/earthos/ensureEarthosSchema.ts must NOT contain any automatic DELETE FROM octo_bookings"
    );

    // Temporarily drop the unique index in the isolated SQLite test DB to simulate a legacy pre-0008 table with duplicates
    await db.execute(sql`DROP INDEX IF EXISTS "octo_bookings_idempotency_key_uidx"; -- octo_bookings`);

    const dupIdemKey = "idem_legacy_duplicate_conflict_001";
    await db.insert(octoBookings).values({
      id: "dcc:bk:dup_hold_earlier",
      bookingUuid: crypto.randomUUID(),
      idempotencyKey: dupIdemKey,
      idempotencyHash: "hash_dup_001",
      supplierConnectionId: "conn_gosno_rezdy",
      resellerId: null,
      productId: "dcc:gosno:den-breckenridge:suv",
      optionId: "opt_suburban_69029050",
      availabilityId: slotBreck,
      status: "ON_HOLD",
      expirationMinutes: 15,
      utcHoldExpires: null,
      totalPrice: "399.00",
      currency: "USD",
      unitItems: [{ unitId: "unit_suburban_69029050", quantity: 1 }] as any,
      contact: { firstName: "Earlier", lastName: "Hold" },
      supplierReference: "RZD-HOLD-EARLIER",
      resellerReference: "dcc:bk:dup_hold_earlier",
      checkoutUrl: null,
    });
    await db.insert(octoBookings).values({
      id: "dcc:bk:dup_confirmed_later",
      bookingUuid: crypto.randomUUID(),
      idempotencyKey: dupIdemKey,
      idempotencyHash: "hash_dup_001",
      supplierConnectionId: "conn_gosno_rezdy",
      resellerId: null,
      productId: "dcc:gosno:den-breckenridge:suv",
      optionId: "opt_suburban_69029050",
      availabilityId: slotBreck,
      status: "CONFIRMED",
      expirationMinutes: 15,
      utcHoldExpires: null,
      totalPrice: "399.00",
      currency: "USD",
      unitItems: [{ unitId: "unit_suburban_69029050", quantity: 1 }] as any,
      contact: { firstName: "Later", lastName: "Confirmed" },
      supplierReference: "RZD-CONFIRMED-LATER",
      resellerReference: "dcc:bk:dup_confirmed_later",
      checkoutUrl: null,
    });

    // 3a. Attempt migration activation (ensureEarthosSchema) while duplicates exist:
    // Activation MUST be blocked with UNRESOLVED_IDEMPOTENCY_DUPLICATES, AND the duplicate-conflict reports MUST be durably preserved!
    resetEarthosSchemaEnsuredForTests();
    await assert.rejects(
      () => ensureEarthosSchema(),
      (err: any) => String(err?.message || "").includes("UNRESOLVED_IDEMPOTENCY_DUPLICATES"),
      "ensureEarthosSchema() must block unique index activation when duplicate idempotency_key rows exist"
    );

    const conflictRowsPreservedOnBlock = await db
      .select()
      .from(octoBookingIdempotencyConflicts)
      .where(eq(octoBookingIdempotencyConflicts.idempotencyKey, dupIdemKey));
    assert.equal(
      conflictRowsPreservedOnBlock.length,
      2,
      "Duplicate-conflict report rows MUST be preserved in octo_booking_idempotency_conflicts when migration activation is blocked"
    );
    assert.ok(
      conflictRowsPreservedOnBlock.every(
        (c) =>
          c.resolutionStatus === "unresolved" &&
          c.conflictClassification === "confirmed_vs_non_confirmed" &&
          c.authoritativeBookingId === "dcc:bk:dup_confirmed_later"
      )
    );

    // 3b. Inspect duplicates non-destructively: proves 0 rows deleted, CONFIRMED row prioritized over earlier ON_HOLD row, and conflict snapshots recorded
    const dupReport = await inspectOctoBookingIdempotencyDuplicates(db);
    assert.equal(dupReport.duplicateGroupCount, 1);
    assert.equal(dupReport.totalDuplicateRows, 2);
    assert.equal(dupReport.groups[0].idempotencyKey, dupIdemKey);
    assert.equal(dupReport.groups[0].conflictClassification, "confirmed_vs_non_confirmed");
    assert.equal(
      dupReport.groups[0].recommendedAuthoritativeBookingId,
      "dcc:bk:dup_confirmed_later",
      "Status-aware duplicate inspection must recommend the CONFIRMED booking over an earlier ON_HOLD row (unlike ctid deletion)"
    );

    // 3c. Attempting to demote the CONFIRMED booking without allowConfirmedDemotion: true is forbidden
    await assert.rejects(
      () =>
        reconcileOctoBookingIdempotencyDuplicates(
          {
            idempotencyKey: dupIdemKey,
            authoritativeBookingId: "dcc:bk:dup_hold_earlier",
            resolvedBy: "ops-auditor",
            resolutionReason: "Accidental attempt to pick ON_HOLD over CONFIRMED",
          },
          db
        ),
      (err: any) =>
        String(err?.message || "").includes("CONFIRMED_DUPLICATE_DEMOTION_FORBIDDEN"),
      "Reconciliation must refuse to demote a CONFIRMED booking row unless allowConfirmedDemotion: true"
    );

    // 3d. Explicit non-destructive reconciliation preserves BOTH booking rows in octo_bookings (deletedRowCount: 0)
    const reconcileOutcome = await reconcileOctoBookingIdempotencyDuplicates(
      {
        idempotencyKey: dupIdemKey,
        authoritativeBookingId: "dcc:bk:dup_confirmed_later",
        resolvedBy: "ops-auditor",
        resolutionReason: "Keep CONFIRMED booking RZD-CONFIRMED-LATER as authoritative and archive earlier ON_HOLD duplicate",
      },
      db
    );
    assert.equal(reconcileOutcome.deletedRowCount, 0);
    assert.equal(reconcileOutcome.authoritativeBookingId, "dcc:bk:dup_confirmed_later");
    assert.deepEqual(reconcileOutcome.demotedRowIds, ["dcc:bk:dup_hold_earlier"]);

    const preservedConfirmed = (
      await db
        .select()
        .from(octoBookings)
        .where(eq(octoBookings.id, "dcc:bk:dup_confirmed_later"))
    )[0];
    const preservedDemoted = (
      await db
        .select()
        .from(octoBookings)
        .where(eq(octoBookings.id, "dcc:bk:dup_hold_earlier"))
    )[0];
    assert.ok(preservedConfirmed, "Authoritative CONFIRMED row must exist in octo_bookings");
    assert.equal(preservedConfirmed.idempotencyKey, dupIdemKey);
    assert.ok(preservedDemoted, "Demoted duplicate row must STILL exist in octo_bookings (never deleted)");
    assert.equal(
      preservedDemoted.idempotencyKey,
      `reconciled_dup:${dupIdemKey}:dcc:bk:dup_hold_earlier`
    );
    assert.equal(
      (preservedDemoted.contact as any)?.__dccMeta?.reconciliation?.reconciledDuplicateOf,
      "dcc:bk:dup_confirmed_later"
    );

    const conflictRowsAfter = await db
      .select()
      .from(octoBookingIdempotencyConflicts)
      .where(eq(octoBookingIdempotencyConflicts.idempotencyKey, dupIdemKey));
    assert.equal(conflictRowsAfter.length, 2);
    assert.ok(conflictRowsAfter.every((c) => c.resolutionStatus === "reconciled"));

    // 3e. Now creating the unique index octo_bookings_idempotency_key_uidx succeeds with 0 remaining duplicates
    const postReconcileReport = await inspectOctoBookingIdempotencyDuplicates(db);
    assert.equal(postReconcileReport.duplicateGroupCount, 0);
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "octo_bookings_idempotency_key_uidx"
        ON "octo_bookings" ("idempotency_key")
        WHERE "idempotency_key" IS NOT NULL;
    `);
  } finally {
    if (prevToken !== undefined) process.env.SQUARE_ACCESS_TOKEN = prevToken;
    else delete process.env.SQUARE_ACCESS_TOKEN;
    if (prevLoc !== undefined) process.env.SQUARE_LOCATION_ID_DCC = prevLoc;
    else delete process.env.SQUARE_LOCATION_ID_DCC;
    await sim.close();
  }
});

// ============================================================================
// GATE 10: Multi-Process Isolated PostgreSQL Proof of Single-Transaction Per-Payment
//          Allocation Locking (Competing Allocations, Simultaneous Changes to Same Obligation,
//          Process Killed SIGKILL Between Writes, Refund Allocation Adjustments) &
//          Duplicate-Conflict Report Preservation When Migration Activation Is Blocked
// ============================================================================
test("Gate 10: Independent OS processes against isolated PostgreSQL prove single-transaction per-payment allocation locking, rollback when a process is killed between writes, simultaneous changes to the same obligation, and preserved duplicate-conflict reports when migration activation is blocked", async () => {
  const { spawn } = await import("node:child_process");
  const { getDb, resetTestSqliteDb } = await import("../../lib/db/client");
  const {
    octoBookings,
    octoBookingIdempotencyConflicts,
    dccPaymentAllocations,
    dccOrderPayments,
    dccDisputesAndRefunds,
  } = await import("../../lib/db/schema");
  const {
    applyMigration0008Sql,
    ensureEarthosSchema,
    resetEarthosSchemaEnsuredForTests,
    inspectOctoBookingIdempotencyDuplicates,
    reconcileOctoBookingIdempotencyDuplicates,
  } = await import("../../lib/dcc/earthos/ensureEarthosSchema");
  const { and, eq, inArray, sql } = await import("drizzle-orm");

  // Resolve isolated PostgreSQL URL:
  // 1) In GitHub Actions CI: process.env.DCC_CI_POSTGRES_URL (postgresql://postgres:postgres@localhost:5432/dcc_test)
  // 2) Locally: isolated nonprod database `neondb_nonprod` derived from DATABASE_URL in .env.local
  let isolatedPgUrl = (process.env.DCC_CI_POSTGRES_URL || "").trim();
  if (!isolatedPgUrl) {
    let baseUrl = (process.env.DATABASE_URL || "").trim();
    if (!baseUrl) {
      const envLocalPath = path.join(process.cwd(), ".env.local");
      if (fs.existsSync(envLocalPath)) {
        const envText = fs.readFileSync(envLocalPath, "utf8");
        const m = envText.match(/^DATABASE_URL=["']?([^"'\r\n]+)["']?/m);
        if (m) baseUrl = m[1].trim();
      }
    }
    if (baseUrl.startsWith("postgres")) {
      const parsed = new URL(baseUrl);
      parsed.pathname = "/neondb_nonprod";
      isolatedPgUrl = parsed.toString();
    }
  }

  assert.ok(
    isolatedPgUrl.startsWith("postgres"),
    "Gate 10 requires an isolated PostgreSQL connection URL (DCC_CI_POSTGRES_URL or nonprod PostgreSQL)"
  );

  // Switch active getDb() environment to isolated PostgreSQL
  const savedEnv = {
    DCC_ISOLATED_TEST_DB: process.env.DCC_ISOLATED_TEST_DB,
    DCC_TEST_SQLITE_PATH: process.env.DCC_TEST_SQLITE_PATH,
    DCC_DATABASE_URL: process.env.DCC_DATABASE_URL,
    DCC_TARGET_DB: process.env.DCC_TARGET_DB,
    SQUARE_ACCESS_TOKEN: process.env.SQUARE_ACCESS_TOKEN,
    SQUARE_LOCATION_ID_DCC: process.env.SQUARE_LOCATION_ID_DCC,
  };

  process.env.DCC_ISOLATED_TEST_DB = "0";
  delete process.env.DCC_TEST_SQLITE_PATH;
  process.env.DCC_DATABASE_URL = isolatedPgUrl;
  process.env.DCC_TARGET_DB = "nonprod";
  process.env.SQUARE_ACCESS_TOKEN = "sq_sandbox_gate10_pg_token";
  process.env.SQUARE_LOCATION_ID_DCC = "loc_sandbox_gate10_pg";
  resetTestSqliteDb();
  DccPaymentService.clearInMemoryStoresForProcessRestartSimulation();

  const pgDb = getDb()!;
  assert.ok(pgDb, "Isolated PostgreSQL DccDb instance must initialize");

  const workerScriptPath = path.join(
    process.cwd(),
    "tests/dcc/helpers/pg-multiprocess-allocation-worker.ts"
  );

  function spawnPgWorker(
    payload: Record<string, any>,
    extraEnv?: Record<string, string>
  ): {
    child: ReturnType<typeof spawn>;
    readyPromise: Promise<void>;
    firstWriteHookPromise: Promise<void>;
    resultPromise: Promise<{ exitCode: number | null; signal: NodeJS.Signals | null; parsedResult: any; stdout: string; stderr: string }>;
  } {
    const resultFile = path.join(
      os.tmpdir(),
      `dcc_pg_worker_res_${Date.now()}_${Math.random().toString(16).slice(2, 8)}.json`
    );
    const payloadWithResultFile = { ...payload, resultFile };
    const child = spawn(
      process.execPath,
      ["--import", "tsx", workerScriptPath],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          TSX_TSCONFIG_PATH: path.join(process.cwd(), "tsconfig.json"),
          DCC_WORKER_PAYLOAD_JSON: JSON.stringify(payloadWithResultFile),
          DCC_ISOLATED_TEST_DB: "0",
          DCC_TEST_SQLITE_PATH: "",
          DCC_DATABASE_URL: isolatedPgUrl,
          DCC_TARGET_DB: "nonprod",
          SQUARE_ACCESS_TOKEN: "sq_sandbox_gate10_pg_token",
          SQUARE_LOCATION_ID_DCC: "loc_sandbox_gate10_pg",
          ...(extraEnv || {}),
        },
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    let stdout = "";
    let stderr = "";
    let resolveReady!: () => void;
    let rejectReady!: (err: Error) => void;
    let resolveFirstWrite!: () => void;
    let rejectFirstWrite!: (err: Error) => void;
    const readyPromise = new Promise<void>((r, rej) => {
      resolveReady = r;
      rejectReady = rej;
    });
    const firstWriteHookPromise = new Promise<void>((r, rej) => {
      resolveFirstWrite = r;
      rejectFirstWrite = rej;
    });
    // Prevent unhandled rejection when firstWriteHookPromise is unused
    firstWriteHookPromise.catch(() => {});

    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
      if (stdout.includes("WORKER_READY")) {
        resolveReady();
      }
      if (stdout.includes("DCC_ALLOC_TX_AFTER_FIRST_WRITE")) {
        resolveFirstWrite();
      }
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    const resultPromise = new Promise<{
      exitCode: number | null;
      signal: NodeJS.Signals | null;
      parsedResult: any;
      stdout: string;
      stderr: string;
    }>((resolve) => {
      child.on("close", (code, signal) => {
        if (!stdout.includes("WORKER_READY")) {
          rejectReady(
            new Error(
              `Worker exited before WORKER_READY (code=${code}, signal=${signal}): ${stderr || stdout}`
            )
          );
        }
        if (
          extraEnv?.DCC_TEST_PAUSE_BETWEEN_ALLOCATION_WRITES === "1" &&
          !stdout.includes("DCC_ALLOC_TX_AFTER_FIRST_WRITE")
        ) {
          rejectFirstWrite(
            new Error(
              `Worker exited before DCC_ALLOC_TX_AFTER_FIRST_WRITE (code=${code}, signal=${signal}): ${stderr || stdout}`
            )
          );
        }
        let parsedResult: any = null;
        if (fs.existsSync(resultFile)) {
          try {
            parsedResult = JSON.parse(fs.readFileSync(resultFile, "utf8"));
            fs.unlinkSync(resultFile);
          } catch {}
        }
        if (!parsedResult) {
          const m = stdout.match(/RESULT_JSON:(\{[^\r\n]+\})/);
          if (m) {
            try {
              parsedResult = JSON.parse(m[1]);
            } catch {}
          }
        }
        resolve({ exitCode: code, signal, parsedResult, stdout, stderr });
      });
    });

    return { child, readyPromise, firstWriteHookPromise, resultPromise };
  }

  const runSuffix = `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  const pgDupKey = `idem_pg_dup_preserve_${runSuffix}`;
  const pgDupHoldId = `dcc:bk:pg_dup_hold_${runSuffix}`;
  const pgDupConfId = `dcc:bk:pg_dup_conf_${runSuffix}`;
  const raceOrderId = `ord_pg_mp_race_${runSuffix}`;
  const sameOblOrderId = `ord_pg_mp_same_obl_${runSuffix}`;
  const barrierFiles: string[] = [];

  try {
    // Ensure base schema exists in isolated PostgreSQL
    await applyMigration0008Sql(pgDb);

    // =========================================================================
    // 10A. Preserve Duplicate-Conflict Reports in Isolated PostgreSQL When Migration Activation Is Blocked
    // =========================================================================
    await pgDb.execute(sql`DROP INDEX IF EXISTS "octo_bookings_idempotency_key_uidx";`);

    await pgDb.insert(octoBookings).values({
      id: pgDupHoldId,
      bookingUuid: crypto.randomUUID(),
      idempotencyKey: pgDupKey,
      idempotencyHash: "hash_pg_dup",
      supplierConnectionId: "conn_gosno_rezdy",
      resellerId: null,
      productId: "dcc:gosno:den-breckenridge:suv",
      optionId: "opt_suburban_69029050",
      availabilityId: "slot_pg_dup",
      status: "ON_HOLD",
      expirationMinutes: 15,
      utcHoldExpires: null,
      totalPrice: "399.00",
      currency: "USD",
      unitItems: [{ unitId: "unit_suburban_69029050", quantity: 1 }] as any,
      contact: { firstName: "PgHold", lastName: "Duplicate" },
      supplierReference: "RZD-PG-HOLD-1",
      resellerReference: pgDupHoldId,
      checkoutUrl: null,
    });
    await pgDb.insert(octoBookings).values({
      id: pgDupConfId,
      bookingUuid: crypto.randomUUID(),
      idempotencyKey: pgDupKey,
      idempotencyHash: "hash_pg_dup",
      supplierConnectionId: "conn_gosno_rezdy",
      resellerId: null,
      productId: "dcc:gosno:den-breckenridge:suv",
      optionId: "opt_suburban_69029050",
      availabilityId: "slot_pg_dup",
      status: "CONFIRMED",
      expirationMinutes: 15,
      utcHoldExpires: null,
      totalPrice: "399.00",
      currency: "USD",
      unitItems: [{ unitId: "unit_suburban_69029050", quantity: 1 }] as any,
      contact: { firstName: "PgConfirmed", lastName: "Duplicate" },
      supplierReference: "RZD-PG-CONFIRMED-2",
      resellerReference: pgDupConfId,
      checkoutUrl: null,
    });

    // Execute migration 0008 SQL against isolated PostgreSQL while duplicate rows exist:
    // Step B raises UNRESOLVED_IDEMPOTENCY_DUPLICATES and blocks Step C (CREATE UNIQUE INDEX),
    // while Step A's INSERT INTO octo_booking_idempotency_conflicts remains durably committed!
    await assert.rejects(
      () => applyMigration0008Sql(pgDb, { onlyIdempotencyActivationSteps: true }),
      (err: any) =>
        String(err?.message || err?.cause?.message || "").includes(
          "UNRESOLVED_IDEMPOTENCY_DUPLICATES"
        ),
      "Migration 0008 SQL must block activation with UNRESOLVED_IDEMPOTENCY_DUPLICATES when duplicate idempotency_key rows exist in PostgreSQL"
    );

    const idxWhileBlocked = await pgDb.execute(sql`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'octo_bookings' AND indexname = 'octo_bookings_idempotency_key_uidx';
    `);
    assert.equal(
      idxWhileBlocked.rows.length,
      0,
      "octo_bookings_idempotency_key_uidx must NOT be created while unresolved duplicates exist"
    );

    const preservedConflictsFromSql = await pgDb
      .select()
      .from(octoBookingIdempotencyConflicts)
      .where(eq(octoBookingIdempotencyConflicts.idempotencyKey, pgDupKey));
    assert.equal(
      preservedConflictsFromSql.length,
      2,
      "Migration 0008 SQL must durably preserve duplicate-conflict reports in PostgreSQL octo_booking_idempotency_conflicts when index activation is blocked"
    );
    assert.ok(
      preservedConflictsFromSql.every(
        (c) =>
          c.conflictClassification === "confirmed_vs_non_confirmed" &&
          c.resolutionStatus === "unresolved" &&
          c.authoritativeBookingId === pgDupConfId
      )
    );

    // Also prove inspectOctoBookingIdempotencyDuplicates(pgDb) (used by ensureEarthosSchema) preserves duplicate-conflict reports in PostgreSQL
    await pgDb
      .delete(octoBookingIdempotencyConflicts)
      .where(eq(octoBookingIdempotencyConflicts.idempotencyKey, pgDupKey));
    const pgDupReport = await inspectOctoBookingIdempotencyDuplicates(pgDb);
    assert.ok(pgDupReport.duplicateGroupCount >= 1);

    const preservedConflictsFromEnsure = await pgDb
      .select()
      .from(octoBookingIdempotencyConflicts)
      .where(eq(octoBookingIdempotencyConflicts.idempotencyKey, pgDupKey));
    assert.equal(
      preservedConflictsFromEnsure.length,
      2,
      "inspectOctoBookingIdempotencyDuplicates must durably preserve duplicate-conflict reports in PostgreSQL"
    );

    // Reconcile the duplicates non-destructively and prove migration activation now succeeds in PostgreSQL
    const pgReconcileRes = await reconcileOctoBookingIdempotencyDuplicates(
      {
        idempotencyKey: pgDupKey,
        authoritativeBookingId: pgDupConfId,
        resolvedBy: "gate10-pg-verifier",
        resolutionReason: "Keep CONFIRMED booking and archive ON_HOLD duplicate",
      },
      pgDb
    );
    assert.equal(pgReconcileRes.deletedRowCount, 0);

    await applyMigration0008Sql(pgDb, { onlyIdempotencyActivationSteps: true });

    const idxAfterReconcile = await pgDb.execute(sql`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'octo_bookings' AND indexname = 'octo_bookings_idempotency_key_uidx';
    `);
    assert.equal(
      idxAfterReconcile.rows.length,
      1,
      "octo_bookings_idempotency_key_uidx must be active in PostgreSQL after explicit reconciliation"
    );

    // =========================================================================
    // 10B. Independent OS Processes Racing Simultaneous $60 + $60 Allocations on One $100 Payment in Isolated PostgreSQL
    // =========================================================================
    const raceCapture = await captureTraceableSquarePayment(raceOrderId, 100);
    const barrierRace = path.join(
      os.tmpdir(),
      `dcc_pg_barrier_race_${runSuffix}.flag`
    );
    barrierFiles.push(barrierRace);

    const worker60A = spawnPgWorker({
      mode: "assert_evidence",
      barrierFile: barrierRace,
      transactionId: raceCapture.transactionId,
      orderId: raceOrderId,
      bookingId: `dcc:bk:pg_mp_60_a_${runSuffix}`,
      amount: 60,
      capturedAt: raceCapture.capturedAt,
    });
    const worker60B = spawnPgWorker({
      mode: "assert_evidence",
      barrierFile: barrierRace,
      transactionId: raceCapture.transactionId,
      orderId: raceOrderId,
      bookingId: `dcc:bk:pg_mp_60_b_${runSuffix}`,
      amount: 60,
      capturedAt: raceCapture.capturedAt,
    });

    await Promise.all([worker60A.readyPromise, worker60B.readyPromise]);
    // Release both OS processes simultaneously
    fs.writeFileSync(barrierRace, "GO", "utf8");

    const [res60A, res60B] = await Promise.all([
      worker60A.resultPromise,
      worker60B.resultPromise,
    ]);

    const outcomes60 = [res60A.parsedResult, res60B.parsedResult];
    const succeeded60 = outcomes60.filter((o) => o?.ok === true);
    const failed60 = outcomes60.filter((o) => o?.ok === false);

    assert.equal(
      succeeded60.length,
      1,
      `Expected exactly 1 of 2 independent OS processes to succeed on $60+$60/$100 race, got: ${JSON.stringify(outcomes60)}`
    );
    assert.equal(
      failed60.length,
      1,
      `Expected 1 independent OS process to fail closed on $60+$60/$100 race, got: ${JSON.stringify(outcomes60)}`
    );
    assert.equal(failed60[0].status, 422);
    assert.equal(failed60[0].code, "PAYMENT_OVERALLOCATED");

    const pgRaceAllocRows = await pgDb
      .select()
      .from(dccPaymentAllocations)
      .where(eq(dccPaymentAllocations.paymentId, raceCapture.transactionId));
    const pgRaceTotal = pgRaceAllocRows.find((r) => r.obligationKey === "__PAYMENT_TOTAL__");
    const pgRaceObligations = pgRaceAllocRows.filter(
      (r) => r.obligationKey !== "__PAYMENT_TOTAL__"
    );
    assert.ok(pgRaceTotal);
    assert.equal(Number(pgRaceTotal.allocatedAmountCents), 6000);
    assert.equal(pgRaceObligations.length, 1);
    assert.equal(Number(pgRaceObligations[0].allocatedAmountCents), 6000);

    // =========================================================================
    // 10C. Independent OS Processes Simultaneously Modifying the SAME Obligation (Increases & Reductions) in Isolated PostgreSQL
    // =========================================================================
    const sameOblCapture = await captureTraceableSquarePayment(sameOblOrderId, 100);
    const otherOblKey = `dcc:bk:pg_other_obl_${runSuffix}`;
    const targetSameOblKey = `dcc:bk:pg_same_obl_${runSuffix}`;

    // Seed $20 on otherOblKey and $60 on targetSameOblKey ($80 total of $100)
    await DccPaymentService.assertTraceablePaymentEvidence(
      { ...sameOblCapture, capturedAmount: 20 },
      20,
      { orderId: sameOblOrderId, bookingId: otherOblKey }
    );
    await DccPaymentService.assertTraceablePaymentEvidence(
      { ...sameOblCapture, capturedAmount: 60 },
      60,
      { orderId: sameOblOrderId, bookingId: targetSameOblKey }
    );

    const barrierSameObl = path.join(
      os.tmpdir(),
      `dcc_pg_barrier_same_obl_${runSuffix}.flag`
    );
    barrierFiles.push(barrierSameObl);

    // Spawn 4 independent OS processes simultaneously modifying targetSameOblKey:
    // - wReduce25: reduces targetSameOblKey to $25 ($25 + $20 = $45 <= $100) -> succeeds
    // - wIncrease75: increases targetSameOblKey to $75 ($75 + $20 = $95 <= $100) -> succeeds
    // - wAdjust40: adjusts targetSameOblKey to $40 ($40 + $20 = $60 <= $100) -> succeeds
    // - wOver85: attempts $85 ($85 + $20 = $105 > $100) -> fails closed with 422 PAYMENT_OVERALLOCATED
    const wReduce25 = spawnPgWorker({
      mode: "adjust_allocation",
      barrierFile: barrierSameObl,
      paymentId: sameOblCapture.transactionId,
      orderId: sameOblOrderId,
      bookingId: targetSameOblKey,
      newAllocatedAmount: 25,
    });
    const wIncrease75 = spawnPgWorker({
      mode: "assert_evidence",
      barrierFile: barrierSameObl,
      transactionId: sameOblCapture.transactionId,
      orderId: sameOblOrderId,
      bookingId: targetSameOblKey,
      amount: 75,
      capturedAt: sameOblCapture.capturedAt,
    });
    const wAdjust40 = spawnPgWorker({
      mode: "adjust_allocation",
      barrierFile: barrierSameObl,
      paymentId: sameOblCapture.transactionId,
      orderId: sameOblOrderId,
      bookingId: targetSameOblKey,
      newAllocatedAmount: 40,
    });
    const wOver85 = spawnPgWorker({
      mode: "adjust_allocation",
      barrierFile: barrierSameObl,
      paymentId: sameOblCapture.transactionId,
      orderId: sameOblOrderId,
      bookingId: targetSameOblKey,
      newAllocatedAmount: 85,
    });

    await Promise.all([
      wReduce25.readyPromise,
      wIncrease75.readyPromise,
      wAdjust40.readyPromise,
      wOver85.readyPromise,
    ]);
    fs.writeFileSync(barrierSameObl, "GO", "utf8");

    const [res25, res75, res40, res85] = await Promise.all([
      wReduce25.resultPromise,
      wIncrease75.resultPromise,
      wAdjust40.resultPromise,
      wOver85.resultPromise,
    ]);

    assert.equal(res25.parsedResult?.ok, true, `wReduce25 failed: ${res25.stdout} ${res25.stderr}`);
    assert.equal(res75.parsedResult?.ok, true, `wIncrease75 failed: ${res75.stdout} ${res75.stderr}`);
    assert.equal(res40.parsedResult?.ok, true, `wAdjust40 failed: ${res40.stdout} ${res40.stderr}`);
    assert.equal(res85.parsedResult?.ok, false, "wOver85 ($85 + $20 > $100) must fail closed");
    assert.equal(res85.parsedResult?.status, 422);
    assert.equal(res85.parsedResult?.code, "PAYMENT_OVERALLOCATED");

    const afterSameOblRows = await pgDb
      .select()
      .from(dccPaymentAllocations)
      .where(eq(dccPaymentAllocations.paymentId, sameOblCapture.transactionId));
    const sameOblRowAfter = afterSameOblRows.find(
      (r) => r.obligationKey === targetSameOblKey
    )!;
    const otherOblRowAfter = afterSameOblRows.find(
      (r) => r.obligationKey === otherOblKey
    )!;
    const totalRowAfter = afterSameOblRows.find(
      (r) => r.obligationKey === "__PAYMENT_TOTAL__"
    )!;

    const committedSameOblCents = Number(sameOblRowAfter.allocatedAmountCents);
    assert.ok(
      [2500, 4000, 7500].includes(committedSameOblCents),
      `targetSameOblKey cents (${committedSameOblCents}) must equal one of the serialized valid updates (2500, 4000, or 7500)`
    );
    assert.equal(Number(otherOblRowAfter.allocatedAmountCents), 2000);
    assert.equal(
      Number(totalRowAfter.allocatedAmountCents),
      committedSameOblCents + 2000,
      "__PAYMENT_TOTAL__ must strictly equal the sum of individual obligation rows after simultaneous multi-process updates to the same obligation"
    );

    // =========================================================================
    // 10D. Independent OS Process Killed (SIGKILL) Between Writes in Isolated PostgreSQL
    // =========================================================================
    // Case 1: Kill process with SIGKILL after Write 1 (individual obligation reduction to $10 / 1000 cents)
    // and before Write 2 (__PAYMENT_TOTAL__ update) & COMMIT.
    const killedAdjustWorker = spawnPgWorker(
      {
        mode: "adjust_allocation",
        paymentId: sameOblCapture.transactionId,
        orderId: sameOblOrderId,
        bookingId: targetSameOblKey,
        newAllocatedAmount: 10,
      },
      {
        DCC_TEST_PAUSE_BETWEEN_ALLOCATION_WRITES: "1",
      }
    );

    await killedAdjustWorker.firstWriteHookPromise;
    killedAdjustWorker.child.kill("SIGKILL");
    const killedAdjustOutcome = await killedAdjustWorker.resultPromise;
    assert.notEqual(
      killedAdjustOutcome.exitCode,
      0,
      "Process killed with SIGKILL between writes must exit non-zero"
    );

    // Verify PostgreSQL rolled back Write 1 ($10 / 1000 cents) and preserved exact consistency
    const rowsAfterKilledAdjust = await pgDb
      .select()
      .from(dccPaymentAllocations)
      .where(eq(dccPaymentAllocations.paymentId, sameOblCapture.transactionId));
    const sameOblAfterKill1 = rowsAfterKilledAdjust.find(
      (r) => r.obligationKey === targetSameOblKey
    )!;
    const totalAfterKill1 = rowsAfterKilledAdjust.find(
      (r) => r.obligationKey === "__PAYMENT_TOTAL__"
    )!;
    assert.equal(
      Number(sameOblAfterKill1.allocatedAmountCents),
      committedSameOblCents,
      "PostgreSQL must roll back uncommitted individual obligation write when worker process is killed between writes"
    );
    assert.equal(
      Number(totalAfterKill1.allocatedAmountCents),
      committedSameOblCents + 2000,
      "__PAYMENT_TOTAL__ must remain 100% consistent with individual obligation rows after mid-transaction process kill"
    );

    // Case 2: Kill process with SIGKILL between writes during a $15 processRefund adjustment,
    // proving refund row, payment status update, and obligation allocation reduction all roll back together.
    const killedRefundId = `sq_ref_killed_${runSuffix}`;
    const killedRefundWorker = spawnPgWorker(
      {
        mode: "process_refund",
        orderId: sameOblOrderId,
        bookingId: targetSameOblKey,
        amount: 15,
        refundId: killedRefundId,
      },
      {
        DCC_TEST_PAUSE_BETWEEN_ALLOCATION_WRITES: "1",
      }
    );

    await killedRefundWorker.firstWriteHookPromise;
    killedRefundWorker.child.kill("SIGKILL");
    await killedRefundWorker.resultPromise;

    const rolledBackRefundRows = await pgDb
      .select()
      .from(dccDisputesAndRefunds)
      .where(eq(dccDisputesAndRefunds.id, killedRefundId));
    assert.equal(
      rolledBackRefundRows.length,
      0,
      "Refund row inserted before mid-transaction process kill must be rolled back in PostgreSQL"
    );

    const paymentAfterKilledRefund = await pgDb
      .select()
      .from(dccOrderPayments)
      .where(eq(dccOrderPayments.id, sameOblCapture.transactionId));
    assert.equal(
      paymentAfterKilledRefund[0].status,
      "captured",
      "Payment status update before mid-transaction process kill must be rolled back to 'captured'"
    );

    const rowsAfterKilledRefund = await pgDb
      .select()
      .from(dccPaymentAllocations)
      .where(eq(dccPaymentAllocations.paymentId, sameOblCapture.transactionId));
    assert.equal(
      Number(
        rowsAfterKilledRefund.find((r) => r.obligationKey === targetSameOblKey)!
          .allocatedAmountCents
      ),
      committedSameOblCents,
      "Obligation allocation reduction must be rolled back when refund process is killed between writes"
    );
    assert.equal(
      Number(
        rowsAfterKilledRefund.find((r) => r.obligationKey === "__PAYMENT_TOTAL__")!
          .allocatedAmountCents
      ),
      committedSameOblCents + 2000
    );

    // Now run the $15 processRefund in an independent OS process WITHOUT kill and prove atomic commit
    const committedRefundId = `sq_ref_committed_${runSuffix}`;
    const cleanRefundWorker = spawnPgWorker({
      mode: "process_refund",
      orderId: sameOblOrderId,
      bookingId: targetSameOblKey,
      amount: 15,
      refundId: committedRefundId,
    });
    const cleanRefundOutcome = await cleanRefundWorker.resultPromise;
    assert.equal(cleanRefundOutcome.parsedResult?.ok, true);
    assert.equal(cleanRefundOutcome.parsedResult?.status, "processed");

    const rowsAfterCleanRefund = await pgDb
      .select()
      .from(dccPaymentAllocations)
      .where(eq(dccPaymentAllocations.paymentId, sameOblCapture.transactionId));
    const expectedReducedSameOblCents = committedSameOblCents - 1500;
    assert.equal(
      Number(
        rowsAfterCleanRefund.find((r) => r.obligationKey === targetSameOblKey)!
          .allocatedAmountCents
      ),
      expectedReducedSameOblCents,
      "Committed refund transaction must atomically reduce the refunded obligation's allocation by 1500 cents ($15.00)"
    );
    assert.equal(
      Number(
        rowsAfterCleanRefund.find((r) => r.obligationKey === "__PAYMENT_TOTAL__")!
          .allocatedAmountCents
      ),
      expectedReducedSameOblCents + 2000,
      "Committed refund transaction must atomically update __PAYMENT_TOTAL__ to match the reduced obligation allocation"
    );
  } finally {
    for (const bf of barrierFiles) {
      if (fs.existsSync(bf)) {
        try {
          fs.unlinkSync(bf);
        } catch {}
      }
    }
    // Clean up test rows created in isolated PostgreSQL
    try {
      await pgDb
        .delete(octoBookingIdempotencyConflicts)
        .where(eq(octoBookingIdempotencyConflicts.idempotencyKey, pgDupKey));
      await pgDb
        .delete(octoBookings)
        .where(inArray(octoBookings.id, [pgDupHoldId, pgDupConfId]));
      await pgDb
        .delete(dccPaymentAllocations)
        .where(inArray(dccPaymentAllocations.orderId, [raceOrderId, sameOblOrderId]));
      await pgDb
        .delete(dccDisputesAndRefunds)
        .where(inArray(dccDisputesAndRefunds.orderId, [raceOrderId, sameOblOrderId]));
      await pgDb
        .delete(dccOrderPayments)
        .where(inArray(dccOrderPayments.orderId, [raceOrderId, sameOblOrderId]));
    } catch {}

    // Restore environment variables
    for (const [k, v] of Object.entries(savedEnv)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    resetTestSqliteDb();
  }
});



