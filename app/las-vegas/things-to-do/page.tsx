import type { Metadata } from "next";
import Link from "next/link";
import VegasEntityGridSection from "@/app/components/dcc/VegasEntityGridSection";
import { getVegasAttractionsByTag, VEGAS_ATTRACTIONS_CONFIG } from "@/src/data/vegas-attractions-config";

const PAGE_URL = "https://destinationcommandcenter.com/las-vegas/things-to-do";

export const metadata: Metadata = {
  title: "Things To Do in Las Vegas | Attractions, Day Trips, and Strip Experiences",
  description:
    "Browse things to do in Las Vegas across Strip landmarks, Fremont attractions, immersive entertainment, and major day trips like the Grand Canyon and Hoover Dam.",
  keywords: [
    "things to do in las vegas",
    "las vegas attractions",
    "best things to do in las vegas",
    "las vegas day trips",
    "las vegas strip attractions",
  ],
  alternates: { canonical: "/las-vegas/things-to-do" },
  openGraph: {
    title: "Things To Do in Las Vegas",
    description:
      "A Las Vegas guide to Strip experiences, immersive attractions, Fremont highlights, and classic day trips.",
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
          "A Las Vegas attraction and activity guide spanning Strip landmarks, downtown discoveries, immersive attractions, and classic day trips.",
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
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Las Vegas Guide</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">Things to do in Las Vegas</h1>
          <p className="max-w-3xl text-zinc-300">
            Start here for a broad look at Las Vegas attractions: Strip icons, Fremont discoveries,
            immersive entertainment, family-friendly indoor stops, and the day trips people book most often.
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Last updated: March 2026</p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">Start here</h2>
            <p className="mt-2 text-sm text-zinc-300">This page is the best starting point when you want a broad view of Las Vegas attractions before narrowing into hotels, shows, or day trips.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">How to use it</h2>
            <p className="mt-2 text-sm text-zinc-300">Use these guides to compare major areas, nearby attractions, and the most popular next steps for your trip.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">What you’ll find</h2>
            <p className="mt-2 text-sm text-zinc-300">This page covers broad Las Vegas attraction searches, family-friendly picks, near-Strip ideas, and classic first-time stops.</p>
          </article>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">How visitors usually search this page</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4 text-sm leading-7 text-zinc-300">
              <p>
                Broad &quot;things to do in Las Vegas&quot; searches usually break into four smaller buckets once a traveler starts comparing options: Strip attractions, downtown and Fremont, indoor or family-friendly stops, and bigger day trips that compete with a full pool or show day.
              </p>
              <p>
                That is why this page works best as a sorting page, not a final answer. A good crawl path from here is into one named attraction, one day-trip pillar, or one hotel or casino cluster that better matches the shape of the trip.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">High-intent next steps</div>
              <div className="mt-4 grid gap-3">
                <Link href="/las-vegas/hotels" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">Las Vegas hotels</Link>
                <Link href="/las-vegas/casinos" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">Las Vegas casinos</Link>
                <Link href="/las-vegas/best-day-trips" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">Best day trips from Las Vegas</Link>
                <Link href="/las-vegas/helicopter-tours" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10">Las Vegas helicopter tours</Link>
              </div>
            </div>
          </div>
        </section>

        <VegasEntityGridSection
          title="Core Las Vegas attractions"
          intro="These attractions cover landmarks, immersive entertainment, family-friendly stops, and the regional day trips most visitors consider."
          entities={VEGAS_ATTRACTIONS_CONFIG.map((attraction) => ({
            slug: attraction.slug,
            name: attraction.name,
            summary: attraction.summary,
            primaryHref: attraction.primaryHref,
            chips: attraction.tags.map((tag) => tag.replace("-", " ")),
            image: attraction.image,
            nearbyLinks: attraction.nearbyLinks,
          }))}
            backLinks={[
            { href: "/vegas", label: "Back to Vegas guide" },
            { href: "/las-vegas-strip", label: "Las Vegas Strip" },
            { href: "/las-vegas/day-trips", label: "Las Vegas day trips" },
            { href: "/helicopter-tours", label: "Helicopter tours" },
          ]}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <VegasEntityGridSection
            title="Things to do on the Strip"
            intro="The Strip is where many first-time visitors start, especially for hotels, shows, attractions, and nightlife."
            entities={stripAttractions.map((attraction) => ({
              slug: attraction.slug,
              name: attraction.name,
              summary: attraction.summary,
              primaryHref: attraction.primaryHref,
              chips: attraction.tags.map((tag) => tag.replace("-", " ")),
              image: attraction.image,
              nearbyLinks: attraction.nearbyLinks,
            }))}
            backLinks={[
              { href: "/things-to-do-on-the-strip", label: "Things to do on the Strip" },
              { href: "/las-vegas-strip", label: "Las Vegas Strip" },
            ]}
          />
          <VegasEntityGridSection
            title="Day trips and outdoor stops"
            intro="These are the classic Las Vegas day trips and outdoor stops that fit well into a longer stay."
            entities={dayTrips.map((attraction) => ({
              slug: attraction.slug,
              name: attraction.name,
              summary: attraction.summary,
              primaryHref: attraction.primaryHref,
              chips: attraction.tags.map((tag) => tag.replace("-", " ")),
              image: attraction.image,
              nearbyLinks: attraction.nearbyLinks,
            }))}
            backLinks={[
              { href: "/las-vegas/day-trips", label: "Las Vegas day trips" },
              { href: "/grand-canyon", label: "Grand Canyon" },
              { href: "/hoover-dam", label: "Hoover Dam" },
            ]}
          />
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Best-fit planning lanes</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">First-time Vegas</h3>
              <p className="mt-2 text-sm text-zinc-300">Start with Strip landmarks, one Fremont block, and one premium anchor like a show, rooftop, or immersive attraction.</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">Family trip</h3>
              <p className="mt-2 text-sm text-zinc-300">Indoor attractions, pool-heavy resorts, and one easy desert half-day usually outperform nightlife-first planning.</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">Short stay</h3>
              <p className="mt-2 text-sm text-zinc-300">Protect your evenings and avoid overcommitting to long canyon routes unless the day trip is the main reason for the trip.</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold">Outdoor-heavy stay</h3>
              <p className="mt-2 text-sm text-zinc-300">Use Red Rock, Valley of Fire, Hoover Dam, and helicopter routes as separate planning lanes instead of generic attraction browsing.</p>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
