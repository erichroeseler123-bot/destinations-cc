import athensJson from "@/data/destinations/athens.json";
import nassauJson from "@/data/destinations/nassau.json";
import registryJson from "@/data/destinations/index.json";
import romeJson from "@/data/destinations/rome.json";
import {
  DestinationRecordSchema,
  DestinationRegistrySchema,
  type DestinationRecord,
} from "@/lib/dcc/destinations/schema";

export const DESTINATION_REGISTRY = DestinationRegistrySchema.parse(registryJson);

const DESTINATION_DATA = {
  athens: DestinationRecordSchema.parse(athensJson),
  nassau: DestinationRecordSchema.parse(nassauJson),
  rome: DestinationRecordSchema.parse(romeJson),
} as const;

export type DestinationKey = keyof typeof DESTINATION_DATA;

export function listDestinationKeys(): DestinationKey[] {
  return Object.keys(DESTINATION_DATA) as DestinationKey[];
}

export function isDestinationKey(value: string): value is DestinationKey {
  return value in DESTINATION_DATA;
}

export function getDestination(slug: string): DestinationRecord | null {
  if (isDestinationKey(slug)) {
    return DESTINATION_DATA[slug];
  }

  const normalized = slug.trim().toLowerCase();
  for (const destination of Object.values(DESTINATION_DATA)) {
    if (destination.aliases.includes(normalized)) {
      return destination;
    }
  }

  return null;
}

export function getDestinationByPortGateway(portSlug: string): DestinationRecord | null {
  const normalized = portSlug.trim().toLowerCase();
  for (const destination of Object.values(DESTINATION_DATA)) {
    if (destination.port_gateways.some((gateway) => gateway.port_slug === normalized)) {
      return destination;
    }
  }

  return null;
}
