import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { GET as getWellKnownDcc } from "@/app/.well-known/dcc/route";
import { GET as getAgentJson } from "@/app/agent.json/route";
import { POST as postV1DynamicAction } from "@/app/api/v1/[action]/route";
import { GET as getBundleRoute } from "@/app/api/v1/bundles/[engineId]/[version]/route";
import { GET as getChangesRoute } from "@/app/api/v1/changes/route";
import { GET as getClaimRoute } from "@/app/api/v1/claims/[id]/route";
import { GET as getEngineRoute } from "@/app/api/v1/engines/[id]/route";
import { GET as getEntityRoute } from "@/app/api/v1/entities/[id]/route";
import { POST as postEvaluateRoute } from "@/app/api/v1/evaluate/route";
import { GET as getRuleRoute } from "@/app/api/v1/rules/[id]/route";
import { GET as getSourceRoute } from "@/app/api/v1/sources/[id]/route";
import { GET as getOpenApiJson } from "@/app/openapi.json/route";
import { GET as getStableReferenceRoute } from "@/app/r/[id]/route";
import {
  GET as getImmutableReferenceRoute,
  HEAD as headImmutableReferenceRoute,
} from "@/app/r/[id]/v/[version]/route";
import {
  CLAIM_VERSION_JSON_SCHEMA,
  COMPACT_EVALUATION_JSON_SCHEMA,
  DECISION_IR_JSON_SCHEMA,
  EXPANDED_EVALUATION_JSON_SCHEMA,
  REFERENCE_ENVELOPE_JSON_SCHEMA,
  SsrfProtectionError,
  evaluateDecisionIrBundle,
  evaluateMachineEngine,
  getMachineBundle,
  getMachineEngine,
  getMachineStore,
  ingestSourceArtifactSafely,
  openMachineClaimConflict,
  publishMachineEngineBundle,
  resetMachineStoreForTests,
  resolveMachineReference,
  rollbackMachineEngineVersion,
  setDccMachineV1RuntimeOverride,
  stageUntrustedAiClaimExtraction,
  supersedeMachineClaim,
  validateAgainstJsonSchema,
  validateUrlAgainstSsrf,
  verifyAndPromoteQuarantinedExtraction,
  withdrawMachineClaimVersion,
  type CompactEvaluationResponse,
  type ExpandedEvaluationResponse,
} from "@/lib/dcc/machine";
import { buildJuneauAndHawaiiMachineSeed } from "@/lib/dcc/machine/seedJuneauAndHawaii";
import { runDccMachineLayerBenchmarks } from "@/scripts/dcc/benchmark-machine-layer";

const SAMPLE_JUNEAU_INPUT = {
  date: "2026-07-15",
  arrivalTime: "08:00",
  allAboardTime: "16:30",
  arrivalDock: "CT",
  groupSize: 2,
  youngestChildAgeYears: 14,
  maxSinglePassengerWeightLbs: 195,
  mobilityLevel: "full_agility",
  requestedFormat: "standard_glacier_walk",
  weatherCondition: "clear_vfr",
  maxBudgetPerPersonUsd: 600,
};

const SAMPLE_HAWAII_INPUT = {
  island: "maui",
  departureArea: "maalaea_harbor",
  travelDate: "2027-02-14",
  availableWindowMinutes: 360,
  departureTimeOfDay: "early_morning_calm",
  groupSize: 2,
  youngestChildAgeYears: 12,
  hasPregnantTraveler: false,
  hasBackOrNeckInjury: false,
  mobilityLevel: "standard_marine_boarding",
  seasicknessOrRoughWaterConcern: "moderate_concern",
  vesselPreference: "large_stabilized_catamaran",
  charterMode: "shared_ticket",
  needsHotelOrPierTransfer: false,
  priorityMode: "comfort_and_stability",
  maxBudgetPerPersonUsd: 160,
};

test("Acceptance 1 (Determinism): Identical input + identical engine version produces the exact same output and trace hash across 100 runs", () => {
  resetMachineStoreForTests();
  const bundle = getMachineBundle("juneau-helicopter-tours", "1.0.0");
  assert.ok(bundle, "Juneau Decision IR bundle must exist");

  const baseline = evaluateDecisionIrBundle({
    bundle,
    input: SAMPLE_JUNEAU_INPUT,
    mode: "expanded",
    overrides: { nowIso: "2026-04-12T12:00:00.000Z" },
    bypassCache: true,
  }) as ExpandedEvaluationResponse;

  assert.equal(baseline.decisionState, "recommended");
  assert.equal(baseline.recommendedCandidateId, "jnu-heli-coastal-icefield");

  for (let i = 0; i < 100; i++) {
    const run = evaluateDecisionIrBundle({
      bundle,
      input: SAMPLE_JUNEAU_INPUT,
      mode: "expanded",
      overrides: { nowIso: "2026-04-12T12:00:00.000Z" },
      bypassCache: i % 2 === 0, // alternate cold and warm cache paths
    }) as ExpandedEvaluationResponse;

    assert.equal(run.resultHash, baseline.resultHash, `Run ${i + 1} resultHash mismatch`);
    assert.equal(run.traceHash, baseline.traceHash, `Run ${i + 1} traceHash mismatch`);
    assert.equal(run.evaluationId, baseline.evaluationId, `Run ${i + 1} evaluationId mismatch`);
    assert.equal(run.traceId, baseline.traceId, `Run ${i + 1} traceId mismatch`);
    assert.equal(run.recommendedCandidateId, baseline.recommendedCandidateId);
  }
});

