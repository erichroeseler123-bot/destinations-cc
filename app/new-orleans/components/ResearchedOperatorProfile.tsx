import React from "react";
import Link from "next/link";
import { getOperatorBooking, type ResearchedOperator } from "../data/operatorDirectory";
import OperatorIdentityMark from "./OperatorIdentityMark";

export default function ResearchedOperatorProfile({ operator }: { operator: ResearchedOperator }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${operator.name} tours`,
    itemListElement: operator.products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: product.title,
      url: product.viatorUrl,
    })),
  };

  return (
    <div data-wno-surface="directory-warm" className="min-h-screen bg-[#faf6ee] px-6 py-14 text-[#1e1915]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
      />
      <div className="mx-auto max-w-4xl">
        <Link href="/operators" className="text-sm font-semibold text-[#163828] underline">
          All tour operators
        </Link>
        <div className="mt-6 flex items-center gap-3">
          <OperatorIdentityMark name={operator.name} size="md" variant="on-light" />
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8a6220]">
            {operator.category}
          </p>
        </div>
        <h1 className="mt-3 font-serif text-4xl md:text-6xl font-bold text-[#163828]">
          {operator.name}
        </h1>
        <p className="mt-6 text-lg leading-8 text-[#4a4138]">{operator.summary}</p>
        <h2 className="mt-10 font-serif text-3xl font-bold text-[#163828]">Before you book</h2>
        <ul className="mt-5 list-disc space-y-3 pl-6 leading-7 text-[#4a4138]">
          {operator.planningNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
        <section className="mt-10">
          <h2 className="font-serif text-3xl font-bold text-[#163828]">Choose your tour</h2>
          <p className="mt-4 leading-7 text-[#4a4138]">
            Check current dates, prices and booking terms for your selected tour. Reservations are
            completed through the booking partner shown below.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {operator.products.map((product) => {
              const booking = getOperatorBooking(product, operator.slug);
              return (
                <article
                  key={product.viatorUrl}
                  className="rounded-2xl border border-[#1e1915]/12 bg-[#fffdf9] p-6"
                >
                  <h3 className="font-serif text-xl font-bold text-[#163828]">{product.title}</h3>
                  <p className="mt-3 leading-7 text-[#4a4138]">{product.description}</p>
                  <a
                    href={booking.url}
                    rel="sponsored noopener"
                    className="wno-dir-primary-btn mt-5 inline-block rounded-full bg-[#163828] px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#faf6ee]"
                  >
                    Check dates &amp; prices on {booking.provider} →
                  </a>
                </article>
              );
            })}
          </div>
          <p className="mt-5 text-sm leading-6 text-[#4a4138]">
            We may earn a commission when you book through these links. Each reservation has its
            own confirmation and booking terms.{" "}
            <Link href="/how-we-choose" className="font-semibold text-[#163828] underline">
              How we choose tours.
            </Link>
          </p>
        </section>
        <p className="mt-7 text-sm leading-6 text-[#4a4138]">
          Source:{" "}
          <a href={operator.officialUrl} className="font-semibold text-[#163828] underline">
            operator’s official website
          </a>
          . Reviewed September 30, 2026. Welcome to New Orleans Tours helps you compare and book
          tours; the named operator provides the experience.
        </p>
        <p className="mt-8 leading-7 text-[#4a4138]">
          Compare with{" "}
          <Link href="/tours" className="font-semibold text-[#163828] underline">
            other New Orleans tours
          </Link>
          , or{" "}
          <Link href="/help-me-choose" className="font-semibold text-[#163828] underline">
            get help fitting an outing into your plans
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
