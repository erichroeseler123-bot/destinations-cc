import FeastlyTrackedCtaLink from "@/app/components/dcc/FeastlyTrackedCtaLink";
import { redirect } from "next/navigation";
import { createPaymentSession } from "@/lib/satellite-runtime/paymentSession";
import { emitTelemetry } from "@/lib/satellite-runtime/telemetry";
import type { SatelliteHandoffContext, SatelliteTelemetryInput } from "@/lib/satellite-runtime/types";

type OptionComparison = {
  label: string;
  tradeoff: string;
};

const FEASTLY_BOOKING_FEE_CENTS = 50000;
const FEASTLY_FALLBACK_CHECKOUT_URL = "https://feastlyspread.com";

export type FeastlyGroupDiningDecisionPageProps = {
  pagePath: string;
  eyebrow: string;
  title: string;
  problem: string;
  quickAnswer: string;
  recommendation: string;
  feastlyHref: string;
  ctaLabel: string;
  comparisons: OptionComparison[];
  fitPoints: string[];
};

export default function FeastlyGroupDiningDecisionPage({
  pagePath,
  eyebrow,
  title,
  problem,
  quickAnswer,
  recommendation,
  feastlyHref,
  ctaLabel,
  comparisons,
  fitPoints,
}: FeastlyGroupDiningDecisionPageProps) {
  async function emitFeastlyTelemetryAction(input: SatelliteTelemetryInput) {
    "use server";

    const satelliteSecret =
      process.env.DCC_SATELLITE_WEBHOOK_TOKEN?.trim() ||
      process.env.DCC_SATELLITE_SECRET?.trim();
    const internalSecret = process.env.INTERNAL_API_SECRET?.trim();

    if (!satelliteSecret || !internalSecret) return;

    await emitTelemetry(input, {
      satelliteSecret,
      fetchImpl: async (inputUrl, init) => {
        const headers = new Headers(init?.headers);
        headers.set("x-internal-secret", internalSecret);

        return fetch(inputUrl, {
          ...init,
          headers,
          cache: "no-store",
        });
      },
    });
  }

  async function checkoutFeastlyAction(handoff: SatelliteHandoffContext) {
    "use server";

    const satelliteSecret = process.env.DCC_SATELLITE_SECRET?.trim();
    const internalSecret = process.env.INTERNAL_API_SECRET?.trim();
    const fallbackUrl = process.env.FEASTLY_PAYMENT_CHECKOUT_URL?.trim() || FEASTLY_FALLBACK_CHECKOUT_URL;

    if (!satelliteSecret || !internalSecret) {
      redirect(fallbackUrl);
    }

    const response = await createPaymentSession(
      {
        ...handoff,
        amountCents: FEASTLY_BOOKING_FEE_CENTS,
        currency: "USD",
        provider: "square",
        metadata: {
          source: "feastly_group_dining_decision_page",
          event_name: "feastly_checkout_intent",
        },
      },
      {
        satelliteSecret,
        dryRun: false,
        fetchImpl: async (inputUrl, init) => {
          const headers = new Headers(init?.headers);
          headers.set("x-internal-secret", internalSecret);

          return fetch(inputUrl, {
            ...init,
            headers,
            cache: "no-store",
          });
        },
      },
    );

    redirect(response.ok && response.checkoutUrl ? response.checkoutUrl : fallbackUrl);
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#101615_0%,#16201c_46%,#f6f0e6_46%,#f8f5ef_100%)] text-slate-950">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-12 md:py-16">
        <header className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,18,17,0.96),rgba(18,31,27,0.96))] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.28)] md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">{eyebrow}</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight md:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/84">{problem}</p>

          <section className="mt-6 rounded-[1.4rem] border border-emerald-200/20 bg-emerald-300/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">Recommendation</p>
            <p className="mt-3 text-base font-semibold leading-7 text-white">{quickAnswer}</p>
          </section>

          <div className="mt-6">
            <FeastlyTrackedCtaLink
              href={feastlyHref}
              sourcePage={pagePath}
              cta="pick_team"
              emitTelemetryAction={emitFeastlyTelemetryAction}
              checkoutAction={checkoutFeastlyAction}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-200 px-6 text-sm font-black uppercase tracking-[0.16em] text-[#0c1b15] transition hover:bg-emerald-100"
            >
              {ctaLabel}
            </FeastlyTrackedCtaLink>
          </div>
        </header>

        <section className="rounded-[1.6rem] border border-slate-950/10 bg-white/86 p-6 shadow-[0_18px_55px_rgba(18,31,27,0.1)]">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-900">Fast comparison</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Most options make one person manage dinner. That is the problem.
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {comparisons.map((option) => (
              <article key={option.label} className="rounded-[1.2rem] border border-slate-950/10 bg-[#f5f1e9] p-4">
                <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-900">{option.label}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-700">{option.tradeoff}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[1.6rem] border border-emerald-900/10 bg-white p-6 shadow-[0_18px_55px_rgba(18,31,27,0.1)]">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-900">Why Feastly fits</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Use a Feastly kitchen team instead of turning dinner into a group project.
          </h2>
          <p className="mt-4 max-w-4xl text-base leading-8 text-slate-700">{recommendation}</p>
          <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-emerald-950">
            Depending on your group size, this may be one person or a small team working together.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {fitPoints.map((point) => (
              <div key={point} className="rounded-[1.2rem] border border-emerald-900/10 bg-emerald-50 p-4 text-sm font-semibold leading-7 text-emerald-950">
                {point}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
