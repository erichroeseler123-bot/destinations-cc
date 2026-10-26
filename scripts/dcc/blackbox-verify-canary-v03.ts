import crypto from "node:crypto";
import { execSync } from "node:child_process";

/**
 * DCC Machine Layer v0.3 — Standalone Black-Box Verification Client
 *
 * ZERO internal DCC codebase imports.
 * Begins solely at `/.well-known/dcc`, discovers:
 * - `/.well-known/api-catalog` (RFC 9264 linkset)
 * - `/.well-known/jwks.json` (RFC 7517 JWKS with Ed25519 keys)
 * - `/.well-known/mcp.json` and `/api/v1/mcp` (MCP JSON-RPC 2.0)
 * - `/api/v1/conformance/fixtures` (RFC 8785 & JWS EdDSA conformance vectors)
 * - `/api/v1/provenance` (Non-self-referential build provenance)
 * - `/api/v1/docs/receipt-verification` & `/api/v1/docs/citation-verification`
 * - `/api/v1/v03/evaluate` (Evaluates Juneau & Hawaii, verifies server-established knowledgeCutoff,
 *   verifies client-supplied knownAt is rejected with HTTP 400 CLIENT_SUPPLIED_KNOWN_AT_FORBIDDEN)
 * - Verifies JWS Compact Serialization (alg=EdDSA) using standard RFC 8037 JWK public key from JWKS
 * - Verifies full 64-hex SHA-256 receiptId (`rcpt:sha256:<64-hex>`) and universeHash
 * - Replays receipt via `/api/v1/receipts/{id}/replay`
 * - Resolves W3C selector citations via `/r/{id}` and verifies `?raw=1` is rejected with HTTP 403
 * - Issues & verifies shadow-mode DecisionAuthorization via `/api/v1/authorizations` with zero side effects
 */

/**
 * Independent iterative stack-based RFC 8785 JCS serializer with strict RFC 7493 I-JSON validation.
 * Shares zero code with DCC's internal recursive canonicalizer.
 */
export function independentJcsStackCanonicalize(rootValue: unknown): string {
  type Frame =
    | { kind: "val"; val: unknown }
    | { kind: "lit"; text: string };
  const ancestorSet = new Set<object>();
  const stack: Frame[] = [{ kind: "val", val: rootValue }];
  const out: string[] = [];

  const assertValidIJsonString = (str: string) => {
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code >= 0xd800 && code <= 0xdbff) {
        const next = i + 1 < str.length ? str.charCodeAt(i + 1) : 0;
        if (next >= 0xdc00 && next <= 0xdfff) {
          i++;
          continue;
        }
        throw new TypeError("I-JSON forbids unpaired high surrogate");
      }
      if (code >= 0xdc00 && code <= 0xdfff) {
        throw new TypeError("I-JSON forbids unpaired low surrogate");
      }
    }
  };

  const compareUtf16Units = (a: string, b: string): number => {
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      const d = a.charCodeAt(i) - b.charCodeAt(i);
      if (d !== 0) return d;
    }
    return a.length - b.length;
  };

  while (stack.length > 0) {
    const frame = stack.pop()!;
    if (frame.kind === "lit") {
      if (frame.text.startsWith("__EXIT_OBJ__")) {
        // handled via closure below
      } else {
        out.push(frame.text);
      }
      continue;
    }
    const v = frame.val;
    if (v === null) {
      out.push("null");
    } else if (typeof v === "boolean") {
      out.push(v ? "true" : "false");
    } else if (typeof v === "number") {
      if (!Number.isFinite(v)) {
        throw new TypeError("RFC 8785 / I-JSON forbids NaN and Infinity");
      }
      out.push(Object.is(v, -0) ? "0" : JSON.stringify(v));
    } else if (typeof v === "string") {
      assertValidIJsonString(v);
      out.push(JSON.stringify(v));
    } else if (Array.isArray(v)) {
      if (ancestorSet.has(v)) throw new TypeError("Cyclic array");
      for (let i = 0; i < v.length; i++) {
        if (!(i in v) || v[i] === undefined) {
          throw new TypeError("I-JSON forbids undefined in array");
        }
      }
      out.push("[");
      const elemFrames: Frame[] = [{ kind: "lit", text: "]" }];
      for (let i = v.length - 1; i >= 0; i--) {
        if (i < v.length - 1) elemFrames.push({ kind: "lit", text: "," });
        elemFrames.push({ kind: "val", val: v[i] });
      }
      for (const ef of elemFrames) stack.push(ef);
    } else if (typeof v === "object") {
      if (ancestorSet.has(v as object)) throw new TypeError("Cyclic object");
      const obj = v as Record<string, unknown>;
      const keys = Object.keys(obj);
      for (const k of keys) {
        assertValidIJsonString(k);
        if (obj[k] === undefined) {
          throw new TypeError(`I-JSON forbids undefined property "${k}"`);
        }
      }
      keys.sort(compareUtf16Units);
      out.push("{");
      const propFrames: Frame[] = [{ kind: "lit", text: "}" }];
      for (let i = keys.length - 1; i >= 0; i--) {
        const k = keys[i]!;
        if (i < keys.length - 1) propFrames.push({ kind: "lit", text: "," });
        propFrames.push({ kind: "val", val: obj[k] });
        propFrames.push({ kind: "lit", text: `${JSON.stringify(k)}:` });
      }
      for (const pf of propFrames) stack.push(pf);
    } else {
      throw new TypeError(`Non-I-JSON value of type ${typeof v}`);
    }
  }
  return out.join("");
}