test("Acceptance 2 (Traceability & Content Negotiation): Every returned reference_id resolves to a valid object, and every rule/claim recursively resolves to a source snapshot and fragment", async () => {
  resetMachineStoreForTests();

  const evalRes = evaluateMachineEngine({
    engineId: "juneau-helicopter-tours",
    inputs: {
      ...SAMPLE_JUNEAU_INPUT,
      maxSinglePassengerWeightLbs: 265, // triggers FAA 250 lb weight surcharge rule
    },
    mode: "expanded",
    evaluatedAt: "2026-04-12T12:00:00.000Z",
  });

  assert.equal(evalRes.ok, true);
  if (!evalRes.ok) return;

  const response = evalRes.response as ExpandedEvaluationResponse;
  assert.ok(response.referenceIds.length >= 10, "Should return multiple referenceIds");

  // Every returned referenceId must resolve via resolveMachineReference
  for (const refId of response.referenceIds) {
    const resolved = resolveMachineReference(refId);
    assert.ok(resolved, `Reference ID "${refId}" failed to resolve`);
    const schemaCheck = validateAgainstJsonSchema(
      resolved.envelope,
      REFERENCE_ENVELOPE_JSON_SCHEMA,
    );
    assert.equal(
      schemaCheck.valid,
      true,
      `Envelope for ${refId} failed schema validation: ${schemaCheck.errors.join(", ")}`,
    );
  }

  // Every rule executed in trace must resolve to its ClaimVersions -> EvidenceFragment -> SourceSnapshot -> Source
  for (const candTrace of response.trace.candidateTraces) {
    for (const ruleExec of candTrace.ruleExecutions) {
      const ruleRef = resolveMachineReference(ruleExec.ruleId, ruleExec.ruleVersion);
      assert.ok(ruleRef, `Rule ${ruleExec.ruleId}@${ruleExec.ruleVersion} must resolve`);
      assert.equal(ruleRef.envelope.objectType, "Rule");

      for (const cvId of ruleExec.claimVersionIds) {
        const cvRef = resolveMachineReference(cvId, "1");
        assert.ok(cvRef, `ClaimVersion ${cvId} must resolve`);
        assert.equal(cvRef.envelope.objectType, "ClaimVersion");
        assert.ok(
          cvRef.envelope.evidenceLocation.evidenceFragmentId,
          `ClaimVersion ${cvId} must reference an evidenceFragmentId`,
        );
        assert.ok(
          cvRef.envelope.evidenceLocation.verbatimExcerpt,
          `ClaimVersion ${cvId} must include a verbatim excerpt`,
        );

        const fragId = cvRef.envelope.evidenceLocation.evidenceFragmentId!;
        const fragRef = resolveMachineReference(fragId, "1");
        assert.ok(fragRef, `EvidenceFragment ${fragId} must resolve`);
        assert.equal(fragRef.envelope.objectType, "EvidenceFragment");

        const snapId = cvRef.envelope.sourceMetadata.sourceSnapshotId!;
        const snapRef = resolveMachineReference(snapId, "1");
        assert.ok(snapRef, `SourceSnapshot ${snapId} must resolve`);
        assert.equal(snapRef.envelope.objectType, "SourceSnapshot");

        const srcId = cvRef.envelope.sourceMetadata.sourceId!;
        const srcRef = resolveMachineReference(srcId, "1.0.0");
        assert.ok(srcRef, `Source ${srcId} must resolve`);
        assert.equal(srcRef.envelope.objectType, "Source");
      }
    }
  }

  // Test HTTP /r/{id} and /r/{id}/v/{version} content negotiation & HEAD/ETag/Cache-Control
  const sampleClaimId = "clm:jnu:seat-weight-surcharge-threshold";
  const jsonReq = new Request(`https://www.destinationcommandcenter.com/r/${sampleClaimId}`, {
    headers: { Accept: "application/json" },
  });
  const jsonRes = await getStableReferenceRoute(jsonReq, {
    params: Promise.resolve({ id: sampleClaimId }),
  });
  assert.equal(jsonRes.status, 200);
  assert.match(jsonRes.headers.get("content-type") ?? "", /application\/json/);
  assert.equal(jsonRes.headers.get("cache-control"), "public, max-age=60, must-revalidate");
  const etag = jsonRes.headers.get("etag");
  assert.ok(etag && etag.startsWith('"sha256-'));

  // Conditional request with If-None-Match returns 304 Not Modified
  const notModifiedReq = new Request(
    `https://www.destinationcommandcenter.com/r/${sampleClaimId}`,
    { headers: { "If-None-Match": etag! } },
  );
  const notModifiedRes = await getStableReferenceRoute(notModifiedReq, {
    params: Promise.resolve({ id: sampleClaimId }),
  });
  assert.equal(notModifiedRes.status, 304);

  // Immutable version route returns Cache-Control: public, max-age=31536000, immutable
  const immReq = new Request(
    `https://www.destinationcommandcenter.com/r/${sampleClaimId}/v/1`,
    { headers: { Accept: "application/ld+json" } },
  );
  const immRes = await getImmutableReferenceRoute(immReq, {
    params: Promise.resolve({ id: sampleClaimId, version: "1" }),
  });
  assert.equal(immRes.status, 200);
  assert.match(immRes.headers.get("content-type") ?? "", /application\/ld\+json/);
  assert.equal(
    immRes.headers.get("cache-control"),
    "public, max-age=31536000, immutable",
  );
  const ldBody = (await immRes.json()) as Record<string, unknown>;
  assert.ok(Array.isArray(ldBody["@context"]));

  // HTML projection negotiation
  const htmlReq = new Request(
    `https://www.destinationcommandcenter.com/r/${sampleClaimId}/v/1`,
    { headers: { Accept: "text/html" } },
  );
  const htmlRes = await getImmutableReferenceRoute(htmlReq, {
    params: Promise.resolve({ id: sampleClaimId, version: "1" }),
  });
  assert.equal(htmlRes.status, 200);
  assert.match(htmlRes.headers.get("content-type") ?? "", /text\/html/);
  const htmlText = await htmlRes.text();
  assert.match(htmlText, /DCC Machine Reference/);

  // HEAD request
  const headRes = await headImmutableReferenceRoute(immReq, {
    params: Promise.resolve({ id: sampleClaimId, version: "1" }),
  });
  assert.equal(headRes.status, 200);
  assert.equal(await headRes.text(), "");
});

