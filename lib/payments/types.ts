export type DccPaymentStatus =
  | "unpaid"
  | "authorized"
  | "captured"
  | "refunded"
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
