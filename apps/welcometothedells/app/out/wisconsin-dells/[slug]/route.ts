import { NextRequest, NextResponse } from "next/server";
import { resolveDellsRiverOutboundTarget } from "../../../../lib/riverOutbound";
import { stripEdgePiiQueryParams } from "../../../../../../lib/dcc/shared/edgeContextAndPii";
import { resolveDccIngestBaseUrl } from "../../../../../../lib/dcc/shared/envCompat";

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

export function getDccIngestOrigin(): string {
  return resolveDccIngestBaseUrl();
}

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

  let recordedHandoffId: string | null = null;
  try {
    const targetUrl = destination.toString();
    const handoffEndpoint = `${getDccIngestOrigin()}/go/out?mode=json&url=${encodeURIComponent(
      targetUrl,
    )}&source_site=welcometothedells.com&corridor=wisconsin-dells-river-ops`;
    const res = await fetch(handoffEndpoint, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(1200),
    });
    const headerHandoffId = res.headers.get("x-dcc-handoff-id")?.trim() || "";
    if (headerHandoffId) {
      recordedHandoffId = headerHandoffId;
    } else if (res.ok) {
      const payload = (await res.json().catch(() => null)) as
        | { handoff?: { handoffId?: string } }
        | null;
      if (payload?.handoff?.handoffId) {
        recordedHandoffId = String(payload.handoff.handoffId).trim();
      }
    }
  } catch {
    // Fail-open: never block traveler redirect if DCC ingest is unreachable or times out.
  }

  const redirectHeaders: Record<string, string> = {
    "Cache-Control": "no-store, max-age=0",
    "X-Robots-Tag": "noindex, nofollow",
  };
  if (recordedHandoffId) {
    redirectHeaders["X-DCC-Handoff-Id"] = recordedHandoffId;
  }

  return NextResponse.redirect(destination, {
    status: 302,
    headers: redirectHeaders,
  });
}
