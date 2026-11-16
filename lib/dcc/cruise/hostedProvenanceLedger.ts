import { neon } from "@neondatabase/serverless";
import { resolveNeonMigrationDatabaseUrl } from "@/lib/dcc/machine/durableStorage";
import {
  FailClosedSigningConfigurationError,
  getActiveV03SigningKey,
  getConfiguredVercelKmsIssuerId,
  getStandardJwksDocument,
  jwsCompactSignEdDsa,
  jwsCompactVerifyEdDsa,
  rfc8785Canonicalize,
  sha256HexFull,
  signJwsCompactViaVercelKmsEs256,
  syncVercelKmsJwksToRegistry,
  type SupportedJwsAlg,
} from "@/lib/dcc/machine/v03/rfc8785AndJws";
import {
  CANONICAL_HOSTED_CRUISE_CONTRACT_VERSION,
  type CanonicalHostedCatalogSnapshot,
  type CanonicalHostedOrganizerFactRecord,
  type CanonicalHostedSailingFactRecord,
} from "./canonicalHostedCruiseContract";
import {
  DCC_CANONICAL_HOSTED_ORGANIZERS,
  DCC_CANONICAL_HOSTED_SAILINGS,
  DCC_RECENT_CATALOG_CHANGE_EVENTS,
} from "./hostedCatalogRegistry";

/**
 * Phase 1 + Phase 2 Foundational Provenance, Append-Only Verification Ledger,
 * Field Authority Matrix, Zero-ID-Recycling Guard, ETag & JWS Snapshot Signing.
 *
 * Core Principles:
 * 1. Verify once, reuse everywhere — never ask another human to repeat completed
 *    verification when the RFC 8785 `verifiedOnceFingerprint` has not changed.
 * 2. Every field has explicit source authority, usage rights, and actor mutation
 *    authority (provider-controlled vs DCC-controlled).
 * 3. Canonical entity IDs (`sailing:...`, `hosted-organizer:...`, `hosted-sailing:...`,
 *    `community:...`) are permanent and never recycled across different entities.
 * 4. Every verification, correction, or rollback appends an immutable hash-chained
 *    event with monotonic cursor support for incremental `?since=` consumers.
 */

export const ZERO_FEE_ORGANIZER_POLICY = {
  policyId: "cp-dcc-hosted-organizer-zero-fee-v1",
  permanent: true,
  listingFeeUsd: 0,
  subscriptionFeeUsd: 0,
  leadFeeUsd: 0,
  cabinSaleCommissionPct: 0,
  paidOrganicRankingBoostWeight: 0,
  directOfficialCabinHandoffOnly: true,
  summary:
    "Permanent $0 Organizer Workspace: $0 listing fee, $0 subscription fee, $0 lead fee, and 0% cabin-sale commission.",
} as const;

export type HostedSourceAuthority =
  | "official_cruise_line"
  | "official_organizer_domain"
  | "verified_organizer_workspace"
  | "dcc_verified_research"
  | "unverified_public_lead";

export type HostedUsageRights =
  | "factual_reference_reusable"
  | "provider_granted_display"
  | "link_only_no_copy"
  | "internal_verification_only";

export const HOSTED_SOURCE_AUTHORITY_DEFINITIONS: Record<
  HostedSourceAuthority,
  { label: string; trustedForIndexation: boolean; description: string }
> = {
  official_cruise_line: {
    label: "Official Cruise Line Schedule",
    trustedForIndexation: true,
    description:
      "Physical vessel, departure date, and port arrival/departure windows verified against official cruise-line schedule data.",
  },
  official_organizer_domain: {
    label: "Official Organizer Public Domain",
    trustedForIndexation: true,
    description:
      "Facts and official booking URLs verified directly on the organizer's official website or reservation portal.",
  },
  verified_organizer_workspace: {
    label: "Verified Organizer Workspace ($0 First-Party)",
    trustedForIndexation: true,
    description:
      "First-party links, descriptions, programming notes, and community settings supplied directly by the verified organizer.",
  },
  dcc_verified_research: {
    label: "DCC Actuarial & Primary-Source Verification",
    trustedForIndexation: true,
    description:
      "Cross-checked by Destination Command Center against primary cruise-line and organizer records.",
  },
  unverified_public_lead: {
    label: "Unverified Public Lead (Held Noindex)",
    trustedForIndexation: false,
    description:
      "Incomplete or unverified lead held from public search indexation until every port day and primary source is verified.",
  },
};

export const HOSTED_USAGE_RIGHTS_DEFINITIONS: Record<
  HostedUsageRights,
  { allowPublicDisplay: boolean; allowCrossProductReuse: boolean; description: string }
> = {
  factual_reference_reusable: {
    allowPublicDisplay: true,
    allowCrossProductReuse: true,
    description:
      "Objective factual schedule, vessel, port, and canonical entity reference reusable across DCC, Cruise Promenade, and RollCallUSA.",
  },
  provider_granted_display: {
    allowPublicDisplay: true,
    allowCrossProductReuse: true,
    description:
      "First-party organizer description, welcome note, or programming text explicitly provided for traveler display.",
  },
  link_only_no_copy: {
    allowPublicDisplay: true,
    allowCrossProductReuse: true,
    description:
      "Outbound URL reference only — never copy third-party logos, organizer photography, or external testimonials without permission.",
  },
  internal_verification_only: {
    allowPublicDisplay: false,
    allowCrossProductReuse: false,
    description:
      "Internal verification notes and redacted claimant audit metadata; never exposed on public pages.",
  },
};

export type HostedFieldMutationAuthority = "provider_or_dcc_owner" | "dcc_only";
export type HostedMutationActorRole = "verified_organizer" | "dcc_owner";

export interface HostedFieldPermissionSpec {
  fieldName: string;
  authority: HostedFieldMutationAuthority;
  defaultSourceAuthority: HostedSourceAuthority;
  defaultUsageRights: HostedUsageRights;
  description: string;
}

