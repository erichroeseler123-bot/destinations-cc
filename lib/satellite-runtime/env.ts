import type {
  SatelliteContract,
  SatelliteEnvValidationIssue,
  SatelliteEnvValidationResult,
  SatelliteEnvVar,
  SatelliteRequirementLevel,
} from "./types";

export const BASELINE_SATELLITE_ENV: SatelliteEnvVar[] = [
  {
    key: "DCC_SATELLITE_SECRET",
    level: "CRITICAL",
    description: "Shared local/dev continuity secret used to authenticate satellite telemetry to DCC.",
  },
  {
    key: "DCC_BASE_URL",
    level: "CRITICAL",
    description: "Destination Command Center origin used for control-plane API calls.",
  },
  {
    key: "SATELLITE_ID",
    level: "CRITICAL",
    description: "Stable machine id for this satellite.",
  },
  {
    key: "SATELLITE_BRAND_ID",
    level: "LOCAL_SMOKE",
    description: "Brand id used for routing mailer identity and reporting.",
  },
];

const BLOCKING_LEVELS = new Set<SatelliteRequirementLevel>(["CRITICAL", "LOCAL_SMOKE"]);

function hasValue(env: Record<string, string | undefined>, key: string): boolean {
  return Boolean(env[key]?.trim());
}

export function buildSatelliteEnvContract(contract?: Pick<SatelliteContract, "env">): SatelliteEnvVar[] {
  const seen = new Set<string>();
  return [...BASELINE_SATELLITE_ENV, ...(contract?.env || [])].filter((item) => {
    if (seen.has(item.key)) return false;
    seen.add(item.key);
    return true;
  });
}

export function validateSatelliteEnv(
  env: Record<string, string | undefined>,
  contract?: Pick<SatelliteContract, "env">,
  options: { blockProdOnly?: boolean } = {},
): SatelliteEnvValidationResult {
  const expected = buildSatelliteEnvContract(contract);
  const missing: SatelliteEnvValidationIssue[] = [];

  for (const item of expected) {
    const blocks = BLOCKING_LEVELS.has(item.level) || (options.blockProdOnly && item.level === "PROD_ONLY");
    if (blocks && !hasValue(env, item.key)) {
      missing.push(item);
    }
  }

  return {
    ok: missing.length === 0,
    missing,
    checked: expected.map((item) => item.key),
  };
}

export function assertSatelliteEnv(
  env: Record<string, string | undefined>,
  contract?: Pick<SatelliteContract, "env">,
  options?: { blockProdOnly?: boolean },
): SatelliteEnvValidationResult {
  const result = validateSatelliteEnv(env, contract, options);
  if (!result.ok) {
    const keys = result.missing.map((item) => `${item.key} (${item.level})`).join(", ");
    throw new Error(`Missing satellite environment keys: ${keys}. Check satellite-runtime README.md.`);
  }
  return result;
}
