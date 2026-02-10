export const dynamicParams = false;



import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import nodes from "@/data/nodes.json";
import toursData from "@/data/tours.json";
import CityCrossLinks from "@/components/CityCrossLinks";
import { getNodeSlugFromCity } from "@/src/data/city-aliases";

import aliases from "@/data/city-aliases.json";


export async function generateStaticParams() {
  return Object.keys(aliases).map((city) => ({ city }));
}


/* ========================================
   Types
======================================== */

interface Node {
  slug: string;
  name: string;
  status: string;
}

type Tour = {
  // NEW/simple shape
  id?: string;
  name?: string;
  city?: string;
  price_from?: number;
  rating?: number;
  review_count?: number;
  lat?: number;
  lng?: number;
  timezone?: string;
  duration?: string;

  // OLD/viator-ish shape
  productCode?: string;
  title?: string;
  shortDescription?: string;
  fromPrice?: number;
  currency?: string;
  primaryImageUrl?: string;
  viatorUrl?: string;
  reviewRating?: number;
  reviewCount?: number;
  tags?: string[];
  lastUpdated?: string;
};

/* ========================================
   Helpers
======================================== */

function normalizeCityKey(city: string) {
  return city.trim().toLowerCase();
}

function toSlugLike(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatPrice(price?: number, currency = "USD") {
  if (price === null || price === undefined || Number.isNaN(price)) return "Check price";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price);
}

function tourTitle(t: Tour) {
  return t.name || t.title || "Tour";
}

function tourId(t: Tour) {
  return String(t.id ?? t.productCode ?? "");
}

function tourPrice(t: Tour) {
  const p = t.price_from ?? t.fromPrice;
  return typeof p === "number" ? p : undefined;
}

function tourRating(t: Tour) {
  return typeof t.rating === "number" ? t.rating : t.reviewRating;
}

function tourReviews(t: Tour) {
  return typeof t.review_count === "number" ? t.review_count : t.reviewCount;
}

function tourImage(t: Tour) {
  return t.primaryImageUrl;
}

function matchesCity(t: Tour, cityKey: string, cityName: string) {
  const ck = toSlugLike(cityKey);
  const cn = cityName.toLowerCase();

  const tCity = (t.city || "").toString();
  if (tCity) {
    const tCityKey = toSlugLike(tCity);
    if (tCityKey === ck || tCity.toLowerCase() === cn) return true;
  }

  const hay = `${tourTitle(t)} ${t.shortDescription || ""}`.toLowerCase();
  if (cn && hay.includes(cn)) return true;
  if (ck && hay.includes(ck.replace(/-/g, " "))) return true;

  return false;
}

function normalizeTours(input: any): Tour[] {
  if (Array.isArray(input)) return input as Tour[];

  if (input && typeof input === "object") {
    const candidates = [input.tours, input.items, input.results, input.data, input.default];
    for (const c of candidates) if (Array.isArray(c)) return c as Tour[];

    const vals = Object.values(input);
    if (vals.length && vals.every((v) => v && typeof v === "object")) return vals as Tour[];
  }

  return [];
}

/* ========================================
   Metadata
======================================== */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;

  const cityKey = normalizeCityKey(resolvedParams.city);
  const pretty = cityKey.replace(/-/g, " ");

  return {
    title: `${pretty} Tours | Best Experiences & Tickets`,
    description: `Browse top-rated tours and experiences in ${pretty}. Compare prices, reviews, and availability.`,
    openGraph: {
      title: `${pretty} Tours | Destination Command Center`,
      description: `Top tours, activities, and experiences in ${pretty}.`,
      type: "website",
    },
  };
}

/* ========================================
   Page
======================================== */

export default async function ToursPage({ params }: { params: Promise<{ city: string }> }) {
  const resolvedParams = await params;

  const cityKey = normalizeCityKey(resolvedParams.city);

  const nodeSlug = getNodeSlugFromCity(cityKey);
  if (!nodeSlug) notFound();

  const node = (nodes as Node[]).find((n) => n.slug === nodeSlug);
  if (!node || node.status !== "active") notFound();

  const cityName = node.name.replace(" Guide", "");

  const allTours = normalizeTours(toursData);
  const tours = allTours.filter((t) => matchesCity(t, cityKey, cityName));

  return (
    <main className="max-w-7xl mx-auto px-6 py-24 space-y-20">
      <header className="space-y-6 border-b border-zinc-800 pb-12">
        <p className="text-xs uppercase tracking-wider text-cyan-400">
          Tours • Activities • Tickets
        </p>

        <h1 className="text-4xl md:text-6xl font-black">Best Tours in {cityName}</h1>

        <p className="max-w-3xl text-zinc-400 text-lg">
          Hand-picked tours and experiences in {cityName}. Compare ratings, prices, and availability
          from verified providers.
        </p>
      </header>

      {tours.length ? (
        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tours.map((t) => {
            const id = tourId(t);
            const title = tourTitle(t);
            const price = tourPrice(t);
            const rating = tourRating(t);
            const reviews = tourReviews(t);
            const img = tourImage(t);

            return (
              <div
                key={id || title}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4 hover:bg-zinc-900 transition"
              >
                {img ? (
                  <img
                    src={img}
                    alt={title}
                    className="w-full h-44 object-cover rounded-xl"
                    loading="lazy"
                  />
                ) : null}

                <div className="space-y-2">
                  <h2 className="font-semibold text-lg leading-snug">{title}</h2>

                  {t.duration ? <div className="text-sm text-zinc-400">⏱ {t.duration}</div> : null}

                  <div className="text-sm text-zinc-300">
                    {price !== undefined ? (
                      <span className="font-semibold">{formatPrice(price, t.currency || "USD")}</span>
                    ) : (
                      <span className="text-zinc-400">Check price</span>
                    )}
                  </div>

                  {rating ? (
                    <div className="text-sm text-zinc-400">
                      ⭐ {Number(rating).toFixed(1)}
                      {reviews ? <> ({Number(reviews).toLocaleString()} reviews)</> : null}
                    </div>
                  ) : null}

                  {t.shortDescription ? (
                    <p className="text-sm text-zinc-400 line-clamp-3">{t.shortDescription}</p>
                  ) : null}
                </div>

                {id ? (
                  <Link
                    href={`/tours/${encodeURIComponent(id)}`}
                    className="block text-center mt-3 font-semibold text-white bg-cyan-600 hover:bg-cyan-500 px-5 py-3 rounded-xl transition shadow-lg shadow-cyan-600/20"
                  >
                    View details →
                  </Link>
                ) : (
                  <a
                    href={t.viatorUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="block text-center mt-3 font-semibold text-white bg-cyan-600 hover:bg-cyan-500 px-5 py-3 rounded-xl transition shadow-lg shadow-cyan-600/20"
                  >
                    Check availability →
                  </a>
                )}
              </div>
            );
          })}
        </section>
      ) : (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 space-y-4">
          <p className="text-zinc-300">
            No tours are loaded for {cityName} yet. Once tours are added to{" "}
            <code className="px-2">data/tours.json</code>, they will appear automatically.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/nodes/${nodeSlug}`}
              className="inline-block text-center font-semibold text-white bg-cyan-600 hover:bg-cyan-500 px-5 py-3 rounded-xl transition"
            >
              View {cityName} node →
            </Link>

            <Link
              href="/"
              className="inline-block text-center font-semibold text-zinc-200 border border-zinc-700 hover:border-zinc-500 px-5 py-3 rounded-xl transition"
            >
              Back to Home
            </Link>
          </div>
        </section>
      )}

      <CityCrossLinks city={cityKey} cityName={cityName} />
    </main>
  );
}
