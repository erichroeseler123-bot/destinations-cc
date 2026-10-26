import { buildV03CandidateUniverse, type V03CandidateUniverse } from "./candidateUniverse";
import {
  issueShadowDecisionAuthorization,
  type CommerceAdapterTarget,
  type V03SignedDecisionAuthorization,
} from "./decisionAuthorization";
import { getV03SchemaHashes } from "./discoveryAndMcp";
import {
  compileV03EngineBundle,
  evaluateCurrentV03,
  replayHistoricalReceiptV03,
  simulateAdministrativeV03,
  type V03CompiledEngineBundle,
  type V03EvaluationResult,
} from "./evaluatorAndReplay";
import {
  buildV03EvidenceReference,
  extractTextEvidenceSelectors,
  toPublicCitationProjection,
  type V03EvidenceReference,
  type V03PublicCitationProjection,
} from "./evidenceSelectors";
import { DccIdentityLedger, mintOpaqueDccEntityId } from "./identityGraph";
import { sha256HexFull, type V03SignedDecisionReceipt } from "./rfc8785AndJws";
import { AppendOnlyKnowledgeLedger } from "./temporalLedger";

/**
 * DCC Machine Layer v0.3 — Unified Runtime Store
 *
 * Hosts the append-only knowledge event ledger, DCC-native identity ledger,
 * versioned CandidateUniverses, compiled DecisionIrBundles, W3C evidence references,
 * JWS receipts, and shadow DecisionAuthorizations for:
 * - `juneau-helicopter-tours`
 * - `hawaii-whale-watching`
 * - `denver-to-mountain-transportation` (GoSno)
 * - `juneau-helicopter-canary-v03` (strict evidence-sufficiency canary)
 */

export interface V03RuntimeStore {
  knowledgeLedger: AppendOnlyKnowledgeLedger;
  identityLedger: DccIdentityLedger;
  universesByIdAndVersion: Map<string, V03CandidateUniverse>;
  universesByHash: Map<string, V03CandidateUniverse>;
  bundlesByEngineAndVersion: Map<string, V03CompiledEngineBundle>;
  bundlesByHash: Map<string, V03CompiledEngineBundle>;
  activeEngineVersionByEngineId: Map<string, string>;
  evidenceRefsById: Map<string, V03EvidenceReference>;
  receiptsById: Map<string, { receipt: V03SignedDecisionReceipt; inputs: Record<string, unknown> }>;
  authorizationsById: Map<string, V03SignedDecisionAuthorization>;
}

let singletonStoreV03: V03RuntimeStore | null = null;

export function resetV03RuntimeStore(): void {
  singletonStoreV03 = null;
}

