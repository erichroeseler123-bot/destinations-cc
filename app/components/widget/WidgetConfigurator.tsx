"use client";

import { useState, useId } from "react";
import Link from "next/link";
import { WidgetTheme, WidgetAccent } from "./LiveEmbedWidget";

type PresetLocation = {
  name: string;
  category: string;
  lat: number;
  lng: number;
};

const PRESETS: PresetLocation[] = [
  { name: "Red Rocks Amphitheatre, CO", category: "Outdoor Concert Venue", lat: 39.6654, lng: -105.2057 },
  { name: "Breckenridge Ski Resort, CO", category: "Mountain Destination", lat: 39.4817, lng: -106.0384 },
  { name: "Clear Creek Whitewater Park, CO", category: "River & Rafting", lat: 39.7531, lng: -105.2347 },
  { name: "Juneau Cruise Port, AK", category: "Cruise Excursion Hub", lat: 58.2989, lng: -134.4053 },
  { name: "Honey Island Swamp, LA", category: "Adventure Boat Tours", lat: 30.2764, lng: -89.7042 },
];

export default function WidgetConfigurator() {
  const [lat, setLat] = useState<number>(39.6654);
  const [lng, setLng] = useState<number>(-105.2057);
  const [venueName, setVenueName] = useState<string>("Red Rocks Amphitheatre");
  const [theme, setTheme] = useState<WidgetTheme>("dark");
  const [accent, setAccent] = useState<WidgetAccent>("cyan");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [previewWidth, setPreviewWidth] = useState<"mobile" | "tablet" | "full">("full");
  const searchInputId = useId();
  const venueNameInputId = useId();

  // Module toggles
  const [modules, setModules] = useState<{ [key: string]: boolean }>({
    weather: true,
    forecast: true,
    alerts: true,
    water: true,
    air: true,
  });

  const [showBranding, setShowBranding] = useState(true);
  const [licenseKey, setLicenseKey] = useState("");

  const activeModuleString = Object.entries(modules)
    .filter(([_, active]) => active)
    .map(([key]) => key)
    .join(",");

  const keyParam = licenseKey.trim() ? `&key=${encodeURIComponent(licenseKey.trim())}` : "";
  const embedUrl = `/embed/v1/${lat.toFixed(5)}/${lng.toFixed(5)}?theme=${theme}&accent=${accent}&modules=${activeModuleString}&name=${encodeURIComponent(venueName)}${showBranding ? "" : "&branding=hide"}${keyParam}`;
  const fullEmbedUrl = `https://destinationcommandcenter.com${embedUrl}`;

  const snippetCode = `<iframe
  src="${fullEmbedUrl}"
  width="100%"
  height="480"
  frameborder="0"
  style="border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; max-width: 100%;"
  loading="lazy"
  title="${venueName} Live Venue Intelligence">
</iframe>`;

  const copySnippet = () => {
    navigator.clipboard.writeText(snippetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searching) return;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(`/api/public/location-resolve?q=${encodeURIComponent(searchQuery.trim())}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        setSearchResults(data.results);
      } else {
        setSearchError("No location found. Try adding a city, state, or ZIP code.");
      }
    } catch {
      setSearchError("Location search unavailable. Enter coordinates directly below if needed.");
    } finally {
      setSearching(false);
    }
  };

  const selectLocation = (result: any) => {
    setLat(result.lat);
    setLng(result.lng);
    setVenueName(result.name || result.displayName?.split(",")[0] || "Custom Venue");
    setSearchResults([]);
    setSearchQuery("");
  };

  const handleLocateMe = () => {
    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          setVenueName("My Current Location");
        },
        () => {
          alert("Location access was denied or timed out.");
        },
      );
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans text-white">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 mb-3">
          Sellable Venue Product #1
        </span>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
          The "Know Before You Go" Live Venue Widget
        </h1>
        <p className="mt-4 text-base sm:text-lg text-white/70">
          Embed live weather, hourly rain timelines, official NWS hazard alerts, and NOAA river flow gauges on your venue or tour website in 60 seconds.
        </p>
      </div>

      {/* Preset Quick Select */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-3">
          Instant Live Demonstrations:
        </p>
        <div className="flex flex-wrap gap-2.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => {
                setLat(preset.lat);
                setLng(preset.lng);
                setVenueName(preset.name.split(",")[0]);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                lat === preset.lat && lng === preset.lng
                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                  : "bg-white/[0.04] border-white/10 text-white/80 hover:bg-white/[0.08]"
              }`}
            >
              <span>{preset.name}</span>
              <span className="block text-[10px] opacity-60 font-normal mt-0.5">{preset.category}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Controls on Left, Preview & Snippet on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Customization Controls */}
        <div className="lg:col-span-5 bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-6">
          <h2 className="text-lg font-black tracking-tight text-white border-b border-white/10 pb-3 flex items-center justify-between">
            <span>Configure Widget</span>
            <span className="text-xs font-mono text-cyan-300">
              {lat.toFixed(4)}, {lng.toFixed(4)}
            </span>
          </h2>

          {/* 1. Location Finder */}
          <div>
            <label htmlFor={searchInputId} className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
              1. Venue Location
            </label>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                id={searchInputId}
                type="text"
                placeholder="Search venue, address, city, or ZIP…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={searching}
                className="px-4 py-2 bg-cyan-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-cyan-300 transition"
              >
                {searching ? "…" : "Search"}
              </button>
            </form>

            <button
              type="button"
              onClick={handleLocateMe}
              className="mt-2 text-[11px] font-semibold text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>📍</span> Use my device location
            </button>

            {searchError && <p className="text-xs text-red-400 mt-2">{searchError}</p>}

            {searchResults.length > 0 && (
              <div className="mt-3 bg-[#0d131f] border border-white/20 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectLocation(item)}
                    className="w-full text-left px-3 py-2 text-xs border-b border-white/10 hover:bg-cyan-500/10 transition block"
                  >
                    <div className="font-bold text-white">{item.name || item.displayName}</div>
                    <div className="text-[10px] text-white/50 truncate">{item.displayName}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Venue Display Name */}
          <div>
            <label htmlFor={venueNameInputId} className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
              2. Venue Title
            </label>
            <input
              id={venueNameInputId}
              type="text"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="e.g. Red Rocks Amphitheatre"
              className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* 3. Theme & Accent Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                Theme
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as WidgetTheme)}
                className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="dark">Dark Slate</option>
                <option value="midnight">Midnight Black</option>
                <option value="light">Crisp Light</option>
                <option value="transparent">Transparent Overlay</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                Accent Color
              </label>
              <select
                value={accent}
                onChange={(e) => setAccent(e.target.value as WidgetAccent)}
                className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="cyan">Neon Cyan</option>
                <option value="emerald">Alpine Emerald</option>
                <option value="sky">Clear Sky</option>
                <option value="amber">Warning Amber</option>
                <option value="rose">Sunset Rose</option>
              </select>
            </div>
          </div>

          {/* 4. Module Toggles */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
              Display Modules
            </label>
            <div className="space-y-2">
              {[
                { id: "weather", label: "Current Temp, Humidity & Wind Speed" },
                { id: "forecast", label: "Next 8-Hour Hourly Forecast Strip" },
                { id: "alerts", label: "Official NWS Severe Weather Warnings" },
                { id: "water", label: "Live River Gauges & Flood Stages (NOAA)" },
                { id: "air", label: "Air Quality (AQI) & UV Index" },
              ].map((mod) => (
                <label
                  key={mod.id}
                  className="flex items-center gap-2.5 text-xs text-white/80 cursor-pointer hover:text-white"
                >
                  <input
                    type="checkbox"
                    checked={modules[mod.id] || false}
                    onChange={(e) => setModules({ ...modules, [mod.id]: e.target.checked })}
                    className="rounded border-white/20 bg-black/40 text-cyan-400 focus:ring-cyan-400 h-4 w-4"
                  />
                  <span>{mod.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 5. Branding Options & Whitelabel License */}
          <div className="pt-2 border-t border-white/10 space-y-3">
            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span className="text-white/80 font-medium">Show "Powered by DCC" link</span>
              <input
                type="checkbox"
                checked={showBranding}
                onChange={(e) => setShowBranding(e.target.checked)}
                className="rounded border-white/20 bg-black/40 text-cyan-400 focus:ring-cyan-400 h-4 w-4"
              />
            </label>
            {!showBranding && (
              <div className="space-y-2">
                <p className="text-[11px] text-amber-300/90 font-medium">
                  ⭐ Whitelabel unbranded embeds require an active Venue License ($39/mo).
                </p>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                    Your Venue License Key
                  </label>
                  <input
                    type="text"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    placeholder="e.g. dcc_venue_..."
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-xs font-mono text-cyan-200 placeholder-white/30 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Interactive Preview & Snippet Generator */}
        <div className="lg:col-span-7 space-y-6">
          {/* Preview Container */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Live Interactive Preview</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </h2>

              {/* Viewport Width Switcher */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
                {(["mobile", "tablet", "full"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPreviewWidth(mode)}
                    className={`px-2.5 py-1 rounded-lg font-semibold uppercase text-[10px] tracking-wider transition ${
                      previewWidth === mode ? "bg-white/20 text-white" : "text-white/50 hover:text-white"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Frame */}
            <div
              className={`mx-auto transition-all duration-300 ${
                previewWidth === "mobile" ? "max-w-[360px]" : previewWidth === "tablet" ? "max-w-[540px]" : "w-full"
              }`}
            >
              <iframe
                src={embedUrl}
                className="w-full rounded-2xl border border-white/15 shadow-2xl min-h-[460px]"
                loading="eager"
                title="Widget Live Preview"
              />
            </div>
          </div>

          {/* Snippet Code Box */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-cyan-300">
                Ready-to-Paste Embed Snippet
              </h3>
              <button
                type="button"
                onClick={copySnippet}
                className="px-4 py-1.5 bg-cyan-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-cyan-300 transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
              >
                <span>{copied ? "✓ Copied!" : "Copy Code"}</span>
              </button>
            </div>

            <div className="relative">
              <pre className="bg-[#040810] border border-white/10 rounded-xl p-4 text-xs font-mono text-cyan-200/90 overflow-x-auto select-all">
                {snippetCode}
              </pre>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs text-white/60">
              <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5">WordPress Ready</div>
              <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5">Squarespace Ready</div>
              <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5">Wix / Webflow</div>
              <div className="bg-white/[0.02] p-2 rounded-lg border border-white/5">Zero Dependencies</div>
            </div>
          </div>

          {/* Upgrade & License Card */}
          <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 to-slate-900/60 p-6 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300">
                Commercial Venue Pass
              </span>
              <h3 className="text-xl font-black text-white mt-1">
                $39<span className="text-sm font-normal text-white/70">/month</span> or $349
                <span className="text-sm font-normal text-white/70">/year</span>
              </h3>
              <p className="text-xs text-white/70 mt-1 max-w-md">
                Unlocks whitelabel embed (no branding), custom domain authorization, guaranteed 99.9% SLA, and priority river/weather updates for your venue.
              </p>
            </div>

            <Link
              href="/pricing"
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-cyan-400 to-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl text-center shadow-lg shadow-cyan-500/25 hover:brightness-110 transition whitespace-nowrap"
            >
              Get Venue Pro Access →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
