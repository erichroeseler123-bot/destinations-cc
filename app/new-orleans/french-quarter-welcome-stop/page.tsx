import React from 'react';
import type { Metadata } from 'next';
import { NEW_ORLEANS_ORIGIN } from '../tours/pageConfig';

export const metadata: Metadata = {
  title: 'New Orleans Tour Concierge | Welcome to New Orleans Tours',
  description: 'Schedule an in-person tour-planning conversation at an agreed New Orleans meeting location. Call or text in advance; availability varies.',
  openGraph: {
    title: 'New Orleans Tour Concierge | Welcome to New Orleans Tours',
    description: 'Schedule New Orleans tour-planning help in advance at an agreed meeting location. Availability varies.',
  },
  alternates: {
    canonical: `${NEW_ORLEANS_ORIGIN}/french-quarter-welcome-stop`
  }
};

export default function WelcomeStopPage() {
  return (
    <div className="bg-[var(--nola-bg-cream,#FAF5EC)] min-h-screen text-[var(--nola-walnut,#2C1810)] font-[var(--font-sans)]">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="bg-[#FAF5EC] p-8 md:p-12 border border-[#E2D7C3] shadow-sm rounded">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C8831A] mb-3">
            Planning Help by Appointment
          </p>
          <h1 className="text-3xl md:text-4xl font-[var(--font-accent)] font-bold text-[#2C1810] mb-6">
            New Orleans Tour Concierge
          </h1>

          <p className="text-lg text-[#5A4535] mb-10 leading-relaxed font-light">
            Already in New Orleans? Schedule a relaxed tour-planning conversation at a convenient
            hotel, French Quarter, or nearby public meeting location. Bring the group, ask questions,
            and hear the available tour options before deciding.
          </p>

          <div className="bg-[#F5EEDB] border-l-4 border-[#C8831A] p-6 md:p-8 mb-10 rounded-r">
            <h2 className="text-xl font-bold text-[#4A1A6B] mb-2 font-[var(--font-accent)]">
              Schedule Tour Help
            </h2>
            <p className="text-[#2C1810] font-light mb-4">
              Meetings are arranged in advance, and the meeting location is agreed upon before the
              appointment. Availability varies, so visitors should call or text to schedule.
            </p>
            <p className="text-[#5A4535] font-light mb-6 text-sm">
              The service helps individuals, families, and groups compare available tour options.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="tel:+15044849687"
                className="inline-block bg-[#C8831A] text-[#FAF5EC] px-8 py-4 font-bold uppercase tracking-widest text-sm text-center hover:bg-[#4A1A6B] transition-colors rounded"
              >
                Call 504-484-9687
              </a>
              <a
                href="sms:+15044849687"
                className="inline-block border border-[#C8831A] text-[#C8831A] px-8 py-4 font-bold uppercase tracking-widest text-sm text-center hover:bg-[#C8831A] hover:text-[#FAF5EC] transition-colors rounded"
              >
                Text to Schedule
              </a>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <div>
              <h3 className="text-xl font-bold mb-3 text-[#2C1810]">Compare the Live Options</h3>
              <p className="text-[#5A4535] font-light leading-relaxed">
                Talk through the available city, plantation, covered-boat, and airboat formats before deciding which one fits your group.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3 text-[#2C1810]">Choose a Convenient Location</h3>
              <p className="text-[#5A4535] font-light leading-relaxed">
                If a conversation is available, agree on a convenient hotel, French Quarter, or nearby public meeting location before meeting.
              </p>
            </div>
            <div className="md:col-span-2 pt-6 border-t border-[#E2D7C3]">
              <h3 className="text-xl font-bold mb-3 text-[#2C1810]">Independent Marketplace</h3>
              <p className="text-[#5A4535] font-light leading-relaxed">
                Welcome to New Orleans Tours is an independent curated marketplace. We help visitors compare selected participating tours using practical details such as format, pace, transportation, and suitability.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
