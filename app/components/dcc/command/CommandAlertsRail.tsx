import Link from "next/link";
import { commandTone } from "@/app/components/dcc/command/commandTone";
import type { CommandAlertModel } from "@/lib/dcc/command/types";

export function CommandAlertsRail({ alerts }: { alerts: CommandAlertModel[] }) {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#f5c66c]">Active alerts</div>
        <h2 className="text-2xl font-black uppercase text-white">Command alerts</h2>
      </header>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <article key={alert.id} className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-black uppercase text-white">{alert.title}</h3>
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${commandTone(alert.severity)}`}>
                {alert.severity}
              </span>
            </div>
            <p className="mt-3 text-sm text-[#f8f4ed]/72">{alert.impact}</p>
            {alert.href ? (
              <Link href={alert.href} className="mt-3 inline-flex text-xs font-black uppercase tracking-[0.16em] text-[#efe5d3]">
                Open route
              </Link>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
