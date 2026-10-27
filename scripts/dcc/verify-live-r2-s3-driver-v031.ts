import assert from "node:assert/strict";
import {
  ArtifactIntegrityMismatchError,
  CloudflareR2PrivateArtifactStore,
  evaluateV03StorageAndEvidenceGate,
  getV03RuntimeStore,
  handleV03EvaluateRequest,
  inspectR2CredentialsFromEnv,
  loadPreservedCapturesBundleV031,
  resetV03RuntimeStore,
} from "../../lib/dcc/machine";

async function main() {
  const inspection = inspectR2CredentialsFromEnv(process.env);
  assert.equal(inspection.configured, true, "R2 credentials must be configured");
  assert.equal(inspection.bucketName, "dcc-machine-v03-private");
  assert.equal(inspection.accountId, "c6f09be06eca117af4fa9c9fb846a9c2");

  const r2Store = new CloudflareR2PrivateArtifactStore({ env: process.env });
  assert.equal(r2Store.backendName, "cloudflare_r2_private_s3");
  assert.equal(r2Store.backendClass, "production_private_object_store");

  // 1. Verify reading and post-retrieval SHA-256 verification of all 19 preserved captures in R2 via S3 driver
  const metadataBundle = loadPreservedCapturesBundleV031();
  const captures = Object.values(metadataBundle.captures);
  let verifiedCaptureCount = 0;
  let verifiedDerivedCount = 0;

  for (const cap of captures) {
    assert.ok(cap.privateRawObjectKey, `Capture ${cap.captureId} must have privateRawObjectKey`);
    const rawRead = await r2Store.getAndVerifyArtifact({
      objectKey: cap.privateRawObjectKey,
      expectedSha256Hex: cap.rawSha256,
    });
    assert.ok(
      rawRead,
      `Must read raw capture ${cap.captureId} (${cap.privateRawObjectKey}) from R2`,
    );
    assert.equal(rawRead.sha256Hex, cap.rawSha256);
    assert.equal(rawRead.verifiedPostRetrieval, true);
    assert.equal(rawRead.byteLength, cap.rawByteLength);
    verifiedCaptureCount += 1;

    if (cap.privateDerivedTextObjectKey && cap.derivedTextSha256) {
      const derivedRead = await r2Store.getAndVerifyArtifact({
        objectKey: cap.privateDerivedTextObjectKey,
        expectedSha256Hex: cap.derivedTextSha256,
      });
      assert.ok(
        derivedRead,
        `Must read derived text ${cap.captureId} (${cap.privateDerivedTextObjectKey}) from R2`,
      );
      assert.equal(derivedRead.sha256Hex, cap.derivedTextSha256);
      assert.equal(derivedRead.verifiedPostRetrieval, true);
      verifiedDerivedCount += 1;
    }
  }

  // 2. Verify content-addressed PUT with conditional create (If-None-Match: *) and SHA-256 checksum header
  const testPayload = JSON.stringify({
    spec: "dcc-r2-live-s3-driver-canary/0.3.1",
    bucket: inspection.bucketName,
    verifiedCaptureCount,
    verifiedDerivedCount,
  });

  const firstWrite = await r2Store.putContentAddressedArtifact({
    category: "integration_tests",
    body: testPayload,
    contentType: "application/json",
    extension: "json",
  });
  assert.equal(firstWrite.backendName, "cloudflare_r2_private_s3");
  assert.equal(firstWrite.backendClass, "production_private_object_store");
  assert.equal(firstWrite.conditionalCreateApplied, true);

  // 3. Second write of identical content-addressed payload hits If-None-Match: * HTTP 412 and returns alreadyExistedIdempotent: true
  const secondWrite = await r2Store.putContentAddressedArtifact({
    category: "integration_tests",
    body: testPayload,
    contentType: "application/json",
    extension: "json",
  });
  assert.equal(secondWrite.objectKey, firstWrite.objectKey);
  assert.equal(secondWrite.sha256Hex, firstWrite.sha256Hex);
  assert.equal(secondWrite.alreadyExistedIdempotent, true);

  // 4. Read back the test artifact and verify SHA-256 recomputation
  const readBack = await r2Store.getAndVerifyArtifact({
    objectKey: firstWrite.objectKey,
    expectedSha256Hex: firstWrite.sha256Hex,
  });
  assert.ok(readBack);
  assert.equal(readBack.verifiedPostRetrieval, true);
  assert.equal(readBack.bodyText, testPayload);

  // 5. Verify tampered expectedSha256Hex fails closed with ArtifactIntegrityMismatchError
  let integrityErrorCaught = false;
  try {
    await r2Store.getAndVerifyArtifact({
      objectKey: firstWrite.objectKey,
      expectedSha256Hex: "0".repeat(64),
    });
  } catch (err) {
    if (err instanceof ArtifactIntegrityMismatchError) {
      integrityErrorCaught = true;
    }
  }
  assert.equal(
    integrityErrorCaught,
    true,
    "Tampered expectedSha256Hex must throw ArtifactIntegrityMismatchError",
  );

  // 6. Clean up ephemeral integration_tests object if permitted
  const cleanup = await r2Store.deleteArtifactIfPermitted({
    objectKey: firstWrite.objectKey,
    reason: "Clean up live S3 driver verification artifact",
  });
  assert.equal(cleanup.deleted, true);

  // 6b. If separate read-only credentials (R2_READ_ACCESS_KEY_ID) are configured, verify that PUT with reader credentials fails closed with HTTP 403 AccessDenied
  let readerWriteRejectedWithAccessDenied: boolean | "pending_separate_reader_token" =
    "pending_separate_reader_token";
  if (inspection.separateReadWritePermissionsConfigured) {
    const { S3Client, PutObjectCommand } = await import(
      "../../lib/dcc/machine/v03/storageBoundary"
    );
    const readOnlyS3Client = new S3Client({
      region: "auto",
      endpoint: `https://${inspection.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_READ_ACCESS_KEY_ID!.trim(),
        secretAccessKey: process.env.R2_READ_SECRET_ACCESS_KEY!.trim(),
      },
    });
    let accessDeniedCaught = false;
    try {
      await readOnlyS3Client.send(
        new PutObjectCommand({
          Bucket: inspection.bucketName!,
          Key: "v03/integration_tests/sha256/readonly-must-fail.json",
          Body: "{}",
          ContentType: "application/json",
        }),
      );
    } catch (err: any) {
      if (err?.name === "AccessDenied" || err?.$metadata?.httpStatusCode === 403) {
        accessDeniedCaught = true;
      }
    }
    assert.equal(
      accessDeniedCaught,
      true,
      "Read-only R2 token (dcc-evidence-reader) must be rejected with HTTP 403 AccessDenied on PUT",
    );
    readerWriteRejectedWithAccessDenied = true;
  }

  // 7. Verify runtime store uses CloudflareR2PrivateArtifactStore and passes enforceProductionStorageGate: true
  resetV03RuntimeStore();
  const runtimeStore = getV03RuntimeStore();
  assert.equal(runtimeStore.objectStore.backendName, "cloudflare_r2_private_s3");
  assert.equal(
    runtimeStore.objectStore.backendClass,
    "production_private_object_store",
  );

  const gateCheck = evaluateV03StorageAndEvidenceGate({
    enforceProductionStorageGate: true,
    store: runtimeStore,
  });
  assert.equal(gateCheck.passed, true);
  assert.equal(
    gateCheck.activeObjectStoreBackendClass,
    "production_private_object_store",
  );

  const evalResult = await handleV03EvaluateRequest(
    {
      engineId: "denver-to-mountain-transportation",
      validAt: "2026-12-20T15:00:00.000Z",
      enforceProductionStorageGate: true,
      constraints: {
        corridorRouteId: "den-winter-park",
        passengerCount: 4,
        serviceType: "private",
      },
    },
    { enforceProductionStorageGate: true },
  );
  assert.equal(evalResult.decisionState, "qualified_recommendation");
  assert.equal(
    evalResult.recommendedCandidateLegacyCode,
    "gosno-denver-winter-park-private-suv",
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        backendName: r2Store.backendName,
        backendClass: r2Store.backendClass,
        bucketName: inspection.bucketName,
        accountId: inspection.accountId,
        separateReadWritePermissionsConfigured:
          inspection.separateReadWritePermissionsConfigured,
        readerWriteRejectedWithAccessDenied,
        verifiedRawCapturesFromR2: verifiedCaptureCount,
        verifiedDerivedTextsFromR2: verifiedDerivedCount,
        totalVerifiedObjectsFromR2: verifiedCaptureCount + verifiedDerivedCount,
        conditionalCreateIdempotencyVerified: secondWrite.alreadyExistedIdempotent,
        tamperedHashFailsClosedVerified: integrityErrorCaught,
        productionStorageGatePassed: gateCheck.passed,
        productionEvaluateDecisionState: evalResult.decisionState,
        productionEvaluateReceiptId: evalResult.receiptId,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error("LIVE R2 S3 DRIVER VERIFICATION FAILED:", err);
  process.exit(1);
});
