import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Deterministic canonical JSON serialization.
 * Sorts object keys recursively so SHA-256 hashes of bundles, manifests, inputs,
 * universes, receipts, results, and traces are 100% platform- and key-order-independent.
 */
export function canonicalizeValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(canonicalizeValue);
  }
  if (typeof value === "object") {
    if (value instanceof Date) {
      return value.toISOString();
    }
    const record = value as Record<string, unknown>;
    const sortedKeys = Object.keys(record).sort();
    const out: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      const val = record[key];
      if (val !== undefined) {
        out[key] = canonicalizeValue(val);
      }
    }
    return out;
  }
  return value;
}

export function canonicalJsonStringify(value: unknown): string {
  return JSON.stringify(canonicalizeValue(value));
}

export function sha256Hex(input: string | Buffer): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function hashCanonicalJson(value: unknown): string {
  return sha256Hex(canonicalJsonStringify(value));
}

export type ArtifactCategory = "bundles" | "sources" | "universes" | "receipts" | "fragments";

export class DurableStorageConfigurationError extends Error {
  public readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "DurableStorageConfigurationError";
    this.code = code;
  }
}

export const FailClosedStorageConfigurationError = DurableStorageConfigurationError;

export function resolveMachineStorageConfig(
  envOverride?: Record<string, string | undefined>,
): {
  mode: "local_fs" | "durable_neon_r2";
  isProduction: boolean;
  databaseUrl: string | null;
} {
  const env = envOverride ?? process.env;
  const vercelEnv = (env.VERCEL_ENV ?? "").trim().toLowerCase();
  const nodeEnv = (env.NODE_ENV ?? "").trim().toLowerCase();
  const isProduction =
    vercelEnv === "production" ||
    (nodeEnv === "production" && vercelEnv !== "preview" && vercelEnv !== "development");

  const rawMode = (
    env.DCC_MACHINE_STORAGE_MODE ??
    env.DCC_MACHINE_STORAGE_BACKEND ??
    (isProduction ? "durable_neon_r2" : "local_fs")
  )
    .trim()
    .toLowerCase();

  const databaseUrl =
    (
      env.DCC_MACHINE_NEON_URL ||
      env.DCC_NONPROD_DATABASE_URL ||
      env.DCC_DATABASE_URL ||
      env.DATABASE_URL ||
      env.POSTGRES_URL ||
      ""
    ).trim() || null;

  if (isProduction) {
    if (rawMode === "local_fs") {
      throw new FailClosedStorageConfigurationError(
        "FAIL_CLOSED_LOCAL_FS_FORBIDDEN_IN_PROD",
        "Production environment is configured with local_fs storage, which is forbidden. Durable storage (Neon Postgres / Cloudflare R2) is required in production.",
      );
    }
    if (!databaseUrl) {
      throw new FailClosedStorageConfigurationError(
        "FAIL_CLOSED_MISSING_NEON_DATABASE_URL",
        "Production environment requires DATABASE_URL / Neon Postgres connection string for durable storage. Failing closed.",
      );
    }
    return {
      mode: "durable_neon_r2",
      isProduction: true,
      databaseUrl,
    };
  }

  return {
    mode: rawMode === "durable_neon_r2" || rawMode === "durable_cloud" ? "durable_neon_r2" : "local_fs",
    isProduction: false,
    databaseUrl,
  };
}

export class ImmutableArtifactMutationError extends Error {
  public readonly code = "IMMUTABLE_ARTIFACT_MUTATION_FORBIDDEN";
  constructor(message: string) {
    super(message);
    this.name = "ImmutableArtifactMutationError";
  }
}

let runtimeStorageBackendOverride: "auto" | "local_fs" | "durable_cloud" | null = null;
let runtimeSimulateProdEnvironment = false;

export function setStorageBackendForTests(
  backend: "auto" | "local_fs" | "durable_cloud" | null,
  simulateProd = false,
): void {
  runtimeStorageBackendOverride = backend;
  runtimeSimulateProdEnvironment = simulateProd;
}

export function isProductionExecutionEnvironment(): boolean {
  if (runtimeSimulateProdEnvironment) return true;
  const vercelEnv = (process.env.VERCEL_ENV ?? "").trim().toLowerCase();
  const nodeEnv = (process.env.NODE_ENV ?? "").trim().toLowerCase();
  if (vercelEnv === "production") return true;
  if (nodeEnv === "production" && vercelEnv !== "preview" && vercelEnv !== "development") {
    return true;
  }
  return false;
}

