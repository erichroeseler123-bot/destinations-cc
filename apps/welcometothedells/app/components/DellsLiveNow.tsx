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
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/live", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Live conditions request failed: ${response.status}`);
        }
        return response.json();
      })
      .then((payload: LivePayload | null) => {
        if (controller.signal.aborted) return;
        if (payload) {
          setData(payload);
          setStatus("ready");
        } else {
          setStatus("error");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setStatus("error");
        }
      });

    return () => controller.abort();
  }, []);

  const isLoading = status === "loading";
  const weather = data?.weather ?? null;
  const river = data?.river ?? null;
  const riverTime = timeLabel(river?.observedAt);
  const guidance = data?.guidance ?? {
    headline: "Check conditions before locking the day in.",
    detail: isLoading
      ? "Loading current National Weather Service and USGS river observations for Wisconsin Dells."
      : "Live weather and river observations are temporarily unavailable, so keep an indoor backup and confirm operator schedules directly.",
    href: "/things-to-do",
    cta: "Browse things to do",
  };
  const caveat =
    data?.caveat ??
    "Live public observations are planning context only. They do not confirm that any attraction, tour, waterpark, river operator, road, or venue is open or operating.";

  return (
    <section
      id="live-conditions"
      className="section-shell"
      aria-labelledby="dells-live-heading"
      aria-live="polite"
      aria-busy={isLoading}
      style={{ minHeight: "360px" }}
    >
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
          <h3>
            {weather?.temperatureF != null
              ? `${weather.temperatureF}°F`
              : isLoading
                ? "Weather updating"
                : "Weather unavailable"}
          </h3>
          <p>
            {weather?.shortForecast ||
              (isLoading
                ? "Loading current National Weather Service context."
                : "Current National Weather Service context is temporarily unavailable.")}
          </p>
          <p>
            {weather?.precipitationProbabilityPct != null ? (
              <>
                <strong>{weather.precipitationProbabilityPct}%</strong> precipitation chance
              </>
            ) : isLoading ? (
              "Precipitation probability updating"
            ) : (
              "Precipitation probability unavailable"
            )}
          </p>
          <p>
            {weather?.windSpeed
              ? `Wind: ${weather.windSpeed}`
              : isLoading
                ? "Wind conditions updating"
                : "Wind conditions unavailable"}
          </p>
        </article>

        <article className="action-card">
          <p className="river-category">Wisconsin River · USGS 05404000</p>
          <h3>
            {river?.gageHeightFt != null
              ? `${river.gageHeightFt} ft`
              : isLoading
                ? "River data updating"
                : "River data unavailable"}
          </h3>
          <p>
            {river?.dischargeCfs != null
              ? `${river.dischargeCfs.toLocaleString()} cubic feet per second at the Wisconsin River gauge near Wisconsin Dells.`
              : isLoading
                ? "Loading current USGS river observations near Wisconsin Dells."
                : "Current USGS river observations are temporarily unavailable."}
          </p>
          <p>
            {riverTime
              ? `Observed about ${riverTime}${river?.provisional ? " · provisional data" : ""}`
              : isLoading
                ? "Observation timestamp updating"
                : "Observation timestamp unavailable"}
          </p>
        </article>

        <article className="action-card">
          <p className="river-category">Planning implication</p>
          <h3>{guidance.headline}</h3>
          <p>{guidance.detail}</p>
          <Link className="text-button" href={guidance.href}>{guidance.cta}</Link>
        </article>
      </div>

      <p style={{ marginTop: 18, opacity: 0.72, fontSize: 13 }}>
        {caveat} Sources: National Weather Service and U.S. Geological Survey.
      </p>
    </section>
  );
}
