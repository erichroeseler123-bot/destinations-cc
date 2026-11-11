/**
 * Zero-Neon-dependency Specialist Inquiry & Safe Resend Delivery Client.
 * Uses pure Web `fetch` so specialist sub-apps (`juneauflightdeck`,
 * `last-frontier-shore-excursions`, `welcometothedells`, `saveonthestrip`, etc.)
 * forward inquiries durably into DCC's `/api/internal/specialist-inquiries`
 * without importing `@neondatabase/serverless` or Node filesystem stores.
 */

import {
  resolveDccIngestEndpointUrl,
  resolveDccInternalSecret,
  type EnvRecord,
} from "./envCompat";

export type SpecialistNotificationStatus =
  | "sent"
  | "not_configured"
  | "failed"
  | "suppressed_test";

export type SpecialistInquiryChannel =
  | "juneauflightdeck-inquiry"
  | "welcometoneworleanstours-inquiry"
  | "lastfrontiershoreexcursions-inquiry"
  | "welcometothedells-inquiry"
  | "saveonthestrip-help-request"
  | "welcometotheswamp-inquiry"
  | "gosno-dispatch"
  | "parr-inquiry";

export interface SafeResendEmailParams {
  apiKey?: string | null;
  from?: string | null;
  to?: string | string[] | null;
  replyTo?: string | null;
  subject: string;
  html: string;
  text?: string;
  suppressForTest?: boolean;
  fetchImpl?: typeof fetch;
}

export interface SafeResendDeliveryResult {
  emailSent: boolean;
  emailReason: string | null;
  notificationStatus: SpecialistNotificationStatus;
  emailProviderId: string | null;
}

