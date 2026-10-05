"use client";

import { FormEvent, useState, useId } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ResolvedLocation = {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
};

function canonicalCoordinate(value: number) {
  return Number(value).toFixed(5);
}

function locationPath(lat: number, lng: number) {
  return `/location/${canonicalCoordinate(lat)}/${canonicalCoordinate(lng)}`;
}

export default function LocationFirstHomeFast() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResolvedLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const locationSearchInputId = useId();

  function openLocation(lat: number, lng: number) {
    router.push(locationPath(lat, lng));
  }

  function useCurrentLocation() {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setMessage("Your browser does not provide device location. Enter an address or place instead.");
      return;
    }

    setLocating(true);
    setMessage(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        router.push(locationPath(position.coords.latitude, position.coords.longitude));
      },
      () => {
        setLocating(false);
        setMessage("Location permission is off. Enter any address, city, ZIP, airport, venue, port, or landmark instead.");
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 },
    );
  }

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || searching) return;

    setSearching(true);
    setResults([]);
    setMessage(null);
    try {
      const params = new URLSearchParams({ q: trimmed });
      const response = await fetch(`/api/public/location-resolve?${params.toString()}`);
      if (!response.ok) throw new Error(String(response.status));
      const payload = (await response.json()) as { results?: ResolvedLocation[] };
      const nextResults = payload.results || [];
      if (nextResults.length === 1) {
        openLocation(nextResults[0].lat, nextResults[0].lng);
        return;
      }
      setResults(nextResults);
      if (nextResults.length === 0) {
        setMessage("No matching place found. Try a more specific location.");
      }
    } catch {
      setMessage("Location search is unavailable right now.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <main className="bg-[#070b10] text-white font-sans selection:bg-cyan-500 selection:text-black">
      {/* Commercial Hero */}
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.15),transparent_35%),radial-gradient(circle_at_90%_10%,rgba(16,185,129,0.1),transparent_30%),#070b10]">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">Destination Command Center</p>
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-200">
                  Venue Widgets + Coordinate Intelligence API
                </span>
              </div>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-6xl lg:text-7xl max-w-4xl">
                The Coordinate Intelligence Platform for Outdoor Venues & Developers.
              </h1>
            </div>
            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={locating}
              className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-300/20 disabled:cursor-wait disabled:opacity-60"
            >
              {locating ? "Locating…" : "📍 Use my location"}
            </button>
          </div>

          <p className="mt-5 max-w-3xl text-base leading-8 text-white/70 sm:text-xl">
            Live, source-attributed weather, river flow gauges, hazard alerts, and ground logistics for any coordinate on Earth. Embed a live guest widget in 60 seconds or integrate our unified developer API.
          </p>

          {/* Dual Core Product Action Buttons */}
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/widget"
              className="px-6 py-4 bg-gradient-to-r from-cyan-400 to-emerald-400 text-black font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-cyan-500/25 hover:brightness-110 transition flex items-center gap-2"
            >
              <span>Customize Venue Widget</span>
              <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full font-extrabold">$39/mo</span>
            </Link>

            <Link
              href="/pricing"
              className="px-6 py-4 bg-white/10 text-white font-black text-sm uppercase tracking-wider rounded-2xl border border-white/15 hover:bg-white/15 transition flex items-center gap-2"
            >
              <span>View Commercial Pricing & API</span>
              <span>→</span>
            </Link>
          </div>

          {/* Coordinate Search Engine Form */}
          <div className="mt-12 pt-8 border-t border-white/10 max-w-4xl">
            <span className="text-xs font-bold uppercase tracking-wider text-white/50 block mb-2">
              Explore Live Data For Any Coordinate or Venue:
            </span>
            <form onSubmit={search} className="flex flex-col gap-3 sm:flex-row">
              <label className="sr-only" htmlFor={locationSearchInputId}>Open a location</label>
              <input
                id={locationSearchInputId}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Address, venue name, city, ZIP, airport, port, landmark…"
                className="min-h-14 flex-1 rounded-2xl border border-white/15 bg-white/[0.06] px-5 text-base text-white outline-none placeholder:text-white/40 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={searching}
                className="min-h-14 rounded-2xl bg-cyan-400 px-7 text-sm font-black uppercase tracking-[0.12em] text-[#031217] transition hover:bg-cyan-300 disabled:opacity-60 shadow-lg shadow-cyan-400/20"
              >
                {searching ? "Finding…" : "Inspect Node"}
              </button>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Example locations">
              <span className="py-1 text-xs font-bold uppercase tracking-[0.12em] text-white/45">Instant Live Nodes:</span>
              <button type="button" onClick={() => openLocation(39.66540, -105.20570)} className="rounded-full border border-white/15 bg-white/[0.03] px-3.5 py-1.5 text-xs font-bold text-cyan-200 transition hover:border-cyan-400 hover:text-white">🎸 Red Rocks, CO</button>
              <button type="button" onClick={() => openLocation(39.48170, -106.03840)} className="rounded-full border border-white/15 bg-white/[0.03] px-3.5 py-1.5 text-xs font-bold text-white/80 transition hover:border-cyan-400 hover:text-white">⛷️ Breckenridge, CO</button>
              <button type="button" onClick={() => openLocation(39.75310, -105.23470)} className="rounded-full border border-white/15 bg-white/[0.03] px-3.5 py-1.5 text-xs font-bold text-white/80 transition hover:border-cyan-400 hover:text-white">🌊 Clear Creek Whitewater</button>
              <button type="button" onClick={() => openLocation(58.29890, -134.40530)} className="rounded-full border border-white/15 bg-white/[0.03] px-3.5 py-1.5 text-xs font-bold text-white/80 transition hover:border-cyan-400 hover:text-white">🚢 Juneau Cruise Port, AK</button>
            </div>

            {results.length > 1 ? (
              <div className="mt-3 grid max-w-4xl gap-2 rounded-2xl border border-white/15 bg-black/80 p-3 shadow-2xl">
                {results.map((result) => (
                  <button key={result.id} type="button" onClick={() => openLocation(result.lat, result.lng)} className="rounded-xl px-4 py-3 text-left transition hover:bg-white/[0.1] border border-white/5">
                    <strong className="block text-sm text-white">{result.name}</strong>
                    <span className="mt-0.5 block text-xs text-white/50">{result.displayName}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {message ? <p className="mt-4 text-sm text-amber-300">{message}</p> : null}
          </div>
        </div>
      </section>

      {/* The 2 Core Products Section */}
      <section className="py-16 sm:py-24 px-5 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-cyan-300">
            Commercial Offerings
          </span>
          <h2 className="mt-2 text-3xl sm:text-5xl font-black text-white">
            Built for Venues. Built for Builders.
          </h2>
          <p className="mt-4 text-base text-white/70">
            Choose the interface that matches your workflow: zero-code embeddable widget or sub-second JSON API.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card 1: Widget */}
          <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 to-black/40 p-8 flex flex-col justify-between backdrop-blur-xl relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-400/30">
                  Venue Product #1
                </span>
                <span className="text-sm font-bold text-white/60">$39/mo or $349/yr</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">The "Know Before You Go" Widget</h3>
              <p className="mt-3 text-sm text-white/70 leading-6">
                Drop a live weather, hourly forecast, NWS severe warning, and NOAA river level widget onto your Squarespace, WordPress, or custom site in under 60 seconds.
              </p>
              <ul className="mt-6 space-y-2.5 text-xs text-white/80">
                <li className="flex items-center gap-2">✓ <strong>100% Whitelabel:</strong> Matches your venue branding</li>
                <li className="flex items-center gap-2">✓ <strong>Live River & Flood Gauges:</strong> NOAA NWPS verified flow data</li>
                <li className="flex items-center gap-2">✓ <strong>Official NWS Storm Alerts:</strong> Auto-populates active warnings</li>
                <li className="flex items-center gap-2">✓ <strong>Cut Phone Calls:</strong> Answers weather & condition questions automatically</li>
              </ul>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-3">
              <Link
                href="/widget"
                className="px-5 py-3 bg-cyan-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-cyan-300 transition shadow-lg shadow-cyan-400/20"
              >
                Launch Widget Configurator →
              </Link>
              <Link
                href="/pricing"
                className="px-5 py-3 bg-white/10 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-white/15 transition border border-white/10"
              >
                Pricing & Licenses
              </Link>
            </div>
          </div>

          {/* Card 2: API */}
          <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 to-black/40 p-8 flex flex-col justify-between backdrop-blur-xl relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/30">
                  Developer Product #2
                </span>
                <span className="text-sm font-bold text-white/60">Starts Free • $49/mo Builder</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">Coordinate Intelligence API</h3>
              <p className="mt-3 text-sm text-white/70 leading-6">
                Query any latitude and longitude on Earth to receive a unified, normalized JSON payload combining 6 authoritative public sources in milliseconds.
              </p>
              <div className="mt-5 rounded-2xl bg-black/60 p-4 border border-white/10 font-mono text-xs text-emerald-300 overflow-x-auto">
                <code>GET /api/location/39.66540/-105.20570</code>
                <div className="mt-2 text-white/60 text-[11px]">
                  Returns: weather, CAMS air quality, NWS alerts, NOAA gauges, USGS seismic, OSM points.
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-3">
              <Link
                href="/pricing"
                className="px-5 py-3 bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-emerald-300 transition shadow-lg shadow-emerald-400/20"
              >
                Get API Subscription →
              </Link>
              <Link
                href="/developers"
                className="px-5 py-3 bg-white/10 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-white/15 transition border border-white/10"
              >
                Read OpenAPI Spec
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Field-Tested Live Demonstrations */}
      <section className="border-t border-white/10 bg-[#090f16] py-16 sm:py-24 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-12">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
              Battle-Tested Case Studies
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-white">
              Live Production Demonstrations
            </h2>
            <p className="mt-3 text-base text-white/60">
              See how our coordinate feeds are used across high-attendance venues, mountain passes, and river recreation corridors:
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 flex flex-col justify-between">
              <div>
                <span className="text-3xl">🎸</span>
                <h4 className="text-lg font-black text-white mt-3">Red Rocks Concert Amphitheatre</h4>
                <p className="text-xs text-white/60 mt-2 leading-relaxed">
                  Real-time concertgoer intelligence: tracking high-elevation wind gusts, thunderstorm lightning holds, sunset times, and parking EV stations.
                </p>
              </div>
              <Link
                href="/location/39.66540/-105.20570"
                className="mt-6 text-xs font-extrabold text-cyan-300 hover:underline flex items-center gap-1"
              >
                <span>Inspect Red Rocks Live Node</span>
                <span>→</span>
              </Link>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 flex flex-col justify-between">
              <div>
                <span className="text-3xl">🎿</span>
                <h4 className="text-lg font-black text-white mt-3">Breckenridge & I-70 Corridor</h4>
                <p className="text-xs text-white/60 mt-2 leading-relaxed">
                  Severe winter weather transit intelligence: monitoring mountain pass snow depths, freezing temperatures, and traction law alerts.
                </p>
              </div>
              <Link
                href="/location/39.48170/-106.03840"
                className="mt-6 text-xs font-extrabold text-cyan-300 hover:underline flex items-center gap-1"
              >
                <span>Inspect Breckenridge Live Node</span>
                <span>→</span>
              </Link>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 flex flex-col justify-between">
              <div>
                <span className="text-3xl">🌊</span>
                <h4 className="text-lg font-black text-white mt-3">Clear Creek Whitewater Rafting</h4>
                <p className="text-xs text-white/60 mt-2 leading-relaxed">
                  Live river & water recreation intelligence: verified NOAA NWPS river gauge heights and flow volume in cubic feet per second for outfitters.
                </p>
              </div>
              <Link
                href="/location/39.75310/-105.23470"
                className="mt-6 text-xs font-extrabold text-cyan-300 hover:underline flex items-center gap-1"
              >
                <span>Inspect Clear Creek Live Node</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
