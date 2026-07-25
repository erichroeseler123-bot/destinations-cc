import React from 'react';
import Link from 'next/link';
import type { SeoPageRecord } from '../data/types';
import { getProductById } from '../data/index';
import ProductCard from './ProductCard';
import ComparisonMatrix from './ComparisonMatrix';
import SwampRideComparison from './SwampRideComparison';
import JsonLd from '@/app/components/dcc/JsonLd';
import { generateCategorySchemaGraph } from '../lib/schema';
import { SEO_PAGES } from '../data/pages';

export default function SeoPageRenderer({ page }: { page: SeoPageRecord }) {
  const products = page.liveProductIds.map(id => getProductById(id)).filter(Boolean);
  const relatedPages = (page.relatedPageIds || []).map(id => SEO_PAGES[id]).filter(Boolean);

  const renderHero = () => (
    <header className="p-8 md:p-16 lg:p-24 text-center border-b border-[#2a2a2a] bg-[#1a1a1a]">
      <div className="max-w-3xl mx-auto">
        {page.heroEyebrow && <span className="block text-xs font-bold uppercase tracking-widest mb-4 text-[#d4af37]">{page.heroEyebrow}</span>}
        <h1 className="text-4xl md:text-5xl font-serif mb-6 leading-tight text-[#fdfbf7]">{page.heroTitle}</h1>
        {page.heroSubtitle && <p className="text-xl font-light text-[#aaaaaa]">{page.heroSubtitle}</p>}
      </div>
    </header>
  );

  const renderDisclosure = () => (
    page.disclosure && <p className="text-xs text-[#aaaaaa] mt-16 pt-8 border-t border-[#2a2a2a] italic max-w-4xl mx-auto text-center">{page.disclosure}</p>
  );

  const renderProducts = (title = "Relevant Tours") => (
    products.length > 0 && (
      <section className="my-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-serif text-[#fdfbf7]">{title}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {products.map(p => (
            <ProductCard key={p!.id} product={p as any} />
          ))}
        </div>
      </section>
    )
  );

  const renderFaqs = () => (
    page.faqs && page.faqs.length > 0 && (
      <section className="my-16 max-w-3xl mx-auto">
        <h2 className="text-3xl font-serif text-[#fdfbf7] text-center mb-10">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {page.faqs.map((faq, idx) => (
            <details key={idx} className="group bg-[#1a1a1a] border border-[#2a2a2a] open:border-[#d4af37] transition-colors">
              <summary className="flex justify-between items-center cursor-pointer p-6 list-none font-serif text-xl text-[#fdfbf7] group-open:text-[#d4af37]">
                {faq.question}
                <span className="text-[#d4af37] transform group-open:rotate-180 transition-transform">&darr;</span>
              </summary>
              <div className="p-6 pt-0 text-[#aaaaaa] font-light leading-relaxed">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </section>
    )
  );

  const renderRelatedLinks = () => {
    return (
      <section className="my-16 max-w-3xl mx-auto border-t border-[#2a2a2a] pt-16">
        <h2 className="text-2xl font-serif text-[#fdfbf7] mb-6">Explore Related Content</h2>
        <div className="space-y-4">
          {relatedPages.map(p => (
            <Link key={p.id} href={p.publicRoute} className="block text-[#d4af37] hover:text-[#fdfbf7] transition-colors">
              &rarr; {p.heroTitle || p.id}
            </Link>
          ))}
          <Link href="/french-quarter-welcome-stop" className="block text-[#d4af37] hover:text-[#fdfbf7] transition-colors">
            &rarr; Need in-person help? Visit our French Quarter Welcome Stop
          </Link>
        </div>
      </section>
    );
  };

  const wrapperClass = "max-w-5xl mx-auto px-6 pb-20";

  if (page.variant === "category") {
    const schemaGraph = generateCategorySchemaGraph({
      urlPath: page.publicRoute,
      name: page.heroTitle,
      description: page.heroSubtitle || "",
      items: products.map(p => ({
        slug: p!.slug,
        name: p!.title,
        description: p!.description || "",
        providerName: p!.providerId ? p!.providerId : "Unknown" // We can improve provider name lookup if needed
      }))
    });

    return (
      <div className="bg-[#151515] min-h-screen font-sans selection:bg-[#d4af37] selection:text-[#151515]">
        <JsonLd data={schemaGraph} />
        <main>
          {renderHero()}
          <div className={wrapperClass}>
            {page.openingAnswer && <section className="my-12 text-xl md:text-2xl font-serif text-[#fdfbf7] text-center max-w-3xl mx-auto leading-relaxed">{page.openingAnswer}</section>}

            <div className="grid md:grid-cols-12 gap-8 my-16">
              <div className="md:col-span-8">
                {page.whoItIsFor && (
                  <div className="bg-[#1a1a1a] p-8 md:p-10 border border-[#2a2a2a] shadow-sm relative mb-8">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#d4af37]"></div>
                    <h3 className="font-serif text-2xl text-[#d4af37] mb-4">Category Choice Guidance</h3>
                    <p className="text-[#aaaaaa] font-light leading-relaxed text-lg">{page.whoItIsFor}</p>
                  </div>
                )}
                {page.decisionFactors.length > 0 && (
                  <div className="bg-[#1a1a1a] p-8 md:p-10 border border-[#2a2a2a] shadow-sm">
                    <h3 className="font-serif text-2xl text-[#d4af37] mb-6">Key Decision Factors</h3>
                    <ul className="space-y-4">
                      {page.decisionFactors.map((f, i) => (
                        <li key={i} className="flex text-[#aaaaaa] font-light text-lg">
                          <span className="text-[#d4af37] mr-4 text-xl leading-none">&bull;</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {(page.planningConsiderations || page.transportationNotes) && (
                <div className="md:col-span-4">
                  <div className="bg-[#101010] border border-[#2a2a2a] p-8 text-[#fdfbf7] sticky top-8 rounded-sm">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[#d4af37] mb-4">Planning Note</h3>
                    {page.planningConsiderations && <p className="text-[#aaaaaa] font-light leading-relaxed mb-4">{page.planningConsiderations}</p>}
                    {page.transportationNotes && <p className="text-[#aaaaaa] font-light leading-relaxed">{page.transportationNotes}</p>}
                  </div>
                </div>
              )}
            </div>

            {page.id === "swamp-tours" && <SwampRideComparison />}

            {renderProducts("Available Inventory")}
            {renderFaqs()}

            {page.topCta && (
              <div className="my-16 text-center">
                <Link href={page.topCta} className="inline-block bg-[#d4af37] text-[#1a1a1a] px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-[#fdfbf7] transition-colors rounded-sm shadow-md">
                  View All Options
                </Link>
              </div>
            )}

            {renderRelatedLinks()}
            {renderDisclosure()}
          </div>
        </main>
      </div>
    );
  }

  if (page.variant === "comparison") {
    return (
      <div className="bg-[#151515] min-h-screen font-sans selection:bg-[#d4af37] selection:text-[#151515]">
        <main>
          {renderHero()}
          <div className={wrapperClass}>
            {page.openingAnswer && (
              <section className="my-16 p-8 md:p-12 bg-[#1a1a1a] border border-[#d4af37]/30 shadow-sm text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37] opacity-5 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-[#d4af37] mb-4">The Short Verdict</h2>
                <p className="text-2xl font-serif text-[#fdfbf7] max-w-2xl mx-auto leading-relaxed">{page.openingAnswer}</p>
              </section>
            )}

            {page.decisionFactors.length > 0 && (
              <section className="my-16">
                <h2 className="text-3xl font-serif text-[#fdfbf7] text-center mb-10">Side-by-Side Comparison</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#2a2a2a] border border-[#2a2a2a]">
                  {page.decisionFactors.map((f, i) => (
                    <div key={i} className="p-8 md:p-10 bg-[#1a1a1a]">
                      <p className="text-[#aaaaaa] font-light text-lg leading-relaxed">{f}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(page.whoItIsFor || page.whoShouldChooseSomethingElse) && (
              <div className="grid md:grid-cols-2 gap-8 my-16">
                {page.whoItIsFor && (
                  <div className="p-8 md:p-10 bg-[#101010] border border-[#d4af37]/30">
                    <h3 className="font-serif text-2xl text-[#d4af37] mb-4">Choose Option A If...</h3>
                    <p className="text-[#fdfbf7] font-light leading-relaxed">{page.whoItIsFor}</p>
                  </div>
                )}
                {page.whoShouldChooseSomethingElse && (
                  <div className="p-8 md:p-10 bg-[#1a1a1a] border border-[#2a2a2a]">
                    <h3 className="font-serif text-2xl text-[#fdfbf7] mb-4">Choose Option B If...</h3>
                    <p className="text-[#aaaaaa] font-light leading-relaxed">{page.whoShouldChooseSomethingElse}</p>
                  </div>
                )}
              </div>
            )}

            {page.planningConsiderations && (
               <div className="my-16 p-8 border-y border-[#2a2a2a] text-center">
                 <p className="text-[#aaaaaa] font-light italic max-w-3xl mx-auto">{page.planningConsiderations}</p>
               </div>
            )}

            {products.length > 0 && (
              <section className="my-16">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-serif text-[#fdfbf7]">Compare Inventory</h2>
                </div>
                <ComparisonMatrix slugs={products.map(p => p!.slug)} />
              </section>
            )}

            {renderRelatedLinks()}
            {renderDisclosure()}
          </div>
        </main>
      </div>
    );
  }

  if (page.variant === "area") {
    return (
      <div className="bg-[#151515] min-h-screen font-sans selection:bg-[#d4af37] selection:text-[#151515]">
        <main>
          {renderHero()}
          <div className={wrapperClass}>
            {page.openingAnswer && <section className="my-16 text-2xl font-serif text-[#fdfbf7] text-center max-w-3xl mx-auto leading-relaxed relative">
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 text-6xl text-[#2a2a2a] font-serif leading-none">&ldquo;</span>
              {page.openingAnswer}
              <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-6xl text-[#2a2a2a] font-serif leading-none">&rdquo;</span>
            </section>}

            {(page.whoItIsFor || page.planningConsiderations) && (
              <div className="grid md:grid-cols-2 gap-12 my-24 bg-[#1a1a1a] p-8 md:p-12 border border-[#2a2a2a] shadow-sm">
                {page.whoItIsFor && (
                  <div>
                    <h3 className="font-serif text-2xl mb-4 text-[#d4af37]">Why Visitors Go</h3>
                    <p className="text-[#aaaaaa] font-light leading-relaxed text-lg">{page.whoItIsFor}</p>
                  </div>
                )}
                {page.planningConsiderations && (
                  <div className="border-t md:border-t-0 md:border-l border-[#2a2a2a] pt-8 md:pt-0 md:pl-12">
                    <h3 className="font-serif text-2xl mb-4 text-[#d4af37]">Planning Considerations</h3>
                    <p className="text-[#aaaaaa] font-light leading-relaxed text-lg">{page.planningConsiderations}</p>
                  </div>
                )}
              </div>
            )}

            {renderProducts("Experiences in this Area")}

            {page.topCta && (
              <div className="my-16 text-center">
                <Link href={page.topCta} className="inline-flex items-center text-[#d4af37] font-bold text-sm uppercase tracking-widest hover:text-[#fdfbf7] transition-colors group">
                  <span className="border-b border-[#d4af37] group-hover:border-[#fdfbf7] pb-1">Explore Area</span>
                  <span className="ml-2 transform group-hover:translate-x-1 transition-transform">&rarr;</span>
                </Link>
              </div>
            )}

            {renderRelatedLinks()}
            {renderDisclosure()}
          </div>
        </main>
      </div>
    );
  }

  if (page.variant === "traveler-fit") {
    return (
      <div className="bg-[#151515] min-h-screen font-sans selection:bg-[#d4af37] selection:text-[#151515]">
        <main>
          {renderHero()}
          <div className={wrapperClass}>
            {page.whoItIsFor && (
              <div className="my-12 p-8 md:p-12 bg-[#101010] border border-[#2a2a2a] text-[#fdfbf7] rounded-sm text-center">
                <h2 className="text-sm font-bold uppercase tracking-widest text-[#d4af37] mb-4">Traveler Profile</h2>
                <h3 className="text-2xl font-serif mb-6">Is this right for you?</h3>
                <p className="text-[#aaaaaa] font-light leading-relaxed text-lg max-w-2xl mx-auto">{page.whoItIsFor}</p>
              </div>
            )}

            {page.openingAnswer && <section className="my-16 text-xl font-serif text-[#fdfbf7] max-w-3xl mx-auto leading-relaxed border-l-4 border-[#d4af37] pl-8">{page.openingAnswer}</section>}

            {page.whoShouldChooseSomethingElse && (
               <div className="my-16 p-8 md:p-10 bg-[#1a1a1a] border border-[#2a2a2a]">
                 <h3 className="font-serif text-2xl text-[#d4af37] mb-4">Tradeoffs & Alternatives</h3>
                 <p className="text-[#aaaaaa] font-light leading-relaxed text-lg">{page.whoShouldChooseSomethingElse}</p>
               </div>
            )}

            {renderProducts()}
            {renderDisclosure()}
          </div>
        </main>
      </div>
    );
  }

  if (page.variant === "guide") {
    return (
      <div className="bg-[#151515] min-h-screen font-sans selection:bg-[#d4af37] selection:text-[#151515]">
        <main>
          {renderHero()}
          <div className="max-w-3xl mx-auto px-6 pb-20">

            <article className="my-16 text-[#fdfbf7] font-light text-lg leading-relaxed">
              {page.openingAnswer && <p className="text-2xl font-serif mb-10 text-center leading-relaxed">{page.openingAnswer}</p>}

              {page.planningConsiderations && (
                <div className="mb-12">
                  <h3 className="text-3xl font-serif mt-12 mb-6 text-[#d4af37]">Practical Explanation</h3>
                  <div className="prose prose-lg prose-invert max-w-none text-[#aaaaaa]">
                    <p>{page.planningConsiderations}</p>
                  </div>
                </div>
              )}

              {page.decisionFactors.length > 0 && (
                <div className="bg-[#1a1a1a] p-8 md:p-10 border border-[#2a2a2a] my-12">
                  <h3 className="text-2xl font-serif mb-6 text-[#fdfbf7]">Implications for Booking</h3>
                  <ul className="space-y-4">
                    {page.decisionFactors.map((f, i) => (
                      <li key={i} className="flex">
                        <span className="text-[#d4af37] mr-4 text-xl leading-none">&bull;</span>
                        <span className="text-[#aaaaaa]">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>

            {page.topCta && (
              <div className="my-16 text-center">
                <Link href={page.topCta} className="inline-flex items-center text-[#d4af37] font-bold text-sm uppercase tracking-widest hover:text-[#fdfbf7] transition-colors group">
                  <span className="border-b border-[#d4af37] group-hover:border-[#fdfbf7] pb-1">Read Full Guide</span>
                  <span className="ml-2 transform group-hover:translate-x-1 transition-transform">&rarr;</span>
                </Link>
              </div>
            )}

            {renderProducts()}
            {renderDisclosure()}
          </div>
        </main>
      </div>
    );
  }

  return null;
}