export function getV03RuntimeStore(): V03RuntimeStore {
  if (singletonStoreV03) return singletonStoreV03;

  const knowledgeLedger = new AppendOnlyKnowledgeLedger();
  const identityLedger = new DccIdentityLedger();
  const universesByIdAndVersion = new Map<string, V03CandidateUniverse>();
  const universesByHash = new Map<string, V03CandidateUniverse>();
  const bundlesByEngineAndVersion = new Map<string, V03CompiledEngineBundle>();
  const bundlesByHash = new Map<string, V03CompiledEngineBundle>();
  const activeEngineVersionByEngineId = new Map<string, string>();
  const evidenceRefsById = new Map<string, V03EvidenceReference>();
  const receiptsById = new Map<
    string,
    { receipt: V03SignedDecisionReceipt; inputs: Record<string, unknown> }
  >();
  const authorizationsById = new Map<string, V03SignedDecisionAuthorization>();

  const schemaHashes = getV03SchemaHashes();
  const baseRecordedAt = "2026-10-26T00:00:00.000Z";

  // ==========================================================================
  // 1. Register DCC-Native Identities & Versioned External Aliases
  // ==========================================================================
  const jnuDestId = mintOpaqueDccEntityId("destination", "us-ak-juneau");
  const mauiDestId = mintOpaqueDccEntityId("destination", "us-hi-maui-maalaea");
  const denverDestId = mintOpaqueDccEntityId("destination", "us-co-denver-mountain-corridor");

  const coastalOpId = mintOpaqueDccEntityId("operator", "coastal-helicopters-juneau");
  const temscoOpId = mintOpaqueDccEntityId("operator", "temsco-helicopters-juneau");
  const northstarOpId = mintOpaqueDccEntityId("operator", "northstar-trekking-juneau");
  const pacWhaleOpId = mintOpaqueDccEntityId("operator", "pacific-whale-foundation-maui");
  const trilogyOpId = mintOpaqueDccEntityId("operator", "trilogy-excursions-maui");
  const gosnoOpId = mintOpaqueDccEntityId("operator", "gosno-mountain-transportation-co");

  const candJnuCoastalId = mintOpaqueDccEntityId("tour_candidate", "jnu-heli-coastal-icefield");
  const candJnuTemscoId = mintOpaqueDccEntityId("tour_candidate", "jnu-heli-mendenhall-landing");
  const candJnuNorthstarId = mintOpaqueDccEntityId("tour_candidate", "jnu-heli-northstar-trek");

  const candHawPwfCatamaranId = mintOpaqueDccEntityId("tour_candidate", "haw-pwf-maalaea-catamaran");
  const candHawTrilogySailId = mintOpaqueDccEntityId("tour_candidate", "haw-trilogy-kaaanapali-sail");

  const candGosnoExpressId = mintOpaqueDccEntityId(
    "tour_candidate",
    "gosno-denver-winter-park-express-shuttle",
  );

  const srcCoastalPolicyId = mintOpaqueDccEntityId("evidence_source", "coastal-ops-policy-2026");
  const srcNoaaHumpbackId = mintOpaqueDccEntityId("evidence_source", "noaa-50cfr224-humpback-approach");
  const srcGosnoTariffId = mintOpaqueDccEntityId("evidence_source", "gosno-published-tariff-2026");

  for (const [id, kind, name] of [
    [jnuDestId, "destination", "Juneau, Alaska"],
    [mauiDestId, "destination", "Maui (Maalaea & Lahaina), Hawaii"],
    [denverDestId, "destination", "Denver to Winter Park Mountain Corridor, Colorado"],
    [coastalOpId, "operator", "Coastal Helicopters"],
    [temscoOpId, "operator", "TEMSCO Helicopters"],
    [northstarOpId, "operator", "NorthStar Trekking"],
    [pacWhaleOpId, "operator", "Pacific Whale Foundation Eco-Adventures"],
    [trilogyOpId, "operator", "Trilogy Excursions"],
    [gosnoOpId, "operator", "GoSno Mountain Transportation"],
    [candJnuCoastalId, "tour_candidate", "Icefield Excursion & Glacier Walk (Coastal Helicopters)"],
    [candJnuTemscoId, "tour_candidate", "Mendenhall Glacier Helicopter & Guided Walk (TEMSCO)"],
    [candJnuNorthstarId, "tour_candidate", "Extended Glacier Icefield Trek (NorthStar Trekking)"],
    [candHawPwfCatamaranId, "tour_candidate", "Maalaea Stabilized Double-Deck Catamaran Whale Watch"],
    [candHawTrilogySailId, "tour_candidate", "Small-Group Sailing Catamaran Whale Watch"],
    [candGosnoExpressId, "tour_candidate", "GoSno Denver to Winter Park Resort Express Shuttle"],
  ] as const) {
    identityLedger.registerEntity({
      dccEntityId: id,
      entityKind: kind,
      displayName: name,
      recordedAt: baseRecordedAt,
    });
  }

  // ==========================================================================
  // 2. Build W3C Evidence References & Append Operational Claims
  // ==========================================================================
  const jnuPolicyDoc =
    "Juneau Operator Published Weight & Safety Policy 2026: Passengers exceeding 250 lbs (individual seat limit) require a comfort/weight surcharge allocation. Minimum child age for standard glacier walk is 2 years.";
  const jnuWeightSel = extractTextEvidenceSelectors({
    documentText: jnuPolicyDoc,
    exactQuote: "Passengers exceeding 250 lbs (individual seat limit) require a comfort/weight surcharge",
  });
  const evRefJnuWeight = buildV03EvidenceReference({
    evidenceRefId: "evref:jnu:operator-weight-policy-250",
    sourceDccId: srcCoastalPolicyId,
    sourceTitle: "Juneau Helicopter Operator Passenger Weight & Balance Policy",
    sourceOrganization: "Juneau Flight Deck / Verified Operator Tariff",
    canonicalSourceUrl: "https://www.destinationcommandcenter.com/juneau/helicopter-tours",
    snapshotId: `snap:sha256:${sha256HexFull(jnuPolicyDoc)}`,
    snapshotSha256: sha256HexFull(jnuPolicyDoc),
    privateObjectKey: `v03/raw_source_captures/sha256/${sha256HexFull(jnuPolicyDoc)}.txt`,
    selectors: jnuWeightSel.selectors,
    surroundingContext: jnuWeightSel.surroundingContext,
    extractor: {
      extractorId: "dcc-v03-text-selector",
      extractorVersion: "0.3.0",
      method: "deterministic_regex_span",
    },
    extractedAt: baseRecordedAt,
    retrievedAt: baseRecordedAt,
    sourcePublishedAt: "2026-01-15T00:00:00.000Z",
    sourceObservedAt: baseRecordedAt,
    licenseOrReusePolicy: "DCC First-Party Reference Tariff",
  });
  evidenceRefsById.set(evRefJnuWeight.evidenceRefId, evRefJnuWeight);

  const noaaDoc =
    "50 CFR 224.103(a): It is unlawful to approach, by any means, within 100 yards (91.4 m) of any humpback whale in Hawaii waters.";
  const noaaSel = extractTextEvidenceSelectors({
    documentText: noaaDoc,
    exactQuote: "within 100 yards (91.4 m) of any humpback whale in Hawaii waters",
  });
  const evRefNoaa100yd = buildV03EvidenceReference({
    evidenceRefId: "evref:haw:noaa-50cfr224-100yd-approach",
    sourceDccId: srcNoaaHumpbackId,
    sourceTitle: "50 CFR § 224.103 — Special prohibitions for endangered marine mammals (Humpback Whales in Hawaii)",
    sourceOrganization: "NOAA Fisheries / Code of Federal Regulations",
    canonicalSourceUrl: "https://www.ecfr.gov/current/title-50/section-224.103",
    snapshotId: `snap:sha256:${sha256HexFull(noaaDoc)}`,
    snapshotSha256: sha256HexFull(noaaDoc),
    privateObjectKey: `v03/raw_source_captures/sha256/${sha256HexFull(noaaDoc)}.txt`,
    selectors: noaaSel.selectors,
    surroundingContext: noaaSel.surroundingContext,
    extractor: {
      extractorId: "dcc-v03-text-selector",
      extractorVersion: "0.3.0",
      method: "deterministic_regex_span",
    },
    extractedAt: baseRecordedAt,
    retrievedAt: baseRecordedAt,
    sourcePublishedAt: "2026-01-01T00:00:00.000Z",
    sourceObservedAt: baseRecordedAt,
    licenseOrReusePolicy: "US Federal Government Public Domain (17 U.S.C. 105)",
  });
  evidenceRefsById.set(evRefNoaa100yd.evidenceRefId, evRefNoaa100yd);

  const gosnoDoc =
    "GoSno Mountain Shuttle Tariff 2026: Denver Union Station / DEN to Winter Park Resort shared express shuttle operates up to 14 passengers per van, max 2 ski/snowboard bags per rider, published fare $89 USD per person.";
  const gosnoSel = extractTextEvidenceSelectors({
    documentText: gosnoDoc,
    exactQuote: "up to 14 passengers per van, max 2 ski/snowboard bags per rider, published fare $89 USD",
  });
  const evRefGosno = buildV03EvidenceReference({
    evidenceRefId: "evref:gosno:tariff-2026-winter-park",
    sourceDccId: srcGosnoTariffId,
    sourceTitle: "GoSno Denver-to-Winter-Park Published Shuttle Tariff",
    sourceOrganization: "GoSno Mountain Transportation",
    canonicalSourceUrl: "https://www.destinationcommandcenter.com/go/dcc-to-gosno",
    snapshotId: `snap:sha256:${sha256HexFull(gosnoDoc)}`,
    snapshotSha256: sha256HexFull(gosnoDoc),
    privateObjectKey: `v03/raw_source_captures/sha256/${sha256HexFull(gosnoDoc)}.txt`,
    selectors: gosnoSel.selectors,
    surroundingContext: gosnoSel.surroundingContext,
    extractor: {
      extractorId: "dcc-v03-text-selector",
      extractorVersion: "0.3.0",
      method: "deterministic_regex_span",
    },
    extractedAt: baseRecordedAt,
    retrievedAt: baseRecordedAt,
    sourcePublishedAt: "2026-10-01T00:00:00.000Z",
    sourceObservedAt: baseRecordedAt,
    licenseOrReusePolicy: "DCC First-Party Partner Tariff",
  });
  evidenceRefsById.set(evRefGosno.evidenceRefId, evRefGosno);

  // Map external aliases with evidence
  identityLedger.mapExternalAlias({
    aliasVersionId: "alias:jnu:coastal:legacy:v1",
    namespace: "legacy_dcc_slug",
    externalId: "jnu-heli-coastal-icefield",
    dccEntityId: candJnuCoastalId,
    mappingEvidenceRefIds: [evRefJnuWeight.evidenceRefId],
    recordedAt: baseRecordedAt,
  });
  identityLedger.mapExternalAlias({
    aliasVersionId: "alias:gosno:octo:v1",
    namespace: "octo_product_id",
    externalId: "octo:gosno-den-wp-express",
    dccEntityId: candGosnoExpressId,
    mappingEvidenceRefIds: [evRefGosno.evidenceRefId],
    recordedAt: baseRecordedAt,
  });

  // Append active operational claims
  knowledgeLedger.appendEvent({
    eventType: "claim_approved_and_activated",
    claimId: "clm:jnu:standard-seat-weight-limit-lbs",
    claimVersionId: "clmv:jnu:standard-seat-weight-limit-lbs:v1",
    recordedAt: baseRecordedAt,
    actorId: "dcc-v03-bootstrap",
    isSynthetic: false,
    provenanceClass: "operational_evidence",
    reason: "Published operator single-seat weight threshold before surcharge.",
    claimDefinition: {
      claimId: "clm:jnu:standard-seat-weight-limit-lbs",
      claimVersionId: "clmv:jnu:standard-seat-weight-limit-lbs:v1",
      subjectDccId: coastalOpId,
      predicate: "max_single_seat_passenger_weight_lbs",
      assertionType: "policy",
      epistemicState: "verified_against_identified_evidence",
      typedValue: 250,
      unitOrCurrency: "lbs",
      validFrom: "2026-01-01T00:00:00.000Z",
      validTo: "2027-12-31T23:59:59.000Z",
      sourceObservedAt: baseRecordedAt,
      sourcePublishedAt: "2026-01-15T00:00:00.000Z",
      retrievedAt: baseRecordedAt,
      freshnessTtlSeconds: 180 * 86400,
      sourceAuthority: {
        sourceDccId: srcCoastalPolicyId,
        organizationName: "Juneau Flight Deck / Verified Operator Tariff",
        authorityTier: "direct_operator",
        competentDomains: ["operator_safety_and_weight_policy"],
        claimedDomain: "operator_safety_and_weight_policy",
        independentlyCorroboratedBySourceDccIds: [],
        licenseOrReusePolicy: "DCC First-Party Reference Tariff",
      },
      evidenceRefs: [evRefJnuWeight],
    },
  });

  knowledgeLedger.appendEvent({
    eventType: "claim_approved_and_activated",
    claimId: "clm:haw:noaa-100yd-approach-compliance",
    claimVersionId: "clmv:haw:noaa-100yd-approach-compliance:v1",
    recordedAt: baseRecordedAt,
    actorId: "dcc-v03-bootstrap",
    isSynthetic: false,
    provenanceClass: "operational_evidence",
    reason: "50 CFR 224.103(a) mandatory 100-yard humpback whale approach stand-off distance.",
    claimDefinition: {
      claimId: "clm:haw:noaa-100yd-approach-compliance",
      claimVersionId: "clmv:haw:noaa-100yd-approach-compliance:v1",
      subjectDccId: mauiDestId,
      predicate: "noaa_100yd_humpback_standoff_enforced",
      assertionType: "policy",
      epistemicState: "verified_against_identified_evidence",
      typedValue: true,
      validFrom: "2025-01-01T00:00:00.000Z",
      validTo: null,
      sourceObservedAt: baseRecordedAt,
      sourcePublishedAt: "2026-01-01T00:00:00.000Z",
      retrievedAt: baseRecordedAt,
      freshnessTtlSeconds: 365 * 86400,
      sourceAuthority: {
        sourceDccId: srcNoaaHumpbackId,
        organizationName: "NOAA Fisheries / Code of Federal Regulations",
        authorityTier: "primary_regulator",
        competentDomains: ["marine_wildlife_regulation"],
        claimedDomain: "marine_wildlife_regulation",
        independentlyCorroboratedBySourceDccIds: [],
        licenseOrReusePolicy: "US Federal Government Public Domain",
      },
      evidenceRefs: [evRefNoaa100yd],
    },
  });

  knowledgeLedger.appendEvent({
    eventType: "claim_approved_and_activated",
    claimId: "clm:gosno:max-pax-per-shuttle",
    claimVersionId: "clmv:gosno:max-pax-per-shuttle:v1",
    recordedAt: baseRecordedAt,
    actorId: "dcc-v03-bootstrap",
    isSynthetic: false,
    provenanceClass: "operational_evidence",
    reason: "Published GoSno shuttle van passenger capacity.",
    claimDefinition: {
      claimId: "clm:gosno:max-pax-per-shuttle",
      claimVersionId: "clmv:gosno:max-pax-per-shuttle:v1",
      subjectDccId: candGosnoExpressId,
      predicate: "max_passengers_per_shuttle_van",
      assertionType: "policy",
      epistemicState: "verified_against_identified_evidence",
      typedValue: 14,
      unitOrCurrency: "passengers",
      validFrom: "2026-01-01T00:00:00.000Z",
      validTo: "2027-05-01T00:00:00.000Z",
      sourceObservedAt: baseRecordedAt,
      sourcePublishedAt: "2026-10-01T00:00:00.000Z",
      retrievedAt: baseRecordedAt,
      freshnessTtlSeconds: 90 * 86400,
      sourceAuthority: {
        sourceDccId: srcGosnoTariffId,
        organizationName: "GoSno Mountain Transportation",
        authorityTier: "direct_operator",
        competentDomains: ["ground_shuttle_operations"],
        claimedDomain: "ground_shuttle_operations",
        independentlyCorroboratedBySourceDccIds: [],
        licenseOrReusePolicy: "DCC First-Party Partner Tariff",
      },
      evidenceRefs: [evRefGosno],
    },
  });

  // ==========================================================================
  // 3. Build CandidateUniverses & Compile DecisionIrBundles
  // ==========================================================================
  const jnuUniverse = buildV03CandidateUniverse({
    universeId: "univ:juneau-helicopter-tours",
    version: "0.3.0",
    engineId: "juneau-helicopter-tours",
    engineVersion: "0.3.0",
    isSynthetic: false,
    scope: {
      destinationDccEntityId: jnuDestId,
      destinationName: "Juneau, Alaska",
      categorySlug: "juneau-helicopter-tours",
      jurisdiction: "US-AK-JUNEAU",
      geographicBounds: { minLat: 58.25, maxLat: 58.65, minLon: -134.85, maxLon: -134.1 },
    },
    inclusionMethod:
      "USFS Tongass National Forest commercial helicopter glacier-landing permit holders operating out of Juneau International Airport (PAJN).",
    sourcesAndQueriesConsulted: [
      {
        sourceDccId: srcCoastalPolicyId,
        organizationName: "Juneau Flight Deck / Verified Operator Tariff",
        queryOrEndpoint: "https://www.destinationcommandcenter.com/juneau/helicopter-tours",
        consultedAt: baseRecordedAt,
        snapshotSha256: evRefJnuWeight.snapshotSha256,
      },
    ],
    includedCandidates: [
      {
        candidateDccEntityId: candJnuCoastalId,
        legacyCandidateCode: "jnu-heli-coastal-icefield",
        displayName: "Icefield Excursion & Glacier Walk (Coastal Helicopters)",
        operatorDccEntityId: coastalOpId,
        operatorDisplayName: "Coastal Helicopters",
        bookingChannelClass: "dcc_owned_platform",
        wtaAttributionPresent: false,
        staticAttributes: {
          basePriceUsd: 429,
          supportsWeightOverride: true,
          requestedFormat: "standard_glacier_walk",
          minAgeYears: 2,
          minPortWindowMinutes: 225,
          comfortablePortWindowMinutes: 255,
        },
        requiredClaimIds: ["clm:jnu:standard-seat-weight-limit-lbs"],
      },
      {
        candidateDccEntityId: candJnuTemscoId,
        legacyCandidateCode: "jnu-heli-mendenhall-landing",
        displayName: "Mendenhall Glacier Helicopter & Guided Walk (TEMSCO)",
        operatorDccEntityId: temscoOpId,
        operatorDisplayName: "TEMSCO Helicopters",
        bookingChannelClass: "dcc_owned_platform",
        wtaAttributionPresent: false,
        staticAttributes: {
          basePriceUsd: 449,
          supportsWeightOverride: false,
          requestedFormat: "standard_glacier_walk",
          minAgeYears: 2,
          minPortWindowMinutes: 225,
          comfortablePortWindowMinutes: 255,
        },
        requiredClaimIds: ["clm:jnu:standard-seat-weight-limit-lbs"],
      },
      {
        candidateDccEntityId: candJnuNorthstarId,
        legacyCandidateCode: "jnu-heli-northstar-trek",
        displayName: "Extended Glacier Icefield Trek (NorthStar Trekking)",
        operatorDccEntityId: northstarOpId,
        operatorDisplayName: "NorthStar Trekking",
        bookingChannelClass: "verified_direct_operator",
        wtaAttributionPresent: false,
        staticAttributes: {
          basePriceUsd: 549,
          supportsWeightOverride: true,
          requestedFormat: "extended_ice_trek",
          minAgeYears: 12,
          minPortWindowMinutes: 360,
          comfortablePortWindowMinutes: 390,
        },
        requiredClaimIds: ["clm:jnu:standard-seat-weight-limit-lbs"],
      },
    ],
    knownExclusions: [
      {
        externalOrLegacyIdentifier: "wta-reseller-excluded",
        displayName: "Welcome to Alaska Tours",
        reasonCode: "WTA_PROHIBITED_BY_GOVERNANCE",
        explanation: "Never routed or attributed per DCC Alaska governance restriction.",
        supportingEvidenceRefIds: [],
      },
    ],
    coverageGaps: [
      {
        gapCode: "LIVE_SEAT_INVENTORY_NOT_QUERIED_IN_STATIC_UNIVERSE",
        affectedDimension: "real_time_inventory",
        description: "Evaluates published policy rules; live seat counts require operator revalidation.",
        impactOnCompleteness: "Requires revalidation prior to booking execution.",
      },
    ],
    effectiveFrom: "2026-01-01T00:00:00.000Z",
    effectiveTo: "2027-12-31T23:59:59.000Z",
    knowledgeCutoff: baseRecordedAt,
    refreshDeadline: "2026-11-26T00:00:00.000Z",
    generatorVersion: "dcc-universe-generator/0.3.0",
    epistemicDisclaimer:
      "Evaluates policy fit within the declared Juneau helicopter universe; does not guarantee real-time seat inventory.",
  });

  const jnuBundle = compileV03EngineBundle({
    engineId: "juneau-helicopter-tours",
    engineVersion: "0.3.0",
    universe: jnuUniverse,
    rules: [
      {
        ruleId: "rule:jnu:weight-limit",
        ruleVersionId: "rulev:jnu:weight-limit:v1",
        ruleKind: "hard_gate",
        title: "Single-seat passenger weight threshold (250 lbs)",
        reasonCode: "PASSENGER_WEIGHT_EXCEEDS_250_LB_STANDARD_SEAT",
        requiredClaimId: "clm:jnu:standard-seat-weight-limit-lbs",
        predicateType: "input_lte_claim_number",
        inputField: "maxSinglePassengerWeightLbs",
        scoreDelta: 20,
      },
      {
        ruleId: "rule:jnu:format-match",
        ruleVersionId: "rulev:jnu:format-match:v1",
        ruleKind: "ranking_weight",
        title: "Matches requested glacier excursion format",
        reasonCode: "REQUESTED_FORMAT",
        requiredClaimId: "clm:jnu:standard-seat-weight-limit-lbs",
        predicateType: "input_equals_candidate_attr",
        inputField: "requestedFormat",
        candidateAttrKey: "requestedFormat",
        scoreDelta: 15,
      },
    ],
    pinnedSchemaHashes: schemaHashes,
  });

  const hawUniverse = buildV03CandidateUniverse({
    universeId: "univ:hawaii-whale-watching",
    version: "0.3.0",
    engineId: "hawaii-whale-watching",
    engineVersion: "0.3.0",
    isSynthetic: false,
    scope: {
      destinationDccEntityId: mauiDestId,
      destinationName: "Maui, Hawaii",
      categorySlug: "hawaii-whale-watching",
      jurisdiction: "US-HI-MAUI",
      geographicBounds: { minLat: 20.5, maxLat: 21.1, minLon: -156.8, maxLon: -156.3 },
    },
    inclusionMethod:
      "NOAA 50 CFR 224.103 compliant Maui humpback whale-watching operators with verified vessel class disclosures.",
    sourcesAndQueriesConsulted: [
      {
        sourceDccId: srcNoaaHumpbackId,
        organizationName: "NOAA Fisheries / Code of Federal Regulations",
        queryOrEndpoint: "https://www.ecfr.gov/current/title-50/section-224.103",
        consultedAt: baseRecordedAt,
        snapshotSha256: evRefNoaa100yd.snapshotSha256,
      },
    ],
    includedCandidates: [
      {
        candidateDccEntityId: candHawPwfCatamaranId,
        legacyCandidateCode: "haw-maui-pwf-catamaran",
        displayName: "Maalaea Harbor Stabilized Double-Deck Catamaran (Pacific Whale Foundation)",
        operatorDccEntityId: pacWhaleOpId,
        operatorDisplayName: "Pacific Whale Foundation Eco-Adventures",
        bookingChannelClass: "verified_direct_operator",
        wtaAttributionPresent: false,
        staticAttributes: {
          basePriceUsd: 96,
          vesselPreference: "large_stabilized_catamaran",
        },
        requiredClaimIds: ["clm:haw:noaa-100yd-approach-compliance"],
      },
      {
        candidateDccEntityId: candHawTrilogySailId,
        legacyCandidateCode: "haw-maui-trilogy-sail",
        displayName: "Small-Group Sailing Catamaran Whale Watch (Trilogy Excursions)",
        operatorDccEntityId: trilogyOpId,
        operatorDisplayName: "Trilogy Excursions",
        bookingChannelClass: "verified_direct_operator",
        wtaAttributionPresent: false,
        staticAttributes: {
          basePriceUsd: 139,
          vesselPreference: "sailing_catamaran",
        },
        requiredClaimIds: ["clm:haw:noaa-100yd-approach-compliance"],
      },
    ],
    knownExclusions: [],
    coverageGaps: [
      {
        gapCode: "LIVE_CHANNEL_WAVE_BUOY_NOT_INGESTED",
        affectedDimension: "real_time_sea_state",
        description: "Uses seasonal channel exposure profiles unless live buoy telemetry is supplied.",
        impactOnCompleteness: "Travelers with severe motion sensitivity should re-check morning sea state.",
      },
    ],
    effectiveFrom: "2026-01-01T00:00:00.000Z",
    effectiveTo: "2027-12-31T23:59:59.000Z",
    knowledgeCutoff: baseRecordedAt,
    refreshDeadline: "2026-11-26T00:00:00.000Z",
    generatorVersion: "dcc-universe-generator/0.3.0",
    epistemicDisclaimer: "Bounded to declared Maui whale-watching candidate universe.",
  });

  const hawBundle = compileV03EngineBundle({
    engineId: "hawaii-whale-watching",
    engineVersion: "0.3.0",
    universe: hawUniverse,
    rules: [
      {
        ruleId: "rule:haw:noaa-100yd-compliance",
        ruleVersionId: "rulev:haw:noaa-100yd-compliance:v1",
        ruleKind: "hard_gate",
        title: "NOAA 50 CFR 224.103 100-yard humpback approach compliance",
        reasonCode: "NOAA_100YD_APPROACH_COMPLIANT",
        requiredClaimId: "clm:haw:noaa-100yd-approach-compliance",
        predicateType: "claim_must_be_eligible_and_boolean_true",
        scoreDelta: 20,
      },
      {
        ruleId: "rule:haw:vessel-preference-match",
        ruleVersionId: "rulev:haw:vessel-preference-match:v1",
        ruleKind: "ranking_weight",
        title: "Matches traveler vessel stability preference",
        reasonCode: "VESSEL_PREFERENCE",
        requiredClaimId: "clm:haw:noaa-100yd-approach-compliance",
        predicateType: "input_equals_candidate_attr",
        inputField: "vesselPreference",
        candidateAttrKey: "vesselPreference",
        scoreDelta: 20,
      },
    ],
    pinnedSchemaHashes: schemaHashes,
  });

  const gosnoUniverse = buildV03CandidateUniverse({
    universeId: "univ:denver-to-mountain-transportation",
    version: "0.3.0",
    engineId: "denver-to-mountain-transportation",
    engineVersion: "0.3.0",
    isSynthetic: false,
    scope: {
      destinationDccEntityId: denverDestId,
      destinationName: "Denver to Winter Park Mountain Corridor, Colorado",
      categorySlug: "denver-to-mountain-transportation",
      jurisdiction: "US-CO",
      geographicBounds: { minLat: 39.4, maxLat: 40.0, minLon: -106.1, maxLon: -104.6 },
    },
    inclusionMethod: "DCC verified mountain shuttle operators along the Denver to Winter Park corridor.",
    sourcesAndQueriesConsulted: [
      {
        sourceDccId: srcGosnoTariffId,
        organizationName: "GoSno Mountain Transportation",
        queryOrEndpoint: "https://www.destinationcommandcenter.com/go/dcc-to-gosno",
        consultedAt: baseRecordedAt,
        snapshotSha256: evRefGosno.snapshotSha256,
      },
    ],
    includedCandidates: [
      {
        candidateDccEntityId: candGosnoExpressId,
        legacyCandidateCode: "gosno-denver-winter-park-express",
        displayName: "GoSno Denver to Winter Park Resort Express Shuttle",
        operatorDccEntityId: gosnoOpId,
        operatorDisplayName: "GoSno Mountain Transportation",
        bookingChannelClass: "dcc_owned_platform",
        wtaAttributionPresent: false,
        staticAttributes: { basePriceUsd: 89 },
        requiredClaimIds: ["clm:gosno:max-pax-per-shuttle"],
      },
    ],
    knownExclusions: [],
    coverageGaps: [],
    effectiveFrom: "2026-01-01T00:00:00.000Z",
    effectiveTo: "2027-05-01T00:00:00.000Z",
    knowledgeCutoff: baseRecordedAt,
    refreshDeadline: "2026-11-26T00:00:00.000Z",
    generatorVersion: "dcc-universe-generator/0.3.0",
    epistemicDisclaimer: "Bounded to declared Denver-to-Winter-Park shuttle universe.",
  });

  const gosnoBundle = compileV03EngineBundle({
    engineId: "denver-to-mountain-transportation",
    engineVersion: "0.3.0",
    universe: gosnoUniverse,
    rules: [
      {
        ruleId: "rule:gosno:group-size-lte-capacity",
        ruleVersionId: "rulev:gosno:group-size-lte-capacity:v1",
        ruleKind: "hard_gate",
        title: "Passenger group size within shuttle van capacity",
        reasonCode: "GROUP_SIZE_EXCEEDS_VAN_CAPACITY",
        requiredClaimId: "clm:gosno:max-pax-per-shuttle",
        predicateType: "input_lte_claim_number",
        inputField: "groupSize",
        scoreDelta: 20,
      },
      {
        ruleId: "rule:gosno:winter-storm-qualification",
        ruleVersionId: "rulev:gosno:winter-storm-qualification:v1",
        ruleKind: "qualification_modifier",
        title: "Berthoud Pass winter traction advisory qualification",
        reasonCode: "BERTHOUD_PASS_WINTER_TRACTION_BUFFER_ADVISORY",
        requiredClaimId: "clm:gosno:max-pax-per-shuttle",
        predicateType: "qualification_penalty_if_input_matches",
        inputField: "weatherCondition",
        expectedValue: "winter_snow_advisory",
        scoreDelta: -5,
      },
    ],
    pinnedSchemaHashes: schemaHashes,
  });

  for (const [univ, bnd] of [
    [jnuUniverse, jnuBundle],
    [hawUniverse, hawBundle],
    [gosnoUniverse, gosnoBundle],
  ] as const) {
    universesByIdAndVersion.set(`${univ.universeId}@${univ.version}`, univ);
    universesByIdAndVersion.set(univ.universeId, univ);
    universesByHash.set(univ.universeHash, univ);
    bundlesByEngineAndVersion.set(`${bnd.engineId}@${bnd.engineVersion}`, bnd);
    bundlesByEngineAndVersion.set(bnd.engineId, bnd);
    bundlesByHash.set(bnd.bundleHash, bnd);
    activeEngineVersionByEngineId.set(bnd.engineId, bnd.engineVersion);
  }

  singletonStoreV03 = {
    knowledgeLedger,
    identityLedger,
    universesByIdAndVersion,
    universesByHash,
    bundlesByEngineAndVersion,
    bundlesByHash,
    activeEngineVersionByEngineId,
    evidenceRefsById,
    receiptsById,
    authorizationsById,
  };
  return singletonStoreV03;
}

