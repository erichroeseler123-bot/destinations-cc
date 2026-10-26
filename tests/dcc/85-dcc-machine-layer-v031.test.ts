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
  });
  assert.equal(negSuite.allTenFailedClosed, true);
  assert.equal(negSuite.cases.length, 10);
});

test("v0.3.1 Gate 4: Genuine Juneau Operational Decision Pack (Eligible, Qualified, Ineligible, Indeterminate, Source Hierarchy Override Block, Zero WTA)", async () => {
  resetV03SigningKeyRegistry();
  const juneauPack = await runGenuineJuneauOperationalPackV031();

  assert.equal(juneauPack.packVersion, "0.3.1");
  assert.ok(juneauPack.ingestedSourceCount >= 6);
  assert.equal(juneauPack.liveExternalCallsOnEvaluationHotPath, 0);
  assert.equal(juneauPack.wtaCandidatesIncluded, 0);

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

  const policyCheck = evaluateSourceHierarchyOverridePolicy({
    existingClaimTier: "operator_direct",
    existingAssertionType: "policy",
    incomingClaimTier: "reseller",
    incomingAssertionType: "policy",
  });
  assert.equal(policyCheck.overrideAllowed, false);
  assert.equal(policyCheck.requiresExplicitConflictRecord, true);
});

test("v0.3.1 Gate 5: Genuine GoSno First-Party Shadow Proof (Real Published Facts, 5 Unknown Live Variables, 8-Step Lifecycle, Zero Live Side Effects)", async () => {
  resetV03SigningKeyRegistry();
  const gosno = await runGoSnoShadowAuthorizationProof();

  assert.equal(gosno.independentAuthorizationVerification.valid, true);
  assert.equal(gosno.unknownLiveConditions.length, 5);
  assert.equal(
    gosno.unknownLiveConditions.every((c) => c.epistemicState === "unknown"),
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

  // 3. Run full standalone black-box verifier in-process (including W3C SubtleCrypto JWS, MCP parity 403 checks, and 10 negative tampering cases)
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
  assert.equal(bb.negativeTamperingSuite.cases.length, 10);
});
