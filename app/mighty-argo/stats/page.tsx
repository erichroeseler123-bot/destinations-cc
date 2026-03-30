import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mighty Argo Cable Car Stats — Elevation, Access, and Ride Shape",
  description:
    "Quick-reference stats for the Mighty Argo Cable Car in Idaho Springs, including elevation context, access shape, and planning notes.",
  alternates: { canonical: "/mighty-argo/stats" },
};

const STATS = [
  {
    label: "Location",
    value: "Idaho Springs, Colorado",
    note: "Built around Virginia Canyon / Argo Mill access context.",
  },
  {
    label: "Positioning",
    value: "Scenic gondola + bike uplift",
    note: "The project is framed as both a sightseeing attraction and a rider-access system.",
  },
  {
    label: "Target use",
    value: "Views, hiking, and downhill laps",
    note: "The planning shape is different from a simple point-to-point gondola.",
  },
  {
    label: "Trip style",
    value: "Colorado day trip or Denver add-on",
    note: "Best when paired with transport and weather planning instead of treated like a walk-up urban attraction.",
  },
];

export default function MightyArgoStatsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-bold">Stats + planning shape</h2>
        <p className="mt-3 max-w-3xl text-zinc-300">
          This page keeps the core planning facts in one place: where Mighty Argo fits, how the attraction is being
          described, and what kind of trip logic it creates for DCC visitors.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {STATS.map((item) => (
          <article key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">{item.label}</div>
            <div className="mt-2 text-xl font-semibold text-white">{item.value}</div>
            <p className="mt-3 text-sm leading-6 text-zinc-300">{item.note}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-bold">Why this matters for DCC</h2>
        <p className="mt-3 text-zinc-300">
          Mighty Argo is not just an attraction listing. It creates a route-planning problem: transport, weather,
          rider intent, and altitude context matter more than they would for a simple city attraction. That is why DCC
          keeps the authority page separate from the shuttle and trail-specific pages.
        </p>
      </section>
    </div>
  );
}
