"use client";

import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Pane, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import type { CommandMapDestination, CorridorMapFeature } from "@/lib/dcc/command/types";

type LeafletCommandMapProps = {
  destinations: CommandMapDestination[];
  features: CorridorMapFeature[];
  selectedCorridorId?: string | null;
  selectedDestinationSlug?: string | null;
  onSelectCorridor?: (corridorId: string) => void;
  onSelectDestination?: (destinationSlug: string) => void;
};

function statusColor(status: CorridorMapFeature["status"]) {
  switch (status) {
    case "critical":
      return "#fb7185";
    case "busy":
      return "#f59e0b";
    case "watch":
      return "#fde047";
    default:
      return "#34d399";
  }
}

function FitToNetwork({
  destinations,
  features,
}: {
  destinations: CommandMapDestination[];
  features: CorridorMapFeature[];
}) {
  const map = useMap();

  const bounds = useMemo<LatLngBoundsExpression | null>(() => {
    const points: Array<[number, number]> = [];

    for (const destination of destinations) {
      points.push([destination.lat, destination.lon]);
    }

    for (const feature of features) {
      for (const point of feature.path) {
        points.push(point);
      }
      points.push([feature.center.lat, feature.center.lon]);
    }

    return points.length > 1 ? points : null;
  }, [destinations, features]);

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [32, 32] });
    }
  }, [bounds, map]);

  return null;
}

export function LeafletCommandMap({
  destinations,
  features,
  selectedCorridorId,
  selectedDestinationSlug,
  onSelectCorridor,
  onSelectDestination,
}: LeafletCommandMapProps) {
  return (
    <MapContainer
      center={[39.5, -98.35]}
      zoom={4}
      scrollWheelZoom={false}
      className="h-full w-full"
      attributionControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      <FitToNetwork destinations={destinations} features={features} />

      <Pane name="corridors" style={{ zIndex: 350 }}>
        {features.map((feature) => {
          const color = statusColor(feature.status);
          return (
            <Polyline
              key={feature.id}
              positions={feature.path}
              eventHandlers={{
                click: () => onSelectCorridor?.(feature.id),
              }}
              pathOptions={{
                color,
                weight: selectedCorridorId === feature.id ? 8 : feature.tier === "gold" ? 6 : 4,
                opacity: selectedCorridorId === feature.id ? 1 : 0.85,
                dashArray: feature.status === "watch" ? "10 8" : undefined,
              }}
            >
              <Popup>
                <div className="space-y-2 text-[#120f0b]">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-[#8f6a23]">
                    {feature.tier === "gold" ? "Gold corridor" : "Corridor"}
                  </div>
                  <div className="text-base font-black">{feature.name}</div>
                  <div className="text-sm font-semibold capitalize">{feature.status}</div>
                  <p className="text-sm leading-5">{feature.pressureLabel}</p>
                  <p className="text-sm leading-5">{feature.bestMove}</p>
                </div>
              </Popup>
            </Polyline>
          );
        })}
      </Pane>

      <Pane name="destinations" style={{ zIndex: 400 }}>
        {destinations.map((destination) => {
          const color = statusColor(destination.status);
          return (
            <CircleMarker
              key={destination.slug}
              center={[destination.lat, destination.lon]}
              radius={selectedDestinationSlug === destination.slug ? 11 : 8}
              eventHandlers={{
                click: () => onSelectDestination?.(destination.slug),
              }}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.95,
                weight: selectedDestinationSlug === destination.slug ? 4 : 2,
              }}
            >
              <Popup>
                <div className="space-y-1 text-[#120f0b]">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-[#8f6a23]">Destination</div>
                  <div className="text-base font-black">{destination.name}</div>
                  <div className="text-sm font-semibold capitalize">{destination.status}</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </Pane>
    </MapContainer>
  );
}
