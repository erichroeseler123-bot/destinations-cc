import { NextRequest, NextResponse } from "next/server";
import { decodeSuiteHandoffToken, verifySuiteHandoffToken } from "@/lib/dcc/network/networkHandoff";

export const dynamic = "force-dynamic";

const ALLOWED_DESTINATIONS: Record<string, string> = {
  colorado: "/transportation/colorado",
  co: "/transportation/colorado",
  "new-orleans": "/new-orleans",
  la: "/new-orleans",
  default: "/transportation",
};

export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const payload = params.get("dcc_handoff");
  const sig = params.get("dcc_sig");

  let decoded = null;
  let sigVerified = false;
  if (payload) {
    try {
      decoded = decodeSuiteHandoffToken(payload);
      sigVerified = verifySuiteHandoffToken(payload, sig);
    } catch {
      decoded = null;
    }
  }

  const stateOrKey = String(
    decoded?.context?.state ?? params.get("state") ?? params.get("market") ?? "default",
  )
    .trim()
    .toLowerCase();

  const targetPath = ALLOWED_DESTINATIONS[stateOrKey] ?? ALLOWED_DESTINATIONS.default;

  console.info(
    JSON.stringify({
      event: "dcc_inbound_partybusya_handoff_received",
      handoff_id: decoded?.handoffId ?? null,
      registry_handoff_id: decoded?.registryHandoffId ?? "dcc:handoff:partybusya-to-dcc",
      source_site_id: decoded?.sourceSiteId ?? "dcc:site:partybusya",
      source_page: decoded?.sourcePage ?? params.get("source_page") ?? null,
      signature_verified: sigVerified,
      target_path: targetPath,
      context: decoded?.context ?? {},
      received_at: new Date().toISOString(),
    }),
  );

  const dest = new URL(targetPath, request.url);
  dest.searchParams.set("handoff_from", "partybusya");
  if (decoded?.handoffId) {
    dest.searchParams.set("handoff_id", decoded.handoffId);
  }

  const response = NextResponse.redirect(dest, 307);
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
