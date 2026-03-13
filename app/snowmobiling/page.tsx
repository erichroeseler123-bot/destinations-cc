import type { Metadata } from "next";
import Link from "next/link";
import { SNOWMOBILING_STATES } from "@/src/data/snowmobiling-states";

const PAGE_URL = "https://destinationcommandcenter.com/snowmobiling";

export const metadata: Metadata = {
  title: "Snowmobiling Guide | Verified Trail-State Pilot",
  description:
    "Verified snowmobiling pilot covering Michigan, Minnesota, Wisconsin, and Maine using official trail authorities and map sources.",
  alternates: { canonical: "/snowmobiling" },
  openGraph: {
    title: "Snowmobiling Guide | Verified Trail-State Pilot",
    description:
      "A cautious DCC pilot for official snowmobiling trail states, focused on verified sources instead of broad unverified coverage.",
    url: PAGE_URL,
    type: "website",
  },
};

function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: PAGE_URL,
    name: "Snowmobiling Guide",
    description:
      "Verified snowmobiling pilot covering Michigan, Minnesota, Wisconsin, and Maine from official trail authorities.",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function SnowmobilingPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd />
      <div className="mx-auto max-w-5xl px-6 py-16 space-y-8">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">
            DCC Winter Pilot
          </p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">
            Verified snowmobiling states
          </h1>
          <p className="max-w-3xl text-zinc-300">
            This is a deliberately small snowmobiling pilot. It only covers states we verified
            against official trail authorities, map sources, or state recreation pages. Fees, trail
            conditions, and closures can change, so use the official links before publishing or
            booking around exact route assumptions.
          </p>
        </header>

        <section className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-zinc-200">
            Official trail authority links only
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-zinc-200">
            No unverified permit or mileage claims beyond source-backed notes
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-zinc-200">
            Built for later state pages, winter routing, and GoSno tie-ins
          </div>
        </section>

        <section className="space-y-4">
          {SNOWMOBILING_STATES.map((state) => (
            <article
              key={state.slug}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-bold">{state.name}</h2>
                    <span className="rounded-full border border-emerald-400/30 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-emerald-200">
                      {state.status}
                    </span>
                  </div>
                  <p className="mt-2 text-zinc-300">{state.trailMilesNote}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={state.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200"
                  >
                    Official authority
                  </a>
                  <a
                    href={state.trailMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-white/10"
                  >
                    Trail maps
                  </a>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Authority</p>
                  <p className="mt-2 text-sm text-zinc-300">{state.authorityName}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Popular areas</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {state.topAreas.map((area) => (
                      <span
                        key={`${state.slug}-${area}`}
                        className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-200"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Permit and planning note</p>
                  <p className="mt-2 text-sm text-zinc-300">{state.permitNote}</p>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Why this is a pilot</h2>
          <p className="mt-3 text-zinc-300">
            Snowmobiling information changes faster than most city pages: permit rules, in-season
            trail closures, and even official map URLs can move. The safe DCC approach is to verify
            a small set from primary sources first, then expand.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/national-parks"
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10"
            >
              National Parks
            </Link>
            <Link
              href="/authority"
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10"
            >
              Authority Layer
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