export function assertStorageBackendAllowed(): "local_fs_dev" | "durable_cloud" {
  const configured =
    runtimeStorageBackendOverride ??
    ((process.env.DCC_MACHINE_STORAGE_BACKEND ?? "auto").trim().toLowerCase() as
      | "auto"
      | "local_fs"
      | "durable_cloud");

  const isProd = isProductionExecutionEnvironment();
  const hasDurableDb = Boolean(
    process.env.DCC_NONPROD_DATABASE_URL ||
      process.env.DCC_DATABASE_URL ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL,
  );
  const hasR2 = Boolean(
    process.env.DCC_MACHINE_R2_ENDPOINT &&
      process.env.DCC_MACHINE_R2_ACCESS_KEY_ID &&
      process.env.DCC_MACHINE_R2_SECRET_ACCESS_KEY &&
      process.env.DCC_MACHINE_R2_BUCKET,
  );

  if (isProd) {
    if (configured === "local_fs") {
      throw new DurableStorageConfigurationError(
        "FAIL_CLOSED_LOCAL_FS_FORBIDDEN_IN_PROD",
        "Production environment is configured with local_fs storage, which is forbidden. Durable storage (Neon Postgres / Cloudflare R2) is required in production.",
      );
    }
    if (!hasDurableDb && !hasR2) {
      throw new DurableStorageConfigurationError(
        "FAIL_CLOSED_DURABLE_STORAGE_MISSING_IN_PROD",
        "Production environment lacks durable storage credentials (Neon Postgres or Cloudflare R2). Failing closed.",
      );
    }
    return "durable_cloud";
  }

  if (configured === "durable_cloud") {
    return "durable_cloud";
  }

  return "local_fs_dev";
}

const ROOT_DIR = process.cwd();
const MACHINE_ARTIFACT_ROOT = path.join(ROOT_DIR, "data", "memory", "snapshots", "machine");

const inMemoryArtifactCache = new Map<string, { content: string; sha256: string }>();

function ensureDir(dirPath: string): boolean {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

export function writeImmutableArtifact(params: {
  category: ArtifactCategory;
  filename: string;
  content: string;
}): {
  storageUri: string;
  sha256: string;
  byteLength: number;
} {
  const mode = assertStorageBackendAllowed();
  const safeFilename = params.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const sha256 = sha256Hex(params.content);
  const byteLength = Buffer.byteLength(params.content, "utf8");
  const storageUri = `dcc-storage://data/memory/snapshots/machine/${params.category}/${safeFilename}`;

  const existing = inMemoryArtifactCache.get(storageUri);
  if (existing && existing.sha256 !== sha256) {
    throw new ImmutableArtifactMutationError(
      `Immutable artifact violation: ${storageUri} already exists with hash ${existing.sha256} (attempted ${sha256}).`,
    );
  }

  inMemoryArtifactCache.set(storageUri, { content: params.content, sha256 });

  if (mode === "local_fs_dev") {
    const targetDir = path.join(MACHINE_ARTIFACT_ROOT, params.category);
    if (ensureDir(targetDir)) {
      const fullPath = path.join(targetDir, safeFilename);
      try {
        if (fs.existsSync(fullPath)) {
          const diskContent = fs.readFileSync(fullPath, "utf8");
          const diskHash = sha256Hex(diskContent);
          if (diskHash !== sha256) {
            throw new ImmutableArtifactMutationError(
              `Immutable artifact disk violation: ${fullPath} has hash ${diskHash} != ${sha256}.`,
            );
          }
        } else {
          fs.writeFileSync(fullPath, params.content, "utf8");
        }
      } catch (err) {
        if (err instanceof ImmutableArtifactMutationError) {
          throw err;
        }
      }
    }
  }

  return {
    storageUri,
    sha256,
    byteLength,
  };
}

export function readImmutableArtifact(
  storageUri: string,
  expectedSha256?: string,
): { content: string; sha256: string } | null {
  assertStorageBackendAllowed();
  const cached = inMemoryArtifactCache.get(storageUri);
  if (cached) {
    if (expectedSha256 && cached.sha256 !== expectedSha256) {
      throw new Error(
        `Artifact integrity failure for ${storageUri}: expected ${expectedSha256}, got ${cached.sha256}`,
      );
    }
    return cached;
  }

  const prefix = "dcc-storage://data/memory/snapshots/machine/";
  if (!storageUri.startsWith(prefix)) {
    return null;
  }
  const relativePart = storageUri.slice(prefix.length);
  const fullPath = path.join(MACHINE_ARTIFACT_ROOT, ...relativePart.split("/"));
  try {
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    const content = fs.readFileSync(fullPath, "utf8");
    const sha256 = sha256Hex(content);
    if (expectedSha256 && sha256 !== expectedSha256) {
      throw new Error(
        `Artifact integrity failure for ${storageUri}: expected ${expectedSha256}, got ${sha256}`,
      );
    }
    const entry = { content, sha256 };
    inMemoryArtifactCache.set(storageUri, entry);
    return entry;
  } catch (err) {
    if (err instanceof Error && err.message.includes("Artifact integrity failure")) {
      throw err;
    }
    return null;
  }
}

export function clearInMemoryArtifactCacheForTests(): void {
  inMemoryArtifactCache.clear();
}
