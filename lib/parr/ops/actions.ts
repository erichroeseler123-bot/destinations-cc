import { randomUUID } from "crypto";
import { readStoredOrder, writeStoredOrder, type StoredOrder } from "@/lib/orders";
import { deriveOpsPaymentStatus } from "@/lib/parr/ops/status";

type OrderMutationAction = "cancel" | "archive";
type PaymentMutationAction = "mark_unpaid" | "mark_partial" | "mark_paid" | "mark_manual_review";
type ReassignInput = {
  date: string;
  product: string;
  pickup: string;
  pickupTime?: string | null;
  sessionKey?: string | null;
  reason: string;
};

function appendAudit(order: StoredOrder, actor: string, action: string, detail?: string | null) {
  const entry = {
    id: randomUUID(),
    at: new Date().toISOString(),
    actor,
    action,
    detail: detail || null,
  };

  order.ops = {
    ...order.ops,
    auditLog: [entry, ...(order.ops?.auditLog || [])].slice(0, 50),
  };
}

async function loadOrder(orderId: string) {
  const order = await readStoredOrder(orderId);
  if (!order) {
    throw new Error("Order not found.");
  }
  return order;
}

export async function updateParrOrderNote(orderId: string, note: string, actor: string) {
  const order = await loadOrder(orderId);
  order.ops = {
    ...order.ops,
    note: note || null,
    noteUpdatedAt: new Date().toISOString(),
    noteUpdatedBy: actor,
  };
  appendAudit(order, actor, "note_updated", note || "cleared");
  await writeStoredOrder(order);
  return order;
}

export async function updateParrOrderStatus(
  orderId: string,
  action: OrderMutationAction,
  actor: string,
  reason?: string,
) {
  const order = await loadOrder(orderId);
  const now = new Date().toISOString();

  if (action === "archive") {
    if (!reason?.trim()) {
      throw new Error("Archive reason is required.");
    }
    order.status = "archived";
    order.ops = {
      ...order.ops,
      workflowStatus: "archived",
      archivedAt: now,
      archivedBy: actor,
      archivedReason: reason.trim(),
    };
    appendAudit(order, actor, "archived", reason.trim());
  } else if (action === "cancel") {
    order.status = "canceled";
    order.ops = {
      ...order.ops,
      workflowStatus: "canceled",
      canceledAt: now,
      canceledBy: actor,
      canceledReason: reason?.trim() || null,
    };
    appendAudit(order, actor, "canceled", reason?.trim() || null);
  }

  await writeStoredOrder(order);
  return order;
}

export async function updateParrOrderPaymentState(
  orderId: string,
  action: PaymentMutationAction,
  actor: string,
  reason: string,
  amountPaidCentsInput?: number | null,
) {
  const order = await loadOrder(orderId);
  const now = new Date().toISOString();
  const totalCents = Number(order.pricing?.totalCents || 0);
  const previousState = deriveOpsPaymentStatus(order);

  if (!reason.trim()) {
    throw new Error("Payment change reason is required.");
  }

  let nextPaid = Number(order.pricing?.amountPaidCents || 0);
  let nextRemaining = Number(order.pricing?.remainingBalanceCents || Math.max(0, totalCents - nextPaid));
  let nextPaymentStatus = order.payment?.status || order.status || "unpaid";
  let nextWorkflowStatus = order.ops?.workflowStatus || null;

  if (action === "mark_unpaid") {
    nextPaid = 0;
    nextRemaining = totalCents;
    nextPaymentStatus = "unpaid";
    if (nextWorkflowStatus !== "canceled" && nextWorkflowStatus !== "archived") {
      nextWorkflowStatus = totalCents > 0 ? "pending_payment" : nextWorkflowStatus;
    }
  } else if (action === "mark_partial") {
    const requested = Math.floor(Number(amountPaidCentsInput || 0));
    if (!Number.isFinite(requested) || requested <= 0 || requested >= totalCents) {
      throw new Error("Partial payment must be greater than $0 and less than the order total.");
    }
    nextPaid = requested;
    nextRemaining = Math.max(0, totalCents - requested);
    nextPaymentStatus = "partial";
    if (nextWorkflowStatus !== "canceled" && nextWorkflowStatus !== "archived") {
      nextWorkflowStatus = "pending_payment";
    }
  } else if (action === "mark_paid") {
    nextPaid = totalCents;
    nextRemaining = 0;
    nextPaymentStatus = "paid_in_full";
    if (nextWorkflowStatus !== "canceled" && nextWorkflowStatus !== "archived") {
      nextWorkflowStatus = "confirmed";
    }
  } else if (action === "mark_manual_review") {
    nextPaymentStatus = "manual_review";
    if (nextWorkflowStatus !== "canceled" && nextWorkflowStatus !== "archived") {
      nextWorkflowStatus = "needs_review";
    }
  }

  order.pricing = {
    ...order.pricing,
    amountPaidCents: nextPaid,
    remainingBalanceCents: nextRemaining,
  };
  order.payment = {
    ...order.payment,
    status: nextPaymentStatus,
    rawStatus: nextPaymentStatus,
    balancePaidAt: action === "mark_paid" ? now : order.payment?.balancePaidAt || null,
  };
  if (nextWorkflowStatus) {
    order.ops = {
      ...order.ops,
      workflowStatus: nextWorkflowStatus,
    };
    order.status = nextWorkflowStatus;
  }

  appendAudit(
    order,
    actor,
    "payment_state_changed",
    `${previousState} -> ${deriveOpsPaymentStatus(order)} | paid ${nextPaid}/${totalCents} | ${reason.trim()}`,
  );

  await writeStoredOrder(order);
  return order;
}

export async function reassignParrOrder(orderId: string, input: ReassignInput, actor: string) {
  const order = await loadOrder(orderId);
  const nextDate = String(input.date || "").trim();
  const nextProduct = String(input.product || "").trim();
  const nextPickup = String(input.pickup || "").trim();
  const nextPickupTime = String(input.pickupTime || "").trim() || null;
  const nextSessionKey = String(input.sessionKey || "").trim() || null;
  const reason = String(input.reason || "").trim();

  if (!nextDate) {
    throw new Error("Destination date is required.");
  }
  if (!nextProduct) {
    throw new Error("Destination product is required.");
  }
  if (!nextPickup) {
    throw new Error("Destination pickup is required.");
  }
  if (!reason) {
    throw new Error("Move reason is required.");
  }

  const fromSnapshot = {
    date: order.date || null,
    product: order.product || null,
    pickup: order.pickup || null,
    pickupTime: order.pickupTime || null,
    sessionKey: order.sessionKey || null,
  };

  order.date = nextDate;
  order.product = nextProduct;
  order.pickup = nextPickup;
  order.pickupTime = nextPickupTime;
  order.sessionKey = nextSessionKey || undefined;

  appendAudit(
    order,
    actor,
    "departure_reassigned",
    [
      `from ${fromSnapshot.date || "none"} / ${fromSnapshot.product || "none"} / ${fromSnapshot.pickup || "none"} / ${fromSnapshot.pickupTime || "none"} / ${fromSnapshot.sessionKey || "none"}`,
      `to ${nextDate} / ${nextProduct} / ${nextPickup} / ${nextPickupTime || "none"} / ${nextSessionKey || "none"}`,
      reason,
    ].join(" | "),
  );

  await writeStoredOrder(order);
  return order;
}
