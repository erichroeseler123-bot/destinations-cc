import { NextResponse } from "next/server";
import { getDestinationConfig } from "@/src/data/destination-configs";

const categories = new Set(["music", "comedy", "theater", "nightclub", "live-music", "community"]);

function numberParam(value: string | null, fallback?: number) {
  if (value == null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const config = getDestinationConfig(slug);
  if (!config) return NextResponse.json({ error: "destination_not_found" }, { status: 404 });
  if (!config.capabilities.includes("events")) {
    return NextResponse.json({ error: "events_not_supported", destinationId: config.id }, { status: 404 });
  }

  const url = new URL(request.url);
  const lat = numberParam(url.searchParams.get("lat"));
  const lng = numberParam(url.searchParams.get("lng"));
  const radiusKm = numberParam(url.searchParams.get("radiusKm"), 10)!;
  const hours = numberParam(url.searchParams.get("hours"), 48)!;
  const category = url.searchParams.get("category") ?? undefined;
  const venueId = url.searchParams.get("venueId") ?? undefined;

  if ((lat !== undefined && Number.isNaN(lat)) || (lng !== undefined && Number.isNaN(lng)) || Number.isNaN(radiusKm) || Number.isNaN(hours)) {
    return NextResponse.json({ error: "invalid_numeric_filter" }, { status: 400 });
  }
  if ((lat === undefined) !== (lng === undefined)) {
    return NextResponse.json({ error: "lat_lng_must_be_supplied_together" }, { status: 400 });
  }
  if (radiusKm < 0 || radiusKm > 250) {
    return NextResponse.json({ error: "radiusKm_out_of_range" }, { status: 400 });
  }
  if (!Number.isInteger(hours) || hours < 1 || hours > 168) {
    return NextResponse.json({ error: "hours_out_of_range" }, { status: 400 });
  }
  if (category && !categories.has(category)) {
    return NextResponse.json({ error: "invalid_category" }, { status: 400 });
  }
  if (venueId && !venueId.startsWith(`${config.id}/`)) {
    return NextResponse.json({ error: "venueId_outside_destination" }, { status: 400 });
  }

  const configuredProviders = config.eventProviders ?? [];
  return NextResponse.json(
    {
      error: "live_event_adapter_not_connected",
      destinationId: config.id,
      asOf: new Date().toISOString(),
      filters: { lat, lng, radiusKm, hours, category, venueId },
      configuredProviders,
      message: "The public contract is active, but DCC will not fabricate event results before a real provider adapter is connected.",
    },
    { status: 501, headers: { "Cache-Control": "no-store" } },
  );
}
