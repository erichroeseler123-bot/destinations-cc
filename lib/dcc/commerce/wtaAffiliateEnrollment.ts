import {
  createCommercialHandoff,
  getCommercialHandoffById,
  listCommercialOutcomes,
  recordCommercialOutcome,
  type ApprovedPartnerAttribution,
  type CommercialHandoffRecord,
  type CommercialOutcomeRecord,
  type CommercialProvider,
} from "./index";
import draftTermsJson from "../../../data/commerce/affiliates/wta-commercial-terms.draft.json";

export const WTA_AFFILIATE_PARTNER_ID = "welcome-to-alaska" as const;
export const WTA_AFFILIATE_PARTNER_NAME = "Welcome to Alaska Tours" as const;
export const WTA_AFFILIATE_LEGAL_NAME = "Welcome to Alaska Tours LLC" as const;
export const WTA_AFFILIATE_DOMAIN = "welcometoalaskatours.com" as const;
export const WTA_PREVIEW_CLIENT_ID = "partner:welcome-to-alaska:preview" as const;
export const WTA_LIVE_CLIENT_ID = "partner:welcome-to-alaska:live" as const;
/**
 * Former static preview token exposed in an earlier checkpoint report; permanently revoked in `securityLimits.ts`.
 * Active preview credentials must be supplied via `process.env.DCC_WTA_AFFILIATE_PREVIEW_API_KEY`.
 */
export const WTA_REVOKED_PREVIEW_API_TOKEN_V1 =
  "dcc_wta_affiliate_preview_v1_token" as const;

export const WTA_DEFAULT_AGREEMENT_ID = "DCC-AFF-WTA-2026-001" as const;
export const WTA_DEFAULT_COMMISSION_RATE_BPS = 1200 as const; // 12%
export const WTA_DEFAULT_ATTRIBUTION_WINDOW_DAYS = 30 as const;
export const WTA_DEFAULT_PAYOUT_SCHEDULE = "net_30_after_travel" as const;
export const WTA_DEFAULT_COMMISSION_APPLIES_TO =
  "12% (1200 bps) of the completed, non-refunded net tour/activity subtotal (FareHarbor receipt_subtotal / operator net activity fare in USD) for attributed bookings after travel completion, excluding government sales or excise taxes, municipal port/harbor passenger fees, payment-processing fees, and cancelled or refunded seats." as const;
export const WTA_DEFAULT_COMMISSION_PAID_BY =
  "Destination Command Center (DCC) pays Welcome to Alaska Tours LLC out of operator/FareHarbor Affiliate Sales Network (ASN) commission proceeds collected from the fulfilling operator (e.g., Coastal Helicopters)." as const;

export interface WtaCommercialTerms {
  agreementId: string;
  partnerId: "welcome-to-alaska";
  partnerLegalName: string;
  status: "draft" | "active";
  commissionRateBps: number;
  commissionAppliesTo: string;
  commissionPaidBy: string;
  attributionWindowDays: number;
  payoutSchedule: "net_30_after_travel" | string;
  signedAt: string | null;
  effectiveAt: string | null;
  approvedByDcc: boolean;
  approvedByPartner: boolean;
}

export interface WtaAgreedCommercialTerms extends WtaCommercialTerms {
  status: "active";
  signedAt: string;
  effectiveAt: string;
  approvedByDcc: true;
  approvedByPartner: true;
}

export const WTA_DRAFT_COMMERCIAL_TERMS: WtaCommercialTerms = {
  agreementId: draftTermsJson.agreementId,
  partnerId: WTA_AFFILIATE_PARTNER_ID,
  partnerLegalName: draftTermsJson.partnerLegalName,
  status: "draft",
  commissionRateBps: draftTermsJson.commissionRateBps,
  commissionAppliesTo: draftTermsJson.commissionAppliesTo,
  commissionPaidBy: draftTermsJson.commissionPaidBy,
  attributionWindowDays: draftTermsJson.attributionWindowDays,
  payoutSchedule: draftTermsJson.payoutSchedule,
  signedAt: null,
  effectiveAt: null,
  approvedByDcc: false,
  approvedByPartner: false,
};

export interface MissingWtaProductionRequirement {
  key:
    | "DCC_WTA_AFFILIATE_LIVE_API_KEY"
    | "DCC_WTA_WEBHOOK_HMAC_SECRET"
    | "DCC_WTA_AFFILIATE_TERMS_JSON";
  category: "approved_credentials" | "agreed_terms";
  description: string;
  exampleFormat: string;
}

export interface WtaAffiliateActivationGateStatus {
  partnerId: typeof WTA_AFFILIATE_PARTNER_ID;
  partnerName: typeof WTA_AFFILIATE_PARTNER_NAME;
  partnerDomain: typeof WTA_AFFILIATE_DOMAIN;
  relationshipClass: "paid_external_affiliate";
  inDccPortfolioNetworkSites: false;
  authScope: "referral_attribution_only";
  allowedMachineScopes: readonly [
    "dcc:read:public",
    "dcc:commerce:handoff",
    "dcc:commerce:read",
  ];
  grantsLoginAccess: false;
  grantsReportingAccess: false;
  grantsPayoutAccess: false;
  grantsSelfConfirmOrCommissionWriteAccess: false;
  environment: "production" | "preview" | "development" | "test";
  isProductionRuntime: boolean;
  previewEnrollmentActive: boolean;
  previewSimulatorAllowed: boolean;
  productionActivationAllowed: boolean;
  credentialsApproved: boolean;
  termsAgreed: boolean;
  draftTerms: WtaCommercialTerms;
  parsedTerms: WtaAgreedCommercialTerms | null;
  missingProductionRequirements: MissingWtaProductionRequirement[];
  statusCodeWhenBlockedInProduction: 403;
  errorCodeWhenBlockedInProduction: "WTA_AFFILIATE_PRODUCTION_ACTIVATION_GATED";
}

export class WtaAffiliateProductionGateError extends Error {
  public readonly code = "WTA_AFFILIATE_PRODUCTION_ACTIVATION_GATED" as const;
  public readonly statusCode = 403 as const;
  public readonly gateStatus: WtaAffiliateActivationGateStatus;

  constructor(gateStatus: WtaAffiliateActivationGateStatus) {
    const missingKeys = gateStatus.missingProductionRequirements
      .map((r) => r.key)
      .join(", ");
    super(
      `Welcome to Alaska Tours ('${WTA_AFFILIATE_PARTNER_ID}') paid affiliate activation is gated in production until approved credentials and agreed terms are configured. Missing: ${missingKeys || "none"}.`,
    );
    this.name = "WtaAffiliateProductionGateError";
    this.gateStatus = gateStatus;
  }
}

