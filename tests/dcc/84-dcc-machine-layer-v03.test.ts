import assert from "node:assert/strict";
import test from "node:test";
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@/lib/dcc/machine";
import { GET as getApiCatalogRoute } from "@/app/.well-known/api-catalog/route";
import { GET as getWellKnownDcc } from "@/app/.well-known/dcc/route";
import { GET as getJwksRoute } from "@/app/.well-known/jwks.json/route";
import { GET as getMcpDiscoveryRoute } from "@/app/.well-known/mcp.json/route";
import { POST as postAuthorizationsRoute } from "@/app/api/v1/authorizations/route";
import { GET as getConformanceFixturesRoute } from "@/app/api/v1/conformance/fixtures/route";
import { GET as getCitationVerificationDocsRoute } from "@/app/api/v1/docs/citation-verification/route";
import { GET as getReceiptVerificationDocsRoute } from "@/app/api/v1/docs/receipt-verification/route";
import { GET as getMcpGetRoute, POST as postMcpRoute } from "@/app/api/v1/mcp/route";
import { GET as getProvenanceRoute } from "@/app/api/v1/provenance/route";
import { POST as postReceiptReplayRoute } from "@/app/api/v1/receipts/[id]/replay/route";
import { GET as getReceiptRoute } from "@/app/api/v1/receipts/[id]/route";
import { GET as getUniverseRoute } from "@/app/api/v1/universes/[id]/route";
import { POST as postV03EvaluateRoute } from "@/app/api/v1/v03/evaluate/route";
import { GET as getStableReferenceRoute } from "@/app/r/[id]/route";
import { GET as getImmutableReferenceRoute } from "@/app/r/[id]/v/[version]/route";
import {
  AppendOnlyKnowledgeLedger,
  ArtifactIntegrityMismatchError,
  assertSigningConfigurationAllowed,
  buildV03EvidenceReference,
  checkDistributedRateLimitV03,
  ClientSuppliedKnownAtForbiddenError,
  CloudflareR2PrivateArtifactStore,
  DccIdentityLedger,
  evaluateClaimSupportEligibility,
  extractTextEvidenceSelectors,
  FailClosedR2ConfigurationError,
  FailClosedSigningConfigurationError,
  getRealVsSyntheticEvidenceInventory,
  getStandardJwksDocument,
  getV03RuntimeStore,
  IdentifierReuseForbiddenError,
  InMemoryTestArtifactStore,
  mintOpaqueDccEntityId,
  resetLocalRateLimitBucketsForTest,
  resetV03RuntimeStore,
  resetV03SigningKeyRegistry,
  resolveJsonPointer,
  revokeV03SigningKey,
  rotateV03SigningKey,
  runGenuineJuneauEvidenceCanary,
  runGoSnoShadowAuthorizationProof,
  runSyntheticTemporalLifecycleFixture,
  safeIdempotentIngestFetchV03,
  setDccMachineV1RuntimeOverride,
  sha256HexFull,
  SsrfOrDnsRebindingBlockedError,
  toPublicCitationProjection,
  verifyRfc8785ConformanceVectors,
  verifyShadowDecisionAuthorizationJws,
  verifyV03DecisionReceiptJws,
} from "@/lib/dcc/machine";
import { runDccV03TenOperationBenchmarks } from "@/scripts/dcc/benchmark-machine-layer-v03";
import { runBlackBoxCanaryVerificationV03 } from "@/scripts/dcc/blackbox-verify-canary-v03";

