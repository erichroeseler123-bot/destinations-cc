import assert from "node:assert/strict";
import test from "node:test";

import { GET as getWellKnownDcc } from "@/app/.well-known/dcc/route";
import { GET as getPublicKeysRoute } from "@/app/.well-known/dcc/keys.json/route";
import { POST as postEvaluateRoute } from "@/app/api/v1/evaluate/route";
import { POST as postBatchEvaluateRoute } from "@/app/api/v1/evaluations-batch/route";
import { GET as getReceiptRoute } from "@/app/api/v1/receipts/[id]/route";
import { GET as getUniverseRoute } from "@/app/api/v1/universes/[id]/route";
import { GET as getStableReferenceRoute } from "@/app/r/[id]/route";
import { GET as getImmutableReferenceRoute } from "@/app/r/[id]/v/[version]/route";
import {
  CANDIDATE_UNIVERSE_JSON_SCHEMA,
  FailClosedStorageConfigurationError,
  MachineSecurityLimitError,
  SIGNED_RECEIPT_JSON_SCHEMA,
  SsrfProtectionError,
  enforceBatchItemCountLimit,
  enforceCompilerResourceLimits,
  enforceEvaluationRequestSizeLimit,
  evaluateMachineEngine,
  getMachineCandidateUniverse,
  getPublicSigningKeyManifest,
  ingestSourceArtifactSafely,
  registerSigningKeyForTests,
  resetMachineSecurityLimitsForTests,
  resetMachineStoreForTests,
  resetSigningKeyStoreForTests,
  resolveAndValidateDnsAgainstRebinding,
  resolveMachineReference,
  resolveMachineStorageConfig,
  revokeSigningKey,
  rotateSigningKey,
  runRealJuneauSourceToDecisionLifecycle,
  setDccMachineV1RuntimeOverride,
  signDecisionReceipt,
  supersedeMachineClaim,
  validateAgainstJsonSchema,
  verifyDecisionReceiptSignature,
  type ExpandedEvaluationResponse,
  type SignedDecisionReceipt,
} from "@/lib/dcc/machine";
import { runDccV02ThreePartBenchmarks } from "@/scripts/dcc/benchmark-machine-layer";
import { runBlackBoxCanaryVerification } from "@/scripts/dcc/blackbox-verify-canary";

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

test("v0.2 Gate 1 (Fail-Closed Storage Configuration): Production environment fails closed if configured with local_fs storage", () => {
  assert.throws(
    () =>
      resolveMachineStorageConfig({
        NODE_ENV: "production",
        VERCEL_ENV: "production",
        DCC_MACHINE_STORAGE_MODE: "local_fs",
      }),
    (err: unknown) => {
      assert.ok(err instanceof FailClosedStorageConfigurationError);
      assert.equal(err.code, "FAIL_CLOSED_LOCAL_FS_FORBIDDEN_IN_PROD");
      return true;
    },
  );

  // Also fails closed in production if DATABASE_URL is missing
  assert.throws(
    () =>
      resolveMachineStorageConfig({
        NODE_ENV: "production",
        VERCEL_ENV: "production",
        DCC_MACHINE_STORAGE_MODE: "durable_neon_r2",
      }),
    (err: unknown) => {
      assert.ok(err instanceof FailClosedStorageConfigurationError);
      assert.equal(err.code, "FAIL_CLOSED_MISSING_NEON_DATABASE_URL");
      return true;
    },
  );

  // Succeeds in production when durable_neon_r2 and DATABASE_URL are configured
  const validProdConfig = resolveMachineStorageConfig({
    NODE_ENV: "production",
    VERCEL_ENV: "production",
    DCC_MACHINE_STORAGE_MODE: "durable_neon_r2",
    DATABASE_URL: "postgresql://user:pass@ep-test.us-east-2.aws.neon.tech/neondb",
  });
  assert.equal(validProdConfig.mode, "durable_neon_r2");
  assert.equal(validProdConfig.isProduction, true);
});