export class WtaSimulatorPreviewOnlyError extends Error {
  public readonly code = "WTA_SIMULATOR_PREVIEW_ONLY" as const;
  public readonly statusCode = 403 as const;

  constructor() {
    super(
      "The WTA affiliate lifecycle simulator ('preview_simulate') is strictly preview-only and disabled in production runtimes. Use the live WTA referral handoff, FareHarbor booking confirmation, and commission settlement endpoints instead.",
    );
    this.name = "WtaSimulatorPreviewOnlyError";
  }
}

export class WtaReferralKeyCannotWriteOutcomeError extends Error {
  public readonly code = "WTA_REFERRAL_KEY_CANNOT_WRITE_OUTCOMES" as const;
  public readonly statusCode = 403 as const;
  public readonly callerClientId: string;

  constructor(callerClientId: string, attemptedStage: "booking" | "settlement" | "outcome") {
    super(
      `Welcome to Alaska Tours referral credential ('${callerClientId}') is scoped strictly to referral attribution ('referral_attribution_only') and cannot write ${attemptedStage} records.`,
    );
    this.name = "WtaReferralKeyCannotWriteOutcomeError";
    this.callerClientId = callerClientId;
  }
}

/**
 * Parses either draft or active WTA commercial terms JSON while strictly enforcing the
 * canonical field names (`agreementId`, `attributionWindowDays`, `signedAt`, `effectiveAt`,
 * `approvedByDcc`, `approvedByPartner`, `commissionRateBps`, `commissionAppliesTo`, `commissionPaidBy`, `payoutSchedule`).
 */
export function parseWtaCommercialTerms(
  rawInput?: string | Record<string, unknown> | null,
): WtaCommercialTerms | null {
  if (!rawInput) return null;
  try {
    const parsed: Record<string, unknown> =
      typeof rawInput === "string"
        ? (JSON.parse(rawInput) as Record<string, unknown>)
        : rawInput;

    // Strictly require exact camelCase keys including lowercase `attributionWindowDays`
    if (!Object.prototype.hasOwnProperty.call(parsed, "attributionWindowDays")) {
      return null;
    }

    const agreementId =
      typeof parsed.agreementId === "string" ? parsed.agreementId.trim() : "";
    const partnerId =
      typeof parsed.partnerId === "string" ? parsed.partnerId.trim() : "";
    const partnerLegalName =
      typeof parsed.partnerLegalName === "string" && parsed.partnerLegalName.trim()
        ? parsed.partnerLegalName.trim()
        : WTA_AFFILIATE_LEGAL_NAME;
    const commissionRateBps =
      typeof parsed.commissionRateBps === "number" ? parsed.commissionRateBps : NaN;
    const commissionAppliesTo =
      typeof parsed.commissionAppliesTo === "string" &&
      parsed.commissionAppliesTo.trim()
        ? parsed.commissionAppliesTo.trim()
        : WTA_DEFAULT_COMMISSION_APPLIES_TO;
    const commissionPaidBy =
      typeof parsed.commissionPaidBy === "string" && parsed.commissionPaidBy.trim()
        ? parsed.commissionPaidBy.trim()
        : WTA_DEFAULT_COMMISSION_PAID_BY;
    const attributionWindowDays =
      typeof parsed.attributionWindowDays === "number"
        ? parsed.attributionWindowDays
        : NaN;
    const payoutSchedule =
      typeof parsed.payoutSchedule === "string" ? parsed.payoutSchedule.trim() : "";

    const signedAt =
      typeof parsed.signedAt === "string" && parsed.signedAt.trim()
        ? parsed.signedAt.trim()
        : null;
    const effectiveAt =
      typeof parsed.effectiveAt === "string" && parsed.effectiveAt.trim()
        ? parsed.effectiveAt.trim()
        : null;
    const approvedByDcc = parsed.approvedByDcc === true;
    const approvedByPartner = parsed.approvedByPartner === true;

    if (
      !agreementId ||
      partnerId !== WTA_AFFILIATE_PARTNER_ID ||
      !Number.isFinite(commissionRateBps) ||
      commissionRateBps <= 0 ||
      commissionRateBps > 5000 ||
      !Number.isFinite(attributionWindowDays) ||
      attributionWindowDays <= 0 ||
      !payoutSchedule ||
      !commissionAppliesTo ||
      !commissionPaidBy
    ) {
      return null;
    }

    if (signedAt !== null && Number.isNaN(Date.parse(signedAt))) {
      return null;
    }
    if (effectiveAt !== null && Number.isNaN(Date.parse(effectiveAt))) {
      return null;
    }

    const bothApprovedAndSigned =
      approvedByDcc &&
      approvedByPartner &&
      signedAt !== null &&
      effectiveAt !== null &&
      parsed.status !== "draft";

    return {
      agreementId,
      partnerId: WTA_AFFILIATE_PARTNER_ID,
      partnerLegalName,
      status: bothApprovedAndSigned ? "active" : "draft",
      commissionRateBps,
      commissionAppliesTo,
      commissionPaidBy,
      attributionWindowDays,
      payoutSchedule,
      signedAt,
      effectiveAt,
      approvedByDcc,
      approvedByPartner,
    };
  } catch {
    return null;
  }
}

/**
 * Returns non-null ONLY when commercial terms have been approved by BOTH parties
 * (`approvedByDcc: true`, `approvedByPartner: true`) and have valid `signedAt` and `effectiveAt` timestamps.
 * Draft terms return `null` so production activation stays gated until both parties approve.
 */
export function parseWtaAgreedCommercialTerms(
  rawJson?: string | Record<string, unknown> | null,
): WtaAgreedCommercialTerms | null {
  const terms = parseWtaCommercialTerms(rawJson);
  if (!terms) return null;
  if (
    terms.status !== "active" ||
    !terms.approvedByDcc ||
    !terms.approvedByPartner ||
    !terms.signedAt ||
    !terms.effectiveAt
  ) {
    return null;
  }
  return {
    ...terms,
    status: "active",
    signedAt: terms.signedAt,
    effectiveAt: terms.effectiveAt,
    approvedByDcc: true,
    approvedByPartner: true,
  };
}

