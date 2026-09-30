import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { WNO_OPERATOR_ENTITIES } from "../data/operatorRegistry";
import { RESEARCHED_OPERATORS } from "../data/operatorDirectory";

export const metadata: Metadata = {
  title: "New Orleans Tour Operators | Swamp, Ghost, Food & City Tours",
  description: "Compare New Orleans tour operators, including Cajun Encounters, Haunted History Tours, Cajun Pride, City Sightseeing and Doctor Gumbo, and check booking options in one place.",
  alternates: { canonical: "/operators" },
};

export default function OperatorsPage() {
  const inventoryOperators = Array.from(new Map(WNO_OPERATOR_ENTITIES.map((operator) => [operator.slug, operator])).values());
  const listings = [
    ...inventoryOperators.map((operator) => ({ name: operator.name, href: `/operators/${operator.slug}`, detail: "Explore tours on our site" })),
    { name: "Airboat Adventures", href: "/tours/airboat-adventures", detail: "Explore tours on our site" },
    { name: "NOLA Ghost Riders", href: "/tours/nola-ghost-riders", detail: "Explore tours on our site" },
    ...RESEARCHED_OPERATORS.map((operator) => ({ name: operator.name, href: `/operators/${operator.slug}`, detail: operator.category })),
  ];
  const schema = { "@context": "https://schema.org", "@type": "ItemList", name: "New Orleans tour operator directory", itemListElement: listings.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, url: `https://www.welcometoneworleanstours.com${item.href}` })) };
  return <main className="min-h-screen bg-[#080708] px-6 py-14 text-[#fdfbf7]">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\u003c") }} />
    <div className="mx-auto max-w-6xl">
      <h1 className="font-serif text-4xl md:text-6xl">New Orleans tour operators</h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-white/80">Compare swamp boats, airboats, ghost tours, sightseeing, food walks and kayaking in one place. Choose the experience that fits your group, then check the booking options for that operator.</p>
      <h2 className="mt-12 font-serif text-3xl">Tours available on our site</h2>
      <p className="mt-3 text-white/80">Browse these tour listings and check their booking options. Each reservation follows the selected operator’s terms.</p>
      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{listings.slice(0, inventoryOperators.length + 2).map((item) => <Link key={item.href} href={item.href} className="rounded-lg border border-white/20 p-6 hover:border-[#d4af37] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d4af37]"><h3 className="text-xl font-semibold">{item.name}</h3><p className="mt-3 text-[#d4af37]">{item.detail} →</p></Link>)}</div>
      <h2 className="mt-14 font-serif text-3xl">More tours to book</h2>
      <p className="mt-3 max-w-3xl text-white/80">Explore these operators and book selected experiences through our partner links. Check dates and prices with the booking partner; each tour has its own reservation.</p>
      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{RESEARCHED_OPERATORS.map((operator) => <Link key={operator.slug} href={`/operators/${operator.slug}`} className="rounded-lg border border-white/20 p-6 hover:border-[#d4af37] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d4af37]"><h3 className="text-xl font-semibold">{operator.name}</h3><p className="mt-3 text-white/80">{operator.category}</p><p className="mt-4 text-[#d4af37]">View tours & booking options →</p></Link>)}</div>
      <p className="mt-12 max-w-3xl leading-7 text-white/80">Planning more than one outing? Check the full tour duration, travel between meeting points and return arrangements before reserving. <Link href="/help-me-choose" className="text-[#d4af37] underline">Get help choosing your tours.</Link></p>
    </div>
  </main>;
}