test("v0.2 Gate 2 (Declared Candidate Universes): Versioned, content-addressed CandidateUniverse classifies every candidate with explicit epistemic boundaries", async () => {
  setDccMachineV1RuntimeOverride(true);
  resetMachineStoreForTests();

  const juneauUniverse = getMachineCandidateUniverse("juneau-helicopter-tours", "1.0.0");
  assert.ok(juneauUniverse, "Juneau CandidateUniverse must exist");
  const schemaValid = validateAgainstJsonSchema(
    juneauUniverse,
    CANDIDATE_UNIVERSE_JSON_SCHEMA,
  );
  assert.equal(
    schemaValid.valid,
    true,
    `CandidateUniverse failed schema check: ${schemaValid.errors.join(", ")}`,
  );
  assert.equal(juneauUniverse.universeId, "univ:juneau-helicopter-tours");
  assert.equal(juneauUniverse.includedCandidateIds.length, 7);
  assert.ok(juneauUniverse.knownExclusions.length >= 2);
  assert.ok(juneauUniverse.unresolvedCoverageGaps.length >= 2);
  assert.match(
    juneauUniverse.epistemicDisclaimer,
    /does NOT claim that these are the only valid options in the world/i,
  );

  // Verify HTTP endpoint GET /api/v1/universes/univ:juneau-helicopter-tours?version=1.0.0
  const req = new Request(
    "https://www.destinationcommandcenter.com/api/v1/universes/univ%3Ajuneau-helicopter-tours?version=1.0.0",
  );
  const res = await getUniverseRoute(req, {
    params: Promise.resolve({ id: "univ:juneau-helicopter-tours" }),
  });
  assert.equal(res.status, 200);
  assert.match(res.headers.get("cache-control") ?? "", /immutable/);
  const body = (await res.json()) as {
    ok: boolean;
    candidateUniverse: typeof juneauUniverse;
  };
  assert.equal(body.ok, true);
  assert.equal(body.candidateUniverse.canonicalHash, juneauUniverse.canonicalHash);

  // Evaluate Juneau and verify every candidate in the declared universe is classified as eligible, qualified, ineligible, or indeterminate
  const evalRes = evaluateMachineEngine({
    engineId: "juneau-helicopter-tours",
    inputs: {
      ...SAMPLE_JUNEAU_INPUT,
      maxSinglePassengerWeightLbs: 265, // triggers qualification warning on commercial tours
      requestedFormat: "glacier_dogsled", // excludes non-dogsled commercial tours
    },
    mode: "expanded",
    evaluatedAt: "2026-04-12T12:00:00.000Z",
  });
  assert.equal(evalRes.ok, true);
  if (!evalRes.ok) return;

  const expanded = evalRes.response as ExpandedEvaluationResponse;
  assert.equal(expanded.candidateUniverseId, juneauUniverse.universeId);
  assert.equal(expanded.candidateUniverseVersion, juneauUniverse.version);
  assert.equal(expanded.candidateUniverseHash, juneauUniverse.canonicalHash);
  assert.ok(expanded.candidateDispositions);
  assert.equal(
    expanded.candidateDispositions.length,
    juneauUniverse.includedCandidateIds.length,
  );

  const dispositionsSeen = new Set(
    expanded.candidateDispositions.map((d) => d.disposition),
  );
  assert.ok(
    dispositionsSeen.has("qualified") || dispositionsSeen.has("eligible"),
    "Must classify viable/qualified candidates",
  );
  assert.ok(dispositionsSeen.has("ineligible"), "Must classify excluded candidates");
});

test("v0.2 Gate 3 (Content Identity vs Audit Identity): Unique evaluationRunId and traceRunId per request, while evaluationFingerprint, resultHash, traceHash, and receiptId remain deterministic", () => {
  resetMachineStoreForTests();

  const run1 = evaluateMachineEngine({
    engineId: "juneau-helicopter-tours",
    inputs: SAMPLE_JUNEAU_INPUT,
    mode: "expanded",
    evaluatedAt: "2026-04-12T12:00:00.000Z",
    validAt: "2026-07-15T12:00:00.000Z",
    knownAt: "2026-04-12T12:00:00.000Z",
    bypassCache: false,
  });
  const run2 = evaluateMachineEngine({
    engineId: "juneau-helicopter-tours",
    inputs: SAMPLE_JUNEAU_INPUT,
    mode: "expanded",
    evaluatedAt: "2026-04-12T12:00:00.000Z",
    validAt: "2026-07-15T12:00:00.000Z",
    knownAt: "2026-04-12T12:00:00.000Z",
    bypassCache: false, // Warm cache hit!
  });

  assert.equal(run1.ok, true);
  assert.equal(run2.ok, true);
  if (!run1.ok || !run2.ok) return;

  const r1 = run1.response as ExpandedEvaluationResponse;
  const r2 = run2.response as ExpandedEvaluationResponse;

  // Audit identity MUST be unique per execution (even on cache hit!)
  assert.ok(r1.evaluationRunId?.startsWith("evalrun:"));
  assert.ok(r2.evaluationRunId?.startsWith("evalrun:"));
  assert.notEqual(
    r1.evaluationRunId,
    r2.evaluationRunId,
    "evaluationRunId must be unique per request",
  );
  assert.notEqual(
    r1.traceRunId,
    r2.traceRunId,
    "traceRunId must be unique per execution",
  );

  // Content identity MUST be deterministic across runs
  assert.equal(r1.evaluationFingerprint, r2.evaluationFingerprint);
  assert.equal(r1.resultHash, r2.resultHash);
  assert.equal(r1.traceHash, r2.traceHash);
  assert.equal(r1.receiptId, r2.receiptId);
});

