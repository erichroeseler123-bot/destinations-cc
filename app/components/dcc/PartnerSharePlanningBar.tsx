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
    <details
      open={attribution.isPartnerAttributed}
      data-testid="dcc-partner-share-planning-bar"
      data-partner-market={market || "all"}
      data-active-partner={attribution.partnerId || ""}
      data-active-partner-role={attribution.partnerRole || ""}
      className="rounded-2xl border border-white/10 bg-[#0b1120] p-4 text-xs text-white/80"
    >
      <summary className="cursor-pointer font-bold text-indigo-200 hover:text-white">
        {attribution.isPartnerAttributed
          ? `Shared planning link active (${attribution.partnerId || "partner"})`
          : "Hotel concierge or cruise planner? View shareable planning links"}
      </summary>

      <div className="mt-4 space-y-4 pt-3 border-t border-white/10">
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
              <strong>{attribution.partnerId}</strong> so you can verify
              timing, pickup, and vehicle/vessel fit before choosing your next step.
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
                    {item.partnerRoleLabel}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">{item.partnerName}</h3>
                <p className="text-white/85 leading-5">
                  <strong>Guest Answer:</strong> {item.guestQuestionAnswered}
                </p>
                <p className="text-white/65 leading-5">
                  <strong>Why share:</strong> {item.whyPartnerSharesIt}
                </p>
                <span
                  data-testid={`dcc-partner-share-url-${item.id}`}
                  className="sr-only"
                >
                  {item.shareableUrl}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <a
                  href={item.shareableUrl}
                  data-testid={`dcc-open-partner-plan-${item.id}`}
                  className="rounded-xl bg-indigo-400 px-3.5 py-2 text-[11px] font-black uppercase tracking-wider text-[#060b16] hover:bg-indigo-300 transition"
                >
                  Open Planning Link →
                </a>
                <a
                  href={item.nextStepStorefrontUrl}
                  data-testid={`dcc-partner-next-step-${item.id}`}
                  className="rounded-xl border border-emerald-400/35 bg-emerald-500/15 px-3.5 py-2 text-[11px] font-bold text-emerald-200 hover:bg-emerald-500/25 transition"
                >
                  {item.nextStepStorefrontLabel} ↗
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </details>
  );
}
