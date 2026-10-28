import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  getStandardJwksDocument,
  rfc8785Canonicalize,
  sha256HexFull,
  verifyRfc8785ConformanceVectors,
} from "./rfc8785AndJws";
import { inspectR2CredentialsFromEnv } from "./storageBoundary";

/**
 * DCC Machine Layer v0.3 — Standard Machine Discovery, API Catalog, MCP Tools,
 * Verification Docs, Language-Neutral Conformance Fixtures, and Build Provenance
 *
 * Implements Requirements 9 and 12:
 * - `/.well-known/dcc` (v0.3)
 * - `/.well-known/api-catalog` (RFC 9264 `application/linkset+json`)
 * - `/.well-known/jwks.json` (RFC 7517 standard JWKS)
 * - `/.well-known/mcp.json` & `/api/v1/mcp` (Model Context Protocol discovery & tools)
 * - `/api/v1/docs/citation-verification`
 * - `/api/v1/docs/receipt-verification`
 * - `/api/v1/conformance/fixtures`
 * - Non-self-referential build/deployment provenance (`getDeploymentProvenanceV03`)
 * - Strictly excludes A2A (`/.well-known/agent-card.json`) because DCC is not an
 *   asynchronous delegated agent.
 */

export const DCC_V03_SITE_URL = "https://www.destinationcommandcenter.com";

export const DCC_V03_JSON_SCHEMAS = {
  SignedDecisionReceiptV03: {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `${DCC_V03_SITE_URL}/schemas/dcc-decision-receipt-v0.3.json`,
    title: "DCC Standardized JWS Signed Decision Receipt v0.3",
    type: "object",
    required: [
      "objectType",
      "spec",
      "receiptId",
      "executionClass",
      "isSynthetic",
      "kid",
      "alg",
      "typ",
      "jku",
      "issuedAt",
      "rfc8785CanonicalPayload",
      "rfc8785PayloadSha256",
      "jwsCompact",
      "payload",
    ],
    properties: {
      objectType: { const: "DecisionReceipt" },
      spec: { const: "dcc-decision-receipt/0.3" },
      receiptId: { type: "string", pattern: "^rcpt:(sim:)?sha256:[0-9a-f]{64}$" },
      alg: { const: "EdDSA" },
      typ: { const: "application/dcc-decision-receipt+jws" },
    },
  },
  CandidateUniverseV03: {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `${DCC_V03_SITE_URL}/schemas/dcc-candidate-universe-v0.3.json`,
    title: "DCC Declared Candidate Universe v0.3",
    type: "object",
    required: [
      "objectType",
      "spec",
      "universeId",
      "version",
      "engineId",
      "engineVersion",
      "isSynthetic",
      "scope",
      "inclusionMethod",
      "sourcesAndQueriesConsulted",
      "includedCandidates",
      "knownExclusions",
      "coverageGaps",
      "effectiveFrom",
      "knowledgeCutoff",
      "refreshDeadline",
      "generatorVersion",
      "universeHash",
    ],
  },
  KnowledgeEventV03: {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `${DCC_V03_SITE_URL}/schemas/dcc-knowledge-event-v0.3.json`,
    title: "DCC Append-Only Knowledge Event v0.3",
    type: "object",
    required: [
      "eventSeq",
      "eventId",
      "eventType",
      "claimId",
      "claimVersionId",
      "recordedAt",
      "actorId",
      "isSynthetic",
      "provenanceClass",
      "eventHash",
    ],
  },
  DecisionAuthorizationV03: {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `${DCC_V03_SITE_URL}/schemas/dcc-decision-authorization-v0.3.json`,
    title: "DCC Shadow-Mode DecisionAuthorization v0.3",
    type: "object",
    required: [
      "objectType",
      "spec",
      "authorizationId",
      "executionMode",
      "decisionReceipt",
      "permittedAction",
      "providerProductReference",
      "maxPrice",
      "issuedAt",
      "expiresAt",
      "revalidationRequirements",
      "consentMandateReference",
      "idempotencyKey",
      "requiredParameters",
      "opaqueRouting",
      "revocation",
      "providerResultLinkage",
    ],
  },
} as const;

export function getV03SchemaHashes(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, schema] of Object.entries(DCC_V03_JSON_SCHEMAS)) {
    out[name] = sha256HexFull(rfc8785Canonicalize(schema));
  }
  return out;
}

export const V03_CHECKED_BUILD_INPUT_PATHS = [
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "next.config.mjs",
  "drizzle.config.ts",
  "vercel.json",
  "postcss.config.js",
  "tailwind.config.js",
  "eslint.config.mjs",
  ".eslintrc.json",
  ".npmrc",
  ".nvmrc",
  "proxy.ts",
  "city-aliases.ts",
  "canonicalize.mjs",
  "validate.mjs",
  "verify.mjs",
  "drizzle",
  "scripts",
  "app",
  "components",
  "config",
  "data",
  "lib",
  "src",
  "types",
  "utils",
  "workflows",
  "public",
  "styles",
  "tests",
] as const;

const ROOT_CONFIG_INPUT_FILES = [
  "package.json",
  "tsconfig.json",
  "next.config.mjs",
  "drizzle.config.ts",
  "vercel.json",
  "postcss.config.js",
  "tailwind.config.js",
  "eslint.config.mjs",
  ".eslintrc.json",
  ".npmrc",
  ".nvmrc",
  "proxy.ts",
  "city-aliases.ts",
  "canonicalize.mjs",
  "validate.mjs",
  "verify.mjs",
] as const;

function readNormalizedTextBytes(filePath: string): Buffer {
  const raw = fs.readFileSync(filePath);
  if (raw.includes(0)) return raw;
  return Buffer.from(raw.toString("utf8").replace(/\r\n/g, "\n"), "utf8");
}

export interface NextConfigPlatformTransformationInspection {
  path: "next.config.mjs";
  status:
    | "clean_unmodified"
    | "validated_platform_transformation"
    | "unvalidated_modification_dirty"
    | "unknown";
  transformationValidated: boolean;
  committedSha256: string;
  effectiveSourceSha256: string;
  effectiveOnDiskSha256: string;
  disclosedModification: string | null;
}

