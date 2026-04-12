import { commandTone } from "@/app/components/dcc/command/commandTone";
import type { CommandEventModel } from "@/lib/dcc/command/types";

function formatTimestamp(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function LiveEventStream({ events }: { events: CommandEventModel[] }) {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#f5c66c]">Live stream</div>
        <h2 className="text-2xl font-black uppercase text-white">Network event log</h2>
      </header>
      <div className="space-y-3">
        {events.map((event) => (
          <article key={event.id} className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f8f4ed]/46">
                  {formatTimestamp(event.timestamp)}
                </div>
                <h3 className="mt-1 text-base font-black text-white">{event.title}</h3>
              </div>
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${commandTone(event.severity)}`}>
                {event.severity}
              </span>
            </div>
            <p className="mt-3 text-sm text-[#f8f4ed]/72">{event.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
