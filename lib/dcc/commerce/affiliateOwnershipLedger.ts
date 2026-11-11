/**
 * Canonical Affiliate, Money-Route, & Partner-Property Ledger (`lib/dcc/commerce/affiliateOwnershipLedger.ts`)
 *
 * Pure TypeScript, zero `node:fs`, zero database imports.
 *
 * Consolidates commercial truth across the Destination Command Center network:
 *   1. `TRANSACTION_ROUTE_MODELS`: 4 explicit commercial money routes + 1 commission-neutral planning route.
 *   2. `FROZEN_AFFILIATE_IDENTIFIERS`: 8 live provider identifiers frozen against accidental modification.
 *   3. `HELD_COMMERCIAL_SKUS`: 2 held commercial SKUs with explicit unhold prerequisites.
 *   4. `PROTECTED_PARTNER_PROPERTIES`: Independently owned friend/partner properties (`Welcome to Alaska Tours`)
 *      with strict containment and zero-consumer-redirect guardrails.
 */

export type TransactionRouteModelId =
  | "marketplace_affiliate"
  | "dcc_sourced_direct_10pct"
  | "machine_distributed_5pct"
  | "direct_mor"
  | "commission_neutral_planning";

export interface TransactionRouteModelDefinition {
  id: TransactionRouteModelId;
  title: string;
  routeCategory: "commercial" | "neutral_planning";
  targetTakeRateBps: number | null;
  targetTakeRateDisplay: string;
  triggerBasis: "marketplace_settled" | "completed_booking_only" | "direct_operating_margin" | "none";
  liveAuthorizedExternalSupplierCount?: number;
  participatingProperties: readonly string[];
  providersOrChannels: readonly string[];
  influencesFitOrRanking: false;
  liabilityAndSettlementRule: string;
  summary: string;
}

/**
 * 4 explicit commercial money routes + 1 commission-neutral planning route.
 */
