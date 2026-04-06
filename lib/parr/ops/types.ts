import type { StoredOrder } from "@/lib/orders";

export type OpsOrderStatus = "needs_review" | "pending_payment" | "confirmed" | "canceled" | "archived";

export type OpsPaymentStatus = "unpaid" | "partial" | "paid" | "refunded" | "disputed" | "manual_review" | "unknown";

export type OpsView = "calendar" | "run-sheet" | "all-orders";

export type OpsOrder = {
  orderId: string;
  source: StoredOrder;
  route: string;
  productKey: string | null;
  productLabel: string;
  bookingReference: string | null;
  handoffId: string | null;
  serviceDate: string | null;
  departureKey: string;
  departureLabel: string;
  pickupLabel: string | null;
  seats: number;
  partySize: number;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  createdAt: string | null;
  paymentStatus: OpsPaymentStatus;
  orderStatus: OpsOrderStatus;
  paymentDetail: string | null;
  balanceDueAt: string | null;
  amountPaidCents: number;
  totalCents: number;
  remainingBalanceCents: number;
  sessionKey: string | null;
  note: string | null;
  noteUpdatedAt: string | null;
  noteUpdatedBy: string | null;
  archivedAt: string | null;
  archivedBy: string | null;
  archivedReason: string | null;
  canceledAt: string | null;
  canceledBy: string | null;
  canceledReason: string | null;
  auditLog: Array<{
    id: string;
    at: string;
    actor: string;
    action: string;
    detail?: string | null;
  }>;
  searchText: string;
};

export type OpsDepartureGroup = {
  key: string;
  label: string;
  pickupLabel: string | null;
  serviceDate: string | null;
  orders: OpsOrder[];
  totalOrders: number;
  confirmedSeats: number;
  pendingSeats: number;
  needsReviewCount: number;
};

export type OpsDayGroup = {
  date: string;
  label: string;
  orders: OpsOrder[];
  departures: OpsDepartureGroup[];
  totalOrders: number;
  confirmedSeats: number;
  pendingSeats: number;
  needsReviewCount: number;
};

export type OpsSummary = {
  totalOrders: number;
  totalSeats: number;
  unpaidOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  needsReviewOrders: number;
  departuresRunning: number;
};
