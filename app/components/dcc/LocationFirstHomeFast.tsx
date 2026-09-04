"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

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
    <main className="bg-[#070b10] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.13),transparent_32%),radial-gradient(circle_at_90%_10%,rgba(16,185,129,0.09),transparent_28%),#070b10]">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">Destination Command Center</p>
              <h1 className="mt-2 text-4xl font-black tracking-[-0.045em] sm:text-5xl lg:text-6xl">The public internet, by coordinates.</h1>
            </div>
            <button type="button" onClick={useCurrentLocation} disabled={locating} className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-300/15 disabled:cursor-wait disabled:opacity-60">
              {locating ? "Locating…" : "Use my location"}
            </button>
          </div>

          <p className="mt-4 max-w-3xl text-base leading-7 text-white/58 sm:text-lg">
            Enter anywhere on Earth or use your device location. DCC turns the result into a permanent coordinate page and loads the public machine-readable sources that apply there.
          </p>

          <form onSubmit={search} className="mt-7 flex max-w-4xl flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="dcc-location-search">Open a location</label>
            <input
              id="dcc-location-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Address, city, ZIP, airport, venue, port, landmark…"
              className="min-h-14 flex-1 rounded-2xl border border-white/12 bg-white/[0.055] px-5 text-base text-white outline-none placeholder:text-white/32 focus:border-cyan-300/55 focus:ring-2 focus:ring-cyan-300/10"
              autoComplete="off"
            />
            <button type="submit" disabled={searching} className="min-h-14 rounded-2xl bg-cyan-300 px-6 text-sm font-black uppercase tracking-[0.12em] text-[#031217] transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60">
              {searching ? "Finding…" : "Open location"}
            </button>
          </form>\n\n          <div className="mt-4 flex max-w-4xl flex-wrap gap-2" aria-label="Example locations">\n            <span className="py-2 text-xs font-bold uppercase tracking-[0.12em] text-white/45">Try an example:</span>\n            <button type="button" onClick={() => openLocation(39.85610, -104.67370)} className="rounded-full border border-white/12 px-3 py-2 text-xs font-bold text-white/75 hover:border-cyan-300/45">Denver Airport</button>\n            <button type="button" onClick={() => openLocation(18.34190, -64.93070)} className="rounded-full border border-white/12 px-3 py-2 text-xs font-bold text-white/75 hover:border-cyan-300/45">Charlotte Amalie</button>\n            <button type="button" onClick={() => openLocation(45.26180, -111.30800)} className="rounded-full border border-white/12 px-3 py-2 text-xs font-bold text-white/75 hover:border-cyan-300/45">Big Sky</button>\n            <button type="button" onClick={() => openLocation(39.66540, -105.20570)} className="rounded-full border border-white/12 px-3 py-2 text-xs font-bold text-white/75 hover:border-cyan-300/45">Red Rocks</button>\n          </div>

          {results.length > 1 ? (
            <div className="mt-3 grid max-w-4xl gap-2 rounded-2xl border border-white/10 bg-black/30 p-2">
              {results.map((result) => (
                <button key={result.id} type="button" onClick={() => openLocation(result.lat, result.lng)} className="rounded-xl px-4 py-3 text-left transition hover:bg-white/[0.07]">
                  <strong className="block text-sm text-white">{result.name}</strong>
                  <span className="mt-1 block text-xs text-white/42">{result.displayName}</span>
                </button>
              ))}
            </div>
          ) : null}

          {message ? <p className="mt-4 text-sm text-amber-200/80">{message}</p> : null}

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><p className="text-xs font-black text-white">No startup API waterfall</p><p className="mt-1 text-xs leading-5 text-white/42">The homepage is immediately usable before any location lookup begins.</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><p className="text-xs font-black text-white">Coordinates stay canonical</p><p className="mt-1 text-xs leading-5 text-white/42">Search and device location both route to the same five-decimal coordinate identity.</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><p className="text-xs font-black text-white">Live data loads where needed</p><p className="mt-1 text-xs leading-5 text-white/42">Weather, hazards and other sources load on the selected location page instead of blocking the homepage.</p></div>
          </div>
        </div>
      </section>
    </main>
  );
}
