import crypto from "node:crypto";
import { FORBIDDEN_URL_PII_FIELDS } from "../portfolioNetworkRegistry";
import {
  readDurableLedgerState,
  resetDurableLedgerStateForTests,
  runDurableLedgerTransaction,
  type FunnelVisitorRecord,
} from "../storage/durableTransactionalStore";
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
  "rule_ids",
  "ruleids",
] as const;

export type TrafficClass = "production" | "test";

export interface HandoffTripDetails {
  direction?: "OUTBOUND" | "RETURN" | "ROUND_TRIP" | null;
  tripType?: "ONE_WAY" | "ROUND_TRIP" | null;
  origin?: string | null;
  destination?: string | null;
  routeId?: string | null;
  offerId?: string | null;
  travelDate?: string | null;
  pickupTime?: string | null;
  passengerCount?: number | null;
  standardBagCount?: number | null;
  skiOrOversizeBagCount?: number | null;
  returnDate?: string | null;
  returnPickupTime?: string | null;
  returnRouteId?: string | null;
  originatingPage?: string | null;
  trafficSource?: string | null;
  placementId?: string | null;
  propertySlug?: string | null;
  surface?: string | null;
}

export interface OpaqueClickReconciledOutcome {
  reconciliationId: string;
  clickId: string;
  sourceChannel: "partner_webhook" | "partner_csv";
  provider: CommercialProvider;
  providerBookingRef: string;
  onlineBookingReferences?: string[];
  eventType:
    | "BOOKING_CONFIRMED"
    | "BOOKING_CANCELLED"
    | "BOOKING_REFUNDED"
    | "BOOKING_FULFILLED";
  subtotalRevenueUsd?: number | null;
  feesUsd?: number | null;
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
  isTest?: boolean;
  trafficClass?: TrafficClass;
}

export type AttributionRecordStage = "recommendation" | "outbound_click";

export interface OpaqueClickAttributionRecord {
  clickId: string;
  campaignValue?: string;
  handoffId: string | null;
  decisionReceiptId: string;
  recommendedOperatorId: string;
  recommendedOperatorName: string;
  recommendedVehicleClassId: string | null;
  evidenceVersion: string;
  applicabilityModelVersion: string | null;
  applicabilityOutcomeHash: string | null;
  originatingSite: string;
  originatingPage?: string;
  trafficSource?: string | null;
  visitorId?: string | null;
  placementId?: string | null;
  propertySlug?: string | null;
  surface?: string | null;
  tripDetails?: HandoffTripDetails | null;
  isTest?: boolean;
  trafficClass?: TrafficClass;
  recordStage?: AttributionRecordStage;
  followedAt?: string | null;
  clickCount?: number;
  duplicateDeliveryCount?: number;
  userAgent?: string | null;
  referer?: string | null;
  provider: CommercialProvider;
  productCode: string;
  outboundPartnerUrl: string;
  strippedLeakParams: string[];
  strippedPiiParams?: string[];
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
  originatingPage?: string | null;
  trafficSource?: string | null;
  visitorId?: string | null;
  placementId?: string | null;
  propertySlug?: string | null;
  surface?: string | null;
  tripDetails?: HandoffTripDetails | null;
  isTest?: boolean;
  recordStage?: AttributionRecordStage;
  provider: CommercialProvider;
  productCode: string;
  productDestinationUrl: string;
}

export interface PartnerWebhookReconciliationInput {
  clickId?: string | null;
  referralId?: string | null;
  campaignValue?: string | null;
  trackingParamValue?: string | null;
  onlineBookingReferences?: string[] | null;
  provider: CommercialProvider;
  providerBookingRef: string;
  eventType:
    | "BOOKING_CONFIRMED"
    | "BOOKING_CANCELLED"
    | "BOOKING_REFUNDED"
    | "BOOKING_FULFILLED";
  subtotalRevenueUsd?: number | null;
  feesUsd?: number | null;
  grossRevenueUsd?: number | null;
  estimatedCommissionUsd?: number | null;
  paidCommissionUsd?: number | null;
  currency?: string | null;
  occurredAt?: string | null;
  isTest?: boolean;
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

export interface TrafficSourceFunnelBreakdown {
  visitors: number;
  guestVisits: number;
  guideVisits: number;
  storefrontVisits: number;
  viatorClicks: number;
  providerConfirmedBookings: number;
  settledCommissionUsd: number;
}

export interface FunnelClassMetrics {
  trafficClass: TrafficClass;
  newVisitors: number;
  guestVisits: number;
  guideVisits: number;
  storefrontVisits: number;
  planOpens: number;
  recommendationsIssued: number;
  recommendationOnlyRecords: number;
  followedHandoffs: number;
  actualOutboundClicks: number;
  viatorClicks: number;
  confirmedPaidBookings: number;
  paidCommissionsCount: number;
  cancelledOrRefundedBookings: number;
  duplicateDeliveriesIgnored: number;
  grossConfirmedRevenueUsd: number;
  estimatedUnsettledCommissionUsd: number;
  settledReconciledCommissionUsd: number;
  reversedCommissionUsd: number;
  byTrafficSource: Record<string, TrafficSourceFunnelBreakdown>;
  byDirection: {
    OUTBOUND: { handoffs: number; confirmedPaidBookings: number };
    RETURN: { handoffs: number; confirmedPaidBookings: number };
    ROUND_TRIP: { handoffs: number; confirmedPaidBookings: number };
  };
}

export interface FunnelMetricsReport {
  generatedAt: string;
  filter: {
    routeId: string | null;
    originatingPage: string | null;
    placementId?: string | null;
    propertySlug?: string | null;
  };
  production: FunnelClassMetrics;
  test: FunnelClassMetrics;
}

const DEV_FALLBACK_ADMIN_SECRET = "dcc-commerce-admin-secret-v1";
const DEV_FALLBACK_WEBHOOK_SECRET = "dcc-partner-webhook-secret-v1";

function makeCommerceAuthError(
  message: string,
  code: string,
  statusCode: 401 | 403 | 503 = 401,
): Error & { code: string; statusCode: number } {
  const err = new Error(message) as Error & { code: string; statusCode: number };
  err.code = code;
  err.statusCode = statusCode;
  return err;
}

function safeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function isProductionCommerceCredentialsRequired(): boolean {
  const explicitFlag = process.env.DCC_REQUIRE_PRODUCTION_CREDENTIALS
    ?.trim()
    .toLowerCase();
  if (explicitFlag === "1" || explicitFlag === "true") {
    return true;
  }
  if (explicitFlag === "0" || explicitFlag === "false") {
    return false;
  }
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  );
}

export function resolveCommerceAdminSecret(): string {
  const configured =
    process.env.DCC_COMMERCE_ADMIN_SECRET?.trim() ||
    process.env.INTERNAL_API_SECRET?.trim() ||
    "";
  if (isProductionCommerceCredentialsRequired()) {
    if (!configured || configured === DEV_FALLBACK_ADMIN_SECRET) {
      throw makeCommerceAuthError(
        "Production commerce administrator credentials are not configured. Set DCC_COMMERCE_ADMIN_SECRET or INTERNAL_API_SECRET.",
        "COMMERCE_CREDENTIALS_NOT_CONFIGURED",
        503,
      );
    }
    return configured;
  }
  return configured || DEV_FALLBACK_ADMIN_SECRET;
}

export function resolvePartnerWebhookSecret(): string {
  const configured =
    process.env.DCC_PARTNER_WEBHOOK_SECRET?.trim() ||
    process.env.INTERNAL_API_SECRET?.trim() ||
    "";
  if (isProductionCommerceCredentialsRequired()) {
    if (!configured || configured === DEV_FALLBACK_WEBHOOK_SECRET) {
      throw makeCommerceAuthError(
        "Production partner webhook credentials are not configured. Set DCC_PARTNER_WEBHOOK_SECRET or INTERNAL_API_SECRET.",
        "WEBHOOK_CREDENTIALS_NOT_CONFIGURED",
        503,
      );
    }
    return configured;
  }
  return configured || DEV_FALLBACK_WEBHOOK_SECRET;
}

export function issueCommerceAdminToken(
  scope = "commerce:admin",
  secret?: string,
): string {
  const key = secret || resolveCommerceAdminSecret();
  const mac = crypto
    .createHmac("sha256", key)
    .update(`dcc-commerce-admin-v1:${scope}`, "utf8")
    .digest("hex");
  return `cadm.${scope}.${mac}`;
}

export function signPartnerWebhookPayload(
  rawBody: string,
  secret?: string,
): string {
  const key = secret || resolvePartnerWebhookSecret();
  const digest = crypto
    .createHmac("sha256", key)
    .update(rawBody, "utf8")
    .digest("hex");
  return `sha256=${digest}`;
}

function extractBearerHeader(request: Request): string {
  const auth = request.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return "";
  return auth.slice(7).trim();
}

export function authenticateCommerceAdminRequest(request: Request): {
  authorized: true;
  actor: string;
} {
  // Enforce production credential configuration first so requests fail closed if env secrets are absent.
  const rawAdminSecret = resolveCommerceAdminSecret();

  const token =
    request.headers.get("x-dcc-commerce-admin-token")?.trim() ||
    request.headers.get("x-internal-secret")?.trim() ||
    extractBearerHeader(request);

  if (!token) {
    throw makeCommerceAuthError(
      "Internal attribution administration requires x-dcc-commerce-admin-token or Bearer authentication.",
      "COMMERCE_AUTH_REQUIRED",
      401,
    );
  }

  if (token.startsWith("cadm.")) {
    const lastDot = token.lastIndexOf(".");
    if (lastDot > 5) {
      const scope = token.slice(5, lastDot);
      const expectedScopedToken = issueCommerceAdminToken(
        scope,
        rawAdminSecret,
      );
      if (safeEqualStrings(token, expectedScopedToken)) {
        return { authorized: true, actor: scope };
      }
    }
  }

  if (safeEqualStrings(token, rawAdminSecret)) {
    return { authorized: true, actor: "commerce:admin" };
  }

  throw makeCommerceAuthError(
    "Invalid commerce administrator credentials.",
    "COMMERCE_INVALID_CREDENTIALS",
    401,
  );
}

