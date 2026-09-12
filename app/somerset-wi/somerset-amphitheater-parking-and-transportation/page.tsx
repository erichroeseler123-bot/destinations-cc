import type { Metadata } from "next";
import Link from "next/link";
import {
  Car,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Phone,
  ArrowLeft,
  DollarSign,
  MapPin,
} from "@/app/components/somerset/SomersetIcons";
import SomersetHeader from "@/app/components/somerset/SomersetHeader";
import SomersetFooter from "@/app/components/somerset/SomersetFooter";
import SomersetQuoteForm from "@/app/components/somerset/SomersetQuoteForm";

export const metadata: Metadata = {
  title: "Somerset Amphitheater Parking & Transportation Guide | Avoid Gridlock",
  description:
    "Compare Somerset Amphitheater parking lots, traffic delays, and rideshare availability against private group shuttle charters from the Twin Cities.",
  alternates: {
    canonical:
      "https://www.shuttletosomersetamphitheater.com/somerset-amphitheater-parking-and-transportation",
  },
  openGraph: {
    title: "Somerset Amphitheater Parking & Transportation Guide | Avoid Gridlock",
    description:
      "Honest guide comparing Somerset Amphitheater parking, rideshare pitfalls, and private group concert transportation.",
    url: "https://www.shuttletosomersetamphitheater.com/somerset-amphitheater-parking-and-transportation",
    type: "article",
  },
};

export const revalidate = 3600;

