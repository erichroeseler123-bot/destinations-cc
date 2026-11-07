import type { Metadata } from "next";
import Link from "next/link";
import ApplicableRouteDecisionPanel from "@/app/components/dcc/ApplicableRouteDecisionPanel";
import ColoradoFactComparisonTable from "@/app/components/dcc/ColoradoFactComparisonTable";
import JsonLd from "@/app/components/dcc/JsonLd";
import NextStepEngine from "@/app/components/dcc/NextStepEngine";
import PublicMaterialChangeTimeline from "@/app/components/dcc/PublicMaterialChangeTimeline";
import { issueOpaqueClickAttribution } from "@/lib/dcc/commerce/opaqueAttributionLedger";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
} from "@/lib/dcc/jsonld";
import { syncDurableLedgerWithPostgres } from "@/lib/dcc/storage/durableTransactionalStore";
import { getPublicationManifestEntry } from "@/src/data/publication-manifest";
import {
  DENVER_TO_VAIL_SHUTTLE_GUIDE_PATH,
  buildDenverToVailShuttleGuidePageModel,
} from "./model";

const PAGE_PATH = DENVER_TO_VAIL_SHUTTLE_GUIDE_PATH;
const manifestEntry = getPublicationManifestEntry(PAGE_PATH);

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Denver to Vail Shuttle Guide | Timing, Group Fit, and Transfer Logic",
  description:
    "DCC authority page for Denver to Vail shuttle decisions, transfer timing, and group-fit before execution on GOSNO.",
  alternates: { canonical: manifestEntry?.canonicalUrl || PAGE_PATH },
  robots: {
    index: manifestEntry?.indexingState === "index_follow",
    follow: manifestEntry?.indexingState === "index_follow",
  },
};

