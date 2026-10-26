import net from "node:net";
import { sha256Hex, writeImmutableArtifact } from "./cryptoAndStorage";
import type { EpistemicKind, GeographicScope, TypedClaimValue } from "./schemas";

/**
 * DCC Machine Layer v0.1 — SSRF Guard, Safe Source Ingestion, Untrusted Extraction Quarantine,
 * Audit Log, and Rate Limit / Auth Controls.
 */

const ALLOWED_PROTOCOLS = new Set(["https:"]);

const ALLOWED_CONTENT_TYPES = [
  "application/json",
  "text/html",
  "text/plain",
  "application/pdf",
  "application/xml",
  "text/xml",
];

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata",
  "instance-data",
  "kube-dns.kube-system.svc.cluster.local",
]);

export class SsrfProtectionError extends Error {
  public readonly code: string;
  public readonly blockedUrl: string;
  constructor(code: string, message: string, blockedUrl: string) {
    super(message);
    this.name = "SsrfProtectionError";
    this.code = code;
    this.blockedUrl = blockedUrl;
  }
}

export type IngestionAuditEvent = {
  auditId: string;
  eventType:
    | "source_ingestion_started"
    | "source_ingestion_succeeded"
    | "source_ingestion_blocked_ssrf"
    | "source_ingestion_rejected_content"
    | "extraction_quarantined"
    | "extraction_verified_and_published"
    | "extraction_rejected";
  targetUrl?: string;
  artifactHash?: string;
  actor: string;
  detail: string;
  occurredAt: string;
};

const ingestionAuditLog: IngestionAuditEvent[] = [];

export function recordIngestionAuditEvent(
  event: Omit<IngestionAuditEvent, "auditId" | "occurredAt">,
): IngestionAuditEvent {
  const fullEvent: IngestionAuditEvent = {
    ...event,
    auditId: `audit:ing:${ingestionAuditLog.length + 1}:${sha256Hex(
      `${event.eventType}:${event.targetUrl ?? ""}:${event.detail}:${Date.now()}`,
    ).slice(0, 12)}`,
    occurredAt: new Date().toISOString(),
  };
  ingestionAuditLog.push(fullEvent);
  return fullEvent;
}

export function getIngestionAuditEvents(): IngestionAuditEvent[] {
  return [...ingestionAuditLog];
}

function isBlockedIpv4(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return true;
  const nums = parts.map((p) => {
    if (!/^\d+$/.test(p)) return NaN;
    if (p.length > 1 && p.startsWith("0")) return NaN; // Block octal encoding
    return Number(p);
  });
  if (nums.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b, c] = nums;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8 private
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local & cloud metadata (169.254.169.254)
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 private
  if (a === 192 && b === 168) return true; // 192.168.0.0/16 private
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT / Tailscale / Alibaba metadata
  if (a === 192 && b === 0 && (c === 0 || c === 2)) return true; // 192.0.0.0/24, 192.0.2.0/24
  if (a === 198 && (b === 18 || b === 19)) return true; // 198.18.0.0/15 benchmark
  if (a === 198 && b === 51 && c === 100) return true; // TEST-NET-2
  if (a === 203 && b === 0 && c === 113) return true; // TEST-NET-3
  if (a >= 224) return true; // Multicast & reserved
  return false;
}

function isBlockedIpv6(rawHost: string): boolean {
  const clean = rawHost.replace(/^\[|\]$/g, "").toLowerCase();
  if (clean === "::1" || clean === "::" || clean === "0:0:0:0:0:0:0:1" || clean === "0:0:0:0:0:0:0:0") {
    return true;
  }
  if (clean.startsWith("fe80:") || clean.startsWith("fe9") || clean.startsWith("fea") || clean.startsWith("feb")) {
    return true; // Link-local fe80::/10
  }
  if (clean.startsWith("fc") || clean.startsWith("fd")) {
    return true; // Unique local fc00::/7
  }
  if (clean.startsWith("ff")) {
    return true; // Multicast ff00::/8
  }
  if (clean.includes("::ffff:")) {
    return true; // IPv4-mapped IPv6 addresses
  }
  return false;
}

