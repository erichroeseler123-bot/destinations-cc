import type { Metadata } from "next";
import Link from "next/link";
import CategoryDecisionEngineExperience from "@/app/components/dcc/CategoryDecisionEngineExperience";
import JsonLd from "@/app/components/dcc/JsonLd";
import { JUNEAU_WHALE_DECISION_ENGINE } from "@/lib/dcc/decisionEngines/juneauWhaleWatchingEngine";
import type { DecisionResult } from "@/lib/dcc/decisionEngines/types";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildWebPageJsonLd,
} from "@/lib/dcc/jsonld";
import {
  CLAA_JUNEAU_PORT_SCHEDULE,
  evaluateCruiseTimingWindow,
} from "@/lib/dcc/cruiseTimingGate";
import { evaluateJuneauBackupFlow } from "@/lib/dcc/dockRolloutContext";
import {
  buildNormalizedJuneauSupplierFeed,
  buildPublicJuneauLiveAvailabilityView,
  type NormalizedJuneauSupplierTour,
} from "@/lib/dcc/liveSlots/rezgoReadOnly";
import { JuneauLiveAvailabilitySection } from "@/components/dcc/JuneauLiveAvailabilitySection";
import PartnerSharePlanningBar from "@/app/components/dcc/PartnerSharePlanningBar";
import PortableTripNetworkBar from "@/app/components/dcc/PortableTripNetworkBar";

export const metadata: Metadata = {
  title: "Juneau Whale Watching Tours & Whale Deck Authority | CLAA Port Timing & Flight Backups | DCC",
  description:
    "Use DCC to check Juneau CLAA port-call timing, confirmed all-aboard 2-hour minimum recommended gangway return buffers, live Juneau Tours operator availability, PAJN METAR weather context, and route to Juneau Flight Deck Whale Deck or Last Frontier Shore Excursions.",
  alternates: { canonical: "/juneau/whale-watching-tours" },
};

const OPTIONS = [
  {
    title: "Most cruise travelers should start here",
    body: "Choose the cleaner wildlife-first lane when you want one strong whale decision without dragging glacier logistics into the same port block.",
  },
  {
    title: "Premium fit if the wildlife moment matters most",
    body: "Smaller-group formats are better when intimacy, viewing comfort, and a quieter boat matter more than saving the last few dollars.",
  },
  {
    title: "Same-day flight cancellation pivot (Whale Deck Backup Flow)",
    body: "When mountain cloud ceilings ground glacier helicopters, surface whale-watching vessels in Auke Bay and Stephens Passage continue operating under marine visibility rules.",
  },
];

const APPROVED_WHALE_OFFERS = [
  {
    code: "331813P1",
    title: "Small-Group Juneau Whale Watching Cruise",
    operator: "Alaska Galore Tours (Approved Viator Checkout)",
    durationMinutes: 210,
    durationLabel: "3.5 hours dock-to-dock",
    priceLabel: "From $189 / adult",
    providerConfirmedSeats: false,
    providerSeatCount: null,
    checkoutHref:
      "https://www.viator.com/tours/Juneau/Whale-Tours-in-Juneau-Alaska/d941-331813P1?pid=P00281144&mcid=42383&medium=link&campaign=last-frontier-juneau-whale-small-group",
    storefrontHref:
      "https://www.lastfrontiershoreexcursions.com/juneau/whale-watching?src=dcc-juneau-whale-deck&offer=331813P1",
  },
  {
    code: "466119P3",
    title: "Mendenhall Glacier Waterfall and Whale Watching Tour",
    operator:
      "Dolphin Jet Boat Tours (Verified Viator Supplier — Direct Referral Credit Pending Match Confirmation)",
    durationMinutes: 330,
    durationLabel: "5.5 hours dock-to-dock",
    priceLabel: "From $199–$225 / adult",
    providerConfirmedSeats: false,
    providerSeatCount: null,
    checkoutHref:
      "https://www.viator.com/tours/Juneau/Mendenhall-Glacier-Waterfall-and-Whale-Watching-Tour/d941-466119P3?pid=P00281144&mcid=42383&medium=link&campaign=last-frontier-juneau-whale-mendenhall-combo",
    storefrontHref:
      "https://www.lastfrontiershoreexcursions.com/juneau/whale-watching?src=dcc-juneau-whale-deck&offer=466119P3",
  },
  {
    code: "5857SHUTTLE",
    title: "Mendenhall Glacier Express Shuttle & Visitor Center",
    operator:
      "Juneau Tours & Whale Watch (Viator #5857SHUTTLE — Direct Referral Credit Pending Confirmation)",
    durationMinutes: 180,
    durationLabel: "3.0 hours dock-to-dock",
    priceLabel: "From $79–$80 / adult",
    providerConfirmedSeats: false,
    providerSeatCount: null,
    checkoutHref:
      "https://www.viator.com/tours/Juneau/Round-Trip-Mendenhall-Glacier-Shuttle-Service/d941-5857SHUTTLE?pid=P00281144&mcid=42383&medium=link&campaign=last-frontier-juneau-mendenhall-shuttle",
    storefrontHref:
      "https://www.lastfrontiershoreexcursions.com/juneau/mendenhall-glacier?src=dcc-juneau-whale-deck&offer=5857SHUTTLE",
  },
];

