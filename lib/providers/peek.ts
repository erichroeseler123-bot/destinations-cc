import { BaseOctoAdapter } from "./base";
import { OctoClientConfig } from "./types";

export class PeekAdapter extends BaseOctoAdapter {
  constructor(config: OctoClientConfig) {
    super({
      ...config,
      platform: "peek",
      headers: {
        "X-Peek-Client": "dcc-octo-client",
        ...(config.headers || {}),
      },
    });
  }
}