export function validateUrlAgainstSsrf(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    recordIngestionAuditEvent({
      eventType: "source_ingestion_blocked_ssrf",
      targetUrl: rawUrl,
      actor: "ssrf_guard",
      detail: "Malformed URL",
    });
    throw new SsrfProtectionError("INVALID_URL", `Malformed URL: ${rawUrl}`, rawUrl);
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    recordIngestionAuditEvent({
      eventType: "source_ingestion_blocked_ssrf",
      targetUrl: rawUrl,
      actor: "ssrf_guard",
      detail: `Disallowed protocol ${parsed.protocol}; only https: is permitted`,
    });
    throw new SsrfProtectionError(
      "DISALLOWED_PROTOCOL",
      `Protocol ${parsed.protocol} is blocked; only https: is allowed`,
      rawUrl,
    );
  }

  if (parsed.username || parsed.password) {
    recordIngestionAuditEvent({
      eventType: "source_ingestion_blocked_ssrf",
      targetUrl: rawUrl,
      actor: "ssrf_guard",
      detail: "Embedded URL credentials are not permitted",
    });
    throw new SsrfProtectionError(
      "DISALLOWED_CREDENTIALS",
      "URLs with embedded credentials are blocked",
      rawUrl,
    );
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");
  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".arpa")
  ) {
    recordIngestionAuditEvent({
      eventType: "source_ingestion_blocked_ssrf",
      targetUrl: rawUrl,
      actor: "ssrf_guard",
      detail: `Blocked internal/local hostname: ${hostname}`,
    });
    throw new SsrfProtectionError(
      "BLOCKED_HOSTNAME",
      `Hostname ${hostname} is in a blocked internal/metadata domain`,
      rawUrl,
    );
  }

  // Detect hex/integer IP obfuscation (e.g. 0x7f000001 or 2130706433 or octal 0177.0.0.1)
  if (/^(0x[0-9a-f]+|\d+)$/i.test(hostname) || hostname.split(".").every((part) => /^(0x[0-9a-f]+|\d+)$/i.test(part))) {
    if (net.isIPv4(hostname)) {
      if (isBlockedIpv4(hostname)) {
        recordIngestionAuditEvent({
          eventType: "source_ingestion_blocked_ssrf",
          targetUrl: rawUrl,
          actor: "ssrf_guard",
          detail: `Blocked private/metadata IPv4 address: ${hostname}`,
        });
        throw new SsrfProtectionError(
          "BLOCKED_PRIVATE_OR_METADATA_IPV4",
          `IPv4 address ${hostname} is in a private, loopback, link-local, or metadata range`,
          rawUrl,
        );
      }
    } else {
      recordIngestionAuditEvent({
        eventType: "source_ingestion_blocked_ssrf",
        targetUrl: rawUrl,
        actor: "ssrf_guard",
        detail: `Blocked obfuscated numeric/hex/octal IP host: ${hostname}`,
      });
      throw new SsrfProtectionError(
        "BLOCKED_OBFUSCATED_IP",
        `Obfuscated IP literal ${hostname} is blocked`,
        rawUrl,
      );
    }
  }

  if (hostname.startsWith("[") || net.isIPv6(hostname.replace(/^\[|\]$/g, ""))) {
    if (isBlockedIpv6(hostname)) {
      recordIngestionAuditEvent({
        eventType: "source_ingestion_blocked_ssrf",
        targetUrl: rawUrl,
        actor: "ssrf_guard",
        detail: `Blocked private/loopback/link-local IPv6 address: ${hostname}`,
      });
      throw new SsrfProtectionError(
        "BLOCKED_PRIVATE_OR_METADATA_IPV6",
        `IPv6 address ${hostname} is in a private, loopback, or link-local range`,
        rawUrl,
      );
    }
  }

  return parsed;
}

export type SafeIngestOptions = {
  maxBytes?: number;
  timeoutMs?: number;
  maxRedirects?: number;
  allowedContentTypes?: string[];
  fetchImpl?: typeof fetch;
};

export type SafeIngestedArtifact = {
  canonicalUrl: string;
  finalUrl: string;
  redirectChain: string[];
  httpStatus: number;
  contentType: string;
  byteLength: number;
  contentHash: string;
  storageUri: string;
  retrievedAt: string;
};

