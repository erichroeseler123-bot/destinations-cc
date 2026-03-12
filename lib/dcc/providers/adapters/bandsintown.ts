import { getEnvOptional } from "@/lib/dcc/config/env";
import type { ProviderAdapter } from "@/lib/dcc/providers/adapters/types";

export type BandsintownArtistQuery = {
  artist: string;
};

export type BandsintownArtistRecord = {
  id: string | number | null;
  name: string | null;
  image_url: string | null;
  thumb_url: string | null;
  url: string | null;
};

export const bandsintownAdapter: ProviderAdapter<BandsintownArtistQuery, BandsintownArtistRecord | null> = {
  id: "bandsintown_artist",
  isConfigured: () => Boolean(getEnvOptional("BANDSINTOWN_APP_ID")),
  fetch: async (query) => {
    const now = new Date().toISOString();
    const appId = getEnvOptional("BANDSINTOWN_APP_ID");
    if (!appId) {
      return {
        ok: false,
        data: null,
        diagnostics: {
          source: "bandsintown_artist",
          cache_status: "miss",
          stale: false,
          last_updated: now,
          fallback_reason: "missing_app_id",
        },
      };
    }

    try {
      const artist = String(query.artist || "").trim();
      if (!artist) {
        return {
          ok: false,
          data: null,
          diagnostics: {
            source: "bandsintown_artist",
            cache_status: "miss",
            stale: false,
            last_updated: now,
            fallback_reason: "missing_artist",
          },
        };
      }

      const url = new URL(`https://rest.bandsintown.com/artists/${encodeURIComponent(artist)}`);
      url.searchParams.set("app_id", appId);

      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        return {
          ok: false,
          data: null,
          diagnostics: {
            source: "bandsintown_artist",
            cache_status: "miss",
            stale: false,
            last_updated: now,
            fallback_reason: `http_${res.status}`,
          },
        };
      }

      const json = (await res.json()) as {
        id?: string | number;
        name?: string;
        image_url?: string | null;
        thumb_url?: string | null;
        url?: string | null;
      };

      return {
        ok: true,
        data: {
          id: json.id ?? null,
          name: json.name || null,
          image_url: json.image_url || null,
          thumb_url: json.thumb_url || null,
          url: json.url || null,
        },
        diagnostics: {
          source: "bandsintown_artist",
          cache_status: "bypass",
          stale: false,
          last_updated: now,
          fallback_reason: null,
        },
      };
    } catch {
      return {
        ok: false,
        data: null,
        diagnostics: {
          source: "bandsintown_artist",
          cache_status: "miss",
          stale: false,
          last_updated: now,
          fallback_reason: "fetch_failed",
        },
      };
    }
  },
};
