export const dynamicParams = false;

import Link from "next/link";
import { getEffectivePorts } from "@/lib/dcc/ports";
import { getRegionPorts, getRegionStaticParams } from "@/lib/dcc/regions";

type Port = {
  slug: string;
  name: string;
  area?: string;
  country?: string;
  tags?: string[];
  passenger_volume?: number;
};

/* REQUIRED for static export */
export async function generateStaticParams() {
  const effectivePorts = getEffectivePorts() as Port[];
  return getRegionStaticParams(effectivePorts);
}

// Next.js 16: params is Promise
export default async function RegionPage({
  params,
}: {
  params: Promise<{ region: string }>;
}) {
  const { region } = await params;
  const currentAreaSlug = region;
  const effectivePorts = getEffectivePorts() as Port[];

  const regionPorts = getRegionPorts(effectivePorts, currentAreaSlug);

  if (regionPorts.length === 0) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="max-w-6xl mx-auto px-6 py-16 space-y-6">
          <div className="text-xs tracking-[0.35em] uppercase text-zinc-500">
            Destination Command Center • Region
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight">Unknown Region</h1>
          <p className="text-zinc-400">No ports found for: <span className="font-mono text-zinc-200">{currentAreaSlug}</span></p>

          <div className="pt-6">
            <Link className="text-cyan-300 hover:text-cyan-200" href="/ports">
              ← Back to Ports Directory
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // display name from first matching port’s area
  const areaName = regionPorts[0]?.area || currentAreaSlug.replace(/-/g, " ");

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-16 space-y-10">
        <header className="space-y-3">
          <div className="text-xs tracking-[0.35em] uppercase text-zinc-500">
            Destination Command Center • Area
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight">
            {areaName} Cruise Ports
          </h1>

          <p className="text-zinc-400 max-w-2xl">
            Ports grouped by operational area for routing + itinerary intelligence.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-sm text-zinc-200 hover:bg-white/10"
              href="/ports"
            >
              Ports Directory
            </Link>
            <Link
              className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-sm text-zinc-200 hover:bg-white/10"
              href="/authority"
            >
              Authority Layer
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {regionPorts.map((port) => (
            <Link
              key={port.slug}
              href={`/ports/${port.slug}`}
              className="group rounded-3xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-bold leading-snug">{port.name}</div>
                  <div className="mt-2 text-sm text-zinc-500">
                    {port.country}
                  </div>

                  {Array.isArray(port.tags) && port.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {port.tags.slice(0, 4).map((t) => (
                        <span
                          key={t}
                          className="text-[11px] rounded-full border border-white/10 bg-black/30 px-2 py-1 text-zinc-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-cyan-300 font-bold group-hover:translate-x-1 transition-transform">
                  →
                </div>
              </div>

              <div className="mt-4 text-xs text-zinc-600 font-mono">
                /ports/{port.slug}
              </div>
            </Link>
          ))}
        </section>

        <div className="pt-8 border-t border-white/10">
          <Link className="text-zinc-400 hover:text-cyan-300" href="/ports">
            ← Back to Ports Directory
          </Link>
        </div>
      </div>
    </main>
  );
}
