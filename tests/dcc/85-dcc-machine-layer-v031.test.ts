import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { PutObjectCommand, type S3Client } from "@aws-sdk/client-s3";

import {
  CloudflareR2BucketLockManager,
  CloudflareR2PrivateArtifactStore,
  evaluateSourceHierarchyOverridePolicy,
  getDeploymentProvenanceV03,
  getStandardJwksDocumentAsync,
  independentJcsReferenceCanonicalize,
  R2_PREFIX_RETENTION_POLICIES,
  resetLocalRateLimitBucketsForTest,
  resetV03RuntimeStore,
  resetV03SigningKeyRegistry,
  revokeV03SigningKey,
  rfc8785Canonicalize,
  Rfc8785NonIJsonError,
  runGenuineJuneauOperationalPackV031,
  runGoSnoShadowAuthorizationProof,
  setDccMachineV1RuntimeOverride,
  sha256HexFull,
  V031_ENDPOINT_SURFACE_MATRIX,
  V031_SOURCE_HIERARCHY,
  verifyRfc8785ConformanceVectors,
  verifyShadowDecisionAuthorizationJws,
} from "../../lib/dcc/machine";
import {
  independentJcsStackCanonicalize,
  runBlackBoxCanaryVerificationV03,
  runIndependentTenNegativeTamperingTests,
} from "../../scripts/dcc/blackbox-verify-canary-v03";

import { GET as getWellKnownDcc } from "../../app/.well-known/dcc/route";
import { GET as getApiCatalogRoute } from "../../app/.well-known/api-catalog/route";
import { GET as getJwksRoute } from "../../app/.well-known/jwks.json/route";
import { GET as getMcpDiscoveryRoute } from "../../app/.well-known/mcp.json/route";
import { GET as getMcpGetRoute, POST as postMcpRoute } from "../../app/api/v1/mcp/route";
import { GET as getConformanceFixturesRoute } from "../../app/api/v1/conformance/fixtures/route";
import { GET as getProvenanceRoute } from "../../app/api/v1/provenance/route";
import { GET as getReceiptVerificationDocsRoute } from "../../app/api/v1/docs/receipt-verification/route";
import { GET as getCitationVerificationDocsRoute } from "../../app/api/v1/docs/citation-verification/route";
import { POST as postV03EvaluateRoute } from "../../app/api/v1/v03/evaluate/route";
import { POST as postAuthorizationsRoute } from "../../app/api/v1/authorizations/route";
import { GET as getReceiptRoute } from "../../app/api/v1/receipts/[id]/route";
import { POST as postReceiptReplayRoute } from "../../app/api/v1/receipts/[id]/replay/route";
import { GET as getUniverseRoute } from "../../app/api/v1/universes/[id]/route";
import { GET as getStableReferenceRoute } from "../../app/r/[id]/route";
import { GET as getImmutableReferenceRoute } from "../../app/r/[id]/v/[version]/route";

test("v0.3.1 Gate 1: Cloudflare R2 Native Bucket Lock Configuration & Zero AWS S3 Object-Lock Headers", async () => {
  // 1. Verify storageBoundary.ts source contains zero reliance on AWS S3 Object Lock headers
  const storageBoundarySource = fs.readFileSync(
    path.resolve(process.cwd(), "lib/dcc/machine/v03/storageBoundary.ts"),
    "utf8",
  );
  assert.equal(storageBoundarySource.includes("x-amz-object-lock-mode"), false);
  assert.equal(storageBoundarySource.includes("x-amz-object-lock-retain-until-date"), false);
  assert.equal(storageBoundarySource.includes("x-amz-bucket-object-lock-enabled"), false);

  // 2. Verify prefix-specific retention policies never lock the entire bucket or raw captures indefinitely
  const policyList = Object.values(R2_PREFIX_RETENTION_POLICIES);
  assert.ok(policyList.length >= 6);
  assert.equal(
    policyList.every((p) => !p.indefiniteLock && !p.wholeBucketLock),
    true,
  );

  const rawPolicy = R2_PREFIX_RETENTION_POLICIES.raw_source_captures;
  assert.ok(rawPolicy);
  assert.equal(rawPolicy.lockEnabled, false);
  assert.equal(rawPolicy.indefiniteLock, false);
  assert.equal(rawPolicy.allowsLegalOrPrivacyTakedown, true);

  const canaryPolicy = R2_PREFIX_RETENTION_POLICIES.canary_retention_test;
  assert.ok(canaryPolicy);
  assert.equal(canaryPolicy.lockEnabled, true);
  assert.equal(canaryPolicy.lockDurationSeconds, 86_400);

  const lockPayload = CloudflareR2BucketLockManager.buildCloudflareBucketLockPayload({
    canaryOnly: false,
  });
  assert.equal(
    lockPayload.rules.every((r) => r.prefix.length > 0 && r.prefix !== "/"),
    true,
  );
  assert.equal(
    lockPayload.rules.some((r) => r.prefix.startsWith("v03/raw_source_captures")),
    false,
  );

  // 3. Verify PutObjectCommand sends IfNoneMatch: "*" and ChecksumAlgorithm: "SHA256" without any S3 Object Lock fields
  const sentCommands: unknown[] = [];
  const sampleText = "canary-r2-native-lock-test";
  let headCalls = 0;
  const mockS3 = {
    send: async (cmd: unknown) => {
      sentCommands.push(cmd);
      const cmdName = (cmd as { constructor?: { name?: string } })?.constructor?.name;
      if (cmdName === "HeadObjectCommand") {
        headCalls++;
        if (headCalls === 1) {
          throw Object.assign(new Error("NotFound"), { name: "NotFound" });
        }
      }
      return {
        Metadata: { "x-dcc-sha256": sha256HexFull(sampleText) },
      };
    },
  } as unknown as S3Client;

  const store = new CloudflareR2PrivateArtifactStore({
    bucketName: "dcc-private-evidence-v03",
    readerClient: mockS3,
    writerClient: mockS3,
  });

  const written = await store.putContentAddressedArtifact({
    category: "canary_retention_test",
    body: sampleText,
    contentType: "text/plain",
    extension: "txt",
  });
  assert.equal(written.conditionalCreateApplied, true);
  assert.equal(written.retentionMode, "cloudflare_r2_prefix_finite_lock");
  const putCmd = sentCommands.find(
    (c) =>
      c instanceof PutObjectCommand ||
      (c as { constructor?: { name?: string } })?.constructor?.name === "PutObjectCommand" ||
      Boolean((c as { input?: { IfNoneMatch?: string } })?.input?.IfNoneMatch),
  ) as PutObjectCommand;
  assert.ok(putCmd);
  assert.equal(putCmd.input.IfNoneMatch, "*");
  assert.equal(putCmd.input.ChecksumAlgorithm, "SHA256");
  assert.equal("ObjectLockMode" in putCmd.input, false);
  assert.equal("ObjectLockRetainUntilDate" in putCmd.input, false);
});

