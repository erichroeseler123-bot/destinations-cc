import React from "react";
import DccConciergeWidget, {
  type DccConciergeWidgetProps,
} from "@/app/components/dcc/DccConciergeWidget";
import { getHotelConciergeConfig } from "@/lib/dcc/catalog/hotelConfigs";

export const dynamic = "force-dynamic";

type EmbedConciergePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EmbedConciergePage({ searchParams }: EmbedConciergePageProps) {
  const sp = (await searchParams) || {};
  const propertySlug =
    typeof sp.property === "string"
      ? sp.property
      : typeof sp.propertySlug === "string"
        ? sp.propertySlug
        : "hotel-monteleone-nola";
  const hotelCfg = getHotelConciergeConfig(propertySlug);
  const destination =
    typeof sp.destination === "string" ? sp.destination : hotelCfg.destinationSlug;
  const surface = (
    typeof sp.surface === "string" ? sp.surface : "hotel_concierge"
  ) as DccConciergeWidgetProps["initialSurface"];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div>
            <span className="font-semibold text-emerald-400">DCC Embeddable Hotel Concierge</span>{" "}
            — Shared Tour Catalog &amp; Trip-Matching Service
          </div>
          <div className="font-mono">
            Embed URL: /embed/concierge?property={hotelCfg.propertySlug}&amp;destination=
            {destination}
          </div>
        </div>

        <DccConciergeWidget
          initialDestination={destination}
          initialPropertySlug={hotelCfg.propertySlug}
          initialSurface={surface}
          embedMode={true}
        />
      </div>
    </main>
  );
}
