import { NextResponse } from "next/server";

function clean(value: string | null, max = 120) {
  return (value || "").trim().slice(0, max);
}

function slug(value: string | null) {
  return clean(value, 80).toLowerCase().replace(/[^a-z0-9-]/g, "");
}

export async function GET(request: Request) {
  const incoming = new URL(request.url);
  const interest = slug(
    incoming.searchParams.get("interest") ||
      incoming.searchParams.get("topic") ||
      incoming.searchParams.get("activity"),
  );
  const ship = clean(incoming.searchParams.get("ship") || incoming.searchParams.get("cruise_ship"), 120);
  const portDate = clean(incoming.searchParams.get("port_date") || incoming.searchParams.get("date"), 10);
  const partySize = clean(
    incoming.searchParams.get("party_size") ||
      incoming.searchParams.get("passengers") ||
      incoming.searchParams.get("travelers"),
    3,
  );
  const timeWindow = clean(incoming.searchParams.get("time_window") || incoming.searchParams.get("available_time"), 80);
  const budgetBand = slug(incoming.searchParams.get("budget_band"));
  const handoffId = clean(incoming.searchParams.get("dcc_handoff_id"), 120);
  const clickId = clean(incoming.searchParams.get("click_id"), 120);

  const path = interest.includes("whale")
    ? "/juneau-whale-watching-tours"
    : interest.includes("helicopter") || interest.includes("flight")
      ? "/helicopter"
      : "/juneau";
  const target = new URL(path, incoming.origin);

  if (ship) {
    target.searchParams.set("ship", ship);
    target.searchParams.set("cruise_ship", ship);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(portDate)) {
    target.searchParams.set("port_date", portDate);
    target.searchParams.set("date", portDate);
  }
  if (/^\d{1,2}$/.test(partySize)) {
    target.searchParams.set("party_size", partySize);
  }
  if (timeWindow) target.searchParams.set("time_window", timeWindow);
  if (budgetBand) target.searchParams.set("budget_band", budgetBand);
  if (handoffId) target.searchParams.set("dcc_handoff_id", handoffId);
  if (clickId) target.searchParams.set("click_id", clickId);
  target.searchParams.set("utm_source", "destinationcommandcenter.com");
  target.searchParams.set("utm_medium", "referral");
  target.searchParams.set("utm_campaign", "dcc_network_handoff");

  const response = NextResponse.redirect(target, 302);
  response.cookies.set(
    "jfd_dcc_context",
    JSON.stringify({
      ship: ship || null,
      portDate: portDate || null,
      partySize: partySize || null,
      timeWindow: timeWindow || null,
      budgetBand: budgetBand || null,
      interest: interest || null,
      handoffId: handoffId || null,
      clickId: clickId || null,
    }),
    {
      path: "/",
      maxAge: 60 * 60 * 24,
      sameSite: "lax",
    },
  );
  return response;
}
