import crypto from "node:crypto";


/**
 * DCC Machine Layer v0.3 — RFC 8785 JSON Canonicalization (JCS) & Standard JWS (EdDSA)
 *
 * Implements:
 * - RFC 8785 JSON Canonicalization Scheme (JCS) with official conformance vectors
 * - Standard RFC 7515 / RFC 8037 JWS Compact Serialization using `alg=EdDSA` (Ed25519)
 * - Standard RFC 7517 JWK & JWKS publication
 * - Full 64-hex SHA-256 receipt identifiers (`rcpt:sha256:<64-hex>`)
 * - Persistent externally configured signing keys, key rotation, historical verification,
 *   explicit revocation policy, and fail-closed production key enforcement.
 */

export class FailClosedSigningConfigurationError extends Error {
  public readonly code = "FAIL_CLOSED_SIGNING_KEY_MISSING";
  constructor(message: string) {
    super(message);
    this.name = "FailClosedSigningConfigurationError";
  }
}

export function sha256HexFull(input: string | Uint8Array): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

/**
 * RFC 8785 JSON Canonicalization Scheme (JCS).
 *
 * - Numbers are formatted according to ECMAScript 7.1.12.1 (V8 Number.prototype.toString),
 *   with -0 normalized to "0" and NaN/Infinity rejected per RFC 8785 Section 3.2.2.3.
 * - Strings are escaped per RFC 8785 Section 3.2.2.2 (\b, \t, \n, \f, \r, \", \\, and
 *   lowercase \u00xx for control characters U+0000..U+001F).
 * - Object properties with `undefined` values are omitted (matching JSON.stringify),
 *   and keys are sorted lexicographically by UTF-16 code units per RFC 8785 Section 3.2.3.
 */
export function rfc8785Canonicalize(value: unknown): string {
  if (value === null) {
    return "null";
  }
  const t = typeof value;
  if (t === "boolean") {
    return value ? "true" : "false";
  }
  if (t === "number") {
    if (!Number.isFinite(value as number)) {
      throw new TypeError("RFC 8785 forbids NaN and Infinity in canonical JSON.");
    }
    if (Object.is(value, -0) || value === 0) {
      return "0";
    }
    return JSON.stringify(value);
  }
  if (t === "string") {
    return serializeRfc8785String(value as string);
  }
  if (Array.isArray(value)) {
    const items = value.map((item) =>
      item === undefined || typeof item === "function" || typeof item === "symbol"
        ? "null"
        : rfc8785Canonicalize(item),
    );
    return `[${items.join(",")}]`;
  }
  if (t === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj)
      .filter((k) => {
        const v = obj[k];
        return v !== undefined && typeof v !== "function" && typeof v !== "symbol";
      })
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)); // UTF-16 code unit order per RFC 8785 Section 3.2.3

    const pairs = keys.map(
      (k) => `${serializeRfc8785String(k)}:${rfc8785Canonicalize(obj[k])}`,
    );
    return `{${pairs.join(",")}}`;
  }
  throw new TypeError(`Unsupported type for RFC 8785 canonicalization: ${t}`);
}

function serializeRfc8785String(str: string): string {
  let out = '"';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code === 0x08) out += "\\b";
    else if (code === 0x09) out += "\\t";
    else if (code === 0x0a) out += "\\n";
    else if (code === 0x0c) out += "\\f";
    else if (code === 0x0d) out += "\\r";
    else if (code === 0x22) out += '\\"';
    else if (code === 0x5c) out += "\\\\";
    else if (code < 0x20) {
      out += `\\u${code.toString(16).padStart(4, "0")}`;
    } else {
      out += str[i];
    }
  }
  out += '"';
  return out;
}

export interface Rfc8785ConformanceResult {
  passed: boolean;
  vectorsTested: number;
  results: Array<{
    name: string;
    expectedCanonical: string;
    actualCanonical: string;
    expectedSha256?: string;
    actualSha256: string;
    passed: boolean;
  }>;
}

/**
 * Runs official RFC 8785 Section 3.2.2 (IEEE-754 numbers), Section 3.2.3 (UTF-16 key sorting),
 * and full structure conformance test vectors.
 */