test("v0.3 Gate 1 (Genuine Temporal Authority & 7-Step Lifecycle Proof): Append-only ledger, projection rebuild, retroactive correction, original receipt replay, and client knownAt rejection", async () => {
  setDccMachineV1RuntimeOverride(true);
  resetV03SigningKeyRegistry();
  resetV03RuntimeStore();

  const proofA = await runSyntheticTemporalLifecycleFixture();

  assert.equal(proofA.fixtureClassification, "synthetic_test_fixture");
  assert.equal(proofA.isSynthetic, true);

  // Step 1 & 2: Claim A (250 lbs) produces receipt at T1 recommending standard candidate
  assert.equal(proofA.step2ReceiptAtT1.decisionState, "recommended");
  assert.equal(
    proofA.step2ReceiptAtT1.recommendedCandidateLegacyCode,
    "syn-heli-alpha-standard",
  );

  // Step 3 & 4: Retroactive Claim B (215 lbs, validFrom T0, recordedAt T2) changes decision at T2
  assert.equal(proofA.step4NewEvaluationUsesClaimB.decisionChangedFromT1, true);
  assert.equal(
    proofA.step4NewEvaluationUsesClaimB.decisionState,
    "qualified_recommendation",
  );
  assert.equal(
    proofA.step4NewEvaluationUsesClaimB.recommendedCandidateLegacyCode,
    "syn-heli-beta-heavy-lift",
  );

  // Step 5: Original receipt replay still uses Claim A and matches original hashes identically
  assert.equal(proofA.step5Receipt1ReplayUsesClaimA.matchesOriginalHashes, true);
  assert.equal(
    proofA.step5Receipt1ReplayUsesClaimA.replayedReceiptId,
    proofA.step2ReceiptAtT1.receiptId,
  );
  assert.equal(
    proofA.step5Receipt1ReplayUsesClaimA.replayedDecisionState,
    "recommended",
  );

  // Step 6: Zero original ledger events were mutated
  assert.equal(proofA.step6LedgerImmutabilityVerified.hashChainIntact, true);
  assert.equal(proofA.step6LedgerImmutabilityVerified.originalEventAUnchanged, true);

  // Step 7: Client-supplied knownAt is rejected from ordinary evaluation
  assert.equal(proofA.step7ClientKnownAtRejected.rejected, true);
  assert.equal(
    proofA.step7ClientKnownAtRejected.errorCode,
    "CLIENT_SUPPLIED_KNOWN_AT_FORBIDDEN",
  );
});

test("v0.3 Gate 2 (Real vs. Synthetic Inventory & Genuine Juneau Evidence Canary): FAA WeatherCams homepage capture supports ONLY portal reachability while unsupported propositions remain unknown/indeterminate", async () => {
  setDccMachineV1RuntimeOverride(true);
  resetV03SigningKeyRegistry();

  const inventory = getRealVsSyntheticEvidenceInventory();
  assert.ok(inventory.length >= 5);
  assert.ok(
    inventory.some(
      (i) =>
        i.originatingVersion === "v0.2" &&
        i.classification === "synthetic_test_fixture" &&
        i.artifactOrEventId.includes("May knownFrom"),
    ),
    "v0.2 May knownFrom, auditor promotion, supersession, withdrawal, and May replay must be explicitly classified as synthetic",
  );

  const mockFaaHomepageFetch: typeof fetch = async () =>
    new Response(
      `<!DOCTYPE html><html><head><title>FAA WeatherCams - Aviation Weather Cameras</title></head><body><h1>FAA WeatherCams Portal</h1><p>Explore Alaska and national weather camera sites.</p></body></html>`,
      {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      },
    );

  const canary = await runGenuineJuneauEvidenceCanary({
    fetchImpl: mockFaaHomepageFetch,
    dnsResolveImpl: async () => ["155.178.201.10"],
  });

  assert.equal(canary.canaryClassification, "genuine_juneau_evidence_canary");
  assert.equal(canary.isSynthetic, false);
  assert.equal(
    canary.evaluationSummary.decisionState,
    "indeterminate_insufficient_evidence",
  );
  assert.equal(canary.evaluationSummary.recommendedCandidateDccId, null);
  assert.equal(
    canary.evaluationSummary
      .allCandidatesIndeterminateBecauseUnsupportedPropositionsAreUnknown,
    true,
    "Every Juneau helicopter candidate must be indeterminate when live availability and site VFR ceiling are unknown",
  );
});

