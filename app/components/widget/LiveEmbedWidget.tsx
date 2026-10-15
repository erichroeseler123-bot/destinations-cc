"use client";

import { useState, useEffect } from "react";

export type WidgetTheme = "dark" | "light" | "midnight" | "transparent";
export type WidgetAccent = "cyan" | "emerald" | "sky" | "amber" | "rose";

export type LiveEmbedProps = {
  lat: number;
  lng: number;
  initialData: any;
  customName?: string | null;
  theme?: WidgetTheme;
  accent?: WidgetAccent;
  activeModules?: string[];
  showBranding?: boolean;
  licenseWarning?: string | null;
  licenseKey?: string | null;
};

function cToF(value: number | null | undefined): number | null {
  return typeof value === "number" ? Math.round((value * 9) / 5 + 32) : null;
}

function kmToMph(value: number | null | undefined): number | null {
  return typeof value === "number" ? Math.round(value * 0.621371) : null;
}

function formatHour(timeStr?: string): string {
  if (!timeStr) return "";
  const d = new Date(timeStr);
  if (!Number.isFinite(d.getTime())) return timeStr.slice(11, 16) || timeStr;
  return d.toLocaleTimeString([], { hour: "numeric" });
}

function aqiCategory(aqi: number | null | undefined) {
  if (aqi == null) return { label: "N/A", color: "bg-zinc-700 text-zinc-300" };
  if (aqi <= 50) return { label: "Good", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" };
  if (aqi <= 100) return { label: "Moderate", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40" };
  if (aqi <= 150) return { label: "Sensitive", color: "bg-orange-500/20 text-orange-300 border-orange-500/40" };
  return { label: "Unhealthy", color: "bg-red-500/20 text-red-300 border-red-500/40" };
}

const ACCENT_STYLES: Record<WidgetAccent, { text: string; bg: string; border: string; glow: string }> = {
  cyan: { text: "text-cyan-400", bg: "bg-cyan-400", border: "border-cyan-400/30", glow: "from-cyan-500/20" },
  emerald: { text: "text-emerald-400", bg: "bg-emerald-400", border: "border-emerald-400/30", glow: "from-emerald-500/20" },
  sky: { text: "text-sky-400", bg: "bg-sky-400", border: "border-sky-400/30", glow: "from-sky-500/20" },
  amber: { text: "text-amber-400", bg: "bg-amber-400", border: "border-amber-400/30", glow: "from-amber-500/20" },
  rose: { text: "text-rose-400", bg: "bg-rose-400", border: "border-rose-400/30", glow: "from-rose-500/20" },
};

const THEME_STYLES: Record<WidgetTheme, { wrapper: string; card: string; textPrimary: string; textMuted: string; border: string }> = {
  dark: {
    wrapper: "bg-[#0a0f16] text-white",
    card: "bg-white/[0.04] backdrop-blur-md",
    textPrimary: "text-white",
    textMuted: "text-white/60",
    border: "border-white/10",
  },
  midnight: {
    wrapper: "bg-[#030712] text-white",
    card: "bg-zinc-900/60 backdrop-blur-md",
    textPrimary: "text-white",
    textMuted: "text-zinc-400",
    border: "border-zinc-800",
  },
  light: {
    wrapper: "bg-slate-50 text-slate-900",
    card: "bg-white shadow-sm",
    textPrimary: "text-slate-900",
    textMuted: "text-slate-500",
    border: "border-slate-200",
  },
  transparent: {
    wrapper: "bg-transparent text-white",
    card: "bg-black/40 backdrop-blur-md",
    textPrimary: "text-white",
    textMuted: "text-white/60",
    border: "border-white/15",
  },
};

export default function LiveEmbedWidget({
  lat,
  lng,
  initialData,
  customName,
  theme = "dark",
  accent = "cyan",
  activeModules = ["weather", "forecast", "alerts", "water", "air"],
  showBranding = true,
  licenseWarning,
  licenseKey,
}: LiveEmbedProps) {
  const [data, setData] = useState(initialData);
  const [observationTime, setObservationTime] = useState<string>("live");

  const accentStyle = ACCENT_STYLES[accent] || ACCENT_STYLES.cyan;
  const themeStyle = THEME_STYLES[theme] || THEME_STYLES.dark;

  const isModuleActive = (mod: string) => activeModules.includes(mod);

  // Background auto-refresh every 5 minutes
  useEffect(() => {
    const keyParam = licenseKey ? `&key=${encodeURIComponent(licenseKey)}` : "";
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/location/${lat.toFixed(5)}/${lng.toFixed(5)}?scope=core${keyParam}`);
        if (res.ok) {
          const fresh = await res.json();
          setData(fresh);
          const checked = fresh.checkedAt ? new Date(fresh.checkedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "just now";
          setObservationTime(checked);
        }
      } catch {
        // preserve existing view
      }
    }, 300000);
    return () => clearInterval(interval);
  }, [lat, lng, licenseKey]);

  const weather = data?.now?.weather || data?.modules?.now?.weather;
  const air = data?.now?.airQuality || data?.modules?.now?.airQuality;
  const alerts = data?.hazards?.alerts || data?.modules?.hazards?.alerts || [];
  const hours = data?.conditions?.next12Hours || data?.modules?.conditions?.next12Hours || [];
  const gauges = data?.water?.nearbyGauges || data?.modules?.water?.nearbyGauges || [];
  const elevationM = data?.identity?.elevationM ?? data?.location?.elevationM;
  const elevationFt = elevationM != null ? Math.round(elevationM * 3.28084) : null;

  const displayName = customName || data?.location?.displayName || `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
  const aqiInfo = aqiCategory(air?.us_aqi);

  return (
    <article
      className={`w-full max-w-full rounded-2xl border ${themeStyle.border} ${themeStyle.wrapper} p-4 sm:p-5 font-sans transition-all`}
    >
      {/* License Warning Banner if whitelabel requested without active authorized license */}
      {licenseWarning && (
        <div className="mb-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-2.5 text-amber-200 text-xs flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 font-medium">
            <span>⚠️</span>
            <span>{licenseWarning}</span>
          </span>
          <a
            href="https://destinationcommandcenter.com/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-bold text-amber-300 hover:text-white whitespace-nowrap"
          >
            Upgrade License →
          </a>
        </div>
      )}

      {/* Header Bar */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 mb-3.5" style={{ borderColor: "inherit" }}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full animate-pulse ${accentStyle.bg}`} />
            <h2 className={`text-base font-extrabold tracking-tight truncate ${themeStyle.textPrimary}`}>
              {displayName}
            </h2>
          </div>
          <p className={`text-[11px] font-medium tracking-wide mt-0.5 ${themeStyle.textMuted}`}>
            Live Venue Conditions {elevationFt ? `• ${elevationFt.toLocaleString()} ft` : ""} • Coordinates {lat.toFixed(4)}°, {lng.toFixed(4)}°
          </p>
        </div>

        {isModuleActive("air") && air?.us_aqi != null && (
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${aqiInfo.color}`}>
            <span>AQI {Math.round(air.us_aqi)}</span>
            <span className="opacity-80 font-normal">({aqiInfo.label})</span>
          </div>
        )}
      </header>

      {/* Weather Warnings / NWS Alerts Banner */}
      {isModuleActive("alerts") && alerts.length > 0 && (
        <div className="mb-3.5 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-red-200 text-xs">
          <div className="flex items-center gap-2 font-bold text-red-400">
            <span className="text-sm">⚠️</span>
            <span>{alerts[0].event || "Official Weather Alert"}</span>
          </div>
          {alerts[0].headline && <p className="mt-1 line-clamp-2 text-red-200/90">{alerts[0].headline}</p>}
        </div>
      )}

      {/* Main Temperature & Conditions Strip */}
      {isModuleActive("weather") && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3.5">
          <div className={`col-span-2 rounded-xl p-3.5 border ${themeStyle.border} ${themeStyle.card} flex items-center justify-between`}>
            <div>
              <div className="flex items-baseline gap-1">
                <span className={`text-4xl sm:text-5xl font-black tracking-tighter ${themeStyle.textPrimary}`}>
                  {weather?.temperature_2m != null ? `${cToF(weather.temperature_2m)}°` : "—"}
                </span>
                <span className={`text-sm font-semibold uppercase ${themeStyle.textMuted}`}>F</span>
              </div>
              <p className={`text-xs font-semibold capitalize mt-0.5 ${accentStyle.text}`}>
                {weather?.description || "Clear"}
              </p>
            </div>
            <div className={`text-right text-xs leading-5 ${themeStyle.textMuted}`}>
              <div>Feels: <strong className={themeStyle.textPrimary}>{weather?.apparent_temperature != null ? `${cToF(weather.apparent_temperature)}°F` : "—"}</strong></div>
              <div>Humidity: <strong className={themeStyle.textPrimary}>{weather?.relative_humidity_2m != null ? `${Math.round(weather.relative_humidity_2m)}%` : "—"}</strong></div>
            </div>
          </div>

          <div className={`rounded-xl p-3 border ${themeStyle.border} ${themeStyle.card} flex flex-col justify-center`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${themeStyle.textMuted}`}>Wind & Gusts</span>
            <p className={`text-base font-extrabold mt-1 ${themeStyle.textPrimary}`}>
              {weather?.wind_speed_10m != null ? `${kmToMph(weather.wind_speed_10m)} mph` : "—"}
            </p>
            {weather?.wind_gusts_10m != null && (
              <span className={`text-[11px] ${accentStyle.text}`}>Gusts {kmToMph(weather.wind_gusts_10m)} mph</span>
            )}
          </div>

          <div className={`rounded-xl p-3 border ${themeStyle.border} ${themeStyle.card} flex flex-col justify-center`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${themeStyle.textMuted}`}>UV & Daylight</span>
            <p className={`text-base font-extrabold mt-1 ${themeStyle.textPrimary}`}>
              {air?.uv_index != null ? `UV ${air.uv_index.toFixed(1)}` : "—"}
            </p>
            <span className={`text-[11px] ${themeStyle.textMuted}`}>
              {weather?.is_day ? "Daylight active" : "Nighttime"}
            </span>
          </div>
        </div>
      )}

      {/* Hourly Forecast Timeline Strip */}
      {isModuleActive("forecast") && hours.length > 0 && (
        <div className="mb-3.5">
          <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${themeStyle.textMuted}`}>
            Next 8 Hours Outlook
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
            {hours.slice(0, 8).map((hour: any, idx: number) => (
              <div
                key={idx}
                className={`min-w-[68px] flex-1 flex flex-col items-center rounded-xl p-2 border ${themeStyle.border} ${themeStyle.card} text-center`}
              >
                <span className={`text-[10px] font-semibold ${themeStyle.textMuted}`}>{formatHour(hour.time)}</span>
                <span className={`text-sm font-black my-1 ${themeStyle.textPrimary}`}>
                  {hour.temperatureC != null ? `${cToF(hour.temperatureC)}°` : "—"}
                </span>
                <span className={`text-[10px] font-medium ${hour.precipitationProbability > 20 ? "text-cyan-400 font-bold" : themeStyle.textMuted}`}>
                  {hour.precipitationProbability != null ? `${Math.round(hour.precipitationProbability)}%` : "0%"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Water & River Gauges: Precise identification of Stream, Gauge Station, and Distance */}
      {isModuleActive("water") && (
        <div className={`rounded-xl p-3.5 mb-3 border ${themeStyle.border} ${themeStyle.card}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${accentStyle.text}`}>
              🌊 NOAA River & Flow Monitoring
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              NWPS Verified
            </span>
          </div>

          {gauges.length > 0 ? (
            <div className="space-y-2">
              {gauges.slice(0, 2).map((gauge: any, gIdx: number) => {
                const streamName = gauge.name?.split(" at ")[0]?.split(" near ")[0]?.split(" above ")[0] || gauge.name;
                const stationLoc = gauge.name?.includes(" at ")
                  ? `at ${gauge.name.split(" at ")[1]}`
                  : gauge.name?.includes(" near ")
                  ? `near ${gauge.name.split(" near ")[1]}`
                  : "";

                return (
                  <div key={gIdx} className="border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <strong className={themeStyle.textPrimary}>{streamName}</strong>
                        {stationLoc && <span className={`text-[11px] ml-1 ${themeStyle.textMuted}`}>{stationLoc}</span>}
                        <span className={`text-[10px] ml-1.5 ${themeStyle.textMuted}`}>({gauge.distanceKm} km away • {gauge.identifier})</span>
                      </div>
                      <span className={`font-semibold ${accentStyle.text}`}>
                        {typeof gauge.statusObserved === "object" && gauge.statusObserved !== null
                          ? (gauge.statusObserved.primary != null && gauge.statusObserved.primary > -900
                              ? `${gauge.statusObserved.primary} ${gauge.statusObserved.primaryUnit || "ft"}`
                              : gauge.statusObserved.floodCategory && gauge.statusObserved.floodCategory !== "no_flooding"
                              ? gauge.statusObserved.floodCategory
                              : "Active Flow")
                          : typeof gauge.statusObserved === "string"
                          ? gauge.statusObserved
                          : "Normal Flow"}
                      </span>
                    </div>
                  </div>
                );
              })}
              <p className={`text-[9px] pt-1 leading-normal ${themeStyle.textMuted}`}>
                Note: Confirm gauge station corresponds to your specific river put-in/take-out before making trip decisions.
              </p>
            </div>
          ) : (
            <p className={`text-xs ${themeStyle.textMuted}`}>
              No active NOAA NWPS river gauges mapped within 25 km of this coordinate.
            </p>
          )}
        </div>
      )}

      {/* Widget Footer & Attribution */}
      <footer className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-[10px]" style={{ borderColor: "inherit" }}>
        <span className={themeStyle.textMuted}>
          Data via NWS • NOAA • Open-Meteo • Observation: {observationTime}
        </span>

        {showBranding && (
          <a
            href="https://destinationcommandcenter.com/widget"
            target="_blank"
            rel="noopener noreferrer"
            className={`font-semibold transition hover:underline ${accentStyle.text}`}
          >
            Powered by Destination Command Center ↗
          </a>
        )}
      </footer>
    </article>
  );
}
