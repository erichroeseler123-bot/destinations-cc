import type { NextRequest } from "next/server";
import { getTelnyxConfig } from "@/lib/telnyx/config";

export type TelnyxInboundMessage = {
  eventType: string;
  messageId: string | null;
  from: string | null;
  to: string | null;
  text: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return null;
}

export function verifyTelnyxWebhookRequest(req: NextRequest): boolean {
  const secret = getTelnyxConfig().webhookSecret;
  if (!secret) return true;

  const token = req.nextUrl.searchParams.get("token");
  return token === secret;
}

export function parseTelnyxInboundEvent(payload: unknown): TelnyxInboundMessage | null {
  const root = asRecord(payload);
  if (!root) return null;

  const data = asRecord(root.data);
  const eventType = firstString(root.event_type, root.eventType, data?.event_type, data?.eventType) || "unknown";
  const eventPayload = asRecord(data?.payload) || data;

  const direction = firstString(eventPayload?.direction, root.direction);
  const fromObj = asRecord(eventPayload?.from);
  const toObj = asRecord(eventPayload?.to);
  const from = firstString(fromObj?.phone_number, fromObj?.number, eventPayload?.from, eventPayload?.source);
  const to = firstString(toObj?.phone_number, toObj?.number, eventPayload?.to, eventPayload?.destination);
  const text =
    firstString(eventPayload?.text, eventPayload?.body, eventPayload?.message, eventPayload?.content) || "";
  const messageId = firstString(eventPayload?.id, eventPayload?.message_id, data?.id, root.id);

  const inboundByType =
    eventType === "message.received" ||
    eventType === "message_received" ||
    eventType === "message.inbound";
  const inboundByDirection = direction === "inbound" || direction === "receive";

  if ((!inboundByType && !inboundByDirection) || !from || !text) {
    return null;
  }

  return {
    eventType,
    messageId,
    from,
    to,
    text,
  };
}