export function authenticatePartnerWebhookOrAdminRequest(
  request: Request,
  rawBody: string,
): {
  authorized: true;
  method: "webhook_hmac" | "commerce_admin";
} {
  const sigHeader = request.headers.get("x-dcc-webhook-signature")?.trim();
  if (sigHeader) {
    const webhookSecret = resolvePartnerWebhookSecret();
    const expectedSig = signPartnerWebhookPayload(rawBody, webhookSecret);
    if (!safeEqualStrings(sigHeader, expectedSig)) {
      throw makeCommerceAuthError(
        "Partner webhook HMAC signature verification failed.",
        "WEBHOOK_SIGNATURE_INVALID",
        401,
      );
    }
    return { authorized: true, method: "webhook_hmac" };
  }

  const hasAdminHeaders = Boolean(
    request.headers.get("x-dcc-commerce-admin-token")?.trim() ||
      request.headers.get("x-internal-secret")?.trim() ||
      extractBearerHeader(request),
  );

  if (hasAdminHeaders) {
    authenticateCommerceAdminRequest(request);
    return { authorized: true, method: "commerce_admin" };
  }

  if (isProductionCommerceCredentialsRequired()) {
    // Ensure production credentials are configured before reporting missing request header
    const hasConfiguredWebhook = Boolean(
      process.env.DCC_PARTNER_WEBHOOK_SECRET?.trim() ||
        process.env.INTERNAL_API_SECRET?.trim(),
    );
    const hasConfiguredAdmin = Boolean(
      process.env.DCC_COMMERCE_ADMIN_SECRET?.trim() ||
        process.env.INTERNAL_API_SECRET?.trim(),
    );
    if (!hasConfiguredWebhook && !hasConfiguredAdmin) {
      throw makeCommerceAuthError(
        "Production reconciliation credentials are not configured (set DCC_PARTNER_WEBHOOK_SECRET, DCC_COMMERCE_ADMIN_SECRET, or INTERNAL_API_SECRET).",
        "WEBHOOK_CREDENTIALS_NOT_CONFIGURED",
        503,
      );
    }
  }

  throw makeCommerceAuthError(
    "Partner webhook reconciliation requires a valid x-dcc-webhook-signature HMAC header or commerce admin credentials.",
    "WEBHOOK_SIGNATURE_REQUIRED",
    401,
  );
}

export function resetOpaqueAttributionLedgerForTests(): void {
  resetDurableLedgerStateForTests(true);
}

export function isQaReferralId(value?: string | null): boolean {
  if (!value || typeof value !== "string") return false;
  return /^clk[_-]?qa[_-]?[0-9a-f]{20}$/i.test(value.trim());
}

export function toViatorCampaignToken(clickId: string): string {
  const norm =
    extractClickIdFromTrackingValue(clickId) || clickId.trim().toLowerCase();
  const qaMatch = norm.match(/^clk[_-]?qa[_-]?([0-9a-f]{20})$/i);
  if (qaMatch) {
    return `clkqa${qaMatch[1].toLowerCase()}`;
  }
  const prodMatch = norm.match(/^clk[_-]?([0-9a-f]{24})$/i);
  if (prodMatch) {
    return `clk${prodMatch[1].toLowerCase()}`;
  }
  return norm.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 42);
}

export function fromViatorCampaignTokenToClickId(
  value?: string | null,
): string | null {
  return extractClickIdFromTrackingValue(value);
}

export function generateOpaqueClickId(options?: { isTest?: boolean }): string {
  if (options?.isTest) {
    return `clk_qa_${crypto.randomBytes(10).toString("hex")}`;
  }
  return `clk_${crypto.randomBytes(12).toString("hex")}`;
}

export function issueCheckoutIntentReferralId(options?: {
  isTest?: boolean;
}): string {
  return generateOpaqueClickId(options);
}

export function deriveServerReferralIdForOffer(params: {
  sailingCode?: string | null;
  productCode: string;
  optionCode?: string | null;
  placementId?: string | null;
  propertySlug?: string | null;
  date?: string | null;
  adults?: number | null;
  isTest?: boolean;
}): string {
  const canonical = [
    (params.sailingCode || "").trim().toUpperCase(),
    params.productCode.trim(),
    (params.optionCode || "DEFAULT").trim().toUpperCase(),
    (params.placementId || "").trim().toLowerCase(),
    (params.propertySlug || "").trim().toLowerCase(),
    (params.date || "").trim(),
    String(params.adults ?? 2),
  ].join("|");
  const digest = crypto
    .createHash("sha256")
    .update(`dcc-referral-v1:${canonical}`, "utf8")
    .digest("hex");
  if (params.isTest) {
    return `clk_qa_${digest.slice(0, 20)}`;
  }
  return `clk_${digest.slice(0, 24)}`;
}

const HANDOFF_SIGNING_FALLBACK_SECRET = "dcc-approved-handoff-signing-secret-v1";

function resolveHandoffSigningSecret(): string {
  return (
    process.env.DCC_HANDOFF_SIGNING_SECRET?.trim() ||
    process.env.INTERNAL_API_SECRET?.trim() ||
    process.env.DCC_COMMERCE_ADMIN_SECRET?.trim() ||
    HANDOFF_SIGNING_FALLBACK_SECRET
  );
}

export interface ApprovedHandoffSignaturePayload {
  clickId: string;
  offer: string;
  option?: string | null;
  sailing?: string | null;
  placementId?: string | null;
  property?: string | null;
  date?: string | null;
  adults?: number | string | null;
  target?: string | null;
}

export function signApprovedCheckoutHandoff(
  payload: ApprovedHandoffSignaturePayload,
): string {
  const canonical = [
    payload.clickId.trim().toLowerCase(),
    payload.offer.trim(),
    (payload.option || "").trim(),
    (payload.sailing || "").trim(),
    (payload.placementId || "").trim(),
    (payload.property || "").trim(),
    (payload.date || "").trim(),
    String(payload.adults ?? "").trim(),
    (payload.target || "").trim(),
  ].join("|");
  return crypto
    .createHmac("sha256", resolveHandoffSigningSecret())
    .update(`dcc-handoff-v1:${canonical}`, "utf8")
    .digest("hex")
    .slice(0, 32);
}

export function verifyApprovedCheckoutHandoffSignature(
  payload: ApprovedHandoffSignaturePayload,
  signature?: string | null,
): boolean {
  if (!signature || typeof signature !== "string") return false;
  const sigLower = signature.trim().toLowerCase();
  const expectedDirect = signApprovedCheckoutHandoff(payload).toLowerCase();
  if (safeEqualStrings(sigLower, expectedDirect)) return true;

  // Also allow signatures computed against the deterministic offer template ID or empty clickId
  // when a fresh per-intent referral ID is minted for this guest's click.
  const templateProdClickId = deriveServerReferralIdForOffer({
    sailingCode: payload.sailing || "",
    productCode: payload.offer,
    optionCode: payload.option || "DEFAULT",
    placementId: payload.placementId || "",
    propertySlug: payload.property || "",
    date: payload.date || "",
    adults: Number(payload.adults) || 2,
    isTest: false,
  });
  const expectedTemplateProd = signApprovedCheckoutHandoff({
    ...payload,
    clickId: templateProdClickId,
  }).toLowerCase();
  if (safeEqualStrings(sigLower, expectedTemplateProd)) return true;

  const expectedEmptyClickId = signApprovedCheckoutHandoff({
    ...payload,
    clickId: "",
  }).toLowerCase();
  return safeEqualStrings(sigLower, expectedEmptyClickId);
}

export function extractClickIdFromTrackingValue(
  value?: string | null,
): string | null {
  if (!value || typeof value !== "string") return null;
  const qaMatch = value.match(/clk[_-]?qa[_-]?([0-9a-f]{20})/i);
  if (qaMatch) {
    return `clk_qa_${qaMatch[1].toLowerCase()}`;
  }
  const match = value.match(/clk[_-]?([0-9a-f]{24})/i);
  return match ? `clk_${match[1].toLowerCase()}` : null;
}

/**
 * Strips any cryptographic decision receipt IDs, bundle hashes, universe hashes,
 * evidence versions, or personal data (FORBIDDEN_URL_PII_FIELDS / email / phone)
 * from the outbound partner URL and appends the opaque `click_id`.
 */
