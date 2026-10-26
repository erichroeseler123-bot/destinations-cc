import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Deterministic canonical JSON serialization.
 * Sorts object keys recursively so SHA-256 hashes of bundles, manifests, inputs,
 * results, and traces are 100% platform- and key-order-independent.
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

/**
 * Uses the repository's existing snapshot storage directory (`data/memory/snapshots/machine`)
 * for immutable source snapshots and compiled engine bundles, avoiding any second storage vendor.
 */
const ROOT_DIR = process.cwd();
const MACHINE_ARTIFACT_ROOT = path.join(ROOT_DIR, "data", "memory", "snapshots", "machine");
const BUNDLE_ARTIFACT_DIR = path.join(MACHINE_ARTIFACT_ROOT, "bundles");
const SNAPSHOT_ARTIFACT_DIR = path.join(MACHINE_ARTIFACT_ROOT, "sources");

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
  category: "bundles" | "sources";
  filename: string;
  content: string;
}): {
  storageUri: string;
  sha256: string;
  byteLength: number;
} {
  const safeFilename = params.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const sha256 = sha256Hex(params.content);
  const byteLength = Buffer.byteLength(params.content, "utf8");
  const storageUri = `dcc-storage://data/memory/snapshots/machine/${params.category}/${safeFilename}`;

  const existing = inMemoryArtifactCache.get(storageUri);
  if (existing && existing.sha256 !== sha256) {
    throw new Error(
      `Immutable artifact violation: ${storageUri} already exists with hash ${existing.sha256} (attempted ${sha256}).`,
    );
  }

  inMemoryArtifactCache.set(storageUri, { content: params.content, sha256 });

  const targetDir = params.category === "bundles" ? BUNDLE_ARTIFACT_DIR : SNAPSHOT_ARTIFACT_DIR;
  if (ensureDir(targetDir)) {
    const fullPath = path.join(targetDir, safeFilename);
    try {
      if (fs.existsSync(fullPath)) {
        const diskContent = fs.readFileSync(fullPath, "utf8");
        const diskHash = sha256Hex(diskContent);
        if (diskHash !== sha256) {
          throw new Error(
            `Immutable artifact disk violation: ${fullPath} has hash ${diskHash} != ${sha256}.`,
          );
        }
      } else {
        fs.writeFileSync(fullPath, params.content, "utf8");
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("Immutable artifact")) {
        throw err;
      }
      // Read-only serverless filesystem fallback uses inMemoryArtifactCache
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
