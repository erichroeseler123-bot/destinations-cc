import Link from "next/link";
import type { CommercialActionConfig } from "@/src/data/destination-config-schema";

export default function CommercialActionPanel({ actions }: { actions: CommercialActionConfig[] }) {
  if (!actions.length) return null;
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {actions.map((action) => (
        <article key={action.id} className="rounded-[26px] border border-white/10 bg-[#0b1224] p-6">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ffb07c]">Next useful action</div>
          <h2 className="mt-3 text-xl font-black uppercase tracking-[-0.03em] text-white">{action.label}</h2>
          {action.description ? <p className="mt-3 text-sm leading-6 text-white/70">{action.description}</p> : null}
          <Link href={action.href} className="mt-5 inline-flex text-sm font-bold text-[#3df3ff]">
            Continue →
          </Link>
        </article>
      ))}
    </section>
  );
}