export async function handleV03EvaluateRequest(
  rawBody: Record<string, unknown>,
  options?: { adminToken?: string },
): Promise<V03EvaluationResult> {
  const store = getV03RuntimeStore();
  const engineId = String(rawBody.engineId ?? "");
  const version =
    typeof rawBody.engineVersion === "string"
      ? rawBody.engineVersion
      : store.activeEngineVersionByEngineId.get(engineId) ?? "0.3.0";

  const bundle =
    store.bundlesByEngineAndVersion.get(`${engineId}@${version}`) ??
    store.bundlesByEngineAndVersion.get(engineId);
  if (!bundle) {
    throw new Error(`UNKNOWN_ENGINE_OR_VERSION: "${engineId}@${version}" not found.`);
  }
  const universe = store.universesByHash.get(bundle.universeHash)!;

  const normalizedInputs = ((rawBody.inputs ?? rawBody.constraints) ?? {}) as Record<
    string,
    unknown
  >;
  const normalizedRawBody: Record<string, unknown> = {
    ...rawBody,
    inputs: normalizedInputs,
  };

  let result: V03EvaluationResult;
  if (rawBody.mode === "admin_simulation") {
    result = await simulateAdministrativeV03({
      adminToken: options?.adminToken,
      bundle,
      universe,
      ledger: store.knowledgeLedger,
      inputs: normalizedInputs,
      validAtIso:
        typeof rawBody.validAt === "string" ? rawBody.validAt : new Date().toISOString(),
      simulatedKnowledgeCutoffIso:
        typeof rawBody.simulatedKnowledgeCutoff === "string"
          ? rawBody.simulatedKnowledgeCutoff
          : new Date().toISOString(),
    });
  } else {
    result = await evaluateCurrentV03({
      rawClientRequestBody: normalizedRawBody,
      bundle,
      universe,
      ledger: store.knowledgeLedger,
    });
  }

  store.receiptsById.set(result.receiptId, {
    receipt: result.receipt,
    inputs: normalizedInputs,
  });
  return result;
}

