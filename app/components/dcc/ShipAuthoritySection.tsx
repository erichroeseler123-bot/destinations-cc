import Link from "next/link";
import type { ShipAuthorityConfig } from "@/src/data/ship-authority-config";

export default function ShipAuthoritySection({
  ship,
}: {
  ship: ShipAuthorityConfig;
}) {
  return (
    <section className="space-y-6">
      <section className="rounded-3xl border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(34,211,238,0.08),rgba(255,255,255,0.03))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Ship Authority Layer</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">
          Why choose {ship.name}
        </h2>
        <p className="mt-3 max-w-3xl text-zinc-200">
          Use this section to frame what this ship is actually good at before you compare sailings.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs uppercase tracking-wider text-zinc-500">Build year</div>
            <div className="mt-2 font-semibold text-zinc-100">{ship.buildYear}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs uppercase tracking-wider text-zinc-500">Tonnage</div>
            <div className="mt-2 font-semibold text-zinc-100">{ship.tonnage}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs uppercase tracking-wider text-zinc-500">Capacity</div>
            <div className="mt-2 font-semibold text-zinc-100">{ship.passengerCapacity}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs uppercase tracking-wider text-zinc-500">Crew</div>
            <div className="mt-2 font-semibold text-zinc-100">{ship.crew}</div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">Best For</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {ship.bestFor.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-sm font-semibold text-zinc-100"
              >
                {tag}
              </span>
            ))}
          </div>

          <p className="mt-6 text-xs uppercase tracking-[0.22em] text-amber-300">Key Amenities</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {ship.keyAmenities.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-200">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-fuchsia-300">Deck Highlights</p>
          <div className="mt-4 space-y-3">
            {ship.deckHighlights.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-200">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">Pros</p>
          <div className="mt-4 space-y-3">
            {ship.pros.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-200">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-rose-300">Tradeoffs</p>
          <div className="mt-4 space-y-3">
            {ship.tradeoffs.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-200">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Comparison Notes</p>
        <div className="mt-4 space-y-3">
          {ship.comparisonNotes.map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-200">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Related Links</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ship.relatedLinks.map((link) => (
            <Link
              key={`${link.label}:${link.href}`}
              href={link.href}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm font-semibold text-zinc-100 hover:bg-white/10"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
