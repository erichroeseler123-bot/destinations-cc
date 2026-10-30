import Link from "next/link";
import JsonLd from "@/app/components/dcc/JsonLd";
import FactualErrorReportForm from "@/app/components/dcc/FactualErrorReportForm";
import type { OperatorManifest } from "@/lib/dcc/operators";
import { buildBreadcrumbJsonLd, buildOperatorJsonLd } from "@/lib/dcc/jsonld";
import { appendViatorAttribution } from "@/lib/viator/links";

export default function SeasonalOperatorPage({ operator }: { operator: OperatorManifest }) {
  const listings = operator.publicListings || [];
  const path = `/operators/${operator.slug}`;
  return (
    <main className="min-h-screen bg-[#070b10] text-white" data-operator-guide={operator.slug}>
      <JsonLd data={{ "@context": "https://schema.org", "@graph": [
        buildOperatorJsonLd({ path, name: operator.name, city: operator.city, website: operator.website, areasServed: operator.areasServed }),
        buildBreadcrumbJsonLd([{ name: "Home", item: "/" }, { name: "Operators", item: "/operators" }, { name: operator.name, item: path }]),
      ] }} />
      <div className="mx-auto max-w-6xl space-y-12 px-5 py-10 sm:px-8 sm:py-16">
        <Link href="/operators#seasonal-operators" className="text-sm text-cyan-200 hover:underline">← Explore operators</Link>
        <header className="rounded-3xl border border-white/15 bg-gradient-to-br from-cyan-950/70 via-slate-950 to-slate-900 p-7 sm:p-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-200">{operator.city} · Operator guide</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">{operator.name}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">{operator.overview}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {operator.specialties?.map((s) => <span key={s} className="rounded-full border border-white/20 px-3 py-1.5 text-sm text-slate-200">{s}</span>)}
          </div>
          <a href={operator.website} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex rounded-xl bg-cyan-200 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-100">Visit the official operator website ↗</a>
          <p className="mt-4 text-sm text-slate-300">Independent DCC reference page. A listing here does not imply an operator partnership or a confirmed reservation.</p>
        </header>

        <section aria-labelledby="planning-heading">
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-200">Before you choose</p>
          <h2 id="planning-heading" className="mt-2 text-3xl font-bold">Make the experience fit your day</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {operator.planningNotes?.map((note, i) => <article key={note.title} className="rounded-2xl border border-white/15 bg-white/[0.03] p-6">
              <span className="text-sm font-semibold text-cyan-200">0{i + 1}</span>
              <h3 className="mt-3 text-lg font-bold">{note.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{note.text}</p>
            </article>)}
          </div>
        </section>

        {listings.length > 0 ? <section aria-labelledby="tour-heading">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-200">Selected marketplace listings</p>
            <h2 id="tour-heading" className="mt-2 text-3xl font-bold">Explore tours with {operator.name}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">These public Viator pages named this operator when checked. This is a selected list, not a complete catalog or a live availability check. Choose your date on Viator to confirm the current total and booking conditions.</p>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {listings.map((tour) => <article key={tour.code} className="flex flex-col rounded-2xl border border-white/15 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8" data-product-code={tour.code}>
              <p className="text-sm text-cyan-200">{tour.durationText ? `About ${tour.durationText}` : "Confirm duration with the provider"}</p>
              <h3 className="mt-3 text-xl font-bold leading-8">{tour.title}</h3>
              <p className="mt-4 text-sm leading-6 text-slate-300">Listed supplier: {tour.supplierName}</p>
              <p className="mt-2 text-xs text-slate-400">Public listing checked {tour.checkedAt} · Product {tour.code}</p>
              <a href={appendViatorAttribution(tour.canonicalUrl, { medium: "link", campaign: `dcc-operator-${operator.slug}` })} target="_blank" rel="sponsored noopener noreferrer" className="mt-6 inline-flex justify-center rounded-xl bg-amber-200 px-5 py-3 text-center text-sm font-bold text-slate-950 hover:bg-amber-100">View dates and prices on Viator ↗</a>
              <p className="mt-3 text-xs leading-5 text-slate-400">DCC may earn an affiliate commission. Suitability is independent of that commission.</p>
            </article>)}
          </div>
        </section> : <section className="rounded-2xl border border-white/15 p-6" aria-labelledby="official-booking-heading">
          <h2 id="official-booking-heading" className="text-2xl font-bold">Check the operator’s current experiences</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">We have not established a matching Viator supplier listing for this operator. Use the official website to confirm current tours, dates, inclusions and prices.</p>
          <a href={operator.website} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block font-semibold text-cyan-200 underline underline-offset-4">Explore official booking options ↗</a>
        </section>}

        <section className="grid gap-6 rounded-2xl border border-white/15 p-6 sm:p-8 md:grid-cols-2" aria-labelledby="comparison-heading">
          <div><h2 id="comparison-heading" className="text-2xl font-bold">Compare the whole offer</h2><p className="mt-3 text-sm leading-7 text-slate-300">Match the date, departure, passenger categories and currency. Check mandatory charges, transport, meals and cancellation terms before comparing totals.</p></div>
          <div><h3 className="text-lg font-bold">A price still needs a date</h3><p className="mt-3 text-sm leading-7 text-slate-300">No dated, like-for-like price comparison has been established on this page. We do not show a savings claim or assume that a price difference is commission.</p></div>
        </section>

        <section aria-labelledby="sources-heading" className="space-y-4">
          <h2 id="sources-heading" className="text-xl font-bold">Sources and coverage</h2>
          <ul className="space-y-3 text-sm text-slate-300">{operator.sources?.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" className="text-cyan-200 underline underline-offset-4">{source.label} ↗</a><span className="ml-2">Checked {source.checkedAt}</span></li>)}</ul>
          <p className="max-w-3xl text-sm leading-7 text-slate-400">Tour links above are dated public-listing checks. Partner API catalog status, exact departure availability and traveler-specific suitability are not established by those checks. Official operator restrictions and current booking terms still apply.</p>
        </section>

        <details className="rounded-2xl border border-white/15 p-6">
          <summary className="cursor-pointer text-lg font-semibold">Suggest a factual correction</summary>
          <p className="my-4 text-sm leading-7 text-slate-300">Corrections are welcome whether or not the operator has a commercial agreement with DCC. Reports enter the existing review queue before published facts change.</p>
          <FactualErrorReportForm defaultPagePath={path} compact />
        </details>

        <aside className="rounded-2xl border border-cyan-300/25 bg-cyan-950/15 p-6 sm:p-8" aria-labelledby="operator-heading">
          <p className="text-sm font-semibold text-cyan-200">For the {operator.name} team</p>
          <h2 id="operator-heading" className="mt-2 text-2xl font-bold">Review your page or discuss a direct connection</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">DCC offers an optional API-only partnership at a proposed 10% commission on completed direct bookings we generate. Payment processing is separate and must be agreed upfront. Direct sales require operator authorization, provider-approved access, signed terms and a verified integration; they are not enabled by this page.</p>
          <Link href={`/operators/onboarding?operator=${encodeURIComponent(operator.slug)}`} className="mt-5 inline-flex rounded-xl border border-cyan-200/50 px-5 py-3 text-sm font-semibold text-cyan-100 hover:bg-cyan-900/30">Discuss an API partnership →</Link>
        </aside>
      </div>
    </main>
  );
}
