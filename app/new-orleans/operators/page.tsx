import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { RESEARCHED_OPERATORS } from "../data/operatorDirectory";
import { getNewOrleansDirectorySnapshot } from "@/lib/dcc/shared/newOrleansDirectoryData";

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

  // ItemList contains ONLY qualified indexable canonical operator URLs (unique, zero held records)
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "New Orleans canonical tour operator directory",
    itemListElement: qualifiedOperators.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.operator.name,
      url: `https://www.welcometoneworleanstours.com/operators/${entry.operator.slug}`,
    })),
  };

  return (
    <div data-wno-surface="directory-dark" className="min-h-screen bg-[#080708] px-6 py-14 text-[#fdfbf7]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 overflow-hidden rounded-xl border border-white/15 aspect-[16/9] max-h-[320px]">
          <img
            src="/images/travel-markets/new-orleans/steamboat-natchez.jpg"
            alt="Steamboat Natchez paddlewheeler cruising on the Mississippi River in New Orleans"
            width={1600}
            height={1036}
            className="h-full w-full object-cover"
          />
        </div>

        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#d4af37]">
          Canonical New Orleans Operator Directory
        </p>
        <h1 className="mt-3 font-serif text-4xl md:text-6xl">
          New Orleans tour operators
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-white/80">
          Compare verified swamp boat and airboat captains, Mississippi River paddlewheelers,
          licensed French Quarter historians, culinary guides, and River Road transportation
          companies in one place. Every profile separates operator identity from individual vessels,
          docks, and historic museums—and{" "}
          <Link href="/areas" className="text-[#d4af37] underline">
            connects to exact New Orleans departure areas
          </Link>
          .
        </p>

        <div className="mt-6 flex flex-wrap gap-3 text-xs text-white/80">
          <span className="rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 px-3.5 py-1.5 font-semibold text-[#d4af37]">
            {snapshot.counts.operatorsQualifiedIndexable} Qualified Public Operator Profiles
          </span>
          <span className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5">
            Direct Live API / 10% Checkout: 0 Connected (All Truthfully Marked Unconnected)
          </span>
          <span className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5">
            {snapshot.counts.operatorsHeldNoindex} Unverified Operators Held Out of Sitemaps
          </span>
        </div>

        <h2 className="mt-12 font-serif text-3xl">
          Verified canonical operator profiles
        </h2>
        <p className="mt-3 max-w-3xl text-white/80">
          Inspect each company&apos;s verified headquarters dock or meeting address, pickup policy,
          age/vessel rules, and primary sources before booking. Note that Ragin&apos; Cajun Airboat
          Tours (Luling) and Airboat Adventures (Lafitte) are completely separate companies, and
          River Road museums (Whitney, Oak Alley, Laura) are modeled as{" "}
          <Link href="/areas/river-road" className="text-[#d4af37] underline">
            distinct historic sites
          </Link>{" "}
          rather than bus operators.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {qualifiedOperators.map(({ operator, products }) => {
            const activeCount = products.filter(
              (p) => !p.isCommerciallyHeld && Boolean(p.verifiedAt),
            ).length;
            return (
              <Link
                key={operator.operatorId}
                href={`/operators/${operator.slug}`}
                className="flex flex-col justify-between rounded-xl border border-white/20 bg-[#121016] p-6 transition hover:border-[#d4af37] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d4af37]"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/60">
                    <span>{operator.officialPhone || "Verified Primary Source"}</span>
                    <span className="text-[#d4af37]">
                      {activeCount} verified {activeCount === 1 ? "tour" : "tours"}
                    </span>
                  </div>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    {operator.name}
                  </h3>
                  <p className="mt-2.5 text-xs leading-relaxed text-white/75">
                    {operator.tagline}
                  </p>
                </div>
                <p className="mt-4 text-xs font-semibold text-[#d4af37]">
                  View canonical operator profile &amp; dock rules →
                </p>
              </Link>
            );
          })}
        </div>

        <h2 className="mt-14 font-serif text-3xl">More tours to book</h2>
        <p className="mt-3 max-w-3xl text-white/80">
          Explore these operators and curated tour collections through our partner links. Check
          dates and prices with the booking partner; each tour has its own reservation.
        </p>
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {RESEARCHED_OPERATORS.map((operator) => (
            <Link
              key={operator.slug}
              href={`/operators/${operator.slug}`}
              className="rounded-lg border border-white/20 p-6 hover:border-[#d4af37] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d4af37]"
            >
              <h3 className="text-xl font-semibold">{operator.name}</h3>
              <p className="mt-3 text-white/80">{operator.category}</p>
              <p className="mt-4 text-[#d4af37]">
                View tours &amp; booking options →
              </p>
            </Link>
          ))}
          <Link
            href="/tours/airboat-adventures"
            className="rounded-lg border border-white/20 p-6 hover:border-[#d4af37] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d4af37]"
          >
            <h3 className="text-xl font-semibold">
              Airboat Adventures — Vessel Size Guide
            </h3>
            <p className="mt-3 text-white/80">
              Compare 6–10 passenger small vs. 15–30 passenger large Lafitte airboats
            </p>
            <p className="mt-4 text-[#d4af37]">Explore tours on our site →</p>
          </Link>
          <Link
            href="/tours/nola-ghost-riders"
            className="rounded-lg border border-white/20 p-6 hover:border-[#d4af37] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d4af37]"
          >
            <h3 className="text-xl font-semibold">
              NOLA Ghost Riders — Partner Tour Collection
            </h3>
            <p className="mt-3 text-white/80">
              Evening paranormal &amp; French Quarter specialty tour options
            </p>
            <p className="mt-4 text-[#d4af37]">Explore tours on our site →</p>
          </Link>
        </div>

        <p className="mt-12 max-w-3xl leading-7 text-white/80">
          Planning more than one outing or navigating a Port NOLA cruise day? Check the full tour
          duration, traffic-qualified corridor drive range, and luggage rules before reserving.{" "}
          <Link href="/help-me-choose" className="text-[#d4af37] underline">
            Get help choosing your tours.
          </Link>
        </p>
      </div>
    </div>
  );
}
