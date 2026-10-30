import type { Metadata } from "next";
import Link from "next/link";
import {
  DCC_HOMEPAGE_OPERATOR_MESSAGE,
  GOSNO_DIRECT_PILOT_MANIFEST,
  NATIVE_PROVIDER_API_PROFILES,
  VERIFIED_DCC_OPERATORS,
} from "@/lib/dcc/operators";

export const metadata: Metadata = {
  title: "For Tour Operators | 10% Direct API Partnership | Destination Command Center",
  description:
    "It’s time tour operators kept more of every booking. Connect your existing booking system to DCC through an authorized API. Our commission is 10% on completed direct bookings we generate.",
  alternates: { canonical: "/operators" },
};

export default function OperatorsDirectoryPage() {
  const pilot = GOSNO_DIRECT_PILOT_MANIFEST.directPilot!;

  return (
    <main className="min-h-screen bg-[#070b10] text-white">
      {/* Hero: Operator Partnership Offer & Worldwide Eligibility */}
      <section className="border-b border-white/10 bg-gradient-to-b from-cyan-950/20 via-black/40 to-transparent">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-200">
              For Tour &amp; Transportation Operators Worldwide
            </span>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300">
              10% Direct API Commission Model
            </span>
          </div>

          <h1 className="mt-6 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl text-white max-w-4xl leading-tight">
            Direct API Partnerships for Tour Operators
          </h1>

          <blockquote className="mt-6 max-w-4xl rounded-2xl border border-cyan-400/30 bg-cyan-950/25 p-6 sm:p-8 text-lg sm:text-2xl font-bold leading-relaxed text-white shadow-lg">
            “{DCC_HOMEPAGE_OPERATOR_MESSAGE}”
          </blockquote>

          <p className="mt-6 max-w-3xl text-base leading-7 text-white/75">
            Destination Command Center (DCC) is a source-backed travel decision engine that helps travelers check schedule constraints, logistics, and cited evidence before choosing how to spend their trip. We welcome tour, excursion, and transportation operators worldwide—while keeping global partnership eligibility distinct from our current curated destination coverage.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/operators/onboarding"
              className="rounded-xl bg-cyan-400 px-6 py-3.5 text-sm font-black uppercase tracking-wider text-black hover:bg-cyan-300 transition shadow-lg shadow-cyan-400/20"
            >
              Start Operator API Onboarding →
            </Link>
            <a
              href="#verified-operator-pages"
              className="rounded-xl border border-white/15 bg-white/[0.05] px-5 py-3.5 text-sm font-bold text-white hover:bg-white/[0.1] transition"
            >
              View Verified Operator Pages ↓
            </a>
            <a
              href="#gosno-direct-pilot"
              className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3.5 text-sm font-bold text-emerald-200 hover:bg-emerald-400/20 transition"
            >
              Inspect GoSno Direct-Channel Pilot ↓
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 space-y-16">
        {/* Core Principles: 5 Required Explanations */}
        <section aria-labelledby="how-partnership-works">
          <div className="max-w-3xl">
            <span className="text-xs font-black uppercase tracking-widest text-cyan-300">
              How Our Operator Partnership Works
            </span>
            <h2 id="how-partnership-works" className="mt-2 text-3xl font-black text-white">
              Clear Channel Attribution, Explicit Permission, and Neutral Decisions
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/70">
              We separate initial marketplace referrals from direct API connections, verify every integration against the provider&apos;s actual API documentation before switching channels, and never let commercial terms influence traveler suitability rankings.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <span className="text-xs font-mono font-bold uppercase text-cyan-300">1 · Worldwide Eligibility vs. Coverage</span>
              <h3 className="mt-2 text-lg font-bold text-white">We Welcome Operators Worldwide</h3>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Operators in any region can apply for a direct API connection. We keep global partnership availability distinct from DCC&apos;s current curated destination reference guides (currently live for Juneau, Red Rocks, the Denver–Breckenridge corridor, and New Orleans).
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <span className="text-xs font-mono font-bold uppercase text-cyan-300">2 · Initial Booking Channel</span>
              <h3 className="mt-2 text-lg font-bold text-white">Verified Viator Products First</h3>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Verified Viator products (matched by exact supplier reference and confirmed active via Viator&apos;s API) can provide the initial booking channel. Each page clearly discloses that bookings currently go through Viator and never implies the operator has already agreed to a direct partnership.
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <span className="text-xs font-mono font-bold uppercase text-cyan-300">3 · Requirements to Switch Direct</span>
              <h3 className="mt-2 text-lg font-bold text-white">Four Gates Before Direct Cutover</h3>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Switching from Viator to direct bookings requires: (1) explicit operator permission, (2) provider-approved API access, (3) signed commercial and settlement terms (the proposed 10% is separate from signed terms), and (4) a verified end-to-end integration.
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <span className="text-xs font-mono font-bold uppercase text-cyan-300">4 · Non-Exclusive Distribution</span>
              <h3 className="mt-2 text-lg font-bold text-white">Keep Your Existing Sales Channels</h3>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Operators keep their existing website checkout, Viator listings, OTAs, and local reseller relationships. Connecting an authorized booking API to DCC adds a direct booking option without requiring exclusivity.
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <span className="text-xs font-mono font-bold uppercase text-cyan-300">5 · Editorial Independence</span>
              <h3 className="mt-2 text-lg font-bold text-white">Commission Never Affects Ranking</h3>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Commission never determines traveler suitability or recommendation ranking. DCC evaluates schedules, transfer buffers, public/free alternatives, and operator options using the same neutral criteria regardless of booking channel.
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <span className="text-xs font-mono font-bold uppercase text-cyan-300">6 · Policy &amp; Guarantee Separation</span>
              <h3 className="mt-2 text-lg font-bold text-white">Separate Policy Verification</h3>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Cancellation terms and cruise-return policies are verified separately for each direct integration. Marketplace protections (such as Viator&apos;s Worry-free Shore Excursion guarantee) apply only to qualifying Viator bookings and do not automatically carry over to direct bookings.
              </p>
            </article>
          </div>
        </section>

        {/* GoSno Direct-Channel Pilot (Separate from Working Checkout) */}
        <section
          id="gosno-direct-pilot"
          aria-labelledby="gosno-pilot-heading"
          className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-black/50 to-cyan-950/20 p-6 sm:p-10 space-y-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300">
                  First Direct-Channel Pilot
                </span>
                <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-mono text-cyan-200">
                  {pilot.bookingSystem}
                </span>
              </div>
              <h2 id="gosno-pilot-heading" className="mt-3 text-2xl sm:text-3xl font-black text-white">
                GoSno ({GOSNO_DIRECT_PILOT_MANIFEST.city})
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/75">
                {pilot.pilotScopeSummary}
              </p>
            </div>
            <Link
              href="/operators/gosno"
              className="rounded-xl border border-emerald-400/40 bg-emerald-400/15 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-emerald-200 hover:bg-emerald-400/25 transition"
            >
              Open GoSno Operator Profile →
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
              <p className="text-xs font-mono font-bold uppercase text-emerald-300">
                1 · Working Production Checkout (Operational &amp; Unchanged)
              </p>
              <p className="mt-2 text-sm text-white/80 leading-6">
                {pilot.workingCheckoutStatus}
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs">
                <a
                  href={pilot.workingCheckoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-cyan-300 underline"
                >
                  gosno.co/denver-to-breckenridge →
                </a>
                <a
                  href={pilot.wellKnownEndpointUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-white/70 underline"
                >
                  gosno.co/.well-known/dcc →
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
              <p className="text-xs font-mono font-bold uppercase text-amber-300">
                2 · DCC 10% Direct-Channel Pilot Status (Evaluated Separately)
              </p>
              <ul className="mt-2 space-y-1.5 text-xs text-white/75">
                <li>
                  • <strong>Operator Authorization &amp; Rezdy API Access:</strong>{" "}
                  <span className="text-emerald-300 font-mono">Verified</span>
                </li>
                <li>
                  • <strong>Product Mapping &amp; Live Price/Availability:</strong>{" "}
                  <span className="text-emerald-300 font-mono">Verified (Rezdy REST API v1)</span>
                </li>
                <li>
                  • <strong>10% Direct Commercial Addendum &amp; Outcome Reporting:</strong>{" "}
                  <span className="text-amber-300 font-mono">Pilot Verification In Progress</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Verified Operator Pages on DCC */}
        <section id="verified-operator-pages" aria-labelledby="verified-operators-heading" className="space-y-6">
          <div className="max-w-3xl">
            <span className="text-xs font-black uppercase tracking-widest text-cyan-300">
              Verified DCC Operator Pages · Initial Viator Booking Channel
            </span>
            <h2 id="verified-operators-heading" className="mt-2 text-3xl font-black text-white">
              Operators Currently Featured Through Verified Viator Listings
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/70">
              We only list a company here when its DCC operator page, supplier identity (<code className="text-cyan-200">SUPPLIER-...</code>), and active Viator product links have been verified via Viator&apos;s API. These pages currently route bookings through Viator; none of the Viator-channeled operators below are claimed as enrolled direct API partners unless verified and switched.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {VERIFIED_DCC_OPERATORS.map((operator) => (
              <article
                key={operator.slug}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col justify-between hover:border-cyan-400/40 transition"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                      {operator.city}
                    </span>
                    <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-200">
                      Current Channel: Viator ({operator.verifiedViatorProducts.length} Verified Active)
                    </span>
                  </div>

                  <h3 className="mt-3 text-xl font-bold text-white">{operator.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/70">{operator.overview}</p>

                  <div className="mt-4 space-y-1 text-xs text-white/60">
                    <p>
                      Official Website:{" "}
                      <a
                        href={operator.website}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-cyan-300 underline"
                      >
                        {operator.website}
                      </a>
                    </p>
                    <p>
                      Verified Active Viator Products:{" "}
                      <span className="font-mono text-white/80">
                        {operator.verifiedViatorProducts.map((p) => p.productCode).join(", ")}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <Link
                    href={`/operators/${operator.slug}`}
                    className="rounded-lg bg-cyan-400 px-4 py-2 text-xs font-black uppercase tracking-wider text-black hover:bg-cyan-300 transition"
                  >
                    Open Verified DCC Page →
                  </Link>
                  <Link
                    href={`/operators/onboarding?operator=${encodeURIComponent(operator.slug)}`}
                    className="text-xs font-bold text-cyan-300 hover:text-cyan-200 underline"
                  >
                    Switch to 10% Direct API →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Provider-Specific Native API Verification (No Universal Compatibility Claims) */}
        <section aria-labelledby="provider-apis-heading" className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8 space-y-6">
          <div className="max-w-3xl">
            <span className="text-xs font-black uppercase tracking-widest text-cyan-300">
              Provider-Specific Technical Verification
            </span>
            <h2 id="provider-apis-heading" className="mt-2 text-2xl sm:text-3xl font-black text-white">
              Actual Reservation APIs — No Assumed Universal Compatibility
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Reservation systems use different native endpoints, authentication headers, and booking lifecycles. We do not assume FareHarbor, Bókun, Rezdy, and other native APIs all use OCTO endpoints, and we do not claim universal compatibility before inspecting the provider&apos;s documentation and verifying a live integration.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {NATIVE_PROVIDER_API_PROFILES.map((spec) => (
              <div key={spec.provider} className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-white">{spec.provider}</h3>
                  <span className="text-[11px] font-mono text-cyan-300">{spec.protocolType}</span>
                </div>
                <p className="text-xs text-white/65">
                  <strong className="text-white/85">Auth:</strong> {spec.authMechanism}
                </p>
                <p className="text-xs font-mono text-emerald-300/90">
                  {spec.catalogAndAvailabilityEndpoints}
                </p>
                <p className="text-xs text-white/65">{spec.bookingAndAttributionNotes}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
            <p className="text-sm text-white/75 max-w-2xl">
              Direct partnerships are API-only. If an operator does not have authorized API access, we cannot switch bookings to a direct connection, and existing verified listings can continue through Viator.
            </p>
            <Link
              href="/operators/onboarding"
              className="rounded-xl bg-cyan-400 px-5 py-3 text-xs font-black uppercase tracking-wider text-black hover:bg-cyan-300 transition"
            >
              Submit API Onboarding Details →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