export function verifyRfc8785ConformanceVectors(): Rfc8785ConformanceResult {
  const vectors: Array<{
    name: string;
    input: unknown;
    expectedCanonical: string;
    expectedSha256?: string;
  }> = [
    {
      name: "RFC 8785 Section 3.2.3 UTF-16 Key Sorting Vector",
      input: {
        "\u20ac": "Euro Sign",
        "\r": "Carriage Return",
        "\ufb33": "Hebrew Letter Dalet With Dagesh",
        "1": "One",
        "\ud83d\ude00": "Emoji: Grinning Face",
        "\u0080": "Control",
        "\u00f6": "Latin Small Letter O With Diaeresis",
      },
      expectedCanonical:
        '{"\\r":"Carriage Return","1":"One","\u0080":"Control","\u00f6":"Latin Small Letter O With Diaeresis","\u20ac":"Euro Sign","\ud83d\ude00":"Emoji: Grinning Face","\ufb33":"Hebrew Letter Dalet With Dagesh"}',
    },
    {
      name: "RFC 8785 Section 3.2.2 IEEE-754 Number Formatting & Negative Zero",
      input: {
        numbers: [333333333.33333329, 1e30, 4.5, 2e-3, 0.000000000000000000000000001, -0.0],
      },
      expectedCanonical:
        '{"numbers":[333333333.3333333,1e+30,4.5,0.002,1e-27,0]}',
    },
    {
      name: "RFC 8785 Control Character Lowercase Hex Escaping",
      input: {
        ctrl: "\u0000\u0007\u0008\u0009\u000a\u000c\u000d\u001f\"\\",
      },
      expectedCanonical: '{"ctrl":"\\u0000\\u0007\\b\\t\\n\\f\\r\\u001f\\"\\\\"}',
    },
  ];

  const results = vectors.map((v) => {
    const actualCanonical = rfc8785Canonicalize(v.input);
    const actualSha256 = sha256HexFull(actualCanonical);
    const passed =
      actualCanonical === v.expectedCanonical &&
      (!v.expectedSha256 || actualSha256 === v.expectedSha256);
    return {
      name: v.name,
      expectedCanonical: v.expectedCanonical,
      actualCanonical,
      expectedSha256: v.expectedSha256,
      actualSha256,
      passed,
    };
  });

  return {
    passed: results.every((r) => r.passed),
    vectorsTested: results.length,
    results,
  };
}

export type KeyLifecycleStatus = "active" | "retired_verify_only" | "revoked";

export interface V03PublicJwk {
  kty: "OKP";
  crv: "Ed25519";
  alg: "EdDSA";
  use: "sig";
  kid: string;
  x: string;
}

export interface V03SigningKeyEntry {
  kid: string;
  alg: "EdDSA";
  kty: "OKP";
  crv: "Ed25519";
  x: string;
  jwkThumbprintSha256: string;
  publicJwk: V03PublicJwk;
  privateKeyObject: crypto.KeyObject | null;
  publicKeyObject: crypto.KeyObject;
  status: KeyLifecycleStatus;
  issuer: string;
  createdAt: string;
  retiredAt: string | null;
  revokedAt: string | null;
  revocationReason: string | null;
}

export interface V03PinnedReceiptPayload {
  spec: "dcc-decision-receipt/0.3";
  receiptId: string;
  executionClass: "current_evaluation" | "historical_replay" | "administrative_simulation";
  isSynthetic: boolean;
  syntheticWatermark: string | null;
  issuer: string;
  issuedAt: string;
  evaluationRunId: string;
  traceRunId: string;
  evaluationFingerprint: string;
  engineId: string;
  engineVersion: string;
  compilerVersion: string;
  decisionIrBundleHash: string;
  candidateUniverseId: string;
  candidateUniverseVersion: string;
  candidateUniverseHash: string;
  pinnedRuleVersionHashes: Record<string, string>;
  pinnedClaimEventHashes: Record<string, string>;
  pinnedEvidenceHashes: Record<string, string>;
  pinnedSchemaHashes: Record<string, string>;
  normalizedInputHash: string;
  validAt: string;
  knowledgeCutoff: string;
  decisionState: string;
  recommendedCandidateDccId: string | null;
  recommendedCandidateLegacyCode: string | null;
  candidateDispositionSummary: Array<{
    candidateDccId: string;
    legacyCode: string;
    disposition: "eligible" | "qualified" | "ineligible" | "indeterminate";
    totalScore: number | null;
    reasonCodes: string[];
  }>;
  resultHash: string;
  traceHash: string;
  epistemicLimitationStatement: string;
}

