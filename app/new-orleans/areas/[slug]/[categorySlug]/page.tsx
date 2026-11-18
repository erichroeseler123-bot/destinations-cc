import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/app/components/dcc/JsonLd";
import { getNewOrleansDirectorySnapshot } from "@/lib/dcc/shared/newOrleansDirectoryData";
import WnoSourcesAndFreshnessDisclosure from "../../../components/WnoSourcesAndFreshnessDisclosure";
import { buildWnoAreaCategoryJsonLd } from "../../../lib/structuredData";
import { normalizeWtnoTourPath } from "../../../lib/wtnoDirectoryHelpers";

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

  const pageHeading =
    match.comparison?.h1 || `${match.areaName} ${match.category.name}`;

  const schemaData = match.gate.indexable
    ? buildWnoAreaCategoryJsonLd({
        areaSlug: slug,
        areaName: match.areaName,
        categorySlug,
        categoryName: match.category.name,
        title: pageHeading,
        description: match.comparison?.metaDescription || match.category.summary,
        items: matchingProducts.map((prod) => ({
          name: prod.title,
          path: normalizeWtnoTourPath(
            prod.wnoPublicTourPath || `/operators/${prod.operatorSlug}`,
          ),
        })),
      })
    : null;

  return (
    <div
      data-wno-surface="directory-warm"
      className="min-h-screen bg-[#faf6ee] text-[#1e1915]"
    >
      {schemaData ? <JsonLd data={schemaData} /> : null}

      <section className="wno-dir-hero border-b-2 border-[#b8893a] bg-[#163828] px-6 py-12 md:py-16 text-[#faf6ee]">
        <div className="mx-auto max-w-5xl">
          <nav
            aria-label="Breadcrumb"
            className="mb-5 flex flex-wrap items-center gap-2 text-xs text-[#faf6ee]/75"
          >
            <Link href="/" className="hover:text-[#e4c17a] hover:underline">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="/areas" className="hover:text-[#e4c17a] hover:underline">
              Areas &amp; Basins
            </Link>
            <span aria-hidden="true">/</span>
            <Link href={`/areas/${slug}`} className="hover:text-[#e4c17a] hover:underline">
              {match.areaName}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-[#e4c17a]">{match.category.name}</span>
          </nav>

          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e4c17a]">
            {match.areaName} · {match.operatorCount} Verified Operators ·{" "}
            {match.productCount} Active Tours
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold leading-tight text-[#faf6ee] md:text-5xl">
            {pageHeading}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#efe7d8]">
            {match.comparison?.comparisonIntro || match.category.summary}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-12 md:py-14">
        {!match.gate.indexable && (
          <div
            data-testid="held-area-category-banner"
            className="mb-8 rounded-2xl border border-[#b8893a]/50 bg-[#fffdf9] p-5 text-xs text-[#4a4138]"
          >
            <strong className="uppercase tracking-wider text-[#8a6220]">
              Consolidated Area Category:
            </strong>{" "}
            This area-category intersection currently has fewer than 2 distinct verified operators
            or fewer than 3 active products and remains consolidated on the{" "}
            <Link
              href={`/areas/${slug}`}
              className="font-bold text-[#163828] underline"
            >
              {match.areaName} guide
            </Link>
            .
          </div>
        )}

        {match.comparison && (
          <div className="rounded-2xl border border-[#1e1915]/12 bg-[#fffdf9] p-6">
            <h2 className="font-serif text-2xl font-bold text-[#163828]">
              Key differences to check before booking
            </h2>
            <ul className="mt-4 list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-[#4a4138]">
              {match.comparison.keyDifferencesBullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
            <p className="mt-4 rounded-xl border border-[#b8893a]/30 bg-[#faf6ee] px-4 py-3 text-xs text-[#4a4138]">
              <strong className="text-[#1e1915]">Arrival &amp; Timing Guidance:</strong>{" "}
              {match.comparison.arrivalAndTimingGuidance}
            </p>
          </div>
        )}

        <div className="mt-10 space-y-5">
          {matchingProducts.map((prod) => {
            const tourHref = normalizeWtnoTourPath(
              prod.wnoPublicTourPath || `/operators/${prod.operatorSlug}`,
            );
            return (
              <article
                key={prod.productId}
                className="wno-dir-card rounded-2xl border border-[#1e1915]/12 bg-[#fffdf9] p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/operators/${prod.operatorSlug}`}
                    className="text-xs font-bold uppercase tracking-wider text-[#8a6220] underline hover:text-[#6b2737]"
                  >
                    {prod.operatorName}
                  </Link>
                  <span className="text-xs font-medium text-[#6b5a45]">
                    {prod.durationLabel}
                  </span>
                </div>
                <h3 className="mt-2 font-serif text-2xl font-bold text-[#163828]">
                  {prod.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#4a4138]">{prod.summary}</p>
                <p className="mt-3 text-xs text-[#1e1915]">
                  <strong>Boarding / Dock:</strong>{" "}
                  {prod.boardingLocationResolution.primaryBoardingWharfOrDock}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#1e1915]/10 pt-4">
                  <span className="text-xs font-bold text-[#163828]">
                    {prod.priceDisplayLabel}
                  </span>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/operators/${prod.operatorSlug}`}
                      className="wno-dir-secondary-btn rounded-full border border-[#163828] bg-[#faf6ee] px-4 py-2 text-xs font-bold text-[#163828]"
                    >
                      Operator Profile
                    </Link>
                    <Link
                      href={tourHref}
                      className="wno-dir-primary-btn rounded-full bg-[#163828] px-4 py-2 text-xs font-bold text-[#faf6ee]"
                    >
                      Compare &amp; Book →
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <WnoSourcesAndFreshnessDisclosure
          verifiedAt={match.comparison?.verifiedAt || placeEntry?.place.verifiedAt}
          sources={placeEntry?.place.officialLocalSources || []}
        />
      </div>
    </div>
  );
}
