import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/app/components/dcc/JsonLd";
import { getNewOrleansDirectorySnapshot } from "@/lib/dcc/shared/newOrleansDirectoryData";
import WnoOperatorsDirectoryClient, {
  type WnoFilterOption,
  type WnoOperatorDirectoryCardItem,
} from "../components/WnoOperatorsDirectoryClient";
import { buildWnoOperatorsCollectionJsonLd } from "../lib/structuredData";
import {
  resolveHumanCategoryName,
  resolveHumanPlaceName,
} from "../lib/wtnoDirectoryHelpers";

export const metadata: Metadata = {
  title: "New Orleans Tour Operators | Swamp, Riverboat, Ghost, Food & City Tours",
  description:
    "Compare verified New Orleans tour operators—including New Orleans Steamboat Company, Ragin' Cajun Airboat Tours, Airboat Adventures, Cajun Encounters, Cajun Pride, Haunted History, French Quarter Phantoms, Doctor Gumbo, and Southern Style Tours.",
  alternates: { canonical: "/operators" },
  robots: { index: true, follow: true },
};

export default function OperatorsPage() {
  const snapshot = getNewOrleansDirectorySnapshot();
  const qualifiedOperators = snapshot.operators.filter(
    (entry) => entry.gate.indexable,
  );
  const indexablePlaceSlugSet = new Set(
    snapshot.places
      .filter((entry) => entry.gate.indexable && Boolean(entry.place.publicPlaceSlug))
      .map((entry) => entry.place.publicPlaceSlug!),
  );

  // IMPORTANT: Keep ItemList as the FIRST JSON-LD script on /operators
  // (contract verified by tests/new-orleans/operator-directory.test.tsx).
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "New Orleans tour operator directory",
    itemListElement: qualifiedOperators.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.operator.name,
      url: `https://www.welcometoneworleanstours.com/operators/${entry.operator.slug}`,
    })),
  };

  const collectionGraphSchema = buildWnoOperatorsCollectionJsonLd({
    operatorCount: qualifiedOperators.length,
  });

  const areaOptionMap = new Map<string, string>();
  const categoryOptionMap = new Map<string, string>();

  const operatorCards: WnoOperatorDirectoryCardItem[] = qualifiedOperators.map(
    ({ operator, products }) => {
      const activeTourCount = products.filter(
        (p) => !p.isCommerciallyHeld && Boolean(p.verifiedAt),
      ).length;

      const validAreaSlugs = operator.publicPlaceSlugs.filter((slug) =>
        indexablePlaceSlugSet.has(slug),
      );
      const areaLabels = validAreaSlugs.map((slug) => {
        const label = resolveHumanPlaceName(slug, true);
        areaOptionMap.set(slug, label);
        return label;
      });

      const categoryLabels = operator.categorySlugs.map((catSlug) => {
        const label = resolveHumanCategoryName(catSlug);
        categoryOptionMap.set(catSlug, label);
        return label;
      });

      return {
        operatorId: operator.operatorId,
        slug: operator.slug,
        name: operator.name,
        tagline: operator.tagline,
        officialPhone: operator.officialPhone,
        heroImage: operator.heroImage,
        heroImageAlt: operator.heroImageAlt,
        heroImageCredit: operator.heroImageCredit,
        activeTourCount,
        areaSlugs: validAreaSlugs,
        areaLabels,
        categorySlugs: operator.categorySlugs,
        categoryLabels,
        badgeLabel: operator.verifiedOwnershipBadges[0]?.label || null,
      };
    },
  );

  const areaOptions: WnoFilterOption[] = Array.from(areaOptionMap.entries())
    .map(([slug, label]) => ({ slug, label }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const categoryOptions: WnoFilterOption[] = Array.from(categoryOptionMap.entries())
    .map(([slug, label]) => ({ slug, label }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div
      data-wno-surface="directory-warm"
      className="min-h-screen bg-[#faf6ee] text-[#1e1915]"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListSchema).replace(/</g, "\\u003c"),
        }}
      />
      <JsonLd data={collectionGraphSchema} />

      {/* Warm Deep Cypress Hero Header */}
      <section className="wno-dir-hero border-b-2 border-[#b8893a] bg-[#163828] px-6 py-14 text-[#faf6ee] md:py-18">
        <div className="mx-auto max-w-6xl">
          <nav
            aria-label="Breadcrumb"
            className="mb-5 flex flex-wrap items-center gap-2 text-xs text-[#faf6ee]/75"
          >
            <Link href="/" className="underline-offset-4 hover:text-[#e4c17a] hover:underline">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-[#e4c17a]">Tour Operators</span>
          </nav>

          <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e4c17a]">
                Local Captains, Historians &amp; Riverboats
              </p>
              <h1 className="mt-3 font-serif text-4xl font-bold leading-tight text-[#faf6ee] md:text-6xl">
                New Orleans tour operators
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-[#efe7d8]">
                Compare swamp boat and airboat captains, Mississippi River paddlewheelers,
                licensed French Quarter historians, culinary guides, and River Road excursion
                companies in one place. Every profile separates company identity from individual
                vessels, docks, and historic museums—and{" "}
                <Link
                  href="/areas"
                  className="font-semibold text-[#e4c17a] underline underline-offset-4 hover:text-[#faf6ee]"
                >
                  connects to exact New Orleans departure areas
                </Link>
                .
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5 text-xs">
                <span className="wno-pill-brass">
                  {`${qualifiedOperators.length} Verified Local Operators`}
                </span>
                <span className="wno-pill-burgundy">
                  Docks, Wharves &amp; Pickup Rules
                </span>
                <Link
                  href="/areas"
                  className="inline-flex items-center rounded-full border border-[#e4c17a]/50 bg-[#faf6ee]/10 px-3.5 py-1.5 font-semibold text-[#faf6ee] hover:bg-[#b8893a]/25"
                >
                  {`Explore ${snapshot.counts.placesQualifiedIndexable} Departure Areas & Basins →`}
                </Link>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#e4c17a]/35 bg-[#112a1e] shadow-lg">
              <div className="aspect-[16/10] w-full overflow-hidden">
                <img
                  src="/images/travel-markets/new-orleans/steamboat-natchez.jpg"
                  alt="Steamboat Natchez paddlewheeler cruising on the Mississippi River in New Orleans"
                  width={1600}
                  height={1036}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="px-4 py-2.5 text-[11px] text-[#efe7d8]/85">
                Toulouse Street &amp; French Quarter riverfront wharves · Photo: Wikimedia Commons (CC BY 2.0)
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="mb-7 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a6220]">
            Company Profiles &amp; Dock Logistics
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-[#163828]">
            Browse verified New Orleans companies
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-[#4a4138]">
            Inspect each company&apos;s headquarters dock or meeting address, hotel pickup window,
            vessel and age rules, and booking options before reserving. Note that Ragin&apos; Cajun
            Airboat Tours (Luling) and Airboat Adventures (Lafitte) are separate companies, and
            River Road museums (Whitney, Oak Alley, Laura) are{" "}
            <Link
              href="/areas/river-road"
              className="font-semibold text-[#6b2737] underline underline-offset-4 hover:text-[#163828]"
            >
              distinct historic sites
            </Link>{" "}
            rather than bus operators.
          </p>
        </div>

        <WnoOperatorsDirectoryClient
          operators={operatorCards}
          areaOptions={areaOptions}
          categoryOptions={categoryOptions}
        />

        {/* Compact Curated Partner Tour Collections (deduplicated — no repeated operator cards) */}
        <section
          aria-labelledby="curated-partner-collections-heading"
          className="mt-16 border-t border-[#1e1915]/12 pt-12"
        >
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a6220]">
            Curated Partner Tour Collections
          </p>
          <h2
            id="curated-partner-collections-heading"
            className="mt-2 font-serif text-3xl font-bold text-[#163828]"
          >
            Specialty boat-size &amp; evening tour guides
          </h2>
          <p className="mt-2.5 max-w-3xl text-sm leading-relaxed text-[#4a4138]">
            Explore these curated specialty tour collections on our site. Check dates and prices
            with the booking partner; each tour has its own reservation.
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <Link
              href="/tours/airboat-adventures"
              className="wno-dir-card flex flex-col justify-between rounded-2xl border border-[#1e1915]/12 bg-[#fffdf9] p-6 transition hover:border-[#8a6220]"
            >
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a6220]">
                  Lafitte Bayou · Vessel Comparison
                </p>
                <h3 className="mt-2 font-serif text-2xl font-bold text-[#163828]">
                  Airboat Adventures — Vessel Size Guide
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#4a4138]">
                  Compare 6–10 passenger small airboats against 15–30 passenger stadium airboats
                  departing Lafitte in the Barataria Basin, with pickup and self-drive options.
                </p>
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-[#6b2737]">
                Explore Airboat Adventures collection →
              </p>
            </Link>

            <Link
              href="/tours/nola-ghost-riders"
              className="wno-dir-card flex flex-col justify-between rounded-2xl border border-[#1e1915]/12 bg-[#fffdf9] p-6 transition hover:border-[#8a6220]"
            >
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a6220]">
                  Evening Paranormal &amp; Cemetery Walks
                </p>
                <h3 className="mt-2 font-serif text-2xl font-bold text-[#163828]">
                  NOLA Ghost Riders — Partner Tour Collection
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#4a4138]">
                  Compare evening French Quarter paranormal walks, nocturnal cemetery bus outings,
                  and specialty storytelling experiences.
                </p>
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-[#6b2737]">
                Explore NOLA Ghost Riders collection →
              </p>
            </Link>
          </div>
        </section>

        <div className="mt-12 rounded-2xl border border-[#1e1915]/12 bg-[#f5efe2] p-6 text-sm leading-relaxed text-[#4a4138]">
          Planning more than one outing or navigating a Port NOLA cruise turnaround day? Check the
          full tour duration, traffic-qualified corridor drive range, and luggage rules before
          reserving.{" "}
          <Link
            href="/help-me-choose"
            className="font-bold text-[#163828] underline underline-offset-4 hover:text-[#6b2737]"
          >
            Get help choosing your tours →
          </Link>
        </div>
      </div>
    </div>
  );
}
