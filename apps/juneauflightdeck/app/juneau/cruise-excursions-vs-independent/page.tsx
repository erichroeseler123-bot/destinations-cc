import type { Metadata } from "next";
import Link from "next/link";
import HelicopterWaitlistForm from "../../components/HelicopterWaitlistForm";

export const metadata: Metadata = {
  title: "Booking Independent vs. Cruise Ship Helicopter Tours in Juneau | Full Guide",
  description:
    "Compare independent and cruise-line Juneau helicopter bookings using current prices, operator terms, pickup details, and realistic return-to-ship planning.",
  alternates: {
    canonical: "https://juneauflightdeck.com/juneau/cruise-excursions-vs-independent",
  },
  openGraph: {
    title: "Cruise Ship Excursion Desk vs. Independent Helicopter Booking in Juneau",
    description:
      "Compare current checkout totals, pickup instructions, cancellation policies, and return-to-ship protections before choosing a Juneau helicopter tour.",
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
        text: "Do not assume the ship will wait for an independently booked tour. Confirm the operator's pickup and return plan, build a practical buffer before your ship's all-aboard time, and look for an explicit return-to-ship policy on the exact listing. Viator's Worry-free policy applies only to marked products and has eligibility requirements.",
      },
    },
    {
      "@type": "Question",
      name: "Do cruise ships use different helicopter companies than independent travelers?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Cruise lines and independent channels may sell excursions operated by the same named local providers, including TEMSCO, Coastal Helicopters, and NorthStar Trekking. Do not assume two listings are identical: compare the operator, duration, glacier, transfers, cancellation terms, and final checkout total.",
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
        text: "Cruise-line bookings and independent bookings are different contracts. A cruise line may offer simpler onboard support, while an independent listing may offer a different price, schedule, or cancellation policy. Compare the exact written terms instead of relying on a general claim from either channel.",
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
            pickup details, cancellation terms, and return-to-ship planning.
          </p>
        </div>

        {/* The Core Truth Highlight */}
        <div className="p-6 md:p-8 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 mb-10">
          <h2 className="text-xl font-bold text-white mb-2">The Key Comparison Most Cruise Passengers Miss</h2>
          <p className="text-sm md:text-base leading-relaxed text-amber-100">
            Cruise and independent channels may list tours from the same named Juneau operators.
            That does not prove the products are identical. Compare the exact operator, glacier,
            duration, transfer, cancellation policy, return protection, and final checkout total.
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
                  <td>Varies by line, sailing, and age category</td>
                  <td><strong className="text-emerald-400">Use the dated operator checkout total</strong></td>
                </tr>
                <tr>
                  <td><strong>Glacier Dog Sledding Price</strong></td>
                  <td>Varies by line, sailing, and age category</td>
                  <td><strong className="text-emerald-400">Use the dated operator checkout total</strong></td>
                </tr>
                <tr>
                  <td><strong>Who Actually Flies the Tour?</strong></td>
                  <td>Named supplier on the cruise listing</td>
                  <td>Named supplier on the operator listing</td>
                </tr>
                <tr>
                  <td><strong>When Seats Show Sold Out</strong></td>
                  <td>Marked &ldquo;SOLD OUT&rdquo; — no waitlist</td>
                  <td><strong className="text-amber-400">Check other operator calendars or request an alert</strong></td>
                </tr>
                <tr>
                  <td><strong>Pier Pickup &amp; Return</strong></td>
                  <td>Follow the cruise voucher</td>
                  <td>Follow the operator confirmation</td>
                </tr>
                <tr>
                  <td><strong>Port Return Buffer</strong></td>
                  <td>Varies by group size</td>
                  <td>Choose a departure with a practical buffer</td>
                </tr>
                <tr>
                  <td><strong>Weather Cancellation</strong></td>
                  <td>Controlled by the cruise-line terms</td>
                  <td>Controlled by the operator or marketplace terms</td>
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
            Planning Honestly for &ldquo;Will the Ship Leave Without Me?&rdquo;
          </h2>
          <div className="space-y-4 text-slate-300 text-sm md:text-base leading-relaxed">
            <p>
              A ship may choose to hold for a delayed ship-sponsored group, but travelers should
              not assume it will wait for an independent booking. Use written terms and a realistic
              timing plan:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-200">
              <li>
                <strong>Confirm the transfer:</strong> Meeting points and transfer times vary by
                operator and dock. Use the pickup instructions on your confirmation.
              </li>
              <li>
                <strong>Build your own buffer:</strong> Calculate from all-aboard time, not scheduled
                departure, and include the return shuttle and dock-security time.
              </li>
              <li>
                <strong>Read the exact protection:</strong> A marketplace guarantee applies only
                when the listing expressly includes it and you meet its conditions. It is not a
                universal protection for every independent tour.
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
            A cruise line, direct operator, and marketplace can display different inventory.
            A ship listing marked sold out therefore does not prove every Juneau operator calendar
            is sold out. Check the exact direct calendars for your date, or request an availability
            alert. A seat exists only when a booking provider confirms it.
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
                Contact the booking provider or operator immediately. Whether the departure can be
                moved—and whether a refund applies—depends on available capacity and the terms on
                your confirmation. Do not assume the time changes automatically.
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
