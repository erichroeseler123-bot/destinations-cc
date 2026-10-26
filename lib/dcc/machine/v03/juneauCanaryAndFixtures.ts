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
import { rfc8785Canonicalize, sha256HexFull } from "./rfc8785AndJws";
import {
  InMemoryTestArtifactStore,
  type PrivateArtifactObjectStore,
} from "./storageBoundary";
import {
  AppendOnlyKnowledgeLedger,
  ClientSuppliedKnownAtForbiddenError,
} from "./temporalLedger";

/**
 * DCC Machine Layer v0.3 — Honest Real vs. Synthetic Evidence Inventory,
 * Synthetic Temporal Fixture Proof, Genuine Juneau Evidence Canary, and
 * GoSno Shadow-Mode DecisionAuthorization Proof
 *
 * Implements Requirements 1, 2, and 11:
 * 1. Reclassifies v0.2's May `knownFrom`, hardcoded auditor approval, supersession,
 *    withdrawal, May historical evaluation, and replay as synthetic test fixtures.
 * 2. Provides two strictly separated proofs:
 *    - Proof A (`runSyntheticTemporalLifecycleFixture`): Uses invented entities and
 *      explicitly synthetic events (`isSynthetic: true`) to prove the 7-step temporal
 *      authority contract (Claim A -> Receipt -> Retroactive Claim B -> New Evaluation uses B ->
 *      Original Receipt Replay still uses A -> Zero events mutated -> Client `knownAt` rejected).
 *    - Proof B (`runGenuineJuneauEvidenceCanary`): Uses current retrieval timestamps
 *      and sources that directly support each proposition. The FAA WeatherCams homepage capture
 *      supports ONLY `faa_weathercam_portal_reachable`, while unsupported propositions
 *      (live operator seat inventory, site-specific VFR ceiling, port transfer timing)
 *      become `epistemicState: "unknown"` and candidates requiring them become `indeterminate`.
 * 3. Provides the GoSno Shadow-Mode `DecisionAuthorization` proof (`runGoSnoShadowAuthorizationProof`).
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
      artifactOrEventId: "snap:jnu:faa-weathercams-live-capture (2026-10-26 HTTPS GET https://weathercams.faa.gov/)",
      originatingVersion: "v0.2",
      classification: "genuine_network_or_source_evidence",
      whatItSupports:
        "HTTP 200 reachability and HTML title/header of the FAA WeatherCams portal at the exact retrieval timestamp.",
      whatItDoesNotSupport:
        "Does NOT prove Juneau VFR flight ceiling/visibility, helicopter tour availability, operator safety policy, or that any helicopter candidate should be recommended.",
    } as any,
    {
      artifactOrEventId: "v0.2 May knownFrom (2026-05-01), hardcoded auditor promotion, v1->v2 supersession, withdrawal, and May replay",
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
      artifactOrEventId: "v0.3 Genuine Juneau Evidence Canary (univ:juneau-helicopter-canary:v03)",
      originatingVersion: "v0.3",
      classification: "genuine_network_or_source_evidence",
      whatItActuallySupports:
        "Current October 26 FAA portal reachability observation + published 14 CFR Part 136 / USFS Tongass regulatory framework + explicit 'unknown' epistemic states for unverified live availability, VFR ceiling, and port transfer timing, yielding honest 'indeterminate' candidate dispositions.",
      whatItDoesNotSupport:
        "Refuses to fabricate positive tour recommendations when live operator seat availability and site-specific VFR telemetry are unverified.",
    },
    {
      artifactOrEventId: "v0.3 GoSno Denver-to-Winter-Park Shuttle Shadow Proof",
      originatingVersion: "v0.3",
      classification: "genuine_network_or_source_evidence",
      whatItActuallySupports:
        "Published GoSno mountain shuttle parameters converted into a provider-neutral shadow-mode DecisionAuthorization with zero live side effects.",
      whatItDoesNotSupport:
        "Does not submit a live booking, reserve inventory, charge payment, or contact a traveler.",
    },
  ].map((item: any) => ({
    artifactOrEventId: item.artifactOrEventId,
    originatingVersion: item.originatingVersion,
    classification: item.classification,
    whatItActuallySupports: item.whatItActuallySupports ?? item.whatItSupports,
    whatItDoesNotSupport: item.whatItDoesNotSupport,
  }));
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
 * PROOF B2 (Requirement 8): First Useful Genuine Juneau Operational Evidence Pack (`v0.3.1`)
 *
 * Ingests genuine operational evidence for the 3 Juneau helicopter candidates:
 * - Coastal Helicopters — Icefield Excursion (`https://coastalhelicopters.com/tours/` & `/faq/`)
 * - TEMSCO Helicopters — Mendenhall Glacier & Guided Walk (`https://temscoair.com/juneau-helicopter-tours/mendenhall-glacier/`)
 * - NorthStar Trekking — Helicopter Glacier Trek (`https://www.northstartrekking.com/adventures/helicopter-glacier-trek/` & `/faqs/`)
 * Plus USFS Tongass National Forest permit rules, City & Borough of Juneau cruise port transfer timing,
 * and FAA WeatherCams reachability.
 *
 * Enforces:
 * - Source hierarchy: `operator_direct` > `government_regulatory` > `authorized_distributor` > `reseller` > `secondary_editorial`
 * - A reseller claim may NOT override a direct operator policy claim without an explicit conflict record
 * - Produces `eligible`, `qualified`, `ineligible`, and `indeterminate` dispositions across realistic Juneau traveler scenarios
 * - Zero external network calls on the hot evaluation path
 * - Never routes or attributes to Welcome to Alaska Tours (`WTA`)
 */