export function escapeHtml(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeRecipientList(to: string | string[] | null | undefined): string[] {
  if (!to) return [];
  const rawList = Array.isArray(to) ? to : to.split(",");
  return rawList.map((item) => item.trim()).filter((item) => item.length > 0);
}

/**
 * Dispatches an optional Resend email notification safely:
 * - Never sends email when `suppressForTest` is true (`notificationStatus: "suppressed_test"`).
 * - Reports `notificationStatus: "not_configured"` when `RESEND_API_KEY`, `from`, or `to` is missing.
 * - Reports `notificationStatus: "sent"` with `emailProviderId` on HTTP 2xx.
 * - Reports `notificationStatus: "failed"` with `emailReason` on HTTP/network error without throwing.
 */
export async function sendResendEmailSafe(
  params: SafeResendEmailParams,
): Promise<SafeResendDeliveryResult> {
  if (params.suppressForTest) {
    return {
      emailSent: false,
      emailReason: "suppressed_test_submission",
      notificationStatus: "suppressed_test",
      emailProviderId: null,
    };
  }

  const apiKey = (params.apiKey ?? process.env.RESEND_API_KEY ?? "").trim();
  const from = (params.from ?? "").trim();
  const recipients = normalizeRecipientList(params.to);

  if (!apiKey || !from || recipients.length === 0) {
    return {
      emailSent: false,
      emailReason: "missing_email_config",
      notificationStatus: "not_configured",
      emailProviderId: null,
    };
  }

  const fetchFn = params.fetchImpl ?? fetch;
  try {
    const res = await fetchFn("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: recipients,
        ...(params.replyTo?.trim() ? { reply_to: params.replyTo.trim() } : {}),
        subject: params.subject,
        html: params.html,
        ...(params.text ? { text: params.text } : {}),
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return {
        emailSent: false,
        emailReason: `resend_http_${res.status}${errText ? `:${errText.slice(0, 140)}` : ""}`,
        notificationStatus: "failed",
        emailProviderId: null,
      };
    }

    const body = (await res.json().catch(() => ({}))) as { id?: string };
    return {
      emailSent: true,
      emailReason: null,
      notificationStatus: "sent",
      emailProviderId: typeof body.id === "string" ? body.id : null,
    };
  } catch (err) {
    return {
      emailSent: false,
      emailReason:
        err instanceof Error
          ? `resend_exception:${err.message.slice(0, 140)}`
          : "resend_network_error",
      notificationStatus: "failed",
      emailProviderId: null,
    };
  }
}

export interface SpecialistInquiryForwardPayload {
  channel: SpecialistInquiryChannel;
  submissionId?: string;
  handoffId?: string | null;
  sourceSite?: string | null;
  specialistSite?: string | null;
  name?: string | null;
  email: string;
  phone?: string | null;
  shipName?: string | null;
  cruiseLine?: string | null;
  portDate?: string | null;
  travelDate?: string | null;
  dates?: string | null;
  partySize?: number | string | null;
  groupSize?: number | string | null;
  tourType?: string | null;
  tourInterest?: string | null;
  bookingMode?: string | null;
  notes?: string | null;
  message?: string | null;
  sourcePage?: string | null;
  sourcePath?: string | null;
  intendedDestination?: string | null;
  isTest?: boolean;
  attribution?: Record<string, unknown> | null;
  emailSent?: boolean;
  emailReason?: string | null;
  notificationStatus?: SpecialistNotificationStatus;
  emailProviderId?: string | null;
  metadata?: Record<string, unknown>;
  extraMetadata?: Record<string, unknown>;
}

export interface ForwardSpecialistInquiryOptions {
  env?: EnvRecord;
  endpointUrl?: string;
  secret?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export interface ForwardSpecialistInquiryResult {
  ok: boolean;
  status: number;
  submissionId?: string;
  findingId?: string;
  classification?: string;
  error?: string;
}

/**
 * Forwards a specialist inquiry to `${baseUrl}/api/internal/specialist-inquiries`
 * with standardized internal authentication headers (`x-dcc-internal-secret`,
 * `x-internal-secret`, and `Authorization: Bearer <secret>`), plus Resend
 * delivery metadata (`emailSent`, `emailReason`, `notificationStatus`, `emailProviderId`).
 */
export async function forwardSpecialistInquiryToDcc(
  payload: SpecialistInquiryForwardPayload,
  options: ForwardSpecialistInquiryOptions = {},
): Promise<ForwardSpecialistInquiryResult> {
  const env = options.env ?? process.env;
  const endpointUrl = options.endpointUrl || resolveDccIngestEndpointUrl(env);
  const secret = (options.secret ?? resolveDccInternalSecret(env)).trim();
  const fetchFn = options.fetchImpl ?? fetch;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (secret) {
    headers["x-dcc-internal-secret"] = secret;
    headers["x-internal-secret"] = secret;
    headers["Authorization"] = `Bearer ${secret}`;
  }

  const vercelBypass = (
    env.DCC_VERCEL_AUTOMATION_BYPASS_SECRET ||
    env.VERCEL_AUTOMATION_BYPASS_SECRET ||
    ""
  ).trim();
  if (vercelBypass && /\.vercel\.app(?:\/|$)/i.test(endpointUrl)) {
    headers["x-vercel-protection-bypass"] = vercelBypass;
  }

  const notificationStatus: SpecialistNotificationStatus =
    payload.notificationStatus ??
    (payload.isTest
      ? "suppressed_test"
      : payload.emailSent === true
        ? "sent"
        : "not_configured");

  const bodyPayload: Record<string, unknown> = {
    ...(payload.metadata || {}),
    ...(payload.extraMetadata || {}),
    channel: payload.channel,
    ...(payload.submissionId ? { submissionId: payload.submissionId } : {}),
    ...(payload.handoffId ? { handoffId: payload.handoffId } : {}),
    ...(payload.sourceSite || payload.specialistSite
      ? { sourceSite: payload.sourceSite ?? payload.specialistSite }
      : {}),
    name: payload.name ?? null,
    email: payload.email,
    phone: payload.phone ?? null,
    shipName: payload.shipName ?? null,
    cruiseLine: payload.cruiseLine ?? null,
    portDate: payload.portDate ?? payload.travelDate ?? null,
    dates: payload.dates ?? payload.travelDate ?? payload.portDate ?? null,
    partySize: payload.partySize ?? payload.groupSize ?? null,
    groupSize: payload.groupSize ?? payload.partySize ?? null,
    tourType: payload.tourType ?? payload.tourInterest ?? null,
    ...(payload.tourInterest ? { tourInterest: payload.tourInterest } : {}),
    ...(payload.travelDate ? { travelDate: payload.travelDate } : {}),
    bookingMode: payload.bookingMode ?? null,
    notes: payload.notes ?? payload.message ?? null,
    message: payload.message ?? payload.notes ?? null,
    sourcePage: payload.sourcePage ?? payload.sourcePath ?? null,
    sourcePath: payload.sourcePath ?? payload.sourcePage ?? null,
    ...(payload.intendedDestination
      ? { intendedDestination: payload.intendedDestination }
      : {}),
    isTest: Boolean(payload.isTest),
    attribution: payload.attribution ?? undefined,
    emailSent: Boolean(payload.emailSent),
    emailReason: payload.emailReason ?? null,
    notificationStatus,
    emailProviderId: payload.emailProviderId ?? null,
  };

  const controller =
    typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId =
    controller && (options.timeoutMs ?? 8000) > 0
      ? setTimeout(() => controller.abort(), options.timeoutMs ?? 8000)
      : null;

  try {
    const res = await fetchFn(endpointUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(bodyPayload),
      cache: "no-store",
      ...(controller ? { signal: controller.signal } : {}),
    });

    const parsed = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      submissionId?: string;
      findingId?: string;
      classification?: string;
      error?: string;
    };

    if (!res.ok || parsed.ok === false) {
      return {
        ok: false,
        status: res.status,
        error: parsed.error || `DCC specialist ingest returned HTTP ${res.status}.`,
      };
    }

    return {
      ok: true,
      status: res.status,
      submissionId: parsed.submissionId,
      findingId: parsed.findingId,
      classification: parsed.classification,
    };
  } catch (err) {
    return {
      ok: false,
      status: 503,
      error:
        err instanceof Error
          ? err.message
          : "Failed to reach DCC specialist inquiry ingest.",
    };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