export function sanitizeOutboundPartnerUrlWithOpaqueClickId(
  targetUrlInput: string | URL,
  clickId: string,
): {
  outboundUrl: string;
  strippedLeakParams: string[];
  strippedPiiParams: string[];
} {
  const url =
    typeof targetUrlInput === "string"
      ? new URL(targetUrlInput)
      : new URL(targetUrlInput.toString());

  const forbiddenArchSet = new Set<string>(
    FORBIDDEN_OUTBOUND_ARCHITECTURE_PARAMS,
  );
  const forbiddenPiiSet = new Set<string>(FORBIDDEN_URL_PII_FIELDS);
  const forbiddenPiiCompactSet = new Set<string>(
    FORBIDDEN_URL_PII_FIELDS.map((field) => field.replace(/[^a-z0-9]/g, "")),
  );
  const strippedLeakParams: string[] = [];
  const strippedPiiParams: string[] = [];

  for (const key of Array.from(url.searchParams.keys())) {
    const rawLower = key.trim().toLowerCase();
    const normalized = rawLower.replace(/[^a-z0-9_]/g, "");
    const compact = rawLower.replace(/[^a-z0-9]/g, "");
    const val = (url.searchParams.get(key) || "").trim();

    const looksLikeEmailValue = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    const isForbiddenPii =
      forbiddenPiiSet.has(normalized) ||
      forbiddenPiiSet.has(rawLower) ||
      forbiddenPiiCompactSet.has(compact) ||
      looksLikeEmailValue;

    const isForbiddenArch =
      forbiddenArchSet.has(normalized) ||
      forbiddenArchSet.has(rawLower) ||
      val.includes("rcpt:sha256:") ||
      val.includes("evalrun:");

    if (isForbiddenArch || isForbiddenPii) {
      strippedLeakParams.push(key);
      if (isForbiddenPii) {
        strippedPiiParams.push(key);
      }
      url.searchParams.delete(key);
    }
  }

  url.searchParams.set("click_id", clickId);

  return {
    outboundUrl: url.toString(),
    strippedLeakParams,
    strippedPiiParams,
  };
}

function inferTripDetailsFromUrlAndInput(
  outboundUrl: string,
  input: IssueOpaqueClickAttributionInput,
): HandoffTripDetails | null {
  try {
    const parsed = new URL(outboundUrl);
    const sp = parsed.searchParams;
    const explicit = input.tripDetails ?? {};

    const rawDir = (
      explicit.direction ||
      sp.get("direction") ||
      ""
    )
      .trim()
      .toUpperCase();
    const rawTripType = (
      explicit.tripType ||
      sp.get("tripType") ||
      ""
    )
      .trim()
      .toUpperCase();

    const direction: HandoffTripDetails["direction"] =
      rawDir === "ROUND_TRIP" || rawTripType === "ROUND_TRIP"
        ? "ROUND_TRIP"
        : rawDir === "RETURN" || rawDir === "RESORT_TO_AIRPORT"
          ? "RETURN"
          : rawDir === "OUTBOUND" || rawDir === "AIRPORT_TO_RESORT"
            ? "OUTBOUND"
            : null;

    const tripType: HandoffTripDetails["tripType"] =
      rawTripType === "ROUND_TRIP" || direction === "ROUND_TRIP"
        ? "ROUND_TRIP"
        : rawTripType === "ONE_WAY" ||
            direction === "OUTBOUND" ||
            direction === "RETURN"
          ? "ONE_WAY"
          : null;

    const paxRaw =
      explicit.passengerCount ??
      (sp.get("passengers") || sp.get("passengerCount") || sp.get("party_size")
        ? Number(
            sp.get("passengers") ||
              sp.get("passengerCount") ||
              sp.get("party_size"),
          )
        : null);
    const stdBagsRaw =
      explicit.standardBagCount ??
      (sp.get("standardBags") !== null ? Number(sp.get("standardBags")) : null);
    const skiBagsRaw =
      explicit.skiOrOversizeBagCount ??
      (sp.get("skiBags") !== null
        ? Number(sp.get("skiBags"))
        : sp.get("luggage") !== null
          ? Number(sp.get("luggage"))
          : null);

    const originatingPage =
      explicit.originatingPage?.trim() ||
      input.originatingPage?.trim() ||
      sp.get("originatingPage")?.trim() ||
      sp.get("sourcePage")?.trim() ||
      null;
    const placementId =
      explicit.placementId?.trim() ||
      input.placementId?.trim() ||
      sp.get("placementId")?.trim() ||
      sp.get("placement")?.trim() ||
      sp.get("dcc_placement_id")?.trim() ||
      null;
    const propertySlug =
      explicit.propertySlug?.trim() ||
      input.propertySlug?.trim() ||
      sp.get("property")?.trim() ||
      sp.get("propertySlug")?.trim() ||
      sp.get("dcc_property")?.trim() ||
      null;
    const surface =
      explicit.surface?.trim() ||
      input.surface?.trim() ||
      sp.get("surface")?.trim() ||
      input.originatingSite?.trim() ||
      null;

    const details: HandoffTripDetails = {
      direction,
      tripType,
      origin: explicit.origin?.trim() || sp.get("origin")?.trim() || null,
      destination:
        explicit.destination?.trim() || sp.get("destination")?.trim() || null,
      routeId: explicit.routeId?.trim() || sp.get("routeId")?.trim() || null,
      offerId: explicit.offerId?.trim() || sp.get("offerId")?.trim() || null,
      travelDate:
        explicit.travelDate?.trim() ||
        sp.get("date")?.trim() ||
        sp.get("dcc_date")?.trim() ||
        sp.get("outboundDate")?.trim() ||
        null,
      pickupTime:
        explicit.pickupTime?.trim() ||
        sp.get("pickupTime")?.trim() ||
        sp.get("dcc_departure_time")?.trim() ||
        null,
      passengerCount:
        typeof paxRaw === "number" && Number.isFinite(paxRaw) ? paxRaw : null,
      standardBagCount:
        typeof stdBagsRaw === "number" && Number.isFinite(stdBagsRaw)
          ? stdBagsRaw
          : null,
      skiOrOversizeBagCount:
        typeof skiBagsRaw === "number" && Number.isFinite(skiBagsRaw)
          ? skiBagsRaw
          : null,
      returnDate:
        explicit.returnDate?.trim() || sp.get("returnDate")?.trim() || null,
      returnPickupTime:
        explicit.returnPickupTime?.trim() ||
        sp.get("returnPickupTime")?.trim() ||
        null,
      returnRouteId:
        explicit.returnRouteId?.trim() ||
        sp.get("returnRouteId")?.trim() ||
        null,
      originatingPage,
      placementId,
      propertySlug,
      surface,
    };

    const hasAnyField = Object.values(details).some(
      (v) => v !== null && v !== undefined,
    );
    return hasAnyField ? details : null;
  } catch {
    return input.tripDetails ?? null;
  }
}

const VERIFICATION_SCRIPT_CLICK_IDS = new Set([
  "clk_4fdca16a282d2c8f784f69d5",
  "clk_7e6a5576c953158475eac966",
  "clk_40138f7e2d251f013ae21981",
  "clk_f8d18ac5f2c291188073f718",
  "clk_23145740401ed122a99e67af",
  "clk_84b32294ed9614fe626829d3",
]);

export function isDemoOrAutomatedVerificationTraffic(params: {
  clickId?: string | null;
  isTest?: boolean;
  originatingPage?: string | null;
  decisionReceiptId?: string | null;
  handoffId?: string | null;
  userAgent?: string | null;
  referer?: string | null;
}): boolean {
  if (params.isTest === true) return true;
  const cid = String(params.clickId || "").trim().toLowerCase();
  if (cid && (isQaReferralId(cid) || VERIFICATION_SCRIPT_CLICK_IDS.has(cid))) {
    return true;
  }
  const page = String(params.originatingPage || "").toLowerCase();
  if (
    page.includes("/demo/") ||
    page.includes("demo/concierge-widget") ||
    page.includes("/qa") ||
    page.includes("playwright")
  ) {
    return true;
  }
  const ref = String(params.referer || "").toLowerCase();
  if (ref.includes("/demo/concierge-widget") || ref.includes("/demo/")) {
    return true;
  }
  const ua = String(params.userAgent || "").trim().toLowerCase();
  if (
    ua.includes("headlesschrome") ||
    ua.includes("playwright") ||
    ua.includes("puppeteer") ||
    /^node\b/.test(ua) ||
    ua.includes("undici") ||
    ua.startsWith("curl/") ||
    ua.includes("python-requests")
  ) {
    return true;
  }
  const rcpt = String(params.decisionReceiptId || "");
  if (
    rcpt === "rcpt:sha256:bc44b315bdcb8ed5d4a806ed2ed729b76b26621a1a28bb1eda5596271d22ead0" ||
    /:(test|sim|qa|e2e):/i.test(rcpt)
  ) {
    return true;
  }
  const hoff = String(params.handoffId || "");
  if (/^(test|sim|qa|e2e)[-_]/i.test(hoff)) {
    return true;
  }
  return false;
}

export function inferTrafficSource(params: {
  trafficSource?: string | null;
  sourcePage?: string | null;
  originatingPage?: string | null;
  referer?: string | null;
}): string {
  const candidates = [
    params.sourcePage,
    params.originatingPage,
    params.referer,
  ].filter((v): v is string => typeof v === "string" && v.trim().length > 0);

  for (const raw of candidates) {
    const qIdx = raw.indexOf("?");
    if (qIdx >= 0) {
      const sp = new URLSearchParams(raw.slice(qIdx + 1));
      const gadCamp = sp.get("gad_campaignid")?.trim();
      if (gadCamp) return `google-ads-${gadCamp}`.slice(0, 80);
      if (sp.get("gclid") || sp.get("gbraid") || sp.get("wbraid") || sp.get("gad_source")) {
        return "google-ads";
      }
      const explicitSrc = (sp.get("src") || sp.get("source") || sp.get("trafficSource") || "").trim();
      if (explicitSrc && !/^google[-_]?ads/i.test(explicitSrc)) {
        return explicitSrc.slice(0, 80);
      }
      const utmSrc = sp.get("utm_source")?.trim().toLowerCase();
      if (utmSrc) {
        if (utmSrc === "google" || utmSrc.includes("google.")) return "google-search";
        return utmSrc.slice(0, 80);
      }
    }
  }

  const explicit = (params.trafficSource || "").trim();
  if (explicit && explicit !== "wtonot-unknown" && !/^google[-_]?ads/i.test(explicit)) {
    return explicit.slice(0, 80);
  }

  for (const raw of candidates) {
    const lower = raw.toLowerCase();
    if (
      lower.includes("/guides/best-swamp-tour-with-transportation") ||
      lower.includes("best-swamp-tour-with-transportation") ||
      lower.includes("/guides/")
    ) {
      return "wno-swamp-guide";
    }
    if (lower.includes("/swamp-tours")) {
      return "wno-swamp-storefront";
    }
  }

  return "direct-or-other";
}

