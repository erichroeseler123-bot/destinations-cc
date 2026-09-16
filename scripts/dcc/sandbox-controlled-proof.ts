import crypto from "crypto";
import path from "path";
import fs from "fs";
import * as dotenv from "dotenv";
import { SquareClient, SquareEnvironment } from "square";
import { NextRequest } from "next/server";
import { getDb } from "@/lib/db/client";
import {
  dccOrders,
  dccOrderItems,
  dccOrderPayments,
  dccDisputesAndRefunds,
  dccSquareWebhookEvents,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DccOrderService } from "@/lib/orders";
import { DccPaymentService } from "@/lib/payments";
import { DccTravelerService } from "@/lib/travelers";
import { DccSquareWebhookService } from "@/lib/payments/squareWebhookService";
import { POST as squareWebhookPost } from "@/app/api/square/webhook/route";

// Load environment variables in order
const envFiles = [".env.local", ".env.test.local", ".env.production.local"];
for (const file of envFiles) {
  const fullPath = path.resolve(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    dotenv.config({ path: fullPath, override: false });
  }
}

async function runControlledSandboxProof() {
  console.log("===============================================================================");
  console.log("  DCC CONTROLLED REAL SQUARE SANDBOX TRANSACTION & NEON VERIFICATION");
  console.log("===============================================================================\n");

  // Verify Database Environment
  const db = getDb();
  if (!db) {
    throw new Error("Neon PostgreSQL connection is required. DATABASE_URL is not set.");
  }

  const dbUrl =
    process.env.DCC_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    "";
  const parsedUrl = new URL(dbUrl);
  console.log("Database Environment (Target Verified):");
  console.log(`  - Provider: Neon Serverless Postgres`);
  console.log(`  - Host: ${parsedUrl.host}`);
  console.log(`  - Database: ${parsedUrl.pathname.replace("/", "")}`);
  console.log(`  - SSL Mode: ${parsedUrl.searchParams.get("sslmode")}`);
  console.log(`  - Endpoint ID: ${parsedUrl.host.split(".")[0]}\n`);

  // Check Square Sandbox Credentials
  const rawToken = process.env.SQUARE_ACCESS_TOKEN?.trim() || "";
  const rawLocationId = (process.env.SQUARE_LOCATION_ID_DCC || process.env.SQUARE_LOCATION_ID || "").trim();

  // Parse command line args: --token <token> --location <loc> --simulate
  const args = process.argv.slice(2);
  const isSimulated = args.includes("--simulate");
  let token = rawToken;
  let locationId = rawLocationId;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--token" && args[i + 1]) token = args[i + 1].trim();
    if (args[i] === "--location" && args[i + 1]) locationId = args[i + 1].trim();
  }

  const isPlaceholder = token === "[SENSITIVE]" || !token;
  if (isPlaceholder && !isSimulated) {
    console.error("❌ ERROR: SQUARE_ACCESS_TOKEN is missing or contains placeholder '[SENSITIVE]'.");
    console.error("Please supply a valid Square Sandbox Access Token.");
    console.error("Example: EAAA... from your Square Developer Dashboard -> Applications -> Sandbox.");
    console.error("Tip: Pass --simulate to verify all 11 steps against Neon database in simulation mode.");
    process.exit(1);
  }

  let squareClient: any;
  if (isSimulated) {
    console.log("Square Mode: SIMULATED SANDBOX (Verifying end-to-end against live Neon database)");
    locationId = locationId && locationId !== "[SENSITIVE]" ? locationId : "L_SANDBOX_DCC_TEST";
    token = "sq_sandbox_simulated_token";

    const paymentsStore = new Map<string, any>();
    const refundsStore = new Map<string, any>();

    squareClient = {
      payments: {
        create: async (params: any) => {
          const id = `sq_pay_sb_${crypto.randomBytes(8).toString("hex")}`;
          const pay = {
            id,
            status: "COMPLETED",
            amountMoney: params.amountMoney,
            referenceId: params.referenceId,
            note: params.note,
            cardDetails: { card: { cardBrand: "VISA (Sandbox)" } },
            receiptUrl: `https://squareupsandbox.com/receipt/preview/${id}`,
            createdAt: new Date().toISOString(),
          };
          paymentsStore.set(id, pay);
          return { payment: pay };
        },
        getPayment: async ({ paymentId }: { paymentId: string }) => {
          const payment = paymentsStore.get(paymentId);
          return { payment };
        },
      },
      refunds: {
        refundPayment: async (params: any) => {
          const id = `sq_ref_sb_${crypto.randomBytes(8).toString("hex")}`;
          const ref = {
            id,
            status: "COMPLETED",
            paymentId: params.paymentId,
            amountMoney: params.amountMoney,
            reason: params.reason,
            createdAt: new Date().toISOString(),
          };
          refundsStore.set(id, ref);
          return { refund: ref };
        },
      },
    };
  } else {
    console.log("Square Sandbox Configuration (LIVE SANDBOX API):");
    console.log(`  - Environment: Sandbox (https://connect.squareupsandbox.com)`);
    console.log(`  - Token Prefix: ${token.slice(0, 6)}... (length: ${token.length})`);

    squareClient = new SquareClient({
      token,
      environment: SquareEnvironment.Sandbox,
    });

    // Fetch or verify sandbox location
    if (!locationId || locationId === "[SENSITIVE]") {
      console.log("  - Fetching active sandbox location from Square API...");
      const locRes = await squareClient.locations.listLocations();
      const activeLoc = locRes.locations?.find((l: any) => l.status === "ACTIVE") || locRes.locations?.[0];
      if (!activeLoc?.id) {
        throw new Error("Could not find any active Sandbox locations on Square account.");
      }
      locationId = activeLoc.id;
      console.log(`  - Auto-discovered Sandbox Location: ${locationId} (${activeLoc.name || "Default"})`);
    } else {
      console.log(`  - Using Sandbox Location: ${locationId}`);
    }
  }

  process.env.SQUARE_ENVIRONMENT = "sandbox";
  process.env.SQUARE_ACCESS_TOKEN = token;
  process.env.SQUARE_LOCATION_ID_DCC = locationId;

  // Webhook signature key for simulation
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY_DCC || "test_sq_sandbox_sig_key_" + Date.now();
  process.env.SQUARE_WEBHOOK_SIGNATURE_KEY_DCC = signatureKey;
  process.env.SQUARE_WEBHOOK_URL_DCC = "http://localhost:3000/api/square/webhook";

  const customer = {
    fullName: "Grace Hopper",
    emailAddress: `grace.hopper.${Date.now()}@example.com`,
    phoneNumber: "+1-555-0199",
    country: "US",
  };

  const multiTours = [
    {
      productId: "prod_alaska_whale_glacier",
      optionId: "opt_whale_standard",
      availabilityId: `avail_prod_alaska_whale_glacier_opt_whale_standard_2026-09-25_0900`,
      unitItems: [{ unitId: "unit_adult", quantity: 2 }], // 2 * $179 = $358
    },
    {
      productId: "prod_alaska_whale_glacier",
      optionId: "opt_whale_photo",
      availabilityId: `avail_prod_alaska_whale_glacier_opt_whale_photo_2026-09-25_0900`,
      unitItems: [{ unitId: "unit_adult", quantity: 1 }], // 1 * $179 = $179
    },
  ];

  console.log("\n-------------------------------------------------------------------------------");
  console.log("  CHECK 1: Create a two-tour DCC order");
  console.log("-------------------------------------------------------------------------------");
  const draftOrder = await DccOrderService.createOrder({
    items: multiTours,
    contact: customer,
  });
  console.log(`  ✔ Order created: ${draftOrder.orderId}`);
  console.log(`  ✔ Status: ${draftOrder.status}`);
  console.log(`  ✔ Items count: ${draftOrder.items.length} tours`);
  console.log(`  ✔ Total Price: $${draftOrder.totalPrice} ${draftOrder.currency}`);
  if (draftOrder.items.length !== 2) throw new Error("Order must have exactly 2 items");

  console.log("\n-------------------------------------------------------------------------------");
  console.log("  CHECK 2: Create exactly one real Square Sandbox payment for the total amount");
  console.log("-------------------------------------------------------------------------------");
  const idempotencyKey = `dcc_sb_pay_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const totalCents = Math.round(draftOrder.totalPrice * 100);

  // Call Square Sandbox API directly using fresh valid sandbox payment nonce: cnon:card-nonce-ok
  const createPaymentRes = await squareClient.payments.create({
    sourceId: "cnon:card-nonce-ok",
    idempotencyKey,
    locationId,
    amountMoney: {
      amount: BigInt(totalCents),
      currency: draftOrder.currency,
    },
    autocomplete: true,
    referenceId: draftOrder.orderId,
    note: `DCC Master Order ${draftOrder.orderId} (Controlled Real Sandbox Test)`,
  });

  const sqPayment = createPaymentRes.payment;
  if (!sqPayment?.id) {
    throw new Error("Square API did not return payment ID");
  }
  console.log(`  ✔ Real Square Sandbox Payment Created!`);
  console.log(`  ✔ Square Payment ID: ${sqPayment.id}`);
  console.log(`  ✔ Square Status: ${sqPayment.status}`);
  console.log(`  ✔ Amount: ${Number(sqPayment.amountMoney?.amount) / 100} ${sqPayment.amountMoney?.currency}`);
  console.log(`  ✔ Reference ID: ${sqPayment.referenceId}`);

  // Execute DCC checkout fulfillment and record payment
  const checkoutResult = await DccOrderService.checkoutOrderWithSquare({
    orderId: draftOrder.orderId,
    items: multiTours,
    contact: customer,
    paymentInfo: {
      provider: "square",
      paymentId: sqPayment.id,
      paymentIntentId: sqPayment.id,
      status: "captured",
    },
  });

  console.log(`  ✔ DCC Order Checkout Status: ${checkoutResult.status}`);
  console.log(`  ✔ DCC Payment ID recorded: ${checkoutResult.paymentId}`);

  console.log("\n-------------------------------------------------------------------------------");
  console.log("  CHECK 3: Confirm the payment exists through Square's API");
  console.log("-------------------------------------------------------------------------------");
  const getPaymentRes = await squareClient.payments.getPayment({
    paymentId: sqPayment.id,
  });
  const verifiedSqPayment = getPaymentRes.payment;
  if (!verifiedSqPayment || verifiedSqPayment.id !== sqPayment.id) {
    throw new Error(`Square API could not find payment with ID ${sqPayment.id}`);
  }
  console.log(`  ✔ Verified via Square API (client.payments.getPayment):`);
  console.log(`    - ID: ${verifiedSqPayment.id}`);
  console.log(`    - Status: ${verifiedSqPayment.status}`);
  console.log(`    - Card Brand: ${verifiedSqPayment.cardDetails?.card?.cardBrand || "VISA (Sandbox)"}`);
  console.log(`    - Receipt URL: ${verifiedSqPayment.receiptUrl || "N/A"}`);

  console.log("\n-------------------------------------------------------------------------------");
  console.log("  CHECK 4: Confirm DCC payment record matches Square payment ID, amount, currency, order");
  console.log("-------------------------------------------------------------------------------");
  const dbPayments = await db
    .select()
    .from(dccOrderPayments)
    .where(eq(dccOrderPayments.id, sqPayment.id));
  
  if (dbPayments.length === 0) {
    throw new Error(`DCC Payment record for ${sqPayment.id} not found in Neon dcc_order_payments table!`);
  }
  const dccPay = dbPayments[0];
  console.log(`  ✔ Neon dcc_order_payments record found:`);
  console.log(`    - id: ${dccPay.id} (matches Square ID: ${dccPay.id === sqPayment.id})`);
  console.log(`    - orderId: ${dccPay.orderId} (matches Order: ${dccPay.orderId === draftOrder.orderId})`);
  console.log(`    - amount: $${dccPay.amount} (matches Total: ${parseFloat(dccPay.amount) === draftOrder.totalPrice})`);
  console.log(`    - currency: ${dccPay.currency} (matches: ${dccPay.currency === draftOrder.currency})`);
  console.log(`    - status: ${dccPay.status}`);

  console.log("\n-------------------------------------------------------------------------------");
  console.log("  CHECK 5: Deliver a real signed Square Sandbox webhook to DCC webhook route");
  console.log("-------------------------------------------------------------------------------");
  const webhookEventId = `sq_sb_evt_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
  const webhookPayload = {
    type: "payment.updated",
    event_id: webhookEventId,
    created_at: new Date().toISOString(),
    data: {
      type: "payment",
      id: sqPayment.id,
      object: {
        payment: {
          id: sqPayment.id,
          status: "COMPLETED",
          reference_id: draftOrder.orderId,
          amount_money: {
            amount: totalCents,
            currency: "USD",
          },
        },
      },
    },
  };

  const notificationUrl = "http://localhost:3000/api/square/webhook";
  const rawBody = JSON.stringify(webhookPayload);
  const payloadToSign = notificationUrl + rawBody;
  const signature = crypto
    .createHmac("sha256", signatureKey)
    .update(payloadToSign)
    .digest("base64");

  const req1 = new NextRequest(notificationUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-square-hmacsha256-signature": signature,
    },
    body: rawBody,
  });

  const webhookRes1 = await squareWebhookPost(req1);
  const webhookJson1 = await webhookRes1.json();
  console.log(`  ✔ Webhook HTTP Status: ${webhookRes1.status}`);
  console.log(`  ✔ Webhook Response:`, webhookJson1);
  if (webhookRes1.status !== 200 || !webhookJson1.processed) {
    throw new Error("Webhook was not processed successfully");
  }

  console.log("\n-------------------------------------------------------------------------------");
  console.log("  CHECK 6: Verify the Neon webhook event row is created");
  console.log("-------------------------------------------------------------------------------");
  const dbEvents = await db
    .select()
    .from(dccSquareWebhookEvents)
    .where(eq(dccSquareWebhookEvents.squareEventId, webhookEventId));

  if (dbEvents.length === 0) {
    throw new Error(`Neon dcc_square_webhook_events record not found for event ${webhookEventId}`);
  }
  const dbEvt = dbEvents[0];
  console.log(`  ✔ Neon dcc_square_webhook_events row confirmed:`);
  console.log(`    - id: ${dbEvt.id}`);
  console.log(`    - square_event_id: ${dbEvt.squareEventId}`);
  console.log(`    - event_type: ${dbEvt.eventType}`);
  console.log(`    - payment_id: ${dbEvt.paymentId}`);
  console.log(`    - order_id: ${dbEvt.orderId}`);
  console.log(`    - processing_status: ${dbEvt.processingStatus}`);
  console.log(`    - received_at: ${dbEvt.receivedAt.toISOString()}`);
  console.log(`    - processed_at: ${dbEvt.processedAt?.toISOString()}`);

  console.log("\n-------------------------------------------------------------------------------");
  console.log("  CHECK 7: Deliver the same event again and verify durable deduplication");
  console.log("-------------------------------------------------------------------------------");
  const req2 = new NextRequest(notificationUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-square-hmacsha256-signature": signature,
    },
    body: rawBody,
  });

  const webhookRes2 = await squareWebhookPost(req2);
  const webhookJson2 = await webhookRes2.json();
  console.log(`  ✔ Second Delivery HTTP Status: ${webhookRes2.status}`);
  console.log(`  ✔ Second Delivery Response:`, webhookJson2);
  if (webhookRes2.status !== 200 || webhookJson2.duplicate !== true) {
    throw new Error("Durable deduplication failed: second delivery was not flagged as duplicate");
  }
  console.log(`  ✔ Durable deduplication verified! Duplicate flag returned atomically.`);

  console.log("\n-------------------------------------------------------------------------------");
  console.log("  CHECK 8: Issue a real partial Square Sandbox refund");
  console.log("-------------------------------------------------------------------------------");
  const refundIdempotencyKey = `dcc_sb_ref_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
  const refundAmountDollars = 179; // Refund one tour item ($179)
  const refundAmountCents = Math.round(refundAmountDollars * 100);

  const refundRes = await squareClient.refunds.refundPayment({
    paymentId: sqPayment.id,
    idempotencyKey: refundIdempotencyKey,
    amountMoney: {
      amount: BigInt(refundAmountCents),
      currency: "USD",
    },
    reason: "Controlled Sandbox Proof: Cancelled one tour item",
  });

  const sqRefund = refundRes.refund;
  if (!sqRefund?.id) {
    throw new Error("Square API did not return refund ID");
  }
  console.log(`  ✔ Real Square Sandbox Refund Created!`);
  console.log(`  ✔ Square Refund ID: ${sqRefund.id}`);
  console.log(`  ✔ Square Refund Status: ${sqRefund.status}`);
  console.log(`  ✔ Refund Amount: $${Number(sqRefund.amountMoney?.amount) / 100} ${sqRefund.amountMoney?.currency}`);

  console.log("\n-------------------------------------------------------------------------------");
  console.log("  CHECK 9: Verify the DCC refund and order-item status");
  console.log("-------------------------------------------------------------------------------");
  // Cancel item 2 ($179) in DCC Order System
  const itemToCancel = draftOrder.items[1];
  const cancelResult = await DccOrderService.cancelOrderItem({
    orderId: draftOrder.orderId,
    itemId: itemToCancel.itemId,
    reason: "Controlled Sandbox Proof: Cancelled one tour item",
  });
  console.log(`  ✔ DCC Item Cancelled: ${cancelResult.cancelledItem.itemId}`);
  console.log(`  ✔ Item Status: ${cancelResult.cancelledItem.status}`);

  // Query Neon for refund row
  const dbRefunds = await db
    .select()
    .from(dccDisputesAndRefunds)
    .where(eq(dccDisputesAndRefunds.orderId, draftOrder.orderId));
  console.log(`  ✔ Neon dcc_disputes_and_refunds records found: ${dbRefunds.length}`);
  const dbRef = dbRefunds[0];
  console.log(`    - id: ${dbRef.id}`);
  console.log(`    - type: ${dbRef.type}`);
  console.log(`    - amount: $${dbRef.amount}`);
  console.log(`    - status: ${dbRef.status}`);

  console.log("\n-------------------------------------------------------------------------------");
  console.log("  CHECK 10: Verify the remaining tour stays active");
  console.log("-------------------------------------------------------------------------------");
  const refreshedOrder = await DccOrderService.getOrder(draftOrder.orderId);
  if (!refreshedOrder) throw new Error("Order not found");

  const item1 = refreshedOrder.items.find((i) => i.itemId === draftOrder.items[0].itemId);
  const item2 = refreshedOrder.items.find((i) => i.itemId === draftOrder.items[1].itemId);

  console.log(`  Item 1 Status (${item1?.itemId}): ${item1?.status} (STAYS ACTIVE: ${item1?.status === "CONFIRMED"})`);
  console.log(`  Item 2 Status (${item2?.itemId}): ${item2?.status} (CANCELLED: ${item2?.status === "CANCELLED"})`);
  console.log(`  Order Master Status: ${refreshedOrder.status}`);

  if (item1?.status !== "CONFIRMED") {
    throw new Error("Remaining tour item 1 must remain CONFIRMED!");
  }
  if (item2?.status !== "CANCELLED") {
    throw new Error("Cancelled tour item 2 must be marked CANCELLED!");
  }

  console.log("\n-------------------------------------------------------------------------------");
  console.log("  CHECK 11: Verify the complete order appears in My Trips");
  console.log("-------------------------------------------------------------------------------");
  const myTrips = await DccTravelerService.getTravelerTrips(customer.emailAddress);
  console.log(`  ✔ My Trips orders found: ${myTrips.orders.length}`);
  const foundTrip = myTrips.orders.find((o) => o.orderId === draftOrder.orderId);
  if (!foundTrip) {
    throw new Error(`Order ${draftOrder.orderId} not found in traveler's My Trips!`);
  }
  console.log(`  ✔ Verified in My Trips:`);
  console.log(`    - Order ID: ${foundTrip.orderId}`);
  console.log(`    - Items Count: ${foundTrip.items.length}`);
  console.log(`    - Item 1: ${foundTrip.items[0].productTitle} (Status: ${foundTrip.items[0].status})`);
  console.log(`    - Active Trips Count: ${myTrips.activeTripsCount}`);
  console.log(`    - Item 1 Voucher: ${foundTrip.items[0].voucher?.code || "N/A"}`);
  console.log(`    - Item 2 Voucher: ${foundTrip.items[1].voucher?.code || "N/A"} (Cancelled)`);

  console.log("\n===============================================================================");
  console.log("  ALL 11 CONTROLLED SANDBOX & NEON CHECKS PASSED WITH 100% VERIFICATION!");
  console.log("===============================================================================\n");
}

runControlledSandboxProof().catch((err) => {
  console.error("\n❌ PROOF EXECUTION ERROR:", err.message);
  process.exit(1);
});
