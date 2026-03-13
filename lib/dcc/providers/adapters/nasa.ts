import type { ProviderAdapter } from "@/lib/dcc/providers/adapters/types";

export type NasaEonetQuery = { days?: number };
export type NasaEonetEvent = {
  id: string;
  title: string;
  categories: string[];
  latest_at: string | null;
  geometry_type: string | null;
  coordinates: [number, number] | null;
  source_urls: string[];
};

export const nasaEonetAdapter: ProviderAdapter<NasaEonetQuery, NasaEonetEvent[]> = {
  id: "nasa_eonet",
  isConfigured: () => true,
  fetch: async (query) => {
    const now = new Date().toISOString();
    const days = Math.max(1, Math.min(query.days || 7, 30));
    try {
      const res = await fetch(
        `https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=${encodeURIComponent(String(days))}`,
        { headers: { Accept: "application/json" }, cache: "no-store" }
      );
      if (!res.ok) {
        return {
          ok: false,
          data: [],
          diagnostics: {
            source: "nasa_eonet",
            cache_status: "miss",
            stale: false,
            last_updated: now,
            fallback_reason: `events_http_${res.status}`,
          },
        };
      }
      const json = (await res.json()) as {
        events?: Array<{
          id?: string;
          title?: string;
          categories?: Array<{ title?: string }>;
          sources?: Array<{ url?: string }>;
          geometry?: Array<{ date?: string; type?: string; coordinates?: unknown }>;
        }>;
      };
      const data = (json?.events || [])
        .map((ev) => {
          const g = (ev.geometry || []).slice(-1)[0];
          const c = g?.coordinates;
          const coords =
            Array.isArray(c) &&
            c.length >= 2 &&
            Number.isFinite(Number(c[0])) &&
            Number.isFinite(Number(c[1]))
              ? ([Number(c[0]), Number(c[1])] as [number, number])
              : null;
          return {
            id: ev.id || "unknown",
            title: ev.title || "Unnamed event",
            categories: (ev.categories || []).map((x) => x.title || "").filter(Boolean),
            latest_at: g?.date || null,
            geometry_type: g?.type || null,
            coordinates: coords,
            source_urls: (ev.sources || []).map((s) => s.url || "").filter(Boolean).slice(0, 3),
          };
        });
      return {
        ok: true,
        data,
        diagnostics: {
          source: "nasa_eonet",
          cache_status: "bypass",
          stale: false,
          last_updated: now,
          fallback_reason: null,
        },
      };
    } catch {
      return {
        ok: false,
        data: [],
        diagnostics: {
          source: "nasa_eonet",
          cache_status: "miss",
          stale: false,
          last_updated: now,
          fallback_reason: "fetch_failed",
        },
      };
    }
  },
};
