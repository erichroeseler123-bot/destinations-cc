import Link from "next/link";
import type { GraphContextPayload } from "@/lib/dcc/graph/context";

type Props = {
  context: GraphContextPayload;
};

function LinkGrid({ title, items }: { title: string; items: Array<{ label: string; href: string }> }) {
  if (!items.length) return null;
  return (
    <section className="space-y-2">
      <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200">{title}</h4>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Link
            key={`${item.href}:${item.label}`}
            href={item.href}
            className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function GraphContextPanel({ context }: Props) {
  return (
    <section className="space-y-4 rounded-2xl border border-cyan-300/20 bg-cyan-500/5 p-5">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Entity Graph Context</p>
        <p className="mt-2 text-sm text-zinc-300">
          Navigate nearby nodes, routes, and linked authority surfaces from this decision node.
        </p>
      </header>

      {context.parentHub ? (
        <div className="rounded-xl border border-white/10 bg-black/25 p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Parent Hub</p>
          <Link href={context.parentHub.href} className="mt-2 inline-block text-sm font-semibold text-cyan-200 hover:text-cyan-100">
            {context.parentHub.label}
          </Link>
        </div>
      ) : null}

      <LinkGrid title="Nearby Nodes" items={context.nearbyNodes} />
      <LinkGrid title="Related Experiences" items={context.relatedExperiences} />
      <LinkGrid title="Routes From Here" items={context.routesFromHere} />
      <LinkGrid title="Top Things Nearby" items={context.topThingsNearby} />

      {context.siblings.length ? <LinkGrid title="Siblings" items={context.siblings} /> : null}
    </section>
  );
}
