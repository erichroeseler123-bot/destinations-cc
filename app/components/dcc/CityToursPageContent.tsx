import Link from "next/link";
import { notFound } from "next/navigation";
import { getCityIntents, titleCase } from "@/src/data/city-intents";
import PoweredByViator from "@/app/components/dcc/PoweredByViator";
import ToursSearchPanel from "@/app/components/dcc/ToursSearchPanel";
import ViatorTourGrid from "@/app/components/dcc/ViatorTourGrid";
import { getViatorActionForPlace } from "@/lib/dcc/internal/viatorAction";

type CityToursPageContentProps = {
  cityKey: string;
};

function cityHubHref(cityKey: string) {
  return cityKey === "las-vegas" ? "/vegas" : `/${cityKey}`;
}

export default async function CityToursPageContent({ cityKey }: CityToursPageContentProps) {
  const normalizedCityKey = (cityKey || "").toLowerCase();
  const items = getCityIntents(normalizedCityKey);
  if (!items) notFound();

  const cityName = titleCase(normalizedCityKey);
  const suggestions = items.slice(0, 6).map((item) => item.query);

  const viatorAction = await getViatorActionForPlace({
    slug: normalizedCityKey,
    name: cityName,
    citySlug: normalizedCityKey,
  });

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
          <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,176,124,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(61,243,255,0.1),transparent_24%),linear-gradient(180deg,rgba(18,18,22,0.92),rgba(9,9,11,0.96))] p-8 shadow-[0_28px_80px_rgba(0,0,0,0.34)]">
            <div className="text-xs tracking-[0.35em] uppercase text-zinc-500">
              Destination Command Center • {cityName}
            </div>

            <h1 className="mt-4 text-4xl md:text-6xl font-black leading-[0.95] bg-gradient-to-r from-white via-cyan-100 to-emerald-100 bg-clip-text text-transparent">
              {cityName} Tours
            </h1>

            <p className="mt-4 max-w-2xl text-zinc-300">
              This page now works as a destination-level things-to-do surface for {cityName}: search the city, review product previews, then click through to Viator when you&apos;re ready to book.
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
          </header>

          <ToursSearchPanel
            title={`Update ${cityName} tour search`}
            description="Use this as the destination-page control bar: change category, update the destination search, or sort results without leaving the tours vertical."
            defaultCity={cityName}
            defaultQuery=""
            defaultSort="recommended"
            defaultMinRating=""
            defaultMaxPrice=""
            defaultMaxDuration=""
            sourceSection={`${normalizedCityKey}-city-tours-page`}
            fixedCity={normalizedCityKey}
            suggestions={suggestions}
          />

          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Tour categories</p>
              <h2 className="text-2xl font-bold">Start with the right tour type</h2>
              <p className="text-sm text-zinc-400">
                These links are intentional search-result bridges for travelers who know the city but still need the right activity category.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {items.map((it, idx) => (
                <Link
                  key={`${normalizedCityKey}-${idx}-${it.query}`}
                  href={`/tours?city=${encodeURIComponent(normalizedCityKey)}&q=${encodeURIComponent(it.query)}&source_section=${encodeURIComponent(`${normalizedCityKey}-city-tour-categories`)}`}
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
          </section>

          <ViatorTourGrid
            placeName={cityName}
            title={`Featured ${cityName} tours`}
            description={`Product previews for ${cityName}. These cards are meant to act like destination-page previews before the traveler clicks through to Viator.`}
            products={viatorAction.products}
            fallbacks={items.slice(0, 6).map((item) => ({ label: item.title, query: item.query }))}
            ctaLabel="View experience"
            linkBuilder={({ href, intentQuery }) =>
              href.startsWith("http")
                ? href
                : `/tours?city=${encodeURIComponent(normalizedCityKey)}&q=${encodeURIComponent(intentQuery)}&source_section=${encodeURIComponent(`${normalizedCityKey}-city-tour-grid`)}`
            }
          />

          <div className="border-t border-white/10 pt-6">
            <Link className="text-zinc-300 hover:text-cyan-200 transition" href={cityHubHref(normalizedCityKey)}>
              ← Back to {cityName}
            </Link>
          </div>
      </div>
    </main>
  );
}
