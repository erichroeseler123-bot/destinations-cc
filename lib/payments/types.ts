import { PaymentEvidenceProvenanceSource } from "@/lib/octo/types";

export type DccPaymentStatus =
  | "unpaid"
  | "authorized"
  | "captured"
  | "refunded"
  | "partially_refunded"
  | "chargeback"
  | "cancelled"
  | "failed";

export interface DccPaymentInfo {
  provider?: "square" | "octo_reseller" | "supplier_hosted" | string;
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
  sourceId?: string;
  idempotencyKey?: string;
  customer?: {
    fullName: string;
    emailAddress: string;
  };
  options?: {
    squareClient?: any;
    simulateCapture?: boolean;
    simulateFailure?: boolean;
    allowTestSimulation?: boolean;
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
  provenanceSource?: PaymentEvidenceProvenanceSource;
  webhookEventId?: string;
}

export interface DccOrderPaymentRecord {
  id: string;
  orderId: string;
  paymentProvider: string;
  providerPaymentId?: string;
  amount: number;
  currency: string;
  status: DccPaymentStatus;
  provenanceSource?: PaymentEvidenceProvenanceSource;
  webhookEventId?: string;
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
  options?: {
    squareClient?: any;
    allowTestSimulation?: boolean;
  };
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
  provenanceSource?: PaymentEvidenceProvenanceSource;
  webhookEventId?: string;
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