export function issueOpaqueClickAttribution(
  input: IssueOpaqueClickAttributionInput,
): OpaqueClickAttributionRecord {
  const preEvaluatedTest = isDemoOrAutomatedVerificationTraffic({
    isTest: input.isTest,
    originatingPage: input.originatingPage,
    decisionReceiptId: input.decisionReceiptId,
    handoffId: input.handoffId,
  });
  const normalizedInputClickId = extractClickIdFromTrackingValue(input.clickId);
  const clickId =
    normalizedInputClickId &&
    Boolean(isQaReferralId(normalizedInputClickId)) === Boolean(preEvaluatedTest)
      ? normalizedInputClickId
      : generateOpaqueClickId({ isTest: preEvaluatedTest });

  return runDurableLedgerTransaction((state) => {
    const existing = state.opaqueClicksById[clickId];
    if (existing) return existing;

    const { outboundUrl, strippedLeakParams, strippedPiiParams } =
      sanitizeOutboundPartnerUrlWithOpaqueClickId(
        input.productDestinationUrl,
        clickId,
      );

    const inferredTripDetails = inferTripDetailsFromUrlAndInput(
      outboundUrl,
      input,
    );
    const resolvedOriginatingPage =
      inferredTripDetails?.originatingPage ||
      input.originatingPage?.trim() ||
      "/transportation/colorado";
    const resolvedPlacementId =
      input.placementId?.trim() ||
      inferredTripDetails?.placementId ||
      null;
    const resolvedPropertySlug =
      input.propertySlug?.trim() ||
      inferredTripDetails?.propertySlug ||
      null;
    const resolvedSurface =
      input.surface?.trim() ||
      inferredTripDetails?.surface ||
      input.originatingSite?.trim() ||
      null;
    const resolvedTrafficSource = inferTrafficSource({
      trafficSource: input.trafficSource || inferredTripDetails?.trafficSource,
      originatingPage: resolvedOriginatingPage,
    });
    const isTest =
      isQaReferralId(clickId) ||
      isDemoOrAutomatedVerificationTraffic({
        isTest: input.isTest,
        originatingPage: resolvedOriginatingPage,
        decisionReceiptId: input.decisionReceiptId,
        handoffId: input.handoffId,
      });
    const trafficClass: TrafficClass = isTest ? "test" : "production";
    const recordStage: AttributionRecordStage =
      input.recordStage === "recommendation" ? "recommendation" : "outbound_click";
    const nowIso = new Date().toISOString();

    const campaignValue = toViatorCampaignToken(clickId);
    const record: OpaqueClickAttributionRecord = {
      clickId,
      campaignValue,
      handoffId: input.handoffId?.trim() || null,
      decisionReceiptId: input.decisionReceiptId.trim(),
      recommendedOperatorId: input.recommendedOperatorId.trim(),
      recommendedOperatorName:
        input.recommendedOperatorName?.trim() ||
        input.recommendedOperatorId.trim(),
      recommendedVehicleClassId:
        input.recommendedVehicleClassId?.trim() || null,
      evidenceVersion: input.evidenceVersion.trim(),
      applicabilityModelVersion:
        input.applicabilityModelVersion?.trim() || null,
      applicabilityOutcomeHash: input.applicabilityOutcomeHash?.trim() || null,
      originatingSite:
        input.originatingSite?.trim() || "destinationcommandcenter.com",
      originatingPage: resolvedOriginatingPage,
      trafficSource: resolvedTrafficSource,
      visitorId: input.visitorId?.trim() || null,
      placementId: resolvedPlacementId,
      propertySlug: resolvedPropertySlug,
      surface: resolvedSurface,
      tripDetails: inferredTripDetails
        ? { ...inferredTripDetails, trafficSource: resolvedTrafficSource }
        : null,
      isTest,
      trafficClass,
      recordStage,
      followedAt: recordStage === "outbound_click" ? nowIso : null,
      clickCount: recordStage === "outbound_click" ? 1 : 0,
      duplicateDeliveryCount: 0,
      provider: input.provider,
      productCode: input.productCode.trim(),
      outboundPartnerUrl: outboundUrl,
      strippedLeakParams,
      strippedPiiParams,
      reconciliationState: "pending_partner_event",
      reconciledOutcomes: [],
      createdAt: nowIso,
    };

    state.opaqueClicksById[clickId] = record;
    state.opaqueClickIdsByHandoffId[campaignValue] = clickId;
    if (record.handoffId) {
      state.opaqueClickIdsByHandoffId[record.handoffId] = clickId;
    }

    return record;
  });
}

export function recordOutboundClickFollow(
  clickIdInput: string,
  options?: {
    isTest?: boolean;
    userAgent?: string | null;
    referer?: string | null;
    placementId?: string | null;
    propertySlug?: string | null;
    trafficSource?: string | null;
    visitorId?: string | null;
  },
): OpaqueClickAttributionRecord | null {
  const norm = extractClickIdFromTrackingValue(clickIdInput) || clickIdInput.trim().toLowerCase();
  if (!norm) return null;
  return runDurableLedgerTransaction((state) => {
    const rec = state.opaqueClicksById[norm];
    if (!rec) return null;
    const isFollowTest = isDemoOrAutomatedVerificationTraffic({
      isTest: options?.isTest,
      originatingPage: rec.originatingPage,
      decisionReceiptId: rec.decisionReceiptId,
      handoffId: rec.handoffId,
      userAgent: options?.userAgent,
      referer: options?.referer,
    });
    // Never allow a QA test click to mutate a production guest's ledger record (or vice versa)
    if (Boolean(rec.isTest) !== Boolean(isFollowTest)) {
      return null;
    }
    const nowIso = new Date().toISOString();
    rec.recordStage = "outbound_click";
    rec.followedAt = rec.followedAt || nowIso;
    rec.clickCount = (rec.clickCount || 0) + 1;
    if (!rec.campaignValue) {
      rec.campaignValue = toViatorCampaignToken(rec.clickId);
    }
    if (options?.placementId && !rec.placementId) {
      rec.placementId = options.placementId.trim();
    }
    if (options?.propertySlug && !rec.propertySlug) {
      rec.propertySlug = options.propertySlug.trim();
    }
    if (options?.trafficSource || options?.referer) {
      rec.trafficSource = inferTrafficSource({
        trafficSource: options?.trafficSource || rec.trafficSource,
        originatingPage: rec.originatingPage,
        referer: options?.referer || rec.referer,
      });
    }
    if (options?.visitorId && !rec.visitorId) {
      rec.visitorId = options.visitorId.trim();
    }
    return rec;
  });
}

export function getOpaqueClickAttributionById(
  clickId: string,
): OpaqueClickAttributionRecord | null {
  if (!clickId) return null;
  const state = readDurableLedgerState();
  const norm =
    extractClickIdFromTrackingValue(clickId) || clickId.trim().toLowerCase();
  return (
    state.opaqueClicksById[norm] ||
    state.opaqueClicksById[clickId.trim().toLowerCase()] ||
    null
  );
}

export function listReconciledOutcomesForClickId(
  clickId: string,
): OpaqueClickReconciledOutcome[] {
  const record = getOpaqueClickAttributionById(clickId);
  return record ? record.reconciledOutcomes : [];
}

