import React from "react";
import Link from "next/link";
import { getOperatorBooking, type ResearchedOperator } from "../data/operatorDirectory";

export default function ResearchedOperatorProfile({ operator }: { operator: ResearchedOperator }) {
  const schema = {
    "@context": "https://schema.org", "@type": "ItemList", name: `${operator.name} tours`,
    itemListElement: operator.products.map((product, index) => ({ "@type": "ListItem", position: index + 1, name: product.title, url: product.viatorUrl })),
  };
  return <main className="min-h-screen bg-[#080708] px-6 py-14 text-[#fdfbf7]">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <div className="mx-auto max-w-4xl">
      <Link href="/operators" className="text-[#d4af37] underline">All tour operators</Link>
      <p className="mt-8 text-sm text-[#d4af37]">{operator.category}</p>
      <h1 className="mt-3 font-serif text-4xl md:text-6xl">{operator.name}</h1>
      <p className="mt-6 text-lg leading-8 text-white/80">{operator.summary}</p>
      <h2 className="mt-10 font-serif text-3xl">Before you book</h2>
      <ul className="mt-5 list-disc space-y-4 pl-6 leading-7 text-white/80">{operator.planningNotes.map((note) => <li key={note}>{note}</li>)}</ul>
      <section className="mt-10">
        <h2 className="font-serif text-3xl">Choose your tour</h2>
        <p className="mt-4 leading-7 text-white/80">Check current dates, prices and booking terms for your selected tour. Reservations are completed through the booking partner shown below.</p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">{operator.products.map((product) => {
          const booking = getOperatorBooking(product, operator.slug);
          return <article key={product.viatorUrl} className="rounded-lg border border-[#d4af37]/40 p-6">
            <h3 className="text-xl font-semibold">{product.title}</h3>
            <p className="mt-4 leading-7 text-white/80">{product.description}</p>
            <a href={booking.url} rel="sponsored noopener" className="mt-6 inline-block rounded bg-[#d4af37] px-6 py-3 font-semibold text-[#080708] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Check dates &amp; prices on {booking.provider} →</a>
          </article>;
        })}</div>
        <p className="mt-5 text-sm leading-6 text-white/70">We may earn a commission when you book through these links. Each reservation has its own confirmation and booking terms. <Link href="/how-we-choose" className="underline">How we choose tours.</Link></p>
      </section>
      <p className="mt-7 text-sm leading-6 text-white/70">Source: <a href={operator.officialUrl} className="underline">operator’s official website</a>. Reviewed September 30, 2026. Welcome to New Orleans Tours helps you compare and book tours; the named operator provides the experience.</p>
      <p className="mt-8 leading-7 text-white/80">Compare with <Link href="/tours" className="text-[#d4af37] underline">other New Orleans tours</Link>, or <Link href="/help-me-choose" className="text-[#d4af37] underline">get help fitting an outing into your plans</Link>.</p>
    </div>
  </main>;
}