export const HOSTED_FIELD_AUTHORITY_MATRIX: Record<string, HostedFieldPermissionSpec> = {
  // Provider-controlled (editable in $0 Organizer Workspace by verified organizer + DCC owner)
  officialWebsiteUrl: {
    fieldName: "officialWebsiteUrl",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "official_organizer_domain",
    defaultUsageRights: "link_only_no_copy",
    description: "Official organizer homepage URL.",
  },
  publicContactPageUrl: {
    fieldName: "publicContactPageUrl",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "official_organizer_domain",
    defaultUsageRights: "link_only_no_copy",
    description: "Official organizer public contact URL.",
  },
  officialSailingPageUrl: {
    fieldName: "officialSailingPageUrl",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "official_organizer_domain",
    defaultUsageRights: "link_only_no_copy",
    description: "Official departure landing page URL on organizer domain.",
  },
  officialReservationFormUrl: {
    fieldName: "officialReservationFormUrl",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "official_organizer_domain",
    defaultUsageRights: "link_only_no_copy",
    description: "Direct cabin reservation / group-block booking form URL.",
  },
  officialItineraryUrl: {
    fieldName: "officialItineraryUrl",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "verified_organizer_workspace",
    defaultUsageRights: "link_only_no_copy",
    description: "Provider-confirmed official group itinerary / event schedule link.",
  },
  officialPolicyUrl: {
    fieldName: "officialPolicyUrl",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "verified_organizer_workspace",
    defaultUsageRights: "link_only_no_copy",
    description: "Provider-confirmed cancellation, deposit, and code-of-conduct policy link.",
  },
  officialReviewUrl: {
    fieldName: "officialReviewUrl",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "verified_organizer_workspace",
    defaultUsageRights: "link_only_no_copy",
    description: "Provider-confirmed external review or testimonial reference link (link-only, never copied).",
  },
  officialSocialLinks: {
    fieldName: "officialSocialLinks",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "verified_organizer_workspace",
    defaultUsageRights: "link_only_no_copy",
    description: "Provider-confirmed official social profile links (Instagram, Facebook, YouTube, TikTok).",
  },
  organizerProvidedDescription: {
    fieldName: "organizerProvidedDescription",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "verified_organizer_workspace",
    defaultUsageRights: "provider_granted_display",
    description: "First-party organizer overview displayed alongside DCC's independent summary.",
  },
  welcomeNote: {
    fieldName: "welcomeNote",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "verified_organizer_workspace",
    defaultUsageRights: "provider_granted_display",
    description: "Organizer welcome note for sailing participants.",
  },
  typicalHostedProgramming: {
    fieldName: "typicalHostedProgramming",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "official_organizer_domain",
    defaultUsageRights: "factual_reference_reusable",
    description: "Organizer-level summary of recurring onboard group programming.",
  },
  announcedHostedProgramming: {
    fieldName: "announcedHostedProgramming",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "official_organizer_domain",
    defaultUsageRights: "factual_reference_reusable",
    description: "Sailing-specific announced hosted events and group programming.",
  },
  programmingSourceUrl: {
    fieldName: "programmingSourceUrl",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "official_organizer_domain",
    defaultUsageRights: "link_only_no_copy",
    description: "Primary source URL supporting announced hosted programming.",
  },
  soloSupportSummary: {
    fieldName: "soloSupportSummary",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "official_organizer_domain",
    defaultUsageRights: "factual_reference_reusable",
    description: "Organizer-level solo-traveler & roommate-matching program summary.",
  },
  soloSupport: {
    fieldName: "soloSupport",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "official_organizer_domain",
    defaultUsageRights: "factual_reference_reusable",
    description: "Sailing-specific solo traveler support details.",
  },
  soloFriendly: {
    fieldName: "soloFriendly",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "official_organizer_domain",
    defaultUsageRights: "factual_reference_reusable",
    description: "Whether solo travelers are explicitly supported.",
  },
  familyPolicy: {
    fieldName: "familyPolicy",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "official_organizer_domain",
    defaultUsageRights: "factual_reference_reusable",
    description: "Adults-only (18+/21+) vs family-friendly policy.",
  },
  cabinAvailabilityStatus: {
    fieldName: "cabinAvailabilityStatus",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "official_organizer_domain",
    defaultUsageRights: "factual_reference_reusable",
    description: "Non-live cabin status classification (always directs shoppers to check official site).",
  },
  cabinAvailabilityNote: {
    fieldName: "cabinAvailabilityNote",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "official_organizer_domain",
    defaultUsageRights: "factual_reference_reusable",
    description: "Cabin reservation guidance note.",
  },
  cabinBlockModelNote: {
    fieldName: "cabinBlockModelNote",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "verified_organizer_workspace",
    defaultUsageRights: "provider_granted_display",
    description: "Explanation of full-ship charter vs group cabin block or credential requirement.",
  },
  inclusionsSummary: {
    fieldName: "inclusionsSummary",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "verified_organizer_workspace",
    defaultUsageRights: "provider_granted_display",
    description: "Provider-confirmed summary of what booking inside the official group block includes.",
  },
  verifiedStartingPriceUsd: {
    fieldName: "verifiedStartingPriceUsd",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "official_organizer_domain",
    defaultUsageRights: "factual_reference_reusable",
    description: "Verified starting per-person USD fare when published by the organizer (null when unverified).",
  },
  verifiedPriceNote: {
    fieldName: "verifiedPriceNote",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "official_organizer_domain",
    defaultUsageRights: "factual_reference_reusable",
    description: "Context note for verified starting price.",
  },
  pinnedHighlights: {
    fieldName: "pinnedHighlights",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "verified_organizer_workspace",
    defaultUsageRights: "provider_granted_display",
    description: "Organizer-pinned shore excursions, group meetups, and private onboard events.",
  },
  pinnedSailingSlugs: {
    fieldName: "pinnedSailingSlugs",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "verified_organizer_workspace",
    defaultUsageRights: "provider_granted_display",
    description: "Organizer-pinned featured hosted sailing slugs shown first on the profile.",
  },
  cabinSellerIdentity: {
    fieldName: "cabinSellerIdentity",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "official_organizer_domain",
    defaultUsageRights: "factual_reference_reusable",
    description: "Verified identity of the official cabin seller / charterer or travel agency of record.",
  },
  officialReservationPathSummary: {
    fieldName: "officialReservationPathSummary",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "official_organizer_domain",
    defaultUsageRights: "factual_reference_reusable",
    description: "Summary of how prospective guests officially reserve cabins in the group or charter.",
  },
  cancellationAndParticipationPolicy: {
    fieldName: "cancellationAndParticipationPolicy",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "official_organizer_domain",
    defaultUsageRights: "factual_reference_reusable",
    description: "Verified summary of deposit, cancellation, age, or group participation policy.",
  },
  publicReviewProfileLinks: {
    fieldName: "publicReviewProfileLinks",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "official_organizer_domain",
    defaultUsageRights: "link_only_no_copy",
    description: "Publicly authorized external review-profile links (link-only, never scraped or copied).",
  },
  membershipMode: {
    fieldName: "membershipMode",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "verified_organizer_workspace",
    defaultUsageRights: "factual_reference_reusable",
    description: "Post-claim group community access gate (open link, approval, invite code, verified member).",
  },
  accessibilitySummary: {
    fieldName: "accessibilitySummary",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "official_organizer_domain",
    defaultUsageRights: "factual_reference_reusable",
    description: "Accessibility, mobility, ASL, and special-assistance disclosure.",
  },
  officialAccessibilityUrl: {
    fieldName: "officialAccessibilityUrl",
    authority: "provider_or_dcc_owner",
    defaultSourceAuthority: "official_organizer_domain",
    defaultUsageRights: "link_only_no_copy",
    description: "Official accessibility policy or accommodation questionnaire link.",
  },

  // DCC-controlled (strictly immutable by organizers; editorial & canonical integrity boundary)
  organizerType: {
    fieldName: "organizerType",
    authority: "dcc_only",
    defaultSourceAuthority: "dcc_verified_research",
    defaultUsageRights: "factual_reference_reusable",
    description: "Canonical organizer entity type (e.g. independent charter vs cruise-line-produced program).",
  },
  primaryClassification: {
    fieldName: "primaryClassification",
    authority: "dcc_only",
    defaultSourceAuthority: "dcc_verified_research",
    defaultUsageRights: "factual_reference_reusable",
    description: "DCC-verified primary classification across the 5 hosted-cruise categories.",
  },
  experienceClassification: {
    fieldName: "experienceClassification",
    authority: "dcc_only",
    defaultSourceAuthority: "dcc_verified_research",
    defaultUsageRights: "factual_reference_reusable",
    description: "DCC-verified sailing classification across the 5 hosted-cruise categories.",
  },
  subBrands: {
    fieldName: "subBrands",
    authority: "dcc_only",
    defaultSourceAuthority: "dcc_verified_research",
    defaultUsageRights: "factual_reference_reusable",
    description: "DCC-verified program / sub-brand hierarchy (e.g. GayNudeSail under GaySail).",
  },
  departureAnnouncementStatus: {
    fieldName: "departureAnnouncementStatus",
    authority: "dcc_only",
    defaultSourceAuthority: "dcc_verified_research",
    defaultUsageRights: "factual_reference_reusable",
    description: "DCC-verified upcoming departure announcement state.",
  },
  verificationState: {
    fieldName: "verificationState",
    authority: "dcc_only",
    defaultSourceAuthority: "dcc_verified_research",
    defaultUsageRights: "factual_reference_reusable",
    description: "DCC primary-source verification state.",
  },
  organizerId: {
    fieldName: "organizerId",
    authority: "dcc_only",
    defaultSourceAuthority: "dcc_verified_research",
    defaultUsageRights: "factual_reference_reusable",
    description: "Permanent canonical organizer entity ID (hosted-organizer:<slug>).",
  },
  reputationEntityId: {
    fieldName: "reputationEntityId",
    authority: "dcc_only",
    defaultSourceAuthority: "dcc_verified_research",
    defaultUsageRights: "factual_reference_reusable",
    description: "Reputation Graph compatible organizer entity ID (rep:hosted-organizer:<slug>).",
  },
  reputationSailingEntityId: {
    fieldName: "reputationSailingEntityId",
    authority: "dcc_only",
    defaultSourceAuthority: "dcc_verified_research",
    defaultUsageRights: "factual_reference_reusable",
    description: "Reputation Graph compatible hosted-sailing entity ID (rep:hosted-sailing:<org>:<sailing>).",
  },
  knownBrandAliases: {
    fieldName: "knownBrandAliases",
    authority: "dcc_only",
    defaultSourceAuthority: "dcc_verified_research",
    defaultUsageRights: "factual_reference_reusable",
    description: "Verified brand, series, or co-host aliases associated with this canonical organizer.",
  },
  hostedSailingId: {
    fieldName: "hostedSailingId",
    authority: "dcc_only",
    defaultSourceAuthority: "dcc_verified_research",
    defaultUsageRights: "factual_reference_reusable",
    description: "Permanent canonical hosted-sailing entity ID.",
  },
  physicalSailingId: {
    fieldName: "physicalSailingId",
    authority: "dcc_only",
    defaultSourceAuthority: "official_cruise_line",
    defaultUsageRights: "factual_reference_reusable",
    description: "Canonical physical ship/date schedule ID (sailing:<line>:<ship>:<date>).",
  },
  communityId: {
    fieldName: "communityId",
    authority: "dcc_only",
    defaultSourceAuthority: "dcc_verified_research",
    defaultUsageRights: "factual_reference_reusable",
    description: "Canonical private community scope ID.",
  },
  organizerSlug: {
    fieldName: "organizerSlug",
    authority: "dcc_only",
    defaultSourceAuthority: "dcc_verified_research",
    defaultUsageRights: "factual_reference_reusable",
    description: "Canonical URL slug for the organizer.",
  },
  aliases: {
    fieldName: "aliases",
    authority: "dcc_only",
    defaultSourceAuthority: "dcc_verified_research",
    defaultUsageRights: "factual_reference_reusable",
    description: "Historical/alternate organizer slugs permanently 308-redirected to organizerSlug.",
  },
  canonicalLineCode: {
    fieldName: "canonicalLineCode",
    authority: "dcc_only",
    defaultSourceAuthority: "official_cruise_line",
    defaultUsageRights: "factual_reference_reusable",
    description: "Canonical cruise line code.",
  },
  canonicalShipSlug: {
    fieldName: "canonicalShipSlug",
    authority: "dcc_only",
    defaultSourceAuthority: "official_cruise_line",
    defaultUsageRights: "factual_reference_reusable",
    description: "Canonical vessel slug.",
  },
  canonicalSailDate: {
    fieldName: "canonicalSailDate",
    authority: "dcc_only",
    defaultSourceAuthority: "official_cruise_line",
    defaultUsageRights: "factual_reference_reusable",
    description: "Canonical departure date (YYYY-MM-DD).",
  },
  independentSummary: {
    fieldName: "independentSummary",
    authority: "dcc_only",
    defaultSourceAuthority: "dcc_verified_research",
    defaultUsageRights: "factual_reference_reusable",
    description: "Neutral DCC editorial summary; claiming never overwrites independent context.",
  },
  nonAffiliationNotice: {
    fieldName: "nonAffiliationNotice",
    authority: "dcc_only",
    defaultSourceAuthority: "dcc_verified_research",
    defaultUsageRights: "factual_reference_reusable",
    description: "Mandatory traveler disclosure distinguishing independent vs claimed status.",
  },
  cabinBookingPolicyNote: {
    fieldName: "cabinBookingPolicyNote",
    authority: "dcc_only",
    defaultSourceAuthority: "dcc_verified_research",
    defaultUsageRights: "factual_reference_reusable",
    description: "Mandatory cabin-booking handoff policy notice.",
  },
  scheduleHoldReason: {
    fieldName: "scheduleHoldReason",
    authority: "dcc_only",
    defaultSourceAuthority: "dcc_verified_research",
    defaultUsageRights: "internal_verification_only",
    description: "Fail-closed indexation hold reason when any port window or source awaits verification.",
  },
  isIndexable: {
    fieldName: "isIndexable",
    authority: "dcc_only",
    defaultSourceAuthority: "dcc_verified_research",
    defaultUsageRights: "factual_reference_reusable",
    description: "Search-engine indexation eligibility gate.",
  },
  organicRankingScore: {
    fieldName: "organicRankingScore",
    authority: "dcc_only",
    defaultSourceAuthority: "dcc_verified_research",
    defaultUsageRights: "factual_reference_reusable",
    description: "Zero-commercial-weight organic ranking calculation.",
  },
  reviewRatingsAndText: {
    fieldName: "reviewRatingsAndText",
    authority: "dcc_only",
    defaultSourceAuthority: "dcc_verified_research",
    defaultUsageRights: "factual_reference_reusable",
    description: "Traveler-submitted review scores and text (organizers may respond, never alter or hide).",
  },
  reviewModerationStatus: {
    fieldName: "reviewModerationStatus",
    authority: "dcc_only",
    defaultSourceAuthority: "dcc_verified_research",
    defaultUsageRights: "internal_verification_only",
    description: "Independent moderation state.",
  },
};