test("v0.3.1 Gate 2: Strict RFC 8785 I-JSON Conformance, Non-JSON Fail-Closed Rejections, Differential JCS, and Fuzz Suite", () => {
  const report = verifyRfc8785ConformanceVectors();
  assert.equal(report.passed, true);
  assert.equal(
    report.nonJsonRejections.every((r) => r.rejectedBeforeSigning),
    true,
  );
  assert.ok(report.nonJsonRejectionVectorsTested >= 13);
  assert.equal(report.differentialFuzzIterations, 100);

  // Explicitly verify undefined in object, undefined in array, and lone surrogates throw Rfc8785NonIJsonError
  assert.throws(
    () => rfc8785Canonicalize({ valid: 1, bad: undefined }),
    (err: unknown) =>
      err instanceof Rfc8785NonIJsonError &&
      err.code === "RFC8785_NON_IJSON_INPUT_REJECTED",
  );
  assert.throws(
    () => rfc8785Canonicalize([1, undefined, 3]),
    (err: unknown) =>
      err instanceof Rfc8785NonIJsonError &&
      err.code === "RFC8785_NON_IJSON_INPUT_REJECTED",
  );
  assert.throws(
    () => rfc8785Canonicalize({ text: "bad\uD800surrogate" }),
    (err: unknown) =>
      err instanceof Rfc8785NonIJsonError &&
      err.code === "RFC8785_NON_IJSON_INPUT_REJECTED",
  );

  // Differential check across all 3 independent canonicalizers:
  // 1) rfc8785Canonicalize (DCC production)
  // 2) independentJcsReferenceCanonicalize (v0.3.1 reference)
  // 3) independentJcsStackCanonicalize (black-box iterative stack canonicalizer)
  const sample = {
    z: [1, -0, true, null, { b: "hello\nworld", a: 1e-6 }],
    a: "alpha",
    "\u0080": "latin1",
  };
  const c1 = rfc8785Canonicalize(sample);
  const c2 = independentJcsReferenceCanonicalize(sample);
  const c3 = independentJcsStackCanonicalize(sample);
  assert.equal(c1, c2);
  assert.equal(c1, c3);
});

test("v0.3.1 Gate 3: Vercel KMS ES256 Managed Keys, Pre/Post Rotation JWKS Verification, and 10 Negative Tampering Cases", async () => {
  resetV03SigningKeyRegistry();
  const jwks = await getStandardJwksDocumentAsync();

  // Verify both the retired verify-only pre-rotation key and the active post-rotation ES256 key from Vercel KMS issuer 72fe64f5-071f-46c6-b711-ccfcc9b0a34c are present
  const kmsPreKey = jwks.keys.find(
    (k) => k.kid === "01bc7d34-8b1b-4337-8686-6488b7d1eb1b",
  );
  const kmsPostKey = jwks.keys.find(
    (k) => k.kid === "a6804c90-3dbc-4fcb-82fd-8cbfa3313a13",
  );
  assert.ok(kmsPreKey, "Pre-rotation KMS ES256 key must be in JWKS");
  assert.equal(kmsPreKey.alg, "ES256");
  assert.equal(kmsPreKey.kty, "EC");
  assert.equal(kmsPreKey.crv, "P-256");
  assert.equal(kmsPreKey.status, "retired_verify_only");

  assert.ok(kmsPostKey, "Post-rotation active KMS ES256 key must be in JWKS");
  assert.equal(kmsPostKey.alg, "ES256");
  assert.equal(kmsPostKey.kty, "EC");
  assert.equal(kmsPostKey.crv, "P-256");
  assert.equal(kmsPostKey.status, "active");

  const gosnoProof = await runGoSnoShadowAuthorizationProof();
  const negSuite = await runIndependentTenNegativeTamperingTests({
    receiptJwsCompact: gosnoProof.decisionEvaluation.receipt.jwsCompact,
    receiptObject: gosnoProof.decisionEvaluation.receipt as unknown as Record<string, unknown>,
    authorizationJwsCompact: gosnoProof.signedAuthorization.jwsCompact,
    jwksKeys: jwks.keys as unknown as Array<Record<string, unknown>>,
    expectedInputs: {
      corridorRouteId: "den-winter-park",
      passengerCount: 4,
      skiOrSnowboardCount: 4,
      checkedLuggageCount: 4,
      serviceType: "private",
      maxTotalVehiclePriceUsd: 650,
    },
  });
  assert.equal(negSuite.allTenFailedClosed, true);
  assert.equal(negSuite.allRejectionCasesFailedClosed, true);
  assert.equal(negSuite.cases.length, 15);
  const caseNames = new Set(negSuite.cases.map((c) => c.caseName));
  assert.equal(caseNames.has("wrong_issuer"), true);
  assert.equal(caseNames.has("wrong_environment"), true);
  assert.equal(caseNames.has("modified_inputs"), true);
  assert.equal(caseNames.has("modified_evidence_references"), true);
  assert.equal(caseNames.has("modified_dispositions"), true);
});

