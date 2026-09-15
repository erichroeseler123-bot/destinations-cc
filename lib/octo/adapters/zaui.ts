import { BaseOctoAdapter } from "./base";
import { OctoClientConfig } from "./types";

export class ZauiAdapter extends BaseOctoAdapter {
  constructor(config: OctoClientConfig) {
    super({
      ...config,
      platform: "zaui",
      headers: {
        "X-Zaui-Agent": "dcc-octo-standard",
        ...(config.headers || {}),
      },
    });
  }
}
