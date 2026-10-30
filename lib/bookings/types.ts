import {
  OctoBookingResult,
  OctoConfirmBookingParams,
  OctoCreateHoldParams,
  OctoUnitItemRequest,
  OctoBookingPaymentModel,
  OctoContact,
  OctoPickupLocation,
  OctoCustomBookingField,
  OctoParticipantField,
  OctoVerifiedPaymentEvidence,
  OctoVerifiedRefundEvidence,
  DccBookingLifecycleStates,
} from "@/lib/octo/types";

export type DccBookingStatus =
  | "ON_HOLD"
  | "CONFIRMED"
  | "CANCELLED"
  | "EXPIRED"
  | "PENDING"
  | "REJECTED";

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
  contact?: OctoContact;
  pickupLocation?: OctoPickupLocation;
  customFields?: OctoCustomBookingField[];
  participants?: OctoParticipantField[][];
  notes?: string;
  idempotencyKey?: string;
  resellerId?: string;
  orderId?: string;
}

export interface DccBookingConfirmRequest {
  bookingId: string;
  contact: {
    fullName: string;
    firstName?: string;
    lastName?: string;
    emailAddress: string;
    phoneNumber?: string;
    country?: string;
    notes?: string;
  };
  pickupLocation?: OctoPickupLocation;
  customFields?: OctoCustomBookingField[];
  participants?: OctoParticipantField[][];
  notes?: string;
  payment?: {
    isPrepaid?: boolean;
    provider?: string;
    paymentId?: string;
    transactionId?: string;
    currency?: string;
    amount?: number;
    capturedAmount?: number;
    capturedAt?: string;
    verified?: boolean;
    status?: string;
  };
  verifiedPaymentEvidence?: OctoVerifiedPaymentEvidence;
  requireVerifiedPayment?: boolean;
  idempotencyKey?: string;
  resellerId?: string;
  orderId?: string;
}

export interface DccBookingCancelRequest {
  reason?: string;
  refundPolicyOutcome?: "no_refund" | "pending_refund" | "partial_refund" | "full_refund";
  verifiedRefundEvidence?: OctoVerifiedRefundEvidence;
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
  pickupLocation?: OctoPickupLocation;
  customFields?: OctoCustomBookingField[];
  participants?: OctoParticipantField[][];
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
  lifecycleStates?: DccBookingLifecycleStates;
}
