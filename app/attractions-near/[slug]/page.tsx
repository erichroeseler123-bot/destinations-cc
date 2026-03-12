import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import VegasEntityGridSection from "@/app/components/dcc/VegasEntityGridSection";
import {
  getAttractionsNearHotel,
  getVegasRelationshipFallbackAttractions,
  listAttractionsNearSlugs,
} from "@/src/data/vegas-relationships";

type Params = { slug: string };

export async function generateStaticParams() {
  return listAttractionsNearSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const data = getAttractionsNearHotel(slug);
  if (!data) return {};

  return {
    title: `Attractions Near ${data.target.name} | Destination Command Center`,
    description: `What to do near ${data.target.name} in Las Vegas, with DCC routing across Strip landmarks, immersive attractions, and nearby planning layers.`,
    alternates: { canonical: `/attractions-near/${slug}` },
    openGraph: {
      title: `Attractions Near ${data.target.name}`,
      description: `A Vegas relationship page for attractions near ${data.target.name}, built for hotel-first itinerary planning.`,
      url: `https://destinationcommandcenter.com/attractions-near/${slug}`,
      type: "website",
    },
  };
}

function JsonLd({ slug }: { slug: string }) {
  const data = getAttractionsNearHotel(slug);
  if (!data) return null;
  const pageUrl = `https://destinationcommandcenter.com/attractions-near/${slug}`;
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
              name: `Attractions near ${data.target.name}`,
              description: data.config.summary,
              dateModified: "2026-03-12",
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Cities", item: "https://destinationcommandcenter.com/cities" },
                { "@type": "ListItem", position: 2, name: "Las Vegas", item: "https://destinationcommandcenter.com/vegas" },
                { "@type": "ListItem", position: 3, name: "Attractions near", item: pageUrl },
                { "@type": "ListItem", position: 4, name: data.target.name, item: pageUrl },
              ],
            },
          ],
        }),
      }}
    />
  );
}

export default async function AttractionsNearPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const data = getAttractionsNearHotel(slug);
  if (!data) notFound();

  const attractions = data.attractions.length ? data.attractions : getVegasRelationshipFallbackAttractions();

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd slug={slug} />
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Vegas Relationship Page</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">Attractions near {data.target.name}</h1>
          <p className="max-w-3xl text-zinc-300">{data.config.summary}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Last updated: March 2026</p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {data.config.buyerNotes.map((note) => (
            <article key={note} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-semibold">How this page helps</h2>
              <p className="mt-2 text-sm text-zinc-300">{note}</p>
            </article>
          ))}
        </section>

        <VegasEntityGridSection
          title={`What to do near ${data.target.name}`}
          intro={`These attraction nodes are the first pass for buyers whose hotel is already set and who now need nearby entertainment, landmarks, or evening routing.`}
          entities={attractions.map((attraction) => ({
            slug: attraction.slug,
            name: attraction.name,
            summary: attraction.summary,
            primaryHref: attraction.primaryHref,
            chips: attraction.tags.map((tag) => tag.replace("-", " ")),
            image: attraction.image,
            nearbyLinks: attraction.nearbyLinks,
          }))}
          backLinks={[
            { href: `/hotel/${data.target.slug}`, label: `${data.target.name} hotel node` },
            { href: "/las-vegas/things-to-do", label: "Las Vegas things to do" },
            { href: "/things-to-do-on-the-strip", label: "Things to do on the Strip" },
          ]}
        />

        <section className="grid gap-4 md:grid-cols-2">
          <Link href={`/hotel/${data.target.slug}`} className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10">
            <h2 className="text-xl font-bold">Back to {data.target.name}</h2>
            <p className="mt-2 text-zinc-300">Return to the hotel node when the itinerary starts shifting back toward room, pool, casino, and stay-quality tradeoffs.</p>
          </Link>
          <Link href="/las-vegas/things-to-do" className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10">
            <h2 className="text-xl font-bold">Back to things to do</h2>
            <p className="mt-2 text-zinc-300">Use the full attraction super hub when the trip is no longer centered on one hotel anchor.</p>
          </Link>
        </section>
      </div>
    </main>
  );
}
