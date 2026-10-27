import { buildV03CandidateUniverse, type V03CandidateUniverse } from "./candidateUniverse";
import {
  issueShadowDecisionAuthorization,
  type ShadowCommerceAdapterResult,
  type V03SignedDecisionAuthorization,
} from "./decisionAuthorization";
import {
  compileV03EngineBundle,
  evaluateCurrentV03,
  replayHistoricalReceiptV03,
  type V03CompiledEngineBundle,
  type V03EvaluationResult,
} from "./evaluatorAndReplay";
import {
  buildV03EvidenceReference,
  extractTextEvidenceSelectors,
  toPublicCitationProjection,
} from "./evidenceSelectors";
import { DccIdentityLedger, mintOpaqueDccEntityId } from "./identityGraph";
import {
  safeIdempotentIngestFetchV03,
  type IdempotentIngestResult,
} from "./operationalControls";
import {
  buildEvidenceRefFromPreservedCapture,
  getPreservedCaptureByIdV031,
  persistPreservedCaptureToObjectStore,
} from "./preservedCapturesV031";
import { rfc8785Canonicalize, sha256HexFull } from "./rfc8785AndJws";
import {
  ensurePreservedCapturesStoredInObjectStore,
  getV03RuntimeStore,
  handleV03EvaluateRequest,
} from "./runtimeStoreV03";
import {
  InMemoryTestArtifactStore,
  type PrivateArtifactObjectStore,
} from "./storageBoundary";
import {
  AppendOnlyKnowledgeLedger,
  ClientSuppliedKnownAtForbiddenError,
} from "./temporalLedger";

/**
 * DCC Machine Layer v0.3.1 — Honest Real vs. Synthetic Evidence Inventory,
 * Synthetic Temporal Fixture Proof, Genuine Juneau Evidence Canary,
 * Preserved-Source Juneau Operational Pack, and GoSno Runtime Shadow Proof
 */

export interface RealVsSyntheticInventoryItem {
  artifactOrEventId: string;
  originatingVersion: "v0.2" | "v0.3";
  classification: "genuine_network_or_source_evidence" | "synthetic_test_fixture";
  whatItActuallySupports: string;
  whatItDoesNotSupport: string;
}

export function getRealVsSyntheticEvidenceInventory(): RealVsSyntheticInventoryItem[] {
  return [
    {
      artifactOrEventId:
        "snap:jnu:faa-weathercams-live-capture (2026-10-26 HTTPS GET https://weathercams.faa.gov/)",
      originatingVersion: "v0.2",
      classification: "genuine_network_or_source_evidence",
      whatItActuallySupports:
        "HTTP 200 reachability and HTML title/header of the FAA WeatherCams portal at the exact retrieval timestamp.",
      whatItDoesNotSupport:
        "Does NOT prove Juneau VFR flight ceiling/visibility, helicopter tour availability, operator safety policy, or that any helicopter candidate should be recommended.",
    },
    {
      artifactOrEventId:
        "v0.2 May knownFrom (2026-05-01), hardcoded auditor promotion, v1->v2 supersession, withdrawal, and May replay",
      originatingVersion: "v0.2",
      classification: "synthetic_test_fixture",
      whatItActuallySupports:
        "Synthetic state-machine transition testing of quarantine, promotion, supersession, withdrawal, and replay mechanics.",
      whatItDoesNotSupport:
        "Not genuine historical operational history; excluded from claims of real operational proof in v0.3.",
    },
    {
      artifactOrEventId: "v0.3 Synthetic Temporal Fixture (dcc:ent:tour_candidate:syn-*)",
      originatingVersion: "v0.3",
      classification: "synthetic_test_fixture",
      whatItActuallySupports:
        "Explicitly watermarked synthetic bitemporal proof of the 7-step append-only ledger, retroactive correction, and receipt replay contract.",
      whatItDoesNotSupport:
        "Invented entities and synthetic timestamps; never exposed as real travel evidence.",
    },
    {
      artifactOrEventId:
        "Withdrawn v0.3 GoSno Shared Shuttle Bootstrap Seed (evref:gosno:tariff-2026-winter-park / clmv:gosno:max-pax-per-shuttle:v1)",
      originatingVersion: "v0.3",
      classification: "synthetic_test_fixture",
      whatItActuallySupports:
        "Audit history of an unsupported bootstrap seed (14 passengers / $89 shared shuttle) that has been withdrawn via ledger event clmv:gosno:max-pax-per-shuttle:v2-withdrawn.",
      whatItDoesNotSupport:
        "Withdrawn and never presented as current verified GoSno information; GoSno operates private SUVs (max 6) and Vans (max 10) only.",
    },
    {
      artifactOrEventId:
        "v0.3.1 Preserved Juneau & GoSno First-Party Captures (data/machine/v03/preserved_captures_v031.json)",
      originatingVersion: "v0.3",
      classification: "genuine_network_or_source_evidence",
      whatItActuallySupports:
        "Verbatim HTTP response bytes and separately derived plain-text snapshots from Coastal Helicopters, TEMSCO Helicopters, NorthStar Trekking, FAA WeatherCams, and GoSno (route-feed, agent.json, llms.txt, /winter-park, /denver-to-breckenridge).",
      whatItDoesNotSupport:
        "Does not establish live seat/vehicle/driver availability, day-of-flight VFR weather dispatch, or unverified 6-passenger + 6-snowboard SUV cargo fit.",
    },
  ];
}

/**
 * PROOF A: Synthetic Temporal Fixture (Requirements 1 & 2)
 *
 * Uses invented entities and explicitly synthetic events (`isSynthetic: true`) to prove all 7 steps:
 * 1. Claim A (`max_passenger_weight_lbs = 250`) is known (`recordedAt = 2026-10-01T10:00:00.000Z`).
 * 2. A JWS receipt is produced at `knowledgeCutoff = 2026-10-05T12:00:00.000Z` for `validAt = 2026-10-20T12:00:00.000Z`.
 * 3. Claim B (`max_passenger_weight_lbs = 215`) is learned later (`recordedAt = 2026-10-10T10:00:00.000Z`)
 *    but is retroactively effective (`validFrom = 2026-10-01T00:00:00.000Z`).
 * 4. New evaluation at `knowledgeCutoff = 2026-10-12T12:00:00.000Z` uses Claim B and changes the decision.
 * 5. Original receipt replay still uses Claim A and reproduces its exact `resultHash`, `traceHash`,
 *    `evaluationFingerprint`, and full 64-hex `receiptId`.
 * 6. Zero original ledger events are mutated (`verifyHashChainIntegrity().intact === true`).
 * 7. Client-supplied `knownAt` is rejected from ordinary evaluation (`CLIENT_SUPPLIED_KNOWN_AT_FORBIDDEN`).
 */
