import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { recheckSavedJuneauTripContextBeforeCheckout } from "@/lib/dcc/sharedTripRecheck";

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
  const returnBuffer = clean(incoming.searchParams.get("return_buffer"), 6);
  const optionId = slug(incoming.searchParams.get("option_id"));
  const engineOptionId = slug(incoming.searchParams.get("engine_option_id"));
  const flightCanceled = clean(incoming.searchParams.get("flight_canceled"), 10);
  const cancelRef = clean(incoming.searchParams.get("cancel_ref"), 80);
  const dccCtxPayload = clean(incoming.searchParams.get("dcc_ctx"), 1200);
  const ctx = clean(incoming.searchParams.get("ctx") || incoming.searchParams.get("dcc_ctx"), 80);
  const lowBw = clean(incoming.searchParams.get("low_bw"), 5);
  const handoffId = clean(incoming.searchParams.get("dcc_handoff_id"), 120) || `ho_${randomUUID()}`;
  const clickId =
    clean(incoming.searchParams.get("click_id"), 120) ||
    `clk_${handoffId.replace(/^ho_/, "").replace(/-/g, "").slice(0, 24)}`;

  // Recheck saved trip context before checkout / Flight Deck handoff can proceed
  const hasSavedTimingContext = Boolean(
    dccCtxPayload ||
      optionId ||
      engineOptionId ||
      allAboard ||
      (timeWindow && timeWindow.includes("-")),
  );

  if (hasSavedTimingContext) {
    const savedRecheck = recheckSavedJuneauTripContextBeforeCheckout({
      ship: ship || undefined,
      date: portDate || undefined,
      arrival: claaArrival || undefined,
      claa_arrival: claaArrival || undefined,
      all_aboard: allAboard || undefined,
      time_window: timeWindow || undefined,
      berth: berth || undefined,
      return_buffer: returnBuffer || undefined,
      party_size: partySize || undefined,
      option_id: optionId || undefined,
      engine_option_id: engineOptionId || undefined,
      interest: interest || undefined,
      flight_canceled: flightCanceled || undefined,
      cancel_ref: cancelRef || undefined,
      ctx: ctx || undefined,
      dcc_ctx: dccCtxPayload || undefined,
    });

    if (!savedRecheck.checkoutAllowed) {
      const fallbackUrl = new URL(savedRecheck.allowedNextStepHref, incoming.origin);
      const res = NextResponse.redirect(fallbackUrl, 302);
      res.headers.set("x-dcc-saved-context-recheck", "blocked-view-options-that-fit");
      res.headers.set("x-dcc-allowed-next-step-label", savedRecheck.allowedNextStepLabel);
      res.headers.set("x-dcc-allowed-next-step-href", savedRecheck.allowedNextStepHref);
      return res;
    }
  }

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
  if (returnBuffer) target.searchParams.set("return_buffer", returnBuffer);
  if (timeWindow) target.searchParams.set("time_window", timeWindow);
  if (budgetBand) target.searchParams.set("budget_band", budgetBand);
  if (interest) target.searchParams.set("interest", interest);
  if (optionId) target.searchParams.set("option_id", optionId);
  if (engineOptionId) target.searchParams.set("engine_option_id", engineOptionId);
  if (flightCanceled) target.searchParams.set("flight_canceled", flightCanceled);
  if (cancelRef) target.searchParams.set("cancel_ref", cancelRef);
  if (ctx) target.searchParams.set("ctx", ctx);
  if (lowBw) target.searchParams.set("low_bw", lowBw);
  target.searchParams.set("dcc_handoff_id", handoffId);
  target.searchParams.set("click_id", clickId);
  target.searchParams.set("utm_source", "destinationcommandcenter.com");
  target.searchParams.set("utm_medium", "referral");
  target.searchParams.set("utm_campaign", "dcc_network_handoff");

  const res = NextResponse.redirect(target, 302);
  res.headers.set("x-dcc-saved-context-recheck", "passed");
  return res;
}