test("v0.3.1 Gate 4: Genuine Juneau Operational Decision Pack (Eligible, Qualified, Ineligible, Indeterminate, Source Hierarchy Override Block, Zero WTA)", async () => {
  resetV03SigningKeyRegistry();
  const juneauPack = await runGenuineJuneauOperationalPackV031();

  assert.equal(juneauPack.packVersion, "0.3.1");
  assert.ok(juneauPack.ingestedSourceCount >= 6);
  assert.equal(juneauPack.liveExternalCallsOnEvaluationHotPath, 0);
  assert.equal(juneauPack.wtaCandidatesIncluded, 0);

  // Verify preserved raw HTTP capture bytes and separately stored derived plain text
  assert.equal(
    juneauPack.ingestedEvidenceReferences.every(
      (ref) =>
        ref.rawBytesPreservedInPrivateStore &&
        ref.derivedTextStoredSeparately &&
        ref.extractorVersion === "dcc-html-text-extractor-v031.1" &&
        ref.sourcePublishedAt === null &&
        ref.provenanceClass === "network_capture_verified",
    ),
    true,
  );

  // Verify eligible, qualified, and ineligible dispositions in mixedDispositionEvaluation
  const dispositionsByCode = new Map(
    juneauPack.mixedDispositionEvaluation.dispositions.map((d) => [
      d.legacyCandidateCode,
      d.disposition,
    ]),
  );
  assert.equal(dispositionsByCode.get("jnu-heli-coastal-icefield"), "eligible");
  assert.equal(dispositionsByCode.get("jnu-heli-temsco-mendenhall"), "qualified");
  assert.equal(dispositionsByCode.get("jnu-heli-northstar-trek"), "ineligible");

  // Verify indeterminate disposition when live departure confirmation is required
  assert.equal(
    juneauPack.liveConfirmationIndeterminateEvaluation.decisionState,
    "indeterminate_insufficient_evidence",
  );
  assert.equal(
    juneauPack.liveConfirmationIndeterminateEvaluation.dispositions.every(
      (d) => d.disposition === "indeterminate",
    ),
    true,
  );

  // Verify source hierarchy order and reseller override rejection
  assert.deepEqual(V031_SOURCE_HIERARCHY, [
    "operator_direct",
    "government_regulatory",
    "authorized_distributor",
    "reseller",
    "secondary_editorial",
  ]);
  assert.equal(juneauPack.resellerConflictProof.overrodeExistingClaim, false);
  assert.equal(juneauPack.resellerConflictProof.conflictRecorded, true);
  assert.equal(
    juneauPack.resellerConflictProof.conflictEventType,
    "reseller_conflict_recorded",
  );
  assert.equal(juneauPack.resellerConflictProof.isSyntheticFixture, true);

  const policyCheck = evaluateSourceHierarchyOverridePolicy({
    existingClaimTier: "operator_direct",
    existingAssertionType: "policy",
    incomingClaimTier: "reseller",
    incomingAssertionType: "policy",
  });
  assert.equal(policyCheck.overrideAllowed, false);
  assert.equal(policyCheck.requiresExplicitConflictRecord, true);
});

