import Link from "next/link";
import PoweredByViator from "@/app/components/dcc/PoweredByViator";
import type { NationalParkAuthorityConfig } from "@/src/data/national-parks-authority-config";

export default function NationalParkAuthoritySection({
  park,
}: {
  park: NationalParkAuthorityConfig;
}) {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">National Park Authority Page</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight md:text-6xl">{park.name}</h1>
        <p className="mt-4 max-w-3xl text-lg text-zinc-200">{park.heroSummary}</p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">{park.cruiseRelevance}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-zinc-100">
            {park.state}
          </span>
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-zinc-100">
            {park.region}
          </span>
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-zinc-100">
            Updated {park.updatedAt}
          </span>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Park Snapshot</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wider text-zinc-500">Best time</div>
              <div className="mt-2 text-sm font-semibold text-zinc-100">{park.bestTime}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wider text-zinc-500">Drive signal</div>
              <div className="mt-2 text-sm font-semibold text-zinc-100">{park.driveSignal}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:col-span-2">
              <div className="text-xs uppercase tracking-wider text-zinc-500">Address anchor</div>
              <div className="mt-2 text-sm font-semibold text-zinc-100">
                {park.address.addressLocality}, {park.address.addressRegion}
              </div>
            </div>
          </div>
        </div>

        <section className="rounded-3xl border border-emerald-400/20 bg-emerald-500/5 p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">Book Activities Near This Park</p>
          <h2 className="mt-2 text-2xl font-black">Top bookable intents</h2>
          <div className="mt-5 grid gap-3">
            {park.topActivities.map((activity) => (
              <Link
                key={activity.label}
                href={`/tours?q=${encodeURIComponent(activity.query)}`}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm font-semibold text-zinc-100 hover:bg-white/10"
              >
                {activity.label}
              </Link>
            ))}
          </div>
          <PoweredByViator
            compact
            disclosure
            className="mt-5 bg-white/5"
            body={`DCC helps you frame the right ${park.name} day plan first, then hand off into Viator tour discovery when you want guided activities nearby.`}
          />
        </section>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-amber-300">What This Park Is Known For</p>
          <div className="mt-5 space-y-3">
            {park.knownForBullets.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-200">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-rose-300">Logistics Notes</p>
          <div className="mt-5 space-y-3">
            {park.logisticsNotes.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-200">
                {item}
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-fuchsia-300">FAQ</p>
        <div className="mt-5 space-y-3">
          {park.faq.map((item) => (
            <details key={item.question} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <summary className="cursor-pointer list-none font-semibold text-white">{item.question}</summary>
              <p className="mt-3 text-sm leading-7 text-zinc-300">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Related Links</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {park.nearbyLinks.map((link) => (
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
    </div>
  );
}
