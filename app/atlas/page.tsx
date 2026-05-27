import type { Metadata } from "next";
import PublicAtlasHero from "@/app/components/earthos/PublicAtlasHero";
import PublicAtlasMap from "@/app/components/earthos/PublicAtlasMap";
import { getPublicAtlasNodes, getPublicAtlasStats } from "@/lib/earthos/publicAtlas";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "EarthOS Atlas | Destination Command Center",
  description: "A public map of active, building, and emerging destination intelligence corridors.",
  alternates: { canonical: "/atlas" },
  robots: {
    index: false,
    follow: false,
  },
};

const doctrine = [
  {
    title: "DCC decides",
    copy: "The decision hub resolves the traveler question before the network sends anyone downstream.",
  },
  {
    title: "Satellites narrow",
    copy: "Focused surfaces compress a city, port, venue, or trip type into a smaller next move.",
  },
  {
    title: "Operators execute",
    copy: "Approved operator paths handle the real-world action only when that public path is ready.",
  },
  {
    title: "Marketplaces fallback",
    copy: "Fallback markets provide coverage when owned or controlled execution is unavailable.",
  },
];

export default function EarthOSAtlasPage() {
  const nodes = getPublicAtlasNodes();
  const stats = getPublicAtlasStats(nodes);
  const liveCount = stats.find((stat) => stat.status === "live")?.count || 0;

  return (
    <main className="min-h-screen overflow-hidden bg-[#05070b] text-white">
      <PublicAtlasHero nodeCount={nodes.length} liveCount={liveCount} />
      <PublicAtlasMap nodes={nodes} />

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(245,198,108,0.12),transparent_24%),linear-gradient(180deg,rgba(11,16,23,0.92),rgba(7,10,16,0.96))] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.32)] md:p-8">
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#f5c66c]">Network doctrine</div>
          <h2 className="mt-3 max-w-3xl text-3xl font-black uppercase tracking-[-0.04em] md:text-5xl">
            Public by design. Operational truth stays protected.
          </h2>
          <div className="mt-7 grid gap-4 md:grid-cols-4">
            {doctrine.map((item) => (
              <article key={item.title} className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-5">
                <h3 className="text-sm font-black uppercase tracking-[0.14em] text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/62">{item.copy}</p>
              </article>
            ))}
          </div>
          <p className="mt-7 max-w-4xl text-sm leading-7 text-white/48">
            The Atlas intentionally excludes revenue state, raw booking counts, checkout events,
            invalid telemetry details, do-not-touch warnings, private property data, and internal
            operator notes.
          </p>
        </div>
      </section>
    </main>
  );
}