test("v0.3.1 Gate 5: Genuine GoSno First-Party Shadow Proof (Real Published Facts, 5 Unknown Live Variables, Deployed Runtime Regressions, Zero Live Side Effects)", async () => {
  resetV03SigningKeyRegistry();
  resetV03RuntimeStore();
  const gosno = await runGoSnoShadowAuthorizationProof();

  assert.equal(gosno.independentAuthorizationVerification.valid, true);
  assert.equal(gosno.unknownLiveConditions.length, 5);
  assert.equal(
    gosno.unknownLiveConditions.every((c) => c.epistemicState === "unknown"),
    true,
  );

  // Verify GoSno proof uses the ordinary deployed runtime store and passes all 3 regressions
  assert.equal(gosno.deployedRuntimeRegressions.usesOrdinaryDeployedRuntimeStore, true);
  assert.equal(
    gosno.deployedRuntimeRegressions.sharedShuttleExcludedAndWithdrawn
      .withdrawnSharedShuttleExcludedFromUniverse,
    true,
  );
  assert.equal(
    gosno.deployedRuntimeRegressions.sharedShuttleExcludedAndWithdrawn
      .sharedShuttleRequestDecisionState,
    "no_viable_candidates",
  );
  assert.equal(
    gosno.deployedRuntimeRegressions.sixPassengersWithSixSnowboardsEscalatesSuvToVan
      .suvDisposition,
    "indeterminate",
  );
  assert.equal(
    gosno.deployedRuntimeRegressions.sixPassengersWithSixSnowboardsEscalatesSuvToVan
      .vanDisposition,
    "qualified",
  );
  assert.equal(
    gosno.deployedRuntimeRegressions.sixPassengersWithSixSnowboardsEscalatesSuvToVan
      .recommendedCandidateLegacyCode,
    "gosno-denver-breckenridge-private-van",
  );
  assert.equal(
    gosno.deployedRuntimeRegressions.groupAboveTenPassengersRejected.decisionState,
    "no_viable_candidates",
  );
  assert.equal(
    gosno.deployedRuntimeRegressions.groupAboveTenPassengersRejected.allCandidatesIneligible,
    true,
  );

  assert.equal(gosno.squareShadowResult.liveNetworkCallMade, false);
  assert.equal(gosno.squareShadowResult.bookingSubmitted, false);
  assert.equal(gosno.octoShadowResult.liveNetworkCallMade, false);
  assert.equal(gosno.octoShadowResult.bookingSubmitted, false);
  assert.equal(
    gosno.ledgerShadowOutcomeEvent.eventType,
    "shadow_authorization_dry_run_recorded",
  );

  // Verify expired authorization fails closed
  const expiredVer = await verifyShadowDecisionAuthorizationJws(
    gosno.signedAuthorization.jwsCompact,
    { nowIso: "2027-01-01T00:00:00.000Z" },
  );
  assert.equal(expiredVer.valid, false);
  assert.match(String(expiredVer.reason), /AUTHORIZATION_EXPIRED/);

  // Verify cross-environment authorization fails closed
  const crossEnvVer = await verifyShadowDecisionAuthorizationJws(
    gosno.signedAuthorization.jwsCompact,
    { expectedEnvironment: "production" },
  );
  assert.equal(crossEnvVer.valid, false);
  assert.match(String(crossEnvVer.reason), /ENVIRONMENT_MISMATCH/);

  // Verify revoked signing key fails closed
  revokeV03SigningKey({
    kid: gosno.signedAuthorization.kid,
    reason: "Test revocation of shadow authorization key",
  });
  const revokedVer = await verifyShadowDecisionAuthorizationJws(
    gosno.signedAuthorization.jwsCompact,
  );
  assert.equal(revokedVer.valid, false);
  resetV03SigningKeyRegistry();
});

test("v0.3.1 Gate 6: Provenance Contract, 6-Class Surface Matrix, MCP Parity, and Full Black-Box Verifier", async () => {
  setDccMachineV1RuntimeOverride(true);
  resetV03SigningKeyRegistry();
  resetV03RuntimeStore();
  resetLocalRateLimitBucketsForTest();

  // 1. Verify all 6 required surface classes exist in V031_ENDPOINT_SURFACE_MATRIX
  const classes = new Set(V031_ENDPOINT_SURFACE_MATRIX.map((e) => e.surfaceClass));
  assert.deepEqual(
    Array.from(classes).sort(),
    [
      "authenticated_evaluation",
      "privileged_authorization",
      "privileged_ingestion",
      "privileged_simulation",
      "public_discovery",
      "public_verification",
    ],
  );

  // 2. Verify /api/v1/provenance contract
  const prov = getDeploymentProvenanceV03();
  assert.ok(prov.gitCommit.length >= 7);
  assert.ok(prov.gitBranch.length >= 1);
  assert.ok(prov.buildId.length >= 1);
  assert.equal(prov.dependencyLockHash.length, 64);
  assert.equal(prov.schemaHash.length, 64);
  assert.equal(prov.compilerVersion, "dcc-ir-compiler/0.3.1");
  assert.ok(prov.runtimeVersion.startsWith("node/"));
  assert.ok(prov.deploymentEnvironment.length >= 1);
  assert.ok(prov.buildTime.length >= 20);

  // 3. Run full standalone black-box verifier in-process (including W3C SubtleCrypto JWS, MCP parity 403 checks, and 15 negative tampering cases)
  const inProcessFetch: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    const req = new Request(url.toString(), init);

    if (url.pathname === "/.well-known/dcc") return getWellKnownDcc();
    if (url.pathname === "/.well-known/api-catalog") return getApiCatalogRoute(req);
    if (url.pathname === "/.well-known/jwks.json") return getJwksRoute();
    if (url.pathname === "/.well-known/mcp.json") return getMcpDiscoveryRoute(req);
    if (url.pathname === "/api/v1/mcp") {
      return req.method === "POST" ? postMcpRoute(req) : getMcpGetRoute(req);
    }
    if (url.pathname === "/api/v1/conformance/fixtures") {
      return getConformanceFixturesRoute();
    }
    if (url.pathname === "/api/v1/provenance") return getProvenanceRoute();
    if (url.pathname === "/api/v1/docs/receipt-verification") {
      return getReceiptVerificationDocsRoute(req);
    }
    if (url.pathname === "/api/v1/docs/citation-verification") {
      return getCitationVerificationDocsRoute(req);
    }
    if (url.pathname === "/api/v1/v03/evaluate" && req.method === "POST") {
      return postV03EvaluateRoute(req);
    }
    if (url.pathname === "/api/v1/authorizations" && req.method === "POST") {
      return postAuthorizationsRoute(req);
    }
    if (url.pathname.startsWith("/api/v1/receipts/") && url.pathname.endsWith("/replay")) {
      const id = decodeURIComponent(
        url.pathname.slice("/api/v1/receipts/".length, -"/replay".length),
      );
      return postReceiptReplayRoute(req, { params: Promise.resolve({ id }) });
    }
    if (url.pathname.startsWith("/api/v1/receipts/")) {
      const id = decodeURIComponent(url.pathname.slice("/api/v1/receipts/".length));
      return getReceiptRoute(req, { params: Promise.resolve({ id }) });
    }
    if (url.pathname.startsWith("/api/v1/universes/")) {
      const id = decodeURIComponent(url.pathname.slice("/api/v1/universes/".length));
      return getUniverseRoute(req, { params: Promise.resolve({ id }) });
    }
    if (url.pathname.startsWith("/r/")) {
      const rest = url.pathname.slice(3);
      const vSplit = rest.split("/v/");
      if (vSplit.length === 2) {
        return getImmutableReferenceRoute(req, {
          params: Promise.resolve({
            id: decodeURIComponent(vSplit[0]!),
            version: decodeURIComponent(vSplit[1]!),
          }),
        });
      }
      return getStableReferenceRoute(req, {
        params: Promise.resolve({ id: decodeURIComponent(rest) }),
      });
    }
    throw new Error(`Unhandled route in v0.3.1 black-box router: ${url.pathname}`);
  };

  const bb = await runBlackBoxCanaryVerificationV03({
    baseUrl: "https://www.destinationcommandcenter.com",
    fetchImpl: inProcessFetch,
  });
  assert.equal(bb.ok, true);
  assert.equal(bb.temporalAndBoundaryChecks.mcpUnauthorizedSimulationRejectedWith403, true);
  assert.equal(
    bb.temporalAndBoundaryChecks.mcpUnauthorizedAuthorizationRejectedWith403,
    true,
  );
  assert.equal(bb.negativeTamperingSuite.allTenFailedClosed, true);
  assert.equal(bb.negativeTamperingSuite.cases.length, 15);
});

