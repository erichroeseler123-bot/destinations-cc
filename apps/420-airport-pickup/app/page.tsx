import Link from "next/link";
import AirportPickupHomeClient from "./components/AirportPickupHomeClient";
import { readHandoffContext } from "@/lib/handoff/readContext";
import { resolveInitialState } from "@/lib/handoff/resolveInitialState";
import { applyConfidenceGate, validateAirport420State } from "@/lib/handoff/safety";
import { airport420BaseState, airport420ResolverRules } from "@/lib/handoff/airport420Resolver";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "420-Friendly Colorado Airport Transportation | DEN & COS",
  description:
    "Private Colorado airport transportation for adults 21+ from DEN and COS, with Denver, Colorado Springs, and mountain destinations plus optional lawful dispensary-stop planning when practical.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "420-Friendly Colorado Airport Transportation | DEN & COS",
    description:
      "Private airport transportation from Denver International Airport and Colorado Springs Airport with optional lawful 21+ retail-stop planning when practical.",
    url: "https://420friendlyairportpickup.com/",
    type: "website",
  },
};

const GOSNO =
  "https://gosno.co/?utm_source=420friendlyairportpickup&utm_medium=referral&utm_campaign=colorado_airport_transfer";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = searchParams ? await searchParams : {};
  const handoffContext = readHandoffContext(resolved);
  const resolvedUi = resolveInitialState(
    handoffContext,
    airport420BaseState,
    airport420ResolverRules,
  );
  const gatedUi = applyConfidenceGate(resolvedUi, airport420BaseState);
  const initialUiState = validateAirport420State(gatedUi.state);
  const initialResolutionDebug = {
    downgraded: gatedUi.downgraded,
    winners: Array.from(gatedUi.winners.entries()).map(([field, winner]) => ({
      field,
      confidence: winner.confidence,
      ruleId: winner.ruleId,
      reason: winner.reason,
    })),
  };

  return (
    <>
      <AirportPickupHomeClient
        initialUiState={initialUiState}
        initialHandoffContext={handoffContext}
        initialResolutionDebug={initialResolutionDebug}
      />
      <aside className="panel" aria-labelledby="denver-420-guides">
        <p className="eyebrow">Denver 420-friendly airport pickup</p>
        <h2 id="denver-420-guides">Need the DEN-specific 420-friendly route?</h2>
        <p className="muted">
          Use the dedicated Denver pages when the optional lawful retail stop is part of the airport-arrival plan. They explain the 21+ route, private-pickup boundary, and booking lane without mixing it into every Colorado transfer.
        </p>
        <div className="cta-row">
          <Link className="button-secondary" href="/denver-airport-420-friendly-pickup">
            420 Friendly Airport Pickup Denver
          </Link>
          <Link className="button-secondary" href="/420-friendly-airport-transport-denver">
            420 Friendly Airport Transport Denver
          </Link>
        </div>
      </aside>
      <aside className="panel" aria-labelledby="gosno-transfer-handoff">
        <p className="eyebrow">Heading to the mountains?</p>
        <h2 id="gosno-transfer-handoff">Continue to GoSno for the actual private transfer.</h2>
        <p className="muted">
          If your trip is a DEN or COS private transfer to a Colorado mountain destination, GoSno is the operating transportation business and controls current service, pricing and availability.
        </p>
        <div className="cta-row">
          <a className="button-secondary" href={GOSNO}>
            Check GoSno transportation ↗
          </a>
        </div>
      </aside>
    </>
  );
}
