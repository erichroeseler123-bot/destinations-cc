import {
  OctoBookingResult,
  OctoConfirmBookingParams,
  OctoCreateHoldParams,
  OctoUnitItemRequest,
  OctoBookingPaymentModel,
} from "@/lib/octo/types";

export type DccBookingStatus = "ON_HOLD" | "CONFIRMED" | "CANCELLED" | "EXPIRED";

export interface DccUnitItem {
  unitId: string;
  quantity: number;
}

export interface DccBookingHoldRequest {
  supplierConnectionId: string;
  productId: string;
  optionId: string;
  availabilityId: string;
  expirationMinutes?: number;
  unitItems: DccUnitItem[];
  notes?: string;
  idempotencyKey?: string;
  resellerId?: string;
  orderId?: string;
}

export interface DccBookingConfirmRequest {
  bookingId: string;
  contact: {
    fullName: string;
    emailAddress: string;
    phoneNumber?: string;
    country?: string;
    notes?: string;
  };
  payment?: {
    isPrepaid?: boolean;
    provider?: string;
    paymentId?: string;
    currency?: string;
    amount?: number;
    status?: string;
  };
  idempotencyKey?: string;
  resellerId?: string;
  orderId?: string;
}

export interface DccBookingRecord {
  id: string; // dcc:bk:...
  bookingUuid: string;
  orderId?: string;
  supplierConnectionId: string;
  resellerId?: string;
  productId: string;
  optionId: string;
  availabilityId: string;
  status: DccBookingStatus;
  expirationMinutes: number;
  utcHoldExpires?: string;
  totalPrice: number;
  currency: string;
  unitItems: DccUnitItem[];
  contact?: Record<string, unknown>;
  supplierReference?: string;
  resellerReference?: string;
  checkoutUrl?: string;
  voucher?: {
    type: string;
    code: string;
    deliveryOptions?: Array<{
      deliveryFormat: "QR_CODE" | "CODE128" | "PDF";
      deliveryValue: string;
    }>;
  };
  cancellationReason?: string;
  confirmedAt?: string;
  cancelledAt?: string;
  createdAt: string;
}
