"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ResolvedLocation = {
  id: string;
  name: string;
  displayName: string;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  countryCode?: string | null;
  lat: number;
  lng: number;
  type?: string | null;
};

type MachineItem = {
  id: string;
  title: string;
  description?: string | null;
  severity?: string | null;
  updatedAt?: string | null;
};

type MachineFeed = {
  available?: boolean;
  configured?: boolean;
  provider: string;
  kind: string;
  mode: string;
  items?: MachineItem[];
};

type LivePayload = {
  checkedAt?: string;
  cityNow?: {
    label?: string;
    summary?: string;
    signals?: Array<{ kind: string; label: string; source: string }>;
  };
  weather?: {
    available?: boolean;
    provider?: string;
    attribution?: string;
    current?: {
      temperatureF?: number | null;
      apparentTemperatureF?: number | null;
      description?: string | null;
      windMph?: number | null;
      humidityPercent?: number | null;
    };
    nextHours?: Array<{
      startTime?: string | null;
      temperature?: number | null;
      shortForecast?: string | null;
      probabilityOfPrecipitation?: number | null;
    }>;
  };
  ticketmaster?: {
    available?: boolean;
    configured?: boolean;
    events?: Array<{ id: string; name: string; url?: string; start?: string | null; venue?: string | null }>;
  };
  machineFeeds?: MachineFeed[];
  providerSlots?: Record<string, { available?: boolean; machineReadable?: boolean; liveItemCount?: number; mode?: string }>;
};

type LoadState = "locating" | "loading" | "ready" | "needs-location" | "error";

type LocationFirstHomeProps = {
  initialCoordinates?: { lat: number; lng: number } | null;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || "location";
}

function canonicalCoordinate(value: number) {
  return Number(value).toFixed(5);
}

function locationPath(lat: number, lng: number) {
  return `/location/${canonicalCoordinate(lat)}/${canonicalCoordinate(lng)}`;
}

function compactLocation(location: ResolvedLocation) {
  return [location.city || location.name, location.region, location.country]
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(", ");
}

function pretty(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[-_]/g, " ");
}

function shortTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`${response.status}`);
  return (await response.json()) as T;
}

