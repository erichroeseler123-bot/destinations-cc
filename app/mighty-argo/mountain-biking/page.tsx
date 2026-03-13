import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mighty Argo Mountain Biking — Bike Cabs + Virginia Canyon Trails",
  description:
    "How gondola-served biking is expected to work at Mighty Argo: Bike Cabs, trail access, and what to plan for.",
  alternates: { canonical: "/mighty-argo/mountain-biking" },
};

export default function MightyArgoBiking() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-14 space-y-6">
        <h1 className="text-4xl font-black">Mountain biking</h1>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Bike Cabs (the big deal)</h2>
          <p className="mt-3 text-zinc-300">
            The project highlights specialized bike cabins (“Bike Cabs”) to move bikes
            up to trailheads. Industry coverage describes these as the first Bike Cabs
            of their kind in the USA.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Can you lap all day?</h2>
          <p className="mt-3 text-zinc-300">
            The intended experience is repeat laps: ride up, descend the trail system,
            repeat — subject to ticketing rules, operating hours, weather holds, and
            trail closures. We’ll keep this page policy-light until the official ops/ticket
            rules are posted.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Trails + partners</h2>
          <p className="mt-3 text-zinc-300">
            Virginia Canyon Mountain Park / Trek Trails and COMBA are key sources for trail updates.
            If you want, we can add a “Trail Status” block that only shows what’s published by the
            city/COMBA (no speculation).
          </p>
        </div>
      </div>
    </main>
  );
}
