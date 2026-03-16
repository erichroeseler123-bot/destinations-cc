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
    raw?.subtitle || "Featured guides, attractions, and destination planning pages.";
  const cta = raw?.cta?.href ? raw.cta : null;

  return (
    <section className="mt-8 rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0.34))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.32)] md:p-8">
      <div className="flex flex-col gap-3">
        <div className="text-[11px] font-black tracking-[0.35em] uppercase text-[#f5c66c]">Featured Guides</div>

        <div className="text-2xl md:text-3xl font-black uppercase text-white">{title}</div>

        <div className="max-w-2xl text-[#f8f4ed]/72">{subtitle}</div>

        {cta ? (
          <div className="pt-2">
            <Link
              href={cta.href}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#f8f4ed] transition hover:bg-white/10"
            >
              {cta.label || "Browse Cities"}
              <span className="text-[#f5c66c]">→</span>
            </Link>
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {items.map((it, idx) => (
          <Link
            key={`${it.href}-${idx}`}
            href={it.href}
            className="group rounded-[1.7rem] border border-white/10 bg-black/30 p-5 transition hover:border-[#f5c66c]/30 hover:bg-white/[0.04]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="truncate text-lg font-black uppercase text-white">{it.title}</div>

                {it.why ? (
                  <div className="mt-1 text-sm text-[#f8f4ed]/76">{it.why}</div>
                ) : null}

                {it.description ? (
                  <div className="mt-2 text-sm text-[#f8f4ed]/58">{it.description}</div>
                ) : null}

                {it.tag ? (
                  <div className="mt-4 inline-flex rounded-full border border-[#f5c66c]/18 bg-[#f5c66c]/10 px-3 py-1 text-[11px] font-black tracking-widest uppercase text-[#efe5d3]">
                    {it.tag}
                  </div>
                ) : null}
              </div>

              <div className="font-bold text-[#f5c66c] opacity-70 transition group-hover:opacity-100">
                →
              </div>
            </div>
          </Link>
        ))}

        {items.length === 0 ? (
          <div className="rounded-[1.7rem] border border-white/10 bg-black/30 p-5 text-[#f8f4ed]/58">
            No featured items found. Check <code className="text-zinc-200">data/featured.json</code>.
          </div>
        ) : null}
      </div>
    </section>
  );
}
