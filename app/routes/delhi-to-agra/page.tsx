import type { Metadata } from "next";
import Link from "next/link";
import SharedTripRecheckCard from "@/app/components/dcc/SharedTripRecheckCard";
import {
  DELHI_AGRA_MACHINE_FEEDS,
  DELHI_AGRA_QUALIFIED_OPERATORS,
  DELHI_AGRA_SAMPLE_TRIP_FITS,
  DELHI_AGRA_SAMPLE_TRIP_NEEDS_VERIFICATION,
  TAJ_MAHAL_OFFICIAL_RULES,
  evaluateDelhiAgraTajVisit,
} from "@/lib/dcc/corridors/internationalCorridorQualifications";

export const dynamic = "force-dynamic";

const BASE_URL = "https://destinationcommandcenter.com";

export const metadata: Metadata = {
  title:
    "Delhi to Agra: Will I Still Make My Taj Mahal Visit? | Destination Command Center",
  description:
    "Answer 'Will I still make my Taj Mahal visit?' using your Gatimaan / Vande Bharat train and date, revised Agra Cantt (AGC) arrival, last-mile Shilpgram East Gate transfer, and official ASI Taj Mahal visiting hours (opens 30m before sunrise, closes 30m before sunset, closed Fridays, 3-hour ticket limit).",
  alternates: { canonical: "/routes/delhi-to-agra" },
};

