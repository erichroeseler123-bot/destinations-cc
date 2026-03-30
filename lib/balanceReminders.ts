import { StoredOrder } from "@/lib/orders";

const DCC_BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  "https://www.destinationcommandcenter.com";

function getFromEmail(route: string) {
  return (
    (route === "parr-private" ? process.env.PARR_PRIVATE_FROM_EMAIL?.trim() : undefined) ||
    process.env.ARGO_FROM_EMAIL?.trim() ||
    null
  );
}

function getSubject(order: StoredOrder) {
  return order.route === "parr-private"
    ? `Party at Red Rocks balance due (${order.orderId})`
    : `Remaining balance due (${order.orderId})`;
}

function getHeadline(order: StoredOrder) {
  return order.route === "parr-private"
    ? "Party at Red Rocks remaining balance"
    : "Remaining balance due";
}

export function getPayBalanceUrl(orderId: string) {
  return `${DCC_BASE_URL}/pay-balance/${encodeURIComponent(orderId)}`;
}

export function shouldSendBalanceReminder(
  order: StoredOrder,
  {
    now = Date.now(),
    withinHours = 48,
    minHoursBetween = 18,
  }: {
    now?: number;
    withinHours?: number;
    minHoursBetween?: number;
  } = {},
) {
  if (order.status !== "deposit_paid") return false;
  if ((order.pricing?.remainingBalanceCents || 0) <= 0) return false;
  if (!order.customer?.email) return false;
  if (!order.balanceDueAt) return false;

  const dueAt = new Date(order.balanceDueAt).getTime();
  if (Number.isNaN(dueAt)) return false;

  const lastSentAt = order.reminders?.balanceLastSentAt
    ? new Date(order.reminders.balanceLastSentAt).getTime()
    : null;
  if (lastSentAt && now - lastSentAt < minHoursBetween * 60 * 60 * 1000) {
    return false;
  }

  return dueAt <= now + withinHours * 60 * 60 * 1000;
}

export async function sendBalanceReminderEmail(order: StoredOrder) {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = getFromEmail(order.route);
  const to = order.customer?.email?.trim();

  if (!resendKey || !fromEmail || !to) {
    return { sent: false, reason: "Email not configured." as const };
  }

  const payUrl = getPayBalanceUrl(order.orderId);
  const total = ((order.pricing?.totalCents || 0) / 100).toFixed(2);
  const paid = ((order.pricing?.amountPaidCents || 0) / 100).toFixed(2);
  const remaining = ((order.pricing?.remainingBalanceCents || 0) / 100).toFixed(2);

  const html = `
    <h2>${getHeadline(order)}</h2>
    <p><strong>Order ID:</strong> ${order.orderId}</p>
    <p><strong>Service:</strong> ${order.productTitle || "Booking"}</p>
    <p><strong>Date:</strong> ${order.date || "Unknown"}</p>
    <p><strong>Total:</strong> $${total}</p>
    <p><strong>Already paid:</strong> $${paid}</p>
    <p><strong>Remaining balance:</strong> $${remaining}</p>
    ${order.balanceDueAt ? `<p><strong>Due by:</strong> ${order.balanceDueAt}</p>` : ""}
    <p><a href="${payUrl}">Pay remaining balance</a></p>
  `;

  const upstream = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject: getSubject(order),
      html,
    }),
  });

  if (!upstream.ok) {
    const data = await upstream.json().catch(() => null);
    return { sent: false, reason: data?.message || "Resend rejected request." as const };
  }

  return { sent: true as const };
}

export async function sendPaidInFullEmail(order: StoredOrder) {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = getFromEmail(order.route);
  const to = order.customer?.email?.trim();

  if (!resendKey || !fromEmail || !to) {
    return { sent: false, reason: "Email not configured." as const };
  }

  const total = ((order.pricing?.totalCents || 0) / 100).toFixed(2);
  const html = `
    <h2>${order.route === "parr-private" ? "Party at Red Rocks booking paid in full" : "Booking paid in full"}</h2>
    <p><strong>Order ID:</strong> ${order.orderId}</p>
    <p><strong>Service:</strong> ${order.productTitle || "Booking"}</p>
    <p><strong>Date:</strong> ${order.date || "Unknown"}</p>
    <p><strong>Total paid:</strong> $${total}</p>
    <p>Your booking is now fully paid. If you need to adjust pickup details, reply to this email or text support with your booking ID.</p>
  `;

  const upstream = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject:
        order.route === "parr-private"
          ? `Party at Red Rocks booking paid in full (${order.orderId})`
          : `Booking paid in full (${order.orderId})`,
      html,
    }),
  });

  if (!upstream.ok) {
    const data = await upstream.json().catch(() => null);
    return { sent: false, reason: data?.message || "Resend rejected request." as const };
  }

  return { sent: true as const };
}
