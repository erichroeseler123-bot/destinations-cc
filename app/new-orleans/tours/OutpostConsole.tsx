"use client";

import { STOREFRONT_PRODUCTS } from "./pageConfig";

export default function NewOrleansToursStorefront() {
  return (
    <div id="main-content" className="bg-slate-50 min-h-screen text-slate-800 font-sans">
      
      {/* Brand Header */}
      <header className="border-b border-slate-200 bg-white py-4 px-6 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚜️</span>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">
                Welcome To New Orleans Tours
              </h1>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                Curated local tours
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <header className="bg-slate-900 text-white py-16 md:py-24 px-6 relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_50%)]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-8 items-center relative z-10">
          <div className="md:col-span-7 space-y-6 text-left">
            <span className="inline-flex rounded-full bg-emerald-500/10 border border-emerald-400/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-400">
              New Orleans Tours & Experiences
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
              Find and Book New Orleans Tours
            </h2>
            <p className="text-base md:text-lg text-slate-300 font-medium leading-relaxed">
              Compare city tours, plantation experiences, swamp tours and airboat rides from local New Orleans operators.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <a href="#tours-grid" className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-2xl hover:bg-emerald-500 transition shadow-lg text-sm">
                Browse New Orleans Tours
              </a>
            </div>
          </div>
          <div className="md:col-span-5 relative group">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-3xl blur-2xl group-hover:bg-emerald-500/20 transition" />
            <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-2xl border border-white/10">
              <img 
                src="/images/travel-markets/new-orleans/french-quarter-street.jpg" 
                alt="New Orleans French Quarter streetscape" 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-left">
                <p className="text-xs font-bold text-white uppercase tracking-wider">Royal Street, French Quarter</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tours Grid */}
      <section id="tours-grid" className="max-w-6xl mx-auto px-6 py-16 mb-16">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-black text-slate-900">
            Live New Orleans Excursions
          </h3>
          <span className="text-xs font-bold text-slate-400 bg-slate-200/50 px-2.5 py-1 rounded-lg">
            {STOREFRONT_PRODUCTS.length} curated tours
          </span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
          {STOREFRONT_PRODUCTS.map((item) => (
            <article key={item.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between hover:border-emerald-500/50 transition-colors text-left group">
              {/* Tour Card Image */}
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-slate-900/10" />
                <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {item.category}
                </div>
              </div>

              <div className="p-6 flex-grow flex flex-col justify-between">
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-1">{item.title}</h4>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3">Operator: {item.operatorName}</p>
                  <p className="text-sm text-slate-600 mb-2 leading-relaxed">{item.description}</p>
                  {item.bestFor && (
                    <p className="text-xs font-semibold text-slate-700 bg-slate-100 inline-block px-2 py-1 rounded">
                      {item.bestFor}
                    </p>
                  )}
                </div>
                
                <div className="border-t border-slate-100 pt-4 text-xs text-slate-600">
                  <p className="font-medium leading-relaxed">Choose a date to view current departure times, duration, and pricing.</p>
                </div>
              </div>
              
              <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                <a 
                  href={`/tours/${item.slug}`}
                  className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors uppercase tracking-wider"
                >
                  View Tour Details
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Trust Block */}
      <div className="pt-4 pb-12 max-w-4xl mx-auto px-6">
        <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 sm:p-8 text-center shadow-sm">
          <h4 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-sm">About Welcome to New Orleans Tours</h4>
          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Welcome to New Orleans Tours is an independent, curated tour storefront. Each experience is operated by the local company shown on the tour card, and booking opens through that operator’s FareHarbor checkout.
            <br /><br />
            Current pricing, schedules, availability, meeting details, cancellation policies, and reservation support are provided by the operator during booking. Welcome to New Orleans Tours is not affiliated with the City of New Orleans or an official tourism authority.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 border-t border-slate-800 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
            ⚜️ Welcome To New Orleans Tours
          </p>
          <p className="text-xs leading-relaxed max-w-xl mx-auto font-medium">
            Tours are operated and fulfilled by the local providers shown on each listing. Pricing, schedules, availability, meeting details, and cancellation policies are confirmed during booking. Welcome to New Orleans Tours is an independent curated storefront.
          </p>
          <div className="mt-6 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
            © 2026 Welcome To New Orleans Tours. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