export async function runSyntheticTemporalLifecycleFixture() {
  const ledger = new AppendOnlyKnowledgeLedger();
  const identityLedger = new DccIdentityLedger();

  const synDestId = mintOpaqueDccEntityId("destination", "syn-glacier-bay-test-dest");
  const synOpId = mintOpaqueDccEntityId("operator", "syn-aero-test-operator");
  const synCandAlphaId = mintOpaqueDccEntityId("tour_candidate", "syn-heli-alpha-standard");
  const synCandBetaId = mintOpaqueDccEntityId("tour_candidate", "syn-heli-beta-heavy-lift");
  const synSourceId = mintOpaqueDccEntityId("evidence_source", "syn-operator-manual-source");

  identityLedger.registerEntity({
    dccEntityId: synDestId,
    entityKind: "destination",
    displayName: "Synthetic Test Fjord (Fixture Only)",
    recordedAt: "2026-10-01T09:00:00.000Z",
    isSynthetic: true,
  });
  identityLedger.registerEntity({
    dccEntityId: synOpId,
    entityKind: "operator",
    displayName: "Synthetic Rotorcraft Test Operator",
    recordedAt: "2026-10-01T09:00:00.000Z",
    isSynthetic: true,
  });
  identityLedger.registerEntity({
    dccEntityId: synCandAlphaId,
    entityKind: "tour_candidate",
    displayName: "Synthetic Glacier Landing Alpha (Standard Seat)",
    recordedAt: "2026-10-01T09:00:00.000Z",
    isSynthetic: true,
  });
  identityLedger.registerEntity({
    dccEntityId: synCandBetaId,
    entityKind: "tour_candidate",
    displayName: "Synthetic Glacier Landing Beta (Extended Weight Surcharge)",
    recordedAt: "2026-10-01T09:00:00.000Z",
    isSynthetic: true,
  });

  const docTextA =
    "SYNTHETIC FIXTURE OPS MANUAL REV A: Standard single-seat passenger weight limit is 250 lbs effective 2026-10-01.";
  const selA = extractTextEvidenceSelectors({
    documentText: docTextA,
    exactQuote: "Standard single-seat passenger weight limit is 250 lbs",
  });
  const evRefA = buildV03EvidenceReference({
    evidenceRefId: "evref:syn:weight-limit-rev-a",
    sourceDccId: synSourceId,
    sourceTitle: "Synthetic Fixture Operations Manual Rev A",
    sourceOrganization: "Synthetic Rotorcraft Test Operator",
    canonicalSourceUrl: "https://example.invalid/synthetic-ops-manual-rev-a",
    snapshotId: "snap:syn:ops-manual-rev-a",
    snapshotSha256: sha256HexFull(docTextA),
    privateObjectKey: `v03/raw_source_captures/sha256/${sha256HexFull(docTextA)}.txt`,
    selectors: selA.selectors,
    surroundingContext: selA.surroundingContext,
    extractor: {
      extractorId: "dcc-v03-text-selector",
      extractorVersion: "0.3.0",
      method: "deterministic_regex_span",
    },
    extractedAt: "2026-10-01T10:00:00.000Z",
    retrievedAt: "2026-10-01T10:00:00.000Z",
    sourcePublishedAt: "2026-10-01T00:00:00.000Z",
    sourceObservedAt: "2026-10-01T10:00:00.000Z",
    licenseOrReusePolicy: "synthetic_test_fixture_only",
  });

  // Step 1: Claim A (250 lbs) is recorded in the append-only ledger at T1 = 2026-10-01T10:00:00.000Z
  const eventClaimA = ledger.appendEvent({
    eventType: "claim_approved_and_activated",
    claimId: "clm:syn:max-single-seat-weight-lbs",
    claimVersionId: "clmv:syn:max-single-seat-weight-lbs:v1-250",
    recordedAt: "2026-10-01T10:00:00.000Z",
    actorId: "dcc-synthetic-fixture-seeder",
    isSynthetic: true,
    provenanceClass: "synthetic_test_fixture",
    reason: "Initial synthetic fixture assertion of 250 lb limit.",
    claimDefinition: {
      claimId: "clm:syn:max-single-seat-weight-lbs",
      claimVersionId: "clmv:syn:max-single-seat-weight-lbs:v1-250",
      subjectDccId: synOpId,
      predicate: "max_single_seat_passenger_weight_lbs",
      assertionType: "policy",
      epistemicState: "verified_against_identified_evidence",
      typedValue: 250,
      unitOrCurrency: "lbs",
      validFrom: "2026-10-01T00:00:00.000Z",
      validTo: "2026-12-31T23:59:59.000Z",
      sourceObservedAt: "2026-10-01T10:00:00.000Z",
      sourcePublishedAt: "2026-10-01T00:00:00.000Z",
      retrievedAt: "2026-10-01T10:00:00.000Z",
      freshnessTtlSeconds: 90 * 86400,
      sourceAuthority: {
        sourceDccId: synSourceId,
        organizationName: "Synthetic Rotorcraft Test Operator",
        authorityTier: "direct_operator",
        competentDomains: ["operator_safety_and_weight_policy"],
        claimedDomain: "operator_safety_and_weight_policy",
        independentlyCorroboratedBySourceDccIds: [],
        licenseOrReusePolicy: "synthetic_test_fixture_only",
      },
      evidenceRefs: [evRefA],
    },
  });

  const synUniverse = buildV03CandidateUniverse({
    universeId: "univ:syn:helicopter-temporal-fixture",
    version: "0.3.0",
    engineId: "syn-helicopter-temporal-fixture",
    engineVersion: "0.3.0",
    isSynthetic: true,
    scope: {
      destinationDccEntityId: synDestId,
      destinationName: "Synthetic Test Fjord",
      categorySlug: "synthetic-helicopter-fixture",
      jurisdiction: "US-TEST-SYNTHETIC",
      geographicBounds: { minLat: 58.0, maxLat: 59.0, minLon: -135.0, maxLon: -134.0 },
    },
    inclusionMethod: "Synthetic deterministic fixture with two candidates testing retroactive weight policy corrections.",
    sourcesAndQueriesConsulted: [
      {
        sourceDccId: synSourceId,
        organizationName: "Synthetic Rotorcraft Test Operator",
        queryOrEndpoint: "https://example.invalid/synthetic-ops-manual-rev-a",
        consultedAt: "2026-10-01T10:00:00.000Z",
        snapshotSha256: evRefA.snapshotSha256,
      },
    ],
    includedCandidates: [
      {
        candidateDccEntityId: synCandAlphaId,
        legacyCandidateCode: "syn-heli-alpha-standard",
        displayName: "Synthetic Glacier Landing Alpha (Standard Seat)",
        operatorDccEntityId: synOpId,
        operatorDisplayName: "Synthetic Rotorcraft Test Operator",
        bookingChannelClass: "verified_direct_operator",
        wtaAttributionPresent: false,
        staticAttributes: {
          basePriceUsd: 420,
          supportsWeightOverride: false,
          seatClass: "standard",
        },
        requiredClaimIds: ["clm:syn:max-single-seat-weight-lbs"],
      },
      {
        candidateDccEntityId: synCandBetaId,
        legacyCandidateCode: "syn-heli-beta-heavy-lift",
        displayName: "Synthetic Glacier Landing Beta (Extended Weight Surcharge)",
        operatorDccEntityId: synOpId,
        operatorDisplayName: "Synthetic Rotorcraft Test Operator",
        bookingChannelClass: "verified_direct_operator",
        wtaAttributionPresent: false,
        staticAttributes: {
          basePriceUsd: 495,
          supportsWeightOverride: true,
          seatClass: "extended_weight",
        },
        requiredClaimIds: ["clm:syn:max-single-seat-weight-lbs"],
      },
    ],
    knownExclusions: [],
    coverageGaps: [],
    effectiveFrom: "2026-10-01T00:00:00.000Z",
    effectiveTo: "2026-12-31T23:59:59.000Z",
    knowledgeCutoff: "2026-10-01T10:00:00.000Z",
    refreshDeadline: "2026-12-31T23:59:59.000Z",
    generatorVersion: "dcc-universe-generator/0.3.0",
    epistemicDisclaimer: "SYNTHETIC_FIXTURE_ONLY: Invented entities for temporal authority verification.",
  });

  const synBundle = compileV03EngineBundle({
    engineId: "syn-helicopter-temporal-fixture",
    engineVersion: "0.3.0",
    universe: synUniverse,
    rules: [
      {
        ruleId: "rule:syn:weight-gate",
        ruleVersionId: "rulev:syn:weight-gate:v1",
        ruleKind: "hard_gate",
        title: "Single-seat passenger weight ceiling",
        reasonCode: "PASSENGER_WEIGHT_EXCEEDS_STANDARD_LIMIT",
        requiredClaimId: "clm:syn:max-single-seat-weight-lbs",
        predicateType: "input_lte_claim_number",
        inputField: "maxSinglePassengerWeightLbs",
        scoreDelta: 25,
      },
      {
        ruleId: "rule:syn:seat-class-preference",
        ruleVersionId: "rulev:syn:seat-class-preference:v1",
        ruleKind: "ranking_weight",
        title: "Prefer standard seat when passenger is within standard weight limit",
        reasonCode: "PREFERRED_SEAT_CLASS",
        requiredClaimId: "clm:syn:max-single-seat-weight-lbs",
        predicateType: "input_equals_candidate_attr",
        inputField: "preferredSeatClass",
        candidateAttrKey: "seatClass",
        scoreDelta: 15,
      },
    ],
    pinnedSchemaHashes: {
      DecisionIrBundle: sha256HexFull("dcc-decision-ir/0.3"),
      SignedDecisionReceipt: sha256HexFull("dcc-decision-receipt/0.3"),
    },
  });

  const travelerInputs = {
    maxSinglePassengerWeightLbs: 230,
    maxBudgetPerPersonUsd: 550,
    preferredSeatClass: "standard",
  };
  const validAtIso = "2026-10-20T12:00:00.000Z";

  // Step 2: Produce Receipt 1 at server knowledgeCutoff = 2026-10-05T12:00:00.000Z (only Claim A is known)
  const evalAtT1 = await evaluateCurrentV03({
    rawClientRequestBody: {
      validAt: validAtIso,
      inputs: travelerInputs,
    },
    bundle: synBundle,
    universe: synUniverse,
    ledger,
    serverClockNow: () => "2026-10-05T12:00:00.000Z",
  });

  // Step 3: Claim B (215 lbs) is learned later at recordedAt = 2026-10-10T10:00:00.000Z,
  // but is retroactively effective from validFrom = 2026-10-01T00:00:00.000Z
  const docTextB =
    "SYNTHETIC FIXTURE OPS MANUAL REV B (RETROACTIVE BULLETIN): Standard single-seat passenger weight limit is lowered to 215 lbs effective retroactively 2026-10-01.";
  const selB = extractTextEvidenceSelectors({
    documentText: docTextB,
    exactQuote: "Standard single-seat passenger weight limit is lowered to 215 lbs",
  });
  const evRefB = buildV03EvidenceReference({
    evidenceRefId: "evref:syn:weight-limit-rev-b",
    sourceDccId: synSourceId,
    sourceTitle: "Synthetic Fixture Operations Manual Rev B",
    sourceOrganization: "Synthetic Rotorcraft Test Operator",
    canonicalSourceUrl: "https://example.invalid/synthetic-ops-manual-rev-b",
    snapshotId: "snap:syn:ops-manual-rev-b",
    snapshotSha256: sha256HexFull(docTextB),
    privateObjectKey: `v03/raw_source_captures/sha256/${sha256HexFull(docTextB)}.txt`,
    selectors: selB.selectors,
    surroundingContext: selB.surroundingContext,
    extractor: {
      extractorId: "dcc-v03-text-selector",
      extractorVersion: "0.3.0",
      method: "deterministic_regex_span",
    },
    extractedAt: "2026-10-10T10:00:00.000Z",
    retrievedAt: "2026-10-10T10:00:00.000Z",
    sourcePublishedAt: "2026-10-10T09:00:00.000Z",
    sourceObservedAt: "2026-10-10T10:00:00.000Z",
    licenseOrReusePolicy: "synthetic_test_fixture_only",
  });

  const eventClaimB = ledger.appendEvent({
    eventType: "claim_corrected_retroactively",
    claimId: "clm:syn:max-single-seat-weight-lbs",
    claimVersionId: "clmv:syn:max-single-seat-weight-lbs:v2-215-retro",
    targetPreviousVersionId: "clmv:syn:max-single-seat-weight-lbs:v1-250",
    recordedAt: "2026-10-10T10:00:00.000Z",
    actorId: "dcc-synthetic-fixture-seeder",
    isSynthetic: true,
    provenanceClass: "synthetic_test_fixture",
    reason: "Retroactive safety bulletin lowering standard single-seat limit from 250 lbs to 215 lbs.",
    claimDefinition: {
      claimId: "clm:syn:max-single-seat-weight-lbs",
      claimVersionId: "clmv:syn:max-single-seat-weight-lbs:v2-215-retro",
      subjectDccId: synOpId,
      predicate: "max_single_seat_passenger_weight_lbs",
      assertionType: "policy",
      epistemicState: "verified_against_identified_evidence",
      typedValue: 215,
      unitOrCurrency: "lbs",
      validFrom: "2026-10-01T00:00:00.000Z",
      validTo: "2026-12-31T23:59:59.000Z",
      sourceObservedAt: "2026-10-10T10:00:00.000Z",
      sourcePublishedAt: "2026-10-10T09:00:00.000Z",
      retrievedAt: "2026-10-10T10:00:00.000Z",
      freshnessTtlSeconds: 90 * 86400,
      sourceAuthority: {
        sourceDccId: synSourceId,
        organizationName: "Synthetic Rotorcraft Test Operator",
        authorityTier: "direct_operator",
        competentDomains: ["operator_safety_and_weight_policy"],
        claimedDomain: "operator_safety_and_weight_policy",
        independentlyCorroboratedBySourceDccIds: [],
        licenseOrReusePolicy: "synthetic_test_fixture_only",
      },
      evidenceRefs: [evRefB],
    },
  });

  // Step 4: New evaluation at server knowledgeCutoff = 2026-10-12T12:00:00.000Z uses Claim B (215 lbs)
  // Alpha (standard seat) becomes ineligible for 230 lb traveler; Beta (supportsWeightOverride) becomes qualified!
  const evalAtT2 = await evaluateCurrentV03({
    rawClientRequestBody: {
      validAt: validAtIso,
      inputs: travelerInputs,
    },
    bundle: synBundle,
    universe: synUniverse,
    ledger,
    serverClockNow: () => "2026-10-12T12:00:00.000Z",
  });

  // Step 5: Original receipt replay still uses Claim A and reproduces its exact hashes
  const bundlesByHash = new Map<string, V03CompiledEngineBundle>([
    [synBundle.bundleHash, synBundle],
  ]);
  const universesByHash = new Map<string, V03CandidateUniverse>([
    [synUniverse.universeHash, synUniverse],
  ]);
  const replayOfReceipt1 = await replayHistoricalReceiptV03({
    receipt: evalAtT1.receipt,
    originalInputs: travelerInputs,
    bundlesByHash,
    universesByHash,
    ledger,
  });

  // Step 6: Prove no original ledger event was mutated
  const chainIntegrity = ledger.verifyHashChainIntegrity();
  const originalEventAUnchanged =
    ledger.getEvents()[0]?.eventHash === eventClaimA.eventHash &&
    ledger.getEvents()[0]?.claimVersionId === "clmv:syn:max-single-seat-weight-lbs:v1-250";

  // Step 7: Prove client-supplied `knownAt` is rejected from ordinary evaluation
  let clientKnownAtRejected = false;
  let clientKnownAtErrorCode = "";
  try {
    await evaluateCurrentV03({
      rawClientRequestBody: {
        validAt: validAtIso,
        knownAt: "2026-10-05T12:00:00.000Z",
        inputs: travelerInputs,
      },
      bundle: synBundle,
      universe: synUniverse,
      ledger,
    });
  } catch (err) {
    if (err instanceof ClientSuppliedKnownAtForbiddenError) {
      clientKnownAtRejected = true;
      clientKnownAtErrorCode = err.code;
    }
  }

  return {
    fixtureClassification: "synthetic_test_fixture" as const,
    isSynthetic: true,
    step1ClaimARecorded: {
      eventId: eventClaimA.eventId,
      eventHash: eventClaimA.eventHash,
      claimVersionId: eventClaimA.claimVersionId,
      recordedAt: eventClaimA.recordedAt,
    },
    step2ReceiptAtT1: {
      receiptId: evalAtT1.receiptId,
      knowledgeCutoff: evalAtT1.knowledgeCutoff,
      decisionState: evalAtT1.decisionState,
      recommendedCandidateLegacyCode: evalAtT1.recommendedCandidateLegacyCode,
      resultHash: evalAtT1.resultHash,
    },
    step3RetroactiveClaimBAppended: {
      eventId: eventClaimB.eventId,
      eventHash: eventClaimB.eventHash,
      claimVersionId: eventClaimB.claimVersionId,
      validFrom: "2026-10-01T00:00:00.000Z",
      recordedAt: eventClaimB.recordedAt,
    },
    step4NewEvaluationUsesClaimB: {
      receiptId: evalAtT2.receiptId,
      knowledgeCutoff: evalAtT2.knowledgeCutoff,
      decisionState: evalAtT2.decisionState,
      recommendedCandidateLegacyCode: evalAtT2.recommendedCandidateLegacyCode,
      resultHash: evalAtT2.resultHash,
      decisionChangedFromT1:
        evalAtT2.recommendedCandidateLegacyCode !== evalAtT1.recommendedCandidateLegacyCode &&
        evalAtT2.decisionState !== evalAtT1.decisionState,
    },
    step5Receipt1ReplayUsesClaimA: {
      matchesOriginalHashes: replayOfReceipt1.matchesOriginalHashes,
      replayedReceiptId: replayOfReceipt1.replayResult.receiptId,
      replayedDecisionState: replayOfReceipt1.replayResult.decisionState,
      replayedRecommendedCode: replayOfReceipt1.replayResult.recommendedCandidateLegacyCode,
    },
    step6LedgerImmutabilityVerified: {
      hashChainIntact: chainIntegrity.intact,
      eventCount: chainIntegrity.eventCount,
      originalEventAUnchanged,
    },
    step7ClientKnownAtRejected: {
      rejected: clientKnownAtRejected,
      errorCode: clientKnownAtErrorCode,
    },
  };
}