export async function handleV03ReplayReceiptRequest(receiptId: string) {
  const store = getV03RuntimeStore();
  const stored = store.receiptsById.get(receiptId);
  if (!stored) {
    throw new Error(`RECEIPT_NOT_FOUND: Receipt "${receiptId}" not found in v0.3 runtime store.`);
  }
  return replayHistoricalReceiptV03({
    receipt: stored.receipt,
    originalInputs: stored.inputs,
    bundlesByHash: store.bundlesByHash,
    universesByHash: store.universesByHash,
    ledger: store.knowledgeLedger,
  });
}

export async function handleV03IssueShadowAuthorization(params: {
  receiptId: string;
  targetAdapter?: CommerceAdapterTarget;
  maxPriceUsdDecimal?: number;
  serviceDate?: string;
  passengerCount?: number;
}) {
  const store = getV03RuntimeStore();
  const stored = store.receiptsById.get(params.receiptId);
  if (!stored) {
    throw new Error(
      `RECEIPT_NOT_FOUND: Receipt "${params.receiptId}" not found in v0.3 runtime store.`,
    );
  }
  const universe = store.universesByHash.get(stored.receipt.payload.candidateUniverseHash);
  const topCandidate =
    universe?.includedCandidates.find(
      (c) => c.candidateDccEntityId === stored.receipt.payload.recommendedCandidateDccId,
    ) ?? universe?.includedCandidates[0];

  const targetAdapter: CommerceAdapterTarget = params.targetAdapter ?? "octo";
  const issued = await issueShadowDecisionAuthorization({
    receipt: stored.receipt,
    permittedAction: "shadow_checkout_intent_preparation",
    providerProductReference: {
      candidateDccEntityId:
        topCandidate?.candidateDccEntityId ?? "dcc:ent:tour_candidate:000000000000000000000000",
      operatorDccEntityId:
        topCandidate?.operatorDccEntityId ?? "dcc:ent:operator:000000000000000000000000",
      displayName: topCandidate?.displayName ?? "DCC Verified Excursion",
      externalAliases: {
        octo_product_id: topCandidate?.legacyCandidateCode ?? "octo:dcc-shadow-sku",
      },
    },
    maxPriceUsdDecimal: params.maxPriceUsdDecimal ?? 625,
    requiredParameters: {
      serviceDate: params.serviceDate ?? stored.receipt.payload.validAt.slice(0, 10),
      passengerCount: params.passengerCount ?? 2,
      luggageSkiBagCount: 2,
      pickupNodeCode: "DEFAULT-PICKUP",
      dropoffNodeCode: "DEFAULT-DROPOFF",
    },
    additionalRevalidationRequirements: [
      "driver_availability",
      "vehicle_availability",
      "road_safety",
      "weather_suitability",
      "live_inventory_confirmation",
    ],
    targetAdapter,
  });
  store.authorizationsById.set(
    issued.signedAuthorization.authorizationId,
    issued.signedAuthorization,
  );
  const outcomeEvent = store.knowledgeLedger.appendEvent({
    eventType: "shadow_authorization_dry_run_recorded",
    claimId: `shadow-outcome:${issued.signedAuthorization.authorizationId}`,
    claimVersionId: `shadow-outcome:${issued.signedAuthorization.authorizationId}:v1`,
    recordedAt: issued.signedAuthorization.payload.issuedAt,
    actorId: "dcc-v031-shadow-commerce-auditor",
    isSynthetic: false,
    provenanceClass: "operational_evidence",
    reason: `Shadow authorization ${issued.signedAuthorization.authorizationId} bound to receipt ${stored.receipt.receiptId} (resultHash=${stored.receipt.payload.resultHash}) validated via ${targetAdapter} shadow adapter with liveExternalCallsMade=0 and executionMode=shadow_only_no_side_effects.`,
  });
  return {
    ...issued,
    ledgerShadowOutcomeEvent: {
      eventId: outcomeEvent.eventId,
      eventHash: outcomeEvent.eventHash,
      eventType: outcomeEvent.eventType,
      recordedAt: outcomeEvent.recordedAt,
    },
  };
}

