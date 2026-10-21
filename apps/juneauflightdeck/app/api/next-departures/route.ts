import { NextResponse } from "next/server";
import { VERIFIED_FALLBACK_SNAPSHOT } from "@/lib/viator/catalog";
import { juneauDate, parseCalendarDepartures, sortDepartures } from "@/lib/nextDepartures";

export const dynamic = "force-dynamic";

const tours = VERIFIED_FALLBACK_SNAPSHOT.filter(t => {
  try { const u = new URL(t.directOperatorHref || ""); return u.hostname === "fareharbor.com" && /^\/embeds\/book\/(temscoair-juneau|coastalhelicopters|northstartrekking)\/items\/\d+\/$/.test(u.pathname); } catch { return false; }
});

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
  const results = await Promise.allSettled(tours.map(async tour => {
    const booking = new URL(tour.directOperatorHref!);
    const [, company, item] = booking.pathname.match(/\/book\/([^/]+)\/items\/(\d+)\//)!;
    // Read-only public operator booking calendar; no holds, customer data, or bookings.
    const response = await fetch(`https://fareharbor.com/api/v1/companies/${company}/items/${item}/availabilities/date/${date}/?asn=welcometoalaskatours`, {
      headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000), next: { revalidate: 60 },
    });
    if (!response.ok) throw new Error("Calendar unavailable");
    return parseCalendarDepartures(await response.json(), tour, date, readyAfter, travelers, now);
  }));
  const successful = results.filter(r => r.status === "fulfilled");
  return NextResponse.json({
    date, checkedAt: now.toISOString(),
    checkedOperators: new Set(tours.filter((_, i) => results[i].status === "fulfilled").map(t => t.supplierName)).size,
    failedCalendars: results.length - successful.length,
    departures: sortDepartures(results.flatMap(r => r.status === "fulfilled" ? r.value : [])).slice(0, 12),
  }, { headers: { "Cache-Control": "no-store" } });
}
