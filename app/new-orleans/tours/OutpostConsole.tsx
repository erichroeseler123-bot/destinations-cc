"use client";

import { STOREFRONT_PRODUCTS } from "./pageConfig";

export default function NewOrleansToursStorefront() {
  const cityTour = STOREFRONT_PRODUCTS.find(p => p.id === "southernstyle-city-tour");
  const plantationTour = STOREFRONT_PRODUCTS.find(p => p.id === "southernstyle-plantation");
  const coveredBoat = STOREFRONT_PRODUCTS.find(p => p.id === "ragincajun-covered-boat");
  const airboat = STOREFRONT_PRODUCTS.find(p => p.id === "ragincajun-airboat");

  return (
    <div id="main-content" className="bg-[#FDFBF7] min-h-screen text-[#1a1a1a] font-[var(--font-sans)]">
      
      {/* Brand Header */}
      <header className="border-b border-[#E5E0D8] bg-[#FDFBF7] py-5 px-6 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚜️</span>
            <div>
              <h1 className="text-xl font-[var(--font-accent)] font-bold text-[#1a1a1a] tracking-tight leading-none uppercase">
                Welcome To New Orleans Tours
              </h1>
              <span className="text-[10px] font-bold text-[#C5A059] tracking-widest uppercase">
                A Curated Destination Marketplace
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <header className="relative bg-[#1a1a1a] text-[#FDFBF7] py-24 md:py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
           <img 
              src="/images/travel-markets/new-orleans/french-quarter-street.jpg" 
              alt="New Orleans French Quarter" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/60 to-transparent" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <span className="inline-flex border border-[#C5A059] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#C5A059] mb-8">
            The Excursion Desk
          </span>
          <h2 className="text-4xl md:text-6xl font-[var(--font-accent)] font-bold tracking-tight leading-tight mb-6">
            Find and Book<br />New Orleans Tours
          </h2>
          <p className="text-lg md:text-xl text-[#E5E0D8] font-light leading-relaxed max-w-2xl mx-auto">
            Compare city tours, plantation experiences, swamp tours and airboat rides from our curated selection of local New Orleans operators.
          </p>
        </div>
      </header>

      {/* Editorial Collection */}
      <main id="tours-grid" className="max-w-6xl mx-auto px-6 py-20 space-y-24">
        
        {/* City & History Collection */}
        <section>
          <div className="mb-12 border-b border-[#E5E0D8] pb-4">
             <h3 className="text-3xl font-[var(--font-accent)] font-bold text-[#1a1a1a]">City & History</h3>
             <p className="text-[#666] mt-2">Essential New Orleans experiences operated by Southern Style Tours.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            {/* City Tour Featured */}
            {cityTour && (
              <article className="group cursor-pointer flex flex-col">
                <a href={`/tours/${cityTour.slug}`} className="block flex-grow focus:outline-none focus:ring-2 focus:ring-[#C5A059]">
                  <div className="relative aspect-[4/5] md:aspect-[3/4] overflow-hidden bg-[#1a1a1a]">
                    <img
                      src={cityTour.imageUrl}
                      alt={cityTour.title}
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent opacity-80" />
                    <div className="absolute top-6 left-6 bg-[#FDFBF7] text-[#1a1a1a] px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                      {cityTour.category}
                    </div>
                    <div className="absolute bottom-6 left-6 right-6">
                      <h4 className="text-3xl font-[var(--font-accent)] text-[#FDFBF7] mb-2">{cityTour.title}</h4>
                      <p className="text-[11px] font-bold text-[#C5A059] uppercase tracking-widest">Operated by {cityTour.operatorName}</p>
                    </div>
                  </div>
                  <div className="pt-6 flex flex-col justify-between flex-grow">
                    <p className="text-[#444] leading-relaxed mb-4">{cityTour.description}</p>
                    {cityTour.bestFor && (
                      <span className="text-xs font-bold text-[#0B3B24] uppercase tracking-wider">{cityTour.bestFor}</span>
                    )}
                  </div>
                </a>
                <div className="pt-6">
                  <a href={`/tours/${cityTour.slug}`} className="inline-block border-b-2 border-[#0B3B24] text-[#0B3B24] font-bold pb-1 text-sm hover:text-[#1a1a1a] hover:border-[#1a1a1a] transition-colors uppercase tracking-widest">
                    View Tour Details →
                  </a>
                </div>
              </article>
            )}

            {/* Plantation Tour Featured */}
            {plantationTour && (
              <article className="group cursor-pointer flex flex-col mt-12 md:mt-24">
                <a href={`/tours/${plantationTour.slug}`} className="block flex-grow focus:outline-none focus:ring-2 focus:ring-[#C5A059]">
                  <div className="relative aspect-[4/5] md:aspect-[3/4] overflow-hidden bg-[#1a1a1a]">
                    <img
                      src={plantationTour.imageUrl}
                      alt={plantationTour.title}
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent opacity-80" />
                    <div className="absolute top-6 left-6 bg-[#FDFBF7] text-[#1a1a1a] px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                      {plantationTour.category}
                    </div>
                    <div className="absolute bottom-6 left-6 right-6">
                      <h4 className="text-3xl font-[var(--font-accent)] text-[#FDFBF7] mb-2">{plantationTour.title}</h4>
                      <p className="text-[11px] font-bold text-[#C5A059] uppercase tracking-widest">Operated by {plantationTour.operatorName}</p>
                    </div>
                  </div>
                  <div className="pt-6 flex flex-col justify-between flex-grow">
                    <p className="text-[#444] leading-relaxed mb-4">{plantationTour.description}</p>
                    {plantationTour.bestFor && (
                      <span className="text-xs font-bold text-[#0B3B24] uppercase tracking-wider">{plantationTour.bestFor}</span>
                    )}
                  </div>
                </a>
                <div className="pt-6">
                  <a href={`/tours/${plantationTour.slug}`} className="inline-block border-b-2 border-[#0B3B24] text-[#0B3B24] font-bold pb-1 text-sm hover:text-[#1a1a1a] hover:border-[#1a1a1a] transition-colors uppercase tracking-widest">
                    View Tour Details →
                  </a>
                </div>
              </article>
            )}
          </div>
        </section>

        {/* Wetlands Comparison */}
        <section className="bg-[#F4F1EB] -mx-6 px-6 py-20 md:px-12 md:mx-0 md:rounded-[2rem]">
          <div className="mb-12 text-center max-w-2xl mx-auto">
             <span className="text-[#C5A059] text-3xl mb-4 block">🐊</span>
             <h3 className="text-3xl font-[var(--font-accent)] font-bold text-[#1a1a1a] mb-4">Louisiana Wetlands</h3>
             <p className="text-[#666]">Explore the bayous with Ragin Cajun Tours. Choose between a relaxed covered pontoon or a high-speed airboat ride.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {coveredBoat && (
              <article className="bg-[#FDFBF7] p-6 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between border border-[#E5E0D8]">
                <div>
                  <div className="aspect-[16/9] overflow-hidden mb-6 bg-[#1a1a1a]">
                    <img src={coveredBoat.imageUrl} alt={coveredBoat.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
                  </div>
                  <h4 className="text-2xl font-[var(--font-accent)] text-[#1a1a1a] mb-1">{coveredBoat.title}</h4>
                  <p className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-4">Operated by {coveredBoat.operatorName}</p>
                  <p className="text-[#444] text-sm leading-relaxed mb-4">{coveredBoat.description}</p>
                  {coveredBoat.bestFor && (
                    <div className="mb-6"><span className="text-xs font-bold text-[#0B3B24] bg-[#0B3B24]/5 px-2 py-1">{coveredBoat.bestFor}</span></div>
                  )}
                </div>
                <a href={`/tours/${coveredBoat.slug}`} className="block w-full text-center border border-[#0B3B24] text-[#0B3B24] hover:bg-[#0B3B24] hover:text-[#FDFBF7] transition-colors font-bold py-3 text-xs uppercase tracking-widest">
                  View Tour Details
                </a>
              </article>
            )}

            {airboat && (
              <article className="bg-[#FDFBF7] p-6 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between border border-[#E5E0D8]">
                <div>
                  <div className="aspect-[16/9] overflow-hidden mb-6 bg-[#1a1a1a]">
                    <img src={airboat.imageUrl} alt={airboat.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
                  </div>
                  <h4 className="text-2xl font-[var(--font-accent)] text-[#1a1a1a] mb-1">{airboat.title}</h4>
                  <p className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-4">Operated by {airboat.operatorName}</p>
                  <p className="text-[#444] text-sm leading-relaxed mb-4">{airboat.description}</p>
                  {airboat.bestFor && (
                    <div className="mb-6"><span className="text-xs font-bold text-[#0B3B24] bg-[#0B3B24]/5 px-2 py-1">{airboat.bestFor}</span></div>
                  )}
                </div>
                <a href={`/tours/${airboat.slug}`} className="block w-full text-center border border-[#0B3B24] text-[#0B3B24] hover:bg-[#0B3B24] hover:text-[#FDFBF7] transition-colors font-bold py-3 text-xs uppercase tracking-widest">
                  View Tour Details
                </a>
              </article>
            )}
          </div>
        </section>
      </main>

      {/* Trust Block */}
      <section className="border-t border-[#E5E0D8] bg-[#FDFBF7] py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h4 className="font-bold text-[#1a1a1a] mb-4 uppercase tracking-widest text-xs">About Welcome to New Orleans Tours</h4>
          <p className="text-sm text-[#666] leading-relaxed">
            Welcome to New Orleans Tours is an independent, curated tour storefront. Each experience is operated by the local company shown on the tour listing, and booking opens through that operator’s FareHarbor checkout.
            <br /><br />
            Current pricing, schedules, availability, meeting details, cancellation policies, and reservation support are provided by the operator during booking. Welcome to New Orleans Tours is not affiliated with the City of New Orleans or an official tourism authority.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-[#888] py-16 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-[var(--font-accent)] text-[#FDFBF7] mb-6 uppercase tracking-widest">
            ⚜️ Welcome To New Orleans Tours
          </p>
          <p className="text-xs leading-relaxed max-w-xl mx-auto">
            Tours are operated and fulfilled by the local providers shown on each listing. Pricing, schedules, availability, meeting details, and cancellation policies are confirmed during booking.
          </p>
          <div className="mt-8 text-[10px] uppercase tracking-widest">
            © 2026 Welcome To New Orleans Tours. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
