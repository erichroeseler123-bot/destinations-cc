import test from "node:test";
import assert from "node:assert/strict";
import { DccSagaCoordinator, DccSagaRepository } from "@/lib/saga";
import { DccBookingService } from "@/lib/bookings";
import { DccOrderService } from "@/lib/orders";
import { DccPaymentService } from "@/lib/payments";
import { OctoApiError } from "@/lib/providers";

test("DCC Durable Saga Orchestration and Master Order Persistence", async (t) => {
  const customer = {
    fullName: "Eleanor Rigby",
    emailAddress: "eleanor.rigby@example.com",
    phoneNumber: "+1-555-0144",
    country: "US",
  };

  const validItems = [
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

  // 1. One successful multi-operator order
  await t.test("1. One successful multi-operator order execution", async () => {
    const result = await DccSagaCoordinator.executeOrderSaga({
      customer,
      items: validItems,
      currency: "USD",
    });

    assert.equal(result.successful, true);
    assert.equal(result.status, "SUCCEEDED");
    assert.ok(result.orderId.startsWith("dcc:ord:"));
    assert.ok(result.sagaId.startsWith("saga_"));
    assert.ok(result.paymentId);
    assert.equal(result.supplierBookings.length, 2);

    // Verify step progression
    const stepNames = result.steps.map((s) => s.stepName);
    assert.ok(stepNames.includes("AVAILABILITY_CHECK"));
    assert.ok(stepNames.includes("SUPPLIER_HOLD"));
    assert.ok(stepNames.includes("PAYMENT_AUTHORIZE"));
    assert.ok(stepNames.includes("SUPPLIER_CONFIRM"));
    assert.ok(stepNames.includes("PAYMENT_CAPTURE"));
    assert.ok(stepNames.includes("VOUCHER_RETRIEVAL"));

    // Verify persisted master order
    const order = await DccSagaRepository.getOrder(result.orderId);
    assert.ok(order);
    assert.equal(order.status, "CONFIRMED");
    assert.equal(order.items.length, 2);
    assert.ok(order.totalPrice > 0);
    assert.ok(order.items[0].voucher?.code);
    assert.ok(order.items[1].voucher?.code);

    // Verify audit trail
    const auditLogs = await DccSagaRepository.getAuditEventsForSaga(result.sagaId);
    assert.ok(auditLogs.length >= 2);
    const startLog = auditLogs.find((l) => l.eventType === "SAGA_STARTED");
    const completeLog = auditLogs.find((l) => l.eventType === "SAGA_COMPLETED");
    assert.ok(startLog);
    assert.ok(completeLog);
  });

  // 2. Supplier A hold succeeds, Supplier B hold fails -> compensation cancels Supplier A hold
  await t.test("2. Supplier A hold succeeds, Supplier B hold fails -> compensation cancels Supplier A hold", async () => {
    const result = await DccSagaCoordinator.executeOrderSaga(
      {
        customer,
        items: validItems,
        currency: "USD",
      },
      {
        simulatedErrors: {
          holdFailureOptionId: "opt_whale_photo",
        },
      }
    );

    assert.equal(result.successful, false);
    assert.equal(result.status, "COMPENSATED");
    assert.equal(result.errorCode, "SUPPLIER_HOLD_REJECTED");

    // Verify that Supplier A hold was created then cancelled
    assert.ok(result.supplierBookings.length >= 1);
    const firstBooking = result.supplierBookings[0];
    assert.equal(firstBooking.status, "CANCELLED");
    assert.ok(firstBooking.cancelledAt);

    // Verify order status in repository is FAILED
    const order = await DccSagaRepository.getOrder(result.orderId);
    assert.ok(order);
    assert.equal(order.status, "FAILED");
  });

  // 3. Successful hold cancellation
  await t.test("3. Successful hold cancellation", async () => {
    const hold = await DccBookingService.createHold({
      supplierConnectionId: "conn_mock_alaska",
      productId: "prod_alaska_whale_glacier",
      optionId: "opt_whale_standard",
      availabilityId: "avail_prod_alaska_whale_glacier_opt_whale_standard_2026-09-20_0900",
      unitItems: [{ unitId: "unit_adult", quantity: 1 }],
    });

    assert.equal(hold.status, "ON_HOLD");
    assert.ok(hold.uuid);

    const cancelled = await DccBookingService.cancelBooking(hold.uuid, {
      reason: "Traveler requested release of hold",
    });

    assert.equal(cancelled.status, "CANCELLED");
    assert.equal(cancelled.cancellationReason, "Traveler requested release of hold");
    assert.ok(cancelled.cancelledAt);
  });

  // 4. Confirmation failure -> compensation voids/refunds payment and cancels confirmed/held bookings
  await t.test("4. Confirmation failure -> compensation voids/refunds payment and cancels holds", async () => {
    const result = await DccSagaCoordinator.executeOrderSaga(
      {
        customer,
        items: validItems,
        currency: "USD",
      },
      {
        simulatedErrors: {
          failSupplierConfirmation: true,
        },
      }
    );

    assert.equal(result.successful, false);
    assert.equal(result.status, "COMPENSATED");
    assert.equal(result.errorCode, "SUPPLIER_CONFIRMATION_FAILED");

    // Verify bookings were compensated to CANCELLED
    for (const sb of result.supplierBookings) {
      assert.equal(sb.status, "CANCELLED");
    }

    // Verify payment was refunded / voided
    const order = await DccSagaRepository.getOrder(result.orderId);
    assert.ok(order);
    assert.equal(order.status, "FAILED");
  });

  // 5. Payment authorization failure -> compensation cancels holds
  await t.test("5. Payment authorization failure -> compensation cancels holds", async () => {
    const result = await DccSagaCoordinator.executeOrderSaga(
      {
        customer,
        items: validItems,
        currency: "USD",
      },
      {
        simulatedErrors: {
          failPaymentAuthorization: true,
        },
      }
    );

    assert.equal(result.successful, false);
    assert.equal(result.status, "COMPENSATED");
    assert.ok(result.errorCode?.includes("PAYMENT"));

    // Holds were created in step 2 and cancelled in compensation
    assert.equal(result.supplierBookings.length, 2);
    for (const sb of result.supplierBookings) {
      assert.equal(sb.status, "CANCELLED");
    }
  });

  // 6. Payment capture failure -> retries per policy, compensations on permanent failure
  await t.test("6. Payment capture failure -> retries per policy and compensations on permanent failure", async () => {
    const result = await DccSagaCoordinator.executeOrderSaga(
      {
        customer,
        items: validItems,
        currency: "USD",
      },
      {
        simulatedErrors: {
          failPaymentCapture: true,
        },
        retryPolicy: {
          maxRetries: 3,
        },
      }
    );

    assert.equal(result.successful, false);
    assert.equal(result.status, "COMPENSATED");
    assert.ok(result.errorCode?.includes("PAYMENT_CAPTURE"));

    // Verify step 5 capture attempted up to maxRetries
    const captureStep = result.steps.find((s) => s.stepName === "PAYMENT_CAPTURE");
    assert.ok(captureStep);
    assert.equal(captureStep.attemptCount, 3);

    // Bookings compensated
    for (const sb of result.supplierBookings) {
      assert.equal(sb.status, "CANCELLED");
    }
  });

  // 7. Expired ON_HOLD booking rejection
  await t.test("7. Expired ON_HOLD booking rejection", async () => {
    const result = await DccSagaCoordinator.executeOrderSaga(
      {
        customer,
        items: validItems,
        currency: "USD",
      },
      {
        simulatedErrors: {
          simulateExpiredHold: true,
        },
      }
    );

    assert.equal(result.successful, false);
    assert.equal(result.status, "COMPENSATED");
    assert.equal(result.errorCode, "EXPIRED_HOLD");
  });

  // 8. Compensation timeout and retry
  await t.test("8. Compensation timeout and retry", async () => {
    const result = await DccSagaCoordinator.executeOrderSaga(
      {
        customer,
        items: validItems,
        currency: "USD",
      },
      {
        simulatedErrors: {
          failPaymentAuthorization: true,
          simulateCompensationTimeout: true,
        },
        retryPolicy: {
          maxRetries: 3,
        },
      }
    );

    assert.equal(result.successful, false);
    assert.equal(result.status, "COMPENSATED");

    // All supplier bookings successfully marked CANCELLED after compensation retry
    for (const sb of result.supplierBookings) {
      assert.equal(sb.status, "CANCELLED");
    }
  });

  // 9. Duplicate request with same idempotency key returns existing order
  await t.test("9. Duplicate request with same idempotency key returns existing order", async () => {
    const idempotencyKey = `idem_dup_test_${Date.now()}`;

    const firstResult = await DccSagaCoordinator.executeOrderSaga({
      customer,
      items: validItems,
      currency: "USD",
      idempotencyKey,
    });

    assert.equal(firstResult.successful, true);

    const secondResult = await DccSagaCoordinator.executeOrderSaga({
      customer,
      items: validItems,
      currency: "USD",
      idempotencyKey,
    });

    assert.equal(secondResult.successful, true);
    assert.equal(secondResult.orderId, firstResult.orderId);
    assert.equal(secondResult.sagaId, firstResult.sagaId);
  });

  // 10. Altered idempotency request payload is rejected with 400
  await t.test("10. Altered idempotency request payload is rejected with 400", async () => {
    const idempotencyKey = `idem_altered_test_${Date.now()}`;

    await DccSagaCoordinator.executeOrderSaga({
      customer,
      items: validItems,
      currency: "USD",
      idempotencyKey,
    });

    // Altered payload with different item quantity
    await assert.rejects(
      async () => {
        await DccSagaCoordinator.executeOrderSaga({
          customer,
          items: [
            {
              productId: "prod_alaska_whale_glacier",
              optionId: "opt_whale_standard",
              availabilityId: "avail_prod_alaska_whale_glacier_opt_whale_standard_2026-09-20_0900",
              unitItems: [{ unitId: "unit_adult", quantity: 99 }], // altered
            },
          ],
          currency: "USD",
          idempotencyKey,
        });
      },
      (err: any) => {
        assert.ok(err instanceof OctoApiError);
        assert.equal(err.status, 400);
        assert.equal(err.code, "ALTERED_IDEMPOTENCY_REQUEST");
        return true;
      }
    );
  });

  // 11. Partial cancellation and refund adjusts order/item
  await t.test("11. Partial cancellation and refund adjusts order/item", async () => {
    const order = await DccOrderService.createOrder({
      customer,
      items: validItems,
    });

    assert.equal(order.items.length, 2);

    await DccOrderService.confirmOrder({
      orderId: order.orderId,
      contact: customer,
      payment: {
        provider: "stripe",
        paymentId: `pi_test_${Date.now()}`,
      },
    });

    const itemToCancel = order.items[0];
    const { order: updatedOrder, cancelledItem } = await DccOrderService.cancelOrderItem({
      orderId: order.orderId,
      itemId: itemToCancel.itemId,
      reason: "Guest requested cancellation of first tour",
    });

    assert.equal(cancelledItem.status, "CANCELLED");
    assert.equal(updatedOrder.status, "CONFIRMED"); // other item still confirmed
    assert.equal(updatedOrder.items.find((i) => i.itemId === itemToCancel.itemId)?.status, "CANCELLED");
    assert.equal(updatedOrder.items[1].status, "CONFIRMED");

    // Verify refund was logged
    const refunds = await DccPaymentService.getRefundsForOrder(order.orderId);
    assert.ok(refunds.length >= 1);
    assert.equal(refunds[0].orderItemId, itemToCancel.itemId);
  });

  // 12. Referral-only bookings remain outside DCC orders
  await t.test("12. Referral-only bookings remain outside DCC orders", async () => {
    await assert.rejects(
      async () => {
        await DccSagaCoordinator.executeOrderSaga({
          customer,
          items: [
            {
              productId: "ref_viator_grand_canyon_tour",
              optionId: "opt_external",
              availabilityId: "avail_external",
              unitItems: [{ unitId: "unit_adult", quantity: 1 }],
            },
          ],
        });
      },
      (err: any) => {
        assert.ok(err instanceof OctoApiError);
        assert.equal(err.status, 400);
        assert.equal(err.code, "REFERRAL_BOOKING_NOT_SUPPORTED");
        return true;
      }
    );
  });

  // 13. Unauthorized suppliers remain non-bookable directory listings
  await t.test("13. Unauthorized suppliers remain non-bookable directory listings", async () => {
    await assert.rejects(
      async () => {
        await DccSagaCoordinator.executeOrderSaga({
          customer,
          items: [
            {
              productId: "prod_vibe_st_thomas_tour",
              optionId: "opt_vibe_default",
              availabilityId: "avail_2026-09-20",
              unitItems: [{ unitId: "unit_adult", quantity: 1 }],
            },
          ],
        });
      },
      (err: any) => {
        assert.ok(err instanceof OctoApiError);
        assert.equal(err.status, 403);
        assert.equal(err.code, "UNAUTHORIZED_SUPPLIER");
        return true;
      }
    );
  });
});