function JsonLdGraph() {
  const optionItems = [
    {
      name: "Juneau Flight Deck — Whale Deck Experience",
      description:
        "Juneau Whale Deck with CLAA cruise port timing, PAJN METAR weather context, and flight-cancellation backup flow.",
      url: "https://juneauflightdeck.com/juneau-whale-watching-tours",
    },
    {
      name: "Last Frontier Shore Excursions — Juneau Whale Watching",
      description:
        "Alaska storefront with approved whale-watching checkout links and cruise-window filtering.",
      url: "https://www.lastfrontiershoreexcursions.com/juneau/whale-watching",
    },
    {
      name: "Whale watching vs. glacier tour decision lane",
      description:
        "Compare single-activity Auke Bay whale watching against combined Mendenhall Glacier and whale port-day blocks.",
      url: "https://www.lastfrontiershoreexcursions.com/decision/whale-watching-vs-glacier-tour",
    },
  ];

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          buildWebPageJsonLd({
            path: "/juneau/whale-watching-tours",
            name: "Juneau Whale Watching Tours & Whale Deck Authority",
            description:
              "DCC public authority for Juneau whale-watching, live Juneau Tours operator availability, CLAA port-call timing, 2-hour minimum recommended gangway return buffers, and flight-cancellation backup routing.",
            dateModified: "2026-11-12",
            isPartOfPath: "/juneau",
          }),
          buildBreadcrumbJsonLd([
            { name: "Juneau", item: "/juneau" },
            { name: "Juneau Whale Watching Tours", item: "/juneau/whale-watching-tours" },
          ]),
          buildCollectionPageJsonLd({
            path: "/juneau/whale-watching-tours",
            name: "Juneau whale-watching decision lanes",
            description:
              "Juneau whale-watching lanes for first-time, premium, and flight-canceled backup cruise visitors.",
            items: optionItems,
          }),
        ],
      }}
    />
  );
}

const CATEGORY_SORT_PRIORITY: Record<NormalizedJuneauSupplierTour["activityCategory"], number> = {
  "whale-watching": 0,
  "combo-whale-glacier": 1,
  "mendenhall-glacier-tours": 2,
  "juneau-sightseeing": 3,
};

function resolveEffectiveJuneauServiceDate(
  dateParam: string | undefined,
  shipParam: string | undefined,
): string {
  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam.trim())) {
    return dateParam.trim();
  }
  if (shipParam) {
    const matched = CLAA_JUNEAU_PORT_SCHEDULE.find(
      (s) => s.shipName.toLowerCase() === shipParam.trim().toLowerCase(),
    );
    if (matched && /^\d{4}-(05|06|07|08|09)-\d{2}$/.test(matched.serviceDate)) {
      return matched.serviceDate;
    }
  }
  return "2027-07-15";
}

