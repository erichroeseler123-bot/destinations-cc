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
