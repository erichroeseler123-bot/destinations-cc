import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import HelicopterWaitlistForm from "../components/HelicopterWaitlistForm";
import SeatScannerTicker from "../components/SeatScannerTicker";
import LiveSeatDropsBadge from "../components/LiveSeatDropsBadge";

export const metadata: Metadata = {
  title: "Juneau Helicopter Dog Sledding on Glacier | Availability Assistance",
  description:
    "The ultimate Alaska cruise excursion: fly by helicopter to a glacier dog sled camp on Herbert or Norris Glacier. Sold out on your ship? Request help checking availability. The operator confirms seats and reservations.",
  alternates: { canonical: "https://juneauflightdeck.com/juneau-dogsled-helicopter-tours" },
  openGraph: {
    title: "Juneau Helicopter Dog Sledding on Glacier | Availability Assistance",
    description:
      "Fly to a remote glacier camp and mush with Alaskan huskies. Availability assistance for sold-out cruise dates. The operator confirms reservations.",
    url: "https://juneauflightdeck.com/juneau-dogsled-helicopter-tours",
    type: "website",
  },
};

const dogSledFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Why is helicopter glacier dog sledding in Juneau almost always sold out?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Glacier dog sledding camps on Herbert and Norris glaciers operate in a fragile alpine snowpack zone strictly regulated by US Forest Service special-use permits. Because daily flight slots and active dog teams are strictly capped across operators to protect animal welfare and alpine terrain, daily capacity across all ships is limited. As a result, peak summer dates frequently book out months in advance.",
      },
    },
    {
      "@type": "Question",
      name: "How can I request help if dog sledding is sold out?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Request help checking helicopter tour availability for your port date and party size. Availability and reservations are confirmed by the operator.",
      },
    },
    {
      "@type": "Question",
      name: "When does the Juneau glacier dog sledding season operate?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The snow camp season typically opens between May 10th and May 18th and runs through mid-to-late August. As late summer temperatures rise and the high snowpack turns to blue glacier ice, the dog camps are airlifted back to their winter training kennels. Standard glacier landing tours on ice continue through late September.",
      },
    },
    {
      "@type": "Question",
      name: "What gear is provided for the glacier dog sledding tour?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The tour operator provides specialized glacier overboots that pull directly over your sneakers or hiking shoes to keep your feet dry and warm on the snow. You should wear warm layers, a waterproof outer jacket, sunglasses (snow glare is intense on sunny days), and gloves.",
      },
    },
    {
      "@type": "Question",
      name: "Are there weight limits for helicopter dog sledding in Juneau?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. In accordance with FAA regulations, passenger and gear weight must be balanced on all helicopters. Guests weighing 250 lbs or more (fully clothed) may be required to pay a surcharge for an adjacent empty seat to ensure proper weight and balance. All guests are discreetly weighed at the heliport before boarding.",
      },
    },
  ],
};

