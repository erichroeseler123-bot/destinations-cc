export interface DccSettlementShares {
  dccSharePercent: number;
  dccShareAmount: number;
  operatorShareAmount: number;
  isUndecided: boolean;
}

export interface CreateSettlementParams {
  bookingId: string;
  orderId?: string;
  dccReference: string;
  supplierReference?: string;
  operatorSlug: string;
  operatorName: string;
  currency: string;
  grossAmount: number;
  commissionPercent?: number | null;
  paymentStatus?: "unpaid" | "authorized" | "captured" | "refunded" | "failed";
  settlementStatus?: "pending" | "settled" | "disputed" | "refunded";
  metadata?: Record<string, unknown>;
}

export interface DccSettlementLedgerEntry {
  id: string;
  bookingId: string;
  orderId?: string;
  dccReference: string;
  supplierReference?: string;
  operatorSlug: string;
  operatorName: string;
  currency: string;
  grossAmount: number;
  dccSharePercent: number;
  dccShareAmount: number;
  operatorShareAmount: number;
  paymentStatus: "unpaid" | "authorized" | "captured" | "refunded" | "failed";
  settlementStatus: "pending" | "settled" | "disputed" | "refunded";
  cancellationStatus: "none" | "cancelled_full_refund" | "cancelled_penalty";
  createdAt: string;
}