export function evaluateWtaAffiliateActivationGate(options?: {
  runtimeEnv?: string;
  vercelEnv?: string;
  liveApiKey?: string;
  previewApiKey?: string;
  webhookHmacSecret?: string;
  termsJson?: string;
}): WtaAffiliateActivationGateStatus {
  const nodeEnv = options?.runtimeEnv ?? process.env.NODE_ENV ?? "development";
  const vercelEnv = options?.vercelEnv ?? process.env.VERCEL_ENV ?? "";

  const isProductionRuntime =
    vercelEnv === "production" ||
    (nodeEnv === "production" && vercelEnv !== "preview");

  const environment: WtaAffiliateActivationGateStatus["environment"] =
    isProductionRuntime
      ? "production"
      : vercelEnv === "preview"
        ? "preview"
        : nodeEnv === "test"
          ? "test"
          : "development";

  const liveApiKey = (
    options?.liveApiKey ??
    process.env.DCC_WTA_AFFILIATE_LIVE_API_KEY ??
    ""
  ).trim();
  const previewApiKey = (
    options?.previewApiKey ??
    process.env.DCC_WTA_AFFILIATE_PREVIEW_API_KEY ??
    ""
  ).trim();
  const webhookHmacSecret = (
    options?.webhookHmacSecret ??
    process.env.DCC_WTA_WEBHOOK_HMAC_SECRET ??
    ""
  ).trim();
  const termsJson =
    options?.termsJson ?? process.env.DCC_WTA_AFFILIATE_TERMS_JSON ?? "";

  const hasLiveApiKey =
    liveApiKey.length >= 24 && liveApiKey !== WTA_REVOKED_PREVIEW_API_TOKEN_V1;
  const hasPreviewApiKey =
    previewApiKey.length >= 24 &&
    previewApiKey !== WTA_REVOKED_PREVIEW_API_TOKEN_V1;
  const hasWebhookHmacSecret = webhookHmacSecret.length >= 32;
  const credentialsApproved = hasLiveApiKey && hasWebhookHmacSecret;

  const parsedCandidate = parseWtaCommercialTerms(termsJson);
  const draftTerms = parsedCandidate ?? WTA_DRAFT_COMMERCIAL_TERMS;
  const parsedTerms = parseWtaAgreedCommercialTerms(termsJson);
  const termsAgreed = parsedTerms !== null;

  const missingProductionRequirements: MissingWtaProductionRequirement[] = [];
  if (!hasLiveApiKey) {
    missingProductionRequirements.push({
      key: "DCC_WTA_AFFILIATE_LIVE_API_KEY",
      category: "approved_credentials",
      description:
        "Approved production server-side Bearer/API credential for Welcome to Alaska Tours (partner:welcome-to-alaska:live, minimum 24 chars, scoped strictly to referral handoff + read).",
      exampleFormat: "dcc_wta_live_<32_char_random_secret>",
    });
  }
  if (!hasWebhookHmacSecret) {
    missingProductionRequirements.push({
      key: "DCC_WTA_WEBHOOK_HMAC_SECRET",
      category: "approved_credentials",
      description:
        "Shared 32+ byte HMAC-SHA256 signing secret between Welcome to Alaska Tours and DCC for server-to-server attribution verification.",
      exampleFormat: "<64_hex_char_hmac_sha256_secret>",
    });
  }
  if (!termsAgreed) {
    missingProductionRequirements.push({
      key: "DCC_WTA_AFFILIATE_TERMS_JSON",
      category: "agreed_terms",
      description:
        "Countersigned commercial affiliate terms JSON specifying agreementId, partnerId, partnerLegalName, status: 'active', commissionRateBps: 1200, commissionAppliesTo, commissionPaidBy, attributionWindowDays: 30, payoutSchedule: 'net_30_after_travel', signedAt, effectiveAt, approvedByDcc: true, and approvedByPartner: true.",
      exampleFormat: JSON.stringify({
        ...WTA_DRAFT_COMMERCIAL_TERMS,
        status: "active",
        signedAt: "2026-11-04T00:00:00Z",
        effectiveAt: "2026-11-04T00:00:00Z",
        approvedByDcc: true,
        approvedByPartner: true,
      }),
    });
  }

  return {
    partnerId: WTA_AFFILIATE_PARTNER_ID,
    partnerName: WTA_AFFILIATE_PARTNER_NAME,
    partnerDomain: WTA_AFFILIATE_DOMAIN,
    relationshipClass: "paid_external_affiliate",
    inDccPortfolioNetworkSites: false,
    authScope: "referral_attribution_only",
    allowedMachineScopes: [
      "dcc:read:public",
      "dcc:commerce:handoff",
      "dcc:commerce:read",
    ],
    grantsLoginAccess: false,
    grantsReportingAccess: false,
    grantsPayoutAccess: false,
    grantsSelfConfirmOrCommissionWriteAccess: false,
    environment,
    isProductionRuntime,
    previewEnrollmentActive: !isProductionRuntime && (hasPreviewApiKey || nodeEnv === "test"),
    previewSimulatorAllowed: !isProductionRuntime,
    productionActivationAllowed: credentialsApproved && termsAgreed,
    credentialsApproved,
    termsAgreed,
    draftTerms,
    parsedTerms,
    missingProductionRequirements,
    statusCodeWhenBlockedInProduction: 403,
    errorCodeWhenBlockedInProduction: "WTA_AFFILIATE_PRODUCTION_ACTIVATION_GATED",
  };
}

export function isWtaAffiliateCallerOrAttribution(params: {
  callerClientId?: string | null;
  originatingSite?: string | null;
  approvedPartnerAttribution?: {
    partnerId: string;
    partnerName?: string | null;
  } | null;
}): boolean {
  const clientId = (params.callerClientId ?? "").trim().toLowerCase();
  const site = (params.originatingSite ?? "").trim().toLowerCase();
  const partnerId = (params.approvedPartnerAttribution?.partnerId ?? "")
    .trim()
    .toLowerCase();

  return (
    clientId === WTA_PREVIEW_CLIENT_ID ||
    clientId === WTA_LIVE_CLIENT_ID ||
    clientId.startsWith("partner:welcome-to-alaska:") ||
    site.includes("welcometoalaskatours.com") ||
    site === "welcome-to-alaska" ||
    partnerId === WTA_AFFILIATE_PARTNER_ID ||
    partnerId === WTA_AFFILIATE_DOMAIN
  );
}

export function assertCallerIsNotWtaReferralKey(
  callerClientId: string | null | undefined,
  attemptedStage: "booking" | "settlement" | "outcome" = "outcome",
): void {
  const normalized = (callerClientId ?? "").trim().toLowerCase();
  if (
    normalized === WTA_PREVIEW_CLIENT_ID ||
    normalized === WTA_LIVE_CLIENT_ID ||
    normalized.startsWith("partner:welcome-to-alaska:") ||
    normalized === WTA_AFFILIATE_PARTNER_ID ||
    normalized === WTA_AFFILIATE_DOMAIN
  ) {
    throw new WtaReferralKeyCannotWriteOutcomeError(
      callerClientId || WTA_AFFILIATE_PARTNER_ID,
      attemptedStage,
    );
  }
}

/**
 * Enforces the WTA paid affiliate enrollment & production gate and returns the canonical
 * `ApprovedPartnerAttribution` record (`referral_attribution_only`) when WTA is the caller or partner.
 */