export async function ingestSourceArtifactSafely(
  rawUrl: string,
  options: SafeIngestOptions = {},
): Promise<SafeIngestedArtifact> {
  const maxBytes = options.maxBytes ?? 2 * 1024 * 1024; // 2 MB limit
  const timeoutMs = options.timeoutMs ?? 5000;
  const maxRedirects = options.maxRedirects ?? 3;
  const allowedTypes = options.allowedContentTypes ?? ALLOWED_CONTENT_TYPES;
  const fetchFn = options.fetchImpl ?? globalThis.fetch;

  let currentUrl = validateUrlAgainstSsrf(rawUrl).toString();
  const redirectChain: string[] = [];

  recordIngestionAuditEvent({
    eventType: "source_ingestion_started",
    targetUrl: currentUrl,
    actor: "ingestion_service",
    detail: `Starting safe ingestion (maxBytes=${maxBytes}, timeoutMs=${timeoutMs})`,
  });

  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    const validatedUrl = validateUrlAgainstSsrf(currentUrl);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetchFn(validatedUrl.toString(), {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: allowedTypes.join(", "),
          "User-Agent": "DCC-Machine-Ingestion/0.1 (+https://www.destinationcommandcenter.com/.well-known/dcc)",
        },
      });
    } catch (err) {
      clearTimeout(timer);
      throw new SsrfProtectionError(
        "INGESTION_FETCH_TIMEOUT_OR_ERROR",
        `Fetch failed or timed out for ${currentUrl}: ${err instanceof Error ? err.message : String(err)}`,
        currentUrl,
      );
    } finally {
      clearTimeout(timer);
    }

    if (response.status >= 300 && response.status < 400) {
      const locationHeader = response.headers.get("location");
      if (!locationHeader) {
        throw new SsrfProtectionError(
          "REDIRECT_MISSING_LOCATION",
          `Redirect response (${response.status}) missing Location header`,
          currentUrl,
        );
      }
      if (hop === maxRedirects) {
        throw new SsrfProtectionError(
          "MAX_REDIRECTS_EXCEEDED",
          `Exceeded maximum redirects (${maxRedirects}) starting from ${rawUrl}`,
          currentUrl,
        );
      }
      const nextUrl = new URL(locationHeader, validatedUrl).toString();
      // Revalidate redirected URL against SSRF rules before following
      validateUrlAgainstSsrf(nextUrl);
      redirectChain.push(nextUrl);
      currentUrl = nextUrl;
      continue;
    }

    const contentTypeHeader = (response.headers.get("content-type") || "").toLowerCase();
    const baseContentType = contentTypeHeader.split(";")[0].trim();
    if (!allowedTypes.some((allowed) => baseContentType === allowed.toLowerCase())) {
      recordIngestionAuditEvent({
        eventType: "source_ingestion_rejected_content",
        targetUrl: currentUrl,
        actor: "ingestion_service",
        detail: `Disallowed Content-Type: ${contentTypeHeader || "empty"}`,
      });
      throw new SsrfProtectionError(
        "DISALLOWED_CONTENT_TYPE",
        `Content-Type '${contentTypeHeader}' is not in the approved ingestion list`,
        currentUrl,
      );
    }

    const contentLengthHeader = response.headers.get("content-length");
    if (contentLengthHeader && Number(contentLengthHeader) > maxBytes) {
      recordIngestionAuditEvent({
        eventType: "source_ingestion_rejected_content",
        targetUrl: currentUrl,
        actor: "ingestion_service",
        detail: `Content-Length ${contentLengthHeader} exceeds maxBytes ${maxBytes}`,
      });
      throw new SsrfProtectionError(
        "RESPONSE_TOO_LARGE",
        `Response size ${contentLengthHeader} exceeds limit of ${maxBytes} bytes`,
        currentUrl,
      );
    }

    const bodyText = await response.text();
    const byteLength = Buffer.byteLength(bodyText, "utf8");
    if (byteLength > maxBytes) {
      recordIngestionAuditEvent({
        eventType: "source_ingestion_rejected_content",
        targetUrl: currentUrl,
        actor: "ingestion_service",
        detail: `Body size ${byteLength} exceeds maxBytes ${maxBytes}`,
      });
      throw new SsrfProtectionError(
        "RESPONSE_TOO_LARGE",
        `Body size ${byteLength} exceeds limit of ${maxBytes} bytes`,
        currentUrl,
      );
    }

    const contentHash = sha256Hex(bodyText);
    const artifact = writeImmutableArtifact({
      category: "sources",
      filename: `ingested_${contentHash.slice(0, 16)}.snapshot`,
      content: bodyText,
    });

    const retrievedAt = new Date().toISOString();
    recordIngestionAuditEvent({
      eventType: "source_ingestion_succeeded",
      targetUrl: currentUrl,
      artifactHash: contentHash,
      actor: "ingestion_service",
      detail: `Stored immutable artifact ${artifact.storageUri} (${byteLength} bytes)`,
    });

    return {
      canonicalUrl: rawUrl,
      finalUrl: currentUrl,
      redirectChain,
      httpStatus: response.status,
      contentType: baseContentType,
      byteLength,
      contentHash,
      storageUri: artifact.storageUri,
      retrievedAt,
    };
  }

  throw new SsrfProtectionError("INGESTION_ABORTED", "Unable to complete ingestion", rawUrl);
}

/**
 * Separation of Untrusted AI Extraction from Publication:
 * Any AI-extracted claim is placed in `quarantinedExtractions` with `status: "observed"`
 * and `activeInDecisionGraph: false`. It cannot be referenced by any compiled rule or
 * published as `verified` until `verifyAndPromoteQuarantinedExtraction` is called with
 * an explicit verifier identity and supporting snapshot/fragment hashes.
 */
