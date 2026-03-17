// app/tours/[id]/page.tsx
export const dynamicParams = true;

import type { Metadata } from "next";
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
import { getViatorProductDetailForTour } from "@/lib/viator/detail";
import { getProductCacheStatus } from "@/lib/viator/cache-status";
import {
  getReviewFreshnessLabel,
  getViatorIndexablePdpMetadata,
  getViatorReviewContentNotice,
  getViatorTravelerPhotoNotice,
} from "@/lib/viator/reviews";

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
  product_code?: string;
};

const allTours = tours as unknown as Tour[];

export const metadata: Metadata = getViatorIndexablePdpMetadata();

export function generateStaticParams() {
  return allTours
    .filter((t) => t?.id !== undefined && t?.id !== null)
    .map((t) => ({ id: String(t.id) }));
}

function buildFallbackTourFromDetail(id: string, detail: NonNullable<Awaited<ReturnType<typeof getViatorProductDetailForTour>>["detail"]>): Tour {
  return {
    id,
    product_code: detail.product_code,
    name: detail.title,
    description: detail.overview || detail.short_description || undefined,
    image_url: detail.image_url || detail.supplierImages[0]?.url || undefined,
    city: detail.destinations[0]?.name || undefined,
    price_from: detail.price_from ?? undefined,
    rating: detail.rating ?? undefined,
    review_count: detail.review_count ?? undefined,
    duration: detail.durationText || undefined,
  };
}

