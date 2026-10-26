import { neon } from "@neondatabase/serverless";
import { Redis } from "@upstash/redis";
import crypto from "node:crypto";
import dns from "node:dns/promises";
import net from "node:net";
import { rfc8785Canonicalize, sha256HexFull } from "./rfc8785AndJws";

/**
 * DCC Machine Layer v0.3 — Distributed Operational Controls, Hardened SSRF & DNS-Rebinding
 * Ingestion, Idempotent Delivery Deduplication, and Security Audit Ledger
 *
 * Implements Requirement 10:
 * - Distributed rate limiting via Upstash Redis (`@upstash/redis`) or Neon Postgres
 *   sliding-window table (`dcc_v03_rate_limit_buckets`), with explicit honesty when
 *   falling back to process-local memory in unit tests (`survivesColdStarts: false`,
 *   `coordinatesAcrossInstances: false`).
 * - API-key scope enforcement (`dcc:evaluate`, `dcc:evaluate:batch`, `dcc:admin:simulate`, `dcc:authorize:shadow`)
 * - Request body byte limit, field count limit, candidate limit, and rule limit
 * - SSRF protection, DNS-rebinding double-resolution verification, redirect revalidation,
 *   timeout, response-size cap, and content-type allowlist
 * - Idempotent ingestion & duplicate-delivery deduplication
 * - Structured errors and security audit events
 */

export const V03_OPERATIONAL_LIMITS = {
  maxRequestBodyBytes: 65_536,
  maxInputFields: 64,
  maxBatchItems: 20,
  maxCandidatesPerUniverse: 100,
  maxRulesPerBundle: 250,
  maxEvaluatorWallTimeMs: 2_000,
  rateLimitWindowMs: 60_000,
  rateLimitMaxRequestsPerWindow: 120,
  maxIngestRedirects: 3,
  maxIngestTimeoutMs: 6_000,
  maxIngestResponseBytes: 2_097_152,
  allowedIngestContentTypes: [
    "application/json",
    "text/html",
    "text/plain",
    "application/xml",
    "text/xml",
  ],
} as const;

export type ApiScopeV03 =
  | "dcc:evaluate"
  | "dcc:evaluate:batch"
  | "dcc:admin:simulate"
  | "dcc:authorize:shadow";

export interface SecurityAuditEventV03 {
  auditId: string;
  eventCategory:
    | "rate_limit_exceeded"
    | "unauthorized_api_scope"
    | "payload_limit_exceeded"
    | "ssrf_blocked"
    | "dns_rebinding_blocked"
    | "client_known_at_rejected"
    | "admin_simulation_executed"
    | "duplicate_ingestion_deduplicated"
    | "private_evidence_access_blocked";
  severity: "info" | "warn" | "high" | "critical";
  actorOrIp: string;
  endpointOrTarget: string;
  reasonCode: string;
  details: Record<string, unknown>;
  occurredAt: string;
}

const inMemorySecurityAuditLog: SecurityAuditEventV03[] = [];

export function recordSecurityAuditEvent(
  params: Omit<SecurityAuditEventV03, "auditId" | "occurredAt">,
): SecurityAuditEventV03 {
  const occurredAt = new Date().toISOString();
  const auditId = `sec:${Date.now()}:${crypto.randomUUID().slice(0, 8)}`;
  const ev: SecurityAuditEventV03 = {
    auditId,
    ...params,
    occurredAt,
  };
  inMemorySecurityAuditLog.push(ev);
  return ev;
}

export function getSecurityAuditEvents(): readonly SecurityAuditEventV03[] {
  return inMemorySecurityAuditLog;
}

export interface RateLimitDecisionV03 {
  allowed: boolean;
  coordinationBackend:
    | "upstash_redis_distributed"
    | "neon_postgres_distributed"
    | "process_local_non_distributed_fallback";
  survivesColdStarts: boolean;
  coordinatesAcrossInstances: boolean;
  remaining: number;
  resetAtEpochMs: number;
  reasonCode?: string;
}

