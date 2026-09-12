import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Phone,
  Calendar,
  Users,
  MapPin,
  Clock,
  Car,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Music,
  AlertTriangle,
  ArrowRight,
} from "@/app/components/somerset/SomersetIcons";
import SomersetHeader from "@/app/components/somerset/SomersetHeader";
import SomersetFooter from "@/app/components/somerset/SomersetFooter";
import SomersetQuoteForm from "@/app/components/somerset/SomersetQuoteForm";

export const metadata: Metadata = {
  title: "Somerset Amphitheater Shuttle | Apple River & Somerset Concert Transportation",
  description:
    "Private group shuttle and concert transportation to Somerset Amphitheater from Minneapolis, St. Paul, and the Twin Cities. High-roof vans and SUVs with guaranteed late-night return rides.",
  alternates: {
    canonical: "https://www.shuttletosomersetamphitheater.com/",
  },
  openGraph: {
    title: "Somerset Amphitheater Shuttle | Apple River & Somerset Concert Transportation",
    description:
      "Private group shuttle and concert transportation to Somerset Amphitheater from Minneapolis, St. Paul, and the Twin Cities. High-roof vans and SUVs with guaranteed late-night return rides.",
    url: "https://www.shuttletosomersetamphitheater.com/",
    type: "website",
  },
};

export const revalidate = 3600;

const UPCOMING_CONCERTS_2026 = [
  {
    date: "Summer 2026",
    title: "Somerset Amphitheater Summer Concert Series",
    genre: "Country & Rock Headliners",
    notes: "Main Stage · Pavilion & GA Lawn · Private Group Pickup Available",
  },
  {
    date: "July 2026",
    title: "St. Croix Valley Summerfest & Live Music Weekend",
    genre: "Multi-Band Outdoor Festival",
    notes: "All-Day Music & Tailgate Staging · Direct Twin Cities Return",
  },
  {
    date: "August 2026",
    title: "Midwest Rock & Roots Festival at Somerset",
    genre: "National Touring Acts",
    notes: "Gates 4:00 PM · Prearranged Charter Drop-Off",
  },
  {
    date: "September 2026",
    title: "End of Summer Country Jam Finale",
    genre: "Country Stars & Regional Support",
    notes: "Tailgate Staging · Post-Concore Priority Departure",
  },
];

const FAQS = [
  {
    q: "What kind of transportation is offered to Somerset Amphitheater?",
    a: "We provide dedicated private group transportation and charters. Your group gets the entire vehicle—either a private 14-passenger high-roof van or a luxury 6-passenger SUV. We do not sell individual bus tickets or force you to ride with strangers. You pick the departure time, pickup address, and ride in comfort.",
  },
  {
    q: "Where do pickups occur in the Twin Cities?",
    a: "We offer full door-to-door pickup across the Minneapolis–St. Paul metropolitan area and the St. Croix Valley. Common pickup points include Downtown Minneapolis, the North Loop, Uptown, Downtown St. Paul, Grand Avenue, Stillwater MN, Hudson WI, Woodbury, Maplewood, and Oakdale.",
  },
  {
    q: "How does the late-night return trip work after the concert?",
    a: "Your dedicated driver stays staged on-site at Somerset Amphitheater throughout the show with your coolers and extra layers locked safely in the vehicle. Immediately following the final encore, your group meets at the designated commercial pickup area near the main gates. There is no waiting for hundreds of drunk passengers to find a bus, and zero risk of being stranded with no Uber drivers available in rural Wisconsin.",
  },
  {
    q: "Is transportation private or shared?",
    a: "Every ride we book is strictly private for your group. You have full control over your itinerary, music, and departure timing. We never combine separate groups into one vehicle.",
  },
  {
    q: "How much does a Somerset Amphitheater shuttle cost?",
    a: "We operate on transparent flat round-trip charter pricing. A private 14-passenger high-roof van typically runs around $500 flat round-trip (which breaks down to roughly $35–$45 per person for a full group). Luxury SUVs for up to 6 guests typically run $375–$425 flat round-trip. We do not charge surge pricing or surprise post-show hourly fees.",
  },
  {
    q: "What happens if a concert is sold out, postponed, or rescheduled?",
    a: "Your transportation reservation is tied directly to the concert event. If the venue or artist reschedules the show due to severe summer weather or unforeseen events, your booking and deposit transfer automatically to the rescheduled concert date at no additional fee.",
  },
  {
    q: "Do you offer Apple River tubing shuttles?",
    a: "No. Apple River tubing shuttles and river return rides are provided directly by local tubing outfitters and campgrounds (such as River’s Edge Campground and Float Rite Park) as part of their tube rental packages. We focus exclusively on private group concert and festival transportation to Somerset Amphitheater.",
  },
  {
    q: "Can we bring coolers, drinks, and tailgate gear?",
    a: "Yes! Because it is a private charter vehicle, your group is welcome to bring coolers, drinks (for guests 21+), lawn chairs, and extra layers. All your gear remains locked and secure in the vehicle with your driver during the show.",
  },
];

