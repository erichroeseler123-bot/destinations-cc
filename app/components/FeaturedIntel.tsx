import Link from "next/link";
import featured from "@/data/featured.json";

type FeaturedItem = {
  title: string;
  href: string;
  description?: string;
  tag?: string;
  why?: string;
};

export default function FeaturedIntel() {
  const raw = featured as any;

  // ✅ normalize: support either { items: [...] } OR top-level [...]
  const items: FeaturedItem[] = Array.isArray(raw?.items)
    ? raw.items
    : Array.isArray(raw)
      ? raw
      : [];

  const title: string = raw?.title || "DCC Picks";
  const subtitle: string =
    raw?.subtitle || "High-signal pages: route intel, staging hubs, and reality checks.";
  const cta = raw?.cta?.href ? raw.cta : null;

  return (
    <section className="mt-8 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-black/40 p-6 md:p-8">
      <div className="flex flex-col gap-3">
        <div className="text-[11px] tracking-[0.35em] uppercase text-zinc-500">
          FEATURED INTELLIGENCE
        </div>

        <div className="text-2xl md:text-3xl font-black text-white">{title}</div>

        <div className="text-zinc-300 max-w-2xl">{subtitle}</div>

        {cta ? (
          <div className="pt-2">
            <Link
              href={cta.href}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10 transition"
            >
              {cta.label || "Browse Cities →"}
              <span className="text-cyan-400">→</span>
            </Link>
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {items.map((it, idx) => (
          <Link
            key={`${it.href}-${idx}`}
            href={it.href}
            className="group rounded-3xl border border-white/10 bg-black/30 p-5 hover:border-cyan-500/40 hover:bg-white/[0.04] transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-white font-bold text-lg truncate">{it.title}</div>

                {it.why ? (
                  <div className="mt-1 text-sm text-zinc-300">{it.why}</div>
                ) : null}

                {it.description ? (
                  <div className="mt-2 text-sm text-zinc-400">{it.description}</div>
                ) : null}

                {it.tag ? (
                  <div className="mt-4 inline-flex rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] tracking-widest uppercase text-zinc-200">
                    {it.tag}
                  </div>
                ) : null}
              </div>

              <div className="text-cyan-400 font-bold opacity-70 group-hover:opacity-100 transition">
                →
              </div>
            </div>
          </Link>
        ))}

        {items.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-black/30 p-5 text-zinc-400">
            No featured items found. Check <code className="text-zinc-200">data/featured.json</code>.
          </div>
        ) : null}
      </div>
    </section>
  );
}