const localFallbackBuckets = new Map<string, { windowStartMs: number; count: number }>();

/**
 * Distributed Rate Limiter supporting Upstash Redis or Neon Postgres atomic counters.
 * Never claims process-local fallback survives cold starts or coordinates across instances.
 */
export async function checkDistributedRateLimitV03(params: {
  clientKey: string;
  endpoint: string;
  maxRequests?: number;
  windowMs?: number;
  neonDatabaseUrl?: string;
  schemaName?: string;
}): Promise<RateLimitDecisionV03> {
  const maxRequests = params.maxRequests ?? V03_OPERATIONAL_LIMITS.rateLimitMaxRequestsPerWindow;
  const windowMs = params.windowMs ?? V03_OPERATIONAL_LIMITS.rateLimitWindowMs;
  const nowMs = Date.now();
  const windowBucket = Math.floor(nowMs / windowMs);
  const bucketKey = `dcc:v03:rl:${params.endpoint}:${params.clientKey}:${windowBucket}`;
  const resetAtEpochMs = (windowBucket + 1) * windowMs;

  // 1. Prefer Upstash Redis if configured
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (upstashUrl && upstashToken) {
    const redis = new Redis({ url: upstashUrl, token: upstashToken });
    const count = await redis.incr(bucketKey);
    if (count === 1) {
      await redis.pexpire(bucketKey, windowMs);
    }
    const allowed = count <= maxRequests;
    if (!allowed) {
      recordSecurityAuditEvent({
        eventCategory: "rate_limit_exceeded",
        severity: "warn",
        actorOrIp: params.clientKey,
        endpointOrTarget: params.endpoint,
        reasonCode: "RATE_LIMIT_EXCEEDED_UPSTASH_REDIS",
        details: { count, maxRequests },
      });
    }
    return {
      allowed,
      coordinationBackend: "upstash_redis_distributed",
      survivesColdStarts: true,
      coordinatesAcrossInstances: true,
      remaining: Math.max(0, maxRequests - count),
      resetAtEpochMs,
      reasonCode: allowed ? undefined : "RATE_LIMIT_EXCEEDED",
    };
  }

  // 2. Next prefer Neon Postgres atomic counter if a Neon URL is supplied for distributed enforcement
  const neonUrl = params.neonDatabaseUrl;
  if (neonUrl) {
    const schema = params.schemaName ?? "dcc_machine_v03";
    const sql = neon(neonUrl);
    const rows = (await (sql as any).query(
      `INSERT INTO "${schema}"."dcc_v03_rate_limit_buckets" (bucket_key, window_start_ms, request_count, updated_at)
       VALUES ($1, $2, 1, now())
       ON CONFLICT (bucket_key) DO UPDATE
       SET request_count = "${schema}"."dcc_v03_rate_limit_buckets".request_count + 1,
           updated_at = now()
       RETURNING request_count`,
      [bucketKey, windowBucket * windowMs],
    )) as Array<{ request_count: number }>;
    const count = Number(rows[0]?.request_count ?? 1);
    const allowed = count <= maxRequests;
    if (!allowed) {
      recordSecurityAuditEvent({
        eventCategory: "rate_limit_exceeded",
        severity: "warn",
        actorOrIp: params.clientKey,
        endpointOrTarget: params.endpoint,
        reasonCode: "RATE_LIMIT_EXCEEDED_NEON_DISTRIBUTED",
        details: { count, maxRequests },
      });
    }
    return {
      allowed,
      coordinationBackend: "neon_postgres_distributed",
      survivesColdStarts: true,
      coordinatesAcrossInstances: true,
      remaining: Math.max(0, maxRequests - count),
      resetAtEpochMs,
      reasonCode: allowed ? undefined : "RATE_LIMIT_EXCEEDED",
    };
  }

  // 3. Process-local fallback (explicitly discloses survivesColdStarts=false, coordinatesAcrossInstances=false)
  const existing = localFallbackBuckets.get(bucketKey);
  const count = (existing?.count ?? 0) + 1;
  localFallbackBuckets.set(bucketKey, { windowStartMs: windowBucket * windowMs, count });
  const allowed = count <= maxRequests;
  if (!allowed) {
    recordSecurityAuditEvent({
      eventCategory: "rate_limit_exceeded",
      severity: "warn",
      actorOrIp: params.clientKey,
      endpointOrTarget: params.endpoint,
      reasonCode: "RATE_LIMIT_EXCEEDED_PROCESS_LOCAL",
      details: { count, maxRequests },
    });
  }
  return {
    allowed,
    coordinationBackend: "process_local_non_distributed_fallback",
    survivesColdStarts: false,
    coordinatesAcrossInstances: false,
    remaining: Math.max(0, maxRequests - count),
    resetAtEpochMs,
    reasonCode: allowed ? undefined : "RATE_LIMIT_EXCEEDED",
  };
}

