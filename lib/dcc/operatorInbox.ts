import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { readArgoWaitlist } from "@/lib/argoWaitlist";
import { resolveDatabaseUrl } from "@/lib/db/client";
import {
  extractNonPiiAttribution,
  formatAttributionSummaryLine,
  type SanitizedCommercialAttribution,
  type SpecialistCommercialHost,
} from "@/lib/dcc/commercialAttribution";
import { isServerlessRuntimeEnvironment } from "@/lib/dcc/storage/transactionalSubmissions";

export const ALLOWED_CP_BASE_URL_RE =
  /^https:\/\/cruisepromenade(-[a-z0-9]+-erichroeseler123-bots-projects\.vercel\.app|\.com)$/;

export const VALID_OPERATOR_TRIAGE_STATUSES = [
  "new",
  "in_review",
  "contacted",
  "resolved",
  "archived",
] as const;

export type OperatorTriageStatus =
  (typeof VALID_OPERATOR_TRIAGE_STATUSES)[number];

export type OperatorInboxClassification = "genuine" | "test";

export type OperatorNotificationStatus =
  | "delivered"
  | "failed"
  | "not_configured"
  | "unknown";

export type OperatorInboxViewFilter =
  | "genuine"
  | "failed_notifications"
  | "needs_triage"
  | "test"
  | "all";

export type OperatorInboxSourceSite =
  | "destinationcommandcenter"
  | "cruisepromenade"
  | "mightyargo"
  | "somerset"
  | "welcometothedells"
  | "saveonthestrip"
  | "juneauflightdeck"
  | "welcometoneworleanstours"
  | "lastfrontiershoreexcursions"
  | "welcometotheswamp"
  | "gosno"
  | "partyatredrocks";

export interface CpConnectorStatus {
  connected: boolean;
  mode: "remote_api" | "upstash_rest" | "unconfigured" | "error";
  baseUrl?: string;
  reason?: string;
  setupHint?: string;
  namespace?: string;
  fetchedCount?: number;
  earlyAccessFeedbackSummary?: {
    totalCount: number;
    genuineCount: number;
    testCount: number;
  };
}

export interface OperatorChannelHealth {
  resendConfigured: boolean;
  dccMxWarning: string;
  postgresConnected: boolean;
  cpConnectorStatus: CpConnectorStatus;
  argoLegacyFileEntriesCount: number;
  checkedAt: string;
}

export interface OperatorTriageOverlay {
  itemKey: string;
  findingId: string;
  triageStatus: OperatorTriageStatus;
  operatorNote: string | null;
  updatedAt: string;
  updatedBy: string;
  isTest: boolean;
}

export interface OperatorInboxItem {
  itemKey: string;
  sourceId: string;
  findingId: string | null;
  sourceSite: OperatorInboxSourceSite;
  sourceSiteLabel: string;
  channel: string;
  channelLabel: string;
  submittedAt: string;
  environment: string;
  contact: {
    name: string | null;
    email: string | null;
    phone: string | null;
    company: string | null;
  };
  tripDetails: {
    headline: string;
    datesOrMonth: string | null;
    partySize: string | number | null;
    routeOrLocation: string | null;
    messageOrNotes: string | null;
    pageOrSourceUrl: string | null;
  };
  attribution?: SanitizedCommercialAttribution | null;
  classification: OperatorInboxClassification;
  classificationReason: string;
  notificationStatus: OperatorNotificationStatus;
  notificationChannel: string;
  intendedDestination: string;
  failureReason: string | null;
  triageStatus: OperatorTriageStatus;
  operatorNote: string | null;
  triageUpdatedAt: string | null;
  triageUpdatedBy: string | null;
}

export interface OperatorInboxKpiSummary {
  totalStoredCount: number;
  genuineTotalCount: number;
  genuineActionableCount: number;
  needsTriageCount: number;
  failedNotificationsCount: number;
  genuineFailedNotificationsCount: number;
  testProbesPreservedCount: number;
  connectedSourcesCount: number;
  expectedSourcesCount: number;
}

export interface UnifiedOperatorInboxResult {
  ok: true;
  generatedAt: string;
  appliedFilters: {
    view: OperatorInboxViewFilter;
    site: string | null;
    status: OperatorTriageStatus | null;
  };
  kpis: OperatorInboxKpiSummary;
  channelHealth: OperatorChannelHealth;
  totalMatchingCount: number;
  items: OperatorInboxItem[];
}

export interface RawFindingRowInput {
  finding_id: string;
  status?: string | null;
  severity?: string | null;
  owner?: string | null;
  note?: string | null;
  metadata?: Record<string, unknown> | string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
}

export interface RawJfdWaitlistRowInput {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  cruise_line?: string | null;
  ship_name?: string | null;
  port_city?: string | null;
  port_date?: string | Date | null;
  juneau_date?: string | Date | null;
  skagway_date?: string | Date | null;
  tour_type?: string | null;
  party_size?: number | string | null;
  booking_mode?: string | null;
  status?: string | null;
  notes?: string | null;
  estimated_value?: number | string | null;
  is_test?: boolean | null;
  created_at?: string | Date | null;
  raw_entry?: Record<string, unknown> | string | null;
}

export interface RawWtsWaitlistRowInput {
  id: string;
  created_at?: string | Date | null;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  travel_date?: string | Date | null;
  adults?: number | string | null;
  children_count?: number | string | null;
  transportation?: string | null;
  boat_type?: string | null;
  time_window?: string | null;
  specific_tour_id?: string | null;
  status?: string | null;
  raw_entry?: Record<string, unknown> | string | null;
}

export interface GetUnifiedOperatorInboxOptions {
  view?: string | null;
  site?: string | null;
  status?: string | null;
  cpPreviewUrl?: string | null;
  cpAdminKey?: string | null;
  cpVercelProtectionBypass?: string | null;
  /** Optional test overrides so unit tests can inject deterministic fixtures without mutating remote stores */
  findingsOverride?: RawFindingRowInput[];
  jfdWaitlistOverride?: RawJfdWaitlistRowInput[];
  wtsWaitlistOverride?: RawWtsWaitlistRowInput[];
  argoLegacyOverride?: Array<{
    createdAt: string;
    email: string;
    name: string | null;
    source: string;
    preferredMonth: string | null;
    partySize: number | null;
  }>;
  cpFetchOverride?: typeof fetch;
}

const OPERATOR_TRIAGE_OWNER = "dcc:operator-inbox";
const OPERATOR_TRIAGE_PREFIX = "control-map:operator-triage:";
const DCC_MX_WARNING =
  "destinationcommandcenter.com has 0 MX records — use durable web forms & specialist MX inboxes";
const CP_MISSING_KEY_HINT =
  "Set CP_ADMIN_API_KEY (matching Cruise Promenade ADMIN_QUOTES_PASSWORD or DCC_CP_SERVICE_SECRET) in destinations-cc.";

const LOCAL_DEV_SUBMISSIONS_PATH = path.join(
  process.cwd(),
  ".cache",
  "dcc-transactional-submissions.json",
);
const LOCAL_DEV_FACTUAL_REPORTS_PATH = path.resolve(
  process.cwd(),
  "data",
  "memory",
  "factual-error-reports.json",
);
const LOCAL_DEV_TRIAGE_PATH = path.join(
  process.cwd(),
  ".cache",
  "dcc-operator-inbox-triage.json",
);

const inMemoryTriageOverlays = new Map<string, OperatorTriageOverlay>();

const SYNTHETIC_EMAIL_DOMAIN_RE =
  /@(?:example\.(?:com|org|net)|command\.com|test\.com|localhost|juneauflightdeck\.com|welcometoneworleanstours\.com|lastfrontiershoreexcursions\.com)$|\.invalid$/i;

const JFD_SEED_DEMO_IDS = new Set([
  "JFD-SCAN-JUL14-48291",
  "JFD-SCAN-JUL22-19402",
  "JFD-SCAN-AUG03-67319",
  "JFD-SCAN-AUG18-90214",
]);

const FICTIONAL_555_PHONE_RE = /\b555[-.\s]?\d{4}\b/;

const QA_PROBE_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\[PROD-VERIFICATION-TEST\]/i, reason: "qa_probe_marker" },
  { pattern: /\[PREVIEW[-_\s]?TEST\]/i, reason: "qa_probe_marker" },
  { pattern: /\beleanor\s+vance\b/i, reason: "qa_probe_marker" },
  { pattern: /e2e\s+concierge\s+audit\s+test/i, reason: "qa_probe_marker" },
  { pattern: /\baudit[-_\s]?test\b/i, reason: "qa_probe_marker" },
  { pattern: /\bplaywright\b/i, reason: "qa_probe_marker" },
  { pattern: /(?:^|[\s:_-])qa-[a-z0-9_-]*/i, reason: "qa_probe_marker" },
  {
    pattern: /simulated notification service failure/i,
    reason: "qa_probe_marker",
  },
  {
    pattern: /\b(?:smoke[-_]?test|synthetic[-_]?probe|viewport[-_]?probe)\b/i,
    reason: "qa_probe_marker",
  },
];

export function isValidOperatorTriageStatus(
  value: unknown,
): value is OperatorTriageStatus {
  return (
    typeof value === "string" &&
    (VALID_OPERATOR_TRIAGE_STATUSES as readonly string[]).includes(value)
  );
}

export function normalizeInboxViewFilter(
  raw: string | null | undefined,
): OperatorInboxViewFilter {
  const cleaned = (raw || "").trim().toLowerCase();
  if (
    cleaned === "genuine" ||
    cleaned === "failed_notifications" ||
    cleaned === "needs_triage" ||
    cleaned === "test" ||
    cleaned === "all"
  ) {
    return cleaned;
  }
  return "genuine";
}

export function validateCpBaseUrlOverride(
  rawUrl: string | null | undefined,
): { valid: true; url: string | null } | { valid: false; error: string } {
  const trimmed = (rawUrl || "").trim().replace(/\/+$/, "");
  if (!trimmed) {
    return { valid: true, url: null };
  }
  if (!ALLOWED_CP_BASE_URL_RE.test(trimmed)) {
    return {
      valid: false,
      error:
        "Invalid cpPreviewUrl. Must match https://cruisepromenade.com or https://cruisepromenade-<hash>-erichroeseler123-bots-projects.vercel.app.",
    };
  }
  return { valid: true, url: trimmed };
}

