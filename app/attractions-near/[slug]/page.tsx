import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import VegasEntityGridSection from "@/app/components/dcc/VegasEntityGridSection";
import {
  getRelationshipFallbackEntities,
  getResolvedEntityRelationshipPage,
  listRelationshipSlugs,
} from "@/src/data/relationship-registry";

type Params = { slug: string };

export async function generateStaticParams() {
  return listRelationshipSlugs("attractions-near").map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const data = getResolvedEntityRelationshipPage("attractions-near", slug);
  if (!data) return {};

  return {
    title: `${data.page.title} | Destination Command Center`,
    description: `What to do near ${data.anchor.title} in ${data.city?.name ?? "this city"}, with DCC routing across nearby anchors, discovery nodes, and trip-planning layers.`,
    alternates: { canonical: `/attractions-near/${slug}` },
    openGraph: {
      title: data.page.title,
      description: `A DCC relationship page for attractions near ${data.anchor.title}, built for nearby itinerary planning.`,
      url: `https://destinationcommandcenter.com/attractions-near/${slug}`,
      type: "website",
    },
  };
}

function JsonLd({ slug }: { slug: string }) {
  const data = getResolvedEntityRelationshipPage("attractions-near", slug);
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
                {
                  "@type": "ListItem",
                  position: 2,
                  name: data.city?.name ?? "City",
                  item: `https://destinationcommandcenter.com${data.city?.canonicalPath ?? "/"}`,
                },
                { "@type": "ListItem", position: 3, name: "Attractions near", item: pageUrl },
                { "@type": "ListItem", position: 4, name: data.anchor.title, item: pageUrl },
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
  const data = getResolvedEntityRelationshipPage("attractions-near", slug);
  if (!data) notFound();

  const attractions = data.results.length
    ? data.results
    : getRelationshipFallbackEntities(data.page.citySlug, data.page.resultType);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd slug={slug} />
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Relationship Page</p>
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
          title={`What to do near ${data.anchor.title}`}
          intro={`These nearby nodes are the first pass for buyers whose anchor is already set and who now need adjacent attractions, waterfronts, landmarks, or secondary discovery routing.`}
          entities={attractions.map((entity) => ({
            slug: entity.slug,
            name: entity.title,
            summary: entity.summary,
            primaryHref: entity.canonicalPath,
            chips: entity.tags.map((tag) => tag.replace("-", " ")),
            image: entity.imageSet?.card ?? entity.imageSet?.hero ?? undefined,
            nearbyLinks: [],
          }))}
          backLinks={[
            { href: data.anchor.canonicalPath, label: data.anchor.title },
            { href: data.city?.canonicalPath ?? "/", label: data.city?.name ?? "City hub" },
            ...(data.page.relatedLinks.slice(0, 1).map((link) => ({ href: link.href, label: link.label }))),
          ]}
        />

        <section className="grid gap-4 md:grid-cols-2">
          <Link href={data.anchor.canonicalPath} className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10">
            <h2 className="text-xl font-bold">Open {data.anchor.title}</h2>
            <p className="mt-2 text-zinc-300">Return to the anchor node when the itinerary starts shifting back toward the hotel, casino, or core starting point.</p>
          </Link>
          {data.page.relatedLinks[0] ? (
            <Link href={data.page.relatedLinks[0].href} className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10">
              <h2 className="text-xl font-bold">{data.page.relatedLinks[0].label}</h2>
              <p className="mt-2 text-zinc-300">Use the connected planning layer when the trip broadens beyond one anchor and one nearby-decision surface.</p>
            </Link>
          ) : null}
        </section>
      </div>
    </main>
  );
}
