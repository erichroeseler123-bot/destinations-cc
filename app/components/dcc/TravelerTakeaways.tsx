import type { GuestFeedbackSummary } from "@/lib/dcc/guestFeedback";

type TravelerTakeawaysProps = {
  summary: GuestFeedbackSummary;
  compact?: boolean;
};

export default function TravelerTakeaways({
  summary,
  compact = false,
}: TravelerTakeawaysProps) {
  return (
    <section
      className={
        compact
          ? "rounded-2xl border border-white/10 bg-white/[0.04] p-4"
          : "rounded-3xl border border-white/10 bg-white/[0.05] p-6"
      }
    >
      <div className="space-y-3">
        <div>
          <h3 className={compact ? "text-sm font-semibold text-white" : "text-2xl font-bold text-white"}>
            {summary.heading}
          </h3>
          <p className={compact ? "mt-1 text-xs text-zinc-400" : "mt-1 text-sm text-zinc-400"}>
            {summary.subtext}
          </p>
        </div>

        <ul className={compact ? "space-y-2 text-sm text-zinc-300" : "space-y-3 text-base text-zinc-300"}>
          {summary.bullets.map((bullet) => (
            <li key={bullet} className="flex gap-3 leading-7">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>

        {summary.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {summary.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-zinc-300"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