test("v0.3 Gate 3 (Orthogonal Claim Semantics & Source Competence): Separates assertionType, epistemicState, lifecycleState, freshnessState, and sourceAuthority competence domains", () => {
  // 1. Source outside its competent domain cannot support positive eligibility
  const incompetentSourceCheck = evaluateClaimSupportEligibility({
    assertionType: "observation",
    epistemicState: "verified_against_identified_evidence",
    lifecycleState: "active",
    validFrom: "2026-10-01T00:00:00.000Z",
    validTo: null,
    retrievedAt: "2026-10-26T10:00:00.000Z",
    freshnessTtlSeconds: 3600,
    validAtIso: "2026-10-26T10:05:00.000Z",
    knowledgeCutoffIso: "2026-10-26T10:05:00.000Z",
    sourceAuthority: {
      sourceDccId: "dcc:ent:evidence_source:000000000000000000000001",
      organizationName: "FAA WeatherCams Portal Homepage",
      authorityTier: "primary_regulator",
      competentDomains: ["weather_camera_portal_reachability"],
      claimedDomain: "live_seat_inventory_availability", // NOT in competentDomains!
      independentlyCorroboratedBySourceDccIds: [],
      licenseOrReusePolicy: "Public Domain",
    },
  });
  assert.equal(incompetentSourceCheck.sourceCompetentForDomain, false);
  assert.equal(incompetentSourceCheck.canSupportEligibility, false);
  assert.match(
    incompetentSourceCheck.disqualificationOrIndeterminateReason ?? "",
    /SOURCE_AUTHORITY_INCOMPETENT_FOR_DOMAIN/,
  );

  // 2. Stale claim cannot support positive eligibility
  const staleCheck = evaluateClaimSupportEligibility({
    assertionType: "observation",
    epistemicState: "verified_against_identified_evidence",
    lifecycleState: "active",
    validFrom: "2026-09-01T00:00:00.000Z",
    validTo: null,
    retrievedAt: "2026-10-01T00:00:00.000Z",
    freshnessTtlSeconds: 3600,
    validAtIso: "2026-10-26T10:00:00.000Z",
    knowledgeCutoffIso: "2026-10-26T10:00:00.000Z",
    sourceAuthority: {
      sourceDccId: "dcc:ent:evidence_source:000000000000000000000001",
      organizationName: "FAA WeatherCams",
      authorityTier: "primary_regulator",
      competentDomains: ["weather_camera_portal_reachability"],
      claimedDomain: "weather_camera_portal_reachability",
      independentlyCorroboratedBySourceDccIds: [],
      licenseOrReusePolicy: "Public Domain",
    },
  });
  assert.equal(staleCheck.freshnessState, "stale");
  assert.equal(staleCheck.canSupportEligibility, false);
});

