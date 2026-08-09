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

        <section className="grid gap-6 md:grid-cols-2">
          <div className="border border-[#333] bg-[#1a1a1a] p-6">
            <h2 className="font-[var(--font-accent)] text-2xl font-bold">Transportation is usually the better fit if…</h2>
            <ul className="mt-5 space-y-3 text-[#ccc]">
              <li>✓ You are staying in the French Quarter or downtown without a car.</li>
              <li>✓ You want one meeting point and fewer logistics to manage.</li>
              <li>✓ You do not want to worry about driving, directions or parking.</li>
              <li>✓ A longer fixed tour block is acceptable.</li>
            </ul>
            <Link href="/tours/swamp-bayou-tour" className="mt-7 inline-block bg-[#d4af37] px-5 py-3 text-sm font-bold uppercase tracking-wider text-[#151515]">View transported swamp tour</Link>
          </div>
          <div className="border border-[#333] bg-[#1a1a1a] p-6">
            <h2 className="font-[var(--font-accent)] text-2xl font-bold">Self drive is usually the better fit if…</h2>
            <ul className="mt-5 space-y-3 text-[#ccc]">
              <li>✓ You already have a rental car.</li>
              <li>✓ You want to control your departure after the boat ride.</li>
              <li>✓ You are comfortable driving to Lafitte yourself.</li>
              <li>✓ You understand that ride-share is not a reliable fallback at the swamp.</li>
            </ul>
            <Link href="/swamp-tours" className="mt-7 inline-block border border-[#d4af37] px-5 py-3 text-sm font-bold uppercase tracking-wider text-[#d4af37]">Compare swamp tour formats</Link>
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
