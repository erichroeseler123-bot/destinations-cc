import { buildSatelliteEnvContract } from "../env";
import { buildMailerBrandStub } from "../mailer";
import { runSatelliteSmokeTest } from "../smokeTest";
import type { SatelliteContract } from "../types";

export const gosnoSatelliteContract: SatelliteContract = {
  satelliteId: "gosno",
  brandId: "GOSNO",
  dccBaseUrl: "https://www.destinationcommandcenter.com",
  env: [
    {
      key: "GOSNO_OPS_LIST",
      level: "OPTIONAL",
      description: "Optional GoSno operations distribution list for future mission notifications.",
    },
  ],
};

export const gosnoMailerStub = buildMailerBrandStub(gosnoSatelliteContract, "GoSno");

export function getGosnoRuntimeChecklist(env: Record<string, string | undefined>) {
  return {
    envContract: buildSatelliteEnvContract(gosnoSatelliteContract),
    smokeTest: runSatelliteSmokeTest({
      contract: gosnoSatelliteContract,
      env,
    }),
    mailer: gosnoMailerStub,
  };
}
