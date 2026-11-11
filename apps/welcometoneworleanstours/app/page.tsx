import type { Metadata } from "next";
import { cookies } from "next/headers";
import CinematicHomepageTop from "./CinematicHomepageTop";
import PortfolioAssuranceBanner from "@/app/components/dcc/PortfolioAssuranceBanner";
import {
  buildPortfolioHandoffUrl,
  evaluatePortfolioAssuranceSummary,
  resolvePortfolioTripContext,
} from "@/lib/dcc/commerce/portfolio";

// Keep this app entrypoint tied to the shared New Orleans storefront. Category routes
// provide category- and product-specific DCC assurance, approved commerce imagery, high-contrast, legacy-safe tour-card overlays, live decision-center references, ranking, and operator handoff policy.
export const metadata: Metadata = {
  title: "Welcome to New Orleans Tours | Find the Right Experience",
  description: "Choose the New Orleans experience that fits your group, time, transportation, and interests, then check live operator availability.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Welcome to New Orleans Tours | Find the Right Experience",
    description: "Choose the New Orleans experience that fits your group, time, transportation, and interests.",
    url: "/",
    type: "website",
  },
};

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) || {};
  let cookieCtx: string | null = null;
  try {
    const cookieStore = await cookies();
    cookieCtx =
      cookieStore.get("wtno_trip_ctx")?.value ||
      cookieStore.get("dcc_trip_ctx")?.value ||
      null;
  } catch {
    cookieCtx = null;
  }
  const carriedContext = await resolvePortfolioTripContext({
    searchParams: sp,
    cookieContextId: cookieCtx,
    claimingOwner: "welcometoneworleanstours.com",
    issueIfParamsPresent: true,
    defaultPortSlug: "new-orleans",
  });
  const assurance = evaluatePortfolioAssuranceSummary({
    engineId: "new-orleans-city-tours",
    inputs: {
      portSlug: "new-orleans",
      date: carriedContext.payload.date || "2026-11-15",
      partySize: carriedContext.payload.partySize || 2,
    },
    callerClientId: "portfolio:welcometoneworleanstours.com",
  });

  const viatorHandoffHref = buildPortfolioHandoffUrl({
    originatingSite: "welcometoneworleanstours.com",
    provider: "viator",
    providerAccount: "P00058396",
    productCode: "5070FRENCHQ",
    destinationUrl: "https://www.viator.com/New-Orleans/d675-ttd?pid=P00058396&mcid=42383&medium=link",
    campaign: "wtno-home-viator",
    contextId: carriedContext.contextId,
    evaluationRunId: assurance.evaluationRunId,
    receiptId: assurance.receiptId,
    intendedDate: carriedContext.payload.date || null,
    partySize: carriedContext.payload.partySize || null,
  });

  const gygHandoffHref = buildPortfolioHandoffUrl({
    originatingSite: "welcometoneworleanstours.com",
    provider: "getyourguide",
    providerAccount: "F2MMUUH",
    productCode: "nola-l372",
    destinationUrl: "https://www.getyourguide.com/new-orleans-l372/?partner_id=F2MMUUH",
    campaign: "wtno-home-gyg",
    contextId: carriedContext.contextId,
    evaluationRunId: assurance.evaluationRunId,
    receiptId: assurance.receiptId,
    intendedDate: carriedContext.payload.date || null,
    partySize: carriedContext.payload.partySize || null,
  });

  const crossSiteParams = new URLSearchParams();
  if (carriedContext.contextId) {
    crossSiteParams.set("ctx", carriedContext.contextId);
  }
  if (carriedContext.payload.date) {
    crossSiteParams.set("date", carriedContext.payload.date);
  }
  if (carriedContext.payload.partySize) {
    crossSiteParams.set("party_size", String(carriedContext.payload.partySize));
  }
  const pickupParam = Array.isArray(sp.pickup) ? sp.pickup[0] : sp.pickup;
  const boatTypeParam = Array.isArray(sp.boat_type) ? sp.boat_type[0] : sp.boat_type;
  if (typeof pickupParam === "string" && pickupParam.trim()) {
    crossSiteParams.set("pickup", pickupParam.trim());
  }
  if (typeof boatTypeParam === "string" && boatTypeParam.trim()) {
    crossSiteParams.set("boat_type", boatTypeParam.trim());
  }
  const ctxSuffix = crossSiteParams.toString()
    ? `?${crossSiteParams.toString()}`
    : "";

  return (
    <>
      <CinematicHomepageTop />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <PortfolioAssuranceBanner
          siteDomain="welcometoneworleanstours.com"
          assurance={assurance}
          carriedContext={carriedContext}
          handoffActions={[
            {
              label: "Verify Live New Orleans Availability on Viator",
              href: viatorHandoffHref,
              providerLabel: "Viator",
              accountLabel: "P00058396",
            },
            {
              label: "Compare New Orleans Options on GetYourGuide",
              href: gygHandoffHref,
              providerLabel: "GetYourGuide",
              accountLabel: "F2MMUUH",
            },
          ]}
          crossSiteLinks={[
            {
              label: "Compare Bayou & Airboat Boats on Welcome to the Swamp →",
              href: `https://www.welcometotheswamp.com/${ctxSuffix}`,
            },
            {
              label: "Open DCC New Orleans Hub →",
              href: `https://www.destinationcommandcenter.com/new-orleans/swamp-tours${ctxSuffix}`,
            },
          ]}
        />
      </div>
    </>
  );
}
