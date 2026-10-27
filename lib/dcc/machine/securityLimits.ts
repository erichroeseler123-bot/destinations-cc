import crypto from "node:crypto";
import { checkMachineApiRateLimit, resetMachineRateLimitsForTests } from "./ssrfGuard";

/**
 * DCC Machine Layer v0.2 / v0.3 — Security & Execution Resource Limits, Rate Limiting,
 * Machine Identity Boundary (`client_id`, W3C `traceparent`), and Assurance-Commerce Separation
 */

export type MachineApiKeyScope =
  | "dcc:read:public"
  | "dcc:evaluate"
  | "dcc:evaluate:batch"
  | "dcc:admin:write"
  | "dcc:commerce:handoff"
  | "dcc:commerce:report_outcome"
  | "dcc:commerce:read"
  | "evaluate:single"
  | "evaluate:batch";

export type RegisteredMachineApiKey = {
  keyId: string;
  clientId: string;
  secretToken: string;
  owner: string;
  scopes: MachineApiKeyScope[];
  maxRequestsPerMinute: number;
  revoked: boolean;
};

export type MachineResourceLimits = {
  maxSingleRequestBodyBytes: number;
  maxBatchRequestBodyBytes: number;
  maxBatchItems: number;
  maxCandidateCount: number;
  maxRuleCount: number;
  maxExecutionTimeMs: number;
};

export const DEFAULT_MACHINE_RESOURCE_LIMITS: MachineResourceLimits = {
  maxSingleRequestBodyBytes: 65_536, // 64 KB
  maxBatchRequestBodyBytes: 262_144, // 256 KB
  maxBatchItems: 250,
  maxCandidateCount: 500,
  maxRuleCount: 250,
  maxExecutionTimeMs: 250,
};

let runtimeLimitsOverride: Partial<MachineResourceLimits> | null = null;

export function getMachineResourceLimits(): MachineResourceLimits {
  return {
    ...DEFAULT_MACHINE_RESOURCE_LIMITS,
    ...(runtimeLimitsOverride ?? {}),
  };
}

export function setMachineResourceLimitsForTests(
  overrides: Partial<MachineResourceLimits> | null,
): void {
  runtimeLimitsOverride = overrides;
}

export function resetMachineSecurityLimitsForTests(): void {
  runtimeLimitsOverride = null;
  resetMachineRateLimitsForTests();
}

export class MachineSecurityLimitError extends Error {
  public readonly code:
    | "REQUEST_PAYLOAD_TOO_LARGE"
    | "REQUEST_BODY_TOO_LARGE"
    | "BATCH_EMPTY"
    | "BATCH_SIZE_EXCEEDED"
    | "BATCH_ITEM_LIMIT_EXCEEDED"
    | "CANDIDATE_COUNT_LIMIT_EXCEEDED"
    | "RULE_COUNT_LIMIT_EXCEEDED"
    | "EXECUTION_TIME_BUDGET_EXCEEDED"
    | "API_KEY_INVALID_OR_REVOKED"
    | "API_KEY_INSUFFICIENT_SCOPE"
    | "RATE_LIMIT_EXCEEDED";
  public readonly httpStatus: number;
  public readonly statusCode: number;
  public readonly limitValue: number | string;
  public readonly actualValue: number | string;

  constructor(params: {
    code: MachineSecurityLimitError["code"];
    message: string;
    httpStatus: number;
    limitValue: number | string;
    actualValue: number | string;
  }) {
    super(params.message);
    this.name = "MachineSecurityLimitError";
    this.code = params.code;
    this.httpStatus = params.httpStatus;
    this.statusCode = params.httpStatus;
    this.limitValue = params.limitValue;
    this.actualValue = params.actualValue;
  }
}

export function enforceEvaluationRequestSizeLimit(
  rawBodyText: string,
  isBatchOrMaxBytes?: boolean | number,
  customMaxBytes?: number,
): number {
  const limits = getMachineResourceLimits();
  const isBatch = typeof isBatchOrMaxBytes === "boolean" ? isBatchOrMaxBytes : false;
  const maxBytes =
    typeof isBatchOrMaxBytes === "number"
      ? isBatchOrMaxBytes
      : (customMaxBytes ??
        (isBatch ? limits.maxBatchRequestBodyBytes : limits.maxSingleRequestBodyBytes));
  const actualBytes = Buffer.byteLength(rawBodyText, "utf8");
  if (actualBytes > maxBytes) {
    throw new MachineSecurityLimitError({
      code: "REQUEST_PAYLOAD_TOO_LARGE",
      message: `Evaluation request body (${actualBytes} bytes) exceeds maximum allowed limit (${maxBytes} bytes).`,
      httpStatus: 413,
      limitValue: maxBytes,
      actualValue: actualBytes,
    });
  }
  return actualBytes;
}