export function enforceAndResolveWtaAffiliateAttribution(params: {
  callerClientId?: string | null;
  originatingSite?: string | null;
  approvedPartnerAttribution?: {
    partnerId: string;
    partnerName?: string | null;
  } | null;
  gateOverrideOptions?: Parameters<typeof evaluateWtaAffiliateActivationGate>[0];
}): {
  isWtaAffiliate: boolean;
  approvedPartnerAttribution: ApprovedPartnerAttribution | null;
  gateStatus: WtaAffiliateActivationGateStatus | null;
} {
  if (!isWtaAffiliateCallerOrAttribution(params)) {
    return {
      isWtaAffiliate: false,
      approvedPartnerAttribution: null,
      gateStatus: null,
    };
  }

  const gateStatus = evaluateWtaAffiliateActivationGate(
    params.gateOverrideOptions,
  );
  const clientId = (params.callerClientId ?? "").trim();

  // Require an authenticated WTA partner credential rather than anonymous browser spoofing
  if (
    clientId !== WTA_PREVIEW_CLIENT_ID &&
    clientId !== WTA_LIVE_CLIENT_ID
  ) {
    const err = new Error(
      `Welcome to Alaska Tours ('${WTA_AFFILIATE_PARTNER_ID}') referrals require an authenticated WTA partner server-side credential ('${WTA_PREVIEW_CLIENT_ID}' in preview or '${WTA_LIVE_CLIENT_ID}' in production). Caller was '${clientId || "anonymous"}'.`,
    ) as Error & { code?: string; statusCode?: number };
    err.code = "WTA_AFFILIATE_SERVER_CREDENTIAL_REQUIRED";
    err.statusCode = 401;
    throw err;
  }

  // Gate production activation on approved credentials AND agreed commercial terms
  if (
    gateStatus.isProductionRuntime &&
    (!gateStatus.productionActivationAllowed || clientId === WTA_PREVIEW_CLIENT_ID)
  ) {
    throw new WtaAffiliateProductionGateError(gateStatus);
  }

  return {
    isWtaAffiliate: true,
    approvedPartnerAttribution: {
      partnerId: WTA_AFFILIATE_PARTNER_ID,
      partnerName: WTA_AFFILIATE_PARTNER_NAME,
      authScope: "referral_attribution_only",
      grantsLoginAccess: false,
      grantsReportingAccess: false,
      grantsPayoutAccess: false,
    },
    gateStatus,
  };
}

export interface CreateWtaTaggedReferralInput {
  callerClientId: string;
  originatingSite?: string;
  sourcePagePath?: string;
  targetSite?: string;
  fareharborShortname?: string;
  fareharborItemId?: string;
  productCode?: string;
  productTitle?: string;
  productDestinationUrl?: string;
  campaign?: string;
  intendedDate?: string;
  partySize?: number;
  quotedPriceAmount?: number;
  quotedPriceCurrency?: string;
  metadata?: Record<string, unknown>;
  gateOverrideOptions?: Parameters<typeof evaluateWtaAffiliateActivationGate>[0];
}

/**
 * Live WTA referral creation path: allows WTA's server-side credential (`partner:welcome-to-alaska:live`
 * in production when gate is open, or `partner:welcome-to-alaska:preview` in preview) to create a
 * tagged referral handoff record (`dcc_commercial_handoffs`) from the actual WTA site.
 */
export async function createWtaTaggedReferralHandoff(
  input: CreateWtaTaggedReferralInput,
): Promise<{
  handoff: CommercialHandoffRecord;
  gateStatus: WtaAffiliateActivationGateStatus;
}> {
  const { approvedPartnerAttribution, gateStatus } =
    enforceAndResolveWtaAffiliateAttribution({
      callerClientId: input.callerClientId,
      originatingSite: input.originatingSite || WTA_AFFILIATE_DOMAIN,
      approvedPartnerAttribution: {
        partnerId: WTA_AFFILIATE_PARTNER_ID,
        partnerName: WTA_AFFILIATE_PARTNER_NAME,
      },
      gateOverrideOptions: input.gateOverrideOptions,
    });

  if (!approvedPartnerAttribution || !gateStatus) {
    throw new Error("Failed to resolve WTA affiliate attribution.");
  }

  const partySize =
    typeof input.partySize === "number" && input.partySize > 0
      ? Math.round(input.partySize)
      : 2;
  const intendedDate = input.intendedDate?.trim() || "2026-07-15";
  const fareharborShortname =
    input.fareharborShortname?.trim() || "coastalhelicopters";
  const fareharborItemId = input.fareharborItemId?.trim() || "413056";
  const productCode =
    input.productCode?.trim() || "coastal-helicopters-icefield-excursion";
  const productTitle =
    input.productTitle?.trim() ||
    "Icefield Excursion (Coastal Helicopters • Item 413056)";
  const quotedPriceAmount =
    typeof input.quotedPriceAmount === "number" && input.quotedPriceAmount > 0
      ? input.quotedPriceAmount
      : partySize * 459;

  const handoff = await createCommercialHandoff({
    originatingSite: input.originatingSite?.trim() || WTA_AFFILIATE_DOMAIN,
    targetSite: input.targetSite?.trim() || "juneauflightdeck.com",
    provider: "fareharbor",
    fareharborShortname,
    fareharborItemId,
    productCode,
    productTitle,
    productDestinationUrl:
      input.productDestinationUrl?.trim() ||
      `https://juneauflightdeck.com/helicopter?port=juneau-ak&operator=coastal-helicopters&item=${encodeURIComponent(fareharborItemId)}&date=${encodeURIComponent(intendedDate)}&partySize=${partySize}`,
    campaign: input.campaign?.trim() || "wta-juneau-coastal-icefield-413056",
    intendedDate,
    partySize,
    quotedPriceAmount,
    quotedPriceCurrency: input.quotedPriceCurrency?.trim() || "USD",
    approvedPartnerAttribution,
    callerClientId: input.callerClientId,
    metadata: {
      enrollmentChannel:
        input.callerClientId === WTA_LIVE_CLIENT_ID
          ? "wta_paid_affiliate_live"
          : "wta_paid_affiliate_preview",
      partnerId: WTA_AFFILIATE_PARTNER_ID,
      partnerDomain: WTA_AFFILIATE_DOMAIN,
      sourcePagePath:
        input.sourcePagePath?.trim() || "/ports/juneau/shore-excursions",
      agreementId:
        gateStatus.parsedTerms?.agreementId ??
        gateStatus.draftTerms.agreementId,
      commissionRateBps:
        gateStatus.parsedTerms?.commissionRateBps ??
        gateStatus.draftTerms.commissionRateBps,
      attributionWindowDays:
        gateStatus.parsedTerms?.attributionWindowDays ??
        gateStatus.draftTerms.attributionWindowDays,
      payoutSchedule:
        gateStatus.parsedTerms?.payoutSchedule ??
        gateStatus.draftTerms.payoutSchedule,
      ...(input.metadata ?? {}),
    },
  });

  return { handoff, gateStatus };
}

