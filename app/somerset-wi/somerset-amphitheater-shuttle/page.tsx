import type { Metadata } from "next";
import Link from "next/link";
import {
  Car,
  MapPin,
  Clock,
  ShieldCheck,
  Phone,
  Calendar,
  Users,
  CheckCircle2,
  Navigation,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
} from "@/app/components/somerset/SomersetIcons";
import SomersetHeader from "@/app/components/somerset/SomersetHeader";
import SomersetFooter from "@/app/components/somerset/SomersetFooter";
import SomersetQuoteForm from "@/app/components/somerset/SomersetQuoteForm";

export const metadata: Metadata = {
  title: "Somerset Amphitheater Shuttle | Twin Cities Private Concert Ride",
  description:
    "How to get to Somerset Amphitheater with private group shuttle service. Answers meeting points, Twin Cities door-to-door pickups, late-night return logistics, and weather policies.",
  alternates: {
    canonical: "https://www.shuttletosomersetamphitheater.com/somerset-amphitheater-shuttle",
  },
  openGraph: {
    title: "Somerset Amphitheater Shuttle | Twin Cities Private Concert Ride",
    description:
      "Complete guide to private shuttle and group transportation to Somerset Amphitheater from Minneapolis, St. Paul, and the Twin Cities.",
    url: "https://www.shuttletosomersetamphitheater.com/somerset-amphitheater-shuttle",
    type: "article",
  },
};

export const revalidate = 3600;

export default function SomersetAmphitheaterShuttlePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: "Private Shuttle to Somerset Amphitheater",
        provider: {
          "@type": "LocalBusiness",
          name: "Somerset Amphitheater Shuttle",
          telephone: "+1-720-369-6292",
        },
        areaServed: [
          { "@type": "City", name: "Minneapolis" },
          { "@type": "City", name: "St. Paul" },
          { "@type": "City", name: "Stillwater" },
          { "@type": "City", name: "Hudson" },
        ],
        description:
          "Private charter shuttle transportation connecting the Twin Cities with Somerset Amphitheater concerts and festivals.",
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
            name: "Somerset Amphitheater Shuttle",
            item: "https://www.shuttletosomersetamphitheater.com/somerset-amphitheater-shuttle",
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
            Comprehensive Shuttle Guide
          </div>
          <h1 className="mt-4 text-3xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
            Private Shuttle to Somerset Amphitheater
          </h1>
          <p className="mt-4 text-base sm:text-lg text-white/80 leading-7 max-w-3xl">
            Everything your group needs to know about getting to Somerset Amphitheater from the Twin Cities: pickup locations, vehicle specs, staging logistics, meeting locations, and guaranteed post-concert return rides.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <a
              href="#quote"
              className="rounded-xl bg-[#ff6b35] px-6 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-[#ff8252] transition shadow-lg shadow-[#ff6b35]/25"
            >
              Request Shuttle Quote
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

        {/* 5 KEY LOGISTICAL ANSWERS */}
        <div className="mt-12 space-y-12">
          {/* 1. HOW TO GET THERE */}
          <section className="rounded-3xl border border-white/12 bg-[#0a121d] p-6 sm:p-8">
            <div className="flex items-center gap-3 text-[#3df3ff]">
              <Navigation className="h-6 w-6" />
              <h2 className="text-xl sm:text-2xl font-black uppercase text-white">
                1. How to Get to Somerset Amphitheater from the Twin Cities
              </h2>
            </div>
            <div className="mt-4 space-y-4 text-sm leading-7 text-white/80">
              <p>
                Somerset Amphitheater is located at <strong className="text-white">715 Spring Street, Somerset, WI 54025</strong>, approximately 35 miles northeast of St. Paul and 42 miles northeast of Minneapolis along the Apple River.
              </p>
              <p>
                Our private drivers navigate one of two primary routes depending on your pickup point and real-time concert traffic patterns:
              </p>
              <ul className="space-y-2.5 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/85">
                <li>
                  • <strong className="text-white">The Southern Interstate Route (I-94E to WI-35N):</strong> From Minneapolis, St. Paul, or Woodbury, take I-94 East across the St. Croix River into Hudson, Wisconsin, then exit north on WI-35 into Somerset. Travel time is typically 45–55 minutes without bottlenecks.
                </li>
                <li>
                  • <strong className="text-white">The Northern River Expressway Route (MN-36E to WI-64E):</strong> From Minneapolis or the northern metro, take MN-36 East across the St. Croix Crossing bridge south of Stillwater, continuing onto WI-64 East directly into Somerset.
                </li>
              </ul>
              <p className="text-xs text-white/60">
                On major concert days, county highway traffic can back up 3–5 miles before the venue. Our drivers monitor traffic cameras and adjust departure times so your group arrives relaxed and on schedule.
              </p>
            </div>
          </section>

          {/* 2. WHERE RIDERS MEET */}
          <section className="rounded-3xl border border-white/12 bg-[#0a121d] p-6 sm:p-8">
            <div className="flex items-center gap-3 text-[#ff6b35]">
              <MapPin className="h-6 w-6" />
              <h2 className="text-xl sm:text-2xl font-black uppercase text-white">
                2. Where Riders Meet Their Driver
              </h2>
            </div>
            <div className="mt-4 space-y-4 text-sm leading-7 text-white/80">
              <p>
                Knowing exactly where to find your ride at the end of a loud, dark concert is critical. Here is how meeting works:
              </p>
              <ul className="space-y-3 text-xs text-white/85">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Pre-Show Direct Contact:</strong> Before departure, dispatch texts you your driver’s direct cell phone number, vehicle description, and license plate.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Designated Commercial Drop-Off &amp; Pickup Area:</strong> Your vehicle is permitted into the commercial charter lot near the main box office gates on Spring Street, avoiding the general parking grass lots.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Live Location Pin:</strong> When you exit the gates, your driver sends a live location pin and turns on hazard lights for effortless identification.
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* 3. PRIVATE VS SHARED */}
          <section className="rounded-3xl border border-white/12 bg-[#0a121d] p-6 sm:p-8">
            <div className="flex items-center gap-3 text-emerald-400">
              <Users className="h-6 w-6" />
              <h2 className="text-xl sm:text-2xl font-black uppercase text-white">
                3. Private vs. Shared Transportation
              </h2>
            </div>
            <div className="mt-4 space-y-4 text-sm leading-7 text-white/80">
              <p>
                Our service is <strong className="text-white">100% private for your group</strong>. We do not sell individual ticketed seats or operate public shared bus routes.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 mt-4 text-xs">
                <div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/15 p-4">
                  <h3 className="font-black uppercase text-emerald-400 text-sm">Our Private Charter Model</h3>
                  <ul className="mt-2 space-y-1.5 text-white/75">
                    <li>✓ Your party only in the vehicle</li>
                    <li>✓ Custom door-to-door pickup time &amp; address</li>
                    <li>✓ Bring your own music, drinks, and coolers</li>
                    <li>✓ Depart immediately when you want</li>
                    <li>✓ Driver stays dedicated to your group</li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-rose-500/25 bg-rose-950/15 p-4">
                  <h3 className="font-black uppercase text-rose-400 text-sm">Traditional Shared Bus Issues</h3>
                  <ul className="mt-2 space-y-1.5 text-white/75">
                    <li>✗ Strangers drinking and arguing around you</li>
                    <li>✗ Rigid downtown pickup points (no home pickup)</li>
                    <li>✗ Buses stuck waiting 45+ mins for missing passengers</li>
                    <li>✗ Cramped school-bus seating with no AC</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* 4. LATE-NIGHT RETURN LOGISTICS */}
          <section className="rounded-3xl border border-white/12 bg-[#0a121d] p-6 sm:p-8">
            <div className="flex items-center gap-3 text-amber-400">
              <Clock className="h-6 w-6" />
              <h2 className="text-xl sm:text-2xl font-black uppercase text-white">
                4. How Late-Night Return Transportation Works
              </h2>
            </div>
            <div className="mt-4 space-y-4 text-sm leading-7 text-white/80">
              <p>
                After the concert ends around 11:00 PM or midnight, 20,000+ people converge onto rural two-lane Wisconsin roads.
              </p>
              <p>
                Because your chauffeur stages on-site throughout the concert, your group walks straight to your vehicle. Once your entire crew is loaded, your driver accesses the designated commercial charter lane that bypasses the general public parking gridlock, heading straight onto WI-64 or WI-35 back to the Twin Cities.
              </p>
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs text-amber-200/90 leading-5">
                ⚠️ <strong>Avoid the Rural Rideshare Trap:</strong> Every summer, hundreds of concertgoers assume they can open Uber or Lyft at midnight in Somerset. In reality, cell towers overload and zero drivers are available in St. Croix County. Having a prearranged private ride is the only reliable way home.
              </div>
            </div>
          </section>

          {/* 5. SOLD OUT OR RESCHEDULED SHOWS */}
          <section className="rounded-3xl border border-white/12 bg-[#0a121d] p-6 sm:p-8">
            <div className="flex items-center gap-3 text-violet-400">
              <ShieldCheck className="h-6 w-6" />
              <h2 className="text-xl sm:text-2xl font-black uppercase text-white">
                5. What Happens When a Concert is Sold Out or Rescheduled?
              </h2>
            </div>
            <div className="mt-4 space-y-4 text-sm leading-7 text-white/80">
              <p>
                Midwest summer weather can bring severe thunderstorms that occasionally cause outdoor amphitheater shows to be postponed or rescheduled by promoters.
              </p>
              <ul className="space-y-2 text-xs text-white/85">
                <li>
                  • <strong className="text-white">Rescheduled Concerts:</strong> If Somerset Amphitheater or Live Nation moves the event to a new date, your charter reservation and all payments automatically transfer to the new concert date at zero penalty.
                </li>
                <li>
                  • <strong className="text-white">Cancelled Events:</strong> If a concert is cancelled outright by the tour or venue, you receive a full refund or credit toward another concert charter of your choice.
                </li>
                <li>
                  • <strong className="text-white">Sold Out Shows:</strong> We do not sell concert tickets; our service is strictly transportation. As long as you have tickets, your vehicle is reserved regardless of whether general venue parking or lawn tickets sell out.
                </li>
              </ul>
            </div>
          </section>
        </div>

        {/* QUOTE SECTION */}
        <div className="mt-16" id="quote">
          <SomersetQuoteForm />
        </div>
      </main>

      <SomersetFooter />
    </div>
  );
}