export function enforceBatchItemCountLimit(
  itemsOrCount: number | unknown[],
  customMaxItems?: number,
): void {
  const itemCount = Array.isArray(itemsOrCount) ? itemsOrCount.length : itemsOrCount;
  if (itemCount <= 0) {
    throw new MachineSecurityLimitError({
      code: "BATCH_EMPTY",
      message: "Batch evaluation request must contain at least 1 item.",
      httpStatus: 400,
      limitValue: 1,
      actualValue: itemCount,
    });
  }
  const maxItems = customMaxItems ?? getMachineResourceLimits().maxBatchItems;
  if (itemCount > maxItems) {
    throw new MachineSecurityLimitError({
      code: "BATCH_SIZE_EXCEEDED",
      message: `Batch evaluation item count (${itemCount}) exceeds maximum allowed items (${maxItems}).`,
      httpStatus: 422,
      limitValue: maxItems,
      actualValue: itemCount,
    });
  }
}

export function enforceBundleComplexityLimits(params: {
  candidateCount: number;
  ruleCount: number;
  maxCandidateCount?: number;
  maxRuleCount?: number;
}): void {
  const limits = getMachineResourceLimits();
  const maxCandidates = params.maxCandidateCount ?? limits.maxCandidateCount;
  const maxRules = params.maxRuleCount ?? limits.maxRuleCount;

  if (params.candidateCount > maxCandidates) {
    throw new MachineSecurityLimitError({
      code: "CANDIDATE_COUNT_LIMIT_EXCEEDED",
      message: `Candidate count (${params.candidateCount}) exceeds maximum allowed candidate limit (${maxCandidates}).`,
      httpStatus: 422,
      limitValue: maxCandidates,
      actualValue: params.candidateCount,
    });
  }

  if (params.ruleCount > maxRules) {
    throw new MachineSecurityLimitError({
      code: "RULE_COUNT_LIMIT_EXCEEDED",
      message: `Rule count (${params.ruleCount}) exceeds maximum allowed rule limit (${maxRules}).`,
      httpStatus: 422,
      limitValue: maxRules,
      actualValue: params.ruleCount,
    });
  }
}

export const enforceCompilerResourceLimits = enforceBundleComplexityLimits;

export function enforceExecutionTimeBudget(
  elapsedMs: number,
  customMaxExecutionTimeMs?: number,
): void {
  const maxMs =
    customMaxExecutionTimeMs ?? getMachineResourceLimits().maxExecutionTimeMs;
  if (elapsedMs > maxMs) {
    throw new MachineSecurityLimitError({
      code: "EXECUTION_TIME_BUDGET_EXCEEDED",
      message: `Evaluator execution time (${elapsedMs.toFixed(2)}ms) exceeded strict time budget (${maxMs}ms).`,
      httpStatus: 503,
      limitValue: maxMs,
      actualValue: Number(elapsedMs.toFixed(3)),
    });
  }
}