export default function LocationFirstHome({ initialCoordinates = null }: LocationFirstHomeProps) {
  const router = useRouter();
  const [location, setLocation] = useState<ResolvedLocation | null>(null);
  const [live, setLive] = useState<LivePayload | null>(null);
  const [state, setState] = useState<LoadState>("locating");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResolvedLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadLive = useCallback(async (nextLocation: ResolvedLocation) => {
    setState("loading");
    setMessage(null);
    try {
      const cityName = nextLocation.city || nextLocation.name || "location";
      const params = new URLSearchParams({
        city: slugify(cityName),
        lat: String(nextLocation.lat),
        lng: String(nextLocation.lng),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "auto",
      });
      const payload = await fetchJson<LivePayload>(`/api/public/city-live?${params.toString()}`);
      setLocation(nextLocation);
      setLive(payload);
      setState("ready");
      try {
        window.localStorage.setItem("dcc:last-location", JSON.stringify(nextLocation));
      } catch {
        // Local persistence is optional.
      }
    } catch {
      setLocation(nextLocation);
      setState("error");
      setMessage("DCC found the place, but some live sources are unavailable right now.");
    }
  }, []);

  const resolveCoordinates = useCallback(async (lat: number, lng: number) => {
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
    const response = await fetchJson<{ results?: ResolvedLocation[] }>(`/api/public/location-resolve?${params.toString()}`);
    const resolved = response.results?.[0];
    if (!resolved || typeof resolved.lat !== "number" || typeof resolved.lng !== "number") {
      throw new Error("reverse_lookup_failed");
    }
    return resolved;
  }, []);

  const openCoordinatePage = useCallback((lat: number, lng: number, replace = false) => {
    const path = locationPath(lat, lng);
    if (replace) router.replace(path);
    else router.push(path);
  }, [router]);

  const useCurrentLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setState("needs-location");
      setMessage("Your browser does not provide device location. Enter an address or place instead.");
      return;
    }

    setState("locating");
    setMessage(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        openCoordinatePage(position.coords.latitude, position.coords.longitude, true);
      },
      () => {
        let restored: ResolvedLocation | null = null;
        try {
          const raw = window.localStorage.getItem("dcc:last-location");
          if (raw) restored = JSON.parse(raw) as ResolvedLocation;
        } catch {
          restored = null;
        }
        if (restored && typeof restored.lat === "number" && typeof restored.lng === "number") {
          setMessage("Location permission is off, so DCC restored your last selected place.");
          openCoordinatePage(restored.lat, restored.lng, true);
          return;
        }
        setState("needs-location");
        setMessage("Share your location or enter any address or place to open its DCC page.");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 },
    );
  }, [openCoordinatePage]);

  useEffect(() => {
    if (initialCoordinates) {
      let cancelled = false;
      void (async () => {
        try {
          const resolved = await resolveCoordinates(initialCoordinates.lat, initialCoordinates.lng);
          if (!cancelled) await loadLive(resolved);
        } catch {
          if (!cancelled) {
            await loadLive({
              id: `coordinate:${initialCoordinates.lat}:${initialCoordinates.lng}`,
              name: "Coordinate location",
              displayName: `${initialCoordinates.lat}, ${initialCoordinates.lng}`,
              lat: initialCoordinates.lat,
              lng: initialCoordinates.lng,
            });
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }
    useCurrentLocation();
    return undefined;
  }, [initialCoordinates, loadLive, resolveCoordinates, useCurrentLocation]);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearching(true);
    setResults([]);
    setMessage(null);
    try {
      const params = new URLSearchParams({ q: trimmed });
      const response = await fetchJson<{ results?: ResolvedLocation[] }>(`/api/public/location-resolve?${params.toString()}`);
      const nextResults = response.results || [];
      setResults(nextResults);
      if (nextResults.length === 1) openCoordinatePage(nextResults[0].lat, nextResults[0].lng);
      if (nextResults.length === 0) setMessage("No matching place found. Try an address, city, ZIP code, airport, venue, port, or landmark.");
    } catch {
      setMessage("Location search is unavailable right now.");
    } finally {
      setSearching(false);
    }
  }

  const machineItems = useMemo(
    () =>
      (live?.machineFeeds || []).flatMap((feed) =>
        feed.available
          ? (feed.items || []).map((item) => ({ ...item, provider: feed.provider, kind: feed.kind, mode: feed.mode }))
          : [],
      ),
    [live],
  );

  const activeProviders = useMemo(
    () => Object.entries(live?.providerSlots || {}).filter(([, value]) => value.available),
    [live],
  );

  const events = live?.ticketmaster?.available ? live.ticketmaster.events || [] : [];
  const weather = live?.weather;
  const coordinateUrl = location ? locationPath(location.lat, location.lng) : null;
  const apiUrl = location ? `/api/location/${canonicalCoordinate(location.lat)}/${canonicalCoordinate(location.lng)}` : null;

  return (
    <main className="min-h-screen bg-[#070b10] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.13),transparent_32%),radial-gradient(circle_at_90%_10%,rgba(16,185,129,0.09),transparent_28%),#070b10]">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">Destination Command Center</p>
              <h1 className="mt-2 text-4xl font-black tracking-[-0.045em] sm:text-5xl lg:text-6xl">The public internet, by coordinates.</h1>
            </div>
            <button type="button" onClick={useCurrentLocation} className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-300/15">
              Use my location
            </button>
          </div>

          <p className="mt-4 max-w-3xl text-base leading-7 text-white/58 sm:text-lg">
            Every latitude and longitude can become a DCC page. Your device or an entered address simply determines the coordinates; the coordinates are the permanent location key.
          </p>

          <form onSubmit={search} className="mt-7 flex max-w-4xl flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="dcc-location-search">Open another location</label>
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
          </form>

          {results.length > 1 ? (
            <div className="mt-3 grid max-w-4xl gap-2 rounded-2xl border border-white/10 bg-black/30 p-2">
              {results.map((result) => (
                <button key={result.id} type="button" onClick={() => openCoordinatePage(result.lat, result.lng)} className="rounded-xl px-4 py-3 text-left transition hover:bg-white/[0.07]">
                  <strong className="block text-sm text-white">{result.name}</strong>
                  <span className="mt-1 block text-xs text-white/42">{result.displayName}</span>
                </button>
              ))}
            </div>
          ) : null}

          {message ? <p className="mt-4 text-sm text-amber-200/80">{message}</p> : null}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        {state === "locating" ? (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-8">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Finding coordinates</p>
            <p className="mt-3 text-xl font-bold text-white">DCC is positioning the lens around you…</p>
          </div>
        ) : null}

        {state === "needs-location" ? (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-8">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Choose a location</p>
            <h2 className="mt-3 text-2xl font-black">Share your location or enter anywhere on Earth.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/52">DCC converts the selection to latitude and longitude, then generates the location page from the public sources that cover those coordinates.</p>
          </div>
        ) : null}

        {location ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200/70">Coordinate page</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">📍 {compactLocation(location)}</h2>
                <p className="mt-2 font-mono text-xs text-white/45">{canonicalCoordinate(location.lat)}, {canonicalCoordinate(location.lng)}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.1em]">
                  {coordinateUrl ? <a href={coordinateUrl} className="rounded-full border border-white/10 px-3 py-2 text-white/45 hover:text-white">Canonical page</a> : null}
                  {apiUrl ? <a href={apiUrl} className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-2 text-cyan-100/75 hover:bg-cyan-300/[0.1]">JSON / developer</a> : null}
                </div>
              </div>
              <div className="text-right text-xs text-white/35">
                <p>{state === "loading" ? "Refreshing public sources…" : `${activeProviders.length} provider slots active`}</p>
                {live?.checkedAt ? <p className="mt-1">Checked {shortTime(live.checkedAt)}</p> : null}
              </div>
            </div>

            {live?.cityNow?.summary ? (
              <article className="rounded-[28px] border border-cyan-300/18 bg-cyan-300/[0.06] p-6 sm:p-7">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/70">Live state</p>
                <h3 className="mt-2 text-xl font-black sm:text-2xl">{live.cityNow.label || "What is happening here now"}</h3>
                <p className="mt-3 max-w-4xl text-sm leading-7 text-white/58">{live.cityNow.summary}</p>
              </article>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-3">
              <article className="rounded-[26px] border border-white/10 bg-white/[0.04] p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Right now</p>
                {weather?.available ? (
                  <>
                    <div className="mt-3 flex items-end gap-3">
                      <strong className="text-5xl font-black">{weather.current?.temperatureF ?? "—"}°</strong>
                      <span className="pb-1 text-sm text-white/55">{weather.current?.description || "Current conditions"}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/38">
                      {weather.current?.apparentTemperatureF != null ? <span>Feels {weather.current.apparentTemperatureF}°</span> : null}
                      {weather.current?.humidityPercent != null ? <span>{weather.current.humidityPercent}% humidity</span> : null}
                      {weather.current?.windMph != null ? <span>{weather.current.windMph} mph wind</span> : null}
                    </div>
                    <p className="mt-4 text-[10px] text-white/25">{weather.attribution || weather.provider}</p>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-white/40">Live weather unavailable.</p>
                )}
              </article>

              <article className="rounded-[26px] border border-white/10 bg-white/[0.04] p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Public signals</p>
                <strong className="mt-3 block text-4xl font-black">{machineItems.length}</strong>
                <p className="mt-2 text-sm leading-6 text-white/45">Current machine-readable alerts, transport, traffic, earth, water, and other mapped observations returned for this coordinate.</p>
              </article>

              <article className="rounded-[26px] border border-white/10 bg-white/[0.04] p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Next 48 hours</p>
                <strong className="mt-3 block text-4xl font-black">{events.length}</strong>
                <p className="mt-2 text-sm leading-6 text-white/45">Nearby event records when the event provider is configured for this deployment.</p>
              </article>
            </div>

            {machineItems.length ? (
              <section className="rounded-[28px] border border-white/10 bg-white/[0.025] p-6 sm:p-7">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200/65">Live public feed</p>
                    <h3 className="mt-2 text-2xl font-black">What public systems are reporting</h3>
                  </div>
                  <span className="text-xs text-white/32">No-store · live observations</span>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {machineItems.slice(0, 12).map((item) => (
                    <article key={`${item.provider}:${item.id}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-200/60">{pretty(item.kind)} · {item.mode === "api-key" ? "API" : "public feed"}</p>
                      <h4 className="mt-2 text-sm font-bold leading-5 text-white">{item.title}</h4>
                      {item.description ? <p className="mt-2 line-clamp-3 text-xs leading-5 text-white/38">{item.description}</p> : null}
                      <p className="mt-3 text-[10px] text-white/25">{item.provider}{item.updatedAt ? ` · ${shortTime(item.updatedAt)}` : ""}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {events.length ? (
              <section className="rounded-[28px] border border-white/10 bg-white/[0.025] p-6 sm:p-7">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-200/65">Nearby events</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {events.slice(0, 6).map((event) => (
                    <a key={event.id} href={event.url || "#"} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:bg-white/[0.055]">
                      <h4 className="text-sm font-bold text-white">{event.name}</h4>
                      <p className="mt-2 text-xs text-white/38">{[event.venue, shortTime(event.start)].filter(Boolean).join(" · ")}</p>
                    </a>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-[28px] border border-white/10 bg-[#0b1118] p-6 sm:p-7">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/38">Source coverage</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(live?.providerSlots || {}).map(([name, slot]) => (
                  <span key={name} className={`rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] ${slot.available ? "border-emerald-300/20 bg-emerald-300/[0.07] text-emerald-100/75" : "border-white/8 bg-white/[0.025] text-white/28"}`}>
                    {pretty(name)} · {slot.available ? "live" : "not mapped"}
                  </span>
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </section>
    </main>
  );
}
