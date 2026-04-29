import { LaunchMissionPanel } from "@/app/components/dcc/earthos/LaunchMissionPanel";
import { MissionTable } from "@/app/components/dcc/earthos/MissionTable";
import { PriorityRail } from "@/app/components/dcc/earthos/PriorityRail";
import { listWorkflowMissions } from "@/lib/dcc/earthos/workflows/service";

export const metadata = {
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function countBy<T extends string>(values: T[]): Record<T, number> {
  return values.reduce(
    (acc, value) => {
      acc[value] += 1;
      return acc;
    },
    Object.fromEntries([...new Set(values)].map((value) => [value, 0])) as Record<T, number>,
  );
}

export default async function EarthOSDashboardPage() {
  const missions = await listWorkflowMissions();
  const statusCounts = countBy(missions.map((mission) => mission.status));

  const summaryCards = [
    { label: "Running", value: statusCounts.running || 0, tone: "text-cyan-100 border-cyan-300/20 bg-cyan-300/10" },
    { label: "Needs Approval", value: missions.filter((mission) => mission.status === "waiting").length, tone: "text-amber-50 border-amber-300/20 bg-amber-300/10" },
    { label: "Failed", value: statusCounts.failed || 0, tone: "text-rose-100 border-rose-300/20 bg-rose-300/10" },
    { label: "Completed", value: statusCounts.completed || 0, tone: "text-emerald-100 border-emerald-300/20 bg-emerald-300/10" },
  ];

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="space-y-3">
            <div className="text-[11px] font-black uppercase tracking-[0.26em] text-[#f5c66c]">EarthOS Mission Control</div>
            <h1 className="text-4xl font-black tracking-tight">Glass cockpit for durable missions</h1>
            <p className="max-w-3xl text-sm leading-6 text-zinc-300 md:text-base">
              The first pass stays brutally simple: loud bad states, a clear triage rail, and direct links into each mission brief.
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="/dashboard"
              className="inline-flex rounded-full border border-[rgba(245,198,108,0.2)] bg-[linear-gradient(180deg,#f5c66c,#21c6da)] px-5 py-2 text-sm font-black uppercase tracking-[0.14em] text-[#120f0b] shadow-[0_18px_38px_rgba(245,198,108,0.12)]"
            >
              Refresh View
            </a>
          </div>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {summaryCards.map((card) => (
            <article key={card.label} className={`rounded-[1.4rem] border p-5 ${card.tone}`}>
              <div className="text-[11px] font-black uppercase tracking-[0.22em]">{card.label}</div>
              <div className="mt-3 text-4xl font-black text-white">{card.value}</div>
            </article>
          ))}
        </section>

        <section className="mt-8">
          <LaunchMissionPanel />
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_360px]">
          <MissionTable missions={missions} />
          <PriorityRail missions={missions} />
        </div>
      </div>
    </main>
  );
}
