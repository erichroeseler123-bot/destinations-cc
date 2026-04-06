import { mkdir, readFile, readdir, writeFile } from "fs/promises";
import path from "path";

export type StoredOrder = {
  orderId: string;
  createdAt?: string;
  route: string;
  handoffId?: string | null;
  sessionKey?: string;
  product?: string;
  productTitle?: string;
  qty?: number;
  partySize?: number;
  date?: string;
  pickup?: string | null;
  dropoff?: string | null;
  pickupTime?: string | null;
  specialRequests?: string | null;
  tripContext?: {
    flightNumber?: string | null;
    dispensaryPreference?: string | null;
  };
  customer?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  pricing?: {
    unitPriceCents?: number;
    totalCents?: number;
    amountPaidCents?: number;
    remainingBalanceCents?: number;
    currency?: string;
  };
  status?: string;
  balanceDueAt?: string | null;
  payment?: {
    provider?: "stripe" | "square" | string;
    paymentIntentId?: string | null;
    paymentId?: string | null;
    status?: string | null;
    rawStatus?: string | null;
    sourceType?: string | null;
    balancePaymentIntentId?: string | null;
    balancePaymentId?: string | null;
    balancePaidAt?: string | null;
    rawBalanceStatus?: string | null;
  };
  reminders?: {
    balanceLastSentAt?: string | null;
    balanceSendCount?: number;
  };
  ops?: {
    workflowStatus?: "needs_review" | "pending_payment" | "confirmed" | "canceled" | "archived" | null;
    note?: string | null;
    noteUpdatedAt?: string | null;
    noteUpdatedBy?: string | null;
    archivedAt?: string | null;
    archivedBy?: string | null;
    archivedReason?: string | null;
    canceledAt?: string | null;
    canceledBy?: string | null;
    canceledReason?: string | null;
    auditLog?: Array<{
      id: string;
      at: string;
      actor: string;
      action: string;
      detail?: string | null;
    }>;
  };
};

function routeFromOrderId(orderId: string) {
  const index = orderId.indexOf("_");
  return index === -1 ? null : orderId.slice(0, index);
}

function orderPath(orderId: string) {
  const route = routeFromOrderId(orderId);
  if (!route) return null;
  return path.join(process.cwd(), "data", "orders", route, `${orderId}.json`);
}

export async function readStoredOrder(orderId: string) {
  const filePath = orderPath(orderId);
  if (!filePath) return null;

  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as StoredOrder;
  } catch {
    return null;
  }
}

export async function writeStoredOrder(order: StoredOrder) {
  const filePath = orderPath(order.orderId);
  if (!filePath) {
    throw new Error("Invalid order ID.");
  }
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(order, null, 2), "utf8");
}

export async function listStoredOrders(route?: string) {
  const root = path.join(process.cwd(), "data", "orders");
  const routeDirs = route ? [path.join(root, route)] : [];

  if (!route) {
    try {
      const entries = await readdir(root, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          routeDirs.push(path.join(root, entry.name));
        }
      }
    } catch {
      return [] as StoredOrder[];
    }
  }

  const orders: StoredOrder[] = [];

  for (const dir of routeDirs) {
    let files: string[] = [];
    try {
      files = await readdir(dir);
    } catch {
      continue;
    }

    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      try {
        const raw = await readFile(path.join(dir, file), "utf8");
        orders.push(JSON.parse(raw) as StoredOrder);
      } catch {
        continue;
      }
    }
  }

  return orders.sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });
}
