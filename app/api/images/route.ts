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

const DEFAULT_QUERY = "Las Vegas Strip night";
const DEFAULT_PER_PAGE = 5;
const MAX_PER_PAGE = 10;

export const revalidate = 86400;

function parsePerPage(value: string | null): number {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_PER_PAGE;
  }
  return Math.min(parsed, MAX_PER_PAGE);
}

async function searchPexels(query: string, perPage: number): Promise<NormalizedImageResult[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    throw new Error("missing_pexels_api_key");
  }

  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`,
    {
      headers: {
        Authorization: apiKey,
      },
      cache: "force-cache",
      next: { revalidate: 60 * 60 * 24 },
    }
  );

  if (!response.ok) {
    throw new Error(`pexels_${response.status}`);
  }

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
  if (!apiKey) {
    throw new Error("missing_unsplash_api_key");
  }

  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&client_id=${apiKey}`,
    {
      cache: "force-cache",
      next: { revalidate: 60 * 60 * 24 },
    }
  );

  if (!response.ok) {
    throw new Error(`unsplash_${response.status}`);
  }

  const data = (await response.json()) as {
    results?: Array<{
      id: string;
      alt_description?: string | null;
      description?: string | null;
      links?: {
        html?: string;
      };
      width?: number;
      height?: number;
      user?: {
        name?: string;
      };
      urls?: {
        regular?: string;
        small?: string;
        thumb?: string;
      };
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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || DEFAULT_QUERY;
  const provider = (
    url.searchParams.get("provider") ||
    url.searchParams.get("source") ||
    "pexels"
  ).toLowerCase();
  const perPage = parsePerPage(url.searchParams.get("per_page"));

  if (provider !== "pexels" && provider !== "unsplash") {
    return Response.json(
      {
        ok: false,
        error: "unsupported_provider",
        supportedProviders: ["pexels", "unsplash"],
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=300",
        },
      }
    );
  }

  try {
    const results =
      provider === "unsplash"
        ? await searchUnsplash(query, perPage)
        : await searchPexels(query, perPage);

    return Response.json(
      {
        ok: true,
        provider,
        query,
        count: results.length,
        results,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=86400",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "image_search_failed";
    return Response.json(
      {
        ok: false,
        provider,
        query,
        error: message,
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=300",
        },
      }
    );
  }
}
