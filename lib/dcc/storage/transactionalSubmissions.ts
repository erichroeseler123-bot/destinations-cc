import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

export type TransactionalSubmissionChannel =
  | "argo-waitlist"
  | "somerset-quote"
  | "welcometothedells-inquiry"
  | "saveonthestrip-help-request"
  | "request-invite"
  | "cp-group-inquiry"
  | "juneauflightdeck-inquiry"
  | "welcometoneworleanstours-inquiry"
  | "lastfrontiershoreexcursions-inquiry"
  | "welcometotheswamp-inquiry"
  | "gosno-dispatch"
  | "parr-inquiry";

export interface DurableTransactionalSubmissionInput {
  submissionId: string;
  channel: TransactionalSubmissionChannel;
  status?: string;
  severity?: "watch" | "high";
  summaryNote: string;
  payload: Record<string, unknown>;
  environment?: string;
  isTest?: boolean;
  createdAt?: string;
}

export interface DurableTransactionalSubmissionResult {
  ok: boolean;
  persisted: boolean;
  backend: "postgres" | "local_dev_file" | "none";
  findingId: string;
  submissionId: string;
  environment: string;
  isTest: boolean;
  createdAt: string;
  status: string;
  error?: string;
}

const LOCAL_DEV_SUBMISSIONS_PATH = path.join(
  process.cwd(),
  ".cache",
  "dcc-transactional-submissions.json",
);

const inMemorySubmissions = new Map<string, Record<string, unknown>>();

export function getInMemoryTransactionalSubmissions(): ReadonlyMap<
  string,
  Record<string, unknown>
> {
  return inMemorySubmissions;
}

export function setInMemoryTransactionalSubmission(
  channel: TransactionalSubmissionChannel,
  submissionId: string,
  metadata: Record<string, unknown>,
): void {
  inMemorySubmissions.set(`${channel}:${submissionId}`, metadata);
}

export function removeInMemoryTransactionalSubmission(
  channel: TransactionalSubmissionChannel,
  submissionId: string,
): boolean {
  return inMemorySubmissions.delete(`${channel}:${submissionId}`);
}

export function clearInMemoryTransactionalSubmissionsForTests(): void {
  inMemorySubmissions.clear();
}

export function resolveRuntimeEnvironmentTag(): string {
  const raw = (process.env.VERCEL_ENV || "").trim();
  return raw || "production";
}

export function isServerlessRuntimeEnvironment(): boolean {
  return (
    process.env.VERCEL === "1" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.VERCEL_ENV === "preview"
  );
}

