import Link from "next/link";
import CinematicBackdrop from "@/app/components/dcc/CinematicBackdrop";
import RouteHeroMark from "@/app/components/dcc/RouteHeroMark";

function MiniIcon({ type }: { type: "arrow" | "compass" | "shield" }) {
  if (type === "arrow") {
    return (
      <svg viewBox="0 0 24 24" className="ml-2 h-4 w-4" aria-hidden>
        <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "shield") {
    return (
      <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" aria-hidden>
        <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M8.5 12l2.2 2.2 4.8-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M14.8 9.2l-1.6 4-4 1.6 1.6-4 4-1.6Z" fill="currentColor" />
    </svg>
  );
}

export default function PublicAtlasHero({
  nodeCount,
  liveCount,
}: {
  nodeCount: number;
  liveCount: number;
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-[#05070b]">
      <CinematicBackdrop variant="default" />
      <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <RouteHeroMark eyebrow="EarthOS Atlas" title="PUBLIC NETWORK MAP" tone="amber" />
            <h1 className="mt-6 max-w-5xl text-[clamp(3.4rem,9vw,8rem)] font-black uppercase leading-[0.86] tracking-[-0.07em] text-white">
              The destination network, mapped.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-white/74 md:text-lg">
              A public view of active, building, field-test, future, and fallback destination
              intelligence corridors. The Atlas shows what is safe to publish, not internal
              telemetry or operational state.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href="#atlas-map"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#f5c66c]/20 bg-[linear-gradient(180deg,#f5c66c,#21c6da)] px-6 text-xs font-black uppercase tracking-[0.18em] text-[#120f0b]"
              >
                Explore Atlas
                <MiniIcon type="arrow" />
              </a>
              <Link
                href="/network"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-6 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-white/[0.1]"
              >
                Network doctrine
              </Link>
            </div>
          </div>

          <aside className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-md">
            <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.22em] text-[#f5c66c]">
              <MiniIcon type="compass" />
              Public-safe layer
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-[1.25rem] border border-white/10 bg-black/25 p-4">
                <div className="text-3xl font-black text-white">{nodeCount}</div>
                <div className="mt-1 text-xs text-white/52">Atlas nodes</div>
              </div>
              <div className="rounded-[1.25rem] border border-emerald-300/20 bg-emerald-300/10 p-4">
                <div className="text-3xl font-black text-white">{liveCount}</div>
                <div className="mt-1 text-xs text-white/52">Live nodes</div>
              </div>
            </div>
            <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-black/25 p-4">
              <div className="flex items-start gap-3">
                <MiniIcon type="shield" />
                <p className="text-sm leading-6 text-white/68">
                  Revenue state, invalid telemetry, private property data, and operator notes stay out
                  of the public Atlas.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
