import { getEnvOptional } from "@/lib/dcc/config/env";
import type { ProviderAdapter } from "@/lib/dcc/providers/adapters/types";

export type OpenSkyStateQuery = {
  lamin?: number;
  lomin?: number;
  lamax?: number;
  lomax?: number;
};

export type OpenSkyState = {
  icao24: string | null;
  callsign: string | null;
  origin_country: string | null;
  longitude: number | null;
  latitude: number | null;
  baro_altitude: number | null;
  on_ground: boolean | null;
  velocity: number | null;
  true_track: number | null;
  vertical_rate: number | null;
};

function n(v: unknown): number | null {
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}

export const openSkyFlightsAdapter: ProviderAdapter<
  OpenSkyStateQuery,
  OpenSkyState[]
> = {
  id: "opensky_flights",
  isConfigured: () => true,
  fetch: async (query) => {
    const now = new Date().toISOString();
    try {
      const url = new URL("https://opensky-network.org/api/states/all");
      if (
        [query.lamin, query.lomin, query.lamax, query.lomax].every(
          (v) => typeof v === "number"
        )
      ) {
        url.searchParams.set("lamin", String(query.lamin));
        url.searchParams.set("lomin", String(query.lomin));
        url.searchParams.set("lamax", String(query.lamax));
        url.searchParams.set("lomax", String(query.lomax));
      }

      const username = getEnvOptional("OPENSKY_USERNAME");
      const password = getEnvOptional("OPENSKY_PASSWORD");
      const headers: Record<string, string> = { Accept: "application/json" };
      if (username && password) {
        const token = Buffer.from(`${username}:${password}`).toString("base64");
        headers.Authorization = `Basic ${token}`;
      }

      const res = await fetch(url.toString(), {
        headers,
        cache: "no-store",
      });
      if (!res.ok) {
        return {
          ok: false,
          data: [],
          diagnostics: {
            source: "opensky_flights",
            cache_status: "miss",
            stale: false,
            last_updated: now,
            fallback_reason: `http_${res.status}`,
          },
        };
      }
      const json = (await res.json()) as { states?: unknown[][] };
      const states = Array.isArray(json.states) ? json.states : [];
      const mapped = states.map((s) => ({
        icao24: typeof s[0] === "string" ? s[0].trim() : null,
        callsign: typeof s[1] === "string" ? s[1].trim() : null,
        origin_country: typeof s[2] === "string" ? s[2] : null,
        longitude: n(s[5]),
        latitude: n(s[6]),
        baro_altitude: n(s[7]),
        on_ground: typeof s[8] === "boolean" ? s[8] : null,
        velocity: n(s[9]),
        true_track: n(s[10]),
        vertical_rate: n(s[11]),
      }));
      return {
        ok: true,
        data: mapped,
        diagnostics: {
          source: "opensky_flights",
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
          source: "opensky_flights",
          cache_status: "miss",
          stale: false,
          last_updated: now,
          fallback_reason: "fetch_failed",
        },
      };
    }
  },
};
