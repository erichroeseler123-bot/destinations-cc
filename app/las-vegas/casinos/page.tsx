import type { Metadata } from "next";
import Link from "next/link";
import VegasEntityGridSection from "@/app/components/dcc/VegasEntityGridSection";
import { getVegasCasinosByTag, VEGAS_CASINOS_CONFIG } from "@/src/data/vegas-casinos-config";

const PAGE_URL = "https://destinationcommandcenter.com/las-vegas/casinos";

export const metadata: Metadata = {
  title: "Las Vegas Casinos | Strip, Fremont, Sportsbook, and Resort Casino Planning",
  description:
    "Browse Las Vegas casinos through a DCC mesh: Strip anchors, Fremont classics, sportsbook-heavy properties, and casino nodes tied to hotels, shows, and district routing.",
  keywords: [
    "las vegas casinos",
    "best casinos in las vegas",
    "las vegas strip casinos",
    "fremont street casinos",
    "las vegas sportsbook casinos",
  ],
  alternates: { canonical: "/las-vegas/casinos" },
  openGraph: {
    title: "Las Vegas Casinos",
    description:
      "A DCC casino hub for Las Vegas across Strip resorts, Fremont classics, sportsbook buyers, and district-first trip planning.",
    url: PAGE_URL,
    type: "website",
  },
};

function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["WebPage", "CollectionPage"],
        "@id": PAGE_URL,
        url: PAGE_URL,
        name: "Las Vegas casinos",
        description:
          "A Las Vegas casino hub organized around Strip, Fremont, sportsbook, nightlife, and hotel-connected casino discovery.",
        dateModified: "2026-03-12",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Cities", item: "https://destinationcommandcenter.com/cities" },
          { "@type": "ListItem", position: 2, name: "Las Vegas", item: "https://destinationcommandcenter.com/vegas" },
          { "@type": "ListItem", position: 3, name: "Casinos", item: PAGE_URL },
        ],
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default function LasVegasCasinosPage() {
  const stripCasinos = getVegasCasinosByTag("strip");
  const downtownCasinos = getVegasCasinosByTag("downtown");

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd />
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Vegas Entity Hub</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">Las Vegas casinos</h1>
          <p className="max-w-3xl text-zinc-300">
            This is the casino mesh layer for Vegas: Strip anchors, Fremont classics, sportsbook-heavy properties,
            and resort casinos that connect directly to hotel nodes, district hubs, shows, and nightlife planning.
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Last updated: March 2026</p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">Why this hub exists</h2>
            <p className="mt-2 text-sm text-zinc-300">Casino intent is different from hotel intent, even when the property overlaps with the resort stay decision.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">How the mesh works</h2>
            <p className="mt-2 text-sm text-zinc-300">Each casino node connects back into its district, related hotel node, and the show, nightlife, or sportsbook lane it supports.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">Best next search layers</h2>
            <p className="mt-2 text-sm text-zinc-300">This same config can later power luxury-casino, sportsbook, downtown-casino, and near-attraction relationship pages.</p>
          </article>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Casino intent is not the same as hotel intent</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4 text-sm leading-7 text-zinc-300">
              <p>
                Many Las Vegas searches that look like hotel research are really casino-choice questions underneath: table-game vibe, sportsbook strength, Fremont versus Strip energy, smoking rules, and how well the property supports the rest of the night.
              </p>
              <p>
                This page is designed to capture that narrower casino intent and then route travelers into the right supporting page, whether that is a hotel node, a district hub, a nightlife overlay, or a nearby show cluster.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Best supporting guides</div>
              <div className="mt-4 grid gap-3">
                <Link href="/las-vegas/hotels" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">Las Vegas hotels</Link>
                <Link href="/fremont-street" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">Fremont Street</Link>
                <Link href="/smoking/las-vegas" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">Smoking in Las Vegas</Link>
                <Link href="/date-night/las-vegas" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">Date-night Las Vegas</Link>
              </div>
            </div>
          </div>
        </section>

        <VegasEntityGridSection
          title="Core Las Vegas casino mesh"
          intro="These seeded casino nodes are the first graph layer for resort gaming discovery across the Strip, Fremont, and Summerlin."
          entities={VEGAS_CASINOS_CONFIG.map((casino) => ({
            slug: casino.slug,
            name: casino.name,
            summary: casino.summary,
            primaryHref: `/casino/${casino.slug}`,
            chips: casino.tags.map((tag) => tag.replace("-", " ")),
            image: casino.image,
            nearbyLinks: casino.nearbyLinks,
          }))}
          backLinks={[
            { href: "/vegas", label: "Back to Vegas hub" },
            { href: "/las-vegas/hotels", label: "Las Vegas hotels" },
            { href: "/las-vegas-strip", label: "Las Vegas Strip" },
            { href: "/fremont-street", label: "Fremont Street" },
          ]}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <VegasEntityGridSection
          title="Strip casino anchors"
          intro="These are the flagship properties that drive most first-time Vegas casino intent."
          entities={stripCasinos.map((casino) => ({
            slug: casino.slug,
            name: casino.name,
            summary: casino.summary,
            primaryHref: `/casino/${casino.slug}`,
            chips: casino.tags.map((tag) => tag.replace("-", " ")),
            image: casino.image,
            nearbyLinks: casino.nearbyLinks,
          }))}
            backLinks={[
              { href: "/las-vegas-strip", label: "Las Vegas Strip" },
              { href: "/luxury-hotels-las-vegas", label: "Luxury hotels in Las Vegas" },
            ]}
          />
          <VegasEntityGridSection
          title="Downtown and local contrast"
          intro="These casino nodes fit lower-cost, sportsbook, and classic-Vegas routing that behaves differently from the Strip."
          entities={downtownCasinos.map((casino) => ({
            slug: casino.slug,
            name: casino.name,
            summary: casino.summary,
            primaryHref: `/casino/${casino.slug}`,
            chips: casino.tags.map((tag) => tag.replace("-", " ")),
            image: casino.image,
            nearbyLinks: casino.nearbyLinks,
          }))}
            backLinks={[
              { href: "/fremont-street", label: "Fremont Street" },
              { href: "/summerlin", label: "Summerlin" },
            ]}
          />
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Best fit by casino style</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">First-time Vegas</h3>
              <p className="mt-2 text-sm text-zinc-300">Start with flagship Strip properties if you want the cleanest all-in-one casino, hotel, and entertainment package.</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">Classic Vegas energy</h3>
              <p className="mt-2 text-sm text-zinc-300">Downtown and Fremont properties usually win when atmosphere and lower-cost gaming matter more than polished resort scale.</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">Sportsbook buyer</h3>
              <p className="mt-2 text-sm text-zinc-300">Use casino pages to compare where sportsbook culture and game-day flow matter more than room quality alone.</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">Nightlife first</h3>
              <p className="mt-2 text-sm text-zinc-300">Bias toward properties that keep the casino, the bars, and the walkable late-night plan in the same orbit.</p>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