export default function SomersetAmphitheaterParkingAndTransportationPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Somerset Amphitheater Parking vs. Private Transportation Guide",
        description:
          "Detailed comparison of parking lots, exit delays, rideshare unreliability, and private charter options at Somerset Amphitheater.",
        author: {
          "@type": "Organization",
          name: "Somerset Amphitheater Shuttle",
        },
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
            name: "Parking & Transportation Guide",
            item: "https://www.shuttletosomersetamphitheater.com/somerset-amphitheater-parking-and-transportation",
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
            Logistics &amp; Travel Comparison
          </div>
          <h1 className="mt-4 text-3xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
            Somerset Amphitheater Parking vs. Private Transportation
          </h1>
          <p className="mt-4 text-base sm:text-lg text-white/80 leading-7 max-w-3xl">
            Before deciding to drive your own car or gamble on rideshare apps, review the realities of Somerset Amphitheater parking fees, two-lane rural highway bottlenecks, and late-night exit delays.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <a
              href="#quote"
              className="rounded-xl bg-[#ff6b35] px-6 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-[#ff8252] transition shadow-lg shadow-[#ff6b35]/25"
            >
              Skip the Parking Jam — Get Quote
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

        {/* 3-WAY COMPARISON GRID */}
        <section className="mt-12 grid gap-6 md:grid-cols-3">
          {/* OPTION 1: SELF-DRIVING & PARKING */}
          <div className="rounded-3xl border border-white/15 bg-[#0a121d] p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs font-black uppercase text-amber-400">Option 1</span>
              <h3 className="mt-2 text-xl font-black uppercase text-white">Driving &amp; Venue Parking</h3>
              <div className="mt-4 text-xs space-y-3 text-white/75">
                <p>
                  • <strong className="text-white">Parking Cost:</strong> $20–$50 per vehicle depending on show and lot.
                </p>
                <p>
                  • <strong className="text-white">Lot Conditions:</strong> Primarily open grass fields that can turn into slick mud during summer rainstorms.
                </p>
                <p>
                  • <strong className="text-white">Post-Show Delay:</strong> 60 to 120 minutes trapped in parking rows while parking attendants funnel thousands of cars onto County Road I.
                </p>
                <p>
                  • <strong className="text-white">Designated Driver:</strong> Someone in your group must stay completely sober throughout the evening.
                </p>
              </div>
            </div>
            <div className="mt-6 border-t border-white/10 pt-4 text-[11px] font-bold text-amber-400">
              Verdict: High hassle &amp; severe exit delays
            </div>
          </div>

          {/* OPTION 2: UBER / LYFT RIDESHARE */}
          <div className="rounded-3xl border border-rose-500/30 bg-rose-950/15 p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs font-black uppercase text-rose-400">Option 2</span>
              <h3 className="mt-2 text-xl font-black uppercase text-white">Uber / Lyft Rideshare</h3>
              <div className="mt-4 text-xs space-y-3 text-white/75">
                <p>
                  • <strong className="text-white">Outbound Ride:</strong> Easy to get a driver from Minneapolis to Somerset in the afternoon ($60–$90 one-way).
                </p>
                <p>
                  • <strong className="text-white">Midnight Availability:</strong> Near zero. Somerset is a rural village across the Wisconsin border. Twin Cities drivers refuse to deadhead 45 miles to pick up concertgoers.
                </p>
                <p>
                  • <strong className="text-white">Surge &amp; Cell Issues:</strong> Cell data routinely drops when 25,000 phones hit the tower, making app requests impossible.
                </p>
                <p>
                  • <strong className="text-white">Stranded Risk:</strong> High. Concertgoers are frequently stranded for hours outside the venue gates.
                </p>
              </div>
            </div>
            <div className="mt-6 border-t border-white/10 pt-4 text-[11px] font-bold text-rose-400">
              Verdict: Extreme risk of being stranded at midnight
            </div>
          </div>

          {/* OPTION 3: PRIVATE CHARTER SHUTTLE */}
          <div className="rounded-3xl border border-[#ff6b35]/40 bg-[#0d1825] p-6 flex flex-col justify-between shadow-xl">
            <div>
              <span className="text-xs font-black uppercase text-[#ff6b35]">Option 3 (Recommended)</span>
              <h3 className="mt-2 text-xl font-black uppercase text-white">Private Charter Shuttle</h3>
              <div className="mt-4 text-xs space-y-3 text-white/85">
                <p>
                  • <strong className="text-white">Flat Transparent Cost:</strong> Flat round-trip rate (~$500 for 14-pax van, or under $40/person split 14 ways).
                </p>
                <p>
                  • <strong className="text-white">Dedicated Waiting Chauffeur:</strong> Your driver stages on-site at Somerset Amphitheater throughout the show.
                </p>
                <p>
                  • <strong className="text-white">Bypass General Exit:</strong> Immediate walkout after the encore and access to the commercial charter exit lane.
                </p>
                <p>
                  • <strong className="text-white">Safe &amp; Stress-Free:</strong> Door-to-door Twin Cities pickup; everyone in your party enjoys the show safely.
                </p>
              </div>
            </div>
            <div className="mt-6 border-t border-white/10 pt-4 text-[11px] font-black text-emerald-400">
              Verdict: The safest, most seamless concert experience
            </div>
          </div>
        </section>

        {/* DEEP DIVE SECTION */}
        <section className="mt-14 space-y-8">
          <div className="rounded-3xl border border-white/12 bg-[#0a121d] p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-black uppercase text-white">
              Why the Somerset Highway Gridlock Happens
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/80">
              Unlike metropolitan amphitheaters connected directly to six-lane urban freeways, Somerset Amphitheater is situated in a picturesque river bend in St. Croix County. The venue relies on state and county highways (WI-35, WI-64, and County Road I) designed for local rural traffic.
            </p>
            <p className="mt-3 text-sm leading-7 text-white/80">
              When 25,000 fans attempt to exit general parking simultaneously onto two-lane highways with single-lane roundabouts, local law enforcement must manually meter intersections. This creates the infamous 90–120 minute parking lot delays that concertgoers complain about every summer.
            </p>
          </div>

          <div className="rounded-3xl border border-white/12 bg-[#0a121d] p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-black uppercase text-white">
              Commercial Charter Staging Advantage
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/80">
              Prearranged commercial charter vehicles (such as our high-roof vans and luxury SUVs) are routed into designated commercial passenger loading areas near the main box office gates on Spring Street.
            </p>
            <p className="mt-3 text-sm leading-7 text-white/80">
              Because your driver is parked in this forward staging area and has immediate mobile coordination with your group leader, your vehicle departs ahead of the main general admission parking lot queues.
            </p>
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
