import type { StoredOrder } from "@/lib/orders";
import { deriveOpsOrderStatus, deriveOpsPaymentStatus } from "@/lib/parr/ops/status";
import type { OpsOrder } from "@/lib/parr/ops/types";

function normalizeDate(value: string | null | undefined) {
  const raw = String(value || "").trim();
  return raw ? raw.slice(0, 10) : null;
}

function titleCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function parseSessionKey(sessionKey: string | undefined | null) {
  const raw = String(sessionKey || "").trim();
  if (!raw) return { date: null as string | null, lane: null as string | null };
  const [datePart, lanePart] = raw.split(":");
  return {
    date: normalizeDate(datePart),
    lane: lanePart ? titleCase(lanePart) : null,
  };
}

function inferDepartureLabel(order: StoredOrder, sessionLane: string | null) {
  if (order.pickupTime && order.pickup) return `${order.pickupTime} • ${order.pickup}`;
  if (order.pickupTime) return order.pickupTime;
  if (order.pickup) return order.pickup;
  if (sessionLane) return `${sessionLane} departure`;
  if (order.productTitle) return order.productTitle;
  if (order.product) return titleCase(order.product);
  return "Unscheduled";
}

function normalizeNumber(value: number | undefined | null, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeParrOrder(order: StoredOrder): OpsOrder {
  const session = parseSessionKey(order.sessionKey);
  const serviceDate = normalizeDate(order.date) || session.date;
  const pickupLabel = order.pickup || session.lane || null;
  const partySize = Math.max(1, normalizeNumber(order.partySize ?? order.qty, 1));
  const seats = order.route === "parr-shared" ? Math.max(1, normalizeNumber(order.qty, 1)) : partySize;
  const paymentStatus = deriveOpsPaymentStatus(order);
  const orderStatus = deriveOpsOrderStatus(
    {
      ...order,
      date: serviceDate || undefined,
      customer: {
        ...order.customer,
        name: order.customer?.name || null,
      },
    },
    paymentStatus,
  );
  const departureLabel = inferDepartureLabel(order, session.lane);
  const departureKey = [
    serviceDate || "unscheduled",
    order.pickupTime || "",
    pickupLabel || "",
    order.product || order.route,
  ]
    .join("::")
    .toLowerCase();
  const amountPaidCents = normalizeNumber(order.pricing?.amountPaidCents);
  const totalCents = normalizeNumber(order.pricing?.totalCents);
  const remainingBalanceCents =
    normalizeNumber(order.pricing?.remainingBalanceCents, Math.max(0, totalCents - amountPaidCents));
  const customerName = order.customer?.name?.trim() || null;
  const customerEmail = order.customer?.email?.trim() || null;
  const customerPhone = order.customer?.phone?.trim() || null;
  const searchText = [
    order.orderId,
    order.handoffId,
    order.product,
    order.productTitle,
    order.pickup,
    order.sessionKey,
    order.ops?.note,
    customerName,
    customerEmail,
    customerPhone,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return {
    orderId: order.orderId,
    source: order,
    route: order.route,
    productKey: order.product || null,
    productLabel: order.productTitle || order.product || titleCase(order.route),
    bookingReference: order.payment?.paymentId || null,
    handoffId: order.handoffId || null,
    serviceDate,
    departureKey,
    departureLabel,
    pickupLabel,
    seats,
    partySize,
    customerName,
    customerEmail,
    customerPhone,
    createdAt: order.createdAt || null,
    paymentStatus,
    orderStatus,
    paymentDetail: order.payment?.provider || null,
    balanceDueAt: order.balanceDueAt || null,
    amountPaidCents,
    totalCents,
    remainingBalanceCents,
    sessionKey: order.sessionKey || null,
    note: order.ops?.note || null,
    noteUpdatedAt: order.ops?.noteUpdatedAt || null,
    noteUpdatedBy: order.ops?.noteUpdatedBy || null,
    archivedAt: order.ops?.archivedAt || null,
    archivedBy: order.ops?.archivedBy || null,
    archivedReason: order.ops?.archivedReason || null,
    canceledAt: order.ops?.canceledAt || null,
    canceledBy: order.ops?.canceledBy || null,
    canceledReason: order.ops?.canceledReason || null,
    auditLog: order.ops?.auditLog || [],
    searchText,
  };
}

export function normalizeParrOrders(orders: StoredOrder[]) {
  return orders
    .filter((order) => order.route.startsWith("parr-"))
    .map(normalizeParrOrder);
}
