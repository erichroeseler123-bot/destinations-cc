import type { CommandNetworkStatus } from "@/lib/dcc/command/types";

export function NetworkPulsePanel({ data }: { data: CommandNetworkStatus }) {
  return (
    <section className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(24,21,18,0.84),rgba(12,11,10,0.92))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
      <div className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f5c66c]">Network pulse</div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f8f4ed]/48">Places tracked</div>
          <div className="mt-2 text-3xl font-black text-white">{data.placesTracked}</div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f8f4ed]/48">Recent events</div>
          <div className="mt-2 text-3xl font-black text-white">{data.recentEvents}</div>
        </div>
      </div>
    </section>
  );
}
