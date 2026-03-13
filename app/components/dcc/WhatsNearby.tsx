"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type NearbyPoint = {
  id: string;
  class: "place" | "port";
  subclass?: string | null;
  slug: string;
  name: string;
  display_name?: string | null;
  canonical_path: string;
  distance_km: number;
  country_code?: string | null;
  admin1_code?: string | null;
  tags: string[];
};

type NearbyActivity = {
  place_id: string;
  place_slug: string;
  place_name: string;
  distance_km: number;
  counts: {
    tours: number;
    cruises: number;
    events: number;
    transport: number;
  };
};

type NearbyResponse = {
  center: {
    lat: number;
    lon: number;
    source: "coordinates" | "slug";
    slug?: string;
  };
  radius_km: number;
  pois: NearbyPoint[];
  activities: {
    total_places_with_actions: number;
    top_places: NearbyActivity[];
  };
  transport: NearbyPoint[];
  diagnostics: {
    candidate_nodes: number;
    generated_at: string;
  };
};

export default function WhatsNearby({
  placeSlug,
  lat,
  lon,
}: {
  placeSlug: string;
  lat?: number;
  lon?: number;
}) {
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [center, setCenter] = useState<{ lat?: number; lon?: number; source: "slug" | "device" }>({
    lat,
    lon,
    source: "slug",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NearbyResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadNearby() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("radius_km", String(radiusKm));
        params.set("limit", "8");
        if (typeof center.lat === "number" && typeof center.lon === "number") {
          params.set("lat", String(center.lat));
          params.set("lon", String(center.lon));
        } else {
          params.set("slug", placeSlug);
        }
        const res = await fetch(`/api/internal/nearby?${params.toString()}`, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`nearby_fetch_failed:${res.status}`);
        }
        const json = (await res.json()) as NearbyResponse;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError("Nearby lookup unavailable right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadNearby();
    return () => {
      cancelled = true;
    };
  }, [placeSlug, center.lat, center.lon, radiusKm]);

  const hasGeo = typeof navigator !== "undefined" && "geolocation" in navigator;

  async function useMyLocation() {
    if (!hasGeo) {
      setError("Geolocation is not supported in this browser.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 120000,
        });
      });
      setCenter({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        source: "device",
      });
    } catch {
      setError("Could not read your location. Using area center.");
      setCenter({ lat, lon, source: "slug" });
    } finally {
      setLoading(false);
    }
  }

  const centerLabel = useMemo(() => {
    if (!data) return "Area center";
    return center.source === "device" ? "Your location" : "Area center";
  }, [center.source, data]);

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-7 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-semibold text-lg">What&apos;s Nearby?</h3>
          <p className="text-xs text-zinc-500 uppercase tracking-wider">
            Dynamic nearby points, activities, and access
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <label className="text-zinc-400">Radius</label>
          <select
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-200"
          >
            <option value={10}>10 km</option>
            <option value={25}>25 km</option>
            <option value={50}>50 km</option>
            <option value={100}>100 km</option>
          </select>
          <button
            type="button"
            onClick={useMyLocation}
            className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-cyan-200 hover:bg-cyan-500/20"
          >
            Use my location
          </button>
        </div>
      </div>

      {loading ? <p className="text-sm text-zinc-400">Loading nearby results…</p> : null}
      {error ? <p className="text-sm text-amber-300">{error}</p> : null}

      {data ? (
        <>
          <p className="text-xs text-zinc-500">
            center={centerLabel} • lat={data.center.lat} • lon={data.center.lon} • radius=
            {data.radius_km}km • candidates={data.diagnostics.candidate_nodes}
          </p>

          <div className="grid lg:grid-cols-3 gap-4 text-sm">
            <div className="rounded-lg border border-white/10 bg-black/20 p-4 space-y-2">
              <h4 className="font-medium text-zinc-100">Nearby Points of Interest</h4>
              {data.pois.length > 0 ? (
                <ul className="space-y-1 text-zinc-300">
                  {data.pois.slice(0, 6).map((poi) => (
                    <li key={poi.id}>
                      <Link href={poi.canonical_path} className="hover:text-cyan-300">
                        {poi.display_name || poi.name}
                      </Link>
                      <span className="text-zinc-500"> • {poi.distance_km} km</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-500">No nearby POIs in range.</p>
              )}
            </div>

            <div className="rounded-lg border border-white/10 bg-black/20 p-4 space-y-2">
              <h4 className="font-medium text-zinc-100">Activities & Tours Nearby</h4>
              {data.activities.top_places.length > 0 ? (
                <ul className="space-y-1 text-zinc-300">
                  {data.activities.top_places.slice(0, 6).map((a) => (
                    <li key={a.place_id}>
                      <Link href={`/nodes/${a.place_slug}?alive=tours,cruises`} className="hover:text-cyan-300">
                        {a.place_name}
                      </Link>
                      <span className="text-zinc-500">
                        {" "}
                        • tours {a.counts.tours} • cruises {a.counts.cruises}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-500">No nearby action-rich places in range.</p>
              )}
            </div>

            <div className="rounded-lg border border-white/10 bg-black/20 p-4 space-y-2">
              <h4 className="font-medium text-zinc-100">Transport & Access Points</h4>
              {data.transport.length > 0 ? (
                <ul className="space-y-1 text-zinc-300">
                  {data.transport.slice(0, 6).map((t) => (
                    <li key={t.id}>
                      <Link href={t.canonical_path} className="hover:text-cyan-300">
                        {t.display_name || t.name}
                      </Link>
                      <span className="text-zinc-500"> • {t.distance_km} km</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-500">No nearby transport nodes in range.</p>
              )}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
