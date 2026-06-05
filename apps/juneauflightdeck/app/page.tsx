import JuneauHomeClient from "./components/JuneauHomeClient";
import { readHandoffContext } from "../lib/handoff/readContext";
import { resolveInitialState } from "../lib/handoff/resolveInitialState";
import { applyConfidenceGate, validateJfdState } from "../lib/handoff/safety";
import { jfdBaseState, jfdResolverRules } from "../lib/handoff/jfdResolver";
import type { HandoffContext } from "../lib/handoff/types";
import { readDecisionModeFromSearchParams } from "../lib/session/decisionMode";

export const dynamic = "force-dynamic";

type ViatorProduct = {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  priceLabel: string | null;
  imageUrl: string | null;
  supplierName: string | null;
  bookHref: string;
};

type JuneauProductsResponse = {
  generatedAt: string;
  selectedDate?: string | null;
  signals: { headline?: string };
  browseHref?: string;
  products: ViatorProduct[];
};

const DCC_ORIGIN = process.env.DCC_ORIGIN || "https://www.destinationcommandcenter.com";

async function getInitialData(context: HandoffContext): Promise<JuneauProductsResponse | null> {
  if (!context.date) return null;

  try {
    const response = await fetch(
      `${DCC_ORIGIN}/api/public/juneau-heli-products-viator?date=${encodeURIComponent(context.date)}`,
      { cache: "no-store" },
    );
    if (!response.ok) throw new Error("Failed to load Juneau helicopter products");
    return (await response.json()) as JuneauProductsResponse;
  } catch {
    return {
      generatedAt: new Date().toISOString(),
      selectedDate: context.date,
      signals: {},
      products: [],
    };
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = searchParams ? await searchParams : {};
  const handoffContext = readHandoffContext(resolved);
  const resolvedUi = resolveInitialState(handoffContext, jfdBaseState, jfdResolverRules);
  const gatedUi = applyConfidenceGate(resolvedUi, jfdBaseState);
  const initialUiState = validateJfdState(gatedUi.state);
  const initialData = await getInitialData(handoffContext);
  const initialDecisionMode = readDecisionModeFromSearchParams(resolved);
  const seasonYear = Number(
    (handoffContext.date || new Date().toISOString().slice(0, 10)).slice(0, 4),
  );
  const initialResolutionDebug = {
    downgraded: gatedUi.downgraded,
    winners: [...gatedUi.winners.entries()].map(([field, winner]) => ({
      field,
      confidence: winner.confidence,
      ruleId: winner.ruleId,
      reason: winner.reason,
    })),
  };

  return (
    <JuneauHomeClient
      initialDate={handoffContext.date || ""}
      initialQuery={typeof resolved.q === "string" ? resolved.q : ""}
      initialWidgetMode={resolved.widget === "1"}
      initialHandoffId={handoffContext.handoffId || ""}
      initialData={initialData}
      initialHandoffContext={handoffContext}
      initialUiState={initialUiState}
      initialDecisionMode={initialDecisionMode}
      initialResolutionDebug={initialResolutionDebug}
      seasonYear={Number.isFinite(seasonYear) ? seasonYear : new Date().getFullYear()}
    />
  );
}