export class HostedFieldPermissionDeniedError extends Error {
  public readonly code = "DCC_CONTROLLED_FIELD_IMMUTABLE";
  public readonly statusCode = 403;
  constructor(message: string) {
    super(message);
    this.name = "HostedFieldPermissionDeniedError";
  }
}

export class HostedIdentifierRecyclingForbiddenError extends Error {
  public readonly code = "CANONICAL_ENTITY_ID_RECYCLING_FORBIDDEN";
  constructor(message: string) {
    super(message);
    this.name = "HostedIdentifierRecyclingForbiddenError";
  }
}

export function assertHostedFieldMutationPermitted(
  actorRole: HostedMutationActorRole,
  fieldName: string,
): HostedFieldPermissionSpec {
  const spec = HOSTED_FIELD_AUTHORITY_MATRIX[fieldName];
  if (!spec) {
    throw new HostedFieldPermissionDeniedError(
      `DCC_CONTROLLED_FIELD_IMMUTABLE: Unknown or unpermitted hosted field "${fieldName}".`,
    );
  }
  if (actorRole === "verified_organizer" && spec.authority !== "provider_or_dcc_owner") {
    throw new HostedFieldPermissionDeniedError(
      `DCC_CONTROLLED_FIELD_IMMUTABLE: Field "${fieldName}" is DCC-controlled (${spec.description}) and cannot be modified by an organizer workspace.`,
    );
  }
  return spec;
}