export const TRANSACTION_ROUTE_MODELS: readonly TransactionRouteModelDefinition[] = [
  {
    id: "marketplace_affiliate",
    title: "Marketplace Affiliate Referral",
    routeCategory: "commercial",
    targetTakeRateBps: null,
    targetTakeRateDisplay: "Marketplace-set rate (Viator / GetYourGuide / FareHarbor ASN)",
    triggerBasis: "marketplace_settled",
    participatingProperties: [
      "destinationcommandcenter.com",
      "cruisepromenade.com",
      "lastfrontiershoreexcursions.com",
      "juneauflightdeck.com",
      "welcometoneworleanstours.com",
      "welcometotheswamp.com",
      "saveonthestrip.com",
    ],
    providersOrChannels: ["viator", "getyourguide", "fareharbor_asn"],
    influencesFitOrRanking: false,
    liabilityAndSettlementRule:
      "Marketplace sets commission and handles checkout/settlement; preserve each surface's verified frozen affiliate ID and public affiliate disclosure.",
    summary:
      "Marketplace sets commission (Viator, GetYourGuide, FareHarbor ASN); preserve verified affiliate ID & disclosure.",
  },
  {
    id: "dcc_sourced_direct_10pct",
    title: "DCC-Sourced Direct Supplier Booking (10%)",
    routeCategory: "commercial",
    targetTakeRateBps: 1000,
    targetTakeRateDisplay: "10.0% (1000 bps) on completed bookings",
    triggerBasis: "completed_booking_only",
    liveAuthorizedExternalSupplierCount: 0,
    participatingProperties: [
      "destinationcommandcenter.com",
      "welcometotheswamp.com",
      "welcometoneworleanstours.com",
      "juneauflightdeck.com",
      "lastfrontiershoreexcursions.com",
      "welcometothedells.com",
    ],
    providersOrChannels: ["direct_supplier_agreement", "authorized_operator_handoff"],
    influencesFitOrRanking: false,
    liabilityAndSettlementRule:
      "Target 10% (1000 bps) earned on completed bookings ONLY when DCC or an owned specialist acquired the traveler and supplied the decision + direct transaction path. Currently 0 live_authorized external suppliers until a signed supplier agreement is active.",
    summary:
      "Target 10% (1000 bps) on completed bookings only when DCC or an owned specialist acquired the traveler and supplied the decision + direct transaction path (0 live_authorized external suppliers until supplier agreement is signed).",
  },
  {
    id: "machine_distributed_5pct",
    title: "Machine-Distributed Platform Execution (5%)",
    routeCategory: "commercial",
    targetTakeRateBps: 500,
    targetTakeRateDisplay: "5.0% (500 bps) on completed bookings",
    triggerBasis: "completed_booking_only",
    liveAuthorizedExternalSupplierCount: 0,
    participatingProperties: ["destinationcommandcenter.com"],
    providersOrChannels: ["octo_v1_2", "mcp_jsonrpc", "travel_graph_api"],
    influencesFitOrRanking: false,
    liabilityAndSettlementRule:
      "Target 5% (500 bps) DCC platform share on completed bookings when an external AI agent or partner app brought the traveler and DCC supplied structured fit evaluation + authorized transaction execution (0 live_authorized external suppliers today; shadow/handoff mode enforced).",
    summary:
      "Target 5% (500 bps) DCC platform share on completed bookings when an outside AI/app brought the user and DCC supplied structured evaluation + authorized transaction execution.",
  },
  {
    id: "direct_mor",
    title: "Owned Merchant-of-Record Direct Operations",
    routeCategory: "commercial",
    targetTakeRateBps: null,
    targetTakeRateDisplay: "Direct operating product margin (MoR)",
    triggerBasis: "direct_operating_margin",
    participatingProperties: ["gosno.co", "partyatredrocks.com"],
    providersOrChannels: ["square_checkout", "stripe_checkout", "direct_fleet_dispatch"],
    influencesFitOrRanking: false,
    liabilityAndSettlementRule:
      "GoSno (gosno.co) and Party at Red Rocks (partyatredrocks.com) earn direct operating product margin as Merchant of Record. The 5%/10% commission model does NOT apply; customer orders, fulfillment, refunds, and operating liabilities remain strictly isolated from affiliate commission totals.",
    summary:
      "GoSno (gosno.co) and Party at Red Rocks (partyatredrocks.com) earn direct operating product margin as Merchant of Record (5%/10% commission model does NOT apply; orders & liabilities stay isolated).",
  },
  {
    id: "commission_neutral_planning",
    title: "Commission-Neutral Group Planning",
    routeCategory: "neutral_planning",
    targetTakeRateBps: 0,
    targetTakeRateDisplay: "0% organizer commission (commission-neutral)",
    triggerBasis: "none",
    participatingProperties: ["cruisepromenade.com"],
    providersOrChannels: ["shared_cruise_planner", "context_handoff"],
    influencesFitOrRanking: false,
    liabilityAndSettlementRule:
      "Cruise Promenade charges 0% organizer commission by default; port-day fit status and candidate ordering are never influenced by commercial payout.",
    summary:
      "Cruise Promenade (0% organizer commission by default; fit/ranking never influenced by payout).",
  },
] as const;

export type AffiliateIdentifierGovernanceStatus =
  | "frozen_verified_owned"
  | "frozen_legacy_owned_alias"
  | "isolated_partner_unused"
  | "partner_boundary_review_required";

export interface FrozenAffiliateIdentifierRecord {
  id: string;
  provider: "viator" | "fareharbor" | "getyourguide";
  parameterName: "pid" | "asn" | "partner_id";
  assignedSurfaces: readonly string[];
  governanceStatus: AffiliateIdentifierGovernanceStatus;
  immutableInCode: true;
  notes: string;
}

/**
 * 8 live affiliate & partner identifiers frozen across the repository.
 * NEVER alter any of these values without explicit owner sign-off.
 */
