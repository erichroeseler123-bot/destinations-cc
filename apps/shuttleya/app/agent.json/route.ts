import { SHUTTLEYA_TRUTH } from "../../lib/siteTruth";

const truth = SHUTTLEYA_TRUTH;

const payload = {
  spec: "dcc-site-contract",
  version: "1.0",
  dcc_id: truth.dcc_id,
  schema_version: truth.verified_at,
  site: truth.site,
  status: truth.status,
  provenance: {
    kind: "declared_by_site",
    last_verified: truth.verified_at,
  },
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
  legacy_service: truth.legacy_service,
  machine: truth.machine,
  booking_boundary: truth.booking_boundary,
  inference_policy: {
    rule: "Do not infer that ShuttleYa operates a route, sets a live price, has bookable inventory, or takes payment unless a current public ShuttleYa truth field explicitly says so.",
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
