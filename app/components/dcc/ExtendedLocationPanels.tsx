"use client";

import { useEffect, useMemo, useState } from "react";

type Props = { lat: number; lng: number };

type Payload = {
  modules?: {
    nearby?: any[];
    aviation?: any[];
    coastal?: { coops?: any[]; ndbc?: any[] };
    winter?: { active?: boolean; currentSnowfallCm?: number; maxSnowDepthCm?: number; hours?: any[] };
  };
};

function canonical(value: number) {
  return Number(value).toFixed(5);
}

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5 sm:p-7">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/65">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-white sm:text-3xl">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function fmt(value: unknown, suffix = "") {
  return typeof value === "number" && Number.isFinite(value) ? `${Math.round(value * 10) / 10}${suffix}` : "—";
}

export default function ExtendedLocationPanels({ lat, lng }: Props) {
  const [payload, setPayload] = useState<Payload | null>(null);
  const apiUrl = `/api/location/${canonical(lat)}/${canonical(lng)}?scope=extended`;

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;

    const load = () => {
      void fetch(apiUrl, { cache: "default" })
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (!cancelled && data) setPayload(data);
        })
        .catch(() => null);
    };

    const idle = (window as any).requestIdleCallback as ((callback: () => void, options?: { timeout: number }) => number) | undefined;
    if (idle) idleId = idle(load, { timeout: 1200 });
    else timer = setTimeout(load, 350);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (idleId != null && (window as any).cancelIdleCallback) (window as any).cancelIdleCallback(idleId);
    };
  }, [apiUrl]);

  const nearby = payload?.modules?.nearby || [];
  const aviation = payload?.modules?.aviation || [];
  const coops = payload?.modules?.coastal?.coops || [];
  const ndbc = payload?.modules?.coastal?.ndbc || [];
  const winter = payload?.modules?.winter;

  const grouped = useMemo(() => {
    const groups: Record<string, any[]> = {};
    for (const item of nearby) (groups[item.kind] ||= []).push(item);
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [nearby]);

  if (!payload) return null;

  return (
    <div className="bg-[#070b10] text-white">
      <div className="mx-auto max-w-7xl space-y-5 px-5 pb-9 sm:px-8">
        {nearby.length ? (
          <Section eyebrow="Movement · infrastructure" title="What is physically around this coordinate">
            <div className="grid gap-4 xl:grid-cols-2">
              {grouped.map(([kind, items]) => (
                <div key={kind} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.14em] text-white/48">{titleCase(kind)}</h3>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {items.slice(0, 8).map((item: any) => (
                      <a key={item.id} href={item.website || item.osmUrl} className="rounded-xl border border-white/7 bg-white/[0.025] p-3 transition hover:border-cyan-300/20">
                        <p className="font-bold text-white">{item.name}</p>
                        <p className="mt-1 text-xs text-white/40">{fmt(item.distanceKm, " km away")}{item.operator ? ` · ${item.operator}` : ""}</p>
                        {(item.icao || item.iata || item.ref) ? <p className="mt-1 font-mono text-[10px] text-cyan-100/55">{[item.icao, item.iata, item.ref].filter(Boolean).join(" · ")}</p> : null}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        {aviation.length ? (
          <Section eyebrow="Aviation" title="Nearby airport weather and terminal forecasts">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {aviation.map((entry: any) => {
                const airport = entry.airport || {};
                const metar = entry.metar || {};
                return (
                  <div key={airport.id || airport.icao} className="rounded-2xl border border-white/8 bg-black/20 p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.13em] text-cyan-100/55">{airport.icao || airport.iata || "Airport"} · {fmt(airport.distanceKm, " km")}</p>
                    <h3 className="mt-2 text-lg font-black">{airport.name}</h3>
                    {entry.metar ? (
                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-white/52">
                        <div>Flight category <strong className="text-white">{metar.fltCat || "—"}</strong></div>
                        <div>Visibility <strong className="text-white">{metar.visib != null ? `${metar.visib} sm` : "—"}</strong></div>
                        <div>Wind <strong className="text-white">{metar.wdir != null ? `${metar.wdir}°` : "—"} {metar.wspd != null ? `${metar.wspd} kt` : ""}</strong></div>
                        <div>Altimeter <strong className="text-white">{metar.altim != null ? metar.altim : "—"}</strong></div>
                      </div>
                    ) : <p className="mt-3 text-xs text-white/35">No current METAR returned.</p>}
                    {entry.taf?.rawTAF ? <p className="mt-4 break-words font-mono text-[10px] leading-5 text-white/35">{entry.taf.rawTAF}</p> : null}
                  </div>
                );
              })}
            </div>
          </Section>
        ) : null}

        {(coops.length || ndbc.length) ? (
          <Section eyebrow="Coast · tides · buoys" title="Observed coastal and marine stations nearby">
            <div className="grid gap-5 lg:grid-cols-2">
              {coops.length ? (
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.13em] text-white/55">NOAA CO-OPS</h3>
                  <div className="mt-3 space-y-2">
                    {coops.map((station: any) => (
                      <a key={station.id} href={station.pageUrl} className="block rounded-2xl border border-white/8 bg-black/20 p-4">
                        <p className="font-bold">{station.name}</p>
                        <p className="mt-1 text-xs text-white/42">{station.id} · {fmt(station.distanceKm, " km away")}{station.tidal ? " · tidal" : ""}</p>
                        {station.observation?.v != null ? <p className="mt-2 text-sm text-cyan-100/70">Water level {station.observation.v} m MLLW</p> : null}
                        {station.predictions?.length ? <p className="mt-2 text-xs text-white/40">Next highs/lows: {station.predictions.slice(0, 4).map((p: any) => `${p.type || ""} ${p.v}m`).join(" · ")}</p> : null}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
              {ndbc.length ? (
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.13em] text-white/55">NOAA NDBC</h3>
                  <div className="mt-3 space-y-2">
                    {ndbc.map((station: any) => (
                      <a key={station.id} href={station.pageUrl} className="block rounded-2xl border border-white/8 bg-black/20 p-4">
                        <p className="font-bold">{station.name}</p>
                        <p className="mt-1 text-xs text-white/42">{station.id} · {fmt(station.distanceKm, " km away")}</p>
                        {station.latest ? (
                          <p className="mt-2 text-xs leading-5 text-cyan-100/65">
                            Wind {station.latest.WSPD != null ? `${station.latest.WSPD} m/s` : "—"} · Wave {station.latest.WVHT != null ? `${station.latest.WVHT} m` : "—"} · Water {station.latest.WTMP != null ? `${station.latest.WTMP}°C` : "—"}
                          </p>
                        ) : null}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </Section>
        ) : null}

        {winter?.active ? (
          <Section eyebrow="Snow · winter" title="Winter conditions at this coordinate">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/8 bg-black/20 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-white/35">Current snowfall</p><p className="mt-2 text-2xl font-black">{fmt(winter.currentSnowfallCm, " cm")}</p></div>
              <div className="rounded-2xl border border-white/8 bg-black/20 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-white/35">Max modeled snow depth</p><p className="mt-2 text-2xl font-black">{fmt(winter.maxSnowDepthCm, " cm")}</p></div>
            </div>
          </Section>
        ) : null}
      </div>
    </div>
  );
}
