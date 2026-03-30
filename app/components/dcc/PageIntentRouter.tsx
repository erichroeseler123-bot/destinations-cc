import Link from "next/link";
import { DCC_INTENT_LABELS, type DccPageIntent, type DccRouteOption } from "@/lib/dcc/pageIntents";

export default function PageIntentRouter({
  intent,
  eyebrow = "Next step",
  title,
  summary,
  options,
}: {
  intent: DccPageIntent;
  eyebrow?: string;
  title: string;
  summary: string;
  options: readonly DccRouteOption[];
}) {
  if (!options.length) return null;

  return (
    <section className="rounded-[1.9rem] border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(34,211,238,0.10),rgba(15,23,42,0.72))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-200">{eyebrow}</div>
        <div className="rounded-full border border-cyan-300/20 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">
          Intent: {DCC_INTENT_LABELS[intent]}
        </div>
      </div>
      <h2 className="mt-3 text-2xl font-bold text-white">{title}</h2>
      <p className="mt-3 max-w-4xl text-sm leading-7 text-cyan-50/80">{summary}</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {options.map((option) => {
          const className =
            option.emphasis === "primary"
              ? "rounded-[1.4rem] border border-cyan-300/30 bg-white/10 p-4 transition hover:bg-white/15"
              : "rounded-[1.4rem] border border-white/10 bg-black/20 p-4 transition hover:bg-white/10";
          const body = (
            <>
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-200">
                {option.emphasis === "primary" ? "Best next step" : "Alternative path"}
              </div>
              <div className="mt-2 text-lg font-bold text-white">{option.title}</div>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{option.description}</p>
            </>
          );

          return option.kind === "external" ? (
            <a key={`${option.href}:${option.title}`} href={option.href} className={className}>
              {body}
            </a>
          ) : (
            <Link key={`${option.href}:${option.title}`} href={option.href} className={className}>
              {body}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
