import Link from "next/link";

const NAV = [
  { href: "/mighty-argo", label: "Overview" },
  { href: "/mighty-argo/stats", label: "Stats" },
  { href: "/mighty-argo/faq", label: "FAQ" },
];

function NavPill({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10"
    >
      {label}
    </Link>
  );
}

export default function MightyArgoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen bg-zinc-950 text-white overflow-hidden">
      {/* ambient lighting */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute top-32 right-[-120px] h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-[-160px] left-[-120px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/5 blur-3xl" />
      </div>

      <section className="relative border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">
            DCC • Attraction Node
          </p>

          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl md:text-6xl font-black leading-[0.95]">
                Mighty Argo Cable Car
              </h1>
              <p className="mt-4 max-w-2xl text-zinc-300 text-lg">
                The attraction guide: what it is, “uplift” biking vocabulary, stats,
                and practical planning.
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                href="/mighty-argo-shuttle"
                className="inline-flex items-center justify-center rounded-xl bg-white text-black px-5 py-3 font-semibold hover:opacity-95"
              >
                Shuttle logistics →
              </Link>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {NAV.map((x) => (
              <NavPill key={x.href} href={x.href} label={x.label} />
            ))}
          </div>
        </div>
      </section>

      <div className="relative mx-auto max-w-6xl px-6 py-12">{children}</div>

      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-zinc-500">
          Destination Command Center • Colorado attraction nodes
        </div>
      </footer>
    </main>
  );
}
