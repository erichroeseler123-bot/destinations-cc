import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { getCheckoutPricing, getCheckoutRouteConfig } from "@/lib/checkoutProducts";
import { writeStoredOrder } from "@/lib/orders";
import { getParrSharedAvailability } from "@/lib/parrSharedAvailability";

test("parr-shared pricing charges the full seat total now", () => {
  const route = getCheckoutRouteConfig("parr-shared");
  assert.ok(route);
  assert.equal(route?.depositPercentage, 100);

  const pricing = getCheckoutPricing("parr-shared", "parr-shared-golden", 3);
  assert.ok(pricing);
  assert.equal(pricing?.totalCents, 17700);
  assert.equal(pricing?.amountDueNowCents, 17700);
  assert.equal(pricing?.remainingBalanceCents, 0);
});

test("parr-shared availability counts confirmed seats by quantity", async () => {
  const orderIds = [
    `parr-shared_${Date.now()}_goldenA`,
    `parr-shared_${Date.now()}_goldenB`,
  ];
  const orderPaths = orderIds.map((orderId) =>
    path.join(process.cwd(), "data", "orders", "parr-shared", `${orderId}.json`),
  );

  try {
    await writeStoredOrder({
      orderId: orderIds[0],
      route: "parr-shared",
      product: "parr-shared-golden",
      qty: 4,
      partySize: 4,
      date: "2026-08-01",
      status: "paid_in_full",
      payment: {
        provider: "square",
        status: "paid_in_full",
      },
    });

    await writeStoredOrder({
      orderId: orderIds[1],
      route: "parr-shared",
      product: "parr-shared-golden",
      qty: 2,
      partySize: 2,
      date: "2026-08-01",
      status: "pending",
      payment: {
        provider: "square",
        status: "pending",
      },
    });

    const availability = await getParrSharedAvailability("2026-08-01");
    const golden = availability.find((row) => row.productKey === "parr-shared-golden");

    assert.ok(golden);
    assert.equal(golden?.total, 24);
    assert.equal(golden?.booked, 4);
    assert.equal(golden?.remaining, 20);
    assert.equal(golden?.available, true);
  } finally {
    for (const orderPath of orderPaths) {
      if (fs.existsSync(orderPath)) {
        fs.unlinkSync(orderPath);
      }
    }
  }
});