const DEFAULT_API_KEYS: RegisteredMachineApiKey[] = [
  {
    keyId: "key:dcc-canary-eval-default",
    clientId: "client:dcc-canary-verifier",
    secretToken: process.env.DCC_MACHINE_EVAL_API_KEY || "dcc_eval_canary_v02_public_token",
    owner: "dcc-canary-verifier",
    scopes: [
      "dcc:read:public",
      "dcc:evaluate",
      "dcc:evaluate:batch",
      "dcc:commerce:handoff",
      "dcc:commerce:report_outcome",
      "dcc:commerce:read",
      "evaluate:single",
      "evaluate:batch",
    ],
    maxRequestsPerMinute: 600,
    revoked: false,
  },
  {
    keyId: "key:dcc-eval-single-only",
    clientId: "client:dcc-single-scope-agent",
    secretToken: "dcc_eval_single_only_v02_token",
    owner: "dcc-single-scope-agent",
    scopes: ["dcc:read:public", "dcc:evaluate", "evaluate:single"],
    maxRequestsPerMinute: 120,
    revoked: false,
  },
  {
    keyId: "key:dcc-commerce-reporter-only",
    clientId: "client:dcc-commerce-partner-reporter",
    secretToken: process.env.DCC_COMMERCE_REPORTER_API_KEY || "dcc_commerce_reporter_v03_token",
    owner: "dcc-commerce-partner-reporter",
    scopes: [
      "dcc:read:public",
      "dcc:commerce:handoff",
      "dcc:commerce:report_outcome",
      "dcc:commerce:read",
    ],
    maxRequestsPerMinute: 300,
    revoked: false,
  },
  {
    keyId: "key:dcc-read-only-no-eval",
    clientId: "client:dcc-readonly-client",
    secretToken: "dcc_readonly_v02_token",
    owner: "dcc-readonly-client",
    scopes: ["dcc:read:public"],
    maxRequestsPerMinute: 300,
    revoked: false,
  },
  {
    keyId: "key:dcc-revoked-key",
    clientId: "client:revoked-agent",
    secretToken: "dcc_revoked_v02_token",
    owner: "revoked-agent",
    scopes: ["dcc:evaluate", "dcc:evaluate:batch", "evaluate:single", "evaluate:batch"],
    maxRequestsPerMinute: 0,
    revoked: true,
  },
];

function scopeMatches(
  grantedScopes: MachineApiKeyScope[],
  requiredScope: MachineApiKeyScope,
): boolean {
  if (grantedScopes.includes(requiredScope)) return true;
  if (
    (requiredScope === "evaluate:single" || requiredScope === "dcc:evaluate") &&
    (grantedScopes.includes("evaluate:single") || grantedScopes.includes("dcc:evaluate"))
  ) {
    return true;
  }
  if (
    (requiredScope === "evaluate:batch" || requiredScope === "dcc:evaluate:batch") &&
    (grantedScopes.includes("evaluate:batch") || grantedScopes.includes("dcc:evaluate:batch"))
  ) {
    return true;
  }
  return false;
}

function resolveConfiguredApiKeys(): RegisteredMachineApiKey[] {
  const customJson = process.env.DCC_MACHINE_API_KEYS_JSON?.trim();
  const dynamicKeys: RegisteredMachineApiKey[] = [];
  if (customJson) {
    try {
      const parsed = JSON.parse(customJson) as Record<string, MachineApiKeyScope[]>;
      for (const [token, scopes] of Object.entries(parsed)) {
        if (Array.isArray(scopes)) {
          const shortId = token.slice(0, 12);
          dynamicKeys.push({
            keyId: `key:env:${shortId}`,
            clientId: `client:env:${shortId}`,
            secretToken: token,
            owner: "env-configured",
            scopes,
            maxRequestsPerMinute: 600,
            revoked: false,
          });
        }
      }
    } catch {
      // ignore invalid JSON
    }
  }
  return [...dynamicKeys, ...DEFAULT_API_KEYS];
}

export type AuthAndRateLimitResult = {
  keyId: string;
  clientId: string;
  tier: "authenticated_api_key" | "public_canary_anonymous";
  scopes: MachineApiKeyScope[];
  rateLimit: {
    limit: number;
    remaining: number;
    resetAtMs: number;
  };
};

