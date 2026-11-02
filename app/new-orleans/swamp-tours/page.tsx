import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/app/components/dcc/JsonLd";
import PageIntentRouter from "@/app/components/dcc/PageIntentRouter";
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildWebPageJsonLd,
} from "@/lib/dcc/jsonld";
import { buildSwampPlanHref } from "@/lib/dcc/warmTransfer";
import PortfolioAssuranceBanner from "@/app/components/dcc/PortfolioAssuranceBanner";
import {
  buildPortfolioHandoffUrl,
  evaluatePortfolioAssuranceSummary,
  resolvePortfolioTripContext,
} from "@/lib/dcc/commerce/portfolio";
import { NEW_ORLEANS_TOUR_CATEGORY_PAGES } from "@/src/data/new-orleans-city-site";
import { getPublishedDecisionGuide } from "@/src/data/published-decision-guides";
import { getPublicationManifestEntry } from "@/src/data/publication-manifest";

const page = NEW_ORLEANS_TOUR_CATEGORY_PAGES["swamp-tours"];
const PAGE_PATH = "/new-orleans/swamp-tours";
const PAGE_URL = "https://destinationcommandcenter.com/new-orleans/swamp-tours";
const SATELLITE_URL = "https://welcometotheswamp.com";
const PAGE_INTENT = "compare" as const;
const swampGuide = getPublishedDecisionGuide("new-orleans-swamp-tour-with-kids");
const manifestEntry = getPublicationManifestEntry(PAGE_PATH);

export const metadata: Metadata = {
  title: "DCC Fast Pass | New Orleans Swamp Tours | Live Availability and Direct Bookings",
  description:
    "DCC Fast Pass for New Orleans swamp tours. Understand the main buying lanes, then hand off to a dedicated mobile-first booking surface for live availability and direct bookings.",
  alternates: { canonical: manifestEntry?.canonicalUrl || PAGE_PATH },
  robots: {
    index: manifestEntry?.indexingState === "index_follow",
    follow: manifestEntry?.indexingState === "index_follow",
  },
  keywords: [
    "new orleans swamp tours",
    "new orleans airboat tours",
    "new orleans bayou tours",
    "swamp tours from new orleans",
  ],
  openGraph: {
    title: "DCC Fast Pass | New Orleans Swamp Tours",
    description:
      "DCC Fast Pass guide to New Orleans swamp-tour intent, with a direct handoff into the dedicated live-availability booking surface.",
    url: PAGE_URL,
    type: "website",
  },
};

function JsonLdGraph() {
  const verifiedAt = swampGuide?.verifiedAt || manifestEntry?.materialChangeDate || "2026-11-02";
  const laneItems = page.intents.map((intent) => ({
    name: intent.label,
    description: intent.description,
    url: buildSwampPlanHref({
      intent: "compare",
      topic: "swamp-tours",
      subtype: intent.label.toLowerCase().includes("airboat")
        ? "airboat"
        : intent.label.toLowerCase().includes("family")
          ? "families"
          : intent.label.toLowerCase().includes("half-day")
            ? "comfort"
            : "bayou",
      context: intent.label.toLowerCase().includes("family") ? "kids" : intent.label.toLowerCase().includes("half-day") ? "short-trip" : "first-time",
      sourcePage: PAGE_PATH,
    }),
  }));

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      buildWebPageJsonLd({
        path: PAGE_PATH,
        name: page.title,
        description: page.description,
        dateModified: verifiedAt,
        isPartOfPath: "/new-orleans",
      }),
      buildBreadcrumbJsonLd([
        { name: "New Orleans", item: "/new-orleans" },
        { name: "Tours", item: "/new-orleans/tours" },
        { name: "Swamp Tours", item: PAGE_PATH },
      ]),
      buildCollectionPageJsonLd({
        path: PAGE_PATH,
        name: "New Orleans swamp-tour buying lanes",
        description:
          "Decision lanes and handoff paths for visitors comparing New Orleans swamp tours before moving into the dedicated booking surface.",
        items: laneItems,
      }),
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What does DCC do on this page?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Destination Command Center explains the main swamp-tour buying lanes, then routes visitors into the dedicated live-availability booking surface.",
            },
          },
          {
            "@type": "Question",
            name: "How does booking work?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Visitors choose a live departure or live comparison path on the satellite site and then complete the reservation with the provider or the linked booking flow.",
            },
          },
        ],
      },
    ],
  };

  return <JsonLd data={data} />;
}