test("v0.2 Gate 4 (Genuine Bitemporal Behavior — validAt vs knownAt): Retroactive correction does NOT rewrite what DCC knew during an earlier evaluation; historical receipts replay using original versions while new decisions use corrected versions", () => {
  resetMachineStoreForTests();

  const claimId = "clm:jnu:seat-weight-surcharge-threshold";
  // Seed v1 has:
  //   value = 250 lbs
  //   valid_from = 2026-01-01T00:00:00.000Z, valid_to = 2027-12-31T23:59:59.000Z
  //   known_from = 2026-04-08T00:00:00.000Z, known_to = null

  // Traveler weight is 245 lbs (< 250 lbs in v1, so NO weight surcharge warning at T_known_1)
  const traveler245Input = {
    ...SAMPLE_JUNEAU_INPUT,
    maxSinglePassengerWeightLbs: 245,
  };

  // Step 1: Evaluate at T_known_1 = 2026-05-01 for trip date T_valid = 2026-07-15
  const evalAtT1 = evaluateMachineEngine({
    engineId: "juneau-helicopter-tours",
    inputs: traveler245Input,
    mode: "expanded",
    evaluatedAt: "2026-05-01T12:00:00.000Z",
    validAt: "2026-07-15T12:00:00.000Z",
    knownAt: "2026-05-01T12:00:00.000Z",
  });
  assert.equal(evalAtT1.ok, true);
  if (!evalAtT1.ok) return;
  const respBeforeCorrection = evalAtT1.response as ExpandedEvaluationResponse;
  assert.equal(
    respBeforeCorrection.decisionState,
    "recommended",
    "At knownAt=2026-05-01, 245 lbs is below the v1 250 lb threshold, so decisionState is recommended",
  );
  assert.ok(
    !respBeforeCorrection.reasonCodes.includes(
      "WARN_FAA_250LB_SEAT_SURCHARGE_APPLIES",
    ),
  );
  assert.ok(
    respBeforeCorrection.trace.resolvedClaimVersionIds.includes(
      "clmv:jnu:seat-weight-surcharge-threshold:v1",
    ),
  );
  const historicalReceipt = respBeforeCorrection.receipt as SignedDecisionReceipt;

  // Step 2: On 2026-06-15 (known_from = 2026-06-15), DCC receives a RETROACTIVE tariff correction
  // lowering the threshold to 240 lbs effective retroactively from 2026-01-01 (valid_from = 2026-01-01)!
  const retroactiveSupersede = supersedeMachineClaim({
    claimId,
    newTypedValue: {
      type: "number",
      value: 240,
    },
    newValidFrom: "2026-01-01T00:00:00.000Z", // Retroactive world validity!
    newValidTo: "2027-12-31T23:59:59.000Z",
    newSupportingExcerpt:
      "Retroactive 2026 Tariff Correction (discovered 2026-06-15): Passengers exceeding 240 lbs require seat-balance surcharge.",
    reason: "Retroactive operator tariff correction effective Jan 1, 2026",
    issuedBy: "dcc-epistemic-auditor",
    occurredAt: "2026-06-15T00:00:00.000Z", // When DCC learned of the correction (known_from)
  });

  assert.equal(
    retroactiveSupersede.previousVersion.known_to,
    "2026-06-15T00:00:00.000Z",
  );
  assert.equal(
    retroactiveSupersede.newVersion.known_from,
    "2026-06-15T00:00:00.000Z",
  );
  assert.equal(
    retroactiveSupersede.newVersion.valid_from,
    "2026-01-01T00:00:00.000Z",
  );

  // Step 3: New decision at T_known_2 = 2026-06-20 for the same trip date T_valid = 2026-07-15
  // MUST use the corrected v2 claim (240 lbs) and qualify the 245 lb traveler!
  const evalAtT2 = evaluateMachineEngine({
    engineId: "juneau-helicopter-tours",
    inputs: traveler245Input,
    mode: "expanded",
    evaluatedAt: "2026-06-20T12:00:00.000Z",
    validAt: "2026-07-15T12:00:00.000Z",
    knownAt: "2026-06-20T12:00:00.000Z",
    bypassCache: true,
  });
  assert.equal(evalAtT2.ok, true);
  if (!evalAtT2.ok) return;
  const respAfterCorrection = evalAtT2.response as ExpandedEvaluationResponse;
  assert.equal(
    respAfterCorrection.decisionState,
    "qualified_with_warnings",
    "At knownAt=2026-06-20, DCC knows the retroactive 240 lb v2 threshold, so 245 lbs triggers qualification warning",
  );
  assert.ok(
    respAfterCorrection.reasonCodes.includes(
      "WARN_FAA_250LB_SEAT_SURCHARGE_APPLIES",
    ),
  );
  assert.ok(
    respAfterCorrection.trace.resolvedClaimVersionIds.includes(
      "clmv:jnu:seat-weight-surcharge-threshold:v2",
    ),
  );

  // Step 4: Replay the historical receipt using its original bitemporal coordinates
  // (validAt = 2026-07-15, knownAt = 2026-05-01).
  // Even though v2 is valid_from 2026-01-01 in the world, DCC did NOT know v2 on 2026-05-01!
  const replayHistorical = evaluateMachineEngine({
    engineId: historicalReceipt.canonicalPayload.engineId,
    engineVersion: historicalReceipt.canonicalPayload.engineVersion,
    inputs: traveler245Input,
    mode: "expanded",
    evaluatedAt: "2026-05-01T12:00:00.000Z",
    validAt: historicalReceipt.canonicalPayload.validAt,
    knownAt: historicalReceipt.canonicalPayload.knownAt,
    bypassCache: true,
  });
  assert.equal(replayHistorical.ok, true);
  if (!replayHistorical.ok) return;
  const replayed = replayHistorical.response as ExpandedEvaluationResponse;

  assert.equal(
    replayed.decisionState,
    "recommended",
    "Historical replay at knownAt=2026-05-01 must NOT be rewritten by the 2026-06-15 retroactive correction",
  );
  assert.equal(
    replayed.evaluationFingerprint,
    historicalReceipt.canonicalPayload.evaluationFingerprint,
  );
  assert.equal(replayed.resultHash, historicalReceipt.canonicalPayload.resultHash);
  assert.equal(replayed.traceHash, historicalReceipt.canonicalPayload.traceHash);
  assert.equal(replayed.receiptId, historicalReceipt.receiptId);
  assert.deepEqual(
    replayed.trace.resolvedClaimVersionIds,
    historicalReceipt.canonicalPayload.resolvedClaimVersionIds,
  );

  // Step 5: Also test validAt sensitivity when knownAt is after v2 (e.g. non-retroactive tariff change)
  resetMachineStoreForTests();
  supersedeMachineClaim({
    claimId,
    newTypedValue: { type: "number", value: 240 },
    newValidFrom: "2026-08-01T00:00:00.000Z", // Effective Aug 1, 2026
    newValidTo: "2027-12-31T23:59:59.000Z",
    reason: "Late-summer tariff change effective Aug 1, 2026",
    issuedBy: "dcc-epistemic-auditor",
    occurredAt: "2026-06-01T00:00:00.000Z",
  });

  // At knownAt = 2026-06-15, evaluating for validAt = 2026-07-15 (before Aug 1) uses v1 (250 lbs -> recommended)
  const evalJulyTrip = evaluateMachineEngine({
    engineId: "juneau-helicopter-tours",
    inputs: traveler245Input,
    mode: "expanded",
    validAt: "2026-07-15T12:00:00.000Z",
    knownAt: "2026-06-15T12:00:00.000Z",
    bypassCache: true,
  });
  assert.equal(evalJulyTrip.ok, true);
  if (evalJulyTrip.ok) {
    assert.equal(evalJulyTrip.response.decisionState, "recommended");
  }

  // At the same knownAt = 2026-06-15, evaluating for validAt = 2026-08-15 (after Aug 1) uses v2 (240 lbs -> qualified_with_warnings)
  const evalAugustTrip = evaluateMachineEngine({
    engineId: "juneau-helicopter-tours",
    inputs: traveler245Input,
    mode: "expanded",
    validAt: "2026-08-15T12:00:00.000Z",
    knownAt: "2026-06-15T12:00:00.000Z",
    bypassCache: true,
  });
  assert.equal(evalAugustTrip.ok, true);
  if (evalAugustTrip.ok) {
    assert.equal(evalAugustTrip.response.decisionState, "qualified_with_warnings");
  }

  resetMachineStoreForTests();
});