/**
 * Normalizes arbitrary JS values into strict RFC 7493 I-JSON (omitting `undefined` object keys)
 * before computing RFC 8785 canonical fingerprints.
 */
export function normalizeToStrictIJson(value: unknown): unknown {
  if (value === undefined || value === null) return null;
  if (typeof value === "boolean" || typeof value === "string") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeToStrictIJson(item));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = normalizeToStrictIJson(v);
      }
    }
    return out;
  }
  return String(value);
}

export interface HostedFieldProvenance {
  suppliedBy: string;
  suppliedAt: string;
  sourceAuthority: HostedSourceAuthority;
  usageRights: HostedUsageRights;
  dccVerified: boolean;
  lastCheckedAt: string;
  verifiedOnceFingerprint: string;
}

export function computeVerifiedOnceFingerprint(
  entityId: string,
  fieldName: string,
  value: unknown,
): string {
  const canonical = rfc8785Canonicalize({
    entityId,
    fieldName,
    value: normalizeToStrictIJson(value),
  });
  return sha256HexFull(canonical);
}

export function evaluateVerifyOnceReuse(params: {
  entityId: string;
  fieldName: string;
  candidateValue: unknown;
  existingProvenance?: HostedFieldProvenance | null;
}): {
  requiresHumanVerification: boolean;
  reusedExistingVerification: boolean;
  verifiedOnceFingerprint: string;
  reason:
    | "already_verified_fingerprint_match"
    | "missing_prior_verification"
    | "prior_record_unverified"
    | "material_value_changed";
} {
  const candidateFp = computeVerifiedOnceFingerprint(
    params.entityId,
    params.fieldName,
    params.candidateValue,
  );
  if (!params.existingProvenance) {
    return {
      requiresHumanVerification: true,
      reusedExistingVerification: false,
      verifiedOnceFingerprint: candidateFp,
      reason: "missing_prior_verification",
    };
  }
  if (!params.existingProvenance.dccVerified) {
    return {
      requiresHumanVerification: true,
      reusedExistingVerification: false,
      verifiedOnceFingerprint: candidateFp,
      reason: "prior_record_unverified",
    };
  }
  if (params.existingProvenance.verifiedOnceFingerprint === candidateFp) {
    return {
      requiresHumanVerification: false,
      reusedExistingVerification: true,
      verifiedOnceFingerprint: candidateFp,
      reason: "already_verified_fingerprint_match",
    };
  }
  return {
    requiresHumanVerification: true,
    reusedExistingVerification: false,
    verifiedOnceFingerprint: candidateFp,
    reason: "material_value_changed",
  };
}

// ============================================================================
// Permanent Canonical Identifier Registry (Zero ID Recycling + Alias Resolution)
// ============================================================================

export interface AllocatedCanonicalEntityIdentifier {
  entityId: string;
  entityKind: "physical_sailing" | "hosted_organizer" | "hosted_sailing" | "private_community";
  bindingSignature: string;
  status: "active" | "retired_never_recycle";
  allocatedAt: string;
  retiredAt?: string;
}

export class HostedCanonicalIdentifierRegistry {
  private readonly allocated = new Map<string, AllocatedCanonicalEntityIdentifier>();
  private readonly aliasToOrganizerId = new Map<string, string>();

  constructor(seedFromCanonicalCatalog = true) {
    if (seedFromCanonicalCatalog) {
      for (const org of DCC_CANONICAL_HOSTED_ORGANIZERS) {
        this.registerEntityId({
          entityId: org.organizerId,
          entityKind: "hosted_organizer",
          bindingSignature: `org:${org.organizerSlug.toLowerCase()}|domain:${org.officialDomain.toLowerCase()}`,
          allocatedAt: org.verifiedSourceCheckedAt,
        });
        this.registerOrganizerAlias(org.organizerSlug, org.organizerId);
        for (const alias of org.aliases) {
          this.registerOrganizerAlias(alias, org.organizerId);
        }
      }
      for (const hs of DCC_CANONICAL_HOSTED_SAILINGS) {
        this.registerEntityId({
          entityId: hs.physicalSailingId,
          entityKind: "physical_sailing",
          bindingSignature: `ship:${hs.canonicalLineCode}:${hs.canonicalShipSlug}:${hs.canonicalSailDate}`,
          allocatedAt: hs.organizerSourceCheckedAt,
        });
        this.registerEntityId({
          entityId: hs.hostedSailingId,
          entityKind: "hosted_sailing",
          bindingSignature: `hosted:${hs.organizerSlug}:${hs.physicalSailingId}`,
          allocatedAt: hs.organizerSourceCheckedAt,
        });
        const communityId = `community:${hs.organizerSlug}:${hs.canonicalShipSlug}:${hs.canonicalSailDate}`;
        this.registerEntityId({
          entityId: communityId,
          entityKind: "private_community",
          bindingSignature: `comm:${hs.organizerSlug}:${hs.canonicalShipSlug}:${hs.canonicalSailDate}`,
          allocatedAt: hs.organizerSourceCheckedAt,
        });
      }
    }
  }

  registerEntityId(input: {
    entityId: string;
    entityKind: AllocatedCanonicalEntityIdentifier["entityKind"];
    bindingSignature: string;
    allocatedAt?: string;
  }): AllocatedCanonicalEntityIdentifier {
    const existing = this.allocated.get(input.entityId);
    if (existing) {
      if (existing.status === "retired_never_recycle") {
        throw new HostedIdentifierRecyclingForbiddenError(
          `CANONICAL_ENTITY_ID_RECYCLING_FORBIDDEN: Identifier "${input.entityId}" was retired at ${existing.retiredAt} and may never be recycled.`,
        );
      }
      if (existing.bindingSignature !== input.bindingSignature) {
        throw new HostedIdentifierRecyclingForbiddenError(
          `CANONICAL_ENTITY_ID_RECYCLING_FORBIDDEN: Identifier "${input.entityId}" is permanently bound to "${existing.bindingSignature}" and cannot be reassigned to "${input.bindingSignature}".`,
        );
      }
      return existing;
    }
    const created: AllocatedCanonicalEntityIdentifier = Object.freeze({
      entityId: input.entityId,
      entityKind: input.entityKind,
      bindingSignature: input.bindingSignature,
      status: "active",
      allocatedAt: input.allocatedAt ?? new Date().toISOString(),
    });
    this.allocated.set(input.entityId, created);
    return created;
  }

  retireEntityIdPermanently(entityId: string, retiredAt = new Date().toISOString()): void {
    const existing = this.allocated.get(entityId);
    if (!existing) {
      throw new Error(`Cannot retire unallocated canonical ID "${entityId}".`);
    }
    this.allocated.set(
      entityId,
      Object.freeze({
        ...existing,
        status: "retired_never_recycle",
        retiredAt,
      }),
    );
  }

