import type { Metadata } from "next";
import Link from "next/link";
import AuthorityMediaStrip from "@/app/components/dcc/AuthorityMediaStrip";
import ViatorTourGrid from "@/app/components/dcc/ViatorTourGrid";
import { getCityPoolsConfig } from "@/src/data/city-pools-config";
import { getFeaturedTourProducts } from "@/src/data/featured-tour-products";

const PAGE_URL = "https://destinationcommandcenter.com/las-vegas/pools";
const CONFIG = getCityPoolsConfig("las-vegas");

export const metadata: Metadata = {
  title: "Las Vegas Pools | Luxury Pools, Family Pools, and Dayclub Planning",
  description:
    "Use DCC to plan Las Vegas pools across luxury resort decks, family-friendly pool complexes, dayclub-style pool scenes, and hotel-led pool routing.",
  alternates: { canonical: "/las-vegas/pools" },
  openGraph: {
    title: "Las Vegas Pools",
    description:
      "A DCC Vegas category hub for luxury pools, family pools, resort pool planning, and dayclub-adjacent routing.",
    url: PAGE_URL,
    type: "website",
  },
};

function JsonLd() {
  if (!CONFIG) return null;
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["WebPage", "CollectionPage"],
        "@id": PAGE_URL,
        url: PAGE_URL,
        name: "Las Vegas pools",
        description: CONFIG.heroSummary,
        dateModified: "2026-03-12",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Cities", item: "https://destinationcommandcenter.com/cities" },
          { "@type": "ListItem", position: 2, name: "Las Vegas", item: "https://destinationcommandcenter.com/vegas" },
          { "@type": "ListItem", position: 3, name: "Pools", item: PAGE_URL },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: CONFIG.faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default function LasVegasPoolsPage() {
  if (!CONFIG) return null;
  const featuredProducts = getFeaturedTourProducts("las-vegas", "pools");

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd />
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Vegas Category Hub</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">Las Vegas pools</h1>
          <p className="max-w-3xl text-zinc-300">{CONFIG.heroSummary}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Last updated: March 2026</p>
        </header>

        <AuthorityMediaStrip hero={CONFIG.heroImage} gallery={CONFIG.gallery} />

        <section className="grid gap-3 md:grid-cols-3">
          {CONFIG.highlights.map((item) => (
            <article key={item} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-300">
              {item}
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-3xl font-black tracking-tight">Hotel pool nodes and pool styles</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {CONFIG.poolNodes.map((node) => (
              <article key={node.slug} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{node.type.replace("-", " ")}</p>
                <h3 className="mt-2 text-xl font-bold">{node.title}</h3>
                <p className="mt-3 text-sm text-zinc-300">{node.summary}</p>
                {node.hotelHref ? (
                  <div className="mt-5">
                    <Link href={node.hotelHref} className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
                      Open hotel node
                    </Link>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <ViatorTourGrid
          placeName="Las Vegas"
          title="Featured Vegas pool and dayclub experiences"
          description="This is the first curated pool-activity layer. Keep specific product links as the long-term goal; use these query-driven featured cards as the safe fallback until curated product IDs are verified."
          products={[]}
          fallbacks={featuredProducts.map((product) => ({
            label: product.title,
            query: product.query,
          }))}
          ctaLabel="Browse with DCC via Viator"
        />

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Related Vegas routing</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CONFIG.relatedLinks.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
                {link.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">FAQ</h2>
          <div className="mt-4 space-y-3">
            {CONFIG.faq.map((item) => (
              <article key={item.q} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <h3 className="font-semibold">{item.q}</h3>
                <p className="mt-2 text-sm text-zinc-300">{item.a}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
