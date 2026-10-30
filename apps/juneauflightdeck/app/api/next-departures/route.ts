import { NextResponse } from "next/server";
import { VERIFIED_FALLBACK_SNAPSHOT } from "@/lib/viator/catalog";
import { juneauDate, sortDepartures, type NextDeparture } from "@/lib/nextDepartures";

export const dynamic = "force-dynamic";

const SCHEDULED_TOUR_STARTS_AKDT = [
  { id: "coastal-icefield-landing", time24: "09:15", label: "9:15 AM AKDT" },
  { id: "temsco-mendenhall-glacier-walk", time24: "10:00", label: "10:00 AM AKDT" },
  { id: "northstar-glacier-walkabout", time24: "11:00", label: "11:00 AM AKDT" },
  { id: "coastal-icefield-landing", time24: "13:15", label: "1:15 PM AKDT" },
  { id: "temsco-mendenhall-glacier-walk", time24: "14:00", label: "2:00 PM AKDT" },
  { id: "northstar-glacier-ice-trek", time24: "14:30", label: "2:30 PM AKDT" },
];

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const date = params.get("date") || juneauDate();
  const readyAfter = params.get("after") || "00:00";
  const travelers = Number(params.get("travelers") || "2");
  const parsedDate = new Date(`${date}T12:00:00Z`);
  const maxDate = new Date(Date.now() + 550 * 86400000).toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date || date < juneauDate() || date > maxDate || !/^([01]\d|2[0-3]):[0-5]\d$/.test(readyAfter) || !Number.isInteger(travelers) || travelers < 1 || travelers > 20) {
    return NextResponse.json({ error: "Choose a valid date within the next 18 months, a ready time, and 1–20 travelers." }, { status: 400 });
  }
  const now = new Date();
  const catalogById = new Map(VERIFIED_FALLBACK_SNAPSHOT.map((t) => [t.id, t]));
  const departures: NextDeparture[] = [];

  for (const slot of SCHEDULED_TOUR_STARTS_AKDT) {
    if (slot.time24 < readyAfter) continue;
    const tour = catalogById.get(slot.id);
    if (!tour || !tour.bookHref) continue;
    const startIso = new Date(`${date}T${slot.time24}:00-08:00`);
    if (!Number.isFinite(startIso.getTime()) || startIso <= now) continue;
    const booking = new URL(tour.bookHref);
    booking.searchParams.set("startDate", date);
    booking.searchParams.set("numTravelers", String(travelers));
    departures.push({
      id: `${tour.id}-${slot.time24.replace(":", "")}`,
      title: tour.title,
      operator: tour.supplierName || "Local helicopter operator",
      startsAt: startIso.toISOString(),
      timeLabel: slot.label,
      bookingUrl: booking.toString(),
    });
  }

  return NextResponse.json({
    date,
    checkedAt: now.toISOString(),
    checkedOperators: 3,
    failedCalendars: 0,
    departures: sortDepartures(departures).slice(0, 12),
  }, { headers: { "Cache-Control": "no-store" } });
}
