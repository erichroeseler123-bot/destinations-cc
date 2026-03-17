import Link from "next/link";

import {
  getSubtleAffiliateModules,
  type AffiliateModuleContext,
} from "@/lib/affiliate/modules";

type SubtleAffiliateModulesProps = {
  context: AffiliateModuleContext;
  hrefs?: Partial<Record<string, string>>;
  eyebrow?: string;
  title?: string;
  intro?: string;
};

function labelForHref(id: string) {
  switch (id) {
    case "stays_nearby":
      return "Compare stays";
    case "airport_transfer":
      return "See transport options";
    case "trip_esim":
      return "View connectivity";
    case "trip_protection":
      return "Review protection";
    default:
      return "Open";
  }
}

export default function SubtleAffiliateModules({
  context,
  hrefs = {},
  eyebrow = "Trip tools",
  title = "Useful next-step planning tools",
  intro = "Use these only if they actually help the trip. DCC keeps them secondary to the main planning path.",
}: SubtleAffiliateModulesProps) {
  const modules = getSubtleAffiliateModules(context).filter((module) => hrefs[module.id]);
  if (!modules.length) return null;

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.2)]">
      <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">{intro}</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {modules.map((module) => (
          <Link
            key={module.id}
            href={hrefs[module.id]!}
            className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:bg-white/10"
          >
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Optional utility</div>
            <h3 className="mt-2 text-lg font-semibold">{module.label}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-300">{module.description}</p>
            <div className="mt-4 text-sm font-semibold text-cyan-300">{labelForHref(module.id)} →</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
