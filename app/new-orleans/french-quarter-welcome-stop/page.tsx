import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import CinematicPageHero from '../components/CinematicPageHero';
import { NEW_ORLEANS_ORIGIN } from '../tours/pageConfig';

export const metadata: Metadata = {
  title: 'New Orleans Concierge Desk | Local Tour & Trip Help',
  description: 'Get personal help comparing New Orleans tours, timing, transportation, and what to do next. Call or text the New Orleans Concierge Desk.',
  openGraph: { title: 'New Orleans Concierge Desk', description: 'Personal New Orleans planning help, tour comparisons, and a $5 French Quarter morning orientation.' },
  alternates: { canonical: `${NEW_ORLEANS_ORIGIN}/french-quarter-welcome-stop` }
};

export default function WelcomeStopPage() {
  return (
    <div className="bg-[#080708] min-h-screen text-[#fdfbf7] font-[var(--font-sans)]">
      <CinematicPageHero
        eyebrow="A real person when you want one"
        title="New Orleans Concierge Desk"
        script="local help, right now"
        intro="Need help deciding what to do? Tell us who's traveling, how much time you have, and what sounds good. We'll help you compare tours, timing and transportation without making you decode every booking page yourself."
        image="/images/travel-markets/new-orleans/french-quarter-street.jpg"
        actions={[
          { href: "tel:+15044849687", label: "Call the Desk", detail: "504-484-9687", primary: true },
          { href: "sms:+15044849687", label: "Text Us", detail: "Ask a quick planning question" },
          { href: "/guides/french-quarter-orientation", label: "$5 Orientation", detail: "Start your morning with us" },
        ]}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="relative overflow-hidden bg-[linear-gradient(145deg,#171419,#0b0a0c)] border border-[#d4af37]/32 p-7 shadow-xl shadow-black/20">
            <p className="text-xs font-bold uppercase tracking-widest text-[#d4af37] mb-2">Morning first step</p>
            <h2 className="text-3xl font-bold mb-3">$5 French Quarter Orientation</h2>
            <p className="text-[#bbb0a1] text-sm leading-relaxed mb-5">30 minutes at 8:00 AM or 9:30 AM daily. Meet at the Moonwalk by Café Du Monde, look for the yellow umbrella, and leave with the Welcome Packet and a clearer plan.</p>
            <Link href="/guides/french-quarter-orientation" className="inline-flex border border-[#d4af37] px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#d4af37] hover:bg-[#d4af37] hover:text-[#151515]">See orientation details</Link>
          </div>
          <div className="relative overflow-hidden bg-[linear-gradient(145deg,#171419,#0b0a0c)] border border-[#d4af37]/32 p-7 shadow-xl shadow-black/20">
            <p className="text-xs font-bold uppercase tracking-widest text-[#d4af37] mb-2">Personal planning help</p>
            <h2 className="text-3xl font-bold mb-3">Call or text the desk</h2>
            <p className="text-[#bbb0a1] text-sm leading-relaxed mb-5">Two tours fit? Not sure whether to do a swamp or river cruise? Need something before dinner? This is the human fallback for the decision engine.</p>
            <div className="flex gap-3"><a href="tel:+15044849687" className="bg-[#d4af37] text-[#151515] px-5 py-3 text-xs font-bold uppercase tracking-widest">Call</a><a href="sms:+15044849687" className="border border-[#d4af37] text-[#d4af37] px-5 py-3 text-xs font-bold uppercase tracking-widest">Text</a></div>
          </div>
        </div>

        <div className="bg-[radial-gradient(circle_at_90%_10%,rgba(151,92,16,.16),transparent_30%),#111014] border-l-4 border-[#d4af37] border-y border-r border-y-[#d4af37]/20 border-r-[#d4af37]/20 p-7 md:p-9 mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37] mb-2">Decision help</p>
          <h2 className="text-3xl font-bold text-[#fdfbf7] mb-3 font-[var(--font-accent)]">Tour & Activity Help</h2>
          <p className="text-[#d3c8b8] font-light mb-6 max-w-3xl">Compare city tours, swamp formats, plantations, river cruises, walking tours and other participating experiences based on what actually fits your group.</p>
          <div className="flex flex-col sm:flex-row gap-3"><Link href="/help-me-choose" className="inline-block bg-[#d4af37] text-[#1a1a1a] px-8 py-4 font-bold uppercase tracking-widest text-sm text-center hover:bg-[#fdfbf7]">Help Me Choose</Link><Link href="/compare" className="inline-block border border-[#d4af37] text-[#d4af37] px-8 py-4 font-bold uppercase tracking-widest text-sm text-center hover:bg-[#d4af37] hover:text-[#1a1a1a]">Compare Tours</Link></div>
        </div>

        <div className="border-t border-[#d4af37]/20 pt-8"><h3 className="text-xl font-bold mb-3">Optional Visitor Rewards</h3><p className="text-[#9e958a] font-light leading-relaxed mb-4">Third-party promotional visitor rewards may be available to qualifying travelers. These promotions can require attendance at a timeshare sales presentation and have separate eligibility and redemption terms.</p><Link href="/guides/visitor-rewards" className="text-[#d4af37] underline underline-offset-4">Ask about current Visitor Rewards</Link></div>
      </main>
    </div>
  );
}
