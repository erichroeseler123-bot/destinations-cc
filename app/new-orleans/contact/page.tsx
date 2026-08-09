import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact & Group Planning | New Orleans Concierge Desk",
  description: "Contact New Orleans Concierge Desk for tour selection help, group planning, the $5 French Quarter orientation, or local visitor questions.",
  openGraph: {
    title: "Contact & Group Planning | New Orleans Concierge Desk",
    description:
      "Call or text New Orleans Concierge Desk for tour comparisons, group planning, and local visitor help.",
  },
};

export default function NewOrleansContactPage() {
  return (
    <div className="bg-[var(--nola-bg-charcoal)] text-[var(--nola-ivory)] font-sans min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl text-[var(--nola-gold)] mb-4">
            Contact New Orleans Concierge Desk
          </h1>
          <p className="text-lg text-[var(--nola-ivory)]/80 font-light max-w-2xl mx-auto">
            Need help choosing a tour, planning for a group, reserving the morning orientation, or figuring out what to do next?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border border-[var(--nola-border)] bg-[var(--nola-surface-subtle)] p-8">
            <h2 className="font-serif text-2xl text-[var(--nola-ivory)] mb-4">Tour Selection & Questions</h2>
            <p className="text-[var(--nola-ivory)]/70 font-light mb-6">
              If you have questions about specific tours, accessibility, age requirements, timing, or transportation, we&apos;re here to help you compare the options. For support after a third-party booking, please contact the operator listed on your ticket.
            </p>
            <div className="space-y-2 text-sm">
              <p><strong className="text-[var(--nola-gold)]">Email:</strong> help@welcometoneworleanstours.com</p>
            </div>
          </div>

          <div className="border border-[var(--nola-border)] bg-[var(--nola-surface-subtle)] p-8">
            <h2 className="font-serif text-2xl text-[var(--nola-ivory)] mb-4">Group & Private Planning</h2>
            <p className="text-[var(--nola-ivory)]/70 font-light mb-6">
              Planning a family reunion, wedding party, or corporate group? We can help compare available private and group-friendly tour options.
            </p>
            <p className="text-sm font-light text-[var(--nola-ivory)]/70">
              Email us with your estimated group size, dates, and interests.
            </p>
          </div>

          <div className="border border-[var(--nola-border)] bg-[var(--nola-surface-strong)] p-8 md:col-span-2">
            <div className="flex flex-col md:flex-row md:items-center gap-8">
              <div className="flex-1">
                <h2 className="font-serif text-2xl text-[var(--nola-gold)] mb-4">New Orleans Concierge Desk</h2>
                <p className="text-[var(--nola-ivory)]/70 font-light mb-4">
                  Call or text the Desk for practical planning help, tour comparisons, or information about the $5 French Quarter Morning Orientation.
                </p>
                <p className="text-[var(--nola-ivory)]/70 font-light mb-6">
                  We help individuals, families, and groups narrow the options around the time, pace, transportation, and interests that actually fit their trip.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a href="tel:+15044849687" className="bg-[var(--nola-gold)] text-[var(--nola-bg-black)] px-6 py-3 text-xs font-bold uppercase tracking-widest text-center">
                    Call the Desk
                  </a>
                  <a href="sms:+15044849687" className="border border-[var(--nola-gold)] text-[var(--nola-gold)] px-6 py-3 text-xs font-bold uppercase tracking-widest text-center">
                    Text the Desk
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
