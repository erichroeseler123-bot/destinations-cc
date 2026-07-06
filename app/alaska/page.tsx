import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import BookableToursSection from "@/app/components/dcc/BookableToursSection";
import NextStepEngine from "@/app/components/dcc/NextStepEngine";
import { getPortRecommendationActions } from "@/lib/dcc/handoffAnalytics";
import { getViatorActionForPlace } from "@/lib/dcc/internal/viatorAction";
import LfsTrustStrip from "@/components/LfsTrustStrip";
import DccNetworkStrip from "@/components/DccNetworkStrip";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const hostHeader = (await headers()).get("x-forwarded-host") || (await headers()).get("host") || "";
  const host = hostHeader.split(":")[0];
  const isLfse = host === "lastfrontiershoreexcursions.com" || host === "www.lastfrontiershoreexcursions.com";
  const origin = isLfse ? "https://www.lastfrontiershoreexcursions.com" : "https://destinationcommandcenter.com";

  return {
    title: isLfse 
      ? "Last Frontier Shore Excursions | Alaska Cruise Port Tours"
      : "Alaska Cruise & Shore Excursion Guide 2026 | Ports, Tours, and Logistics",
    description: isLfse
      ? "Compare real cruise-port tours in Juneau, Skagway, and Ketchikan with clear booking links and port-day guidance."
      : "Plan Alaska cruise routes with clear port intelligence, shore excursion priorities, transfer planning, and weather-aware logistics.",
    keywords: [
      "alaska cruise ports",
      "alaska shore excursions",
      "juneau excursions",
      "ketchikan tours",
      "skagway shore excursion",
    ],
    metadataBase: new URL(origin),
    alternates: { canonical: isLfse ? "/" : "/alaska" },
    applicationName: isLfse ? "Last Frontier Shore Excursions" : "Destination Command Center",
    openGraph: {
      siteName: isLfse ? "Last Frontier Shore Excursions" : "Destination Command Center",
      type: "website",
      locale: "en_US",
      url: isLfse ? "/" : "/alaska",
      title: isLfse ? "Last Frontier Shore Excursions | Alaska Cruise Port Tours" : "Alaska Cruise & Shore Excursion Guide 2026 | Ports, Tours, and Logistics",
      description: isLfse
        ? "Compare real cruise-port tours in Juneau, Skagway, and Ketchikan with clear booking links and port-day guidance."
        : "Plan Alaska cruise routes with clear port intelligence, shore excursion priorities, transfer planning, and weather-aware logistics.",
    },
    twitter: {
      card: "summary_large_image",
      title: isLfse ? "Last Frontier Shore Excursions | Alaska Cruise Port Tours" : "Alaska Cruise & Shore Excursion Guide 2026 | Ports, Tours, and Logistics",
      description: isLfse
        ? "Compare real cruise-port tours in Juneau, Skagway, and Ketchikan with clear booking links and port-day guidance."
        : "Plan Alaska cruise routes with clear port intelligence, shore excursion priorities, transfer planning, and weather-aware logistics.",
    },
  };
}