export function getOpaqueClickAttributionByHandoffId(
  handoffId: string,
): OpaqueClickAttributionRecord | null {
  if (!handoffId) return null;
  const state = readDurableLedgerState();
  const clickId = state.opaqueClickIdsByHandoffId[handoffId.trim()];
  if (!clickId) return null;
  return state.opaqueClicksById[clickId] || null;
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
  const cleanedRefs = Array.isArray(input.onlineBookingReferences)
    ? input.onlineBookingReferences
        .filter((r): r is string => typeof r === "string" && r.trim().length > 0)
        .map((r) => r.trim())
    : [];

  const resolvedClickId =
    extractClickIdFromTrackingValue(input.referralId) ||
    extractClickIdFromTrackingValue(input.clickId) ||
    extractClickIdFromTrackingValue(input.campaignValue) ||
    extractClickIdFromTrackingValue(input.trackingParamValue) ||
    cleanedRefs
      .map((ref) => extractClickIdFromTrackingValue(ref))
      .find((id): id is string => Boolean(id)) ||
    null;

  if (!resolvedClickId) {
    return {
      matched: false,
      reason: "NO_OPAQUE_CLICK_ID_PRESENT",
    };
  }

  return runDurableLedgerTransaction((state) => {
    const record = state.opaqueClicksById[resolvedClickId];
    if (!record) {
      return {
        matched: false as const,
        reason: `UNKNOWN_OPAQUE_CLICK_ID:${resolvedClickId}`,
      };
    }

    const trimmedRef = input.providerBookingRef.trim();
    const isTestEvent = Boolean(
      input.isTest ||
        isQaReferralId(resolvedClickId) ||
        /^(TEST|SIM|QA|SANDBOX)[-_]|[-_](TEST|SIM|QA|SANDBOX)[-_]/i.test(
          trimmedRef,
        ),
    );
    const isRecordTest = Boolean(
      record.isTest ||
        record.trafficClass === "test" ||
        isQaReferralId(record.clickId),
    );

    // Strict QA isolation: a test replay can NEVER mutate a production guest's ledger record,
    // and a production webhook event can NEVER reconcile against a QA referral ID.
    if (isTestEvent && !isRecordTest) {
      return {
        matched: false as const,
        reason: `QA_TEST_REPLAY_ISOLATED_FROM_PRODUCTION_RECORD:${record.clickId}`,
      };
    }
    if (!isTestEvent && isRecordTest) {
      return {
        matched: false as const,
        reason: `PRODUCTION_EVENT_CANNOT_MUTATE_QA_TEST_RECORD:${record.clickId}`,
      };
    }

    const dedupeKey = `${record.clickId}::${input.provider}::${trimmedRef}::${input.eventType}`;
    const existingOutcome = state.reconciliationByDedupeKey[dedupeKey];
    if (existingOutcome) {
      record.duplicateDeliveryCount = (record.duplicateDeliveryCount || 0) + 1;
      return {
        matched: true as const,
        outcome: { ...existingOutcome, duplicateDelivery: true },
        ledgerRecord: record,
      };
    }

    const isTestOutcome = isRecordTest;
    const trafficClass: TrafficClass = isTestOutcome ? "test" : "production";

    const outcome: OpaqueClickReconciledOutcome = {
      reconciliationId: `rec_${crypto.randomBytes(10).toString("hex")}`,
      clickId: record.clickId,
      sourceChannel,
      provider: input.provider,
      providerBookingRef: trimmedRef,
      onlineBookingReferences: cleanedRefs.length > 0 ? cleanedRefs : undefined,
      eventType: input.eventType,
      subtotalRevenueUsd:
        typeof input.subtotalRevenueUsd === "number" &&
        Number.isFinite(input.subtotalRevenueUsd)
          ? Number(input.subtotalRevenueUsd.toFixed(2))
          : null,
      feesUsd:
        typeof input.feesUsd === "number" &&
        Number.isFinite(input.feesUsd)
          ? Number(input.feesUsd.toFixed(2))
          : null,
      grossRevenueUsd:
        typeof input.grossRevenueUsd === "number" &&
        Number.isFinite(input.grossRevenueUsd)
          ? Number(input.grossRevenueUsd.toFixed(2))
          : null,
      estimatedCommissionUsd:
        typeof input.estimatedCommissionUsd === "number" &&
        Number.isFinite(input.estimatedCommissionUsd)
          ? Number(input.estimatedCommissionUsd.toFixed(2))
          : null,
      paidCommissionUsd:
        typeof input.paidCommissionUsd === "number" &&
        Number.isFinite(input.paidCommissionUsd)
          ? Number(input.paidCommissionUsd.toFixed(2))
          : null,
      currency: (input.currency || "USD").trim().toUpperCase(),
      resolvedDecisionReceiptId: record.decisionReceiptId,
      resolvedRecommendedOperatorId: record.recommendedOperatorId,
      resolvedRecommendedOperatorName: record.recommendedOperatorName,
      resolvedEvidenceVersion: record.evidenceVersion,
      reconciledAt: input.occurredAt?.trim() || new Date().toISOString(),
      duplicateDelivery: false,
      isTest: isTestOutcome,
      trafficClass,
    };

    state.reconciliationByDedupeKey[dedupeKey] = outcome;
    record.reconciledOutcomes.push(outcome);
    if (
      input.eventType === "BOOKING_CANCELLED" ||
      input.eventType === "BOOKING_REFUNDED"
    ) {
      record.reconciliationState = "cancelled_or_refunded";
    } else {
      record.reconciliationState =
        sourceChannel === "partner_csv"
          ? "reconciled_csv"
          : "reconciled_webhook";
    }

    return {
      matched: true as const,
      outcome,
      ledgerRecord: record,
    };
  });
}

/**
 * Reconciles partner CSV settlement rows (e.g., Viator, GetYourGuide, FareHarbor, or GoSno CSV exports)
 * against the internal Opaque Attribution Ledger using `click_id` (or `campaignValue`/`campaign`/`sub_id` containing `clk_...`).
 */
