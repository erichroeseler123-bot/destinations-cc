import AirportPickupHomeClient from "./components/AirportPickupHomeClient";
import { readHandoffContext } from "@/lib/handoff/readContext";
import { resolveInitialState } from "@/lib/handoff/resolveInitialState";
import { applyConfidenceGate, validateAirport420State } from "@/lib/handoff/safety";
import { airport420BaseState, airport420ResolverRules } from "@/lib/handoff/airport420Resolver";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "420-Friendly Airport Pickup in Denver",
  description:
    "Private airport pickup from DEN with a driver who understands the experience. Book a 420-friendly ride directly.",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "420-Friendly Airport Pickup in Denver",
    description:
      "Private ride from DEN with a driver who understands the experience.",
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
