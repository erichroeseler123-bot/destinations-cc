import crypto from "node:crypto";
import { rfc8785Canonicalize, sha256HexFull } from "./rfc8785AndJws";

export interface PutObjectCommandInput {
  Bucket: string;
  Key: string;
  Body: Uint8Array | string;
  ContentType?: string;
  IfNoneMatch?: string;
  ChecksumAlgorithm?: "SHA256";
  ChecksumSHA256?: string;
  ObjectLockMode?: "COMPLIANCE" | "GOVERNANCE";
  ObjectLockRetainUntilDate?: Date;
  Metadata?: Record<string, string>;
}

export class PutObjectCommand {
  public readonly input: PutObjectCommandInput;
  constructor(input: PutObjectCommandInput) {
    this.input = input;
  }
}

export interface GetObjectCommandInput {
  Bucket: string;
  Key: string;
}

export class GetObjectCommand {
  public readonly input: GetObjectCommandInput;
  constructor(input: GetObjectCommandInput) {
    this.input = input;
  }
}

export interface HeadObjectCommandInput {
  Bucket: string;
  Key: string;
}

export class HeadObjectCommand {
  public readonly input: HeadObjectCommandInput;
  constructor(input: HeadObjectCommandInput) {
    this.input = input;
  }
}

export interface S3ClientConfig {
  region: string;
  endpoint: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest();
}

export class S3Client {
  public readonly config: S3ClientConfig;
  constructor(config: S3ClientConfig) {
    this.config = config;
  }