export const FROZEN_AFFILIATE_IDENTIFIERS: readonly FrozenAffiliateIdentifierRecord[] = [
  {
    id: "P00058396",
    provider: "viator",
    parameterName: "pid",
    assignedSurfaces: [
      "juneauflightdeck.com",
      "welcometoneworleanstours.com",
      "welcometotheswamp.com",
    ],
    governanceStatus: "frozen_verified_owned",
    immutableInCode: true,
    notes: "Primary specialist Viator PID across Juneau Flight Deck (JFD), Welcome to New Orleans Tours (WNO), and Welcome to the Swamp (WTS).",
  },
  {
    id: "P00306962",
    provider: "viator",
    parameterName: "pid",
    assignedSurfaces: ["destinationcommandcenter.com", "cruisepromenade.com"],
    governanceStatus: "frozen_verified_owned",
    immutableInCode: true,
    notes: "Hub & planner Viator PID for Destination Command Center (DCC) and Cruise Promenade (CP).",
  },
  {
    id: "P00281144",
    provider: "viator",
    parameterName: "pid",
    assignedSurfaces: ["lastfrontiershoreexcursions.com"],
    governanceStatus: "frozen_verified_owned",
    immutableInCode: true,
    notes: "Dedicated Alaska cruise-excursion Viator PID for Last Frontier Shore Excursions (LFSE).",
  },
  {
    id: "aktourcenter",
    provider: "fareharbor",
    parameterName: "asn",
    assignedSurfaces: ["welcometoneworleanstours.com", "destinationcommandcenter.com"],
    governanceStatus: "frozen_verified_owned",
    immutableInCode: true,
    notes: "FareHarbor ASN used on WNO Ragin' Cajun airboat links and DCC FareHarbor handoffs.",
  },
  {
    id: "welcometoneworleanstours",
    provider: "fareharbor",
    parameterName: "asn",
    assignedSurfaces: ["welcometoneworleanstours.com"],
    governanceStatus: "frozen_verified_owned",
    immutableInCode: true,
    notes: "FareHarbor ASN for WNO Steamboat Natchez riverboat links.",
  },
  {
    id: "wtonot-tours",
    provider: "fareharbor",
    parameterName: "asn",
    assignedSurfaces: ["welcometoneworleanstours.com"],
    governanceStatus: "frozen_legacy_owned_alias",
    immutableInCode: true,
    notes: "Legacy FareHarbor ASN alias retained for backward-compatible WNO attribution.",
  },
  {
    id: "welcometoalaskatours",
    provider: "fareharbor",
    parameterName: "asn",
    assignedSurfaces: [],
    governanceStatus: "isolated_partner_unused",
    immutableInCode: true,
    notes:
      "Isolated external partner ASN belonging to friend's independent Welcome to Alaska Tours (WTA) namespace; removed from all owned LFSE/DCC surfaces (0 active boundary leaks).",
  },
  {
    id: "F2MMUUH",
    provider: "getyourguide",
    parameterName: "partner_id",
    assignedSurfaces: [
      "lastfrontiershoreexcursions.com",
      "welcometoneworleanstours.com",
      "cruisepromenade.com",
    ],
    governanceStatus: "frozen_verified_owned",
    immutableInCode: true,
    notes: "GetYourGuide Partner ID across LFSE, WNO, and Cruise Promenade.",
  },
] as const;

export interface HeldCommercialSkuRecord {
  skuSlug: string;
  title: string;
  surfaceCode: "WNO" | "LFSE";
  canonicalDomain: string;
  status: "held";
  holdReason: string;
  unholdPrerequisites: readonly string[];
}

export interface UnheldVerifiedSkuRecord {
  skuSlug: string;
  title: string;
  surfaceCode: "WNO" | "LFSE";
  canonicalDomain: string;
  provider: "getyourguide" | "viator" | "fareharbor";
  productId: string;
  accountId: string;
  unheldAt: string;
  verificationSummary: string;
}

/**
 * Commercial SKUs intentionally held from direct self-serve checkout until verification gates clear.
 */
