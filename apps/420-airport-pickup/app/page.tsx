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
    <AirportPickupHomeClient
      initialUiState={initialUiState}
      initialHandoffContext={handoffContext}
      initialResolutionDebug={initialResolutionDebug}
    />
  );
}