test("v0.2 Gate 5 (Signed Decision Receipts & Key Rotation): Ed25519 asymmetric signing, /.well-known/dcc/keys.json discovery, key rotation, and key revocation", async () => {
  setDccMachineV1RuntimeOverride(true);
  resetSigningKeyStoreForTests();
  resetMachineStoreForTests();

  const evalRes = evaluateMachineEngine({
    engineId: "juneau-helicopter-tours",
    inputs: SAMPLE_JUNEAU_INPUT,
    mode: "expanded",
    evaluatedAt: "2026-04-12T12:00:00.000Z",
  });
  assert.equal(evalRes.ok, true);
  if (!evalRes.ok) return;

  const receipt = evalRes.response.receipt as SignedDecisionReceipt;
  assert.ok(receipt);
  const schemaCheck = validateAgainstJsonSchema(receipt, SIGNED_RECEIPT_JSON_SCHEMA);
  assert.equal(
    schemaCheck.valid,
    true,
    `SignedDecisionReceipt failed schema validation: ${schemaCheck.errors.join(", ")}`,
  );

  // Verify via public key discovery route /.well-known/dcc/keys.json
  const keysRes = await getPublicKeysRoute();
  assert.equal(keysRes.status, 200);
  const keysBody = (await keysRes.json()) as ReturnType<
    typeof getPublicSigningKeyManifest
  >;
  assert.equal(keysBody.activeKeyId, receipt.keyId);
  assert.ok(keysBody.keys.some((k) => k.keyId === receipt.keyId));

  // Verify via GET /api/v1/receipts/{id}
  const rcptRes = await getReceiptRoute(
    new Request(`https://www.destinationcommandcenter.com/api/v1/receipts/${receipt.receiptId}`),
    { params: Promise.resolve({ id: receipt.receiptId }) },
  );
  assert.equal(rcptRes.status, 200);
  const rcptBody = (await rcptRes.json()) as {
    ok: boolean;
    receipt: SignedDecisionReceipt;
    signatureVerification: { valid: boolean };
  };
  assert.equal(rcptBody.ok, true);
  assert.equal(rcptBody.signatureVerification.valid, true);

  // Test Key Rotation: rotate to a new active key; old key becomes retired_verify_only and still verifies historical receipts
  const newKey = registerSigningKeyForTests({
    keyId: "dcc-ed25519-rotated-2026-q3",
    seedString: "dcc-test-rotated-key-seed-2026-q3",
    status: "active",
    setAsActive: false,
  });
  rotateSigningKey(newKey.keyId);

  const verifyOldAfterRotation = verifyDecisionReceiptSignature(receipt);
  assert.equal(
    verifyOldAfterRotation.valid,
    true,
    "Historical receipt signed by retired_verify_only key must remain verifiable",
  );
  assert.equal(verifyOldAfterRotation.keyStatus, "retired_verify_only");

  // New receipt uses the rotated key
  const newReceipt = signDecisionReceipt(receipt.canonicalPayload);
  assert.equal(newReceipt.keyId, "dcc-ed25519-rotated-2026-q3");
  assert.equal(verifyDecisionReceiptSignature(newReceipt).valid, true);

  // Revoking a key causes verification of receipts signed by that revoked key to fail closed
  revokeSigningKey(receipt.keyId);
  const verifyAfterRevoke = verifyDecisionReceiptSignature(receipt);
  assert.equal(verifyAfterRevoke.valid, false);
  assert.match(verifyAfterRevoke.reason ?? "", /revoked/i);

  // Tampering with canonicalPayload causes verification to fail
  const tamperedReceipt: SignedDecisionReceipt = {
    ...newReceipt,
    canonicalPayload: {
      ...newReceipt.canonicalPayload,
      recommendedCandidateId: "tampered-candidate-id",
    },
  };
  assert.equal(verifyDecisionReceiptSignature(tamperedReceipt).valid, false);

  resetSigningKeyStoreForTests();
  resetMachineStoreForTests();
});

