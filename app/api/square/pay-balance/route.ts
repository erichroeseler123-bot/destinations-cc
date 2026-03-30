import { SquareClient, SquareEnvironment } from "square";
import { sendPaidInFullEmail } from "@/lib/balanceReminders";
import { getSquareAccessToken, getSquareEnvironment, getSquareLocationId } from "@/lib/squareConfig";
import { readStoredOrder, writeStoredOrder } from "@/lib/orders";

export const runtime = "nodejs";

type PayBalanceBody = {
  orderId?: string;
  sourceId?: string;
};

function getSquareEnvironmentValue(value?: string) {
  return value?.toLowerCase() === "production"
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox;
}

export async function POST(req: Request) {
  const body = (await req.json()) as PayBalanceBody;
  const orderId = (body.orderId || "").trim();
  const sourceId = (body.sourceId || "").trim();

  if (!orderId || !sourceId) {
    return Response.json({ ok: false, error: "Missing order ID or payment token." }, { status: 400 });
  }

  const appToken = getSquareAccessToken();
  const locationId = getSquareLocationId();
  if (!appToken || !locationId) {
    return Response.json({ ok: false, error: "Square is not configured." }, { status: 503 });
  }

  const order = await readStoredOrder(orderId);
  if (!order) {
    return Response.json({ ok: false, error: "Order not found." }, { status: 404 });
  }

  const remainingBalanceCents = Number(order.pricing?.remainingBalanceCents || 0);
  if (remainingBalanceCents <= 0 || order.status === "paid_in_full") {
    return Response.json({ ok: false, error: "This order has no remaining balance." }, { status: 400 });
  }

  const client = new SquareClient({
    token: appToken,
    environment: getSquareEnvironmentValue(getSquareEnvironment()),
  });

  const paymentResponse = await client.payments.create({
    sourceId,
    idempotencyKey: `${orderId}:balance`,
    locationId,
    amountMoney: {
      amount: BigInt(remainingBalanceCents),
      currency: "USD",
    },
    autocomplete: true,
    referenceId: `${order.route}:${order.orderId}:balance`,
    note: `Remaining balance for ${order.productTitle || order.orderId}`,
  });

  const payment = paymentResponse.payment;
  if (!payment?.id) {
    return Response.json({ ok: false, error: "Square payment failed." }, { status: 502 });
  }

  const totalCents = Number(order.pricing?.totalCents || 0);
  const amountPaidCents = totalCents;

  order.pricing = {
    ...order.pricing,
    amountPaidCents,
    remainingBalanceCents: 0,
  };
  order.status = "paid_in_full";
  order.payment = {
    ...order.payment,
    provider: "square",
    status: "paid_in_full",
    balancePaymentId: payment.id,
    balancePaidAt: new Date().toISOString(),
    rawBalanceStatus: payment.status || null,
  };

  await writeStoredOrder(order);
  const emailResult =
    order.customer?.email && order.status === "paid_in_full"
      ? await sendPaidInFullEmail(order)
      : { sent: false, reason: "No email on order." };

  return Response.json({
    ok: true,
    orderId: order.orderId,
    paymentStatus: order.status,
    totalCents,
    amountPaidCents,
    remainingBalanceCents: 0,
    balanceDueAt: order.balanceDueAt || null,
    paymentId: payment.id,
    emailSent: emailResult.sent,
  });
}
