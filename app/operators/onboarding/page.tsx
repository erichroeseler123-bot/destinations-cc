import type { Metadata } from "next";
import Link from "next/link";
import OperatorOnboardingForm from "./OperatorOnboardingForm";
import {
  DCC_HOMEPAGE_OPERATOR_MESSAGE,
  GOSNO_DIRECT_PILOT_MANIFEST,
  NATIVE_PROVIDER_API_PROFILES,
  getOperatorManifest,
} from "@/lib/dcc/operators";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Operator API Onboarding & Verification | 10% Direct Partnership | DCC",
  description:
    "Connect your authorized booking API to Destination Command Center. Proposed 10% commission on completed direct bookings after commercial agreement and technical verification.",
  alternates: { canonical: "/operators/onboarding" },
};

const VERIFICATION_GATES = [
  {
    id: "operator_authorization",
    label: "1. Operator Permission",
    desc: "Explicit authorization from the tour or transportation company.",
  },
  {
    id: "commercial_terms",
    label: "2. Agreed Commercial & Settlement Terms",
    desc: "Signed 10% direct commission and settlement agreement (kept separate from onboarding applications).",
  },
  {
    id: "verified_credentials",
    label: "3. Securely Arranged Credentials",
    desc: "Provider-approved API credentials arranged securely after review—never via public forms or email.",
  },
  {
    id: "product_mapping",
    label: "4. Exact Product & Option Mapping",
    desc: "Verified mapping between DCC references and the operator's native API product/option IDs.",
  },
  {
    id: "live_price_availability",
    label: "5. Current Prices & Live Availability",
    desc: "Live API responses verified for real-time seat inventory, schedules, and retail pricing.",
  },
  {
    id: "attribution_reporting",
    label: "6. Reliable Attribution & Outcome Reporting",
    desc: "End-to-end verification of booking references, confirmations, cancellations, and settlement reporting.",
  },
  {
    id: "policy_verification",
    label: "7. Cancellation & Cruise-Return Policies",
    desc: "Verified separately for direct bookings; Viator marketplace guarantees do not automatically carry over.",
  },
];