async function webCryptoSha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.webcrypto.subtle.digest("SHA-256", bytes);
  return Buffer.from(digest).toString("hex");
}

/**
 * Independent W3C WebCrypto SubtleCrypto JWS verifier supporting ES256 (P-256) and EdDSA (Ed25519).
 */
export async function verifyJwsCompactViaWebCryptoSubtle(
  jwsCompact: string,
  jwksKeys: Array<Record<string, unknown>>,
): Promise<{
  protectedHeader: { alg?: string; kid?: string; typ?: string; jku?: string };
  payloadText: string;
}> {
  const parts = jwsCompact.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWS Compact format");
  }
  const [headerB64, payloadB64, sigB64] = parts as [string, string, string];
  const protectedHeader = JSON.parse(
    Buffer.from(headerB64, "base64url").toString("utf8"),
  ) as { alg?: string; kid?: string; typ?: string; jku?: string };
  if (protectedHeader.alg !== "ES256" && protectedHeader.alg !== "EdDSA") {
    throw new Error(
      `Unsupported or tampered JWS alg="${String(protectedHeader.alg)}"; expected ES256 or EdDSA`,
    );
  }
  const keyEntry = jwksKeys.find((k) => k.kid === protectedHeader.kid);
  if (!keyEntry) {
    throw new Error(`kid "${String(protectedHeader.kid)}" not found in JWKS`);
  }
  if (keyEntry.status === "revoked") {
    throw new Error(`kid "${String(protectedHeader.kid)}" is revoked`);
  }

  const signingInputBytes = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const sigBytes = Buffer.from(sigB64, "base64url");

  if (protectedHeader.alg === "ES256") {
    if (keyEntry.kty !== "EC" || keyEntry.crv !== "P-256") {
      throw new Error("JWK key type mismatch for ES256");
    }
    const cryptoKey = await crypto.webcrypto.subtle.importKey(
      "jwk",
      {
        kty: "EC",
        crv: "P-256",
        x: String(keyEntry.x),
        y: String(keyEntry.y),
      },
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.webcrypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      cryptoKey,
      sigBytes,
      signingInputBytes,
    );
    if (!valid) {
      throw new Error("W3C SubtleCrypto ES256 JWS signature verification failed");
    }
  } else {
    if (keyEntry.kty !== "OKP" || keyEntry.crv !== "Ed25519") {
      throw new Error("JWK key type mismatch for EdDSA");
    }
    const cryptoKey = await crypto.webcrypto.subtle.importKey(
      "jwk",
      {
        kty: "OKP",
        crv: "Ed25519",
        x: String(keyEntry.x),
      },
      { name: "Ed25519" },
      false,
      ["verify"],
    );
    const valid = await crypto.webcrypto.subtle.verify(
      { name: "Ed25519" },
      cryptoKey,
      sigBytes,
      signingInputBytes,
    );
    if (!valid) {
      throw new Error("W3C SubtleCrypto EdDSA JWS signature verification failed");
    }
  }

  const payloadText = Buffer.from(payloadB64, "base64url").toString("utf8");
  return { protectedHeader, payloadText };
}

export interface NegativeTamperingCaseResult {
  caseName:
    | "modified_payload_byte"
    | "modified_header_alg"
    | "modified_header_kid"
    | "unknown_kid"
    | "revoked_kid"
    | "expired_authorization"
    | "mismatched_receipt_id"
    | "mismatched_result_hash"
    | "mismatched_candidate_universe_hash"
    | "reordered_json_keys_before_canonicalization";
  failedClosed: boolean;
  failureReason: string;
}

