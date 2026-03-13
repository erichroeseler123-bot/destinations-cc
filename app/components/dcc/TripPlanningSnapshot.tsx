type SnapshotItem = {
  label: string;
  value: string;
};

type Props = {
  title?: string;
  intro?: string;
  items: SnapshotItem[];
};

export type TripPlanningSnapshotItem = SnapshotItem;

export default function TripPlanningSnapshot({
  title = "Trip Planning Snapshot",
  intro = "Quick planning context for timing, fit, and how this place usually works in a real itinerary.",
  items,
}: Props) {
  if (!items.length) return null;

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
      <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">Trip Planning Snapshot</p>
      <h2 className="mt-2 text-2xl font-bold">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm text-zinc-400">{intro}</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article
            key={`${item.label}:${item.value}`}
            className="rounded-2xl border border-white/10 bg-black/20 p-4"
          >
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{item.label}</p>
            <p className="mt-2 text-sm font-medium text-zinc-100">{item.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
