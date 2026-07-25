import React from 'react';
import { Metadata } from 'next';
import { NEW_ORLEANS_ORIGIN } from '../tours/pageConfig';

export const metadata: Metadata = {
  title: 'French Quarter Welcome Stop | Welcome to New Orleans Tours',
  description: 'Get local help, coupons, and a quick orientation for your New Orleans trip. Location and availability vary by day. Call before visiting.',
  alternates: {
    canonical: `${NEW_ORLEANS_ORIGIN}/french-quarter-welcome-stop`
  }
};

export default function WelcomeStopPage() {
  return (
    <div className="bg-[#151515] min-h-screen text-[#fdfbf7] font-[var(--font-sans)] selection:bg-[#d4af37] selection:text-[#151515]">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="bg-[#1a1a1a] p-8 md:p-12 border border-[#2a2a2a] shadow-sm">
          <h1 className="text-3xl md:text-4xl font-[var(--font-accent)] font-bold text-[#fdfbf7] mb-6">French Quarter Welcome Stop</h1>

          <p className="text-lg text-[#aaaaaa] mb-10 leading-relaxed font-light">
            Our Welcome Stop is a rotating in-person visitor-help location in or near the French Quarter.
            Experience authentic New Orleans hospitality with local help, exclusive coupons, and a quick orientation to the city's best tours and experiences.
          </p>

          <div className="bg-[#101010] border-l-4 border-[#d4af37] p-6 md:p-8 mb-10">
            <h2 className="text-xl font-bold text-[#d4af37] mb-2 font-[var(--font-accent)]">Call for today's location</h2>
            <p className="text-[#fdfbf7] font-light mb-4">Location and availability vary by day. Call before visiting.</p>
            <p className="text-[#aaaaaa] font-light mb-6 text-sm">
              Eligible visitors should bring a booking confirmation for a featured tour booked through this website.
            </p>
            <div>
              <a href="tel:+15044849687" className="inline-block bg-[#d4af37] text-[#1a1a1a] px-8 py-4 font-bold uppercase tracking-widest text-sm hover:bg-[#fdfbf7] transition-colors">
                504-484-9687
              </a>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <div>
              <h3 className="text-xl font-bold mb-3 text-[#fdfbf7]">Local Help & Guidance</h3>
              <p className="text-[#aaaaaa] font-light leading-relaxed">Our local experts are ready to answer your questions, provide insider tips, and help you find the perfect swamp tour, airboat ride, or city excursion.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3 text-[#fdfbf7]">Coupons & Deals</h3>
              <p className="text-[#aaaaaa] font-light leading-relaxed">Stop by to grab physical coupons and discover special daily offers that might not be available online.</p>
            </div>
            <div className="md:col-span-2 pt-6 border-t border-[#2a2a2a]">
              <h3 className="text-xl font-bold mb-3 text-[#fdfbf7]">Independent Marketplace</h3>
              <p className="text-[#aaaaaa] font-light leading-relaxed">Welcome to New Orleans Tours is an independent curated marketplace. We help visitors compare selected participating tours using practical details such as format, pace, transportation, and suitability.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
