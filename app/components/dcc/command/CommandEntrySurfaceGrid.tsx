import Link from "next/link";
import type { CommandEntrySurfaceCardModel } from "@/lib/dcc/command/types";

export function CommandEntrySurfaceGrid({ entries }: { entries: CommandEntrySurfaceCardModel[] }) {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#f5c66c]">Intake lanes</div>
        <h2 className="text-2xl font-black uppercase text-white">Start with a live corridor</h2>
        <p className="text-sm text-[#f8f4ed]/70">
          These are the corridor entry surfaces currently promoted into the top DCC intake layer.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {entries.map((entry) => (
          <Link
            key={entry.id}
            href={entry.path}
            className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(24,21,18,0.84),rgba(12,11,10,0.92))] p-5 transition hover:border-[#f5c66c]/50 hover:shadow-[0_18px_50px_rgba(245,198,108,0.12)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#f5c66c]">
                {entry.kind}
              </div>
              <span className="inline-flex rounded-full border border-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#f8f4ed]/72">
                {entry.intent}
              </span>
            </div>
            <h3 className="mt-3 text-lg font-black uppercase text-white">{entry.label}</h3>
            <p className="mt-2 text-sm text-[#f8f4ed]/60">
              {entry.state ? `${entry.state} • ` : ""}
              {entry.path}
            </p>
            <div className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-white">
              Open intake lane
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
