import type { Metadata } from "next";
import { CommandHero } from "@/app/components/dcc/command/CommandHero";
import { CommandStatusStrip } from "@/app/components/dcc/command/CommandStatusStrip";
import { CommandViewShell } from "@/app/components/dcc/command/CommandViewShell";
import { getCommandViewData } from "@/lib/dcc/command/service";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Command View | Destination Command Center",
  description:
    "Live movement intelligence across cities, venues, ports, and corridors inside the DCC network.",
  alternates: { canonical: "/command" },
};

export default async function CommandViewPage() {
  const data = await getCommandViewData();

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Live Sandbox Demo Banner */}
      <div className="border-b border-[#f5c66c]/20 bg-[#f5c66c]/10 px-6 py-4">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center rounded-full bg-[#f5c66c] px-2.5 py-0.5 text-xs font-bold text-[#120f0b]">
              LIVE SANDBOX DEMO
            </span>
            <p className="text-sm font-semibold text-[#f5c66c]">
              This is DCC’s real-time algorithmic orchestration layer tracking active transport pipelines.
            </p>
          </div>
          <p className="text-xs text-white/50 max-w-md">
            This dashboard displays active metrics, bitmask configurations, and telemetry signals for developers and system stakeholders.
          </p>
        </div>
      </div>

      <CommandHero data={data.networkStatus} />
      <CommandStatusStrip data={data.networkStatus} />
      <CommandViewShell data={data} />
    </main>
  );
}
