import React, { Suspense } from "react";
import DccConciergeWidget from "@/app/components/dcc/DccConciergeWidget";
import type { PickupFulfillmentType } from "@/lib/dcc/catalog/durableCatalogStore";

export const dynamic = "force-dynamic";

type EmbedConciergePageProps = {
  searchParams: Promise<{
    destination?: string;
    property?: string;
    surface?: string;
    pickupMode?: string;
  }>;
};

export default async function EmbedConciergePage({ searchParams }: EmbedConciergePageProps) {
  const query = await searchParams;
  const destination = query.destination?.trim() || "new-orleans";
  const propertySlug = query.property?.trim() || "hotel-monteleone-nola";
  const surface = (query.surface?.trim() || "hotel_concierge") as
    | "dcc"
    | "hotel_concierge"
    | "cruisepromenade"
    | "welcometoneworleanstours"
    | "welcometotheswamp"
    | "juneau-flight-deck";
  const pickupMode = (query.pickupMode?.trim() || undefined) as
    | "any"
    | PickupFulfillmentType
    | undefined;

  return (
    <main
      data-testid="dcc-external-embed-frame"
      className="min-h-screen bg-slate-950 p-3 sm:p-4 text-slate-100"
    >
      <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading Concierge Widget…</div>}>
        <DccConciergeWidget
          initialDestination={destination}
          initialPropertySlug={propertySlug}
          initialSurface={surface}
          initialPickupMode={pickupMode}
          embedMode={true}
        />
      </Suspense>
    </main>
  );
}
