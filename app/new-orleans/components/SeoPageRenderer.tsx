import React from 'react';
import Link from 'next/link';
import type { SeoPageRecord } from '../data/types';
import { getProductById } from '../data/index';
import ProductCard from './ProductCard';

export default function SeoPageRenderer({ page }: { page: SeoPageRecord }) {
  const products = page.liveProductIds.map(id => getProductById(id)).filter(Boolean);
  
  const moodClasses: Record<string, string> = {
    "after-dark": "bg-nola-charcoal text-nola-ivory",
    "warm": "bg-nola-ivory text-nola-charcoal",
    "default": "bg-white text-nola-charcoal"
  };
  const themeClass = moodClasses[page.visualMood || "default"] || moodClasses["default"];
  const isDark = page.visualMood === "after-dark";

  const renderHero = () => (
    <header className={`p-8 md:p-16 lg:p-24 text-center border-b ${isDark ? 'border-nola-brass/30' : 'border-nola-amber/50'} ${themeClass}`}>
      <div className="max-w-3xl mx-auto">
        {page.heroEyebrow && <span className="block text-xs font-bold uppercase tracking-widest mb-4 text-nola-brass">{page.heroEyebrow}</span>}
        <h1 className="text-4xl md:text-5xl font-serif mb-6 leading-tight">{page.heroTitle}</h1>
        {page.heroSubtitle && <p className={`text-xl font-light ${isDark ? 'text-nola-paper' : 'text-nola-charcoal/80'}`}>{page.heroSubtitle}</p>}
      </div>
    </header>
  );

  const renderDisclosure = () => (
    page.disclosure && <p className="text-xs text-nola-charcoal/60 mt-16 pt-8 border-t border-nola-amber/50 italic max-w-4xl mx-auto text-center">{page.disclosure}</p>
  );

  const renderProducts = (title = "Relevant Tours") => (
    products.length > 0 && (
      <section className="my-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-serif text-nola-charcoal">{title}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {products.map(p => (
            <ProductCard key={p!.id} product={p as any} />
          ))}
        </div>
      </section>
    )
  );

  const wrapperClass = "max-w-5xl mx-auto px-6 pb-20";

  if (page.variant === "category") {
    return (
      <main className="w-full bg-nola-ivory font-sans selection:bg-nola-brass selection:text-nola-ivory min-h-screen">
        {renderHero()}
        <div className={wrapperClass}>
          {page.openingAnswer && <section className="my-12 text-xl md:text-2xl font-serif text-nola-charcoal text-center max-w-3xl mx-auto leading-relaxed">{page.openingAnswer}</section>}
          
          <div className="grid md:grid-cols-12 gap-8 my-16">
            <div className="md:col-span-8">
              {page.whoItIsFor && (
                <div className="bg-white p-8 md:p-10 border border-nola-amber/50 shadow-sm relative mb-8">
                  <div className="absolute top-0 left-0 w-1 h-full bg-nola-shutter"></div>
                  <h3 className="font-serif text-2xl text-nola-shutter mb-4">Category Choice Guidance</h3>
                  <p className="text-nola-charcoal/80 font-light leading-relaxed text-lg">{page.whoItIsFor}</p>
                </div>
              )}
              {page.decisionFactors.length > 0 && (
                <div className="bg-white p-8 md:p-10 border border-nola-amber/50 shadow-sm">
                  <h3 className="font-serif text-2xl text-nola-shutter mb-6">Key Decision Factors</h3>
                  <ul className="space-y-4">
                    {page.decisionFactors.map((f, i) => (
                      <li key={i} className="flex text-nola-charcoal/80 font-light text-lg">
                        <span className="text-nola-brass mr-4 text-xl leading-none">&bull;</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {(page.planningConsiderations || page.transportationNotes) && (
              <div className="md:col-span-4">
                <div className="bg-nola-tobacco p-8 text-nola-ivory sticky top-8 rounded-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-nola-paper mb-4">Planning Note</h3>
                  {page.planningConsiderations && <p className="text-nola-ivory/90 font-light leading-relaxed mb-4">{page.planningConsiderations}</p>}
                  {page.transportationNotes && <p className="text-nola-ivory/90 font-light leading-relaxed">{page.transportationNotes}</p>}
                </div>
              </div>
            )}
          </div>
          
          {renderProducts("Available Inventory")}
          
          {page.topCta && (
            <div className="my-16 text-center">
              <Link href={page.topCta} className="inline-block bg-nola-shutter text-nola-ivory px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-nola-charcoal transition-colors rounded-sm shadow-md">
                View All Options
              </Link>
            </div>
          )}
          
          {renderDisclosure()}
        </div>
      </main>
    );
  }

  if (page.variant === "comparison") {
    return (
      <main className="w-full bg-nola-ivory font-sans selection:bg-nola-brass selection:text-nola-ivory min-h-screen">
        {renderHero()}
        <div className={wrapperClass}>
          {page.openingAnswer && (
            <section className="my-16 p-8 md:p-12 bg-white border border-nola-brass/30 shadow-sm text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-nola-brass opacity-10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-nola-brass mb-4">The Short Verdict</h2>
              <p className="text-2xl font-serif text-nola-charcoal max-w-2xl mx-auto leading-relaxed">{page.openingAnswer}</p>
            </section>
          )}

          {page.decisionFactors.length > 0 && (
            <section className="my-16">
              <h2 className="text-3xl font-serif text-nola-charcoal text-center mb-10">Side-by-Side Comparison</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-nola-amber/50 border border-nola-amber/50">
                {page.decisionFactors.map((f, i) => (
                  <div key={i} className="p-8 md:p-10 bg-white">
                    <p className="text-nola-charcoal/80 font-light text-lg leading-relaxed">{f}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
          
          {(page.whoItIsFor || page.whoShouldChooseSomethingElse) && (
            <div className="grid md:grid-cols-2 gap-8 my-16">
              {page.whoItIsFor && (
                <div className="p-8 md:p-10 bg-nola-amber/10 border border-nola-brass/30">
                  <h3 className="font-serif text-2xl text-nola-shutter mb-4">Choose Option A If...</h3>
                  <p className="text-nola-charcoal font-light leading-relaxed">{page.whoItIsFor}</p>
                </div>
              )}
              {page.whoShouldChooseSomethingElse && (
                <div className="p-8 md:p-10 bg-white border border-nola-amber/50">
                  <h3 className="font-serif text-2xl text-nola-charcoal mb-4">Choose Option B If...</h3>
                  <p className="text-nola-charcoal/80 font-light leading-relaxed">{page.whoShouldChooseSomethingElse}</p>
                </div>
              )}
            </div>
          )}

          {page.planningConsiderations && (
             <div className="my-16 p-8 border-y border-nola-amber/50 text-center">
               <p className="text-nola-charcoal/80 font-light italic max-w-3xl mx-auto">{page.planningConsiderations}</p>
             </div>
          )}

          {renderProducts("Compare Inventory")}
          {renderDisclosure()}
        </div>
      </main>
    );
  }

  if (page.variant === "area") {
    return (
      <main className="w-full bg-nola-ivory font-sans selection:bg-nola-brass selection:text-nola-ivory min-h-screen">
        {renderHero()}
        <div className={wrapperClass}>
          {page.openingAnswer && <section className="my-16 text-2xl font-serif text-nola-charcoal text-center max-w-3xl mx-auto leading-relaxed relative">
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 text-6xl text-nola-amber/50 font-serif leading-none">&ldquo;</span>
            {page.openingAnswer}
            <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-6xl text-nola-amber/50 font-serif leading-none">&rdquo;</span>
          </section>}
          
          {(page.whoItIsFor || page.planningConsiderations) && (
            <div className="grid md:grid-cols-2 gap-12 my-24 bg-white p-8 md:p-12 border border-nola-amber/50 shadow-sm">
              {page.whoItIsFor && (
                <div>
                  <h3 className="font-serif text-2xl mb-4 text-nola-shutter">Why Visitors Go</h3>
                  <p className="text-nola-charcoal/80 font-light leading-relaxed text-lg">{page.whoItIsFor}</p>
                </div>
              )}
              {page.planningConsiderations && (
                <div className="border-t md:border-t-0 md:border-l border-nola-amber/50 pt-8 md:pt-0 md:pl-12">
                  <h3 className="font-serif text-2xl mb-4 text-nola-shutter">Planning Considerations</h3>
                  <p className="text-nola-charcoal/80 font-light leading-relaxed text-lg">{page.planningConsiderations}</p>
                </div>
              )}
            </div>
          )}
          
          {renderProducts("Experiences in this Area")}
          
          {page.topCta && (
            <div className="my-16 text-center">
              <Link href={page.topCta} className="inline-flex items-center text-nola-shutter font-bold text-sm uppercase tracking-widest hover:text-nola-brass transition-colors group">
                <span className="border-b border-nola-shutter group-hover:border-nola-brass pb-1">Explore Area</span>
                <span className="ml-2 transform group-hover:translate-x-1 transition-transform">&rarr;</span>
              </Link>
            </div>
          )}
          {renderDisclosure()}
        </div>
      </main>
    );
  }

  if (page.variant === "traveler-fit") {
    return (
      <main className="w-full bg-nola-ivory font-sans selection:bg-nola-brass selection:text-nola-ivory min-h-screen">
        {renderHero()}
        <div className={wrapperClass}>
          {page.whoItIsFor && (
            <div className="my-12 p-8 md:p-12 bg-nola-tobacco text-nola-ivory rounded-sm text-center">
              <h2 className="text-sm font-bold uppercase tracking-widest text-nola-paper mb-4">Traveler Profile</h2>
              <h3 className="text-2xl font-serif mb-6">Is this right for you?</h3>
              <p className="text-nola-ivory/90 font-light leading-relaxed text-lg max-w-2xl mx-auto">{page.whoItIsFor}</p>
            </div>
          )}
          
          {page.openingAnswer && <section className="my-16 text-xl font-serif text-nola-charcoal max-w-3xl mx-auto leading-relaxed border-l-4 border-nola-brass pl-8">{page.openingAnswer}</section>}
          
          {page.whoShouldChooseSomethingElse && (
             <div className="my-16 p-8 md:p-10 bg-white border border-nola-amber/50">
               <h3 className="font-serif text-2xl text-nola-shutter mb-4">Tradeoffs & Alternatives</h3>
               <p className="text-nola-charcoal/80 font-light leading-relaxed text-lg">{page.whoShouldChooseSomethingElse}</p>
             </div>
          )}
          
          {renderProducts()}
          {renderDisclosure()}
        </div>
      </main>
    );
  }

  if (page.variant === "guide") {
    return (
      <main className="w-full bg-nola-ivory font-sans selection:bg-nola-brass selection:text-nola-ivory min-h-screen">
        {renderHero()}
        <div className="max-w-3xl mx-auto px-6 pb-20">
          
          <article className="my-16 text-nola-charcoal font-light text-lg leading-relaxed">
            {page.openingAnswer && <p className="text-2xl font-serif mb-10 text-center leading-relaxed">{page.openingAnswer}</p>}
            
            {page.planningConsiderations && (
              <div className="mb-12">
                <h3 className="text-3xl font-serif mt-12 mb-6">Practical Explanation</h3>
                <div className="prose prose-lg text-nola-charcoal/80 max-w-none">
                  <p>{page.planningConsiderations}</p>
                </div>
              </div>
            )}
            
            {page.decisionFactors.length > 0 && (
              <div className="bg-white p-8 md:p-10 border border-nola-amber/50 my-12">
                <h3 className="text-2xl font-serif mb-6">Implications for Booking</h3>
                <ul className="space-y-4">
                  {page.decisionFactors.map((f, i) => (
                    <li key={i} className="flex">
                      <span className="text-nola-brass mr-4 text-xl leading-none">&bull;</span>
                      <span className="text-nola-charcoal/80">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
          
          {page.topCta && (
            <div className="my-16 text-center">
              <Link href={page.topCta} className="inline-flex items-center text-nola-shutter font-bold text-sm uppercase tracking-widest hover:text-nola-brass transition-colors group">
                <span className="border-b border-nola-shutter group-hover:border-nola-brass pb-1">Read Full Guide</span>
                <span className="ml-2 transform group-hover:translate-x-1 transition-transform">&rarr;</span>
              </Link>
            </div>
          )}
          
          {renderProducts()}
          {renderDisclosure()}
        </div>
      </main>
    );
  }

  return null;
}
