import { BaseOctoAdapter } from "./base";
import { OctoClientConfig } from "./types";

export class TourCMSAdapter extends BaseOctoAdapter {
  constructor(config: OctoClientConfig) {
    super({
      ...config,
      platform: "tourcms",
      headers: {
        "X-TourCMS-Partner": "dcc-connectivity",
        ...(config.headers || {}),
      },
    });
  }
}
