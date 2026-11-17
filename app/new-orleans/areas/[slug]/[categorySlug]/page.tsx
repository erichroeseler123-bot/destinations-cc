import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNewOrleansDirectorySnapshot } from "@/lib/dcc/shared/newOrleansDirectoryData";

export function generateStaticParams() {
  const snapshot = getNewOrleansDirectorySnapshot();
  return snapshot.areaCategories.map((entry) => ({
    slug: entry.areaSlug,
    categorySlug: entry.category.categorySlug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; categorySlug: string }>;
}): Promise<Metadata> {
  const { slug, categorySlug } = await params;
  const snapshot = getNewOrleansDirectorySnapshot();
  const match = snapshot.areaCategories.find(
    (entry) =>
      entry.areaSlug === slug && entry.category.categorySlug === categorySlug,
  );
  if (!match) return {};

  const title =
    match.comparison?.title || `${match.areaName} ${match.category.name} Comparison`;
  const description =
    match.comparison?.metaDescription || match.category.summary;

  return {
    title,
    description,
    alternates: {
      canonical: match.gate.indexable
        ? `/areas/${slug}/${categorySlug}`
        : `/areas/${slug}`,
    },
    robots: {
      index: match.gate.indexable,
      follow: true,
    },
  };
}

export default async function AreaCategoryComparisonPage({
  params,
}: {
  params: Promise<{ slug: string; categorySlug: string }>;
}) {
  const { slug, categorySlug } = await params;
  const snapshot = getNewOrleansDirectorySnapshot();
  const match = snapshot.areaCategories.find(
    (entry) =>
      entry.areaSlug === slug && entry.category.categorySlug === categorySlug,
  );
  if (!match) notFound();

  const placeEntry = snapshot.places.find((p) => p.place.publicPlaceSlug === slug);
  const qualifiedOpIds = new Set(
    snapshot.operators
      .filter((o) => o.gate.indexable)
      .map((o) => o.operator.operatorId),
  );
  const matchingProducts = snapshot.operators
    .filter((o) => o.gate.indexable)
    .flatMap((o) => o.products)
    .filter(
      (prod) =>
        !prod.isCommerciallyHeld &&
        Boolean(prod.verifiedAt) &&
        qualifiedOpIds.has(prod.operatorId) &&
        prod.categorySlug === categorySlug &&
        (prod.placeSlug === slug ||
          (placeEntry &&
            prod.visitedHistoricSiteIds?.includes(placeEntry.place.placeId))),
    );

  return (
    <main className="min-h-screen bg-[#080708] px-6 py-14 text-[#fdfbf7]">
      <div className="mx-auto max-w-5xl">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-white/60">
          <Link href="/areas" className="hover:text-[#d4af37]">
            Areas &amp; Basins
          </Link>
          <span>/</span>
          <Link href={`/areas/${slug}`} className="hover:text-[#d4af37]">
            {match.areaName}
          </Link>
          <span>/</span>
          <span className="text-[#d4af37]">{match.category.name}</span>
        </nav>

        {!match.gate.indexable && (
          <div
            data-testid="held-area-category-banner"
            className="mb-8 rounded-xl border border-amber-400/40 bg-amber-950/30 p-5 text-xs text-amber-100"
          >
            <strong className="uppercase tracking-wider text-amber-300">
              Consolidated Area Category (noindex, follow):
            </strong>{" "}
            This area-category intersection currently has fewer than 2 distinct verified operators
            or fewer than 3 active products and remains consolidated under{" "}
            <Link href={`/areas/${slug}`} className="underline font-semibold">
              /areas/{slug}
            </Link>
            .
          </div>
        )}

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">
          {match.areaName} · {match.operatorCount} Verified Operators ·{" "}
          {match.productCount} Active Tours
        </p>
        <h1 className="mt-2 font-serif text-3xl md:text-5xl">
          {match.comparison?.h1 || `${match.areaName} ${match.category.name}`}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-white/85">
          {match.comparison?.comparisonIntro || match.category.summary}
        </p>

        {match.comparison && (
          <div className="mt-8 rounded-xl border border-white/15 bg-[#121016] p-6">
            <h2 className="font-serif text-2xl">Key differences to check before booking</h2>
            <ul className="mt-4 list-disc space-y-2.5 pl-5 text-sm text-white/80">
              {match.comparison.keyDifferencesBullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
            <p className="mt-4 border-t border-white/10 pt-4 text-xs text-amber-200/90">
              <strong>Arrival &amp; Timing Guidance:</strong>{" "}
              {match.comparison.arrivalAndTimingGuidance}
            </p>
          </div>
        )}

        <div className="mt-10 space-y-4">
          {matchingProducts.map((prod) => (
            <article
              key={prod.productId}
              className="rounded-xl border border-white/15 bg-[#121016] p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={`/operators/${prod.operatorSlug}`}
                  className="text-xs font-bold uppercase tracking-wider text-[#d4af37] underline"
                >
                  {prod.operatorName}
                </Link>
                <span className="text-xs text-white/70">{prod.durationLabel}</span>
              </div>
              <h3 className="mt-2 font-serif text-2xl text-white">{prod.title}</h3>
              <p className="mt-2 text-sm text-white/80">{prod.summary}</p>
              <p className="mt-3 text-xs text-white/75">
                <strong>Boarding / Dock:</strong>{" "}
                {prod.boardingLocationResolution.primaryBoardingWharfOrDock}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                <span className="text-xs font-semibold text-white">
                  {prod.priceDisplayLabel}
                </span>
                <div className="flex gap-3">
                  <Link
                    href={`/operators/${prod.operatorSlug}`}
                    className="rounded border border-white/20 px-3.5 py-2 text-xs text-white"
                  >
                    Operator Profile
                  </Link>
                  <Link
                    href={prod.wnoPublicTourPath || `/operators/${prod.operatorSlug}`}
                    className="rounded bg-[#d4af37] px-4 py-2 text-xs font-bold text-[#080708]"
                  >
                    Compare &amp; Book →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
