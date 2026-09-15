import { DccUnitItem, DccBookingRecord } from "@/lib/bookings/types";
import { DccPaymentInfo } from "@/lib/payments/types";

export type DccOrderStatus =
  | "PENDING_HOLD"
  | "ON_HOLD"
  | "CONFIRMED"
  | "CANCELLED"
  | "EXPIRED"
  | "FAILED";

export interface DccOrderItem {
  itemId: string;
  productId: string;
  optionId: string;
  availabilityId: string;
  supplierConnectionId: string;
  unitItems: DccUnitItem[];
  price: number;
  currency: string;
  bookingId?: string;
  bookingUuid?: string;
}

export interface DccMasterOrder {
  orderId: string; // e.g. dcc:ord:...
  status: DccOrderStatus;
  resellerId?: string;
  customer?: {
    fullName: string;
    emailAddress: string;
    phoneNumber?: string;
    country?: string;
    notes?: string;
  };
  currency: string;
  totalPrice: number;
  items: DccOrderItem[];
  bookingIds: string[];
  paymentId?: string;
  utcHoldExpires?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  resellerId?: string;
  currency?: string;
  items: Array<{
    productId: string;
    optionId: string;
    availabilityId: string;
    unitItems: DccUnitItem[];
    notes?: string;
  }>;
  idempotencyKey?: string;
  notes?: string;
}

export interface ConfirmOrderRequest {
  orderId: string;
  contact: {
    fullName: string;
    emailAddress: string;
    phoneNumber?: string;
    country?: string;
    notes?: string;
  };
  payment?: DccPaymentInfo;
  idempotencyKey?: string;
  resellerId?: string;
}
