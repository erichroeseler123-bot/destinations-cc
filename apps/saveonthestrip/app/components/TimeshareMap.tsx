"use client";

import { useEffect, useState } from "react";

type TimeshareMapProps = {
  query: string;
  label: string;
};

type GeocodeResult = {
  lat: string;
  lon: string;
};

function buildEmbedSrc(lat: number, lon: number) {
  const delta = 0.015;
  const left = lon - delta;
  const right = lon + delta;
  const top = lat + delta;
  const bottom = lat - delta;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lon}`;
}

export function TimeshareMap({ query, label }: TimeshareMapProps) {
  const [embedSrc, setEmbedSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadMap() {
      try {
        const url = new URL("https://nominatim.openstreetmap.org/search");
        url.searchParams.set("format", "jsonv2");
        url.searchParams.set("limit", "1");
        url.searchParams.set("q", query);

        const response = await fetch(url.toString(), {
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("geocode_failed");
        }

        const data = (await response.json()) as GeocodeResult[];
        const match = data[0];
        if (!match) {
          throw new Error("no_match");
        }

        const lat = Number(match.lat);
        const lon = Number(match.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          throw new Error("bad_coords");
        }

        if (!cancelled) {
          setEmbedSrc(buildEmbedSrc(lat, lon));
        }
      } catch {
        if (!cancelled) {
          setError(true);
        }
      }
    }

    loadMap();
    return () => {
      cancelled = true;
    };
  }, [query]);

  if (embedSrc) {
    return (
      <iframe
        title={`${label} map`}
        src={embedSrc}
        className="timeshare-map-frame"
        loading="lazy"
      />
    );
  }

  return (
    <div className="timeshare-map-fallback">
      <p>{error ? "Map could not be loaded right now." : "Loading map..."}</p>
      <a
        href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`}
        target="_blank"
        rel="noreferrer"
        className="button button-secondary"
      >
        Open in OpenStreetMap
      </a>
    </div>
  );
}
