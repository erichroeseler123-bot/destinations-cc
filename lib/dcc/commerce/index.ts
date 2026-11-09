/**
 * DCC Commercial Attribution, Outbound Handoffs, and Outcome Reporting Module
 *
 * Strictly separated from DCC Decision Assurance (`lib/dcc/machine/v03/evaluatorAndReplay.ts`).
 * - The evaluator never imports or consumes this module, commission rates, affiliate account
 *   preferences, or commercial routing priorities.
 * - Commercial permissions (`dcc:commerce:handoff`, `dcc:commerce:report_outcome`, `dcc:commerce:read`)
 *   grant zero authority to alter published evidence, claims, rules, or decision receipts.
 * - Outbound affiliate referrals (`handoff_id`) are created ONLY when the commercial module performs
 *   an explicit outbound referral. They do NOT require `DecisionAuthorization`, while DCC-controlled
 *   reservation, payment, and booking adapters remain in `shadow_only_no_side_effects`.
 * - Outcome reporting is optional, retains its authenticated reporter and provenance, preserves
 *   unmatched outcomes, keeps `bookingValue`, `estimatedCommission`, and `paidCommission` distinct,
 *   and never alters rules or becomes approved claims.
 */

import crypto from "node:crypto";
import { Pool } from "@neondatabase/serverless";
import {
  getV03CandidateUniverseWithFallback,
  getV03ReceiptWithFallback,
} from "../machine/v03/runtimeStoreV03";
import { getViatorAccessCapabilities } from "../../viator/access";
import { getViatorClient } from "../../viator/client";
import { getViatorPublicConfig } from "../../viator/config";
import {
  extractClickIdFromTrackingValue,
  generateOpaqueClickId,
  getOpaqueClickAttributionById,
  issueOpaqueClickAttribution,
  reconcilePartnerWebhookByClickId,
  resetOpaqueAttributionLedgerForTests,
  sanitizeOutboundPartnerUrlWithOpaqueClickId,
} from "./opaqueAttributionLedger";
import { readDurableLedgerState } from "../storage/durableTransactionalStore";

export * from "./opaqueAttributionLedger";
export * from "./wtaAffiliateEnrollment";

export type CommercialProvider =
  | "viator"
  | "fareharbor"
  | "getyourguide"
  | "rezdy"
  | "square"
  | "direct";

export interface ApprovedPartnerAttribution {
  partnerId: string;
  partnerName?: string | null;
  authScope: "referral_attribution_only";
  grantsLoginAccess: false;
  grantsReportingAccess: false;
  grantsPayoutAccess: false;
}

export interface CommercialHandoffOutcomeState {
  status: "click_recorded_outcome_unknown" | "outcome_reported";
  bookingOutcome:
    | "unknown"
    | "confirmed"
    | "amended"
    | "cancelled"
    | "refunded"
    | "fulfilled"
    | "pending";
  revenueReconciliation: "unknown" | "reported";
  commissionReconciliation: "unknown" | "estimated" | "paid";
  clickIsBooking: false;
  reportingFeedAvailable: boolean;
  lastOutcomeId: string | null;
  lastUpdatedAt: string | null;
}

export interface CommercialPartyDetails {
  adults?: number;
  children?: number;
  seniors?: number;
  infants?: number;
  totalGuests?: number;
  cruiseShip?: string | null;
  portDate?: string | null;
  notes?: string | null;
}

export interface ViatorWorryFreeProtectionSummary {
  qualifies: boolean;
  qualifiesForViatorWorryFreeGuarantee: boolean;
  tagId: number | null;
  viatorTagId: number | null;
  termsUrl: string;
  termsSection: string;
  requiredPostTourBufferMinutes: number;
  minPostTourBufferBeforeShipDepartureMinutes: number;
  nextPortTransportLimitPerPersonUsd: number;
  missedPortRefundWindowDays: number;
  dccRoleDistinction: string;
}

export interface CommercialCheckoutBookingBinding {
  bookingProvider: CommercialProvider;
  viatorProductCode: string | null;
  viatorBookingUrl: string | null;
  viatorAffiliatePid: string | null;
  viatorAffiliateMcid: string | null;
  viatorWorryFreeShoreExcursion: ViatorWorryFreeProtectionSummary | null;
  travelerReselectionRequirements: string[];
  operatorSourceUrl: string | null;
  operatorFaqUrl: string | null;
  operatorShortname: string;
  fareharborItemId: string | null;
  fareharborDirectEmbedUrl: string | null;
  specialistCheckoutUrl: string | null;
  productCode: string;
  intendedDate: string | null;
  intendedDepartureId: string | null;
  intendedDepartureTime: string | null;
  partySize: number | null;
  passengerWeightsLbs?: number[] | null;
  maxSinglePassengerWeightLbs: number | null;
  youngestPassengerAgeYears: number | null;
  shipArrivalTime: string | null;
  shipDepartureTime: string | null;
  quotedPricePerPersonUsd: number | null;
  quotedTotalPriceUsd: number | null;
}