  registerOrganizerAlias(aliasOrSlug: string, organizerId: string): void {
    const clean = aliasOrSlug.trim().toLowerCase();
    const existing = this.aliasToOrganizerId.get(clean);
    if (existing && existing !== organizerId) {
      throw new HostedIdentifierRecyclingForbiddenError(
        `CANONICAL_ENTITY_ID_RECYCLING_FORBIDDEN: Organizer slug/alias "${clean}" is permanently bound to "${existing}" and cannot be reassigned to "${organizerId}".`,
      );
    }
    this.aliasToOrganizerId.set(clean, organizerId);
  }

  resolveOrganizerId(slugOrAlias: string): string | null {
    return this.aliasToOrganizerId.get(slugOrAlias.trim().toLowerCase()) ?? null;
  }

  getSummaryCounts() {
    let active = 0;
    let retired = 0;
    for (const item of this.allocated.values()) {
      if (item.status === "active") active += 1;
      else retired += 1;
    }
    return {
      totalAllocated: this.allocated.size,
      active,
      retiredNeverRecycle: retired,
      registeredOrganizerSlugsAndAliases: this.aliasToOrganizerId.size,
    };
  }
}

// ============================================================================
// Append-Only Verification, Correction & Material-Change Ledger
// ============================================================================

export type HostedProvenanceEventType =
  | "baseline_verification"
  | "field_verified"
  | "provider_field_updated"
  | "material_schedule_change"
  | "correction_applied"
  | "rollback_applied";

export interface HostedProvenanceLedgerEvent {
  cursor: number;
  cursorToken: string; // dcc-hc-cur-<cursor>
  eventId: string;
  eventType: HostedProvenanceEventType;
  occurredAt: string;
  actorRole: HostedMutationActorRole;
  suppliedBy: string;
  sourceAuthority: HostedSourceAuthority;
  usageRights: HostedUsageRights;
  entityType: "physical_sailing" | "hosted_organizer" | "hosted_sailing";
  entityId: string;
  changedFields: ReadonlyArray<string>;
  beforeValues: Record<string, unknown>;
  afterValues: Record<string, unknown>;
  fieldFingerprints: Record<string, string>;
  dccVerified: boolean;
  preservesCommunityIdentity: true;
  rolledBackEventId?: string;
  summary: string;
  prevEventHash: string;
  eventHash: string;
}

export function formatHostedLedgerCursor(cursor: number): string {
  return `dcc-hc-cur-${Math.max(0, Math.trunc(cursor))}`;
}

export function parseHostedLedgerCursor(raw: string | null | undefined): number {
  if (!raw || !raw.trim()) return 0;
  const clean = raw.trim();
  if (/^\d+$/.test(clean)) {
    return Number.parseInt(clean, 10);
  }
  const m = clean.match(/^dcc-hc-cur-(\d+)$/i);
  if (m && m[1]) {
    return Number.parseInt(m[1], 10);
  }
  throw new TypeError(`Invalid hosted-catalog cursor "${raw}". Expected integer or dcc-hc-cur-<N>.`);
}

function computeLedgerEventHash(
  core: Omit<HostedProvenanceLedgerEvent, "eventHash">,
): string {
  return sha256HexFull(rfc8785Canonicalize(normalizeToStrictIJson(core)));
}

export class HostedCatalogProvenanceLedger {
  private readonly events: HostedProvenanceLedgerEvent[] = [];
  private readonly latestFieldProvenance = new Map<string, HostedFieldProvenance>();
  private neonEnsured = false;

  constructor(seedBaseline = true) {
    if (seedBaseline) {
      for (const seed of DCC_RECENT_CATALOG_CHANGE_EVENTS) {
        this.appendEventSync({
          eventId: seed.eventId,
          eventType: "baseline_verification",
          occurredAt: seed.occurredAt,
          actorRole: "dcc_owner",
          suppliedBy: "dcc:catalog-research",
          sourceAuthority:
            seed.entityType === "physical_sailing"
              ? "official_cruise_line"
              : "dcc_verified_research",
          usageRights: "factual_reference_reusable",
          entityType: seed.entityType,
          entityId: seed.entityId,
          changedFields: ["schedule_and_source_verification"],
          beforeValues: {},
          afterValues: { verified: true },
          dccVerified: true,
          summary: seed.summary,
        });
      }
    }
  }

  appendEventSync(input: {
    eventId?: string;
    eventType: HostedProvenanceEventType;
    occurredAt?: string;
    actorRole: HostedMutationActorRole;
    suppliedBy: string;
    sourceAuthority: HostedSourceAuthority;
    usageRights: HostedUsageRights;
    entityType: "physical_sailing" | "hosted_organizer" | "hosted_sailing";
    entityId: string;
    changedFields: string[];
    beforeValues: Record<string, unknown>;
    afterValues: Record<string, unknown>;
    dccVerified: boolean;
    rolledBackEventId?: string;
    summary: string;
  }): HostedProvenanceLedgerEvent {
    if (input.changedFields.length === 0) {
      throw new TypeError("Ledger event must list at least one changed or verified field.");
    }
    for (const field of input.changedFields) {
      if (field !== "schedule_and_source_verification") {
        assertHostedFieldMutationPermitted(input.actorRole, field);
      }
    }

    const cursor = this.events.length + 1;
    const cursorToken = formatHostedLedgerCursor(cursor);
    const occurredAt = input.occurredAt ?? new Date().toISOString();
    const prevEventHash =
      cursor === 1 ? "GENESIS_DCC_HOSTED_CATALOG_LEDGER_V1" : this.events[cursor - 2]!.eventHash;

    const cleanBefore = normalizeToStrictIJson(input.beforeValues) as Record<string, unknown>;
    const cleanAfter = normalizeToStrictIJson(input.afterValues) as Record<string, unknown>;

    const fieldFingerprints: Record<string, string> = {};
    for (const field of input.changedFields) {
      const val = field in cleanAfter ? cleanAfter[field] : null;
      const fp = computeVerifiedOnceFingerprint(input.entityId, field, val);
      fieldFingerprints[field] = fp;
      this.latestFieldProvenance.set(`${input.entityId}::${field}`, {
        suppliedBy: input.suppliedBy,
        suppliedAt: occurredAt,
        sourceAuthority: input.sourceAuthority,
        usageRights: input.usageRights,
        dccVerified: input.dccVerified,
        lastCheckedAt: occurredAt,
        verifiedOnceFingerprint: fp,
      });
    }

    const eventId =
      input.eventId ||
      `dcc-hc-evt-${cursor}-${sha256HexFull(`${input.entityId}:${occurredAt}:${cursor}`).slice(0, 12)}`;

    const unsignedEvent: Omit<HostedProvenanceLedgerEvent, "eventHash"> = {
      cursor,
      cursorToken,
      eventId,
      eventType: input.eventType,
      occurredAt,
      actorRole: input.actorRole,
      suppliedBy: input.suppliedBy,
      sourceAuthority: input.sourceAuthority,
      usageRights: input.usageRights,
      entityType: input.entityType,
      entityId: input.entityId,
      changedFields: Object.freeze([...input.changedFields]),
      beforeValues: cleanBefore,
      afterValues: cleanAfter,
      fieldFingerprints,
      dccVerified: input.dccVerified,
      preservesCommunityIdentity: true,
      ...(input.rolledBackEventId ? { rolledBackEventId: input.rolledBackEventId } : {}),
      summary: input.summary,
      prevEventHash,
    };

    const eventHash = computeLedgerEventHash(unsignedEvent);
    const finalized: HostedProvenanceLedgerEvent = Object.freeze({
      ...unsignedEvent,
      eventHash,
    });

    this.events.push(finalized);
    return finalized;
  }