export function reconcilePartnerCsvBatchByClickId(params: {
  provider: CommercialProvider;
  csvText: string;
  isTest?: boolean;
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

  const parseCsvLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === "," && !inQuotes) {
        out.push(cur.trim());
        cur = "";
        continue;
      }
      cur += ch;
    }
    out.push(cur.trim());
    return out;
  };

  const headers = parseCsvLine(lines[0]).map((h) =>
    h
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_"),
  );
  const idxClickId = headers.findIndex((h) =>
    [
      "click_id",
      "clickid",
      "referral_id",
      "referralid",
      "campaignvalue",
      "campaign_value",
      "campaign_id",
      "sub_id",
      "subid",
      "campaign",
      "ref",
      "external_ref",
    ].includes(h),
  );
  const idxBookingRef = headers.findIndex((h) =>
    [
      "booking_ref",
      "bookingref",
      "booking_reference",
      "viator_booking_ref",
      "itinerary_id",
      "provider_booking_ref",
      "order_id",
      "reference",
    ].includes(h),
  );
  const idxStatus = headers.findIndex((h) =>
    [
      "status",
      "event_type",
      "booking_status",
      "payout_status",
      "transaction_status",
    ].includes(h),
  );
  const idxGross = headers.findIndex((h) =>
    [
      "gross_amount",
      "gross_revenue_usd",
      "booking_value",
      "total_price",
      "retail_price",
      "net_price",
    ].includes(h),
  );
  const idxCommission = headers.findIndex((h) =>
    [
      "commission_amount",
      "commission_usd",
      "estimated_commission",
      "commission",
      "partner_commission",
    ].includes(h),
  );
  const idxPaidCommission = headers.findIndex((h) =>
    [
      "paid_commission_amount",
      "paid_commission_usd",
      "paid_commission",
      "settled_commission",
      "net_payout",
    ].includes(h),
  );
  const idxCurrency = headers.findIndex((h) =>
    ["currency", "currency_code"].includes(h),
  );
  const idxEventTime = headers.findIndex((h) =>
    [
      "event_time",
      "occurred_at",
      "booking_date",
      "travel_date",
      "settled_at",
    ].includes(h),
  );

  const parseCurrencyNumber = (raw: string | undefined): number | null => {
    if (!raw) return null;
    const cleaned = raw.replace(/[^0-9.-]/g, "").trim();
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  };

  const reconciledRecords: OpaqueClickReconciledOutcome[] = [];
  const unmatchedRows: PartnerCsvReconciliationSummary["unmatchedRows"] = [];
  let matchedCount = 0;
  let deduplicatedCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const rawClickIdOrTracking = idxClickId >= 0 ? cols[idxClickId] || "" : "";
    const providerBookingRef =
      idxBookingRef >= 0 && cols[idxBookingRef]
        ? cols[idxBookingRef]
        : `CSV-ROW-${i}`;
    const rawStatus = (
      idxStatus >= 0 ? cols[idxStatus] || "" : "BOOKING_CONFIRMED"
    ).toUpperCase();

    const eventType: PartnerWebhookReconciliationInput["eventType"] =
      rawStatus.includes("CANCEL")
        ? "BOOKING_CANCELLED"
        : rawStatus.includes("REFUND")
          ? "BOOKING_REFUNDED"
          : rawStatus.includes("FULFILL") ||
              rawStatus.includes("COMPLETE") ||
              rawStatus.includes("PAID") ||
              rawStatus.includes("SETTLE")
            ? "BOOKING_FULFILLED"
            : "BOOKING_CONFIRMED";

    const grossVal =
      idxGross >= 0 ? parseCurrencyNumber(cols[idxGross]) : null;
    const commVal =
      idxCommission >= 0 ? parseCurrencyNumber(cols[idxCommission]) : null;
    const paidVal =
      idxPaidCommission >= 0
        ? parseCurrencyNumber(cols[idxPaidCommission])
        : null;
    const currency =
      idxCurrency >= 0 && cols[idxCurrency] ? cols[idxCurrency] : "USD";
    const occurredAt =
      idxEventTime >= 0 && cols[idxEventTime]
        ? cols[idxEventTime]
        : new Date().toISOString();

    const res = reconcilePartnerWebhookByClickId(
      {
        clickId: rawClickIdOrTracking,
        campaignValue: rawClickIdOrTracking,
        trackingParamValue: rawClickIdOrTracking,
        provider: params.provider,
        providerBookingRef,
        eventType,
        grossRevenueUsd: grossVal,
        estimatedCommissionUsd: commVal,
        paidCommissionUsd: paidVal,
        currency,
        occurredAt,
        isTest: params.isTest,
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

function isGuideSourcePage(sourcePage?: string | null): boolean {
  if (!sourcePage) return false;
  const p = sourcePage.toLowerCase();
  return (
    p.includes("/guides/") ||
    p.includes("best-swamp-tour-with-transportation") ||
    p.includes("new-orleans-tours-with-transportation")
  );
}

function isStorefrontSourcePage(sourcePage?: string | null): boolean {
  if (!sourcePage) return false;
  const p = sourcePage.split("?")[0].toLowerCase();
  return (
    p === "/swamp-tours" ||
    p === "/new-orleans/swamp-tours" ||
    p.endsWith("/swamp-tours") ||
    p.includes("/marketplace-category/swamp-tours")
  );
}

export function recordFunnelVisitorSession(input: {
  visitorId?: string | null;
  sourcePage?: string | null;
  trafficSource?: string | null;
  placementId?: string | null;
  propertySlug?: string | null;
  surface?: string | null;
  planCode?: string | null;
  isPlanOpen?: boolean;
  isTest?: boolean;
}): FunnelVisitorRecord {
  const visitorId =
    input.visitorId?.trim() || `vis_${crypto.randomBytes(10).toString("hex")}`;
  const sourcePage = input.sourcePage?.trim() || "/transportation/colorado";
  const resolvedTrafficSource = inferTrafficSource({
    trafficSource: input.trafficSource,
    sourcePage,
  });
  const placementId = input.placementId?.trim() || null;
  const propertySlug = input.propertySlug?.trim() || null;
  const surface = input.surface?.trim() || null;
  const planCode = input.planCode?.trim() || null;
  const isPlanOpen = Boolean(
    input.isPlanOpen ||
      planCode ||
      sourcePage.startsWith("/p/") ||
      sourcePage.includes("winter-excursion-planner"),
  );
  const isGuideVisit = isGuideSourcePage(sourcePage);
  const isStorefrontVisit = isStorefrontSourcePage(sourcePage);
  const isTest = Boolean(
    input.isTest ||
      /^(test|sim|qa)[-_]/i.test(visitorId) ||
      isDemoOrAutomatedVerificationTraffic({
        isTest: input.isTest,
        originatingPage: sourcePage,
      }),
  );
  const trafficClass: TrafficClass = isTest ? "test" : "production";
  const nowIso = new Date().toISOString();

  return runDurableLedgerTransaction((state) => {
    state.funnelVisitorsById = state.funnelVisitorsById || {};
    const existing = state.funnelVisitorsById[visitorId];
    if (existing) {
      existing.lastSeenAt = nowIso;
      existing.visitCount += 1;
      if (isPlanOpen) {
        existing.planOpenCount = (existing.planOpenCount || 0) + 1;
      }
      if (isGuideVisit) {
        const base =
          typeof existing.guideVisitCount === "number"
            ? existing.guideVisitCount
            : isGuideSourcePage(existing.sourcePage)
              ? Math.max(1, (existing.visitCount || 1) - 1)
              : 0;
        existing.guideVisitCount = base + 1;
      }
      if (isStorefrontVisit) {
        const base =
          typeof existing.storefrontVisitCount === "number"
            ? existing.storefrontVisitCount
            : isStorefrontSourcePage(existing.sourcePage)
              ? Math.max(1, (existing.visitCount || 1) - 1)
              : 0;
        existing.storefrontVisitCount = base + 1;
      }
      if (resolvedTrafficSource && (!existing.trafficSource || existing.trafficSource === "wno-swamp-storefront" || existing.trafficSource === "direct-or-other")) {
        existing.trafficSource = resolvedTrafficSource;
      }
      if (planCode) existing.planCode = planCode;
      if (placementId) existing.placementId = placementId;
      if (propertySlug) existing.propertySlug = propertySlug;
      if (surface) existing.surface = surface;
      return existing;
    }
    const created: FunnelVisitorRecord = {
      visitorId,
      sourcePage,
      trafficSource: resolvedTrafficSource,
      placementId,
      propertySlug,
      surface,
      planCode,
      planOpenCount: isPlanOpen ? 1 : 0,
      guideVisitCount: isGuideVisit ? 1 : 0,
      storefrontVisitCount: isStorefrontVisit ? 1 : 0,
      trafficClass,
      isTest,
      firstSeenAt: nowIso,
      lastSeenAt: nowIso,
      visitCount: 1,
    };
    state.funnelVisitorsById[visitorId] = created;
    return created;
  });
}

export function recordPlanOpenEvent(input: {
  visitorId?: string | null;
  planCode?: string | null;
  sourcePage?: string | null;
  placementId?: string | null;
  propertySlug?: string | null;
  surface?: string | null;
  isTest?: boolean;
}): FunnelVisitorRecord {
  return recordFunnelVisitorSession({
    ...input,
    isPlanOpen: true,
    sourcePage:
      input.sourcePage?.trim() ||
      `/cruises/winter-excursion-planner${input.planCode ? `?plan=${input.planCode}` : ""}`,
  });
}

function getOrCreateTrafficSourceBucket(
  map: Record<string, TrafficSourceFunnelBreakdown>,
  sourceKey: string,
): TrafficSourceFunnelBreakdown {
  const key = sourceKey || "direct-or-other";
  if (!map[key]) {
    map[key] = {
      visitors: 0,
      guestVisits: 0,
      guideVisits: 0,
      storefrontVisits: 0,
      viatorClicks: 0,
      providerConfirmedBookings: 0,
      settledCommissionUsd: 0,
    };
  }
  return map[key];
}

function createEmptyFunnelClassMetrics(
  trafficClass: TrafficClass,
): FunnelClassMetrics {
  return {
    trafficClass,
    newVisitors: 0,
    guestVisits: 0,
    guideVisits: 0,
    storefrontVisits: 0,
    planOpens: 0,
    recommendationsIssued: 0,
    recommendationOnlyRecords: 0,
    followedHandoffs: 0,
    actualOutboundClicks: 0,
    viatorClicks: 0,
    confirmedPaidBookings: 0,
    paidCommissionsCount: 0,
    cancelledOrRefundedBookings: 0,
    duplicateDeliveriesIgnored: 0,
    grossConfirmedRevenueUsd: 0,
    estimatedUnsettledCommissionUsd: 0,
    settledReconciledCommissionUsd: 0,
    reversedCommissionUsd: 0,
    byTrafficSource: {},
    byDirection: {
      OUTBOUND: { handoffs: 0, confirmedPaidBookings: 0 },
      RETURN: { handoffs: 0, confirmedPaidBookings: 0 },
      ROUND_TRIP: { handoffs: 0, confirmedPaidBookings: 0 },
    },
  };
}

function extractRecordPlacementId(click: OpaqueClickAttributionRecord): string | null {
  return (
    click.placementId?.trim() ||
    click.tripDetails?.placementId?.trim() ||
    null
  );
}

function extractRecordPropertySlug(click: OpaqueClickAttributionRecord): string | null {
  return (
    click.propertySlug?.trim() ||
    click.tripDetails?.propertySlug?.trim() ||
    null
  );
}

export function getFunnelMetricsReport(options?: {
  routeId?: string | null;
  originatingPage?: string | null;
  placementId?: string | null;
  propertySlug?: string | null;
}): FunnelMetricsReport {
  const state = readDurableLedgerState();
  const filterRoute = options?.routeId?.trim().toUpperCase() || null;
  const filterPage = options?.originatingPage?.trim() || null;
  const filterPlacement = options?.placementId?.trim() || null;
  const filterProperty = options?.propertySlug?.trim() || null;

  const production = createEmptyFunnelClassMetrics("production");
  const test = createEmptyFunnelClassMetrics("test");

  const visitors = Object.values(state.funnelVisitorsById || {});
  for (const vis of visitors) {
    if (filterPage && vis.sourcePage !== filterPage) continue;
    if (filterPlacement && vis.placementId !== filterPlacement) continue;
    if (filterProperty && vis.propertySlug !== filterProperty) continue;
    const isTestVisitor = Boolean(
      vis.isTest ||
        vis.trafficClass === "test" ||
        isDemoOrAutomatedVerificationTraffic({
          isTest: vis.isTest,
          originatingPage: vis.sourcePage,
        }),
    );
    const bucket = isTestVisitor ? test : production;
    const visitCount = Math.max(1, vis.visitCount || 1);
    bucket.newVisitors += 1;
    bucket.guestVisits += visitCount;
    const explicitGuideVisits =
      typeof vis.guideVisitCount === "number" && vis.guideVisitCount > 0
        ? vis.guideVisitCount
        : isGuideSourcePage(vis.sourcePage)
          ? visitCount
          : 0;
    const explicitStorefrontVisits =
      typeof vis.storefrontVisitCount === "number" && vis.storefrontVisitCount > 0
        ? vis.storefrontVisitCount
        : isStorefrontSourcePage(vis.sourcePage)
          ? visitCount
          : 0;
    bucket.guideVisits += explicitGuideVisits;
    bucket.storefrontVisits += explicitStorefrontVisits;
    const explicitPlanOpens =
      typeof vis.planOpenCount === "number" && vis.planOpenCount >= 0
        ? vis.planOpenCount
        : vis.sourcePage?.startsWith("/p/") ||
            vis.sourcePage?.includes("winter-excursion-planner")
          ? visitCount
          : 0;
    bucket.planOpens += explicitPlanOpens;

    const srcKey = inferTrafficSource({
      trafficSource: vis.trafficSource,
      sourcePage: vis.sourcePage,
    });
    const srcBucket = getOrCreateTrafficSourceBucket(bucket.byTrafficSource, srcKey);
    srcBucket.visitors += 1;
    srcBucket.guestVisits += visitCount;
    srcBucket.guideVisits += explicitGuideVisits;
    srcBucket.storefrontVisits += explicitStorefrontVisits;
  }

  const clicks = Object.values(state.opaqueClicksById || {});
  for (const click of clicks) {
    if (filterRoute) {
      const clickRoute = click.tripDetails?.routeId?.toUpperCase() || "";
      const clickReturnRoute =
        click.tripDetails?.returnRouteId?.toUpperCase() || "";
      if (
        clickRoute !== filterRoute &&
        clickReturnRoute !== filterRoute &&
        !clickRoute.includes(filterRoute)
      ) {
        continue;
      }
    }
    if (filterPage && click.originatingPage !== filterPage) {
      continue;
    }
    if (filterPlacement) {
      const recPlacement = extractRecordPlacementId(click);
      if (recPlacement !== filterPlacement) {
        continue;
      }
    }
    if (filterProperty) {
      const recProp = extractRecordPropertySlug(click);
      if (
        recProp !== filterProperty &&
        !String(click.originatingPage || "").includes(filterProperty)
      ) {
        continue;
      }
    }

    const isTestRecord = Boolean(
      click.isTest ||
        click.trafficClass === "test" ||
        isDemoOrAutomatedVerificationTraffic({
          clickId: click.clickId,
          isTest: click.isTest,
          originatingPage: click.originatingPage,
          decisionReceiptId: click.decisionReceiptId,
          userAgent: click.userAgent,
          referer: click.referer,
        }) ||
        click.reconciledOutcomes.some(
          (o) =>
            o.isTest ||
            o.trafficClass === "test" ||
            /^(TEST|SIM|QA|SANDBOX|E2E)[-_]|[-_](E2E|TEST|SIM|QA|SANDBOX)[-_]/i.test(
              o.providerBookingRef,
            ),
        ),
    );
    const bucket = isTestRecord ? test : production;
    bucket.recommendationsIssued += 1;
    bucket.duplicateDeliveriesIgnored += click.duplicateDeliveryCount || 0;

    const clickSrcKey = inferTrafficSource({
      trafficSource: click.trafficSource || click.tripDetails?.trafficSource,
      originatingPage: click.originatingPage,
      referer: click.referer,
    });

    const isUnfollowedRecommendation =
      click.recordStage === "recommendation" ||
      (!click.recordStage &&
        Boolean(click.decisionReceiptId?.startsWith("rcpt:dcc:match:")) &&
        !click.followedAt &&
        !(typeof click.clickCount === "number" && click.clickCount > 0) &&
        click.reconciledOutcomes.length === 0);

    const dirKey: "OUTBOUND" | "RETURN" | "ROUND_TRIP" =
      click.tripDetails?.direction === "RETURN"
        ? "RETURN"
        : click.tripDetails?.direction === "ROUND_TRIP" ||
            click.tripDetails?.tripType === "ROUND_TRIP"
          ? "ROUND_TRIP"
          : "OUTBOUND";

    if (isUnfollowedRecommendation) {
      bucket.recommendationOnlyRecords += 1;
    } else {
      bucket.followedHandoffs += 1;
      bucket.actualOutboundClicks += 1;
      if (click.provider === "viator") {
        bucket.viatorClicks += 1;
        const srcBucket = getOrCreateTrafficSourceBucket(bucket.byTrafficSource, clickSrcKey);
        srcBucket.viatorClicks += 1;
      }
      bucket.byDirection[dirKey].handoffs += 1;
    }

    // Group outcomes by unique providerBookingRef to prevent double-counting across CONFIRMED + FULFILLED events
    const outcomesByBookingRef = new Map<
      string,
      OpaqueClickReconciledOutcome[]
    >();
    for (const outcome of click.reconciledOutcomes) {
      const list = outcomesByBookingRef.get(outcome.providerBookingRef) || [];
      list.push(outcome);
      outcomesByBookingRef.set(outcome.providerBookingRef, list);
    }

    for (const [, outcomes] of outcomesByBookingRef.entries()) {
      const isCancelledOrRefunded = outcomes.some(
        (o) =>
          o.eventType === "BOOKING_CANCELLED" ||
          o.eventType === "BOOKING_REFUNDED",
      );
      const confirmedOutcome = outcomes.find(
        (o) =>
          o.eventType === "BOOKING_CONFIRMED" ||
          o.eventType === "BOOKING_FULFILLED",
      );
      const outcomeWithPaidCommission = [...outcomes]
        .reverse()
        .find(
          (o) =>
            typeof o.paidCommissionUsd === "number" &&
            Number.isFinite(o.paidCommissionUsd),
        );
      const outcomeWithEstimatedCommission = [...outcomes]
        .reverse()
        .find(
          (o) =>
            typeof o.estimatedCommissionUsd === "number" &&
            Number.isFinite(o.estimatedCommissionUsd),
        );

      if (isCancelledOrRefunded) {
        bucket.cancelledOrRefundedBookings += 1;
        const nonZeroPaidOutcome = [...outcomes]
          .reverse()
          .find(
            (o) =>
              typeof o.paidCommissionUsd === "number" &&
              Number.isFinite(o.paidCommissionUsd) &&
              Math.abs(o.paidCommissionUsd) > 0,
          );
        const nonZeroEstimatedOutcome = [...outcomes]
          .reverse()
          .find(
            (o) =>
              typeof o.estimatedCommissionUsd === "number" &&
              Number.isFinite(o.estimatedCommissionUsd) &&
              Math.abs(o.estimatedCommissionUsd) > 0,
          );
        const reversedComm =
          nonZeroPaidOutcome?.paidCommissionUsd != null
            ? Math.abs(nonZeroPaidOutcome.paidCommissionUsd)
            : nonZeroEstimatedOutcome?.estimatedCommissionUsd != null
              ? Math.abs(nonZeroEstimatedOutcome.estimatedCommissionUsd)
              : 0;
        if (reversedComm > 0) {
          bucket.reversedCommissionUsd = Number(
            (bucket.reversedCommissionUsd + reversedComm).toFixed(2),
          );
        }
      } else if (confirmedOutcome) {
        bucket.confirmedPaidBookings += 1;
        bucket.byDirection[dirKey].confirmedPaidBookings += 1;
        const srcBucket = getOrCreateTrafficSourceBucket(bucket.byTrafficSource, clickSrcKey);
        srcBucket.providerConfirmedBookings += 1;

        const grossOutcome =
          [...outcomes]
            .reverse()
            .find(
              (o) =>
                typeof o.grossRevenueUsd === "number" &&
                Number.isFinite(o.grossRevenueUsd),
            ) ?? confirmedOutcome;
        if (
          typeof grossOutcome.grossRevenueUsd === "number" &&
          Number.isFinite(grossOutcome.grossRevenueUsd)
        ) {
          bucket.grossConfirmedRevenueUsd = Number(
            (
              bucket.grossConfirmedRevenueUsd + grossOutcome.grossRevenueUsd
            ).toFixed(2),
          );
        }

        if (outcomeWithPaidCommission?.paidCommissionUsd != null) {
          const paidComm = outcomeWithPaidCommission.paidCommissionUsd;
          if (paidComm >= 0) {
            if (paidComm > 0) {
              bucket.paidCommissionsCount += 1;
            }
            bucket.settledReconciledCommissionUsd = Number(
              (bucket.settledReconciledCommissionUsd + paidComm).toFixed(2),
            );
            srcBucket.settledCommissionUsd = Number(
              (srcBucket.settledCommissionUsd + paidComm).toFixed(2),
            );
          } else {
            bucket.reversedCommissionUsd = Number(
              (bucket.reversedCommissionUsd + Math.abs(paidComm)).toFixed(2),
            );
          }
        } else if (
          outcomeWithEstimatedCommission?.estimatedCommissionUsd != null &&
          outcomeWithEstimatedCommission.estimatedCommissionUsd > 0
        ) {
          bucket.estimatedUnsettledCommissionUsd = Number(
            (
              bucket.estimatedUnsettledCommissionUsd +
              outcomeWithEstimatedCommission.estimatedCommissionUsd
            ).toFixed(2),
          );
        }
      }
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    filter: {
      routeId: filterRoute,
      originatingPage: filterPage,
      placementId: filterPlacement,
      propertySlug: filterProperty,
    },
    production,
    test,
  };
}

export function listAttributionRecordsForPlacement(options?: {
  placementId?: string | null;
  propertySlug?: string | null;
  limit?: number;
}): {
  visitors: FunnelVisitorRecord[];
  attributionRecords: OpaqueClickAttributionRecord[];
} {
  const state = readDurableLedgerState();
  const filterPlacement = options?.placementId?.trim() || null;
  const filterProperty = options?.propertySlug?.trim() || null;
  const limit = typeof options?.limit === "number" && options.limit > 0 ? options.limit : 25;

  const visitors = Object.values(state.funnelVisitorsById || {})
    .filter((v) => {
      if (filterPlacement && v.placementId !== filterPlacement) return false;
      if (filterProperty && v.propertySlug !== filterProperty) return false;
      return true;
    })
    .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt))
    .slice(0, limit);

  const attributionRecords = Object.values(state.opaqueClicksById || {})
    .filter((c) => {
      if (filterPlacement && extractRecordPlacementId(c) !== filterPlacement) return false;
      if (
        filterProperty &&
        extractRecordPropertySlug(c) !== filterProperty &&
        !String(c.originatingPage || "").includes(filterProperty)
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const aOutcomes = a.reconciledOutcomes?.length || 0;
      const bOutcomes = b.reconciledOutcomes?.length || 0;
      if (bOutcomes !== aOutcomes) return bOutcomes - aOutcomes;
      const aFollowed = a.recordStage === "outbound_click" || (a.clickCount || 0) > 0 ? 1 : 0;
      const bFollowed = b.recordStage === "outbound_click" || (b.clickCount || 0) > 0 ? 1 : 0;
      if (bFollowed !== aFollowed) return bFollowed - aFollowed;
      return b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, limit);

  return { visitors, attributionRecords };
}

export interface DccAuthorityScorecardBucket {
  foundDcc: {
    visitors: number;
    pageVisits: number;
    byMarket: {
      newOrleans: { visitors: number; visits: number };
      colorado: { visitors: number; visits: number };
      cruisePorts: { visitors: number; visits: number };
      otherDcc: { visitors: number; visits: number };
    };
    byAcquisitionChannel: {
      search: number;
      aiReferral: number;
      directOrReferral: number;
    };
  };
  choseNextStep: {
    totalNextStepSelections: number;
    wnoStorefrontHandoffs: number;
    gosnoHandoffs: number;
    cruisePromenadeHandoffs: number;
    directVerifiablePartnerCheckouts: number;
  };
  bookedWhereVerifiable: {
    confirmedBookings: number;
    grossConfirmedRevenueUsd: number;
    estimatedUnsettledCommissionUsd: number;
    settledCommissionUsd: number;
  };
}

export interface DccAuthorityScorecardReport {
  generatedAt: string;
  production: DccAuthorityScorecardBucket;
  test: DccAuthorityScorecardBucket;
}

function createEmptyScorecardBucket(): DccAuthorityScorecardBucket {
  return {
    foundDcc: {
      visitors: 0,
      pageVisits: 0,
      byMarket: {
        newOrleans: { visitors: 0, visits: 0 },
        colorado: { visitors: 0, visits: 0 },
        cruisePorts: { visitors: 0, visits: 0 },
        otherDcc: { visitors: 0, visits: 0 },
      },
      byAcquisitionChannel: {
        search: 0,
        aiReferral: 0,
        directOrReferral: 0,
      },
    },
    choseNextStep: {
      totalNextStepSelections: 0,
      wnoStorefrontHandoffs: 0,
      gosnoHandoffs: 0,
      cruisePromenadeHandoffs: 0,
      directVerifiablePartnerCheckouts: 0,
    },
    bookedWhereVerifiable: {
      confirmedBookings: 0,
      grossConfirmedRevenueUsd: 0,
      estimatedUnsettledCommissionUsd: 0,
      settledCommissionUsd: 0,
    },
  };
}

function classifyDccMarket(pageOrRoute: string, placementId: string | null): "newOrleans" | "colorado" | "cruisePorts" | "otherDcc" {
  const combined = `${pageOrRoute} ${placementId || ""}`.toLowerCase();
  if (
    combined.includes("new-orleans") ||
    combined.includes("nola") ||
    combined.includes("swamp")
  ) {
    return "newOrleans";
  }
  if (
    combined.includes("colorado") ||
    combined.includes("denver") ||
    combined.includes("vail") ||
    combined.includes("breckenridge") ||
    combined.includes("gosno")
  ) {
    return "colorado";
  }
  if (
    combined.includes("cruise") ||
    combined.includes("port") ||
    combined.includes("juneau") ||
    combined.includes("ketchikan") ||
    combined.includes("santorini") ||
    combined.includes("indy-")
  ) {
    return "cruisePorts";
  }
  return "otherDcc";
}

function classifyAcquisitionChannel(sourceRaw: string | null | undefined): "search" | "aiReferral" | "directOrReferral" {
  const src = String(sourceRaw || "").toLowerCase();
  if (
    src.includes("chatgpt") ||
    src.includes("openai") ||
    src.includes("gemini") ||
    src.includes("perplexity") ||
    src.includes("claude") ||
    src.includes("copilot") ||
    src.includes("ai")
  ) {
    return "aiReferral";
  }
  if (
    src.includes("google") ||
    src.includes("bing") ||
    src.includes("yahoo") ||
    src.includes("duckduckgo") ||
    src.includes("organic") ||
    src.includes("search") ||
    src.includes("gsc")
  ) {
    return "search";
  }
  return "directOrReferral";
}

export function getDccAuthorityScorecard(): DccAuthorityScorecardReport {
  const state = readDurableLedgerState();
  const production = createEmptyScorecardBucket();
  const test = createEmptyScorecardBucket();

  for (const visitor of Object.values(state.funnelVisitorsById || {})) {
    const isVisitorTest =
      visitor.isTest === true ||
      visitor.trafficClass === "test" ||
      isAutomatedOrQaRecord({
        visitorId: visitor.visitorId,
        originatingPage: visitor.originatingPage,
      });
    const bucket = isVisitorTest ? test : production;
    const page = String(visitor.originatingPage || "");
    const placementId = visitor.placementId || null;
    const trafficSource = String(visitor.trafficSource || "").toLowerCase();
    const visitCount = Math.max(1, visitor.visitCount || 1);

    const isDccAuthoritySurface =
      visitor.surface === "dcc" ||
      (placementId && placementId.startsWith("fp-dcc-")) ||
      page.startsWith("/new-orleans") ||
      page.startsWith("/transportation/colorado") ||
      page.startsWith("/denver-to-mountains") ||
      page.startsWith("/cruises") ||
      page.startsWith("/ports") ||
      page.startsWith("/juneau");

    if (isDccAuthoritySurface) {
      bucket.foundDcc.visitors += 1;
      bucket.foundDcc.pageVisits += visitCount;
      const market = classifyDccMarket(page, placementId);
      bucket.foundDcc.byMarket[market].visitors += 1;
      bucket.foundDcc.byMarket[market].visits += visitCount;
      const channel = classifyAcquisitionChannel(trafficSource);
      bucket.foundDcc.byAcquisitionChannel[channel] += visitCount;
    }

    // Track visitors who landed on a portfolio satellite directly from a DCC authority page (src=dcc-authority-*)
    if (trafficSource.startsWith("dcc-authority-") || trafficSource.startsWith("dcc-")) {
      if (visitor.surface === "welcometoneworleanstours" || (placementId && placementId.startsWith("fp-wno-"))) {
        bucket.choseNextStep.wnoStorefrontHandoffs += 1;
        bucket.choseNextStep.totalNextStepSelections += 1;
      } else if (visitor.surface === "cruisepromenade" || (placementId && placementId.startsWith("fp-cp-"))) {
        bucket.choseNextStep.cruisePromenadeHandoffs += 1;
        bucket.choseNextStep.totalNextStepSelections += 1;
      }
    }
  }

  for (const record of Object.values(state.opaqueClicksById || {})) {
    const isRecordTest =
      record.isTest === true ||
      record.trafficClass === "test" ||
      isAutomatedOrQaRecord(record);
    const bucket = isRecordTest ? test : production;
    const page = String(record.originatingPage || "");
    const placementId = extractRecordPlacementId(record);
    const trafficSource = extractRecordTrafficSource(record);
    const isFollowed =
      record.recordStage === "outbound_click" || (record.clickCount || 0) > 0;

    const isFromDccAuthority =
      record.surface === "dcc" ||
      (placementId && placementId.startsWith("fp-dcc-")) ||
      trafficSource.startsWith("dcc-authority-") ||
      page.startsWith("/new-orleans") ||
      page.startsWith("/transportation/colorado") ||
      page.startsWith("/cruises") ||
      page.startsWith("/ports");

    if (!isFromDccAuthority) continue;

    if (isFollowed) {
      const outUrl = String(record.outboundPartnerUrl || "").toLowerCase();
      const prodCode = String(record.productCode || "").toLowerCase();
      if (outUrl.includes("welcometoneworleanstours.com")) {
        bucket.choseNextStep.wnoStorefrontHandoffs += 1;
        bucket.choseNextStep.totalNextStepSelections += 1;
      } else if (
        outUrl.includes("gosno.co") ||
        page.startsWith("/transportation/colorado") ||
        prodCode.startsWith("veh:") ||
        prodCode.startsWith("opt:")
      ) {
        bucket.choseNextStep.gosnoHandoffs += 1;
        bucket.choseNextStep.totalNextStepSelections += 1;
      } else if (outUrl.includes("cruisepromenade.com")) {
        bucket.choseNextStep.cruisePromenadeHandoffs += 1;
        bucket.choseNextStep.totalNextStepSelections += 1;
      } else {
        bucket.choseNextStep.directVerifiablePartnerCheckouts += 1;
        bucket.choseNextStep.totalNextStepSelections += 1;
      }
    }

    const nonDuplicateOutcomes = (record.reconciledOutcomes || []).filter(
      (o) => !o.duplicateDelivery,
    );
    const hasConfirmed = nonDuplicateOutcomes.some(
      (o) =>
        o.eventType === "BOOKING_CONFIRMED" ||
        o.eventType === "COMMISSION_SETTLED",
    );
    const hasCancelled = nonDuplicateOutcomes.some(
      (o) =>
        o.eventType === "BOOKING_CANCELLED" ||
        o.eventType === "BOOKING_REFUNDED",
    );

    if (hasConfirmed && !hasCancelled) {
      bucket.bookedWhereVerifiable.confirmedBookings += 1;
      const revOutcome = nonDuplicateOutcomes.find(
        (o) => o.grossRevenueUsd != null && o.grossRevenueUsd > 0,
      );
      if (revOutcome?.grossRevenueUsd) {
        bucket.bookedWhereVerifiable.grossConfirmedRevenueUsd = Number(
          (
            bucket.bookedWhereVerifiable.grossConfirmedRevenueUsd +
            revOutcome.grossRevenueUsd
          ).toFixed(2),
        );
      }
      const paidOutcome = nonDuplicateOutcomes.find(
        (o) =>
          o.eventType === "COMMISSION_SETTLED" &&
          o.paidCommissionUsd != null &&
          o.paidCommissionUsd > 0,
      );
      const estOutcome = nonDuplicateOutcomes.find(
        (o) => o.estimatedCommissionUsd != null && o.estimatedCommissionUsd > 0,
      );
      if (paidOutcome?.paidCommissionUsd) {
        bucket.bookedWhereVerifiable.settledCommissionUsd = Number(
          (
            bucket.bookedWhereVerifiable.settledCommissionUsd +
            paidOutcome.paidCommissionUsd
          ).toFixed(2),
        );
      } else if (estOutcome?.estimatedCommissionUsd) {
        bucket.bookedWhereVerifiable.estimatedUnsettledCommissionUsd = Number(
          (
            bucket.bookedWhereVerifiable.estimatedUnsettledCommissionUsd +
            estOutcome.estimatedCommissionUsd
          ).toFixed(2),
        );
      }
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    production,
    test,
  };
}
