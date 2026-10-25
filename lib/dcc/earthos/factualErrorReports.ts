import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { and, desc, eq } from "drizzle-orm";
import { hasConfiguredDatabaseUrl } from "@/lib/db/client";
import {
  earthosControlMapFindingHistory,
  earthosControlMapFindings,
} from "@/lib/db/schema";
import { appendEarthOSAuditEvent } from "@/lib/dcc/earthos/auditLog";
import { getRequiredEarthosDb } from "@/lib/dcc/earthos/ensureEarthosSchema";
import {
  resolveEarthosEnvironmentScope,
  type EarthosEnvironmentScope,
  type TravelReferenceNode,
} from "@/lib/dcc/travelReference";

export type FactualErrorReportStatus = "open" | "triaged" | "resolved" | "dismissed";

export type FactualErrorNotificationStatus =
  | "sent"
  | "skipped_unconfigured"
  | "skipped_disabled"
  | "failed_non_blocking";

export type FactualErrorReportInput = {
  pagePath: string;
  nodeId?: TravelReferenceNode["id"] | string | null;
  citationId?: string | null;
  optionId?: string | null;
  disputedClaim: string;
  explanation: string;
  sourceUrl?: string | null;
  contactInfo?: string | null;
  websiteUrl?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  environmentScope?: EarthosEnvironmentScope;
  sendNotification?: boolean;
  forceNotificationFailureForTest?: boolean;
};

export type FactualErrorReportRecord = {
  reportId: string;
  findingId: string;
  environmentScope: EarthosEnvironmentScope;
  pagePath: string;
  nodeId: string | null;
  citationId: string | null;
  optionId: string | null;
  disputedClaim: string;
  explanation: string;
  sourceUrl: string | null;
  contactInfo: string | null;
  status: FactualErrorReportStatus;
  severity: "watch" | "high";
  ipHash: string;
  submittedAt: string;
  updatedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  resolutionNote: string | null;
  notificationStatus: FactualErrorNotificationStatus;
  notificationError?: string | null;
  notificationMessageId?: string | null;
};

export type SubmitFactualErrorReportResult =
  | {
      ok: true;
      deduplicated: boolean;
      report: FactualErrorReportRecord;
    }
  | {
      ok: false;
      statusCode: 400 | 429 | 500;
      error:
        | "spam_detected_honeypot"
        | "spam_detected_content"
        | "rate_limit_exceeded"
        | "invalid_page_path"
        | "invalid_disputed_claim"
        | "invalid_explanation"
        | "invalid_source_url"
        | "persistence_failed";
      message: string;
    };

const FACTUAL_ERROR_OWNER = "earthos-factual-error-report";
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_PER_WINDOW = 5;
const DEDUP_WINDOW_MS = 15 * 60 * 1000;

const inMemoryIpTimestamps = new Map<string, number[]>();

const LOCAL_FALLBACK_PATH = path.resolve(
  process.cwd(),
  "data",
  "memory",
  "factual-error-reports.json",
);

const KNOWN_NODE_BY_PATH: Record<string, TravelReferenceNode["id"]> = {
  "/juneau": "juneau",
  "/red-rocks": "red-rocks",
  "/denver-to-breckenridge": "denver-breckenridge",
  "/las-vegas-strip": "las-vegas",
  "/las-vegas": "las-vegas",
  "/new-orleans-swamp": "new-orleans",
  "/new-orleans": "new-orleans",
};

const SPAM_KEYWORDS_RE =
  /\b(online casino|buy viagra|cialis|crypto airdrop|seo backlinks|buy instagram followers|telegram pump|slot gacor)\b/i;
const REPEATED_CHAR_RE = /(.)\1{14,}/;

function hashClientIp(ip: string | null | undefined): string {
  const normalized = (ip || "anonymous-local").trim().toLowerCase();
  return createHash("sha256")
    .update(`dcc-fer-ip:${normalized}`)
    .digest("hex")
    .slice(0, 24);
}

function normalizePagePath(raw: string): string | null {
  const trimmed = (raw || "").trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const parsed = new URL(trimmed);
      return parsed.pathname || "/";
    } catch {
      return null;
    }
  }
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (withSlash.length > 160 || /[\s<>"]/.test(withSlash)) {
    return null;
  }
  return withSlash;
}

