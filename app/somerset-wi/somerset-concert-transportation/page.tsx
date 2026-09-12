import type { Metadata } from "next";
import Link from "next/link";
import {
  Music,
  MapPin,
  Clock,
  Car,
  Users,
  CheckCircle2,
  Calendar,
  Phone,
  ArrowLeft,
  Sparkles,
} from "@/app/components/somerset/SomersetIcons";
import SomersetHeader from "@/app/components/somerset/SomersetHeader";
import SomersetFooter from "@/app/components/somerset/SomersetFooter";
import SomersetQuoteForm from "@/app/components/somerset/SomersetQuoteForm";

export const metadata: Metadata = {
  title: "Somerset Concert Transportation | Twin Cities Event Charter Vans",
  description:
    "Private concert transportation to Somerset Amphitheater from Minneapolis, St. Paul, and the Twin Cities metro. High-roof vans, on-site staging, and custom festival timing.",
  alternates: {
    canonical: "https://www.shuttletosomersetamphitheater.com/somerset-concert-transportation",
  },
  openGraph: {
    title: "Somerset Concert Transportation | Twin Cities Event Charter Vans",
    description:
      "Book private group charter vans and luxury SUVs for concerts and festivals at Somerset Amphitheater.",
    url: "https://www.shuttletosomersetamphitheater.com/somerset-concert-transportation",
    type: "article",
  },
};

export const revalidate = 3600;

export default function SomersetConcertTransportationPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: "Somerset Amphitheater Concert Transportation",
        provider: {
          "@type": "LocalBusiness",
          name: "Somerset Amphitheater Shuttle",
          telephone: "+1-720-369-6292",
        },
        description:
          "Private concert charter van and SUV transportation between Minneapolis-St. Paul Twin Cities and Somerset Amphitheater.",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://www.shuttletosomersetamphitheater.com/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Concert Transportation",
            item: "https://www.shuttletosomersetamphitheater.com/somerset-concert-transportation",
          },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#070d14] text-white selection:bg-[#ff6b35] selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SomersetHeader />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#3df3ff] hover:text-[#62f6ff] transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </Link>

        {/* Page Header */}
        <header className="mt-6 border-b border-white/10 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ff6b35]/30 bg-[#ff6b35]/10 px-3.5 py-1 text-xs font-black uppercase tracking-widest text-[#ff8252]">
            Concert &amp; Festival Logistics
          </div>
          <h1 className="mt-4 text-3xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
            Somerset Amphitheater Concert Transportation
          </h1>
          <p className="mt-4 text-base sm:text-lg text-white/80 leading-7 max-w-3xl">
            Seamless round-trip private transportation for summer concerts, multi-day music festivals, and headliner tour stops at Somerset Amphitheater in western Wisconsin.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <a
              href="#quote"
              className="rounded-xl bg-[#ff6b35] px-6 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-[#ff8252] transition shadow-lg shadow-[#ff6b35]/25"
            >
              Request Concert Charter Quote
            </a>
            <a
              href="tel:+17203696292"
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-white/10 transition"
            >
              <Phone className="h-3.5 w-3.5 text-[#3df3ff]" />
              <span>Call / Text (720) 369-6292</span>
            </a>
          </div>
        </header>

        {/* Concert Logistics Details */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/12 bg-[#0a121d] p-6 sm:p-8">
            <div className="flex items-center gap-3 text-[#ff6b35]">
              <Clock className="h-6 w-6" />
              <h2 className="text-xl font-black uppercase text-white">
                Estimated Transit Times
              </h2>
            </div>
            <ul className="mt-4 space-y-3 text-xs sm:text-sm text-white/80">
              <li className="flex items-center justify-between border-b border-white/10 pb-2">
                <span>From Downtown Minneapolis:</span>
                <strong className="text-white">45–55 minutes</strong>
              </li>
              <li className="flex items-center justify-between border-b border-white/10 pb-2">
                <span>From Downtown St. Paul:</span>
                <strong className="text-white">35–45 minutes</strong>
              </li>
              <li className="flex items-center justify-between border-b border-white/10 pb-2">
                <span>From Stillwater, MN:</span>
                <strong className="text-white">15–20 minutes</strong>
              </li>
              <li className="flex items-center justify-between border-b border-white/10 pb-2">
                <span>From Hudson, WI:</span>
                <strong className="text-white">20–25 minutes</strong>
              </li>
              <li className="flex items-center justify-between">
                <span>From Woodbury / East Metro:</span>
                <strong className="text-white">30–35 minutes</strong>
              </li>
            </ul>
            <p className="mt-4 text-xs text-white/60 leading-5">
              * Note: Times reflect standard highway conditions. On sold-out concert nights, arrival should be scheduled at least 90 minutes before gate opening to avoid county road backups.
            </p>
          </div>

          <div className="rounded-3xl border border-white/12 bg-[#0a121d] p-6 sm:p-8">
            <div className="flex items-center gap-3 text-[#3df3ff]">
              <Users className="h-6 w-6" />
              <h2 className="text-xl font-black uppercase text-white">
                Multi-Stop &amp; Group Pickups
              </h2>
            </div>
            <p className="mt-4 text-xs sm:text-sm text-white/80 leading-6">
              Organizing friends who live across different Twin Cities neighborhoods? We can easily coordinate multiple pickup stops (e.g. stop 1 in Uptown Minneapolis, stop 2 in St. Paul) on the way east to Somerset Amphitheater.
            </p>
            <div className="mt-4 space-y-2 text-xs text-white/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Luggage &amp; cooler space for your entire group</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Bluetooth sound system sync for your pre-show playlist</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Cold AC &amp; comfortable high-roof seating</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tailgating & Gear Policy */}
        <section className="mt-12 rounded-3xl border border-white/12 bg-[#0a121d] p-6 sm:p-8">
          <div className="flex items-center gap-3 text-emerald-400">
            <Sparkles className="h-6 w-6" />
            <h2 className="text-xl sm:text-2xl font-black uppercase text-white">
              Tailgate Gear, Coolers &amp; Concert Timing
            </h2>
          </div>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 text-xs sm:text-sm text-white/80 leading-6">
            <div>
              <h3 className="font-bold text-white uppercase text-xs tracking-wider">Tailgating Comfort</h3>
              <p className="mt-2">
                Unlike taking a cramped public bus or rideshare car, our private vans provide ample cargo space for coolers, folding chairs, blankets, and extra jackets. You can pre-game outside the venue or relax in the air-conditioned van before gates open.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-white uppercase text-xs tracking-wider">Gear Security During the Show</h3>
              <p className="mt-2">
                Your driver stays with the vehicle the entire evening. All your personal belongings, bags, and leftover supplies remain locked, safe, and secure until you return to the van after the final encore.
              </p>
            </div>
          </div>
        </section>

        {/* QUOTE SECTION */}
        <div className="mt-16" id="quote">
          <SomersetQuoteForm />
        </div>
      </main>

      <SomersetFooter />
    </div>
  );
}
