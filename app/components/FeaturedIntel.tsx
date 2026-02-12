import Link from "next/link";
import featured from "@/data/featured.json";

type Item = {
  title: string;
  href: string;
  tag?: string;
  desc?: string;
};

export default function FeaturedIntel() {
  const items = featured as unknown as Item[];

  return (
    <section className="mt-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-xs tracking-[0.35em] uppercase text-zinc-500">
            Featured Intelligence
          </div>
          <h2 className="mt-2 text-2xl md:text-3xl font-black bg-gradient-to-r from-cyan-200 to-emerald-200 bg-clip-text text-transparent">
            DCC Picks
          </h2>
          <p className="mt-2 text-zinc-300 max-w-2xl">
            High-signal pages: route intel, staging hubs, and reality checks.
          </p>
        </div>

        <Link
          href="/cities"
          className="hidden md:inline-flex rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10 transition"
        >
          Browse Cities →
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.55)] backdrop-blur-md hover:border-cyan-500/40 transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-white font-bold text-lg">{it.title}</div>
                {it.desc ? (
                  <div className="mt-2 text-sm text-zinc-300">{it.desc}</div>
                ) : null}
              </div>
              <div className="text-cyan-400 font-bold">→</div>
            </div>

            {it.tag ? (
              <div className="mt-4 inline-flex rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs uppercase tracking-widest text-zinc-200">
                {it.tag}
              </div>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