export interface VercelJsonPlatformTransformationInspection {
  path: "vercel.json";
  status:
    | "clean_unmodified"
    | "validated_platform_transformation"
    | "unvalidated_modification_dirty"
    | "unknown";
  transformationValidated: boolean;
  committedSha256: string;
  effectiveOnDiskSha256: string;
  canonicalContentSha256: string | null;
  committedMatchesCanonicalContent: boolean;
  disclosedModification: string | null;
}

export function inspectNextConfigPlatformTransformation(
  baseDir: string,
): NextConfigPlatformTransformationInspection {
  const diskPath = path.join(/*turbopackIgnore: true*/ baseDir, "next.config.mjs");
  const vercelBackup = path.join(
    /*turbopackIgnore: true*/ baseDir,
    "next.config.__vercel_builder_backup__.mjs",
  );
  let effectiveOnDiskSha256 = "unknown";
  let diskText = "";
  try {
    if (fs.existsSync(diskPath) && fs.statSync(diskPath).isFile()) {
      const normDisk = readNormalizedTextBytes(diskPath);
      effectiveOnDiskSha256 = sha256HexFull(normDisk);
      diskText = normDisk.toString("utf8");
    }
  } catch {
    // ignore
  }
  try {
    const headBlob = execSync("git show HEAD:next.config.mjs", {
      cwd: baseDir,
      stdio: ["ignore", "pipe", "ignore"],
    });
    const headNorm = Buffer.from(headBlob.toString("utf8").replace(/\r\n/g, "\n"), "utf8");
    const committedSha256 = sha256HexFull(headNorm);
    if (effectiveOnDiskSha256 !== "unknown" && effectiveOnDiskSha256 === committedSha256) {
      return {
        path: "next.config.mjs",
        status: "clean_unmodified",
        transformationValidated: true,
        committedSha256,
        effectiveSourceSha256: committedSha256,
        effectiveOnDiskSha256,
        disclosedModification: null,
      };
    }
    if (fs.existsSync(vercelBackup) && fs.statSync(vercelBackup).isFile()) {
      const backupNorm = readNormalizedTextBytes(vercelBackup);
      const backupSha256 = sha256HexFull(backupNorm);
      const wrapperImportsBackup = diskText.includes("next.config.__vercel_builder_backup__");
      if (backupSha256 === committedSha256 && wrapperImportsBackup) {
        return {
          path: "next.config.mjs",
          status: "validated_platform_transformation",
          transformationValidated: true,
          committedSha256,
          effectiveSourceSha256: backupSha256,
          effectiveOnDiskSha256,
          disclosedModification: "vercel_builder_backup_wrapper_rewrite",
        };
      }
    }
    return {
      path: "next.config.mjs",
      status: "unvalidated_modification_dirty",
      transformationValidated: false,
      committedSha256,
      effectiveSourceSha256: effectiveOnDiskSha256,
      effectiveOnDiskSha256,
      disclosedModification: "unvalidated_next_config_modification",
    };
  } catch {
    return {
      path: "next.config.mjs",
      status: "unknown",
      transformationValidated: false,
      committedSha256: "unknown",
      effectiveSourceSha256: effectiveOnDiskSha256,
      effectiveOnDiskSha256,
      disclosedModification: "verification_unavailable",
    };
  }
}

export function inspectVercelJsonPlatformTransformation(
  baseDir: string,
  liveHead?: string,
): VercelJsonPlatformTransformationInspection {
  const diskPath = path.join(/*turbopackIgnore: true*/ baseDir, "vercel.json");
  let effectiveOnDiskSha256 = "unknown";
  let diskText: string | null = null;
  try {
    if (fs.existsSync(diskPath) && fs.statSync(diskPath).isFile()) {
      const normDisk = readNormalizedTextBytes(diskPath);
      effectiveOnDiskSha256 = sha256HexFull(normDisk);
      diskText = normDisk.toString("utf8");
    }
  } catch {
    // ignore
  }
  try {
    const headBlob = execSync("git show HEAD:vercel.json", {
      cwd: baseDir,
      stdio: ["ignore", "pipe", "ignore"],
    });
    const headNorm = Buffer.from(headBlob.toString("utf8").replace(/\r\n/g, "\n"), "utf8");
    const headText = headNorm.toString("utf8");
    const committedSha256 = sha256HexFull(headNorm);
    if (diskText === null || effectiveOnDiskSha256 === "unknown") {
      return {
        path: "vercel.json",
        status: "unknown",
        transformationValidated: false,
        committedSha256,
        effectiveOnDiskSha256: "unknown",
        canonicalContentSha256: null,
        committedMatchesCanonicalContent: false,
        disclosedModification: "disk_vercel_json_unavailable",
      };
    }

    let headParsed: unknown;
    let diskParsed: unknown;
    let headCanonical: string | null = null;
    let diskCanonical: string | null = null;
    try {
      headParsed = JSON.parse(headText);
      headCanonical = rfc8785Canonicalize(headParsed);
    } catch {
      // ignore
    }
    try {
      diskParsed = JSON.parse(diskText);
      diskCanonical = rfc8785Canonicalize(diskParsed);
    } catch {
      // ignore
    }
    const canonicalContentSha256 = diskCanonical ? sha256HexFull(diskCanonical) : null;
    const committedMatchesCanonicalContent = Boolean(
      headCanonical !== null && diskCanonical !== null && headCanonical === diskCanonical,
    );

    if (effectiveOnDiskSha256 === committedSha256) {
      return {
        path: "vercel.json",
        status: "clean_unmodified",
        transformationValidated: true,
        committedSha256,
        effectiveOnDiskSha256,
        canonicalContentSha256,
        committedMatchesCanonicalContent: true,
        disclosedModification: null,
      };
    }

    const vercelCommitSha = process.env.VERCEL_GIT_COMMIT_SHA?.trim() ?? "";
    const vercelEnvMatches =
      process.env.VERCEL === "1" &&
      Boolean(vercelCommitSha) &&
      (!liveHead || vercelCommitSha === liveHead);

    const expectedMinified =
      headParsed !== undefined ? JSON.stringify(headParsed) : null;
    const matchesExpectedVercelMinification = Boolean(
      expectedMinified !== null &&
        committedMatchesCanonicalContent &&
        (diskText === expectedMinified || diskText === `${expectedMinified}\n`),
    );

    if (vercelEnvMatches && matchesExpectedVercelMinification) {
      return {
        path: "vercel.json",
        status: "validated_platform_transformation",
        transformationValidated: true,
        committedSha256,
        effectiveOnDiskSha256,
        canonicalContentSha256,
        committedMatchesCanonicalContent: true,
        disclosedModification: "vercel_container_lossless_json_minify_newline",
      };
    }

    const disclosedModification = committedMatchesCanonicalContent
      ? "unvalidated_non_platform_formatting_modification"
      : `unvalidated_effective_config_modification:committedCanonical=${headCanonical ? sha256HexFull(headCanonical).slice(0, 12) : "invalid_json"},effectiveCanonical=${canonicalContentSha256 ? canonicalContentSha256.slice(0, 12) : "invalid_json"}`;

    return {
      path: "vercel.json",
      status: "unvalidated_modification_dirty",
      transformationValidated: false,
      committedSha256,
      effectiveOnDiskSha256,
      canonicalContentSha256,
      committedMatchesCanonicalContent,
      disclosedModification,
    };
  } catch {
    return {
      path: "vercel.json",
      status: "unknown",
      transformationValidated: false,
      committedSha256: "unknown",
      effectiveOnDiskSha256,
      canonicalContentSha256: null,
      committedMatchesCanonicalContent: false,
      disclosedModification: "verification_unavailable",
    };
  }
}