  async appendEventDurable(
    input: Parameters<HostedCatalogProvenanceLedger["appendEventSync"]>[0],
  ): Promise<HostedProvenanceLedgerEvent> {
    const ev = this.appendEventSync(input);
    await this.persistEventToNeonIfConfigured(ev);
    return ev;
  }

  rollbackEventSync(params: {
    targetEventId: string;
    actorRole: HostedMutationActorRole;
    suppliedBy: string;
    occurredAt?: string;
    reason?: string;
  }): HostedProvenanceLedgerEvent {
    const target = this.events.find((e) => e.eventId === params.targetEventId);
    if (!target) {
      throw new TypeError(`Ledger event "${params.targetEventId}" not found.`);
    }
    return this.appendEventSync({
      eventType: "rollback_applied",
      occurredAt: params.occurredAt,
      actorRole: params.actorRole,
      suppliedBy: params.suppliedBy,
      sourceAuthority:
        params.actorRole === "verified_organizer"
          ? "verified_organizer_workspace"
          : "dcc_verified_research",
      usageRights: target.usageRights,
      entityType: target.entityType,
      entityId: target.entityId,
      changedFields: [...target.changedFields],
      beforeValues: target.afterValues,
      afterValues: target.beforeValues,
      dccVerified: true,
      rolledBackEventId: target.eventId,
      summary:
        params.reason ||
        `Rolled back ${target.eventId} (${target.changedFields.join(", ")}) while preserving append-only history.`,
    });
  }

  verifyHashChainIntegrity(): { valid: boolean; checkedCount: number; brokenAtCursor?: number } {
    for (let i = 0; i < this.events.length; i++) {
      const ev = this.events[i]!;
      const expectedPrev =
        i === 0 ? "GENESIS_DCC_HOSTED_CATALOG_LEDGER_V1" : this.events[i - 1]!.eventHash;
      if (ev.prevEventHash !== expectedPrev) {
        return { valid: false, checkedCount: i + 1, brokenAtCursor: ev.cursor };
      }
      const { eventHash, ...rest } = ev;
      const recomputed = computeLedgerEventHash(rest);
      if (recomputed !== eventHash) {
        return { valid: false, checkedCount: i + 1, brokenAtCursor: ev.cursor };
      }
    }
    return { valid: true, checkedCount: this.events.length };
  }

  getLatestCursor(): number {
    return this.events.length;
  }

  getLatestCursorToken(): string {
    return formatHostedLedgerCursor(this.events.length);
  }

  getAllEvents(): ReadonlyArray<HostedProvenanceLedgerEvent> {
    return this.events;
  }

  getFieldProvenanceOverride(entityId: string, fieldName: string): HostedFieldProvenance | null {
    return this.latestFieldProvenance.get(`${entityId}::${fieldName}`) ?? null;
  }

  getIncrementalChangesSince(sinceCursorRaw?: string | null): {
    sinceCursor: number;
    sinceCursorToken: string;
    latestCursor: number;
    latestCursorToken: string;
    upToDate: boolean;
    events: ReadonlyArray<HostedProvenanceLedgerEvent>;
  } {
    const sinceCursor = parseHostedLedgerCursor(sinceCursorRaw);
    const latestCursor = this.getLatestCursor();
    const slice = sinceCursor >= latestCursor ? [] : this.events.slice(sinceCursor);
    return {
      sinceCursor,
      sinceCursorToken: formatHostedLedgerCursor(sinceCursor),
      latestCursor,
      latestCursorToken: formatHostedLedgerCursor(latestCursor),
      upToDate: slice.length === 0,
      events: slice,
    };
  }

  private async persistEventToNeonIfConfigured(ev: HostedProvenanceLedgerEvent): Promise<void> {
    let conn: string | undefined;
    try {
      conn = resolveNeonMigrationDatabaseUrl();
    } catch {
      conn = undefined;
    }
    if (!conn) return;
    try {
      const sql = neon(conn);
      if (!this.neonEnsured) {
        await (sql as any).query(`
          CREATE TABLE IF NOT EXISTS dcc_hosted_cruise_provenance_ledger (
            cursor_seq INTEGER PRIMARY KEY,
            event_id TEXT NOT NULL UNIQUE,
            event_type TEXT NOT NULL,
            occurred_at TIMESTAMPTZ NOT NULL,
            actor_role TEXT NOT NULL,
            supplied_by TEXT NOT NULL,
            source_authority TEXT NOT NULL,
            usage_rights TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            payload JSONB NOT NULL,
            prev_event_hash TEXT NOT NULL,
            event_hash TEXT NOT NULL
          )
        `);
        await (sql as any).query(`
          CREATE OR REPLACE FUNCTION dcc_prevent_hosted_provenance_mutation()
          RETURNS TRIGGER AS $$
          BEGIN
            RAISE EXCEPTION 'dcc_hosted_cruise_provenance_ledger is strictly append-only';
          END;
          $$ LANGUAGE plpgsql
        `);
        await (sql as any).query(`
          DROP TRIGGER IF EXISTS trg_dcc_hosted_provenance_append_only ON dcc_hosted_cruise_provenance_ledger
        `);
        await (sql as any).query(`
          CREATE TRIGGER trg_dcc_hosted_provenance_append_only
          BEFORE UPDATE OR DELETE ON dcc_hosted_cruise_provenance_ledger
          FOR EACH ROW EXECUTE FUNCTION dcc_prevent_hosted_provenance_mutation()
        `);
        this.neonEnsured = true;
      }
      await (sql as any).query(
        `INSERT INTO dcc_hosted_cruise_provenance_ledger (
          cursor_seq, event_id, event_type, occurred_at, actor_role, supplied_by,
          source_authority, usage_rights, entity_type, entity_id, payload,
          prev_event_hash, event_hash
        ) VALUES ($1,$2,$3,$4::timestamptz,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13)
        ON CONFLICT (event_id) DO NOTHING`,
        [
          ev.cursor,
          ev.eventId,
          ev.eventType,
          ev.occurredAt,
          ev.actorRole,
          ev.suppliedBy,
          ev.sourceAuthority,
          ev.usageRights,
          ev.entityType,
          ev.entityId,
          JSON.stringify(ev),
          ev.prevEventHash,
          ev.eventHash,
        ],
      );
    } catch {
      // Non-fatal in preview/read-only environments without migration privileges
    }
  }
}

let singletonIdentifierRegistry: HostedCanonicalIdentifierRegistry | null = null;
let singletonProvenanceLedger: HostedCatalogProvenanceLedger | null = null;

export function getDccHostedIdentifierRegistry(): HostedCanonicalIdentifierRegistry {
  if (!singletonIdentifierRegistry) {
    singletonIdentifierRegistry = new HostedCanonicalIdentifierRegistry(true);
  }
  return singletonIdentifierRegistry;
}

