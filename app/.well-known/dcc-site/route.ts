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

  const commitSha =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.DCC_BUILD_GIT_COMMIT ||
    process.env.GITHUB_SHA ||
    "local";

  return NextResponse.json(
    {
      ...manifest,
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
