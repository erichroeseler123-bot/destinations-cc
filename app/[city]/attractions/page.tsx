import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import tours from "@/data/tours.json";
import aliases from "@/data/city-aliases.json";
import attractionsMap from "@/data/attractions.json";
import { getNodeSlugFromCity } from "@/src/data/city-aliases";
import { getCityManifest, getAttractionsManifest } from "@/lib/dcc/manifests/cityExpansion";

export const dynamicParams = false;
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

type Tour = {
  id: string | number;
  name: string;
  city?: string;
  region?: string;
  price_from?: number;
  rating?: number;
  review_count?: number;
};

type AttractionLite = {
  title: string;
  description: string;
  query: string;
  badge?: string;
};

const allTours = tours as unknown as Tour[];

export async function generateStaticParams() {
  return Object.keys(aliases).map((city) => ({ city }));
}

function titleCase(s: string) {
  return s
    .split(/[\s-]+/g)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function slugifyCity(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, "-");
}

export default async function CityAttractionsPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;

  const nodeSlug = getNodeSlugFromCity(city);
  if (!nodeSlug) return notFound();

  const displayCity = titleCase(city);
  const cityKey = city; // city param is already a slug key like "juneau", "denver", etc.
  const cityManifest = getCityManifest(cityKey);
  const attractionsManifest = getAttractionsManifest(cityKey);

  if (cityManifest && attractionsManifest?.attractions?.length) {
    return (
      <main className="min-h-screen bg-[#050816] text-white">
        <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
          <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,176,124,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(61,243,255,0.10),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(7,11,25,0.98))] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.45)] md:p-10">
            <p className="text-xs uppercase tracking-[0.24em] text-[#ffb07c]">{displayCity} attractions</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">{displayCity} attraction guides</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-white/82">
              Explore the landmarks, neighborhoods, and attraction guides that lead naturally into tours and local experiences.
            </p>
          </header>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {attractionsManifest.attractions.map((item) => (
              <article key={item.slug} className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
                <h2 className="text-xl font-semibold text-white">{item.name}</h2>
                <p className="mt-3 text-sm leading-7 text-white/74">{item.heroSummary}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href={`/${cityKey}/${item.slug}`} className="text-sm font-medium text-cyan-200 hover:text-cyan-100">
                    Open guide →
                  </Link>
                  <Link href={`/${cityKey}/${item.slug}/tours`} className="text-sm text-white/68 hover:text-white/88">
                    Guided experiences →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
    );
  }

  const curated = (attractionsMap as any)[cityKey] as AttractionLite[] | undefined;

  const cityTours = allTours
    .filter((t) => t?.city && slugifyCity(t.city) === city)
    .slice(0, 24);

  return (
    <main className="max-w-5xl mx-auto px-6 py-16 space-y-10">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-cyan-400 text-xs font-bold uppercase tracking-widest border border-cyan-400/30 px-2 py-1 rounded">
            DCC City Guide
          </span>
          <span className="text-zinc-500 text-[11px] uppercase tracking-tighter">
            Node: <span className="text-cyan-300 font-mono">{nodeSlug}</span>
          </span>
        </div>

        <h1 className="text-4xl font-black capitalize tracking-tight">
          {displayCity} Attractions
        </h1>

        <p className="text-zinc-400 max-w-2xl">
          Curated categories first (fast intent routing). Tours appear automatically once your ingest pipeline maps
          real products to this city.
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          <Link className="text-cyan-400 hover:text-cyan-300 transition" href={`/${city}`}>
            ← Back to {displayCity}
          </Link>
          <Link className="text-zinc-400 hover:text-cyan-400 transition" href={`/${city}/tours`}>
            Tours →
          </Link>
        </div>
      </header>

      {/* ---- Curated attractions.json cards (always show if present) ---- */}
      {curated?.length ? (
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase text-zinc-500 tracking-widest">
            Curated categories
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {curated.map((x, idx) => (
              <Link
                key={`${x.title}-${idx}`}
                href={`/${city}/tours?q=${encodeURIComponent(x.query)}`}
                className="p-5 bg-zinc-900/30 border border-zinc-800 rounded-2xl hover:border-cyan-500/50 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-white font-bold leading-snug">
                      {x.title}
                      {x.badge ? (
                        <span className="ml-2 text-[11px] uppercase tracking-widest text-cyan-300 border border-cyan-400/20 px-2 py-0.5 rounded-full">
                          {x.badge}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-zinc-500 text-sm mt-2">{x.description}</div>
                    <div className="text-zinc-600 text-xs mt-3">
                      Query: <span className="text-zinc-400">{x.query}</span>
                    </div>
                  </div>
                  <div className="text-cyan-500 font-bold">→</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
          <p className="text-zinc-300 font-semibold">No curated attractions yet.</p>
          <p className="text-zinc-500 mt-2 text-sm">
            Add entries in <span className="font-mono text-zinc-300">data/attractions.json</span> for &quot;{cityKey}&quot;.
          </p>
        </div>
      )}

      {/* ---- Existing tours surface (kept, lights up when ingest is real) ---- */}
      {cityTours.length === 0 ? (
        <div className="p-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
          <p className="text-zinc-300 font-semibold">No tours mapped to this city yet.</p>
          <p className="text-zinc-500 mt-2 text-sm">
            This is expected until your ingest batch populates tours with matching <span className="font-mono">tour.city</span>.
          </p>
        </div>
      ) : (
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase text-zinc-500 tracking-widest">
            Top picks in {displayCity}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cityTours.map((t) => (
              <Link
                key={String(t.id)}
                href={`/tours/${t.id}`}
                className="p-5 bg-zinc-900/30 border border-zinc-800 rounded-2xl hover:border-cyan-500/50 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-white font-bold leading-snug">{t.name}</div>
                    <div className="text-zinc-500 text-sm mt-2">
                      {t.rating ? `${t.rating}★` : "—"}{" "}
                      {t.review_count ? `(${t.review_count} reviews)` : ""}
                      {t.price_from ? ` • from $${t.price_from}` : ""}
                    </div>
                  </div>
                  <div className="text-cyan-500 font-bold">→</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