export function getDccHostedProvenanceLedger(): HostedCatalogProvenanceLedger {
  if (!singletonProvenanceLedger) {
    singletonProvenanceLedger = new HostedCatalogProvenanceLedger(true);
  }
  return singletonProvenanceLedger;
}

// ============================================================================
// Field-Level Provenance Projection
// ============================================================================

const TRACKED_ORGANIZER_PROVENANCE_FIELDS: ReadonlyArray<
  keyof CanonicalHostedOrganizerFactRecord & string
> = [
  "organizerId",
  "organizerSlug",
  "officialWebsiteUrl",
  "publicContactPageUrl",
  "reputationEntityId",
  "knownBrandAliases",
  "officialSocialLinks",
  "cabinSellerIdentity",
  "officialReservationPathSummary",
  "cancellationAndParticipationPolicy",
  "officialPolicyUrl",
  "publicReviewProfileLinks",
  "independentSummary",
  "organizerProvidedDescription",
  "typicalHostedProgramming",
  "soloSupportSummary",
  "soloFriendly",
  "familyPolicy",
  "nonAffiliationNotice",
  "cabinBookingPolicyNote",
];

const TRACKED_SAILING_PROVENANCE_FIELDS: ReadonlyArray<
  keyof CanonicalHostedSailingFactRecord & string
> = [
  "hostedSailingId",
  "reputationSailingEntityId",
  "physicalSailingId",
  "canonicalLineCode",
  "canonicalShipSlug",
  "canonicalSailDate",
  "officialSailingPageUrl",
  "officialReservationFormUrl",
  "cabinAvailabilityStatus",
  "cabinAvailabilityNote",
  "verifiedStartingPriceUsd",
  "announcedHostedProgramming",
  "programmingSourceUrl",
  "soloSupport",
  "soloFriendly",
  "familyPolicy",
];

export function buildOrganizerFieldProvenanceMap(
  org: CanonicalHostedOrganizerFactRecord,
  ledger = getDccHostedProvenanceLedger(),
): Record<string, HostedFieldProvenance> {
  const out: Record<string, HostedFieldProvenance> = {};
  for (const field of TRACKED_ORGANIZER_PROVENANCE_FIELDS) {
    const override = ledger.getFieldProvenanceOverride(org.organizerId, field);
    if (override) {
      out[field] = override;
      continue;
    }
    const spec = HOSTED_FIELD_AUTHORITY_MATRIX[field];
    const val = org[field];
    out[field] = {
      suppliedBy:
        field === "organizerProvidedDescription" && val
          ? `organizer:${org.organizerSlug}`
          : "dcc:catalog-research",
      suppliedAt: org.verifiedSourceCheckedAt,
      sourceAuthority: spec?.defaultSourceAuthority ?? "dcc_verified_research",
      usageRights: spec?.defaultUsageRights ?? "factual_reference_reusable",
      dccVerified: true,
      lastCheckedAt: org.verifiedSourceCheckedAt,
      verifiedOnceFingerprint: computeVerifiedOnceFingerprint(org.organizerId, field, val),
    };
  }
  return out;
}

export function buildHostedSailingFieldProvenanceMap(
  hs: CanonicalHostedSailingFactRecord,
  ledger = getDccHostedProvenanceLedger(),
): Record<string, HostedFieldProvenance> {
  const out: Record<string, HostedFieldProvenance> = {};
  const isHeld = Boolean(hs.scheduleHoldReason);
  for (const field of TRACKED_SAILING_PROVENANCE_FIELDS) {
    const override = ledger.getFieldProvenanceOverride(hs.hostedSailingId, field);
    if (override) {
      out[field] = override;
      continue;
    }
    const spec = HOSTED_FIELD_AUTHORITY_MATRIX[field];
    const val = hs[field];
    const scheduleField =
      field === "physicalSailingId" ||
      field === "canonicalLineCode" ||
      field === "canonicalShipSlug" ||
      field === "canonicalSailDate";
    out[field] = {
      suppliedBy: scheduleField ? "dcc:cruise-schedule-truth" : "dcc:catalog-research",
      suppliedAt: hs.organizerSourceCheckedAt,
      sourceAuthority:
        isHeld && scheduleField
          ? "unverified_public_lead"
          : (spec?.defaultSourceAuthority ?? "official_organizer_domain"),
      usageRights: spec?.defaultUsageRights ?? "factual_reference_reusable",
      dccVerified: isHeld && scheduleField ? false : true,
      lastCheckedAt: hs.organizerSourceCheckedAt,
      verifiedOnceFingerprint: computeVerifiedOnceFingerprint(hs.hostedSailingId, field, val),
    };
  }
  return out;
}

export function buildHostedCatalogFieldProvenance(
  snapshot: CanonicalHostedCatalogSnapshot,
  ledger = getDccHostedProvenanceLedger(),
): {
  organizersByEntityId: Record<string, Record<string, HostedFieldProvenance>>;
  hostedSailingsByEntityId: Record<string, Record<string, HostedFieldProvenance>>;
  summary: {
    verifiedFieldCount: number;
    heldUnverifiedFieldCount: number;
    verifyOnceFingerprintsIssued: number;
  };
} {
  const organizersByEntityId: Record<string, Record<string, HostedFieldProvenance>> = {};
  const hostedSailingsByEntityId: Record<string, Record<string, HostedFieldProvenance>> = {};
  let verifiedFieldCount = 0;
  let heldUnverifiedFieldCount = 0;

  for (const org of snapshot.organizers) {
    const map = buildOrganizerFieldProvenanceMap(org, ledger);
    organizersByEntityId[org.organizerId] = map;
    for (const p of Object.values(map)) {
      if (p.dccVerified) verifiedFieldCount += 1;
      else heldUnverifiedFieldCount += 1;
    }
  }

  for (const hs of snapshot.hostedSailings) {
    const map = buildHostedSailingFieldProvenanceMap(hs, ledger);
    hostedSailingsByEntityId[hs.hostedSailingId] = map;
    for (const p of Object.values(map)) {
      if (p.dccVerified) verifiedFieldCount += 1;
      else heldUnverifiedFieldCount += 1;
    }
  }

  return {
    organizersByEntityId,
    hostedSailingsByEntityId,
    summary: {
      verifiedFieldCount,
      heldUnverifiedFieldCount,
      verifyOnceFingerprintsIssued: verifiedFieldCount + heldUnverifiedFieldCount,
    },
  };
}

// ============================================================================
// Strong HTTP ETag (`If-None-Match` -> `304`) & Cached JWS Snapshot Signing
// ============================================================================

export function computeStrongRfc8785Etag(value: unknown): {
  etag: string;
  sha256: string;
} {
  const sha256 = sha256HexFull(rfc8785Canonicalize(normalizeToStrictIJson(value)));
  return {
    etag: `"sha256-${sha256}"`,
    sha256,
  };
}

