import React from 'react';
import { Metadata } from 'next';
import { NEW_ORLEANS_ORIGIN } from '../tours/pageConfig';

export const metadata: Metadata = {
  title: 'New Orleans Tour Concierge | Welcome to New Orleans Tours',
  description: 'Schedule an in-person tour-planning conversation at an agreed New Orleans meeting location. Call or text in advance; availability varies.',
  alternates: {
    canonical: `${NEW_ORLEANS_ORIGIN}/french-quarter-welcome-stop`
  }
};

export default function WelcomeStopPage() {
  return (
    <div className="bg-[#151515] min-h-screen text-[#fdfbf7] font-[var(--font-sans)] selection:bg-[#d4af37] selection:text-[#151515]">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="bg-[#1a1a1a] p-8 md:p-12 border border-[#2a2a2a] shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4af37] mb-3">
            Planning Help by Appointment
          </p>
          <h1 className="text-3xl md:text-4xl font-[var(--font-accent)] font-bold text-[#fdfbf7] mb-6">New Orleans Tour Concierge</h1>

          <p className="text-lg text-[#aaaaaa] mb-10 leading-relaxed font-light">
            Already in New Orleans? Schedule a relaxed tour-planning conversation at a convenient
            hotel, French Quarter, or nearby public meeting location. Bring the group, ask questions,
            and hear the available tour options before deciding.
          </p>

          <div className="bg-[#101010] border-l-4 border-[#d4af37] p-6 md:p-8 mb-10">
            <h2 className="text-xl font-bold text-[#d4af37] mb-2 font-[var(--font-accent)]">Arrange the meeting in advance</h2>
            <p className="text-[#fdfbf7] font-light mb-4">
              The meeting location is agreed upon before the conversation. Availability varies, so
              please call or text before making plans.
            </p>
            <p className="text-[#aaaaaa] font-light mb-6 text-sm">
              This is a scheduled concierge conversation, not a permanent storefront or walk-in visitor center.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="tel:+15044849687" className="inline-block bg-[#d4af37] text-[#1a1a1a] px-8 py-4 font-bold uppercase tracking-widest text-sm text-center hover:bg-[#fdfbf7] transition-colors">
                Call 504-484-9687
              </a>
              <a href="sms:+15044849687" className="inline-block border border-[#d4af37] text-[#d4af37] px-8 py-4 font-bold uppercase tracking-widest text-sm text-center hover:bg-[#d4af37] hover:text-[#1a1a1a] transition-colors">
                Text to Schedule
              </a>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <div>
              <h3 className="text-xl font-bold mb-3 text-[#fdfbf7]">Compare the Live Options</h3>
              <p className="text-[#aaaaaa] font-light leading-relaxed">Talk through the available city, plantation, covered-boat, and airboat formats before deciding which one fits your group.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3 text-[#fdfbf7]">Choose a Convenient Location</h3>
              <p className="text-[#aaaaaa] font-light leading-relaxed">If a conversation is available, agree on a convenient hotel, French Quarter, or nearby public meeting location before meeting.</p>
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