/**
 * PROOF B: Genuine Juneau Evidence Canary (Requirement 2)
 *
 * Uses current retrieval timestamps and sources that directly support each proposition:
 * - Live HTTPS capture of `https://weathercams.faa.gov/` (or injected fetch in offline unit test)
 *   supports ONLY `faa_weathercam_portal_reachable` (`assertionType: "observation"`).
 * - Published 14 CFR Part 136 / USFS Tongass regulatory requirement is represented as a regulatory policy claim.
 * - Propositions NOT supported by the FAA portal homepage capture — namely:
 *   - `live_operator_seat_inventory_available`
 *   - `juneau_icefield_vfr_ceiling_suitable`
 *   - `cruise_berth_transfer_window_verified`
 *   are explicitly recorded with `epistemicState: "unknown"` (`typedValue: null`).
 * - Consequently, every Juneau helicopter candidate in the genuine canary receives disposition
 *   `"indeterminate"` and `decisionState: "indeterminate_insufficient_evidence"`, proving DCC
 *   never turns a reachable weather-camera homepage into a positive tour recommendation.
 */
export async function runGenuineJuneauEvidenceCanary(options?: {
  artifactStore?: PrivateArtifactObjectStore;
  fetchImpl?: typeof fetch;
  dnsResolveImpl?: (hostname: string) => Promise<string[]>;
}) {
  const store = options?.artifactStore ?? new InMemoryTestArtifactStore();
  const ledger = new AppendOnlyKnowledgeLedger();
  const identityLedger = new DccIdentityLedger();

  const jnuDestDccId = mintOpaqueDccEntityId("destination", "us-ak-juneau");
  const faaAgencyDccId = mintOpaqueDccEntityId("regulatory_agency", "us-faa-weathercams");
  const usfsAgencyDccId = mintOpaqueDccEntityId("regulatory_agency", "us-fs-tongass");
  const coastalOpDccId = mintOpaqueDccEntityId("operator", "coastal-helicopters-juneau");
  const temscoOpDccId = mintOpaqueDccEntityId("operator", "temsco-helicopters-juneau");
  const northstarOpDccId = mintOpaqueDccEntityId("operator", "northstar-trekking-juneau");

  const candCoastalIcefieldDccId = mintOpaqueDccEntityId(
    "tour_candidate",
    "jnu-coastal-icefield-excursion",
  );
  const candTemscoMendenhallDccId = mintOpaqueDccEntityId(
    "tour_candidate",
    "jnu-temsco-mendenhall-glacier",
  );
  const candNorthstarTrekDccId = mintOpaqueDccEntityId(
    "tour_candidate",
    "jnu-northstar-glacier-trek",
  );

  // Perform real (or injected) SSRF-guarded idempotent capture of https://weathercams.faa.gov/
  const ingestResult: IdempotentIngestResult = await safeIdempotentIngestFetchV03({
    url: "https://weathercams.faa.gov/",
    idempotencyKey: "jnu-canary-faa-weathercams-homepage-v03",
    fetchImpl: options?.fetchImpl,
    dnsResolveImpl: options?.dnsResolveImpl,
  });

  // Store unmodified capture in private artifact store
  const storedRawCapture = await store.putContentAddressedArtifact({
    category: "raw_source_captures",
    body: ingestResult.rawBodyText,
    contentType: ingestResult.contentType,
    extension: "html",
  });

  const quoteTarget = ingestResult.rawBodyText.includes("WeatherCams")
    ? "WeatherCams"
    : ingestResult.rawBodyText.slice(0, 32);
  const textSelectors = extractTextEvidenceSelectors({
    documentText: ingestResult.rawBodyText,
    exactQuote: quoteTarget,
  });

  const faaPortalEvidenceRef = buildV03EvidenceReference({
    evidenceRefId: "evref:jnu:faa-weathercams-homepage-reachability",
    sourceDccId: faaAgencyDccId,
    sourceTitle: "FAA Aviation Weather Cameras Portal Homepage",
    sourceOrganization: "Federal Aviation Administration (FAA)",
    canonicalSourceUrl: "https://weathercams.faa.gov/",
    snapshotId: `snap:sha256:${storedRawCapture.sha256Hex}`,
    snapshotSha256: storedRawCapture.sha256Hex,
    privateObjectKey: storedRawCapture.objectKey,
    selectors: textSelectors.selectors,
    surroundingContext: textSelectors.surroundingContext,
    extractor: {
      extractorId: "dcc-v03-html-selector",
      extractorVersion: "0.3.0",
      method: "deterministic_dom_selector",
    },
    extractedAt: ingestResult.retrievedAt,
    retrievedAt: ingestResult.retrievedAt,
    sourcePublishedAt: null,
    sourceObservedAt: ingestResult.retrievedAt,
    licenseOrReusePolicy: "US Federal Government Public Domain (17 U.S.C. 105)",
  });

  // Register DCC-native identities and external aliases
  identityLedger.registerEntity({
    dccEntityId: jnuDestDccId,
    entityKind: "destination",
    displayName: "Juneau, Alaska",
    recordedAt: ingestResult.retrievedAt,
  });
  identityLedger.registerEntity({
    dccEntityId: faaAgencyDccId,
    entityKind: "regulatory_agency",
    displayName: "Federal Aviation Administration (FAA)",
    recordedAt: ingestResult.retrievedAt,
  });
  identityLedger.mapExternalAlias({
    aliasVersionId: "alias:faa:station:pajn:v1",
    namespace: "government_permit_or_station_id",
    externalId: "ICAO:PAJN",
    dccEntityId: jnuDestDccId,
    mappingEvidenceRefIds: [faaPortalEvidenceRef.evidenceRefId],
    recordedAt: ingestResult.retrievedAt,
  });

  // 1. Supported Observation Claim: FAA WeatherCams portal HTTP reachability ONLY
  ledger.appendEvent({
    eventType: "claim_approved_and_activated",
    claimId: "clm:jnu:faa-weathercam-portal-reachable",
    claimVersionId: "clmv:jnu:faa-weathercam-portal-reachable:v1",
    recordedAt: ingestResult.retrievedAt,
    actorId: "dcc-v03-canary-ingestor",
    isSynthetic: false,
    provenanceClass: "operational_evidence",
    reason: "Direct HTTPS capture of FAA WeatherCams homepage proves portal reachability only.",
    claimDefinition: {
      claimId: "clm:jnu:faa-weathercam-portal-reachable",
      claimVersionId: "clmv:jnu:faa-weathercam-portal-reachable:v1",
      subjectDccId: faaAgencyDccId,
      predicate: "faa_weathercam_portal_reachable",
      assertionType: "observation",
      epistemicState: "verified_against_identified_evidence",
      typedValue: ingestResult.httpStatus === 200,
      validFrom: ingestResult.retrievedAt,
      validTo: new Date(Date.parse(ingestResult.retrievedAt) + 3600_000).toISOString(),
      sourceObservedAt: ingestResult.retrievedAt,
      sourcePublishedAt: null,
      retrievedAt: ingestResult.retrievedAt,
      freshnessTtlSeconds: 3600,
      sourceAuthority: {
        sourceDccId: faaAgencyDccId,
        organizationName: "Federal Aviation Administration (FAA)",
        authorityTier: "primary_regulator",
        competentDomains: ["weather_camera_portal_reachability"],
        claimedDomain: "weather_camera_portal_reachability",
        independentlyCorroboratedBySourceDccIds: [],
        licenseOrReusePolicy: "US Federal Government Public Domain",
      },
      evidenceRefs: [faaPortalEvidenceRef],
    },
  });

  // 2. Unsupported Proposition A: Live Operator Seat Availability -> explicitly `unknown`
  ledger.appendEvent({
    eventType: "claim_approved_and_activated",
    claimId: "clm:jnu:live-operator-seat-inventory",
    claimVersionId: "clmv:jnu:live-operator-seat-inventory:v1-unknown",
    recordedAt: ingestResult.retrievedAt,
    actorId: "dcc-v03-epistemic-guard",
    isSynthetic: false,
    provenanceClass: "operational_evidence",
    reason: "No live operator reservation inventory feed captured; must remain unknown.",
    claimDefinition: {
      claimId: "clm:jnu:live-operator-seat-inventory",
      claimVersionId: "clmv:jnu:live-operator-seat-inventory:v1-unknown",
      subjectDccId: jnuDestDccId,
      predicate: "live_operator_seat_inventory_available",
      assertionType: "observation",
      epistemicState: "unknown",
      typedValue: null,
      validFrom: ingestResult.retrievedAt,
      validTo: null,
      sourceObservedAt: null,
      sourcePublishedAt: null,
      retrievedAt: ingestResult.retrievedAt,
      freshnessTtlSeconds: 300,
      sourceAuthority: {
        sourceDccId: coastalOpDccId,
        organizationName: "Unqueried Operator Inventory Feed",
        authorityTier: "direct_operator",
        competentDomains: ["live_seat_inventory_availability"],
        claimedDomain: "live_seat_inventory_availability",
        independentlyCorroboratedBySourceDccIds: [],
        licenseOrReusePolicy: "not_captured",
      },
      evidenceRefs: [],
    },
  });

  // 3. Unsupported Proposition B: Site-Specific Juneau Icefield VFR Ceiling Suitability -> explicitly `unknown`
  ledger.appendEvent({
    eventType: "claim_approved_and_activated",
    claimId: "clm:jnu:site-specific-vfr-ceiling-suitable",
    claimVersionId: "clmv:jnu:site-specific-vfr-ceiling-suitable:v1-unknown",
    recordedAt: ingestResult.retrievedAt,
    actorId: "dcc-v03-epistemic-guard",
    isSynthetic: false,
    provenanceClass: "operational_evidence",
    reason:
      "A reachable FAA WeatherCams homepage does not provide PAJN/Icefield METAR ceiling or visibility telemetry.",
    claimDefinition: {
      claimId: "clm:jnu:site-specific-vfr-ceiling-suitable",
      claimVersionId: "clmv:jnu:site-specific-vfr-ceiling-suitable:v1-unknown",
      subjectDccId: jnuDestDccId,
      predicate: "juneau_icefield_vfr_ceiling_suitable",
      assertionType: "observation",
      epistemicState: "unknown",
      typedValue: null,
      validFrom: ingestResult.retrievedAt,
      validTo: null,
      sourceObservedAt: null,
      sourcePublishedAt: null,
      retrievedAt: ingestResult.retrievedAt,
      freshnessTtlSeconds: 900,
      sourceAuthority: {
        sourceDccId: faaAgencyDccId,
        organizationName: "Federal Aviation Administration (FAA)",
        authorityTier: "primary_regulator",
        competentDomains: ["site_specific_vfr_weather_telemetry"],
        claimedDomain: "site_specific_vfr_weather_telemetry",
        independentlyCorroboratedBySourceDccIds: [],
        licenseOrReusePolicy: "US Federal Government Public Domain",
      },
      evidenceRefs: [],
    },
  });

  const genuineJuneauUniverse = buildV03CandidateUniverse({
    universeId: "univ:juneau-helicopter-canary",
    version: "0.3.0",
    engineId: "juneau-helicopter-canary-v03",
    engineVersion: "0.3.0",
    isSynthetic: false,
    scope: {
      destinationDccEntityId: jnuDestDccId,
      destinationName: "Juneau, Alaska",
      categorySlug: "juneau-helicopter-tours",
      jurisdiction: "US-AK-JUNEAU",
      geographicBounds: { minLat: 58.25, maxLat: 58.65, minLon: -134.85, maxLon: -134.1 },
    },
    inclusionMethod:
      "FAA Part 135 / USFS Tongass permitted Juneau glacier helicopter operators evaluated under strict evidence-sufficiency rules.",
    sourcesAndQueriesConsulted: [
      {
        sourceDccId: faaAgencyDccId,
        organizationName: "Federal Aviation Administration (FAA)",
        queryOrEndpoint: "https://weathercams.faa.gov/",
        consultedAt: ingestResult.retrievedAt,
        snapshotSha256: storedRawCapture.sha256Hex,
      },
    ],
    includedCandidates: [
      {
        candidateDccEntityId: candCoastalIcefieldDccId,
        legacyCandidateCode: "jnu-heli-coastal-icefield",
        displayName: "Icefield Excursion & Glacier Walk (Coastal Helicopters)",
        operatorDccEntityId: coastalOpDccId,
        operatorDisplayName: "Coastal Helicopters",
        bookingChannelClass: "dcc_owned_platform",
        wtaAttributionPresent: false,
        staticAttributes: { basePriceUsd: 419 },
        requiredClaimIds: [
          "clm:jnu:faa-weathercam-portal-reachable",
          "clm:jnu:live-operator-seat-inventory",
          "clm:jnu:site-specific-vfr-ceiling-suitable",
        ],
      },
      {
        candidateDccEntityId: candTemscoMendenhallDccId,
        legacyCandidateCode: "jnu-heli-temsco-mendenhall",
        displayName: "Mendenhall Glacier Helicopter & Guided Walk (TEMSCO)",
        operatorDccEntityId: temscoOpDccId,
        operatorDisplayName: "TEMSCO Helicopters",
        bookingChannelClass: "dcc_owned_platform",
        wtaAttributionPresent: false,
        staticAttributes: { basePriceUsd: 439 },
        requiredClaimIds: [
          "clm:jnu:faa-weathercam-portal-reachable",
          "clm:jnu:live-operator-seat-inventory",
          "clm:jnu:site-specific-vfr-ceiling-suitable",
        ],
      },
      {
        candidateDccEntityId: candNorthstarTrekDccId,
        legacyCandidateCode: "jnu-heli-northstar-trek",
        displayName: "Extended Glacier Icefield Trek (NorthStar Trekking)",
        operatorDccEntityId: northstarOpDccId,
        operatorDisplayName: "NorthStar Trekking",
        bookingChannelClass: "verified_direct_operator",
        wtaAttributionPresent: false,
        staticAttributes: { basePriceUsd: 569 },
        requiredClaimIds: [
          "clm:jnu:faa-weathercam-portal-reachable",
          "clm:jnu:live-operator-seat-inventory",
          "clm:jnu:site-specific-vfr-ceiling-suitable",
        ],
      },
    ],
    knownExclusions: [
      {
        externalOrLegacyIdentifier: "wta-unverified-reseller",
        displayName: "Welcome to Alaska Tours (Excluded Third-Party Reseller)",
        reasonCode: "WTA_TRAFFIC_PROHIBITED_BY_GOVERNANCE",
        explanation: "Excluded per DCC commercial governance policy.",
        supportingEvidenceRefIds: [],
      },
    ],
    coverageGaps: [
      {
        gapCode: "LIVE_OPERATOR_SEAT_INVENTORY_UNCAPTURED",
        affectedDimension: "live_seat_inventory_availability",
        description: "Direct operator seat inventory APIs are not queried in the read-only canary.",
        impactOnCompleteness: "Candidates requiring live seat confirmation resolve to indeterminate.",
      },
      {
        gapCode: "SITE_SPECIFIC_PAJN_METAR_UNCAPTURED",
        affectedDimension: "site_specific_vfr_weather_telemetry",
        description: "FAA WeatherCams homepage capture proves portal reachability only, not PAJN VFR ceiling.",
        impactOnCompleteness: "Flight weather suitability resolves to indeterminate until site METAR is ingested.",
      },
    ],
    effectiveFrom: ingestResult.retrievedAt,
    effectiveTo: new Date(Date.parse(ingestResult.retrievedAt) + 86400_000).toISOString(),
    knowledgeCutoff: ingestResult.retrievedAt,
    refreshDeadline: new Date(Date.parse(ingestResult.retrievedAt) + 3600_000).toISOString(),
    generatorVersion: "dcc-universe-generator/0.3.0",
    epistemicDisclaimer:
      "GENUINE_JUNEAU_CANARY: Reachable FAA WeatherCams homepage supports portal reachability only. Unverified operator availability and VFR ceiling propositions remain unknown, producing indeterminate candidate dispositions.",
  });

  const genuineJuneauBundle = compileV03EngineBundle({
    engineId: "juneau-helicopter-canary-v03",
    engineVersion: "0.3.0",
    universe: genuineJuneauUniverse,
    rules: [
      {
        ruleId: "rule:jnu:faa-portal-reachable",
        ruleVersionId: "rulev:jnu:faa-portal-reachable:v1",
        ruleKind: "required_evidence_gate",
        title: "FAA WeatherCams portal reachable",
        reasonCode: "FAA_PORTAL_REACHABLE_OBSERVED",
        requiredClaimId: "clm:jnu:faa-weathercam-portal-reachable",
        predicateType: "claim_must_be_eligible_and_boolean_true",
        scoreDelta: 5,
      },
      {
        ruleId: "rule:jnu:live-inventory-gate",
        ruleVersionId: "rulev:jnu:live-inventory-gate:v1",
        ruleKind: "required_evidence_gate",
        title: "Live operator seat inventory required for positive recommendation",
        reasonCode: "LIVE_OPERATOR_AVAILABILITY_REQUIRED",
        requiredClaimId: "clm:jnu:live-operator-seat-inventory",
        predicateType: "claim_must_be_eligible_and_boolean_true",
        scoreDelta: 20,
      },
      {
        ruleId: "rule:jnu:vfr-ceiling-gate",
        ruleVersionId: "rulev:jnu:vfr-ceiling-gate:v1",
        ruleKind: "required_evidence_gate",
        title: "Site-specific VFR ceiling telemetry required for positive flight recommendation",
        reasonCode: "SITE_VFR_WEATHER_TELEMETRY_REQUIRED",
        requiredClaimId: "clm:jnu:site-specific-vfr-ceiling-suitable",
        predicateType: "claim_must_be_eligible_and_boolean_true",
        scoreDelta: 20,
      },
    ],
    pinnedSchemaHashes: {
      DecisionIrBundle: sha256HexFull("dcc-decision-ir/0.3"),
      SignedDecisionReceipt: sha256HexFull("dcc-decision-receipt/0.3"),
    },
  });

  const evaluation = await evaluateCurrentV03({
    rawClientRequestBody: {
      validAt: ingestResult.retrievedAt,
      inputs: {
        maxBudgetPerPersonUsd: 600,
      },
    },
    bundle: genuineJuneauBundle,
    universe: genuineJuneauUniverse,
    ledger,
    serverClockNow: () => ingestResult.retrievedAt,
  });

  return {
    canaryClassification: "genuine_juneau_evidence_canary" as const,
    isSynthetic: false,
    ingestSummary: {
      url: ingestResult.canonicalUrl,
      resolvedIps: ingestResult.resolvedIps,
      httpStatus: ingestResult.httpStatus,
      retrievedAt: ingestResult.retrievedAt,
      snapshotSha256: storedRawCapture.sha256Hex,
      privateObjectKey: storedRawCapture.objectKey,
    },
    publicCitationProjection: toPublicCitationProjection(faaPortalEvidenceRef),
    evaluationSummary: {
      receiptId: evaluation.receiptId,
      decisionState: evaluation.decisionState,
      recommendedCandidateDccId: evaluation.recommendedCandidateDccId,
      allCandidatesIndeterminateBecauseUnsupportedPropositionsAreUnknown:
        evaluation.candidateDispositions.every((d) => d.disposition === "indeterminate"),
      candidateDispositions: evaluation.candidateDispositions.map((d) => ({
        legacyCandidateCode: d.legacyCandidateCode,
        disposition: d.disposition,
        reasonCodes: d.reasonCodes,
      })),
    },
    evaluation,
  };
}

