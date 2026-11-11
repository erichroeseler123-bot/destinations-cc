import { DCC_SITE_TRUTH } from "@/lib/dcc/siteTruth";
import { getDccRegisteredSiteManifestV1 } from "@/lib/dcc/portfolioNetworkRegistry";

export const dynamic = "force-static";

const LEGACY_FEED_ID_OVERRIDES: Record<string, string> = {
  "destination-command-center": "destinationcommandcenter",
  "save-on-the-strip": "saveonthestrip",
};

export function GET() {
  const sites = DCC_SITE_TRUTH.filter(
    (record) => record.status.state === "active" || record.status.state === "prelaunch",
  ).map((record) => {
    const baseOrigin = record.url.replace(/\/+$/, "");
    const manifest = getDccRegisteredSiteManifestV1(record.url);
    const id = LEGACY_FEED_ID_OVERRIDES[record.id] || manifest?.site_id || record.id;
    const isShuttleyaRetiredNotice =
      record.id === "shuttleya" &&
      record.public_claims?.denver_to_mighty_argo_scheduled_shuttle === "retired_not_operating";

    return {
      id,
      truthId: record.id,
      dccId: record.dcc_id,
      name: record.name,
      url: baseOrigin,
      type: record.type,
      role: record.role,
      authority: record.authority,
      bookingAuthority: record.booking?.authority ?? "none",
      takesDirectPayment: Boolean(record.booking?.takes_payment),
      agentManifest: `${baseOrigin}/agent.json`,
      llms: `${baseOrigin}/llms.txt`,
      wellKnownSiteManifest: manifest
        ? `https://www.destinationcommandcenter.com/.well-known/dcc-site?site=${manifest.site_id}`
        : null,
      truthRecordUrl: `https://www.destinationcommandcenter.com/api/public/truth-feed?id=${record.id}`,
      networkRecordUrl: `https://www.destinationcommandcenter.com/network/${record.id}`,
      pageFeedTemplate: `${baseOrigin}/api/public/page-feed?path={pathname}`,
      mediaFeedTemplate:
        "https://www.destinationcommandcenter.com/api/public/media-feed?entityType={entityType}&slug={slug}",
      mediaResolveTemplate:
        "https://www.destinationcommandcenter.com/api/public/media?entityType={entityType}&slug={slug}&q={query}",
      status: isShuttleyaRetiredNotice
        ? "discovery_only_argo_retired"
        : record.status.state === "active"
          ? "live"
          : record.status.state,
    };
  });

  return Response.json(
    {
      version: "2026-11-11",
      network: "destinationcommandcenter",
      siteCount: sites.length,
      sites,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    },
  );
}