export interface V03SignedDecisionReceipt {
  objectType: "DecisionReceipt";
  spec: "dcc-decision-receipt/0.3";
  receiptId: string;
  executionClass: "current_evaluation" | "historical_replay" | "administrative_simulation";
  isSynthetic: boolean;
  kid: string;
  alg: "EdDSA";
  typ: "application/dcc-decision-receipt+jws";
  jku: string;
  issuedAt: string;
  rfc8785CanonicalPayload: string;
  rfc8785PayloadSha256: string;
  jwsCompact: string;
  payload: V03PinnedReceiptPayload;
}

const ISSUER_URI = "https://www.destinationcommandcenter.com";
const JWKS_URI = "https://www.destinationcommandcenter.com/.well-known/jwks.json";

const ED25519_PKCS8_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");

function deriveKeyEntryFromSeed(params: {
  kid: string;
  seedMaterial: string;
  status: KeyLifecycleStatus;
  createdAt: string;
  retiredAt?: string | null;
  revokedAt?: string | null;
  revocationReason?: string | null;
}): V03SigningKeyEntry {
  const seed32 = crypto.createHash("sha256").update(params.seedMaterial, "utf8").digest();
  const pkcs8Der = Buffer.concat([ED25519_PKCS8_PREFIX, seed32]);
  const privateKeyObject = crypto.createPrivateKey({
    key: pkcs8Der,
    format: "der",
    type: "pkcs8",
  });
  const publicKeyObject = crypto.createPublicKey(privateKeyObject);
  const rawJwk = publicKeyObject.export({ format: "jwk" }) as { x: string };

  const publicJwk: V03PublicJwk = {
    kty: "OKP",
    crv: "Ed25519",
    alg: "EdDSA",
    use: "sig",
    kid: params.kid,
    x: rawJwk.x,
  };

  // RFC 7638 JWK Thumbprint over {"crv":"Ed25519","kty":"OKP","x":"..."}
  const thumbprintCanonical = rfc8785Canonicalize({
    crv: "Ed25519",
    kty: "OKP",
    x: rawJwk.x,
  });
  const jwkThumbprintSha256 = crypto
    .createHash("sha256")
    .update(thumbprintCanonical, "utf8")
    .digest("base64url");

  return {
    kid: params.kid,
    alg: "EdDSA",
    kty: "OKP",
    crv: "Ed25519",
    x: rawJwk.x,
    jwkThumbprintSha256,
    publicJwk,
    privateKeyObject,
    publicKeyObject,
    status: params.status,
    issuer: ISSUER_URI,
    createdAt: params.createdAt,
    retiredAt: params.retiredAt ?? null,
    revokedAt: params.revokedAt ?? null,
    revocationReason: params.revocationReason ?? null,
  };
}

function isProductionRuntime(): boolean {
  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();
  if (vercelEnv) {
    return vercelEnv === "production";
  }
  return (
    process.env.NODE_ENV === "production" &&
    process.env.DCC_ENFORCE_PROD_FAIL_CLOSED === "1"
  );
}

let keyRegistry: Map<string, V03SigningKeyEntry> | null = null;
let activeKid: string | null = null;

export function assertSigningConfigurationAllowed(): void {
  if (isProductionRuntime()) {
    const externalKeyset = process.env.DCC_SIGNING_KEYSET_JSON?.trim();
    const externalPrivateJwk = process.env.DCC_SIGNING_PRIVATE_JWK?.trim();
    const externalSeed = process.env.DCC_MACHINE_SIGNING_SEED?.trim();
    if (!externalKeyset && !externalPrivateJwk && !externalSeed) {
      throw new FailClosedSigningConfigurationError(
        "FAIL_CLOSED_SIGNING_KEY_MISSING: Production runtime requires externally configured signing keys (DCC_SIGNING_KEYSET_JSON, DCC_SIGNING_PRIVATE_JWK, or DCC_MACHINE_SIGNING_SEED). Cold start will never silently invent a production issuer.",
      );
    }
  }
}

