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
  const portDate = clean(incoming.searchParams.get("date") || incoming.searchParams.get("port_date"), 10);
  const interest = slug(
    incoming.searchParams.get("interest") ||
      incoming.searchParams.get("topic") ||
      incoming.searchParams.get("activity"),
  );
  const partySize = clean(
    incoming.searchParams.get("party_size") ||
      incoming.searchParams.get("passengers") ||
      incoming.searchParams.get("travelers"),
    3,
  );
  const ship = clean(incoming.searchParams.get("ship") || incoming.searchParams.get("cruise_ship"), 120);
  const timeWindow = clean(incoming.searchParams.get("time_window") || incoming.searchParams.get("available_time"), 80);
  const budgetBand = slug(incoming.searchParams.get("budget_band"));
  const berth = clean(incoming.searchParams.get("berth") || incoming.searchParams.get("dock"), 16);
  const claaArrival = clean(incoming.searchParams.get("claa_arrival") || incoming.searchParams.get("arrival"), 10);
  const allAboard = clean(incoming.searchParams.get("all_aboard") || incoming.searchParams.get("allAboard"), 10);
  const optionId = slug(incoming.searchParams.get("option_id"));
  const flightCanceled = clean(incoming.searchParams.get("flight_canceled"), 10);
  const cancelRef = clean(incoming.searchParams.get("cancel_ref"), 80);
  const ctx = clean(incoming.searchParams.get("ctx") || incoming.searchParams.get("dcc_ctx"), 80);
  const lowBw = clean(incoming.searchParams.get("low_bw"), 5);
  const handoffId = clean(incoming.searchParams.get("dcc_handoff_id"), 120) || `ho_${randomUUID()}`;
  const clickId =
    clean(incoming.searchParams.get("click_id"), 120) ||
    `clk_${handoffId.replace(/^ho_/, "").replace(/-/g, "").slice(0, 24)}`;

  const path =
    interest === "dogsled"
      ? "/juneau-dogsled-helicopter-tours"
      : interest === "compare-operators"
        ? "/temsco-vs-coastal-vs-northstar-juneau"
        : interest === "weather-backup"
          ? "/juneau/what-to-do-if-helicopter-tour-canceled"
          : interest === "whale-watching" || interest === "whale-deck"
            ? "/juneau-whale-watching-tours"
            : "/helicopter";

  const target = new URL(`https://juneauflightdeck.com${path}`);
  if (/^\d{4}-\d{2}-\d{2}$/.test(portDate)) {
    target.searchParams.set("date", portDate);
    target.searchParams.set("port_date", portDate);
  }
  if (/^\d{1,2}$/.test(partySize)) {
    target.searchParams.set("party_size", partySize);
  }
  if (ship) {
    target.searchParams.set("ship", ship);
    target.searchParams.set("cruise_ship", ship);
  }
  if (berth) target.searchParams.set("berth", berth);
  if (/^\d{1,2}:\d{2}$/.test(claaArrival)) target.searchParams.set("claa_arrival", claaArrival);
  if (/^\d{1,2}:\d{2}$/.test(allAboard)) target.searchParams.set("all_aboard", allAboard);
  if (timeWindow) target.searchParams.set("time_window", timeWindow);
  if (budgetBand) target.searchParams.set("budget_band", budgetBand);
  if (interest) target.searchParams.set("interest", interest);
  if (optionId) target.searchParams.set("option_id", optionId);
  if (flightCanceled) target.searchParams.set("flight_canceled", flightCanceled);
  if (cancelRef) target.searchParams.set("cancel_ref", cancelRef);
  if (ctx) target.searchParams.set("ctx", ctx);
  if (lowBw) target.searchParams.set("low_bw", lowBw);
  target.searchParams.set("dcc_handoff_id", handoffId);
  target.searchParams.set("click_id", clickId);
  target.searchParams.set("utm_source", "destinationcommandcenter.com");
  target.searchParams.set("utm_medium", "referral");
  target.searchParams.set("utm_campaign", "dcc_network_handoff");

  return NextResponse.redirect(target, 302);
}
