import Link from "next/link";
import type { RecommendationAction } from "@/lib/dcc/handoffAnalytics";

export default function NextStepEngine({
  title = "Best Next Step",
  eyebrow = "Decision engine",
  description,
  actions,
}: {
  title?: string;
  eyebrow?: string;
  description?: string;
  actions: RecommendationAction[];
}) {
  if (!actions.length) return null;

  return (
    <section className="rounded-[1.9rem] border border-emerald-400/20 bg-emerald-500/10 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
      <div className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-200">{eyebrow}</div>
      <h2 className="mt-3 text-2xl font-bold text-white">{title}</h2>
      {description ? <p className="mt-3 text-sm leading-7 text-emerald-50/85">{description}</p> : null}
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {actions.map((action, index) => {
          const laneStateLabel =
            action.laneState === "degraded"
              ? "Lane degraded"
              : action.laneState === "fallback"
                ? "Fallback path"
                : "Healthy lane";
          const body = (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-200">
                  {index === 0 ? "Recommended next click" : "Alternative path"}
                </div>
                <div className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100">
                  {laneStateLabel}
                </div>
              </div>
              <div className="mt-2 text-lg font-bold text-white">{action.label}</div>
              <p className="mt-2 text-sm leading-6 text-emerald-50/80">{action.reason}</p>
              <div className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-emerald-100">
                Score {action.score}
              </div>
            </>
          );

          const classes =
            index === 0
              ? "rounded-[1.4rem] border border-emerald-300/30 bg-white/10 p-4 transition hover:bg-white/15"
              : "rounded-[1.4rem] border border-white/10 bg-black/20 p-4 transition hover:bg-white/10";

          return action.kind === "external" ? (
            <a key={action.id} href={action.href} className={classes}>
              {body}
            </a>
          ) : (
            <Link key={action.id} href={action.href} className={classes}>
              {body}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
