import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import VegasHotelGridSection from "@/app/components/dcc/VegasHotelGridSection";
import {
  getHotelsNearAttraction,
  getVegasRelationshipFallbackHotels,
  listHotelsNearSlugs,
} from "@/src/data/vegas-relationships";

type Params = { slug: string };

export async function generateStaticParams() {
  return listHotelsNearSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const data = getHotelsNearAttraction(slug);
  if (!data) return {};

  return {
    title: `Hotels Near ${data.target.name} | Destination Command Center`,
    description: `Where to stay near ${data.target.name} in Las Vegas, with DCC routing across walkability, show nights, and related hotel nodes.`,
    alternates: { canonical: `/hotels-near/${slug}` },
    openGraph: {
      title: `Hotels Near ${data.target.name}`,
      description: `A Vegas relationship page for hotels near ${data.target.name}, focused on walkability, district fit, and connected trip planning.`,
      url: `https://destinationcommandcenter.com/hotels-near/${slug}`,
      type: "website",
    },
  };
}

function JsonLd({ slug }: { slug: string }) {
  const data = getHotelsNearAttraction(slug);
  if (!data) return null;

  const pageUrl = `https://destinationcommandcenter.com/hotels-near/${slug}`;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": ["WebPage", "CollectionPage"],
              "@id": pageUrl,
              url: pageUrl,
              name: `Hotels near ${data.target.name}`,
              description: data.config.summary,
              dateModified: "2026-03-12",
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Cities", item: "https://destinationcommandcenter.com/cities" },
                { "@type": "ListItem", position: 2, name: "Las Vegas", item: "https://destinationcommandcenter.com/vegas" },
                { "@type": "ListItem", position: 3, name: "Hotels near", item: pageUrl },
                { "@type": "ListItem", position: 4, name: data.target.name, item: pageUrl },
              ],
            },
          ],
        }),
      }}
    />
  );
}

export default async function HotelsNearPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const data = getHotelsNearAttraction(slug);
  if (!data) notFound();

  const hotels = data.hotels.length ? data.hotels : getVegasRelationshipFallbackHotels();

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd slug={slug} />
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Vegas Relationship Page</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">Hotels near {data.target.name}</h1>
          <p className="max-w-3xl text-zinc-300">{data.config.summary}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Last updated: March 2026</p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {data.config.buyerNotes.map((note) => (
            <article key={note} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-semibold">Why this page exists</h2>
              <p className="mt-2 text-sm text-zinc-300">{note}</p>
            </article>
          ))}
        </section>

        <VegasHotelGridSection
          title={`Stay near ${data.target.name}`}
          intro={`These hotel nodes are the first pass for buyers who want ${data.target.name} close to the center of the stay decision rather than buried inside a broader Strip search.`}
          hotels={hotels}
        />

        <section className="grid gap-4 md:grid-cols-2">
          <Link href={data.target.primaryHref} className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10">
            <h2 className="text-xl font-bold">Open {data.target.name}</h2>
            <p className="mt-2 text-zinc-300">Return to the anchor attraction when the stay decision shifts back toward entertainment, venue, or sightseeing planning.</p>
          </Link>
          <Link href="/las-vegas/hotels" className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10">
            <h2 className="text-xl font-bold">Back to Las Vegas hotels</h2>
            <p className="mt-2 text-zinc-300">Compare these stays against the broader hotel mesh if the trip is no longer centered on one anchor attraction.</p>
          </Link>
        </section>
      </div>
    </main>
  );
}