export function getV03SigningKeyRegistry(): Map<string, V03SigningKeyEntry> {
  assertSigningConfigurationAllowed();
  if (keyRegistry && keyRegistry.size > 0) {
    return keyRegistry;
  }

  keyRegistry = new Map<string, V03SigningKeyEntry>();

  const externalKeysetRaw = process.env.DCC_SIGNING_KEYSET_JSON?.trim();
  if (externalKeysetRaw) {
    const parsed = JSON.parse(externalKeysetRaw) as Array<{
      kid: string;
      seedMaterial: string;
      status: KeyLifecycleStatus;
      createdAt: string;
      retiredAt?: string | null;
      revokedAt?: string | null;
      revocationReason?: string | null;
    }>;
    for (const item of parsed) {
      const entry = deriveKeyEntryFromSeed(item);
      keyRegistry.set(entry.kid, entry);
      if (entry.status === "active" && !activeKid) {
        activeKid = entry.kid;
      }
    }
    return keyRegistry;
  }

  const seed =
    process.env.DCC_MACHINE_SIGNING_SEED?.trim() ||
    "dcc-v03-nonprod-deterministic-ed25519-key-seed-2026-k1";
  const kid = process.env.DCC_MACHINE_SIGNING_KEY_ID?.trim() || "dcc-v03-ed25519-2026-k1";

  const defaultEntry = deriveKeyEntryFromSeed({
    kid,
    seedMaterial: seed,
    status: "active",
    createdAt: "2026-10-26T00:00:00.000Z",
  });
  keyRegistry.set(defaultEntry.kid, defaultEntry);
  activeKid = defaultEntry.kid;
  return keyRegistry;
}

export function resetV03SigningKeyRegistry(): void {
  keyRegistry = null;
  activeKid = null;
}

export function getActiveV03SigningKey(): V03SigningKeyEntry {
  const reg = getV03SigningKeyRegistry();
  if (activeKid && reg.has(activeKid)) {
    const k = reg.get(activeKid)!;
    if (k.status === "active") return k;
  }
  for (const k of reg.values()) {
    if (k.status === "active") {
      activeKid = k.kid;
      return k;
    }
  }
  throw new FailClosedSigningConfigurationError("No active signing key in registry.");
}

export function rotateV03SigningKey(params: {
  newKid: string;
  newSeedMaterial: string;
  rotatedAt?: string;
}): {
  previousKid: string;
  newActiveKid: string;
  jwks: ReturnType<typeof getStandardJwksDocument>;
} {
  const reg = getV03SigningKeyRegistry();
  const rotatedAt = params.rotatedAt ?? new Date().toISOString();
  const prev = getActiveV03SigningKey();
  if (prev.kid !== params.newKid) {
    prev.status = "retired_verify_only";
    prev.retiredAt = rotatedAt;
  }
  const next = deriveKeyEntryFromSeed({
    kid: params.newKid,
    seedMaterial: params.newSeedMaterial,
    status: "active",
    createdAt: rotatedAt,
  });
  reg.set(next.kid, next);
  activeKid = next.kid;
  return {
    previousKid: prev.kid,
    newActiveKid: next.kid,
    jwks: getStandardJwksDocument(),
  };
}

export function revokeV03SigningKey(params: {
  kid: string;
  reason: string;
  revokedAt?: string;
}): void {
  const reg = getV03SigningKeyRegistry();
  const entry = reg.get(params.kid);
  if (!entry) {
    throw new Error(`Signing key "${params.kid}" not found.`);
  }
  entry.status = "revoked";
  entry.revokedAt = params.revokedAt ?? new Date().toISOString();
  entry.revocationReason = params.reason;
  if (activeKid === params.kid) {
    activeKid = null;
  }
}

/**
 * Standard RFC 7517 JSON Web Key Set (JWKS) for `/.well-known/jwks.json`.
 * Exposes non-revoked public keys (`active` and `retired_verify_only`) in standard JWK format,
 * plus revocation metadata so verifiers can enforce explicit revocation policy.
 */
