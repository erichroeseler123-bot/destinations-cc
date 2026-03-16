import { getViatorClient } from "@/lib/viator/client";

export async function getViatorRuntimeCapabilityProbe(): Promise<Record<string, string>> {
  return getViatorClient().probeCapabilities();
}
