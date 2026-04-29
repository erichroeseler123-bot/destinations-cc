import type { MailerBrandConfig, SatelliteContract } from "./types";

export function buildMailerBrandStub(
  contract: Pick<SatelliteContract, "brandId" | "dccBaseUrl">,
  displayName: string,
): MailerBrandConfig {
  const envSuffix = contract.brandId.replace(/[^a-z0-9]+/gi, "_").toUpperCase();

  return {
    brandId: contract.brandId,
    fromEnvKey: `MAIL_FROM_${envSuffix}`,
    replyToEnvKey: `MAIL_REPLY_TO_${envSuffix}`,
    displayName,
    baseUrl: contract.dccBaseUrl,
  };
}

export function resolveMailerBrand(
  config: MailerBrandConfig,
  env: Record<string, string | undefined>,
): { ok: true; from: string; replyTo?: string } | { ok: false; error: string } {
  const from = env[config.fromEnvKey]?.trim();
  if (!from) {
    return { ok: false, error: `Missing ${config.fromEnvKey}` };
  }

  return {
    ok: true,
    from,
    replyTo: config.replyToEnvKey ? env[config.replyToEnvKey]?.trim() || undefined : undefined,
  };
}