export function getStandardJwksDocument(): {
  keys: Array<
    V03PublicJwk & {
      status: KeyLifecycleStatus;
      jwkThumbprintSha256: string;
      createdAt: string;
      retiredAt: string | null;
      revokedAt: string | null;
      revocationReason: string | null;
    }
  >;
  issuer: string;
  activeKid: string | null;
  revocationPolicy: {
    activeKeysCanSignAndVerify: true;
    retiredKeysCanVerifyHistoricalReceiptsOnly: true;
    revokedKeysFailClosedImmediately: true;
  };
} {
  const reg = getV03SigningKeyRegistry();
  const keys = Array.from(reg.values()).map((k) => ({
    ...k.publicJwk,
    status: k.status,
    jwkThumbprintSha256: k.jwkThumbprintSha256,
    createdAt: k.createdAt,
    retiredAt: k.retiredAt,
    revokedAt: k.revokedAt,
    revocationReason: k.revocationReason,
  }));

  return {
    keys,
    issuer: ISSUER_URI,
    activeKid,
    revocationPolicy: {
      activeKeysCanSignAndVerify: true,
      retiredKeysCanVerifyHistoricalReceiptsOnly: true,
      revokedKeysFailClosedImmediately: true,
    },
  };
}

/**
 * Signs a receipt payload using RFC 8785 canonicalization and standard JWS Compact Serialization (`alg=EdDSA`).
 * Receipt ID is full 64-hex SHA-256: `rcpt:sha256:<64-hex>` (or `rcpt:sim:sha256:<64-hex>` when `isSynthetic`).
 */
export async function signV03DecisionReceiptJws(
  inputPayload: Omit<V03PinnedReceiptPayload, "spec" | "receiptId" | "issuer"> & {
    issuedAt?: string;
  },
): Promise<V03SignedDecisionReceipt> {
  const activeKey = getActiveV03SigningKey();
  if (!activeKey.privateKeyObject) {
    throw new FailClosedSigningConfigurationError(
      `Signing key "${activeKey.kid}" does not have a private key loaded.`,
    );
  }

  // Compute deterministic content identity from the pinned fields (excluding per-run evaluationRunId/traceRunId/issuedAt)
  const deterministicIdentityCore = rfc8785Canonicalize({
    executionClass: inputPayload.executionClass,
    isSynthetic: inputPayload.isSynthetic,
    evaluationFingerprint: inputPayload.evaluationFingerprint,
    engineId: inputPayload.engineId,
    engineVersion: inputPayload.engineVersion,
    compilerVersion: inputPayload.compilerVersion,
    decisionIrBundleHash: inputPayload.decisionIrBundleHash,
    candidateUniverseId: inputPayload.candidateUniverseId,
    candidateUniverseVersion: inputPayload.candidateUniverseVersion,
    candidateUniverseHash: inputPayload.candidateUniverseHash,
    pinnedRuleVersionHashes: inputPayload.pinnedRuleVersionHashes,
    pinnedClaimEventHashes: inputPayload.pinnedClaimEventHashes,
    pinnedEvidenceHashes: inputPayload.pinnedEvidenceHashes,
    pinnedSchemaHashes: inputPayload.pinnedSchemaHashes,
    normalizedInputHash: inputPayload.normalizedInputHash,
    validAt: inputPayload.validAt,
    knowledgeCutoff: inputPayload.knowledgeCutoff,
    resultHash: inputPayload.resultHash,
    traceHash: inputPayload.traceHash,
  });

  const fullReceiptSha256 = sha256HexFull(deterministicIdentityCore);
  const receiptPrefix = inputPayload.isSynthetic ? "rcpt:sim:sha256:" : "rcpt:sha256:";
  const receiptId = `${receiptPrefix}${fullReceiptSha256}`;

  const payload: V03PinnedReceiptPayload = {
    spec: "dcc-decision-receipt/0.3",
    receiptId,
    executionClass: inputPayload.executionClass,
    isSynthetic: inputPayload.isSynthetic,
    syntheticWatermark: inputPayload.syntheticWatermark,
    issuer: ISSUER_URI,
    issuedAt: inputPayload.issuedAt ?? new Date().toISOString(),
    evaluationRunId: inputPayload.evaluationRunId,
    traceRunId: inputPayload.traceRunId,
    evaluationFingerprint: inputPayload.evaluationFingerprint,
    engineId: inputPayload.engineId,
    engineVersion: inputPayload.engineVersion,
    compilerVersion: inputPayload.compilerVersion,
    decisionIrBundleHash: inputPayload.decisionIrBundleHash,
    candidateUniverseId: inputPayload.candidateUniverseId,
    candidateUniverseVersion: inputPayload.candidateUniverseVersion,
    candidateUniverseHash: inputPayload.candidateUniverseHash,
    pinnedRuleVersionHashes: inputPayload.pinnedRuleVersionHashes,
    pinnedClaimEventHashes: inputPayload.pinnedClaimEventHashes,
    pinnedEvidenceHashes: inputPayload.pinnedEvidenceHashes,
    pinnedSchemaHashes: inputPayload.pinnedSchemaHashes,
    normalizedInputHash: inputPayload.normalizedInputHash,
    validAt: inputPayload.validAt,
    knowledgeCutoff: inputPayload.knowledgeCutoff,
    decisionState: inputPayload.decisionState,
    recommendedCandidateDccId: inputPayload.recommendedCandidateDccId,
    recommendedCandidateLegacyCode: inputPayload.recommendedCandidateLegacyCode,
    candidateDispositionSummary: inputPayload.candidateDispositionSummary,
    resultHash: inputPayload.resultHash,
    traceHash: inputPayload.traceHash,
    epistemicLimitationStatement: inputPayload.epistemicLimitationStatement,
  };

  const rfc8785CanonicalPayload = rfc8785Canonicalize(payload);
  const rfc8785PayloadSha256 = sha256HexFull(rfc8785CanonicalPayload);

  const jwsCompact = jwsCompactSignEdDsa({
    protectedHeader: {
      alg: "EdDSA",
      typ: "application/dcc-decision-receipt+jws",
      kid: activeKey.kid,
      jku: JWKS_URI,
    },
    payloadUtf8: rfc8785CanonicalPayload,
    privateKeyObject: activeKey.privateKeyObject,
  });

  return {
    objectType: "DecisionReceipt",
    spec: "dcc-decision-receipt/0.3",
    receiptId,
    executionClass: payload.executionClass,
    isSynthetic: payload.isSynthetic,
    kid: activeKey.kid,
    alg: "EdDSA",
    typ: "application/dcc-decision-receipt+jws",
    jku: JWKS_URI,
    issuedAt: payload.issuedAt,
    rfc8785CanonicalPayload,
    rfc8785PayloadSha256,
    jwsCompact,
    payload,
  };
}

