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

export interface CreateCommercialHandoffInput {
  originatingSite: string;
  targetSite?: string | null;
  provider: CommercialProvider;
  providerAccount?: string | null;
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
  partySize?: number | null;
  partyDetails?: CommercialPartyDetails | null;
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
  partySize: number | null;
  partyDetails: CommercialPartyDetails | null;
  quotedPriceAmount: number | null;
  quotedPriceCurrency: string | null;
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
    fareharborAsn: "welcometoalaskatours",
    gygPartnerId: process.env.NEXT_PUBLIC_GYG_PARTNER_ID || "F2MMUUH",
  },
  "cruisepromenade.com": {
    viatorPid: process.env.NEXT_PUBLIC_VIATOR_PID || "P00058396",
    viatorMcid: process.env.NEXT_PUBLIC_VIATOR_MCID || "42383",
    fareharborAsn: "welcometoalaskatours",
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
    fareharborAsn: "welcometoalaskatours",
    gygPartnerId: process.env.NEXT_PUBLIC_GYG_PARTNER_ID || "F2MMUUH",
  },
  "juneauflightdeck.com": {
    viatorPid: process.env.NEXT_PUBLIC_VIATOR_PID || "P00058396",
    viatorMcid: process.env.NEXT_PUBLIC_VIATOR_MCID || "42383",
    fareharborAsn: "welcometoalaskatours",
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

/**
 * Constructs a provider-supported affiliate URL preserving the originating site's
 * existing account attribution and attaching the opaque `handoff_id` without inventing
 * unsupported direct-to-cart capabilities.
 */
export function buildProviderAffiliateHandoffUrl(params: {
  originatingSite: string;
  provider: CommercialProvider;
  providerAccount?: string | null;
  productCode: string;
  productDestinationUrl: string;
  handoffId: string;
  campaign?: string | null;
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
    url = new URL("https://www.viator.com/");
  }

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

    url.searchParams.set("asn", asn);
    url.searchParams.set("ref", refValue);
    if (!url.searchParams.has("full-items")) {
      url.searchParams.set("full-items", "yes");
    }

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

  return {
    outboundAffiliateUrl: url.toString(),
    providerAccount: operatorAccount,
    attributionParameterName: "dcc_handoff_id",
    attributionParameterValue: params.handoffId,
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

  const handoffId = generateOpaqueHandoffId();
  const urlBuilt = buildProviderAffiliateHandoffUrl({
    originatingSite,
    provider: input.provider,
    providerAccount: input.providerAccount,
    productCode: input.productCode,
    productDestinationUrl: input.productDestinationUrl,
    handoffId,
    campaign: input.campaign,
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
    ...(approvedPartnerAttribution ? { approvedPartnerAttribution } : {}),
    outcomeState,
  };

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
          input.intendedOption ?? null,
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
    intendedOption: input.intendedOption ?? null,
    partySize,
    partyDetails: input.partyDetails ?? null,
    quotedPriceAmount: input.quotedPriceAmount ?? null,
    quotedPriceCurrency: input.quotedPriceCurrency ?? null,
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

    const loaded: CommercialHandoffRecord = {
      handoffId: row.handoff_id,
      originatingSite: row.originating_site,
      targetSite: targetSiteFromMeta,
      provider: row.provider,
      providerAccount: row.provider_account,
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
      partySize: row.party_size,
      partyDetails: row.party_details_json ?? null,
      quotedPriceAmount:
        row.quoted_price_amount !== null ? Number(row.quoted_price_amount) : null,
      quotedPriceCurrency: row.quoted_price_currency,
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
