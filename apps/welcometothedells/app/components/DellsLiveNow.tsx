"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type LivePayload = {
  generatedAt: string;
  weather: null | {
    temperatureF: number | null;
    shortForecast: string | null;
    precipitationProbabilityPct: number | null;
    windSpeed: string | null;
  };
  river: null | {
    dischargeCfs: number | null;
    gageHeightFt: number | null;
    observedAt: string | null;
    provisional: boolean;
  };
  guidance: {
    headline: string;
    detail: string;
    href: string;
    cta: string;
  };
  caveat: string;
};

function timeLabel(iso: string | null | undefined) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
    timeZoneName: "short",
  }).format(date);
}

export default function DellsLiveNow() {
  const [data, setData] = useState<LivePayload | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/live", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (payload) setData(payload);
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, []);

  if (!data) return null;

  const weather = data.weather;
  const river = data.river;
  const riverTime = timeLabel(river?.observedAt);

  return (
    <section className="section-shell" aria-labelledby="dells-live-heading">
      <div className="section-heading">
        <p className="eyebrow">Dells right now · public live feeds</p>
        <h2 id="dells-live-heading">Use current conditions to choose the shape of the day.</h2>
        <p>
          This panel reads fresh government data when the page loads. It is not stored as permanent destination truth and it never claims an operator is open.
        </p>
      </div>

      <div className="action-grid">
        <article className="action-card">
          <p className="river-category">Weather · NWS</p>
          <h3>{weather?.temperatureF != null ? `${weather.temperatureF}°F` : "Weather updating"}</h3>
          <p>{weather?.shortForecast || "Current National Weather Service context is temporarily unavailable."}</p>
          {weather?.precipitationProbabilityPct != null ? (
            <p><strong>{weather.precipitationProbabilityPct}%</strong> precipitation chance</p>
          ) : null}
          {weather?.windSpeed ? <p>Wind: {weather.windSpeed}</p> : null}
        </article>

        <article className="action-card">
          <p className="river-category">Wisconsin River · USGS 05404000</p>
          <h3>{river?.gageHeightFt != null ? `${river.gageHeightFt} ft` : "River data updating"}</h3>
          <p>
            {river?.dischargeCfs != null
              ? `${river.dischargeCfs.toLocaleString()} cubic feet per second at the Wisconsin River gauge near Wisconsin Dells.`
              : "Current USGS river observations are temporarily unavailable."}
          </p>
          {riverTime ? <p>Observed about {riverTime}{river?.provisional ? " · provisional data" : ""}</p> : null}
        </article>

        <article className="action-card">
          <p className="river-category">Planning implication</p>
          <h3>{data.guidance.headline}</h3>
          <p>{data.guidance.detail}</p>
          <Link className="text-button" href={data.guidance.href}>{data.guidance.cta}</Link>
        </article>
      </div>

      <p style={{ marginTop: 18, opacity: 0.72, fontSize: 13 }}>
        {data.caveat} Sources: National Weather Service and U.S. Geological Survey.
      </p>
    </section>
  );
}
