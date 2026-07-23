'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import MarketplaceDisclosure from '../components/MarketplaceDisclosure';
import MarketplaceSearch from '../components/MarketplaceSearch';
import PhoneCta from '../components/PhoneCta';
import TourSlider from '../components/TourSlider';
import HelpMeChooseDrawer from '../components/HelpMeChooseDrawer';
import { ALL_PRODUCTS, LiveProductAdapter } from '../data/index';
import { CATEGORIES, AREAS, SEO_PAGES, PROVIDERS } from '../data/index';
import styles from './outpost.module.css';

export default function OutpostConsole() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const liveCategories = Object.values(CATEGORIES).filter(c => c.status === "live");
  const liveAreas = Object.values(AREAS).filter(a => a.status === "live");
  const liveGuides = Object.values(SEO_PAGES).filter(p => p.status === "live" && p.variant === "guide");

  const liveProducts = ALL_PRODUCTS.filter(p => p.status === "live") as LiveProductAdapter[];
  const cityTour = liveProducts.find(p => p.id === "southernstyle-city-tour");
  const plantationTour = liveProducts.find(p => p.id === "southernstyle-plantation");
  const coveredBoat = liveProducts.find(p => p.id === "ragincajun-covered-boat");
  const airboat = liveProducts.find(p => p.id === "ragincajun-airboat");

  // Only include defined products in the slider array
  const sliderProducts = [cityTour, plantationTour, coveredBoat, airboat].filter(Boolean) as LiveProductAdapter[];

  const searchItems = [
    ...liveProducts.map(p => {
      const provider = p.providerId ? PROVIDERS[p.providerId]?.publicAttributionName : undefined;
      const catId = p.categoryIds && p.categoryIds.length > 0 ? p.categoryIds[0] : '';
      return {
        id: p.id,
        type: 'product' as const,
        title: p.title,
        description: p.description,
        href: `/tours/${p.slug}`,
        keywords: [p.title, p.slug, provider || ''],
        operator: provider,
        tags: [catId === 'city-tours' ? 'City' : catId === 'swamp-tours' ? 'Swamp' : 'Plantation', 'Tour'],
      }
    }),
    ...liveCategories.map(c => ({
      id: c.id,
      type: 'category' as const,
      title: c.title,
      description: c.title,
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
    <main className={`w-full min-h-screen ${styles.bgNolaCharcoal} ${styles.nolaIvory} font-sans selection:bg-[#d4af37] selection:text-[#1a1a1a]`}>

      {/* 1. Marketplace Hero */}
      <section className={`relative w-full min-h-[80vh] flex flex-col justify-end pb-24 px-6 md:px-12 lg:px-24 ${styles.heroBackground}`}>
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/80 to-transparent"></div>
        <div className="absolute inset-0 bg-black/30 mix-blend-multiply pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl mt-32">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold leading-none mb-6 drop-shadow-lg text-white">
            REAL NEW ORLEANS.<br/>
            <span className={styles.nolaBrass}>REAL GOOD TIMES.</span>
          </h1>
          <p className="text-xl md:text-2xl font-light text-white/90 max-w-2xl mb-12">
            Compare authentic city tours, plantation experiences, and swamp excursions from local New Orleans operators.
          </p>
          <div className="flex flex-col sm:flex-row gap-6">
            <button
              onClick={() => {
                document.getElementById('slider-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={styles.nolaButton}
            >
              Explore Tours
            </button>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className={styles.nolaButtonOutline}
            >
              Help Me Choose
            </button>
          </div>
        </div>
      </section>

      {/* 2. Trust Strip */}
      <section className={`border-y ${styles.nolaBorder} bg-black/20`}>
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center gap-2">
            <span className={`text-2xl ${styles.nolaBrass}`}>&#10003;</span>
            <span className="font-sans text-xs font-bold uppercase tracking-widest text-white/80">Local Operators</span>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <span className={`text-2xl ${styles.nolaBrass}`}>&#10003;</span>
            <span className="font-sans text-xs font-bold uppercase tracking-widest text-white/80">Help Choosing</span>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <span className={`text-2xl ${styles.nolaBrass}`}>&#10003;</span>
            <span className="font-sans text-xs font-bold uppercase tracking-widest text-white/80">Operator Checkout</span>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <span className={`text-2xl ${styles.nolaBrass}`}>&#10003;</span>
            <span className="font-sans text-xs font-bold uppercase tracking-widest text-white/80">Questions or Groups</span>
          </div>
        </div>
      </section>

      {/* 3. Featured Experiences Slider */}
      <section id="slider-section" className="bg-[#151515]">
        <TourSlider products={sliderProducts} basePath="" />
      </section>

      {/* 4. Explore Section (Signboard-style) */}
      <section className={`max-w-7xl mx-auto px-6 py-24 border-t ${styles.nolaBorder}`}>
        <div className="text-center mb-16">
          <h2 className="font-sans text-sm font-bold uppercase tracking-widest text-white/50 mb-2">Discover</h2>
          <h3 className={`font-serif text-4xl md:text-5xl font-bold ${styles.nolaBrass}`}>Explore By Area</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { href: "/city-tours", label: "City Tours", sub: "French Quarter & Beyond" },
            { href: "/swamp-tours", label: "Swamp & Bayou", sub: "Airboats & Covered Boats" },
            { href: "/plantation-tours", label: "Plantations", sub: "Historic River Road" }
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`group flex flex-col items-center justify-center p-12 border ${styles.nolaBorder} bg-[#1a1a1a] hover:border-[#d4af37] transition-all duration-300`}
            >
              <h4 className="font-serif text-3xl text-white group-hover:text-[#d4af37] transition-colors mb-2">{link.label}</h4>
              <span className="font-sans text-xs uppercase tracking-[0.2em] text-white/50">{link.sub}</span>
            </Link>
          ))}

          <Link
            href="/tours-for/first-time-visitors"
            className={`group flex flex-col items-center justify-center p-12 border ${styles.nolaBorder} bg-black/40 hover:border-[#d4af37] transition-all duration-300`}
          >
            <h4 className="font-serif text-3xl text-white group-hover:text-[#d4af37] transition-colors mb-2">First-Time</h4>
            <span className="font-sans text-xs uppercase tracking-[0.2em] text-white/50">Visitor Recommendations</span>
          </Link>

          {liveAreas.slice(0,2).map(area => (
            <Link
              key={area.id}
              href={`/areas/${area.slug}`}
              className={`group flex flex-col items-center justify-center p-12 border ${styles.nolaBorder} bg-black/40 hover:border-[#d4af37] transition-all duration-300`}
            >
              <h4 className="font-serif text-3xl text-white group-hover:text-[#d4af37] transition-colors mb-2">{area.title}</h4>
              <span className="font-sans text-xs uppercase tracking-[0.2em] text-white/50">Area Guide</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. Browse (Search) */}
      <section className={`max-w-6xl mx-auto px-6 py-24 border-t ${styles.nolaBorder}`}>
        <h2 className={`text-4xl font-serif mb-12 text-center font-bold ${styles.nolaBrass}`}>Find a Tour</h2>
        <div className="bg-black/20 p-6 border border-[#2a2a2a]">
          <MarketplaceSearch items={searchItems} />
        </div>
      </section>

      {/* 6. Planning Guides */}
      <section className={`max-w-7xl mx-auto px-6 py-20 border-t ${styles.nolaBorder}`}>
        <h2 className={`text-3xl font-serif font-bold mb-10 ${styles.nolaBrass}`}>Planning Guides</h2>
        <ul className="grid md:grid-cols-2 gap-x-12 gap-y-6">
          {liveGuides.map(guide => (
            <li key={guide.id} className="border-b border-white/10 pb-4 border-dashed">
              <Link href={guide.publicRoute} className="group flex items-center justify-between text-white hover:text-[#d4af37] transition-colors">
                <span className="font-serif text-xl">{guide.heroTitle}</span>
                <span className="font-sans font-bold transform group-hover:translate-x-1 transition-transform">&rarr;</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 7. Group Call Section */}
      <section className={`bg-[#0a0a0a] py-24 px-6 border-y ${styles.nolaBorder} text-center relative overflow-hidden`}>
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-4xl font-serif font-bold text-white mb-6">PLANNING SOMETHING FOR YOUR GROUP?</h2>
          <p className="text-lg font-light text-white/80 leading-relaxed mb-10">
            Call 504-484-9687 for help with tour options, group rates, and operator availability. We'll help you find the right fit for your party.
          </p>
          <PhoneCta placement="WTONOT-GROUP-PHONE" isGroup className={styles.nolaButton}>
            Call About My Group
          </PhoneCta>
        </div>
      </section>

      {/* 8. After Dark Teaser */}
      <section className="bg-black py-20 px-6 text-center border-b border-[#2a2a2a]">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-3xl text-white font-bold mb-4">NEW ORLEANS AFTER DARK</h2>
          <p className="font-sans font-light text-white/60 leading-relaxed text-sm">
            We are adding carefully selected ghost, cemetery, music and evening experiences. Check back as we verify local operator inventory.
          </p>
        </div>
      </section>

      {/* 9. Independent Marketplace Disclosure */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <MarketplaceDisclosure />
      </section>

      <HelpMeChooseDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </main>
  );
}
