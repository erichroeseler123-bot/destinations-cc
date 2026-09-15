/**
 * OCTO Core API & Capabilities Specification Types
 * Reference: Open Connectivity for Tour Operators (OCTO) Standard
 */

export type OctoRole =
  | "supplier"
  | "reseller"
  | "booking_system"
  | "channel_manager"
  | "technology_partner";

export type OctoCapabilityId =
  | "octo/core"
  | "octo/pricing"
  | "octo/content"
  | "octo/pickups"
  | "octo/webhooks"
  | "octo/adjustments";

export type OctoConsentStatus =
  | "not_requested"
  | "requested"
  | "consented"
  | "revoked";

export type OctoCredentialStatus =
  | "none"
  | "configured"
  | "verified"
  | "invalid"
  | "expired";

export type OctoBookingPaymentModel =
  | "supplier_hosted"
  | "supplier_api"
  | "reseller_merchant_of_record"
  | "split_payment";

export type OctoOutreachStatus =
  | "identified"
  | "in_outreach"
  | "contract_pending"
  | "technical_onboarding"
  | "active_testing"
  | "live_authorized"
  | "paused";

export type OctoUnitType =
  | "ADULT"
  | "CHILD"
  | "INFANT"
  | "SENIOR"
  | "STUDENT"
  | "MILITARY"
  | "OTHER";

export type OctoAvailabilityStatus = "AVAILABLE" | "FREESALE" | "SOLD_OUT";

export type OctoBookingStatus = "ON_HOLD" | "CONFIRMED" | "CANCELLED" | "EXPIRED";

export interface OctoPricingTier {
  original: number;
  retail: number;
  net?: number;
  currency: string;
  currencyPrecision: number;
  includedTaxesAndFees: boolean;
}

export interface OctoUnit {
  id: string;
  internalName: string;
  reference?: string;
  type: OctoUnitType;
  pricingFrom?: OctoPricingTier[];
  restrictions?: {
    minAge?: number;
    maxAge?: number;
    minQuantity?: number;
    maxQuantity?: number;
    accompaniedBy?: string[];
  };
}

export interface OctoOption {
  id: string;
  default: boolean;
  internalName: string;
  reference?: string;
  title: string;
  description?: string;
  units: OctoUnit[];
  requiredContactFields?: string[];
  cancellationCutoffSeconds?: number;
}

export interface OctoProduct {
  id: string;
  internalName: string;
  reference?: string;
  title: string;
  description?: string;
  country?: string;
  location?: string;
  destinationSlug?: string;
  placeCoordinates?: { lat: number; lng: number };
  timeZone?: string;
  defaultCurrency: string;
  options: OctoOption[];
  capabilities: OctoCapabilityId[];
  durationMinutes?: number;
  meetingPoint?: string;
  cancellationPolicy?: string;
}

export interface OctoAvailabilitySlot {
  id: string;
  localDateTimeStart: string;
  localDateTimeEnd?: string;
  allDay: boolean;
  available: boolean;
  status: OctoAvailabilityStatus;
  vacancies: number | null;
  capacity: number | null;
  maxUnits?: number | null;
  openingHours?: Array<{ from: string; to: string }>;
  unitPricing?: Array<{
    unitId: string;
    pricing: OctoPricingTier;
  }>;
  pickupAvailable?: boolean;
}

export interface OctoUnitItemRequest {
  unitId: string;
  quantity: number;
}

export interface OctoUnitItemResult {
  uuid: string;
  unitId: string;
  pricing?: OctoPricingTier;
  ticket?: {
    deliveryOptions?: Array<{
      deliveryFormat: "QR_CODE" | "CODE128" | "PDF";
      deliveryValue: string;
    }>;
  };
}

export interface OctoContact {
  fullName: string;
  firstName?: string;
  lastName?: string;
  emailAddress: string;
  phoneNumber?: string;
  country?: string;
  notes?: string;
}

export interface OctoCreateHoldParams {
  uuid?: string;
  productId: string;
  optionId: string;
  availabilityId: string;
  expirationMinutes: number; // Enforced per OCTO Core specification
  unitItems: OctoUnitItemRequest[];
  notes?: string;
}

