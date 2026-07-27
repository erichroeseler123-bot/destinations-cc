'use client';

import React from 'react';
import Link from 'next/link';
import MarketplaceDisclosure from '../components/MarketplaceDisclosure';
import ProductCard from '../components/ProductCard';
import { ALL_PRODUCTS, LiveProductAdapter } from '../data/index';
import styles from './outpost.module.css';

const LIVE_PRODUCT_IDS = [
  'southernstyle-city-tour',
  'southernstyle-plantation',
  'ragincajun-covered-boat',
  'ragincajun-airboat',
] as const;

export default function OutpostConsole() {
  const liveProducts = LIVE_PRODUCT_IDS
    .map((id) => ALL_PRODUCTS.find((product) => product.id === id))
    .filter(
      (product): product is LiveProductAdapter =>
        Boolean(product && product.status === 'live'),
    );

  return (
    <main
      className={`w-full min-h-screen ${styles.bgNolaCharcoal} ${styles.nolaIvory} font-sans selection:bg-[#d4af37] selection:text-[#1a1a1a]`}
    >
      <section className="px-6 py-14 md:py-20 border-b border-[#2a2a2a] bg-[#101010]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.24em] text-[#d4af37] mb-4">
            Browse All Live Experiences
          </p>
          <h1 className="font-serif text-4xl md:text-6xl text-white mb-5">
            New Orleans Tours
          </h1>
          <p className="max-w-2xl mx-auto text-base md:text-lg text-white/70 font-light leading-relaxed">
            Compare our four currently available experiences from participating local operators,
            then open a tour page for suitability details and live operator availability.
          </p>
        </div>
      </section>

      <section aria-labelledby="live-tours-heading" className="max-w-7xl mx-auto px-6 py-14 md:py-20">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-10">
          <div>
            <h2 id="live-tours-heading" className="font-serif text-3xl md:text-4xl text-[#d4af37] mb-3">
              Four Live Tour Options
            </h2>
            <p className="text-white/65 font-light">
              City, plantation, covered swamp boat, and airboat experiences.
            </p>
          </div>
          <Link
            href="/#chooser"
            className="inline-flex items-center justify-center border border-[#d4af37] px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#151515] transition-colors"
          >
            Help Me Choose
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {liveProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="border-y border-[#2a2a2a] bg-[#101010] px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37] mb-3">
            New Orleans Tour Concierge
          </p>
          <h2 className="font-serif text-3xl text-white mb-4">Schedule Tour Help</h2>
          <p className="max-w-2xl mx-auto text-white/70 font-light leading-relaxed mb-7">
            Already in New Orleans? Arrange a relaxed tour-planning conversation at an agreed
            hotel, French Quarter, or nearby public meeting location. Availability varies.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/french-quarter-welcome-stop"
              className="border border-[#d4af37] bg-[#d4af37] px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-[#151515] hover:bg-white transition-colors"
            >
              Schedule Tour Help
            </Link>
            <a
              href="tel:+15044849687"
              className="border border-[#d4af37] px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#151515] transition-colors"
            >
              Call 504-484-9687
            </a>
            <a
              href="sms:+15044849687"
              className="border border-[#2a2a2a] px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white hover:border-[#d4af37] hover:text-[#d4af37] transition-colors"
            >
              Text Us
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <MarketplaceDisclosure />
      </section>
    </main>
  );
}
