import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

const ALLOWED_GOSNO_DESTINATIONS = new Set([
  "breckenridge",
  "vail",
  "beaver-creek",
  "keystone",
  "copper",
  "copper-mountain",
  "winter-park",
  "aspen",
  "snowmass",
  "steamboat",
  "steamboat-springs",
  "big-sky",
]);

function clean(value: string | null, max = 120) {
  return (value || "").trim().slice(0, max);
}

function slug(value: string | null) {
  return clean(value, 64).toLowerCase().replace(/[^a-z0-9-]/g, "");
}

export async function GET(request: Request) {
  const incoming = new URL(request.url);
  const destination = slug(incoming.searchParams.get("destination"));

  // DCC is coordinate intelligence, not a generic travel referral funnel.
  // A GoSno handoff must represent an explicit supported mountain-transfer
  // destination; stale city-guide URLs must never create unrelated handoffs.
  if (!destination || !ALLOWED_GOSNO_DESTINATIONS.has(destination)) {
    return NextResponse.json(
      {
        ok: false,
        error: "A supported GoSno destination is required for this handoff.",
      },
      {
        status: 400,
        headers: {
          "cache-control": "public, max-age=300",
          "x-robots-tag": "noindex, nofollow",
        },
      },
    );
  }

  const target = new URL("https://gosno.co/handoff/dcc");
  const airport = clean(incoming.searchParams.get("airport"), 12).toUpperCase();
  const date = clean(incoming.searchParams.get("date"), 10);
  const partySize = clean(incoming.searchParams.get("party_size"), 3);
  const vehicleType = slug(incoming.searchParams.get("vehicle_type"));
  const rawSourcePage = clean(incoming.searchParams.get("source_page"), 240);
  const sourcePage = rawSourcePage.startsWith("/location/") ? rawSourcePage : "/go/dcc-to-gosno";

  target.searchParams.set("destination", destination);
  if (airport) target.searchParams.set("airport", airport);
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) target.searchParams.set("date", date);
  if (/^\d{1,2}$/.test(partySize)) target.searchParams.set("party_size", partySize);
  if (vehicleType) target.searchParams.set("vehicle_type", vehicleType);

  target.searchParams.set("dcc_handoff_id", `ho_${randomUUID()}`);
  target.searchParams.set("source_page", sourcePage);

  return NextResponse.redirect(target, 302);
}
