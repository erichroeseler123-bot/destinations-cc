import { listStoredOrders } from "@/lib/orders";

const SEAT_CAPACITY = {
  "parr-shared-denver": 24,
  "parr-shared-golden": 24,
} as const;

type SharedProductKey = keyof typeof SEAT_CAPACITY;

function normalizeDate(value: string) {
  return value.trim().slice(0, 10);
}

function isConfirmedStatus(value: string | null | undefined) {
  const normalized = String(value || "").trim().toLowerCase();
  return ["succeeded", "deposit_paid", "paid_in_full"].includes(normalized);
}

export async function getParrSharedAvailability(date: string) {
  const normalizedDate = normalizeDate(date);
  const orders = await listStoredOrders("parr-shared");
  const confirmed = orders.filter((order) => {
    const routeMatches = order.route === "parr-shared";
    const hasProduct = typeof order.product === "string" && order.product === String(order.product).trim() && order.product.length > 0;
    const hasDate = typeof order.date === "string" && order.date === String(order.date).trim() && order.date.length > 0;
    const dateMatches = hasDate && normalizeDate(order.date || "") === normalizedDate;
    const paymentConfirmed = isConfirmedStatus(order.payment?.status) || isConfirmedStatus(order.status);
    return routeMatches && hasProduct && dateMatches && paymentConfirmed;
  });

  return (Object.keys(SEAT_CAPACITY) as SharedProductKey[]).map((productKey) => {
    const total = SEAT_CAPACITY[productKey];
    const booked = confirmed
      .filter((order) => order.product === productKey)
      .reduce((sum, order) => sum + Math.max(1, Number(order.qty || 1)), 0);

    return {
      productKey,
      total,
      booked,
      remaining: Math.max(0, total - booked),
      available: booked < total,
    };
  });
}
