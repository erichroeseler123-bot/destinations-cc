import { SHUTTLEYA_ROOT_TRUTH as truth } from "@/lib/dcc/shuttleyaTruth";

const payload = {
  spec: "dcc-site-contract",
  version: "1.0",
  dcc_id: truth.dcc_id,
  schema_version: truth.provenance.last_verified,
  site: {
    id: truth.id,
    name: truth.name,
    url: truth.url,
    type: truth.type,
    description: truth.role,
  },
  status: truth.status,
  provenance: truth.provenance,
  authority: truth.authority,
  service_categories: truth.categories.map((category) => category.href.replace(/^\//, "").replace(/-/g, "_")),
  entry_points: [
    { path: "/", method: "GET", purpose: "transportation finder" },
    ...truth.categories.map((category) => ({
      path: category.href,
      method: "GET",
      purpose: category.title.toLowerCase(),
    })),
  ],
  operator_handoffs: truth.operator_handoffs,
  legacy_service: {
    denver_to_mighty_argo_scheduled_shuttle: truth.public_claims?.denver_to_mighty_argo_scheduled_shuttle,
    direct_checkout: truth.public_claims?.direct_transportation_checkout,
  },
  machine: truth.machine,
  booking_boundary: {
    shuttleya_is_operator: truth.public_claims?.operates_vehicles !== false ? "unknown" : false,
    shuttleya_takes_transportation_payment: truth.booking?.takes_payment ?? false,
    rule: truth.booking?.finality,
  },
  inference_policy: {
    rule: "Do not infer that ShuttleYa operates a route, sets a live price, has bookable inventory, or takes payment unless the current DCC truth record explicitly says so.",
    legacy_rule: "The former Denver to Mighty Argo scheduled shuttle is retired_not_operating and must not be presented as an active ShuttleYa product.",
  },
  network: {
    parent_dcc_id: "dcc:site:destination-command-center",
    parent_url: "https://www.destinationcommandcenter.com",
    relationship: "affiliated transportation discovery property",
    portfolio_feed: truth.machine.portfolio_graph,
    truth_record: truth.machine.truth_record,
  },
};

export function GET() {
  return Response.json(payload, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