export function resetLocalRateLimitBucketsForTest(): void {
  localFallbackBuckets.clear();
}

/**
 * Checks whether an IPv4 or IPv6 address is private, loopback, link-local, metadata, or reserved.
 */
export function isPrivateOrReservedIpAddress(ip: string): boolean {
  const trimmed = ip.trim().toLowerCase();
  if (trimmed.startsWith("::ffff:")) {
    return isPrivateOrReservedIpAddress(trimmed.slice(7));
  }
  const family = net.isIP(trimmed);
  if (family === 4) {
    const parts = trimmed.split(".").map(Number);
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
    const [a, b] = parts as [number, number, number, number];
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // AWS/GCP/Azure metadata 169.254.169.254
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // Multicast / reserved
    return false;
  }
  if (family === 6) {
    if (
      trimmed === "::1" ||
      trimmed === "::" ||
      trimmed.startsWith("fc") ||
      trimmed.startsWith("fd") ||
      trimmed.startsWith("fe80:") ||
      trimmed.startsWith("ff")
    ) {
      return true;
    }
    return false;
  }
  return true;
}

export class SsrfOrDnsRebindingBlockedError extends Error {
  public readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "SsrfOrDnsRebindingBlockedError";
  }
}

export interface IdempotentIngestResult {
  idempotencyKey: string;
  deduplicatedDuplicateDelivery: boolean;
  deliveryCount: number;
  canonicalUrl: string;
  resolvedIps: string[];
  httpStatus: number;
  contentType: string;
  byteLength: number;
  contentSha256: string;
  retrievedAt: string;
  rawBodyText: string;
}

const idempotentIngestMemoryStore = new Map<
  string,
  IdempotentIngestResult
>();

/**
 * Hardened SSRF + DNS-rebinding + redirect-revalidated + idempotent ingestion fetcher.
 *
 * Defenses:
 * 1. Enforces `https:` protocol only and blocks `localhost`, `.local`, `.internal`, and IP literals in private ranges.
 * 2. Performs two-phase DNS resolution (`dnsResolver`) to detect DNS-rebinding attacks where a hostname resolves to a public IP first and a private/loopback IP on connect.
 * 3. Manually follows up to `maxIngestRedirects` (`redirect: "manual"`), re-validating protocol, hostname, and DNS on every redirect hop.
 * 4. Enforces response timeout, content-type allowlist, and byte-length cap.
 * 5. Enforces idempotent ingestion & duplicate-delivery deduplication by `idempotencyKey`.
 */
