import type { Metadata } from "next";
import VegasHotelGridSection from "@/app/components/dcc/VegasHotelGridSection";
import { VEGAS_HOTELS_CONFIG, getVegasHotelsByTag } from "@/src/data/vegas-hotels-config";

const PAGE_URL = "https://destinationcommandcenter.com/las-vegas/hotels";

const FAQ = [
  {
    q: "What are the best hotels in Las Vegas for first-time visitors?",
    a: "Center-Strip resorts usually give first-time visitors the easiest balance of walkability, shows, attractions, and restaurant density.",
  },
  {
    q: "Which Las Vegas hotels are good for families?",
    a: "Family-friendly picks usually cluster around South Strip and attraction-led resorts where pools, themed features, and easier daytime entertainment matter more than nightlife.",
  },
  {
    q: "Are there pet-friendly hotels in Las Vegas?",
    a: "Yes. Pet-friendly options exist across both luxury and midscale Las Vegas hotels, so it is worth filtering for them early if that matters to your trip.",
  },
];

export const metadata: Metadata = {
  title: "Las Vegas Hotels | Strip, Downtown, Luxury, Family, and Pet-Friendly",
  description:
    "Browse Las Vegas hotels by area and trip style: Strip vs downtown, luxury vs value, family-friendly, pet-friendly, and show-friendly stays.",
  alternates: { canonical: "/las-vegas/hotels" },
  openGraph: {
    title: "Las Vegas Hotels",
    description:
      "A Las Vegas hotel guide covering the Strip, downtown, luxury stays, family-friendly picks, pet-friendly stays, and show-friendly planning.",
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
        name: "Las Vegas hotels",
        description:
          "A Las Vegas hotel guide organized by Strip vs downtown, luxury, family, pet-friendly, and show-friendly stays.",
        dateModified: "2026-03-12",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Cities", item: "https://destinationcommandcenter.com/cities" },
          { "@type": "ListItem", position: 2, name: "Las Vegas", item: "https://destinationcommandcenter.com/vegas" },
          { "@type": "ListItem", position: 3, name: "Hotels", item: PAGE_URL },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default function LasVegasHotelsPage() {
  const luxuryHotels = getVegasHotelsByTag("luxury");
  const downtownHotels = getVegasHotelsByTag("downtown");

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd />
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-8">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Las Vegas Hotels</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">Las Vegas hotels</h1>
          <p className="max-w-3xl text-zinc-300">
            Compare Las Vegas hotels by area and trip style: flagship Strip resorts, downtown alternatives,
            luxury stays, family-friendly options, and pet-friendly picks.
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Last updated: March 2026</p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">Start here</h2>
            <p className="mt-2 text-sm text-zinc-300">Use this page when you want to compare hotel areas and stay styles before choosing one property.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">Helpful filters</h2>
            <p className="mt-2 text-sm text-zinc-300">Pet-friendly, family-friendly, luxury, and downtown picks are all easier to compare from one page.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">Why it helps</h2>
            <p className="mt-2 text-sm text-zinc-300">It is easier to narrow your stay once you know whether you want the Strip, downtown, a luxury resort, or a quieter fit.</p>
          </article>
        </section>

        <VegasHotelGridSection
          title="Core Las Vegas hotels"
          intro="These properties cover major Strip resorts, downtown alternatives, and some of the strongest luxury, family, and value options."
          hotels={VEGAS_HOTELS_CONFIG}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <VegasHotelGridSection
            title="Luxury and romantic cluster"
            intro="Useful for upscale stays, romantic trips, and hotels that fit well with a nicer night out."
            hotels={luxuryHotels}
          />
          <VegasHotelGridSection
            title="Downtown and Fremont cluster"
            intro="Downtown hotels are a different fit from Strip resorts and often work better for Fremont-heavy trips."
            hotels={downtownHotels}
          />
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">FAQ</h2>
          <div className="mt-4 space-y-3">
            {FAQ.map((item) => (
              <article key={item.q} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <h3 className="font-semibold">{item.q}</h3>
                <p className="mt-2 text-sm text-zinc-300">{item.a}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
