export const dynamic = "force-static";

export async function GET() {
  const document = {
    openapi: "3.1.0",
    info: {
      title: "Destination Command Center Location API",
      version: "1.0.0",
      description:
        "Coordinate-native public location intelligence. Latitude and longitude are the canonical DCC location key.",
    },
    servers: [{ url: "https://www.destinationcommandcenter.com" }],
    paths: {
      "/api/location/{lat}/{lng}": {
        get: {
          operationId: "getLocationIntelligence",
          summary: "Get current public location intelligence for a coordinate",
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
            },
          ],
          responses: {
            "200": {
              description: "Current DCC location object",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/DccLocationResponse" },
                },
              },
            },
            "400": { description: "Invalid coordinate" },
            "503": { description: "Location resolved but live sources are temporarily unavailable" },
          },
        },
      },
    },
    components: {
      schemas: {
        DccLocationResponse: {
          type: "object",
          required: ["ok", "schema", "coordinate", "canonical", "checkedAt"],
          properties: {
            ok: { type: "boolean" },
            schema: { type: "string", const: "dcc-location-v1" },
            coordinate: {
              type: "object",
              properties: {
                lat: { type: "number" },
                lng: { type: "number" },
                precision_decimals: { type: "integer", const: 5 },
              },
            },
            location: { type: ["object", "null"], additionalProperties: true },
            canonical: {
              type: "object",
              properties: {
                page: { type: "string" },
                api: { type: "string" },
              },
            },
            checkedAt: { type: "string", format: "date-time" },
            cityNow: { type: ["object", "null"], additionalProperties: true },
            weather: { type: ["object", "null"], additionalProperties: true },
            events: { type: ["object", "null"], additionalProperties: true },
            machineFeeds: { type: "array", items: { type: "object", additionalProperties: true } },
            providerSlots: { type: "object", additionalProperties: true },
            officialLiveLinks: { type: "array", items: { type: "object", additionalProperties: true } },
            districtNow: { type: ["object", "null"], additionalProperties: true },
            districtIntents: { type: "array", items: { type: "object", additionalProperties: true } },
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