export async function safeIdempotentIngestFetchV03(params: {
  url: string;
  idempotencyKey?: string;
  fetchImpl?: typeof fetch;
  dnsResolveImpl?: (hostname: string) => Promise<string[]>;
  maxBytes?: number;
  timeoutMs?: number;
}): Promise<IdempotentIngestResult> {
  const idempotencyKey =
    params.idempotencyKey ?? `ingest:${sha256HexFull(params.url).slice(0, 32)}`;

  const existing = idempotentIngestMemoryStore.get(idempotencyKey);
  if (existing) {
    existing.deliveryCount += 1;
    existing.deduplicatedDuplicateDelivery = true;
    recordSecurityAuditEvent({
      eventCategory: "duplicate_ingestion_deduplicated",
      severity: "info",
      actorOrIp: "dcc-ingestion-worker",
      endpointOrTarget: params.url,
      reasonCode: "DUPLICATE_INGESTION_DELIVERY_DEDUPLICATED",
      details: { idempotencyKey, deliveryCount: existing.deliveryCount },
    });
    return { ...existing };
  }

  const dnsResolve =
    params.dnsResolveImpl ??
    (async (hostname: string) => {
      const records = await dns.lookup(hostname, { all: true });
      return records.map((r) => r.address);
    });
  const fetchFn = params.fetchImpl ?? globalThis.fetch;
  const maxBytes = params.maxBytes ?? V03_OPERATIONAL_LIMITS.maxIngestResponseBytes;
  const timeoutMs = params.timeoutMs ?? V03_OPERATIONAL_LIMITS.maxIngestTimeoutMs;

  let currentUrl = params.url;
  let allResolvedIps: string[] = [];

  for (let hop = 0; hop <= V03_OPERATIONAL_LIMITS.maxIngestRedirects; hop++) {
    const parsed = new URL(currentUrl);
    if (parsed.protocol !== "https:") {
      recordSecurityAuditEvent({
        eventCategory: "ssrf_blocked",
        severity: "high",
        actorOrIp: "dcc-ingestion-worker",
        endpointOrTarget: currentUrl,
        reasonCode: "SSRF_NON_HTTPS_PROTOCOL_BLOCKED",
        details: { protocol: parsed.protocol, hop },
      });
      throw new SsrfOrDnsRebindingBlockedError(
        "SSRF_NON_HTTPS_PROTOCOL_BLOCKED",
        `Ingestion requires HTTPS; blocked ${parsed.protocol} on ${currentUrl}`,
      );
    }

    const hostname = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
    if (
      hostname === "localhost" ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      hostname === "metadata.google.internal"
    ) {
      recordSecurityAuditEvent({
        eventCategory: "ssrf_blocked",
        severity: "critical",
        actorOrIp: "dcc-ingestion-worker",
        endpointOrTarget: currentUrl,
        reasonCode: "SSRF_FORBIDDEN_HOSTNAME",
        details: { hostname, hop },
      });
      throw new SsrfOrDnsRebindingBlockedError(
        "SSRF_FORBIDDEN_HOSTNAME",
        `Blocked forbidden internal hostname "${hostname}"`,
      );
    }

    if (net.isIP(hostname) !== 0 && isPrivateOrReservedIpAddress(hostname)) {
      recordSecurityAuditEvent({
        eventCategory: "ssrf_blocked",
        severity: "critical",
        actorOrIp: "dcc-ingestion-worker",
        endpointOrTarget: currentUrl,
        reasonCode: "SSRF_PRIVATE_IP_LITERAL_BLOCKED",
        details: { hostname, hop },
      });
      throw new SsrfOrDnsRebindingBlockedError(
        "SSRF_PRIVATE_IP_LITERAL_BLOCKED",
        `Blocked private/reserved IP literal "${hostname}"`,
      );
    }

    // Two-pass DNS resolution to detect DNS rebinding
    const pass1Ips = await dnsResolve(hostname);
    const pass2Ips = await dnsResolve(hostname);
    const combinedIps = Array.from(new Set([...pass1Ips, ...pass2Ips]));
    if (combinedIps.length === 0) {
      throw new SsrfOrDnsRebindingBlockedError(
        "DNS_RESOLUTION_EMPTY",
        `Hostname "${hostname}" resolved to 0 IP addresses.`,
      );
    }
    for (const ip of combinedIps) {
      if (isPrivateOrReservedIpAddress(ip)) {
        const isRebind =
          pass1Ips.some((p) => !isPrivateOrReservedIpAddress(p)) &&
          pass2Ips.some((p) => isPrivateOrReservedIpAddress(p));
        const code = isRebind ? "DNS_REBINDING_ATTACK_BLOCKED" : "SSRF_PRIVATE_DNS_IP_BLOCKED";
        recordSecurityAuditEvent({
          eventCategory: isRebind ? "dns_rebinding_blocked" : "ssrf_blocked",
          severity: "critical",
          actorOrIp: "dcc-ingestion-worker",
          endpointOrTarget: currentUrl,
          reasonCode: code,
          details: { hostname, pass1Ips, pass2Ips, hop },
        });
        throw new SsrfOrDnsRebindingBlockedError(
          code,
          `${code}: Hostname "${hostname}" resolved to private/reserved IP "${ip}".`,
        );
      }
    }
    allResolvedIps = combinedIps;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchFn(currentUrl, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": "DCC-Machine-Layer-Canary/0.3 (+https://www.destinationcommandcenter.com/.well-known/dcc)",
          Accept: "text/html,application/json,text/plain,application/xml",
        },
      });

      if (res.status >= 300 && res.status < 400) {
        if (hop === V03_OPERATIONAL_LIMITS.maxIngestRedirects) {
          throw new SsrfOrDnsRebindingBlockedError(
            "INGEST_MAX_REDIRECTS_EXCEEDED",
            `Exceeded max redirect hops (${V03_OPERATIONAL_LIMITS.maxIngestRedirects}).`,
          );
        }
        const location = res.headers.get("location");
        if (!location) {
          throw new SsrfOrDnsRebindingBlockedError(
            "INGEST_REDIRECT_MISSING_LOCATION",
            "Redirect response missing Location header.",
          );
        }
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      const contentTypeHeader = (res.headers.get("content-type") ?? "text/plain")
        .split(";")[0]!
        .trim()
        .toLowerCase();
      const allowedContentType = V03_OPERATIONAL_LIMITS.allowedIngestContentTypes.some(
        (allowed) => contentTypeHeader === allowed || contentTypeHeader.endsWith("+json") || contentTypeHeader.endsWith("+xml"),
      );
      if (!allowedContentType) {
        throw new SsrfOrDnsRebindingBlockedError(
          "INGEST_DISALLOWED_CONTENT_TYPE",
          `Disallowed content-type "${contentTypeHeader}" from ${currentUrl}.`,
        );
      }

      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf.byteLength > maxBytes) {
        throw new SsrfOrDnsRebindingBlockedError(
          "INGEST_RESPONSE_SIZE_EXCEEDED",
          `Response size ${buf.byteLength} exceeds maxBytes ${maxBytes}.`,
        );
      }

      const rawBodyText = Buffer.from(buf).toString("utf8");
      const contentSha256 = sha256HexFull(buf);
      const retrievedAt = new Date().toISOString();

      const result: IdempotentIngestResult = {
        idempotencyKey,
        deduplicatedDuplicateDelivery: false,
        deliveryCount: 1,
        canonicalUrl: currentUrl,
        resolvedIps: allResolvedIps,
        httpStatus: res.status,
        contentType: contentTypeHeader,
        byteLength: buf.byteLength,
        contentSha256,
        retrievedAt,
        rawBodyText,
      };
      idempotentIngestMemoryStore.set(idempotencyKey, result);
      return { ...result };
    } finally {
      clearTimeout(timer);
    }
  }

  throw new SsrfOrDnsRebindingBlockedError(
    "INGEST_MAX_REDIRECTS_EXCEEDED",
    "Redirect loop terminated.",
  );
}
