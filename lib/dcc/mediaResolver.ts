import { getEnvOptional } from "@/lib/dcc/config/env";
import { getEntityRegistryNode, type DccEntityType } from "@/src/data/entities-registry";
import { getLocalFallbackImageSetForEntity } from "@/src/lib/media/source-local";
import { getMediaRegistryImageSet } from "@/src/data/media-registry";
import { ticketmasterAttractionToMedia, type TicketmasterAttractionRecord } from "@/src/lib/media/source-ticketmaster";
import { wikimediaImageToMedia, type WikimediaImageRecord } from "@/src/lib/media/source-wikimedia";
import type { NodeImageSet } from "@/src/lib/media/types";
import { getMediaForEntity } from "@/src/lib/media/resolver";

type MediaResolverRequest = {
  entityType: DccEntityType;
  slug: string;
  name?: string;
  summary?: string;
  sourceHints?: Record<string, string | number | boolean | null | undefined>;
};

function hasImageSet(imageSet: NodeImageSet | null | undefined) {
  return Boolean(imageSet?.hero || imageSet?.card || imageSet?.gallery?.length);
}

function stringHint(
  sourceHints: MediaResolverRequest["sourceHints"],
  key: string,
) {
  const value = sourceHints?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function fromTicketmasterAttraction(request: MediaResolverRequest) {
  if (!["show", "artist", "venue"].includes(request.entityType)) return null;

  const attractionId = stringHint(request.sourceHints, "ticketmasterAttractionId");
  if (!attractionId) return null;

  const apiKey = getEnvOptional("TICKETMASTER_API_KEY");
  if (!apiKey) return null;

  try {
    const url = new URL(`https://app.ticketmaster.com/discovery/v2/attractions/${encodeURIComponent(attractionId)}.json`);
    url.searchParams.set("apikey", apiKey);

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      cache: "force-cache",
      next: { revalidate: 86400 },
    });
    if (!response.ok) return null;

    const json = (await response.json()) as TicketmasterAttractionRecord;
    const imageSet = ticketmasterAttractionToMedia(json);
    return hasImageSet(imageSet) ? imageSet : null;
  } catch {
    return null;
  }
}

async function fromWikimedia(request: MediaResolverRequest) {
  if (!["venue", "attraction", "beach"].includes(request.entityType)) return null;

  const title = stringHint(request.sourceHints, "wikimediaTitle") || request.name;
  if (!title) return null;

  try {
    const url = new URL("https://en.wikipedia.org/w/api.php");
    url.searchParams.set("action", "query");
    url.searchParams.set("prop", "pageimages|imageinfo");
    url.searchParams.set("titles", title);
    url.searchParams.set("pithumbsize", "1600");
    url.searchParams.set("iiprop", "extmetadata");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      cache: "force-cache",
      next: { revalidate: 86400 },
    });
    if (!response.ok) return null;

    const json = (await response.json()) as {
      query?: {
        pages?: Record<string, {
          title?: string;
          thumbnail?: { source?: string };
          imageinfo?: WikimediaImageRecord[];
        }>;
      };
    };

    const page = Object.values(json.query?.pages || {})[0];
    if (!page?.thumbnail?.source) return null;

    const imageSet = wikimediaImageToMedia(
      {
        source: page.thumbnail.source,
        extmetadata: page.imageinfo?.[0]?.extmetadata,
        title: page.title,
      },
      request.name || page.title || request.slug,
    );

    return hasImageSet(imageSet) ? imageSet : null;
  } catch {
    return null;
  }
}

export async function resolveDccMedia(request: MediaResolverRequest): Promise<NodeImageSet | null> {
  const registryEntity = getEntityRegistryNode(request.slug, request.entityType);
  if (hasImageSet(registryEntity?.imageSet)) {
    return registryEntity!.imageSet!;
  }

  const directRegistryMatch = getMediaRegistryImageSet([
    `${request.entityType}:${request.slug}`,
    stringHint(request.sourceHints, "mediaAlias") || "",
    stringHint(request.sourceHints, "ticketmasterAttractionId")
      ? `tm_attr:${stringHint(request.sourceHints, "ticketmasterAttractionId")}`
      : "",
    stringHint(request.sourceHints, "seatGeekVenueId")
      ? `sg_venue:${stringHint(request.sourceHints, "seatGeekVenueId")}`
      : "",
  ].filter(Boolean));
  if (hasImageSet(directRegistryMatch)) {
    return directRegistryMatch!;
  }

  const localFallback = getLocalFallbackImageSetForEntity(request.entityType, request.slug);
  if (hasImageSet(localFallback)) {
    return localFallback;
  }

  const providerSpecific =
    await fromTicketmasterAttraction(request)
    || await fromWikimedia(request);
  if (hasImageSet(providerSpecific)) {
    return providerSpecific!;
  }

  const generic = await getMediaForEntity({
    entityType: request.entityType === "team"
      ? "sports-team"
      : request.entityType === "artist"
        ? "artist"
        : request.entityType === "venue"
          ? "venue"
          : request.entityType === "attraction"
            ? "attraction"
            : request.entityType === "pool"
              ? "pool"
              : request.entityType === "beach"
                ? "beach"
                : request.entityType === "hotel"
                  ? "hotel"
                  : request.entityType === "casino"
                    ? "casino"
                    : "attraction",
    slug: request.slug,
    sourceHints: {
      ...(request.sourceHints || {}),
      name: request.name,
      alt: request.name || request.slug,
    },
  });

  return hasImageSet(generic) ? generic : null;
}
