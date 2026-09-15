import { DccUnitItem, DccBookingRecord } from "@/lib/bookings/types";
import { DccPaymentInfo } from "@/lib/payments/types";

export type DccOrderStatus =
  | "PENDING_HOLD"
  | "ON_HOLD"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED"
  | "FAILED";

export type DccOrderItemStatus =
  | "ON_HOLD"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

export interface DccOrderItem {
  itemId: string; // e.g. dcc:item:...
  productId: string;
  productTitle?: string;
  optionId: string;
  optionTitle?: string;
  availabilityId: string;
  supplierConnectionId: string;
  operatorSlug?: string;
  operatorName?: string;
  unitItems: DccUnitItem[];
  price: number;
  currency: string;
  status: DccOrderItemStatus;
  serviceCompleted?: boolean;
  eventDate?: string;
  eventTime?: string;
  meetingPoint?: string;
  bookingId?: string;
  bookingUuid?: string;
  voucher?: {
    code: string;
    barcode?: string;
    url?: string;
  };
  notes?: string;
}

export interface DccMasterOrder {
  orderId: string; // e.g. dcc:ord:...
  travelerId?: string;
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
  utcHoldExpires?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  travelerId?: string;
  resellerId?: string;
  currency?: string;
  customer?: {
    fullName: string;
    emailAddress: string;
    phoneNumber?: string;
    country?: string;
    notes?: string;
  };
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
  travelerId?: string;
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

export interface CancelOrderItemRequest {
  orderId: string;
  itemId: string;
  reason?: string;
  resellerId?: string;
}

export interface DccSquareCheckoutRequest {
  orderId?: string;
  items?: Array<{
    productId: string;
    optionId: string;
    availabilityId: string;
    unitItems: DccUnitItem[];
    notes?: string;
  }>;
  travelerId?: string;
  sourceId?: string;
  contact: {
    fullName: string;
    emailAddress: string;
    phoneNumber?: string;
    country?: string;
    notes?: string;
  };
  idempotencyKey?: string;
  resellerId?: string;
  options?: {
    simulateFailure?: boolean;
    simulateHoldFailure?: boolean;
    simulateConfirmationFailure?: boolean;
  };
}

export interface DccSquareCheckoutResult {
  order: DccMasterOrder;
  paymentId: string;
  paymentRecord: any;
  status: "CONFIRMED" | "FAILED" | "CANCELLED";
  alreadyCompleted?: boolean;
}
