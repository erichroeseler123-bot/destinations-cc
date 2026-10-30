"use client";

import { FormEvent, useState, useId } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AskDccEntry from "@/app/components/AskDccEntry";

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
      {/* Destination Reference & Decision Engine Hero */}
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.15),transparent_35%),radial-gradient(circle_at_90%_10%,rgba(16,185,129,0.1),transparent_30%),#070b10]">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">Destination Command Center</p>
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-200">
                  Source-Backed Travel Decision Engine
                </span>
              </div>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-6xl lg:text-7xl max-w-4xl">
                What fits your trip?
              </h1>
            </div>

          </div>

          <p className="mt-5 max-w-3xl text-base leading-8 text-white/75 sm:text-xl">
            Compare the practical tradeoffs, see the research behind the answer, and choose your next step. Ask about New Orleans tours, Juneau excursions, or Colorado transportation. No account needed.
          </p>

          <div className="mt-7 max-w-4xl">
            <AskDccEntry />
          </div>

          {/* Existing planning tools and destination guides */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/juneau#port-day-decision-engine"
              className="px-6 py-4 bg-gradient-to-r from-cyan-400 to-emerald-400 text-black font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-cyan-500/25 hover:brightness-110 transition flex items-center gap-2"
            >
              <span>Check what fits your Juneau port day</span>
              <span>→</span>
            </Link>

            <Link
              href="#featured-destinations"
              className="px-5 py-4 bg-white/10 text-white font-black text-sm uppercase tracking-wider rounded-2xl border border-white/15 hover:bg-white/15 transition flex items-center gap-2"
            >
              <span>See destination guides</span>
              <span>↓</span>
            </Link>
          </div>

          {/* Coordinate Search Engine Form */}
          <details className="mt-10 max-w-4xl border-t border-white/10 pt-6">
            <summary className="cursor-pointer text-sm font-bold text-cyan-200 hover:text-white">
              Check weather and live conditions for a place
            </summary>
            <div className="mt-4">
              <button type="button" onClick={useCurrentLocation} disabled={locating} className="mb-3 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/20 disabled:cursor-wait disabled:opacity-60">
                {locating ? "Locating…" : "Use my location"}
              </button>
              <form
                role="search"
                aria-label="Coordinate and venue search"
                onSubmit={search}
                className="flex flex-col gap-3 sm:flex-row"
              >
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
                  {searching ? "Finding…" : "Check conditions"}
                </button>
              </form>

              <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Example locations">
                <span className="py-1 text-xs font-bold uppercase tracking-[0.12em] text-white/45">Example places:</span>
                <button type="button" onClick={() => openLocation(39.66540, -105.20570)} className="rounded-full border border-white/15 bg-white/[0.03] px-3.5 py-1.5 text-xs font-bold text-cyan-200 transition hover:border-cyan-400 hover:text-white">🎸 Red Rocks, CO</button>
                <button type="button" onClick={() => openLocation(39.48170, -106.03840)} className="rounded-full border border-white/15 bg-white/[0.03] px-3.5 py-1.5 text-xs font-bold text-white/80 transition hover:border-cyan-400 hover:text-white">⛷️ Breckenridge, CO</button>
                <button type="button" onClick={() => openLocation(39.75310, -105.23470)} className="rounded-full border border-white/15 bg-white/[0.03] px-3.5 py-1.5 text-xs font-bold text-white/80 transition hover:border-cyan-400 hover:text-white">🌊 Clear Creek Whitewater</button>
                <button type="button" onClick={() => openLocation(58.29890, -134.40530)} className="rounded-full border border-white/15 bg-white/[0.03] px-3.5 py-1.5 text-xs font-bold text-white/80 transition hover:border-cyan-400 hover:text-white">🚢 Juneau Cruise Port, AK</button>
              </div>

              <div aria-live="polite" aria-atomic="true">
                {results.length > 1 ? (
                  <div
                    role="region"
                    aria-label="Matching locations"
                    className="mt-3 grid max-w-4xl gap-2 rounded-2xl border border-white/15 bg-black/80 p-3 shadow-2xl"
                  >
                    <p className="px-2 pt-1 text-xs font-bold uppercase tracking-[0.12em] text-cyan-200/80">
                      {results.length} matching places found — choose a location:
                    </p>
                    {results.map((result) => (
                      <button key={result.id} type="button" onClick={() => openLocation(result.lat, result.lng)} className="rounded-xl px-4 py-3 text-left transition hover:bg-white/[0.1] border border-white/5">
                        <strong className="block text-sm text-white">{result.name}</strong>
                        <span className="mt-0.5 block text-xs text-white/50">{result.displayName}</span>
                      </button>
                    ))}
                  </div>
                ) : null}

                {message ? (
                  <p role="status" className="mt-4 text-sm text-amber-300">
                    {message}
                  </p>
                ) : null}
              </div>
            </div>
          </details>
        </div>
      </section>

      {/* Featured Destination Reference Guides */}
      <section id="featured-destinations" className="border-b border-white/10 bg-[#081018] py-16 sm:py-20 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div className="max-w-3xl">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">
                Curated Travel Reference + Live Coordinate Telemetry
              </span>
              <h2 className="mt-2 text-3xl sm:text-5xl font-black tracking-tight text-white">
                Flagship Destination Reference Guides
              </h2>
              <p className="mt-3 text-base text-white/65 leading-7">
                While any coordinate on Earth can be queried for live environmental signals, DCC&apos;s flagship destination references combine place-adapted geography, interactive decision engines, 6-factor entry dependency modeling, operational safety boundaries, and full source attribution.
              </p>
            </div>
            <Link
              href="/about#capability-matrix"
              className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-cyan-200 hover:bg-cyan-400/20"
            >
              View Capability Truth Matrix →
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Flagship 1: Juneau */}
            <article className="rounded-3xl border border-cyan-400/25 bg-gradient-to-b from-cyan-950/25 to-black/50 p-6 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-200">
                    Port &amp; Capital City · Alaska
                  </span>
                  <span className="font-mono text-xs text-white/45">58.30190, -134.41970</span>
                </div>
                <h3 className="mt-4 text-2xl font-black text-white">Juneau &amp; Gastineau Channel</h3>
                <p className="mt-2.5 text-sm leading-6 text-white/70">
                  Roadless state capital &amp; cruise port decision engine: evaluate whether one or two activities fit your port window, adjust berth/shuttle/tender assumptions, compare public/free vs. direct operator options, and inspect claim-level evidence.
                </p>
                <ul className="mt-4 space-y-1.5 text-xs text-white/65">
                  <li>• <strong>Decision Engine:</strong> Port window, dock transfer, check-in &amp; 90m return math</li>
                  <li>• <strong>Entry Rules:</strong> 6-factor nationality/passport/transit explorer</li>
                  <li>• <strong>Safety Boundary:</strong> Ceiling weather ≠ FAA Part 135 flight dispatch</li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-2">
                <Link
                  href="/juneau"
                  className="rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black hover:bg-cyan-300"
                >
                  Open Juneau Guide →
                </Link>
                <Link
                  href="/ports/juneau"
                  className="rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-xs font-bold text-white/80 hover:bg-white/[0.08]"
                >
                  Port View
                </Link>
                <Link
                  href="/location/58.30190/-134.41970"
                  className="rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-xs font-mono text-cyan-200 hover:bg-white/[0.08]"
                >
                  Coordinate Node
                </Link>
              </div>
            </article>

            {/* Flagship 2: Red Rocks */}
            <article className="rounded-3xl border border-cyan-400/25 bg-gradient-to-b from-cyan-950/25 to-black/50 p-6 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-200">
                    Mountain Venue &amp; Park · Colorado
                  </span>
                  <span className="font-mono text-xs text-white/45">39.66540, -105.20570</span>
                </div>
                <h3 className="mt-4 text-2xl font-black text-white">Red Rocks Park &amp; Amphitheatre</h3>
                <p className="mt-2.5 text-sm leading-6 text-white/70">
                  6,450 ft Fountain Formation amphitheatre reference: Upper North vs. Lower South lot &amp; stair grades, Jurassic Hogback rideshare egress bottleneck, Denver Arts &amp; Venues bag rules, and context-preserving shuttle handoffs.
                </p>
                <ul className="mt-4 space-y-1.5 text-xs text-white/65">
                  <li>• <strong>Ingress/Egress:</strong> Lot elevation grades &amp; post-encore pickup plans</li>
                  <li>• <strong>Live Feeds:</strong> Open-Meteo gusts/CAPE, NWS Boulder, GoSno endpoint</li>
                  <li>• <strong>Safety Boundary:</strong> Forecast storms ≠ official venue lightning holds</li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-2">
                <Link
                  href="/red-rocks"
                  className="rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black hover:bg-cyan-300"
                >
                  Open Red Rocks Guide →
                </Link>
                <Link
                  href="/venues/red-rocks-amphitheatre"
                  className="rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-xs font-bold text-white/80 hover:bg-white/[0.08]"
                >
                  Venue Node
                </Link>
                <Link
                  href="/location/39.66540/-105.20570"
                  className="rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-xs font-mono text-cyan-200 hover:bg-white/[0.08]"
                >
                  Coordinate Node
                </Link>
              </div>
            </article>

            {/* Flagship 3: Denver-Breckenridge Corridor */}
            <article className="rounded-3xl border border-cyan-400/25 bg-gradient-to-b from-cyan-950/25 to-black/50 p-6 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-200">
                    Alpine Transit Corridor · Colorado
                  </span>
                  <span className="font-mono text-xs text-white/45">39.48170, -106.03840</span>
                </div>
                <h3 className="mt-4 text-2xl font-black text-white">Denver–Breckenridge (I-70 &amp; CO-9)</h3>
                <p className="mt-2.5 text-sm leading-6 text-white/70">
                  80–104 mile climb from DEN/Denver (5,280 ft) over the Eisenhower–Johnson Memorial Tunnel (11,158 ft) to Breckenridge (9,600 ft): statutory CDOT Traction Law (Sept 1–May 31), Bustang/Pegasus/Summit Stage transit, and multi-point telemetry.
                </p>
                <ul className="mt-4 space-y-1.5 text-xs text-white/65">
                  <li>• <strong>Statutory Law:</strong> CO Rev Stat § 42-4-106 tire &amp; AWD rules</li>
                  <li>• <strong>Live Feeds:</strong> Multi-point Denver, EJMT divide &amp; Breckenridge weather</li>
                  <li>• <strong>Safety Boundary:</strong> Modeled snow ≠ CDOT COtrip Code 15/16 status</li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-2">
                <Link
                  href="/routes/denver-breckenridge"
                  className="rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black hover:bg-cyan-300"
                >
                  Open Corridor Guide →
                </Link>
                <Link
                  href="/transportation/colorado"
                  className="rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-xs font-bold text-white/80 hover:bg-white/[0.08]"
                >
                  CO Transit
                </Link>
                <Link
                  href="/location/39.48170/-106.03840"
                  className="rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-xs font-mono text-cyan-200 hover:bg-white/[0.08]"
                >
                  Coordinate Node
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Why Travelers, Developers & AI Systems Use DCC */}
      <section className="py-16 sm:py-24 px-5 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-cyan-300">
            Decision Engine + Evidence Architecture
          </span>
          <h2 className="mt-2 text-3xl sm:text-5xl font-black text-white">
            Verifiable Decisions First. Optional Booking Second.
          </h2>
          <p className="mt-4 text-base text-white/75 leading-7">
            DCC earns trust by helping people choose. Commercial connections support that purpose: we offer booking links where they help someone act on a decision, while keeping public transport, free activities, direct operator options, and marketplace options visible when relevant.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card 1: Travelers */}
          <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 to-black/40 p-8 flex flex-col justify-between backdrop-blur-xl relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-400/30">
                  For Travelers · Decision Engine
                </span>
                <span className="text-sm font-bold text-white/60">Use Without Buying Anything</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">Explore Destinations &amp; Compare Suitable Options</h3>
              <p className="mt-3 text-sm text-white/75 leading-6">
                Check real port windows, dock transfer friction, operator check-in cutoffs, mobility constraints, and return buffers. Compare public transport, free activities, direct operator options, and marketplace options side by side—with clear explanations of what is known or uncertain.
              </p>
              <ul className="mt-6 space-y-2.5 text-xs text-white/80">
                <li className="flex items-center gap-2">✓ <strong>Practical Constraints:</strong> Explicit transfer legs, check-in lead times, and local time zones</li>
                <li className="flex items-center gap-2">✓ <strong>Cited Evidence &amp; Uncertainty:</strong> Clear separation between verified facts, live telemetry, and unconfirmed details</li>
                <li className="flex items-center gap-2">✓ <strong>All Relevant Options Visible:</strong> Public transit, free trails, direct operators, and marketplace links</li>
                <li className="flex items-center gap-2">✓ <strong>Unbiased Suitability:</strong> Commercial relationships never determine recommendation ranking</li>
              </ul>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-3">
              <Link
                href="/juneau#port-day-decision-engine"
                className="px-5 py-3 bg-cyan-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-cyan-300 transition shadow-lg shadow-cyan-400/20"
              >
                Try Juneau Port-Day Decision Engine →
              </Link>
              <Link
                href="/about"
                className="px-5 py-3 bg-white/10 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-white/15 transition border border-white/10"
              >
                Sources &amp; Methodology
              </Link>
            </div>
          </div>

          {/* Card 2: Developers & AI Systems */}
          <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 to-black/40 p-8 flex flex-col justify-between backdrop-blur-xl relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/30">
                  For Developers &amp; AI Systems · Evidence Contracts
                </span>
                <span className="text-sm font-bold text-white/60">JSON API · OpenAPI 3.1</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">Access Documented APIs &amp; Evidence Contracts</h3>
              <p className="mt-3 text-sm text-white/75 leading-6">
                Query any coordinate for normalized public environmental feeds alongside linked destination reference claims, freshness timestamps, and explicit coverage and safety boundaries.
              </p>
              <div className="mt-5 rounded-2xl bg-black/60 p-4 border border-white/10 font-mono text-xs text-emerald-300 overflow-x-auto">
                <code>GET /api/location/58.30190/-134.41970</code>
                <div className="mt-2 text-white/60 text-[11px]">
                  Returns: weather, CAMS air quality, NWS alerts, NOAA gauges, USGS seismic, FAA METAR, travelReference, claimFreshness, decisionEngine.
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-3">
              <Link
                href="/developers"
                className="px-5 py-3 bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-emerald-300 transition shadow-lg shadow-emerald-400/20"
              >
                Read Developer &amp; OpenAPI Docs →
              </Link>
              <Link
                href="/scope.json"
                className="px-5 py-3 bg-white/10 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-white/15 transition border border-white/10"
              >
                Inspect /scope.json Contract
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.025] px-6 py-4 text-sm text-white/70">
          <span>
            Operate tours or transportation? Learn how DCC represents local operators and connects authorized booking APIs.
          </span>
          <Link
            href="/operators"
            className="font-bold text-cyan-300 hover:text-cyan-200 underline underline-offset-4"
          >
            For tour operators →
          </Link>
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
              See how our coordinate feeds and operational non-conflation guardrails work across high-attendance venues, mountain passes, and river recreation corridors:
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 flex flex-col justify-between">
              <div>
                <span className="text-3xl">🎸</span>
                <h3 className="text-lg font-black text-white mt-3">Red Rocks Concert Amphitheatre</h3>
                <p className="text-xs text-white/60 mt-2 leading-relaxed">
                  Concertgoer weather &amp; venue context: tracking high-elevation wind gusts, thunderstorm probability, sunset times, and official Red Rocks Park operating links (weather telemetry never replaces official venue lightning holds).
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-4">
                <Link
                  href="/location/39.66540/-105.20570"
                  className="text-xs font-extrabold text-cyan-300 hover:underline flex items-center gap-1"
                >
                  <span>Inspect Red Rocks Live Node</span>
                  <span>→</span>
                </Link>
                <Link
                  href="/red-rocks"
                  className="text-xs font-bold text-white/70 hover:text-white hover:underline"
                >
                  Reference Guide →
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 flex flex-col justify-between">
              <div>
                <span className="text-3xl">🎿</span>
                <h3 className="text-lg font-black text-white mt-3">Breckenridge & I-70 Corridor</h3>
                <p className="text-xs text-white/60 mt-2 leading-relaxed">
                  Winter corridor weather &amp; statutory reference: monitoring modeled mountain snowfall, freezing temperatures, NWS winter warnings, and official CDOT COtrip traction law links.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-4">
                <Link
                  href="/location/39.48170/-106.03840"
                  className="text-xs font-extrabold text-cyan-300 hover:underline flex items-center gap-1"
                >
                  <span>Inspect Breckenridge Live Node</span>
                  <span>→</span>
                </Link>
                <Link
                  href="/routes/denver-breckenridge"
                  className="text-xs font-bold text-white/70 hover:text-white hover:underline"
                >
                  Corridor Guide →
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 flex flex-col justify-between">
              <div>
                <span className="text-3xl">🌊</span>
                <h3 className="text-lg font-black text-white mt-3">Clear Creek Whitewater Rafting</h3>
                <p className="text-xs text-white/60 mt-2 leading-relaxed">
                  Live river &amp; water recreation intelligence: verified NOAA NWPS river gauge stages and flood categories alongside Open-Meteo GloFAS discharge estimates (outfitters determine commercial trip safety).
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

