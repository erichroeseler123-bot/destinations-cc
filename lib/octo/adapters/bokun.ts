import { BaseOctoAdapter } from "./base";
import { OctoClientConfig } from "./types";

export class BokunAdapter extends BaseOctoAdapter {
  constructor(config: OctoClientConfig) {
    super({
      ...config,
      platform: "bokun",
      headers: {
        "X-Bokun-Channel": "DCC-Reseller",
        ...(config.headers || {}),
      },
    });
  }
}
