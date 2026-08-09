import type { Metadata } from "next";
import Link from "next/link";
import { ACTIVE_DINING_PARTNERS, DINING_DISCLOSURE } from "../data/diningPartners";
import { DINING_STAPLES, DINING_STAPLES_DISCLOSURE } from "../data/diningStaples";

export const metadata: Metadata = {
  title: "Where Should We Eat in New Orleans? | New Orleans Concierge Desk",
  description:
    "Get practical New Orleans dining help based on your group, timing, neighborhood, and plans before or after tours and river cruises.",
  keywords: [
    "where to eat in new orleans",
    "new orleans restaurant concierge",
    "new orleans dinner reservations",
    "restaurants near french quarter",
    "new orleans group dinner",
  ],
  alternates: { canonical: "/new-orleans/food" },
};

const diningSituations = [
  "Dinner tonight",
  "Family or mixed-age dinner",
  "Romantic dinner",
  "Large group",
  "Before or after a river cruise",
  "Before a ghost or walking tour",
  "Near the French Quarter",
  "First New Orleans meal",
];

export default function NewOrleansFoodPage() {
  const hasPartners = ACTIVE_DINING_PARTNERS.length > 0;

  return (
    <main className="min-h-screen bg-[#151515] text-[#fdfbf7] px-6 py-16 md:py-24">
      <div className="max-w-5xl mx-auto">
        <p className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.2em] mb-4">
          New Orleans Concierge Desk
        </p>
        <h1 className="font-[var(--font-accent)] text-4xl md:text-6xl font-bold leading-tight mb-6">
          Where should we eat?
        </h1>
        <p className="text-lg md:text-xl text-[#cccccc] max-w-3xl leading-relaxed mb-10">
          Tell us what kind of meal you need and when. We help narrow the choices around your group, neighborhood, schedule, and what you are doing before or after dinner.
        </p>

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12" aria-label="Dining situations">
          {diningSituations.map((situation) => (
            <div key={situation} className="border border-[#2a2a2a] bg-[#1a1a1a] p-5 min-h-[120px] flex items-end">
              <span className="font-bold text-sm leading-snug">{situation}</span>
            </div>
          ))}
        </section>

        <section className="border border-[#2a2a2a] bg-[#1a1a1a] p-7 md:p-9 mb-12">
          <h2 className="font-[var(--font-accent)] text-2xl md:text-3xl font-bold mb-3">
            Need a recommendation now?
          </h2>
          <p className="text-[#cccccc] leading-relaxed mb-6">
            Call or text the concierge desk with your party size, preferred time, neighborhood, and what kind of meal you want. We can help you narrow the options and, where available, coordinate a reservation.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="tel:+15044849687"
              className="inline-flex justify-center bg-[#d4af37] text-[#151515] font-bold px-6 py-4 uppercase tracking-wider text-sm"
            >
              Call 504-484-9687
            </a>
            <a
              href="sms:+15044849687"
              className="inline-flex justify-center border border-[#d4af37] text-[#d4af37] font-bold px-6 py-4 uppercase tracking-wider text-sm"
            >
              Text the Concierge
            </a>
          </div>
        </section>

        <section className="mb-14">
          <div className="mb-6">
            <p className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.18em] mb-2">Independent Editorial Guide</p>
            <h2 className="font-[var(--font-accent)] text-3xl md:text-4xl font-bold mb-3">New Orleans staples</h2>
            <p className="text-[#aaaaaa] max-w-3xl leading-relaxed">
              These are included because they are useful landmarks in New Orleans dining culture—not because they paid us. They remain separate from the Dining Partner program below.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {DINING_STAPLES.map((restaurant) => (
              <article key={restaurant.id} className="border border-[#2a2a2a] bg-[#1a1a1a] p-7 flex flex-col">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="inline-flex border border-[#d4af37] text-[#d4af37] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
                    {restaurant.editorialLabel}
                  </span>
                  <span className="text-xs text-[#888888]">Not sponsored</span>
                </div>
                <h3 className="font-[var(--font-accent)] text-2xl font-bold mb-2">{restaurant.name}</h3>
                <p className="text-sm text-[#aaaaaa] mb-1">{restaurant.neighborhood}</p>
                <p className="text-xs text-[#777777] mb-4">{restaurant.address}</p>
                <p className="text-[#cccccc] text-sm leading-relaxed mb-4">{restaurant.whyItMatters}</p>
                <p className="text-sm text-[#bbbbbb] mb-4">
                  <strong className="text-[#fdfbf7]">Good fit:</strong> {restaurant.fitTags.join(" · ")}
                </p>
                <p className="text-sm text-[#aaaaaa] leading-relaxed mb-5">
                  <strong className="text-[#fdfbf7]">Planning note:</strong> {restaurant.reservationNote}
                </p>
                <div className="mt-auto">
                  <a
                    href={restaurant.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex text-[#d4af37] font-bold text-sm underline underline-offset-4 mb-4"
                  >
                    Visit official restaurant site
                  </a>
                  <p className="text-[11px] text-[#777777] leading-relaxed">{DINING_STAPLES_DISCLOSURE}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-12 border-t border-[#2a2a2a] pt-12">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <p className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.18em] mb-2">Dining Partners</p>
              <h2 className="font-[var(--font-accent)] text-2xl md:text-3xl font-bold">Participating restaurants</h2>
              <p className="text-[#aaaaaa] max-w-3xl mt-3 leading-relaxed">
                Paid partner status is always disclosed. A restaurant does not have to be a partner to appear in our independent dining guidance.
              </p>
            </div>
          </div>

          {hasPartners ? (
            <div className="grid md:grid-cols-2 gap-5">
              {ACTIVE_DINING_PARTNERS.map((partner) => (
                <article key={partner.id} className="border border-[#2a2a2a] bg-[#1a1a1a] p-7">
                  <div className="inline-flex border border-[#d4af37] text-[#d4af37] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest mb-3">
                    Dining Partner
                  </div>
                  <h3 className="font-[var(--font-accent)] text-2xl font-bold mb-2">{partner.name}</h3>
                  <p className="text-sm text-[#aaaaaa] mb-3">{partner.neighborhood}</p>
                  <p className="text-sm text-[#cccccc] leading-relaxed mb-4">
                    Good fit for: {partner.fitTags.join(", ")}.
                  </p>
                  <p className="text-[11px] text-[#aaaaaa] leading-relaxed">{partner.disclosure || DINING_DISCLOSURE}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-[#3a3a3a] bg-[#181818] p-7 md:p-9">
              <h3 className="font-bold text-lg mb-2">No paid Dining Partners yet.</h3>
              <p className="text-[#aaaaaa] leading-relaxed max-w-3xl">
                We will not label a restaurant as a Dining Partner until an actual agreement exists. The free New Orleans staples above remain available regardless.
              </p>
            </div>
          )}
        </section>

        <section className="border-t border-[#2a2a2a] pt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <h2 className="font-[var(--font-accent)] text-2xl font-bold mb-2">Own or manage a restaurant?</h2>
            <p className="text-[#aaaaaa] max-w-2xl">
              Our pilot dining-partner program has no upfront listing fee. Participating restaurants pay for confirmed seated guests we refer.
            </p>
          </div>
          <Link
            href="/new-orleans/restaurant-partners"
            className="inline-flex justify-center border border-[#d4af37] text-[#d4af37] font-bold px-6 py-4 uppercase tracking-wider text-sm whitespace-nowrap"
          >
            Restaurant Partner Program
          </Link>
        </section>
      </div>
    </main>
  );
}
