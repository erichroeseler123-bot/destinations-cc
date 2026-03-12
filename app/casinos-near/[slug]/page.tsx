import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import VegasEntityGridSection from "@/app/components/dcc/VegasEntityGridSection";
import {
  getCasinosNearHotel,
  getVegasRelationshipFallbackCasinos,
  listCasinosNearSlugs,
} from "@/src/data/vegas-relationships";

type Params = { slug: string };

export async function generateStaticParams() {
  return listCasinosNearSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const data = getCasinosNearHotel(slug);
  if (!data) return {};

  return {
    title: `Casinos Near ${data.target.name} | Destination Command Center`,
    description: `Where to gamble near ${data.target.name} in Las Vegas, with DCC routing across flagship Strip casinos, district fit, and related nightlife layers.`,
    alternates: { canonical: `/casinos-near/${slug}` },
    openGraph: {
      title: `Casinos Near ${data.target.name}`,
      description: `A Vegas relationship page for casinos near ${data.target.name}, built for hotel-first gaming and nightlife planning.`,
      url: `https://destinationcommandcenter.com/casinos-near/${slug}`,
      type: "website",
    },
  };
}

function JsonLd({ slug }: { slug: string }) {
  const data = getCasinosNearHotel(slug);
  if (!data) return null;
  const pageUrl = `https://destinationcommandcenter.com/casinos-near/${slug}`;
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
              name: `Casinos near ${data.target.name}`,
              description: data.config.summary,
              dateModified: "2026-03-12",
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Cities", item: "https://destinationcommandcenter.com/cities" },
                { "@type": "ListItem", position: 2, name: "Las Vegas", item: "https://destinationcommandcenter.com/vegas" },
                { "@type": "ListItem", position: 3, name: "Casinos near", item: pageUrl },
                { "@type": "ListItem", position: 4, name: data.target.name, item: pageUrl },
              ],
            },
          ],
        }),
      }}
    />
  );
}

export default async function CasinosNearPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const data = getCasinosNearHotel(slug);
  if (!data) notFound();

  const casinos = data.casinos.length ? data.casinos : getVegasRelationshipFallbackCasinos();

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd slug={slug} />
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Vegas Relationship Page</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">Casinos near {data.target.name}</h1>
          <p className="max-w-3xl text-zinc-300">{data.config.summary}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Last updated: March 2026</p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {data.config.buyerNotes.map((note) => (
            <article key={note} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-semibold">Why this page helps</h2>
              <p className="mt-2 text-sm text-zinc-300">{note}</p>
            </article>
          ))}
        </section>

        <VegasEntityGridSection
          title={`Casino options near ${data.target.name}`}
          intro={`These casino nodes are the first pass for buyers who already like ${data.target.name} as a hotel base but still want to compare nearby gaming, nightlife, and show-adjacent options.`}
          entities={casinos.map((casino) => ({
            slug: casino.slug,
            name: casino.name,
            summary: casino.summary,
            primaryHref: `/casino/${casino.slug}`,
            chips: casino.tags.map((tag) => tag.replace("-", " ")),
            image: casino.image,
            nearbyLinks: casino.nearbyLinks,
          }))}
          backLinks={[
            { href: `/hotel/${data.target.slug}`, label: `${data.target.name} hotel node` },
            { href: "/las-vegas/casinos", label: "Las Vegas casinos" },
            { href: "/las-vegas-strip", label: "Las Vegas Strip" },
          ]}
        />

        <section className="grid gap-4 md:grid-cols-2">
          <Link href={`/hotel/${data.target.slug}`} className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10">
            <h2 className="text-xl font-bold">Back to {data.target.name}</h2>
            <p className="mt-2 text-zinc-300">Return to the hotel node when the decision shifts back toward rooms, pools, restaurants, and stay quality.</p>
          </Link>
          <Link href="/las-vegas/casinos" className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10">
            <h2 className="text-xl font-bold">Back to Las Vegas casinos</h2>
            <p className="mt-2 text-zinc-300">Use the broader casino mesh when the search is no longer anchored around one flagship hotel.</p>
          </Link>
        </section>
      </div>
    </main>
  );
}
