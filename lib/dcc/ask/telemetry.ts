import { appendCorridorEventDurably } from "@/lib/dcc/telemetry/corridorEvents";

export const ASK_DCC_CORRIDOR_ID = "ask-dcc";

export function redactAskQuestion(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(/(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/g, "[redacted-phone]")
    .trim()
    .slice(0, 500);
}

export function normalizeAskSessionId(value: unknown) {
  if (typeof value !== "string") return null;
  const clean = value.trim().slice(0, 120);
  return /^[A-Za-z0-9._:-]+$/.test(clean) ? clean : null;
}

export async function recordAskDccEvent(input: {
  eventName: "destination_selected" | "recommendation_rendered" | "handoff_viewed" | "recommendation_clicked";
  sessionId: string | null;
  targetPath?: string | null;
  routeTarget?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await appendCorridorEventDurably({
      corridor_id: ASK_DCC_CORRIDOR_ID,
      event_name: input.eventName,
      session_id: input.sessionId || undefined,
      source_page: "/ask",
      target_path: input.targetPath || undefined,
      route_target: input.routeTarget || undefined,
      metadata: {
        surface: "ask_dcc",
        ...input.metadata,
      },
    });
  } catch (error) {
    console.error("Ask DCC telemetry write failed", error);
  }
}
