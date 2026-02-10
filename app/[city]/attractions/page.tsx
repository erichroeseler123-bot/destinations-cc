export const dynamicParams = false;

import Link from "next/link";
import { notFound } from "next/navigation";

import tours from "@/data/tours.json";
import aliases from "@/data/city-aliases.json";
import { getNodeSlugFromCity } from "@/src/data/city-aliases";

type Tour = {
  id: string | number;
  name: string;
  city?: string;
  region?: string;
  price_from?: number;
  rating?: number;
  review_count?: number;
};

const allTours = tours as unknown as Tour[];

export async function generateStaticParams() {
  return Object.keys(aliases).map((city) => ({ city }));
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

  const displayCity = city.replace(/-/g, " ");
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
          Programmatic “Attractions” hub page (build-safe). Today it surfaces tours by matching tour.city → URL city slug.
          Later, you can swap this to a real attractions catalog without changing the route structure.
        </p>
      </header>

      {cityTours.length === 0 ? (
        <div className="p-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
          <p className="text-zinc-300 font-semibold">No tours mapped to this city yet.</p>
          <p className="text-zinc-500 mt-2 text-sm">
            This is expected until Alaska ports (or your next ingest batch) populates tours with matching city fields.
          </p>
          <div className="mt-6">
            <Link className="text-cyan-400 hover:text-cyan-300 transition" href={`/${city}`}>
              ← Back to {displayCity}
            </Link>
          </div>
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

          <div className="pt-10 border-t border-zinc-800">
            <Link className="text-zinc-400 hover:text-cyan-400 transition" href={`/${city}`}>
              ← Back to {displayCity}
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
