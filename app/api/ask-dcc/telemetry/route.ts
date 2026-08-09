import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { normalizeAskSessionId, recordAskDccEvent } from "@/lib/dcc/ask/telemetry";

export const runtime = "nodejs";

const ClickPayloadSchema = z.object({
  sessionId: z.string().max(120).optional(),
  siteName: z.string().min(1).max(120),
  href: z.string().url().max(1500),
  sourceSlugs: z.array(z.string().max(180)).max(8).optional(),
});

function routeTargetFromHref(href: string) {
  try { return new URL(href).hostname.replace(/^www\./, ""); } catch { return null; }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const parsed = ClickPayloadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const { sessionId, siteName, href, sourceSlugs } = parsed.data;
  await recordAskDccEvent({
    eventName: "recommendation_clicked",
    sessionId: normalizeAskSessionId(sessionId),
    targetPath: href,
    routeTarget: routeTargetFromHref(href),
    metadata: {
      ask_stage: "handoff_clicked",
      handoff_site: siteName,
      source_slugs: sourceSlugs || [],
    },
  });

  return NextResponse.json({ ok: true });
}
