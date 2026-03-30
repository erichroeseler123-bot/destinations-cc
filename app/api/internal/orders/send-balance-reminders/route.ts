import { listStoredOrders, writeStoredOrder } from "@/lib/orders";
import { sendBalanceReminderEmail, shouldSendBalanceReminder } from "@/lib/balanceReminders";

export const runtime = "nodejs";

type ReminderRequest = {
  route?: string;
  dryRun?: boolean;
  withinHours?: number;
  minHoursBetween?: number;
};

function isAuthorized(request: Request) {
  const secret = process.env.INTERNAL_API_SECRET?.trim();
  if (!secret) return true;
  return request.headers.get("x-internal-secret") === secret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as ReminderRequest;
  const route = body.route?.trim();
  const dryRun = body.dryRun !== false;
  const withinHours = Number.isFinite(body.withinHours) ? Number(body.withinHours) : 48;
  const minHoursBetween = Number.isFinite(body.minHoursBetween) ? Number(body.minHoursBetween) : 18;

  const orders = await listStoredOrders(route);
  const candidates = orders.filter((order) =>
    shouldSendBalanceReminder(order, { withinHours, minHoursBetween }),
  );

  if (dryRun) {
    return Response.json({
      ok: true,
      dryRun: true,
      route: route || null,
      candidateCount: candidates.length,
      candidates: candidates.map((order) => ({
        orderId: order.orderId,
        route: order.route,
        date: order.date || null,
        status: order.status || null,
        balanceDueAt: order.balanceDueAt || null,
        remainingBalanceCents: order.pricing?.remainingBalanceCents || 0,
        customerEmail: order.customer?.email || null,
      })),
    });
  }

  const sent: Array<{ orderId: string }> = [];
  const failed: Array<{ orderId: string; reason: string }> = [];

  for (const order of candidates) {
    const result = await sendBalanceReminderEmail(order);
    if (!result.sent) {
      failed.push({ orderId: order.orderId, reason: result.reason });
      continue;
    }

    order.reminders = {
      balanceLastSentAt: new Date().toISOString(),
      balanceSendCount: (order.reminders?.balanceSendCount || 0) + 1,
    };
    await writeStoredOrder(order);
    sent.push({ orderId: order.orderId });
  }

  return Response.json({
    ok: true,
    dryRun: false,
    route: route || null,
    candidateCount: candidates.length,
    sentCount: sent.length,
    failedCount: failed.length,
    sent,
    failed,
  });
}
