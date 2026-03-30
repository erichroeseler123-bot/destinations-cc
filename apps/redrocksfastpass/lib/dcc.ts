export type RedRocksFastPassEventType =
  | "handoff_viewed"
  | "lead_captured"
  | "booking_started"
  | "booking_completed"
  | "booking_failed"
  | "booking_cancelled"
  | "status_updated"
  | "traveler_returned"
  | "inventory_low"
  | "inventory_unavailable"
  | "response_degraded"
  | "booking_failure_rate_high"
  | "temporarily_paused"
  | "forwarded_to_partner"
  | "accepted_from_partner"
  | "partner_booking_completed"
  | "partner_booking_failed";

export type RedRocksFastPassPayload = {
  handoffId: string;
  satelliteId: "redrocksfastpass";
  eventType: RedRocksFastPassEventType;
  occurredAt?: string;
  source?: string;
  sourcePath?: string;
  externalReference?: string;
  status?: string;
  stage?: string;
  message?: string;
  attribution?: {
    sourceSlug?: string;
    sourcePage?: string;
    topicSlug?: string;
  };
  traveler?: {
    email?: string;
    phone?: string;
    name?: string;
    partySize?: number;
  };
  booking?: {
    citySlug?: string;
    venueSlug?: string;
    productSlug?: string;
    eventDate?: string;
    quantity?: number;
    currency?: string;
    amount?: number;
  };
  partner?: {
    fromSite?: string;
    toSite?: string;
    partnerHandoffId?: string;
    reason?: string;
  };
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

export const DCC_CALLBACK_ENDPOINT =
  "https://www.destinationcommandcenter.com/api/internal/satellite-handoffs/events";

const DCC_BASE_URL = "https://www.destinationcommandcenter.com";

export function buildDccReturnUrl(path: string, handoffId: string) {
  const url = new URL(path, DCC_BASE_URL);
  url.searchParams.set("dcc_handoff_id", handoffId);
  return url.toString();
}

export function getHandoffIdFromSearchParams(searchParams?: URLSearchParams) {
  return searchParams?.get("dcc_handoff_id") || searchParams?.get("handoffId") || null;
}

export function getOrCreateHandoffId(value?: string | null) {
  const next = String(value || "").trim();
  return next || `rrfp_${Date.now()}`;
}

export async function emitDccEvent(payload: RedRocksFastPassPayload) {
  const token = process.env.DCC_REDROCKSFASTPASS_WEBHOOK_TOKEN;
  if (!token) {
    return { ok: false, skipped: true, reason: "missing_token" as const };
  }

  const response = await fetch(DCC_CALLBACK_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-dcc-satellite-token": token,
    },
    body: JSON.stringify({
      ...payload,
      occurredAt: payload.occurredAt || new Date().toISOString(),
    }),
    cache: "no-store",
  });

  return {
    ok: response.ok,
    skipped: false,
    status: response.status,
    body: await response.text(),
  };
}
