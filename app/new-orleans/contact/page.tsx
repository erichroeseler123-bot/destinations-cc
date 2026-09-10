import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact & Group Planning | Welcome to New Orleans Tours",
  description:
    "Contact us for tour selection help, group planning, or a scheduled New Orleans Tour Concierge conversation.",
  openGraph: {
    title: "Contact & Group Planning | Welcome to New Orleans Tours",
    description:
      "Call or text to schedule New Orleans Tour Concierge help for individuals, families, and groups.",
  },
};

export default function NewOrleansContactPage() {
  return (
    <div className="bg-[var(--nola-bg-cream,#FAF5EC)] text-[var(--nola-walnut,#2C1810)] font-sans min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl text-[#4A1A6B] mb-4">
            Contact Welcome to New Orleans Tours
          </h1>
          <p className="text-lg text-[#5A4535] font-light max-w-2xl mx-auto">
            Need help choosing a tour, planning for a group, or figuring out what to do next?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border border-[#E2D7C3] bg-[#F5EEDB] p-8 rounded shadow-sm">
            <h2 className="font-serif text-2xl text-[#2C1810] mb-4">Tour Selection & Questions</h2>
            <p className="text-[#5A4535] font-light mb-6">
              If you have questions about specific tours, accessibility, age requirements, timing, or transportation, we&apos;re here to help narrow the options to what fits. For support after a third-party booking, please contact the operator listed on your ticket.
            </p>
            <div className="space-y-2 text-sm">
              <p><strong className="text-[#C8831A]">Email:</strong> help@welcometoneworleanstours.com</p>
            </div>
          </div>

          <div className="border border-[#E2D7C3] bg-[#F5EEDB] p-8 rounded shadow-sm">
            <h2 className="font-serif text-2xl text-[#2C1810] mb-4">Group & Private Planning</h2>
            <p className="text-[#5A4535] font-light mb-6">
              Planning a family reunion, wedding party, or corporate group? We can help narrow the available private and group-friendly tour options around your timing and priorities.
            </p>
            <p className="text-sm font-light text-[#5A4535]">
              Email us with your estimated group size, dates, and interests.
            </p>
          </div>

          <div className="border border-[#E2D7C3] bg-[#FAF5EC] p-8 md:col-span-2 rounded shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center gap-8">
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C8831A] mb-2">
                  Personal Planning Assistance
                </p>
                <h2 className="font-serif text-2xl text-[#4A1A6B] mb-4">New Orleans Tour Concierge</h2>
                <p className="text-[#2C1810] font-light mb-4">
                  Schedule a relaxed tour-planning conversation at an agreed hotel, French Quarter, or nearby public meeting location. Meetings are arranged in advance, and availability varies.
                </p>
                <p className="text-[#5A4535] font-light mb-6">
                  The service helps individuals, families, and groups compare available tour options with scheduled tour help tailored to your stay.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a href="tel:+15044849687" className="bg-[#C8831A] text-[#FAF5EC] px-6 py-3 text-xs font-bold uppercase tracking-widest text-center rounded hover:bg-[#4A1A6B] transition-colors">
                    Schedule Tour Help
                  </a>
                  <a href="sms:+15044849687" className="border border-[#C8831A] text-[#C8831A] px-6 py-3 text-xs font-bold uppercase tracking-widest text-center rounded hover:bg-[#C8831A] hover:text-[#FAF5EC] transition-colors">
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