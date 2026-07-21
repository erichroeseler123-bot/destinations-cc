import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DIRECTORY_DATA, ListingNode } from "../../tours/pageConfig";
import JsonLd from "@/app/components/dcc/JsonLd";
import { headers } from "next/headers";

// Allowed categories mapping
type CategoryConfig = {
  id: string;
  title: string;
  description: string;
  goodFor: string;
  watchOut: string;
  timingNote: string;
  filterFn: (item: ListingNode) => boolean;
};

const CATEGORIES_MAP: Record<string, CategoryConfig> = {
  "swamp-tours": {
    id: "swamp-tours",
    title: "New Orleans Swamp Tours",
    description: "Narrated pontoon boat cruises through protected bayous. Shaded, stable, and great for all ages.",
    goodFor: "Families, photography, all ages, relaxed sightseeing",
    watchOut: "Pontoon boats move slowly and stay in deeper channels",
    timingNote: "Morning tours are cooler; afternoon tours have more sun-basking alligators",
    filterFn: (item) => item.category === "swamp" && item.name.toLowerCase().includes("covered"),
  },
  "airboat-tours": {
    id: "airboat-tours",
    title: "New Orleans Airboat Tours",
    description: "High-speed open-air airboats that fly over shallow waters and marshes. An adrenaline-filled bayou run.",
    goodFor: "Adrenaline seekers, small groups, up-close wildlife",
    watchOut: "Very loud (headsets provided), windy, open-air with no shade",
    timingNote: "Small-group boats (6-8 passengers) get closer to alligators than larger airboats",
    filterFn: (item) => item.category === "swamp" && item.name.toLowerCase().includes("airboat"),
  },
  "french-quarter-tours": {
    id: "french-quarter-tours",
    title: "French Quarter Walking Tours",
    description: "Walk the historic streets of the Vieux Carré. Discover Spanish architecture, Creole culture, and local jazz history.",
    goodFor: "History buffs, couples, architectural enthusiasts",
    watchOut: "Requires 1.5 to 2 miles of walking on uneven historic sidewalks",
    timingNote: "Book morning walks to avoid the intense midday heat",
    filterFn: (item) => item.category === "history",
  },
  "food-and-cocktail-tours": {
    id: "food-and-cocktail-tours",
    title: "New Orleans Food & Cocktail Tours",
    description: "Sample NOLA classics like gumbo, jambalaya, beignets, and historic cocktails like the Sazerac in historic dining rooms.",
    goodFor: "Foodies, social groups, history lovers",
    watchOut: "Arrive hungry—tastings equivalent to a full heavy lunch",
    timingNote: "Most culinary crawls operate between 11:00 AM and 3:00 PM",
    filterFn: (item) => item.category === "food",
  },
  "ghost-and-cemetery-tours": {
    id: "ghost-and-cemetery-tours",
    title: "New Orleans Ghost & Voodoo Tours",
    description: "Nighttime candlelit walks through haunted gates, historic mansions, and mysterious voodoo history sites.",
    goodFor: "Mystery lovers, families with teens, late-night explorers",
    watchOut: "Walking after dark; standard tours do not enter cemeteries at night due to city laws",
    timingNote: "Tours typically start at 6:00 PM or 8:00 PM and last 2 hours",
    filterFn: (item) => item.category === "ghost",
  },
  "riverboat-cruises": {
    id: "riverboat-cruises",
    title: "Mississippi Riverboat Cruises",
    description: "Step aboard an authentic paddlewheel steamboat. Enjoy Dixieland jazz, city skyline views, and buffet dining on the river.",
    goodFor: "Sightseeing, live jazz lovers, dining on the water",
    watchOut: "The vessel cruises in the river corridor; boarding starts 30-45 minutes before departure",
    timingNote: "Dinner cruises offer gorgeous sunset and illuminated skyline views",
    filterFn: (item) => item.category === "cruise",
  },
};

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return Object.keys(CATEGORIES_MAP).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const config = CATEGORIES_MAP[slug];
  if (!config) {
    return { title: "Category Not Found" };
  }
  const hostHeader = (await headers()).get("x-forwarded-host") || (await headers()).get("host") || "";
  const host = hostHeader.split(":")[0];
  const isWto = host === "welcometoneworleanstours.com" || host === "www.welcometoneworleanstours.com";
  const origin = isWto ? "https://www.welcometoneworleanstours.com" : "https://destinationcommandcenter.com";

  return {
    title: `${config.title} | New Orleans Tours`,
    description: config.description,
    metadataBase: new URL(origin),
    alternates: { canonical: isWto ? `/categories/${slug}` : `/new-orleans/categories/${slug}` },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const config = CATEGORIES_MAP[slug];

  if (!config) {
    notFound();
  }

  const products = DIRECTORY_DATA.filter(config.filterFn);

  if (products.length === 0) {
    notFound();
  }

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": config.title,
          "description": config.description,
          "url": `https://welcometoneworleanstours.com/categories/${slug}`,
        }}
      />
      <main className="min-h-screen bg-slate-50 text-slate-800 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link href="/" className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700 mb-6">
            ← Back to New Orleans Storefront
          </Link>

          {/* Page Header */}
          <header className="mb-10">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              {config.title}
            </h1>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              {config.description}
            </p>
          </header>

          {/* New Orleans Trip-Fit Decision Card */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-10">
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              ⚜️ NOLA Trip-Fit Advice
            </h2>
            <div className="grid gap-6 md:grid-cols-3 text-sm">
              <div className="border-b border-slate-100 md:border-b-0 md:border-r md:pr-4 pb-4 md:pb-0">
                <span className="block font-semibold text-emerald-600 uppercase tracking-wider text-[11px] mb-1">Good For</span>
                <p className="text-slate-700 leading-relaxed">{config.goodFor}</p>
              </div>
              <div className="border-b border-slate-100 md:border-b-0 md:border-r md:px-4 pb-4 md:pb-0">
                <span className="block font-semibold text-amber-600 uppercase tracking-wider text-[11px] mb-1">Watch Out</span>
                <p className="text-slate-700 leading-relaxed">{config.watchOut}</p>
              </div>
              <div className="md:pl-4">
                <span className="block font-semibold text-blue-600 uppercase tracking-wider text-[11px] mb-1">Timing Note</span>
                <p className="text-slate-700 leading-relaxed">{config.timingNote}</p>
              </div>
            </div>
          </section>

          {/* Product Grid */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Real Bookable Tours</h2>
            
            {products.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {products.map((item) => (
                  <article key={item.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between hover:border-emerald-500/50 transition-colors">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          {item.price ? `${item.price}` : "Book Excursion"}
                        </span>
                        {item.rating && (
                          <span className="text-xs font-semibold text-slate-500">
                            ★ {item.rating} ({item.reviewsCount} reviews)
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{item.name}</h3>
                      <p className="text-sm text-slate-500 mb-4">{item.vibe}</p>
                      
                      <div className="border-t border-slate-100 pt-4 space-y-2 text-xs text-slate-600">
                        {item.logistics["Duration"] && (
                          <div className="flex justify-between">
                            <span className="font-medium text-slate-400">Duration:</span>
                            <span>{item.logistics["Duration"]}</span>
                          </div>
                        )}
                        {item.logistics["Boat Type"] && (
                          <div className="flex justify-between">
                            <span className="font-medium text-slate-400">Vessel:</span>
                            <span>{item.logistics["Boat Type"]}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="font-medium text-slate-400">Location:</span>
                          <span>{item.location}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                      <a 
                        href={item.menuUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors"
                      >
                        Book via Trusted Partner →
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center text-amber-900">
                <p className="font-semibold mb-2">No direct products listed in this subcategory.</p>
                <p className="text-sm">Please visit our main tours directory or explore nearby categories for live New Orleans excursions.</p>
                <Link href="/" className="inline-block mt-4 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition-colors">
                  Back to Storefront
                </Link>
              </div>
            )}
          </section>

          {/* Lower SEO Context */}
          <footer className="border-t border-slate-200 pt-8 mt-12 text-xs text-slate-400 leading-relaxed">
            <p>
              New Orleans tour pricing and operational schedules are subject to seasonal weather conditions, river water levels, and local event schedules. We recommend booking in advance particularly during Mardi Gras, French Quarter Festival, and the Jazz & Heritage Festival corridors.
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}
