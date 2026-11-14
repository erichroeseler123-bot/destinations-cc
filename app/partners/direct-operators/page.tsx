import type { Metadata } from "next";
import Link from "next/link";
import DirectOperatorApplicationForm from "./DirectOperatorApplicationForm";

export const metadata: Metadata = {
  title:
    "Direct Tour, Aviation & Shuttle Operator Partnerships (10% Direct / 5% Machine) | Destination Command Center",
  description:
    "Connect your hosted FareHarbor, Rezgo, Rezdy, OCTO, or direct reservation system in Juneau, New Orleans, or Colorado Transportation on transparent 10% completed-booking terms.",
};

export default function DirectOperatorsPartnerPage() {
  return (
    <main
      data-testid="direct-operators-partner-page"
      className="min-h-screen bg-zinc-950 px-6 py-14 text-white"
    >
      <div className="mx-auto max-w-5xl space-y-12">
        {/* Hero */}
        <header className="space-y-4 border-b border-white/10 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
            Direct Operator Program · Zero Setup Fee · Operator Remains MoR
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
            Keep 90%–95% of Every Port-Verified Direct Booking.
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-zinc-300">
            Destination Command Center (DCC) and our specialist destination
            desks — across <strong>Juneau</strong> (Juneau Flight Deck &amp; Last
            Frontier Shore Excursions), <strong>New Orleans</strong> (Welcome to
            New Orleans Tours), <strong>Colorado Transportation</strong> (DEN /
            I-70 &amp; Red Rocks corridors), and{" "}
            <strong>Cruise Promenade</strong> — pre-screen travelers against
            berth schedules, flight arrival buffers, cabin weight rules, and
            ski/luggage constraints before sending high-intent guests directly
            to your connected API or hosted checkout.
          </p>
        </header>

        {/* Transparent 2-Tier Direct Economics */}
        <section
          aria-labelledby="economics-heading"
          className="grid gap-5 md:grid-cols-3"
        >
          <div className="rounded-2xl border border-emerald-400/35 bg-emerald-500/10 p-6">
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-300">
              Route 2 · DCC-Sourced Direct
            </div>
            <div className="mt-2 text-3xl font-black text-white">10% Net</div>
            <p className="mt-2 text-xs leading-relaxed text-emerald-100/90">
              Earned strictly on completed, fulfilled bookings referred directly
              from DCC or our specialist destination desks (vs. 20%–30% standard
              OTA commissions).
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-400/35 bg-cyan-500/10 p-6">
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-300">
              Route 3 · Machine &amp; Planner Distributed
            </div>
            <div className="mt-2 text-3xl font-black text-white">5% Net</div>
            <p className="mt-2 text-xs leading-relaxed text-cyan-100/90">
              Earned when a group Cruise Promenade shared itinerary or verified
              AI/machine decision receipt routes a pre-qualified party to your
              direct checkout.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-6">
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-amber-300">
              Zero Weather or Click Risk
            </div>
            <div className="mt-2 text-3xl font-black text-white">$0 / 0%</div>
            <p className="mt-2 text-xs leading-relaxed text-zinc-300">
              <strong>$0 setup fee</strong>, <strong>$0 monthly fee</strong>,
              and <strong>0% commission</strong> on searches, unbooked holds,
              cloud-ceiling/weather groundings, or refunded port calls.
            </p>
          </div>
        </section>

        {/* Governance & Merchant-of-Record Guarantees */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
          <h2 className="text-xl font-black text-white">
            How Direct Operator Checkout &amp; Fit Neutrality Work
          </h2>
          <div className="grid gap-4 text-xs leading-relaxed text-zinc-300 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/35 p-4">
              <strong className="block text-sm text-white">
                1. You Remain Merchant of Record
              </strong>
              <p className="mt-1">
                Guests complete payment on your existing FareHarbor ASN
                lightframe, Rezgo, Rezdy, OCTO, or custom checkout. You control
                your live inventory, waivers, weight manifests, and refund
                execution. For tracked hosted-checkout referrals, you receive the
                customer payment and DCC invoices only the written, agreed
                commission afterward.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/35 p-4">
              <strong className="block text-sm text-white">
                2. 100% Commission-Neutral Fit Evaluation
              </strong>
              <p className="mt-1">
                Commercial rates never influence DCC&apos;s deterministic timing
                or suitability engine (<code>influencesFitOrRanking: false</code>
                ). If a cruise ship&apos;s berth window is too tight for a tour,
                we warn the traveler upfront — reducing costly dockside
                no-shows and refund disputes.
              </p>
            </div>
          </div>
        </section>

        {/* Self-Serve Intake Form */}
        <section aria-labelledby="apply-heading" className="space-y-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">
              Self-Serve Partner Intake · Human-Verified Activation
            </div>
            <h2 id="apply-heading" className="mt-1 text-2xl font-black">
              Start Your Direct Operator Review
            </h2>
            <p className="mt-1 text-sm text-zinc-300">
              Submit your operator details below. Every application enters{" "}
              <code>pending_review</code> so we can confirm exact SKU mapping,
              pickup stops, and refund terms with you before enabling live
              attributed referrals.
            </p>
          </div>

          <DirectOperatorApplicationForm />
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-zinc-400">
          <span>
            Destination Command Center · Independent Port Timing &amp; Fit
            Assurance
          </span>
          <Link href="/" className="text-cyan-300 hover:underline">
            ← Return to Destination Command Center
          </Link>
        </footer>
      </div>
    </main>
  );
}
