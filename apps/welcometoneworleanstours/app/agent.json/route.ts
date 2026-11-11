import { getWnoAgentDirectory } from "@/app/new-orleans/data/wnoFeedsData";
import { validateAgentDirectory } from "@/lib/dcc/contracts/stage2MachineFeedContract";

// spec: dcc-site-contract v1.1 (superset with dcc-agent-directory v2.0)
// Canonical DCC truth record: https://www.destinationcommandcenter.com/api/public/truth-feed?id=wno-tours
const BASE_URL = "https://www.welcometoneworleanstours.com";
const PORTFOLIO_FEED_URL = "https://www.destinationcommandcenter.com/api/public/portfolio-feed";
const TRUTH_RECORD_URL = "https://www.destinationcommandcenter.com/api/public/truth-feed?id=wno-tours";

export const dynamic = "force-static";

export function GET() {
  const directory = getWnoAgentDirectory();
  const validation = validateAgentDirectory(directory);

  if (!validation.valid) {
    return Response.json(
      { error: "Agent directory validation failed", details: validation.errors },
      { status: 500 },
    );
  }

  const supersetPayload = {
    ...directory,
    schema_version: "2026-11-11",
    machine_layer_version: "0.3.0",
    contract_compatibility: {
      primary_spec: directory.spec,
      primary_version: directory.version,
      site_contract_spec: "dcc-site-contract",
      site_contract_version: "1.1",
    },
    site: {
      id: "wno-tours",
      name: directory.name,
      url: directory.canonical_url,
      type: "new_orleans_tour_storefront_and_concierge",
      description:
        "Curated New Orleans tour comparisons, steamboat & swamp guides, and disclosed FareHarbor/Viator/operator handoffs.",
    },
    status: {
      state: "active",
      last_verified: "2026-11-11",
    },
    authority: directory.authority_scope,
    entry_points: [
      { path: "/", method: "GET", purpose: "New Orleans tours, riverboats, swamp tours, and local planning guides" },
      { path: "/tours", method: "GET", purpose: "Browse curated New Orleans tour catalog and operator comparisons" },
      { path: "/contact", method: "GET", purpose: "Concierge & group inquiry intake" },
      { path: "/api/v2/feeds/products", method: "GET", purpose: "Machine-readable product catalog feed" },
    ],
    machine: {
      agent: `${BASE_URL}/agent.json`,
      llms: `${BASE_URL}/llms.txt`,
      dcc_site_manifest: `${BASE_URL}/.well-known/dcc-site`,
      portfolio_graph: PORTFOLIO_FEED_URL,
      truth_record: TRUTH_RECORD_URL,
    },
    booking_boundary: {
      ...directory.booking_boundary,
      rule:
        "Welcome to New Orleans Tours provides tour comparison, timing guidance, and disclosed FareHarbor/Viator/operator handoffs; final live availability, payment capture, cancellation terms, and fulfillment are governed by the operating company or booking provider.",
    },
    network: {
      parent_dcc_id: "dcc:site:destination-command-center",
      parent_url: "https://www.destinationcommandcenter.com",
      relationship: "affiliated New Orleans tour storefront and comparison service",
      portfolio_feed: PORTFOLIO_FEED_URL,
      truth_record: TRUTH_RECORD_URL,
    },
  };

  return Response.json(supersetPayload, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
