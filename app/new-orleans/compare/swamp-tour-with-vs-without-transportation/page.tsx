import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "New Orleans Swamp Tour With Transportation vs Self Drive",
  description:
    "Compare New Orleans swamp tours with round-trip transportation against self-drive options, including total tour time, check-in, parking and ride-share limitations.",
  alternates: { canonical: "/compare/swamp-tour-with-vs-without-transportation" },
};

const checked = "August 9, 2026";

export default function SwampTransportationComparisonPage() {
  return (
    <article className="min-h-screen bg-[#151515] text-[#fdfbf7]">
      <header className="border-b border-[#2a2a2a] bg-[#101010] px-6 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d4af37]">New Orleans tour decision guide</p>
          <h1 className="mt-4 max-w-4xl font-[var(--font-accent)] text-4xl font-bold leading-tight md:text-6xl">Swamp tour with transportation vs driving yourself</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[#ccc]">The biggest difference is not the swamp itself. It is how much of your day you want the operator to manage for you. Current Gray Line options show about 3 hours 45 minutes for comparable tours with round-trip transportation versus about 1 hour 30 minutes for self-drive tour listings, before you add your own drive and check-in time.</p>
          <p className="mt-5 text-xs uppercase tracking-[0.16em] text-[#888]">Facts last checked {checked}</p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-14 px-6 py-12 md:py-16">
        <section className="border-l-4 border-[#d4af37] bg-[#1b1b1b] p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Short answer</p>
          <p className="mt-3 text-xl leading-relaxed">Choose transportation if you are staying in or near the French Quarter and want the simplest day. Self-drive can give you more control over your schedule and a shorter operator-listed tour block, but you need a car, you must reach Lafitte yourself, and the operator specifically warns that Lyft and Uber do not service the swamp location.</p>
        </section>

        <section>
          <h2 className="font-[var(--font-accent)] text-3xl font-bold">What actually changes?</h2>
          <div className="mt-6 overflow-hidden border border-[#333]">
            <div className="grid grid-cols-[0.8fr_1fr_1fr] bg-[#1b1b1b] text-sm font-bold">
              <div className="border-r border-[#333] p-4 text-[#aaa]">Decision</div>
              <div className="border-r border-[#333] p-4 text-[#d4af37]">Transportation included</div>
              <div className="p-4 text-[#d4af37]">Self drive</div>
            </div>
            {[
              ["Operator-listed duration", "About 3 hr 45 min for current Gray Line swamp/airboat tours with round-trip transportation.", "About 1 hr 30 min for current self-drive flat boat and airboat listings, plus your own driving and check-in time."],
              ["Where you start", "400 Toulouse St. at the Steamboat NATCHEZ dock for the current Gray Line transported tours.", "5145 Fleming Road, Lafitte, Louisiana."],
              ["Check-in", "Operator asks guests to present the voucher 15 minutes before tour time at the Toulouse Street ticket office.", "Operator asks guests to arrive at the swamp 15–30 minutes before tour time."],
              ["Parking", "You do not need to drive to the swamp for the transported option.", "Free parking is listed on site at the swamp."],
              ["Ride share", "Not needed for the swamp leg once you reach the departure point.", "Gray Line says Lyft and Uber do not service the swamp area."],
              ["Schedule control", "More of the timetable is controlled by the tour transportation schedule.", "You control when you drive there and leave after the tour, subject to your booked start time."],
            ].map(([label, left, right]) => (
              <div key={label} className="grid grid-cols-[0.8fr_1fr_1fr] border-t border-[#2a2a2a] text-sm leading-relaxed">
                <div className="border-r border-[#2a2a2a] bg-[#181818] p-4 font-bold text-[#ddd]">{label}</div>
                <div className="border-r border-[#2a2a2a] p-4 text-[#ccc]">{left}</div>
                <div className="p-4 text-[#ccc]">{right}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="flex flex-col justify-between border-2 border-[#d4af37] bg-[#1a1a1a] shadow-xl overflow-hidden">
            <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-[#333] bg-[#121212]">
              <img
                src="/images/travel-markets/new-orleans/hotel-pickup-swamp-boat.png"
                alt="Coach transportation departing for New Orleans swamp tour"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent opacity-80" />
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">Gray Line New Orleans</span>
                <span className="rounded bg-[#d4af37]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#d4af37] border border-[#d4af37]/40">
                  French Quarter Coach
                </span>
              </div>
              <h2 className="mt-3 font-[var(--font-accent)] text-2xl font-bold text-[#fdfbf7]">Central Coach Departure (400 Toulouse St)</h2>
              <ul className="mt-4 space-y-2.5 text-sm text-[#ccc]">
                <li>✓ Departs centrally from 400 Toulouse St at the Steamboat NATCHEZ dock.</li>
                <li>✓ Direct nonstop motorcoach transfer to the swamp dock (approx. 40–45 min).</li>
                <li>✓ Predictable schedule: no multi-hotel pickup loops or waiting in hotel lobbies.</li>
                <li>✓ Total duration: approximately 3 hours 45 minutes door-to-door.</li>
              </ul>
              <p className="mt-4 text-xs text-[#aaa]">
                <strong className="text-white">Pricing:</strong> $65 adult / $32 child (Covered Boat) • $90 (Large Airboat) • $119 (Small Airboat)
              </p>
            </div>
            <div className="p-6 pt-0">
              <div className="pt-4 border-t border-[#333]">
                <Link
                  href="/tours/swamp-bayou-tour?src=wtonot-compare-swamp"
                  data-wno-event="booking_button_clicked"
                  data-wno-label="Check Gray Line Coach Dates"
                  data-wno-product="swamp-bayou-tour"
                  className="block w-full text-center bg-[#d4af37] px-5 py-3.5 text-sm font-bold uppercase tracking-wider text-[#151515] transition hover:bg-[#fff8eb]"
                >
                  Check Gray Line Coach Dates →
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between border-2 border-[#d4af37] bg-[#1a1a1a] shadow-xl overflow-hidden">
            <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-[#333] bg-[#121212]">
              <img
                src="/images/travel-markets/new-orleans/hotel-pickup-airboat.png"
                alt="Hotel pickup shuttle for New Orleans airboat tour"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent opacity-80" />
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37]">Ragin Cajun Tours</span>
                <span className="rounded bg-[#d4af37]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#d4af37] border border-[#d4af37]/40">
                  Hotel Pickup Shuttle
                </span>
              </div>
              <h2 className="mt-3 font-[var(--font-accent)] text-2xl font-bold text-[#fdfbf7]">Door-to-Door Hotel Pickup</h2>
              <ul className="mt-4 space-y-2.5 text-sm text-[#ccc]">
                <li>✓ Shuttle picks you up directly at select downtown and French Quarter hotels.</li>
                <li>✓ Select your specific hotel during online checkout.</li>
                <li>✓ Driver confirms your pickup window prior to departure.</li>
                <li>✓ Great for travelers who want zero transit planning from their hotel.</li>
              </ul>
              <p className="mt-4 text-xs text-[#aaa]">
                <strong className="text-white">Pricing:</strong> From $60 per adult with round-trip hotel pickup (Covered Boat) • $90–$120 (Airboat)
              </p>
            </div>
            <div className="p-6 pt-0">
              <div className="pt-4 border-t border-[#333]">
                <Link
                  href="/tours/covered-tour-boat?src=wtonot-detail-covered"
                  data-wno-event="booking_button_clicked"
                  data-wno-label="Check Hotel Pickup Dates"
                  data-wno-product="covered-tour-boat"
                  className="block w-full text-center bg-[#d4af37] px-5 py-3.5 text-sm font-bold uppercase tracking-wider text-[#151515] transition hover:bg-[#fff8eb]"
                >
                  Check Hotel Pickup Dates →
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between border-2 border-[#555] bg-[#1a1a1a] shadow-xl overflow-hidden">
            <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-[#333] bg-[#121212]">
              <img
                src="/images/travel-markets/new-orleans/covered-boat-swamp.png"
                alt="Swamp tour boat at the bayou dock for self-drive visitors"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent opacity-80" />
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#aaa]">Self-Drive</span>
                <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#ccc] border border-white/20">
                  Meet at Swamp Dock
                </span>
              </div>
              <h2 className="mt-3 font-[var(--font-accent)] text-2xl font-bold text-[#fdfbf7]">Drive Yourself (Rental or Personal Car)</h2>
              <ul className="mt-4 space-y-2.5 text-sm text-[#ccc]">
                <li>✓ You drive to the swamp dock in Lafitte, LA (~35–45 min south of New Orleans).</li>
                <li>✓ Free on-site parking at the dock; arrive 15–30 min before departure.</li>
                <li>✓ Maximum schedule freedom after the boat ride concludes.</li>
                <li>⚠️ <strong>Rideshare warning:</strong> Uber/Lyft will take you to Lafitte, but return rides are not reliably available from the swamp.</li>
              </ul>
              <p className="mt-4 text-xs text-[#aaa]">
                <strong className="text-white">Pricing:</strong> From $35 per adult self-drive (Covered Boat) • From $65 (Airboat)
              </p>
            </div>
            <div className="p-6 pt-0">
              <div className="pt-4 border-t border-[#333]">
                <Link
                  href="/tours/covered-tour-boat?src=wtonot-detail-covered"
                  data-wno-event="booking_button_clicked"
                  data-wno-label="Check Self-Drive Dates"
                  data-wno-product="covered-tour-boat"
                  className="block w-full text-center border border-[#d4af37] bg-transparent px-5 py-3.5 text-sm font-bold uppercase tracking-wider text-[#d4af37] transition hover:bg-[#d4af37] hover:text-[#151515]"
                >
                  Check Self-Drive Dates →
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-[var(--font-accent)] text-3xl font-bold">The time-saving question</h2>
          <p className="mt-5 max-w-3xl leading-relaxed text-[#ccc]">A self-drive listing looks dramatically shorter because the operator is only counting the swamp experience, not your travel from New Orleans. That does not mean the entire outing is only 90 minutes. You still need to drive to Lafitte, arrive 15–30 minutes early, take the tour and drive back. The transported option bundles those travel legs into the published 3-hour-45-minute block.</p>
        </section>

        <section className="border-t border-[#333] pt-8">
          <h2 className="text-lg font-bold">Sources checked</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#aaa]">We use current operator-published details rather than estimating transportation logistics. Schedules and operating details can change, so confirm the final departure instructions at checkout.</p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <a href="https://www.graylineneworleans.com/swamp-tours/self-drive-flat-boat-swamp-cruise-no-transportation/" target="_blank" rel="noopener noreferrer" className="text-[#d4af37] underline underline-offset-4">Gray Line self-drive flat boat</a>
            <a href="https://www.graylineneworleans.com/swamp-tours/small-airboat-swamp-adventure-tour/" target="_blank" rel="noopener noreferrer" className="text-[#d4af37] underline underline-offset-4">Gray Line transported small airboat</a>
            <a href="https://www.graylineneworleans.com/swamp-tours/large-airboat-swamp-adventure/" target="_blank" rel="noopener noreferrer" className="text-[#d4af37] underline underline-offset-4">Gray Line transported large airboat</a>
          </div>
        </section>

        <nav className="border-t border-[#2a2a2a] pt-8 text-sm flex flex-wrap gap-5">
          <Link href="/compare" className="text-[#d4af37] underline underline-offset-4">See all tour comparisons</Link>
          <Link href="/compare/covered-swamp-boat-vs-airboat" className="text-[#d4af37] underline underline-offset-4">Covered boat vs airboat</Link>
          <Link href="/compare/small-vs-large-airboat" className="text-[#d4af37] underline underline-offset-4">Small vs large airboat</Link>
        </nav>
      </div>
    </article>
  );
}
