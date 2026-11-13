import { NextResponse } from "next/server";
import {
  getDccRegisteredSiteManifestV1,
  getDccSiteManifestV1,
  isExcludedPortfolioSite,
  normalizeSiteIdentifier,
} from "@/lib/dcc/portfolioNetworkRegistry";

export const dynamic = "force-dynamic";

function isDefaultLocalOrRootHost(host: string): boolean {
  const normalized = normalizeSiteIdentifier(host);
  return (
    !normalized ||
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized.endsWith(".vercel.app")
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const explicitSiteParam = url.searchParams.get("site")?.trim() || null;
  const hostFallback =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host")?.trim() ||
    url.hostname ||
    "destinationcommandcenter.com";
  const requestedSite = explicitSiteParam || hostFallback;

  if (isExcludedPortfolioSite(requestedSite)) {
    return NextResponse.json(
      {
        error: "EXCLUDED_SITE",
        message: `Site '${requestedSite}' is excluded from the DCC travel-commerce network.`,
      },
      {
        status: 404,
        headers: {
          "Cache-Control": "public, max-age=300",
        },
      },
    );
  }

  let manifest = getDccRegisteredSiteManifestV1(requestedSite);
  if (!manifest && !explicitSiteParam && isDefaultLocalOrRootHost(hostFallback)) {
    manifest = getDccSiteManifestV1("destinationcommandcenter.com");
  }

  if (!manifest) {
    return NextResponse.json(
      {
        error: "UNKNOWN_SITE",
        message: `No DCC site manifest is registered for '${requestedSite}'.`,
      },
      {
        status: 404,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }

  const commitSha =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.DCC_BUILD_GIT_COMMIT ||
    process.env.GITHUB_SHA ||
    "local";

  return NextResponse.json(
    {
      ...manifest,
      entity_graph: {
        entity_id: "https://destinationcommandcenter.com/#website",
        organization_id: "https://destinationcommandcenter.com/#organization",
        relationship_statement:
          "Destination Command Center is the travel-decision, destination-data, and port-timing layer. Cruise Promenade is the cruise itinerary and group-coordination application within the DCC network.",
        three_part_positioning: {
          dcc: "DCC understands whether travel plans work.",
          cruise_promenade:
            "Cruise Promenade helps cruise groups decide and coordinate what they're doing.",
          rollcallusa: "RollCallUSA supplies the social conversation attached to that plan.",
        },
        relatedLink: [
          "https://cruisepromenade.com",
          "https://rollcallusa.com",
        ],
        citation: [
          "https://destinationcommandcenter.com/agent.json",
          "https://destinationcommandcenter.com/api/public/truth-feed",
        ],
        interoperable_peer_services: [
          {
            id: "cruise-promenade",
            "@id": "https://cruisepromenade.com/#app",
            website_id: "https://cruisepromenade.com/#website",
            name: "Cruise Promenade",
            url: "https://cruisepromenade.com",
            schema_relationship: ["relatedLink", "isBasedOn", "citation"],
            data_contract: "consumes_signed_dcc_port_and_fit_snapshots",
          },
          {
            id: "rollcallusa",
            "@id": "https://rollcallusa.com/#website",
            name: "RollCallUSA",
            url: "https://rollcallusa.com",
            schema_relationship: ["relatedLink"],
            data_contract: "peer_social_coordination_layer",
          },
        ],
        legal_and_commercial_truth: {
          claims_legal_parent_organization: false,
          claims_active_cruise_booking_partner: false,
          statement:
            "DCC, Cruise Promenade, and RollCallUSA interoperate via machine-readable technical contracts (relatedLink, isBasedOn, citation). No legal parent-subsidiary corporate hierarchy or unestablished commercial cruise-booking partnership is claimed.",
        },
      },
      build: {
        commitSha,
        shortCommitSha: commitSha.slice(0, 8),
        projectName: "destinations-cc",
        environment:
          process.env.VERCEL_ENV || process.env.NODE_ENV || "production",
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-DCC-Manifest-Schema": manifest.schema,
        "X-DCC-Site-Id": manifest.site_id,
        "X-DCC-Git-Commit": commitSha,
        "X-DCC-Project-Name": "destinations-cc",
      },
    },
  );
}