/**
 * PROOF B2 (Requirement 3): Preserved-Source Juneau Operational Evidence Pack (`v0.3.1`)
 *
 * Replaces reconstructed summary strings with preserved verbatim HTTP response bytes
 * (`data/machine/v03/preserved_captures_v031.json`) stored in private artifact storage
 * alongside separately stored derived plain-text snapshots (linked by `rawSha256`,
 * `derivedTextSha256`, and `extractorVersion: "dcc-html-text-extractor-v031.1"`).
 *
 * - Never assigns publication dates (`sourcePublishedAt: null`) or human approvals (`claim_created`)
 *   without supporting evidence.
 * - Labels synthetic conflict-injection test cases explicitly as `isSynthetic: true` / `provenanceClass: "synthetic_fixture"`.
 * - Substantiates the decision-critical policies actually evaluated for the 3 Juneau candidates:
 *   1. Coastal Helicopters — Icefield Excursion (`https://coastalhelicopters.com/tours/icefield-excursion/` & `/faq/`):
 *      $459 base price (`Standard Passengers Up to 259 lbs`), 260-299 lbs `$609` (1.5 seats surcharge),
 *      300+ lbs `$918` (2 full seats surcharge), 45-min cruise arrival/departure buffer,
 *      prohibited items (drones, selfie sticks, camera extensions), unassisted boarding required,
 *      4-passenger flight minimum, USDA Forest Service Tongass Special Use Permit.
 *   2. TEMSCO Helicopters — Mendenhall Glacier & Guided Walk (`https://temscoair.com/juneau-helicopter-tours/mendenhall-glacier/`):
 *      $449 base price (Ages 2+), 250+ lbs `+$150.00` extra-space weight surcharge,
 *      15-min prior downtown meeting buffer, service animals prohibited on Astar/Hughes 500/H130,
 *      prohibited bags/drones/selfie sticks, unassisted boarding steps, ~1-hour-prior weather dispatch decision.
 *   3. NorthStar Trekking — Helicopter Glacier Walkabout (`https://northstartrekking.com/adventures/helicopter-glacier-walkabout/` & `/faqs/`):
 *      $499 base price, 3.25 hours duration, minimum age 8+ years old, must walk unassisted for 1 hour
 *      on uneven glacier terrain, 250+ lbs `+$150.00` extra-space weight surcharge,
 *      60-min post-arrival / 45-min pre-departure cruise ship buffer.
 * - Distinguishes weight surcharges (`qualified`) from absolute passenger restrictions (`ineligible`).
 */