  async send(
    command: PutObjectCommand | GetObjectCommand | HeadObjectCommand,
  ): Promise<any> {
    const method =
      command instanceof PutObjectCommand
        ? "PUT"
        : command instanceof HeadObjectCommand
          ? "HEAD"
          : "GET";
    const bucket = command.input.Bucket;
    const key = command.input.Key;
    const endpointUrl = new URL(
      `${this.config.endpoint.replace(/\/$/, "")}/${encodeURIComponent(bucket)}/${key
        .split("/")
        .map(encodeURIComponent)
        .join("/")}`,
    );

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.slice(0, 8);
    const region = this.config.region || "auto";
    const service = "s3";

    const bodyBytes =
      command instanceof PutObjectCommand
        ? typeof command.input.Body === "string"
          ? Buffer.from(command.input.Body, "utf8")
          : Buffer.from(command.input.Body)
        : Buffer.alloc(0);

    const payloadHash = sha256HexFull(bodyBytes);
    const headers: Record<string, string> = {
      host: endpointUrl.host,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    };

    if (command instanceof PutObjectCommand) {
      if (command.input.ContentType) {
        headers["content-type"] = command.input.ContentType;
      }
      if (command.input.IfNoneMatch) {
        headers["if-none-match"] = command.input.IfNoneMatch;
      }
      if (command.input.ChecksumSHA256) {
        headers["x-amz-checksum-sha256"] = command.input.ChecksumSHA256;
      }
      if (command.input.ObjectLockMode) {
        headers["x-amz-object-lock-mode"] = command.input.ObjectLockMode;
      }
      if (command.input.ObjectLockRetainUntilDate) {
        headers["x-amz-object-lock-retain-until-date"] =
          command.input.ObjectLockRetainUntilDate.toISOString();
      }
      if (command.input.Metadata) {
        for (const [mk, mv] of Object.entries(command.input.Metadata)) {
          headers[`x-amz-meta-${mk.toLowerCase()}`] = mv;
        }
      }
    }

    const sortedHeaderKeys = Object.keys(headers).sort();
    const canonicalHeaders = sortedHeaderKeys
      .map((k) => `${k}:${headers[k]!.trim()}\n`)
      .join("");
    const signedHeaders = sortedHeaderKeys.join(";");
    const canonicalRequest = [
      method,
      endpointUrl.pathname,
      "",
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      sha256HexFull(canonicalRequest),
    ].join("\n");

    const kDate = hmacSha256(`AWS4${this.config.credentials.secretAccessKey}`, dateStamp);
    const kRegion = hmacSha256(kDate, region);
    const kService = hmacSha256(kRegion, service);
    const kSigning = hmacSha256(kService, "aws4_request");
    const signature = crypto
      .createHmac("sha256", kSigning)
      .update(stringToSign, "utf8")
      .digest("hex");

    headers["authorization"] =
      `AWS4-HMAC-SHA256 Credential=${this.config.credentials.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const res = await fetch(endpointUrl.toString(), {
      method,
      headers,
      body: method === "PUT" ? bodyBytes : undefined,
    });

    if (!res.ok) {
      const err: any = new Error(
        `R2 S3 request failed with HTTP ${res.status}: ${await res.text()}`,
      );
      err.$metadata = { httpStatusCode: res.status };
      if (res.status === 412) {
        err.name = "PreconditionFailed";
      }
      throw err;
    }

    const metadata: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      if (k.toLowerCase().startsWith("x-amz-meta-")) {
        metadata[k.toLowerCase().slice("x-amz-meta-".length)] = v;
      }
    });

    if (method === "GET") {
      const arrBuf = await res.arrayBuffer();
      const uint8 = new Uint8Array(arrBuf);
      return {
        ContentType: res.headers.get("content-type") ?? "application/octet-stream",
        Metadata: metadata,
        Body: {
          transformToByteArray: async () => uint8,
        },
      };
    }

    return {
      Metadata: metadata,
    };
  }
}

/**
 * DCC Machine Layer v0.3 — Storage Boundary Separation
 *
 * Implements Requirement 5:
 * 1. Neon Postgres: relational event ledger, identities, claims, rules, manifests, audits, and projections.
 * 2. Private Cloudflare R2 (`CloudflareR2PrivateArtifactStore`): canonical evidence bytes and compiled artifacts.
 *    - Private bucket (no public raw snapshot URLs)
 *    - Content-addressed keys (`v03/<category>/sha256/<64-hex>.<ext>`)
 *    - Conditional create (`IfNoneMatch: "*"`)
 *    - SHA-256 checksum on upload (`ChecksumAlgorithm: "SHA256"`, `ChecksumSHA256`)
 *    - Mandatory SHA-256 recomputation and verification after retrieval
 *    - Immutable retention / bucket-lock policy (`ObjectLockMode: "COMPLIANCE"`, `ObjectLockRetainUntilDate`)
 *    - Separate reader vs writer permissions (`R2_READ_ACCESS_KEY_ID` vs `R2_WRITE_ACCESS_KEY_ID`)
 * 3. Test-only object store (`InMemoryTestArtifactStore` / `NeonTestBlobStore`):
 *    - Explicitly labeled `backendClass: "test_only_non_r2"` — NEVER called R2 or production object storage.
 */

export class FailClosedR2ConfigurationError extends Error {
  public readonly code = "FAIL_CLOSED_R2_CREDENTIALS_MISSING";
  public readonly missingEnvVars: string[];
  constructor(missingEnvVars: string[]) {
    super(
      `FAIL_CLOSED_R2_CREDENTIALS_MISSING: Private Cloudflare R2 object storage requires [${missingEnvVars.join(", ")}]. Raw evidence snapshots and production artifacts cannot fall back silently.`,
    );
    this.name = "FailClosedR2ConfigurationError";
    this.missingEnvVars = missingEnvVars;
  }
}

export class ArtifactIntegrityMismatchError extends Error {
  public readonly code = "ARTIFACT_SHA256_INTEGRITY_MISMATCH";
  constructor(objectKey: string, expectedSha256: string, actualSha256: string) {
    super(
      `ARTIFACT_SHA256_INTEGRITY_MISMATCH: Retrieved object "${objectKey}" failed post-retrieval SHA-256 verification (expected=${expectedSha256}, actual=${actualSha256}).`,
    );
    this.name = "ArtifactIntegrityMismatchError";
  }
}

export class ConditionalCreateConflictError extends Error {
  public readonly code = "CONDITIONAL_CREATE_IMMUTABLE_CONFLICT";
  constructor(objectKey: string) {
    super(
      `CONDITIONAL_CREATE_IMMUTABLE_CONFLICT: Content-addressed object "${objectKey}" already exists and cannot be overwritten (If-None-Match: *).`,
    );
    this.name = "ConditionalCreateConflictError";
  }
}

export type ArtifactCategoryV03 =
  | "raw_source_captures"
  | "compiled_ir_bundles"
  | "candidate_universes"
  | "signed_jws_receipts"
  | "shadow_authorizations";

export interface ContentAddressedWriteResult {
  objectKey: string;
  sha256Hex: string;
  sha256Base64: string;
  byteLength: number;
  contentType: string;
  isPrivateCapture: boolean;
  conditionalCreateApplied: boolean;
  alreadyExistedIdempotent: boolean;
  retentionMode: "COMPLIANCE" | "GOVERNANCE" | "BUCKET_DEFAULT_POLICY";
  retainUntilIso: string | null;
  backendName: "cloudflare_r2_private_s3" | "test_only_non_r2_memory" | "test_only_non_r2_neon_blob";
  backendClass: "production_private_object_store" | "test_only_non_r2";
}

export interface ContentAddressedReadResult {
  objectKey: string;
  sha256Hex: string;
  verifiedPostRetrieval: true;
  byteLength: number;
  contentType: string;
  bodyBytes: Uint8Array;
  bodyText: string;
  backendName: "cloudflare_r2_private_s3" | "test_only_non_r2_memory" | "test_only_non_r2_neon_blob";
  backendClass: "production_private_object_store" | "test_only_non_r2";
}

export interface PrivateArtifactObjectStore {
  readonly backendName:
    | "cloudflare_r2_private_s3"
    | "test_only_non_r2_memory"
    | "test_only_non_r2_neon_blob";
  readonly backendClass: "production_private_object_store" | "test_only_non_r2";
  putContentAddressedArtifact(params: {
    category: ArtifactCategoryV03;
    body: string | Uint8Array;
    contentType?: string;
    extension?: string;
    retentionDays?: number;
  }): Promise<ContentAddressedWriteResult>;
  getAndVerifyArtifact(params: {
    objectKey: string;
    expectedSha256Hex: string;
  }): Promise<ContentAddressedReadResult | null>;
}

export function buildContentAddressedKey(params: {
  category: ArtifactCategoryV03;
  sha256Hex: string;
  extension?: string;
}): string {
  const ext = (params.extension ?? "json").replace(/^\.+/, "");
  return `v03/${params.category}/sha256/${params.sha256Hex}.${ext}`;
}

export interface R2CredentialInspection {
  configured: boolean;
  missingEnvVars: string[];
  separateReadWritePermissionsConfigured: boolean;
  objectLockEnabled: boolean;
  bucketName: string | null;
  accountId: string | null;
}

export function inspectR2CredentialsFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): R2CredentialInspection {
  const accountId = env.R2_ACCOUNT_ID?.trim() || null;
  const bucketName = env.R2_BUCKET_NAME?.trim() || null;
  const readKey = env.R2_READ_ACCESS_KEY_ID?.trim() || env.R2_ACCESS_KEY_ID?.trim() || null;
  const readSecret =
    env.R2_READ_SECRET_ACCESS_KEY?.trim() || env.R2_SECRET_ACCESS_KEY?.trim() || null;
  const writeKey = env.R2_WRITE_ACCESS_KEY_ID?.trim() || env.R2_ACCESS_KEY_ID?.trim() || null;
  const writeSecret =
    env.R2_WRITE_SECRET_ACCESS_KEY?.trim() || env.R2_SECRET_ACCESS_KEY?.trim() || null;

  const missing: string[] = [];
  if (!accountId) missing.push("R2_ACCOUNT_ID");
  if (!bucketName) missing.push("R2_BUCKET_NAME");
  if (!readKey) missing.push("R2_READ_ACCESS_KEY_ID (or R2_ACCESS_KEY_ID)");
  if (!readSecret) missing.push("R2_READ_SECRET_ACCESS_KEY (or R2_SECRET_ACCESS_KEY)");
  if (!writeKey) missing.push("R2_WRITE_ACCESS_KEY_ID (or R2_ACCESS_KEY_ID)");
  if (!writeSecret) missing.push("R2_WRITE_SECRET_ACCESS_KEY (or R2_SECRET_ACCESS_KEY)");

  const separateReadWritePermissionsConfigured = Boolean(
    env.R2_READ_ACCESS_KEY_ID?.trim() &&
      env.R2_WRITE_ACCESS_KEY_ID?.trim() &&
      env.R2_READ_ACCESS_KEY_ID.trim() !== env.R2_WRITE_ACCESS_KEY_ID.trim(),
  );

  return {
    configured: missing.length === 0,
    missingEnvVars: missing,
    separateReadWritePermissionsConfigured,
    objectLockEnabled: env.R2_OBJECT_LOCK_ENABLED === "1",
    bucketName,
    accountId,
  };
}

/**
 * Private Cloudflare R2 Object Store implementation using `@aws-sdk/client-s3`.
 *
 * Supports separate S3Client instances for read (`readerClient`) and write (`writerClient`)
 * credentials, conditional create (`IfNoneMatch: "*"`), SHA-256 checksum header verification,
 * post-retrieval SHA-256 verification, and WORM retention lock headers.
 */
export class CloudflareR2PrivateArtifactStore implements PrivateArtifactObjectStore {
  public readonly backendName = "cloudflare_r2_private_s3" as const;
  public readonly backendClass = "production_private_object_store" as const;
  private readonly bucketName: string;
  private readonly readerClient: S3Client;
  private readonly writerClient: S3Client;
  private readonly objectLockEnabled: boolean;

  constructor(options?: {
    bucketName?: string;
    accountId?: string;
    readerClient?: S3Client;
    writerClient?: S3Client;
    objectLockEnabled?: boolean;
    env?: NodeJS.ProcessEnv;
  }) {
    if (options?.readerClient && options?.writerClient && options?.bucketName) {
      this.bucketName = options.bucketName;
      this.readerClient = options.readerClient;
      this.writerClient = options.writerClient;
      this.objectLockEnabled = options.objectLockEnabled ?? true;
      return;
    }

    const env = options?.env ?? process.env;
    const inspection = inspectR2CredentialsFromEnv(env);
    if (!inspection.configured) {
      throw new FailClosedR2ConfigurationError(inspection.missingEnvVars);
    }

    const endpoint = `https://${inspection.accountId}.r2.cloudflarestorage.com`;
    this.bucketName = inspection.bucketName!;
    this.objectLockEnabled = options?.objectLockEnabled ?? inspection.objectLockEnabled;

    const readAccessKeyId = (env.R2_READ_ACCESS_KEY_ID ?? env.R2_ACCESS_KEY_ID)!.trim();
    const readSecretAccessKey = (
      env.R2_READ_SECRET_ACCESS_KEY ?? env.R2_SECRET_ACCESS_KEY
    )!.trim();
    const writeAccessKeyId = (env.R2_WRITE_ACCESS_KEY_ID ?? env.R2_ACCESS_KEY_ID)!.trim();
    const writeSecretAccessKey = (
      env.R2_WRITE_SECRET_ACCESS_KEY ?? env.R2_SECRET_ACCESS_KEY
    )!.trim();

    this.readerClient = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId: readAccessKeyId,
        secretAccessKey: readSecretAccessKey,
      },
    });

    this.writerClient = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId: writeAccessKeyId,
        secretAccessKey: writeSecretAccessKey,
      },
    });
  }

  async putContentAddressedArtifact(params: {
    category: ArtifactCategoryV03;
    body: string | Uint8Array;
    contentType?: string;
    extension?: string;
    retentionDays?: number;
  }): Promise<ContentAddressedWriteResult> {
    const bodyBytes =
      typeof params.body === "string"
        ? new Uint8Array(Buffer.from(params.body, "utf8"))
        : params.body;
    const sha256Hex = sha256HexFull(bodyBytes);
    const sha256Base64 = crypto.createHash("sha256").update(bodyBytes).digest("base64");
    const objectKey = buildContentAddressedKey({
      category: params.category,
      sha256Hex,
      extension: params.extension,
    });
    const contentType = params.contentType ?? "application/json";
    const retentionDays = params.retentionDays ?? 3650;
    const retainUntilDate = new Date(Date.now() + retentionDays * 86400_000);

    try {
      await this.writerClient.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: objectKey,
          Body: bodyBytes,
          ContentType: contentType,
          IfNoneMatch: "*",
          ChecksumAlgorithm: "SHA256",
          ChecksumSHA256: sha256Base64,
          ...(this.objectLockEnabled
            ? {
                ObjectLockMode: "COMPLIANCE",
                ObjectLockRetainUntilDate: retainUntilDate,
              }
            : {}),
          Metadata: {
            "x-dcc-sha256": sha256Hex,
            "x-dcc-private-boundary": "strict-private",
          },
        }),
      );

      return {
        objectKey,
        sha256Hex,
        sha256Base64,
        byteLength: bodyBytes.byteLength,
        contentType,
        isPrivateCapture: params.category === "raw_source_captures",
        conditionalCreateApplied: true,
        alreadyExistedIdempotent: false,
        retentionMode: this.objectLockEnabled ? "COMPLIANCE" : "BUCKET_DEFAULT_POLICY",
        retainUntilIso: this.objectLockEnabled ? retainUntilDate.toISOString() : null,
        backendName: this.backendName,
        backendClass: this.backendClass,
      };
    } catch (err: any) {
      const statusCode = err?.$metadata?.httpStatusCode;
      const errName = String(err?.name ?? err?.Code ?? "");
      if (statusCode === 412 || errName.includes("PreconditionFailed")) {
        // Content-addressed key already exists; verify its existing checksum via HeadObject
        const head = await this.readerClient.send(
          new HeadObjectCommand({
            Bucket: this.bucketName,
            Key: objectKey,
          }),
        );
        const existingSha256 = head.Metadata?.["x-dcc-sha256"];
        if (existingSha256 && existingSha256 !== sha256Hex) {
          throw new ConditionalCreateConflictError(objectKey);
        }
        return {
          objectKey,
          sha256Hex,
          sha256Base64,
          byteLength: bodyBytes.byteLength,
          contentType,
          isPrivateCapture: params.category === "raw_source_captures",
          conditionalCreateApplied: true,
          alreadyExistedIdempotent: true,
          retentionMode: this.objectLockEnabled ? "COMPLIANCE" : "BUCKET_DEFAULT_POLICY",
          retainUntilIso: this.objectLockEnabled ? retainUntilDate.toISOString() : null,
          backendName: this.backendName,
          backendClass: this.backendClass,
        };
      }
      throw err;
    }
  }

  async getAndVerifyArtifact(params: {
    objectKey: string;
    expectedSha256Hex: string;
  }): Promise<ContentAddressedReadResult | null> {
    try {
      const res = await this.readerClient.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: params.objectKey,
        }),
      );
      if (!res.Body) return null;
      const byteArr = await res.Body.transformToByteArray();
      const actualSha256Hex = sha256HexFull(byteArr);
      if (actualSha256Hex !== params.expectedSha256Hex) {
        throw new ArtifactIntegrityMismatchError(
          params.objectKey,
          params.expectedSha256Hex,
          actualSha256Hex,
        );
      }
      return {
        objectKey: params.objectKey,
        sha256Hex: actualSha256Hex,
        verifiedPostRetrieval: true,
        byteLength: byteArr.byteLength,
        contentType: res.ContentType ?? "application/json",
        bodyBytes: byteArr,
        bodyText: Buffer.from(byteArr).toString("utf8"),
        backendName: this.backendName,
        backendClass: this.backendClass,
      };
    } catch (err: any) {
      if (err instanceof ArtifactIntegrityMismatchError) {
        throw err;
      }
      if (err?.name === "NoSuchKey" || err?.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw err;
    }
  }
}

