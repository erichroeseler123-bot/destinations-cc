import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { NEW_ORLEANS_ORIGIN } from '../tours/pageConfig';

export const metadata: Metadata = {
  title: 'New Orleans Concierge Desk | Local Tour & Trip Help',
  description: 'Get personal help comparing New Orleans tours, timing, transportation, and what to do next. Call or text the New Orleans Concierge Desk.',
  openGraph: {
    title: 'New Orleans Concierge Desk',
    description: 'Personal New Orleans planning help, tour comparisons, and a $5 French Quarter morning orientation.',
  },
  alternates: { canonical: `${NEW_ORLEANS_ORIGIN}/french-quarter-welcome-stop` }
};

export default function WelcomeStopPage() {
  return (
    <div className="bg-[#151515] min-h-screen text-[#fdfbf7] font-[var(--font-sans)]">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="bg-[#1a1a1a] p-8 md:p-12 border border-[#2a2a2a] shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37] mb-3">Visitor help in New Orleans</p>
          <h1 className="text-3xl md:text-5xl font-[var(--font-accent)] font-bold text-[#fdfbf7] mb-6">New Orleans Concierge Desk</h1>
          <p className="text-lg text-[#aaaaaa] mb-10 leading-relaxed font-light">Need help deciding what to do? We help visitors compare tours, understand timing and transportation, and build a practical plan around the people actually traveling with them.</p>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <div className="bg-[#101010] border border-[#333] p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-[#d4af37] mb-2">Morning first step</p>
              <h2 className="text-2xl font-bold mb-3">$5 French Quarter Orientation</h2>
              <p className="text-[#aaa] text-sm leading-relaxed mb-5">30 minutes at 8:00 AM or 9:30 AM daily. Meet at the Moonwalk by Café Du Monde, look for the yellow umbrella, and leave with the Welcome Packet.</p>
              <Link href="/french-quarter-orientation" className="text-[#d4af37] underline underline-offset-4">See orientation details</Link>
            </div>
            <div className="bg-[#101010] border border-[#333] p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-[#d4af37] mb-2">Personal planning help</p>
              <h2 className="text-2xl font-bold mb-3">Call or text the desk</h2>
              <p className="text-[#aaa] text-sm leading-relaxed mb-5">Tell us who's traveling, how much time you have, and what sounds good. We'll help narrow the choices.</p>
              <div className="flex gap-4 text-sm"><a href="tel:+15044849687" className="text-[#d4af37] underline underline-offset-4">Call</a><a href="sms:+15044849687" className="text-[#d4af37] underline underline-offset-4">Text</a></div>
            </div>
          </div>

          <div className="bg-[#101010] border-l-4 border-[#d4af37] p-6 md:p-8 mb-10">
            <h2 className="text-xl font-bold text-[#d4af37] mb-2 font-[var(--font-accent)]">Tour & Activity Help</h2>
            <p className="text-[#fdfbf7] font-light mb-4">Compare city tours, swamp formats, plantations, river cruises, walking tours and other participating experiences without having to decode every booking page yourself.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/help-me-choose" className="inline-block bg-[#d4af37] text-[#1a1a1a] px-8 py-4 font-bold uppercase tracking-widest text-sm text-center hover:bg-[#fdfbf7]">Help Me Choose</Link>
              <Link href="/compare" className="inline-block border border-[#d4af37] text-[#d4af37] px-8 py-4 font-bold uppercase tracking-widest text-sm text-center hover:bg-[#d4af37] hover:text-[#1a1a1a]">Compare Tours</Link>
            </div>
          </div>

          <div className="border-t border-[#2a2a2a] pt-8">
            <h3 className="text-xl font-bold mb-3">Optional Visitor Rewards</h3>
            <p className="text-[#aaaaaa] font-light leading-relaxed mb-4">Third-party promotional visitor rewards may be available to qualifying travelers. These promotions can require attendance at a timeshare sales presentation and have separate eligibility and redemption terms.</p>
            <Link href="/visitor-rewards" className="text-[#d4af37] underline underline-offset-4">Ask about current Visitor Rewards</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
