import { BaseOctoAdapter } from "./base";
import { OctoClientConfig } from "./types";

export class VentrataAdapter extends BaseOctoAdapter {
  constructor(config: OctoClientConfig) {
    super({
      ...config,
      platform: "ventrata",
      headers: {
        "Octo-Capabilities": "octo/core,octo/pricing,octo/pickups,octo/content",
        ...(config.headers || {}),
      },
    });
  }

  protected override getAuthHeaders(idempotencyKey?: string): Record<string, string> {
    const headers = super.getAuthHeaders(idempotencyKey);
    // Ventrata supports Bearer or ApiKey token formats
    if (this.apiKey && !this.bearerToken) {
      headers["Authorization"] = `ApiKey ${this.apiKey}`;
      headers["X-API-Key"] = this.apiKey;
    }
    return headers;
  }
}
