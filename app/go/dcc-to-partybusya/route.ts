import { NextRequest, NextResponse } from "next/server";
import { buildSuiteHandoffToken } from "@/lib/dcc/network/networkHandoff";

const DESTINATION = "https://partybusya.com/handoff/dcc";

export function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams;
  const allowed = [
    "destination",
    "city",
    "state",
    "party_size",
    "occasion",
    "venue_slug",
    "event_date",
  ];
  const context: Record<string, string> = {};
  for (const key of allowed) {
    const value = input.get(key)?.trim();
    if (value) context[key] = value;
  }

  const sourcePage = input.get("source_page")?.trim() || "/transportation";

  const issued = buildSuiteHandoffToken({
    registryHandoffId: "dcc:handoff:dcc-to-partybusya",
    sourceSiteId: "dcc:site:destination-command-center",
    destinationSiteId: "dcc:site:partybusya",
    intentId: "dcc:intent:party-bus-group-charter",
    sourcePage,
    context,
  });

  console.info(
    JSON.stringify({
      event: "dcc_outbound_partybusya_handoff_issued",
      handoff_id: issued.token.handoffId,
      registry_handoff_id: issued.token.registryHandoffId,
      source_page: sourcePage,
      context: issued.token.context,
      created_at: issued.token.createdAt,
    }),
  );

  const destination = new URL(DESTINATION);
  destination.searchParams.set("src", "dcc");
  destination.searchParams.set("utm_source", "dcc");
  destination.searchParams.set("utm_medium", "suite_handoff");
  destination.searchParams.set("utm_campaign", "dcc_to_partybusya");
  destination.searchParams.set("dcc_handoff", issued.payload);
  if (issued.signature) {
    destination.searchParams.set("dcc_sig", issued.signature);
  }

  const response = NextResponse.redirect(destination, 307);
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