export interface OctoConfirmBookingParams {
  contact: OctoContact;
  resellerReference?: string;
  payment?: {
    provider?: string;
    paymentId?: string;
    currency?: string;
    amount?: number;
    status?: string;
  };
}

export interface OctoBookingResult {
  id?: string;
  uuid: string;
  status: OctoBookingStatus;
  utcHoldExpires: string | null;
  productId: string;
  optionId: string;
  availabilityId: string;
  contact?: OctoContact;
  unitItems: OctoUnitItemResult[];
  totalPrice: number;
  currency: string;
  cancellationReason?: string;
  voucher?: {
    code: string;
    barcodeUrl?: string;
    redemptionInstructions?: string;
  };
  supplierReference?: string;
  resellerReference?: string;
  checkoutUrl?: string;
  confirmedAt?: string;
  cancelledAt?: string;
}

export interface OctoParticipant {
  id: string;
  name: string;
  role: OctoRole;
  website: string;
  contactEmail: string;
  contactName?: string;
  destinations: string[];
  endpoint?: string;
  certificationEvidence?: string;
  consentStatus: OctoConsentStatus;
  credentialStatus: OctoCredentialStatus;
  productsAvailableCount: number;
  bookingPaymentModel: OctoBookingPaymentModel;
  outreachStatus: OctoOutreachStatus;
  agreedCommissionPercent?: number | null; // e.g. 5.0 for 5%, null if undecided
  notes?: string;
}

export type OctoConnectionStatus =
  | "discovery_only"
  | "authorization_pending"
  | "authorized"
  | "sandbox_verified"
  | "production_verified"
  | "bookable"
  | "suspended";

export type OctoReservationPlatform =
  | "ventrata"
  | "bokun"
  | "rezdy"
  | "fareharbor"
  | "peek"
  | "tourcms"
  | "zaui"
  | "direct_octo";

export type OctoOnboardingStage =
  | "discovered"
  | "consented"
  | "credentials_configured"
  | "connection_verified"
  | "catalog_synced"
  | "availability_verified"
  | "booking_tested"
  | "bookable";

export interface OctoSupplierConnection {
  id: string;
  operatorSlug: string;
  operatorName: string;
  endpoint: string;
  capabilities: OctoCapabilityId[];
  isSandbox?: boolean;
  connectionStatus?: OctoConnectionStatus;
  reservationPlatform?: OctoReservationPlatform;
  octoBaseUrl?: string;
  apiCredentialRef?: string;
  authorizedProductIds?: string[];
  onboardingStage?: OctoOnboardingStage;
  operatorLegalName?: string;
  businessAddress?: string;
  signatoryName?: string;
  signatoryEmail?: string;
  consentAgreementVersion: string;
  consentTermsText?: string;
  consentedAt?: string;
  sandboxVerifiedAt?: string;
  productionVerifiedAt?: string;
  paymentModel: OctoBookingPaymentModel;
  settlementTerms?: string;
  commissionPercent?: number | null; // Negotiated per supplier agreement; null/undefined if pending
  cancellationRules?: Record<string, unknown>;
  healthStatus: "healthy" | "degraded" | "error" | "untested";
  lastHealthCheckAt?: string;
  lastHealthCheckStatus?: string;
  provenance?: string;
  lastVerificationTime?: string;
  catalogSyncStatus?: string;
  catalogSyncedAt?: string;
  availabilityTestStatus?: string;
  availabilityTestedAt?: string;
  bookingTestStatus?: string;
  bookingTestedAt?: string;
  lastSyncAt?: string;
  lastErrorMessage?: string;
}

export interface OctoCommissionLedgerEntry {
  id: string;
  bookingId: string;
  dccReference: string;
  supplierReference?: string;
  operatorSlug: string;
  operatorName: string;
  currency: string;
  grossAmount: number;
  dccSharePercent: number; // 5.0
  dccShareAmount: number; // 5% of gross
  operatorShareAmount: number; // 95% of gross
  paymentStatus: "unpaid" | "authorized" | "captured" | "refunded" | "failed";
  settlementStatus: "pending" | "settled" | "disputed" | "refunded";
  cancellationStatus: "none" | "cancelled_full_refund" | "cancelled_penalty";
  reconciledAt?: string;
  createdAt: string;
}
