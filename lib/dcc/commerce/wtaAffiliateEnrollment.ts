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

export const WTA_AFFILIATE_PARTNER_ID = "welcome-to-alaska" as const;
export const WTA_AFFILIATE_PARTNER_NAME = "Welcome to Alaska Tours" as const;
export const WTA_AFFILIATE_DOMAIN = "welcometoalaskatours.com" as const;
export const WTA_PREVIEW_CLIENT_ID = "partner:welcome-to-alaska:preview" as const;
export const WTA_LIVE_CLIENT_ID = "partner:welcome-to-alaska:live" as const;
export const WTA_PREVIEW_API_TOKEN = "dcc_wta_affiliate_preview_v1_token" as const;

export interface WtaAgreedCommercialTerms {
  agreementId: string;
  partnerId: "welcome-to-alaska";
  partnerLegalName?: string;
  signedAt: string;
  effectiveAt: string;
  commissionRateBps: number;
  attributionWindowDays: number;
  payoutSchedule: string;
  approvedByDcc: boolean;
  approvedByPartner: boolean;
}

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
  previewEnrollmentActive: true;
  productionActivationAllowed: boolean;
  credentialsApproved: boolean;
  termsAgreed: boolean;
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

export function parseWtaAgreedCommercialTerms(
  rawJson?: string | null,
): WtaAgreedCommercialTerms | null {
  if (!rawJson || !rawJson.trim()) return null;
  try {
    const parsed = JSON.parse(rawJson) as Record<string, unknown>;
    const agreementId =
      typeof parsed.agreementId === "string" ? parsed.agreementId.trim() : "";
    const partnerId =
      typeof parsed.partnerId === "string"
        ? parsed.partnerId.trim()
        : WTA_AFFILIATE_PARTNER_ID;
    const signedAt =
      typeof parsed.signedAt === "string" ? parsed.signedAt.trim() : "";
    const effectiveAt =
      typeof parsed.effectiveAt === "string" ? parsed.effectiveAt.trim() : "";
    const commissionRateBps =
      typeof parsed.commissionRateBps === "number"
        ? parsed.commissionRateBps
        : typeof parsed.commissionPercent === "number"
          ? Math.round(parsed.commissionPercent * 100)
          : NaN;
    const attributionWindowDays =
      typeof parsed.attributionWindowDays === "number"
        ? parsed.attributionWindowDays
        : NaN;
    const payoutSchedule =
      typeof parsed.payoutSchedule === "string"
        ? parsed.payoutSchedule.trim()
        : "";
    const approvedByDcc = parsed.approvedByDcc === true;
    const approvedByPartner = parsed.approvedByPartner === true;

    if (
      !agreementId ||
      partnerId !== WTA_AFFILIATE_PARTNER_ID ||
      !signedAt ||
      Number.isNaN(Date.parse(signedAt)) ||
      !effectiveAt ||
      Number.isNaN(Date.parse(effectiveAt)) ||
      !Number.isFinite(commissionRateBps) ||
      commissionRateBps <= 0 ||
      commissionRateBps > 5000 ||
      !Number.isFinite(attributionWindowDays) ||
      attributionWindowDays <= 0 ||
      !payoutSchedule ||
      !approvedByDcc ||
      !approvedByPartner
    ) {
      return null;
    }

    return {
      agreementId,
      partnerId: WTA_AFFILIATE_PARTNER_ID,
      partnerLegalName:
        typeof parsed.partnerLegalName === "string"
          ? parsed.partnerLegalName.trim()
          : WTA_AFFILIATE_PARTNER_NAME,
      signedAt,
      effectiveAt,
      commissionRateBps,
      attributionWindowDays,
      payoutSchedule,
      approvedByDcc: true,
      approvedByPartner: true,
    };
  } catch {
    return null;
  }
}

