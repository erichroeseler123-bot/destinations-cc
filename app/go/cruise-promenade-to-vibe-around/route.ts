import { NextRequest, NextResponse } from "next/server";
import { buildSuiteHandoffToken } from "@/lib/dcc/network/networkHandoff";

const DESTINATION = "https://vibearoundtown.com/handoff/dcc";

export function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams;
  const allowed = [
    "ship",
    "ship_slug",
    "sailing_date",
    "port",
    "port_date",
    "arrival_time",
    "departure_time",
    "party_size",
    "island",
  ];
  const context: Record<string, string> = {};
  for (const key of allowed) {
    const value = input.get(key)?.trim();
    if (value) context[key] = value;
  }

  const issued = buildSuiteHandoffToken({
    registryHandoffId: "dcc:handoff:cruise-promenade-to-vibe-around",
    sourceSiteId: "dcc:site:cruise-promenade",
    destinationSiteId: "dcc:site:vibe-around-town",
    intentId: "dcc:intent:private-cruise-port-driver",
    sourcePage: input.get("source_page") || undefined,
    context,
  });

  const destination = new URL(DESTINATION);
  destination.searchParams.set("dcc_handoff", issued.payload);
  if (issued.signature) destination.searchParams.set("dcc_sig", issued.signature);
  return NextResponse.redirect(destination, 307);
}