export default async function OperatorOnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<{ operator?: string }>;
}) {
  const sp = (await searchParams) || {};
  const prefilledOperator = sp.operator ? getOperatorManifest(sp.operator) : null;
  const pilot = GOSNO_DIRECT_PILOT_MANIFEST.directPilot!;

  return (
    <main className="min-h-screen bg-[#070b10] text-white">
      <div className="border-b border-white/10 bg-black/40 py-10 px-6 sm:px-10">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link href="/operators" className="text-xs font-bold text-cyan-300 hover:underline">
              ← Back to Operator Partnership Overview
            </Link>
            <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-0.5 text-xs font-mono font-bold text-cyan-300 uppercase tracking-widest">
              API-Only Direct Partnership Onboarding
            </span>
          </div>

          <h1 className="text-3xl font-black tracking-tight sm:text-5xl text-white">
            Operator API Onboarding &amp; Integration Verification
          </h1>

          <blockquote className="rounded-2xl border border-cyan-400/30 bg-cyan-950/20 p-5 text-base sm:text-lg font-bold text-white">
            “{DCC_HOMEPAGE_OPERATOR_MESSAGE}”
          </blockquote>

          <p className="text-sm text-zinc-300 max-w-3xl leading-6">
            Direct partnerships are API-only. Without an authorized API connection, we cannot switch an operator to direct bookings, and any existing verified Viator listings can continue through Viator. Submitting an onboarding application initiates technical and commercial review—it never automatically authorizes sales.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl py-10 px-6 sm:px-10 space-y-12">
        {/* Application Form */}
        <section className="rounded-3xl border border-cyan-500/30 bg-white/[0.025] p-6 sm:p-8 space-y-6">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-300">
              Step 1 · Operator Application (No API Secrets Collected Here)
            </span>
            <h2 className="mt-2 text-2xl font-black text-white">
              Submit Company, Booking System &amp; API Documentation Details
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              We welcome operators worldwide. Please provide your company contact details, destinations, reservation system, and API documentation link.
            </p>
          </div>

          <OperatorOnboardingForm
            initialCompanyName={prefilledOperator?.name || ""}
            initialWebsite={prefilledOperator?.website || ""}
            initialDestinations={prefilledOperator?.city || ""}
            initialBookingSystem={
              prefilledOperator?.detectedBookingSystem === "FareHarbor"
                ? "FareHarbor External API v1"
                : "Rezdy Native REST API v1"
            }
          />
        </section>

        {/* 7 Verification Gates Required Before Switching */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8 space-y-6">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-300">
              Step 2 · Mandatory Verification Gates Before Channel Cutover
            </span>
            <h2 className="mt-2 text-2xl font-black text-white">
              Required Verification Before Switching from Viator to Direct API
            </h2>
            <p className="mt-2 text-sm text-zinc-300 max-w-3xl leading-6">
              We keep an operator&apos;s existing verified Viator booking channel active until all seven verification gates pass. Commission never determines traveler suitability or recommendation ranking.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VERIFICATION_GATES.map((gate) => (
              <div
                key={gate.id}
                className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-2"
              >
                <p className="text-sm font-bold text-cyan-200">{gate.label}</p>
                <p className="text-xs text-zinc-300 leading-5">{gate.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* GoSno First Direct-Channel Pilot */}
        <section className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-black/40 to-cyan-950/20 p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-mono text-emerald-300 uppercase tracking-widest font-bold">
                {pilot.pilotLabel}
              </span>
              <h2 className="mt-1 text-2xl font-black text-white">
                GoSno · {pilot.bookingSystem}
              </h2>
            </div>
            <Link
              href="/operators/gosno"
              className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-1.5 text-xs font-bold text-emerald-200 hover:bg-emerald-400/20"
            >
              Inspect GoSno Pilot Profile →
            </Link>
          </div>

          <p className="text-sm text-zinc-300 leading-6">
            {pilot.pilotScopeSummary}
          </p>

          <div className="grid gap-4 md:grid-cols-2 text-xs">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-1.5">
              <strong className="text-emerald-300 block">
                1 · Existing GoSno Storefront Integration (gosno.co — Operational &amp; Unchanged):
              </strong>
              <span className="text-zinc-300 block">{pilot.workingCheckoutStatus}</span>
              <span className="text-cyan-200 font-mono block text-[11px]">
                Captured live: GET /.well-known/dcc (HTTP {pilot.storefrontIntegration.wellKnownStatus}) · GET /api/dcc/routes (HTTP {pilot.storefrontIntegration.routesCatalogStatus}, {pilot.storefrontIntegration.publishedPrivateSuvRouteCount} private SUV routes) · GET /api/availability (HTTP {pilot.storefrontIntegration.availabilityProbeStatus}, suv.available={String(pilot.storefrontIntegration.availabilityProbeResult.suvAvailable)}, van.quoteOnly={String(pilot.storefrontIntegration.availabilityProbeResult.vanQuoteOnly)})
              </span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-1.5">
              <strong className="text-amber-300 block">
                2 · New DCC 10% Direct-Channel Pilot (DCC-Side Verification — Pending):
              </strong>
              <span className="text-zinc-300 block">
                All DCC-side pilot gates (operator authorization, DCC-provisioned Rezdy API credentials, DCC-side product mapping, live price/availability queries inside DCC, 10% commercial addendum, and settlement reporting) remain <code className="text-amber-200">{pilot.verificationChecklist.productMapping}</code> until DCC-side integration credentials and end-to-end tests are completed.
              </span>
            </div>
          </div>
        </section>

        {/* Native Provider API Profiles */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8 space-y-6">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-300">
              Inspected Provider Documentation
            </span>
            <h2 className="mt-2 text-xl sm:text-2xl font-black text-white">
              Provider-Specific API Architectures (Not All Systems Use OCTO)
            </h2>
            <p className="mt-1 text-xs text-zinc-400 max-w-3xl leading-5">
              We inspect the actual API documentation for each booking system rather than assuming FareHarbor, Bókun, Rezdy, and other native APIs all use OCTO endpoints.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {NATIVE_PROVIDER_API_PROFILES.map((spec) => (
              <div key={spec.provider} className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-2 text-xs">
                <p className="font-bold text-white text-sm">{spec.provider}</p>
                <p className="text-cyan-300 font-mono">{spec.protocolType}</p>
                <p className="text-zinc-300">
                  <strong>Auth:</strong> {spec.authMechanism}
                </p>
                <p className="text-emerald-300 font-mono">{spec.catalogAndAvailabilityEndpoints}</p>
                <p className="text-zinc-400">{spec.bookingAndAttributionNotes}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
