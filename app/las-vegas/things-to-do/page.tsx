import type { Metadata } from "next";
import VegasEntityGridSection from "@/app/components/dcc/VegasEntityGridSection";
import { getVegasAttractionsByTag, VEGAS_ATTRACTIONS_CONFIG } from "@/src/data/vegas-attractions-config";

const PAGE_URL = "https://destinationcommandcenter.com/las-vegas/things-to-do";

export const metadata: Metadata = {
  title: "Things To Do in Las Vegas | Attractions, Day Trips, and Strip Experiences",
  description:
    "Browse things to do in Las Vegas across Strip landmarks, Fremont attractions, immersive entertainment, and major day-trip pillars like Grand Canyon and Hoover Dam.",
  alternates: { canonical: "/las-vegas/things-to-do" },
  openGraph: {
    title: "Things To Do in Las Vegas",
    description:
      "A DCC attraction hub for Las Vegas across Strip experiences, immersive attractions, Fremont highlights, and evergreen day-trip pillars.",
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
        name: "Things to do in Las Vegas",
        description:
          "A Las Vegas attraction and activity hub spanning Strip landmarks, downtown discoveries, immersive attractions, and day-trip pillars.",
        dateModified: "2026-03-12",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Cities", item: "https://destinationcommandcenter.com/cities" },
          { "@type": "ListItem", position: 2, name: "Las Vegas", item: "https://destinationcommandcenter.com/vegas" },
          { "@type": "ListItem", position: 3, name: "Things to do", item: PAGE_URL },
        ],
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default function LasVegasThingsToDoPage() {
  const stripAttractions = getVegasAttractionsByTag("strip");
  const dayTrips = getVegasAttractionsByTag("day-trip");

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd />
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">DCC Vegas Super Hub</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">Things to do in Las Vegas</h1>
          <p className="max-w-3xl text-zinc-300">
            This is the broad attraction-and-activity layer for Vegas: Strip icons, Fremont discoveries, immersive
            entertainment, kid-friendly indoor stops, and the day-trip pillars that convert hardest.
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Last updated: March 2026</p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">Super-hub role</h2>
            <p className="mt-2 text-sm text-zinc-300">This page catches broad Vegas attraction intent before routing users into districts, hotels, shows, or day trips.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">Spiderweb logic</h2>
            <p className="mt-2 text-sm text-zinc-300">Every attraction connects to at least one district, one adjacent planning layer, and one pillar or node deeper in the graph.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">Search behavior covered</h2>
            <p className="mt-2 text-sm text-zinc-300">This hub supports things-to-do, best attractions, family attractions, and near-the-Strip queries from one structured layer.</p>
          </article>
        </section>

        <VegasEntityGridSection
          title="Core Vegas attraction mesh"
          intro="These seeded attractions give the Vegas graph immediate density across landmarks, immersive entertainment, family picks, and regional day trips."
          entities={VEGAS_ATTRACTIONS_CONFIG.map((attraction) => ({
            slug: attraction.slug,
            name: attraction.name,
            summary: attraction.summary,
            primaryHref: attraction.primaryHref,
            chips: attraction.tags.map((tag) => tag.replace("-", " ")),
            nearbyLinks: attraction.nearbyLinks,
          }))}
          backLinks={[
            { href: "/vegas", label: "Back to Vegas hub" },
            { href: "/las-vegas-strip", label: "Las Vegas Strip" },
            { href: "/las-vegas/day-trips", label: "Las Vegas day trips" },
            { href: "/helicopter-tours", label: "Helicopter tours" },
          ]}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <VegasEntityGridSection
            title="Things to do on the Strip"
            intro="The Strip cluster is the highest-volume Vegas attraction layer and the cleanest bridge into hotels, shows, and nightlife."
            entities={stripAttractions.map((attraction) => ({
              slug: attraction.slug,
              name: attraction.name,
              summary: attraction.summary,
              primaryHref: attraction.primaryHref,
              chips: attraction.tags.map((tag) => tag.replace("-", " ")),
              nearbyLinks: attraction.nearbyLinks,
            }))}
            backLinks={[
              { href: "/things-to-do-on-the-strip", label: "Things to do on the Strip" },
              { href: "/las-vegas-strip", label: "Las Vegas Strip" },
            ]}
          />
          <VegasEntityGridSection
            title="Day trips and outdoor pillars"
            intro="These are the evergreen high-intent attraction clusters that drive many of the strongest Vegas tour bookings."
            entities={dayTrips.map((attraction) => ({
              slug: attraction.slug,
              name: attraction.name,
              summary: attraction.summary,
              primaryHref: attraction.primaryHref,
              chips: attraction.tags.map((tag) => tag.replace("-", " ")),
              nearbyLinks: attraction.nearbyLinks,
            }))}
            backLinks={[
              { href: "/las-vegas/day-trips", label: "Las Vegas day trips" },
              { href: "/grand-canyon", label: "Grand Canyon" },
              { href: "/hoover-dam", label: "Hoover Dam" },
            ]}
          />
        </div>
      </div>
    </main>
  );
}
