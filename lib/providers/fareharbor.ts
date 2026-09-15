import { BaseOctoAdapter } from "./base";
import { OctoClientConfig } from "./types";

export class FareHarborAdapter extends BaseOctoAdapter {
  constructor(config: OctoClientConfig) {
    super({
      ...config,
      platform: "fareharbor",
      headers: {
        "X-FareHarbor-User": "dcc-partner",
        ...(config.headers || {}),
      },
    });
  }
}