export default async function DenverToVailShuttleGuidePage() {
  await syncDurableLedgerWithPostgres();
  const {
    vailGuide,
    vailPricing,
    verifiedAt,
    citations,
    gosnoContract,
    materialChangeEntries,
    actions,
    basePartnerDestinationUrl,
    initialOutcome,
  } = buildDenverToVailShuttleGuidePageModel();

  const initialOpaqueRecord = issueOpaqueClickAttribution({
    decisionReceiptId: initialOutcome.decisionReceiptId,
    recommendedOperatorId:
      initialOutcome.recommendedOperatorId || "gosno:vail-private-van",
    recommendedOperatorName: initialOutcome.recommendedOperatorName,
    recommendedVehicleClassId: initialOutcome.recommendedVehicleClassId,
    evidenceVersion: initialOutcome.evidenceVersion,
    applicabilityModelVersion: initialOutcome.modelVersion,
    applicabilityOutcomeHash: initialOutcome.outcomeHash,
    provider: "direct",
    productCode: initialOutcome.recommendedVehicleClassId || "gosno-vail-van",
    productDestinationUrl: basePartnerDestinationUrl,
  });

  const jsonLdData = {
    "@context": "https://schema.org",
    "@graph": [
      buildWebPageJsonLd({
        path: PAGE_PATH,
        name: "Denver to Vail Shuttle Guide | Timing, Group Fit, and Transfer Logic",
        description:
          "DCC authority page for Denver to Vail shuttle decisions, transfer timing, and group-fit before execution on GoSno.",
        dateModified: verifiedAt,
        isPartOfPath: "/transportation/colorado",
      }),
      buildArticleJsonLd({
        path: PAGE_PATH,
        headline:
          "Denver to Vail shuttle planning should solve passenger + ski-bag capacity and winter corridor risk before price-only comparison.",
        description:
          vailGuide?.description ||
          "Source-backed comparison of private vans, shared shuttles, AWD rentals, and Bustang transit from DEN to Vail.",
        dateModified: verifiedAt,
      }),
      buildBreadcrumbJsonLd([
        { name: "Colorado Transportation", item: "/transportation/colorado" },
        { name: "Denver to Vail Shuttle Guide", item: PAGE_PATH },
      ]),
    ],
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <JsonLd data={jsonLdData} />
      <div className="mx-auto max-w-5xl px-6 py-16 space-y-8">
        <header className="rounded-[2rem] border border-white/10 bg-white/5 p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Colorado ski-transfer authority</p>
            <p className="text-xs text-zinc-400">Sources verified: {verifiedAt}</p>
          </div>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            Denver to Vail shuttle planning should solve passenger + ski-bag capacity and winter corridor risk before price-only comparison.
          </h1>
          <p className="mt-4 max-w-4xl text-base leading-8 text-zinc-300">
            DCC’s job here is to separate passenger seats from ski-gear volume and compare private vans, per-seat shared shuttles,
            rental vehicles, and public transit fairly—including when you do not need a rental car at all once in pedestrian Vail Village.
          </p>
        </header>

        <ApplicableRouteDecisionPanel
          initialOutcome={initialOutcome}
          initialOpaqueAttribution={{
            clickId: initialOpaqueRecord.clickId,
            outboundPartnerUrl: initialOpaqueRecord.outboundPartnerUrl,
            recommendedOperatorId: initialOpaqueRecord.recommendedOperatorId,
            recommendedOperatorName: initialOpaqueRecord.recommendedOperatorName,
          }}
          basePartnerDestinationUrl={basePartnerDestinationUrl}
        />

        <ColoradoFactComparisonTable />

        <section className="rounded-3xl border border-amber-400/25 bg-amber-500/[0.06] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">
            Critical Capacity Rule: Do Not Conflate Seats with Ski-Bag Volume
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-200">
            A standard 3-row full-size SUV has 5–6 usable passenger seats only when the third row is raised, which leaves rear cargo room for roughly 4–5 standard bags and <strong>zero full-length (170–190 cm) ski bags inside the cabin</strong> unless a rooftop box is confirmed and the third row is partially folded.
          </p>
          <p className="mt-2 text-sm leading-7 text-zinc-200">
            <strong>For 7–10 passengers with ski bags (11+ passengers exceed a single GoSno van):</strong> A single 6-passenger SUV cannot legally or physically hold the group. On GoSno, private SUV transfers cap at <strong>up to 6 passengers ({vailPricing.suvOneWayLabel} DEN to Vail)</strong>, while <strong>private passenger vans carry up to 10 passengers, subject to luggage and ski-gear fit and availability</strong> (GoSno publishes a {vailPricing.vanOneWayLabel} DEN–Vail van rate on <code>gosno.co/vail</code>, while its live <code>/api/availability</code> endpoint marks van requests <code>quoteOnly: true</code>). Groups of <strong>11 or more passengers are ineligible for a single GoSno van</strong>; when a party wants a private transfer and exceeds the 10-passenger single-vehicle limit, DCC offers GoSno&rsquo;s multi-vehicle group inquiry (<code>gosno.co/request-quote</code>), suggesting <strong>a van plus a Suburban for 16 passengers</strong> or <strong>two vans for 20 passengers</strong>, where <strong>GoSno confirms gear fit, availability, and one group total</strong>.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Direct Operator / Private Van</p>
            <h2 className="mt-2 text-2xl font-bold">Private Passenger Van — Up to 10 Passengers (GoSno)</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              <strong>Why it fits 7–10 people with ski bags:</strong> Carries up to 10 passengers, subject to luggage and ski-gear fit and availability, in one private door-to-door vehicle from DEN to Vail with a complimentary 20–30 minute grocery stop on advance request.
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              <strong>What could make it unsuitable:</strong> Groups of 11+ passengers (ineligible for a single GoSno van; use GoSno&rsquo;s multi-vehicle group inquiry at <code>gosno.co/request-quote</code> — suggesting a van plus a Suburban for 16, or two vans for 20 — where GoSno confirms gear fit, availability, and one group total), 10-passenger groups whose total ski/oversize and standard luggage exceeds the cabin cargo envelope, passengers arriving on widely separated flights hours apart, or dates where live van dispatch (`quoteOnly: true` on `/api/availability`, {vailPricing.vanPriceLabel} published on `gosno.co/vail`) is unavailable. (For 1–6 passengers with moderate gear, a single private SUV is {vailPricing.suvOneWayLabel}.)
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Scheduled Shared Shuttle</p>
            <h2 className="mt-2 text-2xl font-bold">Per-Seat Shared Shuttle (Epic Mountain Express)</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              <strong>Why it fits staggered arrivals:</strong> Priced per seat from DEN Level 5 (West Side near Carousel #18 / Door 502) to Vail Transfer Center ($59–$129/guest, varying by travel date and peak/holiday periods) or door-to-door ($69–$139/guest, or $55–$111 with 20% Epic Mountain Rewards on non-blackout dates). Standard allowance is 2 baggage items per guest (including a ski/snowboard bag) plus 1 small personal item ($10/additional item with advance notice).
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              <strong>What could make it unsuitable:</strong> At 7 peak-date seats, total per-person tickets often approach a single private van while adding terminal wait time and multi-stop resort drop-offs.
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Self-Drive Rental Cars</p>
            <h2 className="mt-2 text-2xl font-bold">Two AWD/4WD SUVs + Ski Racks</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              <strong>Why it fits off-corridor plans:</strong> Useful only if the group splits across multiple regions or needs daily off-corridor driving.
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              <strong>What could make it unsuitable:</strong> 7 people + ski bags require <strong>two separate AWD/4WD vehicles</strong> (or a specialty 12-passenger van rarely equipped for winter I-70), two drivers navigating Eisenhower Tunnel and Vail Pass under Colorado’s Passenger Vehicle Traction Law (C.R.S. § 42-4-106, Sept 1–May 31), and $40–$65+/night per vehicle in Vail Village/Lionshead overnight parking.
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Public Transit &amp; No-Car In-Resort</p>
            <h2 className="mt-2 text-2xl font-bold">RTD A-Line + CDOT Bustang + Free Vail Buses</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              <strong>Public / free options:</strong> Lowest cash outlay ($10.50 RTD A-Line from DEN to Denver Union Station + $17 CDOT Bustang West Line to Vail Transportation Center with under-coach bays). Once in Vail Village or Lionshead, Town of Vail in-town buses are <strong>100% free</strong>, so you do not need to rent a car for in-resort mobility.
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              <strong>What could make it unsuitable:</strong> Hauling 7 ski bags + 7 suitcases through a downtown rail-to-bus transfer and from Vail Transportation Center to lodging is high-friction for large groups or families.
            </p>
          </article>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">
            Explicit Assumptions &amp; Unknowns
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-300">
            <li>• <strong>Unknown without your trip details:</strong> Exact travel date, flight arrival times (single flight vs. staggered arrivals), hard-case vs. soft ski-bag count, child car-seat requirements (GoSno provides up to 1 booster + 1 forward-facing seat on request, but no rear-facing infant seats), and exact Vail drop-off address.</li>
            <li>• <strong>Unknown without a live operator check:</strong> GoSno private van availability and final dispatch confirmation for up to 10 passengers, subject to luggage and ski-gear fit (GoSno publishes {vailPricing.vanOneWayLabel} on <code>gosno.co/vail</code> while <code>/api/availability</code> returns <code>quoteOnly: true</code>; 11+ passengers exceed a single GoSno van), date-specific shared shuttle fare on your travel date, and live I-70 traction/chain law dispatch status.</li>
            <li>• <strong>GoSno DEN airport pickup discrepancy:</strong> GoSno&rsquo;s Vail answer card and <code>llms.txt</code> cite <em>DEN Level 5 Curbside, Island 2, Doors 506–510 West or 507–511 East</em>, whereas GoSno&rsquo;s pickup guide (<code>/denver-airport-private-driver-pickup</code>) and page FAQ state that exact DEN pickup doors vary with airport operating conditions and are sent via driver text after baggage claim.</li>
            <li>• <strong>Never guaranteed by a forecast:</strong> A clear weather forecast does not guarantee open I-70 lanes over Vail Pass or Eisenhower Tunnel; winter accidents and avalanche mitigation can stall the corridor at any time.</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6" data-dcc-shared-evidence-bound="true">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
              Sources &amp; Verification Timestamps
            </p>
            <span className="text-xs text-zinc-400">Snapshot: {vailGuide?.slug} · Checked {verifiedAt}</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm">
            {citations.map((cite) => (
              <div key={cite.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between gap-2">
                  <a href={cite.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-white hover:text-cyan-200 underline underline-offset-4">
                    {cite.label} ↗
                  </a>
                  <span className="text-xs text-zinc-400">Checked {cite.checkedAt}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-zinc-300">
                  {cite.claimSupported}
                </p>
              </div>
            ))}
          </div>
        </section>

        <PublicMaterialChangeTimeline entries={materialChangeEntries} />

        {gosnoContract && (
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs leading-6 text-zinc-400" data-dcc-compliance-disclosure="true">
            <strong className="text-zinc-200">Ownership &amp; Commercial Disclosure:</strong>{" "}
            <strong>{gosnoContract.name}</strong> (<code>{gosnoContract.canonicalUrl}</code>) is a connected property in the DCC portfolio ({gosnoContract.networkRole.replace(/_/g, " ")}). Commercial or portfolio status never changes DCC&rsquo;s vehicle capacity math or inclusion of shared shuttle, rental, and public transit alternatives. See our{" "}
            <Link href="/affiliate-disclosure" className="text-cyan-300 underline underline-offset-4">
              Affiliate &amp; Portfolio Disclosure
            </Link>
            .
          </section>
        )}

        <NextStepEngine
          title="Best next step for this ski-transfer intent"
          description="DCC owns the corridor capacity comparison and routes you directly to the Vail corridor page or operator profile—never a generic homepage."
          actions={actions}
        />

        <div className="flex flex-wrap gap-3">
          <Link href="/transportation/colorado" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm hover:bg-white/10">
            Colorado transportation directory
          </Link>
          <Link href="/operators/gosno" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm hover:bg-white/10">
            GoSno operator profile
          </Link>
          <Link href="/authority" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm hover:bg-white/10">
            Authority hub
          </Link>
        </div>
      </div>
    </main>
  );
}
