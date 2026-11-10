import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

function clean(value: string | null, max = 120) {
  return (value || "").trim().slice(0, max);
}

function slug(value: string | null) {
  return clean(value, 80).toLowerCase().replace(/[^a-z0-9-]/g, "");
}

export async function GET(request: Request) {
  const incoming = new URL(request.url);
  const target = new URL("https://cruisepromenade.com/api/dcc-handoff");

  const cruiseLine = clean(
    incoming.searchParams.get("cruise_line") || incoming.searchParams.get("cruiseLine"),
    120,
  );
  const ship = clean(incoming.searchParams.get("ship"), 120);
  const sailingDate = clean(
    incoming.searchParams.get("sailing_date") ||
      incoming.searchParams.get("sailingDate") ||
      incoming.searchParams.get("sailDate"),
    10,
  );
  const port = slug(incoming.searchParams.get("port"));
  const portDate = clean(
    incoming.searchParams.get("port_date") ||
      incoming.searchParams.get("portDate") ||
      incoming.searchParams.get("date"),
    10,
  );
  const partySize = clean(
    incoming.searchParams.get("party_size") || incoming.searchParams.get("partySize"),
    3,
  );
  const tourCode = clean(
    incoming.searchParams.get("tour_code") || incoming.searchParams.get("productCode"),
    40,
  );
  const mode = clean(
    incoming.searchParams.get("mode") || incoming.searchParams.get("flow"),
    32,
  );
  const existingHandoffId = clean(
    incoming.searchParams.get("dcc_handoff_id") ||
      incoming.searchParams.get("referral_id") ||
      incoming.searchParams.get("ref"),
    120,
  );
  const handoffId = existingHandoffId || `ho_${randomUUID()}`;

  if (cruiseLine) target.searchParams.set("cruise_line", cruiseLine);
  if (ship) target.searchParams.set("ship", ship);
  if (/^\d{4}-\d{2}-\d{2}$/.test(sailingDate)) target.searchParams.set("sailing_date", sailingDate);
  if (port) target.searchParams.set("port", port);
  if (/^\d{4}-\d{2}-\d{2}$/.test(portDate)) target.searchParams.set("port_date", portDate);
  if (/^\d{1,2}$/.test(partySize) && Number(partySize) >= 1) {
    target.searchParams.set("party_size", partySize);
  }
  if (tourCode) target.searchParams.set("tour_code", tourCode);
  if (mode === "import") target.searchParams.set("mode", "import");
  target.searchParams.set("dcc_handoff_id", handoffId);

  const response = NextResponse.redirect(target, 302);
  response.headers.set("x-dcc-handoff-id", handoffId);
  return response;
}