export type QuarantinedClaimExtraction = {
  extractionId: string;
  proposedClaimId: string;
  subject: string;
  predicate: string;
  epistemicKind: EpistemicKind;
  typedValue: TypedClaimValue;
  unitOrCurrency: string | null;
  geographicScope: GeographicScope;
  jurisdiction: string | null;
  sourceId: string;
  sourceSnapshotId: string;
  evidenceFragmentId: string;
  extractedByModel: string;
  extractedAt: string;
  status: "quarantined_unverified" | "verified_promoted" | "rejected";
  activeInDecisionGraph: boolean;
  verifiedBy: string | null;
  verifiedAt: string | null;
};

const quarantinedExtractions = new Map<string, QuarantinedClaimExtraction>();

export function stageUntrustedAiClaimExtraction(params: {
  proposedClaimId: string;
  subject: string;
  predicate: string;
  epistemicKind?: EpistemicKind;
  typedValue: TypedClaimValue;
  unitOrCurrency?: string | null;
  geographicScope: GeographicScope;
  jurisdiction?: string | null;
  sourceId: string;
  sourceSnapshotId: string;
  evidenceFragmentId: string;
  extractedByModel: string;
}): QuarantinedClaimExtraction {
  const extractionId = `quarantine:${params.proposedClaimId}:${sha256Hex(
    `${params.proposedClaimId}:${params.extractedByModel}:${Date.now()}`,
  ).slice(0, 10)}`;

  const record: QuarantinedClaimExtraction = {
    extractionId,
    proposedClaimId: params.proposedClaimId,
    subject: params.subject,
    predicate: params.predicate,
    epistemicKind: params.epistemicKind ?? "fact",
    typedValue: params.typedValue,
    unitOrCurrency: params.unitOrCurrency ?? null,
    geographicScope: params.geographicScope,
    jurisdiction: params.jurisdiction ?? null,
    sourceId: params.sourceId,
    sourceSnapshotId: params.sourceSnapshotId,
    evidenceFragmentId: params.evidenceFragmentId,
    extractedByModel: params.extractedByModel,
    extractedAt: new Date().toISOString(),
    status: "quarantined_unverified",
    activeInDecisionGraph: false,
    verifiedBy: null,
    verifiedAt: null,
  };

  quarantinedExtractions.set(extractionId, record);
  recordIngestionAuditEvent({
    eventType: "extraction_quarantined",
    actor: params.extractedByModel,
    detail: `Quarantined unverified AI extraction ${extractionId} for ${params.proposedClaimId}`,
  });

  return record;
}

export function verifyAndPromoteQuarantinedExtraction(params: {
  extractionId: string;
  verifiedBy: string;
}): QuarantinedClaimExtraction {
  if (!params.verifiedBy || params.verifiedBy.trim().length < 3) {
    throw new Error("Verification requires an explicit human or authority verifier identity.");
  }
  const existing = quarantinedExtractions.get(params.extractionId);
  if (!existing) {
    throw new Error(`Quarantined extraction not found: ${params.extractionId}`);
  }
  const promoted: QuarantinedClaimExtraction = {
    ...existing,
    status: "verified_promoted",
    activeInDecisionGraph: true,
    verifiedBy: params.verifiedBy.trim(),
    verifiedAt: new Date().toISOString(),
  };
  quarantinedExtractions.set(params.extractionId, promoted);
  recordIngestionAuditEvent({
    eventType: "extraction_verified_and_published",
    actor: promoted.verifiedBy!,
    detail: `Verified and promoted extraction ${params.extractionId} for ${existing.proposedClaimId}`,
  });
  return promoted;
}

export function getQuarantinedExtraction(extractionId: string): QuarantinedClaimExtraction | null {
  return quarantinedExtractions.get(extractionId) ?? null;
}

/**
 * Rate limiter & API authentication helper for Machine Layer endpoints.
 */
const rateLimitBuckets = new Map<string, { count: number; windowResetMs: number }>();

export function checkMachineApiRateLimit(
  clientKey: string,
  maxRequestsPerMinute = 600,
  nowMs = Date.now(),
): { allowed: boolean; remaining: number; resetAtMs: number } {
  const windowMs = 60_000;
  const existing = rateLimitBuckets.get(clientKey);
  if (!existing || nowMs >= existing.windowResetMs) {
    const resetAtMs = nowMs + windowMs;
    rateLimitBuckets.set(clientKey, { count: 1, windowResetMs: resetAtMs });
    return { allowed: true, remaining: maxRequestsPerMinute - 1, resetAtMs };
  }
  if (existing.count >= maxRequestsPerMinute) {
    return { allowed: false, remaining: 0, resetAtMs: existing.windowResetMs };
  }
  existing.count += 1;
  return {
    allowed: true,
    remaining: maxRequestsPerMinute - existing.count,
    resetAtMs: existing.windowResetMs,
  };
}

export function resetMachineRateLimitsForTests(): void {
  rateLimitBuckets.clear();
}
