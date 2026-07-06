export const dynamicParams = true;

import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AirportLinksSection from "@/app/components/dcc/AirportLinksSection";
import StationLinksSection from "@/app/components/dcc/StationLinksSection";
import JsonLd from "@/app/components/dcc/JsonLd";
import { getAirportsByPortSlug } from "@/lib/dcc/airports";
import { getStationsByPortSlug } from "@/lib/dcc/stations";
import { getPortBySlug, getPortSlugs } from "@/lib/dcc/ports";
import PortAuthorityTemplate from "@/app/components/dcc/PortAuthorityTemplate";
import { getPortAuthorityConfig } from "@/src/data/port-authority-config";
import DecisionEngineTemplate from "@/app/components/dcc/DecisionEngineTemplate";
import LivePulseBlock from "@/app/components/dcc/livePulse/LivePulseBlock";
import Next48Button from "@/app/components/dcc/next48/Next48Button";
import ShareWeekendCard from "@/app/components/dcc/share/ShareWeekendCard";
import { getSurface, hasSurfaceEntity } from "@/lib/dcc/surfaces/getSurface";
import { getDecisionEnginePageByPath } from "@/src/data/decision-engine-pages";
import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildPlaceJsonLd,
} from "@/lib/dcc/jsonld";
import { headers } from "next/headers";
import LfsTrustStrip from "@/components/LfsTrustStrip";
import DccNetworkStrip from "@/components/DccNetworkStrip";
import { getViatorActionForPlace } from "@/lib/dcc/internal/viatorAction";

const BASE_URL = "https://destinationcommandcenter.com";

export async function generateStaticParams() {
  return getPortSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const port = getPortBySlug(resolvedParams.slug);
  if (!port) return { title: "Cruise Port" };

  const config = getPortAuthorityConfig(port);
  const pageTitle = config.heroTitle || `${port.name} Cruise Port`;
  const description = config.summary;
  const canonicalPath = `/ports/${port.slug}`;

  const hostHeader = (await headers()).get("x-forwarded-host") || (await headers()).get("host") || "";
  const host = hostHeader.split(":")[0];
  const isLfse = host === "lastfrontiershoreexcursions.com" || host === "www.lastfrontiershoreexcursions.com";
  const origin = isLfse ? "https://www.lastfrontiershoreexcursions.com" : "https://destinationcommandcenter.com";

  return {
    title: pageTitle,
    description,
    metadataBase: new URL(origin),
    alternates: { canonical: canonicalPath },
    applicationName: isLfse ? "Last Frontier Shore Excursions" : "Destination Command Center",
    openGraph: {
      siteName: isLfse ? "Last Frontier Shore Excursions" : "Destination Command Center",
      title: pageTitle,
      description,
      url: canonicalPath,
      type: "website",
      images: [`/api/og?title=${encodeURIComponent(pageTitle)}`],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [`/api/og?title=${encodeURIComponent(pageTitle)}`],
    },
  };
}

