/**
 * Southeast Alaska Fishing Lodges, Basecamps & Private Stays Extension Contract
 * (`lib/dcc/shared/southeastAlaskaFishingLodgesContract.ts`).
 *
 * Composes additively on `regionalDirectoryCoreContract.ts` and
 * `alaskaDirectoryExtensionContract.ts` without forcing lodges into single-day
 * shore-excursion (`SoutheastAlaskaTourProductRecord`) or cruise-sailing
 * (`HostedCruise`) schemas.
 *
 * Core Truthfulness & Governance Invariants:
 *   1. Every published claim requires explicit page-level primary-source evidence
 *      (`LodgeClaimEvidenceRecord`) — a reachable homepage alone never verifies
 *      rates, transfers, ownership, inclusions, or availability.
 *   2. Physical accommodation, operating company, package seller, and partner /
 *      separately arranged activities are modeled as distinct entities. Shared
 *      phone numbers or templates alone never establish common ownership.
 *   3. Unknown or unretrieved facts remain explicitly `"unknown"` — missing
 *      evidence never defaults to `false`, `"included"`, or `"suitable"`.
 *   4. Package pricing, transport operation, and remaining availability are
 *      tracked separately. Unsupported blended "complete trip" totals are never
 *      synthesized; comparisons display published scoped charges alongside items
 *      requiring a direct quote.
 *   5. Operator identity verification (`claimStatus`) is strictly separated from
 *      steward verification of operator-submitted factual claims.
 */

import type {
  AlaskaPrimarySourceCitation,
  AlaskaSourceKind,
} from "./alaskaDirectoryExtensionContract";

export const ALASKA_FISHING_LODGES_CONTRACT_VERSION =
  "dcc.directory.ext.alaska-lodges.v1" as const;

export const UNCLAIMED_LODGE_FACT_SHEET_NOTICE =
  "Free listing researched from official sources. This business has not claimed this page; updates are checked against published sources before appearing here." as const;

export type TriStateFact = "yes" | "no" | "unknown";

export type ProvisionStatus =
  | "included_in_published_package"
  | "extra_charge_published"
  | "extra_charge_quote_required"
  | "arranged_separately_by_guest_or_group"
  | "not_provided"
  | "conflicting_official_pages_confirm"
  | "unknown";

export type SoutheastAlaskaLodgeSubregion =
  | "juneau_admiralty_stephens_passage"
  | "gustavus_glacier_bay_icy_strait"
  | "elfin_cove_cross_sound"
  | "sitka_baranof_island"
  | "petersburg_wrangell_narrows"
  | "ketchikan_revillagigedo_behm_canal"
  | "prince_of_wales_island";

export const SOUTHEAST_ALASKA_LODGE_SUBREGION_LABELS: Readonly<
  Record<SoutheastAlaskaLodgeSubregion, string>
> = {
  juneau_admiralty_stephens_passage: "Juneau, Shelter Island & Admiralty Island",
  gustavus_glacier_bay_icy_strait: "Gustavus & Glacier Bay Gateway",
  elfin_cove_cross_sound: "Elfin Cove & Cross Sound (Chichagof Island)",
  sitka_baranof_island: "Sitka & Baranof Island",
  petersburg_wrangell_narrows: "Petersburg & Wrangell Narrows (Mitkof Island)",
  ketchikan_revillagigedo_behm_canal: "Ketchikan, Clover Passage & Behm Canal",
  prince_of_wales_island: "Prince of Wales Island (Craig & Thorne Bay)",
};

export type LodgeStayFormat =
  | "individual_rooms_or_cabins"
  | "whole_lodge_private_property";

export type LodgeOperationArchetype =
  | "all_inclusive_guided_lodge"
  | "self_guided_or_hybrid_lodge"
  | "modular_lodging_plus_separate_charters"
  | "diy_boat_rental_with_lodging_partner"
  | "whole_property_private_stay_services_separate";

export type PackagePriceState =
  | "published_dated_season_rate"
  | "published_undated_current_rate"
  | "published_starting_from_rate"
  | "quote_required";

export type TransportOperationState =
  | "lodge_operated_or_chartered_transfer"
  | "scheduled_third_party_carrier_corridor"
  | "road_or_local_courtesy_shuttle"
  | "conflicting_official_transfer_pages"
  | "unknown";

export type RemainingAvailabilityState =
  | "not_checked_contact_official_channel"
  | "static_page_note_only_unverified_live"
  | "verified_live_feed";

export type OperatorIdentityClaimStatus =
  | "unclaimed"
  | "claim_pending_identity_review"
  | "identity_verified_operator";

export type FactVerificationStatus =
  | "sourced_from_official_page"
  | "steward_verified_with_evidence"
  | "operator_submitted_pending_steward_review";