function validateOptionalUrl(raw: string | null | undefined): {
  valid: boolean;
  normalized: string | null;
} {
  const trimmed = (raw || "").trim();
  if (!trimmed) return { valid: true, normalized: null };
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { valid: false, normalized: null };
    }
    return { valid: true, normalized: parsed.toString() };
  } catch {
    return { valid: false, normalized: null };
  }
}

function countUrlsInText(text: string): number {
  const matches = text.match(/https?:\/\/[^\s)]+/gi);
  return matches ? matches.length : 0;
}

function readLocalFallbackReports(): FactualErrorReportRecord[] {
  try {
    if (!fs.existsSync(LOCAL_FALLBACK_PATH)) return [];
    const raw = fs.readFileSync(LOCAL_FALLBACK_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FactualErrorReportRecord[]) : [];
  } catch {
    return [];
  }
}

function writeLocalFallbackReports(reports: FactualErrorReportRecord[]): void {
  try {
    const dir = path.dirname(LOCAL_FALLBACK_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_FALLBACK_PATH, JSON.stringify(reports, null, 2), "utf8");
  } catch {
    // Non-fatal in read-only serverless filesystems where Postgres is primary
  }
}

function parseReportFromFindingRow(
  row: typeof earthosControlMapFindings.$inferSelect,
): FactualErrorReportRecord | null {
  const meta = row.metadata as Partial<FactualErrorReportRecord> | null;
  if (
    !meta ||
    typeof meta.reportId !== "string" ||
    typeof meta.disputedClaim !== "string" ||
    typeof meta.explanation !== "string"
  ) {
    return null;
  }
  const inferredScope: EarthosEnvironmentScope =
    meta.environmentScope === "production" ||
    row.findingId.startsWith("control-map:factual-error-report:production:")
      ? "production"
      : "nonprod";

  return {
    reportId: meta.reportId,
    findingId: row.findingId,
    environmentScope: inferredScope,
    pagePath: meta.pagePath || "/juneau",
    nodeId: meta.nodeId ?? null,
    citationId: meta.citationId ?? null,
    optionId: meta.optionId ?? null,
    disputedClaim: meta.disputedClaim,
    explanation: meta.explanation,
    sourceUrl: meta.sourceUrl ?? null,
    contactInfo: meta.contactInfo ?? null,
    status: (row.status as FactualErrorReportStatus) || meta.status || "open",
    severity: meta.severity === "high" ? "high" : "watch",
    ipHash: meta.ipHash || "unknown",
    submittedAt: meta.submittedAt || row.createdAt.toISOString(),
    updatedAt: meta.updatedAt || row.updatedAt.toISOString(),
    reviewedBy: meta.reviewedBy ?? null,
    reviewedAt: meta.reviewedAt ?? null,
    resolutionNote: meta.resolutionNote ?? null,
    notificationStatus: meta.notificationStatus || "skipped_unconfigured",
    notificationError: meta.notificationError ?? null,
    notificationMessageId: meta.notificationMessageId ?? null,
  };
}