export const HELD_COMMERCIAL_SKUS: readonly HeldCommercialSkuRecord[] = [
  {
    skuSlug: "jeanlafitte-swamp-tour-with-hotel-pickup",
    title: "Jean Lafitte Swamp Tour with Hotel Pickup",
    surfaceCode: "WNO",
    canonicalDomain: "welcometoneworleanstours.com",
    status: "held",
    holdReason:
      "Direct Jean Lafitte Swamp Tours partner checkout and hotel-shuttle option mapping are held pending operator confirmation.",
    unholdPrerequisites: [
      "Written confirmation from Jean Lafitte Swamp Tours of active FareHarbor/direct partner item ID and ASN payout routing.",
      "Verified French Quarter / CBD hotel-pickup shuttle window mapping against current departure times.",
      "End-to-end live price and seat parity check before re-enabling primary checkout CTA on WNO.",
    ],
  },
  {
    skuSlug: "aleutian-ballad",
    title: "Bering Sea Crab Fishermen's Tour (Aleutian Ballad)",
    surfaceCode: "LFSE",
    canonicalDomain: "lastfrontiershoreexcursions.com",
    status: "held",
    holdReason:
      "Aleutian Ballad direct/affiliate Ketchikan pier-window, Ward Cove shuttle buffer, and GetYourGuide F2MMUUH / t598272 ownership verification remain held pending owner sign-off.",
    unholdPrerequisites: [
      "Confirm current season operating dates and Ward Cove vs. downtown Ketchikan shuttle buffer math.",
      "Owner portal verification of GetYourGuide partner_id=F2MMUUH / t598272 or Viator P00281144 payout attribution.",
      "Explicit owner sign-off before lifting held safeguard on LFSE.",
    ],
  },
] as const;

/**
 * Commercial SKUs cleared from held status with verified exact-product affiliate attribution.
 */
export const UNHELD_VERIFIED_SKUS: readonly UnheldVerifiedSkuRecord[] = [] as const;

export type ProhibitedPartnerAction =
  | "promote_301_redirect"
  | "retire_or_rebrand_domain"
  | "consolidate_affiliate_ids_or_payouts"
  | "migrate_customer_records";

export interface ProtectedPartnerPropertyRecord {
  partnerId: "welcome-to-alaska";
  propertyName: string;
  shortCode: "WTA";
  canonicalDomain: "welcometoalaskatours.com";
  ownership: "friend_independent_partner";
  isOwnedByDcc: false;
  consumerTrafficLinkingAllowed: false;
  activeContainmentDeployment: "dpl_D6yaKKQtgek7iEz4fcbLqSVTCViC";
  stagedContingencyPreviewOnly: "dpl_9Uod58Fs6s5YdP3BJYNaqbGhtC8V";
  checkoutStatus: "503_BOOKINGS_DISABLED";
  prohibitedWithoutPartnerApproval: readonly ProhibitedPartnerAction[];
  guardrailSummary: string;
}

/**
 * Independently owned partner properties protected by strict operational & legal boundaries.
 */
export const PROTECTED_PARTNER_PROPERTIES: readonly ProtectedPartnerPropertyRecord[] = [
  {
    partnerId: "welcome-to-alaska",
    propertyName: "Welcome to Alaska Tours",
    shortCode: "WTA",
    canonicalDomain: "welcometoalaskatours.com",
    ownership: "friend_independent_partner",
    isOwnedByDcc: false,
    consumerTrafficLinkingAllowed: false,
    activeContainmentDeployment: "dpl_D6yaKKQtgek7iEz4fcbLqSVTCViC",
    stagedContingencyPreviewOnly: "dpl_9Uod58Fs6s5YdP3BJYNaqbGhtC8V",
    checkoutStatus: "503_BOOKINGS_DISABLED",
    prohibitedWithoutPartnerApproval: [
      "promote_301_redirect",
      "retire_or_rebrand_domain",
      "consolidate_affiliate_ids_or_payouts",
      "migrate_customer_records",
    ],
    guardrailSummary:
      "Friend-owned independent property · Containment dpl_D6yaKKQtgek7iEz4fcbLqSVTCViC · Checkout 503 · Do not redirect/merge/alter payouts without explicit permission",
  },
] as const;

export interface SiteDefaultProviderAccountConfig {
  viatorPid: string;
  viatorMcid: string;
  fareharborAsn: string;
  gygPartnerId: string;
  primaryRouteModel: TransactionRouteModelId;
}

export const CANONICAL_SITE_PROVIDER_ACCOUNTS: Readonly<
  Record<string, SiteDefaultProviderAccountConfig>
