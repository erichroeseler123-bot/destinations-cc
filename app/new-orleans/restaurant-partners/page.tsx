import type { Metadata } from "next";
import Link from "next/link";
import RestaurantOrientationAd from "../components/RestaurantOrientationAd";
import { DEFAULT_SEATED_GUEST_FEE_USD } from "../data/diningPartners";

export const metadata: Metadata = {
  title: "Restaurant Partner Program | Welcome to New Orleans Tours",
  description:
    "Join the Welcome to New Orleans Tours dining partner pilot and pay only for confirmed seated guests we refer.",
  alternates: { canonical: "/new-orleans/restaurant-partners" },
};

export default function RestaurantPartnersPage() {
  return (
    <main className="min-h-screen bg-[#151515] text-[#fdfbf7] px-6 py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        <p className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.2em] mb-4">
          Welcome to New Orleans Tours · Dining Partner Pilot
        </p>
        <h1 className="font-[var(--font-accent)] text-4xl md:text-6xl font-bold leading-tight mb-6">
          We send diners. You pay only when they show up.
        </h1>
        <p className="text-lg text-[#cccccc] leading-relaxed max-w-3xl mb-10">
          We help New Orleans visitors choose where to eat based on party size, timing, neighborhood, and what they are doing before or after dinner. The pilot has no upfront listing fee.
        </p>

        <div className="mb-12">
          <RestaurantOrientationAd />
        </div>

        <section className="grid md:grid-cols-3 gap-4 mb-12">
          <div className="border border-[#2a2a2a] bg-[#1a1a1a] p-6">
            <p className="text-[#d4af37] text-xs font-bold uppercase tracking-widest mb-2">Pilot fee</p>
            <p className="font-[var(--font-accent)] text-3xl font-bold">${DEFAULT_SEATED_GUEST_FEE_USD}</p>
            <p className="text-sm text-[#aaaaaa] mt-2">per confirmed seated guest</p>
          </div>
          <div className="border border-[#2a2a2a] bg-[#1a1a1a] p-6">
            <p className="text-[#d4af37] text-xs font-bold uppercase tracking-widest mb-2">Upfront fee</p>
            <p className="font-[var(--font-accent)] text-3xl font-bold">$0</p>
            <p className="text-sm text-[#aaaaaa] mt-2">for the initial pilot</p>
          </div>
          <div className="border border-[#2a2a2a] bg-[#1a1a1a] p-6">
            <p className="text-[#d4af37] text-xs font-bold uppercase tracking-widest mb-2">Reconciliation</p>
            <p className="font-[var(--font-accent)] text-3xl font-bold">Monthly</p>
            <p className="text-sm text-[#aaaaaa] mt-2">confirmed seated referrals only</p>
          </div>
        </section>

        <section className="space-y-8 mb-12">
          <div>
            <h2 className="font-[var(--font-accent)] text-2xl md:text-3xl font-bold mb-4">How it works</h2>
            <ol className="space-y-4 text-[#cccccc] leading-relaxed list-decimal pl-6">
              <li>We agree on your restaurant profile, visitor fit, referral code, and seated-guest fee.</li>
              <li>We recommend your restaurant only when it fits the visitor’s stated needs and disclose that you are a Dining Partner.</li>
              <li>The visitor reserves through your normal reservation channel or through our planning assistance.</li>
              <li>We track the referred party using the partner referral code and reservation details.</li>
              <li>At month-end, we reconcile which referred guests actually seated. Only confirmed seated guests are billable.</li>
            </ol>
          </div>

          <div>
            <h2 className="font-[var(--font-accent)] text-2xl md:text-3xl font-bold mb-4">What counts as a billable referral?</h2>
            <div className="border border-[#2a2a2a] bg-[#1a1a1a] p-7 text-[#cccccc] leading-relaxed space-y-3">
              <p><strong className="text-[#fdfbf7]">Billable:</strong> a guest or party we referred who is confirmed by the restaurant as seated.</p>
              <p><strong className="text-[#fdfbf7]">Not billable:</strong> clicks, recommendation views, cancellations, no-shows, duplicate reservations, or guests the restaurant can reasonably show were already booked before our referral.</p>
              <p><strong className="text-[#fdfbf7]">Party size:</strong> the fee is based on the confirmed number of guests actually seated, not the original reservation size.</p>
            </div>
          </div>

          <div>
            <h2 className="font-[var(--font-accent)] text-2xl md:text-3xl font-bold mb-4">What we need from a partner</h2>
            <ul className="grid sm:grid-cols-2 gap-3 text-sm text-[#cccccc]">
              {[
                "Restaurant name and primary contact",
                "Reservation link or preferred booking method",
                "Cuisine and neighborhood",
                "Typical group sizes you want",
                "Useful fit information for visitors",
                "Any age, dress, accessibility, or timing constraints",
                "Optional visitor perk",
                "A monthly confirmation of seated referrals",
              ].map((item) => (
                <li key={item} className="border border-[#2a2a2a] bg-[#1a1a1a] p-4">{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border border-[#d4af37] bg-[#1a1a1a] p-7 md:p-9 mb-10">
          <h2 className="font-[var(--font-accent)] text-2xl font-bold mb-3">Start the pilot</h2>
          <p className="text-[#cccccc] mb-6 leading-relaxed">
            Call or text Welcome to New Orleans Tours. We can set up the first partner manually and keep the pilot simple while we prove the referrals.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href="tel:+15044849687" className="inline-flex justify-center bg-[#d4af37] text-[#151515] font-bold px-6 py-4 uppercase tracking-wider text-sm">
              Call 504-484-9687
            </a>
            <a href="sms:+15044849687" className="inline-flex justify-center border border-[#d4af37] text-[#d4af37] font-bold px-6 py-4 uppercase tracking-wider text-sm">
              Text About Partnership
            </a>
          </div>
        </section>

        <div className="mb-10">
          <RestaurantOrientationAd />
        </div>

        <p className="text-xs text-[#888888] leading-relaxed mb-8">
          Pilot terms are subject to a restaurant-specific agreement. Restaurants remain responsible for their own reservations, service, guest policies, pricing, taxes, and fulfillment. Paid partner status is disclosed to visitors.
        </p>

        <Link href="/new-orleans/food" className="text-[#d4af37] font-bold text-sm underline underline-offset-4">
          Back to dining help
        </Link>
      </div>
    </main>
  );
}
