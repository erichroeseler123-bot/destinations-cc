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
  metadata?: Record<string, unknown> | null;
}

export interface CommercialHandoffRecord {
  handoffId: string;
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
    viatorPid: process.env.NEXT_PUBLIC_VIATOR_PID || "P00058396",
    viatorMcid: process.env.NEXT_PUBLIC_VIATOR_MCID || "42383",
    fareharborAsn: "",
    gygPartnerId: process.env.NEXT_PUBLIC_GYG_PARTNER_ID || "F2MMUUH",
  },
  "cruisepromenade.com": {
    viatorPid: process.env.NEXT_PUBLIC_VIATOR_PID || "P00058396",
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
            : evt.includes("CONFIRM")
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

// In-memory store synchronized with Neon PostgreSQL when DATABASE_URL is configured
const memoryHandoffs = new Map<string, CommercialHandoffRecord>();
const memoryOutcomesByDedupeKey = new Map<string, CommercialOutcomeRecord>();
const memoryOutcomesById = new Map<string, CommercialOutcomeRecord>();
const memoryCheckpoints = new Map<string, PollerCheckpointRecord>();
const memoryActiveLeases = new Map<string, { holderId: string; expiresAtMs: number }>();

export function resetCommercialMemoryStoreForTests(): void {
  memoryHandoffs.clear();
  memoryOutcomesByDedupeKey.clear();
  memoryOutcomesById.clear();
  memoryCheckpoints.clear();
  memoryActiveLeases.clear();
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
}

export const JUNEAU_VIATOR_RESELECTION_REQUIREMENTS = [
  "Confirm or reselect the travel date (startDate) in Viator's live availability calendar.",
  "Select a specific departure time slot inside Viator that fits your cruise ship arrival and all-aboard buffer.",
  "Select the passenger count and appropriate Coastal Helicopters weight-tier option (DEFAULT: 1–259 lbs standard seat, TG1: 260–299 lbs half-seat surcharge, TG2: 300+ lbs second seat) in Viator.",
  "Enter each passenger's individual weight, full name, cruise ship name, port arrival/departure times, and pickup point during Viator checkout.",
] as const;

/**
 * Constructs a provider-supported affiliate URL preserving the originating site's
 * existing account attribution and attaching the opaque `handoff_id` without inventing
 * unsupported direct-to-cart capabilities or falling back to Viator's homepage.
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
    if (params.receiptId?.trim()) {
      targetUrl.searchParams.set("receipt_id", params.receiptId.trim());
    }
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

    return {
      outboundAffiliateUrl: url.toString(),
      providerAccount: pid,
      attributionParameterName: "campaign",
      attributionParameterValue: campaignValue,
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

    return {
      outboundAffiliateUrl: url.toString(),
      providerAccount: asn,
      attributionParameterName: "ref",
      attributionParameterValue: refValue,
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

    return {
      outboundAffiliateUrl: url.toString(),
      providerAccount: partnerId,
      attributionParameterName: "cmp",
      attributionParameterValue: cmpValue,
    };
  }

  if (params.provider === "rezdy") {
    const rezdyAccount = params.providerAccount?.trim() || url.hostname;
    const refValue = `${baseCampaign}__${params.handoffId}`;
    url.searchParams.set("ref", refValue);
    url.searchParams.set("utm_source", siteKey);
    appendExplicitDepartureQueryParams(url);

    return {
      outboundAffiliateUrl: url.toString(),
      providerAccount: rezdyAccount,
      attributionParameterName: "ref",
      attributionParameterValue: refValue,
    };
  }

  if (params.provider === "square") {
    const squareAccount = params.providerAccount?.trim() || url.hostname;
    const attributionValue = `${baseCampaign}__${params.handoffId}`;
    url.searchParams.set("dcc_handoff_id", params.handoffId);
    url.searchParams.set("utm_source", siteKey);
    url.searchParams.set("utm_campaign", attributionValue);
    appendExplicitDepartureQueryParams(url);

    return {
      outboundAffiliateUrl: url.toString(),
      providerAccount: squareAccount,
      attributionParameterName: "dcc_handoff_id",
      attributionParameterValue: params.handoffId,
    };
  }

  // Direct operator referral
  const operatorAccount = params.providerAccount?.trim() || url.hostname;
  const attributionValue = `${baseCampaign}__${params.handoffId}`;
  url.searchParams.set("dcc_handoff_id", params.handoffId);
  url.searchParams.set("utm_source", siteKey);
  url.searchParams.set("utm_campaign", attributionValue);
  appendExplicitDepartureQueryParams(url);

  return {
    outboundAffiliateUrl: url.toString(),
    providerAccount: operatorAccount,
    attributionParameterName: "dcc_handoff_id",
    attributionParameterValue: params.handoffId,
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
  const rawIdempotencyKey =
    (typeof input.idempotencyKey === "string" && input.idempotencyKey.trim()) ||
    (input.metadata &&
    typeof input.metadata.idempotencyKey === "string" &&
    input.metadata.idempotencyKey.trim()) ||
    null;

  if (rawIdempotencyKey) {
    for (const existing of memoryHandoffs.values()) {
      if (
        existing.originatingSite === originatingSite &&
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
          `SELECT handoff_id FROM dcc_commercial_handoffs WHERE originating_site = $1 AND metadata_json->>'idempotencyKey' = $2 LIMIT 1`,
          [originatingSite, rawIdempotencyKey]
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

  const handoffId = generateOpaqueHandoffId();
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
    campaign: input.campaign,
    receiptId: input.receiptId ?? null,
    intendedDate: input.intendedDate ?? null,
    intendedDepartureId,
    intendedDepartureTime,
    partySize,
    maxSinglePassengerWeightLbs: input.maxSinglePassengerWeightLbs ?? null,
    quotedPriceAmount: input.quotedPriceAmount ?? null,
  });

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
          travelerReselectionRequirements: [...JUNEAU_VIATOR_RESELECTION_REQUIREMENTS],
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
    ...(rawIdempotencyKey ? { idempotencyKey: rawIdempotencyKey } : {}),
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
          input.callerClientId || "public_traveler_browser",
          input.traceparent ?? null,
          JSON.stringify(enrichedMetadata),
        ]
      );
      if (res.rows[0]?.created_at) {
        createdAtIso = new Date(res.rows[0].created_at).toISOString();
      }
    } catch {
      // Fallback to in-memory map if transient DB error occurs
    }
  }

  const record: CommercialHandoffRecord = {
    handoffId,
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
    callerClientId: input.callerClientId || "public_traveler_browser",
    traceparent: input.traceparent ?? null,
    dccBookingAdapterMode: "shadow_only_no_side_effects",
    requiresDecisionAuthorization: false,
    createdAt: createdAtIso,
    duplicateSubmission: false,
    metadata: enrichedMetadata,
  };

  memoryHandoffs.set(handoffId, record);
  return record;
}

export async function getCommercialHandoffById(
  handoffId: string
): Promise<CommercialHandoffRecord | null> {
  const normalized = handoffId.trim().toLowerCase();
  const mem = memoryHandoffs.get(normalized);
  if (mem) return mem;

  const pool = getCommercePool();
  const hasDb = await ensureCommerceTables();
  if (!pool || !hasDb) return null;

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
  if (isDccInternalArtifactNotProviderConfirmation(input.providerBookingRef)) {
    const err = new Error(
      `A DCC decision receipt or internal artifact ('${input.providerBookingRef}') is not provider confirmation. Confirmed, cancelled, refunded, and fulfilled outcomes require an authenticated provider, payment, or authorized operational booking reference.`
    ) as Error & { code?: string; statusCode?: number };
    err.code = "DCC_RECEIPT_IS_NOT_PROVIDER_CONFIRMATION";
    err.statusCode = 422;
    throw err;
  }

  const resolvedHandoffId =
    extractHandoffIdFromTrackingValue(input.handoffId) ||
    extractHandoffIdFromTrackingValue(input.campaignOrRefValue) ||
    null;

  const matchedHandoff = resolvedHandoffId
    ? await getCommercialHandoffById(resolvedHandoffId)
    : null;

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
  campaign?: string;
  partnerBookingRef?: string;
  handoffId?: string;
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
    options?.providerAccount || process.env.NEXT_PUBLIC_VIATOR_PID || "P00058396";
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
      const bookingRef = String(
        item.bookingRef || item.transactionRef || `viator_evt_${crypto.randomBytes(6).toString("hex")}`
      );
      const eventType = String(item.eventType || item.status || "BOOKING_CONFIRMED").toUpperCase();
      const providerEventTime =
        typeof item.lastUpdated === "string"
          ? item.lastUpdated
          : typeof item.createdAt === "string"
            ? item.createdAt
            : null;

      const campaignValue =
        typeof item.campaign === "string"
          ? item.campaign
          : typeof item.partnerBookingRef === "string"
            ? item.partnerBookingRef
            : null;

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
        bookedProductCode: typeof item.productCode === "string" ? item.productCode : null,
        bookedDate: typeof item.travelDate === "string" ? item.travelDate : null,
        bookedOption: typeof item.tourGradeCode === "string" ? item.tourGradeCode : null,
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
  limit?: number;
}): Promise<CommercialOutcomeRecord[]> {
  const limit = Math.min(Math.max(1, options?.limit ?? 25), 100);
  const allMem = Array.from(memoryOutcomesById.values());
  const filtered = allMem.filter((item) => {
    if (options?.handoffId && item.handoffId !== options.handoffId) return false;
    if (options?.receiptId && item.receiptId !== options.receiptId) return false;
    if (options?.provider && item.provider !== options.provider) return false;
    return true;
  });
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