async function sendOptionalFactualErrorNotification(
  report: FactualErrorReportRecord,
  options: {
    sendNotification?: boolean;
    forceNotificationFailureForTest?: boolean;
  } = {},
): Promise<{
  status: FactualErrorNotificationStatus;
  messageId?: string | null;
  error?: string | null;
}> {
  if (options.sendNotification === false) {
    return { status: "skipped_disabled", messageId: null, error: null };
  }

  try {
    if (options.forceNotificationFailureForTest) {
      throw new Error("Simulated notification service failure for resilience verification");
    }

    const resendKey = (
      process.env.DCC_RESEND_API_KEY ||
      process.env.RESEND_API_KEY ||
      ""
    ).trim();
    const approvalTo = (process.env.EARTHOS_APPROVAL_TO || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const mailFrom = (
      process.env.MAIL_FROM_DCC || "DCC Ops <ops@destinationcommandcenter.com>"
    ).trim();

    if (!resendKey || approvalTo.length === 0 || !mailFrom) {
      return {
        status: "skipped_unconfigured",
        messageId: null,
        error: null,
      };
    }

    const { Resend } = await import("resend");
    const resend = new Resend(resendKey);
    const response = await resend.emails.send({
      from: mailFrom,
      to: approvalTo,
      subject: `[DCC Factual Report] ${report.pagePath} — ${report.disputedClaim.slice(0, 72)}`,
      text: [
        `DCC Factual-Error Report (${report.reportId})`,
        `Page: ${report.pagePath}`,
        `Node: ${report.nodeId || "general"}`,
        `Citation / Option: ${report.citationId || report.optionId || "unspecified"}`,
        `Disputed Claim: ${report.disputedClaim}`,
        `Explanation: ${report.explanation}`,
        `Supporting URL: ${report.sourceUrl || "none provided"}`,
        `Contact: ${report.contactInfo || "anonymous"}`,
        `Submitted At: ${report.submittedAt}`,
      ].join("\n"),
    });

    if (response.error) {
      return {
        status: "failed_non_blocking",
        messageId: null,
        error: response.error.message || "resend_send_rejected",
      };
    }

    return {
      status: "sent",
      messageId: response.data?.id || null,
      error: null,
    };
  } catch (err) {
    return {
      status: "failed_non_blocking",
      messageId: null,
      error: err instanceof Error ? err.message : "notification_dispatch_failed",
    };
  }
}

export async function submitFactualErrorReport(
  input: FactualErrorReportInput,
): Promise<SubmitFactualErrorReportResult> {
  // 1. Honeypot spam protection
  if (input.websiteUrl && String(input.websiteUrl).trim().length > 0) {
    return {
      ok: false,
      statusCode: 400,
      error: "spam_detected_honeypot",
      message: "Submission rejected by automated spam filter.",
    };
  }

  // 2. Validate pagePath
  const pagePath = normalizePagePath(input.pagePath);
  if (!pagePath) {
    return {
      ok: false,
      statusCode: 400,
      error: "invalid_page_path",
      message: "A valid page path (for example, /juneau) is required.",
    };
  }

  // 3. Validate disputedClaim & explanation
  const disputedClaim = (input.disputedClaim || "").trim();
  if (disputedClaim.length < 5 || disputedClaim.length > 400) {
    return {
      ok: false,
      statusCode: 400,
      error: "invalid_disputed_claim",
      message: "Please specify the disputed claim (between 5 and 400 characters).",
    };
  }

  const explanation = (input.explanation || "").trim();
  if (explanation.length < 10 || explanation.length > 2500) {
    return {
      ok: false,
      statusCode: 400,
      error: "invalid_explanation",
      message: "Please provide an explanation of the factual discrepancy (between 10 and 2,500 characters).",
    };
  }

  // 4. Validate optional sourceUrl
  const urlCheck = validateOptionalUrl(input.sourceUrl);
  if (!urlCheck.valid) {
    return {
      ok: false,
      statusCode: 400,
      error: "invalid_source_url",
      message: "If provided, the supporting source URL must be a valid http:// or https:// address.",
    };
  }

  // 5. Content spam heuristics
  const combinedText = `${disputedClaim} ${explanation}`;
  if (
    SPAM_KEYWORDS_RE.test(combinedText) ||
    REPEATED_CHAR_RE.test(combinedText) ||
    countUrlsInText(combinedText) > 3
  ) {
    return {
      ok: false,
      statusCode: 400,
      error: "spam_detected_content",
      message: "Submission rejected by content spam filter.",
    };
  }

  // 6. Rate-limit by IP hash
  const nowMs = Date.now();
  const ipHash = hashClientIp(input.clientIp);
  const recentMem = (inMemoryIpTimestamps.get(ipHash) || []).filter(
    (ts) => nowMs - ts < RATE_LIMIT_WINDOW_MS,
  );
  if (recentMem.length >= RATE_LIMIT_MAX_PER_WINDOW) {
    return {
      ok: false,
      statusCode: 429,
      error: "rate_limit_exceeded",
      message: "Too many factual-error reports submitted from this address recently. Please wait a few minutes.",
    };
  }

  const scope = input.environmentScope || resolveEarthosEnvironmentScope();
  const existingReports = await listFactualErrorReports({
    environmentScope: scope,
    limit: 50,
  });

  const recentDbForIp = existingReports.filter((r) => {
    const submittedMs = new Date(r.submittedAt).getTime();
    return (
      r.ipHash === ipHash &&
      Number.isFinite(submittedMs) &&
      nowMs - submittedMs < RATE_LIMIT_WINDOW_MS
    );
  });
  if (recentDbForIp.length >= RATE_LIMIT_MAX_PER_WINDOW) {
    return {
      ok: false,
      statusCode: 429,
      error: "rate_limit_exceeded",
      message: "Too many factual-error reports submitted from this address recently. Please wait a few minutes.",
    };
  }

  // 7. Deduplicate identical submission within 15m window
  const duplicate = existingReports.find((r) => {
    const submittedMs = new Date(r.submittedAt).getTime();
    return (
      r.pagePath === pagePath &&
      r.disputedClaim.toLowerCase() === disputedClaim.toLowerCase() &&
      r.explanation.toLowerCase() === explanation.toLowerCase() &&
      Number.isFinite(submittedMs) &&
      nowMs - submittedMs < DEDUP_WINDOW_MS
    );
  });

  if (duplicate) {
    return {
      ok: true,
      deduplicated: true,
      report: duplicate,
    };
  }

  inMemoryIpTimestamps.set(ipHash, [...recentMem, nowMs]);

  const nowIso = new Date(nowMs).toISOString();
  const reportId = `fer_${Date.now().toString(36)}_${randomUUID().slice(0, 6)}`;
  const findingId = `control-map:factual-error-report:${scope}:${reportId}`;
  const inferredNodeId =
    (input.nodeId ? String(input.nodeId).trim() : null) ||
    KNOWN_NODE_BY_PATH[pagePath] ||
    null;
  const citationId = input.citationId ? String(input.citationId).trim() || null : null;
  const optionId = input.optionId ? String(input.optionId).trim() || null : null;
  const contactInfo = input.contactInfo
    ? String(input.contactInfo).trim().slice(0, 200) || null
    : null;

  const record: FactualErrorReportRecord = {
    reportId,
    findingId,
    environmentScope: scope,
    pagePath,
    nodeId: inferredNodeId,
    citationId,
    optionId,
    disputedClaim,
    explanation,
    sourceUrl: urlCheck.normalized,
    contactInfo,
    status: "open",
    severity: citationId || optionId ? "high" : "watch",
    ipHash,
    submittedAt: nowIso,
    updatedAt: nowIso,
    reviewedBy: null,
    reviewedAt: null,
    resolutionNote: null,
    notificationStatus: "skipped_unconfigured",
    notificationError: null,
    notificationMessageId: null,
  };

  // 8. Persist durably BEFORE optional notification so notification failure can never lose the report
  const summaryNote = `Traveler factual-error report ${reportId} on ${pagePath}: "${disputedClaim.slice(0, 120)}"`;

  try {
    if (hasConfiguredDatabaseUrl()) {
      const db = await getRequiredEarthosDb();
      await db
        .insert(earthosControlMapFindings)
        .values({
          findingId: record.findingId,
          status: record.status,
          severity: record.severity,
          owner: FACTUAL_ERROR_OWNER,
          note: summaryNote,
          metadata: record as unknown as Record<string, unknown>,
          updatedAt: new Date(nowIso),
        })
        .onConflictDoUpdate({
          target: earthosControlMapFindings.findingId,
          set: {
            status: record.status,
            severity: record.severity,
            owner: FACTUAL_ERROR_OWNER,
            note: summaryNote,
            metadata: record as unknown as Record<string, unknown>,
            updatedAt: new Date(nowIso),
          },
        });

      await db.insert(earthosControlMapFindingHistory).values({
        findingId: record.findingId,
        event: "factual_error_report_submitted",
        status: record.status,
        severity: record.severity,
        owner: FACTUAL_ERROR_OWNER,
        nodeSlug: inferredNodeId || "dcc-reference",
        corridor: inferredNodeId || "dcc-reference",
        recordedAt: new Date(nowIso),
        summary: summaryNote,
        approvedAt: null,
        approvedBy: null,
        controlSurface: pagePath,
        metadata: record as unknown as Record<string, unknown>,
      });
    } else {
      const localList = readLocalFallbackReports();
      writeLocalFallbackReports([record, ...localList]);
    }
  } catch (err) {
    return {
      ok: false,
      statusCode: 500,
      error: "persistence_failed",
      message:
        err instanceof Error
          ? `Failed to persist factual-error report: ${err.message}`
          : "Failed to persist factual-error report.",
    };
  }

  // 9. Optional notification (non-blocking; failure never loses persisted report)
  const notif = await sendOptionalFactualErrorNotification(record, {
    sendNotification: input.sendNotification,
    forceNotificationFailureForTest: input.forceNotificationFailureForTest,
  });
  record.notificationStatus = notif.status;
  record.notificationMessageId = notif.messageId ?? null;
  record.notificationError = notif.error ?? null;

  try {
    if (hasConfiguredDatabaseUrl()) {
      const db = await getRequiredEarthosDb();
      await db
        .update(earthosControlMapFindings)
        .set({
          metadata: record as unknown as Record<string, unknown>,
          updatedAt: new Date(),
        })
        .where(eq(earthosControlMapFindings.findingId, record.findingId));
    } else {
      const localList = readLocalFallbackReports().map((item) =>
        item.reportId === record.reportId ? record : item,
      );
      writeLocalFallbackReports(localList);
    }
  } catch {
    // Persisted record already exists in DB; metadata update failure is non-blocking
  }

  appendEarthOSAuditEvent({
    eventType: "reference_drift_detected",
    entity: inferredNodeId === "juneau" ? "alaska" : "earthos",
    corridorId: inferredNodeId || "dcc-reference",
    severity: record.severity === "high" ? "high" : "watch",
    summary: summaryNote,
    metadata: record as unknown as Record<string, unknown>,
  });

  return {
    ok: true,
    deduplicated: false,
    report: record,
  };
}

export async function listFactualErrorReports(options: {
  pagePath?: string;
  nodeId?: string;
  status?: FactualErrorReportStatus;
  environmentScope?: EarthosEnvironmentScope | "all";
  limit?: number;
} = {}): Promise<FactualErrorReportRecord[]> {
  const targetScope = options.environmentScope || resolveEarthosEnvironmentScope();
  let reports: FactualErrorReportRecord[] = [];

  if (hasConfiguredDatabaseUrl()) {
    const db = await getRequiredEarthosDb();
    const rows = await db
      .select()
      .from(earthosControlMapFindings)
      .where(eq(earthosControlMapFindings.owner, FACTUAL_ERROR_OWNER))
      .orderBy(desc(earthosControlMapFindings.updatedAt))
      .limit(options.limit || 100);

    reports = rows
      .map(parseReportFromFindingRow)
      .filter((r): r is FactualErrorReportRecord => r !== null);
  } else {
    reports = readLocalFallbackReports();
  }

  return reports.filter((r) => {
    if (targetScope !== "all" && r.environmentScope !== targetScope) {
      return false;
    }
    if (options.pagePath && r.pagePath !== options.pagePath) return false;
    if (options.nodeId && r.nodeId !== options.nodeId) return false;
    if (options.status && r.status !== options.status) return false;
    return true;
  });
}

export function resetFactualErrorRateLimitsForTests(): void {
  inMemoryIpTimestamps.clear();
}

export async function deleteFactualErrorReportByIdForTests(
  reportId: string,
): Promise<void> {
  const findingId = `factual-error-report:${reportId}`;
  if (hasConfiguredDatabaseUrl()) {
    const db = await getRequiredEarthosDb();
    await db
      .delete(earthosControlMapFindingHistory)
      .where(eq(earthosControlMapFindingHistory.findingId, findingId));
    await db
      .delete(earthosControlMapFindings)
      .where(eq(earthosControlMapFindings.findingId, findingId));
  }
  try {
    if (fs.existsSync(LOCAL_FALLBACK_PATH)) {
      const filtered = readLocalFallbackReports().filter(
        (r) => r.reportId !== reportId,
      );
      if (filtered.length === 0) {
        fs.unlinkSync(LOCAL_FALLBACK_PATH);
      } else {
        writeLocalFallbackReports(filtered);
      }
    }
  } catch {
    // ignore cleanup error
  }
}
