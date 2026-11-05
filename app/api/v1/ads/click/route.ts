import { NextResponse } from "next/server";
import {
  getOpaqueClickAttributionById,
  recordOutboundClickFollow,
} from "@/lib/dcc/commerce/opaqueAttributionLedger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const clickId = url.searchParams.get("clickId")?.trim() || "";
  const isTestParam = url.searchParams.get("isTest") === "true";

  if (!clickId) {
    return NextResponse.json(
      { ok: false, error: "MISSING_CLICK_ID" },
      { status: 400 },
    );
  }

  const userAgent = request.headers.get("user-agent");
  const referer = request.headers.get("referer");

  const updated =
    recordOutboundClickFollow(clickId, {
      userAgent,
      referer,
      isTest: isTestParam,
    }) ?? getOpaqueClickAttributionById(clickId);

  if (!updated || !updated.outboundPartnerUrl) {
    return NextResponse.json(
      { ok: false, error: "CLICK_ATTRIBUTION_NOT_FOUND", clickId },
      { status: 404 },
    );
  }

  return NextResponse.redirect(updated.outboundPartnerUrl, 302);
}
