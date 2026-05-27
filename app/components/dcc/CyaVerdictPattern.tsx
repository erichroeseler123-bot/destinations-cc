import TrackedExternalAnchor from "@/app/components/analytics/TrackedExternalAnchor";
import TrackOnMount from "@/app/components/analytics/TrackOnMount";
import ViatorCTA from "@/app/components/dcc/ViatorCTA";
import type { ViatorLaneConfig, ViatorLaneProduct } from "@/lib/dcc/corridors/types";
import { buildViatorSearchUrl } from "@/lib/viator/links";

type AdventureArchetype = {
  label: string;
  title: string;
  body: string;
};

type CandorPoint = {
  axis: string;
  safe: string;
  thrill: string;
};

type CyaVerdictPatternProps = {
  location: string;
  surface: string;
  corridor: string;
  handoffId: string;
  safeChoice: {
    title: string;
    label: string;
  };
  thrillChoice: {
    title: string;
    label: string;
  };
  archetypes: [AdventureArchetype, AdventureArchetype];
  candor: CandorPoint[];
  verdict: {
    label: string;
    title: string;
    body: string;
    ctaLabel: string;
    query: string;
    decisionAction: string;
    decisionOption: string;
    decisionProduct: string;
    href?: string;
  };
  viator?: {
    lane: ViatorLaneConfig;
    product: ViatorLaneProduct;
    date?: string;
  };
};

function appendDecisionParams(
  href: string,
  input: Pick<CyaVerdictPatternProps, "corridor" | "handoffId" | "surface"> & {
    action: string;
    option: string;
    product: string;
  }
) {
  const isRelativeHref = href.startsWith("/");
  const url = new URL(href, "https://www.destinationcommandcenter.com");
  url.searchParams.set("dcc_handoff_id", input.handoffId);
  url.searchParams.set("source_page", input.surface);
  url.searchParams.set("decision_corridor", input.corridor);
  url.searchParams.set("decision_action", input.action);
  url.searchParams.set("decision_option", input.option);
  url.searchParams.set("decision_product", input.product);
  url.searchParams.set("decision_state", "verdict");
  return isRelativeHref ? `${url.pathname}${url.search}${url.hash}` : url.toString();
}

export default function CyaVerdictPattern({
  location,
  surface,
  corridor,
  handoffId,
  safeChoice,
  thrillChoice,
  archetypes,
  candor,
  verdict,
  viator,
}: CyaVerdictPatternProps) {
  const ctaHref = appendDecisionParams(
    verdict.href ||
      buildViatorSearchUrl(verdict.query, {
        campaign: `${corridor}-${verdict.decisionProduct}`,
      }),
    {
      corridor,
      handoffId,
      surface,
      action: verdict.decisionAction,
      option: verdict.decisionOption,
      product: verdict.decisionProduct,
    }
  );

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.28)] md:p-6">
      <TrackOnMount
        name="landing_viewed"
        props={{
          surface,
          corridor,
          dcc_handoff_id: handoffId,
          decision_action: verdict.decisionAction,
          decision_option: verdict.decisionOption,
          decision_product: verdict.decisionProduct,
          product_slot: viator?.product.slot,
          product_code: viator?.product.productCode,
          product_title: viator?.product.title,
          campaign: viator?.product.campaign,
          provider: viator?.product.provider || (verdict.href ? "operator" : "viator"),
        }}
      />
      <TrackOnMount
        name="verdict_shown"
        props={{
          surface,
          corridor,
          dcc_handoff_id: handoffId,
          decision_action: verdict.decisionAction,
          decision_option: verdict.decisionOption,
          decision_product: verdict.decisionProduct,
          product_slot: viator?.product.slot,
          product_code: viator?.product.productCode,
          product_title: viator?.product.title,
          campaign: viator?.product.campaign,
          provider: viator?.product.provider || (verdict.href ? "operator" : "viator"),
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">
          {location} adventure verdict
        </p>
        <p className="rounded-full border border-white/12 bg-black/25 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-white/70">
          {safeChoice.label} vs {thrillChoice.label}
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {archetypes.map((archetype) => (
          <article key={archetype.label} className="rounded-[1.35rem] border border-white/10 bg-black/20 p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
              {archetype.label}
            </p>
            <h2 className="mt-3 text-xl font-black tracking-tight text-white">{archetype.title}</h2>
            <p className="mt-3 text-sm leading-7 text-white/72">{archetype.body}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 overflow-x-auto rounded-[1.35rem] border border-white/10">
        <div className="min-w-[680px]">
          <div className="grid grid-cols-[0.8fr_1fr_1fr] bg-white/10 text-[11px] font-black uppercase tracking-[0.14em] text-white/65">
            <div className="px-3 py-3">Tradeoff</div>
            <div className="border-l border-white/10 px-3 py-3">{safeChoice.title}</div>
            <div className="border-l border-white/10 px-3 py-3">{thrillChoice.title}</div>
          </div>
          {candor.map((row) => (
            <div key={row.axis} className="grid grid-cols-[0.8fr_1fr_1fr] border-t border-white/10 text-sm leading-6 text-white/76">
              <div className="bg-black/20 px-3 py-3 font-semibold text-white/88">{row.axis}</div>
              <div className="border-l border-white/10 px-3 py-3">{row.safe}</div>
              <div className="border-l border-white/10 px-3 py-3">{row.thrill}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-[1.35rem] border border-emerald-300/25 bg-[linear-gradient(135deg,rgba(16,185,129,0.24),rgba(14,165,233,0.12))] p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-100">
          Verdict: {verdict.label}
        </p>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-white">{verdict.title}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/82">{verdict.body}</p>
        <div className="mt-5">
          {viator ? (
            <ViatorCTA
              lane={viator.lane}
              product={viator.product}
              date={viator.date}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-200 px-5 text-sm font-black uppercase tracking-[0.14em] text-[#06130f] transition hover:bg-white"
              eventProps={{
                dcc_handoff_id: handoffId,
                decision_action: verdict.decisionAction,
                decision_option: verdict.decisionOption,
                decision_product: verdict.decisionProduct,
                provider: "viator",
              }}
              urlParams={{
                dcc_handoff_id: handoffId,
                source_page: surface,
                decision_corridor: corridor,
                decision_action: verdict.decisionAction,
                decision_option: verdict.decisionOption,
                decision_product: verdict.decisionProduct,
                decision_state: "verdict",
              }}
            >
              {verdict.ctaLabel}
            </ViatorCTA>
          ) : (
            <TrackedExternalAnchor
              href={ctaHref}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-200 px-5 text-sm font-black uppercase tracking-[0.14em] text-[#06130f] transition hover:bg-white"
              eventName={verdict.href ? "operator_cta_clicked" : "cya_verdict_cta_clicked"}
              eventProps={{
                surface,
                corridor,
                dcc_handoff_id: handoffId,
                decision_action: verdict.decisionAction,
                decision_option: verdict.decisionOption,
                decision_product: verdict.decisionProduct,
                provider: verdict.href ? "operator" : "viator",
              }}
            >
              {verdict.ctaLabel}
            </TrackedExternalAnchor>
          )}
        </div>
      </div>
    </section>
  );
}