export default function SomersetHomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": "https://www.shuttletosomersetamphitheater.com/#business",
        name: "Somerset Amphitheater Shuttle",
        url: "https://www.shuttletosomersetamphitheater.com/",
        telephone: "+1-720-369-6292",
        priceRange: "$$$",
        description:
          "Private group shuttle and concert transportation service connecting the Minneapolis-St. Paul Twin Cities metro with Somerset Amphitheater in Somerset, Wisconsin.",
        areaServed: [
          { "@type": "City", name: "Minneapolis" },
          { "@type": "City", name: "St. Paul" },
          { "@type": "City", name: "Stillwater" },
          { "@type": "City", name: "Hudson" },
          { "@type": "City", name: "Somerset" },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.a,
          },
        })),
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

      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#0e1927] via-[#09111b] to-[#070d14] pt-12 pb-16 sm:pt-16 sm:pb-24">
        {/* Glow ambient background elements */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-[#ff6b35]/15 blur-[120px]" />
        <div className="pointer-events-none absolute top-1/3 right-10 -z-10 h-[350px] w-[350px] rounded-full bg-[#3df3ff]/10 blur-[100px]" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-3 text-xs font-black uppercase tracking-widest text-[#ff6b35]">
            <span className="rounded-full bg-[#ff6b35]/20 px-3.5 py-1 text-[#ff8252] border border-[#ff6b35]/30">
              Private Group Transportation
            </span>
            <span className="text-white/60">·</span>
            <span className="text-[#3df3ff]">Twin Cities ↔ Somerset, WI</span>
          </div>

          <h1 className="mt-4 max-w-4xl text-4xl font-black uppercase tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.05]">
            Somerset Amphitheater Shuttle
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/80 sm:text-xl">
            Skip the 2-hour parking gridlock, dark country roads, and non-existent late-night Uber pickups. Book a private round-trip charter van or SUV for your entire group with an on-site driver who waits through the final encore.
          </p>

          {/* Core Trust & Inclusions Grid */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <Car className="h-5 w-5 text-[#ff6b35]" />
              <div className="mt-2 text-sm font-black uppercase text-white">100% Private</div>
              <p className="text-xs text-white/60 mt-0.5">Your group only &mdash; no stranger delays</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <MapPin className="h-5 w-5 text-[#3df3ff]" />
              <div className="mt-2 text-sm font-black uppercase text-white">Twin Cities Door-to-Door</div>
              <p className="text-xs text-white/60 mt-0.5">Minneapolis, St. Paul, Stillwater, Hudson</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <Users className="h-5 w-5 text-emerald-400" />
              <div className="mt-2 text-sm font-black uppercase text-white">Up to 14 Guests</div>
              <p className="text-xs text-white/60 mt-0.5">High-roof passenger vans &amp; luxury SUVs</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <Clock className="h-5 w-5 text-amber-400" />
              <div className="mt-2 text-sm font-black uppercase text-white">Driver Waits On-Site</div>
              <p className="text-xs text-white/60 mt-0.5">Guaranteed immediate post-show ride</p>
            </div>
          </div>

          {/* Primary Action Row */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#quote"
              className="flex items-center gap-2 rounded-2xl bg-[#ff6b35] px-8 py-4 text-sm font-black uppercase tracking-wider text-white shadow-xl shadow-[#ff6b35]/25 hover:bg-[#ff8252] transition"
            >
              <Calendar className="h-4 w-4" />
              <span>Get Instant Charter Quote</span>
            </a>
            <a
              href="tel:+17203696292"
              className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-6 py-4 text-sm font-black uppercase tracking-wider text-white hover:bg-white/10 transition"
            >
              <Phone className="h-4 w-4 text-[#3df3ff]" />
              <span>Call / Text: (720) 369-6292</span>
            </a>
          </div>
        </div>
      </section>

      {/* FIRST-SCREEN SERVICE SPECIFICATION MATRIX */}
      <section className="border-b border-white/10 bg-[#09111c] py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-black uppercase tracking-widest text-[#3df3ff]">
              Verified Service Specifications
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
              How Somerset Amphitheater Transportation Works
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#0c1624] p-5">
              <h3 className="text-sm font-black uppercase text-[#ff6b35]">1. Service Type</h3>
              <p className="mt-2 text-sm font-bold text-white">Private Prearranged Group Charter</p>
              <p className="mt-1 text-xs text-white/70 leading-5">
                We provide private vehicle charters dedicated exclusively to your party. Not a shared per-seat bus or scheduled city shuttle.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0c1624] p-5">
              <h3 className="text-sm font-black uppercase text-[#3df3ff]">2. Pickups &amp; Coverage</h3>
              <p className="mt-2 text-sm font-bold text-white">Twin Cities Metro &amp; St. Croix Valley</p>
              <p className="mt-1 text-xs text-white/70 leading-5">
                Door-to-door pickup at your home, hotel, or Airbnb in Minneapolis, St. Paul, Stillwater, Hudson WI, Woodbury, or surrounding suburbs.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0c1624] p-5">
              <h3 className="text-sm font-black uppercase text-emerald-400">3. Vehicles &amp; Capacity</h3>
              <p className="mt-2 text-sm font-bold text-white">14-Pax Vans &amp; 6-Pax Luxury SUVs</p>
              <p className="mt-1 text-xs text-white/70 leading-5">
                Clean, modern, air-conditioned high-roof passenger vans (up to 14 guests) and full-size luxury SUVs (up to 6 guests) with luggage/cooler space.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0c1624] p-5">
              <h3 className="text-sm font-black uppercase text-amber-400">4. Pricing &amp; Quotes</h3>
              <p className="mt-2 text-sm font-bold text-white">Transparent Flat Round-Trip Rates</p>
              <p className="mt-1 text-xs text-white/70 leading-5">
                Flat charter pricing (typically ~$500 round-trip for 14-passenger van). No surge pricing, no metered idling charges, no surprise fees.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0c1624] p-5">
              <h3 className="text-sm font-black uppercase text-violet-400">5. Departure Logistics</h3>
              <p className="mt-2 text-sm font-bold text-white">Custom Pickup Time for Your Group</p>
              <p className="mt-1 text-xs text-white/70 leading-5">
                Depart when your crew is ready. Plan early arrival for venue tailgating or time it directly for opening gates. Direct 40–50 min highway drive.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0c1624] p-5">
              <h3 className="text-sm font-black uppercase text-rose-400">6. Return Ride Plan</h3>
              <p className="mt-2 text-sm font-bold text-white">Driver Staged On-Site All Evening</p>
              <p className="mt-1 text-xs text-white/70 leading-5">
                Chauffeur remains parked at the venue. Meet at the designated pickup zone right after the encore for immediate return back to the Twin Cities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* QUOTE FORM SECTION */}
      <section className="py-16 sm:py-20" id="quote">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <SomersetQuoteForm />
        </div>
      </section>

      {/* FLEET & PRICING BREAKDOWN */}
      <section className="border-t border-white/10 bg-[#08101a] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-black uppercase tracking-widest text-[#ff6b35]">
              Vehicle Fleet
            </span>
            <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
              Choose Your Private Concert Ride
            </h2>
            <p className="mt-3 text-sm text-white/70">
              Both vehicle options include door-to-door Twin Cities pickup, an on-site waiting driver, and guaranteed round-trip return.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* 14-PAX VAN */}
            <article className="rounded-3xl border border-white/15 bg-[#0b1422] p-8 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-[#ff6b35]">
                    Groups of 7 to 14
                  </span>
                  <span className="rounded-full bg-[#ff6b35]/20 px-3 py-1 text-xs font-bold text-[#ff8252]">
                    Most Popular
                  </span>
                </div>
                <h3 className="mt-4 text-3xl font-black uppercase text-white">
                  Private High-Roof Passenger Van
                </h3>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white">~$500</span>
                  <span className="text-sm font-bold uppercase text-white/60">flat round-trip</span>
                </div>
                <p className="mt-4 text-sm text-white/75 leading-6">
                  Keep your entire crew together in one comfortable, stand-up high-roof van. Perfect for concert friend groups, festival tailgaters, and bachelorette parties. High ceiling, powerful AC, tinted windows, and rear storage for coolers and lawn chairs.
                </p>
                <div className="mt-6 space-y-2.5 text-xs text-white/80 border-t border-white/10 pt-6">
                  <p>• <strong>Capacity:</strong> Up to 14 guests (~$35–$45/person when split)</p>
                  <p>• <strong>Pickup:</strong> Door-to-door anywhere in the Twin Cities metro</p>
                  <p>• <strong>Staging:</strong> Driver waits parked on-site during the concert</p>
                  <p>• <strong>Coolers &amp; Gear:</strong> Tailgate gear and drinks welcome in the van</p>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-white/10">
                <a
                  href="#quote"
                  className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#ff6b35] px-6 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-[#ff6b35]/20 hover:bg-[#ff8252] transition"
                >
                  Request Private Van Quote
                </a>
              </div>
            </article>

            {/* LUXURY SUV */}
            <article className="rounded-3xl border border-white/15 bg-[#0b1422] p-8 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-[#3df3ff]">
                    Groups of 1 to 6
                  </span>
                  <span className="rounded-full bg-[#3df3ff]/20 px-3 py-1 text-xs font-bold text-[#3df3ff]">
                    Luxury Comfort
                  </span>
                </div>
                <h3 className="mt-4 text-3xl font-black uppercase text-white">
                  Private Luxury SUV
                </h3>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white">$375–$425</span>
                  <span className="text-sm font-bold uppercase text-white/60">flat round-trip</span>
                </div>
                <p className="mt-4 text-sm text-white/75 leading-6">
                  Executive VIP concert travel for smaller groups and couples. Premium leather seating, multi-zone climate control, all-wheel drive, and an experienced professional chauffeur dedicated entirely to your evening.
                </p>
                <div className="mt-6 space-y-2.5 text-xs text-white/80 border-t border-white/10 pt-6">
                  <p>• <strong>Capacity:</strong> Up to 6 guests</p>
                  <p>• <strong>Pickup:</strong> Door-to-door at your home or hotel</p>
                  <p>• <strong>Staging:</strong> Driver waits parked on-site during the concert</p>
                  <p>• <strong>Access:</strong> Priority commercial drop-off and pickup</p>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-white/10">
                <a
                  href="#quote"
                  className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#3df3ff] px-6 text-sm font-black uppercase tracking-wider text-[#07111d] shadow-lg shadow-[#3df3ff]/20 hover:bg-[#62f6ff] transition"
                >
                  Request Private SUV Quote
                </a>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* WHY PRIVATE CHARTER BEATS RIDESHARE & DRIVING */}
      <section className="py-16 sm:py-20 border-t border-white/10 bg-[#070d14]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-black uppercase tracking-widest text-[#3df3ff]">
              The Somerset Logistics Reality
            </span>
            <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
              Why Rideshare Fails at Somerset Amphitheater
            </h2>
            <p className="mt-3 text-sm text-white/70">
              Somerset, Wisconsin is a rural village of 3,000 residents across the state line. Here is why self-driving and apps break down on concert nights:
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-rose-500/25 bg-rose-950/15 p-6">
              <div className="flex items-center gap-3 text-rose-400">
                <XCircle className="h-6 w-6" />
                <h3 className="font-black uppercase text-base text-white">0 Late-Night Ubers</h3>
              </div>
              <p className="mt-4 text-xs leading-6 text-white/75">
                Uber and Lyft drivers will take you east from Minneapolis to Somerset in the afternoon, but <strong className="text-white">zero drivers wait in Somerset at midnight</strong>. Cell towers get overwhelmed by 20,000 fans, and drivers refuse to cross state lines back into Minnesota.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-500/25 bg-amber-950/15 p-6">
              <div className="flex items-center gap-3 text-amber-400">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="font-black uppercase text-base text-white">90-Minute Parking Jams</h3>
              </div>
              <p className="mt-4 text-xs leading-6 text-white/75">
                Somerset Amphitheater parking lots empty onto narrow two-lane country roads (County Road I and WI-35). Leaving general parking frequently takes 90 to 120 minutes of bumper-to-bumper gridlock in dark grass fields.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/15 p-6">
              <div className="flex items-center gap-3 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
                <h3 className="font-black uppercase text-base text-white">The Private Shuttle Win</h3>
              </div>
              <p className="mt-4 text-xs leading-6 text-white/75">
                Your driver is already parked in the dedicated commercial shuttle staging lot. You walk out after the encore, step inside your air-conditioned van, and your driver takes the designated commercial exit bypass directly to the highway.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SOMERSET 2026 CONCERT EVENTS SECTION */}
      <section className="border-t border-white/10 bg-[#09111b] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-[#ff6b35]">
                Concert Calendar
              </span>
              <h2 className="mt-1 text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                Somerset Amphitheater 2026 Concert Events
              </h2>
            </div>
            <a
              href="#quote"
              className="inline-flex items-center gap-2 rounded-xl border border-[#ff6b35]/40 bg-[#ff6b35]/10 px-4 py-2 text-xs font-bold text-[#ff8252] hover:bg-[#ff6b35]/20 transition"
            >
              <span>Request Ride for Any Show</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {UPCOMING_CONCERTS_2026.map((show, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-white/10 bg-[#0c1624] p-6 flex flex-col justify-between hover:border-white/20 transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-[#3df3ff]">
                      {show.date}
                    </span>
                    <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-bold text-white/60 uppercase">
                      Somerset, WI
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-black text-white">{show.title}</h3>
                  <p className="mt-1 text-xs font-semibold text-[#ffb07c]">{show.genre}</p>
                  <p className="mt-3 text-xs text-white/70 leading-5">{show.notes}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-white/50">Private Charter Available</span>
                  <a
                    href="#quote"
                    className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-[#3df3ff] hover:text-[#62f6ff]"
                  >
                    <span>Get Quote</span>
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* APPLE RIVER TUBING CLARIFICATION BANNER */}
      <section className="border-t border-white/10 bg-[#060b12] py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-bold text-amber-300 mb-4">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Looking for Apple River Tubing Shuttles?</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black uppercase text-white">
            Honest Information Regarding Tubing Shuttles
          </h3>
          <p className="mt-3 text-sm text-white/70 leading-6 max-w-2xl mx-auto">
            If you are looking for tubing transportation down the Apple River, that is operated directly on-site by local river outfitters such as <strong className="text-white">River’s Edge Campground</strong> and <strong className="text-white">Float Rite Park</strong>. Their river shuttles take floaters from their exit point back to their parking lots. We do not operate a tubing shuttle—we specialize exclusively in <strong className="text-white">private group concert transportation to Somerset Amphitheater</strong>.
          </p>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <section className="border-t border-white/10 bg-[#08101a] py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-black uppercase tracking-widest text-[#ff6b35]">
              Got Questions?
            </span>
            <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-sm text-white/70">
              Everything you need to know about booking private transportation for Somerset Amphitheater concerts.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <details
                key={idx}
                className="group rounded-2xl border border-white/10 bg-[#0c1624] p-5 transition [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-black uppercase text-sm sm:text-base text-white">
                  <span>{faq.q}</span>
                  <span className="text-[#ff6b35] transition group-open:rotate-45 text-xl">
                    +
                  </span>
                </summary>
                <p className="mt-4 text-xs sm:text-sm leading-6 text-white/75 border-t border-white/10 pt-4">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>

          {/* Direct call box */}
          <div className="mt-12 rounded-2xl border border-[#3df3ff]/30 bg-[#3df3ff]/5 p-6 text-center">
            <h3 className="text-lg font-black uppercase text-white">Have a Specific Question or Route Request?</h3>
            <p className="mt-2 text-xs text-white/70 max-w-lg mx-auto leading-5">
              Talk directly with dispatch. We can accommodate custom multi-stop pickups, festival weekend itineraries, and corporate concert outings.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
              <a
                href="tel:+17203696292"
                className="inline-flex items-center gap-2 rounded-xl bg-[#3df3ff] px-6 py-3 text-xs font-black uppercase text-[#07111d] hover:bg-[#62f6ff] transition"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>Call (720) 369-6292</span>
              </a>
              <a
                href="sms:+17203696292"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-xs font-black uppercase text-white hover:bg-white/10 transition"
              >
                <span>Text Dispatch</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <SomersetFooter />
    </div>
  );
}