// ============================================================================
// 1. ENTITY SEPARATION: ACCOMMODATION vs. OPERATOR vs. SELLER vs. PARTNERS
// ============================================================================

export interface PhysicalAccommodationEntity {
  accommodationId: `accommodation:${string}`;
  propertyName: string;
  propertyKind:
    | "remote_wilderness_lodge"
    | "historic_cannery_resort"
    | "boardwalk_cove_lodge"
    | "waterfront_hotel_and_suites"
    | "road_accessible_fishing_resort"
    | "cabin_resort";
  actualLocationLabel: string;
  streetOrPostalAddress: string | null;
  gatewayPlaceId: string;
  gatewayPublicPortSlug: string;
  gatewayLabel: string;
  communityPlaceId: string | null;
  coordinates: {
    latitude: number;
    longitude: number;
    precisionBasis:
      | "published_on_official_site"
      | "verified_community_or_harbor_anchor";
    coordinateNote: string;
  };
  relationshipToPackageSeller:
    | "same_operating_business"
    | "common_individual_owner_documented_on_official_site"
    | "third_party_partner_lodging"
    | "unknown";
  relationshipExplanation: string;
  roomAndCabinSummary: string;
  bathroomConfiguration:
    | "private_ensuite_documented"
    | "private_or_group_shared_documented"
    | "unknown";
  guestKitchenOrSelfCaterAccess: TriStateFact;
  mealProvisionSummary: string;
  maxConcurrentGuests: number | null;
  groupSizeGuidanceNote: string;
  childrenAndYouthNote: string;
  documentedAccessibilityNote: string;
}

export interface LodgeOperatingCompanyEntity {
  operatorId: `operator:${string}`;
  legalOrDisplayName: string;
  existingLfseOperatorSlug: string | null; // Link ONLY if an indexable LFSE /operators/[slug] page already exists
  separateFromOperatorIds?: readonly `operator:${string}`[];
  separationDisambiguationNote?: string | null;
  legacyOrBuildingAliases?: readonly string[];
  officialWebsite: string;
  officialEmailDomain: string | null;
  officialPhone: string | null;
  ownershipOrHistorySummary: string; // Strictly what is documented on retrieved official pages
  identityClaimStatus: OperatorIdentityClaimStatus;
}

export interface LodgePackageSellerEntity {
  sellerName: string;
  sellerRole:
    | "direct_lodge_operator"
    | "boat_rental_and_package_coordinator"
    | "property_owners_direct_inquiry";
  officialBookingOrInquiryUrl: string;
  primaryCtaLabel: "Check availability" | "Request a quote";
  bookingMechanismSummary: string;
}

export interface PartnerOrSeparateServiceArrangement {
  serviceRole:
    | "charter_or_commuter_air_carrier"
    | "marine_transfer_carrier"
    | "independent_fishing_guides"
    | "chef_catering_or_housekeeping"
    | "gateway_non_fishing_excursions";
  providerName: string;
  existingLfseOperatorSlug?: string | null;
  arrangementType:
    | "arranged_by_lodge_included"
    | "arranged_by_lodge_extra_or_pass_through"
    | "arranged_separately_by_guest_or_group"
    | "contextual_gateway_option";
  details: string;
  officialUrl: string | null;
}

// ============================================================================
// 2. PACKAGES & SCOPED CHARGES (NO SYNTHETIC "COMPLETE TRIP" TOTALS)
// ============================================================================

export interface ScopedAdditionalChargeOrQuoteItem {
  itemLabel: string;
  chargeStatus:
    | "published_rate_separate"
    | "excluded_quote_or_purchase_required"
    | "conflicting_official_pages_confirm"
    | "unknown_confirm_with_seller";
  publishedAmountNote: string | null;
  scopeAndRuleNote: string;
  sourceUrl: string | null;
}

export interface LodgePackageRecord {
  packageId: `pkg:${string}:${string}`;
  lodgeSlug: string;
  packageName: string;
  applicableSeason: "2026" | "2027" | "2028" | "season_not_stated_on_source";
  applicableDatesLabel: string;
  nights: number | null;
  fishingDays: number | null;
  durationSummaryLabel: string;
  occupancyAndSharingBasis: string;
  priceState: PackagePriceState;
  priceAmountUsd: number | null;
  priceDisplayLabel: string; // e.g. "$4,250 / person" or "Call for pricing"
  taxTreatment: "tax_included" | "plus_tax" | "unknown";
  taxDetailNote: string;
  remainingAvailabilityState: RemainingAvailabilityState;
  availabilityNote: string;
  verifiedInclusions: readonly string[];
  knownExclusionsAndAdditionalCharges: readonly ScopedAdditionalChargeOrQuoteItem[];
  ctaLabel: "Check availability" | "Request a quote";
  ctaUrl: string;
  sourceUrl: string;
  retrievedAt: string;
}

