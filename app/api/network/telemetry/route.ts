import { NextRequest, NextResponse } from "next/server";
import { appendCorridorEventDurably } from "@/lib/dcc/telemetry/corridorEvents";

const ALLOWED_SITES = new Set([
  "cruise-promenade",
  "vibing-around",
  "gosno",
  "last-frontier",
  "juneau-flight-deck",
  "party-at-red-rocks",
  "welcome-to-the-swamp",
  "welcome-to-the-dells",
  "french-quarter-orientation",
  "shuttleya",
  "420-airport-pickup",
  "save-on-the-strip",
]);

function clean(value: unknown, max = 180) {
  return typeof value === "string" ? value.trim().slice(0, max) : undefined;
}

function cleanObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();
    if (raw.length > 16000) return NextResponse.json({ ok: false }, { status: 413 });
    const body = JSON.parse(raw || "{}");
    const site = clean(body.site, 64);
    const eventName = clean(body.eventName, 64);
    const sessionId = clean(body.sessionId, 96);
    if (!site || !ALLOWED_SITES.has(site) || !eventName || !sessionId) {
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const mapped = eventName.includes("booking") || eventName.includes("checkout")
      ? "booking_opened"
      : eventName.includes("recommend") || eventName.includes("match") || eventName.includes("route")
        ? "recommendation_rendered"
        : eventName.includes("click") || eventName.includes("handoff")
          ? "cta_clicked_primary"
          : "page_viewed";

    const context = cleanObject(body.context);
    const outcome = cleanObject(body.outcome);

    const stored = await appendCorridorEventDurably({
      corridor_id: "portfolio-network",
      event_name: mapped,
      session_id: sessionId,
      source_page: clean(body.sourcePage),
      landing_path: clean(body.landingPath),
      target_path: clean(body.targetPath),
      metadata: {
        surface: "portfolio-network",
        site,
        original_event_name: eventName,
        context,
        outcome,
      },
    });

    return NextResponse.json({ ok: stored.ok });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }
}
