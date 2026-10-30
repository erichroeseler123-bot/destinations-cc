import {
  OctoVerifiedPaymentEvidence,
  OctoVerifiedRefundEvidence,
} from "@/lib/octo/types";

export interface DccSettlementShares {
  dccSharePercent: number;
  dccShareAmount: number;
  operatorShareAmount: number;
  isUndecided: boolean;
}

export type DccSettlementStatus =
  | "pending"
  | "awaiting_payment"
  | "ready_for_payout"
  | "paid"
  | "cancelled_unpaid"
  | "cancelled_no_refund"
  | "cancelled_pending_refund"
  | "refunded"
  | "reversed"
  | "adjusted"
  | "disputed";

export type DccCommissionEligibilityStatus =
  | "ineligible_unconfirmed"
  | "ineligible_unpaid"
  | "pending_service_completion"
  | "eligible"
  | "ineligible_cancelled"
  | "adjusted_partial_refund"
  | "reversed_on_refund";

export type DccRefundStatus =
  | "none"
  | "not_applicable_unpaid"
  | "no_refund"
  | "pending_refund"
  | "partial_refund"
  | "full_refund";

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
  serviceCompletionStatus?:
    | "not_completed"
    | "scheduled"
    | "completed"
    | "no_show"
    | "cancelled_before_service";
  paymentStatus?:
    | "unpaid"
    | "authorized"
    | "captured"
    | "partially_refunded"
    | "refunded"
    | "failed";
  verifiedPaymentEvidence?: OctoVerifiedPaymentEvidence;
  settlementStatus?: DccSettlementStatus;
  commissionEligibilityStatus?: DccCommissionEligibilityStatus;
  cancellationStatus?: string;
  refundStatus?: DccRefundStatus;
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
  capturedAmount: number;
  refundedAmount: number;
  dccSharePercent: number;
  dccShareAmount: number;
  operatorShareAmount: number;
  reserveHoldAmount: number;
  paymentStatus:
    | "unpaid"
    | "authorized"
    | "captured"
    | "partially_refunded"
    | "refunded"
    | "failed";
  verifiedPaymentEvidence?: OctoVerifiedPaymentEvidence;
  verifiedRefundEvidence?: OctoVerifiedRefundEvidence;
  settlementStatus: DccSettlementStatus;
  commissionEligibilityStatus: DccCommissionEligibilityStatus;
  cancellationStatus:
    | "none"
    | "cancelled_unpaid"
    | "cancelled_no_refund"
    | "cancelled_pending_refund"
    | "cancelled_full_refund"
    | "cancelled_penalty";
  refundStatus: DccRefundStatus;
  serviceCompleted: boolean;
  serviceCompletionStatus:
    | "not_completed"
    | "scheduled"
    | "completed"
    | "no_show"
    | "cancelled_before_service";
  scheduledServiceDate?: string;
  completedAt?: string;
  reconciledAt?: string;
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
