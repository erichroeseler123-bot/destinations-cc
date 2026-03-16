// app/tours/[id]/page.tsx
export const dynamicParams = false;

import tours from "@/data/tours.json";
import LocalTimeWeather from "@/components/LocalTimeWeather";
import TrustBadges from "@/components/TrustBadges";
import { notFound } from "next/navigation";
import { buildViatorLink } from "@/utils/affiliateLinks";
import Link from "next/link";
import PoweredByViator from "@/app/components/dcc/PoweredByViator";
import TravelerTakeaways from "@/app/components/dcc/TravelerTakeaways";
import { summarizeGuestFeedback } from "@/lib/dcc/guestFeedback";
import OperatorAboutCard from "@/app/components/dcc/OperatorAboutCard";
import { getOperatorManifest, mergeOperatorRef, type TourOperatorRef } from "@/lib/dcc/operators";
import JsonLd from "@/app/components/dcc/JsonLd";
import { buildBreadcrumbJsonLd, buildTourJsonLd } from "@/lib/dcc/jsonld";

type Tour = {
  id: string | number;
  name: string;
  description?: string;
  image_url?: string;
  city?: string;
  region?: string;
  price_from?: number;
  rating?: number;
  review_count?: number;
  lat?: number;
  lng?: number;
  timezone?: string;
  duration?: string;
  operator?: TourOperatorRef;
};

const allTours = tours as unknown as Tour[];

export function generateStaticParams() {
  return allTours
    .filter((t) => t?.id !== undefined && t?.id !== null)
    .map((t) => ({ id: String(t.id) }));
}

// NEXT.js 15 UPDATE: params is now a Promise
export default async function TourDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // Await params at the top of the component
  const resolvedParams = await params;
  const tour = allTours.find((t) => String(t.id) === resolvedParams.id);

  if (!tour) return notFound();

  // --- 1. DATA CALCULATIONS ---
  const rating = Number(tour.rating ?? 4.8);
  const reviews = Number(tour.review_count ?? 120);
  const price = tour.price_from ?? null;
  const affiliateUrl = buildViatorLink(tour);
  const takeaways = summarizeGuestFeedback({
    title: tour.name,
    description: tour.description,
    durationText: tour.duration,
    rating,
    reviewCount: reviews,
  });
  const operatorRef = mergeOperatorRef(tour.operator);
  const operator = operatorRef?.slug ? getOperatorManifest(operatorRef.slug) : null;
  const operatorTourCount =
    operatorRef?.slug
      ? allTours.filter((candidate) => candidate.operator?.slug === operatorRef.slug).length
      : undefined;

  // --- CHANGE #4: DCC Trust Score Logic ---
  const trustScore = Math.round((rating * 15) + (Math.min(reviews, 500) / 20));

  // --- CHANGE #2: Dynamic Business Hours Logic ---
  let isBusinessHours = false;
  if (tour.timezone) {
    try {
      const hour = parseInt(new Intl.DateTimeFormat('en-US', {
        timeZone: tour.timezone,
        hour: 'numeric',
        hour12: false
      }).format(new Date()));
      isBusinessHours = hour >= 8 && hour <= 18;
    } catch (e) {
      console.error("Timezone error:", e);
    }
  }

  // --- CHANGE #1: JSON-LD Schema Object ---
  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildTourJsonLd({
              path: `/tours/${tour.id}`,
              name: tour.name,
              description: tour.description || `Travel experience in ${tour.city}`,
              image: tour.image_url || undefined,
              price,
              currency: "USD",
              rating,
              reviewCount: reviews,
              touristTypes: ["First-time visitors", "Experience-focused travelers"],
              provider: operator
                ? {
                    name: operator.name,
                    url: operator.website,
                  }
                : null,
            }),
            buildBreadcrumbJsonLd([
              { name: "Tours", item: "/tours" },
              { name: tour.name, item: `/tours/${tour.id}` },
            ]),
          ],
        }}
      />

      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 text-xs font-bold uppercase tracking-widest border border-cyan-400/30 px-2 py-1 rounded">
              DCC Verified
            </span>
            <span className="text-zinc-500 text-[10px] uppercase tracking-tighter">
              Reliability: <span className="text-white font-bold">{trustScore}%</span>
            </span>
          </div>
          <h1 className="text-4xl font-black mt-3 tracking-tight">{tour.name}</h1>
          {tour.duration && <div className="text-zinc-400 mt-2 text-sm italic">⏱ {tour.duration}</div>}
        </div>

        {tour.lat && tour.lng && tour.timezone && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <LocalTimeWeather lat={tour.lat} lng={tour.lng} timezone={tour.timezone} />
          </div>
        )}
      </div>

      <TrustBadges reviews={reviews} rating={rating} />

      {/* DECISION SUPPORT */}
      <section className="mb-16 mt-12 space-y-6">
        <article className="prose prose-invert max-w-none">
          <h3 className="text-cyan-400">About this experience</h3>
          <p className="text-zinc-300 leading-relaxed">
            {tour.description ||
              `This experience is listed on DCC to help travelers compare timing, fit, and booking options in ${tour.city}.`}
          </p>
        </article>
        {takeaways ? <TravelerTakeaways summary={takeaways} /> : null}
      </section>

      <PoweredByViator
        compact
        disclosure
        body={`Use DCC to evaluate this experience quickly, then book with DCC via Viator when you're ready to check availability and complete checkout.`}
        className="mb-16"
      />

      {operator ? (
        <div className="mb-16">
          <OperatorAboutCard operator={operator} tourCount={operatorTourCount} />
        </div>
      ) : null}

      {/* CHANGE #3: Regional Retention Block */}
      <section className="mb-20 border-t border-zinc-800 pt-10">
        <h4 className="text-sm font-bold uppercase text-zinc-500 mb-6 tracking-widest">
          More in {tour.region || tour.city}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {allTours
            .filter(t => t.city === tour.city && String(t.id) !== String(tour.id))
            .slice(0, 2)
            .map(t => (
              <Link 
                key={t.id} 
                href={`/tours/${t.id}`} 
                className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-xl hover:border-cyan-500/50 transition group"
              >
                <span className="text-sm font-semibold group-hover:text-cyan-400 transition">{t.name}</span>
              </Link>
            ))}
        </div>
      </section>

      {/* STICKY CTA */}
      <div className="sticky bottom-4 bg-zinc-950/90 backdrop-blur-md border border-cyan-500/30 p-6 rounded-2xl shadow-2xl flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <p className="text-zinc-500 text-xs uppercase font-bold tracking-tight">Best rate found</p>
          <p className="text-3xl font-black text-white">{price ? `$${price}` : "Live Rates"}</p>
        </div>

        <a
          href={affiliateUrl}
          target="_blank"
          rel="noopener noreferrer sponsored nofollow"
          className="text-center bg-cyan-600 hover:bg-cyan-500 text-white px-10 py-4 rounded-xl font-bold transition-all shadow-lg shadow-cyan-600/20 active:scale-95"
        >
          {isBusinessHours ? "Book with DCC via Viator" : "Check Availability via Viator"}
        </a>
        <p className="text-[11px] text-zinc-500 sm:max-w-sm">
          Powered by Viator. DCC may earn a commission if you book through this partner link, at no extra cost to you.
        </p>
      </div>
    </main>
  );
}
