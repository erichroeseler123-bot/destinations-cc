import { BaseOctoAdapter } from "./base";
import { OctoClientConfig } from "./types";

export class DirectOctoAdapter extends BaseOctoAdapter {
  constructor(config: OctoClientConfig) {
    super({
      ...config,
      platform: "direct_octo",
    });
  }
}
