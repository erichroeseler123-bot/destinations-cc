export interface DccSettlementShares {
  dccSharePercent: number;
  dccShareAmount: number;
  operatorShareAmount: number;
  isUndecided: boolean;
}

export type DccSettlementStatus =
  | "pending"
  | "ready_for_payout"
  | "paid"
  | "reversed"
  | "adjusted"
  | "disputed";

export interface CreateSettlementParams {
  bookingId: string;
  orderId?: string;
  orderItemId?: string;
  dccReference: string;
  supplierReference?: string;
  operatorSlug: string;
  operatorName: string;
  currency: string;
  grossAmount: number;
  commissionPercent?: number | null;
  reservePercent?: number; // optional reserve hold e.g. 5% or 10%
  scheduledServiceDate?: string;
  paymentStatus?: "unpaid" | "authorized" | "captured" | "refunded" | "failed";
  settlementStatus?: DccSettlementStatus;
  metadata?: Record<string, unknown>;
}

export interface DccSettlementLedgerEntry {
  id: string;
  bookingId: string;
  orderId?: string;
  orderItemId?: string;
  dccReference: string;
  supplierReference?: string;
  operatorSlug: string;
  operatorName: string;
  currency: string;
  grossAmount: number;
  dccSharePercent: number;
  dccShareAmount: number;
  operatorShareAmount: number;
  reserveHoldAmount: number;
  paymentStatus: "unpaid" | "authorized" | "captured" | "refunded" | "failed";
  settlementStatus: DccSettlementStatus;
  cancellationStatus: "none" | "cancelled_full_refund" | "cancelled_penalty";
  serviceCompleted: boolean;
  scheduledServiceDate?: string;
  completedAt?: string;
  createdAt: string;
}

export interface DccOperatorBalanceSummary {
  operatorSlug: string;
  currency: string;
  totalGross: number;
  totalDccCommission: number;
  totalPendingPayable: number;
  totalReadyForPayout: number;
  totalPaid: number;
  totalReserveHeld: number;
  activeItemCount: number;
}