test("v0.2 Gate 6 (Real Source-to-Decision Lifecycle): Full 11-step Juneau lifecycle from HTTPS ingest to quarantine, approval, claim publication, compilation, evaluation, supersession, withdrawal, and historical replay", async () => {
  resetSigningKeyStoreForTests();
  resetMachineStoreForTests();

  // Provide a deterministic HTTPS response representing FAA WeatherCams Juneau portal so tests run hermetically offline or online
  const mockAuthoritativeHttpsFetch: typeof fetch = async (input) => {
    const urlStr = String(input);
    return new Response(
      `<!DOCTYPE html><html><head><title>FAA Aviation Weather Cameras - Juneau AK (PAJN)</title></head><body><h1>Juneau Gastineau Channel &amp; Mendenhall Glacier Camera Station Operational</h1><p>Status: ACTIVE_OPERATIONAL_VFR_TELEMETRY</p><p>Source: ${urlStr}</p></body></html>`,
      {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
        },
      },
    );
  };

  const report = await runRealJuneauSourceToDecisionLifecycle({
    url: "https://weathercams.faa.gov/",
    fetchImpl: mockAuthoritativeHttpsFetch,
    verifyDnsResolution: false,
  });

  assert.equal(report.ok, true);
  assert.equal(report.snapshot.provenanceOrigin, "live_authoritative_capture");
  assert.equal(report.quarantinedStage.status, "quarantined_unverified");
  assert.equal(report.quarantinedStage.activeInDecisionGraph, false);
  assert.equal(report.promotedStage.status, "verified_promoted");
  assert.equal(report.promotedStage.activeInDecisionGraph, true);
  assert.equal(
    report.publishedClaimVersion.provenanceOrigin,
    "live_authoritative_capture",
  );
  assert.equal(report.evaluationBeforeLifecycleChange.decisionState, "recommended");
  assert.equal(report.evaluationBeforeLifecycleChange.receiptSignatureValid, true);
  assert.notEqual(
    report.withdrawalStep.evaluationAfterWithdrawalState,
    "recommended",
    "Withdrawing the live-captured claim must prevent an unqualified recommended state",
  );
  assert.ok(
    report.withdrawalStep.withdrawnClaimVersionIds.includes(
      report.supersessionStep.newVersionId,
    ),
  );
  assert.equal(
    report.historicalResolvabilityAndBitemporalReplay.originalReceiptResolvable,
    true,
  );
  assert.equal(
    report.historicalResolvabilityAndBitemporalReplay.historicalClaimV1Resolvable,
    true,
  );
  assert.equal(
    report.historicalResolvabilityAndBitemporalReplay.historicalSnapshotResolvable,
    true,
  );
  assert.equal(
    report.historicalResolvabilityAndBitemporalReplay.bitemporalReplayMatchesOriginalHash,
    true,
  );

  // Verify curated seed claims carry provenanceOrigin: "curated_seed_fixture" while live claim carries "live_authoritative_capture"
  const seedClaimRef = resolveMachineReference("clmv:jnu:seat-weight-surcharge-threshold:v1");
  const liveClaimRef = resolveMachineReference(report.publishedClaimVersion.versionId);
  assert.equal(
    (seedClaimRef?.envelope.payload as Record<string, unknown>)?.provenanceOrigin,
    "curated_seed_fixture",
  );
  assert.equal(
    (liveClaimRef?.envelope.payload as Record<string, unknown>)?.provenanceOrigin,
    "live_authoritative_capture",
  );

  resetMachineStoreForTests();
});