test("v0.3 Gate 4 (RFC 8785 Canonicalization, Standard JWS EdDSA, Key Rotation, Revocation, and Fail-Closed Production Issuer)", async () => {
  resetV03SigningKeyRegistry();

  // 1. Official RFC 8785 test vectors
  const rfc8785Report = verifyRfc8785ConformanceVectors();
  assert.equal(rfc8785Report.passed, true);

  // 2. Fail-closed production signing key configuration
  const prevNodeEnv = process.env.NODE_ENV;
  const prevEnforce = process.env.DCC_ENFORCE_PROD_FAIL_CLOSED;
  const prevSeed = process.env.DCC_MACHINE_SIGNING_SEED;
  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.DCC_ENFORCE_PROD_FAIL_CLOSED = "1";
    delete process.env.DCC_MACHINE_SIGNING_SEED;
    delete process.env.DCC_SIGNING_KEYSET_JSON;
    delete process.env.DCC_SIGNING_PRIVATE_JWK;

    assert.throws(
      () => assertSigningConfigurationAllowed(),
      (err: unknown) => err instanceof FailClosedSigningConfigurationError,
    );
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = prevNodeEnv;
    if (prevEnforce === undefined) delete process.env.DCC_ENFORCE_PROD_FAIL_CLOSED;
    else process.env.DCC_ENFORCE_PROD_FAIL_CLOSED = prevEnforce;
    if (prevSeed !== undefined) process.env.DCC_MACHINE_SIGNING_SEED = prevSeed;
  }

  // 3. Key rotation & historical receipt verification + revocation rejection
  resetV03SigningKeyRegistry();
  resetV03RuntimeStore();
  const store = getV03RuntimeStore();
  const bundle = store.bundlesByEngineAndVersion.get("juneau-helicopter-tours@0.3.0")!;
  const universe = store.universesByHash.get(bundle.universeHash)!;

  const { evaluateCurrentV03 } = await import("@/lib/dcc/machine");
  const evalUnderKey1 = await evaluateCurrentV03({
    rawClientRequestBody: {
      engineId: "juneau-helicopter-tours",
      validAt: "2026-07-15T12:00:00.000Z",
      inputs: { maxSinglePassengerWeightLbs: 200, maxBudgetPerPersonUsd: 600 },
    },
    bundle,
    universe,
    ledger: store.knowledgeLedger,
  });
  const key1Kid = evalUnderKey1.receipt.kid;

  // Rotate to key 2
  const rotated = rotateV03SigningKey({
    newKid: "dcc-v03-ed25519-rotated-2026-11",
    newSeedMaterial: "dcc-v03-rotated-key-material-2026-11",
  });
  assert.equal(rotated.previousKid, key1Kid);
  assert.equal(rotated.newActiveKid, "dcc-v03-ed25519-rotated-2026-11");

  // Historical receipt signed by retired key1 MUST still verify against JWKS!
  const verifyHistorical = await verifyV03DecisionReceiptJws({
    jwsCompact: evalUnderKey1.receipt.jwsCompact,
    jwks: getStandardJwksDocument(),
  });
  assert.equal(verifyHistorical.valid, true);
  assert.equal(verifyHistorical.keyStatus, "retired_verify_only");

  // Revoke key1 -> verification of receipt signed by revoked key1 MUST fail closed immediately!
  revokeV03SigningKey({
    kid: key1Kid,
    reason: "Compromised key test revocation",
  });
  const verifyAfterRevocation = await verifyV03DecisionReceiptJws({
    jwsCompact: evalUnderKey1.receipt.jwsCompact,
    jwks: getStandardJwksDocument(),
  });
  assert.equal(verifyAfterRevocation.valid, false);
  assert.match(verifyAfterRevocation.reason ?? "", /KEY_REVOKED/);

  resetV03SigningKeyRegistry();
});

