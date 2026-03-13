import Link from "next/link";
import { notFound } from "next/navigation";
import { getCityIntents, titleCase } from "@/src/data/city-intents";
import PoweredByViator from "@/app/components/dcc/PoweredByViator";

type CityToursPageContentProps = {
  cityKey: string;
};

function cityHubHref(cityKey: string) {
  return cityKey === "las-vegas" ? "/vegas" : `/${cityKey}`;
}

export default function CityToursPageContent({ cityKey }: CityToursPageContentProps) {
  const normalizedCityKey = (cityKey || "").toLowerCase();
  const items = getCityIntents(normalizedCityKey);
  if (!items) notFound();

  const cityName = titleCase(normalizedCityKey);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-xs tracking-[0.35em] uppercase text-zinc-500">
          Destination Command Center • {cityName}
        </div>

        <h1 className="mt-4 text-4xl md:text-6xl font-black leading-[0.95] bg-gradient-to-r from-white via-cyan-100 to-emerald-100 bg-clip-text text-transparent">
          {cityName} Tours
        </h1>

        <p className="mt-4 max-w-2xl text-zinc-300">
          Use DCC to narrow down the right tour style for {cityName}, then continue into booking with Viator when you&apos;re ready.
        </p>

        <div className="mt-6">
          <PoweredByViator
            compact
            disclosure
            body={`DCC helps you discover what to do in ${cityName}, compare options, and narrow in on the best fit for your trip. When you're ready to book, you can book with DCC via Viator.`}
          />
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <Link className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-sm text-zinc-200 hover:bg-white/10" href={cityHubHref(normalizedCityKey)}>
            City hub
          </Link>
          <Link className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-sm text-zinc-200 hover:bg-white/10" href={`/${normalizedCityKey}/attractions`}>
            Attractions
          </Link>
          <Link className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-sm text-zinc-200 hover:bg-white/10" href={`/tours`}>
            Tours hub
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((it, idx) => (
            <Link
              key={`${normalizedCityKey}-${idx}-${it.query}`}
              href={`/tours?city=${encodeURIComponent(normalizedCityKey)}&q=${encodeURIComponent(it.query)}`}
              className="group rounded-3xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.06] hover:border-cyan-400/30 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-white">{it.title}</div>
                  <div className="mt-1 text-sm text-zinc-400">
                    {it.badge ? <span className="mr-2 inline-flex rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[11px] text-zinc-200">{it.badge}</span> : null}
                    <span className="text-zinc-300">Intent:</span>{" "}
                    <span className="text-zinc-400">{it.query}</span>
                  </div>
                </div>
                <div className="text-cyan-300 font-bold opacity-70 group-hover:opacity-100 transition">→</div>
              </div>

              <p className="mt-3 text-zinc-300 leading-relaxed">{it.description}</p>

              <div className="mt-4 text-xs uppercase tracking-[0.25em] text-zinc-500">
                Find matches
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 border-t border-white/10 pt-6">
          <Link className="text-zinc-300 hover:text-cyan-200 transition" href={cityHubHref(normalizedCityKey)}>
            ← Back to {cityName}
          </Link>
        </div>
      </div>
    </main>
  );
}