> = {
  "destinationcommandcenter.com": {
    viatorPid: "P00306962",
    viatorMcid: "42383",
    fareharborAsn: "",
    gygPartnerId: "F2MMUUH",
    primaryRouteModel: "marketplace_affiliate",
  },
  "cruisepromenade.com": {
    viatorPid: "P00306962",
    viatorMcid: "42383",
    fareharborAsn: "",
    gygPartnerId: "F2MMUUH",
    primaryRouteModel: "commission_neutral_planning",
  },
  "welcometoneworleanstours.com": {
    viatorPid: "P00058396",
    viatorMcid: "42383",
    fareharborAsn: "aktourcenter",
    gygPartnerId: "F2MMUUH",
    primaryRouteModel: "marketplace_affiliate",
  },
  "welcometotheswamp.com": {
    viatorPid: "P00058396",
    viatorMcid: "42383",
    fareharborAsn: "aktourcenter",
    gygPartnerId: "F2MMUUH",
    primaryRouteModel: "marketplace_affiliate",
  },
  "lastfrontiershoreexcursions.com": {
    viatorPid: "P00281144",
    viatorMcid: "42383",
    fareharborAsn: "",
    gygPartnerId: "F2MMUUH",
    primaryRouteModel: "marketplace_affiliate",
  },
  "juneauflightdeck.com": {
    viatorPid: "P00058396",
    viatorMcid: "42383",
    fareharborAsn: "",
    gygPartnerId: "F2MMUUH",
    primaryRouteModel: "marketplace_affiliate",
  },
  "vibearoundtown.com": {
    viatorPid: "P00058396",
    viatorMcid: "42383",
    fareharborAsn: "vibingaroundtourco",
    gygPartnerId: "F2MMUUH",
    primaryRouteModel: "marketplace_affiliate",
  },
  "gosno.co": {
    viatorPid: "P00058396",
    viatorMcid: "42383",
    fareharborAsn: "gosno",
    gygPartnerId: "F2MMUUH",
    primaryRouteModel: "direct_mor",
  },
  "feastlyspread.com": {
    viatorPid: "P00058396",
    viatorMcid: "42383",
    fareharborAsn: "feastlyspread",
    gygPartnerId: "F2MMUUH",
    primaryRouteModel: "direct_mor",
  },
  "brinkberry.com": {
    viatorPid: "P00058396",
    viatorMcid: "42383",
    fareharborAsn: "brinkberry",
    gygPartnerId: "F2MMUUH",
    primaryRouteModel: "marketplace_affiliate",
  },
  "partyatredrocks.com": {
    viatorPid: "P00058396",
    viatorMcid: "42383",
    fareharborAsn: "partyatredrocks",
    gygPartnerId: "F2MMUUH",
    primaryRouteModel: "direct_mor",
  },
  "420friendlyairportpickup.com": {
    viatorPid: "P00058396",
    viatorMcid: "42383",
    fareharborAsn: "420friendlyairportpickup",
    gygPartnerId: "F2MMUUH",
    primaryRouteModel: "marketplace_affiliate",
  },
} as const;

export function getTransactionRouteModel(
  id: TransactionRouteModelId,
): TransactionRouteModelDefinition {
  const found = TRANSACTION_ROUTE_MODELS.find((r) => r.id === id);
  if (!found) {
    throw new Error(`Unknown TransactionRouteModelId: ${id}`);
  }
  return found;
}

export function getProtectedPartnerProperty(
  partnerIdOrDomain: string,
): ProtectedPartnerPropertyRecord | null {
  const normalized = partnerIdOrDomain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];
  return (
    PROTECTED_PARTNER_PROPERTIES.find(
      (p) =>
        p.partnerId === normalized ||
        p.canonicalDomain === normalized ||
        p.shortCode.toLowerCase() === normalized ||
        normalized === "welcometoalaskatours",
    ) || null
  );
}

export function listPartnerBoundaryReviewItems(): readonly FrozenAffiliateIdentifierRecord[] {
  return FROZEN_AFFILIATE_IDENTIFIERS.filter(
    (item) => item.governanceStatus === "partner_boundary_review_required",
  );
}