test("v0.2 Gate 7 (Standalone Black-Box Verification Client): Verifies Juneau and Hawaii starting solely from /.well-known/dcc with zero internal imports", async () => {
  setDccMachineV1RuntimeOverride(true);
  resetSigningKeyStoreForTests();
  resetMachineStoreForTests();
  resetMachineSecurityLimitsForTests();

  // Route black-box client HTTP requests directly to our Next.js App Router handlers
  const inProcessFetch: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    const req = new Request(url.toString(), init);

    if (url.pathname === "/.well-known/dcc") {
      return getWellKnownDcc();
    }
    if (url.pathname === "/.well-known/dcc/keys.json") {
      return getPublicKeysRoute();
    }
    if (url.pathname === "/api/v1/evaluate" && req.method === "POST") {
      return postEvaluateRoute(req);
    }
    if (url.pathname.startsWith("/api/v1/universes/")) {
      const id = decodeURIComponent(url.pathname.replace("/api/v1/universes/", ""));
      return getUniverseRoute(req, { params: Promise.resolve({ id }) });
    }
    if (url.pathname.startsWith("/api/v1/receipts/")) {
      const id = decodeURIComponent(url.pathname.replace("/api/v1/receipts/", ""));
      return getReceiptRoute(req, { params: Promise.resolve({ id }) });
    }
    if (url.pathname.startsWith("/r/")) {
      const rest = url.pathname.slice(3);
      const vSplit = rest.split("/v/");
      if (vSplit.length === 2) {
        return getImmutableReferenceRoute(req, {
          params: Promise.resolve({
            id: decodeURIComponent(vSplit[0]),
            version: decodeURIComponent(vSplit[1]),
          }),
        });
      }
      return getStableReferenceRoute(req, {
        params: Promise.resolve({ id: decodeURIComponent(rest) }),
      });
    }
    throw new Error(`Unhandled path in black-box test router: ${url.pathname}`);
  };

  const report = await runBlackBoxCanaryVerification({
    baseUrl: "https://www.destinationcommandcenter.com",
    fetchImpl: inProcessFetch,
  });

  assert.equal(report.ok, true);
  assert.equal(report.juneauVerification.ed25519SignatureVerified, true);
  assert.equal(report.juneauVerification.candidateUniverseVerified, true);
  assert.equal(report.juneauVerification.runIdsAreUniqueAcrossCalls, true);
  assert.equal(report.juneauVerification.immutableCacheControlVerified, true);
  assert.equal(report.juneauVerification.etagConditional304Verified, true);
  assert.equal(report.juneauVerification.replayMatchesDeterministically, true);

  assert.equal(report.hawaiiVerification.ed25519SignatureVerified, true);
  assert.equal(report.hawaiiVerification.candidateUniverseVerified, true);
  assert.equal(report.hawaiiVerification.runIdsAreUniqueAcrossCalls, true);
  assert.equal(report.hawaiiVerification.replayMatchesDeterministically, true);
});