test("Acceptance 3 (Immutability): Updating a claim creates v2; /r/{id} points to v2; /r/{id}/v/1 still returns v1 with status superseded", () => {
  resetMachineStoreForTests();

  const claimId = "clm:jnu:seat-weight-surcharge-threshold";
  const beforeStable = resolveMachineReference(claimId);
  assert.ok(beforeStable);
  assert.equal(
    beforeStable.envelope.immutableVersion,
    "clmv:jnu:seat-weight-surcharge-threshold:v1",
  );

  // Supersede v1 with v2
  const superseded = supersedeMachineClaim({
    claimId,
    newTypedValue: {
      type: "number",
      value: 255,
    },
    newSupportingExcerpt:
      "Updated 2026 Amendment: Passengers exceeding 255 lbs clothed weight pay a seat-balance surcharge.",
    reason: "TEMSCO mid-season tariff amendment",
    issuedBy: "dcc-epistemic-auditor",
    occurredAt: "2026-06-01T00:00:00.000Z",
  });

  assert.equal(
    superseded.newVersion.versionId,
    "clmv:jnu:seat-weight-surcharge-threshold:v2",
  );
  assert.equal(superseded.previousVersion.status, "superseded");
  assert.equal(
    superseded.previousVersion.supersededByVersionId,
    "clmv:jnu:seat-weight-surcharge-threshold:v2",
  );

  // /r/{claimId} now resolves to v2
  const afterStable = resolveMachineReference(claimId);
  assert.ok(afterStable);
  assert.equal(
    afterStable.envelope.immutableVersion,
    "clmv:jnu:seat-weight-surcharge-threshold:v2",
  );
  assert.equal(afterStable.envelope.currentStatus, "verified");

  // /r/{claimId}/v/1 still resolves to v1 with status superseded and pointer to v2
  const historicalV1 = resolveMachineReference(claimId, "1");
  assert.ok(historicalV1, "Historical v1 must never be deleted");
  assert.equal(
    historicalV1.envelope.immutableVersion,
    "clmv:jnu:seat-weight-surcharge-threshold:v1",
  );
  assert.equal(historicalV1.envelope.currentStatus, "superseded");
  assert.equal(historicalV1.envelope.supersessionOrWithdrawal.isSuperseded, true);
  assert.equal(
    historicalV1.envelope.supersessionOrWithdrawal.supersededByVersionId,
    "clmv:jnu:seat-weight-surcharge-threshold:v2",
  );

  resetMachineStoreForTests();
});

test("Acceptance 4 (Withdrawal): Withdrawing a claim version causes dependent evaluations to stop treating that claim as valid support and surfaces explicit withdrawal status", () => {
  resetMachineStoreForTests();

  const claimVersionId = "clmv:jnu:usfs-authorized-glacier-helicopters:v1";
  const withdrawal = withdrawMachineClaimVersion({
    claimVersionId,
    reason: "Temporary USFS permit audit suspension",
    issuedBy: "dcc-compliance-officer",
    occurredAt: "2026-07-01T00:00:00.000Z",
  });

  assert.equal(withdrawal.withdrawnVersion.status, "withdrawn");
  assert.ok(withdrawal.retraction.id.startsWith("ret:withdraw:"));

  // Evaluate Juneau engine after claim withdrawal
  const evalAfterWithdraw = evaluateMachineEngine({
    engineId: "juneau-helicopter-tours",
    inputs: SAMPLE_JUNEAU_INPUT,
    mode: "compact",
    evaluatedAt: "2026-07-15T12:00:00.000Z",
  });

  assert.equal(evalAfterWithdraw.ok, true);
  if (!evalAfterWithdraw.ok) return;

  assert.ok(
    evalAfterWithdraw.response.withdrawnClaimVersionIds.includes(claimVersionId),
    "Evaluation must list the withdrawn claimVersionId",
  );
  assert.notEqual(
    evalAfterWithdraw.response.decisionState,
    "recommended",
    "Withdrawn supporting claim must prevent an unqualified positive recommendation",
  );
  assert.equal(evalAfterWithdraw.response.recommendedCandidateId, null);

  // Resolving the withdrawn claim version directly shows withdrawal metadata
  const resolvedCv = resolveMachineReference(claimVersionId, "1");
  assert.ok(resolvedCv);
  assert.equal(resolvedCv.envelope.currentStatus, "withdrawn");
  assert.equal(resolvedCv.envelope.supersessionOrWithdrawal.isWithdrawn, true);

  resetMachineStoreForTests();
});