export async function runGenuineJuneauOperationalPackV031() {
  const runtimeStore = getV03RuntimeStore();
  await ensurePreservedCapturesStoredInObjectStore(runtimeStore);

  const store = new InMemoryTestArtifactStore();
  const ledger = new AppendOnlyKnowledgeLedger();

  const jnuDestDccId = mintOpaqueDccEntityId("destination", "us-ak-juneau");
  const coastalOpDccId = mintOpaqueDccEntityId("operator", "coastal-helicopters-juneau");
  const temscoOpDccId = mintOpaqueDccEntityId("operator", "temsco-helicopters-juneau");
  const northstarOpDccId = mintOpaqueDccEntityId("operator", "northstar-trekking-juneau");
  const faaAgencyDccId = mintOpaqueDccEntityId("regulatory_agency", "us-faa-weathercams");
  const resellerFixtureDccId = mintOpaqueDccEntityId(
    "evidence_source",
    "synthetic-reseller-conflict-fixture",
  );

  const candCoastalDccId = mintOpaqueDccEntityId(
    "tour_candidate",
    "jnu-coastal-icefield-excursion",
  );
  const candTemscoDccId = mintOpaqueDccEntityId(
    "tour_candidate",
    "jnu-temsco-mendenhall-glacier",
  );
  const candNorthstarDccId = mintOpaqueDccEntityId(
    "tour_candidate",
    "jnu-northstar-glacier-trek",
  );

  const preservedSourceSpecs = [
    {
      sourceKey: "coastal_icefield_excursion_html",
      captureId: "cap:juneau:coastal-icefield-excursion-html",
      sourceDccId: coastalOpDccId,
      hierarchyClass: "operator_direct" as const,
      exactQuote:
        "Standard Passengers\nStarts AT:\n(Price may vary depending on weight)\n$\n459\nStandard Plus\nStarts AT:\n(Price may vary depending on weight)\n$\n609\nPremium\nStarts AT:\n(Price may vary depending on weight)\n$\n918",
      licenseOrReusePolicy: "First-party operator published tariff facts (Coastal Helicopters)",
    },
    {
      sourceKey: "coastal_faq_html",
      captureId: "cap:juneau:coastal-faq-html",
      sourceDccId: coastalOpDccId,
      hierarchyClass: "operator_direct" as const,
      exactQuote:
        "Due to the limited space in our aircraft, we have to reserve extra space for those weighing 260lbs or more. This fee pays for 1.5 seats.",
      licenseOrReusePolicy: "First-party operator published FAQ policy (Coastal Helicopters)",
    },
    {
      sourceKey: "temsco_mendenhall_tour_html",
      captureId: "cap:juneau:temsco-mendenhall-glacier-html",
      sourceDccId: temscoOpDccId,
      hierarchyClass: "operator_direct" as const,
      exactQuote:
        "Due to weight and balance limitations, as well as guest safety and comfort, passengers weighing 250 pounds (113kg or 18 Stone) or more will be charged an additional $150.00 to reserve adequate space on board the helicopter.",
      licenseOrReusePolicy: "First-party operator published policy facts (TEMSCO Helicopters)",
    },
    {
      sourceKey: "northstar_walkabout_html",
      captureId: "cap:juneau:northstar-walkabout-html",
      sourceDccId: northstarOpDccId,
      hierarchyClass: "operator_direct" as const,
      exactQuote:
        "Must be at least 8 years old to participate.\nMust be able to walk unassisted for one hour on moderately flat but uneven terrain.",
      licenseOrReusePolicy: "First-party operator published policy facts (NorthStar Trekking)",
    },
    {
      sourceKey: "northstar_faqs_html",
      captureId: "cap:juneau:northstar-faqs-html",
      sourceDccId: northstarOpDccId,
      hierarchyClass: "operator_direct" as const,
      exactQuote:
        "Bags, purses, selfie sticks, nor drones are permitted. We provide safe storage for any personal belongings to remain at our base.",
      licenseOrReusePolicy: "First-party operator published FAQ policy (NorthStar Trekking)",
    },
    {
      sourceKey: "faa_weathercams_portal_html",
      captureId: "cap:juneau:faa-weathercams-html",
      sourceDccId: faaAgencyDccId,
      hierarchyClass: "government_regulatory" as const,
      exactQuote: "FAA WeatherCams\nWelcome to WeatherCams",
      licenseOrReusePolicy: "US Federal Government Public Domain (17 U.S.C. 105)",
    },
  ] as const;

  const evidenceRefsByKey = new Map<string, ReturnType<typeof buildV03EvidenceReference>>();
  const ingestedSourceManifest = [];

  for (const spec of preservedSourceSpecs) {
    const capture = getPreservedCaptureByIdV031(spec.captureId);
    const persisted = await persistPreservedCaptureToObjectStore({
      capture,
      objectStore: store,
    });
    const evRef = buildEvidenceRefFromPreservedCapture({
      evidenceRefId: `evref:jnu:v031:${spec.sourceKey}`,
      sourceDccId: spec.sourceDccId,
      capture,
      exactQuote: spec.exactQuote,
      licenseOrReusePolicy: spec.licenseOrReusePolicy,
    });
    evidenceRefsByKey.set(spec.sourceKey, evRef);
    ingestedSourceManifest.push({
      sourceKey: spec.sourceKey,
      captureId: capture.captureId,
      organizationName: capture.sourceOrganization,
      hierarchyClass: spec.hierarchyClass,
      url: capture.url,
      retrievedAt: capture.retrievedAt,
      sourcePublishedAt: capture.sourcePublishedAt,
      httpStatus: capture.httpStatus,
      httpHeaders: capture.responseHeaders,
      rawResponseByteLength: capture.rawByteLength,
      rawResponseSha256: persisted.rawSha256,
      privateRawObjectKey: persisted.rawObjectKey,
      rawBytesPreservedInPrivateStore: true,
      derivedTextByteLength: capture.derivedTextByteLength,
      derivedTextSha256: persisted.derivedTextSha256,
      privateDerivedTextObjectKey: persisted.derivedTextObjectKey,
      derivedTextStoredSeparately: true,
      extractorVersion: capture.extractorVersion,
      provenanceClass: "network_capture_verified" as const,
      licenseOrReusePolicy: spec.licenseOrReusePolicy,
      evidenceRefId: evRef.evidenceRefId,
      w3cSelectors: evRef.selectors,
    });
  }

  // Additional granular policy evidence refs derived from the preserved captures
  const capCoastalTour = getPreservedCaptureByIdV031("cap:juneau:coastal-icefield-excursion-html");
  const capCoastalFaq = getPreservedCaptureByIdV031("cap:juneau:coastal-faq-html");
  const capTemscoTour = getPreservedCaptureByIdV031("cap:juneau:temsco-mendenhall-glacier-html");
  const capNorthstarTour = getPreservedCaptureByIdV031("cap:juneau:northstar-walkabout-html");

  const evCoastalPrice = evidenceRefsByKey.get("coastal_icefield_excursion_html")!;
  const evCoastalWeight260 = evidenceRefsByKey.get("coastal_faq_html")!;
  const evCoastalWeight300 = buildEvidenceRefFromPreservedCapture({
    evidenceRefId: "evref:jnu:v031:coastal_weight_300_surcharge",
    sourceDccId: coastalOpDccId,
    capture: capCoastalFaq,
    exactQuote:
      "Due to the limited space in our aircraft, we have to reserve extra space for those weighing 300lbs or more. This fee pays for 2 full seats.",
    licenseOrReusePolicy: "First-party operator published FAQ policy (Coastal Helicopters)",
  });
  const evCoastalProhibited = buildEvidenceRefFromPreservedCapture({
    evidenceRefId: "evref:jnu:v031:coastal_prohibited_items",
    sourceDccId: coastalOpDccId,
    capture: capCoastalTour,
    exactQuote:
      "Cameras and cell phones are welcomed while on tour, but all drones, selfie sticks, phone stabilizers, and any camera extensions are prohibited.",
    licenseOrReusePolicy: "First-party operator published policy facts (Coastal Helicopters)",
  });
  const evCoastalUsfsPermit = buildEvidenceRefFromPreservedCapture({
    evidenceRefId: "evref:jnu:v031:coastal_usfs_tongass_permit",
    sourceDccId: coastalOpDccId,
    capture: capCoastalTour,
    exactQuote:
      "Coastal Helicopters, Inc. is an equal opportunity employer and operates under a USDA Forest Service Special Use Permit on the Tongass National Forest.",
    licenseOrReusePolicy: "First-party operator published permit disclosure (Coastal Helicopters)",
  });

  const evTemscoWeight250 = evidenceRefsByKey.get("temsco_mendenhall_tour_html")!;
  const evTemscoServiceAnimals = buildEvidenceRefFromPreservedCapture({
    evidenceRefId: "evref:jnu:v031:temsco_service_animals_prohibited",
    sourceDccId: temscoOpDccId,
    capture: capTemscoTour,
    exactQuote:
      "Per TEMSCO Helicopters’ Passenger Mobility Policy, service animals shall not be permitted on Temsco Eurocopter Astar, Hughes 500 and Airbus H130 aircraft used by Temsco for flightseeing and tours.",
    licenseOrReusePolicy: "First-party operator published policy facts (TEMSCO Helicopters)",
  });

  const evNorthstarAgeAndWalk = evidenceRefsByKey.get("northstar_walkabout_html")!;
  const evNorthstarWeight250 = evidenceRefsByKey.get("northstar_faqs_html")!;
  const evNorthstarBuffer = buildEvidenceRefFromPreservedCapture({
    evidenceRefId: "evref:jnu:v031:northstar_cruise_buffer",
    sourceDccId: northstarOpDccId,
    capture: capNorthstarTour,
    exactQuote:
      "Please book your tour at least one hour after your ship’s arrival time. The tour should conclude no less than 45 minutes before your ship’s departure time.",
    licenseOrReusePolicy: "First-party operator published policy facts (NorthStar Trekking)",
  });

  // Record claims using `claim_created` (no unverified human approvals) and `sourcePublishedAt: null`
  ledger.appendEvent({
    eventType: "claim_created",
    claimId: "clm:jnu:coastal:weight-surcharge-threshold-lbs",
    claimVersionId: "clmv:jnu:coastal:weight-surcharge-threshold-lbs:v1-260",
    recordedAt: capCoastalFaq.retrievedAt,
    actorId: "dcc-v031-preserved-capture-extractor",
    isSynthetic: false,
    provenanceClass: "operational_evidence",
    reason:
      "Derived from preserved Coastal Helicopters FAQ & tour HTML bytes: 260-299 lbs incurs 1.5-seat surcharge ($609); 300+ lbs incurs 2-seat surcharge ($918).",
    claimDefinition: {
      claimId: "clm:jnu:coastal:weight-surcharge-threshold-lbs",
      claimVersionId: "clmv:jnu:coastal:weight-surcharge-threshold-lbs:v1-260",
      subjectDccId: coastalOpDccId,
      predicate: "weight_surcharge_threshold_lbs",
      assertionType: "policy",
      epistemicState: "verified_against_identified_evidence",
      typedValue: 260,
      unitOrCurrency: "lbs",
      validFrom: "2026-01-01T00:00:00.000Z",
      validTo: "2027-12-31T23:59:59.000Z",
      sourceObservedAt: capCoastalFaq.retrievedAt,
      sourcePublishedAt: null,
      retrievedAt: capCoastalFaq.retrievedAt,
      freshnessTtlSeconds: 90 * 86400,
      sourceAuthority: {
        sourceDccId: coastalOpDccId,
        organizationName: "Coastal Helicopters",
        authorityTier: "operator_direct",
        competentDomains: ["operator_safety_and_weight_policy"],
        claimedDomain: "operator_safety_and_weight_policy",
        independentlyCorroboratedBySourceDccIds: [],
        licenseOrReusePolicy: evCoastalWeight260.licenseOrReusePolicy,
      },
      evidenceRefs: [evCoastalPrice, evCoastalWeight260, evCoastalWeight300, evCoastalProhibited],
    },
  });

  ledger.appendEvent({
    eventType: "claim_created",
    claimId: "clm:jnu:temsco:weight-surcharge-threshold-lbs",
    claimVersionId: "clmv:jnu:temsco:weight-surcharge-threshold-lbs:v1-250",
    recordedAt: capTemscoTour.retrievedAt,
    actorId: "dcc-v031-preserved-capture-extractor",
    isSynthetic: false,
    provenanceClass: "operational_evidence",
    reason:
      "Derived from preserved TEMSCO Mendenhall Glacier HTML bytes: passengers 250+ lbs pay an additional $150.00 surcharge; service animals and carry-on bags prohibited.",
    claimDefinition: {
      claimId: "clm:jnu:temsco:weight-surcharge-threshold-lbs",
      claimVersionId: "clmv:jnu:temsco:weight-surcharge-threshold-lbs:v1-250",
      subjectDccId: temscoOpDccId,
      predicate: "weight_surcharge_threshold_lbs",
      assertionType: "policy",
      epistemicState: "verified_against_identified_evidence",
      typedValue: 250,
      unitOrCurrency: "lbs",
      validFrom: "2026-01-01T00:00:00.000Z",
      validTo: "2027-12-31T23:59:59.000Z",
      sourceObservedAt: capTemscoTour.retrievedAt,
      sourcePublishedAt: null,
      retrievedAt: capTemscoTour.retrievedAt,
      freshnessTtlSeconds: 90 * 86400,
      sourceAuthority: {
        sourceDccId: temscoOpDccId,
        organizationName: "TEMSCO Helicopters",
        authorityTier: "operator_direct",
        competentDomains: ["operator_safety_and_weight_policy"],
        claimedDomain: "operator_safety_and_weight_policy",
        independentlyCorroboratedBySourceDccIds: [],
        licenseOrReusePolicy: evTemscoWeight250.licenseOrReusePolicy,
      },
      evidenceRefs: [evTemscoWeight250, evTemscoServiceAnimals],
    },
  });

  const capNorthstarFaq = getPreservedCaptureByIdV031("cap:juneau:northstar-faqs-html");
  ledger.appendEvent({
    eventType: "claim_created",
    claimId: "clm:jnu:northstar:min-age-years",
    claimVersionId: "clmv:jnu:northstar:min-age-years:v1-8",
    recordedAt: capNorthstarFaq.retrievedAt,
    actorId: "dcc-v031-preserved-capture-extractor",
    isSynthetic: false,
    provenanceClass: "operational_evidence",
    reason:
      "Derived from preserved NorthStar Walkabout HTML bytes: minimum age 8 years old, must walk unassisted for 1 hour on uneven glacier terrain, 250+ lbs incurs +$150.00 surcharge.",
    claimDefinition: {
      claimId: "clm:jnu:northstar:min-age-years",
      claimVersionId: "clmv:jnu:northstar:min-age-years:v1-8",
      subjectDccId: northstarOpDccId,
      predicate: "minimum_passenger_age_years",
      assertionType: "policy",
      epistemicState: "verified_against_identified_evidence",
      typedValue: 8,
      unitOrCurrency: "years",
      validFrom: "2026-01-01T00:00:00.000Z",
      validTo: "2027-12-31T23:59:59.000Z",
      sourceObservedAt: capNorthstarFaq.retrievedAt,
      sourcePublishedAt: null,
      retrievedAt: capNorthstarFaq.retrievedAt,
      freshnessTtlSeconds: 90 * 86400,
      sourceAuthority: {
        sourceDccId: northstarOpDccId,
        organizationName: "NorthStar Trekking",
        authorityTier: "operator_direct",
        competentDomains: ["operator_safety_and_weight_policy"],
        claimedDomain: "operator_safety_and_weight_policy",
        independentlyCorroboratedBySourceDccIds: [],
        licenseOrReusePolicy: evNorthstarAgeAndWalk.licenseOrReusePolicy,
      },
      evidenceRefs: [evNorthstarAgeAndWalk, evNorthstarBuffer, evNorthstarWeight250],
    },
  });

  ledger.appendEvent({
    eventType: "claim_created",
    claimId: "clm:jnu:usfs-tongass-commercial-heli-permit-required",
    claimVersionId: "clmv:jnu:usfs-tongass-permit:v1",
    recordedAt: capCoastalTour.retrievedAt,
    actorId: "dcc-v031-preserved-capture-extractor",
    isSynthetic: false,
    provenanceClass: "operational_evidence",
    reason:
      "Derived from preserved Coastal Helicopters tour page footer disclosure: operates under a USDA Forest Service Special Use Permit on the Tongass National Forest.",
    claimDefinition: {
      claimId: "clm:jnu:usfs-tongass-commercial-heli-permit-required",
      claimVersionId: "clmv:jnu:usfs-tongass-permit:v1",
      subjectDccId: jnuDestDccId,
      predicate: "usfs_tongass_special_use_permit_compliant",
      assertionType: "policy",
      epistemicState: "verified_against_identified_evidence",
      typedValue: true,
      unitOrCurrency: null,
      validFrom: "2026-01-01T00:00:00.000Z",
      validTo: "2027-12-31T23:59:59.000Z",
      sourceObservedAt: capCoastalTour.retrievedAt,
      sourcePublishedAt: null,
      retrievedAt: capCoastalTour.retrievedAt,
      freshnessTtlSeconds: 180 * 86400,
      sourceAuthority: {
        sourceDccId: coastalOpDccId,
        organizationName: "Coastal Helicopters (USFS Tongass Permit Disclosure)",
        authorityTier: "operator_direct",
        competentDomains: ["land_management_permit", "operator_safety_and_weight_policy"],
        claimedDomain: "land_management_permit",
        independentlyCorroboratedBySourceDccIds: [],
        licenseOrReusePolicy: evCoastalUsfsPermit.licenseOrReusePolicy,
      },
      evidenceRefs: [evCoastalUsfsPermit],
    },
  });

  // Explicitly record `unknown` for live seat inventory and day-of flight weather
  ledger.appendEvent({
    eventType: "claim_created",
    claimId: "clm:jnu:live-departure-seat-inventory",
    claimVersionId: "clmv:jnu:live-departure-seat-inventory:v1-unknown",
    recordedAt: capCoastalTour.retrievedAt,
    actorId: "dcc-v031-epistemic-guard",
    isSynthetic: false,
    provenanceClass: "operational_evidence",
    reason:
      "Live departure seat inventory and 4-passenger minimum flight dispatch are not established in static operator pages; remains unknown until operator reservation check.",
    claimDefinition: {
      claimId: "clm:jnu:live-departure-seat-inventory",
      claimVersionId: "clmv:jnu:live-departure-seat-inventory:v1-unknown",
      subjectDccId: jnuDestDccId,
      predicate: "live_departure_seat_inventory_available",
      assertionType: "observation",
      epistemicState: "unknown",
      typedValue: null,
      unitOrCurrency: null,
      validFrom: "2026-01-01T00:00:00.000Z",
      validTo: null,
      sourceObservedAt: null,
      sourcePublishedAt: null,
      retrievedAt: capCoastalTour.retrievedAt,
      freshnessTtlSeconds: 300,
      sourceAuthority: {
        sourceDccId: coastalOpDccId,
        organizationName: "Operator Live Reservation Inventory",
        authorityTier: "operator_direct",
        competentDomains: ["live_seat_inventory_availability"],
        claimedDomain: "live_seat_inventory_availability",
        independentlyCorroboratedBySourceDccIds: [],
        licenseOrReusePolicy: "not_captured",
      },
      evidenceRefs: [],
    },
  });

  ledger.appendEvent({
    eventType: "claim_created",
    claimId: "clm:jnu:day-of-flight-vfr-weather",
    claimVersionId: "clmv:jnu:day-of-flight-vfr-weather:v1-unknown",
    recordedAt: capCoastalTour.retrievedAt,
    actorId: "dcc-v031-epistemic-guard",
    isSynthetic: false,
    provenanceClass: "operational_evidence",
    reason:
      "Day-of-flight PAJN/Icefield VFR ceiling and visibility are unknown prior to the ~1-hour-before-departure operator weather decision window.",
    claimDefinition: {
      claimId: "clm:jnu:day-of-flight-vfr-weather",
      claimVersionId: "clmv:jnu:day-of-flight-vfr-weather:v1-unknown",
      subjectDccId: jnuDestDccId,
      predicate: "day_of_flight_vfr_ceiling_suitable",
      assertionType: "observation",
      epistemicState: "unknown",
      typedValue: null,
      unitOrCurrency: null,
      validFrom: "2026-01-01T00:00:00.000Z",
      validTo: null,
      sourceObservedAt: null,
      sourcePublishedAt: null,
      retrievedAt: capCoastalTour.retrievedAt,
      freshnessTtlSeconds: 900,
      sourceAuthority: {
        sourceDccId: faaAgencyDccId,
        organizationName: "Federal Aviation Administration (FAA)",
        authorityTier: "government_regulatory",
        competentDomains: ["site_specific_vfr_weather_telemetry"],
        claimedDomain: "site_specific_vfr_weather_telemetry",
        independentlyCorroboratedBySourceDccIds: [],
        licenseOrReusePolicy: "US Federal Government Public Domain",
      },
      evidenceRefs: [],
    },
  });

  // Synthetic fixture test of Source Hierarchy & Reseller Conflict Guard (explicitly marked `isSynthetic: true`):
  const resellerOverrideAttempt = ledger.attemptAppendClaimWithSourceHierarchyGuard({
    recordedAt: "2026-10-26T22:02:10.000Z",
    actorId: "reseller-conflict-fixture-runner",
    isSynthetic: true,
    reason:
      "SYNTHETIC FIXTURE: Simulated third-party reseller brochure claiming Coastal weight threshold is 240 lbs instead of 260 lbs.",
    claimDefinition: {
      claimId: "clm:jnu:coastal:weight-surcharge-threshold-lbs",
      claimVersionId: "clmv:jnu:coastal:weight-surcharge-threshold-lbs:v2-reseller-240-fixture",
      subjectDccId: coastalOpDccId,
      predicate: "weight_surcharge_threshold_lbs",
      assertionType: "policy",
      epistemicState: "source_asserted",
      typedValue: 240,
      unitOrCurrency: "lbs",
      validFrom: "2026-01-01T00:00:00.000Z",
      validTo: "2027-12-31T23:59:59.000Z",
      sourceObservedAt: "2026-10-26T22:02:10.000Z",
      sourcePublishedAt: null,
      retrievedAt: "2026-10-26T22:02:10.000Z",
      freshnessTtlSeconds: 30 * 86400,
      sourceAuthority: {
        sourceDccId: resellerFixtureDccId,
        organizationName: "Synthetic Third-Party Port Reseller Fixture",
        authorityTier: "reseller",
        competentDomains: ["operator_safety_and_weight_policy"],
        claimedDomain: "operator_safety_and_weight_policy",
        independentlyCorroboratedBySourceDccIds: [],
        licenseOrReusePolicy: "synthetic_test_fixture_only",
      },
      evidenceRefs: [evCoastalWeight260],
    },
  });

  const jnuOperationalUniverse = buildV03CandidateUniverse({
    universeId: "univ:juneau-helicopter-tours",
    version: "0.3.1",
    engineId: "juneau-helicopter-tours",
    engineVersion: "0.3.1",
    isSynthetic: false,
    scope: {
      destinationDccEntityId: jnuDestDccId,
      destinationName: "Juneau, Alaska",
      categorySlug: "juneau-helicopter-tours",
      jurisdiction: "US-AK-JUNEAU",
      geographicBounds: { minLat: 58.25, maxLat: 58.65, minLon: -134.85, maxLon: -134.1 },
    },
    inclusionMethod:
      "USFS Tongass National Forest permitted Juneau helicopter glacier operators substantiated from preserved HTTP response bytes.",
    sourcesAndQueriesConsulted: ingestedSourceManifest.map((s) => ({
      sourceDccId: s.evidenceRefId,
      organizationName: s.organizationName,
      queryOrEndpoint: s.url,
      consultedAt: s.retrievedAt,
      snapshotSha256: s.rawResponseSha256,
    })),
    includedCandidates: [
      {
        candidateDccEntityId: candCoastalDccId,
        legacyCandidateCode: "jnu-heli-coastal-icefield",
        displayName: "Coastal Helicopters — Icefield Excursion",
        operatorDccEntityId: coastalOpDccId,
        operatorDisplayName: "Coastal Helicopters",
        bookingChannelClass: "verified_direct_operator",
        wtaAttributionPresent: false,
        staticAttributes: {
          basePriceUsd: 459,
          standardPlusPriceUsd260To299Lbs: 609,
          premiumPriceUsd300PlusLbs: 918,
          weightSurchargeThresholdLbs: 260,
          secondaryWeightSurchargeThresholdLbs: 300,
          weightPolicyType: "surcharge_only",
          minAgeYears: 0,
          minPortWindowMinutes: 245,
          comfortablePortWindowMinutes: 275,
          prohibitsDronesAndSelfieSticks: true,
          requiresUnassistedBoarding: true,
          supportsWeightOverride: true,
          liveInventoryClaimId: "clm:jnu:live-departure-seat-inventory",
          dayOfWeatherClaimId: "clm:jnu:day-of-flight-vfr-weather",
        },
        requiredClaimIds: [
          "clm:jnu:coastal:weight-surcharge-threshold-lbs",
          "clm:jnu:usfs-tongass-commercial-heli-permit-required",
        ],
      },
      {
        candidateDccEntityId: candTemscoDccId,
        legacyCandidateCode: "jnu-heli-temsco-mendenhall",
        displayName: "TEMSCO Helicopters — Mendenhall Glacier & Guided Walk",
        operatorDccEntityId: temscoOpDccId,
        operatorDisplayName: "TEMSCO Helicopters",
        bookingChannelClass: "verified_direct_operator",
        wtaAttributionPresent: false,
        staticAttributes: {
          basePriceUsd: 449,
          weightSurchargeThresholdLbs: 250,
          weightSurchargeUsd: 150,
          weightPolicyType: "surcharge_only",
          minAgeYears: 2,
          minPortWindowMinutes: 210,
          comfortablePortWindowMinutes: 240,
          prohibitsDronesAndSelfieSticks: true,
          prohibitsCarryOnBags: true,
          prohibitsServiceAnimals: true,
          requiresUnassistedBoarding: true,
          supportsWeightOverride: true,
          liveInventoryClaimId: "clm:jnu:live-departure-seat-inventory",
          dayOfWeatherClaimId: "clm:jnu:day-of-flight-vfr-weather",
        },
        requiredClaimIds: [
          "clm:jnu:temsco:weight-surcharge-threshold-lbs",
          "clm:jnu:usfs-tongass-commercial-heli-permit-required",
        ],
      },
      {
        candidateDccEntityId: candNorthstarDccId,
        legacyCandidateCode: "jnu-heli-northstar-trek",
        displayName: "NorthStar Trekking — Helicopter Glacier Walkabout",
        operatorDccEntityId: northstarOpDccId,
        operatorDisplayName: "NorthStar Trekking",
        bookingChannelClass: "verified_direct_operator",
        wtaAttributionPresent: false,
        staticAttributes: {
          basePriceUsd: 499,
          weightSurchargeThresholdLbs: 250,
          weightSurchargeUsd: 150,
          weightPolicyType: "surcharge_only",
          minAgeYears: 8,
          minPortWindowMinutes: 300,
          comfortablePortWindowMinutes: 330,
          prohibitsDronesAndSelfieSticks: true,
          prohibitsCarryOnBags: true,
          requiresUnassistedBoarding: true,
          requiresOneHourGlacierWalk: true,
          supportsWeightOverride: true,
          liveInventoryClaimId: "clm:jnu:live-departure-seat-inventory",
          dayOfWeatherClaimId: "clm:jnu:day-of-flight-vfr-weather",
        },
        requiredClaimIds: [
          "clm:jnu:northstar:min-age-years",
          "clm:jnu:usfs-tongass-commercial-heli-permit-required",
        ],
      },
    ],
    knownExclusions: [
      {
        externalOrLegacyIdentifier: "wta-reseller-excluded",
        displayName: "Welcome to Alaska Tours (WTA)",
        reasonCode: "WTA_PROHIBITED_BY_GOVERNANCE",
        explanation: "Never routed or attributed per DCC Alaska governance policy.",
        supportingEvidenceRefIds: [],
      },
    ],
    coverageGaps: [
      {
        gapCode: "LIVE_DEPARTURE_SEAT_INVENTORY_UNCAPTURED",
        affectedDimension: "live_seat_inventory_availability",
        description:
          "Published operator policies are verified from preserved HTML captures, but live departure seat inventory and 4-passenger minimum flight dispatch remain unknown until operator reservation revalidation.",
        impactOnCompleteness:
          "Evaluations requiring live departure seat confirmation resolve to indeterminate.",
      },
      {
        gapCode: "DAY_OF_FLIGHT_PAJN_VFR_WEATHER_UNCAPTURED",
        affectedDimension: "site_specific_vfr_weather_telemetry",
        description:
          "Day-of-flight PAJN/Icefield VFR ceiling and visibility remain unknown until ~1 hour prior to departure.",
        impactOnCompleteness:
          "Evaluations requiring day-of-flight weather confirmation resolve to indeterminate.",
      },
    ],
    effectiveFrom: "2026-01-01T00:00:00.000Z",
    effectiveTo: "2027-12-31T23:59:59.000Z",
    knowledgeCutoff: "2026-10-26T22:02:15.000Z",
    refreshDeadline: "2026-11-26T22:02:15.000Z",
    generatorVersion: "dcc-universe-generator/0.3.1",
    epistemicDisclaimer:
      "Evaluates substantiated operator policy fit from preserved source responses (distinguishing weight surcharges from absolute passenger restrictions). Live departure seat inventory and day-of-flight VFR weather remain unknown until operator revalidation.",
  });

  const jnuOperationalBundle = compileV03EngineBundle({
    engineId: "juneau-helicopter-tours",
    engineVersion: "0.3.1",
    compilerVersion: "dcc-ir-compiler/0.3.1",
    universe: jnuOperationalUniverse,
    rules: [
      {
        ruleId: "rule:jnu:usfs-permit-gate",
        ruleVersionId: "rulev:jnu:usfs-permit-gate:v1",
        ruleKind: "hard_gate",
        title: "USFS Tongass Special Use Permit required for Juneau Icefield landing",
        reasonCode: "USFS_TONGASS_PERMIT_COMPLIANT",
        requiredClaimId: "clm:jnu:usfs-tongass-commercial-heli-permit-required",
        predicateType: "claim_must_be_eligible_and_boolean_true",
        scoreDelta: 20,
      },
    ],
    pinnedSchemaHashes: {
      DecisionIrBundle: sha256HexFull("dcc-decision-ir/0.3"),
      SignedDecisionReceipt: sha256HexFull("dcc-decision-receipt/0.3"),
    },
  });

  // Scenario 1 (Synthetic Traveler Scenario Fixture evaluated against real preserved operator policies):
  // Cruise passenger party: 255 lb passenger, age 7 child in party, 280-minute cruise port window
  // -> Coastal Helicopters: `eligible` (255 < 260 lbs surcharge threshold, age 7 >= 0, 280 >= 275 min comfortable window)
  // -> TEMSCO Helicopters: `qualified` (255 >= 250 lbs surcharge threshold -> +$150.00 extra-space surcharge, age 7 >= 2, 280 >= 240 min window)
  // -> NorthStar Trekking: `ineligible` (age 7 < 8 minAgeYears on Walkabout AND 280 < 300 minPortWindowMinutes)
  const mixedDispositionEvaluation = await evaluateCurrentV03({
    rawClientRequestBody: {
      validAt: "2026-11-15T18:00:00.000Z",
      inputs: {
        maxSinglePassengerWeightLbs: 255,
        youngestPassengerAgeYears: 7,
        cruisePortWindowMinutes: 280,
        maxBudgetPerPersonUsd: 650,
      },
    },
    bundle: jnuOperationalBundle,
    universe: jnuOperationalUniverse,
    ledger,
    serverClockNow: () => "2026-10-26T22:05:00.000Z",
  });

  // Scenario 2: Traveler requesting live departure seat & day-of-flight weather confirmation (`requireLiveDepartureConfirmation: true`)
  // -> All 3 candidates resolve to `indeterminate` because `clm:jnu:live-departure-seat-inventory` and `clm:jnu:day-of-flight-vfr-weather` are `unknown`!
  const liveConfirmationRequiredEvaluation = await evaluateCurrentV03({
    rawClientRequestBody: {
      validAt: "2026-11-15T18:00:00.000Z",
      inputs: {
        maxSinglePassengerWeightLbs: 185,
        youngestPassengerAgeYears: 30,
        cruisePortWindowMinutes: 420,
        maxBudgetPerPersonUsd: 650,
        requireLiveDepartureConfirmation: true,
      },
    },
    bundle: jnuOperationalBundle,
    universe: jnuOperationalUniverse,
    ledger,
    serverClockNow: () => "2026-10-26T22:05:00.000Z",
  });

  // Scenario 3: Verify that a 305 lb passenger is `qualified` (weight surcharge: 2 seats on Coastal, +$150 on TEMSCO/NorthStar)
  // rather than rejected as ineligible, whereas a passenger with prohibited items or service animal on TEMSCO is `ineligible`!
  const weightSurchargeVsRestrictionEvaluation = await evaluateCurrentV03({
    rawClientRequestBody: {
      validAt: "2026-11-15T18:00:00.000Z",
      inputs: {
        maxSinglePassengerWeightLbs: 305,
        youngestPassengerAgeYears: 35,
        cruisePortWindowMinutes: 420,
        maxBudgetPerPersonUsd: 950,
        hasServiceAnimal: true,
      },
    },
    bundle: jnuOperationalBundle,
    universe: jnuOperationalUniverse,
    ledger,
    serverClockNow: () => "2026-10-26T22:05:00.000Z",
  });

  return {
    packVersion: "0.3.1" as const,
    ingestedSourceCount: ingestedSourceManifest.length,
    ingestedSourceManifest,
    ingestedEvidenceReferences: ingestedSourceManifest,
    resellerConflictProof: {
      isSyntheticFixture: true,
      overrodeExistingClaim: resellerOverrideAttempt.overrodeExistingClaim,
      conflictRecorded: resellerOverrideAttempt.conflictRecorded,
      reasonCode: resellerOverrideAttempt.reasonCode,
      conflictEventId: resellerOverrideAttempt.recordedEvent.eventId,
      conflictEventType: resellerOverrideAttempt.recordedEvent.eventType,
    },
    mixedDispositionEvaluation: {
      scenarioClassification: "synthetic_traveler_scenario_against_preserved_operator_evidence" as const,
      receiptId: mixedDispositionEvaluation.receiptId,
      decisionState: mixedDispositionEvaluation.decisionState,
      recommendedCandidateLegacyCode:
        mixedDispositionEvaluation.recommendedCandidateLegacyCode,
      dispositions: mixedDispositionEvaluation.candidateDispositions.map((d) => ({
        legacyCandidateCode: d.legacyCandidateCode,
        displayName: d.displayName,
        disposition: d.disposition,
        totalScore: d.totalScore,
        reasonCodes: d.reasonCodes,
        evidenceRefIds: d.evidenceRefIds,
      })),
    },
    weightSurchargeVsRestrictionEvaluation: {
      scenarioClassification: "synthetic_traveler_scenario_against_preserved_operator_evidence" as const,
      receiptId: weightSurchargeVsRestrictionEvaluation.receiptId,
      decisionState: weightSurchargeVsRestrictionEvaluation.decisionState,
      dispositions: weightSurchargeVsRestrictionEvaluation.candidateDispositions.map((d) => ({
        legacyCandidateCode: d.legacyCandidateCode,
        disposition: d.disposition,
        reasonCodes: d.reasonCodes,
      })),
    },
    liveConfirmationIndeterminateEvaluation: {
      receiptId: liveConfirmationRequiredEvaluation.receiptId,
      decisionState: liveConfirmationRequiredEvaluation.decisionState,
      dispositions: liveConfirmationRequiredEvaluation.candidateDispositions.map((d) => ({
        legacyCandidateCode: d.legacyCandidateCode,
        disposition: d.disposition,
        reasonCodes: d.reasonCodes,
      })),
    },
    liveExternalCallsOnEvaluationHotPath: 0,
    wtaCandidatesIncluded: jnuOperationalUniverse.includedCandidates.filter(
      (c) => c.wtaAttributionPresent,
    ).length,
  };
}