export function matchesIfNoneMatch(
  ifNoneMatchHeader: string | null | undefined,
  currentEtag: string,
): boolean {
  if (!ifNoneMatchHeader || !ifNoneMatchHeader.trim()) return false;
  const trimmed = ifNoneMatchHeader.trim();
  if (trimmed === "*") return true;
  const stripWeak = (tag: string) => tag.trim().replace(/^W\//i, "");
  const target = stripWeak(currentEtag);
  return trimmed
    .split(",")
    .map((part) => stripWeak(part))
    .some((candidate) => candidate === target);
}

export interface SignedHostedCatalogSnapshotPayload {
  spec: "dcc-hosted-catalog-snapshot/1.0";
  issuer: "https://www.destinationcommandcenter.com";
  contractVersion: typeof CANONICAL_HOSTED_CRUISE_CONTRACT_VERSION;
  snapshotId: string;
  generatedAt: string;
  ledgerCursor: string;
  organizerCount: number;
  hostedSailingCount: number;
  snapshotRfc8785Sha256: string;
}

export interface SignedHostedCatalogSnapshotEnvelope {
  spec: "dcc-hosted-catalog-snapshot/1.0";
  kid: string;
  alg: SupportedJwsAlg;
  typ: "application/dcc-hosted-catalog+jws";
  jku: "https://www.destinationcommandcenter.com/.well-known/jwks.json";
  snapshotRfc8785Sha256: string;
  payloadSha256: string;
  jwsCompact: string;
  payload: SignedHostedCatalogSnapshotPayload;
}

const signedSnapshotCache = new Map<string, SignedHostedCatalogSnapshotEnvelope>();

export async function getSignedHostedCatalogSnapshotEnvelope(
  snapshot: CanonicalHostedCatalogSnapshot,
  ledgerCursorToken = getDccHostedProvenanceLedger().getLatestCursorToken(),
): Promise<SignedHostedCatalogSnapshotEnvelope> {
  const snapshotCanonical = rfc8785Canonicalize(normalizeToStrictIJson(snapshot));
  const snapshotRfc8785Sha256 = sha256HexFull(snapshotCanonical);
  const cacheKey = `${snapshotRfc8785Sha256}:${ledgerCursorToken}`;

  const cached = signedSnapshotCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const payload: SignedHostedCatalogSnapshotPayload = {
    spec: "dcc-hosted-catalog-snapshot/1.0",
    issuer: "https://www.destinationcommandcenter.com",
    contractVersion: snapshot.contractVersion,
    snapshotId: snapshot.snapshotId,
    generatedAt: snapshot.generatedAt,
    ledgerCursor: ledgerCursorToken,
    organizerCount: snapshot.organizers.length,
    hostedSailingCount: snapshot.hostedSailings.length,
    snapshotRfc8785Sha256,
  };

  const canonicalPayloadUtf8 = rfc8785Canonicalize(payload);
  const payloadSha256 = sha256HexFull(canonicalPayloadUtf8);
  const jku = "https://www.destinationcommandcenter.com/.well-known/jwks.json" as const;
  const typ = "application/dcc-hosted-catalog+jws" as const;

  const kmsIssuerId = getConfiguredVercelKmsIssuerId();
  if (kmsIssuerId) {
    try {
      const kmsSigned = await signJwsCompactViaVercelKmsEs256({
        issuerId: kmsIssuerId,
        typ,
        payloadUtf8: canonicalPayloadUtf8,
      });
      const envelope: SignedHostedCatalogSnapshotEnvelope = Object.freeze({
        spec: "dcc-hosted-catalog-snapshot/1.0",
        kid: kmsSigned.kid,
        alg: "ES256",
        typ,
        jku,
        snapshotRfc8785Sha256,
        payloadSha256,
        jwsCompact: kmsSigned.jwsCompact,
        payload,
      });
      signedSnapshotCache.set(cacheKey, envelope);
      return envelope;
    } catch (err) {
      if (process.env.VERCEL_ENV === "production") {
        throw err;
      }
      // In local tests without VERCEL_OIDC_TOKEN, fall back to registered EdDSA conformance key
    }
  }

  const activeKey = getActiveV03SigningKey();
  if (!activeKey.privateKeyObject) {
    throw new FailClosedSigningConfigurationError(
      `Active signing key "${activeKey.kid}" has no local private key and Vercel KMS OIDC signing was unavailable.`,
    );
  }

  const jwsCompact = jwsCompactSignEdDsa({
    protectedHeader: {
      alg: "EdDSA",
      typ,
      kid: activeKey.kid,
      jku,
    },
    payloadUtf8: canonicalPayloadUtf8,
    privateKeyObject: activeKey.privateKeyObject,
  });

  const envelope: SignedHostedCatalogSnapshotEnvelope = Object.freeze({
    spec: "dcc-hosted-catalog-snapshot/1.0",
    kid: activeKey.kid,
    alg: "EdDSA",
    typ,
    jku,
    snapshotRfc8785Sha256,
    payloadSha256,
    jwsCompact,
    payload,
  });

  signedSnapshotCache.set(cacheKey, envelope);
  return envelope;
}

export async function verifySignedHostedCatalogSnapshotEnvelope(params: {
  jwsCompact: string;
  snapshot: CanonicalHostedCatalogSnapshot;
  jwks?: ReturnType<typeof getStandardJwksDocument>;
}): Promise<{
  valid: boolean;
  reason?: string;
  kid?: string;
  alg?: SupportedJwsAlg;
  snapshotRfc8785Sha256?: string;
  ledgerCursor?: string;
}> {
  let sigCheck = jwsCompactVerifyEdDsa({
    jwsCompact: params.jwsCompact,
    jwks: params.jwks,
  });
  if (!sigCheck.valid && sigCheck.reason?.startsWith("UNKNOWN_KID:") && !params.jwks) {
    await syncVercelKmsJwksToRegistry(undefined, true);
    sigCheck = jwsCompactVerifyEdDsa({
      jwsCompact: params.jwsCompact,
    });
  }
  if (!sigCheck.valid || !sigCheck.decodedPayloadUtf8) {
    return {
      valid: false,
      kid: sigCheck.kid,
      reason: sigCheck.reason,
    };
  }

  try {
    const parsed = JSON.parse(sigCheck.decodedPayloadUtf8) as SignedHostedCatalogSnapshotPayload;
    if (parsed.spec !== "dcc-hosted-catalog-snapshot/1.0") {
      return { valid: false, kid: sigCheck.kid, reason: `UNEXPECTED_SPEC:${String(parsed.spec)}` };
    }
    if (parsed.issuer !== "https://www.destinationcommandcenter.com") {
      return { valid: false, kid: sigCheck.kid, reason: `WRONG_ISSUER:${String(parsed.issuer)}` };
    }
    const recomputedCanonicalPayload = rfc8785Canonicalize(parsed);
    if (recomputedCanonicalPayload !== sigCheck.decodedPayloadUtf8) {
      return { valid: false, kid: sigCheck.kid, reason: "PAYLOAD_NOT_RFC8785_CANONICAL" };
    }
    const actualSnapshotSha256 = sha256HexFull(
      rfc8785Canonicalize(normalizeToStrictIJson(params.snapshot)),
    );
    if (actualSnapshotSha256 !== parsed.snapshotRfc8785Sha256) {
      return {
        valid: false,
        kid: sigCheck.kid,
        reason: "SNAPSHOT_CONTENT_SHA256_MISMATCH",
      };
    }
    return {
      valid: true,
      kid: sigCheck.kid,
      alg: sigCheck.alg,
      snapshotRfc8785Sha256: actualSnapshotSha256,
      ledgerCursor: parsed.ledgerCursor,
    };
  } catch (err) {
    return {
      valid: false,
      kid: sigCheck.kid,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}

export function clearSignedHostedCatalogCacheForTests(): void {
  signedSnapshotCache.clear();
}