test("v0.3 Gate 5 & 6 (Storage Boundary Separation, Private R2 S3 Driver, Post-Retrieval SHA-256 Verification, and W3C Evidence Selectors)", async () => {
  // 1. Fail-closed R2 configuration when R2 env vars are absent
  assert.throws(
    () => new CloudflareR2PrivateArtifactStore({ env: {} as NodeJS.ProcessEnv }),
    (err: unknown) =>
      err instanceof FailClosedR2ConfigurationError &&
      err.missingEnvVars.includes("R2_ACCOUNT_ID"),
  );

  // 2. Test CloudflareR2PrivateArtifactStore with intercepted S3Client commands (PutObject with IfNoneMatch: "*", ChecksumAlgorithm: "SHA256", GetObject with SHA-256 verification)
  const sentCommands: unknown[] = [];
  const sampleBytes = new Uint8Array(Buffer.from("private raw FAA capture bytes", "utf8"));
  const mockWriterClient = {
    send: async (cmd: unknown) => {
      sentCommands.push(cmd);
      return {};
    },
  } as unknown as S3Client;
  const mockReaderClient = {
    send: async (cmd: unknown) => {
      sentCommands.push(cmd);
      if (cmd instanceof GetObjectCommand) {
        return {
          ContentType: "text/plain",
          Body: {
            transformToByteArray: async () => sampleBytes,
          },
        };
      }
      if (cmd instanceof HeadObjectCommand) {
        return {
          Metadata: { "x-dcc-sha256": sha256HexFull(sampleBytes) },
        };
      }
      return {};
    },
  } as unknown as S3Client;

  const r2Store = new CloudflareR2PrivateArtifactStore({
    bucketName: "dcc-private-evidence-v03",
    readerClient: mockReaderClient,
    writerClient: mockWriterClient,
    objectLockEnabled: true,
  });
  assert.equal(r2Store.backendClass, "production_private_object_store");

  const putRes = await r2Store.putContentAddressedArtifact({
    category: "raw_source_captures",
    body: sampleBytes,
    contentType: "text/plain",
    extension: "txt",
  });
  assert.equal(putRes.conditionalCreateApplied, true);
  assert.equal(
    putRes.retentionMode,
    "bounded_deletable_for_privacy_legal_takedown",
  );
  const putCmd = sentCommands.find((c) => c instanceof PutObjectCommand) as PutObjectCommand;
  assert.equal(putCmd.input.IfNoneMatch, "*");
  assert.equal(putCmd.input.ChecksumAlgorithm, "SHA256");

  const getRes = await r2Store.getAndVerifyArtifact({
    objectKey: putRes.objectKey,
    expectedSha256Hex: putRes.sha256Hex,
  });
  assert.ok(getRes);
  assert.equal(getRes.verifiedPostRetrieval, true);

  // 3. Prove post-retrieval SHA-256 verification throws ArtifactIntegrityMismatchError on tampering
  const testStore = new InMemoryTestArtifactStore();
  assert.equal(testStore.backendClass, "test_only_non_r2");
  const w = await testStore.putContentAddressedArtifact({
    category: "raw_source_captures",
    body: "untampered evidence body",
    extension: "txt",
  });
  testStore.simulateUnderlyingTamperingForTest(w.objectKey);
  await assert.rejects(
    async () =>
      testStore.getAndVerifyArtifact({
        objectKey: w.objectKey,
        expectedSha256Hex: w.sha256Hex,
      }),
    (err: unknown) => err instanceof ArtifactIntegrityMismatchError,
  );

  // 4. Verify W3C TextQuoteSelector, TextPositionSelector, FragmentSelector, JsonPointerSelector, JsonPathSelector, and public citation boundary
  const sampleJson = { tariff: { maxPassengers: 14, priceUsd: 89 } };
  const resolvedPtrVal = resolveJsonPointer(sampleJson, "/tariff/maxPassengers");
  assert.equal(resolvedPtrVal, 14);

  const textSel = extractTextEvidenceSelectors({
    documentText: "GoSno Shuttle: maxPassengers=14, price=$89",
    exactQuote: "maxPassengers=14",
    fragmentValue: "char=15,31",
  });
  assert.equal(textSel.selectors.length, 3);

  const evRef = buildV03EvidenceReference({
    evidenceRefId: "evref:test:json-pointer",
    sourceDccId: "dcc:ent:evidence_source:000000000000000000000009",
    sourceTitle: "JSON Tariff Feed",
    sourceOrganization: "GoSno",
    canonicalSourceUrl: "https://www.destinationcommandcenter.com/go/dcc-to-gosno",
    snapshotId: "snap:test:json",
    snapshotSha256: sha256HexFull('{"tariff":{"maxPassengers":14,"priceUsd":89}}'),
    privateObjectKey: "v03/raw_source_captures/sha256/private.json",
    selectors: [
      ...textSel.selectors,
      {
        type: "JsonPointerSelector",
        pointer: "/tariff/maxPassengers",
        resolvedValue: resolvedPtrVal,
      },
      {
        type: "JsonPathSelector",
        path: "$.tariff.maxPassengers",
        resolvedValues: [resolvedPtrVal],
      },
    ],
    surroundingContext: textSel.surroundingContext,
    extractor: {
      extractorId: "dcc-json-extractor",
      extractorVersion: "0.3.0",
      method: "deterministic_json_pointer",
    },
    extractedAt: "2026-10-26T00:00:00.000Z",
    retrievedAt: "2026-10-26T00:00:00.000Z",
    sourcePublishedAt: "2026-10-01T00:00:00.000Z",
    sourceObservedAt: "2026-10-26T00:00:00.000Z",
    licenseOrReusePolicy: "DCC First-Party Partner Tariff",
  });
  const pubProjection = toPublicCitationProjection(evRef);
  assert.equal("privateObjectKey" in pubProjection, false);
  assert.equal(pubProjection.rawCaptureExposedPublicly, false);
});