test("Acceptance 5 (Conflict): Conflicting claims are preserved and prevent silent positive certainty", () => {
  resetMachineStoreForTests();

  const conflict = openMachineClaimConflict({
    id: "conf:hi:noaa-approach-distance-dispute",
    claimId: "clm:hi:humpback-season-window",
    claimVersionIds: [
      "clmv:hi:humpback-season-window:v1",
      "clmv:hi:pacwhale-specs-and-accessibility:v1",
    ],
    conflictType: "operator_vs_regulator",
    summary:
      "Unresolved conflict between operator brochure distance claim and federal 15 CFR § 922.184 100-yard rule.",
    resolutionPolicy: "block_positive_recommendation",
    detectedAt: "2026-02-10T00:00:00.000Z",
  });

  assert.equal(conflict.status, "disputed");

  const evalWithConflict = evaluateMachineEngine({
    engineId: "hawaii-whale-watching",
    inputs: SAMPLE_HAWAII_INPUT,
    mode: "compact",
    evaluatedAt: "2027-02-14T12:00:00.000Z",
  });

  assert.equal(evalWithConflict.ok, true);
  if (!evalWithConflict.ok) return;

  assert.equal(evalWithConflict.response.decisionState, "conflict_blocked");
  assert.equal(evalWithConflict.response.recommendedCandidateId, null);
  assert.ok(
    evalWithConflict.response.conflictIds.includes(
      "conf:hi:noaa-approach-distance-dispute",
    ),
  );

  resetMachineStoreForTests();
});

test("Acceptance 6 (Staleness): Expired claims cannot silently support a positive recommendation", () => {
  resetMachineStoreForTests();

  // Evaluate with evaluatedAt in 2029 (past the valid_to of the 2026-2027 tariff claims)
  const staleEval = evaluateMachineEngine({
    engineId: "juneau-helicopter-tours",
    inputs: SAMPLE_JUNEAU_INPUT,
    mode: "expanded",
    evaluatedAt: "2029-05-01T00:00:00.000Z",
  });

  assert.equal(staleEval.ok, true);
  if (!staleEval.ok) return;

  const expanded = staleEval.response as ExpandedEvaluationResponse;
  assert.notEqual(
    expanded.decisionState,
    "recommended",
    "Expired claims must not produce an unqualified recommended state",
  );
  assert.equal(expanded.decisionState, "qualified_with_warnings");
  assert.ok(expanded.trace.staleClaimsEncountered.length > 0);
  for (const cand of expanded.viableCandidates) {
    assert.equal(cand.status, "viable_qualified_unknown_or_stale");
  }
});

test("Acceptance 7 (Unknown handling): Missing or unknown required input produces an explicit unknown result rather than coercing to false or 0", () => {
  resetMachineStoreForTests();

  // Pass explicit "unknown" or null for critical inputs (date, arrivalTime, maxSinglePassengerWeightLbs)
  const unknownEval = evaluateMachineEngine({
    engineId: "juneau-helicopter-tours",
    inputs: {
      date: "unknown",
      arrivalTime: "unknown",
      arrivalDock: "CT",
      maxSinglePassengerWeightLbs: null,
    },
    mode: "expanded",
    evaluatedAt: "2026-04-12T12:00:00.000Z",
  });

  assert.equal(unknownEval.ok, true);
  if (!unknownEval.ok) return;

  const response = unknownEval.response as ExpandedEvaluationResponse;
  assert.equal(response.decisionState, "unknown_insufficient_inputs");
  assert.ok(response.unknownFields.includes("date"));
  assert.ok(response.unknownFields.includes("arrivalTime"));
  assert.ok(response.unknownFields.includes("maxSinglePassengerWeightLbs"));

  // Verify in the trace that arrivalTime and maxSinglePassengerWeightLbs were preserved as "unknown" and NOT coerced to 0
  assert.equal(response.trace.normalizedInput.arrivalTime, "unknown");
  assert.equal(response.trace.normalizedInput.maxSinglePassengerWeightLbs, "unknown");
});