export function isLiveResendConfigured(): boolean {
  const key = (process.env.RESEND_API_KEY || "").trim();
  return Boolean(key && key.startsWith("re_") && key.length > 15);
}

export function classifyOperatorInboxSubmission(input: {
  isTest?: unknown;
  trafficClass?: unknown;
  namespace?: string | null;
  environment?: string | null;
  email?: string | null;
  name?: string | null;
  notes?: string | null;
  headline?: string | null;
  sourceId?: string | null;
}): {
  classification: OperatorInboxClassification;
  classificationReason: string;
} {
  if (
    input.isTest === true ||
    input.isTest === "true" ||
    String(input.trafficClass || "").toLowerCase() === "test"
  ) {
    return {
      classification: "test",
      classificationReason: "explicit_is_test",
    };
  }

  const ns = (input.namespace || "").trim().toLowerCase();
  const env = (input.environment || "").trim().toLowerCase();
  if (ns === "preview" || env === "preview" || env === "test") {
    return {
      classification: "test",
      classificationReason: "preview_namespace",
    };
  }

  const email = (input.email || "").trim().toLowerCase();
  if (email && SYNTHETIC_EMAIL_DOMAIN_RE.test(email)) {
    return {
      classification: "test",
      classificationReason: "synthetic_email_domain",
    };
  }

  const combinedText = [
    input.name,
    input.email,
    input.notes,
    input.headline,
    input.sourceId,
  ]
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .join(" \n ");

  for (const probe of QA_PROBE_PATTERNS) {
    if (probe.pattern.test(combinedText)) {
      return {
        classification: "test",
        classificationReason: probe.reason,
      };
    }
  }

  return {
    classification: "genuine",
    classificationReason: "organic_customer_submission",
  };
}

function defaultIntendedDestinationForChannel(channel: string): string {
  switch (channel) {
    case "cp-group-inquiry":
      return "concierge@cruisepromenade.com";
    case "argo-waitlist":
      return (
        process.env.ARGO_ALERT_TO_EMAIL?.trim() ||
        "ops@mightyargoshuttle.com (ARGO_ALERT_TO_EMAIL)"
      );
    case "somerset-quote":
      return (
        process.env.SOMERSET_DISPATCH_TO_EMAIL?.trim() ||
        process.env.EARTHOS_APPROVAL_TO?.trim() ||
        "hello@partyatredrocks.com"
      );
    case "welcometothedells-inquiry":
      return "hello@welcometothedells.com";
    case "saveonthestrip-help-request":
      return "laurensanders123@gmail.com";
    case "gosno-dispatch":
      return "dispatch@gosno.co";
    case "parr-inquiry":
      return "hello@partyatredrocks.com";
    case "juneauflightdeck-inquiry":
      return (
        process.env.DEPLOY_TEST_EMAIL_TO?.trim() ||
        "alerts@juneauflightdeck.com"
      );
    case "welcometoneworleanstours-inquiry":
      return "help@welcometoneworleanstours.com";
    case "welcometotheswamp-inquiry":
      return "concierge@welcometotheswamp.com";
    case "lastfrontiershoreexcursions-inquiry":
      return (
        process.env.EARTHOS_APPROVAL_TO?.trim() ||
        "concierge@lastfrontiershoreexcursions.com"
      );
    case "request-invite":
    case "factual-error-report":
    default:
      return (
        process.env.EARTHOS_APPROVAL_TO?.trim() ||
        "ops@destinationcommandcenter.com (0 MX — EARTHOS_APPROVAL_TO)"
      );
  }
}

export function normalizeInquiryNotificationStatus(
  channel: string,
  meta: Record<string, unknown>,
  resendConfigured: boolean,
): {
  notificationStatus: OperatorNotificationStatus;
  notificationChannel: string;
  intendedDestination: string;
  failureReason: string | null;
} {
  const nestedNotif =
    meta.notification && typeof meta.notification === "object"
      ? (meta.notification as Record<string, unknown>)
      : null;

  const intendedDestination =
    (typeof nestedNotif?.destination === "string" &&
      nestedNotif.destination.trim()) ||
    (typeof meta.intendedDestination === "string" &&
      meta.intendedDestination.trim()) ||
    (typeof meta.destinationInbox === "string" &&
      meta.destinationInbox.trim()) ||
    defaultIntendedDestinationForChannel(channel);

  const notificationChannel =
    (typeof nestedNotif?.channel === "string" && nestedNotif.channel.trim()) ||
    (typeof meta.notificationChannel === "string" &&
      meta.notificationChannel.trim()) ||
    "resend_email";

  const explicitError =
    (typeof meta.emailError === "string" && meta.emailError.trim()) ||
    (typeof meta.notificationError === "string" &&
      meta.notificationError.trim()) ||
    (typeof nestedNotif?.error === "string" && nestedNotif.error.trim()) ||
    (typeof meta.emailReason === "string" &&
      meta.emailReason.trim() &&
      meta.emailReason !== "missing_email_config" &&
      meta.emailReason !== "suppressed_test_submission"
      ? meta.emailReason.trim()
      : null) ||
    null;

  const rawStatus =
    typeof meta.notificationStatus === "string"
      ? meta.notificationStatus.trim().toLowerCase()
      : "";

  // 1. Confirmed delivery signals
  if (
    nestedNotif?.delivered === true ||
    meta.notificationDelivered === true ||
    meta.emailSent === true ||
    meta.emailDispatched === true ||
    rawStatus === "sent" ||
    rawStatus === "delivered"
  ) {
    return {
      notificationStatus: "delivered",
      notificationChannel,
      intendedDestination,
      failureReason: null,
    };
  }

  // 2. Explicit skipped/unconfigured/test-suppressed signals
  if (
    rawStatus === "skipped_unconfigured" ||
    rawStatus === "not_configured" ||
    meta.emailReason === "missing_email_config"
  ) {
    return {
      notificationStatus: "not_configured",
      notificationChannel,
      intendedDestination,
      failureReason:
        explicitError ||
        "Outbound email alert not configured (missing RESEND_API_KEY or target recipient env).",
    };
  }

  if (
    rawStatus === "suppressed_test" ||
    meta.emailReason === "suppressed_test_submission"
  ) {
    return {
      notificationStatus: "not_configured",
      notificationChannel,
      intendedDestination,
      failureReason:
        "Outbound email alert intentionally suppressed for test/preview submission.",
    };
  }

  if (rawStatus === "skipped_disabled") {
    return {
      notificationStatus: "not_configured",
      notificationChannel,
      intendedDestination,
      failureReason: "Outbound notification explicitly disabled on submission.",
    };
  }

  // 3. Explicit failure signals
  if (
    rawStatus === "failed" ||
    rawStatus === "failed_non_blocking" ||
    explicitError
  ) {
    const looksUnconfigured =
      explicitError !== null &&
      /unconfigured|missing_email_config|not configured/i.test(explicitError) &&
      nestedNotif?.channel === "none";

    return {
      notificationStatus: looksUnconfigured ? "not_configured" : "failed",
      notificationChannel,
      intendedDestination,
      failureReason:
        explicitError || "Outbound notification dispatch failed.",
    };
  }

  // 4. Explicit boolean false without detailed error
  if (
    nestedNotif?.delivered === false ||
    meta.notificationDelivered === false ||
    meta.emailSent === false ||
    meta.emailDispatched === false
  ) {
    if (!resendConfigured) {
      return {
        notificationStatus: "not_configured",
        notificationChannel,
        intendedDestination,
        failureReason:
          "RESEND_API_KEY not configured; alert email could not be sent.",
      };
    }
    return {
      notificationStatus: "failed",
      notificationChannel,
      intendedDestination,
      failureReason:
        "Outbound alert returned undelivered (emailSent=false).",
    };
  }

  // 5. Legacy rows stored before delivery status was logged
  if (!resendConfigured) {
    return {
      notificationStatus: "not_configured",
      notificationChannel,
      intendedDestination,
      failureReason:
        "Durable submission stored; RESEND_API_KEY is not configured in this environment.",
    };
  }

  return {
    notificationStatus: "unknown",
    notificationChannel,
    intendedDestination,
    failureReason: null,
  };
}

function resolveOperatorInboxDatabaseUrls(): string[] {
  if (process.env.DCC_ISOLATED_TEST_DB === "1") {
    return [];
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

  const urls: string[] = [];
  for (const candidate of candidates) {
    const trimmed = (candidate || "").trim();
    if (trimmed && !urls.includes(trimmed)) {
      urls.push(trimmed);
      break; // primary transactionalSubmissions DB URL
    }
  }

  const drizzleResolved = resolveDatabaseUrl();
  if (drizzleResolved && !urls.includes(drizzleResolved)) {
    urls.push(drizzleResolved);
  }

  return urls;
}

function sanitizeItemKey(raw: string): string {
  return raw
    .trim()
    .replace(/[^a-zA-Z0-9:._@-]/g, "_")
    .slice(0, 220);
}

export function buildOperatorTriageFindingId(itemKey: string): string {
  return `${OPERATOR_TRIAGE_PREFIX}${sanitizeItemKey(itemKey)}`;
}

function parseMetadataObject(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object"
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
  if (typeof raw === "object") {
    return raw as Record<string, unknown>;
  }
  return {};
}

function toIsoTimestamp(val: unknown, fallbackIso: string): string {
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    return val.toISOString();
  }
  if (typeof val === "string" && val.trim()) {
    const parsed = Date.parse(val);
    if (Number.isFinite(parsed)) {
      return new Date(parsed).toISOString();
    }
  }
  return fallbackIso;
}

export function resolveSpecialistHostForChannel(
  channel: string,
): SpecialistCommercialHost | null {
  switch (channel) {
    case "juneauflightdeck-inquiry":
      return "juneauflightdeck.com";
    case "welcometoneworleanstours-inquiry":
      return "welcometoneworleanstours.com";
    case "lastfrontiershoreexcursions-inquiry":
      return "lastfrontiershoreexcursions.com";
    case "welcometothedells-inquiry":
      return "welcometothedells.com";
    case "saveonthestrip-help-request":
      return "saveonthestrip.com";
    case "welcometotheswamp-inquiry":
      return "welcometotheswamp.com";
    case "gosno-dispatch":
      return "gosno.co";
    case "parr-inquiry":
      return "partyatredrocks.com";
    default:
      return null;
  }
}

