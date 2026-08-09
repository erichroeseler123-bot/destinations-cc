import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DECISION_CATEGORIES,
  getDecisionCategory,
  guidesForCategory,
} from "@/src/data/decision-taxonomy";

const ORIGIN = "https://www.destinationcommandcenter.com";

type Props = {
  params: Promise<{ category: string }>;
};

export function generateStaticParams() {
  return DECISION_CATEGORIES.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getDecisionCategory(slug);
  if (!category) return {};
  const url = `${ORIGIN}/guides/category/${category.slug}`;
  return {
    title: `${category.label} Decision Guides | Destination Command Center`,
    description: category.promise,
    alternates: { canonical: url },
    openGraph: { title: `${category.label} Decision Guides`, description: category.promise, url, type: "website" },
  };
}

export default async function DecisionCategoryPage({ params }: Props) {
  const { category: slug } = await params;
  const category = getDecisionCategory(slug);
  if (!category) notFound();

  const guides = guidesForCategory(category.slug);
  const bridged = category.bridgeCategories
    .map((bridge) => getDecisionCategory(bridge))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const url = `${ORIGIN}/guides/category/${category.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#collection`,
        name: `${category.label} decision guides`,
        description: category.promise,
        url,
        isPartOf: { "@id": `${ORIGIN}/#website` },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: guides.map((guide, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `${ORIGIN}/guides/${guide.slug}`,
            name: guide.title,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Destination Command Center", item: `${ORIGIN}/` },
          { "@type": "ListItem", position: 2, name: "Decision Guides", item: `${ORIGIN}/guides` },
          { "@type": "ListItem", position: 3, name: category.label, item: url },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#090d13] text-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <nav className="text-sm text-slate-400" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white">DCC</Link><span className="mx-2">/</span>
          <Link href="/guides" className="hover:text-white">Guides</Link><span className="mx-2">/</span>
          <span className="text-slate-200">{category.label}</span>
        </nav>

        <header className="mt-10 max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Decision lane</p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-white sm:text-6xl">{category.label}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{category.promise}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {category.scope.map((item) => (
              <span key={item} className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300">{item}</span>
            ))}
          </div>
        </header>

        <section className="mt-14">
          <div className="flex items-end justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Published research</p>
              <h2 className="mt-2 text-2xl font-black text-white">Solve the decision before opening a booking site.</h2>
            </div>
            <span className="text-xs text-slate-500">{guides.length} guides</span>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {guides.map((guide) => (
              <Link key={guide.slug} href={`/guides/${guide.slug}`} className="rounded-3xl border border-slate-800 bg-[#0d131d] p-6 transition hover:-translate-y-1 hover:border-cyan-800">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">{guide.eyebrow}</p>
                <h3 className="mt-3 text-xl font-black leading-7 text-white">{guide.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{guide.description}</p>
                <span className="mt-6 inline-block text-sm font-bold text-cyan-100">Read decision guide →</span>
              </Link>
            ))}
          </div>
        </section>

        {bridged.length > 0 && (
          <section className="mt-16 rounded-3xl border border-slate-800 bg-[#0d131d] p-7">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Connected decision lanes</p>
            <h2 className="mt-3 text-2xl font-black text-white">Traveler problems cross category lines.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">These are intentional graph edges, not generic cross-links. They connect this decision lane to the next research area when the same constraint changes both decisions.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {bridged.map((item) => (
                <Link key={item.slug} href={`/guides/category/${item.slug}`} className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-white hover:border-amber-500">{item.label} →</Link>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
