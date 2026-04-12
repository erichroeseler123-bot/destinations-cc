import Link from "next/link";
import CinematicBackdrop from "@/app/components/dcc/CinematicBackdrop";
import RouteHeroMark from "@/app/components/dcc/RouteHeroMark";
import type { CommandNetworkStatus } from "@/lib/dcc/command/types";

export function CommandHero({ data }: { data: CommandNetworkStatus }) {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-zinc-950">
      <CinematicBackdrop variant="default" />
      <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div className="space-y-4">
            <RouteHeroMark eyebrow="Destination Command Center" title="COMMAND VIEW" tone="amber" />
            <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white md:text-6xl">
              Live movement intelligence for complex destinations
            </h1>
            <p className="max-w-3xl text-base text-[#f8f4ed]/78 md:text-lg">
              Track what is happening, how to get there, and where movement is tightening across
              cities, venues, ports, and corridors.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/red-rocks-transportation"
                className="inline-flex items-center justify-center rounded-full border border-[#f5c66c]/20 bg-[linear-gradient(180deg,#f5c66c,#21c6da)] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#120f0b]"
              >
                Primary corridor
              </Link>
              <Link
                href="/juneau/helicopter-tours"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#f8f4ed]"
              >
                Juneau corridor
              </Link>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
            <div className="text-[11px] font-black uppercase tracking-[0.26em] text-[#f5c66c]">
              Network pulse
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <div className="text-3xl font-black text-white">{data.liveAlerts}</div>
                <div className="text-sm text-[#f8f4ed]/66">Active movement alerts</div>
              </div>
              <div>
                <div className="text-3xl font-black text-white">{data.activeRoutes}</div>
                <div className="text-sm text-[#f8f4ed]/66">Active routes in the graph</div>
              </div>
              <div>
                <div className="text-3xl font-black text-white">{data.portsMonitored}</div>
                <div className="text-sm text-[#f8f4ed]/66">Ports monitored</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
