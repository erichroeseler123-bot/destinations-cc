"use client";

import type { ReactNode } from "react";
import WesternWisconsinTelemetry from "@/app/components/dcc/WesternWisconsinTelemetry";
import WesternWisconsinTrackedLink from "@/app/components/dcc/WesternWisconsinTrackedLink";

type ActionLink = {
  href: string;
  label: string;
  action?: string;
  fitSignal?: string;
  metadata?: Record<string, unknown>;
};

type Highlight = {
  label: string;
  body: string;
};

export default function WesternWisconsinShell({
  eyebrow,
  sourcePage,
  pageRole,
  recommendationSlug,
  title,
  intro,
  highlights,
  primaryAction,
  secondaryAction,
  relatedLinks,
  relatedLinksTitle,
  children,
}: {
  eyebrow: string;
  sourcePage: string;
  pageRole: "hub" | "feeder";
  recommendationSlug?: string;
  title: string;
  intro: string;
  highlights: Highlight[];
  primaryAction?: ActionLink;
  secondaryAction?: ActionLink;
  relatedLinks?: Array<{ href: string; label: string }>;
  relatedLinksTitle?: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f4ec_0%,#eef4ef_40%,#f6f4ee_100%)] text-slate-950">
      <WesternWisconsinTelemetry
        page={sourcePage}
        pageRole={pageRole}
        recommendationSlug={recommendationSlug}
      />
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 md:py-16">
        <header className="overflow-hidden rounded-[2.2rem] border border-emerald-900/10 bg-[radial-gradient(circle_at_top_left,rgba(9,94,76,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(183,134,44,0.16),transparent_26%),linear-gradient(180deg,rgba(10,27,35,0.94),rgba(8,22,30,0.96))] p-7 text-white shadow-[0_28px_80px_rgba(6,22,18,0.24)] md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-200">{eyebrow}</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.04em] md:text-6xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-white/82 md:text-lg">{intro}</p>

          {(primaryAction || secondaryAction) ? (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {primaryAction ? (
                <WesternWisconsinTrackedLink
                  href={primaryAction.href}
                  sourcePage={sourcePage}
                  action={primaryAction.action ?? "feeder_cta_clicked"}
                  fitSignal={primaryAction.fitSignal}
                  metadata={primaryAction.metadata}
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-500 px-6 text-sm font-black uppercase tracking-[0.16em] text-[#071b16] transition hover:bg-emerald-400"
                >
                  {primaryAction.label}
                </WesternWisconsinTrackedLink>
              ) : null}
              {secondaryAction ? (
                <WesternWisconsinTrackedLink
                  href={secondaryAction.href}
                  sourcePage={sourcePage}
                  action={secondaryAction.action ?? "feeder_cta_clicked"}
                  fitSignal={secondaryAction.fitSignal}
                  metadata={secondaryAction.metadata}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/18 bg-white/8 px-6 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/12"
                >
                  {secondaryAction.label}
                </WesternWisconsinTrackedLink>
              ) : null}
            </div>
          ) : null}

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {highlights.map((item) => (
              <article
                key={item.label}
                className="rounded-[1.5rem] border border-white/12 bg-white/[0.06] p-5 backdrop-blur-sm"
              >
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#f7cf73]">{item.label}</div>
                <p className="mt-3 text-sm leading-7 text-white/82">{item.body}</p>
              </article>
            ))}
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-8">{children}</div>

          {relatedLinks && relatedLinks.length > 0 ? (
            <aside className="rounded-[1.8rem] border border-emerald-900/10 bg-white/80 p-6 shadow-[0_18px_55px_rgba(18,38,31,0.08)]">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">
                {relatedLinksTitle || "Next decision lanes"}
              </p>
              <div className="mt-5 space-y-3">
                {relatedLinks.map((item) => (
                  <WesternWisconsinTrackedLink
                    key={item.href}
                    href={item.href}
                    sourcePage={sourcePage}
                    action="feeder_cta_clicked"
                    className="block rounded-[1.2rem] border border-emerald-950/10 bg-[#f7f5ef] px-4 py-4 text-sm font-semibold leading-6 text-slate-900 transition hover:border-emerald-700/30 hover:bg-[#eef5ef]"
                  >
                    {item.label}
                  </WesternWisconsinTrackedLink>
                ))}
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </main>
  );
}
