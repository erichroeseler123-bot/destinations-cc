import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

function clean(value: string | null, max = 120) {
  return (value || "").trim().slice(0, max);
}

function slug(value: string | null) {
  return clean(value, 80).toLowerCase().replace(/[^a-z0-9-]/g, "");
}

function resolveLfseDestination(portSlug: string): string {
  if (portSlug.startsWith("juneau")) return "https://www.lastfrontiershoreexcursions.com/ports/juneau";
  if (portSlug.startsWith("skagway")) return "https://www.lastfrontiershoreexcursions.com/ports/skagway";
  if (portSlug.startsWith("ketchikan")) return "https://www.lastfrontiershoreexcursions.com/ports/ketchikan";
  if (portSlug.startsWith("sitka")) return "https://www.lastfrontiershoreexcursions.com/ports/sitka";
  if (portSlug.startsWith("icy-strait")) return "https://www.lastfrontiershoreexcursions.com/ports/icy-strait-point";
  return "https://www.lastfrontiershoreexcursions.com/tours";
}

export async function GET(request: Request) {
  const incoming = new URL(request.url);
  const port = slug(incoming.searchParams.get("port"));
  const target = new URL(resolveLfseDestination(port));

  const date = clean(incoming.searchParams.get("date") || incoming.searchParams.get("port_date"), 10);
  const partySize = clean(
    incoming.searchParams.get("party_size") ||
      incoming.searchParams.get("passengers") ||
      incoming.searchParams.get("travelers"),
    3,
  );
  const ship = clean(incoming.searchParams.get("cruise_ship") || incoming.searchParams.get("ship"), 120);
  const timeWindow = clean(incoming.searchParams.get("time_window") || incoming.searchParams.get("available_time"), 80);
  const activity = slug(incoming.searchParams.get("activity") || incoming.searchParams.get("interest"));
  const budgetBand = slug(incoming.searchParams.get("budget_band"));
  const shipArrivalTime = clean(
    incoming.searchParams.get("shipArrivalTime") ||
      incoming.searchParams.get("arrival_time") ||
      incoming.searchParams.get("arrival"),
    24,
  );
  const allAboardTime = clean(
    incoming.searchParams.get("allAboardTime") ||
      incoming.searchParams.get("departure_time") ||
      incoming.searchParams.get("allAboard"),
    24,
  );
  const handoffId = clean(incoming.searchParams.get("dcc_handoff_id"), 120) || `ho_${randomUUID()}`;
  const clickId =
    clean(incoming.searchParams.get("click_id"), 120) ||
    `clk_${handoffId.replace(/^ho_/, "").replace(/-/g, "").slice(0, 24)}`;

  if (port) target.searchParams.set("port", port);
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    target.searchParams.set("date", date);
    target.searchParams.set("port_date", date);
  }
  if (/^\d{1,2}$/.test(partySize)) {
    target.searchParams.set("party_size", partySize);
  }
  if (ship) {
    target.searchParams.set("cruise_ship", ship);
    target.searchParams.set("ship", ship);
  }
  if (timeWindow) target.searchParams.set("time_window", timeWindow);
  if (activity) target.searchParams.set("activity", activity);
  if (budgetBand) target.searchParams.set("budget_band", budgetBand);
  if (shipArrivalTime) target.searchParams.set("shipArrivalTime", shipArrivalTime);
  if (allAboardTime) target.searchParams.set("allAboardTime", allAboardTime);
  target.searchParams.set("dcc_handoff_id", handoffId);
  target.searchParams.set("click_id", clickId);
  target.searchParams.set("utm_source", "cruisepromenade.com");
  target.searchParams.set("utm_medium", "referral");
  target.searchParams.set("utm_campaign", "dcc_network_handoff");

  return NextResponse.redirect(target, 302);
}