function resolveEffectiveNextConfigPath(baseDir: string): string {
  const nextCheck = inspectNextConfigPlatformTransformation(baseDir);
  if (nextCheck.status === "validated_platform_transformation") {
    return path.join(
      /*turbopackIgnore: true*/ baseDir,
      "next.config.__vercel_builder_backup__.mjs",
    );
  }
  return path.join(/*turbopackIgnore: true*/ baseDir, "next.config.mjs");
}

function isStatusLineCleanAgainstHead(
  baseDir: string,
  line: string,
  liveHead?: string,
): boolean {
  if (/^D\s+"?(legacy_vault|scratch|data\/sources\/geonames|\.open-next|\.wrangler)\//.test(line)) {
    return true;
  }
  const match = line.match(/^[MT]+\s+(.+)$/);
  if (!match) {
    return false;
  }
  const relPath = match[1].trim().replace(/^"|"$/g, "");
  if (relPath === "next.config.mjs") {
    return inspectNextConfigPlatformTransformation(baseDir).transformationValidated;
  }
  if (relPath === "vercel.json") {
    return inspectVercelJsonPlatformTransformation(baseDir, liveHead).transformationValidated;
  }
  try {
    const diskPath = path.join(/*turbopackIgnore: true*/ baseDir, relPath);
    if (!fs.existsSync(diskPath) || !fs.statSync(diskPath).isFile()) {
      return false;
    }
    const diskDigest = sha256HexFull(readNormalizedTextBytes(diskPath));
    const headBlob = execSync(`git show HEAD:${relPath}`, {
      cwd: baseDir,
      stdio: ["ignore", "pipe", "ignore"],
    });
    const headNormalized = headBlob.includes(0)
      ? headBlob
      : Buffer.from(headBlob.toString("utf8").replace(/\r\n/g, "\n"), "utf8");
    return diskDigest === sha256HexFull(headNormalized);
  } catch {
    return false;
  }
}

function hashEffectiveFilesDeterministic(
  baseDir: string,
  relPaths: readonly string[],
): string {
  const pieces: string[] = [];
  for (const rel of [...relPaths].sort()) {
    const full =
      rel === "next.config.mjs"
        ? resolveEffectiveNextConfigPath(baseDir)
        : path.join(/*turbopackIgnore: true*/ baseDir, rel);
    if (fs.existsSync(full) && fs.statSync(full).isFile()) {
      const fileDigest = sha256HexFull(readNormalizedTextBytes(full));
      pieces.push(`${rel}:${fileDigest}`);
    }
  }
  return pieces.length > 0 ? sha256HexFull(pieces.join("\n")) : "unknown";
}

function hashCommittedHeadFilesDeterministic(
  baseDir: string,
  relPaths: readonly string[],
): string {
  const pieces: string[] = [];
  for (const rel of [...relPaths].sort()) {
    const full = path.join(/*turbopackIgnore: true*/ baseDir, rel);
    if (!fs.existsSync(full)) continue;
    try {
      const headBlob = execSync(`git show HEAD:${rel}`, {
        cwd: baseDir,
        stdio: ["ignore", "pipe", "ignore"],
      });
      const headNormalized = headBlob.includes(0)
        ? headBlob
        : Buffer.from(headBlob.toString("utf8").replace(/\r\n/g, "\n"), "utf8");
      pieces.push(`${rel}:${sha256HexFull(headNormalized)}`);
    } catch {
      return "unknown";
    }
  }
  return pieces.length > 0 ? sha256HexFull(pieces.join("\n")) : "unknown";
}

function listFilesRecursiveRel(baseDir: string, subDir: string): string[] {
  const target = path.join(/*turbopackIgnore: true*/ baseDir, subDir);
  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) return [];
  const results: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(/*turbopackIgnore: true*/ dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        results.push(path.relative(baseDir, full).replace(/\\/g, "/"));
      }
    }
  };
  walk(target);
  return results;
}