export function jwsCompactSignEdDsa(params: {
  protectedHeader: {
    alg: "EdDSA";
    typ: string;
    kid: string;
    jku?: string;
  };
  payloadUtf8: string;
  privateKeyObject: crypto.KeyObject;
}): string {
  const headerJson = JSON.stringify(params.protectedHeader);
  const headerB64 = Buffer.from(headerJson, "utf8").toString("base64url");
  const payloadB64 = Buffer.from(params.payloadUtf8, "utf8").toString("base64url");
  const signingInput = `${headerB64}.${payloadB64}`;
  const sigB64 = crypto
    .sign(null, Buffer.from(signingInput, "ascii"), params.privateKeyObject)
    .toString("base64url");
  return `${signingInput}.${sigB64}`;
}

export function jwsCompactVerifyEdDsa(params: {
  jwsCompact: string;
  jwks?: ReturnType<typeof getStandardJwksDocument>;
}): {
  valid: boolean;
  reason?: string;
  kid?: string;
  keyStatus?: KeyLifecycleStatus;
  jwkThumbprintSha256?: string;
  decodedPayloadUtf8?: string;
} {
  try {
    const parts = params.jwsCompact.split(".");
    if (parts.length !== 3) {
      return { valid: false, reason: "INVALID_JWS_COMPACT_FORMAT: Expected 3 segments." };
    }
    const [headerB64, payloadB64, sigB64] = parts as [string, string, string];
    const header = JSON.parse(Buffer.from(headerB64, "base64url").toString("utf8")) as {
      alg?: string;
      typ?: string;
      kid?: string;
      jku?: string;
    };
    if (header.alg !== "EdDSA") {
      return {
        valid: false,
        reason: `UNSUPPORTED_JWS_ALG: Expected EdDSA, got ${String(header.alg)}`,
      };
    }
    if (!header.kid) {
      return { valid: false, reason: "MISSING_JWS_KID: Protected header is missing kid." };
    }

    const jwksDoc = params.jwks ?? getStandardJwksDocument();
    const keyEntry = jwksDoc.keys.find((k) => k.kid === header.kid);
    if (!keyEntry) {
      return { valid: false, reason: `UNKNOWN_KID: Key "${header.kid}" not found in JWKS.` };
    }
    if (keyEntry.status === "revoked") {
      return {
        valid: false,
        kid: keyEntry.kid,
        keyStatus: "revoked",
        reason: `KEY_REVOKED: Key "${header.kid}" was revoked (${keyEntry.revocationReason ?? "no reason"}).`,
      };
    }

    const publicKey = crypto.createPublicKey({
      key: {
        kty: keyEntry.kty,
        crv: keyEntry.crv,
        x: keyEntry.x,
      },
      format: "jwk",
    });

    const signingInput = `${headerB64}.${payloadB64}`;
    const signatureOk = crypto.verify(
      null,
      Buffer.from(signingInput, "ascii"),
      publicKey,
      Buffer.from(sigB64, "base64url"),
    );
    if (!signatureOk) {
      return {
        valid: false,
        kid: keyEntry.kid,
        reason: "JWS_VERIFICATION_FAILED: Ed25519 signature verification failed.",
      };
    }

    const decodedPayloadUtf8 = Buffer.from(payloadB64, "base64url").toString("utf8");
    const thumbprint = crypto
      .createHash("sha256")
      .update(
        rfc8785Canonicalize({ crv: keyEntry.crv, kty: keyEntry.kty, x: keyEntry.x }),
        "utf8",
      )
      .digest("base64url");

    return {
      valid: true,
      kid: keyEntry.kid,
      keyStatus: keyEntry.status,
      jwkThumbprintSha256: thumbprint,
      decodedPayloadUtf8,
    };
  } catch (err) {
    return {
      valid: false,
      reason: `JWS_VERIFICATION_FAILED: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Independently verifies a JWS Compact receipt against a standard JWKS document.
 * Enforces:
 * - Protected header `alg === "EdDSA"` and `kid` presence
 * - Key lookup in JWKS and explicit revocation rejection (`status === "revoked"` -> fail closed)
 * - Cryptographic `EdDSA` signature verification via RFC 8037 JWK public key
 * - RFC 8785 payload canonicalization & full 64-char SHA-256 `receiptId` integrity
 */
export async function verifyV03DecisionReceiptJws(params: {
  jwsCompact: string;
  jwks?: ReturnType<typeof getStandardJwksDocument>;
}): Promise<{
  valid: boolean;
  reason?: string;
  kid?: string;
  keyStatus?: KeyLifecycleStatus;
  jwkThumbprintSha256?: string;
  payload?: V03PinnedReceiptPayload;
  rfc8785PayloadSha256?: string;
}> {
  const sigCheck = jwsCompactVerifyEdDsa(params);
  if (!sigCheck.valid || !sigCheck.decodedPayloadUtf8) {
    return {
      valid: false,
      kid: sigCheck.kid,
      keyStatus: sigCheck.keyStatus,
      reason: sigCheck.reason,
    };
  }

  try {
    const decodedText = sigCheck.decodedPayloadUtf8;
    const parsedPayload = JSON.parse(decodedText) as V03PinnedReceiptPayload;
    const recomputedCanonical = rfc8785Canonicalize(parsedPayload);

    if (recomputedCanonical !== decodedText) {
      return {
        valid: false,
        kid: sigCheck.kid,
        reason: "RFC8785_CANONICAL_MISMATCH: JWS payload bytes are not in RFC 8785 canonical form.",
      };
    }

    // Verify full 64-character SHA-256 receiptId format
    const expectedPrefix = parsedPayload.isSynthetic ? "rcpt:sim:sha256:" : "rcpt:sha256:";
    if (
      !parsedPayload.receiptId.startsWith(expectedPrefix) ||
      parsedPayload.receiptId.slice(expectedPrefix.length).length !== 64
    ) {
      return {
        valid: false,
        kid: sigCheck.kid,
        reason: `INVALID_RECEIPT_ID_FORMAT: Expected ${expectedPrefix}<64-hex>, got ${parsedPayload.receiptId}`,
      };
    }

    return {
      valid: true,
      kid: sigCheck.kid,
      keyStatus: sigCheck.keyStatus,
      jwkThumbprintSha256: sigCheck.jwkThumbprintSha256,
      payload: parsedPayload,
      rfc8785PayloadSha256: sha256HexFull(recomputedCanonical),
    };
  } catch (err) {
    return {
      valid: false,
      reason: `JWS_VERIFICATION_FAILED: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
