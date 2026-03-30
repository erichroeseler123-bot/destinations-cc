import { mkdir, readdir, readFile } from "fs/promises";
import path from "path";

const FLEET = {
  "parr-suburban": 2,
  "parr-van-10": 1,
  "parr-sprinter-14": 2,
  "parr-party-bus-24": 1,
} as const;

type FleetProductKey = keyof typeof FLEET;

type StoredOrder = {
  route?: string;
  product?: string;
  date?: string;
  payment?: {
    status?: string;
  };
  status?: string;
};

function getOrdersDir() {
  return path.join(process.cwd(), "data", "orders", "parr-private");
}

function normalizeDate(value: string) {
  return value.trim().slice(0, 10);
}

async function listStoredOrders(): Promise<StoredOrder[]> {
  const dir = getOrdersDir();
  await mkdir(dir, { recursive: true });
  const files = await readdir(dir).catch(() => []);
  const rows = await Promise.all(
    files
      .filter((file) => file.endsWith(".json"))
      .map(async (file) => {
        try {
          const raw = await readFile(path.join(dir, file), "utf8");
          return JSON.parse(raw) as StoredOrder;
        } catch {
          return null;
        }
      }),
  );
  return rows.filter((row): row is StoredOrder => Boolean(row));
}

export async function getParrPrivateAvailability(date: string) {
  const normalizedDate = normalizeDate(date);
  const orders = await listStoredOrders();
  const confirmed = orders.filter((order) => {
    if (order.route !== "parr-private") return false;
    if (!order.product || !order.date) return false;
    if (normalizeDate(order.date) !== normalizedDate) return false;
    const paymentStatus = String(order.payment?.status || "").trim().toLowerCase();
    const orderStatus = String(order.status || "").trim().toLowerCase();
    return ["succeeded", "deposit_paid", "paid_in_full"].includes(paymentStatus)
      || ["deposit_paid", "paid_in_full"].includes(orderStatus);
  });

  return (Object.keys(FLEET) as FleetProductKey[]).map((productKey) => {
    const total = FLEET[productKey];
    const booked = confirmed.filter((order) => order.product === productKey).length;
    return {
      productKey,
      total,
      booked,
      remaining: Math.max(0, total - booked),
      available: booked < total,
    };
  });
}
