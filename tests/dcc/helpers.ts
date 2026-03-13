import type { CruiseSailing } from "@/lib/dcc/cruise/schema";

export function makeSailing(partial: Partial<CruiseSailing> = {}): CruiseSailing {
  return {
    sailing_id: partial.sailing_id || "TEST-001",
    line: partial.line || "Test Line",
    line_slug: partial.line_slug || "test-line",
    ship: partial.ship || "Test Ship",
    ship_slug: partial.ship_slug || "test-ship",
    departure_date: partial.departure_date || "2026-07-01",
    duration_days: partial.duration_days ?? 7,
    itinerary_type: partial.itinerary_type || "roundtrip",
    embark_port: partial.embark_port || {
      port_name: "Miami, USA",
      port_code: "USMIA",
      arrival: "2026-07-01T12:00:00Z",
      departure: "2026-07-01T18:00:00Z",
    },
    disembark_port: partial.disembark_port || {
      port_name: "Miami, USA",
      port_code: "USMIA",
      arrival: "2026-07-08T11:00:00Z",
      departure: "2026-07-08T13:00:00Z",
    },
    ports: partial.ports || [
      {
        port_name: "Miami, USA",
        port_code: "USMIA",
        arrival: "2026-07-01T12:00:00Z",
        departure: "2026-07-01T18:00:00Z",
      },
      {
        port_name: "Miami, USA",
        port_code: "USMIA",
        arrival: "2026-07-08T11:00:00Z",
        departure: "2026-07-08T13:00:00Z",
      },
    ],
    sea_days: partial.sea_days ?? 5,
    starting_price: partial.starting_price || {
      amount: 999,
      currency: "USD",
      cabin_type: "inside",
    },
    availability_status: partial.availability_status || "good",
    amenities: partial.amenities || {
      dining: ["Main Dining"],
      entertainment: ["Live Shows"],
      activities: ["Pool"],
      wellness: ["Spa"],
      other: [],
    },
    sailing_context: partial.sailing_context || {
      demand_level: "medium",
      notes: [],
    },
    source: partial.source || "test",
    external_booking_url: partial.external_booking_url,
    external_provider: partial.external_provider,
    ship_image_url: partial.ship_image_url,
    events: partial.events,
  };
}
