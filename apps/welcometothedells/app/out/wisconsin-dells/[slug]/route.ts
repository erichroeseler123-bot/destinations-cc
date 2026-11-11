import { NextRequest, NextResponse } from "next/server";
import { resolveDellsRiverOutboundTarget } from "../../../../lib/riverOutbound";
import { stripEdgePiiQueryParams } from "../../../../../../lib/dcc/shared/edgeContextAndPii";

const SAFE_PASSTHROUGH_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "dcc_handoff_id",
  "click_id",
]);

const PROTECTED_TARGET_PARAMS = new Set([
  "pid",
  "mcid",
  "campaign",
  "label",
  "asn",
  "partner_id",
  "cmp",
]);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const target = resolveDellsRiverOutboundTarget(slug);
  if (!target) {
    return NextResponse.json(
      {
        ok: false,
        error: "unknown_outbound_slug",
        message: `No Wisconsin Dells outbound target is configured for '${slug}'.`,
      },
      { status: 404 },
    );
  }

  const incomingClean = new URL(request.url);
  stripEdgePiiQueryParams(incomingClean);

  const destination = new URL(target.targetUrl);
  for (const [key, value] of incomingClean.searchParams.entries()) {
    const lowerKey = key.trim().toLowerCase();
    if (!SAFE_PASSTHROUGH_PARAMS.has(lowerKey)) continue;
    if (PROTECTED_TARGET_PARAMS.has(lowerKey)) continue;
    if (target.provider === "viator" && lowerKey.startsWith("utm_")) continue;
    if (!destination.searchParams.has(key) && value.trim()) {
      destination.searchParams.set(key, value.trim());
    }
  }

  stripEdgePiiQueryParams(destination);

  return NextResponse.redirect(destination, {
    status: 302,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