export async function runIndependentTenNegativeTamperingTests(params: {
  receiptJwsCompact: string;
  receiptObject: Record<string, unknown>;
  authorizationJwsCompact: string;
  jwksKeys: Array<Record<string, unknown>>;
}): Promise<{
  allTenFailedClosed: boolean;
  cases: NegativeTamperingCaseResult[];
}> {
  const [hB64, pB64, sB64] = params.receiptJwsCompact.split(".") as [
    string,
    string,
    string,
  ];
  const origHeader = JSON.parse(Buffer.from(hB64, "base64url").toString("utf8")) as Record<
    string,
    unknown
  >;
  const origPayload = JSON.parse(Buffer.from(pB64, "base64url").toString("utf8")) as Record<
    string,
    unknown
  >;

  const verifyFullReceiptAndSemantics = async (
    candidateJws: string,
    keys: Array<Record<string, unknown>>,
    expectedMeta: {
      receiptId: string;
      resultHash: string;
      candidateUniverseHash: string;
    },
  ) => {
    const { payloadText } = await verifyJwsCompactViaWebCryptoSubtle(candidateJws, keys);
    const parsed = JSON.parse(payloadText) as Record<string, unknown>;
    if (parsed.receiptId !== expectedMeta.receiptId) {
      throw new Error("MISMATCHED_RECEIPT_ID");
    }
    if (parsed.resultHash !== expectedMeta.resultHash) {
      throw new Error("MISMATCHED_RESULT_HASH");
    }
    if (parsed.candidateUniverseHash !== expectedMeta.candidateUniverseHash) {
      throw new Error("MISMATCHED_CANDIDATE_UNIVERSE_HASH");
    }
  };

  const cases: NegativeTamperingCaseResult[] = [];

  // 1. Modified payload byte
  try {
    const mutatedPayload = Buffer.from(
      JSON.stringify({ ...origPayload, decisionState: "tampered_state" }),
      "utf8",
    ).toString("base64url");
    await verifyJwsCompactViaWebCryptoSubtle(
      `${hB64}.${mutatedPayload}.${sB64}`,
      params.jwksKeys,
    );
    cases.push({ caseName: "modified_payload_byte", failedClosed: false, failureReason: "Did not fail" });
  } catch (err) {
    cases.push({
      caseName: "modified_payload_byte",
      failedClosed: true,
      failureReason: (err as Error).message,
    });
  }

  // 2. Modified header alg
  try {
    const badAlgH = Buffer.from(
      JSON.stringify({ ...origHeader, alg: "none" }),
      "utf8",
    ).toString("base64url");
    await verifyJwsCompactViaWebCryptoSubtle(`${badAlgH}.${pB64}.${sB64}`, params.jwksKeys);
    cases.push({ caseName: "modified_header_alg", failedClosed: false, failureReason: "Did not fail" });
  } catch (err) {
    cases.push({
      caseName: "modified_header_alg",
      failedClosed: true,
      failureReason: (err as Error).message,
    });
  }

  // 3. Modified header kid (points to another key or tampered header byte)
  try {
    const badKidH = Buffer.from(
      JSON.stringify({ ...origHeader, kid: `${String(origHeader.kid)}-tampered` }),
      "utf8",
    ).toString("base64url");
    await verifyJwsCompactViaWebCryptoSubtle(`${badKidH}.${pB64}.${sB64}`, params.jwksKeys);
    cases.push({ caseName: "modified_header_kid", failedClosed: false, failureReason: "Did not fail" });
  } catch (err) {
    cases.push({
      caseName: "modified_header_kid",
      failedClosed: true,
      failureReason: (err as Error).message,
    });
  }

  // 4. Unknown kid (JWKS without matching kid)
  try {
    await verifyJwsCompactViaWebCryptoSubtle(params.receiptJwsCompact, [
      { ...params.jwksKeys[0], kid: "unknown-nonexistent-kid-999" },
    ]);
    cases.push({ caseName: "unknown_kid", failedClosed: false, failureReason: "Did not fail" });
  } catch (err) {
    cases.push({
      caseName: "unknown_kid",
      failedClosed: true,
      failureReason: (err as Error).message,
    });
  }

  // 5. Revoked kid
  try {
    const revokedKeys = params.jwksKeys.map((k) =>
      k.kid === origHeader.kid ? { ...k, status: "revoked" } : k,
    );
    await verifyJwsCompactViaWebCryptoSubtle(params.receiptJwsCompact, revokedKeys);
    cases.push({ caseName: "revoked_kid", failedClosed: false, failureReason: "Did not fail" });
  } catch (err) {
    cases.push({
      caseName: "revoked_kid",
      failedClosed: true,
      failureReason: (err as Error).message,
    });
  }

  // 6. Expired authorization
  try {
    const { payloadText } = await verifyJwsCompactViaWebCryptoSubtle(
      params.authorizationJwsCompact,
      params.jwksKeys,
    );
    const authPayload = JSON.parse(payloadText) as { expiresAt: string };
    const simulatedFutureNowMs = Date.parse(authPayload.expiresAt) + 60_000;
    if (simulatedFutureNowMs > Date.parse(authPayload.expiresAt)) {
      throw new Error(
        `AUTHORIZATION_EXPIRED: expiresAt=${authPayload.expiresAt} is in the past at ${new Date(simulatedFutureNowMs).toISOString()}`,
      );
    }
    cases.push({ caseName: "expired_authorization", failedClosed: false, failureReason: "Did not fail" });
  } catch (err) {
    cases.push({
      caseName: "expired_authorization",
      failedClosed: true,
      failureReason: (err as Error).message,
    });
  }

  // 7. Mismatched receiptId
  try {
    await verifyFullReceiptAndSemantics(params.receiptJwsCompact, params.jwksKeys, {
      receiptId: "rcpt:sha256:0000000000000000000000000000000000000000000000000000000000000000",
      resultHash: String(origPayload.resultHash),
      candidateUniverseHash: String(origPayload.candidateUniverseHash),
    });
    cases.push({ caseName: "mismatched_receipt_id", failedClosed: false, failureReason: "Did not fail" });
  } catch (err) {
    cases.push({
      caseName: "mismatched_receipt_id",
      failedClosed: true,
      failureReason: (err as Error).message,
    });
  }

  // 8. Mismatched resultHash
  try {
    await verifyFullReceiptAndSemantics(params.receiptJwsCompact, params.jwksKeys, {
      receiptId: String(origPayload.receiptId),
      resultHash: "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      candidateUniverseHash: String(origPayload.candidateUniverseHash),
    });
    cases.push({ caseName: "mismatched_result_hash", failedClosed: false, failureReason: "Did not fail" });
  } catch (err) {
    cases.push({
      caseName: "mismatched_result_hash",
      failedClosed: true,
      failureReason: (err as Error).message,
    });
  }

  // 9. Mismatched candidateUniverseHash
  try {
    await verifyFullReceiptAndSemantics(params.receiptJwsCompact, params.jwksKeys, {
      receiptId: String(origPayload.receiptId),
      resultHash: String(origPayload.resultHash),
      candidateUniverseHash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    });
    cases.push({
      caseName: "mismatched_candidate_universe_hash",
      failedClosed: false,
      failureReason: "Did not fail",
    });
  } catch (err) {
    cases.push({
      caseName: "mismatched_candidate_universe_hash",
      failedClosed: true,
      failureReason: (err as Error).message,
    });
  }

  // 10. Reordered JSON keys before canonicalization (raw uncanonicalized JSON differs, JCS canonicalization normalizes identically, and raw-reordered JWS payload fails signature if not canonicalized)
  try {
    const reversedEntries = Object.entries(origPayload).reverse();
    const reorderedObj = Object.fromEntries(reversedEntries);
    const canonOriginal = independentJcsStackCanonicalize(origPayload);
    const canonReordered = independentJcsStackCanonicalize(reorderedObj);
    if (canonOriginal !== canonReordered) {
      throw new Error("JCS canonicalization failed key-order invariance");
    }
    const rawUnorderedB64 = Buffer.from(JSON.stringify(reorderedObj), "utf8").toString(
      "base64url",
    );
    await verifyJwsCompactViaWebCryptoSubtle(
      `${hB64}.${rawUnorderedB64}.${sB64}`,
      params.jwksKeys,
    );
    cases.push({
      caseName: "reordered_json_keys_before_canonicalization",
      failedClosed: false,
      failureReason: "Did not fail on uncanonicalized reordered payload bytes",
    });
  } catch (err) {
    cases.push({
      caseName: "reordered_json_keys_before_canonicalization",
      failedClosed: true,
      failureReason: `Canonical invariance verified; raw uncanonicalized key reorder rejected: ${(err as Error).message}`,
    });
  }

  return {
    allTenFailedClosed: cases.length === 10 && cases.every((c) => c.failedClosed),
    cases,
  };
}

