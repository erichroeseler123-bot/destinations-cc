const schema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://www.destinationcommandcenter.com/dcc-site-contract.schema.json",
  title: "DCC Site Contract",
  description:
    "Public machine-readable contract used by properties in the Destination Command Center portfolio.",
  type: "object",
  required: ["spec", "version", "dcc_id", "site", "authority", "machine", "network"],
  properties: {
    spec: { const: "dcc-site-contract" },
    version: { type: "string", pattern: "^[0-9]+\\.[0-9]+$" },
    dcc_id: { type: "string", pattern: "^dcc:site:[a-z0-9-]+$" },
    schema_version: { type: "string" },
    site: {
      type: "object",
      required: ["id", "name", "url", "type", "description"],
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        url: { type: "string", format: "uri" },
        type: { type: "string" },
        description: { type: "string" },
      },
      additionalProperties: true,
    },
    authority: {
      type: "array",
      minItems: 1,
      items: { type: "string" },
    },
    entry_points: {
      type: "array",
      items: {
        type: "object",
        required: ["path", "method", "purpose"],
        properties: {
          path: { type: "string" },
          method: { type: "string" },
          purpose: { type: "string" },
        },
        additionalProperties: true,
      },
    },
    machine: {
      type: "object",
      required: ["agent", "portfolio_graph"],
      properties: {
        agent: { type: "string", format: "uri" },
        llms: { type: "string", format: "uri" },
        sitemap: { type: "string", format: "uri" },
        openapi: { type: "string", format: "uri" },
        portfolio_graph: { type: "string", format: "uri" },
      },
      additionalProperties: true,
    },
    booking_boundary: {
      type: "object",
      additionalProperties: true,
    },
    network: {
      type: "object",
      required: ["parent_dcc_id", "parent_url", "portfolio_feed"],
      properties: {
        parent_dcc_id: { const: "dcc:site:destination-command-center" },
        parent_url: { type: "string", format: "uri" },
        relationship: { type: "string" },
        portfolio_feed: { type: "string", format: "uri" },
      },
      additionalProperties: true,
    },
  },
  additionalProperties: true,
};

export function GET() {
  return Response.json(schema, {
    headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