/**
 * Explicitly non-R2 test backend for local/preview tests when Cloudflare R2 credentials are not present.
 * Never labeled as R2 or production object storage.
 */
export class InMemoryTestArtifactStore implements PrivateArtifactObjectStore {
  public readonly backendName = "test_only_non_r2_memory" as const;
  public readonly backendClass = "test_only_non_r2" as const;
  private readonly blobs = new Map<
    string,
    {
      sha256Hex: string;
      contentType: string;
      bodyBytes: Uint8Array;
      retainUntilIso: string | null;
    }
  >();

  async putContentAddressedArtifact(params: {
    category: ArtifactCategoryV03;
    body: string | Uint8Array;
    contentType?: string;
    extension?: string;
    retentionDays?: number;
  }): Promise<ContentAddressedWriteResult> {
    const bodyBytes =
      typeof params.body === "string"
        ? new Uint8Array(Buffer.from(params.body, "utf8"))
        : new Uint8Array(params.body);
    const sha256Hex = sha256HexFull(bodyBytes);
    const sha256Base64 = crypto.createHash("sha256").update(bodyBytes).digest("base64");
    const objectKey = buildContentAddressedKey({
      category: params.category,
      sha256Hex,
      extension: params.extension,
    });
    const contentType = params.contentType ?? "application/json";
    const retainUntilIso = new Date(
      Date.now() + (params.retentionDays ?? 3650) * 86400_000,
    ).toISOString();

    const existing = this.blobs.get(objectKey);
    if (existing) {
      if (existing.sha256Hex !== sha256Hex) {
        throw new ConditionalCreateConflictError(objectKey);
      }
      return {
        objectKey,
        sha256Hex,
        sha256Base64,
        byteLength: bodyBytes.byteLength,
        contentType,
        isPrivateCapture: params.category === "raw_source_captures",
        conditionalCreateApplied: true,
        alreadyExistedIdempotent: true,
        retentionMode: "COMPLIANCE",
        retainUntilIso: existing.retainUntilIso,
        backendName: this.backendName,
        backendClass: this.backendClass,
      };
    }

    this.blobs.set(objectKey, {
      sha256Hex,
      contentType,
      bodyBytes,
      retainUntilIso,
    });

    return {
      objectKey,
      sha256Hex,
      sha256Base64,
      byteLength: bodyBytes.byteLength,
      contentType,
      isPrivateCapture: params.category === "raw_source_captures",
      conditionalCreateApplied: true,
      alreadyExistedIdempotent: false,
      retentionMode: "COMPLIANCE",
      retainUntilIso,
      backendName: this.backendName,
      backendClass: this.backendClass,
    };
  }

