import crypto from "node:crypto";
import { sha256HexFull } from "./rfc8785AndJws";

export interface PutObjectCommandInput {
  Bucket: string;
  Key: string;
  Body: Uint8Array | string;
  ContentType?: string;
  IfNoneMatch?: string;
  ChecksumAlgorithm?: "SHA256";
  ChecksumSHA256?: string;
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

export interface DeleteObjectCommandInput {
  Bucket: string;
  Key: string;
}

export class DeleteObjectCommand {
  public readonly input: DeleteObjectCommandInput;
  constructor(input: DeleteObjectCommandInput) {
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
    command:
      | PutObjectCommand
      | GetObjectCommand
      | HeadObjectCommand
      | DeleteObjectCommand,
  ): Promise<any> {
    const method =
      command instanceof PutObjectCommand
        ? "PUT"
        : command instanceof HeadObjectCommand
          ? "HEAD"
          : command instanceof DeleteObjectCommand
            ? "DELETE"
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
      if (res.status === 403) {
        err.name = "AccessDenied";
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
 * DCC Machine Layer v0.3.1 — Storage Boundary & Cloudflare-Native R2 Bucket Lock Policy
 *
 * Implements v0.3.1 Requirement 1 & 2:
 * - Zero reliance on unsupported AWS S3 Object Lock headers.
 * - Cloudflare-native prefix-scoped Bucket Lock rules managed via Cloudflare R2 REST API
 *   (`PUT /accounts/{account_id}/r2/buckets/{bucket_name}/lock`) or Wrangler CLI
 *   (`wrangler r2 bucket lock add`).
 * - Dedicated canary prefix (`v03/canary_retention_test/`) with a finite 24-hour lock for
 *   non-destructive retention verification before applying production prefix locks.
 * - Never applies an indefinite lock to the entire bucket or to raw source captures
 *   (`v03/raw_source_captures/`), preserving privacy, legal, and licensing deletion capability.
 * - Retains content-addressed keys, conditional `If-None-Match: *`, application-level SHA-256,
 *   read-back hash verification, separate read/write scopes, and private bucket configuration.
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

export class R2PrefixRetentionLockedError extends Error {
  public readonly code = "R2_PREFIX_RETENTION_LOCKED";
  constructor(objectKey: string, prefix: string, retainUntilIso: string) {
    super(
      `R2_PREFIX_RETENTION_LOCKED: Object "${objectKey}" under locked prefix "${prefix}" cannot be overwritten or deleted before ${retainUntilIso}.`,
    );
    this.name = "R2PrefixRetentionLockedError";
  }
}

export type ArtifactCategoryV03 =
  | "raw_source_captures"
  | "compiled_ir_bundles"
  | "candidate_universes"
  | "signed_jws_receipts"
  | "shadow_authorizations"
  | "public_evidence_projections"
  | "quarantine_staging"
  | "integration_tests"
  | "canary_retention_test";

export type R2PrefixRetentionMode =
  | "cloudflare_r2_prefix_finite_lock"
  | "bounded_deletable_for_privacy_legal_takedown"
  | "ephemeral_quarantine_ttl"
  | "ephemeral_test_ttl";

export interface R2PrefixRetentionPolicy {
  category: ArtifactCategoryV03;
  ruleId: string;
  prefix: `v03/${ArtifactCategoryV03}/`;
  lockEnabled: boolean;
  indefiniteLock: false;
  wholeBucketLock: false;
  retentionMode: R2PrefixRetentionMode;
  lockDurationSeconds: number | null;
  lockDurationDays: number | null;
  lifecycleDeleteAfterDays: number | null;
  allowsLegalOrPrivacyTakedown: boolean;
  rationale: string;
}

export const R2_PREFIX_RETENTION_POLICIES: Record<
  ArtifactCategoryV03,
  R2PrefixRetentionPolicy
> = {
  canary_retention_test: {
    category: "canary_retention_test",
    ruleId: "dcc-v031-canary-retention-24h",
    prefix: "v03/canary_retention_test/",
    lockEnabled: true,
    indefiniteLock: false,
    wholeBucketLock: false,
    retentionMode: "cloudflare_r2_prefix_finite_lock",
    lockDurationSeconds: 86_400,
    lockDurationDays: 1,
    lifecycleDeleteAfterDays: 7,
    allowsLegalOrPrivacyTakedown: false,
    rationale:
      "Dedicated canary prefix with a short finite 24-hour Cloudflare R2 bucket lock to verify overwrite/delete rejection before applying longer prefix locks.",
  },
  compiled_ir_bundles: {
    category: "compiled_ir_bundles",
    ruleId: "dcc-v031-compiled-bundles-365d",
    prefix: "v03/compiled_ir_bundles/",
    lockEnabled: true,
    indefiniteLock: false,
    wholeBucketLock: false,
    retentionMode: "cloudflare_r2_prefix_finite_lock",
    lockDurationSeconds: 365 * 86_400,
    lockDurationDays: 365,
    lifecycleDeleteAfterDays: null,
    allowsLegalOrPrivacyTakedown: false,
    rationale:
      "Immutable compiled Decision IR bundles pinned by receipts require finite 365-day retention for deterministic replay.",
  },
  candidate_universes: {
    category: "candidate_universes",
    ruleId: "dcc-v031-candidate-universes-365d",
    prefix: "v03/candidate_universes/",
    lockEnabled: true,
    indefiniteLock: false,
    wholeBucketLock: false,
    retentionMode: "cloudflare_r2_prefix_finite_lock",
    lockDurationSeconds: 365 * 86_400,
    lockDurationDays: 365,
    lifecycleDeleteAfterDays: null,
    allowsLegalOrPrivacyTakedown: false,
    rationale:
      "Content-addressed CandidateUniverse manifests pinned by receipts require finite 365-day retention.",
  },
  signed_jws_receipts: {
    category: "signed_jws_receipts",
    ruleId: "dcc-v031-signed-receipts-365d",
    prefix: "v03/signed_jws_receipts/",
    lockEnabled: true,
    indefiniteLock: false,
    wholeBucketLock: false,
    retentionMode: "cloudflare_r2_prefix_finite_lock",
    lockDurationSeconds: 365 * 86_400,
    lockDurationDays: 365,
    lifecycleDeleteAfterDays: null,
    allowsLegalOrPrivacyTakedown: false,
    rationale:
      "Signed JWS decision receipts require finite 365-day audit retention.",
  },
  shadow_authorizations: {
    category: "shadow_authorizations",
    ruleId: "dcc-v031-shadow-authorizations-90d",
    prefix: "v03/shadow_authorizations/",
    lockEnabled: true,
    indefiniteLock: false,
    wholeBucketLock: false,
    retentionMode: "cloudflare_r2_prefix_finite_lock",
    lockDurationSeconds: 90 * 86_400,
    lockDurationDays: 90,
    lifecycleDeleteAfterDays: null,
    allowsLegalOrPrivacyTakedown: false,
    rationale:
      "Short-lived shadow DecisionAuthorization envelopes retained for 90-day audit review.",
  },
  public_evidence_projections: {
    category: "public_evidence_projections",
    ruleId: "dcc-v031-public-evidence-180d",
    prefix: "v03/public_evidence_projections/",
    lockEnabled: true,
    indefiniteLock: false,
    wholeBucketLock: false,
    retentionMode: "cloudflare_r2_prefix_finite_lock",
    lockDurationSeconds: 180 * 86_400,
    lockDurationDays: 180,
    lifecycleDeleteAfterDays: null,
    allowsLegalOrPrivacyTakedown: false,
    rationale:
      "Sanitized public citation projections (selector/quote/hash metadata only, never raw third-party HTML) retained for 180 days.",
  },
  raw_source_captures: {
    category: "raw_source_captures",
    ruleId: "dcc-v031-raw-captures-no-indefinite-lock",
    prefix: "v03/raw_source_captures/",
    lockEnabled: false,
    indefiniteLock: false,
    wholeBucketLock: false,
    retentionMode: "bounded_deletable_for_privacy_legal_takedown",
    lockDurationSeconds: null,
    lockDurationDays: null,
    lifecycleDeleteAfterDays: 90,
    allowsLegalOrPrivacyTakedown: true,
    rationale:
      "Private raw source captures are protected against accidental overwrite via content-addressed keys and If-None-Match: *, but are NEVER locked with an R2 bucket lock so privacy, legal, or licensing takedowns can always delete raw captures.",
  },
  quarantine_staging: {
    category: "quarantine_staging",
    ruleId: "dcc-v031-quarantine-staging-7d-ttl",
    prefix: "v03/quarantine_staging/",
    lockEnabled: false,
    indefiniteLock: false,
    wholeBucketLock: false,
    retentionMode: "ephemeral_quarantine_ttl",
    lockDurationSeconds: null,
    lockDurationDays: null,
    lifecycleDeleteAfterDays: 7,
    allowsLegalOrPrivacyTakedown: true,
    rationale:
      "Unverified quarantine staging objects expire automatically after 7 days and are never bucket-locked.",
  },
  integration_tests: {
    category: "integration_tests",
    ruleId: "dcc-v031-integration-tests-1d-ttl",
    prefix: "v03/integration_tests/",
    lockEnabled: false,
    indefiniteLock: false,
    wholeBucketLock: false,
    retentionMode: "ephemeral_test_ttl",
    lockDurationSeconds: null,
    lockDurationDays: null,
    lifecycleDeleteAfterDays: 1,
    allowsLegalOrPrivacyTakedown: true,
    rationale:
      "Integration test objects expire after 24 hours and are never locked.",
  },
};

export interface CloudflareR2BucketLockRule {
  id: string;
  enabled: boolean;
  prefix: string;
  condition: {
    type: "Age";
    maxAgeSeconds: number;
  };
}

/**
 * Builds and validates Cloudflare-native R2 bucket lock rules (`PUT /accounts/{account_id}/r2/buckets/{bucket_name}/lock`)
 * and equivalent Wrangler CLI commands (`wrangler r2 bucket lock add`).
 *
 * Enforces safety invariants:
 * 1. Never locks the entire bucket (`prefix` must be a non-empty `v03/<category>/` prefix).
 * 2. Never uses `type: "Indefinite"`.
 * 3. Never locks `v03/raw_source_captures/`, `v03/quarantine_staging/`, or `v03/integration_tests/`.
 */
export class CloudflareR2BucketLockManager {
  public static buildCloudflareBucketLockPayload(
    options?: { canaryOnly?: boolean },
  ): {
    rules: CloudflareR2BucketLockRule[];
    wranglerCommands: string[];
  } {
    const policies = Object.values(R2_PREFIX_RETENTION_POLICIES).filter((p) => {
      if (!p.lockEnabled) return false;
      if (options?.canaryOnly) {
        return p.category === "canary_retention_test";
      }
      return true;
    });

    const rules: CloudflareR2BucketLockRule[] = [];
    const wranglerCommands: string[] = [];

    for (const policy of policies) {
      const pfx = String(policy.prefix);
      if (!pfx || pfx === "/" || !pfx.startsWith("v03/")) {
        throw new Error(
          `UNSAFE_R2_BUCKET_LOCK_PREFIX: Refusing whole-bucket or root prefix "${policy.prefix}".`,
        );
      }
      if (policy.category === "raw_source_captures") {
        throw new Error(
          "UNSAFE_R2_RAW_CAPTURE_LOCK: Refusing to apply R2 bucket lock to raw_source_captures.",
        );
      }
      if (!policy.lockDurationSeconds || policy.lockDurationSeconds <= 0) {
        throw new Error(`Invalid lockDurationSeconds for ${policy.category}`);
      }

      rules.push({
        id: policy.ruleId,
        enabled: true,
        prefix: policy.prefix,
        condition: {
          type: "Age",
          maxAgeSeconds: policy.lockDurationSeconds,
        },
      });

      wranglerCommands.push(
        `npx wrangler r2 bucket lock add <BUCKET_NAME> --name ${policy.ruleId} --prefix ${policy.prefix} --retention-days ${policy.lockDurationDays}`,
      );
    }

    return { rules, wranglerCommands };
  }

  public static validateCustomLockRules(
    rules: Array<{
      id: string;
      prefix?: string;
      condition: { type: string; maxAgeSeconds?: number };
    }>,
  ): { valid: boolean; reason?: string } {
    for (const rule of rules) {
      if (!rule.prefix || rule.prefix.trim() === "" || rule.prefix.trim() === "/") {
        return {
          valid: false,
          reason: `WHOLE_BUCKET_LOCK_FORBIDDEN: Rule "${rule.id}" has empty/root prefix.`,
        };
      }
      if (rule.condition.type === "Indefinite") {
        return {
          valid: false,
          reason: `INDEFINITE_LOCK_FORBIDDEN: Rule "${rule.id}" uses Indefinite retention.`,
        };
      }
      if (rule.prefix.startsWith("v03/raw_source_captures")) {
        return {
          valid: false,
          reason: `RAW_CAPTURE_LOCK_FORBIDDEN: Rule "${rule.id}" attempts to lock raw_source_captures.`,
        };
      }
    }
    return { valid: true };
  }

  public static async applyBucketLockRulesViaCloudflareApi(params: {
    accountId: string;
    bucketName: string;
    apiToken: string;
    canaryOnly?: boolean;
    fetchImpl?: typeof fetch;
  }): Promise<{
    applied: boolean;
    endpoint: string;
    rules: CloudflareR2BucketLockRule[];
    httpStatus: number;
  }> {
    const { rules } = CloudflareR2BucketLockManager.buildCloudflareBucketLockPayload({
      canaryOnly: params.canaryOnly,
    });
    const validation = CloudflareR2BucketLockManager.validateCustomLockRules(rules);
    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(
      params.accountId,
    )}/r2/buckets/${encodeURIComponent(params.bucketName)}/lock`;
    const fetchFn = params.fetchImpl ?? fetch;
    const res = await fetchFn(endpoint, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${params.apiToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ rules }),
    });
    if (!res.ok) {
      throw new Error(
        `Cloudflare R2 bucket lock API failed with HTTP ${res.status}: ${await res.text()}`,
      );
    }
    return {
      applied: true,
      endpoint,
      rules,
      httpStatus: res.status,
    };
  }
}

export interface ContentAddressedWriteResult {
  objectKey: string;
  sha256Hex: string;
  sha256Base64: string;
  byteLength: number;
  contentType: string;
  isPrivateCapture: boolean;
  conditionalCreateApplied: boolean;
  alreadyExistedIdempotent: boolean;
  retentionMode: R2PrefixRetentionMode;
  prefixRuleId: string;
  retainUntilIso: string | null;
  allowsLegalOrPrivacyTakedown: boolean;
  backendName:
    | "cloudflare_r2_private_s3"
    | "test_only_non_r2_memory"
    | "test_only_non_r2_neon_blob";
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
  backendName:
    | "cloudflare_r2_private_s3"
    | "test_only_non_r2_memory"
    | "test_only_non_r2_neon_blob";
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
  deleteArtifactIfPermitted?(params: {
    objectKey: string;
    reason: string;
  }): Promise<{ deleted: boolean; objectKey: string }>;
}

export function buildContentAddressedKey(params: {
  category: ArtifactCategoryV03;
  sha256Hex: string;
  extension?: string;
}): string {
  const ext = (params.extension ?? "json").replace(/^\.+/, "");
  return `v03/${params.category}/sha256/${params.sha256Hex}.${ext}`;
}

export function resolvePrefixRetentionPolicyForKey(
  objectKey: string,
): R2PrefixRetentionPolicy {
  for (const policy of Object.values(R2_PREFIX_RETENTION_POLICIES)) {
    if (objectKey.startsWith(policy.prefix)) {
      return policy;
    }
  }
  return R2_PREFIX_RETENTION_POLICIES.raw_source_captures;
}

export interface R2CredentialInspection {
  configured: boolean;
  missingEnvVars: string[];
  separateReadWritePermissionsConfigured: boolean;
  cloudflareApiTokenConfigured: boolean;
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
  const cfApiToken = env.CLOUDFLARE_API_TOKEN?.trim() || null;

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
    cloudflareApiTokenConfigured: Boolean(cfApiToken),
    bucketName,
    accountId,
  };
}

/**
 * Private Cloudflare R2 Object Store implementation using S3-compatible API for object I/O
 * and Cloudflare-native prefix bucket lock rules for retention.
 *
 * Does NOT send unsupported AWS S3 Object Lock headers.
 * Uses:
 * - Separate S3Client instances for read (`readerClient`) and write (`writerClient`) credentials
 * - Content-addressed keys (`v03/<category>/sha256/<64-hex>.<ext>`)
 * - Conditional create (`IfNoneMatch: "*"`)
 * - SHA-256 checksum header verification (`x-amz-checksum-sha256`)
 * - Mandatory post-retrieval SHA-256 recomputation and verification
 * - Prefix-specific retention metadata matching Cloudflare R2 bucket lock rules
 */
export class CloudflareR2PrivateArtifactStore implements PrivateArtifactObjectStore {
  public readonly backendName = "cloudflare_r2_private_s3" as const;
  public readonly backendClass = "production_private_object_store" as const;
  private readonly bucketName: string;
  private readonly readerClient: S3Client;
  private readonly writerClient: S3Client;

  constructor(options?: {
    bucketName?: string;
    accountId?: string;
    readerClient?: S3Client;
    writerClient?: S3Client;
    env?: NodeJS.ProcessEnv;
  }) {
    if (options?.readerClient && options?.writerClient && options?.bucketName) {
      this.bucketName = options.bucketName;
      this.readerClient = options.readerClient;
      this.writerClient = options.writerClient;
      return;
    }

    const env = options?.env ?? process.env;
    const inspection = inspectR2CredentialsFromEnv(env);
    if (!inspection.configured) {
      throw new FailClosedR2ConfigurationError(inspection.missingEnvVars);
    }

    const endpoint = `https://${inspection.accountId}.r2.cloudflarestorage.com`;
    this.bucketName = inspection.bucketName!;

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
    const policy = R2_PREFIX_RETENTION_POLICIES[params.category];
    const effectiveLockSeconds =
      policy.lockEnabled && policy.lockDurationSeconds
        ? policy.lockDurationSeconds
        : null;
    const retainUntilIso = effectiveLockSeconds
      ? new Date(Date.now() + effectiveLockSeconds * 1000).toISOString()
      : null;

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
          Metadata: {
            "x-dcc-sha256": sha256Hex,
            "x-dcc-private-boundary": "strict-private",
            "x-dcc-prefix-rule-id": policy.ruleId,
            "x-dcc-retention-mode": policy.retentionMode,
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
        retentionMode: policy.retentionMode,
        prefixRuleId: policy.ruleId,
        retainUntilIso,
        allowsLegalOrPrivacyTakedown: policy.allowsLegalOrPrivacyTakedown,
        backendName: this.backendName,
        backendClass: this.backendClass,
      };
    } catch (err: any) {
      const statusCode = err?.$metadata?.httpStatusCode;
      const errName = String(err?.name ?? err?.Code ?? "");
      if (statusCode === 412 || errName.includes("PreconditionFailed")) {
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
          retentionMode: policy.retentionMode,
          prefixRuleId: policy.ruleId,
          retainUntilIso,
          allowsLegalOrPrivacyTakedown: policy.allowsLegalOrPrivacyTakedown,
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

  async deleteArtifactIfPermitted(params: {
    objectKey: string;
    reason: string;
  }): Promise<{ deleted: boolean; objectKey: string }> {
    const policy = resolvePrefixRetentionPolicyForKey(params.objectKey);
    if (policy.lockEnabled) {
      throw new R2PrefixRetentionLockedError(
        params.objectKey,
        policy.prefix,
        new Date(Date.now() + (policy.lockDurationSeconds ?? 86400) * 1000).toISOString(),
      );
    }
    await this.writerClient.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: params.objectKey,
      }),
    );
    return { deleted: true, objectKey: params.objectKey };
  }
}

/**
 * Explicitly non-R2 test backend for local/preview tests when Cloudflare R2 credentials are not present.
 * Never labeled as R2 or production object storage.
 * Enforces the exact same prefix-specific retention lock semantics and conditional create rules.
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
      policy: R2PrefixRetentionPolicy;
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
    const policy = R2_PREFIX_RETENTION_POLICIES[params.category];
    const retainUntilIso =
      policy.lockEnabled && policy.lockDurationSeconds
        ? new Date(Date.now() + policy.lockDurationSeconds * 1000).toISOString()
        : null;

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
        retentionMode: policy.retentionMode,
        prefixRuleId: policy.ruleId,
        retainUntilIso: existing.retainUntilIso,
        allowsLegalOrPrivacyTakedown: policy.allowsLegalOrPrivacyTakedown,
        backendName: this.backendName,
        backendClass: this.backendClass,
      };
    }

    this.blobs.set(objectKey, {
      sha256Hex,
      contentType,
      bodyBytes,
      retainUntilIso,
      policy,
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
      retentionMode: policy.retentionMode,
      prefixRuleId: policy.ruleId,
      retainUntilIso,
      allowsLegalOrPrivacyTakedown: policy.allowsLegalOrPrivacyTakedown,
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

  async deleteArtifactIfPermitted(params: {
    objectKey: string;
    reason: string;
  }): Promise<{ deleted: boolean; objectKey: string }> {
    const entry = this.blobs.get(params.objectKey);
    const policy = entry?.policy ?? resolvePrefixRetentionPolicyForKey(params.objectKey);
    if (policy.lockEnabled) {
      const retainUntilIso =
        entry?.retainUntilIso ??
        new Date(Date.now() + (policy.lockDurationSeconds ?? 86400) * 1000).toISOString();
      if (Date.parse(retainUntilIso) > Date.now()) {
        throw new R2PrefixRetentionLockedError(
          params.objectKey,
          policy.prefix,
          retainUntilIso,
        );
      }
    }
    const existed = this.blobs.delete(params.objectKey);
    return { deleted: existed, objectKey: params.objectKey };
  }

  /**
   * Simulates attempting a non-idempotent overwrite of an existing key under a locked prefix
   * or conditional `If-None-Match: *` and proves it is rejected.
   */
  async attemptForbiddenOverwrite(params: {
    objectKey: string;
    newBody: string | Uint8Array;
  }): Promise<never> {
    const existing = this.blobs.get(params.objectKey);
    if (existing) {
      if (
        existing.policy.lockEnabled &&
        existing.retainUntilIso &&
        Date.parse(existing.retainUntilIso) > Date.now()
      ) {
        throw new R2PrefixRetentionLockedError(
          params.objectKey,
          existing.policy.prefix,
          existing.retainUntilIso,
        );
      }
      throw new ConditionalCreateConflictError(params.objectKey);
    }
    throw new ConditionalCreateConflictError(params.objectKey);
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
