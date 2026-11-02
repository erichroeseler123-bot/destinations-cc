import crypto from "node:crypto";
import type { CommercialProvider } from "./index";

export const FORBIDDEN_OUTBOUND_ARCHITECTURE_PARAMS = [
  "receipt_id",
  "receiptid",
  "receipt",
  "decision_receipt",
  "decisionreceiptid",
  "bundle_hash",
  "bundlehash",
  "universe_hash",
  "universehash",
  "evidence_version",
  "evidenceversion",
  "model_hash",
  "modelhash",
  "outcome_hash",
  "outcomehash",
  "evaluation_run_id",
  "evaluationrunid",
  "evalrunid",
  "normalized_input_hash",
  "normalizedinputhash",
] as const;

export interface OpaqueClickReconciledOutcome {
  reconciliationId: string;
  clickId: string;
  sourceChannel: "partner_webhook" | "partner_csv";
  provider: CommercialProvider;
  providerBookingRef: string;
  eventType:
    | "BOOKING_CONFIRMED"
    | "BOOKING_CANCELLED"
    | "BOOKING_REFUNDED"
    | "BOOKING_FULFILLED";
  grossRevenueUsd: number | null;
  estimatedCommissionUsd: number | null;
  paidCommissionUsd: number | null;
  currency: string;
  resolvedDecisionReceiptId: string;
  resolvedRecommendedOperatorId: string;
  resolvedRecommendedOperatorName: string;
  resolvedEvidenceVersion: string;
  reconciledAt: string;
  duplicateDelivery: boolean;
}

export interface OpaqueClickAttributionRecord {
  clickId: string;
  handoffId: string | null;
  decisionReceiptId: string;
  recommendedOperatorId: string;
  recommendedOperatorName: string;
  recommendedVehicleClassId: string | null;
  evidenceVersion: string;
  applicabilityModelVersion: string | null;
  applicabilityOutcomeHash: string | null;
  originatingSite: string;
  provider: CommercialProvider;
  productCode: string;
  outboundPartnerUrl: string;
  strippedLeakParams: string[];
  reconciliationState:
    | "pending_partner_event"
    | "reconciled_webhook"
    | "reconciled_csv"
    | "cancelled_or_refunded";
  reconciledOutcomes: OpaqueClickReconciledOutcome[];
  createdAt: string;
}

export interface IssueOpaqueClickAttributionInput {
  clickId?: string | null;
  handoffId?: string | null;
  decisionReceiptId: string;
  recommendedOperatorId: string;
  recommendedOperatorName?: string | null;
  recommendedVehicleClassId?: string | null;
  evidenceVersion: string;
  applicabilityModelVersion?: string | null;
  applicabilityOutcomeHash?: string | null;
  originatingSite?: string | null;
  provider: CommercialProvider;
  productCode: string;
  productDestinationUrl: string;
}

export interface PartnerWebhookReconciliationInput {
  clickId?: string | null;
  trackingParamValue?: string | null;
  provider: CommercialProvider;
  providerBookingRef: string;
  eventType:
    | "BOOKING_CONFIRMED"
    | "BOOKING_CANCELLED"
    | "BOOKING_REFUNDED"
    | "BOOKING_FULFILLED";
  grossRevenueUsd?: number | null;
  estimatedCommissionUsd?: number | null;
  paidCommissionUsd?: number | null;
  currency?: string | null;
  occurredAt?: string | null;
}

export interface PartnerCsvReconciliationSummary {
  totalRows: number;
  matchedCount: number;
  unmatchedCount: number;
  deduplicatedCount: number;
  reconciledRecords: OpaqueClickReconciledOutcome[];
  unmatchedRows: Array<{
    rowNumber: number;
    rawClickIdOrTracking: string;
    providerBookingRef: string;
    reason: string;
  }>;
}

const memoryOpaqueClicksById = new Map<string, OpaqueClickAttributionRecord>();
const memoryOpaqueClicksByHandoffId = new Map<string, OpaqueClickAttributionRecord>();
const memoryReconciliationByDedupeKey = new Map<string, OpaqueClickReconciledOutcome>();

