import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import VegasEntityGridSection from "@/app/components/dcc/VegasEntityGridSection";
import {
  getResolvedAttractionsNearPage,
  getVegasRelationshipFallbackAttractions,
  listAttractionsNearSlugs,
} from "@/src/data/vegas-relationships";

type Params = { slug: string };

export async function generateStaticParams() {
  return listAttractionsNearSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const data = getResolvedAttractionsNearPage(slug);
  if (!data) return {};

  return {
    title: `${data.page.title} | Destination Command Center`,
    description: `What to do near ${data.anchor.name} in Las Vegas, with DCC routing across Strip landmarks, immersive attractions, and nearby planning layers.`,
    alternates: { canonical: `/attractions-near/${slug}` },
    openGraph: {
      title: data.page.title,
      description: `A Vegas relationship page for attractions near ${data.anchor.name}, built for hotel-first itinerary planning.`,
      url: `https://destinationcommandcenter.com/attractions-near/${slug}`,
      type: "website",
    },
  };
}

function JsonLd({ slug }: { slug: string }) {
  const data = getResolvedAttractionsNearPage(slug);
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
              name: data.page.title,
              description: data.page.summary,
              dateModified: "2026-03-12",
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Cities", item: "https://destinationcommandcenter.com/cities" },
                { "@type": "ListItem", position: 2, name: "Las Vegas", item: "https://destinationcommandcenter.com/vegas" },
                { "@type": "ListItem", position: 3, name: "Attractions near", item: pageUrl },
                { "@type": "ListItem", position: 4, name: data.anchor.name, item: pageUrl },
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
  const data = getResolvedAttractionsNearPage(slug);
  if (!data) notFound();

  const attractions = data.results.length ? data.results : getVegasRelationshipFallbackAttractions();

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd slug={slug} />
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Vegas Relationship Page</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">{data.page.title}</h1>
          <p className="max-w-3xl text-zinc-300">{data.page.summary}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Last updated: March 2026</p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {data.page.guidance.map((item) => (
            <article key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-zinc-300">{item.body}</p>
            </article>
          ))}
        </section>

        <VegasEntityGridSection
          title={`What to do near ${data.anchor.name}`}
          intro={`These attraction nodes are the first pass for buyers whose anchor is already set and who now need nearby entertainment, landmarks, or evening routing.`}
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
            { href: data.anchor.href, label: data.anchor.name },
            { href: "/las-vegas/things-to-do", label: "Las Vegas things to do" },
            { href: "/things-to-do-on-the-strip", label: "Things to do on the Strip" },
          ]}
        />

        <section className="grid gap-4 md:grid-cols-2">
          <Link href={data.anchor.href} className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10">
            <h2 className="text-xl font-bold">Open {data.anchor.name}</h2>
            <p className="mt-2 text-zinc-300">Return to the anchor node when the itinerary starts shifting back toward the hotel, casino, or core starting point.</p>
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
