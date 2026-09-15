import { OctoSupplierConnection } from "../types";
import { BaseOctoAdapter, OctoApiError } from "./base";
import { BokunAdapter } from "./bokun";
import { DirectOctoAdapter } from "./direct";
import { FareHarborAdapter } from "./fareharbor";
import { PeekAdapter } from "./peek";
import { RezdyAdapter } from "./rezdy";
import { TourCMSAdapter } from "./tourcms";
import { OctoClientConfig, OctoProviderAdapter } from "./types";
import { VentrataAdapter } from "./ventrata";
import { ZauiAdapter } from "./zaui";

export * from "./types";
export * from "./base";
export * from "./ventrata";
export * from "./bokun";
export * from "./rezdy";
export * from "./fareharbor";
export * from "./peek";
export * from "./tourcms";
export * from "./zaui";
export * from "./direct";

// Alias for backwards compatibility
export { BaseOctoAdapter as OctoAdapter };

export function createProviderAdapter(config: OctoClientConfig): OctoProviderAdapter {
  const platform = config.platform || "direct_octo";

  switch (platform) {
    case "ventrata":
      return new VentrataAdapter(config);
    case "bokun":
      return new BokunAdapter(config);
    case "rezdy":
      return new RezdyAdapter(config);
    case "fareharbor":
      return new FareHarborAdapter(config);
    case "peek":
      return new PeekAdapter(config);
    case "tourcms":
      return new TourCMSAdapter(config);
    case "zaui":
      return new ZauiAdapter(config);
    case "direct_octo":
    default:
      return new DirectOctoAdapter(config);
  }
}

export function getProviderAdapterForConnection(
  connection: OctoSupplierConnection,
  credentials?: { apiKey?: string; bearerToken?: string }
): OctoProviderAdapter {
  return createProviderAdapter({
    endpoint: connection.endpoint,
    apiKey: credentials?.apiKey,
    bearerToken: credentials?.bearerToken,
    platform: connection.reservationPlatform || "direct_octo",
    operatorSlug: connection.operatorSlug,
    isSandbox: connection.isSandbox,
  });
}
