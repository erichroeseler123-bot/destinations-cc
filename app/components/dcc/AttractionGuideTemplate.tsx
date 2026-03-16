import Link from "next/link";
import type { ViatorActionProduct } from "@/lib/dcc/action/viator";
import type { AttractionManifest } from "@/lib/dcc/manifests/cityExpansion";
import AttractionExperienceSection from "@/app/components/dcc/AttractionExperienceSection";
import CityTimePanel from "@/app/components/dcc/CityTimePanel";
import WeatherPanel from "@/app/components/dcc/WeatherPanel";
import HeroVisual from "@/app/components/dcc/HeroVisual";

export default function AttractionGuideTemplate({
  entry,
  products,
  time,
  weather,
}: {
  entry: AttractionManifest["attractions"][number];
  products: ViatorActionProduct[];
  time?: {
    cityName: string;
    timezone: string;
  } | null;
  weather?: {
    locationLabel: string;
    lat: number;
    lng: number;
  } | null;
}) {
  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-10">
        <header className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,176,124,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(61,243,255,0.10),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(7,11,25,0.98))] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.45)] md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#ffb07c]">Attraction guide</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">{entry.heroTitle}</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-white/82">{entry.heroSummary}</p>
              {entry.trustLine ? <p className="mt-4 max-w-3xl text-sm leading-7 text-white/66">{entry.trustLine}</p> : null}
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href={entry.primaryToursHref || "#"} className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400">
                  Browse local tours
                </Link>
                <Link href={entry.thingsToDoHref || "#"} className="rounded-2xl border border-white/12 bg-white/6 px-5 py-3 text-sm text-white/88 hover:bg-white/10">
                  Explore things to do
                </Link>
              </div>
              {time || weather ? (
                <div className="mt-6 grid gap-3 md:grid-cols-2 md:items-start">
                  {time ? <CityTimePanel cityName={time.cityName} timezone={time.timezone} showWeekday /> : null}
                  {weather ? (
                    <WeatherPanel locationLabel={weather.locationLabel} lat={weather.lat} lng={weather.lng} />
                  ) : null}
                </div>
              ) : null}
            </div>

            <HeroVisual
              canonicalPath={entry.primaryToursHref ? entry.primaryToursHref.replace(/\/tours$/, "") : undefined}
              image={entry.heroImage}
              fallbackTitle={entry.name}
              fallbackSubtitle={entry.summary || entry.heroSummary}
              fallbackType={entry.type}
            />
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.35fr_0.85fr]">
          <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-[#8fd0ff]">About the attraction</p>
            <h2 className="mt-2 text-3xl font-bold">What makes {entry.name} worth your time</h2>
            <p className="mt-4 text-base leading-8 text-white/78">{entry.about || entry.heroSummary}</p>
          </article>
          <aside className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-[#8fd0ff]">Practical visitor information</p>
            <div className="mt-4 space-y-4">
              {(entry.visitorInfo || []).map((item) => (
                <div key={item.label} className="border-b border-white/10 pb-4 last:border-b-0 last:pb-0">
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="mt-2 text-sm leading-7 text-white/68">{item.value}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-[#8fd0ff]">Things to do there</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {(entry.thingsToDo || []).map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/76">
                {item}
              </div>
            ))}
          </div>
        </section>

        <AttractionExperienceSection entry={entry} products={products} />

        <section className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-[#8fd0ff]">Travel planning tips</p>
            <h2 className="mt-2 text-3xl font-bold">How to plan the area well</h2>
            <div className="mt-5 space-y-3">
              {(entry.planningTips || []).map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/76">
                  {item}
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-[#8fd0ff]">Related attractions</p>
            <h2 className="mt-2 text-3xl font-bold">Keep exploring nearby</h2>
            <div className="mt-5 grid gap-3">
              {(entry.relatedAttractions || []).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/82 hover:bg-white/10"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
