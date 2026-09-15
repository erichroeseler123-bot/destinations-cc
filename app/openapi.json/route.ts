export const dynamic = "force-static";

export async function GET() {
  const document = {
    openapi: "3.1.0",
    info: {
      title: "Destination Command Center Location API",
      version: "2.0.0",
      description:
        "Dense coordinate-native public location intelligence. Latitude and longitude are the canonical DCC location key. Responses are assembled from geographically applicable public machine-readable sources.",
    },
    servers: [{ url: "https://www.destinationcommandcenter.com" }],
    paths: {
      "/api/location/{lat}/{lng}": {
        get: {
          operationId: "getLocationIntelligence",
          summary: "Get dense current public context for a coordinate",
          description:
            "Returns ordered modules for identity, current conditions, short-range forecast, hazards, water, official public data, events, machine feeds, and source freshness. Modules may be absent or empty when no mapped source applies.",
          parameters: [
            {
              name: "lat",
              in: "path",
              required: true,
              schema: { type: "number", minimum: -90, maximum: 90 },
              description: "Latitude. Canonical DCC URLs use five decimal places.",
            },
            {
              name: "lng",
              in: "path",
              required: true,
              schema: { type: "number", minimum: -180, maximum: 180 },
              description: "Longitude. Canonical DCC URLs use five decimal places.",
            },
            {
              name: "timezone",
              in: "query",
              required: false,
              schema: { type: "string", default: "auto" },
              description: "Optional timezone hint for legacy/configured event feeds. Core coordinate sources resolve timezone from the coordinate.",
            },
          ],
          responses: {
            "200": {
              description: "Dense DCC coordinate intelligence object",
              headers: {
                "X-DCC-Schema": { schema: { type: "string", const: "dcc-location-v2" } },
                "X-DCC-Coordinate": { schema: { type: "string" } },
              },
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/DccLocationResponse" },
                },
              },
            },
            "400": { description: "Invalid coordinate" },
            "503": { description: "Coordinate accepted but location-intelligence sources are temporarily unavailable" },
          },
        },
      },
      "/octo/supplier": {
        get: {
          operationId: "getOctoSupplier",
          summary: "Get OCTO Supplier information",
          description: "Returns supplier identity, endpoint, contact information, and supported capabilities per OCTO Core v1.2.0.",
          security: [{ BearerAuth: [] }],
          responses: {
            "200": { description: "OCTO Supplier profile" },
            "401": { description: "Invalid or missing Bearer token" },
          },
        },
      },
      "/octo/products": {
        get: {
          operationId: "listOctoProducts",
          summary: "List OCTO Products",
          description: "Returns all active tour and activity products available through the OCTO layer.",
          security: [{ BearerAuth: [] }],
          responses: {
            "200": { description: "Array of OCTO products" },
            "401": { description: "Invalid or missing Bearer token" },
          },
        },
      },
      "/octo/products/{productId}": {
        get: {
          operationId: "getOctoProduct",
          summary: "Get OCTO Product Details",
          parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" } }],
          security: [{ BearerAuth: [] }],
          responses: {
            "200": { description: "OCTO Product detail" },
            "404": { description: "Product not found" },
          },
        },
      },
      "/octo/availability/calendar": {
        post: {
          operationId: "getOctoAvailabilityCalendar",
          summary: "Check date-range availability calendar",
          security: [{ BearerAuth: [] }],
          responses: {
            "200": { description: "Calendar availability summary" },
          },
        },
      },
      "/octo/availability": {
        post: {
          operationId: "checkOctoAvailabilityCore",
          summary: "Check detailed live availability",
          security: [{ BearerAuth: [] }],
          responses: {
            "200": { description: "Available time slots, vacancies, and pricing" },
          },
        },
      },
      "/octo/bookings": {
        post: {
          operationId: "createOctoBooking",
          summary: "Create an OCTO reservation hold",
          security: [{ BearerAuth: [] }],
          responses: {
            "201": { description: "Booking hold created with utcHoldExpires" },
            "400": { description: "Invalid request or insufficient availability" },
          },
        },
        get: {
          operationId: "listOctoBookings",
          summary: "List OCTO bookings",
          security: [{ BearerAuth: [] }],
          responses: {
            "200": { description: "List of bookings" },
          },
        },
      },
      "/octo/bookings/{bookingUuid}": {
        get: {
          operationId: "getOctoBookingByUuid",
          summary: "Retrieve booking status",
          parameters: [{ name: "bookingUuid", in: "path", required: true, schema: { type: "string" } }],
          security: [{ BearerAuth: [] }],
          responses: {
            "200": { description: "Booking details" },
            "404": { description: "Booking not found" },
          },
        },
        patch: {
          operationId: "updateOctoBookingByUuid",
          summary: "Update passenger contact or notes on existing booking",
          parameters: [{ name: "bookingUuid", in: "path", required: true, schema: { type: "string" } }],
          security: [{ BearerAuth: [] }],
          responses: {
            "200": { description: "Updated booking details" },
          },
        },
      },
      "/octo/bookings/{bookingUuid}/confirm": {
        post: {
          operationId: "confirmOctoBookingByUuid",
          summary: "Confirm on-hold booking",
          parameters: [{ name: "bookingUuid", in: "path", required: true, schema: { type: "string" } }],
          security: [{ BearerAuth: [] }],
          responses: {
            "200": { description: "Booking confirmed with voucher" },
            "410": { description: "Hold expired" },
          },
        },
      },
      "/octo/bookings/{bookingUuid}/cancel": {
        post: {
          operationId: "cancelOctoBookingByUuid",
          summary: "Cancel booking and initiate settlement adjustment",
          parameters: [{ name: "bookingUuid", in: "path", required: true, schema: { type: "string" } }],
          security: [{ BearerAuth: [] }],
          responses: {
            "200": { description: "Booking cancelled" },
          },
        },
      },
      "/api/octo/participants": {
        get: {
          operationId: "listOctoParticipants",
          summary: "List authorized OCTO participants and ecosystem registry",
          description: "Returns connected operators, booking systems, resellers, and channel managers implementing the OCTO standard under DCC direct authority.",
          responses: {
            "200": { description: "List of OCTO participants" },
          },
        },
      },
      "/api/octo/availability": {
        post: {
          operationId: "checkOctoAvailability",
          summary: "Query live availability directly from operator OCTO systems",
          description: "Live availability check against upstream OCTO provider. Returns available departure times, remaining seat capacity, and dynamic pricing.",
          responses: {
            "200": { description: "Available time slots and pricing" },
          },
        },
      },
      "/api/octo/hold": {
        post: {
          operationId: "createOctoBookingHold",
          summary: "Reserve seats with explicit hold duration",
          description: "Initiates a two-phase booking reservation hold enforcing expirationMinutes per the OCTO Core specification. Seats are held upstream in the operator reservation system.",
          responses: {
            "201": { description: "Hold created with utcHoldExpires timestamp" },
          },
        },
      },
      "/api/octo/confirm": {
        post: {
          operationId: "confirmOctoBooking",
          summary: "Confirm held booking and issue digital voucher",
          description: "Confirms an on-hold reservation with lead traveler details and authorized payment handoff. Records agreed commission in settlement ledger.",
          responses: {
            "200": { description: "Booking confirmed with voucher code" },
            "410": { description: "Hold expired" },
          },
        },
      },
      "/api/octo/bookings/{id}": {
        get: {
          operationId: "getOctoBooking",
          summary: "Retrieve booking status and voucher details",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Booking details" } },
        },
        delete: {
          operationId: "cancelOctoBooking",
          summary: "Cancel reservation and trigger settlement refund",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Booking cancelled" } },
        },
      },
    },
    components: {
      schemas: {
        DccLocationResponse: {
          type: "object",
          required: ["ok", "schema", "schemaVersion", "coordinate", "canonical", "checkedAt", "modules", "sources"],
          properties: {
            ok: { type: "boolean" },
            schema: { type: "string", const: "dcc-location-v2" },
            schemaVersion: { type: "integer", const: 2 },
            coordinate: {
              type: "object",
              required: ["lat", "lng", "precision_decimals"],
              properties: {
                lat: { type: "number" },
                lng: { type: "number" },
                precision_decimals: { type: "integer", const: 5 },
              },
            },
            location: {
              type: "object",
              additionalProperties: true,
              description: "Coordinate identity plus derived timezone/elevation. Human-readable reverse-geocoded names are not required for machine use.",
            },
            canonical: {
              type: "object",
              properties: {
                page: { type: "string" },
                api: { type: "string" },
                absolutePage: { type: "string", format: "uri" },
                absoluteApi: { type: "string", format: "uri" },
              },
            },
            checkedAt: { type: "string", format: "date-time" },
            modules: {
              type: "object",
              required: ["identity", "now", "conditions", "hazards", "water", "official"],
              properties: {
                identity: { type: "object", additionalProperties: true },
                now: {
                  type: "object",
                  properties: {
                    weather: { type: ["object", "null"], additionalProperties: true },
                    airQuality: { type: ["object", "null"], additionalProperties: true },
                  },
                },
                conditions: {
                  type: "object",
                  properties: {
                    next12Hours: { type: "array", items: { type: "object", additionalProperties: true } },
                    next3Days: { type: "array", items: { type: "object", additionalProperties: true } },
                    airQualityNext12Hours: { type: "array", items: { type: "object", additionalProperties: true } },
                  },
                },
                hazards: {
                  type: "object",
                  properties: {
                    alerts: { type: "array", items: { type: "object", additionalProperties: true } },
                    earthquakes: { type: "array", items: { type: "object", additionalProperties: true } },
                    naturalEvents: { type: "array", items: { type: "object", additionalProperties: true } },
                  },
                },
                water: {
                  type: "object",
                  properties: {
                    nearbyGauges: { type: "array", items: { type: "object", additionalProperties: true } },
                  },
                },
                official: { type: "object", additionalProperties: true },
                events: { type: ["object", "null"], additionalProperties: true },
                machineFeeds: { type: "array", items: { type: "object", additionalProperties: true } },
                providerSlots: { type: "object", additionalProperties: true },
                officialLiveLinks: { type: "array", items: { type: "object", additionalProperties: true } },
              },
            },
            sources: {
              type: "array",
              description: "Per-provider availability, attribution, freshness, and error state.",
              items: {
                type: "object",
                properties: {
                  provider: { type: "string" },
                  attribution: { type: "string" },
                  available: { type: "boolean" },
                  checkedAt: { type: "string", format: "date-time" },
                  error: { type: "string" },
                },
              },
            },
            weather: { type: ["object", "null"], additionalProperties: true, description: "v1 compatibility alias for modules.now.weather" },
            alerts: { type: "array", items: { type: "object", additionalProperties: true }, description: "v1 compatibility alias for modules.hazards.alerts" },
            earthquakes: { type: "array", items: { type: "object", additionalProperties: true }, description: "Compatibility alias for modules.hazards.earthquakes" },
            events: { type: ["object", "null"], additionalProperties: true },
            machineFeeds: { type: "array", items: { type: "object", additionalProperties: true } },
            providerSlots: { type: "object", additionalProperties: true },
            policy: { type: "object", additionalProperties: true },
          },
        },
      },
    },
  };

  return Response.json(document, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
