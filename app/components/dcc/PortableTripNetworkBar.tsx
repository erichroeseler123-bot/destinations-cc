import React from "react";
import {
  SHARED_MARKET_TEMPLATES,
  appendPortableTripDetailsToUrl,
  buildSecondPurchaseRecommendations,
  extractPortableTripDetailsFromSearchParams,
  type PortableNetworkTripDetails,
  type SharedMarketId,
} from "@/lib/dcc/sharedMarketTemplate";

export interface PortableTripNetworkBarProps {
  marketId: SharedMarketId;
  searchParams?: Record<string, string | string[] | undefined>;
  defaultDate?: string;
  defaultPartySize?: number;
  defaultPickupHub?: string | null;
  defaultDestination?: string | null;
  defaultShipName?: string | null;
  defaultBerthCode?: string | null;
  defaultAllAboard?: string | null;
  precomputedTrip?: PortableNetworkTripDetails;
}

export default function PortableTripNetworkBar({
  marketId,
  searchParams,
  defaultDate,
  defaultPartySize,
  defaultPickupHub,
  defaultDestination,
  defaultShipName,
  defaultBerthCode,
  defaultAllAboard,
  precomputedTrip,
}: PortableTripNetworkBarProps) {
  const template = SHARED_MARKET_TEMPLATES[marketId];
  const trip =
    precomputedTrip ??
    extractPortableTripDetailsFromSearchParams(searchParams, {
      market: marketId,
      defaultDate,
      defaultPartySize,
      defaultPickupHub,
      defaultDestination,
      defaultShipName,
      defaultBerthCode,
      defaultAllAboard,
    });

  const primaryStorefrontPortableHref = appendPortableTripDetailsToUrl(
    template.storefrontSurface.primaryStorefrontEntryUrl,
    trip,
    {
      targetMarket: marketId,
      advancePurchaseStep: false,
      includeBase64DccCtx: true,
    },
  );

  const secondPurchases = buildSecondPurchaseRecommendations(marketId, trip);

  return (
    <section
      data-testid="dcc-portable-trip-network-bar"
      data-market-id={marketId}
      data-dcc-ctx={trip.contextId}
      className="my-6 rounded-2xl border border-cyan-500/35 bg-slate-900/90 p-5 text-slate-100 shadow-lg"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-cyan-300">
              Shared Market Template • {template.marketLabel}
            </span>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] text-emerald-300">
              {trip.contextId}
            </span>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-200">
              Purchase Step #{trip.purchaseStep}
            </span>
          </div>
          <h2 className="mt-2 text-lg font-bold text-white">
            Portable Trip Details Pass — Use Across Storefronts Without Starting Over
          </h2>
          <p className="mt-0.5 text-xs text-slate-300">
            Your date, group size, pickup/berth, and {template.dccAuthority.safetyBufferFloorMinutes}-minute safety buffer travel with{" "}
            <code className="text-cyan-300">{trip.contextId}</code> from Purchase #1 into Purchase #2 across the network.
          </p>
        </div>

        <a
          href={primaryStorefrontPortableHref}
          data-testid="dcc-portable-primary-storefront-cta"
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-slate-950 transition hover:bg-cyan-300"
        >
          Carry Trip to {template.storefrontSurface.primaryStorefrontDomain} →
        </a>
      </div>

      {/* Carried Trip Summary Pills */}
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-1 text-slate-200">
          <strong className="text-slate-400">Date:</strong> {trip.date}
        </span>
        <span className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-1 text-slate-200">
          <strong className="text-slate-400">Party Size:</strong> {trip.partySize}{" "}
          {trip.partySize === 1 ? "traveler" : "travelers"}
        </span>
        {trip.pickupHub && (
          <span className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-1 text-slate-200">
            <strong className="text-slate-400">Pickup / Origin:</strong> {trip.pickupHub}
          </span>
        )}
        {trip.destinationResortOrVenue && (
          <span className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-1 text-slate-200">
            <strong className="text-slate-400">Destination:</strong>{" "}
            {trip.destinationResortOrVenue}
          </span>
        )}
        {trip.shipName && (
          <span className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-1 text-slate-200">
            <strong className="text-slate-400">Ship:</strong> {trip.shipName}
            {trip.berthCode ? ` (${trip.berthCode})` : ""}
          </span>
        )}
        {trip.confirmedAllAboardLocal && (
          <span className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-1 text-slate-200">
            <strong className="text-slate-400">All-Aboard:</strong>{" "}
            {trip.confirmedAllAboardLocal}
          </span>
        )}
        {trip.skiBagsCount !== null && (
          <span className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-1 text-slate-200">
            <strong className="text-slate-400">Ski/Board Bags:</strong>{" "}
            {trip.skiBagsCount}
          </span>
        )}
        {trip.partnerId && (
          <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-200">
            <strong className="text-emerald-300">Partner Desk:</strong>{" "}
            {trip.partnerId}
          </span>
        )}
        <span className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1 text-cyan-200">
          <strong className="text-cyan-300">Safety Buffer:</strong>{" "}
          {template.dccAuthority.safetyBufferFloorMinutes}m floor
        </span>
      </div>

      {/* 5-Stage Responsibility Strip */}
      <div className="mt-4 grid gap-2 sm:grid-cols-5">
        <div className="rounded-xl border border-white/10 bg-black/25 p-2.5 text-xs">
          <div className="font-bold uppercase tracking-wider text-cyan-300">
            1. DCC Authority
          </div>
          <p className="mt-1 text-[11px] text-slate-300">
            {template.dccAuthority.safetyBufferSummary}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/25 p-2.5 text-xs">
          <div className="font-bold uppercase tracking-wider text-cyan-300">
            2. Partner & Recovery
          </div>
          <p className="mt-1 text-[11px] text-slate-300">
            {template.partnerAndRecovery.supportedPartnerRoles.join(" + ")} •{" "}
            {template.partnerAndRecovery.liveRecoveryEvaluatorSymbol}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/25 p-2.5 text-xs">
          <div className="font-bold uppercase tracking-wider text-cyan-300">
            3. Storefront Fit
          </div>
          <p className="mt-1 text-[11px] text-slate-300">
            {template.storefrontSurface.primaryStorefrontDomain} (
            {template.storefrontSurface.continuityCookieName})
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/25 p-2.5 text-xs">
          <div className="font-bold uppercase tracking-wider text-cyan-300">
            4. Checkout & Ledger
          </div>
          <p className="mt-1 text-[11px] text-slate-300">
            {template.checkoutAndLedger.monetizationModel === "owned_operated"
              ? "Owned & Operated Fleet (100% gross)"
              : "Partner Commission (10% direct / ASN)"}{" "}
            • 15m hold
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/25 p-2.5 text-xs">
          <div className="font-bold uppercase tracking-wider text-cyan-300">
            5. Multi-Purchase
          </div>
          <p className="mt-1 text-[11px] text-slate-300">
            Carries <code className="text-emerald-300">dcc_ctx_</code> into companion & cross-site bookings.
          </p>
        </div>
      </div>

      {/* Purchase #2 Recommendations */}
      <div className="mt-4 border-t border-white/10 pt-4">
        <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
          Use Your Portable Trip Details for a 2nd Purchase Across the Network
        </div>
        <div className="mt-2.5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {secondPurchases.map((rec) => (
            <div
              key={rec.id}
              data-testid={`dcc-second-purchase-${rec.id}`}
              className="flex flex-col justify-between rounded-xl border border-white/15 bg-slate-950/75 p-3.5"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                  <span className="font-semibold text-cyan-300">
                    {rec.targetDomain}
                  </span>
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase text-slate-300">
                    {rec.relationship === "cross_site_network"
                      ? "Cross-Site Network"
                      : "Same-Market Companion"}
                  </span>
                </div>
                <div className="mt-1 text-xs font-bold text-white">
                  {rec.label}
                </div>
                <p className="mt-1 text-[11px] text-slate-300">
                  {rec.whyItFitsNext}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 pt-2">
                <span className="font-mono text-[10px] text-slate-400">
                  Carries: {rec.reusedTripFields.join(", ")}
                </span>
                <a
                  href={rec.portableHref}
                  className="rounded-lg bg-emerald-400 px-3 py-1.5 text-[11px] font-bold text-slate-950 hover:bg-emerald-300"
                >
                  Open Purchase #2 →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
