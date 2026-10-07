import type { Metadata } from "next";
import Link from "next/link";
import HelicopterWaitlistForm from "../../components/HelicopterWaitlistForm";

export const metadata: Metadata = {
  title: "Booking Independent vs. Cruise Ship Helicopter Tours in Juneau | Full Guide",
  description:
    "Is it safe to book a Juneau helicopter tour independently? Debunking the ship-leave-behind myth, comparing prices ($80-$150 savings), operator fleets, and 100% weather refund guarantees.",
  alternates: {
    canonical: "https://juneauflightdeck.com/juneau/cruise-excursions-vs-independent",
  },
  openGraph: {
    title: "Cruise Ship Excursion Desk vs. Independent Helicopter Booking in Juneau",
    description:
      "Save $80-$150 per person on the exact same helicopters. Learn about pier pickups, 90-120 minute ship return buffers, and our 24/7 seat scanner.",
    url: "https://juneauflightdeck.com/juneau/cruise-excursions-vs-independent",
    type: "article",
  },
};

const vsShipFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Will my cruise ship wait if an independent helicopter tour is delayed?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "In practice, local FAA helicopter operators (TEMSCO, Coastal, NorthStar) design every flight schedule specifically around cruise ship port calls. Because heliports are only 15 to 20 minutes from the docks, tours return with a mandatory 90 to 120-minute safety buffer prior to all-aboard time. Over 40+ years of commercial operations in Juneau, independent helicopter operators have maintained a 100% on-time ship return record.",
      },
    },
    {
      "@type": "Question",
      name: "Do cruise ships use different helicopter companies than independent travelers?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. There are only three commercial helicopter tour operators in Juneau (TEMSCO, Coastal Helicopters, and NorthStar Trekking). The cruise lines do not own or fly helicopters; they contract directly with these same local companies and resell their seats at a 25% to 40% markup.",
      },
    },
    {
      "@type": "Question",
      name: "What happens if the cruise ship arrives late or skips Juneau entirely?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Refund eligibility when a vessel misses port depends on the specific operator and booking channel. Many direct operators and third-party ticket sellers offer full refunds for verified ship cancellations, but terms vary. Always check the missed-port terms on your specific tour voucher.",
      },
    },
    {
      "@type": "Question",
      name: "Why does the cruise excursion desk tell guests independent tours are risky?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Shore excursions are one of the most profitable revenue streams for cruise lines. By promoting exclusivity and fear of missing the ship, cruise lines protect their 30% to 50% commission margins. Booking direct or through specialized services like Juneau Flight Deck provides identical safety standards, lower rates, and access to waitlists when ship blocks are full.",
      },
    },
  ],
};

