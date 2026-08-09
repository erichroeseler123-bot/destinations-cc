import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import sitesRegistry from "@/data/network/sites.v1.json";
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

function isGovernedTarget(href: string) {
  const hostname = routeTargetFromHref(href);
  if (!hostname) return false;
  return sitesRegistry.sites.some((site) => site.domain.replace(/^www\./, "") === hostname);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const parsed = ClickPayloadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const { sessionId, siteName, href, sourceSlugs } = parsed.data;
  if (!isGovernedTarget(href)) return NextResponse.json({ ok: false, error: "ungoverned_target" }, { status: 400 });

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
