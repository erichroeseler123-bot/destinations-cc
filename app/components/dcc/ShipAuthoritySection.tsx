import Link from "next/link";
import type { ShipAuthorityConfig } from "@/src/data/ship-authority-config";

export default function ShipAuthoritySection({
  ship,
}: {
  ship: ShipAuthorityConfig;
}) {
  return (
    <div className="space-y-6">
      
      {/* Ship Authority Header Banner */}
      <section className="rounded-3xl border border-cyan-500/40 bg-[#0e1629] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-400 font-bold">Ship Authority Layer</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">
          Why choose {ship.name}
        </h2>
        <p className="mt-3 max-w-3xl text-zinc-100 text-sm leading-relaxed">
          Use this section to frame what this ship is actually good at before you compare sailings.
        </p>
        
        {/* Core Stats Grid */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
            <div className="text-xs uppercase tracking-wider text-zinc-400">Build year</div>
            <div className="mt-2 text-lg font-bold text-white">{ship.buildYear}</div>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
            <div className="text-xs uppercase tracking-wider text-zinc-400">Tonnage</div>
            <div className="mt-2 text-lg font-bold text-white">{ship.tonnage}</div>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
            <div className="text-xs uppercase tracking-wider text-zinc-400">Capacity</div>
            <div className="mt-2 text-lg font-bold text-white">{ship.passengerCapacity}</div>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
            <div className="text-xs uppercase tracking-wider text-zinc-400">Crew</div>
            <div className="mt-2 text-lg font-bold text-white">{ship.crew}</div>
          </div>
        </div>
      </section>

      {/* Target Audience & Deck Highlights */}
      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-slate-700 bg-slate-950 p-6 space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-400 font-bold">Best For</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ship.bestFor.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-amber-400 font-bold">Key Amenities</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {ship.keyAmenities.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-800 bg-[#111625] p-4 text-sm font-medium text-zinc-100">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-700 bg-slate-950 p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-fuchsia-400 font-bold">Deck Highlights</p>
          <div className="mt-3 space-y-3">
            {ship.deckHighlights.map((item) => (
              <div key={item} className="rounded-2xl border border-slate-800 bg-[#111625] p-4 text-sm font-medium text-zinc-100">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pros & Cons (Contrast Enhanced) */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-700 bg-slate-950 p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-400 font-bold">Pros</p>
          <div className="mt-3 space-y-3">
            {ship.pros.map((item) => (
              <div key={item} className="rounded-2xl border border-emerald-950 bg-[#0a1e16] p-4 text-sm font-medium text-emerald-100">
                ✓ {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-700 bg-slate-950 p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-rose-400 font-bold">Tradeoffs</p>
          <div className="mt-3 space-y-3">
            {ship.tradeoffs.map((item) => (
              <div key={item} className="rounded-2xl border border-rose-950 bg-[#250f12] p-4 text-sm font-medium text-rose-100">
                ⚠ {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Notes */}
      <section className="rounded-3xl border border-slate-700 bg-slate-950 p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-400 font-bold">Comparison Notes</p>
        <div className="mt-3 space-y-3">
          {ship.comparisonNotes.map((item) => (
            <div key={item} className="rounded-2xl border border-slate-800 bg-[#111625] p-4 text-sm font-medium text-zinc-100">
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* Related Actions */}
      <section className="rounded-3xl border border-slate-700 bg-slate-950 p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-400 font-bold">Related Links</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ship.relatedLinks.map((link) => (
            <Link
              key={`${link.label}:${link.href}`}
              href={link.href}
              className="rounded-2xl border border-slate-800 bg-[#111625] px-4 py-4 text-sm font-bold text-cyan-300 hover:bg-[#1a233b] hover:border-cyan-800 transition-all text-center"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
