import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/app/components/dcc/JsonLd";
import SeasonalOperatorPage from "../SeasonalOperatorPage";
import {
  DCC_OPERATOR_PAGE_DIRECT_OFFER_MESSAGE,
  getOperatorManifest,
  listOperatorSlugs,
} from "@/lib/dcc/operators";
import { buildBreadcrumbJsonLd, buildOperatorJsonLd } from "@/lib/dcc/jsonld";

export function generateStaticParams() {
  return listOperatorSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const operator = getOperatorManifest(slug);
  if (!operator) return { title: "Operator | Destination Command Center" };

  return {
    title: operator.isSeasonal
      ? `${operator.name} | Tours, Planning & Booking Options | DCC`
      : `${operator.name} (${operator.city}) | Verified Tours & Operator Profile | DCC`,
    description: operator.isSeasonal
      ? `${operator.name} in ${operator.city}. Compare selected experiences, check departure details, and find official booking options with dated sources.`
      : `${operator.name} in ${operator.city}. View official website, verified Viator product links, and DCC's 10% direct API partnership option.`,
    alternates: { canonical: `/operators/${slug}` },
  };
}

export default async function OperatorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const operator = getOperatorManifest(slug);
  if (!operator) notFound();
  if (operator.isSeasonal) return <SeasonalOperatorPage operator={operator} />;

  const isDirectPilot = operator.currentBookingChannel === "direct_pilot" && operator.directPilot;

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            buildOperatorJsonLd({
              path: `/operators/${slug}`,
              name: operator.name,
              city: operator.city,
              website: operator.website,
              phone: operator.phone,
              areasServed: operator.areasServed,
            }),
            buildBreadcrumbJsonLd([
              { name: "Home", item: "/" },
              { name: "For tour operators", item: "/operators" },
              { name: operator.name, item: `/operators/${slug}` },
            ]),
          ],
        }}
      />

      <div className="mx-auto max-w-5xl space-y-10 px-6 py-14">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/65">
          <Link href="/operators" className="text-cyan-300 hover:underline font-bold">
            ← All Tour Operators &amp; 10% Direct API Partnership
          </Link>
          <span>Commission never determines traveler suitability or recommendation ranking.</span>
        </div>

        {/* Operator Header */}
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(7,11,25,0.98))] p-8 shadow-2xl md:p-10 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-200">
              {operator.city}
            </span>
            {isDirectPilot ? (
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-200">
                First Direct-Channel Pilot · {operator.directPilot!.bookingSystem}
              </span>
            ) : (
              <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-200">
                Current Booking Channel: Viator (Verified Active Products)
              </span>
            )}
          </div>

          <h1 className="text-3xl font-black tracking-tight md:text-5xl text-white">
            {operator.name}
          </h1>

          <p className="max-w-3xl text-base md:text-lg leading-8 text-white/80">
            {operator.overview}
          </p>

          <div className="flex flex-wrap gap-3 pt-2 text-sm">
            <a
              href={operator.website}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 font-bold text-cyan-200 hover:bg-white/[0.12] transition"
            >
              Official Website: {operator.website} ↗
            </a>
            {operator.phone ? (
              <span className="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-white/75">
                Phone: {operator.phone}
              </span>
            ) : null}
            {operator.supplierReference ? (
              <span className="rounded-xl border border-cyan-400/20 bg-cyan-950/30 px-4 py-2.5 font-mono text-xs text-cyan-200">
                Viator Supplier Ref: {operator.supplierReference}
              </span>
            ) : null}
          </div>

          {!isDirectPilot ? (
            <p className="text-xs leading-6 text-white/65 border-t border-white/10 pt-4">
              <strong>Channel Disclosure:</strong> The tours listed on this page are currently booked through Viator using the exact, unmodified <code className="text-cyan-200">productUrl</code> returned by Viator&apos;s Partner API v2 and matched to {operator.name}&apos;s supplier record (<code className="text-cyan-200">{operator.supplierReference}</code>). Displaying these verified Viator listings does not imply {operator.name} has already entered a direct API partnership with DCC.
            </p>
          ) : null}
        </header>

        {/* Direct Partnership Offer (on Viator-channeled operator pages) */}
        {!isDirectPilot ? (
          <section
            aria-labelledby="direct-partnership-offer-heading"
            className="rounded-3xl border border-cyan-400/35 bg-gradient-to-br from-cyan-950/30 via-black/50 to-emerald-950/20 p-6 sm:p-8 space-y-4"
          >
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-300">
              For {operator.name} Management &amp; Distribution Team
            </span>
            <h2 id="direct-partnership-offer-heading" className="text-xl sm:text-2xl font-black text-white">
              Direct API Booking Option (Proposed 10% Commission)
            </h2>
            <blockquote className="rounded-2xl border border-cyan-400/25 bg-black/40 p-5 text-base sm:text-lg font-semibold leading-7 text-white">
              “{DCC_OPERATOR_PAGE_DIRECT_OFFER_MESSAGE}”
            </blockquote>
            <p className="text-xs leading-6 text-white/70">
              The proposed 10% commission applies solely to our proposed direct agreement on completed direct bookings generated through DCC. It does not change Viator&apos;s commission structure or guarantee a specific savings amount. Direct bookings require explicit operator permission, provider-approved API access, agreed commercial terms, and a verified technical integration. Operators can keep all existing sales channels, and commission never affects traveler suitability or recommendation ranking.
            </p>
            <div className="pt-2">
              <Link
                href={`/operators/onboarding?operator=${encodeURIComponent(operator.slug)}`}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-xs font-black uppercase tracking-wider text-black hover:bg-cyan-300 transition"
              >
                <span>Connect Your Booking API (Operator Onboarding)</span>
                <span>→</span>
              </Link>
            </div>
          </section>
        ) : (
          /* GoSno Direct Pilot Section */
          <section className="rounded-3xl border border-emerald-400/35 bg-emerald-950/20 p-6 sm:p-8 space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-300">
              {operator.directPilot!.pilotLabel}
            </span>
            <h2 className="text-2xl font-black text-white">
              Existing GoSno Storefront vs. New DCC 10% Direct-Channel Pilot
            </h2>
            <p className="text-sm leading-6 text-white/80">
              {operator.directPilot!.pilotScopeSummary}
            </p>
            <div className="grid gap-4 md:grid-cols-2 pt-2">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-3">
                <p className="text-xs font-mono font-bold uppercase text-emerald-300">
                  1 · Existing GoSno Storefront Integration (gosno.co — Operational &amp; Unchanged)
                </p>
                <p className="text-xs text-white/75 leading-5">
                  {operator.directPilot!.workingCheckoutStatus}
                </p>
                <div className="rounded-xl border border-white/10 bg-black/50 p-3 text-[11px] font-mono text-white/75 space-y-1">
                  <p className="text-cyan-300 font-bold">
                    Captured Live Endpoint Evidence ({operator.directPilot!.storefrontIntegration.capturedAt}):
                  </p>
                  <p>
                    • GET /.well-known/dcc → HTTP {operator.directPilot!.storefrontIntegration.wellKnownStatus} ({operator.directPilot!.storefrontIntegration.legalName}, {operator.directPilot!.storefrontIntegration.operatingAuthority})
                  </p>
                  <p>
                    • GET /api/dcc/routes → HTTP {operator.directPilot!.storefrontIntegration.routesCatalogStatus} ({operator.directPilot!.storefrontIntegration.publishedPrivateSuvRouteCount} private SUV routes, e.g. {operator.directPilot!.storefrontIntegration.sampleRouteMapping.routeId} → {operator.directPilot!.storefrontIntegration.sampleRouteMapping.rezdyProductCode})
                  </p>
                  <p>
                    • GET /api/availability ({operator.directPilot!.storefrontIntegration.availabilityProbeResult.date}) → HTTP {operator.directPilot!.storefrontIntegration.availabilityProbeStatus} (suv.available={String(operator.directPilot!.storefrontIntegration.availabilityProbeResult.suvAvailable)}, van.quoteOnly={String(operator.directPilot!.storefrontIntegration.availabilityProbeResult.vanQuoteOnly)})
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs pt-1">
                  <a
                    href={operator.directPilot!.workingCheckoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-cyan-300 underline"
                  >
                    Open GoSno Checkout →
                  </a>
                  <a
                    href={operator.directPilot!.wellKnownEndpointUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-white/70 underline"
                  >
                    Inspect /.well-known/dcc →
                  </a>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-3">
                <p className="text-xs font-mono font-bold uppercase text-amber-300">
                  2 · New DCC 10% Direct-Channel Pilot Status (DCC-Side Integration — Pending)
                </p>
                <ul className="space-y-1.5 text-xs text-white/75">
                  <li>
                    • <strong>Operator Permission &amp; DCC-Side Rezdy API Access:</strong>{" "}
                    <span className="text-amber-300 font-mono uppercase">
                      {operator.directPilot!.verificationChecklist.operatorAuthorization} / {operator.directPilot!.verificationChecklist.providerApprovedApiAccess}
                    </span>
                  </li>
                  <li>
                    • <strong>DCC Product Mapping &amp; Live Price/Availability:</strong>{" "}
                    <span className="text-amber-300 font-mono uppercase">
                      {operator.directPilot!.verificationChecklist.productMapping} / {operator.directPilot!.verificationChecklist.livePricesAndAvailability}
                    </span>
                  </li>
                  <li>
                    • <strong>10% Direct Commercial Addendum &amp; Outcome Reporting:</strong>{" "}
                    <span className="text-amber-300 font-mono uppercase">
                      {operator.directPilot!.verificationChecklist.agreedCommercialTerms} / {operator.directPilot!.verificationChecklist.bookingAttributionAndOutcomeReporting}
                    </span>
                  </li>
                  <li>
                    • <strong>Separate Direct Cancellation Policy Verification:</strong>{" "}
                    <span className="text-amber-300 font-mono uppercase">
                      {operator.directPilot!.verificationChecklist.cancellationAndReturnPolicyVerifiedSeparately}
                    </span>
                  </li>
                </ul>
                <ul className="border-t border-white/10 pt-2.5 space-y-1 text-[11px] text-white/60 leading-5">
                  {Object.values(operator.directPilot!.verificationNotes).map((note) => (
                    <li key={note}>• {note}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* Verified Active Viator Products */}
        {operator.verifiedViatorProducts.length > 0 ? (
          <section aria-labelledby="verified-products-heading" className="space-y-6">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-300">
                Verified Viator API Catalog · Status: ACTIVE
              </span>
              <h2 id="verified-products-heading" className="mt-2 text-2xl sm:text-3xl font-black text-white">
                Verified Viator Products for {operator.name}
              </h2>
              <p className="mt-2 text-sm text-white/70 leading-6">
                Each product below is verified active in Viator&apos;s Partner API v2, matched to {operator.name}&apos;s supplier record (<code className="text-cyan-200">{operator.supplierReference}</code>), verified against its primary destination, and preserves the exact <code className="text-cyan-200">productUrl</code> returned by Viator&apos;s API. Current departure availability, final pricing, and applicable booking terms are confirmed on Viator at checkout.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {operator.verifiedViatorProducts.map((product) => (
                <article
                  key={product.productCode}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-52 w-full bg-black/50 overflow-hidden border-b border-white/10">
                      <img
                        src={product.coverImageUrl}
                        alt={`${product.title} — ${product.supplierName}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <span className="absolute top-3 left-3 rounded-full bg-black/80 border border-white/15 px-3 py-1 text-[11px] font-mono text-cyan-200">
                        Code: {product.productCode} · {product.status}
                      </span>
                    </div>

                    <div className="p-6 space-y-3">
                      <p className="text-xs font-mono text-white/55">
                        Supplier: {product.supplierName} ({product.supplierReference}) · Destination: {product.verifiedDestination.name}
                        {product.verifiedDestination.parentRegionName ? `, ${product.verifiedDestination.parentRegionName}` : ""} (#{product.verifiedDestination.destinationId})
                      </p>
                      <h3 className="text-xl font-bold text-white leading-snug">
                        {product.title}
                      </h3>
                      <p className="text-sm leading-6 text-white/75">
                        {product.summary}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-3 border-t border-white/10 flex flex-col gap-2">
                    <a
                      href={product.productUrl}
                      target="_blank"
                      rel="sponsored noopener noreferrer"
                      className="w-full rounded-xl bg-amber-300 px-5 py-3 text-center text-xs font-black uppercase tracking-wider text-black hover:bg-amber-200 transition"
                    >
                      Check Current Dates &amp; Prices on Viator →
                    </a>
                    <span className="text-[11px] text-white/50 text-center">
                      Booked via Viator · Preserved API productUrl · Confirm live schedule, price, and cancellation terms on Viator
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {/* Specialties & Areas Served */}
        {(operator.specialties?.length || operator.areasServed?.length) ? (
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 grid gap-6 md:grid-cols-2">
            {operator.specialties && operator.specialties.length > 0 ? (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-300">
                  Tour Formats &amp; Specialties
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {operator.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="rounded-full border border-white/12 bg-black/30 px-3 py-1 text-xs text-white/80"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {operator.areasServed && operator.areasServed.length > 0 ? (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-300">
                  Operating Areas
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {operator.areasServed.map((area) => (
                    <span
                      key={area}
                      className="rounded-full border border-white/12 bg-black/30 px-3 py-1 text-xs text-white/80"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