test("v0.2 Gate 8 (Security Limits, DNS Rebinding Defense, Rate Limiting, API Scopes, and 3-Part Varied Benchmarks)", async () => {
  setDccMachineV1RuntimeOverride(true);
  resetMachineSecurityLimitsForTests();
  resetMachineStoreForTests();

  // 1. Request size limit (> 64 KB blocked with 413)
  const oversizedBody = "x".repeat(70 * 1024);
  assert.throws(
    () => enforceEvaluationRequestSizeLimit(oversizedBody),
    (err: unknown) =>
      err instanceof MachineSecurityLimitError &&
      err.code === "REQUEST_PAYLOAD_TOO_LARGE" &&
      err.statusCode === 413,
  );

  // 2. Candidate count & rule count limits blocked in compiler
  assert.throws(
    () => enforceCompilerResourceLimits({ candidateCount: 501, ruleCount: 10 }),
    (err: unknown) =>
      err instanceof MachineSecurityLimitError &&
      err.code === "CANDIDATE_COUNT_LIMIT_EXCEEDED",
  );
  assert.throws(
    () => enforceCompilerResourceLimits({ candidateCount: 10, ruleCount: 251 }),
    (err: unknown) =>
      err instanceof MachineSecurityLimitError &&
      err.code === "RULE_COUNT_LIMIT_EXCEEDED",
  );

  // 3. Batch item count limit
  assert.throws(
    () => enforceBatchItemCountLimit(new Array(251).fill({})),
    (err: unknown) =>
      err instanceof MachineSecurityLimitError &&
      err.code === "BATCH_SIZE_EXCEEDED",
  );

  // 4. API key scope enforcement when DCC_MACHINE_REQUIRE_EVAL_API_KEY=1
  const prevRequireKey = process.env.DCC_MACHINE_REQUIRE_EVAL_API_KEY;
  const prevKeys = process.env.DCC_MACHINE_API_KEYS_JSON;
  try {
    process.env.DCC_MACHINE_REQUIRE_EVAL_API_KEY = "1";
    process.env.DCC_MACHINE_API_KEYS_JSON = JSON.stringify({
      "dcc-key-single-only": ["evaluate:single"],
    });

    // Missing API key -> 401
    const unauthReq = new Request("https://www.destinationcommandcenter.com/api/v1/evaluate", {
      method: "POST",
      body: JSON.stringify({ engineId: "juneau-helicopter-tours", inputs: SAMPLE_JUNEAU_INPUT }),
    });
    const unauthRes = await postEvaluateRoute(unauthReq);
    assert.equal(unauthRes.status, 401);

    // Valid key for single evaluate -> 200
    const authSingleReq = new Request("https://www.destinationcommandcenter.com/api/v1/evaluate", {
      method: "POST",
      headers: { "x-dcc-api-key": "dcc-key-single-only" },
      body: JSON.stringify({ engineId: "juneau-helicopter-tours", inputs: SAMPLE_JUNEAU_INPUT }),
    });
    const authSingleRes = await postEvaluateRoute(authSingleReq);
    assert.equal(authSingleRes.status, 200);

    // Key lacking evaluate:batch scope -> 403 on batch endpoint
    const forbiddenBatchReq = new Request(
      "https://www.destinationcommandcenter.com/api/v1/evaluations:batch",
      {
        method: "POST",
        headers: { "x-dcc-api-key": "dcc-key-single-only" },
        body: JSON.stringify({
          items: [{ engineId: "juneau-helicopter-tours", inputs: SAMPLE_JUNEAU_INPUT }],
        }),
      },
    );
    const forbiddenBatchRes = await postBatchEvaluateRoute(forbiddenBatchReq);
    assert.equal(forbiddenBatchRes.status, 403);

    // Meanwhile, public citation/reference endpoints remain publicly accessible without an API key!
    const publicRefRes = await getStableReferenceRoute(
      new Request("https://www.destinationcommandcenter.com/r/clm:jnu:seat-weight-surcharge-threshold"),
      { params: Promise.resolve({ id: "clm:jnu:seat-weight-surcharge-threshold" }) },
    );
    assert.equal(publicRefRes.status, 200);
  } finally {
    if (prevRequireKey === undefined) delete process.env.DCC_MACHINE_REQUIRE_EVAL_API_KEY;
    else process.env.DCC_MACHINE_REQUIRE_EVAL_API_KEY = prevRequireKey;
    if (prevKeys === undefined) delete process.env.DCC_MACHINE_API_KEYS_JSON;
    else process.env.DCC_MACHINE_API_KEYS_JSON = prevKeys;
  }

  // 5. DNS-resolution and DNS-rebinding defense in ingestion
  await assert.rejects(
    async () =>
      resolveAndValidateDnsAgainstRebinding(
        "https://evil-rebinding.example.com/tariff.json",
        async () => [{ address: "169.254.169.254", family: 4 }],
      ),
    (err: unknown) =>
      err instanceof SsrfProtectionError &&
      err.code === "DNS_REBINDING_PRIVATE_IPV4_BLOCKED",
  );

  await assert.rejects(
    async () =>
      resolveAndValidateDnsAgainstRebinding(
        "https://evil-ipv6-rebinding.example.com/tariff.json",
        async () => [{ address: "fe80::1", family: 6 }],
      ),
    (err: unknown) =>
      err instanceof SsrfProtectionError &&
      err.code === "DNS_REBINDING_PRIVATE_IPV6_BLOCKED",
  );

  // 6. Compressed-response / streaming byte-ceiling enforcement (blocks oversized response even when Content-Length header lies!)
  await assert.rejects(
    async () =>
      ingestSourceArtifactSafely("https://example.com/zip-bomb.json", {
        maxBytes: 1024,
        verifyDnsResolution: false,
        fetchImpl: async () =>
          new Response("A".repeat(4096), {
            status: 200,
            headers: {
              "content-type": "application/json",
              "content-length": "100", // Lying Content-Length header!
            },
          }),
      }),
    (err: unknown) =>
      err instanceof SsrfProtectionError && err.code === "PAYLOAD_TOO_LARGE",
  );

  // 7. Three-part v0.2 benchmark report using varied inputs
  const benchReport = await runDccV02ThreePartBenchmarks();
  assert.equal(benchReport.benchmarkSpec, "dcc-machine-benchmark/0.2");
  assert.equal(benchReport.uncachedEvaluatorExecution.distinctInputCount, 50);
  assert.equal(benchReport.cacheHitRetrieval.distinctInputCount, 50);
  assert.equal(benchReport.fullHttpAndDurableStorageExecution.distinctInputCount, 25);
  assert.ok(benchReport.uncachedEvaluatorExecution.p50Ms >= 0);
  assert.ok(benchReport.cacheHitRetrieval.p50Ms >= 0);
  assert.ok(benchReport.fullHttpAndDurableStorageExecution.p50Ms > 0);
});
