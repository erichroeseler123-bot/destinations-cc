import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import OverlayEntityGridSection from "@/app/components/dcc/OverlayEntityGridSection";
import VegasHotelGridSection from "@/app/components/dcc/VegasHotelGridSection";
import {
  getRelationshipFallbackEntities,
  getResolvedEntityRelationshipPage,
  getResolvedHotelsNearPage,
  getRelationshipFallbackHotels,
  listRelationshipSlugs,
} from "@/src/data/relationship-registry";

type Params = { slug: string };

export async function generateStaticParams() {
  return listRelationshipSlugs("hotels-near").map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const data = getResolvedEntityRelationshipPage("hotels-near", slug);
  if (!data) return {};

  return {
    title: `${data.page.title} | Destination Command Center`,
    description: `Where to stay near ${data.anchor.title} in ${data.city?.name ?? "this city"}, with DCC routing across walkability, nearby anchors, and related hotel nodes.`,
    alternates: { canonical: `/hotels-near/${slug}` },
    openGraph: {
      title: data.page.title,
      description: `A DCC relationship page for hotels near ${data.anchor.title}, focused on walkability, district fit, and connected trip planning.`,
      url: `https://destinationcommandcenter.com/hotels-near/${slug}`,
      type: "website",
    },
  };
}

function JsonLd({ slug }: { slug: string }) {
  const data = getResolvedEntityRelationshipPage("hotels-near", slug);
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
              name: data.page.title,
              description: data.page.summary,
              dateModified: "2026-03-12",
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Cities", item: "https://destinationcommandcenter.com/cities" },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: data.city?.name ?? "City",
                  item: `https://destinationcommandcenter.com${data.city?.canonicalPath ?? "/"}`,
                },
                { "@type": "ListItem", position: 3, name: "Hotels near", item: pageUrl },
                { "@type": "ListItem", position: 4, name: data.anchor.title, item: pageUrl },
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
  const vegasData = getResolvedHotelsNearPage(slug);
  const data = getResolvedEntityRelationshipPage("hotels-near", slug);
  if (!data) notFound();

  if (vegasData && data.page.citySlug === "las-vegas") {
    const hotels = vegasData.results.length ? vegasData.results : getRelationshipFallbackHotels();

    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <JsonLd slug={slug} />
        <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
          <header className="space-y-4">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Vegas Relationship Page</p>
            <h1 className="text-4xl font-black tracking-tight md:text-6xl">{vegasData.page.title}</h1>
            <p className="max-w-3xl text-zinc-300">{vegasData.page.summary}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Last updated: March 2026</p>
          </header>

          <section className="grid gap-4 md:grid-cols-3">
            {vegasData.page.guidance.map((item) => (
              <article key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-lg font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm text-zinc-300">{item.body}</p>
              </article>
            ))}
          </section>

          <VegasHotelGridSection
            title={`Stay near ${vegasData.anchor.name}`}
            intro={`These hotel nodes are the first pass for buyers who want ${vegasData.anchor.name} close to the center of the stay decision rather than buried inside a broader Strip search.`}
            hotels={hotels}
          />

          <section className="grid gap-4 md:grid-cols-2">
            <Link href={vegasData.anchor.href} className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10">
              <h2 className="text-xl font-bold">Open {vegasData.anchor.name}</h2>
              <p className="mt-2 text-zinc-300">Return to the anchor node when the stay decision shifts back toward entertainment, venue, or gaming-first planning.</p>
            </Link>
            {vegasData.page.relatedLinks[0] ? (
              <Link href={vegasData.page.relatedLinks[0].href} className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10">
                <h2 className="text-xl font-bold">{vegasData.page.relatedLinks[0].label}</h2>
                <p className="mt-2 text-zinc-300">Use a connected Vegas planning layer when the search broadens beyond one anchor and one hotel decision.</p>
              </Link>
            ) : (
              <Link href="/las-vegas/hotels" className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10">
                <h2 className="text-xl font-bold">Back to Las Vegas hotels</h2>
                <p className="mt-2 text-zinc-300">Compare these stays against the broader hotel mesh if the trip is no longer centered on one anchor attraction.</p>
              </Link>
            )}
          </section>
        </div>
      </main>
    );
  }

  const hotels = data.results.length
    ? data.results
    : getRelationshipFallbackEntities(data.page.citySlug, data.page.resultType);
  const city = data.city;
  if (!city) notFound();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(217,119,6,0.14),_transparent_24%),radial-gradient(circle_at_88%_18%,_rgba(34,211,238,0.12),_transparent_18%),linear-gradient(180deg,_#111217_0%,_#090a0d_100%)] text-white">
      <JsonLd slug={slug} />
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Relationship Page</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">{data.page.title}</h1>
          <p className="max-w-3xl text-zinc-300">{data.page.summary}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">{city.name} · Last updated: March 2026</p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {data.page.guidance.map((item) => (
            <article key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-zinc-300">{item.body}</p>
            </article>
          ))}
        </section>

        <OverlayEntityGridSection
          eyebrow={`${city.name} relationship`}
          title={`Stay near ${data.anchor.title}`}
          intro={`These hotel nodes are the first pass for buyers who want ${data.anchor.title} close to the center of the stay decision without dropping back into a broader city hotel list.`}
          entities={hotels}
        />

        <section className="grid gap-4 md:grid-cols-2">
          <Link href={data.anchor.canonicalPath} className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10">
            <h2 className="text-xl font-bold">Open {data.anchor.title}</h2>
            <p className="mt-2 text-zinc-300">Return to the anchor node when the stay decision shifts back toward the beach, attraction, or starting-point district.</p>
          </Link>
          <Link href={data.page.relatedLinks[0]?.href ?? city.canonicalPath} className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10">
            <h2 className="text-xl font-bold">{data.page.relatedLinks[0]?.label ?? `${city.name} hub`}</h2>
            <p className="mt-2 text-zinc-300">Use the connected planning layer when the search broadens beyond one anchor and one hotel decision.</p>
          </Link>
        </section>
      </div>
    </main>
  );
}
