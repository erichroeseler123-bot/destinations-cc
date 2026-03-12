import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getVegasHotelBySlug, VEGAS_HOTELS_CONFIG, type VegasHotelTag } from "@/src/data/vegas-hotels-config";

type Params = { slug: string };

function formatTag(tag: VegasHotelTag) {
  return tag
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function tagLink(tag: VegasHotelTag) {
  switch (tag) {
    case "pet-friendly":
      return { href: "/pet-friendly/las-vegas", label: "Pet-friendly Las Vegas" };
    case "kid-friendly":
      return { href: "/kid-friendly/las-vegas", label: "Kid-friendly Las Vegas" };
    case "strip":
      return { href: "/las-vegas-strip", label: "Las Vegas Strip" };
    case "downtown":
      return { href: "/vegas#fremont", label: "Downtown and Fremont" };
    default:
      return { href: "/las-vegas/hotels", label: "Las Vegas hotels" };
  }
}

export async function generateStaticParams() {
  return VEGAS_HOTELS_CONFIG.map((hotel) => ({ slug: hotel.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const hotel = getVegasHotelBySlug(slug);
  if (!hotel) {
    return {};
  }

  return {
    title: `${hotel.name} Hotel Guide | Destination Command Center`,
    description: `${hotel.name} in Las Vegas: area, trip fit, tags, nearby hooks, and DCC routing into shows, Strip planning, and overlay pages.`,
    alternates: { canonical: `/hotel/${hotel.slug}` },
    openGraph: {
      title: `${hotel.name} Hotel Guide`,
      description: `${hotel.name} in Las Vegas with DCC routing across hotels, overlays, nearby hooks, and city planning.`,
      url: `https://destinationcommandcenter.com/hotel/${hotel.slug}`,
      type: "website",
    },
  };
}

function JsonLd({ slug }: { slug: string }) {
  const hotel = getVegasHotelBySlug(slug);
  if (!hotel) return null;

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["WebPage", "LodgingBusiness"],
        "@id": `https://destinationcommandcenter.com/hotel/${hotel.slug}`,
        url: `https://destinationcommandcenter.com/hotel/${hotel.slug}`,
        name: hotel.name,
        description: hotel.summary,
        dateModified: "2026-03-12",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Cities", item: "https://destinationcommandcenter.com/cities" },
          { "@type": "ListItem", position: 2, name: "Las Vegas", item: "https://destinationcommandcenter.com/vegas" },
          { "@type": "ListItem", position: 3, name: "Hotels", item: "https://destinationcommandcenter.com/las-vegas/hotels" },
          { "@type": "ListItem", position: 4, name: hotel.name, item: `https://destinationcommandcenter.com/hotel/${hotel.slug}` },
        ],
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function VegasHotelNodePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const hotel = getVegasHotelBySlug(slug);
  if (!hotel) notFound();

  const siblingHotels = VEGAS_HOTELS_CONFIG.filter(
    (candidate) => candidate.slug !== hotel.slug && (candidate.area === hotel.area || candidate.tags.some((tag) => hotel.tags.includes(tag)))
  ).slice(0, 6);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd slug={slug} />
      <div className="mx-auto max-w-5xl px-6 py-16 space-y-8">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Hotel Node</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">{hotel.name}</h1>
          <p className="max-w-3xl text-zinc-300">{hotel.summary}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            {hotel.area.replace("-", " ")} · {hotel.tier.replace("-", " ")} · Last updated: March 2026
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">Who it fits</h2>
            <p className="mt-2 text-sm text-zinc-300">
              This node is for buyers entering Vegas through hotel search first and then branching into Strip, shows, restaurants, or overlay intent.
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">What it connects to</h2>
            <p className="mt-2 text-sm text-zinc-300">{hotel.nearbyHooks.join(" · ")}</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">Known for</h2>
            <p className="mt-2 text-sm text-zinc-300">{hotel.famousFor.join(" · ")}</p>
          </article>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Tags and overlays</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {hotel.tags.map((tag) => {
              const target = tagLink(tag);
              return (
                <Link
                  key={tag}
                  href={target.href}
                  className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-zinc-100 hover:bg-white/10"
                >
                  {formatTag(tag)}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Link href="/las-vegas/hotels" className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10">
            <h2 className="text-xl font-bold">Back to Las Vegas hotels</h2>
            <p className="mt-2 text-zinc-300">Return to the hotel mesh hub and compare this property against Strip, downtown, luxury, and family overlays.</p>
          </Link>
          <Link href="/vegas" className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10">
            <h2 className="text-xl font-bold">Back to Vegas hub</h2>
            <p className="mt-2 text-zinc-300">Return to the main city authority page for shows, sports, attractions, and day-trip routing.</p>
          </Link>
          <Link href="/las-vegas-strip" className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10">
            <h2 className="text-xl font-bold">Las Vegas Strip pillar</h2>
            <p className="mt-2 text-zinc-300">Use the Strip authority page when the hotel choice is really a corridor and routing question.</p>
          </Link>
          <Link href="/las-vegas/shows" className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10">
            <h2 className="text-xl font-bold">Las Vegas shows</h2>
            <p className="mt-2 text-zinc-300">Jump into the live-performance lane for residencies, comedy, magic, and other show-night planning.</p>
          </Link>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Related hotel nodes</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {siblingHotels.map((candidate) => (
              <Link key={candidate.slug} href={`/hotel/${candidate.slug}`} className="rounded-xl border border-white/10 bg-black/20 p-4 hover:bg-white/10">
                <h3 className="font-semibold">{candidate.name}</h3>
                <p className="mt-2 text-sm text-zinc-300">{candidate.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