// ============================================================================
// 3. FISHING, SCOPED REQUIREMENTS, ACCESS & NON-FISHING OPTIONS
// ============================================================================

export interface ScopedFishingRequirementRecord {
  requirementName: string;
  applicableActivityAndDateScope: string;
  provisionStatus: ProvisionStatus;
  detail: string;
  sourceUrl: string | null;
}

export interface LodgeFishingProgramRecord {
  waterTypes: readonly ("saltwater" | "freshwater")[];
  guidingMode:
    | "guided_only"
    | "self_guided_boats"
    | "hybrid_guided_and_self_guided"
    | "charters_booked_separately"
    | "independent_guides_arranged_separately";
  vesselsAndEquipmentSummary: string;
  targetSpeciesSummary: string;
  seasonalRunNote: string;
  fishProcessingAndBoxesSummary: string;
  scopedRequirements: readonly ScopedFishingRequirementRecord[];
}

export interface LodgeAccessConnectionRecord {
  connectionId: `access:${string}:${number}`;
  gatewayAirportIata: "JNU" | "KTN" | "SIT" | "PSG" | "GST" | "AKW";
  gatewayPlaceId: string;
  gatewayPortSlug: string;
  legTitle: string;
  transferMode:
    | "charter_or_scheduled_floatplane"
    | "wheeled_commuter_aircraft"
    | "lodge_boat_or_catamaran"
    | "ferry_corridor"
    | "road_or_courtesy_van";
  carrierOrDockName: string;
  durationLabel: string;
  provisionStatus: ProvisionStatus;
  transportOperationState: TransportOperationState;
  publishedTransferRateNote: string;
  scopedBaggageAndFreightRule: {
    disclosed: boolean;
    ruleSummary: string; // Never invent weight limits when undisclosed
    applicableServiceScope: string;
    sourceUrl: string | null;
  };
  reportingAndOvernightBufferNote: string;
  sourceUrl: string;
  retrievedAt: string;
}

export interface EcosystemCrossLink {
  label: string;
  href: string;
  surface: "lfse" | "jfd" | "cp";
  relationshipNote: string;
}

export interface LodgeNonFishingContextRecord {
  onSiteUnguidedEquipment: {
    status: "documented_on_official_site" | "not_disclosed_on_retrieved_source";
    summary: string;
  };
  guidedNonFishingExcursions: {
    status:
      | "dedicated_lodge_naturalist_or_eco_program"
      | "custom_boat_wildlife_or_glacier_options"
      | "modular_booked_separately"
      | "arranged_separately_by_group"
      | "not_disclosed_on_retrieved_source";
    summary: string;
  };
  simultaneousNonAnglerActivitiesProven: TriStateFact; // Offering kayaks NEVER proves simultaneous guided non-angler activities!
  simultaneousNonAnglerExplanation: string;
  contextualEcosystemLinks: readonly EcosystemCrossLink[];
}

// ============================================================================
// 4. CLAIM-LEVEL EVIDENCE LEDGER & RECORD ROOT
// ============================================================================

export type LodgeClaimScope =
  | "identity_and_roles"
  | "accommodation_and_capacity"
  | "package_pricing_and_inclusions"
  | "access_and_baggage"
  | "fishing_and_regulations"
  | "non_fishing_options";

export interface LodgeClaimEvidenceRecord {
  claimId: string;
  scope: LodgeClaimScope;
  verificationStatus: FactVerificationStatus;
  applicableSeasonOrDate: string;
  claimSummary: string;
  source: AlaskaPrimarySourceCitation;
  unresolvedOrConflictNote?: string | null;
}

export interface RegionalVisualRepresentation {
  imagePath: string; // Must exist in apps/last-frontier-shore-excursions/public/images/SOURCES.md
  imageAlt: string;
  imageCredit: string;
  isActualPropertyPhoto: false; // Honest labeling: public-domain regional waterway context, not lodge room photo
  visualDisclosureBadge: "Regional scenery; see the lodge’s website for property photos.";
}

