import { getPublicMediaFeed, PUBLIC_MEDIA_ENTITY_TYPES } from "@/lib/dcc/mediaFeed";
import type { DccEntityType } from "@/src/data/entities-registry";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = (url.searchParams.get("slug") || "").trim();
  const entityType = (url.searchParams.get("entityType") || "").trim() as DccEntityType;

  if (!slug) {
    return Response.json(
      {
        ok: false,
        error: "missing_slug",
        supportedPattern: "/api/public/media-feed?entityType=hotel&slug=bellagio",
        supportedEntityTypes: PUBLIC_MEDIA_ENTITY_TYPES,
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=300",
        },
      },
    );
  }

  const feed = await getPublicMediaFeed(slug, entityType || undefined);

  if (!feed) {
    return Response.json(
      {
        ok: false,
        error: "media_not_found",
        supportedPattern: "/api/public/media-feed?entityType=hotel&slug=bellagio",
        supportedEntityTypes: PUBLIC_MEDIA_ENTITY_TYPES,
      },
      {
        status: 404,
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=300",
        },
      },
    );
  }

  return Response.json(feed, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
