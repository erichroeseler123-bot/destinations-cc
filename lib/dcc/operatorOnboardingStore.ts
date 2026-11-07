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
import {
  STOREFRONT_PRODUCTS,
  getProductPrimaryBookingHref,
} from "@/app/new-orleans/tours/pageConfig";
import { PROVIDERS } from "@/app/new-orleans/data/providers";
import { getActiveGoSnoRouteFeedSnapshotState } from "@/lib/dcc/applicability/gosnoRouteFeedSnapshot";
import {
  fetchAvailabilitiesForItem,
  getWnoFareHarborHeaders,
} from "@/lib/dcc/liveSlots/fareharbor";

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

export type SupplierCheckType = "booking_link" | "live_inventory";

export type SupplierCheckFailureReason =
  | "missing_credentials"
  | "http_403"
  | "empty_date"
  | "timeout"
  | "quote_only_or_capacity_limit"
  | "unavailable_for_trip"
  | "no_api_configured"
  | "http_error"
  | "network_error"
  | "missing_booking_url"
  | "supplier_or_product_mismatch"
  | "tracking_tag_missing"
  | null;

export type SupplierLiveInventoryTripQuery = {
  route?: string | null;
  origin?: string | null;
  destination?: string | null;
  pickupDate: string;
  pickupTime?: string | null;
  partySize: number;
  vehicleClass?: "suv" | "van" | string | null;
};

export type SupplierPlannerLiveDisplayCheck = {
  verified: boolean;
  statusLabel: string;
  whatItProves: string;
};

export type SupplierProductCheckRecord = {
  checkId: string;
  findingId?: string;
  companyId: string;
  productId: string;
  productTitle: string;
  checkType: SupplierCheckType;
  checkedAt: string;
  verified: boolean;
  code: string;
  failureReason?: SupplierCheckFailureReason;
  statusLabel: string;
  whatItProves: string;
  targetUrl: string | null;
  finalReachedUrl?: string | null;
  handoffChain?: string[];
  httpStatus: number | null;
  supplierMatched?: boolean | null;
  productMatched?: boolean | null;
  attributionVerified: boolean | null;
  attributionTag: string | null;
  tripQuery?: SupplierLiveInventoryTripQuery | null;
  datedApiResponseAt: string | null;
  plannerLiveDisplayCheck: SupplierPlannerLiveDisplayCheck | null;
  storageBackend?:
    | "earthos_control_map_findings"
    | "neon_postgres"
    | "local_file_nonprod";
};

export type SupplierConnectionProductLink = {
  productId: string;
  title: string;
  dccPageHref: string;
  bookingHref: string | null;
  bookingLinkLabel: string;
  itemId?: string | null;
  flowId?: string | null;
  attributionTag?: string | null;
  bookingLinkCheck: SupplierProductCheckRecord | null;
  liveInventoryCheck: SupplierProductCheckRecord | null;
  lastCheckedAt: string | null;
};

export type SupplierConnectionVerificationField<TCode extends string = string> = {
  verified: boolean;
  code: TCode;
  label: string;
  whatItProves: string;
  evidence: string;
  evidenceSource: string | null;
  checkedAt: string | null;
  readinessItem: CapabilityReadinessItem<TCode>;
};