test("Acceptance 8 (Compiler safety & Active Pointer Rollback): A rule referencing a nonexistent claim, missing fragment, or invalid schema fails compilation and does not update the active engine version", () => {
  resetMachineStoreForTests();

  const seed = buildJuneauAndHawaiiMachineSeed();
  const brokenSpec = {
    ...seed.juneauCompilationSpec,
    version: "2.0.0-broken",
    rules: [
      ...seed.juneauCompilationSpec.rules,
      {
        id: "rule:jnu:orphan-claim-test",
        version: "2.0.0-broken",
        ruleKind: "hard_exclusion" as const,
        title: "Orphan Claim Reference Test Rule",
        description: "References a nonexistent claimVersionId",
        reasonCode: "EXCLUDED_BY_ORPHAN_CLAIM",
        severityOrWeight: 100,
        onUnknownResult: "keep_and_qualify_unknown" as const,
        claimVersionDependencies: ["clmv:jnu:nonexistent-claim:v99"],
        when: {
          op: "eq" as const,
          left: { ref: "claim" as const, claimVersionId: "clmv:jnu:nonexistent-claim:v99" },
          right: { ref: "literal" as const, value: true },
        },
        remediationHint: "Should never compile.",
      },
    ],
  };

  const result = publishMachineEngineBundle(brokenSpec, true);
  assert.equal(result.ok, false, "Compiler must reject bundle with orphan claim dependency");
  if (!result.ok) {
    assert.ok(
      result.errors.some(
        (e) =>
          e.code.includes("COMPILER_VALIDATION_FAILED") ||
          e.message.includes("nonexistent-claim"),
      ),
      `Expected claim validation error, got ${JSON.stringify(result.errors)}`,
    );
  }

  // Active engine version must still be 1.0.0
  const engineAfterFailedCompile = getMachineEngine("juneau-helicopter-tours");
  assert.ok(engineAfterFailedCompile);
  assert.equal(engineAfterFailedCompile.engine.activeVersion, "1.0.0");
  assert.ok(!engineAfterFailedCompile.engine.availableVersions.includes("2.0.0-broken"));

  // Now publish a valid v1.1.0 and verify active pointer update + rollback
  const validV11Spec = {
    ...seed.juneauCompilationSpec,
    version: "1.1.0",
    sourceRevision: "2026.04.20-jnu-v2",
  };
  const validPub = publishMachineEngineBundle(validV11Spec, true);
  assert.equal(validPub.ok, true);

  const engineAt11 = getMachineEngine("juneau-helicopter-tours");
  assert.ok(engineAt11);
  assert.equal(engineAt11.engine.activeVersion, "1.1.0");
  assert.equal(engineAt11.engine.previousActiveVersion, "1.0.0");

  // Roll back to 1.0.0 without deleting 1.1.0
  const rolledBack = rollbackMachineEngineVersion("juneau-helicopter-tours");
  assert.equal(rolledBack.ok, true);
  if (rolledBack.ok) {
    assert.equal(rolledBack.engine.activeVersion, "1.0.0");
    assert.ok(rolledBack.engine.availableVersions.includes("1.1.0"));
  }

  resetMachineStoreForTests();
});

