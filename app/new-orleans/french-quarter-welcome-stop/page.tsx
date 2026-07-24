import React from 'react';
import { HeaderNav, FooterNav } from '../components/MarketplaceNavigation';
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
    <>
      <HeaderNav />
      <div className="bg-[#FDFBF7] min-h-screen text-[#1a1a1a] font-[var(--font-sans)] pb-16">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white p-8 rounded-lg shadow-sm border border-[#e5e5e5]">
            <h1 className="text-3xl font-[var(--font-heading)] text-[#1a1a1a] mb-6">French Quarter Welcome Stop</h1>
            
            <p className="text-lg text-[#4a4a4a] mb-8 leading-relaxed">
              Experience authentic New Orleans hospitality with local help, exclusive coupons, and a quick orientation to the city's best tours and experiences.
            </p>
            
            <div className="bg-[#e6f4ea] border-l-4 border-[#137333] p-6 mb-8 rounded-r-lg">
              <h2 className="text-xl font-bold text-[#137333] mb-2">Call for today's location</h2>
              <p className="text-[#1a1a1a] font-medium">Location and availability vary by day. Call before visiting.</p>
              <div className="mt-4">
                <a href="tel:+15045550199" className="inline-block bg-[#137333] text-white px-6 py-3 rounded font-bold hover:bg-[#0d5224] transition-colors">
                  (504) 555-0199
                </a>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-3">Local Help & Guidance</h3>
                <p className="text-[#4a4a4a]">Our local experts are ready to answer your questions, provide insider tips, and help you find the perfect swamp tour, airboat ride, or city excursion.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3">Coupons & Deals</h3>
                <p className="text-[#4a4a4a]">Stop by to grab physical coupons and discover special daily offers that might not be available online.</p>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-xl font-bold mb-3">Quick Orientation</h3>
                <p className="text-[#4a4a4a]">Get a brief lay of the land, understand transportation options to the swamps, and learn how to navigate the French Quarter like a local.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
      <FooterNav />
    </>
  );
}
