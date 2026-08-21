import type { DestinationConfig } from "@/src/data/destination-config-schema";

export function getLiveSources(config: DestinationConfig) {
  return config.liveSources.filter((source) => source.enabled !== false);
}

export function getCapabilityMap(config: DestinationConfig) {
  return Object.fromEntries(config.capabilities.map((capability) => [capability, true]));
}