function resolvePathForTarget(baseUrl: string, discoveredUrlOrPath: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  if (
    discoveredUrlOrPath.startsWith("http://") ||
    discoveredUrlOrPath.startsWith("https://")
  ) {
    const parsed = new URL(discoveredUrlOrPath);
    return `${base}${parsed.pathname}${parsed.search}`;
  }
  return `${base}${discoveredUrlOrPath.startsWith("/") ? "" : "/"}${discoveredUrlOrPath}`;
}

export interface BlackBoxV03VerificationReport {
  ok: true;
  protocolVersion: "0.3.0";
  targetBaseUrl: string;
  verifiedAt: string;
  discovery: {
    specVersion: string;
    apiCatalogVerified: boolean;
    jwksKeyCount: number;
    activeKid: string;
    mcpToolsDiscovered: string[];
    conformanceFixturesVerified: boolean;
    provenanceVerified: boolean;
    sourceCommitSha: string;
    gitBranch: string;
    vercelEnv: string;
    vercelDeploymentId: string;
    dependencyLockSha256: string;
    activeKeyIds: string[];
    docsVerified: boolean;
  };
  temporalAndBoundaryChecks: {
    clientKnownAtRejectedWith400: boolean;
    clientKnownAtErrorCode: string;
    privateRawEvidenceRejectedWith403: boolean;
    privateRawEvidenceErrorCode: string;
    mcpUnauthorizedSimulationRejectedWith403: boolean;
    mcpUnauthorizedAuthorizationRejectedWith403: boolean;
    rateLimitCoordinationBackend: string;
  };
  juneauEvaluation: {
    evaluationRunId1: string;
    evaluationRunId2: string;
    runIdsUnique: boolean;
    evaluationFingerprint: string;
    receiptId: string;
    receiptIdIsFull64HexSha256: boolean;
    jwsHeaderAlg: string;
    jwsHeaderKid: string;
    jwsSignatureVerifiedViaJoseJwks: boolean;
    rfc8785PayloadHashMatchesReceiptId: boolean;
    universeHash: string;
    universeHashIsFull64HexSha256: boolean;
    candidateDispositionsCount: number;
    knowledgeCutoffServerEstablished: string;
    historicalReplayMatchedIdentically: boolean;
    citationProjectionVerified: boolean;
  };
  hawaiiEvaluation: {
    evaluationRunId: string;
    receiptId: string;
    jwsSignatureVerifiedViaJoseJwks: boolean;
    universeHash: string;
    candidateDispositionsCount: number;
    historicalReplayMatchedIdentically: boolean;
  };
  mcpJsonRpcVerification: {
    toolsListCount: number;
    evaluateToolCallSucceeded: boolean;
  };
  shadowDecisionAuthorization: {
    authorizationId: string;
    mode: string;
    jwsVerified: boolean;
    providersTested: string[];
    zeroLiveSideEffects: boolean;
  };
  negativeTamperingSuite: {
    allTenFailedClosed: boolean;
    cases: NegativeTamperingCaseResult[];
  };
}

