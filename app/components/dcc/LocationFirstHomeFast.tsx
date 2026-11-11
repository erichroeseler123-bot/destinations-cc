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

export default function LocationFirstHomeFast({
  cruisePortCount = 629,
}: {
  cruisePortCount?: number;
}) {
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
      {/* Traveler Front Door Hero */}
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.15),transparent_35%),radial-gradient(circle_at_90%_10%,rgba(16,185,129,0.1),transparent_30%),#070b10]">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">
              Destination Command Center
            </p>
            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-200">
              Source-Backed Travel Decision Engine
            </span>
          </div>

          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            What fits your trip?
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-white/85 sm:text-xl">
            Compare tours, choose a cruise, find a ride, and check local conditions before you book.
          </p>

          <div className="mt-7 max-w-4xl">
            <AskDccEntry />
          </div>

          {/* Four Clear Ways to Start */}
          <div className="mt-12" aria-labelledby="ways-to-start-heading">
            <h2
              id="ways-to-start-heading"
              className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300"
            >
              Four ways to start
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* 1. Find tours and activities */}
              <div className="flex flex-col justify-between rounded-3xl border border-white/12 bg-white/[0.04] p-5">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                    1 · Destination Guides &amp; Tours
                  </span>
                  <h3 className="mt-1.5 text-xl font-black text-white">
                    Choose a destination guide
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    Start with a destination hub to compare pickup logistics, boat or vehicle types, free/public options, and schedule fit before you book.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/75">
                    <span className="text-white/50">Top hubs:</span>
                    <Link
                      href="/new-orleans/tours"
                      data-testid="dcc-destination-nola-tours-guide-link"
                      className="rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-1 font-bold text-cyan-200 hover:border-cyan-400 hover:text-white"
                    >
                      New Orleans
                    </Link>
                    <Link
                      href="/juneau"
                      className="rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-1 font-bold text-cyan-200 hover:border-cyan-400 hover:text-white"
                    >
                      Juneau
                    </Link>
                    <Link
                      href="/las-vegas/tours"
                      className="rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-1 font-bold text-cyan-200 hover:border-cyan-400 hover:text-white"
                    >
                      Las Vegas
                    </Link>
                  </div>
                </div>
                <div className="mt-5 pt-3 border-t border-white/10">
                  <Link
                    href="/destinations"
                    data-testid="dcc-start-find-tours"
                    className="inline-flex w-full items-center justify-between rounded-xl bg-cyan-400 px-4 py-3 text-xs font-black uppercase tracking-wider text-[#041217] transition hover:bg-cyan-300"
                  >
                    <span>Explore destinations</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>

              {/* 2. Plan a cruise */}
              <div className="flex flex-col justify-between rounded-3xl border border-emerald-400/25 bg-emerald-950/15 p-5">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                      2 · Cruises &amp; Shore Days
                    </span>
                    <span
                      data-testid="dcc-browse-cruise-ports-label"
                      className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-200"
                    >
                      {cruisePortCount} ports
                    </span>
                  </div>
                  <h3 className="mt-1.5 text-xl font-black text-white">
                    Plan a cruise
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    Choose the right ship style, check port-day shore excursions, or coordinate with your group.
                  </p>
                </div>
                <div className="mt-4 flex flex-col gap-2 pt-3 border-t border-white/10">
                  <Link
                    href="/cruises/fit"
                    data-testid="dcc-start-choose-cruise"
                    className="inline-flex items-center justify-between rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-xs font-bold text-white transition hover:border-cyan-400 hover:bg-white/[0.1]"
                  >
                    <span>Help me choose a cruise</span>
                    <span>→</span>
                  </Link>
                  <Link
                    href="/ports"
                    data-testid="dcc-hero-check-port-day"
                    className="inline-flex items-center justify-between rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-xs font-bold text-white transition hover:border-cyan-400 hover:bg-white/[0.1]"
                  >
                    <span>Find my port</span>
                    <span>→</span>
                  </Link>
                  <a
                    href="/go/dcc-to-cruise-promenade"
                    data-testid="dcc-hero-plan-my-cruise"
                    className="inline-flex items-center justify-between rounded-xl bg-emerald-400 px-3.5 py-2.5 text-xs font-black uppercase tracking-wider text-[#04140e] transition hover:bg-emerald-300"
                  >
                    <span>Plan with my group</span>
                    <span>→</span>
                  </a>
                  <a
                    href="/go/dcc-to-cruise-promenade?mode=import"
                    data-testid="dcc-start-upload-itinerary"
                    className="inline-flex items-center justify-between px-1 pt-1 text-xs font-semibold text-emerald-200 underline underline-offset-4 hover:text-white"
                  >
                    <span>Have a booked sailing? Upload your itinerary →</span>
                  </a>
                </div>
              </div>

              {/* 3. Find a ride */}
              <div className="flex flex-col justify-between rounded-3xl border border-white/12 bg-white/[0.04] p-5">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                    3 · Shuttles &amp; Transfers
                  </span>
                  <h3 className="mt-1.5 text-xl font-black text-white">
                    Plan airport, ski &amp; venue rides
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    Compare shared shuttles, private SUVs/vans, public buses, and winter road rules for your group size and ski gear.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/75">
                    <span className="text-white/50">Popular corridors:</span>
                    <Link
                      href="/transportation/colorado/denver-to-vail-shuttle-guide"
                      className="rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-1 font-bold text-cyan-200 hover:border-cyan-400 hover:text-white"
                    >
                      DEN to Vail
                    </Link>
                    <Link
                      href="/routes/denver-breckenridge"
                      className="rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-1 font-bold text-cyan-200 hover:border-cyan-400 hover:text-white"
                    >
                      Breckenridge
                    </Link>
                    <Link
                      href="/red-rocks-transportation"
                      className="rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-1 font-bold text-cyan-200 hover:border-cyan-400 hover:text-white"
                    >
                      Red Rocks
                    </Link>
                  </div>
                </div>
                <div className="mt-5 pt-3 border-t border-white/10">
                  <Link
                    href="/transportation/colorado"
                    data-testid="dcc-start-find-ride"
                    className="inline-flex w-full items-center justify-between rounded-xl bg-cyan-400 px-4 py-3 text-xs font-black uppercase tracking-wider text-[#041217] transition hover:bg-cyan-300"
                  >
                    <span>Colorado &amp; I-70 ride planner</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>

              {/* 4. Check local conditions */}
              <div className="flex flex-col justify-between rounded-3xl border border-white/12 bg-white/[0.04] p-5">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                    4 · Weather &amp; Alerts
                  </span>
                  <h3 className="mt-1.5 text-xl font-black text-white">
                    Check local conditions
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    Look up live weather, wind gusts, river levels, and travel advisories for any venue, port, or pass.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => openLocation(39.66540, -105.20570)}
                      className="rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-1 font-bold text-cyan-200 hover:border-cyan-400 hover:text-white"
                    >
                      Red Rocks
                    </button>
                    <button
                      type="button"
                      onClick={() => openLocation(58.29890, -134.40530)}
                      className="rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-1 font-bold text-cyan-200 hover:border-cyan-400 hover:text-white"
                    >
                      Juneau Port
                    </button>
                  </div>
                </div>
                <div className="mt-5 pt-3 border-t border-white/10">
                  <a
                    href="#local-conditions"
                    onClick={() => {
                      const el = document.getElementById(locationSearchInputId);
                      if (el) el.focus();
                    }}
                    data-testid="dcc-start-check-conditions"
                    className="inline-flex w-full items-center justify-between rounded-xl bg-cyan-400 px-4 py-3 text-xs font-black uppercase tracking-wider text-[#041217] transition hover:bg-cyan-300"
                  >
                    <span>Search a place</span>
                    <span>↓</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Open Place & Local Conditions Search */}
          <div
            id="local-conditions"
            className="mt-10 max-w-4xl rounded-3xl border border-white/12 bg-white/[0.03] p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-white">
                  Check local conditions for any place
                </h2>
                <p className="mt-1 text-sm text-white/65">
                  Search a city, cruise port, mountain pass, venue, or landmark for current weather and advisories.
                </p>
              </div>
              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={locating}
                className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-bold text-cyan-100 transition hover:bg-cyan-300/20 disabled:cursor-wait disabled:opacity-60"
              >
                {locating ? "Locating…" : "Use my location"}
              </button>
            </div>

            <form
              role="search"
              aria-label="Coordinate and venue search"
              onSubmit={search}
              className="mt-4 flex flex-col gap-3 sm:flex-row"
            >
              <label className="sr-only" htmlFor={locationSearchInputId}>
                Open a location
              </label>
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
              <span className="py-1 text-xs font-bold uppercase tracking-[0.12em] text-white/45">
                Popular checks:
              </span>
              <button
                type="button"
                onClick={() => openLocation(39.66540, -105.20570)}
                className="rounded-full border border-white/15 bg-white/[0.03] px-3.5 py-1.5 text-xs font-bold text-cyan-200 transition hover:border-cyan-400 hover:text-white"
              >
                🎸 Red Rocks, CO
              </button>
              <button
                type="button"
                onClick={() => openLocation(39.48170, -106.03840)}
                className="rounded-full border border-white/15 bg-white/[0.03] px-3.5 py-1.5 text-xs font-bold text-white/80 transition hover:border-cyan-400 hover:text-white"
              >
                ⛷️ Breckenridge, CO
              </button>
              <button
                type="button"
                onClick={() => openLocation(39.75310, -105.23470)}
                className="rounded-full border border-white/15 bg-white/[0.03] px-3.5 py-1.5 text-xs font-bold text-white/80 transition hover:border-cyan-400 hover:text-white"
              >
                🌊 Clear Creek Whitewater
              </button>
              <button
                type="button"
                onClick={() => openLocation(58.29890, -134.40530)}
                className="rounded-full border border-white/15 bg-white/[0.03] px-3.5 py-1.5 text-xs font-bold text-white/80 transition hover:border-cyan-400 hover:text-white"
              >
                🚢 Juneau Cruise Port, AK
              </button>
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
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => openLocation(result.lat, result.lng)}
                      className="rounded-xl border border-white/5 px-4 py-3 text-left transition hover:bg-white/[0.1]"
                    >
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
        </div>
      </section>

      {/* Short Destination Cards — One Clear Action Each */}
      <section id="featured-destinations" className="border-b border-white/10 bg-[#081018] py-14 sm:py-18 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-8">
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">
              Featured Destinations
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-black tracking-tight text-white">
              Start with a destination guide
            </h2>
            <p className="mt-2 text-sm sm:text-base text-white/70">
              Compare local logistics, transfer times, and practical options in our most-requested destinations.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-3xl border border-white/12 bg-white/[0.03] p-6 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
                  Louisiana · Tours &amp; Port
                </span>
                <h3 className="mt-2 text-xl font-black text-white">New Orleans</h3>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Compare airboats vs. covered swamp boats, French Quarter hotel pickup, and Mississippi riverboats.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-white/10">
                <Link
                  href="/new-orleans/tours"
                  className="inline-flex w-full items-center justify-between rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black hover:bg-cyan-300"
                >
                  <span>Explore New Orleans</span>
                  <span>→</span>
                </Link>
              </div>
            </article>

            <article className="rounded-3xl border border-white/12 bg-white/[0.03] p-6 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
                  Nevada · Tours &amp; Day Trips
                </span>
                <h3 className="mt-2 text-xl font-black text-white">Las Vegas</h3>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Compare Grand Canyon helicopter flights, Hoover Dam half-day trips, and Red Rock Canyon tours.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-white/10">
                <Link
                  href="/las-vegas/tours"
                  className="inline-flex w-full items-center justify-between rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black hover:bg-cyan-300"
                >
                  <span>Explore Las Vegas</span>
                  <span>→</span>
                </Link>
              </div>
            </article>

            <article className="rounded-3xl border border-white/12 bg-white/[0.03] p-6 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
                  Alaska · Cruise Port
                </span>
                <h3 className="mt-2 text-xl font-black text-white">Juneau</h3>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Check Auke Bay whale watching, Mendenhall Glacier timing, and dock or tender transfer windows.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-white/10">
                <Link
                  href="/ports/juneau"
                  className="inline-flex w-full items-center justify-between rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black hover:bg-cyan-300"
                >
                  <span>Open Juneau port guide</span>
                  <span>→</span>
                </Link>
              </div>
            </article>

            <article className="rounded-3xl border border-white/12 bg-white/[0.03] p-6 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
                  Colorado · Mountain Rides
                </span>
                <h3 className="mt-2 text-xl font-black text-white">Denver–Breckenridge</h3>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Compare airport shuttles, Bustang/Pegasus coaches, private SUVs, and I-70 winter traction rules.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-white/10">
                <Link
                  href="/routes/denver-breckenridge"
                  className="inline-flex w-full items-center justify-between rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black hover:bg-cyan-300"
                >
                  <span>Open ride guide</span>
                  <span>→</span>
                </Link>
              </div>
            </article>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 flex flex-col justify-between">
              <div>
                <span className="text-2xl">🎸</span>
                <h3 className="text-lg font-black text-white mt-3">Red Rocks Concert Amphitheatre</h3>
                <p className="text-xs text-white/65 mt-1.5 leading-relaxed">
                  Compare concert shuttle pickups, parking lot stairs, and show-night wind and weather conditions.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10">
                <Link
                  href="/red-rocks"
                  className="text-xs font-extrabold text-cyan-300 hover:underline inline-flex items-center gap-1"
                >
                  <span>Open Red Rocks guide</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 flex flex-col justify-between">
              <div>
                <span className="text-2xl">🎿</span>
                <h3 className="text-lg font-black text-white mt-3">Breckenridge & I-70 Corridor</h3>
                <p className="text-xs text-white/65 mt-1.5 leading-relaxed">
                  Check mountain pass snowfall, freezing temperatures, and official CDOT traction law status.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10">
                <Link
                  href="/location/39.48170/-106.03840"
                  className="text-xs font-extrabold text-cyan-300 hover:underline inline-flex items-center gap-1"
                >
                  <span>Check Breckenridge conditions</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 flex flex-col justify-between">
              <div>
                <span className="text-2xl">🌊</span>
                <h3 className="text-lg font-black text-white mt-3">Clear Creek Whitewater Rafting</h3>
                <p className="text-xs text-white/65 mt-1.5 leading-relaxed">
                  Check NOAA river gauge stages and local canyon weather before heading out on the water.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10">
                <Link
                  href="/location/39.75310/-105.23470"
                  className="text-xs font-extrabold text-cyan-300 hover:underline inline-flex items-center gap-1"
                >
                  <span>Check Clear Creek conditions</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Short "How we check" section replacing machine-contract sections */}
      <section
        id="how-we-check"
        data-testid="dcc-how-we-check-section"
        className="py-14 sm:py-18 px-5 sm:px-8 max-w-7xl mx-auto"
      >
        <div className="rounded-3xl border border-white/12 bg-white/[0.03] p-6 sm:p-8">
          <div className="max-w-3xl">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
              For Travelers · Source-Backed Travel Decision Engine
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black text-white">
              How we check
            </h2>
            <p className="mt-3 text-sm sm:text-base leading-7 text-white/75">
              Use Destination Command Center without buying anything. We compare public transport, free activities, direct operator options, and marketplace options side by side so you can see what fits before you commit.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <h3 className="text-sm font-bold text-white">1. Real transfer &amp; check-in math</h3>
              <p className="mt-1.5 text-xs leading-5 text-white/70">
                For cruise ports and timed venues, we factor in dock-to-meeting transfers, operator check-in lead times, and return buffers. When a ship window is unknown, we label options <strong>Sailing fit unverified</strong>.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <h3 className="text-sm font-bold text-white">2. Live availability &amp; local feeds</h3>
              <p className="mt-1.5 text-xs leading-5 text-white/70">
                Timing fit and seat availability are tracked separately. We check live public weather, road, and water feeds alongside provider seat availability for your date and group size.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <h3 className="text-sm font-bold text-white">3. Clear boundaries before you book</h3>
              <p className="mt-1.5 text-xs leading-5 text-white/70">
                Commercial relationships never change whether a tour fits your schedule. You can browse exact provider links anytime, or use prepared checkout once timing and live seats are confirmed.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-white/60">
            <span>
              Want to see our sources, methodology, or partner integrations?
            </span>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/about" className="font-bold text-cyan-300 hover:underline">
                Sources &amp; methodology →
              </Link>
              <Link href="/operators" className="font-bold text-white/75 hover:text-white hover:underline">
                For tour operators →
              </Link>
              <Link href="/developers" className="font-bold text-white/75 hover:text-white hover:underline">
                For Developers &amp; AI Systems →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