export default async function AlaskaPage() {
  const hostHeader = (await headers()).get("x-forwarded-host") || (await headers()).get("host") || "";
  const host = hostHeader.split(":")[0];
  const isLfse = host === "lastfrontiershoreexcursions.com" || host === "www.lastfrontiershoreexcursions.com";

  if (isLfse) {
    // Fetch real Viator tours for Juneau, Skagway, and Ketchikan
    const [juneauRes, skagwayRes, ketchikanRes] = await Promise.all([
      getViatorActionForPlace({ slug: "juneau", name: "Juneau", citySlug: "juneau", currency: "USD" }),
      getViatorActionForPlace({ slug: "skagway", name: "Skagway", citySlug: "skagway", currency: "USD" }),
      getViatorActionForPlace({ slug: "ketchikan", name: "Ketchikan", citySlug: "ketchikan", currency: "USD" }),
    ]);

    const portsData = [
      {
        slug: "juneau",
        name: "Juneau",
        tags: "Whales • Glaciers • Helicopter tours",
        hook: "Whales, Mendenhall Glacier, helicopter tours, and flightseeing close to the cruise docks.",
        description: "Mendenhall Glacier flights, helicopter dog sledding, and whale watching.",
        imageUrl: "/images/travel-markets/juneau/alaska-whale-watching.jpg",
        tours: (juneauRes?.products || []).slice(0, 3),
        curatedSearches: [
          { label: "Whale Watching Tours", desc: "Compare whale watching excursions in Auke Bay.", q: "Juneau whale watching" },
          { label: "Mendenhall Glacier Combos", desc: "Excursions combining the glacier with whale watching or city sights.", q: "Mendenhall Glacier" },
          { label: "Helicopter Glacier Landings", desc: "Fly to Juneau's icefields and walk on real glaciers.", q: "Juneau helicopter" },
          { label: "Wildlife & Flightseeing", desc: "Floatplane and boat tours focusing on bears, eagles, and fjords.", q: "Juneau wildlife" },
        ],
      },
      {
        slug: "skagway",
        name: "Skagway",
        tags: "Railway scenery • Gold rush history • Mountain routes",
        hook: "White Pass railway, Yukon scenery, gold-rush history, and mountain routes.",
        description: "White Pass & Yukon Route train rides, historic tours, and wilderness trips.",
        imageUrl: "/images/travel-markets/last-frontier/skagway-white-pass-railroad.jpg",
        tours: (skagwayRes?.products || []).slice(0, 3),
        curatedSearches: [
          { label: "White Pass Railway Tours", desc: "Ride the historic narrow-gauge railroad up to the Yukon.", q: "Skagway White Pass Railway" },
          { label: "Yukon Scenery Tours", desc: "Excursions climbing through the mountains into the Yukon territory.", q: "Skagway Yukon" },
          { label: "Gold Rush History Tours", desc: "Explore Skagway's historic streets and gold-panning sites.", q: "Skagway Gold Rush" },
          { label: "Scenic Mountain Routes", desc: "Guided van and hiking tours along scenic mountain passes.", q: "Skagway mountain" },
        ],
      },
      {
        slug: "ketchikan",
        name: "Ketchikan",
        tags: "Rainforest hikes • Fjords floatplanes • Totem parks",
        hook: "Rainforest, wildlife, totems, Misty Fjords, and floatplane-style adventure.",
        description: "Rainforest hikes, floatplane fjord flights, and wildlife totems.",
        imageUrl: "/images/travel-markets/last-frontier/ketchikan-misty-fjords.jpg",
        tours: (ketchikanRes?.products || []).slice(0, 3),
        curatedSearches: [
          { label: "Misty Fjords Flightseeing", desc: "Fly by floatplane over dramatic waterfalls and deep fjords.", q: "Misty Fjords" },
          { label: "Wildlife & Rainforest Tours", desc: "Spot eagles and salmon in Ketchikan's coastal rainforest.", q: "Ketchikan wildlife" },
          { label: "Totem Heritage Tours", desc: "Visit historical parks containing authentic native totem poles.", q: "Ketchikan totem" },
          { label: "Floatplane-Style Adventure", desc: "Excursions that fly or boat out to remote wilderness sights.", q: "Ketchikan floatplane" },
        ],
      },
    ];

    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
        {/* Navigation Bar */}
        <nav className="sticky top-0 z-50 bg-white/95 border-b border-slate-200/80 backdrop-blur-md px-6 py-4 shadow-sm">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link href="/" className="text-xl font-black tracking-tight text-slate-900 hover:text-sky-600 transition">
              Last Frontier <span className="text-sky-600 font-medium">Shore Excursions</span>
            </Link>
            <div className="flex items-center gap-6 text-sm font-semibold text-slate-600">
              <Link href="/ports" className="hover:text-sky-600 transition">Ports</Link>
              <Link href="/tours" className="hover:text-sky-600 transition">Tours</Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <header className="bg-slate-900 text-white py-16 md:py-24 px-6 relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.15),transparent_50%)]">
          <div className="max-w-5xl mx-auto grid md:grid-cols-12 gap-8 items-center relative z-10">
            <div className="md:col-span-7 space-y-6">
              <span className="inline-flex rounded-full bg-sky-500/10 border border-sky-400/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-sky-400">
                Cruise Port Excursion Storefront
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
                Alaska shore excursions built for your cruise day.
              </h1>
              <p className="text-base md:text-lg text-slate-300 font-medium leading-relaxed">
                Compare whale watching, glacier, railway, wildlife, and flightseeing options in Juneau, Skagway, and Ketchikan — with clear provider booking links and port-day timing guidance.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link href="/tours" className="bg-sky-600 text-white font-bold px-6 py-3 rounded-2xl hover:bg-sky-500 transition shadow-lg text-sm">
                  Browse Alaska Excursions
                </Link>
                <a href="#ports" className="bg-white/10 text-white border border-white/20 font-bold px-6 py-3 rounded-2xl hover:bg-white/20 transition text-sm">
                  View Cruise Port Guides
                </a>
              </div>
            </div>
            <div className="md:col-span-5 relative group">
              <div className="absolute inset-0 bg-sky-500/10 rounded-3xl blur-2xl group-hover:bg-sky-500/20 transition" />
              <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-2xl border border-white/10">
                <img 
                  src="/images/travel-markets/juneau/alaska-whale-watching.jpg" 
                  alt="Alaska Whale Watching" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Auke Bay, Juneau</p>
                  <p className="text-[10px] text-slate-300 font-medium">Verified storefront exit path active</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Popular Searches */}
        <section className="max-w-5xl mx-auto px-6 pt-10 space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
            Popular Alaska shore-excursion searches
          </h3>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Juneau whale watching", q: "Juneau whale watching" },
              { label: "Mendenhall Glacier tours", q: "Mendenhall Glacier" },
              { label: "Skagway railway tours", q: "Skagway railway" },
              { label: "Ketchikan wildlife tours", q: "Ketchikan wildlife" },
              { label: "Misty Fjords flightseeing", q: "Misty Fjords" },
            ].map((search) => (
              <Link
                key={search.label}
                href={`/tours?q=${encodeURIComponent(search.q)}`}
                className="bg-white border border-slate-200 hover:border-sky-500 hover:text-sky-600 px-4 py-2 text-xs font-bold rounded-2xl transition shadow-sm text-slate-700"
              >
                🔍 {search.label}
              </Link>
            ))}
          </div>
        </section>

        {/* Trust Strip */}
        <div className="max-w-5xl mx-auto px-6 pt-10">
          <LfsTrustStrip />
        </div>

        {/* Port list & Excursions */}
        <section id="ports" className="max-w-5xl mx-auto px-6 pt-16 space-y-16">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-3xl font-black tracking-tight text-slate-900">Choose Your Cruise Port</h2>
            <p className="text-slate-500 max-w-xl">Start with your port, then compare excursions that fit the way your ship day usually works.</p>
          </div>

          <div className="grid gap-8">
            {portsData.map((port) => {
              const hasRealProducts = port.tours.length > 0 && !port.tours.some(t => t.product_code === "1" || t.product_code === "2");
              return (
                <div key={port.slug} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col md:flex-row">
                  {/* Left/Top Image Column */}
                  <div className="md:w-1/3 min-h-[240px] relative shrink-0">
                    <img src={port.imageUrl} alt={port.name} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-900/10" />
                  </div>

                  {/* Right/Bottom Content Column */}
                  <div className="p-6 md:p-8 flex-grow flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-sky-600 block">{port.tags}</span>
                        <h3 className="text-2xl font-black text-slate-900">{port.name} Cruise Port</h3>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">{port.hook}</p>
                      <p className="text-slate-400 text-xs italic">{port.description}</p>
                    </div>

                    {/* Excursions Section */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      {hasRealProducts ? (
                        <>
                          <h4 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Top Excursions</h4>
                          <div className="grid gap-4 sm:grid-cols-3">
                            {port.tours.map((tour) => {
                              const duration = tour.duration_minutes ? `${(tour.duration_minutes / 60).toFixed(1).replace(".0", "")} hrs` : "Varies";
                              const price = tour.price_from ? `$${tour.price_from}` : "Varies";
                              return (
                                <div key={tour.product_code} className="border border-slate-100 rounded-2xl p-3 flex flex-col justify-between hover:border-sky-300 bg-slate-50/50 transition">
                                  <div className="space-y-2">
                                    {tour.image_url ? (
                                      <img src={tour.image_url} alt={tour.title} className="w-full h-24 object-cover rounded-xl" />
                                    ) : (
                                      <img src={port.imageUrl} alt={tour.title} className="w-full h-24 object-cover rounded-xl" />
                                    )}
                                    <h5 className="font-bold text-slate-900 text-xs line-clamp-2 leading-snug">{tour.title}</h5>
                                  </div>
                                  <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                                    <span>{duration}</span>
                                    <span className="text-slate-800 font-bold">{price}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Recommended Excursion Types</h4>
                            <Link href={`/tours?port=${port.slug}`} className="text-[10px] font-bold text-sky-600 hover:underline">
                              View current tour options →
                            </Link>
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {port.curatedSearches.map((search) => (
                              <Link
                                key={search.label}
                                href={`/tours?q=${encodeURIComponent(search.q)}`}
                                className="border border-slate-100 rounded-2xl p-4 flex flex-col justify-between hover:border-sky-300 hover:bg-sky-50/50 bg-slate-50/30 transition text-left group"
                              >
                                <div className="space-y-1">
                                  <h5 className="font-bold text-slate-900 text-xs group-hover:text-sky-600 transition">{search.label}</h5>
                                  <p className="text-[10px] text-slate-500 leading-relaxed">{search.desc}</p>
                                </div>
                                <span className="text-[10px] font-bold text-sky-600 mt-3 block group-hover:underline">Search →</span>
                              </Link>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Port CTAs */}
                    <div className="flex flex-wrap gap-3 pt-2">
                      <Link href={`/ports/${port.slug}`} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl transition text-xs shadow-sm">
                        View {port.name} Guide
                      </Link>
                      <Link href={`/tours?port=${port.slug}`} className="border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-bold px-5 py-2.5 rounded-xl transition text-xs shadow-sm">
                        Browse {port.name} Tours
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* DCC Network Strip */}
        <div className="pt-10">
          <DccNetworkStrip />
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-12 px-6 text-center mt-16">
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="text-xs font-bold text-slate-400">
              © {new Date().getFullYear()} Last Frontier Shore Excursions. All rights reserved.
            </div>
            <div className="text-[10px] text-slate-400">
              Verified Network Node: <a href="https://www.destinationcommandcenter.com/network/last-frontier-shore-excursions" target="_blank" rel="noopener noreferrer" className="underline hover:text-sky-600">last-frontier-shore-excursions</a>
            </div>
            <div className="flex justify-center gap-6 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Link href="/ports" className="hover:text-sky-600 transition">Ports Guide</Link>
              <Link href="/tours" className="hover:text-sky-600 transition">Shore Excursions</Link>
            </div>
          </div>
        </footer>
      </main>
    );
  }

  // DCC fallthrough guide
  const juneauActions = getPortRecommendationActions("juneau-alaska");
  const topPorts = [
    { slug: "juneau", label: "Juneau" },
    { slug: "ketchikan", label: "Ketchikan" },
    { slug: "skagway", label: "Skagway" },
  ];

  const excursionIntents = [
    "whale watching alaska shore excursion",
    "mendenhall glacier tour juneau",
    "white pass railroad skagway excursion",
    "ketchikan wildlife and totem tours",
    "alaska helicopter glacier landing tour",
    "alaska dog sledding shore excursion",
  ];

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-16 space-y-10">
        <header className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">Alaska Cruise and Shore Excursion Guide</h1>
          <p className="text-zinc-300 text-lg">
            Cruise ports, glaciers, wildlife, and excursion logistics that decide what is actually possible in port-day windows.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Tile href="/cruises" title="Cruise Layer" desc="Ships, ports, health, route options" />
          <Tile href="/vegas" title="Vegas Layer" desc="Companion destination authority page" />
          <Tile href="/national-parks" title="National Parks Map" desc="Park layer and trip pairings" />
        </section>

        <BookableToursSection
          cityName="Alaska"
          title="Book Shore Excursions & Activities"
          description="Use DCC to find the right Alaska shore excursion fast, then continue to secure booking with Viator. This module is built to make the page feel immediately bookable, not just informational."
          primaryLabel="Browse Alaska Excursions"
          primaryHref="/tours?q=alaska%20shore%20excursions"
          secondaryLabel="View Cruise Inventory"
          secondaryHref="/cruises"
          intents={excursionIntents.map((intent) => ({
            label: intent,
            href: `/tours?q=${encodeURIComponent(intent)}`,
          }))}
          eyebrow="Book with DCC via Viator"
        />

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-2xl font-bold">Alaska Ports Directory</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {topPorts.map((port) => (
              <Link
                key={port.slug}
                href={`/ports/${port.slug}`}
                className="rounded-xl border border-white/10 bg-black/20 p-4 text-zinc-200 hover:bg-white/10"
              >
                {port.label} Cruise Port
              </Link>
            ))}
          </div>
        </div>

        <NextStepEngine
          title="Alaska Next Step Engine"
          eyebrow="Bottleneck-aware routing"
          description="DCC should hold cruise travelers in authority-mode when a shore-excursion lane is strained, then release them into execution when the port lane is healthy."
          actions={juneauActions}
        />
      </div>
    </main>
  );
}

function Tile({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="rounded-3xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition">
      <div className="text-lg font-bold">{title}</div>
      <div className="mt-2 text-sm text-zinc-400">{desc}</div>
      <div className="mt-4 text-sm text-cyan-300">Open →</div>
    </Link>
  );
}
