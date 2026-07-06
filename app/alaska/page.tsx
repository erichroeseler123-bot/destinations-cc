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
        description: "Mendenhall Glacier flights, helicopter dog sledding, and whale watching.",
        tours: (juneauRes?.products || []).slice(0, 3),
      },
      {
        slug: "skagway",
        name: "Skagway",
        description: "White Pass & Yukon Route train rides, historic tours, and wilderness trips.",
        tours: (skagwayRes?.products || []).slice(0, 3),
      },
      {
        slug: "ketchikan",
        name: "Ketchikan",
        description: "Rainforest hikes, floatplane fjord flights, and wildlife totems.",
        tours: (ketchikanRes?.products || []).slice(0, 3),
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
        <header className="bg-slate-900 text-white py-16 px-6 relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.15),transparent_50%)]">
          <div className="max-w-5xl mx-auto space-y-6 relative z-10">
            <span className="inline-flex rounded-full bg-sky-500/10 border border-sky-400/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-sky-400">
              Cruise Port Guides
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight max-w-3xl leading-[1.05]">
              Alaska shore excursions for cruise passengers.
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-2xl font-medium leading-relaxed">
              Compare real cruise-port tours in Juneau, Skagway, and Ketchikan with clear booking links and port-day guidance.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <a href="#ports" className="bg-sky-600 text-white font-bold px-6 py-3 rounded-2xl hover:bg-sky-500 transition shadow-lg">
                View Port Guides
              </a>
              <Link href="/tours" className="bg-white/10 text-white border border-white/20 font-bold px-6 py-3 rounded-2xl hover:bg-white/20 transition">
                Search All Excursions
              </Link>
            </div>
          </div>
        </header>

        {/* Trust Strip */}
        <div className="max-w-5xl mx-auto px-6 pt-10">
          <LfsTrustStrip />
        </div>

        {/* Port list & Excursions */}
        <section id="ports" className="max-w-5xl mx-auto px-6 pt-16 space-y-16">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-3xl font-black tracking-tight text-slate-900">Core Alaska Cruise Ports</h2>
            <p className="text-slate-500 max-w-xl">Choose a port to read local logistically safe day schedules or browse real-time available excursions.</p>
          </div>

          <div className="grid gap-8">
            {portsData.map((port) => (
              <div key={port.slug} className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm hover:shadow-md transition space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-900">{port.name} Cruise Port</h3>
                    <p className="text-slate-500 text-sm">{port.description}</p>
                  </div>
                  <Link href={`/ports/${port.slug}`} className="inline-flex items-center justify-center bg-slate-900 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-slate-800 transition text-sm">
                    View Port Logistics Guide →
                  </Link>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs uppercase tracking-widest text-slate-400 font-bold">Top Bookable Excursions</h4>
                  {port.tours.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-3">
                      {port.tours.map((tour) => {
                        const duration = tour.duration_minutes ? `${(tour.duration_minutes / 60).toFixed(1).replace(".0", "")} hrs` : "Varies";
                        const price = tour.price_from ? `$${tour.price_from}` : "Varies";
                        return (
                          <div key={tour.product_code} className="border border-slate-100 rounded-2xl p-4 flex flex-col justify-between hover:border-sky-300 transition">
                            <div className="space-y-3">
                              {tour.image_url ? (
                                <img src={tour.image_url} alt={tour.title} className="w-full h-32 object-cover rounded-xl" />
                              ) : (
                                <div className="w-full h-32 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs">No image</div>
                              )}
                              <h5 className="font-bold text-slate-950 text-sm line-clamp-2">{tour.title}</h5>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                              <div className="flex items-center justify-between text-xs text-slate-500">
                                <span>{duration}</span>
                                <span className="font-bold text-slate-900">{price}</span>
                              </div>
                              <a href={tour.url} target="_blank" rel="noopener noreferrer" className="w-full text-center block bg-sky-50 text-sky-700 hover:bg-sky-100 transition font-bold py-2 rounded-xl text-xs">
                                Book on Viator
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">No cached tours found for this port.</p>
                  )}
                </div>
              </div>
            ))}
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
