import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "New Orleans Swamp Tours Without a Car: What Actually Works",
  description:
    "Compare transported and self-drive New Orleans swamp tours if you do not have a car, including meeting points, timing, rideshare limitations, ages and current published prices.",
  alternates: { canonical: "/guides/new-orleans-swamp-tour-without-a-car" },
};

const transported = [
  {
    name: "Swamp & Bayou Tour",
    price: "$65 adult / $32 child",
    age: "All ages",
    duration: "3 hours 45 minutes listed",
    format: "Covered/custom pontoon boat",
    href: "/tours/swamp-bayou-tour",
  },
  {
    name: "Large Airboat Swamp Adventure",
    price: "$90 listed",
    age: "Ages 5+",
    duration: "3 hours 45 minutes listed",
    format: "15–27 passenger airboat",
    href: "/tours/large-airboat-swamp-adventure",
  },
  {
    name: "Small Airboat Swamp Adventure",
    price: "$119 listed",
    age: "Ages 5+",
    duration: "3 hours 45 minutes listed",
    format: "6–12 passenger airboat",
    href: "/tours/small-airboat-swamp-adventure",
  },
];

export default function SwampTourWithoutCarGuide() {
  return (
    <article className="min-h-screen bg-[#151515] text-[#fdfbf7]">
      <header className="border-b border-[#2a2a2a] bg-[#101010] px-6 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d4af37]">No-car decision guide</p>
          <h1 className="mt-4 max-w-4xl font-[var(--font-accent)] text-4xl font-bold leading-tight md:text-6xl">Can you do a New Orleans swamp tour without a car?</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[#ccc]">Yes. The simplest option is usually a swamp tour that includes round-trip transportation from its New Orleans meeting point. For the Gray Line options checked here, that meeting point is <strong className="text-white">400 Toulouse Street</strong> in the French Quarter — not hotel pickup.</p>
          <p className="mt-5 text-xs uppercase tracking-[0.16em] text-[#888]">Operator facts last checked August 9, 2026</p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-14 px-6 py-12 md:py-16">
        <section className="border-l-4 border-[#d4af37] bg-[#1b1b1b] p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">Best answer for most car-free visitors</p>
          <p className="mt-3 text-xl leading-relaxed">Choose the transported version if you are staying in or near the French Quarter and do not want to solve the final ride into Lafitte yourself. Walk, streetcar, taxi or rideshare to the downtown meeting point, then let the tour operator handle the swamp transfer.</p>
        </section>

        <section>
          <h2 className="font-[var(--font-accent)] text-3xl font-bold">Three transported swamp options</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-[#bbb]">These current Gray Line listings all meet at 400 Toulouse Street and include round-trip transportation. Prices can change, so confirm the checkout price before purchase.</p>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {transported.map((tour) => (
              <div key={tour.name} className="border border-[#333] bg-[#1a1a1a] p-6">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#d4af37]">{tour.price}</p>
                <h3 className="mt-3 text-xl font-bold">{tour.name}</h3>
                <p className="mt-3 text-sm text-[#aaa]">{tour.age}</p>
                <p className="mt-2 text-sm text-[#aaa]">{tour.duration}</p>
                <p className="mt-2 text-sm text-[#aaa]">{tour.format}</p>
                <Link href={tour.href} className="mt-5 inline-block text-sm font-bold text-[#d4af37] underline underline-offset-4">View tour →</Link>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-[var(--font-accent)] text-3xl font-bold">Why self-drive is different</h2>
          <div className="mt-5 space-y-4 leading-relaxed text-[#ccc]">
            <p>The self-drive Gray Line swamp listings meet at <strong className="text-white">5145 Fleming Road in Lafitte</strong>. They list about <strong className="text-white">1 hour 30 minutes</strong> for the swamp experience itself and ask guests to arrive 15–30 minutes before departure.</p>
            <p>The operator specifically warns that Lyft and Uber do not service the Lafitte location. That makes a self-drive ticket a poor default choice if you have no car, even though the ticket price is lower.</p>
            <p>Do not treat the difference between a 3-hour-45-minute transported listing and a 1-hour-30-minute self-drive listing as an exact amount of time “saved.” One includes the transportation portion and one does not; your own drive, parking, check-in and traffic still consume time.</p>
          </div>
        </section>

        <section className="overflow-x-auto">
          <h2 className="font-[var(--font-accent)] text-3xl font-bold">Transported vs self-drive at a glance</h2>
          <table className="mt-6 w-full min-w-[680px] border-collapse text-left text-sm">
            <thead><tr className="border-b border-[#444] text-[#d4af37]"><th className="p-3">Question</th><th className="p-3">Transportation included</th><th className="p-3">Self-drive</th></tr></thead>
            <tbody className="text-[#ccc]">
              <tr className="border-b border-[#333]"><td className="p-3 font-bold text-white">Where do you meet?</td><td className="p-3">400 Toulouse Street</td><td className="p-3">5145 Fleming Road, Lafitte</td></tr>
              <tr className="border-b border-[#333]"><td className="p-3 font-bold text-white">Need your own car?</td><td className="p-3">No</td><td className="p-3">Practically, yes</td></tr>
              <tr className="border-b border-[#333]"><td className="p-3 font-bold text-white">Parking?</td><td className="p-3">Not needed at swamp launch</td><td className="p-3">Free parking listed</td></tr>
              <tr className="border-b border-[#333]"><td className="p-3 font-bold text-white">Rideshare to launch?</td><td className="p-3">Not needed</td><td className="p-3">Operator says Lyft/Uber do not service the area</td></tr>
              <tr><td className="p-3 font-bold text-white">Best fit</td><td className="p-3">Visitors without a car</td><td className="p-3">Visitors with their own vehicle who want more schedule control</td></tr>
            </tbody>
          </table>
        </section>

        <section className="border border-[#333] bg-[#181818] p-6 md:p-8">
          <h2 className="font-[var(--font-accent)] text-2xl font-bold">One important distinction</h2>
          <p className="mt-4 leading-relaxed text-[#ccc]">“Transportation included” does not automatically mean “hotel pickup.” The Gray Line products cited on this page currently use a central French Quarter meeting point at 400 Toulouse Street. Other operators may use different pickup systems, so check the exact product before assuming your hotel is included.</p>
        </section>

        <section className="border-t border-[#333] pt-8">
          <h2 className="text-lg font-bold">Official sources checked</h2>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <a className="text-[#d4af37] underline underline-offset-4" target="_blank" rel="noopener noreferrer" href="https://www.graylineneworleans.com/swamp-tours/swamp-bayou-tour/">Swamp & Bayou</a>
            <a className="text-[#d4af37] underline underline-offset-4" target="_blank" rel="noopener noreferrer" href="https://www.graylineneworleans.com/swamp-tours/small-airboat-swamp-adventure-tour/">Small transported airboat</a>
            <a className="text-[#d4af37] underline underline-offset-4" target="_blank" rel="noopener noreferrer" href="https://www.graylineneworleans.com/swamp-tours/large-airboat-swamp-adventure/">Large transported airboat</a>
            <a className="text-[#d4af37] underline underline-offset-4" target="_blank" rel="noopener noreferrer" href="https://www.graylineneworleans.com/swamp-tours/self-drive-flat-boat-swamp-cruise-no-transportation/">Self-drive flat boat</a>
          </div>
        </section>

        <nav className="border-t border-[#2a2a2a] pt-8 text-sm flex flex-wrap gap-5">
          <Link href="/compare/swamp-tour-with-vs-without-transportation" className="text-[#d4af37] underline underline-offset-4">Compare transportation vs self-drive</Link>
          <Link href="/compare/covered-swamp-boat-vs-airboat" className="text-[#d4af37] underline underline-offset-4">Covered boat vs airboat</Link>
          <Link href="/compare/small-vs-large-airboat" className="text-[#d4af37] underline underline-offset-4">Small vs large airboat</Link>
        </nav>
      </div>
    </article>
  );
}