  async getAndVerifyArtifact(params: {
    objectKey: string;
    expectedSha256Hex: string;
  }): Promise<ContentAddressedReadResult | null> {
    const entry = this.blobs.get(params.objectKey);
    if (!entry) return null;
    const actualSha256Hex = sha256HexFull(entry.bodyBytes);
    if (actualSha256Hex !== params.expectedSha256Hex) {
      throw new ArtifactIntegrityMismatchError(
        params.objectKey,
        params.expectedSha256Hex,
        actualSha256Hex,
      );
    }
    return {
      objectKey: params.objectKey,
      sha256Hex: actualSha256Hex,
      verifiedPostRetrieval: true,
      byteLength: entry.bodyBytes.byteLength,
      contentType: entry.contentType,
      bodyBytes: entry.bodyBytes,
      bodyText: Buffer.from(entry.bodyBytes).toString("utf8"),
      backendName: this.backendName,
      backendClass: this.backendClass,
    };
  }

  /**
   * Test-only helper to simulate bit-rot / underlying storage tampering and prove
   * `getAndVerifyArtifact` fails closed with `ArtifactIntegrityMismatchError`.
   */
  simulateUnderlyingTamperingForTest(objectKey: string): void {
    const entry = this.blobs.get(objectKey);
    if (entry) {
      entry.bodyBytes = new Uint8Array(Buffer.from("tampered-bytes", "utf8"));
    }
  }
}
