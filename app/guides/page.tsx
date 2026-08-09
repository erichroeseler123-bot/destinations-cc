import type { Metadata } from "next";
import Link from "next/link";
import { PRE_SITE_GUIDES } from "@/src/data/pre-site-guides";
import { DECISION_CATEGORIES, guidesForCategory } from "@/src/data/decision-taxonomy";

const ORIGIN = "https://www.destinationcommandcenter.com";

export const metadata: Metadata = {
  title: "Travel Decision Guides | Destination Command Center",
  description:
    "Practical pre-purchase travel guides organized into connected research lanes for cruise ports, tours, transportation, Alaska, New Orleans, Colorado, Red Rocks, and more.",
  alternates: { canonical: `${ORIGIN}/guides` },
};

export default function GuidesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${ORIGIN}/guides#collection`,
        name: "Destination Command Center travel decision guides",
        description: "The research layer before a traveler reaches a specialist or transaction site.",
        url: `${ORIGIN}/guides`,
        isPartOf: { "@id": `${ORIGIN}/#website` },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: DECISION_CATEGORIES.map((category, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: category.label,
            url: `${ORIGIN}/guides/category/${category.slug}`,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Destination Command Center", item: `${ORIGIN}/` },
          { "@type": "ListItem", position: 2, name: "Decision Guides", item: `${ORIGIN}/guides` },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#090d13] text-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Destination Command Center</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.04em] text-white sm:text-6xl">
          The pages you need before you are ready to buy.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
          DCC handles the research, comparisons, timing, constraints, and practical questions. The graph stays inside DCC until the traveler has enough context for a specialist site to be the useful next step.
        </p>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {DECISION_CATEGORIES.map((category) => {
            const guides = guidesForCategory(category.slug);
            return (
              <Link
                key={category.slug}
                href={`/guides/category/${category.slug}`}
                className="group rounded-3xl border border-slate-800 bg-[#0d131d] p-6 transition hover:-translate-y-1 hover:border-cyan-800"
              >
                <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">Research lane</p>
                <h2 className="mt-3 text-2xl font-black text-white group-hover:text-cyan-100">{category.label}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">{category.promise}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {category.scope.slice(0, 3).map((item) => (
                    <span key={item} className="rounded-full border border-slate-700 px-2.5 py-1 text-[11px] text-slate-400">{item}</span>
                  ))}
                </div>
                <span className="mt-6 inline-block text-sm font-bold text-slate-200">{guides.length} published decisions →</span>
              </Link>
            );
          })}
        </div>

        <section className="mt-16 rounded-3xl border border-amber-900/50 bg-[#15120c] p-7 sm:p-9">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">How the graph works</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white">Topic hub → decision → related decision → specialist.</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
            Category pages create a clear crawl hierarchy. Individual decisions link laterally only when another question can materially change the same trip. Commercial handoffs stay at the end of the research path.
          </p>
          <p className="mt-4 text-sm text-slate-500">Current published decision nodes: {PRE_SITE_GUIDES.length}</p>
        </section>
      </section>
    </main>
  );
}