export default function JuneauDogSleddingPage() {
  return (
    <main className="page-shell py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dogSledFaqJsonLd) }}
      />

      <div className="site-shell max-w-5xl mx-auto px-4">
        <SeatScannerTicker />

        <div className="text-center max-w-3xl mx-auto mb-10">
          <p className="eyebrow">The Crown Jewel of Alaska Shore Excursions</p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">
            Juneau Helicopter Glacier Dog Sledding
          </h1>
          <p className="text-lg md:text-xl text-slate-300 leading-relaxed">
            Fly by helicopter across the Juneau Icefield to an authentic snowfield dog camp.
            Mush with real Alaskan sled dogs and Iditarod veterans.
            Request help checking helicopter tour availability for your port date and party size. Availability and reservations are confirmed by the operator.
          </p>
        </div>

        {/* Hero Image Showcase */}
        <div className="rounded-3xl overflow-hidden border border-white/10 mb-8 shadow-2xl relative">
          <Image
            src="https://cdn.filestackcontent.com/mjmYVT8aSPiQ6M0h9hb5"
            alt="Alaskan husky dog sled team on glacier snowfield in Juneau"
            width={1600}
            height={900}
            priority
            className="w-full h-80 md:h-[450px] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-6 md:p-10">
            <div>
              <span className="bg-amber-500/90 text-slate-950 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                High Demand · Books Out 4-6 Months Ahead
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Herbert Glacier &amp; Norris Glacier Alpine Camps
              </h2>
            </div>
          </div>
        </div>

        {/* Official Viator Partner Seasonal Status Card */}
        <div
          id="waitlist"
          style={{
            background: "linear-gradient(180deg, rgba(8, 28, 42, 0.95) 0%, rgba(5, 18, 28, 0.98) 100%)",
            border: "1px solid var(--line, rgba(151, 211, 255, 0.2))",
            borderRadius: "var(--radius-lg, 24px)",
            padding: "26px 30px",
            marginBottom: "36px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
          }}
        >
          <div style={{ maxWidth: 580 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: "0.75rem",
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--accent, #f0b35b)",
                marginBottom: 6,
              }}
            >
              <span>Official Viator Partner</span>
              <span>·</span>
              <span>Herbert &amp; Norris Glacier Camps</span>
            </div>
            <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text, #ffffff)", margin: "0 0 8px" }}>
              Compare &amp; Book Glacier Dog Sledding Excursions
            </h3>
            <p style={{ margin: "0 0 10px", fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.55 }}>
              Dog sled camps operate mid-May through August across Herbert Glacier (TEMSCO from $659, Coastal from $709) and Norris Glacier (NorthStar from $739). Daily capacity is strictly regulated by the US Forest Service. Check real-time dates below via our official Viator partner search or operator direct booking.
            </p>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ice, #9ed9ff)", fontWeight: 600 }}>
              Request help checking helicopter tour availability for your port date and party size. Availability and reservations are confirmed by the operator.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
            <a
              href="https://www.viator.com/searchResults/all?text=Juneau+glacier+dog+sledding&pid=P00058396&mcid=42383&medium=api"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-primary"
              style={{ padding: "12px 22px", fontSize: "0.92rem", whiteSpace: "nowrap" }}
            >
              Check Dog Sledding on Viator &rarr;
            </a>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <a
                href="https://fareharbor.com/embeds/book/temscoair-juneau/items/214810/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-card"
                style={{ fontSize: "0.78rem", padding: "6px 10px", whiteSpace: "nowrap" }}
              >
                TEMSCO ($659) ↗
              </a>
              <a
                href="https://coastalhelicopters.com/tours/dog-sled-tours/"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-card"
                style={{ fontSize: "0.78rem", padding: "6px 10px", whiteSpace: "nowrap" }}
              >
                Coastal ($709) ↗
              </a>
              <a
                href="https://fareharbor.com/embeds/book/northstartrekking/items/115991/?ref=juneauflightdeck&asn=welcometoalaskatours&full_items=yes"
                target="_blank"
                rel="noopener noreferrer"
                className="button button-card"
                style={{ fontSize: "0.78rem", padding: "6px 10px", whiteSpace: "nowrap" }}
              >
                NorthStar ($739) ↗
              </a>
            </div>
            <a
              href="#waitlist-form"
              style={{ fontSize: "0.78rem", color: "var(--accent, #f0b35b)", fontWeight: 700, textDecoration: "none" }}
            >
              Sold out? Request Availability Help &darr;
            </a>
          </div>
        </div>

        {/* Dedicated Intake Form Preset to Dog Sledding */}
        <section className="mb-14">
          <div className="mb-6">
            <LiveSeatDropsBadge showLink={false} />
          </div>
          <HelicopterWaitlistForm compact={false} defaultPort="juneau" />
        </section>

        {/* What to Expect Breakdown */}
        <section className="section-block p-8 md:p-12 mb-12">
          <div className="section-heading mb-8">
            <p className="eyebrow">The Experience</p>
            <h2 className="text-2xl md:text-4xl font-bold text-white">
              What Happens on a Glacier Dog Sledding Tour
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-amber-400 font-black text-xl mb-2 block">Stage 1 · The Flight</span>
              <h3 className="text-lg font-bold text-white mb-2">Aerial Icefield Transit</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Lift off from Juneau Airport and soar over lush coastal rainforest, cascading waterfalls, and the massive crevasses of the Juneau Icefield before landing at ~3,500 ft elevation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-amber-400 font-black text-xl mb-2 block">Stage 2 · Dog Camp</span>
              <h3 className="text-lg font-bold text-white mb-2">Meet the Iditarod Huskies</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Step into an active dog mushing camp where 100+ Alaskan huskies live for the summer. Meet veteran mushers, pet the dogs, and see how puppies are trained for winter racing.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-amber-400 font-black text-xl mb-2 block">Stage 3 · The Run</span>
              <h3 className="text-lg font-bold text-white mb-2">Glacier Sled Run</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Take the runner standing behind the musher or relax in the sled basket as a 12-dog team pulls you across a 2-mile circuit of pristine glacier snowfields.
              </p>
            </div>
          </div>
        </section>

        {/* Key Tour Specifications Table */}
        <section className="section-block p-8 md:p-12 mb-12">
          <div className="section-heading mb-6">
            <p className="eyebrow">Tour Details</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Helicopter Dog Sledding Specifications
            </h2>
          </div>

          <div className="seo-table-container">
            <table className="seo-matrix-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Tour Details</th>
                  <th>Cruise Passenger Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Total Tour Duration</strong></td>
                  <td>2.75 to 3.25 hours (Dock to Dock)</td>
                  <td>Requires at least a 5.5 hour port call window for safe margin</td>
                </tr>
                <tr>
                  <td><strong>Flight Time</strong></td>
                  <td>~30 minutes total (15 min each way)</td>
                  <td>Spectacular views of Herbert or Norris Glaciers</td>
                </tr>
                <tr>
                  <td><strong>Time on Snow Camp</strong></td>
                  <td>Approximately 1 hour</td>
                  <td>Includes sled ride, puppy socializing, and photo ops</td>
                </tr>
                <tr>
                  <td><strong>Operating Season</strong></td>
                  <td>Mid-May to mid-to-late August</td>
                  <td>Not available in September due to summer snow melt</td>
                </tr>
                <tr>
                  <td><strong>Direct Operator Price</strong></td>
                  <td>From $659 (TEMSCO) · $709 (Coastal) · $739 (NorthStar)</td>
                  <td>Ship excursion desks frequently charge $795 – $925+</td>
                </tr>
                <tr>
                  <td><strong>Weather Policy</strong></td>
                  <td>100% full refund if grounded</td>
                  <td>Fog or low cloud ceiling grounds flights safely</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQs */}
        <section className="section-block p-8 md:p-12 mb-16">
          <div className="section-heading mb-6">
            <p className="eyebrow">Dog Sledding FAQs</p>
            <h2 className="text-2xl md:text-4xl font-bold text-white">
              Questions About Glacier Dog Sledding
            </h2>
          </div>

          <div className="faq-block">
            <div className="faq-item">
              <h3>What if our ship arrives after the morning dog sled flights?</h3>
              <p>
                Operators run continuous departures throughout the day starting at 8:30 AM through 5:30 PM. Afternoon flights are ideal for ships docking around 1:00 PM (such as Princess and Holland America).
              </p>
            </div>

            <div className="faq-item">
              <h3>Can young children or seniors participate?</h3>
              <p>
                Yes. Dog sledding is very accessible. Guests sit securely in a padded sled basket while the musher stands on the runners behind. Walking from the helicopter landing pad to the sleds is less than 50 yards on packed snow.
              </p>
            </div>

            <div className="faq-item">
              <h3>What if the dogsled tour is completely booked and no cancellations occur?</h3>
              <p>
                If dog sledding is unavailable, you can ask about glacier landing alternatives. Availability, pricing, and reservations are confirmed by the operator.
              </p>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link href="/" className="button button-secondary">
              ← Back to Juneau Flight Deck Home
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
