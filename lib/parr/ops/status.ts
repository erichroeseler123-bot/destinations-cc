import type { OpsOrderStatus, OpsPaymentStatus } from "@/lib/parr/ops/types";
import type { StoredOrder } from "@/lib/orders";

function normalize(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

const PAID_VALUES = new Set([
  "paid",
  "confirmed",
  "deposit_paid",
  "paid_in_full",
  "succeeded",
  "complete",
  "completed",
]);

const PARTIAL_VALUES = new Set(["partial", "partially_paid", "deposit_only"]);
const REFUNDED_VALUES = new Set(["refunded", "refund"]);
const DISPUTED_VALUES = new Set(["disputed", "chargeback"]);
const MANUAL_REVIEW_VALUES = new Set(["manual_review", "needs_review", "review"]);
const UNPAID_VALUES = new Set(["unpaid", "pending", "pending_payment", "none", "open"]);
const CANCELED_VALUES = new Set(["canceled", "cancelled", "voided"]);
const ARCHIVED_VALUES = new Set(["archived", "deleted", "removed"]);

export function deriveOpsPaymentStatus(order: StoredOrder): OpsPaymentStatus {
  const candidates = [
    normalize(order.payment?.status),
    normalize(order.payment?.rawStatus),
    normalize(order.status),
  ].filter(Boolean);

  const amountPaid = Number(order.pricing?.amountPaidCents || 0);
  const total = Number(order.pricing?.totalCents || 0);

  if (candidates.some((value) => REFUNDED_VALUES.has(value))) return "refunded";
  if (candidates.some((value) => DISPUTED_VALUES.has(value))) return "disputed";
  if (candidates.some((value) => MANUAL_REVIEW_VALUES.has(value))) return "manual_review";
  if (candidates.some((value) => PAID_VALUES.has(value))) return "paid";
  if (candidates.some((value) => PARTIAL_VALUES.has(value))) return "partial";
  if (candidates.some((value) => UNPAID_VALUES.has(value))) return "unpaid";
  if (total > 0 && amountPaid >= total) return "paid";
  if (amountPaid > 0 && total > amountPaid) return "partial";
  if (total > 0 && amountPaid === 0) return "unpaid";
  return "unknown";
}

export function deriveOpsOrderStatus(order: StoredOrder, paymentStatus: OpsPaymentStatus): OpsOrderStatus {
  const workflowStatus = normalize(order.ops?.workflowStatus);
  if (workflowStatus === "needs_review") return "needs_review";
  if (workflowStatus === "pending_payment") return "pending_payment";
  if (workflowStatus === "confirmed") return "confirmed";
  if (workflowStatus === "canceled") return "canceled";
  if (workflowStatus === "archived") return "archived";

  const candidates = [normalize(order.status), normalize(order.payment?.status), normalize(order.payment?.rawStatus)].filter(Boolean);
  if (candidates.some((value) => ARCHIVED_VALUES.has(value))) return "archived";
  if (candidates.some((value) => CANCELED_VALUES.has(value))) return "canceled";

  const missingScheduling = !String(order.date || "").trim();
  const missingCustomer = !String(order.customer?.name || order.customer?.email || "").trim();

  if (missingScheduling || missingCustomer) return "needs_review";
  if (paymentStatus === "paid") return "confirmed";
  if (paymentStatus === "manual_review" || paymentStatus === "disputed") return "needs_review";
  if (paymentStatus === "partial" || paymentStatus === "unpaid" || paymentStatus === "unknown") {
    return "pending_payment";
  }
  return "needs_review";
}