test("v0.3 Gate 7 (DCC-Native Opaque Identity, Versioned External Aliases, Supersession, Merge, Split, and Identifier Reuse Prevention)", () => {
  const idLedger = new DccIdentityLedger();
  const opA = mintOpaqueDccEntityId("operator", "test-op-alpha");
  const opB = mintOpaqueDccEntityId("operator", "test-op-beta");
  const opSplit1 = mintOpaqueDccEntityId("operator", "test-op-split-1");
  const opSplit2 = mintOpaqueDccEntityId("operator", "test-op-split-2");

  assert.match(opA, /^dcc:ent:operator:[0-9a-f]{24}$/);

  idLedger.registerEntity({
    dccEntityId: opA,
    entityKind: "operator",
    displayName: "Operator Alpha",
    recordedAt: "2026-10-01T00:00:00.000Z",
  });
  idLedger.registerEntity({
    dccEntityId: opB,
    entityKind: "operator",
    displayName: "Operator Beta",
    recordedAt: "2026-10-01T00:00:00.000Z",
  });

  // 1. Prevent identifier reuse
  assert.throws(
    () =>
      idLedger.registerEntity({
        dccEntityId: opA,
        entityKind: "operator",
        displayName: "Duplicate Operator Alpha",
        recordedAt: "2026-10-02T00:00:00.000Z",
      }),
    (err: unknown) => err instanceof IdentifierReuseForbiddenError,
  );

  // 2. Map and supersede external aliases
  idLedger.mapExternalAlias({
    aliasVersionId: "alias:viator:v1",
    namespace: "viator_product_code",
    externalId: "VIATOR-100",
    dccEntityId: opA,
    mappingEvidenceRefIds: ["evref:1"],
    recordedAt: "2026-10-02T00:00:00.000Z",
  });
  idLedger.mapExternalAlias({
    aliasVersionId: "alias:viator:v2",
    namespace: "viator_product_code",
    externalId: "VIATOR-200",
    dccEntityId: opA,
    supersedesAliasVersionId: "alias:viator:v1",
    mappingEvidenceRefIds: ["evref:2"],
    recordedAt: "2026-10-05T00:00:00.000Z",
  });

  // 3. Merge opA into opB -> resolving opA redirects to opB
  idLedger.mergeEntities({
    sourceDccEntityId: opA,
    survivingDccEntityId: opB,
    reason: "Corporate acquisition",
    evidenceRefIds: ["evref:merge"],
    recordedAt: "2026-10-10T00:00:00.000Z",
  });

  const projAfterMerge = idLedger.projectAtCutoff({
    knowledgeCutoffIso: "2026-10-15T00:00:00.000Z",
  });
  const resolvedAfterMerge = projAfterMerge.resolveEntityId(opA);
  assert.equal(resolvedAfterMerge.resolutionStatus, "merged_redirect");
  assert.equal(resolvedAfterMerge.canonicalDccEntityId, opB);

  const aliasAfterMerge = projAfterMerge.resolveExternalAlias(
    "viator_product_code",
    "VIATOR-200",
  );
  assert.equal(aliasAfterMerge.found, true);
  assert.equal(aliasAfterMerge.canonicalDccEntityId, opB);
  assert.equal(aliasAfterMerge.redirectedViaMerge, true);

  // 4. Split opB into opSplit1 and opSplit2 -> resolving opB requires disambiguation
  idLedger.splitEntity({
    originalDccEntityId: opB,
    newDccEntities: [
      { dccEntityId: opSplit1, entityKind: "operator", displayName: "Operator Split North" },
      { dccEntityId: opSplit2, entityKind: "operator", displayName: "Operator Split South" },
    ],
    reason: "Divisional spin-off",
    evidenceRefIds: ["evref:split"],
    recordedAt: "2026-10-20T00:00:00.000Z",
  });

  const projAfterSplit = idLedger.projectAtCutoff({
    knowledgeCutoffIso: "2026-10-25T00:00:00.000Z",
  });
  const resolvedAfterSplit = projAfterSplit.resolveEntityId(opB);
  assert.equal(resolvedAfterSplit.resolutionStatus, "split_ambiguous");
  assert.deepEqual(resolvedAfterSplit.splitCandidates, [opSplit1, opSplit2]);
});