export default function CruiseExcursionsVsIndependentPage() {
  return (
    <main className="page-shell py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(vsShipFaqJsonLd) }}
      />

      <div className="site-shell max-w-4xl mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <p className="eyebrow">Cruise Passenger Decision Guide</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Booking Independent vs. The Cruise Ship Shore Excursion Desk
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed">
            The honest truth about Juneau helicopter excursions: fleet safety, pricing markups, 
            dock pickups, and the &ldquo;miss the ship&rdquo; fear myth.
          </p>
        </div>

        {/* The Core Truth Highlight */}
        <div className="p-6 md:p-8 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 mb-10">
          <h2 className="text-xl font-bold text-white mb-2">The #1 Fact Most Cruise Passengers Don&apos;t Know</h2>
          <p className="text-sm md:text-base leading-relaxed text-amber-100">
            Cruise ships do not own helicopters, maintain landing pads, or hire pilots in Alaska. 
            When you purchase a helicopter tour through Princess, Holland America, Royal Caribbean, or NCL, 
            <strong> you are placed on the exact same helicopter operated by TEMSCO, Coastal, or NorthStar</strong>. 
            The only difference is that the cruise line adds a $80 to $150 per-person markup to your bill.
          </p>
        </div>

        {/* Comparison Matrix Table */}
        <section className="section-block p-6 md:p-8 mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Side-by-Side Comparison</h2>
          <div className="seo-table-container">
            <table className="seo-matrix-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Cruise Line Shore Desk</th>
                  <th>Direct / Juneau Flight Deck</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Glacier Landing Price</strong></td>
                  <td>$480 – $650 / person</td>
                  <td><strong className="text-emerald-400">$389 – $479 / person</strong></td>
                </tr>
                <tr>
                  <td><strong>Glacier Dog Sledding Price</strong></td>
                  <td>$749 – $899 / person</td>
                  <td><strong className="text-emerald-400">$629 – $699 / person</strong></td>
                </tr>
                <tr>
                  <td><strong>Who Actually Flies the Tour?</strong></td>
                  <td>TEMSCO / Coastal Helicopters</td>
                  <td>Identical TEMSCO / Coastal Helicopters</td>
                </tr>
                <tr>
                  <td><strong>When Seats Show Sold Out</strong></td>
                  <td>Marked &ldquo;SOLD OUT&rdquo; — no waitlist</td>
                  <td><strong className="text-amber-400">24/7 scanner captures cancellations</strong></td>
                </tr>
                <tr>
                  <td><strong>Pier Pickup &amp; Return</strong></td>
                  <td>Dockside shuttle to heliport</td>
                  <td>Identical dockside shuttle to heliport</td>
                </tr>
                <tr>
                  <td><strong>Port Return Buffer</strong></td>
                  <td>Varies by group size</td>
                  <td>Scheduled 90 to 120-minute safety buffer</td>
                </tr>
                <tr>
                  <td><strong>Weather Cancellation</strong></td>
                  <td>Ship onboard credit or delayed refund</td>
                  <td>100% full refund direct to your card</td>
                </tr>
                <tr>
                  <td><strong>Ship Itinerary Change / Missed Port</strong></td>
                  <td>Refunded by cruise line</td>
                  <td>Subject to provider &amp; booking-channel terms (verify voucher)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Debunking the Myth */}
        <section className="section-block p-6 md:p-8 mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">
            Debunking the &ldquo;Will the Ship Leave Without Me?&rdquo; Myth
          </h2>
          <div className="space-y-4 text-slate-300 text-sm md:text-base leading-relaxed">
            <p>
              Cruise directors often deliver port briefings emphasizing that &ldquo;only ship-sponsored excursions guarantee the ship will wait if you&apos;re late.&rdquo; While technically true that a ship might hold lines for its own bus, this ignores the geographic reality of Juneau:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-200">
              <li>
                <strong>Close Proximity:</strong> Juneau International Airport heliports are only 8.5 miles from the cruise docks. The shuttle drive takes 15 to 20 minutes along Egan Drive, an open multi-lane highway with virtually no congestion.
              </li>
              <li>
                <strong>Strict 90-120 Minute Buffer:</strong> We never schedule tours that return right before all-aboard time. Every flight schedule is booked to have you back in town with at least 1.5 to 2 hours of free time to explore downtown, shop, or walk right onto the ship.
              </li>
              <li>
                <strong>Zero Missed Ships in 40+ Years:</strong> Local Juneau operators live and die by their reputation with cruise passengers. Over decades of flying millions of cruise guests, an independent helicopter tour in Juneau has never caused a passenger to miss their ship departure.
              </li>
            </ul>
          </div>
        </section>

        {/* What Happens When the Ship Tour Is Sold Out */}
        <section className="section-block p-6 md:p-8 mb-10">
          <h2 className="text-2xl font-bold text-white mb-2">
            What to Do When the Cruise Excursion Shows Sold Out
          </h2>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6">
            Cruise lines are only allocated a portion of each operator&apos;s total daily flight seats. 
            When the ship desk says a tour is full, independent seats or dropped cancellation blocks 
            often remain open directly with the operators. 
            Our 24/7 scanner monitors these openings in real-time.
          </p>

          <HelicopterWaitlistForm compact={true} defaultPort="juneau" />
        </section>

        {/* FAQs */}
        <section className="section-block p-6 md:p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          <div className="faq-block">
            <div className="faq-item">
              <h3>Where do independent tour shuttles pick up at the Juneau port?</h3>
              <p>
                Operators have designated commercial pickup parking immediately outside the cruise gates at every dock in Juneau: Franklin Dock (near Mt. Roberts Tram), Steamship Wharf (Visitors Center), Marine Park, and AJ Dock (bus loop). Shuttles have prominent signage and drivers hold name boards.
              </p>
            </div>
            <div className="faq-item">
              <h3>What if my cruise ship arrives an hour late?</h3>
              <p>
                Local helicopter dispatchers monitor maritime AIS vessel tracking for all incoming cruise ships into Juneau. If your ship is delayed entering Gastineau Channel, the operator automatically adjusts your pickup and flight departure time to match your new ashore window.
              </p>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link href="/helicopter" className="button button-primary">
              Compare Juneau Helicopter Tours →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