export function resolveSiteAndChannelMeta(channel: string): {
  sourceSite: OperatorInboxSourceSite;
  sourceSiteLabel: string;
  channelLabel: string;
} {
  switch (channel) {
    case "argo-waitlist":
      return {
        sourceSite: "mightyargo",
        sourceSiteLabel: "Mighty Argo Shuttle",
        channelLabel: "Argo Launch Waitlist",
      };
    case "somerset-quote":
      return {
        sourceSite: "somerset",
        sourceSiteLabel: "Shuttle to Somerset",
        channelLabel: "Private Group Quote",
      };
    case "welcometothedells-inquiry":
      return {
        sourceSite: "welcometothedells",
        sourceSiteLabel: "Welcome to the Dells",
        channelLabel: "Trip Desk Inquiry",
      };
    case "saveonthestrip-help-request":
      return {
        sourceSite: "saveonthestrip",
        sourceSiteLabel: "Save On The Strip",
        channelLabel: "Vegas Concierge Help",
      };
    case "request-invite":
      return {
        sourceSite: "destinationcommandcenter",
        sourceSiteLabel: "Destination Command Center",
        channelLabel: "Partner / Invite Request",
      };
    case "factual-error-report":
      return {
        sourceSite: "destinationcommandcenter",
        sourceSiteLabel: "Destination Command Center",
        channelLabel: "Factual Error Report",
      };
    case "cp-group-inquiry":
      return {
        sourceSite: "cruisepromenade",
        sourceSiteLabel: "Cruise Promenade",
        channelLabel: "Hosted Group Cruise Inquiry",
      };
    case "juneauflightdeck-inquiry":
      return {
        sourceSite: "juneauflightdeck",
        sourceSiteLabel: "Juneau Flight Deck",
        channelLabel: "Glacier Aviation Availability Request",
      };
    case "welcometoneworleanstours-inquiry":
      return {
        sourceSite: "welcometoneworleanstours",
        sourceSiteLabel: "Welcome to New Orleans Tours",
        channelLabel: "Pre/Post-Cruise & Group Concierge",
      };
    case "lastfrontiershoreexcursions-inquiry":
      return {
        sourceSite: "lastfrontiershoreexcursions",
        sourceSiteLabel: "Last Frontier Shore Excursions",
        channelLabel: "Multi-Port Alaska Excursion Inquiry",
      };
    case "welcometotheswamp-inquiry":
      return {
        sourceSite: "welcometotheswamp",
        sourceSiteLabel: "Welcome to the Swamp",
        channelLabel: "Swamp Tour & Waitlist Concierge",
      };
    case "gosno-dispatch":
      return {
        sourceSite: "gosno",
        sourceSiteLabel: "GoSno Mountain Transportation",
        channelLabel: "Mountain Corridor Dispatch",
      };
    case "parr-inquiry":
      return {
        sourceSite: "partyatredrocks",
        sourceSiteLabel: "Party at Red Rocks",
        channelLabel: "Red Rocks Private Group Inquiry",
      };
    default:
      return {
        sourceSite: "destinationcommandcenter",
        sourceSiteLabel: "Destination Command Center",
        channelLabel: channel,
      };
  }
}