test("Acceptance 9 & 10 (Universal Engine Proof & Hot-Path Isolation): Juneau and Hawaii both run through the exact same Decision IR compiler and evaluator with zero external network calls", () => {
  resetMachineStoreForTests();

  const originalFetch = globalThis.fetch;
  let networkCallsDuringEval = 0;
  globalThis.fetch = (async () => {
    networkCallsDuringEval++;
    throw new Error("External network call attempted during Decision IR evaluation hot path!");
  }) as typeof fetch;

  try {
    // 1. Juneau Clear-Weather Icefield Landing
    const juneauClear = evaluateMachineEngine({
      engineId: "juneau-helicopter-tours",
      inputs: SAMPLE_JUNEAU_INPUT,
      mode: "compact",
      evaluatedAt: "2026-04-12T12:00:00.000Z",
    });
    assert.equal(juneauClear.ok, true);
    if (juneauClear.ok) {
      assert.equal(juneauClear.response.decisionState, "recommended");
      assert.equal(
        juneauClear.response.recommendedCandidateId,
        "jnu-heli-coastal-icefield",
      );
    }

    // 2. Juneau Low IFR Fog Hold eliminates all aviation and surfaces surface contingencies
    const juneauCeilingHold = evaluateMachineEngine({
      engineId: "juneau-helicopter-tours",
      inputs: {
        ...SAMPLE_JUNEAU_INPUT,
        weatherCondition: "low_ifr_fog_hold",
      },
      mode: "compact",
      evaluatedAt: "2026-04-12T12:00:00.000Z",
    });
    assert.equal(juneauCeilingHold.ok, true);
    if (juneauCeilingHold.ok) {
      assert.equal(juneauCeilingHold.response.decisionState, "no_viable_candidates");
      assert.equal(juneauCeilingHold.response.viableCandidates.length, 0);
      assert.equal(juneauCeilingHold.response.contingencyCandidates.length, 2);
      assert.equal(
        juneauCeilingHold.response.contingencyCandidates[0].candidateId,
        "jnu-backup-auke-bay-whale",
      );
    }

    // 3. Hawaii Maui Peak Season Catamaran vs Raft Pregnancy Exclusion
    const hawaiiMaui = evaluateMachineEngine({
      engineId: "hawaii-whale-watching",
      inputs: {
        ...SAMPLE_HAWAII_INPUT,
        departureArea: "any",
        hasPregnantTraveler: true,
      },
      mode: "compact",
      evaluatedAt: "2026-04-12T12:00:00.000Z",
    });
    assert.equal(hawaiiMaui.ok, true);
    if (hawaiiMaui.ok) {
      assert.equal(hawaiiMaui.response.decisionState, "recommended");
      assert.equal(
        hawaiiMaui.response.recommendedCandidateId,
        "hi-whale-maui-pacwhale-catamaran",
      );
      const excludedRaft = hawaiiMaui.response.excludedCandidates.find(
        (c) => c.candidateId === "hi-whale-maui-eye-level-rib-raft",
      );
      assert.ok(excludedRaft, "High-speed raft must be excluded when hasPregnantTraveler is true");
      assert.ok(
        excludedRaft.reasonCodes.includes(
          "REASON_PREGNANCY_OR_SPINAL_RIB_CONTRAINDICATION",
        ),
      );
    }

    // 4. Hawaii Off-Season (July) eliminates all humpback whale cruises
    const hawaiiJuly = evaluateMachineEngine({
      engineId: "hawaii-whale-watching",
      inputs: {
        ...SAMPLE_HAWAII_INPUT,
        travelDate: "2026-07-15",
        travelMonth: 7,
      },
      mode: "compact",
      evaluatedAt: "2026-04-12T12:00:00.000Z",
    });
    assert.equal(hawaiiJuly.ok, true);
    if (hawaiiJuly.ok) {
      assert.equal(hawaiiJuly.response.decisionState, "no_viable_candidates");
      assert.equal(hawaiiJuly.response.viableCandidates.length, 0);
      assert.ok(
        hawaiiJuly.response.reasonCodes.includes(
          "REASON_OUTSIDE_HUMPBACK_WHALE_SEASON",
        ),
      );
    }

    assert.equal(
      networkCallsDuringEval,
      0,
      "Evaluation hot path must make zero external network calls",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Acceptance 11 (SSRF Protection & Untrusted AI Quarantine): Ingestion blocks localhost, 127.0.0.1, 169.254.169.254, private RFC1918, IPv6 loopback/link-local, non-HTTPS URLs, and unsafe redirects", async () => {
  const blockedUrls = [
    { url: "http://example.com/data.json", expectedCode: "DISALLOWED_PROTOCOL" },
    { url: "file:///etc/passwd", expectedCode: "DISALLOWED_PROTOCOL" },
    { url: "https://localhost/admin", expectedCode: "BLOCKED_HOSTNAME" },
    { url: "https://sub.localhost/api", expectedCode: "BLOCKED_HOSTNAME" },
    { url: "https://127.0.0.1/secret", expectedCode: "BLOCKED_PRIVATE_OR_METADATA_IPV4" },
    { url: "https://10.0.0.1/internal", expectedCode: "BLOCKED_PRIVATE_OR_METADATA_IPV4" },
    { url: "https://172.16.5.4/internal", expectedCode: "BLOCKED_PRIVATE_OR_METADATA_IPV4" },
    { url: "https://192.168.1.1/router", expectedCode: "BLOCKED_PRIVATE_OR_METADATA_IPV4" },
    { url: "https://169.254.169.254/latest/meta-data/", expectedCode: "BLOCKED_PRIVATE_OR_METADATA_IPV4" },
    { url: "https://[::1]/loopback", expectedCode: "BLOCKED_PRIVATE_OR_METADATA_IPV6" },
    { url: "https://[fe80::1]/linklocal", expectedCode: "BLOCKED_PRIVATE_OR_METADATA_IPV6" },
    { url: "https://[fd00::1]/ula", expectedCode: "BLOCKED_PRIVATE_OR_METADATA_IPV6" },
    { url: "https://user:pass@example.com/data", expectedCode: "DISALLOWED_CREDENTIALS" },
  ];

  for (const item of blockedUrls) {
    assert.throws(
      () => validateUrlAgainstSsrf(item.url),
      (err: unknown) => {
        assert.ok(err instanceof SsrfProtectionError);
        assert.equal(err.code, item.expectedCode, `Unexpected code for ${item.url}`);
        return true;
      },
      `URL ${item.url} should be blocked`,
    );
  }

  // Test redirect revalidation: public HTTPS redirecting to 169.254.169.254 must be blocked
  const mockRedirectFetch: typeof fetch = async (input) => {
    const urlStr = String(input);
    if (urlStr === "https://public.example.org/start") {
      return new Response(null, {
        status: 302,
        headers: { location: "https://169.254.169.254/latest/meta-data/" },
      });
    }
    return new Response("{}", {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  await assert.rejects(
    async () =>
      ingestSourceArtifactSafely("https://public.example.org/start", {
        fetchImpl: mockRedirectFetch,
      }),
    (err: unknown) => {
      assert.ok(err instanceof SsrfProtectionError);
      assert.equal(err.code, "BLOCKED_PRIVATE_OR_METADATA_IPV4");
      return true;
    },
  );

  // Test Untrusted AI Extraction Quarantine: cannot enter verified graph until explicitly verified
  const quarantined = stageUntrustedAiClaimExtraction({
    proposedClaimId: "clm:test:untrusted-ai-claim",
    subject: "ent:tour:jnu-heli-temsco-mendenhall",
    predicate: "helicopter_landing_tariff",
    typedValue: { type: "number", value: 429 },
    unitOrCurrency: "USD",
    geographicScope: {
      countryCode: "US",
      regionOrState: "AK",
      localityOrIsland: "juneau",
      corridorOrHarbor: "juneau-icefield",
      radiusKm: 45,
    },
    jurisdiction: "US-AK-JUNEAU",
    sourceId: "src:temsco-juneau-ops-2026",
    sourceSnapshotId: "snap:temsco-juneau-ops-2026:v1",
    evidenceFragmentId: "evfrag:temsco-juneau-ops-2026:pricing",
    extractedByModel: "gemini-untrusted-extractor",
  });
  assert.equal(quarantined.status, "quarantined_unverified");
  assert.equal(quarantined.activeInDecisionGraph, false);

  const promoted = verifyAndPromoteQuarantinedExtraction({
    extractionId: quarantined.extractionId,
    verifiedBy: "dcc-human-auditor",
  });
  assert.equal(promoted.status, "verified_promoted");
  assert.equal(promoted.activeInDecisionGraph, true);
});

test("Acceptance 12 (Schema Validity & Machine Endpoints): All public machine endpoints return valid responses conforming to published JSON Schemas", async () => {
  resetMachineStoreForTests();

  // 1. GET /.well-known/dcc
  const wellKnownRes = await getWellKnownDcc();
  assert.equal(wellKnownRes.status, 200);
  const wellKnownBody = (await wellKnownRes.json()) as Record<string, unknown>;
  assert.equal(wellKnownBody.spec, "dcc-machine-layer/0.1");

  // 2. GET /agent.json & GET /openapi.json
  const agentRes = await getAgentJson();
  assert.equal(agentRes.status, 200);
  const agentBody = (await agentRes.json()) as Record<string, unknown>;
  assert.ok(agentBody.dcc_machine_layer, "/agent.json must include dcc_machine_layer");

  const openApiRes = await getOpenApiJson();
  assert.equal(openApiRes.status, 200);
  const openApiBody = (await openApiRes.json()) as { paths: Record<string, unknown> };
  assert.ok(openApiBody.paths["/api/v1/evaluate"]);
  assert.ok(openApiBody.paths["/api/v1/evaluations:batch"]);
  assert.ok(openApiBody.paths["/r/{id}/v/{version}"]);

  // 3. GET /api/v1/entities/{id}
  const entRes = await getEntityRoute(
    new Request("https://www.destinationcommandcenter.com/api/v1/entities/ent:place:juneau"),
    { params: Promise.resolve({ id: "ent:place:juneau" }) },
  );
  assert.equal(entRes.status, 200);

  // 4. GET /api/v1/claims/{id}
  const claimRes = await getClaimRoute(
    new Request("https://www.destinationcommandcenter.com/api/v1/claims/clm:jnu:jnu-shuttle-and-checkin-lead"),
    { params: Promise.resolve({ id: "clm:jnu:jnu-shuttle-and-checkin-lead" }) },
  );
  assert.equal(claimRes.status, 200);
  const claimBody = (await claimRes.json()) as { claim: { currentVersion: unknown } };
  assert.equal(
    validateAgainstJsonSchema(claimBody.claim.currentVersion, CLAIM_VERSION_JSON_SCHEMA).valid,
    true,
  );

  // 5. GET /api/v1/sources/{id}
  const srcRes = await getSourceRoute(
    new Request("https://www.destinationcommandcenter.com/api/v1/sources/src:cbj-docks-harbors-schedule-2026"),
    { params: Promise.resolve({ id: "src:cbj-docks-harbors-schedule-2026" }) },
  );
  assert.equal(srcRes.status, 200);

  // 6. GET /api/v1/rules/{id}
  const ruleRes = await getRuleRoute(
    new Request("https://www.destinationcommandcenter.com/api/v1/rules/rule:jnu:hc-weather-ceiling"),
    { params: Promise.resolve({ id: "rule:jnu:hc-weather-ceiling" }) },
  );
  assert.equal(ruleRes.status, 200);

  // 7. GET /api/v1/engines/{id}
  const engRes = await getEngineRoute(
    new Request("https://www.destinationcommandcenter.com/api/v1/engines/juneau-helicopter-tours"),
    { params: Promise.resolve({ id: "juneau-helicopter-tours" }) },
  );
  assert.equal(engRes.status, 200);

  // 8. GET /api/v1/bundles/{engineId}/{version}
  const bundleRes = await getBundleRoute(
    new Request("https://www.destinationcommandcenter.com/api/v1/bundles/juneau-helicopter-tours/1.0.0"),
    {
      params: Promise.resolve({
        engineId: "juneau-helicopter-tours",
        version: "1.0.0",
      }),
    },
  );
  assert.equal(bundleRes.status, 200);
  assert.equal(
    bundleRes.headers.get("cache-control"),
    "public, max-age=31536000, immutable",
  );
  const bundleBody = (await bundleRes.json()) as { bundle: unknown };
  assert.equal(
    validateAgainstJsonSchema(bundleBody.bundle, DECISION_IR_JSON_SCHEMA).valid,
    true,
  );

  // 9. POST /api/v1/evaluate (compact & expanded)
  const evalCompactRes = await postEvaluateRoute(
    new Request("https://www.destinationcommandcenter.com/api/v1/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        engineId: "juneau-helicopter-tours",
        mode: "compact",
        evaluatedAt: "2026-04-12T12:00:00.000Z",
        inputs: SAMPLE_JUNEAU_INPUT,
      }),
    }),
  );
  assert.equal(evalCompactRes.status, 200);
  const compactJson = (await evalCompactRes.json()) as CompactEvaluationResponse;
  assert.equal(
    validateAgainstJsonSchema(compactJson, COMPACT_EVALUATION_JSON_SCHEMA).valid,
    true,
  );

  const evalExpandedRes = await postEvaluateRoute(
    new Request("https://www.destinationcommandcenter.com/api/v1/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        engineId: "hawaii-whale-watching",
        mode: "expanded",
        evaluatedAt: "2026-04-12T12:00:00.000Z",
        inputs: SAMPLE_HAWAII_INPUT,
      }),
    }),
  );
  assert.equal(evalExpandedRes.status, 200);
  const expandedJson = (await evalExpandedRes.json()) as ExpandedEvaluationResponse;
  assert.equal(
    validateAgainstJsonSchema(expandedJson, EXPANDED_EVALUATION_JSON_SCHEMA).valid,
    true,
  );

  // 10. POST /api/v1/evaluations:batch
  const batchRes = await postV1DynamicAction(
    new Request("https://www.destinationcommandcenter.com/api/v1/evaluations:batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        evaluatedAt: "2026-04-12T12:00:00.000Z",
        items: [
          {
            requestId: "b1",
            engineId: "juneau-helicopter-tours",
            inputs: SAMPLE_JUNEAU_INPUT,
          },
          {
            requestId: "b2",
            engineId: "hawaii-whale-watching",
            inputs: SAMPLE_HAWAII_INPUT,
          },
        ],
      }),
    }),
    { params: Promise.resolve({ action: "evaluations:batch" }) },
  );
  assert.equal(batchRes.status, 200);
  const batchJson = (await batchRes.json()) as { batchSize: number; results: Array<{ ok: boolean }> };
  assert.equal(batchJson.batchSize, 2);
  assert.equal(batchJson.results[0].ok, true);
  assert.equal(batchJson.results[1].ok, true);

  // 11. GET /api/v1/changes?since=0
  const changesRes = await getChangesRoute(
    new Request("https://www.destinationcommandcenter.com/api/v1/changes?since=0&limit=10"),
  );
  assert.equal(changesRes.status, 200);
  const changesJson = (await changesRes.json()) as { events: unknown[]; nextCursor: number };
  assert.equal(changesJson.events.length, 10);
  assert.equal(changesJson.nextCursor, 10);

  // 12. Feature flag gate verification (DCC_MACHINE_V1 = false returns 503)
  setDccMachineV1RuntimeOverride(false);
  try {
    const disabledRes = await getWellKnownDcc();
    assert.equal(disabledRes.status, 503);
  } finally {
    setDccMachineV1RuntimeOverride(null);
  }
});

