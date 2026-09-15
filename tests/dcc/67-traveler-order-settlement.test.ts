import test from "node:test";
import assert from "node:assert/strict";
import { DccTravelerService } from "@/lib/travelers";
import { DccOrderService } from "@/lib/orders";
import { DccPaymentService } from "@/lib/payments";
import { DccSettlementEngine } from "@/lib/settlement";

test("DCC Traveler Profiles and Master Order Settlement Lifecycle", async (t) => {
  const testEmail = `traveler_${Date.now()}@example.com`;

  await t.test("1. Traveler profile creation and retrieval", async () => {
    const profile = await DccTravelerService.getOrCreateProfile(testEmail, "Jane Traveler", "+1-555-0199");
    assert.ok(profile.id.startsWith("dcc:trav:"));
    assert.equal(profile.email, testEmail);
    assert.equal(profile.fullName, "Jane Traveler");
    assert.equal(profile.phoneNumber, "+1-555-0199");

    const fetched = await DccTravelerService.getProfile(profile.id);
    assert.ok(fetched);
    assert.equal(fetched.id, profile.id);
    assert.equal(fetched.email, testEmail);

    const fetchedByEmail = await DccTravelerService.getProfileByEmail(testEmail);
    assert.ok(fetchedByEmail);
    assert.equal(fetchedByEmail.id, profile.id);
  });

  let sessionToken: string = "";
  await t.test("2. Passwordless OTP generation, verification, and session token signing", async () => {
    const challenge = await DccTravelerService.createPasswordlessChallenge(testEmail);
    assert.ok(challenge.challengeId.startsWith("chal_"));
    assert.equal(challenge.otpCode.length, 6);
    assert.ok(/^\d{6}$/.test(challenge.otpCode));

    // Verify challenge with OTP code
    const authResult = await DccTravelerService.verifyPasswordlessChallenge(testEmail, challenge.otpCode);
    assert.ok(authResult.session.sessionToken);
    assert.equal(authResult.session.email, testEmail);
    sessionToken = authResult.session.sessionToken;

    // Verify session
    const verified = DccTravelerService.verifySession(sessionToken);
    assert.ok(verified);
    assert.equal(verified.email, testEmail);

    // Tampered token should fail
    const tampered = sessionToken.slice(0, -4) + "XXXX";
    assert.equal(DccTravelerService.verifySession(tampered), null);
  });

  let orderId: string = "";
  let item1Id: string = "";
  let item2Id: string = "";

  await t.test("3. Master DCC Order creation with multi-supplier holds", async () => {
    const order = await DccOrderService.createOrder({
      customer: {
        fullName: "Jane Traveler",
        emailAddress: testEmail,
      },
      items: [
        {
          productId: "prod_alaska_whale_glacier",
          optionId: "opt_whale_standard",
          availabilityId: "avail_prod_alaska_whale_glacier_opt_whale_standard_2026-09-20_0900",
          unitItems: [{ unitId: "unit_adult", quantity: 2 }],
        },
        {
          productId: "prod_alaska_whale_glacier",
          optionId: "opt_whale_standard",
          availabilityId: "avail_prod_alaska_whale_glacier_opt_whale_standard_2026-09-21_0900",
          unitItems: [{ unitId: "unit_adult", quantity: 1 }],
        },
      ],
    });

    assert.ok(order.orderId.startsWith("dcc:ord:"));
    assert.equal(order.status, "ON_HOLD");
    assert.equal(order.items.length, 2);
    assert.ok(order.totalPrice > 0);
    assert.ok(order.utcHoldExpires);

    orderId = order.orderId;
    item1Id = order.items[0].itemId;
    item2Id = order.items[1].itemId;

    assert.ok(item1Id.startsWith("dcc:item:"));
    assert.ok(item2Id.startsWith("dcc:item:"));
    assert.ok(order.items[0].bookingId?.startsWith("dcc:bk:"));
    assert.ok(order.items[1].bookingId?.startsWith("dcc:bk:"));
  });

  await t.test("4. Single customer payment record and order confirmation", async () => {
    const confirmResult = await DccOrderService.confirmOrder({
      orderId,
      contact: {
        fullName: "Jane Traveler",
        emailAddress: testEmail,
      },
      payment: {
        provider: "stripe",
        paymentId: `pay_test_${Date.now()}`,
        status: "captured",
      },
    });

    assert.equal(confirmResult.order.status, "CONFIRMED");
    assert.ok(confirmResult.order.paymentId);
    assert.equal(confirmResult.bookings.length, 2);
    assert.ok(confirmResult.order.travelerId);

    // Verify payment record in DccPaymentService
    const paymentRecord = await DccPaymentService.getPaymentByOrderId(orderId);
    assert.ok(paymentRecord);
    assert.equal(paymentRecord.orderId, orderId);
    assert.equal(paymentRecord.status, "captured");

    // Vouchers populated
    assert.ok(confirmResult.order.items[0].voucher?.code);
    assert.ok(confirmResult.order.items[1].voucher?.code);
  });

  let booking1Id: string = "";
  let booking2Id: string = "";

  await t.test("5. Settlement rule: pending until tour completion, configurable commission", async () => {
    const order = await DccOrderService.getOrder(orderId);
    assert.ok(order);
    booking1Id = order.items[0].bookingId!;
    booking2Id = order.items[1].bookingId!;

    const settlement1 = await DccSettlementEngine.getSettlementEntry(booking1Id);
    assert.ok(settlement1);
    // Invariant: MUST start as pending
    assert.equal(settlement1.settlementStatus, "pending");
    assert.equal(settlement1.serviceCompleted, false);
    assert.ok(settlement1.operatorShareAmount > 0);

    // Check operator balance: pending payable should reflect both items
    const balanceBefore = await DccSettlementEngine.getOperatorBalance("alaska-premier-expeditions");
    assert.ok(balanceBefore.totalPendingPayable > 0);
    assert.equal(balanceBefore.totalReadyForPayout, 0);

    // Fulfill service 1: mark completed
    const completedEntry = await DccSettlementEngine.markServiceCompleted(booking1Id);
    assert.ok(completedEntry);
    assert.equal(completedEntry.serviceCompleted, true);
    assert.equal(completedEntry.settlementStatus, "ready_for_payout");

    // Check balance after fulfillment: item 1 moved from pending to ready_for_payout
    const balanceAfter = await DccSettlementEngine.getOperatorBalance("alaska-premier-expeditions");
    assert.ok(balanceAfter.totalReadyForPayout > 0);
  });

  await t.test("6. Partial cancellation: item-level refund and settlement adjustment", async () => {
    const cancelResult = await DccOrderService.cancelOrderItem({
      orderId,
      itemId: item2Id,
      reason: "Traveler changed schedule",
    });

    assert.equal(cancelResult.cancelledItem.status, "CANCELLED");
    // Order should remain CONFIRMED because item 1 is still confirmed
    assert.equal(cancelResult.order.status, "CONFIRMED");

    // Verify refund record created
    const refunds = await DccPaymentService.getRefundsForOrder(orderId);
    assert.ok(refunds.length > 0);
    const itemRefund = refunds.find((r) => r.orderItemId === item2Id);
    assert.ok(itemRefund);
    assert.equal(itemRefund.type, "refund");
    assert.equal(itemRefund.status, "processed");

    // Verify settlement adjusted
    const settlement2 = await DccSettlementEngine.getSettlementEntry(booking2Id);
    assert.ok(settlement2);
    assert.equal(settlement2.settlementStatus, "reversed");
  });

  await t.test("7. Chargeback dispute recording", async () => {
    const chargeback = await DccPaymentService.recordChargeback({
      orderId,
      operatorSlug: "alaska-premier-expeditions",
      amount: 50.0,
      reason: "Customer disputed transaction with bank",
    });

    assert.ok(chargeback.id.startsWith("chg_"));
    assert.equal(chargeback.type, "chargeback");

    await DccSettlementEngine.adjustForChargeback({
      operatorSlug: "alaska-premier-expeditions",
      bookingId: booking1Id,
      chargebackAmount: 50.0,
    });

    const settlement1 = await DccSettlementEngine.getSettlementEntry(booking1Id);
    assert.ok(settlement1);
    assert.equal(settlement1.settlementStatus, "disputed");
  });

  await t.test("8. My Trips query: shows DCC orders and operator items, excludes external referrals", async () => {
    const trips = await DccTravelerService.getTravelerTrips(testEmail);
    assert.ok(trips);
    assert.equal(trips.traveler.email, testEmail);
    assert.ok(trips.orders.length >= 1);

    const tripOrder = trips.orders.find((o) => o.orderId === orderId);
    assert.ok(tripOrder);
    assert.equal(tripOrder.items.length, 2);

    // Item 1 is confirmed / completed
    const it1 = tripOrder.items.find((it) => it.bookingId === booking1Id);
    assert.ok(it1);
    assert.ok(it1.voucher?.code);

    // Item 2 is cancelled
    const it2 = tripOrder.items.find((it) => it.bookingId === booking2Id);
    assert.ok(it2);
    assert.equal(it2.status, "CANCELLED");

    // Confirm no external referral bookings (Viator/FareHarbor) are present
    for (const ord of trips.orders) {
      for (const it of ord.items) {
        assert.ok(it.bookingId.startsWith("dcc:bk:") || it.bookingId.startsWith("dcc:item:"));
      }
    }
  });
});