test("v0.3.1 Gate 7: Repair Verification — Withdrawn GoSno Seed Containment, Production Storage Gate, Deployed Juneau Weight Surcharge vs Absolute Restriction, and Fresh-Process Receipt Replay", async () => {
  setDccMachineV1RuntimeOverride(true);
  resetV03SigningKeyRegistry();
  resetV03RuntimeStore();

  // 1. Verify /r/evref%3Agosno%3Atariff-2026-winter-park is explicitly withdrawn and unverified
  const withdrawnReq = new Request(
    "https://www.destinationcommandcenter.com/r/evref%3Agosno%3Atariff-2026-winter-park",
    { headers: { Accept: "application/json" } },
  );
  const withdrawnRes = await getStableReferenceRoute(withdrawnReq, {
    params: Promise.resolve({ id: "evref:gosno:tariff-2026-winter-park" }),
  });
  assert.equal(withdrawnRes.status, 200);
  assert.equal(withdrawnRes.headers.get("Cache-Control"), "no-store");
  const withdrawnBody = (await withdrawnRes.json()) as Record<string, any>;
  assert.equal(withdrawnBody.objectType, "WithdrawnEvidenceReferenceProjection");
  assert.equal(withdrawnBody.verified, false);
  assert.equal(withdrawnBody.payload.withdrawn, true);
  assert.equal(withdrawnBody.payload.lifecycleState, "withdrawn");
  assert.ok(String(withdrawnBody.payload.withdrawalEventId).startsWith("kevt:"));

  // 2. Verify test-only storage backend cannot silently support production operational decisions when production gate is enforced
  const { handleV03EvaluateRequest, getV03RuntimeStore } = await import(
    "../../lib/dcc/machine"
  );
  const prodGateDenied = await handleV03EvaluateRequest({
    engineId: "denver-to-mountain-transportation",
    validAt: "2026-12-20T15:00:00.000Z",
    enforceProductionStorageGate: true,
    constraints: {
      corridorRouteId: "den-winter-park",
      passengerCount: 4,
      serviceType: "private",
    },
  });
  assert.equal(
    (prodGateDenied as any).decisionState,
    "indeterminate_insufficient_evidence",
  );
  assert.equal(
    (prodGateDenied as any).gateFailureCode,
    "PRODUCTION_PRIVATE_OBJECT_STORE_R2_UNAVAILABLE_TEST_ONLY_BACKEND_FORBIDDEN",
  );

  // 3. Verify deployed Juneau /api/v1/v03/evaluate distinguishes weight surcharge (qualified) from absolute restriction (ineligible)
  const juneau305Req = new Request(
    "https://www.destinationcommandcenter.com/api/v1/v03/evaluate",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        engineId: "juneau-helicopter-tours",
        validAt: "2026-07-15T12:00:00.000Z",
        constraints: {
          maxSinglePassengerWeightLbs: 305,
          maxBudgetPerPersonUsd: 700,
          youngestPassengerAgeYears: 6,
          travelingWithServiceAnimal: false,
        },
      }),
    },
  );
  const juneau305Res = await postV03EvaluateRoute(juneau305Req);
  const juneau305Body = (await juneau305Res.json()) as Record<string, any>;
  assert.equal(juneau305Body.ok, true);
  const disps305 = new Map(
    juneau305Body.evaluation.candidateDispositions.map((d: any) => [
      d.legacyCandidateCode,
      d.disposition,
    ]),
  );
  // Coastal (260/300 lb surcharge tiers) & TEMSCO (250 lb surcharge) are qualified, while NorthStar (absolute minimum age 8 yrs restriction) is ineligible
  assert.equal(disps305.get("jnu-heli-coastal-icefield"), "qualified");
  assert.equal(disps305.get("jnu-heli-mendenhall-landing"), "qualified");
  assert.equal(disps305.get("jnu-heli-northstar-trek"), "ineligible");

  // 4. Verify fresh-process / cleared-memory receipt retrieval and replay via durable ledger fallback
  const evalReceiptId = String(juneau305Body.evaluation.receiptId);
  const savedReceipt = juneau305Body.evaluation.receipt;
  const savedUniverse = getV03RuntimeStore().universesByHash.get(
    String(juneau305Body.evaluation.candidateUniverseHash),
  )!;
  const savedBundle = getV03RuntimeStore().bundlesByEngineAndVersion.get(
    "juneau-helicopter-tours@0.3.0",
  )!;

  // Simulate fresh serverless process with empty in-memory maps and a durable relational ledger fallback
  const store = getV03RuntimeStore();
  store.receiptsById.clear();
  assert.equal(store.receiptsById.has(evalReceiptId), false);
  store.neonLedgerStore = {
    readSignedReceiptFromNeon: async (id: string) =>
      id === evalReceiptId ? savedReceipt : null,
    readCandidateUniverseFromNeon: async (hash: string) =>
      hash === savedUniverse.universeHash ? savedUniverse : null,
    readEngineBundleFromNeon: async () => savedBundle,
  } as any;

  const getReceiptRes = await getReceiptRoute(
    new Request(
      `https://www.destinationcommandcenter.com/api/v1/receipts/${encodeURIComponent(evalReceiptId)}`,
    ),
    { params: Promise.resolve({ id: evalReceiptId }) },
  );
  assert.equal(getReceiptRes.status, 200);
  const getReceiptJson = (await getReceiptRes.json()) as Record<string, any>;
  assert.equal(getReceiptJson.receipt.receiptId, evalReceiptId);

  // Clear again and test POST /api/v1/receipts/[id]/replay recovering from Neon fallback
  store.receiptsById.clear();
  const replayRes = await postReceiptReplayRoute(
    new Request(
      `https://www.destinationcommandcenter.com/api/v1/receipts/${encodeURIComponent(evalReceiptId)}/replay`,
      { method: "POST", body: "{}" },
    ),
    { params: Promise.resolve({ id: evalReceiptId }) },
  );
  assert.equal(replayRes.status, 200);
  const replayJson = (await replayRes.json()) as Record<string, any>;
  assert.equal(replayJson.replay.matchesOriginalReceipt, true);
  assert.equal(replayJson.replay.replayedReceiptId, evalReceiptId);

  // 5. Verify database admission timestamps, unverified legacy recording time, and reload across restarts without cold-start reassignment
  const allEventsBeforeRestart = store.knowledgeLedger.getAllEvents();
  const legacySeedEv = allEventsBeforeRestart.find(
    (e) => e.claimVersionId === "clmv:gosno:max-pax-per-shuttle:v1",
  );
  assert.ok(legacySeedEv);
  assert.equal(legacySeedEv.recordedAt, null);
  assert.equal(legacySeedEv.recordedAtVerified, false);
  assert.equal(legacySeedEv.recordingTimeStatus, "unverified_legacy_recording_time");
  assert.equal(legacySeedEv.claimDefinition?.retrievedAt, null);
  assert.equal(legacySeedEv.claimDefinition?.sourceObservedAt, null);

  for (const ev of allEventsBeforeRestart) {
    if (ev.claimVersionId === "clmv:gosno:max-pax-per-shuttle:v1") continue;
    assert.ok(ev.recordedAt, `Admitted event ${ev.claimVersionId} must have a persisted recordedAt`);
    const recMs = Date.parse(ev.recordedAt);
    assert.equal(Number.isNaN(recMs), false);
    assert.equal(ev.recordedAtVerified, true);
    if (ev.claimDefinition && ev.claimDefinition.retrievedAt) {
      const retMs = Date.parse(ev.claimDefinition.retrievedAt);
      assert.equal(
        recMs >= retMs,
        true,
        `Event ${ev.claimVersionId} recordedAt (${ev.recordedAt}) must not precede retrievedAt (${ev.claimDefinition.retrievedAt})`,
      );
      for (const ref of ev.claimDefinition.evidenceRefs) {
        if (ref.retrievedAt) {
          assert.equal(
            recMs >= Date.parse(ref.retrievedAt),
            true,
            `Event ${ev.claimVersionId} recordedAt (${ev.recordedAt}) must not precede evidenceRef retrievedAt (${ref.retrievedAt})`,
          );
        }
      }
    }
  }
  const withdrawalEv = allEventsBeforeRestart.find(
    (e) => e.claimVersionId === "clmv:gosno:max-pax-per-shuttle:v2-withdrawn",
  );
  assert.ok(withdrawalEv);
  assert.equal(withdrawalEv.recordedAtVerified, true);
  assert.equal(withdrawalEv.recordingTimeStatus, "verified_database_admission");
  assert.ok(
    withdrawalEv.recordedAt &&
      Date.parse(withdrawalEv.recordedAt) > Date.parse("2026-10-26T21:03:06.120Z"),
  );

  // Simulate process restart (resetV03RuntimeStore) and verify identical recording timestamps reload without assigning new recording times on cold start
  const snapshotTimestampsBefore = allEventsBeforeRestart
    .filter((e) => !e.claimId.startsWith("shadow-outcome:"))
    .map((e) => ({
      eventId: e.eventId,
      eventHash: e.eventHash,
      recordedAt: e.recordedAt,
      recordingTimeStatus: e.recordingTimeStatus,
    }));
  resetV03RuntimeStore();
  const restartedStore = getV03RuntimeStore();
  const snapshotTimestampsAfter = restartedStore.knowledgeLedger
    .getAllEvents()
    .filter((e) => !e.claimId.startsWith("shadow-outcome:"))
    .map((e) => ({
      eventId: e.eventId,
      eventHash: e.eventHash,
      recordedAt: e.recordedAt,
      recordingTimeStatus: e.recordingTimeStatus,
    }));
  assert.deepEqual(
    snapshotTimestampsAfter,
    snapshotTimestampsBefore,
    "Restarting runtime store must reload the exact persisted admission timestamps and never assign new recording times on cold start",
  );

  // 6. Verify public Git data/machine/v03 contains only permitted metadata + bounded excerpts and zero raw capture bodies
  assert.equal(
    fs.existsSync(path.join(process.cwd(), "data/machine/v03/preserved_captures_v031.json")),
    false,
    "Raw capture bundle must not exist in public data/machine/v03/",
  );
  const pubMetaRaw = fs.readFileSync(
    path.join(process.cwd(), "data/machine/v03/preserved_capture_metadata_v031.json"),
    "utf8",
  );
  assert.equal(pubMetaRaw.includes("rawBodyUtf8"), false);
  assert.equal(pubMetaRaw.includes("rawBodyBase64"), false);
  assert.equal(pubMetaRaw.includes("derivedTextUtf8"), false);

  // 7. Verify provenance checks all relevant build inputs and reports "unknown" (never "clean") when source inspection is unavailable
  const liveProv = getDeploymentProvenanceV03();
  assert.ok(liveProv.buildInputsInspection);
  for (const requiredInput of [
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "next.config.mjs",
    "drizzle.config.ts",
    "vercel.json",
    "drizzle",
    "scripts",
    "app",
    "lib",
  ]) {
    assert.equal(
      liveProv.buildInputsInspection.checkedBuildInputs.includes(requiredInput),
      true,
      `Provenance must inspect build input: ${requiredInput}`,
    );
  }
  assert.equal(liveProv.buildInputsInspection.rootConfigSha256.length, 64);
  assert.equal(liveProv.buildInputsInspection.dependencyLockSha256.length, 64);
  assert.equal(liveProv.buildInputsInspection.migrationsSha256.length, 64);
  assert.equal(liveProv.buildInputsInspection.scriptsSha256.length, 64);

  // Simulate an environment where source inspection is unavailable and no build-time git status env was injected
  const savedDirtyEnv = process.env.DCC_BUILD_DIRTY_STATUS;
  const savedSourceInspEnv = process.env.DCC_BUILD_SOURCE_INSPECTION_AVAILABLE;
  delete process.env.DCC_BUILD_DIRTY_STATUS;
  delete process.env.DCC_BUILD_SOURCE_INSPECTION_AVAILABLE;
  try {
    const uninspectedDir = fs.mkdtempSync(path.join(process.env.TEMP ?? "/tmp", "dcc-no-git-"));
    const unknownProv = getDeploymentProvenanceV03({ cwd: uninspectedDir });
    assert.equal(
      unknownProv.dirtySourceStatus,
      "unknown",
      'When source inspection is unavailable, dirtySourceStatus must report "unknown", never "clean"',
    );
    assert.equal(unknownProv.buildInputsInspection.sourceInspectionAvailable, false);
    assert.equal(unknownProv.buildInputsInspection.dirtySourceStatus, "unknown");
    fs.rmSync(uninspectedDir, { recursive: true, force: true });
  } finally {
    if (savedDirtyEnv !== undefined) process.env.DCC_BUILD_DIRTY_STATUS = savedDirtyEnv;
    if (savedSourceInspEnv !== undefined) {
      process.env.DCC_BUILD_SOURCE_INSPECTION_AVAILABLE = savedSourceInspEnv;
    }
  }

  // 8. Verify additive idempotent admission on a pre-repair 7-event legacy ledger (such as production /neondb)
  //    and verify nonproduction snapshot timestamps are never loaded when VERCEL_ENV === "production"
  const {
    admitOperationalLedgerAdditiveIdempotentV031,
    loadPersistedAdmissionSnapshotV031,
  } = await import("../../lib/dcc/machine/v03/runtimeStoreV03");
  const { AppendOnlyKnowledgeLedger } = await import(
    "../../lib/dcc/machine/v03/temporalLedger"
  );

  const savedVercelEnv = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "production";
  try {
    assert.equal(
      loadPersistedAdmissionSnapshotV031(),
      null,
      "Nonproduction admission snapshot must never be loaded when VERCEL_ENV=production",
    );
  } finally {
    if (savedVercelEnv === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = savedVercelEnv;
    }
  }

  const baseTemplate = getV03RuntimeStore();
  const baseEvents = baseTemplate.knowledgeLedger.getAllEvents();
  const preRepairLegacyLedger = new AppendOnlyKnowledgeLedger();
  // Reconstruct the 7 pre-repair legacy events (00:00Z, 15:00Z, 15:05Z)
  preRepairLegacyLedger.appendEvent({
    eventType: "claim_created",
    claimId: "clm:gosno:max-pax-per-shuttle",
    claimVersionId: "clmv:gosno:max-pax-per-shuttle:v1",
    recordedAt: "2026-10-26T00:00:00.000Z",
    recordedAtVerified: false,
    recordingTimeStatus: "unverified_legacy_recording_time",
    actorId: "dcc-v03-bootstrap",
    isSynthetic: true,
    provenanceClass: "withdrawn_unsupported",
    claimDefinition: baseEvents[0]!.claimDefinition,
    reason: baseEvents[0]!.reason,
  });
  preRepairLegacyLedger.appendEvent({
    eventType: "claim_withdrawn",
    claimId: "clm:gosno:max-pax-per-shuttle",
    claimVersionId: "clmv:gosno:max-pax-per-shuttle:v2-withdrawn",
    targetPreviousVersionId: "clmv:gosno:max-pax-per-shuttle:v1",
    recordedAt: "2026-10-26T15:00:00.000Z",
    recordedAtVerified: false,
    recordingTimeStatus: "unverified_legacy_recording_time",
    actorId: "dcc-v031-evidence-containment-auditor",
    isSynthetic: false,
    provenanceClass: "operational_evidence",
    reason: baseEvents[1]!.reason,
  });
  for (const activeClaimId of [
    "clm:jnu:standard-seat-weight-limit-lbs",
    "clm:haw:noaa-100yd-approach-compliance",
    "clm:gosno:private-transport-mode-only",
    "clm:gosno:private-suv-max-passengers-6",
    "clm:gosno:private-van-max-passengers-10",
  ]) {
    const tmpl = baseEvents.find((e) => e.claimId === activeClaimId)!;
    preRepairLegacyLedger.appendEvent({
      eventType: "claim_created",
      claimId: tmpl.claimId,
      claimVersionId: tmpl.claimVersionId,
      recordedAt: "2026-10-26T15:05:00.000Z",
      recordedAtVerified: false,
      recordingTimeStatus: "unverified_legacy_recording_time",
      actorId: tmpl.actorId,
      isSynthetic: false,
      provenanceClass: "operational_evidence",
      claimDefinition: {
        ...tmpl.claimDefinition!,
        retrievedAt: "2026-10-26T00:00:00.000Z",
        evidenceRefs: [],
      },
      reason: tmpl.reason,
    });
  }

  const simulatedProdDbEvents: any[] = [...preRepairLegacyLedger.getAllEvents()];
  let mockProdClockCounter = 0;
  const mockProdNeonStore = {
    isConfigured: true,
    schemaName: "dcc_machine_v03",
    ensureSchemaAndTables: async () => {},
    readLedgerEventsFromNeon: async () => [
      ...AppendOnlyKnowledgeLedger.fromEvents(simulatedProdDbEvents).getAllEvents(),
    ],
    queryDatabaseClockIso: async () => {
      mockProdClockCounter += 1;
      return `2026-10-27T12:30:0${mockProdClockCounter}.000Z`;
    },
    persistLedgerEventsToNeon: async (newEvs: readonly any[]) => {
      for (const ev of newEvs) {
        if (!simulatedProdDbEvents.some((x) => x.eventId === ev.eventId)) {
          simulatedProdDbEvents.push(ev);
        }
      }
    },
    persistEvidenceReferenceToNeon: async () => {},
    persistCandidateUniverseToNeon: async () => {},
    persistEngineBundleToNeon: async () => {},
    readAllCandidateUniversesFromNeon: async () => [],
    readAllEngineBundlesFromNeon: async () => [],
    truncateAndRebuildClaimProjectionsInNeon: async () => ({
      rebuiltClaimVersionCount: 16,
      eventsReplayedCount: simulatedProdDbEvents.length,
      projectionDigestSha256: "0".repeat(64),
    }),
  } as any;

  const firstAdditiveRepair = await admitOperationalLedgerAdditiveIdempotentV031({
    neonStore: mockProdNeonStore,
    writeSnapshotToDisk: false,
  });
  assert.equal(firstAdditiveRepair.preservedExistingEventsCount, 7);
  assert.equal(firstAdditiveRepair.preservedUnverifiedLegacyEventsCount, 7);
  assert.equal(firstAdditiveRepair.newlyAppendedEventsCount, 11);
  assert.equal(firstAdditiveRepair.events.length, 18);

  // Verify the original 7 legacy events are preserved at eventSeq 1..7 as unverified_legacy_recording_time
  for (let i = 0; i < 7; i++) {
    const legacyEv = firstAdditiveRepair.events[i]!;
    assert.equal(legacyEv.eventSeq, i + 1);
    assert.equal(legacyEv.recordedAtVerified, false);
    assert.equal(legacyEv.recordingTimeStatus, "unverified_legacy_recording_time");
  }
  // Verify eventSeq 8..18 are verified_database_admission and reference the earlier unverified records
  const correctiveWithdrawal = firstAdditiveRepair.events[7]!;
  assert.equal(
    correctiveWithdrawal.claimVersionId,
    "clmv:gosno:max-pax-per-shuttle:v3-withdrawn-db-admitted",
  );
  assert.equal(correctiveWithdrawal.recordedAtVerified, true);
  assert.equal(correctiveWithdrawal.recordingTimeStatus, "verified_database_admission");
  assert.equal(
    correctiveWithdrawal.reason.includes(firstAdditiveRepair.events[1]!.eventId),
    true,
  );

  // Second run must be 100% idempotent (0 newly appended events, identical records and timestamps)
  const secondAdditiveRepair = await admitOperationalLedgerAdditiveIdempotentV031({
    neonStore: mockProdNeonStore,
    writeSnapshotToDisk: false,
  });
  assert.equal(secondAdditiveRepair.newlyAppendedEventsCount, 0);
  assert.equal(secondAdditiveRepair.events.length, 18);
  assert.deepEqual(
    secondAdditiveRepair.admittedTimestamps,
    firstAdditiveRepair.admittedTimestamps,
  );

  // Verify getV03RuntimeStore() succeeds when VERCEL_ENV=production (where persisted nonprod snapshot is ignored)
  const prevVercelEnv = process.env.VERCEL_ENV;
  try {
    process.env.VERCEL_ENV = "production";
    resetV03RuntimeStore();
    const prodBootstrapStore = getV03RuntimeStore();
    assert.equal(prodBootstrapStore.admittedTimestamps.admittedByDatabaseClock, false);
    assert.equal(
      prodBootstrapStore.admittedTimestamps.admissionId,
      "bootstrap-pending-db-admission",
    );
  } finally {
    if (prevVercelEnv === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = prevVercelEnv;
    }
  }

  // Restore clean singleton runtime store for any subsequent checks
  resetV03RuntimeStore();
});




