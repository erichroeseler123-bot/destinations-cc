import { LaunchMissionPanel } from "@/app/components/dcc/earthos/LaunchMissionPanel";
import { MissionTable } from "@/app/components/dcc/earthos/MissionTable";
import { PriorityRail } from "@/app/components/dcc/earthos/PriorityRail";
import { ReferenceMaintenancePanel } from "@/app/components/dcc/earthos/ReferenceMaintenancePanel";
import { verifyEarthOSAuthorization } from "@/lib/dcc/earthos/auth";
import { getReferenceMaintenanceOperationalSnapshot } from "@/lib/dcc/earthos/referenceMaintenance";
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

export async function renderEarthOSDashboardPage({
  explicitAuthToken,
}: {
  explicitAuthToken?: string;
} = {}) {
  const auth = await verifyEarthOSAuthorization(null, explicitAuthToken);
  if (!auth.authorized || auth.actor === "vercel:cron") {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-16 text-white"
        data-earthos-auth-gate="unauthorized"
      >
        <div className="w-full max-w-md rounded-3xl border border-white/12 bg-zinc-900/90 p-8 shadow-2xl">
          <div className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f5c66c]">
            EarthOS Mission Control · 401 Unauthorized
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight">
            Operator Authentication Required
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Private maintenance records, evidence reviews, and correction controls require an authorized EarthOS operator session.
          </p>
          <form action="/admin/unlock" method="post" className="mt-6 space-y-3">
            <input type="hidden" name="next" value="/internal/dashboard" />
            <input
              type="password"
              name="key"
              required
              placeholder="Enter operator access key"
              className="min-h-11 w-full rounded-xl border border-white/20 bg-black/50 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500"
            />
            <button
              type="submit"
              className="min-h-11 w-full cursor-pointer rounded-full bg-[linear-gradient(180deg,#f5c66c,#21c6da)] px-5 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-[#120f0b]"
            >
              Unlock EarthOS Mission Control
            </button>
          </form>
        </div>
      </main>
    );
  }

  const [missions, referenceSnapshot] = await Promise.all([
    listWorkflowMissions(),
    getReferenceMaintenanceOperationalSnapshot(),
  ]);
  const statusCounts = countBy(missions.map((mission) => mission.status));
  const openReferenceIssueCount = referenceSnapshot.tasks.filter(
    (t) => t.status === "open",
  ).length;

  const summaryCards = [
    {
      label: "Open Ref Issues",
      value: openReferenceIssueCount,
      tone:
        openReferenceIssueCount > 0
          ? "text-rose-100 border-rose-400/40 bg-rose-500/15"
          : "text-emerald-100 border-emerald-300/20 bg-emerald-300/10",
    },
    { label: "Running", value: statusCounts.running || 0, tone: "text-cyan-100 border-cyan-300/20 bg-cyan-300/10" },
    { label: "Needs Approval", value: missions.filter((mission) => mission.status === "waiting").length, tone: "text-amber-50 border-amber-300/20 bg-amber-300/10" },
    { label: "Failed", value: statusCounts.failed || 0, tone: "text-rose-100 border-rose-300/20 bg-rose-300/10" },
    { label: "Completed", value: statusCounts.completed || 0, tone: "text-emerald-100 border-emerald-300/20 bg-emerald-300/10" },
  ];

  return (
    <main className="min-h-screen bg-zinc-950 text-white" data-earthos-auth-gate="authorized">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="space-y-3">
            <div className="text-[11px] font-black uppercase tracking-[0.26em] text-[#f5c66c]">
              EarthOS Mission Control · Operator: {auth.actor}
            </div>
            <h1 className="text-4xl font-black tracking-tight">Glass cockpit for durable missions &amp; reference integrity</h1>
            <p className="max-w-3xl text-sm leading-6 text-zinc-300 md:text-base">
              DCC provides traveler information and official evidence; EarthOS tracks reference problems, coordinates operator-approved corrections, and verifies the published result.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/internal/dashboard"
              className="inline-flex rounded-full border border-[rgba(245,198,108,0.2)] bg-[linear-gradient(180deg,#f5c66c,#21c6da)] px-5 py-2 text-sm font-black uppercase tracking-[0.14em] text-[#120f0b] shadow-[0_18px_38px_rgba(245,198,108,0.12)]"
            >
              Refresh View
            </a>
            <a
              href="/admin/logout?next=/internal/dashboard"
              className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-300 hover:bg-white/10"
            >
              Lock Session
            </a>
          </div>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-5">
          {summaryCards.map((card) => (
            <article key={card.label} className={`rounded-[1.4rem] border p-5 ${card.tone}`}>
              <div className="text-[11px] font-black uppercase tracking-[0.22em]">{card.label}</div>
              <div className="mt-3 text-4xl font-black text-white">{card.value}</div>
            </article>
          ))}
        </section>

        <ReferenceMaintenancePanel snapshot={referenceSnapshot} />

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

export default async function EarthOSDashboardPage() {
  return renderEarthOSDashboardPage();
}