export const dynamic = "force-dynamic";

export default async function JuneauWhaleWatchingToursPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearch = searchParams ? await searchParams : {};
  const firstStr = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const flightCanceledParam = firstStr(resolvedSearch.flight_canceled);
  const cancelRefParam = firstStr(resolvedSearch.cancel_ref);
  const shipArrivalParam = firstStr(resolvedSearch.claa_arrival);
  const allAboardParam = firstStr(resolvedSearch.all_aboard);
  const berthParam = firstStr(resolvedSearch.berth);
  const dateParam = firstStr(resolvedSearch.date);
  const shipParam = firstStr(resolvedSearch.ship);

  const effectiveServiceDate = resolveEffectiveJuneauServiceDate(dateParam, shipParam);

  const [backupContext, juneauLiveFeed] = await Promise.all([
    Promise.resolve(
      evaluateJuneauBackupFlow({
        travelerSelectedCanceled: flightCanceledParam,
        operatorCancelRef: cancelRefParam,
      }),
    ),
    buildNormalizedJuneauSupplierFeed({
      searchDate: effectiveServiceDate,
      shipArrivalTime: shipArrivalParam || null,
      shipAllAboardTime: allAboardParam || null,
      allAboardConfirmed: Boolean(allAboardParam),
    }),
  ]);

  const sortedLiveTours = [...juneauLiveFeed.tours].sort(
    (a, b) =>
      (CATEGORY_SORT_PRIORITY[a.activityCategory] ?? 9) -
      (CATEGORY_SORT_PRIORITY[b.activityCategory] ?? 9),
  );
  const rawPartyParam = firstStr(resolvedSearch.partySize || resolvedSearch.party_size);
  const parsedPartyParam = rawPartyParam ? Number.parseInt(rawPartyParam, 10) : NaN;
  const initialPartySize =
    Number.isFinite(parsedPartyParam) && parsedPartyParam >= 1 ? parsedPartyParam : null;

  const publicJuneauView = buildPublicJuneauLiveAvailabilityView(
    {
      ...juneauLiveFeed,
      tours: sortedLiveTours,
    },
    {
      partySize: initialPartySize,
      shipArrivalTime: shipArrivalParam || null,
      shipAllAboardTime: allAboardParam || null,
      allAboardConfirmed: Boolean(allAboardParam),
      originSurface: "dcc",
    },
  );

  const timingEval = evaluateCruiseTimingWindow({
    claaArrivalLocal: shipArrivalParam || null,
    confirmedAllAboardLocal: allAboardParam || null,
    berthCode: berthParam || null,
    tourDurationMinutes: 210,
    providerConfirmedSeats: false,
    providerSeatCount: null,
  });

  const initialResult = JUNEAU_WHALE_DECISION_ENGINE.evaluate(
    JUNEAU_WHALE_DECISION_ENGINE.defaultExampleInput,
  ) as unknown as DecisionResult<Record<string, unknown>>;

  const whaleDeckUrl = backupContext.backupFlowOpen
    ? `https://juneauflightdeck.com/juneau-whale-watching-tours?flight_canceled=1${cancelRefParam ? `&cancel_ref=${encodeURIComponent(cancelRefParam)}` : ""}&src=dcc-juneau-whale-authority`
    : "https://juneauflightdeck.com/juneau-whale-watching-tours?src=dcc-juneau-whale-authority";
  const primarySpecialistUrl =
    "https://www.lastfrontiershoreexcursions.com/juneau/whale-watching?src=dcc-juneau-whale-authority";
  const comboDecisionUrl =
    "https://www.lastfrontiershoreexcursions.com/decision/whale-watching-vs-glacier-tour?src=dcc-juneau-whale-authority";
  const portWindowUrl =
    "https://www.lastfrontiershoreexcursions.com/juneau/excursions-by-cruise-ship-time?src=dcc-juneau-whale-authority";

  return (
    <main className="min-h-screen bg-[#05070b] px-6 py-10 text-white md:py-14">
      <JsonLdGraph />
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="overflow-hidden rounded-[2.2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(245,179,75,0.12),transparent_28%),linear-gradient(180deg,#0d1118_0%,#06080d_100%)]">
          <img
            src="/images/travel-markets/juneau/alaska-whale-watching.jpg"
            alt="Humpback whale watching in Auke Bay and Stephens Passage near Juneau, Alaska"
            width={1280}
            height={853}
            loading="eager"
            className="h-52 w-full object-cover object-center border-b border-white/10 sm:h-68"
          />
          <div className="p-8 md:p-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#f5b34b]">
              DCC Juneau Whale Command · Whale Deck Live
            </p>
            <span
              data-testid="dcc-juneau-timing-badge"
              className="rounded-full border border-amber-400/35 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-200"
            >
              {timingEval.statusBadgeLabel}
            </span>
          </div>
          <h1 className="mt-4 text-[clamp(2.6rem,7vw,5.2rem)] font-black uppercase leading-[0.92] tracking-[-0.05em]">
            Choose the correct
            <br />
            whale route first.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-white/75 md:text-lg">
            DCC checks whether you can get from your Juneau cruise berth to Auke Bay check-in, complete the tour, and return to the gangway with DCC&apos;s <strong>2-hour (120-minute) minimum recommended return buffer</strong> before your ship&apos;s confirmed all-aboard cutoff — then surfaces live read-only operator departures and routes you to <strong>Juneau Flight Deck (Whale Deck)</strong> or <strong>Last Frontier Shore Excursions</strong> to book.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={whaleDeckUrl}
              data-testid="dcc-to-jfd-whale-deck"
              data-dcc-next-step="juneauflightdeck"
              className="rounded-full bg-[#f5b34b] px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#07111d] transition hover:bg-[#f7bf6a]"
            >
              Open Juneau Flight Deck · Whale Deck ↗
            </a>
            <a
              href={primarySpecialistUrl}
              data-testid="dcc-to-lfse-whale"
              data-dcc-next-step="lastfrontiershoreexcursions"
              className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-emerald-200 transition hover:bg-emerald-500/25"
            >
              Open Alaska Storefront (Last Frontier) ↗
            </a>
            <a
              href="/juneau/whale-watching-tours?flight_canceled=1"
              data-testid="dcc-juneau-flight-canceled-trigger"
              className="rounded-full border border-cyan-400/40 bg-cyan-500/15 px-5 py-3 text-sm font-bold text-cyan-100 transition hover:bg-cyan-500/25"
            >
              My flight was canceled → Open Backup Flow
            </a>
          </div>
          </div>
        </header>

        <PortableTripNetworkBar
          marketId="juneau"
          searchParams={resolvedSearch}
          defaultDate={effectiveServiceDate}
          defaultPartySize={2}
          defaultShipName="Royal Princess"
          defaultBerthCode={berthParam || "FKL"}
          defaultAllAboard={allAboardParam || "20:30"}
        />

        {/* Juneau Tours — Live Operator Availability */}
        <JuneauLiveAvailabilitySection
          initialView={publicJuneauView}
          initialDate={effectiveServiceDate}
          initialShipArrival={shipArrivalParam || ""}
          initialAllAboard={allAboardParam || ""}
          initialBerth={berthParam || ""}
          flightCanceledParam={flightCanceledParam}
          cancelRefParam={cancelRefParam}
        />

        {/* April 24 Dock Rollout: Flight Cancellation Backup Flow + PAJN METAR Weather Context */}
        <section
          data-testid="dcc-juneau-dock-rollout-panel"
          className="rounded-[1.9rem] border border-cyan-400/30 bg-[#0b131e] p-6 md:p-8 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">
                April 24 Dock Rollout · Flight Cancellation Backup &amp; PAJN METAR Context
              </p>
              <h2 className="mt-1 text-2xl font-black text-white">
                {backupContext.statusHeadline}
              </h2>
            </div>
            <span className="rounded-full border border-cyan-300/35 bg-black/40 px-3 py-1 text-xs font-bold text-cyan-200">
              {backupContext.backupFlowOpen
                ? `Backup Flow Open (${backupContext.cancellationSource})`
                : "Traveler / Operator Trigger Ready"}
            </span>
          </div>

          <p className="text-sm leading-6 text-white/85">
            {backupContext.statusExplanation}
          </p>

          <div
            data-testid="dcc-juneau-pajn-metar-box"
            className="rounded-2xl border border-white/10 bg-black/45 p-4 text-xs space-y-1.5"
          >
            <div data-testid="dcc-pajn-metar-banner" className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-black uppercase tracking-wider text-amber-300">
                Weather Context Only · {backupContext.pajnMetar.stationName}
              </span>
              <code className="rounded bg-white/10 px-2 py-0.5 text-[11px] text-cyan-200">
                {backupContext.pajnMetar.rawMetar}
              </code>
            </div>
            <p className="text-white/75">
              Flight Category: <strong>{backupContext.pajnMetar.flightCategory}</strong> · Ceiling:{" "}
              <strong>{backupContext.pajnMetar.ceilingFeetAgl} ft AGL</strong> · Visibility:{" "}
              <strong>{backupContext.pajnMetar.visibilityStatuteMiles} SM</strong> · Wind:{" "}
              <strong>{backupContext.pajnMetar.windSummary}</strong>.{" "}
              <span className="text-amber-200/90">{backupContext.pajnMetar.contextNote}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="https://juneauflightdeck.com/juneau-whale-watching-tours?flight_canceled=1&src=dcc-flight-canceled"
              data-testid="dcc-open-whale-deck-backup-cta"
              className="rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#041019] hover:bg-cyan-300 transition"
            >
              My flight was canceled · Open Whale Deck Backup Flow ↗
            </a>
            <a
              href="https://juneauflightdeck.com/juneau/what-to-do-if-helicopter-tour-canceled?flight_canceled=1&src=dcc-flight-canceled"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-white/90 hover:bg-white/10 transition"
            >
              Operator Tracked Cancellation Link Guide ↗
            </a>
          </div>
        </section>

        {/* CLAA Juneau Port-Call Timing & 2-Hour DCC Return Buffer Gate */}
        <section
          data-testid="dcc-juneau-claa-timing-section"
          className="rounded-[1.9rem] border border-white/10 bg-[#0b1017] p-6 md:p-8 space-y-5"
        >
          <div data-testid="dcc-claa-timing-gate-section" className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f5b34b]">
                Published CLAA Calendar + Confirmed Ship All-Aboard Cutoff
              </p>
              <h2 className="mt-1 text-2xl font-black text-white">
                Berth-to-Check-In, Tour Duration &amp; 2-Hour Gangway Return Buffer
              </h2>
            </div>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
              Seat counts shown only when provider-confirmed
            </span>
          </div>

          <p className="text-sm leading-6 text-white/75">
            DCC uses the published <strong>CLAA (Cruise Line Agencies of Alaska)</strong> calendar for Juneau port-call windows and the ship&apos;s <strong>confirmed all-aboard time</strong> for the actual cutoff. When the confirmed all-aboard cutoff or berth/tender transfer is unknown, DCC displays <strong>Confirm ship timing</strong>.
          </p>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
            <table className="w-full text-left text-xs text-white/85">
              <thead className="border-b border-white/10 bg-white/[0.04] text-[11px] uppercase tracking-wider text-[#f5b34b]">
                <tr>
                  <th className="px-4 py-3">Ship &amp; Date (CLAA)</th>
                  <th className="px-4 py-3">Berth &amp; Transfer</th>
                  <th className="px-4 py-3">CLAA Port Call</th>
                  <th className="px-4 py-3">Confirmed All-Aboard</th>
                  <th className="px-4 py-3">DCC Buffer</th>
                  <th className="px-4 py-3">3.5h Whale Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {CLAA_JUNEAU_PORT_SCHEDULE.map((row) => {
                  const rowCheck = evaluateCruiseTimingWindow({
                    claaArrivalLocal: row.claaArrivalLocal,
                    claaDepartureLocal: row.claaDepartureLocal,
                    confirmedAllAboardLocal: row.confirmedAllAboardLocal,
                    berthCode: row.berthCode,
                    outboundBerthToCheckInMinutes: row.outboundBerthToCheckInMinutes,
                    returnToGangwayMinutes: row.returnToGangwayMinutes,
                    requiredDccBufferMinutes: row.requiredDccBufferMinutes,
                    tourDurationMinutes: 210,
                    providerConfirmedSeats: false,
                  });
                  return (
                    <tr key={row.scheduleId}>
                      <td className="px-4 py-3 font-semibold text-white">
                        {row.shipName} <span className="text-white/50">({row.serviceDate})</span>
                      </td>
                      <td className="px-4 py-3">{row.berthLabel}</td>
                      <td className="px-4 py-3">
                        {row.claaArrivalLocal}–{row.claaDepartureLocal}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {row.confirmedAllAboardLocal || "Unknown"}
                      </td>
                      <td className="px-4 py-3">{row.requiredDccBufferMinutes} min</td>
                      <td className="px-4 py-3 font-bold text-amber-200">
                        {rowCheck.statusBadgeLabel}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Approved Whale-Watching Checkout Links + Pending Juneau Tours & Whale Watch Direct Path */}
        <section
          data-testid="dcc-juneau-approved-offers"
          className="rounded-[1.9rem] border border-emerald-400/25 bg-[#0b1414] p-6 md:p-8 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-300">
                Approved Whale-Watching Checkout Links Live Today
              </p>
              <h2 className="mt-1 text-2xl font-black text-white">
                Book on Juneau Flight Deck Whale Deck or Last Frontier Shore Excursions
              </h2>
            </div>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-200">
              PID P00281144 · MCID 42383 Verified
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {APPROVED_WHALE_OFFERS.map((offer) => (
              <article
                key={offer.code}
                className="rounded-2xl border border-white/10 bg-black/45 p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                    <span>Code: {offer.code}</span>
                    <span>{offer.durationLabel}</span>
                  </div>
                  <h3 className="text-lg font-black text-white">{offer.title}</h3>
                  <p className="text-xs text-white/70">{offer.operator}</p>
                  <p className="text-sm font-bold text-[#f5b34b]">{offer.priceLabel}</p>
                  <p className="text-[11px] text-white/60">
                    Timing status: <strong>{timingEval.statusBadgeLabel}</strong> · Seat count shown only when provider-confirmed.
                  </p>
                </div>
                <div className="space-y-2 pt-2">
                  <a
                    href={offer.checkoutHref}
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                    data-testid={`dcc-juneau-approved-checkout-${offer.code}`}
                    className="block w-full rounded-xl bg-[#f5b34b] px-4 py-2.5 text-center text-xs font-black uppercase tracking-wider text-[#07111d] hover:bg-[#f7bf6a] transition"
                  >
                    Book Approved Checkout ({offer.code}) ↗
                  </a>
                  <a
                    href={offer.storefrontHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-center text-xs font-semibold text-white/85 hover:bg-white/10 transition"
                  >
                    View on Alaska Storefront ↗
                  </a>
                </div>
              </article>
            ))}
          </div>

          {/* Pending Direct Checkout Path: Juneau Tours & Whale Watch (10% Direct Deal + 466119P3 Supplier Reconciliation) */}
          <div
            data-testid="dcc-juneau-tours-pending-direct"
            className="rounded-2xl border border-amber-400/35 bg-amber-500/10 p-5 space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-200">
                Supplier Reconciliation &amp; Direct Rollout · Juneau Tours &amp; Whale Watch vs. Dolphin Jet Boat Tours (466119P3)
              </span>
              <span className="rounded-full border border-amber-300/40 bg-black/40 px-3 py-0.5 text-[11px] font-bold text-amber-200">
                Direct Referral Credit Pending Match Confirmation
              </span>
            </div>
            <p className="text-xs text-white/85 leading-6">
              <strong>Supplier Record Reconciliation:</strong> Viator product <code>466119P3</code> (<em>Mendenhall Glacier Waterfall and Whale Watching Tour</em>) lists <strong>Dolphin Jet Boat Tours</strong> as the verified supplier, whereas <strong>Juneau Tours &amp; Whale Watch</strong> operates Viator supplier prefix <code>5857</code> (<code>5857P22</code> <em>Mendenhall Glacier Park and Ultimate Whale Watch Combo</em>, <code>5857P23</code> <em>Ultimate Juneau Whale Watch</em>, and <code>5857SHUTTLE</code> <em>Mendenhall Glacier Express</em>). Direct 10% Rezgo / seat-block referral credit for <strong>Juneau Tours &amp; Whale Watch</strong> remains <strong>pending until the operator match is confirmed</strong>; <code>466119P3</code> checkouts route via Viator affiliate attribution for Dolphin Jet Boat Tours.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {OPTIONS.map((option) => (
            <article key={option.title} className="rounded-[1.7rem] border border-white/10 bg-[#0b1017] p-6">
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#f5b34b]">Decision lane</div>
              <h2 className="mt-4 text-xl font-black uppercase leading-[1.02] tracking-[-0.03em] text-white">
                {option.title}
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/68">{option.body}</p>
            </article>
          ))}
        </section>

        <CategoryDecisionEngineExperience
          engineId="juneau-whale-watching"
          initialResult={initialResult}
        />

        <section className="rounded-[1.9rem] border border-white/10 bg-[#0b1017] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] md:p-8 space-y-5">
          <div className="max-w-3xl">
            <div className="text-[11px] uppercase tracking-[0.28em] text-[#f5b34b]">
              Specialist &amp; Direct Execution Channels
            </div>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.04em] text-white">
              Compare Juneau whale watching on Juneau Flight Deck or Last Frontier Shore Excursions
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/68">
              Once you have confirmed your ship&apos;s usable shore window (typically 3.5 to 4.5 hours door-to-door for single-activity Auke Bay whale watching, or 5.25+ hours for a whale + Mendenhall Glacier combination), use the owned specialist deep links below.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={whaleDeckUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#f5b34b] px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#07111d] transition hover:bg-[#f7bf6a]"
            >
              Juneau Flight Deck · Whale Deck ↗
            </a>
            <a
              href={primarySpecialistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/12 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white/84 transition hover:bg-white/[0.06]"
            >
              Juneau Whale Watching (Last Frontier Shore Excursions) ↗
            </a>
            <a
              href={comboDecisionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/12 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white/84 transition hover:bg-white/[0.06]"
            >
              Whale Watching vs. Glacier Combo Guide ↗
            </a>
            <a
              href={portWindowUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/12 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white/84 transition hover:bg-white/[0.06]"
            >
              Excursions by Cruise Ship Time ↗
            </a>
            <Link
              href="/juneau/cruise-excursions-what-to-do"
              data-testid="dcc-juneau-short-port-call-link"
              className="rounded-full border border-amber-400/35 bg-amber-500/15 px-5 py-3 text-sm font-bold text-amber-200 transition hover:bg-amber-500/25"
            >
              Which Tours Fit a Short Port Call? →
            </Link>
            <Link
              href="/juneau/what-to-do-if-helicopter-tour-canceled"
              data-testid="dcc-juneau-flight-canceled-guide-link"
              className="rounded-full border border-cyan-400/35 bg-cyan-500/15 px-5 py-3 text-sm font-bold text-cyan-200 transition hover:bg-cyan-500/25"
            >
              What to Do If Helicopter Canceled →
            </Link>
          </div>
        </section>

        <PartnerSharePlanningBar
          market="juneau"
          activePartnerParam={firstStr(resolvedSearch.partner)}
          activePartnerRoleParam={firstStr(resolvedSearch.partner_role)}
          activeCancelRefParam={cancelRefParam}
          activeTrafficSourceParam={firstStr(resolvedSearch.src)}
        />
      </div>
    </main>
  );
}