export interface CreateCommercialHandoffInput {
  originatingSite: string;
  targetSite?: string | null;
  provider: CommercialProvider;
  providerAccount?: string | null;
  viatorProductCode?: string | null;
  fareharborShortname?: string | null;
  fareharborItemId?: string | null;
  productCode: string;
  productTitle?: string | null;
  productDestinationUrl: string;
  campaign?: string | null;
  contextId?: string | null;
  evaluationRunId?: string | null;
  receiptId?: string | null;
  idempotencyKey?: string | null;
  requireDurableRecord?: boolean;
  intendedDate?: string | null;
  intendedOption?: string | null;
  intendedDepartureId?: string | null;
  intendedDepartureTime?: string | null;
  partySize?: number | null;
  partyDetails?: CommercialPartyDetails | null;
  passengerWeightsLbs?: number[] | null;
  maxSinglePassengerWeightLbs?: number | null;
  youngestPassengerAgeYears?: number | null;
  shipArrivalTime?: string | null;
  shipDepartureTime?: string | null;
  quotedPriceAmount?: number | null;
  quotedPriceCurrency?: string | null;
  approvedPartnerAttribution?: {
    partnerId: string;
    partnerName?: string | null;
  } | null;
  callerClientId?: string | null;
  traceparent?: string | null;
  clickId?: string | null;
  recommendedOperatorId?: string | null;
  evidenceVersion?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface CommercialHandoffRecord {
  handoffId: string;
  clickId: string;
  originatingSite: string;
  targetSite: string | null;
  provider: CommercialProvider;
  providerAccount: string;
  viatorProductCode?: string | null;
  fareharborShortname: string | null;
  fareharborItemId: string | null;
  productCode: string;
  productTitle: string | null;
  destinationUrl: string;
  outboundAffiliateUrl: string;
  attributionParameterName: string;
  attributionParameterValue: string;
  contextId: string | null;
  evaluationRunId: string | null;
  receiptId: string | null;
  intendedDate: string | null;
  intendedOption: string | null;
  intendedDepartureId: string | null;
  intendedDepartureTime: string | null;
  partySize: number | null;
  partyDetails: CommercialPartyDetails | null;
  passengerWeightsLbs?: number[] | null;
  maxSinglePassengerWeightLbs: number | null;
  youngestPassengerAgeYears: number | null;
  shipArrivalTime: string | null;
  shipDepartureTime: string | null;
  quotedPriceAmount: number | null;
  quotedPriceCurrency: string | null;
  checkoutBookingBinding: CommercialCheckoutBookingBinding | null;
  approvedPartnerAttribution: ApprovedPartnerAttribution | null;
  outcomeState: CommercialHandoffOutcomeState;
  callerClientId: string;
  traceparent: string | null;
  dccBookingAdapterMode: "shadow_only_no_side_effects";
  requiresDecisionAuthorization: false;
  createdAt: string;
  duplicateSubmission?: boolean;
  metadata: Record<string, unknown>;
}

export interface MonetaryAmountOrNull {
  amount: number | null;
  currency: string | null;
}

export interface ReconciliationFieldComparison<T> {
  handoffOrEvaluated: T | null;
  bookedActual: T | null;
  matches: boolean | null;
}

export interface ReconciliationComparison {
  reconciled: boolean;
  missingOutcomeImpliesFailedBooking: false;
  matchedHandoffId: string | null;
  matchedEvaluationRunId: string | null;
  matchedReceiptId: string | null;
  matchedContextId: string | null;
  dateComparison: ReconciliationFieldComparison<string>;
  productCodeComparison: ReconciliationFieldComparison<string>;
  partySizeComparison: ReconciliationFieldComparison<number>;
  priceComparison: ReconciliationFieldComparison<number>;
}

export interface RecordCommercialOutcomeInput {
  reporterClientId: string;
  reporterProvenance:
    | "authenticated_api_reporter"
    | "viator_modified_since_poller"
    | "getyourguide_partner_adapter"
    | "fareharbor_webhook_adapter"
    | "authenticated_payment_webhook"
    | "authorized_operational_evidence"
    | string;
  provider: CommercialProvider;
  providerAccount?: string | null;
  providerBookingRef: string;
  eventType:
    | "BOOKING_CONFIRMED"
    | "BOOKING_AMENDED"
    | "BOOKING_CANCELLED"
    | "BOOKING_REFUNDED"
    | "BOOKING_FULFILLED"
    | "BOOKING_PENDING"
    | string;
  providerEventTime: string | null;
  handoffId?: string | null;
  clickId?: string | null;
  campaignOrRefValue?: string | null;
  evaluationRunId?: string | null;
  receiptId?: string | null;
  contextId?: string | null;
  bookedProductCode?: string | null;
  bookedDate?: string | null;
  bookedOption?: string | null;
  bookedPartySize?: number | null;
  bookingValueAmount?: number | null;
  bookingValueCurrency?: string | null;
  estimatedCommissionAmount?: number | null;
  estimatedCommissionCurrency?: string | null;
  paidCommissionAmount?: number | null;
  paidCommissionCurrency?: string | null;
  cancellationReason?: string | null;
  rawPayload?: Record<string, unknown> | null;
  traceparent?: string | null;
}

export interface CommercialOutcomeRecord {
  outcomeId: string;
  dedupeKey: string;
  duplicateDelivery: boolean;
  reporterClientId: string;
  reporterProvenance: string;
  provider: CommercialProvider;
  providerAccount: string;
  providerBookingRef: string;
  eventType: string;
  providerEventTime: string | null;
  dccRecordedAt: string;
  handoffId: string | null;
  evaluationRunId: string | null;
  receiptId: string | null;
  contextId: string | null;
  reconciliationStatus: "matched" | "unmatched";
  reconciliationComparison: ReconciliationComparison;
  bookedProductCode: string | null;
  bookedDate: string | null;
  bookedOption: string | null;
  bookedPartySize: number | null;
  bookingValue: MonetaryAmountOrNull;
  estimatedCommission: MonetaryAmountOrNull;
  paidCommission: MonetaryAmountOrNull;
  cancellationReason: string | null;
  altersPublishedEvidenceOrRules: false;
  approvedClaimStatus: "not_a_claim_outcome_only";
  traceparent: string | null;
}

export interface PollerCheckpointRecord {
  pollerId: string;
  provider: CommercialProvider;
  providerAccount: string;
  cursorValue: string | null;
  lastPolledAt: string;
  lastIngestedCount: number;
  lastDeduplicatedCount: number;
  lockedBy: string | null;
  lockedUntil: string | null;
  updatedAt: string;
}

export interface ViatorPollerRunResult {
  pollerId: string;
  provider: "viator";
  providerAccount: string;
  accessTier: string;
  canUseBookingReporting: boolean;
  skippedDueToActiveLease: boolean;
  previousCursor: string | null;
  nextCursor: string | null;
  cursorAdvanced: boolean;
  fetchedCount: number;
  ingestedCount: number;
  deduplicatedCount: number;
  matchedCount: number;
  unmatchedCount: number;
  outcomes: CommercialOutcomeRecord[];
  recordedAt: string;
}

// Default portfolio provider account map preserving each site's existing provider relationships
const SITE_DEFAULT_ACCOUNTS: Record<
  string,
  {
    viatorPid: string;
    viatorMcid: string;
    fareharborAsn: string;
    gygPartnerId: string;
  }
> = {
  "destinationcommandcenter.com": {
    viatorPid: process.env.NEXT_PUBLIC_VIATOR_PID || "P00306962",
    viatorMcid: process.env.NEXT_PUBLIC_VIATOR_MCID || "42383",
    fareharborAsn: "",
    gygPartnerId: process.env.NEXT_PUBLIC_GYG_PARTNER_ID || "F2MMUUH",
  },
  "cruisepromenade.com": {
    viatorPid: process.env.NEXT_PUBLIC_VIATOR_PID || "P00306962",
    viatorMcid: process.env.NEXT_PUBLIC_VIATOR_MCID || "42383",
    fareharborAsn: "",
    gygPartnerId: process.env.NEXT_PUBLIC_GYG_PARTNER_ID || "F2MMUUH",
  },
  "welcometoneworleanstours.com": {
    viatorPid: process.env.NEXT_PUBLIC_VIATOR_PID || "P00058396",
    viatorMcid: process.env.NEXT_PUBLIC_VIATOR_MCID || "42383",
    fareharborAsn: "aktourcenter",
    gygPartnerId: process.env.NEXT_PUBLIC_GYG_PARTNER_ID || "F2MMUUH",
  },
  "welcometotheswamp.com": {
    viatorPid: process.env.NEXT_PUBLIC_VIATOR_PID || "P00058396",
    viatorMcid: process.env.NEXT_PUBLIC_VIATOR_MCID || "42383",
    fareharborAsn: "aktourcenter",
    gygPartnerId: process.env.NEXT_PUBLIC_GYG_PARTNER_ID || "F2MMUUH",
  },
  "lastfrontiershoreexcursions.com": {
    viatorPid: "P00281144",
    viatorMcid: "42383",
    fareharborAsn: "",
    gygPartnerId: process.env.NEXT_PUBLIC_GYG_PARTNER_ID || "F2MMUUH",
  },
  "juneauflightdeck.com": {
    viatorPid: process.env.NEXT_PUBLIC_VIATOR_PID || "P00058396",
    viatorMcid: process.env.NEXT_PUBLIC_VIATOR_MCID || "42383",
    fareharborAsn: "",
    gygPartnerId: process.env.NEXT_PUBLIC_GYG_PARTNER_ID || "F2MMUUH",
  },
  "vibearoundtown.com": {
    viatorPid: process.env.NEXT_PUBLIC_VIATOR_PID || "P00058396",
    viatorMcid: process.env.NEXT_PUBLIC_VIATOR_MCID || "42383",
    fareharborAsn: "vibingaroundtourco",
    gygPartnerId: process.env.NEXT_PUBLIC_GYG_PARTNER_ID || "F2MMUUH",
  },
  "gosno.co": {
    viatorPid: process.env.NEXT_PUBLIC_VIATOR_PID || "P00058396",
    viatorMcid: process.env.NEXT_PUBLIC_VIATOR_MCID || "42383",
    fareharborAsn: "gosno",
    gygPartnerId: process.env.NEXT_PUBLIC_GYG_PARTNER_ID || "F2MMUUH",
  },
  "feastlyspread.com": {
    viatorPid: process.env.NEXT_PUBLIC_VIATOR_PID || "P00058396",
    viatorMcid: process.env.NEXT_PUBLIC_VIATOR_MCID || "42383",
    fareharborAsn: "feastlyspread",
    gygPartnerId: process.env.NEXT_PUBLIC_GYG_PARTNER_ID || "F2MMUUH",
  },
  "brinkberry.com": {
    viatorPid: process.env.NEXT_PUBLIC_VIATOR_PID || "P00058396",
    viatorMcid: process.env.NEXT_PUBLIC_VIATOR_MCID || "42383",
    fareharborAsn: "brinkberry",
    gygPartnerId: process.env.NEXT_PUBLIC_GYG_PARTNER_ID || "F2MMUUH",
  },
  "partyatredrocks.com": {
    viatorPid: process.env.NEXT_PUBLIC_VIATOR_PID || "P00058396",
    viatorMcid: process.env.NEXT_PUBLIC_VIATOR_MCID || "42383",
    fareharborAsn: "partyatredrocks",
    gygPartnerId: process.env.NEXT_PUBLIC_GYG_PARTNER_ID || "F2MMUUH",
  },
  "420friendlyairportpickup.com": {
    viatorPid: process.env.NEXT_PUBLIC_VIATOR_PID || "P00058396",
    viatorMcid: process.env.NEXT_PUBLIC_VIATOR_MCID || "42383",
    fareharborAsn: "420friendlyairportpickup",
    gygPartnerId: process.env.NEXT_PUBLIC_GYG_PARTNER_ID || "F2MMUUH",
  },
};

export const AUTHENTICATED_EVIDENCE_PROVENANCES = new Set<string>([
  "authenticated_api_reporter",
  "viator_modified_since_poller",
  "getyourguide_partner_adapter",
  "fareharbor_webhook_adapter",
  "fareharbor_booking_webhook",
  "fareharbor_authorized_booking_lookup",
  "wta_commission_settlement_ledger",
  "authenticated_payment_webhook",
  "authorized_operational_evidence",
]);

/**
 * Returns true if the supplied reference is a DCC internal artifact (decision receipt,
 * evaluation run ID, context ID, or handoff ID) rather than a real provider booking reference.
 * A DCC decision receipt is NEVER provider confirmation.
 */
export function isDccInternalArtifactNotProviderConfirmation(
  ref?: string | null
): boolean {
  if (!ref || typeof ref !== "string") return false;
  const normalized = ref.trim().toLowerCase();
  if (!normalized) return false;
  return (
    normalized.startsWith("rcpt_") ||
    normalized.startsWith("rcpt:") ||
    normalized.startsWith("dcc_dec_") ||
    normalized.startsWith("dcc_rcpt_") ||
    normalized.startsWith("evalrun:") ||
    normalized.startsWith("eval_") ||
    normalized.startsWith("dcc_ctx_") ||
    normalized.startsWith("hndf_")
  );
}

/**
 * Verifies whether an outcome carries authenticated provider, payment, or authorized
 * operational evidence required to transition a commercial handoff to
 * `confirmed`, `cancelled`, `refunded`, or `fulfilled`.
 */
export function hasAuthenticatedProviderPaymentOrOperationalEvidence(input: {
  reporterClientId?: string | null;
  reporterProvenance?: string | null;
  providerBookingRef?: string | null;
}): boolean {
  const clientId = (input.reporterClientId ?? "").trim().toLowerCase();
  if (
    !clientId ||
    clientId === "anonymous" ||
    clientId === "unauthenticated" ||
    clientId === "public_traveler_browser" ||
    clientId === "client:public_traveler_browser"
  ) {
    return false;
  }
  const provenance = (input.reporterProvenance ?? "").trim();
  if (!AUTHENTICATED_EVIDENCE_PROVENANCES.has(provenance)) {
    return false;
  }
  const bookingRef = (input.providerBookingRef ?? "").trim();
  if (!bookingRef || isDccInternalArtifactNotProviderConfirmation(bookingRef)) {
    return false;
  }
  return true;
}

export function buildInitialHandoffOutcomeState(
  provider: CommercialProvider,
): CommercialHandoffOutcomeState {
  return {
    status: "click_recorded_outcome_unknown",
    bookingOutcome: "unknown",
    revenueReconciliation: "unknown",
    commissionReconciliation: "unknown",
    clickIsBooking: false,
    reportingFeedAvailable: provider === "viator",
    lastOutcomeId: null,
    lastUpdatedAt: null,
  };
}

export function deriveHandoffOutcomeStateFromOutcome(
  provider: CommercialProvider,
  outcome: CommercialOutcomeRecord,
): CommercialHandoffOutcomeState {
  const evt = outcome.eventType.trim().toUpperCase();
  const candidateOutcome: CommercialHandoffOutcomeState["bookingOutcome"] = evt.includes(
    "REFUND",
  )
    ? "refunded"
    : evt.includes("FULFILL") || evt.includes("COMPLETED")
      ? "fulfilled"
      : evt.includes("CANCEL")
        ? "cancelled"
        : evt.includes("AMEND")
          ? "amended"
          : evt.includes("PEND")
            ? "pending"
            : evt.includes("CONFIRM") ||
                evt.includes("COMMISSION_RECONCILED") ||
                evt.includes("COMMISSION_SETTLED")
              ? "confirmed"
              : "unknown";

  const hasValidEvidence = hasAuthenticatedProviderPaymentOrOperationalEvidence({
    reporterClientId: outcome.reporterClientId,
    reporterProvenance: outcome.reporterProvenance,
    providerBookingRef: outcome.providerBookingRef,
  });

  // Confirmed, cancelled, refunded, fulfilled (and amended) require authenticated provider,
  // payment, or authorized operational evidence. Otherwise the outcome remains unknown.
  if (
    (candidateOutcome === "confirmed" ||
      candidateOutcome === "cancelled" ||
      candidateOutcome === "refunded" ||
      candidateOutcome === "fulfilled" ||
      candidateOutcome === "amended") &&
    !hasValidEvidence
  ) {
    return {
      status: "click_recorded_outcome_unknown",
      bookingOutcome: "unknown",
      revenueReconciliation: "unknown",
      commissionReconciliation: "unknown",
      clickIsBooking: false,
      reportingFeedAvailable: provider === "viator",
      lastOutcomeId: outcome.outcomeId,
      lastUpdatedAt: outcome.dccRecordedAt,
    };
  }

  const bookingOutcome = hasValidEvidence ? candidateOutcome : "unknown";
  const status: CommercialHandoffOutcomeState["status"] =
    bookingOutcome === "unknown" ? "click_recorded_outcome_unknown" : "outcome_reported";

  const revenueReconciliation: CommercialHandoffOutcomeState["revenueReconciliation"] =
    hasValidEvidence && outcome.bookingValue.amount !== null ? "reported" : "unknown";

  const commissionReconciliation: CommercialHandoffOutcomeState["commissionReconciliation"] =
    !hasValidEvidence
      ? "unknown"
      : outcome.paidCommission.amount !== null
        ? "paid"
        : outcome.estimatedCommission.amount !== null
          ? "estimated"
          : "unknown";

  return {
    status,
    bookingOutcome,
    revenueReconciliation,
    commissionReconciliation,
    clickIsBooking: false,
    reportingFeedAvailable: provider === "viator",
    lastOutcomeId: outcome.outcomeId,
    lastUpdatedAt: outcome.dccRecordedAt,
  };
}

export type MachineFunnelStage = "search" | "availability_check" | "checkout_handoff";

export interface MachineFunnelEventRecord {
  eventId: string;
  stage: MachineFunnelStage;
  originatingSite: string;
  callerClientId: string;
  portSlug: string | null;
  productCode: string | null;
  optionCode: string | null;
  intendedDate: string | null;
  departureTime: string | null;
  partySize: number | null;
  handoffId: string | null;
  clickId: string | null;
  idempotencyKey: string | null;
  isQaTraffic: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface MachineCommerceFunnelSummary {
  searchEvents: number;
  availabilityCheckEvents: number;
  checkoutHandoffEvents: number;
  matchedConfirmedBookings: number;
  paidCommissionsCount: number;
  paidCommissionsUsd: number;
  qaExcludedEvents: {
    searchEvents: number;
    availabilityCheckEvents: number;
    checkoutHandoffEvents: number;
    total: number;
  };
  note: string;
}

export function isCommercialQaTraffic(input: {
  isQaTraffic?: boolean | null;
  qaTraffic?: boolean | null;
  isTest?: boolean | null;
  simulateTimeout?: boolean | null;
  trafficClass?: string | null;
  idempotencyKey?: string | null;
  callerClientId?: string | null;
  handoffId?: string | null;
  clickId?: string | null;
  metadata?: Record<string, unknown> | null;
}): boolean {
  if (
    input.isQaTraffic === true ||
    input.qaTraffic === true ||
    input.isTest === true ||
    input.simulateTimeout === true
  ) {
    return true;
  }
  const meta = input.metadata || {};
  if (
    meta.isQaTraffic === true ||
    meta.qaTraffic === true ||
    meta.isTest === true ||
    meta.simulateTimeout === true ||
    meta.trafficClass === "test" ||
    meta.trafficClass === "qa"
  ) {
    return true;
  }
  const tc = String(input.trafficClass || "").trim().toLowerCase();
  if (tc === "test" || tc === "qa") return true;

  const idem = String(input.idempotencyKey || meta.idempotencyKey || "")
    .trim()
    .toLowerCase();
  if (
    idem.startsWith("qa_") ||
    idem.startsWith("qa-") ||
    idem.startsWith("test_") ||
    idem.startsWith("test-") ||
    idem.startsWith("vitest_") ||
    idem.startsWith("smoke_")
  ) {
    return true;
  }

  const client = String(input.callerClientId || "")
    .trim()
    .toLowerCase();
  if (
    client.includes("qa_test") ||
    client.includes("qa-test") ||
    client.startsWith("qa_") ||
    client.startsWith("test_") ||
    client.includes("vitest")
  ) {
    return true;
  }

  const hid = String(input.handoffId || "").trim().toLowerCase();
  const cid = String(input.clickId || meta.clickId || "").trim().toLowerCase();
  if (
    hid.startsWith("test") ||
    hid.startsWith("qa_") ||
    cid.startsWith("test") ||
    cid.startsWith("qa_")
  ) {
    return true;
  }

  return false;
}

// In-memory store synchronized with Neon PostgreSQL when DATABASE_URL is configured
const memoryHandoffs = new Map<string, CommercialHandoffRecord>();
const memoryOutcomesByDedupeKey = new Map<string, CommercialOutcomeRecord>();
const memoryOutcomesById = new Map<string, CommercialOutcomeRecord>();
const memoryCheckpoints = new Map<string, PollerCheckpointRecord>();
const memoryActiveLeases = new Map<string, { holderId: string; expiresAtMs: number }>();
const memoryMachineFunnelEvents = new Map<string, MachineFunnelEventRecord>();

export function resetCommercialMemoryStoreForTests(): void {
  memoryHandoffs.clear();
  memoryOutcomesByDedupeKey.clear();
  memoryOutcomesById.clear();
  memoryCheckpoints.clear();
  memoryActiveLeases.clear();
  memoryMachineFunnelEvents.clear();
  resetOpaqueAttributionLedgerForTests();
}

let commercePool: Pool | null = null;
let commerceSchemaReadyPromise: Promise<boolean> | null = null;

function getCommercePool(): Pool | null {
  const url = process.env.DATABASE_URL;
  if (!url || process.env.DCC_DISABLE_NEON_COMMERCE === "1") {
    return null;
  }
  if (!commercePool) {
    commercePool = new Pool({
      connectionString: url,
      max: 4,
      idleTimeoutMillis: 15_000,
      connectionTimeoutMillis: 8_000,
    });
  }
  return commercePool;
}

export async function ensureCommerceTables(): Promise<boolean> {
  const pool = getCommercePool();
  if (!pool) return false;
  if (commerceSchemaReadyPromise) {
    return commerceSchemaReadyPromise;
  }
  commerceSchemaReadyPromise = (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS dcc_commercial_handoffs (
          handoff_id TEXT PRIMARY KEY,
          originating_site TEXT NOT NULL,
          provider TEXT NOT NULL,
          provider_account TEXT NOT NULL,
          product_code TEXT NOT NULL,
          product_title TEXT,
          destination_url TEXT NOT NULL,
          outbound_affiliate_url TEXT NOT NULL,
          attribution_param_name TEXT NOT NULL,
          attribution_param_value TEXT NOT NULL,
          context_id TEXT,
          evaluation_run_id TEXT,
          receipt_id TEXT,
          intended_date TEXT,
          intended_option TEXT,
          party_size INTEGER,
          party_details_json JSONB,
          quoted_price_amount NUMERIC,
          quoted_price_currency TEXT,
          caller_client_id TEXT NOT NULL,
          traceparent TEXT,
          metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
        );

        CREATE INDEX IF NOT EXISTS idx_dcc_commercial_handoffs_receipt
          ON dcc_commercial_handoffs(receipt_id);
        CREATE INDEX IF NOT EXISTS idx_dcc_commercial_handoffs_eval_run
          ON dcc_commercial_handoffs(evaluation_run_id);
        CREATE INDEX IF NOT EXISTS idx_dcc_commercial_handoffs_context
          ON dcc_commercial_handoffs(context_id);

        CREATE TABLE IF NOT EXISTS dcc_commercial_outcomes (
          outcome_id TEXT PRIMARY KEY,
          dedupe_key TEXT NOT NULL UNIQUE,
          reporter_client_id TEXT NOT NULL,
          reporter_provenance TEXT NOT NULL,
          provider TEXT NOT NULL,
          provider_account TEXT NOT NULL,
          provider_booking_ref TEXT NOT NULL,
          event_type TEXT NOT NULL,
          provider_event_time TIMESTAMPTZ,
          dcc_recorded_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
          handoff_id TEXT,
          evaluation_run_id TEXT,
          receipt_id TEXT,
          context_id TEXT,
          reconciliation_status TEXT NOT NULL,
          reconciliation_json JSONB NOT NULL,
          booked_product_code TEXT,
          booked_date TEXT,
          booked_option TEXT,
          booked_party_size INTEGER,
          booking_value_amount NUMERIC,
          booking_value_currency TEXT,
          estimated_commission_amount NUMERIC,
          estimated_commission_currency TEXT,
          paid_commission_amount NUMERIC,
          paid_commission_currency TEXT,
          cancellation_reason TEXT,
          raw_payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
          traceparent TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_dcc_commercial_outcomes_handoff
          ON dcc_commercial_outcomes(handoff_id);
        CREATE INDEX IF NOT EXISTS idx_dcc_commercial_outcomes_booking_ref
          ON dcc_commercial_outcomes(provider, provider_booking_ref);

        CREATE TABLE IF NOT EXISTS dcc_commercial_poller_checkpoints (
          poller_id TEXT PRIMARY KEY,
          provider TEXT NOT NULL,
          provider_account TEXT NOT NULL,
          cursor_value TEXT,
          last_polled_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
          last_ingested_count INTEGER NOT NULL DEFAULT 0,
          last_deduplicated_count INTEGER NOT NULL DEFAULT 0,
          locked_by TEXT,
          locked_until TIMESTAMPTZ,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
        );

        CREATE TABLE IF NOT EXISTS dcc_machine_funnel_events (
          event_id TEXT PRIMARY KEY,
          stage TEXT NOT NULL,
          originating_site TEXT NOT NULL,
          caller_client_id TEXT NOT NULL,
          port_slug TEXT,
          product_code TEXT,
          option_code TEXT,
          intended_date TEXT,
          departure_time TEXT,
          party_size INTEGER,
          handoff_id TEXT,
          click_id TEXT,
          idempotency_key TEXT,
          is_qa_traffic BOOLEAN NOT NULL DEFAULT FALSE,
          metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
        );

        CREATE INDEX IF NOT EXISTS idx_dcc_machine_funnel_stage
          ON dcc_machine_funnel_events(stage, is_qa_traffic);
        CREATE INDEX IF NOT EXISTS idx_dcc_machine_funnel_handoff
          ON dcc_machine_funnel_events(handoff_id);
      `);
      return true;
    } catch {
      commerceSchemaReadyPromise = null;
      return false;
    }
  })();
  return commerceSchemaReadyPromise;
}

export function normalizeOriginatingSite(site: string): string {
  const trimmed = site.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
  return trimmed.split("/")[0] || "destinationcommandcenter.com";
}

export function generateOpaqueHandoffId(): string {
  return `hndf_${crypto.randomBytes(12).toString("hex")}`;
}

type DurableHandoffKey = { originatingSite: string; callerClientId: string; idempotencyKey: string };

function durableHandoffId(key: DurableHandoffKey): string {
  const scope = ["dcc-durable-handoff", normalizeOriginatingSite(key.originatingSite), key.callerClientId, key.idempotencyKey];
  return `hndf_${crypto.createHash("sha256").update(JSON.stringify(scope)).digest("hex").slice(0, 24)}`;
}

export class CommercialHandoffStorageError extends Error {
  constructor() {
    super("Durable checkout handoff storage is unavailable. Retry with the same idempotency key.");
  }
}

export function getDurableCommercialHandoff(key: DurableHandoffKey) {
  return getCommercialHandoffById(durableHandoffId(key), { durableOnly: true });
}

export function extractHandoffIdFromTrackingValue(value?: string | null): string | null {
  if (!value || typeof value !== "string") return null;
  const match = value.match(/(hndf_[0-9a-f]{24})/i);
  return match ? match[1].toLowerCase() : null;
}

function sanitizeCampaignSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "dcc";
}

export interface ProviderAffiliateUrlResult {
  outboundAffiliateUrl: string;
  providerAccount: string;
  attributionParameterName: string;
  attributionParameterValue: string;
  clickId: string;
}

export const JUNEAU_VIATOR_RESELECTION_REQUIREMENTS = [
  "Confirm or reselect the travel date (startDate) in Viator's live availability calendar.",
  "Select a specific departure time slot inside Viator that fits your cruise ship arrival and all-aboard buffer.",
  "Select the passenger count and appropriate Coastal Helicopters weight-tier option (DEFAULT: 1–259 lbs standard seat, TG1: 260–299 lbs half-seat surcharge, TG2: 300+ lbs second seat) in Viator.",
  "Enter each passenger's individual weight, full name, cruise ship name, port arrival/departure times, and pickup point during Viator checkout.",
] as const;

/**
 * Constructs a provider-supported affiliate URL preserving the originating site's
 * existing account attribution and attaching the opaque `handoff_id` and `click_id`
 * without leaking cryptographic decision receipts or inventing unsupported direct-to-cart capabilities.
 */
export function buildProviderAffiliateHandoffUrl(params: {
  originatingSite: string;
  provider: CommercialProvider;
  providerAccount?: string | null;
  viatorProductCode?: string | null;
  fareharborShortname?: string | null;
  fareharborItemId?: string | null;
  productCode: string;
  productDestinationUrl: string;
  handoffId: string;
  clickId?: string | null;
  campaign?: string | null;
  receiptId?: string | null;
  intendedDate?: string | null;
  intendedDepartureId?: string | null;
  intendedDepartureTime?: string | null;
  partySize?: number | null;
  maxSinglePassengerWeightLbs?: number | null;
  quotedPriceAmount?: number | null;
}): ProviderAffiliateUrlResult {
  const siteKey = normalizeOriginatingSite(params.originatingSite);
  const siteDefaults =
    SITE_DEFAULT_ACCOUNTS[siteKey] || SITE_DEFAULT_ACCOUNTS["destinationcommandcenter.com"];
  const baseCampaign = sanitizeCampaignSlug(
    params.campaign || `${siteKey.replace(/\..*$/, "")}-${params.productCode}`
  );
  const clickId =
    params.clickId && /^clk_(?:[0-9a-f]{24}|qa_[0-9a-f]{20})$/i.test(params.clickId.trim())
      ? params.clickId.trim().toLowerCase()
      : generateOpaqueClickId();

  let url: URL;
  try {
    url = new URL(params.productDestinationUrl);
  } catch {
    const err = new Error(
      `Invalid productDestinationUrl '${params.productDestinationUrl}'. Refusing to fall back to Viator homepage.`,
    ) as Error & { code?: string; statusCode?: number };
    err.code = "INVALID_PRODUCT_DESTINATION_URL";
    err.statusCode = 400;
    throw err;
  }

  if (
    params.provider === "viator" &&
    (url.hostname === "viator.com" || url.hostname === "www.viator.com") &&
    (url.pathname === "/" || url.pathname.trim() === "")
  ) {
    const err = new Error(
      "VIATOR_PRODUCT_URL_REQUIRED: Refusing to fall back to Viator homepage; an explicit Viator product or search URL is required.",
    ) as Error & { code?: string; statusCode?: number };
    err.code = "VIATOR_PRODUCT_URL_REQUIRED";
    err.statusCode = 400;
    throw err;
  }

  const appendExplicitDepartureQueryParams = (targetUrl: URL) => {
    if (params.viatorProductCode?.trim()) {
      targetUrl.searchParams.set("viator_product", params.viatorProductCode.trim());
    }
    if (params.fareharborItemId?.trim()) {
      targetUrl.searchParams.set("item", params.fareharborItemId.trim());
    }
    if (params.fareharborShortname?.trim() && !targetUrl.searchParams.has("shortname")) {
      targetUrl.searchParams.set("shortname", params.fareharborShortname.trim());
    }
    if (params.intendedDate?.trim()) {
      targetUrl.searchParams.set("date", params.intendedDate.trim());
    }
    if (params.intendedDepartureId?.trim()) {
      targetUrl.searchParams.set("departure", params.intendedDepartureId.trim());
    }
    if (params.intendedDepartureTime?.trim()) {
      targetUrl.searchParams.set("time", params.intendedDepartureTime.trim());
    }
    if (typeof params.partySize === "number" && Number.isFinite(params.partySize)) {
      targetUrl.searchParams.set("party_size", String(Math.round(params.partySize)));
    }
    if (
      typeof params.maxSinglePassengerWeightLbs === "number" &&
      Number.isFinite(params.maxSinglePassengerWeightLbs)
    ) {
      targetUrl.searchParams.set(
        "max_weight_lbs",
        String(Math.round(params.maxSinglePassengerWeightLbs))
      );
    }
    if (
      typeof params.quotedPriceAmount === "number" &&
      Number.isFinite(params.quotedPriceAmount)
    ) {
      targetUrl.searchParams.set("quoted_price", String(params.quotedPriceAmount));
    }
    // IMPORTANT: Never pass cryptographic decision receipts (`receipt_id`) to outbound partner URLs.
    // Instead, strip any leaked receipt/architecture params and append the opaque `click_id`.
    if (
      params.viatorProductCode ||
      params.fareharborItemId ||
      params.intendedDate ||
      params.intendedDepartureId ||
      params.intendedDepartureTime
    ) {
      targetUrl.searchParams.set("tour", params.productCode);
      targetUrl.searchParams.set("handoff_id", params.handoffId);
    }
  };

  if (params.provider === "viator") {
    const pid =
      params.providerAccount?.trim() ||
      url.searchParams.get("pid") ||
      siteDefaults.viatorPid;
    const mcid = url.searchParams.get("mcid") || siteDefaults.viatorMcid;
    const campaignValue = `${baseCampaign}__${params.handoffId}`;

    url.searchParams.set("pid", pid);
    url.searchParams.set("mcid", mcid);
    url.searchParams.set("medium", url.searchParams.get("medium") || "api");
    url.searchParams.set("campaign", campaignValue);
    if (params.intendedDate?.trim()) {
      url.searchParams.set("startDate", params.intendedDate.trim());
    }
    if (typeof params.partySize === "number" && Number.isFinite(params.partySize)) {
      url.searchParams.set("numTravelers", String(Math.round(params.partySize)));
    }
    const isDirectViatorHost =
      url.hostname === "viator.com" || url.hostname === "www.viator.com";
    if (!isDirectViatorHost) {
      appendExplicitDepartureQueryParams(url);
    }
    const { outboundUrl } = sanitizeOutboundPartnerUrlWithOpaqueClickId(url, clickId);

    return {
      outboundAffiliateUrl: outboundUrl,
      providerAccount: pid,
      attributionParameterName: "campaign",
      attributionParameterValue: campaignValue,
      clickId,
    };
  }

  if (params.provider === "fareharbor") {
    const asn =
      params.providerAccount?.trim() ||
      url.searchParams.get("asn") ||
      siteDefaults.fareharborAsn;
    const refValue = `${baseCampaign}__${params.handoffId}`;

    if (asn) {
      url.searchParams.set("asn", asn);
    }
    url.searchParams.set("ref", refValue);
    if (!url.searchParams.has("full-items")) {
      url.searchParams.set("full-items", "yes");
    }
    appendExplicitDepartureQueryParams(url);
    const { outboundUrl } = sanitizeOutboundPartnerUrlWithOpaqueClickId(url, clickId);

    return {
      outboundAffiliateUrl: outboundUrl,
      providerAccount: asn,
      attributionParameterName: "ref",
      attributionParameterValue: refValue,
      clickId,
    };
  }

  if (params.provider === "getyourguide") {
    const partnerId =
      params.providerAccount?.trim() ||
      url.searchParams.get("partner_id") ||
      siteDefaults.gygPartnerId;
    const cmpValue = `${baseCampaign}__${params.handoffId}`;

    url.searchParams.set("partner_id", partnerId);
    url.searchParams.set("utm_medium", url.searchParams.get("utm_medium") || "online_publisher");
    url.searchParams.set("cmp", cmpValue);
    appendExplicitDepartureQueryParams(url);
    const { outboundUrl } = sanitizeOutboundPartnerUrlWithOpaqueClickId(url, clickId);

    return {
      outboundAffiliateUrl: outboundUrl,
      providerAccount: partnerId,
      attributionParameterName: "cmp",
      attributionParameterValue: cmpValue,
      clickId,
    };
  }

  if (params.provider === "rezdy") {
    const rezdyAccount = params.providerAccount?.trim() || url.hostname;
    const refValue = `${baseCampaign}__${params.handoffId}`;
    url.searchParams.set("ref", refValue);
    url.searchParams.set("utm_source", siteKey);
    appendExplicitDepartureQueryParams(url);
    const { outboundUrl } = sanitizeOutboundPartnerUrlWithOpaqueClickId(url, clickId);

    return {
      outboundAffiliateUrl: outboundUrl,
      providerAccount: rezdyAccount,
      attributionParameterName: "ref",
      attributionParameterValue: refValue,
      clickId,
    };
  }

  if (params.provider === "square") {
    const squareAccount = params.providerAccount?.trim() || url.hostname;
    const attributionValue = `${baseCampaign}__${params.handoffId}`;
    url.searchParams.set("dcc_handoff_id", params.handoffId);
    url.searchParams.set("utm_source", siteKey);
    url.searchParams.set("utm_campaign", attributionValue);
    appendExplicitDepartureQueryParams(url);
    const { outboundUrl } = sanitizeOutboundPartnerUrlWithOpaqueClickId(url, clickId);

    return {
      outboundAffiliateUrl: outboundUrl,
      providerAccount: squareAccount,
      attributionParameterName: "dcc_handoff_id",
      attributionParameterValue: params.handoffId,
      clickId,
    };
  }

  // Direct operator referral
  const operatorAccount = params.providerAccount?.trim() || url.hostname;
  const attributionValue = `${baseCampaign}__${params.handoffId}`;
  url.searchParams.set("dcc_handoff_id", params.handoffId);
  url.searchParams.set("utm_source", siteKey);
  url.searchParams.set("utm_campaign", attributionValue);
  appendExplicitDepartureQueryParams(url);
  const { outboundUrl } = sanitizeOutboundPartnerUrlWithOpaqueClickId(url, clickId);

  return {
    outboundAffiliateUrl: outboundUrl,
    providerAccount: operatorAccount,
    attributionParameterName: "dcc_handoff_id",
    attributionParameterValue: params.handoffId,
    clickId,
  };
}

export interface VersionedCandidatePolicyAttributes {
  universeId: string;
  universeVersion: string;
  universeHash: string;
  candidateDccEntityId: string;
  legacyCandidateCode: string;
  displayName: string;
  operatorDisplayName: string;
  bookingProvider: string;
  viatorProductCode: string | null;
  viatorProductUrl: string | null;
  viatorSearchUrl: string | null;
  viatorAffiliatePid: string | null;
  viatorAffiliateMcid: string | null;
  viatorWorryFreeShoreExcursion: boolean;
  viatorWorryFreeTagId: number | null;
  viatorTermsUrl: string | null;
  viatorTermsSection: string | null;
  viatorMinPostTourBufferBeforeShipDepartureMinutes: number | null;
  viatorNextPortTransportLimitPerPersonUsd: number | null;
  viatorWorryFreeProtection: ViatorWorryFreeProtectionSummary;
  operatorSourceUrl: string | null;
  operatorFaqUrl: string | null;
  fareharborShortname: string | null;
  fareharborItemId: string | null;
  basePriceUsd: number;
  weightPolicyType: string;
  weightSurchargeThresholdLbs: number | null;
  weightSurchargeUsd: number;
  secondaryWeightSurchargeThresholdLbs: number | null;
  secondaryWeightSurchargeUsd: number | null;
  minAgeYears: number;
  prohibitsLapChildren: boolean;
  requiresUnassistedAircraftBoarding: boolean;
  requiresOneHourUnassistedGlacierWalk: boolean;
  prohibitsDrones: boolean;
  prohibitsSelfieSticks: boolean;
  prohibitsBagsOnAircraft: boolean;
  prohibitsServiceAnimals: boolean;
  postArrivalBufferMinutes: number;
  preDepartureBufferMinutes: number;
  totalDurationMinutes: number;
  minPortWindowMinutes: number;
  operatingSeasonMonthsUtc: number[];
  requiredClaimIds: readonly string[];
}

export async function resolveVersionedCandidatePolicy(
  productCode: string,
  receiptId?: string | null,
): Promise<VersionedCandidatePolicyAttributes | null> {
  const code = (productCode ?? "").trim();
  if (!code) return null;

  let universe = null;
  if (receiptId?.trim()) {
    const storedReceipt = await getV03ReceiptWithFallback(receiptId.trim());
    if (storedReceipt?.receipt?.payload?.candidateUniverseHash) {
      universe = await getV03CandidateUniverseWithFallback(
        storedReceipt.receipt.payload.candidateUniverseHash,
      );
    }
  }
  if (!universe) {
    universe = await getV03CandidateUniverseWithFallback(
      "univ:juneau-helicopter-tours",
      "0.3.0",
    );
  }
  if (!universe) return null;

  const candidate = universe.includedCandidates.find(
    (c) =>
      c.legacyCandidateCode === code ||
      c.candidateDccEntityId === code ||
      (typeof c.staticAttributes?.viatorProductCode === "string" &&
        c.staticAttributes.viatorProductCode !== "NONE_VIATOR_SEARCH_FALLBACK" &&
        c.staticAttributes.viatorProductCode === code),
  );
  if (!candidate) return null;

  const attrs = candidate.staticAttributes ?? {};
  const basePriceUsd =
    typeof attrs.basePriceUsd === "number" ? attrs.basePriceUsd : 459;
  const weightSurchargeThresholdLbs =
    typeof attrs.weightSurchargeThresholdLbs === "number"
      ? attrs.weightSurchargeThresholdLbs
      : null;
  const weightSurchargeUsd =
    typeof attrs.weightSurchargeUsd === "number"
      ? attrs.weightSurchargeUsd
      : typeof attrs.standardPlusPriceUsd260To299Lbs === "number"
        ? Number((attrs.standardPlusPriceUsd260To299Lbs - basePriceUsd).toFixed(2))
        : 150;
  const secondaryWeightSurchargeThresholdLbs =
    typeof attrs.secondaryWeightSurchargeThresholdLbs === "number"
      ? attrs.secondaryWeightSurchargeThresholdLbs
      : null;
  const secondaryWeightSurchargeUsd =
    typeof attrs.secondaryWeightSurchargeUsd === "number"
      ? attrs.secondaryWeightSurchargeUsd
      : typeof attrs.premiumPriceUsd300PlusLbs === "number"
        ? Number((attrs.premiumPriceUsd300PlusLbs - basePriceUsd).toFixed(2))
        : null;

  const rawSeason =
    typeof attrs.operatingSeasonMonthsUtc === "string"
      ? attrs.operatingSeasonMonthsUtc
      : "5,6,7,8,9";
  const operatingSeasonMonthsUtc = rawSeason
    .split(",")
    .map((m) => Number(m.trim()))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 12);

  const rawViatorCode =
    typeof attrs.viatorProductCode === "string" &&
    attrs.viatorProductCode !== "NONE_VIATOR_SEARCH_FALLBACK"
      ? attrs.viatorProductCode
      : null;

  const qualifiesWorryFree = attrs.viatorWorryFreeShoreExcursion === true;
  const worryFreeTagId =
    typeof attrs.viatorWorryFreeTagId === "number" ? attrs.viatorWorryFreeTagId : null;
  const worryFreeTermsUrl =
    typeof attrs.viatorTermsUrl === "string"
      ? attrs.viatorTermsUrl
      : "https://www.viator.com/support/termsAndConditions";
  const worryFreeTermsSection =
    typeof attrs.viatorTermsSection === "string"
      ? attrs.viatorTermsSection
      : "Section 20 (Worry-free Shore Excursions)";
  const worryFreeBufferMins =
    typeof attrs.viatorMinPostTourBufferBeforeShipDepartureMinutes === "number"
      ? attrs.viatorMinPostTourBufferBeforeShipDepartureMinutes
      : 120;
  const worryFreeLimitUsd =
    typeof attrs.viatorNextPortTransportLimitPerPersonUsd === "number"
      ? attrs.viatorNextPortTransportLimitPerPersonUsd
      : 1000;

  return {
    universeId: universe.universeId,
    universeVersion: universe.version,
    universeHash: universe.universeHash,
    candidateDccEntityId: candidate.candidateDccEntityId,
    legacyCandidateCode: candidate.legacyCandidateCode,
    displayName: candidate.displayName,
    operatorDisplayName: candidate.operatorDisplayName,
    bookingProvider:
      typeof attrs.bookingProvider === "string" ? attrs.bookingProvider : "viator",
    viatorProductCode: rawViatorCode,
    viatorProductUrl:
      typeof attrs.viatorProductUrl === "string" ? attrs.viatorProductUrl : null,
    viatorSearchUrl:
      typeof attrs.viatorSearchUrl === "string" ? attrs.viatorSearchUrl : null,
    viatorAffiliatePid:
      typeof attrs.viatorAffiliatePid === "string" ? attrs.viatorAffiliatePid : "P00058396",
    viatorAffiliateMcid:
      typeof attrs.viatorAffiliateMcid === "string" ? attrs.viatorAffiliateMcid : "42383",
    viatorWorryFreeShoreExcursion: qualifiesWorryFree,
    viatorWorryFreeTagId: worryFreeTagId,
    viatorTermsUrl: worryFreeTermsUrl,
    viatorTermsSection: worryFreeTermsSection,
    viatorMinPostTourBufferBeforeShipDepartureMinutes: worryFreeBufferMins,
    viatorNextPortTransportLimitPerPersonUsd: worryFreeLimitUsd,
    viatorWorryFreeProtection: {
      qualifies: qualifiesWorryFree,
      qualifiesForViatorWorryFreeGuarantee: qualifiesWorryFree,
      tagId: worryFreeTagId,
      viatorTagId: worryFreeTagId,
      termsUrl: worryFreeTermsUrl,
      termsSection: worryFreeTermsSection,
      requiredPostTourBufferMinutes: worryFreeBufferMins,
      minPostTourBufferBeforeShipDepartureMinutes: worryFreeBufferMins,
      nextPortTransportLimitPerPersonUsd: worryFreeLimitUsd,
      missedPortRefundWindowDays: 14,
      dccRoleDistinction:
        "DCC evaluates tour suitability and calculates cruise-port schedule buffers; Juneau Flight Deck explains the options; Viator handles the booking and provides the Worry-free Shore Excursion back-to-ship guarantee under Section 20 of Viator's Terms of Use. DCC itself does not provide a back-to-ship guarantee.",
    },
    operatorSourceUrl:
      typeof attrs.operatorSourceUrl === "string" ? attrs.operatorSourceUrl : null,
    operatorFaqUrl:
      typeof attrs.operatorFaqUrl === "string" ? attrs.operatorFaqUrl : null,
    fareharborShortname:
      typeof attrs.fareharborShortname === "string" ? attrs.fareharborShortname : null,
    fareharborItemId:
      typeof attrs.fareharborItemId === "string" ? attrs.fareharborItemId : null,
    basePriceUsd,
    weightPolicyType:
      typeof attrs.weightPolicyType === "string" ? attrs.weightPolicyType : "surcharge_only",
    weightSurchargeThresholdLbs,
    weightSurchargeUsd,
    secondaryWeightSurchargeThresholdLbs,
    secondaryWeightSurchargeUsd,
    minAgeYears: typeof attrs.minAgeYears === "number" ? attrs.minAgeYears : 0,
    prohibitsLapChildren: attrs.prohibitsLapChildren === true,
    requiresUnassistedAircraftBoarding:
      attrs.requiresUnassistedAircraftBoarding === true ||
      attrs.requiresUnassistedBoarding === true,
    requiresOneHourUnassistedGlacierWalk:
      attrs.requiresOneHourUnassistedGlacierWalk === true ||
      attrs.requiresOneHourGlacierWalk === true,
    prohibitsDrones: attrs.prohibitsDrones === true,
    prohibitsSelfieSticks: attrs.prohibitsSelfieSticks === true,
    prohibitsBagsOnAircraft:
      attrs.prohibitsBagsOnAircraft === true || attrs.prohibitsCarryOnBags === true,
    prohibitsServiceAnimals: attrs.prohibitsServiceAnimals === true,
    postArrivalBufferMinutes:
      typeof attrs.postArrivalBufferMinutes === "number" ? attrs.postArrivalBufferMinutes : 45,
    preDepartureBufferMinutes:
      typeof attrs.preDepartureBufferMinutes === "number"
        ? attrs.preDepartureBufferMinutes
        : 45,
    totalDurationMinutes:
      typeof attrs.totalDurationMinutes === "number" ? attrs.totalDurationMinutes : 135,
    minPortWindowMinutes:
      typeof attrs.minPortWindowMinutes === "number" ? attrs.minPortWindowMinutes : 210,
    operatingSeasonMonthsUtc,
    requiredClaimIds: candidate.requiredClaimIds,
  };
}

/**
 * Creates and persists an outbound commercial handoff record.
 * Called ONLY when an explicit outbound referral click or handoff request occurs.
 */
export async function createCommercialHandoff(
  input: CreateCommercialHandoffInput
): Promise<CommercialHandoffRecord> {
  const originatingSite = normalizeOriginatingSite(input.originatingSite);
  const callerClientId = input.callerClientId?.trim() || "public_traveler_browser";
  const rawIdempotencyKey =
    (typeof input.idempotencyKey === "string" && input.idempotencyKey.trim()) ||
    (input.metadata &&
    typeof input.metadata.idempotencyKey === "string" &&
    input.metadata.idempotencyKey.trim()) ||
    null;

  let durableId: string | null = null;
  if (input.requireDurableRecord) {
    if (!rawIdempotencyKey || !input.callerClientId) throw new CommercialHandoffStorageError();
    durableId = durableHandoffId({ originatingSite, callerClientId, idempotencyKey: rawIdempotencyKey });
    const existing = await getCommercialHandoffById(durableId, { durableOnly: true });
    if (existing) return { ...existing, duplicateSubmission: true };
  } else if (rawIdempotencyKey) {
    for (const existing of memoryHandoffs.values()) {
      if (
        (existing.originatingSite === originatingSite ||
          existing.callerClientId === callerClientId) &&
        !existing.metadata.portDayCheckoutSelection &&
        existing.metadata?.idempotencyKey === rawIdempotencyKey
      ) {
        return {
          ...existing,
          duplicateSubmission: true,
        };
      }
    }

    const poolCheck = getCommercePool();
    const hasDbCheck = await ensureCommerceTables();
    if (poolCheck && hasDbCheck) {
      try {
        const dupRes = await poolCheck.query<{ handoff_id: string }>(
          `SELECT handoff_id FROM dcc_commercial_handoffs
           WHERE (originating_site = $1 OR caller_client_id = $2)
             AND metadata_json->>'idempotencyKey' = $3
             AND NOT (metadata_json ? 'portDayCheckoutSelection')
           ORDER BY created_at ASC LIMIT 1`,
          [originatingSite, callerClientId, rawIdempotencyKey]
        );
        if (dupRes.rows[0]?.handoff_id) {
          const loaded = await getCommercialHandoffById(dupRes.rows[0].handoff_id);
          if (loaded) {
            return {
              ...loaded,
              duplicateSubmission: true,
            };
          }
        }
      } catch {
        // Proceed with creation if lookup fails
      }
    }
  }

  const isQaTraffic = isCommercialQaTraffic({
    idempotencyKey: rawIdempotencyKey,
    callerClientId,
    metadata: input.metadata ?? null,
  });

  const partySize =
    typeof input.partySize === "number" && Number.isFinite(input.partySize)
      ? Math.max(1, Math.round(input.partySize))
      : typeof input.partyDetails?.totalGuests === "number"
        ? Math.max(1, Math.round(input.partyDetails.totalGuests))
        : typeof input.partyDetails?.adults === "number"
          ? Math.max(
              1,
              Math.round(
                (input.partyDetails.adults || 0) +
                  (input.partyDetails.children || 0) +
                  (input.partyDetails.seniors || 0) +
                  (input.partyDetails.infants || 0)
              )
            )
          : null;

  const versionedCandidate = await resolveVersionedCandidatePolicy(
    input.productCode.trim(),
    input.receiptId ?? null,
  );
  const viatorProductCode =
    input.viatorProductCode?.trim() ||
    versionedCandidate?.viatorProductCode ||
    null;
  const fareharborShortname =
    input.fareharborShortname?.trim() ||
    versionedCandidate?.fareharborShortname ||
    (input.provider === "fareharbor" ? input.providerAccount?.trim() ?? null : null);
  const fareharborItemId =
    input.fareharborItemId?.trim() || versionedCandidate?.fareharborItemId || null;

  const intendedDepartureId =
    input.intendedDepartureId?.trim() ||
    (input.intendedOption?.startsWith("dep-") ? input.intendedOption.trim() : null);
  const intendedDepartureTime =
    input.intendedDepartureTime?.trim() ||
    (input.intendedOption && /^\d{1,2}:\d{2}$/.test(input.intendedOption.trim())
      ? input.intendedOption.trim()
      : null);

  const handoffId = durableId ?? generateOpaqueHandoffId();
  const urlBuilt = buildProviderAffiliateHandoffUrl({
    originatingSite,
    provider: input.provider,
    providerAccount: input.providerAccount,
    viatorProductCode,
    fareharborShortname,
    fareharborItemId,
    productCode: input.productCode,
    productDestinationUrl: input.productDestinationUrl,
    handoffId,
    clickId: durableId && isQaTraffic ? generateOpaqueClickId({ isTest: true }) : input.clickId,
    campaign: input.campaign,
    receiptId: input.receiptId ?? null,
    intendedDate: input.intendedDate ?? null,
    intendedDepartureId,
    intendedDepartureTime,
    partySize,
    maxSinglePassengerWeightLbs: input.maxSinglePassengerWeightLbs ?? null,
    quotedPriceAmount: input.quotedPriceAmount ?? null,
  });

  const issueAttribution = () => issueOpaqueClickAttribution({
    clickId: urlBuilt.clickId,
    handoffId,
    decisionReceiptId: input.receiptId?.trim() || `rcpt:sha256:handoff_${handoffId}`,
    recommendedOperatorId:
      input.recommendedOperatorId?.trim() ||
      versionedCandidate?.candidateDccEntityId ||
      urlBuilt.providerAccount ||
      input.productCode,
    recommendedOperatorName:
      versionedCandidate?.operatorDisplayName ||
      input.productTitle ||
      urlBuilt.providerAccount,
    evidenceVersion:
      input.evidenceVersion?.trim() ||
      (versionedCandidate
        ? `${versionedCandidate.universeId}@${versionedCandidate.universeVersion}`
        : "dcc-evidence-bundle/2026.11.02"),
    originatingSite,
    originatingPage:
      typeof input.metadata?.originatingPage === "string"
        ? input.metadata.originatingPage
        : typeof input.metadata?.portSlug === "string"
          ? `/ports/${input.metadata.portSlug}`
          : undefined,
    surface:
      typeof input.metadata?.surface === "string"
        ? input.metadata.surface
        : originatingSite === "cruisepromenade.com"
          ? "cruisepromenade_port_day"
          : undefined,
    propertySlug:
      typeof input.metadata?.portSlug === "string"
        ? input.metadata.portSlug
        : undefined,
    provider: input.provider,
    productCode: input.productCode,
    productDestinationUrl: urlBuilt.outboundAffiliateUrl,
    isTest: isQaTraffic,
    ...(durableId ? { recordStage: "recommendation" as const } : {}),
  });
  const clickId = durableId ? urlBuilt.clickId : issueAttribution().clickId;

  let derivedTargetSite: string | null = input.targetSite
    ? normalizeOriginatingSite(input.targetSite)
    : null;
  if (!derivedTargetSite) {
    try {
      derivedTargetSite = new URL(input.productDestinationUrl).hostname
        .toLowerCase()
        .replace(/^www\./, "");
    } catch {
      derivedTargetSite = null;
    }
  }

  const quotedPricePerPerson =
    typeof input.quotedPriceAmount === "number"
      ? versionedCandidate?.basePriceUsd !== undefined &&
        partySize !== null &&
        partySize > 1 &&
        input.quotedPriceAmount >= versionedCandidate.basePriceUsd * partySize * 0.9
        ? Number((input.quotedPriceAmount / partySize).toFixed(2))
        : input.quotedPriceAmount
      : versionedCandidate?.basePriceUsd ?? null;
  const quotedTotalPrice =
    typeof input.quotedPriceAmount === "number" &&
    versionedCandidate?.basePriceUsd !== undefined &&
    partySize !== null &&
    partySize > 1 &&
    input.quotedPriceAmount >= versionedCandidate.basePriceUsd * partySize * 0.9
      ? input.quotedPriceAmount
      : quotedPricePerPerson !== null && partySize !== null
        ? Number((quotedPricePerPerson * partySize).toFixed(2))
        : quotedPricePerPerson;

  const yearMonthPath =
    input.intendedDate && /^\d{4}-\d{2}/.test(input.intendedDate)
      ? `calendar/${input.intendedDate.slice(0, 4)}/${input.intendedDate.slice(5, 7)}/`
      : "";

  const fareharborDirectEmbedUrl =
    fareharborShortname && fareharborItemId
      ? `https://fareharbor.com/embeds/book/${encodeURIComponent(fareharborShortname)}/items/${encodeURIComponent(fareharborItemId)}/${yearMonthPath}?${urlBuilt.providerAccount ? `asn=${encodeURIComponent(urlBuilt.providerAccount)}&` : ""}ref=${encodeURIComponent(urlBuilt.attributionParameterValue)}&full-items=yes`
      : null;

  const baseViatorTargetUrl =
    versionedCandidate?.viatorProductUrl ||
    versionedCandidate?.viatorSearchUrl ||
    (input.productDestinationUrl.includes("viator.com")
      ? input.productDestinationUrl
      : null);

  let viatorBookingUrl: string | null = null;
  if (baseViatorTargetUrl) {
    try {
      const vUrl = new URL(baseViatorTargetUrl);
      const pid =
        input.provider === "viator"
          ? urlBuilt.providerAccount
          : versionedCandidate?.viatorAffiliatePid || "P00058396";
      const mcid = versionedCandidate?.viatorAffiliateMcid || "42383";
      vUrl.searchParams.set("pid", pid);
      vUrl.searchParams.set("mcid", mcid);
      vUrl.searchParams.set("medium", "api");
      vUrl.searchParams.set("campaign", urlBuilt.attributionParameterValue);
      if (input.intendedDate?.trim()) {
        vUrl.searchParams.set("startDate", input.intendedDate.trim());
      }
      if (partySize !== null && partySize > 0) {
        vUrl.searchParams.set("numTravelers", String(partySize));
      }
      viatorBookingUrl = vUrl.toString();
    } catch {
      viatorBookingUrl = null;
    }
  }

  const viatorWorryFreeShoreExcursion: ViatorWorryFreeProtectionSummary | null =
    versionedCandidate &&
    (input.provider === "viator" || versionedCandidate.bookingProvider === "viator")
      ? versionedCandidate.viatorWorryFreeProtection
      : null;

  const passengerWeightsLbs = Array.isArray(input.passengerWeightsLbs)
    ? input.passengerWeightsLbs.filter((w) => typeof w === "number" && Number.isFinite(w))
    : null;

  const checkoutBookingBinding: CommercialCheckoutBookingBinding | null =
    viatorBookingUrl ||
    viatorProductCode ||
    fareharborShortname ||
    fareharborItemId ||
    intendedDepartureId ||
    intendedDepartureTime
      ? {
          bookingProvider: input.provider,
          viatorProductCode,
          viatorBookingUrl,
          viatorAffiliatePid:
            input.provider === "viator"
              ? urlBuilt.providerAccount
              : versionedCandidate?.viatorAffiliatePid ?? null,
          viatorAffiliateMcid: versionedCandidate?.viatorAffiliateMcid ?? "42383",
          viatorWorryFreeShoreExcursion,
          travelerReselectionRequirements: input.metadata?.portDayCheckoutSelection
            ? ["Select the saved date, option, departure time, and travelers on Viator."]
            : [...JUNEAU_VIATOR_RESELECTION_REQUIREMENTS],
          operatorSourceUrl: versionedCandidate?.operatorSourceUrl ?? null,
          operatorFaqUrl: versionedCandidate?.operatorFaqUrl ?? null,
          operatorShortname:
            fareharborShortname ||
            versionedCandidate?.operatorDisplayName ||
            urlBuilt.providerAccount,
          fareharborItemId,
          fareharborDirectEmbedUrl,
          specialistCheckoutUrl: urlBuilt.outboundAffiliateUrl,
          productCode: input.productCode,
          intendedDate: input.intendedDate ?? null,
          intendedDepartureId,
          intendedDepartureTime,
          partySize,
          passengerWeightsLbs,
          maxSinglePassengerWeightLbs: input.maxSinglePassengerWeightLbs ?? null,
          youngestPassengerAgeYears: input.youngestPassengerAgeYears ?? null,
          shipArrivalTime: input.shipArrivalTime ?? null,
          shipDepartureTime: input.shipDepartureTime ?? null,
          quotedPricePerPersonUsd: quotedPricePerPerson,
          quotedTotalPriceUsd: quotedTotalPrice,
        }
      : null;

  const approvedPartnerAttribution: ApprovedPartnerAttribution | null =
    input.approvedPartnerAttribution?.partnerId?.trim()
      ? {
          partnerId: input.approvedPartnerAttribution.partnerId.trim(),
          partnerName: input.approvedPartnerAttribution.partnerName ?? null,
          authScope: "referral_attribution_only",
          grantsLoginAccess: false,
          grantsReportingAccess: false,
          grantsPayoutAccess: false,
        }
      : null;

  const outcomeState = buildInitialHandoffOutcomeState(input.provider);

  const enrichedMetadata: Record<string, unknown> = {
    ...(input.metadata ?? {}),
    clickId,
    ...(rawIdempotencyKey ? { idempotencyKey: rawIdempotencyKey } : {}),
    ...(isQaTraffic ? { isQaTraffic: true } : {}),
    ...(derivedTargetSite ? { targetSite: derivedTargetSite } : {}),
    ...(viatorProductCode ? { viatorProductCode } : {}),
    ...(fareharborShortname ? { fareharborShortname } : {}),
    ...(fareharborItemId ? { fareharborItemId } : {}),
    ...(intendedDepartureId ? { intendedDepartureId } : {}),
    ...(intendedDepartureTime ? { intendedDepartureTime } : {}),
    ...(passengerWeightsLbs ? { passengerWeightsLbs } : {}),
    ...(typeof input.maxSinglePassengerWeightLbs === "number"
      ? { maxSinglePassengerWeightLbs: input.maxSinglePassengerWeightLbs }
      : {}),
    ...(typeof input.youngestPassengerAgeYears === "number"
      ? { youngestPassengerAgeYears: input.youngestPassengerAgeYears }
      : {}),
    ...(input.shipArrivalTime ? { shipArrivalTime: input.shipArrivalTime } : {}),
    ...(input.shipDepartureTime ? { shipDepartureTime: input.shipDepartureTime } : {}),
    ...(checkoutBookingBinding ? { checkoutBookingBinding } : {}),
    ...(approvedPartnerAttribution ? { approvedPartnerAttribution } : {}),
    outcomeState,
  };

  let createdAtIso = new Date().toISOString();
  const pool = getCommercePool();
  const hasDb = await ensureCommerceTables();
  if (durableId && (!pool || !hasDb)) throw new CommercialHandoffStorageError();

  if (pool && hasDb) {
    try {
      const res = await pool.query<{ created_at: Date | string }>(
        `
        INSERT INTO dcc_commercial_handoffs (
          handoff_id,
          originating_site,
          provider,
          provider_account,
          product_code,
          product_title,
          destination_url,
          outbound_affiliate_url,
          attribution_param_name,
          attribution_param_value,
          context_id,
          evaluation_run_id,
          receipt_id,
          intended_date,
          intended_option,
          party_size,
          party_details_json,
          quoted_price_amount,
          quoted_price_currency,
          caller_client_id,
          traceparent,
          metadata_json,
          created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17::jsonb, $18, $19, $20, $21, $22::jsonb, clock_timestamp()
        )
        ${durableId ? "ON CONFLICT (handoff_id) DO NOTHING" : ""}
        RETURNING created_at
        `,
        [
          handoffId,
          originatingSite,
          input.provider,
          urlBuilt.providerAccount,
          input.productCode,
          input.productTitle ?? null,
          input.productDestinationUrl,
          urlBuilt.outboundAffiliateUrl,
          urlBuilt.attributionParameterName,
          urlBuilt.attributionParameterValue,
          input.contextId ?? null,
          input.evaluationRunId ?? null,
          input.receiptId ?? null,
          input.intendedDate ?? null,
          input.intendedOption ?? intendedDepartureId ?? null,
          partySize,
          JSON.stringify(input.partyDetails ?? null),
          input.quotedPriceAmount ?? null,
          input.quotedPriceCurrency ?? null,
          callerClientId,
          input.traceparent ?? null,
          JSON.stringify(enrichedMetadata),
        ]
      );
      if (res.rows[0]?.created_at) {
        createdAtIso = new Date(res.rows[0].created_at).toISOString();
      } else if (durableId) {
        const existing = await getCommercialHandoffById(durableId, { durableOnly: true });
        if (!existing) throw new CommercialHandoffStorageError();
        return { ...existing, duplicateSubmission: true };
      }
    } catch {
      if (durableId) throw new CommercialHandoffStorageError();
      // Fallback to in-memory map if transient DB error occurs
    }
  }

  const record: CommercialHandoffRecord = {
    handoffId,
    clickId,
    originatingSite,
    targetSite: derivedTargetSite,
    provider: input.provider,
    providerAccount: urlBuilt.providerAccount,
    viatorProductCode,
    fareharborShortname,
    fareharborItemId,
    productCode: input.productCode,
    productTitle: input.productTitle ?? null,
    destinationUrl: input.productDestinationUrl,
    outboundAffiliateUrl: urlBuilt.outboundAffiliateUrl,
    attributionParameterName: urlBuilt.attributionParameterName,
    attributionParameterValue: urlBuilt.attributionParameterValue,
    contextId: input.contextId ?? null,
    evaluationRunId: input.evaluationRunId ?? null,
    receiptId: input.receiptId ?? null,
    intendedDate: input.intendedDate ?? null,
    intendedOption: input.intendedOption ?? intendedDepartureId ?? null,
    intendedDepartureId,
    intendedDepartureTime,
    partySize,
    partyDetails: input.partyDetails ?? null,
    passengerWeightsLbs,
    maxSinglePassengerWeightLbs: input.maxSinglePassengerWeightLbs ?? null,
    youngestPassengerAgeYears: input.youngestPassengerAgeYears ?? null,
    shipArrivalTime: input.shipArrivalTime ?? null,
    shipDepartureTime: input.shipDepartureTime ?? null,
    quotedPriceAmount: input.quotedPriceAmount ?? null,
    quotedPriceCurrency: input.quotedPriceCurrency ?? null,
    checkoutBookingBinding,
    approvedPartnerAttribution,
    outcomeState,
    callerClientId,
    traceparent: input.traceparent ?? null,
    dccBookingAdapterMode: "shadow_only_no_side_effects",
    requiresDecisionAuthorization: false,
    createdAt: createdAtIso,
    duplicateSubmission: false,
    metadata: enrichedMetadata,
  };

  memoryHandoffs.set(handoffId, record);
  if (durableId) issueAttribution();
  return record;
}

export async function countCommercialHandoffsByIdempotencyKey(params: {
  idempotencyKey: string;
  originatingSite?: string | null;
  callerClientId?: string | null;
}): Promise<{
  durableRecordCount: number;
  handoffIds: string[];
}> {
  const key = params.idempotencyKey.trim();
  if (!key) {
    return { durableRecordCount: 0, handoffIds: [] };
  }
  const orig = params.originatingSite
    ? normalizeOriginatingSite(params.originatingSite)
    : null;
  const client = params.callerClientId?.trim() || null;

  const ids = new Set<string>();
  for (const h of memoryHandoffs.values()) {
    if (h.metadata?.idempotencyKey === key) {
      if (!orig && !client) {
        ids.add(h.handoffId);
      } else if (
        (orig && h.originatingSite === orig) ||
        (client && h.callerClientId === client)
      ) {
        ids.add(h.handoffId);
      }
    }
  }

  const pool = getCommercePool();
  const hasDb = await ensureCommerceTables();
  if (pool && hasDb) {
    try {
      const res = await pool.query<{ handoff_id: string }>(
        orig && client
          ? `SELECT handoff_id FROM dcc_commercial_handoffs WHERE (originating_site = $1 OR caller_client_id = $2) AND metadata_json->>'idempotencyKey' = $3`
          : orig
            ? `SELECT handoff_id FROM dcc_commercial_handoffs WHERE originating_site = $1 AND metadata_json->>'idempotencyKey' = $2`
            : `SELECT handoff_id FROM dcc_commercial_handoffs WHERE metadata_json->>'idempotencyKey' = $1`,
        orig && client ? [orig, client, key] : orig ? [orig, key] : [key]
      );
      for (const r of res.rows) {
        if (r.handoff_id) ids.add(r.handoff_id);
      }
    } catch {
      // Non-fatal
    }
  }

  const handoffIds = Array.from(ids);
  return {
    durableRecordCount: handoffIds.length,
    handoffIds,
  };
}

export async function recordMachineFunnelEvent(input: {
  stage: MachineFunnelStage;
  originatingSite?: string | null;
  callerClientId?: string | null;
  portSlug?: string | null;
  productCode?: string | null;
  optionCode?: string | null;
  intendedDate?: string | null;
  departureTime?: string | null;
  partySize?: number | null;
  handoffId?: string | null;
  clickId?: string | null;
  idempotencyKey?: string | null;
  isQaTraffic?: boolean | null;
  simulateTimeout?: boolean | null;
  metadata?: Record<string, unknown> | null;
}): Promise<MachineFunnelEventRecord> {
  const originatingSite = normalizeOriginatingSite(
    input.originatingSite || "destinationcommandcenter.com"
  );
  const callerClientId = input.callerClientId?.trim() || "client:dcc_mcp_client";
  const idempotencyKey = input.idempotencyKey?.trim() || null;

  const isQa = isCommercialQaTraffic({
    isQaTraffic: input.isQaTraffic,
    simulateTimeout: input.simulateTimeout,
    idempotencyKey,
    callerClientId,
    handoffId: input.handoffId,
    clickId: input.clickId,
    metadata: input.metadata,
  });

  const eventId =
    input.stage === "checkout_handoff" && idempotencyKey
      ? `mf_chk_${crypto
          .createHash("sha256")
          .update(`${originatingSite}:${callerClientId}:${idempotencyKey}`)
          .digest("hex")
          .slice(0, 24)}`
      : `mf_${input.stage.slice(0, 3)}_${crypto.randomBytes(10).toString("hex")}`;

  const createdAt = new Date().toISOString();
  const record: MachineFunnelEventRecord = {
    eventId,
    stage: input.stage,
    originatingSite,
    callerClientId,
    portSlug: input.portSlug?.trim().toLowerCase() || null,
    productCode: input.productCode?.trim() || null,
    optionCode: input.optionCode?.trim() || null,
    intendedDate: input.intendedDate?.trim() || null,
    departureTime: input.departureTime?.trim() || null,
    partySize:
      typeof input.partySize === "number" && Number.isFinite(input.partySize)
        ? Math.max(1, Math.round(input.partySize))
        : null,
    handoffId: input.handoffId?.trim() || null,
    clickId: input.clickId?.trim() || null,
    idempotencyKey,
    isQaTraffic: isQa,
    metadata: input.metadata || {},
    createdAt,
  };

  memoryMachineFunnelEvents.set(eventId, record);

  const pool = getCommercePool();
  const hasDb = await ensureCommerceTables();
  if (pool && hasDb) {
    try {
      await pool.query(
        `
        INSERT INTO dcc_machine_funnel_events (
          event_id,
          stage,
          originating_site,
          caller_client_id,
          port_slug,
          product_code,
          option_code,
          intended_date,
          departure_time,
          party_size,
          handoff_id,
          click_id,
          idempotency_key,
          is_qa_traffic,
          metadata_json,
          created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, clock_timestamp()
        )
        ON CONFLICT (event_id) DO NOTHING
        `,
        [
          record.eventId,
          record.stage,
          record.originatingSite,
          record.callerClientId,
          record.portSlug,
          record.productCode,
          record.optionCode,
          record.intendedDate,
          record.departureTime,
          record.partySize,
          record.handoffId,
          record.clickId,
          record.idempotencyKey,
          record.isQaTraffic,
          JSON.stringify(record.metadata),
        ]
      );
    } catch {
      // Non-fatal
    }
  }

  return record;
}

export async function getCommercialHandoffById(
  handoffId: string,
  options?: { durableOnly?: boolean },
): Promise<CommercialHandoffRecord | null> {
  const normalized = handoffId.trim().toLowerCase();
  const mem = memoryHandoffs.get(normalized);
  if (mem && !options?.durableOnly) return mem;

  const pool = getCommercePool();
  const hasDb = await ensureCommerceTables();
  if (!pool || !hasDb) {
    if (options?.durableOnly) throw new CommercialHandoffStorageError();
    return null;
  }

  try {
    const res = await pool.query<{
      handoff_id: string;
      originating_site: string;
      provider: CommercialProvider;
      provider_account: string;
      product_code: string;
      product_title: string | null;
      destination_url: string;
      outbound_affiliate_url: string;
      attribution_param_name: string;
      attribution_param_value: string;
      context_id: string | null;
      evaluation_run_id: string | null;
      receipt_id: string | null;
      intended_date: string | null;
      intended_option: string | null;
      party_size: number | null;
      party_details_json: CommercialPartyDetails | null;
      quoted_price_amount: string | null;
      quoted_price_currency: string | null;
      caller_client_id: string;
      traceparent: string | null;
      metadata_json: Record<string, unknown> | null;
      created_at: Date | string;
    }>(
      `SELECT * FROM dcc_commercial_handoffs WHERE handoff_id = $1 LIMIT 1`,
      [normalized]
    );
    const row = res.rows[0];
    if (!row) return null;
    const meta = row.metadata_json ?? {};
    const targetSiteFromMeta =
      typeof meta.targetSite === "string" ? meta.targetSite : null;
    const partnerAttrFromMeta =
      meta.approvedPartnerAttribution &&
      typeof meta.approvedPartnerAttribution === "object"
        ? (meta.approvedPartnerAttribution as ApprovedPartnerAttribution)
        : null;
    const outcomeStateFromMeta =
      meta.outcomeState && typeof meta.outcomeState === "object"
        ? (meta.outcomeState as CommercialHandoffOutcomeState)
        : buildInitialHandoffOutcomeState(row.provider);
    const checkoutBindingFromMeta =
      meta.checkoutBookingBinding && typeof meta.checkoutBookingBinding === "object"
        ? (meta.checkoutBookingBinding as CommercialCheckoutBookingBinding)
        : null;

    const loaded: CommercialHandoffRecord = {
      handoffId: row.handoff_id,
      clickId:
        typeof meta.clickId === "string"
          ? meta.clickId
          : extractClickIdFromTrackingValue(row.outbound_affiliate_url) || `clk_${row.handoff_id.replace(/^hof_/, "")}`,
      originatingSite: row.originating_site,
      targetSite: targetSiteFromMeta,
      provider: row.provider,
      providerAccount: row.provider_account,
      viatorProductCode:
        typeof meta.viatorProductCode === "string" ? meta.viatorProductCode : null,
      fareharborShortname:
        typeof meta.fareharborShortname === "string" ? meta.fareharborShortname : null,
      fareharborItemId:
        typeof meta.fareharborItemId === "string" ? meta.fareharborItemId : null,
      productCode: row.product_code,
      productTitle: row.product_title,
      destinationUrl: row.destination_url,
      outboundAffiliateUrl: row.outbound_affiliate_url,
      attributionParameterName: row.attribution_param_name,
      attributionParameterValue: row.attribution_param_value,
      contextId: row.context_id,
      evaluationRunId: row.evaluation_run_id,
      receiptId: row.receipt_id,
      intendedDate: row.intended_date,
      intendedOption: row.intended_option,
      intendedDepartureId:
        typeof meta.intendedDepartureId === "string" ? meta.intendedDepartureId : null,
      intendedDepartureTime:
        typeof meta.intendedDepartureTime === "string" ? meta.intendedDepartureTime : null,
      partySize: row.party_size,
      partyDetails: row.party_details_json ?? null,
      passengerWeightsLbs: Array.isArray(meta.passengerWeightsLbs)
        ? (meta.passengerWeightsLbs as number[])
        : null,
      maxSinglePassengerWeightLbs:
        typeof meta.maxSinglePassengerWeightLbs === "number"
          ? meta.maxSinglePassengerWeightLbs
          : null,
      youngestPassengerAgeYears:
        typeof meta.youngestPassengerAgeYears === "number"
          ? meta.youngestPassengerAgeYears
          : null,
      shipArrivalTime:
        typeof meta.shipArrivalTime === "string" ? meta.shipArrivalTime : null,
      shipDepartureTime:
        typeof meta.shipDepartureTime === "string" ? meta.shipDepartureTime : null,
      quotedPriceAmount:
        row.quoted_price_amount !== null ? Number(row.quoted_price_amount) : null,
      quotedPriceCurrency: row.quoted_price_currency,
      checkoutBookingBinding: checkoutBindingFromMeta,
      approvedPartnerAttribution: partnerAttrFromMeta,
      outcomeState: outcomeStateFromMeta,
      callerClientId: row.caller_client_id,
      traceparent: row.traceparent,
      dccBookingAdapterMode: "shadow_only_no_side_effects",
      requiresDecisionAuthorization: false,
      createdAt: new Date(row.created_at).toISOString(),
      duplicateSubmission: false,
      metadata: meta,
    };
    memoryHandoffs.set(loaded.handoffId, loaded);
    return loaded;
  } catch {
    if (options?.durableOnly) throw new CommercialHandoffStorageError();
    return null;
  }
}

function buildReconciliationComparison(
  handoff: CommercialHandoffRecord | null,
  input: RecordCommercialOutcomeInput
): ReconciliationComparison {
  if (!handoff) {
    return {
      reconciled: false,
      missingOutcomeImpliesFailedBooking: false,
      matchedHandoffId: null,
      matchedEvaluationRunId: input.evaluationRunId ?? null,
      matchedReceiptId: input.receiptId ?? null,
      matchedContextId: input.contextId ?? null,
      dateComparison: {
        handoffOrEvaluated: null,
        bookedActual: input.bookedDate ?? null,
        matches: null,
      },
      productCodeComparison: {
        handoffOrEvaluated: null,
        bookedActual: input.bookedProductCode ?? null,
        matches: null,
      },
      partySizeComparison: {
        handoffOrEvaluated: null,
        bookedActual: input.bookedPartySize ?? null,
        matches: null,
      },
      priceComparison: {
        handoffOrEvaluated: null,
        bookedActual: input.bookingValueAmount ?? null,
        matches: null,
      },
    };
  }

  const intendedDate = handoff.intendedDate ?? null;
  const bookedDate = input.bookedDate ?? null;
  const dateMatches =
    intendedDate !== null && bookedDate !== null
      ? intendedDate.slice(0, 10) === bookedDate.slice(0, 10)
      : null;

  const intendedProduct = handoff.productCode ?? null;
  const bookedProduct = input.bookedProductCode ?? null;
  const productMatches =
    intendedProduct !== null && bookedProduct !== null
      ? intendedProduct.trim().toLowerCase() === bookedProduct.trim().toLowerCase()
      : null;

  const intendedPartySize = handoff.partySize ?? null;
  const bookedPartySize = input.bookedPartySize ?? null;
  const partyMatches =
    intendedPartySize !== null && bookedPartySize !== null
      ? intendedPartySize === bookedPartySize
      : null;

  const intendedPrice = handoff.quotedPriceAmount ?? null;
  const bookedPrice = input.bookingValueAmount ?? null;
  const priceMatches =
    intendedPrice !== null && bookedPrice !== null
      ? Math.abs(intendedPrice - bookedPrice) < 0.01
      : null;

  return {
    reconciled: true,
    missingOutcomeImpliesFailedBooking: false,
    matchedHandoffId: handoff.handoffId,
    matchedEvaluationRunId: handoff.evaluationRunId ?? input.evaluationRunId ?? null,
    matchedReceiptId: handoff.receiptId ?? input.receiptId ?? null,
    matchedContextId: handoff.contextId ?? input.contextId ?? null,
    dateComparison: {
      handoffOrEvaluated: intendedDate,
      bookedActual: bookedDate,
      matches: dateMatches,
    },
    productCodeComparison: {
      handoffOrEvaluated: intendedProduct,
      bookedActual: bookedProduct,
      matches: productMatches,
    },
    partySizeComparison: {
      handoffOrEvaluated: intendedPartySize,
      bookedActual: bookedPartySize,
      matches: partyMatches,
    },
    priceComparison: {
      handoffOrEvaluated: intendedPrice,
      bookedActual: bookedPrice,
      matches: priceMatches,
    },
  };
}

export function computeOutcomeDedupeKey(input: {
  provider: CommercialProvider;
  providerBookingRef: string;
  eventType: string;
  providerEventTime: string | null;
  bookingValueAmount?: number | null;
  paidCommissionAmount?: number | null;
}): string {
  const canonical = JSON.stringify({
    provider: input.provider,
    providerBookingRef: input.providerBookingRef.trim(),
    eventType: input.eventType.trim().toUpperCase(),
    providerEventTime: input.providerEventTime ?? null,
    bookingValueAmount: input.bookingValueAmount ?? null,
    paidCommissionAmount: input.paidCommissionAmount ?? null,
  });
  return `out_dedupe_${crypto.createHash("sha256").update(canonical).digest("hex").slice(0, 32)}`;
}

/**
 * Records a commercial outcome (from an authenticated reporter or provider poller).
 * - Rejects DCC internal artifacts (decision receipts, evaluation runs, context IDs, handoff IDs)
 *   submitted as `providerBookingRef` because a DCC decision receipt is NEVER provider confirmation.
 * - Deduplicates repeated deliveries of the same provider booking event.
 * - Preserves unmatched outcomes (`reconciliationStatus: "unmatched"`, `handoffId: null`).
 * - Compares actual booked details against evaluated/handoff details when reconciled.
 * - Keeps `bookingValue`, `estimatedCommission`, and `paidCommission` distinct.
 * - Never modifies rules or becomes an approved claim.
 */
export async function recordCommercialOutcome(
  input: RecordCommercialOutcomeInput
): Promise<CommercialOutcomeRecord> {
  const normalizedReporterClientId = (input.reporterClientId ?? "").trim().toLowerCase();
  if (
    normalizedReporterClientId.startsWith("partner:welcome-to-alaska:") ||
    normalizedReporterClientId === "welcome-to-alaska" ||
    normalizedReporterClientId === "welcometoalaskatours.com"
  ) {
    const err = new Error(
      `Welcome to Alaska Tours referral credential ('${input.reporterClientId}') is scoped strictly to referral attribution ('referral_attribution_only') and cannot confirm bookings or write commission settlement outcomes.`
    ) as Error & { code?: string; statusCode?: number };
    err.code = "WTA_REFERRAL_KEY_CANNOT_WRITE_OUTCOMES";
    err.statusCode = 403;
    throw err;
  }

  if (isDccInternalArtifactNotProviderConfirmation(input.providerBookingRef)) {
    const err = new Error(
      `A DCC decision receipt or internal artifact ('${input.providerBookingRef}') is not provider confirmation. Confirmed, cancelled, refunded, and fulfilled outcomes require an authenticated provider, payment, or authorized operational booking reference.`
    ) as Error & { code?: string; statusCode?: number };
    err.code = "DCC_RECEIPT_IS_NOT_PROVIDER_CONFIRMATION";
    err.statusCode = 422;
    throw err;
  }

  const resolvedClickId =
    extractClickIdFromTrackingValue(input.clickId) ||
    extractClickIdFromTrackingValue(input.campaignOrRefValue) ||
    extractClickIdFromTrackingValue(input.handoffId) ||
    null;

  const opaqueRecord = resolvedClickId
    ? getOpaqueClickAttributionById(resolvedClickId)
    : null;

  let resolvedHandoffId =
    extractHandoffIdFromTrackingValue(input.handoffId) ||
    extractHandoffIdFromTrackingValue(input.campaignOrRefValue) ||
    opaqueRecord?.handoffId ||
    null;

  if (!resolvedHandoffId && resolvedClickId) {
    for (const h of memoryHandoffs.values()) {
      if (h.clickId?.toLowerCase() === resolvedClickId.toLowerCase()) {
        resolvedHandoffId = h.handoffId;
        break;
      }
    }
    if (!resolvedHandoffId) {
      const poolLookup = getCommercePool();
      const hasDbLookup = await ensureCommerceTables();
      if (poolLookup && hasDbLookup) {
        try {
          const clkRes = await poolLookup.query<{ handoff_id: string }>(
            `SELECT handoff_id FROM dcc_commercial_handoffs WHERE LOWER(metadata_json->>'clickId') = $1 LIMIT 1`,
            [resolvedClickId.toLowerCase()]
          );
          if (clkRes.rows[0]?.handoff_id) {
            resolvedHandoffId = clkRes.rows[0].handoff_id;
          }
        } catch {
          // Non-fatal
        }
      }
    }
  }

  const isPilotProviderEvent = input.reporterProvenance === "viator_modified_since_poller" &&
    input.campaignOrRefValue?.startsWith("dcc_nola_tour__") === true;
  const candidateHandoff = resolvedHandoffId
    ? await getCommercialHandoffById(resolvedHandoffId, { durableOnly: isPilotProviderEvent })
    : null;
  const matchedHandoff = candidateHandoff?.metadata.portDayCheckoutSelection && (
    !isPilotProviderEvent || input.provider !== "viator" ||
    input.providerAccount !== candidateHandoff.providerAccount ||
    input.campaignOrRefValue !== candidateHandoff.attributionParameterValue
  ) ? null : candidateHandoff;

  const dedupeKey = computeOutcomeDedupeKey({
    provider: input.provider,
    providerBookingRef: input.providerBookingRef,
    eventType: input.eventType,
    providerEventTime: input.providerEventTime,
    bookingValueAmount: input.bookingValueAmount,
    paidCommissionAmount: input.paidCommissionAmount,
  });

  const existingMem = memoryOutcomesByDedupeKey.get(dedupeKey);
  if (existingMem) {
    return {
      ...existingMem,
      duplicateDelivery: true,
    };
  }

  const reconciliationComparison = buildReconciliationComparison(matchedHandoff, input);
  const reconciliationStatus: "matched" | "unmatched" = matchedHandoff
    ? "matched"
    : "unmatched";

  const providerAccount =
    input.providerAccount?.trim() ||
    matchedHandoff?.providerAccount ||
    (input.provider === "viator"
      ? process.env.NEXT_PUBLIC_VIATOR_PID || "P00058396"
      : input.provider === "getyourguide"
        ? process.env.NEXT_PUBLIC_GYG_PARTNER_ID || "F2MMUUH"
        : "default");

  const outcomeId = `out_${crypto.randomBytes(12).toString("hex")}`;
  let dccRecordedAt = new Date().toISOString();
  let duplicateDelivery = false;
  let finalOutcomeId = outcomeId;

  const pool = getCommercePool();
  const hasDb = await ensureCommerceTables();
  if (isPilotProviderEvent && (!pool || !hasDb)) throw new CommercialHandoffStorageError();

  if (pool && hasDb) {
    try {
      const insertRes = await pool.query<{
        outcome_id: string;
        dcc_recorded_at: Date | string;
      }>(
        `
        INSERT INTO dcc_commercial_outcomes (
          outcome_id,
          dedupe_key,
          reporter_client_id,
          reporter_provenance,
          provider,
          provider_account,
          provider_booking_ref,
          event_type,
          provider_event_time,
          dcc_recorded_at,
          handoff_id,
          evaluation_run_id,
          receipt_id,
          context_id,
          reconciliation_status,
          reconciliation_json,
          booked_product_code,
          booked_date,
          booked_option,
          booked_party_size,
          booking_value_amount,
          booking_value_currency,
          estimated_commission_amount,
          estimated_commission_currency,
          paid_commission_amount,
          paid_commission_currency,
          cancellation_reason,
          raw_payload_json,
          traceparent
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, clock_timestamp(),
          $10, $11, $12, $13, $14, $15::jsonb, $16, $17, $18, $19,
          $20, $21, $22, $23, $24, $25, $26, $27::jsonb, $28
        )
        ON CONFLICT (dedupe_key) DO NOTHING
        RETURNING outcome_id, dcc_recorded_at
        `,
        [
          outcomeId,
          dedupeKey,
          input.reporterClientId,
          input.reporterProvenance,
          input.provider,
          providerAccount,
          input.providerBookingRef,
          input.eventType,
          input.providerEventTime,
          matchedHandoff?.handoffId ?? null,
          reconciliationComparison.matchedEvaluationRunId,
          reconciliationComparison.matchedReceiptId,
          reconciliationComparison.matchedContextId,
          reconciliationStatus,
          JSON.stringify(reconciliationComparison),
          input.bookedProductCode ?? null,
          input.bookedDate ?? null,
          input.bookedOption ?? null,
          input.bookedPartySize ?? null,
          input.bookingValueAmount ?? null,
          input.bookingValueCurrency ?? null,
          input.estimatedCommissionAmount ?? null,
          input.estimatedCommissionCurrency ?? null,
          input.paidCommissionAmount ?? null,
          input.paidCommissionCurrency ?? null,
          input.cancellationReason ?? null,
          JSON.stringify(input.rawPayload ?? {}),
          input.traceparent ?? null,
        ]
      );

      if (insertRes.rowCount === 0) {
        duplicateDelivery = true;
        const existingRow = await pool.query<{
          outcome_id: string;
          dcc_recorded_at: Date | string;
        }>(
          `SELECT outcome_id, dcc_recorded_at FROM dcc_commercial_outcomes WHERE dedupe_key = $1 LIMIT 1`,
          [dedupeKey]
        );
        if (existingRow.rows[0]) {
          finalOutcomeId = existingRow.rows[0].outcome_id;
          dccRecordedAt = new Date(existingRow.rows[0].dcc_recorded_at).toISOString();
        }
      } else if (insertRes.rows[0]) {
        finalOutcomeId = insertRes.rows[0].outcome_id;
        dccRecordedAt = new Date(insertRes.rows[0].dcc_recorded_at).toISOString();
      }
    } catch {
      if (isPilotProviderEvent) throw new CommercialHandoffStorageError();
      // Fallback to in-memory
    }
  }

  const record: CommercialOutcomeRecord = {
    outcomeId: finalOutcomeId,
    dedupeKey,
    duplicateDelivery,
    reporterClientId: input.reporterClientId,
    reporterProvenance: input.reporterProvenance,
    provider: input.provider,
    providerAccount,
    providerBookingRef: input.providerBookingRef,
    eventType: input.eventType,
    providerEventTime: input.providerEventTime,
    dccRecordedAt,
    handoffId: matchedHandoff?.handoffId ?? null,
    evaluationRunId: reconciliationComparison.matchedEvaluationRunId,
    receiptId: reconciliationComparison.matchedReceiptId,
    contextId: reconciliationComparison.matchedContextId,
    reconciliationStatus,
    reconciliationComparison,
    bookedProductCode: input.bookedProductCode ?? null,
    bookedDate: input.bookedDate ?? null,
    bookedOption: input.bookedOption ?? null,
    bookedPartySize: input.bookedPartySize ?? null,
    bookingValue: {
      amount: input.bookingValueAmount ?? null,
      currency:
        input.bookingValueAmount !== null && input.bookingValueAmount !== undefined
          ? input.bookingValueCurrency || "USD"
          : input.bookingValueCurrency ?? null,
    },
    estimatedCommission: {
      amount: input.estimatedCommissionAmount ?? null,
      currency:
        input.estimatedCommissionAmount !== null &&
        input.estimatedCommissionAmount !== undefined
          ? input.estimatedCommissionCurrency || "USD"
          : input.estimatedCommissionCurrency ?? null,
    },
    paidCommission: {
      amount: input.paidCommissionAmount ?? null,
      currency:
        input.paidCommissionAmount !== null && input.paidCommissionAmount !== undefined
          ? input.paidCommissionCurrency || "USD"
          : input.paidCommissionCurrency ?? null,
    },
    cancellationReason: input.cancellationReason ?? null,
    altersPublishedEvidenceOrRules: false,
    approvedClaimStatus: "not_a_claim_outcome_only",
    traceparent: input.traceparent ?? null,
  };

  if (matchedHandoff) {
    const nextOutcomeState = deriveHandoffOutcomeStateFromOutcome(
      matchedHandoff.provider,
      record
    );
    const updatedHandoff: CommercialHandoffRecord = {
      ...matchedHandoff,
      outcomeState: nextOutcomeState,
      metadata: {
        ...matchedHandoff.metadata,
        outcomeState: nextOutcomeState,
      },
    };
    memoryHandoffs.set(matchedHandoff.handoffId, updatedHandoff);

    if (pool && hasDb) {
      try {
        await pool.query(
          `UPDATE dcc_commercial_handoffs
           SET metadata_json = jsonb_set(COALESCE(metadata_json, '{}'::jsonb), '{outcomeState}', $2::jsonb, true)
           WHERE handoff_id = $1`,
          [matchedHandoff.handoffId, JSON.stringify(nextOutcomeState)]
        );
      } catch {
        if (isPilotProviderEvent) throw new CommercialHandoffStorageError();
        // Non-fatal
      }
    }
  }

  memoryOutcomesByDedupeKey.set(dedupeKey, { ...record, duplicateDelivery: false });
  memoryOutcomesById.set(record.outcomeId, { ...record, duplicateDelivery: false });
  return record;
}

export async function getPollerCheckpoint(
  pollerId: string
): Promise<PollerCheckpointRecord | null> {
  const pool = getCommercePool();
  const hasDb = await ensureCommerceTables();
  if (pool && hasDb) {
    try {
      const res = await pool.query<{
        poller_id: string;
        provider: CommercialProvider;
        provider_account: string;
        cursor_value: string | null;
        last_polled_at: Date | string;
        last_ingested_count: number;
        last_deduplicated_count: number;
        locked_by: string | null;
        locked_until: Date | string | null;
        updated_at: Date | string;
      }>(
        `SELECT * FROM dcc_commercial_poller_checkpoints WHERE poller_id = $1 LIMIT 1`,
        [pollerId]
      );
      const row = res.rows[0];
      if (row) {
        const loaded: PollerCheckpointRecord = {
          pollerId: row.poller_id,
          provider: row.provider,
          providerAccount: row.provider_account,
          cursorValue: row.cursor_value,
          lastPolledAt: new Date(row.last_polled_at).toISOString(),
          lastIngestedCount: row.last_ingested_count,
          lastDeduplicatedCount: row.last_deduplicated_count,
          lockedBy: row.locked_by,
          lockedUntil: row.locked_until ? new Date(row.locked_until).toISOString() : null,
          updatedAt: new Date(row.updated_at).toISOString(),
        };
        memoryCheckpoints.set(pollerId, loaded);
        return loaded;
      }
    } catch {
      // Fallback to in-memory
    }
  }
  return memoryCheckpoints.get(pollerId) ?? null;
}

/**
 * Acquires an atomic poller lease so overlapping pollers cannot double-process
 * or overwrite cursor checkpoints.
 */
async function acquirePollerLease(params: {
  pollerId: string;
  provider: CommercialProvider;
  providerAccount: string;
  holderId: string;
  leaseDurationMs: number;
}): Promise<{ acquired: boolean; currentCursor: string | null }> {
  const nowMs = Date.now();
  const memLease = memoryActiveLeases.get(params.pollerId);
  if (memLease && memLease.expiresAtMs > nowMs && memLease.holderId !== params.holderId) {
    const existing = memoryCheckpoints.get(params.pollerId);
    return { acquired: false, currentCursor: existing?.cursorValue ?? null };
  }

  const pool = getCommercePool();
  const hasDb = await ensureCommerceTables();
  if (pool && hasDb) {
    try {
      const leaseSeconds = Math.max(5, Math.ceil(params.leaseDurationMs / 1000));
      const res = await pool.query<{ cursor_value: string | null; locked_by: string }>(
        `
        INSERT INTO dcc_commercial_poller_checkpoints (
          poller_id,
          provider,
          provider_account,
          cursor_value,
          locked_by,
          locked_until,
          updated_at
        ) VALUES (
          $1, $2, $3, NULL, $4, clock_timestamp() + ($5 || ' seconds')::interval, clock_timestamp()
        )
        ON CONFLICT (poller_id) DO UPDATE
          SET locked_by = EXCLUDED.locked_by,
              locked_until = EXCLUDED.locked_until,
              updated_at = clock_timestamp()
          WHERE dcc_commercial_poller_checkpoints.locked_until IS NULL
             OR dcc_commercial_poller_checkpoints.locked_until < clock_timestamp()
             OR dcc_commercial_poller_checkpoints.locked_by = EXCLUDED.locked_by
        RETURNING cursor_value, locked_by
        `,
        [
          params.pollerId,
          params.provider,
          params.providerAccount,
          params.holderId,
          String(leaseSeconds),
        ]
      );
      if (res.rowCount === 0) {
        const cur = await getPollerCheckpoint(params.pollerId);
        return { acquired: false, currentCursor: cur?.cursorValue ?? null };
      }
      memoryActiveLeases.set(params.pollerId, {
        holderId: params.holderId,
        expiresAtMs: nowMs + params.leaseDurationMs,
      });
      return {
        acquired: true,
        currentCursor: res.rows[0]?.cursor_value ?? null,
      };
    } catch {
      // Fallback to in-memory lease
    }
  }

  memoryActiveLeases.set(params.pollerId, {
    holderId: params.holderId,
    expiresAtMs: nowMs + params.leaseDurationMs,
  });
  const cur = memoryCheckpoints.get(params.pollerId);
  return { acquired: true, currentCursor: cur?.cursorValue ?? null };
}

async function releaseOrCommitPollerCheckpoint(params: {
  pollerId: string;
  provider: CommercialProvider;
  providerAccount: string;
  holderId: string;
  nextCursor: string | null;
  ingestedCount: number;
  deduplicatedCount: number;
}): Promise<PollerCheckpointRecord> {
  const nowIso = new Date().toISOString();
  const pool = getCommercePool();
  const hasDb = await ensureCommerceTables();

  if (pool && hasDb) {
    try {
      const res = await pool.query<{
        cursor_value: string | null;
        last_polled_at: Date | string;
        updated_at: Date | string;
      }>(
        `
        UPDATE dcc_commercial_poller_checkpoints
        SET cursor_value = COALESCE($2, cursor_value),
            last_polled_at = clock_timestamp(),
            last_ingested_count = $3,
            last_deduplicated_count = $4,
            locked_by = NULL,
            locked_until = NULL,
            updated_at = clock_timestamp()
        WHERE poller_id = $1
        RETURNING cursor_value, last_polled_at, updated_at
        `,
        [
          params.pollerId,
          params.nextCursor,
          params.ingestedCount,
          params.deduplicatedCount,
        ]
      );
      const row = res.rows[0];
      if (row) {
        const committed: PollerCheckpointRecord = {
          pollerId: params.pollerId,
          provider: params.provider,
          providerAccount: params.providerAccount,
          cursorValue: row.cursor_value,
          lastPolledAt: new Date(row.last_polled_at).toISOString(),
          lastIngestedCount: params.ingestedCount,
          lastDeduplicatedCount: params.deduplicatedCount,
          lockedBy: null,
          lockedUntil: null,
          updatedAt: new Date(row.updated_at).toISOString(),
        };
        memoryCheckpoints.set(params.pollerId, committed);
        memoryActiveLeases.delete(params.pollerId);
        return committed;
      }
    } catch {
      // Fallback to in-memory
    }
  }

  const prev = memoryCheckpoints.get(params.pollerId);
  const committed: PollerCheckpointRecord = {
    pollerId: params.pollerId,
    provider: params.provider,
    providerAccount: params.providerAccount,
    cursorValue: params.nextCursor ?? prev?.cursorValue ?? null,
    lastPolledAt: nowIso,
    lastIngestedCount: params.ingestedCount,
    lastDeduplicatedCount: params.deduplicatedCount,
    lockedBy: null,
    lockedUntil: null,
    updatedAt: nowIso,
  };
  memoryCheckpoints.set(params.pollerId, committed);
  memoryActiveLeases.delete(params.pollerId);
  return committed;
}

export interface ViatorBookingModifiedEventItem {
  bookingRef?: string;
  transactionRef?: string;
  eventType?: string;
  status?: string;
  lastUpdated?: string;
  createdAt?: string;
  travelDate?: string;
  productCode?: string;
  tourGradeCode?: string;
  campaignValue?: string;
  campaign?: string;
  partnerBookingRef?: string;
  handoffId?: string;
  bookedItem?: {
    productCode?: string;
    productOptionCode?: string;
    travelDate?: string;
  };
  partySize?: number;
  travelerCount?: number;
  currency?: string;
  bookingValue?: number | null;
  totalPrice?: number | null;
  estimatedCommission?: number | null;
  paidCommission?: number | null;
  cancellationReason?: string | null;
  [key: string]: unknown;
}

/**
 * Polls Viator `/bookings/modified-since` following the official Viator Booking Reporting Guide:
 * - Works with `full_access` (Full Access without Booking) as well as `booking_access` and `merchant`.
 * - Acquires an exclusive poller lease so overlapping pollers cannot lose updates or double-advance.
 * - Persists the provider's exact pagination cursor durably along with ingested page events.
 * - Deduplicates repeated deliveries and preserves unmatched outcomes.
 */
export async function pollViatorModifiedSinceWithCheckpoint(options?: {
  pollerId?: string;
  providerAccount?: string;
  overrideCursor?: string | null;
  leaseDurationMs?: number;
  simulatedLeaseConflictHolderId?: string;
  customFetchPage?: (args: {
    cursor?: string;
    modifiedSince?: string;
  }) => Promise<Record<string, unknown>>;
}): Promise<ViatorPollerRunResult> {
  const capabilities = getViatorAccessCapabilities();
  const pollerId = options?.pollerId || "viator_modified_since_primary";
  const providerAccount =
    options?.providerAccount || getViatorPublicConfig().pid;
  const holderId = `poller_${crypto.randomBytes(6).toString("hex")}`;
  const leaseDurationMs = options?.leaseDurationMs ?? 30_000;

  if (!capabilities.canUseBookingReporting) {
    throw new Error(
      `Viator booking reporting requires full_access, booking_access, or merchant tier (current tier: ${capabilities.accessTier}).`
    );
  }

  const lease = await acquirePollerLease({
    pollerId,
    provider: "viator",
    providerAccount,
    holderId,
    leaseDurationMs,
  });

  if (!lease.acquired) {
    return {
      pollerId,
      provider: "viator",
      providerAccount,
      accessTier: capabilities.accessTier,
      canUseBookingReporting: capabilities.canUseBookingReporting,
      skippedDueToActiveLease: true,
      previousCursor: lease.currentCursor,
      nextCursor: lease.currentCursor,
      cursorAdvanced: false,
      fetchedCount: 0,
      ingestedCount: 0,
      deduplicatedCount: 0,
      matchedCount: 0,
      unmatchedCount: 0,
      outcomes: [],
      recordedAt: new Date().toISOString(),
    };
  }

  const startingCursor =
    options?.overrideCursor !== undefined ? options.overrideCursor : lease.currentCursor;

  try {
    const rawResponse = (options?.customFetchPage
      ? await options.customFetchPage({
          cursor: startingCursor ?? undefined,
        })
      : await getViatorClient().getBookingsModifiedSince({
          cursor: startingCursor ?? undefined,
        })) as Record<string, unknown>;

    const rawItems = Array.isArray(rawResponse?.bookings)
      ? (rawResponse.bookings as ViatorBookingModifiedEventItem[])
      : Array.isArray(rawResponse?.events)
        ? (rawResponse.events as ViatorBookingModifiedEventItem[])
        : Array.isArray(rawResponse?.items)
          ? (rawResponse.items as ViatorBookingModifiedEventItem[])
          : [];

    const nextCursor =
      typeof rawResponse?.nextCursor === "string" && rawResponse.nextCursor.trim().length > 0
        ? rawResponse.nextCursor.trim()
        : typeof rawResponse?.cursor === "string" && rawResponse.cursor.trim().length > 0
          ? rawResponse.cursor.trim()
          : startingCursor;

    const outcomes: CommercialOutcomeRecord[] = [];
    let ingestedCount = 0;
    let deduplicatedCount = 0;
    let matchedCount = 0;
    let unmatchedCount = 0;

    for (const item of rawItems) {
      const bookingRef = String(item.bookingRef || item.transactionRef || "").trim();
      const eventType = String(item.eventType || item.status || "").trim().toUpperCase();
      if (!bookingRef || !eventType) continue;
      const providerEventTime =
        typeof item.lastUpdated === "string"
          ? item.lastUpdated
          : typeof item.createdAt === "string"
            ? item.createdAt
            : null;

      const campaignValue =
        [
          item.campaignValue,
          (item as Record<string, unknown>)["campaign-value"],
          item.campaign,
          item.partnerBookingRef,
          (item.bookedItem as Record<string, unknown> | undefined)?.campaignValue,
        ]
          .find((value): value is string => typeof value === "string" && Boolean(value.trim()))
          ?.trim() ?? null;

      const currency = typeof item.currency === "string" ? item.currency : "USD";
      const bookingValueAmount =
        typeof item.bookingValue === "number"
          ? item.bookingValue
          : typeof item.totalPrice === "number"
            ? item.totalPrice
            : null;
      const estimatedCommissionAmount =
        typeof item.estimatedCommission === "number" ? item.estimatedCommission : null;
      const paidCommissionAmount =
        typeof item.paidCommission === "number" ? item.paidCommission : null;

      const outcome = await recordCommercialOutcome({
        reporterClientId: "viator_modified_since_poller",
        reporterProvenance: "viator_modified_since_poller",
        provider: "viator",
        providerAccount,
        providerBookingRef: bookingRef,
        eventType,
        providerEventTime,
        handoffId: typeof item.handoffId === "string" ? item.handoffId : null,
        campaignOrRefValue: campaignValue,
        bookedProductCode: item.bookedItem?.productCode ?? item.productCode ?? null,
        bookedDate: item.bookedItem?.travelDate ?? item.travelDate ?? null,
        bookedOption: item.bookedItem?.productOptionCode ?? item.tourGradeCode ?? null,
        bookedPartySize:
          typeof item.partySize === "number"
            ? item.partySize
            : typeof item.travelerCount === "number"
              ? item.travelerCount
              : null,
        bookingValueAmount,
        bookingValueCurrency: bookingValueAmount !== null ? currency : null,
        estimatedCommissionAmount,
        estimatedCommissionCurrency: estimatedCommissionAmount !== null ? currency : null,
        paidCommissionAmount,
        paidCommissionCurrency: paidCommissionAmount !== null ? currency : null,
        cancellationReason:
          typeof item.cancellationReason === "string" ? item.cancellationReason : null,
        rawPayload: item as Record<string, unknown>,
      });

      outcomes.push(outcome);
      if (outcome.duplicateDelivery) {
        deduplicatedCount += 1;
      } else {
        ingestedCount += 1;
      }
      if (outcome.reconciliationStatus === "matched") {
        matchedCount += 1;
      } else {
        unmatchedCount += 1;
      }
    }

    const committedCheckpoint = await releaseOrCommitPollerCheckpoint({
      pollerId,
      provider: "viator",
      providerAccount,
      holderId,
      nextCursor: nextCursor ?? startingCursor ?? null,
      ingestedCount,
      deduplicatedCount,
    });

    return {
      pollerId,
      provider: "viator",
      providerAccount,
      accessTier: capabilities.accessTier,
      canUseBookingReporting: capabilities.canUseBookingReporting,
      skippedDueToActiveLease: false,
      previousCursor: startingCursor ?? null,
      nextCursor: committedCheckpoint.cursorValue,
      cursorAdvanced: committedCheckpoint.cursorValue !== (startingCursor ?? null),
      fetchedCount: rawItems.length,
      ingestedCount,
      deduplicatedCount,
      matchedCount,
      unmatchedCount,
      outcomes,
      recordedAt: committedCheckpoint.updatedAt,
    };
  } catch (err) {
    // Release lease WITHOUT advancing the cursor if ingestion failed
    await releaseOrCommitPollerCheckpoint({
      pollerId,
      provider: "viator",
      providerAccount,
      holderId,
      nextCursor: startingCursor ?? null,
      ingestedCount: 0,
      deduplicatedCount: 0,
    });
    throw err;
  }
}

/**
 * Dedicated GetYourGuide outcome reporting adapter.
 * Keeps GetYourGuide behind its own supported reporting adapter and never mixes
 * GYG events into Viator checkpoints.
 */
export async function reportGetYourGuideOutcomeAdapter(input: {
  reporterClientId: string;
  gygBookingReference: string;
  eventType: "BOOKING_CONFIRMED" | "BOOKING_CANCELLED" | string;
  providerEventTime: string | null;
  cmpParameterValue?: string | null;
  handoffId?: string | null;
  bookedTourCode?: string | null;
  bookedDate?: string | null;
  bookedParticipants?: number | null;
  bookingValueAmount?: number | null;
  bookingValueCurrency?: string | null;
  estimatedCommissionAmount?: number | null;
  paidCommissionAmount?: number | null;
  rawPayload?: Record<string, unknown> | null;
}): Promise<CommercialOutcomeRecord> {
  return recordCommercialOutcome({
    reporterClientId: input.reporterClientId,
    reporterProvenance: "getyourguide_partner_adapter",
    provider: "getyourguide",
    providerAccount: process.env.NEXT_PUBLIC_GYG_PARTNER_ID || "F2MMUUH",
    providerBookingRef: input.gygBookingReference,
    eventType: input.eventType,
    providerEventTime: input.providerEventTime,
    handoffId: input.handoffId ?? null,
    campaignOrRefValue: input.cmpParameterValue ?? null,
    bookedProductCode: input.bookedTourCode ?? null,
    bookedDate: input.bookedDate ?? null,
    bookedPartySize: input.bookedParticipants ?? null,
    bookingValueAmount: input.bookingValueAmount ?? null,
    bookingValueCurrency: input.bookingValueCurrency ?? null,
    estimatedCommissionAmount: input.estimatedCommissionAmount ?? null,
    estimatedCommissionCurrency: input.bookingValueCurrency ?? null,
    paidCommissionAmount: input.paidCommissionAmount ?? null,
    paidCommissionCurrency: input.bookingValueCurrency ?? null,
    rawPayload: input.rawPayload ?? null,
  });
}

export async function listCommercialOutcomes(options?: {
  handoffId?: string;
  receiptId?: string;
  provider?: CommercialProvider;
  excludeQa?: boolean;
  limit?: number;
}): Promise<CommercialOutcomeRecord[]> {
  const limit = Math.min(Math.max(1, options?.limit ?? 25), 100);
  const pool = getCommercePool();
  const hasDb = await ensureCommerceTables();

  if (pool && hasDb) {
    try {
      const clauses: string[] = [];
      const values: unknown[] = [];
      if (options?.excludeQa) {
        clauses.push(`NOT EXISTS (
          SELECT 1 FROM dcc_commercial_handoffs h
          WHERE h.handoff_id = dcc_commercial_outcomes.handoff_id
            AND h.metadata_json @> '{"isQaTraffic":true}'::jsonb
        )`);
      }
      if (options?.handoffId) {
        values.push(options.handoffId);
        clauses.push(`handoff_id = $${values.length}`);
      }
      if (options?.receiptId) {
        values.push(options.receiptId);
        clauses.push(`receipt_id = $${values.length}`);
      }
      if (options?.provider) {
        values.push(options.provider);
        clauses.push(`provider = $${values.length}`);
      }
      values.push(limit);
      const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
      const res = await pool.query<{
        outcome_id: string;
        dedupe_key: string;
        reporter_client_id: string;
        reporter_provenance: string;
        provider: CommercialProvider;
        provider_account: string;
        provider_booking_ref: string;
        event_type: string;
        provider_event_time: string | null;
        dcc_recorded_at: Date | string;
        handoff_id: string | null;
        evaluation_run_id: string | null;
        receipt_id: string | null;
        context_id: string | null;
        reconciliation_status: "matched" | "unmatched";
        reconciliation_json: CommercialOutcomeRecord["reconciliationComparison"] | null;
        booked_product_code: string | null;
        booked_date: string | null;
        booked_option: string | null;
        booked_party_size: number | null;
        booking_value_amount: string | number | null;
        booking_value_currency: string | null;
        estimated_commission_amount: string | number | null;
        estimated_commission_currency: string | null;
        paid_commission_amount: string | number | null;
        paid_commission_currency: string | null;
        cancellation_reason: string | null;
        traceparent: string | null;
      }>(
        `SELECT * FROM dcc_commercial_outcomes ${whereSql} ORDER BY dcc_recorded_at ASC LIMIT $${values.length}`,
        values
      );

      for (const row of res.rows) {
        const bookingVal =
          row.booking_value_amount !== null && row.booking_value_amount !== undefined
            ? Number(row.booking_value_amount)
            : null;
        const estCommVal =
          row.estimated_commission_amount !== null &&
          row.estimated_commission_amount !== undefined
            ? Number(row.estimated_commission_amount)
            : null;
        const paidCommVal =
          row.paid_commission_amount !== null && row.paid_commission_amount !== undefined
            ? Number(row.paid_commission_amount)
            : null;

        const hydrated: CommercialOutcomeRecord = {
          outcomeId: row.outcome_id,
          dedupeKey: row.dedupe_key,
          duplicateDelivery: false,
          reporterClientId: row.reporter_client_id,
          reporterProvenance: row.reporter_provenance,
          provider: row.provider,
          providerAccount: row.provider_account,
          providerBookingRef: row.provider_booking_ref,
          eventType: row.event_type,
          providerEventTime: row.provider_event_time,
          dccRecordedAt: new Date(row.dcc_recorded_at).toISOString(),
          handoffId: row.handoff_id,
          evaluationRunId: row.evaluation_run_id,
          receiptId: row.receipt_id,
          contextId: row.context_id,
          reconciliationStatus: row.reconciliation_status,
          reconciliationComparison:
            row.reconciliation_json ??
            buildReconciliationComparison(null, {
              reporterClientId: row.reporter_client_id,
              reporterProvenance: row.reporter_provenance,
              provider: row.provider,
              providerBookingRef: row.provider_booking_ref,
              eventType: row.event_type,
              providerEventTime: row.provider_event_time,
            }),
          bookedProductCode: row.booked_product_code,
          bookedDate: row.booked_date,
          bookedOption: row.booked_option,
          bookedPartySize:
            row.booked_party_size !== null && row.booked_party_size !== undefined
              ? Number(row.booked_party_size)
              : null,
          bookingValue: {
            amount: Number.isFinite(bookingVal) ? bookingVal : null,
            currency: row.booking_value_currency,
          },
          estimatedCommission: {
            amount: Number.isFinite(estCommVal) ? estCommVal : null,
            currency: row.estimated_commission_currency,
          },
          paidCommission: {
            amount: Number.isFinite(paidCommVal) ? paidCommVal : null,
            currency: row.paid_commission_currency,
          },
          cancellationReason: row.cancellation_reason,
          altersPublishedEvidenceOrRules: false,
          approvedClaimStatus: "not_a_claim_outcome_only",
          traceparent: row.traceparent,
        };
        memoryOutcomesById.set(hydrated.outcomeId, hydrated);
        memoryOutcomesByDedupeKey.set(hydrated.dedupeKey, hydrated);
      }
    } catch {
      // Fallback to in-memory
    }
  }

  const allMem = Array.from(memoryOutcomesById.values());
  const filtered: CommercialOutcomeRecord[] = [];
  for (const item of allMem) {
    if (options?.handoffId && item.handoffId !== options.handoffId) continue;
    if (options?.receiptId && item.receiptId !== options.receiptId) continue;
    if (options?.provider && item.provider !== options.provider) continue;
    if (options?.excludeQa && item.handoffId) {
      const handoff = await getCommercialHandoffById(item.handoffId);
      if (handoff?.metadata.isQaTraffic === true) continue;
    }
    filtered.push(item);
  }
  filtered.sort((a, b) => a.dccRecordedAt.localeCompare(b.dccRecordedAt));
  return filtered.slice(0, limit);
}

export interface RevalidateCommercialHandoffInput {
  handoffId: string;
  receiptEvaluatedPartySize?: number | null;
  receiptEvaluatedDate?: string | null;
  requestedPartySize?: number | null;
  requestedDate?: string | null;
  requestedDepartureId?: string | null;
  requestedDepartureTime?: string | null;
  requestedFareharborItemId?: string | null;
  requestedViatorProductCode?: string | null;
  requestedTourCode?: string | null;
  requestedReceiptId?: string | null;
  passengerWeightsLbs?: number[] | null;
  declaredMaxSinglePassengerWeightLbs?: number | null;
  declaredYoungestPassengerAgeYears?: number | null;
  hasLapChildUnder2?: boolean | null;
  requiresAssistedAircraftBoarding?: boolean | null;
  canWalkUnassistedOneHourUnevenTerrain?: boolean | null;
  carryingDrone?: boolean | null;
  carryingSelfieStickOrExtension?: boolean | null;
  carryingBagsOrPursesOnFlight?: boolean | null;
  hasServiceAnimal?: boolean | null;
  shipArrivalTime?: string | null;
  shipDepartureTime?: string | null;
  travelerAcceptedWeightSurcharge?: boolean | null;
  ignoredUntrustedOperatorFactFields?: string[];
}

export interface CommercialHandoffRevalidationResult {
  handoffId: string;
  receiptId: string | null;
  receiptVerified: boolean;
  bookingProvider: CommercialProvider;
  productCode: string;
  viatorProductCode: string | null;
  viatorBookingUrl: string | null;
  viatorDirectProductUrl: string | null;
  viatorWorryFreeShoreExcursion: ViatorWorryFreeProtectionSummary | null;
  travelerReselectionRequirements: readonly string[] | null;
  fareharborShortname: string | null;
  fareharborItemId: string | null;
  fareharborDirectEmbedUrl: string | null;
  intendedDate: string | null;
  intendedDepartureId: string | null;
  intendedDepartureTime: string | null;
  partySize: number | null;
  publishedGroupTotalConfirmed: boolean;
  passengersIncurringWeightSurchargeCount: number;
  requiredWeightSurchargeUsd: number;
  publishedPolicyRequiredTotalUsd: number | null;
  progressionAllowed: boolean;
  revalidationStatus: "passed" | "blocked";
  blockingReasons: string[];
  ignoredUntrustedOperatorFactFields: string[];
  versionedPolicySource: {
    universeId: string | null;
    universeVersion: string | null;
    universeHash: string | null;
    candidateDccEntityId: string | null;
    legacyCandidateCode: string | null;
    weightPolicyType: string | null;
    requiredClaimIds: readonly string[];
  };
  providerConfirmation: {
    status:
      | "unknown_until_authenticated_provider_response"
      | "confirmed_by_authenticated_provider_response";
    liveAvailabilityStatus: "unknown" | "confirmed";
    liveAvailableSeats: null;
    liveOperatorPricePerPersonUsd: null;
    authenticatedOutcomeId: string | null;
    requiresProviderConfirmationAtCheckout: boolean;
    explanation: string;
  };
  checks: {
    bindingConsistency: {
      passed: boolean;
      receiptVerified: boolean;
      reasons: string[];
    };
    priceAndSurcharge: {
      passed: boolean;
      quotedPerPersonUsd: number | null;
      quotedTotalUsd: number | null;
      publishedBasePerPersonUsd: number | null;
      passengerWeightsLbs: number[] | null;
      publishedGroupTotalConfirmed: boolean;
      requiredWeightSurchargeUsd: number;
      publishedPolicyRequiredTotalUsd: number | null;
      liveOperatorPricePerPersonUsd: null;
      reasons: string[];
    };
    availabilityAndSchedule: {
      passed: boolean;
      liveDepartureAvailability: "unknown" | "confirmed";
      liveAvailableSeats: null;
      requiredPartySize: number | null;
      operatingSeasonMonthsUtc: number[];
      shipArrivalTime: string | null;
      shipDepartureTime: string | null;
      minPortWindowMinutes: number | null;
      actualPortWindowMinutes: number | null;
      earliestAllowedDepartureMinutes: number | null;
      latestAllowedReturnMinutes: number | null;
      estimatedReturnMinutes: number | null;
      reasons: string[];
    };
    passengerConstraints: {
      passed: boolean;
      maxSinglePassengerWeightLbs: number | null;
      weightPolicyType: string | null;
      youngestPassengerAgeYears: number | null;
      operatorMinAgeYears: number | null;
      hasLapChildUnder2: boolean;
      requiresAssistedAircraftBoarding: boolean;
      canWalkUnassistedOneHourUnevenTerrain: boolean | null;
      carryingDrone: boolean;
      carryingSelfieStickOrExtension: boolean;
      carryingBagsOrPursesOnFlight: boolean;
      hasServiceAnimal: boolean;
      reasons: string[];
    };
  };
  revalidatedAt: string;
}

function parseHhMmToMinutesHelper(hhmm: string | null | undefined): number | null {
  if (!hhmm || typeof hhmm !== "string") return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

function calculateSinglePassengerWeightSurchargeUsd(
  weightLbs: number,
  policy: VersionedCandidatePolicyAttributes,
): number {
  if (
    policy.secondaryWeightSurchargeThresholdLbs !== null &&
    weightLbs >= policy.secondaryWeightSurchargeThresholdLbs
  ) {
    return policy.secondaryWeightSurchargeUsd ?? policy.weightSurchargeUsd;
  }
  if (
    policy.weightSurchargeThresholdLbs !== null &&
    weightLbs >= policy.weightSurchargeThresholdLbs
  ) {
    return policy.weightSurchargeUsd;
  }
  return 0;
}

export async function revalidateCommercialHandoffBeforeCommitment(
  input: RevalidateCommercialHandoffInput,
): Promise<CommercialHandoffRevalidationResult | null> {
  const handoff = await getCommercialHandoffById(input.handoffId);
  if (!handoff) {
    return null;
  }

  const bindingReasons: string[] = [];
  const priceReasons: string[] = [];
  const availabilityReasons: string[] = [];
  const passengerReasons: string[] = [];

  const partySize = handoff.partySize;
  const intendedDate = handoff.intendedDate;
  const intendedDepartureId = handoff.intendedDepartureId;
  const intendedDepartureTime = handoff.intendedDepartureTime;
  const fareharborShortname = handoff.fareharborShortname;
  const fareharborItemId = handoff.fareharborItemId;
  const fareharborDirectEmbedUrl =
    handoff.checkoutBookingBinding?.fareharborDirectEmbedUrl ?? null;

  // 1. Load authoritative versioned candidate policy from the evaluator's CandidateUniverse
  const versionedCandidate = await resolveVersionedCandidatePolicy(
    handoff.productCode,
    handoff.receiptId,
  );

  if (!versionedCandidate) {
    bindingReasons.push("UNKNOWN_CANDIDATE_NOT_IN_VERSIONED_UNIVERSE_BLOCKS_PROGRESSION");
  }

  const isViatorHandoff =
    handoff.provider === "viator" || versionedCandidate?.bookingProvider === "viator";
  const viatorProductCode =
    handoff.viatorProductCode ?? versionedCandidate?.viatorProductCode ?? null;
  const viatorBookingUrl =
    handoff.checkoutBookingBinding?.viatorBookingUrl ??
    (isViatorHandoff ? handoff.outboundAffiliateUrl : null);
  const viatorWorryFreeShoreExcursion =
    handoff.checkoutBookingBinding?.viatorWorryFreeShoreExcursion ??
    versionedCandidate?.viatorWorryFreeProtection ??
    null;
  const travelerReselectionRequirements =
    handoff.checkoutBookingBinding?.travelerReselectionRequirements ??
    (isViatorHandoff ? JUNEAU_VIATOR_RESELECTION_REQUIREMENTS : null);

  if (isViatorHandoff) {
    if (
      !intendedDate ||
      partySize === null ||
      partySize <= 0 ||
      !viatorBookingUrl ||
      !viatorProductCode
    ) {
      bindingReasons.push("INCOMPLETE_BOOKABLE_DEPARTURE_BINDING_BLOCKS_PROGRESSION");
    }
    if (
      versionedCandidate?.viatorProductCode &&
      viatorProductCode &&
      viatorProductCode !== versionedCandidate.viatorProductCode
    ) {
      bindingReasons.push("VIATOR_PRODUCT_CODE_MISMATCH_WITH_VERSIONED_POLICY_BLOCKS_PROGRESSION");
    }
  } else {
    if (
      !fareharborShortname ||
      !fareharborItemId ||
      !intendedDate ||
      !intendedDepartureId ||
      !intendedDepartureTime ||
      partySize === null ||
      partySize <= 0
    ) {
      bindingReasons.push("INCOMPLETE_BOOKABLE_DEPARTURE_BINDING_BLOCKS_PROGRESSION");
    }
    if (versionedCandidate) {
      if (
        (versionedCandidate.fareharborShortname &&
          fareharborShortname !== versionedCandidate.fareharborShortname) ||
        (versionedCandidate.fareharborItemId &&
          fareharborItemId !== versionedCandidate.fareharborItemId)
      ) {
        bindingReasons.push("FAREHARBOR_ITEM_MISMATCH_WITH_VERSIONED_POLICY_BLOCKS_PROGRESSION");
      }
    }
  }

  // 2. Verify authoritative signed decision receipt when receiptId is linked
  let receiptVerified = false;
  let receiptInputs: Record<string, unknown> = {};
  let effectiveReceiptPartySize: number | null =
    input.receiptEvaluatedPartySize ?? null;
  let effectiveReceiptDate: string | null = input.receiptEvaluatedDate ?? null;

  if (handoff.receiptId) {
    const storedReceipt = await getV03ReceiptWithFallback(handoff.receiptId);
    if (!storedReceipt) {
      bindingReasons.push("UNVERIFIED_OR_MISSING_DECISION_RECEIPT_BLOCKS_PROGRESSION");
    } else {
      receiptVerified = true;
      receiptInputs = (storedReceipt.inputs ?? {}) as Record<string, unknown>;
      if (effectiveReceiptPartySize === null) {
        effectiveReceiptPartySize =
          typeof receiptInputs.partySize === "number"
            ? receiptInputs.partySize
            : typeof receiptInputs.passengerCount === "number"
              ? receiptInputs.passengerCount
              : null;
      }
      if (!effectiveReceiptDate && storedReceipt.receipt.payload.validAt) {
        effectiveReceiptDate = storedReceipt.receipt.payload.validAt.slice(0, 10);
      }

      const candidateSummary =
        storedReceipt.receipt.payload.candidateDispositionSummary.find(
          (c) =>
            c.legacyCode === handoff.productCode ||
            c.candidateDccId === handoff.productCode ||
            (versionedCandidate &&
              c.candidateDccId === versionedCandidate.candidateDccEntityId),
        );
      if (
        !candidateSummary ||
        candidateSummary.disposition === "ineligible" ||
        candidateSummary.disposition === "indeterminate"
      ) {
        bindingReasons.push("RECEIPT_CANDIDATE_NOT_VIABLE_BLOCKS_PROGRESSION");
      }
    }
  }

  if (
    input.requestedReceiptId &&
    handoff.receiptId &&
    input.requestedReceiptId.trim() !== handoff.receiptId
  ) {
    bindingReasons.push("REVALIDATION_RECEIPT_ID_MISMATCH_WITH_HANDOFF_BLOCKS_PROGRESSION");
  }

  if (
    effectiveReceiptPartySize !== null &&
    partySize !== effectiveReceiptPartySize
  ) {
    bindingReasons.push("REVALIDATION_PARTY_SIZE_MISMATCH_WITH_RECEIPT_BLOCKS_PROGRESSION");
  }

  if (
    input.requestedPartySize !== undefined &&
    input.requestedPartySize !== null &&
    partySize !== input.requestedPartySize
  ) {
    bindingReasons.push("REVALIDATION_PARTY_SIZE_MISMATCH_WITH_HANDOFF_BLOCKS_PROGRESSION");
  }

  if (
    effectiveReceiptDate &&
    intendedDate &&
    intendedDate.slice(0, 10) !== effectiveReceiptDate.slice(0, 10)
  ) {
    bindingReasons.push("REVALIDATION_DATE_MISMATCH_WITH_RECEIPT_BLOCKS_PROGRESSION");
  }

  if (
    input.requestedDate &&
    intendedDate &&
    intendedDate.slice(0, 10) !== input.requestedDate.slice(0, 10)
  ) {
    bindingReasons.push("REVALIDATION_DATE_MISMATCH_WITH_HANDOFF_BLOCKS_PROGRESSION");
  }

  if (
    input.requestedDepartureId &&
    intendedDepartureId &&
    intendedDepartureId !== input.requestedDepartureId
  ) {
    bindingReasons.push("REVALIDATION_DEPARTURE_MISMATCH_WITH_HANDOFF_BLOCKS_PROGRESSION");
  }

  if (
    input.requestedDepartureTime &&
    intendedDepartureTime &&
    intendedDepartureTime !== input.requestedDepartureTime
  ) {
    bindingReasons.push("REVALIDATION_DEPARTURE_TIME_MISMATCH_WITH_HANDOFF_BLOCKS_PROGRESSION");
  }

  if (
    input.requestedFareharborItemId &&
    fareharborItemId &&
    fareharborItemId !== input.requestedFareharborItemId
  ) {
    bindingReasons.push("REVALIDATION_ITEM_MISMATCH_WITH_HANDOFF_BLOCKS_PROGRESSION");
  }

  if (
    input.requestedViatorProductCode &&
    viatorProductCode &&
    viatorProductCode !== input.requestedViatorProductCode
  ) {
    bindingReasons.push("REVALIDATION_VIATOR_PRODUCT_MISMATCH_WITH_HANDOFF_BLOCKS_PROGRESSION");
  }

  if (
    input.requestedTourCode &&
    handoff.productCode &&
    handoff.productCode !== input.requestedTourCode
  ) {
    bindingReasons.push("REVALIDATION_TOUR_CODE_MISMATCH_WITH_HANDOFF_BLOCKS_PROGRESSION");
  }

  // 3. Versioned Policy Tariff & Multi-Passenger Weight Surcharge Check (never trusting caller-supplied live price)
  const publishedBasePerPersonUsd = versionedCandidate?.basePriceUsd ?? null;
  const effectivePartySize = partySize ?? 1;

  const quotedTotalUsd =
    handoff.quotedPriceAmount !== null
      ? publishedBasePerPersonUsd !== null &&
        handoff.quotedPriceAmount >= publishedBasePerPersonUsd * effectivePartySize * 0.9 &&
        effectivePartySize > 1
        ? handoff.quotedPriceAmount
        : handoff.quotedPriceAmount * effectivePartySize
      : null;
  const quotedPerPersonUsd =
    quotedTotalUsd !== null ? Number((quotedTotalUsd / effectivePartySize).toFixed(2)) : null;

  const handoffValidWeights = Array.isArray(handoff.passengerWeightsLbs)
    ? handoff.passengerWeightsLbs.filter(
        (w): w is number => typeof w === "number" && Number.isFinite(w) && w > 0,
      )
    : null;
  const handoffMaxWeight =
    handoffValidWeights && handoffValidWeights.length > 0
      ? Math.max(...handoffValidWeights)
      : null;

  const normalizedPassengerWeightsLbs = Array.isArray(input.passengerWeightsLbs)
    ? input.passengerWeightsLbs.filter(
        (w): w is number => typeof w === "number" && Number.isFinite(w) && w > 0,
      )
    : handoffValidWeights &&
        (input.declaredMaxSinglePassengerWeightLbs === undefined ||
          input.declaredMaxSinglePassengerWeightLbs === null ||
          input.declaredMaxSinglePassengerWeightLbs === handoffMaxWeight)
      ? handoffValidWeights
      : null;

  const effectiveWeightLbs =
    normalizedPassengerWeightsLbs && normalizedPassengerWeightsLbs.length > 0
      ? Math.max(
          ...normalizedPassengerWeightsLbs,
          typeof input.declaredMaxSinglePassengerWeightLbs === "number"
            ? input.declaredMaxSinglePassengerWeightLbs
            : 0,
        )
      : input.declaredMaxSinglePassengerWeightLbs !== undefined &&
          input.declaredMaxSinglePassengerWeightLbs !== null
        ? input.declaredMaxSinglePassengerWeightLbs
        : handoff.maxSinglePassengerWeightLbs ??
          (typeof receiptInputs.maxSinglePassengerWeightLbs === "number"
            ? receiptInputs.maxSinglePassengerWeightLbs
            : typeof receiptInputs.passengerWeightLbs === "number"
              ? receiptInputs.passengerWeightLbs
              : null);

  let requiredWeightSurchargeUsd = 0;
  let passengersIncurringWeightSurchargeCount = 0;
  let publishedGroupTotalConfirmed = false;

  if (versionedCandidate) {
    if (
      normalizedPassengerWeightsLbs &&
      normalizedPassengerWeightsLbs.length === effectivePartySize
    ) {
      for (const w of normalizedPassengerWeightsLbs) {
        const surcharge = calculateSinglePassengerWeightSurchargeUsd(w, versionedCandidate);
        if (surcharge > 0) {
          passengersIncurringWeightSurchargeCount += 1;
          requiredWeightSurchargeUsd += surcharge;
        }
      }
      publishedGroupTotalConfirmed = true;
    } else if (typeof effectiveWeightLbs === "number") {
      const heaviestPassengerSurcharge = calculateSinglePassengerWeightSurchargeUsd(
        effectiveWeightLbs,
        versionedCandidate,
      );
      requiredWeightSurchargeUsd = heaviestPassengerSurcharge;
      passengersIncurringWeightSurchargeCount = heaviestPassengerSurcharge > 0 ? 1 : 0;
      // When maxSinglePassengerWeightLbs is below the surcharge threshold, 0 passengers in the party incur a surcharge
      // so the group total is known. If effectivePartySize === 1, a single weight also covers the whole party.
      // Otherwise, if effectivePartySize > 1 and the heaviest passenger triggers a surcharge without per-passenger weights,
      // the group total cannot be confirmed until all passenger weights are collected.
      publishedGroupTotalConfirmed =
        effectivePartySize === 1 || heaviestPassengerSurcharge === 0;
    }
  }

  const publishedPolicyRequiredTotalUsd =
    publishedBasePerPersonUsd !== null && publishedGroupTotalConfirmed
      ? Number(
          (publishedBasePerPersonUsd * effectivePartySize + requiredWeightSurchargeUsd).toFixed(2),
        )
      : null;

  if (
    quotedPerPersonUsd !== null &&
    publishedBasePerPersonUsd !== null &&
    Math.abs(publishedBasePerPersonUsd - quotedPerPersonUsd) > 0.01
  ) {
    priceReasons.push("QUOTED_PRICE_MISMATCH_WITH_VERSIONED_POLICY_TARIFF_BLOCKS_PROGRESSION");
  }

  if (
    effectivePartySize > 1 &&
    requiredWeightSurchargeUsd > 0 &&
    !publishedGroupTotalConfirmed
  ) {
    priceReasons.push("INCOMPLETE_PARTY_PASSENGER_WEIGHTS_FOR_SURCHARGE_BLOCKS_PROGRESSION");
  }

  if (
    requiredWeightSurchargeUsd > 0 &&
    quotedTotalUsd !== null &&
    (publishedPolicyRequiredTotalUsd === null ||
      publishedPolicyRequiredTotalUsd > quotedTotalUsd + 0.01) &&
    input.travelerAcceptedWeightSurcharge !== true
  ) {
    priceReasons.push("UNQUOTED_WEIGHT_SURCHARGE_AT_CHECKIN_BLOCKS_PROGRESSION");
  }

  // 4. Operating Season & Port Schedule Window Check (from versioned candidate staticAttributes)
  const operatingSeasonMonthsUtc = versionedCandidate?.operatingSeasonMonthsUtc ?? [
    5, 6, 7, 8, 9,
  ];
  if (intendedDate) {
    const monthMatch = /^\d{4}-(\d{2})-\d{2}/.exec(intendedDate);
    const monthNum = monthMatch ? Number(monthMatch[1]) : NaN;
    if (!Number.isFinite(monthNum) || !operatingSeasonMonthsUtc.includes(monthNum)) {
      availabilityReasons.push("OUTSIDE_MAY_SEPTEMBER_OPERATING_SEASON_BLOCKS_PROGRESSION");
    }
  }

  const shipArrivalTime =
    input.shipArrivalTime ??
    handoff.shipArrivalTime ??
    (typeof receiptInputs.shipArrivalTime === "string" ? receiptInputs.shipArrivalTime : null);
  const shipDepartureTime =
    input.shipDepartureTime ??
    handoff.shipDepartureTime ??
    (typeof receiptInputs.shipDepartureTime === "string"
      ? receiptInputs.shipDepartureTime
      : null);

  const depMins = parseHhMmToMinutesHelper(intendedDepartureTime);
  const arrMins = parseHhMmToMinutesHelper(shipArrivalTime);
  const sailMins = parseHhMmToMinutesHelper(shipDepartureTime);

  const postArrivalBufferMins = versionedCandidate?.postArrivalBufferMinutes ?? 45;
  const preDepartureBufferMins = versionedCandidate?.preDepartureBufferMinutes ?? 45;
  const tourDurationMins = versionedCandidate?.totalDurationMinutes ?? 135;
  const minPortWindowMinutes = versionedCandidate?.minPortWindowMinutes ?? 210;
  const actualPortWindowMinutes =
    arrMins !== null && sailMins !== null && sailMins > arrMins ? sailMins - arrMins : null;

  const earliestAllowedDepartureMinutes =
    arrMins !== null ? arrMins + postArrivalBufferMins : null;
  const latestAllowedReturnMinutes =
    sailMins !== null ? sailMins - preDepartureBufferMins : null;
  const estimatedReturnMinutes = depMins !== null ? depMins + tourDurationMins : null;

  if (
    actualPortWindowMinutes !== null &&
    actualPortWindowMinutes < minPortWindowMinutes
  ) {
    availabilityReasons.push("INSUFFICIENT_PORT_WINDOW_BLOCKS_PROGRESSION");
  }

  if (
    depMins !== null &&
    earliestAllowedDepartureMinutes !== null &&
    depMins < earliestAllowedDepartureMinutes
  ) {
    availabilityReasons.push("DEPARTURE_VIOLATES_SHIP_ARRIVAL_BUFFER_BLOCKS_PROGRESSION");
  }

  if (
    estimatedReturnMinutes !== null &&
    latestAllowedReturnMinutes !== null &&
    estimatedReturnMinutes > latestAllowedReturnMinutes
  ) {
    availabilityReasons.push("DEPARTURE_VIOLATES_SHIP_DEPARTURE_BUFFER_BLOCKS_PROGRESSION");
  }

  // 5. Passenger Policy Constraints (from versioned candidate staticAttributes)
  const youngestAge =
    input.declaredYoungestPassengerAgeYears !== undefined &&
    input.declaredYoungestPassengerAgeYears !== null
      ? input.declaredYoungestPassengerAgeYears
      : handoff.youngestPassengerAgeYears ??
        (typeof receiptInputs.youngestPassengerAgeYears === "number"
          ? receiptInputs.youngestPassengerAgeYears
          : null);
  const hasLapChildUnder2 =
    input.hasLapChildUnder2 === true || receiptInputs.hasLapChildUnder2 === true;
  const requiresAssistedBoarding =
    input.requiresAssistedAircraftBoarding === true ||
    receiptInputs.requiresAssistedAircraftBoarding === true ||
    receiptInputs.requiresAssistedBoarding === true;
  const canWalkOneHour =
    input.canWalkUnassistedOneHourUnevenTerrain !== undefined &&
    input.canWalkUnassistedOneHourUnevenTerrain !== null
      ? input.canWalkUnassistedOneHourUnevenTerrain
      : typeof receiptInputs.canWalkUnassistedOneHourUnevenTerrain === "boolean"
        ? receiptInputs.canWalkUnassistedOneHourUnevenTerrain
        : typeof receiptInputs.canWalkOneHourGlacierTerrain === "boolean"
          ? receiptInputs.canWalkOneHourGlacierTerrain
          : null;
  const carryingDrone =
    input.carryingDrone === true || receiptInputs.carryingDrone === true;
  const carryingSelfieStick =
    input.carryingSelfieStickOrExtension === true ||
    receiptInputs.carryingSelfieStickOrExtension === true;
  const carryingBagsOnFlight =
    input.carryingBagsOrPursesOnFlight === true ||
    receiptInputs.carryingBagsOrPursesOnFlight === true;
  const hasServiceAnimal =
    input.hasServiceAnimal === true || receiptInputs.hasServiceAnimal === true;

  if (effectiveWeightLbs === null || effectiveWeightLbs === undefined) {
    passengerReasons.push("MISSING_PASSENGER_WEIGHT_BLOCKS_PROGRESSION");
  } else if (
    versionedCandidate &&
    versionedCandidate.weightPolicyType === "hard_cap" &&
    versionedCandidate.weightSurchargeThresholdLbs !== null &&
    effectiveWeightLbs > versionedCandidate.weightSurchargeThresholdLbs
  ) {
    passengerReasons.push("PASSENGER_EXCEEDS_OPERATOR_WEIGHT_HARD_CAP_BLOCKS_PROGRESSION");
  }

  if (
    versionedCandidate &&
    versionedCandidate.minAgeYears > 0 &&
    typeof youngestAge === "number" &&
    youngestAge < versionedCandidate.minAgeYears
  ) {
    passengerReasons.push("PASSENGER_BELOW_OPERATOR_MINIMUM_AGE_BLOCKS_PROGRESSION");
  }

  if ((versionedCandidate?.prohibitsLapChildren ?? true) && hasLapChildUnder2) {
    passengerReasons.push("LAP_CHILD_PROHIBITED_BY_OPERATOR_POLICY_BLOCKS_PROGRESSION");
  }

  if (
    (versionedCandidate?.requiresUnassistedAircraftBoarding ?? true) &&
    requiresAssistedBoarding
  ) {
    passengerReasons.push("ASSISTED_BOARDING_NOT_PERMITTED_BLOCKS_PROGRESSION");
  }

  if (
    versionedCandidate?.requiresOneHourUnassistedGlacierWalk &&
    canWalkOneHour === false
  ) {
    passengerReasons.push("NORTHSTAR_1HR_UNASSISTED_GLACIER_WALK_REQUIRED_BLOCKS_PROGRESSION");
  }

  if ((versionedCandidate?.prohibitsDrones ?? true) && carryingDrone) {
    passengerReasons.push("PROHIBITED_ITEM_DRONE_BLOCKS_PROGRESSION");
  }

  if ((versionedCandidate?.prohibitsSelfieSticks ?? true) && carryingSelfieStick) {
    passengerReasons.push("PROHIBITED_ITEM_EXTENSION_POLE_BLOCKS_PROGRESSION");
  }

  if ((versionedCandidate?.prohibitsBagsOnAircraft ?? true) && carryingBagsOnFlight) {
    passengerReasons.push("PROHIBITED_ITEM_BAGS_ON_AIRCRAFT_BLOCKS_PROGRESSION");
  }

  if (versionedCandidate?.prohibitsServiceAnimals && hasServiceAnimal) {
    passengerReasons.push("SERVICE_ANIMAL_RESTRICTED_ON_HELICOPTER_BLOCKS_PROGRESSION");
  }

  // 6. Provider Confirmation State (explicitly unknown until authenticated provider response)
  const hasAuthenticatedConfirmation =
    handoff.outcomeState.bookingOutcome === "confirmed" &&
    Boolean(handoff.outcomeState.lastOutcomeId);

  const providerLabel = isViatorHandoff ? "Viator" : "the booking provider";
  const providerConfirmation: CommercialHandoffRevalidationResult["providerConfirmation"] =
    hasAuthenticatedConfirmation
      ? {
          status: "confirmed_by_authenticated_provider_response",
          liveAvailabilityStatus: "confirmed",
          liveAvailableSeats: null,
          liveOperatorPricePerPersonUsd: null,
          authenticatedOutcomeId: handoff.outcomeState.lastOutcomeId,
          requiresProviderConfirmationAtCheckout: false,
          explanation:
            "Authenticated provider outcome recorded for this handoff.",
        }
      : {
          status: "unknown_until_authenticated_provider_response",
          liveAvailabilityStatus: "unknown",
          liveAvailableSeats: null,
          liveOperatorPricePerPersonUsd: null,
          authenticatedOutcomeId: null,
          requiresProviderConfirmationAtCheckout: true,
          explanation: `Live seat inventory, departure time slot availability, and final fare are not established by DCC and remain unknown until confirmed in ${providerLabel}.`,
        };

  const blockingReasons = [
    ...bindingReasons,
    ...priceReasons,
    ...availabilityReasons,
    ...passengerReasons,
  ];
  const progressionAllowed = blockingReasons.length === 0;

  return {
    handoffId: handoff.handoffId,
    receiptId: handoff.receiptId,
    receiptVerified,
    bookingProvider: handoff.provider,
    productCode: handoff.productCode,
    viatorProductCode,
    viatorBookingUrl,
    viatorDirectProductUrl: viatorBookingUrl,
    viatorWorryFreeShoreExcursion,
    travelerReselectionRequirements,
    fareharborShortname,
    fareharborItemId,
    fareharborDirectEmbedUrl,
    intendedDate,
    intendedDepartureId,
    intendedDepartureTime,
    partySize,
    publishedGroupTotalConfirmed,
    passengersIncurringWeightSurchargeCount,
    requiredWeightSurchargeUsd,
    publishedPolicyRequiredTotalUsd,
    progressionAllowed,
    revalidationStatus: progressionAllowed ? "passed" : "blocked",
    blockingReasons,
    ignoredUntrustedOperatorFactFields: input.ignoredUntrustedOperatorFactFields ?? [],
    versionedPolicySource: {
      universeId: versionedCandidate?.universeId ?? null,
      universeVersion: versionedCandidate?.universeVersion ?? null,
      universeHash: versionedCandidate?.universeHash ?? null,
      candidateDccEntityId: versionedCandidate?.candidateDccEntityId ?? null,
      legacyCandidateCode: versionedCandidate?.legacyCandidateCode ?? null,
      weightPolicyType: versionedCandidate?.weightPolicyType ?? null,
      requiredClaimIds: versionedCandidate?.requiredClaimIds ?? [],
    },
    providerConfirmation,
    checks: {
      bindingConsistency: {
        passed: bindingReasons.length === 0,
        receiptVerified,
        reasons: bindingReasons,
      },
      priceAndSurcharge: {
        passed: priceReasons.length === 0,
        quotedPerPersonUsd,
        quotedTotalUsd,
        publishedBasePerPersonUsd,
        passengerWeightsLbs: normalizedPassengerWeightsLbs,
        publishedGroupTotalConfirmed,
        requiredWeightSurchargeUsd,
        publishedPolicyRequiredTotalUsd,
        liveOperatorPricePerPersonUsd: null,
        reasons: priceReasons,
      },
      availabilityAndSchedule: {
        passed: availabilityReasons.length === 0,
        liveDepartureAvailability: providerConfirmation.liveAvailabilityStatus,
        liveAvailableSeats: null,
        requiredPartySize: partySize,
        operatingSeasonMonthsUtc,
        shipArrivalTime,
        shipDepartureTime,
        minPortWindowMinutes,
        actualPortWindowMinutes,
        earliestAllowedDepartureMinutes,
        latestAllowedReturnMinutes,
        estimatedReturnMinutes,
        reasons: availabilityReasons,
      },
      passengerConstraints: {
        passed: passengerReasons.length === 0,
        maxSinglePassengerWeightLbs: effectiveWeightLbs ?? null,
        weightPolicyType: versionedCandidate?.weightPolicyType ?? null,
        youngestPassengerAgeYears: youngestAge ?? null,
        operatorMinAgeYears: versionedCandidate?.minAgeYears ?? null,
        hasLapChildUnder2,
        requiresAssistedAircraftBoarding: requiresAssistedBoarding,
        canWalkUnassistedOneHourUnevenTerrain: canWalkOneHour,
        carryingDrone,
        carryingSelfieStickOrExtension: carryingSelfieStick,
        carryingBagsOrPursesOnFlight: carryingBagsOnFlight,
        hasServiceAnimal,
        reasons: passengerReasons,
      },
    },
    revalidatedAt: new Date().toISOString(),
  };
}

export interface SharedHandoffLedgerSummary {
  generatedAt: string;
  originatingSiteFilter: string | null;
  portSlugFilter: string | null;
  clickIsBooking: false;
  approvedViatorAccountForSite: {
    site: string;
    viatorPid: string;
    viatorMcid: string;
  };
  redirects: {
    total: number;
    forOriginatingSite: number;
    forPortSlug: number;
    byOriginatingSite: Record<string, number>;
    byProvider: Record<string, number>;
    qaExcludedCount?: number;
  };
  providerConfirmedBookings: {
    displayValue: number | "unknown";
    confirmedCount: number;
    forOriginatingSiteConfirmedCount: number;
    unreportedRedirectsCount: number;
    reportingStatus: "reported" | "unknown";
    note: string;
  };
  earnedCommissions: {
    displayValue: number | "unknown";
    estimatedCommissionUsd: number;
    confirmedEarnedUsd: number;
    settledPaidUsd: number;
    forOriginatingSiteEstimatedUsd: number;
    forOriginatingSiteEarnedUsd: number;
    forOriginatingSitePayoutsUsd: number;
    reportingStatus: "reported" | "unknown";
    note: string;
  };
  estimatedCommissions: {
    displayValue: number | "unknown";
    estimatedCommissionUsd: number;
    forOriginatingSiteEstimatedUsd: number;
    reportingStatus: "reported" | "unknown";
    note: string;
  };
  payouts: {
    displayValue: number | "unknown";
    paidCommissionsCount?: number;
    forOriginatingSitePaidCommissionsCount?: number;
    settledPaidUsd: number;
    forOriginatingSitePayoutsUsd: number;
    reportingStatus: "reported" | "unknown";
    note: string;
  };
  machineFunnel?: MachineCommerceFunnelSummary;
}

export async function getMachineCommerceFunnelSummary(options?: {
  originatingSite?: string | null;
  portSlug?: string | null;
  productCode?: string | null;
}): Promise<MachineCommerceFunnelSummary> {
  const siteFilter = options?.originatingSite
    ? normalizeOriginatingSite(options.originatingSite)
    : null;
  const portFilter = options?.portSlug ? options.portSlug.trim().toLowerCase() : null;
  const prodFilter = options?.productCode ? options.productCode.trim().toUpperCase() : null;

  const seenEventIds = new Set<string>();
  const nonQaHandoffIds = new Set<string>();
  let searchEvents = 0;
  let availabilityCheckEvents = 0;
  let checkoutHandoffEvents = 0;
  let qaSearch = 0;
  let qaAvail = 0;
  let qaCheckout = 0;

  const applyEvent = (evt: {
    eventId: string;
    stage: string;
    originatingSite: string;
    portSlug: string | null;
    productCode: string | null;
    handoffId: string | null;
    isQaTraffic: boolean;
  }) => {
    if (!evt.eventId || seenEventIds.has(evt.eventId)) return;
    seenEventIds.add(evt.eventId);

    const orig = normalizeOriginatingSite(evt.originatingSite || "destinationcommandcenter.com");
    if (siteFilter && orig !== siteFilter) return;
    if (portFilter && (evt.portSlug || "").toLowerCase() !== portFilter) return;
    if (prodFilter && (evt.productCode || "").toUpperCase() !== prodFilter) return;

    if (evt.isQaTraffic) {
      if (evt.stage === "search") qaSearch += 1;
      else if (evt.stage === "availability_check") qaAvail += 1;
      else if (evt.stage === "checkout_handoff") qaCheckout += 1;
      return;
    }

    if (evt.stage === "search") searchEvents += 1;
    else if (evt.stage === "availability_check") availabilityCheckEvents += 1;
    else if (evt.stage === "checkout_handoff") {
      checkoutHandoffEvents += 1;
      if (evt.handoffId) nonQaHandoffIds.add(evt.handoffId);
    }
  };

  const pool = getCommercePool();
  const hasDb = await ensureCommerceTables();
  if (pool && hasDb) {
    try {
      const res = await pool.query<{
        event_id: string;
        stage: string;
        originating_site: string;
        port_slug: string | null;
        product_code: string | null;
        handoff_id: string | null;
        is_qa_traffic: boolean;
      }>(
        `SELECT event_id, stage, originating_site, port_slug, product_code, handoff_id, is_qa_traffic FROM dcc_machine_funnel_events ORDER BY created_at DESC LIMIT 5000`
      );
      for (const r of res.rows) {
        applyEvent({
          eventId: r.event_id,
          stage: r.stage,
          originatingSite: r.originating_site,
          portSlug: r.port_slug,
          productCode: r.product_code,
          handoffId: r.handoff_id,
          isQaTraffic: Boolean(r.is_qa_traffic),
        });
      }
    } catch {
      // Fallback to in-memory
    }
  }

  for (const evt of memoryMachineFunnelEvents.values()) {
    applyEvent(evt);
  }

  for (const h of memoryHandoffs.values()) {
    if (h.metadata.isQaTraffic === true) continue;
    const orig = normalizeOriginatingSite(h.originatingSite || "destinationcommandcenter.com");
    if (siteFilter && orig !== siteFilter) continue;
    const hPort = typeof h.metadata.portSlug === "string" ? h.metadata.portSlug.toLowerCase() : null;
    if (portFilter && hPort && hPort !== portFilter) continue;
    if (prodFilter && (h.productCode || "").toUpperCase() !== prodFilter) continue;
    nonQaHandoffIds.add(h.handoffId);
  }

  const outcomes = await listCommercialOutcomes({ limit: 200, excludeQa: true });
  const confirmedBookingKeys = new Set<string>();
  const paidCommissionKeys = new Set<string>();
  let paidCommissionsUsd = 0;

  for (const out of outcomes) {
    const evtType = out.eventType.toUpperCase();
    const isConfirmed =
      evtType.includes("CONFIRM") ||
      evtType.includes("FULFILL") ||
      evtType.includes("COMMISSION_RECONCILED") ||
      evtType.includes("COMMISSION_SETTLED");
    if (!isConfirmed) continue;
    if (
      !hasAuthenticatedProviderPaymentOrOperationalEvidence({
        reporterClientId: out.reporterClientId,
        reporterProvenance: out.reporterProvenance,
        providerBookingRef: out.providerBookingRef,
      })
    ) {
      continue;
    }
    if (out.handoffId && nonQaHandoffIds.has(out.handoffId)) {
      const bookingKey = `${out.handoffId}::${out.provider}:${out.providerBookingRef}`;
      confirmedBookingKeys.add(bookingKey);
      const paid = out.paidCommission.amount ?? 0;
      if (
        (evtType.includes("COMMISSION_RECONCILED") || evtType.includes("COMMISSION_SETTLED")) &&
        paid > 0
      ) {
        paidCommissionKeys.add(bookingKey);
        paidCommissionsUsd = Number((paidCommissionsUsd + paid).toFixed(2));
      }
    }
  }

  return {
    searchEvents,
    availabilityCheckEvents,
    checkoutHandoffEvents,
    matchedConfirmedBookings: confirmedBookingKeys.size,
    paidCommissionsCount: paidCommissionKeys.size,
    paidCommissionsUsd,
    qaExcludedEvents: {
      searchEvents: qaSearch,
      availabilityCheckEvents: qaAvail,
      checkoutHandoffEvents: qaCheckout,
      total: qaSearch + qaAvail + qaCheckout,
    },
    note: "Search (dcc_search_port_excursions), read-only availability check (dcc_check_tour_availability), and checkout handoff (dcc_prepare_tour_checkout) are recorded as separate funnel stages. QA/synthetic test traffic is excluded from production counts.",
  };
}

export async function getSharedHandoffLedgerSummary(options?: {
  originatingSite?: string | null;
  portSlug?: string | null;
}): Promise<SharedHandoffLedgerSummary> {
  const siteFilter = options?.originatingSite
    ? normalizeOriginatingSite(options.originatingSite)
    : null;
  const portFilter = options?.portSlug ? options.portSlug.trim().toLowerCase() : null;
  const siteDefaults =
    SITE_DEFAULT_ACCOUNTS[siteFilter || "cruisepromenade.com"] ||
    SITE_DEFAULT_ACCOUNTS["destinationcommandcenter.com"];

  const seenHandoffIds = new Set<string>();
  const seenClickIds = new Set<string>();
  const qaHandoffIds = new Set<string>();
  const byOriginatingSite: Record<string, number> = {};
  const byProvider: Record<string, number> = {};
  let totalRedirects = 0;
  let forOriginatingSite = 0;
  let forPortSlug = 0;
  let unreportedRedirectsCount = 0;
  let qaExcludedCount = 0;

  const handoffOriginById = new Map<string, string>();

  // 1. Load from Postgres dcc_commercial_handoffs when available
  const pool = getCommercePool();
  const hasDb = await ensureCommerceTables();
  if (pool && hasDb) {
    try {
      const res = await pool.query<{
        handoff_id: string;
        originating_site: string;
        provider: string;
        attribution_param_value: string;
        caller_client_id: string;
        metadata_json: Record<string, any> | null;
      }>(
        `SELECT handoff_id, originating_site, provider, attribution_param_value, caller_client_id, metadata_json FROM dcc_commercial_handoffs ORDER BY created_at DESC LIMIT 2000`,
      );
      for (const row of res.rows) {
        const hid = String(row.handoff_id || "").trim();
        if (!hid || seenHandoffIds.has(hid)) continue;
        seenHandoffIds.add(hid);
        const meta = row.metadata_json || {};
        if (typeof meta.clickId === "string" && meta.clickId.trim()) {
          seenClickIds.add(meta.clickId.trim().toLowerCase());
        }
        if (
          isCommercialQaTraffic({
            handoffId: hid,
            clickId: typeof meta.clickId === "string" ? meta.clickId : null,
            callerClientId: row.caller_client_id,
            idempotencyKey:
              typeof meta.idempotencyKey === "string" ? meta.idempotencyKey : null,
            metadata: meta,
          })
        ) {
          qaHandoffIds.add(hid);
          qaExcludedCount += 1;
          continue;
        }
        const orig = normalizeOriginatingSite(row.originating_site || "destinationcommandcenter.com");
        handoffOriginById.set(hid, orig);
        totalRedirects += 1;
        byOriginatingSite[orig] = (byOriginatingSite[orig] || 0) + 1;
        const prov = String(row.provider || "viator").toLowerCase();
        byProvider[prov] = (byProvider[prov] || 0) + 1;
        if (!siteFilter || orig === siteFilter) {
          forOriginatingSite += 1;
        }
        const rowPort =
          typeof meta.portSlug === "string"
            ? meta.portSlug.toLowerCase()
            : String(row.attribution_param_value || "").toLowerCase();
        if (portFilter && rowPort.includes(portFilter)) {
          forPortSlug += 1;
        }
        const outcomeStatus = meta.outcomeState?.bookingOutcome || "unknown";
        if (outcomeStatus === "unknown" || outcomeStatus === "pending") {
          unreportedRedirectsCount += 1;
        }
      }
    } catch {
      // Fallback to memory + durable ledger below
    }
  }

  // 2. Merge in-memory handoffs not yet in seenHandoffIds
  for (const h of memoryHandoffs.values()) {
    if (seenHandoffIds.has(h.handoffId)) continue;
    seenHandoffIds.add(h.handoffId);
    if (h.clickId) seenClickIds.add(h.clickId.toLowerCase());
    if (
      isCommercialQaTraffic({
        handoffId: h.handoffId,
        clickId: h.clickId,
        callerClientId: h.callerClientId,
        idempotencyKey:
          typeof h.metadata?.idempotencyKey === "string"
            ? h.metadata.idempotencyKey
            : null,
        metadata: h.metadata,
      })
    ) {
      qaHandoffIds.add(h.handoffId);
      qaExcludedCount += 1;
      continue;
    }
    const orig = normalizeOriginatingSite(h.originatingSite);
    handoffOriginById.set(h.handoffId, orig);
    totalRedirects += 1;
    byOriginatingSite[orig] = (byOriginatingSite[orig] || 0) + 1;
    byProvider[h.provider] = (byProvider[h.provider] || 0) + 1;
    if (!siteFilter || orig === siteFilter) {
      forOriginatingSite += 1;
    }
    const metaPort =
      typeof h.metadata?.portSlug === "string"
        ? h.metadata.portSlug.toLowerCase()
        : h.attributionParameterValue.toLowerCase();
    if (portFilter && metaPort.includes(portFilter)) {
      forPortSlug += 1;
    }
    if (h.outcomeState.bookingOutcome === "unknown" || h.outcomeState.bookingOutcome === "pending") {
      unreportedRedirectsCount += 1;
    }
  }

  // 3. Merge DurableLedgerState opaqueClicksById (excluding recommendation-only and test records)
  try {
    const ledger = readDurableLedgerState();
    for (const clk of Object.values(ledger.opaqueClicksById || {})) {
      if (clk.isTest || clk.trafficClass === "test") {
        qaExcludedCount += 1;
        continue;
      }
      if (clk.recordStage === "recommendation" && !clk.followedAt && (clk.clickCount ?? 0) === 0) {
        continue;
      }
      const cid = clk.clickId.toLowerCase();
      const hid = clk.handoffId ? clk.handoffId.trim() : null;
      if (seenClickIds.has(cid) || (hid && seenHandoffIds.has(hid))) continue;
      seenClickIds.add(cid);
      if (hid) seenHandoffIds.add(hid);
      const orig = normalizeOriginatingSite(clk.originatingSite || "destinationcommandcenter.com");
      if (hid) handoffOriginById.set(hid, orig);
      totalRedirects += 1;
      byOriginatingSite[orig] = (byOriginatingSite[orig] || 0) + 1;
      byProvider[clk.provider] = (byProvider[clk.provider] || 0) + 1;
      if (!siteFilter || orig === siteFilter) {
        forOriginatingSite += 1;
      }
      const clkPort = `${clk.propertySlug || ""} ${clk.originatingPage || ""} ${clk.outboundPartnerUrl || ""}`.toLowerCase();
      if (portFilter && clkPort.includes(portFilter)) {
        forPortSlug += 1;
      }
      if (!clk.reconciledOutcomes || clk.reconciledOutcomes.length === 0) {
        unreportedRedirectsCount += 1;
      }
    }
  } catch {
    // Non-fatal
  }

  // 4. Summarize authenticated provider-confirmed outcomes, estimated commissions, confirmed earnings, and payouts separately
  const outcomes = await listCommercialOutcomes({ limit: 100, excludeQa: true });
  const seenConfirmedBookingKeys = new Set<string>();
  const seenSiteConfirmedBookingKeys = new Set<string>();
  const seenPaidCommissionKeys = new Set<string>();
  const seenSitePaidCommissionKeys = new Set<string>();
  let estimatedCommissionUsd = 0;
  let confirmedEarnedUsd = 0;
  let settledPaidUsd = 0;
  let forOriginatingSiteEstimatedUsd = 0;
  let forOriginatingSiteEarnedUsd = 0;
  let forOriginatingSitePayoutsUsd = 0;

  for (const out of outcomes) {
    if (out.handoffId && qaHandoffIds.has(out.handoffId)) {
      continue;
    }
    const evt = out.eventType.toUpperCase();
    const isConfirmed =
      evt.includes("CONFIRM") ||
      evt.includes("FULFILL") ||
      evt.includes("COMMISSION_RECONCILED") ||
      evt.includes("COMMISSION_SETTLED");
    if (!isConfirmed) continue;
    if (
      !hasAuthenticatedProviderPaymentOrOperationalEvidence({
        reporterClientId: out.reporterClientId,
        reporterProvenance: out.reporterProvenance,
        providerBookingRef: out.providerBookingRef,
      })
    ) {
      continue;
    }
    const bookingKey = `${out.handoffId ?? "unmatched"}::${out.provider}:${out.providerBookingRef}`;
    seenConfirmedBookingKeys.add(bookingKey);
    const est = out.estimatedCommission.amount ?? 0;
    const paid = out.paidCommission.amount ?? 0;
    // Never include an unconfirmed estimate in confirmedEarnedUsd or settledPaidUsd!
    const earned =
      (evt.includes("FULFILL") ||
        evt.includes("COMMISSION_RECONCILED") ||
        evt.includes("COMMISSION_SETTLED")) &&
      paid > 0
        ? paid
        : 0;
    const payout =
      (evt.includes("COMMISSION_RECONCILED") || evt.includes("COMMISSION_SETTLED")) && paid > 0
        ? paid
        : 0;
    if (payout > 0) {
      seenPaidCommissionKeys.add(bookingKey);
    }

    estimatedCommissionUsd = Number((estimatedCommissionUsd + est).toFixed(2));
    confirmedEarnedUsd = Number((confirmedEarnedUsd + earned).toFixed(2));
    settledPaidUsd = Number((settledPaidUsd + payout).toFixed(2));

    const matchedOrig = out.handoffId ? handoffOriginById.get(out.handoffId) : null;
    if (!siteFilter || matchedOrig === siteFilter) {
      seenSiteConfirmedBookingKeys.add(bookingKey);
      if (payout > 0) {
        seenSitePaidCommissionKeys.add(bookingKey);
      }
      forOriginatingSiteEstimatedUsd = Number((forOriginatingSiteEstimatedUsd + est).toFixed(2));
      forOriginatingSiteEarnedUsd = Number((forOriginatingSiteEarnedUsd + earned).toFixed(2));
      forOriginatingSitePayoutsUsd = Number((forOriginatingSitePayoutsUsd + payout).toFixed(2));
    }
  }

  const confirmedCount = seenConfirmedBookingKeys.size;
  const forOriginatingSiteConfirmedCount = seenSiteConfirmedBookingKeys.size;
  const paidCommissionsCount = seenPaidCommissionKeys.size;
  const forOriginatingSitePaidCommissionsCount = seenSitePaidCommissionKeys.size;
  const effectiveConfirmedCount = siteFilter ? forOriginatingSiteConfirmedCount : confirmedCount;
  const effectiveEstimatedUsd = siteFilter ? forOriginatingSiteEstimatedUsd : estimatedCommissionUsd;
  const effectiveEarnedUsd = siteFilter ? forOriginatingSiteEarnedUsd : confirmedEarnedUsd;
  const effectivePayoutsUsd = siteFilter ? forOriginatingSitePayoutsUsd : settledPaidUsd;
  const effectiveRedirects = siteFilter ? forOriginatingSite : totalRedirects;
  const hasUnreported = effectiveRedirects > 0 && effectiveConfirmedCount === 0;

  const machineFunnel = await getMachineCommerceFunnelSummary({
    originatingSite: siteFilter,
    portSlug: portFilter,
  });

  return {
    generatedAt: new Date().toISOString(),
    originatingSiteFilter: siteFilter,
    portSlugFilter: portFilter,
    clickIsBooking: false,
    approvedViatorAccountForSite: {
      site: siteFilter || "cruisepromenade.com",
      viatorPid: siteDefaults.viatorPid,
      viatorMcid: siteDefaults.viatorMcid,
    },
    redirects: {
      total: totalRedirects,
      forOriginatingSite,
      forPortSlug,
      byOriginatingSite,
      byProvider,
      qaExcludedCount,
    },
    providerConfirmedBookings: {
      displayValue:
        effectiveConfirmedCount > 0 ? effectiveConfirmedCount : hasUnreported ? "unknown" : 0,
      confirmedCount,
      forOriginatingSiteConfirmedCount,
      unreportedRedirectsCount,
      reportingStatus: hasUnreported ? "unknown" : "reported",
      note: "Outbound handoff redirects are never counted as bookings. Provider-confirmed bookings require authenticated Viator /bookings/modified-since or operator webhook confirmation.",
    },
    earnedCommissions: {
      displayValue:
        effectiveEarnedUsd > 0 ? effectiveEarnedUsd : hasUnreported ? "unknown" : 0,
      estimatedCommissionUsd,
      confirmedEarnedUsd,
      settledPaidUsd,
      forOriginatingSiteEstimatedUsd,
      forOriginatingSiteEarnedUsd,
      forOriginatingSitePayoutsUsd,
      reportingStatus: hasUnreported ? "unknown" : "reported",
      note: "Confirmed earnings require verified provider commission on fulfilled or reconciled bookings and never include unconfirmed booking estimates.",
    },
    estimatedCommissions: {
      displayValue:
        effectiveEstimatedUsd > 0 ? effectiveEstimatedUsd : hasUnreported ? "unknown" : 0,
      estimatedCommissionUsd,
      forOriginatingSiteEstimatedUsd,
      reportingStatus: hasUnreported ? "unknown" : "reported",
      note: "Estimated commissions on confirmed bookings prior to fulfillment/settlement reconciliation.",
    },
    payouts: {
      displayValue:
        effectivePayoutsUsd > 0 ? effectivePayoutsUsd : hasUnreported ? "unknown" : 0,
      paidCommissionsCount,
      forOriginatingSitePaidCommissionsCount,
      settledPaidUsd,
      forOriginatingSitePayoutsUsd,
      reportingStatus: hasUnreported ? "unknown" : "reported",
      note: "Settled payouts require COMMISSION_RECONCILED confirmation from the provider.",
    },
    machineFunnel,
  };
}