/**
 * Genuine FareHarbor External API v1 / Webhook `booking` record structure.
 * Matches FareHarbor External API v1 `/api/external/v1/companies/{shortname}/bookings/{uuid}/`
 * and FareHarbor webhook payload `{ booking: { ... } }`.
 */
export interface FareHarborExternalBookingRecord {
  pk: number;
  uuid: string;
  display_id?: string;
  status: "booked" | "cancelled" | string;
  is_paid?: boolean;
  created_at?: string;
  updated_at?: string;
  /** Subtotal in cents (excluding taxes/fees), e.g., 91800 = $918.00 for 2 passengers on item 413056 */
  receipt_subtotal: number;
  receipt_taxes?: number;
  receipt_total?: number;
  amount_paid?: number;
  invoice_price?: number;
  currency?: string;
  voucher_number?: string | null;
  reference?: string | null;
  note?: string | null;
  handoff_id?: string | null;
  click_id?: string | null;
  affiliate_company?: {
    shortname: string;
    name?: string;
    asn_parameter?: string | null;
  } | null;
  company: {
    shortname: string;
    name?: string;
  };
  item?: {
    pk: number;
    name: string;
  } | null;
  availability: {
    pk: number;
    start_at: string;
    end_at?: string;
    item?: {
      pk: number;
      name: string;
    };
  };
  customer_count?: number;
  customers?: Array<{
    pk: number;
    customer_type_rate?: {
      pk?: number;
      total?: number;
      customer_prototype?: {
        pk: number;
        display_name: string;
        total?: number;
      };
    };
  }>;
}

/**
 * Confirms a WTA affiliate sale from a genuine FareHarbor `booking` record.
 * - Rejects WTA's referral credential (`partner:welcome-to-alaska:*`) with `403 WTA_REFERRAL_KEY_CANNOT_WRITE_OUTCOMES`.
 * - Extracts the net tour subtotal (`receipt_subtotal` in cents -> USD dollars), computes the 12% (`1200` bps)
 *   estimated commission, and records `BOOKING_CONFIRMED` in `dcc_commercial_outcomes` with `paidCommission.amount: null`.
 */
export async function confirmWtaSaleFromFareHarborBooking(params: {
  reporterClientId: string;
  booking: FareHarborExternalBookingRecord;
  handoffId?: string | null;
}): Promise<CommercialOutcomeRecord> {
  assertCallerIsNotWtaReferralKey(params.reporterClientId, "booking");

  const booking = params.booking;
  if (
    !booking ||
    typeof booking !== "object" ||
    typeof booking.uuid !== "string" ||
    !booking.uuid.trim() ||
    typeof booking.pk !== "number" ||
    !booking.company?.shortname ||
    typeof booking.receipt_subtotal !== "number" ||
    booking.receipt_subtotal <= 0 ||
    !booking.availability?.start_at
  ) {
    const err = new Error(
      "A genuine FareHarbor booking record requires numeric pk, non-empty uuid, company.shortname, availability.start_at, and positive integer receipt_subtotal (in cents).",
    ) as Error & { code?: string; statusCode?: number };
    err.code = "INVALID_FAREHARBOR_BOOKING_RECORD";
    err.statusCode = 422;
    throw err;
  }

  if (String(booking.status).toLowerCase() !== "booked") {
    const err = new Error(
      `FareHarbor booking '${booking.display_id || booking.uuid}' has status '${booking.status}' and cannot confirm a sale.`,
    ) as Error & { code?: string; statusCode?: number };
    err.code = "FAREHARBOR_BOOKING_NOT_BOOKED";
    err.statusCode = 422;
    throw err;
  }

  const candidateHandoffRef =
    params.handoffId ||
    booking.handoff_id ||
    booking.voucher_number ||
    booking.reference ||
    booking.note ||
    booking.affiliate_company?.asn_parameter ||
    null;

  const resolvedItem = booking.item ?? booking.availability.item ?? null;
  const bookedDate = booking.availability.start_at.slice(0, 10);
  const bookedPartySize =
    typeof booking.customer_count === "number" && booking.customer_count > 0
      ? booking.customer_count
      : Array.isArray(booking.customers) && booking.customers.length > 0
        ? booking.customers.length
        : null;

  // FareHarbor monetary values (`receipt_subtotal`, `receipt_total`) are in integer cents
  const netSubtotalUsd = Number((booking.receipt_subtotal / 100).toFixed(2));
  const gate = evaluateWtaAffiliateActivationGate();
  const commissionRateBps =
    gate.parsedTerms?.commissionRateBps ??
    gate.draftTerms.commissionRateBps ??
    WTA_DEFAULT_COMMISSION_RATE_BPS;

  const estimatedCommissionUsd = Number(
    ((netSubtotalUsd * commissionRateBps) / 10_000).toFixed(2),
  );
  const currency = (booking.currency || "USD").toUpperCase();
  const providerBookingRef =
    booking.display_id?.trim() || `FH-${booking.pk}-${booking.uuid.slice(0, 8)}`;

  return recordCommercialOutcome({
    reporterClientId: params.reporterClientId,
    reporterProvenance: "fareharbor_booking_webhook",
    provider: "fareharbor",
    providerAccount: booking.company.shortname,
    providerBookingRef,
    eventType: "BOOKING_CONFIRMED",
    providerEventTime:
      booking.updated_at || booking.created_at || new Date().toISOString(),
    handoffId: candidateHandoffRef,
    clickId: booking.click_id ?? candidateHandoffRef,
    campaignOrRefValue:
      booking.voucher_number ??
      booking.reference ??
      booking.affiliate_company?.asn_parameter ??
      null,
    bookedProductCode: resolvedItem
      ? `fareharbor:${booking.company.shortname}:${resolvedItem.pk}`
      : null,
    bookedDate,
    bookedOption: resolvedItem?.name ?? null,
    bookedPartySize,
    bookingValueAmount: netSubtotalUsd,
    bookingValueCurrency: currency,
    estimatedCommissionAmount: estimatedCommissionUsd,
    estimatedCommissionCurrency: currency,
    paidCommissionAmount: null,
    paidCommissionCurrency: null,
    rawPayload: {
      source: "fareharbor_external_api_v1_booking",
      fareharborBookingPk: booking.pk,
      fareharborBookingUuid: booking.uuid,
      fareharborDisplayId: booking.display_id ?? providerBookingRef,
      companyShortname: booking.company.shortname,
      itemPk: resolvedItem?.pk ?? null,
      itemName: resolvedItem?.name ?? null,
      availabilityPk: booking.availability.pk,
      availabilityStartAt: booking.availability.start_at,
      receiptSubtotalCents: booking.receipt_subtotal,
      receiptTaxesCents: booking.receipt_taxes ?? 0,
      receiptTotalCents: booking.receipt_total ?? booking.receipt_subtotal,
      commissionRateBps,
      commissionAppliesTo: "receipt_subtotal",
    },
  });
}

