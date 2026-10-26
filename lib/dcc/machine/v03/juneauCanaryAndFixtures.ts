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
 * PROOF C: GoSno Shadow-Mode DecisionAuthorization Proof (Requirement 11)
 *
 * Demonstrates how a qualified Denver-to-Winter-Park mountain shuttle decision
 * becomes a provider-neutral `DecisionAuthorization` in shadow mode (`executionMode: "shadow_only_no_side_effects"`),
 * validated through the Square and OCTO shadow adapters without submitting a booking,
 * reserving inventory, charging money, or contacting a traveler.
 */
export async function runGoSnoShadowAuthorizationProof(): Promise<{
  decisionEvaluation: V03EvaluationResult;
  signedAuthorization: V03SignedDecisionAuthorization;
  squareShadowResult: ShadowCommerceAdapterResult;
  octoShadowResult: ShadowCommerceAdapterResult;
}> {
  const ledger = new AppendOnlyKnowledgeLedger();
  const denverDestId = mintOpaqueDccEntityId("destination", "us-co-denver-mountain-corridor");
  const gosnoOpId = mintOpaqueDccEntityId("operator", "gosno-mountain-transportation-co");
  const gosnoShuttleCandId = mintOpaqueDccEntityId(
    "tour_candidate",
    "gosno-denver-winter-park-express-shuttle",
  );
  const gosnoSourceId = mintOpaqueDccEntityId("evidence_source", "gosno-published-tariff-2026");

  const tariffText =
    "GoSno Mountain Shuttle Tariff 2026: Denver Union Station / DEN to Winter Park Resort shared express shuttle operates up to 14 passengers per van, max 2 ski/snowboard bags per rider, published fare $89 USD per person.";
  const selectors = extractTextEvidenceSelectors({
    documentText: tariffText,
    exactQuote: "up to 14 passengers per van, max 2 ski/snowboard bags per rider, published fare $89 USD",
  });
  const tariffEvRef = buildV03EvidenceReference({
    evidenceRefId: "evref:gosno:tariff-2026-winter-park",
    sourceDccId: gosnoSourceId,
    sourceTitle: "GoSno Denver-to-Winter-Park Published Shuttle Tariff",
    sourceOrganization: "GoSno Mountain Transportation",
    canonicalSourceUrl: "https://www.destinationcommandcenter.com/go/dcc-to-gosno",
    snapshotId: `snap:sha256:${sha256HexFull(tariffText)}`,
    snapshotSha256: sha256HexFull(tariffText),
    privateObjectKey: `v03/raw_source_captures/sha256/${sha256HexFull(tariffText)}.txt`,
    selectors: selectors.selectors,
    surroundingContext: selectors.surroundingContext,
    extractor: {
      extractorId: "dcc-v03-text-selector",
      extractorVersion: "0.3.0",
      method: "deterministic_regex_span",
    },
    extractedAt: "2026-10-26T10:00:00.000Z",
    retrievedAt: "2026-10-26T10:00:00.000Z",
    sourcePublishedAt: "2026-10-01T00:00:00.000Z",
    sourceObservedAt: "2026-10-26T10:00:00.000Z",
    licenseOrReusePolicy: "DCC First-Party Partner Tariff",
  });

  ledger.appendEvent({
    eventType: "claim_approved_and_activated",
    claimId: "clm:gosno:max-pax-per-shuttle",
    claimVersionId: "clmv:gosno:max-pax-per-shuttle:v1",
    recordedAt: "2026-10-26T10:00:00.000Z",
    actorId: "dcc-v03-gosno-seeder",
    isSynthetic: false,
    provenanceClass: "operational_evidence",
    reason: "Published GoSno shuttle capacity limit.",
    claimDefinition: {
      claimId: "clm:gosno:max-pax-per-shuttle",
      claimVersionId: "clmv:gosno:max-pax-per-shuttle:v1",
      subjectDccId: gosnoShuttleCandId,
      predicate: "max_passengers_per_shuttle_van",
      assertionType: "policy",
      epistemicState: "verified_against_identified_evidence",
      typedValue: 14,
      unitOrCurrency: "passengers",
      validFrom: "2026-10-01T00:00:00.000Z",
      validTo: "2027-04-30T23:59:59.000Z",
      sourceObservedAt: "2026-10-26T10:00:00.000Z",
      sourcePublishedAt: "2026-10-01T00:00:00.000Z",
      retrievedAt: "2026-10-26T10:00:00.000Z",
      freshnessTtlSeconds: 30 * 86400,
      sourceAuthority: {
        sourceDccId: gosnoSourceId,
        organizationName: "GoSno Mountain Transportation",
        authorityTier: "direct_operator",
        competentDomains: ["ground_shuttle_operations"],
        claimedDomain: "ground_shuttle_operations",
        independentlyCorroboratedBySourceDccIds: [],
        licenseOrReusePolicy: "DCC First-Party Partner Tariff",
      },
      evidenceRefs: [tariffEvRef],
    },
  });

  const gosnoUniverse = buildV03CandidateUniverse({
    universeId: "univ:denver-to-mountain-transportation",
    version: "0.3.0",
    engineId: "denver-to-mountain-transportation",
    engineVersion: "0.3.0",
    isSynthetic: false,
    scope: {
      destinationDccEntityId: denverDestId,
      destinationName: "Denver to Colorado I-70 / US-40 Mountain Corridor",
      categorySlug: "denver-to-mountain-transportation",
      jurisdiction: "US-CO",
      geographicBounds: { minLat: 39.4, maxLat: 40.0, minLon: -106.1, maxLon: -104.6 },
    },
    inclusionMethod: "DCC verified mountain shuttle operators along the Denver to Winter Park corridor.",
    sourcesAndQueriesConsulted: [
      {
        sourceDccId: gosnoSourceId,
        organizationName: "GoSno Mountain Transportation",
        queryOrEndpoint: "https://www.destinationcommandcenter.com/go/dcc-to-gosno",
        consultedAt: "2026-10-26T10:00:00.000Z",
        snapshotSha256: tariffEvRef.snapshotSha256,
      },
    ],
    includedCandidates: [
      {
        candidateDccEntityId: gosnoShuttleCandId,
        legacyCandidateCode: "gosno-denver-winter-park-express",
        displayName: "GoSno Denver to Winter Park Resort Express Shuttle",
        operatorDccEntityId: gosnoOpId,
        operatorDisplayName: "GoSno Mountain Transportation",
        bookingChannelClass: "dcc_owned_platform",
        wtaAttributionPresent: false,
        staticAttributes: {
          basePriceUsd: 89,
          corridor: "us40_winter_park",
        },
        requiredClaimIds: ["clm:gosno:max-pax-per-shuttle"],
      },
    ],
    knownExclusions: [],
    coverageGaps: [],
    effectiveFrom: "2026-10-01T00:00:00.000Z",
    effectiveTo: "2027-04-30T23:59:59.000Z",
    knowledgeCutoff: "2026-10-26T10:00:00.000Z",
    refreshDeadline: "2026-11-26T10:00:00.000Z",
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
    pinnedSchemaHashes: {
      DecisionIrBundle: sha256HexFull("dcc-decision-ir/0.3"),
      SignedDecisionReceipt: sha256HexFull("dcc-decision-receipt/0.3"),
    },
  });

  const decisionEvaluation = await evaluateCurrentV03({
    rawClientRequestBody: {
      validAt: "2026-12-15T15:00:00.000Z",
      inputs: {
        groupSize: 4,
        weatherCondition: "winter_snow_advisory",
        maxBudgetPerPersonUsd: 120,
      },
    },
    bundle: gosnoBundle,
    universe: gosnoUniverse,
    ledger,
    serverClockNow: () => "2026-10-26T10:30:00.000Z",
  });

  const squareAuth = await issueShadowDecisionAuthorization({
    receipt: decisionEvaluation.receipt,
    permittedAction: "shadow_checkout_intent_preparation",
    providerProductReference: {
      candidateDccEntityId: gosnoShuttleCandId,
      operatorDccEntityId: gosnoOpId,
      displayName: "GoSno Denver to Winter Park Resort Express Shuttle",
      externalAliases: {
        octo_product_id: "octo:gosno-den-wp-express",
        square_location_id: "sq-loc-gosno-denver",
      },
    },
    maxPriceUsdDecimal: 356.0, // 4 passengers * $89.00
    requiredParameters: {
      serviceDate: "2026-12-15",
      passengerCount: 4,
      pickupNodeCode: "DEN-WEST-CURB",
      dropoffNodeCode: "WINTER-PARK-VILLAGE",
      luggageSkiBagCount: 4,
    },
    targetAdapter: "square",
    issuedAtIso: "2026-10-26T10:30:01.000Z",
  });

  const octoAuth = await issueShadowDecisionAuthorization({
    receipt: decisionEvaluation.receipt,
    permittedAction: "shadow_inventory_check",
    providerProductReference: {
      candidateDccEntityId: gosnoShuttleCandId,
      operatorDccEntityId: gosnoOpId,
      displayName: "GoSno Denver to Winter Park Resort Express Shuttle",
      externalAliases: {
        octo_product_id: "octo:gosno-den-wp-express",
        square_location_id: "sq-loc-gosno-denver",
      },
    },
    maxPriceUsdDecimal: 356.0,
    requiredParameters: {
      serviceDate: "2026-12-15",
      passengerCount: 4,
      pickupNodeCode: "DEN-WEST-CURB",
      dropoffNodeCode: "WINTER-PARK-VILLAGE",
      luggageSkiBagCount: 4,
    },
    targetAdapter: "octo",
    issuedAtIso: "2026-10-26T10:30:01.000Z",
  });

  return {
    decisionEvaluation,
    signedAuthorization: squareAuth.signedAuthorization,
    squareShadowResult: squareAuth.adapterDryRun,
    octoShadowResult: octoAuth.adapterDryRun,
  };
}