export default async function DelhiToAgraPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : {};
  const firstStr = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const customEval = evaluateDelhiAgraTajVisit({
    date: firstStr(sp.date) || "2026-11-18",
    trainNumberAndName: firstStr(sp.train) || "12002 Gatimaan Express",
    scheduledArrivalAgc: firstStr(sp.scheduled_eta) || "09:50",
    revisedArrivalAgc: firstStr(sp.revised_eta) || "10:15",
    sunriseLocal: firstStr(sp.sunrise) || "06:45",
    sunsetLocal: firstStr(sp.sunset) || "17:30",
    returnTrainDepartureAgc: firstStr(sp.return_train) || "17:45",
    partySize: Number(firstStr(sp.party_size)) || 3,
    fogAdvisoryActive: firstStr(sp.fog) === "1",
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Will I still make my Taj Mahal visit if my Delhi–Agra train is delayed?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Taj Mahal opens 30 minutes before sunrise, closes 30 minutes before sunset, is closed every Friday for general viewing, and enforces a 3-hour (180-minute) maximum stay per ticket. Allow 60 minutes from Agra Cantt (AGC) arrival to Taj East Gate entry (platform exit + car to Shilpgram + battery golf cart + ASI security).",
        },
      },
    ],
  };

  return (
    <main
      data-testid="dcc-delhi-agra-corridor-page"
      className="min-h-screen bg-slate-950 text-white"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 space-y-8">
        <header className="rounded-3xl border border-cyan-500/30 bg-slate-900/90 p-6 md:p-8 shadow-2xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
              DCC International Booking Candidate · Delhi → Agra (AGC)
            </span>
            <a
              href={TAJ_MAHAL_OFFICIAL_RULES.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-200 underline"
            >
              Official ASI Visiting Hours Source
            </a>
          </div>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">
            Delhi → Agra: &ldquo;Will I still make my Taj Mahal visit?&rdquo;
          </h1>
          <p className="max-w-4xl text-sm leading-relaxed text-slate-300">
            Evaluates your{" "}
            <strong>train and date</strong>,{" "}
            <strong>revised Agra Cantt (AGC) station arrival</strong>,{" "}
            <strong>
              60-minute last-mile transfer (AGC → Shilpgram East Gate parking +
              ASI battery golf cart + security queue)
            </strong>
            , and{" "}
            <strong>official Taj Mahal visiting hours and ticket rules</strong>{" "}
            (opens 30 minutes before sunrise, closes 30 minutes before sunset,{" "}
            <strong>closed every Friday</strong>, and a{" "}
            <strong>3-hour maximum stay per ticket</strong>). Mobile text and{" "}
            <strong>WhatsApp</strong> dispatch actions work on low-signal station
            connections.
          </p>
        </header>

        {/* Interactive / Query-Driven Recheck Form + SharedTripRecheckCard */}
        <section className="rounded-2xl border border-white/15 bg-slate-900/80 p-5 space-y-4">
          <form
            method="GET"
            action="/routes/delhi-to-agra"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 text-xs"
          >
            <label className="space-y-1">
              <span className="font-bold text-slate-300">Visit Date</span>
              <input
                type="date"
                name="date"
                defaultValue={firstStr(sp.date) || "2026-11-18"}
                className="w-full rounded-lg border border-white/20 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
            <label className="space-y-1">
              <span className="font-bold text-slate-300">Train Number</span>
              <input
                type="text"
                name="train"
                defaultValue={firstStr(sp.train) || "12002 Gatimaan Express"}
                className="w-full rounded-lg border border-white/20 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
            <label className="space-y-1">
              <span className="font-bold text-slate-300">
                Revised AGC Arrival (NTES)
              </span>
              <input
                type="time"
                name="revised_eta"
                defaultValue={firstStr(sp.revised_eta) || "10:15"}
                className="w-full rounded-lg border border-white/20 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
            <label className="space-y-1">
              <span className="font-bold text-slate-300">Party Size</span>
              <input
                type="number"
                min={1}
                max={12}
                name="party_size"
                defaultValue={Number(firstStr(sp.party_size)) || 3}
                className="w-full rounded-lg border border-white/20 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-lg bg-cyan-500 px-4 py-2 font-black text-slate-950 hover:bg-cyan-400"
              >
                Recheck Taj Window
              </button>
            </div>
          </form>

          <SharedTripRecheckCard
            card={customEval.recheckCard}
            testId="dcc-delhi-agra-active-recheck-card"
          />
        </section>

        {/* Official ASI Visiting Hours + IMD / CRIS proNTES Machine Access Status */}
        <section
          data-testid="dcc-delhi-agra-official-sources"
          className="grid gap-5 lg:grid-cols-2"
        >
          <div className="rounded-2xl border border-white/15 bg-slate-900/80 p-5 space-y-3 text-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              Official Taj Mahal Rules (Archaeological Survey of India)
            </div>
            <h2 className="text-lg font-black text-white">
              Visiting Hours, Friday Closure &amp; 3-Hour Ticket Limit
            </h2>
            <ul className="space-y-2 text-slate-200">
              <li>
                • <strong>Daylight Gate Hours:</strong> Opens{" "}
                <strong>30 minutes before sunrise</strong> and closes{" "}
                <strong>30 minutes before sunset</strong> during normal operating
                days.
              </li>
              <li>
                • <strong>Friday Closure:</strong>{" "}
                {TAJ_MAHAL_OFFICIAL_RULES.closedDayNote}
              </li>
              <li>
                • <strong>3-Hour Ticket Rule:</strong>{" "}
                {TAJ_MAHAL_OFFICIAL_RULES.ticketValidityNote}
              </li>
              <li>
                • <strong>Shilpgram / West Gate Last Mile:</strong>{" "}
                {TAJ_MAHAL_OFFICIAL_RULES.lastMileGateRule}
              </li>
            </ul>
            <a
              href={TAJ_MAHAL_OFFICIAL_RULES.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-bold text-cyan-300 underline"
            >
              Verify at tajmahal.gov.in/visiting-hours.aspx ↗
            </a>
          </div>

          <div className="rounded-2xl border border-white/15 bg-slate-900/80 p-5 space-y-3 text-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Machine Feed Verification Status (IMD &amp; CRIS proNTES)
            </div>
            <h2 className="text-lg font-black text-white">
              Official Lookups &amp; Traveler-Entered Revised ETA Fallback
            </h2>
            <div className="space-y-3">
              {DELHI_AGRA_MACHINE_FEEDS.map((feed) => (
                <div
                  key={feed.providerId}
                  className="rounded-xl border border-white/10 bg-black/35 p-3 space-y-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 font-bold text-white">
                    <span>{feed.providerName}</span>
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono uppercase text-amber-200">
                      {feed.approvedMachineAccessStatus}
                    </span>
                  </div>
                  <p className="text-slate-300">{feed.fallbackBehavior}</p>
                  <div className="flex flex-wrap gap-3 pt-1">
                    <a
                      href={feed.documentationOrPortalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-300 underline"
                    >
                      API Portal ({feed.documentationOrPortalUrl})
                    </a>
                    <a
                      href={feed.officialPublicLookupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-emerald-300 underline"
                    >
                      Open Official Live Lookup ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Qualified Transfer Operators in INR + WhatsApp Mobile Text Support */}
        <section
          data-testid="dcc-delhi-agra-qualified-operators"
          className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-6 space-y-4"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              Qualified Transfer Operators (Priced in INR · Text &amp; WhatsApp Ready)
            </p>
            <h2 className="mt-1 text-xl font-black text-white">
              Pre-Qualified Car Offers (Offered When Road, Operator &amp; Taj
              Visit Window Support It)
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {DELHI_AGRA_QUALIFIED_OPERATORS.map((op) => (
              <article
                key={op.operatorId}
                className="rounded-2xl border border-white/15 bg-black/35 p-5 space-y-2.5 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-black text-white">
                    {op.operatorName}
                  </h3>
                  <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-0.5 font-mono font-bold text-emerald-200">
                    ₹{op.priceInr.toLocaleString()} INR
                  </span>
                </div>
                <div className="text-slate-300">{op.pricingScope}</div>
                <div className="text-slate-400">
                  <strong className="text-amber-200">
                    Winter Fog &amp; Delay Policy:
                  </strong>{" "}
                  {op.fogAndDelayPolicy}
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link
                    href={op.bookingHref}
                    className="rounded-xl bg-cyan-500 px-3.5 py-2 font-black text-slate-950 hover:bg-cyan-400"
                  >
                    Select Transfer (₹{op.priceInr.toLocaleString()} INR)
                  </Link>
                  <a
                    href={op.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3.5 py-2 font-bold text-emerald-200 hover:bg-emerald-500/20"
                  >
                    WhatsApp Text Dispatch
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 1 Trip That Fits vs. 1 Trip That Needs Verification */}
        <section
          data-testid="dcc-delhi-agra-sample-comparisons"
          className="grid gap-5 lg:grid-cols-2"
        >
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Sample 1 · Trip That Fits (12002 Gatimaan Express · Full 3-Hr Taj
              Visit Fits)
            </div>
            <SharedTripRecheckCard
              card={DELHI_AGRA_SAMPLE_TRIP_FITS.recheckCard}
              testId="dcc-delhi-agra-sample-fits"
            />
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Sample 2 · Trip That Needs Verification (Severe Fog Delay · Under
              90m Before Sunset Cutoff)
            </div>
            <SharedTripRecheckCard
              card={DELHI_AGRA_SAMPLE_TRIP_NEEDS_VERIFICATION.recheckCard}
              testId="dcc-delhi-agra-sample-needs-verification"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