// NEXT.js 15 UPDATE: params is now a Promise
export default async function TourDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // Await params at the top of the component
  const resolvedParams = await params;
  const seededTour = allTours.find((t) => String(t.id) === resolvedParams.id);
  const { detail: productDetail, source: productDetailSource } = await getViatorProductDetailForTour({
    id: resolvedParams.id,
    productCode: seededTour?.product_code || (seededTour ? null : resolvedParams.id),
  });
  const tour =
    seededTour ||
    (productDetail ? buildFallbackTourFromDetail(resolvedParams.id, productDetail) : null);

  if (!tour) return notFound();
  const reviewCacheStatus = getProductCacheStatus(productDetail?.product_code || tour.product_code || null);

  // --- 1. DATA CALCULATIONS ---
  const rating = Number(productDetail?.rating ?? tour.rating ?? 4.8);
  const reviews = Number(productDetail?.review_count ?? tour.review_count ?? 120);
  const price = productDetail?.price_from ?? tour.price_from ?? null;
  const affiliateUrl = buildViatorLink(tour);
  const takeaways = summarizeGuestFeedback({
    title: productDetail?.title || tour.name,
    description: productDetail?.overview || tour.description,
    durationText: productDetail?.durationText || tour.duration,
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
              name: productDetail?.title || tour.name,
              description:
                productDetail?.overview ||
                tour.description ||
                `Travel experience in ${tour.city}`,
              image: productDetail?.image_url || tour.image_url || undefined,
              price,
              currency: productDetail?.currency || "USD",
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
              { name: productDetail?.title || tour.name, item: `/tours/${tour.id}` },
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
          <h1 className="text-4xl font-black mt-3 tracking-tight">{productDetail?.title || tour.name}</h1>
          {(productDetail?.durationText || tour.duration) ? (
            <div className="text-zinc-400 mt-2 text-sm italic">⏱ {productDetail?.durationText || tour.duration}</div>
          ) : null}
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

      {productDetail ? (
        <section className="mb-16 space-y-6">
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h3 className="text-cyan-400">Overview</h3>
            <div className="mt-4 space-y-3 text-sm text-zinc-300">
              {productDetail.overview ? <p>{productDetail.overview}</p> : null}
              {productDetail.highlights.length > 0 ? (
                <p>Highlights: {productDetail.highlights.slice(0, 4).join(" • ")}</p>
              ) : null}
              {productDetail.durationText ? <p>Duration: {productDetail.durationText}</p> : null}
              {productDetail.operatedBy ? <p>Operated by: {productDetail.operatedBy}</p> : null}
              <p className="text-zinc-500">Detail source: {productDetailSource}</p>
            </div>
          </article>
          <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h3 className="text-cyan-400">Trip details</h3>
            <div className="mt-4 space-y-3 text-sm text-zinc-300">
              {productDetail.languages.length > 0 ? <p>Languages: {productDetail.languages.join(", ")}</p> : null}
              {productDetail.ticketType ? <p>Ticket type: {productDetail.ticketType}</p> : null}
              {productDetail.confirmationType ? <p>Confirmation: {productDetail.confirmationType}</p> : null}
              {productDetail.cancellationPolicy?.description ? (
                <p>Cancellation: {productDetail.cancellationPolicy.description}</p>
              ) : null}
              {productDetail.redemptionInstructions.length > 0 ? (
                <p>Redemption: {productDetail.redemptionInstructions.slice(0, 3).join(" • ")}</p>
              ) : null}
              {productDetail.pickup.length > 0 ? <p>Pickup: {productDetail.pickup.join(" • ")}</p> : null}
              {productDetail.departure.length > 0 ? <p>Departure: {productDetail.departure.join(" • ")}</p> : null}
              {productDetail.returnDetails.length > 0 ? <p>Return: {productDetail.returnDetails.join(" • ")}</p> : null}
            </div>
          </article>
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h3 className="text-cyan-400">What is included</h3>
            <div className="mt-4 space-y-4 text-sm text-zinc-300">
              {productDetail.inclusions.length > 0 ? (
                <p>Included: {productDetail.inclusions.join(" • ")}</p>
              ) : (
                <p>Check the live Viator page for the latest inclusions and exclusions.</p>
              )}
              {productDetail.exclusions.length > 0 ? (
                <p>Not included: {productDetail.exclusions.join(" • ")}</p>
              ) : null}
              {productDetail.itinerary.length > 0 ? (
                <p>Itinerary: {productDetail.itinerary.slice(0, 3).join(" • ")}</p>
              ) : null}
            </div>
          </article>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <article className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <h3 className="text-cyan-400">Additional info</h3>
              <div className="mt-4 space-y-3 text-sm text-zinc-300">
                {productDetail.additionalInfo.length > 0 ? (
                  <p>{productDetail.additionalInfo.slice(0, 5).join(" • ")}</p>
                ) : (
                  <p>Live Viator detail can add operational notes, restrictions, and logistical details here.</p>
                )}
                {productDetail.importantNotes.length > 0 ? (
                  <p>Important: {productDetail.importantNotes.slice(0, 4).join(" • ")}</p>
                ) : null}
              </div>
            </article>
            <article className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <h3 className="text-cyan-400">Supplier photos</h3>
              <div className="mt-4 space-y-3 text-sm text-zinc-300">
                <p>Supplier images available: {productDetail.supplierImages.length}</p>
                {productDetail.supplierImages.length > 0 ? (
                  <p className="text-zinc-400">Live supplier media stays separate from traveler-submitted media.</p>
                ) : (
                  <p>No supplier photo set is cached for this product yet.</p>
                )}
              </div>
            </article>
          </div>
        </section>
      ) : null}

      <PoweredByViator
        compact
        disclosure
        body={`Use DCC to evaluate this experience quickly, then continue to Viator when you're ready to check availability and complete checkout.`}
        className="mb-16"
      />

      <section className="mb-16 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
        <h3 className="text-cyan-400">Reviews and traveler photos</h3>
        <p className="mt-3 text-sm text-zinc-300">{getViatorReviewContentNotice()}</p>
        <p className="mt-2 text-sm text-zinc-400">{getViatorTravelerPhotoNotice()}</p>
        {productDetail?.reviews?.length ? (
          <p className="mt-3 text-sm text-zinc-300">
            {productDetail.reviews.length} cached reviews. {getReviewFreshnessLabel(reviewCacheStatus.updatedAt)}
          </p>
        ) : (
          <p className="mt-3 text-sm text-zinc-300">No cached review payload is attached to this product yet.</p>
        )}
        {productDetail?.travelerImages?.length ? (
          <p className="mt-3 text-sm text-zinc-300">
            Cached traveler photos available: {productDetail.travelerImages.length}
          </p>
        ) : null}
        {productDetail?.reviews?.slice(0, 2).map((review) => (
          <div key={review.reviewId} className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 text-sm text-zinc-300">
            <p className="font-semibold text-white">{review.title || review.userName || "Traveler review"}</p>
            {review.text ? <p className="mt-2">{review.text}</p> : null}
          </div>
        ))}
      </section>

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