export function verifyEvaluationAuthAndRateLimit(
  requestOrParams:
    | Request
    | {
        headers?: Headers | Record<string, string | undefined>;
        requiredScope: MachineApiKeyScope;
        clientIdentifier?: string;
        requireExplicitApiKey?: boolean;
        maxRequestsPerMinuteOverride?: number;
        nowMs?: number;
      },
  scopeArg?: MachineApiKeyScope,
): AuthAndRateLimitResult {
  const params =
    typeof (requestOrParams as Request).headers?.get === "function" &&
    !("requiredScope" in requestOrParams)
      ? {
          headers: (requestOrParams as Request).headers,
          requiredScope: scopeArg ?? ("evaluate:single" as const),
        }
      : (requestOrParams as {
          headers?: Headers | Record<string, string | undefined>;
          requiredScope: MachineApiKeyScope;
          clientIdentifier?: string;
          requireExplicitApiKey?: boolean;
          maxRequestsPerMinuteOverride?: number;
          nowMs?: number;
        });

  const getHeader = (name: string): string | null => {
    if (!params.headers) return null;
    if (typeof (params.headers as Headers).get === "function") {
      return (params.headers as Headers).get(name);
    }
    const rec = params.headers as Record<string, string | undefined>;
    const foundKey = Object.keys(rec).find(
      (k) => k.toLowerCase() === name.toLowerCase(),
    );
    return foundKey ? rec[foundKey] ?? null : null;
  };

  const authHeader = getHeader("authorization");
  const explicitKeyHeader = getHeader("x-dcc-api-key");
  const bearerToken =
    authHeader && /^Bearer\s+(.+)$/i.test(authHeader)
      ? authHeader.replace(/^Bearer\s+/i, "").trim()
      : null;
  const providedToken = explicitKeyHeader?.trim() || bearerToken;

  const requireExplicitKey =
    params.requireExplicitApiKey ??
    process.env.DCC_MACHINE_REQUIRE_EVAL_API_KEY === "1";

  let resolvedKey: RegisteredMachineApiKey | null = null;
  if (providedToken) {
    const allKeys = resolveConfiguredApiKeys();
    resolvedKey = allKeys.find((k) => k.secretToken === providedToken) ?? null;
    if (!resolvedKey || resolvedKey.revoked) {
      throw new MachineSecurityLimitError({
        code: "API_KEY_INVALID_OR_REVOKED",
        message: resolvedKey?.revoked
          ? `API key '${resolvedKey.keyId}' has been revoked.`
          : "Provided API key is invalid or unrecognized.",
        httpStatus: 401,
        limitValue: "valid_active_api_key",
        actualValue: providedToken.slice(0, 12),
      });
    }
    if (!scopeMatches(resolvedKey.scopes, params.requiredScope)) {
      throw new MachineSecurityLimitError({
        code: "API_KEY_INSUFFICIENT_SCOPE",
        message: `API key '${resolvedKey.keyId}' lacks required scope '${params.requiredScope}' (granted: ${resolvedKey.scopes.join(", ")}).`,
        httpStatus: 403,
        limitValue: params.requiredScope,
        actualValue: resolvedKey.scopes.join(","),
      });
    }
  } else if (requireExplicitKey) {
    throw new MachineSecurityLimitError({
      code: "API_KEY_INVALID_OR_REVOKED",
      message: "Missing required x-dcc-api-key or Authorization Bearer token for evaluation.",
      httpStatus: 401,
      limitValue: params.requiredScope,
      actualValue: "anonymous",
    });
  }

  const forwardedFor = getHeader("x-forwarded-for")?.split(",")[0]?.trim();
  const rateLimitBucketKey = resolvedKey
    ? `key:${resolvedKey.keyId}:${params.requiredScope}`
    : `anon:${params.clientIdentifier || forwardedFor || "local"}:${params.requiredScope}`;

  const maxRpm =
    params.maxRequestsPerMinuteOverride ??
    (resolvedKey ? resolvedKey.maxRequestsPerMinute : 180);

  const rl = checkMachineApiRateLimit(rateLimitBucketKey, maxRpm, params.nowMs);
  if (!rl.allowed) {
    throw new MachineSecurityLimitError({
      code: "RATE_LIMIT_EXCEEDED",
      message: `Rate limit exceeded for '${rateLimitBucketKey}' (limit: ${maxRpm} req/min).`,
      httpStatus: 429,
      limitValue: maxRpm,
      actualValue: maxRpm + 1,
    });
  }

  return {
    keyId: resolvedKey ? resolvedKey.keyId : "public_canary_anonymous",
    clientId: resolvedKey ? resolvedKey.clientId : "client:public_canary_anonymous",
    tier: resolvedKey ? "authenticated_api_key" : "public_canary_anonymous",
    scopes: resolvedKey
      ? resolvedKey.scopes
      : [
          "dcc:read:public",
          "dcc:evaluate",
          "dcc:evaluate:batch",
          "dcc:commerce:handoff",
          "dcc:commerce:read",
          "evaluate:single",
          "evaluate:batch",
        ],
    rateLimit: {
      limit: maxRpm,
      remaining: rl.remaining,
      resetAtMs: rl.resetAtMs,
    },
  };
}

/**
 * Validates or generates a standard W3C Trace Context `traceparent` header
 * (`00-<32hex-trace-id>-<16hex-parent-id>-<2hex-trace-flags>`).
 * Strictly diagnostic and guaranteed free of personal information.
 */
const W3C_TRACEPARENT_REGEX =
  /^00-(?!0{32})([0-9a-f]{32})-(?!0{16})([0-9a-f]{16})-([0-9a-f]{2})$/i;

