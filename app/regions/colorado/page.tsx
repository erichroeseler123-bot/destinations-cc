import type { Metadata } from "next";
import Link from "next/link";
import TravelReferenceExperience from "@/app/components/dcc/TravelReferenceExperience";
import { getTravelReferenceNodeById } from "@/lib/dcc/travelReference";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Colorado Regional Travel Reference, Corridors & Coordinate Nodes | Destination Command Center",
  description:
    "Colorado regional travel reference connecting Denver, Red Rocks Amphitheatre, the I-70 Denver–Breckenridge mountain corridor, Idaho Springs, and live Front Range/Summit County coordinate intelligence.",
  alternates: { canonical: "/regions/colorado" },
};

export default function ColoradoRegion() {
  const corridorRef = getTravelReferenceNodeById("denver-breckenridge");

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        <header className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">DCC Regional Reference Node</p>
          <h1 className="mt-3 text-4xl md:text-5xl font-black tracking-tight">Colorado Front Range &amp; I-70 Mountain Corridor</h1>
          <p className="mt-4 text-zinc-300 max-w-3xl leading-7">
            Connect stable Colorado travel reference guidance—altitude acclimatization, statutory I-70 winter traction rules, public Bustang/Pegasus transit, and concert-night venue egress—with live multi-point coordinate telemetry.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              className="rounded-2xl border border-cyan-400/25 bg-cyan-400/[0.06] px-5 py-4 hover:bg-cyan-400/[0.12] transition"
              href="/routes/denver-breckenridge"
            >
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300">Primary Corridor Reference</div>
              <div className="mt-1 font-bold text-white">Denver–Breckenridge (I-70 &amp; CO-9)</div>
              <div className="mt-1 text-xs text-zinc-300">Traction law, transit, divide weather →</div>
            </Link>
            <Link
              className="rounded-2xl border border-cyan-400/25 bg-cyan-400/[0.06] px-5 py-4 hover:bg-cyan-400/[0.12] transition"
              href="/red-rocks"
            >
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300">Flagship Venue Reference</div>
              <div className="mt-1 font-bold text-white">Red Rocks Amphitheatre</div>
              <div className="mt-1 text-xs text-zinc-300">Lots, altitude, lightning policy, shuttles →</div>
            </Link>
            <Link
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 hover:bg-white/10 transition"
              href="/cities/denver"
            >
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">City Hub</div>
              <div className="mt-1 font-bold text-white">Denver City Reference</div>
              <div className="mt-1 text-xs text-zinc-300">Union Station, DEN airport, urban staging →</div>
            </Link>
            <Link
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 hover:bg-white/10 transition"
              href="/regions/colorado/idaho-springs"
            >
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Corridor Waypoint</div>
              <div className="mt-1 font-bold text-white">Idaho Springs</div>
              <div className="mt-1 text-xs text-zinc-300">Clear Creek staging + Mighty Argo access →</div>
            </Link>
          </div>
        </header>
      </div>

      {corridorRef ? <TravelReferenceExperience node={corridorRef} embedded /> : null}
    </main>
  );
}
