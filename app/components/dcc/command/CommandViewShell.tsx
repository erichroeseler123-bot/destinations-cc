"use client";

import { useEffect, useMemo, useState } from "react";
import { BestCurrentMoves } from "@/app/components/dcc/command/BestCurrentMoves";
import { CommandAlertsRail } from "@/app/components/dcc/command/CommandAlertsRail";
import { CommandEntrySurfaceGrid } from "@/app/components/dcc/command/CommandEntrySurfaceGrid";
import { CommandMapCard } from "@/app/components/dcc/command/CommandMapCard";
import { CorridorHealthGrid } from "@/app/components/dcc/command/CorridorHealthGrid";
import { DestinationStatusStack } from "@/app/components/dcc/command/DestinationStatusStack";
import { LiveEventStream } from "@/app/components/dcc/command/LiveEventStream";
import { NetworkPulsePanel } from "@/app/components/dcc/command/NetworkPulsePanel";
import type { CommandViewPayload } from "@/lib/dcc/command/types";

const CORRIDOR_TO_DESTINATION: Record<string, string> = {
  "denver-red-rocks": "denver",
  "miami-port": "miami",
  "vegas-strip": "las-vegas",
};

const DESTINATION_TO_CORRIDOR = Object.fromEntries(
  Object.entries(CORRIDOR_TO_DESTINATION).map(([corridorId, destinationSlug]) => [destinationSlug, corridorId]),
) as Record<string, string>;

export function CommandViewShell({ data }: { data: CommandViewPayload }) {
  const [selectedCorridorId, setSelectedCorridorId] = useState<string | null>(null);
  const [selectedDestinationSlug, setSelectedDestinationSlug] = useState<string | null>(null);

  const activeSelection = useMemo(() => {
    if (selectedCorridorId) {
      return {
        corridorId: selectedCorridorId,
        destinationSlug: CORRIDOR_TO_DESTINATION[selectedCorridorId] || null,
      };
    }

    if (selectedDestinationSlug) {
      return {
        corridorId: DESTINATION_TO_CORRIDOR[selectedDestinationSlug] || null,
        destinationSlug: selectedDestinationSlug,
      };
    }

    return { corridorId: null, destinationSlug: null };
  }, [selectedCorridorId, selectedDestinationSlug]);

  useEffect(() => {
    if (!activeSelection.corridorId) return;
    const node = document.getElementById(`corridor-card-${activeSelection.corridorId}`);
    node?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeSelection.corridorId]);

  useEffect(() => {
    if (!activeSelection.destinationSlug) return;
    const node = document.getElementById(`destination-card-${activeSelection.destinationSlug}`);
    node?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeSelection.destinationSlug]);

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-12 lg:grid-cols-12">
      <div className="space-y-10 lg:col-span-8">
        <CommandEntrySurfaceGrid entries={data.entrySurfaces} />
        <CommandMapCard
          data={data.mapData}
          selectedCorridorId={activeSelection.corridorId}
          selectedDestinationSlug={activeSelection.destinationSlug}
          onSelectCorridor={(corridorId) => {
            setSelectedCorridorId(corridorId);
            setSelectedDestinationSlug(null);
          }}
          onSelectDestination={(destinationSlug) => {
            setSelectedDestinationSlug(destinationSlug);
            setSelectedCorridorId(null);
          }}
        />
        <CorridorHealthGrid corridors={data.corridors} highlightedCorridorId={activeSelection.corridorId} />
        <BestCurrentMoves moves={data.bestMoves} />
        <LiveEventStream events={data.liveStream} />
      </div>

      <div className="space-y-10 lg:col-span-4">
        <NetworkPulsePanel data={data.networkStatus} />
        <CommandAlertsRail alerts={data.alerts} />
        <DestinationStatusStack
          destinations={data.destinations}
          highlightedDestinationSlug={activeSelection.destinationSlug}
        />
      </div>
    </div>
  );
}
