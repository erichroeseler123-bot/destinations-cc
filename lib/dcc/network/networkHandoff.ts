import { createHmac, randomUUID, timingSafeEqual } from "crypto";

export type SuiteHandoffContext = Record<string, string | number | boolean | undefined>;

export type SuiteHandoffToken = {
  version: "dcc-suite-handoff-v1";
  handoffId: string;
  registryHandoffId: string;
  sourceSiteId: string;
  destinationSiteId: string;
  intentId?: string;
  sourcePage?: string;
  createdAt: string;
  context: Record<string, string | number | boolean>;
};

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function secret(explicit?: string) {
  const value = explicit || process.env.DCC_NETWORK_HANDOFF_SIG_SECRET || "";
  return value.trim() || null;
}

function sign(payload: string, value: string) {
  return createHmac("sha256", value).update(payload).digest("base64url");
}

export function buildSuiteHandoffToken(input: Omit<SuiteHandoffToken, "version" | "handoffId" | "createdAt" | "context"> & {
  handoffId?: string;
  createdAt?: string;
  context?: SuiteHandoffContext;
}, opts?: { signingSecret?: string }) {
  const context = Object.fromEntries(
    Object.entries(input.context || {}).filter(([, value]) => value !== undefined && value !== ""),
  ) as Record<string, string | number | boolean>;

  const token: SuiteHandoffToken = {
    version: "dcc-suite-handoff-v1",
    handoffId: input.handoffId || `ho_${randomUUID()}`,
    registryHandoffId: input.registryHandoffId,
    sourceSiteId: input.sourceSiteId,
    destinationSiteId: input.destinationSiteId,
    intentId: input.intentId,
    sourcePage: input.sourcePage,
    createdAt: input.createdAt || new Date().toISOString(),
    context,
  };

  const payload = encode(token);
  const signingSecret = secret(opts?.signingSecret);
  return {
    token,
    payload,
    signature: signingSecret ? sign(payload, signingSecret) : undefined,
  };
}

export function decodeSuiteHandoffToken(payload: string): SuiteHandoffToken {
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SuiteHandoffToken;
}

export function verifySuiteHandoffToken(payload: string, signature: string | null | undefined, opts?: { signingSecret?: string }) {
  const signingSecret = secret(opts?.signingSecret);
  if (!signingSecret || !signature) return false;
  const expected = sign(payload, signingSecret);
  const left = Buffer.from(expected);
  const right = Buffer.from(signature);
  return left.length === right.length && timingSafeEqual(left, right);
}
