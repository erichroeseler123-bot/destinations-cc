import { NextResponse } from "next/server";
import { juneauDate } from "../../../lib/nextDepartures";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const date = params.get("date") || juneauDate();
  const readyAfter = params.get("after") || "00:00";
  const travelers = Number(params.get("travelers") || "2");
  const parsedDate = new Date(`${date}T12:00:00Z`);
  const maxDate = new Date(Date.now() + 550 * 86400000).toISOString().slice(0, 10);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date ||
    date < juneauDate() ||
    date > maxDate ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(readyAfter) ||
    !Number.isInteger(travelers) ||
    travelers < 1 ||
    travelers > 20
  ) {
    return NextResponse.json(
      { error: "Choose a valid date within the next 18 months, a ready time, and 1–20 travelers." },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      date,
      checkedAt: new Date().toISOString(),
      checkedOperators: 0,
      failedCalendars: 0,
      scannerOperational: false,
      mode: "concierge_review",
      notice:
        "Automated live departure-time polling across operator calendars is not currently operational. Check live departure times directly on the verified operator or Viator listings below, or submit a Human Concierge Availability Request for your exact ship and port window.",
      departures: [],
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
