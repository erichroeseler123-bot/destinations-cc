export type DccPaymentStatus =
  | "unpaid"
  | "authorized"
  | "captured"
  | "refunded"
  | "partially_refunded"
  | "chargeback"
  | "failed";

export interface DccPaymentInfo {
  provider?: "stripe" | "square" | "octo_reseller" | "supplier_hosted" | string;
  paymentId?: string;
  paymentIntentId?: string;
  amount?: number;
  currency?: string;
  status?: DccPaymentStatus;
}

export interface DccProcessPaymentParams {
  orderId: string;
  amount: number;
  currency: string;
  paymentInfo?: DccPaymentInfo;
  customer?: {
    fullName: string;
    emailAddress: string;
  };
}

export interface DccPaymentResult {
  success: boolean;
  paymentId: string;
  status: DccPaymentStatus;
  amount: number;
  currency: string;
  processedAt: string;
  provider: string;
}

export interface DccOrderPaymentRecord {
  id: string;
  orderId: string;
  paymentProvider: string;
  providerPaymentId?: string;
  amount: number;
  currency: string;
  status: DccPaymentStatus;
  rawMetadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DccRefundParams {
  orderId: string;
  orderItemId?: string;
  bookingId?: string;
  operatorSlug: string;
  amount: number;
  currency?: string;
  reason?: string;
}

export interface DccRefundRecord {
  id: string;
  orderId: string;
  orderItemId?: string;
  bookingId?: string;
  operatorSlug: string;
  type: "refund" | "chargeback" | "penalty" | "reversal";
  amount: number;
  currency: string;
  status: "initiated" | "processed" | "failed";
  reason?: string;
  settlementAdjusted: boolean;
  createdAt: string;
}

export interface DccChargebackParams {
  orderId: string;
  operatorSlug: string;
  amount: number;
  currency?: string;
  reason?: string;
  evidence?: Record<string, unknown>;
}
