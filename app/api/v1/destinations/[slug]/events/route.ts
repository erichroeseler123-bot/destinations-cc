import { NextResponse } from "next/server";
import { getDestinationConfig } from "@/src/data/destination-configs";
import { ticketmasterAdapter, type TicketmasterEvent } from "@/lib/dcc/providers/adapters/ticketmaster";
import { resolveVenueGraphId } from "@/src/lib/dcc/venue-normalization";

const categories = new Set(["music", "comedy", "theater", "nightclub", "live-music", "community"]);

function numberParam(value: string | null, fallback?: number) {
  if (value == null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const r = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalizeCategory(event: TicketmasterEvent) {
  const values = [event.segment_name, event.genre_name, event.subgenre_name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (values.includes("comedy")) return "comedy";
  if (values.includes("theatre") || values.includes("theater")) return "theater";
  if (values.includes("nightclub") || values.includes("club")) return "nightclub";
  if (values.includes("music") || values.includes("jazz") || values.includes("rock") || values.includes("concert")) return "music";
  return "community";
}

function ticketmasterStart(event: TicketmasterEvent, timezone: string) {
  if (event.start_date_time) return event.start_date_time;
  if (!event.start_date) return null;
  // Ticketmaster may omit an offset when only local date/time are supplied. Keep the
  // local value explicit instead of fabricating UTC. Consumers also receive destination timezone.
  return event.start_time ? `${event.start_date}T${event.start_time}` : `${event.start_date}T00:00:00`;
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

  // New Orleans is the first live adapter pilot. Other destinations stay honestly
  // configured-but-unconnected until a provider adapter is explicitly wired.
  if (config.id !== "new-orleans") {
    return NextResponse.json(
      {
        error: "live_event_adapter_not_connected",
        destinationId: config.id,
        asOf: new Date().toISOString(),
        filters: { lat, lng, radiusKm, hours, category, venueId },
        configuredProviders: config.eventProviders ?? [],
      },
      { status: 501, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!ticketmasterAdapter.isConfigured()) {
    return NextResponse.json(
      {
        error: "live_event_adapter_not_connected",
        destinationId: config.id,
        provider: "ticketmaster",
        asOf: new Date().toISOString(),
        filters: { lat, lng, radiusKm, hours, category, venueId },
      },
      { status: 501, headers: { "Cache-Control": "no-store" } },
    );
  }

  const now = new Date();
  const end = new Date(now.getTime() + hours * 60 * 60 * 1000);
  const result = await ticketmasterAdapter.fetch({
    city: "New Orleans",
    countryCode: "US",
    startDateTime: now.toISOString(),
    endDateTime: end.toISOString(),
    size: 100,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: "live_event_provider_failed",
        destinationId: config.id,
        provider: "ticketmaster",
        asOf: new Date().toISOString(),
        diagnostics: result.diagnostics,
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  const seen = new Set<string>();
  const events = result.data
    .map((event) => {
      const venue = resolveVenueGraphId({
        destinationId: config.id,
        venueName: event.venue_name,
        source: "ticketmaster",
        sourceVenueId: event.venue_id,
      });
      const km =
        lat !== undefined && lng !== undefined && event.venue_lat !== null && event.venue_lng !== null
          ? distanceKm(lat, lng, event.venue_lat, event.venue_lng)
          : null;
      return {
        id: `evt_tm_${event.id}`,
        sourceEventId: event.id,
        name: event.name,
        startDate: ticketmasterStart(event, config.timezone),
        endDate: null,
        timezone: config.timezone,
        venueId: venue.venueId,
        venueName: venue.venueName,
        venueSameAs: venue.sameAs,
        lat: event.venue_lat,
        lng: event.venue_lng,
        distanceKm: km === null ? null : Math.round(km * 10) / 10,
        category: normalizeCategory(event),
        source: "ticketmaster" as const,
        sourceUrl: event.url,
        ticketUrl: event.url,
        schemaType: "Event" as const,
      };
    })
    .filter((event) => {
      const dedupeKey = `ticketmaster:${event.sourceEventId}`;
      if (seen.has(dedupeKey)) return false;
      seen.add(dedupeKey);
      if (lat !== undefined && lng !== undefined) {
        if (event.distanceKm === null || event.distanceKm > radiusKm) return false;
      }
      if (category && event.category !== category && !(category === "live-music" && event.category === "music")) return false;
      if (venueId && event.venueId !== venueId) return false;
      return Boolean(event.startDate);
    });

  return NextResponse.json(
    {
      destinationId: config.id,
      asOf: new Date().toISOString(),
      filters: { lat, lng, radiusKm, hours, category, venueId },
      events,
      diagnostics: {
        provider: "ticketmaster",
        providerStatus: "live",
        cacheMinutes: 15,
        source: result.diagnostics,
      },
    },
    { status: 200, headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=900" } },
  );
}
