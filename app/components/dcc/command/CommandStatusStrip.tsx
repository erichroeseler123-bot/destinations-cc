import type { CommandNetworkStatus } from "@/lib/dcc/command/types";

export function CommandStatusStrip({ data }: { data: CommandNetworkStatus }) {
  const items = [
    { label: "Places tracked", value: data.placesTracked },
    { label: "Active routes", value: data.activeRoutes },
    { label: "Live alerts", value: data.liveAlerts },
    { label: "Recent events", value: data.recentEvents },
    { label: "Ports monitored", value: data.portsMonitored },
  ];

  return (
    <section className="border-b border-white/10 bg-black/20">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="grid gap-3 md:grid-cols-5">
          {items.map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f8f4ed]/52">
                {item.label}
              </div>
              <div className="mt-2 text-2xl font-black text-white">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