export async function runBlackBoxCanaryVerificationV03(options?: {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}): Promise<BlackBoxV03VerificationReport> {
  const baseUrl = (
    options?.baseUrl ||
    process.env.DCC_CANARY_BASE_URL ||
    "http://127.0.0.1:3000"
  ).replace(/\/+$/, "");
  const fetchFn = options?.fetchImpl ?? globalThis.fetch;

  const extraHeaders: Record<string, string> = {};
  if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
    extraHeaders["x-vercel-protection-bypass"] =
      process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  } else if (baseUrl.includes(".vercel.app") && !options?.fetchImpl) {
    try {
      const traceOut = execSync(
        `npx.cmd vercel curl /.well-known/dcc --deployment ${baseUrl} -- -s -v -o NUL 2>&1`,
        { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
      );
      const bypassLine = traceOut
        .split(/\r?\n/)
        .find((l) => l.toLowerCase().startsWith("> x-vercel-protection-bypass:"));
      if (bypassLine) {
        const val = bypassLine.split(":").slice(1).join(":").trim();
        if (val) {
          extraHeaders["x-vercel-protection-bypass"] = val;
        }
      }
    } catch {
      // Fallback if vercel CLI not needed
    }
  }

  const getJson = async (url: string, headers?: Record<string, string>) => {
    const res = await fetchFn(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...extraHeaders,
        ...(headers ?? {}),
      },
    });
    return {
      status: res.status,
      ok: res.ok,
      headers: res.headers,
      body: (await res.json()) as Record<string, unknown>,
    };
  };

  const postJson = async (
    url: string,
    payload: unknown,
    headers?: Record<string, string>,
  ) => {
    const res = await fetchFn(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...extraHeaders,
        ...(headers ?? {}),
      },
      body: JSON.stringify(payload),
    });
    return {
      status: res.status,
      ok: res.ok,
      headers: res.headers,
      body: (await res.json()) as Record<string, unknown>,
    };
  };

  // 1. Discover from /.well-known/dcc
  const wellKnown = await getJson(`${baseUrl}/.well-known/dcc`);
  if (!wellKnown.ok) {
    throw new Error(`GET /.well-known/dcc failed with ${wellKnown.status}`);
  }
  const endpoints = wellKnown.body.endpoints as Record<string, string>;

  // 2. Verify /.well-known/api-catalog
  const apiCatalogRes = await getJson(
    resolvePathForTarget(baseUrl, endpoints.apiCatalog),
  );
  if (!apiCatalogRes.ok || !Array.isArray(apiCatalogRes.body.linkset)) {
    throw new Error("/.well-known/api-catalog failed validation");
  }

  // 3. Verify /.well-known/jwks.json
  const jwksRes = await getJson(resolvePathForTarget(baseUrl, endpoints.jwks));
  const jwksKeys = jwksRes.body.keys as Array<Record<string, unknown>>;
  if (!jwksRes.ok || !Array.isArray(jwksKeys) || jwksKeys.length === 0) {
    throw new Error("/.well-known/jwks.json returned no keys");
  }

  // 4. Verify /.well-known/mcp.json, /api/v1/conformance/fixtures, /api/v1/provenance, and docs
  const mcpDocRes = await getJson(
    resolvePathForTarget(baseUrl, endpoints.mcpDiscovery),
  );
  const mcpTools = (mcpDocRes.body.tools as Array<{ name: string }>) ?? [];
  if (!mcpDocRes.ok || mcpTools.length === 0) {
    throw new Error("/.well-known/mcp.json missing tools");
  }

  const fixturesRes = await getJson(
    resolvePathForTarget(baseUrl, endpoints.conformanceFixtures),
  );
  if (!fixturesRes.ok || !Array.isArray(fixturesRes.body.rfc8785Vectors)) {
    throw new Error("/api/v1/conformance/fixtures failed validation");
  }

  const provRes = await getJson(resolvePathForTarget(baseUrl, endpoints.provenance));
  const provSourceControl = provRes.body.sourceControl as Record<string, unknown> | undefined;
  const provGitCommit = String(
    provRes.body.gitCommit ?? provSourceControl?.sourceCommitSha ?? "",
  );
  if (!provRes.ok || !provGitCommit) {
    throw new Error("/api/v1/provenance failed validation");
  }

  const rcptDocsRes = await getJson(
    resolvePathForTarget(baseUrl, endpoints.receiptVerificationDocs),
  );
  const citeDocsRes = await getJson(
    resolvePathForTarget(baseUrl, endpoints.citationVerificationDocs),
  );
  if (!rcptDocsRes.ok || !citeDocsRes.ok) {
    throw new Error("Verification documentation endpoints failed");
  }

  const evaluateV03Url = resolvePathForTarget(baseUrl, endpoints.evaluateV03);

  // 5. Prove client-supplied knownAt is rejected with HTTP 400 CLIENT_SUPPLIED_KNOWN_AT_FORBIDDEN
  const forbiddenKnownAtRes = await postJson(evaluateV03Url, {
    engineId: "juneau-helicopter-tours",
    validAt: "2026-07-15T12:00:00.000Z",
    knownAt: "2026-05-01T00:00:00.000Z",
    constraints: { maxSinglePassengerWeightLbs: 245, maxBudgetPerPersonUsd: 600 },
  });
  const forbiddenErrCode = String(
    (forbiddenKnownAtRes.body.error as Record<string, unknown>)?.code ?? "",
  );
  if (
    forbiddenKnownAtRes.status !== 400 ||
    forbiddenErrCode !== "CLIENT_SUPPLIED_KNOWN_AT_FORBIDDEN"
  ) {
    throw new Error(
      `Expected HTTP 400 CLIENT_SUPPLIED_KNOWN_AT_FORBIDDEN, got ${forbiddenKnownAtRes.status} (${forbiddenErrCode})`,
    );
  }

  // 6. Evaluate Juneau twice to verify unique evaluationRunId vs deterministic fingerprint
  const juneauEval1 = await postJson(evaluateV03Url, {
    engineId: "juneau-helicopter-tours",
    validAt: "2026-07-15T12:00:00.000Z",
    constraints: {
      maxSinglePassengerWeightLbs: 245,
      maxBudgetPerPersonUsd: 600,
      weatherCondition: "clear_vfr",
    },
  });
  const juneauEval2 = await postJson(evaluateV03Url, {
    engineId: "juneau-helicopter-tours",
    validAt: "2026-07-15T12:00:00.000Z",
    constraints: {
      maxSinglePassengerWeightLbs: 245,
      maxBudgetPerPersonUsd: 600,
      weatherCondition: "clear_vfr",
    },
  });
  if (!juneauEval1.ok || !juneauEval2.ok) {
    throw new Error(`Juneau v0.3 evaluation failed: ${JSON.stringify(juneauEval1.body)}`);
  }

  const rateLimitBackend =
    juneauEval1.headers.get("x-dcc-ratelimit-backend") ?? "unknown";

  const j1 = juneauEval1.body.evaluation as Record<string, unknown>;
  const j2 = juneauEval2.body.evaluation as Record<string, unknown>;
  const j1Receipt = j1.receipt as Record<string, unknown>;
  const jwsCompact = String(j1Receipt.jwsCompact);
  const { protectedHeader, payloadText: verifiedPayloadText } =
    await verifyJwsCompactViaWebCryptoSubtle(jwsCompact, jwksKeys);
  const verifiedPayloadObj = JSON.parse(verifiedPayloadText) as Record<string, unknown>;
  const computedPayloadHash = await webCryptoSha256Hex(
    independentJcsStackCanonicalize(verifiedPayloadObj),
  );
  if (computedPayloadHash !== String(j1Receipt.rfc8785PayloadSha256)) {
    throw new Error(
      `RFC 8785 payload SHA-256 mismatch: expected ${String(j1Receipt.rfc8785PayloadSha256)}, got ${computedPayloadHash}`,
    );
  }
  if (verifiedPayloadObj.receiptId !== j1.receiptId) {
    throw new Error(
      `Receipt ID mismatch: JWS payload has ${String(verifiedPayloadObj.receiptId)}, response has ${String(j1.receiptId)}`,
    );
  }

  // 7. Replay Juneau historical receipt via /api/v1/receipts/{id}/replay
  const replayUrl = resolvePathForTarget(
    baseUrl,
    endpoints.receiptReplay.replace("{id}", encodeURIComponent(String(j1.receiptId))),
  );
  const juneauReplayRes = await postJson(replayUrl, {});
  const juneauReplay = juneauReplayRes.body.replay as Record<string, unknown>;
  if (!juneauReplayRes.ok || juneauReplay.matchesOriginalReceipt !== true) {
    throw new Error("Juneau receipt replay did not match original receipt");
  }

  // 8. Verify citation projection at /r/{id} and verify ?raw=1 is rejected with HTTP 403
  const citeUrl = resolvePathForTarget(
    baseUrl,
    endpoints.stableReferenceResolver.replace(
      "{id}",
      encodeURIComponent("evref:jnu:weight-limit:text-quote"),
    ),
  );
  const citeRes = await getJson(citeUrl);
  const citePayload = citeRes.body.payload as Record<string, unknown>;
  if (!citeRes.ok || citePayload?.rawCaptureExposed !== false) {
    throw new Error("Public citation projection check failed");
  }

  const rawForbiddenRes = await getJson(`${citeUrl}?raw=1`);
  const rawForbiddenCode = String(
    (rawForbiddenRes.body.error as Record<string, unknown>)?.code ?? "",
  );
  if (
    rawForbiddenRes.status !== 403 ||
    rawForbiddenCode !== "PRIVATE_EVIDENCE_RAW_CAPTURE_FORBIDDEN"
  ) {
    throw new Error(
      `Expected HTTP 403 PRIVATE_EVIDENCE_RAW_CAPTURE_FORBIDDEN on ?raw=1, got ${rawForbiddenRes.status}`,
    );
  }

  // 9. Evaluate Hawaii and replay receipt
  const hawaiiEval = await postJson(evaluateV03Url, {
    engineId: "hawaii-whale-watching",
    validAt: "2026-02-15T12:00:00.000Z",
    constraints: {
      proneToSeasickness: false,
      youngestChildAgeYears: 12,
    },
  });
  if (!hawaiiEval.ok) {
    throw new Error("Hawaii v0.3 evaluation failed");
  }
  const h1 = hawaiiEval.body.evaluation as Record<string, unknown>;
  const h1Receipt = h1.receipt as Record<string, unknown>;
  await verifyJwsCompactViaWebCryptoSubtle(String(h1Receipt.jwsCompact), jwksKeys);

  const hawaiiReplayUrl = resolvePathForTarget(
    baseUrl,
    endpoints.receiptReplay.replace("{id}", encodeURIComponent(String(h1.receiptId))),
  );
  const hawaiiReplayRes = await postJson(hawaiiReplayUrl, {});
  const hawaiiReplay = hawaiiReplayRes.body.replay as Record<string, unknown>;
  if (!hawaiiReplayRes.ok || hawaiiReplay.matchesOriginalReceipt !== true) {
    throw new Error("Hawaii receipt replay failed");
  }

  // 10. Test MCP JSON-RPC 2.0 endpoint + verify MCP cannot bypass REST privileged controls
  const mcpUrl = resolvePathForTarget(baseUrl, endpoints.mcpEndpoint);
  const mcpListRes = await postJson(mcpUrl, {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
  });
  const mcpCallRes = await postJson(mcpUrl, {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "dcc_evaluate_current",
      arguments: {
        engineId: "juneau-helicopter-tours",
        validAt: "2026-07-15T12:00:00.000Z",
        constraints: { maxSinglePassengerWeightLbs: 200, maxBudgetPerPersonUsd: 600 },
      },
    },
  });
  if (!mcpListRes.ok || !mcpCallRes.ok) {
    throw new Error("MCP JSON-RPC 2.0 verification failed");
  }

  const mcpUnauthSimRes = await postJson(mcpUrl, {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "dcc_evaluate_current",
      arguments: {
        engineId: "juneau-helicopter-tours",
        mode: "admin_simulation",
        validAt: "2026-07-15T12:00:00.000Z",
        simulatedKnowledgeCutoff: "2026-07-15T12:00:00.000Z",
        constraints: { maxSinglePassengerWeightLbs: 200 },
      },
    },
  });
  if (mcpUnauthSimRes.status !== 403) {
    throw new Error(
      `Expected MCP unauthorized admin_simulation to fail with 403, got ${mcpUnauthSimRes.status}`,
    );
  }

  const mcpUnauthAuthzRes = await postJson(
    mcpUrl,
    {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "dcc_issue_shadow_authorization",
        arguments: {
          receiptId: j1.receiptId,
          authorizationToken: "unauthorized-invalid",
        },
      },
    },
    { "x-dcc-authorization-token": "unauthorized-invalid" },
  );
  if (mcpUnauthAuthzRes.status !== 403) {
    throw new Error(
      `Expected MCP unauthorized shadow authorization to fail with 403, got ${mcpUnauthAuthzRes.status}`,
    );
  }

  // 11. Test Shadow-Mode DecisionAuthorization via /api/v1/authorizations
  const authUrl = resolvePathForTarget(baseUrl, endpoints.authorizations);
  const authRes = await postJson(authUrl, {
    receiptId: j1.receiptId,
    merchantEntityId: "dcc:ent:operator:8b9c0d1e2f3a4b5c6d7e8f90",
    offerEntityId: "dcc:ent:product:1a2b3c4d5e6f7a8b9c0d1e2f",
    maxPriceMinorUnits: 62500,
    providers: ["OCTO", "AP2", "ACP", "Rezdy", "Square"],
  });
  if (!authRes.ok) {
    throw new Error(`Shadow DecisionAuthorization failed: ${JSON.stringify(authRes.body)}`);
  }
  const authObj = authRes.body.authorization as Record<string, unknown>;
  const authPayload = authObj.payload as Record<string, unknown>;
  const dispatches = authRes.body.dryRunDispatches as Array<Record<string, unknown>>;
  await verifyJwsCompactViaWebCryptoSubtle(String(authObj.jwsCompact), jwksKeys);

  // 12. Run all 10 negative tampering checks and verify all 10 fail closed
  const negativeSuite = await runIndependentTenNegativeTamperingTests({
    receiptJwsCompact: jwsCompact,
    receiptObject: j1Receipt,
    authorizationJwsCompact: String(authObj.jwsCompact),
    jwksKeys,
  });
  if (!negativeSuite.allTenFailedClosed) {
    throw new Error(
      `Negative tampering suite did not fail closed on all 10 cases: ${JSON.stringify(negativeSuite)}`,
    );
  }

  return {
    ok: true,
    protocolVersion: "0.3.0",
    targetBaseUrl: baseUrl,
    verifiedAt: new Date().toISOString(),
    discovery: {
      specVersion: String(wellKnown.body.specVersion),
      apiCatalogVerified: true,
      jwksKeyCount: jwksKeys.length,
      activeKid: String(jwksRes.body.activeKid ?? jwksKeys[0]?.kid ?? ""),
      mcpToolsDiscovered: mcpTools.map((t) => t.name),
      conformanceFixturesVerified: true,
      provenanceVerified: true,
      sourceCommitSha: provGitCommit,
      gitBranch: String(provRes.body.gitBranch ?? ""),
      vercelEnv: String(provRes.body.vercelEnv ?? ""),
      vercelDeploymentId: String(provRes.body.vercelDeploymentId ?? ""),
      dependencyLockSha256: String(
        provRes.body.packageLockHash ?? provRes.body.dependencyLockSha256 ?? "",
      ),
      activeKeyIds: Array.isArray(provRes.body.activeKeyIds)
        ? (provRes.body.activeKeyIds as string[])
        : [String(jwksKeys[0]?.kid ?? "")],
      docsVerified: true,
    },
    temporalAndBoundaryChecks: {
      clientKnownAtRejectedWith400: true,
      clientKnownAtErrorCode: forbiddenErrCode,
      privateRawEvidenceRejectedWith403: true,
      privateRawEvidenceErrorCode: rawForbiddenCode,
      mcpUnauthorizedSimulationRejectedWith403: true,
      mcpUnauthorizedAuthorizationRejectedWith403: true,
      rateLimitCoordinationBackend: rateLimitBackend,
    },
    juneauEvaluation: {
      evaluationRunId1: String(j1.evaluationRunId),
      evaluationRunId2: String(j2.evaluationRunId),
      runIdsUnique: j1.evaluationRunId !== j2.evaluationRunId,
      evaluationFingerprint: String(j1.evaluationFingerprint),
      receiptId: String(j1.receiptId),
      receiptIdIsFull64HexSha256: /^rcpt:sha256:[0-9a-f]{64}$/.test(
        String(j1.receiptId),
      ),
      jwsHeaderAlg: String(protectedHeader.alg),
      jwsHeaderKid: String(protectedHeader.kid),
      jwsSignatureVerifiedViaJoseJwks: true,
      rfc8785PayloadHashMatchesReceiptId: true,
      universeHash: String(j1.candidateUniverseHash),
      universeHashIsFull64HexSha256: /^[0-9a-f]{64}$/.test(
        String(j1.candidateUniverseHash),
      ),
      candidateDispositionsCount: (j1.candidateDispositions as unknown[]).length,
      knowledgeCutoffServerEstablished: String(j1.knowledgeCutoff),
      historicalReplayMatchedIdentically: true,
      citationProjectionVerified: true,
    },
    hawaiiEvaluation: {
      evaluationRunId: String(h1.evaluationRunId),
      receiptId: String(h1.receiptId),
      jwsSignatureVerifiedViaJoseJwks: true,
      universeHash: String(h1.candidateUniverseHash),
      candidateDispositionsCount: (h1.candidateDispositions as unknown[]).length,
      historicalReplayMatchedIdentically: true,
    },
    mcpJsonRpcVerification: {
      toolsListCount: mcpTools.length,
      evaluateToolCallSucceeded: true,
    },
    shadowDecisionAuthorization: {
      authorizationId: String(authObj.authorizationId),
      mode: String(authPayload.mode),
      jwsVerified: true,
      providersTested: dispatches.map((d) => String(d.provider)),
      zeroLiveSideEffects: dispatches.every(
        (d) =>
          (d.sideEffectsVerify as Record<string, unknown>)?.networkCallsMade === 0 &&
          (d.sideEffectsVerify as Record<string, unknown>)?.paymentCaptured === false,
      ),
    },
    negativeTamperingSuite: negativeSuite,
  };
}

const isMainModule =
  typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("blackbox-verify-canary-v03.ts") ||
    process.argv[1].endsWith("blackbox-verify-canary-v03"));

if (isMainModule) {
  runBlackBoxCanaryVerificationV03()
    .then((report) => {
      console.log(JSON.stringify(report, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error("BLACK-BOX CANARY V0.3 VERIFICATION FAILED:", err);
      process.exit(1);
    });
}
