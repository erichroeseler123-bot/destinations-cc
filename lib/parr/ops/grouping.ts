import type { OpsDayGroup, OpsDepartureGroup, OpsOrder, OpsOrderStatus, OpsPaymentStatus, OpsSummary } from "@/lib/parr/ops/types";

function formatDateLabel(value: string) {
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const ORDER_STATUS_PRIORITY: Record<OpsOrderStatus, number> = {
  needs_review: 0,
  pending_payment: 1,
  confirmed: 2,
  canceled: 3,
  archived: 4,
};

const PAYMENT_STATUS_PRIORITY: Record<OpsPaymentStatus, number> = {
  unpaid: 0,
  partial: 1,
  paid: 2,
  refunded: 3,
  manual_review: 4,
  disputed: 5,
  unknown: 6,
};

export function sortOrdersForOps(orders: OpsOrder[]) {
  return [...orders].sort((a, b) => {
    const dateCompare = String(a.serviceDate || "9999-12-31").localeCompare(String(b.serviceDate || "9999-12-31"));
    if (dateCompare !== 0) return dateCompare;
    const departureCompare = a.departureLabel.localeCompare(b.departureLabel);
    if (departureCompare !== 0) return departureCompare;
    const orderStatusCompare = ORDER_STATUS_PRIORITY[a.orderStatus] - ORDER_STATUS_PRIORITY[b.orderStatus];
    if (orderStatusCompare !== 0) return orderStatusCompare;
    const paymentCompare = PAYMENT_STATUS_PRIORITY[a.paymentStatus] - PAYMENT_STATUS_PRIORITY[b.paymentStatus];
    if (paymentCompare !== 0) return paymentCompare;
    return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
  });
}

function buildDepartureGroup(orders: OpsOrder[]): OpsDepartureGroup {
  const sorted = sortOrdersForOps(orders);
  return {
    key: sorted[0]?.departureKey || "unknown",
    label: sorted[0]?.departureLabel || "Unscheduled",
    pickupLabel: sorted[0]?.pickupLabel || null,
    serviceDate: sorted[0]?.serviceDate || null,
    orders: sorted,
    totalOrders: sorted.length,
    confirmedSeats: sorted.filter((order) => order.orderStatus === "confirmed").reduce((sum, order) => sum + order.seats, 0),
    pendingSeats: sorted.filter((order) => order.orderStatus === "pending_payment").reduce((sum, order) => sum + order.seats, 0),
    needsReviewCount: sorted.filter((order) => order.orderStatus === "needs_review").length,
  };
}

export function groupOrdersByDay(orders: OpsOrder[]): OpsDayGroup[] {
  const grouped = new Map<string, OpsOrder[]>();
  for (const order of sortOrdersForOps(orders)) {
    const key = order.serviceDate || "unscheduled";
    const existing = grouped.get(key);
    if (existing) existing.push(order);
    else grouped.set(key, [order]);
  }

  return Array.from(grouped.entries()).map(([date, dayOrders]) => {
    const departuresMap = new Map<string, OpsOrder[]>();
    for (const order of dayOrders) {
      const existing = departuresMap.get(order.departureKey);
      if (existing) existing.push(order);
      else departuresMap.set(order.departureKey, [order]);
    }

    const departures = Array.from(departuresMap.values()).map(buildDepartureGroup);
    return {
      date,
      label: date === "unscheduled" ? "Unscheduled / Needs Review" : formatDateLabel(date),
      orders: dayOrders,
      departures,
      totalOrders: dayOrders.length,
      confirmedSeats: dayOrders.filter((order) => order.orderStatus === "confirmed").reduce((sum, order) => sum + order.seats, 0),
      pendingSeats: dayOrders.filter((order) => order.orderStatus === "pending_payment").reduce((sum, order) => sum + order.seats, 0),
      needsReviewCount: dayOrders.filter((order) => order.orderStatus === "needs_review").length,
    };
  });
}

export function buildOpsSummary(orders: OpsOrder[]): OpsSummary {
  const dayGroups = groupOrdersByDay(orders);
  return {
    totalOrders: orders.length,
    totalSeats: orders.reduce((sum, order) => sum + order.seats, 0),
    unpaidOrders: orders.filter((order) => order.paymentStatus === "unpaid").length,
    pendingOrders: orders.filter((order) => order.orderStatus === "pending_payment").length,
    confirmedOrders: orders.filter((order) => order.orderStatus === "confirmed").length,
    needsReviewOrders: orders.filter((order) => order.orderStatus === "needs_review").length,
    departuresRunning: dayGroups.reduce((sum, day) => sum + day.departures.length, 0),
  };
}