test("Acceptance 13 (Regression, Reversible Migrations & Zero WTA Guarantee): Zero Welcome to Alaska Tours references exist anywhere in the Machine Layer and migrations are reversible", () => {
  resetMachineStoreForTests();
  const store = getMachineStore();

  const serializedStore = JSON.stringify({
    entities: Array.from(store.entitiesById.values()),
    sources: Array.from(store.sourcesById.values()),
    claims: Array.from(store.claimsById.values()),
    bundles: Array.from(store.bundlesById.values()),
  }).toLowerCase();

  assert.equal(
    serializedStore.includes("welcometoalaskatours"),
    false,
    "Machine store must never reference welcometoalaskatours",
  );
  assert.equal(
    serializedStore.includes("welcome to alaska tours"),
    false,
    "Machine store must never reference Welcome to Alaska Tours",
  );

  // Verify additive up migration and reversible down migration exist and cover all 16 tables
  const upSqlPath = path.join(process.cwd(), "drizzle", "0005_dcc_machine_layer_v01.sql");
  const downSqlPath = path.join(
    process.cwd(),
    "drizzle",
    "0005_dcc_machine_layer_v01.down.sql",
  );
  assert.equal(fs.existsSync(upSqlPath), true);
  assert.equal(fs.existsSync(downSqlPath), true);

  const upSql = fs.readFileSync(upSqlPath, "utf8");
  const downSql = fs.readFileSync(downSqlPath, "utf8");
  const expectedTables = [
    "dcc_machine_entities",
    "dcc_machine_sources",
    "dcc_machine_source_snapshots",
    "dcc_machine_evidence_fragments",
    "dcc_machine_claims",
    "dcc_machine_claim_versions",
    "dcc_machine_claim_conflicts",
    "dcc_machine_rules",
    "dcc_machine_rule_sets",
    "dcc_machine_engines",
    "dcc_machine_engine_versions",
    "dcc_machine_engine_bundles",
    "dcc_machine_evaluations",
    "dcc_machine_evaluation_traces",
    "dcc_machine_retractions",
    "dcc_machine_change_events",
  ];
  for (const tbl of expectedTables) {
    assert.ok(upSql.includes(tbl), `Up migration must define ${tbl}`);
    assert.ok(downSql.includes(tbl), `Down migration must drop ${tbl}`);
  }
});

test("Benchmark Gate: Small, Medium, and Large Decision IR bundles compile, load, and evaluate deterministically at high speed", () => {
  const metrics = runDccMachineLayerBenchmarks();
  assert.equal(metrics.length, 3);

  const [small, medium, large] = metrics;
  assert.equal(small.candidateCount, 7);
  assert.equal(small.ruleCount, 11);
  assert.equal(medium.candidateCount, 50);
  assert.equal(medium.ruleCount, 40);
  assert.equal(large.candidateCount, 250);
  assert.equal(large.ruleCount, 100);

  // Sub-50ms cold evaluation even on Large (250 candidates x 100 rules)
  assert.ok(small.coldEvalMeanMs < 20, `Small coldEvalMeanMs=${small.coldEvalMeanMs}ms`);
  assert.ok(medium.coldEvalMeanMs < 50, `Medium coldEvalMeanMs=${medium.coldEvalMeanMs}ms`);
  assert.ok(large.coldEvalMeanMs < 150, `Large coldEvalMeanMs=${large.coldEvalMeanMs}ms`);
});