export function resolveOrGenerateW3cTraceparent(
  requestOrHeader?: Request | Headers | Record<string, string | undefined> | string | null,
): string {
  let candidate: string | null = null;
  if (typeof requestOrHeader === "string") {
    candidate = requestOrHeader.trim();
  } else if (requestOrHeader && typeof (requestOrHeader as Request).headers?.get === "function") {
    candidate = (requestOrHeader as Request).headers.get("traceparent");
  } else if (requestOrHeader && typeof (requestOrHeader as Headers).get === "function") {
    candidate = (requestOrHeader as Headers).get("traceparent");
  } else if (requestOrHeader && typeof requestOrHeader === "object") {
    const rec = requestOrHeader as Record<string, string | undefined>;
    const key = Object.keys(rec).find((k) => k.toLowerCase() === "traceparent");
    candidate = key ? rec[key] ?? null : null;
  }

  if (candidate && W3C_TRACEPARENT_REGEX.test(candidate.trim())) {
    return candidate.trim().toLowerCase();
  }

  const traceId = crypto.randomBytes(16).toString("hex");
  const parentId = crypto.randomBytes(8).toString("hex");
  return `00-${traceId}-${parentId}-01`;
}

/**
 * Forbidden commercial & untrusted identity keys that must NEVER enter the assurance
 * evaluator or affect `normalizedInputHash`, `resultHash`, or `receiptId`.
 */
export const FORBIDDEN_COMMERCIAL_EVALUATION_KEYS = new Set([
  "commissionrate",
  "commission_rate",
  "commissionrates",
  "commission_rates",
  "affiliateaccount",
  "affiliate_account",
  "affiliatepreferences",
  "affiliate_preferences",
  "commercialroutingpriority",
  "commercial_routing_priority",
  "commercialpreferences",
  "commercial_preferences",
  "preferredprovider",
  "preferred_provider",
  "pid",
  "mcid",
  "asn",
  "partner_id",
  "partnerid",
  "handoff_id",
  "handoffid",
]);

export const UNTRUSTED_BODY_IDENTITY_KEYS = new Set([
  "client_id",
  "clientid",
  "caller_id",
  "callerid",
  "authenticated_client_id",
]);

export interface SanitizedAssuranceBodyResult {
  sanitizedBody: Record<string, unknown>;
  strippedUntrustedIdentityKeys: string[];
  strippedCommercialKeys: string[];
}

function stripForbiddenKeysFromObject(
  obj: Record<string, unknown>,
  strippedUntrustedIdentityKeys: Set<string>,
  strippedCommercialKeys: Set<string>,
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lower = key.toLowerCase();
    if (UNTRUSTED_BODY_IDENTITY_KEYS.has(lower)) {
      strippedUntrustedIdentityKeys.add(key);
      continue;
    }
    if (FORBIDDEN_COMMERCIAL_EVALUATION_KEYS.has(lower)) {
      strippedCommercialKeys.add(key);
      continue;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      cleaned[key] = stripForbiddenKeysFromObject(
        value as Record<string, unknown>,
        strippedUntrustedIdentityKeys,
        strippedCommercialKeys,
      );
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Strips any untrusted caller identity (`client_id`, `clientId`, etc.) and any
 * commercial routing/commission/affiliate fields from an evaluation request body
 * so the evaluator remains 100% isolated from commercial parameters and body-spoofed identities.
 */
export function sanitizeEvaluationRequestForAssurance(
  rawBody: Record<string, unknown>,
): SanitizedAssuranceBodyResult {
  const strippedUntrustedIdentityKeys = new Set<string>();
  const strippedCommercialKeys = new Set<string>();

  const sanitizedBody = stripForbiddenKeysFromObject(
    rawBody,
    strippedUntrustedIdentityKeys,
    strippedCommercialKeys,
  );

  if (Array.isArray(sanitizedBody.items)) {
    sanitizedBody.items = sanitizedBody.items.map((item) => {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        return stripForbiddenKeysFromObject(
          item as Record<string, unknown>,
          strippedUntrustedIdentityKeys,
          strippedCommercialKeys,
        );
      }
      return item;
    });
  }

  return {
    sanitizedBody,
    strippedUntrustedIdentityKeys: Array.from(strippedUntrustedIdentityKeys),
    strippedCommercialKeys: Array.from(strippedCommercialKeys),
  };
}

