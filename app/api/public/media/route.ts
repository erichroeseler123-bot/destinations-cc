import { NextResponse } from "next/server";

export const revalidate = 86400;

type NormalizedImageResult = {
  id: string;
  alt: string;
  imageUrl: string;
  thumbUrl: string;
  pageUrl: string;
  photographer: string;
  width: number | null;
  height: number | null;
};

type MediaProvider = "spotify" | "ticketmaster" | "seatgeek" | "unsplash";

const DEFAULT_QUERY = "concert nightlife";

function parseDimension(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parseEntityType(value: string | null) {
  switch ((value || "").trim()) {
    case "artist":
    case "show":
    case "venue":
    case "scene":
    case "guide":
    case "transport":
    case "marketing":
      return value as
        | "artist"
        | "show"
        | "venue"
        | "scene"
        | "guide"
        | "transport"
        | "marketing";
    default:
      return "marketing";
  }
}

function normalizeUrl(value: string | null) {
  const trimmed = (value || "").trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return null;
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function priorityForEntity(
  entityType: "artist" | "show" | "venue" | "scene" | "guide" | "transport" | "marketing",
): MediaProvider[] {
  if (entityType === "artist") return ["spotify", "ticketmaster", "seatgeek", "unsplash"];
  if (entityType === "show") return ["ticketmaster", "seatgeek", "spotify", "unsplash"];
  if (entityType === "venue") return ["ticketmaster", "seatgeek", "unsplash"];
  return ["unsplash", "ticketmaster", "seatgeek", "spotify"];
}

function preferredProviderUrl(
  entityType: ReturnType<typeof parseEntityType>,
  requestUrl: URL,
): string | null {
  const candidates = new Map<MediaProvider, string>();
  const spotify = normalizeUrl(requestUrl.searchParams.get("spotifyImageUrl"));
  const ticketmaster = normalizeUrl(requestUrl.searchParams.get("ticketmasterImageUrl"));
  const seatgeek = normalizeUrl(requestUrl.searchParams.get("seatgeekImageUrl"));
  const unsplash = normalizeUrl(requestUrl.searchParams.get("unsplashImageUrl"));

  if (spotify) candidates.set("spotify", spotify);
  if (ticketmaster) candidates.set("ticketmaster", ticketmaster);
  if (seatgeek) candidates.set("seatgeek", seatgeek);
  if (unsplash) candidates.set("unsplash", unsplash);

  for (const source of priorityForEntity(entityType)) {
    const candidate = candidates.get(source);
    if (candidate) return candidate;
  }

  return null;
}

async function searchPexels(query: string, perPage: number): Promise<NormalizedImageResult[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return [];

  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`,
    {
      headers: { Authorization: apiKey },
      cache: "force-cache",
      next: { revalidate },
    },
  );

  if (!response.ok) return [];

  const data = (await response.json()) as {
    photos?: Array<{
      id: number;
      alt?: string;
      url?: string;
      width?: number;
      height?: number;
      photographer?: string;
      src?: {
        original?: string;
        large2x?: string;
        large?: string;
        medium?: string;
      };
    }>;
  };

  return (data.photos || []).map((photo) => ({
    id: String(photo.id),
    alt: photo.alt || query,
    imageUrl: photo.src?.large2x || photo.src?.large || photo.src?.original || "",
    thumbUrl: photo.src?.medium || photo.src?.large || photo.src?.original || "",
    pageUrl: photo.url || "",
    photographer: photo.photographer || "Pexels",
    width: photo.width ?? null,
    height: photo.height ?? null,
  }));
}

async function searchUnsplash(query: string, perPage: number): Promise<NormalizedImageResult[]> {
  const apiKey = process.env.UNSPLASH_API_KEY || process.env.SPLASH_API_KEY;
  if (!apiKey) return [];

  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&client_id=${apiKey}`,
    {
      cache: "force-cache",
      next: { revalidate },
    },
  );

  if (!response.ok) return [];

  const data = (await response.json()) as {
    results?: Array<{
      id: string;
      alt_description?: string | null;
      description?: string | null;
      links?: { html?: string };
      width?: number;
      height?: number;
      user?: { name?: string };
      urls?: { regular?: string; small?: string; thumb?: string };
    }>;
  };

  return (data.results || []).map((photo) => ({
    id: photo.id,
    alt: photo.alt_description || photo.description || query,
    imageUrl: photo.urls?.regular || "",
    thumbUrl: photo.urls?.small || photo.urls?.thumb || photo.urls?.regular || "",
    pageUrl: photo.links?.html || "",
    photographer: photo.user?.name || "Unsplash",
    width: photo.width ?? null,
    height: photo.height ?? null,
  }));
}

function sizedImageUrl(rawUrl: string, width: number, height: number, quality: number) {
  const url = new URL(rawUrl);
  if (url.hostname.includes("unsplash.com")) {
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "crop");
    url.searchParams.set("w", String(width));
    url.searchParams.set("h", String(height));
    url.searchParams.set("q", String(quality));
  } else if (url.hostname.includes("pexels.com")) {
    url.searchParams.set("auto", "compress");
    url.searchParams.set("w", String(width));
    url.searchParams.set("h", String(height));
  }
  return url;
}

function fallbackImageUrl(query: string, width: number, height: number, quality: number) {
  const pool = [
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f",
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a",
    "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2",
    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3",
  ];
  return sizedImageUrl(pool[hashString(query) % pool.length], width, height, quality);
}

function redirectTo(url: URL) {
  return NextResponse.redirect(url, {
    status: 307,
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const entityType = parseEntityType(requestUrl.searchParams.get("entityType"));
  const query = requestUrl.searchParams.get("q") || DEFAULT_QUERY;
  const width = parseDimension(requestUrl.searchParams.get("w"), 1600);
  const height = parseDimension(requestUrl.searchParams.get("h"), 900);
  const quality = parseDimension(requestUrl.searchParams.get("qf"), 80);

  const preferredUrl = preferredProviderUrl(entityType, requestUrl);
  if (preferredUrl) {
    return redirectTo(sizedImageUrl(preferredUrl, width, height, quality));
  }

  try {
    const unsplash = await searchUnsplash(query, 8);
    if (unsplash.length) {
      const selected = unsplash[hashString(`${entityType}:${query}`) % unsplash.length];
      return redirectTo(sizedImageUrl(selected.imageUrl, width, height, quality));
    }

    const pexels = await searchPexels(query, 8);
    if (pexels.length) {
      const selected = pexels[hashString(`pexels:${entityType}:${query}`) % pexels.length];
      return redirectTo(sizedImageUrl(selected.imageUrl, width, height, quality));
    }
  } catch {
    // Fall through to deterministic fallback.
  }

  return redirectTo(fallbackImageUrl(query, width, height, quality));
}
