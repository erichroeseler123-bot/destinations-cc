import { NextResponse } from "next/server";
import {
  getDccSiteManifestV1,
  isExcludedPortfolioSite,
} from "@/lib/dcc/portfolioNetworkRegistry";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedSite =
    url.searchParams.get("site")?.trim() ||
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host")?.trim() ||
    url.hostname ||
    "destinationcommandcenter.com";

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

  const manifest =
    getDccSiteManifestV1(requestedSite) ||
    getDccSiteManifestV1("destinationcommandcenter.com")!;

  return NextResponse.json(manifest, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      "X-DCC-Manifest-Schema": manifest.schema,
      "X-DCC-Site-Id": manifest.site_id,
    },
  });
}