/**
 * Generates non-self-referential build and runtime deployment provenance tied directly
 * to the actual source commit (`VERCEL_GIT_COMMIT_SHA` or `git rev-parse HEAD`),
 * working tree cleanliness across all relevant build inputs (root configuration,
 * dependency files, scripts, migrations, and source directories), `package-lock.json` hash,
 * committed vs effective root config hashes, platform transformation disclosures,
 * runtime versions, and schema hashes. Reports `"unknown"` (never `"clean"`) if source
 * inspection is unavailable.
 */
export function getDeploymentProvenanceV03(options?: { cwd?: string }) {
  const customCwdProvided = Boolean(options?.cwd);
  const inspectCwd = options?.cwd ?? process.cwd();
  const runtimeEnv: NodeJS.ProcessEnv = process.env;
  let sourceCommitSha = customCwdProvided
    ? "unknown"
    : runtimeEnv["VERCEL_GIT_COMMIT_SHA"]?.trim() ||
      process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
      process.env.DCC_BUILD_GIT_COMMIT?.trim() ||
      runtimeEnv["GITHUB_SHA"]?.trim() ||
      process.env.GITHUB_SHA?.trim() ||
      "unknown";
  let branchName = customCwdProvided
    ? "unknown"
    : runtimeEnv["VERCEL_GIT_COMMIT_REF"]?.trim() ||
      process.env.VERCEL_GIT_COMMIT_REF?.trim() ||
      process.env.DCC_BUILD_GIT_BRANCH?.trim() ||
      runtimeEnv["GITHUB_REF_NAME"]?.trim() ||
      process.env.GITHUB_REF_NAME?.trim() ||
      "unknown";

  const envDirtyRaw = customCwdProvided
    ? undefined
    : process.env.DCC_BUILD_DIRTY_STATUS?.trim();
  const envSourceInspected =
    !customCwdProvided &&
    process.env.DCC_BUILD_SOURCE_INSPECTION_AVAILABLE?.trim() !== "false" &&
    (envDirtyRaw === "clean" || envDirtyRaw === "dirty");

  let workingTreeState: "clean" | "dirty" | "unknown" = envSourceInspected
    ? (envDirtyRaw as "clean" | "dirty")
    : "unknown";
  let sourceInspectionAvailable = envSourceInspected;

  let modifiedBuildInputs: string[] | null = null;
  let vercelJsonProvenance: VercelJsonPlatformTransformationInspection = {
    path: "vercel.json",
    status: "unknown",
    transformationValidated: false,
    committedSha256: "unknown",
    effectiveOnDiskSha256: "unknown",
    canonicalContentSha256: null,
    committedMatchesCanonicalContent: false,
    disclosedModification: "verification_unavailable",
  };
  let nextConfigProvenance: NextConfigPlatformTransformationInspection = {
    path: "next.config.mjs",
    status: "unknown",
    transformationValidated: false,
    committedSha256: "unknown",
    effectiveSourceSha256: "unknown",
    effectiveOnDiskSha256: "unknown",
    disclosedModification: "verification_unavailable",
  };

  if (!customCwdProvided && envSourceInspected) {
    try {
      if (process.env.DCC_BUILD_MODIFIED_INPUTS) {
        modifiedBuildInputs = JSON.parse(process.env.DCC_BUILD_MODIFIED_INPUTS);
      }
      if (process.env.DCC_BUILD_VERCEL_JSON_PROVENANCE) {
        const parsedVj = JSON.parse(process.env.DCC_BUILD_VERCEL_JSON_PROVENANCE);
        if (parsedVj && typeof parsedVj === "object") {
          vercelJsonProvenance = parsedVj;
        }
      }
      if (process.env.DCC_BUILD_NEXT_CONFIG_PROVENANCE) {
        const parsedNc = JSON.parse(process.env.DCC_BUILD_NEXT_CONFIG_PROVENANCE);
        if (parsedNc && typeof parsedNc === "object") {
          nextConfigProvenance = parsedNc;
        }
      }
    } catch {
      // ignore
    }
  }

  if (!process.env.VERCEL_ENV || customCwdProvided) {
    try {
      const liveHead = execSync("git rev-parse HEAD", {
        cwd: inspectCwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
      if (liveHead) {
        sourceCommitSha = liveHead;
      }
      const liveBranch = execSync("git rev-parse --abbrev-ref HEAD", {
        cwd: inspectCwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
      if (liveBranch) {
        branchName = liveBranch;
      }
      vercelJsonProvenance = inspectVercelJsonPlatformTransformation(inspectCwd, liveHead);
      nextConfigProvenance = inspectNextConfigPlatformTransformation(inspectCwd);
      const existingBuildInputs = V03_CHECKED_BUILD_INPUT_PATHS.filter((relPath) =>
        fs.existsSync(path.join(/*turbopackIgnore: true*/ inspectCwd, relPath)),
      );
      if (existingBuildInputs.length === 0) {
        throw new Error("No build inputs found in inspection directory");
      }
      const rawStatusLines = execSync(
        `git status --porcelain --untracked-files=no -- ${existingBuildInputs.join(" ")}`,
        {
          cwd: inspectCwd,
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        },
      )
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      const dirtyLines = rawStatusLines.filter(
        (l) => !isStatusLineCleanAgainstHead(inspectCwd, l, liveHead),
      );
      modifiedBuildInputs = dirtyLines.map((l) =>
        l.replace(/^[A-Z?]+\s+/, "").trim().replace(/^"|"$/g, ""),
      );
      workingTreeState = dirtyLines.length === 0 ? "clean" : "dirty";
      sourceInspectionAvailable = true;
    } catch {
      if (!envSourceInspected || customCwdProvided) {
        workingTreeState = "unknown";
        sourceInspectionAvailable = false;
        modifiedBuildInputs = null;
        vercelJsonProvenance = inspectVercelJsonPlatformTransformation(inspectCwd);
        nextConfigProvenance = inspectNextConfigPlatformTransformation(inspectCwd);
      }
    }
  }

  let dependencyLockSha256 = customCwdProvided
    ? "unknown"
    : process.env.DCC_BUILD_LOCK_HASH?.trim() || "unknown";
  let committedRootConfigSha256 = customCwdProvided
    ? "unknown"
    : process.env.DCC_BUILD_COMMITTED_ROOT_CONFIG_HASH?.trim() || "unknown";
  let effectiveRootConfigSha256 = customCwdProvided
    ? "unknown"
    : process.env.DCC_BUILD_EFFECTIVE_ROOT_CONFIG_HASH?.trim() ||
      process.env.DCC_BUILD_ROOT_CONFIG_HASH?.trim() ||
      "unknown";
  let rootConfigSha256 = customCwdProvided
    ? "unknown"
    : process.env.DCC_BUILD_ROOT_CONFIG_HASH?.trim() || "unknown";
  let migrationsSha256 = customCwdProvided
    ? "unknown"
    : process.env.DCC_BUILD_MIGRATIONS_HASH?.trim() || "unknown";
  let scriptsSha256 = customCwdProvided
    ? "unknown"
    : process.env.DCC_BUILD_SCRIPTS_HASH?.trim() || "unknown";

  if (!process.env.VERCEL_ENV || customCwdProvided) {
    try {
      const lockPath = path.join(/*turbopackIgnore: true*/ inspectCwd, "package-lock.json");
      if (fs.existsSync(lockPath)) {
        dependencyLockSha256 = sha256HexFull(readNormalizedTextBytes(lockPath));
      }
      const computedCommittedRoot = hashCommittedHeadFilesDeterministic(
        inspectCwd,
        ROOT_CONFIG_INPUT_FILES,
      );
      if (computedCommittedRoot !== "unknown") {
        committedRootConfigSha256 = computedCommittedRoot;
      }
      const computedEffectiveRoot = hashEffectiveFilesDeterministic(
        inspectCwd,
        ROOT_CONFIG_INPUT_FILES,
      );
      if (computedEffectiveRoot !== "unknown") {
        effectiveRootConfigSha256 = computedEffectiveRoot;
        rootConfigSha256 = computedEffectiveRoot;
      }
      const computedMigrations = hashEffectiveFilesDeterministic(
        inspectCwd,
        listFilesRecursiveRel(inspectCwd, "drizzle"),
      );
      if (computedMigrations !== "unknown") {
        migrationsSha256 = computedMigrations;
      }
      const computedScripts = hashEffectiveFilesDeterministic(
        inspectCwd,
        listFilesRecursiveRel(inspectCwd, "scripts/dcc"),
      );
      if (computedScripts !== "unknown") {
        scriptsSha256 = computedScripts;
      }
    } catch {
      // ignore
    }
  }

  const checkedBuildInputs = (
    !customCwdProvided && process.env.DCC_BUILD_CHECKED_INPUTS?.trim()
      ? process.env.DCC_BUILD_CHECKED_INPUTS.trim().split(",")
      : [...V03_CHECKED_BUILD_INPUT_PATHS]
  ).filter(Boolean);

  const schemaHashes = getV03SchemaHashes();
  const aggregateSchemaHash = sha256HexFull(rfc8785Canonicalize(schemaHashes));
  const r2Status = inspectR2CredentialsFromEnv();
  const deploymentEnvironment =
    runtimeEnv["VERCEL_ENV"]?.trim() ||
    process.env.VERCEL_ENV?.trim() ||
    process.env.NODE_ENV?.trim() ||
    "local";
  const buildTime = process.env.DCC_BUILD_TIME?.trim() || new Date().toISOString();
  const vercelDeploymentId =
    runtimeEnv["VERCEL_DEPLOYMENT_ID"]?.trim() ||
    process.env.VERCEL_DEPLOYMENT_ID?.trim() ||
    runtimeEnv["VERCEL_URL"]?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    `build-${sourceCommitSha.slice(0, 12)}`;
  const buildId = process.env.DCC_BUILD_ID?.trim() || vercelDeploymentId;
  const gitProvider =
    runtimeEnv["VERCEL_GIT_PROVIDER"]?.trim() ||
    process.env.VERCEL_GIT_PROVIDER?.trim() ||
    null;
  const ciVerifiedCommitSha =
    runtimeEnv["DCC_CI_VERIFIED_COMMIT_SHA"]?.trim() ||
    process.env.DCC_CI_VERIFIED_COMMIT_SHA?.trim() ||
    null;
  const ciVerifiedRunId =
    runtimeEnv["DCC_CI_VERIFIED_RUN_ID"]?.trim() ||
    process.env.DCC_CI_VERIFIED_RUN_ID?.trim() ||
    null;
  const ciVerifiedLockHash =
    runtimeEnv["DCC_CI_VERIFIED_LOCK_HASH"]?.trim() ||
    process.env.DCC_CI_VERIFIED_LOCK_HASH?.trim() ||
    null;
  const commitMatchesHostedCi =
    Boolean(ciVerifiedCommitSha) &&
    sourceCommitSha !== "unknown" &&
    ciVerifiedCommitSha === sourceCommitSha;
  const dependencyLockHashMatchesHostedCi =
    Boolean(ciVerifiedLockHash) &&
    dependencyLockSha256 !== "unknown" &&
    dependencyLockSha256 !== "unavailable_in_packaged_runtime" &&
    ciVerifiedLockHash === dependencyLockSha256;

  return {
    provenanceSpec: "dcc-deployment-provenance/0.3.1",
    gitCommit: sourceCommitSha,
    gitBranch: branchName,
    gitProvider,
    buildId,
    vercelEnv: deploymentEnvironment,
    vercelDeploymentId,
    dependencyLockHash: dependencyLockSha256,
    committedRootConfigHash: committedRootConfigSha256,
    effectiveRootConfigHash: effectiveRootConfigSha256,
    rootConfigHash: rootConfigSha256,
    migrationsHash: migrationsSha256,
    scriptsHash: scriptsSha256,
    schemaHash: aggregateSchemaHash,
    compilerVersion: "dcc-ir-compiler/0.3.1",
    runtimeVersion: `node/${process.version}`,
    deploymentEnvironment,
    dirtySourceStatus: workingTreeState,
    sourceInspectionAvailable,
    modifiedBuildInputs,
    vercelJsonProvenance,
    nextConfigProvenance,
    buildTime,
    generatedAt: new Date().toISOString(),
    hostedCiVerification: {
      verifiedAgainstHostedCi: Boolean(
        workingTreeState === "clean" &&
          ciVerifiedRunId &&
          commitMatchesHostedCi &&
          dependencyLockHashMatchesHostedCi,
      ),
      ciRunId: ciVerifiedRunId,
      ciVerifiedCommitSha,
      ciVerifiedLockHash,
      commitMatchesHostedCi,
      dependencyLockHashMatchesHostedCi,
    },
    sourceControl: {
      sourceCommitSha,
      branchName,
      gitProvider,
      workingTreeState,
      sourceInspectionAvailable,
      modifiedBuildInputs,
      checkedBuildInputs,
      v01FreezeCommitSha: "9272c6b207f0242f7b217944551a9d76e0beb3d5",
      v02CompletedHeadCommitSha: "3016a030fba23457d2795d4374a1d8393aa59b3e",
      v03MechanicsMilestoneCommitSha: "3c85898f6d93eb6cb2987e2d65816b692754e8c6",
    },
    buildInputsInspection: {
      sourceInspectionAvailable,
      dirtySourceStatus: workingTreeState,
      modifiedBuildInputs,
      checkedBuildInputs,
      committedRootConfigSha256,
      effectiveRootConfigSha256,
      rootConfigSha256,
      dependencyLockSha256,
      migrationsSha256,
      scriptsSha256,
      schemaSha256: aggregateSchemaHash,
      platformTransformations: {
        vercelJson: vercelJsonProvenance,
        nextConfig: nextConfigProvenance,
      },
    },
    dependencyLockSha256,
    runtimeVersions: {
      node: process.version,
      v8: process.versions.v8,
      platform: process.platform,
      arch: process.arch,
      vercelEnv: process.env.VERCEL_ENV ?? "local",
      vercelUrl: process.env.VERCEL_URL ?? null,
    },
    schemaHashes,
    storageBoundaryStatus: {
      relationalLedgerBackend: "neon_postgres_dcc_machine_v03",
      privateObjectStoreR2Configured: r2Status.configured,
      r2MissingEnvVars: r2Status.missingEnvVars,
      activeArtifactStoreClass: r2Status.configured
        ? "production_private_object_store (cloudflare_r2_private_s3)"
        : "test_only_non_r2 (neon_or_memory_test_backend)",
    },
  };
}

/**
 * RFC 9264 API Catalog (`/.well-known/api-catalog`)
 */
export function buildApiCatalogDocument(baseUrl = DCC_V03_SITE_URL) {
  const base = baseUrl.replace(/\/+$/, "");
  return {
    linkset: [
      {
        anchor: `${base}/api/v1`,
        "service-desc": [
          {
            href: `${base}/openapi.json`,
            type: "application/vnd.oai.openapi+json;version=3.1",
            title: "DCC Machine Layer v0.3 OpenAPI 3.1 Specification",
          },
        ],
        "service-doc": [
          {
            href: `${base}/api/v1/docs/receipt-verification`,
            type: "application/json",
            title: "DCC RFC 8785 + JWS EdDSA Receipt Verification Specification",
          },
          {
            href: `${base}/api/v1/docs/citation-verification`,
            type: "application/json",
            title: "DCC W3C Selector & Public/Private Evidence Boundary Specification",
          },
        ],
        "service-meta": [
          {
            href: `${base}/.well-known/dcc`,
            type: "application/json",
            title: "DCC Machine Layer v0.3 Primary Discovery Manifest",
          },
          {
            href: `${base}/.well-known/jwks.json`,
            type: "application/jwk-set+json",
            title: "DCC Standard RFC 7517 JSON Web Key Set (EdDSA / Ed25519)",
          },
          {
            href: `${base}/.well-known/mcp.json`,
            type: "application/json",
            title: "DCC Model Context Protocol (MCP) Discovery Manifest",
          },
          {
            href: `${base}/api/v1/conformance/fixtures`,
            type: "application/json",
            title: "DCC Language-Neutral Conformance Vectors (RFC 8785, JWS, Bitemporal, Selectors)",
          },
        ],
      },
    ],
  };
}

/**
 * MCP Discovery Manifest (`/.well-known/mcp.json`)
 */
export function buildMcpDiscoveryDocument(baseUrl = DCC_V03_SITE_URL) {
  const base = baseUrl.replace(/\/+$/, "");
  return {
    mcpVersion: "2025-03-26",
    serverInfo: {
      name: "dcc-machine-layer-v03",
      version: "0.3.0",
      description:
        "Destination Command Center Machine Layer v0.3 — Append-only temporal evidence ledger, deterministic Decision IR evaluator, RFC 8785 + JWS EdDSA receipt verifier, and shadow-mode DecisionAuthorization service.",
    },
    transport: {
      type: "streamable-http",
      endpoint: `${base}/api/v1/mcp`,
    },
    a2aDelegatedAgentSupported: false,
    a2aExclusionRationale:
      "DCC is a synchronous evidence, decision, and receipt-verification fabric rather than an asynchronous delegated agent; A2A is intentionally not advertised.",
    tools: [
      {
        name: "dcc_evaluate_category",
        requiredScope: "dcc:evaluate",
        description:
          "Evaluates a declared DCC category engine (juneau-helicopter-tours, hawaii-whale-watching, denver-to-mountain-transportation, alaska-shore-excursions, new-orleans-swamp-tours, new-orleans-city-tours, or juneau-helicopter-canary-v03) with server-controlled knowledgeCutoff and returns a JWS EdDSA signed receipt.",
        inputSchema: {
          type: "object",
          required: ["engineId", "validAt", "inputs"],
          properties: {
            engineId: { type: "string" },
            validAt: { type: "string", format: "date-time" },
            inputs: { type: "object" },
          },
        },
      },
      {
        name: "dcc_verify_receipt_jws",
        requiredScope: "dcc:read:public",
        description:
          "Verifies a DCC JWS Compact decision receipt (alg=EdDSA) against /.well-known/jwks.json and checks RFC 8785 canonicalization and revocation status.",
        inputSchema: {
          type: "object",
          required: ["jwsCompact"],
          properties: {
            jwsCompact: { type: "string" },
          },
        },
      },
      {
        name: "dcc_get_candidate_universe",
        requiredScope: "dcc:read:public",
        description:
          "Retrieves a versioned, content-addressed CandidateUniverse including scope, inclusion methodology, sources consulted, known exclusions, and coverage gaps.",
        inputSchema: {
          type: "object",
          required: ["universeId"],
          properties: {
            universeId: { type: "string" },
            version: { type: "string" },
          },
        },
      },
      {
        name: "dcc_issue_shadow_authorization",
        requiredScope: "dcc:evaluate",
        description:
          "Transforms a qualified or recommended decision receipt into a provider-neutral shadow-mode DecisionAuthorization (OCTO, AP2, ACP, Rezdy, Square) with zero live side effects.",
        inputSchema: {
          type: "object",
          required: ["targetAdapter"],
          properties: {
            receiptId: { type: "string" },
            targetAdapter: {
              type: "string",
              enum: ["octo", "ap2", "acp", "rezdy", "square"],
            },
          },
        },
      },
      {
        name: "dcc_create_commercial_handoff",
        requiredScope: "dcc:commerce:handoff",
        description:
          "Creates an optional outbound commercial affiliate handoff (handoff_id) in the separated commercial module without altering published evidence or decision receipts.",
        inputSchema: {
          type: "object",
          required: ["originatingSite", "provider", "productCode", "productDestinationUrl"],
          properties: {
            originatingSite: { type: "string" },
            provider: {
              type: "string",
              enum: ["viator", "fareharbor", "getyourguide", "direct"],
            },
            providerAccount: { type: "string" },
            productCode: { type: "string" },
            productDestinationUrl: { type: "string" },
            contextId: { type: "string" },
            evaluationRunId: { type: "string" },
            receiptId: { type: "string" },
            intendedDate: { type: "string" },
            intendedOption: { type: "string" },
            partySize: { type: "number" },
          },
        },
      },
      {
        name: "dcc_report_commercial_outcome",
        requiredScope: "dcc:commerce:report_outcome",
        description:
          "Records an authenticated commercial booking outcome with provenance and reconciliation against handoff/evaluation details without altering rules or approved claims.",
        inputSchema: {
          type: "object",
          required: ["provider", "providerBookingRef", "eventType"],
          properties: {
            provider: {
              type: "string",
              enum: ["viator", "fareharbor", "getyourguide", "direct"],
            },
            providerBookingRef: { type: "string" },
            eventType: { type: "string" },
            providerEventTime: { type: "string" },
            handoffId: { type: "string" },
            campaignOrRefValue: { type: "string" },
            bookedProductCode: { type: "string" },
            bookedDate: { type: "string" },
            bookedPartySize: { type: "number" },
            bookingValueAmount: { type: "number" },
            bookingValueCurrency: { type: "string" },
            estimatedCommissionAmount: { type: "number" },
            paidCommissionAmount: { type: "number" },
          },
        },
      },
    ],
  };
}

export function buildReceiptVerificationDocumentation(baseUrl = DCC_V03_SITE_URL) {
  const base = baseUrl.replace(/\/+$/, "");
  return {
    spec: "dcc-receipt-verification-doc/0.3",
    title: "DCC v0.3 Cryptographic Decision Receipt Verification Specification",
    standardsUsed: [
      "RFC 8785 — JSON Canonicalization Scheme (JCS)",
      "RFC 7515 — JSON Web Signature (JWS Compact Serialization)",
      "RFC 8037 — CFRG Elliptic Curve Diffie-Hellman (ECDH) and Signatures in JOSE (EdDSA / Ed25519)",
      "RFC 7517 — JSON Web Key (JWK) & JSON Web Key Set (JWKS)",
      "RFC 7638 — JSON Web Key (JWK) Thumbprint",
    ],
    jwksEndpoint: `${base}/.well-known/jwks.json`,
    receiptIdentifierFormat: {
      ordinaryEvaluation: "rcpt:sha256:<64-lowercase-hex-sha256>",
      administrativeSimulation: "rcpt:sim:sha256:<64-lowercase-hex-sha256>",
      truncationPermitted: false,
    },
    receiptHashBoundary: {
      hashFormula:
        "rcpt:sha256:<SHA-256(UTF8(RFC8785(deterministicIdentityCore)))>",
      deterministicIdentityCoreIncludedFields: [
        "objectType",
        "spec",
        "executionClass",
        "isSynthetic",
        "syntheticWatermark",
        "evaluationFingerprint",
        "engineId",
        "engineVersion",
        "compilerVersion",
        "decisionIrBundleHash",
        "candidateUniverseId",
        "candidateUniverseVersion",
        "candidateUniverseHash",
        "pinnedRuleVersionHashes",
        "pinnedClaimEventHashes",
        "pinnedEvidenceHashes",
        "pinnedSchemaHashes",
        "normalizedInputHash",
        "validAt",
        "knowledgeCutoff",
        "decisionState",
        "recommendedCandidateDccId",
        "candidateDispositions",
        "resultHash",
        "traceHash",
        "epistemicLimitationStatement",
        "jwksUri",
        "revocationCheckEndpoint",
      ],
      excludedFromReceiptIdHash: [
        "receiptId",
        "signature",
        "jwsCompact",
        "issuedAt",
        "evaluationRunId",
        "traceRunId",
        "client_id",
        "callerClientId",
        "traceparent",
        "cacheStatus",
        "handoff_id",
        "handoffId",
        "commissionRate",
        "affiliateAccount",
        "commercialRoutingPriority",
      ],
      selfReferenceInvariant:
        "receiptId never includes its own receiptId or JWS signature bytes in its hash input.",
      callerAndCommerceIndependenceInvariant:
        "Caller identity (client_id), invocation run metadata (evaluationRunId, traceRunId, cacheStatus, traceparent), and commercial handoffs (handoff_id) are strictly excluded from deterministicIdentityCore and never required to evaluate, verify, or replay a decision receipt.",
    },
    verificationSteps: [
      "1. Parse the JWS Compact string (header.payload.signature) and decode the protected header.",
      "2. Confirm header.alg === 'EdDSA', header.typ === 'application/dcc-decision-receipt+jws', and header.kid is a non-empty string.",
      "3. Fetch /.well-known/jwks.json and locate the key matching header.kid.",
      "4. Enforce key lifecycle policy: if key.status === 'revoked', fail closed immediately (KEY_REVOKED). If key.status === 'retired_verify_only', allow verification of historical receipts issued before key.retiredAt.",
      "5. Verify the Ed25519 signature over ASCII(BASE64URL(header) + '.' + BASE64URL(payload)) using standard JWS verification.",
      "6. Decode the payload UTF-8 bytes, parse JSON, re-serialize with RFC 8785 JCS, and confirm byte-for-byte equality with the signed payload bytes.",
      "7. Recompute SHA-256 over RFC 8785 JCS of deterministicIdentityCore (excluding receiptId, issuedAt, evaluationRunId, traceRunId, and signature bytes) and confirm equality with receiptId.",
      "8. Confirm payload.knowledgeCutoff was server-established and check payload.isSynthetic === false before treating the receipt as operational evidence.",
    ],
  };
}

export function buildCitationVerificationDocumentation(baseUrl = DCC_V03_SITE_URL) {
  const base = baseUrl.replace(/\/+$/, "");
  return {
    spec: "dcc-citation-verification-doc/0.3",
    title: "DCC v0.3 Evidence Selector & Public/Private Citation Boundary Specification",
    supportedSelectorTypes: [
      "TextQuoteSelector (W3C Web Annotation Data Model — exact, prefix, suffix)",
      "TextPositionSelector (W3C Web Annotation Data Model — start, end UTF-16 code units)",
      "FragmentSelector (RFC 5147 text/plain fragments, HTML IDs, W3C Media Fragments)",
      "JsonPointerSelector (RFC 6901 — /path/to/field)",
      "JsonPathSelector (RFC 9535 — $.path.to.field)",
      "MediaFragmentSelector (W3C Media Fragments URI 1.0 — temporal/spatial)",
    ],
    publicPrivateBoundaryPolicy: {
      publicEndpoints: [`${base}/r/{id}`, `${base}/r/{id}/v/{version}`],
      exposedInPublicProjection: [
        "W3C / JSON selectors",
        "Bounded exact quote (<= 600 chars) and short surrounding context (<= 160 chars before/after)",
        "Full 64-hex SHA-256 of the extracted evidence fragment (evidenceHash)",
        "Full 64-hex SHA-256 of the underlying source capture (snapshotSha256)",
        "Extractor identity, version, extraction timestamp, and retrieval timestamp",
        "Source attribution and license/reuse policy",
      ],
      neverExposedPublicly: [
        "Raw full HTML/PDF/API response bodies stored in private R2 / private blob storage",
        "Private storage bucket URIs or pre-signed storage URLs",
      ],
      rawQueryParameterBehavior:
        "Requests with ?raw=1 or Accept: application/octet-stream on citation endpoints are rejected with HTTP 403 PRIVATE_EVIDENCE_RAW_CAPTURE_FORBIDDEN.",
    },
  };
}

export function buildLanguageNeutralConformanceFixtures() {
  const rfc8785Result = verifyRfc8785ConformanceVectors();
  const jwks = getStandardJwksDocument();
  return {
    spec: "dcc-conformance-fixtures/0.3",
    generatedAt: "2026-10-26T00:00:00.000Z",
    rfc8785Vectors: rfc8785Result.results,
    activePublicJwks: jwks.keys,
    bitemporalEventOrderingFixture: {
      description:
        "Retroactive correction appended at T2 > T1_cutoff must not alter replay of a receipt issued at T1_cutoff.",
      events: [
        {
          eventSeq: 1,
          eventType: "claim_approved_and_activated",
          claimId: "clm:syn:max-single-seat-weight-lbs",
          claimVersionId: "clmv:syn:max-single-seat-weight-lbs:v1-250",
          typedValue: 250,
          validFrom: "2026-10-01T00:00:00.000Z",
          recordedAt: "2026-10-01T10:00:00.000Z",
        },
        {
          eventSeq: 2,
          eventType: "claim_corrected_retroactively",
          claimId: "clm:syn:max-single-seat-weight-lbs",
          claimVersionId: "clmv:syn:max-single-seat-weight-lbs:v2-215-retro",
          targetPreviousVersionId: "clmv:syn:max-single-seat-weight-lbs:v1-250",
          typedValue: 215,
          validFrom: "2026-10-01T00:00:00.000Z",
          recordedAt: "2026-10-10T10:00:00.000Z",
        },
      ],
      expectedValueAtCutoff_2026_10_05: 250,
      expectedValueAtCutoff_2026_10_12: 215,
    },
    w3cSelectorVector: {
      sourceText:
        "GoSno is a private mountain transportation service in Colorado (no shared shuttles) offering SUVs (up to 6 passengers) and Vans (up to 10 passengers).",
      expectedTextQuoteSelector: {
        type: "TextQuoteSelector",
        exact: "SUVs (up to 6 passengers) and Vans (up to 10 passengers)",
        prefix: "(no shared shuttles) offering ",
        suffix: ".",
      },
      expectedTextPositionSelector: {
        type: "TextPositionSelector",
        start: 93,
        end: 149,
      },
    },
  };
}

export const V03_JSON_SCHEMAS = DCC_V03_JSON_SCHEMAS;

