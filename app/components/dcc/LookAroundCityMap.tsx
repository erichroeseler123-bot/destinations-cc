"use client";

import Link from "next/link";
import { useMemo } from "react";

export type LookAroundDistrict = {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  vibeTags?: string[];
};

function streetViewHref(lat: number, lng: number) {
  const viewpoint = encodeURIComponent(`${lat},${lng}`);
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${viewpoint}`;
}

function mapHref(lat: number, lng: number) {
  const center = encodeURIComponent(`${lat},${lng}`);
  return `https://www.google.com/maps/@?api=1&map_action=map&center=${center}&zoom=15`;
}

export default function LookAroundCityMap({
  citySlug,
  cityName,
  districts,
}: {
  citySlug: string;
  cityName: string;
  districts: LookAroundDistrict[];
}) {
  const normalized = useMemo(
    () => districts.filter((district) => Number.isFinite(district.lat) && Number.isFinite(district.lng)).slice(0, 12),
    [districts]
  );

  if (!normalized.length) return null;

  const minLat = Math.min(...normalized.map((district) => district.lat));
  const maxLat = Math.max(...normalized.map((district) => district.lat));
  const minLng = Math.min(...normalized.map((district) => district.lng));
  const maxLng = Math.max(...normalized.map((district) => district.lng));
  const latSpan = Math.max(maxLat - minLat, 0.015);
  const lngSpan = Math.max(maxLng - minLng, 0.015);

  return (
    <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,12,25,0.97),rgba(4,8,17,0.98))] p-6 sm:p-8">
      <div className="max-w-3xl">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-200">Look Around the City</p>
        <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white sm:text-3xl">
          Drop into the parts of {cityName}
        </h2>
        <p className="mt-3 text-sm leading-6 text-white/68">
          Use DCC to understand the district, then jump straight into Google Street View to visually walk it yourself. DCC stores only the static district coordinates; Street View opens directly in Google Maps.
        </p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="relative min-h-[360px] overflow-hidden rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_18%_18%,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_78%_72%,rgba(59,130,246,0.15),transparent_26%),linear-gradient(180deg,rgba(12,20,38,0.98),rgba(5,10,21,0.98))]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:40px_40px]" />
          {normalized.map((district, index) => {
            const left = 8 + ((district.lng - minLng) / lngSpan) * 84;
            const top = 8 + (1 - (district.lat - minLat) / latSpan) * 84;
            return (
              <a
                key={district.slug}
                href={streetViewHref(district.lat, district.lng)}
                target="_blank"
                rel="noopener noreferrer"
                title={`Open Street View near ${district.name}`}
                className="group absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${left}%`, top: `${top}%` }}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-200/40 bg-cyan-300/15 text-xs font-black text-cyan-100 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur transition group-hover:scale-110 group-hover:bg-cyan-300/25">
                  {index + 1}
                </span>
              </a>
            );
          })}
          <div className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-black/40 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/58 backdrop-blur">
            District signal map • not a heatmap
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {normalized.map((district, index) => (
            <article key={district.slug} className="rounded-[22px] border border-white/10 bg-white/[0.045] p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-200/30 bg-cyan-300/10 text-xs font-black text-cyan-100">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-black uppercase tracking-[-0.02em] text-white">{district.name}</h3>
                  {district.vibeTags?.length ? (
                    <p className="mt-1 text-xs leading-5 text-white/46">{district.vibeTags.slice(0, 3).join(" • ")}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={streetViewHref(district.lat, district.lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-300/15"
                    >
                      Open Street View →
                    </a>
                    <Link
                      href={`/${citySlug}/watch/${district.slug}`}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/74 hover:bg-white/10"
                    >
                      Stalk this district →
                    </Link>
                    <a
                      href={mapHref(district.lat, district.lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/52 hover:bg-white/5"
                    >
                      Map
                    </a>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