export const revalidate = 3600;

export default async function NewOrleansSwampToursPage() {
  const carriedContext = await resolvePortfolioTripContext({
    searchParams: {},
    claimingOwner: "destinationcommandcenter.com",
    issueIfParamsPresent: false,
    defaultPortSlug: "new-orleans",
  });

  const assurance = evaluatePortfolioAssuranceSummary({
    engineId: "new-orleans-swamp-tours",
    callerClientId: "ssr:destinationcommandcenter.com",
  });
  const fhHandoffHref = buildPortfolioHandoffUrl({
    originatingSite: "destinationcommandcenter.com",
    provider: "fareharbor",
    providerAccount: "aktourcenter",
    productCode: "ragincajun-airboat",
    destinationUrl: "https://fareharbor.com/embeds/book/ragincajuntours/items/228524/?asn=aktourcenter&ref=dcc-swamp-tours",
    campaign: "dcc-swamp-tours-fh",
    contextId: carriedContext.contextId,
    evaluationRunId: assurance.evaluationRunId,
    receiptId: assurance.receiptId,
    intendedDate: carriedContext.payload.date || null,
    partySize: carriedContext.payload.partySize || null,
    useRelativePath: true,
  });
  const viatorHandoffHref = buildPortfolioHandoffUrl({
    originatingSite: "destinationcommandcenter.com",
    provider: "viator",
    providerAccount: "P00058396",
    productCode: "nola-swamp-viator",
    destinationUrl: "https://www.viator.com/New-Orleans-tours/Nature-and-Wildlife/d675-g9-c36?pid=P00058396&mcid=42383",
    campaign: "dcc-swamp-tours-viator",
    contextId: carriedContext.contextId,
    evaluationRunId: assurance.evaluationRunId,
    receiptId: assurance.receiptId,
    intendedDate: carriedContext.payload.date || null,
    partySize: carriedContext.payload.partySize || null,
    useRelativePath: true,
  });
  const ctxQuery = carriedContext.contextId ? `?ctx=${encodeURIComponent(carriedContext.contextId)}` : "";

  const satelliteHref = buildSwampPlanHref({
    intent: "compare",
    topic: "swamp-tours",
    subtype: "comfort",
    context: "first-time",
    sourcePage: PAGE_PATH,
  });
  const mobileHandoffQr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(PAGE_URL)}`;

  return (
    <main className="min-h-screen bg-[#050816] text-white" data-page-intent={PAGE_INTENT}>
      <JsonLdGraph />
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-16">
        <PortfolioAssuranceBanner
          siteDomain="destinationcommandcenter.com"
          assurance={assurance}
          carriedContext={carriedContext}
          handoffActions={[
            {
              label: "Book Ragin Cajun Airboat via FareHarbor",
              href: fhHandoffHref,
              providerLabel: "FareHarbor",
              accountLabel: "asn=aktourcenter",
            },
            {
              label: "Compare Swamp Tours on Viator",
              href: viatorHandoffHref,
              providerLabel: "Viator",
              accountLabel: "pid=P00058396",
            },
          ]}
          crossSiteLinks={[
            {
              label: "Open Welcome to the Swamp Specialist Storefront",
              href: `https://welcometotheswamp.com/tours/airboat-tour${ctxQuery}`,
            },
            {
              label: "Open Welcome to New Orleans Tours",
              href: `https://www.welcometoneworleanstours.com/tours/airboat-small${ctxQuery}`,
            },
          ]}
        />
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(74,222,128,0.10),transparent_24%),linear-gradient(180deg,rgba(9,17,24,0.97),rgba(5,8,22,0.99))] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.45)] md:p-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">DCC swamp-tour lane</p>
            <div className="rounded-full border border-cyan-300/20 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">
              Intent: Compare
            </div>
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">{page.title}</h1>
          <p className="mt-4 text-base font-bold uppercase tracking-[0.18em] text-[#8df0cc]">
            DCC Decision Lane — Covered Pontoon vs. Airboat, Hotel Pickup &amp; Age Rules (Sources Verified: 2026-11-02)
          </p>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-white/82">{page.intro}</p>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/68">
            DCC is the source-backed decision and routing layer—not a live inventory calendar. Use the comparison below to verify boat type, child age restrictions, hotel shuttle inclusion, and current NPS trail closures before handing off to a direct operator, marketplace, or self-guided preserve.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={satelliteHref}
              className="rounded-2xl border border-[#7dd3fc]/30 bg-[linear-gradient(180deg,#7dd3fc,#4ade80)] px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#071018] shadow-[0_18px_38px_rgba(74,222,128,0.12)] transition hover:scale-[1.02]"
            >
              Compare on Welcome to the Swamp
            </a>
            <Link href="/guides/new-orleans-swamp-tour-with-kids" className="rounded-2xl border border-white/12 bg-white/6 px-5 py-3 text-sm text-white/88 hover:bg-white/10">
              Family &amp; No-Car Decision Guide
            </Link>
            <Link href="/new-orleans/tours" className="rounded-2xl border border-white/12 bg-white/6 px-5 py-3 text-sm text-white/88 hover:bg-white/10">
              Back to New Orleans tours
            </Link>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
                Source-Backed Comparison (Direct Operator, Marketplace, Public/Self-Guided, and No-Purchase)
              </p>
              <h2 className="mt-1 text-2xl font-bold text-white">
                How to choose for families, kids, and travelers without a car
              </h2>
            </div>
            <span className="text-xs text-white/60">Checked: 2026-11-02</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8df0cc]">Direct Operator / Covered Boat + Hotel or Coach Transport</p>
              <h3 className="mt-2 text-lg font-bold text-white">Covered Pontoon Swamp Boat with Pickup (Cajun Encounters / Cajun Pride / Gray Line)</h3>
              <p className="mt-2 text-sm leading-6 text-white/80">
                <strong>Why it fits families without a car:</strong> Shaded flat-bottom deck with guardrails, quiet enough for live narration, all ages permitted on Cajun Encounters&rsquo; Original Swamp Tour (from $39.99), Cajun Pride (Manchac refuge), and Gray Line ($65 adults 13+, $32 ages 6–12, infants 2–5 free), with round-trip hotel shuttle pickup or Gray Line&rsquo;s included motorcoach from 400 Toulouse St. (~3.75–5 hours door-to-door).
              </p>
              <p className="mt-2 text-xs leading-5 text-white/65">
                <strong>What could make it unsuitable:</strong> Slower pace than a planing airboat; Cajun Encounters&rsquo; 10–12 guest VIP Small-Boat Tour requires age 13+ unless booked private; travelers at residential rentals/Airbnbs must meet a designated hotel pickup stop or 400 Toulouse St.
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">Direct Operator / High-Speed Airboat (Age 5+ Only)</p>
              <h3 className="mt-2 text-lg font-bold text-white">Small or Large Airboat with $30/Person Hotel Shuttle (Airboat Adventures / Ragin Cajun)</h3>
              <p className="mt-2 text-sm leading-6 text-white/80">
                <strong>Why it fits older kids &amp; teens:</strong> High-speed open-air marsh skimming (6–30 passenger hulls, small airboats from $89/person on Airboat Adventures) for families whose children are all <strong>5 years and older</strong>; round-trip hotel transportation on Airboat Adventures is <strong>$30/person extra</strong> (pickup starts 1 hr 15 min prior from Downtown/French Quarter hotels only).
              </p>
              <p className="mt-2 text-xs leading-5 text-white/65">
                <strong>What could make it unsuitable:</strong> <strong>Children under 5, pregnant women, and anyone with neck or back injuries are strictly prohibited</strong> on airboats; guests must board unassisted; unshaded benches and loud fan engines require ear protection; Airboat Adventures&rsquo; shuttle does not pick up at residential addresses or Airbnbs.
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Public / Self-Guided Option (Car Required; 2026 Closure Alert)</p>
              <h3 className="mt-2 text-lg font-bold text-white">NPS Barataria Preserve (Twin Canals Only Free) &amp; Paid Wetland Trace Boardwalk</h3>
              <p className="mt-2 text-sm leading-6 text-white/80">
                <strong>Current NPS status (effective Feb 2, 2026 for ~2 years):</strong> The Barataria Preserve Visitor Center and most trails are <strong>closed for ~2 years</strong> of reconstruction. Only the <strong>Twin Canals parking lot, trail, and canoe launch</strong> remain open for free day-use access (with no restroom facilities). Visitor services and the open <strong>Wetland Trace Boardwalk</strong> are relocated 6 miles away to the <strong>Louisiana Wetlands Education Center</strong> (4917 City Park Drive, Jean Lafitte), which <strong>charges admission</strong> ($10 adults; $5 seniors, ages 13–17, LA residents, and military; children under 12 free with parent).
              </p>
              <p className="mt-2 text-xs leading-5 text-white/65">
                <strong>What could make it unsuitable:</strong> <strong>Neither site is served by public transit</strong>, most Barataria Preserve boardwalks are closed for ~2 years, and return Uber/Lyft pickups from Marrero/Jean Lafitte are unavailable—unsuitable without a car.
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">No-Purchase / Transit-Accessible Option</p>
              <h3 className="mt-2 text-lg font-bold text-white">Skip the Paid Swamp Tour — City Park &amp; Bayou Metairie via RTA Streetcar</h3>
              <p className="mt-2 text-sm leading-6 text-white/80">
                <strong>Why it fits tight budgets or bad weather:</strong> Reachable without a car for $1.25 on the Canal Street–City Park/Museum RTA streetcar; ancient live oaks, Couturie Forest lagoon paths, and zero rural transfer time.
              </p>
              <p className="mt-2 text-xs leading-5 text-white/65">
                <strong>What could make it unsuitable:</strong> Urban park setting rather than a wild cypress bayou boat excursion.
              </p>
            </article>
          </div>

          <div className="rounded-2xl border border-amber-400/25 bg-amber-500/[0.06] p-4 text-xs leading-6 text-amber-100/90">
            <strong>Explicit Assumptions &amp; Unknowns:</strong> Until you specify your youngest child&rsquo;s exact age, your hotel location, and your travel date, DCC cannot verify airboat eligibility or confirm which hotel shuttle stop applies. Swamp docks in Slidell (Honey Island), Manchac/LaPlace, and Jean Lafitte are 30–45 minutes outside New Orleans where return cab/Uber/Lyft service is unavailable—never book a &ldquo;Self-Drive / Meet at Dock&rdquo; ticket if you do not have a car. A weather forecast never guarantees a departure will run.
          </div>

          <div className="grid gap-3 md:grid-cols-2 text-xs text-white/75" data-dcc-shared-evidence-bound="true">
            {(swampGuide?.citations || []).map((cite) => (
              <div key={cite.id} className="rounded-2xl border border-white/10 bg-black/25 p-3.5">
                <a href={cite.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-white hover:text-cyan-200 underline underline-offset-4">
                  {cite.label} ↗
                </a>{" "}
                <span className="text-white/50">(Checked {cite.checkedAt})</span>: {cite.claimSupported}
              </div>
            ))}
          </div>
        </section>

        <section className="hidden items-center justify-between gap-8 rounded-3xl border border-[#8df0cc]/20 bg-[linear-gradient(135deg,rgba(17,29,31,0.96),rgba(7,14,22,0.96))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] lg:flex">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.24em] text-[#8df0cc]">Desktop handoff</div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">This site is designed for mobile.</h2>
            <p className="mt-3 text-base leading-7 text-white/76">
              DCC explains the lane here, but the fastest booking flow is on the dedicated mobile-first swamp-tour site.
            </p>
            <a
              href={satelliteHref}
              className="mt-5 inline-flex rounded-2xl border border-white/12 bg-white/6 px-5 py-3 text-sm font-medium text-white/88 hover:bg-white/10"
            >
              Open the comparison surface
            </a>
          </div>
          <div className="shrink-0 rounded-[2rem] border border-white/10 bg-white p-4 text-center shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
            <img
              src={mobileHandoffQr}
              alt="QR code to open the New Orleans swamp tours page on your phone"
              width={220}
              height={220}
              className="h-[220px] w-[220px] rounded-2xl"
            />
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">Scan on your phone</p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
            <h2 className="text-2xl font-bold">How this lane works</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-white/78">
              <p>
                Swamp-tour buyers usually already know the activity. The real friction is figuring out which type of ride fits the family (covered pontoon vs. high-speed airboat), whether hotel shuttle transport is included, and how to move into a specific operator product without bouncing through generic aggregator homepages.
              </p>
              <p>
                DCC handles the source-backed comparison and intent routing. The specialist satellite or direct operator surface handles live departure slots, and reservations are completed with the provider.
              </p>
            </div>
          </article>
          <article className="rounded-3xl border border-white/10 bg-black/20 p-6" data-dcc-compliance-disclosure="true">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Commercial transparency notice</div>
            <p className="mt-4 text-sm leading-7 text-white/76">
              DCC compares direct operator, marketplace, public/free, and no-purchase alternatives using the same constraint rules regardless of commission. If you choose to book through a partner link, DCC may earn a commission at no extra cost to you. Review our{" "}
              <Link href="/affiliate-disclosure" className="text-cyan-300 underline underline-offset-4">
                Affiliate &amp; Portfolio Disclosure
              </Link>
              .
            </p>
            <a
              href={satelliteHref}
              className="mt-5 inline-flex rounded-2xl border border-white/12 bg-white/6 px-4 py-3 text-sm font-medium text-white/88 hover:bg-white/10"
            >
              Open specialist swamp comparison
            </a>
          </article>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {page.intents.map((intent) => (
            <article key={intent.label} className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
              <h2 className="text-xl font-semibold text-white">{intent.label}</h2>
              <p className="mt-3 text-sm leading-7 text-white/74">{intent.description}</p>
              <a
                href={buildSwampPlanHref({
                  intent: "compare",
                  topic: "swamp-tours",
                  subtype: intent.label.toLowerCase().includes("airboat")
                    ? "airboat"
                    : intent.label.toLowerCase().includes("family")
                      ? "families"
                      : intent.label.toLowerCase().includes("half-day")
                        ? "comfort"
                        : "bayou",
                  context: intent.label.toLowerCase().includes("family") ? "kids" : intent.label.toLowerCase().includes("half-day") ? "short-trip" : "first-time",
                  sourcePage: PAGE_PATH,
                })}
                className="mt-5 inline-flex text-sm font-medium text-cyan-200 hover:text-cyan-100"
              >
                Hand off to this lane →
              </a>
            </article>
          ))}
        </section>

        <PageIntentRouter
          intent={PAGE_INTENT}
          title="What is the best next step after this swamp-tour page?"
          summary="This DCC lane should either send visitors into the dedicated decision surface, broaden them to the full New Orleans tours layer, or move them back into city context if they are not ready to compare."
          options={[
            {
              title: "Compare on Welcome to the Swamp",
              description: "Best next step if the visitor is already close to booking and needs narrowing help, not more broad context.",
              href: buildSwampPlanHref({
                intent: "compare",
                topic: "swamp-tours",
                subtype: "comfort",
                context: "first-time",
                sourcePage: PAGE_PATH,
              }),
              kind: "external",
              emphasis: "primary",
            },
            {
              title: "Open live swamp options",
              description: "Use the satellite live-options surface if the visitor already knows they want a swamp tour and just needs current choices.",
              href: buildSwampPlanHref({
                intent: "act",
                topic: "swamp-tours",
                subtype: "comfort",
                context: "first-time",
                sourcePage: PAGE_PATH,
              }),
              kind: "external",
            },
            {
              title: "Browse all New Orleans tours",
              description: "Broaden out if swamp tours are only one possibility and the visitor should compare the wider market.",
              href: "/new-orleans/tours",
              kind: "internal",
            },
            {
              title: "Go back to New Orleans authority",
              description: "Return to city context if the user is still in learn mode and deciding how the swamp fits the trip at all.",
              href: "/new-orleans",
              kind: "internal",
            },
          ]}
        />

        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
          <h2 className="text-2xl font-bold">What makes swamp tours fit a New Orleans trip</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {page.bullets.map((bullet) => (
              <article key={bullet} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/78">
                {bullet}
              </article>
            ))}
          </div>
        </section>

        <p className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-white/46">
          DCC Decision Layer — Source-Backed Comparison Before Booking
        </p>
      </div>
    </main>
  );
}
