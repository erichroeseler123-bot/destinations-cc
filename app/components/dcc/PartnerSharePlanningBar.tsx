import {
  getPartnerShareLinksForMarket,
  PARTNER_SHARE_LINKS,
  resolvePartnerAttributionFromParams,
  type NetworkMarketId,
} from "@/lib/dcc/partnerShareLinks";

interface PartnerSharePlanningBarProps {
  market?: NetworkMarketId;
  activePartnerParam?: string | null;
  activePartnerRoleParam?: string | null;
  activeCancelRefParam?: string | null;
  activeTrafficSourceParam?: string | null;
}

export default function PartnerSharePlanningBar({
  market,
  activePartnerParam,
  activePartnerRoleParam,
  activeCancelRefParam,
  activeTrafficSourceParam,
}: PartnerSharePlanningBarProps) {
  const attribution = resolvePartnerAttributionFromParams({
    partner: activePartnerParam,
    partnerRole: activePartnerRoleParam,
    cancelRef: activeCancelRefParam,
    trafficSource: activeTrafficSourceParam,
  });

  const links = market
    ? getPartnerShareLinksForMarket(market)
    : [...PARTNER_SHARE_LINKS];

  return (
    <section
      data-testid="dcc-partner-share-planning-bar"
      data-partner-market={market || "all"}
      data-active-partner={attribution.partnerId || ""}
      data-active-partner-role={attribution.partnerRole || ""}
      className="rounded-3xl border border-indigo-400/30 bg-[#0b1120] p-6 md:p-7 space-y-5 shadow-xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-indigo-300">
            Partner Planning Links · Hotel Concierges · Cruise Planners · Flight Operators
          </p>
          <h2 className="mt-1 text-xl md:text-2xl font-black text-white">
            Shareable DCC Planning Links With Partner Attribution
          </h2>
        </div>
        {attribution.isPartnerAttributed ? (
          <span
            data-testid="dcc-partner-attribution-active-badge"
            className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3.5 py-1 text-xs font-bold text-emerald-200"
          >
            Partner Referral Tracked: {attribution.partnerId || "verified-partner"} (
            {attribution.partnerRole || "partner"})
          </span>
        ) : (
          <span className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-200">
            Tracks partnerId &amp; partnerRole through to storefront
          </span>
        )}
      </div>

      {attribution.isPartnerAttributed ? (
        <div
          data-testid="dcc-partner-guest-welcome-banner"
          className="rounded-2xl border border-emerald-400/35 bg-emerald-950/35 p-4 text-xs text-emerald-100 space-y-1"
        >
          <p className="font-black uppercase tracking-wider text-emerald-300">
            Guest Planning Session Shared by Partner ({attribution.partnerId})
          </p>
          <p className="text-white/85 leading-5">
            This DCC guide was shared with you by{" "}
            <strong>{attribution.partnerId}</strong> (
            <code>{attribution.partnerRole || "partner"}</code>) so you can verify
            timing, pickup, and vehicle/vessel fit before choosing your next step on
            the storefront.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {links.map((item) => (
          <article
            key={item.id}
            data-testid={`dcc-partner-link-card-${item.id}`}
            className="rounded-2xl border border-white/10 bg-black/45 p-4 flex flex-col justify-between space-y-3 text-xs"
          >
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full border border-indigo-400/30 bg-indigo-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-200">
                  {item.partnerRoleLabel} · {item.partnerId}
                </span>
                <span className="text-[11px] font-semibold text-emerald-300">
                  {item.monetizationModel === "owned_operated"
                    ? "Owned & Operated Service"
                    : "Partner Storefront Commission"}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">{item.partnerName}</h3>
              <p className="text-white/85 leading-5">
                <strong>Guest Answer:</strong> {item.guestQuestionAnswered}
              </p>
              <p className="text-white/65 leading-5">
                <strong>Why share:</strong> {item.whyPartnerSharesIt}
              </p>
              <div className="rounded-xl border border-white/10 bg-black/60 p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-indigo-300 font-bold">
                  Shareable Partner URL
                </p>
                <code
                  data-testid={`dcc-partner-share-url-${item.id}`}
                  className="mt-1 block break-all text-[11px] text-cyan-200"
                >
                  {item.shareableUrl}
                </code>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <a
                href={item.shareableUrl}
                data-testid={`dcc-open-partner-plan-${item.id}`}
                className="rounded-xl bg-indigo-400 px-3.5 py-2 text-[11px] font-black uppercase tracking-wider text-[#060b16] hover:bg-indigo-300 transition"
              >
                Open Partner Planning Link →
              </a>
              <a
                href={item.nextStepStorefrontUrl}
                data-testid={`dcc-partner-next-step-${item.id}`}
                className="rounded-xl border border-emerald-400/35 bg-emerald-500/15 px-3.5 py-2 text-[11px] font-bold text-emerald-200 hover:bg-emerald-500/25 transition"
              >
                Next Step: {item.nextStepStorefrontLabel} ↗
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
