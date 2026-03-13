import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mighty Argo Cable Car — Idaho Springs (Opening Spring 2026)",
  description:
    "What the Mighty Argo Cable Car is, what’s at the top, how the Bike Cabs support downhill laps, and how to plan your visit.",
  alternates: { canonical: "/mighty-argo" },
};

export default function MightyArgoOverview() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">
            DCC • Attraction Node
          </p>

          <h1 className="mt-4 text-4xl md:text-6xl font-black leading-[0.95]">
            Mighty Argo Cable Car
          </h1>

          <p className="mt-5 max-w-2xl text-zinc-300 text-lg">
            A new gondola attraction in Idaho Springs with mountain access for
            hiking + downhill riding. Official messaging: opening spring 2026.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/mighty-argo-shuttle"
              className="inline-flex items-center justify-center rounded-xl bg-white text-black px-5 py-3 font-semibold"
            >
              Argo mine tour shuttle from Denver
            </Link>
            <Link
              href="/mighty-argo/stats"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 px-5 py-3 font-semibold text-white hover:bg-white/5"
            >
              Stats + elevation
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <Link
              href="/mighty-argo/mountain-biking"
              className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
            >
              <div className="text-sm text-zinc-400">For riders</div>
              <div className="mt-1 font-semibold">Bike Cabs + laps</div>
            </Link>

            <Link
              href="/mighty-argo/faq"
              className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
            >
              <div className="text-sm text-zinc-400">Planning</div>
              <div className="mt-1 font-semibold">FAQ + what’s at the top</div>
            </Link>

            <Link
              href="/mighty-argo/news"
              className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
            >
              <div className="text-sm text-zinc-400">Updates</div>
              <div className="mt-1 font-semibold">News + official links</div>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12 space-y-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">What’s at the top?</h2>
          <p className="mt-3 text-zinc-300">
            Plans described publicly include a mountaintop outpost area with
            viewpoints and rider/hiker staging. For specifics, see the news page
            and stats page (we keep it sourced).
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">How this connects to DCC</h2>
          <p className="mt-3 text-zinc-300">
            DCC stays “authority-first”: a clear guide + logistics. The shuttle
            page remains a micro-route node that can later link to an execution
            checkout flow without rewriting the attraction content.
          </p>
        </div>
      </section>
    </main>
  );
}
