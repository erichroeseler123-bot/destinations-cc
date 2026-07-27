import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact & Group Planning | Welcome To New Orleans Tours",
  description: "Contact us for tour selection help, group planning, or a scheduled New Orleans Tour Concierge conversation.",
};

export default function NewOrleansContactPage() {
  return (
    <div className="bg-[var(--nola-bg-charcoal)] text-[var(--nola-ivory)] font-sans min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl text-[var(--nola-gold)] mb-4">
            Contact & Planning Help
          </h1>
          <p className="text-lg text-[var(--nola-ivory)]/80 font-light max-w-2xl mx-auto">
            Need help choosing a tour, planning for a group, or looking for local recommendations?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border border-[var(--nola-border)] bg-[var(--nola-surface-subtle)] p-8">
            <h2 className="font-serif text-2xl text-[var(--nola-ivory)] mb-4">Tour Selection & Questions</h2>
            <p className="text-[var(--nola-ivory)]/70 font-light mb-6">
              If you have questions about specific tours, accessibility, or age requirements, we&apos;re here to help you find the right fit. For immediate booking support, please contact the specific operator listed on your ticket.
            </p>
            <div className="space-y-2 text-sm">
              <p><strong className="text-[var(--nola-gold)]">Email:</strong> help@welcometoneworleanstours.com</p>
            </div>
          </div>

          <div className="border border-[var(--nola-border)] bg-[var(--nola-surface-subtle)] p-8">
            <h2 className="font-serif text-2xl text-[var(--nola-ivory)] mb-4">Group & Private Planning</h2>
            <p className="text-[var(--nola-ivory)]/70 font-light mb-6">
              Planning a family reunion, wedding party, or corporate retreat? We can help coordinate private swamp boats, dedicated city tours, and large group logistics.
            </p>
            <p className="text-sm font-light text-[var(--nola-ivory)]/70">
              Email us with your estimated group size, dates, and interests.
            </p>
          </div>

          <div className="border border-[var(--nola-border)] bg-[var(--nola-surface-strong)] p-8 md:col-span-2">
            <div className="flex flex-col md:flex-row md:items-center gap-8">
              <div className="flex-1">
                <h2 className="font-serif text-2xl text-[var(--nola-gold)] mb-4">New Orleans Tour Concierge</h2>
                <p className="text-[var(--nola-ivory)]/70 font-light mb-4">
                  Already in New Orleans? Schedule a relaxed tour-planning conversation at a convenient hotel, French Quarter, or nearby public meeting location.
                </p>
                <p className="text-[var(--nola-ivory)]/70 font-light mb-6">
                  Meetings are arranged in advance, the location is agreed upon before the meeting, and availability varies.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a href="tel:+15044849687" className="bg-[var(--nola-gold)] text-[var(--nola-bg-black)] px-6 py-3 text-xs font-bold uppercase tracking-widest text-center">
                    Call to Schedule
                  </a>
                  <a href="sms:+15044849687" className="border border-[var(--nola-gold)] text-[var(--nola-gold)] px-6 py-3 text-xs font-bold uppercase tracking-widest text-center">
                    Text to Schedule
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