/**
 * Genuine affiliate commission settlement record used to mark an attributed WTA booking's commission paid
 * (`net_30_after_travel`).
 */
export interface WtaCommissionSettlementRecord {
  settlementId: string;
  agreementId: string;
  partnerId: "welcome-to-alaska";
  payerParty: string;
  payeeLegalName: string;
  handoffId: string;
  providerBookingRef: string;
  travelCompletedAt: string;
  settledAt: string;
  payoutSchedule: "net_30_after_travel";
  netTourSubtotalAmount: number;
  commissionRateBps: number;
  paidCommissionAmount: number;
  paidCommissionCurrency?: string;
  payoutMethod?: "ach_transfer" | "wire_transfer" | "asn_clearing";
  payoutReference: string;
}

/**
 * Marks commission paid (`COMMISSION_RECONCILED`) from a genuine settlement record.
 * - Rejects WTA's referral credential (`partner:welcome-to-alaska:*`) with `403 WTA_REFERRAL_KEY_CANNOT_WRITE_OUTCOMES`.
 * - Verifies that a confirmed booking record (`BOOKING_CONFIRMED`) already exists for the handoff and booking reference.
 * - Verifies the 12% (`1200` bps) calculation against `netTourSubtotalAmount` and `net_30_after_travel` payout schedule.
 */
export async function settleWtaCommissionFromSettlementRecord(params: {
  reporterClientId: string;
  settlement: WtaCommissionSettlementRecord;
}): Promise<CommercialOutcomeRecord> {
  assertCallerIsNotWtaReferralKey(params.reporterClientId, "settlement");

  const s = params.settlement;
  if (
    !s ||
    typeof s !== "object" ||
    typeof s.settlementId !== "string" ||
    !s.settlementId.trim().startsWith("stl_") ||
    s.partnerId !== WTA_AFFILIATE_PARTNER_ID ||
    !s.agreementId?.trim() ||
    !s.handoffId?.trim() ||
    !s.providerBookingRef?.trim() ||
    !s.payoutReference?.trim() ||
    s.payoutSchedule !== "net_30_after_travel" ||
    typeof s.netTourSubtotalAmount !== "number" ||
    s.netTourSubtotalAmount <= 0 ||
    typeof s.commissionRateBps !== "number" ||
    s.commissionRateBps <= 0 ||
    typeof s.paidCommissionAmount !== "number" ||
    s.paidCommissionAmount <= 0 ||
    Number.isNaN(Date.parse(s.travelCompletedAt)) ||
    Number.isNaN(Date.parse(s.settledAt))
  ) {
    const err = new Error(
      "A valid WTA commission settlement record requires settlementId ('stl_...'), agreementId, partnerId ('welcome-to-alaska'), handoffId, providerBookingRef, travelCompletedAt, settledAt, payoutSchedule ('net_30_after_travel'), netTourSubtotalAmount, commissionRateBps, paidCommissionAmount, and payoutReference.",
    ) as Error & { code?: string; statusCode?: number };
    err.code = "INVALID_WTA_SETTLEMENT_RECORD";
    err.statusCode = 422;
    throw err;
  }

  const expectedCommission = Number(
    ((s.netTourSubtotalAmount * s.commissionRateBps) / 10_000).toFixed(2),
  );
  if (Math.abs(expectedCommission - s.paidCommissionAmount) > 0.01) {
    const err = new Error(
      `Settlement paidCommissionAmount (${s.paidCommissionAmount}) does not match ${s.commissionRateBps} bps of netTourSubtotalAmount (${s.netTourSubtotalAmount} -> expected ${expectedCommission}).`,
    ) as Error & { code?: string; statusCode?: number };
    err.code = "SETTLEMENT_COMMISSION_MISMATCH";
    err.statusCode = 422;
    throw err;
  }

  const existingOutcomes = await listCommercialOutcomes({
    handoffId: s.handoffId.trim(),
  });
  const matchingConfirmedBooking = existingOutcomes.find(
    (o) =>
      o.eventType === "BOOKING_CONFIRMED" &&
      o.providerBookingRef === s.providerBookingRef.trim(),
  );
  if (!matchingConfirmedBooking) {
    const err = new Error(
      `Cannot record commission settlement '${s.settlementId}' before a provider-confirmed booking ('BOOKING_CONFIRMED') exists for handoff '${s.handoffId}' and booking '${s.providerBookingRef}'.`,
    ) as Error & { code?: string; statusCode?: number };
    err.code = "SETTLEMENT_REQUIRES_CONFIRMED_BOOKING";
    err.statusCode = 409;
    throw err;
  }

  const currency = (s.paidCommissionCurrency || "USD").toUpperCase();

  return recordCommercialOutcome({
    reporterClientId: params.reporterClientId,
    reporterProvenance: "wta_commission_settlement_ledger",
    provider: matchingConfirmedBooking.provider,
    providerAccount: matchingConfirmedBooking.providerAccount,
    providerBookingRef: matchingConfirmedBooking.providerBookingRef,
    eventType: "COMMISSION_RECONCILED",
    providerEventTime: s.settledAt,
    handoffId: matchingConfirmedBooking.handoffId,
    bookedProductCode: matchingConfirmedBooking.bookedProductCode,
    bookedDate: matchingConfirmedBooking.bookedDate,
    bookedOption: matchingConfirmedBooking.bookedOption,
    bookedPartySize: matchingConfirmedBooking.bookedPartySize,
    bookingValueAmount: s.netTourSubtotalAmount,
    bookingValueCurrency: currency,
    estimatedCommissionAmount:
      matchingConfirmedBooking.estimatedCommission.amount ?? expectedCommission,
    estimatedCommissionCurrency: currency,
    paidCommissionAmount: s.paidCommissionAmount,
    paidCommissionCurrency: currency,
    rawPayload: {
      source: "wta_commission_settlement_record",
      settlementId: s.settlementId,
      agreementId: s.agreementId,
      partnerId: s.partnerId,
      payerParty: s.payerParty,
      payeeLegalName: s.payeeLegalName,
      travelCompletedAt: s.travelCompletedAt,
      settledAt: s.settledAt,
      payoutSchedule: s.payoutSchedule,
      netTourSubtotalAmount: s.netTourSubtotalAmount,
      commissionRateBps: s.commissionRateBps,
      paidCommissionAmount: s.paidCommissionAmount,
      payoutMethod: s.payoutMethod ?? "ach_transfer",
      payoutReference: s.payoutReference,
    },
  });
}