export type SupplierConnectionRecord = {
  companyId: string;
  companyName: string;
  providerShortname: string | null;
  market: string;
  bookingSystem: string;
  connectionStatus: "connected" | "checkout_only" | "needs_attention";
  productsAndBookingLinks: SupplierConnectionProductLink[];
  checkoutVerified: SupplierConnectionVerificationField<
    "checkout_tested" | "checkout_pending_test"
  >;
  livePricesAndSeatsVerified: SupplierConnectionVerificationField<
    "check_seats_at_fareharbor" | "check_seats_at_provider" | "live_seats_verified"
  >;
  plannerLiveDisplayVerified: SupplierPlannerLiveDisplayCheck;
  bookingLinksLastChecked: string | null;
  liveInventoryLastChecked: string | null;
  lastChecked: string | null;
  needsAttentionNote: string | null;
  readinessStatuses: OperatorOfferReadinessStatuses;
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

export const SUPPLIER_CONNECTION_CHECKS_OWNER = "dcc-supplier-connection-checks";

const SUPPLIER_CHECKS_LOCAL_PATH = path.resolve(
  process.cwd(),
  "data",
  "memory",
  "supplier-connection-checks.json",
);

function supplierCheckKey(
  companyId: string,
  productId: string,
  checkType: SupplierCheckType,
): string {
  return `${companyId.trim().toLowerCase()}::${productId.trim().toLowerCase()}::${checkType}`;
}

export function buildSupplierCheckFindingId(
  companyId: string,
  productId: string,
  checkType: SupplierCheckType,
): string {
  const cleanCompany = companyId.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
  const cleanProduct = productId.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
  return `control-map:supplier-check:${cleanCompany}:${cleanProduct}:${checkType}`;
}

function parseSupplierCheckFromFindingRow(
  row: typeof earthosControlMapFindings.$inferSelect,
): SupplierProductCheckRecord | null {
  const meta = row.metadata as Partial<SupplierProductCheckRecord> | null;
  if (
    !meta ||
    typeof meta.companyId !== "string" ||
    typeof meta.productId !== "string" ||
    (meta.checkType !== "booking_link" && meta.checkType !== "live_inventory") ||
    typeof meta.checkedAt !== "string"
  ) {
    return null;
  }
  return {
    ...(meta as SupplierProductCheckRecord),
    findingId: row.findingId,
    storageBackend: "earthos_control_map_findings",
  };
}

function readLocalNonProdSupplierChecks(): SupplierProductCheckRecord[] {
  try {
    if (!fs.existsSync(SUPPLIER_CHECKS_LOCAL_PATH)) return [];
    const raw = fs.readFileSync(SUPPLIER_CHECKS_LOCAL_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as SupplierProductCheckRecord[]).filter(
      (item) =>
        Boolean(item && item.companyId && item.productId && item.checkType && item.checkedAt),
    );
  } catch {
    return [];
  }
}

function writeLocalNonProdSupplierChecks(records: SupplierProductCheckRecord[]): void {
  const dir = path.dirname(SUPPLIER_CHECKS_LOCAL_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(
    SUPPLIER_CHECKS_LOCAL_PATH,
    JSON.stringify(records, null, 2),
    "utf8",
  );
}

export async function readSupplierProductCheckRecords(): Promise<SupplierProductCheckRecord[]> {
  const byKey = new Map<string, SupplierProductCheckRecord>();

  if (hasConfiguredDatabaseUrl()) {
    const db = await getRequiredEarthosDb();
    const rows = await db
      .select()
      .from(earthosControlMapFindings)
      .where(eq(earthosControlMapFindings.owner, SUPPLIER_CONNECTION_CHECKS_OWNER))
      .orderBy(desc(earthosControlMapFindings.updatedAt));

    for (const row of rows) {
      const parsed = parseSupplierCheckFromFindingRow(row);
      if (!parsed) continue;
      const key = supplierCheckKey(parsed.companyId, parsed.productId, parsed.checkType);
      if (!byKey.has(key)) {
        byKey.set(key, parsed);
      }
    }
    return Array.from(byKey.values());
  }

  for (const item of readLocalNonProdSupplierChecks()) {
    byKey.set(
      supplierCheckKey(item.companyId, item.productId, item.checkType),
      {
        ...item,
        storageBackend: item.storageBackend || "local_file_nonprod",
      },
    );
  }
  return Array.from(byKey.values());
}

export async function saveSupplierProductCheckRecord(
  record: SupplierProductCheckRecord,
): Promise<SupplierProductCheckRecord> {
  const findingId =
    record.findingId ||
    buildSupplierCheckFindingId(record.companyId, record.productId, record.checkType);
  const useDatabase = hasConfiguredDatabaseUrl();

  if (!useDatabase && process.env.VERCEL_ENV === "production") {
    throw new Error(
      "Durable database storage (DATABASE_URL) is required in production to persist supplier connection checks.",
    );
  }

  if (useDatabase) {
    const db = await getRequiredEarthosDb();
    const persistedRecord: SupplierProductCheckRecord = {
      ...record,
      findingId,
      storageBackend: "earthos_control_map_findings",
    };
    const findingStatus = persistedRecord.verified ? "resolved" : "open";
    const summaryNote = `[${persistedRecord.checkType}] ${persistedRecord.companyId}/${persistedRecord.productId}: ${persistedRecord.statusLabel} (${persistedRecord.checkedAt})`;
    const recordedDate = new Date(persistedRecord.checkedAt);

    await db
      .insert(earthosControlMapFindings)
      .values({
        findingId,
        status: findingStatus,
        severity: "watch",
        owner: SUPPLIER_CONNECTION_CHECKS_OWNER,
        note: summaryNote,
        metadata: persistedRecord as unknown as Record<string, unknown>,
        updatedAt: recordedDate,
      })
      .onConflictDoUpdate({
        target: earthosControlMapFindings.findingId,
        set: {
          status: findingStatus,
          severity: "watch",
          owner: SUPPLIER_CONNECTION_CHECKS_OWNER,
          note: summaryNote,
          metadata: persistedRecord as unknown as Record<string, unknown>,
          updatedAt: recordedDate,
        },
      });

    await db.insert(earthosControlMapFindingHistory).values({
      findingId,
      event:
        persistedRecord.checkType === "booking_link"
          ? "supplier_booking_link_checked"
          : "supplier_live_inventory_checked",
      status: findingStatus,
      severity: "watch",
      owner: SUPPLIER_CONNECTION_CHECKS_OWNER,
      nodeSlug: "portfolio",
      corridor: "supplier-connections",
      recordedAt: recordedDate,
      summary: summaryNote,
      approvedAt: null,
      approvedBy: null,
      controlSurface: "/admin/portfolio",
      metadata: persistedRecord as unknown as Record<string, unknown>,
    });

    const verifyRows = await db
      .select()
      .from(earthosControlMapFindings)
      .where(
        and(
          eq(earthosControlMapFindings.findingId, findingId),
          eq(earthosControlMapFindings.owner, SUPPLIER_CONNECTION_CHECKS_OWNER),
        ),
      )
      .limit(1);

    const verifiedBack = verifyRows[0]
      ? parseSupplierCheckFromFindingRow(verifyRows[0])
      : null;
    if (
      !verifiedBack ||
      verifiedBack.checkedAt !== persistedRecord.checkedAt ||
      verifiedBack.productId !== persistedRecord.productId
    ) {
      throw new Error(
        `Post-write database verification failed for supplier check ${findingId}.`,
      );
    }

    return verifiedBack;
  }

  const persistedLocal: SupplierProductCheckRecord = {
    ...record,
    findingId,
    storageBackend: "local_file_nonprod",
  };
  const key = supplierCheckKey(record.companyId, record.productId, record.checkType);
  const existing = readLocalNonProdSupplierChecks();
  const byKey = new Map<string, SupplierProductCheckRecord>();
  for (const item of existing) {
    byKey.set(supplierCheckKey(item.companyId, item.productId, item.checkType), item);
  }
  byKey.set(key, persistedLocal);
  writeLocalNonProdSupplierChecks(Array.from(byKey.values()));

  const verifyLocal = readLocalNonProdSupplierChecks().find(
    (item) =>
      supplierCheckKey(item.companyId, item.productId, item.checkType) === key &&
      item.checkedAt === persistedLocal.checkedAt,
  );
  if (!verifyLocal) {
    throw new Error(
      `Post-write local file verification failed for supplier check ${findingId}.`,
    );
  }
  return verifyLocal;
}

export async function deleteSupplierProductCheckRecord(params: {
  companyId: string;
  productId: string;
  checkType: SupplierCheckType;
}): Promise<void> {
  const findingId = buildSupplierCheckFindingId(
    params.companyId,
    params.productId,
    params.checkType,
  );
  if (hasConfiguredDatabaseUrl()) {
    const db = await getRequiredEarthosDb();
    await db
      .delete(earthosControlMapFindings)
      .where(
        and(
          eq(earthosControlMapFindings.findingId, findingId),
          eq(earthosControlMapFindings.owner, SUPPLIER_CONNECTION_CHECKS_OWNER),
        ),
      );
    await db
      .delete(earthosControlMapFindingHistory)
      .where(
        and(
          eq(earthosControlMapFindingHistory.findingId, findingId),
          eq(earthosControlMapFindingHistory.owner, SUPPLIER_CONNECTION_CHECKS_OWNER),
        ),
      );
  } else {
    const targetKey = supplierCheckKey(
      params.companyId,
      params.productId,
      params.checkType,
    );
    const remaining = readLocalNonProdSupplierChecks().filter(
      (item) =>
        supplierCheckKey(item.companyId, item.productId, item.checkType) !== targetKey,
    );
    writeLocalNonProdSupplierChecks(remaining);
  }
}

function maxIsoTimestamp(
  timestamps: Array<string | null | undefined>,
): string | null {
  let bestIso: string | null = null;
  let bestMs = -Infinity;
  for (const raw of timestamps) {
    if (!raw || typeof raw !== "string") continue;
    const ms = Date.parse(raw);
    if (Number.isFinite(ms) && ms > bestMs) {
      bestMs = ms;
      bestIso = raw;
    }
  }
  return bestIso;
}

type RawProductSpec = Omit<
  SupplierConnectionProductLink,
  "bookingLinkCheck" | "liveInventoryCheck" | "lastCheckedAt"
>;

function attachChecksToProducts(
  companyId: string,
  rawProducts: RawProductSpec[],
  checkMap: Map<string, SupplierProductCheckRecord>,
): SupplierConnectionProductLink[] {
  return rawProducts.map((prod) => {
    const bookingLinkCheck =
      checkMap.get(supplierCheckKey(companyId, prod.productId, "booking_link")) ||
      null;
    const liveInventoryCheck =
      checkMap.get(supplierCheckKey(companyId, prod.productId, "live_inventory")) ||
      null;
    const lastCheckedAt = maxIsoTimestamp([
      bookingLinkCheck?.checkedAt,
      liveInventoryCheck?.checkedAt,
    ]);
    return {
      ...prod,
      bookingLinkCheck,
      liveInventoryCheck,
      lastCheckedAt,
    };
  });
}

function buildCompanyRecordFromProductsAndChecks(params: {
  companyId: string;
  companyName: string;
  providerShortname: string | null;
  market: string;
  bookingSystem: string;
  rawProducts: RawProductSpec[];
  checkMap: Map<string, SupplierProductCheckRecord>;
  commissionTerms: CapabilityReadinessItem<
    "commission_terms_pending" | "commission_terms_confirmed"
  >;
  apiBooking: CapabilityReadinessItem<
    "api_booking_requires_approval" | "api_booking_approved"
  >;
  defaultPlannerDisplayCheck: SupplierPlannerLiveDisplayCheck;
  defaultNeedsAttentionNote: string | null;
}): SupplierConnectionRecord {
  const products = attachChecksToProducts(
    params.companyId,
    params.rawProducts,
    params.checkMap,
  );

  const bookingChecks = products
    .map((p) => p.bookingLinkCheck)
    .filter((c): c is SupplierProductCheckRecord => c !== null);
  const inventoryChecks = products
    .map((p) => p.liveInventoryCheck)
    .filter((c): c is SupplierProductCheckRecord => c !== null);

  const bookingLinksLastChecked = maxIsoTimestamp(
    bookingChecks.map((c) => c.checkedAt),
  );
  const liveInventoryLastChecked = maxIsoTimestamp(
    inventoryChecks.map((c) => c.checkedAt),
  );
  const lastChecked = maxIsoTimestamp([
    bookingLinksLastChecked,
    liveInventoryLastChecked,
  ]);

  const anyBookingVerified =
    bookingChecks.length > 0 && bookingChecks.some((c) => c.verified);
  const allBookingVerified =
    products.length > 0 &&
    products.every((p) => p.bookingLinkCheck?.verified === true);

  const checkoutCode: "checkout_tested" | "checkout_pending_test" =
    anyBookingVerified ? "checkout_tested" : "checkout_pending_test";

  const checkoutLabel =
    bookingChecks.length === 0
      ? "Not checked"
      : allBookingVerified
        ? bookingChecks[0].statusLabel
        : anyBookingVerified
          ? `${bookingChecks.filter((c) => c.verified).length}/${products.length} product booking links verified`
          : bookingChecks[0].statusLabel;

  const checkoutWhatItProves =
    bookingChecks.length === 0
      ? "No booking link check recorded yet. Use 'Check booking link' to follow the live handoff and verify supplier, product, and tracking tag."
      : bookingChecks.map((c) => `${c.productTitle}: ${c.whatItProves}`).join(" · ");

  const checkoutReadinessItem: CapabilityReadinessItem<
    "checkout_tested" | "checkout_pending_test"
  > = {
    capability: "checkout",
    code: checkoutCode,
    label: checkoutLabel,
    ready: anyBookingVerified,
    evidence: checkoutWhatItProves,
    evidenceSource:
      bookingChecks[0]?.finalReachedUrl || bookingChecks[0]?.targetUrl || null,
    updatedAt: bookingLinksLastChecked || "not_checked",
  };

  const anyInventoryVerified =
    inventoryChecks.length > 0 && inventoryChecks.some((c) => c.verified);
  const isFareHarbor =
    params.bookingSystem.toLowerCase().includes("fareharbor") ||
    Boolean(params.providerShortname && params.providerShortname !== "gosno");

  const seatCode:
    | "check_seats_at_fareharbor"
    | "check_seats_at_provider"
    | "live_seats_verified" = anyInventoryVerified
    ? "live_seats_verified"
    : isFareHarbor
      ? "check_seats_at_fareharbor"
      : "check_seats_at_provider";

  const seatLabel =
    inventoryChecks.length === 0
      ? "Not checked"
      : inventoryChecks[0].statusLabel;

  const seatWhatItProves =
    inventoryChecks.length === 0
      ? "No live inventory check recorded yet. Use 'Check live inventory' to query the supplier API for a specific trip and record a check time."
      : inventoryChecks
          .map((c) => `${c.productTitle}: ${c.whatItProves}`)
          .join(" · ");

  const seatReadinessItem: CapabilityReadinessItem<
    "check_seats_at_fareharbor" | "check_seats_at_provider" | "live_seats_verified"
  > = {
    capability: "seat_availability",
    code: seatCode,
    label: seatLabel,
    ready: anyInventoryVerified,
    evidence: seatWhatItProves,
    evidenceSource: inventoryChecks[0]?.targetUrl || null,
    updatedAt: liveInventoryLastChecked || "not_checked",
  };

  const plannerDisplayFromChecks =
    inventoryChecks.find((c) => c.plannerLiveDisplayCheck)?.plannerLiveDisplayCheck ||
    params.defaultPlannerDisplayCheck;

  const readinessStatuses: OperatorOfferReadinessStatuses = {
    checkout: checkoutReadinessItem,
    seatAvailability: seatReadinessItem,
    commissionTerms: params.commissionTerms,
    apiBooking: params.apiBooking,
  };

  const connectionStatus: SupplierConnectionRecord["connectionStatus"] =
    anyBookingVerified && anyInventoryVerified
      ? "connected"
      : anyBookingVerified
        ? "checkout_only"
        : "needs_attention";

  return {
    companyId: params.companyId,
    companyName: params.companyName,
    providerShortname: params.providerShortname,
    market: params.market,
    bookingSystem: params.bookingSystem,
    connectionStatus,
    productsAndBookingLinks: products,
    checkoutVerified: {
      verified: anyBookingVerified,
      code: checkoutCode,
      label: checkoutLabel,
      whatItProves: checkoutWhatItProves,
      evidence: checkoutWhatItProves,
      evidenceSource: checkoutReadinessItem.evidenceSource,
      checkedAt: bookingLinksLastChecked,
      readinessItem: checkoutReadinessItem,
    },
    livePricesAndSeatsVerified: {
      verified: anyInventoryVerified,
      code: seatCode,
      label: seatLabel,
      whatItProves: seatWhatItProves,
      evidence: seatWhatItProves,
      evidenceSource: seatReadinessItem.evidenceSource,
      checkedAt: liveInventoryLastChecked,
      readinessItem: seatReadinessItem,
    },
    plannerLiveDisplayVerified: plannerDisplayFromChecks,
    bookingLinksLastChecked,
    liveInventoryLastChecked,
    lastChecked,
    needsAttentionNote: params.defaultNeedsAttentionNote,
    readinessStatuses,
  };
}

export async function buildBaselinePortfolioSupplierConnections(
  preloadedChecks?: SupplierProductCheckRecord[],
): Promise<SupplierConnectionRecord[]> {
  const savedChecks = preloadedChecks ?? (await readSupplierProductCheckRecords());
  const checkMap = new Map<string, SupplierProductCheckRecord>();
  for (const rec of savedChecks) {
    checkMap.set(
      supplierCheckKey(rec.companyId, rec.productId, rec.checkType),
      rec,
    );
  }

  const southernStyleRawProducts: RawProductSpec[] = STOREFRONT_PRODUCTS.filter(
    (p) => p.companyShortname === "southernstyletours" && p.fareharborAsnActive === true,
  ).map((product) => ({
    productId: product.id,
    title: product.title,
    dccPageHref: `/new-orleans/tours/${product.slug}`,
    bookingHref: getProductPrimaryBookingHref(product),
    bookingLinkLabel: `FareHarbor #${product.itemId || product.id} (asn=aktourcenter)`,
    itemId: product.itemId || null,
    flowId: product.flowId || null,
    attributionTag: "asn=aktourcenter",
  }));

  const raginCajunRawProducts: RawProductSpec[] = STOREFRONT_PRODUCTS.filter(
    (p) => p.companyShortname === "ragincajuntours" && p.fareharborAsnActive === true,
  ).map((product) => {
    const variantItemIds =
      product.bookingVariants && product.bookingVariants.length > 1
        ? product.bookingVariants.map((v) => `#${v.itemId}`).join(" / ")
        : `#${product.itemId || product.id}`;
    return {
      productId: product.id,
      title: product.title,
      dccPageHref: `/new-orleans/tours/${product.slug}`,
      bookingHref: getProductPrimaryBookingHref(product),
      bookingLinkLabel: `FareHarbor ${variantItemIds} (asn=aktourcenter)`,
      itemId: product.itemId || null,
      flowId: product.flowId || null,
      attributionTag: "asn=aktourcenter",
    };
  });

  const gosnoRawProducts: RawProductSpec[] = [
    {
      productId: "gosno-colorado-planner-vail-booking",
      title: "DCC Colorado Planner — Vail Private SUV / Van Booking (1–10 Pax)",
      dccPageHref: "/transportation/colorado",
      bookingHref:
        "https://gosno.co/vail?origin=DEN&destination=Vail&passengers=7&passengerCount=7&vehicleClass=van&src=dcc-authority-colorado",
      bookingLinkLabel: "GoSno Vail Booking (src=dcc-authority-colorado)",
      itemId: "gosno-vail-private",
      flowId: "direct-booking",
      attributionTag: "src=dcc-authority-colorado",
    },
    {
      productId: "gosno-colorado-planner-breckenridge-booking",
      title: "DCC Colorado Planner — Breckenridge Private SUV Booking (1–6 Pax)",
      dccPageHref: "/transportation/colorado",
      bookingHref:
        "https://gosno.co/breckenridge?origin=DEN&destination=Breckenridge&passengers=6&passengerCount=6&vehicleClass=suv&src=dcc-authority-colorado",
      bookingLinkLabel: "GoSno Breckenridge Booking (src=dcc-authority-colorado)",
      itemId: "gosno-breckenridge-private",
      flowId: "direct-booking",
      attributionTag: "src=dcc-authority-colorado",
    },
    {
      productId: "gosno-colorado-planner-group-quote",
      title: "DCC Colorado Planner — Multi-Vehicle Group Quote (11+ Pax)",
      dccPageHref: "/transportation/colorado",
      bookingHref:
        "https://gosno.co/request-quote?origin=DEN&destination=Vail&passengers=16&passengerCount=16&party_size=16&vehicleType=van&src=dcc-authority-colorado",
      bookingLinkLabel: "GoSno Request Quote (src=dcc-authority-colorado)",
      itemId: "gosno-group-quote",
      flowId: "request-quote",
      attributionTag: "src=dcc-authority-colorado",
    },
  ];

  const jeanLafitteRawProducts: RawProductSpec[] = [
    {
      productId: "jeanlafitte-swamp-tour-with-hotel-pickup",
      title: "Jean Lafitte Swamp Tour with Hotel Pickup (Item #763318)",
      dccPageHref: "/new-orleans/tours/jeanlafitte-swamp-tour-with-hotel-pickup",
      bookingHref: JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE.existingCheckoutLink,
      bookingLinkLabel: "FareHarbor #763318 ($131.44 / 2 adults walkthrough)",
      itemId: JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE.offerItemId,
      flowId: "no",
      attributionTag: "ref=WelcomeToNewOrleansTours",
    },
  ];

  const steamboatRawProducts: RawProductSpec[] = STOREFRONT_PRODUCTS.filter(
    (p) => p.companyShortname === "neworleanssteamboatcompany",
  )
    .slice(0, 4)
    .map((product) => ({
      productId: product.id,
      title: product.title,
      dccPageHref: `/new-orleans/tours/${product.slug}`,
      bookingHref: getProductPrimaryBookingHref(product),
      bookingLinkLabel: `FareHarbor #${product.itemId || product.bookingVariants?.[0]?.itemId || product.id} (asn=welcometoneworleanstours)`,
      itemId: product.itemId || product.bookingVariants?.[0]?.itemId || null,
      flowId: product.flowId || product.bookingVariants?.[0]?.flowId || null,
      attributionTag: "asn=welcometoneworleanstours",
    }));

  const pendingCatalogProviders: SupplierConnectionRecord[] = Object.values(PROVIDERS)
    .filter((provider) => provider.status === "pending_inventory")
    .map((provider) => {
      const readiness = buildInitialOfferReadinessStatuses({
        bookingSystem: provider.bookingPlatform || "other",
        operatorName: provider.displayName,
        nowIso: "not_checked",
      });
      return buildCompanyRecordFromProductsAndChecks({
        companyId: provider.id,
        companyName: provider.displayName,
        providerShortname: provider.fareHarborShortname,
        market: "New Orleans (WNO Catalog)",
        bookingSystem: provider.bookingPlatform || "Pending onboarding",
        rawProducts: provider.productIds.map((pid) => ({
          productId: pid,
          title: pid
            .replaceAll("-", " ")
            .replace(/\b\w/g, (char) => char.toUpperCase()),
          dccPageHref: "/new-orleans/tours",
          bookingHref: null,
          bookingLinkLabel: "Booking link pending operator onboarding",
          itemId: null,
          flowId: null,
          attributionTag: null,
        })),
        checkMap,
        commissionTerms: readiness.commissionTerms,
        apiBooking: readiness.apiBooking,
        defaultPlannerDisplayCheck: {
          verified: false,
          statusLabel: "Not displayed — pending inventory onboarding",
          whatItProves:
            "Separate planner display check: no live inventory or checkout link is connected for this provider yet.",
        },
        defaultNeedsAttentionNote:
          "Catalog provider marked pending_inventory — needs verified checkout links, dated rate sheet, and live seat availability.",
      });
    });

  return [
    buildCompanyRecordFromProductsAndChecks({
      companyId: "southern-style-tours",
      companyName: "Southern Style Tours",
      providerShortname: "southernstyletours",
      market: "New Orleans (DCC / WNO)",
      bookingSystem: "FareHarbor (ASN: aktourcenter)",
      rawProducts: southernStyleRawProducts,
      checkMap,
      commissionTerms: {
        capability: "commission_terms",
        code: "commission_terms_confirmed",
        label: "ASN attribution active (aktourcenter)",
        ready: true,
        evidence:
          "FareHarbor ASN referral links active under aktourcenter across items 51942, 83002, and 51953.",
        evidenceSource: "fareharbor_asn:aktourcenter:southernstyletours",
        updatedAt: "not_checked",
      },
      apiBooking: {
        capability: "api_booking",
        code: "api_booking_requires_approval",
        label: "External API v1 read/write pending supplier grant",
        ready: false,
        evidence:
          "Guests complete checkout on FareHarbor with aktourcenter attribution; External API v1 access requires supplier-granted API key permission.",
        evidenceSource: null,
        updatedAt: "not_checked",
      },
      defaultPlannerDisplayCheck: {
        verified: false,
        statusLabel: "Storefront shows static baseline rates ($50–$99)",
        whatItProves:
          "Separate planner display check: DCC storefront displays static baseline rates ($50–$99) and opens FareHarbor checkout rather than rendering live API seat counts.",
      },
      defaultNeedsAttentionNote:
        "Run 'Check booking link' to follow the live FareHarbor handoff and 'Check live inventory' to test WNO External API v1 access.",
    }),
    buildCompanyRecordFromProductsAndChecks({
      companyId: "ragin-cajun-tours",
      companyName: "Ragin Cajun Airboat Tours",
      providerShortname: "ragincajuntours",
      market: "New Orleans (DCC / WNO)",
      bookingSystem: "FareHarbor (ASN: aktourcenter)",
      rawProducts: raginCajunRawProducts,
      checkMap,
      commissionTerms: {
        capability: "commission_terms",
        code: "commission_terms_confirmed",
        label: "ASN attribution active (aktourcenter)",
        ready: true,
        evidence:
          "FareHarbor ASN referral links active under aktourcenter across airboat options (228561, 228524, 448291), covered tour boat (590176), and combo (603090).",
        evidenceSource: "fareharbor_asn:aktourcenter:ragincajuntours",
        updatedAt: "not_checked",
      },
      apiBooking: {
        capability: "api_booking",
        code: "api_booking_requires_approval",
        label: "External API v1 permission required",
        ready: false,
        evidence:
          "Requires Ragin Cajun Tours / FareHarbor Support to grant External API v1 affiliate read/booking permission for user key onto company shortname ragincajuntours.",
        evidenceSource: null,
        updatedAt: "not_checked",
      },
      defaultPlannerDisplayCheck: {
        verified: false,
        statusLabel: "Fallback active: pre-tax estimates + Check dates and prices on FareHarbor",
        whatItProves:
          "Separate planner display check: because live API inventory is unavailable, the storefront labels pre-tax estimates, gates item 228561 Luling meeting point directions, and shows 'Check dates and prices on FareHarbor'.",
      },
      defaultNeedsAttentionNote:
        "Airboat options and Covered swamp boat booking links use AKTOURCENTER attribution; External API v1 returns HTTP 403 until ragincajuntours grants API read access.",
    }),
    buildCompanyRecordFromProductsAndChecks({
      companyId: "gosno",
      companyName: "GoSno",
      providerShortname: "gosno",
      market: "Colorado (DCC Mountain Corridor)",
      bookingSystem: "GoSno Direct Booking & Quote + /api/availability",
      rawProducts: gosnoRawProducts,
      checkMap,
      commissionTerms: {
        capability: "commission_terms",
        code: "commission_terms_confirmed",
        label: "Portfolio satellite attribution active",
        ready: true,
        evidence:
          "Two-way satellite handoff telemetry and src=dcc-authority-colorado attribution active between DCC and GoSno.",
        evidenceSource: "dcc_satellite_handoffs:gosno",
        updatedAt: "not_checked",
      },
      apiBooking: {
        capability: "api_booking",
        code: "api_booking_requires_approval",
        label: "Checkout & quote completed on GoSno",
        ready: false,
        evidence:
          "Payment, Rezdy provisioning, and operations queue stay inside GoSno.",
        evidenceSource: null,
        updatedAt: "not_checked",
      },
      defaultPlannerDisplayCheck: {
        verified: false,
        statusLabel: "Separate check: planner displays static reference baseline",
        whatItProves:
          "Whether DCC displays that live API result in the planner is a separate check: /transportation/colorado currently renders static reference copy ($499 DEN–Vail SUV baseline) and handoff links rather than binding live GoSno /api/availability prices directly into the planner UI.",
      },
      defaultNeedsAttentionNote:
        "Use 'Check booking link' to verify the live GoSno handoff and 'Check live inventory' to query GoSno /api/availability for a specific route, pickup date/time, party size, and vehicle class.",
    }),
    buildCompanyRecordFromProductsAndChecks({
      companyId: "jean-lafitte-swamp-tours",
      companyName: JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE.operatorName,
      providerShortname: JEAN_LAFITTE_763318_ONBOARDING_EXAMPLE.providerShortname,
      market: "New Orleans (DCC / WNO)",
      bookingSystem: "FareHarbor (Item #763318) + Viator Fallback",
      rawProducts: jeanLafitteRawProducts,
      checkMap,
      commissionTerms: {
        capability: "commission_terms",
        code: "commission_terms_pending",
        label: "Commission terms pending",
        ready: false,
        evidence:
          "FareHarbor item #763318 currently returns is_affiliate_rules_applied: false; awaiting operator confirmation of affiliate account and commission terms.",
        evidenceSource: null,
        updatedAt: "not_checked",
      },
      apiBooking: {
        capability: "api_booking",
        code: "api_booking_requires_approval",
        label: "API booking requires approval",
        ready: false,
        evidence:
          "Guests are routed to hosted checkout; direct API booking requires provider-approved API access.",
        evidenceSource: null,
        updatedAt: "not_checked",
      },
      defaultPlannerDisplayCheck: {
        verified: false,
        statusLabel: "Storefront shows walkthrough flat rate ($131.44 / 2 adults)",
        whatItProves:
          "Separate planner display check: storefront shows static walkthrough total ($131.44 for 2 adults) rather than live API seat counts.",
      },
      defaultNeedsAttentionNote:
        "Run 'Check booking link' and 'Check live inventory' to record fresh verification timestamps for item #763318.",
    }),
    buildCompanyRecordFromProductsAndChecks({
      companyId: "new-orleans-steamboat-gray-line",
      companyName: "New Orleans Steamboat Company / Gray Line",
      providerShortname: "neworleanssteamboatcompany",
      market: "New Orleans (DCC / WNO)",
      bookingSystem: "FareHarbor (ASN: welcometoneworleanstours)",
      rawProducts: steamboatRawProducts,
      checkMap,
      commissionTerms: {
        capability: "commission_terms",
        code: "commission_terms_confirmed",
        label: "ASN attribution active (welcometoneworleanstours)",
        ready: true,
        evidence:
          "Configured with ref=WelcomeToNewOrleansTours and asn=welcometoneworleanstours across 12 catalog products.",
        evidenceSource: "fareharbor_asn:neworleanssteamboatcompany",
        updatedAt: "not_checked",
      },
      apiBooking: {
        capability: "api_booking",
        code: "api_booking_requires_approval",
        label: "Hosted FareHarbor checkout",
        ready: false,
        evidence:
          "Bookings complete on New Orleans Steamboat Company / Gray Line hosted FareHarbor flows.",
        evidenceSource: null,
        updatedAt: "not_checked",
      },
      defaultPlannerDisplayCheck: {
        verified: false,
        statusLabel: "Storefront shows published flat rates",
        whatItProves:
          "Separate planner display check: storefront displays published flat rates; remaining seat counts are checked inside FareHarbor checkout.",
      },
      defaultNeedsAttentionNote:
        "No live check recorded yet in cockpit — use 'Check booking link' or 'Check live inventory' to verify and record check times.",
    }),
    ...pendingCatalogProviders,
  ];
}

export async function listPortfolioSupplierConnections(options: {
  environmentScope?: EarthosEnvironmentScope | "all";
} = {}): Promise<SupplierConnectionRecord[]> {
  const savedChecks = await readSupplierProductCheckRecords();
  const baseline = await buildBaselinePortfolioSupplierConnections(savedChecks);
  let persistedQueue: PublicOperatorOnboardingRecord[] = [];
  try {
    persistedQueue = await listOperatorOnboardingReviewQueue({
      environmentScope: options.environmentScope || "all",
      limit: 100,
    });
  } catch {
    persistedQueue = [];
  }

  if (persistedQueue.length === 0) {
    return baseline;
  }

  const checkMap = new Map<string, SupplierProductCheckRecord>();
  for (const rec of savedChecks) {
    checkMap.set(
      supplierCheckKey(rec.companyId, rec.productId, rec.checkType),
      rec,
    );
  }

  const byKey = new Map<string, SupplierConnectionRecord>();
  for (const row of baseline) {
    byKey.set(row.companyId.toLowerCase(), row);
    if (row.providerShortname) {
      byKey.set(row.providerShortname.toLowerCase(), row);
    }
  }

  const extraRecords: SupplierConnectionRecord[] = [];

  for (const app of persistedQueue) {
    if (!app.readinessStatuses) continue;
    const shortnameKey = (app.submitted.providerShortname || "").trim().toLowerCase();
    const nameKey = app.submitted.companyName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    const existing =
      (shortnameKey && byKey.get(shortnameKey)) || byKey.get(nameKey) || null;

    if (existing) {
      existing.readinessStatuses = {
        ...existing.readinessStatuses,
        commissionTerms: app.readinessStatuses.commissionTerms,
        apiBooking: app.readinessStatuses.apiBooking,
      };
    } else {
      const companyId = `onb-${app.applicationId}`;
      const productId = app.submitted.tourId || app.applicationId;
      extraRecords.push(
        buildCompanyRecordFromProductsAndChecks({
          companyId,
          companyName: app.submitted.companyName,
          providerShortname: app.submitted.providerShortname || null,
          market: app.submitted.destinations || "Onboarding Queue",
          bookingSystem: app.submitted.bookingSystem,
          rawProducts: [
            {
              productId,
              title: app.submitted.exactTourOption || app.submitted.companyName,
              dccPageHref: "/new-orleans/tours",
              bookingHref: app.submitted.existingCheckoutLink || null,
              bookingLinkLabel: app.submitted.existingCheckoutLink
                ? `${app.submitted.bookingSystem} Checkout`
                : "Pending checkout link",
              itemId: app.submitted.offerItemId || null,
              flowId: null,
              attributionTag: app.reviewRecord?.affiliateAccount || null,
            },
          ],
          checkMap,
          commissionTerms: app.readinessStatuses.commissionTerms,
          apiBooking: app.readinessStatuses.apiBooking,
          defaultPlannerDisplayCheck: {
            verified: false,
            statusLabel: "Not displayed in planner — onboarding review queue",
            whatItProves:
              "Separate planner display check: onboarding application is in the review queue and does not render live API inventory in the storefront.",
          },
          defaultNeedsAttentionNote:
            "Onboarding application submitted — run 'Check booking link' and 'Check live inventory' to record actual verification timestamps.",
        }),
      );
    }
  }

  return [...baseline, ...extraRecords];
}

async function followCheckoutHandoffUrl(
  initialUrl: string,
  fetchFn: typeof fetch,
  timeoutMs: number,
): Promise<{
  httpStatus: number;
  finalUrl: string;
  handoffChain: string[];
  bodyText: string;
}> {
  const handoffChain: string[] = [initialUrl];
  let currentUrl = initialUrl;
  let lastStatus = 0;
  let bodyText = "";

  for (let hop = 0; hop < 8; hop += 1) {
    const response = await fetchFn(currentUrl, {
      method: "GET",
      redirect: "manual",
      headers: {
        "user-agent": "DCC-SupplierConnections-Verifier/1.0 (+https://www.destinationcommandcenter.com)",
        accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });

    lastStatus = response.status;
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) break;
      const nextUrl = new URL(location, currentUrl).toString();
      handoffChain.push(nextUrl);
      currentUrl = nextUrl;
      continue;
    }

    try {
      const rawText = await response.text();
      bodyText = rawText.slice(0, 65536);
    } catch {
      bodyText = "";
    }
    break;
  }

  return {
    httpStatus: lastStatus,
    finalUrl: currentUrl,
    handoffChain,
    bodyText,
  };
}

export async function runSupplierBookingLinkCheck(params: {
  companyId: string;
  productId: string;
  nowIso?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): Promise<{
  ok: boolean;
  persisted: boolean;
  status: 200 | 404 | 500;
  message?: string;
  checkRecord?: SupplierProductCheckRecord;
  companyConnection?: SupplierConnectionRecord;
}> {
  const checkedAt = params.nowIso || new Date().toISOString();
  const fetchFn = params.fetchImpl || fetch;
  const timeoutMs = params.timeoutMs ?? 10000;

  const connections = await listPortfolioSupplierConnections();
  const company = connections.find(
    (c) => c.companyId.toLowerCase() === params.companyId.trim().toLowerCase(),
  );
  if (!company) {
    return {
      ok: false,
      persisted: false,
      status: 404,
      message: `Company "${params.companyId}" not found in Supplier Connections.`,
    };
  }
  const product = company.productsAndBookingLinks.find(
    (p) => p.productId.toLowerCase() === params.productId.trim().toLowerCase(),
  );
  if (!product) {
    return {
      ok: false,
      persisted: false,
      status: 404,
      message: `Product "${params.productId}" not found under company "${company.companyName}".`,
    };
  }

  let verified = false;
  let failureReason: SupplierCheckFailureReason = "missing_booking_url";
  let code = "booking_link_missing";
  let statusLabel = "No booking link configured";
  let whatItProves = `Checked ${product.title} (${product.dccPageHref}) at ${checkedAt}: no outbound booking URL is configured on this catalog product.`;
  let httpStatus: number | null = null;
  let finalReachedUrl: string | null = null;
  let handoffChain: string[] = [];
  let supplierMatched = false;
  let productMatched = false;
  let attributionVerified = false;
  let attributionTag: string | null = product.attributionTag || null;

  if (product.bookingHref) {
    try {
      const initialParsed = new URL(product.bookingHref);
      const followed = await followCheckoutHandoffUrl(
        initialParsed.toString(),
        fetchFn,
        timeoutMs,
      );
      httpStatus = followed.httpStatus;
      finalReachedUrl = followed.finalUrl;
      handoffChain = followed.handoffChain;

      const finalParsed = new URL(followed.finalUrl);
      const lowerFinalUrl = followed.finalUrl.toLowerCase();
      const lowerBody = followed.bodyText.toLowerCase();

      const expectedShortname = (company.providerShortname || "").trim().toLowerCase();
      if (company.companyId === "gosno" || expectedShortname === "gosno") {
        supplierMatched =
          finalParsed.hostname === "gosno.co" ||
          finalParsed.hostname.endsWith(".gosno.co") ||
          lowerBody.includes("gosno");
        if (product.productId.includes("vail")) {
          productMatched =
            finalParsed.pathname.toLowerCase().includes("/vail") ||
            finalParsed.searchParams.get("destination")?.toLowerCase() === "vail";
        } else if (product.productId.includes("breckenridge")) {
          productMatched =
            finalParsed.pathname.toLowerCase().includes("/breckenridge") ||
            finalParsed.searchParams.get("destination")?.toLowerCase() === "breckenridge";
        } else if (product.productId.includes("quote")) {
          productMatched = finalParsed.pathname.toLowerCase().includes("/request-quote");
        } else {
          productMatched = supplierMatched;
        }
      } else if (expectedShortname) {
        supplierMatched =
          lowerFinalUrl.includes(expectedShortname) ||
          lowerBody.includes(expectedShortname);
        if (product.itemId) {
          const itemToken = String(product.itemId).trim().toLowerCase();
          productMatched =
            lowerFinalUrl.includes(`/items/${itemToken}`) ||
            lowerFinalUrl.includes(itemToken) ||
            lowerBody.includes(itemToken);
        } else {
          productMatched = supplierMatched;
        }
      } else {
        supplierMatched = followed.httpStatus >= 200 && followed.httpStatus < 400;
        productMatched = supplierMatched;
      }

      const finalAsn = finalParsed.searchParams.get("asn");
      const finalSrc = finalParsed.searchParams.get("src");
      const finalRef = finalParsed.searchParams.get("ref");

      const expectedTag = (product.attributionTag || "").trim();
      if (expectedTag.startsWith("asn=")) {
        const expectedAsn = expectedTag.slice("asn=".length);
        attributionVerified =
          finalAsn === expectedAsn ||
          lowerBody.includes(`asn=${expectedAsn.toLowerCase()}`) ||
          lowerBody.includes(`"${expectedAsn.toLowerCase()}"`);
        if (attributionVerified) {
          attributionTag = `asn=${expectedAsn}`;
        }
      } else if (expectedTag.startsWith("src=")) {
        const expectedSrc = expectedTag.slice("src=".length);
        attributionVerified = finalSrc === expectedSrc;
        if (attributionVerified) {
          attributionTag = `src=${expectedSrc}`;
        }
      } else if (expectedTag.startsWith("ref=")) {
        const expectedRef = expectedTag.slice("ref=".length);
        attributionVerified =
          finalRef === expectedRef ||
          lowerBody.includes(expectedRef.toLowerCase());
        if (attributionVerified) {
          attributionTag = `ref=${expectedRef}`;
        }
      } else if (finalAsn || finalSrc || finalRef) {
        attributionVerified = true;
        attributionTag = finalAsn
          ? `asn=${finalAsn}`
          : finalSrc
            ? `src=${finalSrc}`
            : `ref=${finalRef}`;
      }

      const httpOk = followed.httpStatus >= 200 && followed.httpStatus < 400;

      if (!httpOk) {
        verified = false;
        failureReason = followed.httpStatus === 403 ? "http_403" : "http_error";
        code = "booking_link_http_error";
        statusLabel = `Checkout returned HTTP ${followed.httpStatus}`;
        whatItProves = `Followed handoff from ${product.dccPageHref} to ${followed.finalUrl} (${followed.handoffChain.length} hop${followed.handoffChain.length === 1 ? "" : "s"}): endpoint returned HTTP ${followed.httpStatus}.`;
      } else if (!supplierMatched || !productMatched) {
        verified = false;
        failureReason = "supplier_or_product_mismatch";
        code = "booking_link_target_mismatch";
        statusLabel = !supplierMatched
          ? "Checkout did not reach expected supplier"
          : "Checkout did not match expected product/item";
        whatItProves = `Followed handoff to ${followed.finalUrl} (HTTP ${followed.httpStatus}), but supplierMatched=${supplierMatched}, productMatched=${productMatched} (expected supplier=${company.providerShortname || company.companyId}, item=${product.itemId || product.productId}).`;
      } else if (!attributionVerified) {
        verified = false;
        failureReason = "tracking_tag_missing";
        code = "booking_link_verified_attribution_pending";
        statusLabel = "Checkout reached supplier, but tracking tag missing";
        whatItProves = `Followed handoff to ${followed.finalUrl} (HTTP ${followed.httpStatus}) and matched ${company.companyName} (${product.itemId || product.productId}), but expected tracking tag (${product.attributionTag || "asn/src"}) was not intact on the destination URL.`;
      } else {
        verified = true;
        failureReason = null;
        if (attributionTag === "asn=aktourcenter") {
          code = "booking_link_and_aktourcenter_verified";
          statusLabel = `Checkout reachable (HTTP ${followed.httpStatus}) & AKTOURCENTER verified`;
        } else if (attributionTag === "src=dcc-authority-colorado") {
          code = "booking_link_and_gosno_attribution_verified";
          statusLabel = `GoSno checkout reachable (HTTP ${followed.httpStatus}) & attribution verified`;
        } else {
          code = "booking_link_and_attribution_verified";
          statusLabel = `Checkout reachable (HTTP ${followed.httpStatus}) & ${attributionTag} verified`;
        }
        whatItProves = `Followed live handoff (${followed.handoffChain.length} hop${followed.handoffChain.length === 1 ? "" : "s"}) to ${followed.finalUrl} → HTTP ${followed.httpStatus}; verified supplier (${company.providerShortname || company.companyId}), product (${product.itemId || product.productId}), and ${attributionTag} tracking tag intact.`;
      }
    } catch (err) {
      const isTimeout =
        err instanceof Error &&
        (err.name === "TimeoutError" ||
          err.name === "AbortError" ||
          /timed?\s*out|aborted/i.test(err.message));
      verified = false;
      failureReason = isTimeout ? "timeout" : "network_error";
      httpStatus = null;
      code = isTimeout ? "booking_link_timeout" : "booking_link_network_error";
      statusLabel = isTimeout
        ? `Checkout handoff timed out (${timeoutMs}ms)`
        : "Checkout handoff request failed";
      whatItProves = `Attempted live handoff fetch to ${product.bookingHref} at ${checkedAt}: ${err instanceof Error ? err.message : "network error"}.`;
    }
  }

  const checkRecord: SupplierProductCheckRecord = {
    checkId: `chk_booking_link_${product.productId}`,
    companyId: company.companyId,
    productId: product.productId,
    productTitle: product.title,
    checkType: "booking_link",
    checkedAt,
    verified,
    failureReason,
    code,
    statusLabel,
    whatItProves,
    targetUrl: product.bookingHref || null,
    finalReachedUrl,
    handoffChain,
    supplierMatched,
    productMatched,
    httpStatus,
    attributionVerified,
    attributionTag,
    datedApiResponseAt: null,
    plannerLiveDisplayCheck: null,
  };

  try {
    const saved = await saveSupplierProductCheckRecord(checkRecord);
    const refreshed = await listPortfolioSupplierConnections();
    const updatedCompany = refreshed.find((c) => c.companyId === company.companyId);

    return {
      ok: true,
      persisted: true,
      status: 200,
      checkRecord: saved,
      companyConnection: updatedCompany,
    };
  } catch (err) {
    return {
      ok: false,
      persisted: false,
      status: 500,
      message:
        err instanceof Error
          ? `Failed to save booking link check durably: ${err.message}`
          : "Failed to save booking link check durably.",
      checkRecord,
    };
  }
}

export async function runSupplierLiveInventoryCheck(params: {
  companyId: string;
  productId: string;
  route?: string;
  pickupDate?: string;
  date?: string;
  pickupTime?: string;
  partySize?: number;
  vehicleClass?: string;
  nowIso?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  forceMissingWnoCredentials?: boolean;
}): Promise<{
  ok: boolean;
  persisted: boolean;
  status: 200 | 404 | 500;
  message?: string;
  checkRecord?: SupplierProductCheckRecord;
  companyConnection?: SupplierConnectionRecord;
}> {
  const checkedAt = params.nowIso || new Date().toISOString();
  const fetchFn = params.fetchImpl || fetch;
  const timeoutMs = params.timeoutMs ?? 10000;

  const connections = await listPortfolioSupplierConnections();
  const company = connections.find(
    (c) => c.companyId.toLowerCase() === params.companyId.trim().toLowerCase(),
  );
  if (!company) {
    return {
      ok: false,
      persisted: false,
      status: 404,
      message: `Company "${params.companyId}" not found in Supplier Connections.`,
    };
  }
  const product = company.productsAndBookingLinks.find(
    (p) => p.productId.toLowerCase() === params.productId.trim().toLowerCase(),
  );
  if (!product) {
    return {
      ok: false,
      persisted: false,
      status: 404,
      message: `Product "${params.productId}" not found under company "${company.companyName}".`,
    };
  }

  let verified = false;
  let failureReason: SupplierCheckFailureReason = "no_api_configured";
  let code = "check_seats_at_provider";
  let statusLabel = "Live inventory not available via API";
  let whatItProves = `Checked ${product.title} at ${checkedAt}: no live inventory API is connected for this product.`;
  let targetUrl: string | null = product.bookingHref || null;
  let httpStatus: number | null = null;
  let datedApiResponseAt: string | null = null;
  let tripQuery: SupplierLiveInventoryTripQuery | null = null;
  let plannerLiveDisplayCheck: SupplierPlannerLiveDisplayCheck = {
    verified: false,
    statusLabel: "Planner does not display live API inventory",
    whatItProves:
      "Separate planner display check: DCC does not render live API prices or seats for this product.",
  };

  if (company.companyId === "gosno" || company.providerShortname === "gosno") {
    const isBreck = product.productId.toLowerCase().includes("breckenridge");
    const isQuote = product.productId.toLowerCase().includes("quote");
    const routeId = (
      params.route || (isBreck ? "DEN-BRECKENRIDGE" : "DEN-VAIL")
    ).trim();
    const origin = "DEN";
    const dest = routeId.toUpperCase().includes("BRECK") ? "Breckenridge" : "Vail";
    const pickupDate = (params.pickupDate || params.date || "2026-12-15").trim();
    const pickupTime = (params.pickupTime || "10:00").trim();
    const defaultPartySize = isQuote ? 16 : isBreck ? 6 : 4;
    const partySize =
      typeof params.partySize === "number" && Number.isFinite(params.partySize) && params.partySize > 0
        ? Math.floor(params.partySize)
        : defaultPartySize;
    const defaultVehicleClass = isQuote
      ? "van"
      : isBreck
        ? "suv"
        : partySize > 6
          ? "van"
          : "suv";
    const vehicleClass = (params.vehicleClass || defaultVehicleClass)
      .trim()
      .toLowerCase();

    tripQuery = {
      route: routeId,
      origin,
      destination: dest,
      pickupDate,
      pickupTime,
      partySize,
      vehicleClass,
    };

    const availabilityUrl = new URL("https://gosno.co/api/availability");
    availabilityUrl.searchParams.set("routeId", routeId);
    availabilityUrl.searchParams.set("origin", origin);
    availabilityUrl.searchParams.set("dest", dest);
    availabilityUrl.searchParams.set("date", pickupDate);
    availabilityUrl.searchParams.set("time", pickupTime);
    availabilityUrl.searchParams.set("passengers", String(partySize));
    availabilityUrl.searchParams.set("vehicleClass", vehicleClass);
    availabilityUrl.searchParams.set("tripType", "ONE_WAY");
    availabilityUrl.searchParams.set("direction", "OUTBOUND");
    availabilityUrl.searchParams.set(
      "clientCorrelationId",
      `dcc-check-${product.productId.slice(0, 20)}-${Date.now().toString(36)}`,
    );

    targetUrl = availabilityUrl.toString();

    try {
      const response = await fetchFn(targetUrl, {
        method: "GET",
        headers: {
          accept: "application/json",
          "user-agent": "DCC-SupplierConnections-Verifier/1.0",
        },
        signal: AbortSignal.timeout(timeoutMs),
        cache: "no-store",
      });

      httpStatus = response.status;
      const payload = (await response.json().catch(() => null)) as
        | {
            error?: string;
            message?: string;
            availability?: Record<
              string,
              {
                available?: boolean;
                priceCents?: number;
                availabilityToken?: string;
                tokenExpiresAt?: string;
                unavailableReason?: string;
              }
            >;
          }
        | null;

      if (response.status === 200 && payload?.availability) {
        const slot =
          payload.availability[vehicleClass] ||
          payload.availability.suv ||
          payload.availability.van;
        if (slot && slot.available === true && typeof slot.priceCents === "number") {
          const priceUsd = (slot.priceCents / 100).toFixed(0);
          verified = true;
          failureReason = null;
          code = "live_seats_verified";
          datedApiResponseAt = checkedAt;
          statusLabel = `Live /api/availability verified ($${priceUsd} ${vehicleClass.toUpperCase()}, ${partySize} pax on ${pickupDate} ${pickupTime})`;
          whatItProves = `Proves GoSno live /api/availability (${targetUrl}) returned HTTP 200 for route=${routeId}, pickupDate=${pickupDate}, pickupTime=${pickupTime}, partySize=${partySize}, vehicleClass=${vehicleClass}: available=true, price=$${priceUsd} (${slot.priceCents} cents), tokenExpiresAt=${slot.tokenExpiresAt || "issued"}.`;
        } else {
          verified = false;
          failureReason = "unavailable_for_trip";
          code = "check_seats_at_provider";
          datedApiResponseAt = checkedAt;
          const reason = slot?.unavailableReason || "unavailable";
          statusLabel = `No ${vehicleClass.toUpperCase()} inventory on ${pickupDate} ${pickupTime} (${reason})`;
          whatItProves = `Proves GoSno /api/availability (${targetUrl}) responded HTTP 200 for route=${routeId}, pickupDate=${pickupDate} ${pickupTime}, partySize=${partySize}, vehicleClass=${vehicleClass}, but available=false (${reason}).`;
        }
      } else if (
        response.status === 400 &&
        (payload?.error === "INVALID_PASSENGER_COUNT" || partySize >= 11)
      ) {
        verified = false;
        failureReason = "quote_only_or_capacity_limit";
        code = "check_seats_at_provider";
        datedApiResponseAt = checkedAt;
        statusLabel = `11+ pax (${partySize} pax) capped by /api/availability (HTTP 400 quote-only)`;
        whatItProves = `Proves GoSno /api/availability (${targetUrl}) enforces the 1–10 passenger single-vehicle cap (HTTP 400 ${payload?.error || "INVALID_PASSENGER_COUNT"}: "${payload?.message || "Passenger count must be between 1 and 10."}"); ${partySize}-passenger trips must use /request-quote.`;
      } else {
        verified = false;
        failureReason = response.status === 403 ? "http_403" : "http_error";
        code = "check_seats_at_provider";
        statusLabel = `GoSno /api/availability returned HTTP ${response.status}`;
        whatItProves = `Queried GoSno /api/availability (${targetUrl}) for route=${routeId}, pickupDate=${pickupDate} ${pickupTime}, partySize=${partySize}, vehicleClass=${vehicleClass}: received HTTP ${response.status}${payload?.message ? ` (${payload.message})` : ""}.`;
      }
    } catch (err) {
      const isTimeout =
        err instanceof Error &&
        (err.name === "TimeoutError" ||
          err.name === "AbortError" ||
          /timed?\s*out|aborted/i.test(err.message));
      verified = false;
      failureReason = isTimeout ? "timeout" : "network_error";
      httpStatus = null;
      code = "check_seats_at_provider";
      statusLabel = isTimeout
        ? `GoSno /api/availability timed out (${timeoutMs}ms)`
        : "GoSno /api/availability request failed";
      whatItProves = `Queried GoSno /api/availability (${targetUrl}) at ${checkedAt}: ${err instanceof Error ? err.message : "network error"}.`;
    }

    plannerLiveDisplayCheck = isQuote
      ? {
          verified: true,
          statusLabel: "Planner displays 11+ pax quote-only rule",
          whatItProves:
            "Separate check: /transportation/colorado enforces the 10-passenger single-van cap and routes 11+ passenger groups to GoSno multi-vehicle quote.",
        }
      : {
          verified: false,
          statusLabel: "Separate check: planner displays static reference baseline",
          whatItProves:
            "Whether DCC displays that live /api/availability result in the planner is a separate check: /transportation/colorado currently renders static reference copy ($499 DEN–Vail SUV baseline) and handoff links rather than binding live /api/availability prices directly into the planner UI.",
        };
  } else if (company.providerShortname && product.itemId) {
    const shortname = company.providerShortname;
    const itemId = product.itemId;
    const pickupDate = (params.pickupDate || params.date || "2026-11-18").trim();
    const partySize =
      typeof params.partySize === "number" && Number.isFinite(params.partySize) && params.partySize > 0
        ? Math.floor(params.partySize)
        : 2;

    tripQuery = {
      route: `${shortname}:${itemId}`,
      origin: null,
      destination: company.market,
      pickupDate,
      pickupTime: params.pickupTime || null,
      partySize,
      vehicleClass: null,
    };

    targetUrl = `https://fareharbor.com/api/external/v1/companies/${shortname}/items/${itemId}/minimal/availabilities/date/${pickupDate}/`;

    let wnoHeaders: HeadersInit | null = null;
    if (!params.forceMissingWnoCredentials) {
      try {
        wnoHeaders = getWnoFareHarborHeaders();
      } catch {
        wnoHeaders = null;
      }
    }

    if (!wnoHeaders) {
      verified = false;
      failureReason = "missing_credentials";
      httpStatus = null;
      code = "check_seats_at_fareharbor";
      statusLabel = "Missing WNO FareHarbor API credentials";
      whatItProves = `Cannot query FareHarbor External API v1 for ${shortname} item #${itemId} on ${pickupDate}: WNO FareHarbor credentials (FAREHARBOR_WNO_APP_KEY / FAREHARBOR_WNO_USER_KEY or DCC_FH_API) are missing in this environment.`;
    } else {
      try {
        const response = await fetchFn(targetUrl, {
          method: "GET",
          headers: wnoHeaders,
          signal: AbortSignal.timeout(timeoutMs),
          cache: "no-store",
        });

        httpStatus = response.status;
        const rawText = await response.text().catch(() => "");

        if (response.status === 403) {
          verified = false;
          failureReason = "http_403";
          code = "check_seats_at_fareharbor";
          statusLabel = `HTTP 403 Forbidden from FareHarbor API (${shortname})`;
          whatItProves = `Proves FareHarbor External API v1 (${targetUrl}) returned an actual HTTP 403 Forbidden using WNO credentials for ${shortname} item #${itemId} on ${pickupDate}${rawText ? ` (${rawText.slice(0, 140).trim()})` : ""}. Supplier API read permission is not yet granted; check dates and prices on FareHarbor.`;
        } else if (response.status === 200) {
          let availabilities: Array<Record<string, unknown>> = [];
          try {
            const parsed = JSON.parse(rawText) as {
              availabilities?: Array<Record<string, unknown>>;
            };
            if (Array.isArray(parsed.availabilities)) {
              availabilities = parsed.availabilities;
            }
          } catch {
            availabilities = [];
          }

          datedApiResponseAt = checkedAt;
          if (availabilities.length === 0) {
            verified = false;
            failureReason = "empty_date";
            code = "check_seats_at_fareharbor";
            statusLabel = `Empty date (HTTP 200, 0 departures on ${pickupDate})`;
            whatItProves = `Proves FareHarbor External API v1 (${targetUrl}) authorized WNO credentials with HTTP 200, but returned 0 departures (availabilities: []) for ${shortname} item #${itemId} on ${pickupDate}.`;
          } else {
            verified = true;
            failureReason = null;
            code = "live_seats_verified";
            statusLabel = `Live FareHarbor API verified (HTTP 200, ${availabilities.length} departures on ${pickupDate})`;
            whatItProves = `Proves FareHarbor External API v1 (${targetUrl}) returned HTTP 200 with ${availabilities.length} live departure(s) for ${shortname} item #${itemId} on ${pickupDate} (${partySize} guests).`;
          }
        } else {
          verified = false;
          failureReason = "http_error";
          code = "check_seats_at_fareharbor";
          statusLabel = `FareHarbor API returned HTTP ${response.status}`;
          whatItProves = `Queried FareHarbor External API v1 (${targetUrl}) with WNO credentials for ${shortname} item #${itemId} on ${pickupDate}: received HTTP ${response.status}${rawText ? ` (${rawText.slice(0, 120).trim()})` : ""}.`;
        }
      } catch (err) {
        const isTimeout =
          err instanceof Error &&
          (err.name === "TimeoutError" ||
            err.name === "AbortError" ||
            /timed?\s*out|aborted/i.test(err.message));
        verified = false;
        failureReason = isTimeout ? "timeout" : "network_error";
        httpStatus = null;
        code = "check_seats_at_fareharbor";
        statusLabel = isTimeout
          ? `FareHarbor API timed out (${timeoutMs}ms)`
          : "FareHarbor API network error";
        whatItProves = isTimeout
          ? `Queried FareHarbor External API v1 (${targetUrl}) with WNO credentials for ${shortname} item #${itemId} on ${pickupDate}, but the request timed out after ${timeoutMs}ms.`
          : `Queried FareHarbor External API v1 (${targetUrl}) for ${shortname} item #${itemId} on ${pickupDate}: ${err instanceof Error ? err.message : "network error"}.`;
      }
    }

    plannerLiveDisplayCheck = {
      verified: false,
      statusLabel:
        shortname === "ragincajuntours"
          ? "Fallback active: pre-tax estimates + Check dates and prices on FareHarbor"
          : "Storefront shows static baseline rates + FareHarbor checkout",
      whatItProves:
        shortname === "ragincajuntours"
          ? "Separate planner display check: because live API inventory is unavailable, the storefront labels pre-tax estimates, gates item 228561 Luling meeting point directions, and shows 'Check dates and prices on FareHarbor'."
          : "Separate planner display check: storefront displays baseline catalog rates and routes travelers to FareHarbor checkout to view live calendar seats.",
    };
  }

  const checkRecord: SupplierProductCheckRecord = {
    checkId: `chk_live_inventory_${product.productId}`,
    companyId: company.companyId,
    productId: product.productId,
    productTitle: product.title,
    checkType: "live_inventory",
    checkedAt,
    verified,
    failureReason,
    code,
    statusLabel,
    whatItProves,
    targetUrl,
    httpStatus,
    attributionVerified: product.bookingLinkCheck?.attributionVerified ?? null,
    attributionTag: product.attributionTag || null,
    datedApiResponseAt,
    tripQuery,
    plannerLiveDisplayCheck,
  };

  try {
    const saved = await saveSupplierProductCheckRecord(checkRecord);
    const refreshed = await listPortfolioSupplierConnections();
    const updatedCompany = refreshed.find((c) => c.companyId === company.companyId);

    return {
      ok: true,
      persisted: true,
      status: 200,
      checkRecord: saved,
      companyConnection: updatedCompany,
    };
  } catch (err) {
    return {
      ok: false,
      persisted: false,
      status: 500,
      message:
        err instanceof Error
          ? `Failed to save live inventory check durably: ${err.message}`
          : "Failed to save live inventory check durably.",
      checkRecord,
    };
  }
}