export function evaluateWtaAffiliateActivationGate(options?: {
  runtimeEnv?: string;
  vercelEnv?: string;
  liveApiKey?: string;
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
  const webhookHmacSecret = (
    options?.webhookHmacSecret ??
    process.env.DCC_WTA_WEBHOOK_HMAC_SECRET ??
    ""
  ).trim();
  const termsJson =
    options?.termsJson ?? process.env.DCC_WTA_AFFILIATE_TERMS_JSON ?? "";

  const hasLiveApiKey = liveApiKey.length >= 24;
  const hasWebhookHmacSecret = webhookHmacSecret.length >= 32;
  const credentialsApproved = hasLiveApiKey && hasWebhookHmacSecret;

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
        "Countersigned commercial affiliate terms JSON specifying agreementId, signedAt, effectiveAt, commissionRateBps, attributionWindowDays, payoutSchedule, approvedByDcc: true, and approvedByPartner: true.",
      exampleFormat: JSON.stringify({
        agreementId: "DCC-AFF-WTA-2026-001",
        partnerId: "welcome-to-alaska",
        partnerLegalName: "Welcome to Alaska Tours LLC",
        signedAt: "2026-11-04T00:00:00Z",
        effectiveAt: "2026-11-04T00:00:00Z",
        commissionRateBps: 800,
        attributionWindowDays: 30,
        payoutSchedule: "net_30_post_service_completion",
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
    previewEnrollmentActive: true,
    productionActivationAllowed: credentialsApproved && termsAgreed,
    credentialsApproved,
    termsAgreed,
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
 * Executes a non-production preview proof demonstrating:
 * 1. WTA's server-side credential (`partner:welcome-to-alaska:preview`) creates a tagged referral record.
 * 2. An authenticated provider/commerce reporter records a separate `BOOKING_CONFIRMED` record (with `paidCommission: null`).
 * 3. After service completion & settlement reconciliation, a separate `COMMISSION_RECONCILED` record is recorded.
 */
export async function runWtaAffiliatePreviewSimulation(params?: {
  intendedDate?: string;
  partySize?: number;
  productCode?: string;
  quotedPriceAmount?: number;
}): Promise<WtaSeparateLifecycleProof> {
  const gate = evaluateWtaAffiliateActivationGate();
  if (gate.isProductionRuntime && !gate.productionActivationAllowed) {
    throw new WtaAffiliateProductionGateError(gate);
  }

  const intendedDate = params?.intendedDate || "2026-07-15";
  const partySize = params?.partySize || 2;
  const productCode =
    params?.productCode || "coastal-helicopters-icefield-excursion";
  const quotedPriceAmount = params?.quotedPriceAmount || 858;

  const { approvedPartnerAttribution } = enforceAndResolveWtaAffiliateAttribution({
    callerClientId: WTA_PREVIEW_CLIENT_ID,
    originatingSite: WTA_AFFILIATE_DOMAIN,
    approvedPartnerAttribution: {
      partnerId: WTA_AFFILIATE_PARTNER_ID,
      partnerName: WTA_AFFILIATE_PARTNER_NAME,
    },
  });

  // Record 1: Tagged Referral Handoff created by WTA server-side credential
  const handoff = await createCommercialHandoff({
    originatingSite: WTA_AFFILIATE_DOMAIN,
    targetSite: "juneauflightdeck.com",
    provider: "fareharbor",
    fareharborShortname: "coastalhelicopters",
    fareharborItemId: "104215",
    productCode,
    productTitle: "Icefield Excursion Helicopter Tour",
    productDestinationUrl:
      "https://juneauflightdeck.com/helicopter?port=juneau-ak&operator=coastal-helicopters",
    campaign: "wta-juneau-helicopter-referral",
    intendedDate,
    partySize,
    quotedPriceAmount,
    quotedPriceCurrency: "USD",
    approvedPartnerAttribution,
    callerClientId: WTA_PREVIEW_CLIENT_ID,
    metadata: {
      enrollmentChannel: "wta_paid_affiliate_preview",
      partnerDomain: WTA_AFFILIATE_DOMAIN,
    },
  });

  const providerBookingRef = `FH-COASTAL-${handoff.handoffId.slice(-8).toUpperCase()}`;

  // Record 2: Separate Provider-Confirmed Booking Record (paidCommission remains null)
  await recordCommercialOutcome({
    reporterClientId: "client:dcc-commerce-partner-reporter",
    reporterProvenance: "fareharbor_webhook_adapter",
    provider: "fareharbor",
    providerAccount: "coastalhelicopters",
    providerBookingRef,
    eventType: "BOOKING_CONFIRMED",
    providerEventTime: new Date().toISOString(),
    handoffId: handoff.handoffId,
    clickId: handoff.clickId,
    bookedProductCode: productCode,
    bookedDate: intendedDate,
    bookedPartySize: partySize,
    bookingValueAmount: quotedPriceAmount,
    bookingValueCurrency: "USD",
    estimatedCommissionAmount: 68.64,
    estimatedCommissionCurrency: "USD",
    paidCommissionAmount: null,
    paidCommissionCurrency: null,
    rawPayload: {
      stage: "provider_confirmed_booking_only",
      partnerId: WTA_AFFILIATE_PARTNER_ID,
      handoffId: handoff.handoffId,
    },
  });

  // Record 3: Separate Commission Reconciliation Record (recorded only after service completion & settlement)
  await recordCommercialOutcome({
    reporterClientId: "client:dcc-commerce-partner-reporter",
    reporterProvenance: "authenticated_payment_webhook",
    provider: "fareharbor",
    providerAccount: "coastalhelicopters",
    providerBookingRef,
    eventType: "COMMISSION_RECONCILED",
    providerEventTime: new Date(Date.now() + 1000).toISOString(),
    handoffId: handoff.handoffId,
    clickId: handoff.clickId,
    bookedProductCode: productCode,
    bookedDate: intendedDate,
    bookedPartySize: partySize,
    bookingValueAmount: quotedPriceAmount,
    bookingValueCurrency: "USD",
    estimatedCommissionAmount: 68.64,
    estimatedCommissionCurrency: "USD",
    paidCommissionAmount: 68.64,
    paidCommissionCurrency: "USD",
    rawPayload: {
      stage: "commission_reconciled_post_service",
      partnerId: WTA_AFFILIATE_PARTNER_ID,
      handoffId: handoff.handoffId,
      commissionRateBps: 800,
    },
  });

  const proof = await inspectWtaReferralLifecycleSeparation(handoff.handoffId);
  if (!proof) {
    throw new Error("Failed to inspect WTA referral lifecycle separation.");
  }
  return proof;
}