test("v0.3 Gate 8 (Operational Controls: SSRF, DNS-Rebinding Double-Resolution, Redirect Revalidation, Idempotent Deduplication, and Rate Limiting)", async () => {
  resetLocalRateLimitBucketsForTest();

  // 1. Two-pass DNS rebinding attack blocked (pass 1 returns public IP, pass 2 returns 169.254.169.254 metadata IP!)
  let dnsCall = 0;
  await assert.rejects(
    async () =>
      safeIdempotentIngestFetchV03({
        url: "https://rebind-attacker.example.com/feed.json",
        idempotencyKey: "test-rebind-1",
        dnsResolveImpl: async () => {
          dnsCall++;
          return dnsCall === 1 ? ["93.184.216.34"] : ["169.254.169.254"];
        },
      }),
    (err: unknown) =>
      err instanceof SsrfOrDnsRebindingBlockedError &&
      err.code === "DNS_REBINDING_ATTACK_BLOCKED",
  );

  // 2. Redirect to private IP / localhost blocked on redirect hop revalidation
  await assert.rejects(
    async () =>
      safeIdempotentIngestFetchV03({
        url: "https://public-redirect.example.com/start",
        idempotencyKey: "test-redirect-ssrf",
        dnsResolveImpl: async () => ["93.184.216.34"],
        fetchImpl: async () =>
          new Response(null, {
            status: 302,
            headers: { location: "https://127.0.0.1/admin-secret" },
          }),
      }),
    (err: unknown) =>
      err instanceof SsrfOrDnsRebindingBlockedError &&
      err.code === "SSRF_PRIVATE_IP_LITERAL_BLOCKED",
  );

  // 3. Idempotent duplicate delivery deduplication
  let networkFetchCount = 0;
  const mockFetch: typeof fetch = async () => {
    networkFetchCount++;
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  const ingest1 = await safeIdempotentIngestFetchV03({
    url: "https://example.com/idempotent-tariff.json",
    idempotencyKey: "idemp-key-2026-v03",
    dnsResolveImpl: async () => ["93.184.216.34"],
    fetchImpl: mockFetch,
  });
  const ingest2 = await safeIdempotentIngestFetchV03({
    url: "https://example.com/idempotent-tariff.json",
    idempotencyKey: "idemp-key-2026-v03",
    dnsResolveImpl: async () => ["93.184.216.34"],
    fetchImpl: mockFetch,
  });
  assert.equal(networkFetchCount, 1);
  assert.equal(ingest1.deduplicatedDuplicateDelivery, false);
  assert.equal(ingest2.deduplicatedDuplicateDelivery, true);
  assert.equal(ingest2.deliveryCount, 2);

  // 4. Rate limiter explicitly reports survivesColdStarts: false when in process-local fallback
  const rl = await checkDistributedRateLimitV03({
    clientKey: "unit-test-ip",
    endpoint: "/api/v1/v03/evaluate",
    maxRequests: 5,
  });
  assert.equal(rl.coordinationBackend, "process_local_non_distributed_fallback");
  assert.equal(rl.survivesColdStarts, false);
  assert.equal(rl.coordinatesAcrossInstances, false);
});

test("v0.3 Gate 9 (GoSno Shadow-Mode DecisionAuthorization Proof & Provider-Neutral Commerce Adapters)", async () => {
  resetV03SigningKeyRegistry();
  const gosnoProof = await runGoSnoShadowAuthorizationProof();

  assert.equal(
    gosnoProof.decisionEvaluation.decisionState,
    "qualified_recommendation",
  );
  assert.equal(
    gosnoProof.signedAuthorization.payload.executionMode,
    "shadow_only_no_side_effects",
  );
  assert.equal(
    gosnoProof.signedAuthorization.payload.opaqueRouting.wtaExcluded,
    true,
  );

  const authVer = await verifyShadowDecisionAuthorizationJws(
    gosnoProof.signedAuthorization.jwsCompact,
  );
  assert.equal(authVer.valid, true);

  assert.equal(gosnoProof.squareShadowResult.liveNetworkCallMade, false);
  assert.equal(gosnoProof.squareShadowResult.bookingSubmitted, false);
  assert.equal(gosnoProof.squareShadowResult.inventoryReserved, false);
  assert.equal(gosnoProof.squareShadowResult.paymentCharged, false);
  assert.equal(gosnoProof.squareShadowResult.travelerContacted, false);

  assert.equal(gosnoProof.octoShadowResult.liveNetworkCallMade, false);
  assert.equal(gosnoProof.octoShadowResult.bookingSubmitted, false);
});

test("v0.3 Gate 10 (Standalone Black-Box Verification Client V0.3 & 10-Operation Benchmark Suite)", async () => {
  setDccMachineV1RuntimeOverride(true);
  resetV03SigningKeyRegistry();
  resetV03RuntimeStore();
  resetLocalRateLimitBucketsForTest();

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
    throw new Error(`Unhandled route in v0.3 black-box router: ${url.pathname}`);
  };

  const bbReport = await runBlackBoxCanaryVerificationV03({
    baseUrl: "https://www.destinationcommandcenter.com",
    fetchImpl: inProcessFetch,
  });

  assert.equal(bbReport.ok, true);
  assert.equal(bbReport.protocolVersion, "0.3.0");
  assert.equal(bbReport.discovery.apiCatalogVerified, true);
  assert.equal(bbReport.discovery.conformanceFixturesVerified, true);
  assert.equal(bbReport.discovery.provenanceVerified, true);
  assert.equal(bbReport.temporalAndBoundaryChecks.clientKnownAtRejectedWith400, true);
  assert.equal(
    bbReport.temporalAndBoundaryChecks.clientKnownAtErrorCode,
    "CLIENT_SUPPLIED_KNOWN_AT_FORBIDDEN",
  );
  assert.equal(
    bbReport.temporalAndBoundaryChecks.privateRawEvidenceRejectedWith403,
    true,
  );
  assert.equal(
    bbReport.temporalAndBoundaryChecks.privateRawEvidenceErrorCode,
    "PRIVATE_EVIDENCE_RAW_CAPTURE_FORBIDDEN",
  );
  assert.equal(bbReport.juneauEvaluation.receiptIdIsFull64HexSha256, true);
  assert.equal(bbReport.juneauEvaluation.jwsHeaderAlg, "EdDSA");
  assert.equal(bbReport.juneauEvaluation.jwsSignatureVerifiedViaJoseJwks, true);
  assert.equal(bbReport.juneauEvaluation.historicalReplayMatchedIdentically, true);
  assert.equal(bbReport.hawaiiEvaluation.jwsSignatureVerifiedViaJoseJwks, true);
  assert.equal(bbReport.hawaiiEvaluation.historicalReplayMatchedIdentically, true);
  assert.equal(bbReport.mcpJsonRpcVerification.evaluateToolCallSucceeded, true);
  assert.equal(bbReport.shadowDecisionAuthorization.jwsVerified, true);
  assert.equal(bbReport.shadowDecisionAuthorization.zeroLiveSideEffects, true);

  // Run 10-operation benchmark suite in unit-test mode
  const bench = await runDccV03TenOperationBenchmarks({
    includeNeonAndRemote: false,
  });
  assert.equal(bench.benchmarkSpec, "dcc-machine-benchmark/0.3");
  assert.equal(bench.operations.pureEvaluatorExecution.sampleCount, 50);
  assert.equal(bench.operations.rfc8785Canonicalization.sampleCount, 100);
  assert.equal(bench.operations.jwsEdDsaSigning.sampleCount, 50);
});