export function mapFindingRowToInboxItem(
  row: RawFindingRowInput,
  resendConfigured: boolean,
): OperatorInboxItem | null {
  const findingId = String(row.finding_id || "").trim();
  if (!findingId || findingId.startsWith(OPERATOR_TRIAGE_PREFIX)) {
    return null;
  }

  const meta = parseMetadataObject(row.metadata);
  const nowIso = new Date().toISOString();

  // Case A: Factual Error Report
  if (
    findingId.startsWith("control-map:factual-error-report:") ||
    findingId.startsWith("factual-error-report:") ||
    row.owner === "earthos-factual-error-report"
  ) {
    const reportId = String(
      meta.reportId || findingId.split(":").pop() || findingId,
    ).trim();
    const pagePath =
      typeof meta.pagePath === "string" ? meta.pagePath : "/contact";
    const disputedClaim =
      typeof meta.disputedClaim === "string"
        ? meta.disputedClaim
        : String(row.note || "Factual correction report");
    const explanation =
      typeof meta.explanation === "string" ? meta.explanation : null;
    const contactInfo =
      typeof meta.contactInfo === "string" && meta.contactInfo.trim()
        ? meta.contactInfo.trim()
        : null;
    const emailMatch =
      contactInfo && contactInfo.includes("@")
        ? contactInfo.match(/[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+/)?.[0] || null
        : null;
    const environment = String(
      meta.environment || meta.environmentScope || "production",
    );
    const submittedAt = toIsoTimestamp(
      meta.submittedAt || row.created_at,
      nowIso,
    );

    const cls = classifyOperatorInboxSubmission({
      isTest: meta.isTest,
      trafficClass: meta.trafficClass,
      environment,
      email: emailMatch,
      name: contactInfo && !emailMatch ? contactInfo : null,
      notes: [disputedClaim, explanation].filter(Boolean).join(" — "),
      headline: pagePath,
      sourceId: reportId,
    });

    const notif = normalizeInquiryNotificationStatus(
      "factual-error-report",
      meta,
      resendConfigured,
    );
    const siteMeta = resolveSiteAndChannelMeta("factual-error-report");

    return {
      itemKey: sanitizeItemKey(`dcc:factual-error-report:${reportId}`),
      sourceId: reportId,
      findingId,
      sourceSite: siteMeta.sourceSite,
      sourceSiteLabel: siteMeta.sourceSiteLabel,
      channel: "factual-error-report",
      channelLabel: siteMeta.channelLabel,
      submittedAt,
      environment,
      contact: {
        name: contactInfo && !emailMatch ? contactInfo : null,
        email: emailMatch,
        phone: null,
        company: null,
      },
      tripDetails: {
        headline: `Claim on ${pagePath}: ${disputedClaim.slice(0, 120)}`,
        datesOrMonth: null,
        partySize: null,
        routeOrLocation:
          typeof meta.nodeId === "string" ? meta.nodeId : pagePath,
        messageOrNotes: explanation,
        pageOrSourceUrl:
          typeof meta.sourceUrl === "string" ? meta.sourceUrl : pagePath,
      },
      classification: cls.classification,
      classificationReason: cls.classificationReason,
      ...notif,
      triageStatus: "new",
      operatorNote: null,
      triageUpdatedAt: null,
      triageUpdatedBy: null,
    };
  }

  // Case B: Durable Transactional Submission
  if (!findingId.startsWith("control-map:transactional-submission:")) {
    return null;
  }

  const parts = findingId.split(":");
  // control-map : transactional-submission : <env> : <channel> : <submissionId...>
  const envFromId = parts[2] || "production";
  const channelFromId = parts[3] || "general";
  const idFromFinding = parts.slice(4).join(":");

  const channel = String(meta.channel || channelFromId).trim();
  const sourceId = String(
    meta.submissionId ||
      meta.id ||
      meta.referenceId ||
      meta.handoffId ||
      meta.quoteId ||
      idFromFinding ||
      findingId,
  ).trim();
  const environment = String(meta.environment || envFromId).trim();
  const submittedAt = toIsoTimestamp(
    meta.createdAt || meta.receivedAt || meta.timestamp || row.created_at,
    nowIso,
  );

  const name =
    typeof meta.name === "string" && meta.name.trim() ? meta.name.trim() : null;
  const email =
    typeof meta.email === "string" && meta.email.trim()
      ? meta.email.trim().toLowerCase()
      : null;
  const phone =
    typeof meta.phone === "string" && meta.phone.trim()
      ? meta.phone.trim()
      : null;
  const company =
    typeof meta.company === "string" && meta.company.trim()
      ? meta.company.trim()
      : null;

  const rawAttributionObj =
    meta.attribution && typeof meta.attribution === "object"
      ? (meta.attribution as Record<string, unknown>)
      : null;

  const specialistHostForChannel = resolveSpecialistHostForChannel(channel);
  const explicitAttributionHost: SpecialistCommercialHost | null =
    specialistHostForChannel ||
    (rawAttributionObj &&
    typeof rawAttributionObj.specialistSite === "string" &&
    (
      [
        "juneauflightdeck.com",
        "welcometoneworleanstours.com",
        "lastfrontiershoreexcursions.com",
        "welcometothedells.com",
        "saveonthestrip.com",
        "welcometotheswamp.com",
        "gosno.co",
        "partyatredrocks.com",
      ] as readonly string[]
    ).includes(rawAttributionObj.specialistSite)
      ? (rawAttributionObj.specialistSite as SpecialistCommercialHost)
      : null);

  const attribution = explicitAttributionHost
    ? extractNonPiiAttribution(rawAttributionObj || meta, {
        specialistSite: explicitAttributionHost,
        defaultPortSlug:
          channel === "welcometoneworleanstours-inquiry" ||
          channel === "welcometotheswamp-inquiry"
            ? "new-orleans"
            : channel === "juneauflightdeck-inquiry" ||
                channel === "lastfrontiershoreexcursions-inquiry"
              ? "juneau"
              : null,
        landingPath:
          typeof meta.sourcePath === "string"
            ? meta.sourcePath
            : typeof meta.sourcePage === "string"
              ? meta.sourcePage
              : null,
      })
    : null;

  const datesOrMonth =
    (typeof meta.concertDate === "string" && meta.concertDate.trim()) ||
    (typeof meta.dates === "string" && meta.dates.trim()) ||
    (typeof meta.portDate === "string" && meta.portDate.trim()) ||
    (typeof meta.sailDate === "string" && meta.sailDate.trim()) ||
    (typeof meta.preferredMonth === "string" && meta.preferredMonth.trim()) ||
    attribution?.portDate ||
    attribution?.sailDate ||
    null;

  const partySize =
    typeof meta.groupSize === "number" || typeof meta.groupSize === "string"
      ? meta.groupSize
      : typeof meta.partySize === "number" || typeof meta.partySize === "string"
        ? meta.partySize
        : attribution?.partySize ?? null;

  const routeOrLocation =
    (typeof meta.pickupCity === "string" && meta.pickupCity.trim()) ||
    (typeof meta.contextTitle === "string" && meta.contextTitle.trim()) ||
    (typeof meta.routeOrLocation === "string" && meta.routeOrLocation.trim()) ||
    (typeof meta.shipName === "string" && meta.shipName.trim()
      ? `${meta.shipName.trim()}${
          typeof meta.portCity === "string" && meta.portCity.trim()
            ? ` · ${meta.portCity.trim()}`
            : attribution?.portSlug
              ? ` · ${attribution.portSlug}`
              : ""
        }`
      : null) ||
    (typeof meta.source === "string" && meta.source.trim()) ||
    null;

  const rawNotes =
    (typeof meta.message === "string" && meta.message.trim()) ||
    (typeof meta.notes === "string" && meta.notes.trim()) ||
    null;

  const attrLine = formatAttributionSummaryLine(attribution);
  const messageOrNotes =
    rawNotes && attrLine
      ? `${rawNotes}\n[Attribution] ${attrLine}`
      : rawNotes || (attrLine ? `[Attribution] ${attrLine}` : null);

  const headline =
    (typeof meta.headline === "string" && meta.headline.trim()) ||
    (typeof meta.artistOrEvent === "string" && meta.artistOrEvent.trim()) ||
    (typeof meta.happeningTitle === "string" && meta.happeningTitle.trim()) ||
    (typeof meta.inquiryType === "string" &&
      `Dells ${meta.inquiryType.replace(/_/g, " ")}`) ||
    (typeof meta.requestType === "string" &&
      `Strip ${meta.requestType.replace(/_/g, " ")}`) ||
    (channel === "argo-waitlist" ? "Mighty Argo Launch Alert Signup" : null) ||
    String(row.note || `${channel} submission`);

  const pageOrSourceUrl =
    (typeof meta.sourcePath === "string" && meta.sourcePath.trim()) ||
    (typeof meta.sourcePage === "string" && meta.sourcePage.trim()) ||
    attribution?.landingPath ||
    (typeof meta.source === "string" && meta.source.trim()) ||
    null;

  const baseCls = classifyOperatorInboxSubmission({
    isTest: meta.isTest,
    trafficClass: meta.trafficClass,
    namespace: typeof meta.namespace === "string" ? meta.namespace : null,
    environment,
    email,
    name,
    notes: rawNotes,
    headline,
    sourceId,
  });

  const cls =
    baseCls.classification === "test"
      ? baseCls
      : JFD_SEED_DEMO_IDS.has(sourceId) ||
          (channel === "juneauflightdeck-inquiry" &&
            phone &&
            FICTIONAL_555_PHONE_RE.test(phone))
        ? {
            classification: "test" as const,
            classificationReason: "seed_demo_fixture",
          }
        : baseCls;

  const notif = normalizeInquiryNotificationStatus(
    channel,
    meta,
    resendConfigured,
  );
  const siteMeta = resolveSiteAndChannelMeta(channel);

  return {
    itemKey: sanitizeItemKey(`dcc:${channel}:${sourceId}`),
    sourceId,
    findingId,
    sourceSite: siteMeta.sourceSite,
    sourceSiteLabel: siteMeta.sourceSiteLabel,
    channel,
    channelLabel: siteMeta.channelLabel,
    submittedAt,
    environment,
    contact: {
      name,
      email,
      phone,
      company,
    },
    tripDetails: {
      headline,
      datesOrMonth,
      partySize,
      routeOrLocation,
      messageOrNotes,
      pageOrSourceUrl,
    },
    attribution,
    classification: cls.classification,
    classificationReason: cls.classificationReason,
    ...notif,
    triageStatus: "new",
    operatorNote: null,
    triageUpdatedAt: null,
    triageUpdatedBy: null,
  };
}

function mapCruisePromenadeInquiryToInboxItem(
  inq: Record<string, unknown>,
  defaultNamespace: string,
  resendConfigured: boolean,
): OperatorInboxItem {
  const nowIso = new Date().toISOString();
  const id = String(
    inq.id ||
      `cp_${createHash("sha256").update(JSON.stringify(inq)).digest("hex").slice(0, 12)}`,
  ).trim();
  const namespace = String(
    inq.namespace || inq.environment || defaultNamespace || "production",
  )
    .trim()
    .toLowerCase();

  const name =
    (typeof inq.contactName === "string" && inq.contactName.trim()) ||
    (typeof inq.name === "string" && inq.name.trim()) ||
    null;
  const email =
    (typeof inq.contactEmail === "string" &&
      inq.contactEmail.trim().toLowerCase()) ||
    (typeof inq.email === "string" && inq.email.trim().toLowerCase()) ||
    null;
  const phone =
    (typeof inq.contactPhone === "string" && inq.contactPhone.trim()) ||
    (typeof inq.phone === "string" && inq.phone.trim()) ||
    null;
  const company =
    (typeof inq.organization === "string" && inq.organization.trim()) ||
    (typeof inq.groupName === "string" && inq.groupName.trim()) ||
    null;

  const groupType =
    (typeof inq.groupType === "string" && inq.groupType.trim()) ||
    (typeof inq.occasion === "string" && inq.occasion.trim()) ||
    "Group Cruise";
  const destination =
    (typeof inq.destination === "string" && inq.destination.trim()) ||
    (typeof inq.region === "string" && inq.region.trim()) ||
    (typeof inq.cruiseLine === "string" && inq.cruiseLine.trim()) ||
    null;
  const sailWindow =
    (typeof inq.sailWindow === "string" && inq.sailWindow.trim()) ||
    (typeof inq.preferredDates === "string" && inq.preferredDates.trim()) ||
    (typeof inq.targetMonth === "string" && inq.targetMonth.trim()) ||
    null;
  const partySize =
    typeof inq.estimatedGuests === "number" ||
    typeof inq.estimatedGuests === "string"
      ? inq.estimatedGuests
      : typeof inq.cabinCount === "number" || typeof inq.cabinCount === "string"
        ? `${inq.cabinCount} cabins`
        : typeof inq.partySize === "number" || typeof inq.partySize === "string"
          ? inq.partySize
          : null;
  const notes =
    (typeof inq.notes === "string" && inq.notes.trim()) ||
    (typeof inq.message === "string" && inq.message.trim()) ||
    (typeof inq.specialRequests === "string" && inq.specialRequests.trim()) ||
    null;

  const headline = destination
    ? `${groupType} — ${destination}`
    : `${groupType} Inquiry`;

  const cls = classifyOperatorInboxSubmission({
    isTest: inq.isTest === true || inq.isGenuineLead === false ? (inq.isTest === true ? true : undefined) : undefined,
    trafficClass: inq.trafficClass,
    namespace,
    environment: namespace,
    email,
    name,
    notes,
    headline,
    sourceId: id,
  });

  // Also honor CP's explicit classification if CP marked it synthetic/test
  const finalClassification: {
    classification: OperatorInboxClassification;
    classificationReason: string;
  } =
    cls.classification === "test"
      ? cls
      : inq.isGenuineLead === false
        ? {
            classification: "test",
            classificationReason:
              typeof inq.classificationReason === "string" &&
              inq.classificationReason.trim()
                ? inq.classificationReason.trim()
                : "cp_classified_synthetic",
          }
        : cls;

  const notif = normalizeInquiryNotificationStatus(
    "cp-group-inquiry",
    inq,
    resendConfigured,
  );
  const siteMeta = resolveSiteAndChannelMeta("cp-group-inquiry");

  return {
    itemKey: sanitizeItemKey(`cp:group-inquiry:${id}`),
    sourceId: id,
    findingId: null,
    sourceSite: siteMeta.sourceSite,
    sourceSiteLabel: siteMeta.sourceSiteLabel,
    channel: "cp-group-inquiry",
    channelLabel: siteMeta.channelLabel,
    submittedAt: toIsoTimestamp(inq.createdAt || inq.submittedAt, nowIso),
    environment: namespace,
    contact: {
      name,
      email,
      phone,
      company,
    },
    tripDetails: {
      headline,
      datesOrMonth: sailWindow,
      partySize,
      routeOrLocation:
        (typeof inq.departurePort === "string" && inq.departurePort.trim()) ||
        destination,
      messageOrNotes: notes,
      pageOrSourceUrl:
        (typeof inq.sourcePage === "string" && inq.sourcePage.trim()) ||
        "/groups",
    },
    classification: finalClassification.classification,
    classificationReason: finalClassification.classificationReason,
    ...notif,
    triageStatus: "new",
    operatorNote: null,
    triageUpdatedAt: null,
    triageUpdatedBy: null,
  };
}

async function runReadOnlyUpstashCommand<T = unknown>(
  upstashUrl: string,
  upstashToken: string,
  command: [string, ...Array<string | number>],
  fetchImpl: typeof fetch,
): Promise<T | null> {
  // Strictly allow read-only commands only — NEVER mutate Cruise Promenade Redis
  const verb = command[0].toUpperCase();
  if (verb !== "LRANGE" && verb !== "LLEN" && verb !== "GET") {
    throw new Error(`Disallowed Upstash command in read-only inbox: ${verb}`);
  }
  const res = await fetchImpl(upstashUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${upstashToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Upstash HTTP ${res.status}`);
  }
  const payload = (await res.json()) as { result?: T };
  return payload.result ?? null;
}

async function fetchCruisePromenadeViaUpstashFallback(
  upstashUrl: string,
  upstashToken: string,
  resendConfigured: boolean,
  fetchImpl: typeof fetch,
): Promise<{
  status: CpConnectorStatus;
  items: OperatorInboxItem[];
}> {
  const [prodRaw, prodNotifsRaw, previewRaw, previewNotifsRaw, fbTotal] =
    await Promise.all([
      runReadOnlyUpstashCommand<string[]>(
        upstashUrl,
        upstashToken,
        ["LRANGE", "cp:group-inquiries", 0, 99],
        fetchImpl,
      ),
      runReadOnlyUpstashCommand<string[]>(
        upstashUrl,
        upstashToken,
        ["LRANGE", "cp:inquiry-notifications", 0, 199],
        fetchImpl,
      ).catch(() => [] as string[]),
      runReadOnlyUpstashCommand<string[]>(
        upstashUrl,
        upstashToken,
        ["LRANGE", "cp:preview:group-inquiries", 0, 49],
        fetchImpl,
      ).catch(() => [] as string[]),
      runReadOnlyUpstashCommand<string[]>(
        upstashUrl,
        upstashToken,
        ["LRANGE", "cp:preview:inquiry-notifications", 0, 99],
        fetchImpl,
      ).catch(() => [] as string[]),
      runReadOnlyUpstashCommand<number>(
        upstashUrl,
        upstashToken,
        ["LLEN", "cp:early-access-feedback"],
        fetchImpl,
      ).catch(() => 0),
    ]);

  const notifById = new Map<string, Record<string, unknown>>();
  for (const rawNotif of [
    ...(prodNotifsRaw || []),
    ...(previewNotifsRaw || []),
  ]) {
    try {
      const parsed = JSON.parse(rawNotif) as Record<string, unknown>;
      const id = typeof parsed?.inquiryId === "string" ? parsed.inquiryId : "";
      if (id && !notifById.has(id)) {
        notifById.set(id, parsed);
      }
    } catch {
      // ignore malformed audit item without mutating storage
    }
  }

  const items: OperatorInboxItem[] = [];
  const seenIds = new Set<string>();

  const ingestList = (list: string[] | null, namespace: string) => {
    for (const raw of list || []) {
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (!parsed || typeof parsed !== "object") continue;
        const id = typeof parsed.id === "string" ? parsed.id : "";
        if (id && seenIds.has(id)) continue;
        if (id) seenIds.add(id);

        const audit = id ? notifById.get(id) : undefined;
        const enriched: Record<string, unknown> = audit
          ? {
              ...parsed,
              notification: {
                delivered: Boolean(audit.delivered === true),
                channel:
                  typeof audit.channel === "string" ? audit.channel : "none",
                destination:
                  typeof audit.destination === "string"
                    ? audit.destination
                    : "concierge@cruisepromenade.com",
                error:
                  typeof audit.error === "string" ? audit.error : undefined,
              },
            }
          : parsed;

        items.push(
          mapCruisePromenadeInquiryToInboxItem(
            enriched,
            namespace,
            resendConfigured,
          ),
        );
      } catch {
        // ignore malformed row
      }
    }
  };

  ingestList(prodRaw, "production");
  ingestList(previewRaw, "preview");

  return {
    status: {
      connected: true,
      mode: "upstash_rest",
      namespace: "production+preview",
      fetchedCount: items.length,
      earlyAccessFeedbackSummary: {
        totalCount: Number(fbTotal) || 0,
        genuineCount: 0,
        testCount: Number(fbTotal) || 0,
      },
    },
    items,
  };
}

async function fetchCruisePromenadeInquiries(options: {
  cpPreviewUrl?: string | null;
  cpAdminKey?: string | null;
  cpVercelProtectionBypass?: string | null;
  resendConfigured: boolean;
  fetchImpl?: typeof fetch;
}): Promise<{
  status: CpConnectorStatus;
  items: OperatorInboxItem[];
}> {
  const fetchImpl = options.fetchImpl || fetch;
  const validatedOverride = validateCpBaseUrlOverride(options.cpPreviewUrl);
  if (!validatedOverride.valid) {
    return {
      status: {
        connected: false,
        mode: "error",
        reason: "invalid_cp_preview_url",
        setupHint: validatedOverride.error,
      },
      items: [],
    };
  }

  const configuredBase = (
    process.env.CP_OPERATOR_INQUIRIES_BASE_URL || "https://cruisepromenade.com"
  )
    .trim()
    .replace(/\/+$/, "");
  const baseUrl = validatedOverride.url || configuredBase;

  const adminKey = (
    options.cpAdminKey ||
    process.env.CP_ADMIN_API_KEY ||
    process.env.DCC_CP_SERVICE_SECRET ||
    ""
  ).trim();

  const upstashUrl = (process.env.CP_KV_REST_API_URL || "")
    .trim()
    .replace(/\/+$/, "");
  const upstashToken = (
    process.env.CP_KV_REST_API_READ_ONLY_TOKEN ||
    process.env.CP_KV_REST_API_TOKEN ||
    ""
  ).trim();

  if (adminKey) {
    try {
      const endpoint = `${baseUrl}/api/group-inquiries?includeNotifications=1&includeFeedbackSummary=1&limit=100`;
      const headers: Record<string, string> = {
        "x-cp-admin-key": adminKey,
        Accept: "application/json",
      };
      const bypass = (
        options.cpVercelProtectionBypass ||
        process.env.CP_VERCEL_BYPASS_SECRET ||
        ""
      ).trim();
      if (bypass && baseUrl.endsWith(".vercel.app")) {
        headers["x-vercel-protection-bypass"] = bypass;
      }

      const res = await fetchImpl(endpoint, {
        method: "GET",
        headers,
        cache: "no-store",
      });

      if (res.ok) {
        const body = (await res.json()) as {
          namespace?: string;
          inquiries?: Array<Record<string, unknown>>;
          earlyAccessFeedbackSummary?: {
            totalCount: number;
            genuineCount: number;
            testCount: number;
          };
        };
        const rawList = Array.isArray(body.inquiries) ? body.inquiries : [];
        const ns = body.namespace || "production";
        const mapped = rawList.map((inq) =>
          mapCruisePromenadeInquiryToInboxItem(
            inq,
            ns,
            options.resendConfigured,
          ),
        );

        return {
          status: {
            connected: true,
            mode: "remote_api",
            baseUrl,
            namespace: ns,
            fetchedCount: mapped.length,
            earlyAccessFeedbackSummary: body.earlyAccessFeedbackSummary,
          },
          items: mapped,
        };
      }

      // Fall through to Upstash REST read-only fallback if configured
      if (upstashUrl && upstashToken) {
        return await fetchCruisePromenadeViaUpstashFallback(
          upstashUrl,
          upstashToken,
          options.resendConfigured,
          fetchImpl,
        );
      }

      return {
        status: {
          connected: false,
          mode: "error",
          baseUrl,
          reason: `cp_remote_http_${res.status}`,
          setupHint:
            res.status === 401 || res.status === 403
              ? "CP_ADMIN_API_KEY was rejected by Cruise Promenade /api/group-inquiries (HTTP 401/403). Verify it matches ADMIN_QUOTES_PASSWORD or DCC_CP_SERVICE_SECRET."
              : `Cruise Promenade /api/group-inquiries returned HTTP ${res.status}.`,
        },
        items: [],
      };
    } catch (err) {
      if (upstashUrl && upstashToken) {
        try {
          return await fetchCruisePromenadeViaUpstashFallback(
            upstashUrl,
            upstashToken,
            options.resendConfigured,
            fetchImpl,
          );
        } catch {
          // continue to error return below
        }
      }
      return {
        status: {
          connected: false,
          mode: "error",
          baseUrl,
          reason: "cp_remote_network_error",
          setupHint:
            err instanceof Error
              ? `Failed to reach Cruise Promenade feed: ${err.message}`
              : "Failed to reach Cruise Promenade feed.",
        },
        items: [],
      };
    }
  }

  if (upstashUrl && upstashToken) {
    try {
      return await fetchCruisePromenadeViaUpstashFallback(
        upstashUrl,
        upstashToken,
        options.resendConfigured,
        fetchImpl,
      );
    } catch (err) {
      return {
        status: {
          connected: false,
          mode: "error",
          reason: "cp_upstash_fallback_failed",
          setupHint:
            err instanceof Error
              ? `Upstash read-only fallback failed: ${err.message}`
              : "Upstash read-only fallback failed.",
        },
        items: [],
      };
    }
  }

  return {
    status: {
      connected: false,
      mode: "unconfigured",
      baseUrl,
      reason: "missing_cp_admin_key",
      setupHint: CP_MISSING_KEY_HINT,
    },
    items: [],
  };
}

async function loadDccFindingRowsAndTriageOverlays(
  findingsOverride?: RawFindingRowInput[],
): Promise<{
  postgresConnected: boolean;
  submissionRows: RawFindingRowInput[];
  triageByItemKey: Map<string, OperatorTriageOverlay>;
}> {
  const triageByItemKey = new Map<string, OperatorTriageOverlay>();

  const absorbTriageRow = (row: RawFindingRowInput) => {
    const fid = String(row.finding_id || "").trim();
    if (!fid.startsWith(OPERATOR_TRIAGE_PREFIX)) return;
    const meta = parseMetadataObject(row.metadata);
    const itemKey = String(
      meta.itemKey || fid.slice(OPERATOR_TRIAGE_PREFIX.length),
    ).trim();
    if (!itemKey) return;
    const rawStatus = String(meta.triageStatus || row.status || "new").trim();
    const triageStatus: OperatorTriageStatus = isValidOperatorTriageStatus(
      rawStatus,
    )
      ? rawStatus
      : "new";
    const operatorNote =
      typeof meta.operatorNote === "string"
        ? meta.operatorNote
        : typeof row.note === "string" && row.note.trim()
          ? row.note.trim()
          : null;
    const updatedAt = toIsoTimestamp(
      meta.updatedAt || row.updated_at || row.created_at,
      new Date().toISOString(),
    );
    const updatedBy =
      typeof meta.updatedBy === "string" && meta.updatedBy.trim()
        ? meta.updatedBy.trim()
        : "admin";
    const isTest = Boolean(meta.isTest);

    const existing = triageByItemKey.get(itemKey);
    if (
      !existing ||
      Date.parse(updatedAt) >= Date.parse(existing.updatedAt)
    ) {
      triageByItemKey.set(itemKey, {
        itemKey,
        findingId: fid,
        triageStatus,
        operatorNote,
        updatedAt,
        updatedBy,
        isTest,
      });
    }
  };

  if (findingsOverride) {
    const submissionRows: RawFindingRowInput[] = [];
    for (const row of findingsOverride) {
      if (String(row.finding_id || "").startsWith(OPERATOR_TRIAGE_PREFIX)) {
        absorbTriageRow(row);
      } else {
        submissionRows.push(row);
      }
    }
    for (const [key, overlay] of inMemoryTriageOverlays.entries()) {
      const existing = triageByItemKey.get(key);
      if (
        !existing ||
        Date.parse(overlay.updatedAt) >= Date.parse(existing.updatedAt)
      ) {
        triageByItemKey.set(key, overlay);
      }
    }
    return {
      postgresConnected: true,
      submissionRows,
      triageByItemKey,
    };
  }

  const dbUrls = resolveOperatorInboxDatabaseUrls();
  const submissionByFindingId = new Map<string, RawFindingRowInput>();
  let postgresConnected = false;

  for (const dbUrl of dbUrls) {
    try {
      const sql = neon(dbUrl);
      const rows = (await sql`
        SELECT finding_id, status, severity, owner, note, metadata, created_at, updated_at
        FROM earthos_control_map_findings
        WHERE finding_id LIKE 'control-map:transactional-submission:%'
           OR finding_id LIKE 'control-map:factual-error-report:%'
           OR finding_id LIKE 'factual-error-report:%'
           OR finding_id LIKE 'control-map:operator-triage:%'
           OR owner = 'earthos-factual-error-report'
           OR owner = 'dcc:operator-inbox'
        ORDER BY updated_at DESC
        LIMIT 500
      `) as RawFindingRowInput[];
      postgresConnected = true;
      for (const row of rows || []) {
        const fid = String(row.finding_id || "").trim();
        if (!fid) continue;
        if (fid.startsWith(OPERATOR_TRIAGE_PREFIX) || row.owner === OPERATOR_TRIAGE_OWNER) {
          absorbTriageRow(row);
        } else if (!submissionByFindingId.has(fid)) {
          submissionByFindingId.set(fid, row);
        }
      }
    } catch {
      // Fall through to secondary URL or local dev fallback
    }
  }

  // Non-serverless local dev / unit test fallbacks
  if (!isServerlessRuntimeEnvironment() && !postgresConnected) {
    try {
      if (fs.existsSync(LOCAL_DEV_SUBMISSIONS_PATH)) {
        const rawMap = JSON.parse(
          fs.readFileSync(LOCAL_DEV_SUBMISSIONS_PATH, "utf8"),
        ) as Record<string, Record<string, unknown>>;
        for (const [key, meta] of Object.entries(rawMap || {})) {
          const channel = String(meta.channel || key.split(":")[0] || "general");
          const subId = String(meta.submissionId || key.split(":").slice(1).join(":"));
          const env = String(meta.environment || "development");
          const fid = `control-map:transactional-submission:${env}:${channel}:${subId}`;
          if (!submissionByFindingId.has(fid)) {
            submissionByFindingId.set(fid, {
              finding_id: fid,
              status: String(meta.status || "captured"),
              owner: `dcc:${channel}`,
              metadata: meta,
              created_at: String(meta.createdAt || new Date().toISOString()),
              updated_at: String(meta.createdAt || new Date().toISOString()),
            });
          }
        }
      }
    } catch {
      // ignore local dev file parse error
    }

    try {
      if (fs.existsSync(LOCAL_DEV_FACTUAL_REPORTS_PATH)) {
        const reports = JSON.parse(
          fs.readFileSync(LOCAL_DEV_FACTUAL_REPORTS_PATH, "utf8"),
        ) as Array<Record<string, unknown>>;
        for (const report of Array.isArray(reports) ? reports : []) {
          const fid = String(
            report.findingId ||
              `control-map:factual-error-report:nonprod:${report.reportId || "unknown"}`,
          );
          if (!submissionByFindingId.has(fid)) {
            submissionByFindingId.set(fid, {
              finding_id: fid,
              status: String(report.status || "open"),
              owner: "earthos-factual-error-report",
              metadata: report,
              created_at: String(report.submittedAt || new Date().toISOString()),
              updated_at: String(report.updatedAt || new Date().toISOString()),
            });
          }
        }
      }
    } catch {
      // ignore
    }

    try {
      if (fs.existsSync(LOCAL_DEV_TRIAGE_PATH)) {
        const triageMap = JSON.parse(
          fs.readFileSync(LOCAL_DEV_TRIAGE_PATH, "utf8"),
        ) as Record<string, OperatorTriageOverlay>;
        for (const [k, overlay] of Object.entries(triageMap || {})) {
          triageByItemKey.set(k, overlay);
        }
      }
    } catch {
      // ignore
    }
  }

  for (const [key, overlay] of inMemoryTriageOverlays.entries()) {
    const existing = triageByItemKey.get(key);
    if (
      !existing ||
      Date.parse(overlay.updatedAt) >= Date.parse(existing.updatedAt)
    ) {
      triageByItemKey.set(key, overlay);
    }
  }

  return {
    postgresConnected,
    submissionRows: Array.from(submissionByFindingId.values()),
    triageByItemKey,
  };
}

export async function saveOperatorInboxTriageOverlay(input: {
  itemKey: string;
  triageStatus: OperatorTriageStatus;
  operatorNote?: string | null;
  updatedBy?: string | null;
  isTest?: boolean;
}): Promise<{
  ok: boolean;
  backend: "postgres" | "local_dev_file" | "none";
  overlay: OperatorTriageOverlay;
  error?: string;
}> {
  const cleanedKey = sanitizeItemKey(input.itemKey || "");
  if (!cleanedKey) {
    throw new Error("itemKey is required.");
  }
  if (!isValidOperatorTriageStatus(input.triageStatus)) {
    throw new Error(`Invalid triageStatus: ${String(input.triageStatus)}`);
  }

  const trimmedNote =
    typeof input.operatorNote === "string" && input.operatorNote.trim()
      ? input.operatorNote.trim().slice(0, 500)
      : null;
  const updatedAt = new Date().toISOString();
  const updatedBy =
    typeof input.updatedBy === "string" && input.updatedBy.trim()
      ? input.updatedBy.trim().slice(0, 80)
      : "admin";
  const isTest = Boolean(input.isTest);
  const findingId = buildOperatorTriageFindingId(cleanedKey);

  // Strictly guarantee we NEVER write to an underlying submission finding_id
  if (!findingId.startsWith(OPERATOR_TRIAGE_PREFIX)) {
    throw new Error("Invalid triage overlay findingId prefix.");
  }

  const overlay: OperatorTriageOverlay = {
    itemKey: cleanedKey,
    findingId,
    triageStatus: input.triageStatus,
    operatorNote: trimmedNote,
    updatedAt,
    updatedBy,
    isTest,
  };

  const metadataPayload = {
    ...overlay,
    trafficClass: isTest ? "test" : "production",
  };

  const dbUrls = resolveOperatorInboxDatabaseUrls();
  if (dbUrls.length > 0) {
    const primaryDbUrl = dbUrls[0];
    try {
      const sql = neon(primaryDbUrl);
      const metadataJson = JSON.stringify(metadataPayload);
      const summaryNote = trimmedNote || `Triage status -> ${input.triageStatus}`;
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
          ${input.triageStatus},
          ${"watch"},
          ${OPERATOR_TRIAGE_OWNER},
          ${summaryNote},
          ${metadataJson}::jsonb,
          ${updatedAt}::timestamptz,
          ${updatedAt}::timestamptz
        )
        ON CONFLICT (finding_id) DO UPDATE SET
          status = EXCLUDED.status,
          owner = EXCLUDED.owner,
          note = EXCLUDED.note,
          metadata = EXCLUDED.metadata,
          updated_at = EXCLUDED.updated_at
      `;
      inMemoryTriageOverlays.set(cleanedKey, overlay);
      return {
        ok: true,
        backend: "postgres",
        overlay,
      };
    } catch (err) {
      if (isServerlessRuntimeEnvironment()) {
        return {
          ok: false,
          backend: "none",
          overlay,
          error:
            err instanceof Error
              ? err.message
              : "Failed to persist operator triage overlay in Postgres.",
        };
      }
    }
  }

  if (isServerlessRuntimeEnvironment()) {
    return {
      ok: false,
      backend: "none",
      overlay,
      error: "Durable Postgres connection unavailable for triage overlay.",
    };
  }

  inMemoryTriageOverlays.set(cleanedKey, overlay);
  try {
    const dir = path.dirname(LOCAL_DEV_TRIAGE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    let existing: Record<string, OperatorTriageOverlay> = {};
    if (fs.existsSync(LOCAL_DEV_TRIAGE_PATH)) {
      existing = JSON.parse(
        fs.readFileSync(LOCAL_DEV_TRIAGE_PATH, "utf8"),
      ) as Record<string, OperatorTriageOverlay>;
    }
    existing[cleanedKey] = overlay;
    fs.writeFileSync(
      LOCAL_DEV_TRIAGE_PATH,
      JSON.stringify(existing, null, 2),
      "utf8",
    );
  } catch {
    // inMemoryTriageOverlays retains overlay for isolated test run
  }

  return {
    ok: true,
    backend: "local_dev_file",
    overlay,
  };
}

function formatDateColumn(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    return val.toISOString().slice(0, 10);
  }
  if (typeof val === "string" && val.trim()) {
    return val.trim().slice(0, 10);
  }
  return null;
}

function mapJfdWaitlistRowToInboxItem(
  row: RawJfdWaitlistRowInput,
  resendConfigured: boolean,
): OperatorInboxItem | null {
  const id = String(row.id || "").trim();
  if (!id) return null;

  const rawEntry = parseMetadataObject(row.raw_entry);
  const name =
    (typeof row.name === "string" && row.name.trim()) ||
    (typeof rawEntry.name === "string" && rawEntry.name.trim()) ||
    null;
  const email =
    (typeof row.email === "string" && row.email.trim().toLowerCase()) ||
    (typeof rawEntry.email === "string" && rawEntry.email.trim().toLowerCase()) ||
    null;
  const phone =
    (typeof row.phone === "string" && row.phone.trim()) ||
    (typeof rawEntry.phone === "string" && rawEntry.phone.trim()) ||
    null;
  const cruiseLine =
    (typeof row.cruise_line === "string" && row.cruise_line.trim()) ||
    (typeof rawEntry.cruiseLine === "string" && rawEntry.cruiseLine.trim()) ||
    null;
  const shipName =
    (typeof row.ship_name === "string" && row.ship_name.trim()) ||
    (typeof rawEntry.shipName === "string" && rawEntry.shipName.trim()) ||
    null;
  const portCity =
    (typeof row.port_city === "string" && row.port_city.trim().toLowerCase()) ||
    (typeof rawEntry.portCity === "string" &&
      rawEntry.portCity.trim().toLowerCase()) ||
    "juneau";
  const portDate =
    formatDateColumn(row.port_date) ||
    formatDateColumn(rawEntry.portDate) ||
    null;
  const juneauDate =
    formatDateColumn(row.juneau_date) ||
    formatDateColumn(rawEntry.juneau_date ?? rawEntry.juneauDate) ||
    null;
  const skagwayDate =
    formatDateColumn(row.skagway_date) ||
    formatDateColumn(rawEntry.skagway_date ?? rawEntry.skagwayDate) ||
    null;
  const tourType =
    (typeof row.tour_type === "string" && row.tour_type.trim()) ||
    (typeof rawEntry.tourType === "string" && rawEntry.tourType.trim()) ||
    "any";
  const bookingMode =
    (typeof row.booking_mode === "string" && row.booking_mode.trim()) ||
    (typeof rawEntry.bookingMode === "string" && rawEntry.bookingMode.trim()) ||
    "instant_alert";
  const partySize =
    row.party_size ??
    (typeof rawEntry.partySize === "number" ||
    typeof rawEntry.partySize === "string"
      ? rawEntry.partySize
      : null);
  const estValue =
    row.estimated_value !== undefined && row.estimated_value !== null
      ? Number(row.estimated_value)
      : typeof rawEntry.estimatedValue === "number"
        ? rawEntry.estimatedValue
        : null;
  const notes =
    (typeof row.notes === "string" && row.notes.trim()) ||
    (typeof rawEntry.notes === "string" && rawEntry.notes.trim()) ||
    null;

  const submittedAt = toIsoTimestamp(
    rawEntry.createdAt || row.created_at,
    new Date().toISOString(),
  );
  const isExplicitTest = Boolean(
    row.is_test === true ||
      rawEntry.isTest === true ||
      row.status === "test_excluded" ||
      rawEntry.status === "test_excluded",
  );
  const environment =
    typeof rawEntry.environment === "string" && rawEntry.environment.trim()
      ? rawEntry.environment.trim()
      : "production";

  const headline = `Glacier ${tourType.replace(/_/g, " ")} (${bookingMode.replace(/_/g, " ")}) — ${shipName || "Cruise Passenger"}`;

  const baseCls = classifyOperatorInboxSubmission({
    isTest: isExplicitTest,
    environment,
    email,
    name,
    notes,
    headline,
    sourceId: id,
  });

  const finalCls =
    baseCls.classification === "test"
      ? baseCls
      : JFD_SEED_DEMO_IDS.has(id) ||
          (phone && FICTIONAL_555_PHONE_RE.test(phone))
        ? {
            classification: "test" as const,
            classificationReason: "seed_demo_fixture",
          }
        : baseCls;

  const attribution = extractNonPiiAttribution(
    {
      ...(rawEntry.attribution && typeof rawEntry.attribution === "object"
        ? (rawEntry.attribution as Record<string, unknown>)
        : {}),
      shipName,
      portDate: juneauDate || portDate,
      port: portCity,
      partySize,
    },
    {
      specialistSite: "juneauflightdeck.com",
      defaultPortSlug: portCity,
      landingPath:
        typeof rawEntry.sourcePage === "string"
          ? rawEntry.sourcePage
          : "/helicopter-waitlist",
    },
  );

  const dateWindowParts: string[] = [];
  if (juneauDate) dateWindowParts.push(`Juneau ${juneauDate}`);
  if (skagwayDate) dateWindowParts.push(`Skagway ${skagwayDate}`);
  if (dateWindowParts.length === 0 && portDate) dateWindowParts.push(portDate);

  const valueNote =
    estValue && Number.isFinite(estValue) && estValue > 0
      ? `Est. gross booking value: $${estValue.toLocaleString()}`
      : null;
  const combinedNotes = [notes, valueNote].filter(Boolean).join(" · ") || null;

  const notif = normalizeInquiryNotificationStatus(
    "juneauflightdeck-inquiry",
    {
      notificationDelivered: Boolean(rawEntry.notificationDispatchedAt),
      intendedDestination: "alerts@juneauflightdeck.com",
    },
    resendConfigured,
  );
  const siteMeta = resolveSiteAndChannelMeta("juneauflightdeck-inquiry");

  return {
    itemKey: sanitizeItemKey(`jfd:waitlist:${id}`),
    sourceId: id,
    findingId: null,
    sourceSite: siteMeta.sourceSite,
    sourceSiteLabel: siteMeta.sourceSiteLabel,
    channel: "juneauflightdeck-inquiry",
    channelLabel: siteMeta.channelLabel,
    submittedAt,
    environment,
    contact: {
      name,
      email,
      phone,
      company: cruiseLine,
    },
    tripDetails: {
      headline,
      datesOrMonth: dateWindowParts.join(" / ") || null,
      partySize,
      routeOrLocation: [shipName, portCity.toUpperCase()]
        .filter(Boolean)
        .join(" · "),
      messageOrNotes: combinedNotes,
      pageOrSourceUrl:
        typeof rawEntry.sourcePage === "string"
          ? rawEntry.sourcePage
          : "/helicopter-waitlist",
    },
    attribution,
    classification: finalCls.classification,
    classificationReason: finalCls.classificationReason,
    ...notif,
    triageStatus: "new",
    operatorNote: null,
    triageUpdatedAt: null,
    triageUpdatedBy: null,
  };
}

async function loadJfdWaitlistRowsFromPostgres(): Promise<
  RawJfdWaitlistRowInput[]
> {
  const dbUrls = resolveOperatorInboxDatabaseUrls();
  for (const dbUrl of dbUrls) {
    try {
      const sql = neon(dbUrl);
      const rows = (await sql`
        SELECT
          id,
          name,
          email,
          phone,
          cruise_line,
          ship_name,
          port_city,
          port_date,
          juneau_date,
          skagway_date,
          tour_type,
          party_size,
          booking_mode,
          status,
          notes,
          estimated_value,
          is_test,
          created_at,
          raw_entry
        FROM jfd_waitlist_submissions
        ORDER BY created_at DESC
        LIMIT 200
      `) as RawJfdWaitlistRowInput[];
      return Array.isArray(rows) ? rows : [];
    } catch {
      // Table may not exist on isolated DB; ignore safely
    }
  }
  return [];
}

async function loadWtsWaitlistRowsFromPostgres(): Promise<
  RawWtsWaitlistRowInput[]
> {
  const dbUrls = resolveOperatorInboxDatabaseUrls();
  for (const dbUrl of dbUrls) {
    try {
      const sql = neon(dbUrl);
      const rows = (await sql`
        SELECT
          id,
          created_at,
          email,
          name,
          phone,
          travel_date,
          adults,
          children_count,
          transportation,
          boat_type,
          time_window,
          specific_tour_id,
          status,
          raw_entry
        FROM wts_waitlist_submissions
        ORDER BY created_at DESC
        LIMIT 200
      `) as RawWtsWaitlistRowInput[];
      return Array.isArray(rows) ? rows : [];
    } catch {
      // Table may not exist on isolated DB; ignore safely
    }
  }
  return [];
}

function mapWtsWaitlistRowToInboxItem(
  row: RawWtsWaitlistRowInput,
  resendConfigured: boolean,
): OperatorInboxItem | null {
  const id = String(row.id || "").trim();
  if (!id) return null;

  const rawEntry = parseMetadataObject(row.raw_entry);
  const name =
    (typeof row.name === "string" && row.name.trim()) ||
    (typeof rawEntry.name === "string" && rawEntry.name.trim()) ||
    null;
  const email =
    (typeof row.email === "string" && row.email.trim().toLowerCase()) ||
    (typeof rawEntry.email === "string" && rawEntry.email.trim().toLowerCase()) ||
    null;
  const phone =
    (typeof row.phone === "string" && row.phone.trim()) ||
    (typeof rawEntry.phone === "string" && rawEntry.phone.trim()) ||
    null;
  const travelDate =
    formatDateColumn(row.travel_date) ||
    formatDateColumn(rawEntry.travelDate) ||
    null;
  const adults = Number(row.adults ?? rawEntry.adults ?? 2) || 2;
  const childrenCount =
    Number(row.children_count ?? rawEntry.childrenCount ?? 0) || 0;
  const partySize = adults + childrenCount;
  const boatType =
    (typeof row.boat_type === "string" && row.boat_type.trim()) ||
    (typeof rawEntry.boatType === "string" && rawEntry.boatType.trim()) ||
    "any";
  const transportation =
    (typeof row.transportation === "string" && row.transportation.trim()) ||
    (typeof rawEntry.transportation === "string" &&
      rawEntry.transportation.trim()) ||
    "either";
  const timeWindow =
    (typeof row.time_window === "string" && row.time_window.trim()) ||
    (typeof rawEntry.timeWindow === "string" && rawEntry.timeWindow.trim()) ||
    "any";
  const specificTourId =
    (typeof row.specific_tour_id === "string" && row.specific_tour_id.trim()) ||
    (typeof rawEntry.specificTourId === "string" &&
      rawEntry.specificTourId.trim()) ||
    null;

  const submittedAt = toIsoTimestamp(
    rawEntry.createdAt || row.created_at,
    new Date().toISOString(),
  );
  const environment =
    typeof rawEntry.environment === "string" && rawEntry.environment.trim()
      ? rawEntry.environment.trim()
      : "production";

  const headline = `Swamp Seat Waitlist (${boatType.replace(/_/g, " ")}) — ${partySize} guests`;
  const summaryNotes = [
    `Adults: ${adults}`,
    childrenCount > 0 ? `Children: ${childrenCount}` : null,
    `Transport: ${transportation.replace(/_/g, " ")}`,
    `Window: ${timeWindow}`,
    specificTourId ? `Tour: ${specificTourId}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const cls = classifyOperatorInboxSubmission({
    isTest: rawEntry.isTest === true,
    environment,
    email,
    name,
    notes: summaryNotes,
    headline,
    sourceId: id,
  });

  const attribution = extractNonPiiAttribution(
    {
      ...(rawEntry.attribution && typeof rawEntry.attribution === "object"
        ? (rawEntry.attribution as Record<string, unknown>)
        : {}),
      portDate: travelDate,
      port: "new-orleans",
      partySize,
    },
    {
      specialistSite: "welcometotheswamp.com",
      defaultPortSlug: "new-orleans",
      landingPath: "/waitlist",
    },
  );

  const notif = normalizeInquiryNotificationStatus(
    "welcometotheswamp-inquiry",
    {
      notificationStatus: rawEntry.notificationDispatchedAt
        ? "sent"
        : "not_configured",
      intendedDestination: "concierge@welcometotheswamp.com",
    },
    resendConfigured,
  );
  const siteMeta = resolveSiteAndChannelMeta("welcometotheswamp-inquiry");

  return {
    itemKey: sanitizeItemKey(`wts:waitlist:${id}`),
    sourceId: id,
    findingId: null,
    sourceSite: siteMeta.sourceSite,
    sourceSiteLabel: siteMeta.sourceSiteLabel,
    channel: "welcometotheswamp-inquiry",
    channelLabel: siteMeta.channelLabel,
    submittedAt,
    environment,
    contact: {
      name,
      email,
      phone,
      company: null,
    },
    tripDetails: {
      headline,
      datesOrMonth: travelDate,
      partySize,
      routeOrLocation: `New Orleans · ${transportation.replace(/_/g, " ")}`,
      messageOrNotes: summaryNotes || null,
      pageOrSourceUrl: "/waitlist",
    },
    attribution,
    classification: cls.classification,
    classificationReason: cls.classificationReason,
    ...notif,
    triageStatus: "new",
    operatorNote: null,
    triageUpdatedAt: null,
    triageUpdatedBy: null,
  };
}

export function clearInMemoryOperatorTriageForTests(): void {
  inMemoryTriageOverlays.clear();
  if (!isServerlessRuntimeEnvironment()) {
    try {
      if (fs.existsSync(LOCAL_DEV_TRIAGE_PATH)) {
        fs.unlinkSync(LOCAL_DEV_TRIAGE_PATH);
      }
    } catch {
      // ignore
    }
  }
}

export async function getUnifiedOperatorInbox(
  options: GetUnifiedOperatorInboxOptions = {},
): Promise<UnifiedOperatorInboxResult> {
  const generatedAt = new Date().toISOString();
  const resendConfigured = isLiveResendConfigured();
  const view = normalizeInboxViewFilter(options.view);
  const siteFilter = options.site?.trim().toLowerCase() || null;
  const statusFilter =
    options.status && isValidOperatorTriageStatus(options.status.trim())
      ? (options.status.trim() as OperatorTriageStatus)
      : null;

  const [dccData, argoLegacyEntries, cpData, jfdWaitlistRows, wtsWaitlistRows] =
    await Promise.all([
      loadDccFindingRowsAndTriageOverlays(options.findingsOverride),
      options.argoLegacyOverride
        ? Promise.resolve(options.argoLegacyOverride)
        : readArgoWaitlist().catch(() => []),
      fetchCruisePromenadeInquiries({
        cpPreviewUrl: options.cpPreviewUrl,
        cpAdminKey: options.cpAdminKey,
        cpVercelProtectionBypass: options.cpVercelProtectionBypass,
        resendConfigured,
        fetchImpl: options.cpFetchOverride,
      }),
      options.jfdWaitlistOverride
        ? Promise.resolve(options.jfdWaitlistOverride)
        : options.findingsOverride
          ? Promise.resolve([] as RawJfdWaitlistRowInput[])
          : loadJfdWaitlistRowsFromPostgres(),
      options.wtsWaitlistOverride
        ? Promise.resolve(options.wtsWaitlistOverride)
        : options.findingsOverride
          ? Promise.resolve([] as RawWtsWaitlistRowInput[])
          : loadWtsWaitlistRowsFromPostgres(),
    ]);

  const itemsByKey = new Map<string, OperatorInboxItem>();
  const argoDedupFingerprints = new Set<string>();
  const seenJfdSourceIds = new Set<string>();
  const seenWtsSourceIds = new Set<string>();

  for (const row of dccData.submissionRows) {
    const item = mapFindingRowToInboxItem(row, resendConfigured);
    if (!item) continue;
    itemsByKey.set(item.itemKey, item);
    if (item.channel === "juneauflightdeck-inquiry" && item.sourceId) {
      seenJfdSourceIds.add(item.sourceId);
    }
    if (item.channel === "welcometotheswamp-inquiry" && item.sourceId) {
      seenWtsSourceIds.add(item.sourceId);
    }
    if (item.channel === "argo-waitlist" && item.contact.email) {
      const minuteBucket = item.submittedAt.slice(0, 16);
      argoDedupFingerprints.add(`${item.contact.email}|${minuteBucket}`);
    }
  }

  for (const jfdRow of jfdWaitlistRows) {
    const jfdItem = mapJfdWaitlistRowToInboxItem(jfdRow, resendConfigured);
    if (!jfdItem) continue;
    if (seenJfdSourceIds.has(jfdItem.sourceId)) continue;
    seenJfdSourceIds.add(jfdItem.sourceId);
    if (!itemsByKey.has(jfdItem.itemKey)) {
      itemsByKey.set(jfdItem.itemKey, jfdItem);
    }
  }

  for (const wtsRow of wtsWaitlistRows) {
    const wtsItem = mapWtsWaitlistRowToInboxItem(wtsRow, resendConfigured);
    if (!wtsItem) continue;
    if (seenWtsSourceIds.has(wtsItem.sourceId)) continue;
    seenWtsSourceIds.add(wtsItem.sourceId);
    if (!itemsByKey.has(wtsItem.itemKey)) {
      itemsByKey.set(wtsItem.itemKey, wtsItem);
    }
  }

  // Merge/deduplicate legacy readArgoWaitlist() JSONL rows not already in Postgres
  for (const entry of argoLegacyEntries) {
    const normalizedEmail = entry.email.trim().toLowerCase();
    const submittedIso = toIsoTimestamp(entry.createdAt, generatedAt);
    const minuteBucket = submittedIso.slice(0, 16);
    const fp = `${normalizedEmail}|${minuteBucket}`;
    if (argoDedupFingerprints.has(fp)) continue;
    argoDedupFingerprints.add(fp);

    const legacyHash = createHash("sha256")
      .update(`${normalizedEmail}|${entry.createdAt}|${entry.source}`)
      .digest("hex")
      .slice(0, 12);
    const itemKey = sanitizeItemKey(`dcc:argo-waitlist:legacy_${legacyHash}`);
    if (itemsByKey.has(itemKey)) continue;

    const cls = classifyOperatorInboxSubmission({
      email: normalizedEmail,
      name: entry.name,
      headline: `Mighty Argo Waitlist (${entry.source})`,
      sourceId: `legacy_${legacyHash}`,
    });
    const siteMeta = resolveSiteAndChannelMeta("argo-waitlist");
    const notif = normalizeInquiryNotificationStatus(
      "argo-waitlist",
      {},
      resendConfigured,
    );

    itemsByKey.set(itemKey, {
      itemKey,
      sourceId: `legacy_${legacyHash}`,
      findingId: null,
      sourceSite: siteMeta.sourceSite,
      sourceSiteLabel: siteMeta.sourceSiteLabel,
      channel: "argo-waitlist",
      channelLabel: `${siteMeta.channelLabel} (Legacy File)`,
      submittedAt: submittedIso,
      environment: "production",
      contact: {
        name: entry.name,
        email: normalizedEmail,
        phone: null,
        company: null,
      },
      tripDetails: {
        headline: "Mighty Argo Launch Alert Signup",
        datesOrMonth: entry.preferredMonth,
        partySize: entry.partySize,
        routeOrLocation: entry.source,
        messageOrNotes: null,
        pageOrSourceUrl: entry.source,
      },
      classification: cls.classification,
      classificationReason: cls.classificationReason,
      ...notif,
      triageStatus: "new",
      operatorNote: null,
      triageUpdatedAt: null,
      triageUpdatedBy: null,
    });
  }

  // Merge Cruise Promenade inquiries
  for (const cpItem of cpData.items) {
    if (!itemsByKey.has(cpItem.itemKey)) {
      itemsByKey.set(cpItem.itemKey, cpItem);
    }
  }

  // Join non-destructive operator triage overlays onto items
  const allItems: OperatorInboxItem[] = Array.from(itemsByKey.values()).map(
    (item) => {
      const overlay = dccData.triageByItemKey.get(item.itemKey);
      if (!overlay) return item;
      return {
        ...item,
        triageStatus: overlay.triageStatus,
        operatorNote: overlay.operatorNote,
        triageUpdatedAt: overlay.updatedAt,
        triageUpdatedBy: overlay.updatedBy,
      };
    },
  );

  // Sort newest first
  allItems.sort(
    (a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt),
  );

  // Compute global KPI summary across 100% of stored records
  let genuineTotalCount = 0;
  let genuineActionableCount = 0;
  let needsTriageCount = 0;
  let failedNotificationsCount = 0;
  let genuineFailedNotificationsCount = 0;
  let testProbesPreservedCount = 0;

  for (const item of allItems) {
    const isUndelivered =
      item.notificationStatus === "failed" ||
      item.notificationStatus === "not_configured";
    if (isUndelivered) {
      failedNotificationsCount += 1;
    }

    if (item.classification === "genuine") {
      genuineTotalCount += 1;
      if (item.triageStatus !== "archived" && item.triageStatus !== "resolved") {
        genuineActionableCount += 1;
      }
      if (item.triageStatus === "new") {
        needsTriageCount += 1;
      }
      if (isUndelivered) {
        genuineFailedNotificationsCount += 1;
      }
    } else {
      testProbesPreservedCount += 1;
    }
  }

  const connectedSourcesCount =
    (dccData.postgresConnected ? 1 : 0) + (cpData.status.connected ? 1 : 0);

  // Apply view + site + status filters
  const filteredItems = allItems.filter((item) => {
    if (view === "genuine" && item.classification !== "genuine") {
      return false;
    }
    if (
      view === "failed_notifications" &&
      item.notificationStatus !== "failed" &&
      item.notificationStatus !== "not_configured"
    ) {
      return false;
    }
    if (
      view === "needs_triage" &&
      (item.classification !== "genuine" ||
        (item.triageStatus !== "new" && item.triageStatus !== "in_review"))
    ) {
      return false;
    }
    if (view === "test" && item.classification !== "test") {
      return false;
    }

    if (
      siteFilter &&
      siteFilter !== "all" &&
      item.sourceSite.toLowerCase() !== siteFilter &&
      item.channel.toLowerCase() !== siteFilter
    ) {
      return false;
    }

    if (statusFilter && item.triageStatus !== statusFilter) {
      return false;
    }

    return true;
  });

  return {
    ok: true,
    generatedAt,
    appliedFilters: {
      view,
      site: siteFilter,
      status: statusFilter,
    },
    kpis: {
      totalStoredCount: allItems.length,
      genuineTotalCount,
      genuineActionableCount,
      needsTriageCount,
      failedNotificationsCount,
      genuineFailedNotificationsCount,
      testProbesPreservedCount,
      connectedSourcesCount,
      expectedSourcesCount: 2,
    },
    channelHealth: {
      resendConfigured,
      dccMxWarning: DCC_MX_WARNING,
      postgresConnected: dccData.postgresConnected,
      cpConnectorStatus: cpData.status,
      argoLegacyFileEntriesCount: argoLegacyEntries.length,
      checkedAt: generatedAt,
    },
    totalMatchingCount: filteredItems.length,
    items: filteredItems,
  };
}

export const getOperatorInboxSnapshot = getUnifiedOperatorInbox;
