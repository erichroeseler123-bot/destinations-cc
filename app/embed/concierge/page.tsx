import React, { Suspense } from "react";
import DccConciergeWidget from "@/app/components/dcc/DccConciergeWidget";
import type { PickupFulfillmentType } from "@/lib/dcc/catalog/durableCatalogStore";

export const dynamic = "force-dynamic";

type EmbedConciergePageProps = {
  searchParams: Promise<{
    destination?: string;
    property?: string;
    placementId?: string;
    placement?: string;
    surface?: string;
    pickupMode?: string;
    date?: string;
    category?: string;
    shipArrival?: string;
    allAboard?: string;
    isTest?: string;
    parentOrigin?: string;
  }>;
};

export default async function EmbedConciergePage({ searchParams }: EmbedConciergePageProps) {
  const query = await searchParams;
  const destination = query.destination?.trim() || "new-orleans";
  const propertySlug = query.property?.trim() || "hotel-monteleone-nola";
  const placementId =
    query.placementId?.trim() ||
    query.placement?.trim() ||
    (propertySlug === "hotel-monteleone-nola" ? "nola-hotel-monteleone-demo-pilot" : undefined);
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
  const isTest = query.isTest === "true" || query.isTest === "1";

  return (
    <main
      data-testid="dcc-external-embed-frame"
      className="min-h-screen bg-slate-950 p-3 sm:p-4 text-slate-100"
    >
      <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading Concierge Widget…</div>}>
        <DccConciergeWidget
          initialDestination={destination}
          initialPropertySlug={propertySlug}
          initialPlacementId={placementId}
          initialSurface={surface}
          initialPickupMode={pickupMode}
          initialDate={query.date?.trim() || undefined}
          initialCategory={query.category?.trim() || undefined}
          initialShipArrival={query.shipArrival?.trim() || undefined}
          initialAllAboardTime={query.allAboard?.trim() || undefined}
          embedMode={true}
          isTest={isTest}
          parentOrigin={query.parentOrigin?.trim() || undefined}
        />
      </Suspense>
    </main>
  );
}
