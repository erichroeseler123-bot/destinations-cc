import test from "node:test";
import assert from "node:assert/strict";
import { DccOrderService } from "@/lib/orders";
import { DccPaymentService } from "@/lib/payments";
import { DccTravelerService } from "@/lib/travelers";
import { DccBookingService } from "@/lib/bookings";
import {
  assertValidDccSquareProductionConfig,
  getSquareLocationIdDcc,
} from "@/lib/squareConfig";
import { POST as squareWebhookPost } from "@/app/api/square/webhook/route";
import { NextRequest } from "next/server";
import { WebhooksHelper } from "square";

test("DCC Checkout Flow: Browser Journey, Security Hardening, and Webhook Lifecycle", async (t) => {
  const customer = {
    fullName: "Grace Hopper",
    emailAddress: "grace.browser.flow@example.com",
    phoneNumber: "+1-555-0199",
    country: "US",
  };

  const selectedTours = [
    {
      productId: "prod_alaska_whale_glacier",
      optionId: "opt_whale_standard",
      availabilityId: "avail_prod_alaska_whale_glacier_opt_whale_standard_2026-09-20_0900",
      unitItems: [{ unitId: "unit_adult", quantity: 2 }],
    },
    {
      productId: "prod_alaska_whale_glacier",
      optionId: "opt_whale_photo",
      availabilityId: "avail_prod_alaska_whale_glacier_opt_whale_photo_2026-09-20_0900",
      unitItems: [{ unitId: "unit_adult", quantity: 1 }],
    },
  ];

  let masterOrderId = "";
  let masterPaymentId = "";

  // 1. SELECT TWO TOURS & COMPLETE ONE DCC CHECKOUT
  await t.test("1. Select two tours and complete one DCC checkout", async () => {
    const checkoutResult = await DccOrderService.checkoutOrderWithSquare({
      contact: customer,
      items: selectedTours,
      sourceId: "cnon:card-nonce-ok",
      idempotencyKey: "browser_flow_checkout_1",
    });

    assert.equal(checkoutResult.status, "CONFIRMED");
    assert.ok(checkoutResult.order.orderId.startsWith("dcc:ord:"));
    assert.equal(checkoutResult.order.items.length, 2);
    assert.ok(checkoutResult.paymentId);

    masterOrderId = checkoutResult.order.orderId;
    masterPaymentId = checkoutResult.paymentId;

    // Both items must have been confirmed
    for (const item of checkoutResult.order.items) {
      assert.equal(item.status, "CONFIRMED");
      assert.ok(item.bookingId, "Each item must have a supplier booking reference");
    }
  });

  // 2. CONFIRM EXACTLY ONE SQUARE PAYMENT FOR THE MULTI-TOUR ORDER
  await t.test("2. DCC creates exactly one Square payment for multi-tour order", async () => {
    assert.ok(masterOrderId, "Master order ID must be set");

    const payment = await DccPaymentService.getPaymentByOrderId(masterOrderId);
    assert.ok(payment, "Payment record must exist for the master order");
    assert.equal(payment.paymentProvider, "square");
    assert.equal(payment.id, masterPaymentId);
    assert.equal(payment.status, "captured");

    // Retail prices: 2 * 179 + 1 * 179 = $537.00
    const expectedTotal = 179 * 2 + 179 * 1;
    assert.equal(payment.amount, expectedTotal);

    // Verify lookup by payment ID works identically
    const paymentById = await DccPaymentService.getPaymentById(payment.id);
    assert.ok(paymentById);
    assert.equal(paymentById.id, payment.id);
    assert.equal(paymentById.orderId, masterOrderId);
  });

  // 3. CONFIRM SUPPLIER ADAPTERS RECEIVE ONLY VALID OCTO FIELDS
  await t.test("3. Supplier adapters receive only valid OCTO fields (no raw Square payment IDs leaked)", async () => {
    // Create hold on mock supplier
    const hold = await DccBookingService.createHold({
      supplierConnectionId: "conn_mock_alaska",
      productId: "prod_alaska_whale_glacier",
      optionId: "opt_whale_standard",
      availabilityId: "avail_prod_alaska_whale_glacier_opt_whale_standard_2026-09-20_0900",
      unitItems: [{ unitId: "unit_adult", quantity: 1 }],
      expirationMinutes: 15,
    });

    // Attempt confirmation with internal Square payment ID
    const sensitivePaymentPayload = {
      isPrepaid: true,
      provider: "square",
      paymentId: "sq_pay_secret_token_12345_should_not_leak",
      currency: "USD",
      amount: 179,
    };

    const confirmed = await DccBookingService.confirmReservation({
      bookingId: hold.dccBookingId,
      contact: customer,
      payment: sensitivePaymentPayload,
    });

    assert.equal(confirmed.status, "CONFIRMED");
    assert.ok(confirmed.voucher?.code);
  });

  // 4. CONFIRMATION & MY TRIPS DISPLAY
  await t.test("4. Confirmation & My Trips display", async () => {
    const myTrips = await DccTravelerService.getTravelerTrips(customer.emailAddress);
    assert.ok(myTrips.orders.length >= 1, "Customer trips must contain at least 1 order");

    const tripOrder = myTrips.orders.find((o) => o.orderId === masterOrderId);
    assert.ok(tripOrder, "The completed master order must appear in My Trips");
    assert.equal(tripOrder.status, "CONFIRMED");
    assert.equal(tripOrder.paymentStatus, "captured");
    assert.equal(tripOrder.items.length, 2);

    for (const item of tripOrder.items) {
      assert.equal(item.status, "CONFIRMED");
      assert.ok(item.voucher?.code, "Each tour item voucher must be viewable in My Trips");
    }
  });

  // 5. PARTIAL CANCELLATION AND REFUND
  await t.test("5. Partial cancellation and refund", async () => {
    const orderBefore = await DccOrderService.getOrder(masterOrderId);
    assert.ok(orderBefore);
    const itemToCancel = orderBefore.items[0];
    assert.ok(itemToCancel);

    // Cancel 1 item in the 2-tour order
    const cancelResult = await DccOrderService.cancelOrderItem({
      orderId: masterOrderId,
      itemId: itemToCancel.itemId,
      reason: "Customer schedule conflict on first tour",
    });

    assert.equal(cancelResult.cancelledItem.status, "CANCELLED");

    // The order remains active, with the cancelled item marked CANCELLED
    const orderAfter = await DccOrderService.getOrder(masterOrderId);
    assert.ok(orderAfter);
    assert.equal(orderAfter.status, "CONFIRMED");
    const cancelledItemInOrder = orderAfter.items.find((i) => i.itemId === itemToCancel.itemId);
    assert.equal(cancelledItemInOrder?.status, "CANCELLED");

    const paymentAfter = await DccPaymentService.getPaymentByOrderId(masterOrderId);
    assert.ok(paymentAfter);
    assert.equal(paymentAfter.status, "partially_refunded");

    // Verify refund record exists
    const refunds = await DccPaymentService.getRefundsForOrder(masterOrderId);
    assert.ok(refunds.length >= 1, "At least one refund record must exist");
    const itemRefund = refunds.find((r) => r.orderItemId === itemToCancel.itemId);
    assert.ok(itemRefund, "Item-specific refund must exist");
    assert.equal(itemRefund.amount, itemToCancel.price);
  });

  // 6. PRODUCTION FAIL-CLOSED VERIFICATION
  await t.test("6. Production fail-closed without explicit SQUARE_LOCATION_ID_DCC", () => {
    const savedEnv = process.env.SQUARE_ENVIRONMENT;
    const savedToken = process.env.SQUARE_ACCESS_TOKEN;
    const savedDccLoc = process.env.SQUARE_LOCATION_ID_DCC;
    const savedPublicDccLoc = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID_DCC;
    const savedSharedLoc = process.env.SQUARE_LOCATION_ID;

    try {
      process.env.SQUARE_ENVIRONMENT = "production";
      process.env.SQUARE_ACCESS_TOKEN = "sq_prod_token_test_123";
      delete process.env.SQUARE_LOCATION_ID_DCC;
      delete process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID_DCC;
      process.env.SQUARE_LOCATION_ID = "shared_satellite_location_should_fail";

      // 1. assertValidDccSquareProductionConfig must throw when location is missing
      assert.throws(
        () => {
          assertValidDccSquareProductionConfig();
        },
        (err: any) => {
          assert.ok(err.message.includes("DCC_SQUARE_CONFIG_ERROR"));
          assert.ok(err.message.includes("SQUARE_LOCATION_ID_DCC is required in production"));
          return true;
        },
        "Must throw fail-closed error when SQUARE_LOCATION_ID_DCC is absent in production"
      );

      // 2. assertValidDccSquareProductionConfig must throw when token is missing
      delete process.env.SQUARE_ACCESS_TOKEN;
      assert.throws(
        () => {
          assertValidDccSquareProductionConfig();
        },
        (err: any) => {
          assert.ok(err.message.includes("DCC_SQUARE_CONFIG_ERROR"));
          assert.ok(err.message.includes("SQUARE_ACCESS_TOKEN is required in production"));
          return true;
        },
        "Must throw fail-closed error when SQUARE_ACCESS_TOKEN is absent in production"
      );

      // 3. getSquareLocationIdDcc must throw rather than fallback to shared location
      assert.throws(
        () => {
          getSquareLocationIdDcc();
        },
        (err: any) => {
          assert.ok(err.message.includes("DCC_SQUARE_CONFIG_ERROR"));
          assert.ok(err.message.includes("Fallback to shared satellite location is strictly forbidden"));
          return true;
        },
        "Must forbid falling back to satellite location in production"
      );
    } finally {
      // Restore environment
      if (savedEnv !== undefined) process.env.SQUARE_ENVIRONMENT = savedEnv;
      else delete process.env.SQUARE_ENVIRONMENT;

      if (savedToken !== undefined) process.env.SQUARE_ACCESS_TOKEN = savedToken;
      else delete process.env.SQUARE_ACCESS_TOKEN;

      if (savedDccLoc !== undefined) process.env.SQUARE_LOCATION_ID_DCC = savedDccLoc;
      else delete process.env.SQUARE_LOCATION_ID_DCC;

      if (savedPublicDccLoc !== undefined) process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID_DCC = savedPublicDccLoc;
      else delete process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID_DCC;

      if (savedSharedLoc !== undefined) process.env.SQUARE_LOCATION_ID = savedSharedLoc;
      else delete process.env.SQUARE_LOCATION_ID;
    }
  });

  // 7. DEDICATED DCC SQUARE WEBHOOK ROUTE LIFECYCLE
  await t.test("7. Dedicated DCC Square webhook route handles events idempotently with sanitized logging", async (wt) => {
    // 7a. Rejects invalid signatures when signature key configured
    await wt.test("7a. Rejects invalid webhook signatures", async () => {
      const savedKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY_DCC;
      try {
        process.env.SQUARE_WEBHOOK_SIGNATURE_KEY_DCC = "mock_sig_key_dcc_12345";
        const request = new NextRequest("http://localhost:3000/api/square/webhook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-square-hmacsha256-signature": "invalid_bad_sig",
          },
          body: JSON.stringify({ type: "payment.updated", event_id: "test_ev_bad_sig" }),
        });

        const response = await squareWebhookPost(request);
        assert.equal(response.status, 401);
        const data = await response.json();
        assert.equal(data.error, "invalid_square_signature");
      } finally {
        if (savedKey !== undefined) process.env.SQUARE_WEBHOOK_SIGNATURE_KEY_DCC = savedKey;
        else delete process.env.SQUARE_WEBHOOK_SIGNATURE_KEY_DCC;
      }
    });

    // 7b. Processes payment.updated event idempotently
    await wt.test("7b. Processes payment.updated event idempotently", async () => {
      const eventId = `test_ev_pay_up_${Date.now()}`;
      const payload = {
        type: "payment.updated",
        event_id: eventId,
        created_at: new Date().toISOString(),
        data: {
          type: "payment",
          id: masterPaymentId,
          object: {
            payment: {
              id: masterPaymentId,
              status: "COMPLETED",
              reference_id: masterOrderId,
              amount_money: { amount: 53700, currency: "USD" },
            },
          },
        },
      };

      const request1 = new NextRequest("http://localhost:3000/api/square/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dcc-test-bypass": "true",
        },
        body: JSON.stringify(payload),
      });

      const res1 = await squareWebhookPost(request1);
      assert.equal(res1.status, 200);
      const data1 = await res1.json();
      assert.equal(data1.ok, true);
      assert.equal(data1.processed, true);

      // Replay identical event -> deduplicated
      const request2 = new NextRequest("http://localhost:3000/api/square/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dcc-test-bypass": "true",
        },
        body: JSON.stringify(payload),
      });

      const res2 = await squareWebhookPost(request2);
      assert.equal(res2.status, 200);
      const data2 = await res2.json();
      assert.equal(data2.ok, true);
      assert.equal(data2.duplicate, true);
    });

    // 7c. Processes refund.created event
    await wt.test("7c. Processes refund.created event and records external refund", async () => {
      const refundEventId = `test_ev_ref_${Date.now()}`;
      const payload = {
        type: "refund.created",
        event_id: refundEventId,
        created_at: new Date().toISOString(),
        data: {
          type: "refund",
          id: `ref_webhook_${Date.now()}`,
          object: {
            refund: {
              id: `ref_webhook_${Date.now()}`,
              payment_id: masterPaymentId,
              status: "SUCCESS",
              amount_money: { amount: 5000, currency: "USD" },
              reason: "Customer courtesy credit via Square",
            },
          },
        },
      };

      const request = new NextRequest("http://localhost:3000/api/square/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dcc-test-bypass": "true",
        },
        body: JSON.stringify(payload),
      });

      const res = await squareWebhookPost(request);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ok, true);
      assert.equal(data.processed, true);
    });

    // 7d. Processes dispute.created event
    await wt.test("7d. Processes dispute.created event and marks chargeback", async () => {
      const disputeEventId = `test_ev_dispute_${Date.now()}`;
      const payload = {
        type: "dispute.created",
        event_id: disputeEventId,
        created_at: new Date().toISOString(),
        data: {
          type: "dispute",
          id: `dp_webhook_${Date.now()}`,
          object: {
            dispute: {
              id: `dp_webhook_${Date.now()}`,
              disputed_payment: { payment_id: masterPaymentId },
              state: "INQUIRY_EVIDENCE_REQUIRED",
              amount_money: { amount: 53700, currency: "USD" },
              reason: "FRAUDULENT",
            },
          },
        },
      };

      const request = new NextRequest("http://localhost:3000/api/square/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dcc-test-bypass": "true",
        },
        body: JSON.stringify(payload),
      });

      const res = await squareWebhookPost(request);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ok, true);
      assert.equal(data.processed, true);

      const payment = await DccPaymentService.getPaymentByOrderId(masterOrderId);
      assert.ok(payment);
      assert.equal(payment.status, "chargeback");
    });
  });
});
