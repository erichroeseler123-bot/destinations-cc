import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getSeoPageBySlug } from "../../data/pageMap";
import { getProductById } from "../../data/index";
import WnoBreadcrumbs from "../../components/WnoBreadcrumbs";
import { buildSeoMetadata } from "../../lib/buildSeoMetadata";

export default async function CategoryPage({ params }: { params: Promise<{ categorySlug: string }> }) {
  const resolvedParams = await params;
  const record = getSeoPageBySlug(resolvedParams.categorySlug);
  if (!record || record.status === "draft" || record.variant !== "category") {
    notFound();
  }

  const products = record.liveProductIds.map((id) => getProductById(id)).filter(Boolean);

  return (
    <div className="min-h-screen bg-[#0b0a09] text-[#f8f1e5]">
      <WnoBreadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "New Orleans Experiences", path: "/tours" },
          { name: record.heroTitle, path: record.publicRoute },
        ]}
      />

      <header className="border-b border-[#342b1d] bg-[#11100d] px-6 py-14 text-center md:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#c9a86a]">
            {record.heroEyebrow || "Curated New Orleans experiences"}
          </p>
          <h1 className="mt-4 font-serif text-4xl leading-tight text-[#f3dfb3] md:text-6xl">{record.heroTitle}</h1>
          {record.heroSubtitle && <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-[#b7ad9e]">{record.heroSubtitle}</p>}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#options" className="bg-[#c9a86a] px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-[#17130c]">See our picks</a>
            <Link href="/help-me-choose" className="border border-[#c9a86a] px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-[#f3dfb3]">Help Me Choose</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-[min(1120px,calc(100%-2rem))] py-12 md:py-16">
        {record.openingAnswer && (
          <section className="mx-auto max-w-3xl text-center">
            <p className="font-serif text-xl leading-9 text-[#eadfca] md:text-2xl">{record.openingAnswer}</p>
          </section>
        )}

        {(record.whoItIsFor || record.decisionFactors.length > 0) && (
          <section className="mt-12 grid gap-5 md:grid-cols-2">
            {record.whoItIsFor && (
              <div className="border border-[#342b1d] bg-[#12110e] p-6 md:p-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c9a86a]">Concierge note</p>
                <h2 className="mt-2 font-serif text-2xl text-[#f3dfb3]">Who this tends to fit</h2>
                <p className="mt-4 leading-7 text-[#b7ad9e]">{record.whoItIsFor}</p>
              </div>
            )}
            {record.decisionFactors.length > 0 && (
              <div className="border border-[#342b1d] bg-[#12110e] p-6 md:p-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c9a86a]">What to think about</p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-[#b7ad9e]">
                  {record.decisionFactors.slice(0, 5).map((factor, index) => <li key={index}>• {factor}</li>)}
                </ul>
              </div>
            )}
          </section>
        )}

        <section id="options" className="mt-16 scroll-mt-24">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c9a86a]">Curated options</p>
            <h2 className="mt-2 font-serif text-3xl text-[#f3dfb3] md:text-4xl">Where we’d start</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#9d9587]">You do not need to sort an operator catalog. Start with the experiences that fit this kind of day, then check the live booking option when you are ready.</p>
          </div>

          {products.length > 0 ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Link key={product!.id} href={`/tours/${product!.slug}`} className="group border border-[#342b1d] bg-[#12110e] p-6 transition hover:border-[#c9a86a]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c9a86a]">Our pick in this category</p>
                  <h3 className="mt-3 font-serif text-2xl leading-tight text-[#f3dfb3]">{product!.title}</h3>
                  {product!.description && <p className="mt-3 text-sm leading-6 text-[#aaa193]">{product!.description}</p>}
                  <span className="mt-5 inline-block text-xs font-bold uppercase tracking-[0.15em] text-[#c9a86a]">See Availability →</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mx-auto mt-8 max-w-2xl border border-[#342b1d] bg-[#12110e] p-7 text-center">
              <p className="text-[#aaa193]">We do not have a confirmed bookable option in this category yet. Use the chooser and we’ll point you toward the closest current fit.</p>
              <Link href="/help-me-choose" className="mt-5 inline-block text-xs font-bold uppercase tracking-[0.15em] text-[#c9a86a]">Help Me Choose →</Link>
            </div>
          )}
        </section>

        {(record.planningConsiderations || record.transportationNotes) && (
          <section className="mx-auto mt-14 max-w-3xl border-y border-[#342b1d] py-7 text-sm leading-7 text-[#9d9587]">
            {record.planningConsiderations && <p>{record.planningConsiderations}</p>}
            {record.transportationNotes && <p className="mt-3">{record.transportationNotes}</p>}
          </section>
        )}

        {record.faqs && record.faqs.length > 0 && (
          <section className="mx-auto mt-14 max-w-3xl">
            <h2 className="text-center font-serif text-3xl text-[#f3dfb3]">A few useful answers</h2>
            <div className="mt-6 space-y-3">
              {record.faqs.map((faq, index) => (
                <details key={index} className="border border-[#342b1d] bg-[#12110e] p-5">
                  <summary className="cursor-pointer font-semibold text-[#eadfca]">{faq.question}</summary>
                  <p className="mt-3 text-sm leading-6 text-[#aaa193]">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <div className="mt-14 text-center">
          <Link href="/help-me-choose" className="inline-block bg-[#c9a86a] px-7 py-4 text-xs font-bold uppercase tracking-[0.15em] text-[#17130c]">Not sure? Help Me Choose</Link>
        </div>
      </main>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug?: string; categorySlug?: string; comparisonSlug?: string }> }): Promise<Metadata> {
  const p = await params;
  let slugToLookup = "";
  if (p.categorySlug && p.comparisonSlug) slugToLookup = `${p.categorySlug}/${p.comparisonSlug}`;
  else slugToLookup = p.comparisonSlug || p.slug || p.categorySlug || "";

  const record = getSeoPageBySlug(slugToLookup);
  if (!record) return notFound();
  return buildSeoMetadata(record);
}
