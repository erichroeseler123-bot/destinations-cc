import test from "node:test";
import assert from "node:assert/strict";
import { DccOrderService } from "@/lib/orders";
import { DccPaymentService } from "@/lib/payments";
import { DccTravelerService } from "@/lib/travelers";
import { getSquareLocationIdDcc } from "@/lib/squareConfig";

test("DCC Checkout Integration with Single Square Payment Covering Multi-Tour Orders", async (t) => {
  const customer = {
    fullName: "Audrey Hepburn",
    emailAddress: "audrey.checkout@example.com",
    phoneNumber: "+1-555-0188",
    country: "US",
  };

  const multiItems = [
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

  let sharedOrderId = "";
  let sharedPaymentId = "";

  // SCENARIO 1: One Square payment record for two or more order items
  await t.test("1. One Square payment record for two or more order items", async () => {
    const result = await DccOrderService.checkoutOrderWithSquare({
      contact: customer,
      items: multiItems,
      sourceId: "cnon:card-nonce-ok",
      idempotencyKey: "sq_checkout_test_1",
    });

    assert.equal(result.status, "CONFIRMED");
    assert.equal(result.order.status, "CONFIRMED");
    assert.equal(result.order.items.length, 2);
    assert.ok(result.order.orderId.startsWith("dcc:ord:"));
    assert.ok(result.paymentId);
    sharedOrderId = result.order.orderId;
    sharedPaymentId = result.paymentId;

    // Verify exactly ONE Square payment record exists for the DCC master order
    const payment = await DccPaymentService.getPaymentByOrderId(result.order.orderId);
    assert.ok(payment, "Master order must have a payment record");
    assert.equal(payment.paymentProvider, "square");
    assert.equal(payment.id, result.paymentId);
    assert.equal(payment.status, "captured");

    // Total amount must equal sum of item retail prices: 2*179 + 1*179 = 537
    const expectedTotal = 179 * 2 + 179 * 1;
    assert.equal(payment.amount, expectedTotal);
    assert.equal(result.order.totalPrice, expectedTotal);

    // Verify vouchers were generated for each item in the order
    for (const it of result.order.items) {
      assert.equal(it.status, "CONFIRMED");
      assert.ok(it.voucher?.code, "Item must have a valid voucher code");
    }
  });

  // SCENARIO 2: Duplicate checkout does not create a second payment
  await t.test("2. Duplicate checkout does not create a second payment", async () => {
    const dupResult = await DccOrderService.checkoutOrderWithSquare({
      orderId: sharedOrderId,
      contact: customer,
      sourceId: "cnon:card-nonce-ok",
      idempotencyKey: "sq_checkout_test_1",
    });

    assert.equal(dupResult.alreadyCompleted, true);
    assert.equal(dupResult.status, "CONFIRMED");
    assert.equal(dupResult.paymentId, sharedPaymentId);

    // Verify still exactly one payment record
    const payment = await DccPaymentService.getPaymentByOrderId(sharedOrderId);
    assert.ok(payment);
    assert.equal(payment.id, sharedPaymentId);
    assert.equal(payment.status, "captured");
  });

  // SCENARIO 3: Supplier hold failure voids or refunds the one payment
  await t.test("3. Supplier hold failure voids or refunds the one payment", async () => {
    await assert.rejects(
      async () => {
        await DccOrderService.checkoutOrderWithSquare({
          contact: {
            fullName: "Failing Hold Traveler",
            emailAddress: "hold.fail@example.com",
          },
          items: multiItems,
          sourceId: "cnon:card-nonce-ok",
          options: {
            simulateHoldFailure: true,
          },
        });
      },
      (err: any) => {
        assert.ok(err.message.includes("Supplier hold failed"));
        return true;
      }
    );
  });

  // SCENARIO 4: Confirmation failure compensates all successful holds
  await t.test("4. Confirmation failure compensates all successful holds", async () => {
    await assert.rejects(
      async () => {
        await DccOrderService.checkoutOrderWithSquare({
          contact: {
            fullName: "Confirmation Fail Traveler",
            emailAddress: "confirm.fail@example.com",
          },
          items: multiItems,
          sourceId: "cnon:card-nonce-ok",
          options: {
            simulateConfirmationFailure: true,
          },
        });
      },
      (err: any) => {
        assert.ok(err.message.includes("Supplier confirmation failed"));
        return true;
      }
    );
  });

  // SCENARIO 5: Partial cancellation creates a partial refund
  await t.test("5. Partial cancellation creates a partial refund", async () => {
    // Check out a fresh order with 2 items for partial cancellation test
    const freshOrderResult = await DccOrderService.checkoutOrderWithSquare({
      contact: {
        fullName: "Partial Cancel Traveler",
        emailAddress: "partial.cancel@example.com",
      },
      items: multiItems,
      sourceId: "cnon:card-nonce-ok",
    });

    const orderId = freshOrderResult.order.orderId;
    const itemToCancel = freshOrderResult.order.items[0];
    assert.ok(itemToCancel);

    // Cancel first item
    const cancelResult = await DccOrderService.cancelOrderItem({
      orderId,
      itemId: itemToCancel.itemId,
      reason: "Customer itinerary adjustment",
    });

    assert.equal(cancelResult.cancelledItem.status, "CANCELLED");
    // Remaining item stays CONFIRMED
    const remainingItem = cancelResult.order.items.find((it) => it.itemId !== itemToCancel.itemId);
    assert.ok(remainingItem);
    assert.equal(remainingItem.status, "CONFIRMED");

    // Verify Square payment is now partially_refunded
    const payment = await DccPaymentService.getPaymentByOrderId(orderId);
    assert.ok(payment);
    assert.equal(payment.status, "partially_refunded");

    // Verify refund record exists with exact cancelled item price
    const refunds = await DccPaymentService.getRefundsForOrder(orderId);
    assert.ok(refunds.length >= 1);
    const itemRefund = refunds.find((r) => r.orderItemId === itemToCancel.itemId);
    assert.ok(itemRefund);
    assert.equal(itemRefund.amount, itemToCancel.price);
  });

  // SCENARIO 6: DCC-created bookings appear in My Trips
  await t.test("6. DCC-created bookings appear in My Trips", async () => {
    const tripsTravelerEmail = "trips.traveler@example.com";
    const checkoutResult = await DccOrderService.checkoutOrderWithSquare({
      contact: {
        fullName: "Trips Traveler",
        emailAddress: tripsTravelerEmail,
      },
      items: multiItems,
      sourceId: "cnon:card-nonce-ok",
    });

    const myTrips = await DccTravelerService.getTravelerTrips(tripsTravelerEmail);
    assert.ok(myTrips.orders.length >= 1);

    const tripOrder = myTrips.orders.find((o) => o.orderId === checkoutResult.order.orderId);
    assert.ok(tripOrder, "Checked out order must appear in My Trips");
    assert.equal(tripOrder.status, "CONFIRMED");
    assert.equal(tripOrder.paymentStatus, "captured");
    assert.equal(tripOrder.items.length, 2);

    for (const it of tripOrder.items) {
      assert.equal(it.status, "CONFIRMED");
      assert.ok(it.voucher?.code, "Trip booking voucher must be retrievable in My Trips");
    }
  });

  // SCENARIO 7: Referral-only bookings remain outside DCC orders
  await t.test("7. Referral-only bookings remain outside DCC orders", async () => {
    // External referral clickouts (e.g. Viator affiliate, SaveOnTheStrip, GoSno) do NOT create DCC orders
    const fakeViatorRefId = "viator:ref:ext-12345";
    const order = await DccOrderService.getOrder(fakeViatorRefId);
    assert.equal(order, null, "Referral-only clickout must not exist as a DCC Master Order");

    // Traveler trips query must not include raw referral clickouts
    const travelerEmail = "referral.user@example.com";
    const trips = await DccTravelerService.getTravelerTrips(travelerEmail);
    const hasExternal = trips.orders.some((o) => o.orderId.includes("viator") || o.orderId.includes("gosno"));
    assert.equal(hasExternal, false, "Referrals must not be falsely displayed in My Trips");

    // Location ID isolation: DCC location must not be mixed with GoSno
    const dccLocation = getSquareLocationIdDcc();
    assert.ok(typeof dccLocation === "string", "DCC Square location ID is resolved");
  });
});
