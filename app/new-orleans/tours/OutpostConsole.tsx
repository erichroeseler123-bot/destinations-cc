import React from 'react';
import Link from 'next/link';
import MarketplaceDisclosure from '../components/MarketplaceDisclosure';
import MarketplaceSearch from '../components/MarketplaceSearch';
import ProductCard from '../components/ProductCard';
import PhoneCta from '../components/PhoneCta';
import { ALL_PRODUCTS, LiveProductAdapter } from '../data/index';
import { CATEGORIES, AREAS, SEO_PAGES, PROVIDERS } from '../data/index';

export default function OutpostConsole() {

  const liveCategories = Object.values(CATEGORIES).filter(c => c.status === "live");
  const liveAreas = Object.values(AREAS).filter(a => a.status === "live");
  const liveGuides = Object.values(SEO_PAGES).filter(p => p.status === "live" && p.variant === "guide");

  const liveProducts = ALL_PRODUCTS.filter(p => p.status === "live") as LiveProductAdapter[];
  const cityTour = liveProducts.find(p => p.id === "southernstyle-city-tour");
  const plantationTour = liveProducts.find(p => p.id === "southernstyle-plantation");
  const coveredBoat = liveProducts.find(p => p.id === "ragincajun-covered-boat");
  const airboat = liveProducts.find(p => p.id === "ragincajun-airboat");

  const searchItems = [
    ...liveProducts.map(p => {
      const provider = p.providerId ? PROVIDERS[p.providerId]?.publicAttributionName : undefined;
      const catId = p.categoryIds && p.categoryIds.length > 0 ? p.categoryIds[0] : '';
      return {
        id: p.id,
        type: 'product' as const,
        title: p.title,
        description: p.description,
        href: `/new-orleans/tours/${p.slug}`,
        keywords: [p.title, p.slug, provider || ''],
        operator: provider,
        tags: [catId === 'city-tours' ? 'City' : catId === 'swamp-tours' ? 'Swamp' : 'Plantation', 'Tour'],
      }
    }),
    ...liveCategories.map(c => ({
      id: c.id,
      type: 'category' as const,
      title: c.title,
      description: c.title, // Category doesn't have description in type
      href: `/${c.slug}`,
      keywords: [c.title, c.slug],
      tags: ['Category']
    })),
    ...liveAreas.map(a => ({
      id: a.id,
      type: 'area' as const,
      title: a.title,
      description: a.visitorSummary || a.title,
      href: `/areas/${a.slug}`,
      keywords: [a.title, a.slug],
      tags: ['Area']
    })),
    ...liveGuides.map(g => ({
      id: g.id,
      type: 'guide' as const,
      title: g.heroTitle,
      description: g.openingAnswer || g.heroTitle,
      href: g.publicRoute,
      keywords: [g.heroTitle, g.id],
      tags: ['Guide']
    }))
  ];

  return (
    <main className="w-full min-h-screen bg-nola-ivory text-nola-charcoal font-sans selection:bg-nola-brass selection:text-nola-ivory">
      {/* 1. Marketplace Hero */}
      <section className="relative w-full py-28 px-6 flex flex-col items-center justify-center text-center bg-nola-charcoal text-nola-ivory">
        <div className="absolute inset-0 opacity-10 bg-[url('/noise.png')] mix-blend-overlay pointer-events-none"></div>
        <h1 className="relative text-5xl md:text-6xl lg:text-7xl font-serif mb-6 tracking-tight drop-shadow-sm text-nola-paper">Welcome to New Orleans</h1>
        <p className="relative text-xl md:text-2xl max-w-2xl text-nola-paper/80 font-light leading-relaxed mb-10">
          Compare authentic city tours, plantation experiences, and swamp excursions from local operators.
        </p>
        <div className="relative flex flex-col sm:flex-row gap-4">
          <Link href="#search" className="px-8 py-4 bg-nola-brass text-nola-charcoal font-bold uppercase tracking-widest text-sm rounded-sm hover:bg-nola-ivory transition-colors">
            Explore New Orleans Tours
          </Link>
          <Link href="/tours-for/first-time-visitors" className="px-8 py-4 bg-transparent border border-nola-brass text-nola-brass font-bold uppercase tracking-widest text-sm rounded-sm hover:bg-nola-brass/10 transition-colors">
            Help Me Choose
          </Link>
        </div>
        <div className="relative mt-8 pt-8 border-t border-nola-ivory/10 flex flex-col items-center">
          <p className="text-nola-paper/80 font-light text-sm mb-2">Planning a group or not sure which tour fits?</p>
          <PhoneCta placement="WTONOT-HERO-PHONE" isGroup className="text-nola-brass font-bold text-lg hover:text-nola-ivory transition-colors">
            Call 504-484-9687
          </PhoneCta>
        </div>
      </section>

      {/* 2. Choose How You Want to Experience New Orleans */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-serif mb-12 text-center text-nola-shutter">Choose How You Want to Experience New Orleans</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {[
            { href: "/city-tours", label: "City Tours" },
            { href: "/swamp-tours", label: "Swamp & Bayou" },
            { href: "/plantation-tours", label: "Plantations" }
          ].map(link => (
            <Link key={link.href} href={link.href} className="group relative block p-8 bg-white border border-nola-amber/50 rounded-sm text-center transition-all duration-300 hover:border-nola-brass hover:shadow-md hover:-translate-y-1">
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-nola-brass transition-all duration-300 group-hover:w-full"></span>
              <h3 className="font-serif text-lg text-nola-charcoal group-hover:text-nola-shutter transition-colors">{link.label}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Help Me Choose */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-nola-shutter p-10 md:p-14 rounded-sm shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-nola-brass opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="relative z-10 max-w-xl">
            <h2 className="text-3xl font-serif text-nola-ivory mb-4">Overwhelmed by choices?</h2>
            <p className="text-nola-ivory/80 font-light text-lg mb-6">Read our guides for first-time visitors or dive into detailed comparisons between specific tours to find your perfect fit.</p>
            <div className="bg-nola-charcoal/30 p-5 rounded-sm border border-nola-ivory/10">
               <p className="text-nola-ivory/90 font-bold text-sm mb-1">Prefer to talk to someone?</p>
               <PhoneCta placement="WTONOT-HELP-PHONE" className="text-nola-brass hover:text-nola-ivory transition-colors text-sm">
                 Call 504-484-9687 for help comparing tours.
               </PhoneCta>
            </div>
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full md:w-auto shrink-0">
             <Link href="/tours-for/first-time-visitors" className="px-6 py-3 bg-nola-ivory text-nola-shutter text-center font-bold uppercase tracking-widest text-xs rounded-sm hover:bg-nola-paper transition-colors">First-Time Visitors</Link>
             <Link href="/swamp-tours/airboat-vs-covered-boat" className="px-6 py-3 bg-transparent border border-nola-ivory/30 text-nola-ivory text-center font-bold uppercase tracking-widest text-xs rounded-sm hover:bg-nola-ivory/10 transition-colors">Compare Swamp Tours</Link>
          </div>
        </div>
      </section>

      {/* 4. Featured Experiences */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold tracking-widest uppercase text-nola-brass mb-4">Live Inventory</h2>
          <h3 className="text-4xl font-serif text-nola-charcoal">Featured Experiences</h3>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {cityTour && <ProductCard product={cityTour} />}
          {plantationTour && <ProductCard product={plantationTour} />}
          {coveredBoat && <ProductCard product={coveredBoat} />}
          {airboat && <ProductCard product={airboat} />}
        </div>
      </section>

      {/* 5. New Orleans After Dark */}
      <section id="after-dark" className="bg-nola-charcoal text-nola-ivory py-24 px-6 border-t-[8px] border-nola-oxblood">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <span className="text-nola-oxblood font-bold tracking-widest text-sm uppercase block mb-3">Evening Experiences</span>
              <h2 className="text-4xl md:text-5xl font-serif text-nola-paper">New Orleans After Dark</h2>
            </div>
            <p className="text-lg opacity-80 max-w-md font-light leading-relaxed">Discover the city when the sun goes down. Additional after-dark experiences will be added as local operator inventory is verified.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
             <div className="p-8 border border-nola-ivory/10 rounded-sm bg-nola-charcoal/80">
               <h3 className="font-serif text-2xl mb-3 text-nola-paper">Historical Night Tours</h3>
               <p className="opacity-70 text-sm font-light leading-relaxed">Explore the darker side of history in the French Quarter. (Inventory coming soon)</p>
             </div>
             <div className="p-8 border border-nola-ivory/10 rounded-sm bg-nola-charcoal/80">
               <h3 className="font-serif text-2xl mb-3 text-nola-paper">Dinner Cruises</h3>
               <p className="opacity-70 text-sm font-light leading-relaxed">Mississippi River evening experiences with local cuisine. (Inventory coming soon)</p>
             </div>
             <div className="p-8 border border-nola-ivory/10 rounded-sm bg-nola-charcoal/80">
               <h3 className="font-serif text-2xl mb-3 text-nola-paper">Live Music</h3>
               <p className="opacity-70 text-sm font-light leading-relaxed">Authentic jazz and cultural experiences in historic venues. (Inventory coming soon)</p>
             </div>
          </div>
        </div>
      </section>

      {/* 8. Browse New Orleans Tours (Search) */}
      <section id="search" className="max-w-6xl mx-auto px-6 py-24 border-t border-nola-amber/30">
        <h2 className="text-3xl font-serif mb-10 text-nola-shutter text-center">Browse New Orleans Tours</h2>
        <MarketplaceSearch items={searchItems} />
      </section>

      {/* Group Call Band */}
      <section className="bg-nola-charcoal text-nola-ivory py-16 px-6 border-y-4 border-nola-brass text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-serif text-nola-paper mb-4">Planning a New Orleans group outing?</h2>
          <p className="text-lg font-light text-nola-ivory/80 leading-relaxed mb-8">
            Call 504-484-9687 for help with tour options, group rates, and operator availability.
          </p>
          <PhoneCta placement="WTONOT-GROUP-PHONE" isGroup className="inline-block px-8 py-4 bg-nola-brass text-nola-charcoal font-bold uppercase tracking-widest text-sm rounded-sm hover:bg-nola-ivory transition-colors">
            Call About My Group
          </PhoneCta>
        </div>
      </section>

      {/* 6. Build Your New Orleans Day */}
      <section className="bg-nola-amber/10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold tracking-widest uppercase text-nola-brass mb-4">Itineraries</h2>
            <h3 className="text-4xl font-serif text-nola-charcoal">Build Your Day</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 lg:p-12 bg-white border border-nola-amber/50 shadow-sm rounded-sm hover:shadow-md transition-shadow">
              <h3 className="text-2xl font-serif mb-4 text-nola-shutter">The Classic First Day</h3>
              <p className="mb-6 text-nola-charcoal/80 font-light leading-relaxed text-lg">Combine a morning city orientation with an afternoon swamp adventure to hit the essential New Orleans highlights.</p>
              <div className="space-y-3 mb-6">
                 {cityTour && <Link href={`/new-orleans/tours/${cityTour.slug}`} className="block text-nola-brass hover:underline font-bold text-sm uppercase tracking-widest">{cityTour.title} &rarr;</Link>}
                 {airboat && <Link href={`/new-orleans/tours/${airboat.slug}`} className="block text-nola-brass hover:underline font-bold text-sm uppercase tracking-widest">{airboat.title} &rarr;</Link>}
              </div>
              <div className="p-4 bg-nola-ivory border-l-2 border-nola-brass">
                <p className="text-[11px] text-nola-charcoal/60 uppercase tracking-widest leading-relaxed">Note: These experiences are operated independently and require separate checkouts.</p>
              </div>
            </div>
            <div className="p-8 lg:p-12 bg-white border border-nola-amber/50 shadow-sm rounded-sm hover:shadow-md transition-shadow">
              <h3 className="text-2xl font-serif mb-4 text-nola-shutter">Plantations & River</h3>
              <p className="mb-6 text-nola-charcoal/80 font-light leading-relaxed text-lg">A journey outside the city limits into Louisiana's complex history along the Great River Road.</p>
              <div className="space-y-3 mb-6">
                 {plantationTour && <Link href={`/new-orleans/tours/${plantationTour.slug}`} className="block text-nola-brass hover:underline font-bold text-sm uppercase tracking-widest">{plantationTour.title} &rarr;</Link>}
              </div>
              <div className="p-4 bg-nola-ivory border-l-2 border-nola-brass">
                <p className="text-[11px] text-nola-charcoal/60 uppercase tracking-widest leading-relaxed">Note: Flexible timing. Operator policies differ.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Why Book Here */}
      <section className="bg-nola-tobacco text-nola-ivory py-24 px-6 text-center">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-sm font-bold tracking-widest uppercase text-nola-paper mb-12">The Marketplace Standard</h2>
          <div className="grid md:grid-cols-3 gap-12 lg:gap-16">
             <div>
               <div className="text-3xl mb-4 text-nola-paper">&#10003;</div>
               <h3 className="font-serif text-xl mb-4">Local Operators</h3>
               <p className="text-sm text-nola-ivory/90 font-light leading-relaxed">Every experience is hosted by verified, authentic New Orleans providers.</p>
             </div>
             <div>
               <div className="text-3xl mb-4 text-nola-paper">&#10003;</div>
               <h3 className="font-serif text-xl mb-4">Independent Checkout</h3>
               <p className="text-sm text-nola-ivory/90 font-light leading-relaxed">You book directly with the operator. Availability is verified during their checkout.</p>
             </div>
             <div>
               <div className="text-3xl mb-4 text-nola-paper">&#10003;</div>
               <h3 className="font-serif text-xl mb-4">Direct Support</h3>
               <p className="text-sm text-nola-ivory/90 font-light leading-relaxed">We clearly identify the operator responsible for your booking support and cancellation policies.</p>
             </div>
          </div>
        </div>
      </section>

      {/* 9. Explore by Area */}
      <section className="bg-white py-20 px-6 border-t border-nola-amber/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-serif mb-8 text-nola-shutter text-center">Explore by Area</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-center">
            {liveAreas.map(area => (
              <Link key={area.id} href={`/areas/${area.slug}`} className="group block p-8 border border-nola-amber/50 bg-nola-ivory text-center hover:border-nola-brass transition-colors rounded-sm shadow-sm hover:shadow-md">
                <span className="font-serif text-nola-charcoal group-hover:text-nola-shutter text-lg">{area.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Planning Guides */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-nola-amber/30">
        <h2 className="text-2xl font-serif mb-10 text-nola-shutter">Planning Guides</h2>
        <ul className="grid md:grid-cols-2 gap-x-12 gap-y-6">
          {liveGuides.map(guide => (
            <li key={guide.id} className="border-b border-nola-amber/30 pb-4 border-dashed">
              <Link href={guide.publicRoute} className="group flex items-center justify-between text-nola-charcoal hover:text-nola-brass transition-colors">
                <span className="font-serif text-lg">{guide.heroTitle}</span>
                <span className="font-serif transform group-hover:translate-x-1 transition-transform">&rarr;</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 11. Independent Marketplace Disclosure */}
      <section className="max-w-6xl mx-auto px-6 py-12 border-t border-nola-amber/30">
        <MarketplaceDisclosure />
      </section>

    </main>
  );
}
