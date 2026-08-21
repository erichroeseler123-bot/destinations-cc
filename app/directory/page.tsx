import type { Metadata } from "next";
import {
  sitemapEligibleLocations,
  discoverablePath,
} from "@/lib/dcc/sitemapArchitecture";

export const metadata: Metadata = {
  title: "Location Directory | Destination Command Center",
  description:
    "Browse high-confidence Destination Command Center location nodes by place type.",
  alternates: { canonical: "https://destinationcommandcenter.com/directory" },
  robots: { index: true, follow: true },
};

const LABELS = {
  city: "Cities",
  venue: "Venues",
  resort: "Resorts",
  port: "Ports",
  island: "Islands",
} as const;

export default function DirectoryPage() {
  const locations = sitemapEligibleLocations();
  const grouped = Object.entries(LABELS)
    .map(([type, label]) => ({
      type,
      label,
      locations: locations.filter((location) => location.type === type),
    }))
    .filter((group) => group.locations.length > 0);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-16">
        <header className="rounded-[2rem] border border-white/10 bg-zinc-900 p-8">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">
            Destination Command Center · public directory
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
            High-confidence location nodes.
          </h1>
          <p className="mt-5 max-w-3xl text-lg text-zinc-300">
            DCC can resolve any coordinate, but only locations with enough verified public context are promoted into
            the crawlable directory and XML sitemap system.
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">Indexability policy</h2>
              <p className="mt-2 max-w-3xl text-zinc-300">
                Arbitrary latitude/longitude pages remain available to humans and software, but they do not enter the
                public discovery surface automatically. Current directory entries must meet DCC's quality threshold.
              </p>
            </div>
            <a className="rounded-xl border border-white/10 px-4 py-2 text-sm" href="/sitemap.xml">
              XML sitemap
            </a>
          </div>
        </section>

        {grouped.map((group) => (
          <section key={group.type} className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">{group.label}</h2>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-300">
                {group.locations.length} nodes
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {group.locations.map((location) => (
                <a
                  key={`${location.lat},${location.lng}`}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-cyan-400/40 hover:bg-black/30"
                  href={discoverablePath(location)}
                >
                  <div className="font-semibold">{location.name}</div>
                  <div className="mt-1 text-sm text-zinc-400">
                    {location.lat.toFixed(5)}, {location.lng.toFixed(5)} · quality {location.qualityScore}
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