export interface WtaSeparateLifecycleProof {
  verified: boolean;
  partnerId: typeof WTA_AFFILIATE_PARTNER_ID;
  callerClientId: string;
  referralRecord: {
    recordTable: "dcc_commercial_handoffs";
    recordType: "tagged_referral_handoff";
    handoffId: string;
    clickId: string;
    originatingSite: string;
    targetSite: string | null;
    provider: CommercialProvider;
    productCode: string;
    outboundAffiliateUrl: string;
    attributionParameterName: string;
    attributionParameterValue: string;
    approvedPartnerAttribution: ApprovedPartnerAttribution | null;
    clickIsBooking: false;
    createdAt: string;
  };
  bookingRecord: {
    recordTable: "dcc_commercial_outcomes";
    recordType: "provider_confirmed_booking";
    outcomeId: string;
    handoffId: string | null;
    reporterClientId: string;
    reporterProvenance: string;
    providerBookingRef: string;
    eventType: "BOOKING_CONFIRMED";
    bookingValueAmount: number | null;
    bookingValueCurrency: string | null;
    estimatedCommissionAmount: number | null;
    paidCommissionAmount: number | null;
    reconciliationStatus: "matched" | "unmatched";
    recordedAt: string;
  } | null;
  commissionRecord: {
    recordTable: "dcc_commercial_outcomes";
    recordType: "commission_reconciliation";
    outcomeId: string;
    handoffId: string | null;
    reporterClientId: string;
    reporterProvenance: string;
    providerBookingRef: string;
    eventType: "COMMISSION_RECONCILED";
    bookingValueAmount: number | null;
    estimatedCommissionAmount: number | null;
    paidCommissionAmount: number | null;
    paidCommissionCurrency: string | null;
    reconciliationStatus: "matched" | "unmatched";
    recordedAt: string;
  } | null;
  separationAssertions: {
    referralHasPartnerAttributionOnlyScope: boolean;
    referralClickIsNotBooking: boolean;
    referralAndBookingAreSeparateRecords: boolean;
    bookingAndCommissionAreSeparateRecords: boolean;
    bookingRecordHasNullPaidCommissionBeforeSettlement: boolean;
    commissionRecordHasVerifiedPaidCommission: boolean;
    distinctPrimaryIds: string[];
  };
}

export async function inspectWtaReferralLifecycleSeparation(
  handoffId: string,
): Promise<WtaSeparateLifecycleProof | null> {
  const handoff: CommercialHandoffRecord | null =
    await getCommercialHandoffById(handoffId);
  if (!handoff) return null;

  const outcomes: CommercialOutcomeRecord[] = await listCommercialOutcomes({
    handoffId: handoff.handoffId,
  });

  const bookingOutcome =
    outcomes.find((o) => o.eventType === "BOOKING_CONFIRMED") ?? null;
  const commissionOutcome =
    outcomes.find((o) => o.eventType === "COMMISSION_RECONCILED") ?? null;

  const distinctIds = new Set<string>([handoff.handoffId]);
  if (bookingOutcome) distinctIds.add(bookingOutcome.outcomeId);
  if (commissionOutcome) distinctIds.add(commissionOutcome.outcomeId);

  const referralHasPartnerAttributionOnlyScope =
    handoff.approvedPartnerAttribution?.partnerId === WTA_AFFILIATE_PARTNER_ID &&
    handoff.approvedPartnerAttribution?.authScope === "referral_attribution_only" &&
    handoff.approvedPartnerAttribution?.grantsLoginAccess === false &&
    handoff.approvedPartnerAttribution?.grantsReportingAccess === false &&
    handoff.approvedPartnerAttribution?.grantsPayoutAccess === false;

  const referralClickIsNotBooking = handoff.outcomeState.clickIsBooking === false;
  const referralAndBookingAreSeparateRecords = Boolean(
    bookingOutcome && bookingOutcome.outcomeId !== handoff.handoffId,
  );
  const bookingAndCommissionAreSeparateRecords = Boolean(
    bookingOutcome &&
      commissionOutcome &&
      bookingOutcome.outcomeId !== commissionOutcome.outcomeId,
  );
  const bookingRecordHasNullPaidCommissionBeforeSettlement = Boolean(
    bookingOutcome && bookingOutcome.paidCommission.amount === null,
  );
  const commissionRecordHasVerifiedPaidCommission = Boolean(
    commissionOutcome &&
      typeof commissionOutcome.paidCommission.amount === "number" &&
      commissionOutcome.paidCommission.amount > 0,
  );

  return {
    verified:
      referralHasPartnerAttributionOnlyScope &&
      referralClickIsNotBooking &&
      referralAndBookingAreSeparateRecords &&
      bookingAndCommissionAreSeparateRecords &&
      bookingRecordHasNullPaidCommissionBeforeSettlement &&
      commissionRecordHasVerifiedPaidCommission,
    partnerId: WTA_AFFILIATE_PARTNER_ID,
    callerClientId: handoff.callerClientId,
    referralRecord: {
      recordTable: "dcc_commercial_handoffs",
      recordType: "tagged_referral_handoff",
      handoffId: handoff.handoffId,
      clickId: handoff.clickId,
      originatingSite: handoff.originatingSite,
      targetSite: handoff.targetSite,
      provider: handoff.provider,
      productCode: handoff.productCode,
      outboundAffiliateUrl: handoff.outboundAffiliateUrl,
      attributionParameterName: handoff.attributionParameterName,
      attributionParameterValue: handoff.attributionParameterValue,
      approvedPartnerAttribution: handoff.approvedPartnerAttribution,
      clickIsBooking: false,
      createdAt: handoff.createdAt,
    },
    bookingRecord: bookingOutcome
      ? {
          recordTable: "dcc_commercial_outcomes",
          recordType: "provider_confirmed_booking",
          outcomeId: bookingOutcome.outcomeId,
          handoffId: bookingOutcome.handoffId,
          reporterClientId: bookingOutcome.reporterClientId,
          reporterProvenance: bookingOutcome.reporterProvenance,
          providerBookingRef: bookingOutcome.providerBookingRef,
          eventType: "BOOKING_CONFIRMED",
          bookingValueAmount: bookingOutcome.bookingValue.amount,
          bookingValueCurrency: bookingOutcome.bookingValue.currency,
          estimatedCommissionAmount: bookingOutcome.estimatedCommission.amount,
          paidCommissionAmount: bookingOutcome.paidCommission.amount,
          reconciliationStatus: bookingOutcome.reconciliationStatus,
          recordedAt: bookingOutcome.dccRecordedAt,
        }
      : null,
    commissionRecord: commissionOutcome
      ? {
          recordTable: "dcc_commercial_outcomes",
          recordType: "commission_reconciliation",
          outcomeId: commissionOutcome.outcomeId,
          handoffId: commissionOutcome.handoffId,
          reporterClientId: commissionOutcome.reporterClientId,
          reporterProvenance: commissionOutcome.reporterProvenance,
          providerBookingRef: commissionOutcome.providerBookingRef,
          eventType: "COMMISSION_RECONCILED",
          bookingValueAmount: commissionOutcome.bookingValue.amount,
          estimatedCommissionAmount: commissionOutcome.estimatedCommission.amount,
          paidCommissionAmount: commissionOutcome.paidCommission.amount,
          paidCommissionCurrency: commissionOutcome.paidCommission.currency,
          reconciliationStatus: commissionOutcome.reconciliationStatus,
          recordedAt: commissionOutcome.dccRecordedAt,
        }
      : null,
    separationAssertions: {
      referralHasPartnerAttributionOnlyScope,
      referralClickIsNotBooking,
      referralAndBookingAreSeparateRecords,
      bookingAndCommissionAreSeparateRecords,
      bookingRecordHasNullPaidCommissionBeforeSettlement,
      commissionRecordHasVerifiedPaidCommission,
      distinctPrimaryIds: Array.from(distinctIds),
    },
  };
}