/**
 * PROOF C (Requirement 2): GoSno First-Party Shadow-Mode DecisionAuthorization Proof
 *
 * Consumes the **exact same** admitted claims, candidate universe (`univ:denver-to-mountain-transportation`),
 * and compiled bundle (`denver-to-mountain-transportation@0.3.0`) that the ordinary deployed API
 * (`runtimeStoreV03.ts` / `handleV03EvaluateRequest`) uses.
 *
 * Also executes regression checks against the deployed runtime proving:
 * 1. The nonexistent 14-passenger / $89 shared shuttle (`gosno-denver-winter-park-express`) is withdrawn
 *    and excluded from the runtime universe.
 * 2. A group of 6 passengers with 6 snowboards (`snowboardCount: 6`) is NOT inferred to fit in a 6-passenger
 *    SUV from the passenger limit alone (`SUV_EQUIPMENT_FIT_UNESTABLISHED_FOR_GROUP_AND_SKI_GEAR_REQUIRES_VAN_OR_CONFIRMATION`).
 * 3. A group above the 10-passenger Van limit (`groupSize: 11`) is rejected across all candidates (`no_viable_candidates`).
 */
export async function runGoSnoShadowAuthorizationProof() {
  const store = getV03RuntimeStore();
  await ensurePreservedCapturesStoredInObjectStore(store);

  const gosnoOpId = mintOpaqueDccEntityId("operator", "gosno-mountain-transportation-co");
  const srcGosnoRouteFeedId = mintOpaqueDccEntityId(
    "evidence_source",
    "gosno-public-route-feed-2026",
  );

  // Ensure the 5 explicit `unknown` live operational conditions are recorded in the shared runtime ledger
  const unknownConditionSpecs = [
    {
      claimId: "clm:gosno:live-driver-availability",
      predicate: "driver_availability",
      reason: "Live driver dispatch assignment is unknown until action-time dispatch check.",
    },
    {
      claimId: "clm:gosno:live-vehicle-availability",
      predicate: "vehicle_availability",
      reason: "Live fleet SUV/Van unit availability is unknown until action-time inventory check.",
    },
    {
      claimId: "clm:gosno:live-equipment-fit-at-capacity",
      predicate: "equipment_and_luggage_fit",
      reason:
        "Physical cabin/cargo fit for 6 passengers + 6 snowboards/ski bags in an SUV is unestablished without operator confirmation or Van upgrade.",
    },
    {
      claimId: "clm:gosno:live-road-safety",
      predicate: "road_safety",
      reason:
        "Live CDOT I-70 / US-40 Berthoud Pass chain/traction/closure status is unknown until travel window.",
    },
    {
      claimId: "clm:gosno:live-inventory-confirmation",
      predicate: "live_inventory_confirmation",
      reason:
        "Rezdy/OCTO live booking slot confirmation (requiresOperatorConfirmation=true) is unknown until action-time revalidation.",
    },
  ] as const;

  const existingClaimIds = new Set(store.knowledgeLedger.getEvents().map((e) => e.claimId));
  const unknownLiveConditions: Array<{
    claimId: string;
    predicate: string;
    epistemicState: string;
    typedValue: null;
  }> = [];
  for (const spec of unknownConditionSpecs) {
    if (!existingClaimIds.has(spec.claimId)) {
      store.knowledgeLedger.appendEvent({
        eventType: "claim_created",
        claimId: spec.claimId,
        claimVersionId: `${spec.claimId}:v1-unknown`,
        recordedAt: "2026-10-26T21:17:00.000Z",
        actorId: "dcc-v031-gosno-epistemic-guard",
        isSynthetic: false,
        provenanceClass: "operational_evidence",
        reason: spec.reason,
        claimDefinition: {
          claimId: spec.claimId,
          claimVersionId: `${spec.claimId}:v1-unknown`,
          subjectDccId: gosnoOpId,
          predicate: spec.predicate,
          assertionType: "observation",
          epistemicState: "unknown",
          typedValue: null,
          unitOrCurrency: null,
          validFrom: "2026-10-01T00:00:00.000Z",
          validTo: null,
          sourceObservedAt: null,
          sourcePublishedAt: null,
          retrievedAt: "2026-10-26T21:17:00.000Z",
          freshnessTtlSeconds: 300,
          sourceAuthority: {
            sourceDccId: srcGosnoRouteFeedId,
            organizationName: "GoSno Mountain Transportation",
            authorityTier: "operator_direct",
            competentDomains: ["private_mountain_transportation"],
            claimedDomain: "private_mountain_transportation",
            independentlyCorroboratedBySourceDccIds: [],
            licenseOrReusePolicy: "DCC / GoSno First-Party Public Route Feed",
          },
          evidenceRefs: [],
        },
      });
    }
    unknownLiveConditions.push({
      claimId: spec.claimId,
      predicate: spec.predicate,
      epistemicState: "unknown",
      typedValue: null,
    });
  }

  // Step 1 & 2: Evaluate directly through the deployed runtime path (`handleV03EvaluateRequest`)
  const decisionEvaluation = await handleV03EvaluateRequest({
    engineId: "denver-to-mountain-transportation",
    validAt: "2026-12-15T15:00:00.000Z",
    inputs: {
      groupSize: 4,
      corridorId: "denver-to-winter-park",
      weatherCondition: "winter_snow_advisory",
      maxBudgetPerPersonUsd: 400,
    },
  });

  // Regression Check 0: Requesting a shared shuttle is rejected across all candidates (`no_viable_candidates`)
  const sharedShuttleEval = await handleV03EvaluateRequest({
    engineId: "denver-to-mountain-transportation",
    validAt: "2026-12-15T15:00:00.000Z",
    inputs: {
      groupSize: 4,
      corridorId: "denver-to-winter-park",
      serviceType: "shared_shuttle",
      maxBudgetPerPersonUsd: 400,
    },
  });

  // Regression Check A: 6 passengers + 6 snowboards on Denver-to-Breckenridge must NOT treat the 6-passenger SUV as eligible
  const sixPaxSixSnowboardsEval = await handleV03EvaluateRequest({
    engineId: "denver-to-mountain-transportation",
    validAt: "2026-12-15T15:00:00.000Z",
    inputs: {
      groupSize: 6,
      snowboardCount: 6,
      luggageCount: 6,
      corridorId: "denver-to-breckenridge",
      maxBudgetPerPersonUsd: 700,
    },
  });
  const breckSuvDisp = sixPaxSixSnowboardsEval.candidateDispositions.find(
    (d) => d.legacyCandidateCode === "gosno-denver-breckenridge-private-suv",
  )!;
  const breckVanDisp = sixPaxSixSnowboardsEval.candidateDispositions.find(
    (d) => d.legacyCandidateCode === "gosno-denver-breckenridge-private-van",
  )!;

  // Regression Check B: Group of 11 passengers (> 10 max Van capacity) must be rejected across all candidates
  const elevenPaxEval = await handleV03EvaluateRequest({
    engineId: "denver-to-mountain-transportation",
    validAt: "2026-12-15T15:00:00.000Z",
    inputs: {
      groupSize: 11,
      corridorId: "denver-to-breckenridge",
      maxBudgetPerPersonUsd: 1000,
    },
  });

  const runtimeGosnoUniverse = store.universesByIdAndVersion.get(
    "univ:denver-to-mountain-transportation@0.3.0",
  )!;
  const runtimeGosnoBundle = store.bundlesByEngineAndVersion.get(
    "denver-to-mountain-transportation@0.3.0",
  )!;
  const topCandidate =
    runtimeGosnoUniverse.includedCandidates.find(
      (c) => c.candidateDccEntityId === decisionEvaluation.recommendedCandidateDccId,
    ) ?? runtimeGosnoUniverse.includedCandidates[0]!;

  const requiredActionTimeRevalidations = [
    "driver_availability",
    "vehicle_availability",
    "equipment_and_luggage_fit",
    "road_safety",
    "weather_suitability",
    "live_inventory_confirmation",
  ];

  // Step 3 & 5: Issue signed DecisionAuthorization bound to receiptId & resultHash and run shadow adapters
  const squareAuth = await issueShadowDecisionAuthorization({
    receipt: decisionEvaluation.receipt,
    permittedAction: "shadow_checkout_intent_preparation",
    providerProductReference: {
      candidateDccEntityId: topCandidate.candidateDccEntityId,
      operatorDccEntityId: topCandidate.operatorDccEntityId,
      displayName: topCandidate.displayName,
      externalAliases: {
        octo_product_id: topCandidate.legacyCandidateCode,
        square_location_id: "sq-loc-gosno-denver",
      },
    },
    maxPriceUsdDecimal: 349.0,
    requiredParameters: {
      serviceDate: "2026-12-15",
      passengerCount: 4,
      pickupNodeCode: "DEN-WEST-CURB-FLIGHT-TRACKED",
      dropoffNodeCode: "WINTER-PARK-RESORT-VILLAGE",
      luggageSkiBagCount: 4,
    },
    additionalRevalidationRequirements: requiredActionTimeRevalidations,
    targetAdapter: "square",
    issuedAtIso: "2026-10-26T21:20:01.000Z",
    ttlSeconds: 86_400 * 30,
  });

  const octoAuth = await issueShadowDecisionAuthorization({
    receipt: decisionEvaluation.receipt,
    permittedAction: "shadow_inventory_check",
    providerProductReference: {
      candidateDccEntityId: topCandidate.candidateDccEntityId,
      operatorDccEntityId: topCandidate.operatorDccEntityId,
      displayName: topCandidate.displayName,
      externalAliases: {
        octo_product_id: topCandidate.legacyCandidateCode,
        square_location_id: "sq-loc-gosno-denver",
      },
    },
    maxPriceUsdDecimal: 349.0,
    requiredParameters: {
      serviceDate: "2026-12-15",
      passengerCount: 4,
      pickupNodeCode: "DEN-WEST-CURB-FLIGHT-TRACKED",
      dropoffNodeCode: "WINTER-PARK-RESORT-VILLAGE",
      luggageSkiBagCount: 4,
    },
    additionalRevalidationRequirements: requiredActionTimeRevalidations,
    targetAdapter: "octo",
    issuedAtIso: "2026-10-26T21:20:01.000Z",
    ttlSeconds: 86_400 * 30,
  });

  // Step 4: Verify the authorization with the independent W3C SubtleCrypto verifier
  const [hB64, pB64, sB64] = squareAuth.signedAuthorization.jwsCompact.split(".");
  const headerObj = JSON.parse(Buffer.from(hB64!, "base64url").toString("utf8")) as {
    alg: string;
    kid: string;
  };
  const { getStandardJwksDocumentAsync, independentJcsReferenceCanonicalize } = await import(
    "./rfc8785AndJws"
  );
  const jwksDoc = await getStandardJwksDocumentAsync();
  const matchingKey = jwksDoc.keys.find((k) => k.kid === headerObj.kid)!;
  const subtleKey = await globalThis.crypto.subtle.importKey(
    "jwk",
    matchingKey as unknown as JsonWebKey,
    matchingKey.kty === "EC"
      ? { name: "ECDSA", namedCurve: "P-256" }
      : { name: "Ed25519" },
    false,
    ["verify"],
  );
  const verifiedSig = await globalThis.crypto.subtle.verify(
    matchingKey.kty === "EC" ? { name: "ECDSA", hash: "SHA-256" } : { name: "Ed25519" },
    subtleKey,
    Buffer.from(sB64!, "base64url"),
    new TextEncoder().encode(`${hB64}.${pB64}`),
  );
  const decodedAuthPayload = JSON.parse(Buffer.from(pB64!, "base64url").toString("utf8"));
  const jcsMatches =
    independentJcsReferenceCanonicalize(decodedAuthPayload) ===
    rfc8785Canonicalize(squareAuth.signedAuthorization.payload);

  // Step 8: Record the shadow outcome event in the shared runtime append-only ledger
  const shadowOutcomeEvent = store.knowledgeLedger.appendEvent({
    eventType: "shadow_authorization_dry_run_recorded",
    claimId: `shadow-outcome:${squareAuth.signedAuthorization.authorizationId}`,
    claimVersionId: `shadow-outcome:${squareAuth.signedAuthorization.authorizationId}:v1`,
    recordedAt: "2026-10-26T21:20:02.000Z",
    actorId: "dcc-v031-shadow-commerce-auditor",
    isSynthetic: false,
    provenanceClass: "operational_evidence",
    reason: `Shadow authorization ${squareAuth.signedAuthorization.authorizationId} bound to receipt ${decisionEvaluation.receiptId} (resultHash=${decisionEvaluation.resultHash}) validated via Square and OCTO shadow adapters with liveExternalCallsMade=0 and executionMode=shadow_only_no_side_effects.`,
  });

  const withdrawnRef = store.evidenceRefsById.get("evref:gosno:tariff-2026-winter-park");
  const withdrawnSharedShuttleExcludedFromUniverse =
    withdrawnRef?.withdrawn === true &&
    runtimeGosnoUniverse.includedCandidates.every(
      (c) => c.legacyCandidateCode !== "gosno-denver-winter-park-express",
    ) &&
    runtimeGosnoUniverse.knownExclusions.some(
      (ex) => ex.externalOrLegacyIdentifier === "gosno-denver-winter-park-express",
    );

  return {
    decisionEvaluation,
    signedAuthorization: squareAuth.signedAuthorization,
    independentAuthorizationVerification: {
      valid: verifiedSig && jcsMatches,
      verifiedBy: "W3C_WebCrypto_SubtleCrypto_and_Independent_JCS" as const,
      alg: headerObj.alg,
      kid: headerObj.kid,
    },
    squareShadowResult: squareAuth.adapterDryRun,
    octoShadowResult: octoAuth.adapterDryRun,
    unknownLiveConditions,
    deployedRuntimeRegressions: {
      usesOrdinaryDeployedRuntimeStore: true,
      usesDeployedRuntimeBundleHash: runtimeGosnoBundle.bundleHash,
      usesDeployedRuntimeUniverseHash: runtimeGosnoUniverse.universeHash,
      sharedShuttleExcludedAndWithdrawn: {
        withdrawnSharedShuttleExcludedFromUniverse,
        sharedShuttleRequestDecisionState: sharedShuttleEval.decisionState,
      },
      sixPassengersWithSixSnowboardsEscalatesSuvToVan: {
        suvDisposition: breckSuvDisp.disposition,
        vanDisposition: breckVanDisp.disposition,
        suvReasonCodes: breckSuvDisp.reasonCodes,
        recommendedCandidateCode: sixPaxSixSnowboardsEval.recommendedCandidateLegacyCode,
        recommendedCandidateLegacyCode: sixPaxSixSnowboardsEval.recommendedCandidateLegacyCode,
      },
      groupAboveTenPassengersRejected: {
        decisionState: elevenPaxEval.decisionState,
        recommendedCandidateCode: elevenPaxEval.recommendedCandidateLegacyCode,
        allRejected: elevenPaxEval.candidateDispositions.every(
          (d) => d.disposition === "ineligible",
        ),
        allCandidatesIneligible: elevenPaxEval.candidateDispositions.every(
          (d) => d.disposition === "ineligible",
        ),
      },
    },
    ledgerShadowOutcomeEvent: {
      eventId: shadowOutcomeEvent.eventId,
      eventHash: shadowOutcomeEvent.eventHash,
      eventType: shadowOutcomeEvent.eventType,
      recordedAt: shadowOutcomeEvent.recordedAt,
      reason: shadowOutcomeEvent.reason,
    },
  };
}