export function resetOpaqueAttributionLedgerForTests(): void {
  memoryOpaqueClicksById.clear();
  memoryOpaqueClicksByHandoffId.clear();
  memoryReconciliationByDedupeKey.clear();
}

export function generateOpaqueClickId(): string {
  return `clk_${crypto.randomBytes(12).toString("hex")}`;
}

export function extractClickIdFromTrackingValue(value?: string | null): string | null {
  if (!value || typeof value !== "string") return null;
  const match = value.match(/(clk_[0-9a-f]{24})/i);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Strips any cryptographic decision receipt IDs, bundle hashes, universe hashes,
 * or evidence versions from the outbound partner URL and appends the opaque `click_id`.
 */
export function sanitizeOutboundPartnerUrlWithOpaqueClickId(
  targetUrlInput: string | URL,
  clickId: string,
): {
  outboundUrl: string;
  strippedLeakParams: string[];
} {
  const url =
    typeof targetUrlInput === "string"
      ? new URL(targetUrlInput)
      : new URL(targetUrlInput.toString());

  const forbiddenSet = new Set<string>(FORBIDDEN_OUTBOUND_ARCHITECTURE_PARAMS);
  const strippedLeakParams: string[] = [];

  for (const key of Array.from(url.searchParams.keys())) {
    const normalized = key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    const val = url.searchParams.get(key) || "";
    if (
      forbiddenSet.has(normalized) ||
      forbiddenSet.has(key.trim().toLowerCase()) ||
      val.includes("rcpt:sha256:") ||
      val.includes("evalrun:")
    ) {
      strippedLeakParams.push(key);
      url.searchParams.delete(key);
    }
  }

  url.searchParams.set("click_id", clickId);

  return {
    outboundUrl: url.toString(),
    strippedLeakParams,
  };
}

export function issueOpaqueClickAttribution(
  input: IssueOpaqueClickAttributionInput,
): OpaqueClickAttributionRecord {
  const clickId =
    input.clickId && /^clk_[0-9a-f]{24}$/i.test(input.clickId.trim())
      ? input.clickId.trim().toLowerCase()
      : generateOpaqueClickId();

  const existing = memoryOpaqueClicksById.get(clickId);
  if (existing) return existing;

  const { outboundUrl, strippedLeakParams } = sanitizeOutboundPartnerUrlWithOpaqueClickId(
    input.productDestinationUrl,
    clickId,
  );

  const record: OpaqueClickAttributionRecord = {
    clickId,
    handoffId: input.handoffId?.trim() || null,
    decisionReceiptId: input.decisionReceiptId.trim(),
    recommendedOperatorId: input.recommendedOperatorId.trim(),
    recommendedOperatorName:
      input.recommendedOperatorName?.trim() || input.recommendedOperatorId.trim(),
    recommendedVehicleClassId: input.recommendedVehicleClassId?.trim() || null,
    evidenceVersion: input.evidenceVersion.trim(),
    applicabilityModelVersion: input.applicabilityModelVersion?.trim() || null,
    applicabilityOutcomeHash: input.applicabilityOutcomeHash?.trim() || null,
    originatingSite: input.originatingSite?.trim() || "destinationcommandcenter.com",
    provider: input.provider,
    productCode: input.productCode.trim(),
    outboundPartnerUrl: outboundUrl,
    strippedLeakParams,
    reconciliationState: "pending_partner_event",
    reconciledOutcomes: [],
    createdAt: new Date().toISOString(),
  };

  memoryOpaqueClicksById.set(clickId, record);
  if (record.handoffId) {
    memoryOpaqueClicksByHandoffId.set(record.handoffId, record);
  }

  return record;
}

export function getOpaqueClickAttributionById(
  clickId: string,
): OpaqueClickAttributionRecord | null {
  if (!clickId) return null;
  return memoryOpaqueClicksById.get(clickId.trim().toLowerCase()) || null;
}

export function getOpaqueClickAttributionByHandoffId(
  handoffId: string,
): OpaqueClickAttributionRecord | null {
  if (!handoffId) return null;
  return memoryOpaqueClicksByHandoffId.get(handoffId.trim()) || null;
}

export function reconcilePartnerWebhookByClickId(
  input: PartnerWebhookReconciliationInput,
  sourceChannel: "partner_webhook" | "partner_csv" = "partner_webhook",
):
  | {
      matched: true;
      outcome: OpaqueClickReconciledOutcome;
      ledgerRecord: OpaqueClickAttributionRecord;
    }
  | {
      matched: false;
      reason: string;
    } {
  const resolvedClickId =
    extractClickIdFromTrackingValue(input.clickId) ||
    extractClickIdFromTrackingValue(input.trackingParamValue);

  if (!resolvedClickId) {
    return {
      matched: false,
      reason: "NO_OPAQUE_CLICK_ID_PRESENT",
    };
  }

  const record = memoryOpaqueClicksById.get(resolvedClickId);
  if (!record) {
    return {
      matched: false,
      reason: `UNKNOWN_OPAQUE_CLICK_ID:${resolvedClickId}`,
    };
  }

  const dedupeKey = `${record.clickId}::${input.provider}::${input.providerBookingRef.trim()}::${input.eventType}`;
  const existingOutcome = memoryReconciliationByDedupeKey.get(dedupeKey);
  if (existingOutcome) {
    return {
      matched: true,
      outcome: { ...existingOutcome, duplicateDelivery: true },
      ledgerRecord: record,
    };
  }

  const outcome: OpaqueClickReconciledOutcome = {
    reconciliationId: `rec_${crypto.randomBytes(10).toString("hex")}`,
    clickId: record.clickId,
    sourceChannel,
    provider: input.provider,
    providerBookingRef: input.providerBookingRef.trim(),
    eventType: input.eventType,
    grossRevenueUsd:
      typeof input.grossRevenueUsd === "number" && Number.isFinite(input.grossRevenueUsd)
        ? Number(input.grossRevenueUsd.toFixed(2))
        : null,
    estimatedCommissionUsd:
      typeof input.estimatedCommissionUsd === "number" &&
      Number.isFinite(input.estimatedCommissionUsd)
        ? Number(input.estimatedCommissionUsd.toFixed(2))
        : null,
    paidCommissionUsd:
      typeof input.paidCommissionUsd === "number" && Number.isFinite(input.paidCommissionUsd)
        ? Number(input.paidCommissionUsd.toFixed(2))
        : null,
    currency: (input.currency || "USD").trim().toUpperCase(),
    resolvedDecisionReceiptId: record.decisionReceiptId,
    resolvedRecommendedOperatorId: record.recommendedOperatorId,
    resolvedRecommendedOperatorName: record.recommendedOperatorName,
    resolvedEvidenceVersion: record.evidenceVersion,
    reconciledAt: input.occurredAt?.trim() || new Date().toISOString(),
    duplicateDelivery: false,
  };

  memoryReconciliationByDedupeKey.set(dedupeKey, outcome);
  record.reconciledOutcomes.push(outcome);
  if (
    input.eventType === "BOOKING_CANCELLED" ||
    input.eventType === "BOOKING_REFUNDED"
  ) {
    record.reconciliationState = "cancelled_or_refunded";
  } else {
    record.reconciliationState =
      sourceChannel === "partner_csv" ? "reconciled_csv" : "reconciled_webhook";
  }

  return {
    matched: true,
    outcome,
    ledgerRecord: record,
  };
}

/**
 * Reconciles partner CSV settlement rows (e.g., Viator, GetYourGuide, FareHarbor, or GoSno CSV exports)
 * against the internal Opaque Attribution Ledger using `click_id` (or `campaign`/`sub_id` containing `clk_...`).
 */
export function reconcilePartnerCsvBatchByClickId(params: {
  provider: CommercialProvider;
  csvText: string;
}): PartnerCsvReconciliationSummary {
  const lines = params.csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return {
      totalRows: 0,
      matchedCount: 0,
      unmatchedCount: 0,
      deduplicatedCount: 0,
      reconciledRecords: [],
      unmatchedRows: [],
    };
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idxClickId = headers.findIndex((h) =>
    ["click_id", "clickid", "sub_id", "subid", "campaign", "ref", "external_ref"].includes(h),
  );
  const idxBookingRef = headers.findIndex((h) =>
    ["booking_ref", "bookingref", "provider_booking_ref", "order_id", "reference"].includes(h),
  );
  const idxStatus = headers.findIndex((h) =>
    ["status", "event_type", "booking_status"].includes(h),
  );
  const idxGross = headers.findIndex((h) =>
    ["gross_amount", "gross_revenue_usd", "booking_value", "total_price"].includes(h),
  );
  const idxCommission = headers.findIndex((h) =>
    ["commission_amount", "commission_usd", "estimated_commission"].includes(h),
  );
  const idxPaidCommission = headers.findIndex((h) =>
    ["paid_commission_amount", "paid_commission_usd", "net_payout"].includes(h),
  );
  const idxCurrency = headers.findIndex((h) => ["currency"].includes(h));
  const idxEventTime = headers.findIndex((h) =>
    ["event_time", "occurred_at", "booking_date", "settled_at"].includes(h),
  );

  const reconciledRecords: OpaqueClickReconciledOutcome[] = [];
  const unmatchedRows: PartnerCsvReconciliationSummary["unmatchedRows"] = [];
  let matchedCount = 0;
  let deduplicatedCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const rawClickIdOrTracking = idxClickId >= 0 ? cols[idxClickId] || "" : "";
    const providerBookingRef =
      idxBookingRef >= 0 && cols[idxBookingRef] ? cols[idxBookingRef] : `CSV-ROW-${i}`;
    const rawStatus = (idxStatus >= 0 ? cols[idxStatus] || "" : "BOOKING_CONFIRMED").toUpperCase();

    const eventType: PartnerWebhookReconciliationInput["eventType"] =
      rawStatus.includes("CANCEL")
        ? "BOOKING_CANCELLED"
        : rawStatus.includes("REFUND")
          ? "BOOKING_REFUNDED"
          : rawStatus.includes("FULFILL") || rawStatus.includes("COMPLETE")
            ? "BOOKING_FULFILLED"
            : "BOOKING_CONFIRMED";

    const grossVal = idxGross >= 0 && cols[idxGross] !== "" ? Number(cols[idxGross]) : null;
    const commVal =
      idxCommission >= 0 && cols[idxCommission] !== "" ? Number(cols[idxCommission]) : null;
    const paidVal =
      idxPaidCommission >= 0 && cols[idxPaidCommission] !== ""
        ? Number(cols[idxPaidCommission])
        : null;
    const currency = idxCurrency >= 0 && cols[idxCurrency] ? cols[idxCurrency] : "USD";
    const occurredAt =
      idxEventTime >= 0 && cols[idxEventTime] ? cols[idxEventTime] : new Date().toISOString();

    const res = reconcilePartnerWebhookByClickId(
      {
        clickId: rawClickIdOrTracking,
        trackingParamValue: rawClickIdOrTracking,
        provider: params.provider,
        providerBookingRef,
        eventType,
        grossRevenueUsd: Number.isFinite(grossVal) ? grossVal : null,
        estimatedCommissionUsd: Number.isFinite(commVal) ? commVal : null,
        paidCommissionUsd: Number.isFinite(paidVal) ? paidVal : null,
        currency,
        occurredAt,
      },
      "partner_csv",
    );

    if (res.matched) {
      if (res.outcome.duplicateDelivery) {
        deduplicatedCount++;
      } else {
        matchedCount++;
      }
      reconciledRecords.push(res.outcome);
    } else {
      unmatchedRows.push({
        rowNumber: i,
        rawClickIdOrTracking,
        providerBookingRef,
        reason: "reason" in res ? res.reason : "UNMATCHED",
      });
    }
  }

  return {
    totalRows: lines.length - 1,
    matchedCount,
    unmatchedCount: unmatchedRows.length,
    deduplicatedCount,
    reconciledRecords,
    unmatchedRows,
  };
}