function resolveTransactionalDatabaseUrl(): string | null {
  if (process.env.DCC_ISOLATED_TEST_DB === "1") {
    return null;
  }
  const explicitTarget = (
    process.env.DCC_TARGET_DB ||
    process.env.DCC_EARTHOS_ENV ||
    ""
  )
    .trim()
    .toLowerCase();
  const isNonProd =
    explicitTarget === "nonprod" ||
    explicitTarget === "preview" ||
    explicitTarget === "development" ||
    explicitTarget === "test" ||
    (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production");

  const candidates = isNonProd
    ? [
        process.env.DCC_NONPROD_DATABASE_URL,
        process.env.DCC_DATABASE_URL,
        process.env.DATABASE_URL,
        process.env.POSTGRES_URL,
      ]
    : [
        process.env.DCC_PRODUCTION_DATABASE_URL,
        process.env.DCC_DATABASE_URL,
        process.env.DATABASE_URL,
        process.env.POSTGRES_URL,
        process.env.DCC_NONPROD_DATABASE_URL,
      ];

  for (const candidate of candidates) {
    const trimmed = (candidate || "").trim();
    if (trimmed) return trimmed;
  }
  return null;
}

function buildFindingId(
  environment: string,
  channel: TransactionalSubmissionChannel,
  submissionId: string,
): string {
  return `control-map:transactional-submission:${environment}:${channel}:${submissionId}`;
}

export async function persistDurableTransactionalSubmission(
  input: DurableTransactionalSubmissionInput,
): Promise<DurableTransactionalSubmissionResult> {
  const environment = (
    input.environment || resolveRuntimeEnvironmentTag()
  ).trim();
  const isTest = Boolean(input.isTest);
  const createdAt = input.createdAt || new Date().toISOString();
  const status = (input.status || "captured").trim();
  const severity = input.severity === "high" ? "high" : "watch";
  const findingId = buildFindingId(environment, input.channel, input.submissionId);
  const owner = `dcc:${input.channel}`;

  const enrichedMetadata: Record<string, unknown> = {
    ...input.payload,
    submissionId: input.submissionId,
    channel: input.channel,
    status,
    environment,
    isTest,
    trafficClass: isTest ? "test" : "production",
    createdAt,
  };

  const dbUrl = resolveTransactionalDatabaseUrl();
  if (dbUrl) {
    try {
      const sql = neon(dbUrl);
      const metadataJson = JSON.stringify(enrichedMetadata);
      await sql`
        INSERT INTO earthos_control_map_findings (
          finding_id,
          status,
          severity,
          owner,
          note,
          metadata,
          created_at,
          updated_at
        )
        VALUES (
          ${findingId},
          ${status},
          ${severity},
          ${owner},
          ${input.summaryNote},
          ${metadataJson}::jsonb,
          ${createdAt}::timestamptz,
          ${createdAt}::timestamptz
        )
        ON CONFLICT (finding_id) DO UPDATE SET
          status = EXCLUDED.status,
          severity = EXCLUDED.severity,
          owner = EXCLUDED.owner,
          note = EXCLUDED.note,
          metadata = EXCLUDED.metadata,
          updated_at = EXCLUDED.updated_at
      `;
      inMemorySubmissions.set(`${input.channel}:${input.submissionId}`, enrichedMetadata);
      return {
        ok: true,
        persisted: true,
        backend: "postgres",
        findingId,
        submissionId: input.submissionId,
        environment,
        isTest,
        createdAt,
        status,
      };
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Durable database insert failed.";
      if (isServerlessRuntimeEnvironment()) {
        return {
          ok: false,
          persisted: false,
          backend: "none",
          findingId,
          submissionId: input.submissionId,
          environment,
          isTest,
          createdAt,
          status,
          error: message,
        };
      }
    }
  }

  if (isServerlessRuntimeEnvironment()) {
    return {
      ok: false,
      persisted: false,
      backend: "none",
      findingId,
      submissionId: input.submissionId,
      environment,
      isTest,
      createdAt,
      status,
      error: "Durable database persistence is unavailable in serverless runtime.",
    };
  }

  // Non-serverless local development / unit test fallback only
  inMemorySubmissions.set(`${input.channel}:${input.submissionId}`, enrichedMetadata);
  if (process.env.DCC_ISOLATED_TEST_DB !== "1") {
    try {
      const dir = path.dirname(LOCAL_DEV_SUBMISSIONS_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      let existing: Record<string, Record<string, unknown>> = {};
      if (fs.existsSync(LOCAL_DEV_SUBMISSIONS_PATH)) {
        existing = JSON.parse(
          fs.readFileSync(LOCAL_DEV_SUBMISSIONS_PATH, "utf8"),
        ) as Record<string, Record<string, unknown>>;
      }
      existing[`${input.channel}:${input.submissionId}`] = enrichedMetadata;
      fs.writeFileSync(
        LOCAL_DEV_SUBMISSIONS_PATH,
        JSON.stringify(existing, null, 2),
        "utf8",
      );
    } catch {
      // inMemorySubmissions already holds local test state
    }
  }

  return {
    ok: true,
    persisted: true,
    backend: "local_dev_file",
    findingId,
    submissionId: input.submissionId,
    environment,
    isTest,
    createdAt,
    status,
  };
}

export async function readDurableTransactionalSubmission(
  channel: TransactionalSubmissionChannel,
  submissionId: string,
): Promise<Record<string, unknown> | null> {
  const trimmedId = (submissionId || "").trim();
  if (!trimmedId) return null;

  const dbUrl = resolveTransactionalDatabaseUrl();
  if (dbUrl) {
    try {
      const sql = neon(dbUrl);
      const owner = `dcc:${channel}`;
      const pattern = `%:${channel}:${trimmedId}`;
      const rows = await sql`
        SELECT finding_id, status, metadata, created_at
        FROM earthos_control_map_findings
        WHERE owner = ${owner}
          AND finding_id LIKE ${pattern}
        ORDER BY updated_at DESC
        LIMIT 1
      `;
      if (Array.isArray(rows) && rows.length > 0) {
        const row = rows[0] as {
          status?: string;
          metadata?: Record<string, unknown> | string;
          created_at?: string | Date;
        };
        const parsedMeta =
          typeof row.metadata === "string"
            ? (JSON.parse(row.metadata) as Record<string, unknown>)
            : (row.metadata ?? {});
        return {
          ...parsedMeta,
          submissionId: trimmedId,
          status:
            typeof parsedMeta.status === "string"
              ? parsedMeta.status
              : row.status || "pending",
          createdAt:
            typeof parsedMeta.createdAt === "string"
              ? parsedMeta.createdAt
              : typeof parsedMeta.timestamp === "string"
                ? parsedMeta.timestamp
                : row.created_at instanceof Date
                  ? row.created_at.toISOString()
                  : String(row.created_at || ""),
        };
      }
    } catch {
      // Fall through to in-memory/local lookup only in non-serverless
    }
  }

  const mem = inMemorySubmissions.get(`${channel}:${trimmedId}`);
  if (mem) return mem;

  if (!isServerlessRuntimeEnvironment()) {
    try {
      if (fs.existsSync(LOCAL_DEV_SUBMISSIONS_PATH)) {
        const parsed = JSON.parse(
          fs.readFileSync(LOCAL_DEV_SUBMISSIONS_PATH, "utf8"),
        ) as Record<string, Record<string, unknown>>;
        return parsed[`${channel}:${trimmedId}`] || null;
      }
    } catch {
      return null;
    }
  }

  return null;
}
