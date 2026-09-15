import { BaseOctoAdapter } from "./base";
import { OctoClientConfig } from "./types";

export class RezdyAdapter extends BaseOctoAdapter {
  constructor(config: OctoClientConfig) {
    super({
      ...config,
      platform: "rezdy",
      headers: {
        "X-Rezdy-Integration": "DCC-Octo",
        ...(config.headers || {}),
      },
    });
  }

  protected override getAuthHeaders(idempotencyKey?: string): Record<string, string> {
    const headers = super.getAuthHeaders(idempotencyKey);
    if (this.apiKey && !this.bearerToken) {
      headers["apiKey"] = this.apiKey;
    }
    return headers;
  }
}
