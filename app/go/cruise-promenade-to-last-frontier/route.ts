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
  const target = new URL("https://lastfrontiershoreexcursions.com/api/dcc-handoff");
  const port = slug(incoming.searchParams.get("port"));
  const ship = clean(incoming.searchParams.get("ship"), 120);
  const portDate = clean(incoming.searchParams.get("port_date"), 10);
  const partySize = clean(incoming.searchParams.get("party_size"), 3);

  if (port) target.searchParams.set("port", port);
  if (ship) target.searchParams.set("ship", ship);
  if (/^\d{4}-\d{2}-\d{2}$/.test(portDate)) target.searchParams.set("port_date", portDate);
  if (/^\d{1,2}$/.test(partySize)) target.searchParams.set("party_size", partySize);
  target.searchParams.set("dcc_handoff_id", `ho_${randomUUID()}`);

  return NextResponse.redirect(target, 302);
}