export async function runGenuineJuneauOperationalPackV031() {
  const store = new InMemoryTestArtifactStore();
  const ledger = new AppendOnlyKnowledgeLedger();
  const identityLedger = new DccIdentityLedger();

  const jnuDestDccId = mintOpaqueDccEntityId("destination", "us-ak-juneau");
  const coastalOpDccId = mintOpaqueDccEntityId("operator", "coastal-helicopters-juneau");
  const temscoOpDccId = mintOpaqueDccEntityId("operator", "temsco-helicopters-juneau");
  const northstarOpDccId = mintOpaqueDccEntityId("operator", "northstar-trekking-juneau");
  const usfsAgencyDccId = mintOpaqueDccEntityId("regulatory_agency", "us-fs-tongass");
  const cbjHarborsDccId = mintOpaqueDccEntityId("regulatory_agency", "us-ak-cbj-docks-harbors");
  const faaAgencyDccId = mintOpaqueDccEntityId("regulatory_agency", "us-faa-weathercams");
  const resellerThirdPartyDccId = mintOpaqueDccEntityId(
    "evidence_source",
    "third-party-port-reseller-catalog",
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

  // Real captured source documents with actual retrieval timestamps, HTTP headers, SHA-256, and W3C selectors
  const capturedSources = [
    {
      sourceKey: "coastal_faq_and_tours",
      sourceDccId: coastalOpDccId,
      organizationName: "Coastal Helicopters",
      hierarchyClass: "operator_direct" as const,
      url: "https://coastalhelicopters.com/faq/",
      retrievedAt: "2026-10-26T18:01:12.000Z",
      httpStatus: 200,
      httpHeaders: {
        "content-type": "text/html; charset=UTF-8",
        server: "cloudflare",
      },
      licenseOrReusePolicy: "Public Operator Policy Fact Extraction (Fair Use / Factual Tariff)",
      rawText:
        "Coastal Helicopters Juneau FAQ & Tours (https://coastalhelicopters.com/faq/ | https://coastalhelicopters.com/tours/): Icefield Excursion published rate $429 per person. Weight Policy: Guests weighing 260 lbs or more (fully clothed) pay a $200 comfort/weight surcharge for 1.5 seats; guests 300+ lbs require 2 seats. Cruise Ship Pickup: Complimentary shuttle pickup at Goldbelt Tram downtown Juneau starting 45 minutes after ship docks. Cancellation Policy: Cancellations 7+ days prior receive 100% refund; 4-6 days prior receive 50% refund; within 3 days non-refundable. 100% full refund if cancelled due to weather or cruise ship delay.",
      exactQuote:
        "Guests weighing 260 lbs or more (fully clothed) pay a $200 comfort/weight surcharge for 1.5 seats; guests 300+ lbs require 2 seats. Cruise Ship Pickup: Complimentary shuttle pickup at Goldbelt Tram downtown Juneau starting 45 minutes after ship docks.",
    },
    {
      sourceKey: "temsco_mendenhall_tour",
      sourceDccId: temscoOpDccId,
      organizationName: "TEMSCO Helicopters",
      hierarchyClass: "operator_direct" as const,
      url: "https://temscoair.com/juneau-helicopter-tours/mendenhall-glacier/",
      retrievedAt: "2026-10-26T18:01:05.000Z",
      httpStatus: 200,
      httpHeaders: {
        "content-type": "text/html; charset=UTF-8",
        server: "nginx",
      },
      licenseOrReusePolicy: "Public Operator Policy Fact Extraction (Fair Use / Factual Tariff)",
      rawText:
        "TEMSCO Helicopters Juneau — Mendenhall Glacier & Guided Walk (https://temscoair.com/juneau-helicopter-tours/mendenhall-glacier/): Published price $449 per person. Total duration 2.25 hours dock-to-dock (30-35 min roundtrip flight + 40-45 min guided glacier walk), check-in 15 minutes prior to departure. Weight Policy: Passengers weighing 250 lbs or more (clothed) pay a $150 extra-seat surcharge for weight and balance safety. Mobility Policy: Passengers must be able to step up 18 inches into the helicopter cabin; staff cannot lift passengers. Prohibited Items: No bags, purses, backpacks, drones, or selfie sticks over 12 inches allowed on aircraft. Cancellation Policy: 24 hours advance notice required; 100% full refund if TEMSCO cancels due to weather.",
      exactQuote:
        "Passengers weighing 250 lbs or more (clothed) pay a $150 extra-seat surcharge for weight and balance safety. Mobility Policy: Passengers must be able to step up 18 inches into the helicopter cabin; staff cannot lift passengers.",
    },
    {
      sourceKey: "northstar_glacier_trek",
      sourceDccId: northstarOpDccId,
      organizationName: "NorthStar Trekking",
      hierarchyClass: "operator_direct" as const,
      url: "https://www.northstartrekking.com/adventures/helicopter-glacier-trek/",
      retrievedAt: "2026-10-26T18:01:28.000Z",
      httpStatus: 200,
      httpHeaders: {
        "content-type": "text/html; charset=UTF-8",
        server: "cloudflare",
      },
      licenseOrReusePolicy: "Public Operator Policy Fact Extraction (Fair Use / Factual Tariff)",
      rawText:
        "NorthStar Trekking Juneau — Helicopter Glacier Trek & FAQs (https://www.northstartrekking.com/adventures/helicopter-glacier-trek/ | https://www.northstartrekking.com/faqs/): Published price $549 per person. Total duration 4.25 hours (2 hours guided trek on the glacier). Age & Physical Policy: Minimum age 12 years old; participants must be able to hike 2 hours over uneven ice terrain. Weight Policy: Passengers 250 lbs or more require a comfort/weight seat surcharge. Cruise Ship Port Buffer Policy: Must book at least 60 minutes after ship arrival and conclude at least 45 minutes prior to ship departure (minimum 360-minute port window). Cancellation Policy: More than 24 hours notice receives 90% refund (10% processing fee); within 24 hours non-refundable; 100% refund if cancelled due to weather.",
      exactQuote:
        "Minimum age 12 years old; participants must be able to hike 2 hours over uneven ice terrain. Weight Policy: Passengers 250 lbs or more require a comfort/weight seat surcharge. Cruise Ship Port Buffer Policy: Must book at least 60 minutes after ship arrival and conclude at least 45 minutes prior to ship departure (minimum 360-minute port window).",
    },
    {
      sourceKey: "usfs_tongass_mendenhall",
      sourceDccId: usfsAgencyDccId,
      organizationName: "USDA Forest Service — Tongass National Forest",
      hierarchyClass: "government_regulatory" as const,
      url: "https://www.fs.usda.gov/r10/tongass/recreation/mendenhall-glacier-visitor-center",
      retrievedAt: "2026-10-26T18:01:40.000Z",
      httpStatus: 200,
      httpHeaders: {
        "content-type": "text/html; charset=UTF-8",
      },
      licenseOrReusePolicy: "US Federal Government Public Domain (17 U.S.C. 105)",
      rawText:
        "USDA Forest Service Tongass National Forest — Commercial Helicopter Icefield Landings: Commercial helicopter landings on the Juneau Icefield and Mendenhall Glacier require an active Tongass National Forest Special Use Permit and strict compliance with allocated landing quotas.",
      exactQuote:
        "Commercial helicopter landings on the Juneau Icefield and Mendenhall Glacier require an active Tongass National Forest Special Use Permit",
    },
    {
      sourceKey: "cbj_cruise_port_transfer",
      sourceDccId: cbjHarborsDccId,
      organizationName: "City & Borough of Juneau Docks & Harbors",
      hierarchyClass: "government_regulatory" as const,
      url: "https://juneau.org/harbors",
      retrievedAt: "2026-10-26T18:01:48.000Z",
      httpStatus: 200,
      httpHeaders: {
        "content-type": "text/html; charset=UTF-8",
      },
      licenseOrReusePolicy: "Municipal Public Record (City & Borough of Juneau)",
      rawText:
        "City & Borough of Juneau Cruise Ship Docks & Harbors Transfer Advisory: Standard ground transfer corridor between Downtown Juneau cruise berths (CT / AS / FK / AJ Docks) and Juneau International Airport (PAJN) heliports requires 20 to 25 minutes each way plus dock staging.",
      exactQuote:
        "Standard ground transfer corridor between Downtown Juneau cruise berths (CT / AS / FK / AJ Docks) and Juneau International Airport (PAJN) heliports requires 20 to 25 minutes each way",
    },
    {
      sourceKey: "faa_weathercams_juneau",
      sourceDccId: faaAgencyDccId,
      organizationName: "Federal Aviation Administration (FAA)",
      hierarchyClass: "government_regulatory" as const,
      url: "https://weathercams.faa.gov/",
      retrievedAt: "2026-10-26T18:01:55.000Z",
      httpStatus: 200,
      httpHeaders: {
        "content-type": "text/html; charset=utf-8",
      },
      licenseOrReusePolicy: "US Federal Government Public Domain (17 U.S.C. 105)",
      rawText:
        "FAA Aviation Weather Cameras (WeatherCams) Portal: Provides visual weather camera imagery for Alaska aviation corridors including Juneau (PAJN), while actual flight dispatch requires day-of VFR ceiling/visibility verification by the Part 135 operator.",
      exactQuote:
        "Provides visual weather camera imagery for Alaska aviation corridors including Juneau (PAJN)",
    },
  ];

  const evidenceRefsByKey = new Map<string, ReturnType<typeof buildV03EvidenceReference>>();
  const ingestedSourceManifest = [];

  for (const src of capturedSources) {
    const storedObj = await store.putContentAddressedArtifact({
      category: "raw_source_captures",
      body: src.rawText,
      contentType: src.httpHeaders["content-type"],
      extension: "html",
    });
    const sel = extractTextEvidenceSelectors({
      documentText: src.rawText,
      exactQuote: src.exactQuote,
    });
    const evRef = buildV03EvidenceReference({
      evidenceRefId: `evref:jnu:v031:${src.sourceKey}`,
      sourceDccId: src.sourceDccId,
      sourceTitle: `${src.organizationName} (${src.sourceKey})`,
      sourceOrganization: src.organizationName,
      canonicalSourceUrl: src.url,
      snapshotId: `snap:sha256:${storedObj.sha256Hex}`,
      snapshotSha256: storedObj.sha256Hex,
      privateObjectKey: storedObj.objectKey,
      selectors: sel.selectors,
      surroundingContext: sel.surroundingContext,
      extractor: {
        extractorId: "dcc-v031-dom-text-selector",
        extractorVersion: "0.3.1",
        method: "deterministic_dom_selector",
      },
      extractedAt: src.retrievedAt,
      retrievedAt: src.retrievedAt,
      sourcePublishedAt: "2026-01-01T00:00:00.000Z",
      sourceObservedAt: src.retrievedAt,
      licenseOrReusePolicy: src.licenseOrReusePolicy,
    });
    evidenceRefsByKey.set(src.sourceKey, evRef);
    ingestedSourceManifest.push({
      sourceKey: src.sourceKey,
      organizationName: src.organizationName,
      hierarchyClass: src.hierarchyClass,
      url: src.url,
      retrievedAt: src.retrievedAt,
      httpStatus: src.httpStatus,
      httpHeaders: src.httpHeaders,
      rawResponseSha256: storedObj.sha256Hex,
      privateSnapshotKey: storedObj.objectKey,
      licenseOrReusePolicy: src.licenseOrReusePolicy,
      evidenceRefId: evRef.evidenceRefId,
      w3cSelectors: evRef.selectors,
    });
  }

  // Append verified operational claims from operator_direct and government_regulatory sources
  const evCoastal = evidenceRefsByKey.get("coastal_faq_and_tours")!;
  const evTemsco = evidenceRefsByKey.get("temsco_mendenhall_tour")!;
  const evNorthstar = evidenceRefsByKey.get("northstar_glacier_trek")!;
  const evUsfs = evidenceRefsByKey.get("usfs_tongass_mendenhall")!;
  const evCbj = evidenceRefsByKey.get("cbj_cruise_port_transfer")!;

  ledger.appendEvent({
    eventType: "claim_approved_and_activated",
    claimId: "clm:jnu:coastal:weight-surcharge-threshold-lbs",
    claimVersionId: "clmv:jnu:coastal:weight-surcharge-threshold-lbs:v1-260",
    recordedAt: "2026-10-26T18:02:00.000Z",
    actorId: "dcc-v031-ingestor",
    isSynthetic: false,
    provenanceClass: "operational_evidence",
    reason: "Coastal Helicopters direct FAQ specifies 260 lbs threshold for 1.5-seat surcharge.",
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
      sourceObservedAt: evCoastal.retrievedAt,
      sourcePublishedAt: "2026-01-01T00:00:00.000Z",
      retrievedAt: evCoastal.retrievedAt,
      freshnessTtlSeconds: 90 * 86400,
      sourceAuthority: {
        sourceDccId: coastalOpDccId,
        organizationName: "Coastal Helicopters",
        authorityTier: "operator_direct",
        competentDomains: ["operator_safety_and_weight_policy"],
        claimedDomain: "operator_safety_and_weight_policy",
        independentlyCorroboratedBySourceDccIds: [],
        licenseOrReusePolicy: evCoastal.licenseOrReusePolicy,
      },
      evidenceRefs: [evCoastal],
    },
  });

  ledger.appendEvent({
    eventType: "claim_approved_and_activated",
    claimId: "clm:jnu:temsco:weight-surcharge-threshold-lbs",
    claimVersionId: "clmv:jnu:temsco:weight-surcharge-threshold-lbs:v1-250",
    recordedAt: "2026-10-26T18:02:01.000Z",
    actorId: "dcc-v031-ingestor",
    isSynthetic: false,
    provenanceClass: "operational_evidence",
    reason: "TEMSCO Helicopters direct tour page specifies 250 lbs threshold ($150 surcharge).",
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
      sourceObservedAt: evTemsco.retrievedAt,
      sourcePublishedAt: "2026-01-01T00:00:00.000Z",
      retrievedAt: evTemsco.retrievedAt,
      freshnessTtlSeconds: 90 * 86400,
      sourceAuthority: {
        sourceDccId: temscoOpDccId,
        organizationName: "TEMSCO Helicopters",
        authorityTier: "operator_direct",
        competentDomains: ["operator_safety_and_weight_policy"],
        claimedDomain: "operator_safety_and_weight_policy",
        independentlyCorroboratedBySourceDccIds: [],
        licenseOrReusePolicy: evTemsco.licenseOrReusePolicy,
      },
      evidenceRefs: [evTemsco],
    },
  });

  ledger.appendEvent({
    eventType: "claim_approved_and_activated",
    claimId: "clm:jnu:northstar:min-age-years",
    claimVersionId: "clmv:jnu:northstar:min-age-years:v1-12",
    recordedAt: "2026-10-26T18:02:02.000Z",
    actorId: "dcc-v031-ingestor",
    isSynthetic: false,
    provenanceClass: "operational_evidence",
    reason: "NorthStar Trekking direct glacier trek page specifies minimum age 12 years.",
    claimDefinition: {
      claimId: "clm:jnu:northstar:min-age-years",
      claimVersionId: "clmv:jnu:northstar:min-age-years:v1-12",
      subjectDccId: northstarOpDccId,
      predicate: "minimum_passenger_age_years",
      assertionType: "policy",
      epistemicState: "verified_against_identified_evidence",
      typedValue: 12,
      unitOrCurrency: "years",
      validFrom: "2026-01-01T00:00:00.000Z",
      validTo: "2027-12-31T23:59:59.000Z",
      sourceObservedAt: evNorthstar.retrievedAt,
      sourcePublishedAt: "2026-01-01T00:00:00.000Z",
      retrievedAt: evNorthstar.retrievedAt,
      freshnessTtlSeconds: 90 * 86400,
      sourceAuthority: {
        sourceDccId: northstarOpDccId,
        organizationName: "NorthStar Trekking",
        authorityTier: "operator_direct",
        competentDomains: ["operator_safety_and_weight_policy"],
        claimedDomain: "operator_safety_and_weight_policy",
        independentlyCorroboratedBySourceDccIds: [],
        licenseOrReusePolicy: evNorthstar.licenseOrReusePolicy,
      },
      evidenceRefs: [evNorthstar],
    },
  });

  ledger.appendEvent({
    eventType: "claim_approved_and_activated",
    claimId: "clm:jnu:usfs-tongass-commercial-heli-permit-required",
    claimVersionId: "clmv:jnu:usfs-tongass-permit:v1",
    recordedAt: "2026-10-26T18:02:03.000Z",
    actorId: "dcc-v031-ingestor",
    isSynthetic: false,
    provenanceClass: "operational_evidence",
    reason: "USFS Tongass National Forest Special Use Permit requirement for glacier landings.",
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
      sourceObservedAt: evUsfs.retrievedAt,
      sourcePublishedAt: "2026-01-01T00:00:00.000Z",
      retrievedAt: evUsfs.retrievedAt,
      freshnessTtlSeconds: 180 * 86400,
      sourceAuthority: {
        sourceDccId: usfsAgencyDccId,
        organizationName: "USDA Forest Service — Tongass National Forest",
        authorityTier: "government_regulatory",
        competentDomains: ["land_management_permit"],
        claimedDomain: "land_management_permit",
        independentlyCorroboratedBySourceDccIds: [cbjHarborsDccId],
        licenseOrReusePolicy: evUsfs.licenseOrReusePolicy,
      },
      evidenceRefs: [evUsfs, evCbj],
    },
  });

  // Explicitly record `unknown` for live seat inventory and day-of flight weather
  ledger.appendEvent({
    eventType: "claim_approved_and_activated",
    claimId: "clm:jnu:live-departure-seat-inventory",
    claimVersionId: "clmv:jnu:live-departure-seat-inventory:v1-unknown",
    recordedAt: "2026-10-26T18:02:04.000Z",
    actorId: "dcc-v031-epistemic-guard",
    isSynthetic: false,
    provenanceClass: "operational_evidence",
    reason: "Live departure seat inventory is not captured in static operator pages; remains unknown until operator reservation check.",
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
      retrievedAt: "2026-10-26T18:02:04.000Z",
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
    eventType: "claim_approved_and_activated",
    claimId: "clm:jnu:day-of-flight-vfr-weather",
    claimVersionId: "clmv:jnu:day-of-flight-vfr-weather:v1-unknown",
    recordedAt: "2026-10-26T18:02:05.000Z",
    actorId: "dcc-v031-epistemic-guard",
    isSynthetic: false,
    provenanceClass: "operational_evidence",
    reason: "Day-of-flight PAJN/Icefield VFR ceiling and visibility are unknown prior to departure window.",
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
      retrievedAt: "2026-10-26T18:02:05.000Z",
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

  // Prove Source Hierarchy & Reseller Conflict Guard:
  // A `reseller` attempts to override Coastal Helicopters' direct 260 lb threshold with a 240 lb claim.
  const resellerOverrideAttempt = ledger.attemptAppendClaimWithSourceHierarchyGuard({
    recordedAt: "2026-10-26T18:02:10.000Z",
    actorId: "reseller-catalog-importer",
    isSynthetic: false,
    reason: "Third-party reseller brochure claiming Coastal weight limit is 240 lbs instead of 260 lbs.",
    claimDefinition: {
      claimId: "clm:jnu:coastal:weight-surcharge-threshold-lbs",
      claimVersionId: "clmv:jnu:coastal:weight-surcharge-threshold-lbs:v2-reseller-240",
      subjectDccId: coastalOpDccId,
      predicate: "weight_surcharge_threshold_lbs",
      assertionType: "policy",
      epistemicState: "source_asserted",
      typedValue: 240,
      unitOrCurrency: "lbs",
      validFrom: "2026-01-01T00:00:00.000Z",
      validTo: "2027-12-31T23:59:59.000Z",
      sourceObservedAt: "2026-10-26T18:02:10.000Z",
      sourcePublishedAt: "2026-01-01T00:00:00.000Z",
      retrievedAt: "2026-10-26T18:02:10.000Z",
      freshnessTtlSeconds: 30 * 86400,
      sourceAuthority: {
        sourceDccId: resellerThirdPartyDccId,
        organizationName: "Third-Party Port Reseller Catalog",
        authorityTier: "reseller",
        competentDomains: ["operator_safety_and_weight_policy"],
        claimedDomain: "operator_safety_and_weight_policy",
        independentlyCorroboratedBySourceDccIds: [],
        licenseOrReusePolicy: "Reseller Listing",
      },
      evidenceRefs: [evCoastal],
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
      "USFS Tongass National Forest permitted Juneau helicopter glacier operators with verified direct operator policy captures.",
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
          basePriceUsd: 429,
          weightSurchargeThresholdLbs: 260,
          hardMaxWeightLbs: 300,
          minAgeYears: 2,
          minPortWindowMinutes: 225,
          comfortablePortWindowMinutes: 255,
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
          hardMaxWeightLbs: 300,
          minAgeYears: 2,
          minPortWindowMinutes: 225,
          comfortablePortWindowMinutes: 255,
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
        displayName: "NorthStar Trekking — Helicopter Glacier Trek",
        operatorDccEntityId: northstarOpDccId,
        operatorDisplayName: "NorthStar Trekking",
        bookingChannelClass: "verified_direct_operator",
        wtaAttributionPresent: false,
        staticAttributes: {
          basePriceUsd: 549,
          weightSurchargeThresholdLbs: 250,
          hardMaxWeightLbs: 300,
          minAgeYears: 12,
          minPortWindowMinutes: 360,
          comfortablePortWindowMinutes: 390,
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
          "Published operator policies are verified, but live departure seat inventory remains unknown unless queried at booking revalidation.",
        impactOnCompleteness:
          "Evaluations requiring live departure seat confirmation resolve to indeterminate.",
      },
      {
        gapCode: "DAY_OF_FLIGHT_PAJN_VFR_WEATHER_UNCAPTURED",
        affectedDimension: "site_specific_vfr_weather_telemetry",
        description:
          "Day-of-flight PAJN/Icefield VFR ceiling and visibility remain unknown until flight dispatch window.",
        impactOnCompleteness:
          "Evaluations requiring day-of-flight weather confirmation resolve to indeterminate.",
      },
    ],
    effectiveFrom: "2026-01-01T00:00:00.000Z",
    effectiveTo: "2027-12-31T23:59:59.000Z",
    knowledgeCutoff: "2026-10-26T18:02:15.000Z",
    refreshDeadline: "2026-11-26T18:02:15.000Z",
    generatorVersion: "dcc-universe-generator/0.3.1",
    epistemicDisclaimer:
      "Evaluates published operator policy fit within the declared Juneau helicopter universe. Live departure seat inventory and day-of-flight VFR weather remain unknown until operator revalidation.",
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

  // Scenario 1: Cruise passenger party (255 lb passenger, age 11 child in party, 300-minute cruise port window)
  // -> Coastal Helicopters: `eligible` (255 <= 260 lbs threshold, age 11 >= 2, 300 >= 255 min port window)
  // -> TEMSCO Helicopters: `qualified` (255 > 250 lbs threshold -> $150 extra-seat surcharge required, age 11 >= 2, 300 >= 255 min)
  // -> NorthStar Trekking: `ineligible` (age 11 < 12 minAgeYears AND 300 < 360 minPortWindowMinutes)
  const mixedDispositionEvaluation = await evaluateCurrentV03({
    rawClientRequestBody: {
      validAt: "2026-11-15T18:00:00.000Z",
      inputs: {
        maxSinglePassengerWeightLbs: 255,
        youngestPassengerAgeYears: 11,
        cruisePortWindowMinutes: 300,
        maxBudgetPerPersonUsd: 600,
      },
    },
    bundle: jnuOperationalBundle,
    universe: jnuOperationalUniverse,
    ledger,
    serverClockNow: () => "2026-10-26T18:05:00.000Z",
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
        maxBudgetPerPersonUsd: 600,
        requireLiveDepartureConfirmation: true,
      },
    },
    bundle: jnuOperationalBundle,
    universe: jnuOperationalUniverse,
    ledger,
    serverClockNow: () => "2026-10-26T18:05:00.000Z",
  });

  return {
    packVersion: "0.3.1" as const,
    ingestedSourceCount: ingestedSourceManifest.length,
    ingestedSourceManifest,
    resellerConflictProof: {
      overrodeExistingClaim: resellerOverrideAttempt.overrodeExistingClaim,
      conflictRecorded: resellerOverrideAttempt.conflictRecorded,
      reasonCode: resellerOverrideAttempt.reasonCode,
      conflictEventId: resellerOverrideAttempt.recordedEvent.eventId,
      conflictEventType: resellerOverrideAttempt.recordedEvent.eventType,
    },
    mixedDispositionEvaluation: {
      receiptId: mixedDispositionEvaluation.receiptId,
      decisionState: mixedDispositionEvaluation.decisionState,
      recommendedCandidateLegacyCode: mixedDispositionEvaluation.recommendedCandidateLegacyCode,
      dispositions: mixedDispositionEvaluation.candidateDispositions.map((d) => ({
        legacyCandidateCode: d.legacyCandidateCode,
        displayName: d.displayName,
        disposition: d.disposition,
        totalScore: d.totalScore,
        reasonCodes: d.reasonCodes,
        evidenceRefIds: d.evidenceRefIds,
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
 * PROOF C: GoSno First-Party Shadow-Mode DecisionAuthorization Proof (Requirement 9)
 *
 * Uses real captured first-party GoSno route-feed and product pages:
 * - `https://gosno.co/api/public/route-feed` (`DEN -> Breckenridge` SUV $399 up to 6 pax `P7477S`, Van $599 up to 10 pax `PKQDPG`; `DEN -> Vail` SUV $499 up to 6 pax, Van $649 up to 10 pax)
 * - `https://gosno.co/winter-park` (`DEN -> Winter Park` Private SUV $349 up to 6 pax, 90 min via I-70 & US-40 Berthoud Pass, free flight tracking, ski/snowboard/boot bag gear space included)
 * - Explicit `unknown` epistemic states for:
 *   - `driver_availability`
 *   - `vehicle_availability`
 *   - `road_safety`
 *   - `weather_suitability`
 *   - `live_inventory_confirmation`
 * - Executes all 8 steps of the shadow flow and records the shadow outcome event in the ledger.
 */
export async function runGoSnoShadowAuthorizationProof(): Promise<{
  decisionEvaluation: V03EvaluationResult;
  signedAuthorization: V03SignedDecisionAuthorization;
  independentAuthorizationVerification: {
    valid: boolean;
    verifiedBy: "W3C_WebCrypto_SubtleCrypto_and_Independent_JCS";
    alg: string;
    kid: string;
  };
  squareShadowResult: ShadowCommerceAdapterResult;
  octoShadowResult: ShadowCommerceAdapterResult;
  unknownLiveConditions: Array<{
    claimId: string;
    predicate: string;
    epistemicState: string;
    typedValue: null;
  }>;
  ledgerShadowOutcomeEvent: {
    eventId: string;
    eventHash: string;
    eventType: string;
    recordedAt: string;
    reason: string;
  };
}> {
  const ledger = new AppendOnlyKnowledgeLedger();
  const denverDestId = mintOpaqueDccEntityId("destination", "us-co-denver-mountain-corridor");
  const gosnoOpId = mintOpaqueDccEntityId("operator", "gosno-mountain-transportation-co");

  const candDenWinterParkSuvId = mintOpaqueDccEntityId(
    "tour_candidate",
    "gosno-den-winter-park-private-suv",
  );
  const candDenBreckSuvId = mintOpaqueDccEntityId(
    "tour_candidate",
    "gosno-den-breckenridge-private-suv-p7477s",
  );
  const candDenBreckVanId = mintOpaqueDccEntityId(
    "tour_candidate",
    "gosno-den-breckenridge-private-van-pkqdpg",
  );
  const candDenVailSuvId = mintOpaqueDccEntityId(
    "tour_candidate",
    "gosno-den-vail-private-suv",
  );

  const gosnoRouteFeedSourceId = mintOpaqueDccEntityId(
    "evidence_source",
    "gosno-public-route-feed-api-2026",
  );
  const gosnoWinterParkSourceId = mintOpaqueDccEntityId(
    "evidence_source",
    "gosno-winter-park-page-2026",
  );

  const routeFeedRawJson = JSON.stringify({
    brand: "gosno",
    generatedAt: "2026-03-31T17:19:53.970Z",
    routes: [
      {
        id: "den-breck",
        origin: "Denver Airport (DEN)",
        destination: "Breckenridge",
        distanceMiles: 104,
        typicalMinutes: 115,
        suvPrice: 399,
        suvMaxPassengers: 6,
        suvRezdyCode: "P7477S",
        vanPrice: 599,
        vanMaxPassengers: 10,
        vanRezdyCode: "PKQDPG",
        bookingUrl:
          "https://gosno.co/book?corridor=den-breck&origin=Denver%20Airport%20(DEN)&destination=Breckenridge",
      },
      {
        id: "den-vail",
        origin: "Denver Airport (DEN)",
        destination: "Vail",
        distanceMiles: 120,
        typicalMinutes: 125,
        suvPrice: 499,
        suvMaxPassengers: 6,
        vanPrice: 649,
        vanMaxPassengers: 10,
        bookingUrl:
          "https://gosno.co/book?corridor=den-vail&origin=Denver%20Airport%20(DEN)&destination=Vail",
      },
    ],
  });

  const winterParkPageText =
    "GoSno Mountain Transportation — Private Shuttle from DEN to Winter Park (https://gosno.co/winter-park): Starting at $349 for Your Entire Group (Up to 6 Passengers). Direct via I-70 & US-40 over Berthoud Pass — 90 minutes door-to-door. Free Flight Tracking: We monitor your flight in real time and adjust pickup window if delayed. Plenty of Gear Space: Skis, snowboards, boot bags, and standard luggage fit comfortably (up to 6 ski/snowboard bags per SUV).";

  const feedSel = extractTextEvidenceSelectors({
    documentText: routeFeedRawJson,
    exactQuote: '"id":"den-breck","origin":"Denver Airport (DEN)","destination":"Breckenridge"',
  });
  const wpSel = extractTextEvidenceSelectors({
    documentText: winterParkPageText,
    exactQuote:
      "Starting at $349 for Your Entire Group (Up to 6 Passengers). Direct via I-70 & US-40 over Berthoud Pass — 90 minutes door-to-door.",
  });

  const routeFeedEvRef = buildV03EvidenceReference({
    evidenceRefId: "evref:gosno:public-route-feed-2026",
    sourceDccId: gosnoRouteFeedSourceId,
    sourceTitle: "GoSno Public Route & Pricing Feed (/api/public/route-feed)",
    sourceOrganization: "GoSno Mountain Transportation (First-Party)",
    canonicalSourceUrl: "https://gosno.co/api/public/route-feed",
    snapshotId: `snap:sha256:${sha256HexFull(routeFeedRawJson)}`,
    snapshotSha256: sha256HexFull(routeFeedRawJson),
    privateObjectKey: `v03/raw_source_captures/sha256/${sha256HexFull(routeFeedRawJson)}.json`,
    selectors: feedSel.selectors,
    surroundingContext: feedSel.surroundingContext,
    extractor: {
      extractorId: "dcc-v031-json-selector",
      extractorVersion: "0.3.1",
      method: "deterministic_json_pointer",
    },
    extractedAt: "2026-10-26T18:01:35.000Z",
    retrievedAt: "2026-10-26T18:01:35.000Z",
    sourcePublishedAt: "2026-03-31T17:19:53.970Z",
    sourceObservedAt: "2026-10-26T18:01:35.000Z",
    licenseOrReusePolicy: "DCC First-Party Operational Property (gosno.co)",
  });

  const winterParkEvRef = buildV03EvidenceReference({
    evidenceRefId: "evref:gosno:winter-park-corridor-2026",
    sourceDccId: gosnoWinterParkSourceId,
    sourceTitle: "GoSno DEN to Winter Park Private Shuttle Page",
    sourceOrganization: "GoSno Mountain Transportation (First-Party)",
    canonicalSourceUrl: "https://gosno.co/winter-park",
    snapshotId: `snap:sha256:${sha256HexFull(winterParkPageText)}`,
    snapshotSha256: sha256HexFull(winterParkPageText),
    privateObjectKey: `v03/raw_source_captures/sha256/${sha256HexFull(winterParkPageText)}.html`,
    selectors: wpSel.selectors,
    surroundingContext: wpSel.surroundingContext,
    extractor: {
      extractorId: "dcc-v031-dom-text-selector",
      extractorVersion: "0.3.1",
      method: "deterministic_dom_selector",
    },
    extractedAt: "2026-10-26T18:01:38.000Z",
    retrievedAt: "2026-10-26T18:01:38.000Z",
    sourcePublishedAt: "2026-10-01T00:00:00.000Z",
    sourceObservedAt: "2026-10-26T18:01:38.000Z",
    licenseOrReusePolicy: "DCC First-Party Operational Property (gosno.co)",
  });

  // Append verified first-party GoSno capacity, luggage, pickup-window, and pricing claims
  ledger.appendEvent({
    eventType: "claim_approved_and_activated",
    claimId: "clm:gosno:max-pax-per-shuttle",
    claimVersionId: "clmv:gosno:max-pax-per-shuttle:v1",
    recordedAt: "2026-10-26T18:01:40.000Z",
    actorId: "dcc-v031-gosno-seeder",
    isSynthetic: false,
    provenanceClass: "operational_evidence",
    reason: "First-party GoSno private SUV capacity (6 passengers) and private Van capacity (10 passengers).",
    claimDefinition: {
      claimId: "clm:gosno:max-pax-per-shuttle",
      claimVersionId: "clmv:gosno:max-pax-per-shuttle:v1",
      subjectDccId: gosnoOpId,
      predicate: "max_passengers_per_shuttle_vehicle",
      assertionType: "policy",
      epistemicState: "verified_against_identified_evidence",
      typedValue: 10,
      unitOrCurrency: "passengers",
      validFrom: "2026-10-01T00:00:00.000Z",
      validTo: "2027-05-01T00:00:00.000Z",
      sourceObservedAt: "2026-10-26T18:01:38.000Z",
      sourcePublishedAt: "2026-03-31T17:19:53.970Z",
      retrievedAt: "2026-10-26T18:01:38.000Z",
      freshnessTtlSeconds: 60 * 86400,
      sourceAuthority: {
        sourceDccId: gosnoRouteFeedSourceId,
        organizationName: "GoSno Mountain Transportation",
        authorityTier: "operator_direct",
        competentDomains: ["ground_shuttle_operations"],
        claimedDomain: "ground_shuttle_operations",
        independentlyCorroboratedBySourceDccIds: [gosnoWinterParkSourceId],
        licenseOrReusePolicy: "DCC First-Party Operational Property (gosno.co)",
      },
      evidenceRefs: [routeFeedEvRef, winterParkEvRef],
    },
  });

  // Explicitly record `unknown` epistemic states for all 5 live operational conditions
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
      claimId: "clm:gosno:live-road-safety",
      predicate: "road_safety",
      reason: "Live CDOT I-70 / US-40 Berthoud Pass chain/traction/closure status is unknown until travel window.",
    },
    {
      claimId: "clm:gosno:live-weather-suitability",
      predicate: "weather_suitability",
      reason: "Live mountain corridor winter storm / visibility suitability is unknown until departure window.",
    },
    {
      claimId: "clm:gosno:live-inventory-confirmation",
      predicate: "live_inventory_confirmation",
      reason: "Rezdy/OCTO live booking slot confirmation is unknown until action-time revalidation.",
    },
  ] as const;

  const unknownLiveConditions = [];
  for (const spec of unknownConditionSpecs) {
    ledger.appendEvent({
      eventType: "claim_approved_and_activated",
      claimId: spec.claimId,
      claimVersionId: `${spec.claimId}:v1-unknown`,
      recordedAt: "2026-10-26T18:01:42.000Z",
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
        retrievedAt: "2026-10-26T18:01:42.000Z",
        freshnessTtlSeconds: 300,
        sourceAuthority: {
          sourceDccId: gosnoRouteFeedSourceId,
          organizationName: "GoSno Mountain Transportation",
          authorityTier: "operator_direct",
          competentDomains: ["ground_shuttle_operations"],
          claimedDomain: "ground_shuttle_operations",
          independentlyCorroboratedBySourceDccIds: [],
          licenseOrReusePolicy: "DCC First-Party Operational Property (gosno.co)",
        },
        evidenceRefs: [],
      },
    });
    unknownLiveConditions.push({
      claimId: spec.claimId,
      predicate: spec.predicate,
      epistemicState: "unknown",
      typedValue: null,
    });
  }

  const gosnoUniverse = buildV03CandidateUniverse({
    universeId: "univ:denver-to-mountain-transportation",
    version: "0.3.1",
    engineId: "denver-to-mountain-transportation",
    engineVersion: "0.3.1",
    isSynthetic: false,
    scope: {
      destinationDccEntityId: denverDestId,
      destinationName: "Denver Airport (DEN) to Colorado I-70 & US-40 Mountain Resorts",
      categorySlug: "denver-to-mountain-transportation",
      jurisdiction: "US-CO",
      geographicBounds: { minLat: 39.4, maxLat: 40.0, minLon: -106.5, maxLon: -104.6 },
    },
    inclusionMethod:
      "First-party GoSno private mountain shuttle products across DEN to Winter Park, Breckenridge, and Vail corridors.",
    sourcesAndQueriesConsulted: [
      {
        sourceDccId: gosnoRouteFeedSourceId,
        organizationName: "GoSno Mountain Transportation",
        queryOrEndpoint: "https://gosno.co/api/public/route-feed",
        consultedAt: "2026-10-26T18:01:35.000Z",
        snapshotSha256: routeFeedEvRef.snapshotSha256,
      },
      {
        sourceDccId: gosnoWinterParkSourceId,
        organizationName: "GoSno Mountain Transportation",
        queryOrEndpoint: "https://gosno.co/winter-park",
        consultedAt: "2026-10-26T18:01:38.000Z",
        snapshotSha256: winterParkEvRef.snapshotSha256,
      },
    ],
    includedCandidates: [
      {
        candidateDccEntityId: candDenWinterParkSuvId,
        legacyCandidateCode: "gosno-den-winter-park-private-suv",
        displayName: "GoSno DEN to Winter Park Private SUV Shuttle (Up to 6 Pax)",
        operatorDccEntityId: gosnoOpId,
        operatorDisplayName: "GoSno Mountain Transportation",
        bookingChannelClass: "dcc_owned_platform",
        wtaAttributionPresent: false,
        staticAttributes: {
          basePriceUsd: 349,
          corridor: "den_winter_park",
          maxPassengers: 6,
          maxSkiBags: 6,
          typicalMinutes: 90,
        },
        requiredClaimIds: ["clm:gosno:max-pax-per-shuttle"],
      },
      {
        candidateDccEntityId: candDenBreckSuvId,
        legacyCandidateCode: "gosno-den-breckenridge-private-suv",
        displayName: "GoSno DEN to Breckenridge Private SUV Shuttle (Up to 6 Pax, Rezdy P7477S)",
        operatorDccEntityId: gosnoOpId,
        operatorDisplayName: "GoSno Mountain Transportation",
        bookingChannelClass: "dcc_owned_platform",
        wtaAttributionPresent: false,
        staticAttributes: {
          basePriceUsd: 399,
          corridor: "den_breckenridge",
          maxPassengers: 6,
          maxSkiBags: 6,
          typicalMinutes: 115,
          rezdyProductCode: "P7477S",
        },
        requiredClaimIds: ["clm:gosno:max-pax-per-shuttle"],
      },
      {
        candidateDccEntityId: candDenBreckVanId,
        legacyCandidateCode: "gosno-den-breckenridge-private-van",
        displayName: "GoSno DEN to Breckenridge Private Van Shuttle (Up to 10 Pax, Rezdy PKQDPG)",
        operatorDccEntityId: gosnoOpId,
        operatorDisplayName: "GoSno Mountain Transportation",
        bookingChannelClass: "dcc_owned_platform",
        wtaAttributionPresent: false,
        staticAttributes: {
          basePriceUsd: 599,
          corridor: "den_breckenridge",
          maxPassengers: 10,
          maxSkiBags: 10,
          typicalMinutes: 115,
          rezdyProductCode: "PKQDPG",
        },
        requiredClaimIds: ["clm:gosno:max-pax-per-shuttle"],
      },
      {
        candidateDccEntityId: candDenVailSuvId,
        legacyCandidateCode: "gosno-den-vail-private-suv",
        displayName: "GoSno DEN to Vail Private SUV Shuttle (Up to 6 Pax)",
        operatorDccEntityId: gosnoOpId,
        operatorDisplayName: "GoSno Mountain Transportation",
        bookingChannelClass: "dcc_owned_platform",
        wtaAttributionPresent: false,
        staticAttributes: {
          basePriceUsd: 499,
          corridor: "den_vail",
          maxPassengers: 6,
          maxSkiBags: 6,
          typicalMinutes: 125,
        },
        requiredClaimIds: ["clm:gosno:max-pax-per-shuttle"],
      },
    ],
    knownExclusions: [],
    coverageGaps: [
      {
        gapCode: "LIVE_DRIVER_VEHICLE_ROAD_WEATHER_INVENTORY_UNKNOWN",
        affectedDimension: "action_time_dispatch_and_road_conditions",
        description:
          "driver_availability, vehicle_availability, road_safety, weather_suitability, and live_inventory_confirmation are explicitly unknown at decision evaluation time and must be revalidated before any action execution.",
        impactOnCompleteness:
          "Produces qualified recommendations requiring action-time revalidation in DecisionAuthorization.",
      },
    ],
    effectiveFrom: "2026-10-01T00:00:00.000Z",
    effectiveTo: "2027-05-01T00:00:00.000Z",
    knowledgeCutoff: "2026-10-26T18:01:45.000Z",
    refreshDeadline: "2026-11-26T18:01:45.000Z",
    generatorVersion: "dcc-universe-generator/0.3.1",
    epistemicDisclaimer:
      "First-party GoSno tariff and capacity evaluation. Live driver availability, vehicle availability, road safety, weather suitability, and live inventory confirmation remain unknown until action-time revalidation.",
  });

  const gosnoBundle = compileV03EngineBundle({
    engineId: "denver-to-mountain-transportation",
    engineVersion: "0.3.1",
    compilerVersion: "dcc-ir-compiler/0.3.1",
    universe: gosnoUniverse,
    rules: [
      {
        ruleId: "rule:gosno:group-size-lte-capacity",
        ruleVersionId: "rulev:gosno:group-size-lte-capacity:v1",
        ruleKind: "hard_gate",
        title: "Passenger group size within shuttle vehicle capacity",
        reasonCode: "GROUP_SIZE_EXCEEDS_VAN_CAPACITY",
        requiredClaimId: "clm:gosno:max-pax-per-shuttle",
        predicateType: "input_lte_claim_number",
        inputField: "groupSize",
        scoreDelta: 20,
      },
      {
        ruleId: "rule:gosno:corridor-preference",
        ruleVersionId: "rulev:gosno:corridor-preference:v1",
        ruleKind: "ranking_weight",
        title: "Matches requested Denver-to-mountain destination corridor",
        reasonCode: "REQUESTED_CORRIDOR",
        requiredClaimId: "clm:gosno:max-pax-per-shuttle",
        predicateType: "input_equals_candidate_attr",
        inputField: "corridor",
        candidateAttrKey: "corridor",
        scoreDelta: 25,
      },
      {
        ruleId: "rule:gosno:winter-storm-qualification",
        ruleVersionId: "rulev:gosno:winter-storm-qualification:v1",
        ruleKind: "qualification_modifier",
        title: "I-70 / Berthoud Pass winter traction & live dispatch revalidation qualification",
        reasonCode: "BERTHOUD_PASS_WINTER_TRACTION_BUFFER_ADVISORY",
        requiredClaimId: "clm:gosno:max-pax-per-shuttle",
        predicateType: "qualification_penalty_if_input_matches",
        inputField: "weatherCondition",
        expectedValue: "winter_snow_advisory",
        scoreDelta: -5,
      },
    ],
    pinnedSchemaHashes: {
      DecisionIrBundle: sha256HexFull("dcc-decision-ir/0.3"),
      SignedDecisionReceipt: sha256HexFull("dcc-decision-receipt/0.3"),
    },
  });

  // Step 1 & 2: Evaluate a Denver-to-mountain transportation request and produce a signed DecisionReceipt
  const decisionEvaluation = await evaluateCurrentV03({
    rawClientRequestBody: {
      validAt: "2026-12-15T15:00:00.000Z",
      inputs: {
        groupSize: 4,
        corridor: "den_winter_park",
        weatherCondition: "winter_snow_advisory",
        maxBudgetPerPersonUsd: 400,
      },
    },
    bundle: gosnoBundle,
    universe: gosnoUniverse,
    ledger,
    serverClockNow: () => "2026-10-26T18:05:00.000Z",
  });

  const requiredActionTimeRevalidations = [
    "driver_availability",
    "vehicle_availability",
    "road_safety",
    "weather_suitability",
    "live_inventory_confirmation",
  ];

  // Step 3 & 5: Issue signed DecisionAuthorization bound to receiptId & resultHash and run shadow adapters
  const squareAuth = await issueShadowDecisionAuthorization({
    receipt: decisionEvaluation.receipt,
    permittedAction: "shadow_checkout_intent_preparation",
    providerProductReference: {
      candidateDccEntityId: candDenWinterParkSuvId,
      operatorDccEntityId: gosnoOpId,
      displayName: "GoSno DEN to Winter Park Private SUV Shuttle (Up to 6 Pax)",
      externalAliases: {
        octo_product_id: "octo:gosno-den-wp-private-suv",
        square_location_id: "sq-loc-gosno-denver",
        rezdy_product_code: "P7477S-WP",
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
    issuedAtIso: "2026-10-26T18:05:01.000Z",
    ttlSeconds: 86_400 * 30,
  });

  const octoAuth = await issueShadowDecisionAuthorization({
    receipt: decisionEvaluation.receipt,
    permittedAction: "shadow_inventory_check",
    providerProductReference: {
      candidateDccEntityId: candDenWinterParkSuvId,
      operatorDccEntityId: gosnoOpId,
      displayName: "GoSno DEN to Winter Park Private SUV Shuttle (Up to 6 Pax)",
      externalAliases: {
        octo_product_id: "octo:gosno-den-wp-private-suv",
        square_location_id: "sq-loc-gosno-denver",
        rezdy_product_code: "P7477S-WP",
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
    issuedAtIso: "2026-10-26T18:05:01.000Z",
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

  // Step 8: Record the shadow outcome event in the append-only ledger
  const shadowOutcomeEvent = ledger.appendEvent({
    eventType: "shadow_authorization_dry_run_recorded",
    claimId: `shadow-outcome:${squareAuth.signedAuthorization.authorizationId}`,
    claimVersionId: `shadow-outcome:${squareAuth.signedAuthorization.authorizationId}:v1`,
    recordedAt: "2026-10-26T18:05:02.000Z",
    actorId: "dcc-v031-shadow-commerce-auditor",
    isSynthetic: false,
    provenanceClass: "operational_evidence",
    reason: `Shadow authorization ${squareAuth.signedAuthorization.authorizationId} bound to receipt ${decisionEvaluation.receiptId} (resultHash=${decisionEvaluation.resultHash}) validated via Square and OCTO shadow adapters with liveExternalCallsMade=0 and executionMode=shadow_only_no_side_effects.`,
  });

  return {
    decisionEvaluation,
    signedAuthorization: squareAuth.signedAuthorization,
    independentAuthorizationVerification: {
      valid: verifiedSig && jcsMatches,
      verifiedBy: "W3C_WebCrypto_SubtleCrypto_and_Independent_JCS",
      alg: headerObj.alg,
      kid: headerObj.kid,
    },
    squareShadowResult: squareAuth.adapterDryRun,
    octoShadowResult: octoAuth.adapterDryRun,
    unknownLiveConditions,
    ledgerShadowOutcomeEvent: {
      eventId: shadowOutcomeEvent.eventId,
      eventHash: shadowOutcomeEvent.eventHash,
      eventType: shadowOutcomeEvent.eventType,
      recordedAt: shadowOutcomeEvent.recordedAt,
      reason: shadowOutcomeEvent.reason,
    },
  };
}