export default async function PortPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const port = getPortBySlug(resolvedParams.slug);
  if (!port) notFound();

  const hostHeader = (await headers()).get("x-forwarded-host") || (await headers()).get("host") || "";
  const host = hostHeader.split(":")[0];
  const isLfse = host === "lastfrontiershoreexcursions.com" || host === "www.lastfrontiershoreexcursions.com";

  const config = getPortAuthorityConfig(port);
  const nearbyAirports = getAirportsByPortSlug(port.slug);
  const nearbyStations = getStationsByPortSlug(port.slug);

  if (isLfse) {
    const allowedLfseSlugs = new Set(["juneau", "skagway", "ketchikan"]);
    if (!allowedLfseSlugs.has(port.slug)) {
      notFound();
    }

    // Fetch real Viator tours for this port
    let tours: any[] = [];
    try {
      const toursRes = await getViatorActionForPlace({
        slug: port.slug,
        name: port.name,
        citySlug: port.slug,
        currency: "USD",
      });
      tours = (toursRes?.products || []).slice(0, 3);
    } catch (e) {
      console.error("Failed to fetch Viator tours for LFSE port page:", e);
    }

    const plainPortName = port.name.replace(/^Port of\s+/i, "");
    
    // Choose appropriate image above the fold based on port
    const heroImage = port.slug === "juneau" 
      ? "/images/authority/ports/juneau/hero.webp" 
      : port.slug === "skagway" 
      ? "/images/authority/ports/skagway/hero.webp" 
      : "/images/authority/ports/ketchikan/hero.webp";

    const country = port.country === "US" ? "United States" : port.country || "United States";
    const region = port.area || port.region || "Alaska";

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
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
          <div className="max-w-5xl mx-auto relative z-10 grid md:grid-cols-12 gap-8 items-center">
            <div className="space-y-6 md:col-span-7">
              <span className="inline-flex rounded-full bg-sky-500/10 border border-sky-400/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-sky-400">
                {plainPortName} Cruise Port Guide
              </span>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1]">
                {plainPortName} Shore Excursions for Cruise Passengers
              </h1>
              <p className="text-base md:text-lg text-slate-300 max-w-xl leading-relaxed">
                Compare whale watching, Mendenhall Glacier, helicopter, and wildlife tours that fit your cruise day.
              </p>
              
              {/* CTAs */}
              <div className="flex flex-wrap gap-4 pt-2">
                <a href="#excursions" className="bg-sky-600 text-white font-bold px-6 py-3 rounded-2xl hover:bg-sky-500 transition shadow-lg text-sm text-center">
                  Browse {plainPortName} Tours
                </a>
                <a href="#timing" className="bg-white/10 text-white border border-white/20 font-bold px-6 py-3 rounded-2xl hover:bg-white/20 transition text-sm text-center">
                  Check Cruise-Day Timing
                </a>
              </div>
              
              {/* Chips */}
              <div className="space-y-2 pt-2">
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Excursion Categories:</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Whale Watching",
                    "Mendenhall Glacier",
                    "Helicopter Tours",
                    "Wildlife",
                    "Flightseeing"
                  ].map((chip) => (
                    <Link
                      key={chip}
                      href={`/tours?q=${encodeURIComponent(plainPortName + " " + chip)}`}
                      className="bg-white/5 border border-white/10 hover:bg-white/15 text-slate-200 text-xs px-3 py-1.5 rounded-xl transition font-medium"
                    >
                      {chip}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Real Port Image Side Column */}
            <div className="md:col-span-5 hidden md:block">
              <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative h-64 md:h-80 bg-slate-800">
                <img 
                  src={heroImage} 
                  alt={`${plainPortName} Cruise Port`} 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 text-xs font-bold text-white uppercase tracking-wider">
                  {region} • {country}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content body */}
        <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
          
          {/* Top Excursions - Live product cards moved higher on the page */}
          <section id="excursions" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-widest font-bold text-sky-600">Viator Excursions</span>
                <h2 className="text-2xl font-black text-slate-900">Bookable {plainPortName} Excursions</h2>
                <p className="text-slate-500 text-sm">Real-time bookable excursions from port with direct exits into Viator checkout.</p>
              </div>
              <Link href={`/tours?q=${encodeURIComponent(plainPortName + " tours")}`} className="text-sky-600 font-bold hover:text-sky-500 transition text-sm flex items-center gap-1">
                Search All {plainPortName} Excursions →
              </Link>
            </div>

            {tours.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-3">
                {tours.map((tour) => {
                  const duration = tour.duration_minutes ? `${(tour.duration_minutes / 60).toFixed(1).replace(".0", "")} hrs` : "Varies";
                  const price = tour.price_from ? `$${tour.price_from}` : "Varies";
                  return (
                    <div key={tour.product_code} className="bg-white border border-slate-200/80 rounded-3xl p-5 flex flex-col justify-between hover:shadow-md transition">
                      <div className="space-y-4">
                        {tour.image_url ? (
                          <img src={tour.image_url} alt={tour.title} className="w-full h-40 object-cover rounded-2xl" />
                        ) : (
                          <div className="w-full h-40 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 text-xs">No image</div>
                        )}
                        <h3 className="font-bold text-slate-900 text-base line-clamp-2 leading-snug">{tour.title}</h3>
                      </div>
                      <div className="mt-6 pt-4 border-t border-slate-100 space-y-4">
                        <div className="flex items-center justify-between text-sm text-slate-500">
                          <span>{duration}</span>
                          <span className="font-bold text-slate-900">{price}</span>
                        </div>
                        <a href={tour.url} target="_blank" rel="noopener noreferrer" className="w-full text-center block bg-sky-600 text-white hover:bg-sky-500 transition font-bold py-2.5 rounded-xl text-xs shadow-sm">
                          Book on Viator
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 text-center text-slate-500 text-sm">
                No cached excursions found for this port. Browse our full search directory for live availability.
              </div>
            )}
          </section>

          {/* Cruise Day Basics Snapshot */}
          <section id="timing" className="grid gap-8 md:grid-cols-12 items-stretch">
            {/* Basics */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm md:col-span-5 space-y-6">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-widest font-bold text-sky-600 font-sans">Port Snapshot</span>
                <h2 className="text-2xl font-black text-slate-900">Cruise-Day Basics</h2>
              </div>
              <div className="grid gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-bold">Country / Region</div>
                  <div className="mt-1 font-bold text-slate-800">{country} • {region}</div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-bold">Tender or Dock</div>
                  <div className="mt-1 font-bold text-slate-800">{config.tenderDock}</div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-bold">Common Excursion Length</div>
                  <div className="mt-1 font-bold text-slate-800">{config.excursionLength}</div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-bold">Best-known Nearby Area</div>
                  <div className="mt-1 font-bold text-slate-800">{config.nearbyTown}</div>
                </div>
              </div>
            </div>

            {/* Snapshot */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm md:col-span-7 space-y-6 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-xs uppercase tracking-widest font-bold text-sky-600">Logistics Guide</span>
                  <h2 className="text-2xl font-black text-slate-900">Plan Your {plainPortName} Port Day</h2>
                  <p className="text-slate-500 text-sm">Quick context for how {plainPortName} usually works on a cruise day before choosing excursions.</p>
                </div>
                {config.tripPlanningSnapshot?.length ? (
                  <div className="space-y-4">
                    {config.tripPlanningSnapshot.map((item) => (
                      <div key={item.label} className="flex gap-4 items-start">
                        <div className="bg-sky-50 text-sky-600 rounded-xl px-3 py-1.5 font-bold text-xs shrink-0 max-w-[120px] text-center truncate">
                          {item.label}
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-slate-900 text-sm">{item.value}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              
              <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 font-medium">
                Last Frontier Shore Excursions helps cruise passengers plan port days. When booking, checkout is safely handled directly on Viator.
              </div>
            </div>
          </section>

          {/* Airports and Stations Section (styled cleanly with high-contrast text) */}
          <section className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 space-y-6">
            <h3 className="text-lg font-black text-slate-900">Transit & Transfer Planning</h3>
            <p className="text-slate-500 text-xs max-w-2xl leading-relaxed">
              If your cruise starts or ends in {plainPortName}, or you are traveling independently, plan with transit proximity guides.
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Nearby Airports</h4>
                {nearbyAirports.length > 0 ? (
                  <div className="space-y-2">
                    {nearbyAirports.map(airport => (
                      <Link key={airport.slug} href={`/airports/${airport.slug}`} className="block p-3 rounded-2xl bg-slate-50 hover:bg-sky-50 border border-slate-100 text-xs font-bold text-slate-700 hover:text-sky-700 transition">
                        {airport.name} ({airport.iata}) →
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs">No nearby airports registered.</p>
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Nearby Stations</h4>
                {nearbyStations.length > 0 ? (
                  <div className="space-y-2">
                    {nearbyStations.map(station => (
                      <Link key={station.slug} href={`/stations/${station.slug}`} className="block p-3 rounded-2xl bg-slate-50 hover:bg-sky-50 border border-slate-100 text-xs font-bold text-slate-700 hover:text-sky-700 transition">
                        {station.name} →
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs">No nearby stations registered.</p>
                )}
              </div>
            </div>
          </section>

        </main>

        {/* DCC Network Strip */}
        <div className="max-w-5xl mx-auto px-6 pt-8">
          <DccNetworkStrip />
        </div>

        {/* Trust Strip */}
        <div className="max-w-5xl mx-auto px-6 pt-4 pb-4">
          <LfsTrustStrip />
        </div>

        <footer className="max-w-5xl mx-auto px-6 pt-4 text-center space-y-3">
          <div className="text-[10px] text-slate-400">
            Verified Network Node: <a href="https://www.destinationcommandcenter.com/network/last-frontier-shore-excursions" target="_blank" rel="noopener noreferrer" className="underline hover:text-sky-600">last-frontier-shore-excursions</a>
          </div>
          <div>
            <Link href="/ports" className="text-xs font-bold text-slate-400 hover:text-sky-600 transition">
              ← Back to Ports Directory
            </Link>
          </div>
        </footer>
      </div>
    );
  }

  const pageTitle = config.heroTitle || `${port.name} Cruise Port`;
  const description = config.summary;
  const origin = isLfse ? "https://www.lastfrontiershoreexcursions.com" : "https://destinationcommandcenter.com";
  const pageUrl = `${origin}/ports/${port.slug}`;
  const region = port.area || port.region || port.country || "Cruise region";
  const country = port.country || "Unknown";
  const entityKey = `port:${port.slug}`;
  const surface =
    hasSurfaceEntity(entityKey) ?
      await getSurface({
        entityKey: entityKey as `port:${string}`,
        modules: ["decision", "livePulse", "next48", "share", "counts", "graph", "media"],
        strict: false,
      })
    : null;
  const decisionPage = surface?.modules.decision?.page || getDecisionEnginePageByPath(`/ports/${port.slug}`);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildPlaceJsonLd({
              path: `/ports/${port.slug}`,
              name: pageTitle,
              description,
              address: {
                region,
                country,
              },
              touristTypes: ["Cruise travelers", "Shore excursion buyers", "Port planners"],
            }),
            buildBreadcrumbJsonLd([
              { name: "Home", item: "/" },
              { name: "Ports", item: "/ports" },
              { name: port.name, item: `/ports/${port.slug}` },
            ]),
            buildFaqJsonLd(config.faq.slice(0, 3)),
          ],
        }}
      />
      <PortAuthorityTemplate port={port} config={config} />
      <section className="max-w-6xl mx-auto px-6 pb-10">
        <AirportLinksSection
          title={`Airports that affect ${port.name} planning`}
          intro={`Use airport pages when the real decision is airport-to-port timing, pre-cruise hotel staging, or transfer risk before embarkation.`}
          airports={nearbyAirports}
        />
        <div className="mt-8">
          <StationLinksSection
            title={`Train and bus stations that affect ${port.name} planning`}
            intro={`Use station pages when the traveler is arriving by rail or bus and the real decision is how to route into ${port.name}, nearby staging, or the cruise-port side of the trip.`}
            stations={nearbyStations}
          />
        </div>
      </section>
      {decisionPage ? (
        <section className="max-w-6xl mx-auto px-6 pb-10">
          <DecisionEngineTemplate page={decisionPage} />
          {port.slug === "juneau" ? (
            <div className="mt-8 space-y-8">
              <LivePulseBlock
                entityType="port"
                entitySlug="juneau"
                title="Juneau Right Now"
                target="entity"
              />
              <ShareWeekendCard
                entityType="port"
                slug="juneau"
                title="Share This Weekend: Juneau"
                subtitle="Port Intelligence Snapshot"
                context="port:juneau"
                fallbackHero="/images/authority/ports/juneau/hero.webp"
                pageUrl={pageUrl}
              />
            </div>
          ) : null}
        </section>
      ) : null}
      <footer className="max-w-6xl mx-auto px-6 pb-14">
        <Link href="/ports" className="text-sm text-zinc-400 hover:text-zinc-200">
          Back to Ports Directory →
        </Link>
      </footer>
      {port.slug === "juneau" ? <Next48Button entityType="port" slug="juneau" /> : null}
    </>
  );
}
