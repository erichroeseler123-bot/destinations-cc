import { TourFeatureLinks } from "@/app/components/tour-tools/TourPlanningKit";
import PortfolioAssuranceBanner from "@/app/components/dcc/PortfolioAssuranceBanner";
import {
  buildPortfolioHandoffUrl,
  evaluatePortfolioAssuranceSummary,
  resolvePortfolioTripContext,
} from "@/lib/dcc/commerce/portfolio";
import { TOOLKIT_CONFIG } from "@/lib/toolkitConfig";
import { SITE_DESCRIPTION } from "@/lib/sitePositioning";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import BookingTransparency from "./components/BookingTransparency";
import HomeHero from "./components/HomeHero";
import HelicopterDispatchBoard from "./components/HelicopterDispatchBoard";
import NextHelicopterFinder from "./components/NextHelicopterFinder";
import TourSavingsCalculator from "./components/TourSavingsCalculator";

export const metadata: Metadata = {
  title: {
    absolute: "Juneau Helicopter Tours & Glacier Excursions | Compare & Book | Juneau Flight Deck",
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "https://juneauflightdeck.com/" },
  openGraph: {
    title: "Juneau Helicopter Tours & Glacier Excursions | Compare & Book | Juneau Flight Deck",
    description: SITE_DESCRIPTION,
    url: "https://juneauflightdeck.com/",
    siteName: "Juneau Flight Deck",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Juneau Helicopter Tours & Glacier Excursions | Compare & Book",
    description: SITE_DESCRIPTION,
  },
};

const CP =
  "https://cruisepromenade.com/?utm_source=juneauflightdeck&utm_medium=referral&utm_campaign=alaska_cruise_planning";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  let cookieCtx: string | null = null;
  try {
    const cookieStore = await cookies();
    cookieCtx =
      cookieStore.get("jfd_checkout_session")?.value ||
      cookieStore.get("dcc_trip_ctx")?.value ||
      null;
  } catch {
    cookieCtx = null;
  }
  const carriedContext = await resolvePortfolioTripContext({
    searchParams: resolvedSearchParams,
    cookieContextId: cookieCtx,
    claimingOwner: "juneauflightdeck.com",
    issueIfParamsPresent: true,
    defaultPortSlug: "juneau",
  });
  const assurance = evaluatePortfolioAssuranceSummary({
    engineId: "juneau-helicopter-tours",
    inputs: {
      portDurationMinutes: 300,
      partySize: carriedContext.payload.partySize || 2,
      maxPassengerWeightLbs: 210,
      scubaWithin24h: false,
    },
    callerClientId: "ssr:juneauflightdeck.com",
  });
  const viatorHandoffHref = buildPortfolioHandoffUrl({
    originatingSite: "juneauflightdeck.com",
    provider: "viator",
    providerAccount: "P00058396",
    productCode: "41920P1",
    destinationUrl:
      "https://www.viator.com/Juneau-tourism/d941-r8418047970-s323605581?pid=P00058396&mcid=42383&medium=api",
    campaign: "jfd-home-viator",
    contextId: carriedContext.contextId,
    evaluationRunId: assurance.evaluationRunId,
    receiptId: assurance.receiptId,
    intendedDate: carriedContext.payload.date || null,
    partySize: carriedContext.payload.partySize || null,
  });
  const operatorHandoffHref = buildPortfolioHandoffUrl({
    originatingSite: "juneauflightdeck.com",
    provider: "direct_operator",
    providerAccount: "temsco-juneau",
    productCode: "juneau-mendenhall-heli-landing",
    destinationUrl: "https://temscoair.com/juneau-tours/",
    campaign: "jfd-home-temsco",
    contextId: carriedContext.contextId,
    evaluationRunId: assurance.evaluationRunId,
    receiptId: assurance.receiptId,
    intendedDate: carriedContext.payload.date || null,
    partySize: carriedContext.payload.partySize || null,
  });
  const ctxQuery = carriedContext.contextId ? `?ctx=${encodeURIComponent(carriedContext.contextId)}` : "";

  return (
    <main id="main-content">
      <HomeHero />
      <PortfolioAssuranceBanner
        siteDomain="juneauflightdeck.com"
        assurance={assurance}
        carriedContext={carriedContext}
        handoffActions={[
          {
            label: "Book Juneau Glacier Flights via Viator",
            href: viatorHandoffHref,
            providerLabel: "Viator",
            accountLabel: "pid=P00058396",
          },
          {
            label: "Check TEMSCO Direct Operator Calendar",
            href: operatorHandoffHref,
            providerLabel: "Direct Operator",
            accountLabel: "TEMSCO Part 135",
          },
        ]}
        crossSiteLinks={[
          {
            label: "Compare All Alaska Port Windows on Last Frontier Shore Excursions",
            href: `https://www.lastfrontiershoreexcursions.com/${ctxQuery}`,
          },
          {
            label: "Return to Cruise Promenade Planner",
            href: `https://cruisepromenade.com/planner${ctxQuery}`,
          },
          {
            label: "Verify on Destination Command Center",
            href: `https://www.destinationcommandcenter.com/${ctxQuery}`,
          },
        ]}
      />
      <TourSavingsCalculator />
      <BookingTransparency />
      <NextHelicopterFinder />
      <TourFeatureLinks config={TOOLKIT_CONFIG} />
      <HelicopterDispatchBoard
        portSlug="juneau"
        sourcePage="/"
        headline="Book Your Juneau Glacier Experience with Confidence"
        subhead="Compare helicopter landings, glacier walks, ice treks, and dog sledding. Use our operator comparisons, icefield map, cruise pickup guidance, and planning help to choose the right tour for your port day."
        primaryCtaLabel="Find Your Tour"
        initialDate={carriedContext.payload.date || null}
        initialPassengerCount={carriedContext.payload.partySize || null}
      />
      <section
        aria-label="Plan the rest of your cruise"
        style={{ maxWidth: 1120, margin: "0 auto 52px", padding: "0 20px" }}
      >
        <div
          style={{
            border: "1px solid rgba(17,41,61,.18)",
            borderRadius: 18,
            padding: "24px 26px",
            background: "#f5f8fa",
            color: "#11293d",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "#334155",
            }}
          >
            Planning more than Juneau?
          </div>
          <h2 style={{ margin: "8px 0", fontSize: "clamp(24px,4vw,36px)" }}>
            Put the whole cruise in one shared plan.
          </h2>
          <p style={{ margin: "0 0 16px", lineHeight: 1.6, maxWidth: 760, color: "#1e293b" }}>
            Cruise Promenade gives your group one private cruise planner for port days,
            booked activities and the plans everyone needs to see.
          </p>
          <a
            href={CP}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Plan the whole cruise on Cruise Promenade (opens in new tab)"
            style={{
              display: "inline-block",
              padding: "12px 18px",
              borderRadius: 10,
              background: "#11293d",
              color: "#ffffff",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Plan the whole cruise →
          </a>
        </div>
      </section>
    </main>
  );
}

