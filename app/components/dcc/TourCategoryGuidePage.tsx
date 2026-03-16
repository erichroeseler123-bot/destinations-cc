import Link from "next/link";
import ViatorTourGrid from "@/app/components/dcc/ViatorTourGrid";
import type { ViatorActionProduct } from "@/lib/dcc/action/viator";
import WeatherPanel from "@/app/components/dcc/WeatherPanel";

type TourCategoryGuidePageProps = {
  cityName: string;
  citySlug: string;
  title: string;
  description: string;
  intro: string;
  bullets: readonly string[];
  intents: ReadonlyArray<{ label: string; query: string; description: string }>;
  products: ViatorActionProduct[];
  weather?: {
    locationLabel: string;
    lat: number;
    lng: number;
  } | null;
};

export default function TourCategoryGuidePage({
  cityName,
  citySlug,
  title,
  description,
  intro,
  bullets,
  intents,
  products,
  weather,
}: TourCategoryGuidePageProps) {
  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,176,124,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(61,243,255,0.10),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(7,11,25,0.98))] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.45)] md:p-10">
          <p className="text-xs uppercase tracking-[0.24em] text-[#ffb07c]">{cityName} tour guide</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-white/82">{description}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={`/${citySlug}/tours`} className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400">
              Browse more tours
            </Link>
            <Link href={`/${citySlug}`} className="rounded-2xl border border-white/12 bg-white/6 px-5 py-3 text-sm text-white/88 hover:bg-white/10">
              Back to {cityName}
            </Link>
          </div>
          {weather ? (
            <div className="mt-6 max-w-sm">
              <WeatherPanel locationLabel={weather.locationLabel} lat={weather.lat} lng={weather.lng} />
            </div>
          ) : null}
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-[#8fd0ff]">Overview</p>
            <h2 className="mt-2 text-3xl font-bold">How this category fits a trip</h2>
            <p className="mt-4 text-base leading-8 text-white/78">{intro}</p>
          </article>
          <aside className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-[#8fd0ff]">Good to know</p>
            <div className="mt-4 space-y-3">
              {bullets.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/74">
                  {item}
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-[#8fd0ff]">Types of tours</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {intents.map((item) => (
              <article key={item.query} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-lg font-semibold text-white">{item.label}</h3>
                <p className="mt-3 text-sm leading-7 text-white/74">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <ViatorTourGrid
          placeName={`${cityName} ${title}`}
          title="Popular tours"
          description="These guided experiences are included as helpful options for visitors who already know this category is a good fit."
          products={products}
          fallbacks={intents.map((item) => ({ label: item.label, query: item.query }))}
          ctaLabel="View experience"
        />
      </div>
    </main>
  );
}