/**
 * Preview-only lifecycle simulator.
 * Strictly blocked in production runtimes (`WtaSimulatorPreviewOnlyError`, `403 WTA_SIMULATOR_PREVIEW_ONLY`)
 * even if production credentials and agreed terms are active.
 */
export async function runWtaAffiliatePreviewSimulation(params?: {
  intendedDate?: string;
  partySize?: number;
  productCode?: string;
  quotedPriceAmount?: number;
  gateOverrideOptions?: Parameters<typeof evaluateWtaAffiliateActivationGate>[0];
}): Promise<WtaSeparateLifecycleProof> {
  const gate = evaluateWtaAffiliateActivationGate(params?.gateOverrideOptions);
  if (gate.isProductionRuntime) {
    throw new WtaSimulatorPreviewOnlyError();
  }

  const intendedDate = params?.intendedDate || "2026-07-15";
  const partySize = params?.partySize || 2;
  const productCode =
    params?.productCode || "coastal-helicopters-icefield-excursion";
  const quotedPriceAmount = params?.quotedPriceAmount || 918;
  const receiptSubtotalCents = Math.round(quotedPriceAmount * 100);

  // Record 1: Tagged Referral Handoff created by WTA preview credential
  const { handoff } = await createWtaTaggedReferralHandoff({
    callerClientId: WTA_PREVIEW_CLIENT_ID,
    originatingSite: WTA_AFFILIATE_DOMAIN,
    fareharborShortname: "coastalhelicopters",
    fareharborItemId: "413056",
    productCode,
    productTitle: "Icefield Excursion (Coastal Helicopters • Item 413056)",
    intendedDate,
    partySize,
    quotedPriceAmount,
    gateOverrideOptions: params?.gateOverrideOptions,
  });

  const displayId = `#FH-COASTAL-${handoff.handoffId.slice(-8).toUpperCase()}`;

  // Record 2: Separate Provider-Confirmed Booking Record via genuine FareHarbor booking shape
  await confirmWtaSaleFromFareHarborBooking({
    reporterClientId: "client:dcc-commerce-partner-reporter",
    handoffId: handoff.handoffId,
    booking: {
      pk: 98413056,
      uuid: `b7f2c413-0560-4d2e-9a11-${handoff.handoffId.slice(-12).padStart(12, "0")}`,
      display_id: displayId,
      status: "booked",
      is_paid: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      receipt_subtotal: receiptSubtotalCents,
      receipt_taxes: 0,
      receipt_total: receiptSubtotalCents,
      amount_paid: receiptSubtotalCents,
      currency: "USD",
      voucher_number: handoff.handoffId,
      reference: handoff.clickId,
      company: {
        shortname: "coastalhelicopters",
        name: "Coastal Helicopters",
      },
      item: {
        pk: 413056,
        name: "Icefield Excursion",
      },
      availability: {
        pk: 77413056,
        start_at: `${intendedDate}T10:30:00-08:00`,
        end_at: `${intendedDate}T12:45:00-08:00`,
        item: {
          pk: 413056,
          name: "Icefield Excursion",
        },
      },
      customer_count: partySize,
      customers: Array.from({ length: partySize }, (_, idx) => ({
        pk: 500001 + idx,
        customer_type_rate: {
          pk: 882259156,
          total: Math.round(receiptSubtotalCents / partySize),
          customer_prototype: {
            pk: 2259156,
            display_name: "Standard Passenger",
            total: Math.round(receiptSubtotalCents / partySize),
          },
        },
      })),
    },
  });

  // Record 3: Separate Commission Settlement Record (`net_30_after_travel`, 12% = 1200 bps)
  const paidCommissionAmount = Number(((quotedPriceAmount * 1200) / 10_000).toFixed(2));
  await settleWtaCommissionFromSettlementRecord({
    reporterClientId: "client:dcc-commerce-partner-reporter",
    settlement: {
      settlementId: `stl_wta_${handoff.handoffId.slice(-10)}`,
      agreementId: WTA_DEFAULT_AGREEMENT_ID,
      partnerId: WTA_AFFILIATE_PARTNER_ID,
      payerParty: WTA_DEFAULT_COMMISSION_PAID_BY,
      payeeLegalName: WTA_AFFILIATE_LEGAL_NAME,
      handoffId: handoff.handoffId,
      providerBookingRef: displayId,
      travelCompletedAt: `${intendedDate}T12:45:00-08:00`,
      settledAt: new Date(Date.now() + 1000).toISOString(),
      payoutSchedule: WTA_DEFAULT_PAYOUT_SCHEDULE,
      netTourSubtotalAmount: quotedPriceAmount,
      commissionRateBps: WTA_DEFAULT_COMMISSION_RATE_BPS,
      paidCommissionAmount,
      paidCommissionCurrency: "USD",
      payoutMethod: "ach_transfer",
      payoutReference: `ACH-WTA-${handoff.handoffId.slice(-8).toUpperCase()}`,
    },
  });

  const proof = await inspectWtaReferralLifecycleSeparation(handoff.handoffId);
  if (!proof) {
    throw new Error("Failed to inspect WTA referral lifecycle separation.");
  }
  return proof;
}
