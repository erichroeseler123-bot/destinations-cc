import { NextResponse } from "next/server";

function clean(value: string | null, max = 120) {
  return (value || "").trim().slice(0, max);
}

function slug(value: string | null) {
  return clean(value, 80).toLowerCase().replace(/[^a-z0-9-]/g, "");
}

export async function GET(request: Request) {
  const incoming = new URL(request.url);
  const interest = slug(incoming.searchParams.get("interest"));
  const ship = clean(incoming.searchParams.get("ship"), 120);
  const portDate = clean(incoming.searchParams.get("port_date"), 10);
  const partySize = clean(incoming.searchParams.get("party_size"), 3);
  const handoffId = clean(incoming.searchParams.get("dcc_handoff_id"), 120);

  const path = interest.includes("whale") ? "/juneau-whale-watching-tours" : interest.includes("helicopter") || interest.includes("flight") ? "/helicopter" : "/juneau";
  const target = new URL(path, incoming.origin);

  if (ship) target.searchParams.set("ship", ship);
  if (/^\d{4}-\d{2}-\d{2}$/.test(portDate)) target.searchParams.set("port_date", portDate);
  if (/^\d{1,2}$/.test(partySize)) target.searchParams.set("party_size", partySize);
  if (handoffId) target.searchParams.set("dcc_handoff_id", handoffId);
  target.searchParams.set("utm_source", "destinationcommandcenter.com");
  target.searchParams.set("utm_medium", "referral");
  target.searchParams.set("utm_campaign", "dcc_network_handoff");

  return NextResponse.redirect(target, 302);
}
