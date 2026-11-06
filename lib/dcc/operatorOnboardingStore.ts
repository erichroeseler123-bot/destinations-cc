import { createHash, randomBytes, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { and, desc, eq } from "drizzle-orm";
import { hasConfiguredDatabaseUrl } from "@/lib/db/client";
import {
  earthosControlMapFindingHistory,
  earthosControlMapFindings,
} from "@/lib/db/schema";
import { getRequiredEarthosDb } from "@/lib/dcc/earthos/ensureEarthosSchema";
import {
  resolveEarthosEnvironmentScope,
  type EarthosEnvironmentScope,
} from "@/lib/dcc/travelReference";
import { FLAGGED_PRIOR_OUTREACH_OPERATORS } from "@/lib/dcc/operators";

export const OPERATOR_ONBOARDING_OWNER = "dcc-operator-onboarding-queue";

const FORBIDDEN_SECRET_KEYS = [
  "apikey",
  "api_key",
  "secret",
  "api_secret",
  "client_secret",
  "password",
  "bearertoken",
  "bearer_token",
  "access_token",
  "private_key",
];

export const REQUIRED_VERIFICATION_GATES_BEFORE_CUTOVER = [
  "operator_authorization_verified",
  "commercial_and_settlement_terms_signed",
  "credentials_arranged_and_verified",
  "product_mapping_verified",
  "current_prices_and_availability_verified",
  "booking_attribution_and_outcome_reporting_verified",
  "cancellation_and_cruise_return_policies_verified_separately",
] as const;

export type OperatorOnboardingPath =
  | "send_guests_to_checkout"
  | "apply_for_api_access";

export type OperatorOnboardingApplicationStatus =
  | "application_received_pending_review"
  | "api_required_keep_viator_channel"
  | "checkout_onboarding_pending_review"
  | "checkout_onboarding_reviewed";

export type OperatorReviewQueueState =
  | "pending_review"
  | "in_technical_review"
  | "archived_no_api"
  | "approved_for_sandbox"
  | "checkout_terms_confirmed"
  | "rejected";

export type CapabilityReadinessItem<TCode extends string = string> = {
  capability: "checkout" | "seat_availability" | "commission_terms" | "api_booking";
  code: TCode;
  label: string;
  ready: boolean;
  evidence: string;
  evidenceSource: string | null;
  updatedAt: string;
};

export type OperatorOfferReadinessStatuses = {
  checkout: CapabilityReadinessItem<"checkout_tested" | "checkout_pending_test">;
  seatAvailability: CapabilityReadinessItem<
    "check_seats_at_fareharbor" | "check_seats_at_provider" | "live_seats_verified"
  >;
  commissionTerms: CapabilityReadinessItem<
    "commission_terms_pending" | "commission_terms_confirmed"
  >;
  apiBooking: CapabilityReadinessItem<
    "api_booking_requires_approval" | "api_booking_approved"
  >;
};

export type ProviderApprovalStep = {
  stepNumber: number;
  title: string;
  detail: string;
  owner: "operator" | "dcc_reviewer" | "provider";
};

export type ProviderCheckoutNextAction = {
  bookingSystem: string;
  providerKey: "fareharbor" | "rezdy" | "bokun" | "ventrata_octo" | "viator" | "other";
  availabilityState: "active_for_new_orleans_pilot" | "available_on_request";
  headline: string;
  operatorActionSummary: string;
  approvalSteps: ProviderApprovalStep[];
  reviewFieldsToRecord: readonly string[];
  credentialSecurityPolicy: string;
};

export type CheckoutOfferSubmission = {
  operatorName: string;
  businessEmail: string;
  bookingSystem: string;
  exactTourOption: string;
  existingCheckoutLink: string;
  tourId: string | null;
  offerItemId: string | null;
  providerShortname: string | null;
  destinationSlug: string;
  eligiblePickupStops: string[];
};

export type CheckoutOnboardingReviewRecord = {
  reviewedAt: string | null;
  reviewedBy: string | null;
  affiliateAccount: string | null;
  commissionRatePercent: number | null;
  refundTreatment: string | null;
  payoutTiming: string | null;
  bookingRecordDeliveryMethod: string | null;
  eligiblePickupStopsConfirmed: string[];
  reviewNotes: string | null;
};

export const JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE = {
  onboardingPath: "send_guests_to_checkout" as const,
  operatorName: "Jean Lafitte Swamp Tours",
  businessEmail: "sales@jeanlafitteswamptour.com",
  bookingSystem: "FareHarbor",
  exactTourOption:
    "Covered Swamp Tour with Transportation — Swamp Tour with Hotel Pick-up (Item #763318)",
  existingCheckoutLink:
    "https://fareharbor.com/embeds/book/jeanlafitteswamptour/items/763318/?full-items=yes",
  tourId: "dcc:tour:fh:jeanlafitteswamptour:763318",
  offerItemId: "763318",
  providerShortname: "jeanlafitteswamptour",
  destinationSlug: "new-orleans-la",
  eligiblePickupStops: [
    "Hotel Monteleone — 214 Royal St (French Quarter Pickup Stop #22056428)",
    "French Quarter & Downtown New Orleans Designated Hotel Pickup Stops (customFieldInstance12258400)",
  ],
} as const;

export const PROVIDER_SPECIFIC_APPROVAL_GUIDES: Record<
  ProviderCheckoutNextAction["providerKey"],
  ProviderCheckoutNextAction
> = {
  fareharbor: {
    bookingSystem: "FareHarbor",
    providerKey: "fareharbor",
    availabilityState: "active_for_new_orleans_pilot",
    headline:
      "Approve the FareHarbor affiliate connection for this exact offer and confirm eligible hotel pickup stops.",
    operatorActionSummary:
      "In FareHarbor Dashboard → Settings → Affiliates / ASN, approve our affiliate shortname for item #763318 and confirm the French Quarter & Downtown hotel pickup stops.",
    approvalSteps: [
      {
        stepNumber: 1,
        title: "Approve FareHarbor affiliate connection for the specific offer",
        detail:
          "Authorize our FareHarbor affiliate account (welcometoneworleanstours or aktourcenter) on item #763318 (Covered Swamp Tour with Transportation) so is_affiliate_rules_applied is active on the ASN price sheet.",
        owner: "operator",
      },
      {
        stepNumber: 2,
        title: "Confirm eligible hotel pickup stops",
        detail:
          "Confirm the active French Quarter and Downtown hotel pickup options on FareHarbor field #12258400 (including Hotel Monteleone, 214 Royal St — option #22056428) and pickup lead times before departure.",
        owner: "operator",
      },
      {
        stepNumber: 3,
        title: "Record affiliate account, commission, refund treatment, payout timing & booking report delivery",
        detail:
          "Use the DCC review process to record the confirmed FareHarbor affiliate shortname, commission percentage, cancellation/refund treatment, monthly ASN payout timing, and how booking records with online_booking_references (<placementId>-clk_<24hex>) are delivered.",
        owner: "dcc_reviewer",
      },
    ],
    reviewFieldsToRecord: [
      "affiliateAccount",
      "commissionRatePercent",
      "refundTreatment",
      "payoutTiming",
      "bookingRecordDeliveryMethod",
      "eligiblePickupStopsConfirmed",
    ],
    credentialSecurityPolicy:
      "Keep intake limited to business and product details. Never submit FareHarbor API keys or passwords in public forms; arrange any credentials through FareHarbor's approved secure process.",
  },
  rezdy: {
    bookingSystem: "Rezdy",
    providerKey: "rezdy",
    availabilityState: "available_on_request",
    headline:
      "Approve agent marketplace connection in Rezdy and confirm product code & pickup mapping.",
    operatorActionSummary:
      "Share your Rezdy product code and hosted booking link first; approve our Rezdy Agent/Reseller connection and pickup list during review.",
    approvalSteps: [
      {
        stepNumber: 1,
        title: "Approve Rezdy Agent / Marketplace rate sheet for the exact product code",
        detail:
          "Authorize DCC as an agent on the specific Rezdy product option and confirm net/commissionable rates.",
        owner: "operator",
      },
      {
        stepNumber: 2,
        title: "Confirm pickup location list & cutoff window",
        detail:
          "Confirm eligible hotel or pier pickup locations and minimum booking notice.",
        owner: "operator",
      },
      {
        stepNumber: 3,
        title: "Record commission terms, refund policy, payout schedule & order reference reporting",
        detail:
          "Reviewer records the Rezdy agent account, commission rate, refund handling, settlement schedule, and order reference reconciliation method. API keys are arranged only via Rezdy's secure integration workflow.",
        owner: "dcc_reviewer",
      },
    ],
    reviewFieldsToRecord: [
      "affiliateAccount",
      "commissionRatePercent",
      "refundTreatment",
      "payoutTiming",
      "bookingRecordDeliveryMethod",
      "eligiblePickupStopsConfirmed",
    ],
    credentialSecurityPolicy:
      "Arrange any Rezdy API credentials strictly through Rezdy's approved secure partner process after commercial review.",
  },
  bokun: {
    bookingSystem: "Bókun",
    providerKey: "bokun",
    availabilityState: "available_on_request",
    headline:
      "Approve Bókun marketplace contract for the selected experience and confirm pickup stops.",
    operatorActionSummary:
      "Approve the Bókun seller-reseller contract for your experience ID and confirm hotel pickup points.",
    approvalSteps: [
      {
        stepNumber: 1,
        title: "Approve Bókun Marketplace reseller contract for the exact experience",
        detail:
          "Accept the contract proposal in Bókun Marketplace covering the specific tour option.",
        owner: "operator",
      },
      {
        stepNumber: 2,
        title: "Confirm Bókun pickup place IDs",
        detail:
          "Verify which hotel pickup places are enabled for the experience.",
        owner: "operator",
      },
      {
        stepNumber: 3,
        title: "Record Bókun contract terms & externalBookingReference reconciliation",
        detail:
          "Reviewer records the reseller account, commission rate, refund rules, payout timing, and booking record delivery carrying externalBookingReference.",
        owner: "dcc_reviewer",
      },
    ],
    reviewFieldsToRecord: [
      "affiliateAccount",
      "commissionRatePercent",
      "refundTreatment",
      "payoutTiming",
      "bookingRecordDeliveryMethod",
      "eligiblePickupStopsConfirmed",
    ],
    credentialSecurityPolicy:
      "Never send Bókun access keys or secret keys via forms or email; arrange credentials through Bókun's approved secure process.",
  },
  ventrata_octo: {
    bookingSystem: "Ventrata / OCTO",
    providerKey: "ventrata_octo",
    availabilityState: "available_on_request",
    headline:
      "Approve reseller connection in Ventrata / OCTO and confirm option ID & pickup points.",
    operatorActionSummary:
      "Enable the specific product/option ID for our reseller connection and confirm pickup points.",
    approvalSteps: [
      {
        stepNumber: 1,
        title: "Authorize reseller product & option mapping",
        detail:
          "Enable the exact productId and optionId on the reseller connection in your Ventrata dashboard.",
        owner: "operator",
      },
      {
        stepNumber: 2,
        title: "Confirm pickup point IDs & transfer windows",
        detail:
          "Confirm eligible pickup point IDs and departure lead times.",
        owner: "operator",
      },
      {
        stepNumber: 3,
        title: "Record reseller commercial terms & resellerReference reporting",
        detail:
          "Reviewer records the reseller account, commission rate, refund treatment, payout timing, and webhook/report delivery for resellerReference.",
        owner: "dcc_reviewer",
      },
    ],
    reviewFieldsToRecord: [
      "affiliateAccount",
      "commissionRatePercent",
      "refundTreatment",
      "payoutTiming",
      "bookingRecordDeliveryMethod",
      "eligiblePickupStopsConfirmed",
    ],
    credentialSecurityPolicy:
      "OCTO bearer tokens are provisioned only through the provider's approved secure process after review.",
  },
  viator: {
    bookingSystem: "Viator",
    providerKey: "viator",
    availabilityState: "available_on_request",
    headline:
      "Verify Viator product & option code mapping and campaign attribution tracking.",
    operatorActionSummary:
      "Confirm the exact Viator product code, option code (e.g., TG12), and pickup coverage while direct terms are reviewed.",
    approvalSteps: [
      {
        stepNumber: 1,
        title: "Confirm exact Viator product code and tour option",
        detail:
          "Verify which Viator product code and option include hotel or pier pickup.",
        owner: "operator",
      },
      {
        stepNumber: 2,
        title: "Confirm pickup coverage & cancellation cutoff",
        detail:
          "Verify eligible pickup locations and provider cancellation window.",
        owner: "operator",
      },
      {
        stepNumber: 3,
        title: "Record partner account, commission share, refund rules & campaign reference reporting",
        detail:
          "Reviewer records the affiliate partner account, commission rate, refund treatment, payout timing, and booking report reconciliation.",
        owner: "dcc_reviewer",
      },
    ],
    reviewFieldsToRecord: [
      "affiliateAccount",
      "commissionRatePercent",
      "refundTreatment",
      "payoutTiming",
      "bookingRecordDeliveryMethod",
      "eligiblePickupStopsConfirmed",
    ],
    credentialSecurityPolicy:
      "No API credentials are collected in public forms; partner credentials are managed through the provider's secure portal.",
  },
  other: {
    bookingSystem: "Hosted Checkout",
    providerKey: "other",
    availabilityState: "available_on_request",
    headline:
      "Confirm referral tracking support on your hosted checkout and eligible pickup stops.",
    operatorActionSummary:
      "Confirm how your checkout preserves referral parameters and how booking confirmations are shared for reconciliation.",
    approvalSteps: [
      {
        stepNumber: 1,
        title: "Confirm referral parameter pass-through on checkout link",
        detail:
          "Verify that your hosted checkout link accepts and records a referral reference parameter.",
        owner: "operator",
      },
      {
        stepNumber: 2,
        title: "Confirm eligible pickup stops",
        detail:
          "Confirm the exact hotel or meeting-point pickup stops included in the tour option.",
        owner: "operator",
      },
      {
        stepNumber: 3,
        title: "Record affiliate account, commission, refund treatment, payout timing & booking report",
        detail:
          "Reviewer records the commercial terms and how confirmed bookings with referral IDs will be delivered.",
        owner: "dcc_reviewer",
      },
    ],
    reviewFieldsToRecord: [
      "affiliateAccount",
      "commissionRatePercent",
      "refundTreatment",
      "payoutTiming",
      "bookingRecordDeliveryMethod",
      "eligiblePickupStopsConfirmed",
    ],
    credentialSecurityPolicy:
      "Do not send credentials through forms or email; arrange any integration access through the provider's approved secure process.",
  },
};

export function resolveProviderKeyFromBookingSystem(
  bookingSystem: string,
  checkoutLink?: string,
): ProviderCheckoutNextAction["providerKey"] {
  const combined = `${bookingSystem || ""} ${checkoutLink || ""}`.toLowerCase();
  if (combined.includes("fareharbor")) return "fareharbor";
  if (combined.includes("rezdy")) return "rezdy";
  if (combined.includes("bokun") || combined.includes("bókun")) return "bokun";
  if (combined.includes("ventrata") || combined.includes("octo")) return "ventrata_octo";
  if (combined.includes("viator")) return "viator";
  return "other";
}

export function buildProviderCheckoutNextAction(
  bookingSystem: string,
  checkoutLink?: string,
): ProviderCheckoutNextAction {
  const key = resolveProviderKeyFromBookingSystem(bookingSystem, checkoutLink);
  return PROVIDER_SPECIFIC_APPROVAL_GUIDES[key];
}

export function isJeanLafitte763318Offer(params: {
  operatorName?: string;
  exactTourOption?: string;
  existingCheckoutLink?: string;
  tourId?: string | null;
  offerItemId?: string | null;
}): boolean {
  const combined = [
    params.operatorName || "",
    params.exactTourOption || "",
    params.existingCheckoutLink || "",
    params.tourId || "",
    params.offerItemId || "",
  ]
    .join(" ")
    .toLowerCase();
  return (
    combined.includes("763318") ||
    combined.includes("jeanlafitteswamptour") ||
    (combined.includes("jean lafitte") && combined.includes("swamp"))
  );
}

export function buildInitialOfferReadinessStatuses(params: {
  bookingSystem: string;
  operatorName?: string;
  exactTourOption?: string;
  existingCheckoutLink?: string;
  tourId?: string | null;
  offerItemId?: string | null;
  nowIso?: string;
}): OperatorOfferReadinessStatuses {
  const nowIso = params.nowIso || new Date().toISOString();
  const isJeanLafitte = isJeanLafitte763318Offer(params);
  const providerKey = resolveProviderKeyFromBookingSystem(
    params.bookingSystem,
    params.existingCheckoutLink,
  );

  if (isJeanLafitte) {
    return {
      checkout: {
        capability: "checkout",
        code: "checkout_tested",
        label: "Checkout tested",
        ready: true,
        evidence:
          "Verified mobile checkout journey on FareHarbor item #763318 (2026-11-18, 2 adults, Hotel Monteleone pickup #22056428, $124.00 subtotal + $7.44 fees = $131.44 checkout total) with ref & custom-tracking referral parameters.",
        evidenceSource: "fareharbor_live_checkout_walkthrough:jeanlafitteswamptour:763318",
        updatedAt: nowIso,
      },
      seatAvailability: {
        capability: "seat_availability",
        code: "check_seats_at_fareharbor",
        label: "Check seats at FareHarbor",
        ready: false,
        evidence:
          "FareHarbor calendar feed lists open departure slots (08:30 / 10:00), but does not confirm numeric remaining seat count in the public feed; guests check remaining seats at FareHarbor.",
        evidenceSource: "fareharbor_calendar_feed:jeanlafitteswamptour:763318",
        updatedAt: nowIso,
      },
      commissionTerms: {
        capability: "commission_terms",
        code: "commission_terms_pending",
        label: "Commission terms pending",
        ready: false,
        evidence:
          "FareHarbor item #763318 currently returns is_affiliate_rules_applied: false; awaiting operator confirmation of authorized affiliate account, commission rate, refund treatment, payout timing, and referral booking record delivery.",
        evidenceSource: null,
        updatedAt: nowIso,
      },
      apiBooking: {
        capability: "api_booking",
        code: "api_booking_requires_approval",
        label: "API booking requires approval",
        ready: false,
        evidence:
          "Guests are routed to Jean Lafitte's hosted FareHarbor checkout; direct API booking creation requires separate provider-approved API access and technical verification.",
        evidenceSource: null,
        updatedAt: nowIso,
      },
    };
  }

  return {
    checkout: {
      capability: "checkout",
      code: "checkout_pending_test",
      label: "Checkout link submitted — pending test",
      ready: false,
      evidence:
        "Existing checkout URL submitted; awaiting end-to-end mobile checkout walkthrough with referral parameters.",
      evidenceSource: null,
      updatedAt: nowIso,
    },
    seatAvailability: {
      capability: "seat_availability",
      code:
        providerKey === "fareharbor"
          ? "check_seats_at_fareharbor"
          : "check_seats_at_provider",
      label:
        providerKey === "fareharbor"
          ? "Check seats at FareHarbor"
          : "Check seats at provider",
      ready: false,
      evidence:
        providerKey === "fareharbor"
          ? "Guests check remaining seat availability at FareHarbor until numeric seat capacity is confirmed via provider feed."
          : "Guests check remaining seat availability at the provider checkout until numeric seat capacity is confirmed.",
      evidenceSource: null,
      updatedAt: nowIso,
    },
    commissionTerms: {
      capability: "commission_terms",
      code: "commission_terms_pending",
      label: "Commission terms pending",
      ready: false,
      evidence:
        "Awaiting review and operator confirmation of affiliate account, commission rate, refund treatment, payout timing, and referral booking record delivery.",
      evidenceSource: null,
      updatedAt: nowIso,
    },
    apiBooking: {
      capability: "api_booking",
      code: "api_booking_requires_approval",
      label: "API booking requires approval",
      ready: false,
      evidence:
        "Hosted checkout referral only; direct API booking requires separate application and provider-approved API credentials.",
      evidenceSource: null,
      updatedAt: nowIso,
    },
  };
}

export type PersistedOperatorOnboardingRecord = {
  applicationId: string;
  findingId: string;
  environmentScope: EarthosEnvironmentScope;
  onboardingPath?: OperatorOnboardingPath;
  applicationStatus: OperatorOnboardingApplicationStatus;
  reviewQueueState: OperatorReviewQueueState;
  salesAuthorized: boolean;
  commercialTermsSigned: boolean;
  credentialsCollectedPublicly: false;
  activeBookingChannel:
    | "viator_until_verified"
    | "viator_if_verified"
    | "operator_hosted_checkout_referral";
  proposedCommissionPercent: number;
  commercialTermsNote: string;
  credentialArrangementNote: string;
  priorOutreachFlag: string | null;
  requiredVerificationGatesBeforeCutover: readonly string[];
  submitted: {
    companyName: string;
    contactName: string;
    contactEmail: string;
    website: string;
    destinations: string;
    bookingSystem: string;
    apiDocumentationUrl: string;
    authorizedApiAccessAvailable: boolean;
    operatorPermissionConfirmed: boolean;
    exactTourOption?: string;
    existingCheckoutLink?: string;
    tourId?: string | null;
    offerItemId?: string | null;
    providerShortname?: string | null;
    eligiblePickupStops?: string[];
    notes?: string;
  };
  checkoutOffer?: CheckoutOfferSubmission;
  nextAction?: ProviderCheckoutNextAction;
  readinessStatuses?: OperatorOfferReadinessStatuses;
  reviewRecord?: CheckoutOnboardingReviewRecord;
  retrievalTokenHash: string;
  storageBackend: "neon_postgres" | "local_file_nonprod";
  submittedAt: string;
  updatedAt: string;
};

export type PublicOperatorOnboardingRecord = Omit<
  PersistedOperatorOnboardingRecord,
  "retrievalTokenHash"
>;

const LOCAL_FALLBACK_PATH = path.resolve(
  process.cwd(),
  "data",
  "memory",
  "operator-onboarding-applications.json",
);

export function hashRetrievalToken(token: string): string {
  return createHash("sha256")
    .update(`dcc-onb-token:${token.trim()}`)
    .digest("hex");
}

function stripRetrievalTokenHash(
  record: PersistedOperatorOnboardingRecord,
): PublicOperatorOnboardingRecord {
  const { retrievalTokenHash: _unused, ...rest } = record;
  return rest;
}

function readLocalFallbackRecords(): PersistedOperatorOnboardingRecord[] {
  try {
    if (!fs.existsSync(LOCAL_FALLBACK_PATH)) return [];
    const raw = fs.readFileSync(LOCAL_FALLBACK_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PersistedOperatorOnboardingRecord[]) : [];
  } catch {
    return [];
  }
}

function writeLocalFallbackRecords(records: PersistedOperatorOnboardingRecord[]): void {
  if (records.length === 0) {
    try {
      if (fs.existsSync(LOCAL_FALLBACK_PATH)) {
        fs.unlinkSync(LOCAL_FALLBACK_PATH);
      }
    } catch {
      // ignore unlink error
    }
    return;
  }
  const dir = path.dirname(LOCAL_FALLBACK_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(LOCAL_FALLBACK_PATH, JSON.stringify(records, null, 2), "utf8");
}

function detectPriorOutreachFlag(companyName: string): string | null {
  const lower = companyName.trim().toLowerCase();
  const match = FLAGGED_PRIOR_OUTREACH_OPERATORS.find(
    (op) =>
      lower.includes(op.name.toLowerCase()) ||
      op.name.toLowerCase().includes(lower),
  );
  if (!match) return null;
  return `PRIOR OUTREACH FLAG: ${match.name} previously received a separate email proposing ${match.priorProposal}. Do not auto-send outreach; route to manual commercial review.`;
}

function parseFareHarborCheckoutDetails(checkoutUrl: string): {
  providerShortname: string | null;
  offerItemId: string | null;
  tourId: string | null;
} {
  try {
    const u = new URL(checkoutUrl);
    const match = u.pathname.match(/\/embeds\/book\/([^/]+)\/items\/(\d+)/i);
    if (match) {
      const providerShortname = match[1].toLowerCase();
      const offerItemId = match[2];
      return {
        providerShortname,
        offerItemId,
        tourId: `dcc:tour:fh:${providerShortname}:${offerItemId}`,
      };
    }
  } catch {
    // ignore URL parse error here
  }
  return {
    providerShortname: null,
    offerItemId: null,
    tourId: null,
  };
}

export type ValidationResult =
  | {
      ok: false;
      status: 400;
      errorCode:
        | "public_secret_submission_forbidden"
        | "missing_required_fields"
        | "missing_api_documentation"
        | "invalid_api_documentation_url"
        | "invalid_checkout_link"
        | "invalid_operator_permission_confirmation"
        | "operator_permission_required"
        | "invalid_authorized_api_access_flag";
      message: string;
    }
  | {
      ok: true;
      status: 200 | 201;
      onboardingPath: OperatorOnboardingPath;
      applicationStatus: OperatorOnboardingApplicationStatus;
      reviewQueueState: OperatorReviewQueueState;
      salesAuthorized: false;
      commercialTermsSigned: false;
      credentialsCollectedPublicly: false;
      activeBookingChannel:
        | "viator_until_verified"
        | "viator_if_verified"
        | "operator_hosted_checkout_referral";
      proposedCommissionPercent: 10;
      priorOutreachFlag: string | null;
      commercialTermsNote: string;
      credentialArrangementNote: string;
      requiredVerificationGatesBeforeCutover: readonly string[];
      message?: string;
      submitted: PersistedOperatorOnboardingRecord["submitted"];
      checkoutOffer?: CheckoutOfferSubmission;
      nextAction?: ProviderCheckoutNextAction;
      readinessStatuses?: OperatorOfferReadinessStatuses;
      reviewRecord?: CheckoutOnboardingReviewRecord;
    };

export function validateOperatorOnboardingApplication(
  body: Record<string, unknown>,
): ValidationResult {
  for (const key of Object.keys(body)) {
    const normalized = key.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (FORBIDDEN_SECRET_KEYS.includes(normalized) && body[key]) {
      return {
        ok: false,
        status: 400,
        errorCode: "public_secret_submission_forbidden",
        message:
          "Do not submit API keys, tokens, or secrets through public forms or email. Credentials are arranged securely after technical and commercial review.",
      };
    }
  }

  const rawPath = String(body.onboardingPath || "").trim();
  const isCheckoutPath =
    rawPath === "send_guests_to_checkout" ||
    (!rawPath &&
      Boolean(body.existingCheckoutLink || body.exactTourOption || body.operatorName));

  if (isCheckoutPath) {
    const operatorName = String(body.operatorName || body.companyName || "").trim();
    const businessEmail = String(body.businessEmail || body.contactEmail || "").trim();
    const bookingSystem = String(body.bookingSystem || "").trim();
    const exactTourOption = String(body.exactTourOption || "").trim();
    const existingCheckoutLink = String(body.existingCheckoutLink || "").trim();
    const notes = body.notes ? String(body.notes).trim().slice(0, 2000) : undefined;

    if (
      !operatorName ||
      !businessEmail ||
      !bookingSystem ||
      !exactTourOption ||
      !existingCheckoutLink
    ) {
      return {
        ok: false,
        status: 400,
        errorCode: "missing_required_fields",
        message:
          "Missing required fields for checkout onboarding: operatorName, businessEmail, bookingSystem, exactTourOption, and existingCheckoutLink are required.",
      };
    }

    let parsedCheckoutUrl: URL;
    try {
      parsedCheckoutUrl = new URL(existingCheckoutLink);
      if (parsedCheckoutUrl.protocol !== "http:" && parsedCheckoutUrl.protocol !== "https:") {
        return {
          ok: false,
          status: 400,
          errorCode: "invalid_checkout_link",
          message: "Existing checkout link must use http:// or https://.",
        };
      }
    } catch {
      return {
        ok: false,
        status: 400,
        errorCode: "invalid_checkout_link",
        message: "Existing checkout link must be a valid URL.",
      };
    }

    const fhParsed = parseFareHarborCheckoutDetails(existingCheckoutLink);
    const isJeanLafitte = isJeanLafitte763318Offer({
      operatorName,
      exactTourOption,
      existingCheckoutLink,
      tourId: typeof body.tourId === "string" ? body.tourId : fhParsed.tourId,
      offerItemId:
        typeof body.offerItemId === "string" ? body.offerItemId : fhParsed.offerItemId,
    });

    const resolvedTourId =
      typeof body.tourId === "string" && body.tourId.trim()
        ? body.tourId.trim()
        : isJeanLafitte
          ? JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE.tourId
          : fhParsed.tourId;
    const resolvedItemId =
      typeof body.offerItemId === "string" && body.offerItemId.trim()
        ? body.offerItemId.trim()
        : isJeanLafitte
          ? JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE.offerItemId
          : fhParsed.offerItemId;
    const resolvedShortname =
      typeof body.providerShortname === "string" && body.providerShortname.trim()
        ? body.providerShortname.trim()
        : isJeanLafitte
          ? JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE.providerShortname
          : fhParsed.providerShortname;
    const destinationSlug =
      typeof body.destinationSlug === "string" && body.destinationSlug.trim()
        ? body.destinationSlug.trim()
        : "new-orleans-la";

    const eligiblePickupStops = Array.isArray(body.eligiblePickupStops)
      ? body.eligiblePickupStops.map((s) => String(s).trim()).filter(Boolean)
      : isJeanLafitte
        ? [...JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE.eligiblePickupStops]
        : [];

    const nowIso = new Date().toISOString();
    const checkoutOffer: CheckoutOfferSubmission = {
      operatorName,
      businessEmail,
      bookingSystem,
      exactTourOption,
      existingCheckoutLink,
      tourId: resolvedTourId,
      offerItemId: resolvedItemId,
      providerShortname: resolvedShortname,
      destinationSlug,
      eligiblePickupStops,
    };

    const nextAction = buildProviderCheckoutNextAction(
      bookingSystem,
      existingCheckoutLink,
    );
    const readinessStatuses = buildInitialOfferReadinessStatuses({
      bookingSystem,
      operatorName,
      exactTourOption,
      existingCheckoutLink,
      tourId: resolvedTourId,
      offerItemId: resolvedItemId,
      nowIso,
    });

    const reviewRecord: CheckoutOnboardingReviewRecord = {
      reviewedAt: null,
      reviewedBy: null,
      affiliateAccount: null,
      commissionRatePercent: null,
      refundTreatment: null,
      payoutTiming: null,
      bookingRecordDeliveryMethod: null,
      eligiblePickupStopsConfirmed: [],
      reviewNotes: null,
    };

    const priorOutreachFlag = detectPriorOutreachFlag(operatorName);
    const commercialTermsNote =
      "Checkout referral onboarding routes guests to the operator's hosted checkout while commission terms are pending review. Commission terms only transition to confirmed once the affiliate account, commission rate, refund treatment, payout timing, and referral booking record delivery method are recorded.";
    const credentialArrangementNote =
      "Intake is strictly limited to business and product details. Arrange any provider credentials through the provider's approved secure process—never via public forms or email.";

    return {
      ok: true,
      status: 201,
      onboardingPath: "send_guests_to_checkout",
      applicationStatus: "checkout_onboarding_pending_review",
      reviewQueueState: "pending_review",
      salesAuthorized: false,
      commercialTermsSigned: false,
      credentialsCollectedPublicly: false,
      activeBookingChannel: "operator_hosted_checkout_referral",
      proposedCommissionPercent: 10,
      priorOutreachFlag,
      commercialTermsNote,
      credentialArrangementNote,
      requiredVerificationGatesBeforeCutover: REQUIRED_VERIFICATION_GATES_BEFORE_CUTOVER,
      message:
        "Single-tour checkout referral application received. Follow the provider-specific approval steps to confirm the affiliate connection, eligible pickup stops, and booking record delivery.",
      submitted: {
        companyName: operatorName,
        contactName: String(body.contactName || operatorName).trim(),
        contactEmail: businessEmail,
        website: `${parsedCheckoutUrl.protocol}//${parsedCheckoutUrl.host}`,
        destinations: destinationSlug,
        bookingSystem,
        apiDocumentationUrl: existingCheckoutLink,
        authorizedApiAccessAvailable: false,
        operatorPermissionConfirmed: true,
        exactTourOption,
        existingCheckoutLink,
        tourId: resolvedTourId,
        offerItemId: resolvedItemId,
        providerShortname: resolvedShortname,
        eligiblePickupStops,
        ...(notes ? { notes } : {}),
      },
      checkoutOffer,
      nextAction,
      readinessStatuses,
      reviewRecord,
    };
  }

  const companyName = String(body.companyName || "").trim();
  const contactName = String(body.contactName || "").trim();
  const contactEmail = String(body.contactEmail || "").trim();
  const website = String(body.website || body.websiteUrl || "").trim();
  const destinations = Array.isArray(body.destinations)
    ? body.destinations.map((d) => String(d).trim()).filter(Boolean).join(", ")
    : String(body.destinations || "").trim();
  const bookingSystem = String(body.bookingSystem || "").trim();
  const apiDocumentationUrl = String(body.apiDocumentationUrl || "").trim();
  const rawApiAccess =
    body.authorizedApiAccessAvailable !== undefined
      ? body.authorizedApiAccessAvailable
      : body.authorizedApiAccessConfirmed;
  const rawPermission = body.operatorPermissionConfirmed;
  const notes = body.notes ? String(body.notes).trim().slice(0, 2000) : undefined;

  if (!companyName || !contactName || !contactEmail || !website || !destinations || !bookingSystem) {
    return {
      ok: false,
      status: 400,
      errorCode: "missing_required_fields",
      message:
        "Missing required fields: companyName, contactName, contactEmail, website, destinations, and bookingSystem are required.",
    };
  }

  if (typeof rawPermission !== "boolean") {
    return {
      ok: false,
      status: 400,
      errorCode: "invalid_operator_permission_confirmation",
      message:
        "operatorPermissionConfirmed is required and must be an actual boolean (true or false). Permission is never inferred from a missing or non-boolean field.",
    };
  }

  if (rawPermission !== true) {
    return {
      ok: false,
      status: 400,
      errorCode: "operator_permission_required",
      message:
        "Explicit operator permission confirmation (operatorPermissionConfirmed: true) is required to submit an onboarding application.",
    };
  }

  if (typeof rawApiAccess !== "boolean") {
    return {
      ok: false,
      status: 400,
      errorCode: "invalid_authorized_api_access_flag",
      message:
        "authorizedApiAccessAvailable is required and must be an actual boolean (true or false).",
    };
  }

  const authorizedApiAccessAvailable: boolean = rawApiAccess;
  const operatorPermissionConfirmed: boolean = rawPermission;

  const priorOutreachFlag = detectPriorOutreachFlag(companyName);
  const commercialTermsNote =
    "The proposed 10% commission on completed direct bookings is separate from signed commercial and settlement terms. Submitting this application does not authorize direct sales.";
  const credentialArrangementNote =
    "API credentials are arranged through a secure channel after technical review and signed commercial terms. Never send API secrets by email or public forms.";

  if (
    bookingSystem.toLowerCase() === "no_api" ||
    bookingSystem.toLowerCase() === "none" ||
    !authorizedApiAccessAvailable
  ) {
    return {
      ok: true,
      status: 200,
      onboardingPath: "apply_for_api_access",
      applicationStatus: "api_required_keep_viator_channel",
      reviewQueueState: "archived_no_api",
      salesAuthorized: false,
      commercialTermsSigned: false,
      credentialsCollectedPublicly: false,
      activeBookingChannel: "viator_if_verified",
      proposedCommissionPercent: 10,
      priorOutreachFlag,
      commercialTermsNote,
      credentialArrangementNote,
      requiredVerificationGatesBeforeCutover: REQUIRED_VERIFICATION_GATES_BEFORE_CUTOVER,
      message:
        "Direct partnerships are API-only. Without an authorized API connection, we cannot switch bookings to a direct connection. Existing verified Viator listings can continue through Viator.",
      submitted: {
        companyName,
        contactName,
        contactEmail,
        website,
        destinations,
        bookingSystem,
        apiDocumentationUrl,
        authorizedApiAccessAvailable,
        operatorPermissionConfirmed,
        ...(notes ? { notes } : {}),
      },
    };
  }

  if (!apiDocumentationUrl) {
    return {
      ok: false,
      status: 400,
      errorCode: "missing_api_documentation",
      message:
        "Please provide the API documentation URL or technical specification reference for your booking system.",
    };
  }

  try {
    const parsedDocUrl = new URL(apiDocumentationUrl);
    if (parsedDocUrl.protocol !== "http:" && parsedDocUrl.protocol !== "https:") {
      return {
        ok: false,
        status: 400,
        errorCode: "invalid_api_documentation_url",
        message: "API documentation URL must use http:// or https://.",
      };
    }
  } catch {
    return {
      ok: false,
      status: 400,
      errorCode: "invalid_api_documentation_url",
      message: "API documentation URL must be a valid URL.",
    };
  }

  return {
    ok: true,
    status: 201,
    onboardingPath: "apply_for_api_access",
    applicationStatus: "application_received_pending_review",
    reviewQueueState: "pending_review",
    salesAuthorized: false,
    commercialTermsSigned: false,
    credentialsCollectedPublicly: false,
    activeBookingChannel: "viator_until_verified",
    proposedCommissionPercent: 10,
    priorOutreachFlag,
    commercialTermsNote,
    credentialArrangementNote,
    requiredVerificationGatesBeforeCutover: REQUIRED_VERIFICATION_GATES_BEFORE_CUTOVER,
    submitted: {
      companyName,
      contactName,
      contactEmail,
      website,
      destinations,
      bookingSystem,
      apiDocumentationUrl,
      authorizedApiAccessAvailable,
      operatorPermissionConfirmed,
      ...(notes ? { notes } : {}),
    },
  };
}

function parseRecordFromFindingRow(
  row: typeof earthosControlMapFindings.$inferSelect,
): PersistedOperatorOnboardingRecord | null {
  const meta = row.metadata as Partial<PersistedOperatorOnboardingRecord> | null;
  if (
    !meta ||
    typeof meta.applicationId !== "string" ||
    !meta.submitted ||
    typeof meta.submitted.companyName !== "string" ||
    typeof meta.retrievalTokenHash !== "string"
  ) {
    return null;
  }
  return meta as PersistedOperatorOnboardingRecord;
}

async function persistOnboardingRecord(
  record: PersistedOperatorOnboardingRecord,
  eventType: "operator_onboarding_submitted" | "operator_onboarding_reviewed",
  summaryNote: string,
  approvedBy: string | null = null,
): Promise<void> {
  const useDatabase = hasConfiguredDatabaseUrl();
  const nowIso = record.updatedAt;
  if (useDatabase) {
    const db = await getRequiredEarthosDb();
    const findingStatus =
      record.reviewQueueState === "pending_review" ? "open" : "triaged";
    await db
      .insert(earthosControlMapFindings)
      .values({
        findingId: record.findingId,
        status: findingStatus,
        severity: record.priorOutreachFlag ? "high" : "watch",
        owner: OPERATOR_ONBOARDING_OWNER,
        note: summaryNote,
        metadata: record as unknown as Record<string, unknown>,
        updatedAt: new Date(nowIso),
      })
      .onConflictDoUpdate({
        target: earthosControlMapFindings.findingId,
        set: {
          status: findingStatus,
          severity: record.priorOutreachFlag ? "high" : "watch",
          owner: OPERATOR_ONBOARDING_OWNER,
          note: summaryNote,
          metadata: record as unknown as Record<string, unknown>,
          updatedAt: new Date(nowIso),
        },
      });

    await db.insert(earthosControlMapFindingHistory).values({
      findingId: record.findingId,
      event: eventType,
      status: findingStatus,
      severity: record.priorOutreachFlag ? "high" : "watch",
      owner: OPERATOR_ONBOARDING_OWNER,
      nodeSlug: "operators",
      corridor: "operator-onboarding",
      recordedAt: new Date(nowIso),
      summary: summaryNote,
      approvedAt: approvedBy ? new Date(nowIso) : null,
      approvedBy,
      controlSurface: "/operators/onboarding",
      metadata: stripRetrievalTokenHash(record) as unknown as Record<string, unknown>,
    });

    const verifyRows = await db
      .select()
      .from(earthosControlMapFindings)
      .where(
        and(
          eq(earthosControlMapFindings.findingId, record.findingId),
          eq(earthosControlMapFindings.owner, OPERATOR_ONBOARDING_OWNER),
        ),
      )
      .limit(1);

    const verifiedRecord = verifyRows[0] ? parseRecordFromFindingRow(verifyRows[0]) : null;
    if (!verifiedRecord || verifiedRecord.applicationId !== record.applicationId) {
      throw new Error(
        "Post-write database verification failed: persisted record could not be read back.",
      );
    }
  } else {
    const existing = readLocalFallbackRecords().filter(
      (item) => item.applicationId !== record.applicationId,
    );
    writeLocalFallbackRecords([record, ...existing]);
    const verifyBack = readLocalFallbackRecords().find(
      (item) => item.applicationId === record.applicationId,
    );
    if (!verifyBack) {
      throw new Error("Post-write local storage verification failed.");
    }
  }
}

export async function submitOperatorOnboardingApplication(
  body: Record<string, unknown>,
  options: { environmentScope?: EarthosEnvironmentScope } = {},
): Promise<
  | (ValidationResult & { ok: false })
  | {
      ok: false;
      status: 500 | 503;
      errorCode: "persistence_failed" | "durable_storage_unavailable";
      persisted: false;
      message: string;
    }
  | {
      ok: true;
      status: 200 | 201;
      persisted: true;
      storageBackend: "neon_postgres" | "local_file_nonprod";
      applicationId: string;
      findingId: string;
      retrievalToken: string;
      onboardingPath: OperatorOnboardingPath;
      applicationStatus: OperatorOnboardingApplicationStatus;
      reviewQueueState: OperatorReviewQueueState;
      salesAuthorized: false;
      commercialTermsSigned: false;
      credentialsCollectedPublicly: false;
      activeBookingChannel:
        | "viator_until_verified"
        | "viator_if_verified"
        | "operator_hosted_checkout_referral";
      proposedCommissionPercent: 10;
      priorOutreachFlag: string | null;
      commercialTermsNote: string;
      credentialArrangementNote: string;
      requiredVerificationGatesBeforeCutover: readonly string[];
      message?: string;
      submitted: PersistedOperatorOnboardingRecord["submitted"];
      checkoutOffer?: CheckoutOfferSubmission;
      nextAction?: ProviderCheckoutNextAction;
      readinessStatuses?: OperatorOfferReadinessStatuses;
      reviewRecord?: CheckoutOnboardingReviewRecord;
      submittedAt: string;
    }
> {
  const validated = validateOperatorOnboardingApplication(body);
  if (!validated.ok) {
    return validated;
  }

  const scope = options.environmentScope || resolveEarthosEnvironmentScope();
  const nowIso = new Date().toISOString();
  const applicationId = `dcc_onb_${Date.now().toString(36)}_${randomUUID().slice(0, 8)}`;
  const findingId = `control-map:operator-onboarding:${scope}:${applicationId}`;
  const retrievalToken = `onbtok_${randomBytes(24).toString("hex")}`;
  const retrievalTokenHash = hashRetrievalToken(retrievalToken);

  const useDatabase = hasConfiguredDatabaseUrl();
  if (!useDatabase && process.env.VERCEL_ENV === "production") {
    return {
      ok: false,
      status: 503,
      errorCode: "durable_storage_unavailable",
      persisted: false,
      message:
        "Durable database storage is required in production before accepting operator onboarding applications.",
    };
  }

  const storageBackend: "neon_postgres" | "local_file_nonprod" = useDatabase
    ? "neon_postgres"
    : "local_file_nonprod";

  const record: PersistedOperatorOnboardingRecord = {
    applicationId,
    findingId,
    environmentScope: scope,
    onboardingPath: validated.onboardingPath,
    applicationStatus: validated.applicationStatus,
    reviewQueueState: validated.reviewQueueState,
    salesAuthorized: false,
    commercialTermsSigned: false,
    credentialsCollectedPublicly: false,
    activeBookingChannel: validated.activeBookingChannel,
    proposedCommissionPercent: 10,
    commercialTermsNote: validated.commercialTermsNote,
    credentialArrangementNote: validated.credentialArrangementNote,
    priorOutreachFlag: validated.priorOutreachFlag,
    requiredVerificationGatesBeforeCutover: validated.requiredVerificationGatesBeforeCutover,
    submitted: validated.submitted,
    ...(validated.checkoutOffer ? { checkoutOffer: validated.checkoutOffer } : {}),
    ...(validated.nextAction ? { nextAction: validated.nextAction } : {}),
    ...(validated.readinessStatuses ? { readinessStatuses: validated.readinessStatuses } : {}),
    ...(validated.reviewRecord ? { reviewRecord: validated.reviewRecord } : {}),
    retrievalTokenHash,
    storageBackend,
    submittedAt: nowIso,
    updatedAt: nowIso,
  };

  const summaryNote =
    validated.onboardingPath === "send_guests_to_checkout"
      ? `Operator checkout onboarding (${record.reviewQueueState}): ${record.submitted.companyName} — ${record.submitted.exactTourOption} via ${record.submitted.bookingSystem}`
      : `Operator onboarding (${record.reviewQueueState}): ${record.submitted.companyName} (${record.submitted.destinations}) via ${record.submitted.bookingSystem}`;

  try {
    await persistOnboardingRecord(record, "operator_onboarding_submitted", summaryNote);
  } catch (err) {
    return {
      ok: false,
      status: 500,
      errorCode: "persistence_failed",
      persisted: false,
      message:
        err instanceof Error
          ? `Failed to persist operator onboarding application: ${err.message}`
          : "Failed to persist operator onboarding application.",
    };
  }

  return {
    ok: true,
    status: validated.status,
    persisted: true,
    storageBackend,
    applicationId: record.applicationId,
    findingId: record.findingId,
    retrievalToken,
    onboardingPath: validated.onboardingPath,
    applicationStatus: record.applicationStatus,
    reviewQueueState: record.reviewQueueState,
    salesAuthorized: false,
    commercialTermsSigned: false,
    credentialsCollectedPublicly: false,
    activeBookingChannel: record.activeBookingChannel,
    proposedCommissionPercent: 10,
    priorOutreachFlag: record.priorOutreachFlag,
    commercialTermsNote: record.commercialTermsNote,
    credentialArrangementNote: record.credentialArrangementNote,
    requiredVerificationGatesBeforeCutover: record.requiredVerificationGatesBeforeCutover,
    ...(validated.message ? { message: validated.message } : {}),
    submitted: record.submitted,
    ...(record.checkoutOffer ? { checkoutOffer: record.checkoutOffer } : {}),
    ...(record.nextAction ? { nextAction: record.nextAction } : {}),
    ...(record.readinessStatuses ? { readinessStatuses: record.readinessStatuses } : {}),
    ...(record.reviewRecord ? { reviewRecord: record.reviewRecord } : {}),
    submittedAt: record.submittedAt,
  };
}

export type ReviewOperatorOnboardingInput = {
  affiliateAccount?: string;
  commissionRatePercent?: number;
  refundTreatment?: string;
  payoutTiming?: string;
  bookingRecordDeliveryMethod?: string;
  eligiblePickupStopsConfirmed?: string[];
  reviewNotes?: string;
  checkoutEvidence?: {
    checkoutTested: boolean;
    evidence: string;
    evidenceSource?: string;
  };
  seatAvailabilityEvidence?: {
    numericCapacityVerified: boolean;
    evidence: string;
    evidenceSource?: string;
  };
  commissionEvidence?: {
    termsConfirmed: boolean;
    evidence: string;
    evidenceSource?: string;
  };
  apiBookingEvidence?: {
    apiBookingApproved: boolean;
    evidence: string;
    evidenceSource?: string;
  };
};

export async function reviewOperatorOnboardingApplication(
  applicationId: string,
  input: ReviewOperatorOnboardingInput,
  options: {
    retrievalToken?: string | null;
    bypassTokenForAuthorizedReviewer?: boolean;
    reviewerActor?: string;
  } = {},
): Promise<
  | {
      ok: false;
      status: 400 | 401 | 404 | 500;
      errorCode: string;
      message: string;
    }
  | {
      ok: true;
      status: 200;
      application: PublicOperatorOnboardingRecord;
    }
> {
  for (const key of Object.keys(input as Record<string, unknown>)) {
    const normalized = key.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (FORBIDDEN_SECRET_KEYS.includes(normalized) && (input as Record<string, unknown>)[key]) {
      return {
        ok: false,
        status: 400,
        errorCode: "public_secret_submission_forbidden",
        message:
          "Do not store API keys or secrets in onboarding review records. Arrange credentials through the provider's approved secure process.",
      };
    }
  }

  const trimmedId = (applicationId || "").trim();
  if (!trimmedId) {
    return {
      ok: false,
      status: 404,
      errorCode: "application_not_found",
      message: "Application ID is required.",
    };
  }

  let matched: PersistedOperatorOnboardingRecord | null = null;
  if (hasConfiguredDatabaseUrl()) {
    const db = await getRequiredEarthosDb();
    const candidateFindingIds = [
      `control-map:operator-onboarding:production:${trimmedId}`,
      `control-map:operator-onboarding:nonprod:${trimmedId}`,
    ];
    for (const fid of candidateFindingIds) {
      const rows = await db
        .select()
        .from(earthosControlMapFindings)
        .where(
          and(
            eq(earthosControlMapFindings.findingId, fid),
            eq(earthosControlMapFindings.owner, OPERATOR_ONBOARDING_OWNER),
          ),
        )
        .limit(1);
      if (rows[0]) {
        const parsed = parseRecordFromFindingRow(rows[0]);
        if (parsed) {
          matched = parsed;
          break;
        }
      }
    }
  } else {
    matched =
      readLocalFallbackRecords().find((r) => r.applicationId === trimmedId) || null;
  }

  if (!matched) {
    return {
      ok: false,
      status: 404,
      errorCode: "application_not_found",
      message: `No persisted operator onboarding application found for ID ${trimmedId}.`,
    };
  }

  if (!options.bypassTokenForAuthorizedReviewer) {
    const token = (options.retrievalToken || "").trim();
    if (!token || hashRetrievalToken(token) !== matched.retrievalTokenHash) {
      return {
        ok: false,
        status: 401,
        errorCode: "onboarding_review_unauthorized",
        message:
          "Reviewer authorization or a valid retrievalToken is required to update this onboarding application.",
      };
    }
  }

  const nowIso = new Date().toISOString();
  const prevReview: CheckoutOnboardingReviewRecord = matched.reviewRecord || {
    reviewedAt: null,
    reviewedBy: null,
    affiliateAccount: null,
    commissionRatePercent: null,
    refundTreatment: null,
    payoutTiming: null,
    bookingRecordDeliveryMethod: null,
    eligiblePickupStopsConfirmed: [],
    reviewNotes: null,
  };

  const nextReview: CheckoutOnboardingReviewRecord = {
    reviewedAt: nowIso,
    reviewedBy: options.reviewerActor || "dcc_reviewer",
    affiliateAccount:
      typeof input.affiliateAccount === "string" && input.affiliateAccount.trim()
        ? input.affiliateAccount.trim()
        : prevReview.affiliateAccount,
    commissionRatePercent:
      typeof input.commissionRatePercent === "number" &&
      Number.isFinite(input.commissionRatePercent) &&
      input.commissionRatePercent > 0
        ? input.commissionRatePercent
        : prevReview.commissionRatePercent,
    refundTreatment:
      typeof input.refundTreatment === "string" && input.refundTreatment.trim()
        ? input.refundTreatment.trim()
        : prevReview.refundTreatment,
    payoutTiming:
      typeof input.payoutTiming === "string" && input.payoutTiming.trim()
        ? input.payoutTiming.trim()
        : prevReview.payoutTiming,
    bookingRecordDeliveryMethod:
      typeof input.bookingRecordDeliveryMethod === "string" &&
      input.bookingRecordDeliveryMethod.trim()
        ? input.bookingRecordDeliveryMethod.trim()
        : prevReview.bookingRecordDeliveryMethod,
    eligiblePickupStopsConfirmed: Array.isArray(input.eligiblePickupStopsConfirmed)
      ? input.eligiblePickupStopsConfirmed.map((s) => String(s).trim()).filter(Boolean)
      : prevReview.eligiblePickupStopsConfirmed,
    reviewNotes:
      typeof input.reviewNotes === "string" && input.reviewNotes.trim()
        ? input.reviewNotes.trim()
        : prevReview.reviewNotes,
  };

  const currentReadiness =
    matched.readinessStatuses ||
    buildInitialOfferReadinessStatuses({
      bookingSystem: matched.submitted.bookingSystem,
      operatorName: matched.submitted.companyName,
      exactTourOption: matched.submitted.exactTourOption,
      existingCheckoutLink: matched.submitted.existingCheckoutLink,
      tourId: matched.submitted.tourId,
      offerItemId: matched.submitted.offerItemId,
      nowIso: matched.submittedAt,
    });

  const nextReadiness: OperatorOfferReadinessStatuses = {
    checkout: { ...currentReadiness.checkout },
    seatAvailability: { ...currentReadiness.seatAvailability },
    commissionTerms: { ...currentReadiness.commissionTerms },
    apiBooking: { ...currentReadiness.apiBooking },
  };

  // 1. Checkout status changes only when checkout test evidence is present
  if (
    input.checkoutEvidence &&
    input.checkoutEvidence.checkoutTested === true &&
    input.checkoutEvidence.evidence.trim().length > 0
  ) {
    nextReadiness.checkout = {
      capability: "checkout",
      code: "checkout_tested",
      label: "Checkout tested",
      ready: true,
      evidence: input.checkoutEvidence.evidence.trim(),
      evidenceSource: input.checkoutEvidence.evidenceSource || "dcc_checkout_test",
      updatedAt: nowIso,
    };
  }

  // 2. Seat availability status changes only when numeric seat capacity evidence is verified
  if (input.seatAvailabilityEvidence) {
    if (
      input.seatAvailabilityEvidence.numericCapacityVerified === true &&
      input.seatAvailabilityEvidence.evidence.trim().length > 0
    ) {
      nextReadiness.seatAvailability = {
        capability: "seat_availability",
        code: "live_seats_verified",
        label: "Live seat count verified",
        ready: true,
        evidence: input.seatAvailabilityEvidence.evidence.trim(),
        evidenceSource:
          input.seatAvailabilityEvidence.evidenceSource || "provider_capacity_feed",
        updatedAt: nowIso,
      };
    } else if (input.seatAvailabilityEvidence.evidence.trim().length > 0) {
      const providerKey = resolveProviderKeyFromBookingSystem(
        matched.submitted.bookingSystem,
        matched.submitted.existingCheckoutLink,
      );
      nextReadiness.seatAvailability = {
        capability: "seat_availability",
        code:
          providerKey === "fareharbor"
            ? "check_seats_at_fareharbor"
            : "check_seats_at_provider",
        label:
          providerKey === "fareharbor"
            ? "Check seats at FareHarbor"
            : "Check seats at provider",
        ready: false,
        evidence: input.seatAvailabilityEvidence.evidence.trim(),
        evidenceSource:
          input.seatAvailabilityEvidence.evidenceSource || "provider_calendar_feed",
        updatedAt: nowIso,
      };
    }
  }

  // 3. Commission terms status changes to confirmed only when all required review fields & evidence are recorded
  const hasAllCommercialReviewFields = Boolean(
    nextReview.affiliateAccount &&
      nextReview.commissionRatePercent !== null &&
      nextReview.commissionRatePercent > 0 &&
      nextReview.refundTreatment &&
      nextReview.payoutTiming &&
      nextReview.bookingRecordDeliveryMethod,
  );
  const hasCommissionEvidence = Boolean(
    input.commissionEvidence &&
      input.commissionEvidence.termsConfirmed === true &&
      input.commissionEvidence.evidence.trim().length > 0,
  );

  if (hasAllCommercialReviewFields && hasCommissionEvidence) {
    nextReadiness.commissionTerms = {
      capability: "commission_terms",
      code: "commission_terms_confirmed",
      label: "Commission terms confirmed",
      ready: true,
      evidence: input.commissionEvidence!.evidence.trim(),
      evidenceSource:
        input.commissionEvidence!.evidenceSource ||
        `operator_commercial_review:${nextReview.affiliateAccount}`,
      updatedAt: nowIso,
    };
  }

  // 4. API booking status changes only when API booking approval evidence is verified
  if (
    input.apiBookingEvidence &&
    input.apiBookingEvidence.apiBookingApproved === true &&
    input.apiBookingEvidence.evidence.trim().length > 0
  ) {
    nextReadiness.apiBooking = {
      capability: "api_booking",
      code: "api_booking_approved",
      label: "API booking approved",
      ready: true,
      evidence: input.apiBookingEvidence.evidence.trim(),
      evidenceSource:
        input.apiBookingEvidence.evidenceSource || "provider_api_booking_verification",
      updatedAt: nowIso,
    };
  }

  const commissionConfirmed =
    nextReadiness.commissionTerms.code === "commission_terms_confirmed";

  const updatedRecord: PersistedOperatorOnboardingRecord = {
    ...matched,
    applicationStatus: commissionConfirmed
      ? "checkout_onboarding_reviewed"
      : matched.applicationStatus,
    reviewQueueState: commissionConfirmed
      ? "checkout_terms_confirmed"
      : "in_technical_review",
    commercialTermsSigned: commissionConfirmed,
    salesAuthorized: commissionConfirmed && nextReadiness.checkout.ready,
    proposedCommissionPercent:
      nextReview.commissionRatePercent ?? matched.proposedCommissionPercent,
    readinessStatuses: nextReadiness,
    reviewRecord: nextReview,
    updatedAt: nowIso,
  };

  const summaryNote = `Operator onboarding review updated (${updatedRecord.reviewQueueState}): ${updatedRecord.submitted.companyName} [checkout=${nextReadiness.checkout.label}, seats=${nextReadiness.seatAvailability.label}, commission=${nextReadiness.commissionTerms.label}, api=${nextReadiness.apiBooking.label}]`;

  try {
    await persistOnboardingRecord(
      updatedRecord,
      "operator_onboarding_reviewed",
      summaryNote,
      nextReview.reviewedBy,
    );
  } catch (err) {
    return {
      ok: false,
      status: 500,
      errorCode: "persistence_failed",
      message:
        err instanceof Error
          ? `Failed to persist onboarding review update: ${err.message}`
          : "Failed to persist onboarding review update.",
    };
  }

  return {
    ok: true,
    status: 200,
    application: stripRetrievalTokenHash(updatedRecord),
  };
}

export async function getOperatorOnboardingApplicationById(
  applicationId: string,
  options: {
    retrievalToken?: string | null;
    bypassTokenForAuthorizedReviewer?: boolean;
    environmentScope?: EarthosEnvironmentScope | "all";
  } = {},
): Promise<
  | {
      ok: true;
      application: PublicOperatorOnboardingRecord;
    }
  | {
      ok: false;
      status: 401 | 404;
      errorCode: "onboarding_retrieval_unauthorized" | "application_not_found";
      message: string;
    }
> {
  const trimmedId = (applicationId || "").trim();
  if (!trimmedId) {
    return {
      ok: false,
      status: 404,
      errorCode: "application_not_found",
      message: "Application ID is required.",
    };
  }

  let matched: PersistedOperatorOnboardingRecord | null = null;

  if (hasConfiguredDatabaseUrl()) {
    const db = await getRequiredEarthosDb();
    const candidateFindingIds = [
      `control-map:operator-onboarding:production:${trimmedId}`,
      `control-map:operator-onboarding:nonprod:${trimmedId}`,
    ];
    for (const fid of candidateFindingIds) {
      const rows = await db
        .select()
        .from(earthosControlMapFindings)
        .where(
          and(
            eq(earthosControlMapFindings.findingId, fid),
            eq(earthosControlMapFindings.owner, OPERATOR_ONBOARDING_OWNER),
          ),
        )
        .limit(1);
      if (rows[0]) {
        const parsed = parseRecordFromFindingRow(rows[0]);
        if (parsed) {
          matched = parsed;
          break;
        }
      }
    }
  } else {
    matched =
      readLocalFallbackRecords().find((r) => r.applicationId === trimmedId) || null;
  }

  if (!matched) {
    return {
      ok: false,
      status: 404,
      errorCode: "application_not_found",
      message: `No persisted operator onboarding application found for ID ${trimmedId}.`,
    };
  }

  if (!options.bypassTokenForAuthorizedReviewer) {
    const token = (options.retrievalToken || "").trim();
    if (!token || hashRetrievalToken(token) !== matched.retrievalTokenHash) {
      return {
        ok: false,
        status: 401,
        errorCode: "onboarding_retrieval_unauthorized",
        message:
          "A valid retrievalToken or reviewer authorization is required to inspect this onboarding application.",
      };
    }
  }

  return {
    ok: true,
    application: stripRetrievalTokenHash(matched),
  };
}

export async function listOperatorOnboardingReviewQueue(options: {
  reviewQueueState?: OperatorReviewQueueState;
  environmentScope?: EarthosEnvironmentScope | "all";
  limit?: number;
} = {}): Promise<PublicOperatorOnboardingRecord[]> {
  const targetScope = options.environmentScope || resolveEarthosEnvironmentScope();
  let records: PersistedOperatorOnboardingRecord[] = [];

  if (hasConfiguredDatabaseUrl()) {
    const db = await getRequiredEarthosDb();
    const rows = await db
      .select()
      .from(earthosControlMapFindings)
      .where(eq(earthosControlMapFindings.owner, OPERATOR_ONBOARDING_OWNER))
      .orderBy(desc(earthosControlMapFindings.updatedAt))
      .limit(options.limit || 100);

    records = rows
      .map(parseRecordFromFindingRow)
      .filter((r): r is PersistedOperatorOnboardingRecord => r !== null);
  } else {
    records = readLocalFallbackRecords();
  }

  return records
    .filter((r) => {
      if (targetScope !== "all" && r.environmentScope !== targetScope) {
        return false;
      }
      if (options.reviewQueueState && r.reviewQueueState !== options.reviewQueueState) {
        return false;
      }
      return true;
    })
    .map(stripRetrievalTokenHash);
}

export async function deleteOperatorOnboardingApplicationById(
  applicationId: string,
  options: {
    retrievalToken?: string | null;
    bypassTokenForAuthorizedReviewer?: boolean;
  } = {},
): Promise<{ ok: boolean; status: 200 | 401 | 404; deletedId?: string; message?: string }> {
  const lookup = await getOperatorOnboardingApplicationById(applicationId, options);
  if (!lookup.ok) {
    return {
      ok: false,
      status: lookup.status,
      message: lookup.message,
    };
  }

  const candidateFindingIds = [
    lookup.application.findingId,
    `control-map:operator-onboarding:production:${applicationId}`,
    `control-map:operator-onboarding:nonprod:${applicationId}`,
  ];

  if (hasConfiguredDatabaseUrl()) {
    const db = await getRequiredEarthosDb();
    for (const fid of candidateFindingIds) {
      await db
        .delete(earthosControlMapFindingHistory)
        .where(eq(earthosControlMapFindingHistory.findingId, fid));
      await db
        .delete(earthosControlMapFindings)
        .where(eq(earthosControlMapFindings.findingId, fid));
    }
  } else {
    const remaining = readLocalFallbackRecords().filter(
      (r) => r.applicationId !== applicationId,
    );
    writeLocalFallbackRecords(remaining);
  }

  return {
    ok: true,
    status: 200,
    deletedId: applicationId,
  };
}

