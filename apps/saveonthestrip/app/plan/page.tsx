import type { Metadata } from "next";
import Link from "next/link";
import { HelpRequestForm } from "@/app/components/HelpRequestForm";
import { getVegasTours } from "@/lib/fareharbor";
import {
  BUDGET_TIER_OPTIONS,
  buildVegasPlan,
  GROUP_SIZE_OPTIONS,
  HOTEL_AREA_OPTIONS,
  PLAN_INTEREST_OPTIONS,
  TIME_AVAILABLE_OPTIONS,
} from "@/lib/planPicker";
import { getSeatGeekVegasEvents } from "@/lib/seatgeek";
import { getVegasShows } from "@/lib/ticketmaster";
import { CopyPlanLinkButton } from "./CopyPlanLinkButton";

export const metadata: Metadata = {
  title: "Vegas Plan Picker | Build a Practical Las Vegas Plan | Save On The Strip",
  description:
    "Choose your Las Vegas dates, hotel area, group size, time available, and budget per person to get a practical plan with one paid option and a free or lower-cost alternative.",
  alternates: {
    canonical: "https://saveonthestrip.com/plan",
  },
  openGraph: {
    title: "Vegas Plan Picker | Save On The Strip",
    description:
      "Match your Vegas time, hotel cluster, group size, and per-person budget to one worthwhile paid option plus a free alternative.",
    url: "https://saveonthestrip.com/plan",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

type PlanPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PlanPickerPage({ searchParams }: PlanPageProps) {
  const resolvedParams = (await searchParams) || {};

  const [tourPayload, ticketmasterShows, seatGeekEvents] = await Promise.all([
    getVegasTours().catch(() => ({ tours: [], companies: [], configured: false })),
    getVegasShows().catch(() => []),
    getSeatGeekVegasEvents().catch(() => []),
  ]);

  const plan = buildVegasPlan(resolvedParams, {
    tours: tourPayload.tours,
    toursConfigured: tourPayload.configured,
    ticketmasterShows,
    seatGeekEvents,
  });

  const { input, paidSuggestion, paidFallback, freeAlternative } = plan;
  const sentFlag = resolvedParams.sent === "1";
  const errorFlag = resolvedParams.error === "1" || resolvedParams.error === "contact";

  const quickPresets = [
    {
      label: "Central Strip night under $100",
      href: `/plan?startDate=${input.startDate}&endDate=${input.endDate}&area=central-strip&groupSize=2&time=evening&budget=under-100&interest=shows#your-plan`,
    },
    {
      label: "Group of 6 on Fremont ($0–$50)",
      href: `/plan?startDate=${input.startDate}&endDate=${input.endDate}&area=downtown-fremont&groupSize=5-8&time=evening&budget=under-50&interest=classic-vegas#your-plan`,
    },
    {
      label: "Full-day canyon or dam outing",
      href: `/plan?startDate=${input.startDate}&endDate=${input.endDate}&area=${input.area}&groupSize=${input.groupSize}&time=full-day&budget=200-plus&interest=outdoors#your-plan`,
    },
    {
      label: "4 hours before a late flight",
      href: `/plan?startDate=${input.startDate}&endDate=${input.startDate}&area=${input.area}&groupSize=${input.groupSize}&time=2-4h&budget=under-50&interest=best-fit#your-plan`,
    },
  ] as const;

  return (
    <main style={{ display: "grid", gap: 20 }}>
      <section className="hero hero-home">
        <div className="eyebrow">Save On The Strip • Plan Picker</div>
        <div style={{ height: 10 }} />
        <h1 className="detail-title">Pick a Vegas plan that actually fits your time and budget.</h1>
        <p className="lead">
          Set your dates, hotel area, group size, time window, and per-person budget. You get one
          worthwhile paid option when a real partner listing matches—paired right alongside a free
          or lower-cost Vegas alternative.
        </p>
        <div style={{ height: 14 }} />
        <div className="filter-pills" aria-label="Quick preset scenarios">
          {quickPresets.map((preset) => (
            <Link key={preset.label} href={preset.href} className="pill">
              {preset.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="panel" aria-labelledby="plan-setup-heading">
        <div className="eyebrow">Step 1 • Short setup</div>
        <div style={{ height: 8 }} />
        <h2 id="plan-setup-heading">Tell us the shape of the block</h2>
        <p>
          No account required. Updating the setup refreshes your shareable plan URL so you can send
          it straight to your group.
        </p>
        <div style={{ height: 14 }} />
        <form method="get" action="/plan#your-plan" className="plan-setup-grid">
          {input.handoffId ? (
            <input type="hidden" name="dcc_handoff_id" value={input.handoffId} />
          ) : null}

          <label className="field">
            <span>Start / plan date</span>
            <input type="date" name="startDate" defaultValue={input.startDate} required />
          </label>

          <label className="field">
            <span>End date</span>
            <input type="date" name="endDate" defaultValue={input.endDate} />
          </label>

          <label className="field">
            <span>Hotel area</span>
            <select name="area" defaultValue={input.area}>
              {HOTEL_AREA_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Group size</span>
            <select name="groupSize" defaultValue={input.groupSize}>
              {GROUP_SIZE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Time available</span>
            <select name="time" defaultValue={input.timeAvailable}>
              {TIME_AVAILABLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Budget per person</span>
            <select name="budget" defaultValue={input.budget}>
              {BUDGET_TIER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field field-full">
            <span>Main interest (optional)</span>
            <select name="interest" defaultValue={input.interest}>
              {PLAN_INTEREST_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} — {opt.helper}
                </option>
              ))}
            </select>
          </label>

          <div className="field-full plan-submit-row">
            <button type="submit" className="button button-primary" style={{ cursor: "pointer", border: 0 }}>
              Build my Vegas plan
            </button>
            <CopyPlanLinkButton />
            {input.hasExplicitParams ? (
              <Link href="/plan" className="pill">
                Reset defaults
              </Link>
            ) : null}
          </div>
        </form>
      </section>

      <section className="panel" id="your-plan" aria-labelledby="plan-output-heading">
        <div className="eyebrow">
          {input.hasExplicitParams ? "Step 2 • Your tailored Vegas plan" : "Step 2 • Sample plan (adjust setup above)"}
        </div>
        <div style={{ height: 8 }} />
        <h2 id="plan-output-heading" className="detail-title">
          {plan.headline}
        </h2>
        <div style={{ height: 12 }} />
        <div className="filter-pills">
          {plan.setupSummaryChips.map((chip) => (
            <span key={chip} className="pill pill-active">
              {chip}
            </span>
          ))}
        </div>
        <div style={{ height: 16 }} />
        <div className="card">
          <div className="eyebrow">Recommended move</div>
          <p style={{ color: "var(--text)", fontSize: 18, margin: "8px 0 0" }}>{plan.verdict}</p>
        </div>

        <div style={{ height: 18 }} />

        <div className="grid">
          {paidSuggestion ? (
            <article className="card plan-option-card">
              <div className="eyebrow">
                Suggested paid activity • {paidSuggestion.providerLabel}
              </div>
              <h2 style={{ marginTop: 10 }}>{paidSuggestion.title}</h2>
              <p style={{ margin: "6px 0 0", color: "var(--accent-3)", fontWeight: 700 }}>
                {paidSuggestion.priceNote}
              </p>
              <p style={{ margin: "8px 0 0" }}>
                <strong>When &amp; where:</strong> {paidSuggestion.scheduleNote} • {paidSuggestion.subtitle}
              </p>
              <p>{paidSuggestion.whyItFits}</p>
              <p>{paidSuggestion.geographyNote}</p>
              <div className="detail-actions" style={{ marginTop: 8 }}>
                <Link href={paidSuggestion.bookingHref} className="button button-primary">
                  {paidSuggestion.bookingLabel}
                </Link>
                <Link href={paidSuggestion.detailHref} className="button button-secondary">
                  {paidSuggestion.detailLabel}
                </Link>
              </div>
              <p className="plan-disclosure">{paidSuggestion.disclosure}</p>
            </article>
          ) : paidFallback ? (
            <article className="card plan-option-card">
              <div className="eyebrow">Paid anchor slot • Honest next step</div>
              <h2 style={{ marginTop: 10 }}>{paidFallback.headline}</h2>
              <p>{paidFallback.explanation}</p>
              <div className="status-chip" style={{ marginTop: 8 }}>
                <strong>{paidFallback.recommendedLaneTitle}</strong>
                <span>{paidFallback.recommendedLaneCopy}</span>
              </div>
              <div style={{ height: 12 }} />
              <div className="eyebrow">Useful next moves (no dead-end links)</div>
              <div className="footer-links" style={{ marginTop: 8 }}>
                {paidFallback.nextSteps.map((step) => (
                  <Link href={step.href} key={step.href} className="plan-step-link">
                    <strong>{step.label}</strong>
                    <span>{step.note}</span>
                  </Link>
                ))}
              </div>
              <p className="plan-disclosure">{plan.disclosure}</p>
            </article>
          ) : null}

          <article className="card plan-option-card">
            <div className="eyebrow">Free or lower-cost alternative • Save twice</div>
            <h2 style={{ marginTop: 10 }}>{freeAlternative.primaryTitle}</h2>
            <p style={{ margin: "6px 0 0", color: "var(--accent-3)", fontWeight: 700 }}>
              {freeAlternative.primaryCostBadge}
            </p>
            <p>{freeAlternative.primarySummary}</p>
            <div className="status-chip" style={{ marginTop: 8 }}>
              <strong>{freeAlternative.lowCostBackupTitle}</strong>
              <span>{freeAlternative.lowCostBackupSummary}</span>
            </div>
            <div className="detail-actions" style={{ marginTop: 14 }}>
              {freeAlternative.links.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={index === 0 ? "button button-secondary" : "pill"}
                  style={{ textAlign: "center" }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="split">
        <div className="panel panel-tight">
          <div className="eyebrow">Budget &amp; geography guardrails</div>
          <div style={{ height: 8 }} />
          <h2>How to keep this plan from leaking money</h2>
          <ul className="list">
            {plan.guardrails.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>

        <div className="panel panel-tight">
          <div className="eyebrow">Matched decision guides</div>
          <div style={{ height: 8 }} />
          <h2>Read before you spend</h2>
          <div className="footer-links" style={{ marginTop: 12 }}>
            {plan.guides.map((guide) => (
              <Link href={guide.href} key={guide.href} className="plan-step-link">
                <strong>{guide.title}</strong>
                <span>{guide.reason}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="plan-help">
        <HelpRequestForm sourcePath="/plan" sent={sentFlag} error={errorFlag} />
      </section>
    </main>
  );
}