export interface SoutheastAlaskaFishingLodgeRecord {
  lodgeId: `lodge:${string}`;
  slug: string;
  displayName: string;
  subRegion: SoutheastAlaskaLodgeSubregion;
  stayFormat: LodgeStayFormat;
  operationArchetype: LodgeOperationArchetype;
  headlineSummary: string;
  accommodation: PhysicalAccommodationEntity;
  operatingCompany: LodgeOperatingCompanyEntity;
  packageSeller: LodgePackageSellerEntity;
  partnerServices: readonly PartnerOrSeparateServiceArrangement[];
  packages: readonly LodgePackageRecord[];
  fishingProgram: LodgeFishingProgramRecord;
  accessConnections: readonly LodgeAccessConnectionRecord[];
  nonFishingContext: LodgeNonFishingContextRecord;
  visualRepresentation: RegionalVisualRepresentation;
  claimEvidence: readonly LodgeClaimEvidenceRecord[];
  unresolvedQuestionsForTraveler: readonly string[];
  verifiedAt: string;
  lastModifiedAt: string;
  explicitHoldReasons?: readonly string[];
}

// ============================================================================
// 5. FAIL-CLOSED PUBLICATION GATE
// ============================================================================

export type LodgePublicationHoldReasonCode =
  | "EXPLICIT_RESEARCH_QUEUE_HOLD"
  | "MISSING_ENTITY_ROLE_SEPARATION"
  | "HOMEPAGE_ONLY_WITHOUT_CLAIM_EVIDENCE"
  | "MISSING_SCOPED_PACKAGE_RECORD"
  | "MISSING_ACCESS_CONNECTION_RECORD"
  | "MISSING_OFFICIAL_DIRECT_CHANNEL";

export interface LodgePublicationGateEvaluation {
  lodgeId: string;
  slug: string;
  publicPath: string;
  publishableInPreviewDirectory: boolean;
  holdReasonCodes: LodgePublicationHoldReasonCode[];
  holdDetails: string[];
  evidenceCount: number;
  distinctSourceUrlCount: number;
}

export function evaluateSoutheastAlaskaLodgePublicationGate(
  lodge: SoutheastAlaskaFishingLodgeRecord,
): LodgePublicationGateEvaluation {
  const holdReasonCodes: LodgePublicationHoldReasonCode[] = [];
  const holdDetails: string[] = [];

  if (lodge.explicitHoldReasons && lodge.explicitHoldReasons.length > 0) {
    holdReasonCodes.push("EXPLICIT_RESEARCH_QUEUE_HOLD");
    holdDetails.push(...lodge.explicitHoldReasons);
  }

  if (
    !lodge.accommodation.propertyName.trim() ||
    !lodge.operatingCompany.legalOrDisplayName.trim() ||
    !lodge.packageSeller.sellerName.trim()
  ) {
    holdReasonCodes.push("MISSING_ENTITY_ROLE_SEPARATION");
    holdDetails.push(
      "Physical accommodation, operating company, and package seller must all be explicitly named.",
    );
  }

  if (
    !/^https?:\/\//i.test(lodge.operatingCompany.officialWebsite) ||
    !/^https?:\/\//i.test(lodge.packageSeller.officialBookingOrInquiryUrl)
  ) {
    holdReasonCodes.push("MISSING_OFFICIAL_DIRECT_CHANNEL");
    holdDetails.push("Missing verified official website or booking/inquiry URL.");
  }

  const distinctUrls = new Set(
    lodge.claimEvidence.map((e) => e.source.url.replace(/\/+$/, "").toLowerCase()),
  );
  if (lodge.claimEvidence.length < 3 || distinctUrls.size < 2) {
    holdReasonCodes.push("HOMEPAGE_ONLY_WITHOUT_CLAIM_EVIDENCE");
    holdDetails.push(
      "Requires at least 3 scoped claim-evidence records across at least 2 retrieved primary-source URLs (a reachable homepage alone is insufficient).",
    );
  }

  if (lodge.packages.length === 0) {
    holdReasonCodes.push("MISSING_SCOPED_PACKAGE_RECORD");
    holdDetails.push("Requires at least 1 scoped package or stay-arrangement record.");
  }

  if (lodge.accessConnections.length === 0) {
    holdReasonCodes.push("MISSING_ACCESS_CONNECTION_RECORD");
    holdDetails.push("Requires at least 1 gateway access connection record.");
  }

  return {
    lodgeId: lodge.lodgeId,
    slug: lodge.slug,
    publicPath: `/southeast-alaska/fishing-lodges/${lodge.slug}`,
    publishableInPreviewDirectory: holdReasonCodes.length === 0,
    holdReasonCodes,
    holdDetails,
    evidenceCount: lodge.claimEvidence.length,
    distinctSourceUrlCount: distinctUrls.size,
  };
}

export function createOfficialCitation(
  label: string,
  url: string,
  checkedAt = "2026-11-19",
  sourceKind: AlaskaSourceKind = "official_operator",
): AlaskaPrimarySourceCitation {
  return {
    label,
    url,
    sourceKind,
    checkedAt,
  };
}
