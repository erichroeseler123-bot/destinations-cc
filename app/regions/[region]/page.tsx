export const dynamicParams = false;

import Link from "next/link";
import portsData from "../../../data/ports.generated.json";

type Port = {
  slug: string;
  name: string;
  city: string;
  region: string;
  country: string;
};

const ports = portsData as Port[];

// IMPROVED: Added a safety check for 's' to prevent .replace() on undefined
function regionSlug(s: string | undefined | null) {
  if (!s) return "unknown"; 
  return s.toLowerCase().trim().replace(/\s+/g, "-");
}

/* REQUIRED for static export */
export async function generateStaticParams() {
  const regions = new Set<string>();

  for (const port of ports) {
    // Only add valid strings to the set
    if (port.region) {
      regions.add(regionSlug(port.region));
    }
  }

  return Array.from(regions).map((region) => ({ region }));
}

// NEXT.js 16 UPDATE: params must be treated as a Promise
export default async function RegionPage({
  params,
}: {
  params: Promise<{ region: string }>;
}) {
  // 1. Await the params before using them
  const resolvedParams = await params;
  const currentRegionSlug = resolvedParams.region;

  // 2. Filter ports using the resolved slug
  const regionPorts = ports.filter(
    (p) => p.region && regionSlug(p.region) === currentRegionSlug
  );

  // 3. Reconstruct name for display (Safely)
  const regionName = currentRegionSlug ? currentRegionSlug.replace(/-/g, " ") : "Unknown Region";

  return (
    <main className="max-w-5xl mx-auto px-6 py-20 space-y-12">
      <header className="space-y-4">
        <h1 className="text-4xl font-black capitalize tracking-tight">
          {regionName} Cruise Ports
        </h1>
        <div className="h-1 w-20 bg-cyan-500 rounded-full" />
      </header>

      {regionPorts.length === 0 ? (
        <div className="p-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
          <p className="text-zinc-400 text-lg">No ports found for this region.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {regionPorts.map((port) => (
            <div 
              key={port.slug}
              className="group p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl hover:border-cyan-500/50 transition-all"
            >
              <div className="flex justify-between items-center">
                <div>
                  <Link
                    href={`/ports/${port.slug}`}
                    className="text-xl font-bold text-white group-hover:text-cyan-400 transition"
                  >
                    {port.name}
                  </Link>
                  <p className="text-zinc-500 text-sm mt-1">
                    {port.city}, {port.country}
                  </p>
                </div>
                <div className="text-cyan-600 font-bold group-hover:translate-x-1 transition-transform">
                  →
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <section className="pt-12 border-t border-zinc-800">
        <Link href="/" className="text-zinc-400 hover:text-cyan-400 transition flex items-center gap-2">
          <span>←</span> Back to All Regions
        </Link>
      </section>
    </main>
  );
}
